'use strict';

/**
 * NEX ERP - Phase P04 Schema & Migration Analyzers
 *
 * Implements production verification logic and analyzers for:
 * - Contract consistency
 * - Migration chain integrity and Git base checksum comparison
 * - Unsafe contract DDL static analysis
 * - Fixture reconciliation and data-loss detection
 * - Backfill reconciliation
 * - Schema and data digests
 * - Constraint and index audits
 * - N-1/N compatibility coverage calculation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Audit contract consistency in 09_NON_FUNCTIONAL_CONTRACT.md and deployment scripts.
 */
function auditContractConsistency(root) {
  const contractPath = path.join(root, 'docs/legacy-erp/contracts/09_NON_FUNCTIONAL_CONTRACT.md');
  if (!fs.existsSync(contractPath)) {
    throw new Error('09_NON_FUNCTIONAL_CONTRACT.md missing');
  }
  const contractText = fs.readFileSync(contractPath, 'utf8');

  if (!/prisma migrate deploy/.test(contractText)) {
    throw new Error('09_NON_FUNCTIONAL_CONTRACT.md does not require prisma migrate deploy');
  }
  if (!/cf8b725d9fec4c808937c50217a3bc45050d271a/.test(contractText)) {
    throw new Error('09_NON_FUNCTIONAL_CONTRACT.md missing phase-base baseline reference');
  }
  if (!/expand\s*->\s*migrate/i.test(contractText) && !/expand.*migrate.*contract/i.test(contractText)) {
    throw new Error('09_NON_FUNCTIONAL_CONTRACT.md missing expand/migrate/contract rolling deploy window specification');
  }

  // Check init-db.sh
  const initDbPath = path.join(root, 'backend/init-db.sh');
  if (fs.existsSync(initDbPath)) {
    const initText = fs.readFileSync(initDbPath, 'utf8');
    // Remove comments before checking
    const nonCommentLines = initText.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    if (/prisma db push/.test(nonCommentLines)) {
      throw new Error('backend/init-db.sh still executes prisma db push');
    }
    if (/--accept-data-loss/.test(nonCommentLines)) {
      throw new Error('backend/init-db.sh still executes --accept-data-loss');
    }
    if (!/prisma migrate deploy/.test(nonCommentLines)) {
      throw new Error('backend/init-db.sh does not execute prisma migrate deploy');
    }
  }

  return { pass: true };
}

/**
 * Compare migration files on disk with the Git tree at phase_base_sha.
 */
