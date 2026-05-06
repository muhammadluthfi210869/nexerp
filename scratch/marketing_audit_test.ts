import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMarketingAttribution() {
  console.log('🚀 Starting Marketing Attribution Audit Test...');

  const simulationDate = new Date('2026-04-24T00:00:00Z');
  const platformLogs = 'IG_ADS';
  const platformCRM = 'Instagram'; // The disparate name

  try {
    // 1. Create Marketing Log (The Spend)
    console.log('📝 Creating Marketing Log entry...');
    await prisma.dailyAdsMetric.upsert({
      where: {
        date_platform_campaignName: {
          date: simulationDate,
          platform: platformLogs,
          campaignName: 'Audit-Test-Campaign',
        },
      },
      update: {
        spend: 1000000, // 1jt Spend
        leadsGenerated: 15, // 15 Leads Reported
      },
      create: {
        date: simulationDate,
        platform: platformLogs,
        campaignName: 'Audit-Test-Campaign',
        spend: 1000000,
        leadsGenerated: 15,
      },
    });

    // 2. Create CRM Lead with disparate source name
    console.log('👥 Creating CRM Lead from "Instagram"...');
    const lead = await prisma.salesLead.create({
      data: {
        name: 'Test Audit Lead',
        email: `test-${Date.now()}@example.com`,
        source: platformCRM,
        stage: 'WON_DEAL',
        status: 'ACTIVE',
      },
    });

    // 3. Create Sales Order (The Revenue)
    console.log('💰 Creating Sales Order for the lead...');
    await prisma.salesOrder.create({
      data: {
        orderNumber: `ORD-AUDIT-${Date.now()}`,
        leadId: lead.id,
        totalAmount: 5000000, // 5jt Revenue
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    });

    console.log('\n✅ DUMMY DATA CREATED SUCCESSFULLY!');
    console.log('------------------------------------');
    console.log(`Platform (Logs): ${platformLogs}`);
    console.log(`Source (CRM): ${platformCRM}`);
    console.log('Expected Dashboard Results for IG_ADS:');
    console.log('- Leads Reported: 15 (from Logs)');
    console.log('- Leads Qualified: 1 (from CRM)');
    console.log('- Revenue: 5,000,000');
    console.log('- ROAS: 5.0x');
    console.log('------------------------------------');
    console.log('Please check your Marketing Dashboard now!');

  } catch (error) {
    console.error('❌ Audit Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMarketingAttribution();
