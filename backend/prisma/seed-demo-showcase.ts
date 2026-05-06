
import 'dotenv/config';
import { PrismaClient, MaterialType, WorkOrderStage } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('💎 Starting Executive Showcase Seeding...');

  // 0. CLEANUP
  await prisma.productionLog.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.billOfMaterial.deleteMany({});
  await prisma.sampleRequest.deleteMany({});
  await prisma.salesLead.deleteMany({});
  await prisma.materialInventory.deleteMany({});
  await prisma.materialItem.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.bussdevStaff.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.kpiScore.deleteMany({});
  await prisma.designTask.deleteMany({});
  
  console.log('🧹 Database Cleared.');

  // 1. Setup Base Entities
  const bds = await prisma.bussdevStaff.create({
    data: { name: 'Showcase Architect', targetRevenue: 5000000000 },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Titanium Resources',
      contact: 'Exclusive Partner',
      performanceScore: 4.9,
    },
  });

  const matRaw = await prisma.materialItem.create({
    data: {
      name: 'Raw Silk Extract',
      type: MaterialType.RAW_MATERIAL,
      unit: 'KG',
      unitPrice: 1500,
      minLevel: 10,
      maxLevel: 100,
      reorderPoint: 20,
    },
  });

  // 2. SCENARIO 1: THE SHORTAGE (Show SCM Intelligence)
  const lead1 = await prisma.salesLead.create({
    data: { clientName: 'Luxury Brand A', contactInfo: 'ceo@brand-a.com', source: 'GOOGLE', productInterest: 'Silk Essence', picId: bds.id }
  });
  const sample1 = await prisma.sampleRequest.create({
    data: {
      leadId: lead1.id,
      productName: 'Silk Serum V1',
      targetFunction: 'Anti-Aging',
      textureReq: 'Liquid Gold',
      colorReq: 'Translucent',
      aromaReq: 'Rose',
      stage: 'APPROVED' as any,
    }
  });
  await prisma.billOfMaterial.create({
    data: { sampleId: sample1.id, materialId: matRaw.id, quantityPerUnit: 0.1 }
  });
  await prisma.workOrder.create({
    data: {
      leadId: lead1.id,
      woNumber: 'WO-DEMO-001_SHORTAGE',
      targetQty: 500, // Needs 50KG
      stage: WorkOrderStage.WAITING_MATERIAL,
      targetCompletion: new Date('2024-12-01'),
    }
  });
  await prisma.materialInventory.create({
    data: { materialId: matRaw.id, supplierId: supplier.id, batchNumber: 'BATCH-EMPTY', currentStock: 5, lastRestock: new Date() } // Only 5KG available -> SHORTAGE
  });

  // 3. SCENARIO 2: THE HANDOVER (Ready for Production)
  const lead2 = await prisma.salesLead.create({
    data: { clientName: 'Luxury Brand B', contactInfo: 'ceo@brand-b.com', source: 'INSTAGRAM', productInterest: 'Night Cream', picId: bds.id }
  });
  const sample2 = await prisma.sampleRequest.create({
    data: {
      leadId: lead2.id,
      productName: 'Night Renewal',
      targetFunction: 'Hydration',
      textureReq: 'Creamy',
      colorReq: 'White',
      aromaReq: 'Lavender',
      stage: 'APPROVED' as any,
    }
  });
  await prisma.billOfMaterial.create({
    data: { sampleId: sample2.id, materialId: matRaw.id, quantityPerUnit: 0.05 }
  });
  const wo2 = await prisma.workOrder.create({
    data: {
      leadId: lead2.id,
      woNumber: 'WO-DEMO-002_READY',
      targetQty: 100, // Needs 5KG
      stage: WorkOrderStage.WAITING_MATERIAL,
      targetCompletion: new Date('2024-11-15'),
    }
  });
  await prisma.materialInventory.create({
    data: { materialId: matRaw.id, supplierId: supplier.id, batchNumber: 'BATCH-FULL', currentStock: 100, lastRestock: new Date() } 
  });
  // Simulate Warehouse Release
  await prisma.productionLog.create({
    data: {
      workOrderId: wo2.id,
      stage: WorkOrderStage.WAITING_MATERIAL,
      inputQty: 0, goodQty: 0, quarantineQty: 0, rejectQty: 0,
      notes: 'SYSTEM: MATERIAL_RELEASED_BY_WAREHOUSE'
    }
  });

  // 4. SCENARIO 3: THE ACTIVE FLOOR (Mixing in Progress)
  const lead3 = await prisma.salesLead.create({
    data: { clientName: 'Elite Spa Corp', contactInfo: 'manager@elitespa.com', source: 'OFFLINE', productInterest: 'Massage Oil', picId: bds.id }
  });
  const sample3 = await prisma.sampleRequest.create({
    data: {
      leadId: lead3.id,
      productName: 'Spa Essence',
      targetFunction: 'Relaxation',
      textureReq: 'Oily',
      colorReq: 'Yellow',
      aromaReq: 'Sandalwood',
      stage: 'APPROVED' as any,
    }
  });
  await prisma.billOfMaterial.create({
    data: { sampleId: sample3.id, materialId: matRaw.id, quantityPerUnit: 0.2 }
  });
  const wo3 = await prisma.workOrder.create({
    data: {
      leadId: lead3.id,
      woNumber: 'WO-DEMO-003_ACTIVE',
      targetQty: 200,
      stage: WorkOrderStage.FILLING,
      targetCompletion: new Date('2024-11-20'),
    }
  });
  // Add MIXING logs to show history
  await prisma.productionLog.create({
    data: {
      workOrderId: wo3.id,
      stage: WorkOrderStage.MIXING,
      inputQty: 200, goodQty: 200, quarantineQty: 0, rejectQty: 0,
      notes: 'MIXING COMPLETED - PERFECT BALANCE'
    }
  });

  // 5. SCENARIO 4: THE DEFECT HISTORY (High Alert)
  const lead4 = await prisma.salesLead.create({
    data: { clientName: 'Commercial Retail Inc', contactInfo: 'ops@retail.com', source: 'GOOGLE', productInterest: 'Daily Lotion', picId: bds.id }
  });
  const sample4 = await prisma.sampleRequest.create({
    data: {
      leadId: lead4.id,
      productName: 'Basic Lotion',
      targetFunction: 'Moisturizing',
      textureReq: 'Light',
      colorReq: 'Pink',
      aromaReq: 'Berry',
      stage: 'APPROVED' as any,
    }
  });
  const wo4 = await prisma.workOrder.create({
    data: {
      leadId: lead4.id,
      woNumber: 'WO-DEMO-004_DEFECT',
      targetQty: 1000,
      stage: WorkOrderStage.FINISHED_GOODS,
      targetCompletion: new Date('2024-10-01'),
      actualCompletion: new Date('2024-10-10'),
    }
  });
  // Create messy production log history
  await prisma.productionLog.createMany({
    data: [
      { workOrderId: wo4.id, stage: WorkOrderStage.MIXING, inputQty: 1000, goodQty: 900, quarantineQty: 0, rejectQty: 100, notes: 'Contamination in tank A' },
      { workOrderId: wo4.id, stage: WorkOrderStage.FILLING, inputQty: 900, goodQty: 600, quarantineQty: 0, rejectQty: 300, notes: 'Leakage in filling machine' },
      { workOrderId: wo4.id, stage: WorkOrderStage.PACKING, inputQty: 600, goodQty: 50, quarantineQty: 0, rejectQty: 550, notes: 'Batch rejected due to severe consistency issues' }
    ]
  });

  // 6. SCENARIO 5: THE CREATIVE FLOW (Design Approval Lifecycle)
  const lead5 = await prisma.salesLead.create({
    data: { clientName: 'Brand Luxury C', contactInfo: 'marketing@brand-c.com', source: 'OFFLINE', productInterest: 'Exclusive Perfume', picId: bds.id }
  });
  await prisma.designTask.create({
    data: {
      leadId: lead5.id,
      brief: 'Elegant gold-leaf packaging with holographic finish for 50ml bottle.',
      designFileUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
      apjStatus: 'WAITING' as any,
      clientStatus: 'WAITING' as any,
      isFinal: false
    }
  });

  // 7. SCENARIO 6: THE WORKFORCE AUDIT (HR & KPI Matrix)
  const emp1 = await prisma.employee.create({
    data: {
      name: 'Alex Sterling',
      department: 'PRODUCTION',
      position: 'Floor Supervisor',
      joinedAt: new Date('2023-01-10'),
      contractType: 'PERMANENT',
      isActive: true
    }
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: 'Sarah Connor',
      department: 'BUSSDEV',
      position: 'Account Executive',
      joinedAt: new Date('2024-05-20'),
      contractEnd: new Date(new Date().setDate(new Date().getDate() + 15)), // Critical: 15 days left
      contractType: 'CONTRACT',
      isActive: true
    }
  });

  await prisma.kpiScore.createMany({
    data: [
      { employeeId: emp1.id, evaluationPeriod: '2024-10', finalScore: 92.5, metricsData: { efficiency: 0.95 } },
      { employeeId: emp2.id, evaluationPeriod: '2024-10', finalScore: 88.0, metricsData: { conversion: 0.12 } }
    ]
  });

  console.log('💎 Showcase Seeding Complete.');
  console.log('📊 Stats:');
  console.log('- WO-DEMO-001: Triggered SHOTAGE');
  console.log('- WO-DEMO-002: Handover Unlocked');
  console.log('- WO-DEMO-003: Active in Filling');
  console.log('- WO-DEMO-004: Critical Defect Alert in Dash');
  console.log('- DESIGN TASK: Waiting for APJ Review');
}

main()
  .catch((e) => {
    console.error('❌ Showcase Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

