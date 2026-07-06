import { QCStatus, OutboundMethod, MaterialStatus } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface E2EIds {
  warehouse1: string; warehouse2: string;
  rawA: string; packA: string; labelA: string; rawB: string;
  supplier: string; woId: string; userId: string;
  batch001: string; batch002: string;
}

let seeding = false;
export async function seedWarehouseE2E(prisma: PrismaService): Promise<E2EIds> {
  if (seeding) throw new Error('Re-entry detected in seedWarehouseE2E');
  seeding = true;
  try {
  const existing = await prisma.materialItem.findFirst({ where: { code: 'E2E-RAW-A' } });
  if (existing) {
    const sup = await prisma.supplier.findFirst({ where: { name: 'E2E Test Supplier' } });
    const wo = await prisma.workOrder.findFirst({ where: { woNumber: 'E2E-WO-001' } });
    const user = await prisma.user.findFirst({ where: { email: 'admin@e2e.warehouse' } });
    const b1 = await prisma.materialInventory.findFirst({ where: { batchNumber: 'E2E-BATCH-001' } });
    const b2 = await prisma.materialInventory.findFirst({ where: { batchNumber: 'E2E-BATCH-002' } });
    const rawA = await prisma.materialItem.findFirst({ where: { code: 'E2E-RAW-A' } });
    const packA = await prisma.materialItem.findFirst({ where: { code: 'E2E-PACK-A' } });
    const labelA = await prisma.materialItem.findFirst({ where: { code: 'E2E-LABEL-A' } });
    const rawB = await prisma.materialItem.findFirst({ where: { code: 'E2E-RAW-B' } });
    const wh1 = await prisma.warehouse.findFirst({ where: { name: 'Gudang Utama E2E' } });
    const wh2 = await prisma.warehouse.findFirst({ where: { name: 'Gudang Produksi E2E' } });
    if (!sup || !wo || !rawA || !packA || !user || !b1 || !b2 || !wh1 || !wh2) {
      await cleanupWarehouseE2E(prisma);
      seeding = false;
      return seedWarehouseE2E(prisma);
    }
    return {
      warehouse1: wh1!.id, warehouse2: wh2!.id,
      rawA: rawA!.id, packA: packA!.id, labelA: labelA!.id, rawB: rawB ? rawB.id : '',
      supplier: sup!.id, woId: wo!.id, userId: user!.id,
      batch001: b1!.id, batch002: b2!.id,
    };
  }

  const warehouse1 = await prisma.warehouse.create({
    data: { name: 'Gudang Utama E2E', picName: 'E2E Tester', status: 'ACTIVE' },
  });
  const warehouse2 = await prisma.warehouse.create({
    data: { name: 'Gudang Produksi E2E', picName: 'E2E Tester', status: 'ACTIVE' },
  });

  await prisma.warehouseLocation.createMany({
    data: [
      { name: 'Rak A1 E2E (AMBIENT)', capacity: 10000, currentUsage: 0, type: 'AMBIENT', warehouseId: warehouse1.id },
      { name: 'Rak B2 E2E (COOL_ROOM)', capacity: 5000, currentUsage: 0, type: 'COOL_ROOM', warehouseId: warehouse1.id },
    ],
  });

  const supplier = await prisma.supplier.create({
    data: { name: 'E2E Test Supplier', performanceScore: 5 },
  });

  const rawA = await prisma.materialItem.create({
    data: {
      name: 'E2E Raw Material A (FEFO)', code: 'E2E-RAW-A',
      type: 'RAW_MATERIAL', unit: 'KG', unitPrice: 10000, minLevel: 10, maxLevel: 1000,
      reorderPoint: 20, outMethod: OutboundMethod.FEFO, leadTime: 7, status: MaterialStatus.ACTIVE,
      stockQty: 200, isCritical: true,
    },
  });
  await prisma.materialItem.create({
    data: {
      name: 'E2E Raw Material B (BULK)', code: 'E2E-RAW-B',
      type: 'RAW_MATERIAL', unit: 'KG', unitPrice: 15000, minLevel: 10, maxLevel: 500,
      reorderPoint: 15, outMethod: OutboundMethod.FEFO, leadTime: 14, status: MaterialStatus.ACTIVE,
      stockQty: 100,
    },
  });
  const packA = await prisma.materialItem.create({
    data: {
      name: 'E2E Packaging A (FIFO)', code: 'E2E-PACK-A',
      type: 'PACKAGING', unit: 'PCS', unitPrice: 2000, minLevel: 50, maxLevel: 5000,
      reorderPoint: 100, outMethod: OutboundMethod.FIFO, leadTime: 3, status: MaterialStatus.ACTIVE,
      stockQty: 500,
    },
  });
  const labelA = await prisma.materialItem.create({
    data: {
      name: 'E2E Label A (slow mover)', code: 'E2E-LABEL-A',
      type: 'LABEL', unit: 'PCS', unitPrice: 500, minLevel: 100, maxLevel: 10000,
      reorderPoint: 200, outMethod: OutboundMethod.FIFO, leadTime: 5, status: MaterialStatus.ACTIVE,
      stockQty: 50,
    },
  });

  const future30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const future60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const future90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const b1 = await prisma.materialInventory.create({
    data: { materialId: rawA.id, supplierId: supplier.id, batchNumber: 'E2E-BATCH-001', currentStock: 100, expDate: future30, qcStatus: QCStatus.GOOD, receivingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
  });
  const b2 = await prisma.materialInventory.create({
    data: { materialId: rawA.id, supplierId: supplier.id, batchNumber: 'E2E-BATCH-002', currentStock: 100, expDate: future60, qcStatus: QCStatus.GOOD, receivingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  await prisma.materialInventory.create({
    data: { materialId: packA.id, supplierId: supplier.id, batchNumber: 'E2E-PACK-BATCH-001', currentStock: 300, expDate: future90, qcStatus: QCStatus.GOOD },
  });
  await prisma.materialInventory.create({
    data: { materialId: packA.id, supplierId: supplier.id, batchNumber: 'E2E-PACK-BATCH-002', currentStock: 200, expDate: future90, qcStatus: QCStatus.GOOD },
  });

  await prisma.materialValuation.create({
    data: {
      materialId: rawA.id, movingAveragePrice: 10000, lastPurchasePrice: 10000,
      totalQty: 200, totalValue: 2000000, referenceNo: 'E2E-SEED',
    },
  });

  const bdStaff = await prisma.bussdevStaff.upsert({
    where: { id: '00000000-0000-4000-a000-000000000099' },
    update: {},
    create: { id: '00000000-0000-4000-a000-000000000099', name: 'E2E BD Staff', targetRevenue: 1000000000 },
  });

  const lead = await prisma.salesLead.create({
    data: {
      clientName: 'E2E Client', brandName: 'E2E Brand',
      productInterest: 'E2E Serum', status: 'SPK_SIGNED', contactInfo: 'e2e@test.com', source: 'DIRECT',
      picId: bdStaff.id, estimatedValue: 100000000, moq: 100,
    },
  });

  const sampleReq = await prisma.sampleRequest.create({
    data: {
      leadId: lead.id, stage: 'APPROVED', productName: 'E2E Serum Sample',
      sampleCode: 'E2E-SMP-001', targetFunction: 'Moisturizer',
      textureReq: 'Cream', colorReq: 'White', aromaReq: 'Unscented',
    },
  });

  await prisma.billOfMaterial.createMany({
    data: [
      { materialId: rawA.id, quantityPerUnit: 5, sampleId: sampleReq.id },
      { materialId: packA.id, quantityPerUnit: 10, sampleId: sampleReq.id },
    ],
  });

  const wo = await prisma.workOrder.create({
    data: {
      woNumber: 'E2E-WO-001', leadId: lead.id,
      targetQty: 10, targetCompletion: future60, stage: 'WAITING_MATERIAL',
    },
  });

  const hashedPin = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@e2e.warehouse' },
    update: { fullName: 'E2E Admin', roles: ['SUPER_ADMIN', 'WAREHOUSE'], managerPin: hashedPin },
    create: {
      email: 'admin@e2e.warehouse', fullName: 'E2E Admin', passwordHash: 'hashed',
      roles: ['SUPER_ADMIN', 'WAREHOUSE'], managerPin: hashedPin,
    },
  });

  await prisma.inventoryTransaction.createMany({
    data: [
      { materialId: rawA.id, type: 'OUTBOUND', quantity: 80, referenceNo: 'E2E-FAST-1', notes: 'E2E usage data', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { materialId: rawA.id, type: 'OUTBOUND', quantity: 60, referenceNo: 'E2E-FAST-2', notes: 'E2E usage data', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { materialId: packA.id, type: 'OUTBOUND', quantity: 40, referenceNo: 'E2E-FAST-3', notes: 'E2E usage data', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { materialId: packA.id, type: 'OUTBOUND', quantity: 30, referenceNo: 'E2E-FAST-4', notes: 'E2E usage data', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    ],
  });

  return {
    warehouse1: warehouse1.id, warehouse2: warehouse2.id,
    rawA: rawA.id, packA: packA.id, labelA: labelA.id, rawB: '',
    supplier: supplier.id, woId: wo.id, userId: user.id,
    batch001: b1.id, batch002: b2.id,
  };
  } finally { seeding = false; }
}

export async function cleanupWarehouseE2E(prisma: PrismaService) {
  try {
    // Collect IDs first to avoid nested filter issues with deleteMany
    const matIds = (await prisma.materialItem.findMany({ where: { code: { startsWith: 'E2E-' } }, select: { id: true } })).map(m => m.id);
    const whIds = (await prisma.warehouse.findMany({ where: { name: { contains: 'E2E' } }, select: { id: true } })).map(m => m.id);
    const srIds = (await prisma.sampleRequest.findMany({ where: { sampleCode: { startsWith: 'E2E-' } }, select: { id: true } })).map(m => m.id);
    const woIds = (await prisma.workOrder.findMany({ where: { woNumber: { startsWith: 'E2E-' } }, select: { id: true } })).map(m => m.id);
    const slIds = (await prisma.salesLead.findMany({ where: { clientName: { startsWith: 'E2E-' } }, select: { id: true } })).map(m => m.id);

    if (matIds.length > 0) {
      await prisma.inventoryTransaction.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.materialInventory.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.materialValuation.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.billOfMaterial.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.materialRequisition.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.inboundItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.stockAdjustmentItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.stockOpnameItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.transferOrderItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.purchaseReturnItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.purchaseOrderItem.deleteMany({ where: { materialId: { in: matIds } } });
      await prisma.purchaseRequestItem.deleteMany({ where: { materialId: { in: matIds } } });
    }
    if (srIds.length > 0) {
      await prisma.billOfMaterial.deleteMany({ where: { sampleId: { in: srIds } } });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: srIds } } });
    }
    if (woIds.length > 0) {
      await prisma.productionLog.deleteMany({ where: { workOrderId: { in: woIds } } });
      await prisma.productionSchedule.deleteMany({ where: { workOrderId: { in: woIds } } });
      await prisma.materialRequisition.deleteMany({ where: { workOrderId: { in: woIds } } });
      await prisma.workOrder.deleteMany({ where: { id: { in: woIds } } });
    }
    if (slIds.length > 0) await prisma.salesLead.deleteMany({ where: { id: { in: slIds } } });
    if (matIds.length > 0) await prisma.materialItem.deleteMany({ where: { id: { in: matIds } } });
    await prisma.supplier.deleteMany({ where: { name: 'E2E Test Supplier' } });
    if (whIds.length > 0) {
      await prisma.warehouseLocation.deleteMany({ where: { warehouseId: { in: whIds } } });
      await prisma.warehouse.deleteMany({ where: { id: { in: whIds } } });
    }
    await prisma.user.deleteMany({ where: { email: 'admin@e2e.warehouse' } });
    await prisma.bussdevStaff.deleteMany({ where: { name: { startsWith: 'E2E' } } });
  } catch (e) {
    console.warn('cleanup issue:', (e as Error).message.substring(0, 150));
  }
}
