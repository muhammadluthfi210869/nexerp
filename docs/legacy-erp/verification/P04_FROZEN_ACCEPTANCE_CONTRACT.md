# P04 Frozen Acceptance Contract v1.0.0

## Certification identity

- Phase: `P04 — Canonical database and migration chain`
- Predecessor: P03 PASS at `cf8b725d9fec4c808937c50217a3bc45050d271a`
- Immutable phase base: `cf8b725d9fec4c808937c50217a3bc45050d271a`
- Level: bounded `PHASE_GATE`
- Authoritative command: `node scripts/ssot/certify_p04_phase.js`
- Success: exit `0`, verdict `PHASE_PASS`, token `P04:<candidate-full-sha>:PHASE_PASS`
- Machine contract: `scripts/ssot/p04_acceptance_contract.json`
- Evidence: `docs/legacy-erp/verification/evidence/P04_PHASE_CERTIFICATION_RESULT.json`

This contract is frozen before implementation. The auditor will use the same command and criteria. No additional ordinary criterion will be introduced after execution begins; only a newly discovered P0/P1 safety, security, correctness, or data-loss defect may amend it.

## Objective baseline and known root causes

- Current P04 registry status: `NOT_STARTED`.
- First failed gate: `predecessor_and_target_safety` because the legacy P04 audit uses a fixed database name and unguarded `DROP DATABASE` behavior.
- A loopback PostgreSQL URL is configured locally, but server version/create-database permission must still be proven by the runner without exposing credentials.
- The historical `8/8 PASS` P04 artifact is provenance only and is not accepted certification evidence.

Known defects that must be closed in the first implementation pass:

| ID | Root cause | Required repair direction |
|---|---|---|
| P04-B1 | `09_NON_FUNCTIONAL_CONTRACT.md` still describes production `prisma db push`, conflicting with the phase gate and migration-based CI. | Update the owning contract first and make deploy/init/CI use `migrate deploy` only. |
| P04-B2 | The legacy audit derives an admin URL from ordinary `DATABASE_URL`, uses fixed `erp_p04_test`, and executes `DROP DATABASE IF EXISTS` without loopback/source/inventory guards. | Central safe-target library, unique run-owned DBs, exact prefix/inventory validation, source fingerprint, finally cleanup. |
| P04-B3 | “Baseline upgrade” merely inspects the ledger after an empty migration; it never constructs the P03 baseline or proves data preservation. | Materialize phase-base migrations from Git, seed affected fixtures, apply candidate, reconcile counts/hashes/backfills. |
| P04-B4 | Migration correctness is inferred from arbitrary PK/FK minimum counts and a drift command; constraints, invalid indexes, orphans, and data-loss paths are not exhaustively tested. | Runtime-derived schema/constraint/index inventory plus negative SQLSTATE probes and zero-drift comparison. |
| P04-B5 | Rollback rehearses a large destructive historical `down.sql`, manually removes a ledger row, and proves only one table disappearance. | Test only candidate P04 delta in isolated DB; compare baseline/candidate schema and fixture digests through down/up. |
| P04-B6 | N-1/N compatibility is represented by one hard-coded `users` query, not every affected table. | Generated affected-table manifest with 100% old/new read/write probes. |
| P04-B7 | Existing migrations can be edited silently and the old suite has no phase-base checksum comparison. | Treat every migration present at P03 base as immutable; repair through new forward migrations. |
| P04-B8 | Old evidence self-declares PASS and embeds fixed dates/counts rather than raw SHA-bound execution results. | Structured result returned to the frozen wrapper; missing/unparseable/zero-target evidence fails closed. |

## Scope and explicit exclusions

P04 owns the physical PostgreSQL schema, Prisma schema/migration lineage, safe baseline upgrade, deterministic backfill, rollback/roll-forward, constraints/indexes, and N-1/N database compatibility.

P04 does not execute against production or shared remote databases. Full legacy ETL, deployment, Docker runtime, backup/restore DR, load tests, browser tests, and application-domain E2E remain later-phase work. Static deployment-script inspection is required only where it can bypass migrations or execute destructive schema synchronization.

## Safety boundary

