# P13 Frozen Acceptance Contract

**Phase:** P13 — Production Execution (Floor Execution & BMR)  
**Contract version:** `P13-v1`, frozen 2026-09-21  
**Final verification command:** `npm run verify:p13`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typecheck and database cleanup checks pass  

## Purpose and finish line

P13 is complete when one real, tenant-safe production execution golden thread proves:

`Work Order & Production Schedule → BMR Creation & Linkage (BUS-RULE-028) → Sequential Stage Order (Mixing → Filling → Packaging, BUS-RULE-029) → Mixing Execution with FEFO Scan Match-Gate (BUS-RULE-031) & Weight Deviation Hard-Stop with Supervisor PIN Override (BUS-RULE-030) → Bulk Yield & Shrinkage Recording → Filling Execution with Bulk QC Interlock (BUS-RULE-032) & Mathematical Physical Limit (BUS-RULE-033) → Packaging Execution with Artwork Legal Interlock (BUS-RULE-034), Traceability Encoding (BUS-RULE-035) & Quarantined Finished Goods Handover (BUS-RULE-037) → Downtime Recovery & Material Return Reconciliation (BUS-RULE-054)`

and the transactions produce immutable batch genealogy, balanced physical and WIP movements, accurate costing inputs, zero static array mocks in the UI, and zero residue rows under concurrent load.

## Frozen scope

