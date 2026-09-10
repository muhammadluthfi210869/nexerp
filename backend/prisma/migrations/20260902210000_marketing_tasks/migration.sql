-- Create marketing_tasks table for Management Task module
CREATE TABLE IF NOT EXISTS "marketing_tasks" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"     UUID NOT NULL,
  "assigneeId"  UUID,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'OPEN',
  "priority"    TEXT NOT NULL DEFAULT 'MEDIUM',
  "dueDate"     TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "marketing_tasks_ownerId_idx" ON "marketing_tasks" ("ownerId");
CREATE INDEX IF NOT EXISTS "marketing_tasks_assigneeId_idx" ON "marketing_tasks" ("assigneeId");
CREATE INDEX IF NOT EXISTS "marketing_tasks_status_idx" ON "marketing_tasks" ("status");
