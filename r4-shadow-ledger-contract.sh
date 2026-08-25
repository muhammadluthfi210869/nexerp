#!/bin/bash
# R4 GATE 1 — Ledger Contract Test
# Purpose: Establish deterministic Prisma ledger for production-light -> canonical.
# Truth: Production-light's 22-table schema is a SUPERSET of all 21 prior migrations' effects
#        (R&D, marketing, SCM, finance, etc. tables were bootstrapped via direct SQL, not Prisma).
# Strategy: Mark all 21 prior migrations as "applied" via prisma migrate resolve (truthful;
#           effects are present in DB). Keep r4_prodlight_to_canonical as the ONE forward R4 migration.
#           Result: second `prisma migrate deploy` is NO-OP.
set -u

CONTAINER=production-light-backend-1
DB=production-light-db-1
USER=erp_user
PASS=erp_password_secure
DUMP=/home/dreamlab/r4-shadow-verify/protected-dump-20260825T064003Z.sql
SHADOW=erp_r4_biznet_shadow
ORIG=/app/prisma/migrations
BAK=/app/prisma/migrations.bak.r4ledger

# All 21 historical migrations that exist on disk — truth: their schema effects are in prodlight DB
HISTORICAL=(
  20260430122705_phase1
  20260430123412_phase2_hpp_integrity
  20260720_add_mkt_proto_tables
  20260721_add_rnd_tasks_and_projects
  20260822080000_r4_fix_legacy_leadstatus_unused_enum
  20260822081953_lead_attribution_journey
  20260822085000_r4_fix_formulas_id_to_uuid
  20260822085000_r4_fix_text_id_columns_to_uuid
  20260822086000_r4_create_missing_goods_requirement_tables
  20260822095959_marketing_batch3_placeholder_repair
  20260822100000_batch3_so_formula_pinning
  20260822110000_batch3_legal_applicability
  20260822120000_regulatory_pipeline_unique
  20260823090000_batch4_requirement_procurement_lineage
  20260823093000_batch5_receiving_inventory_integrity
  20260823130000_batch5_requisition_issue_return
  20260823150000_batch6_production_qc_finished_flow
  20260823170000_batch7_finance_lineage
  20260823200000_r4_create_self_qr_devices
  20260824090000_marketing_sales_roster_alignment
  20260824200000_r2_shipment_lot_lineage
)

# Migration to apply forward (the canonical additive R4 upgrade)
FORWARD=20260825090000_r4_prodlight_to_canonical

run_prisma() {
  local URL=$1; shift
  docker exec -e DATABASE_URL="$URL" -w /app $CONTAINER \
    /app/node_modules/.bin/prisma "$@" 2>&1 | tail -20
}

backup_migrations() {
  docker exec $CONTAINER sh -c "[ -d $BAK ] || cp -r $ORIG $BAK"
  echo "backup: $(docker exec $CONTAINER ls $BAK | wc -l) entries"
}

restore_migrations() {
  docker exec $CONTAINER sh -c "rm -rf $ORIG && mv $BAK $ORIG"
  echo "restored: $(docker exec $CONTAINER ls $ORIG | wc -l) entries"
}

inject_all_migrations() {
  # Push every migration folder + lock from /tmp/r4-migrations into the container
  docker exec $CONTAINER sh -c "rm -rf $ORIG && mkdir -p $ORIG"
  for d in "${HISTORICAL[@]}" "$FORWARD"; do
    docker cp /tmp/r4-migrations/"$d" $CONTAINER:$ORIG/"$d" 2>&1 | head -3
  done
  docker cp /tmp/r4-migrations/migration_lock.toml $CONTAINER:$ORIG/migration_lock.toml 2>&1 | head -3
  echo "migrations injected: $(docker exec $CONTAINER ls $ORIG | wc -l) entries"
}

shadow_url() { echo "postgresql://$USER:$PASS@db:5432/$SHADOW?schema=public"; }

echo "############################################################"
echo "# STEP 1: drop+create shadow from protected dump"
echo "############################################################"
docker exec $DB psql -U $USER -d postgres -c "DROP DATABASE IF EXISTS $SHADOW;" >/dev/null 2>&1
docker exec $DB psql -U $USER -d postgres -c "CREATE DATABASE $SHADOW OWNER $USER;" 2>&1 | tail -1
docker exec -i $DB psql -U $USER -d $SHADOW -v ON_ERROR_STOP=1 < $DUMP 2>&1 | tail -3

