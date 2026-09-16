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

async function seedFase4() {
  console.log('--- START SEEDING FASE 4: SCM & PEMBELIAN PO ---');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  console.log('Connected to PostgreSQL database!');

  try {
    // 1. Get existing suppliers, warehouses, users, materials
    const suppliers = await prisma.supplier.findMany({ take: 10 });
    const warehouses = await prisma.warehouse.findMany({ take: 5 });
    const materials = await prisma.materialItem.findMany({ take: 20 });
    const users = await prisma.user.findMany({ take: 5 });

    if (!suppliers.length || !warehouses.length || !materials.length) {
      throw new Error('Master data (suppliers, warehouses, materials) missing!');
    }

    console.log(`Found ${suppliers.length} suppliers, ${warehouses.length} warehouses, ${materials.length} materials`);

    const primaryWh = warehouses[0];
    const buyerUser = users[0];

    // 2. Seed Purchase Requests (PR)
    console.log('Seeding Purchase Requests...');
    const prData = [
      {
        notes: 'Kebutuhan Restock Bahan Aktif Niacinamide & Glycerin Batch Produksi April 2026',
        priority: 'HIGH',
        status: 'APPROVED',
        supplierId: suppliers[0].id,
        warehouseId: primaryWh.id,
        createdById: buyerUser?.id,
        items: [
          { materialId: materials[0].id, qtyRequired: 250, estimatedPrice: 85000 },
          { materialId: materials[1].id, qtyRequired: 500, estimatedPrice: 32000 }
        ]
      },
      {
        notes: 'Permintaan Botol Dropper 20ml Amber Klien Brand GlowSkin',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        supplierId: suppliers[1].id,
        warehouseId: primaryWh.id,
        createdById: buyerUser?.id,
        items: [
          { materialId: materials[2].id, qtyRequired: 5000, estimatedPrice: 4200 }
        ]
      },
      {
        notes: 'Emergency Requisition: Ceramide Complex & Preservative Phenoxyethanol',
        priority: 'URGENT',
        status: 'SUBMITTED',
        supplierId: suppliers[0].id,
        warehouseId: primaryWh.id,
        createdById: buyerUser?.id,
        items: [
          { materialId: materials[3]?.id || materials[0].id, qtyRequired: 50, estimatedPrice: 450000 }
        ]
      }
    ];

    for (const pr of prData) {
      const createdPr = await prisma.purchaseRequest.create({
        data: {
          requestDate: new Date(),
          warehouseId: pr.warehouseId,
          priority: pr.priority,
          status: pr.status,
          notes: pr.notes,
          supplierId: pr.supplierId,
          createdById: pr.createdById,
          items: {
            create: pr.items.map(item => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired,
              estimatedPrice: item.estimatedPrice
            }))
          }
        }
      });
      console.log(`Created PR: ${createdPr.id} (${pr.notes.substring(0, 30)}...)`);
    }

    // 3. Seed Purchase Orders (PO)
    console.log('Seeding Purchase Orders...');
    const poRecords = [
      {
        poNumber: 'PO-2026-0001',
        supplierId: suppliers[0].id,
        status: 'RECEIVED',
        totalValue: 32500000,
        discountManual: 150000,
        discountRounding: 3500,
        shippingCost: 250000,
        notes: 'PO Bahan Baku Kemurnian Tinggi USP Grade',
        items: [
          { materialId: materials[0].id, quantity: 200, unitPrice: 85000, totalPrice: 17000000, qtyBagus: 195, qtyReject: 5, receivedQty: 200 },
          { materialId: materials[1].id, quantity: 480, unitPrice: 32000, totalPrice: 15360000, qtyBagus: 480, qtyReject: 0, receivedQty: 480 }
        ]
      },
      {
        poNumber: 'PO-2026-0002',
        supplierId: suppliers[1].id,
        status: 'ORDERED',
        totalValue: 21250000,
        discountManual: 250000,
        discountRounding: 1200,
        shippingCost: 500000,
        notes: 'PO Kemasan Primer Botol Serum 30ml Frosted Pipet Emas',
        items: [
          { materialId: materials[2].id, quantity: 5000, unitPrice: 4200, totalPrice: 21000000, qtyBagus: 0, qtyReject: 0, receivedQty: 0 }
        ]
      },
      {
        poNumber: 'PO-2026-0003',
        supplierId: suppliers[2]?.id || suppliers[0].id,
        status: 'APPROVED',
        totalValue: 14800000,
        discountManual: 100000,
        discountRounding: 4500,
        shippingCost: 150000,
        notes: 'PO Inner Box Soft Touch Emboss Emas Brand Naturale',
        items: [
          { materialId: materials[3]?.id || materials[0].id, quantity: 10000, unitPrice: 1475, totalPrice: 14750000, qtyBagus: 0, qtyReject: 0, receivedQty: 0 }
        ]
      },
      {
        poNumber: 'PO-2026-0004',
        supplierId: suppliers[0].id,
        status: 'SHIPPED',
        totalValue: 45000000,
        discountManual: 500000,
        discountRounding: 2000,
        shippingCost: 350000,
        notes: 'PO Emulsifier Montanov 68 & Thickener Carbomer 940',
        items: [
          { materialId: materials[4]?.id || materials[0].id, quantity: 100, unitPrice: 280000, totalPrice: 28000000, qtyBagus: 50, qtyReject: 2, receivedQty: 52 },
          { materialId: materials[5]?.id || materials[1].id, quantity: 100, unitPrice: 168000, totalPrice: 16800000, qtyBagus: 100, qtyReject: 0, receivedQty: 100 }
        ]
      },
      {
        poNumber: 'PO-2026-0005',
        supplierId: suppliers[1].id,
        status: 'PENDING_APPROVAL',
        totalValue: 8500000,
        discountManual: 50000,
        discountRounding: 800,
        shippingCost: 120000,
        notes: 'PO Label Stiker Waterproof Roll 1000pcs/roll',
        items: [
          { materialId: materials[6]?.id || materials[2].id, quantity: 20, unitPrice: 420000, totalPrice: 8400000, qtyBagus: 0, qtyReject: 0, receivedQty: 0 }
        ]
      }
    ];

    const createdPos = [];
    for (const po of poRecords) {
      const existing = await prisma.purchaseOrder.findUnique({ where: { poNumber: po.poNumber } });
      if (existing) {
        console.log(`PO ${po.poNumber} already exists, using existing.`);
        createdPos.push(existing);
        continue;
      }

      const created = await prisma.purchaseOrder.create({
        data: {
          poNumber: po.poNumber,
          supplierId: po.supplierId,
          status: po.status,
          totalValue: po.totalValue,
          discountManual: po.discountManual,
          discountRounding: po.discountRounding,
          shippingCost: po.shippingCost,
          notes: po.notes,
          estArrival: new Date(Date.now() + 7 * 86400000),
          dueDate: new Date(Date.now() + 30 * 86400000),
          items: {
            create: po.items.map(i => ({
              materialId: i.materialId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              receivedQty: i.receivedQty,
              qtyBagus: i.qtyBagus,
              qtyReject: i.qtyReject
            }))
          }
        }
      });
      createdPos.push(created);
      console.log(`Created PO: ${created.poNumber}`);
    }

    // 4. Seed Warehouse Inbound (GRN 3-Pilar)
    console.log('Seeding Warehouse Inbounds (3-Pilar: Bagus, Reject, Free)...');
    const inboundRecords = [
      {
        inboundNumber: 'GRN-2026-0001',
        poId: createdPos[0]?.id,
        warehouseId: primaryWh.id,
        status: 'APPROVED',
        receivedAt: new Date(Date.now() - 3 * 86400000),
        items: [
          { materialId: materials[0].id, qtyActual: 200, isQuarantine: false, qcStatus: 'GOOD' },
          { materialId: materials[1].id, qtyActual: 480, isQuarantine: false, qcStatus: 'GOOD' }
        ]
      },
      {
        inboundNumber: 'GRN-2026-0002',
        poId: createdPos[3]?.id,
        warehouseId: primaryWh.id,
        status: 'PENDING',
        receivedAt: new Date(Date.now() - 1 * 86400000),
        items: [
          { materialId: materials[4]?.id || materials[0].id, qtyActual: 52, isQuarantine: false, qcStatus: 'REJECT' },
          { materialId: materials[5]?.id || materials[1].id, qtyActual: 100, isQuarantine: false, qcStatus: 'GOOD' }
        ]
      }
    ];

    for (const inb of inboundRecords) {
      const existing = await prisma.warehouseInbound.findUnique({ where: { inboundNumber: inb.inboundNumber } });
      if (existing) {
        console.log(`Inbound ${inb.inboundNumber} exists, skipping.`);
        continue;
      }
      const createdInb = await prisma.warehouseInbound.create({
        data: {
          inboundNumber: inb.inboundNumber,
          poId: inb.poId,
          warehouseId: inb.warehouseId,
          status: inb.status,
          receivedAt: inb.receivedAt,
          items: {
            create: inb.items.map(it => ({
              materialId: it.materialId,
              qtyActual: it.qtyActual,
              isQuarantine: it.isQuarantine,
              qcStatus: it.qcStatus
            }))
          }
        }
      });
      console.log(`Created Inbound GRN: ${createdInb.inboundNumber}`);
    }

    // 5. Seed Purchase Returns (Retur Pembelian)
    console.log('Seeding Purchase Returns...');
    const returnRecords = [
      {
        returnNumber: 'RET-2026-0001',
        supplierId: suppliers[0].id,
        warehouseId: primaryWh.id,
        status: 'WAITING_APPROVAL',
        notes: 'Kemasan jerrycan bocor dan segel rusak saat penerimaan PO-2026-0001',
        items: [
          { materialId: materials[0].id, quantity: 5, unitPrice: 85000, totalPrice: 425000 }
        ]
      },
      {
        returnNumber: 'RET-2026-0002',
        supplierId: suppliers[1].id,
        warehouseId: primaryWh.id,
        status: 'COMPLETED',
        notes: 'Botol dropper retak dan drat tutup tidak presisi (2 pcs reject)',
        items: [
          { materialId: materials[4]?.id || materials[0].id, quantity: 2, unitPrice: 280000, totalPrice: 560000 }
        ]
      }
    ];

    for (const ret of returnRecords) {
      const existing = await prisma.purchaseReturn.findUnique({ where: { returnNumber: ret.returnNumber } });
      if (existing) {
        console.log(`Return ${ret.returnNumber} exists, skipping.`);
        continue;
      }
      const createdRet = await prisma.purchaseReturn.create({
        data: {
          returnNumber: ret.returnNumber,
          supplierId: ret.supplierId,
          warehouseId: ret.warehouseId,
          status: ret.status,
          reason: ret.reason,
          items: {
            create: ret.items.map(i => ({
              materialId: i.materialId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice
            }))
          }
        }
      });
      console.log(`Created Purchase Return: ${createdRet.returnNumber}`);
    }

    // 6. Seed Invoices (Faktur Pembelian AP)
    console.log('Seeding Purchase Invoices...');
    const invRecords = [
      {
        invoiceNumber: 'INV-SUP-2026-0001',
        category: 'PAYABLE',
        type: 'FINAL_PAYMENT',
        status: 'PAID',
        amountDue: 32500000,
        outstandingAmount: 0,
        poId: createdPos[0]?.id,
        supplierId: suppliers[0].id,
        issuedAt: new Date(Date.now() - 10 * 86400000),
        dueDate: new Date(Date.now() + 20 * 86400000),
        notes: 'Lunas via Transfer Bank Mandiri'
      },
      {
        invoiceNumber: 'INV-SUP-2026-0002',
        category: 'PAYABLE',
        type: 'DP',
        status: 'UNPAID',
        amountDue: 10625000,
        outstandingAmount: 10625000,
        poId: createdPos[1]?.id,
        supplierId: suppliers[1].id,
        issuedAt: new Date(Date.now() - 2 * 86400000),
        dueDate: new Date(Date.now() + 14 * 86400000),
        notes: 'DP 50% Botol Pipet'
      },
      {
        invoiceNumber: 'INV-SUP-2026-0003',
        category: 'PAYABLE',
        type: 'FINAL_PAYMENT',
        status: 'PARTIAL',
        amountDue: 45000000,
        outstandingAmount: 22500000,
        poId: createdPos[3]?.id,
        supplierId: suppliers[0].id,
        issuedAt: new Date(Date.now() - 5 * 86400000),
        dueDate: new Date(Date.now() + 25 * 86400000),
        notes: 'Term of Payment 30 Hari'
      }
    ];

    for (const inv of invRecords) {
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
      if (existing) {
        console.log(`Invoice ${inv.invoiceNumber} exists, skipping.`);
        continue;
      }
      const createdInv = await prisma.invoice.create({
        data: {
          invoiceNumber: inv.invoiceNumber,
          category: inv.category,
          type: inv.type,
          status: inv.status,
          amountDue: inv.amountDue,
          outstandingAmount: inv.outstandingAmount,
          poId: inv.poId,
          supplierId: inv.supplierId,
          issuedAt: inv.issuedAt,
          dueDate: inv.dueDate,
          notes: inv.notes
        }
      });
      console.log(`Created Invoice AP: ${createdInv.invoiceNumber}`);
    }

    console.log('--- SEEDING FASE 4 COMPLETE! ---');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedFase4().catch(e => {
  console.error('Error during seeding Fase 4:', e);
  process.exit(1);
});
