# P11 Frozen Acceptance Contract

**Phase:** P11 — Warehouse and Inventory  
**Contract version:** `P11-v1`, frozen 2026-09-21  
**Final verification command:** `npm run verify:p11`  
**Success:** natural exit `0`; all focused backend, frontend, PostgreSQL golden-thread, affected build/type/lint and cleanup checks pass  

## Purpose and finish line

P11 is complete when one real, tenant-safe warehouse and inventory golden thread proves:

`Inbound receipt (Quarantine default & mandatory batch/expiry) → QC physical release to Available stock → FEFO/FIFO automated enforcement & no-negative-stock reservation → Inter-warehouse transfer (Source to Destination) → Stock Opname (variance calculation with Rp 500.000 auto-approval threshold vs Manager approval) → Stock Adjustment & automated loss journal entry → Reverse logistics (Return/Disposal) & Dead Stock Risk Analytics`

and the same transactions produce immutable stock movement ledgers, strict multi-warehouse authorization, and zero discrepancy under concurrent load.

## Frozen scope

In scope:
- Inbound goods receipt default state: `QUARANTINE` / `QUARANTINE_DRUM` with strict mandatory `batchNumber` and `expDate` validation (`BUS-RULE-046`, `BUS-RULE-053`);
- QC physical inspection gate and atomic release to `AVAILABLE` stock with idempotency guarantees (`BUS-RULE-047`);
- Immutable append-only stock movement ledger (`StockMovement` / `InventoryTransaction`) requiring explicit source documents (`BUS-RULE-048`);
- Stock Opname calculation and auto-approval threshold: loss value $\le$ Rp 500.000 auto-approves, loss value > Rp 500.000 mandates escalation and Manager PIN approval (`BUS-RULE-049`);
- Dead stock risk detection for items without movement > 180 days (`BUS-RULE-050`);
- Multi-warehouse RBAC and access boundaries ensuring users cannot perform operations on unauthorized warehouses (`BUS-RULE-051`);
- Automated FEFO (raw materials) and FIFO (packaging) pick enforcement with blocking error upon selecting newer batches (`BUS-RULE-052`, `BUS-RULE-031`);
- No-negative-stock invariant strictly enforced across concurrent transactions;
- Inter-warehouse transfer order lifecycle (`PENDING` $\rightarrow$ `COMPLETED`) updating source and destination stock balances atomically;
- Stock adjustment and loss auto-journal generation (Dr Inventory Loss Expense / Cr Inventory Asset) (`BUS-RULE-055`);
- Reverse logistics: return to supplier and disposal with audit trails;
- Frontend live data wiring on the warehouse dashboard and workstation surfaces (`/warehouse`, `/warehouse/inbound`, `/warehouse/stok`, `/warehouse/opname`, `/warehouse/adjustment`, `/warehouse/transfers`, `/warehouse/release`), eliminating mock arrays.

Out of scope:
- Production planning, scheduling, and CPKB batch record execution (P12/P13);
- Formal laboratory microbiological and chemical QC release tests (P14);
- Complete financial general ledger closing and balance sheet generation (P15);
- HR attendance, payroll, and warehouse staff shift rosters (P16).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P11-01` | **Inbound Quarantine & QC Release:** Inbound items are quarantined upon arrival (`isQuarantine: true`, `qcStatus: QUARANTINE`); batch and expiry dates are strictly required; QC release moves inventory to `AVAILABLE` (`GOOD`), updates stock cache, and rejects duplicate release attempts. |
| `AC-P11-02` | **FEFO/FIFO Enforcement & No-Negative-Stock:** Validation mandates earliest expiring batch for raw materials; scanning newer batches fails with `FEFO VIOLATION`; transactions prevent stock decrements exceeding available batch balance. |
| `AC-P11-03` | **Multi-Warehouse Access & Transfer:** Transfers between warehouses validate sufficient source stock, deduct source, and increment destination atomically; unauthorized warehouse access is rejected with `403 WAREHOUSE_ACCESS_DENIED`. |
| `AC-P11-04` | **Stock Opname Thresholds:** Variance with loss $\le$ Rp 500.000 is auto-approved and balances updated; variance with loss > Rp 500.000 enters `PENDING_APPROVAL` (`WAITING`) requiring Manager PIN escalation. |
| `AC-P11-05` | **Adjustment, Auto-Journal & Dead Stock:** Approved adjustments record ledger entries and trigger automated journal entries for inventory write-offs; dead stock intelligence detects idle items (>180 days). |
| `AC-P11-06` | **Frontend Live Surfaces & DNA:** Named warehouse surfaces fetch live data, handle loading/empty/error states using DNA design tokens, and operate with zero static array mocks. |
| `AC-P11-07` | **Thin Final Verification & Clean DB:** `npm run verify:p11` runs all focused backend, frontend, golden thread, and cleanup checks with exit `0`, leaving 0 residue rows in the database. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| Inbound Quarantine | Inbound Default Quarantine | `docs/legacy-erp/data/analytics/raw/warehouse.md` §3.A, `BUS-RULE-046` | Status `QUARANTINE` on receipt | None |
| QC Release to Stock | QC Release Gate | `BUS-RULE-047`, `docs/legacy-erp/data/analytics/raw/quality_control.md` | Moves to `AVAILABLE` atomically | None |
| Batch & Expiry Mandatory | Mandatory Batch / Exp | `BUS-RULE-053`, `docs/legacy-erp/data/analytics/raw/warehouse.md` §2.A | Inbound creation validation | None |
| FEFO Picking Rule | FEFO Enforcement | `BUS-RULE-052`, `BUS-RULE-031`, `warehouse.md` §3.B | Rejects non-earliest batch | None |
| Opname Threshold | Opname Auto-Approve Limit | `BUS-RULE-049`, `warehouse.md` §2 Kendali Mutu A | $\le$ 500k auto, > 500k audit | None |
| Multi-Warehouse Access | Warehouse RBAC Access | `BUS-RULE-051`, `07_RBAC_MATRIX.yaml` | User restricted to authorized warehouses | None |
| Loss Auto-Journal | Stock Opname Loss Journal | `BUS-RULE-055`, `warehouse.md` §4 | Auto Dr Expense / Cr Inventory | None |
| Dead Stock Flag | Dead Stock Detection | `BUS-RULE-050`, `warehouse.md` §3.C | > 180 days no movement | None |

## Verification composition

The frozen verification command `npm run verify:p11` executes:
1. `npm --prefix backend run test:p11:inbound-quarantine` (Inbound quarantine, mandatory batch/expiry, QC release gate)
2. `npm --prefix backend run test:p11:fefo-reservation` (FEFO enforcement, no-negative-stock concurrency)
3. `npm --prefix backend run test:p11:transfer-access` (Inter-warehouse transfer, multi-warehouse access control)
4. `npm --prefix backend run test:p11:opname-threshold` (Stock opname variance, 500k auto-approval, Manager PIN escalation)
5. `npm --prefix backend run test:p11:adjustment-deadstock` (Stock adjustment, loss auto-journal, dead stock analytics)
6. `npm --prefix backend run test:p11:golden-thread` (End-to-end full warehouse golden thread on real DB)
7. `npm --prefix frontend run test:p11` (Frontend warehouse live data behavior test)
8. `npm run verify:p11:clean-db` (Residue check ensuring 0 `nex_p11_*` rows in PostgreSQL)
