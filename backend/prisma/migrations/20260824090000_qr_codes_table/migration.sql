-- Migration: 20260824090000_qr_codes_table
-- Adds qr_codes table for sales QR attribution (Feature/lead-capture-qr)
--
-- SAFETY:
--   - Pure CREATE TABLE, no modifications to existing tables.
--   - FK to users.id uses ON DELETE SET NULL so deleting a sales user
--     does NOT cascade-delete QR history.
--   - Indexes on assignedSalesId / channel / createdAt for dashboard query.

CREATE TABLE IF NOT EXISTS "qr_codes" (
    "id"              UUID         NOT NULL,
    "token"           VARCHAR(16)  NOT NULL,
    "trackingCode"    VARCHAR(20)  NOT NULL,
    "channel"         VARCHAR(20)  NOT NULL,
    "campaign"        VARCHAR(100),
    "assignedSalesId" UUID,
    "metadata"        JSONB,
    "isActive"        BOOLEAN      NOT NULL DEFAULT true,
    "expiresAt"       TIMESTAMP(3),
    "scanCount"       INTEGER      NOT NULL DEFAULT 0,
    "leadCount"       INTEGER      NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "qr_codes_token_key" ON "qr_codes"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "qr_codes_trackingCode_key" ON "qr_codes"("trackingCode");
CREATE INDEX IF NOT EXISTS "qr_codes_assignedSalesId_idx" ON "qr_codes"("assignedSalesId");
CREATE INDEX IF NOT EXISTS "qr_codes_channel_idx" ON "qr_codes"("channel");
CREATE INDEX IF NOT EXISTS "qr_codes_createdAt_idx" ON "qr_codes"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'qr_codes_assignedSalesId_fkey'
    ) THEN
        ALTER TABLE "qr_codes"
            ADD CONSTRAINT "qr_codes_assignedSalesId_fkey"
            FOREIGN KEY ("assignedSalesId")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;