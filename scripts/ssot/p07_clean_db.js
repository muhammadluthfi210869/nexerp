#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P07 disposable-database cleanup.
 *
 * Connects to the loopback PostgreSQL admin endpoint and DROPs every database
 * whose name matches the contract pattern `^nex_p07_[a-z0-9_]+$`. This is the
 * final cleanup step for `npm run verify:p07`.
 *
 * Refuses to drop any database whose name is in the protected set
 * (erp_db, erp_database, erp_production, erp_db_test, erp_preview_kil, etc.).
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const FORBIDDEN = new Set([
  'postgres', 'template0', 'template1',
  'erp_db', 'erp_database', 'erp_production', 'erp_db_test',
  'erp_preview_kil', 'erp_staging', 'dreamlab'
]);

const PATTERN = /^nex_p07_[a-z0-9_]+$/;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  await admin.connect();

  const r = await admin.query(
    `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p07_%'`
  );
  const droppable = r.rows
    .map((row) => row.datname)
    .filter((name) => PATTERN.test(name) && !FORBIDDEN.has(name.toLowerCase()));

  let dropped = 0;
  for (const name of droppable) {
    try {
      await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`, [name]);
      await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
      console.log(`dropped: ${name}`);
      dropped++;
    } catch (err) {
      console.error(`failed to drop ${name}: ${err.message}`);
    }
  }

  const after = await admin.query(`SELECT count(*)::int AS n FROM pg_database WHERE datname LIKE 'nex_p07_%'`);
  const leftover = after.rows[0].n;
  await admin.end();

  if (leftover > 0) {
    console.error(`FAIL: ${leftover} nex_p07_* database(s) remain after cleanup`);
    process.exit(1);
  }
  console.log(`[P07] cleanup OK — dropped ${dropped}, leftover 0`);
}

main().catch((err) => {
  console.error(`[P07] cleanup error: ${err.message}`);
  process.exit(1);
});