1. Use `P04_TEST_ADMIN_URL` when provided; otherwise `DATABASE_URL` may be used only when its host is loopback and its database name is a recognized local test database.
2. Never drop, truncate, migrate, seed, or modify the database named in the source URL.
3. Create unique databases named only `nex_p04_<short-sha>_<pid>_<purpose>` for `empty`, `baseline`, `rollback`, and `shadow` purposes.
4. Before every create/drop, validate the exact resolved database name against `^nex_p04_[a-z0-9_]+$` and an in-memory inventory created by the current process.
5. Cleanup may drop only databases created by the current run. Terminate connections only for those exact databases.
6. Refuse non-loopback targets, production-like database names, missing admin/create-database permission, missing PostgreSQL, unsupported PostgreSQL major, or ambiguous URLs.
7. Never log credentials or full connection URLs. Evidence records only PostgreSQL major, loopback host class, generated database names, and redacted command metadata.
8. Cleanup runs in `finally`; cleanup failure makes certification fail.

## Canonical technical decisions to record

Before schema implementation, correct the owning contract inconsistency in `09_NON_FUNCTIONAL_CONTRACT.md`: production schema evolution uses `prisma migrate deploy`; `prisma db push`, `--accept-data-loss`, and equivalent schema synchronization are forbidden in production/CI/certification paths.

The supported upgrade baseline for P04 is the complete migration state materialized from the frozen P03 phase-base commit. Candidate migrations are applied on top of that baseline. Rolling deployment compatibility is N-1 and N for one deployment window; destructive contract/removal occurs only after backfill, reconciliation, and N-1 retirement in a later migration.

Existing migration files present at the phase base are immutable. Repairs use new forward migrations, never edits to already-versioned migration SQL.

## Required gates

### 1. `predecessor_and_target_safety`

- P03 registry entry is PASS and bound to the frozen SHA.
- Node 22, local Prisma 7.10.0/client 7.10.0, and PostgreSQL 15 or 16 are recorded.
- Target passes every safety boundary above.
- Source database fingerprint before and after certification is identical.

### 2. `contract_consistency`

- Contract and deployment scripts consistently require `migrate deploy`.
- No production/CI/init path uses `db push`, `--accept-data-loss`, automatic migration resolve, or uncontrolled raw schema SQL.
- Schema/migration authority and N-1/N window are documented.

### 3. `prisma_validate_generate`

- Local CLI only; declared, locked, installed CLI and client versions match exactly.
- `prisma validate` and `prisma generate` exit 0.
- Canonical domain entities are reconciled to implementation models through the existing P02 lifecycle mapping; count-only comparison is forbidden.

### 4. `migration_chain_integrity`

- Every migration directory has one non-empty `migration.sql`; identifiers are unique and deterministically ordered.
- Every migration file existing at the P03 base is byte-identical to that Git object.
- New migration names are monotonic, checksummed, and contain no secret.
- Failed, rolled-back, duplicate, missing, or edited history count is zero.
- Every new P04 migration has a reviewed `down.sql` or an explicitly proven roll-forward-only strategy that does not claim rollback support. For P04 certification, reversible schema changes are expected.

### 5. `empty_db_migrate`

- Create a unique empty database and deploy the complete chain once.
- `prisma migrate status` reports no failed or pending migration.
- Database-to-current-schema diff is empty using Prisma's supported diff command and isolated shadow database.
- Record tables, migrations, enums, constraints, and indexes from runtime truth; do not use hard-coded minimum counts as correctness proof.

### 6. `baseline_upgrade`

- Materialize the phase-base migration directory from Git into an OS temporary directory without symlink/junction/shared mutable files.
- Apply it to a unique baseline database.
- Insert deterministic representative fixtures for every table/column affected by candidate migrations.
- Apply candidate migrations with the current production path.
- Reconcile fixture row counts and stable hashes before/after. Zero silent deletion, duplication, orphaning, truncation, or null/default corruption.
- Backfills have explicit affected/updated/skipped/rejected counts whose totals reconcile.

### 7. `migration_idempotency`

- A second `migrate deploy` is a real no-op with zero pending migrations.
- Backfills rerun without duplicate rows or different values.
- Concurrent migration lock contention is bounded and fails safely; it must not apply the same migration twice.

### 8. `rollback_rehearsal`

- On an isolated rollback database, capture schema digest and fixture digest at phase-base state.
- Upgrade to candidate, execute new P04 down migrations in reverse order, and prove schema/data return to the declared baseline contract without data loss.
- Roll forward again and prove candidate schema/data digests and migration ledger are healthy.
- A rollback script may delete only its own migration ledger row and only inside the isolated database.

### 9. `constraint_index_audit`

- Schema drift is zero.
- No unvalidated FK/check constraint, invalid index, duplicate conflicting index, missing referenced target, or orphan FK exists.
- Required unique/idempotency constraints and indexes are derived from Prisma/runtime metadata, not arbitrary numeric thresholds.
- Constraint violation probes must fail with expected SQLSTATE and leave the transaction/database consistent.

