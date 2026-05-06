import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { Division, StreamEventType } from '@prisma/client';

@Injectable()
export class ScmService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async checkMaterialReadiness(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        lead: {
          include: {
            sampleRequests: {
              where: { stage: 'APPROVED' },
              include: {
                billOfMaterials: {
                  include: {
                    material: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with ID ${workOrderId} not found`);
    }

    const sampleRequest = workOrder.lead.sampleRequests[0];
    if (!sampleRequest) {
      return { status: 'NO_APPROVED_SAMPLE', details: [] };
    }

    const readinessDetails = await Promise.all(
      sampleRequest.billOfMaterials.map(async (bom: any) => {
        const totalRequired =
          Number(workOrder.targetQty) * Number(bom.quantityPerUnit);

        const inventories = await this.prisma.materialInventory.findMany({
          where: { materialId: bom.materialId },
        });

        const actualStock = inventories.reduce(
          (sum: number, inv: any) => sum + Number(inv.currentStock),
          0,
        );

        const shortage = actualStock - totalRequired;

        return {
          materialId: bom.materialId,
          materialName: bom.material?.name || 'Unknown',
          totalRequired,
          actualStock,
          shortage: shortage < 0 ? Math.abs(shortage) : 0,
          status: shortage < 0 ? 'SHORTAGE' : 'READY',
        };
      }),
    );

    const hasShortage = readinessDetails.some(
      (d: any) => d.status === 'SHORTAGE',
    );

    return {
      status: hasShortage ? 'SHORTAGE' : 'READY',
      readinessDetails,
    };
  }

  async getActiveWorkOrders() {
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        stage: { not: 'FINISHED_GOODS' },
      },
      include: {
        lead: true,
      },
    });

    const woIds = workOrders.map((wo) => wo.id);
    const [releaseLogs, ...readinessResults] = await Promise.all([
      this.prisma.productionLog.findMany({
        where: {
          workOrderId: { in: woIds },
          notes: 'SYSTEM: MATERIAL_RELEASED_BY_WAREHOUSE',
        },
      }),
      ...workOrders.map((wo) => this.checkMaterialReadiness(wo.id)),
    ]);
    const releasedWoIds = new Set(releaseLogs.map((l) => l.workOrderId));

    return workOrders.map((wo, i) => ({
      ...wo,
      materialReadiness: readinessResults[i].status,
      readinessDetails: readinessResults[i].readinessDetails,
      isReleased: releasedWoIds.has(wo.id),
    }));
  }

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
      (p) => (p.status as string) === 'RETURNED',
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

  // async stockAdjustment(data: any) {
  //   return this.prisma.$transaction(async (tx) => {
  //     const adjustment = await tx.stockAdjustment.create({
  //       data: {
  //         materialId: data.materialId,
  //         warehouseId: data.warehouseId,
  //         type: data.type,
  //         quantity: data.quantity,
  //         reason: data.reason,
  //         adjustedById: data.userId,
  //       },
  //     });

  //     // Update Inventory
  //     const multiplier = data.type === 'ADD' ? 1 : -1;
  //     await tx.materialInventory.update({
  //       where: {
  //         materialId_warehouseId: {
  //           materialId: data.materialId,
  //           warehouseId: data.warehouseId,
  //         },
  //       },
  //       data: {
  //         currentStock: { increment: data.quantity * multiplier },
  //       },
  //     });

  //     return adjustment;
  //   });
  // }

  // async createTransferOrder(data: any) {
  //   return this.prisma.transferOrder.create({
  //     data: {
  //       materialId: data.materialId,
  //       fromWarehouseId: data.fromWarehouseId,
  //       toWarehouseId: data.toWarehouseId,
  //       quantity: data.quantity,
  //       status: 'PENDING',
  async initializePurchaseFromSuggestion(materialId: string, userId: string) {
    const material = await this.prisma.materialItem.findUnique({
      where: { id: materialId },
      include: {
        inventories: {
          include: { supplier: true },
          orderBy: { receivingDate: 'desc' },
        },
      },
    });

    if (!material) throw new NotFoundException('Material not found');

    const supplierRecord = (material as any).inventories[0];
    if (!supplierRecord)
      throw new BadRequestException(
        'No supplier history found for this material',
      );

    const supplier = supplierRecord.supplier;

    // Calculate suggestion (simplified version of the one in dashboard)
    const materialInventories = (material as any).inventories;
    const stock = materialInventories.reduce(
      (s: number, i: any) => s + Number(i.currentStock),
      0,
    );
    const safety = Number(material.reorderPoint);

    // We fetch active WOs to get commitment
    const workOrders = await this.prisma.workOrder.findMany({
      where: { stage: { not: 'FINISHED_GOODS' } },
      include: {
        lead: {
          include: {
            sampleRequests: {
              where: { stage: 'APPROVED' },
              include: { billOfMaterials: true },
            },
          },
        },
      },
    });

    let commitment = 0;
    workOrders.forEach((wo) => {
      const bom = wo.lead.sampleRequests[0]?.billOfMaterials || [];
      const item = bom.find((b: any) => b.materialId === materialId);
      if (item)
        commitment += Number(wo.targetQty) * Number(item.quantityPerUnit);
    });

    const netNeeded = commitment + safety - stock;
    const finalQty = netNeeded > 0 ? netNeeded : safety;

    const poNumber = `PO-AUTO-${Date.now().toString().slice(-6)}`;

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier.id,
        scmId: userId,
        totalValue: finalQty * Number(material.unitPrice),
        status: 'ORDERED',
        items: {
          create: [
            {
              materialId,
              quantity: finalQty,
              unitPrice: material.unitPrice,
              totalPrice: finalQty * Number(material.unitPrice),
            },
          ],
        },
      },
      include: { items: true, supplier: true },
    });
  }

  /**
   * PHASE 3: Automated Purchase Request (PR) Trigger
   * Triggered when a Lead passes Financial Gate 2 (DP Paid)
   */
  async autoCreatePurchaseRequestFromLead(leadId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get BOM requirements from Approved Sample
      const sample = await tx.sampleRequest.findFirst({
        where: { leadId, stage: 'APPROVED' },
        include: {
          billOfMaterials: { include: { material: true } },
          lead: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!sample)
        return { status: 'SKIPPED', reason: 'No approved sample found' };

      // Get SO quantity instead of lead MOQ
      const so = await tx.salesOrder.findFirst({
        where: { leadId, status: { in: ['LOCKED_ACTIVE', 'PENDING_DP'] } },
        orderBy: { createdAt: 'desc' },
      });
      const requiredQty = so?.quantity || Number(sample.lead.moq || 0);
      const warehouse = await tx.warehouse.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!warehouse)
        throw new Error('No active warehouse found for PR auto-gen');

      const prItems = [];

      for (const bom of sample.billOfMaterials) {
        const totalRequired = requiredQty * Number(bom.quantityPerUnit);

        // Check current global stock
        const inventories = await tx.materialInventory.findMany({
          where: { materialId: bom.materialId },
        });
        const currentStock = inventories.reduce(
          (sum, inv) => sum + Number(inv.currentStock),
          0,
        );

        if (currentStock < totalRequired) {
          const shortage = totalRequired - currentStock;
          prItems.push({
            materialId: bom.materialId,
            qtyRequired: shortage,
            estimatedPrice: bom.material.unitPrice,
          });
        }
      }

      if (prItems.length === 0) {
        return {
          status: 'STOCK_READY',
          message: 'All materials available in stock',
        };
      }

      // 2. Create Purchase Request (PR)
      const pr = await tx.purchaseRequest.create({
        data: {
          warehouseId: warehouse.id,
          priority: 'HIGH',
          status: 'PENDING_APPROVAL_SCM',
          notes: `AUTO-PR: Financial Gate 2 Passed for Lead ${sample.lead.clientName}. Stock shortage detected.`,
          items: {
            create: prItems.map((item) => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired,
              estimatedPrice: item.estimatedPrice,
            })),
          },
        },
        include: { items: true },
      });

      return { status: 'PR_CREATED', prId: pr.id, itemCount: prItems.length };
    });
  }

  async approvePurchaseRequest(prId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.findUnique({
        where: { id: prId },
        include: { items: true, warehouse: true, supplier: true },
      });

      if (!pr) throw new NotFoundException('Purchase Request not found');
      if (pr.status !== 'PENDING_APPROVAL_SCM') {
        throw new BadRequestException(
          `PR status ${pr.status} — hanya PENDING_APPROVAL_SCM yang bisa di-approve`,
        );
      }

      const poNumber = await this.idGenerator.generateId('PO');

      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: pr.supplierId,
          scmId: userId,
          status: 'ORDERED',
          totalValue: pr.items.reduce(
            (sum, item) =>
              sum + Number(item.qtyRequired) * Number(item.estimatedPrice || 0),
            0,
          ),
          notes: `AUTO-PO FROM PR: ${pr.notes || ''}`.trim(),
          leadId: pr.notes?.includes('Lead') ? undefined : undefined,
          items: {
            create: pr.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.qtyRequired,
              unitPrice: item.estimatedPrice || 0,
              totalPrice:
                Number(item.qtyRequired) * Number(item.estimatedPrice || 0),
            })),
          },
        },
        include: { items: true },
      });

      await tx.purchaseRequest.update({
        where: { id: prId },
        data: { status: 'APPROVED' },
      });

      return po;
    });
  }

  async getPurchaseRequests() {
    return this.prisma.purchaseRequest.findMany({
      include: {
        items: { include: { material: true } },
        warehouse: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseRequest(dto: {
    warehouseId: string;
    priority?: string;
    requiredDate?: string;
    notes?: string;
    items: Array<{
      materialId: string;
      qtyRequired: number;
      estimatedPrice?: number;
    }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.create({
        data: {
          warehouseId: dto.warehouseId,
          priority: dto.priority || 'MEDIUM',
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired,
              estimatedPrice: item.estimatedPrice || 0,
            })),
          },
        },
        include: { items: { include: { material: true } }, warehouse: true },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: '',
        senderDivision: Division.SCM,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `Purchase Request created - ${pr.items.length} items, priority ${dto.priority || 'MEDIUM'}`,
        payload: { prId: pr.id },
      });

      this.eventEmitter.emit('scm.purchase_request.created', {
        prId: pr.id,
        warehouseId: dto.warehouseId,
        itemCount: pr.items.length,
        priority: dto.priority || 'MEDIUM',
      });

      return pr;
    });
  }

  @OnEvent('finance.payment_validated')
  async handleFinancePaymentValidated(payload: {
    leadId: string;
    activityId: string;
    amount: number;
    verifiedBy: string;
  }) {
    try {
      const lead = await this.prisma.salesLead.findUnique({
        where: { id: payload.leadId },
        select: { clientName: true },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: payload.leadId,
        senderDivision: Division.SCM,
        eventType: StreamEventType.GATE_OPENED,
        notes: `Payment validated (Rp ${payload.amount}). SCM procurement pipeline unlocked for ${lead?.clientName || payload.leadId}.`,
        payload,
        loggedBy: payload.verifiedBy,
      });
    } catch (err) {
      console.error(
        '[SCM] Error handling payment_validated:',
        (err as Error).message,
      );
    }
  }
}
