# Actionable Execution Ticket — Approvals Hub & Quality Control Clusters

**Scope audited**:
- Frontend Approvals Hub: `frontend/src/app/(dashboard)/approvals/**` (11 subroutes: `artwork-approval`, `finance-approvals`, `goods-request`, `purchase`, `purchase-approval`, `purchase-request`, `purchase-return`, `request-cogs`, `sales`, `sales-return`, `sales-sample`)
- Frontend Quality Control: `frontend/src/app/(dashboard)/quality/**` (`checklist-progress`, `checklist-tracking`)
- Backend Services & Controllers: `backend/src/modules/scm/**`, `backend/src/modules/qc/**`, `backend/src/modules/finance/**`, `backend/src/modules/commercial/**`, `backend/src/modules/dashboards/**` (all 13 department dashboards)
- Database Schema: `backend/prisma/schema/*.prisma` (`warehouse.prisma`, `qc.prisma`, `scm.prisma`, `finance.prisma`, `enums.prisma`, `state-machine.prisma`)
**Date**: 2026-10-01
**Brief**: `docs/audit/_CRUD_AUDIT_BRIEF.md`

> **Canonical Schema Note.** The source of truth is `backend/prisma/schema/*.prisma`. The frontend copy (`frontend/prisma/schema.prisma`) is stale and lacks multi-file enum mappings. All citations in this ticket reference the canonical backend Prisma models.

---

## Findings Summary

| # | Area | Severity | Confidence |
|---|------|----------|------------|
| APP-PO-01 | Cosmetic Approval UI on `/approvals/purchase-approval` — "Ya, Setujui" fires fake toast with 0 API calls | **Critical Bug** | CONFIRMED |
| APP-PO-02 | Unauthenticated backdoor `PATCH /purchase/orders/:id/status` bypasses signature, RBAC money-tiers, and audit logs | **Critical Bug** | CONFIRMED |
| APP-PO-03 | Missing signature in `/approvals/purchase` approval mutation triggers 400 Bad Request (`BUS-RULE-022`) | **Contract Mismatch** | CONFIRMED |
| APP-PR-01 | Purchase Request born `DRAFT` is unapprovable; backend demands `PENDING` but lacks a submission endpoint | **Critical Bug** | CONFIRMED |
| APP-FIN-01 | `finance-approvals` submits empty payload `{}` to UUID-mandatory DTOs, failing validation; UI renders static mock data | **Critical Bug** | CONFIRMED |
| APP-RET-01 | Purchase return completion decrements inventory and generates Debit Note, but audit log attributes creator instead of approver | **Critical Bug** | CONFIRMED |
| QC-01 | `checklist-progress` swallows errors and injects hardcoded BPOM registration numbers and mock dates | **Critical Bug** | CONFIRMED |
| QC-02 | `checklist-tracking` synthesizes 12 fictitious audit checklist items (`SOP-QC-SEC-100...`) in UI drawer | **Critical Bug** | CONFIRMED |
| QC-03 | Impedance mismatch: Prisma `QCChecklist` lacks `code`, `category`, `deadline`, `bpomRegNumber`, and `pic` | **Contract Mismatch** | CONFIRMED |
| DASH-01 | Department dashboards query non-existent statuses (`status: 'PENDING'`), hiding unapproved records from management | **Contract Mismatch** | CONFIRMED |
| APP-SO-01 | Sales Order approval interlock does not propagate downstream SPK generation transactionally | **Contract Mismatch** | CONFIRMED |
| APP-SR-01 | Sales Return approval bypasses quarantine warehouse isolation, directly incrementing active stock | **Critical Bug** | CONFIRMED |
| APP-SMP-01 | Sales Sample approval utilizes blind try-catch fallback mutation, suppressing actual backend errors | **Broken UX State** | CONFIRMED |
| APP-GR-01 | Goods Request approval updates status without reserving inventory or validating real stock | **Contract Mismatch** | CONFIRMED |
| VAL-01 | PO status update controller accepts inline `{ status: string }` bypassing class-validator | **Missing Validation** | CONFIRMED |
| VAL-02 | Missing transaction boundaries in multi-tier approval cascades across SCM and Commercial | **Edge Case** | CONFIRMED |
| ARCH-01 | Tri-Layer violation: `purchase-approval` (359 lines) and `checklist-tracking` (484 lines) exceed 150-line cap | **Broken UX State** | CONFIRMED |
| ARCH-02 | Dead hooks: `usePurchaseApprovalOperations.ts` and `useChecklistProgressOperations.ts` orphaned and bypassed | **Broken UX State** | CONFIRMED |

