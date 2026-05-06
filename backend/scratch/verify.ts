
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  const users = await prisma.user.findMany();
  console.log('--- USER AUDIT ---');
  console.log('Count:', users.length);
  for (const u of users) {
    const isPassValid = await bcrypt.compare('password123', u.passwordHash || '');
    console.log(`Email: ${u.email} | Roles: ${u.roles} | Active: ${u.status} | Pass "password123" valid: ${isPassValid}`);
  }
}

verify().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
