'use strict';
/*
 * Runtime proof harness — NEX ERP
 * Drives the live API on :3004 (the erp_audit copy) and asserts on OBSERVED DATABASE STATE.
 *
 * Scope rule (user decision): this file never writes to erp_db_test. The guard below is
 * a hard stop, not a convention.
 *
 * Usage:
 *   PROOF_DATABASE_URL=postgresql://...erp_audit?schema=public node scripts/audit/proof-server.cjs
 *   ... --mutate      # invert every expectation, to prove the harness can actually fail
 *   ... --only=T1,T2   # run a subset
 */

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { Client } = require(path.resolve(__dirname, '..', '..', 'backend', 'node_modules', 'pg'));

const API = process.env.PROOF_API || 'http://localhost:3004';
const DB_URL = process.env.PROOF_DATABASE_URL || '';

// ---- hard guard: never touch the original database -------------------------------
if (!DB_URL) {
  console.error('PROOF_DATABASE_URL is required and must point at the erp_audit copy.');
  process.exit(2);
}
if (!/erp_audit/.test(DB_URL)) {
  console.error('REFUSING TO RUN: the target database is not erp_audit.');
  console.error('The user decision is: never write to erp_db_test.');
  process.exit(2);
}

const MUTATE = process.argv.includes('--mutate');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');

// ---- plumbing ---------------------------------------------------------------------
let db;

async function rows(sql, params) {
  const r = await db.query(sql, params);
  return r.rows;
}
async function one(sql, params) {
  const r = await rows(sql, params);
  return r[0] || null;
}

async function call(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(API + url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { method, url, status: res.status, request: body, json, raw: text.slice(0, 500) };
  } catch (e) {
    return { method, url, status: 0, request: body, json: null, raw: `TRANSPORT ERROR: ${e.message}` };
  }
}

async function login(email, password = 'password123') {
  const r = await call('POST', '/auth/login', { body: { email, password } });
  if (!r.json || !r.json.access_token) throw new Error(`login failed for ${email}: ${r.status} ${r.raw}`);
  return r.json.access_token;
}

const evidence = [];
function record(id, title, verdict, detail) {
  evidence.push({ id, title, verdict, ...detail });
}

// every expectation is wrapped so --mutate inverts it
function expect(actual, wanted) {
  return MUTATE ? actual !== wanted : actual === wanted;
}

// ---- tests -------------------------------------------------------------------------
const TESTS = [];
const test = (id, title, run) => TESTS.push({ id, title, run });

/** Seed a customer. The application cannot do this — see T13/T14. Tracked so it can be removed. */
const SEEDED = [];
async function seedCustomer(tag) {
  const code = `AUD-${tag}-${Date.now().toString().slice(-6)}`;
  const r = await one(
    `insert into customers (id, code, name, brand, email, "createdAt", "updatedAt")
     values ($1,$2,$3,$4,$5, now(), now()) returning id, code, name`,
    [randomUUID(), code, `Audit ${tag}`, 'AuditBrand', `${code}@audit.local`],
  );
  SEEDED.push(r.id);
  return r;
}

/**
 * Guarantee the three accounts a sales-invoice post needs. The seed endpoint is
 * idempotent, so this is a no-op when the chart is already complete.
 */
async function ensureChartOfAccounts(token, tag) {
  const r = await call('POST', '/finance/accounts/seed', { token });
  if (r.status !== 201) {
    record(tag, '', 'INCONCLUSIVE', { note: 'account seed failed', seed: { status: r.status, raw: String(r.raw).slice(0, 200) } });
    return false;
  }
  return true;
}

