// Survey: which rows in each table are below 2026-09-01?
// Returns per-table row counts (total / below-cutoff / above-or-equal) so we can decide
// whether to run the DELETE.
const url = process.env.DATABASE_URL || 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const { Client } = require('pg');
const CUTOFF = '2026-09-01';

const TABLES = [
  { name: 'users', dateCol: '"createdAt"' },
  { name: 'marketing_tasks', dateCol: '"createdAt"' },
  { name: 'marketing_projects', dateCol: '"createdAt"' },
  { name: 'marketing_brands', dateCol: '"createdAt"' },
  { name: 'marketing_team_members', dateCol: '"createdAt"' },
  { name: 'marketing_task_histories', dateCol: '"createdAt"' },
  { name: 'marketing_task_comments', dateCol: '"createdAt"' },
  { name: 'marketing_task_attachments', dateCol: '"createdAt"' },
  { name: 'marketing_task_checklist_items', dateCol: '"createdAt"' },
  { name: 'activity_logs', dateCol: '"createdAt"' },
  { name: 'crm_leads', dateCol: '"createdAt"' },
  { name: 'crm_guestbook_events', dateCol: '"createdAt"' },
  { name: 'crm_lead_audits', dateCol: '"createdAt"' },
  { name: 'bussdev_staff', dateCol: '"createdAt"' },
];

(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    console.log(`Cutoff: < ${CUTOFF} = DELETE, >= ${CUTOFF} = KEEP\n`);
    console.log('Table                              Total  <cutoff  >=cutoff  min_date  max_date');
    console.log('-------------------------------- ------ -------- --------- --------- ---------');
    for (const t of TABLES) {
      try {
        // Probe columns first (skip if table/column missing)
        const probe = await c.query(
          `SELECT MIN(${t.dateCol}) as min_d, MAX(${t.dateCol}) as max_d, COUNT(*)::int as total,
                  COUNT(*) FILTER (WHERE ${t.dateCol} < $1)::int as below,
                  COUNT(*) FILTER (WHERE ${t.dateCol} >= $1)::int as above
           FROM ${t.name}`,
          [CUTOFF],
        );
        const r = probe.rows[0];
        const minD = r.min_d ? new Date(r.min_d).toISOString().slice(0, 10) : '-';
        const maxD = r.max_d ? new Date(r.max_d).toISOString().slice(0, 10) : '-';
        console.log(
          `${t.name.padEnd(32)} ${String(r.total).padStart(6)} ${String(r.below).padStart(8)} ${String(r.above).padStart(9)} ${minD.padEnd(10)} ${maxD}`,
        );
      } catch (e) {
        console.log(`${t.name.padEnd(32)}  SKIP: ${e.message.slice(0, 60)}`);
      }
    }
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await c.end();
  }
})();
