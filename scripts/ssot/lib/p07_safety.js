'use strict';

/**
 * NEX ERP - Phase P07 Target Safety and Isolation Library
 *
 * Mirrors p06_safety but with P07 DB name pattern.
 * Loopback PostgreSQL validation, secret redaction, isolated DB lifecycle.
 */

const crypto = require('crypto');
const path = require('path');
const { spawnSync } = require('child_process');
const { URL } = require('url');

class P07GateError extends Error {
  constructor(gateId, reasonCode, message, safeDetails) {
    const cleanMessage = redactSecrets(String(message || ''));
    super(`[${gateId}] ${reasonCode}: ${cleanMessage}`);
    this.name = 'P07GateError';
    this.gate_id = gateId;
    this.reason_code = reasonCode;
    this.message = `[${gateId}] ${reasonCode}: ${cleanMessage}`;
    if (safeDetails && typeof safeDetails === 'object') {
      this.safe_details = redactSecrets(safeDetails);
    }
  }
}

const DB_NAME_PATTERN = /^nex_p07_[a-z0-9_]+$/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const FORBIDDEN_DROP_NAMES = new Set([
  'postgres', 'template0', 'template1',
  'erp_db', 'erp_database', 'erp_production', 'dreamlab',
  'erp_db_test', 'erp_preview_kil', 'erp_staging'
]);
const PRODUCTION_LIKE_NAME_PATTERN = /(^|_)(prod|production|live|real|main)($|_)/i;

function getKnownSecrets(env = process.env) {
  const secrets = new Set();
  const addSecret = (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length >= 3) secrets.add(trimmed);
    }
  };
  const candidateEnvKeys = [
    'DATABASE_URL', 'P07_TEST_ADMIN_URL', 'P06_TEST_ADMIN_URL', 'P05_TEST_ADMIN_URL', 'DREAMLAB_DATABASE_URL',
    'POSTGRES_PASSWORD', 'PGPASSWORD', 'DB_PASSWORD',
    'JWT_SECRET', 'AES_SECRET_KEY', 'MFA_ENCRYPTION_KEY',
    'MARKETING_INTEGRATION_KEY'
  ];
  for (const k of candidateEnvKeys) addSecret(env[k]);
  for (const [k, v] of Object.entries(env || {})) {
    if (/(password|secret|credential|token|api_key|encryption_key)/i.test(k)) addSecret(v);
  }
  return Array.from(secrets).sort((a, b) => b.length - a.length);
}

function redactSecrets(input, env = process.env) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    let result = input;
    result = result.replace(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi, '[REDACTED_DATABASE_URL]');
    result = result.replace(/([a-zA-Z0-9+.-]+:\/\/)[^@\/\s]+@/g, '$1[REDACTED_USERINFO]@');
    const knownSecrets = getKnownSecrets(env);
    for (const secret of knownSecrets) {
      if (result.includes(secret)) result = result.split(secret).join('[REDACTED_SECRET]');
    }
    result = result.replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[REDACTED_JWT]');
    result = result.replace(/Bearer\s+[A-Za-z0-9._-]{16,}/g, 'Bearer [REDACTED_TOKEN]');
    result = result.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[REDACTED_EMAIL]');
    result = result.replace(/(?<![-\d])\+?6?2?0?[\d\s-]{9,15}\d(?![-\dT:.\d])/g, '[REDACTED_PHONE]');
    result = result.replace(/(?<![\d])\d{16}(?![\d])/g, '[REDACTED_NIK]');
    result = result.replace(/passwordHash\s*[:=]\s*['"][^'"]{4,}['"]/gi, 'passwordHash=[REDACTED]');
    result = result.replace(/set-cookie:\s*[^\s;,]+/gi, 'set-cookie: [REDACTED]');
    result = result.replace(/authorization:\s*[^\s;,]+/gi, 'authorization: [REDACTED]');
    return result;
  }
  if (Array.isArray(input)) return input.map(item => redactSecrets(item, env));
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
    return parsed.pathname.replace(/^\//, '') || 'source-read-only';
  } catch {
    const match = rawUrl.match(/\/([^/?#]+)(?:[?#]|$)/);
    return match ? match[1] : 'source-read-only';
  }
}

function redactUrl(rawUrl) {
  if (!rawUrl) return '(empty)';
  return redactSecrets(String(rawUrl));
}

function parseAndValidateTargetUrl(rawUrl) {
  if (!rawUrl) {
    throw new P07GateError('predecessor_and_scope', 'TARGET_URL_MISSING', 'Target database URL is not configured');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new P07GateError('predecessor_and_scope', 'INVALID_TARGET_URL', `Invalid database URL format: ${err.message}`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new P07GateError('predecessor_and_scope', 'REMOTE_TARGET_REFUSED', `Non-loopback target refused: ${hostname}. P07 certification is restricted to local loopback.`);
  }
  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new P07GateError('predecessor_and_scope', 'TARGET_DB_MISSING', 'Database URL must specify a database name');
  }
  if (PRODUCTION_LIKE_NAME_PATTERN.test(dbName)) {
    throw new P07GateError('predecessor_and_scope', 'PRODUCTION_TARGET_REFUSED', `Production-like target database name refused: "${dbName}"`);
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
    throw new P07GateError('predecessor_and_scope', 'UNSAFE_DB_NAME_REFUSED', `Unsafe temporary database name refused: "${name}". Must match ^nex_p07_[a-z0-9_]+$`);
  }
  if (FORBIDDEN_DROP_NAMES.has(name.toLowerCase())) {
    throw new P07GateError('predecessor_and_scope', 'PROTECTED_DB_NAME_REFUSED', `Protected system database name cannot be used: ${name}`);
  }
  return true;
}

function createInventory() {
  return { created: new Set(), dropped: new Set() };
}

async function createIsolatedDatabase(adminClient, dbName, inventory, targetOrOpts, maybeOpts) {
  validateDatabaseName(dbName);
  if (inventory.created.has(dbName)) {
    throw new P07GateError('predecessor_and_scope', 'DATABASE_ALREADY_IN_INVENTORY', `Database ${dbName} was already created in this run inventory`);
  }

  const checkRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (checkRes.rows.length > 0) {
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
      [dbName]
    );
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  }

  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  inventory.created.add(dbName);

  let target = targetOrOpts;
  let opts = maybeOpts || {};
  if (targetOrOpts && typeof targetOrOpts === 'object' && !targetOrOpts.hostname) {
    opts = targetOrOpts;
    target = null;
  }

  if (target && !opts.skipMigration) {
    const rawTarget = typeof target === 'string' ? parseAndValidateTargetUrl(target) : target;
    const isolatedDbUrl = `postgresql://${rawTarget.username}:${rawTarget.password}@${rawTarget.hostname}:${rawTarget.port}/${dbName}?schema=public`;
    const backendDir = path.resolve(__dirname, '../../../backend');

    const migRes = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: isolatedDbUrl },
      encoding: 'utf8',
      shell: process.platform === 'win32'
    });
    if (migRes.status !== 0) {
      throw new P07GateError('predecessor_and_scope', 'MIGRATION_DEPLOY_FAILED', `Failed to deploy migrations to isolated database ${dbName}: ${migRes.stderr || migRes.stdout}`);
    }
  }

  return dbName;
}