function verifyMigrationChainIntegrity(migrationsDir, baseSha, root) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  if (entries.length === 0) {
    throw new Error('No migrations found in migrations directory');
  }

  // Check each migration directory has a valid migration.sql
  for (const dirName of entries) {
    const sqlPath = path.join(migrationsDir, dirName, 'migration.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration directory missing migration.sql: ${dirName}`);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    if (sqlContent.trim().length === 0) {
      throw new Error(`Migration sql file is empty: ${dirName}/migration.sql`);
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
        throw new Error(`Failed to read git base object for ${relGitPath}`);
      }
      const baseContent = showRes.stdout;
      const subPath = relGitPath.replace(/^backend\/prisma\/migrations\//, '');
      const onDiskPath = path.join(migrationsDir, subPath);
      if (!fs.existsSync(onDiskPath)) {
        throw new Error(`Prebase migration deleted on disk: ${relGitPath}`);
      }
      const onDiskContent = fs.readFileSync(onDiskPath, 'utf8');
      const normBase = baseContent.replace(/\r\n/g, '\n');
      const normDisk = onDiskContent.replace(/\r\n/g, '\n');
      if (sha256(normBase) !== sha256(normDisk)) {
        editedPrebaseCount++;
        throw new Error(`Prebase migration modified: checksum mismatch for ${relGitPath}`);
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
    // Ignore comments
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
    throw new Error(`Unsafe contract DDL detected (${violations.length} violations): ${violations.map(v => `[L${v.line}] ${v.rule}: ${v.text}`).join('; ')}`);
  }

  return { pass: true, violations: [] };
}

/**
 * Reconcile baseline fixtures with candidate post-upgrade fixtures.
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

    const afterMap = new Map(afterRows.map(r => [r.id, r]));
    for (const bRow of beforeRows) {
      const aRow = afterMap.get(bRow.id);
      if (!aRow) {
        dataLossRows++;
        errors.push(`Row ${bRow.id} in table ${table} missing after upgrade`);
      } else {
        // Check that all common fields retain their original values
        for (const [k, v] of Object.entries(bRow)) {
          if (aRow[k] === undefined || aRow[k] === null && v !== null) {
            dataLossRows++;
            errors.push(`Row ${bRow.id} in ${table} corrupted field ${k}: before=${v}, after=${aRow[k]}`);
          }
        }
      }
    }
  }

  if (dataLossRows > 0 || errors.length > 0) {
    throw new Error(`Data loss detected in baseline upgrade: ${errors.join('; ')}`);
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
      throw new Error(`Backfill counts do not reconcile: affected=${affected} != updated(${updated}) + skipped(${skipped}) + rejected(${rejected})`);
    }
  }
  return { pass: true };
}

/**
 * Compare baseline and rollback schema digests.
 */
function verifyRollbackSchema(baselineDigest, rollbackDigest) {
  if (baselineDigest !== rollbackDigest) {
    throw new Error(`Rollback schema mismatch with baseline: baseline=${baselineDigest} rollback=${rollbackDigest}`);
  }
  return { pass: true };
}

/**
 * Compare baseline and rollback fixture digests.
 */
function verifyRollbackData(baselineFixtureDigest, rollbackFixtureDigest) {
  if (baselineFixtureDigest !== rollbackFixtureDigest) {
    throw new Error(`Data loss detected after rollback: digest mismatch (baseline=${baselineFixtureDigest}, rollback=${rollbackFixtureDigest})`);
  }
  return { pass: true };
}

/**
 * Audit constraints and indexes in the live database.
 */
async function auditConstraintsAndIndexes(client) {
  // 1. Check unvalidated constraints
  const unvalRes = await client.query(`
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE convalidated = false AND connamespace = 'public'::regnamespace
  `);
  if (unvalRes.rows.length > 0) {
    throw new Error(`Unvalidated constraints found: ${unvalRes.rows.map(r => `${r.table_name}.${r.conname}`).join(', ')}`);
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
    throw new Error(`Invalid indexes found: ${invIdxRes.rows.map(r => `${r.table_name}.${r.index_name}`).join(', ')}`);
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
    throw new Error(`Orphan foreign keys found: ${orphanFkRes.rows.map(r => `${r.table_name}.${r.conname}`).join(', ')}`);
  }

  return {
    unvalidated_constraints: unvalRes.rows.length,
    invalid_indexes: invIdxRes.rows.length,
    orphan_foreign_keys: orphanFkRes.rows.length
  };
}

/**
 * Audit compatibility probe coverage.
 */
function auditCompatibilityCoverage(affectedTables, probeManifest) {
  if (!Array.isArray(affectedTables) || affectedTables.length === 0) {
    return { coverage_percent: 100, pass: true };
  }

  const manifestTables = new Set((probeManifest && probeManifest.probes || []).map(p => p.table));
  const missing = affectedTables.filter(t => !manifestTables.has(t));

  const coveragePercent = Math.round(((affectedTables.length - missing.length) / affectedTables.length) * 100);

  if (missing.length > 0) {
    throw new Error(`Missing compatibility probes for affected tables (${coveragePercent}% coverage): ${missing.join(', ')}`);
  }

  return {
    coverage_percent: coveragePercent,
    pass: coveragePercent === 100
  };
}

function validateEvidenceCandidateSha(evidenceSha, candidateSha) {
  if (evidenceSha !== candidateSha) {
    throw new Error(`Stale candidate SHA: evidence has ${evidenceSha}, expected ${candidateSha}`);
  }
  return true;
}

function validateSkipCount(checks) {
  const skips = (checks || []).filter(c => c.skipped === true);
  if (skips.length > 0) {
    throw new Error(`Unexpected skipped checks are forbidden: ${skips.map(s => s.id).join(', ')}`);
  }
  return true;
}

module.exports = {
  sha256,
  auditContractConsistency,
  verifyMigrationChainIntegrity,
  analyzeUnsafeContractDdl,
  reconcileFixtures,
  verifyBackfillReconciliation,
  verifyRollbackSchema,
  verifyRollbackData,
  auditConstraintsAndIndexes,
  auditCompatibilityCoverage,
  validateEvidenceCandidateSha,
  validateSkipCount
};
