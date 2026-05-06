const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'production@dreamlab.com' },
    update: { password_hash: hashedPassword, roles: ['PRODUCTION_OP'] },
    create: {
      email: 'production@dreamlab.com',
      full_name: 'Production Operator',
      password_hash: hashedPassword,
      roles: ['PRODUCTION_OP'],
      status: 'ACTIVE',
    },
  });
  
  console.log(`✅ Production User Synchronized: ${user.email}`);
  process.exit();
}
run();
