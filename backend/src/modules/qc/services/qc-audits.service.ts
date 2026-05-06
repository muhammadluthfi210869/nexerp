import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateQCAuditDto } from '../dto/create-audit.dto';

@Injectable()
export class QCAuditsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private normalizeStatus(status: string): string {
    const map: Record<string, string> = {
      REJECTED: 'REJECT',
      PASSED: 'GOOD',
      PASS: 'GOOD',
      FAIL: 'REJECT',
    };
    return map[status?.toUpperCase()] || status;
  }

  async create(userId: string, dto: CreateQCAuditDto) {
    const normalizedStatus = this.normalizeStatus(dto.status);

    const result = await this.prisma.$transaction(async (tx: any) => {
      // PHASE 1: Handle Production Log Context (Mixing/Filling/Packing)
      if (dto.stepLogId) {
        const log = await tx.productionLog.findUnique({
          where: { id: dto.stepLogId },
          include: { qcAudits: true },
        });

        if (!log) throw new NotFoundException('Production log not found');

        // Logic: Move from Quarantine to Good or Reject
        const qtyToMove = Number(log.quarantineQty);

        if (qtyToMove > 0) {
          await tx.productionLog.update({
            where: { id: dto.stepLogId },
            data: {
              quarantineQty: 0,
              goodQty: normalizedStatus === 'GOOD' ? qtyToMove : 0,
              rejectQty: normalizedStatus === 'REJECT' ? qtyToMove : 0,
            },
          });
        }
      }

      // PHASE 2: Handle Incoming Material Context (Warehouse Inbound)
      if (dto.inventoryId) {
        const inventory = await tx.materialInventory.findUnique({
          where: { id: dto.inventoryId },
        });

        if (!inventory)
          throw new NotFoundException('Material inventory batch not found');

        await tx.materialInventory.update({
          where: { id: dto.inventoryId },
          data: {
            qcStatus: normalizedStatus as any,
          },
        });
      }

      // PHASE 3: Create Immutable Audit Record
      return tx.qCAudit.create({
        data: {
          stepLogId: dto.stepLogId,
          status: normalizedStatus,
          notes: dto.notes,
          qcId: userId,
          phValue: dto.ph,
          viscosityValue: dto.viscosity,
          organoleptic: dto.organoleptic === 'PASS',
          samplingVolume: dto.fillingWeight,
          sealingCheck: dto.sealingCheck === 'PASS',
        },
      });
    });

    this.eventEmitter.emit('qc.audit.created', {
      auditId: result.id,
      stepLogId: dto.stepLogId,
      inventoryId: dto.inventoryId,
      status: normalizedStatus,
      notes: dto.notes,
      loggedBy: userId,
    });

    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'QC',
      notes: `QC Audit: ${normalizedStatus} for ${dto.stepLogId ? 'production log' : 'inventory'} ${dto.stepLogId || dto.inventoryId}`,
      loggedBy: `SYSTEM:QC`,
    });

    if (normalizedStatus === 'GOOD') {
      this.eventEmitter.emit('QC_AUDIT_PASS', {
        employeeId: userId,
        referenceId: result.id,
        metadata: { stepLogId: dto.stepLogId, inventoryId: dto.inventoryId },
      });
    }

    return result;
  }

  async findAll(status?: string, type?: string) {
    const where: any = {};

    if (status) {
      where.status = this.normalizeStatus(status);
    }

    if (type === 'inbound') {
      where.stepLogId = null;
      where.inventoryId = { not: null };
    }

    const audits = await this.prisma.qCAudit.findMany({
      where,
      include: {
        stepLog: {
          include: {
            workOrder: {
              select: {
                woNumber: true,
                lead: {
                  select: {
                    brandName: true,
                    productInterest: true,
                    clientName: true,
                  },
                },
              },
            },
          },
        },
        qc: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return audits.map((a) => ({
      id: a.id,
      reportNumber: a.id.substring(0, 8).toUpperCase(),
      sourceReference: a.stepLog?.workOrder?.woNumber || null,
      material: a.stepLog?.workOrder?.lead
        ? {
            name:
              a.stepLog.workOrder.lead.productInterest ||
              a.stepLog.workOrder.lead.brandName,
          }
        : null,
      batchNumber: a.stepLog?.workOrder?.woNumber || null,
      createdAt: a.createdAt,
      status:
        a.status === 'GOOD'
          ? 'PASSED'
          : a.status === 'REJECT'
            ? 'FAILED'
            : a.status,
      analyst: a.qc ? { fullName: a.qc.fullName } : null,
      phValue: a.phValue,
      viscosityValue: a.viscosityValue,
      organoleptic: a.organoleptic,
    }));
  }
}
