-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogActivityType') THEN CREATE TYPE "LogActivityType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PAGE_VIEW', 'STATE_TRANSITION', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN CREATE TYPE "PostStatus" AS ENUM ('IDEA', 'SCRIPTING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HppStatus') THEN CREATE TYPE "HppStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'REJECTED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StateEventTrigger') THEN CREATE TYPE "StateEventTrigger" AS ENUM ('SO_CREATED', 'PO_CREATED', 'INVOICE_ISSUED', 'JOURNAL_POSTED', 'PAYMENT_RECEIVED', 'PAYMENT_SENT', 'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'PERIOD_LOCKED'); END IF; END $$;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SAMPLE_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DOWN_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'FINAL_PAYMENT';

-- AlterEnum
BEGIN;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage_new') THEN CREATE TYPE "CrmStage_new" AS ENUM ('LEADS_MASUK', 'FOLLOW_UP', 'INTERESTED', 'DEAL_NEGOTIATION', 'DEAL_WON', 'DEAL_LOST', 'NURTURING'); END IF; END $$;
ALTER TABLE IF EXISTS "public"."crm_leads" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE IF EXISTS "crm_leads" ALTER COLUMN "stage" TYPE "CrmStage_new" USING ("stage"::text::"CrmStage_new");
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage_old') THEN
    ALTER TYPE "CrmStage" RENAME TO "CrmStage_old";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmStage_new') THEN
    ALTER TYPE "CrmStage_new" RENAME TO "CrmStage";
  END IF;
END $$;
DROP TYPE "public"."CrmStage_old";
ALTER TABLE IF EXISTS "crm_leads" ALTER COLUMN "stage" SET DEFAULT 'LEADS_MASUK';
COMMIT;

-- AlterEnum
ALTER TYPE "EscalationType" ADD VALUE IF NOT EXISTS 'SOURCE_OVERRIDE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FundRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL_DIR';
ALTER TYPE "FundRequestStatus" ADD VALUE IF NOT EXISTS 'APPROVED_BY_DIR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'WEBSITE';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'DIRECT';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'REFERRAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'RETURNED';

-- AlterEnum
ALTER TYPE "SOStatus" ADD VALUE IF NOT EXISTS 'LOCKED_ACTIVE';

-- AlterEnum
ALTER TYPE "SampleStage" ADD VALUE IF NOT EXISTS 'WAITING_FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'PURCHASE_RETURN';
ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'WORK_ORDER';
ALTER TYPE "SourceDocumentType" ADD VALUE IF NOT EXISTS 'DELIVERY_ORDER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StreamEventType" ADD VALUE IF NOT EXISTS 'HKI_BPOM_REGISTRATION';
ALTER TYPE "StreamEventType" ADD VALUE IF NOT EXISTS 'STOCK_CHECK_SHORTAGE';
ALTER TYPE "StreamEventType" ADD VALUE IF NOT EXISTS 'STOCK_CHECK_READY';

-- AlterEnum
ALTER TYPE "TrafficSource" ADD VALUE IF NOT EXISTS 'FB_ORGANIC';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowStatus" ADD VALUE IF NOT EXISTS 'COLD';
ALTER TYPE "WorkflowStatus" ADD VALUE IF NOT EXISTS 'WARM';
ALTER TYPE "WorkflowStatus" ADD VALUE IF NOT EXISTS 'HOT';

-- DropForeignKey
ALTER TABLE IF EXISTS "finished_goods" DROP CONSTRAINT IF EXISTS "finished_goods_formulaId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_fundRequestId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_campaign_daily_metrics" DROP CONSTRAINT IF EXISTS "marketing_campaign_daily_metrics_campaignId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_content_daily_metrics" DROP CONSTRAINT IF EXISTS "marketing_content_daily_metrics_contentId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_projects" DROP CONSTRAINT IF EXISTS "marketing_projects_ownerid_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP CONSTRAINT IF EXISTS "marketing_task_attachments_taskId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP CONSTRAINT IF EXISTS "marketing_task_attachments_task_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP CONSTRAINT IF EXISTS "marketing_task_attachments_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_comments" DROP CONSTRAINT IF EXISTS "marketing_task_comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_comments" DROP CONSTRAINT IF EXISTS "marketing_task_comments_taskId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_comments" DROP CONSTRAINT IF EXISTS "marketing_task_comments_task_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_histories" DROP CONSTRAINT IF EXISTS "marketing_task_histories_by_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_histories" DROP CONSTRAINT IF EXISTS "marketing_task_histories_taskId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_task_histories" DROP CONSTRAINT IF EXISTS "marketing_task_histories_task_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_assignedbyid_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_pic_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_projectId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_projectid_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_reviewerid_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "material_requisitions" DROP CONSTRAINT IF EXISTS "material_requisitions_materialInventoryId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "mkt_proto_task_comments" DROP CONSTRAINT IF EXISTS "mkt_proto_task_comments_taskId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "mkt_proto_task_histories" DROP CONSTRAINT IF EXISTS "mkt_proto_task_histories_taskId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "production_material_usages" DROP CONSTRAINT IF EXISTS "production_material_usages_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "production_material_usages" DROP CONSTRAINT IF EXISTS "production_material_usages_materialId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "production_material_usages" DROP CONSTRAINT IF EXISTS "production_material_usages_planId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_requestId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "purchase_request_items" DROP CONSTRAINT IF EXISTS "purchase_request_items_requirementItemId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "purchase_requests" DROP CONSTRAINT IF EXISTS "purchase_requests_requirementId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "qc_audits" DROP CONSTRAINT IF EXISTS "qc_audits_stepLogId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "sales_order_amendments" DROP CONSTRAINT IF EXISTS "sales_order_amendments_changedById_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "sales_order_amendments" DROP CONSTRAINT IF EXISTS "sales_order_amendments_salesOrderId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "sales_orders" DROP CONSTRAINT IF EXISTS "sales_orders_formulaId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "sample_revisions" DROP CONSTRAINT IF EXISTS "sample_revisions_materialItemId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "sample_revisions" DROP CONSTRAINT IF EXISTS "sample_revisions_sampleRequestId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "self_qr_history_runs" DROP CONSTRAINT IF EXISTS "self_qr_history_runs_deviceId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "self_qr_normalized_events" DROP CONSTRAINT IF EXISTS "self_qr_normalized_events_deviceId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "shipment_consumed_lots" DROP CONSTRAINT IF EXISTS "shipment_consumed_lots_shipmentItemId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "social_checklist_items" DROP CONSTRAINT IF EXISTS "social_checklist_items_postId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "work_orders" DROP CONSTRAINT IF EXISTS "work_orders_leadId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "work_orders" DROP CONSTRAINT IF EXISTS "work_orders_planId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "crm_leads_assignedAgentId_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "crm_leads_assignedToId_stage_idx";

