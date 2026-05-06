const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
console.log('Keys:', Object.keys(p).filter(k => !k.startsWith('_')));
process.exit(0);
