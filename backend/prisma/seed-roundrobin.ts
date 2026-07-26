import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Round Robin Agents...');

  // Clear existing
  await prisma.roundRobinState.deleteMany();
  await prisma.roundRobinAgent.deleteMany();

  // Create 3 agents
  const agents = await Promise.all([
    prisma.roundRobinAgent.create({
      data: {
        name: 'Aurel',
        phoneNumber: '6281234567891',
        orderIndex: 0,
        isActive: true,
      },
    }),
    prisma.roundRobinAgent.create({
      data: {
        name: 'Revita',
        phoneNumber: '6281234567892',
        orderIndex: 1,
        isActive: true,
      },
    }),
    prisma.roundRobinAgent.create({
      data: {
        name: 'Zarkasi',
        phoneNumber: '6281234567893',
        orderIndex: 2,
        isActive: true,
      },
    }),
  ]);

  // Create state
  await prisma.roundRobinState.create({
    data: { id: 'singleton', currentIndex: 0 },
  });

  console.log(`✅ ${agents.length} agents seeded:`);
  agents.forEach(a => console.log(`   ${a.name} — ${a.phoneNumber} (order: ${a.orderIndex})`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
