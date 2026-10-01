# Actionable Execution Ticket — Purchasing / SCM Cluster

**Scope audited**: `frontend/src/app/(dashboard)/pembelian/**` (17 routes, 98 files, 19,316 lines) ·
`backend/src/modules/scm/**` (9 controllers, 10 DTOs, 20 services) · `backend/src/modules/lead-capture/**`
**Schema of record**: `backend/prisma/schema/*.prisma` (folder-based; `backend/prisma/schema/enums.prisma`,
`finance-extension.prisma`, `warehouse.prisma`)
**Date**: 2026-10-01
**Brief**: `docs/audit/_CRUD_AUDIT_BRIEF.md`

> **Schema-of-record note (read this first).** The repo contains **three** Prisma schemas:
> `frontend/prisma/schema.prisma` (2653 lines, **stale** — its `POStatus` has only 4 values and
> `PurchaseRequest.status` is a bare `String`), `docs/legacy-erp/contracts/schema.prisma` (legacy),
> and `backend/prisma/schema/` (folder-based, **canonical** — this is what `prisma generate` builds and
> what the running client uses). Every finding below cites the canonical one. Several findings
> (PR-01, FE-01) are *invisible* if you audit against the frontend copy — that schema is a trap.

---

## Findings summary

| # | Area | Severity | Confidence |
|---|------|----------|------------|
| PO-01 | Status patch is unguarded — any value, no transition map | **Critical Bug** | CONFIRMED |
| INV-01 | DP applied in the wrong table; PO-DP path writes an `Invoice` and is never deducted | **Critical Bug** | CONFIRMED |
| PAY-01 | Payment `totalAmount` is not reconciled against allocation sum | **Critical Bug** | CONFIRMED |
| PR-01 | Unknown `materialId` silently replaced with an arbitrary material | **Critical Bug** | CONFIRMED |
| RET-01 | Return `COMPLETED` double-decrements stock on re-entry | **Critical Bug** | CONFIRMED |
| PO-02 | PO created at `DRAFT`; receiving filters on `ORDERED`/`APPROVED` → dead pipeline | **Contract Mismatch** | CONFIRMED |
| FE-01 | PR status vocabulary (`PENDING_HEAD`/`ORDERED`) is not in `PRStatus` | **Contract Mismatch** | CONFIRMED |
| FE-02 | `PARTIALLY_RECEIVED` is not a `POStatus`; PO list shows 0 partial receipts forever | **Contract Mismatch** | CONFIRMED |
| INV-02 | `importExcel` drops `invoiceNumber` → duplicate check never runs on import | **Critical Bug** | CONFIRMED |
| INV-03 | Vendor-invoice duplicate check matches on free-text `notes` | **Critical Bug** | CONFIRMED |
| PR-02 | `warehouseId` falls back to `''` → NOT NULL/Uuid violation | **Critical Bug** | CONFIRMED |
| VAL-01 | `items?: any[]` in `CreatePurchaseOrderDto` — zero line-item validation | **Missing Validation** | CONFIRMED |
| VAL-02 | `UpdatePurchaseReturnStatusDto.status: any` — no enum | **Missing Validation** | CONFIRMED |
| VAL-03 | `POST /purchase/invoices/import` takes `@Body('rows') rows: any[]` | **Missing Validation** | CONFIRMED |
| FE-03 | 8 of 10 `_hooks` files are dead; pages carry a second copy of the logic | **Broken UX State** | CONFIRMED |
| FE-04 | 13 of 17 `page.tsx` exceed the 150-line hard cap (max 986) | **Broken UX State** | CONFIRMED |
| FE-05 | Five export buttons fire a fake success toast, no download | **Broken UX State** | CONFIRMED |
| FE-06 | DP create toast claims a journal entry; SCM writes zero journal rows | **Contract Mismatch** | CONFIRMED |
| RET-02 | `generateReturnNumber` is read-then-increment, racy | **Edge Case** | CONFIRMED |
| FE-07 | `vendor-performance` has no error/retry state | **Broken UX State** | CONFIRMED |
| PO-03 | `scmId` overwritten with the creator id | **Edge Case** | CONFIRMED |
| PO-04 | `approve()` has no idempotency/state guard — re-approves a `CANCELLED` PO | **Critical Bug** | CONFIRMED |
| PAY-02 | `reversePayment` marks reversed in `notes` only, `status` stays `PAID` | **Edge Case** | CONFIRMED |
| DEAD-01 | `recalcHpp` / `updateProductSupplierHistory` / `validateSourceSelection` never called | **Edge Case** | CONFIRMED |

---

### 📌 Module: Purchase Orders / `/pembelian/scm-pembelian`

#### [PO-01]: PO status is patchable to any enum value with no transition guard
- **Target Files**:
  - Backend: `backend/src/modules/scm/controllers/purchase-orders.controller.ts:104-117`
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:308-323`
  - Database: `backend/prisma/schema/enums.prisma:236-249`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `updateStatus` is a raw pass-through. The controller takes an **inline literal
  type**, not a DTO class:
  ```ts
  // purchase-orders.controller.ts:112-116
  updateStatus(@Param('id') id: string, @Body() dto: { status: string; reason?: string }) {
    return this.poService.updateStatus(id, dto.status as any, dto.reason);
  }
  ```
  The global `ValidationPipe` (`backend/src/main.ts:52-59`) runs `whitelist` + `forbidNonWhitelisted`,
  but an inline TS type carries **no class-validator metadata**, so nothing is validated and nothing is
  stripped — the raw string reaches the service, which writes it unchallenged:
  ```ts
  // purchase-orders.service.ts:314-322
  return this.prisma.purchaseOrder.update({
    where: { id },
    data: { status: status as any, notes: reason ? `${po.notes || ''}\n[${status}] ${reason}` : undefined },
  });
  ```
  There is **no** state machine. `POStatus` has 10 legal values
  (`backend/prisma/schema/enums.prisma:236-249`) and **no** transition map exists anywhere in the module —
  `status-validation.util.ts:19-43` is a milestone helper for a different domain and is **not imported**
  by any SCM file (verified: zero references outside its own definition).

  The consequence is not a typo risk, it is a **business-rule bypass**. `approve()`
  (`purchase-orders.service.ts:255-306`) is the only place the RBAC money-tiers live:
  `> Rp 100.000.000` requires DIRECTOR/SUPER_ADMIN, `> Rp 5.000.000` requires PURCHASING
  (lines 267-275). `PATCH :id/status` is reachable by `FINANCE`
  (`purchase-orders.controller.ts:105-110`) and calls `updateStatus` directly. **A FINANCE user can
  `PATCH {"status":"APPROVED"}` on a Rp 2-billion PO and bypass the entire multi-tier approval matrix**,
  including the mandatory signature stamp at line 259.

- **Exact Contract Specification**:
  - Request DTO (current, unvalidated):
    ```json
    { "status": "APPROVED", "reason": "optional" }
    ```
  - Expected: reject any transition not in the map, and reject `APPROVED` on this route entirely.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/dto/update-po-status.dto.ts` — **new**. Class with
    `@IsEnum(POStatus)` on `status`, `@IsOptional() @IsString()` on `reason`. Returning a class
    (not an inline type) is what re-enables the global `ValidationPipe`.
  - `backend/src/modules/scm/services/purchase-orders.service.ts` — add a module-level
    `PO_TRANSITIONS: Record<POStatus, POStatus[]>` and assert `next ∈ PO_TRANSITIONS[current]`
    inside `updateStatus`; throw `BadRequestException` otherwise. The map must **exclude `APPROVED`**
    so the PATCH cannot reach the approve state; approval stays on `POST :id/approve` only, where the
    RBAC tiers and signature live.
  - `backend/src/modules/scm/controllers/purchase-orders.controller.ts:112-116` — swap the inline type
    for the new DTO and drop `dto.status as any`.
  - `[Verification]` `PATCH {"status":"APPROVED"}` as FINANCE → `400` with the allowed-targets list.
    `PATCH {"status":"RECEIVED"}` on a `DRAFT` PO → `400`. A legal `DRAFT → PENDING_APPROVAL` → `200`.

