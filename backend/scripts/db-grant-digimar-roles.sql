-- ════════════════════════════════════════════════════════════════════════════
--  RC1 — RolesGuard silent role block on production
--  Grant MARKETING + DIGIMAR roles to the 5-user DIGIMAR roster
--  so canonical-marketing endpoints (TASK_READ_ROLES allow-list) admit them.
--
--  Why this exists: production DB accumulated users from personnel.seeder.ts
--  whose roles array does NOT contain MARKETING / DIGIMAR. RolesGuard at
--  backend/src/modules/auth/roles.guard.ts:33-37 only globally bypasses
--  SUPER_ADMIN and DIRECTOR — every other user with role-mismatch gets 403.
--  Frontend Promise.allSettled swallows the 403 to console.error, so the
--  symptom is "page shows nothing" rather than a visible error.
--
--  Idempotent: re-running adds roles only when missing.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE "User"
SET roles = ARRAY(
  SELECT DISTINCT unnest(roles || ARRAY['MARKETING', 'DIGIMAR']::text[])
)
WHERE email IN (
  'revita@nexerp.id',
  'gusti@dreamlab.com',
  'zarkasi@dreamlab.com',
  'rahmat@dreamlab.com',
  'luthfi@dreamlab.com'
)
AND NOT (
  roles @> ARRAY['MARKETING']::text[]
  OR roles @> ARRAY['DIGIMAR']::text[]
);

COMMIT;
