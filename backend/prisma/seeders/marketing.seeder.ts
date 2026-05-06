
import { PrismaClient, TrafficSource, ContentCategory } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, randomDecimal } from './utils';

export async function seedMarketing(prisma: PrismaClient) {
  console.log('🌱 Seeding Marketing Data...');

  const platforms = Object.values(TrafficSource) as TrafficSource[];
  const categories = Object.values(ContentCategory) as ContentCategory[];

  // 1. Daily Ads Metrics (April 2026)
  for (let i = 1; i <= 30; i++) {
    const date = new Date(2026, 3, i); // April is 3
    
    for (const platform of platforms) {
      await prisma.dailyAdsMetric.create({
        data: {
          date,
          platform,
          spend: randomDecimal(500000, 5000000),
          impressions: randomInt(10000, 100000),
          reach: randomInt(8000, 80000),
          clicks: randomInt(500, 5000),
          leadsGenerated: randomInt(10, 100),
          campaignName: `Campaign ${platform} ${faker.commerce.productAdjective()}`,
        }
      });
    }
  }

  // 2. Marketing Targets
  for (let m = 1; m <= 12; m++) {
    await prisma.marketingTarget.upsert({
      where: { month_year: { month: m, year: 2026 } },
      update: {},
      create: {
        month: m,
        year: 2026,
        leadTarget: randomInt(1000, 5000),
        postTarget: randomInt(20, 50),
        revenueTarget: randomDecimal(1000000000, 5000000000),
        spendTarget: randomDecimal(100000000, 500000000),
      }
    });
  }

  // 3. Weekly Organic Health Logs (April 2026)
  for (let w = 14; w <= 17; w++) {
    for (const platform of ['IG_ORGANIC', 'TIKTOK_ORGANIC', 'OTHER']) {
      await prisma.accountHealthLog.create({
        data: {
          year: 2026,
          weekNumber: w,
          platform: platform as TrafficSource,
          totalFollowers: randomInt(10000, 50000),
          followerGrowth: randomInt(100, 1000),
          unfollows: randomInt(10, 50),
          totalReach: randomInt(50000, 200000),
          profileVisits: randomInt(1000, 5000),
          postsCount: randomInt(3, 7),
          storiesCount: randomInt(10, 30),
          avgStoryViews: randomInt(500, 2000),
          likesCount: randomInt(1000, 5000),
          commentsCount: randomInt(50, 200),
          sharesCount: randomInt(100, 500),
          savesCount: randomInt(100, 500),
        }
      });
    }
  }

  // 4. Content Assets (April 2026)
  for (let i = 0; i < 50; i++) {
    await prisma.contentAsset.create({
      data: {
        publishDate: new Date(2026, 3, randomInt(1, 30)),
        platform: randomElement(platforms),
        contentPillar: randomElement(categories),
        title: faker.lorem.sentence(),
        url: faker.internet.url(),
        views: randomInt(1000, 50000),
        likes: randomInt(100, 5000),
        comments: randomInt(10, 500),
        engagementRate: randomDecimal(1, 10),
      }
    });
  }

  console.log('✅ Marketing Data Seeded.');
}
