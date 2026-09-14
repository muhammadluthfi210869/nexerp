-- OmniCRM live projection hardening. Expand-first and safe for the current
-- production state where crm_leads is empty.
ALTER TABLE "crm_leads"
  ALTER COLUMN "phone" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "sourceRaw" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "sourceChannel" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "assignedAgentId" UUID,
  ADD COLUMN IF NOT EXISTS "assignedAgentName" VARCHAR(120);

ALTER TABLE "round_robin_agents"
  ADD COLUMN IF NOT EXISTS "userId" UUID,
  ADD COLUMN IF NOT EXISTS "externalKey" VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS "round_robin_agents_userId_key"
  ON "round_robin_agents"("userId") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "round_robin_agents_externalKey_key"
  ON "round_robin_agents"("externalKey") WHERE "externalKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "crm_leads_assignedAgentId_createdAt_idx"
  ON "crm_leads"("assignedAgentId", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_leads_sourceChannel_createdAt_idx"
  ON "crm_leads"("sourceChannel", "createdAt");
