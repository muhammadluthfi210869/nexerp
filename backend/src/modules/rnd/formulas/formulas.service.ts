import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateFormulaDto } from '../dto/create-formula.dto';
import { UpdateFormulaV4Dto } from '../dto/update-formula-v4.dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LegalityService } from '../../legality/legality.service';
import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class FormulasService {
  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  private async generateFormulaCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `F-${year}${month}-`;

    const lastFormula = await this.prisma.formula.findFirst({
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

    // 1. [HARDENING: FORMULA VALIDATION]
    const totalDosage = items.reduce(
      (sum, item) => sum + Number(item.dosagePercentage),
      0,
    );
    const tolerance = 0.001;
    if (Math.abs(totalDosage - 100) > tolerance) {
      throw new BadRequestException(
        `Formula Validation Error: Total dosage must be exactly 100%. Current: ${totalDosage}%`,
      );
    }

    // 2. [HPP CALCULATION LOGIC]
    const costPerGram = items.reduce((acc, item) => {
      return (
        acc + (Number(item.dosagePercentage) * Number(item.costSnapshot)) / 100
      );
    }, 0);

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

  async getFormulaDetails(id: string) {
    return this.prisma.formula.findUnique({
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
        qcParameters: true,
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

  async updateFormulaV4(id: string, dto: UpdateFormulaV4Dto) {
    // 1. [Hukum Mutlak 100%]
    let totalDosage = 0;
    dto.phases.forEach((phase) => {
      phase.items.forEach((item) => {
        totalDosage += Number(item.dosagePercentage);
      });
    });

    const tolerance = 0.001;
    if (Math.abs(totalDosage - 100) > tolerance) {
      throw new BadRequestException(
        `Formula Validation Error: Total dosage must be exactly 100.00%. Current: ${totalDosage.toFixed(2)}%`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
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

      return this.getFormulaDetails(id);
    });
  }

  async createRevision(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.formula.findUnique({
        where: { id },
        include: {
          phases: {
            include: { items: true },
          },
          qcParameters: true,
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
      const newCode = await this.generateFormulaCode();

      // 4. Create New Formula (Copy of source)
      const revision = await tx.formula.create({
        data: {
          formulaCode: newCode,
          sampleRequestId: source.sampleRequestId,
          targetYieldGram: source.targetYieldGram,
          version: nextVersion,
          status: 'DRAFT',
          qcParameters: source.qcParameters
            ? {
                create: {
                  targetPh: source.qcParameters.targetPh,
                  targetViscosity: source.qcParameters.targetViscosity,
                  targetColor: source.qcParameters.targetColor,
                  targetAroma: source.qcParameters.targetAroma,
                  appearance: source.qcParameters.appearance,
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

      this.eventEmitter.emit('state.transition', {
        entityType: 'FORMULA',
        entityId: revision.id,
        fromState: null,
        toState: 'DRAFT',
        reason: 'Formula revision created',
      });

      return revision;
    });
  }

  async requestApproval(id: string) {
    const updated = await this.prisma.formula.update({
      where: { id },
      data: { status: 'WAITING_APPROVAL' },
    });

    this.eventEmitter.emit('state.transition', {
      entityType: 'FORMULA',
      entityId: id,
      fromState: 'DRAFT',
      toState: 'WAITING_APPROVAL',
      reason: 'Formula submitted for approval',
    });

    return updated;
  }

  async approveFormula(id: string, userId: string) {
    const formula = await this.prisma.formula.update({
      where: { id },
      data: {
        status: 'SAMPLE_LOCKED',
        lockedById: userId,
      },
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

    const updated = await this.prisma.formula.update({
      where: { id },
      data: {
        status: 'PRODUCTION_LOCKED',
        lockedById: userId,
      },
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
