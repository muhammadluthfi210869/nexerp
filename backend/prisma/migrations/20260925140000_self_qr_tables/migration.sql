-- Self-QR canonical WhatsApp device pairing (Post-P04 Reconciled)
-- Tables: self_qr_devices, self_qr_normalized_events, self_qr_history_runs
-- Enums: SelfQrDeviceStatus, SelfQrEventSource, SelfQrIdentityStatus, SelfQrTimestampStatus
-- Idempotent creation to prevent drift.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SelfQrDeviceStatus') THEN
    CREATE TYPE "SelfQrDeviceStatus" AS ENUM (
      'UNPAIRED',
      'CONNECTING',
      'PAIRING_CODE_READY',
      'PAIRING',
      'CONNECTED',
      'SYNCING_HISTORY',
      'READY',
      'RECONNECTING',
      'LOGGED_OUT',
      'ERROR',
      'SUSPENDED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SelfQrEventSource') THEN
    CREATE TYPE "SelfQrEventSource" AS ENUM (
      'HISTORY',
      'REALTIME',
      'CATCHUP',
      'EXPORT'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SelfQrIdentityStatus') THEN
    CREATE TYPE "SelfQrIdentityStatus" AS ENUM (
      'RESOLVED_PHONE',
      'RESOLVED_LID',
      'UNRESOLVED_LID',
      'INTERNAL_DEVICE'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SelfQrTimestampStatus') THEN
    CREATE TYPE "SelfQrTimestampStatus" AS ENUM (
      'OK',
      'SUSPECT',
      'MISSING'
    );
  END IF;
END $$;

-- ── self_qr_devices ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "self_qr_devices" (
  "id"              UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  "internalCode"    VARCHAR(40)            NOT NULL UNIQUE,
  "displayName"     VARCHAR(120)           NOT NULL,
  "normalizedPhone" VARCHAR(20)            NOT NULL,
  "provider"        VARCHAR(20)            NOT NULL DEFAULT 'whatsapp-web.js',
  "providerId"      VARCHAR(80),
  "status"          "SelfQrDeviceStatus"   NOT NULL DEFAULT 'UNPAIRED',
  "phoneLast4"      VARCHAR(4),
  "authStatePath"   VARCHAR(255),
  "salesIdentity"   VARCHAR(120),
  "enabled"         BOOLEAN                NOT NULL DEFAULT true,
  "pairedAt"        TIMESTAMP(3),
  "lastReadyAt"     TIMESTAMP(3),
  "disconnectedAt"  TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "self_qr_devices_status_idx" ON "self_qr_devices" ("status");

-- ── self_qr_normalized_events ───────────────────────────
CREATE TABLE IF NOT EXISTS "self_qr_normalized_events" (
  "id"                UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId"          UUID                       NOT NULL,
  "dedupHash"         VARCHAR(64)                NOT NULL,
  "externalMessageId" VARCHAR(120)               NOT NULL,
  "provider"          VARCHAR(20)                NOT NULL,
  "customerPhone"     VARCHAR(20),
  "customerLid"       VARCHAR(120),
  "identityStatus"    "SelfQrIdentityStatus"     NOT NULL,
  "remoteJid"         VARCHAR(160)               NOT NULL,
  "remoteJidAlt"      VARCHAR(160),
  "fromMe"            BOOLEAN                    NOT NULL,
  "direction"         VARCHAR(10)                NOT NULL,
  "whatsappTimestamp" TIMESTAMP(3)               NOT NULL,
  "receivedAt"        TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "persistedAt"       TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "messageType"       VARCHAR(30)                NOT NULL,
  "textBody"          TEXT,
  "source"            "SelfQrEventSource"        NOT NULL,
  "rawPayloadHash"    VARCHAR(64),
  "timestampStatus"   "SelfQrTimestampStatus"    NOT NULL DEFAULT 'OK',
  "createdAt"         TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "device_msg_unique" UNIQUE ("deviceId", "externalMessageId"),
  CONSTRAINT "self_qr_normalized_events_deviceid_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "self_qr_devices"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "self_qr_normalized_events_deviceid_whatsapptimestamp_idx"
  ON "self_qr_normalized_events" ("deviceId", "whatsappTimestamp");
CREATE INDEX IF NOT EXISTS "self_qr_normalized_events_deviceid_identitystatus_idx"
  ON "self_qr_normalized_events" ("deviceId", "identityStatus");

-- ── self_qr_history_runs ────────────────────────────────
CREATE TABLE IF NOT EXISTS "self_qr_history_runs" (
  "id"                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId"          UUID              NOT NULL,
  "kind"              VARCHAR(20)       NOT NULL,
  "startedAt"         TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"        TIMESTAMP(3),
  "outcome"           VARCHAR(30),
  "requestedFrom"     TIMESTAMP(3),
  "requestedTo"       TIMESTAMP(3),
  "messagesCollected" INTEGER           NOT NULL DEFAULT 0,
  "duplicatesSkipped" INTEGER           NOT NULL DEFAULT 0,
  CONSTRAINT "self_qr_history_runs_deviceid_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "self_qr_devices"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "self_qr_history_runs_deviceid_kind_idx"
  ON "self_qr_history_runs" ("deviceId", "kind");
