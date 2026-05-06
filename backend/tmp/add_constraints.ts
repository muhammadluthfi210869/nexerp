import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding database constraints...');
  
  try {
    // 1. Constraint for Materials
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS "Material" 
      DROP CONSTRAINT IF EXISTS stock_qty_non_negative;
      
      ALTER TABLE "Material" 
      ADD CONSTRAINT stock_qty_non_negative CHECK (stock_qty >= 0);
    `);
    console.log('✔ Material: stock_qty >= 0 constraint added.');

    // 2. Constraint for FinishedGoods
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS "FinishedGoods" 
      DROP CONSTRAINT IF EXISTS fg_stock_qty_non_negative;
      
      ALTER TABLE "FinishedGoods" 
      ADD CONSTRAINT fg_stock_qty_non_negative CHECK (stock_qty >= 0);
    `);
    console.log('✔ FinishedGoods: stock_qty >= 0 constraint added.');

  } catch (error) {
    console.error('Error adding constraints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
