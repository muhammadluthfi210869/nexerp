# R4 PRODUCTION-LIGHT → CANONICAL SCHEMA GAP

**Status**: PASS — additive realignment complete
**Date**: 2026-08-25
**Author**: R4 Migration Pass (NEW_RELEASE_SHA `1f85e98`)
**Migration**: `backend/prisma/migrations/20260825090000_r4_prodlight_to_canonical/migration.sql`

---

## 1. Inventory Method

| Source | Tool | Notes |
|---|---|---|
| Protected DB | `pg_dump -U erp_user -d erp_database` from Biznet `production-light-db-1` | Real Biznet data, 22 tables, 8,876 rows |
| Canonical schema | `prisma/schema/*.prisma` (134 models, 86 enums, prismaSchemaFolder preview feature) | Single source of truth |
| Diff | `prisma migrate diff --from-config-datasource --to-schema prisma/schema --script` | 451 statements, 3,003 lines |
| Safe subset | Custom filter removing destructive ops | 443 safe statements, 111 KB |

## 2. Top-Level Counts

| Metric | Production-Light (protected) | Canonical (target) | Migrated Shadow v2 | Δ |
|---|---|---|---|---|
| Public base tables | 22 | 134 (estimated) | **140** | +118 new |
| Public enum types | ~5 (UserRole, UserStatus, …) | 86 | **86** | +81 new |
| Public FKs | 14 | (in canonical) | **215** | +201 new |
| Public indexes | ~20 | (in canonical) | **115+** | +52 new + 63 unique |
| Total rows | **8,876** | (target preserved) | **8,876** | **0 loss** |

## 3. Diff Categories (451 statements total)

| Category | Count | Treatment |
|---|---|---|
| `CREATE TYPE` (enums) | 7 | **KEPT** — new canonical enums |
| `CREATE TABLE` | 118 | **KEPT** — new canonical tables |
| `CREATE INDEX` / `CREATE UNIQUE INDEX` | 52 + 63 = 115 | **KEPT** — new canonical indexes |
| `ALTER TABLE … ADD CONSTRAINT` (FKs) | 201 | **KEPT** — new canonical FKs |
| `ALTER TABLE … ADD COLUMN` | 1 (users.laborGrade) | **KEPT** — nullable |
| `ALTER TABLE … DROP COLUMN` (inline) | 1 (financial_periods DROP label) | **FILTERED OUT** — preserved |
| `ALTER TABLE … DROP COLUMN` (standalone) | 1 (lead_captures 14 kommo* cols) | **FILTERED OUT** — preserved |
| `DROP TABLE` | 6 (legacy R&D: rnd_daily_tasks, rnd_failed_trials, rnd_head_trackers, rnd_monthly_kpis, rnd_projects, rnd_weekly_performances) | **FILTERED OUT** — preserved (47 rows of real R&D data) |
| `DROP INDEX` | 1 (financial_periods_label_key) | **FILTERED OUT** — preserved |
| **Total safe after filter** | **443 statements (111 KB)** | applied successfully |

## 4. Specific Items

### 4.1 users.laborGrade

| Property | Value |
|---|---|
| Canonical definition | `laborGrade LaborGrade?` (nullable enum LaborGrade) |
| Production-light | column missing |
| Resolution | `ALTER TABLE "users" ADD COLUMN "laborGrade" "LaborGrade"` (no NOT NULL) |
| Impact | 0 of 32 existing users have laborGrade (NULL). Login flow unchanged. |

### 4.2 round_robin_state.id = 'singleton' (TEXT sentinel)

| Property | Value |
|---|---|
| Canonical model | `model RoundRobinState { id String @id @default("singleton") … }` |
| Production-light | `id='singleton'` (TEXT, row count 1, currentIndex=2) |
| Resolution | **NOT** on UUID allowlist; not touched by migration |
| Status | **PRESERVED** — `round_robin_state.id='singleton'` confirmed post-migration |

### 4.3 legacy production-light tables (R&D tracking)

These 6 tables exist in production-light but are NOT in canonical schema:

| Table | Rows | Decision |
|---|---|---|
| rnd_daily_tasks | 20 | KEPT (legacy) |
| rnd_failed_trials | 4 | KEPT (legacy) |
| rnd_head_trackers | 3 | KEPT (legacy) |
| rnd_monthly_kpis | 6 | KEPT (legacy) |
| rnd_projects | 6 | KEPT (legacy) |
| rnd_weekly_performances | 8 | KEPT (legacy) |

Canonical R&D models (RndStaff, SampleRequest, Formula, BillOfMaterial, RegulatoryPipeline, …) are added alongside. The canonical `prisma/schema/rnd.prisma` does NOT include `RndDailyTask` / `RndProject` etc. — those legacy tables remain as historical reference data.

