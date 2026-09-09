-- Migration: 20260908230000_fix_marketing_tasks_columns
-- Ensure all camelCase columns exist on marketing_tasks
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "assigneeId" UUID;
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "taskCode" VARCHAR(100);
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "picId" UUID;
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "reviewerId" UUID;
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "assignedById" UUID;
ALTER TABLE "marketing_tasks" ADD COLUMN IF NOT EXISTS "projectId" UUID;

-- Dynamic data sync from legacy lowercase columns if they exist
DO $$
BEGIN
  -- Drop NOT NULL on legacy lowercase columns so Prisma inserts using camelCase succeed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='taskcode' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_tasks" ALTER COLUMN "taskcode" DROP NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_histories' AND column_name='task_id' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_histories" ALTER COLUMN "task_id" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_histories' AND column_name='to_status' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_histories" ALTER COLUMN "to_status" DROP NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_comments' AND column_name='task_id' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_comments" ALTER COLUMN "task_id" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_comments' AND column_name='body' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_comments" ALTER COLUMN "body" DROP NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_attachments' AND column_name='task_id' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_attachments" ALTER COLUMN "task_id" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_attachments' AND column_name='name' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_attachments" ALTER COLUMN "name" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_task_attachments' AND column_name='type' AND is_nullable='NO') THEN
    ALTER TABLE "marketing_task_attachments" ALTER COLUMN "type" DROP NOT NULL;
  END IF;

  -- Sync taskCode from taskcode
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='taskcode') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "taskCode" = COALESCE("taskCode", "taskcode") WHERE "taskCode" IS NULL AND "taskcode" IS NOT NULL';
  END IF;

  -- Sync picId from pic_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='pic_id') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "picId" = COALESCE("picId", "pic_id") WHERE "picId" IS NULL AND "pic_id" IS NOT NULL';
  END IF;

  -- Sync assigneeId from pic_id or picId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='pic_id') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "assigneeId" = COALESCE("assigneeId", "pic_id", "picId") WHERE "assigneeId" IS NULL';
  ELSE
    EXECUTE 'UPDATE "marketing_tasks" SET "assigneeId" = COALESCE("assigneeId", "picId") WHERE "assigneeId" IS NULL';
  END IF;

  -- Sync reviewerId from reviewerid
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='reviewerid') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "reviewerId" = COALESCE("reviewerId", "reviewerid") WHERE "reviewerId" IS NULL AND "reviewerid" IS NOT NULL';
  END IF;

  -- Sync assignedById from assignedbyid
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='assignedbyid') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "assignedById" = COALESCE("assignedById", "assignedbyid") WHERE "assignedById" IS NULL AND "assignedbyid" IS NOT NULL';
  END IF;

  -- Sync projectId from projectid
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='projectid') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "projectId" = COALESCE("projectId", "projectid") WHERE "projectId" IS NULL AND "projectid" IS NOT NULL';
  END IF;

  -- Sync startDate from startdate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='startdate') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "startDate" = COALESCE("startDate", "startdate") WHERE "startDate" IS NULL AND "startdate" IS NOT NULL';
  END IF;

  -- Sync dueDate from duedate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='duedate') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "dueDate" = COALESCE("dueDate", "duedate") WHERE "dueDate" IS NULL AND "duedate" IS NOT NULL';
  END IF;

  -- Sync completedAt from completedat
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='completedat') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "completedAt" = COALESCE("completedAt", "completedat") WHERE "completedAt" IS NULL AND "completedat" IS NOT NULL';
  END IF;

  -- Sync description from brief
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='brief') THEN
    EXECUTE 'UPDATE "marketing_tasks" SET "description" = COALESCE("description", "brief") WHERE "description" IS NULL AND "brief" IS NOT NULL';
  END IF;
END $$;