-- DropIndex
DROP INDEX IF EXISTS "crm_leads_sourceChannel_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "crm_leads_source_idx";

-- DropIndex
DROP INDEX IF EXISTS "crm_leads_stage_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "finished_goods_formulaId_idx";

-- DropIndex
DROP INDEX IF EXISTS "goods_requirements_salesOrderId_salesOrderVersion_idx";

-- DropIndex
ALTER TABLE IF EXISTS "goods_requirements" DROP CONSTRAINT IF EXISTS "goods_requirements_salesOrderId_salesOrderVersion_key" CASCADE;
DROP INDEX IF EXISTS "goods_requirements_salesOrderId_salesOrderVersion_key";

-- DropIndex
DROP INDEX IF EXISTS "guestbook_events_approvalStatus_createdAt_idx";

-- DropIndex
ALTER TABLE IF EXISTS "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_fundRequestId_key" CASCADE;
DROP INDEX IF EXISTS "journal_entries_fundRequestId_key";

-- DropIndex
DROP INDEX IF EXISTS "lead_audits_action_createdAt_idx";

-- DropIndex
ALTER TABLE IF EXISTS "marketing_projects" DROP CONSTRAINT IF EXISTS "marketing_projects_projectcode_key" CASCADE;
DROP INDEX IF EXISTS "marketing_projects_projectcode_key";

-- DropIndex
DROP INDEX IF EXISTS "marketing_task_attachments_task_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_task_comments_task_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_task_histories_task_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_tasks_assignedbyid_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_tasks_pic_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_tasks_projectid_idx";

-- DropIndex
DROP INDEX IF EXISTS "marketing_tasks_reviewerid_idx";

-- DropIndex
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_taskcode_key" CASCADE;
DROP INDEX IF EXISTS "marketing_tasks_taskcode_key";

-- DropIndex
ALTER TABLE IF EXISTS "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_requestId_key" CASCADE;
DROP INDEX IF EXISTS "purchase_orders_requestId_key";

-- DropIndex
ALTER TABLE IF EXISTS "purchase_requests" DROP CONSTRAINT IF EXISTS "purchase_requests_requirementId_idempotencyKey_key" CASCADE;
DROP INDEX IF EXISTS "purchase_requests_requirementId_idempotencyKey_key";

-- DropIndex
DROP INDEX IF EXISTS "purchase_requests_requirementId_idx";

-- DropIndex
ALTER TABLE IF EXISTS "regulatory_pipelines" DROP CONSTRAINT IF EXISTS "regulatory_pipelines_lead_sample_type_key" CASCADE;
DROP INDEX IF EXISTS "regulatory_pipelines_lead_sample_type_key";

-- AlterTable
ALTER TABLE IF EXISTS "campaign_okrs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "communication_attachments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "communication_mentions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "communication_thread_replies" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "communication_threads" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "crm_leads" DROP COLUMN IF EXISTS "assignedAgentId",
DROP COLUMN IF EXISTS "assignedAgentName",
DROP COLUMN IF EXISTS "sourceChannel",
DROP COLUMN IF EXISTS "sourceRaw",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "daily_ads_metrics" ALTER COLUMN "campaignName" SET NOT NULL,
ALTER COLUMN "campaignName" SET DEFAULT 'General';

-- AlterTable
ALTER TABLE IF EXISTS "finished_goods" DROP COLUMN IF EXISTS "availability",
DROP COLUMN IF EXISTS "formulaId",
DROP COLUMN IF EXISTS "formulaVersionSnapshot",
DROP COLUMN IF EXISTS "lotNumber",
DROP COLUMN IF EXISTS "postedCommandKey",
DROP COLUMN IF EXISTS "qcStatus";

-- AlterTable
ALTER TABLE IF EXISTS "formula_items" DROP COLUMN IF EXISTS "dummyName",
DROP COLUMN IF EXISTS "dummyPrice",
DROP COLUMN IF EXISTS "isDummy";

-- AlterTable
ALTER TABLE IF EXISTS "goods_requirement_items" DROP COLUMN IF EXISTS "dosagePercentage",
DROP COLUMN IF EXISTS "uom";

-- AlterTable
ALTER TABLE IF EXISTS "goods_requirements" DROP COLUMN IF EXISTS "formulaId",
DROP COLUMN IF EXISTS "formulaVersion",
DROP COLUMN IF EXISTS "salesOrderVersion",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "guestbook_events" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "inbound_items" DROP COLUMN IF EXISTS "expDate",
DROP COLUMN IF EXISTS "inventoryId",
DROP COLUMN IF EXISTS "lotNumber";