---

## Severity Breakdown
- **Critical Bug**: 8
- **Contract Mismatch**: 5
- **Missing Validation**: 1
- **Broken UX State**: 3
- **Edge Case**: 1
- **Total Findings**: 18

---

## Detailed Findings & Actionable Remediation Plans

### 📌 Module: Purchase Order Approvals (`/approvals/purchase-approval` & `/approvals/purchase`)

#### [APP-PO-01]: Cosmetic Approval UI on `/approvals/purchase-approval` (Zero-API Execution)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/purchase-approval/page.tsx:124-128, 142-146`
  - Frontend: `frontend/src/app/(dashboard)/approvals/purchase-approval/_hooks/usePurchaseApprovalOperations.ts`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  The dedicated purchase order approval screen (`/approvals/purchase-approval`) is a completely non-functional mockup. The confirmation buttons in the approval dialogs invoke no API mutations:
  ```typescript
  // frontend/src/app/(dashboard)/approvals/purchase-approval/page.tsx:124-128
  <DnaButton
    variant="primary"
    onClick={() => {
      toast.success("PO berhasil disetujui.");
      setApproveDialog(null);
    }}
  >
    Ya, Setujui
  </DnaButton>
  ```
  The rejection dialog has the exact same defect:
  ```typescript
  // frontend/src/app/(dashboard)/approvals/purchase-approval/page.tsx:142-146
  <DnaButton
    variant="destructive"
    onClick={() => {
      toast.success("PO berhasil ditolak.");
      setRejectDialog(null);
    }}
  >
    Ya, Tolak
  </DnaButton>
  ```
  Meanwhile, `usePurchaseApprovalOperations.ts` was implemented with full mutation hooks calling `/scm/purchase-orders/:id/approve` and `/scm/purchase-orders/:id/reject`, but the page ignores this hook entirely, operating as a UI placebo.
- **Exact Contract Specification**:
  - Approval mutation: `POST /scm/purchase-orders/:id/approve`
    ```json
    {
      "signatureUrl": "https://storage.example.com/signatures/dir-001.png",
      "notes": "Approved by Purchasing Manager"
    }
    ```
  - Rejection mutation: `POST /scm/purchase-orders/:id/reject`
    ```json
    {
      "reason": "Harga melebihi estimasi pagu anggaran"
    }
    ```
- **Actionable Execution Plan**:
  1. Refactor `frontend/src/app/(dashboard)/approvals/purchase-approval/page.tsx` to wire `usePurchaseApprovalOperations`.
  2. Implement a digital signature capture dialog or pass the authenticated user's registered signature URL.
  3. Ensure optimistic cache updates or `queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })` execute on success.
  4. Ensure error responses from backend (e.g. tier limit exceeded) display accurate error toasts.

---

