DO $$ BEGIN
  CREATE TYPE "MktProtoTaskStatus" AS ENUM ('NOT_STARTED', 'WORKING_ON_IT', 'REVISION', 'DONE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MktProtoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MktProtoBrand" AS ENUM ('DREAMLAB', 'TORIBIO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MktProtoSla" AS ENUM ('HEALTHY', 'WATCH', 'LATE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "mkt_proto_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "brand" "MktProtoBrand" NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "priority" "MktProtoPriority" NOT NULL,
    "startDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "MktProtoTaskStatus" NOT NULL,
    "sla" "MktProtoSla" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mkt_proto_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_task_histories" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "by" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "mkt_proto_task_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mkt_proto_task_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'General',
    "category" TEXT NOT NULL DEFAULT 'general_operations',
    "owner" TEXT NOT NULL,
    "start" DATE NOT NULL,
    "deadline" DATE NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "openTasks" INTEGER NOT NULL DEFAULT 0,
    "pendingApproval" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'On Track',
    "summary" TEXT NOT NULL DEFAULT '',
    "blockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mkt_proto_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "joinDate" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "monthKpi" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "inProgress" INTEGER NOT NULL DEFAULT 0,
    "late" INTEGER NOT NULL DEFAULT 0,
    "overdue" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "mkt_proto_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "completionWeight" INTEGER NOT NULL DEFAULT 40,
    "disciplineWeight" INTEGER NOT NULL DEFAULT 30,
    "qualityWeight" INTEGER NOT NULL DEFAULT 15,
    "productivityWeight" INTEGER NOT NULL DEFAULT 15,
    "workStart" TEXT NOT NULL DEFAULT '08:00',
    "workEnd" TEXT NOT NULL DEFAULT '17:00',
    "workDays" TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri']::TEXT[],
    CONSTRAINT "mkt_proto_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mkt_proto_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "recipient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mkt_proto_notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "mkt_proto_task_histories" ADD CONSTRAINT "mkt_proto_task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "mkt_proto_tasks"("id") ON DELETE CASCADE;
ALTER TABLE "mkt_proto_task_comments" ADD CONSTRAINT "mkt_proto_task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "mkt_proto_tasks"("id") ON DELETE CASCADE;
