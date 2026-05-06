import 'dotenv/config';
import { PrismaClient, MaterialType, WorkOrderStage } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Seeding SCM Test Data...');

  // 1. Create SCM Processor User
  const scmUser = await prisma.user.upsert({
    where: { email: 'scm@dreamlab.com' },
    update: {},
    create: {
      email: 'scm@dreamlab.com',
      fullName: 'Budi Purchasing',
      passwordHash: 'hashed_password', // Should be properly hashed in real scenarios
      roles: ['SCM', 'PURCHASING'],
    },
  });
  console.log('✅ SCM User created');

  // 1.5 Create Bussdev Staff
  const bds = await prisma.bussdevStaff.create({
    data: {
      name: 'Sarah Commercial',
      targetRevenue: 1000000000,
    },
  });
  console.log('✅ Bussdev Staff created');

  // 2. Create Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: '776d655f-8706-4444-9c87-999999999999' },
    update: {},
    create: {
      id: '776d655f-8706-4444-9c87-999999999999',
      name: 'Global Chemical Corp',
      contact: 'John Doe (+123456789)',
      performanceScore: 4.5,
    },
  });
  console.log('✅ Supplier created');

  // 3. Create Material Items
  const mat1 = await prisma.materialItem.create({
    data: {
      name: 'Sodium Laureth Sulfate (SLES)',
      type: 'RAW_MATERIAL' as any,
      unit: 'KG',
      usageUnit: 'GRAM',
      outMethod: 'FEFO',
      leadTime: 7,
      unitPrice: 15500, // Rp 15.500
      minLevel: 100,
      maxLevel: 1000,
      reorderPoint: 200,
    },
  });

  const mat2 = await prisma.materialItem.create({
    data: {
      name: 'Glycerin (99.5%)',
      type: 'RAW_MATERIAL' as any,
      unit: 'KG',
      usageUnit: 'GRAM',
      outMethod: 'FEFO',
      leadTime: 14,
      unitPrice: 21000, // Rp 21.000
      minLevel: 50,
      maxLevel: 500,
      reorderPoint: 100,
    },
  });

  const mat3 = await prisma.materialItem.create({
    data: {
      name: 'Botol PET 100ml Clear (DUMMY)',
      type: 'PACKAGING' as any,
      unit: 'PCS',
      usageUnit: 'PCS',
      outMethod: 'FIFO',
      isDummy: true,
      unitPrice: 0,
      minLevel: 0,
      maxLevel: 10000,
      reorderPoint: 0,
    }
  });
  console.log('✅ Material Items created (including Dummy)');


  // 4. Create Inventory (Simulate Stock for mat1, Shortage for mat2)
  await prisma.materialInventory.create({
    data: {
      materialId: mat1.id,
      supplierId: supplier.id,
      batchNumber: 'BATCH-001',
      currentStock: 500,
      expDate: new Date('2025-12-31'),
    },
  });

  await prisma.materialInventory.create({
    data: {
      materialId: mat2.id,
      supplierId: supplier.id,
      batchNumber: 'BATCH-002',
      currentStock: 10,
      expDate: new Date('2025-12-31'),
    },
  });
  console.log('✅ Inventories created');

  // 4.5 Create Purchase Order (Simulate Savings)
  const po1 = await prisma.purchaseOrder.create({
    data: {
      id: 'PO-2024-001',
      supplierId: supplier.id,
      scmId: scmUser.id,
      status: 'RECEIVED',
      totalValue: 14000000,
      estArrival: new Date(),
      items: {
        create: [
          {
            materialId: mat1.id,
            quantity: 1000,
            unitPrice: 14000, // Saving 1.500 per kg
            totalPrice: 14000000,
            receivedQty: 1000
          }
        ]
      },
      inbounds: {
        create: {
          status: 'APPROVED',
          receivedAt: new Date()
        }
      }
    }
  });
  console.log('✅ Purchase Order with Savings created');

  // 5. Create Sales Lead
  const lead = await prisma.salesLead.create({
    data: {
      clientName: 'Dreamlab Cosmetics Ltd',
      contactInfo: 'luthfi@dreamlab.com',
      source: 'INSTAGRAM',
      productInterest: 'Premium Shampoo',
      picId: bds.id,
    },
  });
  console.log('✅ Sales Lead created');

  // 6. Create Sample Request
  const sample = await prisma.sampleRequest.create({
    data: {
      leadId: lead.id,
      productName: 'Dreamlab Glossy Shampoo',
      targetFunction: 'Cleansing & Shine',
      textureReq: 'Viscous Liquid',
      colorReq: 'Transparent Gold',
      aromaReq: 'Luxury Floral',
      stage: 'APPROVED' as any,
    },
  });
  console.log('✅ Sample Request created');

  // 7. Create BOM for the Sample
  await prisma.billOfMaterial.create({
    data: {
      sampleId: sample.id,
      materialId: mat1.id,
      quantityPerUnit: 0.4,
    },
  });

  await prisma.billOfMaterial.create({
    data: {
      sampleId: sample.id,
      materialId: mat2.id,
      quantityPerUnit: 0.05,
    },
  });
  console.log('✅ BOM created');

  // 8. Create Work Order
  const wo1 = await prisma.workOrder.upsert({
    where: { woNumber: 'WO-2024-001' },
    update: { stage: WorkOrderStage.WAITING_MATERIAL },
    create: {
      leadId: lead.id,
      woNumber: 'WO-2024-001',
      targetQty: 1000,
      stage: WorkOrderStage.WAITING_MATERIAL,
      targetCompletion: new Date('2024-05-30'),
    },
  });

  const wo2 = await prisma.workOrder.upsert({
    where: { woNumber: 'WO-2024-002' },
    update: { stage: WorkOrderStage.WAITING_MATERIAL },
    create: {
      leadId: lead.id,
      woNumber: 'WO-2024-002',
      targetQty: 10,
      stage: WorkOrderStage.WAITING_MATERIAL,
      targetCompletion: new Date('2024-06-15'),
    },
  });

  console.log(`✅ Work Orders created: ${wo1.woNumber}, ${wo2.woNumber}`);
  console.log('🧪 Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