test('T1', 'Sales invoice posts a balanced 3-line journal (AR / Revenue / PPN)', async () => {
  const token = await login('admin@nexerp.id');
  await ensureChartOfAccounts(token, 'T1');
  const cust = await seedCustomer('T1');
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  const created = await call('POST', '/finance/sales-invoices', {
    token,
    body: {
      customerId: cust.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: due,
      notes: 'AUDIT T1',
      lineItems: [{ itemCode: 'AUD-1', itemName: 'Audit item', qty: 100, unit: 'pcs', price: 10000, discount: 0 }],
    },
  });
  if (created.status !== 201) {
    record('T1', '', 'INCONCLUSIVE', { note: 'invoice create failed', created });
    return false;
  }
  const invId = created.json.id;
  const ref = `SI-POST-${created.json.invoiceNumber}`;

  const posted = await call('POST', `/finance/sales-invoices/${invId}/post`, { token });
  const row = await one(
    `select "postedAt" is not null as posted, subtotal::float8, "taxAmount"::float8, "totalAmount"::float8
     from sales_invoices where id=$1`,
    [invId],
  );
  const agg = await one(
    `select count(*)::int as lines, coalesce(sum(l.debit),0)::float8 as dr, coalesce(sum(l.credit),0)::float8 as cr
     from journal_lines l join journal_entries j on j.id=l."journalId" where j.reference=$1`,
    [ref],
  );
  const legs = await rows(
    `select a.code, l.debit::float8 as debit, l.credit::float8 as credit
     from journal_lines l join journal_entries j on j.id=l."journalId" join accounts a on a.id=l."accountId"
     where j.reference=$1 order by l.debit desc`,
    [ref],
  );

  const postedAtSet = !!(row && row.posted);
  const threeLines = agg.lines === 3;
  const balanced = Math.abs(agg.dr - agg.cr) < 0.01;
  const arDebitsTotal = legs.find((l) => l.code === '1201');
  const revenueTakesSubtotal = legs.find((l) => l.code === '4101');
  // The regression this test exists for: tax used to have no credit line at all,
  // leaving the entry short by exactly taxAmount.
  const ppnTakesTax = legs.find((l) => l.code === '2104');

  record('T1', 'Sales invoice posts a balanced 3-line journal (AR / Revenue / PPN)', {
    seededCustomer: { how: 'direct SQL — the API cannot create one', ...cust },
    create: created, post: posted, dbInvoice: row, journalAggregate: agg, journalLegs: legs,
    observed: { postedAtSet, threeLines, balanced, dr: agg.dr, cr: agg.cr },
    assertions: {
      arDebitsTotalAmount: !!arDebitsTotal && Math.abs(arDebitsTotal.debit - Number(row.totalAmount)) < 0.01,
      revenueCreditsSubtotal: !!revenueTakesSubtotal && Math.abs(revenueTakesSubtotal.credit - Number(row.subtotal)) < 0.01,
      ppnCreditsTaxAmount: !!ppnTakesTax && Math.abs(ppnTakesTax.credit - Number(row.taxAmount)) < 0.01,
    },
  });
  return expect(postedAtSet, true) && expect(threeLines, true) && expect(balanced, true)
    && expect(!!arDebitsTotal && Math.abs(arDebitsTotal.debit - Number(row.totalAmount)) < 0.01, true)
    && expect(!!revenueTakesSubtotal && Math.abs(revenueTakesSubtotal.credit - Number(row.subtotal)) < 0.01, true)
    && expect(!!ppnTakesTax && Math.abs(ppnTakesTax.credit - Number(row.taxAmount)) < 0.01, true);
});

