-- CreateTable
CREATE TABLE IF NOT EXISTS "import_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID,
    "entityType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadDigest" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "resultSummary" JSONB,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "import_executions_tenantId_entityType_idempotencyKey_key" ON "import_executions"("tenantId", "entityType", "idempotencyKey") NULLS NOT DISTINCT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "import_executions_idempotencyKey_idx" ON "import_executions"("idempotencyKey");
