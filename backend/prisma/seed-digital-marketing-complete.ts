import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Seeding Complete Digital Marketing Data (Dreamlab & Toribio)...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Team Members & Users
  const membersData = [
    {
      name: 'Gusti',
      fullName: 'Gusti Bagus',
      email: 'gusti@dreamlab.id',
      role: 'Lead Digital & Brand Strategist',
      department: 'Digital Strategy',
      phone: '+62 812-3456-7801',
      avatarBg: '#e8eef6',
      initial: 'G',
    },
    {
      name: 'Revita',
      fullName: 'Revita Yustianawati',
      email: 'revita@dreamlab.id',
      role: 'Creative Content & Social Media Lead',
      department: 'Social Media',
      phone: '+62 813-9876-5432',
      avatarBg: '#fce7f3',
      initial: 'R',
    },
    {
      name: 'Zarkasi',
      fullName: 'Muhammad Zarkasi',
      email: 'zarkasi@dreamlab.id',
      role: 'Graphic Designer & Visual Specialist',
      department: 'Design & Visual',
      phone: '+62 821-4567-8902',
      avatarBg: '#fef3c7',
      initial: 'Z',
    },
    {
      name: 'Rahmat',
      fullName: 'Rahmat Hidayat',
      email: 'rahmat@dreamlab.id',
      role: 'Video Production & Copywriter',
      department: 'Production',
      phone: '+62 856-7890-1234',
      avatarBg: '#dcfce7',
      initial: 'R',
    },
    {
      name: 'Aurel',
      fullName: 'Aurelia Putri',
      email: 'aurel@dreamlab.id',
      role: 'Social Media Officer & Community',
      department: 'Social Media',
      phone: '+62 857-1234-5678',
      avatarBg: '#e0e7ff',
      initial: 'A',
    },
  ];

  const userMap: Record<string, string> = {};

  for (const m of membersData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        fullName: m.fullName,
        roles: ['MARKETING', 'DIGIMAR'],
        status: 'ACTIVE',
      },
      create: {
        email: m.email,
        fullName: m.fullName,
        passwordHash,
        roles: ['MARKETING', 'DIGIMAR'],
        status: 'ACTIVE',
      },
    });

    userMap[m.name] = user.id;

    await prisma.marketingTeamMember.upsert({
      where: { email: m.email },
      update: {
        name: m.name,
        role: m.role,
        department: m.department,
        phone: m.phone,
        avatarBg: m.avatarBg,
        initial: m.initial,
        userId: user.id,
        isActive: true,
      },
      create: {
        name: m.name,
        role: m.role,
        department: m.department,
        email: m.email,
        phone: m.phone,
        avatarBg: m.avatarBg,
        initial: m.initial,
        userId: user.id,
        isActive: true,
      },
    });
  }

  // 2. Seed Marketing Brands: Dreamlab & Toribio
  const brandDreamlab = await prisma.marketingBrand.upsert({
    where: { code: 'dreamlab' },
    update: {
      name: 'Dreamlab',
      handle: '@dreamlab.workspace',
      primaryPlatform: 'Instagram & LinkedIn',
      accentToken: '#1264d3',
      notes: 'B2B Cosmetic R&D & Maklon formulation laboratory. Tone: Professional, authoritative, sleek, innovative.',
      isActive: true,
      ownerId: userMap['Revita'],
    },
    create: {
      code: 'dreamlab',
      name: 'Dreamlab',
      handle: '@dreamlab.workspace',
      primaryPlatform: 'Instagram & LinkedIn',
      accentToken: '#1264d3',
      notes: 'B2B Cosmetic R&D & Maklon formulation laboratory. Tone: Professional, authoritative, sleek, innovative.',
      isActive: true,
      ownerId: userMap['Revita'],
    },
  });

  const brandToribio = await prisma.marketingBrand.upsert({
    where: { code: 'toribio' },
    update: {
      name: 'Toribio',
      handle: '@toribio.skincare',
      primaryPlatform: 'Instagram & TikTok',
      accentToken: '#ec4899',
      notes: 'B2C Skincare & Beauty brand focusing on skin barrier and radiant glow. Tone: Friendly, vibrant, aesthetic, relatable.',
      isActive: true,
      ownerId: userMap['Gusti'],
    },
    create: {
      code: 'toribio',
      name: 'Toribio',
      handle: '@toribio.skincare',
      primaryPlatform: 'Instagram & TikTok',
      accentToken: '#ec4899',
      notes: 'B2C Skincare & Beauty brand focusing on skin barrier and radiant glow. Tone: Friendly, vibrant, aesthetic, relatable.',
      isActive: true,
      ownerId: userMap['Gusti'],
    },
  });

  console.log(`✅ Brands seeded: ${brandDreamlab.name} & ${brandToribio.name}`);

  // 3. Seed Marketing Tasks
  const sampleTasks = [
    {
      taskCode: 'TSK-G-001',
      title: 'Check Incoming Leads & Pitch Decks',
      assignee: 'Gusti',
      brand: 'Dreamlab',
      priority: 'HIGH',
      status: 'DONE',
      taskType: 'DAILY',
      brief: 'Review daily CRM inbox for B2B skincare formulation inquiries.',
      dueDate: new Date('2026-09-09'),
    },
    {
      taskCode: 'TSK-G-002',
      title: 'Update Daily Report & Campaign Metrics',
      assignee: 'Gusti',
      brand: 'Dreamlab',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      taskType: 'DAILY',
      brief: 'Update Meta Ads spend, CTR, CPL, and Organic Reach in dashboard.',
      dueDate: new Date('2026-09-09'),
    },
    {
      taskCode: 'TSK-R-001',
      title: 'Finalize Carousel Desain Edukasi Formulasi',
      assignee: 'Revita',
      brand: 'Dreamlab',
      priority: 'HIGH',
      status: 'DONE',
      taskType: 'DAILY',
      brief: 'Konten 7 slide anatomi skin barrier & bahan aktif niacinamide 5%.',
      dueDate: new Date('2026-09-09'),
    },
    {
      taskCode: 'TSK-R-002',
      title: 'Publish Instagram Stories Update Pabrik',
      assignee: 'Revita',
      brand: 'Dreamlab',
      priority: 'MEDIUM',
      status: 'DONE',
      taskType: 'DAILY',
      brief: 'Tiga sequence story BTS lab mixer steril di Cikarang.',
      dueDate: new Date('2026-09-09'),
    },
    {
      taskCode: 'TSK-Z-001',
      title: 'Desain Banner Promo Maklon Q4',
      assignee: 'Zarkasi',
      brand: 'Dreamlab',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      taskType: 'PROJECT',
      brief: 'Asset visual untuk landing page dan campaign display Google Ads.',
      dueDate: new Date('2026-09-15'),
    },
    {
      taskCode: 'TSK-RH-001',
      title: 'Editing Video Reels Lab Tour Cleanroom',
      assignee: 'Rahmat',
      brand: 'Dreamlab',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      taskType: 'PROJECT',
      brief: 'Reels 60 detik dengan grading klinis modern, sound trending.',
      dueDate: new Date('2026-09-12'),
    },
  ];

  for (const t of sampleTasks) {
    const ownerId = userMap[t.assignee] || userMap['Revita'];
    await prisma.marketingTask.upsert({
      where: { taskCode: t.taskCode },
      update: {
        title: t.title,
        ownerId,
        assigneeId: ownerId,
        priority: t.priority,
        status: t.status,
        canonicalStatus: t.status,
        taskType: t.taskType,
        brief: t.brief,
        brand: t.brand,
        dueDate: t.dueDate,
      },
      create: {
        taskCode: t.taskCode,
        title: t.title,
        ownerId,
        assigneeId: ownerId,
        priority: t.priority,
        status: t.status,
        canonicalStatus: t.status,
        taskType: t.taskType,
        brief: t.brief,
        brand: t.brand,
        dueDate: t.dueDate,
      },
    });
  }

  console.log(`✅ Seeded sample tasks successfully`);

  // 4. Seed Reporting Period for Dreamlab & Toribio (September 2026)
  const sepStart = new Date('2026-09-01');
  const sepEnd = new Date('2026-09-30');

  await prisma.marketingReportingPeriod.upsert({
    where: {
      brandId_periodStart_periodEnd: {
        brandId: brandDreamlab.id,
        periodStart: sepStart,
        periodEnd: sepEnd,
      },
    },
    update: {},
    create: {
      brandId: brandDreamlab.id,
      periodStart: sepStart,
      periodEnd: sepEnd,
      status: 'PUBLISHED',
      createdById: userMap['Revita'],
    },
  });

  await prisma.marketingReportingPeriod.upsert({
    where: {
      brandId_periodStart_periodEnd: {
        brandId: brandToribio.id,
        periodStart: sepStart,
        periodEnd: sepEnd,
      },
    },
    update: {},
    create: {
      brandId: brandToribio.id,
      periodStart: sepStart,
      periodEnd: sepEnd,
      status: 'PUBLISHED',
      createdById: userMap['Gusti'],
    },
  });

  console.log('✅ Created Reporting Periods for September 2026.');
  console.log('🎉 Seeding Digital Marketing Finished Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
