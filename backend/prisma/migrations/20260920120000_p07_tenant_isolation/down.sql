ALTER TABLE "sales_leads" DROP CONSTRAINT IF EXISTS "sales_leads_leadCaptureId_fkey";
DROP INDEX IF EXISTS "sales_leads_leadCaptureId_key";
ALTER TABLE "sales_leads" DROP COLUMN IF EXISTS "leadCaptureId";

DROP INDEX IF EXISTS "guest_logs_organizationId_idx";
DROP INDEX IF EXISTS "bussdev_staffs_organizationId_idx";
DROP INDEX IF EXISTS "lead_captures_organizationId_idx";
DROP INDEX IF EXISTS "sales_leads_organizationId_idx";

ALTER TABLE "guest_logs" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "bussdev_staffs" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "lead_captures" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "sales_leads" DROP COLUMN IF EXISTS "organizationId";
