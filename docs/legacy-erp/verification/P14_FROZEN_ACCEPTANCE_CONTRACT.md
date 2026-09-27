# P14 Frozen Acceptance Contract

**Phase:** P14 — QC, Quarantine, Release, and Traceability  
**Contract version:** `P14-v1`, frozen 2026-09-21  
**Final verification command:** `npm run verify:p14`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typecheck and database cleanup checks pass  

## Purpose and finish line

P14 is complete when one real, tenant-safe production execution & quality golden thread proves:

`Inbound Goods Receipt (BUS-RULE-046) & Production Packaging (BUS-RULE-037) create stock locked in QUARANTINE (availableQty = 0) → Unauthorized release attempts are blocked with 403 Forbidden → 4-Phase QC Inspections (Inbound, Mixing, Filling, Packing) validate analytical & physical parameters against R&D targets → Out-of-spec parameters trigger hard-gate with Supervisor PIN bypass override → Defect Categorization (BUS-RULE-078) & Partial Dispositions (Released, Rework, Scrap with COPQ BUS-RULE-077) with Retest capability → Authorized QC & APJ Sign-off executes idempotent stock release to AVAILABLE stock (BUS-RULE-047) with Certificate of Analysis (COA) → Bidirectional Batch Recall Traceability traverses complete backward genealogy tree (FG -> Packaging -> Filling -> Mixing -> Raw Material lots) and forward recall tree (Raw Material lot -> affected FG batches & customer delivery orders)`

and the transactions produce immutable audit logs, balanced stock movements, zero static array mocks in the UI, and zero residue rows under concurrent load.

## Frozen scope

In scope:
- **Quarantine-by-Default Invariant & Authorization Enforcement (`BUS-RULE-046`, `BUS-RULE-037`)**:
  - Inbound materials from supplier goods receipt and finished goods from packaging strictly initialize with `availability: 'QUARANTINE'` and `availableQty: 0`.
  - Packaging/receipt cannot directly create sellable/allocatable stock.
  - Inspection audits, disposition decisions, and release execution are strictly restricted to authorized roles (`QC_LAB`, `APJ`, `SUPER_ADMIN`, `DIRECTOR`). Unauthorized users are rejected with 403 Forbidden.
- **4-Phase QC Inspections & Parameter Validation**:
  - Inbound: CoA verification, organoleptic (color/aroma/texture), visual container check.
  - Mixing: Bulk analytical parameters (pH, viscosity cps, density, homogenity). Compares against formula targets (`QCParameter`).
  - Filling: In-process mechanical checks (cap torque, vacuum leak test, fill volume/weight).
  - Packing: Secondary packaging checks (inkjet batch code & expiry legibility, tamper seal, master box count).
  - Out-of-spec values trigger `PARAMETERS_OUT_OF_SPEC`. Can only be overridden with a valid Supervisor PIN.
- **Defect Categorization & Partial Dispositions (`BUS-RULE-078`, `BUS-RULE-077`)**:
  - Defect categorization (`BOTOL_BOCOR`, `PH_OOS`, `VISCOSITY_OOS`, `LABEL_MIRING`, `SEGEL_ROBEK`, `TUTUP_PECAH`, `LAINNYA`).
  - Dispositions: `RELEASED`, `REWORK`, `SORTING`, `SCRAP`, `USE_AS_IS`, `RETURN_TO_VENDOR`.
  - Partial disposition splits inspection batches proportionally. Scrap generates COPQ financial loss records.
  - Retest workflow allows re-auditing batches following rework or R&D correction recipes.
- **Idempotent QC & APJ Release to AVAILABLE Stock (`BUS-RULE-047`)**:
  - Authorized release transitions inventory from `QUARANTINE` to `AVAILABLE`.
  - Balanced movements: OUT from `QUARANTINE`, IN to `AVAILABLE`.
  - Idempotency key protection: Retried or repeated releases return HTTP 200 without creating duplicate stock movements or duplicating inventory balances.
  - Certificate of Analysis (COA) generation and APJ (Apoteker Penanggung Jawab) digital sign-off with SIPA license registration.
- **Bidirectional Recall Traceability Engine**:
  - Backward trace: Given Finished Goods batch / QR code, recursively resolves complete 5-stage genealogy: FG $\rightarrow$ Packaging stage $\rightarrow$ Filling stage $\rightarrow$ Mixing stage $\rightarrow$ Raw material lots & supplier info.
  - Forward recall trace: Given raw material lot / supplier drum code, resolves all Work Orders, Batch Records, Finished Goods batches, and customer Delivery Orders that consumed that material.
