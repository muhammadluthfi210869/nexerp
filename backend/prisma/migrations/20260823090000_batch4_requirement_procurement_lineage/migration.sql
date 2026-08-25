-- Batch 4: immutable committed-SO requirement basis and PR/PO lineage.
ALTER TABLE "goods_requirements"
  ADD COLUMN "salesOrderVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "formulaId" UUID,
  ADD COLUMN "formulaVersion" INTEGER NOT NULL DEFAULT 1;

-- Legacy manual requirements have no reconstructable Formula basis. They are
-- preserved (formulaId remains NULL) but cannot satisfy the new contract.
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "salesOrderId" ORDER BY "createdAt", "id") AS revision
  FROM "goods_requirements"
)
UPDATE "goods_requirements" gr SET "salesOrderVersion" = ranked.revision FROM ranked WHERE gr."id" = ranked."id";
CREATE UNIQUE INDEX "goods_requirements_salesOrderId_salesOrderVersion_key"
  ON "goods_requirements"("salesOrderId", "salesOrderVersion");
CREATE INDEX "goods_requirements_salesOrderId_salesOrderVersion_idx"
  ON "goods_requirements"("salesOrderId", "salesOrderVersion");

ALTER TABLE "goods_requirement_items"
  ADD COLUMN "uom" TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "dosagePercentage" DECIMAL(10,5);

ALTER TABLE "purchase_requests"
  ADD COLUMN "requirementId" UUID,
  ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "purchase_request_items" ADD COLUMN "requirementItemId" UUID;
ALTER TABLE "purchase_orders" ADD COLUMN "requestId" UUID;

ALTER TABLE "purchase_requests"
  ADD CONSTRAINT "purchase_requests_requirementId_fkey"
  FOREIGN KEY ("requirementId") REFERENCES "goods_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_request_items"
  ADD CONSTRAINT "purchase_request_items_requirementItemId_fkey"
  FOREIGN KEY ("requirementItemId") REFERENCES "goods_requirement_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "purchase_requests_requirementId_idempotencyKey_key"
  ON "purchase_requests"("requirementId", "idempotencyKey");
CREATE INDEX "purchase_requests_requirementId_idx" ON "purchase_requests"("requirementId");
CREATE UNIQUE INDEX "purchase_orders_requestId_key" ON "purchase_orders"("requestId");