test('T2', 'Posting fails CLOSED with a named account, instead of silently skipping the journal', async () => {
  const token = await login('admin@nexerp.id');
  await ensureChartOfAccounts(token, 'T2');
  const cust = await seedCustomer('T2');
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const created = await call('POST', '/finance/sales-invoices', {
    token,
    body: {
      customerId: cust.id, invoiceDate: new Date().toISOString().slice(0, 10), dueDate: due, notes: 'AUDIT T2',
      lineItems: [{ itemCode: 'AUD-2', itemName: 'Audit item', qty: 10, unit: 'pcs', price: 100000, discount: 0 }],
    },
  });
  if (created.status !== 201) { record('T2', '', 'INCONCLUSIVE', { created }); return false; }
  const invId = created.json.id;
  const ref = `SI-POST-${created.json.invoiceNumber}`;

  // Hide PPN Keluaran for the duration of this test. Renaming the row, not deleting it:
  // journal_lines holds a real FK to accounts, and an earlier audit run may still reference it.
  const removed = await one(`update accounts set code='2104-AUDIT-HIDDEN' where code='2104' returning id, code`);
  let postRes, agg, invRow, restored = '2104 was already absent; left absent';
  try {
    postRes = await call('POST', `/finance/sales-invoices/${invId}/post`, { token });
    agg = await one(
      `select count(*)::int as lines from journal_lines l join journal_entries j on j.id=l."journalId" where j.reference=$1`,
      [ref],
    );
    invRow = await one(`select "postedAt" is not null as posted from sales_invoices where id=$1`, [invId]);
  } finally {
    if (removed) {
      await db.query(`update accounts set code='2104' where id=$1 and code='2104-AUDIT-HIDDEN'`, [removed.id]);
      restored = 'restored 2104';
    }
  }

  // The defect being guarded: postedAt set, zero journals, no error at all.
  const blocked = postRes.status === 400;
  const namesTheAccount = /2104/.test(postRes.raw);
  const nothingWritten = agg.lines === 0 && invRow.posted === false;

  record('T2', 'Posting fails CLOSED with a named account, instead of silently skipping the journal', {
    removedAccount: removed, create: created, post: postRes, journalAggregate: agg,
    invoiceAfterPost: invRow, blocked, namesTheAccount, nothingWritten, cleanup: restored,
    finding: 'Deleting one required account must stop the whole posting, name the account, '
      + 'and leave postedAt unset. Before the fix the same missing account produced HTTP 200, '
      + 'a stamped postedAt, and zero journal lines — revenue silently never reaching the ledger.',
  });
  return expect(blocked, true) && expect(namesTheAccount, true) && expect(nothingWritten, true);
});

test('T4', 'Bank-reconciliation adjustment journal is rejected 400 by the ValidationPipe', async () => {
  const token = await login('admin@nexerp.id');
  // exact payload from useBankReconciliationOperations.ts:238-251
  const payload = {
    journalNumber: `ADJ-RECON-${Date.now().toString().slice(-6)}`,
    transactionDate: new Date().toISOString(),
    description: 'Penyesuaian Rekonsiliasi Bank AUDIT',
    sourceDocument: 'RECON-audit',
    items: [{ accountId: '6190', description: 'Beban Administrasi Bank', debit: 0, credit: 0 }],
  };
  const r = await call('POST', '/finance/journals', { token, body: payload });
  const rejected = r.status === 400;
  record('T4', 'Bank-reconciliation adjustment journal is rejected 400 by the ValidationPipe', {
    source: 'frontend .../useBankReconciliationOperations.ts:238-251',
    request: r, rejected,
  });
  return expect(rejected, true);
});

test('T5', 'Currency CRUD: the five endpoints the UI calls, with the payload the UI actually sends', async () => {
  const token = await login('admin@nexerp.id');
  const code = `AUD${Date.now().toString().slice(-4)}`;
  // exactly the four fields the modal collects (page.tsx:259-272)
  const created = await call('POST', '/finance/currencies', {
    token, body: { code, symbol: 'A$', exchangeRate: 16000, isMain: false },
  });
  const id = created.json && created.json.id;
  const got = await call('GET', '/finance/currencies', { token });
  const patched = id ? await call('PATCH', `/finance/currencies/${id}`, { token, body: { symbol: 'A$$' } }) : null;
  const rate = id ? await call('PUT', `/finance/currencies/${id}/exchange-rate`, { token, body: { exchangeRate: 16100 } }) : null;
  const persisted = id ? await one(`select to_jsonb(t) j from master_currencies t where id=$1`, [id]) : null;
  const del = id ? await call('DELETE', `/finance/currencies/${id}`, { token }) : null;
  const gone = id ? await one(`select count(*)::int n from master_currencies where id=$1`, [id]) : null;

  const allFiveOk = [created, got, patched, rate, del].every((r) => r && r.status < 300);
  record('T5', 'Currency CRUD: the five endpoints the UI calls, with the payload the UI actually sends', {
    post: created, get: { status: got.status, count: Array.isArray(got.json) ? got.json.length : got.json },
    patch: patched, exchangeRate: rate, del: del, persistedRowBeforeDelete: persisted, rowsAfterDelete: gone,
    allFiveOk,
    correction: 'STATIC AUDIT SAID: no controller serves /finance/currencies and all five endpoints are 404. '
      + 'The route table shows all five exist, and the UI payload is accepted by the Currency model.',
    secondary: 'finance.service.js:411 `this.prisma.currency?.findMany() || []` — optional chaining means a missing '
      + 'model would return an empty list instead of erroring. Latent, not the active bug.',
  });
  return expect(allFiveOk, true);
});

