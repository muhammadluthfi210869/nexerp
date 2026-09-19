# NEX ERP P06 R4 — Final Corrective Execution Prompt

Execute this remediation autonomously to completion. Do not stop after analysis or an implementation plan. Do not claim success from the old P06 token. P06 is complete only when every mandatory command and behavioral invariant below passes from the committed candidate.

This is a bounded final correction for P06-R4-B1 through P06-R4-B8. Do not perform unrelated refactoring, repository-wide warning cleanup, Docker work, deployment, or P07 implementation.

## 1. Read before editing

Read completely:

1. `AGENTS.md`
2. `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R4_2026-09-20.md`
3. `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R3_2026-09-19.md`
4. `docs/legacy-erp/verification/prompts/P06_R3_FINAL_ONE_PASS_REMEDIATION_PROMPT.md`
5. `docs/legacy-erp/verification/P06_FROZEN_ACCEPTANCE_CONTRACT.md`
6. `docs/legacy-erp/verification/P06_SUBPHASE_MANIFEST.md`
7. `docs/legacy-erp/verification/_CUMULATIVE_REGRESSION_AND_CERTIFICATE_VALIDITY_STANDARD.md`
8. Relevant P06 canonical contracts and reference requirements.

Inspected evidence HEAD: `5c3a9da34edd7d87d794c279a4b9b90a7d771601`.

Preserve unrelated user changes. The auditor's validation commands regenerated tracked result documents; do not mistake generated timestamps for application edits and do not discard the R4 audit report.

## 2. One explicitly authorized oracle amendment

R3 contained a contradiction: the legacy oracle directly constructs `new ImportExportService(prisma)`, while production requires Audit, Outbox, Policy and Scope dependencies to be mandatory. Correct this contradiction first.

You are authorized to edit only these oracle implementation files:

- `scripts/ssot/lib/p06_gates.js`
- `scripts/ssot/lib/p06_test_registry.js`

No other certifier, contract, analyzer, mutation or certification file may change. In particular, preserve:

- `scripts/ssot/certify_p06_phase.js`
- `scripts/ssot/diagnose_p06_phase.js`
- `scripts/ssot/p06_acceptance_contract.json`
- `scripts/ssot/lib/p06_analyzers.js`
- `scripts/ssot/lib/p06_certification.js`
- `scripts/ssot/test_p06_master_negative.js`

The two authorized oracle files may change only as follows:

1. Replace every `new ImportExportService(prisma)` / missing-dependency construction with a shared strict test factory that creates real `AuditService`, `OutboxService`, `PolicyService` and `ScopeService` using the same isolated Prisma client and passes them to `ImportExportService`.
2. Every governed import/export probe must provide a complete server-trusted actor and organization context. Missing actor must have its own negative assertion and must fail closed.
3. Replace `subphase_seam_and_regression` literal PASS fields with measured subprocess results for:
   - `node scripts/ssot/validate_ssot.js`
   - `node scripts/ssot/audit_lifecycle_reconciliation.js`
   - the targeted backend P06 E2E suite
   - the targeted frontend P06 screen-state suite
   - backend and frontend TypeScript checks
4. Gate status must be derived from actual exit codes and parsed results. Zero targets, missing output, timeout, skipped tests, malformed output, or any nonzero exit must fail closed.
5. Remove fixed/self-declared regression coverage, complexity and duplication values. Reuse existing production analyzers for measured changed-scope values, or fail with a structured reason when they cannot be measured. Do not invent 0/100 values.

Do not weaken expected errors, thresholds, mutations or scope. Record a compact before/after diff and Git blob IDs for the two authorized files. After this amendment, treat their new content as frozen for the rest of the run.

## 3. Application correction A — mandatory governed dependencies

In `ImportExportService`:

- make `AuditService`, `OutboxService`, `PolicyService` and `ScopeService` mandatory constructor dependencies;
- delete null-returning `require*` helpers;
- delete `noopWithAudit` and every conditional omission of policy, scope, audit or outbox;
- do not add a test-environment bypass;
- do not instantiate P05 services manually in production code;
- fail at module startup/provider resolution if a mandatory dependency is unavailable.