-- AlterTable
ALTER TABLE IF EXISTS "inventory_transactions" DROP COLUMN IF EXISTS "commandKey";

-- AlterTable
ALTER TABLE IF EXISTS "journal_entries" DROP COLUMN IF EXISTS "category",
DROP COLUMN IF EXISTS "direction",
DROP COLUMN IF EXISTS "fundRequestId",
DROP COLUMN IF EXISTS "sourceDocumentId",
DROP COLUMN IF EXISTS "sourceEntityId",
DROP COLUMN IF EXISTS "sourceEntityType",
ADD COLUMN IF NOT EXISTS "billId" UUID,
ADD COLUMN IF NOT EXISTS "salesInvoiceId" UUID;

-- AlterTable
ALTER TABLE IF EXISTS "kpi_point_logs" DROP COLUMN IF EXISTS "referenceId";

-- AlterTable
ALTER TABLE IF EXISTS "kpi_scores" DROP COLUMN IF EXISTS "evaluationPeriod";

-- AlterTable
ALTER TABLE IF EXISTS "landing_page_conversions" ALTER COLUMN "visitId" SET DATA TYPE TEXT,
ALTER COLUMN "pageTitle" SET DATA TYPE TEXT,
ALTER COLUMN "source" SET DATA TYPE TEXT,
ALTER COLUMN "nama" SET DATA TYPE TEXT,
ALTER COLUMN "perusahaan" SET DATA TYPE TEXT,
ALTER COLUMN "hp" SET DATA TYPE TEXT,
ALTER COLUMN "produk" SET DATA TYPE TEXT,
ALTER COLUMN "trafficSource" SET DATA TYPE TEXT,
ALTER COLUMN "utmSource" SET DATA TYPE TEXT,
ALTER COLUMN "utmMedium" SET DATA TYPE TEXT,
ALTER COLUMN "utmCampaign" SET DATA TYPE TEXT,
ALTER COLUMN "assignedTo" SET DATA TYPE TEXT,
ALTER COLUMN "assignedPhone" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE IF EXISTS "landing_page_visits" ALTER COLUMN "pageTitle" SET DATA TYPE TEXT,
ALTER COLUMN "utmSource" SET DATA TYPE TEXT,
ALTER COLUMN "utmMedium" SET DATA TYPE TEXT,
ALTER COLUMN "utmCampaign" SET DATA TYPE TEXT,
ALTER COLUMN "utmContent" SET DATA TYPE TEXT,
ALTER COLUMN "utmTerm" SET DATA TYPE TEXT,
ALTER COLUMN "visitorId" SET DATA TYPE TEXT,
ALTER COLUMN "ipAddress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE IF EXISTS "lead_attributes" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "lead_audits" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "lead_captures" DROP COLUMN IF EXISTS "waName",
ADD COLUMN IF NOT EXISTS "aiIntent" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "approvalNeeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "extractedFullName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "firstValidatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "kommoFirstResponseSec" INTEGER,
ADD COLUMN IF NOT EXISTS "kommoTalkIsInWork" BOOLEAN,
ADD COLUMN IF NOT EXISTS "kommoTalkIsRead" BOOLEAN,
ADD COLUMN IF NOT EXISTS "kommoTalkOrigin" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "kommoTalkStatus" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "nameConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "nameMatch" BOOLEAN,
ADD COLUMN IF NOT EXISTS "outboundReplyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "waProfileName" VARCHAR(255),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "lead_timeline_logs" DROP COLUMN IF EXISTS "newStage",
DROP COLUMN IF EXISTS "previousStage";

-- AlterTable
ALTER TABLE IF EXISTS "marketing_projects" DROP COLUMN IF EXISTS "created_at",
DROP COLUMN IF EXISTS "ownerid",
DROP COLUMN IF EXISTS "projectcode",
DROP COLUMN IF EXISTS "startdate",
DROP COLUMN IF EXISTS "updated_at",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "projectCode" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP COLUMN IF EXISTS "created_at",
DROP COLUMN IF EXISTS "size_kb",
DROP COLUMN IF EXISTS "task_id",
DROP COLUMN IF EXISTS "uploaded_by_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "path" DROP DEFAULT,
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "marketing_task_comments" DROP COLUMN IF EXISTS "author_id",
DROP COLUMN IF EXISTS "created_at",
DROP COLUMN IF EXISTS "task_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "body" SET NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "marketing_task_histories" DROP COLUMN IF EXISTS "by_id",
DROP COLUMN IF EXISTS "from_status",
DROP COLUMN IF EXISTS "task_id",
DROP COLUMN IF EXISTS "to_status",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "at" SET NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL,
ALTER COLUMN "toStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "marketing_tasks" DROP COLUMN IF EXISTS "actualhours",
DROP COLUMN IF EXISTS "assignedbyid",
DROP COLUMN IF EXISTS "checklistdone",
DROP COLUMN IF EXISTS "checklisttotal",
DROP COLUMN IF EXISTS "completedat",
DROP COLUMN IF EXISTS "created_at",
DROP COLUMN IF EXISTS "duedate",
DROP COLUMN IF EXISTS "estimatedhours",
DROP COLUMN IF EXISTS "pic_id",
DROP COLUMN IF EXISTS "projectid",
DROP COLUMN IF EXISTS "reviewerid",
DROP COLUMN IF EXISTS "revisioncount",
DROP COLUMN IF EXISTS "startdate",
DROP COLUMN IF EXISTS "taskcode",
DROP COLUMN IF EXISTS "updated_at",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "channel" SET DEFAULT 'General',
ALTER COLUMN "category" SET DEFAULT 'general_operations',
ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM',
ALTER COLUMN "priority" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN',
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "sla" DROP DEFAULT,
ALTER COLUMN "taskCode" SET NOT NULL,
ALTER COLUMN "ownerId" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "marketing_team_members" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "master_categories" ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "material_inventories" DROP COLUMN IF EXISTS "reservedQty";

