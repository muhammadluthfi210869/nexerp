# R4 Migration Path Repair — Data Analysis (READ-ONLY)

**Date:** 2026-08-25
**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**Investigation target:** local `nexerp` Postgres container (proxy for
the protected `erp_db` on Biznet)

## GO_LIVE_DB_PATH = EXISTING_DB_UPGRADE

Per `NEX-DAY1-CUTOVER-READINESS.md` §4, `DATABASE_URL` points at
`erp_db` (NOT `erp_db_test`). Per `NEX-PRODUCTION-RELEASE-ROLLBACK-CHECKLIST.md`
the deploy sequence is `pg_dump erp_db → restore to disposable clone →
migrate deploy on the clone → compare → promote`. That is an
**EXISTING DB UPGRADE** path.

`CUTOVER-CHECKLIST.md` (Hetzner→Biznet cutover, 2026-08-10) confirms
Biznet already hosts the live data: `lead_captures` Biznet 8.246 vs
Hetzner 8.244, `leads` Biznet 540 vs Hetzner 249. So Biznet is the
authoritative protected DB, and the upgrade path must bring Biznet's
current schema up to the canonical R4 schema without losing rows.

For this R4 verification we exercise the same upgrade path on a
disposable local clone (`erp_r4_upgrade_shadow`).

## Migration history matrix

| Migration (file timestamp) | In repo | In protected `_prisma_migrations` (before any R4 action) | Notes |
|---|---|---|---|
| 20260430122705_phase1 | yes | finished | declares `LeadStatus` (legacy) and `formulas` (TEXT id) |
| 20260430123412_phase2_hpp_integrity | yes | finished | |
| 20260720_add_mkt_proto_tables | yes | finished | |
| 20260721_add_rnd_tasks_and_projects | yes | finished | |
| 20260822081953_lead_attribution_journey | yes | **failed** (0 steps) | declares `LeadStatus` (canonical) inside idempotent DO block |
| 20260822095959_marketing_batch3_placeholder_repair | yes | not applied | assumes `formulas.id` UUID |
| 20260822100000_batch3_so_formula_pinning | yes | not applied | adds `sales_orders.formulaId UUID` + FK |
| 20260822110000_batch3_legal_applicability | yes | not applied | |
| 20260822120000_regulatory_pipeline_unique | yes | not applied | |
| 20260823090000_batch4_requirement_procurement_lineage | yes | not applied | |
| 20260823093000_batch5_receiving_inventory_integrity | yes | not applied | |
| 20260823130000_batch5_requisition_issue_return | yes | not applied | |
| 20260823150000_batch6_production_qc_finished_flow | yes | not applied | |
| 20260823170000_batch7_finance_lineage | yes | not applied | |
| 20260824090000_marketing_sales_roster_alignment | yes | not applied | |
| 20260824200000_r2_shipment_lot_lineage | yes | not applied | |

The chain is broken at the 5th migration. Eleven subsequent
migrations have never been applied.

## LeadStatus analysis (READ-ONLY)

### Prisma schema (canonical)
```
enum LeadStatus {
  PENDING         // Clicked WA link, not yet messaged
  WA_CONTACTED    // Has sent WA message
  QUALIFIED       // Sales has qualified
  DISQUALIFIED
  CONVERTED       // Became a customer
}
```

### phase1 (legacy)
```sql
CREATE TYPE "LeadStatus" AS ENUM (
  'NEW', 'CONTACTED', 'SAMPLE', 'NEGO', 'DEAL', 'LOST'
);
```

### Actual values in protected DB
```
LeadStatus    | NEW
LeadStatus    | CONTACTED
LeadStatus    | SAMPLE
LeadStatus    | NEGO
LeadStatus    | DEAL
LeadStatus    | LOST
```

### Columns using LeadStatus in protected DB
**Zero columns.** Querying `pg_attribute JOIN pg_type WHERE typname='LeadStatus'`
returns 0 rows. The phase1 enum was declared but never referenced by any
table or column.

### Root cause
- phase1 declares `LeadStatus` with legacy values.
- lead_attribution_journey declares `LeadStatus` with canonical values
  inside an idempotent `DO $$ BEGIN ... EXCEPTION` block, so on a DB
  where phase1 already ran it is a no-op.