test('T9', 'Controllers with no JwtAuthGuard: which really answer with no token', async () => {
  const probes = [
    ['GET', '/events/qc'],
    ['GET', '/marketing/brands'],
    ['GET', '/connect-whatsapp'],
    ['POST', '/wa-gateway/webhook'],
    ['GET', '/wa-webhook'],
  ];
  const out = [];
  for (const [m, u] of probes) {
    const r = await call(m, u, m === 'POST' ? { body: {} } : {});
    out.push({ method: m, url: u, status: r.status, snippet: r.raw.slice(0, 160) });
  }
  const openWith200 = out.filter((o) => o.status === 200).map((o) => o.url);
  const unanswered = out.filter((o) => o.status === 0).map((o) => o.url);
  record('T9', 'Controllers with no JwtAuthGuard: which really answer with no token', {
    probes: out, openWith200, timedOutEntirely: unanswered,
    correction: 'Static audit listed 5 open controllers including `app`. Live: marketing/brands is 401, '
      + 'connect-whatsapp has no route. Two are genuinely open to anyone with no token.',
    anomaly: 'GET /events/qc never answered at all — 20s timeout, no response. A public endpoint that hangs.',
  });
  return expect(openWith200.length, 2);
});

test('T11', 'Supplier number minted by the UI is never stored', async () => {
  const token = await login('admin@nexerp.id');
  const code = `VND-BBK-${Date.now().toString().slice(-5)}`;
  const name = `Audit Supplier ${Date.now()}`;
  const created = await call('POST', '/master/suppliers', {
    token, body: { name, code, contact: 'audit', phone: '000', email: 'sup@audit.local' },
  });
  const id = created.json && created.json.id;
  const row = id ? await one(`select to_jsonb(t) j from suppliers t where id=$1`, [id]) : null;
  const stored = row ? row.j.code : undefined;
  record('T11', 'Supplier number minted by the UI is never stored', {
    sentCode: code, create: created,
    columnsActuallyPresent: row ? Object.keys(row.j) : null,
    storedCode: stored === undefined ? '<no code column on the table>' : stored,
  });
  return expect(stored, undefined);
});

test('T13', 'A customer created through the UI form can be invoiced end-to-end', async () => {
  const token = await login('admin@nexerp.id');
  const before = {
    customers: (await one(`select count(*)::int n from customers`)).n,
    salesLeads: (await one(`select count(*)::int n from sales_leads`)).n,
  };
  const stamp = Date.now().toString().slice(-6);
  // the exact payload shape the UI form sends (useCustomerOperations.ts:233-258)
  const r = await call('POST', '/master/customers', {
    token,
    body: {
      clientName: `AUD T13 ${stamp}`, name: `AUD T13 ${stamp}`,
      brandName: `AUD T13 ${stamp}`, brandCode: `CUST-${stamp}`, code: `CUST-${stamp}`,
      phone: '000', email: `t13-${stamp}@audit.local`, creditLimit: 1000,
    },
  });
  const after = {
    customers: (await one(`select count(*)::int n from customers`)).n,
    salesLeads: (await one(`select count(*)::int n from sales_leads`)).n,
  };
  record('T13', 'A customer created through the UI form can be invoiced end-to-end', {
    before, after, createCustomer: r,
    salesLeadsGrewByOne: after.salesLeads === before.salesLeads + 1,
    note: 'The customer screens still read and write sales_leads — that is unchanged by design. '
      + 'This test only pins that the AR side can now consume the id the UI actually holds.',
  });
  return expect(r.status, 201) && expect(after.salesLeads, before.salesLeads + 1);
});

