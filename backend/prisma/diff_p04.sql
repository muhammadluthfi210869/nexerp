-- CreateEnum
CREATE TYPE "LogActivityType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PAGE_VIEW', 'STATE_TRANSITION', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('IDEA', 'SCRIPTING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HppStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StateEventTrigger" AS ENUM ('SO_CREATED', 'PO_CREATED', 'INVOICE_ISSUED', 'JOURNAL_POSTED', 'PAYMENT_RECEIVED', 'PAYMENT_SENT', 'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'PERIOD_LOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'SAMPLE_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE 'DOWN_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE 'FINAL_PAYMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "CrmStage_new" AS ENUM ('LEADS_MASUK', 'FOLLOW_UP', 'INTERESTED', 'DEAL_NEGOTIATION', 'DEAL_WON', 'DEAL_LOST', 'NURTURING');
ALTER TABLE "public"."crm_leads" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "crm_leads" ALTER COLUMN "stage" TYPE "CrmStage_new" USING ("stage"::text::"CrmStage_new");
ALTER TYPE "CrmStage" RENAME TO "CrmStage_old";
ALTER TYPE "CrmStage_new" RENAME TO "CrmStage";
DROP TYPE "public"."CrmStage_old";
ALTER TABLE "crm_leads" ALTER COLUMN "stage" SET DEFAULT 'LEADS_MASUK';
COMMIT;

-- AlterEnum
ALTER TYPE "EscalationType" ADD VALUE 'SOURCE_OVERRIDE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FundRequestStatus" ADD VALUE 'PENDING_APPROVAL_DIR';
ALTER TYPE "FundRequestStatus" ADD VALUE 'APPROVED_BY_DIR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'WEBSITE';
ALTER TYPE "LeadSource" ADD VALUE 'DIRECT';
ALTER TYPE "LeadSource" ADD VALUE 'REFERRAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "POStatus" ADD VALUE 'DRAFT';
ALTER TYPE "POStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "POStatus" ADD VALUE 'APPROVED';
ALTER TYPE "POStatus" ADD VALUE 'REJECTED';
ALTER TYPE "POStatus" ADD VALUE 'RETURNED';

-- AlterEnum
ALTER TYPE "SOStatus" ADD VALUE 'LOCKED_ACTIVE';

-- AlterEnum
ALTER TYPE "SampleStage" ADD VALUE 'WAITING_FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SourceDocumentType" ADD VALUE 'PURCHASE_RETURN';
ALTER TYPE "SourceDocumentType" ADD VALUE 'WORK_ORDER';
ALTER TYPE "SourceDocumentType" ADD VALUE 'DELIVERY_ORDER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StreamEventType" ADD VALUE 'HKI_BPOM_REGISTRATION';
ALTER TYPE "StreamEventType" ADD VALUE 'STOCK_CHECK_SHORTAGE';
ALTER TYPE "StreamEventType" ADD VALUE 'STOCK_CHECK_READY';

-- AlterEnum
ALTER TYPE "TrafficSource" ADD VALUE 'FB_ORGANIC';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowStatus" ADD VALUE 'COLD';
ALTER TYPE "WorkflowStatus" ADD VALUE 'WARM';
ALTER TYPE "WorkflowStatus" ADD VALUE 'HOT';

-- DropForeignKey
ALTER TABLE "finished_goods" DROP CONSTRAINT "finished_goods_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_fundRequestId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_campaign_daily_metrics" DROP CONSTRAINT "marketing_campaign_daily_metrics_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_content_daily_metrics" DROP CONSTRAINT "marketing_content_daily_metrics_contentId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_projects" DROP CONSTRAINT "marketing_projects_ownerid_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_attachments" DROP CONSTRAINT "marketing_task_attachments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_attachments" DROP CONSTRAINT "marketing_task_attachments_task_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_attachments" DROP CONSTRAINT "marketing_task_attachments_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_comments" DROP CONSTRAINT "marketing_task_comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_comments" DROP CONSTRAINT "marketing_task_comments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_comments" DROP CONSTRAINT "marketing_task_comments_task_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_histories" DROP CONSTRAINT "marketing_task_histories_by_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_histories" DROP CONSTRAINT "marketing_task_histories_taskId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_task_histories" DROP CONSTRAINT "marketing_task_histories_task_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_tasks" DROP CONSTRAINT "marketing_tasks_assignedbyid_fkey";

-- DropForeignKey
ALTER TABLE "marketing_tasks" DROP CONSTRAINT "marketing_tasks_pic_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_tasks" DROP CONSTRAINT "marketing_tasks_projectId_fkey";

-- DropForeignKey
ALTER TABLE "marketing_tasks" DROP CONSTRAINT "marketing_tasks_projectid_fkey";

-- DropForeignKey
ALTER TABLE "marketing_tasks" DROP CONSTRAINT "marketing_tasks_reviewerid_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_materialInventoryId_fkey";

-- DropForeignKey
ALTER TABLE "mkt_proto_task_comments" DROP CONSTRAINT "mkt_proto_task_comments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "mkt_proto_task_histories" DROP CONSTRAINT "mkt_proto_task_histories_taskId_fkey";

-- DropForeignKey
ALTER TABLE "production_material_usages" DROP CONSTRAINT "production_material_usages_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "production_material_usages" DROP CONSTRAINT "production_material_usages_materialId_fkey";

-- DropForeignKey
ALTER TABLE "production_material_usages" DROP CONSTRAINT "production_material_usages_planId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_requestId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_request_items" DROP CONSTRAINT "purchase_request_items_requirementItemId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_requirementId_fkey";

-- DropForeignKey
ALTER TABLE "qc_audits" DROP CONSTRAINT "qc_audits_stepLogId_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_amendments" DROP CONSTRAINT "sales_order_amendments_changedById_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_amendments" DROP CONSTRAINT "sales_order_amendments_salesOrderId_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "sample_revisions" DROP CONSTRAINT "sample_revisions_materialItemId_fkey";

-- DropForeignKey
ALTER TABLE "sample_revisions" DROP CONSTRAINT "sample_revisions_sampleRequestId_fkey";

-- DropForeignKey
ALTER TABLE "self_qr_history_runs" DROP CONSTRAINT "self_qr_history_runs_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "self_qr_normalized_events" DROP CONSTRAINT "self_qr_normalized_events_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "shipment_consumed_lots" DROP CONSTRAINT "shipment_consumed_lots_shipmentItemId_fkey";

-- DropForeignKey
ALTER TABLE "social_checklist_items" DROP CONSTRAINT "social_checklist_items_postId_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_leadId_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_planId_fkey";

-- DropIndex
DROP INDEX "crm_leads_assignedAgentId_createdAt_idx";

-- DropIndex
DROP INDEX "crm_leads_assignedToId_stage_idx";

-- DropIndex
DROP INDEX "crm_leads_sourceChannel_createdAt_idx";

-- DropIndex
DROP INDEX "crm_leads_source_idx";

-- DropIndex
DROP INDEX "crm_leads_stage_createdAt_idx";

-- DropIndex
DROP INDEX "finished_goods_formulaId_idx";

-- DropIndex
DROP INDEX "goods_requirements_salesOrderId_salesOrderVersion_idx";

-- DropIndex
DROP INDEX "goods_requirements_salesOrderId_salesOrderVersion_key";

-- DropIndex
DROP INDEX "guestbook_events_approvalStatus_createdAt_idx";

-- DropIndex
DROP INDEX "journal_entries_fundRequestId_key";

-- DropIndex
DROP INDEX "lead_audits_action_createdAt_idx";

-- DropIndex
DROP INDEX "marketing_projects_projectcode_key";

-- DropIndex
DROP INDEX "marketing_task_attachments_task_id_idx";

-- DropIndex
DROP INDEX "marketing_task_comments_task_id_idx";

-- DropIndex
DROP INDEX "marketing_task_histories_task_id_idx";

-- DropIndex
DROP INDEX "marketing_tasks_assignedbyid_idx";

-- DropIndex
DROP INDEX "marketing_tasks_pic_id_idx";

-- DropIndex
DROP INDEX "marketing_tasks_projectid_idx";

-- DropIndex
DROP INDEX "marketing_tasks_reviewerid_idx";

-- DropIndex
DROP INDEX "marketing_tasks_taskcode_key";

-- DropIndex
DROP INDEX "purchase_orders_requestId_key";

-- DropIndex
DROP INDEX "purchase_requests_requirementId_idempotencyKey_key";

-- DropIndex
DROP INDEX "purchase_requests_requirementId_idx";

-- DropIndex
DROP INDEX "regulatory_pipelines_lead_sample_type_key";

-- AlterTable
ALTER TABLE "campaign_okrs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "communication_attachments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "communication_mentions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "communication_thread_replies" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "communication_threads" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_leads" DROP COLUMN "assignedAgentId",
DROP COLUMN "assignedAgentName",
DROP COLUMN "sourceChannel",
DROP COLUMN "sourceRaw",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "daily_ads_metrics" ALTER COLUMN "campaignName" SET NOT NULL,
ALTER COLUMN "campaignName" SET DEFAULT 'General';

-- AlterTable
ALTER TABLE "finished_goods" DROP COLUMN "availability",
DROP COLUMN "formulaId",
DROP COLUMN "formulaVersionSnapshot",
DROP COLUMN "lotNumber",
DROP COLUMN "postedCommandKey",
DROP COLUMN "qcStatus";

-- AlterTable
ALTER TABLE "formula_items" DROP COLUMN "dummyName",
DROP COLUMN "dummyPrice",
DROP COLUMN "isDummy";

-- AlterTable
ALTER TABLE "goods_requirement_items" DROP COLUMN "dosagePercentage",
DROP COLUMN "uom";

-- AlterTable
ALTER TABLE "goods_requirements" DROP COLUMN "formulaId",
DROP COLUMN "formulaVersion",
DROP COLUMN "salesOrderVersion",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "guestbook_events" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inbound_items" DROP COLUMN "expDate",
DROP COLUMN "inventoryId",
DROP COLUMN "lotNumber";

-- AlterTable
ALTER TABLE "inventory_transactions" DROP COLUMN "commandKey";

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "category",
DROP COLUMN "direction",
DROP COLUMN "fundRequestId",
DROP COLUMN "sourceDocumentId",
DROP COLUMN "sourceEntityId",
DROP COLUMN "sourceEntityType",
ADD COLUMN     "billId" UUID,
ADD COLUMN     "salesInvoiceId" UUID;

-- AlterTable
ALTER TABLE "kpi_point_logs" DROP COLUMN "referenceId";

-- AlterTable
ALTER TABLE "kpi_scores" DROP COLUMN "evaluationPeriod";

-- AlterTable
ALTER TABLE "landing_page_conversions" ALTER COLUMN "visitId" SET DATA TYPE TEXT,
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
ALTER TABLE "landing_page_visits" ALTER COLUMN "pageTitle" SET DATA TYPE TEXT,
ALTER COLUMN "utmSource" SET DATA TYPE TEXT,
ALTER COLUMN "utmMedium" SET DATA TYPE TEXT,
ALTER COLUMN "utmCampaign" SET DATA TYPE TEXT,
ALTER COLUMN "utmContent" SET DATA TYPE TEXT,
ALTER COLUMN "utmTerm" SET DATA TYPE TEXT,
ALTER COLUMN "visitorId" SET DATA TYPE TEXT,
ALTER COLUMN "ipAddress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "lead_attributes" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lead_audits" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lead_captures" DROP COLUMN "waName",
ADD COLUMN     "aiIntent" VARCHAR(50),
ADD COLUMN     "approvalNeeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extractedFullName" VARCHAR(255),
ADD COLUMN     "firstValidatedAt" TIMESTAMP(3),
ADD COLUMN     "kommoFirstResponseSec" INTEGER,
ADD COLUMN     "kommoTalkIsInWork" BOOLEAN,
ADD COLUMN     "kommoTalkIsRead" BOOLEAN,
ADD COLUMN     "kommoTalkOrigin" VARCHAR(100),
ADD COLUMN     "kommoTalkStatus" VARCHAR(50),
ADD COLUMN     "nameConfidence" DOUBLE PRECISION,
ADD COLUMN     "nameMatch" BOOLEAN,
ADD COLUMN     "outboundReplyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "waProfileName" VARCHAR(255),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lead_timeline_logs" DROP COLUMN "newStage",
DROP COLUMN "previousStage";

-- AlterTable
ALTER TABLE "marketing_projects" DROP COLUMN "created_at",
DROP COLUMN "ownerid",
DROP COLUMN "projectcode",
DROP COLUMN "startdate",
DROP COLUMN "updated_at",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "projectCode" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "marketing_task_attachments" DROP COLUMN "created_at",
DROP COLUMN "size_kb",
DROP COLUMN "task_id",
DROP COLUMN "uploaded_by_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "path" DROP DEFAULT,
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE "marketing_task_comments" DROP COLUMN "author_id",
DROP COLUMN "created_at",
DROP COLUMN "task_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "body" SET NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE "marketing_task_histories" DROP COLUMN "by_id",
DROP COLUMN "from_status",
DROP COLUMN "task_id",
DROP COLUMN "to_status",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "at" SET NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL,
ALTER COLUMN "toStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "marketing_tasks" DROP COLUMN "actualhours",
DROP COLUMN "assignedbyid",
DROP COLUMN "checklistdone",
DROP COLUMN "checklisttotal",
DROP COLUMN "completedat",
DROP COLUMN "created_at",
DROP COLUMN "duedate",
DROP COLUMN "estimatedhours",
DROP COLUMN "pic_id",
DROP COLUMN "projectid",
DROP COLUMN "reviewerid",
DROP COLUMN "revisioncount",
DROP COLUMN "startdate",
DROP COLUMN "taskcode",
DROP COLUMN "updated_at",
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
ALTER TABLE "marketing_team_members" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "master_categories" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "material_inventories" DROP COLUMN "reservedQty";

-- AlterTable
ALTER TABLE "material_items" DROP COLUMN "isDummy",
ADD COLUMN     "autoCalculatedHpp" DOUBLE PRECISION,
ADD COLUMN     "bahanType" TEXT,
ADD COLUMN     "conditionNotes" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "manualOverrideHpp" DOUBLE PRECISION,
ADD COLUMN     "physicalForm" TEXT,
ADD COLUMN     "primaryUnitId" UUID;

-- AlterTable
ALTER TABLE "material_requisition_headers" DROP COLUMN "issueCommandKey",
DROP COLUMN "returnCommandKey",
DROP COLUMN "status",
ADD COLUMN     "status" "RequisitionHeaderStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "material_requisition_items" DROP COLUMN "qtyIssued",
DROP COLUMN "qtyReturned";

-- AlterTable
ALTER TABLE "material_requisitions" DROP COLUMN "materialInventoryId";

-- AlterTable
ALTER TABLE "meta_account_configs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "omni_crm_states" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payrolls" DROP COLUMN "period";

-- AlterTable
ALTER TABLE "production_logs" DROP COLUMN "executionCommandKey",
DROP COLUMN "stage",
ADD COLUMN     "stage" "LifecycleStatus" NOT NULL;

-- AlterTable
ALTER TABLE "production_plans" DROP COLUMN "formulaVersionSnapshot",
DROP COLUMN "status",
ADD COLUMN     "status" "LifecycleStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "purchase_order_items" DROP COLUMN "taxType",
ADD COLUMN     "qtyBagus" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyReject" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyRounded" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'PO';

-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "currency",
DROP COLUMN "requestId",
ADD COLUMN     "discountManual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discountRounding" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "purchase_request_items" DROP COLUMN "requirementItemId";

-- AlterTable
ALTER TABLE "purchase_requests" DROP COLUMN "idempotencyKey",
DROP COLUMN "requirementId",
DROP COLUMN "priority",
ADD COLUMN     "priority" "PRPriority" NOT NULL DEFAULT 'MEDIUM',
DROP COLUMN "status",
ADD COLUMN     "status" "PRStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "qc_audits" ALTER COLUMN "stepLogId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "qc_checklists" ADD COLUMN     "salesOrderId" UUID;

-- AlterTable
ALTER TABLE "regulatory_pipelines" ALTER COLUMN "legalPicId" SET NOT NULL;

-- AlterTable
ALTER TABLE "round_robin_agents" DROP COLUMN "externalKey",
DROP COLUMN "userId",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "round_robin_state" DROP CONSTRAINT "round_robin_state_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "round_robin_state_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sales_leads" DROP COLUMN "followUpStatus",
DROP COLUMN "leadState",
DROP COLUMN "stage";

-- AlterTable
ALTER TABLE "sales_order_items" DROP COLUMN "taxType";

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "committedAt",
DROP COLUMN "formulaId",
DROP COLUMN "idempotencyKey",
DROP COLUMN "taxType",
DROP COLUMN "version";

-- AlterTable
ALTER TABLE "sample_requests" DROP COLUMN "bpomProgress",
DROP COLUMN "halalProgress",
DROP COLUMN "hkiProgress",
DROP COLUMN "legalApplicability",
DROP COLUMN "legalType",
DROP COLUMN "logoRevision",
DROP COLUMN "productionStatus";

-- AlterTable
ALTER TABLE "social_checklist_items" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "social_posts" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "warehouse_inbounds" DROP COLUMN "idempotencyKey",
DROP COLUMN "reversalReason",
DROP COLUMN "reversedAt",
DROP COLUMN "supplierReference";

-- AlterTable
ALTER TABLE "work_orders" DROP COLUMN "stage",
ADD COLUMN     "stage" "LifecycleStatus" NOT NULL DEFAULT 'WAITING_MATERIAL';

-- DropTable
DROP TABLE "marketing_attributions";

-- DropTable
DROP TABLE "marketing_campaign_daily_metrics";

-- DropTable
DROP TABLE "marketing_campaigns";

-- DropTable
DROP TABLE "marketing_connections";

-- DropTable
DROP TABLE "marketing_content";

-- DropTable
DROP TABLE "marketing_content_daily_metrics";

-- DropTable
DROP TABLE "marketing_search_daily_metrics";

-- DropTable
DROP TABLE "marketing_sync_runs";

-- DropTable
DROP TABLE "mkt_proto_notifications";

-- DropTable
DROP TABLE "mkt_proto_profiles";

-- DropTable
DROP TABLE "mkt_proto_projects";

-- DropTable
DROP TABLE "mkt_proto_settings";

-- DropTable
DROP TABLE "mkt_proto_task_comments";

-- DropTable
DROP TABLE "mkt_proto_task_histories";

-- DropTable
DROP TABLE "mkt_proto_tasks";

-- DropTable
DROP TABLE "production_material_usages";

-- DropTable
DROP TABLE "rnd_daily_tasks";

-- DropTable
DROP TABLE "rnd_failed_trials";

-- DropTable
DROP TABLE "rnd_head_tracker";

-- DropTable
DROP TABLE "rnd_monthly_kpi";

-- DropTable
DROP TABLE "rnd_projects";

-- DropTable
DROP TABLE "rnd_weekly_performance";

-- DropTable
DROP TABLE "sales_order_amendments";

-- DropTable
DROP TABLE "sample_revisions";

-- DropTable
DROP TABLE "self_qr_devices";

-- DropTable
DROP TABLE "self_qr_history_runs";

-- DropTable
DROP TABLE "self_qr_normalized_events";

-- DropTable
DROP TABLE "shipment_consumed_lots";

-- DropEnum
DROP TYPE "CrmKpiWindow";

-- DropEnum
DROP TYPE "FollowUpStatus";

-- DropEnum
DROP TYPE "LeadState";

-- DropEnum
DROP TYPE "LegalApplicability";

-- DropEnum
DROP TYPE "MktProtoBrand";

-- DropEnum
DROP TYPE "MktProtoPriority";

-- DropEnum
DROP TYPE "MktProtoSla";

-- DropEnum
DROP TYPE "MktProtoTaskStatus";

-- DropEnum
DROP TYPE "PipelineStage";

-- DropEnum
DROP TYPE "ProdStatus";

-- DropEnum
DROP TYPE "RndProjectStatus";

-- DropEnum
DROP TYPE "SelfQrDeviceStatus";

-- DropEnum
DROP TYPE "SelfQrEventSource";

-- DropEnum
DROP TYPE "SelfQrIdentityStatus";

-- DropEnum
DROP TYPE "SelfQrTimestampStatus";

-- DropEnum
DROP TYPE "WorkOrderStage";

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
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_createdAt_idx" ON "activity_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "bills"("billNumber");

-- CreateIndex
CREATE INDEX "bills_vendorId_paymentStatus_idx" ON "bills"("vendorId", "paymentStatus");

-- CreateIndex
CREATE INDEX "bills_dueDate_paymentStatus_idx" ON "bills"("dueDate", "paymentStatus");

-- CreateIndex
CREATE INDEX "bill_line_items_billId_idx" ON "bill_line_items"("billId");

-- CreateIndex
CREATE INDEX "bill_match_results_billId_idx" ON "bill_match_results"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "down_payments_dpNumber_key" ON "down_payments"("dpNumber");

-- CreateIndex
CREATE INDEX "down_payments_vendorId_status_idx" ON "down_payments"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ap_payments_paymentNumber_key" ON "ap_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "ap_payments_vendorId_paymentDate_idx" ON "ap_payments"("vendorId", "paymentDate");

-- CreateIndex
CREATE INDEX "bill_allocations_billId_idx" ON "bill_allocations"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_allocations_paymentId_billId_key" ON "bill_allocations"("paymentId", "billId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_accountCode_key" ON "bank_accounts"("accountCode");

-- CreateIndex
CREATE INDEX "bank_transactions_bankAccountId_date_idx" ON "bank_transactions"("bankAccountId", "date");

-- CreateIndex
CREATE INDEX "bank_transactions_sourceType_sourceId_idx" ON "bank_transactions"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "bank_reconciliations_bankAccountId_periodStart_periodEnd_idx" ON "bank_reconciliations"("bankAccountId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "tax_transactions_sourceType_sourceId_idx" ON "tax_transactions"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "tax_transactions_status_taxTypeId_idx" ON "tax_transactions"("status", "taxTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoices_invoiceNumber_key" ON "sales_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "sales_invoices_customerId_paymentStatus_idx" ON "sales_invoices"("customerId", "paymentStatus");

-- CreateIndex
CREATE INDEX "sales_invoices_dueDate_paymentStatus_idx" ON "sales_invoices"("dueDate", "paymentStatus");

-- CreateIndex
CREATE INDEX "sales_invoice_line_items_invoiceId_idx" ON "sales_invoice_line_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ar_receipts_receiptNumber_key" ON "ar_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "ar_receipts_customerId_receiptDate_idx" ON "ar_receipts"("customerId", "receiptDate");

-- CreateIndex
CREATE UNIQUE INDEX "sample_fees_feeNumber_key" ON "sample_fees"("feeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_assetNumber_key" ON "fixed_assets"("assetNumber");

-- CreateIndex
CREATE INDEX "depreciation_schedules_assetId_idx" ON "depreciation_schedules"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "depreciation_schedules_assetId_period_key" ON "depreciation_schedules"("assetId", "period");

-- CreateIndex
CREATE INDEX "asset_transfers_assetId_idx" ON "asset_transfers"("assetId");

-- CreateIndex
CREATE INDEX "asset_disposals_assetId_idx" ON "asset_disposals"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "intangible_assets_assetNumber_key" ON "intangible_assets"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "period_locks_period_key" ON "period_locks"("period");

-- CreateIndex
CREATE INDEX "closing_checklists_period_department_idx" ON "closing_checklists"("period", "department");

-- CreateIndex
CREATE UNIQUE INDEX "adjustment_journals_journalNumber_key" ON "adjustment_journals"("journalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "job_order_costings_jobOrderNumber_key" ON "job_order_costings"("jobOrderNumber");

-- CreateIndex
CREATE INDEX "cost_variances_jobOrderId_idx" ON "cost_variances"("jobOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "product_profitabilities_productId_period_key" ON "product_profitabilities"("productId", "period");

-- CreateIndex
CREATE INDEX "client_escrows_customerId_status_idx" ON "client_escrows"("customerId", "status");

-- CreateIndex
CREATE INDEX "inventory_ownerships_ownerType_idx" ON "inventory_ownerships"("ownerType");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_ownerships_materialId_warehouseId_ownerType_owner_key" ON "inventory_ownerships"("materialId", "warehouseId", "ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "lead_validation_logs_leadId_idx" ON "lead_validation_logs"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "master_units_code_key" ON "master_units"("code");

-- CreateIndex
CREATE INDEX "warehouse_access_userId_idx" ON "warehouse_access"("userId");

-- CreateIndex
CREATE INDEX "warehouse_access_warehouseId_idx" ON "warehouse_access"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_access_userId_warehouseId_key" ON "warehouse_access"("userId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "master_kodes_documentType_key" ON "master_kodes"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_purchase_requests_eprNumber_key" ON "emergency_purchase_requests"("eprNumber");

-- CreateIndex
CREATE INDEX "emergency_purchase_requests_materialId_idx" ON "emergency_purchase_requests"("materialId");

-- CreateIndex
CREATE INDEX "emergency_purchase_requests_status_idx" ON "emergency_purchase_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_supplier_history_productId_supplierId_key" ON "product_supplier_history"("productId", "supplierId");

-- CreateIndex
CREATE INDEX "crm_leads_assignedToId_createdAt_idx" ON "crm_leads"("assignedToId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nik_key" ON "employees"("nik");

-- CreateIndex
CREATE INDEX "guestbook_events_crmLeadId_createdAt_idx" ON "guestbook_events"("crmLeadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_scores_employeeId_periodId_key" ON "kpi_scores"("employeeId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_messages_msgId_key" ON "lead_messages"("msgId");

-- CreateIndex
CREATE INDEX "lead_messages_leadId_idx" ON "lead_messages"("leadId");

-- CreateIndex
CREATE INDEX "marketing_tasks_projectId_idx" ON "marketing_tasks"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "master_categories_code_key" ON "master_categories"("code");

-- CreateIndex
CREATE INDEX "production_logs_stage_idx" ON "production_logs"("stage");

-- CreateIndex
CREATE INDEX "production_plans_soId_status_idx" ON "production_plans"("soId", "status");

-- CreateIndex
CREATE INDEX "purchase_order_items_poId_idx" ON "purchase_order_items"("poId");

-- CreateIndex
CREATE INDEX "purchase_order_items_materialId_idx" ON "purchase_order_items"("materialId");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_status_idx" ON "purchase_orders"("supplierId", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "purchase_orders_leadId_idx" ON "purchase_orders"("leadId");

-- CreateIndex
CREATE INDEX "purchase_request_items_requestId_idx" ON "purchase_request_items"("requestId");

-- CreateIndex
CREATE INDEX "purchase_request_items_materialId_idx" ON "purchase_request_items"("materialId");

-- CreateIndex
CREATE INDEX "qc_checklists_salesOrderId_idx" ON "qc_checklists"("salesOrderId");

-- CreateIndex
CREATE INDEX "warehouse_inbounds_poId_idx" ON "warehouse_inbounds"("poId");

-- CreateIndex
CREATE INDEX "warehouse_inbounds_receivedAt_idx" ON "warehouse_inbounds"("receivedAt" DESC);

-- CreateIndex
CREATE INDEX "work_orders_stage_idx" ON "work_orders"("stage");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guestbook_events" ADD CONSTRAINT "guestbook_events_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_audits" ADD CONSTRAINT "lead_audits_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_match_results" ADD CONSTRAINT "bill_match_results_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "down_payments" ADD CONSTRAINT "down_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "down_payments" ADD CONSTRAINT "down_payments_appliedToBillId_fkey" FOREIGN KEY ("appliedToBillId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_payments" ADD CONSTRAINT "ap_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_payments" ADD CONSTRAINT "ap_payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_payments" ADD CONSTRAINT "ap_payments_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_allocations" ADD CONSTRAINT "bill_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ap_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_allocations" ADD CONSTRAINT "bill_allocations_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_reconciledBy_fkey" FOREIGN KEY ("reconciledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_transactions" ADD CONSTRAINT "tax_transactions_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "master_tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_line_items" ADD CONSTRAINT "sales_invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_receipts" ADD CONSTRAINT "ar_receipts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_receipts" ADD CONSTRAINT "ar_receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_receipts" ADD CONSTRAINT "ar_receipts_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_escrows" ADD CONSTRAINT "client_escrows_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_validation_logs" ADD CONSTRAINT "lead_validation_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_attributes" ADD CONSTRAINT "lead_attributes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_picId_fkey" FOREIGN KEY ("picId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_byId_fkey" FOREIGN KEY ("byId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_projects" ADD CONSTRAINT "marketing_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_checklist_items" ADD CONSTRAINT "social_checklist_items_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_access" ADD CONSTRAINT "warehouse_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_access" ADD CONSTRAINT "warehouse_access_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_access" ADD CONSTRAINT "warehouse_access_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_audits" ADD CONSTRAINT "qc_audits_stepLogId_fkey" FOREIGN KEY ("stepLogId") REFERENCES "production_step_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_primaryUnitId_fkey" FOREIGN KEY ("primaryUnitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_purchase_requests" ADD CONSTRAINT "emergency_purchase_requests_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_purchase_requests" ADD CONSTRAINT "emergency_purchase_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_supplier_history" ADD CONSTRAINT "product_supplier_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_supplier_history" ADD CONSTRAINT "product_supplier_history_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

