# P07 One-Pass Implementation Prompt

You are the sole implementation executor for NEX ERP Phase P07. Work autonomously until P07 passes. This is an execution task, not a request to propose a plan or ask for plan approval.

## Authority and frozen inputs

Read completely before editing:

1. `docs/legacy-erp/verification/P07_FROZEN_ACCEPTANCE_CONTRACT.md`
2. `docs/legacy-erp/verification/P07_SUBPHASE_MANIFEST.md`
3. `docs/legacy-erp/verification/evidence/P07_BASELINE_AND_REMEDIATION_MAP_2026-09-20.md`
4. `docs/legacy-erp/process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` — P07 only
5. `docs/legacy-erp/contracts/00_MASTER_SPEC.md` and its §9.1 authority order
6. relevant P07 portions of contracts `01` through `10`, including process, domain, workflow, API, screen, RBAC, integration and traceability contracts
7. `docs/legacy-erp/reference/REQUIREMENT.md` and `NEX_FINANCE_FINAL_SPEC.md` only where they explicitly affect P07
8. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
9. `docs/legacy-erp/verification/_LAYERED_CERTIFICATION_ACCELERATION_STANDARD.md`
10. `docs/legacy-erp/verification/_CUMULATIVE_REGRESSION_AND_CERTIFICATE_VALIDITY_STANDARD.md`

Frozen base SHA: `5542855667ca47b2e9a55c0e2c897db697b3929d`.

Do not weaken the acceptance contract, thresholds, required IDs or evidence validation. Do not change the base SHA. A contract ambiguity must be resolved using `00_MASTER_SPEC.md §9.1`, recorded in a decision/ledger, and implemented consistently—not guessed differently in code and tests.

## Required operating method

1. Inspect Git status and preserve all pre-existing changes. Never reset, checkout over, delete or rewrite unrelated work.
   The starting workspace contains audit-regenerated P06 evidence files and new P06/P07 planning documents. Record them as pre-existing. Do not interpret the audit-side dirty evidence as a P07 product failure, do not rerun the P06 certifier, and do not silently fold unrelated generated P06 evidence into the P07 implementation commit.
2. Run one complete read-only inventory before implementation. Map every P07 requirement to current contracts, schema, module/service/controller, permission, event, screen and test. Include lead-capture, CRM, guests, BusDev and marketing; identify parallel authorities and fallback/mock paths.
3. Reproduce all measured baseline failures from the remediation map. Search for additional failures across all six subphases before editing.
4. Create one work ledger containing blocker ID, severity, reproducer, root cause, files, repair method, owning subphase, dependent seams and completion evidence.
5. Repair all blockers by root-cause cluster and dependency order. Do not run the full certifier after individual edits.
6. Build a small shared production-path diagnostic registry for the exact frozen gates. Do not build a generic framework. `diagnose_p07_phase.js` must support `--list`, `--changed`, `--subphase <id>`, `--seam <id>`, `--gate <id>` and `--preflight`.
7. Run only the owning targeted subphase after each repair group. Run dependent seams only when an interface changes.
8. After all subphases/seams pass, run bounded preflight once. Fix any failure with its smallest targeted command, then rerun preflight once.
9. Commit the complete candidate. Only then run the authoritative certifier once.
10. Return only after natural exit `0` and a SHA-bound `P07:<candidate-full-sha>:PHASE_PASS` token, or after an actual owner/external-authority blocker with an exact reproducer. Partial green is not completion.

## Implementation requirements

### SF1 — Contract and canonical inventory

- Reconcile the contradictory historical names/routes/IDs against the current canonical authority; do not copy the stale P07 report blindly.
- Establish one canonical lead write model/service. Other modules must delegate or adapt and may not persist a competing truth.
- Update traceability for every owned entity/API/screen/permission/workflow/event/test.
- Keep P08/P09/P17 boundaries explicit.
- Close `P07-B1`, `P07-B2` and `P07-B7`.

### SF2 — Intake, identity, consent and attribution

- Normalize phone/email/external identities deterministically and tenant-safely.
- Deduplicate retries and concurrent submissions without losing new contact/activity history.
- Preserve original and latest attribution plus attribution history according to contract.
- Enforce consent state and withdrawal for consent-required actions.
- Link guest-book intake to the canonical lead rather than creating a parallel lead store.
- Replace critical incomplete mocks with production services and disposable PostgreSQL tests. Unexpected caught errors must fail tests.
- Close timers/apps/Prisma/pg resources in `finally`; one targeted run with `--detectOpenHandles` must exit naturally.

