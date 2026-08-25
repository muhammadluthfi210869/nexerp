-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: align formulas.id column type with canonical UUID
-- before batch3_so_formula_pinning adds sales_orders.formulaId.
--
-- Why this rewrite
--   The previous version was unconditional: every ALTER / DROP / ADD
--   statement ran regardless of whether the target table existed.
--   On protected production-light the tables formulas, sales_orders,
--   formula_phases, qc_parameters, lab_test_results, design_tasks,
--   production_plans, sales_order_items, sales_returns, shipments,
--   unified_invoices do not exist. The previous migration crashed on
--   the first ALTER of a missing table with relation does not exist.
--
-- How this rewrite is safe (data-preserving)
--   1. Every operation is guarded by table/column existence checks
--      using to_regclass(...) and information_schema. Operations whose
--      target table does not exist are skipped silently. The migration
--      never fails merely because a table is absent.
--   2. We do NOT invent data. We do NOT cast non-UUID values. We do NOT
--      drop a real table just because it has the same name.
--   3. If a future deployment has populated a target column with
--      non-UUID data, that column is left TEXT and the operator is
--      expected to add a deterministic ID-mapping migration first.
--   4. round_robin_state.id is unrelated to this migration and stays
--      untouched (see r4_fix_text_id_columns_to_uuid for that contract).
--
-- Why a NEW migration instead of editing applied files
--   This rewrites 20260822085000_r4_fix_formulas_id_to_uuid. Per R4
--   §7/§10 that migration was NOT applied to protected production
--   (it does not exist in the persistent prod migrations dir). The R4
--   pre-flight may be corrected only if not applied to protected/persistent
--   production — that precondition holds.
--
-- What this migration does (when target tables exist)
--   1. Drop the 3 FKs that reference formulas(id).
--   2. Drop the 6 FKs that reference sales_orders(id).
--   3. ALTER formulas.id, sales_orders.id to UUID USING id::uuid.
--   4. ALTER 9 referencing columns to UUID (formula_phases.formulaId,
--      qc_parameters.formulaId, lab_test_results.formulaId,
--      design_tasks.soId, production_plans.soId, sales_order_items.soId,
--      sales_returns.soId, shipments.soId, unified_invoices.soId).
--   5. Recreate the 3 FKs against the now-UUID formulas(id).
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  fk_rec      RECORD;
  alter_rec   RECORD;
  has_f       BOOLEAN;
  has_so      BOOLEAN;
  fk_drop     TEXT[] := ARRAY[]::TEXT[];
  i           INT;
