import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
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
      HOLD: 'QUARANTINE',
    };
    return map[status?.toUpperCase()] || status;
  }

  async create(userId: string, dto: CreateQCAuditDto) {
    const normalizedStatus = this.normalizeStatus(dto.status);

    // Resolve phase dari stage jika tidak dikirim
    const phase = dto.phase || this.inferPhase(dto);

    // Threshold validation: cek parameter terhadap QCParameter target
    if (dto.stepLogId && normalizedStatus === 'GOOD') {
      await this.validateThresholds(dto, userId);
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      // PHASE 1: Handle Production Step Log (Mixing/Filling/Packing stage)
      if (dto.stepLogId) {
        const stepLog = await tx.productionStepLog.findUnique({
          where: { id: dto.stepLogId },
          include: {
            wo: {
              include: { formula: { select: { id: true } } },
            },
          },
        });

        if (!stepLog)
          throw new NotFoundException('Production step log not found');

        if (normalizedStatus === 'GOOD') {
          await tx.productionStepLog.update({
            where: { id: dto.stepLogId },
            data: {
              qtyQuarantine: 0,
              qtyResult: stepLog.inputQty,
            },
          });

          // Trigger COPQ untuk product loss (shrinkage)
          const shrinkage =
            Number(stepLog.inputQty) - Number(stepLog.qtyResult);
          if (shrinkage > 0) {
            await this.calculateCOPQ(
              tx,
              stepLog.woId,
              stepLog.stage,
              shrinkage,
            );
          }
        }

        if (normalizedStatus === 'REJECT') {
          await tx.productionStepLog.update({
            where: { id: dto.stepLogId },
            data: {
              qtyQuarantine: 0,
              qtyReject: stepLog.inputQty,
              qtyResult: 0,
            },
          });
        }
      }

      // PHASE 2: Handle Incoming Material (Warehouse Inbound)
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

        // Jika inbound item spesifik, update juga
        if (dto.inboundItemId) {
          await tx.inboundItem.update({
            where: { id: dto.inboundItemId },
            data: { qcStatus: normalizedStatus as any },
          });
        }

        // Jika reject, trigger supplier alert event
        if (normalizedStatus === 'REJECT' && dto.supplierId) {
          this.eventEmitter.emit('qc.supplier_alert', {
            supplierId: dto.supplierId,
            inventoryId: dto.inventoryId,
            materialBatchNo: dto.materialBatchNo,
            defectType: dto.defectType,
            loggedBy: userId,
          });
        }
      }

      // PHASE 3: Create Immutable Audit Record
      const record = await tx.qCAudit.create({
        data: {
          stepLogId: dto.stepLogId,
          inventoryId: dto.inventoryId,
          inboundItemId: dto.inboundItemId,
          supplierId: dto.supplierId,
          qcId: userId,
          status: normalizedStatus as any,
          phase,
          notes: dto.notes,

          phValue: dto.ph,
          viscosityValue: dto.viscosity,
          organoleptic:
            dto.organoleptic !== undefined
              ? dto.organoleptic === 'PASS'
              : undefined,
          samplingVolume: dto.fillingWeight,
          sealingCheck:
            dto.sealingCheck !== undefined
              ? dto.sealingCheck === 'PASS'
              : undefined,
          labelingCheck:
            dto.labelingCheck !== undefined
              ? dto.labelingCheck === 'PASS'
              : undefined,
          expDateCheck:
            dto.expDateCheck !== undefined
              ? dto.expDateCheck === 'PASS'
              : undefined,
          halalStatus:
            dto.halalStatus !== undefined
              ? dto.halalStatus === 'PASS'
              : undefined,
          densityValue: dto.densityValue,
          homogenityPass:
            dto.homogenityPass !== undefined
              ? dto.homogenityPass === 'PASS'
              : undefined,
          torqueValue: dto.torqueValue,
          leakTestPass:
            dto.leakTestPass !== undefined
              ? dto.leakTestPass === 'PASS'
              : undefined,
          dimensionCheck:
            dto.dimensionCheck !== undefined
              ? dto.dimensionCheck === 'PASS'
              : undefined,
          coaVerified:
            dto.coaVerified !== undefined
              ? dto.coaVerified === 'PASS'
              : undefined,

          defectCategory: dto.defectCategory as any,
          defectType: dto.defectType,
          defectLocation: dto.defectLocation,
          defectCause: dto.defectCause,
          severity: dto.severity as any,
          disposition: dto.disposition as any,
          rootCause: dto.rootCause,
          correctiveAction: dto.correctiveAction,
          materialBatchNo: dto.materialBatchNo,

          supervisorById: dto.bypassReason ? userId : undefined,
          supervisorPin: dto.supervisorPin,
          bypassReason: dto.bypassReason,
        },
      });

      return record;
    });

    // Emit events
    this.eventEmitter.emit('qc.audit.created', {
      auditId: result.id,
      stepLogId: dto.stepLogId,
      inventoryId: dto.inventoryId,
      status: normalizedStatus,
      phase,
      notes: dto.notes,
      defectType: dto.defectType,
      loggedBy: userId,
    });

    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'QC',
      notes: `QC Audit: ${normalizedStatus} for ${phase || 'inbound'} ${dto.stepLogId || dto.inventoryId}`,
      loggedBy: `SYSTEM:QC`,
    });

    if (normalizedStatus === 'GOOD') {
      this.eventEmitter.emit('QC_AUDIT_PASS', {
        employeeId: userId,
        referenceId: result.id,
        metadata: { stepLogId: dto.stepLogId, inventoryId: dto.inventoryId },
      });

      // Production QC verified event
      if (dto.stepLogId) {
        this.eventEmitter.emit('production.qc_verified', {
          scheduleId: dto.stepLogId,
          stage: phase,
          status: 'PASS',
        });
      }
    }

    if (normalizedStatus === 'REJECT' && dto.defectType) {
      this.eventEmitter.emit('qc.defect_recorded', {
        auditId: result.id,
        defectCategory: dto.defectCategory,
        defectType: dto.defectType,
        severity: dto.severity,
        loggedBy: userId,
      });
    }

    if (dto.bypassReason) {
      this.eventEmitter.emit('qc.supervisor_bypass', {
        auditId: result.id,
        reason: dto.bypassReason,
        supervisorId: userId,
        stepLogId: dto.stepLogId,
      });
    }

    return result;
  }

  private inferPhase(dto: CreateQCAuditDto): any {
    if (dto.inventoryId) return 'INBOUND';
    if (dto.stepLogId) {
      // Akan diisi oleh frontend, fallback ke null
    }
    return undefined;
  }

  private async validateThresholds(
    dto: CreateQCAuditDto,
    userId: string,
  ): Promise<void> {
    if (!dto.stepLogId) return;

    const stepLog = await this.prisma.productionStepLog.findUnique({
      where: { id: dto.stepLogId },
      include: { wo: { select: { formulaId: true } } },
    });

    if (!stepLog?.wo?.formulaId) return;

    const qcParams = await this.prisma.qCParameter.findUnique({
      where: { formulaId: stepLog.wo.formulaId },
    });

    if (!qcParams) return;

    const outOfSpec: string[] = [];

    if (dto.ph && qcParams.targetPh) {
      const [min, max] = qcParams.targetPh.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && (dto.ph < min || dto.ph > max)) {
        outOfSpec.push(`pH ${dto.ph} (target: ${qcParams.targetPh})`);
      }
    }

    if (dto.viscosity && qcParams.targetViscosity) {
      const [min, max] = qcParams.targetViscosity.split('-').map(Number);
      if (
        !isNaN(min) &&
        !isNaN(max) &&
        (dto.viscosity < min || dto.viscosity > max)
      ) {
        outOfSpec.push(
          `Viscosity ${dto.viscosity} (target: ${qcParams.targetViscosity})`,
        );
      }
    }

    if (outOfSpec.length > 0) {
      // Jika ada supervisor PIN, bypass
      if (dto.supervisorPin) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user?.managerPin)
          throw new BadRequestException(
            'Supervisor PIN not configured for this user',
          );
        const pinValid = await bcrypt.compare(
          dto.supervisorPin,
          user.managerPin,
        );
        if (pinValid) {
          this.eventEmitter.emit('qc.parameter_out_of_spec', {
            auditId: null,
            stepLogId: dto.stepLogId,
            outOfSpecParams: outOfSpec,
            bypassed: true,
            bypassedBy: userId,
          });
          return;
        }
        throw new ForbiddenException(
          `Parameters out of spec:\n${outOfSpec.join('\n')}\n\nSupervisor PIN invalid.`,
        );
      }

      this.eventEmitter.emit('qc.parameter_out_of_spec', {
        auditId: null,
        stepLogId: dto.stepLogId,
        outOfSpecParams: outOfSpec,
        bypassed: false,
      });

      throw new BadRequestException(
        `Parameters out of spec:\n${outOfSpec.join('\n')}\n\nProvide supervisor PIN to bypass.`,
      );
    }
  }

  private async calculateCOPQ(
    tx: any,
    workOrderId: string,
    stage: string,
    rejectQty: number,
  ) {
    const wo = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      include: { plan: { include: { so: { include: { lead: true } } } } },
    });

    const activeLog = await tx.productionLog.findFirst({
      where: { workOrderId, stage },
      orderBy: { loggedAt: 'desc' },
      include: { machine: true },
    });

    if (!wo || !activeLog) return;

    // Ambil unit price actual dari material item
    const stepLog = await tx.productionStepLog.findFirst({
      where: { woId: workOrderId, stage },
      orderBy: { createdAt: 'desc' },
    });

    let unitCost = 15000; // fallback
    if (stepLog) {
      const plan = await tx.productionPlan.findUnique({
        where: { id: wo.planId || '' },
        include: {
          workOrders: {
            include: {
              logs: {
                include: { materialInventory: { include: { material: true } } },
                orderBy: { loggedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });
      const lastLog = plan?.workOrders?.[0]?.logs?.[0];
      if (lastLog?.materialInventory?.material?.unitPrice) {
        unitCost = Number(lastLog.materialInventory.material.unitPrice);
      }
    }

    const materialLoss = rejectQty * unitCost;

    const durationMin =
      activeLog.startTime && activeLog.loggedAt
        ? Math.max(
            0,
            (activeLog.loggedAt.getTime() - activeLog.startTime.getTime()) /
              60000,
          )
        : activeLog.downtimeMinutes || 60;

    const laborRate = activeLog.actualLaborRate || 25000;
    const machineRate =
      activeLog.actualMachineRate || activeLog.machine?.costPerHour || 50000;

    const laborLoss = (durationMin / 60) * Number(laborRate);
    const machineLoss = (durationMin / 60) * Number(machineRate);
    const totalLoss = materialLoss + laborLoss + machineLoss;

    if (wo.planId) {
      await tx.cOPQRecord.create({
        data: {
          planId: wo.planId,
          materialLoss,
          laborLoss,
          overheadLoss: machineLoss,
          totalLoss,
          reason: `REJECT_${rejectQty}_AT_${stage}`,
        },
      });
    }
  }

  // --- Query Methods ---

  async findAll(status?: string, type?: string, userId?: string) {
    const where: any = {};

    if (status) {
      where.status = this.normalizeStatus(status);
    }

    if (userId) {
      where.qcId = userId;
    }

    if (type === 'inbound') {
      where.inventoryId = { not: null };
    }

    if (type === 'production') {
      where.stepLogId = { not: null };
    }

    const audits = await this.prisma.qCAudit.findMany({
      where,
      include: {
        qc: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return audits.map((a) => ({
      id: a.id,
      reportNumber: a.id.substring(0, 8).toUpperCase(),
      createdAt: a.createdAt,
      status:
        a.status === 'GOOD'
          ? 'PASSED'
          : a.status === 'REJECT'
            ? 'FAILED'
            : a.status,
      phase: a.phase,
      analyst: a.qc ? { fullName: a.qc.fullName } : null,
      phValue: a.phValue,
      viscosityValue: a.viscosityValue,
      organoleptic: a.organoleptic,
      samplingVolume: a.samplingVolume,
      sealingCheck: a.sealingCheck,
      labelingCheck: a.labelingCheck,
      inkjetCheck: a.inkjetCheck,
      halalStatus: a.halalStatus,
      densityValue: a.densityValue,
      homogenityPass: a.homogenityPass,
      torqueValue: a.torqueValue,
      leakTestPass: a.leakTestPass,
      dimensionCheck: a.dimensionCheck,
      coaVerified: a.coaVerified,
      defectCategory: a.defectCategory,
      defectType: a.defectType,
      defectLocation: a.defectLocation,
      defectCause: a.defectCause,
      severity: a.severity,
      disposition: a.disposition,
      rootCause: a.rootCause,
      correctiveAction: a.correctiveAction,
      materialBatchNo: a.materialBatchNo,
      supplierId: a.supplierId,
      notes: a.notes,
      bypassReason: a.bypassReason,
      stepLogId: a.stepLogId,
      inventoryId: a.inventoryId,
    }));
  }

  async findOne(id: string) {
    const audit = await this.prisma.qCAudit.findUnique({
      where: { id },
      include: {
        qc: { select: { fullName: true, email: true } },
      },
    });
    if (!audit) throw new NotFoundException('QC Audit not found');
    return audit;
  }

  // --- Analytics ---

  async getDefectPareto(from?: string, to?: string) {
    const where: any = {
      defectCategory: { not: null },
      status: 'REJECT',
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const audits = await this.prisma.qCAudit.findMany({
      where,
      select: { defectCategory: true, defectType: true },
    });

    const groups: Record<string, number> = {};
    for (const a of audits) {
      const key = a.defectType || a.defectCategory || 'UNKNOWN';
      groups[key] = (groups[key] || 0) + 1;
    }

    const total = Object.values(groups).reduce((s, c) => s + c, 0);
    return Object.entries(groups)
      .map(([defect, count]) => ({
        defect,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getSupplierQuality(from?: string, to?: string) {
    const where: any = {
      supplierId: { not: null },
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const audits = await this.prisma.qCAudit.findMany({
      where,
      select: { supplierId: true, status: true },
    });

    const groups: Record<string, { total: number; reject: number }> = {};
    for (const a of audits) {
      if (!a.supplierId) continue;
      if (!groups[a.supplierId]) groups[a.supplierId] = { total: 0, reject: 0 };
      groups[a.supplierId].total++;
      if (a.status === 'REJECT') groups[a.supplierId].reject++;
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: Object.keys(groups) } },
      select: { id: true, name: true },
    });

    const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

    return Object.entries(groups)
      .map(([id, data]) => {
        const acceptRate =
          data.total > 0
            ? Math.round(((data.total - data.reject) / data.total) * 100)
            : 100;
        return {
          supplierId: id,
          supplier: supplierMap.get(id) || 'Unknown',
          totalInbound: data.total,
          rejectCount: data.reject,
          rejectRate:
            data.total > 0 ? Math.round((data.reject / data.total) * 100) : 0,
          quality: acceptRate,
          delivery: Math.min(100, data.total * 10),
          compliance: Math.max(0, 100 - Math.round((data.reject / Math.max(1, data.total)) * 100 * 1.5)),
        };
      })
      .sort((a, b) => b.rejectRate - a.rejectRate);
  }

  async getFunnelDegradation(planId: string) {
    const stepLogs = await this.prisma.productionStepLog.findMany({
      where: { woId: planId },
      orderBy: { stage: 'asc' },
      select: {
        stage: true,
        inputQty: true,
        qtyResult: true,
        qtyReject: true,
        qtyQuarantine: true,
        shrinkageQty: true,
      },
    });

    return stepLogs.map((s) => ({
      stage: s.stage,
      input: Number(s.inputQty),
      output: Number(s.qtyResult),
      reject: Number(s.qtyReject),
      quarantine: Number(s.qtyQuarantine),
      shrinkage: Number(s.shrinkageQty),
      lossPct:
        Number(s.inputQty) > 0
          ? Math.round(
              ((Number(s.inputQty) - Number(s.qtyResult)) /
                Number(s.inputQty)) *
                100,
            )
          : 0,
    }));
  }

  async getVendorWatchlist() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const audits = await this.prisma.qCAudit.findMany({
      where: {
        supplierId: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { supplierId: true, status: true, defectType: true },
    });

    const groups: Record<
      string,
      { total: number; reject: number; defects: Set<string> }
    > = {};
    for (const a of audits) {
      if (!a.supplierId) continue;
      if (!groups[a.supplierId])
        groups[a.supplierId] = { total: 0, reject: 0, defects: new Set() };
      groups[a.supplierId].total++;
      if (a.status === 'REJECT') {
        groups[a.supplierId].reject++;
        if (a.defectType) groups[a.supplierId].defects.add(a.defectType);
      }
    }

    const supplierIds = Object.keys(groups);
    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true, isBlacklisted: true },
    });

    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    return Object.entries(groups)
      .map(([id, data]) => {
        const sup = supplierMap.get(id);
        const acceptRate =
          data.total > 0
            ? Math.round(((data.total - data.reject) / data.total) * 100)
            : 100;
        return {
          supplierId: id,
          supplier: sup?.name || 'Unknown',
          totalInbound: data.total,
          rejectCount: data.reject,
          acceptRate,
          topDefects: Array.from(data.defects).slice(0, 3),
          isWatchlist: acceptRate < 90,
          isBlacklisted: sup?.isBlacklisted || false,
        };
      })
      .filter((v) => v.isWatchlist)
      .sort((a, b) => a.acceptRate - b.acceptRate);
  }

  async getReworkHoldLog() {
    const audits = await this.prisma.qCAudit.findMany({
      where: {
        status: 'REJECT',
        disposition: { in: ['REWORK', 'SORTING', 'USE_AS_IS'] },
      },
      include: {
        qc: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return audits.map((a) => ({
      id: a.id.substring(0, 8).toUpperCase(),
      batch: a.stepLogId?.substring(0, 8).toUpperCase() || '—',
      phase: a.phase,
      defect: a.defectType,
      severity: a.severity,
      disposition: a.disposition,
      notes: a.notes,
      analyst: a.qc?.fullName || '—',
      createdAt: a.createdAt,
      heldHours: Math.round(
        (Date.now() - new Date(a.createdAt).getTime()) / 3600000,
      ),
    }));
  }

  async getDashboard() {
    const totalAudits = await this.prisma.qCAudit.count();
    const passedAudits = await this.prisma.qCAudit.count({
      where: { status: 'GOOD' },
    });
    const failedAudits = await this.prisma.qCAudit.count({
      where: { status: 'REJECT' },
    });
    const quarantineAudits = await this.prisma.qCAudit.count({
      where: { status: 'QUARANTINE' },
    });
    return {
      total: totalAudits,
      passed: passedAudits,
      failed: failedAudits,
      quarantine: quarantineAudits,
      passRate:
        totalAudits > 0
          ? ((passedAudits / totalAudits) * 100).toFixed(1)
          : '0.0',
    };
  }

  async getWorkbench() {
    const pending = await this.prisma.qCAudit.findMany({
      where: { status: { in: ['QUARANTINE'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        qc: { select: { fullName: true } },
        stepLog: true,
      },
    });
    return pending;
  }

  async getPhaseBreakdown(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const audits = await this.prisma.qCAudit.findMany({
      where,
      select: {
        phase: true,
        status: true,
        defectCategory: true,
        defectType: true,
        severity: true,
        disposition: true,
      },
    });

    const phaseKeys = ['INBOUND', 'MIXING', 'FILLING', 'PACKING', 'FINAL'] as const;

    const phases = phaseKeys.map((phase) => {
      const phaseAudits = audits.filter((a) => a.phase === phase);
      const totalAudits = phaseAudits.length;
      const passCount = phaseAudits.filter((a) => a.status === 'GOOD').length;
      const rejectCount = phaseAudits.filter((a) => a.status === 'REJECT').length;
      const holdCount = phaseAudits.filter((a) => a.status === 'QUARANTINE').length;
      const passRate =
        passCount + rejectCount > 0
          ? Math.round((passCount / (passCount + rejectCount)) * 100 * 10) / 10
          : 0;

      const rejectAudits = phaseAudits.filter((a) => a.status === 'REJECT');

      const defectCategoryGroups: Record<string, number> = {};
      const defectTypeGroups: Record<string, number> = {};
      const severityGroups: Record<string, number> = {};
      const dispositionGroups: Record<string, number> = {};

      for (const a of rejectAudits) {
        if (a.defectCategory) {
          defectCategoryGroups[a.defectCategory] =
            (defectCategoryGroups[a.defectCategory] || 0) + 1;
        }
        if (a.defectType) {
          defectTypeGroups[a.defectType] =
            (defectTypeGroups[a.defectType] || 0) + 1;
        }
        if (a.severity) {
          severityGroups[a.severity] = (severityGroups[a.severity] || 0) + 1;
        }
        if (a.disposition) {
          dispositionGroups[a.disposition] =
            (dispositionGroups[a.disposition] || 0) + 1;
        }
      }

      const topRejectReasons = Object.entries(defectCategoryGroups)
        .map(([defectCategory, count]) => ({ defectCategory, count }))
        .sort((a, b) => b.count - a.count);

      const topDefectTypes = Object.entries(defectTypeGroups)
        .map(([defectType, count]) => ({ defectType, count }))
        .sort((a, b) => b.count - a.count);

      return {
        phase,
        totalAudits,
        passCount,
        rejectCount,
        holdCount,
        passRate,
        topRejectReasons,
        topDefectTypes,
        severityBreakdown: severityGroups,
        dispositionBreakdown: dispositionGroups,
      };
    });

    const totalPass = phases.reduce((s, p) => s + p.passCount, 0);
    const totalReject = phases.reduce((s, p) => s + p.rejectCount, 0);
    const overallPassRate =
      totalPass + totalReject > 0
        ? Math.round((totalPass / (totalPass + totalReject)) * 100 * 10) / 10
        : 0;

    return {
      phases,
      overall: {
        totalPass,
        totalReject,
        overallPassRate,
      },
    };
  }
}
