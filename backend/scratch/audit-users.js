const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        fullName: true,
        roles: true,
        status: true
      }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}
run();
