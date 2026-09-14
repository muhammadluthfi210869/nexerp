-- ─────────────────────────────────────────────────────────────────
-- Marketing + Batch 3 forward-compatible schema repair
--
-- The dev DB was restored from an old snapshot that pre-dates several
-- canonical tables referenced by Batch 3+ migrations and by the
-- Marketing attribution read model. This migration is idempotent and
-- creates the minimum required tables so that:
--
--   (1) prisma migrate deploy can complete the pending Batch 3 chain
--       (so_formula_pinning, legal_applicability, regulatory_pipeline_unique)
--       by providing empty placeholders for sales_orders, formulas,
--       sample_requests, regulatory_pipelines.
--   (2) /lead-capture/tracked and the website bridge can write/read the
--       LeadAttribute + RoundRobinAgent + landing-page tables.
--
-- This is a forward-compatible REPAIR — no destructive operations, no
-- rewriting of existing rows, no business logic changes.
-- ─────────────────────────────────────────────────────────────────

-- ── 1. Ensure LegalApplicability enum exists (Batch 3 needs it) ──
DO $$ BEGIN
  CREATE TYPE "LegalApplicability" AS ENUM ('UNKNOWN', 'REQUIRED', 'NOT_APPLICABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Marketing attribution tables (canonical from marketing.prisma) ──

CREATE TABLE IF NOT EXISTS "lead_attributes" (
  "id"         UUID PRIMARY KEY,
  "leadId"     UUID NOT NULL,
  "key"        VARCHAR(50) NOT NULL,
  "value"      VARCHAR(255),
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "source"     TEXT,
  "confirmed"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_attributes_leadId_key_key" UNIQUE ("leadId", "key")
);
CREATE INDEX IF NOT EXISTS "lead_attributes_leadId_idx" ON "lead_attributes"("leadId");

CREATE TABLE IF NOT EXISTS "round_robin_agents" (
  "id"          UUID PRIMARY KEY,
  "name"        VARCHAR(100) NOT NULL,
  "phoneNumber" VARCHAR(20) NOT NULL,
  "orderIndex"  INTEGER NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "totalLeads"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "round_robin_state" (
  "id"           VARCHAR(20) PRIMARY KEY DEFAULT 'singleton',
  "currentIndex" INTEGER NOT NULL DEFAULT 0,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. Landing page visit + conversion (canonical from website.prisma) ──

CREATE TABLE IF NOT EXISTS "landing_page_visits" (
  "id"          UUID PRIMARY KEY,
  "pageUrl"     TEXT NOT NULL,
  "pageTitle"   VARCHAR(255),
  "referrer"    TEXT,
  "utmSource"   VARCHAR(100),
  "utmMedium"   VARCHAR(100),
  "utmCampaign" VARCHAR(100),
  "utmContent"  VARCHAR(100),
  "utmTerm"     VARCHAR(100),
  "visitorId"   VARCHAR(100),
  "ipAddress"   VARCHAR(45),
  "userAgent"   TEXT,
  "timestamp"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "landing_page_visits_timestamp_idx" ON "landing_page_visits"("timestamp");

CREATE TABLE IF NOT EXISTS "landing_page_conversions" (
  "id"            UUID PRIMARY KEY,
  "visitId"       UUID,
  "pageUrl"       TEXT NOT NULL,
  "pageTitle"     VARCHAR(255),
  "source"        VARCHAR(50) NOT NULL DEFAULT 'DIRECT_FORM',
  "nama"          VARCHAR(255),
  "perusahaan"    VARCHAR(255),
  "hp"            VARCHAR(20),
  "produk"        VARCHAR(255),
  "trafficSource" VARCHAR(50),
  "utmSource"     VARCHAR(100),
  "utmMedium"     VARCHAR(100),
  "utmCampaign"   VARCHAR(100),
  "assignedTo"    VARCHAR(100),
  "assignedPhone" VARCHAR(20),
  "status"        VARCHAR(50) NOT NULL DEFAULT 'NEW',
  "timestamp"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. Batch 3 placeholder tables (minimum for ADD COLUMN IF NOT EXISTS) ──
-- These tables are referenced by Batch 3 migrations but the canonical
-- domain logic lives in unrelated modules (BussDev, RnD, Legal). We
-- create the empty shell so the Batch 3 cascade can complete; the
-- canonical columns are added by their respective migrations.

CREATE TABLE IF NOT EXISTS "formulas" (
  "id"              UUID PRIMARY KEY,
  "formulaCode"     VARCHAR(50) NOT NULL UNIQUE,
  "sampleRequestId" UUID,
  "version"         INTEGER NOT NULL DEFAULT 1,
  "targetYieldGram" DECIMAL(15, 3) NOT NULL DEFAULT 1000.000,
  "status"          "FormulaStatus" NOT NULL DEFAULT 'DRAFT',
  "lockedById"      UUID,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sample_requests" (
  "id"                 UUID PRIMARY KEY,
  "sampleCode"         VARCHAR(50) NOT NULL UNIQUE,
  "leadId"             UUID,
  "productName"        VARCHAR(255),
  "targetFunction"     VARCHAR(255),
  "textureReq"         VARCHAR(255),
  "colorReq"           VARCHAR(255),
  "aromaReq"           VARCHAR(255),
  "version"            INTEGER NOT NULL DEFAULT 1,
  "stage"              "SampleStage" NOT NULL DEFAULT 'QUEUE',
  "picId"              UUID,
  "requestedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "regulatory_pipelines" (
  "id"              UUID PRIMARY KEY,
  "leadId"          UUID,
  "sampleRequestId" UUID,
  "type"            "RegType",
  "currentStage"    "RegStage" NOT NULL DEFAULT 'DRAFT',
  "pnbpStatus"      BOOLEAN NOT NULL DEFAULT false,
  "registrationNo"  VARCHAR(100),
  "expiryDate"      TIMESTAMP(3),
  "daysInStage"     INTEGER NOT NULL DEFAULT 0,
  "logHistory"      JSONB NOT NULL DEFAULT '[]',
  "legalPicId"      UUID,
  "materialItemId"  UUID,
  "formulaId"       UUID,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sales_orders" (
  "id"              UUID PRIMARY KEY,
  "orderNumber"     VARCHAR(50) NOT NULL UNIQUE,
  "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate"         TIMESTAMP(3),
  "leadId"          UUID,
  "sampleId"        UUID,
  "formulaId"       UUID,
  "idempotencyKey"  TEXT,
  "totalAmount"     DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "quantity"        INTEGER NOT NULL DEFAULT 1,
  "status"          "SOStatus" NOT NULL DEFAULT 'PENDING_DP',
  "committedAt"     TIMESTAMP(3),
  "version"         INTEGER NOT NULL DEFAULT 1,
  "salesCategory"   VARCHAR(100),
  "brandName"       VARCHAR(255),
  "taxId"           UUID,
  "currencyId"      UUID,
  "netto"           DECIMAL(10, 2),
  "deletedAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stockStatus"     "StockStatus" NOT NULL DEFAULT 'PENDING_CHECK'
);