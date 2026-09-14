// Comprehensive table survey — list ALL tables in the public schema and check date distribution
const url = process.env.DATABASE_URL || 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const { Client } = require('pg');
const CUTOFF = '2026-09-01';

(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();

    // 1. List ALL user tables
    const tables = await c.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
    );

    console.log(`Found ${tables.rowCount} tables. Checking date column for each...\n`);
    console.log('Table                              Rows      min_date     max_date    HasCreatedAt');
    console.log('-------------------------------- ---------- ------------ ----------- ------------');

    for (const { table_name: tn } of tables.rows) {
      try {
        const count = await c.query(`SELECT COUNT(*)::int as c FROM "${tn}"`);
        if (count.rows[0].c === 0) {
          console.log(`${tn.padEnd(32)} ${String(0).padStart(10)} -            -           (empty)`);
          continue;
        }
        // Try common date column names
        const cols = await c.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema='public' AND table_name=$1
             AND (column_name ILIKE '%created%' OR column_name ILIKE '%date%' OR column_name ILIKE '%updated%')
           ORDER BY column_name`,
          [tn],
        );
        if (cols.rowCount === 0) {
          console.log(`${tn.padEnd(32)} ${String(count.rows[0].c).padStart(10)} (no date col)`);
          continue;
        }
        // Use first date column
        const dateCol = cols.rows[0].column_name;
        const probe = await c.query(
          `SELECT MIN("${dateCol}")::date as min_d, MAX("${dateCol}")::date as max_d,
                  COUNT(*) FILTER (WHERE "${dateCol}" < $1::date)::int as below,
                  COUNT(*) FILTER (WHERE "${dateCol}" >= $1::date)::int as above
           FROM "${tn}"`,
          [CUTOFF],
        );
        const r = probe.rows[0];
        const minD = r.min_d ? r.min_d.toISOString().slice(0, 10) : '-';
        const maxD = r.max_d ? r.max_d.toISOString().slice(0, 10) : '-';
        const colUsed = cols.rows.map((c) => c.column_name).join(',');
        console.log(
          `${tn.padEnd(32)} ${String(count.rows[0].c).padStart(10)} ${minD.padEnd(12)} ${maxD.padEnd(11)} [${colUsed}]`,
        );
        if (r.below > 0) {
          console.log(`  ⚠️  ${r.below} rows BELOW cutoff ${CUTOFF} would be deleted`);
        }
      } catch (e) {
        console.log(`${tn.padEnd(32)} ERR: ${e.message.slice(0, 60)}`);
      }
    }
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await c.end();
  }
})();
