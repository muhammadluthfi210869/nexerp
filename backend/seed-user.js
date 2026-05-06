const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const email = 'bussdev@dreamlab.com';
  const password = 'password123';
  const fullName = 'Bussdev Architect';
  
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('User already exists');
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          full_name: fullName,
          email,
          password_hash: passwordHash,
          roles: ['SUPER_ADMIN'], // Giving full access for testing
          status: 'ACTIVE',
        }
      });
      console.log('Created user:', user.email);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}
run();
