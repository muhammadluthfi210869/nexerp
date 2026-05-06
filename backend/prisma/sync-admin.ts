import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const hp = await bcrypt.hash('password123', 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@dreamlab.com' },
      update: { passwordHash: hp, fullName: 'Super Admin', roles: ['SUPER_ADMIN'] as any, status: 'ACTIVE' },
      create: {
        email: 'admin@dreamlab.com',
        fullName: 'Super Admin',
        passwordHash: hp,
        roles: ['SUPER_ADMIN'] as any,
        status: 'ACTIVE'
      }
    });
    console.log('✅ Admin user synchronized:', user.email);
  } catch (error) {
    console.error('❌ Error synchronizing admin:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
