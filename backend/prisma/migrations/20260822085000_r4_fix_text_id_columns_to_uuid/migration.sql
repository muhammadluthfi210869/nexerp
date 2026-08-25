-- ─────────────────────────────────────────────────────────────────
-- R4 pre-flight fix: align TEXT id columns with the canonical UUID
-- shape before batch3-batch7 migrations apply.
--
-- Why this exists
--   phase1 created many tables with TEXT id columns (formulas.id,
--   sales_orders.id, design_tasks.soId, formula_phases.formulaId,
--   etc.). The Prisma schema declares these columns as String @db.Uuid.
--   phase1 also added 140+ FKs against those TEXT columns. Downstream
--   migrations (batch3-batch7) assume the UUID shape — they add
--   columns like sales_orders.formulaId UUID with FKs to formulas(id),
--   and sales_order_amendments.salesOrderId UUID with FK to
--   sales_orders(id). Those migrations fail because the underscored
--   column types are still TEXT.
--
-- Why this is safe (data-preserving)
--   Read-only analysis (see r4-final-go-live-evidence/01-release-artifact
--   /DATA-ANALYSIS.md) confirms the protected DB has 0 rows in every
--   table whose column we alter. id::uuid casts therefore affect 0 rows
--   and FK drops/recreates are metadata-only. If a future deployment has
--   populated these columns, the cast USING x::uuid will fail with a
--   parse error and the operator is expected to apply a deterministic
--   ID-mapping migration first.
--
-- Why a NEW migration instead of editing applied files
--   Per R4 §7, applied migration history must not be silently rewritten.
--   phase1 is in the ledger as finished=true. This NEW pre-flight
--   migration has a timestamp that places it earlier in the chain
--   (20260822085000 < 20260822095959), so Prisma applies it before the
--   batch3-batch7 migrations that depend on UUID columns.
--
-- What this migration does
--   1. Snapshot every FK in the public schema that touches a column we
--      are about to alter (we will re-create them after the alter).
--   2. Drop those FKs.
--   3. ALTER every public TEXT id / *Id / *_id column to UUID using
--      id::uuid. With 0 rows, this is safe.
--   4. Recreate the dropped FKs.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  rec RECORD;
  fk_drop   TEXT[] := ARRAY[]::TEXT[];
  fk_create TEXT[] := ARRAY[]::TEXT[];
  i INT;
BEGIN
  -- 1. Save FK definitions that touch any column we will alter.
  --    Each entry is the FULL CREATE statement (ALTER TABLE …
  --    ADD CONSTRAINT …) so we can re-execute it verbatim after
  --    the column-type changes.
  FOR rec IN
    SELECT c.conname,
           c.conrelid::regclass::text AS tbl,
           pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND (
        EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public'
            AND col.data_type = 'text'
            AND (col.column_name = 'id'
                 OR col.column_name LIKE '%Id'
                 OR col.column_name LIKE '%_id')
            AND col.table_name NOT LIKE '\_%' ESCAPE '\'
            AND (col.table_name = c.conrelid::regclass::text
                 OR col.table_name = c.confrelid::regclass::text)
        )
      )
  LOOP
    fk_drop   := array_append(fk_drop,
      format('ALTER TABLE %s DROP CONSTRAINT %I', rec.tbl, rec.conname));
    fk_create := array_append(fk_create,
      format('ALTER TABLE %s ADD CONSTRAINT %I %s',
             rec.tbl, rec.conname, rec.def));
  END LOOP;

  -- 2. Drop every saved FK.
  FOR i IN 1 .. array_length(fk_drop, 1) LOOP
    EXECUTE fk_drop[i];
  END LOOP;

  -- 3. Alter every public TEXT id-shaped column to UUID.
  --    Some columns have DEFAULT clauses that don't auto-cast to
  --    UUID. Drop the DEFAULT, alter the type, and leave the default
  --    unset. Prisma sets its own @default(uuid()) at insert time.
  FOR rec IN
    SELECT c.table_name, c.column_name, c.column_default
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.data_type = 'text'
      AND (c.column_name = 'id'
           OR c.column_name LIKE '%Id'
           OR c.column_name LIKE '%_id')
      AND c.table_name NOT LIKE '\_%' ESCAPE '\'
  LOOP
    IF rec.column_default IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT',
                     rec.table_name, rec.column_name);
    END IF;
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING %I::uuid',
                   rec.table_name, rec.column_name, rec.column_name);
  END LOOP;

  -- 4. Recreate the saved FKs.
  FOR i IN 1 .. array_length(fk_create, 1) LOOP
    EXECUTE fk_create[i];
  END LOOP;
END $$;
