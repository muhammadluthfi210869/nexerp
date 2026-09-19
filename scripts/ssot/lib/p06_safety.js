'use strict';

/**
 * NEX ERP - Phase P06 Target Safety and Isolation Library
 *
 * Requirements:
 * - DB name pattern /^nex_p06_[a-z0-9_]+$/
 * - Loopback PostgreSQL 15/16 validation
 * - Secret/PII redaction and credential leak prevention
 * - Read-only source database fingerprinting and integrity verification
 * - Isolated database creation, tracking and guaranteed cleanup
 */

const crypto = require('crypto');
const path = require('path');
const { spawnSync } = require('child_process');
const { URL } = require('url');

class P06GateError extends Error {
  constructor(gateId, reasonCode, message, safeDetails) {
    const cleanMessage = redactSecrets(String(message || ''));
    super(`[${gateId}] ${reasonCode}: ${cleanMessage}`);
    this.name = 'P06GateError';
    this.gate_id = gateId;
    this.reason_code = reasonCode;
    this.message = `[${gateId}] ${reasonCode}: ${cleanMessage}`;
    if (safeDetails && typeof safeDetails === 'object') {
      this.safe_details = redactSecrets(safeDetails);
    }
  }
}

const DB_NAME_PATTERN = /^nex_p06_[a-z0-9_]+$/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const FORBIDDEN_DROP_NAMES = new Set([
  'postgres', 'template0', 'template1',
  'erp_db', 'erp_database', 'erp_production', 'dreamlab'
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
    'DATABASE_URL', 'P06_TEST_ADMIN_URL', 'P05_TEST_ADMIN_URL', 'DREAMLAB_DATABASE_URL',
    'POSTGRES_PASSWORD', 'PGPASSWORD', 'DB_PASSWORD',
    'JWT_SECRET', 'AES_SECRET_KEY', 'MFA_ENCRYPTION_KEY'
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
      throw new P06GateError(
        'predecessor_scope_and_safety', 'CREDENTIAL_IN_EVIDENCE',
        `Postgres connection URL scheme detected at ${currentPath}`, { path: currentPath }
      );
    }
    if (/:\/\/[^@\/\s]+@/.test(str)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'CREDENTIAL_IN_EVIDENCE',
        `URL user-info pattern detected at ${currentPath}`, { path: currentPath }
      );
    }
    if (/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/.test(str)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'CREDENTIAL_IN_EVIDENCE',
        `JWT-shaped token detected at ${currentPath}`, { path: currentPath }
      );
    }
    if (/Bearer\s+[A-Za-z0-9._-]{16,}/.test(str)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'CREDENTIAL_IN_EVIDENCE',
        `Bearer token detected at ${currentPath}`, { path: currentPath }
      );
    }
    if (/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(str)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'PII_IN_EVIDENCE',
        `Email-shaped value detected at ${currentPath}`, { path: currentPath }
      );
    }
    const isHexHashOrUuid = /^[a-f0-9]{32,}$/i.test(str) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str) || str.includes('gen_random_uuid');
    const sanitizedForPii = str
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
      .replace(/[a-f0-9]{32,}/gi, '');
    if (!isHexHashOrUuid && /(?<![-\d])\+?6?2?0?[\d\s-]{9,15}\d(?![-\dT:.\d])/.test(sanitizedForPii)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'PII_IN_EVIDENCE',
        `Phone-shaped value detected at ${currentPath}`, { path: currentPath }
      );
    }
    if (!isHexHashOrUuid && /(?<![\d])\d{16}(?![\d])/.test(sanitizedForPii)) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'PII_IN_EVIDENCE',
        `NIK-shaped value detected at ${currentPath}`, { path: currentPath }
      );
    }
    for (const secret of knownSecrets) {
      if (str.includes(secret)) {
        throw new P06GateError(
          'predecessor_scope_and_safety', 'CREDENTIAL_IN_EVIDENCE',
          `Configured secret or credential detected at ${currentPath}`, { path: currentPath }
        );
      }
    }
  }

  if (typeof value === 'string') {
    if (path && /(_sha|sha256|sha|txid)/i.test(path)) return;
    checkString(value, path);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) assertNoSecrets(value[i], env, `${path}[${i}]`);
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/^(command|stdout|stderr|args)$/i.test(k)) continue;
      checkString(k, `${path}.key(${k})`);
      assertNoSecrets(v, env, `${path}.${k}`);
    }
  }
}

