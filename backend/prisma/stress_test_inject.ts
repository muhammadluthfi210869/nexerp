import 'dotenv/config';
import { PrismaClient, UserRole, ActivityCategory, PipelineStage, LeadState, SampleStage, InvoiceStatus, WorkOrderStage, LostReason } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 STARTING NEURAL STRESS TEST: Injecting High-Density Data...");

  // Get Staffs
  const nisa = await prisma.bussdevStaff.findFirst({ where: { name: "Nisa" } });
  const diva = await prisma.bussdevStaff.findFirst({ where: { name: "Diva" } });
  
  if (!nisa || !diva) {
    console.error("❌ Required staffs (Nisa/Diva) not found. Run seed_identities.ts first.");
    return;
  }

  const brands = [
    { name: "Aureon Skin", product: "Glow Serum", pic: nisa.id, stage: PipelineStage.WON_DEAL, value: 150000000, ro: false },
    { name: "Diva Beauty", product: "Moisturizer Gel", pic: diva.id, stage: PipelineStage.SAMPLE_PROCESS, value: 50000000, ro: false },
    { name: "Nisa Glow", product: "Sunscreen Mist", pic: nisa.id, stage: PipelineStage.NEGOTIATION, value: 85000000, ro: true },
    { name: "Derma Lab", product: "Body Lotion", pic: diva.id, stage: PipelineStage.WON_DEAL, value: 200000000, ro: true },
    { name: "Scent Matrix", product: "Premium Perfume", pic: nisa.id, stage: PipelineStage.NEW_LEAD, value: 45000000, ro: false },
    { name: "Botanica", product: "Hair Care Set", pic: diva.id, stage: PipelineStage.WON_DEAL, value: 120000000, ro: true },
    { name: "Oasis Care", product: "Face Wash", pic: nisa.id, stage: PipelineStage.LOST, value: 30000000, ro: false, lostReason: LostReason.PRICE_ISSUE },
    { name: "Zen Harmony", product: "Relaxing Oil", pic: diva.id, stage: PipelineStage.SAMPLE_PROCESS, value: 65000000, ro: false },
    { name: "Luxe Skin", product: "Anti Aging Cream", pic: nisa.id, stage: PipelineStage.WON_DEAL, value: 300000000, ro: false },
    { name: "Pure Essence", product: "Toner Mist", pic: diva.id, stage: PipelineStage.NEGOTIATION, value: 40000000, ro: false }
  ];

  for (const b of brands) {
    // 1. Create Lead
    const lead = await prisma.salesLead.create({
      data: {
        clientName: b.name,
        brandName: b.name,
        productInterest: b.product,
        estimatedValue: b.value,
        planOmset: b.stage === PipelineStage.WON_DEAL ? b.value : b.value * 0.8,
        moq: 1000,
        marginPercentage: 35,
        stage: b.stage,
        leadState: b.stage === PipelineStage.WON_DEAL ? LeadState.ACTIVE : b.stage === PipelineStage.LOST ? LeadState.LOST : LeadState.ACTIVE,
        isRepeatOrder: b.ro,
        picId: b.pic,
        contactInfo: "08123456789",
        source: "Instagram",
        lostReason: (b.lostReason as any) || null,
        hkiMode: "NEW"
      }
    });

    // 2. Create Initial Log (Automated Follow-up) - Matches funnel analytics contactedLeads
    await prisma.leadTimelineLog.create({
      data: {
        leadId: lead.id,
        category: ActivityCategory.FOLLOW_UP,
        action: "INITIAL_INTAKE",
        notes: `Initial intake registered for ${b.name}. PIC Assigned.`,
        loggedBy: "SYSTEM"
      }
    });

    // 3. Create Sample Flow if beyond New Lead
    if (b.stage !== PipelineStage.NEW_LEAD && b.stage !== PipelineStage.LOST) {
      const sample = await prisma.sampleRequest.create({
        data: {
          leadId: lead.id,
          productName: b.product,
          targetFunction: "Moisturizing",
          textureReq: "Liquid",
          colorReq: "Clear",
          aromaReq: "None",
          stage: b.stage === PipelineStage.WON_DEAL ? SampleStage.APPROVED : SampleStage.FORMULATING,
          revisionCount: b.stage === PipelineStage.WON_DEAL ? 2 : 1,
          suggestPackaging: "Glass Bottle 30ml",
          suggestValue: "Premium Niacinamide Base",
        }
      });

      // Create Revisions
      await prisma.sampleRevision.create({
        data: {
          sampleRequestId: sample.id,
          revisionNumber: 1,
          status: "APPROVED",
          feedback: "Good base",
          completedAt: new Date()
        }
      });

      if (b.stage === PipelineStage.WON_DEAL) {
        await prisma.sampleRevision.create({
           data: {
             sampleRequestId: sample.id,
             revisionNumber: 2,
             status: "APPROVED",
             feedback: "Perfect scent",
             completedAt: new Date()
           }
        });

        // Create Finance Trigger (WorkOrder + Paid Invoice)
        const wo = await prisma.workOrder.create({
          data: {
            leadId: lead.id,
            woNumber: `WO-${lead.id.slice(0, 8).toUpperCase()}`,
            targetQty: 1000,
            targetCompletion: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            stage: WorkOrderStage.MIXING,
          }
        });

        await prisma.finalInvoice.create({
          data: {
            workOrderId: wo.id,
            totalAmount: b.value,
            remainingAmount: b.value * 0.5,
            status: InvoiceStatus.PAID,
          }
        });
      }
    }

    console.log(`✅ Injected: ${b.name} (${b.stage})`);
  }

  console.log("🏁 STRESS TEST INJECTION COMPLETE.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
