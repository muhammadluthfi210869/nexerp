-- ════════════════════════════════════════════════════════════════════════════
--  RC2 — defaultOwner fallback picks Super Admin + non-idempotent seed
--  Reassign marketing_tasks whose owner is not a marketing persona
--  to the oldest active marketing user.
--
--  Why this exists: autoSeedMarketingTasks (canonical-marketing.service.ts:2018-2026)
--  picks `db.user.findFirst({ where: { status: 'ACTIVE', deletedAt: null } })`
--  with no marketing-role filter. Locally that resolves to a marketing user;
--  on prod it's Super Admin. Frontend taskScope (line 1397) filters marketing
--  viewer's tasks to rows where owner/assignee/pic/etc == viewer.id, so the
--  7 seeded tasks (TSK-G-001..TSK-A-001) are invisible to non-Admin viewers.
--
--  Idempotent: re-running assigns no further rows after first run.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

WITH first_marketing_user AS (
  SELECT id
  FROM "User"
  WHERE status = 'ACTIVE'
    AND deletedAt IS NULL
    AND (
      roles @> ARRAY['MARKETING']::text[]
      OR roles @> ARRAY['DIGIMAR']::text[]
      OR roles @> ARRAY['HEAD_OPS']::text[]
    )
  ORDER BY "createdAt" ASC
  LIMIT 1
)
UPDATE marketing_tasks
SET
  "ownerId" = (SELECT id FROM first_marketing_user),
  "assigneeId" = COALESCE("assigneeId", (SELECT id FROM first_marketing_user))
WHERE "ownerId" IS NULL
   OR "ownerId" NOT IN (
     SELECT id FROM "User"
     WHERE status = 'ACTIVE'
       AND deletedAt IS NULL
       AND (
         roles @> ARRAY['MARKETING']::text[]
         OR roles @> ARRAY['DIGIMAR']::text[]
         OR roles @> ARRAY['HEAD_OPS']::text[]
       )
   );

COMMIT;
