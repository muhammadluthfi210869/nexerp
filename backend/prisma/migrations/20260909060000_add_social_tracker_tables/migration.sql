-- Migration: 20260909060000_add_social_tracker_tables
-- Create social tracker tables for Notion planner and Meta Hub

CREATE TABLE IF NOT EXISTS "social_posts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "platform" VARCHAR(50) NOT NULL DEFAULT 'instagram',
  "contentType" VARCHAR(50) NOT NULL DEFAULT 'single_post',
  "status" VARCHAR(50) NOT NULL DEFAULT 'idea',
  "scheduledDate" TIMESTAMP(3),
  "publishedDate" TIMESTAMP(3),
  "pillar" VARCHAR(100) NOT NULL DEFAULT 'Educational',
  "caption" TEXT NOT NULL DEFAULT '',
  "hooks" TEXT[] NOT NULL DEFAULT '{}',
  "cta" VARCHAR(255) NOT NULL DEFAULT '',
  "hashtags" TEXT[] NOT NULL DEFAULT '{}',
  "coverImage" TEXT,
  "mediaUrls" TEXT[] NOT NULL DEFAULT '{}',
  "authorName" VARCHAR(100) NOT NULL DEFAULT 'Marketing Team',
  "authorAvatar" TEXT,
  "authorRole" VARCHAR(100) NOT NULL DEFAULT 'Content Creator',
  "metaPostId" VARCHAR(100),
  "metaPermalink" TEXT,
  "notes" TEXT,
  "targetAudience" VARCHAR(255),
  "campaign" VARCHAR(255),
  "calloutText" TEXT,
  "calloutEmoji" VARCHAR(20),
  "reach" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "videoViews" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "engagementRate" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "viralityScore" INTEGER NOT NULL DEFAULT 0,
  "costPerResult" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "social_posts_platform_idx" ON "social_posts"("platform");
CREATE INDEX IF NOT EXISTS "social_posts_status_idx" ON "social_posts"("status");
CREATE INDEX IF NOT EXISTS "social_posts_scheduledDate_idx" ON "social_posts"("scheduledDate");

CREATE TABLE IF NOT EXISTS "social_checklist_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "text" VARCHAR(255) NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "social_checklist_items_postId_idx" ON "social_checklist_items"("postId");

CREATE TABLE IF NOT EXISTS "campaign_okrs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "objective" TEXT NOT NULL,
  "targetMetric" VARCHAR(100) NOT NULL,
  "currentValue" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "targetValue" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "unit" VARCHAR(50) NOT NULL DEFAULT '',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "status" VARCHAR(50) NOT NULL DEFAULT 'on_track',
  "color" VARCHAR(50) NOT NULL DEFAULT '#1877F2',
  "associatedPosts" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "meta_account_configs" (
  "id" VARCHAR(50) PRIMARY KEY DEFAULT 'singleton',
  "accessToken" TEXT NOT NULL DEFAULT '',
  "pageId" VARCHAR(100) NOT NULL DEFAULT '',
  "pageName" VARCHAR(255) NOT NULL DEFAULT 'Dreamlab Indonesia',
  "igAccountId" VARCHAR(100) NOT NULL DEFAULT '',
  "igUsername" VARCHAR(255) NOT NULL DEFAULT '@dreamlab.official',
  "profilePictureUrl" TEXT,
  "isConnected" BOOLEAN NOT NULL DEFAULT false,
  "isLiveApi" BOOLEAN NOT NULL DEFAULT false,
  "tokenExpiresAt" TIMESTAMP(3),
  "followersCount" INTEGER NOT NULL DEFAULT 0,
  "igFollowersCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "omni_crm_states" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" UUID NOT NULL UNIQUE,
  "state" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
