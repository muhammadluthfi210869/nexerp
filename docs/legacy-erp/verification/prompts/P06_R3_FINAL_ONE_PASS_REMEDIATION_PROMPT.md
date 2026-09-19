# NEX ERP P06 R3 — Final One-Pass Production Remediation

You are the implementation executor for the final P06 remediation. Work autonomously until every finish condition in this prompt is genuinely green. Do not stop after analysis, after writing a plan, after targeted tests, or after the existing P06 certifier prints `PHASE_PASS`.

The objective is not zero warnings across the entire ERP and not unrelated refactoring. The objective is to close exactly P06-R3-B1 through P06-R3-B7, restore cumulative P01–P06 validity, and leave an auditor-reproducible production implementation.

## 1. Required reading and authority order

Read completely before editing:

1. `AGENTS.md`
2. `docs/legacy-erp/README.md`
3. `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R3_2026-09-19.md`
4. `docs/legacy-erp/verification/_CUMULATIVE_REGRESSION_AND_CERTIFICATE_VALIDITY_STANDARD.md`
5. `docs/legacy-erp/verification/P06_FROZEN_ACCEPTANCE_CONTRACT.md`
6. `docs/legacy-erp/verification/P06_SUBPHASE_MANIFEST.md`
7. `docs/legacy-erp/verification/prompts/P06_ONE_PASS_IMPLEMENTATION_PROMPT.md`
8. P06 requirements in `docs/legacy-erp/contracts/01_DOMAIN_MODEL.md` through `10_TRACEABILITY_MATRIX.yaml`
9. `docs/legacy-erp/reference/REQUIREMENT.md`
10. `docs/legacy-erp/reference/NEX_FINANCE_FINAL_SPEC.md`

Authority order when text conflicts: canonical contracts → frozen acceptance contract → R3 audit → this remediation prompt → older P06 audit/prompt documents.

Starting application candidate is `fbd92e2b491817f020e2cdc42582acfbf1b4cf2b`; evidence HEAD inspected by the auditor is `54907721fe9b628dcd7e83c50de8251cd8742792`.

## 2. Oracle integrity — forbidden edits

The executor is being evaluated by the existing oracle and an independent auditor. Do not edit, delete, rename, bypass, skip or regenerate the logic of these files:

- `scripts/ssot/certify_p06_phase.js` — Git blob `efe37a969011e67af3ac6fb8de5108881c40846d`
- `scripts/ssot/diagnose_p06_phase.js` — Git blob `99db536bd1aa413aa442b17fd8b6798a4f8d6802`
- `scripts/ssot/p06_acceptance_contract.json` — Git blob `fdbef3d6f4d4c824db62d8727dbc63157e02c2a8`
- `scripts/ssot/lib/p06_gates.js` — Git blob `1fca7cd05692d35d68d916a73f77c33cdd91ac2d`
- `scripts/ssot/lib/p06_test_registry.js` — Git blob `c44ba798e2de8a89c0bb1e15484487815d92cfc0`
- `scripts/ssot/lib/p06_analyzers.js` — Git blob `eb7f7277277743eb20294da7d3e2108a326b0d98`
- `scripts/ssot/lib/p06_certification.js` — Git blob `f326783cfaae8d7ed981890483621fa51089b45c`
- `scripts/ssot/test_p06_master_negative.js` — Git blob `f2f9b4cfbadcbd98fbbc2062af21a951f3a03082`

Verify these blob IDs before the first edit and again after the final commit. Do not edit thresholds, candidate/base selection, allowlists, expected reason codes or evidence validators. Do not add an alternate certifier. If an oracle limitation exists, fix the application and prove it with application-level black-box tests; record the limitation honestly.

Do not discard the auditor's R3 report or the regenerated `_p02_test_results.json`. Inspect the initial working tree and preserve unrelated user changes.

## 3. One-pass inventory before edits

Before changing code, map every R3 blocker to concrete files and tests in one ledger. Inspect all master controllers, `MasterModule`, `ImportExportService`, P05 services, relevant Prisma models/migrations, and every canonical P06 frontend page. Search for all of the following in P06 scope:

- optional Policy/Scope/Audit/Outbox injection;
- `any` in governed request bodies/queries or actor context;
- direct audit/outbox Prisma writes;
- swallowed errors and catch-and-continue paths;
- in-memory idempotency;
- API errors converted to `[]`, `null`, sample data or success;
- missing import entity handlers;
- missing tenant/actor propagation;
- P02 registry drift.

Do not start a full certifier during discovery. Produce the complete internal defect list first, then remediate by the groups below.

## 4. Remediation group A — cumulative lifecycle reconciliation

Repair P02 reconciliation for all legitimate P04–P06 additions. Derive actual source inventory; do not hide files, reduce source scanning, preserve stale counts, or add broad exceptions.

