-- Reconcile the migration history with `prisma/schema/`.
--
-- Why this migration exists
-- -------------------------
-- `prisma migrate deploy` is the canonical boot path (`backend/init-db.sh:29`),
-- but the 51 migrations in this folder cannot rebuild the current schema. The
-- project's schema was mostly applied with `prisma db push`, so the history has
-- gaps that only show up on a database built from migrations alone.
--
-- Measured 2026-09-25 by rehearsing CI's exact `migrate deploy` step on a
-- scratch database and diffing the result against `prisma/schema`:
--   `prisma migrate diff --from-config-datasource --to-schema=prisma/schema --script`
--   -> 210 lines: 3 CREATE TABLE, 22 ALTER TABLE, 5 DROP INDEX, 3 ALTER TYPE
--
--   LIVE (db push)            208 tables   candidates/employee_trainings/employee_loans present
--   MIGRATIONS ONLY           206 tables   all three MISSING
--
-- The three missing tables are not cosmetic: `scripts/ssot/p16_clean_db.js:25`
-- probes `candidates`, and the P16 e2e suite writes to all three. A CI that ran
-- `verify:p16` against a migrations-only database therefore failed with
-- "relation candidates does not exist". So the gates could not run in CI at all
-- — which is exactly the gap G6 exists to close.
--
-- Idempotency
-- -----------
-- Every statement is guarded (`IF NOT EXISTS`, `IF EXISTS`, or a catalog
-- preflight). On a database that already matches the schema — i.e. the live and
-- production databases, both shaped by `db push` — every statement is a no-op.
-- This is required, not defensive: this file runs automatically at container
-- boot on production via `migrate deploy`.
--
-- Deliberately NOT in this file
-- -----------------------------
-- 1. `finished_goods_woId_fkey` and `qc_audits_stepLogId_fkey`. `migrate diff`
--    reports these as missing, but migration
--    `20260923200000_relax_p13_p14_legacy_fks` dropped them ON PURPOSE as the
--    P13/P14 P2003 fix (see docs/qa-gate/2026-09-24-fase1-build-stabilization.md
--    §2.B). Re-adding them here would re-break the quarantine-release flow.
--    This file sorts AFTER that migration, so it must not undo it.
-- 2. `ALTER COLUMN ... SET DATA TYPE TIMESTAMP(3)` and `ALTER COLUMN "id" DROP
--    DEFAULT` (≈14 tables). These are metadata-only for the gates: Prisma always
--    supplies `id` explicitly, and no gate asserts on timestamp precision.
--    Excluded to keep this migration's blast radius on production minimal.
--    `migrate diff` therefore still reports them — that is expected and documented.

-- ── 1. Enum values added after the enum was created ──────────────────────────
ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';
ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'COPQ';

-- ── 2. Stale organizationId indexes the schema no longer declares ────────────
DROP INDEX IF EXISTS "bussdev_staffs_organizationId_idx";
DROP INDEX IF EXISTS "guest_logs_organizationId_idx";
DROP INDEX IF EXISTS "lead_captures_organizationId_idx";
DROP INDEX IF EXISTS "sales_leads_organizationId_idx";
DROP INDEX IF EXISTS "sales_orders_org_idx";

-- ── 3. Columns the schema declares but the history never added ───────────────
ALTER TABLE "accounts"
    ADD COLUMN IF NOT EXISTS "allowManualJournal" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "employees"
    ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS "positionAllowance" TEXT,
    ADD COLUMN IF NOT EXISTS "totalTrainingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "transportFlat" TEXT,
    ADD COLUMN IF NOT EXISTS "transportTentativeDaily" TEXT;

ALTER TABLE "payroll_items"
    ADD COLUMN IF NOT EXISTS "bpjsEmployment" TEXT,
    ADD COLUMN IF NOT EXISTS "bpjsHealth" TEXT,
    ADD COLUMN IF NOT EXISTS "loanDeduction" TEXT,
    ADD COLUMN IF NOT EXISTS "notes" TEXT,
    ADD COLUMN IF NOT EXISTS "overtimePay" TEXT,
    ADD COLUMN IF NOT EXISTS "positionAllowance" TEXT,
    ADD COLUMN IF NOT EXISTS "pph21" TEXT,
    ADD COLUMN IF NOT EXISTS "remainingLoan" TEXT,
    ADD COLUMN IF NOT EXISTS "transportFlat" TEXT,
    ADD COLUMN IF NOT EXISTS "transportTentative" TEXT;

