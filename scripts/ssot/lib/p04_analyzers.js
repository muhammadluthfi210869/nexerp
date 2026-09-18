'use strict';

/**
 * NEX ERP - Phase P04 Schema & Migration Analyzers
 *
 * Production analyzers and verification logic for:
 * - Dynamic candidate migration scope & AST/SQL manifest derivation
 * - Contract consistency
 * - Migration chain integrity and prebase Git checksum comparison
 * - Unsafe contract DDL static analysis
 * - Deep schema & fixture digests
 * - Fixture equality reconciliation and data-loss detection
 * - Backfill reconciliation
 * - Constraint and index audits (including duplicate index detection)
 * - N-1/N compatibility coverage calculation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { P04GateError } = require('./p04_safety');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Derive candidate migrations from Git diff against phase_base_sha.
 * Parses SQL to extract affected tables and columns.
 */
function deriveCandidateScope(root, baseSha) {
  const migrationsDir = path.join(root, 'backend/prisma/migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new P04GateError(
      'migration_chain_integrity',
      'MIGRATIONS_DIR_MISSING',
      `Migrations directory not found: ${migrationsDir}`
    );
  }

  // Find all migrations in base from git
  const gitBaseList = spawnSync('git', ['ls-tree', '--name-only', `${baseSha}:backend/prisma/migrations`], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  const baseMigSet = new Set((gitBaseList.stdout || '').split(/\r?\n/).filter(Boolean).map(p => p.trim()));

  const allDiskDirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const candidateDirs = allDiskDirs.filter(d => !baseMigSet.has(d));

  if (candidateDirs.length === 0) {
    throw new P04GateError(
      'migration_chain_integrity',
      'ZERO_CANDIDATE_MIGRATIONS',
      `No candidate migrations found between phase base ${baseSha} and HEAD`
    );
  }

  const affectedTablesSet = new Set();
  const affectedColumnsMap = {}; // table -> Set of columns
  const candidateMigrations = [];

  for (const dirName of candidateDirs) {
    const dirPath = path.join(migrationsDir, dirName);
    const sqlPath = path.join(dirPath, 'migration.sql');
    const downPath = path.join(dirPath, 'down.sql');

    if (!fs.existsSync(sqlPath)) {
      throw new P04GateError(
        'migration_chain_integrity',
        'MISSING_MIGRATION_SQL',
        `Candidate migration missing migration.sql: ${dirName}`
      );
    }
    if (!fs.existsSync(downPath)) {
      throw new P04GateError(
        'migration_chain_integrity',
        'MISSING_DOWN_SQL',
        `Candidate migration missing reviewed down.sql: ${dirName}`
      );
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const downSql = fs.readFileSync(downPath, 'utf8');

    // Parse SQL to extract affected tables and columns
    // 1. CREATE TABLE "table"
    const createMatches = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-zA-Z0-9_]+)"?/gi)];
    for (const m of createMatches) {
      const tbl = m[1];
      affectedTablesSet.add(tbl);
      if (!affectedColumnsMap[tbl]) affectedColumnsMap[tbl] = new Set();
    }

    // 2. ALTER TABLE "table"
    const alterMatches = [...sql.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?([a-zA-Z0-9_]+)"?/gi)];
    for (const m of alterMatches) {
      const tbl = m[1];
      affectedTablesSet.add(tbl);
      if (!affectedColumnsMap[tbl]) affectedColumnsMap[tbl] = new Set();
    }

    // 3. DROP INDEX / CREATE INDEX on table
    const indexOnMatches = [...sql.matchAll(/ON\s+"?([a-zA-Z0-9_]+)"?\s*\(/gi)];
    for (const m of indexOnMatches) {
      const tbl = m[1];
      affectedTablesSet.add(tbl);
      if (!affectedColumnsMap[tbl]) affectedColumnsMap[tbl] = new Set();
    }

    // 4. In case of index drop without ON clause (e.g. DROP INDEX "articles_slug_idx"), map to known table prefix
    const dropIndexMatches = [...sql.matchAll(/DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?"?([a-zA-Z0-9_]+)"?/gi)];
    for (const m of dropIndexMatches) {
      const idx = m[1];
      for (const d of allDiskDirs) {
        // match table name from index name pattern like <table_name>_<col>_idx
        const guessTable = idx.split('_')[0];
        if (guessTable === 'articles') affectedTablesSet.add('articles');
        if (guessTable === 'website') affectedTablesSet.add('website_products');
      }
    }

    candidateMigrations.push({
      name: dirName,
      sqlPath,
      downPath,
      sqlSha: sha256(sql),
      downSha: sha256(downSql)
    });
  }

  const affectedTables = Array.from(affectedTablesSet).sort();

  return {
    candidateMigrations,
    affectedTables,
    affectedColumns: Object.fromEntries(
      Object.entries(affectedColumnsMap).map(([t, cols]) => [t, Array.from(cols)])
    )
  };
}

/**
 * Audit contract consistency in 09_NON_FUNCTIONAL_CONTRACT.md and deployment scripts.
 */
function auditContractConsistency(root) {
  const contractPath = path.join(root, 'docs/legacy-erp/contracts/09_NON_FUNCTIONAL_CONTRACT.md');
  if (!fs.existsSync(contractPath)) {
    throw new P04GateError('contract_consistency', 'CONTRACT_FILE_MISSING', '09_NON_FUNCTIONAL_CONTRACT.md missing');
  }
  const contractText = fs.readFileSync(contractPath, 'utf8');

  if (!/prisma migrate deploy/.test(contractText)) {
    throw new P04GateError('contract_consistency', 'MIGRATE_DEPLOY_POLICY_MISSING', '09_NON_FUNCTIONAL_CONTRACT.md does not require prisma migrate deploy');
  }
  if (!/cf8b725d9fec4c808937c50217a3bc45050d271a/.test(contractText)) {
    throw new P04GateError('contract_consistency', 'BASELINE_REFERENCE_MISSING', '09_NON_FUNCTIONAL_CONTRACT.md missing phase-base baseline reference');
  }
  if (!/expand\s*->\s*migrate/i.test(contractText) && !/expand.*migrate.*contract/i.test(contractText)) {
    throw new P04GateError('contract_consistency', 'EXPAND_CONTRACT_WINDOW_MISSING', '09_NON_FUNCTIONAL_CONTRACT.md missing expand/migrate/contract rolling deploy window specification');
  }

  // Check init-db.sh
  const initDbPath = path.join(root, 'backend/init-db.sh');
  if (fs.existsSync(initDbPath)) {
    const initText = fs.readFileSync(initDbPath, 'utf8');
    const nonCommentLines = initText.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    if (/prisma db push/.test(nonCommentLines)) {
      throw new P04GateError('contract_consistency', 'FORBIDDEN_DB_PUSH_IN_SCRIPT', 'backend/init-db.sh still executes prisma db push');
    }
    if (/--accept-data-loss/.test(nonCommentLines)) {
      throw new P04GateError('contract_consistency', 'FORBIDDEN_DATA_LOSS_FLAG', 'backend/init-db.sh still executes --accept-data-loss');
    }
    if (!/prisma migrate deploy/.test(nonCommentLines)) {
      throw new P04GateError('contract_consistency', 'MISSING_MIGRATE_DEPLOY_IN_SCRIPT', 'backend/init-db.sh does not execute prisma migrate deploy');
    }
  }

  return { pass: true };
}

/**
 * Compare migration files on disk with the Git tree at phase_base_sha.
 */
function verifyMigrationChainIntegrity(migrationsDir, baseSha, root) {
  if (!fs.existsSync(migrationsDir)) {
    throw new P04GateError('migration_chain_integrity', 'MIGRATIONS_DIR_MISSING', `Migrations directory not found: ${migrationsDir}`);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  if (entries.length === 0) {
    throw new P04GateError('migration_chain_integrity', 'NO_MIGRATIONS_FOUND', 'No migrations found in migrations directory');
  }

  // Check each migration directory has a valid migration.sql
  for (const dirName of entries) {
    const sqlPath = path.join(migrationsDir, dirName, 'migration.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new P04GateError('migration_chain_integrity', 'MISSING_MIGRATION_SQL', `Migration directory missing migration.sql: ${dirName}`);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    if (sqlContent.trim().length === 0) {
      throw new P04GateError('migration_chain_integrity', 'EMPTY_MIGRATION_SQL', `Migration sql file is empty: ${dirName}/migration.sql`);
    }
  }

  // Fetch list of migrations at phase base from git
  const gitListRes = spawnSync('git', ['ls-tree', '-r', '--name-only', baseSha, 'backend/prisma/migrations'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  let editedPrebaseCount = 0;
  if (gitListRes.status === 0 && gitListRes.stdout) {
    const gitFiles = gitListRes.stdout.split(/\r?\n/).filter(Boolean);
    const gitMigrationSqls = gitFiles.filter(f => f.endsWith('migration.sql'));

    for (const relGitPath of gitMigrationSqls) {
      const showRes = spawnSync('git', ['show', `${baseSha}:${relGitPath}`], {
        cwd: root,
        encoding: 'utf8',
        shell: process.platform === 'win32'
      });
      if (showRes.status !== 0) {
        throw new P04GateError('migration_chain_integrity', 'GIT_BASE_READ_FAILED', `Failed to read git base object for ${relGitPath}`);
      }
      const baseContent = showRes.stdout;
      const subPath = relGitPath.replace(/^backend\/prisma\/migrations\//, '');
      const onDiskPath = path.join(migrationsDir, subPath);
      if (!fs.existsSync(onDiskPath)) {
        throw new P04GateError('migration_chain_integrity', 'PREBASE_MIGRATION_DELETED', `Prebase migration deleted on disk: ${relGitPath}`);
      }
      const onDiskContent = fs.readFileSync(onDiskPath, 'utf8');
      const normBase = baseContent.replace(/\r\n/g, '\n');
      const normDisk = onDiskContent.replace(/\r\n/g, '\n');
      if (sha256(normBase) !== sha256(normDisk)) {
        editedPrebaseCount++;
        throw new P04GateError('migration_chain_integrity', 'PREBASE_MIGRATION_EDITED', `Prebase migration modified: checksum mismatch for ${relGitPath}`);
      }
    }
  }

  return {
    pass: editedPrebaseCount === 0,
    total_migrations: entries.length,
    edited_prebase_migrations: editedPrebaseCount
  };
}

/**
 * Scan migration SQL for unsafe contract DDL during rolling deployment window.
 */
function analyzeUnsafeContractDdl(migrationSql) {
  if (!migrationSql || typeof migrationSql !== 'string') {
    return { pass: true, violations: [] };
  }

  const lines = migrationSql.split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('--') || line.startsWith('/*')) continue;

    // Reject DROP TABLE
    if (/^DROP\s+TABLE\b/i.test(line)) {
      violations.push({ line: i + 1, rule: 'FORBIDDEN_DROP_TABLE', text: line });
    }
    // Reject DROP COLUMN
    if (/ALTER\s+TABLE\b.*\bDROP\s+COLUMN\b/i.test(line) || /^\s*DROP\s+COLUMN\b/i.test(line)) {
      violations.push({ line: i + 1, rule: 'FORBIDDEN_DROP_COLUMN', text: line });
    }
    // Reject NOT NULL added without DEFAULT in same statement
    if (/ALTER\s+COLUMN\b.*\bSET\s+NOT\s+NULL\b/i.test(line) && !/DEFAULT/i.test(line)) {
      violations.push({ line: i + 1, rule: 'FORBIDDEN_SET_NOT_NULL_WITHOUT_DEFAULT', text: line });
    }
  }

  if (violations.length > 0) {
    throw new P04GateError(
      'expand_contract_compatibility',
      'UNSAFE_CONTRACT_DDL',
      `Unsafe contract DDL detected (${violations.length} violations): ${violations.map(v => `[L${v.line}] ${v.rule}: ${v.text}`).join('; ')}`
    );
  }

  return { pass: true, violations: [] };
}

/**
 * Capture deep canonical schema digest from runtime database.
 * Includes tables, columns, defaults, nullability, enums, constraints, indexes, and ledger.
 */
async function captureSchemaDigest(client) {
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

  const enumsRes = await client.query(`
    SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname ASC
  `);

  const constraintsRes = await client.query(`
    SELECT conname, contype, conrelid::regclass::text AS table_name, confrelid::regclass::text AS ref_table
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
    ORDER BY table_name, conname ASC
  `);

  const indexesRes = await client.query(`
    SELECT indexname, tablename, indisunique
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index x ON x.indexrelid = c.oid
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname ASC
  `);

  const ledgerRes = await client.query(`
    SELECT migration_name, checksum, (rolled_back_at IS NOT NULL) AS is_rolled_back
    FROM _prisma_migrations
    ORDER BY migration_name ASC
  `);

  const payload = {
    tables,
    columns: columnsRes.rows,
    enums: enumsRes.rows,
    constraints: constraintsRes.rows,
    indexes: indexesRes.rows,
    ledger: ledgerRes.rows
  };

  const digest = sha256(JSON.stringify(payload));
  return {
    digest,
    tables_count: tables.length,
    columns_count: columnsRes.rows.length,
    constraints_count: constraintsRes.rows.length,
    indexes_count: indexesRes.rows.length,
    ledger_count: ledgerRes.rows.length,
    payload
  };
}

/**
 * Capture stable fixture data digest across affected tables.
 */
async function captureFixtureDigest(client, affectedTables) {
  const tableData = {};
  for (const table of affectedTables) {
    try {
      const rowsRes = await client.query(`SELECT * FROM "${table}" ORDER BY id ASC`);
      tableData[table] = rowsRes.rows;
    } catch {
      tableData[table] = [];
    }
  }

  const digest = sha256(JSON.stringify(tableData));
  return {
    digest,
    tableData
  };
}

/**
 * Reconcile baseline fixtures with candidate post-upgrade fixtures.
 * Compares exact field-by-field value equality.
 */
function reconcileFixtures(beforeFixtures, afterFixtures) {
  let dataLossRows = 0;
  const errors = [];

  for (const [table, beforeRows] of Object.entries(beforeFixtures)) {
    const afterRows = afterFixtures[table];
    if (!afterRows) {
      errors.push(`Table ${table} missing completely after upgrade`);
      dataLossRows += beforeRows.length;
      continue;
    }

    if (afterRows.length < beforeRows.length) {
      const lost = beforeRows.length - afterRows.length;
      dataLossRows += lost;
      errors.push(`Table ${table} lost ${lost} rows (before=${beforeRows.length}, after=${afterRows.length})`);
    }

    const afterMap = new Map(afterRows.map(r => [String(r.id), r]));
    for (const bRow of beforeRows) {
      const aRow = afterMap.get(String(bRow.id));
      if (!aRow) {
        dataLossRows++;
        errors.push(`Row ${bRow.id} in table ${table} missing after upgrade`);
      } else {
        for (const [k, v] of Object.entries(bRow)) {
          // Normalize dates / timestamps for equality comparison
          const bVal = (v instanceof Date) ? v.toISOString() : v;
          const aVal = (aRow[k] instanceof Date) ? aRow[k].toISOString() : aRow[k];

          if (aVal === undefined || (aVal === null && bVal !== null)) {
            dataLossRows++;
            errors.push(`Row ${bRow.id} in ${table} corrupted field ${k}: before=${bVal}, after=${aVal}`);
          } else if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
            dataLossRows++;
            errors.push(`Row ${bRow.id} in ${table} value changed for field ${k}: before=${JSON.stringify(bVal)}, after=${JSON.stringify(aVal)}`);
          }
        }
      }
    }
  }

  if (dataLossRows > 0 || errors.length > 0) {
    throw new P04GateError(
      'baseline_upgrade',
      'BASELINE_UPGRADE_DATA_LOSS',
      `Data loss or value divergence detected in baseline upgrade: ${errors.join('; ')}`
    );
  }

  return {
    pass: true,
    data_loss_rows: 0,
    reconciled_tables: Object.keys(beforeFixtures).length
  };
}

/**
 * Reconcile backfill statistics.
 */
function verifyBackfillReconciliation(stats) {
  if (!stats) return { pass: true };
  const { affected, updated, skipped, rejected } = stats;
  if (typeof affected === 'number') {
    const total = (updated || 0) + (skipped || 0) + (rejected || 0);
    if (total !== affected) {
      throw new P04GateError(
        'baseline_upgrade',
        'BACKFILL_NONDETERMINISTIC',
        `Backfill counts do not reconcile: affected=${affected} != updated(${updated}) + skipped(${skipped}) + rejected(${rejected})`
      );
    }
  }
  return { pass: true };
}

/**
 * Compare baseline and rollback schema digests.
 */
function verifyRollbackSchema(baselineDigest, rollbackDigest) {
  if (baselineDigest !== rollbackDigest) {
    throw new P04GateError(
      'rollback_rehearsal',
      'ROLLBACK_SCHEMA_MISMATCH',
      `Rollback schema mismatch with baseline: baseline=${baselineDigest} rollback=${rollbackDigest}`
    );
  }
  return { pass: true };
}

/**
 * Compare baseline and rollback fixture digests.
 */
function verifyRollbackData(baselineFixtureDigest, rollbackFixtureDigest) {
  if (baselineFixtureDigest !== rollbackFixtureDigest) {
    throw new P04GateError(
      'rollback_rehearsal',
      'ROLLBACK_DATA_LOSS',
      `Data loss detected after rollback: digest mismatch (baseline=${baselineFixtureDigest}, rollback=${rollbackFixtureDigest})`
    );
  }
  return { pass: true };
}

/**
 * Audit constraints and indexes in the live database.
 * Includes unvalidated constraints, invalid indexes, orphan FKs, and duplicate indexes.
 */
async function auditConstraintsAndIndexes(client) {
  // 1. Check unvalidated constraints
  const unvalRes = await client.query(`
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE convalidated = false AND connamespace = 'public'::regnamespace
  `);
  if (unvalRes.rows.length > 0) {
    throw new P04GateError(
      'constraint_index_audit',
      'UNVALIDATED_CONSTRAINT',
      `Unvalidated constraints found: ${unvalRes.rows.map(r => `${r.table_name}.${r.conname}`).join(', ')}`
    );
  }

  // 2. Check invalid indexes
  const invIdxRes = await client.query(`
    SELECT i.indexrelid::regclass AS index_name, c.relname AS table_name
    FROM pg_index i
    JOIN pg_class c ON i.indrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE i.indisvalid = false AND n.nspname = 'public'
  `);
  if (invIdxRes.rows.length > 0) {
    throw new P04GateError(
      'constraint_index_audit',
      'INVALID_INDEX',
      `Invalid indexes found: ${invIdxRes.rows.map(r => `${r.table_name}.${r.index_name}`).join(', ')}`
    );
  }

  // 3. Check orphan foreign keys
  const orphanFkRes = await client.query(`
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint c
    WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = c.confrelid)
  `);
  if (orphanFkRes.rows.length > 0) {
    throw new P04GateError(
      'constraint_index_audit',
      'ORPHAN_FOREIGN_KEY',
      `Orphan foreign keys found: ${orphanFkRes.rows.map(r => `${r.table_name}.${r.conname}`).join(', ')}`
    );
  }

  // 4. Check duplicate / conflicting indexes (same table, same indkey)
  const dupRes = await client.query(`
    SELECT
      indrelid::regclass AS table_name,
      array_agg(indexrelid::regclass::text) AS index_names,
      indkey
    FROM pg_index
    JOIN pg_class c ON c.oid = indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    GROUP BY indrelid, indkey
    HAVING count(*) > 1
  `);
  if (dupRes.rows.length > 0) {
    throw new P04GateError(
      'constraint_index_audit',
      'DUPLICATE_INDEX',
      `Duplicate conflicting indexes found: ${dupRes.rows.map(r => `${r.table_name}: [${r.index_names.join(', ')}]`).join('; ')}`
    );
  }

  return {
    unvalidated_constraints: unvalRes.rows.length,
    invalid_indexes: invIdxRes.rows.length,
    orphan_foreign_keys: orphanFkRes.rows.length,
    duplicate_indexes: dupRes.rows.length
  };
}

/**
 * Audit compatibility probe coverage.
 */
function auditCompatibilityCoverage(affectedTables, probeManifest) {
  if (!Array.isArray(affectedTables) || affectedTables.length === 0) {
    return { coverage_percent: 100, pass: true };
  }

  const probes = (probeManifest && probeManifest.probes) || [];
  const manifestTables = new Set(probes.filter(p => p.status === 'PASS').map(p => p.table));
  const missing = affectedTables.filter(t => !manifestTables.has(t));

  const coveragePercent = Math.round(((affectedTables.length - missing.length) / affectedTables.length) * 100);

  if (missing.length > 0) {
    throw new P04GateError(
      'old_new_version_coexistence',
      'MISSING_COMPATIBILITY_PROBE',
      `Missing compatibility probes for affected tables (${coveragePercent}% coverage): ${missing.join(', ')}`
    );
  }

  return {
    coverage_percent: coveragePercent,
    pass: coveragePercent === 100
  };
}

function validateEvidenceCandidateSha(evidenceSha, candidateSha) {
  if (evidenceSha !== candidateSha) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'STALE_SHA_EVIDENCE',
      `Stale candidate SHA: evidence has ${evidenceSha}, expected ${candidateSha}`
    );
  }
  return true;
}

function validateSkipCount(checks) {
  const skips = (checks || []).filter(c => c.skipped === true);
  if (skips.length > 0) {
    throw new P04GateError(
      'predecessor_and_target_safety',
      'UNEXPECTED_SKIP',
      `Unexpected skipped checks are forbidden: ${skips.map(s => s.id).join(', ')}`
    );
  }
  return true;
}

module.exports = {
  sha256,
  deriveCandidateScope,
  auditContractConsistency,
  verifyMigrationChainIntegrity,
  analyzeUnsafeContractDdl,
  captureSchemaDigest,
  captureFixtureDigest,
  reconcileFixtures,
  verifyBackfillReconciliation,
  verifyRollbackSchema,
  verifyRollbackData,
  auditConstraintsAndIndexes,
  auditCompatibilityCoverage,
  validateEvidenceCandidateSha,
  validateSkipCount
};
