# Actionable Execution Ticket: Manufacturing Core — Production, R&D, Floor Execution, Samples, Quality & Legality

**Domain**: Manufacturing Core (`production`, `production-planning`, `floor-execution`, `rnd`, `qc`, `legality`)  
**Auditor**: Senior System Architect & Production Engineer  
**Date**: 2026-10-01  
**Status**: ACTIVE AUDIT — EXECUTION REQUIRED  

---

## Executive Summary

A comprehensive forensic audit of the NEX ERP Manufacturing Core was executed across all frontend routes (`/production/*`, `/rnd/*`, `/samples/*`, `/quality/*`), NestJS backend modules (`production`, `production-planning`, `floor-execution`, `rnd`, `qc`, `legality`), and Prisma schema definitions (`production.prisma`, `rnd.prisma`, `qc.prisma`, `bussdev.prisma`, `warehouse.prisma`).

The audit revealed severe architectural fractures:
1. **Critical Execution Deadlock**: A dual-table split between `ProductionLog` and `ProductionStepLog` breaks the shop-floor QC Interlock system. Floor execution records are created in `production_logs`, but stage validation gates and QC Audits query and constrain to `production_step_logs`. Subsequent manufacturing stages (MIXING -> FILLING -> PACKAGING) permanently fail interlock checks with HTTP 400, while QC audits fail with foreign key constraint errors (`P2003`).
2. **Double Finished Goods Inventory Crediting**: Actual production sync in `ProductionActualsService` updates `FinishedGood` inventory using `workOrderId`, while simultaneously emitting an unlinked, un-awaited event `production.schedule_completed`. The event handler in `WarehouseReleaseService` independently upserts `FinishedGood` using `planId`, double-counting manufactured inventory under conflicting foreign key regimes while raw material deductions run outside database transactions.
3. **Pervasive Mocked Client CRUD**: Production Work Orders, Floor Stage Execution (Mixing, Filling, Packaging), and Material Requisitions (SPB) exist exclusively as in-memory React `useState` mutations. Zero API endpoints are called; all floor operations evaporate on page refresh.
4. **Contract & Schema Fractures**: Formula creation and NPF state transitions fail against NestJS strict validation pipes (`forbidNonWhitelisted: true`) due to mismatched DTO fields and invalid state machine transitions. R&D Lab Test endpoints in the frontend 404 because nested backend controllers were not mirrored in API client calls.
5. **Zombie / Fossil Routes**: Over 2,600 lines of misplaced and duplicate code (`/samples/input`, `/samples/design`, `/samples/schedule`, `/samples/project-monitoring`) violate Route Map standards and dead-code zero tolerance.

---

## Severity Census

| Severity Category | Count | Primary Impact |
|:---|:---:|:---|
| **Critical Bug** | 4 | Floor execution deadlock, double FG inventory inflation, unguarded QC status corruption, broken NPF state machine |
| **Contract Mismatch** | 3 | DTO validation rejections (HTTP 400), 404 lab test endpoints, dead workbench navigation |
| **Broken UX State** | 3 | Ephemeral local state in production execution, broken revision bottleneck KPIs, crashing sample tracking search |
| **Missing Validation** | 1 | Unverified regulatory stage progression in BPOM/HKI |
| **Architectural / Dead Code** | 1 | 4 fossil routes (2,689 LoC) in `/samples/` violating Route Map |
| **TOTAL FINDINGS** | **12** | **Full Systemic Manufacturing Remediation Required** |

---

## Detailed Inventory of Findings

---

### 📌 Module: Floor Execution & QC Interlocks
#### [PROD-01]: Floor Execution Stage Gate Deadlock via `ProductionLog` vs `ProductionStepLog` Split
- **Target Files**:
  - Backend: `backend/src/modules/floor-execution/services/step-logs.service.ts`
  - Backend: `backend/src/modules/floor-execution/services/production-execution.service.ts`
  - Backend: `backend/src/modules/qc/services/qc-audits.service.ts`
  - Database: `backend/prisma/schema/production.prisma:188-218`, `backend/prisma/schema/qc.prisma:48-52`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `StepLogsService.logStep` enforces a stage gate (MIXING -> FILLING -> PACKAGING) by inspecting `this.prisma.productionStepLog.findFirst`:
  ```typescript
  // backend/src/modules/floor-execution/services/step-logs.service.ts:43-62
  const prevStepLog = await this.prisma.productionStepLog.findFirst({
    where: {
      wo: { workOrders: { some: { id: dto.workOrderId } } },
      stage: prevStep as any,
    },
    include: { qcAudits: { where: { status: QCStatus.GOOD }, take: 1 } },
  });
  if (!prevStepLog) {
    throw new BadRequestException(`QC Interlock: Previous stage (${prevStep}) hasn't been logged.`);
  }
  // Line 66: Writes to a completely different table!
  return this.prisma.productionLog.create({
    data: { workOrderId: dto.workOrderId, stage: dto.stage, ... }
  });
  ```
  `ProductionExecutionService.executeStep` repeats this bug: line 74 queries `productionStepLog` for QC validation, while line 38 writes to `productionLog`. Furthermore, `QCAudit` (`qc.prisma:49`) enforces an explicit relation `stepLog ProductionStepLog? @relation(fields: [stepLogId], references: [id])`. Because floor execution creates rows in `production_logs` (table `ProductionLog`), `stepLogId` never exists in `production_step_logs`. Downstream stages permanently fail with `QC Interlock: Previous stage hasn't been logged`, and creating a QC audit for a step log fails with Prisma foreign key violation `P2003`.
