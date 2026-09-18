const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
const envText = fs.readFileSync(path.join(rootDir, 'backend/.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

async function seedFase5() {
  console.log('--- START SEEDING FASE 5: GUDANG 3-PILAR, MUTASI & LOGISTIK ---');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const warehouses = await prisma.warehouse.findMany({ take: 5 });
    if (warehouses.length < 2) {
      throw new Error('Need at least 2 warehouses in database');
    }
    const whSource = warehouses[0]; // Gudang Bahan Baku
    const whDest = warehouses[1] || warehouses[0]; // Gudang Kemasan
    const whFinish = warehouses[2] || warehouses[0]; // Gudang Barang Jadi

    const materials = await prisma.materialItem.findMany({ take: 10 });
    if (materials.length === 0) {
      throw new Error('No materials found in database');
    }

    const salesOrders = await prisma.salesOrder.findMany({ take: 5 });
    const users = await prisma.user.findMany({ take: 5 });
    const defaultUser = users[0];

    const account = await prisma.account.findFirst();

    console.log(`Found ${warehouses.length} warehouses, ${materials.length} materials, ${salesOrders.length} sales orders`);

    // 1. Seed Transfer Orders (Mutasi Antar Gudang: /goods-transfer)
    console.log('Seeding Transfer Orders (Mutasi Antar Gudang)...');
    const transferData = [
      {
        transferNumber: 'TRF-2026-0001',
        sourceWarehouseId: whSource.id,
        destWarehouseId: whDest.id,
        vehicleNo: 'B 9284 KIL',
        notes: 'Mutasi bahan baku untuk batch mixing awal pekan',
        status: 'COMPLETED',
        createdById: defaultUser?.id,
        date: new Date('2026-09-02T08:30:00Z'),
        items: [
          { materialId: materials[0].id, qty: 50 },
          { materialId: materials[1]?.id || materials[0].id, qty: 25 },
        ]
      },
      {
        transferNumber: 'TRF-2026-0002',
        sourceWarehouseId: whSource.id,
        destWarehouseId: whFinish.id,
        vehicleNo: 'B 1042 SER',
        notes: 'Transfer sampel uji stabilitas ke gudang lab',
        status: 'PENDING',
        createdById: defaultUser?.id,
        date: new Date('2026-09-05T10:15:00Z'),
        items: [
          { materialId: materials[2]?.id || materials[0].id, qty: 10 },
        ]
      },
      {
        transferNumber: 'TRF-2026-0003',
        sourceWarehouseId: whDest.id,
        destWarehouseId: whFinish.id,
        vehicleNo: 'L 8831 UY',
        notes: 'Mutasi kemasan primer botol 100ml ke lini packaging',
        status: 'COMPLETED',
        createdById: defaultUser?.id,
        date: new Date('2026-09-08T14:00:00Z'),
        items: [
          { materialId: materials[3]?.id || materials[0].id, qty: 2500 },
        ]
      },
      {
        transferNumber: 'TRF-2026-0004',
        sourceWarehouseId: whSource.id,
        destWarehouseId: whDest.id,
        vehicleNo: 'B 7721 PK',
        notes: 'Buffer stock bahan aktif niacinamide pabrik utama',
        status: 'PENDING',
        createdById: defaultUser?.id,
        date: new Date('2026-09-12T09:45:00Z'),
        items: [
          { materialId: materials[0].id, qty: 100 },
        ]
      },
    ];

    for (const t of transferData) {
      const existing = await prisma.transferOrder.findUnique({
        where: { transferNumber: t.transferNumber }
      });
      if (!existing) {
        await prisma.transferOrder.create({
          data: {
            transferNumber: t.transferNumber,
            date: t.date,
            sourceWarehouseId: t.sourceWarehouseId,
            destWarehouseId: t.destWarehouseId,
            vehicleNo: t.vehicleNo,
            notes: t.notes,
            status: t.status,
            createdById: t.createdById,
            items: {
              create: t.items.map(it => ({
                materialId: it.materialId,
                qty: it.qty
              }))
            }
          }
        });
        console.log(`  + Created TransferOrder ${t.transferNumber}`);
      } else {
        console.log(`  = Exists TransferOrder ${t.transferNumber}`);
      }
    }

    // 2. Seed Shipments (Pengiriman Barang / Delivery Out: /delivery-out)
    console.log('Seeding Shipments / Delivery Orders...');
    if (salesOrders.length > 0 && defaultUser) {
      const shipmentData = [
        {
          soId: salesOrders[0].id,
          logisticsId: defaultUser.id,
          trackingNo: 'JNE-TRK-2026-0081',
          status: 'DELIVERED',
          shippedAt: new Date('2026-09-03T09:00:00Z'),
          notes: 'Pengiriman batch 1 produk skincare ke gudang klien',
          items: [
            { materialId: materials[0].id, qtyOrder: 3000, qtyShipped: 3000 }
          ]
        },
        {
          soId: salesOrders[1]?.id || salesOrders[0].id,
          logisticsId: defaultUser.id,
          trackingNo: 'SICEPAT-0092819',
          status: 'SHIPPED',
          shippedAt: new Date('2026-09-07T11:30:00Z'),
          notes: 'Dalam perjalanan ekspedisi darat Jakarta - Surabaya',
          items: [
            { materialId: materials[1]?.id || materials[0].id, qtyOrder: 5000, qtyShipped: 5000 }
          ]
        },
        {
          soId: salesOrders[2]?.id || salesOrders[0].id,
          logisticsId: defaultUser.id,
          trackingNo: 'LALAMOVE-VN-1102',
          status: 'PACKING',
          shippedAt: new Date('2026-09-11T13:00:00Z'),
          notes: 'Menunggu proses QC packing akhir dan segel shrink',
          items: [
            { materialId: materials[2]?.id || materials[0].id, qtyOrder: 1500, qtyShipped: 1500 }
          ]
        },
        {
          soId: salesOrders[0].id,
          logisticsId: defaultUser.id,
          trackingNo: 'ANTERAJA-8827101',
          status: 'DELIVERED',
          shippedAt: new Date('2026-09-14T15:20:00Z'),
          notes: 'Sampel pilot run maklon kosmetik diterima PIC brand',
          items: [
            { materialId: materials[3]?.id || materials[0].id, qtyOrder: 100, qtyShipped: 100 }
          ]
        },
      ];

      for (const s of shipmentData) {
        const existing = await prisma.shipment.findFirst({
          where: { trackingNo: s.trackingNo }
        });
        if (!existing) {
          await prisma.shipment.create({
            data: {
              soId: s.soId,
              logisticsId: s.logisticsId,
              trackingNo: s.trackingNo,
              status: s.status,
              shippedAt: s.shippedAt,
              notes: s.notes,
              items: {
                create: s.items.map(it => ({
                  materialId: it.materialId,
                  qtyOrder: it.qtyOrder,
                  qtyShipped: it.qtyShipped
                }))
              }
            }
          });
          console.log(`  + Created Shipment ${s.trackingNo}`);
        } else {
          console.log(`  = Exists Shipment ${s.trackingNo}`);
        }
      }
    }

    // 3. Seed Stock Adjustments (/stock-adjustment)
    console.log('Seeding Stock Adjustments (Penyesuaian Stok)...');
    if (account) {
      const adjustmentData = [
        {
          date: new Date('2026-09-04T10:00:00Z'),
          warehouseId: whSource.id,
          type: 'SUSUT_PRODUKSI',
          accountId: account.id,
          notes: 'Koreksi susut evaporasi bahan aktif batch mixing 01',
          items: [
            { materialId: materials[0].id, qty: -2.5 }
          ]
        },
        {
          date: new Date('2026-09-09T11:00:00Z'),
          warehouseId: whDest.id,
          type: 'PECAH_KEMASAN',
          accountId: account.id,
          notes: 'Kerusakan botol kaca saat bongkar muat forklift',
          items: [
            { materialId: materials[1]?.id || materials[0].id, qty: -15 }
          ]
        },
        {
          date: new Date('2026-09-13T16:00:00Z'),
          warehouseId: whFinish.id,
          type: 'BONUS_SUPPLIER_SAMPLE',
          accountId: account.id,
          notes: 'Penambahan stok sample uji lab gratis dari supplier',
          items: [
            { materialId: materials[2]?.id || materials[0].id, qty: 5 }
          ]
        }
      ];

      for (const adj of adjustmentData) {
        const existing = await prisma.stockAdjustment.findFirst({
          where: { notes: adj.notes }
        });
        if (!existing) {
          await prisma.stockAdjustment.create({
            data: {
              date: adj.date,
              warehouseId: adj.warehouseId,
              type: adj.type,
              accountId: adj.accountId,
              notes: adj.notes,
              items: {
                create: adj.items.map(it => ({
                  materialId: it.materialId,
                  qty: it.qty
                }))
              }
            }
          });
          console.log(`  + Created StockAdjustment: ${adj.notes}`);
        } else {
          console.log(`  = Exists StockAdjustment: ${adj.notes}`);
        }
      }
    }

    // 4. Seed Stock Opnames (/stock-opname)
    console.log('Seeding Stock Opnames (Audit Fisik Stok)...');
    if (defaultUser) {
      const opnameData = [
        {
          opnameNumber: 'OPN-2026-0001',
          opnameDate: new Date('2026-08-31T17:00:00Z'),
          warehouseId: whSource.id,
          picId: defaultUser.id,
          notes: 'Stock Opname Bulanan Agustus Gudang Bahan Baku',
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          items: [
            { materialId: materials[0].id, systemQty: 500, actualQty: 498, difference: -2 },
            { materialId: materials[1]?.id || materials[0].id, systemQty: 250, actualQty: 250, difference: 0 },
          ]
        },
        {
          opnameNumber: 'OPN-2026-0002',
          opnameDate: new Date('2026-09-10T17:00:00Z'),
          warehouseId: whDest.id,
          picId: defaultUser.id,
          notes: 'Audit Fisik Kemasan & Dus Sekunder Pra-Produksi',
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          items: [
            { materialId: materials[2]?.id || materials[0].id, systemQty: 10000, actualQty: 9980, difference: -20 },
          ]
        },
        {
          opnameNumber: 'OPN-2026-0003',
          opnameDate: new Date('2026-09-15T18:00:00Z'),
          warehouseId: whFinish.id,
          picId: defaultUser.id,
          notes: 'Opname Berkala Produk Jadi Siap Distribusi',
          status: 'DRAFT',
          approvalStatus: 'WAITING',
          items: [
            { materialId: materials[3]?.id || materials[0].id, systemQty: 1500, actualQty: 1500, difference: 0 },
          ]
        }
      ];

      for (const opn of opnameData) {
        const existing = await prisma.stockOpname.findUnique({
          where: { opnameNumber: opn.opnameNumber }
        });
        if (!existing) {
          await prisma.stockOpname.create({
            data: {
              opnameNumber: opn.opnameNumber,
              opnameDate: opn.opnameDate,
              warehouseId: opn.warehouseId,
              picId: opn.picId,
              notes: opn.notes,
              status: opn.status,
              approvalStatus: opn.approvalStatus,
              items: {
                create: opn.items.map(it => ({
                  materialId: it.materialId,
                  systemQty: it.systemQty,
                  actualQty: it.actualQty,
                  difference: it.difference
                }))
              }
            }
          });
          console.log(`  + Created StockOpname ${opn.opnameNumber}`);
        } else {
          console.log(`  = Exists StockOpname ${opn.opnameNumber}`);
        }
      }
    }

    // 5. Seed Inventory Transactions (/report-mutation-goods & /report-stock)
    console.log('Seeding Inventory Transactions...');
    const txData = [
      {
        materialId: materials[0].id,
        type: 'INBOUND',
        quantity: 500,
        referenceNo: 'GRN-2026-0001',
        notes: 'Penerimaan bahan baku PO-2026-0001',
        warehouseId: whSource.id,
        performedBy: 'Staff Gudang Inbound'
      },
      {
        materialId: materials[0].id,
        type: 'INTERNAL_MOVE',
        quantity: -50,
        referenceNo: 'TRF-2026-0001',
        notes: 'Mutasi keluar ke Gudang Produksi',
        warehouseId: whSource.id,
        performedBy: 'Operator Forklift'
      },
      {
        materialId: materials[0].id,
        type: 'ADJUSTMENT',
        quantity: -2,
        referenceNo: 'ADJ-2026-0001',
        notes: 'Penyesuaian susut produksi',
        warehouseId: whSource.id,
        performedBy: 'QC Controller'
      },
      {
        materialId: materials[1]?.id || materials[0].id,
        type: 'INBOUND',
        quantity: 1000,
        referenceNo: 'GRN-2026-0002',
        notes: 'Penerimaan kemasan PO-2026-0002',
        warehouseId: whDest.id,
        performedBy: 'Staff Gudang Inbound'
      },
      {
        materialId: materials[1]?.id || materials[0].id,
        type: 'OUTBOUND',
        quantity: -200,
        referenceNo: 'DO-2026-0001',
        notes: 'Pengiriman finished goods ke klien',
        warehouseId: whFinish.id,
        performedBy: 'Driver Ekspedisi'
      }
    ];

    for (const tx of txData) {
      const existing = await prisma.inventoryTransaction.findFirst({
        where: { referenceNo: tx.referenceNo, materialId: tx.materialId }
      });
      if (!existing) {
        await prisma.inventoryTransaction.create({
          data: tx
        });
        console.log(`  + Created InventoryTransaction: ${tx.referenceNo} (${tx.type})`);
      }
    }

    console.log('--- SEEDING FASE 5 COMPLETE SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during Fase 5 seeding:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedFase5().catch(e => {
  console.error(e);
  process.exit(1);
});
