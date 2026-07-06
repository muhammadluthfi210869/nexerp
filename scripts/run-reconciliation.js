const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  let allPass = true;

  console.log('');
  console.log('=== ERP RECONCILIATION REPORT ===');
  console.log('');

  // 1. Trial Balance (via journal_lines)
  console.log('1. TRIAL BALANCE');
  const tb = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(SUM(debit),0) as d, COALESCE(SUM(credit),0) as c
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl."journalId"`
  );
  const balanced = Number(tb[0].d) === Number(tb[0].c);
  console.log('  Total Debit:  ' + Number(tb[0].d).toLocaleString());
  console.log('  Total Credit: ' + Number(tb[0].c).toLocaleString());
  console.log('  Result: ' + (balanced ? 'PASS - BALANCED' : 'FAIL - UNBALANCED by ' + Math.abs(Number(tb[0].d) - Number(tb[0].c))));
  if (!balanced) allPass = false;

  // 2. Stock Accuracy
  console.log('');
  console.log('2. STOCK ACCURACY');
  const disc = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as cnt FROM material_items m
     WHERE m."stockQty" != COALESCE(
       (SELECT COALESCE(SUM(quantity),0) FROM inventory_transactions
        WHERE "materialId" = m.id AND type = 'INBOUND'),0)
       - COALESCE(
       (SELECT COALESCE(SUM(quantity),0) FROM inventory_transactions
        WHERE "materialId" = m.id AND type = 'OUTBOUND'),0)`
  );
  const discCount = Number(disc[0].cnt);
  console.log('  Discrepancies: ' + discCount);
  console.log('  Result: ' + (discCount === 0 ? 'PASS' : 'FAIL - ' + discCount + ' materials mismatch'));
  if (discCount > 0) allPass = false;

  // 3. Record counts
  console.log('');
  console.log('3. RECORD COUNTS');
  const counts = [
    ['sales_leads', 'Leads'],
    ['sales_orders', 'Sales Orders'],
    ['unified_invoices', 'Invoices'],
    ['payments', 'Payments'],
    ['material_items', 'Materials'],
    ['users', 'Users'],
    ['accounts', 'Accounts'],
    ['journal_entries', 'Journal Entries'],
  ];
  for (const [table, label] of counts) {
    const c = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM ${table}`);
    console.log('  ' + label + ': ' + c[0].cnt);
  }

  // 4. Account types
  console.log('');
  console.log('4. ACCOUNT TYPES');
  const accts = await prisma.$queryRawUnsafe(
    `SELECT type, COUNT(*) as cnt FROM accounts GROUP BY type ORDER BY type`
  );
  for (const r of accts) console.log('  ' + r.type + ': ' + r.cnt);

  // 5. Balance Sheet Check
  console.log('');
  console.log('5. BALANCE SHEET (Assets = Liabilities + Equity)');
  const bs = await prisma.$queryRawUnsafe(
    `SELECT a.type, COALESCE(SUM(jl.debit - jl.credit),0) as balance
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl."journalId"
     JOIN accounts a ON a.id = jl."accountId"
     GROUP BY a.type`
  );
  let bal = { ASSET: 0, LIABILITY: 0, EQUITY: 0 };
  for (const r of bs) bal[r.type] = Number(r.balance);
  const bsOk = bal.ASSET === (bal.LIABILITY + bal.EQUITY);
  console.log('  Assets: ' + bal.ASSET.toLocaleString());
  console.log('  Liabilities: ' + bal.LIABILITY.toLocaleString());
  console.log('  Equity: ' + bal.EQUITY.toLocaleString());
  console.log('  Result: ' + (bsOk ? 'PASS - BALANCED' : 'FAIL - UNBALANCED'));
  if (!bsOk) allPass = false;

  console.log('');
  console.log('=== OVERALL: ' + (allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED') + ' ===');
  await prisma.$disconnect();
  await pool.end();
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
