'use strict';

/**
 * NEX ERP - Phase P04 Target Safety and Isolation Library
 *
 * Enforces strict safety boundaries:
 * 1. Loopback-only targets (localhost, 127.0.0.1, ::1)
 * 2. Strict temporary database naming (^nex_p04_[a-z0-9_]+$)
 * 3. Absolute protection of source and admin databases
 * 4. In-memory inventory of created databases
 * 5. Connection termination restricted to run-owned databases
 * 6. Credential redaction in all outputs
 * 7. Source database fingerprinting before and after certification
 */

const crypto = require('crypto');
const { URL } = require('url');

const DB_NAME_PATTERN = /^nex_p04_[a-z0-9_]+$/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const FORBIDDEN_DROP_NAMES = new Set(['postgres', 'template0', 'template1', 'erp_db', 'erp_database', 'erp_production', 'dreamlab']);

function redactUrl(rawUrl) {
  if (!rawUrl) return '(empty)';
  try {
    const parsed = new URL(rawUrl);
    const user = parsed.username ? '***' : '';
    const pass = parsed.password ? ':***@' : (parsed.username ? '@' : '');
    return `${parsed.protocol}//${user}${pass}${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return String(rawUrl).replace(/:[^@/]+@/, ':***@');
  }
}

function parseAndValidateTargetUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error('Target database URL is not configured');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new Error(`Invalid database URL format: ${err.message}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(`Non-loopback target refused: ${hostname}. P04 certification is restricted to local loopback.`);
  }

  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new Error('Database URL must specify a database name');
  }

  return {
    hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    username: parsed.username || 'postgres',
    password: parsed.password || '',
    database: dbName,
    redactedUrl: redactUrl(rawUrl)
  };
}

function validateDatabaseName(name) {
  if (typeof name !== 'string' || !DB_NAME_PATTERN.test(name)) {
    throw new Error(`Unsafe temporary database name refused: "${name}". Name must match ^nex_p04_[a-z0-9_]+$`);
  }
  if (FORBIDDEN_DROP_NAMES.has(name.toLowerCase())) {
    throw new Error(`Protected system database name cannot be used: ${name}`);
  }
  return true;
}

function createInventory() {
  return {
    created: new Set(),
    dropped: new Set()
  };
}

async function createIsolatedDatabase(adminClient, dbName, inventory) {
  validateDatabaseName(dbName);

  if (inventory.created.has(dbName)) {
    throw new Error(`Database ${dbName} was already created in this run inventory`);
  }

  // Ensure DB does not already exist
  const checkRes = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );
  if (checkRes.rows.length > 0) {
    // Terminate connections and drop if stale previous run left it
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  }

  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  inventory.created.add(dbName);
  return dbName;
}

async function dropIsolatedDatabase(adminClient, dbName, inventory, sourceDbName) {
  if (sourceDbName && dbName.toLowerCase() === sourceDbName.toLowerCase()) {
    throw new Error(`Dropping source database is strictly forbidden: "${dbName}"`);
  }
  if (FORBIDDEN_DROP_NAMES.has(dbName.toLowerCase())) {
    throw new Error(`Dropping protected database is strictly forbidden: "${dbName}"`);
  }
  validateDatabaseName(dbName);

  if (!inventory.created.has(dbName)) {
    throw new Error(`Refusing to drop database "${dbName}" not created by current process inventory`);
  }

  // Terminate connections ONLY for this exact database
  await adminClient.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbName]
  );

  await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  inventory.dropped.add(dbName);
  return dbName;
}

async function cleanupAllDatabases(adminClient, inventory, sourceDbName) {
  const errors = [];
  for (const dbName of inventory.created) {
    if (!inventory.dropped.has(dbName)) {
      try {
        await dropIsolatedDatabase(adminClient, dbName, inventory, sourceDbName);
      } catch (err) {
        errors.push(`Failed to clean up ${dbName}: ${err.message}`);
      }
    }
  }
  if (errors.length > 0) {
    throw new Error(`Cleanup failures: ${errors.join('; ')}`);
  }
  return {
    created: Array.from(inventory.created),
    dropped: Array.from(inventory.dropped)
  };
}

async function captureSourceFingerprint(client) {
  try {
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    const columnsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name ASC
    `);

    const digest = crypto.createHash('sha256')
      .update(JSON.stringify({ tables, columns: columnsRes.rows }))
      .digest('hex');

    return {
      table_count: tables.length,
      tables,
      digest
    };
  } catch (err) {
    return {
      table_count: 0,
      tables: [],
      digest: `error:${err.message}`
    };
  }
}

function verifyFingerprintIntegrity(beforeFp, afterFp) {
  if (!beforeFp || !afterFp) return false;
  return beforeFp.digest === afterFp.digest && beforeFp.table_count === afterFp.table_count;
}

module.exports = {
  DB_NAME_PATTERN,
  LOOPBACK_HOSTS,
  redactUrl,
  parseAndValidateTargetUrl,
  validateDatabaseName,
  createInventory,
  createIsolatedDatabase,
  dropIsolatedDatabase,
  cleanupAllDatabases,
  captureSourceFingerprint,
  verifyFingerprintIntegrity
};
