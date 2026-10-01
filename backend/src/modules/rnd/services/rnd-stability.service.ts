import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export interface RndActorContext {
  userId?: string;
  organizationId?: string;
  roles?: string[];
  enforce?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class RndStabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveTenant(actor: RndActorContext | undefined): string {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) return orgId;
    throw new BadRequestException({
      code: 'TENANT_UNRESOLVED',
      message: 'Tenant wajib diisi dari konteks server.',
    });
  }

  private scopeWhere(actor: RndActorContext | undefined): Record<string, any> {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
      return { lead: { organizationId: orgId } };
    }
    if (actor?.enforce) this.resolveTenant(actor);
    return {};
  }

  private assertTenantResolved(actor: RndActorContext | undefined): void {
    if (actor?.enforce) this.resolveTenant(actor);
  }

  private tenantWhere(organizationId: string) {
    return { lead: { organizationId } };
  }

  private scopeWhereAt(
    actor: RndActorContext | undefined,
    root: 'sampleRequest' | 'formula',
  ): Record<string, any> {
    const lead = this.scopeWhere(actor);
    if (Object.keys(lead).length === 0) return {};
    return root === 'sampleRequest'
      ? { sampleRequest: lead }
      : { formula: { sampleRequest: lead } };
  }

  private refuseCrossTenant(): never {
    throw new ForbiddenException({
      code: 'TENANT_ISOLATION_VIOLATION',
      message: 'Tenant isolation violation',
    });
  }

  private async assertFormulaInTenant(
    tx: any,
    formula: { id: string } | null,
    actor: RndActorContext | undefined,
  ) {
    if (!formula) throw new NotFoundException('Formula not found');
    const orgId = actor?.organizationId;
    if (!(typeof orgId === 'string' && UUID_RE.test(orgId))) {
      this.assertTenantResolved(actor);
      return;
    }
    const owned = await tx.formula.findFirst({
      where: { id: formula.id, sampleRequest: this.tenantWhere(orgId) },
      select: { id: true },
    });
    if (!owned) this.refuseCrossTenant();
  }

  async getLabTestResults(formulaId: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    await this.assertFormulaInTenant(this.prisma, { id: formulaId }, actor);
    return this.prisma.labTestResult.findMany({
      where: { formulaId, ...this.scopeWhereAt(actor, 'formula') },
      include: { tester: { select: { fullName: true } } },
      orderBy: { testDate: 'desc' },
    });
  }

  async createLabTestResult(
    dto: {
      formulaId: string;
      testerId: string;
      actualPh?: string;
      actualViscosity?: string;
      actualDensity?: string;
      colorResult?: string;
      aromaResult?: string;
      textureResult?: string;
      stability40C?: string;
      stabilityRT?: string;
      stability4C?: string;
      notes?: string;
    },
    actor?: RndActorContext,
  ) {
    this.assertTenantResolved(actor);
    await this.assertFormulaInTenant(this.prisma, { id: dto.formulaId }, actor);
    return this.prisma.labTestResult.create({
      data: {
        formulaId: dto.formulaId,
        testerId: dto.testerId,
        actualPh: dto.actualPh,
        actualViscosity: dto.actualViscosity,
        actualDensity: dto.actualDensity,
        colorResult: dto.colorResult,
        aromaResult: dto.aromaResult,
        textureResult: dto.textureResult,
        stability40C: dto.stability40C,
        stabilityRT: dto.stabilityRT,
        stability4C: dto.stability4C,
        notes: dto.notes,
      },
    });
  }

  async setQcParameters(
    formulaId: string,
    dto: {
      targetPh?: string;
      targetViscosity?: string;
      targetColor?: string;
      targetAroma?: string;
      appearance?: string;
    },
    actor?: RndActorContext,
  ) {
    const formula = await this.prisma.formula.findUnique({
      where: { id: formulaId },
    });

    if (!formula) throw new NotFoundException('Formula not found');
    await this.assertFormulaInTenant(this.prisma, formula, actor);

    return this.prisma.qCParameter.upsert({
      where: { formulaId },
      update: {
        targetPh: dto.targetPh,
        targetViscosity: dto.targetViscosity,
        targetColor: dto.targetColor,
        targetAroma: dto.targetAroma,
        appearance: dto.appearance,
      },
      create: {
        formulaId,
        targetPh: dto.targetPh,
        targetViscosity: dto.targetViscosity,
        targetColor: dto.targetColor,
        targetAroma: dto.targetAroma,
        appearance: dto.appearance,
      },
    });
  }

  async getAllLabTestResults(type?: string, actor?: RndActorContext) {
    const where: any = this.scopeWhereAt(actor, 'formula');
    if (type === 'stability') {
      where.stability40C = { not: null };
    }
    return this.prisma.labTestResult
      .findMany({
        where,
        include: {
          formula: {
            select: {
              formulaCode: true,
              sampleRequest: {
                select: { productName: true, sampleCode: true },
              },
            },
          },
          tester: { select: { fullName: true } },
        },
        orderBy: { testDate: 'desc' },
      })
      .then((results) =>
        results.map((r) => ({
          ...r,
          formula: r.formula
            ? {
                name:
                  r.formula.sampleRequest?.productName || r.formula.formulaCode,
                sampleRequest: r.formula.sampleRequest,
              }
            : null,
        })),
      );
  }
}
