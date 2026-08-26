import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LegalApplicability, SOStatus } from '@prisma/client';
import { LegalityBatch3Service } from '../../legality/legality-batch3.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { randomUUID } from 'crypto';
import {
  eligibleDownstreamFormulaOrder,
  eligibleDownstreamFormulaWhere,
  isEligibleDownstreamFormula,
} from '../../rnd/formula-eligibility';

/**
 * BATCH 3 — Sales Order operational service (corrected).
 *
 * Operator input semantics:
 *
 *   formulaId is OPTIONAL on create. If omitted, the backend auto-resolves
 *   the currently eligible Formula from the sample's lineage — the same
 *   formula the Legalitas pipeline (if any) was pinned to. If formulaId IS
 *   provided, it must (a) exist, (b) not be SUPERSEDED, (c) belong to the
 *   given sample, and (d) match the pipeline's pinned formula when one
 *   exists. INV-09 / INV-10.
 *
 * Idempotency vs legitimate repeats:
 *
 *   - If the caller provides `idempotencyKey`, the SO is unique on
 *     (leadId, sampleId, formulaId, idempotencyKey). A retry/double-click
 *     using the same key returns the existing SO.
 *   - If the caller OMITS `idempotencyKey`, every create produces a NEW SO
 *     row. This is how a legitimate repeat order with the same formula is
 *     distinguished from a retry (INV-07). The UI generates a key per
 *     button-press so a retry on the same press is idempotent.
 *
 * Change-control (post-commit) is unchanged from the prior Batch 3 work.
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

  async createWithFormulaPinning(
    input: {
      leadId: string;
      sampleId: string;
      formulaId?: string;
      quantity: number;
      totalAmount: number;
      salesCategory?: string;
      brandName?: string;
      taxId?: string;
      currencyId?: string;
      idempotencyKey?: string;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        netto: number; // R4-BUSINESS-READY §5: required; was optional and defaulted to 0.
        taxId?: string;
      }>;
    },
    actorId: string,
  ) {
    // 0. Validate the sample exists and resolve auto-formula if needed.
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id: input.sampleId },
      include: {
        lead: { select: { id: true, clientName: true, brandName: true } },
        formulas: {
          where: eligibleDownstreamFormulaWhere(input.sampleId),
          orderBy: eligibleDownstreamFormulaOrder,
          take: 1,
        },
      },
    });
    if (!sample)
      throw new NotFoundException(`Sample ${input.sampleId} not found`);
    if (sample.leadId !== input.leadId) {
      throw new BadRequestException(
        'SO_SAMPLE_LEAD_MISMATCH: Sample does not belong to the given lead.',
      );
    }

    // 1. Resolve formulaId with the shared eligibility rule first so absence
    //    of any approved/locked Formula always fails closed with its domain
    //    error before checking downstream readiness.
    let resolvedFormulaId = input.formulaId;
    if (!resolvedFormulaId) {
      const current = sample.formulas[0];
      if (!current) {
        throw new BadRequestException(
          'FORMULA_INHERIT_FAILED: No eligible downstream Formula exists on this sample to inherit (must be PRODUCTION_LOCKED / SAMPLE_LOCKED / MINOR_COMPLIANCE_FIX / BPOM_REGISTRATION_PROCESS, non-SUPERSEDED).',
        );
      }
      resolvedFormulaId = current.id;
      this.logger.log(
        `[SO-CREATE] formula auto-inherited: sample=${sample.id} formula=${current.formulaCode}@v${current.version} status=${current.status}`,
      );
    }

    // 2. Legal gate. REQUIRED + PUBLISHED has a legally authoritative
    // Formula. Only the normal omitted-formula flow is overridden by it;
    // explicit existing change-control/repeat-order behavior is preserved.
    const readiness = await this.legalityBatch3.assertEligible(
      input.leadId,
      input.sampleId,
    );
    if (
      !input.formulaId &&
      sample.legalApplicability === LegalApplicability.REQUIRED
    ) {
      const legalFormulaIds = [
        ...new Set(readiness.pipelines.map((pipeline) => pipeline.formulaId)),
      ];
      if (legalFormulaIds.length > 1) {
        throw new BadRequestException(
          'LEGAL_FORMULA_CONSISTENCY_BLOCKED: Published legal pipelines for this sample reference different Formula versions. Resolve the legal decision before creating an SO.',
        );
      }
      if (legalFormulaIds[0]) {
        resolvedFormulaId = legalFormulaIds[0];
        this.logger.log(
          `[SO-CREATE] formula inherited from published Legalitas pipeline: sample=${sample.id} formula=${resolvedFormulaId}`,
        );
      }
    }

    // 3. Validate formula and lineage consistency.
    const formula = await this.prisma.formula.findUnique({
      where: { id: resolvedFormulaId },
    });
    if (!formula) {
      throw new NotFoundException(`Formula ${resolvedFormulaId} not found`);
    }
    if (formula.status === 'SUPERSEDED') {
      throw new BadRequestException(
        'FORMULA_PIN_BLOCKED: Cannot pin a SUPERSEDED formula. Use the current version.',
      );
    }
    if (!isEligibleDownstreamFormula(formula.status)) {
      throw new BadRequestException(
        `FORMULA_PIN_BLOCKED: Cannot pin a formula with status=${formula.status}. The SO may only pin a downstream-eligible formula (PRODUCTION_LOCKED / SAMPLE_LOCKED / MINOR_COMPLIANCE_FIX / BPOM_REGISTRATION_PROCESS).`,
      );
    }
    if (formula.sampleRequestId !== input.sampleId) {
      throw new BadRequestException(
        'FORMULA_SAMPLE_MISMATCH: Formula does not belong to the given sample.',
      );
    }

    // 3. INV-06 / INV-07: idempotency vs legitimate repeat.
    //    If the caller supplied an idempotencyKey, dedupe on the full
    //    4-tuple. Otherwise each create is a new SO.
    const idemKey = input.idempotencyKey ?? null;
    if (idemKey) {
      const existing = await this.prisma.salesOrder.findFirst({
        where: {
          leadId: input.leadId,
          sampleId: input.sampleId,
          formulaId: resolvedFormulaId,
          idempotencyKey: idemKey,
        },
      });
      if (existing) {
        this.logger.log(
          `[SO-CREATE] idempotent (key=${idemKey}) — returning existing ${existing.orderNumber}`,
        );
        return { so: existing, idempotent: true };
      }
    }

    // 4. Create with formula pinned.
    const orderNumber = await this.idGenerator.generateId('SO');
    const created = await this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          orderNumber,
          leadId: input.leadId,
          sampleId: input.sampleId,
          formulaId: resolvedFormulaId,
          quantity: input.quantity,
          totalAmount: input.totalAmount,
          status: SOStatus.PENDING_DP,
          salesCategory: input.salesCategory,
          brandName: input.brandName,
          taxId: input.taxId,
          currencyId: input.currencyId,
          idempotencyKey: idemKey,
          amendments: {
            create: {
              version: 1,
              previousQuantity: null,
              previousTotalAmount: null,
              previousFormulaId: null,
              newQuantity: input.quantity,
              newTotalAmount: input.totalAmount,
              newFormulaId: resolvedFormulaId,
              reason: 'INITIAL_SO_CREATION',
              changedById: actorId,
            },
          },
          items: {
            create: input.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              netto: item.netto,
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
      formulaId: resolvedFormulaId,
      leadId: input.leadId,
      idempotencyKey: idemKey,
    });

    return { so: created, idempotent: false };
  }

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
    this.logger.log(
      `[SO-COMMIT] ${updated.orderNumber} committed by ${actorId}`,
    );
    this.eventEmitter.emit('sales_order.batch3.committed', {
      salesOrderId: id,
      actorId,
    });
    return { so: updated, idempotent: false };
  }

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
      const header = await tx.salesOrder.update({
        where: { id },
        data: {
          version: newVersion,
          ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
          ...(dto.totalAmount !== undefined
            ? { totalAmount: dto.totalAmount }
            : {}),
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
      customer: {
        id: so.lead.id,
        clientName: so.lead.clientName,
        brandName: so.lead.brandName,
      },
      sample: { id: so.sample.id, sampleCode: so.sample.sampleCode },
      formula: so.formula
        ? {
            id: so.formula.id,
            code: so.formula.formulaCode,
            version: so.formula.version,
          }
        : null,
      quantity: so.quantity,
      totalAmount: so.totalAmount,
      items: so.items,
      amendmentCount: so.amendments.length - 1,
      // batch3 (corrected): include applicability decision that authorized this SO
      legal: {
        applicability: (so.sample as any)?.legalApplicability ?? null,
      },
    };
  }
}
