-- Create marketing_projects table
CREATE TABLE IF NOT EXISTS "marketing_projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectcode" VARCHAR(100) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "channel" VARCHAR(100) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "ownerid" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "startdate" TIMESTAMP(3),
  "deadline" TIMESTAMP(3),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(50) DEFAULT 'On Track',
  "summary" TEXT,
  "blockers" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop old / incomplete marketing_tasks table if it exists without taskcode
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_tasks'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_tasks' AND column_name = 'taskcode'
  ) THEN
    DROP TABLE "marketing_tasks" CASCADE;
  END IF;
END $$;

-- Create marketing_tasks table
CREATE TABLE IF NOT EXISTS "marketing_tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskcode" VARCHAR(100) UNIQUE NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "projectid" UUID REFERENCES "marketing_projects"("id") ON DELETE SET NULL,
  "channel" VARCHAR(100) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "brand" VARCHAR(50) DEFAULT 'Dreamlab',
  "assignedbyid" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "pic_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewerid" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "priority" VARCHAR(50) DEFAULT 'Medium',
  "startdate" TIMESTAMP(3),
  "duedate" TIMESTAMP(3),
  "status" VARCHAR(50) DEFAULT 'Not started',
  "completedat" TIMESTAMP(3),
  "sla" VARCHAR(50) DEFAULT 'Healthy',
  "estimatedhours" INTEGER DEFAULT 0,
  "actualhours" INTEGER DEFAULT 0,
  "revisioncount" INTEGER DEFAULT 0,
  "checklistdone" INTEGER DEFAULT 0,
  "checklisttotal" INTEGER DEFAULT 0,
  "brief" TEXT,
  "link" TEXT,
  "tags" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "marketing_tasks_pic_id_idx" ON "marketing_tasks" ("pic_id");
CREATE INDEX IF NOT EXISTS "marketing_tasks_assignedbyid_idx" ON "marketing_tasks" ("assignedbyid");
CREATE INDEX IF NOT EXISTS "marketing_tasks_reviewerid_idx" ON "marketing_tasks" ("reviewerid");
CREATE INDEX IF NOT EXISTS "marketing_tasks_projectid_idx" ON "marketing_tasks" ("projectid");
CREATE INDEX IF NOT EXISTS "marketing_tasks_status_idx" ON "marketing_tasks" ("status");

-- Create marketing_task_attachments table
CREATE TABLE IF NOT EXISTS "marketing_task_attachments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL REFERENCES "marketing_tasks"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "size_kb" INTEGER DEFAULT 0,
  "path" TEXT DEFAULT '',
  "uploaded_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "marketing_task_attachments_task_id_idx" ON "marketing_task_attachments" ("task_id");

-- Create marketing_task_comments table
CREATE TABLE IF NOT EXISTS "marketing_task_comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL REFERENCES "marketing_tasks"("id") ON DELETE CASCADE,
  "author_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "marketing_task_comments_task_id_idx" ON "marketing_task_comments" ("task_id");

-- Create marketing_task_histories table
CREATE TABLE IF NOT EXISTS "marketing_task_histories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL REFERENCES "marketing_tasks"("id") ON DELETE CASCADE,
  "at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "from_status" VARCHAR(50),
  "to_status" VARCHAR(50) NOT NULL,
  "note" TEXT
);
CREATE INDEX IF NOT EXISTS "marketing_task_histories_task_id_idx" ON "marketing_task_histories" ("task_id");
