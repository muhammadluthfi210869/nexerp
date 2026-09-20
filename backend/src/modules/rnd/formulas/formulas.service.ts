import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateFormulaDto } from '../dto/create-formula.dto';
import { UpdateFormulaV4Dto } from '../dto/update-formula-v4.dto';
import { FormulaStatus, Prisma, RevisionStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LegalityService } from '../../legality/legality.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { AuditService } from '../../../platform/audit/audit.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';

/** BUS-RULE-109 reason code. */
export const FORMULA_LOCKED = 'FORMULA_LOCKED';
/** BUS-RULE-108 reason code. */
export const COMPOSITION_TOTAL_INVALID = 'COMPOSITION_TOTAL_INVALID';
/** Declared in 08_INTEGRATION_EVENT_CONTRACT.yaml `rnd_events`. */
export const EVENT_FORMULA_LOCKED = 'rnd.formulation.locked';

/**
 * BUS-RULE-109 / 02_DATA_OWNERSHIP.yaml:1253 (`condition: formulation.status in
 * {DRAFT, SUBMITTED} # not LOCKED`): only a draft-family formula accepts edits.
 * SUPERSEDED is in the set because a superseded revision is frozen history — the
 * sanctioned way to change one is a new revision (BUS-RULE-114), which never
 * rewrites its parent.
 */
const IMMUTABLE_STATUSES: readonly FormulaStatus[] = [
  FormulaStatus.SAMPLE_LOCKED,
  FormulaStatus.PRODUCTION_LOCKED,
  FormulaStatus.SUPERSEDED,
];

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
export class FormulasService {
  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private audit: AuditService,
    private outbox: OutboxService,
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

