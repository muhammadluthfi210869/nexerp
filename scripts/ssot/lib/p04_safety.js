'use strict';

/**
 * NEX ERP - Phase P04 Target Safety and Isolation Library
 *
 * Enforces strict safety boundaries:
 * 1. Loopback-only targets (localhost, 127.0.0.1, ::1)
 * 2. Refusal of production-like database names
 * 3. Strict temporary database naming (^nex_p04_[a-z0-9_]+$)
 * 4. Absolute protection of source and admin databases
 * 5. In-memory inventory of created databases
 * 6. Connection termination restricted to run-owned databases
 * 7. Credential redaction in all outputs
 * 8. Comprehensive fail-closed source database fingerprinting
 */

const crypto = require('crypto');
const { URL } = require('url');

class P04GateError extends Error {
  constructor(gateId, reasonCode, message) {
    const cleanMessage = redactSecrets(message);
    super(`[${gateId}] ${reasonCode}: ${cleanMessage}`);
    this.name = 'P04GateError';
    this.gate_id = gateId;
    this.reason_code = reasonCode;
    this.message = `[${gateId}] ${reasonCode}: ${cleanMessage}`;
  }
}

const DB_NAME_PATTERN = /^nex_p04_[a-z0-9_]+$/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const FORBIDDEN_DROP_NAMES = new Set(['postgres', 'template0', 'template1', 'erp_db', 'erp_database', 'erp_production', 'dreamlab']);
const PRODUCTION_LIKE_NAME_PATTERN = /(^|_)(prod|production|live|real|main)($|_)/i;

function getKnownSecrets(env = process.env) {
  const secrets = new Set();

  function addSecret(val) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length >= 3) {
        secrets.add(trimmed);
      }
    }
  }

  if (env.DATABASE_URL) {
    addSecret(env.DATABASE_URL);
    try {
      const p = new URL(env.DATABASE_URL);
      if (p.password) addSecret(p.password);
    } catch {}
  }
  if (env.P04_TEST_ADMIN_URL) {
    addSecret(env.P04_TEST_ADMIN_URL);
    try {
      const p = new URL(env.P04_TEST_ADMIN_URL);
      if (p.password) addSecret(p.password);
    } catch {}
  }
  if (env.DREAMLAB_DATABASE_URL) {
    addSecret(env.DREAMLAB_DATABASE_URL);
    try {
      const p = new URL(env.DREAMLAB_DATABASE_URL);
      if (p.password) addSecret(p.password);
    } catch {}
  }

  addSecret(env.POSTGRES_PASSWORD);
  addSecret(env.PGPASSWORD);
  addSecret(env.DB_PASSWORD);

  for (const [k, v] of Object.entries(env)) {
    if (/(password|secret|credential|token|api_key)/i.test(k)) {
      addSecret(v);
    }
  }

  return Array.from(secrets).sort((a, b) => b.length - a.length);
}

function redactSecrets(input, env = process.env) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'number' || typeof input === 'boolean') return input;

  if (typeof input === 'string') {
    let result = input;

    // 1. Replace postgres connection URLs
    result = result.replace(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi, '[REDACTED_DATABASE_URL]');

    // 2. Replace URL user-info patterns
    result = result.replace(/([a-zA-Z0-9+.-]+:\/\/)[^@\/\s]+@/g, '$1[REDACTED_USERINFO]@');

    // 3. Replace known secrets from environment
    const knownSecrets = getKnownSecrets(env);
    for (const secret of knownSecrets) {
      if (result.includes(secret)) {
        result = result.split(secret).join('[REDACTED_SECRET]');
      }
    }

    // 4. Any remaining postgres:// or postgresql:// scheme
    result = result.replace(/postgres(?:ql)?:\/\//gi, '[REDACTED_DATABASE_SCHEME]://');

    return result;
  }

  if (Array.isArray(input)) {
    return input.map(item => redactSecrets(item, env));
  }

  if (typeof input === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      const cleanKey = typeof k === 'string' ? redactSecrets(k, env) : k;
      out[cleanKey] = redactSecrets(v, env);
    }
    return out;
  }

  return input;
}

