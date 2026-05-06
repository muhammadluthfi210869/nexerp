import 'dotenv/config';
import { PrismaClient, TrafficSource, ContentCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const ADS_PLATFORMS: TrafficSource[] = [
  'IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS',
];

const ORGANIC_PLATFORMS: TrafficSource[] = [
  'IG_ORGANIC', 'TIKTOK_ORGANIC', 'FB_ORGANIC',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

async function main() {
  console.log('🌱 Seeding Digital Marketing Data...');

  // 1. Create DIGIMAR user for context
  const hp = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'digimar@dreamlab.com' },
    update: {},
    create: {
      email: 'digimar@dreamlab.com',
      fullName: 'Digital Marketing Manager',
      passwordHash: hp,
      roles: ['DIGIMAR', 'MARKETING'],
      status: 'ACTIVE',
    },
  });

  // 2. Marketing Targets — April & May 2026
  const targets = [
    { month: 4, year: 2026, leadTarget: 85, postTarget: 24, revenueTarget: 450000000, spendTarget: 75000000, clientAcqTarget: 12, sampleTarget: 30 },
    { month: 5, year: 2026, leadTarget: 100, postTarget: 28, revenueTarget: 550000000, spendTarget: 90000000, clientAcqTarget: 15, sampleTarget: 35 },
  ];
  for (const t of targets) {
    await prisma.marketingTarget.upsert({
      where: { month_year: { month: t.month, year: t.year } },
      update: t,
      create: t,
    });
  }
  console.log('  ✅ Marketing targets (Apr–May 2026)');

  // 3. Daily Ads Metrics — 30 days (April 2026)
  const rng = seededRandom(42);
  const dailyRecords: { date: Date; platform: TrafficSource; spend: number; impressions: number; reach: number; clicks: number; leadsGenerated: number }[] = [];

  for (let day = 1; day <= 30; day++) {
    const date = new Date(2026, 3, day);
    for (const platform of ADS_PLATFORMS) {
      const baseFactor = platform === 'IG_ADS' ? 1.0 : platform === 'TIKTOK_ADS' ? 0.85 : platform === 'FB_ADS' ? 0.6 : 0.75;
      const dayFactor = 1 + Math.sin(day / 5) * 0.2;
      const noise = 0.85 + rng() * 0.3;

      const spend = Math.round(500000 * baseFactor * dayFactor * noise / 1000) * 1000;
      const cpm = 30000 + rng() * 15000;
      const impressions = Math.round(spend / cpm * 1000);
      const reach = Math.round(impressions * (0.4 + rng() * 0.3));
      const ctr = 0.015 + rng() * 0.025;
      const clicks = Math.round(impressions * ctr);
      const leadsGenerated = Math.round(clicks * (0.03 + rng() * 0.05));

      dailyRecords.push({ date, platform, spend, impressions, reach, clicks, leadsGenerated });
    }
  }

  for (const rec of dailyRecords) {
    await prisma.dailyAdsMetric.upsert({
      where: { date_platform_campaignName: { date: rec.date, platform: rec.platform, campaignName: 'General' } },
      update: rec,
      create: { ...rec, campaignName: 'General' },
    });
  }
  console.log(`  ✅ ${dailyRecords.length} daily ads records (30 days × 4 platforms)`);

  // 4. Account Health (Organic) — 12 weeks (Feb–Apr 2026)
  const healthRecords: {
    platform: TrafficSource; totalFollowers: number; followerGrowth: number;
    unfollows: number; totalReach: number; profileVisits: number;
    postsCount: number; storiesCount: number; avgStoryViews: number;
    likesCount: number; commentsCount: number; savesCount: number;
    sharesCount: number; weekNumber: number; year: number;
  }[] = [];

  const followersBase: Record<string, number> = { IG_ORGANIC: 18500, TIKTOK_ORGANIC: 12000, FB_ORGANIC: 8500 };

  for (let week = 5; week <= 16; week++) {
    for (const platform of ORGANIC_PLATFORMS) {
      const pf = platform === 'IG_ORGANIC' ? 1.0 : platform === 'TIKTOK_ORGANIC' ? 1.3 : 0.5;
      const n = seededRandom(week * 100 + platform.charCodeAt(0) * 10);
      const growth = Math.round(80 * pf * (0.8 + n() * 0.4));
      followersBase[platform] += growth;

      const reach = Math.round(followersBase[platform] * (1.5 + n() * 1.5));
      const visits = Math.round(followersBase[platform] * (0.15 + n() * 0.1));
      const posts = Math.round(2 + n() * 3);
      const stories = Math.round(5 + n() * 8);
      const storyViews = Math.round(followersBase[platform] * (0.08 + n() * 0.06));

      healthRecords.push({
        platform,
        totalFollowers: followersBase[platform],
        followerGrowth: growth,
        unfollows: Math.round(20 * pf * (0.5 + n() * 0.5)),
        totalReach: reach,
        profileVisits: visits,
        postsCount: posts,
        storiesCount: stories,
        avgStoryViews: storyViews,
        likesCount: Math.round(reach * (0.03 + n() * 0.02)),
        commentsCount: Math.round(reach * (0.003 + n() * 0.005)),
        savesCount: Math.round(reach * (0.005 + n() * 0.008)),
        sharesCount: Math.round(reach * (0.002 + n() * 0.004)),
        weekNumber: week,
        year: 2026,
      });
    }
  }

  for (const rec of healthRecords) {
    await prisma.accountHealthLog.upsert({
      where: { year_weekNumber_platform: { year: rec.year, weekNumber: rec.weekNumber, platform: rec.platform } },
      update: rec,
      create: rec,
    });
  }
  console.log(`  ✅ ${healthRecords.length} organic health records (12 weeks × 3 platforms)`);

  // 5. Content Assets — 12 posts with realistic data
  const contentAssets = [
    { title: 'Serum Vitamin C — Brightening Benefits', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'EDUCATIONAL' as ContentCategory, url: 'https://instagram.com/p/abc1', views: 12500, likes: 890, comments: 45, shares: 230, saves: 410 },
    { title: 'Dreamlab Production Tour BTS', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'BEHIND_THE_SCENES' as ContentCategory, url: 'https://instagram.com/p/abc2', views: 22000, likes: 1540, comments: 89, shares: 520, saves: 310 },
    { title: 'New Launch: Hydra Glow Moisturizer', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'PROMOTIONAL' as ContentCategory, url: 'https://instagram.com/p/abc3', views: 31800, likes: 2100, comments: 156, shares: 890, saves: 1200 },
    { title: 'Skincare Routine for Oily Skin', platform: 'TIKTOK_ORGANIC' as TrafficSource, contentPillar: 'EDUCATIONAL' as ContentCategory, url: 'https://tiktok.com/@dreamlab/vid1', views: 85000, likes: 6200, comments: 210, shares: 1800, saves: 950 },
    { title: 'Before After — 30 Day Challenge', platform: 'TIKTOK_ORGANIC' as TrafficSource, contentPillar: 'ENTERTAINMENT' as ContentCategory, url: 'https://tiktok.com/@dreamlab/vid2', views: 120000, likes: 9400, comments: 380, shares: 3200, saves: 2100 },
    { title: 'How We Formulate Your Products', platform: 'FB_ORGANIC' as TrafficSource, contentPillar: 'BEHIND_THE_SCENES' as ContentCategory, url: 'https://facebook.com/dreamlab/post1', views: 5800, likes: 420, comments: 38, shares: 95, saves: 62 },
    { title: 'Flash Sale — 20% Off All Serums', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'PROMOTIONAL' as ContentCategory, url: 'https://instagram.com/p/abc4', views: 28900, likes: 1850, comments: 210, shares: 1450, saves: 620 },
    { title: 'Why Glass Packaging Matters', platform: 'TIKTOK_ORGANIC' as TrafficSource, contentPillar: 'EDUCATIONAL' as ContentCategory, url: 'https://tiktok.com/@dreamlab/vid3', views: 62000, likes: 4100, comments: 175, shares: 1100, saves: 780 },
    { title: 'Meet Our R&D Team', platform: 'FB_ORGANIC' as TrafficSource, contentPillar: 'BEHIND_THE_SCENES' as ContentCategory, url: 'https://facebook.com/dreamlab/post2', views: 4200, likes: 310, comments: 28, shares: 72, saves: 45 },
    { title: 'Ramadan Special — Exclusive Bundle', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'PROMOTIONAL' as ContentCategory, url: 'https://instagram.com/p/abc5', views: 45600, likes: 3200, comments: 280, shares: 2100, saves: 1500 },
    { title: 'Lip Mask DIY — Can You Do It?', platform: 'TIKTOK_ORGANIC' as TrafficSource, contentPillar: 'ENTERTAINMENT' as ContentCategory, url: 'https://tiktok.com/@dreamlab/vid4', views: 95000, likes: 7100, comments: 290, shares: 2400, saves: 1300 },
    { title: 'Client Testimonial: Kosmetik Jaya', platform: 'IG_ORGANIC' as TrafficSource, contentPillar: 'PROMOTIONAL' as ContentCategory, url: 'https://instagram.com/p/abc6', views: 16200, likes: 1050, comments: 62, shares: 380, saves: 210 },
  ];

  for (const asset of contentAssets) {
    const totalEng = asset.likes + asset.comments + asset.shares + asset.saves;
    const engagementRate = asset.views > 0 ? parseFloat(((totalEng / asset.views) * 100).toFixed(2)) : 0;
    const publishDate = new Date(2026, 3, 1 + Math.floor(Math.random() * 28));

    await prisma.contentAsset.create({
      data: {
        publishDate,
        platform: asset.platform,
        contentPillar: asset.contentPillar,
        title: asset.title,
        url: asset.url,
        views: asset.views,
        likes: asset.likes,
        comments: asset.comments,
        shares: asset.shares,
        saves: asset.saves,
        engagementRate,
        auditStatus: 'PENDING',
      },
    });
  }
  console.log(`  ✅ ${contentAssets.length} content assets`);

  // 6. Search Visibility Metrics — 3 months (Feb–Apr 2026)
  const searchVisibilityData = [
    { month: 2, year: 2026, impressions: BigInt(1850000), clicks: BigInt(133200), avgCtr: 7.2, avgPosition: 4.8 },
    { month: 3, year: 2026, impressions: BigInt(2100000), clicks: BigInt(159600), avgCtr: 7.6, avgPosition: 4.5 },
    { month: 4, year: 2026, impressions: BigInt(2400000), clicks: BigInt(184800), avgCtr: 7.7, avgPosition: 4.2 },
  ];

  for (const sv of searchVisibilityData) {
    await prisma.searchVisibilityMetric.upsert({
      where: { month_year: { month: sv.month, year: sv.year } },
      update: sv,
      create: sv,
    });
  }
  console.log(`  ✅ ${searchVisibilityData.length} search visibility records (Feb–Apr 2026)`);

  console.log('✅ Digital Marketing Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
