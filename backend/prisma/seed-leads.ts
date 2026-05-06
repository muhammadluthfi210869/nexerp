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
  console.log('🚀 EMERGENCY SEEDING: SALES LEADS FOR R&D...');

  // 1. Ensure a Bussdev Staff exists
  const staff = await prisma.bussdevStaff.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy UUID for seeding
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'System Seeder',
      isActive: true,
    }
  }).catch(async () => {
      // Fallback if upsert fails on ID
      return await prisma.bussdevStaff.create({
        data: { name: 'System Seeder', isActive: true }
      });
  });

  const testLeads = [
    {
      clientName: 'PT. GLOBAL BEAUTY',
      brandName: 'AURA',
      contactInfo: '0812-9999-8888',
      source: 'System',
      productInterest: 'Advanced Serum',
      stage: PipelineStage.NEGOTIATION,
      picId: staff.id,
    },
    {
      clientName: 'CV. HARAPAN BANGSA',
      brandName: 'PURE',
      contactInfo: '0855-1111-2222',
      source: 'System',
      productInterest: 'Clay Mask',
      stage: PipelineStage.NEW_LEAD,
      picId: staff.id,
    },
    {
      clientName: 'LOGO INDONESIA',
      brandName: 'HERB',
      contactInfo: '0822-4444-5555',
      source: 'System',
      productInterest: 'Body Lotion',
      stage: PipelineStage.SAMPLE_PROCESS,
      picId: staff.id,
    }
  ];

  for (const lead of testLeads) {
    await prisma.salesLead.create({ data: lead });
    console.log(`✅ Seeded: ${lead.clientName}`);
  }

  console.log('📊 EMERGENCY SEEDING COMPLETE');
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
