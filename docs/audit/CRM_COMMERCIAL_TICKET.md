# Actionable Execution Ticket: CRM and Commercial Sales CRUD Audit

**Target File**: `docs/audit/CRM_COMMERCIAL_TICKET.md`  
**Audit Scope**:
- Frontend: `frontend/src/app/(dashboard)/penjualan/` (`sales-orders`, `bayar-penjualan`, `faktur-penjualan`, `down-payment`, `retur-penjualan`, `sample-sales`, `client-manager`, `crm-leads`, `guest-book`, `lost`, `sales-target`, `pipeline`, `retention-engine`)
- Backend: `backend/src/modules/commercial/`, `backend/src/modules/bussdev/`, `backend/src/modules/crm/`
- Database: `backend/prisma/schema/` (`bussdev.prisma`, `crm.prisma`, `finance.prisma`, `enums.prisma`)

---

## 1. Critical Bugs

### 📌 Module: [Penjualan Down Payment / `/penjualan/down-payment`]
#### [COMM-01]: Non-Atomic Multi-Entity Down Payment & Offset Creation
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/down-payment/page.tsx`
  - Backend: `backend/src/modules/commercial/services/sales-down-payments.service.ts`
  - Database: `backend/prisma/schema/finance.prisma`, `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-down-payments.service.ts:98-137`, creating a Down Payment mutation executes four separate Prisma operations serially without `prisma.$transaction`:
  1. `this.prisma.invoice.create` (line 98) creates DP invoice marked `PAID`.
  2. `this.prisma.sampleFee.update` (line 114) offsets sample fee.
  3. `this.prisma.payment.create` (line 122) records payment against invoice.
  4. `this.prisma.salesOrder.update` (line 133) transitions SO status to `ACTIVE`.
  If step 2, 3, or 4 throws (e.g. invalid verifier ID, DB deadlock, foreign key mismatch), step 1 has already committed. The system enters an inconsistent state where a DP invoice is permanently `PAID` but the Sales Order remains stuck in `PENDING_DP`, sample fee is not offset, and no payment record exists.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "soId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "amount": 25000000,
      "category": "PRODUKSI",
      "sampleFeeId": "8ba85f64-5717-4562-b3fc-2c963f66afa1",
      "paymentMethod": "TRANSFER",
      "bankAccount": "BCA_01",
      "verifiedBy": "user-uuid"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "invoiceId": "inv-uuid",
        "invoiceNumber": "INV-DP-2026-0001",
        "paymentId": "pay-uuid",
        "soStatus": "ACTIVE",
        "effectiveTotalDp": 25000000,
        "sampleFeeOffset": 2500000
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/sales-down-payments.service.ts` — Wrap lines 98-137 inside `return this.prisma.$transaction(async (tx) => { ... })` and execute all invoice, sampleFee, payment, and salesOrder updates on `tx`.
  - `backend/src/modules/commercial/services/sales-down-payments.service.ts` — Validate that `dto.verifiedBy` references a valid active User before starting transaction.
  - `[Verification]` — Send payload with an invalid `verifiedBy` UUID; confirm zero records are committed to `unified_invoices`, `sample_fees`, or `payments`.

---

