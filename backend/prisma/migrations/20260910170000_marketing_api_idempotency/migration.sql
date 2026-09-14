-- Phase 3: persistent idempotency for canonical marketing POST mutations.
CREATE TABLE IF NOT EXISTS "marketing_idempotency_keys" (
  "id" UUID NOT NULL,
  "scope" VARCHAR(160) NOT NULL,
  "key" VARCHAR(160) NOT NULL,
  "requestHash" VARCHAR(64) NOT NULL,
  "actorId" UUID,
  "responseBody" JSONB NOT NULL,
  "statusCode" INTEGER NOT NULL DEFAULT 200,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_idempotency_keys_scope_key_key"
  ON "marketing_idempotency_keys"("scope", "key");
CREATE INDEX IF NOT EXISTS "marketing_idempotency_keys_expiresAt_idx"
  ON "marketing_idempotency_keys"("expiresAt");
