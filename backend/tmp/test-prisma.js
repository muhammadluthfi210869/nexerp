
const PrismaModule = require('@prisma/client');
console.log('ALL MODULE KEYS:', Object.keys(PrismaModule).join(', '));
if (PrismaModule.PrismaClient) {
  console.log('PrismaClient exists');
  try {
    const p = new PrismaModule.PrismaClient();
    console.log('OK');
  } catch (e) {
    console.log('FAILED:', e.message);
  }
} else {
  console.log('PrismaClient DOES NOT EXIST in module');
}