### 📌 Module: [Penjualan Down Payment / `/penjualan/down-payment`]
#### [COMM-02]: Entity ID Cross-Contamination (`so.leadId` vs `sampleFee.customerId`)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/down-payment/page.tsx`
  - Backend: `backend/src/modules/commercial/services/sales-down-payments.service.ts`
  - Database: `backend/prisma/schema/finance.prisma`, `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-down-payments.service.ts:64-77`, the query to locate offsettable sample fees checks:
  ```typescript
  const sampleFee = await this.prisma.sampleFee.findFirst({
    where: {
      OR: [
        ...(dto.sampleFeeId ? [{ id: dto.sampleFeeId }] : []),
        { customerId: so.leadId },
      ],
    },
  });
  ```
  `SampleFee.customerId` is a foreign key to the `Customer` entity (`finance.prisma:307`). In contrast, `SalesOrder.leadId` is an identifier for `SalesLead` (`bussdev.prisma:16`). `Customer` and `SalesLead` are two distinct entities. Comparing `customerId: so.leadId` fails to match valid sample fees because `Customer` IDs and `SalesLead` IDs do not collide unless lazily created via `CustomerLinkHelper`. `CustomerLinkHelper` is never imported or invoked in `commercial/services/sales-down-payments.service.ts`.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "soId": "so-uuid",
      "amount": 10000000,
      "category": "PRODUKSI",
      "sampleFeeId": null
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "invoiceNumber": "INV-DP-2026-0002",
        "sampleFeeOffset": 1500000,
        "effectiveTotalDp": 11500000
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/commercial.module.ts` — Provide and export `CustomerLinkHelper`.
  - `backend/src/modules/commercial/services/sales-down-payments.service.ts` — Inject `CustomerLinkHelper`. Resolve `customerId` from `so.leadId` via `customerLinkHelper.resolveCustomerId(so.leadId)` before querying `this.prisma.sampleFee`.
  - `[Verification]` — Create a Sample Fee for a client lead promoted to customer. Create a DP for an SO tied to that lead. Verify the sample fee is automatically matched and deducted from the DP obligation.

---

### 📌 Module: [Bussdev Sales Order / `/penjualan/sales-orders`]
#### [BUSSDEV-01]: Unchecked Sales Order Status Transition Bypass
- **Target Files**:
  - Backend: `backend/src/modules/bussdev/bussdev.controller.ts`, `backend/src/modules/bussdev/bussdev.service.ts`
  - Database: `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `commercial/services/sales-orders.service.ts:108-117`, updating a Sales Order enforces state machine rules:
  ```typescript
  if (dto.status === SOStatus.ACTIVE) {
    const dpInvoice = await this.prisma.invoice.findFirst({
      where: { soId: id, type: 'DP', status: 'PAID' },
    });
    if (!dpInvoice) throw new BadRequestException('Cannot activate SO without a PAID DP invoice');
  }
  ```
  However, `bussdev.controller.ts:298` exposes:
  `@Patch('sales-order/:id/status') updateSalesOrderStatus(@Param('id') id: string, @Body() dto: { status: SOStatus; loggedBy: string })`
  which delegates to `bussdev.service.ts:360-388`. That method executes:
  `await tx.salesOrder.update({ where: { id: soId }, data: { status } });`
  with zero state machine validation! Any client or background worker can call `PATCH /bussdev/sales-order/:id/status` with `status: "ACTIVE"` or `"COMPLETED"` to bypass down payment verification, production release gates, and credit checks entirely.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "status": "ACTIVE",
      "loggedBy": "user-uuid"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "statusCode": 400,
      "message": "Cannot activate SO without a PAID DP invoice",
      "error": "Bad Request"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/bussdev/bussdev.service.ts` — Import `StateTransitionService` or call `SalesOrdersService.updateStatus` inside `updateSalesOrderStatus`.
  - Enforce check: If target status is `ACTIVE`, verify that a `PAID` DP invoice exists in `unified_invoices` for that `soId`.
  - `[Verification]` — Send `PATCH /bussdev/sales-order/:id/status` with `ACTIVE` on an SO with no paid DP. Verify it returns `400 Bad Request`.

---

### 📌 Module: [Penjualan Invoices / `/penjualan/faktur-penjualan`]
#### [COMM-03]: Dead Credit Limit Enforcement Checking Non-Existent `so.lead.creditLimit`
- **Target Files**:
  - Backend: `backend/src/modules/commercial/services/invoices.service.ts`
  - Database: `backend/prisma/schema/finance.prisma`, `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `invoices.service.ts:50-73`, invoice creation attempts to enforce customer credit limit:
  ```typescript
  const creditLimit = Number((so.lead as any)?.creditLimit || 0);
  if (creditLimit > 0) { ... }
  ```
  `SalesLead` (`bussdev.prisma:1`) does NOT have a `creditLimit` field. `creditLimit` is defined exclusively on `Customer` (`finance.prisma:284`). Because `so.lead` never has a `creditLimit` property, `creditLimit` always evaluates to `0`. Consequently, lines 52-73 are completely dead code, and credit limit checks are never evaluated for any customer or order during invoice generation.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "soId": "so-uuid",
      "type": "FINAL_PAYMENT",
      "dueDate": "2026-11-01T00:00:00.000Z"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "statusCode": 400,
      "message": "Credit limit exceeded: Outstanding balance plus new invoice exceeds limit of 50000000",
      "error": "Bad Request"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/invoices.service.ts` — Inject `CustomerLinkHelper`.
  - Resolve the `Customer` record using `customerLinkHelper.resolveCustomerId(so.leadId)`.
  - Query `customer.creditLimit` from `this.prisma.customer` instead of reading `(so.lead as any)?.creditLimit`.
  - `[Verification]` — Set `Customer.creditLimit = 10000000`. Generate invoices exceeding 10,000,000 IDR. Confirm invoice creation is rejected with credit limit exceeded error.

---

### 📌 Module: [Penjualan Bayar Penjualan / `/penjualan/bayar-penjualan`]
#### [COMM-04]: Hardcoded Missing Account Codes Risking Unbalanced Journal Postings on Payment
- **Target Files**:
  - Backend: `backend/src/modules/commercial/services/payments.service.ts`
  - Database: `backend/prisma/schema/finance.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `payments.service.ts:93-138`, journal entries are constructed using hardcoded COA code strings:
  ```typescript
  const bankAccount = await tx.account.findUnique({ where: { code: '1101' } }); // Kas/Bank
  const arAccount = await tx.account.findUnique({ where: { code: '1103' } }); // Piutang Dagang
  const pphAccount = await tx.account.findUnique({ where: { code: '1108' } }); // Uang Muka PPh 23
  const unearnedRevAccount = await tx.account.findUnique({ where: { code: '2102' } }); // Pendapatan Diterima di Muka
  ```
  If any of these accounts are missing or deactivated (such as during COA reorganization or different tenant setups), the code sets `creditAccount: arAccount?.id || ''` or skips lines, creating an unbalanced journal entry or foreign key violation. Furthermore, if `pph23Deduction > 0` but account `1108` does not exist, the debit side drops the PPh line while crediting the full AR amount, violating double-entry balance constraints.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "invoiceId": "inv-uuid",
      "amountPaid": 10000000,
      "coaId": "acc-uuid",
      "pph23Deduction": 200000
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "paymentId": "pay-uuid",
        "journalId": "jrn-uuid",
        "totalDebit": 10000000,
        "totalCredit": 10000000
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/payments.service.ts` — Replace hardcoded code lookups with dynamic account resolution via `CompanySetting` / `AccountingSetting` or require `coaId` in `CreatePaymentDto`.
  - Validate that `bankAccount`, `arAccount`, and `pphAccount` exist and throw an explicit `BadRequestException('Configured GL account [code] not found')` BEFORE constructing journal lines.
  - Verify total debits equal total credits before creating `journalEntry`.
  - `[Verification]` — Test payment with PPh 23 deduction; verify journal entry balances to the exact rupiah.

---

### 📌 Module: [Bussdev Retur Penjualan / `/penjualan/retur-penjualan`]
#### [BUSSDEV-02]: Arbitrary Fallback Credit Note Amount (Rp 1.000.000) and Non-Atomic Journal Posting
- **Target Files**:
  - Backend: `backend/src/modules/bussdev/returns/returns.service.ts`
  - Database: `backend/prisma/schema/bussdev.prisma`, `backend/prisma/schema/finance.prisma`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `returns.service.ts:50-84`:
  1. If return item pricing cannot be determined, line 68 sets:
     `const creditAmount = itemSubtotal > 0 ? itemSubtotal : 1000000;`
     An arbitrary dummy value of Rp 1.000.000 is written to financial records!
  2. The credit note creation and journal entry creation run outside of `this.prisma.$transaction`. If journal entry generation fails, the sales return and credit note are already committed without matching general ledger postings.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "returnNumber": "RET-2026-0001",
      "soId": "so-uuid",
      "reason": "DEFECTIVE",
      "items": [
        { "soItemId": "so-item-uuid", "quantity": 10, "unitPrice": 50000 }
      ]
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "returnId": "ret-uuid",
        "creditNoteAmount": 500000,
        "journalId": "jrn-uuid"
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/bussdev/returns/returns.service.ts` — Remove arbitrary `1000000` fallback; throw `BadRequestException('Unit price is required for sales return item calculation')` if subtotal is zero or missing.
  - Wrap return creation, credit note generation, and journal posting in `this.prisma.$transaction`.
  - `[Verification]` — Attempt to create return with 0 unit price items; verify it fails validation cleanly rather than posting a fabricated Rp 1.000.000 credit note.

