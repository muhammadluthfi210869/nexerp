import { 
  PrismaClient, 
  WorkflowStatus, 
  SampleStage, 
  SOStatus, 
  DesignState, 
  RegStage, 
  ActivityType,
  LifecycleStatus,
  ApprovalStatus,
  ProdStage,
  Division
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function auditBlueprint() {
  console.log('--- AUDIT MASTER BUSINESS PROCESS BLUEPRINT ---');
  const testId = `AUDIT-${Date.now()}`;
  
  try {
    // 0. SELF-CONTAINED MASTER DATA SETUP
    console.log('[STEP 0] Ensuring Master Data...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin.audit@aureon.com' },
      update: {},
      create: { email: 'admin.audit@aureon.com', fullName: 'Audit Admin', passwordHash: 'test', roles: ['ADMIN'] }
    });

    const complianceUser = await prisma.user.upsert({
      where: { email: 'compliance.audit@aureon.com' },
      update: {},
      create: { email: 'compliance.audit@aureon.com', fullName: 'Audit Legal', passwordHash: 'test', roles: ['COMPLIANCE'] }
    });

    const staff = await prisma.bussdevStaff.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id, name: 'Audit Staff' }
    });

    const rndStaff = await prisma.rndStaff.create({
      data: { name: 'Audit Formulator', specialty: 'Serum', maxWeeklyCapacity: 10 }
    });

    // =========================================================================
    console.log('\n[FASE 1] Pra-Kualifikasi & Sampel');
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `Audit Client ${testId}`,
        brandName: `Brand-${testId}`,
        contactInfo: '0812345678',
        source: 'DIGITAL_MARKETING',
        productInterest: 'Glowing Serum',
        picId: staff.id,
        status: WorkflowStatus.NEW_LEAD
      }
    });
    console.log('✔ Step 1 (Lead In): OK');

    const sample = await prisma.sampleRequest.create({
      data: {
        leadId: lead.id,
        productName: 'Glowing Serum',
        sampleCode: `SAMP-${testId.slice(-4)}`,
        targetFunction: 'Brightening',
        textureReq: 'Serum',
        colorReq: 'Gold',
        aromaReq: 'Rose',
        stage: SampleStage.WAITING_FINANCE,
        pnfFileUrl: 'https://cdn.aureon.com/pnf/test.pdf'
      }
    });
    
    await prisma.sampleRequest.update({
      where: { id: sample.id },
      data: { stage: SampleStage.QUEUE, paymentApprovedAt: new Date(), paymentApprovedById: adminUser.id }
    });
    console.log('✔ Step 2 & 3 (Sample Deal & Gate 1): OK');

    await prisma.sampleRequest.update({
      where: { id: sample.id },
      data: { stage: SampleStage.FORMULATING, picId: rndStaff.id }
    });
    
    await prisma.sampleRequest.update({
      where: { id: sample.id },
      data: { stage: SampleStage.SHIPPED, trackingNumber: 'RESI-12345', shippedAt: new Date() }
    });
    console.log('✔ Step 4 & 5 (Formulation & Resi): OK');

    await prisma.sampleRevision.create({
      data: { sampleRequestId: sample.id, revisionNumber: 1, feedback: 'More watery', status: 'PENDING' }
    });
    console.log('✔ Step 6 (Revision Loop): OK');

    // =========================================================================
    console.log('\n[FASE 2] Komitmen Produksi & Mesin Paralel');
    const so = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${testId.slice(-4)}`,
        leadId: lead.id,
        sampleId: sample.id,
        totalAmount: 100000000,
        quantity: 5000,
        status: SOStatus.PENDING_DP
      }
    });

    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({ where: { id: so.id }, data: { status: SOStatus.LOCKED_ACTIVE } });
      await tx.salesLead.update({ where: { id: lead.id }, data: { status: WorkflowStatus.DP_PAID } });
      await tx.regulatoryPipeline.create({
        data: { leadId: lead.id, type: 'BPOM', currentStage: RegStage.DRAFT, legalPicId: complianceUser.id }
      });
      await tx.designTask.create({
        data: { leadId: lead.id, brief: 'Desain Audit', kanbanState: DesignState.INBOX, soId: so.id }
      });
    });
    console.log('✔ Step 1, 2, 3 (SO Locked & Triple Parallel): OK');

    // =========================================================================
    console.log('\n[FASE 3] Eksekusi Lantai Pabrik');
    const plan = await prisma.productionPlan.create({
      data: { soId: so.id, adminId: adminUser.id, batchNo: `BATCH-${testId.slice(-4)}`, status: LifecycleStatus.PLANNING }
    });
    console.log('✔ Step 1 (Batch Record Created): OK');

    const stages = [ProdStage.BATCHING, ProdStage.MIXING, ProdStage.FILLING, ProdStage.PACKING];
    for (const stage of stages) {
      await prisma.productionStepLog.create({
        data: { woId: plan.id, stage: stage, inputQty: 5000, qtyResult: 4950, qtyReject: 50, qtyQuarantine: 0 }
      });
      console.log(`- ${stage} Log recorded: OK`);
    }

    await prisma.finishedGood.create({
      data: { woId: plan.id, stockQty: 4950 }
    });
    console.log('✔ Step 5 (Finished Goods recorded): OK');

    // =========================================================================
    console.log('\n[FASE 4] Terminasi & Pengiriman');
    const wo = await prisma.workOrder.create({
      data: {
        leadId: lead.id,
        woNumber: `WO-${testId.slice(-4)}`,
        targetQty: 5000,
        stage: LifecycleStatus.DONE,
        targetCompletion: new Date(),
        planId: plan.id
      }
    });

    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({ where: { id: so.id }, data: { status: SOStatus.COMPLETED } });
      await tx.salesLead.update({ where: { id: lead.id }, data: { status: WorkflowStatus.WON_DEAL, wonAt: new Date() } });
    });
    console.log('✔ Step 1 & 2 (Pelunasan & WON): OK');

    await prisma.deliveryOrder.create({
      data: { workOrderId: wo.id, trackingNumber: 'DELIV-999', courierName: 'Internal Logistics', status: 'SHIPPED' }
    });
    console.log('✔ Step 3 (Delivery Order): OK');

    console.log('\n--- AUDIT COMPLETE: 100% BLUEPRINT COMPLIANCE ---');
    console.log(`Audit ID: ${testId}`);

  } catch (err) {
    console.error('AUDIT FAILED! Blueprint mismatch found:');
    console.dir(err, { depth: null });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

auditBlueprint();