-- AlterTable
ALTER TABLE IF EXISTS "material_items" DROP COLUMN IF EXISTS "isDummy",
ADD COLUMN IF NOT EXISTS "autoCalculatedHpp" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "bahanType" TEXT,
ADD COLUMN IF NOT EXISTS "conditionNotes" TEXT,
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "manualOverrideHpp" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "physicalForm" TEXT,
ADD COLUMN IF NOT EXISTS "primaryUnitId" UUID;

-- AlterTable
ALTER TABLE IF EXISTS "material_requisition_headers" DROP COLUMN IF EXISTS "issueCommandKey",
DROP COLUMN IF EXISTS "returnCommandKey",
DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS "status" "RequisitionHeaderStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "material_requisition_items" DROP COLUMN IF EXISTS "qtyIssued",
DROP COLUMN IF EXISTS "qtyReturned";

-- AlterTable
ALTER TABLE IF EXISTS "material_requisitions" DROP COLUMN IF EXISTS "materialInventoryId";

-- AlterTable
ALTER TABLE IF EXISTS "meta_account_configs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "omni_crm_states" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "payrolls" DROP COLUMN IF EXISTS "period";

-- AlterTable
ALTER TABLE IF EXISTS "production_logs" DROP COLUMN IF EXISTS "executionCommandKey",
DROP COLUMN IF EXISTS "stage",
ADD COLUMN IF NOT EXISTS "stage" "LifecycleStatus" NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "production_plans" DROP COLUMN IF EXISTS "formulaVersionSnapshot",
DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS "status" "LifecycleStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE IF EXISTS "purchase_order_items" DROP COLUMN IF EXISTS "taxType",
ADD COLUMN IF NOT EXISTS "qtyBagus" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "qtyReject" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "qtyRounded" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'PO';

-- AlterTable
ALTER TABLE IF EXISTS "purchase_orders" DROP COLUMN IF EXISTS "currency",
DROP COLUMN IF EXISTS "requestId",
ADD COLUMN IF NOT EXISTS "discountManual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountRounding" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE IF EXISTS "purchase_request_items" DROP COLUMN IF EXISTS "requirementItemId";

-- AlterTable
ALTER TABLE IF EXISTS "purchase_requests" DROP COLUMN IF EXISTS "idempotencyKey",
DROP COLUMN IF EXISTS "requirementId",
DROP COLUMN IF EXISTS "priority",
ADD COLUMN IF NOT EXISTS "priority" "PRPriority" NOT NULL DEFAULT 'MEDIUM',
DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS "status" "PRStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE IF EXISTS "qc_audits" ALTER COLUMN "stepLogId" DROP NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "qc_checklists" ADD COLUMN IF NOT EXISTS "salesOrderId" UUID;

-- AlterTable
ALTER TABLE IF EXISTS "regulatory_pipelines" ALTER COLUMN "legalPicId" SET NOT NULL;

-- AlterTable
ALTER TABLE IF EXISTS "round_robin_agents" DROP COLUMN IF EXISTS "externalKey",
DROP COLUMN IF EXISTS "userId",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "round_robin_state" DROP CONSTRAINT IF EXISTS "round_robin_state_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "round_robin_state_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE IF EXISTS "sales_leads" DROP COLUMN IF EXISTS "followUpStatus",
DROP COLUMN IF EXISTS "leadState",
DROP COLUMN IF EXISTS "stage";

-- AlterTable
ALTER TABLE IF EXISTS "sales_order_items" DROP COLUMN IF EXISTS "taxType";

-- AlterTable
ALTER TABLE IF EXISTS "sales_orders" DROP COLUMN IF EXISTS "committedAt",
DROP COLUMN IF EXISTS "formulaId",
DROP COLUMN IF EXISTS "idempotencyKey",
DROP COLUMN IF EXISTS "taxType",
DROP COLUMN IF EXISTS "version";

-- AlterTable
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "bpomProgress",
DROP COLUMN IF EXISTS "halalProgress",
DROP COLUMN IF EXISTS "hkiProgress",
DROP COLUMN IF EXISTS "legalApplicability",
DROP COLUMN IF EXISTS "legalType",
DROP COLUMN IF EXISTS "logoRevision",
DROP COLUMN IF EXISTS "productionStatus";

-- AlterTable
ALTER TABLE IF EXISTS "social_checklist_items" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "social_posts" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE IF EXISTS "warehouse_inbounds" DROP COLUMN IF EXISTS "idempotencyKey",
DROP COLUMN IF EXISTS "reversalReason",
DROP COLUMN IF EXISTS "reversedAt",
DROP COLUMN IF EXISTS "supplierReference";

-- AlterTable
ALTER TABLE IF EXISTS "work_orders" DROP COLUMN IF EXISTS "stage",
ADD COLUMN IF NOT EXISTS "stage" "LifecycleStatus" NOT NULL DEFAULT 'WAITING_MATERIAL';

