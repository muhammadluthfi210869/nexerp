# P06 Frozen Acceptance Contract v1.0.0

## Certification identity

- Phase: `P06 — Master data and system configuration`
- Certified predecessor: P05 candidate `c7cb59ebed247cce3d947ecb6454a45d92c32ca8`
- Reviewed P06 base: `f93132c5ee77ca5698fa952e52d3ed88f3bb744b`
- Level: bounded `PHASE_GATE`
- Authoritative command: `node scripts/ssot/certify_p06_phase.js`
- Diagnostic command: `node scripts/ssot/diagnose_p06_phase.js`
- Success: exit `0`, verdict `PHASE_PASS`, token `P06:<candidate-full-sha>:PHASE_PASS`
- Machine contract: `scripts/ssot/p06_acceptance_contract.json`
- Subphase authority: `verification/P06_SUBPHASE_MANIFEST.md`
- Evidence: `verification/evidence/P06_PHASE_CERTIFICATION_RESULT.json`

The contract, wrapper, required IDs and thresholds are frozen before implementation. The executor may implement shared production-path gate functions and tests but must not weaken this package. A demonstrable contract defect requires a reproducer and explicit auditor amendment.

## Scope boundary

P06 owns the canonical master-data foundation needed by later domain phases: organization, division, user/role administrative lifecycle, warehouse access, customer, supplier, goods/material, category, unit, tax setup, warehouse, CoA master ownership, formulation master ownership, non-secret system configuration, and their canonical search/import/export surfaces.

Where an entity's behavior belongs to a later domain—such as formulation revision/approval in P08, accounting behavior in P15, KPI in P16, automation in P17, or full UI polish in P19—P06 implements and verifies only the master identity/reference lifecycle required by the canonical contract. Folder names are not authority. Routes such as `/master/kpi-*`, `/master/hr-*`, and `/master/automation` remain assigned to their owning later phases unless the canonical contracts explicitly move them.

P06 must not create duplicate Customer/SalesLead, Goods/MaterialItem, CoA/Account, or Formulation/Formula sources of truth merely to match UI naming. It must reconcile canonical semantics to one physical owner or a documented compatibility adapter.

## Environment

- Node.js 22 and repository-pinned npm dependencies/lockfiles.
- Local loopback PostgreSQL 15/16 reachable through `P06_TEST_ADMIN_URL` or the repository's approved local database configuration. No credential may enter logs or evidence.
- Source database opened read-only for fingerprinting only.
- Disposable databases follow `^nex_p06_[a-z0-9_]+$` and are always dropped in `finally`.
- Prisma CLI/client versions remain exactly aligned with the repository.
- Normal P06 certification does not require Docker, remote deployment, Playwright browser matrices, load testing, DR, or external providers.

## Required functional gates

The exact 16 gate IDs, 20 mutation IDs, six subphases, six seams, and thresholds are defined in `scripts/ssot/p06_acceptance_contract.json`. Every required gate must execute a real production function or source-derived analyzer with nonzero targets. Every mutation must be rejected by the exact expected production gate and reason code; generic/setup exceptions and test-only duplicate logic fail.

Required behavior includes:

1. 100% inventory and traceability for canonical P06 master entities, operations and screens.
2. One explicit source of truth or compatibility adapter for every semantic/physical alias.
3. Live CRUD with validation, deterministic concurrency-safe codes, uniqueness, pagination/filter/search, reference integrity and consistent soft deletion.
4. Import dry-run and commit paths that reuse normal validators/policy/audit, are atomic and idempotent, report row-level failures, and never partially commit.
5. Export parity with current authorized filters and neutralization of spreadsheet formula injection.
6. Server-trusted P05 role/permission, tenant, owner/division, field scope, immutable audit, outbox/idempotency and canonical error controls.
7. Canonical P06 frontend screens use live data, `@/components/dna`, complete operational states, and no production mock/fallback.
8. All subphase and seam tests pass from the same candidate scope before authoritative certification.

## Data lifecycle rules

- Delete means the canonical soft-delete/inactivation behavior; referenced master rows are never physically removed by application operations.
- Normal list/search/export excludes inactive/deleted rows unless a separately authorized explicit filter requests them.
- References to inactive/deleted/cross-tenant rows fail closed on new writes while historical records remain readable under authorization.
- Uniqueness behavior is explicit for active/inactive records and safe under concurrent create/import.
- Codes use the canonical sequence service or database-backed equivalent. `Math.random`, timestamps without locking, and client-authored canonical codes are forbidden.
- Migration/backfill work follows P04 expand/migrate/contract safety and must be reversible or roll-forward recoverable.

## Import/export safety

- Parse and validate do not mutate data.
- Commit is all-or-nothing per declared batch and has a stable idempotency key.
- Duplicate rows, duplicate retry, invalid references, unauthorized fields, oversized files and malformed encodings fail deterministically.
- CSV/XLSX cells beginning with `=`, `+`, `-`, or `@` are neutralized on export where they could be interpreted as formulas.
- Evidence contains counts and redacted row/error samples, never uploaded raw PII or secrets.

## Certification admission

The authoritative command may run only after all required subphases and seams pass `--preflight`, the candidate is committed, generated evidence is the only allowed dirty scope, and no inventory/remediation item remains open. One executor certification run is normal; a second is allowed only for a classified certification-only/environment defect after the affected targeted test and preflight pass.

## Auditor guarantee

If the unchanged committed candidate reproduces the required PASS, all frozen checks/mutations/subphases/seams and evidence validate, P05 remains certified, and no new P0/P1 issue is found, the auditor accepts P06 without adding ordinary criteria.
