-- Create omni_crm_states table for per-user Omni CRM state persistence
-- (mirrors localStorage shape byte-for-byte as JSON blob)
CREATE TABLE IF NOT EXISTS "omni_crm_states" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"   UUID NOT NULL,
  "state"     JSONB NOT NULL,
  "version"   INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "omni_crm_states_ownerId_key" UNIQUE ("ownerId")
);
