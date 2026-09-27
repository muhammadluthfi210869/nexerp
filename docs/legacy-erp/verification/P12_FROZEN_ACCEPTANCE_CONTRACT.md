# P12 Frozen Acceptance Contract

**Phase:** P12 — Production Planning and Dispatch (PPIC)  
**Contract version:** `P12-v1`, frozen 2026-09-21  
**Final verification command:** `npm run verify:p12`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typecheck and database cleanup checks pass  

## Purpose and finish line

P12 is complete when one real, tenant-safe production planning and dispatch golden thread proves:

`Approved Sales Order (DP Paid) → Automated MRP BOM explosion to Work Order → Material readiness check & Shortage detection → Feasible machine capacity & Schedule collision prevention → Multi-stage chronological schedule (Mixing → Filling → Packaging) → Rescheduling audit trail → Idempotent Floor Dispatch & Warehouse requisition handover`

and the transactions produce deterministic Work Orders, zero machine booking collisions, immutable reschedule audit trails, and zero residue rows under concurrent load.

## Frozen scope

In scope:
- Demand Ingestion & MRP-to-WO calculation: Binds approved Sales Order (`DP_PAID` / `READY_PROD`) and locked formulation (`PRODUCTION_LOCKED`), exploding into component requirements (`BUS-RULE-028`, `WF-SO`, `WF-BMR`);
- Material readiness index and shortage detection against warehouse stock, creating `MaterialRequisition` records with deficit alerting;
- Machine capacity gate: batch size cannot exceed machine `capacityPerBatch`;
- Schedule collision prevention: rejecting overlapping time slots on the same active machine with `409 Conflict` (`SCHEDULE_COLLISION`);
- Stage precedence enforcement: sequential chronological validation (`MIXING` before `FILLING`, `FILLING` before `PACKAGING`);
- Reschedule lifecycle and audit trail: updating time window with mandatory change reason and event logging (`production.schedule.rescheduled`);
- Idempotent Dispatch: dispatching Work Order to production floor, transitioning status to `DISPATCHED`, preparing warehouse requisitions, and returning idempotent response on duplicate calls;
- Frontend live data wiring on the 8 named PPIC surfaces (`/production/production-planning-dashboard`, `/production/work-orders`, `/production/schedule-mixing`, `/production/schedule-filling`, `/production/schedule-packaging`, `/production/schedule-calendar`, `/production/spk`, `/production/material-requisition`), eliminating all static mock arrays and using `@/components/dna`.

Out of scope:
- Production floor stopwatch, actual batch weight tare/loss scanning, and operator tablet run (P13);
- Finished Goods QC quarantine testing and microbiological/chemical lab COA release (P14);
- Complete financial general ledger closing and balance sheet generation (P15);
- HR attendance, payroll, and technician rosters (P16).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P12-01` | **MRP-to-WO Generation:** Approved Sales Order (`DP_PAID`) with locked formula generates a `WorkOrder` / `ProductionPlan` with formula BOM exploded into step details and requisitions. |
| `AC-P12-02` | **Material Readiness & Shortages:** System computes inventory availability against BOM lines; items with insufficient stock are flagged as `SHORTAGE` with exact deficit numbers. |
| `AC-P12-03` | **Capacity & Collision Interlock:** Schedule creation validates machine capacity (`targetQty <= capacityPerBatch`) and rejects overlapping time slots on the same machine with `409 SCHEDULE_COLLISION`. Sequential stage precedence is enforced. |
| `AC-P12-04` | **Rescheduling & Audit Trail:** Rescheduling updates schedule times, enforces a non-empty reason, and records an immutable audit log. |
| `AC-P12-05` | **Idempotent Dispatch:** Dispatches Work Order to floor (`DISPATCHED`), triggers warehouse requisition readiness, and safely handles repeated dispatch requests without duplicates. |
| `AC-P12-06` | **Frontend Live Surfaces & DNA:** Named planning surfaces fetch live data, handle loading/empty/error states using DNA design tokens, and operate with zero static array mocks (`INITIAL_SCHEDULES` purged). |
| `AC-P12-07` | **Thin Final Verification & Clean DB:** `npm run verify:p12` runs all focused backend, frontend, golden thread, typecheck, and cleanup checks with exit `0`, leaving 0 residue rows in the database. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| MRP to Work Order | Demand to WO Explosion | `contracts/00_MASTER_SPEC.md §9.1`, `BUS-RULE-028` | SO with DP $\rightarrow$ Work Order + Requisition | None |
| Material Shortage | Material Readiness Check | `data/analytics/raw/production.md` Card E & Tabel II | Requisition shortage detection | None |
| Capacity Check | Machine Capacity Limit | `data/analytics/raw/production.md`, `Machine.capacityPerBatch` | Batch size $\le$ machine capacity | None |
| Collision Prevention | Schedule Conflict Interlock | `_PRODUCTION_PHASE_GATES.yaml` (P12) | Overlap on machine $\rightarrow$ 409 Conflict | None |
| Stage Precedence | Sequential Stage Order | `BUS-RULE-029`, `production.md` | Mixing $\rightarrow$ Filling $\rightarrow$ Packaging | None |
| Reschedule Audit | Reschedule Audit Trail | `_PRODUCTION_PHASE_GATES.yaml` (P12) | Audit log with reason & timestamp | None |
| Idempotent Dispatch | Dispatch to Floor | `_PRODUCTION_PHASE_GATES.yaml` (P12) | WorkOrder $\rightarrow$ DISPATCHED idempotent | None |

## Verification composition

The frozen verification command `npm run verify:p12` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p12:mrp-wo` (Demand ingestion & MRP-to-WO generation)
3. `npm --prefix backend run test:p12:material-readiness` (Material readiness & shortage detection)
4. `npm --prefix backend run test:p12:schedule-collision` (Capacity check, collision prevention, stage precedence)
5. `npm --prefix backend run test:p12:reschedule-audit` (Reschedule lifecycle & audit trail)
6. `npm --prefix backend run test:p12:dispatch` (Idempotent work order floor dispatch)
7. `npm --prefix backend run test:p12:golden-thread` (End-to-end full planning & dispatch golden thread on real DB)
8. `npm --prefix frontend run test:p12` (Frontend production planning live data behavior test)
9. `npm run verify:p12:clean-db` (Residue check ensuring 0 `nex_p12_*` rows in PostgreSQL)
