-- Batch 5: make the existing material requisition's send/return actions
-- explicit, retry-safe inventory events. This is additive and safe on test DB.
ALTER TABLE "material_requisition_headers"
  ADD COLUMN IF NOT EXISTS "issueCommandKey" TEXT,
  ADD COLUMN IF NOT EXISTS "returnCommandKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "material_requisition_headers_issueCommandKey_key"
  ON "material_requisition_headers"("issueCommandKey")
  WHERE "issueCommandKey" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "material_requisition_headers_returnCommandKey_key"
  ON "material_requisition_headers"("returnCommandKey")
  WHERE "returnCommandKey" IS NOT NULL;

ALTER TABLE "material_requisition_items"
  ADD COLUMN IF NOT EXISTS "qtyIssued" DECIMAL(15,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qtyReturned" DECIMAL(15,3) NOT NULL DEFAULT 0;
