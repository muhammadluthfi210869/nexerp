# NEX ERP P06 — One-Pass Master Data and System Configuration Execution

You own implementation and remediation for **P06 — Master data and system configuration**. Continue autonomously through inventory, implementation, targeted tests, seam tests, preflight, commit, and authoritative certification. Do not stop after writing a plan or after partial green tests.

## Read completely before editing

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/contracts/00_MASTER_SPEC.md §9.1`
3. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
4. `docs/legacy-erp/verification/_LAYERED_CERTIFICATION_ACCELERATION_STANDARD.md`
5. `docs/legacy-erp/verification/P06_FROZEN_ACCEPTANCE_CONTRACT.md`
6. `docs/legacy-erp/verification/P06_SUBPHASE_MANIFEST.md`
7. `docs/legacy-erp/verification/evidence/P06_BASELINE_AND_REMEDIATION_MAP_2026-09-19.md`
8. `scripts/ssot/p06_acceptance_contract.json`
9. P06 portions of `contracts/01_DOMAIN_MODEL.md`, `schema.prisma`, `02_DATA_OWNERSHIP.yaml`, `03_WORKFLOW_STATE_MACHINE.yaml`, `04_BUSINESS_RULES.md`, `05_API_CONTRACT.yaml`, `06_SCREEN_CONTRACT.json`, `07_RBAC_MATRIX.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`, `09_NON_FUNCTIONAL_CONTRACT.md`, and `10_TRACEABILITY_MATRIX.yaml`
10. `reference/REQUIREMENT.md` and `reference/NEX_FINANCE_FINAL_SPEC.md` only as provenance routed into the canonical subject owner
11. Existing master/system backend, Prisma schema/migrations, canonical frontend routes, API clients, tests and P05 public platform controls

## Frozen identity

- P05 certified candidate: `c7cb59ebed247cce3d947ecb6454a45d92c32ca8`
- Reviewed P06 base: `f93132c5ee77ca5698fa952e52d3ed88f3bb744b`
- Contract version: `1.0.0`
- Certifier: `node scripts/ssot/certify_p06_phase.js`
- Expected success: exit `0`, verdict `PHASE_PASS`, token `P06:<candidate-full-sha>:PHASE_PASS`
- Certifier SHA-256: `aae3e97aa9d3bd3236407925f4ea8358d9d7b93ff30a207f38dec99a39db2342`
- Machine contract SHA-256: `6ee5452e73c045714df78d5b77efe84e8376f4b71361da0f6002335fa395c1a8`
- Diagnostic runner SHA-256: `e21b8989ee4bb31b9af2bba288a86e051ae44fd7ddcf0db3a950f37d6f9c5aa6`

Do not modify the three frozen files or weaken IDs, thresholds, base SHA, evidence checks, target counts, mutation semantics, or PASS conditions. Implement the shared production-path functions under `scripts/ssot/lib/` and tests around the application so both diagnostic and authoritative runners consume the same logic.

## Environment preparation

1. Record `git status`, HEAD, merge base and Node/npm/Prisma/PostgreSQL versions without printing secrets.
2. Require Node 22 and repository-pinned dependencies. Do not run broad dependency upgrades or rewrite lockfiles unless a P06 implementation dependency is demonstrably required and recorded.
3. Validate approved local PostgreSQL connectivity using `P06_TEST_ADMIN_URL` or the approved repository local DB configuration; host must be loopback and PostgreSQL major 15/16.
4. Fingerprint the source database read-only. Never migrate, seed, truncate or mutate it.
5. Allocate `nex_p06_<sha>_<pid>_<worker>` databases for mutable parallel integration work and drop all of them in `finally`.
6. Do not start Docker, remote deployment, full browser matrix, load/soak, DR, or clean-room release work.
7. Run `node scripts/ssot/diagnose_p06_phase.js --list`, then implement the shared diagnostic registry and run `--changed` to produce one complete failure inventory before application edits.

## Objective baseline

Current verdict is `NOT_STARTED / IMPLEMENTATION_REQUIRED`. Known root causes P06-B1 through P06-B13 are frozen in the baseline/remediation map. Treat them as one complete remediation batch. Do not fix only the first error surfaced by a slow runner.

## Required implementation method

### P06-SF1 — Contract and inventory

- Derive the canonical inventory for Organization, Division, User/Role administration, Customer, Supplier, Goods, categories, Unit, Tax, Warehouse/WarehouseAccess, CoA, Formulation and non-secret SystemConfig.
- Reconcile all API/screen/permission/event references and semantic aliases contract-first.
- Select one physical writer/source of truth for Customer↔SalesLead, Goods↔MaterialItem, CoA↔Account and Formulation↔Formula, or register a narrow compatibility adapter with owner and removal condition.
- Classify later-phase routes such as KPI/HR/automation correctly; do not expand P06 based on folder names.
- Implement source-derived inventory and mutations for unmapped master and duplicate authority.

Target:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory
```

### P06-SF2 — Identity, access and configuration

- Implement/complete organization, division, user/role administrative lifecycle, warehouse access and typed non-secret configuration behavior required by canonical contracts.
- Reuse P05 policy, scope, audit, outbox, error and configuration public boundaries; do not fork their logic.
- Derive actor-at-event role/permission/tenant/owner/division/field scope from trusted server state.
- Deny by default on list/detail/search/export/write; never accept client-supplied authority.
- Audit governed setting and identity changes transactionally; secrets remain indirections and are never returned.

