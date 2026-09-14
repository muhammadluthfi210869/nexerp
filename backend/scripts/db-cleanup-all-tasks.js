// Wipe all marketing_tasks (and cascade children) — full reset to clean state.
const url = process.env.DATABASE_URL || 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const { Client } = require('pg');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const TABLES_WITH_FK_TO_MARKETING_TASK = [
  { name: 'marketing_task_histories', col: 'taskId' },
  { name: 'marketing_task_comments', col: 'taskId' },
  { name: 'marketing_task_attachments', col: 'taskId' },
  { name: 'marketing_task_checklist_items', col: 'taskId' },
];

(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    await c.query('BEGIN');

    // 1. Backup
    console.log('--- Step 1: Backup ---');
    await c.query(`CREATE TABLE "_backup_marketing_tasks_${STAMP}" AS SELECT * FROM marketing_tasks`);
    const bt = await c.query(`SELECT COUNT(*)::int as c FROM "_backup_marketing_tasks_${STAMP}"`);
    console.log('  marketing_tasks backup:', bt.rows[0].c, 'rows');

    for (const t of TABLES_WITH_FK_TO_MARKETING_TASK) {
      try {
        const backupName = `_backup_${t.name}_${STAMP}`;
        await c.query(`CREATE TABLE "${backupName}" AS SELECT * FROM "${t.name}"`);
        const cnt = await c.query(`SELECT COUNT(*)::int as c FROM "${backupName}"`);
        console.log(`  ${t.name} backup:`, cnt.rows[0].c, 'rows');
      } catch (e) {
        console.log(`  ${t.name} skip:`, e.message.slice(0, 60));
      }
    }

    // 2. Inspect ON DELETE rule for marketing_tasks FK children
    console.log('\n--- Step 2: Inspect FK constraints ---');
    const fks = await c.query(`
      SELECT tc.table_name, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc USING (constraint_schema, constraint_name)
      JOIN information_schema.constraint_column_usage ccu USING (constraint_schema, constraint_name)
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'marketing_tasks'
      ORDER BY tc.table_name
    `);
    fks.rows.forEach(r => console.log(' ', r.table_name, '->', r.delete_rule));

    // 3. Cascade-delete children first (safer than relying on cascade order)
    console.log('\n--- Step 3: Delete children ---');
    for (const t of TABLES_WITH_FK_TO_MARKETING_TASK) {
      const r = await c.query(`DELETE FROM "${t.name}"`);
      console.log(`  ${t.name}: deleted ${r.rowCount} rows`);
    }

    // 4. Delete marketing_tasks
    console.log('\n--- Step 4: Delete marketing_tasks ---');
    const del = await c.query('DELETE FROM marketing_tasks');
    console.log('  marketing_tasks: deleted', del.rowCount, 'rows');

    await c.query('COMMIT');

    // 5. Verify
    console.log('\n--- Step 5: Verify ---');
    for (const t of ['marketing_tasks', 'marketing_task_histories', 'marketing_task_comments', 'marketing_task_attachments', 'marketing_task_checklist_items']) {
      const r = await c.query(`SELECT COUNT(*)::int as c FROM "${t}"`);
      console.log(' ', t.padEnd(40), '=', r.rows[0].c);
    }

    console.log('\nBackup stamp:', STAMP);
    console.log('Restore command: see scripts/db-restore-marketing-tasks.js (TODO if needed)');
  } catch (e) {
    console.error('ERR:', e.message);
    try { await c.query('ROLLBACK'); } catch {}
    console.log('Rolled back — no changes applied.');
  } finally {
    await c.end();
  }
})();
