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
  console.log('🌱 TOTAL SEEDING LEADS & STAFF...');

  // 1. Create Bussdev Staff
  const staff = await prisma.bussdevStaff.create({
    data: {
      name: 'Budi (Senior BD)',
      targetRevenue: 500000000,
      isActive: true,
    }
  });
  console.log(`✅ Staff Created: ${staff.name}`);

  // 2. Create Test Leads
  const testLeads = [
    {
      clientName: 'PT. Kosmetik Jaya',
      brandName: 'GlowUp',
      contactInfo: '08123456789',
      source: 'Direct',
      productInterest: 'Serum Whitening',
      stage: PipelineStage.SAMPLE_PROCESS,
      picId: staff.id,
    },
    {
      clientName: 'CV. Budi Luhur',
      brandName: 'NaturePure',
      contactInfo: '08111112222',
      source: 'Instagram',
      productInterest: 'Sunscreen Gel',
      stage: PipelineStage.SAMPLE_PROCESS,
      picId: staff.id,
    }
  ];

  for (const lead of testLeads) {
    await prisma.salesLead.create({
      data: lead,
    });
    console.log(`✅ Lead Created: ${lead.clientName}`);
  }

  console.log('📊 TOTAL SEEDING COMPLETE');
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