#### [PO-02]: PO is born `DRAFT` but the receiving pipeline only admits `ORDERED`/`PARTIAL`/`APPROVED`
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:163`
  - Frontend: `frontend/src/app/(dashboard)/pembelian/receiving/page.tsx:81`
  - Database: `backend/prisma/schema/enums.prisma:236-249`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The schema default is `ORDERED` (`PurchaseOrder.status @default(ORDERED)`), but
  `create()` hardcodes the opposite:
  ```ts
  // purchase-orders.service.ts:163
  status: 'DRAFT' as any,
  ```
  The receiving page then filters the PO list to what it considers receivable:
  ```ts
  // receiving/page.tsx:81
  .filter((po: any) => po.status === "ORDERED" || po.status === "PARTIAL" || po.status === "APPROVED")
  ```
  A freshly created PO is `DRAFT` and appears in **neither** the receiving worklist **nor** the scm-pembelian
  PO list filter set, until someone approves it through a route the UI does not expose. Net effect: goods
  physically arrive against a PO the warehouse screen cannot see.
- **Expected Response DTO**: the PO list must make the actionable state unambiguous, not require the
  reader to know that `ORDERED` is the schema default and `DRAFT` is the code default.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-orders.service.ts:163` — pick one. Either set
    `PENDING_APPROVAL` (the honest state for an un-approved PO, and a value `receiving` already treats
    as not-yet-receivable) or drop the override and let the schema default `ORDERED` apply. Do **not**
    leave the two disagreeing.
  - `frontend/src/app/(dashboard)/pembelian/receiving/page.tsx:81` — derive the receivable predicate
    from a named constant that includes the post-approval states, and show DRAFT/`PENDING_APPROVAL`
    POs in a separate "menunggu persetujuan" bucket rather than filtering them into invisibility.
  - `[Verification]` Create a PO, land on `/pembelian/receiving` — it is visible with an explicit
    "not yet approved" state, and becomes selectable for GR the moment it is approved.

#### [PO-04]: `approve()` has no state guard — a `CANCELLED` or `RECEIVED` PO can be re-approved
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:255-306`
  - Frontend: `frontend/src/app/(dashboard)/pembelian/scm-pembelian/create/page.tsx:218-220`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `approve()` reads the PO, checks the money tier, and writes `APPROVED` — but never
  inspects `po.status` before doing so (lines 256-282). Compare `purchase-requests.service.ts:157-165`,
  which *does* guard (`DRAFT` and `REJECTED` throw; `APPROVED`/`CONVERTED` return idempotently). The PO
  service has no equivalent. A PO that already has `inbounds` (goods received) or is `CANCELLED` can be
  re-approved, and the auto-signature at line 259 stamps a fresh `DIGITAL_SIG_...` on it each time, so the
  audit trail records a *new* approval for an old, already-executed PO.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-orders.service.ts:256` — after `findOne`, reject
    `status ∈ {CANCELLED, RECEIVED, CLOSED, RETURNED}` and make `APPROVED` idempotent (return the PO
    unchanged, as the PR service does at lines 163-165).
  - `[Verification]` `POST :id/approve` on a `CANCELLED` PO → `400`; on an `APPROVED` PO → `200` with no
    second audit row.

#### [PO-03]: `scmId` is overwritten with the caller's user id
- **Target Files**: `backend/src/modules/scm/services/purchase-orders.service.ts:162`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `scmId: userId` is set unconditionally, but the column is nullable and semantically
  "the assigned SCM processor". Every PO therefore looks assigned, to whoever happened to create it, and
  `findAll` includes `scm: { select: { id, fullName } }` (line 230) so the UI renders an assignee that
  carries no workload meaning. (`scm-dashboard.service.ts:170` also filters on `POStatus.RETURNED`.)
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-orders.service.ts:162` — accept an explicit
    `scmId` from the DTO when supplied; leave `null` otherwise, and add a separate
    `createdById` so authorship and assignment stay distinguishable.
  - `[Verification]` A PO created without an assignee has `scmId === null` and the list shows
    "Belum ditugaskan" rather than the creator's name.

---

### 📌 Module: Purchase Invoices / `/pembelian/faktur-pembelian`

#### [INV-01]: Two disconnected down-payment systems; the PO-created DP is never deducted
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:325-344`
  - Backend: `backend/src/modules/scm/services/purchase-invoices.service.ts:208-237`
  - Backend: `backend/src/modules/scm/services/purchase-payments.service.ts:262-300`
  - Database: `backend/prisma/schema/finance-extension.prisma` (`DownPayment`), `enums.prisma:414-419`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: There are **two** ways to record a vendor advance and they write to **different
  tables**:
  1. `POST /purchase/orders/:id/down-payment` → `createDownPayment()`
     (`purchase-orders.service.ts:325-344`) creates an **`Invoice`** row with
     `invoiceNumber: 'DP-PUR-'+po.poNumber`, `type: 'DP'`, `category: 'PAYABLE'`.
  2. `POST /purchase/down-payments` → `createDownPayment()`
     (`purchase-payments.service.ts:262-300`) creates a **`DownPayment`** row with a `DPB-*` number.

  The invoice's DP deduction logic reads **only** the `DownPayment` table
  (`purchase-invoices.service.ts:210-218`: `tx.downPayment.findUnique` / `findFirst`). Nothing ever reads
  the `Invoice`-based DP. So a DP created through the PO endpoint is **invisible to the deduction path** —
  the vendor is invoiced, the money is gone, and the AP balance never nets off. The route is also a
  duplicate-number bomb: `Invoice.invoiceNumber` is `@unique` and the number is derived purely from the PO
  number, so the second call for the same PO throws P2002 — a 500, not a 409.

  Two further defects in the `DownPayment` branch itself:
  - **No PO link.** `CreateDownPaymentDto` (`dto/purchase-payment.dto.ts:86-105`) has no `poId`, and
    `DownPayment` has no `poId` column. The DP is a free-floating vendor credit.
  - **Silent auto-deduction.** When no `dpId` is supplied, the service auto-picks
    `findFirst({ where: { vendorId, status: PAID, remainingAmount: { gt: 0 } }, orderBy: { date: 'asc' } })`
    (lines 211-218) and applies it. Because no PO link exists, the **oldest** DP balance for that vendor is
    consumed against **whichever invoice happens to be created next**. A DP earmarked for PO-A silently
    offsets a bill for PO-B.
  - **Status never reflects consumption.** `createDownPayment` hardcodes `status: PaymentStatus.PAID`
    (line 274) and the deduction leaves it `PAID` unless fully consumed
    (`purchase-invoices.service.ts:232`: `newRemaining === 0 ? PAID : dp.status`). A DP that is 40% consumed
    still reads `PAID`. `appliedToBillId` is never written by either path, so the link-back is also dead.
