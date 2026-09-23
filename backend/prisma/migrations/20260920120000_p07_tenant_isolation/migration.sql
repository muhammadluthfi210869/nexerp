-- P07 tenant isolation: expand organizationId column on P07-owned records.
-- Safe expand only. Legacy null rows remain inaccessible to tenant-scoped reads.

ALTER TABLE "sales_leads" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "lead_captures" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "bussdev_staffs" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "guest_logs" ADD COLUMN IF NOT EXISTS "organizationId" UUID;

CREATE INDEX IF NOT EXISTS "sales_leads_organizationId_idx" ON "sales_leads" ("organizationId");
CREATE INDEX IF NOT EXISTS "lead_captures_organizationId_idx" ON "lead_captures" ("organizationId");
CREATE INDEX IF NOT EXISTS "bussdev_staffs_organizationId_idx" ON "bussdev_staffs" ("organizationId");
CREATE INDEX IF NOT EXISTS "guest_logs_organizationId_idx" ON "guest_logs" ("organizationId");

-- P07 canonical capture-to-commercial linkage. Safe expand only: nullable,
-- unique, and legacy rows keep `leadCaptureId = NULL` (no guessing).
ALTER TABLE "sales_leads" ADD COLUMN IF NOT EXISTS "leadCaptureId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "sales_leads_leadCaptureId_key" ON "sales_leads" ("leadCaptureId");

ALTER TABLE "sales_leads" DROP CONSTRAINT IF EXISTS "sales_leads_leadCaptureId_fkey";
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_leadCaptureId_fkey"
  FOREIGN KEY ("leadCaptureId") REFERENCES "lead_captures"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
