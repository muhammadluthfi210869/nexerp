import { PrismaClient, LocationType, QCStatus, TransactionType, ApprovalStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, randomDecimal, randomAprilDate } from './utils';

export async function seedWarehouse(prisma: PrismaClient) {
  console.log('🌱 Seeding Warehouse Data...');

  const users = await prisma.user.findMany();
  const ghufranUser = users.find(u => u.email === 'ghufran@nexerp.id') || users[0];
  const adminUser = users.find(u => u.email === 'admin@nexerp.id') || users[0];

  // 1. Create Warehouse 1 (Surabaya)
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Pabrik Utama Surabaya',
      picName: ghufranUser.fullName || 'Ghufran',
      description: 'Gudang pusat penyimpanan bahan baku, packaging, dan produk jadi',
      status: 'ACTIVE',
    }
  });

  // 2. Create Warehouse 2 (Jakarta)
  const warehouseJakarta = await prisma.warehouse.create({
    data: {
      name: 'Gudang Ritel Jakarta',
      picName: ghufranUser.fullName || 'Ghufran',
      description: 'Gudang distribusi produk jadi untuk wilayah Jabodetabek',
      status: 'ACTIVE',
    }
  });

  // 3. Create Warehouse Locations for Surabaya
  const locationData = [
    { name: 'Rack A-1', capacity: 10000, type: LocationType.AMBIENT },
    { name: 'Rack A-2', capacity: 10000, type: LocationType.AMBIENT },
    { name: 'Rack B-1', capacity: 10000, type: LocationType.AMBIENT },
    { name: 'Cold Storage 1', capacity: 5000, type: LocationType.COOL_ROOM },
    { name: 'Flammable Area 1', capacity: 2000, type: LocationType.FLAMMABLE },
    { name: 'Quarantine Area', capacity: 3000, type: LocationType.QUARANTINE },
  ];

  const locations = [];
  for (const loc of locationData) {
    const createdLoc = await prisma.warehouseLocation.create({
      data: {
        name: loc.name,
        capacity: loc.capacity,
        currentUsage: 0,
        type: loc.type,
        warehouseId: warehouse.id,
      }
    });
    locations.push(createdLoc);
  }

  // Create Warehouse Locations for Jakarta
  const locationDataJakarta = [
    { name: 'Rack J-1', capacity: 5000, type: LocationType.AMBIENT },
    { name: 'Rack J-2', capacity: 5000, type: LocationType.AMBIENT },
    { name: 'Cold Storage Jakarta', capacity: 2000, type: LocationType.COOL_ROOM },
  ];

  const locationsJakarta = [];
  for (const loc of locationDataJakarta) {
    const createdLoc = await prisma.warehouseLocation.create({
      data: {
        name: loc.name,
        capacity: loc.capacity,
        currentUsage: 0,
        type: loc.type,
        warehouseId: warehouseJakarta.id,
      }
    });
    locationsJakarta.push(createdLoc);
  }

  // 4. Fetch Materials & Suppliers
  const rawMaterials = await prisma.materialItem.findMany({ where: { type: 'RAW_MATERIAL' } });
  const packagingMaterials = await prisma.materialItem.findMany({ where: { type: 'PACKAGING' } });
  const suppliers = await prisma.supplier.findMany();

  if (rawMaterials.length === 0 || suppliers.length === 0) {
    throw new Error('Materials and Suppliers must be seeded before Warehouse data.');
  }

  // Combine all materials for stock distribution
  const allMaterials = [...rawMaterials, ...packagingMaterials];

  // 5. Seed Material Inventories (Stok Batches)
  console.log('📦 Seeding Material Inventories & Transactions...');
  
  for (const material of allMaterials) {
    let totalStock = 0;

    // Generate 1-2 batches per material in Surabaya
    const batchCount = randomInt(1, 2);
    for (let b = 0; b < batchCount; b++) {
      const supplier = randomElement(suppliers);
      const location = randomElement(locations);
      
      const stockQty = randomDecimal(100, 1000, 1);
      totalStock += stockQty;

      // Assign QC status: 80% GOOD, 15% QUARANTINE, 5% REJECT
      const randQc = Math.random();
      const qcStatus: QCStatus = randQc < 0.80 ? 'GOOD' : (randQc < 0.95 ? 'QUARANTINE' : 'REJECT');

      const expDate = faker.date.future({ years: 2 });
      const receivingDate = randomAprilDate();

      const batch = await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: `BATCH-${faker.string.alphanumeric(6).toUpperCase()}`,
          currentStock: stockQty,
          expDate,
          locationId: location.id,
          qcStatus,
          isSensitive: material.type === 'RAW_MATERIAL' && Math.random() > 0.7,
          auditAccuracy: randomDecimal(95, 100, 2),
          receivingDate,
          notes: `Penerimaan batch ke-${b+1} untuk item ${material.name}`,
        }
      });

      // Update Warehouse Location current usage
      await prisma.warehouseLocation.update({
        where: { id: location.id },
        data: {
          currentUsage: { increment: stockQty }
        }
      });

      // INBOUND transaction for the restock
      const poNumber = `PO-${faker.string.alphanumeric(6).toUpperCase()}`;
      await prisma.inventoryTransaction.create({
        data: {
          materialId: material.id,
          inventoryId: batch.id,
          type: 'INBOUND' as TransactionType,
          quantity: stockQty,
          referenceNo: poNumber,
          notes: `Inbound receiving batch ${batch.batchNumber}`,
          destLocId: location.id,
          performedBy: ghufranUser.email,
          unitValueAtTransaction: material.unitPrice,
          warehouseId: warehouse.id,
          createdAt: receivingDate,
        }
      });

      // Simulate an OUTBOUND transaction for some batches (25% chance)
      if (Math.random() > 0.75 && stockQty > 200) {
        const outboundQty = randomDecimal(50, 150, 1);
        const woNumber = `WO-${faker.string.alphanumeric(6).toUpperCase()}`;

        await prisma.inventoryTransaction.create({
          data: {
            materialId: material.id,
            inventoryId: batch.id,
            type: 'OUTBOUND' as TransactionType,
            quantity: outboundQty,
            referenceNo: woNumber,
            notes: `Outbound release to production for WO ${woNumber}`,
            sourceLocId: location.id,
            performedBy: ghufranUser.email,
            unitValueAtTransaction: material.unitPrice,
            warehouseId: warehouse.id,
            createdAt: faker.date.between({ from: receivingDate, to: new Date() }),
          }
        });

        // Deduct from the inventory
        await prisma.materialInventory.update({
          where: { id: batch.id },
          data: {
            currentStock: { decrement: outboundQty }
          }
        });

        // Deduct from location usage
        await prisma.warehouseLocation.update({
          where: { id: location.id },
          data: {
            currentUsage: { decrement: outboundQty }
          }
        });

        totalStock -= outboundQty;
      }
    }

    // Seed stock for Jakarta Gudang with 40% chance per material
    if (Math.random() < 0.4) {
      const supplier = randomElement(suppliers);
      const location = randomElement(locationsJakarta);
      
      const stockQty = randomDecimal(50, 400, 1);
      totalStock += stockQty;

      const expDate = faker.date.future({ years: 2 });
      const receivingDate = randomAprilDate();

      const batch = await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: `BATCH-JKT-${faker.string.alphanumeric(6).toUpperCase()}`,
          currentStock: stockQty,
          expDate,
          locationId: location.id,
          qcStatus: 'GOOD',
          receivingDate,
          notes: `Stok awal di Gudang Ritel Jakarta`,
        }
      });

      await prisma.warehouseLocation.update({
        where: { id: location.id },
        data: {
          currentUsage: { increment: stockQty }
        }
      });

      await prisma.inventoryTransaction.create({
        data: {
          materialId: material.id,
          inventoryId: batch.id,
          type: 'INBOUND' as TransactionType,
          quantity: stockQty,
          referenceNo: `PO-JKT-${faker.string.alphanumeric(6).toUpperCase()}`,
          notes: `Inbound receiving batch ${batch.batchNumber} ke Jakarta`,
          destLocId: location.id,
          performedBy: ghufranUser.email,
          unitValueAtTransaction: material.unitPrice,
          warehouseId: warehouseJakarta.id,
          createdAt: receivingDate,
        }
      });
    }

    // Update the stockQty cache in MaterialItem
    await prisma.materialItem.update({
      where: { id: material.id },
      data: { stockQty: totalStock }
    });
  }

  // 6. Seed Stock Opname (Audit fisik gudang)
  console.log('📋 Seeding Stock Opnames...');
  
  const opnameDate = new Date(2026, 3, 20); // April 20
  const opname = await prisma.stockOpname.create({
    data: {
      opnameNumber: `OPN-20260420-01`,
      opnameDate,
      warehouseId: warehouse.id,
      picId: ghufranUser.id,
      status: 'COMPLETED',
      approvalStatus: 'APPROVED' as ApprovalStatus,
      approvedById: adminUser.id,
      totalLossValue: 1250000,
      notes: 'Stock opname rutin bulanan area Rack A dan Rack B.',
    }
  });

  const opnameMaterials = rawMaterials.slice(0, 5);
  for (const mat of opnameMaterials) {
    const systemQty = Number(mat.stockQty);
    const diff = Math.random() > 0.6 ? -randomInt(5, 15) : 0;
    const actualQty = systemQty + diff;

    await prisma.stockOpnameItem.create({
      data: {
        opnameId: opname.id,
        materialId: mat.id,
        systemQty,
        actualQty,
        difference: diff,
      }
    });

    if (diff !== 0) {
      await prisma.inventoryTransaction.create({
        data: {
          materialId: mat.id,
          type: 'ADJUSTMENT' as TransactionType,
          quantity: Math.abs(diff),
          referenceNo: opname.opnameNumber,
          notes: `Penyesuaian stok opname: Selisih ${diff} ${mat.unit}`,
          performedBy: ghufranUser.email,
          unitValueAtTransaction: mat.unitPrice,
          warehouseId: warehouse.id,
          createdAt: opnameDate,
        }
      });

      await prisma.materialItem.update({
        where: { id: mat.id },
        data: { stockQty: { increment: diff } }
      });
    }
  }

  // 7. Seed Transfer Orders (Surabaya -> Jakarta)
  console.log('🚚 Seeding Warehouse Transfer Orders...');
  const transferStatuses = ['PENDING', 'SHIPPED', 'RECEIVED', 'CANCELLED'];
  for (let i = 0; i < 5; i++) {
    const status = transferStatuses[i % transferStatuses.length];
    const transferNumber = `TRF-202604${10 + i}-0${i + 1}`;
    const date = new Date(2026, 3, 10 + i);

    const to = await prisma.transferOrder.create({
      data: {
        transferNumber,
        date,
        sourceWarehouseId: warehouse.id,
        destWarehouseId: warehouseJakarta.id,
        vehicleNo: `B ${faker.number.int({ min: 1000, max: 9999 })} ${faker.string.alpha(2).toUpperCase()}`,
        createdById: adminUser.id,
        notes: `Transfer stok reguler Surabaya ke Jakarta ke-${i+1}`,
        status,
      }
    });

    const itemMaterials = packagingMaterials.slice(i % 3, (i % 3) + 2);
    for (const mat of itemMaterials) {
      await prisma.transferOrderItem.create({
        data: {
          transferId: to.id,
          materialId: mat.id,
          qty: randomDecimal(100, 300, 1),
        }
      });
    }
  }

  // 8. Seed Stock Adjustments (linked to COA HPP 5100)
  console.log('🔧 Seeding Stock Adjustments...');
  const adjustmentAccount = await prisma.account.findFirst({
    where: { code: '5100' }
  });
  
  if (adjustmentAccount) {
    for (let i = 0; i < 3; i++) {
      const adj = await prisma.stockAdjustment.create({
        data: {
          date: new Date(2026, 3, 15 + i),
          warehouseId: warehouse.id,
          type: i % 2 === 0 ? 'LOSS_ADJUST' : 'INCOME_ADJUST',
          accountId: adjustmentAccount.id,
          notes: i % 2 === 0 ? 'Penyusutan bahan baku/kemasan rusak' : 'Penyesuaian surplus timbangan stock opname',
        }
      });

      const mat = rawMaterials[i % rawMaterials.length];
      await prisma.stockAdjustmentItem.create({
        data: {
          adjustmentId: adj.id,
          materialId: mat.id,
          qty: i % 2 === 0 ? -randomDecimal(5, 20, 1) : randomDecimal(5, 20, 1),
        }
      });
    }
  }

  // 9. Seed Material Requisition Headers (multi-warehouse)
  console.log('📝 Seeding Material Requisition Headers...');
  for (let i = 0; i < 4; i++) {
    const reqNumber = `REQ-202604${12 + i}-0${i + 1}`;
    const requestDate = new Date(2026, 3, 12 + i);
    const statuses = ['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'];

    const header = await prisma.materialRequisitionHeader.create({
      data: {
        reqNumber,
        requestDate,
        fromWarehouse: warehouse.id,
        toWarehouse: warehouseJakarta.id,
        notes: `Permintaan material kemasan dari Jakarta ke pabrik Surabaya`,
        status: statuses[i] as any,
        createdById: adminUser.id,
        createdAt: requestDate,
      }
    });

    const itemMaterials = packagingMaterials.slice(i, i + 2);
    for (const mat of itemMaterials) {
      await prisma.materialRequisitionItem.create({
        data: {
          headerId: header.id,
          materialId: mat.id,
          qty: randomDecimal(50, 150, 1),
          notes: 'Kebutuhan mendesak retail Jakarta',
        }
      });
    }
  }

  console.log('✅ Warehouse Data Seeded.');
}
