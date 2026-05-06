
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('RegulatoryPipeline fields:', Object.keys((prisma).regulatoryPipeline));
  process.exit(0);
}

main();