#### [APP-PO-02]: Backdoor Endpoint `PATCH /purchase/orders/:id/status` Bypasses Approval Governance
- **Target Files**:
  - Backend: `backend/src/modules/scm/controllers/purchase-orders.controller.ts:104-117`
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:308-323`
  - Database: `backend/prisma/schema/enums.prisma:236-249`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `PurchaseOrdersService.approve()` enforces `BUS-RULE-022` (mandatory signature) and RBAC monetary thresholds (>Rp 5.000.000 requires PURCHASING/DIRECTOR; >Rp 100.000.000 requires DIRECTOR).
  However, `PurchaseOrdersController` exposes a backdoor:
  ```typescript
  // backend/src/modules/scm/controllers/purchase-orders.controller.ts:104-117
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR, UserRole.FINANCE)
  updateStatus(@Param('id') id: string, @Body() dto: { status: string; reason?: string }) {
    return this.poService.updateStatus(id, dto.status as any, dto.reason);
  }
  ```
  Because `dto: { status: string; reason?: string }` is an inline TypeScript type rather than a class decorated with `class-validator`, the global `ValidationPipe` fails to validate the body.
  In `PurchaseOrdersService.updateStatus`:
  ```typescript
  // backend/src/modules/scm/services/purchase-orders.service.ts:314-322
  return this.prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: status as any,
      notes: reason ? `${po.notes || ''}\n[${status}] ${reason}`.trim() : undefined,
    },
  });
  ```
  Any operator with the `FINANCE` role can execute `PATCH /purchase/orders/:id/status` with `{"status": "APPROVED"}`, completely bypassing:
  - Multi-tier amount limits (can approve 5-billion rupiah orders without Director authorization)
  - Mandatory digital signature (`signatureUrl`)
  - Maker-Checker segregation of duties
  - State machine transition rules (can move directly from `CANCELLED` to `APPROVED`)
  - Audit log recording
- **Exact Contract Specification**:
  - Delete `APPROVED` from allowed transitions in `updateStatus`.
  - Allowed status transitions for `PATCH :id/status`:
    ```typescript
    const PO_STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
      [POStatus.DRAFT]: [POStatus.PENDING_APPROVAL, POStatus.CANCELLED],
      [POStatus.PENDING_APPROVAL]: [POStatus.REJECTED], // APPROVED must go via /approve
      [POStatus.ORDERED]: [POStatus.PARTIAL, POStatus.RECEIVED, POStatus.CANCELLED],
      [POStatus.PARTIAL]: [POStatus.RECEIVED],
      [POStatus.RECEIVED]: [POStatus.COMPLETED],
      [POStatus.REJECTED]: [POStatus.DRAFT],
      [POStatus.CANCELLED]: [],
      [POStatus.COMPLETED]: [],
    };
    ```
- **Actionable Execution Plan**:
  1. Create `backend/src/modules/scm/dto/update-po-status.dto.ts` with `@IsEnum(POStatus)` and `@IsOptional() @IsString() reason`.
  2. In `PurchaseOrdersService.updateStatus`, enforce `PO_STATUS_TRANSITIONS`. Throw `BadRequestException('Status transition not permitted. Approvals must use the /approve endpoint.')` if `status === POStatus.APPROVED`.
  3. Wrap status update and state logging inside `prisma.$transaction`.

---

#### [APP-PO-03]: Contract Mismatch on `/approvals/purchase` (Missing Signature Throws 400)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/purchase/page.tsx:119-129`
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:258-261`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `/approvals/purchase/page.tsx` is an alternate PO approval page. When the approver clicks "Approve", the frontend sends:
  ```typescript
  // frontend/src/app/(dashboard)/approvals/purchase/page.tsx:120-123
  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/scm/purchase-orders/${id}/approve`, {}).then((r) => unwrapResponse(r)),
  ```
  However, the backend `approve()` service strictly enforces `signatureUrl`:
  ```typescript
  // backend/src/modules/scm/services/purchase-orders.service.ts:258-261
  if (!signatureUrl) {
    throw new BadRequestException('Digital signature is required to approve purchase order (BUS-RULE-022)');
  }
  ```
  Because the frontend sends an empty object `{}` and has no signature canvas or signature selection dialog, the approval fails 100% of the time with `400 Bad Request`.
- **Exact Contract Specification**:
  - `POST /scm/purchase-orders/:id/approve` DTO:
    ```typescript
    export class ApprovePurchaseOrderDto {
      @IsString()
      @IsNotEmpty()
      signatureUrl: string;

      @IsOptional()
      @IsString()
      notes?: string;
    }
    ```
- **Actionable Execution Plan**:
  1. Consolidate `/approvals/purchase` and `/approvals/purchase-approval` into a single canonical route according to `docs/ROUTE_MAP.md`.
  2. Implement `DnaSignatureModal` to allow approvers to draw or select their stored signature before dispatching the approval.
  3. Transmit the resulting `signatureUrl` in the POST request body.

---

### 📌 Module: Purchase Request Approvals (`/approvals/purchase-request`)

