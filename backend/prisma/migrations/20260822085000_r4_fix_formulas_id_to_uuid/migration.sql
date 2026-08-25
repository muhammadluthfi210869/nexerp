-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: align formulas.id column type with canonical UUID
-- before batch3_so_formula_pinning adds sales_orders.formulaId.
--
-- Why this exists
--   phase1 (20260430122705) created formulas with id TEXT.
--   marketing_batch3_placeholder_repair (20260822095959) declared
--   formulas with id UUID using CREATE TABLE IF NOT EXISTS — a no-op
--   when phase1 already created the table. The Prisma schema (rnd.prisma)
--   declares `id String @id @default(uuid()) @db.Uuid`.
--   batch3_so_formula_pinning (20260822100000) tries to add
--   sales_orders.formulaId UUID with FK to formulas(id) — fails
--   because the underlying column is still TEXT.
--
-- Why this is safe (data-preserving)
--   Read-only analysis (see r4-final-go-live-evidence/01-release-artifact
--   /DATA-ANALYSIS.md) shows:
--     - formulas: 0 rows
--     - formula_phases.formulaId: 0 rows
--     - qc_parameters.formulaId: 0 rows
--     - lab_test_results.formulaId: 0 rows
--   So id::uuid casts 0 rows and FKs reference 0 rows. Dropping and
--   recreating the FKs against the new column type is a metadata-only
--   operation.
--
-- Why a NEW migration instead of editing marketing_batch3_placeholder_repair
--   That migration is in the ledger as not-yet-applied (so the spec's
--   strategy A would also permit editing it), but per R4 §7 the cleanest
--   approach is a NEW pre-flight migration that runs earlier in the
--   chain — exactly the same pattern as the LeadStatus pre-flight fix.
--
-- What this migration does
--   1. Drop the 3 existing FKs that reference formulas(id).
--   2. ALTER formulas.id TYPE UUID USING id::uuid.
--   3. Recreate the 3 FKs against the now-UUID column.
--   After this migration runs, batch3_so_formula_pinning's
--   sales_orders.formulaId UUID column + FK to formulas(id) succeeds.
-- ─────────────────────────────────────────────────────────────────

-- Drop the 3 existing FKs that reference formulas(id) BEFORE we
-- attempt any column-type change. Prisma's CREATE TABLE IF NOT EXISTS
-- did not recreate them with the right type, so they may also need
-- recreation.
ALTER TABLE "formula_phases"   DROP CONSTRAINT IF EXISTS "formula_phases_formulaId_fkey";
ALTER TABLE "qc_parameters"    DROP CONSTRAINT IF EXISTS "qc_parameters_formulaId_fkey";
ALTER TABLE "lab_test_results" DROP CONSTRAINT IF EXISTS "lab_test_results_formulaId_fkey";

-- Drop the 6 existing FKs that reference sales_orders(id) BEFORE we
-- attempt to alter sales_orders.id to UUID.
ALTER TABLE "design_tasks"      DROP CONSTRAINT IF EXISTS "design_tasks_soId_fkey";
ALTER TABLE "production_plans"  DROP CONSTRAINT IF EXISTS "production_plans_soId_fkey";
ALTER TABLE "sales_order_items" DROP CONSTRAINT IF EXISTS "sales_order_items_soId_fkey";
ALTER TABLE "sales_returns"     DROP CONSTRAINT IF EXISTS "sales_returns_soId_fkey";
ALTER TABLE "shipments"         DROP CONSTRAINT IF EXISTS "shipments_soId_fkey";
ALTER TABLE "unified_invoices"  DROP CONSTRAINT IF EXISTS "unified_invoices_soId_fkey";

-- Align referencing column types with canonical UUID.
-- All affected tables have 0 rows on the protected DB, so the casts
-- affect 0 rows. The drizzle through TEXT→UUID is safe.
ALTER TABLE "formula_phases"   ALTER COLUMN "formulaId" TYPE UUID USING "formulaId"::uuid;
ALTER TABLE "qc_parameters"    ALTER COLUMN "formulaId" TYPE UUID USING "formulaId"::uuid;
ALTER TABLE "lab_test_results" ALTER COLUMN "formulaId" TYPE UUID USING "formulaId"::uuid;

ALTER TABLE "design_tasks"      ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;
ALTER TABLE "production_plans"  ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;
ALTER TABLE "sales_order_items" ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;
ALTER TABLE "sales_returns"     ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;
ALTER TABLE "shipments"         ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;
ALTER TABLE "unified_invoices"  ALTER COLUMN "soId" TYPE UUID USING "soId"::uuid;

-- Bring primary id columns into UUID alignment.
ALTER TABLE "formulas"      ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "sales_orders"  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

ALTER TABLE "formula_phases"
  ADD CONSTRAINT "formula_phases_formulaId_fkey"
  FOREIGN KEY ("formulaId") REFERENCES "formulas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qc_parameters"
  ADD CONSTRAINT "qc_parameters_formulaId_fkey"
  FOREIGN KEY ("formulaId") REFERENCES "formulas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_test_results"
  ADD CONSTRAINT "lab_test_results_formulaId_fkey"
  FOREIGN KEY ("formulaId") REFERENCES "formulas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
