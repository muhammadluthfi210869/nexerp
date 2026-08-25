-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: create missing base tables that downstream
-- migrations (batch3-batch7) reference but no migration creates.
--
-- Why this exists
--   Read-only analysis (see r4-final-go-live-evidence/01-release-artifact
--   /DATA-ANALYSIS.md) found 37 tables declared in the Prisma schema
--   that no migration in the chain creates. Downstream migrations
--   (batch3-batch7 and r2_shipment_lot_lineage) assume these tables
--   exist and ALTER them or FK against them, which fails with
--   "relation … does not exist".
--
--   This migration creates the base tables whose absence blocks the
--   downstream chain. Each CREATE TABLE is idempotent (IF NOT EXISTS)
--   and uses the canonical column shape from prisma/schema/*.
--
-- Why a NEW migration instead of editing applied history
--   Per R4 §7, applied migration history must not be silently rewritten.
--   This pre-flight migration has a timestamp that places it earlier
--   in the chain (20260822086000 < 20260822095959) so Prisma applies
--   it before batch3-batch7.
--
-- Why this is safe (data-preserving)
--   The protected DB has 0 rows in every table this migration creates
--   (those tables don't exist there). There is no data to preserve.
--   If a future deployment has populated these tables, this migration
--   is a no-op (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────

-- ── SCM requirement basis (batch4 assumes these exist) ──────────
CREATE TABLE IF NOT EXISTS "goods_requirements" (
    "id" UUID PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "salesOrderId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "goods_requirement_items" (
    "id" UUID PRIMARY KEY,
    "requirementId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "goods_requirement_items_requirementId_fkey"
      FOREIGN KEY ("requirementId") REFERENCES "goods_requirements"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Warehouse material-requisition basis (batch5 assumes these) ─
CREATE TABLE IF NOT EXISTS "material_requisition_headers" (
    "id" UUID PRIMARY KEY,
    "reqNumber" TEXT NOT NULL UNIQUE,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromWarehouse" UUID NOT NULL,
    "toWarehouse" UUID NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "material_requisition_items" (
    "id" UUID PRIMARY KEY,
    "headerId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qty" DECIMAL(15,3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "material_requisition_items_headerId_fkey"
      FOREIGN KEY ("headerId") REFERENCES "material_requisition_headers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