In scope:
- **Batch Record Lifecycle & Linkage (`BUS-RULE-028`, `WF-BMR`)**: BatchRecord must link to `scheduleId` / `workOrderId` and preserve `salesOrderId` bridge. Status transitions: `DRAFT` $\rightarrow$ `APPROVED` $\rightarrow$ `LOCKED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.
- **Sequential Stage Order (`BUS-RULE-029`)**: Sequential progression enforced (`MIXING` $\rightarrow$ `FILLING` $\rightarrow$ `PACKAGING`). Direct stage jumping is rejected.
- **Mixing Execution & FEFO Match-Gate (`BUS-RULE-031`, `BUS-RULE-030`)**:
  - Scanning chemical drum validates that material matches BOM and that no older unexpired batch remains with available stock;
  - Weight deviation $> 0.5\%$ from R&D target weight is blocked unless authorized with valid Supervisor PIN;
  - Machine parameters (temperature, RPM, duration) and bulk yield recorded, transferring output to WIP Bulk with status `WAITING_QC_BULK`.
- **Filling Execution & Physical Limit Gate (`BUS-RULE-032`, `BUS-RULE-033`)**:
  - Bulk WIP cannot be filled if QC status is not `APPROVED_BULK`;
  - Bottle output cannot exceed theoretical mathematical limit $((\text{bulkRemainingKg} \times 1000 / \text{targetVolumeGram}) \times 0.98)$;
  - Primary packaging deduction, packaging defect count, and bulk line loss recorded.
- **Packaging Execution, Artwork Interlock & Quarantined FG (`BUS-RULE-034`, `BUS-RULE-035`, `BUS-RULE-037`)**:
  - Secondary packaging execution blocked if Artwork status in Legal is `REVISION` or `EVALUATION`; must be `APPROVED`;
  - Traceability encoding generates immutable JSON composite data (material batches, packaging batch, operator, QC inspector, timestamps);
  - Mathematical cap enforced ($\text{goodOutput} + \text{rejectWip} \le \text{wipFilled}$);
  - Selesai Packaging moves output from WIP to Finished Goods with status `QUARANTINE` (`availableQty` is 0).
- **Floor Controls & Exceptions**:
  - Machine breakdown reporting pauses time tracking and creates maintenance ticket;
  - Idle time tracking alert ($> 24$ hours) (`BUS-RULE-036`);
  - Unused material return to warehouse (`BUS-RULE-054`, `MaterialReturn`).
- **Frontend Live Surfaces & DNA**: Named production surfaces (`/production/mixing`, `/production/filling`, `/production/packaging`, `/production/batch-records`, `/production/production-floor-dashboard`, `/production/operations`), eliminating all static mock arrays and using `@/components/dna`.

Out of scope:
- Finished Goods microbiological/chemical lab COA release to `AVAILABLE` stock (P14);
- General ledger period closing and balance sheet generation (P15);
- HR attendance, technician rosters, and payroll disbursement (P16).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P13-01` | **BatchRecord Lifecycle & Sequential Stages:** BMR links to schedule & SO, follows strict state machine (`DRAFT` $\rightarrow$ `COMPLETED`), and enforces sequential stage progression (`MIXING` $\rightarrow$ `FILLING` $\rightarrow$ `PACKAGING`). |
| `AC-P13-02` | **Mixing FEFO & Weight Deviation:** Drum scan rejects non-FEFO batches when older stock exists. Weight deviation $> 0.5\%$ is rejected without supervisor PIN and accepted with supervisor PIN. |
| `AC-P13-03` | **Filling QC Interlock & Physical Limits:** Filling rejects bulk WIP with status `WAITING_QC_BULK`. Output exceeding theoretical physical capacity is rejected with `OUTPUT_EXCEEDS_PHYSICAL_LIMIT`. |
| `AC-P13-04` | **Packaging Artwork Interlock & Quarantined FG:** Packaging is blocked when artwork is in `REVISION` / `EVALUATION`. Packaging creates Finished Goods with status `QUARANTINE` and `availableQty = 0`, embedding immutable traceability JSON. |
| `AC-P13-05` | **Downtime Recovery & Material Return:** Machine breakdown creates maintenance record and pauses line. Material returns reconcile leftover raw materials back to warehouse inventory. |
| `AC-P13-06` | **Frontend Live Surfaces & DNA:** 6 named production execution surfaces fetch live API data, handle error/loading/empty states with DNA design tokens, and operate with zero static array mocks. |
| `AC-P13-07` | **Thin Final Verification & Clean DB:** `npm run verify:p13` runs all focused backend, frontend, golden thread, typecheck, and cleanup checks with exit `0`, leaving 0 residue rows in PostgreSQL. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| BatchRecord Schedule Link | BMR Schedule Linkage | `contracts/04_BUSINESS_RULES.md` `BUS-RULE-028` | BMR requires scheduleId & salesOrderId | None |
| Stage Progression | Sequential Stage Order | `BUS-RULE-029`, `03_WORKFLOW_STATE_MACHINE.yaml` | Mixing $\rightarrow$ Filling $\rightarrow$ Packaging | None |
| Weight Deviation Gate | 0.5% Tolerance & PIN Override | `BUS-RULE-030`, `data/analytics/raw/production.md` | Dev $> 0.5\%$ requires supervisor PIN | None |
| FEFO Material Match | FEFO Material Gate | `BUS-RULE-031`, `data/analytics/raw/production.md` | Older expiring batch must be consumed first | None |
| QC Bulk Interlock | Bulk QC Gate | `BUS-RULE-032`, `data/analytics/raw/production.md` | WAITING_QC_BULK rejects filling | None |
| Physical Output Limit | Mathematical Cap | `BUS-RULE-033`, `data/analytics/raw/production.md` | Theoretical limit based on bulk mass | None |
| Artwork Interlock | Packaging Artwork Gate | `BUS-RULE-034`, `data/analytics/raw/production.md` | Artwork APPROVED required | None |
| Traceability Encoding | QR Code Genealogy Data | `BUS-RULE-035`, `data/analytics/raw/production.md` | Composite immutable JSON | None |
| Quarantined Finished Goods | FG Quarantine at Packaging | `BUS-RULE-037`, `data/analytics/raw/production.md` | Stock created in QUARANTINE, availableQty 0 | None |
| Downtime & Material Return | Line Control & Return | `raw/production.md` Protokol 3, `BUS-RULE-054` | Breakdown ticket & MaterialReturn | None |

## Verification composition

The frozen verification command `npm run verify:p13` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p13:batch-record` (BMR lifecycle & stage order)
3. `npm --prefix backend run test:p13:mixing-fefo-weight` (FEFO match-gate & weight tolerance)
4. `npm --prefix backend run test:p13:filling-qc-limit` (Bulk QC interlock & physical limits)
5. `npm --prefix backend run test:p13:packaging-artwork-traceability` (Artwork interlock & FG quarantine)
6. `npm --prefix backend run test:p13:downtime-return` (Breakdown recovery & material returns)
7. `npm --prefix backend run test:p13:golden-thread` (End-to-end production execution golden thread on real DB)
8. `npm --prefix frontend run test:p13` (Frontend live production execution behavior test)
9. `npm run verify:p13:clean-db` (Residue check ensuring 0 `nex_p13_*` rows in PostgreSQL)
