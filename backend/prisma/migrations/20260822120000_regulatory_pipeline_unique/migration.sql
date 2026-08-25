-- ─────────────────────────────────────────────────────────────────
-- BATCH 3 (corrected) — DB-level idempotency for RegulatoryPipeline
-- ─────────────────────────────────────────────────────────────────
-- Ensures one pipeline per (leadId, sampleRequestId, type) even under
-- concurrent listener retries. Without this constraint two simultaneous
-- intake calls both see "no existing pipeline" and both create rows.
--
-- Purely additive — backfills existing duplicates first.
-- Protected erp_db is NOT touched.
-- ─────────────────────────────────────────────────────────────────

-- 1. Backfill: delete all but the earliest pipeline per tuple.
--    Safe because previous tests have already cleaned their own data.
DELETE FROM "regulatory_pipelines" rp
WHERE rp.id NOT IN (
  SELECT DISTINCT ON ("leadId", "sampleRequestId", "type") id
  FROM "regulatory_pipelines"
  WHERE "sampleRequestId" IS NOT NULL
  ORDER BY "leadId", "sampleRequestId", "type", "createdAt" ASC
)
AND "sampleRequestId" IS NOT NULL;

-- 2. Unique constraint
DO $$ BEGIN
  ALTER TABLE "regulatory_pipelines"
    ADD CONSTRAINT "regulatory_pipelines_lead_sample_type_key"
    UNIQUE ("leadId", "sampleRequestId", "type");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
