const fs = require('fs');
const path = require('path');

const diffPath = path.join(__dirname, '../prisma/diff_p04.sql');
let sql = fs.readFileSync(diffPath, 'utf8');

const constraintMap = {
  'goods_requirements_salesOrderId_salesOrderVersion_key': 'goods_requirements',
  'journal_entries_fundRequestId_key': 'journal_entries',
  'marketing_projects_projectcode_key': 'marketing_projects',
  'marketing_tasks_taskcode_key': 'marketing_tasks',
  'purchase_orders_requestId_key': 'purchase_orders',
  'purchase_requests_requirementId_idempotencyKey_key': 'purchase_requests',
  'regulatory_pipelines_lead_sample_type_key': 'regulatory_pipelines'
};

for (const [key, tbl] of Object.entries(constraintMap)) {
  const dropIdx = `DROP INDEX "${key}";`;
  const replacement = `ALTER TABLE IF EXISTS "${tbl}" DROP CONSTRAINT IF EXISTS "${key}" CASCADE;\nDROP INDEX IF EXISTS "${key}";`;
  sql = sql.split(dropIdx).join(replacement);
}

// Ensure all DROPs are IF EXISTS
sql = sql.replace(/ALTER TABLE "([^"]+)"/g, 'ALTER TABLE IF EXISTS "$1"');
sql = sql.replace(/DROP INDEX (?:IF EXISTS )?"([^"]+)";/g, 'DROP INDEX IF EXISTS "$1";');
sql = sql.replace(/DROP CONSTRAINT (?:IF EXISTS )?"([^"]+)"/g, 'DROP CONSTRAINT IF EXISTS "$1"');
sql = sql.replace(/DROP COLUMN (?:IF EXISTS )?"([^"]+)"/g, 'DROP COLUMN IF EXISTS "$1"');
sql = sql.replace(/DROP TABLE (?:IF EXISTS )?"([^"]+)";/g, 'DROP TABLE IF EXISTS "$1" CASCADE;');
sql = sql.replace(/DROP TYPE (?:IF EXISTS )?"([^"]+)";/g, 'DROP TYPE IF EXISTS "$1" CASCADE;');
sql = sql.replace(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?([^\s;]+)/g, 'ADD COLUMN IF NOT EXISTS $1');
sql = sql.replace(/CREATE (UNIQUE )?INDEX (?:IF NOT EXISTS )?"([^"]+)"/g, 'CREATE $1INDEX IF NOT EXISTS "$2"');

// Ensure ADD CONSTRAINT is idempotent across replays by dropping existing constraint first
sql = sql.replace(/ALTER TABLE IF EXISTS "([^"]+)" ADD CONSTRAINT "([^"]+)"/g, 'ALTER TABLE IF EXISTS "$1" DROP CONSTRAINT IF EXISTS "$2";\nALTER TABLE IF EXISTS "$1" ADD CONSTRAINT "$2"');

// Safe enum additions
sql = sql.replace(/ALTER TYPE "([^"]+)" ADD VALUE '([^']+)';/g, 'ALTER TYPE "$1" ADD VALUE IF NOT EXISTS \'$2\';');

// Safe enum creations
sql = sql.replace(/CREATE TYPE "([^"]+)" AS ENUM \(([^)]+)\);/g, (match, enumName, values) => {
  return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN CREATE TYPE "${enumName}" AS ENUM (${values}); END IF; END $$;`;
});

// Safe CrmStage rename
const oldRename = `ALTER TYPE "CrmStage" RENAME TO "CrmStage_old";\nALTER TYPE "CrmStage_new" RENAME TO "CrmStage";`;
const safeRename = `DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage_old') THEN
    ALTER TYPE "CrmStage" RENAME TO "CrmStage_old";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage_new') THEN
    ALTER TYPE "CrmStage_new" RENAME TO "CrmStage";
  END IF;
END $$;`;
sql = sql.split(oldRename).join(safeRename);

const migrationDir = path.join(__dirname, '../prisma/migrations/20260917000000_p04_canonical_database_alignment');
fs.mkdirSync(migrationDir, { recursive: true });
fs.writeFileSync(path.join(migrationDir, 'migration.sql'), sql);
console.log(`Successfully prepared ${path.join(migrationDir, 'migration.sql')} (${sql.length} bytes)`);
