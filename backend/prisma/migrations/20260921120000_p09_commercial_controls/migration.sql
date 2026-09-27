-- P09: Commercial controls, sales order amendment review, and delivery gatekeeper
-- BUS-RULE-002, BUS-RULE-006, BUS-RULE-014

ALTER TYPE "SOStatus" ADD VALUE IF NOT EXISTS 'AMENDMENT_REVIEW';
ALTER TYPE "SOStatus" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
ALTER TYPE "SOStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';

ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "deliveryGateStatus" VARCHAR(20) DEFAULT 'HELD';
ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "amendmentReason" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "isAmendmentHeld" BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS "sales_orders_org_idx" ON "sales_orders" ("organizationId");