`enforcePolicy()` must reject missing actor, missing actor ID and missing required tenant/organization scope. It must never `return` success when actor is absent.

All HTTP controllers must pass a typed, server-derived actor context. Replace `@Req() req: any` with the repository's authenticated request type or add one shared typed request interface/decorator. Never default identity to `anonymous`.

## 4. Application correction B — validation must produce canonical HTTP errors

For non-dry-run and dry-run validation failures, preserve row-level diagnostics but return/throw the canonical API error status required by the contracts. The existing committed test requires mixed invalid import to return HTTP 400, not HTTP 201 containing `success: false`.

Requirements:

- HTTP import with any invalid row returns 400 with stable canonical code and row diagnostics;
- zero master, idempotency, audit and outbox rows are committed;
- empty rows/content is rejected by DTO validation;
- service callers receive a typed/canonical exception rather than a false-success transport result;
- no controller-specific status workaround; the service/API error mapping must be consistent for every import entity.

First targeted command after this correction:

```text
npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts
```

It must pass 12/12 twice consecutively from unchanged code before proceeding. This targeted rerun is intentional and is not the full certifier.

## 5. Application correction C — deterministic concurrent idempotency

Replace the current read-before-transaction/end-only-SUCCEEDED insert algorithm with an atomic serialized acquisition inside the same PostgreSQL transaction.

Preferred implementation:

1. derive a stable lock identity from tenant/organization + entity + idempotency key;
2. acquire a PostgreSQL transaction-scoped advisory lock, or an equivalently strong row/unique-key lock, inside the transaction;
3. read the execution row after lock acquisition;
4. same key + different digest → canonical 409 conflict;
5. existing SUCCEEDED + same digest → return persisted result without repeating mutation/audit/outbox;
6. otherwise create/transition `IN_PROGRESS`, perform master mutation, immutable audit and outbox in that same transaction, then update `SUCCEEDED`;
7. any failure rolls the entire transaction back, including `IN_PROGRESS`;
8. a waiting identical request deterministically observes and replays the committed winner.

Do not rely on process memory, timing, catch-and-retry sleep, or two concurrent upserts accidentally converging. Strengthen invariant 11 so it sends two concurrent HTTP requests, uses `Promise.allSettled`, asserts both deterministic responses, one master effect, one successful execution record, one audit effect and one outbox effect. Repeat this concurrency case multiple times with unique keys to expose races.

## 6. Application correction D — honest tenant/access semantics

Derive ownership from canonical contracts; do not invent tenant columns merely to satisfy a test.

For every P06 master entity classify it as one of:

- organization/tenant-owned: queries, search, export, detail and mutations must apply a server-derived scope predicate; or
- globally shared canonical master: document this explicitly and enforce the canonical permission model without claiming row-level tenant isolation.

Update tests accordingly:

- for at least one tenant-owned entity, seed distinct tenant-A and tenant-B rows and prove tenant-A HTTP list/export/detail cannot observe tenant-B rows;
- for global masters, prove unauthorized roles cannot mutate/export and label the behavior as global access—not tenant filtering;
- cross-tenant tests must inspect returned/persisted data, not only call PolicyService with mismatched arguments.

The existing `exportData()` may not build its final `where` clause only from client filters. Apply the server-trusted scope for tenant-owned entities before the Prisma query.

## 7. Application correction E — portable, secret-free E2E

Remove all literal database URLs, usernames/passwords, JWT secrets and AES keys from `backend/test/master/master-governed-import.e2e-spec.ts` and all new evidence.

- Use `P06_TEST_ADMIN_URL` or the approved local environment configuration through the existing P06 safety/redaction helper.
- Require loopback PostgreSQL 15/16 and a safe disposable database name.
- Generate ephemeral JWT/AES test secrets in memory when safe, or consume explicitly approved test env values; never commit them.
- Never print connection URLs or secret values.
- Create the disposable DB from current migrations/schema, not an unverified stale template. If a template is used for speed, first verify its migration/schema fingerprint equals the candidate and fail closed otherwise.
- Drop temporary databases in `finally`; cleanup failure must fail the test rather than only `console.warn`.

