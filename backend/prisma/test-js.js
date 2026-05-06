const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- JS Seed with Adapter Start ---');
  try {
    const count = await prisma.user.count();
    console.log('User Count:', count);
    console.log('--- CONNECTION SUCCESSFUL! ---');
  } catch (err) {
    console.error('--- JS Seed Failed ---');
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
