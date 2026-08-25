# NEX ERP — R4 Database Deployment Contract

**Status:** ACTIVE
**Date:** 2026-08-25
**Companion to:** `NEX-PRODUCTION-RELEASE-ROLLBACK-CHECKLIST.md`,
`NEX-DAY1-CUTOVER-READINESS.md`

This document is the **authoritative contract** for how a release is
deployed against a PostgreSQL target. It is the supported
reproducible process for both the existing-DB upgrade path and the
new-DB bootstrap path. Both paths must pass R4 Gate 4 before any
release can be marked `READY_FOR_CONTROLLED_PRODUCTION_ROLLOUT`.

---

## 1. Pre-conditions (both paths)

- `DATABASE_URL` set to the deployment target (`erp_db` for
  production, `erp_db_<env>` for non-prod).
- `JWT_SECRET` and `AES_SECRET_KEY` set, ≥ 32 chars each, not
  placeholder patterns. `npm run check:env` must PASS.
- `NODE_ENV=production` for production deploys.
- `CORS_ORIGIN` lists the public frontend origin exactly.
- `NEXT_PUBLIC_PROTOTYPE_MODE=false` in the frontend build.
- The deployment artifact is a pinned release SHA. `git rev-parse HEAD`
  matches the recorded `NEW_RELEASE_SHA`.
- The release includes the four pre-flight migrations documented in
  §5 below.

## 2. EXISTING DATABASE DEPLOY

This is the path that takes a populated `erp_db` from one release to
the next without losing rows.

### 2.1 Sequence

```bash
# 1. Snapshot the protected DB (operator-only step).
pg_dump -Fc -d erp_db -f backup-$(date +%Y%m%d-%H%M%S).dump
sha256sum backup-*.dump > backup-*.sha256
sha256sum -c backup-*.sha256

# 2. Restore the snapshot into a disposable clone.
createdb erp_r4_upgrade_shadow
pg_restore -d erp_r4_upgrade_shadow --no-owner backup-*.dump

# 3. Point DATABASE_URL at the disposable clone and inspect migrations.
DATABASE_URL=postgresql://…/erp_r4_upgrade_shadow \
  npx prisma migrate status --schema=prisma/schema

# 4. If any prior migration is in a failed state, mark it rolled back.
#    This is metadata-only and does not mutate schema.
DATABASE_URL=postgresql://…/erp_r4_upgrade_shadow \
  npx prisma migrate resolve --schema=prisma/schema \
  --rolled-back <failed-migration-name>

# 5. Apply pending migrations against the disposable clone.
DATABASE_URL=postgresql://…/erp_r4_upgrade_shadow \
  npx prisma migrate deploy --schema=prisma/schema

# 6. Re-run to prove NO-OP idempotency.
DATABASE_URL=postgresql://…/erp_r4_upgrade_shadow \
  npx prisma migrate deploy --schema=prisma/schema
# expected: "No pending migrations to apply."

# 7. Diff row counts and identity samples vs the protected DB. Any
#    unexplained delta is a release blocker.

# 8. Boot the application against the disposable clone and run the
#    Day-1 remediation Playwright (R4 §8).

# 9. If everything above passes, repeat steps 5–8 against the real
#    protected DB.
```

### 2.2 Safety guarantees

- The protected `erp_db` is never written to until step 9.
- Step 1's `pg_dump` is a verifiable artifact (sha256 recorded).
- Step 3's `migrate status` is read-only.
- Step 4's `migrate resolve --rolled-back` mutates only
  `_prisma_migrations`, never schema. R4 §7 forbids silently rewriting
  applied migration history; this step is the supported way to
  recover from a failed migration without rewriting history.
- Step 5's `migrate deploy` runs every migration in a single
  transaction (per migration) — partial application is impossible.
- Step 6 proves the chain is idempotent for redeploy (R4 §18).
- Step 8 proves the application boots and the Day-1 fixes hold
  against real data.

### 2.3 Rollback

If any step in §2.1 fails after step 5 mutates the protected DB:

1. Stop release traffic.
2. Restore the backup from §2.1 step 1 to the protected DB.
3. Redeploy the prior approved application version.
4. Re-run §2.1 step 7 to confirm row counts match the pre-upgrade
   baseline.

**Do not attempt a down migration blindly.** R4 §7 forbids it.

## 3. NEW DATABASE BOOTSTRAP

This is the path for fresh installations or disaster recovery
where no existing `erp_db` is available.

### 3.1 Sequence

```bash
# 1. Create an empty database with the production-equivalent
#    PostgreSQL version.
createdb erp_db_fresh

# 2. Point DATABASE_URL at the empty database.
DATABASE_URL=postgresql://…/erp_db_fresh

# 3. Apply the full migration chain. The four R4 pre-flight
#    migrations run first (timestamps 20260822… and 20260823…)
#    because their filenames sort before the batch3-batch7 chain.
npx prisma migrate deploy --schema=prisma/schema

# 4. Re-run to prove NO-OP.
npx prisma migrate deploy --schema=prisma/schema
# expected: "No pending migrations to apply."

# 5. Compare the resulting schema against an upgrade-shadow DB.
#    Identical table set and column types.
diff <(psql -d upgrade \dt) <(psql -d fresh \dt)
diff <(psql -d upgrade -At -c "…") <(psql -d fresh -At -c "…")

# 6. Bootstrap master data via the canonical scripts (NOT this
#    contract — see NEX-DAY1-CUTOVER-READINESS.md §5-§7):
#    scripts/users-bootstrap/
#    scripts/master-import/
#    scripts/opening-balance/

# 7. Boot the application against the fresh DB and run the Day-1
#    remediation Playwright.
```