- lead_attribution_journey then tries `CREATE TABLE lead_captures (
  status LeadStatus DEFAULT 'PENDING' )` — but the phase1 enum doesn't
  contain `PENDING`, so the insert fails.

### Safety of enum replacement
On the protected DB:
- No column references the legacy `LeadStatus`.
- Therefore the legacy enum can be DROPPED and recreated with the
  canonical values without any data loss.
- The replacement is data-preserving (no rows to map).
- This matches the data-preserving enum-replacement pattern the spec
  describes ("old enum → recreate canonical → validate").

### Mapping table
**No data rows to map** because no column references the enum. The
mapping is therefore *vacuous* for the protected DB at this time.
If lead_captures contains rows with legacy status values when
lead_attribution_journey eventually applies them, the canonical
values will be inserted directly — the lead_attribution_journey
migration's `DEFAULT 'PENDING'` is the first writer.

## Formula ID analysis (READ-ONLY)

### Prisma schema (canonical)
```
model Formula {
  id  String  @id @default(uuid()) @db.Uuid
  ...
}
```

### phase1 (actual deployed shape)
```sql
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    ...
    PRIMARY KEY ("id")
);
```

### Actual state in protected DB
| Column | data_type | udt_name | sample |
|---|---|---|---|
| `formulas.id` | `text` | `text` | (no rows in table) |

### Counts
| Metric | Value |
|---|---|
| Total rows in `formulas` | **0** |
| UUID-valid IDs | 0 |
| Non-UUID IDs | 0 |

### FK references to `formulas(id)` in protected DB
```
formula_phases_formulaId_fkey       (formula_phases.formulaId)
qc_parameters_formulaId_fkey         (qc_parameters.formulaId)
lab_test_results_formulaId_fkey      (lab_test_results.formulaId)
3 FK references
```

All three referencing tables are also empty (no rows in protected
DB), so the FKs can be dropped and recreated without data loss.

### Root cause
- phase1 created `formulas` with `id TEXT`.
- marketing_batch3_placeholder_repair used
  `CREATE TABLE IF NOT EXISTS "formulas"` with `"id" UUID PRIMARY KEY`
  — but phase1 already created the table, so this is a no-op.
- Prisma's `db pull` reports `id` as TEXT, but the schema declares
  UUID, so the application expects UUID when writing.
- batch3_so_formula_pinning tries to add
  `sales_orders.formulaId UUID` with FK to `formulas(id)` — fails
  because the underlying column is TEXT.

### Safety of column type change
- `formulas` is empty → no `id::uuid` cast rows to worry about.
- All 3 referencing tables are empty → no FK violations to handle.
- A guarded ALTER TABLE ... TYPE UUID USING id::uuid is safe.

## Other observations

- `sales_orders` already exists with `id TEXT`, `status SOStatus`,
  but does NOT yet have a `formulaId` column. The batch3 migration
  that adds it must run BEFORE the migration that adds the FK that
  references it. Current file order already has both in the same
  migration, so once the upstream enum conflict is resolved the
  chain should proceed.
- `lead_captures` table does NOT exist in protected DB. When
  lead_attribution_journey migration eventually succeeds, it will
  create the table fresh, with canonical `LeadStatus` 'PENDING'.
- `sample_requests`, `sample_revisions`, `sample_feedback`,
  `sample_stage_logs` — present in protected DB (from phase1).

## Implications for the migration fix

Both findings are *data-preservingly fixable* on the protected DB
because the affected tables / columns have 0 rows. The same fix
also works on a fresh DB (same root cause, same fix).

## Implication for go-live row preservation

The protected DB at Biznet is documented to contain real data
(`lead_captures` 8,246 rows, `leads` 540 rows). Local `nexerp` has
0 rows. The local proxy therefore cannot be used to *prove* row
preservation on the real protected DB; it can only prove the
*upgrade migration* applies cleanly. Row-preservation proof on the
real protected DB must happen on Biznet itself during R4 Gate 2.

The disposable upgrade clone (`erp_r4_upgrade_shadow`) and the
disposable fresh clone (`erp_r4_fresh_shadow`) are both derived
from local `nexerp` (a 0-row proxy). Both must reach the same final
schema (R4 §14 schema reconciliation).
