-- Marketing Command Center — Phase 2
-- Per docs/DIGITAL_MARKETING_API_READY_PLAN.md §6.2

-- CreateTable
CREATE TABLE "marketing_connections" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_connections_provider_key" ON "marketing_connections"("provider");

-- CreateTable
CREATE TABLE "marketing_sync_runs" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "marketing_sync_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_sync_runs_provider_startedAt_idx" ON "marketing_sync_runs"("provider", "startedAt");

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_campaigns_provider_externalId_key" ON "marketing_campaigns"("provider", "externalId");

-- CreateTable
CREATE TABLE "marketing_campaign_daily_metrics" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "marketing_campaign_daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_campaign_daily_metrics_campaignId_date_key" ON "marketing_campaign_daily_metrics"("campaignId", "date");

-- CreateTable
CREATE TABLE "marketing_content" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" "TrafficSource" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_content_provider_externalId_key" ON "marketing_content"("provider", "externalId");

-- CreateTable
CREATE TABLE "marketing_content_daily_metrics" (
    "id" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "marketing_content_daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_content_daily_metrics_contentId_date_key" ON "marketing_content_daily_metrics"("contentId", "date");

-- CreateTable
CREATE TABLE "marketing_search_daily_metrics" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "position" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "marketing_search_daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_search_daily_metrics_siteUrl_date_key" ON "marketing_search_daily_metrics"("siteUrl", "date");

-- CreateTable
CREATE TABLE "marketing_attributions" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "campaignExternalId" TEXT,
    "contentExternalId" TEXT,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_attributions_leadId_provider_key" ON "marketing_attributions"("leadId", "provider");
CREATE INDEX "marketing_attributions_provider_campaignExternalId_idx" ON "marketing_attributions"("provider", "campaignExternalId");

-- AddForeignKey
ALTER TABLE "marketing_campaign_daily_metrics" ADD CONSTRAINT "marketing_campaign_daily_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content_daily_metrics" ADD CONSTRAINT "marketing_content_daily_metrics_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "marketing_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
