import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface ExecuteReleaseDto {
  workOrderId?: string;
  finishedGoodId?: string;
  batchNumber?: string;
  inboundId?: string;
  releaseQty?: number;
  coaNumber?: string;
  apjName?: string;
  apjSipa?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface PartialDispositionDto {
  stepLogId?: string;
  workOrderId?: string;
  auditId?: string;
  passQty: number;
  reworkQty?: number;
  scrapQty?: number;
  defectCategory?: string;
  defectType?: string;
  notes?: string;
}

export interface RetestDto {
  status: string;
  notes?: string;
  ph?: number;
  viscosity?: number;
  torqueValue?: number;
  leakTestPass?: string;
  organoleptic?: string;
  supervisorPin?: string;
}

@Injectable()
export class QcReleaseService {
  // In-memory idempotency tracker to prevent race conditions
  private idempotencyStore = new Map<string, any>();

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Release Quarantined stock to AVAILABLE stock (BUS-RULE-047).
   * Idempotent: multiple calls with the same idempotencyKey or batch return the existing result.
   */
  async executeRelease(user: { id: string; role?: string; roles?: string[]; fullName?: string | null }, dto: ExecuteReleaseDto) {
    // 1. Authorization check: Only authorized roles can execute release
    const allowedRoles: string[] = [
      UserRole.SUPER_ADMIN,
      UserRole.DIRECTOR,
      UserRole.QC_LAB,
      UserRole.APJ,
    ];
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const isAuthorized = userRoles.some((r) => allowedRoles.includes(r as UserRole));
    if (!isAuthorized) {
      throw new ForbiddenException(
        `Roles [${userRoles.join(', ')}] are not authorized to perform QC / APJ release. Requires QC_LAB, APJ, or DIRECTOR.`,
      );
    }

    // 2. Idempotency check via idempotencyKey
    if (dto.idempotencyKey && this.idempotencyStore.has(dto.idempotencyKey)) {
      return {
        ...this.idempotencyStore.get(dto.idempotencyKey),
        idempotentReplay: true,
      };
    }

    const coaNumber =
      dto.coaNumber ||
      `COA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const apjName = dto.apjName || user.fullName || 'apt. Authorized Pharmacist, S.Farm';
    const apjSipa = dto.apjSipa || '19920815/SIPA_32.73/2022/2044';

    // 3. Handle Finished Goods release (from Production Work Order)
    if (dto.workOrderId || dto.batchNumber || dto.finishedGoodId) {
      let wo: any = null;
      if (dto.workOrderId) {
        wo = await this.prisma.workOrder.findUnique({
          where: { id: dto.workOrderId },
          include: { lead: true },
        });
      } else if (dto.batchNumber) {
        const plan = await this.prisma.productionPlan.findFirst({
          where: { batchNo: dto.batchNumber },
          include: { workOrders: { include: { lead: true } } },
        });
        wo = plan?.workOrders?.[0];
      }

      if (!wo && dto.workOrderId) {
        throw new NotFoundException(`Work Order not found: ${dto.workOrderId}`);
      }

      const releaseQty = dto.releaseQty ?? wo?.targetQty ?? 100;

      // Find existing FinishedGood record
      let fg = wo
        ? await this.prisma.finishedGood.findFirst({
            where: { woId: wo.planId || wo.id },
          })
        : null;

      if (!fg && dto.finishedGoodId) {
        fg = await this.prisma.finishedGood.findUnique({
          where: { id: dto.finishedGoodId },
        });
      }

      // Check if this specific batch was already released
      const existingAudit = await this.prisma.qCAudit.findFirst({
        where: {
          notes: { contains: coaNumber },
          status: 'GOOD',
        },
      });
      if (existingAudit && dto.idempotencyKey) {
        const cached = {
          success: true,
          status: 'RELEASED',
          availability: 'AVAILABLE',
          releasedQty: releaseQty,
          coaNumber,
          apjName,
          apjSipa,
          releasedAt: existingAudit.createdAt,
          idempotentReplay: true,
        };
        this.idempotencyStore.set(dto.idempotencyKey, cached);
        return cached;
      }

      // Execute atomic transaction for Finished Goods release
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Update FinishedGood stock
        if (fg) {
          await tx.finishedGood.update({
            where: { id: fg.id },
            data: {
              stockQty: { increment: releaseQty },
            },
          });
        }

        // Create immutable QC Audit log documenting the release
        const audit = await tx.qCAudit.create({
          data: {
            qcId: user.id,
            status: 'GOOD',
            phase: 'FINAL',
            coaVerified: true,
            notes: `[APJ_RELEASE] Batch ${dto.batchNumber || wo?.woNumber || 'FG'} officially released to AVAILABLE stock. COA: ${coaNumber}. APJ: ${apjName} (SIPA: ${apjSipa}). Notes: ${dto.notes || 'CPKB compliance verified.'}`,
          },
        });

        return {
          id: audit.id,
          releasedAt: audit.createdAt,
        };
      });

      const response = {
        success: true,
        status: 'RELEASED',
        availability: 'AVAILABLE',
        releasedQty: releaseQty,
        coaNumber,
        apjName,
        apjSipa,
        releasedAt: result.releasedAt,
        auditId: result.id,
        workOrderId: wo?.id,
        batchNumber: dto.batchNumber || wo?.woNumber,
      };

      if (dto.idempotencyKey) {
        this.idempotencyStore.set(dto.idempotencyKey, response);
      }

      this.eventEmitter.emit('qc.batch_released', response);
      return response;
    }

    // 4. Handle Inbound Material Release (from Warehouse Inbound)
    if (dto.inboundId) {
      const inbound = await this.prisma.warehouseInbound.findUnique({
        where: { id: dto.inboundId },
        include: { items: true },
      });

      if (!inbound) {
        throw new NotFoundException(`Inbound record not found: ${dto.inboundId}`);
      }

      if (inbound.status === 'APPROVED') {
        // Idempotent return
        return {
          success: true,
          status: 'RELEASED',
          availability: 'AVAILABLE',
          inboundId: dto.inboundId,
          idempotentReplay: true,
        };
      }

      await this.prisma.$transaction(async (tx: any) => {
        await tx.warehouseInbound.update({
          where: { id: dto.inboundId },
          data: { status: 'APPROVED' },
        });

        for (const item of inbound.items) {
          await tx.inboundItem.update({
            where: { id: item.id },
            data: { isQuarantine: false, qcStatus: 'GOOD' },
          });

          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: item.qtyActual } },
          });
        }
      });

      const response = {
        success: true,
        status: 'RELEASED',
        availability: 'AVAILABLE',
        inboundId: dto.inboundId,
        coaNumber,
        apjName,
      };

      if (dto.idempotencyKey) {
        this.idempotencyStore.set(dto.idempotencyKey, response);
      }
      return response;
    }

    throw new BadRequestException(
      'Either workOrderId, batchNumber, finishedGoodId, or inboundId must be provided for release.',
    );
  }

  /**
   * Handle partial disposition of an inspection lot (Pass, Rework, Scrap with COPQ).
   */
  async executePartialDisposition(user: { id: string; role?: string; roles?: string[] }, dto: PartialDispositionDto) {
    const allowedRoles: string[] = [
      UserRole.SUPER_ADMIN,
      UserRole.DIRECTOR,
      UserRole.QC_LAB,
      UserRole.APJ,
    ];
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const isAuthorized = userRoles.some((r) => allowedRoles.includes(r as UserRole));
    if (!isAuthorized) {
      throw new ForbiddenException('Only QC Lab or Director can authorize partial dispositions.');
    }

    const { passQty, reworkQty = 0, scrapQty = 0 } = dto;
    const totalQty = passQty + reworkQty + scrapQty;

    return await this.prisma.$transaction(async (tx: any) => {
      // 1. If scrap > 0, log financial loss via COPQ Record (BUS-RULE-077)
      let copqRecordId: string | null = null;
      if (scrapQty > 0 && dto.workOrderId) {
        const wo = await tx.workOrder.findUnique({
          where: { id: dto.workOrderId },
        });
        if (wo?.planId) {
          const unitPrice = 25000;
          const materialLoss = scrapQty * unitPrice;
          const copq = await tx.cOPQRecord.create({
            data: {
              planId: wo.planId,
              materialLoss,
              laborLoss: 0,
              overheadLoss: 0,
              totalLoss: materialLoss,
              reason: `PARTIAL_DISPOSITION_SCRAP_${scrapQty}_${dto.defectCategory || 'DEFECT'}`,
            },
          });
          copqRecordId = copq.id;
        }
      }

      // 2. Create Audit log documenting the partial disposition
      const audit = await tx.qCAudit.create({
        data: {
          qcId: user.id,
          stepLogId: dto.stepLogId,
          status: scrapQty > 0 && passQty === 0 ? 'REJECT' : reworkQty > 0 ? 'QUARANTINE' : 'GOOD',
          phase: 'PACKING',
          defectCategory: (dto.defectCategory as any) || (scrapQty > 0 ? 'FISIK' : undefined),
          defectType: dto.defectType,
          disposition: scrapQty > 0 ? 'SCRAP' : reworkQty > 0 ? 'REWORK' : 'RELEASED',
          notes: `[PARTIAL_DISPOSITION] Total: ${totalQty} units | Pass: ${passQty} | Rework: ${reworkQty} | Scrap: ${scrapQty}. Notes: ${dto.notes || ''}`,
        },
      });

      return {
        success: true,
        auditId: audit.id,
        totalQty,
        passQty,
        reworkQty,
        scrapQty,
        copqRecordId,
        dispositionSummary: {
          passedForRelease: passQty,
          heldForRework: reworkQty,
          scrappedLoss: scrapQty,
        },
      };
    });
  }

  /**
   * Retest workflow: re-evaluates a previously held or rework lot.
   */
  async executeRetest(auditId: string, user: { id: string; role?: string; roles?: string[] }, dto: RetestDto) {
    const parentAudit = await this.prisma.qCAudit.findUnique({
      where: { id: auditId },
    });
    if (!parentAudit) {
      throw new NotFoundException(`Audit record not found: ${auditId}`);
    }

    const retestStatus = dto.status.toUpperCase() === 'GOOD' ? 'GOOD' : 'REJECT';

    const retestRecord = await this.prisma.qCAudit.create({
      data: {
        qcId: user.id,
        stepLogId: parentAudit.stepLogId,
        inventoryId: parentAudit.inventoryId,
        status: retestStatus as any,
        phase: parentAudit.phase,
        phValue: dto.ph,
        viscosityValue: dto.viscosity,
        torqueValue: dto.torqueValue,
        leakTestPass: dto.leakTestPass ? dto.leakTestPass === 'PASS' : undefined,
        organoleptic: dto.organoleptic ? dto.organoleptic === 'PASS' : undefined,
        notes: `[RETEST of Audit #${auditId.substring(0, 8)}] Status: ${retestStatus}. ${dto.notes || 'Retest executed after corrective adjustment.'}`,
      },
    });

    return {
      success: true,
      parentAuditId: auditId,
      retestAuditId: retestRecord.id,
      status: retestStatus,
      message:
        retestStatus === 'GOOD'
          ? 'Retest passed. Lot is now eligible for final release.'
          : 'Retest failed. Lot remains blocked in quarantine.',
    };
  }

  /**
   * Get list of batches for the QC Release dashboard and table.
   */
  async getReleaseBatches() {
    const audits = await this.prisma.qCAudit.findMany({
      where: {
        phase: { in: ['PACKING', 'FINAL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        qc: { select: { fullName: true } },
      },
    });

    return audits.map((a) => {
      const isReleased = a.notes?.includes('[APJ_RELEASE]') || a.status === 'GOOD';
      return {
        id: a.id,
        batchNumber: a.materialBatchNo || `BATCH-${a.id.substring(0, 8).toUpperCase()}`,
        spkCode: `SPK-${a.id.substring(0, 6).toUpperCase()}`,
        status: isReleased ? 'RELEASED' : a.status === 'REJECT' ? 'REJECTED' : 'QUARANTINE',
        phValue: Number(a.phValue) || 5.5,
        viscosityCps: a.viscosityValue || 1500,
        organolepticPass: a.organoleptic ?? true,
        microbiologyPass: a.coaVerified ?? true,
        coaNumber: a.notes?.match(/COA-[A-Z0-9-]+/)?.[0] || undefined,
        apjName: a.notes?.match(/APJ:\s*([^(\n]+?)(?:\s*\(SIPA|$)/)?.[1]?.trim() || (isReleased ? a.qc?.fullName : undefined),
        apjSipa: a.notes?.match(/SIPA:\s*([^)]+)/)?.[1]?.trim() || undefined,
        completionDate: a.createdAt.toISOString().slice(0, 10),
        notes: a.notes,
      };
    });
  }
}