---

### 📌 Module: [Penjualan Sample Sales / `/penjualan/sample-sales`]
#### [FE-SAMPLE-01]: Silent Error Swallowing and Mock Data Fallback
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/sample-sales/page.tsx`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sample-sales/page.tsx:82-105`:
  ```typescript
  try {
    const res = await fetch("/api/v1/sample-sales");
    if (!res.ok) throw new Error("Failed to fetch");
    ...
  } catch (err) {
    // Falls back to MOCK_SAMPLE_SALES!
    setData(MOCK_SAMPLE_SALES);
  }
  ```
  When the backend endpoint fails, is 401 unauthenticated, or throws a 500 error, the page swallows the error completely and populates the table with hardcoded fake data (`smp-001`, `smp-002`, `smp-003`). Users are misled into thinking sample requests exist in the database, and status changes appear to work in UI state but never save to the server.
- **Exact Contract Specification**:
  - Expected UI Behavior on Error: Render `isError` UI state with retry button and clear toast notification detailing the server error.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/sample-sales/page.tsx` — Remove `MOCK_SAMPLE_SALES` fallback from `catch` block.
  - Set `setError(err.message)` and display error banner or `DnaEmptyState` with retry handler.
  - `[Verification]` — Disconnect network or stop backend; verify page displays an explicit error alert, not fake mock samples.

---

## 2. Contract Mismatches

### 📌 Module: [Penjualan Bayar Penjualan / `/penjualan/bayar-penjualan`]
#### [FE-PAY-01]: Payload Key Mismatch (`amount` vs `amountPaid`) Causing 400 Bad Request
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/page.tsx`
  - Backend: `backend/src/modules/commercial/dto/create-payment.dto.ts`, `backend/src/modules/commercial/controllers/payments.controller.ts`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `bayar-penjualan/page.tsx:184`:
  ```typescript
  body: JSON.stringify({
    invoiceId: selectedInvoice.id,
    amount: payAmt, // <-- WRONG KEY
    paymentMethod,
    bankAccount,
  })
  ```
  In `create-payment.dto.ts:16-18`:
  ```typescript
  @IsNotEmpty()
  @IsNumber()
  amountPaid!: number; // <-- BACKEND EXPECTS amountPaid
  ```
  Because NestJS uses global `ValidationPipe` with whitelist rules, the `amount` key is stripped, `amountPaid` is `undefined`, and class-validator throws `400 Bad Request: amountPaid should not be empty, amountPaid must be a number`. Payments can never be submitted from the frontend.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "invoiceId": "c47b5974-98c4-4b53-b295-8e2ec03df480",
      "amountPaid": 5000000,
      "paymentMethod": "TRANSFER",
      "bankAccount": "BCA_01",
      "coaId": "account-uuid",
      "pph23Deduction": 0
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "id": "pay-uuid",
      "paymentNumber": "PAY-2026-0001",
      "amountPaid": 5000000,
      "status": "COMPLETED"
    }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/page.tsx:184` — Change payload key from `amount: payAmt` to `amountPaid: payAmt`.
  - `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/_types/bayar-penjualan.types.ts` — Align `PaymentSubmitPayload` interface with `CreatePaymentDto`.
  - `[Verification]` — Submit payment form from UI; verify backend returns 201 Created and payment record is stored.

---

### 📌 Module: [Penjualan Faktur Penjualan / `/penjualan/faktur-penjualan`]
#### [FE-INV-01]: Enum Value Mismatch (`PELUNASAN` vs `FINAL_PAYMENT`)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/faktur-penjualan/page.tsx`
  - Backend: `backend/src/modules/commercial/dto/create-invoice.dto.ts`
  - Database: `backend/prisma/schema/enums.prisma`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `faktur-penjualan/page.tsx:180`:
  ```typescript
  body: JSON.stringify({
    ...formData,
    type: "PELUNASAN", // <-- WRONG ENUM
  })
  ```
  In `backend/prisma/schema/enums.prisma:186` and `create-invoice.dto.ts:35`:
  ```typescript
  export enum InvoiceType {
    DP = 'DP',
    FINAL_PAYMENT = 'FINAL_PAYMENT',
  }
  ```
  The database and DTO only recognize `DP` and `FINAL_PAYMENT`. `PELUNASAN` is rejected by NestJS `@IsEnum(InvoiceType)` with `400 Bad Request: type must be one of the following values: DP, FINAL_PAYMENT`. All final invoice creations fail.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "soId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "type": "FINAL_PAYMENT",
      "dueDate": "2026-10-15T00:00:00.000Z",
      "notes": "Pelunasan invoice"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "id": "inv-uuid",
      "invoiceNumber": "INV-2026-0001",
      "type": "FINAL_PAYMENT",
      "totalAmount": 15000000,
      "status": "ISSUED"
    }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/faktur-penjualan/page.tsx:180` — Replace `"PELUNASAN"` with `"FINAL_PAYMENT"`.
  - `[Verification]` — Create final payment invoice from frontend modal; verify request succeeds and invoice status becomes `ISSUED`.

---

### 📌 Module: [Penjualan Sample Sales / `/penjualan/sample-sales`]
#### [FE-SAMPLE-02]: Entity Key Mismatch (`customerName` vs `customerId`)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/sample-sales/page.tsx`
  - Backend: `backend/src/modules/bussdev/services/sample-sales.service.ts`, `backend/src/modules/bussdev/dto/create-sample-sale.dto.ts`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sample-sales/page.tsx:135`:
  ```typescript
  body: JSON.stringify({
    customerName: formCustomer,
    productName: formProduct,
    quantity: formQty,
    fee: formFee,
  })
  ```
  In `create-sample-sale.dto.ts:10-14` and `sample-sales.service.ts:15`:
  The backend requires `customerId: string` (pointing to a `SalesLead` or `Customer`). Because the frontend sends `customerName` instead of `customerId`, the backend validator rejects the request, or `prisma.sampleSale.create` fails with foreign key constraint errors.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "customerId": "8ba85f64-5717-4562-b3fc-2c963f66afa1",
      "productName": "Sample Serum Glow",
      "quantity": 2,
      "fee": 150000
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "id": "smp-uuid",
      "sampleCode": "SMP-2026-0001",
      "customerId": "8ba85f64-5717-4562-b3fc-2c963f66afa1",
      "status": "REQUESTED"
    }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/sample-sales/page.tsx` — Add customer selector dropdown bound to `/api/v1/crm/leads` or `/api/v1/customers`.
  - Send `{ customerId: selectedLeadId, ... }` in the POST request body.
  - `[Verification]` — Select a lead, submit sample sale; verify backend creates sample sale record without 400 or 500 error.