- **Exact Contract Specification**:
  - Request DTO (`POST /floor-execution/step-logs`):
    ```json
    {
      "workOrderId": "550e8400-e29b-41d4-a716-446655440000",
      "stage": "FILLING",
      "operatorId": "usr_01HXYZ...",
      "qtyProduced": 1000,
      "qtyRejected": 5,
      "notes": "Batch filling completed within tolerance"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "steplog_01HXYZ...",
        "workOrderId": "550e8400-e29b-41d4-a716-446655440000",
        "stage": "FILLING",
        "qtyProduced": 1000,
        "qtyRejected": 5,
        "status": "COMPLETED",
        "createdAt": "2026-10-01T10:00:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/floor-execution/services/step-logs.service.ts`:
     - Wrap execution in `this.prisma.$transaction(async (tx) => { ... })`.
     - Align write destination: create record in `tx.productionStepLog` (mapping `woId` from the associated `WorkOrder.planId`).
     - Query prior step log from `tx.productionStepLog` checking linked `QCAudit` status.
  2. `backend/src/modules/floor-execution/services/production-execution.service.ts`:
     - Unify write targets to `tx.productionStepLog` and ensure atomic updates to `WorkOrder.status`.
  3. `[Verification]`:
     - Run `npm --prefix backend run test:e2e` for floor-execution step log lifecycle. Post stage MIXING, audit with QC GOOD, advance to FILLING; verify HTTP 201 without interlock rejection.

---

