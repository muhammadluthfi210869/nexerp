-- ─────────────────────────────────────────────────────────────────
-- Lead attribution journey (Website → Round Robin → WhatsApp)
--
-- This dev DB has been restored from an old snapshot that pre-dates the
-- LeadCapture table. We:
--   1. Create the LeadCapture table if it does not exist (idempotent),
--      using the canonical schema shape from prisma/schema/marketing.prisma.
--   2. Add the journey fields + indices required to answer:
--        - Lead ini datang dari page mana?
--        - Thank-you page mana?
--        - CTA apa yang diklik?
--        - Dialokasikan ke Sales siapa (stable identity)?
--        - Tracking code-nya apa?
--        - Apakah user benar-benar klik WhatsApp (vs auto-redirect batal)?
--
-- whatsappPhone / whatsappVerifiedAt / verificationStatus remain NULL
-- until the Self QR pipeline (Batch 4) matches an inbound WhatsApp chat
-- to [Kode: <trackingCode>]. They MUST NOT be inferred from browser /
-- IP / device.
-- ─────────────────────────────────────────────────────────────────

-- ── 1. Ensure enums exist (used by LeadCapture) ─────────────────────
DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM (
    'PENDING', 'WA_CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LeadSource" AS ENUM (
    'INSTAGRAM','TIKTOK','LINKTREE','GOOGLE','OFFLINE','WEBSITE','DIRECT','REFERRAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM (
    'NEW_LEAD','CONTACTED','FOLLOW_UP_1','FOLLOW_UP_2','FOLLOW_UP_3',
    'NEGOTIATION','SAMPLE_REQUESTED','SAMPLE_SENT','SAMPLE_APPROVED',
    'SPK_SIGNED','WAITING_FINANCE_APPROVAL','DP_PAID','PRODUCTION_PLAN',
    'READY_TO_SHIP','WON_DEAL','LOST','ABORTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LostReason" AS ENUM (
    'NO_RESPONSE','BUDGET_MISMATCH','TIMING_MISMATCH','COMPETITOR_CHOSEN',
    'NOT_INTERESTED','INVALID_CONTACT','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Ensure LeadCapture table exists ──────────────────────────────
CREATE TABLE IF NOT EXISTS "lead_captures" (
  "id"                  UUID PRIMARY KEY,
  "trackingCode"        VARCHAR(20) NOT NULL UNIQUE,

  -- Website tracking
  "sessionId"           VARCHAR(100),
  "intent"              TEXT,
  "pageUrl"             TEXT,
  "pageTitle"           VARCHAR(255),
  "referrer"            TEXT,
  "utmSource"           VARCHAR(100),
  "utmMedium"           VARCHAR(100),
  "utmCampaign"         VARCHAR(100),
  "utmContent"          VARCHAR(100),
  "utmTerm"             VARCHAR(100),
  "deviceType"          VARCHAR(50),
  "browser"             VARCHAR(100),
  "ipAddress"           VARCHAR(45),
  "city"                VARCHAR(100),
  "country"             VARCHAR(100),

  -- WhatsApp data (captured when user messages)
  "phone"               VARCHAR(20),
  "waName"              VARCHAR(255),
  "waMessage"           TEXT,
  "contactedAt"         TIMESTAMP(3),

  -- CRM fields
  "fullName"            VARCHAR(255),
  "company"             VARCHAR(255),
  "email"               VARCHAR(255),
  "notes"               TEXT,

  -- AI extraction
  "aiExtractedAt"       TIMESTAMP(3),
  "aiStatus"            VARCHAR(20),
  "aiStage"             JSONB,

  -- Status / source
  "status"              "LeadStatus" NOT NULL DEFAULT 'PENDING',
  "source"              "LeadSource",

  -- Round Robin (legacy)
  "assignedTo"          UUID,
  "assignedName"        VARCHAR(100),
  "assignedPhone"       VARCHAR(20),

  -- ── Lead Attribution Journey (Batch 4) ──
  "sourcePage"          VARCHAR(500),
  "ctaType"             VARCHAR(50),
  "ctaClickedAt"        TIMESTAMP(3),
  "thankYouPage"        VARCHAR(500),
  "thankYouViewedAt"    TIMESTAMP(3),
  "whatsappClickedAt"   TIMESTAMP(3),
  "whatsappVerifiedAt"  TIMESTAMP(3),
  "verificationStatus"  VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
  -- Round-robin stable identity (cs1/cs2/cs3/irma) + assignment time
  "assignedSalesId"     VARCHAR(50),
  "assignedAt"          TIMESTAMP(3),

  -- Sales pipeline
  "workflowStatus"      "WorkflowStatus" NOT NULL DEFAULT 'NEW_LEAD',
  "lostReason"          "LostReason",
  "lostAt"              TIMESTAMP(3),
  "wonAt"               TIMESTAMP(3),

  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. Add journey columns if an older lead_captures exists without them ──
ALTER TABLE "lead_captures"
  ADD COLUMN IF NOT EXISTS "sourcePage"          VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "ctaType"             VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "ctaClickedAt"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "thankYouPage"        VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "thankYouViewedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "whatsappClickedAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "whatsappVerifiedAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verificationStatus"  VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "assignedSalesId"     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "assignedAt"          TIMESTAMP(3);

-- ── 4. Indices ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "lead_captures_verificationStatus_idx" ON "lead_captures"("verificationStatus");
CREATE INDEX IF NOT EXISTS "lead_captures_assignedSalesId_idx"    ON "lead_captures"("assignedSalesId");
CREATE INDEX IF NOT EXISTS "lead_captures_sourcePage_idx"         ON "lead_captures"("sourcePage");
