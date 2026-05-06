import 'dotenv/config';
import { PrismaClient, PipelineStage } from '@prisma/client';
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
  console.log('🧪 CATEGORIZATION STRESS TEST: Injecting Controlled Data...');

  // 1. Get a valid PIC (Bussdev Staff)
  const pic = await prisma.bussdevStaff.findFirst({
    where: { isActive: true }
  });

  if (!pic) {
    throw new Error('Critical Failure: No Bussdev Staff found. Please run the main seed first.');
  }

  console.log(`📡 PIC Selected: ${pic.name} (${pic.id})`);

  // 2. Clear existing test data
  const testNames = ["TEST-BUKU-TAMU", "TEST-SAMPLE", "TEST-PRODUKSI", "TEST-RO-VIP"];
  
  await prisma.leadTimelineLog.deleteMany({
    where: { lead: { clientName: { in: testNames } } }
  });
  
  await prisma.salesLead.deleteMany({
    where: { clientName: { in: testNames } }
  });

  // 3. Insert Data Test
  const testLeads = [
    {
      clientName: "TEST-BUKU-TAMU",
      stage: PipelineStage.NEGOTIATION,
      isRepeatOrder: false,
      contactInfo: "test1",
      source: "System",
      productInterest: "Test",
      picId: pic.id
    },
    {
      clientName: "TEST-SAMPLE",
      stage: PipelineStage.SAMPLE_REVISION,
      isRepeatOrder: false,
      contactInfo: "test2",
      source: "System",
      productInterest: "Test",
      picId: pic.id
    },
    {
      clientName: "TEST-PRODUKSI",
      stage: PipelineStage.SPK_SIGNED,
      isRepeatOrder: false,
      contactInfo: "test3",
      source: "System",
      productInterest: "Test",
      picId: pic.id
    },
    {
      clientName: "TEST-RO-VIP",
      stage: PipelineStage.NEW_LEAD,
      isRepeatOrder: true,
      contactInfo: "test4",
      source: "System",
      productInterest: "Test",
      picId: pic.id
    }
  ];

  for (const data of testLeads) {
    const lead = await prisma.salesLead.create({ data });
    console.log(`✅ Created: ${lead.clientName} -> ${lead.stage} (RO: ${lead.isRepeatOrder})`);

    // Tambahkan log timeline
    await prisma.leadTimelineLog.create({
      data: {
        leadId: lead.id,
        action: 'CREATED',
        newStage: lead.stage,
        notes: 'Stress Test Categorization',
        loggedBy: 'SYSTEM_TEST'
      }
    });
  }

  console.log('\n🚀 STRESS TEST DATA DEPLOYED SUCCESSFULLY.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