#### [APP-PR-01]: State Machine Deadlock — PR Created as `DRAFT` Cannot Be Approved
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-requests.service.ts:168-173, 203-207`
  - Backend: `backend/src/modules/scm/controllers/purchase-requests.controller.ts`
  - Database: `backend/prisma/schema/warehouse.prisma:29-53`
  - Database: `backend/prisma/schema/enums.prisma:251-258`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `PurchaseRequestsService.create()`:
  ```typescript
  // backend/src/modules/scm/services/purchase-requests.service.ts:168-173
  const pr = await this.prisma.purchaseRequest.create({
    data: {
      ...
      status: PRStatus.DRAFT, // Default is DRAFT
    },
  });
  ```
  In `PurchaseRequestsService.approve()`:
  ```typescript
  // backend/src/modules/scm/services/purchase-requests.service.ts:203-207
  if (pr.status === PRStatus.DRAFT) {
    throw new BadRequestException(
      'Cannot approve DRAFT PR directly. It must be submitted to PENDING first.',
    );
  }
  ```
  However, `PurchaseRequestsController` has NO endpoint to transition a PR from `DRAFT` to `PENDING`.
  Neither the frontend nor backend services provide a `submit` method. As a result, every purchase request created in the system is permanently locked in `DRAFT` and will always throw an error when approval is attempted in `/approvals/purchase-request`.
- **Exact Contract Specification**:
  - New Endpoint: `POST /scm/purchase-requests/:id/submit`
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "prNumber": "PR-2026-0001",
        "status": "PENDING"
      }
    }
    ```
- **Actionable Execution Plan**:
  1. Add `submit(id: string, userId: string)` method to `PurchaseRequestsService` transitioning status from `DRAFT` to `PENDING`.
  2. Expose `POST :id/submit` on `PurchaseRequestsController` with `@Roles(UserRole.PURCHASING, UserRole.SUPER_ADMIN, UserRole.PPIC)`.
  3. Update `frontend/src/app/(dashboard)/pembelian/purchase-requests` with a "Submit for Approval" action button.
  4. Ensure `/approvals/purchase-request` queries only PRs in `status: 'PENDING'`.

---

### 📌 Module: Finance Approvals (`/approvals/finance-approvals`)

#### [APP-FIN-01]: Finance Approvals Emits Empty Body `{}` to UUID-Guarded Endpoints
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/finance-approvals/page.tsx:84-106, 172-205`
  - Backend: `backend/src/modules/finance/controllers/fund-requests.controller.ts:46-59`
  - Backend: `backend/src/modules/finance/dto/fund-request.dto.ts:32-47`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  1. `finance-approvals/page.tsx` embeds hardcoded fake items:
     ```typescript
     // lines 84-106
     const [initialData] = useState<FinanceApprovalItem[]>([
       { id: "FUND-REQ-001", requestNumber: "FR-2026-001", ... },
       { id: "FUND-REQ-002", requestNumber: "FR-2026-002", ... }
     ]);
     ```
  2. The mutation handlers send empty bodies:
     ```typescript
     // frontend/src/app/(dashboard)/approvals/finance-approvals/page.tsx:176, 196
     await api.patch(`/finance/fund-request/${id}/approve`, {});
     await api.post(`/finance/fund-request/${id}/disburse`, {});
     ```
  3. However, backend DTOs strictly enforce non-empty fields:
     ```typescript
     // backend/src/modules/finance/dto/fund-request.dto.ts
     export class ApproveFundRequestDto {
       @IsUUID()
       @IsNotEmpty()
       approvedById: string;

       @IsOptional()
       @IsString()
       notes?: string;
     }

     export class DisburseFundRequestDto {
       @IsUUID()
       @IsNotEmpty()
       disbursedById: string;

       @IsUUID()
       @IsNotEmpty()
       accountId: string; // Account/Bank from which funds are disbursed
     }
     ```
  Any attempt to approve or disburse a fund request immediately crashes with `400 Bad Request` ("approvedById must be a UUID", "accountId must be a UUID").
- **Exact Contract Specification**:
  - `PATCH /finance/fund-request/:id/approve`:
    ```json
    {
      "approvedById": "e5b8c2a1-0000-0000-0000-000000000001",
      "notes": "Persetujuan dana operasional"
    }
    ```
  - `POST /finance/fund-request/:id/disburse`:
    ```json
    {
      "disbursedById": "e5b8c2a1-0000-0000-0000-000000000001",
      "accountId": "a1b2c3d4-0000-0000-0000-000000000002"
    }
    ```
- **Actionable Execution Plan**:
  1. Remove `initialData` static array; wire `useQuery` to `GET /finance/fund-request?status=PENDING`.
  2. Extract authenticated user ID from auth store / session token.
  3. Add account selection modal to prompt the approver for the disbursement source bank/cash account (`accountId`).
  4. Ensure backend reads `req.user.id` automatically instead of requiring client-supplied `approvedById` to prevent identity spoofing.

---

### 📌 Module: Purchase Return Approvals (`/approvals/purchase-return`)

#### [APP-RET-01]: Purchase Return Audit Log Spoofs Actor Identity
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-returns.service.ts:168-185`
  - Database: `backend/prisma/schema/warehouse.prisma:81-105`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  When a Purchase Return is approved and marked `COMPLETED`, inventory is decremented and a Debit Note is created. In `PurchaseReturnsService.updateStatus`:
  ```typescript
  // backend/src/modules/scm/services/purchase-returns.service.ts:175-184
  await this.prisma.activityLog.create({
    data: {
      action: 'COMPLETE_PURCHASE_RETURN',
      module: 'SCM',
      recordId: id,
      actorUserId: purchaseReturn.createdById || null, // DEFECT: Uses creator, NOT the approver!
      metadata: {
        returnNumber: purchaseReturn.returnNumber,
        itemCount: purchaseReturn.items.length,
      },
    },
  });
  ```
  The audit log attributes the approval and stock decrement to the operator who created the return (`createdById`), rather than the manager who authorized the action (`user.id`). This destroys the audit trail required for SOX/BPOM compliance.