### SF3 — Pipeline, ownership, visibility and SLA

- Enforce legal transitions through one domain transition function; reject stale/illegal transitions.
- Implement owner assignment and reassignment through P05 policy/data-scope controls with actor-at-event audit.
- Compute follow-up due/overdue from an explicit timezone/time-source policy; use injectable/fake time only in tests.
- Make qualification/retry/concurrency idempotent and emit one commercial-opportunity handoff effect without creating P09 sales documents.
- Fix the roles-guard crash without permissive fallback. Missing/malformed metadata must deny safely.

### SF4 — Activity, guest book and reconciliation

- Persist required marketing activity/tasks and link them to canonical lead/owner/tenant.
- Make guest-book and dashboard queries use the same canonical transactional truth.
- Reconcile counts by stage, owner, attribution channel, consent and SLA using seeded controls; every delta must be zero.
- No fabricated totals, static dashboard data or production fallback success.

### SF5 — Frontend

- Inventory all affected canonical P07 screens/routes from current contracts.
- Use live internal APIs and shared generated/domain types; remove touched production mocks/fallbacks.
- Import all UI primitives from `@/components/dna`, never DNA subpaths or direct UI-kit packages.
- Test loading, empty, validation, denied, server-error, success and retry behavior, plus role visibility and data refresh after mutation.
- UI polish is limited to touched P07 screens; system-wide visual certification remains P19.

### SF6 — Golden thread and platform seams

- Use a uniquely named disposable loopback PostgreSQL database `nex_p07_<sha>_<pid>_<purpose>` provisioned with `prisma migrate deploy`.
- Never mutate, clone secrets from or run destructive commands against the source database.
- Prove business write + audit + outbox atomicity and exactly-once behavior through the production P05 services.
- Execute the complete golden thread, one retry/concurrency case, one unauthorized case and dashboard reconciliation.
- Close every app, pool, client, timer and child process and remove every temporary database even on failure.

## Test architecture and speed rules

- Targeted static/unit tests: 10–60 seconds.
- Targeted PostgreSQL integration test: normally 30–180 seconds.
- Preflight: target 5–8 minutes.
- Full certification: target 10–15 minutes and run only after green preflight.
- Use related test paths/configs, not the complete repository suite after each edit.
- Run independent groups in parallel only when they do not share a database, port, generated output or edited file. Use unique database names per worker.
- Do not use sleeps for concurrency/SLA tests; use barriers, controllable clocks and observable completion.
- Do not run Docker, deployment, full browser/visual/load/security/DR suites or every predecessor certifier.
- Run only impact-selected permanent predecessor sentinels: P01 SSOT, P02 lifecycle if contracts change, P05 platform controls actually consumed, and P06 master-reference/import sentinel actually affected.

Minimum targeted test artifacts:

- backend production-path P07 tests for intake/identity and pipeline/ownership;
- backend production-path P07 tests for guest-book/activity/dashboard reconciliation;
- one PostgreSQL golden-thread E2E suite;
- focused frontend P07 behavior tests;
- exact eight adversarial cases from the frozen contract;
- no skipped/todo/only cases.

## Certifier requirements

Create `scripts/ssot/certify_p07_phase.js` as a thin admission-controlled orchestrator over the same diagnostic/test registry. It must:

- fail before heavy work when candidate/source scope/environment is unsafe;
- execute, not merely label, all 12 gates and required adversarial cases;
- record command, exit code, duration, target/test count and parseable summaries;
- reject missing/zero-target/substituted/cached PASS results;
- verify candidate SHA and frozen base;
- recursively redact secrets and connection URLs;
- balance created/dropped temporary databases and assert zero residue;
- write candidate-bound evidence under `docs/legacy-erp/verification/evidence/`;
- emit the token only after every gate passes.

Do not make the runner rewrite source, commit files, weaken tests, use `skipSubprocess`, treat warnings/exceptions as PASS, or require a pristine tree after its own declared evidence outputs are written.

## Final handoff

Report:

- base and candidate SHA plus token;
- changed paths grouped by contract/database/backend/frontend/tests/evidence;
- closure of `P07-B1` through `P07-B7`;
- results and durations for six subphases, six seams, 12 gates and eight adversarial cases;
- exact golden-thread counts and dashboard reconciliation deltas;
- two targeted resource-clean runs where required, source fingerprint and temporary DB cleanup;
- affected predecessor sentinel results;
- any non-blocking P2/P3 observations deferred without changing the P07 verdict.

Do not claim PASS from prose, a manually edited JSON file or a previous SHA.
