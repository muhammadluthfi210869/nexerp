# R4 BUSINESS_READY — Defect Reclassification (§0)

**Date:** 2026-08-26
**Authoritative triage before any fix**

Reclassifies every previous P0/P1/P2/P3 finding into:

- **A. TEST/CUTOVER FIXTURE** — bounded R4-bootstrap static data needed
  because the shadow DB does not yet contain canonical master data.
  These are *not* product blockers; they are reproducible setup.
- **B. PRODUCT / WORKFLOW BLOCKER** — actual API/UI/state/authorization defects
  that prevent normal operation of an R4-bootstrap role. These must be
  fixed in code before BUSINESS_READY = PASS regardless of severity label.

The classification itself was derived from the canonical role enum
(`backend/prisma/schema/enums.prisma:11-32`), the canonical inbound
state machine (`enums.prisma:240-244`), the production role guard
(`production.controller.ts`), and the Batch3 SO item DTO
(`batch3-sales-order.dto.ts:25`).

---

## A. TEST/CUTOVER FIXTURE (idempotent reproducible bootstrap)

| # | Finding | Bucket | Fix source |
|---|---------|--------|------------|
| A1 | `BussdevStaff`/`RndStaff` missing for role users | A | `reconcile-staff.ts` (d090267) |
| A2 | `LegalStaff` missing for COMPLIANCE user; bounded `r4.legal@nexerp.id` not present | A | Extend `reconcile-staff.ts` |
| A3 | `r4.production_op@nexerp.id` not present (canonical operator role, §4) | A | Extend `reconcile-staff.ts` |
| A4 | R4 shadow DB shipped empty `warehouse`/`supplier`/`material`/`logistics-officer-user` master | A | New `seed-r4-master.ts` (canonical `create()` service calls) |
| A5 | `ProductionPlan` not auto-created on WO creation (linked upstream) | A | Not a fixture — see B5 |
| A6 | Previous ad-hoc SQL was used to bypass gates (packaging design, QC, production complete) | A | Forbidden by directive §1; do not repeat |

All A-class items live in ONE tracked, idempotent bootstrap script
(`scripts/r4-bootstrap.ts`) and protected by an idempotency regression test.

---

## B. PRODUCT / WORKFLOW BLOCKER (must be fixed in code)

| # | Finding | File | Severity |
|---|---------|------|----------|
| B1 | `qc-validate` controller uses inline `dto: {items: ...}` type — `@Body()` bypasses global ValidationPipe so the `items` array shape is not validated and 500s with "dto.items is not iterable" | `backend/src/modules/scm/controllers/inbounds.controller.ts:40-47` | Core P1 |
| B2 | `Batch3CreateSOItemDto.netto` is `@IsOptional()` and defaults to 0 on persist → blocks goods-requirement derivation with `REQUIREMENT_OUTPUT_BASIS_INVALID` | `backend/src/modules/commercial/dto/batch3-sales-order.dto.ts:24` + `sales-orders-batch3.service.ts:219` | Core P1 |
| B3 | `createWorkOrder` does NOT create a `ProductionPlan` and does NOT set `workOrder.planId` → downstream `production.service.ts:267` (`wo.plan`) and `updateStatus DONE` lookups fail with "Production plan not found" | `backend/src/modules/production/production.service.ts:962-1014` | Core P1 |
| B4 | No canonical endpoint to record the SO down-payment and advance `PENDING_DP → LOCKED_ACTIVE`. State machine (`state-transition.service.ts:72`) defines the transition but no controller wires it | `backend/src/modules/finance/controllers/cash.controller.ts` (missing) + `state-transition.service.ts:143` (handler present, unused) | Core P1 |
| B5 | Production complete (`/production/:workOrderId/complete`) hard-blocks on "Packaging Design has not been approved". The creative flow CAN reach `kanbanState=LOCKED` via `creative.service.ts:324`, but the trigger is on lead creation, not on SO commit | `backend/src/modules/bussdev/bussdev.service.ts:1804-1805` | P2 (reachable via canonical flow once lead is created with sample having design tasks) |
| B6 | `submit-log` and `qc-checkpoint` require `PRODUCTION_OP` and `QC_LAB` respectively (canonical). Previous Golden Flow used `r4.production` which lacks `PRODUCTION_OP`. **Keep the boundary.** Bootstrap `r4.production_op` as A3. | `production.controller.ts:99-100, 111-112` | Core P1 (resolved by A3 fixture) |
| B7 | InboundStatus enum `{PENDING, APPROVED, CANCELLED}` is correct; **do not enlarge**. `qcValidate` is canonical active endpoint (QC_LAB-only, stock-disposition on quarantined lots). | `enums.prisma:240-244` + `inbounds.service.ts:88-101` | None — confirm only |

---

## §3 verdict: qc-validate is canonical (CASE A)

`inbounds.service.ts:88-101` shows the canonical QC step is the
stock-disposition decision on quarantined lots created during
`updateStatus(APPROVED)`. The `InboundStatus` enum stays
`{PENDING, APPROVED, CANCELLED}` — no RECEIVED/QC_PENDING/STOCKED
enumeration is needed. The 500 is a controller-level payload
validation bug (B1), not a workflow gap.

---

## Fix plan (smallest, root-cause only)

1. **B1** — Replace inline `dto: {items:...}` with proper `QcValidateDto` class
   (`@IsArray @ValidateNested @Type(() => QcValidateItemDto)`). One file.
2. **B2** — Change `Batch3CreateSOItemDto.netto` from
   `@IsOptional @IsNumber` to `@IsNumber @IsPositive`. One DTO file.
3. **B3** — Make `createWorkOrder` create a `ProductionPlan` in the
   same transaction, then set `workOrder.planId = plan.id`. One service method.
4. **B4** — Add `POST /api/finance/sales-orders/:id/down-payment` that:
   creates DP invoice + payment + advances `PENDING_DP → LOCKED_ACTIVE`.
   New controller method + service method.
5. **B5** — For Day-1, ensure sample creation auto-creates a default
   `designTask` per the canonical creative listener flow so production
   gate is naturally satisfied once lead→sample chain executes.
   If the listener does not exist, classify B5 as **P2** and document.

All A-class items: ONE `scripts/r4-bootstrap.ts` that calls the
canonical Prisma client to upsert the bounded test users, staff
relations, and master records. Idempotent. Two runs = no duplicates.