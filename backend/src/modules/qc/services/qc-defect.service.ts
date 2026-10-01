import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class QcDefectService {
  constructor(private prisma: PrismaService) {}

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
          compliance: Math.max(
            0,
            100 -
              Math.round((data.reject / Math.max(1, data.total)) * 100 * 1.5),
          ),
        };
      })
      .sort((a, b) => b.rejectRate - a.rejectRate);
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
}
