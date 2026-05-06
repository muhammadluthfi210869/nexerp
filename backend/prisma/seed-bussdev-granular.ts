import { PrismaClient, WorkflowStatus, SampleStage, LifecycleStatus, LostReason, ActivityType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Granular BussDev Seeding Start (Adapter Mode) ---');

  try {
    // 1. Ensure a BD User & Staff exists
    const bdUser = await prisma.user.upsert({
      where: { email: 'bd.manager@aureon.com' },
      update: {},
      create: {
        email: 'bd.manager@aureon.com',
        fullName: 'BussDev Manager',
        passwordHash: 'hashed_password', 
        roles: ['ADMIN'],
      },
    });

    const staff = await prisma.bussdevStaff.upsert({
      where: { userId: bdUser.id },
      update: { targetRevenue: 5000000000 },
      create: {
        userId: bdUser.id,
        name: 'BussDev Manager',
        targetRevenue: 5000000000,
      },
    });

    // 2. Create Rich Leads
    const leadsData = [
      {
        clientName: 'PT Kosmetik Jaya',
        brandName: 'GlowUp',
        contactInfo: '0812-3456-7890 (Bapak Budi)',
        city: 'Jakarta',
        source: 'Instagram Ads',
        productInterest: 'Serum Vitamin C',
        estimatedValue: 250000000,
        status: WorkflowStatus.NEGOTIATION,
        contactChannel: 'WhatsApp',
        moq: 5000,
        planOmset: 750000000,
        launchingPlan: 'Q3 2026',
        targetMarket: 'Gen Z Female',
      },
      {
        clientName: 'Siti Rahma',
        brandName: 'Rahma Skincare',
        contactInfo: 'rahma.skincare@email.com',
        city: 'Surabaya',
        source: 'Referral',
        productInterest: 'Sunscreen SPF 50',
        estimatedValue: 85000000,
        status: WorkflowStatus.SAMPLE_SENT,
        contactChannel: 'Direct Call',
        moq: 2000,
        planOmset: 150000000,
        launchingPlan: 'August 2026',
        targetMarket: 'Urban Professional',
      },
      {
        clientName: 'Beauty Bar Bali',
        brandName: 'Island Glow',
        contactInfo: 'info@beautybarbali.com',
        city: 'Denpasar',
        source: 'Exhibition',
        productInterest: 'Body Lotion Jasmine',
        estimatedValue: 120000000,
        status: WorkflowStatus.WON_DEAL,
        contactChannel: 'Email',
        moq: 3000,
        planOmset: 450000000,
        launchingPlan: 'End of 2025',
        targetMarket: 'Tourist / Spa',
      },
      {
        clientName: 'UD Maju Terus',
        brandName: 'Maju Man',
        contactInfo: '0877-9988-1122',
        city: 'Medan',
        source: 'Organic Search',
        productInterest: 'Beard Oil',
        estimatedValue: 45000000,
        status: WorkflowStatus.LOST,
        lostReason: LostReason.PRICE_ISSUE,
        contactChannel: 'WhatsApp',
        moq: 1000,
        planOmset: 80000000,
      }
    ] as any[];

    for (const data of leadsData) {
      const lead = await prisma.salesLead.create({
        data: {
          ...data,
          picId: staff.id,
          bdId: bdUser.id,
        }
      });

      // Add some activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          activityType: ActivityType.MEETING_OFFLINE,
          notes: `Initial meeting with ${data.clientName} regarding ${data.brandName}`,
        }
      });

      // Add Timeline logs
      await prisma.leadTimelineLog.create({
        data: {
          leadId: lead.id,
          action: 'CREATED_LEAD',
          newStatus: WorkflowStatus.NEW_LEAD,
          loggedBy: 'System',
        }
      });

      if (data.status !== (WorkflowStatus.NEW_LEAD as any)) {
        await prisma.leadTimelineLog.create({
          data: {
            leadId: lead.id,
            action: 'ADVANCED_TO_SAMPLE',
            previousStatus: WorkflowStatus.NEW_LEAD,
            newStatus: WorkflowStatus.SAMPLE_REQUESTED,
            loggedBy: 'BussDev Manager',
          }
        });
      }

      // Add Samples
      if (data.status !== WorkflowStatus.LOST) {
        await prisma.sampleRequest.create({
          data: {
            leadId: lead.id,
            productName: data.productInterest,
            targetFunction: 'Moisturizing & Brightening',
            textureReq: 'Light Cream',
            colorReq: 'White',
            aromaReq: 'Fresh Citrus',
            sampleCode: `SAMP-${data.brandName.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            stage: data.status === WorkflowStatus.WON_DEAL ? SampleStage.RECEIVED : SampleStage.FORMULATING,
          }
        });
      } else {
        await prisma.lostDeal.create({
          data: {
            leadId: lead.id,
            bdId: bdUser.id,
            stageLost: 'SAMPLE',
            reasonType: data.lostReason || LostReason.PRICE,
            lostValue: data.estimatedValue,
            notes: 'Client found cheaper manufacturer in Tangerang.'
          }
        });
      }
    }

    console.log('--- Granular BussDev Seeding Complete! ---');
  } catch (e) {
    console.error('--- Seeding Error! ---', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