### 📌 Module: Production Execution & Inventory Posting
#### [PROD-02]: Double Finished Goods Crediting & Non-Transactional Inventory Deduction Across Event Handlers
- **Target Files**:
  - Backend: `backend/src/modules/production/production-actuals.service.ts`
  - Backend: `backend/src/modules/warehouse/services/warehouse-release.service.ts`
  - Database: `backend/prisma/schema/production.prisma:220-234`, `backend/prisma/schema/warehouse.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `ProductionActualsService.syncActuals`:
  ```typescript
  // backend/src/modules/production/production-actuals.service.ts:246-268
  await this.prisma.finishedGood.upsert({
    where: { woId: schedule.workOrderId }, // schedule.workOrderId is a WorkOrder ID
    update: { stockQty: { increment: actualQty } },
    create: { woId: schedule.workOrderId, stockQty: actualQty, ... }
  });
  // Line 309: Emits event asynchronously outside any transaction boundary
  this.eventEmitter.emit('production.schedule_completed', {
    scheduleId: schedule.id,
    workOrderId: schedule.workOrderId,
    planId: schedule.workOrder.planId,
    qtyProduced: actualQty
  });
  ```
  `WarehouseReleaseService.handleScheduleCompleted` listens to `production.schedule_completed`:
  ```typescript
  // backend/src/modules/warehouse/services/warehouse-release.service.ts:80-125
  await this.prisma.$transaction(async (tx) => {
    // Deducts raw materials
    // ...
    // SECOND UPSERT OF FINISHED GOODS!
    await tx.finishedGood.upsert({
      where: { woId: event.planId }, // References ProductionPlan ID!
      update: { stockQty: { increment: event.qtyProduced } },
      create: { woId: event.planId, stockQty: event.qtyProduced, ... }
    });
  });
  ```
  Finished goods inventory is incremented twice for every production run, under two divergent foreign keys (`WorkOrder.id` vs `ProductionPlan.id`). If warehouse raw material deduction fails during the event handler, finished good inventory was already credited in `ProductionActualsService` without rollback.
- **Exact Contract Specification**:
  - Request DTO (`POST /production/actuals/sync`):
    ```json
    {
      "scheduleId": "sch_01HXYZ...",
      "actualQty": 5000,
      "rejectQty": 20,
      "downtimeMinutes": 15
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "scheduleId": "sch_01HXYZ...",
        "status": "COMPLETED",
        "finishedGoodStockIncremented": 5000,
        "materialDeductions": [
          { "materialId": "mat_01...", "deductedQty": 250.5 }
        ]
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/production/production-actuals.service.ts`:
     - Delete redundant direct `FinishedGood.upsert` from `syncActuals`.
     - Delegate all inventory posting (FG inbound + raw material issue) to an atomic database transaction orchestrated by `ProductionExecutionService` or `WarehouseReleaseService`.
  2. `backend/src/modules/warehouse/services/warehouse-release.service.ts`:
     - Standardize `FinishedGood.woId` to consistently reference `ProductionPlan.id`.
     - Ensure event handler is idempotent by recording a transaction reference key in `StockMovement`.
  3. `[Verification]`:
     - Call `POST /production/actuals/sync` with 5,000 units. Query `finished_goods` table: verify exactly one row incremented by 5,000 units.

---

### 📌 Module: QC Checklists & Quality Inspection
#### [QC-01]: Unguarded QC Checklist Status Mutations & Missing DELETE Endpoint
- **Target Files**:
  - Backend: `backend/src/modules/qc/controllers/qc-checklists.controller.ts`
  - Backend: `backend/src/modules/qc/services/qc-checklists.service.ts`
  - Database: `backend/prisma/schema/qc.prisma:10-24`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `QCChecklistsController.update` (lines 45-51) accepts raw untyped payload without DTO validation:
  ```typescript
  // backend/src/modules/qc/controllers/qc-checklists.controller.ts:45-51
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { status?: string; completedItems?: string[]; notes?: string },
  ) {
    return this.qcChecklistsService.update(id, dto);
  }
  ```
  `QCChecklistsService.update` spreads `dto` directly:
  ```typescript
  // backend/src/modules/qc/services/qc-checklists.service.ts:47-58
  const data: any = { ...dto };
  return this.prisma.qCChecklist.update({ where: { id }, data });
  ```
  In `qc.prisma:18`, `status String @default("PENDING")` is an unconstrained string column, not an enum. Any caller can bypass inspections by sending arbitrary strings (`{ status: "PASSED_UNCHECKED" }`). There is no transition validation, no role check verifying inspector qualification, and no `DELETE` endpoint to prune corrupted drafts.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /qc/checklists/:id`):
    ```json
    {
      "status": "COMPLETED",
      "completedItems": ["ITEM_01", "ITEM_02", "ITEM_03"],
      "notes": "All physical parameters meet specification"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "chk_01HXYZ...",
        "checklistNo": "QCK-2026-0012",
        "status": "COMPLETED",
        "completedItems": ["ITEM_01", "ITEM_02", "ITEM_03"],
        "verifiedBy": "usr_inspector_01",
        "updatedAt": "2026-10-01T10:15:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/qc/dto/update-qc-checklist.dto.ts`:
     - Create explicit DTO with `class-validator` decorators (`@IsEnum(QCChecklistStatus)`, `@IsArray()`, `@IsOptional()`).
  2. `backend/prisma/schema/qc.prisma`:
     - Introduce enum `QCChecklistStatus { DRAFT, IN_PROGRESS, COMPLETED, REJECTED }` and migrate column.
  3. `backend/src/modules/qc/services/qc-checklists.service.ts`:
     - Add finite state machine rules: `DRAFT -> IN_PROGRESS -> COMPLETED | REJECTED`.
     - Implement `delete(id: string)` with soft-delete or guard against deleting completed inspections.
  4. `backend/src/modules/qc/controllers/qc-checklists.controller.ts`:
     - Bind `UpdateQCChecklistDto` to `@Patch(':id')` and expose `@Delete(':id')`.
  5. `[Verification]`:
     - Send `PATCH /qc/checklists/:id` with `{ "status": "INVALID_STATE" }`; verify HTTP 400 rejection by ValidationPipe.

---