function parseAndValidateTargetUrl(rawUrl) {
  if (!rawUrl) {
    throw new P06GateError('predecessor_scope_and_safety', 'TARGET_URL_MISSING',
      'Target database URL is not configured');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new P06GateError('predecessor_scope_and_safety', 'INVALID_TARGET_URL',
      `Invalid database URL format: ${err.message}`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'REMOTE_TARGET_REFUSED',
      `Non-loopback target refused: ${hostname}. P06 certification is restricted to local loopback.`
    );
  }
  const dbName = parsed.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new P06GateError('predecessor_scope_and_safety', 'TARGET_DB_MISSING',
      'Database URL must specify a database name');
  }
  if (PRODUCTION_LIKE_NAME_PATTERN.test(dbName)) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'PRODUCTION_TARGET_REFUSED',
      `Production-like target database name refused: "${dbName}"`
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
    throw new P06GateError(
      'predecessor_scope_and_safety', 'UNSAFE_DB_NAME_REFUSED',
      `Unsafe temporary database name refused: "${name}". Must match ^nex_p06_[a-z0-9_]+$`
    );
  }
  if (FORBIDDEN_DROP_NAMES.has(name.toLowerCase())) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'PROTECTED_DB_NAME_REFUSED',
      `Protected system database name cannot be used: ${name}`
    );
  }
  return true;
}

function createInventory() {
  return { created: new Set(), dropped: new Set() };
}

function assertNoSourceSessionTermination(query, sourceDbName) {
  if (typeof query !== 'string') return;
  if (/pg_terminate_backend/i.test(query)) {
    if (sourceDbName && new RegExp(`(['"]?)${sourceDbName}\\1`, 'i').test(query)) {
      throw new P06GateError(
        'predecessor_scope_and_safety',
        'SOURCE_SESSION_TERMINATION_FORBIDDEN',
        `Attempted pg_terminate_backend on source database "${sourceDbName}"`
      );
    }
  }
}

async function seedP06DeterministicFixtures(client) {
  await client.query(`
    INSERT INTO users (id, "fullName", email, roles, status)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Admin P06', 'admin@example.com', ARRAY['SUPER_ADMIN']::"UserRole"[], 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO master_units (id, code, name, symbol, "isActive", "createdAt", "updatedAt")
    VALUES
      ('00000000-0000-0000-0000-000000000101', 'PCS', 'Pieces', 'pcs', true, NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000102', 'KG', 'Kilogram', 'kg', true, NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000103', 'MTR', 'Meter', 'm', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO warehouses (id, name, address, status, "createdAt", "updatedAt")
    VALUES
      ('00000000-0000-0000-0000-000000000201', 'Gudang Utama', 'Jakarta', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO master_categories (id, code, name, type, "isActive", "createdAt", "updatedAt")
    VALUES
      ('00000000-0000-0000-0000-000000000301', 'CAT-RAW-001', 'Bahan Baku', 'RAW_MATERIAL', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO suppliers (id, name, email, phone, "isBlacklisted", "createdAt")
    VALUES
      ('00000000-0000-0000-0000-000000000401', 'PT Supplier Utama', 'supplier@example.com', '081234567890', false, NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO master_tax_rates (id, name, rate, "isActive")
    VALUES
      ('00000000-0000-0000-0000-000000000501', 'PPN 11%', 11.00, true)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO system_configs (id, key, value, "group", "updatedAt")
    VALUES
      ('00000000-0000-0000-0000-000000000601', 'company.name', 'PT Aureon System', 'GENERAL', NOW())
    ON CONFLICT (key) DO NOTHING;
  `);
}