---

### 📌 Module: [Penjualan Down Payment / `/penjualan/down-payment`]
#### [FE-DP-01]: Missing Category Property in Backend Response Causing Category Tab Starvation
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/down-payment/page.tsx`
  - Backend: `backend/src/modules/commercial/services/sales-down-payments.service.ts`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-down-payments.service.ts:40-52`:
  ```typescript
  return this.prisma.salesOrder.findMany({
    where: { status: 'PENDING_DP' },
    select: {
      id: true,
      soNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      lead: { select: { clientName: true, brandName: true } },
      invoices: { where: { type: 'DP' }, select: { ... } },
    }
  });
  ```
  The returned SO object does not select or map `category` (e.g. `PRODUKSI`, `SAMPLE`, `LEGALITAS`). In `down-payment/page.tsx:112`, the UI filters items by `item.category === activeTab`. Because `category` is undefined on all returned records, all items fall through or are coerced to `"produksi"`. The "Sample" and "Legalitas" tabs are perpetually empty.
- **Exact Contract Specification**:
  - Expected Response DTO item:
    ```json
    {
      "id": "so-uuid",
      "soNumber": "SO-2026-0001",
      "totalAmount": 50000000,
      "category": "PRODUKSI",
      "lead": { "clientName": "PT Kosmetik Sukses", "brandName": "GlowSkin" },
      "invoices": []
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/sales-down-payments.service.ts:40-52` — Include `category: true` in `findMany` select, or derive from SO items / metadata.
  - `[Verification]` — Load down payment page; switch between Produksi, Sample, and Legalitas tabs; verify items display in appropriate tabs.

