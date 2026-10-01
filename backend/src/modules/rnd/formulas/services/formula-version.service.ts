import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { CreateFormulaDto } from '../../dto/create-formula.dto';
import { UpdateFormulaV4Dto } from '../../dto/update-formula-v4.dto';
import { FormulaStatus, Prisma, RevisionStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { RndActorContext } from '../../rnd.service';
import { LegalityService } from '../../../legality/legality.service';
import { IdGeneratorService } from '../../../system/id-generator.service';
import { AuditService } from '../../../../platform/audit/audit.service';
import { OutboxService } from '../../../../platform/outbox/outbox.service';

import {
  formulaTenantWhere,
  compositionTotal,
  costPerGramFor,
} from './formula-costing.service';

/** BUS-RULE-109 reason code. */
export const FORMULA_LOCKED = 'FORMULA_LOCKED';
/** BUS-RULE-108 reason code. */
export const COMPOSITION_TOTAL_INVALID = 'COMPOSITION_TOTAL_INVALID';
/** Declared in 08_INTEGRATION_EVENT_CONTRACT.yaml `rnd_events`. */
export const EVENT_FORMULA_LOCKED = 'rnd.formulation.locked';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refuseCrossTenant(): never {
  throw new ForbiddenException({
    code: 'TENANT_ISOLATION_VIOLATION',
    message: 'Sumber daya milik tenant lain.',
  });
}

function hasTenant(actor?: RndActorContext): boolean {
  const orgId = actor?.organizationId;
  return typeof orgId === 'string' && UUID_RE.test(orgId);
}

const IMMUTABLE_STATUSES: readonly FormulaStatus[] = [
  FormulaStatus.SAMPLE_LOCKED,
  FormulaStatus.PRODUCTION_LOCKED,
  FormulaStatus.SUPERSEDED,
];

@Injectable()
export class FormulaVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legality: LegalityService,
    private readonly eventEmitter: EventEmitter2,
    private readonly idGenerator: IdGeneratorService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * BUS-RULE-109. One guard for every path that would rewrite an existing formula,
   * so a new caller cannot forget it.
   */
  private assertMutable(
    formula: { formulaCode: string; status: FormulaStatus } | null,
  ): asserts formula is { formulaCode: string; status: FormulaStatus } {
    if (!formula) throw new NotFoundException('Formula not found');
    if (IMMUTABLE_STATUSES.includes(formula.status)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Formula terkunci tidak dapat diubah (${formula.formulaCode}, status ${formula.status}). Buat revisi baru.`,
        reason_code: FORMULA_LOCKED,
      });
    }
  }

  /**
   * Fase 3a — a formula the actor's tenant cannot see must not be written to,
   * read from, or confirmed to exist.
   */
  private async assertFormulaVisible(
    id: string,
    actor?: RndActorContext,
  ): Promise<void> {
    const scoped = formulaTenantWhere(actor);
    const own = await this.prisma.formula.findFirst({
      where: { id, ...scoped },
      select: { id: true },
    });
    if (!own && hasTenant(actor)) refuseCrossTenant();
    if (!own) throw new NotFoundException('Formula not found');
  }

  private async generateFormulaCode(client?: Prisma.TransactionClient): Promise<string> {
    const db = client ?? this.prisma;
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `F-${year}${month}-`;

    const lastFormula = await db.formula.findFirst({
      where: { formulaCode: { startsWith: prefix } },
      orderBy: { formulaCode: 'desc' },
    });

    let seq = 1;
    if (lastFormula) {
      const parts = lastFormula.formulaCode.split('-');
      const lastSeq = parseInt(parts[2]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  async create(createFormulaDto: CreateFormulaDto, actor?: RndActorContext) {
    const { items, ...formulaData } = createFormulaDto;

    const orgId = actor?.organizationId as string;
    if (hasTenant(actor)) {
      const parent = await this.prisma.sampleRequest.findFirst({
        where: { id: formulaData.sampleRequestId, lead: { organizationId: orgId } },
        select: { id: true },
      });
      if (!parent) refuseCrossTenant();
    }

    const formulaCode = await this.generateFormulaCode();

    const totalDosage = compositionTotal(items);
    const tolerance = 0.001;
    if (Math.abs(totalDosage - 100) > tolerance) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Total komposisi harus 100%. Saat ini: ${totalDosage.toFixed(2)}%`,
        reason_code: COMPOSITION_TOTAL_INVALID,
      });
    }

    const costPerGram = costPerGramFor(items);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const formula = await tx.formula.create({
        data: {
          formulaCode: formulaCode,
          sampleRequestId: formulaData.sampleRequestId,
          targetYieldGram: formulaData.totalWeightGr || 1000,
          status: 'DRAFT',
          version: 1,
          phases: {
            create: {
              prefix: 'A',
              customName: 'General Phase',
              order: 1,
              items: {
                createMany: {
                  data: items.map((item) => ({
                    materialId: item.materialId,
                    dosagePercentage: item.dosagePercentage,
                    costSnapshot: item.costSnapshot || 0,
                  })),
                },
              },
            },
          },
        },
      });

      const sample = await tx.sampleRequest.findUnique({
        where: { id: formula.sampleRequestId },
        include: { lead: true, npf: true },
      });

      if (sample && sample.lead) {
        const soNumber = await this.idGenerator.generateId('SO');
        const invNumber = await this.idGenerator.generateId('INV');
        await tx.salesOrder.create({
          data: {
            orderNumber: soNumber,
            sampleId: sample.id,
            leadId: sample.leadId,
            totalAmount: Number(sample.npf?.targetPrice || 0) * 15000,
            status: 'PENDING_DP',
            invoices: {
              create: {
                invoiceNumber: invNumber,
                category: 'RECEIVABLE',
                type: 'DP',
                amountDue: Number(sample.npf?.targetPrice || 0) * 5000,
                outstandingAmount: Number(sample.npf?.targetPrice || 0) * 5000,
                status: 'UNPAID',
                dueDate: new Date(),
              },
            },
          },
        });
      }

      return {
        ...formula,
        costPerGram: costPerGram,
        totalEstimateCost: costPerGram * createFormulaDto.totalWeightGr,
      };
    });
  }

  async getFormulaDetails(
    id: string,
    client?: Prisma.TransactionClient,
    actor?: RndActorContext,
  ) {
    const db = client ?? this.prisma;
    const scoped = formulaTenantWhere(actor);
    const formula = await db.formula.findFirst({
      where: { id, ...scoped },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              include: { material: true },
            },
          },
        },
        qcparameter: true,
        sampleRequest: {
          include: {
            lead: true,
            pic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!formula && actor?.organizationId) refuseCrossTenant();
    return formula;
  }

  async updateFormulaV4(
    id: string,
    dto: UpdateFormulaV4Dto,
    actorId?: string,
    actor?: RndActorContext,
  ) {
    const existing = await this.prisma.formula.findFirst({
      where: { id, ...formulaTenantWhere(actor) },
      select: { formulaCode: true, status: true },
    });
    if (!existing && actor?.organizationId) refuseCrossTenant();
    this.assertMutable(existing);

    const totalDosage = compositionTotal(dto.phases.flatMap((p) => p.items));
    const tolerance = 0.001;
    if (Math.abs(totalDosage - 100) > tolerance) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Total komposisi harus 100%. Saat ini: ${totalDosage.toFixed(2)}%`,
        reason_code: COMPOSITION_TOTAL_INVALID,
      });
    }

    const write = async (tx: any) => {
      await tx.formula.update({
        where: { id },
        data: {
          targetYieldGram: dto.targetYieldGram,
        },
      });

      if (dto.qcParameters) {
        await tx.qCParameter.upsert({
          where: { formulaId: id },
          create: {
            formulaId: id,
            ...dto.qcParameters,
          },
          update: {
            ...dto.qcParameters,
          },
        });
      }

      await tx.formulaItem.deleteMany({
        where: { phase: { formulaId: id } },
      });
      await tx.formulaPhase.deleteMany({
        where: { formulaId: id },
      });

      for (const phaseDto of dto.phases) {
        const phase = await tx.formulaPhase.create({
          data: {
            formulaId: id,
            prefix: phaseDto.prefix,
            customName: phaseDto.customName,
            instructions: phaseDto.instructions,
            order: phaseDto.order,
          },
        });

        if (phaseDto.items.length > 0) {
          await tx.formulaItem.createMany({
            data: phaseDto.items.map((item) => ({
              phaseId: phase.id,
              materialId: item.materialId,
              dosagePercentage: item.dosagePercentage,
              costSnapshot: item.costSnapshot,
            })),
          });
        }
      }

      return this.getFormulaDetails(id, tx);
    };

    return this.prisma.$transaction((tx) =>
      this.audit.withAudit<any>(
        tx,
        {
          actorUserId: actorId,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: id,
          action: 'UPDATE_FORMULA_COMPOSITION',
          beforeSnapshot: { status: existing.status },
          afterSnapshot: {
            formula_code: existing.formulaCode,
            target_yield_gram: Number(dto.targetYieldGram),
            composition_total_percent: totalDosage,
          },
        },
        write,
      ),
    );
  }

  async createRevision(id: string, actorId?: string, actor?: RndActorContext) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.formula.findFirst({
        where: { id, ...formulaTenantWhere(actor) },
        include: {
          phases: {
            include: { items: true },
          },
          qcparameter: true,
        },
      });

      if (!source) {
        if (hasTenant(actor)) refuseCrossTenant();
        throw new NotFoundException('Source formula not found');
      }

      // 1. Mark previous versions as SUPERSEDED
      await tx.formula.updateMany({
        where: {
          sampleRequestId: source.sampleRequestId,
          status: { not: 'SUPERSEDED' },
        },
        data: { status: 'SUPERSEDED' },
      });

      // 2. Get next version number
      const latest = await tx.formula.findFirst({
        where: { sampleRequestId: source.sampleRequestId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latest?.version || 1) + 1;

      // 3. Generate New Code
      const newCode = await this.generateFormulaCode(tx);

      // 4. Create New Formula (Copy of source)
      const revision = await tx.formula.create({
        data: {
          formulaCode: newCode,
          sampleRequestId: source.sampleRequestId,
          targetYieldGram: source.targetYieldGram,
          version: nextVersion,
          status: 'DRAFT',
          qcparameter: source.qcparameter
            ? {
                create: {
                  targetPh: source.qcparameter.targetPh,
                  targetViscosity: source.qcparameter.targetViscosity,
                  targetColor: source.qcparameter.targetColor,
                  targetAroma: source.qcparameter.targetAroma,
                  appearance: source.qcparameter.appearance,
                },
              }
            : undefined,
        },
      });

      // 5. Copy Phases and Items
      for (const phase of source.phases) {
        const newPhase = await tx.formulaPhase.create({
          data: {
            formulaId: revision.id,
            prefix: phase.prefix,
            customName: phase.customName,
            instructions: phase.instructions,
            order: phase.order,
          },
        });

        if (phase.items.length > 0) {
          await tx.formulaItem.createMany({
            data: phase.items.map((item) => ({
              phaseId: newPhase.id,
              materialId: item.materialId,
              dosagePercentage: item.dosagePercentage,
              costSnapshot: item.costSnapshot,
            })),
          });
        }
      }

      // Set Sample Request Revision Status to IN_PROGRESS
      await tx.sampleRequest.update({
        where: { id: source.sampleRequestId },
        data: {
          revisionStatus: RevisionStatus.IN_PROGRESS,
          latestRevisionDate: new Date(),
          revisionCount: { increment: 1 },
        },
      });

      this.eventEmitter.emit('state.transition', {
        entityType: 'FORMULA',
        entityId: revision.id,
        fromState: null,
        toState: 'DRAFT',
        reason: 'Formula revision created',
      });

      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: actorId,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: revision.id,
          action: 'CREATE_FORMULA_REVISION',
          beforeSnapshot: {
            parent_formula_id: source.id,
            parent_formula_code: source.formulaCode,
            parent_version: source.version,
            parent_status: source.status,
          },
          afterSnapshot: {
            revision_id: revision.id,
            revision_code: revision.formulaCode,
            revision_version: revision.version,
          },
        },
        async () => revision,
      );

      return revision;
    });
  }

  async requestApproval(id: string, actorId?: string, actor?: RndActorContext) {
    const existing = await this.prisma.formula.findFirst({
      where: { id, ...formulaTenantWhere(actor) },
      select: { formulaCode: true, status: true },
    });
    if (!existing && hasTenant(actor)) refuseCrossTenant();
    this.assertMutable(existing);

    const updated = await this.prisma.$transaction((tx) =>
      this.audit.withAudit<any>(
        tx,
        {
          actorUserId: actorId ?? null,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: id,
          action: 'SUBMIT_FORMULA_APPROVAL',
          beforeSnapshot: { status: existing.status },
          afterSnapshot: { status: FormulaStatus.WAITING_APPROVAL, submitted_by: actorId ?? null },
        },
        async () =>
          tx.formula.update({
            where: { id },
            data: { status: 'WAITING_APPROVAL' },
          }),
      ),
    );

    this.eventEmitter.emit('state.transition', {
      entityType: 'FORMULA',
      entityId: id,
      fromState: existing.status,
      toState: 'WAITING_APPROVAL',
      changedById: actorId ?? null,
      reason: 'Formula submitted for approval',
    });

    return updated;
  }

  async approveFormula(id: string, userId: string, actor?: RndActorContext) {
    const existing = await this.prisma.formula.findFirst({
      where: { id, ...formulaTenantWhere(actor) },
      select: { status: true, formulaCode: true },
    });
    if (!existing && hasTenant(actor)) refuseCrossTenant();
    if (!existing) throw new NotFoundException('Formula not found');
    if (existing.status === FormulaStatus.SAMPLE_LOCKED) {
      return this.prisma.formula.findUniqueOrThrow({ where: { id } });
    }

    const formula = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.formula.update({
        where: { id },
        data: {
          status: 'SAMPLE_LOCKED',
          lockedById: userId,
        },
      });

      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: userId,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: id,
          action: 'APPROVE_FORMULA',
          beforeSnapshot: { status: existing.status },
          afterSnapshot: { status: updated.status, locked_by: userId },
        },
        async () => updated,
      );

      await this.outbox.enqueue(
        tx,
        {
          eventType: EVENT_FORMULA_LOCKED,
          aggregateType: 'Formula',
          aggregateId: id,
          payload: {
            formulation_id: id,
            locked_by: userId,
            locked_at: new Date().toISOString(),
          },
          correlationId: id,
        },
        { requireExternalTransaction: true },
      );

      return updated;
    });

    this.eventEmitter.emit('FORMULA_APPROVED_FIRST_TRY', {
      employeeId: userId,
      referenceId: id,
      metadata: { formulaCode: formula.formulaCode, status: formula.status },
    });

    return formula;
  }

  async lockProduction(id: string, userId: string, actor?: RndActorContext) {
    const formula = await this.prisma.formula.findFirst({
      where: { id, ...formulaTenantWhere(actor) },
      include: { phases: { include: { items: true } } },
    });

    if (!formula) {
      if (hasTenant(actor)) refuseCrossTenant();
      throw new NotFoundException('Formula not found');
    }

    const items = formula.phases.flatMap((p) => p.items);
    if (items.some((i) => !i.materialId)) {
      throw new BadRequestException(
        'Cannot lock for production: Formula contains items without linked SCM Materials.',
      );
    }

    const validation = await this.legality.validateFormula(id);
    if (!validation.canProceed) {
      throw new ForbiddenException({
        message:
          'REGULATORY REJECT: Formula contains prohibited ingredients or dangerous concentrations.',
        violations: validation.violations,
      });
    }

    if (validation.riskScore === 'HIGH' || validation.riskScore === 'MEDIUM') {
      if (validation.riskScore === 'HIGH') {
        throw new ForbiddenException(
          'REGULATORY ALERT: High risk detected. Minor compliance fix required before production locking.',
        );
      }
    }

    if (formula.status === FormulaStatus.PRODUCTION_LOCKED) {
      return formula;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.formula.update({
        where: { id },
        data: {
          status: 'PRODUCTION_LOCKED',
          lockedById: userId,
        },
      });

      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: userId,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: id,
          action: 'LOCK_FORMULA_PRODUCTION',
          beforeSnapshot: { status: formula.status },
          afterSnapshot: { status: row.status, locked_by: userId },
        },
        async () => row,
      );

      await this.outbox.enqueue(
        tx,
        {
          eventType: EVENT_FORMULA_LOCKED,
          aggregateType: 'Formula',
          aggregateId: id,
          payload: {
            formulation_id: id,
            locked_by: userId,
            locked_at: new Date().toISOString(),
          },
          correlationId: id,
        },
        { requireExternalTransaction: true },
      );

      return row;
    });

    this.eventEmitter.emit('state.transition', {
      entityType: 'FORMULA',
      entityId: id,
      toState: 'PRODUCTION_LOCKED',
      changedById: userId,
      reason: 'Formula locked for production after regulatory validation',
    });

    return updated;
  }

  async recordLabTest(formulaId: string, data: any, actor?: RndActorContext) {
    await this.assertFormulaVisible(formulaId, actor);
    return this.prisma.labTestResult.create({
      data: {
        formulaId,
        ...data,
      },
    });
  }

  async getLabTests(formulaId: string, actor?: RndActorContext) {
    await this.assertFormulaVisible(formulaId, actor);
    return this.prisma.labTestResult.findMany({
      where: { formulaId },
      orderBy: { testDate: 'desc' },
      include: { tester: { select: { fullName: true } } },
    });
  }

  async findAll(status?: string, actor?: RndActorContext) {
    const scoped = formulaTenantWhere(actor);
    const where = status ? { ...scoped, status: status as any } : scoped;
    return this.prisma.formula.findMany({
      where,
      include: {
        sampleRequest: { select: { sampleCode: true, productName: true } },
        lockedBy: { select: { fullName: true } },
        labTestResults: { select: { stability40C: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
