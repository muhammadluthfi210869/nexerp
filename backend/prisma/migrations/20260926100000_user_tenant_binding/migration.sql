-- Fase 1 — tenant binding on the identity row, plus the scope lookup index.
--
-- Why this migration exists
-- -------------------------
-- `users` had no tenant column at all. The tenant a login belonged to was only
-- reachable by joining `tenant_scopes` (`auth.service.ts:78-89`), so an identity
-- carried no tenant of its own and every consumer had to remember the join. This
-- adds the column and an index for the reverse lookup
-- (`tenant_scopes` by `organizationId`), which is what the audit and scope paths
-- want.
--
-- Idempotency
-- -----------
-- Both statements are guarded. `migrate deploy` is the container boot path
-- (`backend/init-db.sh`), and the live database was shaped by `db push`, so this
-- must be a no-op where the column already exists.
--
-- Deliberately NOT in this file
-- -----------------------------
-- A foreign key from `users.organizationId` to an organizations table. No such
-- table exists yet, and a FK to `tenant_scopes.id` would be wrong: one
-- organization is shared by many users, so the referenced column is not unique.
-- The column is therefore a plain tenant identifier until the Organization
-- aggregate lands (see the Phase 1 follow-up in the refactor plan).

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organizationId" UUID;

CREATE INDEX IF NOT EXISTS "tenant_scopes_organizationId_idx"
  ON "tenant_scopes" ("organizationId");
