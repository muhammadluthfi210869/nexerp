-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: create self_qr_devices base table.
--
-- Why this exists
--   marketing_sales_roster_alignment (20260824090000) does
--   `DELETE FROM self_qr_devices WHERE "internalCode" IN (...)`
--   but no migration creates the self_qr_devices table.
--   The Prisma model SelfQrDevice exists in self-qr.prisma but its
--   CREATE TABLE statement is missing from the migration chain.
--
-- Why a NEW migration instead of editing marketing_sales_roster_alignment
--   That migration is in the ledger as not-yet-applied. The cleanest
--   approach is a NEW pre-flight migration with a timestamp that
--   places it earlier in the chain.
--
-- Why this is safe (data-preserving)
--   The protected DB has no self_qr_devices table (it never existed
--   in any applied migration). The DELETE in marketing_sales_roster
--   is no-op for our purposes (no rows to delete from a table that
--   doesn't exist either).
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "self_qr_devices" (
    "id" UUID PRIMARY KEY,
    "internalCode" VARCHAR(40) NOT NULL UNIQUE,
    "displayName" VARCHAR(120) NOT NULL,
    "normalizedPhone" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'baileys',
    "providerId" VARCHAR(80),
    "status" TEXT NOT NULL DEFAULT 'UNPAIRED',
    "phoneLast4" VARCHAR(4),
    "authStatePath" VARCHAR(255),
    "salesIdentity" VARCHAR(120),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pairedAt" TIMESTAMP(3),
    "lastReadyAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
