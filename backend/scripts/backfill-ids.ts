import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateTable(
  modelName: string,
  idField: string,
  prefix: string,
  dateField: string = 'createdAt',
  stageField?: string
) {
  console.log(`Starting migration for ${modelName}...`);
  
  const records = await (prisma as any)[modelName].findMany({
    orderBy: { [dateField]: 'asc' },
  }).catch(() => {
     console.log(`Warning: Could not sort by ${dateField} for ${modelName}, falling back to id sort.`);
     return (prisma as any)[modelName].findMany({ orderBy: { id: 'asc' } });
  });

  const sequences: Record<string, number> = {};

  for (const record of records) {
    const currentId = record[idField];
    const isStandard = currentId && /^[A-Z]{2,4}-\d{4}-\d{3}$/.test(currentId);
    
    if (!isStandard) {
      const date = new Date(record[dateField] || Date.now());
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const period = `${year}${month}`;
      
      let effectivePrefix = prefix;
      if (stageField && record[stageField]) {
        const stage = record[stageField];
        const stageMap: Record<string, string> = {
          'MIXING': 'MIX',
          'FILLING': 'FIL',
          'PACKING': 'PAC',
          'BATCHING': 'BAT'
        };
        effectivePrefix = stageMap[stage] || stage.substring(0, 3).toUpperCase();
      }

      const seqKey = `${effectivePrefix}-${period}`;
      sequences[seqKey] = (sequences[seqKey] || 0) + 1;
      
      const newId = `${effectivePrefix}-${period}-${sequences[seqKey].toString().padStart(3, '0')}`;
      
      await (prisma as any)[modelName].update({
        where: { id: record.id },
        data: { [idField]: newId },
      });
      
      console.log(`Migrated ${modelName} ${record.id}: ${currentId} -> ${newId}`);
    } else {
      const parts = currentId.split('-');
      if (parts.length === 3) {
        const p = parts[0];
        const prd = parts[1];
        const seq = parseInt(parts[2]);
        const seqKey = `${p}-${prd}`;
        sequences[seqKey] = Math.max(sequences[seqKey] || 0, seq);
      }
    }
  }

  for (const [key, lastValue] of Object.entries(sequences)) {
    const [p, prd] = key.split('-');
    // @ts-ignore
    await prisma.systemSequence.upsert({
      where: { prefix_period: { prefix: p, period: prd } },
      update: { lastValue: { set: lastValue } },
      create: { prefix: p, period: prd, lastValue },
    });
  }
}

async function main() {
  try {
    // Commercial
    await migrateTable('salesOrder', 'orderNumber', 'SO', 'createdAt');
    await migrateTable('sampleRequest', 'sampleNumber', 'SMP', 'createdAt');
    
    // R&D
    await migrateTable('formula', 'formulaNumber', 'FRM', 'createdAt');
    
    // Production
    await migrateTable('productionPlan', 'batchNo', 'BMR', 'apjReleasedAt');
    await migrateTable('workOrder', 'woNumber', 'WO', 'targetCompletion');
    await migrateTable('productionLog', 'logNumber', 'LOG', 'loggedAt', 'stage');
    await migrateTable('materialRequisition', 'reqNumber', 'REQ', 'id');
    await migrateTable('productionSchedule', 'scheduleNumber', 'SCH', 'startTime');
    
    // SCM & Warehouse
    await migrateTable('purchaseOrder', 'poNumber', 'PO', 'createdAt');
    await migrateTable('warehouseInbound', 'inboundNumber', 'GRN', 'receivedAt');
    await migrateTable('transferOrder', 'transferNumber', 'TRF', 'date');
    await migrateTable('stockOpname', 'opnameNumber', 'OPN', 'createdAt');
    
    // Finance
    await migrateTable('invoice', 'invoiceNumber', 'INV', 'createdAt');
    // Journal Entry skipped because it has no reference number field yet in schema

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