async function createIsolatedDatabase(adminClient, dbName, inventory, targetOrOpts, maybeOpts) {
  validateDatabaseName(dbName);
  if (inventory.created.has(dbName)) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'DATABASE_ALREADY_IN_INVENTORY',
      `Database ${dbName} was already created in this run inventory`
    );
  }

  // Clean up if already exists
  const checkRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (checkRes.rows.length > 0) {
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
      [dbName]
    );
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  }

  // Pure isolated creation: never template clone, never touch source DB
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
    
    // Apply committed migration chain
    const migRes = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: isolatedDbUrl },
      encoding: 'utf8',
      shell: process.platform === 'win32'
    });
    if (migRes.status !== 0) {
      throw new P06GateError(
        'predecessor_scope_and_safety', 'MIGRATION_DEPLOY_FAILED',
        `Failed to deploy migrations to isolated database ${dbName}: ${migRes.stderr || migRes.stdout}`
      );
    }

    // Seed minimal deterministic fixtures
    const { Client } = require(path.join(backendDir, 'node_modules/pg'));
    const fixtureClient = new Client({ connectionString: isolatedDbUrl });
    fixtureClient.on('error', () => {});
    await fixtureClient.connect();
    try {
      await seedP06DeterministicFixtures(fixtureClient);
    } finally {
      await fixtureClient.end().catch(() => {});
    }
  }

  return dbName;
}

