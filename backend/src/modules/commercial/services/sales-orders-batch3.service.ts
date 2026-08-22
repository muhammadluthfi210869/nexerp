import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SOStatus } from '@prisma/client';
import { LegalityBatch3Service } from '../../legality/legality-batch3.service';
import { IdGeneratorService } from '../../system/id-generator.service';

/**
 * BATCH 3 — Sales Order operational service.
 *
 * Owns the four flows Batch 3 introduces on top of the legacy
 * SalesOrdersService (which handles generic CRUD + DP→ACTIVE interlock):
 *
 *   1. createWithFormulaPinning(input, actorId)
 *      Creates an SO with formulaId pinned (INV-09). Validates legal
 *      readiness (INV-03). Idempotent on (leadId, sampleId, formulaId)
 *      so retry/double-click does NOT spawn duplicate orders (INV-06),
 *      but a *legitimate* repeat order for the same sample with a
 *      DIFFERENT formula version is still allowed (INV-07).
 *
 *   2. commit(id, actorId)
 *      Locks the SO for downstream consumption. Sets committedAt.
 *      After commit, only amendment() can change material fields.
 *
 *   3. amend(id, dto, actorId)
 *      Captures a snapshot of the previous values, increments version,
 *      requires reason for material changes (qty, total, formulaId).
 *      Pre-commit edits use the legacy PATCH endpoint, NOT this one.
 *      Preserves history (INV-08, INV-11).
 *
 *   4. getHistory(id)
 *      Returns the amendment audit chain for SO.
 *
 * Formula version pinning (INV-09 / INV-10): SO.formulaId is immutable
 * after commit. If R&D later creates Formula V3, the committed V2-SO
 * is unaffected.
 */
@Injectable()
export class SalesOrdersBatch3Service {
  private readonly logger = new Logger(SalesOrdersBatch3Service.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private legalityBatch3: LegalityBatch3Service,
    private idGenerator: IdGeneratorService,
  ) {}

