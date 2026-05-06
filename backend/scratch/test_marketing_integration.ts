import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function runTest() {
  console.log('🚀 Starting Phase 1: Cross-Divisional Data Integrity Test');

  const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = new Date();
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  // 1. Check Initial State
  console.log('\n--- 1. INITIAL STATE ---');
  const initialAnalytics = await getDashboardData(startDate, endDate);
  console.log(`Initial Revenue: ${initialAnalytics.acquisition.revenue}`);
  console.log(`Initial Prospects: ${initialAnalytics.funnel.prospects}`);
  console.log(`Initial Target: ${initialAnalytics.acquisition.revenueTarget}`);

  // 2. Prepare Required Relations
  // Get a PIC
  const pic = await prisma.bussdevStaff.findFirst();
  if (!pic) throw new Error('No BussdevStaff found in database');

  // Create a Marketing Lead
  console.log('\n--- 2. PREPARING DATA ---');
  const testLead = await prisma.salesLead.create({
    data: {
      clientName: 'Test Marketing Client',
      contactInfo: '08123456789',
      source: 'IG_ADS',
      productInterest: 'Skincare Package',
      picId: pic.id,
      stage: 'NEW_LEAD'
    }
  });
  console.log(`Created Test Lead: ${testLead.id}`);

  // Create a Sample (Required for SO)
  const testSample = await prisma.sampleRequest.create({
    data: {
      leadId: testLead.id,
      productName: 'Test Serum',
      targetFunction: 'Whitening',
      textureReq: 'Liquid',
      colorReq: 'Clear',
      aromaReq: 'Rose',
      stage: 'QUEUE'
    }
  });
  console.log(`Created Test Sample: ${testSample.id}`);

  // 3. Test INT-01: Input Sales Order
  console.log('\n--- 3. TEST INT-01: SALES ORDER INJECTION ---');
  const soId = `TEST-SO-${Date.now()}`;
  const testSO = await prisma.salesOrder.create({
    data: {
      id: soId,
      leadId: testLead.id,
      sampleId: testSample.id,
      totalAmount: 5000000, // 5 Million
      status: 'COMPLETED',
      transactionDate: new Date()
    }
  });
  console.log(`Created Test Sales Order: ${testSO.id} (Rp 5.000.000)`);

  // 4. Test INT-04: Set Marketing Target
  console.log('\n--- 4. TEST INT-04: TARGET SYNC ---');
  const testTarget = await prisma.marketingTarget.upsert({
    where: { month_year: { month, year } },
    update: { revenueTarget: 500000000 }, // 500 Million
    create: {
      month,
      year,
      revenueTarget: 500000000,
      spendTarget: 50000000,
      postTarget: 40
    }
  });
  console.log(`Synchronized Monthly Target: Rp ${testTarget.revenueTarget}`);

  // 5. Final Verification
  console.log('\n--- 5. FINAL VERIFICATION ---');
  const finalAnalytics = await getDashboardData(startDate, endDate);
  console.log(`Final Revenue: ${finalAnalytics.acquisition.revenue} (Expected Increase: +5.000.000)`);
  console.log(`Final Prospects: ${finalAnalytics.funnel.prospects} (Expected Increase: +1)`);
  console.log(`Final Target: ${finalAnalytics.acquisition.revenueTarget} (Expected: 500.000.000)`);

  const success = 
    finalAnalytics.acquisition.revenue === initialAnalytics.acquisition.revenue + 5000000 &&
    finalAnalytics.funnel.prospects === initialAnalytics.funnel.prospects + 1 &&
    finalAnalytics.acquisition.revenueTarget === 500000000;

  if (success) {
    console.log('\n✅ PHASE 1 SUCCESS: All divisions are perfectly synchronized!');
  } else {
    console.log('\n❌ PHASE 1 FAILED: Discrepancy detected in data aggregation.');
  }

  // Cleanup
  console.log('\n--- CLEANING UP ---');
  await prisma.salesOrder.delete({ where: { id: testSO.id } });
  await prisma.sampleRequest.delete({ where: { id: testSample.id } });
  await prisma.salesLead.delete({ where: { id: testLead.id } });
}

async function getDashboardData(startDate: Date, endDate: Date) {
  const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];
  const month = startDate.getMonth() + 1;
  const year = startDate.getFullYear();

  const [sales, leads, target] = await Promise.all([
    prisma.salesOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
        lead: { source: { in: paidSources as any } },
      },
    }),
    prisma.salesLead.count({ 
      where: { 
        stage: 'NEW_LEAD', 
        createdAt: { gte: startDate, lte: endDate },
        source: { in: paidSources as any }
      } 
    }),
    prisma.marketingTarget.findUnique({
      where: { month_year: { month, year } }
    })
  ]);

  return {
    acquisition: {
      revenue: Number(sales._sum.totalAmount || 0),
      revenueTarget: Number(target?.revenueTarget || 0)
    },
    funnel: {
      prospects: leads
    }
  };
}

runTest()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
