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
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        roles: ['COMMERCIAL'], // Changed from SUPER_ADMIN to COMMERCIAL
      }
    });
    console.log('Updated user role to COMMERCIAL:', user.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}
run();
