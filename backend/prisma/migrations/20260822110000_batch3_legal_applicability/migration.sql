-- ─────────────────────────────────────────────────────────────────
-- BATCH 3 (correction) — explicit legal applicability + idempotency
-- ─────────────────────────────────────────────────────────────────
-- Adds:
--   1. enum legal_applicability (UNKNOWN | REQUIRED | NOT_APPLICABLE)
--   2. sample_requests.legalApplicability LegalApplicability NOT NULL DEFAULT UNKNOWN
--   3. sample_requests.legalType RegType NULL
--   4. regulatory_pipelines.legalPicId NULL  (was NOT NULL — auto-intake
--      was incorrectly assigning the R&D actor as Legalitas owner)
--   5. sales_orders.idempotencyKey TEXT NULL — explicit client-side
--      token for retry-safe creates (legitimate repeat orders remain possible)
--
-- Purely additive. Protected erp_db is NOT touched.
-- ─────────────────────────────────────────────────────────────────

-- 1. Enum (idempotent via DO block)
DO $$ BEGIN
  CREATE TYPE "LegalApplicability" AS ENUM ('UNKNOWN', 'REQUIRED', 'NOT_APPLICABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. sample_requests applicability columns
ALTER TABLE "sample_requests"
  ADD COLUMN IF NOT EXISTS "legalApplicability" "LegalApplicability" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "legalType" "RegType";

-- 3. regulatory_pipelines.legalPicId becomes NULLABLE
ALTER TABLE "regulatory_pipelines"
  ALTER COLUMN "legalPicId" DROP NOT NULL;

-- 4. sales_orders.idempotencyKey
ALTER TABLE "sales_orders"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- 5. Unique partial index — a single retry token must map to one SO.
--    Legitimate repeats omit the key (NULL), so the index does not block them.
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orders_idempotency_key_unique"
  ON "sales_orders"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