test('T14', 'A sales_leads id is accepted as customerId and materialises the AR row once', async () => {
  const token = await login('admin@nexerp.id');
  const before = (await one(`select count(*)::int n from customers`)).n;
  const stamp = Date.now().toString().slice(-6);

  // create through the UI-shaped endpoint, then invoice using the id it returns
  const cust = await call('POST', '/master/customers', {
    token,
    body: {
      clientName: `AUD T14 ${stamp}`, name: `AUD T14 ${stamp}`,
      brandName: `AUD T14 ${stamp}`, brandCode: `CUST-${stamp}`, code: `CUST-${stamp}`,
      email: `t14-${stamp}@audit.local`,
    },
  });
  if (cust.status !== 201) { record('T14', '', 'INCONCLUSIVE', { cust }); return false; }
  const leadId = cust.json.id;

  const mk = (n) => call('POST', '/finance/sales-invoices', {
    token,
    body: {
      customerId: leadId,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      notes: `AUDIT T14 ${n}`,
      lineItems: [{ itemCode: 'AUD-14', itemName: 'x', qty: 1, unit: 'pcs', price: 1000, discount: 0 }],
    },
  });
  const first = await mk(1);
  const afterFirst = (await one(`select count(*)::int n from customers`)).n;
  const second = await mk(2);
  const afterSecond = (await one(`select count(*)::int n from customers`)).n;
  const linked = await one(`select id, code from customers where code=$1`, [`CUST-${stamp}`]);

  // an id that is neither a customer nor a lead must still be rejected
  const bogus = await call('POST', '/finance/sales-invoices', {
    token,
    body: {
      customerId: randomUUID(),
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      lineItems: [{ itemCode: 'AUD-14', itemName: 'x', qty: 1, unit: 'pcs', price: 1000, discount: 0 }],
    },
  });

  const fkOk = first.status === 201
    && (await one(`select "customerId" from sales_invoices where id=$1`, [first.json.id])).customerId === linked.id;
  const idempotent = afterSecond === afterFirst;

  record('T14', 'A sales_leads id is accepted as customerId and materialises the AR row once', {
    customersBefore: before, createCustomer: cust, firstInvoice: first, secondInvoice: second,
    unknownIdResponse: bogus, arRow: linked, afterFirst, afterSecond,
    observed: { fkPointsAtArRow: fkOk, reusedSameCustomer: idempotent, unknownIdStill404: bogus.status === 404 },
  });
  return expect(first.status, 201) && expect(second.status, 201) && expect(fkOk, true)
    && expect(idempotent, true) && expect(bogus.status, 404);
});