### 3.2 Repeats safely

The four pre-flight migrations are idempotent:

- `20260822080000_r4_fix_legacy_leadstatus_unused_enum` uses
  `DROP TYPE IF EXISTS` + `CREATE TYPE` — re-running on a DB
  where LeadStatus already has the canonical values is a clean
  drop-and-recreate.
- `20260822085000_r4_fix_text_id_columns_to_uuid` is a PL/pgSQL
  DO block that snapshots and re-creates FKs, then alters columns
  via `USING x::uuid`. With 0 rows the cast is a no-op.
- `20260822086000_r4_create_missing_goods_requirement_tables`
  uses `CREATE TABLE IF NOT EXISTS` — re-running on a DB that
  already has the tables is a no-op.
- `20260823200000_r4_create_self_qr_devices` uses
  `CREATE TABLE IF NOT EXISTS` — same idempotency.

## 4. R4 PRE-FLIGHT MIGRATIONS

These four migrations live in `backend/prisma/migrations/` and MUST
be part of every release artifact. They are not optional.

| Timestamp | Purpose | Idempotency |
|---|---|---|
| 20260822080000 | Replace unused legacy `LeadStatus` enum with canonical values | DROP+CREATE |
| 20260822085000 (formulas) | Align `formulas.id` + 3 FK columns + `sales_orders.id` + 6 FK columns to UUID | explicit ALTERs |
| 20260822085000 (text-id) | Bulk-align every public TEXT id-shaped column to UUID via PL/pgSQL DO block | DO block |
| 20260822086000 | Create missing `goods_requirements`, `goods_requirement_items`, `material_requisition_headers`, `material_requisition_items` | CREATE IF NOT EXISTS |
| 20260823200000 | Create missing `self_qr_devices` | CREATE IF NOT EXISTS |

## 5. WHY THESE PRE-FLIGHTS EXIST

The migration chain has four systemic problems that the
pre-flights patch in a backward-compatible way:

### 5.1 LeadStatus enum conflict
phase1 declared `LeadStatus` with legacy values
(`NEW / CONTACTED / SAMPLE / NEGO / DEAL / LOST`). No migration
ever used it on any column. lead_attribution_journey declared
`LeadStatus` with canonical values inside an idempotent
`DO $$ BEGIN … EXCEPTION` block, so on a DB where phase1 already
ran the legacy enum is never replaced and the downstream
`DEFAULT 'PENDING'` fails.

### 5.2 TEXT vs UUID id columns
phase1 created many tables with `id TEXT`. The Prisma schema
declares them as `String @db.Uuid`. Downstream migrations add
UUID-typed columns and FKs against the existing TEXT columns,
which fails with type mismatch.

### 5.3 Missing base tables
37 tables are declared in the Prisma schema but no migration
creates them. Downstream migrations (batch3-batch7 and r2_shipment
_lot_lineage) assume some of these tables exist and immediately
fail with `relation "X" does not exist`.

### 5.4 Self-QR devices table
The marketing_sales_roster_alignment migration does
`DELETE FROM self_qr_devices` but no migration creates the
table.

The pre-flights restore the chain to a state where the existing
batch3-batch7 migrations apply cleanly on a fresh or
partially-populated DB. They do not modify applied migration
history.

## 6. PROHIBITED PATTERNS

The following are explicitly forbidden in the production deploy
contract:

- `prisma db push` (R4 §11).
- `prisma migrate reset` (R4 §1 — destructive).
- Silent rewriting of an applied migration file (R4 §7).
- Direct SQL `ALTER`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP` against
  the protected `erp_db` (R4 §1).
- `prisma migrate dev` against the production target (development
  command, not for production deploys).
- `migrate resolve --applied` to force-mark a failing migration as
  applied (masks the failure instead of fixing it).

## 7. ROLES

| Role | Responsibility |
|---|---|
| SRE / DevOps | Runs §2.1 / §3.1. Owns backups, restore, rollback. |
| Backend on-call | Confirms `prisma migrate deploy` exit codes and Playwright pass/fail. |
| Director | Approves the switch from disposable clone to protected `erp_db` (step 9 of §2.1). |

## 8. POST-DEPLOY VERIFICATION

After successful deploy (either path), confirm:

- `GET /system/health` returns 200.
- `npx prisma migrate status` reports `up to date`.
- Day-1 remediation Playwright passes (R4 §8).
- One representative query per major table returns expected rows.
- Restart the backend process; health recovers; rows survive.
- Restart the frontend; no asset regression.

## 9. CHANGE LOG

- 2026-08-25 — initial contract, derived from R4 verification on
  `erp_r4_upgrade_shadow` and `erp_r4_fresh_shadow`. Pre-flight
  migrations:
    - `20260822080000_r4_fix_legacy_leadstatus_unused_enum`
    - `20260822085000_r4_fix_formulas_id_to_uuid`
    - `20260822085000_r4_fix_text_id_columns_to_uuid`
    - `20260822086000_r4_create_missing_goods_requirement_tables`
    - `20260823200000_r4_create_self_qr_devices`