- **Frontend Live Surfaces & DNA Compliance**:
  - Named quality surfaces (`/quality/workbench`, `/quality/qc-release`, `/quality/dashboard`, `/quality/karantina`, `/quality/coa`, `/quality/apj-release`), eliminating all static mock arrays (`FALLBACK_QC_RELEASE_BATCHES`, `FALLBACK_QUARANTINE`) and using `@/components/dna`.

Out of scope:
- General ledger period close and balance sheet closing (P15);
- HR attendance, payroll disbursement, and staff contracts (P16);
- WhatsApp / Email automated webhook notification drivers (P17).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P14-01` | **Quarantine-by-Default & Authorization Gate:** Inbound goods and packaged FG default to `QUARANTINE` with `availableQty = 0`. Non-QC roles attempting inspection or release are rejected with 403 Forbidden. |
| `AC-P14-02` | **4-Phase Inspections & Supervisor PIN Gate:** Validates analytical/mechanical parameters across Inbound, Mixing, Filling, and Packing. Out-of-spec parameters are rejected unless authorized by a valid Supervisor PIN. |
| `AC-P14-03` | **Dispositions, Partial Dispositions & Retest:** Supports partial disposition splits (pass, rework, scrap). Scrap logs COPQ records. Rework batches can be re-audited under an audited retest linkage. |
| `AC-P14-04` | **Idempotent Stock Release & APJ COA Sign-off:** Authorized QC/APJ release transitions inventory from `QUARANTINE` to `AVAILABLE` with COA generation. Resubmitting with the same idempotency key or batch does not duplicate stock movements. |
| `AC-P14-05` | **Bidirectional Recall Traceability:** Backward trace returns complete 5-tier genealogy tree from FG to supplier drums. Forward recall trace returns all affected FG batches and customer delivery orders from a contaminated raw material lot. |
| `AC-P14-06` | **Frontend Live Surfaces & DNA:** Named quality surfaces fetch live API data, handle error/loading/empty states with DNA design tokens, and operate with zero static array mocks. |
| `AC-P14-07` | **Thin Final Verification & Clean DB:** `npm run verify:p14` runs all focused backend suites, frontend live UI behavior suite, real DB golden thread, dual typechecks, and DB cleanup checks with natural exit `0`, leaving 0 residue rows in PostgreSQL. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| Inbound Quarantine | Default Quarantine | `contracts/04_BUSINESS_RULES.md` `BUS-RULE-046` | Inbound items enter QUARANTINE_DRUM / available 0 | None |
| FG Quarantine | Packaging FG Quarantine | `BUS-RULE-037` | Packaging output created in QUARANTINE | None |
| QC Stock Release | Stock to Available | `BUS-RULE-047` | OUT QUARANTINE, IN AVAILABLE, idempotent key | None |
| Defect Categorization | Pareto Defect Types | `BUS-RULE-078`, `raw/quality_control.md` §B | Mandatory defect category on REJECT | None |
| COPQ Financial Loss | Cost of Poor Quality | `BUS-RULE-077`, `KPI_REFERENCE.md` §3.6 | Rejected value logged to COPQ / Finance | None |
| First Time Yield | FTY Pulse | `BUS-RULE-076`, `raw/quality_control.md` §A | FTY percentage computed from pass without rework | None |
| Quarantine Alert | Alert > 24 Hours | `BUS-RULE-079`, `raw/quality_control.md` §C | Held > 24 hours alerts red | None |
| Vendor Watchlist | Supplier Quality | `BUS-RULE-080`, `raw/quality_control.md` §C | Acceptance rate < 90% enters watchlist | None |
| 4-Phase Workbench | Polymorphic Tablet UI | `raw/quality_control.md` §Rincian Halaman | Inbound, Mixing, Filling, Packing focus-mode | None |
| Recall Traceability | Bidirectional Trace | `_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` P14 | Full batch genealogy backward & forward | None |

## Verification composition

The frozen verification command `npm run verify:p14` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p14:quarantine-auth` (Quarantine invariant & RBAC rejection)
3. `npm --prefix backend run test:p14:inspections-parameters` (4-phase inspections & supervisor PIN)
4. `npm --prefix backend run test:p14:disposition-retest` (Partial disposition & retest workflow)
5. `npm --prefix backend run test:p14:release-idempotency` (Idempotent stock release & APJ sign-off)
6. `npm --prefix backend run test:p14:recall-traceability` (Forward and backward recall trace engine)
7. `npm --prefix backend run test:p14:golden-thread` (End-to-end QC and traceability golden thread on real DB)
8. `npm --prefix frontend run test:p14` (Frontend live quality UI behavior suite)
9. `npm run verify:p14:clean-db` (Residue check ensuring 0 `nex_p14_*` rows in PostgreSQL)