---

### 📌 Module: [Penjualan Faktur & Bayar / `/penjualan/faktur-penjualan`, `/penjualan/bayar-penjualan`]
#### [FE-INV-02]: Relation Key Mismatch (`salesOrder` vs `so`) Causing Blank Order Number and Customer
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/faktur-penjualan/page.tsx`, `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/page.tsx`
  - Backend: `backend/src/modules/commercial/services/invoices.service.ts`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `invoices.service.ts:33-40`, the query returns the relation mapped under `so`:
  ```typescript
  include: {
    so: {
      include: {
        lead: { select: { id: true, clientName: true, brandName: true } }
      }
    }
  }
  ```
  In `faktur-penjualan/page.tsx:288` and `bayar-penjualan/page.tsx:322`, the frontend accesses `inv.salesOrder?.soNumber` and `inv.salesOrder?.lead?.clientName`. Because the backend returns the property named `so` rather than `salesOrder`, `inv.salesOrder` is always `undefined`. The UI falls back to "-" for SO number and "Customer" for client name across all rows in both tables.
- **Exact Contract Specification**:
  - Expected Response DTO item:
    ```json
    {
      "id": "inv-uuid",
      "invoiceNumber": "INV-2026-0001",
      "so": {
        "id": "so-uuid",
        "soNumber": "SO-2026-0001",
        "lead": { "clientName": "PT Cantik", "brandName": "Glow" }
      }
    }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/faktur-penjualan/page.tsx` & `bayar-penjualan/page.tsx` — Update data accessors to check `inv.so?.soNumber || inv.salesOrder?.soNumber` and `inv.so?.lead?.clientName || inv.salesOrder?.lead?.clientName`.
  - Alternatively, in `invoices.service.ts:33`, project `salesOrder: inv.so` before sending response.
  - `[Verification]` — Open Faktur Penjualan and Bayar Penjualan tables; verify SO numbers (e.g. `SO-2026-0001`) and client names render properly without fallbacks.

---

## 3. Broken UX State & Architecture

### 📌 Module: [Penjualan Sales Orders / `/penjualan/sales-orders`]
#### [FE-SO-01]: Hardcoded Dummy Fallback UUIDs (`00000000-0000-0000-0000-000000000001`)
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/sales-orders/page.tsx`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-orders/page.tsx:142` and `168`:
  ```typescript
  leadId: selectedLeadId || "00000000-0000-0000-0000-000000000001",
  materialItemId: item.materialItemId || "00000000-0000-0000-0000-000000000001",
  ```
  If user creates an order without selecting an explicit lead or material, the form submits a dummy zero-UUID instead of blocking validation. If record `...0001` exists in seed data, orders are silently attached to the wrong customer; if it does not exist, the backend throws an unhandled Prisma foreign key constraint violation (P2003) resulting in a raw 500 error.
- **Exact Contract Specification**:
  - Frontend Client Validation: Block submission with inline error message "Pilih Customer / Lead terlebih dahulu" and "Pilih Material untuk setiap item".
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/sales-orders/page.tsx` — Remove fallback `"00000000-0000-0000-0000-000000000001"`. Add client-side validation guard requiring `selectedLeadId` and item `materialItemId` before form submission.
  - `[Verification]` — Try submitting SO modal with empty lead or material; verify submit button is disabled or triggers validation toast.

---

### 📌 Module: [Penjualan Sales Target / `/penjualan/sales-target`]
#### [FE-TARGET-01]: Zero Backend Wiring — 100% In-Memory Mock Data
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/sales-target/page.tsx`
  - Backend: `backend/src/modules/bussdev/`
  - Database: `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-target/page.tsx:35-188`:
  The entire page runs on hardcoded state (`INITIAL_TARGETS`, `MOCK_TEAM`). There are zero `fetch()` or `useQuery` calls. Submitting a new target simply updates local React `useState` and logs:
  `// ponytail: SalesTarget backend controller is not yet exposed via HTTP. Display honest warning that target is recorded in local session only.`
  All created targets are wiped upon page refresh.
