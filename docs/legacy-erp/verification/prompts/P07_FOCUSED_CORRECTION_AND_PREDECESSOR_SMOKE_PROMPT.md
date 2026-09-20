# P07 Focused Correction and Affected-Predecessor Smoke Prompt

Correct the committed P07 implementation at current HEAD. This is one bounded correction cycle under `_FAST_DELIVERY_EXECUTION_STANDARD.md`, not a new phase certification or a repository-wide audit. Work until the focused commands pass; do not stop for plan approval.

## Scope

Fix only reproducible P0/P1 gaps in P07 and directly affected P01/P02/P05/P06 behavior. Do not reopen earlier phases for P2/P3 debt, do not rerun historical certifiers, and do not create certify/diagnose/SHA/token/mutation/evidence machinery.

## Required corrections

1. Replace P07 tests that duplicate logic inside the test with calls to actual production services/controllers/policies.
2. Lead intake retry and real concurrency must call `LeadCaptureService` and prove exactly one canonical lead/effect for the normalized identity. Three successful duplicate rows is failure.
3. Pipeline transition, owner reassignment, tenant/role denial, SLA and idempotency must call production implementations. Remove local `legalTransition`, local `policyDecide` and local `Map` oracles.
4. Dashboard reconciliation must call the production dashboard/query service and compare its result with an independently computed seeded control total. Assigning source totals directly to dashboard variables is forbidden.
5. Golden thread must use production audit/outbox mechanisms and their real storage, not `LeadAttribute` markers pretending to be audit/outbox. Prove rollback atomicity and exactly-once effects.
6. Execute a real unauthorized/cross-tenant request through production policy/guard and assert denial with zero disclosure/mutation.
7. Add one focused frontend P07 behavior suite covering live API contract, loading, denied, error/retry and success refresh for the primary flow; include it in `verify:p07`.
8. Rename `p07-mutation-*` and `test:p07:mutations` to ordinary `p07-negative-*` / `test:p07:negative`. Do not build mutation infrastructure.
9. Make `verify:p07` a thin package-script composition. Remove arbitrary controller/service-count thresholds and custom PASS/gate behavior from `p07_verify.js`; use existing native typecheck/lint/DNA/test commands scoped to affected files.
10. Each database test owns a unique run database or unique fixture namespace and cleans only what it created. `p07_clean_db.js` must never drop every `nex_p07_%` database belonging to other concurrent runs; prefer per-test `finally` cleanup plus residue assertion.

## Focused execution order

1. Run the current focused P07 tests once and inventory every failure/false-positive above.
2. Repair production behavior and tests by root-cause group.
3. Run only the owning test after each group:
   - `npm --prefix backend run test:p07:intake`
   - `npm --prefix backend run test:p07:pipeline`
   - `npm --prefix backend run test:p07:activity`
   - `npm --prefix backend run test:p07:dashboard`
   - `npm --prefix backend run test:p07:negative`
   - `npm --prefix backend run test:p07:golden-thread`
   - `npm --prefix frontend run test:p07`
4. Run affected earlier-phase smoke tests once after P07 is green:
   - `npm --prefix backend run test:unit`
   - `npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts`
   - `node scripts/ssot/validate_ssot.js` only if canonical contracts changed;
   - `node scripts/ssot/audit_lifecycle_reconciliation.js` only if models/routes/modules/contracts changed.
5. If a predecessor smoke fails, fix it only when it is a reproducible P0/P1 caused or exposed by the touched interface. Record unrelated P2/P3 and continue.
6. Run `npm run verify:p07` once. One rerun is allowed only after a real correction.

## Parallelization

- Backend production-service corrections sharing lead/policy/schema files are sequential under one owner.
- Frontend focused tests/UI correction may run in parallel after API shapes are frozen and only if it does not edit shared generated types.
- Static SSOT/type checks may run in parallel with isolated frontend tests.
- PostgreSQL integration suites and cleanup run sequentially unless each worker has a proven unique database.
- P08 may be inventoried read-only in parallel, but no P08 schema/API implementation begins until the corrected P07 handoff is stable.

## Finish condition

Finish when focused P07 backend/frontend tests, the real production-service golden thread, affected predecessor smoke tests and `npm run verify:p07` exit naturally with code 0; residual P07 test databases are zero; no scoped P0/P1 remains. Return concise numeric results and non-blocking P2/P3 backlog only.
