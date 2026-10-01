import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { POStatus } from '@prisma/client';

@Injectable()
export class ScmDashboardService {
  private readonly logger = new Logger(ScmDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVendors() {
    return this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getDashboardStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      materials,
      inventories,
      workOrders,
      pos,
      transactions,
      opnames,
      deliveries,
      suppliers,
    ] = await Promise.all([
      this.prisma.materialItem.findMany({
        include: {
          boms: true,
          inventories: {
            include: { supplier: true },
          },
        },
      }),
      this.prisma.materialInventory.findMany({
        include: { material: true },
      }),
      this.prisma.workOrder.findMany({
        where: { stage: { not: 'FINISHED_GOODS' } },
        include: {
          lead: {
            include: {
              sampleRequests: {
                where: { stage: 'APPROVED' },
                include: {
                  billOfMaterials: { include: { material: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        include: {
          items: true,
          inbounds: true,
          supplier: true,
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.stockOpname.findMany({
        where: { status: 'COMPLETED' },
        include: { items: true },
        orderBy: { opnameDate: 'desc' },
        take: 5,
      }),
      this.prisma.deliveryOrder.findMany({
        where: { shippedAt: { gte: thirtyDaysAgo } },
        include: { workOrder: true },
      }),
      this.prisma.supplier.findMany(),
    ]);

    // --- 1. CARD A: INVENTORY HEALTH ---
    const accuracy =
      opnames.length > 0
        ? opnames.reduce((avg, op) => {
            const totalSys = op.items.reduce(
              (s, i) => s + Number(i.systemQty),
              0,
            );
            const totalAct = op.items.reduce(
              (s, i) => s + Number(i.actualQty),
              0,
            );
            const acc =
              totalSys > 0
                ? Math.max(
                    0,
                    100 - (Math.abs(totalSys - totalAct) / totalSys) * 100,
                  )
                : 100;
            return avg + acc;
          }, 0) / opnames.length
        : 98.5;

    const criticalStockCount = materials.filter((m) => {
      const stock = m.inventories.reduce(
        (s, i) => s + Number(i.currentStock),
        0,
      );
      return stock < Number(m.reorderPoint);
    }).length;

    const inventoryInsight =
      criticalStockCount > 5
        ? `⚠️ ${criticalStockCount} SKU di bawah ROP. Segera rilis PR.`
        : accuracy < 95
          ? '📉 Akurasi stok rendah. Perlu audit investigasi.'
          : '✅ Stok sehat & akurasi terjaga.';

    // --- 2. CARD B: PROCUREMENT EFFICIENCY ---
    const deliveredPOs = pos.filter(
      (p) => p.status === 'RECEIVED' && p.inbounds.length > 0,
    );
    const totalLeadTime = deliveredPOs.reduce((sum, p) => {
      const inbound = p.inbounds[0];
      return (
        sum +
        (inbound.receivedAt.getTime() - p.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }, 0);
    const avgLeadTime =
      deliveredPOs.length > 0 ? totalLeadTime / deliveredPOs.length : 0;

    const avgSupplierScore =
      suppliers.length > 0
        ? suppliers.reduce((s, sup) => s + (sup.performanceScore || 0), 0) /
          suppliers.length
        : 0;

    let totalSavings = 0;
    pos.forEach((po) => {
      po.items.forEach((item) => {
        const master = materials.find((m) => m.id === item.materialId);
        if (master) {
          const diff = Number(master.unitPrice) - Number(item.unitPrice);
          totalSavings += diff * Number(item.quantity);
        }
      });
    });

    const procurementInsight =
      avgLeadTime > 7
        ? '⏳ Lead time vendor meningkat. Evaluasi alternatif.'
        : totalSavings > 10000000
          ? '💰 Saving target tercapai (Nego Win).'
          : '🎯 Efisiensi harga dalam parameter normal.';

    // --- 3. CARD C: WAREHOUSE OPS ---
    const totalOrdered = pos.reduce(
      (sum, p) => sum + p.items.reduce((s, i) => s + Number(i.quantity), 0),
      0,
    );
    const totalReceived = pos.reduce(
      (sum, p) => sum + p.items.reduce((s, i) => s + Number(i.receivedQty), 0),
      0,
    );
    const fulfillmentRate =
      totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 100;

    const purchaseReturns = pos.filter(
      (p) => p.status === POStatus.RETURNED,
    ).length;
    const returnRate =
      pos.length > 0 ? (purchaseReturns / pos.length) * 100 : 0;

    const warehouseInsight =
      fulfillmentRate < 90
        ? '📦 Fulfillment rate rendah. Cek partial delivery.'
        : '⚡ Operasional gudang stabil & cepat.';

    // --- 4. CARD D: LOGISTICS COST ---
    const totalShipping = workOrders.reduce(
      (sum, wo) => sum + Number(wo.actualCogs || 0) * 0.05, // Mock: 5% of COGS as shipping
      0,
    );
    const shippingPerUnit =
      workOrders.length > 0
        ? totalShipping / workOrders.reduce((s, w) => s + w.targetQty, 0)
        : 0;

    const onTimeDeliveryCount = deliveries.filter((d) => {
      return d.shippedAt <= (d.workOrder?.targetCompletion || new Date());
    }).length;
    const otdRate =
      deliveries.length > 0
        ? (onTimeDeliveryCount / deliveries.length) * 100
        : 95;

    const logisticsInsight =
      otdRate < 90
        ? '🚚 Keterlambatan pengiriman terdeteksi (OTD Drop).'
        : '🛣️ Jalur distribusi lancar.';

    // --- 5. DETAILED TABLES ---

    // Table 1: Reconciliation Audit
    const reconciliationTable =
      opnames[0]?.items.map((item) => ({
        sku: item.materialId.slice(0, 8),
        name:
          materials.find((m) => m.id === item.materialId)?.name || 'Unknown',
        systemStock: item.systemQty,
        actualStock: item.actualQty,
        variance: Number(item.actualQty) - Number(item.systemQty),
        lastAudit: opnames[0].opnameDate,
        status: item.systemQty === item.actualQty ? 'SYNC' : 'MISMATCH',
      })) || [];

    // Table 2: Procurement Tracker
    const procurementTracker = pos.slice(0, 10).map((po) => {
      const inbound = po.inbounds[0];
      const leadDays = inbound
        ? Math.round(
            (inbound.receivedAt.getTime() - po.createdAt.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        poId: po.poNumber,
        vendor: po.supplier?.name || 'N/A',
        item: po.items[0]?.materialId.slice(0, 8) || 'Multi',
        poDate: po.createdAt,
        recvDate: inbound?.receivedAt,
        leadTime: leadDays,
        quality: inbound?.status === 'APPROVED' ? 'QC PASSED' : 'PENDING',
      };
    });

    // Table 3: Expiration Watch
    const expirationWatch = inventories
      .filter((inv) => inv.expDate)
      .sort((a, b) => a.expDate!.getTime() - b.expDate!.getTime())
      .slice(0, 10)
      .map((inv) => {
        const daysRemaining = Math.round(
          (inv.expDate!.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return {
          sku: inv.material.name,
          batch: inv.batchNumber,
          expDate: inv.expDate,
          daysRemaining,
          value: Number(inv.currentStock) * Number(inv.material.unitPrice),
          action:
            daysRemaining < 30
              ? 'DISCOUNT'
              : daysRemaining < 0
                ? 'DISCARD'
                : 'MONITOR',
        };
      });

    // --- 6. PROCUREMENT SUGGESTIONS (OPERATIONAL) ---
    const materialCommitments: Record<string, number> = {};
    workOrders.forEach((wo) => {
      const bom = wo.lead.sampleRequests[0]?.billOfMaterials || [];
      bom.forEach((item: any) => {
        const qty = Number(wo.targetQty) * Number(item.quantityPerUnit);
        materialCommitments[item.materialId] =
          (materialCommitments[item.materialId] || 0) + qty;
      });
    });

    const materialIncoming: Record<string, number> = {};
    pos
      .filter((p) => p.status === 'ORDERED' || p.status === 'SHIPPED')
      .forEach((po) => {
        po.items.forEach((item) => {
          const remaining = Number(item.quantity) - Number(item.receivedQty);
          if (remaining > 0) {
            materialIncoming[item.materialId] =
              (materialIncoming[item.materialId] || 0) + remaining;
          }
        });
      });

    const procurementSuggestions = materials
      .map((m) => {
        const stock = m.inventories.reduce(
          (s, i) => s + Number(i.currentStock),
          0,
        );
        const commitment = materialCommitments[m.id] || 0;
        const incoming = materialIncoming[m.id] || 0;
        const safety = Number(m.reorderPoint);

        const netRequirement = commitment + safety - (stock + incoming);

        const commitmentsBreakdown = workOrders
          .map((wo) => {
            const bom = wo.lead.sampleRequests[0]?.billOfMaterials || [];
            const item = bom.find((b: any) => b.materialId === m.id);
            if (item) {
              return {
                woNumber: wo.woNumber,
                clientName: wo.lead.clientName,
                qtyNeeded: Number(wo.targetQty) * Number(item.quantityPerUnit),
                targetCompletion: wo.targetCompletion,
              };
            }
            return null;
          })
          .filter(Boolean);

        return {
          materialId: m.id,
          name: m.name,
          type: m.type,
          currentStock: stock,
          commitment,
          incoming,
          reorderPoint: safety,
          suggestedQty: netRequirement > 0 ? netRequirement : 0,
          suggestedSupplier: m.inventories[0]?.supplier?.name || 'SEARCHING...',
          expectedOtd: m.inventories[0]?.supplier?.performanceScore || 0,
          commitmentsBreakdown,
          priority:
            stock <= 0 || stock < commitment
              ? 'URGENT'
              : stock < commitment + safety
                ? 'MEDIUM'
                : 'LOW',
        };
      })
      .filter((s) => s.suggestedQty > 0 || s.currentStock < s.reorderPoint)
      .sort((a, b) => {
        const priorityScore: Record<string, number> = {
          URGENT: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        return priorityScore[b.priority] - priorityScore[a.priority];
      });

    return {
      cards: {
        inventory: {
          accuracy: Number(accuracy.toFixed(1)),
          totalSku: materials.length,
          criticalStock: criticalStockCount,
          insight: inventoryInsight,
        },
        procurement: {
          leadTime: Number(avgLeadTime.toFixed(1)),
          supplierPerf: Number(avgSupplierScore.toFixed(1)),
          savingPercent: Number(
            (
              (totalSavings / (totalReceived * 1000 || 1)) * // Mock total spend
              100
            ).toFixed(1),
          ),
          insight: procurementInsight,
        },
        warehouse: {
          putawaySpeed: '4.2h', // Mock/calculated
          fulfillment: Number(fulfillmentRate.toFixed(1)),
          returnRate: Number(returnRate.toFixed(1)),
          insight: warehouseInsight,
        },
        logistics: {
          shippingPerUnit: Number(shippingPerUnit.toFixed(0)),
          damageRate: '0.4%', // Mock
          otd: Number(otdRate.toFixed(1)),
          insight: logisticsInsight,
        },
      },
      categories: [], // Placeholder for workbench compatibility
      tables: {
        reconciliation: reconciliationTable,
        procurementTracker,
        expirationWatch,
        workOrders: workOrders.map((wo) => ({
          id: wo.id,
          product: wo.woNumber,
          targetQty: wo.targetQty,
          boStatus: 'CHECKING',
          gap: 0,
          poStatus: 'N/A',
          estArrival: null,
          supplierScore: 4.5,
        })),
        materials: [],
        perfRaw: [],
        perfPack: [],
        perfBox: [],
        perfLabel: [],
      },
      procurementSuggestions,
      highFrequency: {
        raw: materials
          .filter((m: any) => m.type === 'RAW_MATERIAL')
          .slice(0, 10)
          .map((m: any) => {
            const freq = pos.filter((p: any) =>
              p.items?.some((i: any) => i.materialId === m.id),
            ).length;
            return {
              name: m.name,
              freq: freq > 0 ? `${freq}x` : '0x',
              turnover: freq > 0 ? `${(freq * 3).toFixed(0)}kg` : '-',
            };
          }),
        pack: materials
          .filter((m: any) => m.type === 'PACKAGING')
          .slice(0, 10)
          .map((m: any) => {
            const freq = pos.filter((p: any) =>
              p.items?.some((i: any) => i.materialId === m.id),
            ).length;
            return {
              name: m.name,
              freq: freq > 0 ? `${freq}x` : '0x',
              turnover: freq > 0 ? `${(freq * 100).toFixed(0)}pcs` : '-',
            };
          }),
        box: materials
          .filter((m: any) => m.type === 'BOX')
          .slice(0, 5)
          .map((m: any) => {
            const freq = pos.filter((p: any) =>
              p.items?.some((i: any) => i.materialId === m.id),
            ).length;
            return {
              name: m.name,
              freq: freq > 0 ? `${freq}x` : '0x',
              consumption: freq > 0 ? `${(freq * 2).toFixed(0)} unit` : '-',
            };
          }),
        label: materials
          .filter((m: any) => m.type === 'LABEL')
          .slice(0, 5)
          .map((m: any) => {
            const freq = pos.filter((p: any) =>
              p.items?.some((i: any) => i.materialId === m.id),
            ).length;
            return {
              name: m.name,
              freq: freq > 0 ? `${freq}x` : '0x',
              consumption: freq > 0 ? `${(freq * 500).toFixed(0)} pcs` : '-',
            };
          }),
      },
    };
  }

  // --- HPP REQUEST MANAGEMENT ---
  async getHppRequests() {
    const leads = await this.prisma.salesLead.findMany({
      where: {
        status: {
          in: [
            'SAMPLE_REQUESTED',
            'SAMPLE_SENT',
            'SAMPLE_APPROVED',
            'NEGOTIATION',
            'SPK_SIGNED',
          ],
        },
      },
      include: {
        sampleRequests: {
          include: {
            billOfMaterials: { include: { material: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return leads.map((l, index) => {
      const sample = l.sampleRequests[0];
      const moq = l.moq > 0 ? l.moq : 5000;
      const calculatedHpp = sample?.targetHpp
        ? Number(sample.targetHpp)
        : l.unitPrice
          ? Number(l.unitPrice)
          : 18500;
      const status =
        l.status === 'SAMPLE_APPROVED' || l.status === 'SPK_SIGNED'
          ? 'APPROVED'
          : l.status === 'SAMPLE_SENT'
            ? 'IN_REVIEW'
            : 'PENDING';

      return {
        id: l.id,
        code: `HPP-${new Date(l.createdAt).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        date: l.createdAt.toISOString().slice(0, 10),
        customerId: l.id,
        customerName: l.clientName,
        productId: sample?.id || l.id,
        productName:
          sample?.productName || l.productInterest || 'Produk Maklon Kosmetik',
        formulaId: l.formulaId || 'formula-std',
        formulaName: sample
          ? `Formula ${sample.productName}`
          : 'Formula Kosmetik Standar CPKB',
        moq: moq,
        status: status,
        calculatedHpp: calculatedHpp,
        notes: l.notes || `Permintaan kalkulasi HPP untuk ${l.clientName}`,
        createdAt: l.createdAt.toISOString(),
        updatedAt: (l.updatedAt || l.createdAt).toISOString(),
      };
    });
  }

  async createHppRequest(dto: any) {
    const lead = await this.prisma.salesLead.findFirst({
      where: { id: dto.customerId },
    });

    if (lead) {
      await this.prisma.salesLead.update({
        where: { id: lead.id },
        data: {
          moq: Number(dto.moq) || lead.moq,
          notes: dto.notes
            ? `${lead.notes || ''} | HPP Req: ${dto.notes}`
            : lead.notes,
        },
      });
      return { id: lead.id, success: true };
    }

    return { id: `hpp-${Date.now()}`, success: true };
  }

  async updateHppStatus(id: string, status: string, calculatedHpp?: number) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id },
    });

    if (lead) {
      await this.prisma.salesLead.update({
        where: { id: lead.id },
        data: {
          status: status === 'APPROVED' ? 'SAMPLE_APPROVED' : lead.status,
          unitPrice:
            calculatedHpp !== undefined ? calculatedHpp : lead.unitPrice,
        },
      });
    }

    return { id, status, calculatedHpp, success: true };
  }

  // Item 38: Dynamic pending count for purchase approvals
  async getPendingApprovalCount(): Promise<{ count: number }> {
    const count = await this.prisma.purchaseOrder.count({
      where: { status: 'PENDING_APPROVAL' },
    });
    return { count };
  }
}
