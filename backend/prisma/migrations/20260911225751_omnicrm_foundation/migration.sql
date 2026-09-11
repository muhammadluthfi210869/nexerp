-- OmniCRM MVP foundation — Phase 2 deliverable.
-- See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md
-- Idempotent + expand-only.

-- 1. crm_leads (the kanban inbox entry)
CREATE TABLE IF NOT EXISTS "crm_leads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "leadCaptureId" UUID NOT NULL,
  "trackingCode" VARCHAR(50),
  "stage" "CrmStage" NOT NULL DEFAULT 'LEADS_MASUK',
  "displayName" VARCHAR(120),
  "phone" VARCHAR(30) NOT NULL,
  "source" "LeadSource" NOT NULL,
  "pageUrl" TEXT,
  "pageTitle" VARCHAR(255),
  "referrer" TEXT,
  "intent" VARCHAR(50),
  "deviceType" VARCHAR(30),
  "browser" VARCHAR(50),
  "assignedToId" UUID,
  "firstInboundAt" TIMESTAMP(3),
  "firstOutboundAt" TIMESTAMP(3),
  "firstResponseAt" TIMESTAMP(3),
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "replyRate" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "wonAt" TIMESTAMP(3),
  "lostAt" TIMESTAMP(3),
  "lostReason" VARCHAR(255),
  CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_leads_leadCaptureId_key" ON "crm_leads"("leadCaptureId");
CREATE UNIQUE INDEX IF NOT EXISTS "crm_leads_trackingCode_key" ON "crm_leads"("trackingCode");
CREATE INDEX IF NOT EXISTS "crm_leads_stage_createdAt_idx" ON "crm_leads"("stage", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_leads_assignedToId_stage_idx" ON "crm_leads"("assignedToId", "stage");
CREATE INDEX IF NOT EXISTS "crm_leads_createdAt_idx" ON "crm_leads"("createdAt");
CREATE INDEX IF NOT EXISTS "crm_leads_source_idx" ON "crm_leads"("source");

-- 2. guestbook_events (buku tamu approval log)
CREATE TABLE IF NOT EXISTS "guestbook_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "crmLeadId" UUID NOT NULL,
  "approvalStatus" "GuestbookApproval" NOT NULL DEFAULT 'PENDING',
  "approverId" UUID,
  "approvedAt" TIMESTAMP(3),
  "approverNote" VARCHAR(500),
  "pageUrl" TEXT NOT NULL,
  "pageTitle" VARCHAR(255),
  "referrer" TEXT,
  "intent" VARCHAR(50),
  "source" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guestbook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guestbook_events_crmLeadId_key" ON "guestbook_events"("crmLeadId");
CREATE INDEX IF NOT EXISTS "guestbook_events_approvalStatus_createdAt_idx" ON "guestbook_events"("approvalStatus", "createdAt");

-- 3. lead_audits (append-only state-transition log)
CREATE TABLE IF NOT EXISTS "lead_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "crmLeadId" UUID NOT NULL,
  "actorId" UUID,
  "action" VARCHAR(50) NOT NULL,
  "fromStage" VARCHAR(30),
  "toStage" VARCHAR(30),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_audits_crmLeadId_createdAt_idx" ON "lead_audits"("crmLeadId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_audits_action_createdAt_idx" ON "lead_audits"("action", "createdAt");
