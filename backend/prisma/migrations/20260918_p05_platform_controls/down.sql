-- P05 Platform Controls rollback

DROP TRIGGER IF EXISTS audit_logs_immutable ON "audit_logs";
DROP FUNCTION IF EXISTS audit_immutable();

DROP TABLE IF EXISTS "communication_policies";
DROP TABLE IF EXISTS "tenant_scopes";
DROP TABLE IF EXISTS "outbox_dlq";
DROP TABLE IF EXISTS "outbox_events";
DROP TABLE IF EXISTS "approvals";
DROP TABLE IF EXISTS "audit_logs";
DROP TABLE IF EXISTS "mfa_challenges";
DROP TABLE IF EXISTS "mfa_secrets";
DROP TABLE IF EXISTS "auth_sessions";

DROP TYPE IF EXISTS "ApprovalDecision";
DROP TYPE IF EXISTS "OutboxStatus";
