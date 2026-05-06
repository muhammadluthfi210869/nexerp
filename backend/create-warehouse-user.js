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
    where: { email: 'warehouse@dreamlab.com' },
    update: { password_hash: hashedPassword, roles: ['WAREHOUSE'] },
    create: {
      email: 'warehouse@dreamlab.com',
      full_name: 'Warehouse Operator',
      password_hash: hashedPassword,
      roles: ['WAREHOUSE'],
      status: 'ACTIVE',
    },
  });
  
  console.log(`✅ Warehouse User Synchronized: ${user.email}`);
  process.exit();
}
run();
