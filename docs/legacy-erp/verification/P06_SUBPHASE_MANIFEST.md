# P06 Subphase and Seam Manifest

## Execution graph

```text
P06-SF1 contract/inventory
        |
        +--> P06-SF2 identity/config --------+
        +--> P06-SF3 catalog masters --------+--> P06-SF6 integration/certification
                       |                      |
                       +--> P06-SF4 bulk I/O -+
        +--> P06-SF5 frontend UI ------------+
```

Contracts and public interfaces are frozen in SF1. SF2 and SF3 may proceed concurrently only after that freeze. SF4 depends on the same services and validators proven by SF3. SF5 may build UI states in parallel after API schemas are frozen. SF6 is sequential.

## Subphases

| ID | Objective and owned scope | Dependencies | Targeted command | Parallel class | Completion rule |
|---|---|---|---|---|---|
| `P06-SF1-contract-inventory` | Reconcile canonical master entities, operations, screens, ownership, aliases, required permissions, and system configuration; update contracts/traceability first | P05 PASS | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory` | `SEQUENTIAL` | 100% canonical inventory; zero unmapped/duplicate authority; schemas parse |
| `P06-SF2-identity-config` | Organization, division, users/roles, warehouse access, non-secret SystemConfig, typed configuration boundaries, P05 policy integration | SF1 | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF2-identity-config` | `SEQUENTIAL` for shared P05 policy/schema; isolated tests may parallelize | Positive CRUD/config plus deny/cross-tenant/field-scope mutations PASS |
| `P06-SF3-catalog-masters` | Customer, supplier, goods/material, categories, units, tax, warehouse, CoA, formulation ownership/adapters; CRUD, deterministic codes, uniqueness, references and soft deletion | SF1 | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF3-catalog-masters` | `PARALLEL_ISOLATED` | Every owned master passes CRUD/reference tests in a unique database |
| `P06-SF4-bulk-io` | Import dry-run/validate/commit, row diagnostics, atomicity, idempotency, safe CSV/XLSX export, pagination/filter/search parity | SF3 stable service API | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF4-bulk-io` | `PARALLEL_ISOLATED` | Valid/invalid/mixed/duplicate/retry/export-scope tests PASS with zero partial commit |
| `P06-SF5-frontend-ui` | Canonical master screens use live APIs and `@/components/dna`; remove fallback/mock paths; loading/empty/error/denied/success states; affected a11y/responsive component tests | SF1 API freeze; can consume SF2/SF3 mocks only in tests | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF5-frontend-ui` | `PARALLEL_SAFE` | 100% canonical P06 screen manifest; zero production fallback/DNA violation |
| `P06-SF6-integration` | Execute all seams, affected golden thread, regression/build, evidence, cleanup, preflight and certification admission | SF2–SF5 | `node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF6-integration` | `SEQUENTIAL` | Six seams and all 16 gates/20 mutations green; preflight PASS |

## Seam matrix

| Seam ID | Producer → consumer | Required proof | Targeted command |
|---|---|---|---|
| `P06-SEAM-P05-POLICY` | P05 Policy/Audit/Outbox/Error → every P06 mutation | Server-trusted actor context, deny-by-default, same-transaction audit/outbox, canonical errors | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-P05-POLICY` |
| `P06-SEAM-IDENTITY-MASTER` | Organization/division/user/role/warehouse access → master queries and writes | Tenant, owner/division, role and field scopes affect read/write/search/export consistently | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IDENTITY-MASTER` |
| `P06-SEAM-CATALOG-REFERENCES` | Category/unit/CoA/warehouse/formulation → customer/supplier/goods consumers | Valid references accepted; inactive/deleted/cross-tenant/orphan references rejected | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-CATALOG-REFERENCES` |
| `P06-SEAM-IMPORT-CRUD` | Bulk import/export → canonical services/validators | Import cannot bypass CRUD validation/policy/audit; exported scoped dataset equals list/filter semantics | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IMPORT-CRUD` |
| `P06-SEAM-API-UI` | API contracts/errors/pagination → canonical screens | Live create/update/deactivate/search/import/export plus loading/empty/error/denied states; no production fallback | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-API-UI` |
| `P06-SEAM-MUTATION-AUDIT` | CRUD/import/soft delete → database/audit/outbox | Business change and audit/outbox commit together; rollback leaves none; retry is idempotent | `node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-MUTATION-AUDIT` |

## Resource isolation

- Node.js: version 22 as pinned by the repository.
- PostgreSQL: loopback PostgreSQL 15/16; source database is read-only and fingerprinted.
- Mutable tests: unique database `nex_p06_<sha>_<pid>_<worker>` per parallel worker, or transaction reset proven equivalent.
- Frontend tests: no shared mutable backend database unless assigned a unique worker database.
- Ports and output directories: unique per worker.
- Docker, remote deployment, full browser matrix, load/soak, DR and full legacy migration are not part of P06.

## Admission sequence

```text
--changed
→ each required --subphase
→ each required --seam
→ --preflight
→ commit candidate
→ node scripts/ssot/certify_p06_phase.js once
→ independent auditor/CI reproduction once
```
