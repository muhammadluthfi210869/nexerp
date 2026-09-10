-- ─────────────────────────────────────────────────────────────────
-- BATCH 3 — Sales Order formula/version pinning + change-control
-- ─────────────────────────────────────────────────────────────────
-- Adds:
--   1. sales_orders.formulaId        — pin exact R&D Formula version (INV-09/INV-10).
--   2. sales_orders.committedAt      — commit boundary marker (pre/post).
--   3. sales_orders.version          — current effective revision counter.
--   4. sales_order_amendments        — post-commit change history. Pre-commit
--                                     edits never write here. Preserves old truth.
--
-- Idempotent / safe-additive only. Backfill existing rows with sane defaults.
-- Protected erp_db is NOT touched — only disposable test DBs run this.
-- ─────────────────────────────────────────────────────────────────

-- 1. SO columns
ALTER TABLE "sales_orders"
  ADD COLUMN IF NOT EXISTS "formulaId" UUID,
  ADD COLUMN IF NOT EXISTS "committedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- 2. New table for post-commit amendments
CREATE TABLE IF NOT EXISTS "sales_order_amendments" (
    "id" UUID NOT NULL,
    "salesOrderId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "previousQuantity" INTEGER,
    "previousTotalAmount" DECIMAL(15,2),
    "previousFormulaId" UUID,
    "newQuantity" INTEGER,
    "newTotalAmount" DECIMAL(15,2),
    "newFormulaId" UUID,
    "reason" TEXT,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_amendments_pkey" PRIMARY KEY ("id")
);

-- 3. Indices
CREATE INDEX IF NOT EXISTS "sales_order_amendments_salesOrderId_idx"
  ON "sales_order_amendments"("salesOrderId");

CREATE UNIQUE INDEX IF NOT EXISTS "sales_order_amendments_salesOrderId_version_key"
  ON "sales_order_amendments"("salesOrderId", "version");

-- 4. Foreign keys
DO $$ BEGIN
  ALTER TABLE "sales_orders"
    ADD CONSTRAINT "sales_orders_formulaId_fkey"
    FOREIGN KEY ("formulaId") REFERENCES "formulas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "sales_order_amendments"
    ADD CONSTRAINT "sales_order_amendments_salesOrderId_fkey"
    FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "sales_order_amendments"
    ADD CONSTRAINT "sales_order_amendments_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
