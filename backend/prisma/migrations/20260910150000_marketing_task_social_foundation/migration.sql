-- Phase 2: canonical marketing task, social workflow, reporting, and integration foundation.
-- Expand-only: legacy columns and tables remain available during application rollout.

CREATE TABLE IF NOT EXISTS "marketing_brands" (
  "id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "handle" VARCHAR(120),
  "primaryPlatform" VARCHAR(50),
  "ownerId" UUID,
  "notes" TEXT,
  "accentToken" VARCHAR(30) NOT NULL DEFAULT 'blue',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_brands_code_key" ON "marketing_brands"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_brands_name_key" ON "marketing_brands"("name");
CREATE INDEX IF NOT EXISTS "marketing_brands_isActive_name_idx" ON "marketing_brands"("isActive", "name");

INSERT INTO "marketing_brands" ("id", "code", "name", "handle", "primaryPlatform", "accentToken", "updatedAt")
VALUES
  (gen_random_uuid(), 'DREAMLAB', 'Dreamlab', '@dreamlab.official', 'instagram', 'blue', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'TORIBIO', 'Toribio', '@toribio', 'instagram', 'amber', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "marketing_tasks"
  ADD COLUMN IF NOT EXISTS "taskType" VARCHAR(30) NOT NULL DEFAULT 'DAILY',
  ADD COLUMN IF NOT EXISTS "canonicalStatus" VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS "outputUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "referenceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "actualMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "brandId" UUID;

UPDATE "marketing_tasks"
SET
  "taskType" = CASE
    WHEN "projectId" IS NOT NULL THEN 'PROJECT'
    WHEN lower(COALESCE(category, '')) LIKE '%ad_hoc%' THEN 'AD_HOC'
    ELSE 'DAILY'
  END,
  "canonicalStatus" = CASE upper(replace(COALESCE(status, ''), ' ', '_'))
    WHEN 'DONE' THEN 'DONE'
    WHEN 'COMPLETED' THEN 'DONE'
    WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
    WHEN 'DOING' THEN 'IN_PROGRESS'
    WHEN 'REVIEW' THEN 'IN_REVIEW'
    WHEN 'IN_REVIEW' THEN 'IN_REVIEW'
    WHEN 'REVISION' THEN 'REVISION'
    WHEN 'BLOCKED' THEN 'IN_PROGRESS'
    WHEN 'CANCELLED' THEN 'CANCELLED'
    WHEN 'CANCELED' THEN 'CANCELLED'
    ELSE 'NOT_STARTED'
  END,
  "outputUrl" = CASE
    WHEN upper(COALESCE(status, '')) IN ('DONE', 'COMPLETED') THEN COALESCE("outputUrl", link)
    ELSE "outputUrl"
  END,
  "referenceUrl" = CASE
    WHEN upper(COALESCE(status, '')) NOT IN ('DONE', 'COMPLETED') THEN COALESCE("referenceUrl", link)
    ELSE "referenceUrl"
  END,
  "estimatedMinutes" = GREATEST(COALESCE("estimatedMinutes", 0), COALESCE("estimatedHours", 0) * 60),
  "actualMinutes" = GREATEST(COALESCE("actualMinutes", 0), COALESCE("actualHours", 0) * 60),
  "version" = GREATEST(COALESCE("version", 1), 1),
  "brandId" = COALESCE(
    "brandId",
    (SELECT id FROM "marketing_brands"
      WHERE code = CASE WHEN lower(COALESCE("marketing_tasks".brand, '')) LIKE '%toribio%' THEN 'TORIBIO' ELSE 'DREAMLAB' END)
  );

CREATE INDEX IF NOT EXISTS "marketing_tasks_canonicalStatus_dueDate_idx"
  ON "marketing_tasks"("canonicalStatus", "dueDate");
CREATE INDEX IF NOT EXISTS "marketing_tasks_brandId_idx" ON "marketing_tasks"("brandId");

ALTER TABLE "marketing_projects"
  ADD COLUMN IF NOT EXISTS "canonicalStatus" VARCHAR(30) NOT NULL DEFAULT 'ON_TRACK',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "brandId" UUID;

UPDATE "marketing_projects"
SET
  "canonicalStatus" = CASE upper(replace(COALESCE(status, ''), ' ', '_'))
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'DONE' THEN 'COMPLETED'
    WHEN 'PLANNED' THEN 'PLANNED'
    WHEN 'DRAFT' THEN 'PLANNED'
    WHEN 'AT_RISK' THEN 'AT_RISK'
    WHEN 'ON_HOLD' THEN 'ON_HOLD'
    WHEN 'BLOCKED' THEN 'ON_HOLD'
    WHEN 'CANCELLED' THEN 'CANCELLED'
    WHEN 'CANCELED' THEN 'CANCELLED'
    ELSE 'ON_TRACK'
  END,
  "version" = GREATEST(COALESCE("version", 1), 1),
  "brandId" = COALESCE(
    "brandId",
    (SELECT id FROM "marketing_brands"
      WHERE code = CASE WHEN lower(COALESCE("marketing_projects".name, '')) LIKE '%toribio%' THEN 'TORIBIO' ELSE 'DREAMLAB' END)
  );

CREATE INDEX IF NOT EXISTS "marketing_projects_brandId_idx" ON "marketing_projects"("brandId");
CREATE INDEX IF NOT EXISTS "marketing_projects_canonicalStatus_deadline_idx"
  ON "marketing_projects"("canonicalStatus", "deadline");

CREATE TABLE IF NOT EXISTS "marketing_task_checklist_items" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "text" VARCHAR(255) NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "completedById" UUID,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_task_checklist_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "marketing_task_checklist_items_taskId_sortOrder_idx"
  ON "marketing_task_checklist_items"("taskId", "sortOrder");

ALTER TABLE "social_posts"
  ADD COLUMN IF NOT EXISTS "brandId" UUID,
  ADD COLUMN IF NOT EXISTS "assigneeId" UUID,
  ADD COLUMN IF NOT EXISTS "reviewerId" UUID,
  ADD COLUMN IF NOT EXISTS "brief" TEXT,
  ADD COLUMN IF NOT EXISTS "referenceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalStatus" VARCHAR(30) NOT NULL DEFAULT 'IDEA',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "metricsSyncedAt" TIMESTAMP(3);

UPDATE "social_posts"
SET
  "brandId" = COALESCE("brandId", (SELECT id FROM "marketing_brands" WHERE code = 'DREAMLAB')),
  "canonicalStatus" = CASE upper(replace(COALESCE(status, ''), ' ', '_'))
    WHEN 'DRAFT' THEN 'DRAFT'
    WHEN 'SCRIPTING' THEN 'SCRIPTING'
    WHEN 'PRODUCTION' THEN 'PRODUCTION'
    WHEN 'IN_REVIEW' THEN 'IN_REVIEW'
    WHEN 'REVIEW' THEN 'IN_REVIEW'
    WHEN 'REVISION' THEN 'REVISION'
    WHEN 'APPROVED' THEN 'APPROVED'
    WHEN 'SCHEDULED' THEN 'SCHEDULED'
    WHEN 'PUBLISHED' THEN 'PUBLISHED'
    WHEN 'ARCHIVED' THEN 'ARCHIVED'
    ELSE 'IDEA'
  END,
  "version" = GREATEST(COALESCE("version", 1), 1);

CREATE INDEX IF NOT EXISTS "social_posts_brandId_scheduledDate_idx"
  ON "social_posts"("brandId", "scheduledDate");
CREATE INDEX IF NOT EXISTS "social_posts_assigneeId_status_idx"
  ON "social_posts"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "social_posts_canonicalStatus_scheduledDate_idx"
  ON "social_posts"("canonicalStatus", "scheduledDate");
CREATE INDEX IF NOT EXISTS "social_posts_metricsSyncedAt_idx" ON "social_posts"("metricsSyncedAt");

CREATE TABLE IF NOT EXISTS "social_post_media" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "kind" VARCHAR(30) NOT NULL DEFAULT 'ASSET',
  "url" TEXT NOT NULL,
  "storageKey" TEXT,
  "mimeType" VARCHAR(120),
  "sizeBytes" BIGINT NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "uploadedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "social_post_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "social_post_media_postId_sortOrder_idx"
  ON "social_post_media"("postId", "sortOrder");

CREATE TABLE IF NOT EXISTS "social_post_metric_snapshots" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "source" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "watchTimeSec" INTEGER NOT NULL DEFAULT 0,
  "avgWatchPct" DECIMAL(5,2),
  "spend" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "leads" INTEGER NOT NULL DEFAULT 0,
  "sampleRequests" INTEGER NOT NULL DEFAULT 0,
  "externalId" VARCHAR(160),
  "enteredById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "social_post_metric_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "social_post_metric_snapshots_postId_source_capturedAt_key"
  ON "social_post_metric_snapshots"("postId", "source", "capturedAt");
CREATE INDEX IF NOT EXISTS "social_post_metric_snapshots_postId_capturedAt_idx"
  ON "social_post_metric_snapshots"("postId", "capturedAt");

ALTER TABLE "campaign_okrs" ADD COLUMN IF NOT EXISTS "brandId" UUID;
UPDATE "campaign_okrs"
SET "brandId" = COALESCE("brandId", (SELECT id FROM "marketing_brands" WHERE code = 'DREAMLAB'));
CREATE INDEX IF NOT EXISTS "campaign_okrs_brandId_status_idx" ON "campaign_okrs"("brandId", "status");

CREATE TABLE IF NOT EXISTS "marketing_reporting_periods" (
  "id" UUID NOT NULL,
  "brandId" UUID NOT NULL,
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Jakarta',
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "createdById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_reporting_periods_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_reporting_periods_brandId_periodStart_periodEnd_key"
  ON "marketing_reporting_periods"("brandId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "marketing_reporting_periods_status_periodEnd_idx"
  ON "marketing_reporting_periods"("status", "periodEnd");

CREATE TABLE IF NOT EXISTS "brand_channel_metrics" (
  "id" UUID NOT NULL,
  "periodId" UUID NOT NULL,
  "channel" VARCHAR(50) NOT NULL,
  "source" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  "followersStart" INTEGER NOT NULL DEFAULT 0,
  "followersEnd" INTEGER NOT NULL DEFAULT 0,
  "followersGained" INTEGER NOT NULL DEFAULT 0,
  "followersLost" INTEGER NOT NULL DEFAULT 0,
  "reach" BIGINT NOT NULL DEFAULT 0,
  "views" BIGINT NOT NULL DEFAULT 0,
  "impressions" BIGINT NOT NULL DEFAULT 0,
  "likes" BIGINT NOT NULL DEFAULT 0,
  "comments" BIGINT NOT NULL DEFAULT 0,
  "shares" BIGINT NOT NULL DEFAULT 0,
  "saves" BIGINT NOT NULL DEFAULT 0,
  "clicks" BIGINT NOT NULL DEFAULT 0,
  "spend" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "leads" INTEGER NOT NULL DEFAULT 0,
  "sampleRequests" INTEGER NOT NULL DEFAULT 0,
  "deals" INTEGER NOT NULL DEFAULT 0,
  "externalId" VARCHAR(160),
  "enteredById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "syncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "brand_channel_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "brand_channel_metrics_periodId_channel_source_key"
  ON "brand_channel_metrics"("periodId", "channel", "source");
CREATE INDEX IF NOT EXISTS "brand_channel_metrics_channel_syncedAt_idx"
  ON "brand_channel_metrics"("channel", "syncedAt");

CREATE TABLE IF NOT EXISTS "weekly_social_reports" (
  "id" UUID NOT NULL,
  "periodId" UUID NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "weekStart" DATE NOT NULL,
  "weekEnd" DATE NOT NULL,
  "followersStart" INTEGER NOT NULL DEFAULT 0,
  "followersEnd" INTEGER NOT NULL DEFAULT 0,
  "followersGained" INTEGER NOT NULL DEFAULT 0,
  "followersLost" INTEGER NOT NULL DEFAULT 0,
  "reach" BIGINT NOT NULL DEFAULT 0,
  "views" BIGINT NOT NULL DEFAULT 0,
  "impressions" BIGINT NOT NULL DEFAULT 0,
  "totalEngagement" BIGINT NOT NULL DEFAULT 0,
  "storiesCount" INTEGER NOT NULL DEFAULT 0,
  "storyViews" BIGINT NOT NULL DEFAULT 0,
  "highlights" TEXT,
  "notes" TEXT,
  "enteredById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "weekly_social_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_social_reports_periodId_weekNumber_key"
  ON "weekly_social_reports"("periodId", "weekNumber");
CREATE INDEX IF NOT EXISTS "weekly_social_reports_weekStart_weekEnd_idx"
  ON "weekly_social_reports"("weekStart", "weekEnd");

CREATE TABLE IF NOT EXISTS "story_daily_metrics" (
  "id" UUID NOT NULL,
  "periodId" UUID NOT NULL,
  "brandId" UUID NOT NULL,
  "date" DATE NOT NULL,
  "storiesCount" INTEGER NOT NULL DEFAULT 0,
  "views" BIGINT NOT NULL DEFAULT 0,
  "replies" INTEGER NOT NULL DEFAULT 0,
  "linkClicks" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "completionPct" DECIMAL(5,2),
  "topic" VARCHAR(255),
  "notes" TEXT,
  "enteredById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "story_daily_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "story_daily_metrics_brandId_date_key"
  ON "story_daily_metrics"("brandId", "date");
CREATE INDEX IF NOT EXISTS "story_daily_metrics_periodId_date_idx"
  ON "story_daily_metrics"("periodId", "date");

CREATE TABLE IF NOT EXISTS "marketing_channel_funnels" (
  "id" UUID NOT NULL,
  "periodId" UUID NOT NULL,
  "channel" VARCHAR(50) NOT NULL,
  "traffic" BIGINT NOT NULL DEFAULT 0,
  "prospects" INTEGER NOT NULL DEFAULT 0,
  "sampleRequests" INTEGER NOT NULL DEFAULT 0,
  "deals" INTEGER NOT NULL DEFAULT 0,
  "spend" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "dealValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "enteredById" UUID,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_channel_funnels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_channel_funnels_periodId_channel_key"
  ON "marketing_channel_funnels"("periodId", "channel");

CREATE TABLE IF NOT EXISTS "marketing_integration_connections" (
  "id" UUID NOT NULL,
  "brandId" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'DISCONNECTED',
  "secretCiphertext" TEXT,
  "secretIv" VARCHAR(255),
  "secretTag" VARCHAR(255),
  "keyVersion" INTEGER NOT NULL DEFAULT 1,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "scopes" TEXT[] NOT NULL DEFAULT '{}',
  "tokenExpiresAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_integration_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_integration_connections_brandId_provider_key"
  ON "marketing_integration_connections"("brandId", "provider");
CREATE INDEX IF NOT EXISTS "marketing_integration_connections_provider_status_idx"
  ON "marketing_integration_connections"("provider", "status");

CREATE TABLE IF NOT EXISTS "marketing_integration_sync_jobs" (
  "id" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  "brandId" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "importedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" VARCHAR(100),
  "errorMessage" TEXT,
  "triggeredById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_integration_sync_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "marketing_integration_sync_jobs_connectionId_createdAt_idx"
  ON "marketing_integration_sync_jobs"("connectionId", "createdAt");
CREATE INDEX IF NOT EXISTS "marketing_integration_sync_jobs_status_createdAt_idx"
  ON "marketing_integration_sync_jobs"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_brands_ownerId_fkey') THEN
    ALTER TABLE "marketing_brands" ADD CONSTRAINT "marketing_brands_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_tasks_brandId_fkey') THEN
    ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_projects_brandId_fkey') THEN
    ALTER TABLE "marketing_projects" ADD CONSTRAINT "marketing_projects_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_task_checklist_items_taskId_fkey') THEN
    ALTER TABLE "marketing_task_checklist_items" ADD CONSTRAINT "marketing_task_checklist_items_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_task_checklist_items_completedById_fkey') THEN
    ALTER TABLE "marketing_task_checklist_items" ADD CONSTRAINT "marketing_task_checklist_items_completedById_fkey"
      FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_brandId_fkey') THEN
    ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_assigneeId_fkey') THEN
    ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_reviewerId_fkey') THEN
    ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_reviewerId_fkey"
      FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_post_media_postId_fkey') THEN
    ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_post_media_uploadedById_fkey') THEN
    ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_post_metric_snapshots_postId_fkey') THEN
    ALTER TABLE "social_post_metric_snapshots" ADD CONSTRAINT "social_post_metric_snapshots_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_okrs_brandId_fkey') THEN
    ALTER TABLE "campaign_okrs" ADD CONSTRAINT "campaign_okrs_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_reporting_periods_brandId_fkey') THEN
    ALTER TABLE "marketing_reporting_periods" ADD CONSTRAINT "marketing_reporting_periods_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_channel_metrics_periodId_fkey') THEN
    ALTER TABLE "brand_channel_metrics" ADD CONSTRAINT "brand_channel_metrics_periodId_fkey"
      FOREIGN KEY ("periodId") REFERENCES "marketing_reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_social_reports_periodId_fkey') THEN
    ALTER TABLE "weekly_social_reports" ADD CONSTRAINT "weekly_social_reports_periodId_fkey"
      FOREIGN KEY ("periodId") REFERENCES "marketing_reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_daily_metrics_periodId_fkey') THEN
    ALTER TABLE "story_daily_metrics" ADD CONSTRAINT "story_daily_metrics_periodId_fkey"
      FOREIGN KEY ("periodId") REFERENCES "marketing_reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_daily_metrics_brandId_fkey') THEN
    ALTER TABLE "story_daily_metrics" ADD CONSTRAINT "story_daily_metrics_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_channel_funnels_periodId_fkey') THEN
    ALTER TABLE "marketing_channel_funnels" ADD CONSTRAINT "marketing_channel_funnels_periodId_fkey"
      FOREIGN KEY ("periodId") REFERENCES "marketing_reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_integration_connections_brandId_fkey') THEN
    ALTER TABLE "marketing_integration_connections" ADD CONSTRAINT "marketing_integration_connections_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_integration_sync_jobs_connectionId_fkey') THEN
    ALTER TABLE "marketing_integration_sync_jobs" ADD CONSTRAINT "marketing_integration_sync_jobs_connectionId_fkey"
      FOREIGN KEY ("connectionId") REFERENCES "marketing_integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_integration_sync_jobs_brandId_fkey') THEN
    ALTER TABLE "marketing_integration_sync_jobs" ADD CONSTRAINT "marketing_integration_sync_jobs_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_tasks_taskType_check') THEN
    ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_taskType_check"
      CHECK ("taskType" IN ('DAILY', 'PROJECT', 'AD_HOC')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_tasks_canonicalStatus_check') THEN
    ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_canonicalStatus_check"
      CHECK ("canonicalStatus" IN ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'REVISION', 'DONE', 'CANCELLED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_projects_canonicalStatus_check') THEN
    ALTER TABLE "marketing_projects" ADD CONSTRAINT "marketing_projects_canonicalStatus_check"
      CHECK ("canonicalStatus" IN ('PLANNED', 'ON_TRACK', 'AT_RISK', 'ON_HOLD', 'COMPLETED', 'CANCELLED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_canonicalStatus_check') THEN
    ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_canonicalStatus_check"
      CHECK ("canonicalStatus" IN ('IDEA', 'DRAFT', 'SCRIPTING', 'PRODUCTION', 'IN_REVIEW', 'REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_reporting_periods_date_order_check') THEN
    ALTER TABLE "marketing_reporting_periods" ADD CONSTRAINT "marketing_reporting_periods_date_order_check"
      CHECK ("periodEnd" >= "periodStart") NOT VALID;
  END IF;
END $$;

ALTER TABLE "marketing_tasks" VALIDATE CONSTRAINT "marketing_tasks_taskType_check";
ALTER TABLE "marketing_tasks" VALIDATE CONSTRAINT "marketing_tasks_canonicalStatus_check";
ALTER TABLE "marketing_projects" VALIDATE CONSTRAINT "marketing_projects_canonicalStatus_check";
ALTER TABLE "social_posts" VALIDATE CONSTRAINT "social_posts_canonicalStatus_check";
ALTER TABLE "marketing_reporting_periods" VALIDATE CONSTRAINT "marketing_reporting_periods_date_order_check";
