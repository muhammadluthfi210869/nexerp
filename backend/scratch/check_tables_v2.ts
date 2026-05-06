import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables in public schema:', tables);
  } catch (e) {
    console.error('Error querying tables:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
