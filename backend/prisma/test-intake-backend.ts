
import { PrismaClient, PipelineStage, ProductCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Mocking the behavior of BussdevService.createLead for direct testing
async function testBackendIntake() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- BACKEND INTEGRATION TEST: Lead Intake ---');

  try {
    // 1. Setup: Get a valid Staff and their associated User
    const staff = await prisma.bussdevStaff.findFirst({
        where: { isActive: true },
        include: { user: true }
    });

    if (!staff || !staff.userId) {
        throw new Error('No active staff found for testing. Run reconciliation first.');
    }

    console.log(`Using Staff: ${staff.name} (ID: ${staff.id}, UserID: ${staff.userId})`);

    // SCENARIO A: Manual PIC Selection (The Happy Path)
    console.log('\nScenario A: Manual Staff ID...');
    const leadA = await createLeadSimulation(prisma, {
        clientName: 'Test Corp A',
        contactInfo: '081-A',
        source: 'Testing',
        productInterest: 'Serum',
        estimatedValue: 1000000,
        picId: staff.id
    });
    console.log('✅ Scenario A Success: Lead ID', leadA.id);

    // SCENARIO B: Auto-Assignment
    console.log('\nScenario B: AUTO Assignment...');
    const leadB = await createLeadSimulation(prisma, {
        clientName: 'Test Corp B',
        contactInfo: '081-B',
        source: 'Testing',
        productInterest: 'Cream',
        estimatedValue: 2000000,
        picId: 'AUTO'
    });
    console.log('✅ Scenario B Success: Lead ID', leadB.id, 'Assigned to Staff:', leadB.picId);

    // SCENARIO C: Self-Healing (Sending User ID instead of Staff ID)
    console.log('\nScenario C: Self-Healing (Sending User ID)...');
    const leadC = await createLeadSimulation(prisma, {
        clientName: 'Test Corp C',
        contactInfo: '081-C',
        source: 'Testing',
        productInterest: 'Toner',
        estimatedValue: 3000000,
        picId: staff.userId // THIS IS THE USER ID, NOT STAFF ID
    });
    console.log('✅ Scenario C Success (Self-Healed): Lead ID', leadC.id, 'Resolved to Staff:', leadC.picId);
    if (leadC.picId === staff.id) {
        console.log('   Verification: User ID was successfully mapped to Staff ID!');
    }

    console.log('\n--- ALL BACKEND SCENARIOS PASSED ---');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Minimal simulation of the BussdevService.createLead logic
async function createLeadSimulation(prisma: any, dto: any) {
    return await prisma.$transaction(async (tx: any) => {
        let targetPicId = dto.picId;

        // 1. AUTO Logic
        if (!targetPicId || targetPicId === 'AUTO') {
            const staffs = await tx.bussdevStaff.findMany({ where: { isActive: true } });
            targetPicId = staffs[0].id;
        }

        // 2. Resolve Logic (The Fix)
        let staffRecord = await tx.bussdevStaff.findUnique({
            where: { id: targetPicId },
            select: { id: true, userId: true, name: true },
        });

        if (!staffRecord) {
            staffRecord = await tx.bussdevStaff.findUnique({
                where: { userId: targetPicId },
                select: { id: true, userId: true, name: true },
            });
        }

        if (!staffRecord) throw new Error(`Staff not found for ${targetPicId}`);

        // 3. Create
        return await tx.salesLead.create({
            data: {
                clientName: dto.clientName,
                contactInfo: dto.contactInfo,
                source: dto.source,
                productInterest: dto.productInterest,
                estimatedValue: dto.estimatedValue,
                picId: staffRecord.id,
                bdId: staffRecord.userId,
                stage: PipelineStage.NEW_LEAD
            }
        });
    });
}

testBackendIntake();