function extractDbName(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return 'source-read-only';
  try {
    const parsed = new URL(rawUrl);
    const name = parsed.pathname.replace(/^\//, '');
    return name || 'source-read-only';
  } catch {
    const match = rawUrl.match(/\/([^/?#]+)(?:[?#]|$)/);
    return match ? match[1] : 'source-read-only';
  }
}

function redactUrl(rawUrl) {
  if (!rawUrl) return '(empty)';
  return redactSecrets(String(rawUrl));
}

function assertNoSecrets(value, env = process.env, path = 'root') {
  if (value === null || value === undefined) return;
  if (typeof value === 'number' || typeof value === 'boolean') return;

  const knownSecrets = getKnownSecrets(env);

  function checkString(str, currentPath) {
    if (/postgres(?:ql)?:\/\//i.test(str)) {
      throw new P04GateError(
        'contract_consistency',
        'EVIDENCE_SECRET_DETECTED',
        `Postgres connection URL scheme detected at ${currentPath}`
      );
    }

    if (/:\/\/[^@\/\s]+@/.test(str)) {
      throw new P04GateError(
        'contract_consistency',
        'EVIDENCE_SECRET_DETECTED',
        `URL user-info pattern detected at ${currentPath}`
      );
    }

    for (const secret of knownSecrets) {
      if (str.includes(secret)) {
        throw new P04GateError(
          'contract_consistency',
          'EVIDENCE_SECRET_DETECTED',
          `Configured secret or credential detected at ${currentPath}`
        );
      }
    }
  }

  if (typeof value === 'string') {
    checkString(value, path);
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      assertNoSecrets(value[i], env, `${path}[${i}]`);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      checkString(k, `${path}.key(${k})`);
      assertNoSecrets(v, env, `${path}.${k}`);
    }
    return;
  }
}

function parseAndValidateTargetUrl(rawUrl) {
  if (!rawUrl) {
    throw new P04GateError('predecessor_and_target_safety', 'TARGET_URL_MISSING', 'Target database URL is not configured');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new P04GateError('predecessor_and_target_safety', 'INVALID_TARGET_URL', `Invalid database URL format: ${err.message}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'REMOTE_TARGET_REFUSED',
      `Non-loopback target refused: ${hostname}. P04 certification is restricted to local loopback.`
    );
  }

  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new P04GateError('predecessor_and_target_safety', 'TARGET_DB_MISSING', 'Database URL must specify a database name');
  }

  if (PRODUCTION_LIKE_NAME_PATTERN.test(dbName)) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'PRODUCTION_TARGET_REFUSED',
      `Production-like target database name refused: "${dbName}". Target must be an isolated local test database.`
    );
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
    throw new P04GateError(
      'predecessor_and_target_safety',
      'UNSAFE_DB_NAME_REFUSED',
      `Unsafe temporary database name refused: "${name}". Name must match ^nex_p04_[a-z0-9_]+$`
    );
  }
  if (FORBIDDEN_DROP_NAMES.has(name.toLowerCase())) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'PROTECTED_DB_NAME_REFUSED',
      `Protected system database name cannot be used: ${name}`
    );
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
    throw new P04GateError(
      'predecessor_and_target_safety',
      'DATABASE_ALREADY_IN_INVENTORY',
      `Database ${dbName} was already created in this run inventory`
    );
  }

  // Ensure DB does not already exist
  const checkRes = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );
  if (checkRes.rows.length > 0) {
    // Terminate connections and drop if stale previous run left it
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
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
    throw new P04GateError(
      'predecessor_and_target_safety',
      'SOURCE_DB_DROP_REFUSED',
      `Dropping source database is strictly forbidden: "${dbName}"`
    );
  }
  if (FORBIDDEN_DROP_NAMES.has(dbName.toLowerCase())) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'PROTECTED_DB_DROP_REFUSED',
      `Dropping protected database is strictly forbidden: "${dbName}"`
    );
  }
  validateDatabaseName(dbName);

  if (!inventory.created.has(dbName)) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'UNTRACKED_DATABASE_DROP_REFUSED',
      `Refusing to drop database "${dbName}" not created by current process inventory`
    );
  }

  // Terminate connections ONLY for this exact database
  await adminClient.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
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
    throw new P04GateError(
      'predecessor_and_target_safety',
      'CLEANUP_FAILED',
      `Cleanup failures: ${errors.join('; ')}`
    );
  }
  return {
    created: Array.from(inventory.created),
    dropped: Array.from(inventory.dropped)
  };
}

async function captureSourceFingerprint(client) {
  if (!client) {
    throw new P04GateError('predecessor_and_target_safety', 'SOURCE_CLIENT_MISSING', 'Source client is required for fingerprinting');
  }

  try {
    // Set transaction read only to guarantee no side-effects
    await client.query('BEGIN READ ONLY');

    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    const columnsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name ASC
    `);

    const constraintsRes = await client.query(`
      SELECT conname, contype, conrelid::regclass::text AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, conname ASC
    `);

    const indexesRes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname ASC
    `);

    // Aggregate counts for public tables to verify data is untouched
    const tableCounts = [];
    for (const t of tables) {
      try {
        const countRes = await client.query(`SELECT count(*)::int AS cnt FROM "${t}"`);
        tableCounts.push({ table: t, count: countRes.rows[0].cnt });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new P04GateError(
          'predecessor_and_target_safety',
          'SOURCE_FINGERPRINT_FAILED',
          `Failed to aggregate row count for source table "${t}": ${err.message}`
        );
      }
    }

    await client.query('COMMIT');

    const payload = {
      tables,
      columns: columnsRes.rows,
      constraints: constraintsRes.rows,
      indexes: indexesRes.rows,
      table_counts: tableCounts
    };

    const digest = crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      digest,
      table_count: tables.length,
      payload
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err instanceof P04GateError) throw err;
    throw new P04GateError('predecessor_and_target_safety', 'SOURCE_FINGERPRINT_FAILED', `Source fingerprint failed: ${err.message}`);
  }
}

function verifyFingerprintIntegrity(beforeFp, afterFp) {
  if (!beforeFp || !afterFp) return false;
  if (!beforeFp.digest || !afterFp.digest) return false;
  return beforeFp.digest === afterFp.digest && beforeFp.table_count === afterFp.table_count;
}

module.exports = {
  P04GateError,
  DB_NAME_PATTERN,
  LOOPBACK_HOSTS,
  redactUrl,
  redactSecrets,
  getKnownSecrets,
  extractDbName,
  assertNoSecrets,
  parseAndValidateTargetUrl,
  validateDatabaseName,
  createInventory,
  createIsolatedDatabase,
  dropIsolatedDatabase,
  cleanupAllDatabases,
  captureSourceFingerprint,
  verifyFingerprintIntegrity
};
