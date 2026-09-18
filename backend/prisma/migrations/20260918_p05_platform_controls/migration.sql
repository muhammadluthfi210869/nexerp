-- P05 Platform Controls migration
-- Adds auth_sessions, mfa_secrets, mfa_challenges, audit_logs, approvals,
-- outbox_events, outbox_dlq, tenant_scopes, communication_policies.
-- Adds audit_immutable trigger to forbid UPDATE/DELETE on audit_logs.

-- Enums
DO $$ BEGIN
  CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'IN_FLIGHT', 'PUBLISHED', 'DEAD_LETTER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AuthSession
CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "refreshTokenHash" TEXT NOT NULL UNIQUE,
  "accessExpiresAt" TIMESTAMP NOT NULL,
  "refreshExpiresAt" TIMESTAMP NOT NULL,
  "mfaPending" BOOLEAN NOT NULL DEFAULT false,
  "mfaMethod" TEXT,
  "familyId" UUID NOT NULL,
  "parentSessionId" UUID,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "revokedAt" TIMESTAMP,
  "revokedReason" TEXT,
  "replacedById" UUID,
  "lastUsedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "auth_sessions_userId_revokedAt_idx" ON "auth_sessions" ("userId", "revokedAt");
CREATE INDEX IF NOT EXISTS "auth_sessions_familyId_idx" ON "auth_sessions" ("familyId");

-- MfaSecret
CREATE TABLE IF NOT EXISTS "mfa_secrets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "encryptedSecret" TEXT NOT NULL,
  "recoveryCodesHash" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confirmedAt" TIMESTAMP,
  "enrolledAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "required" BOOLEAN NOT NULL DEFAULT false
);

-- MfaChallenge
CREATE TABLE IF NOT EXISTS "mfa_challenges" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "consumedAt" TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "mfa_challenges_sessionId_idx" ON "mfa_challenges" ("sessionId");

-- AuditLog
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" UUID,
  "actorRoleSlug" TEXT,
  "actorPermissionSnapshot" JSONB NOT NULL,
  "tenantId" UUID,
  "correlationId" UUID NOT NULL,
  "idempotencyKey" TEXT,
  "source" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "entityVersion" INTEGER,
  "action" TEXT NOT NULL,
  "beforeSnapshot" JSONB,
  "afterSnapshot" JSONB,
  "occurredAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "txId" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_correlationId_idx" ON "audit_logs" ("correlationId");
CREATE INDEX IF NOT EXISTS "audit_logs_actorUserId_idx" ON "audit_logs" ("actorUserId");

-- Approvals
CREATE TABLE IF NOT EXISTS "approvals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "governedEntityType" TEXT NOT NULL,
  "governedEntityId" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "requestedById" UUID NOT NULL,
  "requestedAt" TIMESTAMP NOT NULL,
  "decision" "ApprovalDecision",
  "decidedById" UUID,
  "decidedAt" TIMESTAMP,
  "version" INTEGER NOT NULL,
  "thresholdRequired" INTEGER NOT NULL,
  "thresholdCount" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "approvals_governedEntityType_governedEntityId_version_idx"
  ON "approvals" ("governedEntityType", "governedEntityId", "version");

-- OutboxEvent
CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "payload" JSONB NOT NULL,
  "correlationId" UUID NOT NULL,
  "tenantId" UUID,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP,
  "leaseOwner" TEXT,
  "leaseExpiresAt" TIMESTAMP,
  "nextAttemptAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "publishedAt" TIMESTAMP,
  "deadLetteredAt" TIMESTAMP,
  "failureReason" TEXT
);

CREATE INDEX IF NOT EXISTS "outbox_events_status_nextAttemptAt_idx"
  ON "outbox_events" ("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "outbox_events_aggregateType_aggregateId_idx"
  ON "outbox_events" ("aggregateType", "aggregateId");

-- OutboxDlq
CREATE TABLE IF NOT EXISTS "outbox_dlq" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "outboxEventId" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "deadLetteredAt" TIMESTAMP NOT NULL,
  "reason" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "outbox_dlq_outboxEventId_idx" ON "outbox_dlq" ("outboxEventId");

-- TenantScope
CREATE TABLE IF NOT EXISTS "tenant_scopes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "divisionId" UUID,
  "departmentId" UUID,
  "regionId" UUID,
  "effectiveFrom" TIMESTAMP NOT NULL,
  "effectiveTo" TIMESTAMP,
  "primary" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "tenant_scopes_userId_organizationId_effectiveTo_idx"
  ON "tenant_scopes" ("userId", "organizationId", "effectiveTo");

-- CommunicationPolicy
CREATE TABLE IF NOT EXISTS "communication_policies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contextType" TEXT NOT NULL,
  "parentEntityType" TEXT NOT NULL,
  "requiredPermission" TEXT NOT NULL,
  "dataScope" TEXT NOT NULL DEFAULT 'tenant',
  "allowMentionsAcrossTenant" BOOLEAN NOT NULL DEFAULT false,
  "allowedTargetRoles" TEXT[]
);
CREATE INDEX IF NOT EXISTS "communication_policies_contextType_idx"
  ON "communication_policies" ("contextType");

-- Audit immutable trigger: forbid UPDATE/DELETE on audit_logs
CREATE OR REPLACE FUNCTION audit_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_IMMUTABLE: audit_logs cannot be UPDATEd or DELETEd (txId=%)', COALESCE(current_setting('audit.tx_id', true), 'unknown');
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_immutable ON "audit_logs";
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_immutable();
