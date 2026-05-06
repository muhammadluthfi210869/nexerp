const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const [materials, orders, invs] = await Promise.all([
    prisma.materialItem.count(),
    prisma.workOrder.count(),
    prisma.materialInventory.count()
  ]);
  console.log({ materials, orders, invs });
  process.exit(0);
}

check();