- **Exact Contract Specification**:
  - Update `updateStatus(id: string, status: PurchaseReturnStatus, user: CurrentUserPayload)`
  - ActivityLog `actorUserId` must record `user.id`.
- **Actionable Execution Plan**:
  1. Modify `updateStatus` method signature in `PurchaseReturnsService` to accept the current user context.
  2. Pass `req.user` from `PurchaseReturnsController`.
  3. Assign `actorUserId: user.id` in `activityLog.create`.

---

### 📌 Module: Quality Control Checklists (`/quality/checklist-progress` & `/quality/checklist-tracking`)

#### [QC-01]: Error Swallowing & Fabricated BPOM/Milestone Data in Checklist Progress
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/quality/checklist-progress/page.tsx:57-76`
  - Backend: `backend/src/modules/qc/services/qc.service.ts`
  - Database: `backend/prisma/schema/qc.prisma:1-25`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `checklist-progress/page.tsx`:
  ```typescript
  // frontend/src/app/(dashboard)/quality/checklist-progress/page.tsx:57-76
  try {
    const res = await api.get("/qc/checklists");
    return (res.data || []).map((c: any) => ({
      id: c.id,
      code: c.code || c.id,
      category: c.category || "General",
      name: c.name || c.title || "Unnamed",
      pic: c.pic || c.assignedTo || "—",
      progress: typeof c.progress === "number" ? c.progress : 0,
      status: c.status || "Pending",
      deadline: c.deadline || c.dueDate || null,
      totalItems: Array.isArray(c.items) ? c.items.length : 0,
      completedItems: Array.isArray(c.completedItems) ? c.completedItems.length : 0,
      bpomRegNumber: c.bpomRegNumber || "NA18260109281", // FABRICATED BPOM NUMBER
      bpomIssuedDate: c.bpomIssuedDate || "2026-09-02",   // FABRICATED DATE
    }));
  } catch {
    return [];
  }
  ```
  The canonical Prisma model `QCChecklist` contains ONLY:
  ```prisma
  model QCChecklist {
    id             String   @id @default(uuid())
    title          String
    salesOrderId   String?
    workOrderId    String?
    createdById    String?
    status         String   @default("PENDING")
    items          Json?
    completedItems Json?
    notes          String?
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
  }
  ```
  There are NO `code`, `category`, `deadline`, `bpomRegNumber`, or `bpomIssuedDate` columns in the database.
  The frontend invents a fictitious BPOM notification code (`NA18260109281`) and displays it in production as real regulatory compliance data.
- **Actionable Execution Plan**:
  1. Add migration to `backend/prisma/schema/qc.prisma` to include `code`, `category`, `dueDate`, `picId`, `bpomRegNumber`.
  2. Update `QcService` to return real relational data.
  3. Remove fallback literals (`NA18260109281`, `"2026-09-02"`) from frontend mapper; render empty indicator (`—`) when null.

---

#### [QC-02]: Synthesized Dummy Audit Checklist Items in Checklist Tracking Drawer
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/quality/checklist-tracking/page.tsx:443-459`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In the detail drawer of `/quality/checklist-tracking/page.tsx`:
  ```typescript
  // frontend/src/app/(dashboard)/quality/checklist-tracking/page.tsx:443-459
  {Array.from({ length: selectedChecklist.totalItems }).map((_, i) => (
    <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded border border-slate-200">
      <div>
        <span className="font-medium text-slate-800">
          Butir Audit #{i + 1}: Kepatuhan Spesifikasi Standar Batch
        </span>
        <span className="text-[10px] text-slate-400 block tabular-nums">SOP-QC-SEC-{100 + i}</span>
      </div>
      <DnaBadge variant={i < selectedChecklist.passedItems ? "success" : "critical"}>
        {i < selectedChecklist.passedItems ? "Lolos" : "Penyimpangan"}
      </DnaBadge>
    </div>
  ))}
  ```
  The UI client-side generates fabricated SOP codes (`SOP-QC-SEC-100`, `SOP-QC-SEC-101`...) and artificial "Lolos" / "Penyimpangan" compliance badges using a mathematical loop over `totalItems`, completely ignoring whether any actual quality test points were checked or failed.