Target:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF2-identity-config
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-P05-POLICY
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IDENTITY-MASTER
```

### P06-SF3 — Catalog masters

- Complete owned service/repository boundaries for customer, supplier, goods/material, category, unit, tax, warehouse, CoA and formulation reference lifecycle.
- Remove Prisma access from controllers and replace `any` request bodies with validated DTOs.
- Replace `Math.random`, timestamp-only or client-authored canonical codes with the canonical concurrency-safe sequence.
- Add normalized uniqueness and reference constraints/migrations using P04 expand/migrate/contract safety.
- Standardize CRUD, page/filter/search envelope, soft delete/inactivation, historical-reference retention and explicit inactive visibility.
- Ensure writes to inactive, deleted, cross-tenant or nonexistent references fail with canonical errors.

Target:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF3-catalog-masters
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-CATALOG-REFERENCES
```

### P06-SF4 — Bulk import/export

- Implement supplier import required by REQ-001/BUS-RULE-026 and every other canonical P06 import/export operation.
- Use one parser → normalization → validation → authorization → dry-run → atomic commit pipeline shared with ordinary CRUD validators/services.
- Provide row-level diagnostics, stable idempotency key and deterministic retry behavior.
- Mixed valid/invalid batches must not partially commit.
- Export must equal the actor's currently scoped/filterable dataset and neutralize spreadsheet formulas.
- File-size/type/encoding/header/duplicate/reference failures must be deterministic and evidence must not persist raw PII.

Target:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF4-bulk-io
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IMPORT-CRUD
```

### P06-SF5 — Live frontend and DNA

- Reconcile only canonical P06 screens and approved extensions to their API operations.
- Remove all production fallback/mock/local master arrays and warning-and-continue paths. API failure renders a real error/retry state.
- Implement loading, empty, error, denied, success, validation, conflict and inactive/reference states.
- Import every visual/interactive primitive only from `@/components/dna`; no UI-kit subpath, raw primitive replacement or hardcoded visual token.
- Use typed API clients and prove list/detail/create/edit/deactivate/import/export behavior with affected component/integration tests.
- P19 retains full visual/browser polish; P06 still blocks functional fallback, DNA boundary and critical accessibility regressions in affected screens.

Target:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF5-frontend-ui
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-API-UI
```

### P06-SF6 — Integration and certification admission

- Execute the mutation/audit seam for CRUD, import, soft delete and configuration writes.
- Run affected P03/P04/P05 fast regressions, backend/frontend changed-scope type/lint/tests/build and SSOT validation.
- Generate real source/runtime-derived inventory, subphase, seam and scope manifests with raw-byte SHA-256 digests.
- Prove source fingerprint unchanged and all P06 databases dropped.
- Run all 16 gates and 20 mutations through exact production functions.

Target and admission:

```text
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-MUTATION-AUDIT
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF6-integration
node scripts/ssot/diagnose_p06_phase.js --preflight
```

Only after preflight is fully green: commit the candidate and run exactly once:

```text
node scripts/ssot/certify_p06_phase.js
```

## Testing rules

- Targeted subphase/gate/mutation feedback target: 10–120 seconds.
- Database seam target: 1–5 minutes using one isolated database lifecycle per worker where safe.
- Preflight target: 5–8 minutes using shared setup and bounded parallelism.
- Full certifier target: 5–20 minutes and is not an inner debugging command.
- A failed subphase reruns its exact tests and dependent seams only.
- A changed interface invalidates consumer seam results; rerun those seams and preflight, not the full certifier immediately.
- No skipped/only/quarantine/retry-to-green, zero-target, synthetic result, fallback detector or self-declared metric.

## Required production-path harness

Create `scripts/ssot/lib/p06_certification.js` exporting both:

```text
certifyP06({ root, contract, candidateSha })
diagnoseP06({ root, contract, selector })
```

Use shared gate and mutation registries so diagnostic and certification execute the exact same functions, oracles and thresholds. Diagnostic output is always `NON_CERTIFYING`. Unknown selector, missing ID, zero targets, missing service, timeout, worker crash, dirty source, database residue, generic mutation exception, missing observed gate ID, or mismatched reason code fails closed.

## Prohibited shortcuts

- Do not modify the frozen wrapper, machine contract or diagnostic wrapper.
- Do not duplicate canonical master tables/services to avoid reconciliation.
- Do not treat legacy/reference documents or current implementation behavior as runtime authority.
- Do not use mocks/fallbacks in production, direct Prisma in controllers, `any` DTOs for governed writes, `Math.random` codes, hard delete of referenced rows, or manual success summaries.
- Do not replace P05 policy/audit/outbox/error controls with phase-local copies.
- Do not broaden exceptions or lower thresholds.
- Do not stop after the plan, a subset of tests, preflight, or an uncommitted PASS.

## Final handoff

Return only after the authoritative command exits `0` with the SHA-bound token. Include candidate/base SHA, all changed paths, closure P06-B1–B13, 6/6 subphases, 6/6 seams, 16/16 gates, 20/20 mutations, numeric data/import/export/referential/UI results, source/temporary-DB safety, commands/durations, evidence digests and remaining non-blocking observations. If an allowed external or business-decision blocker exists, return its exact reproducer and shortest owner action; never fabricate PASS.