- **Exact Contract Specification**:
  - Request DTO (Target Creation):
    ```json
    {
      "staffId": "staff-uuid",
      "year": 2026,
      "month": 10,
      "targetAmount": 100000000
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "tgt-uuid",
        "staffId": "staff-uuid",
        "targetAmount": 100000000
      }
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/bussdev/controllers/sales-target.controller.ts` — Create controller and service wiring target persistence to `BussdevStaff.targetRevenue` or a dedicated `SalesTarget` table.
  - `frontend/src/app/(dashboard)/penjualan/sales-target/page.tsx` — Replace in-memory state with React Query hook calling `/api/v1/bussdev/targets`.
  - `[Verification]` — Create a target, refresh browser, verify target data persists.

---

### 📌 Module: [Penjualan CRM Leads / `/penjualan/crm-leads`]
#### [FE-CRM-01]: In-Memory Operational Batch State Vanishing on Refresh
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/crm-leads/CRMLeadsClient.tsx`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `CRMLeadsClient.tsx:38-46`:
  ```typescript
  const [batches, setBatches] = useState<LeadBatch[]>(INITIAL_BATCHES);
  ```
  Batch creation, lead assignment, and status updates only mutate local React `useState`. While master leads fetch from `/api/v1/crm/leads`, all batch grouping logic is transient in-memory state. Refreshing the browser destroys all assigned batches.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "batchName": "Q4 Cosmetics Prospect",
      "leadIds": ["lead-uuid-1", "lead-uuid-2"],
      "assignedTo": "staff-uuid"
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": { "id": "batch-uuid", "batchName": "Q4 Cosmetics Prospect", "totalLeads": 2 }
    }
    ```
- **Actionable Execution Plan**:
  - Wire batch mutations to `backend/src/modules/crm/leads/` batch assignment endpoints.
  - Persist lead batch associations in database schema (`crm.prisma`).
  - `[Verification]` — Create a lead batch, reload page; verify batch and lead assignments remain intact.

---

### 📌 Module: [Penjualan Pipeline & Retention / `/penjualan/pipeline`, `/penjualan/retention-engine`]
#### [FE-NAV-01]: Dead Route Redirects to Non-Existent `/bussdev/*` URLs
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/pipeline/page.tsx`, `frontend/src/app/(dashboard)/penjualan/retention-engine/page.tsx`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `pipeline/page.tsx:13`:
  `redirect('/bussdev/client-manager')`
  In `retention-engine/page.tsx:13`:
  `redirect('/bussdev/client-ro')`
  Neither `/bussdev/client-manager` nor `/bussdev/client-ro` exists in the Next.js `app` router tree. Clicking on "Pipeline" or "Retention Engine" in navigation directs the user into an immediate 404 Not Found error page.
- **Exact Contract Specification**:
  - Pipeline must redirect to `/penjualan/client-manager?view=pipeline` or render a kanban view.
  - Retention Engine must redirect to `/penjualan/client-manager?view=retention` or render the retention dashboard.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/penjualan/pipeline/page.tsx` — Change redirect destination to `/penjualan/client-manager` or render pipeline kanban component.
  - `frontend/src/app/(dashboard)/penjualan/retention-engine/page.tsx` — Change redirect destination to `/penjualan/client-manager` or render retention metrics component.
  - `[Verification]` — Click Pipeline and Retention Engine navigation items; confirm no 404 occurs.

---

### 📌 Module: [Penjualan Architecture / Entire Scope]
#### [FE-ARCH-01]: Systematic Dead `_hooks` & Massive Tri-Layer Violation Across All 11 Routes
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  Every route in `frontend/src/app/(dashboard)/penjualan/` contains a collocated `_hooks` directory, but NOT A SINGLE `page.tsx` IMPORTS ITS HOOK:
  - `sales-orders/page.tsx` (907 lines) orphans `_hooks/useSalesOrdersOperations.ts`
  - `client-manager/page.tsx` (1020 lines) orphans `_hooks/useClientManagerOperations.ts`
  - `bayar-penjualan/page.tsx` (360 lines) orphans `_hooks/useBayarPenjualanOperations.ts`
  - `faktur-penjualan/page.tsx` (310 lines) orphans `_hooks/useFakturPenjualanOperations.ts`
  - `down-payment/page.tsx` (340 lines) orphans `_hooks/useDownPaymentOperations.ts`
  - `retur-penjualan/page.tsx` (390 lines) orphans `_hooks/useReturPenjualanOperations.ts`
  - `sample-sales/page.tsx` (280 lines) orphans `_hooks/useSampleSalesOperations.ts`
  - `guest-book/page.tsx` (220 lines) orphans `_hooks/useGuestBookOperations.ts`
  - `lost/page.tsx` (240 lines) orphans `_hooks/useLostOperations.ts`
  - `sales-target/page.tsx` (190 lines) orphans `_hooks/useSalesTargetOperations.ts`
  - `crm-leads/CRMLeadsClient.tsx` (450 lines) orphans `_hooks/useCRMLeadsOperations.ts`
  Every single page violates the 120-line hard cap (reaching up to 1020 lines). Logic in `_hooks` has drifted from the inline logic in `page.tsx`.
- **Exact Contract Specification**:
  - `page.tsx` must be an ultra-thin coordinator under 120 lines delegating state and queries to `_hooks/use<Module>Operations.ts` and presentation to `_components/`.