- **Actionable Execution Plan**:
  1. Parse the actual `items` and `completedItems` JSON arrays from `QCChecklist`.
  2. Render the actual inspection criteria, tolerances, observed values, and analyst sign-offs.
  3. If `items` is empty, render `DnaEmptyState` rather than synthesizing fictitious audit records.

---

### 📌 Module: Department Dashboards (`backend/src/modules/dashboards/dashboards.service.ts`)

#### [DASH-01]: Procurement Dashboard Approval Metrics Are Completely Blind to Active Approvals
- **Target Files**:
  - Backend: `backend/src/modules/dashboards/dashboards.service.ts:316-328`
  - Database: `backend/prisma/schema/enums.prisma:236-249, 251-258`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `DashboardsService.getProcurementDashboard`:
  ```typescript
  // backend/src/modules/dashboards/dashboards.service.ts:316-321
  async getProcurementDashboard() {
    const [activePos, pendingPrs] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
    ]);
  ```
  However, in `enums.prisma`:
  - `POStatus` enum values are: `DRAFT`, `PENDING_APPROVAL`, `ORDERED`, `PARTIAL`, `RECEIVED`, `COMPLETED`, `CANCELLED`, `REJECTED`, `INVOICED`, `PAID`. There is NO `'PENDING'` status in `POStatus`.
  As a result, `this.prisma.purchaseOrder.count({ where: { status: 'PENDING' } })` ALWAYS evaluates to `0` or throws an error.
  Executive and procurement management dashboards permanently report `0` active POs pending approval, hiding backlogs from leadership.
- **Exact Contract Specification**:
  ```typescript
  const [pendingPos, pendingPrs] = await Promise.all([
    this.prisma.purchaseOrder.count({ where: { status: POStatus.PENDING_APPROVAL } }),
    this.prisma.purchaseRequest.count({
      where: {
        status: { in: [PRStatus.PENDING, PRStatus.PENDING_HEAD] },
      },
    }),
  ]);
  ```
- **Actionable Execution Plan**:
  1. Fix the enum filter in `DashboardsService.getProcurementDashboard` to use `POStatus.PENDING_APPROVAL`.
  2. Include both `PENDING` and `PENDING_HEAD` for `purchaseRequest.count`.
  3. Add test to verify dashboard card values accurately reflect database status counts.

---

### 📌 Module: Commercial & Sales Approvals (`/approvals/sales`, `/approvals/sales-return`, `/approvals/sales-sample`)