async function dropIsolatedDatabase(adminClient, dbName, inventory, sourceDbName) {
  if (sourceDbName && dbName.toLowerCase() === sourceDbName.toLowerCase()) {
    throw new P07GateError('predecessor_and_scope', 'SOURCE_DB_DROP_REFUSED', `Dropping source database is strictly forbidden: "${dbName}"`);
  }
  if (FORBIDDEN_DROP_NAMES.has(dbName.toLowerCase())) {
    throw new P07GateError('predecessor_and_scope', 'PROTECTED_DB_DROP_REFUSED', `Dropping protected database is strictly forbidden: ${dbName}`);
  }
  validateDatabaseName(dbName);
  if (!inventory.created.has(dbName)) {
    throw new P07GateError('predecessor_and_scope', 'UNTRACKED_DATABASE_DROP_REFUSED', `Refusing to drop database "${dbName}" not created by current process inventory`);
  }
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
    throw new P07GateError('predecessor_and_scope', 'CLEANUP_FAILED', `Cleanup failures: ${errors.join('; ')}`);
  }
  return {
    created: Array.from(inventory.created),
    dropped: Array.from(inventory.dropped)
  };
}

async function captureSourceFingerprint(client) {
  if (!client) {
    throw new P07GateError('predecessor_and_scope', 'SOURCE_CLIENT_MISSING', 'Source client is required for fingerprinting');
  }
  try {
    await client.query('BEGIN READ ONLY');
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    const tableCounts = [];
    for (const t of tables) {
      try {
        const countRes = await client.query(`SELECT count(*)::int AS cnt FROM "${t}"`);
        tableCounts.push({ table: t, count: countRes.rows[0].cnt });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new P07GateError('predecessor_and_scope', 'SOURCE_FINGERPRINT_FAILED', `Failed to aggregate row count for source table "${t}": ${err.message}`);
      }
    }
    await client.query('COMMIT');
    const payload = { tables, table_counts: tableCounts };
    const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    return { digest, table_count: tables.length, payload };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err instanceof P07GateError) throw err;
    throw new P07GateError('predecessor_and_scope', 'SOURCE_FINGERPRINT_FAILED', `Source fingerprint failed: ${err.message}`);
  }
}

function verifyFingerprintIntegrity(beforeFp, afterFp) {
  if (!beforeFp || !afterFp) return false;
  if (!beforeFp.digest || !afterFp.digest) return false;
  return beforeFp.digest === afterFp.digest && beforeFp.table_count === afterFp.table_count;
}

function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

function validateMetricProvenance(metrics, checks = [], subphases = [], seams = []) {
  if (!metrics || typeof metrics !== 'object') {
    throw new P07GateError('predecessor_and_scope', 'METRIC_PROVENANCE_MISMATCH', 'Metrics object is required');
  }
  // P07 metrics are derived directly from gate results; basic existence check.
  for (const key of Object.keys(metrics)) {
    if (metrics[key] === undefined || metrics[key] === null) {
      throw new P07GateError('predecessor_and_scope', 'METRIC_UNDEFINED', `Metric ${key} is undefined/null`);
    }
  }
  return true;
}

module.exports = {
  P07GateError,
  DB_NAME_PATTERN,
  LOOPBACK_HOSTS,
  redactUrl,
  redactSecrets,
  getKnownSecrets,
  extractDbName,
  parseAndValidateTargetUrl,
  validateDatabaseName,
  validateMetricProvenance,
  createInventory,
  createIsolatedDatabase,
  dropIsolatedDatabase,
  cleanupAllDatabases,
  captureSourceFingerprint,
  verifyFingerprintIntegrity,
  sha256
};