- **Expected Response DTO**:
  ```json
  { "success": true, "data": { "dpNumber": "DPB-2609-0007", "vendorId": "…", "poId": "…",
    "amount": 5000000, "remainingAmount": 5000000, "status": "PENDING" } }
  ```
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/controllers/purchase-orders.controller.ts:119-127` + service lines
    325-344 — **delete** this route. It is a second, unreconcilable implementation of a feature that
    already exists at `POST /purchase/down-payments`. This is a deletion, not a repair.
  - `backend/src/modules/scm/dto/purchase-payment.dto.ts:86-105` — add `@IsOptional() @IsUUID() poId?: string`.
  - `backend/prisma/schema/finance-extension.prisma` — add `poId String? @db.Uuid` to `DownPayment`
    (+ index), so a DP is attributable to the commitment it funds.
  - `backend/src/modules/scm/services/purchase-invoices.service.ts:208-237` — require an explicit
    `dpId`; delete the silent `findFirst` auto-pick. If the operator did not name the DP, no DP is applied.
    On apply, set `appliedToBillId: bill.id` and derive status as
    `remaining === 0 ? PAID : remaining < amount ? PARTIAL : PAID`.
  - `[Verification]` Create a DP against PO-A, then raise an invoice for PO-B — PO-B's bill is **not**
    reduced. Raise an invoice for PO-A naming `dpId` — the bill nets off and the DP reads `PARTIAL`.

#### [INV-02]: `importExcel` drops `invoiceNumber`, so duplicate detection never runs on import
- **Target Files**: `backend/src/modules/scm/services/purchase-invoices.service.ts:414-436`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The bulk path forwards only 5 of the 8 fields the row carries:
  ```ts
  // purchase-invoices.service.ts:422-429
  const created = await this.create({
    vendorId: row.vendorId, poId: row.poId, dueDate: row.dueDate,
    invoiceDate: row.invoiceDate, notes: row.notes, items: row.items,
  });
  ```
  `row.invoiceNumber` is **not** passed. Duplicate detection at lines 130-142 is guarded by
  `if (dto.invoiceNumber)`, so **every imported invoice skips it** — the same vendor invoice can be loaded
  N times, multiplying the payable. `row.dpId` / `row.dpAmountToApply` are dropped too, so a spreadsheet
  that allocates a DP silently books the bill gross. And the loop has no all-or-nothing semantics: each row
  is its own `$transaction`, so a 50-row import that fails at row 40 leaves 39 committed with only a
  per-row `{success:false}` in the result array.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-invoices.service.ts:422-429` — forward
    `invoiceNumber`, `dpId`, `dpAmountToApply`, `inboundId`, `pic`, `organizationId`.
  - `[Verification]` Import a sheet containing a vendor invoice number already present → that row returns
    `{success:false, error:"…sudah pernah dicatat"}` and no second `Bill` is written.

#### [INV-03]: Duplicate vendor-invoice check matches on free-text `notes`
- **Target Files**: `backend/src/modules/scm/services/purchase-invoices.service.ts:130-142`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `Bill` has **no** `invoiceNumber` column (`finance-extension.prisma:81-93` is
  `BillMatchResult`; the `Bill` model carries only `billNumber`, `poNumber`, `notes`). So the check
  substring-searches the operator's free-text notes:
  ```ts
  // purchase-invoices.service.ts:131-136
  const existingInvoice = await tx.bill.findFirst({
    where: { vendorId, notes: { contains: dto.invoiceNumber } },
  });
  ```
  This is both **false-positive** (notes `"PO-2026-001 …"` contains `"2026-001"` → a legitimate distinct
  invoice is rejected) and **false-negative** (any bill whose notes omit the number slips through) prone,
  because notes are written by the same service at line 246 as
  `` `${dto.notes}[Vendor Inv: ${dto.invoiceNumber}]` `` — the match succeeds only by accident of that
  concatenation, and a note the user types containing the number can trigger a bogus "duplicate".
- **Actionable Execution Plan**:
  - `backend/prisma/schema/finance-extension.prisma` — add
    `vendorInvoiceNumber String?` to `Bill` with `@@unique([vendorId, vendorInvoiceNumber])`.
  - `backend/src/modules/scm/services/purchase-invoices.service.ts:130-142` — replace the `notes`
    `contains` with an exact lookup on the new column. P2002 on the unique index then becomes the guard,
  - migrate existing `notes`-embedded values into the column before adding the constraint.
  - `[Verification]` Two bills for one vendor with the same vendor invoice number → the second is rejected
    by the index. A bill whose notes happen to contain the number no longer collides.

---

### 📌 Module: Purchase Payments & Down Payments / `/pembelian/bayar-pembelian`, `/pembelian/dp-pembelian`

