// Atomic DELETE of rows older than 2026-09-01 across 7 stale tables.
// Backup tables (_backup_<name>_<stamp>) created earlier so this is reversible.
// FK constraints checked beforehand — RESTRICT only fires for rows >= cutoff, which we keep.
const url = process.env.DATABASE_URL || 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const { Client } = require('pg');
const CUTOFF = '2026-09-01';
const TARGETS = [
  { name: 'formulas', col: 'createdAt' },
  { name: 'goods_requirements', col: 'createdAt' },
  { name: 'journal_entries', col: 'date' },
  { name: 'purchase_orders', col: 'createdAt' },
  { name: 'sample_requests', col: 'createdAt' },
  { name: 'self_qr_devices', col: 'createdAt' },
  { name: 'system_sequences', col: 'updatedAt' },
];

(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    await c.query('BEGIN');
    let totalDeleted = 0;
    console.log(`Cutoff: ${CUTOFF}\n`);
    console.log('Table                       Before   Deleted  After');
    console.log('-------------------------- -------- -------- --------');
    for (const t of TARGETS) {
      const before = await c.query(`SELECT COUNT(*)::int as c FROM "${t.name}"`);
      const willDel = await c.query(`SELECT COUNT(*)::int as c FROM "${t.name}" WHERE "${t.col}" < $1`, [CUTOFF]);
      const r = await c.query(`DELETE FROM "${t.name}" WHERE "${t.col}" < $1`, [CUTOFF]);
      const after = await c.query(`SELECT COUNT(*)::int as c FROM "${t.name}"`);
      console.log(
        `${t.name.padEnd(26)} ${String(before.rows[0].c).padStart(8)} ${String(r.rowCount).padStart(8)} ${String(after.rows[0].c).padStart(8)}`,
      );
      totalDeleted += r.rowCount;
    }
    await c.query('COMMIT');
    console.log(`\nTOTAL: ${totalDeleted} rows deleted across ${TARGETS.length} tables`);
    console.log('All operations committed. Backup tables _backup_* preserved.');
  } catch (e) {
    console.error('ERR:', e.message);
    try { await c.query('ROLLBACK'); } catch {}
    console.log('Rolled back — no changes applied.');
  } finally {
    await c.end();
  }
})();
