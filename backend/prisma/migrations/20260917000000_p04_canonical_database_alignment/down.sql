-- Rollback / Down migration for 20260917000000_p04_canonical_database_alignment

-- 1. Drop newly created tables (CASCADE to drop child foreign keys)
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "bill_match_results" CASCADE;
DROP TABLE IF EXISTS "bill_allocations" CASCADE;
DROP TABLE IF EXISTS "bill_line_items" CASCADE;
DROP TABLE IF EXISTS "bills" CASCADE;
DROP TABLE IF EXISTS "down_payments" CASCADE;
DROP TABLE IF EXISTS "ap_payments" CASCADE;
DROP TABLE IF EXISTS "bank_reconciliations" CASCADE;
DROP TABLE IF EXISTS "bank_transactions" CASCADE;
DROP TABLE IF EXISTS "bank_accounts" CASCADE;
DROP TABLE IF EXISTS "tax_transactions" CASCADE;
DROP TABLE IF EXISTS "sales_invoice_line_items" CASCADE;
DROP TABLE IF EXISTS "sales_invoices" CASCADE;
DROP TABLE IF EXISTS "ar_receipts" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP TABLE IF EXISTS "sample_fees" CASCADE;
DROP TABLE IF EXISTS "depreciation_schedules" CASCADE;
DROP TABLE IF EXISTS "asset_transfers" CASCADE;
DROP TABLE IF EXISTS "asset_disposals" CASCADE;
DROP TABLE IF EXISTS "fixed_assets" CASCADE;
DROP TABLE IF EXISTS "intangible_assets" CASCADE;
DROP TABLE IF EXISTS "period_locks" CASCADE;
DROP TABLE IF EXISTS "closing_checklists" CASCADE;
DROP TABLE IF EXISTS "adjustment_journals" CASCADE;
DROP TABLE IF EXISTS "job_order_costings" CASCADE;
DROP TABLE IF EXISTS "cost_variances" CASCADE;
DROP TABLE IF EXISTS "product_profitabilities" CASCADE;
DROP TABLE IF EXISTS "cost_allocations" CASCADE;
DROP TABLE IF EXISTS "client_escrows" CASCADE;
DROP TABLE IF EXISTS "inventory_ownerships" CASCADE;
DROP TABLE IF EXISTS "lead_validation_logs" CASCADE;
DROP TABLE IF EXISTS "master_units" CASCADE;
DROP TABLE IF EXISTS "warehouse_access" CASCADE;
DROP TABLE IF EXISTS "master_kodes" CASCADE;
DROP TABLE IF EXISTS "emergency_purchase_requests" CASCADE;
DROP TABLE IF EXISTS "product_supplier_history" CASCADE;

-- 2. Drop added columns on existing tables (with IF EXISTS on table and column)
ALTER TABLE IF EXISTS "journal_entries" DROP COLUMN IF EXISTS "billId", DROP COLUMN IF EXISTS "salesInvoiceId";
ALTER TABLE IF EXISTS "lead_captures" DROP COLUMN IF EXISTS "aiIntent", DROP COLUMN IF EXISTS "approvalNeeded", DROP COLUMN IF EXISTS "extractedFullName", DROP COLUMN IF EXISTS "firstValidatedAt", DROP COLUMN IF EXISTS "kommoFirstResponseSec", DROP COLUMN IF EXISTS "kommoTalkIsInWork", DROP COLUMN IF EXISTS "kommoTalkIsRead", DROP COLUMN IF EXISTS "kommoTalkOrigin", DROP COLUMN IF EXISTS "kommoTalkStatus", DROP COLUMN IF EXISTS "nameConfidence", DROP COLUMN IF EXISTS "nameMatch", DROP COLUMN IF EXISTS "outboundReplyCount", DROP COLUMN IF EXISTS "waProfileName";
ALTER TABLE IF EXISTS "master_categories" DROP COLUMN IF EXISTS "code";
ALTER TABLE IF EXISTS "material_items" DROP COLUMN IF EXISTS "autoCalculatedHpp", DROP COLUMN IF EXISTS "bahanType", DROP COLUMN IF EXISTS "conditionNotes", DROP COLUMN IF EXISTS "imageUrl", DROP COLUMN IF EXISTS "manualOverrideHpp", DROP COLUMN IF EXISTS "physicalForm", DROP COLUMN IF EXISTS "primaryUnitId";
ALTER TABLE IF EXISTS "purchase_order_items" DROP COLUMN IF EXISTS "qtyBagus", DROP COLUMN IF EXISTS "qtyReject", DROP COLUMN IF EXISTS "qtyRounded", DROP COLUMN IF EXISTS "source";
ALTER TABLE IF EXISTS "qc_checklists" DROP COLUMN IF EXISTS "salesOrderId";

ALTER TABLE IF EXISTS "goods" DROP COLUMN IF EXISTS "isDummy";
ALTER TABLE IF EXISTS "payrolls" DROP COLUMN IF EXISTS "period";
ALTER TABLE IF EXISTS "sales_leads" DROP COLUMN IF EXISTS "followUpStatus";
ALTER TABLE IF EXISTS "sales_leads" DROP COLUMN IF EXISTS "leadState";
ALTER TABLE IF EXISTS "sales_leads" DROP COLUMN IF EXISTS "stage";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "bpomProgress";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "halalProgress";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "hkiProgress";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "legalApplicability";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "legalType";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "logoRevision";
ALTER TABLE IF EXISTS "sample_requests" DROP COLUMN IF EXISTS "productionStatus";
ALTER TABLE IF EXISTS "warehouse_inbounds" DROP COLUMN IF EXISTS "idempotencyKey";
ALTER TABLE IF EXISTS "warehouse_inbounds" DROP COLUMN IF EXISTS "reversalReason";
ALTER TABLE IF EXISTS "warehouse_inbounds" DROP COLUMN IF EXISTS "reversedAt";
ALTER TABLE IF EXISTS "warehouse_inbounds" DROP COLUMN IF EXISTS "supplierReference";
ALTER TABLE IF EXISTS "round_robin_agents" DROP COLUMN IF EXISTS "externalKey";
ALTER TABLE IF EXISTS "round_robin_agents" DROP COLUMN IF EXISTS "userId";
ALTER TABLE IF EXISTS "production_plans" DROP COLUMN IF EXISTS "formulaVersionSnapshot";
ALTER TABLE IF EXISTS "production_logs" DROP COLUMN IF EXISTS "executionCommandKey";
ALTER TABLE IF EXISTS "material_requisition_headers" DROP COLUMN IF EXISTS "issueCommandKey";
ALTER TABLE IF EXISTS "material_requisition_headers" DROP COLUMN IF EXISTS "returnCommandKey";
ALTER TABLE IF EXISTS "material_requisition_items" DROP COLUMN IF EXISTS "qtyIssued";
ALTER TABLE IF EXISTS "material_requisition_items" DROP COLUMN IF EXISTS "qtyReturned";

-- 3. Drop newly created enum types
DROP TYPE IF EXISTS "LogActivityType" CASCADE;
DROP TYPE IF EXISTS "PostStatus" CASCADE;
DROP TYPE IF EXISTS "HppStatus" CASCADE;
DROP TYPE IF EXISTS "StateEventTrigger" CASCADE;

-- 4. Delete migration ledger entry from _prisma_migrations
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260917000000_p04_canonical_database_alignment';
