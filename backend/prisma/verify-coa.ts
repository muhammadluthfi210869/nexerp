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
  const accounts = await prisma.account.findMany({
    where: {
      type: { in: ['REVENUE', 'EXPENSE'] }
    },
    select: {
      name: true,
      code: true
    },
    orderBy: { code: 'asc' }
  });

  console.log('--- START ACCOUNTS ---');
  console.log(JSON.stringify(accounts));
  console.log('--- END ACCOUNTS ---');
  console.log('Total Count:', accounts.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
