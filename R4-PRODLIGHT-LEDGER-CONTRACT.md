# R4 Production-Light → Canonical — Ledger Contract

**Status**: PASS — Gate 1 ledger deterministic
**Date**: 2026-08-25
**Test script**: `r4-shadow-ledger-contract.sh`

---

## Truth

The protected production-light DB has a 22-table schema that is a
**SUPERSET** of the effects of all 21 prior Prisma migrations on disk.

Those 21 migrations were NOT each applied individually through Prisma's
ledger. The historical production-light schema was bootstrapped and
evolved via direct SQL across many months of operations. The canonical
repository today carries their prescriptions as if Prisma had driven the
process.

That said, the schema effects they prescribe ARE in the DB:
`users`, `formulas`, `rnd_*`, `mkt_*`, `scm_*`, etc. — every table the
prior migrations claim to create has its columns and rows.

We do NOT claim `prisma migrate deploy` retroactively walked the chain.
We do claim the **schema state matches the chain's prescription**, and
that each prior migration's contribution is observable in the live DB.

---

## Ledger Strategy

1. **Do NOT rewrite history** — the 21 prior migration folders remain.
2. For each prior migration, run:
   ```
   prisma migrate resolve --applied <NAME>
   ```
   This records in `_prisma_migrations` that the migration's effect is in
   the DB (truthful). It does NOT execute the migration SQL.
3. Run:
   ```
   prisma migrate deploy
   ```
   Prisma sees the only unapplied migration as
   `20260825090000_r4_prodlight_to_canonical` — the additive canonical
   upgrade — and applies it once.
4. Re-run `prisma migrate deploy` — **NO_OP** ("No pending migrations to
   apply"). This is the deterministic same-SHA redeploy contract.

The single forward migration the system actually performs is the
canonical additive migration. Every prior migration is recorded as
already-applied because its schema effect is verified in the shadow DB
before the resolve.

---

## Production Deployment Sequence

```
1. Restore target DB from a backup of protected production-light.
   (Backup must be a clean `pg_dump` of the entire public schema.)
2. Set DATABASE_URL to the new DB.
3. Run `prisma migrate resolve --applied` for each historical migration
   whose effect is verifiable in the DB schema.
   (In our case: all 21 prior.)
4. Run `prisma migrate deploy` once. Applies ONLY the new forward
   migrations (in the R4 release: `r4_prodlight_to_canonical`).
5. Run `prisma migrate deploy` a second time. Output:
       "No pending migrations to apply."
6. Start NestJS service against this DB.
7. Done.
```

This contract ensures that **same-SHA redeploy is always NO_OP** once
the schema is at canonical.

---

## Why we did NOT mark each prior migration as "applied" blindly

Each `prisma migrate resolve --applied` runs only after the corresponding
SQL effect is provably present in the DB. The proof is the migration's
own content: every CREATE TABLE / ALTER TABLE / CREATE INDEX in the prior
migration's `migration.sql` exists in the DB's `information_schema`.

A future operator can re-verify by running:
```
prisma migrate diff --from-url $DATABASE_URL --to-schemaDatamodel prisma/schema/schema.prisma --shadow-url $DIFFDB
```
and confirming the output equals the content of
`20260825090000_r4_prodlight_to_canonical/migration.sql`.

---

## Outcome

- Shadow restore: 22 tables / 8,874 rows
- After canonical: 141 tables / 8,896 rows (no row loss; canonical
  added 119 tables and 22 seed rows of canonical content).
- `round_robin_state.id = 'singleton'` preserved as TEXT.
- 0 orphan foreign keys.
- 22 migrations in `_prisma_migrations`.
- Second `prisma migrate deploy` → "No pending migrations to apply."
