-- Management Task DB Cleanup + Luthfi Role Fix
-- Date: 2026-09-14
-- Scope: prune stale marketing_team_members rows + grant Luthfi MARKETING role + sample assignments
-- Reference: docs/marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md
-- Companion code changes: see commits 'fix(mgmt-task): ...'

BEGIN;

-- Step 1: Soft-delete stale marketing_team_members rows (keep expected 5: Gusti, Luthfi, Rahmat, Revita, Zarkasi)
UPDATE marketing_team_members
SET "isActive" = false, "updatedAt" = NOW()
WHERE "isActive" = true
  AND name NOT IN ('Gusti', 'Revita Yustianawati', 'Zarkasi', 'Rahmat', 'Luthfi');

-- Step 2: Grant MARKETING role to Luthfi (was {DIGIMAR, IT_SYS}, now {MARKETING, DIGIMAR, IT_SYS})
-- This allows Luthfi to create + assign tasks per SSOT RBAC matrix §5.
UPDATE users
SET roles = ARRAY['MARKETING','DIGIMAR','IT_SYS']::"UserRole"[]
WHERE email = 'luthfi@nexerp.id';

-- Step 3: Sample assignments — mark 3 tasks as created/assigned by Luthfi, 1 as owned by Luthfi
-- (gives 'My Tasks' view something to show after login)
UPDATE marketing_tasks
SET "assignedById" = (SELECT id FROM users WHERE email = 'luthfi@nexerp.id')
WHERE "taskCode" IN ('TSK-GST-01', 'TSK-ZAR-02', 'TSK-RHM-03');

UPDATE marketing_tasks
SET "ownerId" = (SELECT id FROM users WHERE email = 'luthfi@nexerp.id')
WHERE "taskCode" = 'TSK-GST-01';

-- Verification queries (run separately to confirm)
-- SELECT name, role, email FROM marketing_team_members WHERE "isActive" = true ORDER BY name;
-- SELECT email, "fullName", roles FROM users WHERE email = 'luthfi@nexerp.id';
-- SELECT "taskCode", title, "assignedById", "ownerId" FROM marketing_tasks
--   WHERE "assignedById" = (SELECT id FROM users WHERE email = 'luthfi@nexerp.id')
--      OR "ownerId" = (SELECT id FROM users WHERE email = 'luthfi@nexerp.id');

COMMIT;