BEGIN
  -- Short-circuit: if neither formulas nor sales_orders exists, the entire
  -- migration is a no-op (the canonical schema is the production-light subset).
  has_f  := to_regclass('public.formulas')      IS NOT NULL;
  has_so := to_regclass('public.sales_orders')  IS NOT NULL;

  IF NOT (has_f OR has_so) THEN
    RAISE NOTICE 'r4_fix_formulas_id_to_uuid: no target tables, skipping';
    RETURN;
  END IF;

  -- Step 1+2: drop FKs whose BOTH ends exist. Each DROP CONSTRAINT IF EXISTS
  -- is itself safe even if the table is missing — but we still gate by both
  -- ends to avoid touching unrelated state.
  FOR fk_rec IN
    SELECT * FROM (VALUES
      ('formula_phases',     'formulas',     'formula_phases_formulaId_fkey'),
      ('qc_parameters',      'formulas',     'qc_parameters_formulaId_fkey'),
      ('lab_test_results',   'formulas',     'lab_test_results_formulaId_fkey'),
      ('design_tasks',       'sales_orders', 'design_tasks_soId_fkey'),
      ('production_plans',   'sales_orders', 'production_plans_soId_fkey'),
      ('sales_order_items',  'sales_orders', 'sales_order_items_soId_fkey'),
      ('sales_returns',      'sales_orders', 'sales_returns_soId_fkey'),
      ('shipments',          'sales_orders', 'shipments_soId_fkey'),
      ('unified_invoices',   'sales_orders', 'unified_invoices_soId_fkey')
    ) AS t(src_table, ref_table, fk_name)
  LOOP
    IF to_regclass(format('public.%I', fk_rec.src_table)) IS NOT NULL
       AND to_regclass(format('public.%I', fk_rec.ref_table)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                     fk_rec.src_table, fk_rec.fk_name);
    END IF;
  END LOOP;

  -- Step 3+4: alter primary id columns and referencing columns, ONLY when
  -- the column currently exists and has data_type='text' AND every populated
  -- value is UUID-valid. Otherwise skip silently with RAISE NOTICE.
  FOR alter_rec IN
    SELECT * FROM (VALUES
      ('formulas',          'id'),
      ('sales_orders',      'id'),
      ('formula_phases',    'formulaId'),
      ('qc_parameters',     'formulaId'),
      ('lab_test_results',  'formulaId'),
      ('design_tasks',      'soId'),
      ('production_plans',  'soId'),
      ('sales_order_items', 'soId'),
      ('sales_returns',     'soId'),
      ('shipments',         'soId'),
      ('unified_invoices',  'soId')
    ) AS t(table_name, column_name)
  LOOP
    IF to_regclass(format('public.%I', alter_rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name=alter_rec.table_name
        AND column_name=alter_rec.column_name
        AND data_type='text'
    ) THEN
      CONTINUE;
    END IF;
    -- Evaluate the regex check via a temp table to keep the cast safe
    -- (the WHERE-clause regex never throws even when values are not UUID).
    -- The pattern uses single-quoted string with quote-escape so it nests
    -- cleanly inside the outer DO block (no dollar-quote nesting).
    EXECUTE format(
      'CREATE TEMP TABLE _r4_uuid_check ON COMMIT DROP AS '
      || 'SELECT 1 AS bad FROM %I.%I WHERE %I IS NOT NULL '
      || 'AND (%I IS NULL OR LENGTH(%I) <> 36 '
      || 'OR %I::text !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'') '
      || 'LIMIT 1',
      alter_rec.table_name, alter_rec.table_name,
      alter_rec.column_name,
      alter_rec.column_name, alter_rec.column_name,
      alter_rec.column_name);
    IF EXISTS (SELECT 1 FROM _r4_uuid_check) THEN
      RAISE NOTICE 'r4_fix_formulas_id_to_uuid: skip %.% - contains non-UUID values',
        alter_rec.table_name, alter_rec.column_name;
      DROP TABLE _r4_uuid_check;
      CONTINUE;
    END IF;
    DROP TABLE _r4_uuid_check;

    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT',
                   alter_rec.table_name, alter_rec.column_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING %I::uuid',
                   alter_rec.table_name, alter_rec.column_name, alter_rec.column_name);
  END LOOP;

  -- Step 5: recreate the 3 FKs against formulas(id) when both ends exist
  -- and the FK does not already exist.
  FOR fk_rec IN
    SELECT * FROM (VALUES
      ('formula_phases',     'formulas',     'formula_phases_formulaId_fkey',
       'FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('qc_parameters',      'formulas',     'qc_parameters_formulaId_fkey',
       'FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('lab_test_results',   'formulas',     'lab_test_results_formulaId_fkey',
       'FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE')
    ) AS t(src_table, ref_table, fk_name, fk_def)
  LOOP
    IF to_regclass(format('public.%I', fk_rec.src_table)) IS NOT NULL
       AND to_regclass(format('public.%I', fk_rec.ref_table)) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint
         WHERE contype='f' AND connamespace='public'::regnamespace
           AND conrelid::regclass::text = fk_rec.src_table
           AND conname = fk_rec.fk_name)
    THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s',
                     fk_rec.src_table, fk_rec.fk_name, fk_rec.fk_def);
    END IF;
  END LOOP;
END $$;
