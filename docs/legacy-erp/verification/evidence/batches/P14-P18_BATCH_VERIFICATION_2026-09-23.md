# P14–P18 — Batch Verification (independent re-run)

**Audit run:** 2026-09-23
**Revision audited:** `90f86469d42a0ad2564ee0587d9869c67cf944f1` (tag `audit-baseline-p09-p19`)
**Method:** `verification/_BATCH_VERIFICATION_PLAN.md`
**Auditor:** read-only re-run; no source file was modified by this audit.

## Verdict

**FAIL.**

Every phase in the batch fails its frozen `verify:pNN` command at the frozen revision. Two
phases additionally fail at their own backend/frontend suites. The ledger's `PASS` rows are not
reproducible.

## Independently reproduced commands

| Command | Exit | Result (as-is) | Ledger claim |
|---|---|---|---|
| `npm run verify:p14` | **1** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … dual tsc clean" |
| `npm run verify:p15` | **2** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … dual tsc clean" |
| `npm run verify:p16` | **1** | no tsc step in composition; `frontend test:p16` 1/6 passes | "PASS (27/27 backend, 6/6 frontend)" |
| `npm run verify:p17` | **2** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … dual tsc clean" |
| `npm run verify:p18` | **2** | halts at `tsc -p frontend` — 91 `error TS` | "PASS … dual tsc clean" |
| `npm --prefix backend run test:p14` | **1** | 1 suite failed, 29/30 | 30/30 — **contradicted** |
| `npm --prefix backend run test:p15` | 0 | 7 suites, 19/19 | 19/19 — confirmed |
| `npm --prefix backend run test:p15:bridges` | 0 | 6 suites, 11/11 | 11/11 — confirmed |
| `npm --prefix backend run test:p15:checkpoint` | 0 | 1 suite, 1/1 | — |
| `npm --prefix backend run test:p16` | 0 | 6 suites, 27/27 | 27/27 — confirmed |
| `npm --prefix backend run test:p17` | 0 | 5 suites, 27/27 | 27/27 — confirmed |
| `npm --prefix backend run test:p18` | 0 | 5 suites, 22/22 | 22/22 — confirmed |
| `npm --prefix frontend run test:p14` | **1** | 4/6 passed | 6/6 — **contradicted** |
| `npm --prefix frontend run test:p16` | **1** | **1/6 passed** | 6/6 — **contradicted** |
| `npm --prefix frontend run test:p15 / p17 / p18` | 0 | 12/12, 4/4, 4/4 | confirmed |
| clean-db, all ten phases | 0 | 0 residue rows, 0 leftover databases | confirmed |

Backend phase suites are real HTTP e2e (`supertest` + `getHttpServer()` + live Prisma), 0 mocks,
0 skips. The confirmed counts above are genuine passes.

## P0 findings

| # | Finding | Evidence |
|---|---|---|
| P0-1 | **Every `verify:p14` … `verify:p18` exits non-zero.** P14, P15, P17, P18 halt at the same frontend `tsc` step as the P09–P13 batch (89–91 `error TS`); P16 fails at its own frontend suite. | `verify-exitcodes.txt` |
| P0-2 | **P16's frontend live-flow suite passes 1 of 6 tests.** Four failures are `Error: Element type is invalid … got: undefined` (a component imported from `@/components/dna` is `undefined` at render) and one is `ReferenceError: DnaCell is not defined` in `master/hr-attendance/page.tsx`. The suite's own pages (`hr-payroll`, `hr-attendance`, `hr-recruitment`, `hr/kpi`) are the components under test. | `fe-p16.log` |
| P0-3 | **The same unreachable-FK defect as P09–P13 blocks P14.** `p14-s1` fails on `Foreign key constraint violated on the constraint: finished_goods_woId_fkey` when creating a Finished Good. The FK graph is not satisfiable from the write path the tests drive — the same class as P0-2 in the P09–P13 batch. | `be-p14.log:52-59` |

## P1 findings

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **The ledger rows are falsified for this batch.** P15/P17/P18 read "dual tsc clean" against a failing `tsc` in the frozen composition. P16 reads "6/6 frontend" against 1/6. P14 reads "30/30 backend" against 29/30. | table above |
| P1-2 | **`verify:p16` has no typecheck step at all**, violating the P08 standing rule 3 ("Put a typecheck in `verify:pXX`") that the ledger itself declares binding for P09 onward. P16 is a P16-phase violation of a rule declared in the same file. | `package.json` `verify:p16` |
| P1-3 | **Tenant isolation is absent on the tables these phases touch.** 192 of 207 models carry no `organizationId`; finance/HR/reporting tables are in that set. Same class as `P08-B6`, still unprovable. | schema scan |
| P1-4 | **No CI workflow runs any `verify:pNN`.** Nothing enforces the cited numbers. | `.github/workflows/` |

## P2 findings

| # | Finding | Evidence |
|---|---|---|
| P2-1 | **Canonical contract coverage for this batch is 0%.** API operations owned by P14 (17) and P15 (29) and P16 (2) are all `PLANNED`; screens owned by P14 (5), P15 (15), P16 (1), P17 (6), P18 (26) are all `PLANNED`. 117 canonical screens across P09–P18 remain unreconciled. **Reconciliation queue, not proof of absence.** | `_LIFECYCLE_REGISTRY.json` |
| P2-2 | **`--forceExit` on every P14–P18 backend script (37 total backend scripts).** Open handles cannot surface. With `ts-jest { diagnostics: false }`, test-file type errors cannot either. | `backend/package.json` |
| P2-3 | **KPI/report screens with no API wiring.** Of the pages P14–P18 name as live surfaces, several are zero-API static files (e.g. `master/hr-payroll/page.tsx` carries an in-file `INITIAL_PAYROLL` array and no `api`/`useQuery`). The p16 test asserts against those literals. | page source; `p16-live-flow.behavior.test.tsx` |
| P2-4 | **P19's design canonicity is unenforced for the dashboards.** `check_page_shell_layout.js` fails 3 pages with raw detached tables (`finance/dashboard`, `legality/dashboard`, `rnd/dashboard`). | `vp19.log` |

## P3 findings

- Registry header still reads `phase=P02`, `effective_date=2026-09-17` after regeneration, because
  the generator hardcodes them. The registry cannot truthfully describe P14–P18.

## Next action

Do not progress. P0-3 (FK-integrity write path) must be fixed with a failing reproduction already
in `backend/test/p14` and `backend/test/p13`. P0-2 (undefined DNA component in HR pages) must be
fixed with the existing failing `frontend test:p16` as the reproduction.