
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function reconcileBussdevStaff() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('--- RECONCILIATION: Bussdev Staff Sync Start ---');

  try {
    // 1. Find all users with COMMERCIAL role
    const bdUsers = await prisma.user.findMany({
      where: {
        roles: {
          has: 'COMMERCIAL' as any, // Cast because of how Prisma handles string arrays in some versions
        },
      },
    });

    console.log(`Found ${bdUsers.length} users with COMMERCIAL role.`);

    for (const user of bdUsers) {
      if (!user.id) continue;
      
      // 2. Check if they have a BussdevStaff record
      const existingStaff = await prisma.bussdevStaff.findUnique({
        where: { userId: user.id },
      });

      if (!existingStaff) {
        console.log(`User ${user.fullName} (${user.email}) missing Staff record. Creating...`);
        await prisma.bussdevStaff.create({
          data: {
            userId: user.id,
            name: user.fullName || 'Unknown BD Staff',
            targetRevenue: 100000000, // Default target
            isActive: true,
          },
        });
        console.log(`✅ Staff record created for ${user.fullName}`);
      } else {
        console.log(`✔ User ${user.fullName} already has a Staff record.`);
      }
    }

    console.log('--- RECONCILIATION COMPLETE ---');
  } catch (error) {
    console.error('Critical Error during reconciliation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reconcileBussdevStaff();
