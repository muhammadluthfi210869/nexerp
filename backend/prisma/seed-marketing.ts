import 'dotenv/config';
import { PrismaClient, TrafficSource, PipelineStage, ContentCategory, UserRole } from '@prisma/client';
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
  console.log('🚀 INITIALIZING MARKETING DATA INJECTION...');

  // 1. CLEANUP PREVIOUS DATA (Safety First)
  console.log('🧹 Clearing old marketing & target data...');
  await prisma.dailyAdsMetric.deleteMany({});
  await prisma.accountHealthLog.deleteMany({});
  await prisma.contentAsset.deleteMany({});
  await prisma.marketingTarget.deleteMany({});
  
  // Clean up SO first due to FK constraints
  await prisma.salesOrder.deleteMany({
    where: {
      lead: {
        source: {
          in: ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'],
        },
      },
    },
  });

  // Only delete leads from our simulation sources to preserve other test data
  await prisma.salesLead.deleteMany({
    where: {
      source: {
        in: ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'],
      },
    },
  });

  console.log('✅ Cleanup completed.');

  // 1.1 SEED MARKETING TARGETS
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  console.log(`🎯 Setting ${currentMonth}/${currentYear} Targets...`);
  await prisma.marketingTarget.upsert({
    where: { month_year: { month: currentMonth, year: currentYear } },
    update: {
      revenueTarget: 1500000000,
      spendTarget: 50000000,
      leadTarget: 500,
      sampleTarget: 50,
      postTarget: 60,
      clientAcqTarget: 20
    },
    create: {
      month: currentMonth,
      year: currentYear,
      revenueTarget: 1500000000,
      spendTarget: 50000000,
      leadTarget: 500,
      sampleTarget: 50,
      postTarget: 60,
      clientAcqTarget: 20
    }
  });

  // 2. GET BD STAFF (Required for Leads)
  const bdStaff = await prisma.bussdevStaff.findFirst();

  if (!bdStaff) {
    // If no staff, create one
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found to create staff profile');
    
    await prisma.bussdevStaff.create({
      data: {
        name: user.fullName || 'Default Staff',
        targetRevenue: 1000000000,
        userId: user.id
      }
    });
  }
  
  const currentStaff = await prisma.bussdevStaff.findFirst() as any;

  // We need a dummy sample/npf for SalesOrders
  console.log('🧪 Creating dummy development chain for Sales Simulation...');
  const dummyLead = await prisma.salesLead.create({
    data: {
      clientName: 'DUMMY FOR SO',
      contactInfo: '000',
      source: 'OTHER',
      productInterest: 'General',
      picId: currentStaff.id
    }
  });
  const dummyNPF = await prisma.newProductForm.create({
    data: {
      leadId: dummyLead.id,
      productName: 'Dummy Base',
      targetPrice: 15000
    }
  });
  const dummySample = await prisma.sampleRequest.create({
    data: {
      leadId: dummyLead.id,
      productName: 'Dummy Sample',
      targetFunction: 'Dummy Function',
      textureReq: 'Dummy Texture',
      colorReq: 'Dummy Color',
      aromaReq: 'Dummy Aroma',
      stage: 'APPROVED' as any,
    }
  });

  const platforms: string[] = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];
  
  console.log(`📈 Monitoring 14-day performance simulation [${currentMonth}/${currentYear} Launch]...`);

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(now.getDate() - (14 - i)); // Last 14 days
    const dateOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dateStr = dateOnly.toISOString().split('T')[0];

    process.stdout.write(`\rInjecting Day ${i+1}/14 [${dateStr}]... `);

    // --- ADS PERFORMANCE ---
    for (const platform of platforms) {
      let dailySpend = 0;
      if (platform === 'FB_ADS' || platform === 'IG_ADS') dailySpend = 1000000;
      else if (platform === 'TIKTOK_ADS') dailySpend = 850000;
      else dailySpend = 570000;

      const leadsCount = Math.floor(dailySpend / (platform === 'GOOGLE_ADS' ? 15000 : 5000));

      await prisma.dailyAdsMetric.create({
        data: {
          date: dateOnly,
          platform: platform as any,
          spend: dailySpend,
          impressions: dailySpend * 10,
          reach: dailySpend * 8,
          clicks: dailySpend / 100,
          leadsGenerated: leadsCount,
        },
      });

      // --- LEAD INJECTION ---
      for (let l = 0; l < leadsCount; l++) {
        const stage = (i % 5 === 0) ? PipelineStage.WON_DEAL : (i % 3 === 0) ? PipelineStage.SAMPLE_PROCESS : PipelineStage.NEW_LEAD;
        
        const lead = await prisma.salesLead.create({
          data: {
            clientName: `Client ${platform} ${i}-${l}`,
            contactInfo: `0812${Math.floor(Math.random() * 100000000)}`,
            source: platform,
            stage: stage,
            picId: currentStaff.id,
            productInterest: ['SKINCARE', 'BODYCARE', 'BABYCARE'][Math.floor(Math.random() * 3)],
            createdAt: dateOnly,
          },
        });

        // IF DEAL, CREATE SALES ORDER FOR ROAS SIMULATION
        if (stage === PipelineStage.WON_DEAL) {
          await prisma.salesOrder.create({
            data: {
              id: `SO-SIM-${platform}-${i}-${l}-${Date.now()}`,
              totalAmount: platform === 'GOOGLE_ADS' ? 450000000 : 120000000,
              status: 'COMPLETED' as any,
              leadId: lead.id,
              sampleId: dummySample.id,
              transactionDate: dateOnly,
            }
          });
        }
      }
    }

    // --- ORGANIC PERFORMANCE
    if (i === 13) {
      await prisma.accountHealthLog.create({
        data: {
          year: currentYear,
          weekNumber: 18, // May week
          platform: 'IG_ORGANIC',
          totalFollowers: 10000,
          followerGrowth: 450,
          totalReach: 150000,
          profileVisits: 3200,
        },
      });
    }
  }

  console.log('\n📊 Generating viral viral content patterns...');

  const viralPosts = [
    { title: 'Step-by-step Maklon Skincare', cat: ContentCategory.EDUCATIONAL, views: 45000, er: 8.2 },
    { title: 'Behind the Scenes Produksi', cat: ContentCategory.BEHIND_THE_SCENES, views: 22000, er: 5.5 },
    { title: 'Promo Free Sample April', cat: ContentCategory.PROMOTIONAL, views: 12000, er: 12.4 },
  ];

  for (const v of viralPosts) {
    await prisma.contentAsset.create({
      data: {
        publishDate: new Date(),
        title: v.title,
        contentPillar: v.cat as any,
        platform: 'IG_ORGANIC',
        views: v.views,
        engagementRate: v.er,
        likes: Math.floor(v.views * 0.05),
        comments: Math.floor(v.views * 0.01),
        shares: Math.floor(v.views * 0.005),
        saves: Math.floor(v.views * 0.01),
      },
    });
  }

  console.log('✅ DREAMLAB APRIL LAUNCH: System  saturation complete.');
}

main()
  .catch((e) => {
    console.error('\n❌ SEEDING FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