Required closure includes:

- P04/P05 migrations and P05 platform models;
- P05 platform services/modules/barrel members;
- P06 divisions, personnel, system configuration and import/export controllers/services;
- current BussDev and other service/event reachability;
- all new/changed public exports.

Targeted acceptance:

```text
node scripts/ssot/validate_ssot.js
node scripts/ssot/audit_lifecycle_reconciliation.js
```

Both must exit 0. P02 must report 14/14 from freshly derived current inventory. Do not manually change only the generated result JSON.

## 5. Remediation group B — real governed import/export boundary

### 5.1 Typed HTTP contracts

Replace every governed `@Body() ...: any`, `@Query() ...: any`, and optional/untyped request actor in canonical P06 import/export endpoints with validated DTOs and trusted authenticated request context. Apply `class-validator` rules for:

- supported entity and format;
- non-empty rows or uploaded content;
- maximum row/file size;
- idempotency-key format and length;
- dry-run boolean;
- pagination/filter/search/export options;
- rejected client-provided tenant, role or permission fields.

The tenant, organization, division, actor ID, roles and permissions must come from the authenticated server context, never from the request body/query.

### 5.2 Mandatory P05 controls

`PolicyService`, `ScopeService`, `AuditService` and `OutboxService` must be mandatory Nest dependencies for governed mutations. Remove optional constructor markers and unused imports. Register their owning P05 module correctly; do not instantiate them manually in production controllers/services and do not copy their logic into a P06-local replacement.

Every list, search, export, dry-run and commit path must apply the same policy and tenant/data scope. Deny by default when actor/scope is absent or unresolved. Cross-tenant guessed IDs and unauthorized fields must return canonical errors without revealing record existence.

### 5.3 Persistent idempotency

Delete the module-level `IDEMPOTENCY_CACHE` and implement durable PostgreSQL-backed import execution state. Reuse a suitable canonical model if one exists; otherwise add a forward migration and Prisma model with at least:

- tenant/organization identity;
- entity/import operation;
- idempotency key;
- deterministic request/payload digest;
- status (`IN_PROGRESS`, `SUCCEEDED`, `FAILED` or equivalent);
- redacted result/diagnostic summary;
- timestamps;
- a database unique constraint covering tenant + operation/entity + idempotency key.

The same key and same digest returns the original result after a new service instance/process. The same key with a different digest fails deterministically. Concurrent identical requests have one winner and one persisted outcome; they must not double-write master rows, audit rows or outbox events.

### 5.4 Atomic audit and outbox

Remove direct phase-local audit/outbox writes and every catch that swallows their failure. Use the P05 public services with the same Prisma transaction used for master changes and persisted idempotency state.

Required invariant:

```text
master mutation + import execution state + immutable audit + outbox event
```

must commit together or all roll back. Audit/outbox failure must propagate as a canonical failure. Never continue because a test double or table is missing.

### 5.5 Complete import behavior

Implement every canonical P06 import operation, including supplier and all import routes currently exposed by controllers. An exposed route must not reach an unsupported default branch. Reuse ordinary service validators/policy/reference rules; do not maintain weaker import-only validation.

Use the installed standards-compliant CSV parser instead of comma splitting. Prove quoted commas, escaped quotes, CRLF/LF, UTF-8 BOM, malformed encoding/header, formula-injection output sanitization, oversized input, duplicate rows, invalid/inactive/cross-tenant references, dry-run, mixed invalid batch rollback and export/list scope parity.

## 6. Remediation group C — real application-path security and transaction tests

Add application tests under the normal backend test tree. Tests must boot the real Nest application/module against an isolated loopback PostgreSQL database and call HTTP endpoints with `supertest`. Do not directly construct `PolicyService`, `ScopeService`, controllers or plain mock result objects as the proof.

At minimum prove:

1. authorized tenant-A actor can list/import/export tenant-A data;
2. unauthorized role is denied;
3. tenant-A actor cannot read, mutate, import or export tenant-B data;
4. client-injected tenant/role/permission is rejected or ignored in favor of trusted context;
5. missing actor/scope fails closed;
6. invalid mixed import leaves zero new master, audit, outbox and success-idempotency rows;
7. injected audit failure rolls back everything;
8. injected outbox failure rolls back everything;
9. identical retry from a new Nest application/service instance returns one durable result without duplicates;
10. same key with changed payload is rejected;
11. two concurrent identical requests have one logical effect;
12. all exposed canonical import entities execute successfully with valid fixtures.

Fault injection must intercept the real P05 boundary inside the production transaction. A test-only adapter/provider override is permitted; changing production code to detect test mode is forbidden.

Use unique disposable database names matching the approved P06 pattern, preserve the source database fingerprint, and clean all temporary databases in `finally`.

