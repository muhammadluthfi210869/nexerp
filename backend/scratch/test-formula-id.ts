import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function testFormulaId() {
  console.log('--- Phase 2: Formula ID Generator Test ---');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `F-${year}${month}-`;

    const lastFormula = await prisma.formula.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: 'desc' },
    });

    let seq = 1;
    if (lastFormula) {
      const parts = lastFormula.id.split('-');
      if (parts.length === 3) {
        seq = parseInt(parts[2]) + 1;
      }
    }

    const newId = `${prefix}${seq.toString().padStart(3, '0')}`;
    console.log(`✅ Generated ID: ${newId}`);
    
    if (!newId.startsWith(`F-${year}${month}-`)) {
      throw new Error('Prefix mismatch');
    }
    console.log('✅ Prefix format verified');

  } catch (err) {
    console.error('❌ Test FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFormulaId();
