'use strict';
/*
 * Database invariant sweep — NEX ERP
 * READ-ONLY. Every statement below is a SELECT. There is no INSERT/UPDATE/DELETE/ALTER
 * in this file, on purpose: it is meant to be safe to point at production.
 *
 * Usage:
 *   AUDIT_DATABASE_URL=postgresql://... node scripts/audit/db-invariants.cjs
 *   ... --label=production
 *
 * Outputs one number per invariant, so drift over time is measurable rather than anecdotal.
 */

const path = require('path');
const fs = require('fs');
const { Client } = require(path.resolve(__dirname, '..', '..', 'backend', 'node_modules', 'pg'));

const URL = process.env.AUDIT_DATABASE_URL || '';
const LABEL = (process.argv.find((a) => a.startsWith('--label=')) || '--label=local').slice(8);

if (!URL) {
  console.error('AUDIT_DATABASE_URL is required.');
  process.exit(2);
}

// Read-only is enforced where it matters: on the SQL that actually executes, not on the
// source text. A source scan matches its own regex literal and proves nothing.
const WRITE_SQL = new RegExp(
  '\\b(insert\\s+into|update\\s+\\w+\\s+set|delete\\s+from|alter\\s+table|drop\\s+|truncate\\s+|create\\s+table|grant\\s+)',
  'i',
);

const out = { label: LABEL, ranAt: new Date().toISOString(), invariants: {} };
const say = (name, value, note) => {
  out.invariants[name] = { value, ...(note ? { note } : {}) };
  console.log(`\n### ${name}`);
  console.log(JSON.stringify(value, null, 1));
};

