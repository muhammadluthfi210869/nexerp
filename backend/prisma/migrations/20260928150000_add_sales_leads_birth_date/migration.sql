-- Reconcile missing runtime columns that were manually applied in scripts/
-- 1. sales_leads
ALTER TABLE "sales_leads" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3) WITHOUT TIME ZONE;

-- 2. users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBd" BOOLEAN DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "users_code_unique_idx" ON "users"("code") WHERE "code" IS NOT NULL;

-- 3. material_items
ALTER TABLE "material_items" ADD COLUMN IF NOT EXISTS "subCategory" TEXT;
ALTER TABLE "material_items" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "material_items" ADD COLUMN IF NOT EXISTS "coaMapping" JSONB;

-- 4. sales_targets
ALTER TABLE "sales_targets" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 5. sales_categories
CREATE TABLE IF NOT EXISTS "sales_categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT now()
);