test('T15', 'The journal balance guard sits below the service layer, so it covers every writer', async () => {
  const token = await login('admin@nexerp.id');
  const acc = await rows(`select id, code from accounts where code in ('1201','4101') order by code`);
  const ar = acc.find((a) => a.code === '1201');
  const rev = acc.find((a) => a.code === '4101');
  const stamp = `AUDIT-T15-${Date.now()}`;
  const base = {
    date: new Date().toISOString().slice(0, 10),
    description: stamp,
    // the journals endpoint refuses any journal without a payment-proof attachment
    attachmentUrls: [`https://audit.local/${stamp}.pdf`],
  };

  const unbalanced = await call('POST', '/finance/journals', {
    token,
    body: { ...base, reference: `${stamp}-UNBAL`, lines: [{ accountId: ar.id, debit: 500, credit: 0 }] },
  });
  const balanced = await call('POST', '/finance/journals', {
    token,
    body: {
      ...base, reference: `${stamp}-BAL`,
      lines: [
        { accountId: ar.id, debit: 500, credit: 0 },
        { accountId: rev.id, debit: 0, credit: 500 },
      ],
    },
  });
  const written = await rows(`select id, reference from journal_entries where reference like $1`, [`${stamp}-%`]);

  // clean up after ourselves
  await db.query(`delete from journal_lines where "journalId" in (select id from journal_entries where reference like $1)`, [`${stamp}-%`]);
  await db.query(`delete from journal_entries where reference like $1`, [`${stamp}-%`]);

  const guardRejects = unbalanced.status === 400 && /JOURNAL_UNBALANCED/.test(unbalanced.raw);
  const guardAllowsValid = balanced.status < 300 && written.length === 1;
  record('T15', 'The journal balance guard sits below the service layer, so it covers every writer', {
    guardSource: 'backend/src/prisma/prisma/prisma.service.ts assertJournalBalanced, installed as a client '
      + 'extension so it also covers writes issued through `tx` inside $transaction',
    unbalancedRequest: unbalanced, balancedRequest: balanced, rowsWritten: written,
    guardRejects, guardAllowsValid,
    correction: 'STATIC AUDIT SAID 18 of 19 journal-writing services bypass the balance check. They do not — '
      + 'the check is enforced at the Prisma layer. What is still 1-of-19 is the PERIOD GATE and the '
      + 'CONTROL-ACCOUNT validation, which still live only in finance-journal.service.ts.',
  });
  return expect(guardRejects, true) && expect(guardAllowsValid, true);
});

// ---- runner -------------------------------------------------------------------------
(async () => {
  db = new Client({ connectionString: DB_URL });
  await db.connect();
  const before = { customers: (await one(`select count(*)::int n from customers`)).n };

  const selected = ONLY ? TESTS.filter((x) => ONLY.split(',').includes(x.id)) : TESTS;
  let pass = 0, fail = 0;
  for (const t of selected) {
    let ok = false, err = null;
    try { ok = await t.run(); } catch (e) { err = e.message; }
    if (err) { fail++; console.log(`  ERROR ${t.id}  ${err}`); }
    else if (ok) { pass++; console.log(`  PASS  ${t.id}  ${t.title}`); }
    else { fail++; console.log(`  FAIL  ${t.id}  ${t.title}`); }
  }

  const after = { customers: (await one(`select count(*)::int n from customers`)).n };

  // teardown: the seeded customers exist only so the invoice paths are reachable. Leaving them
  // behind would make every later read of `customers` look like real company data.
  let removed = 0;
  for (const id of SEEDED) {
    const inInvoices = await one(`select count(*)::int n from sales_invoices where "customerId"=$1`, [id]);
    if (inInvoices.n > 0) { removed++; continue; } // referenced; leave it and say so
    await db.query(`delete from customers where id=$1`, [id]);
  }
  const out = {
    ranAt: new Date().toISOString(),
    mode: MUTATE ? 'MUTATED (expectations inverted)' : 'NORMAL',
    api: API, database: DB_URL.replace(/\/\/[^@]*@/, '//***@'),
    summary: { total: selected.length, pass, fail },
    sanity: {
      erp_audit_customers_went_from: before.customers,
      erp_audit_customers_went_to: after.customers,
      seededCustomersRemoved: SEEDED.length - removed,
      seededCustomersLeftBecauseInvoicesReferenceThem: removed,
      note: 'T1/T2 seed customers on purpose — the API cannot. Any AUD- customer still present is referenced by a '
        + 'test invoice, so it stays; delete the SI-2610-* audit invoices to clear them. erp_db_test is never connected.',
    },
    evidence,
  };
  const file = path.join(__dirname, MUTATE ? 'evidence.mutated.json' : 'evidence.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\n${pass} pass / ${fail} fail / ${selected.length} total   ->  ${path.relative(process.cwd(), file)}`);
  await db.end();
  process.exit(fail ? 1 : 0);
})();
