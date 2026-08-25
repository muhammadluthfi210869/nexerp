# R4 Upgrade Path Proof — Disposable Clone of Protected DB

**Date:** 2026-08-25
**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**Protected DB proxy:** `nexerp` (local Docker, schema-only proxy)
**Clone:** `erp_r4_upgrade_shadow`

## Summary

| Step | Result |
|---|---|
| `pg_dump` protected proxy → `/tmp/nexerp_protected.dump` | PASS — 251640 bytes, sha256 `c5afe1f8…022f911` |
| `pg_restore` into `erp_r4_upgrade_shadow` | PASS — 111 tables, 5 migrations in ledger, 0 rows |
| `prisma migrate resolve --rolled-back 20260822081953_lead_attribution_journey` | PASS |
| `prisma migrate deploy` (1st attempt) | FAIL — text-id column mismatch (formulas.id TEXT, downstream migrations assume UUID) |
| Added `20260822085000_r4_fix_text_id_columns_to_uuid` pre-flight migration | applied |
| `prisma migrate deploy` (2nd attempt) | FAIL — `goods_requirements` table missing (batch4 assumes it) |
| Added `20260822086000_r4_create_missing_goods_requirement_tables` pre-flight migration | applied (extended to include `material_requisition_headers` and `material_requisition_items`) |
| `prisma migrate deploy` (3rd attempt) | FAIL — `self_qr_devices` table missing (marketing migration does DELETE against it) |
| Added `20260823200000_r4_create_self_qr_devices` pre-flight migration | applied |
| `prisma migrate deploy` (4th attempt) | **PASS — 21 migrations applied** |
| `prisma migrate deploy` (5th attempt, idempotency) | **PASS — No pending migrations to apply.** |

## Pre-flight migrations added (R4 §7 strategy A: never rewrites applied history)

| Timestamp | File | Purpose |
|---|---|---|
| 20260822080000 | `20260822080000_r4_fix_legacy_leadstatus_unused_enum/migration.sql` | DROP+CREATE unused `LeadStatus` enum with canonical values |
| 20260822085000 | `20260822085000_r4_fix_formulas_id_to_uuid/migration.sql` | align `formulas.id` + 3 referencing columns + `sales_orders.id` + 6 referencing columns to UUID |
| 20260822085000 | `20260822085000_r4_fix_text_id_columns_to_uuid/migration.sql` | bulk-align every public TEXT id-shaped column to UUID (PL/pgSQL DO block, saves/restores FKs) |
| 20260822086000 | `20260822086000_r4_create_missing_goods_requirement_tables/migration.sql` | create `goods_requirements`, `goods_requirement_items`, `material_requisition_headers`, `material_requisition_items` (declared in schema, missing from migration chain) |
| 20260823200000 | `20260823200000_r4_create_self_qr_devices/migration.sql` | create `self_qr_devices` (declared in schema, marketing migration does DELETE against it) |

## Schema reconciliation (R4 §14)

| Aspect | upgrade-shadow | fresh-shadow | Match |
|---|---|---|---|
| Table set (`\dt`) | 109 tables | 109 tables | **MATCH** |
| Column types (per information_schema) | identical | identical | **MATCH** |
| Migration ledger | 21 finished | 21 finished | **MATCH** |
| `_prisma_migrations` count | 23 (includes 2 rolled-back records) | 21 | expected difference |

```
$ diff <(psql -d upgrade \dt) <(psql -d fresh \dt)        → no diff
$ diff <(columns upgrade) <(columns fresh)               → no diff
```

**Schema reconciliation: PASS**

## Row/data reconciliation (R4 §14)

Both clones have 0 rows in every business table. The local `nexerp`
proxy is a schema-only stand-in for the real protected `erp_db`
at Biznet (which the cutover doc reports as having 8,246
`lead_captures` rows and 540 `leads` rows).

Row-preservation proof on the real protected DB is out of scope
for this verification (the protected DB at Biznet is not reachable
from this Windows worktree; it must be exercised during R4 Gate 2
on the production-like host).

## Verdict

**UPGRADE_PATH = PASS** — protected-DB clone accepts all 21
migrations with the four R4 pre-flight additions; second deploy
run is a clean NO-OP.

**FRESH_DB_PATH = PASS** — empty DB accepts all 21 migrations
with the same pre-flight additions; same final schema as the
upgrade clone.

**SCHEMA_RECONCILIATION = PASS** — table set and column types are
identical between upgrade-shadow and fresh-shadow after the
migration chain settles.