Run a recursive secret scan over changed files and P06 evidence. It must reject credentialed URL user-info, configured secret values and forbidden connection fields while avoiding disclosure in output.

If the previously committed database password is valid outside an isolated local-only test environment, report `OWNER ACTION REQUIRED: rotate exposed database credential`. Do not rewrite Git history or rotate external credentials yourself.

## 8. Test integrity corrections

The E2E description must match execution:

- either boot the real `AppModule`, or honestly describe and justify a production-equivalent module graph;
- prefer HTTP for authorization, validation, tenant and concurrency invariants;
- use Nest `overrideProvider()` for fault injection before module compilation, not mutation of private fields with `(service as any)`;
- direct service construction is allowed only for the explicit restart/new-instance persistence check and must include all mandatory dependencies;
- audit/outbox fault tests must traverse a real HTTP endpoint and assert rollback in PostgreSQL;
- no `.skip`, `.only`, quarantine, retry-to-green, conditional PASS or swallowed cleanup error.

The frontend 15/15 suite already reproduces. Preserve it and only change it if application behavior legitimately requires a stronger assertion. Do not weaken existing screen error/retry expectations.

## 9. Fast execution order

Use this sequence to avoid another long loop:

1. Inventory all B1–B8 changes once.
2. Apply the narrowly authorized oracle amendment and freeze its new hashes.
3. Correct mandatory dependencies + HTTP 400 behavior.
4. Run the targeted backend E2E until 12/12 passes twice.
5. Correct concurrency/tenant/secret portability and strengthen targeted assertions.
6. Run only the targeted backend E2E and secret scan.
7. Run the frontend targeted suite once.
8. Run cumulative preflight once.
9. Commit the application candidate.
10. Run the authoritative P06 certifier exactly once.
11. Do not run a second full certifier; independent reproduction is the auditor's responsibility.

Do not repeatedly run full backend/frontend builds while debugging one E2E assertion.

## 10. Mandatory cumulative preflight

All commands must exit 0 from the same source candidate:

```text
node scripts/ssot/validate_ssot.js
node scripts/ssot/audit_lifecycle_reconciliation.js
npx tsc --noEmit -p backend/tsconfig.build.json
npx tsc --noEmit -p frontend/tsconfig.json
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix backend run test:unit
npm --prefix frontend run test
npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts
npm --prefix backend run build
npm --prefix frontend run build
node scripts/ssot/test_p06_master_negative.js --meta
node scripts/ssot/diagnose_p06_phase.js --preflight
```

Warnings are blockers only when covered by an existing threshold, changed-file rule, security issue or P06 functional requirement. Do not clean unrelated warnings.

After preflight, verify:

- P01 19/19;
- P02 14/14;
- backend P06 E2E 12/12 with zero skipped;
- frontend P06 screen tests 15/15 with zero skipped;
- no credential/secret match in changed files/evidence;
- all temporary P06 databases removed;
- no optional P05 dependency, `noopWithAudit`, missing-actor success, private-provider mutation, or direct one-argument `ImportExportService` construction remains;
- the amended regression gate records real command exit codes/durations, not literal PASS.

## 11. Final certification and handoff

Commit the application candidate before certification. The working tree must be clean except the exact generated-evidence allowlist.

Run once:

```text
node scripts/ssot/certify_p06_phase.js
```

Return only when it exits 0 and all earlier requirements remain green. Final handoff must include:

- candidate and evidence SHAs;
- token;
- B1–B8 closure table with file/line evidence;
- exact authorized oracle diff and new frozen blob IDs;
- two consecutive targeted E2E results before preflight;
- final cumulative command table with exit codes, counts and durations;
- concurrency repetition results and database row counts;
- real tenant/global-master classification and isolation assertions;
- secret scan result without printing secret values;
- created/dropped temporary database counts;
- source database fingerprint;
- changed paths grouped by blocker;
- external credential rotation notice if applicable.

If any condition fails, continue targeted remediation. If an external dependency genuinely blocks execution, return `P06 R4 NOT READY` with the exact safe reproducer. Never report PASS merely because the legacy token is green.