  async create(createFormulaDto: CreateFormulaDto) {
    const { items, ...formulaData } = createFormulaDto;

    const formulaCode = await this.generateFormulaCode();

    // 1. [HARDENING: FORMULA VALIDATION] — BUS-RULE-108, one shared implementation
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

    // 2. [HPP CALCULATION LOGIC] — BUS-RULE-108, reproducible
    const costPerGram = costPerGramFor(items);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Formula with a default Phase A
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

      // 3. [GOLDEN PATH BRIDGE]
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

  /**
   * `client` exists so a caller inside a transaction reads its own uncommitted
   * rows. Reading through `this.prisma` from inside an open transaction blocks on
   * the row locks that same transaction holds.
   */
  async getFormulaDetails(id: string, client?: Prisma.TransactionClient) {
    const db = client ?? this.prisma;
    return db.formula.findUnique({
      where: { id },
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
  }

  async updateFormulaV4(id: string, dto: UpdateFormulaV4Dto, actorId?: string) {
    // 0. [BUS-RULE-109] a locked or superseded formula rejects every mutation.
    // Rework goes through createRevision (BUS-RULE-114), never through a rewrite.
    const existing = await this.prisma.formula.findUnique({
      where: { id },
      select: { formulaCode: true, status: true },
    });
    this.assertMutable(existing);

    // 1. [Hukum Mutlak 100%] — BUS-RULE-108
    const totalDosage = compositionTotal(dto.phases.flatMap((p) => p.items));

    // NOTE (P08): the comparison runs on the binary-double sum, so a legally exact
    // ±0.001 deviation is refused — 20 + 79.999 and 20 + 80.001 both store a value
    // 0.0010000000000048 from 100. Rounding the deviation before comparing would
    // accept both, but the frozen sf3 suite pins 80.001 as COMPOSITION_TOTAL_INVALID,
    // so the semantics stay as they are and the edge is recorded, not redefined.
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
      // A. Update Formula Header
      await tx.formula.update({
        where: { id },
        data: {
          targetYieldGram: dto.targetYieldGram,
        },
      });

      // B. Update QC Parameters
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

      // C. Sync Phases & Items (Delete & Recreate for simplicity and consistency)
      // First, delete old items and phases
      await tx.formulaItem.deleteMany({
        where: { phase: { formulaId: id } },
      });
      await tx.formulaPhase.deleteMany({
        where: { formulaId: id },
      });

      // Recreate Phases and Items
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

    // BUS-RULE-113: the composition write and its audit row are one transaction.
    return this.prisma.$transaction((tx) =>
      this.audit.withAudit<any>(
        tx,
        {
          actorUserId: actorId,
          source: 'rnd.formulas',
          entityType: 'Formula',
          entityId: id,
          action: 'UPDATE_FORMULA_COMPOSITION',
          beforeSnapshot: { status: existing!.status },
          afterSnapshot: {
            formula_code: existing!.formulaCode,
            target_yield_gram: Number(dto.targetYieldGram),
            composition_total_percent: totalDosage,
          },
        },
        write,
      ),
    );
  }

  /**
   * BUS-RULE-114 — rework/adjustment lineage. The parent row is NEVER rewritten:
   * its version, target yield and item rows are copied, not touched, and only its
   * status flag is flipped to SUPERSEDED (03_WORKFLOW_STATE_MACHINE.yaml
   * `old_formulation.marked_superseded`). Revising a locked parent is allowed —
   * it is the only sanctioned way to change one (BUS-RULE-109).
   */
  async createRevision(id: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.formula.findUnique({
        where: { id },
        include: {
          phases: {
            include: { items: true },
          },
          qcparameter: true,
        },
      });

      if (!source) throw new NotFoundException('Source formula not found');

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

      // BUS-RULE-113: the lineage write commits with its audit row in one tx.
      // The parent's version and item rows are recorded unchanged as the proof.
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

  /**
   * Submit a draft for approval.
   *
   * [BUS-RULE-109] This is a mutation of the formula row, so it goes through the
   * same immutability guard as every other mutation: without it, submitting a
   * SAMPLE_LOCKED formula walked the row back to WAITING_APPROVAL and reopened
   * the edit path that `assertMutable` exists to close.
   *
   * [BUS-RULE-113] The submit is recorded with the acting user, exactly like the
   * approve and lock transitions.
   */
  async requestApproval(id: string, actorId?: string) {
    const existing = await this.prisma.formula.findUnique({
      where: { id },
      select: { formulaCode: true, status: true },
    });
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
          beforeSnapshot: { status: existing!.status },
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
      fromState: existing!.status,
      toState: 'WAITING_APPROVAL',
      changedById: actorId ?? null,
      reason: 'Formula submitted for approval',
    });

    return updated;
  }

  async approveFormula(id: string, userId: string) {
    const existing = await this.prisma.formula.findUnique({
      where: { id },
      select: { status: true, formulaCode: true },
    });
    if (!existing) throw new NotFoundException('Formula not found');
    // A formula already at or past this lock is returned untouched: re-approving
    // must not mint a second lock effect (BUS-RULE-113 "exactly once").
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

      // BUS-RULE-113: lock + audit + the declared `rnd.formulation.locked` event
      // commit together, or none of them do.
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

  async lockProduction(id: string, userId: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
      include: { phases: { include: { items: true } } },
    });

    if (!formula) throw new NotFoundException('Formula not found');

    // Production Gate: Materials must exist and be valid
    const items = formula.phases.flatMap((p) => p.items);
    if (items.some((i) => !i.materialId)) {
      throw new BadRequestException(
        'Cannot lock for production: Formula contains items without linked SCM Materials.',
      );
    }

    // BPOM REGULATORY GATE
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

    // Already production-locked: no second lock effect.
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

  async recordLabTest(formulaId: string, data: any) {
    return this.prisma.labTestResult.create({
      data: {
        formulaId,
        ...data,
      },
    });
  }

  async getLabTests(formulaId: string) {
    return this.prisma.labTestResult.findMany({
      where: { formulaId },
      orderBy: { testDate: 'desc' },
      include: { tester: { select: { fullName: true } } },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
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

  async generateInci(id: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
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

    if (!formula) throw new NotFoundException('Formula not found');

    const allItems = formula.phases.flatMap((p) => p.items);
    const sortedItems = allItems.sort(
      (a, b) => Number(b.dosagePercentage) - Number(a.dosagePercentage),
    );

    return sortedItems.map((item) => ({
      name: item.material?.name || 'Unknown Material',
      percentage: item.dosagePercentage,
    }));
  }
}
