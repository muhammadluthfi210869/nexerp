-- ------------------------------------------------------------------
-- R4 pre-flight fix: align TEXT id columns with the canonical UUID
-- shape before batch3-batch7 migrations apply.
--
-- Why this rewrite
--   The previous version used a blanket heuristic
--     "every TEXT id | *Id | *_id -> UUID"
--   which is unsound: column-naming is NOT evidence of UUID intent.
--   In particular, round_robin_state.id is declared String
--   (@default("singleton")) in the canonical Prisma schema, not UUID.
--   The previous migration crashed on protected production-light data
--   with `invalid input syntax for type uuid: 'singleton'`.
--   It also had cross-table FK ordering bugs (FK recreated before
--   the referenced column was altered to UUID).
--
-- How this rewrite is safe (data-preserving)
--   1. The list of columns to convert is the EXPLICIT allowlist derived
--      from the canonical Prisma schema (see
--      r4-final-go-live-evidence/01-release-artifact/UUID_CONVERSION_ALLOWLIST.txt).
--      Every entry has @db.Uuid in the schema. Anything not on the list
--      stays unchanged.
--   2. Three-pass structure:
--        Pass 1: snapshot every FK that touches a column we plan to alter.
--        Pass 2: drop all those FKs first (handles cross-table FK ordering).
--        Pass 3: alter every allowlist column that qualifies
--                (table exists; column is text; all populated values UUID-valid;
--                 regex test, no eager ::uuid cast).
--        Pass 4: recreate the FKs verbatim (their definitions reference
--                columns by name; pg_get_constraintdef captures them pre-alter).
--   3. round_robin_state.id is not in the allowlist (schema declares String,
--      not @db.Uuid) so it is never touched.
--   4. Each column's DEFAULT is dropped before the alter.
--   5. If a future deployment has populated a target column with non-UUID
--      data, that column is skipped (RAISE NOTICE) and the operator is
--      expected to add a deterministic ID-mapping migration first.
--
-- Why a NEW migration instead of editing applied files
--   This rewrites 20260822085000_r4_fix_text_id_columns_to_uuid. Per R4
--   section 7/10 that migration was NOT applied to protected production
--   (it does not exist in the persistent prod migrations dir). The R4
--   pre-flight may be corrected only if not applied to protected/persistent
--   production - that precondition holds.
-- ------------------------------------------------------------------

DO $$
DECLARE
  entry       RECORD;
  alter_rec   RECORD;
  fk          RECORD;
  fk_drop     TEXT[] := ARRAY[]::TEXT[];
  fk_create   TEXT[] := ARRAY[]::TEXT[];
  i           INT;
  allow_tbl   TEXT;
  allow_col   TEXT;
  has_bad_val BOOLEAN;
