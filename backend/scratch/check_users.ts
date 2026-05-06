import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function checkUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      select: { email: true, roles: true, status: true }
    });
    console.log('--- DATABASE USERS ---');
    console.table(users);
    console.log('--- END USERS ---');
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUsers();
