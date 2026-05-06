import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const count = await prisma.article.count();
  const sample = await prisma.article.findFirst({
    select: { title: true, slug: true, metaDescription: true, content: true }
  });
  
  console.log('Article Count:', count);
  console.log('Sample Article:', { ...sample, content: sample?.content.substring(0, 300) });
  
  await prisma.$disconnect();
  await pool.end();
}

main();