  /**
   * INV-06: idempotent on business intent (leadId + sampleId + formulaId).
   * INV-07: legitimate repeat order for the same sample but a different
   *         formula version is allowed (and returns a NEW SO row).
   */
  async createWithFormulaPinning(
    input: {
      leadId: string;
      sampleId: string;
      formulaId: string;
      quantity: number;
      totalAmount: number;
      salesCategory?: string;
      brandName?: string;
      taxId?: string;
      currencyId?: string;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        netto?: number;
        taxId?: string;
      }>;
    },
    actorId: string,
  ) {
    // 1. Validate formula exists and is not SUPERSEDED (INV-09: pin a live version).
    const formula = await this.prisma.formula.findUnique({
      where: { id: input.formulaId },
    });
    if (!formula) {
      throw new NotFoundException(`Formula ${input.formulaId} not found`);
    }
    if (formula.status === 'SUPERSEDED') {
      throw new BadRequestException(
        'FORMULA_PIN_BLOCKED: Cannot pin a SUPERSEDED formula. Use the current version.',
      );
    }
    if (formula.sampleRequestId !== input.sampleId) {
      throw new BadRequestException(
        'FORMULA_SAMPLE_MISMATCH: Formula does not belong to the given sample.',
      );
    }

    // 2. INV-03: legal gate. Throws if not eligible.
    await this.legalityBatch3.assertEligible(input.leadId, input.sampleId);

    // 3. INV-06: idempotency check. Return existing SO if same intent.
    const existing = await this.prisma.salesOrder.findFirst({
      where: {
        leadId: input.leadId,
        sampleId: input.sampleId,
        formulaId: input.formulaId,
      },
    });
    if (existing) {
      this.logger.log(
        `[SO-CREATE] idempotent — returning existing ${existing.orderNumber}`,
      );
      return { so: existing, idempotent: true };
    }

    // 4. Create with formula pinned.
    const orderNumber = await this.idGenerator.generateId('SO');
    const created = await this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          orderNumber,
          leadId: input.leadId,
          sampleId: input.sampleId,
          formulaId: input.formulaId,
          quantity: input.quantity,
          totalAmount: input.totalAmount,
          status: SOStatus.PENDING_DP,
          salesCategory: input.salesCategory,
          brandName: input.brandName,
          taxId: input.taxId,
          currencyId: input.currencyId,
          // v1 snapshot — first amendment row captures initial truth.
          amendments: {
            create: {
              version: 1,
              previousQuantity: null,
              previousTotalAmount: null,
              previousFormulaId: null,
              newQuantity: input.quantity,
              newTotalAmount: input.totalAmount,
              newFormulaId: input.formulaId,
              reason: 'INITIAL_SO_CREATION',
              changedById: actorId,
            },
          },
          items: {
            create: input.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              netto: item.netto ?? 0,
              taxId: item.taxId,
              subtotal: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
        include: { amendments: true, items: true },
      });
      return so;
    });

    this.eventEmitter.emit('sales_order.created', { salesOrderId: created.id });
    this.eventEmitter.emit('sales_order.batch3.created', {
      salesOrderId: created.id,
      formulaId: input.formulaId,
      leadId: input.leadId,
    });

    return { so: created, idempotent: false };
  }

  /**
   * INV-08 boundary. Before commit → use legacy PATCH (any field freely).
   * After commit → only amendment() can change material fields.
   */
  async commit(id: string, actorId: string) {
    const so = await this.prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    if (so.committedAt) {
      return { so, idempotent: true };
    }
    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { committedAt: new Date() },
    });
    this.logger.log(`[SO-COMMIT] ${updated.orderNumber} committed by ${actorId}`);
    this.eventEmitter.emit('sales_order.batch3.committed', {
      salesOrderId: id,
      actorId,
    });
    return { so: updated, idempotent: false };
  }

  /**
   * INV-08, INV-11. Post-commit material change. Captures full snapshot of
   * pre-change values, increments version, requires reason.
   *
   * Material fields: quantity, totalAmount, formulaId. Status transitions
   * (ACTIVE/CANCELLED) go through the legacy PATCH endpoint instead.
   *
   * If SO is NOT committed yet → reject. Caller should use PATCH instead.
   */
  async amend(
    id: string,
    dto: {
      quantity?: number;
      totalAmount?: number;
      formulaId?: string;
      reason?: string;
    },
    actorId: string,
  ) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { amendments: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    if (!so.committedAt) {
      throw new BadRequestException(
        'AMEND_BLOCKED: SO is not committed yet. Use PATCH for pre-commit edits.',
      );
    }

    const materialChange =
      dto.quantity !== undefined ||
      dto.totalAmount !== undefined ||
      dto.formulaId !== undefined;
    if (materialChange && !dto.reason) {
      throw new BadRequestException(
        'AMEND_REASON_REQUIRED: material change (quantity / totalAmount / formulaId) requires a reason.',
      );
    }

    if (dto.formulaId !== undefined && dto.formulaId !== so.formulaId) {
      const formula = await this.prisma.formula.findUnique({
        where: { id: dto.formulaId },
      });
      if (!formula) {
        throw new NotFoundException(`Formula ${dto.formulaId} not found`);
      }
      if (formula.status === 'SUPERSEDED') {
        throw new BadRequestException(
          'FORMULA_PIN_BLOCKED: Cannot amend SO to a SUPERSEDED formula.',
        );
      }
      if (formula.sampleRequestId !== so.sampleId) {
        throw new BadRequestException(
          'FORMULA_SAMPLE_MISMATCH: Formula does not belong to the SO sample.',
        );
      }
    }

    const newVersion = (so.amendments[0]?.version ?? 1) + 1;
    const updated = await this.prisma.$transaction(async (tx) => {
      const amendment = await tx.salesOrderAmendment.create({
        data: {
          salesOrderId: id,
          version: newVersion,
          previousQuantity: so.quantity,
          previousTotalAmount: so.totalAmount,
          previousFormulaId: so.formulaId,
          newQuantity: dto.quantity ?? so.quantity,
          newTotalAmount: dto.totalAmount ?? so.totalAmount,
          newFormulaId: dto.formulaId ?? so.formulaId,
          reason: dto.reason ?? 'NON_MATERIAL_AMEND',
          changedById: actorId,
        },
      });

      // Bump the SO header to current effective truth.
      // INV-10: old truth is preserved in the amendments table above.
      const header = await tx.salesOrder.update({
        where: { id },
        data: {
          version: newVersion,
          ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
          ...(dto.totalAmount !== undefined ? { totalAmount: dto.totalAmount } : {}),
          ...(dto.formulaId !== undefined ? { formulaId: dto.formulaId } : {}),
        },
      });
      return { amendment, header };
    });

    this.eventEmitter.emit('sales_order.batch3.amended', {
      salesOrderId: id,
      version: newVersion,
      actorId,
    });

    return { so: updated.header, amendment: updated.amendment };
  }

  /**
   * INV-08 / INV-11 read path. Audit chain for downstream.
   */
  async getHistory(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        amendments: { orderBy: { version: 'asc' } },
        formula: { select: { id: true, formulaCode: true, version: true } },
      },
    });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    return so;
  }

  /**
   * Batch 4 handoff contract. Returns the stable committed truth a
   * downstream Requirement/SCM system can consume.
   */
  async getHandoffContract(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        formula: { select: { id: true, formulaCode: true, version: true } },
        lead: { select: { id: true, clientName: true, brandName: true } },
        sample: { select: { id: true, sampleCode: true } },
        items: true,
        amendments: { orderBy: { version: 'asc' } },
      },
    });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    return {
      salesOrderId: so.id,
      orderNumber: so.orderNumber,
      currentVersion: so.version,
      committedAt: so.committedAt,
      status: so.status,
      customer: { id: so.lead.id, clientName: so.lead.clientName, brandName: so.lead.brandName },
      sample: { id: so.sample.id, sampleCode: so.sample.sampleCode },
      formula: so.formula
        ? { id: so.formula.id, code: so.formula.formulaCode, version: so.formula.version }
        : null,
      quantity: so.quantity,
      totalAmount: so.totalAmount,
      items: so.items,
      amendmentCount: so.amendments.length - 1, // subtract v1 initial snapshot
    };
  }
}
