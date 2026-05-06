import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- DATABASE CROSS-CHECK ---');
  
  const staffs = await prisma.legalStaff.findMany();
  console.log('Legal Staff Count:', staffs.length);
  console.log('Staff Details:', JSON.stringify(staffs, null, 2));

  const users = await prisma.user.findMany({ where: { email: 'compliance@dreamlab.com' } });
  console.log('Compliance User:', JSON.stringify(users, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main();
