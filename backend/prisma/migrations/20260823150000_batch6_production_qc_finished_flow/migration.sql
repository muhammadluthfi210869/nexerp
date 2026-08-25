-- Batch 6: pin production formula versions and persist operational truth.
ALTER TABLE "production_plans"
  ADD COLUMN IF NOT EXISTS "formulaVersionSnapshot" INTEGER;

ALTER TABLE "production_logs"
  ADD COLUMN IF NOT EXISTS "executionCommandKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "production_logs_executionCommandKey_key"
  ON "production_logs"("executionCommandKey") WHERE "executionCommandKey" IS NOT NULL;

ALTER TABLE "finished_goods"
  ADD COLUMN IF NOT EXISTS "lotNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "formulaId" UUID,
  ADD COLUMN IF NOT EXISTS "formulaVersionSnapshot" INTEGER,
  ADD COLUMN IF NOT EXISTS "qcStatus" TEXT NOT NULL DEFAULT 'HOLD',
  ADD COLUMN IF NOT EXISTS "availability" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
  ADD COLUMN IF NOT EXISTS "postedCommandKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "finished_goods_lotNumber_key"
  ON "finished_goods"("lotNumber") WHERE "lotNumber" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "finished_goods_postedCommandKey_key"
  ON "finished_goods"("postedCommandKey") WHERE "postedCommandKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "finished_goods_formulaId_idx"
  ON "finished_goods"("formulaId");

CREATE TABLE IF NOT EXISTS "production_material_usages" (
  "id" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "workOrderId" UUID,
  "materialId" UUID NOT NULL,
  "inventoryId" UUID,
  "qtySent" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "qtyUsed" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "qtyReturned" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "variance" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "uom" TEXT,
  "reason" TEXT,
  "commandKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "production_material_usages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "production_material_usages_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_material_usages_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_material_usages_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "material_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "production_material_usages_commandKey_key"
  ON "production_material_usages"("commandKey") WHERE "commandKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "production_material_usages_planId_materialId_idx"
  ON "production_material_usages"("planId", "materialId");
