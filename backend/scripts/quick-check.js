const url = 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    const cols = await c.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'marketing_team_members' ORDER BY ordinal_position;"
    );
    console.log('COLUMNS:', cols.rows.map((r) => r.column_name).join(', '));
    console.log('---');

    const r = await c.query(
      'SELECT name, role, email, department, "isActive", "createdAt" FROM marketing_team_members ORDER BY name;'
    );
    console.log('TOTAL ROWS:', r.rowCount);
    r.rows.forEach((row) => {
      console.log(
        `${row.name} | role=${row.role} | email=${row.email} | active=${row.isActive} | dept=${row.department} | created=${row.createdAt}`
      );
    });
    console.log('---');

    const t = await c.query(
      'SELECT COUNT(*)::int as total, MIN("createdAt") as earliest, MAX("createdAt") as latest FROM marketing_tasks;'
    );
    console.log('TASKS:', t.rows[0]);

    const u = await c.query(
      'SELECT COUNT(*)::int as total, MIN("createdAt") as earliest, MAX("createdAt") as latest FROM users;'
    );
    console.log('USERS:', u.rows[0]);

    // Tasks by assignee count
    const a = await c.query(
      'SELECT a.name as assignee_name, COUNT(*)::int as cnt FROM marketing_tasks t LEFT JOIN marketing_team_members a ON t."assigneeId" = a.id GROUP BY a.name ORDER BY cnt DESC LIMIT 15;'
    );
    console.log('TASKS BY ASSIGNEE:');
    a.rows.forEach((row) => console.log(`  ${row.assignee_name ?? '(null)'}: ${row.cnt}`));

    // Tasks created since 2026-09-01
    const sept = await c.query(
      'SELECT COUNT(*)::int as total FROM marketing_tasks WHERE "createdAt" >= \'2026-09-01\';'
    );
    console.log('TASKS SINCE 2026-09-01:', sept.rows[0].total);

    // Luthfi user check
    const luthfi = await c.query(
      "SELECT id, email, \"fullName\", role FROM users WHERE LOWER(\"fullName\") LIKE '%luthfi%' OR LOWER(email) LIKE '%luthfi%';"
    );
    console.log('LUTHFI USERS:');
    luthfi.rows.forEach((row) => console.log(`  ${JSON.stringify(row)}`));
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await c.end();
  }
})();

