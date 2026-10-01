import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ArAgingQueryDto, ApAgingQueryDto } from '../dto/report-query.dto';
import { InvoiceCategory, InvoiceStatus } from '@prisma/client';

@Injectable()
export class AgingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getArAging(query: ArAgingQueryDto) {
    const asOf = query.as_of ? new Date(query.as_of) : new Date();

    const whereClause: any = {
      category: InvoiceCategory.RECEIVABLE,
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
      deletedAt: null,
    };
    if (query.customer_id) {
      whereClause.so = { leadId: query.customer_id };
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        so: {
          include: {
            lead: true,
          },
        },
      },
    });

    const customerMap = new Map<string, any>();

    for (const inv of invoices) {
      const customerId = inv.so?.lead?.id || 'UNKNOWN';
      const customerName = inv.so?.lead?.clientName || inv.so?.brandName || 'Pelanggan Umum';
      const outstanding = Math.round(Number(inv.outstandingAmount || inv.amountDue));

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: customerName,
          current: 0,
          h_minus_3: 0, // 0-3 days to due
          h_minus_7: 0, // 4-7 days to due
          over_30: 0,
          over_60: 0,
          over_90: 0,
          total_ar: 0,
        });
      }

      const rec = customerMap.get(customerId);
      rec.total_ar += outstanding;

      const diffDays = Math.floor((inv.dueDate.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));

      // BUS-RULE-059 logic:
      // IF 4 <= daysToDue <= 7 THEN yellow (h_minus_7)
      // IF 0 <= daysToDue <= 3 THEN red (h_minus_3)
      // IF daysToDue < 0 THEN overdue (>30, >60, >90)
      if (diffDays > 7) {
        rec.current += outstanding;
      } else if (diffDays >= 4 && diffDays <= 7) {
        rec.h_minus_7 += outstanding;
      } else if (diffDays >= 0 && diffDays <= 3) {
        rec.h_minus_3 += outstanding;
      } else {
        const overdueDays = Math.abs(diffDays);
        if (overdueDays <= 30) {
          rec.over_30 += outstanding;
        } else if (overdueDays <= 60) {
          rec.over_60 += outstanding;
        } else {
          rec.over_90 += outstanding;
        }
      }
    }

    return {
      data: Array.from(customerMap.values()),
    };
  }

  async getApAging(query: ApAgingQueryDto) {
    const asOf = query.as_of ? new Date(query.as_of) : new Date();

    const whereClause: any = {
      category: InvoiceCategory.PAYABLE,
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
      deletedAt: null,
    };
    if (query.supplier_id) {
      whereClause.supplierId = query.supplier_id;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        supplier: true,
      },
    });

    const supplierMap = new Map<string, any>();

    for (const inv of invoices) {
      const supplierId = inv.supplierId || 'UNKNOWN';
      const supplierName = inv.supplier?.name || 'Vendor Umum';
      const outstanding = Math.round(Number(inv.outstandingAmount || inv.amountDue));

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: supplierName,
          current: 0,
          h_minus_3: 0,
          h_minus_7: 0,
          over_30: 0,
          over_60: 0,
          over_90: 0,
          total_ap: 0,
        });
      }

      const rec = supplierMap.get(supplierId);
      rec.total_ap += outstanding;

      const diffDays = Math.floor((inv.dueDate.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        rec.current += outstanding;
      } else if (diffDays >= 4 && diffDays <= 7) {
        rec.h_minus_7 += outstanding;
      } else if (diffDays >= 0 && diffDays <= 3) {
        rec.h_minus_3 += outstanding;
      } else {
        const overdueDays = Math.abs(diffDays);
        if (overdueDays <= 30) {
          rec.over_30 += outstanding;
        } else if (overdueDays <= 60) {
          rec.over_60 += outstanding;
        } else {
          rec.over_90 += outstanding;
        }
      }
    }

    return {
      data: Array.from(supplierMap.values()),
    };
  }
}
