import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import type { RndActorContext } from '../../rnd.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formulaTenantWhere(actor?: RndActorContext): Record<string, any> {
  const orgId = actor?.organizationId;
  if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
    return { sampleRequest: { lead: { organizationId: orgId } } };
  }
  if (actor?.enforce) {
    throw new BadRequestException({
      code: 'TENANT_UNRESOLVED',
      message: 'Tenant wajib diisi dari konteks server.',
    });
  }
  return {};
}

function refuseCrossTenant(): never {
  throw new ForbiddenException({
    code: 'TENANT_ISOLATION_VIOLATION',
    message: 'Sumber daya milik tenant lain.',
  });
}

/**
 * BUS-RULE-108: gram = round(percentage / 100 * targetYieldGram, 3).
 * Pure, so the same input yields the same gram on every run.
 */
export function gramFor(
  dosagePercentage: unknown,
  targetYieldGram: unknown,
): number {
  const grams = (Number(dosagePercentage) / 100) * Number(targetYieldGram);
  return Math.round(grams * 1000) / 1000;
}

/**
 * BUS-RULE-108: hpp per gram = Σ(percentage × costSnapshot) / 100.
 * Pure and order-independent, so repeats are byte-identical.
 */
export function costPerGramFor(
  items: ReadonlyArray<{ dosagePercentage: unknown; costSnapshot: unknown }>,
): number {
  return items.reduce(
    (acc, item) =>
      acc + (Number(item.dosagePercentage) * Number(item.costSnapshot)) / 100,
    0,
  );
}

/** BUS-RULE-108: the quantity the ±0.001 composition invariant is checked against. */
export function compositionTotal(
  items: ReadonlyArray<{ dosagePercentage: unknown }>,
): number {
  return items.reduce((sum, item) => sum + Number(item.dosagePercentage), 0);
}

@Injectable()
export class FormulaCostingService {
  constructor(private readonly prisma: PrismaService) {}

  gramFor(dosagePercentage: unknown, targetYieldGram: unknown): number {
    return gramFor(dosagePercentage, targetYieldGram);
  }

  costPerGramFor(
    items: ReadonlyArray<{ dosagePercentage: unknown; costSnapshot: unknown }>,
  ): number {
    return costPerGramFor(items);
  }

  compositionTotal(
    items: ReadonlyArray<{ dosagePercentage: unknown }>,
  ): number {
    return compositionTotal(items);
  }

  async generateInci(id: string, actor?: RndActorContext) {
    const formula = await this.prisma.formula.findFirst({
      where: { id, ...formulaTenantWhere(actor) },
      include: {
        phases: {
          include: {
            items: {
              include: { material: true },
            },
          },
        },
      },
    });

    if (!formula) {
      if (actor?.organizationId) refuseCrossTenant();
      throw new NotFoundException('Formula not found');
    }

    const allItems = formula.phases.flatMap((p) => p.items);
    const sortedItems = allItems.sort(
      (a, b) => Number(b.dosagePercentage) - Number(a.dosagePercentage),
    );

    return sortedItems.map((item) => ({
      name: item.material?.name || 'Unknown Material',
      percentage: item.dosagePercentage,
    }));
  }

  async getAdjustments(actor?: RndActorContext) {
    const logs = await this.prisma.stateTransitionLog.findMany({
      where: { entityType: 'FORMULA_ADJUSTMENT' },
      orderBy: { createdAt: 'desc' },
    });

    const formulaIds = logs
      .map((l) => l.entityId)
      .filter((id): id is string => Boolean(id) && UUID_RE.test(id));

    const formulas = await this.prisma.formula.findMany({
      where: {
        ...(formulaIds.length > 0 ? { id: { in: formulaIds } } : {}),
        ...formulaTenantWhere(actor),
      },
      include: {
        sampleRequest: {
          include: {
            lead: true,
            rnd: true,
          },
        },
      },
    });
    const formulaMap = new Map(formulas.map((f) => [f.id, f]));

    return logs.map((log, idx) => {
      const formula = formulaMap.get(log.entityId);
      const meta = (log.metadata as any) || {};
      const targetQty = Number(meta.targetProductionQtyPcs) || 5000;
      const netto = Number(meta.nettoPerPcs) || 30;
      const baseResultKg =
        Number(meta.baseResultKg) || (targetQty * netto) / 1000;
      const upscalePct = Number(meta.upscalePercent) || 10;
      const upscaleResultKg =
        Number(meta.upscaleResultKg) || baseResultKg * (1 + upscalePct / 100);

      const statusMap: Record<
        string,
        'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
      > = {
        PENDING: 'PENDING_APPROVAL',
        REQUESTED: 'PENDING_APPROVAL',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        DRAFT: 'DRAFT',
      };

      const mappedStatus = statusMap[log.toState] || 'PENDING_APPROVAL';

      return {
        id: log.id,
        adjustmentCode: `ADJ-${new Date(log.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${String(idx + 1).padStart(4, '0')}`,
        adjustmentDate: log.createdAt.toISOString().slice(0, 10),
        formulaCode:
          formula?.formulaCode || meta.formulaCode || `FORM-${log.entityId.slice(0, 8)}`,
        productName:
          formula?.sampleRequest?.productName ||
          meta.productName ||
          'Produk Kosmetik',
        revisionVersion: `v${formula?.version || 1}.0`,
        nettoPerPcs: netto,
        clientName:
          formula?.sampleRequest?.lead?.clientName ||
          meta.clientName ||
          'PT Client',
        brandName:
          formula?.sampleRequest?.lead?.brandName || meta.brandName || 'Brand',
        busdevPic: meta.busdevPic || 'BusDev PIC',
        formulatorPic:
          formula?.sampleRequest?.rnd?.fullName ||
          meta.formulatorPic ||
          'Formulator R&D',
        targetProductionQtyPcs: targetQty,
        baseResultKg,
        upscalePercent: upscalePct,
        upscaleResultKg,
        adjustmentReason:
          log.reason || meta.reason || 'Penyesuaian upscaling bejana',
        status: mappedStatus,
        statusLabel:
          mappedStatus === 'APPROVED'
            ? 'Disetujui'
            : mappedStatus === 'REJECTED'
              ? 'Ditolak'
              : 'Menunggu',
      };
    });
  }
}
