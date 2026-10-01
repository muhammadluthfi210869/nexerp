import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * ProductionOeeService — Domain service for OEE, quality metrics, and downtime / leakage analytics.
 *
 * Responsibilities:
 * - Machine OEE calculations (Availability, Performance, Quality, Overall OEE)
 * - Quality control statistics, pass rates, FTY, COPQ, and quarantine tracking
 * - Leakage diagnostics: material loss, weight deviation, missing QC gates, reject spikes, sequence/time leakage
 */
@Injectable()
export class ProductionOeeService {
  constructor(private prisma: PrismaService) {}

  async getMachineOEE() {
    const machines = await this.prisma.machine.findMany({
      include: {
        productionLogs: {
          where: {
            loggedAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
      },
    });

    return machines.map((machine) => {
      const logs = machine.productionLogs;
      if (logs.length === 0) {
        return {
          id: machine.id,
          name: machine.name,
          availability: 100,
          performance: 100,
          quality: 100,
          oee: 100,
          status: (machine as any).isActive ? 'ACTIVE' : 'OFFLINE',
        };
      }

      // 1. Availability = (Planned Time - Downtime) / Planned Time
      const totalDowntime = logs.reduce(
        (sum, l) => sum + Number(l.downtimeMinutes || 0),
        0,
      );
      const totalPlannedMinutes = 30 * 24 * 60; // Simplified for last 30 days
      const availability =
        ((totalPlannedMinutes - totalDowntime) / totalPlannedMinutes) * 100;

      // 2. Performance = (Actual Output / Theoretical Max Output)
      const totalGood = logs.reduce(
        (sum, l) => sum + Number(l.goodQty || 0),
        0,
      );
      const totalInput = logs.reduce(
        (sum, l) => sum + Number(l.inputQty || 0),
        0,
      );
      const performance = totalInput > 0 ? (totalGood / totalInput) * 100 : 100;

      // 3. Quality = Good Units / Total Units
      const quality = totalInput > 0 ? (totalGood / totalInput) * 100 : 100;

      const oee =
        (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        id: machine.id,
        name: machine.name,
        availability: parseFloat(availability.toFixed(1)),
        performance: parseFloat(performance.toFixed(1)),
        quality: parseFloat(quality.toFixed(1)),
        oee: parseFloat(oee.toFixed(1)),
        status: (machine as any).isActive ? 'ACTIVE' : 'OFFLINE',
      };
    });
  }

  async getQCStats() {
    const [audits, qcedLogs, copqRecords] = await Promise.all([
      this.prisma.qCAudit.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.productionLog.findMany({
        where: { quarantineQty: { gt: 0 } },
      }),
      this.prisma.cOPQRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalInspected = audits.length;
    const passed = audits.filter((a: any) => a.status === 'GOOD').length;
    const rejected = audits.filter((a: any) => a.status === 'REJECT').length;
    const quarantined = audits.filter(
      (a: any) => a.status === 'QUARANTINE',
    ).length;

    const passRate =
      totalInspected > 0
        ? ((passed / totalInspected) * 100).toFixed(1)
        : '100.0';
    const firstPassCount = audits.filter(
      (a: any, i: number, arr: any[]) =>
        a.status === 'GOOD' &&
        arr.findIndex((x: any) => x.stepLogId === a.stepLogId) === i,
    ).length;
    const fty =
      totalInspected > 0
        ? ((firstPassCount / totalInspected) * 100).toFixed(1)
        : '100.0';

    const totalCopq = copqRecords.reduce(
      (sum, r) => sum + Number(r.totalLoss),
      0,
    );
    const leakage =
      totalInspected > 0
        ? ((rejected / totalInspected) * 100).toFixed(2)
        : '0.00';

    const recentAnomalies = audits
      .filter((a: any) => a.status === 'REJECT')
      .slice(0, 5)
      .map((a: any) => ({
        id: a.id.substring(0, 8).toUpperCase(),
        batchId: a.stepLogId?.substring(0, 8).toUpperCase() || '—',
        defect: a.notes || 'Rejected',
        severity: 'Critical',
        action: 'On Hold',
      }));

    return {
      passRate,
      fty,
      totalInspected,
      passed,
      rejected,
      pending: Math.max(0, qcedLogs.length - totalInspected),
      copq: totalCopq,
      leakage: parseFloat(leakage),
      holdAnomaly: quarantined,
      anomalies: recentAnomalies,
      complianceScore: parseFloat(passRate),
      trends: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 15 },
        { day: 'Wed', count: 8 },
        { day: 'Thu', count: 20 },
        { day: 'Fri', count: 14 },
      ],
    };
  }

  async getLeakageData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [allLogs, allSchedules, allQcAudits] = await Promise.all([
      this.prisma.productionLog.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        include: {
          workOrder: { include: { lead: true } },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      this.prisma.productionSchedule.findMany({
        where: { startTime: { gte: thirtyDaysAgo } },
        include: {
          stepDetails: true,
          workOrder: true,
          machine: true,
        },
      }),
      this.prisma.qCAudit.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const materialLeakage: any[] = [];
    const timeLeakage: any[] = [];
    const weightDeviation: any[] = [];
    const missingQCGate: any[] = [];
    const sequenceViolation: any[] = [];
    const rejectSpikes: any[] = [];

    // 1. Material Leakage: inputQty vs goodQty per stage
    const woLogMap = new Map<string, any[]>();
    for (const log of allLogs) {
      if (!log.workOrderId) continue;
      const arr = woLogMap.get(log.workOrderId) || [];
      arr.push(log);
      woLogMap.set(log.workOrderId, arr);
    }

    for (const [, logs] of woLogMap) {
      for (const log of logs) {
        const input = Number(log.inputQty);
        const good = Number(log.goodQty);
        const reject = Number(log.rejectQty);
        const quarantine = Number(log.quarantineQty);
        const shrinkage = Number(log.shrinkageQty || 0);
        const accountedOutput = good + reject + quarantine + shrinkage;
        if (input > 0) {
          const lossPct = ((input - accountedOutput) / input) * 100;
          if (lossPct > 2) {
            materialLeakage.push({
              woNumber: log.workOrder?.woNumber || 'N/A',
              stage: log.stage,
              input,
              output: accountedOutput,
              good,
              reject,
              quarantine,
              shrinkage,
              loss: input - accountedOutput,
              lossPct: parseFloat(lossPct.toFixed(2)),
              productName: log.workOrder?.lead?.productInterest || 'N/A',
              detectedAt: log.loggedAt,
            });
          }
        }
      }
    }

    // 2. Weight Deviation: step detail theoretical vs actual
    for (const schedule of allSchedules) {
      for (const detail of schedule.stepDetails) {
        if (detail.qtyActual && detail.qtyTheoretical) {
          const theoretical = Number(detail.qtyTheoretical);
          const actual = Number(detail.qtyActual);
          const devPct = (Math.abs(actual - theoretical) / theoretical) * 100;
          if (devPct > 0.5) {
            weightDeviation.push({
              woNumber: schedule.workOrder?.woNumber || 'N/A',
              scheduleId: schedule.id,
              stage: schedule.stage,
              materialId: detail.materialId,
              materialCode: detail.materialCode,
              theoretical,
              actual,
              devPct: parseFloat(devPct.toFixed(2)),
            });
          }
        }
      }
    }

    // 3. Missing QC Gate: completed schedules without QC audit
    for (const schedule of allSchedules.filter(
      (s) => s.status === 'COMPLETED',
    )) {
      const hasQc = allQcAudits.some((a) => a.stepLogId === schedule.id);
      if (!hasQc) {
        missingQCGate.push({
          scheduleId: schedule.id,
          woNumber: schedule.workOrder?.woNumber || 'N/A',
          stage: schedule.stage,
          machineName: schedule.machine?.name || 'N/A',
          completedAt: schedule.endTime,
        });
      }
    }

    // 4. Reject Spikes: per machine per day
    const machineRejectMap = new Map<
      string,
      { total: number; count: number }
    >();
    for (const log of allLogs) {
      if (!log.machineId) continue;
      const key = `${log.machineId}_${log.loggedAt.toISOString().slice(0, 10)}`;
      const existing = machineRejectMap.get(key) || { total: 0, count: 0 };
      existing.total += Number(log.rejectQty);
      existing.count += Number(log.goodQty) + Number(log.rejectQty);
      machineRejectMap.set(key, existing);
    }

    for (const [key, val] of machineRejectMap) {
      const rate = val.count > 0 ? (val.total / val.count) * 100 : 0;
      if (rate > 10) {
        const [machineId, dateStr] = key.split('_');
        rejectSpikes.push({
          machineId,
          date: dateStr,
          rejectRate: parseFloat(rate.toFixed(1)),
          totalReject: val.total,
          totalOutput: val.count,
        });
      }
    }

    // 5. Sequence Violation: check if stages were skipped
    for (const [, logs] of woLogMap) {
      const sortedLogs = logs.sort(
        (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime(),
      );
      const stageOrder = [
        'PLANNING',
        'WAITING_MATERIAL',
        'MIXING',
        'FILLING',
        'PACKING',
        'FINISHED_GOODS',
      ];
      let lastIdx = -1;
      for (const log of sortedLogs) {
        const idx = stageOrder.indexOf(log.stage);
        if (idx >= 0) {
          if (lastIdx >= 0 && idx > lastIdx + 1) {
            sequenceViolation.push({
              woNumber: log.workOrder?.woNumber || 'N/A',
              fromStage: stageOrder[lastIdx],
              attemptedStage: log.stage,
              skippedStages: stageOrder.slice(lastIdx + 1, idx),
              detectedAt: log.loggedAt,
            });
          }
          lastIdx = idx;
        }
      }
    }

    // 6. Time Leakage: gap between consecutive stage logs > 4h threshold
    for (const [, logs] of woLogMap) {
      const sortedLogs = logs.sort(
        (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime(),
      );
      for (let i = 1; i < sortedLogs.length; i++) {
        const prev = sortedLogs[i - 1];
        const curr = sortedLogs[i];
        const gapHours =
          (curr.loggedAt.getTime() - prev.loggedAt.getTime()) /
          (1000 * 60 * 60);
        if (gapHours > 4) {
          timeLeakage.push({
            woNumber: curr.workOrder?.woNumber || 'N/A',
            fromStage: prev.stage,
            toStage: curr.stage,
            gapHours: parseFloat(gapHours.toFixed(1)),
            prevTime: prev.loggedAt,
            currTime: curr.loggedAt,
            productName: curr.workOrder?.lead?.productInterest || 'N/A',
          });
        }
      }
    }

    return {
      materialLeakage: materialLeakage.slice(0, 50),
      timeLeakage: timeLeakage.slice(0, 50),
      weightDeviation: weightDeviation.slice(0, 50),
      missingQCGate: missingQCGate.slice(0, 50),
      sequenceViolation: sequenceViolation.slice(0, 50),
      rejectSpikes: rejectSpikes.slice(0, 50),
      summary: {
        totalAnomalies:
          materialLeakage.length +
          timeLeakage.length +
          weightDeviation.length +
          missingQCGate.length +
          sequenceViolation.length +
          rejectSpikes.length,
        criticalCount:
          materialLeakage.filter((l) => l.lossPct > 10).length +
          rejectSpikes.filter((r) => r.rejectRate > 20).length,
      },
    };
  }
}
