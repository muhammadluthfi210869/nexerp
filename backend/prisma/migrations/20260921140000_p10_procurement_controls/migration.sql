-- P10: Procurement controls, MRP shortage, multi-tier approval, 3-pillar inbound, 4-leg matching, and AP reconciliation
-- BUS-RULE-016 to BUS-RULE-027

-- 1. Enums additions
ALTER TYPE "PRStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "PRStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';

ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- 2. Purchase Requests enhancements
ALTER TABLE "purchase_requests" ADD COLUMN IF NOT EXISTS "requestNumber" VARCHAR(100);
ALTER TABLE "purchase_requests" ADD COLUMN IF NOT EXISTS "budgetCode" VARCHAR(100);
ALTER TABLE "purchase_requests" ADD COLUMN IF NOT EXISTS "urgency" VARCHAR(50) DEFAULT 'NORMAL';
ALTER TABLE "purchase_requests" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_requests_request_number_key" ON "purchase_requests" ("requestNumber");
CREATE INDEX IF NOT EXISTS "purchase_requests_org_idx" ON "purchase_requests" ("organizationId");

-- 3. Purchase Orders enhancements
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "prId" UUID;
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "priceOverrideReason" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
CREATE INDEX IF NOT EXISTS "purchase_orders_pr_idx" ON "purchase_orders" ("prId");
CREATE INDEX IF NOT EXISTS "purchase_orders_org_idx" ON "purchase_orders" ("organizationId");

-- 4. Inbound Items 3-Pillar quantities (qtyGood, qtyReject, qtyFree)
ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "qtyGood" DECIMAL(15, 3) DEFAULT 0;
ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "qtyReject" DECIMAL(15, 3) DEFAULT 0;
ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "qtyFree" DECIMAL(15, 3) DEFAULT 0;

-- 5. Bills (Vendor Invoices) & AP enhancements
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "grId" UUID;
ALTER TABLE "down_payments" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "ap_payments" ADD COLUMN IF NOT EXISTS "organizationId" UUID;

CREATE INDEX IF NOT EXISTS "bills_org_idx" ON "bills" ("organizationId");
CREATE INDEX IF NOT EXISTS "down_payments_org_idx" ON "down_payments" ("organizationId");
CREATE INDEX IF NOT EXISTS "ap_payments_org_idx" ON "ap_payments" ("organizationId");

-- 6. Purchase Returns & Debit Notes
ALTER TABLE "purchase_returns" ADD COLUMN IF NOT EXISTS "debitNoteNumber" VARCHAR(100);
ALTER TABLE "purchase_returns" ADD COLUMN IF NOT EXISTS "debitNoteAmount" DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE "purchase_returns" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
CREATE INDEX IF NOT EXISTS "purchase_returns_org_idx" ON "purchase_returns" ("organizationId");