BEGIN
  -- Pass 1: snapshot every FK whose source OR target is a TEXT id-shaped
  -- column in a public, non-Prisma-internal table. This includes FKs whose
  -- referenced column is itself on the allowlist, so we can drop them all
  -- BEFORE we alter any column.
  FOR fk IN
    SELECT DISTINCT
      c.conname,
      c.conrelid::regclass::text AS tbl,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.data_type = 'text'
          AND col.table_name NOT LIKE '\_%' ESCAPE ''
          AND (col.column_name = 'id'
               OR col.column_name LIKE '%Id'
               OR col.column_name LIKE '%_id')
          AND (col.table_name = c.conrelid::regclass::text
               OR col.table_name = c.confrelid::regclass::text)
      )
  LOOP
    fk_drop   := array_append(fk_drop,
      format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tbl, fk.conname));
    fk_create := array_append(fk_create,
      format('ALTER TABLE %s ADD CONSTRAINT %I %s',
             fk.tbl, fk.conname, fk.def));
  END LOOP;

  -- Pass 2: drop every queued FK first (handles cross-table ordering).
  IF fk_drop IS NOT NULL THEN
    FOR i IN 1 .. array_length(fk_drop, 1) LOOP
      EXECUTE fk_drop[i];
    END LOOP;
  END IF;

  -- Pass 3: iterate the explicit allowlist and alter qualifying columns.
  FOR entry IN
    SELECT * FROM (
VALUES
  ('account_health_logs', 'id'),
  ('accounts', 'id'),
  ('accounts', 'parentId'),
  ('accounts', 'reclassifyToAccountId'),
  ('activity_streams', 'id'),
  ('activity_streams', 'leadId'),
  ('articles', 'id'),
  ('artwork_reviews', 'approvedById'),
  ('artwork_reviews', 'designerPicId'),
  ('artwork_reviews', 'id'),
  ('artwork_reviews', 'pipelineId'),
  ('attendances', 'employeeId'),
  ('attendances', 'id'),
  ('audit_escalations', 'approvedById'),
  ('audit_escalations', 'id'),
  ('audit_escalations', 'planId'),
  ('auto_approve_configs', 'id'),
  ('auto_journal_configs', 'coaCreditId'),
  ('auto_journal_configs', 'coaDebetId'),
  ('bill_of_materials', 'id'),
  ('bill_of_materials', 'materialId'),
  ('bill_of_materials', 'sampleId'),
  ('bpom_records', 'id'),
  ('bpom_records', 'picId'),
  ('bussdev_staffs', 'id'),
  ('bussdev_staffs', 'userId'),
  ('content_assets', 'id'),
  ('copq_records', 'id'),
  ('copq_records', 'journalEntryId'),
  ('copq_records', 'planId'),
  ('copq_records', 'qcAuditId'),
  ('daily_ads_metrics', 'auditedById'),
  ('daily_ads_metrics', 'id'),
  ('delivery_orders', 'id'),
  ('delivery_orders', 'workOrderId'),
  ('design_feedbacks', 'authorId'),
  ('design_feedbacks', 'id'),
  ('design_feedbacks', 'taskId'),
  ('design_tasks', 'id'),
  ('design_tasks', 'leadId'),
  ('design_tasks', 'soId'),
  ('design_versions', 'id'),
  ('design_versions', 'taskId'),
  ('design_versions', 'uploadedBy'),
  ('document_drafts', 'approvedById'),
  ('document_drafts', 'createdById'),
  ('document_drafts', 'id'),
  ('document_drafts', 'rejectedById'),
  ('document_drafts', 'sourceId'),
  ('employee_role_mappings', 'employeeId'),
  ('employee_role_mappings', 'id'),
  ('employees', 'id'),
  ('employees', 'managerId'),
  ('employees', 'userId'),
  ('error_logs', 'id'),
  ('financial_periods', 'id'),
  ('financial_summary_ledger', 'id'),
  ('financial_summary_ledger', 'periodId'),
  ('finished_goods', 'formulaId'),
  ('finished_goods', 'id'),
  ('finished_goods', 'woId'),
  ('formula_items', 'id'),
  ('formula_items', 'materialId'),
  ('formula_items', 'phaseId'),
  ('formula_phases', 'formulaId'),
  ('formula_phases', 'id'),
  ('formulas', 'id'),
  ('formulas', 'lockedById'),
  ('formulas', 'sampleRequestId'),
  ('fund_requests', 'approvedById'),
  ('fund_requests', 'disbursedById'),
  ('fund_requests', 'id'),
  ('fund_requests', 'requesterId'),
  ('goods_requirement_items', 'id'),
  ('goods_requirement_items', 'materialId'),
  ('goods_requirement_items', 'requirementId'),
  ('goods_requirements', 'createdById'),
  ('goods_requirements', 'formulaId'),
  ('goods_requirements', 'id'),
  ('goods_requirements', 'salesOrderId'),
  ('guest_logs', 'bdId'),
  ('guest_logs', 'id'),
  ('halal_records', 'id'),
  ('halal_records', 'picId'),
  ('hki_records', 'id'),
  ('hki_records', 'picId'),
  ('inbound_items', 'id'),
  ('inbound_items', 'inboundId'),
  ('inbound_items', 'inventoryId'),
  ('inbound_items', 'materialId'),
  ('internal_audits', 'id'),
  ('internal_audits', 'picId'),
  ('inventory_transactions', 'actorId'),
  ('inventory_transactions', 'destLocId'),
  ('inventory_transactions', 'id'),
  ('inventory_transactions', 'inventoryId'),
  ('inventory_transactions', 'materialId'),
  ('inventory_transactions', 'sourceLocId'),
  ('inventory_transactions', 'warehouseId'),
  ('journal_entries', 'adjustmentId'),
  ('journal_entries', 'fundRequestId'),
  ('journal_entries', 'id'),
  ('journal_entries', 'invoiceId'),
  ('journal_entries', 'paymentId'),
  ('journal_entries', 'planId'),
  ('journal_entries', 'poId'),
  ('journal_entries', 'purchaseReturnId'),
  ('journal_entries', 'requisitionId'),
  ('journal_entries', 'returnId'),
  ('journal_entries', 'soId'),
  ('journal_lines', 'accountId'),
  ('journal_lines', 'id'),
  ('journal_lines', 'journalId'),
  ('journal_lines', 'taxAccountId'),
  ('kpi_metric_definitions', 'id'),
  ('kpi_point_logs', 'employeeId'),
  ('kpi_point_logs', 'id'),
  ('kpi_point_logs', 'planId'),
  ('kpi_point_logs', 'qcAuditId'),
  ('kpi_point_logs', 'soId'),
  ('kpi_scores', 'employeeId'),
  ('kpi_scores', 'id'),
  ('kpi_scores', 'periodId'),
  ('lab_test_results', 'formulaId'),
  ('lab_test_results', 'id'),
  ('lab_test_results', 'testerId'),
  ('labor_rates', 'id'),
  ('landing_page_conversions', 'id'),
  ('landing_page_visits', 'id'),
  ('lead_activities', 'id'),
  ('lead_activities', 'leadId'),
  ('lead_activities', 'validatedBy'),
  ('lead_attributes', 'id'),
  ('lead_attributes', 'leadId'),
  ('lead_captures', 'assignedTo'),
  ('lead_captures', 'id'),
  ('lead_messages', 'id'),
  ('lead_messages', 'leadId'),
  ('lead_timeline_logs', 'id'),
  ('lead_timeline_logs', 'leadId'),
  ('legal_staffs', 'id'),
  ('lost_deals', 'bdId'),
  ('lost_deals', 'id'),
  ('lost_deals', 'leadId'),
  ('machines', 'id'),
  ('marketing_targets', 'id'),
  ('master_categories', 'id'),
  ('master_currencies', 'id'),
  ('master_inci', 'id'),
  ('master_tax_rates', 'id'),
  ('material_inventories', 'id'),
  ('material_inventories', 'locationId'),
  ('material_inventories', 'materialId'),
  ('material_inventories', 'supplierId'),
  ('material_items', 'categoryId'),
  ('material_items', 'id'),
  ('material_items', 'inventoryAccountId'),
  ('material_items', 'salesAccountId'),
  ('material_requisition_headers', 'createdById'),
  ('material_requisition_headers', 'fromWarehouse'),
  ('material_requisition_headers', 'id'),
  ('material_requisition_headers', 'toWarehouse'),
  ('material_requisition_items', 'headerId'),
  ('material_requisition_items', 'id'),
  ('material_requisition_items', 'materialId'),
  ('material_requisitions', 'id'),
  ('material_requisitions', 'materialId'),
  ('material_requisitions', 'woId'),
  ('material_requisitions', 'workOrderId'),
  ('material_returns', 'id'),
  ('material_returns', 'materialId'),
  ('material_returns', 'workOrderId'),
  ('material_valuations', 'id'),
  ('material_valuations', 'materialId'),
  ('new_product_forms', 'id'),
  ('new_product_forms', 'leadId'),
  ('notifications', 'id'),
  ('notifications', 'userId'),
  ('payments', 'id'),
  ('payments', 'invoiceId'),
  ('payments', 'receivingAccountId'),
  ('payments', 'verifiedBy'),
  ('payroll_items', 'employeeId'),
  ('payroll_items', 'id'),
  ('payroll_items', 'payrollId'),
  ('payrolls', 'authorizedById'),
  ('payrolls', 'id'),
  ('payrolls', 'periodId'),
  ('pnbp_requests', 'financeRecordId'),
  ('pnbp_requests', 'id'),
  ('pnbp_requests', 'pipelineId'),
  ('production_logs', 'id'),
  ('production_logs', 'machineId'),
  ('production_logs', 'materialInventoryId'),
  ('production_logs', 'operatorId'),
  ('production_logs', 'planId'),
  ('production_logs', 'workOrderId'),
  ('production_material_usages', 'id'),
  ('production_material_usages', 'inventoryId'),
  ('production_material_usages', 'materialId'),
  ('production_material_usages', 'planId'),
  ('production_material_usages', 'workOrderId'),
  ('production_plans', 'adminId'),
  ('production_plans', 'formulaId'),
  ('production_plans', 'id'),
  ('production_plans', 'soId'),
  ('production_schedules', 'id'),
  ('production_schedules', 'machineId'),
  ('production_schedules', 'workOrderId'),
  ('production_step_details', 'id'),
  ('production_step_details', 'materialId'),
  ('production_step_details', 'scheduleId'),
  ('production_step_logs', 'id'),
  ('production_step_logs', 'woId'),
  ('purchase_order_items', 'id'),
  ('purchase_order_items', 'materialId'),
  ('purchase_order_items', 'poId'),
  ('purchase_order_items', 'taxId'),
  ('purchase_orders', 'currencyId'),
  ('purchase_orders', 'id'),
  ('purchase_orders', 'leadId'),
  ('purchase_orders', 'requestId'),
  ('purchase_orders', 'scmId'),
  ('purchase_orders', 'supplierId'),
  ('purchase_request_items', 'id'),
  ('purchase_request_items', 'materialId'),
  ('purchase_request_items', 'requestId'),
  ('purchase_request_items', 'requirementItemId'),
  ('purchase_requests', 'createdById'),
  ('purchase_requests', 'id'),
  ('purchase_requests', 'requirementId'),
  ('purchase_requests', 'supplierId'),
  ('purchase_requests', 'warehouseId'),
  ('purchase_return_items', 'id'),
  ('purchase_return_items', 'materialId'),
  ('purchase_return_items', 'returnId'),
  ('purchase_returns', 'createdById'),
  ('purchase_returns', 'id'),
  ('purchase_returns', 'inboundId'),
  ('purchase_returns', 'supplierId'),
  ('purchase_returns', 'warehouseId'),
  ('qc_audits', 'id'),
  ('qc_audits', 'inboundItemId'),
  ('qc_audits', 'inventoryId'),
  ('qc_audits', 'qcId'),
  ('qc_audits', 'stepLogId'),
  ('qc_audits', 'supervisorById'),
  ('qc_audits', 'supplierId'),
  ('qc_checklists', 'createdById'),
  ('qc_checklists', 'id'),
  ('qc_checklists', 'workOrderId'),
  ('qc_parameters', 'formulaId'),
  ('qc_parameters', 'id'),
  ('regulatory_pipelines', 'formulaId'),
  ('regulatory_pipelines', 'id'),
  ('regulatory_pipelines', 'leadId'),
  ('regulatory_pipelines', 'legalPicId'),
  ('regulatory_pipelines', 'materialItemId'),
  ('regulatory_pipelines', 'sampleRequestId'),
  ('reject_executions', 'id'),
  ('reject_executions', 'lossAccountId'),
  ('reject_executions', 'materialId'),
  ('reject_executions', 'planId'),
  ('requisition_fulfillments', 'id'),
  ('requisition_fulfillments', 'inventoryId'),
  ('requisition_fulfillments', 'requisitionId'),
  ('retention_engine', 'id'),
  ('retention_engine', 'leadId'),
  ('rnd_staffs', 'id'),
  ('round_robin_agents', 'id'),
  ('sales_leads', 'bdId'),
  ('sales_leads', 'categoryId'),
  ('sales_leads', 'formulaId'),
  ('sales_leads', 'id'),
  ('sales_leads', 'picId'),
  ('sales_order_amendments', 'changedById'),
  ('sales_order_amendments', 'id'),
  ('sales_order_amendments', 'newFormulaId'),
  ('sales_order_amendments', 'previousFormulaId'),
  ('sales_order_amendments', 'salesOrderId'),
  ('sales_order_items', 'id'),
  ('sales_order_items', 'materialItemId'),
  ('sales_order_items', 'sampleId'),
  ('sales_order_items', 'soId'),
  ('sales_order_items', 'taxId'),
  ('sales_orders', 'currencyId'),
  ('sales_orders', 'formulaId'),
  ('sales_orders', 'id'),
  ('sales_orders', 'leadId'),
  ('sales_orders', 'sampleId'),
  ('sales_orders', 'taxId'),
  ('sales_return_items', 'id'),
  ('sales_return_items', 'materialId'),
  ('sales_return_items', 'returnId'),
  ('sales_returns', 'id'),
  ('sales_returns', 'soId'),
  ('sales_returns', 'warehouseId'),
  ('sales_targets', 'id'),
  ('sales_targets', 'userId'),
  ('sample_feedback', 'id'),
  ('sample_feedback', 'sampleRequestId'),
  ('sample_requests', 'id'),
  ('sample_requests', 'leadId'),
  ('sample_requests', 'npfId'),
  ('sample_requests', 'paymentApprovedById'),
  ('sample_requests', 'picId'),
  ('sample_requests', 'rndId'),
  ('sample_stage_logs', 'id'),
  ('sample_stage_logs', 'sampleRequestId'),
  ('search_visibility_metrics', 'id'),
  ('self_qr_devices', 'id'),
  ('self_qr_history_runs', 'deviceId'),
  ('self_qr_history_runs', 'id'),
  ('self_qr_normalized_events', 'deviceId'),
  ('self_qr_normalized_events', 'id'),
  ('shipment_consumed_lots', 'finishedGoodId'),
  ('shipment_consumed_lots', 'id'),
  ('shipment_consumed_lots', 'shipmentId'),
  ('shipment_consumed_lots', 'shipmentItemId'),
  ('shipment_items', 'id'),
  ('shipment_items', 'materialId'),
  ('shipment_items', 'shipmentId'),
  ('shipments', 'id'),
  ('shipments', 'logisticsId'),
  ('shipments', 'soId'),
  ('state_transition_logs', 'changedById'),
  ('state_transition_logs', 'id'),
  ('stock_adjustment_items', 'adjustmentId'),
  ('stock_adjustment_items', 'id'),
  ('stock_adjustment_items', 'materialId'),
  ('stock_adjustments', 'accountId'),
  ('stock_adjustments', 'id'),
  ('stock_adjustments', 'warehouseId'),
  ('stock_opname_items', 'id'),
  ('stock_opname_items', 'materialId'),
  ('stock_opname_items', 'opnameId'),
  ('stock_opnames', 'approvedById'),
  ('stock_opnames', 'id'),
  ('stock_opnames', 'journalEntryId'),
  ('stock_opnames', 'picId'),
  ('stock_opnames', 'warehouseId'),
  ('suppliers', 'categoryId'),
  ('suppliers', 'id'),
  ('system_configs', 'id'),
  ('system_override_logs', 'authorizedById'),
  ('system_override_logs', 'id'),
  ('system_sequences', 'id'),
  ('task_boards', 'id'),
  ('task_items', 'boardId'),
  ('task_items', 'id'),
  ('tickets', 'authorizedById'),
  ('tickets', 'employeeId'),
  ('tickets', 'id'),
  ('transfer_order_items', 'id'),
  ('transfer_order_items', 'materialId'),
  ('transfer_order_items', 'transferId'),
  ('transfer_orders', 'createdById'),
  ('transfer_orders', 'destWarehouseId'),
  ('transfer_orders', 'id'),
  ('transfer_orders', 'sourceWarehouseId'),
  ('unified_invoices', 'deliveryOrderId'),
  ('unified_invoices', 'id'),
  ('unified_invoices', 'poId'),
  ('unified_invoices', 'soId'),
  ('unified_invoices', 'supplierId'),
  ('unified_invoices', 'workOrderId'),
  ('users', 'id'),
  ('warehouse_inbounds', 'id'),
  ('warehouse_inbounds', 'poId'),
  ('warehouse_inbounds', 'warehouseId'),
  ('warehouse_locations', 'id'),
  ('warehouse_locations', 'warehouseId'),
  ('warehouses', 'id'),
  ('website_products', 'id'),
  ('work_orders', 'id'),
  ('work_orders', 'leadId'),
  ('work_orders', 'planId')
    ) AS allowlist(table_name, column_name)
  LOOP
    allow_tbl := entry.table_name;
    allow_col := entry.column_name;

    -- a. Table must exist.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = allow_tbl
    ) THEN
      CONTINUE;
    END IF;

    -- b. Column must exist AND currently be text.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = allow_tbl
        AND column_name = allow_col AND data_type = 'text'
    ) THEN
      CONTINUE;
    END IF;

    -- c. Every populated value must match the UUID regex.
    --    Use a regex test (no eager ::uuid cast) so non-UUID strings don't crash.
    --    Single-quoted regex with quote-escape (no dollar-quote nesting).
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I IS NOT NULL '
      || 'AND (LENGTH(%I) <> 36 '
      || 'OR %I::text !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'') LIMIT 1)',
      'public', allow_tbl, allow_col, allow_col, allow_col
    ) INTO has_bad_val;
    IF has_bad_val THEN
      RAISE NOTICE 'r4_fix_text_id_columns_to_uuid: skip %.% - contains non-UUID values',
        allow_tbl, allow_col;
      CONTINUE;
    END IF;

    -- Drop DEFAULT (some defaults don't auto-cast to UUID; Prisma sets
    -- its own @default(uuid()) at insert time).
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT',
                   allow_tbl, allow_col);

    -- Alter column TYPE UUID USING column::uuid.
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING %I::uuid',
                   allow_tbl, allow_col, allow_col);
  END LOOP;

  -- Pass 4: recreate every FK verbatim. Their definitions reference columns
  -- by name; after Pass 3 the columns are UUID, so the recreated FKs land
  -- on the new column type.
  IF fk_create IS NOT NULL THEN
    FOR i IN 1 .. array_length(fk_create, 1) LOOP
      EXECUTE fk_create[i];
    END LOOP;
  END IF;
END $$;