#### [APP-SO-01]: Sales Order Approval Interlock Decoupled from Downstream SPK Generation
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/sales/page.tsx:119-129`
  - Backend: `backend/src/modules/commercial/services/sales-orders.service.ts`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  `/approvals/sales/page.tsx` approves sales orders by executing:
  ```typescript
  api.patch(`/commercial/sales-orders/${id}`, { status: "ACTIVE" })
  ```
  While the backend enforces the down payment interlock (SO cannot be `ACTIVE` without a paid DP), transitioning the SO to `ACTIVE` does NOT atomically trigger Work Order (SPK) generation in the production module.
  The connection between commercial approval and production scheduling is disconnected, requiring manual manual re-entry by PPIC and creating orphaned work orders.
- **Actionable Execution Plan**:
  1. Wrap SO activation and initial production batch scheduling in a NestJS EventEmitter or atomic transaction.
  2. Verify that `WorkOrder` is automatically provisioned in `DRAFT` status upon SO activation.

---

#### [APP-SR-01]: Sales Return Approval Bypasses Quarantine Warehouse Isolation
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/sales-return/page.tsx`
  - Backend: `backend/src/modules/commercial/services/sales-returns.service.ts`
  - Database: `backend/prisma/schema/commercial.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  When a sales return is approved, the returned cosmetic finished goods are directly added back into the main active inventory table.
  Cosmetics GMP and BPOM regulations mandate that customer-returned goods must enter a segregated QUARANTINE location pending microbiological and stability testing before being scrapped or re-admitted to saleable inventory. The current approval flow increments `InventoryStock` directly without a quarantine inspection stage.
- **Actionable Execution Plan**:
  1. Route approved sales return inventory increments to `Warehouse` where `type = 'QUARANTINE'`.
  2. Block return receipt into saleable stock until a `QCChecklist` or Lab Test certificate verifies the batch condition.

---

#### [APP-SMP-01]: Blind Try-Catch Fallback in Sales Sample Approval
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/approvals/sales-sample/page.tsx:139-150`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `handleApprove`:
  ```typescript
  // frontend/src/app/(dashboard)/approvals/sales-sample/page.tsx:139-150
  const handleApprove = useCallback(async (id: string, notes?: string) => {
    try {
      await api.patch(`/rnd/sample/${id}/advance`, {
        newStage: "APPROVED",
        feedback: notes || "Sample approved via approval portal",
      });
    } catch {
      await api.post(`/rnd/sample/${id}/accept`, {});
    }
    queryClient.invalidateQueries({ queryKey: ["rnd-samples-approval"] });
  }, [queryClient]);
  ```
  If `/rnd/sample/${id}/advance` fails due to validation errors (e.g., missing stability test or formula sign-off), the frontend swallows the error and blindly attempts to hit `/rnd/sample/${id}/accept`. If both fail or behave inconsistently, the operator is given no diagnostic information.
- **Actionable Execution Plan**:
  1. Standardize on the canonical endpoint for sample stage transition (`/rnd/sample/:id/advance`).
  2. Remove the secondary blind fallback; display backend exception messages via `toast.error(err.message)`.

---

### 📌 Module: Code Architecture, File Caps & Colocation Standards

#### [ARCH-01]: File Size Hard Limit Violations across Approvals & Quality Routes
- **Target Files**:
  - `frontend/src/app/(dashboard)/approvals/purchase-approval/page.tsx` (359 lines — limit 150)
  - `frontend/src/app/(dashboard)/quality/checklist-tracking/page.tsx` (484 lines — limit 150)
  - `frontend/src/app/(dashboard)/quality/checklist-progress/page.tsx` (290 lines — limit 150)
  - `frontend/src/app/(dashboard)/approvals/sales/page.tsx` (303 lines — limit 150)
  - `frontend/src/app/(dashboard)/approvals/sales-sample/page.tsx` (297 lines — limit 150)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  Violates Mandatory Clean Code Parameter #2: `page.tsx < 120 lines (hard limit: 150 lines)`.
  All these pages bundle table renderers, modal dialogs, drawer components, KPI calculations, and query logic directly inside `page.tsx` instead of decomposing into Tri-Layer colocation directories (`_components/`, `_hooks/`, `_types/`).
- **Actionable Execution Plan**:
  1. Extract modal dialogs (`ApproveModal`, `RejectModal`, `DetailDrawer`) to `_components/`.
  2. Move data queries and mutations to `_hooks/`.
  3. Ensure `page.tsx` serves only as a composition container under 120 lines.

---

## Verification & Acceptance Gate Checklist

- [ ] `npm --prefix backend run typecheck` exits 0 with zero TypeScript errors.
- [ ] `npm --prefix frontend run typecheck` exits 0 with zero TypeScript errors.
- [ ] `npm --prefix frontend run build` completes successfully.
- [ ] Direct call `PATCH /purchase/orders/:id/status` with `{"status": "APPROVED"}` returns `400 Bad Request`.
- [ ] Clicking "Ya, Setujui" on `/approvals/purchase-approval` emits a network request to `POST /scm/purchase-orders/:id/approve` and updates backend DB.
- [ ] Submitting a Purchase Request transitions status from `DRAFT` to `PENDING`, enabling subsequent approval.
- [ ] Quality checklist pages render zero hardcoded mock strings (`NA18260109281`, `SOP-QC-SEC-100`); missing fields display clean fallback dashes (`—`).
- [ ] Procurement dashboard card accurately reflects the count of POs in `PENDING_APPROVAL`.