### 📌 Module: R&D Samples — NPF Workflow
#### [SAMPLES-01]: NPF Decision Action Calls Invalid Pipeline Stage Transition
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/npf/page.tsx:220-235`
  - Backend: `backend/src/modules/rnd/services/rnd-sample.service.ts:168-195`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `frontend/src/app/(dashboard)/samples/npf/page.tsx:225`:
  ```typescript
  const handleDecision = async (feedbackDecision: 'APPROVED' | 'REJECTED') => {
    // ...
    await api.patch(`/rnd/sample/${selectedNpf?.id}/advance`, {
      newStage: feedbackDecision,
      notes: feedbackNotes,
    });
  };
  ```
  Backend `RndSampleService.advanceStage` invokes state transition validation:
  ```typescript
  // backend/src/modules/rnd/services/rnd-sample.service.ts:175-185
  const validTransitions: Record<string, string[]> = {
    REQUEST_RECEIVED: ['FORMULATION'],
    FORMULATION: ['LAB_TESTING'],
    LAB_TESTING: ['CLIENT_REVIEW'],
    CLIENT_REVIEW: ['APPROVED', 'REJECTED'],
  };
  ```
  NPF samples are often displayed in the review table while still at stage `FORMULATION` or `LAB_TESTING`. Clicking "Setujui" or "Tolak" sends `{ newStage: "APPROVED" }`, which throws `BadRequestException: Invalid transition from FORMULATION to APPROVED`. The decision fails and leaves the user with an unhandled toast error.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /rnd/sample/:id/advance`):
    ```json
    {
      "newStage": "CLIENT_REVIEW",
      "feedbackDecision": "APPROVED",
      "notes": "Approved by client for stability test trial"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "smp_01HXYZ...",
        "stage": "APPROVED",
        "previousStage": "CLIENT_REVIEW",
        "updatedAt": "2026-10-01T10:30:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `frontend/src/app/(dashboard)/samples/npf/page.tsx`:
     - Update action modal: evaluate current `sample.stage`. If stage is before `CLIENT_REVIEW`, display a stage advancement prompt first (`Majukan ke Review Klien`).
     - Disable decision buttons (`Setujui`/`Tolak`) unless `stage === 'CLIENT_REVIEW'`.
  2. `backend/src/modules/rnd/services/rnd-sample.service.ts`:
     - Support administrative fast-forward transition if user possesses `RND_MANAGER` role, logging audit trail.
  3. `[Verification]`:
     - Progress sample from `REQUEST_RECEIVED` through `FORMULATION` -> `LAB_TESTING` -> `CLIENT_REVIEW`. Submit decision: verify transition to `APPROVED` succeeds with HTTP 200.

---

### 📌 Module: R&D Samples — Formulation Builder
#### [SAMPLES-02]: Formula Creation Payload Rejected by NestJS Strict `ValidationPipe`
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/formula/page.tsx:135-155`
  - Backend: `backend/src/modules/rnd/dto/formula.dto.ts:6-26`
  - Backend: `backend/src/modules/rnd/controllers/rnd.controller.ts:35-42`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `frontend/src/app/(dashboard)/samples/formula/page.tsx:137-142`:
  ```typescript
  const res = await api.post('/rnd/formulas', {
    productName: newFormula.productName,
    customerName: newFormula.customerName,
    totalWeightGr: newFormula.totalWeightGr,
    phases: [],
  });
  ```
  Backend `CreateFormulaDto` enforces:
  ```typescript
  // backend/src/modules/rnd/dto/formula.dto.ts
  export class CreateFormulaDto {
    @IsUUID()
    sampleRequestId: string;

    @IsString()
    formulaCode: string;

    @IsArray()
    @ValidateNested({ each: true })
    items: CreateFormulaItemDto[];
  }
  ```
  With NestJS global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, the request is rejected with HTTP 400: `property productName should not exist; property customerName should not exist; property totalWeightGr should not exist; property phases should not exist; property sampleRequestId must be a UUID`. Formula creation fails 100% of the time.
