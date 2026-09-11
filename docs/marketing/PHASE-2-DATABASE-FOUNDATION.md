# Digital Marketing — Phase 2 Database Foundation

Status: IMPLEMENTED, NOT APPLIED TO ACTIVE DATABASE  
Date: 2026-09-10  
Phase 1 contract: `docs/marketing/PHASE-1-PRODUCT-UI-CONTRACT.md`

## Outcome

Phase 2 establishes the additive database contract for Management Task, Social
Planner, verified reporting, and provider integration health. The active local
database `erp_db_test` was used only for read-only inventory and migration-ledger
checks. All migration execution was performed against a uniquely named disposable
database that was dropped after each run.

## Migration-history recovery

The active ledger originally referenced migration files absent from the working
tree. Exact historical SQL was recovered from Git history and verified against the
SHA-256 checksums stored in `_prisma_migrations`.

The durable controls are:

- `npm --prefix backend run db:audit-migrations` — read-only checksum and presence audit.
- `npm --prefix backend run db:repair-migrations` — local-file recovery only; writes a
  file only when a Git revision can reproduce the database checksum exactly.
- `20260902140000_add_director_user_role` — idempotent historical bridge required so a
  clean database can replay `20260902150000_zaki_director_role`.

The accepted ledger state is zero database-only migrations, zero checksum
mismatches, and zero failed or rolled-back migrations. Local pending migrations are
reported but are not treated as corruption.

## Canonical data model

### Task execution

- `MarketingBrand` is the relational brand authority. Dreamlab and Toribio are
  seeded by code; legacy task/project brand strings remain readable.
- `MarketingTask` gains canonical type/status, minute-based estimates and actuals,
  output/reference URLs, optimistic-lock `version`, and `brandId`.
- `MarketingProject` gains canonical status, optimistic-lock `version`, and
  `brandId`.
- `MarketingTaskChecklistItem` stores ordered, required, attributable checklist
  completion independently of legacy aggregate counters.

### Social workflow

- `SocialPost` gains brand, assignee, reviewer, brief, reference, canonical workflow
  status, version, and metric synchronization identity.
- `SocialPostMedia` normalizes ordered assets without removing legacy `mediaUrls`.
- `SocialPostMetricSnapshot` stores append-only point-in-time metrics with source,
  capture time, verification metadata, and a deduplication key.

### Reporting and integrations

- Reporting periods, brand/channel metrics, weekly reports, daily story metrics,
  and channel funnels separate entered/verified analytical data from post caches.
- Integration connections store encrypted-secret components and non-secret config;
  raw provider tokens are not modeled as plaintext fields.
- Integration sync jobs preserve execution result, counts, error identity, and actor.

## Expand and backfill policy

`20260910150000_marketing_task_social_foundation` is expand-only:

- no `DROP`, `TRUNCATE`, or bulk delete;
- legacy fields remain available during application rollout;
- canonical task/project statuses are derived from legacy values;
- hour values are copied to minute values;
- legacy task links are classified as output or reference links;
- task, project, social-post, and OKR records receive a relational brand;
- foreign keys use the delete behavior declared in Prisma and cascade key updates;
- canonical status, task type, and reporting date-order checks are validated.

Deployment must use `prisma migrate deploy` only after backup, a green Phase 2 gate,
and an approved maintenance window. Do not use `prisma db push` or
`prisma migrate reset` against an environment containing ERP data.

## Verification

Run from the repository root:

```powershell
npm run verify:marketing:phase2
```

The gate validates the frozen Phase 1 contract, Prisma schema, active migration
ledger, expand-only SQL policy, scoped backend types/tests, and a complete clean-chain
migration rehearsal. The rehearsal asserts 11 required tables, 18 required columns,
two canonical brands, completed task-status backfill, and then force-drops only the
validated `erp_phase2_rehearsal_*` database it created.

Known out-of-scope debt: a global Prisma schema diff still reports historical drift
in non-marketing ERP modules. Phase 2 does not apply destructive reconciliation to
those modules; their cleanup requires a separately reviewed stabilization phase.