-- DropTable
DROP TABLE IF EXISTS "marketing_attributions" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_campaign_daily_metrics" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_campaigns" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_connections" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_content" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_content_daily_metrics" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_search_daily_metrics" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "marketing_sync_runs" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_notifications" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_profiles" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_projects" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_settings" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_task_comments" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_task_histories" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "mkt_proto_tasks" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "production_material_usages" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_daily_tasks" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_failed_trials" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_head_tracker" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_monthly_kpi" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_projects" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "rnd_weekly_performance" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "sales_order_amendments" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "sample_revisions" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "self_qr_devices" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "self_qr_history_runs" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "self_qr_normalized_events" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "shipment_consumed_lots" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "CrmKpiWindow" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "FollowUpStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "LeadState" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "LegalApplicability" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "MktProtoBrand" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "MktProtoPriority" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "MktProtoSla" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "MktProtoTaskStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "PipelineStage" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "ProdStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "RndProjectStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "SelfQrDeviceStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "SelfQrEventSource" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "SelfQrIdentityStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "SelfQrTimestampStatus" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "WorkOrderStage" CASCADE;

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "division" "Division",
    "type" "LogActivityType" NOT NULL,
    "method" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "path" TEXT,
    "status" INTEGER,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "billNumber" TEXT NOT NULL,
    "poNumber" TEXT,
    "vendorId" UUID NOT NULL,
    "procurementCategory" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "totalDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "grandTotal" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "unpaidReason" TEXT,
    "notes" TEXT,
    "pic" TEXT NOT NULL,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_line_items" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "rejectQty" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "bill_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_match_results" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "matchStatus" TEXT NOT NULL,
    "qtyVariance" DECIMAL(5,2) NOT NULL,
    "priceVariance" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "down_payments" (
    "id" UUID NOT NULL,
    "dpNumber" TEXT NOT NULL,
    "vendorId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "remainingAmount" DECIMAL(15,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "appliedToBillId" UUID,
    "appliedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "appliedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "down_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ap_payments" (
    "id" UUID NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "vendorId" UUID NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "bankAccountId" UUID,
    "notes" TEXT,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "verifiedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ap_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_allocations" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "bill_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "accountCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'IDR',
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "glAccountId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "sourceType" TEXT,
    "sourceId" UUID,
    "description" TEXT NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" UUID,
    "journalEntryId" UUID,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" UUID NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "statementBalance" DECIMAL(18,2) NOT NULL,
    "bookBalance" DECIMAL(18,2) NOT NULL,
    "difference" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "reconciledBy" UUID,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_transactions" (
    "id" UUID NOT NULL,
    "taxTypeId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "baseAmount" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCRUED',
    "reportedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "npwp" TEXT,
    "creditLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoices" (
    "id" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice_line_items" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "sales_invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_receipts" (
    "id" UUID NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "invoiceId" UUID,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "pph23Amount" DECIMAL(15,2),
    "bankAccountId" UUID,
    "notes" TEXT,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_fees" (
    "id" UUID NOT NULL,
    "feeNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "feeDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "offsetToDPId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" UUID NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetCategory" TEXT NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionCost" DECIMAL(15,2) NOT NULL,
    "usefulLife" INTEGER NOT NULL,
    "salvageValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "responsiblePerson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciation_schedules" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "accumulated" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "depreciation_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_transfers" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "fromPerson" TEXT,
    "toPerson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_disposals" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "disposalType" TEXT NOT NULL,
    "proceeds" DECIMAL(15,2) NOT NULL,
    "gainLoss" DECIMAL(15,2) NOT NULL,
    "buyer" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_disposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intangible_assets" (
    "id" UUID NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionCost" DECIMAL(15,2) NOT NULL,
    "amortizationPeriod" INTEGER NOT NULL,
    "amortizationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intangible_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_locks" (
    "id" UUID NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedBy" UUID,
    "lockedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "period_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closing_checklists" (
    "id" UUID NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "department" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "category" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" UUID,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "closing_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjustment_journals" (
    "id" UUID NOT NULL,
    "journalNumber" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preparedBy" UUID,
    "reviewedBy" UUID,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjustment_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_order_costings" (
    "id" UUID NOT NULL,
    "jobOrderNumber" TEXT NOT NULL,
    "description" TEXT,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "job_order_costings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_variances" (
    "id" UUID NOT NULL,
    "jobOrderId" UUID NOT NULL,
    "varianceType" TEXT NOT NULL,
    "standardCost" DECIMAL(15,2) NOT NULL,
    "actualCost" DECIMAL(15,2) NOT NULL,
    "variance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_variances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_profitabilities" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "profit" DECIMAL(15,2) NOT NULL,
    "margin" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_profitabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_allocations" (
    "id" UUID NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "fromCostCenter" TEXT NOT NULL,
    "toCostCenter" TEXT NOT NULL,
    "allocationMethod" TEXT NOT NULL DEFAULT 'DIRECT',
    "basis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_escrows" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "purpose" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_escrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ownerships" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" UUID,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_validation_logs" (
    "id" TEXT NOT NULL,
    "leadId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "action" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_units" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_access" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "grantedBy" UUID,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_kodes" (
    "id" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "exampleFormat" TEXT,
    "currentSequence" INTEGER NOT NULL DEFAULT 0,
    "resetCycle" TEXT NOT NULL DEFAULT 'YEARLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_kodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_purchase_requests" (
    "id" UUID NOT NULL,
    "eprNumber" TEXT NOT NULL,
    "materialId" UUID NOT NULL,
    "shortageQty" DECIMAL(15,2) NOT NULL,
    "currentStock" DECIMAL(15,2) NOT NULL,
    "requiredQty" DECIMAL(15,2) NOT NULL,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'CITO_CRITICAL',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PO',
    "targetPoId" UUID,
    "notes" TEXT,
    "requestedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_supplier_history" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPurchaseAt" TIMESTAMP(3),
    "totalQtyPurchased" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "product_supplier_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_entityType_entityId_createdAt_idx" ON "activity_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bills_billNumber_key" ON "bills"("billNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bills_vendorId_paymentStatus_idx" ON "bills"("vendorId", "paymentStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bills_dueDate_paymentStatus_idx" ON "bills"("dueDate", "paymentStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bill_line_items_billId_idx" ON "bill_line_items"("billId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bill_match_results_billId_idx" ON "bill_match_results"("billId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "down_payments_dpNumber_key" ON "down_payments"("dpNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "down_payments_vendorId_status_idx" ON "down_payments"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ap_payments_paymentNumber_key" ON "ap_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ap_payments_vendorId_paymentDate_idx" ON "ap_payments"("vendorId", "paymentDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bill_allocations_billId_idx" ON "bill_allocations"("billId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bill_allocations_paymentId_billId_key" ON "bill_allocations"("paymentId", "billId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bank_accounts_accountCode_key" ON "bank_accounts"("accountCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_transactions_bankAccountId_date_idx" ON "bank_transactions"("bankAccountId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_transactions_sourceType_sourceId_idx" ON "bank_transactions"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_reconciliations_bankAccountId_periodStart_periodEnd_idx" ON "bank_reconciliations"("bankAccountId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tax_transactions_sourceType_sourceId_idx" ON "tax_transactions"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tax_transactions_status_taxTypeId_idx" ON "tax_transactions"("status", "taxTypeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_invoices_invoiceNumber_key" ON "sales_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_invoices_customerId_paymentStatus_idx" ON "sales_invoices"("customerId", "paymentStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_invoices_dueDate_paymentStatus_idx" ON "sales_invoices"("dueDate", "paymentStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_invoice_line_items_invoiceId_idx" ON "sales_invoice_line_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ar_receipts_receiptNumber_key" ON "ar_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ar_receipts_customerId_receiptDate_idx" ON "ar_receipts"("customerId", "receiptDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sample_fees_feeNumber_key" ON "sample_fees"("feeNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "fixed_assets_assetNumber_key" ON "fixed_assets"("assetNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "depreciation_schedules_assetId_idx" ON "depreciation_schedules"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_schedules_assetId_period_key" ON "depreciation_schedules"("assetId", "period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "asset_transfers_assetId_idx" ON "asset_transfers"("assetId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "asset_disposals_assetId_idx" ON "asset_disposals"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "intangible_assets_assetNumber_key" ON "intangible_assets"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "period_locks_period_key" ON "period_locks"("period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "closing_checklists_period_department_idx" ON "closing_checklists"("period", "department");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "adjustment_journals_journalNumber_key" ON "adjustment_journals"("journalNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "job_order_costings_jobOrderNumber_key" ON "job_order_costings"("jobOrderNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cost_variances_jobOrderId_idx" ON "cost_variances"("jobOrderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_profitabilities_productId_period_key" ON "product_profitabilities"("productId", "period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_escrows_customerId_status_idx" ON "client_escrows"("customerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inventory_ownerships_ownerType_idx" ON "inventory_ownerships"("ownerType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_ownerships_materialId_warehouseId_ownerType_owner_key" ON "inventory_ownerships"("materialId", "warehouseId", "ownerType", "ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_validation_logs_leadId_idx" ON "lead_validation_logs"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "master_units_code_key" ON "master_units"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "warehouse_access_userId_idx" ON "warehouse_access"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "warehouse_access_warehouseId_idx" ON "warehouse_access"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_access_userId_warehouseId_key" ON "warehouse_access"("userId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "master_kodes_documentType_key" ON "master_kodes"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "emergency_purchase_requests_eprNumber_key" ON "emergency_purchase_requests"("eprNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_purchase_requests_materialId_idx" ON "emergency_purchase_requests"("materialId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_purchase_requests_status_idx" ON "emergency_purchase_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_supplier_history_productId_supplierId_key" ON "product_supplier_history"("productId", "supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_leads_assignedToId_createdAt_idx" ON "crm_leads"("assignedToId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employees_nik_key" ON "employees"("nik");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guestbook_events_crmLeadId_createdAt_idx" ON "guestbook_events"("crmLeadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "kpi_scores_employeeId_periodId_key" ON "kpi_scores"("employeeId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lead_messages_msgId_key" ON "lead_messages"("msgId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_messages_leadId_idx" ON "lead_messages"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "marketing_tasks_projectId_idx" ON "marketing_tasks"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "master_categories_code_key" ON "master_categories"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "production_logs_stage_idx" ON "production_logs"("stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "production_plans_soId_status_idx" ON "production_plans"("soId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_order_items_poId_idx" ON "purchase_order_items"("poId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_order_items_materialId_idx" ON "purchase_order_items"("materialId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_orders_supplierId_status_idx" ON "purchase_orders"("supplierId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_orders_leadId_idx" ON "purchase_orders"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_request_items_requestId_idx" ON "purchase_request_items"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_request_items_materialId_idx" ON "purchase_request_items"("materialId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "qc_checklists_salesOrderId_idx" ON "qc_checklists"("salesOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "warehouse_inbounds_poId_idx" ON "warehouse_inbounds"("poId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "warehouse_inbounds_receivedAt_idx" ON "warehouse_inbounds"("receivedAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "work_orders_stage_idx" ON "work_orders"("stage");

-- AddForeignKey
ALTER TABLE IF EXISTS "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_userId_fkey";
ALTER TABLE IF EXISTS "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "guestbook_events" DROP CONSTRAINT IF EXISTS "guestbook_events_crmLeadId_fkey";
ALTER TABLE IF EXISTS "guestbook_events" ADD CONSTRAINT "guestbook_events_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "lead_audits" DROP CONSTRAINT IF EXISTS "lead_audits_crmLeadId_fkey";
ALTER TABLE IF EXISTS "lead_audits" ADD CONSTRAINT "lead_audits_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bills" DROP CONSTRAINT IF EXISTS "bills_vendorId_fkey";
ALTER TABLE IF EXISTS "bills" ADD CONSTRAINT "bills_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bill_line_items" DROP CONSTRAINT IF EXISTS "bill_line_items_billId_fkey";
ALTER TABLE IF EXISTS "bill_line_items" ADD CONSTRAINT "bill_line_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bill_match_results" DROP CONSTRAINT IF EXISTS "bill_match_results_billId_fkey";
ALTER TABLE IF EXISTS "bill_match_results" ADD CONSTRAINT "bill_match_results_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "down_payments" DROP CONSTRAINT IF EXISTS "down_payments_vendorId_fkey";
ALTER TABLE IF EXISTS "down_payments" ADD CONSTRAINT "down_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "down_payments" DROP CONSTRAINT IF EXISTS "down_payments_appliedToBillId_fkey";
ALTER TABLE IF EXISTS "down_payments" ADD CONSTRAINT "down_payments_appliedToBillId_fkey" FOREIGN KEY ("appliedToBillId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ap_payments" DROP CONSTRAINT IF EXISTS "ap_payments_vendorId_fkey";
ALTER TABLE IF EXISTS "ap_payments" ADD CONSTRAINT "ap_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ap_payments" DROP CONSTRAINT IF EXISTS "ap_payments_bankAccountId_fkey";
ALTER TABLE IF EXISTS "ap_payments" ADD CONSTRAINT "ap_payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ap_payments" DROP CONSTRAINT IF EXISTS "ap_payments_verifiedBy_fkey";
ALTER TABLE IF EXISTS "ap_payments" ADD CONSTRAINT "ap_payments_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bill_allocations" DROP CONSTRAINT IF EXISTS "bill_allocations_paymentId_fkey";
ALTER TABLE IF EXISTS "bill_allocations" ADD CONSTRAINT "bill_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ap_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bill_allocations" DROP CONSTRAINT IF EXISTS "bill_allocations_billId_fkey";
ALTER TABLE IF EXISTS "bill_allocations" ADD CONSTRAINT "bill_allocations_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bank_transactions" DROP CONSTRAINT IF EXISTS "bank_transactions_bankAccountId_fkey";
ALTER TABLE IF EXISTS "bank_transactions" ADD CONSTRAINT "bank_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bank_transactions" DROP CONSTRAINT IF EXISTS "bank_transactions_journalEntryId_fkey";
ALTER TABLE IF EXISTS "bank_transactions" ADD CONSTRAINT "bank_transactions_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bank_reconciliations" DROP CONSTRAINT IF EXISTS "bank_reconciliations_bankAccountId_fkey";
ALTER TABLE IF EXISTS "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "bank_reconciliations" DROP CONSTRAINT IF EXISTS "bank_reconciliations_reconciledBy_fkey";
ALTER TABLE IF EXISTS "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_reconciledBy_fkey" FOREIGN KEY ("reconciledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "tax_transactions" DROP CONSTRAINT IF EXISTS "tax_transactions_taxTypeId_fkey";
ALTER TABLE IF EXISTS "tax_transactions" ADD CONSTRAINT "tax_transactions_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "master_tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_billId_fkey";
ALTER TABLE IF EXISTS "journal_entries" ADD CONSTRAINT "journal_entries_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_salesInvoiceId_fkey";
ALTER TABLE IF EXISTS "journal_entries" ADD CONSTRAINT "journal_entries_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "sales_invoices" DROP CONSTRAINT IF EXISTS "sales_invoices_customerId_fkey";
ALTER TABLE IF EXISTS "sales_invoices" ADD CONSTRAINT "sales_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "sales_invoice_line_items" DROP CONSTRAINT IF EXISTS "sales_invoice_line_items_invoiceId_fkey";
ALTER TABLE IF EXISTS "sales_invoice_line_items" ADD CONSTRAINT "sales_invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ar_receipts" DROP CONSTRAINT IF EXISTS "ar_receipts_customerId_fkey";
ALTER TABLE IF EXISTS "ar_receipts" ADD CONSTRAINT "ar_receipts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ar_receipts" DROP CONSTRAINT IF EXISTS "ar_receipts_invoiceId_fkey";
ALTER TABLE IF EXISTS "ar_receipts" ADD CONSTRAINT "ar_receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ar_receipts" DROP CONSTRAINT IF EXISTS "ar_receipts_bankAccountId_fkey";
ALTER TABLE IF EXISTS "ar_receipts" ADD CONSTRAINT "ar_receipts_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "depreciation_schedules" DROP CONSTRAINT IF EXISTS "depreciation_schedules_assetId_fkey";
ALTER TABLE IF EXISTS "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "asset_transfers" DROP CONSTRAINT IF EXISTS "asset_transfers_assetId_fkey";
ALTER TABLE IF EXISTS "asset_transfers" ADD CONSTRAINT "asset_transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "asset_disposals" DROP CONSTRAINT IF EXISTS "asset_disposals_assetId_fkey";
ALTER TABLE IF EXISTS "asset_disposals" ADD CONSTRAINT "asset_disposals_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "client_escrows" DROP CONSTRAINT IF EXISTS "client_escrows_customerId_fkey";
ALTER TABLE IF EXISTS "client_escrows" ADD CONSTRAINT "client_escrows_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "employees" DROP CONSTRAINT IF EXISTS "employees_managerId_fkey";
ALTER TABLE IF EXISTS "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "lead_captures" DROP CONSTRAINT IF EXISTS "lead_captures_assignedTo_fkey";
ALTER TABLE IF EXISTS "lead_captures" ADD CONSTRAINT "lead_captures_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "lead_validation_logs" DROP CONSTRAINT IF EXISTS "lead_validation_logs_leadId_fkey";
ALTER TABLE IF EXISTS "lead_validation_logs" ADD CONSTRAINT "lead_validation_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "lead_messages" DROP CONSTRAINT IF EXISTS "lead_messages_leadId_fkey";
ALTER TABLE IF EXISTS "lead_messages" ADD CONSTRAINT "lead_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "lead_attributes" DROP CONSTRAINT IF EXISTS "lead_attributes_leadId_fkey";
ALTER TABLE IF EXISTS "lead_attributes" ADD CONSTRAINT "lead_attributes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_projectId_fkey";
ALTER TABLE IF EXISTS "marketing_tasks" ADD CONSTRAINT "marketing_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_picId_fkey";
ALTER TABLE IF EXISTS "marketing_tasks" ADD CONSTRAINT "marketing_tasks_picId_fkey" FOREIGN KEY ("picId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_reviewerId_fkey";
ALTER TABLE IF EXISTS "marketing_tasks" ADD CONSTRAINT "marketing_tasks_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_tasks" DROP CONSTRAINT IF EXISTS "marketing_tasks_assignedById_fkey";
ALTER TABLE IF EXISTS "marketing_tasks" ADD CONSTRAINT "marketing_tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_histories" DROP CONSTRAINT IF EXISTS "marketing_task_histories_taskId_fkey";
ALTER TABLE IF EXISTS "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_histories" DROP CONSTRAINT IF EXISTS "marketing_task_histories_byId_fkey";
ALTER TABLE IF EXISTS "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_byId_fkey" FOREIGN KEY ("byId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP CONSTRAINT IF EXISTS "marketing_task_attachments_taskId_fkey";
ALTER TABLE IF EXISTS "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_attachments" DROP CONSTRAINT IF EXISTS "marketing_task_attachments_uploadedById_fkey";
ALTER TABLE IF EXISTS "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_comments" DROP CONSTRAINT IF EXISTS "marketing_task_comments_taskId_fkey";
ALTER TABLE IF EXISTS "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_task_comments" DROP CONSTRAINT IF EXISTS "marketing_task_comments_authorId_fkey";
ALTER TABLE IF EXISTS "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "marketing_projects" DROP CONSTRAINT IF EXISTS "marketing_projects_ownerId_fkey";
ALTER TABLE IF EXISTS "marketing_projects" ADD CONSTRAINT "marketing_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "social_checklist_items" DROP CONSTRAINT IF EXISTS "social_checklist_items_postId_fkey";
ALTER TABLE IF EXISTS "social_checklist_items" ADD CONSTRAINT "social_checklist_items_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "warehouse_access" DROP CONSTRAINT IF EXISTS "warehouse_access_userId_fkey";
ALTER TABLE IF EXISTS "warehouse_access" ADD CONSTRAINT "warehouse_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "warehouse_access" DROP CONSTRAINT IF EXISTS "warehouse_access_warehouseId_fkey";
ALTER TABLE IF EXISTS "warehouse_access" ADD CONSTRAINT "warehouse_access_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "warehouse_access" DROP CONSTRAINT IF EXISTS "warehouse_access_grantedBy_fkey";
ALTER TABLE IF EXISTS "warehouse_access" ADD CONSTRAINT "warehouse_access_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "work_orders" DROP CONSTRAINT IF EXISTS "work_orders_leadId_fkey";
ALTER TABLE IF EXISTS "work_orders" ADD CONSTRAINT "work_orders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "work_orders" DROP CONSTRAINT IF EXISTS "work_orders_planId_fkey";
ALTER TABLE IF EXISTS "work_orders" ADD CONSTRAINT "work_orders_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "qc_audits" DROP CONSTRAINT IF EXISTS "qc_audits_stepLogId_fkey";
ALTER TABLE IF EXISTS "qc_audits" ADD CONSTRAINT "qc_audits_stepLogId_fkey" FOREIGN KEY ("stepLogId") REFERENCES "production_step_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "material_items" DROP CONSTRAINT IF EXISTS "material_items_primaryUnitId_fkey";
ALTER TABLE IF EXISTS "material_items" ADD CONSTRAINT "material_items_primaryUnitId_fkey" FOREIGN KEY ("primaryUnitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "emergency_purchase_requests" DROP CONSTRAINT IF EXISTS "emergency_purchase_requests_materialId_fkey";
ALTER TABLE IF EXISTS "emergency_purchase_requests" ADD CONSTRAINT "emergency_purchase_requests_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "emergency_purchase_requests" DROP CONSTRAINT IF EXISTS "emergency_purchase_requests_requestedById_fkey";
ALTER TABLE IF EXISTS "emergency_purchase_requests" ADD CONSTRAINT "emergency_purchase_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "product_supplier_history" DROP CONSTRAINT IF EXISTS "product_supplier_history_productId_fkey";
ALTER TABLE IF EXISTS "product_supplier_history" ADD CONSTRAINT "product_supplier_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "product_supplier_history" DROP CONSTRAINT IF EXISTS "product_supplier_history_supplierId_fkey";
ALTER TABLE IF EXISTS "product_supplier_history" ADD CONSTRAINT "product_supplier_history_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

