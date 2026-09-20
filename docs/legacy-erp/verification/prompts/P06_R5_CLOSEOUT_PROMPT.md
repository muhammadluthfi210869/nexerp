# NEX ERP P06 — Final Closeout

Close P06 by fixing only the six blockers in `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R5_2026-09-20.md`. This is an execution task, not a planning task. Continue until every command below exits naturally with code 0. Do not start P07.

## Frozen scope

Fix only:

1. safe automatic resolution of the approved loopback PostgreSQL admin URL;
2. migration-based disposable database provisioning;
3. complete Nest/Prisma/Jest resource cleanup;
4. deterministic concurrency assertions;
5. genuine fresh-instance restart/idempotency proof;
6. reproducible final evidence.

Do not add new P06 requirements. Do not edit the P06 certifier, gates, registry, analyzers, acceptance contract, thresholds, mutations, phase base, or unrelated application modules. The existing regression gate may remain as-is; the auditor will independently reproduce the commands in this prompt.

Primary editable file:

`backend/test/master/master-governed-import.e2e-spec.ts`

Edit `backend/src/modules/master/services/import-export.service.ts` only if the strengthened concurrency/restart test reveals a genuine implementation defect. Preserve its mandatory dependencies, fail-closed actor behavior, HTTP 400 validation, transaction-scoped lock, atomic audit and outbox behavior.

## Required corrections

### 1. Portable safe database configuration

- Prefer `P06_TEST_ADMIN_URL` when explicitly provided.
- Otherwise derive the admin URL from the approved local backend database configuration using the existing P06 safety validation.
- Require loopback PostgreSQL 15/16.
- Change only the database pathname to the PostgreSQL administration database.
- Never print the URL, username, password, JWT secret, AES key, or other configured secret.
- Missing/unsafe configuration must fail once in setup with a concise safe error.

### 2. Migration discipline

- Delete `prisma db push`, `--accept-data-loss`, and `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` from the suite.
- Create a uniquely named `nex_p06_*` database.
- Provision it with the committed migration chain using `prisma migrate deploy` and the disposable database URL.
- Never migrate, truncate, seed, terminate sessions on, or otherwise modify the source database.

### 3. Resource cleanup

- Every Nest application, TestingModule, Prisma client/adapter pool, PostgreSQL client and child process must be closed/awaited in `finally`.
- Remove every intentional `void altApp` non-close path.
- Fault-injection applications must own separate closeable resources and must not disconnect the main test app.
- Cleanup failure is a test failure.
- Jest must terminate naturally; no manual Ctrl+C, forced kill, `--forceExit`, swallowed open handle, or background process is allowed.

### 4. Honest concurrency proof

Remove duplicate `11b`/`11c` test declarations. Run exactly three unique concurrent trials.

For every trial require:

- two requests settle deterministically according to the documented API behavior;
- at least one successful winner and the second is either the same persisted replay response or the single documented retry/conflict response;
- exactly one master-data logical effect;
- exactly one successful `ImportExecution` row;
- exactly one immutable audit effect for the idempotency key;
- exactly one outbox effect for the operation;
- zero is not an acceptable count for the master/execution/audit/outbox effects;
- unexpected rejection fails the test.

Do not use `<= 1` assertions that allow both requests to fail.

### 5. Genuine restart proof

After the first successful import:

- close or stop the owning service/application provider graph;
- create a genuinely fresh Nest provider graph or a fresh `ImportExportService` plus fresh Prisma/P05 service instances connected to the same disposable database;
- replay the same key and payload;
- assert the persisted result is returned with no second master, audit or outbox effect;
- close the fresh graph and all resources.

Renaming a second call on the same service as “restart” is forbidden.

## Fast execution sequence

1. Inspect the R5 findings and current E2E suite once.
2. Apply all corrections as one batch.
3. Run only the backend P06 E2E while debugging.
4. When it exits 0 with no open-handle warning, commit the candidate.
5. On the unchanged committed candidate, run the backend P06 E2E twice consecutively.
6. Run the small cumulative checks below once.
7. Run the P06 certifier once.

Do not run complete backend/frontend unit suites or production builds repeatedly. Do not clean unrelated warnings.

## Fixed acceptance commands

All commands must exit naturally with code 0:

```text
npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts --detectOpenHandles
npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts
node scripts/ssot/validate_ssot.js
node scripts/ssot/audit_lifecycle_reconciliation.js
npm --prefix frontend run test -- master-screens-behavior.test.tsx
npx tsc --noEmit -p backend/tsconfig.build.json
node scripts/ssot/certify_p06_phase.js
```

Required numeric results:

- P01: 19/19;
- P02: 14/14;
- frontend P06: 15/15;
- backend P06: all uniquely declared tests pass twice, zero skipped;
- three concurrency trials pass the exact-one-effect assertions;
- temporary databases after each run: 0;
- open-handle warning: 0;
- literal/configured secret matches in changed tracked files and generated evidence: 0;
- certifier exit: 0 with SHA-bound P06 token.

## Final handoff

Return only:

- candidate SHA and evidence SHA if different;
- P06 token;
- changed files;
- closure result for the six frozen blockers;
- the two backend E2E commands with test counts, durations, and exit codes;
- concurrency master/execution/audit/outbox counts for all three trials;
- restart replay before/after counts;
- P01, P02, frontend test and backend typecheck results;
- created/dropped/residual database counts;
- secret scan result without secret values;
- certifier result.

If any fixed condition is not green, continue targeted remediation. Do not claim PASS from printed assertions when the process hangs, and do not introduce another acceptance criterion or unrelated refactor.
