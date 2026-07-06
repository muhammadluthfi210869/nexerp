import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface SalesMember {
  name: string;
  phone: string;
  active: boolean;
}

@Injectable()
export class LandingTrackerService {
  private salesFilePath = path.join(__dirname, 'crm-sales.json');
  private counterFilePath = path.join(__dirname, 'rotation-counter.json');

  constructor(private prisma: PrismaService) {}

  // ========== CRM SALES SETTINGS PERSISTENCE ==========
  async getSales(): Promise<SalesMember[]> {
    try {
      if (fs.existsSync(this.salesFilePath)) {
        const raw = fs.readFileSync(this.salesFilePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read crm-sales.json:', err);
    }

    // Default fallback
    return [
      { name: 'Annisa', phone: '6281952417051', active: true },
      { name: 'Ami', phone: '6287776550657', active: true },
      { name: 'Mutmah', phone: '6287712232389', active: true },
    ];
  }

  async saveSales(sales: SalesMember[]): Promise<boolean> {
    try {
      fs.writeFileSync(
        this.salesFilePath,
        JSON.stringify(sales, null, 2),
        'utf8',
      );
      return true;
    } catch (err) {
      console.error('Failed to write crm-sales.json:', err);
      return false;
    }
  }

  async resetRotationCounter(): Promise<boolean> {
    try {
      fs.writeFileSync(
        this.counterFilePath,
        JSON.stringify({ counter: 0 }),
        'utf8',
      );
      return true;
    } catch (err) {
      console.error('Failed to reset rotation counter:', err);
      return false;
    }
  }

  async getRotationCounter(): Promise<number> {
    try {
      if (fs.existsSync(this.counterFilePath)) {
        const raw = fs.readFileSync(this.counterFilePath, 'utf8');
        const data = JSON.parse(raw);
        return data.counter || 0;
      }
    } catch (err) {
      console.error('Failed to read rotation-counter.json:', err);
    }
    return 0;
  }

  async incrementRotationCounter(current: number): Promise<void> {
    try {
      fs.writeFileSync(
        this.counterFilePath,
        JSON.stringify({ counter: current + 1 }),
        'utf8',
      );
    } catch (err) {
      console.error('Failed to write rotation-counter.json:', err);
    }
  }

  // ========== SERVER-SIDE ROUND ROBIN PICKER ==========
  async pickNextSales(): Promise<SalesMember> {
    const sales = await this.getSales();
    const activeSales = sales.filter((s) => s.active);

    if (activeSales.length === 0) {
      throw new Error('Tidak ada sales aktif');
    }

    const counter = await this.getRotationCounter();
    const pickedIdx = counter % activeSales.length;
    const pickedSales = activeSales[pickedIdx];

    // Increment counter
    await this.incrementRotationCounter(counter);

    return pickedSales;
  }

  // ========== STANDARD LOGGING & CRUD ==========
  async createVisit(data: {
    pageUrl: string;
    pageTitle?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    visitorId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await this.prisma.landingPageVisit.create({
      data: {
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle || null,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        visitorId: data.visitorId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  async createConversion(data: {
    visitId?: string;
    pageUrl: string;
    pageTitle?: string;
    source?: string;
    nama?: string;
    perusahaan?: string;
    hp?: string;
    produk?: string;
    trafficSource?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    assignedTo?: string;
    assignedPhone?: string;
    status?: string;
  }) {
    let assignedTo = data.assignedTo;
    let assignedPhone = data.assignedPhone;

    // If no sales are assigned, automatically pick the next one using round robin
    if (!assignedTo || !assignedPhone) {
      try {
        const picked = await this.pickNextSales();
        assignedTo = picked.name;
        assignedPhone = picked.phone;
      } catch (err) {
        console.warn('Failed to auto-assign sales in createConversion:', err);
      }
    }

    return await this.prisma.landingPageConversion.create({
      data: {
        visitId: data.visitId || null,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle || null,
        source: data.source || 'DIRECT_FORM',
        nama: data.nama || null,
        perusahaan: data.perusahaan || null,
        hp: data.hp || null,
        produk: data.produk || null,
        trafficSource: data.trafficSource || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        assignedTo: assignedTo || null,
        assignedPhone: assignedPhone || null,
        status: data.status || 'NEW',
      },
    });
  }

  async getVisits(options: {
    page?: number;
    limit?: number;
    pageUrl?: string;
    utmSource?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const {
      page = 1,
      limit = 50,
      pageUrl,
      utmSource,
      search,
      startDate,
      endDate,
    } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.LandingPageVisitWhereInput = {};

    if (pageUrl) {
      where.pageUrl = { contains: pageUrl, mode: 'insensitive' };
    }
    if (utmSource) {
      where.utmSource = utmSource;
    }
    if (search) {
      where.OR = [
        { pageTitle: { contains: search, mode: 'insensitive' } },
        { pageUrl: { contains: search, mode: 'insensitive' } },
        { referrer: { contains: search, mode: 'insensitive' } },
        { visitorId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [visits, total] = await Promise.all([
      this.prisma.landingPageVisit.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.landingPageVisit.count({ where }),
    ]);

    return {
      data: visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversions(options: {
    page?: number;
    limit?: number;
    pageUrl?: string;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 100, pageUrl, status, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.LandingPageConversionWhereInput = {};

    if (pageUrl) {
      where.pageUrl = { contains: pageUrl, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { perusahaan: { contains: search, mode: 'insensitive' } },
        { hp: { contains: search, mode: 'insensitive' } },
        { produk: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversions, total] = await Promise.all([
      this.prisma.landingPageConversion.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.landingPageConversion.count({ where }),
    ]);

    return {
      data: conversions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(startDate?: string, endDate?: string) {
    const where: Prisma.LandingPageVisitWhereInput = {};
    const conversionWhere: Prisma.LandingPageConversionWhereInput = {};

    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.timestamp = dateFilter;
      conversionWhere.timestamp = dateFilter;
    }

    const [totalViews, uniqueVisitors, conversions, pageStats, trafficStats] =
      await Promise.all([
        this.prisma.landingPageVisit.count({ where }),
        this.prisma.landingPageVisit.groupBy({
          by: ['visitorId'],
          where: { ...where, visitorId: { not: null } },
        }),
        this.prisma.landingPageConversion.count({ where: conversionWhere }),
        this.prisma.landingPageVisit.groupBy({
          by: ['pageUrl', 'pageTitle'],
          where,
          _count: { pageUrl: true },
          orderBy: { _count: { pageUrl: 'desc' } },
          take: 10,
        }),
        this.prisma.landingPageVisit.groupBy({
          by: ['utmSource'],
          where: { ...where, utmSource: { not: null } },
          _count: { utmSource: true },
          orderBy: { _count: { utmSource: 'desc' } },
        }),
      ]);

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeNow = await this.prisma.landingPageVisit.count({
      where: {
        ...where,
        timestamp: { gte: fifteenMinutesAgo },
      },
    });

    const conversionRate =
      totalViews > 0 ? (conversions / totalViews) * 100 : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hourlyVisits = await this.prisma.$queryRaw<
      Array<{ hour: number; count: bigint }>
    >`
      SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
      FROM landing_page_visits
      WHERE timestamp >= ${today} AND timestamp < ${tomorrow}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    const hourlyTrend = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyVisits.find(
        (h: { hour: number }) => Number(h.hour) === i,
      );
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        views: hourData ? Number(hourData.count) : 0,
        conversions: 0,
      };
    });

    return {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      conversions,
      conversionRate: Number(conversionRate.toFixed(2)),
      activeNow,
      hourlyTrend,
      pageStats: pageStats.map((p: any) => ({
        page: p.pageTitle || p.pageUrl,
        url: p.pageUrl,
        views: p._count.pageUrl,
      })),
      trafficStats: trafficStats.map((t: any) => ({
        source: t.utmSource,
        visits: t._count.utmSource,
      })),
    };
  }

  async getRecentVisits(limit: number = 20) {
    return await this.prisma.landingPageVisit.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // ========== CRUD OPERATIONS FOR ADMIN HUB ==========
  async updateConversionStatus(id: string, status: string) {
    return await this.prisma.landingPageConversion.update({
      where: { id },
      data: { status },
    });
  }

  async deleteConversion(id: string) {
    return await this.prisma.landingPageConversion.delete({
      where: { id },
    });
  }

  async clearAllConversions() {
    return await this.prisma.landingPageConversion.deleteMany({});
  }
}