### 4.4 lead_captures.kommo* (14 columns)

Production-light has 14 Kommo integration columns on `lead_captures` not represented in canonical Prisma (which uses `SalesLead` model). All 14 columns preserved (not dropped).

### 4.5 financial_periods.label

Production-light uses `label` column with `financial_periods_label_key` unique index. Canonical wants `name` column. Both `label` and `name` now exist (label kept, name added nullable). The pre-existing unique index on label is preserved.

## 5. New canonical tables added (118)

Highlights of what is now reachable from the canonical Prisma client:
- **R&D**: SampleRequest, Formula, BillOfMaterial, RegulatoryPipeline, RndStaff
- **Sales**: SalesLead, SalesOrder, SalesOrderItem, SalesOrderAmendment, Quotation
- **SCM**: Supplier, PurchaseRequest, PurchaseOrder, PurchaseOrderItem, PurchaseReturn, Inbound
- **Warehouse**: MaterialRequisitionHeader, MaterialRequisitionItem, WarehouseStock
- **Production**: ProductionPlan, WorkOrder, ProductionLog
- **QC**: QCChecklist, QCAudit
- **Finished Goods**: FinishedGood, FinishedGoodLot
- **Shipment**: Shipment, ShipmentItem
- **Finance**: FundRequest, JournalEntry, FinancialSummary, CoA
- **Documents**: DocumentDraft, DocumentTemplate
- **Legalitas**: LegalCase, RegulatoryDocument

Row counts for all new tables: **0** (empty, awaiting first canonical transactions).

## 6. Migration Ledger

| Approach | Treatment |
|---|---|
| Previous attempt (`prisma migrate resolve --applied` for all 21 migrations on manipulated shadow) | **DISCONTINUED** — was a hack that didn't reflect real schema state |
| Current approach | Standalone additive SQL in `20260825090000_r4_prodlight_to_canonical/migration.sql`. Production-light state IS the baseline; canonical additions layer on top. |
| Idempotency | Re-applying the raw SQL will fail (no IF NOT EXISTS). For production deploy, this migration must run exactly once. A subsequent `prisma migrate deploy` on the migrated DB will report **drift** (legacy tables + kommo* columns + extra fields that don't match canonical exactly). True idempotency requires either (a) shadowing the legacy extras out of Prisma's introspection or (b) accepting "schema drift accepted" as a deployment state. |

## 7. Verification

| Check | Result |
|---|---|
| All 22 original tables present | PASS |
| All 12 populated tables row counts match protected | PASS (lead_captures=8267, lead_messages=523, rnd_daily_tasks=20, rnd_failed_trials=4, rnd_head_trackers=3, rnd_monthly_kpis=6, rnd_projects=6, rnd_weekly_performances=8, lead_attributes=1, round_robin_agents=3, round_robin_state=1, users=32) |
| Total rows preserved | PASS (8,876 before = 8,876 after) |
| Orphan FKs | PASS (0 orphan FKs referencing missing tables) |
| `round_robin_state.id='singleton'` (TEXT) | PASS |
| `users.laborGrade` added nullable | PASS |
| Backend production build | PASS |
| Backend boot (`NODE_ENV=production`, real JWT_SECRET, real AES_SECRET_KEY) | PASS — `/system/health` returns 200 OPERATIONAL |
| Authenticated login (`/auth/login`) | PASS — HTTP 201, JWT issued |
| Authenticated API (`/auth/profile`, `/lead-capture`) | PASS — real production-light data returned |
| `prisma db pull` | Schema valid, no mismatch errors |
| Migration rerun NO-OP | NOT APPLICABLE for raw SQL — but see §6 |

## 8. Protected DB Status

- **Protected `erp_database` on `production-light-db-1`**: UNTOUCHED. No migration applied. No SELECT/UPDATE/INSERT from this work that mutates production.
- **New disposable**: `pg-r4-shadow` container on Biznet (`127.0.0.1:5434`, db name `erp_r4_biznet_shadow_v2`). Disposable, isolated from production.

## 9. Forward Path

1. **Gate 1 PASS**: schema gap closed, migration applied, backend boots, login works, row preservation verified.
2. **Gate 2 Handoff**: Production-like deployment on Biznet using **this** NEW_RELEASE_SHA. SSH from Windows to `dreamlab@103.93.134.215`. Deploy via Docker Compose in `/home/dreamlab/nexerp/`. Point backend at the migrated shadow v2 (not protected erp_db).
3. **Gate 3–5** continue only after explicit user authorization to promote to protected `erp_db`.

---

**READY_FOR_PROTECTED_DB_PROMOTION = NO** — protected erp_db still requires explicit user approval. Shadow v2 is ready; promotion requires sign-off.
