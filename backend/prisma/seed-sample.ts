import 'dotenv/config';
import { PrismaClient, SampleStage } from '@prisma/client';
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
  console.log('🧪 INJECTING TEST SAMPLE...');

  const lead = await prisma.salesLead.findFirst({
    where: { clientName: 'PT. GLOBAL BEAUTY' }
  });

  if (!lead) {
      console.log('❌ Error: PT. GLOBAL BEAUTY lead not found. Run seed-leads.ts first.');
      return;
  }

  await prisma.sampleRequest.create({
    data: {
      leadId: lead.id,
      productName: 'AURA Radiance Serum',
      targetFunction: 'Whitening & Anti-Aging',
      textureReq: 'Liquid Gel',
      colorReq: 'Clear with Gold Flecks',
      aromaReq: 'Luxury Rose',
      stage: SampleStage.FORMULATING,
    }
  });

  console.log('✅ Sample Created: AURA Radiance Serum');
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