### 10. `expand_contract_compatibility`

- Candidate migrations follow expand → migrate/backfill → contract.
- Reject destructive `DROP`, incompatible rename, enum-value removal, type narrowing, and new required column without safe default/backfill during the N-1/N window.
- Any exceptional DDL requires an approved exact occurrence, owner, compatibility proof, and roll-forward/rollback plan; broad waivers are forbidden.

### 11. `old_new_version_coexistence`

- Every affected table has an explicit compatibility probe manifest.
- N-1 read/write probes pass after candidate migration.
- N read/write probes pass on the same database.
- Defaults, nullable transitions, dual-read/write/backfill behavior, and removal conditions are asserted.
- Coverage is 100% of migration-affected tables; a single hard-coded `users` probe is insufficient.

## Required adversarial suite

All mutation IDs in `scripts/ssot/p04_acceptance_contract.json` must mutate real input and invoke the same production safety/analyzer path. A mutation passes only when the certifying path rejects it for the expected gate. Text-presence assertions and synthetic PASS objects are insufficient.

The suite must cover remote/unsafe target rejection, protection of the source database, edited/missing migrations, schema drift, non-idempotency, data-loss/backfill mismatch, rollback mismatch, unsafe contract DDL, invalid constraints/indexes, missing N-1/N probes, stale SHA evidence, and unexpected skips.

## Evidence schema

Each required check records:

- `id`, `status`, `executed`, `synthetic`, `skipped`;
- redacted command, exit code, duration, timeout/worker status;
- database purpose/name, PostgreSQL/Node/Prisma versions;
- base/candidate SHA and relevant migration checksums;
- before/after schema digest, fixture counts/hashes, reconciliation totals;
- migration ledger pending/failed/rolled-back counts;
- drift, constraint, index, FK, DDL, compatibility, and skip metrics;
- cleanup result and remaining failures.

The final result also contains every threshold key and exact value required by the machine contract. Missing, ambiguous, zero-target, stale, skipped, or unparseable evidence is FAIL.

## Cross-cutting lens disposition

| Lens | P04 disposition |
|---|---|
| Canonical contracts/traceability | REQUIRED — schema authority and migration policy |
| Database migration/backfill/integrity/rollback | REQUIRED — primary scope |
| Backend business rules/state/money | NOT APPLICABLE except persistence compatibility; domain semantics remain unchanged |
| API compatibility | REQUIRED only through N-1/N persistence probes for affected models |
| Auth/RBAC/tenant/PII | REQUIRED for preservation of existing constraints/data; no permission redesign |
| Audit/notes/mentions/events | REQUIRED for schema/data preservation when affected; no workflow redesign |
| Frontend/UI DNA/accessibility | NOT APPLICABLE — no UI change is authorized |
| Reporting/KPI | REQUIRED for persistence/lineage preservation when affected; no formula redesign |
| Architecture/dead code | REQUIRED for migration tooling ownership and removal of unsafe schema paths |
| Security/secrets | REQUIRED — redaction and destructive-target guards |
| Performance/observability | REQUIRED only for bounded migration durations, lock behavior, and measurable backfill counts |
| Deployment/reversal | REQUIRED statically and through isolated rollback/roll-forward rehearsal; no real deployment |

## Pre-certification checklist

- [ ] P03 PASS is committed in the registry; candidate descends from the frozen base.
- [ ] Contract conflict around `db push` is resolved contract-first.
- [ ] Scope manifest classifies every changed path; UI and unrelated domain work are absent.
- [ ] Database target is loopback and source database safety fingerprint is captured.
- [ ] All existing phase-base migrations are byte-identical.
- [ ] Local Prisma validate/generate pass with exact aligned versions.
- [ ] Empty migration, baseline upgrade, second deploy, rollback, and roll-forward pass on unique isolated databases.
- [ ] Drift, failed/pending migrations, data loss, orphan FK, invalid constraint/index, unsafe DDL, and unexpected skips are all zero.
- [ ] Compatibility probe coverage is 100% of affected tables.
- [ ] Every required adversarial mutation passes through production paths.
- [ ] Every created temporary database is cleaned up; source database remains unchanged.
- [ ] Evidence is bound to the committed candidate SHA and contains no credential.
- [ ] The authoritative command exits 0 and emits the SHA-bound P04 token.

## Auditor guarantee

If the unchanged committed candidate independently reproduces the authoritative PASS and no new P0/P1 safety, correctness, security, or data-loss issue is found, P04 will be accepted without ordinary new criteria.
