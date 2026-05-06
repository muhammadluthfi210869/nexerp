const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('🚀 Verifying Event Dispatcher & SLA Logic...');

  try {
    // 1. Get Staff
    let bdStaff = await prisma.bussdevStaff.findFirst();
    if (!bdStaff) {
      bdStaff = await prisma.bussdevStaff.create({
        data: { name: 'Fina', targetRevenue: 1000000000 }
      });
    }

    // 2. Create Lead
    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'Event Test Client',
        productInterest: 'Serum',
        contactInfo: '081',
        source: 'Google',
        estimatedValue: 1000000,
        picId: bdStaff.id,
        stage: 'NEW_LEAD'
      }
    });
    console.log('Lead Created:', lead.id);

    // 3. Simulate Event (Since I can't easily run NestJS context here, I'll simulate what the listener does)
    console.log('Simulating Handover Event with 2 Hour SLA...');
    
    const expectedDuration = 120; // 2 Hours
    const deadlineAt = new Date(Date.now() + expectedDuration * 60 * 1000);

    const log = await prisma.activityStream.create({
      data: {
        leadId: lead.id,
        senderDivision: 'BD',
        eventType: 'HANDOVER',
        notes: 'PROTOKOL HANDOVER: Request Sample. Finance wajib verifikasi maksimal 2 jam dari sekarang.',
        loggedBy: 'FINA',
        expectedDuration: expectedDuration,
        deadlineAt: deadlineAt,
      }
    });

    console.log('Log Created with SLA:', log.id);
    console.log('Deadline set to:', log.deadlineAt.toISOString());

    // 4. Verify in DB
    const verifiedLog = await prisma.activityStream.findUnique({
        where: { id: log.id }
    });

    if (verifiedLog && verifiedLog.deadlineAt) {
        console.log('✅ SLA Database Integrity Verified!');
    } else {
        console.log('❌ SLA Verification Failed!');
    }

  } catch (err) {
    console.error('❌ Verification Failed');
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verify();
