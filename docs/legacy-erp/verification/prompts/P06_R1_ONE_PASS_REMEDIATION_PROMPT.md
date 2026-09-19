# NEX ERP P06 R1 — One-Pass Honest Remediation and Certification

Continue P06 autonomously from candidate `b0cfb3186ce1317a3b3c16c567df58ca9e02f954`. Do not stop to propose a plan, request approval, or report partial green results. Diagnose all blockers first, repair them by subphase with targeted tests, run one bounded preflight, commit, and only then run authoritative certification.

## Mandatory reading

Read completely before editing:

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R1_2026-09-19.md`
3. `docs/legacy-erp/verification/P06_FROZEN_ACCEPTANCE_CONTRACT.md`
4. `docs/legacy-erp/verification/P06_SUBPHASE_MANIFEST.md`
5. `docs/legacy-erp/verification/evidence/P06_BASELINE_AND_REMEDIATION_MAP_2026-09-19.md`
6. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
7. `docs/legacy-erp/verification/_LAYERED_CERTIFICATION_ACCELERATION_STANDARD.md`
8. `scripts/ssot/p06_acceptance_contract.json`
9. The canonical P06 portions of contracts `00` through `10`, Prisma schema/migrations, P05 platform public controls, master/system backend, API clients and canonical P06 screens.

## Frozen authority

Do not modify:

- `scripts/ssot/certify_p06_phase.js`
- `scripts/ssot/p06_acceptance_contract.json`
- `scripts/ssot/diagnose_p06_phase.js`
- frozen IDs, thresholds, base SHA or success semantics

Implement honest production-path logic under shared libraries and application code. Do not replace checks with regex presence claims, literal metrics, synthetic results or test-only detectors.

## Environment and safety

- Require Node 22, pinned lockfiles and local PostgreSQL 15/16 on loopback.
- Never print connection URLs or secrets.
- The source database is read-only fingerprint input only. Never terminate its sessions, use it as a template, migrate it, lock it, seed it or mutate it.
- Create an empty `nex_p06_<sha>_<pid>_<worker>` database, apply the committed migration chain, seed minimal deterministic fixtures and drop it in `finally`.
- No Docker, deployment, browser matrix, load test or later-phase polish.
- Preserve useful application fixes from the current candidate.

## Stage 0 — One complete inventory

Before editing, execute `diagnose --list`, inspect all B1–B12 from the R1 audit, and create a machine-readable work ledger. Record each blocker, owning files, target tests and dependent seams. Do not invoke the full certifier during diagnosis.

## Batch A — Honest harness foundation

1. Replace default-PASS gate construction with fail-closed observed assertions.
2. Build one executable registry for all 16 gates, 20 mutations, six subphases and six seams. Declared IDs without executed functions fail.
3. Make every metric derived from gate/test observations with provenance and recomputation checks.
4. Replace synthetic mutations with disposable-tree, isolated-DB or real service/input mutations through the exact production gate.
5. Require exact observed gate and reason. Generic/unrelated exceptions, missing context and self-thrown expected errors fail.
6. Remove source-template cloning/session termination and install migrations into a new empty database.
7. Add harness meta-tests for disabled assertions, zero targets, missing IDs, wrong reasons, generic errors, fabricated metrics and source-session termination.

Targeted command to create and keep fast:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory
node scripts/ssot/test_p06_master_negative.js --meta
```

Do not continue until Batch A genuinely fails against the current incomplete application.

## Batch B — SF1 contract inventory

- Parse canonical contracts, Prisma DMMF/schema, Nest routes/providers, frontend routes/API clients and ownership.
- Reconcile organization, division, user/role administration, warehouse access, customer, supplier, goods/material, category, unit, tax, warehouse, CoA, formulation and non-secret system config.
- Declare one writer or narrow compatibility adapter for Customer/SalesLead, Goods/MaterialItem, CoA/Account and Formulation/Formula.
- Emit per-entity operations, screens, permissions, events, source/writer and tested target IDs.

Run only:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory
```

## Batch C — SF2 identity/config and P05 controls

- Complete organization/division/user-role administration, warehouse access and typed non-secret configuration.
- Wire trusted P05 Policy/Scope/Audit/Outbox/Error boundaries; never trust client-authored authority.
- Test allow/deny for role, tenant, division/owner, field, guessed ID and list/detail/search/export/write.
- Prove setting and identity mutations commit atomically with audit/outbox and roll back together on failure.

Run only:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF2-identity-config
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-P05-POLICY
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IDENTITY-MASTER
```

## Batch D — SF3 catalog masters

- Implement real DB-backed CRUD, DTO validation, bounded pagination/filter/search, normalized uniqueness, referential integrity and consistent inactivation for every canonical P06 master.
- Replace category `count + 1` with the canonical sequence service or database-locked atomic sequence.
- Use P04-safe migrations where constraints or indexes are missing.
- Test concurrency, duplicate normalized values, referenced delete, inactive references, historical reads and cross-tenant writes.

Run only:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF3-catalog-masters
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-CATALOG-REFERENCES
```

## Batch E — SF4 bulk import/export

- Implement ordinary-validator reuse, dry-run, atomic commit, stable idempotency and row-level redacted errors.
- Prove mixed invalid batches commit nothing and retry produces no duplicates.
- Implement authorized filter parity for export and neutralize `=`, `+`, `-`, `@` spreadsheet formulas.
- Test malformed encoding/header/type, oversized files, unauthorized fields and invalid/inactive/cross-tenant references.

Run only:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF4-bulk-io
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IMPORT-CRUD
```

## Batch F — SF5 live frontend/DNA

- Derive the canonical P06 screen list from contracts, not a hardcoded partial list.
- Remove `INITIAL_*`, mock/fallback data and warning-and-continue paths from every canonical P06 route, including supplier, customer, goods and warehouse.
- Use typed live API clients and implement loading, empty, error/retry, denied, conflict, validation, inactive/reference and success states.
- Import visual/interactive primitives only from `@/components/dna` and scan dependency closure.
- Add affected component/API integration tests.

Run only:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF5-frontend-ui
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-API-UI
```

## Batch G — SF6 admission

- Execute real changed-scope backend/frontend typecheck, lint, related unit/integration tests and builds.
- Execute SSOT and affected P03/P04/P05 fast regressions.
- Execute mutation/audit seam and verify source fingerprint/session integrity plus zero disposable DB residue.
- Generate evidence only from executed observations; no hand-authored PASS summaries.

Run:

```text
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-MUTATION-AUDIT
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF6-integration
node scripts/ssot/diagnose_p06_phase.js --preflight
```

If preflight fails, rerun only the failed subphase and dependent seams. Do not use the full certifier as a debugger.

## Final certification

Only after all targeted commands and preflight pass:

1. Ensure no skip/only/quarantine, zero target, synthetic result, literal aggregate metric or non-allowlisted dirty file remains.
2. Commit the candidate.
3. Run `node scripts/ssot/certify_p06_phase.js` once.
4. If it passes, run it once more on the exact same SHA to prove reproducibility with existing generated evidence.
5. Return only after both runs emit `P06:<same-full-sha>:PHASE_PASS` and exit `0`.

The handoff must map B1–B12 to files and executed evidence; report observed target counts, numeric CRUD/concurrency/import/export/auth/UI results, command durations, evidence digests, source-session integrity and database cleanup. Do not claim completion from test names or constructed PASS objects.