(async () => {
  const db = new Client({ connectionString: URL, statement_timeout: 120000 });
  await db.connect();
  // Every statement in this script goes through here, so this is the whole safety surface.
  const q = async (sql, params) => {
    if (WRITE_SQL.test(sql)) {
      throw new Error(`REFUSING TO EXECUTE a non-SELECT statement:\n${sql}`);
    }
    return (await db.query(sql, params)).rows;
  };
  const has = async (t) => (await q(`select to_regclass($1) as t`, [`public.${t}`]))[0].t !== null;

  // ---- which tables even exist here? a production DB may be a different vintage ----
  const tables = (await q(
    `select table_name from information_schema.tables where table_schema='public'`,
  )).map((r) => r.table_name);
  out.publicTableCount = tables.length;
  console.log(`label=${LABEL}  public tables=${tables.length}`);

  // ---- 1. journal balance -------------------------------------------------------
  if (await has('journal_lines')) {
    const perEntry = await q(`
      select j.id, j.reference, j.date,
             coalesce(sum(l.debit),0)::float8  as dr,
             coalesce(sum(l.credit),0)::float8 as cr,
             count(l.id)::int                  as lines
      from journal_entries j
      left join journal_lines l on l."journalId" = j.id
      group by j.id, j.reference, j.date
    `);
    const unbalanced = perEntry.filter((e) => Math.abs(e.dr - e.cr) > 0.01);
    const zeroLine = perEntry.filter((e) => e.lines === 0);
    say('journalBalance', {
      totalEntries: perEntry.length,
      unbalanced: unbalanced.length,
      unbalancedPct: perEntry.length ? +((100 * unbalanced.length) / perEntry.length).toFixed(1) : 0,
      entriesWithNoLines: zeroLine.length,
      totalDebit: +perEntry.reduce((s, e) => s + e.dr, 0).toFixed(2),
      totalCredit: +perEntry.reduce((s, e) => s + e.cr, 0).toFixed(2),
      netDrMinusCr: +(perEntry.reduce((s, e) => s + e.dr - e.cr, 0)).toFixed(2),
      worstTen: unbalanced
        .map((e) => ({ reference: e.reference, date: e.date, dr: e.dr, cr: e.cr, diff: +(e.dr - e.cr).toFixed(2) }))
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 10),
    });
  } else say('journalBalance', 'SKIPPED: journal_lines does not exist here');

  // ---- 2. invoice arithmetic ----------------------------------------------------
  if (await has('sales_invoices')) {
    const bad = await q(`
      select id, "invoiceNumber", subtotal, "taxAmount", "totalAmount",
             round((("totalAmount" - "subtotal" - "taxAmount"))::numeric, 2) as drift
      from sales_invoices
      where abs("totalAmount" - "subtotal" - "taxAmount") > 0.01
    `);
    const total = (await q(`select count(*)::int n from sales_invoices`))[0].n;
    say('invoiceArithmetic', { total, rowsWhereTotalNeSubtotalPlusTax: bad.length, sample: bad.slice(0, 10) });

    // ---- 3. posted invoices with no journal --------------------------------------
    const postedNoJournal = await q(`
      select si.id, si."invoiceNumber", si."postedAt", si."totalAmount", si.notes
      from sales_invoices si
      where si."postedAt" is not null
        and not exists (select 1 from journal_entries j where j."salesInvoiceId" = si.id)
        and not exists (select 1 from journal_entries j where j.reference = 'SI-POST-' || si."invoiceNumber")
      order by si."postedAt" desc
    `);
    const posted = (await q(`select count(*)::int n from sales_invoices where "postedAt" is not null`))[0].n;
    // Rows this audit harness created must never be reported as a pre-existing finding.
    const mine = postedNoJournal.filter((r) => /AUDIT/.test(r.notes || ''));
    const preExisting = postedNoJournal.filter((r) => !/AUDIT/.test(r.notes || ''));
    say('postedInvoicesWithNoJournal', {
      postedTotal: posted, postedWithNoJournal: postedNoJournal.length,
      producedByThisHarness: mine.length,
      preExisting: preExisting.length,
      moneyMarkedPostedButUnposted: +postedNoJournal.reduce((s, r) => s + Number(r.totalAmount), 0).toFixed(2),
      moneyPreExisting: +preExisting.reduce((s, r) => s + Number(r.totalAmount), 0).toFixed(2),
      preExistingSample: preExisting.slice(0, 10),
    }, 'split on whether the row was created by scripts/audit/proof-server.cjs — counting our own test rows as a '
     + 'finding would inflate the number. Only `preExisting` says anything about real usage.');
  } else say('invoiceArithmetic', 'SKIPPED: sales_invoices does not exist here');

  // ---- 4. stock: master quantity vs movement ledger ------------------------------
  if (await has('material_items') && await has('inventory_transactions')) {
    const tx = (await q(`select count(*)::int n from inventory_transactions`))[0].n;
    const mismatched = await q(`
      with m as (select id, code, name, coalesce("stockQty",0)::float8 qty from material_items)
      select m.id, m.code, m.name, m.qty,
             coalesce((select sum(coalesce(t.quantity,0)) from inventory_transactions t where t."materialId" = m.id),0)::float8 as ledger
      from m
      where abs(m.qty - coalesce((select sum(coalesce(t.quantity,0)) from inventory_transactions t where t."materialId" = m.id),0)) > 0.01
      order by abs(m.qty) desc
    `);
    const totalQty = (await q(`select coalesce(sum(coalesce("stockQty",0)),0)::float8 s from material_items`))[0].s;
    const totalLedger = (await q(`select coalesce(sum(coalesce(quantity,0)),0)::float8 s from inventory_transactions`))[0].s;
    say('stockVsLedger', {
      materialItems: (await q(`select count(*)::int n from material_items`))[0].n,
      inventoryTransactions: tx,
      materialsWithQtyButNoMatchingLedger: mismatched.length,
      sumOfMasterStockQty: totalQty,
      sumOfLedgerQty: totalLedger,
      unexplainedDifference: +(totalQty - totalLedger).toFixed(2),
      sample: mismatched.slice(0, 15),
    }, 'a material with stockQty > 0 and a ledger sum of 0 is stock that materialised with no recorded movement');
  } else say('stockVsLedger', 'SKIPPED: material_items or inventory_transactions missing');

  // ---- 5. account-id population on material_items -------------------------------
  if (await has('material_items')) {
    const pop = await q(`
      select count(*)::int total,
             count(*) filter (where "inventoryAccountId" is null)::int noInventoryAccount,
             count(*) filter (where "salesAccountId"     is null)::int noSalesAccount
      from material_items
    `);
    say('materialAccountPopulation', pop[0],
      'null here means getTrialBalance has no account to route this stock through');
  }

  // ---- 6. COA: which codes does the code use that the database does not have? ----
  // Definition, pinned deliberately: a 4-digit string literal immediately assigned to a
  // property named `code`. Tight on purpose — a loose scan of all quoted numbers in
  // backend/src inflates this list several-fold.
  const srcRoot = path.resolve(__dirname, '..', '..', 'backend', 'src');
  const files = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.ts')) files.push(p);
    }
  })(srcRoot);
  const used = new Map();
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const m = /\bcode\s*[:=]\s*['"](\d{4})['"]/.exec(line);
      if (m) {
        if (!used.has(m[1])) used.set(m[1], []);
        used.get(m[1]).push(`${path.relative(srcRoot, f).replace(/\\/g, '/')}:${i + 1}`);
      }
    });
  }
  if (await has('accounts')) {
    const existing = new Set((await q(`select code from accounts`)).map((r) => r.code));
    const missing = [...used.keys()].filter((c) => !existing.has(c)).sort();
    say('coaCodesReferencedButAbsent', {
      definition: '4-digit string literal assigned to a property named `code`, anywhere in backend/src',
      filesScanned: files.length,
      distinctCodesReferenced: used.size,
      accountsInDatabase: existing.size,
      databaseCodes: [...existing].sort(),
      missingCount: missing.length,
      missing: missing.map((c) => ({ code: c, referencedAt: used.get(c).slice(0, 3) })),
    });
  }

  // ---- 7. the table that decides whether AR can work at all ---------------------
  if (await has('customers')) {
    const cust = await q(`
      select (select count(*)::int from customers) as customers,
             (select count(*)::int from customers where code like 'AUD-%') as seededByThisAudit,
             (select count(*)::int from sales_leads) as salesLeads
    `);
    const notNull = await q(`
      select table_name, is_nullable
      from information_schema.columns
      where table_schema='public' and column_name='customerId'
        and table_name in ('sales_invoices','ar_receipts','client_escrows')
      order by table_name
    `);
    say('customerTable', { counts: cust[0], customerIdColumns: notNull },
      'AUD- prefixed customers were inserted by scripts/audit/proof-server.cjs, because the API cannot create one. '
      + 'Subtract them: the real figure is `customers - seededByThisAudit`.');
  }

  const file = path.join(__dirname, `invariants.${LABEL}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\n-> ${path.relative(process.cwd(), file)}`);
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