- **Exact Contract Specification**:
  - Request DTO (`POST /rnd/formulas`):
    ```json
    {
      "sampleRequestId": "a3b9c1d2-0000-4000-8000-000000000001",
      "formulaCode": "FOR-2026-0045",
      "targetWeightGr": 100.0,
      "items": [
        {
          "materialId": "mat_water_01",
          "phase": "A",
          "percentage": 75.5,
          "notes": "Solvent base"
        }
      ]
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "form_01HXYZ...",
        "formulaCode": "FOR-2026-0045",
        "sampleRequestId": "a3b9c1d2-0000-4000-8000-000000000001",
        "version": 1,
        "status": "DRAFT",
        "createdAt": "2026-10-01T10:45:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `frontend/src/app/(dashboard)/samples/formula/page.tsx`:
     - Update creation modal: bind formula to an existing `sampleRequestId` selector.
     - Transform form inputs into `CreateFormulaDto` structure (`sampleRequestId`, `formulaCode`, `items`).
  2. `backend/src/modules/rnd/dto/formula.dto.ts`:
     - Allow optional `targetWeightGr` and `notes` on formula creation.
  3. `[Verification]`:
     - Fill creation modal on `/samples/formula`, submit form; verify HTTP 201 response and redirect to workbench.

---

### 📌 Module: R&D Samples — Formula Workbench
#### [SAMPLES-03]: Formula Detail Edit Sends Unstripped UI State & Navigates to 404 Route
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/formula/[id]/page.tsx:174, 194`
  - Backend: `backend/src/modules/rnd/controllers/rnd.controller.ts:48-55`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  At `frontend/src/app/(dashboard)/samples/formula/[id]/page.tsx:174`:
  The workbench save handler submits raw local state (`{ ...formData }`) directly to `PATCH /rnd/formulas/:id`. Local state contains UI-only helper keys (`totalPercentage`, `activePhaseTab`, `rawIngredients`), triggering `forbidNonWhitelisted` validation errors on NestJS.
  Furthermore, upon successful cloning or saving (line 194):
  ```typescript
  router.push(`/rnd/formula/${res.data.id}`);
  ```
  The route `/rnd/formula/[id]` does NOT exist in Next.js App Router. The actual route registered in `ROUTE_MAP.md` is `/samples/formula/[id]`. The browser hits a Next.js 404 page, losing workbench context.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /rnd/formulas/:id`):
    ```json
    {
      "items": [
        {
          "materialId": "mat_niacinamide_01",
          "phase": "B",
          "percentage": 5.0,
          "instructions": "Dissolve under 60C"
        }
      ]
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "form_01HXYZ...",
        "formulaCode": "FOR-2026-0045-v2",
        "version": 2,
        "updatedAt": "2026-10-01T11:00:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `frontend/src/app/(dashboard)/samples/formula/[id]/page.tsx`:
     - Sanitize payload before dispatch: strip client-only properties, formatting only valid `UpdateFormulaDto` properties (`items`, `instructions`).
     - Fix router navigation at line 194 to: `router.push(`/samples/formula/${res.data.id}`)`.
  2. `[Verification]`:
     - Edit formula items on workbench, click "Simpan Formula"; verify HTTP 200 and successful in-place query cache refresh without 404 redirection.

---

### 📌 Module: R&D Samples — Revision Tracker
#### [SAMPLES-04]: Revision Bottleneck KPI & Branching History Truncated by `take: 1` Cap
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/revision-tracker/page.tsx:111-125, 345-355`
  - Backend: `backend/src/modules/rnd/services/rnd-sample.service.ts:1078, 1098-1115`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `RevisionTrackerPage` calculates the "Terkendala (>3 Revisi)" bottleneck KPI:
  ```typescript
  // frontend/src/app/(dashboard)/samples/revision-tracker/page.tsx:111-113
  const stuckRevisions = allRevisions.filter(
    (r) => (r.formulas?.length || 0) > 3 && r.revisionStatus === 'IN_PROGRESS',
  ).length;
  ```
  However, in `backend/src/modules/rnd/services/rnd-sample.service.ts:1078`:
  ```typescript
  return this.prisma.sampleRequest.findMany({
    where: { ... },
    include: {
      formulas: { take: 1, orderBy: { createdAt: 'desc' } }, // HARD LIMIT 1!
      lead: { select: { clientName: true, brandName: true } },
      pic: { select: { name: true } },
    },
  });
  ```
  Because the backend limits `formulas` relation to `take: 1`, `r.formulas.length` is NEVER greater than 1. `stuckRevisions` is permanently 0, and the drawer's "Daftar Iterasi Formula" only shows a single formula version, hiding all historical formula branches. Furthermore, `startRevision` and `completeRevision` (lines 1098-1112) mutate status without incrementing `SampleRequest.revisionCount`.
- **Exact Contract Specification**:
  - Expected Response DTO (`GET /rnd/revisions`):
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "smp_01HXYZ...",
          "sampleCode": "SMP-2026-0089",
          "productName": "Brightening Serum v3",
          "revisionStatus": "IN_PROGRESS",
          "revisionCount": 4,
          "formulas": [
            { "id": "f1", "formulaCode": "FOR-0089-v1", "version": 1 },
            { "id": "f2", "formulaCode": "FOR-0089-v2", "version": 2 },
            { "id": "f3", "formulaCode": "FOR-0089-v3", "version": 3 },
            { "id": "f4", "formulaCode": "FOR-0089-v4", "version": 4 }
          ]
        }
      ]
    }
    ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/rnd/services/rnd-sample.service.ts`:
     - Remove `take: 1` cap on `formulas` include in `getRevisionsScoped`.
     - In `startRevision`, atomically increment `revisionCount: { increment: 1 }`.
  2. `frontend/src/app/(dashboard)/samples/revision-tracker/page.tsx`:
     - Rely on `sample.revisionCount` or `sample.formulas.length` to evaluate bottleneck threshold.
  3. `[Verification]`:
     - Seed sample with 4 formula versions. Open `/samples/revision-tracker`; verify "Kritis >3x" badge and stat card reflect 1 sample, and drawer lists all 4 versions.

---

### 📌 Module: Production Operations & Floor Execution
#### [PROD-03]: Production Work Orders, Execution Stages, and SPB Requisitions Manipulate In-Memory Mock State
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/production/work-orders/page.tsx:215-230`
  - Frontend: `frontend/src/app/(dashboard)/production/mixing/page.tsx:145-185`
  - Frontend: `frontend/src/app/(dashboard)/production/filling/page.tsx:140-175`
  - Frontend: `frontend/src/app/(dashboard)/production/packaging/page.tsx:140-175`
  - Frontend: `frontend/src/app/(dashboard)/production/material-requisition/page.tsx:210-230`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `frontend/src/app/(dashboard)/production/work-orders/page.tsx:217`:
  ```typescript
  const handleCreateSPK = (formData: any) => {
    // Zero API call!
    setLocalWorkOrders([newSPK, ...localWorkOrders]);
    toast.success('SPK Berhasil Dibuat');
  };
  ```
  The exact pattern is replicated across stage execution pages:
  - `mixing/page.tsx`: "Mulai Proses Mixing" calls `setLocalData(...)`.
  - `filling/page.tsx`: "Konfirmasi Output Filling" calls `setLocalData(...)`.
  - `packaging/page.tsx`: "Selesaikan Packaging" calls `setLocalData(...)`.
  - `material-requisition/page.tsx`: "Buat Surat Permintaan Barang" calls `setRequisitions(...)`.
  Zero backend mutations are performed. All operator entries, output logs, downtime reports, and requisitions disappear instantly on browser reload.
- **Exact Contract Specification**:
  - Work Order Creation (`POST /production/work-orders`):
    ```json
    {
      "planId": "plan_01HXYZ...",
      "batchSize": 10000,
      "scheduledStartDate": "2026-10-05T08:00:00.000Z",
      "assignedLine": "LINE_01"
    }
    ```
  - Stage Execution Log (`POST /floor-execution/step-logs`):
    ```json
    {
      "workOrderId": "wo_01HXYZ...",
      "stage": "MIXING",
      "qtyProduced": 9950,
      "qtyRejected": 50
    }
    ```
- **Actionable Execution Plan**:
  1. `frontend/src/app/(dashboard)/production/work-orders/page.tsx`:
     - Refactor to Tri-Layer Colocation: replace `useState(MOCK_DATA)` with `useWorkOrders()` hook calling `api.get('/production/work-orders')` and `useCreateWorkOrder()` mutation calling `api.post('/production/work-orders')`.
  2. `frontend/src/app/(dashboard)/production/{mixing,filling,packaging}/page.tsx`:
     - Wire stage actions to `POST /floor-execution/step-logs`.
  3. `frontend/src/app/(dashboard)/production/material-requisition/page.tsx`:
     - Wire SPB creation to `POST /production/material-requisitions`.
  4. `[Verification]`:
     - Create SPK on `/production/work-orders`, reload page; verify newly created SPK persists in table.

---

### 📌 Module: Quality & Lab Testing
#### [QUALITY-01]: Lab Test Results Page Calls Non-Existent Top-Level Endpoints
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/quality/lab-test/page.tsx:110, 126`
  - Backend: `backend/src/modules/rnd/controllers/rnd.controller.ts:60-80`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `frontend/src/app/(dashboard)/quality/lab-test/page.tsx`:
  - Line 110: `api.get('/rnd/lab-test-results/${selectedId}')`
  - Line 126: `api.post('/rnd/lab-test-results', payload)`
  Backend `RndController` registers lab test endpoints nested under formulas:
  ```typescript
  // backend/src/modules/rnd/controllers/rnd.controller.ts:60-75
  @Get('formulas/:id/lab-tests')
  async getLabTests(@Param('id') formulaId: string) { ... }

  @Post('formulas/:id/lab-tests')
  async createLabTest(@Param('id') formulaId: string, @Body() dto: CreateLabTestDto) { ... }
  ```
  No `/rnd/lab-test-results` endpoint exists in NestJS. All fetch and submit actions on the quality lab-test page immediately return HTTP 404.
- **Exact Contract Specification**:
  - Option A: Target existing nested backend route:
    `POST /rnd/formulas/:formulaId/lab-tests`
  - Option B: Expose direct top-level lab-test controller in `qc` module:
    - Request DTO (`POST /qc/lab-tests`):
      ```json
      {
        "formulaId": "form_01HXYZ...",
        "testType": "MICROBIOLOGY",
        "parameters": [
          { "name": "pH", "standard": "5.5 - 6.5", "actual": "5.8", "passed": true }
        ],
        "notes": "Passed all microbial criteria"
      }
      ```
    - Expected Response DTO:
      ```json
      {
        "success": true,
        "data": {
          "id": "lt_01HXYZ...",
          "testNo": "LT-2026-0034",
          "status": "PASSED",
          "createdAt": "2026-10-01T11:15:00.000Z"
        }
      }
      ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/qc/controllers/qc-lab-tests.controller.ts`:
     - Expose top-level `/qc/lab-tests` controller with list, get-by-id, create, and update endpoints.
  2. `frontend/src/app/(dashboard)/quality/lab-test/page.tsx`:
     - Switch endpoint bindings from `/rnd/lab-test-results` to `/qc/lab-tests`.
  3. `[Verification]`:
     - Submit lab test result on `/quality/lab-test`; verify HTTP 201 response and table update.

---

### 📌 Module: R&D Samples — Sample Tracking Pipeline
#### [SAMPLES-05]: Sample Tracking Page Crashes with `TypeError` on Search Input
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/sample-tracking/page.tsx:120-135`
  - Database: `backend/prisma/schema/bussdev.prisma:10-35`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `frontend/src/app/(dashboard)/samples/sample-tracking/page.tsx:129`:
  ```typescript
  const filtered = samples.filter((s: any) =>
    s.code.toLowerCase().includes(q) ||
    s.customerName.toLowerCase().includes(q) ||
    s.productName.toLowerCase().includes(q)
  );
  ```
  The endpoint `GET /bussdev/samples` returns rows from `BussdevSample` (`bussdev.prisma`), where schema columns are named:
  - `sampleNo` (not `code`)
  - `leadId` (not `customerName`)
  - `quantity` (not `qty`)
  - `stage` (not `status`)
  Because `s.code` is `undefined`, typing any search query triggers `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`, crashing the Next.js React component tree with a white screen.
- **Exact Contract Specification**:
  - Response DTO (`GET /bussdev/samples`):
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "smp_01...",
          "sampleNo": "SMP-2026-0001",
          "lead": { "clientName": "PT Kosmetika Sejahtera" },
          "productName": "Sunscreen Gel SPF 50",
          "stage": "FEEDBACK_RECEIVED"
        }
      ]
    }
    ```
- **Actionable Execution Plan**:
  1. `frontend/src/app/(dashboard)/samples/sample-tracking/page.tsx`:
     - Introduce strict TypeScript interface `BussdevSampleResponse`.
     - Update property mappings with optional chaining and fallback:
       `s.sampleNo?.toLowerCase().includes(q) || s.lead?.clientName?.toLowerCase().includes(q) || s.productName?.toLowerCase().includes(q)`.
  2. `[Verification]`:
     - Open `/samples/sample-tracking`, type in search bar; verify smooth filtering with zero console errors or unhandled crashes.

---

### 📌 Module: Legality & Regulatory Compliance
#### [LEGALITY-01]: BPOM & HKI Stages Advance Without Prerequisite Document Verification
- **Target Files**:
  - Backend: `backend/src/modules/legality/services/legality-bpom.service.ts:45-65`
  - Backend: `backend/src/modules/legality/services/legality-hki.service.ts:40-60`
  - Backend: `backend/src/modules/legality/legality.controller.ts:54-70`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `LegalityController`:
  ```typescript
  @Patch('bpom/:id/advance')
  async advanceBpom(@Param('id') id: string) {
    return this.legalityService.advanceBpomStage(id);
  }
  ```
  `LegalityBpomService.advanceBpomStage` increments stage blindly without verifying whether required regulatory documents (dossier, formula submission, CPKB certificate, or NIE number) exist. A compliance officer can advance a BPOM record to "TERBIT" (Issued) without ever recording the registration number or certificate attachment.
- **Exact Contract Specification**:
  - Request DTO (`PATCH /legality/bpom/:id/advance`):
    ```json
    {
      "targetStage": "TERBIT",
      "registrationNo": "NA18260100456",
      "documentUrl": "https://storage.aureon.id/compliance/bpom_nie_00456.pdf",
      "expiryDate": "2031-10-01"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "bpom_01HXYZ...",
        "stage": "TERBIT",
        "registrationNo": "NA18260100456",
        "expiryDate": "2031-10-01T00:00:00.000Z",
        "updatedAt": "2026-10-01T11:30:00.000Z"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. `backend/src/modules/legality/dto/advance-legality.dto.ts`:
     - Create validation DTO enforcing `registrationNo` and `documentUrl` when target stage is `TERBIT`.
  2. `backend/src/modules/legality/services/legality-bpom.service.ts`:
     - Assert prerequisite fields before applying stage transition.
  3. `[Verification]`:
     - Call `PATCH /legality/bpom/:id/advance` to `TERBIT` without `registrationNo`; verify HTTP 400 rejection.

---

### 📌 Module: Architectural Integrity & Route Hygiene
#### [ARCH-01]: Misplaced Fossil Routes & Duplicate Screens in `/samples/` Subtree
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/samples/input/page.tsx` (813 lines — Digital Marketing ads)
  - Frontend: `frontend/src/app/(dashboard)/samples/design/page.tsx` (665 lines — Creative tasks)
  - Frontend: `frontend/src/app/(dashboard)/samples/schedule/page.tsx` (605 lines — Duplicate of `/production/schedule`)
  - Frontend: `frontend/src/app/(dashboard)/samples/project-monitoring/page.tsx` (606 lines — Duplicate of `/rnd/project-monitoring`)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  Violates Clean Code Parameter 4 (Zero Dead Code) and Parameter 2 (File Size Limits). Over 2,680 lines of fossil pages exist under `/samples/`:
  - `samples/input/page.tsx` is an ads analytics dashboard using Meta/TikTok Ads terms (`roas`, `cpm`, `adSpent`), completely unrelated to R&D samples.
  - `samples/design/page.tsx` is a duplicate of graphic design tasks.
  - `samples/schedule/page.tsx` and `samples/project-monitoring/page.tsx` are outdated copies of canonical production and R&D pages.
- **Exact Contract Specification**:
  - Canonical routes per `docs/ROUTE_MAP.md`:
    - Digital Ads: `/marketing/daily-ads`
    - Production Schedule: `/production/schedule`
    - Project Monitoring: `/rnd/project-monitoring`
- **Actionable Execution Plan**:
  1. Remove or redirect fossil pages:
     - Delete `frontend/src/app/(dashboard)/samples/{input,design,schedule,project-monitoring}`.
     - Add Next.js permanent redirects in `next.config.js` if inbound links exist.
  2. Update `docs/ROUTE_MAP.md` to reflect clean `/samples/` route registry.
  3. `[Verification]`:
     - Run `npm --prefix frontend run build`; verify clean bundle compilation with zero route collisions.

---

## Per-Module One-Line Verdict Table

| Module / Route | Status | One-Line Verdict |
|:---|:---:|:---|
| `/floor-execution/*` | **FAIL** | Stage interlock deadlocked by `ProductionLog` vs `ProductionStepLog` table split. |
| `/production/actuals` | **FAIL** | Double finished goods inventory crediting across non-transactional event handlers. |
| `/qc/checklists` | **FAIL** | Status transitions completely unvalidated with missing DELETE endpoint. |
| `/samples/npf` | **FAIL** | Decision approval action sends invalid pipeline transition triggering HTTP 400. |
| `/samples/formula` | **FAIL** | Formula creation DTO contract mismatch rejected by NestJS `ValidationPipe`. |
| `/samples/formula/[id]` | **FAIL** | Workbench sends unstripped UI state and navigates to non-existent 404 route. |
| `/samples/revision-tracker` | **FAIL** | Bottleneck KPI and formula history drawer broken by hardcoded `take: 1` query cap. |
| `/production/work-orders` | **FAIL** | "Buat SPK" and stage progression manipulate ephemeral local React state only. |
| `/production/{mixing,filling,packaging}` | **FAIL** | All floor execution stage actions manipulate local React state with zero API calls. |
| `/production/material-requisition` | **FAIL** | SPB material requisition generation operates purely in local state. |
| `/quality/lab-test` | **FAIL** | Calls non-existent top-level `/rnd/lab-test-results` endpoints resulting in 404. |
| `/samples/sample-tracking` | **FAIL** | Crashes on search input due to reading undefined property names on `BussdevSample`. |
| `/legality/*` | **WARN** | Regulatory stages advance to issued without verifying certificate documentation. |
| `/samples/{input,design,schedule}` | **FAIL** | 2,689 lines of dead/duplicate fossil routes violating Route Map standards. |

---

## Verification & Execution Gates

Every remediating commit must satisfy the standard 3-tier validation sequence:
```bash
# 1. Backend Typecheck
npm --prefix backend run typecheck

# 2. Frontend Typecheck
npm --prefix frontend run typecheck

# 3. Frontend Production Build
npm --prefix frontend run build
```