- **Actionable Execution Plan**:
  - Refactor each `page.tsx` in `penjualan/` to import and call its collocated `_hooks` file.
  - Delete duplicate inline query and mutation code in `page.tsx`.
  - Bring all `page.tsx` files under 120 lines.
  - `[Verification]` — Run `git diff --stat` to verify `page.tsx` line counts are < 120 and hooks are actively imported.

---

## 4. Missing Validation & Numerical Accuracy

### 📌 Module: [Commercial Sales Orders / `/penjualan/sales-orders`]
#### [COMM-05]: Premature Sales Order Creation for Unconverted CRM Leads
- **Target Files**:
  - Backend: `backend/src/modules/commercial/services/sales-orders.service.ts`
  - Database: `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `sales-orders.service.ts:40-58`:
  ```typescript
  const lead = await this.prisma.salesLead.findUnique({ where: { id: dto.leadId } });
  if (!lead) throw new NotFoundException('Lead not found');
  if (lead.status === 'LOST') throw new BadRequestException('Cannot create SO for lost lead');
  ```
  The service permits Sales Orders to be created for leads with status `NEW_LEAD`, `CONTACTED`, or `SAMPLE_REQUESTED`. A raw inquiry or unverified prospect can be committed into binding manufacturing and financial workflows before being qualified, approved, or promoted to `WON` / `Customer`. Furthermore, lines 44-45 attempt to check `(lead as any).isBlacklisted` and `(lead as any).isActive`, which are phantom fields that exist on `Customer`, not `SalesLead`.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    {
      "leadId": "unconverted-lead-uuid",
      "items": [{ "materialItemId": "mat-uuid", "quantity": 100, "unitPrice": 50000 }]
    }
    ```
  - Expected Response DTO:
    ```json
    {
      "statusCode": 400,
      "message": "Lead must be converted or in WON stage before raising a Sales Order",
      "error": "Bad Request"
    }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/sales-orders.service.ts:42` — Enforce:
    `if (!['WON', 'DEAL', 'CONVERTED'].includes(lead.status)) throw new BadRequestException('Lead must be in qualified/won stage to create Sales Order');`
  - Check blacklist status on the resolved `Customer` entity via `CustomerLinkHelper`.
  - `[Verification]` — Attempt to create SO for a `NEW_LEAD`; confirm rejection.

---

### 📌 Module: [Commercial Invoices / `/penjualan/faktur-penjualan`]
#### [COMM-06]: Delivery Gate Release without Payment Settlement Verification
- **Target Files**:
  - Backend: `backend/src/modules/commercial/services/invoices.service.ts`
  - Database: `backend/prisma/schema/bussdev.prisma`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `invoices.service.ts:137-140`:
  ```typescript
  async releaseDelivery(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.prisma.salesOrder.update({
      where: { id: invoice.soId },
      data: { deliveryGateStatus: 'RELEASED' },
    });
  }
  ```
  `releaseDelivery` updates the Sales Order's `deliveryGateStatus` to `RELEASED` without checking `invoice.status === 'PAID'` or whether the customer has unpaid overdue invoices! Finished goods can be released for shipment from warehouse with zero payment verification.
- **Exact Contract Specification**:
  - Expected Behavior:
    `if (invoice.status !== 'PAID') throw new BadRequestException('Cannot release delivery for unpaid invoice');`
- **Actionable Execution Plan**:
  - `backend/src/modules/commercial/services/invoices.service.ts:138` — Add guard checking `invoice.status === 'PAID'` before setting `deliveryGateStatus: 'RELEASED'`.
  - `[Verification]` — Call `releaseDelivery` on an `ISSUED` (unpaid) invoice; verify 400 error is thrown.

---

### 📌 Module: [Commercial Payments & Down Payments / Entire Commercial Scope]
#### [COMM-07]: Floating Point Arithmetic in Financial Down Payment & Payment Calculations
- **Target Files**:
  - Backend: `backend/src/modules/commercial/services/sales-down-payments.service.ts`, `backend/src/modules/commercial/services/payments.service.ts`, `backend/src/modules/commercial/services/sales-orders.service.ts`
  - Database: `backend/prisma/schema/finance.prisma`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  Across commercial services:
  - `sales-down-payments.service.ts:85-87`:
    `const effectiveTotalDp = Number(dto.amount) + sampleFeeOffsetAmount;`
    `const minimumRequiredDp = Number(so.totalAmount) * 0.5;`
  - `payments.service.ts:32-35`:
    `const effectivePaid = Number(dto.amountPaid) + pph23;`
    `const overpayment = Math.max(0, effectivePaid - currentOutstanding);`
    `const arSettled = Math.min(effectivePaid, currentOutstanding);`
    `const newOutstanding = Math.max(0, currentOutstanding - effectivePaid);`
  - `sales-orders.service.ts:60`:
    `sum + Number(item.quantity) * Number(item.unitPrice)`
  Prisma `Decimal` fields are converted into JavaScript IEEE-754 binary floating-point numbers (`Number(...)`). This introduces rounding drift (e.g. `0.1 + 0.2 !== 0.3`) in monetary calculations, risking fraction-of-a-rupiah calculation errors and corrupted balance sheets.
