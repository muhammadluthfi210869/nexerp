-- Align legacy production columns with the camel-case Prisma runtime schema.
-- Legacy columns are retained so older data remains recoverable.

ALTER TABLE "marketing_tasks"
  ADD COLUMN IF NOT EXISTS "estimatedHours" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "actualHours" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "checklistDone" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "checklistTotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "marketing_tasks"
SET
  "taskCode" = COALESCE("taskCode", taskcode, 'LEGACY-' || id::text),
  "ownerId" = COALESCE(
    "ownerId",
    "assignedById",
    assignedbyid,
    "picId",
    pic_id,
    "assigneeId",
    (SELECT id FROM users WHERE lower(email) = 'revita@nexerp.id' LIMIT 1)
  ),
  "projectId" = COALESCE("projectId", projectid),
  "picId" = COALESCE("picId", pic_id),
  "reviewerId" = COALESCE("reviewerId", reviewerid),
  "assignedById" = COALESCE("assignedById", assignedbyid),
  "startDate" = COALESCE("startDate", startdate),
  "dueDate" = COALESCE("dueDate", duedate),
  "completedAt" = COALESCE("completedAt", completedat),
  "estimatedHours" = COALESCE(estimatedhours, 0),
  "actualHours" = COALESCE(actualhours, 0),
  "revisionCount" = COALESCE(revisioncount, 0),
  "checklistDone" = COALESCE(checklistdone, 0),
  "checklistTotal" = COALESCE(checklisttotal, 0),
  "createdAt" = COALESCE(created_at, CURRENT_TIMESTAMP),
  "updatedAt" = COALESCE(updated_at, CURRENT_TIMESTAMP);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_tasks_taskCode_key"
  ON "marketing_tasks"("taskCode");
CREATE INDEX IF NOT EXISTS "marketing_tasks_assigneeId_idx"
  ON "marketing_tasks"("assigneeId");

ALTER TABLE "marketing_projects"
  ADD COLUMN IF NOT EXISTS "projectCode" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "ownerId" UUID,
  ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "marketing_projects"
SET
  "projectCode" = COALESCE("projectCode", projectcode, 'LEGACY-' || id::text),
  "ownerId" = COALESCE("ownerId", ownerid),
  "startDate" = COALESCE("startDate", startdate),
  "createdAt" = COALESCE(created_at, CURRENT_TIMESTAMP),
  "updatedAt" = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE "marketing_projects" ALTER COLUMN projectcode DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_projects_projectCode_key"
  ON "marketing_projects"("projectCode");

ALTER TABLE "marketing_task_histories"
  ADD COLUMN IF NOT EXISTS "taskId" UUID,
  ADD COLUMN IF NOT EXISTS "byId" UUID,
  ADD COLUMN IF NOT EXISTS "fromStatus" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "toStatus" VARCHAR(50);

UPDATE "marketing_task_histories"
SET
  "taskId" = COALESCE("taskId", task_id),
  "byId" = COALESCE("byId", by_id),
  "fromStatus" = COALESCE("fromStatus", from_status),
  "toStatus" = COALESCE("toStatus", to_status, 'OPEN');

CREATE INDEX IF NOT EXISTS "marketing_task_histories_taskId_idx"
  ON "marketing_task_histories"("taskId");

ALTER TABLE "marketing_task_attachments"
  ADD COLUMN IF NOT EXISTS "taskId" UUID,
  ADD COLUMN IF NOT EXISTS "sizeKb" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "uploadedById" UUID,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "marketing_task_attachments"
SET
  "taskId" = COALESCE("taskId", task_id),
  "sizeKb" = COALESCE(size_kb, 0),
  "uploadedById" = COALESCE("uploadedById", uploaded_by_id),
  "createdAt" = COALESCE(created_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS "marketing_task_attachments_taskId_idx"
  ON "marketing_task_attachments"("taskId");

ALTER TABLE "marketing_task_comments"
  ADD COLUMN IF NOT EXISTS "taskId" UUID,
  ADD COLUMN IF NOT EXISTS "authorId" UUID,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "marketing_task_comments"
SET
  "taskId" = COALESCE("taskId", task_id),
  "authorId" = COALESCE("authorId", author_id),
  "createdAt" = COALESCE(created_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS "marketing_task_comments_taskId_idx"
  ON "marketing_task_comments"("taskId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_tasks_projectId_fkey') THEN
    ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_task_histories_taskId_fkey') THEN
    ALTER TABLE "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_task_attachments_taskId_fkey') THEN
    ALTER TABLE "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_task_comments_taskId_fkey') THEN
    ALTER TABLE "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE;
  END IF;
END $$;
