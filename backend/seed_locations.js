const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding Warehouse Locations...');
  
  try {
    const locations = [
      { id: '84033de7-9e66-419b-a01c-6bc659c4456a', name: 'Rack A-1', capacity: 10000, currentUsage: 0, type: 'AMBIENT' },
      { id: '94033de7-9e66-419b-a01c-6bc659c4456b', name: 'Rack B-1', capacity: 10000, currentUsage: 0, type: 'AMBIENT' },
      { id: 'a4033de7-9e66-419b-a01c-6bc659c4456c', name: 'Cold Storage 1', capacity: 5000, currentUsage: 0, type: 'COLD' },
    ];

    for (const loc of locations) {
      await prisma.warehouseLocation.upsert({
        where: { id: loc.id },
        update: {},
        create: loc
      });
    }

    console.log('Seed successful!');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