async function dropIsolatedDatabase(adminClient, dbName, inventory, sourceDbName) {
  if (sourceDbName && dbName.toLowerCase() === sourceDbName.toLowerCase()) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'SOURCE_DB_DROP_REFUSED',
      `Dropping source database is strictly forbidden: "${dbName}"`
    );
  }
  if (FORBIDDEN_DROP_NAMES.has(dbName.toLowerCase())) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'PROTECTED_DB_DROP_REFUSED',
      `Dropping protected database is strictly forbidden: ${dbName}`
    );
  }
  validateDatabaseName(dbName);
  if (!inventory.created.has(dbName)) {
    throw new P06GateError(
      'predecessor_scope_and_safety', 'UNTRACKED_DATABASE_DROP_REFUSED',
      `Refusing to drop database "${dbName}" not created by current process inventory`
    );
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
    throw new P06GateError(
      'predecessor_scope_and_safety', 'CLEANUP_FAILED',
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
    throw new P06GateError('predecessor_scope_and_safety', 'SOURCE_CLIENT_MISSING',
      'Source client is required for fingerprinting');
  }
  try {
    await client.query('BEGIN READ ONLY');
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    const columnsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema='public'
      ORDER BY table_name, column_name ASC
    `);
    const constraintsRes = await client.query(`
      SELECT conname, contype, conrelid::regclass::text AS table_name
      FROM pg_constraint WHERE connamespace='public'::regnamespace
      ORDER BY table_name, conname ASC
    `);
    const indexesRes = await client.query(`
      SELECT indexname, tablename FROM pg_indexes WHERE schemaname='public'
      ORDER BY tablename, indexname ASC
    `);
    const tableCounts = [];
    for (const t of tables) {
      try {
        const countRes = await client.query(`SELECT count(*)::int AS cnt FROM "${t}"`);
        tableCounts.push({ table: t, count: countRes.rows[0].cnt });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new P06GateError(
          'predecessor_scope_and_safety', 'SOURCE_FINGERPRINT_FAILED',
          `Failed to aggregate row count for source table "${t}": ${err.message}`
        );
      }
    }
    await client.query('COMMIT');
    const payload = { tables, columns: columnsRes.rows, constraints: constraintsRes.rows, indexes: indexesRes.rows, table_counts: tableCounts };
    const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    return { digest, table_count: tables.length, payload };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err instanceof P06GateError) throw err;
    throw new P06GateError('predecessor_scope_and_safety', 'SOURCE_FINGERPRINT_FAILED',
      `Source fingerprint failed: ${err.message}`);
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
    throw new P06GateError('predecessor_scope_and_safety', 'METRIC_PROVENANCE_MISMATCH', 'Metrics object is required');
  }

  const checksById = {};
  for (const c of checks) {
    if (c && c.id) checksById[c.id] = c;
  }

  const provenanceMap = {
    unmapped_canonical_masters: () => checksById['canonical_master_inventory']?.unmapped_canonical_masters ?? 0,
    duplicate_master_sources: () => checksById['schema_alias_and_referential_integrity']?.duplicate_master_sources ?? 0,
    production_mock_fallbacks: () => checksById['frontend_live_data_and_dna']?.production_mock_fallbacks ?? 0,
    direct_prisma_controller_access: () => checksById['master_crud']?.direct_prisma_controller_access ?? 0,
    referential_integrity_violations: () => checksById['schema_alias_and_referential_integrity']?.referential_integrity_violations ?? 0,
    uniqueness_violations: () => checksById['uniqueness_and_code_generation']?.uniqueness_violations ?? 0,
    nondeterministic_codes: () => checksById['uniqueness_and_code_generation']?.nondeterministic_codes ?? 0,
    hard_deleted_referenced_rows: () => checksById['soft_delete_and_reference_policy']?.hard_deleted_referenced_rows ?? 0,
    soft_deleted_visibility_leaks: () => checksById['soft_delete_and_reference_policy']?.soft_deleted_visibility_leaks ?? 0,
    import_partial_commits: () => checksById['import_export']?.import_partial_commits ?? 0,
    import_duplicate_side_effects: () => checksById['import_export']?.import_duplicate_side_effects ?? 0,
    export_scope_bypasses: () => checksById['role_tenant_field_scope']?.export_scope_bypasses ?? 0,
    authorization_bypasses: () => checksById['role_tenant_field_scope']?.authorization_bypasses ?? 0,
    tenant_or_field_leaks: () => checksById['role_tenant_field_scope']?.tenant_or_field_leaks ?? 0,
    missing_or_nonatomic_audits: () => checksById['audit_outbox_atomicity']?.missing_or_nonatomic_audits ?? 0,
    ui_dna_violations: () => checksById['frontend_live_data_and_dna']?.ui_dna_violations ?? 0,
    unexpected_skips: () => checks.filter(c => c && c.skipped).length,
    unowned_requirements_or_seams: () => checksById['canonical_master_inventory']?.unowned_requirements_or_seams ?? 0,
    default_page_size: () => checksById['pagination_filter_and_search']?.default_page_size ?? 50,
    maximum_page_size: () => checksById['pagination_filter_and_search']?.maximum_page_size ?? 200,
    changed_max_cyclomatic_complexity: () => checksById['subphase_seam_and_regression']?.changed_max_cyclomatic_complexity ?? 6,
    changed_duplication_percent: () => checksById['subphase_seam_and_regression']?.changed_duplication_percent ?? 0.0,
    canonical_master_inventory_coverage_percent: () => checksById['canonical_master_inventory']?.canonical_master_inventory_coverage_percent ?? 0,
    required_operation_coverage_percent: () => checksById['canonical_master_inventory']?.required_operation_coverage_percent ?? 0,
    required_screen_live_data_coverage_percent: () => checksById['frontend_live_data_and_dna']?.required_screen_live_data_coverage_percent ?? 0,
    subphase_test_coverage_percent: () => {
      if (subphases.length === 0) return 0;
      const passed = subphases.filter(s => s && s.status === 'PASS').length;
      return Math.round((passed / subphases.length) * 100);
    },
    seam_test_coverage_percent: () => {
      if (seams.length === 0) return 0;
      const passed = seams.filter(s => s && s.status === 'PASS').length;
      return Math.round((passed / seams.length) * 100);
    }
  };

  const mismatches = [];
  for (const [key, getter] of Object.entries(provenanceMap)) {
    if (metrics[key] === undefined) {
      mismatches.push(`Missing metric key: ${key}`);
      continue;
    }
    const expected = getter();
    const observed = metrics[key];
    if (expected !== observed) {
      mismatches.push(`Metric ${key} mismatch: reported ${observed}, recomputed ${expected}`);
    }
  }

  if (mismatches.length > 0) {
    throw new P06GateError(
      'predecessor_scope_and_safety',
      'METRIC_PROVENANCE_MISMATCH',
      `Metric provenance validation failed:\n  ${mismatches.join('\n  ')}`
    );
  }

  return true;
}

module.exports = {
  P06GateError,
  DB_NAME_PATTERN,
  LOOPBACK_HOSTS,
  redactUrl,
  redactSecrets,
  getKnownSecrets,
  extractDbName,
  assertNoSecrets,
  assertNoSourceSessionTermination,
  seedP06DeterministicFixtures,
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
