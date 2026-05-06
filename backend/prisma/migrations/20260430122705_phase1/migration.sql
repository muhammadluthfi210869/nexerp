-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('SKINCARE', 'BODYCARE', 'BABYCARE', 'HAIRCARE', 'DECORATIVE', 'PARFUM', 'FOOTCARE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'HEAD_OPS', 'COMMERCIAL', 'DIGIMAR', 'RND', 'COMPLIANCE', 'FINANCE', 'PURCHASING', 'PPIC', 'WAREHOUSE', 'PRODUCTION_OP', 'QC_LAB', 'HR', 'IT_SYS', 'ADMIN', 'SCM', 'PRODUCTION', 'MARKETING', 'APJ');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INSTAGRAM', 'TIKTOK', 'LINKTREE', 'GOOGLE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SAMPLE', 'NEGO', 'DEAL', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CHAT', 'CALL', 'MEETING_OFFLINE', 'MEETING_ONLINE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('WAITING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QualityStage" AS ENUM ('PROSPECT', 'SAMPLE', 'NEGOTIATION');

-- CreateEnum
CREATE TYPE "LostStage" AS ENUM ('PROSPECT', 'SAMPLE', 'NEGOTIATION');

-- CreateEnum
CREATE TYPE "LostReason" AS ENUM ('PRICE', 'QUALITY', 'COMPETITOR', 'GHOSTING', 'PRICE_ISSUE', 'UNRESPONSIVE', 'PRODUCT_MISMATCH', 'OTHER', 'MOQ_TOO_HIGH');

-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('META', 'TIKTOK', 'GOOGLE', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('ORGANIC', 'PAID_ADS');

-- CreateEnum
CREATE TYPE "TrafficSource" AS ENUM ('IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS', 'IG_ORGANIC', 'TIKTOK_ORGANIC', 'LINKTREE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('EDUCATIONAL', 'PROMOTIONAL', 'ENTERTAINMENT', 'BEHIND_THE_SCENES', 'OTHER');

-- CreateEnum
CREATE TYPE "GuestCategory" AS ENUM ('BRANDED', 'PEMULA');

-- CreateEnum
CREATE TYPE "NPFStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('DEVELOPING', 'SENT', 'REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "RegType" AS ENUM ('BPOM', 'HKI_BRAND', 'HKI_LOGO', 'HALAL');

-- CreateEnum
CREATE TYPE "RegStage" AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATION', 'REVISION', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SOStatus" AS ENUM ('PENDING_DP', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'READY_TO_PRODUCE');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('DP', 'FINAL_PAYMENT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('RAW_MATERIAL', 'PACKAGING', 'LABEL', 'BOX');

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('GR', 'KG', 'PCS', 'ML');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('ORDERED', 'SHIPPED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InboundStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProdStatus" AS ENUM ('PLANNING', 'READY', 'ON_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ProdStage" AS ENUM ('BATCHING', 'MIXING', 'FILLING', 'PACKING');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('GOOD', 'QUARANTINE', 'REJECT');

-- CreateEnum
CREATE TYPE "WorkOrderStage" AS ENUM ('WAITING_MATERIAL', 'WAITING_PROCUREMENT', 'MIXING', 'FILLING', 'PACKING', 'PENDING_QC', 'QC_HOLD', 'REWORK', 'FINISHED_GOODS', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipStatus" AS ENUM ('PACKING', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('WAITING', 'NOTIFIED', 'REORDERED', 'CHURNED');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('BD', 'RND', 'FINANCE', 'SCM', 'LEGAL', 'WAREHOUSE', 'PRODUCTION', 'QC', 'MANAGEMENT', 'SYSTEM', 'CREATIVE');

-- CreateEnum
CREATE TYPE "StreamEventType" AS ENUM ('GATE_OPENED', 'GATE_BLOCKED', 'MANUAL_LOG', 'OVERRIDE', 'STATE_CHANGE', 'SLA_BREACH', 'HANDOVER', 'CRITICAL_DELAY');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('READY', 'SHORTAGE', 'PENDING_CHECK');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('IN_PROGRESS', 'DONE', 'REJECTED');

-- CreateEnum
CREATE TYPE "HkiStage" AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATION', 'REVISION', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "BpomStage" AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATION', 'REVISION', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AuditRiskLevel" AS ENUM ('OK', 'DELAY_AUDIT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('MIXING_MACHINE', 'FILLING_MACHINE', 'PACKING_MACHINE');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NEW_LEAD', 'CONTACTED', 'NEGOTIATION', 'SAMPLE_PROCESS', 'SAMPLE_REVISION', 'SAMPLE_APPROVED', 'SPK_SIGNED', 'PRODUCTION_PROCESS', 'READY_TO_SHIP', 'WON_DEAL', 'LOST', 'DP_PRODUCTION');

-- CreateEnum
CREATE TYPE "RejectReason" AS ENUM ('FORMULA_FAILED', 'CONTAMINATION', 'PACKAGING_DEFECT', 'OPERATOR_ERROR', 'MACHINE_FAILURE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PREPAID', 'PARTIAL', 'CREDIT');

-- CreateEnum
CREATE TYPE "HkiMode" AS ENUM ('NEW', 'EXISTING');

-- CreateEnum
CREATE TYPE "LeadState" AS ENUM ('ACTIVE', 'LOST', 'ABORTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('FOLLOW_UP', 'PRESENTATION', 'SAMPLE_SEND', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'CONTRACT', 'PROBATION');

-- CreateEnum
CREATE TYPE "SampleStage" AS ENUM ('QUEUE', 'FORMULATING', 'LAB_TEST', 'READY_TO_SHIP', 'SHIPPED', 'RECEIVED', 'CLIENT_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('NOT_FOLLOWED_UP', 'FU_1', 'FU_2', 'FU_3');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('AMBIENT', 'COOL_ROOM', 'FLAMMABLE', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL_MOVE', 'ADJUSTMENT', 'DISPOSAL', 'RETURN');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'ISSUED', 'SHORTAGE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "FundRequestStatus" AS ENUM ('PENDING_APPROVAL_MGR', 'APPROVED_BY_MGR', 'WAITING_FINANCE_DISBURSEMENT', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportGroup" AS ENUM ('CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'EQUITY', 'OPERATING_REVENUE', 'OTHER_REVENUE', 'COGS', 'OPEX', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "InvoiceCategory" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "SourceDocumentType" AS ENUM ('SALES_ORDER', 'PURCHASE_ORDER', 'PAYMENT', 'STOCK_ADJUSTMENT', 'SALES_RETURN', 'PRODUCTION_PLAN', 'MATERIAL_REQUISITION');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'SOFT_LOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FormulaStatus" AS ENUM ('DRAFT', 'WAITING_APPROVAL', 'SAMPLE_LOCKED', 'PRODUCTION_LOCKED', 'SUPERSEDED', 'MINOR_COMPLIANCE_FIX', 'BPOM_REGISTRATION_PROCESS', 'REVISION_REQUIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('ALLOWED', 'RESTRICTED', 'PROHIBITED', 'COLORANT', 'PRESERVATIVE', 'UV_FILTER');

-- CreateEnum
CREATE TYPE "ClaimRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "OutboundMethod" AS ENUM ('FIFO', 'FEFO');

-- CreateEnum
CREATE TYPE "LaborGrade" AS ENUM ('GRADE_A', 'GRADE_B', 'GRADE_C');

-- CreateEnum
CREATE TYPE "EscalationType" AS ENUM ('VENDOR_BLACKLIST_PO', 'FTY_THRESHOLD_BREACH', 'SPOILAGE_RISK_OVERRIDE', 'QC_GATE_BYPASS');

-- CreateEnum
CREATE TYPE "DesignState" AS ENUM ('INBOX', 'IN_PROGRESS', 'WAITING_APJ', 'WAITING_CLIENT', 'REVISION', 'LOCKED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('LEAVE', 'OVERTIME', 'REIMBURSE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'AUTHORIZED', 'PAID');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('ON_TIME', 'LATE', 'OUTSIDE_GEOFENCE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "roles" "UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "managerPin" TEXT,
    "approvalPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "laborGrade" "LaborGrade",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_leads" (
    "id" UUID NOT NULL,
    "clientName" TEXT NOT NULL,
    "brandName" TEXT,
    "contactInfo" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "productInterest" TEXT NOT NULL,
    "estimatedValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "stage" "PipelineStage" NOT NULL DEFAULT 'NEW_LEAD',
    "lostReason" "LostReason",
    "picId" UUID NOT NULL,
    "isRepeatOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "hkiMode" "HkiMode" NOT NULL DEFAULT 'NEW',
    "leadState" "LeadState" NOT NULL DEFAULT 'ACTIVE',
    "paymentType" "PaymentType" NOT NULL DEFAULT 'PREPAID',
    "lastFollowUpAt" TIMESTAMP(3),
    "marginPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "moq" INTEGER NOT NULL DEFAULT 0,
    "planOmset" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "categoryEnum" "ProductCategory",
    "categoryId" UUID,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "addressDetail" TEXT,
    "campaignName" TEXT,
    "isHighValue" BOOLEAN NOT NULL DEFAULT false,
    "slaStart" TIMESTAMP(6),
    "bdId" UUID,
    "email" TEXT,
    "contactChannel" TEXT,
    "launchingPlan" TEXT,
    "targetMarket" TEXT,
    "designSuggestion" TEXT,
    "hkiProgress" TEXT,
    "logoRevision" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "packagingSuggestion" TEXT,
    "sku" TEXT,
    "unitPrice" DECIMAL(15,2),
    "valueSuggestion" TEXT,
    "convertedToProdAt" TIMESTAMP(3),
    "convertedToSampleAt" TIMESTAMP(3),
    "firstFollowUpAt" TIMESTAMP(3),
    "followUpStatus" "FollowUpStatus" NOT NULL DEFAULT 'NOT_FOLLOWED_UP',
    "isEmergencyOverride" BOOLEAN NOT NULL DEFAULT false,
    "lastStageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "overrideNote" TEXT,
    "statusDuration" INTEGER NOT NULL DEFAULT 0,
    "wonAt" TIMESTAMP(3),
    "formulaId" TEXT,
    "isFormulaLocked" BOOLEAN NOT NULL DEFAULT false,
    "spkFileUrl" TEXT,

    CONSTRAINT "sales_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "notes" TEXT NOT NULL,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(15,2),
    "fileUrl" TEXT,
    "fileUrlSecondary" TEXT,
    "metadata" JSONB,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" UUID,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_deals" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "bdId" UUID NOT NULL,
    "stageLost" "LostStage" NOT NULL,
    "reasonType" "LostReason" NOT NULL,
    "lostValue" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lost_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bussdev_staffs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "targetRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" UUID,
    "avgClosingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalLost" INTEGER NOT NULL DEFAULT 0,
    "totalWon" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bussdev_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_logs" (
    "id" UUID NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientName" TEXT NOT NULL,
    "bdId" UUID NOT NULL,
    "productInterest" TEXT,
    "moqPlan" INTEGER,
    "category" "GuestCategory" NOT NULL,
    "phoneNo" TEXT,
    "instansi" TEXT,
    "purpose" TEXT,
    "city" TEXT,
    "email" TEXT,
    "launchingPlan" TEXT,
    "targetMarket" TEXT,

    CONSTRAINT "guest_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_product_forms" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "targetPrice" DECIMAL(15,2) NOT NULL,
    "conceptNotes" TEXT,
    "status" "NPFStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "new_product_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "leadId" UUID NOT NULL,
    "sampleId" UUID NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "SOStatus" NOT NULL DEFAULT 'PENDING_DP',
    "salesCategory" TEXT,
    "brandName" TEXT,
    "taxType" TEXT DEFAULT 'PPN_11',
    "netto" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'PENDING_CHECK',

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL,
    "soId" TEXT NOT NULL,
    "sampleId" UUID,
    "productName" TEXT NOT NULL,
    "netto" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "taxType" TEXT NOT NULL DEFAULT 'PPN_11',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "materialItemId" UUID,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_returns" (
    "id" UUID NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soId" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "notes" TEXT NOT NULL,
    "returnStatus" TEXT NOT NULL DEFAULT 'POTONG_TAGIHAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_return_items" (
    "id" UUID NOT NULL,
    "returnId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qtyOriginal" DECIMAL(15,2) NOT NULL,
    "qtyReturned" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "sales_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_engine" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "estDepletionDate" TIMESTAMP(3),
    "status" "RetentionStatus" NOT NULL DEFAULT 'WAITING',

    CONSTRAINT "retention_engine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_timeline_logs" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "previousStage" "PipelineStage",
    "newStage" "PipelineStage",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedBy" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "lead_timeline_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_streams" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "senderDivision" "Division" NOT NULL,
    "eventType" "StreamEventType" NOT NULL,
    "payload" JSONB,
    "notes" TEXT,
    "loggedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "expectedDuration" INTEGER,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "activity_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_tasks" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "soId" TEXT,
    "brief" TEXT NOT NULL,
    "kanbanState" "DesignState" NOT NULL DEFAULT 'INBOX',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "slaDeadline" TIMESTAMP(3),
    "finalArtworkUrl" TEXT,
    "finalMockupUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_versions" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "artworkUrl" TEXT,
    "mockupUrl" TEXT,
    "printSpecs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" UUID,

    CONSTRAINT "design_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_feedbacks" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "fromDivision" "Division" NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT,
    "approvalStatus" "ApprovalStatus",
    "signatureHash" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unified_invoices" (
    "id" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "category" "InvoiceCategory" NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'FINAL_PAYMENT',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "amountDue" DECIMAL(15,2) NOT NULL,
    "outstandingAmount" DECIMAL(15,2) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "soId" TEXT,
    "poId" UUID,
    "workOrderId" UUID,
    "deliveryOrderId" UUID,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unified_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" "AccountType" NOT NULL,
    "normalBalance" "NormalBalance" NOT NULL,
    "parentId" UUID,
    "reclassifyToAccountId" UUID,
    "reportGroup" "ReportGroup" DEFAULT 'OTHER_EXPENSE',

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment_items" (
    "id" UUID NOT NULL,
    "adjustmentId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "stock_adjustment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "attachmentUrls" TEXT[],
    "sourceDocumentType" "SourceDocumentType",
    "sourceDocumentId" TEXT,
    "invoiceId" UUID,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "journalId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAccountId" UUID,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "verifiedBy" UUID NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptFileUrl" TEXT,
    "receivingAccountId" UUID,
    "attachmentUrls" TEXT[],

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_requests" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "departmentId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FundRequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL_MGR',
    "attachmentUrls" TEXT[],
    "approvedById" UUID,
    "disbursedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "baseSalary" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "contractType" "ContractType" NOT NULL DEFAULT 'CONTRACT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_role_mappings" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "division" "Division" NOT NULL,
    "roleName" TEXT NOT NULL,
    "weight" DECIMAL(3,2) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_role_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metric_definitions" (
    "id" UUID NOT NULL,
    "eventCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "division" "Division" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_point_logs" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "metricCode" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_point_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_scores" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "evaluationPeriod" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "subjectiveScore" DOUBLE PRECISION,
    "objectiveScore" DOUBLE PRECISION,
    "metricsData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "distanceFromFactory" DOUBLE PRECISION NOT NULL,
    "photoPath" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ON_TIME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "amount" TEXT,
    "attachmentPath" TEXT,
    "authorizedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDisbursement" TEXT,
    "authorizedById" UUID,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" UUID NOT NULL,
    "payrollId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "baseSalary" TEXT NOT NULL,
    "kpiIncentive" TEXT NOT NULL,
    "deductions" TEXT NOT NULL,
    "netSalary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_staffs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LEGAL_OFFICER',

    CONSTRAINT "legal_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hki_records" (
    "id" UUID NOT NULL,
    "hkiId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "picId" UUID NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "stage" "HkiStage" NOT NULL,
    "status" "LegalStatus" NOT NULL,
    "auditRisk" "AuditRiskLevel" NOT NULL,

    CONSTRAINT "hki_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpom_records" (
    "id" UUID NOT NULL,
    "bpomId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "picId" UUID NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "stage" "BpomStage" NOT NULL,
    "status" "LegalStatus" NOT NULL,
    "auditRisk" "AuditRiskLevel" NOT NULL,

    CONSTRAINT "bpom_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_timeline_logs" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStage" TEXT,
    "newStage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffName" TEXT NOT NULL,

    CONSTRAINT "legal_timeline_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_audits" (
    "id" UUID NOT NULL,
    "area" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "parameterChecklist" JSONB NOT NULL,
    "findings" TEXT,
    "remediationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "picId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_pipelines" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "sampleRequestId" UUID,
    "type" "RegType" NOT NULL,
    "currentStage" "RegStage" NOT NULL DEFAULT 'DRAFT',
    "pnbpStatus" BOOLEAN NOT NULL DEFAULT false,
    "registrationNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "daysInStage" INTEGER NOT NULL DEFAULT 0,
    "logHistory" JSONB NOT NULL DEFAULT '[]',
    "legalPicId" UUID NOT NULL,
    "materialItemId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_reviews" (
    "id" UUID NOT NULL,
    "pipelineId" UUID NOT NULL,
    "designerPicId" UUID NOT NULL,
    "artworkUrl" TEXT NOT NULL,
    "claimRisk" "ClaimRisk" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artwork_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pnbp_requests" (
    "id" UUID NOT NULL,
    "pipelineId" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "billingCode" TEXT,
    "proofOfBilling" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "financeRecordId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pnbp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_ads_metrics" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "platform" "TrafficSource" NOT NULL,
    "spend" DECIMAL(15,2) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "campaignName" TEXT,
    "isAudited" BOOLEAN NOT NULL DEFAULT false,
    "auditedById" UUID,
    "auditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_ads_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_targets" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "leadTarget" INTEGER NOT NULL DEFAULT 0,
    "postTarget" INTEGER NOT NULL DEFAULT 0,
    "revenueTarget" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientAcqTarget" INTEGER NOT NULL DEFAULT 0,
    "sampleTarget" INTEGER NOT NULL DEFAULT 0,
    "spendTarget" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "marketing_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" UUID NOT NULL,
    "publishDate" DATE NOT NULL,
    "platform" "TrafficSource" NOT NULL,
    "contentPillar" "ContentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "auditStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_health_logs" (
    "id" UUID NOT NULL,
    "platform" "TrafficSource" NOT NULL,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "followerGrowth" INTEGER NOT NULL DEFAULT 0,
    "unfollows" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "profileVisits" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "storiesCount" INTEGER NOT NULL DEFAULT 0,
    "avgStoryViews" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "savesCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "account_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_plans" (
    "id" UUID NOT NULL,
    "soId" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "batchNo" TEXT NOT NULL,
    "status" "ProdStatus" NOT NULL DEFAULT 'PLANNING',
    "apjStatus" "ApprovalStatus" NOT NULL DEFAULT 'WAITING',
    "apjNotes" TEXT,
    "apjReleasedAt" TIMESTAMP(3),
    "apjSignatureUrl" TEXT,
    "isFirstPass" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "production_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requisitions" (
    "id" UUID NOT NULL,
    "woId" UUID,
    "workOrderId" UUID,
    "materialId" UUID NOT NULL,
    "qtyRequested" DECIMAL(15,3) NOT NULL,
    "qtyIssued" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "material_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_step_logs" (
    "id" UUID NOT NULL,
    "woId" UUID NOT NULL,
    "stage" "ProdStage" NOT NULL,
    "inputQty" DECIMAL(15,3) NOT NULL,
    "qtyResult" DECIMAL(15,3) NOT NULL,
    "qtyReject" DECIMAL(15,3) NOT NULL,
    "qtyQuarantine" DECIMAL(15,3) NOT NULL,
    "shrinkageQty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_step_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_audits" (
    "id" UUID NOT NULL,
    "stepLogId" UUID NOT NULL,
    "qcId" UUID NOT NULL,
    "status" "QCStatus" NOT NULL,
    "notes" TEXT,
    "phValue" DECIMAL(5,2),
    "viscosityValue" INTEGER,
    "organoleptic" BOOLEAN,
    "samplingVolume" DECIMAL(10,2),
    "inkjetCheck" BOOLEAN,
    "sealingCheck" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_goods" (
    "id" UUID NOT NULL,
    "woId" UUID,
    "stockQty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finished_goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "planId" UUID,
    "woNumber" TEXT NOT NULL,
    "targetQty" INTEGER NOT NULL,
    "stage" "WorkOrderStage" NOT NULL DEFAULT 'WAITING_MATERIAL',
    "targetCompletion" TIMESTAMP(3) NOT NULL,
    "actualCompletion" TIMESTAMP(3),
    "actualCogs" DECIMAL(15,2),
    "targetHpp" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MachineType" NOT NULL,
    "capacityPerBatch" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastService" TIMESTAMP(3),
    "costPerHour" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_rates" (
    "id" UUID NOT NULL,
    "grade" "LaborGrade" NOT NULL,
    "hourlyRate" DECIMAL(15,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_schedules" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" UUID NOT NULL,
    "workOrderId" UUID,
    "planId" UUID,
    "stage" "WorkOrderStage" NOT NULL,
    "inputQty" DECIMAL(15,2) NOT NULL,
    "goodQty" DECIMAL(15,2) NOT NULL,
    "quarantineQty" DECIMAL(15,2) NOT NULL,
    "rejectQty" DECIMAL(15,2) NOT NULL,
    "shrinkageQty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "machineId" UUID,
    "operatorId" UUID,
    "downtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "laborCost" DECIMAL(15,2),
    "overheadCost" DECIMAL(15,2),
    "actualLaborRate" DECIMAL(10,2),
    "actualMachineRate" DECIMAL(10,2),
    "machineParams" JSONB,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "trackingNumber" TEXT,
    "courierName" TEXT,
    "shippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SHIPPED',

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reject_executions" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "materialId" UUID,
    "qty" DECIMAL(15,3) NOT NULL,
    "action" TEXT NOT NULL,
    "lossAccountId" UUID,
    "evidenceUrl" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reject_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "logisticsId" UUID NOT NULL,
    "trackingNo" TEXT,
    "status" "ShipStatus" NOT NULL DEFAULT 'PACKING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_items" (
    "id" UUID NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "materialId" UUID NOT NULL,
    "qtyOrder" DECIMAL(15,2) NOT NULL,
    "qtyShipped" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copq_records" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "materialLoss" DECIMAL(15,2) NOT NULL,
    "laborLoss" DECIMAL(15,2) NOT NULL,
    "overheadLoss" DECIMAL(15,2) NOT NULL,
    "totalLoss" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copq_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_escalations" (
    "id" UUID NOT NULL,
    "type" "EscalationType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "planId" UUID,
    "reason" TEXT NOT NULL,
    "approvedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rnd_staffs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxWeeklyCapacity" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "rnd_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_requests" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "targetFunction" TEXT NOT NULL,
    "textureReq" TEXT NOT NULL,
    "colorReq" TEXT NOT NULL,
    "aromaReq" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stage" "SampleStage" NOT NULL DEFAULT 'QUEUE',
    "picId" UUID,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "latestRevisionDate" TIMESTAMP(3),
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "suggestDesign" TEXT,
    "suggestPackaging" TEXT,
    "suggestValue" TEXT,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "pnfFileUrl" TEXT,
    "currentExpectations" TEXT,
    "feedbackHistory" JSONB DEFAULT '[]',
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clientRating" INTEGER,
    "clientComment" TEXT,
    "isApprovedByClient" BOOLEAN NOT NULL DEFAULT false,
    "targetDeadline" DATE,
    "targetHpp" DECIMAL(15,2),
    "rejectionReason" VARCHAR(100),
    "npfId" UUID,
    "rndId" UUID,
    "bpomProgress" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "halalProgress" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "hkiProgress" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "logoRevision" INTEGER NOT NULL DEFAULT 0,
    "productionStatus" "WorkOrderStage" NOT NULL DEFAULT 'WAITING_MATERIAL',

    CONSTRAINT "sample_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_stage_logs" (
    "id" UUID NOT NULL,
    "sampleRequestId" UUID NOT NULL,
    "stage" "SampleStage" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "durationDays" DOUBLE PRECISION,
    "notes" TEXT,
    "rejectionReason" VARCHAR(100),

    CONSTRAINT "sample_stage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    "sampleRequestId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedById" UUID,
    "targetYieldGram" DECIMAL(15,3) NOT NULL DEFAULT 1000.000,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FormulaStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_phases" (
    "id" UUID NOT NULL,
    "formulaId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "customName" TEXT,
    "instructions" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "formula_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_items" (
    "id" UUID NOT NULL,
    "materialId" UUID,
    "dosagePercentage" DECIMAL(10,5) NOT NULL,
    "costSnapshot" DECIMAL(15,2),
    "dummyName" TEXT,
    "dummyPrice" DECIMAL(15,2),
    "isDummy" BOOLEAN NOT NULL DEFAULT false,
    "phaseId" UUID NOT NULL,

    CONSTRAINT "formula_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_parameters" (
    "id" UUID NOT NULL,
    "formulaId" TEXT NOT NULL,
    "targetPh" TEXT,
    "targetViscosity" TEXT,
    "targetColor" TEXT,
    "targetAroma" TEXT,
    "appearance" TEXT,

    CONSTRAINT "qc_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_feedback" (
    "id" UUID NOT NULL,
    "sampleRequestId" UUID NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_revisions" (
    "id" UUID NOT NULL,
    "sampleRequestId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialItemId" UUID,

    CONSTRAINT "sample_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "id" UUID NOT NULL,
    "sampleId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantityPerUnit" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_results" (
    "id" UUID NOT NULL,
    "formulaId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testerId" UUID,
    "actualPh" TEXT,
    "actualViscosity" TEXT,
    "actualDensity" TEXT,
    "colorResult" TEXT,
    "aromaResult" TEXT,
    "textureResult" TEXT,
    "stability40C" TEXT,
    "stabilityRT" TEXT,
    "stability4C" TEXT,
    "notes" TEXT,

    CONSTRAINT "lab_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_override_logs" (
    "id" UUID NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "gateType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "authorizedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_override_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "nominalTarget" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'GENERAL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "picName" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" DECIMAL(15,2) NOT NULL,
    "currentUsage" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "type" "LocationType" NOT NULL DEFAULT 'AMBIENT',
    "warehouseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_items" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "minLevel" DECIMAL(15,2) NOT NULL,
    "maxLevel" DECIMAL(15,2) NOT NULL,
    "maxHoldHours" INTEGER DEFAULT 72,
    "reorderPoint" DECIMAL(15,2) NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "isDummy" BOOLEAN NOT NULL DEFAULT false,
    "stockQty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "code" TEXT,
    "usageUnit" TEXT,
    "outMethod" "OutboundMethod" NOT NULL DEFAULT 'FIFO',
    "leadTime" INTEGER NOT NULL DEFAULT 0,
    "categoryId" UUID,
    "inventoryAccountId" UUID,
    "salesAccountId" UUID,
    "halalCertNo" TEXT,
    "halalExpDate" TIMESTAMP(3),
    "isHalalValidated" BOOLEAN NOT NULL DEFAULT false,
    "halalCertUrl" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "material_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_valuations" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movingAveragePrice" DECIMAL(15,2) NOT NULL,
    "lastPurchasePrice" DECIMAL(15,2) NOT NULL,
    "totalQty" DECIMAL(15,2) NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "referenceNo" TEXT,

    CONSTRAINT "material_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "termOfPayment" INTEGER NOT NULL DEFAULT 0,
    "categoryId" UUID,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" UUID NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" UUID NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "supplierId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qtyRequired" DECIMAL(15,2) NOT NULL,
    "estimatedPrice" DECIMAL(15,2),

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" UUID,
    "scmId" UUID,
    "status" "POStatus" NOT NULL DEFAULT 'ORDERED',
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "estArrival" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "leadId" UUID,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "poId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "receivedQty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxType" TEXT DEFAULT 'PPN_11',

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_inbounds" (
    "id" UUID NOT NULL,
    "poId" UUID,
    "status" "InboundStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_inbounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_items" (
    "id" UUID NOT NULL,
    "inboundId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qtyActual" DECIMAL(15,3) NOT NULL,
    "isQuarantine" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "inbound_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "referenceNo" TEXT,
    "notes" TEXT,
    "sourceLocId" UUID,
    "destLocId" UUID,
    "actorId" UUID,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" UUID,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_inventories" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "internalQrCode" TEXT,
    "currentStock" DECIMAL(15,2) NOT NULL,
    "expDate" TIMESTAMP(3),
    "lastRestock" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" UUID,
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'GOOD',
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "auditAccuracy" DECIMAL(5,2) DEFAULT 100.00,
    "receivingDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "material_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_orders" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceWarehouseId" UUID NOT NULL,
    "destWarehouseId" UUID NOT NULL,
    "vehicleNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_order_items" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "transfer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opnames" (
    "id" UUID NOT NULL,
    "opnameDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" UUID NOT NULL,
    "picId" UUID NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'WAITING',
    "totalLossValue" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_opnames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_items" (
    "id" UUID NOT NULL,
    "opnameId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "systemQty" DECIMAL(15,2) NOT NULL,
    "actualQty" DECIMAL(15,2) NOT NULL,
    "difference" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "stock_opname_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metaDescription" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_products" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metaDescription" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lost_deals_leadId_key" ON "lost_deals"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "bussdev_staffs_userId_key" ON "bussdev_staffs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "retention_engine_leadId_key" ON "retention_engine"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "unified_invoices_invoiceNumber_key" ON "unified_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "unified_invoices_deliveryOrderId_key" ON "unified_invoices"("deliveryOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_metric_definitions_eventCode_key" ON "kpi_metric_definitions"("eventCode");

-- CreateIndex
CREATE UNIQUE INDEX "hki_records_hkiId_key" ON "hki_records"("hkiId");

-- CreateIndex
CREATE UNIQUE INDEX "bpom_records_bpomId_key" ON "bpom_records"("bpomId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_ads_metrics_date_platform_campaignName_key" ON "daily_ads_metrics"("date", "platform", "campaignName");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_targets_month_year_key" ON "marketing_targets"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "account_health_logs_year_weekNumber_platform_key" ON "account_health_logs"("year", "weekNumber", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "production_plans_batchNo_key" ON "production_plans"("batchNo");

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_woId_key" ON "finished_goods"("woId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_woNumber_key" ON "work_orders"("woNumber");

-- CreateIndex
CREATE INDEX "work_orders_stage_idx" ON "work_orders"("stage");

-- CreateIndex
CREATE INDEX "work_orders_targetCompletion_idx" ON "work_orders"("targetCompletion");

-- CreateIndex
CREATE UNIQUE INDEX "labor_rates_grade_key" ON "labor_rates"("grade");

-- CreateIndex
CREATE INDEX "production_logs_loggedAt_idx" ON "production_logs"("loggedAt");

-- CreateIndex
CREATE INDEX "production_logs_stage_idx" ON "production_logs"("stage");

-- CreateIndex
CREATE INDEX "production_logs_workOrderId_idx" ON "production_logs"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_workOrderId_key" ON "delivery_orders"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "qc_parameters_formulaId_key" ON "qc_parameters"("formulaId");

-- CreateIndex
CREATE UNIQUE INDEX "sample_revisions_sampleRequestId_revisionNumber_key" ON "sample_revisions"("sampleRequestId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_targets_userId_month_year_key" ON "sales_targets"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "warehouse_locations_type_idx" ON "warehouse_locations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "material_items_code_key" ON "material_items"("code");

-- CreateIndex
CREATE INDEX "material_items_type_idx" ON "material_items"("type");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "inventory_transactions_materialId_idx" ON "inventory_transactions"("materialId");

-- CreateIndex
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "material_inventories_internalQrCode_key" ON "material_inventories"("internalQrCode");

-- CreateIndex
CREATE INDEX "material_inventories_materialId_idx" ON "material_inventories"("materialId");

-- CreateIndex
CREATE INDEX "material_inventories_locationId_idx" ON "material_inventories"("locationId");

-- CreateIndex
CREATE INDEX "material_inventories_expDate_idx" ON "material_inventories"("expDate");

-- CreateIndex
CREATE INDEX "material_inventories_qcStatus_idx" ON "material_inventories"("qcStatus");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "website_products_slug_key" ON "website_products"("slug");

-- CreateIndex
CREATE INDEX "website_products_slug_idx" ON "website_products"("slug");

-- CreateIndex
CREATE INDEX "website_products_category_idx" ON "website_products"("category");

-- AddForeignKey
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_bdId_fkey" FOREIGN KEY ("bdId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "master_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_picId_fkey" FOREIGN KEY ("picId") REFERENCES "bussdev_staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_deals" ADD CONSTRAINT "lost_deals_bdId_fkey" FOREIGN KEY ("bdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_deals" ADD CONSTRAINT "lost_deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bussdev_staffs" ADD CONSTRAINT "bussdev_staffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_logs" ADD CONSTRAINT "guest_logs_bdId_fkey" FOREIGN KEY ("bdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_product_forms" ADD CONSTRAINT "new_product_forms_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "sample_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "material_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "sample_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "sales_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_engine" ADD CONSTRAINT "retention_engine_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_timeline_logs" ADD CONSTRAINT "lead_timeline_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_streams" ADD CONSTRAINT "activity_streams_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_versions" ADD CONSTRAINT "design_versions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "design_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_feedbacks" ADD CONSTRAINT "design_feedbacks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "design_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unified_invoices" ADD CONSTRAINT "unified_invoices_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unified_invoices" ADD CONSTRAINT "unified_invoices_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unified_invoices" ADD CONSTRAINT "unified_invoices_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unified_invoices" ADD CONSTRAINT "unified_invoices_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_reclassifyToAccountId_fkey" FOREIGN KEY ("reclassifyToAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "unified_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_taxAccountId_fkey" FOREIGN KEY ("taxAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "unified_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivingAccountId_fkey" FOREIGN KEY ("receivingAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_requests" ADD CONSTRAINT "fund_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_requests" ADD CONSTRAINT "fund_requests_disbursedById_fkey" FOREIGN KEY ("disbursedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_requests" ADD CONSTRAINT "fund_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_role_mappings" ADD CONSTRAINT "employee_role_mappings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_point_logs" ADD CONSTRAINT "kpi_point_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hki_records" ADD CONSTRAINT "hki_records_picId_fkey" FOREIGN KEY ("picId") REFERENCES "legal_staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bpom_records" ADD CONSTRAINT "bpom_records_picId_fkey" FOREIGN KEY ("picId") REFERENCES "legal_staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_pipelines" ADD CONSTRAINT "regulatory_pipelines_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_pipelines" ADD CONSTRAINT "regulatory_pipelines_sampleRequestId_fkey" FOREIGN KEY ("sampleRequestId") REFERENCES "sample_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_pipelines" ADD CONSTRAINT "regulatory_pipelines_legalPicId_fkey" FOREIGN KEY ("legalPicId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_pipelines" ADD CONSTRAINT "regulatory_pipelines_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "material_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_reviews" ADD CONSTRAINT "artwork_reviews_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "regulatory_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pnbp_requests" ADD CONSTRAINT "pnbp_requests_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "regulatory_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_ads_metrics" ADD CONSTRAINT "daily_ads_metrics_auditedById_fkey" FOREIGN KEY ("auditedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_woId_fkey" FOREIGN KEY ("woId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_step_logs" ADD CONSTRAINT "production_step_logs_woId_fkey" FOREIGN KEY ("woId") REFERENCES "production_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_audits" ADD CONSTRAINT "qc_audits_qcId_fkey" FOREIGN KEY ("qcId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_audits" ADD CONSTRAINT "qc_audits_stepLogId_fkey" FOREIGN KEY ("stepLogId") REFERENCES "production_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_goods" ADD CONSTRAINT "finished_goods_woId_fkey" FOREIGN KEY ("woId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reject_executions" ADD CONSTRAINT "reject_executions_lossAccountId_fkey" FOREIGN KEY ("lossAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reject_executions" ADD CONSTRAINT "reject_executions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reject_executions" ADD CONSTRAINT "reject_executions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_logisticsId_fkey" FOREIGN KEY ("logisticsId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copq_records" ADD CONSTRAINT "copq_records_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_escalations" ADD CONSTRAINT "audit_escalations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_escalations" ADD CONSTRAINT "audit_escalations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_npfId_fkey" FOREIGN KEY ("npfId") REFERENCES "new_product_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_picId_fkey" FOREIGN KEY ("picId") REFERENCES "rnd_staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_rndId_fkey" FOREIGN KEY ("rndId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_stage_logs" ADD CONSTRAINT "sample_stage_logs_sampleRequestId_fkey" FOREIGN KEY ("sampleRequestId") REFERENCES "sample_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_sampleRequestId_fkey" FOREIGN KEY ("sampleRequestId") REFERENCES "sample_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_phases" ADD CONSTRAINT "formula_phases_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_items" ADD CONSTRAINT "formula_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_items" ADD CONSTRAINT "formula_items_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "formula_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_parameters" ADD CONSTRAINT "qc_parameters_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_feedback" ADD CONSTRAINT "sample_feedback_sampleRequestId_fkey" FOREIGN KEY ("sampleRequestId") REFERENCES "sample_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_revisions" ADD CONSTRAINT "sample_revisions_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "material_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_revisions" ADD CONSTRAINT "sample_revisions_sampleRequestId_fkey" FOREIGN KEY ("sampleRequestId") REFERENCES "sample_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "sample_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_results" ADD CONSTRAINT "lab_test_results_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_results" ADD CONSTRAINT "lab_test_results_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "master_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_salesAccountId_fkey" FOREIGN KEY ("salesAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_valuations" ADD CONSTRAINT "material_valuations_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "master_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "sales_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_scmId_fkey" FOREIGN KEY ("scmId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inbounds" ADD CONSTRAINT "warehouse_inbounds_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_items" ADD CONSTRAINT "inbound_items_inboundId_fkey" FOREIGN KEY ("inboundId") REFERENCES "warehouse_inbounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_items" ADD CONSTRAINT "inbound_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventories" ADD CONSTRAINT "material_inventories_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventories" ADD CONSTRAINT "material_inventories_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventories" ADD CONSTRAINT "material_inventories_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_destWarehouseId_fkey" FOREIGN KEY ("destWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_opnameId_fkey" FOREIGN KEY ("opnameId") REFERENCES "stock_opnames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