#### [PAY-01]: Payment `totalAmount` is never reconciled against the allocation sum
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-payments.service.ts:87-152`
  - Database: `backend/prisma/schema/finance-extension.prisma` (`APPayment.totalAmount`, `BillAllocation`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The payment header is written from the client's `dto.amount` (line 91:
  `totalAmount: dto.amount`) while the allocations are applied independently in the loop at lines 102-152.
  Only the per-allocation ceiling is checked (`alloc.amount > remaining`, line 110) — **nothing** compares
  `sum(allocations)` to `dto.amount`. A request with `amount: 1_000_000` and a single allocation of
  `500_000` records an `APPayment` for 1,000,000 that only settled 500,000 of bills. The AP ledger, the
  bank reconciliation, and `Bill.paidAmount` all disagree, and the gap is invisible because
  `findAll` returns both the payment and its `billAllocations` with no consistency check.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "amount": 1000000,
      "allocations": [{ "billId": "uuid", "amount": 500000 }] }
    ```
  - Expected: `400` — allocation total must equal `amount`.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-payments.service.ts:87` — compute
    `allocTotal = allocations.reduce(...)` and, when it differs from `dto.amount` by more than 0.01, throw
    `BadRequestException` naming both figures. Derive `totalAmount` from `allocTotal`, not from the client.
  - `[Verification]` The mismatched request above is rejected; a matching one creates a payment whose
    header equals the sum of its allocations.

#### [PAY-02]: `reversePayment` reverses the money but leaves `status: PAID`
- **Target Files**: `backend/src/modules/scm/services/purchase-payments.service.ts:187-260`
  - Database: `backend/prisma/schema/finance-extension.prisma` (`APPayment.status`, `PaymentStatus`)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: A reversal restores each bill's `paidAmount` and recomputes `paymentStatus`
  correctly (lines 200-231), but the payment row itself is only annotated:
  ```ts
  // purchase-payments.service.ts:234-239
  const updated = await tx.aPPayment.update({
    where: { id },
    data: { notes: `${payment.notes || ''} [REVERSED: ${reason || '…'}]`.trim() },
  });
  ```
  `status` stays `PAID` (it is `PAID` from creation, line 95). The idempotency check at line 195 is likewise a
  **substring test on that same notes field** (`payment.notes?.includes('[REVERSED]')`) — a user-supplied
  reason containing the literal string, or a second reversal with a different reason, both collide with
  operator text. `PaymentStatus` (`enums.prisma:414-419`) has no `REVERSED` member to write.
- **Actionable Execution Plan**:
  - `backend/prisma/schema/enums.prisma:414-419` — add `REVERSED` to `PaymentStatus`.
  - `backend/src/modules/scm/services/purchase-payments.service.ts:195, 234-239` — gate on
    `payment.status === REVERSED` and set `{ status: 'REVERSED', notes }`; keep the audit trail in
    `auditLog` rather than in operator-editable notes.
  - `[Verification]` Reversed payments are excluded from AP aging and a second reversal returns `400`.

---

### 📌 Module: Purchase Requests / `/pembelian/purchase-requests`

#### [PR-01]: An unknown `materialId` is silently replaced with an arbitrary material
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-requests.service.ts:45-56`
  - Frontend: `frontend/src/app/(dashboard)/pembelian/purchase-requests/page.tsx:388-396`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The service never rejects an unresolvable material — it substitutes the first row
  in the table:
  ```ts
  // purchase-requests.service.ts:47-53
  const exists = await tx.materialItem.findUnique({ where: { id: matId }, select: { id: true } });
  if (!exists && defaultMat) { matId = defaultMat.id; }
  resolvedItems.push({ materialId: matId, qtyRequired: item.qtyRequired ?? item.quantity ?? 1, … });
  ```
  The frontend makes this reachable by design. When its fuzzy match fails it sends a **literal non-UUID
  string**:
  ```ts
  // purchase-requests/page.tsx:393
  materialId: matched?.id || (rawMaterials as any[])[0]?.id || "default-mat",
  ```
  So a PR line the user typed as free text — `handleAddItem` seeds
  `materialName: "Bahan Baru #N"` (`page.tsx:296-306`), which by construction never matches a real
  material — is persisted against **whatever material happens to be first in `material_items`**. The
  requisition, its approval, and the PO derived from it all name the wrong item, and nothing in the UI says
  so: the list renders `materialCode: it.material?.code` from the substituted row
  (`page.tsx:165`), so it looks legitimate. `purchase-request.dto.ts:16-18` compounds it —
  `materialId` is validated `@IsString()`, not `@IsUUID()`, so `"default-mat"` passes the DTO.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-requests.service.ts:47-53` — **delete** the
    `defaultMat` fallback. On a miss, throw
    `BadRequestException(\`Material ${item.materialId} tidak ditemukan\`)`.
  - `backend/src/modules/scm/dto/purchase-request.dto.ts:16-18` — change `@IsString()` to `@IsUUID()`
    on `materialId`.
  - `frontend/src/app/(dashboard)/pembelian/purchase-requests/page.tsx:388-396` — remove the
    `"default-mat"` / `[0]?.id` fallback; if `matched` is undefined, block submit with a toast naming the
    unmapped line, and make the line editor a real material picker.
  - `[Verification]` Submitting an unmapped line is rejected with a 400 naming the material; no PR row is
    ever created against a material the user did not choose.

#### [PR-02]: Missing warehouse falls back to `''` — a NOT NULL uuid violation surfaces as a 500
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-requests.service.ts:35-39`
  - Database: `backend/prisma/schema/*.prisma` (`PurchaseRequest.warehouseId String @db.Uuid`, NOT NULL)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // purchase-requests.service.ts:36-39
  if (!warehouseId) {
    const firstWh = await tx.warehouse.findFirst({ select: { id: true } });
    warehouseId = firstWh?.id || '';
  }
  ```
  `PurchaseRequest.warehouseId` is `String @db.Uuid` and NOT NULL. Writing `''` raises a Postgres
  `invalid input syntax for type uuid`, which the global filter turns into a **500**, not a 400 — the user
  sees a generic failure for what is a "no warehouse configured" precondition. The frontend never sends
  `warehouseId` at all (`purchase-requests/page.tsx:399-405` sends only `notes`, `budgetCode`, `priority`,
  `items`), so this path is the **normal** path, taken on every single PR creation.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-requests.service.ts:36-39` — when no warehouse exists,
    throw `BadRequestException('Gudang belum dikonfigurasi. Hubungi admin master data.')` instead of `''`.
  - `[Verification]` With zero warehouses, `POST /purchase/requests` returns 400 with that message; with one
    warehouse, the PR is created against it.

#### [FE-01]: The PR page speaks a status vocabulary the backend does not have
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/pembelian/purchase-requests/page.tsx:79, 218, 290-294, 424-433, 526, 652, 695`
  - Database: `backend/prisma/schema/enums.prisma:655-663`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The page declares its own union:
  ```ts
  // page.tsx:79
  status: "DRAFT" | "PENDING_HEAD" | "PENDING_FINANCE" | "PENDING_DIRECTOR" | "APPROVED" | "REJECTED" | "ORDERED";
  ```
  `PRStatus` is `DRAFT | PENDING | SUBMITTED | APPROVED | REJECTED | CONVERTED | CANCELLED`
  (`enums.prisma:655-663`). **`PENDING_HEAD`, `PENDING_FINANCE`, `PENDING_DIRECTOR` and `ORDERED` do not
  exist**, and the backend only ever writes `PENDING` on create
  (`purchase-requests.service.ts:64`). The three-tier approval the UI is built around therefore never
  matches a single row:
  - the "Menunggu Approval" KPI (`page.tsx:290`) counts `PENDING_HEAD|FINANCE|DIRECTOR` → **always 0**;
  - the approve/reject buttons (`page.tsx:652, 695`) are gated on the same list → **never render**, so
    `POST /purchase/requests/:id/approve` is unreachable from this page;
  - the status filter offers `ORDERED` (`page.tsx:526`), a PR can never be.
  A PR created here sits at `PENDING` and is not actionable in the UI at all.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/pembelian/purchase-requests/page.tsx` — replace the local union with
    `import type { PRStatus } from "@prisma/client"` and render the real states, including `CONVERTED`
    (which is what a PR becomes once a PO is raised — `purchase-orders.service.ts:188-192`).
  - If the **three-tier** approval is genuinely wanted, model it as three concrete states in
    `PRStatus` (`PENDING_HEAD`/`PENDING_FINANCE`/`PENDING_DIRECTOR`) and have the service advance through
    them; do not keep the tiers in the view layer where the backend cannot reach them.
  - `[Verification]` A newly created PR shows in "Menunggu Approval" with a working Approve button; after
    approval it shows `APPROVED`; after PO creation it shows `CONVERTED`.

#### [FE-02]: `PARTIALLY_RECEIVED` is not a `POStatus`, so partial receipts render as 0 forever
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/pembelian/scm-pembelian/page.tsx:86, 161-164, 266, 357-358, 491-500, 563-571, 745-753`
  - Database: `backend/prisma/schema/enums.prisma:236-249`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The list synthesises a `receivingStatus` from a PO status that cannot occur:
  ```ts
  // scm-pembelian/page.tsx:161-164
  po.status === "RECEIVED" ? "FULLY_RECEIVED"
    : po.status === "PARTIALLY_RECEIVED" ? "PARTIAL_RECEIVED" : "PENDING_INBOUND"
  ```
  `POStatus` has `PARTIAL` (`enums.prisma:241`) — not `PARTIALLY_RECEIVED`. The comparison is always false,
  so **every** PO with `PARTIAL` falls into the `PENDING_INBOUND` bucket. The "Diterima Sebagian" filter
  (line 357) and the corresponding KPI (line 266) can never match a row, and the KPI at line 266 reads
  `receivingStatus === "FULLY_RECEIVED"`, which only a manually-set `RECEIVED` satisfies. The PO that is
  half-received is displayed as if nothing had arrived — the single most misleading state on the page.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/pembelian/scm-pembelian/page.tsx:161-164` — compare against `PARTIAL`
    (and `RECEIVED`), or better, derive the state from the `inbounds`/`PurchaseOrderItem.receivedQty` data
    the API already returns instead of from `status`.
  - `[Verification]` A PO with 1 of 2 lines received shows "Diterima Sebagian", the filter returns it, and
    the partial-receipt KPI is non-zero.

---

### 📌 Module: Purchase Returns / `/pembelian/purchase-returns`

#### [RET-01]: Re-entering `COMPLETED` decrements stock a second time
- **Target Files**:
  - Backend: `backend/src/modules/scm/services/purchase-returns.service.ts:111-174`
  - Frontend: `frontend/src/app/(dashboard)/pembelian/purchase-returns/page.tsx:378-397`
  - Database: `backend/prisma/schema/enums.prisma:257-262` (`PurchaseReturnStatus`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The stock decrement is guarded only by "we were not already `COMPLETED`":
  ```ts
  // purchase-returns.service.ts:122-133
  if (dto.status === PurchaseReturnStatus.COMPLETED &&
      purchaseReturn.status !== PurchaseReturnStatus.COMPLETED) {
    for (const item of purchaseReturn.items) {
      await tx.materialItem.update({ where: { id: item.materialId },
        data: { stockQty: { decrement: Number(item.quantity) } } });
    }
  ```
  There is **no** `COMPLETED → X → COMPLETED` guard, so the cycle
  `WAITING_APPROVAL → COMPLETED → DRAFT/CANCELLED → COMPLETED` decrements `stockQty` twice for one
  physical return. The frontend makes this trivially reachable: it renders **two independent mutations that
  both target `COMPLETED`** —
  ```ts
  // purchase-returns/page.tsx:379  approveReturnMut  → POST  /purchase/returns/:id/approve
  // purchase-returns/page.tsx:391  completeReturnMut → PATCH /purchase/returns/:id/status {status:"COMPLETED"}
  ```
  — and the backend routes both into the same `updateStatus` (`purchase-returns.controller.ts:59-60` and
  65-70). The page's own comment at 376-378 acknowledges "there is no APPROVED state" while still keeping a
  separate "complete" action. The decrement also bypasses the inventory ledger entirely: it writes
  `MaterialItem.stockQty`, which the schema itself flags as a **cache**
  (`/// @note This field is a CACHE. Truth is derived from InventoryTransaction.`), with no
  `InventoryTransaction` row and no `MaterialInventory` adjustment, so the material cache and the warehouse
  stock permanently disagree.
- **Exact Contract Specification**:
  - Request DTO: `{ "status": "COMPLETED" }` — must be rejected once the return has left `COMPLETED`.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-returns.service.ts:122-125` — replace the equality check
    with an explicit transition allowlist (`DRAFT|WAITING_APPROVAL → COMPLETED`, `WAITING_APPROVAL →
    CANCELLED`) and throw on everything else; a return that has been `COMPLETED` can never re-apply stock.
  - `backend/src/modules/scm/services/purchase-returns.service.ts:127-131` — write the movement through
    the inventory ledger (`InventoryTransaction` + `MaterialInventory` for the resolved warehouse) and let
    the `stockQty` cache follow, rather than writing the cache directly.
  - `frontend/src/app/(dashboard)/pembelian/purchase-returns/page.tsx:378-397` — delete
    `completeReturnMut`; a single "Selesaikan Retur" action calls the approve route, so the double-entry
    path is removed from the UI as well as the service.
  - `[Verification]` Completing a return reduces stock exactly once; a second completion attempt returns
    `400`; an `InventoryTransaction` exists for each returned line.

#### [RET-02]: `generateReturnNumber` is a read-then-increment race
- **Target Files**: `backend/src/modules/scm/services/purchase-returns.service.ts:93-109`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The number is derived by reading the max existing `returnNumber` for the month
  prefix (lines 99-102) and adding one, with no unique-violation retry. `returnNumber` is `@unique`, so two
  concurrent returns in the same month collide and the loser gets a P2002 500. The same file already imports
  `IdGeneratorService` elsewhere in the module's siblings — `purchase-orders.service.ts:33` and
  `purchase-payments.service.ts:23` both use it — so this hand-rolled sequence is the outlier, not the norm.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-returns.service.ts:93-109` — delete
    `generateReturnNumber` and inject `IdGeneratorService`, calling `generateId('PRT')` so the sequence
    matches PO/FP/BPB/DPB.
  - `[Verification]` Two concurrent returns both succeed and receive distinct sequential numbers.

---

### 📌 Module: Cross-cutting — Tri-Layer, validation, and dead logic

#### [VAL-01]: `CreatePurchaseOrderDto.items` is `any[]` — the PO line items are entirely unvalidated
- **Target Files**:
  - Backend: `backend/src/modules/scm/dto/create-po.dto.ts:26-28`
  - Backend: `backend/src/modules/scm/services/purchase-orders.service.ts:118-132, 168-177`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // create-po.dto.ts:26-28
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  items?: any[];
  ```
  A bare `any[]` with no `@ValidateNested`/`@Type`, so `materialId`, `quantity` and `unitPrice` arrive
  unvalidated. The service then trusts them in two places that matter:
  - the 110% price-band gate (`purchase-orders.service.ts:120-131`) calls `Number(item.unitPrice)` and
    compares — a **missing or non-numeric** `unitPrice` makes the comparison `NaN`, which is falsy, so the
    SOP gate is silently bypassed rather than tripped;
  - line creation (lines 170-176) passes `quantity`/`unitPrice` straight into `Decimal` columns, so a
    string `"10"` or an empty value reaches Prisma unconverted.
  `totalAmount` is also destructured out and discarded (line 146) — correct, it is recomputed — but `discount`
  is likewise dropped while `discountManual` is honoured (line 137), leaving the DTO's `discount` field a
  no-op that a client can send and believe worked.
- **Expected Response DTO** (a bad line must produce a field-level 400, not a 500):
  ```json
  { "success": false, "message": "Request validation failed.",
    "fieldErrors": { "items[0].unitPrice": ["unitPrice must be a number greater than or equal to 0"] } }
  ```
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/dto/create-po.dto.ts` — add a `CreatePurchaseOrderItemDto` with
    `@IsUUID() materialId`, `@Type(() => Number) @IsNumber() @Min(0.01) quantity`,
    `@Type(() => Number) @IsNumber() @Min(0) unitPrice`; apply `@IsArray() @ValidateNested({each:true})
    @Type(() => CreatePurchaseOrderItemDto)`.
  - `backend/src/modules/scm/dto/create-po.dto.ts:44-46` — remove the `discount` field (it is dead) or map
    it in the service; do not leave a documented no-op.
  - `backend/src/modules/scm/services/purchase-orders.service.ts:120-131` — fail closed when
    `unitPrice` is not a finite number, instead of letting `NaN` disable the gate.
  - `[Verification]` A line with `unitPrice: "abc"` returns a 400 naming `items[0].unitPrice`; a line priced
    >110% of reference without `priceOverrideReason` is still rejected.

#### [VAL-02]: `UpdatePurchaseReturnStatusDto.status` is typed `any`
- **Target Files**:
  - Backend: `backend/src/modules/scm/dto/purchase-return.dto.ts:59-63`
  - Backend: `backend/src/modules/scm/services/purchase-returns.service.ts:111-173`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `@IsString() @IsNotEmpty() status!: any;` — the type is `any`, so the field accepts
  any string and reaches the `dto.status === PurchaseReturnStatus.COMPLETED` comparison at
  `purchase-returns.service.ts:123` where it silently takes the **else** branch (line 168) and updates status
  to garbage. Contrast `UpdatePurchaseRequestStatusDto` (`purchase-request.dto.ts:74-76`), which correctly
  uses `@IsEnum(PRStatus)` — the correct pattern already exists one file over.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/dto/purchase-return.dto.ts:59-63` — `@IsEnum(PurchaseReturnStatus)`.
  - `[Verification]` `PATCH {"status":"BANANA"}` returns 400; the same guard backs the RET-01 transition map.

#### [VAL-03]: The import endpoint takes a raw `any[]` and returns 201 with per-row failures
- **Target Files**:
  - Backend: `backend/src/modules/scm/controllers/purchase-invoices.controller.ts:38-43`
  - Backend: `backend/src/modules/scm/services/purchase-invoices.service.ts:414-436`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `@Body('rows') rows: any[]` picks a single property with no DTO and no array
  validation, and `importExcel` loops `this.create()` per row inside its own transaction (lines 420-434),
  catching each failure into `{ success:false, error, row }`. The controller returns **201** regardless, so a
  client that only checks the status code reports a fully successful import for a batch that half-committed.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/dto/purchase-invoice.dto.ts` — add `ImportPurchaseInvoicesDto` with
    `@IsArray() @ArrayMaxSize(500) @ValidateNested({each:true}) @Type(() => ImportRowDto) rows`.
  - `backend/src/modules/scm/controllers/purchase-invoices.controller.ts:41-43` — accept the DTO and
    return `207`-style partial results in the body while keeping the per-row `rowIndex` for operator
    correction.
  - `[Verification]` An oversized or malformed payload is a 400; a valid batch with one bad row returns the
    row index and reason, and the committed count matches.

#### [FE-03]: 8 of 10 `_hooks` files are dead; the pages carry a second, divergent copy
- **Target Files**:
  - Dead: `frontend/src/app/(dashboard)/pembelian/{dp-pembelian,kebutuhan,purchase-requests,purchase-returns,purchasing,receiving,scm-pembelian,scm-pembelian/create}/_hooks/*.ts`
  - Live: `bayar-pembelian/_hooks/useBayarPembelianOperations.ts`, `faktur-pembelian/_hooks/useFakturPembelianOperations.ts`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Verified by name-reference search across the cluster (excluding self-references):
  only `useBayarPembelianOperations` and `useFakturPembelianOperations` are imported; the other **8 have
  zero referrers** while the pages re-implement the same logic inline. This is the repo-wide
  "63 of 107 dead `_hooks`" pattern, and this cluster is worse than average — **8 of 10, not 63%**. The
  consequences are not cosmetic, because the two copies disagree: `dp-pembelian/_hooks/useDpPembelianOperations.ts:244`
  carries its own export toast while the live `dp-pembelian/page.tsx:374` carries a different one, and
  `purchase-requests/_hooks/usePurchaseRequestsOperations.ts` (327 lines) implements a status model that
  conflicts with the page's (see FE-01). A future fix applied to the hook would be invisible in production.
- **Actionable Execution Plan**:
  - For each of the 8 dead hooks: move the page's inline logic into the hook and delete the dead file —
    **or** delete the hook and record the decision. Do not leave both.
  - `frontend/src/app/(dashboard)/pembelian/faktur-pembelian/_components/InvoiceModals.tsx` and
    `bayar-pembelian/page.tsx` are the only two wired; use them as the template for the other eight.
  - `[Verification]` A cluster-wide search returns exactly one implementation per operation, and the eight
    dead files are gone from the tree.

#### [FE-04]: 13 of 17 `page.tsx` exceed the 150-line hard cap
- **Target Files**: `frontend/src/app/(dashboard)/pembelian/**/page.tsx`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Measured line counts against the CLAUDE.md limits (<120 target, 150 hard):

  | Lines | File |
  |---:|---|
  | 986 | `purchase-requests/page.tsx` |
  | 955 | `purchase-returns/page.tsx` |
  | 897 | `kebutuhan/page.tsx` |
  | 816 | `scm-pembelian/page.tsx` |
  | 756 | `purchasing/page.tsx` |
  | 697 | `dp-pembelian/page.tsx` |
  | 601 | `scm-pembelian/create/page.tsx` |
  | 492 | `receiving/page.tsx` |
  | 360 | `rangkuman-kebutuhan/page.tsx` |
  | 359 | `purchasing/payments/page.tsx` |
  | 324 | `vendor-performance/performance/page.tsx` |
  | 305 | `change-requests/page.tsx` |
  | 211 | `company/page.tsx` |
  | 136 | `request-list/page.tsx` (over the 120 target) |

  Only `faktur-pembelian` (107), `bayar-pembelian` (93) and `mrp` (44) comply — and those two comply
  precisely because they delegate to their `_hooks`. That is the causal link to FE-03: the two routes that
  are thin are the two whose hooks are wired. The oversized pages also exceed the 300–400 line sub-service
  ceiling at `scm-pembelian/_components/PoCreateCanvas.tsx` (588),
  `receiving/_components/ReceivingCreateCanvas.tsx` (490) and
  `bayar-pembelian/_components/BayarPembelianCanvas.tsx` (486).
  On the backend, four SCM services exceed the 250-line facade limit: `scm-dashboard.service.ts` (567),
  `purchase-orders.service.ts` (546), `purchase-invoices.service.ts` (437), `purchase-payments.service.ts` (334).
- **Actionable Execution Plan**:
  - Apply the FE-03 resolution first — the extraction is the same work — then split each page into
    `_components/` (presentation), `_hooks/` (operations + state), `_types/` (DTOs), leaving a <120-line
    shell. Do not propose design-token or `@/components/dna` changes.
  - Backend: split `purchase-orders.service.ts` at the existing seams — the blacklist/escalation gate
    (lines 43-98), the artwork gate (100-115), the price-band SOP check (117-132), and the HPP block
    (441-545) are already self-contained and each carries its own concern.
  - `[Verification]` `npm --prefix frontend run typecheck` and `npm --prefix frontend run build` pass, and
    no `page.tsx` in the cluster exceeds 150 lines.

#### [FE-05]: Five export buttons fire a success toast and download nothing
- **Target Files**:
  - `frontend/src/app/(dashboard)/pembelian/bayar-pembelian/page.tsx:49`
  - `frontend/src/app/(dashboard)/pembelian/dp-pembelian/page.tsx:374`
  - `frontend/src/app/(dashboard)/pembelian/faktur-pembelian/page.tsx:33`
  - `frontend/src/app/(dashboard)/pembelian/purchase-returns/page.tsx:440`
  - `frontend/src/app/(dashboard)/pembelian/bayar-pembelian/_hooks/useBayarPembelianOperations.ts:186`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: All are `onClick={() => toast.success("… diexport ke Excel")}` with no fetch, no
  blob, no download. The user is told a file was produced; nothing is. For AP payment and invoice data this
  is worse than cosmetic — it invites the belief that a reconciliation artifact exists.
- **Actionable Execution Plan**:
  - Implement the export against the existing `findAll` payloads (client-side CSV/XLSX generation is
    sufficient at current volumes), or disable the buttons with a tooltip until implemented. Do not leave
    a success toast on an action that does nothing.
  - `[Verification]` Clicking export downloads a file whose row count equals the filtered list.

#### [FE-06]: The DP success toast promises a journal entry the SCM module never writes
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/pembelian/dp-pembelian/page.tsx:281`
  - Backend: `backend/src/modules/scm/services/purchase-payments.service.ts:262-300`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The toast reads
  `"Uang Muka Pembelian (DP) berhasil dicatat & masuk ke Jurnal Akuntansi."` but a search for `journalEntry`
  across `backend/src/modules/scm/` returns **zero** hits — no SCM service writes a journal row at all.
  `createDownPayment` writes exactly one `DownPayment` plus an `auditLog`. A `DownPayment` is cash that has
  left the bank, and nothing in the general ledger reflects it; the finance module's
  `down-payments/down-payments.service.ts` is a separate implementation that does post. The UI is asserting
  a financial fact that the code does not produce.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-payments.service.ts:266-299` — post the debit/credit pair
    inside the existing `$transaction` (bank/cash Dr, DP asset Cr), driven by
    `finance/journal-engine.service.ts`, so the claim becomes true.
  - If posting is deferred, `frontend/src/app/(dashboard)/pembelian/dp-pembelian/page.tsx:281` — drop the
    "masuk ke Jurnal Akuntansi" clause now. A false statement in a success toast is worse than a missing one.
  - `[Verification]` Creating a DP produces exactly one balanced journal entry inside the same transaction.

#### [FE-07]: `vendor-performance` renders no error or retry state
- **Target Files**: `frontend/src/app/(dashboard)/pembelian/vendor-performance/performance/page.tsx:41-44, 126`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The query destructures only `{ data, isLoading }` and the render branches only on
  `isLoading` (line 126). There is no `isError` and no `refetch` button, so a failed `GET /scm/vendors`
  renders an empty table that is indistinguishable from "no vendors have been onboarded" — the KPI and
  ranking silently report zero performance for every supplier. This is the same class of defect the other
  pages in the cluster handle correctly (`purchase-requests/page.tsx:502-507`,
  `dp-pembelian/page.tsx:409-414`), so the fix is a copy of the established pattern.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/pembelian/vendor-performance/performance/page.tsx:41-44, 126` — destructure
    `isError` and `refetch`; render the cluster's standard error card with a retry, matching
    `purchase-requests/page.tsx:502-507`.
  - `[Verification]` A failed vendors fetch shows a retryable error card, not an empty ranking.

#### [DEAD-01]: Four implemented service methods are never called
- **Target Files**: `backend/src/modules/scm/services/purchase-orders.service.ts:348-545`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `calculateRounding`, `getDefaultSource`, `validateSourceSelection`,
  `recalcHpp` and `updateProductSupplierHistory` are all fully implemented and unit-referenced nowhere
  outside their own definitions (verified by search across `backend/src`). `getHppBreakdown` **is** wired
  (`purchase-orders.controller.ts:129-139`) and returns `autoCalculatedHpp` — but that column is only ever
  written by the uncalled `recalcHpp`, so the HPP breakdown endpoint always reports `null` against
  `effectiveHpp`. `updateProductSupplierHistory` is the "Item 39" vendor-history upsert that the approve
  flow is supposed to trigger; `approve()` (lines 277-305) never calls it, so
  `ProductSupplierHistory` — the basis for supplier performance scoring — is never populated.
- **Actionable Execution Plan**:
  - `backend/src/modules/scm/services/purchase-orders.service.ts:277-305` — call
    `updateProductSupplierHistory(id)` and `recalcHpp(materialId)` inside the existing approve
    `$transaction`; supplier scoring depends on the former.
  - For `getDefaultSource` / `validateSourceSelection` / `calculateRounding`, wire them to the inbound (GR)
    path or delete them. Do not ship unreachable code.
  - `[Verification]` Approving a PO writes `ProductSupplierHistory` rows and populates
    `MaterialItem.autoCalculatedHpp`, so the HPP breakdown returns real numbers.

#### [PO-01a] / cross-cutting: no pagination anywhere in the cluster
- **Target Files**: all SCM `findAll` methods and their consuming pages
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Every list service is an unbounded `findMany` with no `skip`/`take` and no
  `totalCount`: `purchase-orders.service.ts:226-238`, `purchase-invoices.service.ts:352-361`,
  `purchase-payments.service.ts:312-320, 328-332`, `purchase-requests.service.ts:120-131`,
  `purchase-returns.service.ts:177-185`, `scm.service.ts`. The PO query in particular fans out
  `supplier + scm + purchaseRequest + inbounds{items} + items{material}` for every row
  (lines 228-236). No page in the cluster consumes `page`/`pageSize`/`totalCount`/`totalPages`, so there is
  currently no metadata mismatch to fix — but there is also no way to grow past a few thousand POs, and the
  frontend's filter/sort is client-side over a full table fetch. Since the brief calls out pagination
  explicitly, this is recorded as a gap rather than a mismatch.
- **Actionable Execution Plan**:
  - Add `page`/`pageSize` (default 25, max 200) to the four purchasing list services and return
    `{ data, meta: { page, pageSize, totalCount, totalPages } }`; the pages' `unwrapResponse` already
    tolerates the envelope, so adopt the same shape consistently rather than per-endpoint.
  - `[Verification]` A 10k-row PO table returns 25 rows and a correct `totalPages`, and the UI paginates
    server-side rather than filtering a full fetch.

---

## Per-module verdict

| Module | Route | Verdict |
|---|---|---|
| Purchase Orders | `/pembelian/scm-pembelian` | ❌ **Reject** — status patch bypasses the whole approval matrix; created `DRAFT` while receiving expects `ORDERED`; HPP helpers dead |
| PO Create | `/pembelian/scm-pembelian/create` | ❌ **Reject** — 601-line page; line items unvalidated end-to-end; `totalAmount` silently dropped |
| Purchase Requests | `/pembelian/purchase-requests` | ❌ **Reject** — 986-line page; unknown material silently substituted; UI status vocabulary does not exist server-side, so approvals are unreachable |
| Purchase Invoices | `/pembelian/faktur-pembelian` | ❌ **Reject** — DP deduction reads a table the PO path never writes; import bypasses duplicate detection; duplicate check matches free-text notes |
| Purchase Payments | `/pembelian/bayar-pembelian`, `/purchasing/payments` | ❌ **Reject** — header total not reconciled with allocations; reversal leaves `status: PAID`; fake export |
| Down Payments | `/pembelian/dp-pembelian` | ❌ **Reject** — two conflicting DP implementations; no PO linkage; auto-deduction picks the oldest balance; success toast lies about the journal |
| Purchase Returns | `/pembelian/purchase-returns` | ❌ **Reject** — double stock decrement on status re-entry; racy number generation; bypasses the inventory ledger |
| Receiving | `/pembelian/receiving` | ⚠️ **Conditional** — create path is sound; the PO filter is dead (PO-02); 492-line page |
| Kebutuhan (MRP) | `/pembelian/kebutuhan` | ⚠️ **Conditional** — 897-line page, no write path audited against MRP shortage; hook dead |
| Vendor Performance | `/pembelian/vendor-performance/performance` | ⚠️ **Conditional** — no error state; scores a `ProductSupplierHistory` that is never written (DEAD-01) |
| Lead Capture (backend) | `backend/src/modules/lead-capture` | ⚠️ **Conditional** — no frontend in scope; `lead-ingestion.service.ts` is 1318 lines (well over the 300–400 ceiling); `kommoWebhook` takes `@Body() body: any` |

**Cluster verdict: NOT production-ready.** 25 findings — 9 Critical Bug, 4 Contract Mismatch, 3 Missing
Validation, 4 Broken UX State, 5 Edge Case. Of the 9 Critical, 5 are silent-corruption or money-integrity
defects (PR-01, INV-01, INV-02, INV-03, RET-01), 1 is a complete authorisation bypass (PO-01), and the
remaining 3 are unreconciled AP totals and a NOT NULL/uuid violation surfacing as a 500 (PAY-01, PO-04,
PR-02). Per repo memory, the production ERP side is currently unused (179 of 195 tables empty), so these
are **forward-looking risks rather than incurred loss** — which is the argument for fixing them *before*
the first real purchase cycle, not after.

**Suggested execution order**: PO-01 → INV-01 → PR-01 → RET-01 → PAY-01 (correctness and authorisation),
then INV-02/INV-03 and VAL-01/VAL-02/VAL-03 (data integrity and validation), then FE-01/FE-02 (contract
mismatches), then FE-03 → FE-04 together (the extraction is one piece of work), then FE-05/FE-07 and
DEAD-01 (cleanup).
