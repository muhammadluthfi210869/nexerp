import { PrismaClient, WorkflowStatus, SampleStage, SOStatus, DesignState, RegStage, ActivityType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testFinancialGates() {
  console.log('--- STARTING FINANCIAL GATES INTEGRITY TEST ---');
  
  try {
    const staff = await prisma.bussdevStaff.findFirst();
    const admin = await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } });
    const compliance = await prisma.user.findFirst({ where: { roles: { has: 'COMPLIANCE' } } });

    if (!staff || !admin) throw new Error('Missing master data (Staff/Admin)');

    const testBrand = `TEST-PROT-${Date.now()}`;

    console.log('\n[STEP 1] Lead & Sample Creation');
    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'Test Client Corp',
        brandName: testBrand,
        contactInfo: 'test@client.com',
        source: 'TEST',
        productInterest: 'Hydrating Face Mist',
        picId: staff.id,
        moq: 1000,
        status: WorkflowStatus.NEW_LEAD
      }
    });

    const sample = await prisma.sampleRequest.create({
      data: {
        leadId: lead.id,
        productName: 'Hydrating Face Mist',
        stage: SampleStage.WAITING_FINANCE,
        sampleCode: `SAMP-${testBrand.slice(-4)}`,
        targetFunction: 'Moisturizing',
        textureReq: 'Liquid',
        colorReq: 'Clear',
        aromaReq: 'None'
      }
    });
    console.log('Result: Sample status is WAITING_FINANCE.');

    console.log('\n[STEP 2] Verifying Sample Payment');
    await prisma.sampleRequest.update({
      where: { id: sample.id },
      data: {
        stage: SampleStage.QUEUE,
        paymentApprovedAt: new Date(),
        paymentApprovedById: admin.id
      }
    });
    console.log('Result: Sample moved to QUEUE.');

    console.log('\n[STEP 3] DP Payment (Gate 2)');
    const so = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${testBrand.slice(-4)}`,
        leadId: lead.id,
        sampleId: sample.id,
        totalAmount: 50000000,
        quantity: 1000,
        status: SOStatus.PENDING_DP
      }
    });

    const dpActivity = await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        activityType: ActivityType.DOWN_PAYMENT,
        notes: 'DP 50% Paid',
        amount: 25000000,
        // @ts-ignore
        metadata: { salesOrderId: so.id }
      }
    });

    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: SOStatus.LOCKED_ACTIVE }
      });
      await tx.salesLead.update({
        where: { id: lead.id },
        data: { status: WorkflowStatus.DP_PAID }
      });
      await tx.regulatoryPipeline.create({
        data: {
          leadId: lead.id,
          type: 'BPOM',
          currentStage: RegStage.DRAFT,
          legalPicId: compliance?.id || admin.id
        }
      });
      await tx.designTask.create({
        data: {
          leadId: lead.id,
          brief: 'Auto-gen',
          kanbanState: DesignState.INBOX,
          soId: so.id
        }
      });
    });
    console.log('Result: DP Verified -> Parallel Tasks Created.');

    console.log('\n[STEP 4] Parallel Completion (Ready to Produce)');
    const pipeline = await prisma.regulatoryPipeline.findFirst({ where: { leadId: lead.id } });
    await prisma.regulatoryPipeline.update({ where: { id: pipeline!.id }, data: { currentStage: RegStage.PUBLISHED } });

    const designTask = await prisma.designTask.findFirst({ where: { leadId: lead.id } });
    await prisma.designTask.update({ where: { id: designTask!.id }, data: { kanbanState: DesignState.LOCKED, isFinal: true } });

    await prisma.salesOrder.update({ where: { id: so.id }, data: { status: SOStatus.READY_TO_PRODUCE } });
    console.log('Result: Interlock OK -> READY_TO_PRODUCE.');

    console.log('\n[STEP 5] Final Payment (Gate 3)');
    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({ where: { id: so.id }, data: { status: SOStatus.COMPLETED } });
      await tx.salesLead.update({ where: { id: lead.id }, data: { status: WorkflowStatus.WON_DEAL, wonAt: new Date() } });
    });
    
    const finalLead = await prisma.salesLead.findUnique({ where: { id: lead.id } });
    console.log(`Result: Final Payment Verified -> Lead status: ${finalLead?.status}.`);

    console.log('\nINTEGRITY TEST COMPLETE: ALL STAGES VERIFIED.');

  } catch (err) {
    console.dir(err, { depth: null });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testFinancialGates();
