-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: replace unused legacy LeadStatus enum with the
-- canonical value set before lead_attribution_journey applies.
--
-- Why this exists
--   phase1 (20260430122705) declared LeadStatus with legacy values:
--     'NEW','CONTACTED','SAMPLE','NEGO','DEAL','LOST'
--   lead_attribution_journey (20260822081953) declared LeadStatus with
--   canonical values:
--     'PENDING','WA_CONTACTED','QUALIFIED','DISQUALIFIED','CONVERTED'
--   inside an idempotent DO $$ BEGIN ... EXCEPTION WHEN duplicate_object
--   block. On a DB where phase1 already ran, that block is a no-op, so
--   the legacy enum stays. The downstream CREATE TABLE lead_captures
--   then fails on DEFAULT 'PENDING' because 'PENDING' is not in the
--   legacy enum.
--
-- Why this is safe (data-preserving)
--   Read-only analysis (see r4-final-go-live-evidence/01-release-artifact
--   /DATA-ANALYSIS.md) shows zero columns in the protected DB reference
--   the legacy LeadStatus enum. The enum was declared by phase1 but
--   never used. Therefore dropping and recreating it cannot lose data.
--   If a future deployment has populated this enum, this migration
--   will fail loudly with a constraint-violation error and the
--   operator is expected to apply a value-mapping migration first.
--
-- Why a NEW migration instead of editing phase1 / lead_attribution_journey
--   R4 §7 forbids rewriting applied migration history. phase1 is in the
--   ledger as finished=true. lead_attribution_journey is in the ledger
--   as finished=false (failed) but its file is referenced from
--   deployment tooling. The clean way is a pre-flight migration that
--   Prisma applies BEFORE the failing migration, with a timestamp that
--   places it earlier in the chain.
--
-- What this migration does
--   DROP the unused legacy LeadStatus enum, then CREATE LeadStatus with
--   the canonical values. After this migration runs, the DO block in
--   lead_attribution_journey becomes a no-op (enum already exists) and
--   CREATE TABLE lead_captures with DEFAULT 'PENDING' succeeds.
-- ─────────────────────────────────────────────────────────────────

-- P1 SCHEMA RECONCILIATION 2026-09-01 — guarded so the existing-install upgrade path works.
--
-- The unconditional DROP TYPE below assumed the enum is unused. That holds on a fresh
-- chain, but NOT on an existing install: erp_db_test has lead_captures.status typed
-- "LeadStatus", so the drop failed with
--     2BP01  cannot drop type "LeadStatus" because other objects depend on it
-- and every existing deployment could not be upgraded.
--
-- Verified truth: that existing install's LeadStatus ALREADY carries exactly the canonical
-- five values, so there was nothing for this migration to change there -- it failed while
-- doing no useful work. The guard below therefore skips the replacement when the enum is
-- already canonical (existing installs) and performs it only when the legacy value set is
-- still present (fresh chain, where nothing depends on the type yet).
--
-- If some other deployment ever has the legacy values AND a dependent column, DROP still
-- fails loudly -- which is the behaviour this migration's original note (above) explicitly
-- intended, so an operator can apply a value-mapping migration first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'LeadStatus' AND e.enumlabel = 'PENDING'
  ) THEN
    RAISE NOTICE 'LeadStatus is already canonical; leaving it and its dependents untouched.';
  ELSE
    DROP TYPE IF EXISTS "LeadStatus";
    CREATE TYPE "LeadStatus" AS ENUM (
      'PENDING',
      'WA_CONTACTED',
      'QUALIFIED',
      'DISQUALIFIED',
      'CONVERTED'
    );
  END IF;
END $$;
