const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load ENV
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function testMarketingAttribution() {
  console.log('🚀 Starting Marketing Attribution Audit Test (Final Fix)...');

  const simulationDate = new Date('2026-04-24T00:00:00Z');
  const platformLogs = 'IG_ADS';
  const platformCRM = 'Instagram';

  try {
    // 1. Create Marketing Log
    console.log('📝 Creating Marketing Log entry...');
    await prisma.dailyAdsMetric.upsert({
      where: {
        date_platform_campaignName: {
          date: simulationDate,
          platform: platformLogs,
          campaignName: 'Audit-Final-Test-v2',
        },
      },
      update: {
        spend: 1000000,
        leadsGenerated: 15,
      },
      create: {
        date: simulationDate,
        platform: platformLogs,
        campaignName: 'Audit-Final-Test-v2',
        spend: 1000000,
        leadsGenerated: 15,
      },
    });

    // 2. Create CRM Lead
    console.log('👥 Creating CRM Lead from "Instagram"...');
    const lead = await prisma.salesLead.create({
      data: {
        name: 'Final Audit Lead',
        clientName: 'Audit Corp', // Required field
        email: `final-test-${Date.now()}@example.com`,
        source: platformCRM,
        stage: 'WON_DEAL',
        status: 'ACTIVE',
      },
    });

    // 3. Create Sales Order
    console.log('💰 Creating Sales Order...');
    await prisma.salesOrder.create({
      data: {
        orderNumber: `ORD-FINAL-${Date.now()}`,
        leadId: lead.id,
        totalAmount: 5000000,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    });

    console.log('\n✅ DUMMY DATA CREATED SUCCESSFULLY!');
    console.log('------------------------------------');
    console.log('Results should now be visible on Dashboard for IG_ADS.');
    console.log('Expected: 15 Reported Leads, 1 CRM Lead, 5M Revenue.');
    console.log('------------------------------------');

  } catch (error) {
    console.error('❌ Audit Test Failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testMarketingAttribution();
