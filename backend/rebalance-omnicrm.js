// rebalance-omnicrm.js — One-shot DB cleanup so the 5 seeded leads land on
// the 4 busdevs the user identified by WhatsApp.
//
// Steps:
//   1. Deactivate all busdevs except Jessica Dwipuspita, Diaz Muhammad
//      Irsyadi, Irma Safarina, Nisa (the 4 named by the user).
//      Pak Bagir is also deactivated — his userId is NULL so he can't be
//      assigned via round-robin anyway.
//   2. Reset all crm_leads.assignedToId to NULL.
//   3. Cycle-assign the 5 leads through the active busdevs sorted by
//      (totalLeads ASC, name ASC) — same rule the in-app RoundRobinService
//      uses. With 5 leads + 4 busdevs: Diaz=2, Irma=1, Jessica=1, Nisa=1.
//   4. Recompute bussdev_staffs.totalLeads from the actual lead counts.
//
// Idempotent: re-running yields the same state.

const { Client } = require('pg');

(async () => {
  const c = new Client({
    connectionString: 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public',
  });
  await c.connect();

  const VALID_USERIDS = [
    'b6a22824-7985-4599-98dc-bc9f218ae9d5', // Jessica Dwipuspita
    '0995831b-3c8b-4e96-a84a-77cc6e39760b', // Diaz Muhammad Irsyadi
    'b1dc729b-ff53-4f3e-8e68-a65cdbc84483', // Irma Safarina
    'd64728a4-9891-4ec5-8253-25384ad39531', // Nisa
  ];

  console.log('Step 1: deactivate all busdevs except the 4 named...');
  const r1 = await c.query(
    `UPDATE bussdev_staffs
        SET "isActive" = false
      WHERE "userId" IS NULL
         OR "userId" NOT IN ($1, $2, $3, $4)
      RETURNING id, name, "userId"`,
    VALID_USERIDS,
  );
  console.log(`  ${r1.rowCount} busdevs deactivated`);

  console.log('Step 2: reset all crm_leads.assignedToId = NULL...');
  const r2 = await c.query(`UPDATE crm_leads SET "assignedToId" = NULL`);
  console.log(`  ${r2.rowCount} leads reset`);

  console.log('Step 3: round-robin assign 5 leads across active busdevs...');
  await c.query(`
    WITH busdev_pool AS (
      SELECT "userId", ROW_NUMBER() OVER (ORDER BY "totalLeads" ASC, name ASC) AS pool_idx
        FROM bussdev_staffs
       WHERE "isActive" = true AND "userId" IS NOT NULL
    ),
    pool_size AS (SELECT COUNT(*)::int AS n FROM busdev_pool),
    ordered_leads AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS lead_idx
        FROM crm_leads
    )
    UPDATE crm_leads cl
       SET "assignedToId" = bp."userId"
      FROM ordered_leads ol, busdev_pool bp, pool_size ps
     WHERE cl.id = ol.id
       AND bp.pool_idx = ((ol.lead_idx - 1) % ps.n) + 1
  `);

  console.log('Step 4: recompute bussdev_staffs.totalLeads...');
  await c.query(`
    UPDATE bussdev_staffs bs
       SET "totalLeads" = COALESCE(c.cnt, 0)
      FROM (SELECT "assignedToId", COUNT(*)::int AS cnt
              FROM crm_leads GROUP BY "assignedToId") c
     WHERE bs."userId" = c."assignedToId"
  `);

  console.log('\n=== POST-REBALANCE STATE ===');
  const leads = await c.query(`
    SELECT l.id, l."displayName", l.phone, l.source, l."assignedToId", b.name AS busdev_name
      FROM crm_leads l
      LEFT JOIN bussdev_staffs b ON b."userId" = l."assignedToId"
     ORDER BY l."createdAt" ASC
  `);
  for (const row of leads.rows) {
    console.log(`  ${row.id.slice(0, 8)} | ${row.displayName || '(no name)'} | ${row.phone} | ${row.source} → ${row.busdev_name || 'NULL'}`);
  }

  const busdevs = await c.query(`
    SELECT name, "userId", "isActive", "totalLeads"
      FROM bussdev_staffs
     WHERE "userId" IN ($1, $2, $3, $4)
     ORDER BY name ASC
  `, VALID_USERIDS);
  console.log('\n=== ACTIVE BUSDEVS ===');
  for (const row of busdevs.rows) {
    console.log(`  ${row.name} | userId=${row.userId.slice(0, 8)} | active=${row.isActive} | total=${row.totalLeads}`);
  }

  await c.end();
  console.log('\nDONE');
})().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
