-- Batch 5: receipt identity, immutable posting links, and reservation cache.
-- Safe additive migration; no historical rows are rewritten.
ALTER TABLE "warehouse_inbounds" ADD COLUMN IF NOT EXISTS "supplierReference" TEXT;
ALTER TABLE "warehouse_inbounds" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "warehouse_inbounds" ADD COLUMN IF NOT EXISTS "reversedAt" TIMESTAMP(3);
ALTER TABLE "warehouse_inbounds" ADD COLUMN IF NOT EXISTS "reversalReason" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_inbounds_idempotencyKey_key"
  ON "warehouse_inbounds"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;

ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "lotNumber" TEXT;
ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "expDate" TIMESTAMP(3);
ALTER TABLE "inbound_items" ADD COLUMN IF NOT EXISTS "inventoryId" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "inbound_items_inventoryId_key"
  ON "inbound_items"("inventoryId") WHERE "inventoryId" IS NOT NULL;

ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "commandKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_transactions_commandKey_key"
  ON "inventory_transactions"("commandKey") WHERE "commandKey" IS NOT NULL;

ALTER TABLE "material_inventories" ADD COLUMN IF NOT EXISTS "reservedQty" DECIMAL(15,2) NOT NULL DEFAULT 0;