- **Exact Contract Specification**:
  - All calculations must use `Prisma.Decimal` methods (`.add()`, `.sub()`, `.mul()`, `.div()`, `.gte()`).
- **Actionable Execution Plan**:
  - Refactor all arithmetic in `sales-down-payments.service.ts`, `payments.service.ts`, and `sales-orders.service.ts` to use `new Prisma.Decimal(...)`.
  - `[Verification]` — Run unit tests with high-precision decimal numbers (e.g. `10000000.55`); verify zero floating-point precision error.

---

## 5. Edge Cases & Pagination

### 📌 Module: [Penjualan Client Manager / `/penjualan/client-manager`]
#### [FE-CLIENT-01]: 1000+ Line Monolith Page with Orphaned Colocated Presentation Components
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/penjualan/client-manager/page.tsx`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  In `client-manager/page.tsx`:
  The file is 1020 lines long. Colocated subcomponents in `_components/` (`ClientFilterToolbar.tsx`, `ClientMetricsCard.tsx`, `ClientTable.tsx`, `CreateLeadModal.tsx`, `DetailDrawer.tsx`) are completely ignored. Instead, duplicate implementations of all modals, filters, tabs, and tables are written inline within `page.tsx`.
- **Actionable Execution Plan**:
  - Extract inline drawer, modal, and table JSX into their existing counterparts in `_components/`.
  - Replace state logic with `_hooks/useClientManagerOperations.ts`.
  - Shrink `page.tsx` to < 120 lines.
  - `[Verification]` — Verify `page.tsx` is under 120 lines and all client management functions work identically.

---

### 📌 Module: [CRM & Commercial Backend / All Endpoints]
#### [COMM-08]: Inconsistent List Envelope Shapes and Unbounded Pagination
- **Target Files**:
  - Backend: `backend/src/modules/commercial/controllers/`, `backend/src/modules/crm/`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  - `invoices.controller.ts:findAll` and `payments.controller.ts:findAll` return raw arrays without pagination metadata (`page`, `pageSize`, `totalCount`, `totalPages`).
  - `leads.controller.ts:findAll` returns `{ leads: [...], total: ... }` instead of the standard `{ success: true, data: { items: [], pagination: {} } }` envelope.
  - Frontend data tables fail to render pagination controls properly, and large customer databases cause full-table memory exhaustion.
- **Actionable Execution Plan**:
  - Wrap all list endpoint responses in standard API envelope:
    `{ success: true, data: items, pagination: { page, pageSize, totalCount, totalPages } }`.
  - `[Verification]` — Query `/commercial/invoices?page=1&pageSize=10`; verify pagination metadata is returned.

---

## 6. Per-Module One-Line Verdict Table

| Module Route | Status | Primary Defect | Action Required |
| :--- | :--- | :--- | :--- |
| `/penjualan/down-payment` | **BLOCKED** | Non-atomic 4-step write & `customerId` vs `leadId` mismatch | Wrap in `$transaction`, resolve customer ID |
| `/penjualan/bayar-penjualan` | **BROKEN** | Payload key `amount` instead of `amountPaid` (400 Bad Request) | Update frontend payload key to `amountPaid` |
| `/penjualan/faktur-penjualan` | **BROKEN** | Enum `PELUNASAN` instead of `FINAL_PAYMENT` (400 Bad Request) | Update frontend enum value to `FINAL_PAYMENT` |
| `/penjualan/sample-sales` | **BROKEN** | Silently catches API errors, serves fake mock data | Remove mock fallback, fix `customerId` payload |
| `/penjualan/sales-orders` | **DEGRADED** | Fallback UUID `...0001` & unguarded status bypass in backend | Remove fallback UUID, enforce DP check in backend |
| `/penjualan/sales-target` | **DEAD** | 100% in-memory mock data, zero backend endpoints | Create backend persistence & wire React Query |
| `/penjualan/pipeline` | **DEAD** | Redirects to non-existent `/bussdev/client-manager` (404) | Redirect to `/penjualan/client-manager` |
| `/penjualan/retention-engine`| **DEAD** | Redirects to non-existent `/bussdev/client-ro` (404) | Redirect to `/penjualan/client-manager` |
| `/penjualan/retur-penjualan` | **DEGRADED** | Hardcoded Rp 1.000.000 fallback credit & non-atomic GL post | Remove fallback amount, wrap in transaction |
| `/penjualan/client-manager` | **VIOLATION** | 1020-line monolith, 100% dead `_hooks` and `_components` | Refactor to collocated hooks & components (<120 lines) |
| `/penjualan/crm-leads` | **DEGRADED** | Operational batches stored in React state, lost on refresh | Persist batches in backend database |
| `/penjualan/guest-book` | **VIOLATION** | Colocated `_hooks` completely unused | Wire page to `_hooks/useGuestBookOperations.ts` |
| `/penjualan/lost` | **VIOLATION** | Colocated `_hooks` completely unused | Wire page to `_hooks/useLostOperations.ts` |
