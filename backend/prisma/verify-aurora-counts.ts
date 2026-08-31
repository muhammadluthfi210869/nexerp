import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const counts: Record<string, number> = {};
  counts['sales_leads (aurora brands)'] = await prisma.salesLead.count({ where: { brandCode: { in: ['AURORA','NATURA','LUMIERE','SENJA','ARUNA','SINAR'] } } });
  counts['sample_requests (AUR/NAT/LUM/SEN)'] = await prisma.sampleRequest.count({ where: { OR: [{ sampleCode: { startsWith: 'SMP-AUR' } }, { sampleCode: { startsWith: 'SMP-NAT' } }, { sampleCode: { startsWith: 'SMP-LUM' } }, { sampleCode: { startsWith: 'SMP-SEN' } }] } });
  counts['material_items (RM-/PK-)'] = await prisma.materialItem.count({ where: { OR: [{ code: { startsWith: 'RM-' } }, { code: { startsWith: 'PK-' } }] } });
  counts['material_inventories (AUR batches)'] = await prisma.materialInventory.count({ where: { batchNumber: { startsWith: 'LOT-' } } });
  counts['formulas (FRM-SMP-)'] = await prisma.formula.count({ where: { formulaCode: { startsWith: 'FRM-SMP-' } } });
  counts['purchase_orders (PO-AUR)'] = await prisma.purchaseOrder.count({ where: { poNumber: { startsWith: 'PO-AUR-' } } });
  counts['production_plans (BATCH-AUR)'] = await prisma.productionPlan.count({ where: { batchNo: { startsWith: 'BATCH-AUR-' } } });
  counts['work_orders (WO-AUR)'] = await prisma.workOrder.count({ where: { woNumber: { startsWith: 'WO-AUR-' } } });
  counts['qc_audits (showcase phase)'] = await prisma.qCAudit.count({ where: { notes: { contains: 'Showcase audit' } } });
  counts['invoices (AUR/EXP)'] = await prisma.invoice.count({ where: { OR: [{ invoiceNumber: { startsWith: 'INV-AUR-' } }, { invoiceNumber: 'INV-EXP-001' }] } });
  counts['journal_entries (JV-AUR)'] = await prisma.journalEntry.count({ where: { reference: 'JV-AUR-DP-001' } });
  console.log('SHOWCASE_SEED_COUNTS (after 2 seed runs):');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(38)} ${v}`);
  await prisma.$disconnect();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
