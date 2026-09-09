-- Align the live marketing_tasks table with the Prisma model used by the
-- Management Task service. Nullable at the database layer preserves all legacy
-- rows; new writes always provide ownerId.
ALTER TABLE "marketing_tasks"
  ADD COLUMN IF NOT EXISTS "ownerId" UUID;

CREATE INDEX IF NOT EXISTS "marketing_tasks_ownerId_idx"
  ON "marketing_tasks"("ownerId");
