import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({
    where: { email: 'compliance@dreamlab.com' }
  });

  console.log('USER DATA:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

check();