-- ── 4. Stale column. `netto` belongs to `SalesOrderItem` (bussdev.prisma:210);
--       `sales_orders.netto` is pre-refactor residue. The frontend reads
--       `lineItem.netto` from order items, never from the order header. ───────
ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "netto";

-- ── 5. NOT NULL tightenings. Idempotent: PG accepts SET NOT NULL on a column
--       that is already NOT NULL. ─────────────────────────────────────────────
ALTER TABLE "inbound_items"   ALTER COLUMN "qtyGood"  SET NOT NULL;
ALTER TABLE "inbound_items"   ALTER COLUMN "qtyReject" SET NOT NULL;
ALTER TABLE "inbound_items"   ALTER COLUMN "qtyFree"  SET NOT NULL;
ALTER TABLE "purchase_returns" ALTER COLUMN "debitNoteAmount" SET NOT NULL;
ALTER TABLE "sales_orders"    ALTER COLUMN "deliveryGateStatus" SET NOT NULL;
ALTER TABLE "sales_orders"    ALTER COLUMN "isAmendmentHeld" SET NOT NULL;

-- ── 6. Enum columns the schema declares as TEXT. Must happen BEFORE anything
--       inserts into them: an ENUM-typed column rejects arbitrary strings, so
--       the P12/P13 flows fail with `invalid input value for enum` while the
--       column stays enum-typed. ─────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('purchase_requests', 'requestNumber'),
      ('purchase_requests', 'budgetCode'),
      ('purchase_requests', 'urgency'),
      ('purchase_returns',  'debitNoteNumber')
    ) AS t(tbl, col)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = r.tbl
        AND c.column_name = r.col
        AND c.data_type <> 'text'
    ) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DATA TYPE TEXT', r.tbl, r.col);
      RAISE NOTICE 'reconcile: %.% converted to TEXT', r.tbl, r.col;
    END IF;
  END LOOP;
END $$;

-- ── 7. Tables the history never created ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "candidates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cvUrl" TEXT,
    "cvReviewScore" DOUBLE PRECISION,
    "cvReviewNotes" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'SCREENING',
    "status" TEXT NOT NULL DEFAULT 'IN_PROCESS',
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "employee_trainings" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "trainingType" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "goal" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_trainings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "employee_loans" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "monthlyDeduction" DECIMAL(15,2) NOT NULL,
    "remainingBalance" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_loans_pkey" PRIMARY KEY ("id")
);

-- ── 8. Foreign keys. `ADD CONSTRAINT` has no IF NOT EXISTS, so each is guarded
--       by a catalog preflight inside a DO block. ─────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('employee_trainings', 'employee_trainings_employeeId_fkey', 'employeeId', 'employees', 'id', 'CASCADE'),
      ('employee_loans',     'employee_loans_employeeId_fkey',     'employeeId', 'employees', 'id', 'CASCADE'),
      ('purchase_orders',    'purchase_orders_prId_fkey',          'prId',       'purchase_requests', 'id', 'SET NULL')
    ) AS t(tbl, con, col, ref_tbl, ref_col, on_delete)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = r.con
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE %s ON UPDATE CASCADE',
        r.tbl, r.con, r.col, r.ref_tbl, r.ref_col, r.on_delete
      );
      RAISE NOTICE 'reconcile: added constraint %', r.con;
    END IF;
  END LOOP;
END $$;

-- ── 9. Index renames: camelCase is field-mapped, so the schema's generated
--       index name differs from the one the history created. ─────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('ap_payments_org_idx',                  'ap_payments_organizationId_idx'),
      ('bills_org_idx',                        'bills_organizationId_idx'),
      ('down_payments_org_idx',                'down_payments_organizationId_idx'),
      ('purchase_orders_org_idx',              'purchase_orders_organizationId_idx'),
      ('purchase_orders_pr_idx',               'purchase_orders_prId_idx'),
      ('purchase_requests_org_idx',            'purchase_requests_organizationId_idx'),
      ('purchase_requests_request_number_key', 'purchase_requests_requestNumber_key'),
      ('purchase_returns_org_idx',             'purchase_returns_organizationId_idx')
    ) AS t(old_name, new_name)
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = r.old_name AND relkind = 'i')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = r.new_name AND relkind = 'i')
    THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I', r.old_name, r.new_name);
      RAISE NOTICE 'reconcile: renamed index % -> %', r.old_name, r.new_name;
    END IF;
  END LOOP;
END $$;