echo ""
echo "ROW BEFORE:"
TABLES_BEFORE=$(docker exec $DB psql -U $USER -d $SHADOW -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
ROWS_BEFORE=$(docker exec $DB psql -U $USER -d $SHADOW -tAc "
SELECT COALESCE(SUM((xpath('/row/cnt/text()', xml_count))[1]::text::bigint), 0) FROM (
  SELECT query_to_xml(format('select count(*) AS cnt from %I.%I', 'public', table_name), false, true, '') AS xml_count
  FROM information_schema.tables WHERE table_schema='public'
) t;")
echo "  tables=$TABLES_BEFORE rows=$ROWS_BEFORE"

echo ""
echo "ROUND_ROBIN singleton (must be TEXT 'singleton'):"
docker exec $DB psql -U $USER -d $SHADOW -c "SELECT id, pg_typeof(id) FROM round_robin_state;"

echo ""
echo "############################################################"
echo "# STEP 2: inject all 22 migration folders into backend"
echo "############################################################"
backup_migrations
inject_all_migrations

echo ""
echo "############################################################"
echo "# STEP 3: resolve 21 historical as applied (truthful: their effects are in DB)"
echo "############################################################"
for m in "${HISTORICAL[@]}"; do
  run_prisma "$(shadow_url)" migrate resolve --applied "$m" >/dev/null 2>&1 && echo "  resolved: $m"
done

echo ""
echo "############################################################"
echo "# STEP 4: prisma migrate status BEFORE forward apply (expect 1 pending: $FORWARD)"
echo "############################################################"
run_prisma "$(shadow_url)" migrate status

echo ""
echo "############################################################"
echo "# STEP 5: prisma migrate deploy (1st — applies r4_prodlight_to_canonical)"
echo "############################################################"
run_prisma "$(shadow_url)" migrate deploy

echo ""
echo "############################################################"
echo "# STEP 6: prisma migrate deploy (2nd — must be NO-OP)"
echo "############################################################"
SECOND_OUTPUT=$(run_prisma "$(shadow_url)" migrate deploy 2>&1)
echo "$SECOND_OUTPUT"
echo ""
if echo "$SECOND_OUTPUT" | grep -q "No pending migrations"; then
  echo "VERDICT: SAME_SHA_MIGRATE_REDEPLOY = NO_OP / PASS"
else
  echo "VERDICT: NEED INSPECTION"
fi

echo ""
echo "############################################################"
echo "# STEP 7: integrity checks"
echo "############################################################"
TABLES_AFTER=$(docker exec $DB psql -U $USER -d $SHADOW -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
ROWS_AFTER=$(docker exec $DB psql -U $USER -d $SHADOW -tAc "
SELECT COALESCE(SUM((xpath('/row/cnt/text()', xml_count))[1]::text::bigint), 0) FROM (
  SELECT query_to_xml(format('select count(*) AS cnt from %I.%I', 'public', table_name), false, true, '') AS xml_count
  FROM information_schema.tables WHERE table_schema='public'
) t;")
echo "  TABLES_BEFORE=$TABLES_BEFORE -> TABLES_AFTER=$TABLES_AFTER"
echo "  ROWS_BEFORE=$ROWS_BEFORE -> ROWS_AFTER=$ROWS_AFTER"
echo "  ROW_LOSS=$((ROWS_BEFORE - ROWS_AFTER))"

echo ""
echo "ROUND_ROBIN singleton preserved:"
docker exec $DB psql -U $USER -d $SHADOW -c "SELECT id, pg_typeof(id) FROM round_robin_state;"

echo ""
echo "Orphan FK count (must be 0):"
docker exec $DB psql -U $USER -d $SHADOW -tAc "SELECT count(*) FROM pg_constraint c WHERE c.contype='f' AND c.connamespace='public'::regnamespace AND NOT EXISTS (SELECT 1 FROM pg_class r WHERE r.oid = c.conrelid);"

echo ""
echo "_prisma_migrations count:"
docker exec $DB psql -U $USER -d $SHADOW -tAc "SELECT count(*) FROM _prisma_migrations;"

echo ""
echo "############################################################"
echo "# STEP 8: restore container migrations (no perf change)"
echo "############################################################"
restore_migrations
echo "DONE"