## 7. Remediation group D — canonical P06 UI operational states

Fix every canonical P06 screen, not only `PersonnelRegistry`, including supplier, customer, goods/material and warehouse screens.

- Query functions must throw/reject on API failure; they must not return `[]`, `null`, stale sample data or fabricated success from `catch`.
- Render an explicit DNA-based error state with a working retry action.
- Preserve distinct loading, empty, denied, validation/conflict, success and inactive/reference states.
- Use typed API clients and components imported through the approved `@/components/dna` boundary.
- Do not modify later-phase P16 HR/KPI/automation pages to satisfy P06 scanning.

Add/extend Vitest + Testing Library tests for every canonical P06 page. For each page, prove at least successful data rendering, legitimate empty response, rejected API response with visible error, and retry followed by success. Tests must fail if the query catches an error and returns an empty collection.

## 8. Fast execution strategy

Use the layered strategy. Do not invoke the full P06 certifier after individual edits.

### Group-level targeted loop

After each group, run only relevant checks, aiming for seconds rather than a full repository run:

- changed backend ESLint files;
- `tsc`/build only when types or Prisma generation changed;
- Jest `--runTestsByPath` for the new P06 black-box/transaction tests;
- Vitest with the exact P06 page test files;
- the two P02 commands after registry reconciliation;
- existing P06 subphase/seam diagnostic only as an additional signal, never as sole proof.

Diagnose all failures from one run, fix them as a batch, and rerun that targeted group. Do not alternate one-line edits with full certification.

### Preflight once after all groups are green

Run these sequentially and require exit 0:

```text
node scripts/ssot/validate_ssot.js
node scripts/ssot/audit_lifecycle_reconciliation.js
npx tsc --noEmit -p backend/tsconfig.build.json
npx tsc --noEmit -p frontend/tsconfig.json
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix backend run test:unit
npm --prefix frontend run test
npm --prefix backend run build
npm --prefix frontend run build
node scripts/ssot/test_p06_master_negative.js --meta
node scripts/ssot/diagnose_p06_phase.js --preflight
```

If a command fails, repair all failures revealed by that command, rerun only the failed/affected command first, then rerun the cumulative preflight once. Do not repeatedly run both production builds while debugging a narrow failure.

Warnings are not blockers unless an existing frozen threshold, changed-file rule, security issue or functional requirement makes them blockers. Do not clean unrelated repository-wide warnings.

## 9. Final certification and reproducibility

After all targeted tests and cumulative preflight are green:

1. verify the frozen blob IDs from section 2 are unchanged;
2. review `git diff` for test weakening, secret leakage, generated binaries and out-of-scope edits;
3. commit the application candidate;
4. confirm no disallowed dirty files;
5. run `node scripts/ssot/certify_p06_phase.js` exactly once;
6. do not run a second expensive certifier—independent reproduction belongs to the auditor;
7. commit only allowed generated evidence if repository policy requires it, while keeping the token bound to the application candidate SHA.

The existing certifier token is necessary but not sufficient. You may report P06 ready for audit only when every command in section 8 and every behavioral test in sections 5–7 also passes on the same application candidate.

## 10. Absolute prohibitions

Do not:

- weaken or edit the oracle files listed in section 2;
- convert failures into PASS literals, fixed 0/100 metrics or zero-target success;
- use mocks as the only evidence for production security/transaction behavior;
- make governed dependencies optional;
- swallow audit/outbox/policy/scope errors;
- use an in-memory idempotency cache;
- accept `any` request DTOs on governed endpoints;
- accept tenant/role/permission identity from the client;
- use direct Prisma audit/outbox writes from P06;
- turn frontend API failures into empty results;
- modify production code based on `NODE_ENV === 'test'` to bypass controls;
- change unrelated phases, perform broad dependency upgrades, use Docker, deploy remotely or perform P19 visual-polish work;
- stop and ask for approval after writing a plan.

## 11. Required final handoff

Return only after completion, with:

- application candidate SHA and evidence commit SHA if different;
- exact changed paths grouped by R3 blocker;
- explicit closure table for P06-R3-B1 through P06-R3-B7;
- fresh P01 SSOT and P02 14/14 results;
- exact backend HTTP behavioral test counts and frontend screen-state test counts;
- proof of two tenants/roles, restart/two-instance idempotency, concurrent single effect, and audit/outbox rollback fault injection;
- all targeted and cumulative commands with exit codes and durations;
- P06 certifier exit code/token;
- frozen blob verification before and after;
- source fingerprint and temporary-database cleanup result;
- any genuinely non-blocking observation, clearly separated from pass criteria.

If any required behavior or command is not green, report `P06 R3 NOT READY` with the exact reproducer. Never report `PHASE_PASS`, `complete`, or `all production paths verified` based only on the existing P06 token.
