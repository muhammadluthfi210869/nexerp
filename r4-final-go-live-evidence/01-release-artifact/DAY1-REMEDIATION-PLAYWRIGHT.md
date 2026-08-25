# Gate 1 — Day-1 Remediation Playwright

**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**Verdict:** **FAIL — migration chain blocked**

## Why Playwright was blocked

The Day-1 remediation Playwright suite
(`frontend/tests/e2e/day1-blocker-remediation.spec.ts`) requires:

1. A production frontend build served over HTTP
2. A production backend build connected to a real PostgreSQL
3. Prisma migrations applied (per R4 §13 migration rehearsal)

Steps 1 and 2 are reachable from this Windows worktree (builds PASS).
Step 3 fails on a fresh shadow DB. The migration chain contains
systemic bugs that were not surfaced in R1/R2/R3 because those gates
ran unit tests against an already-mutated production-Light DB
rather than a fresh deploy rehearsal. R4 §13/14 demands a fresh
`prisma migrate deploy` — exactly the path that breaks.

## Specific findings (P1, found during R4 Gate 1 verification)

### Finding 1 — LeadStatus enum conflict
**Migration:** `20260822081953_lead_attribution_journey`
**Error:**
```
ERROR: invalid input value for enum "LeadStatus": "PENDING"
Position: line 91 — "status" "LeadStatus" NOT NULL DEFAULT 'PENDING'
```

**Root cause:**
`prisma/migrations/20260430122705_phase1/migration.sql:14` creates
`LeadStatus` with the legacy values
`'NEW','CONTACTED','SAMPLE','NEGO','DEAL','LOST'`.
`prisma/migrations/20260822081953_lead_attribution_journey` declares
`LeadStatus` with the canonical values
`'PENDING','WA_CONTACTED','QUALIFIED','DISQUALIFIED','CONVERTED'`
inside an idempotent `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`
block. On a fresh DB the phase1 enum stays with the legacy value set
and the new migration's `CREATE TABLE ... DEFAULT 'PENDING'` fails
because `PENDING` is not in the enum.

**Phase1 also never uses the type on any column** — the legacy
`LeadStatus` is a dead enum definition. A safe fix is to drop the
phase1 `LeadStatus` declaration entirely (or replace it with the
canonical set) before the lead_attribution_journey migration runs.

### Finding 2 — formulas.id type mismatch
**Migration:** `20260822100000_batch3_so_formula_pinning`
**Error:**
```
ERROR: foreign key constraint "sales_orders_formulaId_fkey"
       cannot be implemented
DETAIL: Key columns "formulaId" and "id" are of incompatible types:
        uuid and text.
```

**Root cause:**
`prisma/migrations/20260430122705_phase1/migration.sql` creates the
`formulas` table with `"id" TEXT NOT NULL`.
`prisma/migrations/20260822095959_marketing_batch3_placeholder_repair/migration.sql`
uses `CREATE TABLE IF NOT EXISTS "formulas"` with `"id" UUID PRIMARY KEY`,
which is a no-op when phase1 already created the table. So
`formulas.id` stays `TEXT` in the DB even though the Prisma schema
declares it as `String @id @default(uuid()) @db.Uuid`.
`batch3_so_formula_pinning` then tries to add
`sales_orders.formulaId UUID` with a FK to `formulas(id)` — type mismatch.

A safe fix is to ALTER the `formulas.id` column to UUID (with a
type-cast expression) before batch3_so_formula_pinning runs. This
is the second instance of the same anti-pattern: a later migration
relies on a column shape that phase1 did not create.

### Pattern

Both findings share the same shape:

| Pattern | Effect on R4 fresh-DB deploy |
|---|---|
| `CREATE TYPE X` in phase1 + idempotent `CREATE TYPE X` in later migration | later migration uses old values, `DEFAULT 'NEW_VALUE'` fails |
| `CREATE TABLE T` in phase1 with one column type + `CREATE TABLE IF NOT EXISTS T` in later migration with a different column type | column keeps the old type, FK / insert fails |

The pattern is widespread across the marketing / R&D / SCM batch
migrations; Finding 1 and Finding 2 are the first two to surface
during `prisma migrate deploy` against a fresh DB. Additional
migrations in the chain (batch4 through r2_shipment_lot_lineage)
have not been reached in this R4 verification, so additional
failures of the same shape are likely.

## Decision

Per CLAUDE.md Three-Strike Rule and the R4 spec rule "FIX THE FAILURE
→ rerun affected gate → rerun downstream gates only if change impact
requires it", a coordinated migration fix is required before Gate 1
can pass:

1. Audit every phase1 enum definition and every later migration that
   depends on a different value set.
2. Decide: drop phase1 enums (when unused on any column) or
   `ALTER TYPE ... RENAME` + recreate.
3. Audit every phase1 table column type and every later migration
   that adds a typed column with a different type.
4. Add a single `r4_pre_flight_schema_realign` migration that brings
   the schema into a state where the existing chain applies cleanly
   on a fresh DB.
5. Rerun Gate 1.

This is a non-trivial, multi-file migration fix that touches the
release-candidate's deployability. It must not be done silently or
without an explicit user approval.

## Evidence

```
$ prisma migrate deploy  →  P3009 failed migration
$ prisma migrate resolve --rolled-back 20260822081953_lead_attribution_journey  →  OK
$ prisma migrate deploy  →  LeadStatus enum mismatch (Finding 1)
$ prisma migrate resolve --rolled-back 20260822081953_lead_attribution_journey  →  OK
$ prisma migrate deploy  →  formulas.id type mismatch (Finding 2)

Verdict: GATE_1_PLAYWRIGHT = FAIL
```

## Gate 1 Verdict (composite)

| Sub-gate | Result |
|---|---|
| Backend production build | **PASS** (see BACKEND-BUILD.md) |
| Frontend production build | **PASS** (see FRONTEND-BUILD.md) |
| Day-1 Remediation Playwright | **FAIL** — migration chain blocked |
| Clean release SHA recorded | **PASS** (RELEASE_SHA frozen) |

**GATE_1_RELEASE_ARTIFACT = FAIL** (one sub-gate fails; per R4 §9
all four sub-gates must PASS for the composite to PASS).
