import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
  console.log('🔍 INITIATING DATABASE AUDIT...');
  console.log('📡 Target URL:', process.env.DATABASE_URL?.split('@')[1] || 'URL NOT FOUND');

  const samples = await prisma.sampleRequest.findMany({ 
    include: { 
        lead: true 
    } 
  });

  const leads = await prisma.salesLead.count();
  const staff = await prisma.bussdevStaff.count();

  console.log('\n=== DIRECT DB COLLATION ===');
  console.log(`- Sample Requests: ${samples.length}`);
  console.log(`- Total Sales Leads (Dropdown Data): ${leads}`);
  console.log(`- Total Bussdev Staff: ${staff}`);

  if (samples.length > 0) {
    console.log('\n=== SAMPLE PREVIEW (JSON) ===');
    console.log(JSON.stringify(samples[0], null, 2));
  } else {
    console.log('\n⚠️ WARNING: NO SAMPLES FOUND IN TABLE `sample_requests`');
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

main()
  .catch((e) => console.error('❌ AUDIT ERROR:', e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
