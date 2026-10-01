# Actionable Execution Ticket — Finance AR/AP Cluster

**Scope:** 7 frontend routes (`cash-in`, `cash-out`, `piutang`, `ap-aging`, `ar-hub`, `bayar-sample`, `bank-reconciliation`)
+ 9 backend modules (`sales-invoices`, `ar-receipts`, `bills`, `ap-payments`, `sales-invoice-line-items`,
`bill-line-items`, `bank-accounts`, `bank-transactions`, `bank-reconciliations`)
**Schema:** `backend/node_modules/.prisma/client/schema.prisma` (generated from `backend/prisma/` — note: no
`backend/prisma/schema.prisma` exists on disk; the only source files are `frontend/prisma/schema.prisma` and
`frontend/prisma/schema/schema.prisma`. Models below were read from the generated client, which is what the
backend actually types against.)
**Audited:** 2026-10-01 · working tree at `feat/p08-contracts-subject-ownership` @ `07d1cbac`

---

## Executive summary

The cluster has **no shared state model**. Two accounting worlds exist simultaneously and disagree:

| | Entity-based services (9 assigned modules) | Legacy controller services |
|---|---|---|
| Invoice | `SalesInvoice` / `Bill` (Prisma models) | `Invoice` (unified, `category: RECEIVABLE\|PAYABLE`) |
| List endpoint | `GET /finance/sales-invoices` | `GET /finance/invoices`, `GET /finance/bills` |
| Paid via | `ARReceipt` / `APPayment` + `BillAllocation` | `Invoice.outstandingAmount` inline update |

**Every frontend route in scope calls the legacy world, not the assigned modules.** `sales-invoices.service.ts`,
`ar-receipts.service.ts`, `ap-payments.service.ts` and the two line-item services have **zero frontend callers** —
so the assigned backend modules are dark code, and the money-moving paths the UI exercises are unaudited
legacy code. Findings below are split accordingly; the dark-module defects (D-01, D-02) are the most dangerous
because they are the code the architecture intends to promote to canonical.

Verified as NOT a problem (checked, do not re-audit): `CommonModule` is `@Global()` and registered in
`app.module.ts`, so `FinanceGateHelper` injection into the 5 sub-modules that never import it is valid
(`backend/src/common/common.module.ts:7-14`).

---

## CRITICAL

### 📌 Module: [ar-receipts / ar-hub]
#### [AR-01]: Journal line posts a **BankAccount id** into `JournalLine.accountId` — FK to `accounts` breaks the posting
- **Target Files**:
  - Backend: `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:147-163`
  - Database: `schema.prisma` — `JournalLine.accountId String @db.Uuid` → `account Account @relation(...)`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `ar-receipts.service.ts:157` creates the debit leg as
  `{ accountId: dto.bankAccountId, debit: dto.amount, credit: 0 }`. `dto.bankAccountId` is a **`bank_accounts.id`**
  (validated as such by `CreateArReceiptDto.bankAccountId @IsUUID()`, and used correctly at
  `ar-receipts.service.ts:140-144` to update the balance). But `JournalLine.accountId` FKs to **`accounts`**,
  not `bank_accounts`. The two id spaces are unrelated UUIDs. The correct value is `BankAccount.glAccountId`
  (which exists precisely for this, `schema.prisma` `BankAccount.glAccountId String? @db.Uuid // Link to GL
  Account for posting`) — and which `bank-transactions.service.ts:95-99` already enforces before posting.
  Two outcomes, both bad: (a) the referenced account does not exist → `P2003` FK violation → the whole
  `$transaction` rolls back, so the receipt, the invoice `paidAmount` update **and** the bank balance
  increment are all lost; or (b) a UUID collision is effectively impossible, so in practice it is (a).
  Net effect: **AR receipt with a bank account can never be created.** Without `bankAccountId` the journal
  is silently skipped (`:148` guard), so no AR movement reaches the ledger at all.
  Contrast `ap-payments.service.ts:213` which makes the identical mistake (`accountId: bankAcc.id`).
- **Exact Contract Specification**:
  - Request DTO (unchanged): `{"customerId":"<uuid>","invoiceId":"<uuid>","amount":1500000,"bankAccountId":"<bank-accounts.uuid>"}`
  - Expected Response DTO:
    ```json
    {
      "success": true,
      "data": {
        "id": "<uuid>", "receiptNumber": "RECV-2609-0001",
        "customerId": "<uuid>", "invoiceId": "<uuid>",
        "amount": "1500000.00", "pph23Amount": null,
        "bankAccountId": "<uuid>", "receiptDate": "2026-09-08T00:00:00.000Z"
      }
    }
    ```
  - Journal side-effect (required, currently wrong):
    ```json
    { "lines": [
      { "accountId": "<accounts.uuid = bankAccount.glAccountId>", "debit": "1500000.00", "credit": "0.00" },
      { "accountId": "<accounts.uuid = AR 1201>",        "debit": "0.00", "credit": "1500000.00" }
    ]}
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:139-163` — before the journal block, load
    the bank account and read `glAccountId`; reject with `BadRequestException` when it is null (mirroring
    `bank-transactions.service.ts:95-99`); use `bankAcc.glAccountId` in the debit leg instead of
    `dto.bankAccountId`.
  - `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:154` — `sourceDocumentType: 'PAYMENT' as any`
    is an unsound cast; pass the real `SourceDocumentType` enum member and drop `as any`.
  - `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:152-153` — set `salesInvoiceId: receipt.invoiceId`
    on the `JournalEntry` (the column exists, `schema.prisma` `salesInvoiceId String? @db.Uuid`) so the ledger
    can be traced back to the invoice.
  - **[Verification]** POST a receipt with `bankAccountId` set to an account that has `glAccountId` populated →
    201, one `JournalEntry` with two balanced lines whose `accountId`s both resolve in `accounts`, and
    `BankTransaction` written. Then POST with a bank account whose `glAccountId` is null → 400 with a message
    naming `accountCode`, not a 500.

---

### 📌 Module: [ap-payments / ap-aging]
#### [AR-02]: AP payment journal posts `bankAcc.id` into `JournalLine.accountId` — identical FK defect, and it is *silent*
- **Target Files**:
  - Backend: `backend/src/modules/finance/ap-payments/ap-payments.service.ts:196-227`
  - Database: `schema.prisma` — `JournalLine.accountId` → `accounts`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `ap-payments.service.ts:213` writes
  `{ accountId: bankAcc.id, debit: 0, credit: Number(payment.totalAmount) }` where `bankAcc` is a
  `BankAccount` fetched at `:178-180`. Same wrong id space as AR-01. This one is worse in one respect: the
  whole journal block is wrapped in `if (apAcc)` (`:198`), and `apAcc` is only the **AP account (2101)** —
  the bank-side id is never validated at all, so the failure is deferred to the FK constraint. Worse again,
  `Number(payment.totalAmount)` at `:209/:215/:226` converts a `Decimal(15,2)` to an IEEE-754 double, and the
  bank balance is then overwritten with `currentBalance: Number(...)` at `:226` — a read-modify-write through a
  float. Two concurrent payments on the same account lose one increment (last-write-wins), and any amount that
  is not exactly representable in a double drifts the ledger permanently.
  Net effect: `POST /finance/ap-payments/:id/paid` is a 500 whenever a real AP account 2101 exists, i.e.
  **AP payment settlement is unusable**, and the status update + bill allocation inside the same
  `$transaction` roll back with it.
- **Exact Contract Specification**:
  - Request DTO (unchanged): `{"billId":"<uuid>","amount":1500000}`
  - Expected Response DTO (after `POST :id/paid`):
    ```json
    { "success": true, "data": { "id":"<uuid>","paymentNumber":"BPB-2609-0001","status":"PAID",
        "totalAmount":"1500000.00","bankAccountId":"<uuid>","verifiedBy":"<uuid>" } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:178-186` — load the bank account and
    require `glAccountId`; throw `BadRequestException` when it is null.
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:213` — use `bankAcc.glAccountId`.
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:224-227` — replace the read-modify-write
    with `data: { currentBalance: { decrement: payment.totalAmount } }` so the database performs the
    arithmetic at `Decimal` precision. `ar-receipts.service.ts:142` already does this correctly — the two
    sides of the cluster disagree.
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:204` — drop `as any`; use the enum.
  - **[Verification]** A verified payment with allocations and a GL-linked bank account → 201, balanced
    2-line journal, `Bill.paidAmount` incremented, `BankAccount.currentBalance` decremented, and
    `SUM(JournalLine.debit) === SUM(JournalLine.credit)` for the new entry.

---

### 📌 Module: [ap-aging / ap-aging]
#### [AR-03]: AP Aging table reads snake_case keys the API never returns — the screen renders an empty table
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/ap-aging/_hooks/useApAgingOperations.ts:63-153`
  - Backend: `backend/src/modules/executive/reports.service.ts:183-263`
  - Database: `schema.prisma` — `Invoice.category`, `Invoice.outstandingAmount`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The backend returns **camelCase `ApAgingRow[]`**, one row per invoice, wrapped as
  `{ data: items, summary: {...} }` (`reports.service.ts:254-263`, interface at `:20-32` with
  `supplier`, `invoiceNo`, `outstandingAmount`, `daysOverdue`, `bucket`). The hook's **first** branch tests
  `b.supplier_name && b.total_ap !== undefined` and reads `h_minus_3`, `h_minus_7`, `current`, `over_30`,
  `over_60`, `over_90` — **snake_case, none of which exist on `ApAgingRow`.** So the branch never fires.
  The **second** branch (`:155-187`) is the intended path, but it fabricates the identity of every row:
  `invoiceNo: b.invoiceNumber || \`BILL-${b.id?.slice(0,8)}\`` and `invoiceDate` from `b.createdAt` (the
  legacy `Invoice` model has no `createdAt` on the row the report emits, so it renders `""`), and it
  recomputes `daysOverdue` from `b.dueDate` with a **sign-flipped formula** at `:157-160`:
  `Math.ceil((dueDate - now) / 86400000)`. `dueDate - now` is days *until* due; negating and taking `abs`
  gives the right number only for past dates, so a due date in the future yields `daysOverdue = 0` via
  `daysToDue > 0` → correct by accident, but the backend's own `daysOverdue` and `bucket` values
  (already computed at `reports.service.ts:209-215`) are discarded and replaced.
  Worse, the `catch` at `:35-38` swallows **any** failure of `/reports/ap-aging` and silently substitutes
  `/finance/bills` — a different entity (`Invoice` PAYABLE) with a different shape — so a 500 or a
  permission error presents to the user as "no outstanding payables", and `apReportRaw.data` for the
  fallback is `unwrapResponse(...)` of a raw array, which is a different envelope again.
  The `_types/ap-aging.types.ts` `ApAgingBucket` union is `"Current" | "1-30" | "31-60" | ">60"` while the
  backend emits `"61-90"` (`reports.service.ts:31`) — a fifth bucket the type cannot represent, so a
  61–90 day payable is mis-typed at the boundary.
- **Exact Contract Specification**:
  - Request: `GET /reports/ap-aging?asOfDate=2026-09-30`
  - Expected Response DTO (as actually served today — **this is the target shape**, do not change the backend):
    ```json
    { "data": [ { "id":"<uuid>","supplier":"PT X","supplierId":"<uuid>","invoiceNo":"INV-0001",
                  "invoiceDate":"2026-09-01T00:00:00.000Z","dueDate":"2026-09-30T00:00:00.000Z",
                  "daysOverdue":12,"totalAmount":"5000000.00","paidAmount":"2000000.00",
                  "outstandingAmount":"3000000.00","bucket":"1-30" } ],
      "summary": { "totalOutstanding":"3000000.00","currentTotal":"0","overdueTotal":"3000000.00",
                   "buckets":{"Current":"0","1-30":"3000000.00","31-60":"0","61-90":"0",">90":"0"},
                   "count":1 } }
    ```
  - Frontend consumption contract (the fix):
    ```ts
    // use the fields the API already returns; drop every snake_case branch
    const rows = apReportRaw?.data ?? [];
    items = rows.map(r => ({ id: r.id, vendor: r.supplier, invoiceNo: r.invoiceNo,
      invoiceDate: r.invoiceDate.slice(0,10), deadline: r.dueDate.slice(0,10),
      statusDueDate: bucketToStatus(r.bucket), daysOverdue: r.daysOverdue,
      amount: Number(r.outstandingAmount), bucket: normaliseBucket(r.bucket) }));
    // kpis from apReportRaw.summary, not recomputed client-side
    ```
- **Actionable Execution Plan**:
  - `frontend/.../ap-aging/_hooks/useApAgingOperations.ts:63-188` — delete the `supplier_name`/`total_ap`/
    `h_minus_3…over_90` branch entirely; map `ApAgingRow` 1:1 as shown above. This removes ~85 lines of
    dead mapping and the fabricated `INV-H3-*` / `BILL-*` invoice numbers.
  - `frontend/.../ap-aging/_hooks/useApAgingOperations.ts:35-38` — delete the `catch` fallback to
    `/finance/bills`. On error, surface the error state; do not substitute a different entity's rows.
  - `frontend/.../ap-aging/_hooks/useApAgingOperations.ts:191-215` — take `totalOutstanding` from
    `apReportRaw.summary.totalOutstanding`; derive the H-3/H-7 counts from `summary.buckets` or drop those
    two KPIs if the report cannot support them (it cannot — there is no H-3 concept in the backend).
  - `frontend/.../ap-aging/_types/ap-aging.types.ts:3` — widen `ApAgingBucket` to include `"61-90"`.
  - **[Verification]** With 3 unpaid payables at 10 / 45 / 80 days overdue, the table shows 3 rows with the
    real supplier names and real invoice numbers, bucketed `1-30` / `31-60` / `61-90`; the KPI total equals
    the sum of the three `outstandingAmount`s. Killing the backend reports endpoint surfaces an error state,
    not an empty table.

---

### 📌 Module: [bills / piutang]
#### [AR-04]: `/finance/bills` create DTO has **no** `class-validator` decorator and a different field set than `CreateBillDto`
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/piutang/page.tsx:223-226` (read), `frontend/src/app/(dashboard)/finance/bills/page.tsx`
  - Backend: `backend/src/modules/finance/finance.controller.ts:84-97`
  - Database: `schema.prisma` — `Bill.pic String` (**NOT NULL, no default**)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The live collection handler is `finance.controller.ts:84-97`:
  ```ts
  async createBill(@Body() dto: { vendorId: string; billRef: string; issueDate: string; dueDate: string; amount: number; })
  ```
  An **inline anonymous type** — TypeScript types are erased at runtime, so **zero** validation runs. There
  is no `@IsUUID()`, no `@IsNumber()`, no `@IsDateString()`. Any body reaches the service. This is the exact
  situation the `BillsController` header comment (`bills.controller.ts:10-17`) describes but resolves in the
  wrong direction: the comment says the *legacy* handlers were removed so `CreateBillDto` would own the
  route, but the legacy `finance.controller.ts:84` was left in place and wins by registration order, so
  `CreateBillDto` (which requires `procurementCategory`, `pic`, and a non-empty `lineItems` array) is dead.
  `CreateBillDto` also declares `dueDate` and `pic` and `procurementCategory` as required
  (`dto/create-bill.dto.ts:56-86`) while the live DTO has none of them. Consequence: the UI can create a
  `Bill` without `pic` (NOT NULL, no default) or without line items, and the failure surfaces as a raw P2002
  / P2003 from Postgres, not a 400. The `amount` the UI sends is never reconciled against any line items —
  a client-supplied total.
- **Exact Contract Specification**:
  - Request DTO (the corrected, validated one — the frontend must be updated to match):
    ```json
    { "vendorId":"<uuid>", "billRef":"PO-2026-0099", "procurementCategory":"Bahan Baku (11510)",
      "issueDate":"2026-09-08", "dueDate":"2026-10-08", "pic":"Arie",
      "lineItems":[ {"itemCode":"BBK00028","itemName":"Beeswax","qty":5.5,"unit":"kg","price":85000,"discount":0} ] }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id":"<uuid>","billNumber":"FP-2609-000001","vendorId":"<uuid>",
      "procurementCategory":"Bahan Baku (11510)","subtotal":"467500.00","taxAmount":"51425.00",
      "grandTotal":"518925.00","paidAmount":"0.00","paymentStatus":"PENDING","pic":"Arie",
      "invoiceDate":"2026-09-08T00:00:00.000Z","dueDate":"2026-10-08T00:00:00.000Z" } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/finance.controller.ts:84-97` — replace the inline body type with
    `CreateBillDto` (already written and fully decorated at `dto/create-bill.dto.ts:46-87`) and drop the
    `@Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)` narrowing in favour of the 5-role set used by every
    other finance controller, otherwise `ADMIN`/`DIRECTOR`/`HEAD_OPS` get 403 on a screen they can see.
  - `backend/src/modules/finance/finance.controller.ts:163-167` — `GET finance/bills` currently calls
    `getInvoices('PAYABLE')` (the legacy `Invoice` model) while `POST` will now write a `Bill`. List and
    create must describe the same entity; align the GET to `BillsService.findAll()`.
  - `frontend/src/app/(dashboard)/finance/piutang/page.tsx:223-226` and `frontend/.../finance/bills/page.tsx` —
    update the create payload to the `CreateBillDto` shape above; send `lineItems`, not a bare `amount`.
  - **[Verification]** `POST /finance/bills` with `{}` → 400 listing every missing field. With a valid body →
    201 and `grandTotal === subtotal * 1.11` computed server-side. `GET /finance/bills` returns the created
    bill.

---

## HIGH

### 📌 Module: [piutang / ar-hub]
#### [AR-05]: Four of seven routes never import their own `_hooks` — two live copies of each domain's logic
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/piutang/page.tsx` (1043 lines),
    `.../ar-hub/page.tsx` (706), `.../bayar-sample/page.tsx` (530), `.../ap-aging/page.tsx` (431)
  - Frontend (dead): `.../piutang/_hooks/usePiutangOperations.ts` (281),
    `.../ar-hub/_hooks/useArHubOperations.ts` (305), `.../bayar-sample/_hooks/useBayarSampleOperations.ts` (126),
    `.../ap-aging/_hooks/useApAgingOperations.ts` (282)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Verified by import scan — `cash-in` and `cash-out` and `bank-reconciliation` import
  their hook; **`piutang`, `ar-hub`, `bayar-sample`, `ap-aging` do not.** All four re-implement the same
  queries inline in `page.tsx`. This is the known repo-wide "63 of 107 dead hooks" defect, and it is
  load-bearing here because **the two copies disagree**:
  - `piutang/page.tsx:573` reads `num(inv.outstanding)`; `ar-hub/_hooks/useArHubOperations.ts:56` reads
    `num(inv.outstandingAmount)`. `getArHubPending()` returns the legacy `Invoice` rows untransformed
    (`finance-invoice.service.ts:656-670`), whose field is **`outstandingAmount`**. So the piutang AR Hub
    table's "Outstanding" column silently renders `Rp 0` for every row.
  - `piutang/page.tsx:746,749` calls `inv.grand_total.toLocaleString()` and `inv.sisa.toLocaleString()` on
    values the mapper produced from `amountDue`/`outstanding`; `ar-hub` formats the same data via
    `formatRupiah`. Two number-formatting paths, one of which will throw `TypeError: Cannot read properties
    of undefined` if a row slips through the mapper untyped.
  - All four pages blow the 150-line hard cap in `CLAUDE.md` §2 by 2.8×–6.9×.
- **Exact Contract Specification** (shared row shape, one definition, consumed by all four):
    ```ts
    interface PendingOrderRow { id: string; invoiceNumber: string; customerName: string;
      reference: string; dueDate: string | null; amountDue: number; outstanding: number; status: string; }
    ```
- **Actionable Execution Plan**:
  - `frontend/.../finance/piutang/page.tsx` — delete the inline `useQuery`/`useMutation` blocks
    (`:102-138`, `:223-250`, `:342-360`, `:562-641`) and consume `usePiutangOperations()`; move the AR Hub
    section body into the already-existing `_components/ARHubSection.tsx` and pass it rows.
  - `frontend/.../finance/ar-hub/page.tsx` — same, consume `useArHubOperations()`.
  - `frontend/.../finance/bayar-sample/page.tsx` — same, consume `useBayarSampleOperations()`.
  - `frontend/.../finance/ap-aging/page.tsx` — same, consume `useApAgingOperations()` (this also lands the
    AR-03 fix in one place).
  - Fix `piutang/page.tsx:573` to read `inv.outstandingAmount` in the interim, **before** the refactor, since
    the wrong figure is on screen today.
  - **[Verification]** `grep -c "api.get" <route>/page.tsx` returns 0 for all seven routes; no route exceeds
    150 lines; the Outstanding column in the piutang AR Hub table matches the ar-hub Outstanding column for
    the same invoice.

---

### 📌 Module: [bank-reconciliation / bank-reconciliation]
#### [AR-06]: "Finalize" posts the **create** endpoint with a body the DTO rejects — reconcile sessions are never finalized
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/bank-reconciliation/_hooks/useBankReconciliationOperations.ts:215-233`
  - Backend: `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts:58-119`,
    `.../bank-reconciliations.controller.ts:62-80`
  - Database: `schema.prisma` — `BankReconciliation.periodStart` / `periodEnd` **NOT NULL**
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `finalizeMutation` (`:215-224`) calls
  `POST /finance/bank-reconciliations` — the **create** handler — with
  `{ bankAccountId, period, statementBalance, bookBalance }`. `CreateBankReconciliationDto`
  (`dto/bank-reconciliations.dto.ts:10-51`) requires `bankAccountId`, **`periodStart`**, **`periodEnd`**,
  `statementBalance`; the payload sends **`period`** (singular, no such field) and omits both required dates.
  Because `bankAccountId` and `statementBalance` happen to be present, the failure is `periodStart` +
  `periodEnd` → **400 on every click**, and the toast reads "Gagal memfinalisasi rekonsiliasi". The correct
  call is `POST /finance/bank-reconciliations/:id/finalize` (`:69-80`) against a session created earlier by
  `POST /finance/bank-reconciliations` — but the hook never creates a session first, so there is no `id` to
  finalize. The whole finalize flow is unreachable.
  Two further defects in the same hook: the reconciliation-adjustment journal (`:236-251`) posts
  `{ journalNumber, transactionDate, sourceDocument, items:[{debit: 0, credit: 0}] }` while
  `CreateJournalDto` requires `date`, `description` and `lines[]` (`dto/create-journal.dto.ts:40-75`) — every
  key is wrong, and the single line is `debit: 0, credit: 0`, which fails the balance check at
  `finance-journal.service.ts:154-158` *and* the mandatory-attachment check at `:187-194`. And the auto-match
  (`:195-212`) reconciles **every** unreconciled transaction in the list with `Promise.all`, i.e. it asserts
  "matched" without any matching — a rubber stamp that makes the reconciliation meaningless.
- **Exact Contract Specification**:
  - Step 1 — `POST /finance/bank-reconciliations` (create session):
    ```json
    { "bankAccountId":"<uuid>","periodStart":"2026-09-01","periodEnd":"2026-09-30",
      "statementBalance":"50000000.00","notes":"Rekonsiliasi September 2026" }
    ```
    ```json
    { "success": true, "data": { "id":"<uuid>","bankAccountId":"<uuid>","periodStart":"...","periodEnd":"...",
        "statementBalance":"50000000.00","bookBalance":"48200000.00","difference":"1800000.00","status":"OPEN" } }
    ```
  - Step 2 — `POST /finance/bank-reconciliations/:id/finalize`:
    ```json
    { "notes":"Seluruh baris cocok dengan rekening koran" }
    ```
    ```json
    { "success": true, "data": { "id":"<uuid>","status":"RECONCILED","reconciledBy":"<uuid>",
        "reconciledAt":"2026-10-01T00:00:00.000Z" } }
    ```
  - Step 3 (adjustment journal) — `POST /finance/journals`:
    ```json
    { "date":"2026-09-30","reference":"ADJ-RECON-000123",
      "description":"Penyesuaian rekonsiliasi bank BCA-001",
      "sourceDocumentType":"MANUAL",
      "attachmentUrls":["https://storage/statement.pdf"],
      "lines":[ {"accountId":"<accounts.uuid: bankAccount.glAccountId>","debit":900000.00,"credit":0},
                {"accountId":"<accounts.uuid: 6190>","debit":0,"credit":900000.00} ] }
    ```
- **Actionable Execution Plan**:
  - `frontend/.../useBankReconciliationOperations.ts:215-233` — split into two mutations: `createSessionMutation`
    posting the step-1 body, and `finalizeMutation` taking the returned `id` and calling `:id/finalize`.
  - `frontend/.../useBankReconciliationOperations.ts:236-251` — rewrite the payload to the step-3 shape;
    use `selectedAccount.glAccountId` (already loaded, `:148`) and the real difference as the amount, never
    `0`.
  - `frontend/.../useBankReconciliationOperations.ts:195-212` — do not auto-reconcile. Match on amount +
    date proximity and only reconcile rows above a tolerance; surface the rest as unmatched for a human.
  - **[Verification]** Finalizing a session whose `difference !== 0` still requires explicit confirmation and
    marks the in-period transactions reconciled; the summary card flips to "Reconciled" and
    `GET /finance/bank-reconciliations/summary?bankAccountId=…` reports `unreconciledCount: 0`.

---

## MEDIUM

### 📌 Module: [bank-accounts / bank-reconciliation]
#### [AR-07]: `BankAccount` is read as `balance` in two places and as `currentBalance` in three — the AP KPI is always 0
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/ap-aging/_hooks/useApAgingOperations.ts:56-61` and
    `frontend/src/app/(dashboard)/finance/ap-aging/page.tsx:85`
  - Backend: `backend/src/modules/finance/bank-accounts/bank-accounts.service.ts:12-26`
  - Database: `schema.prisma` — `BankAccount.currentBalance Decimal @default(0) @db.Decimal(18,2)`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `useApAgingOperations.ts:58` sums `Number(b.balance || 0)`. `BankAccountsService.findAll`
  returns raw Prisma rows, so the field is **`currentBalance`** — there is no `balance` column and no alias.
  `|| 0` then turns the miss into a silent zero, so the "Real-Time Bank Balance" KPI renders `Rp 0` on a
  page whose whole purpose is showing real cash. The duplicate at `ap-aging/page.tsx:85` is the same bug in
  the inline copy (see AR-05). Three other call sites get it right
  (`bank-reconciliation/.../useBankReconciliationOperations.ts:148,175`; `bank-accounts/page.tsx:71,77-79`),
  which is why it survived — nothing fails, one number is just always zero.
  Separately, `bank-accounts.service.ts:12-26` filters `where: { isActive: true }`, so an inactive account
  disappears from the picker with no way to see or reactivate it; the `PATCH :id` accepts `isActive`
  (`dto/bank-accounts.dto.ts:72`) but nothing in the UI can reach a deactivated row.
- **Exact Contract Specification**:
  - `GET /finance/bank-accounts` → `[{ "id":"<uuid>","accountCode":"BCA-001","bankName":"BCA",
    "accountNumber":"123-456-7890","accountType":"BANK","currencyCode":"IDR",
    "currentBalance":"15000000.00","glAccountId":"<uuid|null>","isActive":true,
    "_count":{"transactions":12,"apPayments":0,"arReceipts":3} }]`
- **Actionable Execution Plan**:
  - `frontend/.../ap-aging/_hooks/useApAgingOperations.ts:56-61` — sum `Number(b.currentBalance ?? 0)`.
  - `frontend/.../ap-aging/page.tsx:85` — same, or delete the block per AR-05.
  - `backend/src/modules/finance/bank-accounts/bank-accounts.service.ts:14` — accept an
    `?includeInactive=true` query param; keep the default as-is so no existing caller changes behaviour.
  - **[Verification]** With one BCA account at 15,000,000 the KPI shows `Rp 15.000.000`; after
    `PATCH {isActive:false}` the row disappears from the default list and reappears with
    `?includeInactive=true`.

---

### 📌 Module: [sales-invoices / ar-hub]
#### [AR-08]: Sales-invoice post is the only balanced path; bills post is short by exactly the tax
- **Target Files**:
  - Backend (correct): `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:161-180`
  - Backend (broken): `backend/src/modules/finance/bills/bills.service.ts:143-175`
  - Database: `schema.prisma` — `Bill.taxAmount Decimal(15,2)` NOT NULL
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `sales-invoices.service.ts:162-170` builds three legs — Dr AR `totalAmount`, Cr Revenue
  `subtotal`, Cr PPN `taxAmount` — and *fails loudly* if any account is missing (`:147-159`, with a comment
  explaining exactly this hazard). `bills.service.ts:160-171` builds only two: Dr Expense **`subtotal`**,
  Cr AP **`grandTotal`**. `grandTotal = subtotal * 1.11`, so the entry is short by `taxAmount` on the credit
  side and **fails the balance check** — except that `bills.service.ts` writes through `tx.journalEntry.create`
  directly rather than through `FinanceJournalService.createJournalEntry`, so the check at
  `finance-journal.service.ts:154-158` is **bypassed entirely**. The unbalanced entry is persisted.
  Compounding: the block is guarded by `if (apAcc && expenseAcc)` (`:149`) — a **silent skip** where a
  missing account posts nothing and the bill is still marked `postedAt`, which is precisely the failure the
  sales-invoice path was hardened against. And `expenseAcc` is resolved by
  `code: bill.procurementCategory.match(/\d+/)?.[0] || '5000'` (`:146-148`) — taking the **first digit run**
  of a free-text category like `"Bahan Baku (11510)"` gives `"11510"`, but a category such as
  `"Beban 6 Operasional"` gives `"6"`, matching whatever account happens to be coded `6`.
- **Exact Contract Specification**:
  - Expected journal for `POST /finance/bills/:id/post` on a 467,500 subtotal:
    ```json
    { "lines":[ {"accountId":"<expense>","debit":"467500.00","credit":"0.00"},
                {"accountId":"<accounts:2101>","debit":"0.00","credit":"518925.00"},
                {"accountId":"<accounts: PPn Masukan 4104>","debit":"0.00","credit":"51425.00"} ] }
    ```
    (debit total 467,500.00 === credit total 518,925.00 is **not** balanced — the correct Dr side is the
    pre-tax expense and the tax is a separate payable, so the real pair is Dr Expense 467,500 + Dr PPN
    Masukan (input tax, a receivable) 51,425 = Cr AP 518,925.)
  - Correct: `lines: [ Dr expense 467500, Dr PPNMasukan 51425, Cr AP 518925 ]` → balanced.
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/bills/bills.service.ts:143-175` — add the PPN Masukan debit leg
    (`taxAmount`) so the entry balances, mirroring `sales-invoices.service.ts:168-170`; or route the write
    through `FinanceJournalService.createJournalEntry` so the balance and control-account checks actually
    apply.
  - `backend/src/modules/finance/bills/bills.service.ts:149` — replace the `if (apAcc && expenseAcc)` silent
    skip with a hard failure listing the missing codes, as the sales-invoice path does at `:154-159`.
  - `backend/src/modules/finance/bills/bills.service.ts:146-148` — resolve the expense account from an
    explicit `procurementCategory → accountCode` mapping, not from a regex over free text.
  - `backend/src/modules/finance/bills/bills.service.ts:158` — drop `as any`; use the enum.
  - **[Verification]** Posting a bill asserts
    `SUM(debit) === SUM(credit)` on the created `JournalEntry`; posting with a non-existent CoA code returns
    400 and leaves `postedAt` null.

---

### 📌 Module: [cash-in / cash-in]
#### [AR-09]: Cash-in falls back to a hand-rolled journal with hardcoded account ids `"default-cash"` / `"default-rev"`
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/cash-in/_hooks/useCashInOperations.ts:252-291`
  - Backend: `backend/src/modules/finance/services/finance-journal.service.ts:134-194`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: when the account heuristics at `:253-261` find nothing, the `else` branch posts
  `accountId: cashAcc?.id || "default-cash"` and `revAcc?.id || "default-rev"` (`:280,:285`). Those are
  **not UUIDs** — they are string literals. `CreateJournalDto` types them `@IsString()`, not `@IsUUID()`
  (`dto/create-journal.dto.ts:16`), so validation passes, and the request reaches
  `finance-journal.service.ts:161-165` where `account.findMany({where:{id:{in:['default-cash',...]}}})`
  returns **empty**. The loop at `:167-176` therefore finds no account and the manual-journal control-account
  block silently passes. The expense-attachment block at `:187-194` only trips if a matching account was
  found, which it was not. The insert at `:196-227` then attempts `JournalLine.accountId = 'default-cash'`
  against a `Uuid` column → **P2003 from Postgres**, surfaced to the user as the generic
  `toast.error(e?.response?.data?.message || "Gagal menyimpan kas masuk")` at `:300`, which will print
  nothing useful because the DB error is not a `{message}` shape.
  The same block in `cash-out` (`useCashOutOperations.ts:275-292`, `"default-exp"` / `"default-cash"`) has
  the identical defect. Also note the credit account chosen at `:260-261` is `type === "REVENUE"` — a cash
  **receipt** credited to a revenue account books every receipt as income, which is wrong for AR collection
  and for any non-revenue receipt.
- **Exact Contract Specification**:
  - `POST /finance/cash/receive` (the correct single path — the journal fallback should not exist):
    ```json
    { "date":"2026-09-08T00:00:00.000Z","cashAccountId":"<accounts.uuid>","category":"DP_PENJUALAN",
      "creditAccountId":"<accounts.uuid>","amount":1500000,"entityName":"PT X","notes":"DP order SO-1" }
    ```
    ```json
    { "success": true, "data": { "id":"<uuid>","journalEntryId":"<uuid>","date":"...","amount":"1500000.00" } }
    ```
- **Actionable Execution Plan**:
  - `frontend/.../cash-in/_hooks/useCashInOperations.ts:272-291` — delete the `else` branch entirely. If the
    account lookup yields no cash account, `throw new Error(...)` before the fetch so the user sees
    "Chart of accounts is not seeded", rather than posting a doomed request.
  - `frontend/.../cash-out/_hooks/useCashOutOperations.ts:274-293` — same.
  - `backend/src/modules/finance/dto/create-journal.dto.ts:14-16` — change `@IsString()` to `@IsUUID()` on
    `JournalLineDto.accountId` so this class of bug is rejected at the boundary for every caller.
  - `backend/src/modules/finance/services/finance-journal.service.ts:161-165` — if `accountIds.length !==
    accounts.length`, throw a `BadRequestException` naming the unresolved ids instead of continuing with a
    partial map.
  - **[Verification]** With an unseeded CoA, saving a cash-in receipt shows a clear error and creates nothing.
    With a seeded CoA, exactly one balanced journal entry is created and `bank_accounts.currentBalance`
    increments by the receipt amount.

---

### 📌 Module: [ap-payments / ap-aging]
#### [AR-10]: AP payment `verify` then `markPaid` can be executed twice by the same verifier; no idempotency on any money endpoint
- **Target Files**:
  - Backend: `backend/src/modules/finance/ap-payments/ap-payments.service.ts:100-136`, `:143-248`
  - Backend: `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:173-217`
  - Backend: `backend/src/platform/idempotency/` (present but not applied here)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `markPaid` guards re-entry with `if (payment.status === PaymentStatus.PAID) throw`
  (`:149-151`) — but the read at `:144` and the write at `:188` are inside no transaction boundary until
  `:187`, so two concurrent clicks both pass the guard and both execute the bank decrement, the bill
  increments, and the journal insert. The module ships an `IdempotencyInterceptor`
  (`backend/src/common/interceptors/idempotency.interceptor.ts`) that is not applied to any of these routes.
  SoD is also weaker than it looks: `verify` parses the creator out of a **free-text notes string** with a
  regex (`:108-109`) rather than a `createdBy` column — `APPayment` has no `createdBy` field
  (`schema.prisma`: only `verifiedBy String? @db.Uuid`), so any user who edits the notes, or a receipt whose
  notes were truncated, silently bypasses the two-person rule. `allocateToBill` (`:255-301`) is likewise not
  transactional against a concurrent second allocation: `existingTotal` is read at `:284-287` and the
  `billAllocation.create` at `:294` happens outside a transaction, so two simultaneous allocations can each
  pass the over-allocation check. `ar-receipts.allocateToInvoice` (`:196-216`) has a worse variant: it adds
  `receipt.amount` to the invoice's `paidAmount` **unconditionally**, so re-allocating the same receipt —
  or allocating one that was already linked at creation — double-counts the receipt against the invoice.
- **Exact Contract Specification**:
  - `POST /finance/ap-payments/:id/paid` with header `Idempotency-Key: <uuid>`:
    - first call → `200 { "success": true, "data": { "id":"<uuid>","status":"PAID" } }`
    - replay with the same key → `200` with the **first** response, no second journal entry, no second bank decrement.
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/ap-payments/ap-payments.controller.ts:57-64` — apply
    `@UseInterceptors(IdempotencyInterceptor)` to `markPaid` (and to the ar-receipt create/allocate routes).
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:100-136` — persist a real `createdBy`
    column on `APPayment` (schema change + migration) and use it for the SoD check instead of the notes
    regex; deprecate the notes markers.
  - `backend/src/modules/finance/ap-payments/ap-payments.service.ts:283-300` — wrap the read-check and the
    insert in `prisma.$transaction`.
  - `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:196-216` — skip the `paidAmount`
    increment when `receipt.invoiceId` already equals `dto.invoiceId`, and return a `BadRequestException`
    when re-allocating to a different invoice.
  - **[Verification]** Two concurrent `POST :id/paid` with the same `Idempotency-Key` yield one journal entry
    and one bank decrement. Re-POSTing `ar-receipts/:id/allocate` with the same `invoiceId` returns 400 and
    leaves `paidAmount` unchanged.

---

## LOW

### 📌 Module: [bills / sales-invoice-line-items, bill-line-items]
#### [AR-11]: Line-item PATCH sends `undefined` for untouched fields, and `rejectQty` can be wiped to 0
- **Target Files**:
  - Backend: `backend/src/modules/finance/bill-line-items/bill-line-items.service.ts:102-142`,
    `.../sales-invoice-line-items/sales-invoice-line-items.service.ts:88-105`
  - Database: `schema.prisma` — `BillLineItem.rejectQty Decimal @default(0)`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: both services pass `qty: dto.qty, price: dto.price, discount: dto.discount` straight
  into `update` (`bill-line-items.service.ts:120-122`, `sales-invoice-line-items.service.ts:97-99`).
  Prisma skips `undefined`, so a partial update is safe here. The hazard is the **complement**: a form that
  renders every field and sends `''` for a cleared input. `@IsNumber()` (`dto/bill-line-items.dto.ts:40`)
  rejects `''` at the DTO, so a `400` fires — but the user sees a generic message with no field pointer.
  The real defect is `bill-line-items.service.ts:123` — `rejectQty: dto.rejectQty` is included
  unconditionally, so any PATCH that omits it leaves the existing value (Prisma skips undefined) but a
  client that sends `rejectQty: 0` **silently wipes a QC rejection that the warehouse still holds the goods
  against**, and `recomputeBillTotals` at `:171-174` sums `discount` but ignores `rejectQty` entirely, so
  the bill total does not move even when a line is rejected.
  `sales-invoice-line-items.service.ts:126-140` recomputes the invoice total but, like its bill twin, has no
  tax-rate input and hardcodes `subtotal * 0.11` at `:134`; if the PPN rate ever changes, every recompute
  silently re-prices the document.
- **Exact Contract Specification**:
  - `PATCH /finance/bill-line-items/:id` → `{"qty": 4.5, "rejectQty": 0.5}` →
    `{"success":true,"data":{"id":"<uuid>","qty":"4.50","price":"85000.00","discount":"0.00",
    "rejectQty":"0.50","total":"382500.00","billId":"<uuid>"}}` and the bill `grandTotal` recomputed.
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/bill-line-items/bill-line-items.service.ts:165-181` — include
    `(qty - rejectQty) * price - discount` in the `total` recomputation, or document `rejectQty` as
    non-financial and stop writing it from the PATCH path.
  - `backend/src/modules/finance/bill-line-items/bill-line-items.service.ts:123` — send `rejectQty` only when
    explicitly provided, and reject a `rejectQty > qty` with a `BadRequestException`.
  - `backend/src/modules/finance/sales-invoice-line-items/sales-invoice-line-items.service.ts:134` and
    `bills/bills.service.ts:85` — read the PPN rate from a tax-rate record instead of the `0.11` literal
    (both sites) so a rate change cannot re-price posted history.
  - **[Verification]** PATCHing `rejectQty: 0.5` on a 5.0 qty line recomputes the bill total from 4.5 × price;
    PATCHing `rejectQty: 6` returns 400.

---

### 📌 Module: [bank-reconciliations / bank-reconciliation]
#### [AR-12]: `bookBalance` is computed as period net movement, not an opening-plus-movement balance
- **Target Files**:
  - Backend: `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts:84-105`
  - Database: `schema.prisma` — `BankReconciliation.bookBalance Decimal(18,2)`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `:91-104` sums deposits minus withdrawals **for the period only** and calls the
  result `bookBalance`. A bank's book balance at period end is *opening balance + period movement*; the
  opening balance is never read. For a period with no transactions the computed book balance is `0` and
  `difference` (`:105`) becomes the entire statement balance, so every month the reconciliation reports the
  full cash position as "outstanding variance". The same formula is used in the frontend
  (`useBankReconciliationOperations.ts:148`, `bookBalance = Number(selectedAccount?.currentBalance)` —
  which is the *current* balance, a third thing again).
  Additionally `finalize` (`:124-176`) marks every in-period transaction reconciled via `updateMany`
  (`:161-172`) **regardless of the computed `difference`** — a session that shows a 1,800,000 variance
  still "finalizes clean" and flips all rows to reconciled, destroying the very discrepancy the screen
  exists to surface. `reopen` (`:181-216`) un-reconciles *all* transactions in the period, including ones
  reconciled by an earlier, legitimate session, so reopening month N silently invalidates month N-1's work.
- **Exact Contract Specification**:
  - `POST /finance/bank-reconciliations` must compute:
    ```json
    { "bookBalance": "<BankAccount.currentBalance as of periodStart> + <period deposits> - <period withdrawals>",
      "difference": "<statementBalance - bookBalance>" }
    ```
  - `POST /finance/bank-reconciliations/:id/finalize` must reject when `Math.abs(difference) >= 1.00` with
    `400 { "error": { "code": "RECON_NOT_BALANCED", "message": "Selisih 1.800.000 harus dijelaskan sebelum finalisasi" } }`.
- **Actionable Execution Plan**:
  - `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts:84-105` — read the
    opening balance (sum of all transactions dated before `periodStart`, or the stored opening) and add it.
  - `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts:124-131` — add a
    `difference` tolerance check before `finalize`, requiring an explicit override reason when non-zero.
  - `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts:201-212` — scope
    `reopen`'s `updateMany` to transactions reconciled by *this* session (`reconciledBy: recon.reconciledBy`,
    plus the `reconciledAt` window) instead of every in-period row.
  - `frontend/.../useBankReconciliationOperations.ts:148` — stop deriving `bookBalance` client-side; take it
    from the created session's response.
  - **[Verification]** Reconcile a month with a 15,000,000 opening balance and no transactions →
    `bookBalance` 15,000,000, not 0. Finalizing a session with a non-zero difference returns 400.

---

### 📌 Module: [bayar-sample / bayar-sample]
#### [AR-13]: `bayar-sample` posts multipart to `/finance/verify-payment` with no `Content-Type` boundary guarantee and maps `unitPrice * qty` as a fallback total
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/finance/bayar-sample/_hooks/useBayarSampleOperations.ts:19-56`
  - Frontend (dead): `frontend/src/app/(dashboard)/finance/bayar-sample/page.tsx:58-96`
  - Backend: `backend/src/modules/finance/finance.controller.ts:76-83`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `useBayarSampleOperations.ts:39-42` sends a `FormData` with an explicit
  `Content-Type: "multipart/form-data"` header, which **omits the boundary**. Axios only auto-appends the
  boundary when it is allowed to derive the header itself; when the header is set manually the request body
  has no boundary token and Nest's multer interceptor cannot parse it → the body arrives as
  `{}` → `VerifyArPaymentDto` validation fails with an empty, unhelpful 400. The page's inline copy at
  `bayar-sample/page.tsx:78` has the same call. Both copies exist because of AR-05, so the bug is duplicated.
  Separately, the row mapper at `:29-31` computes
  `totalAmount: Number(s.totalAmount || s.unitPrice * s.qty)` and
  `remainingAmount: Number(s.remainingAmount || s.unitPrice * s.qty)`. When `remainingAmount` is absent
  the fallback re-derives it from the **gross** unit price, so a sample that is already partly paid shows
  its full amount as outstanding — the KPI `totalOutstanding` (`:65-66`) and the `awaitingPayment` count
  (`:69-70`) are both inflated. `Number()` on the raw value is also a `Decimal`-to-double conversion with no
  rounding, and `s.totalAmount` may arrive as a `Decimal` serialised to a string.
- **Exact Contract Specification**:
  - `POST /finance/verify-payment` (JSON, not multipart — there is no file field in the DTO):
    ```json
    { "type":"SAMPLE","id":"<uuid>","receivingAccountId":"<uuid>","actualAmount":1500000,
      "bankAdminFee":2500,"taxAmount":0,"notes":"Bukti transfer BCA 8812" }
    ```
    ```json
    { "success": true, "data": { "id":"<uuid>","isValidated":true,"validatedBy":"<uuid>" } }
    ```
- **Actionable Execution Plan**:
  - `frontend/.../bayar-sample/_hooks/useBayarSampleOperations.ts:39-42` — drop the manual
    `Content-Type` header so axios sets the boundary, **or** switch to the JSON body above if the endpoint
    does not accept files. Verify which against `finance.controller.ts:76-83` before editing.
  - `frontend/.../bayar-sample/_hooks/useBayarSampleOperations.ts:31` — remove the
    `s.unitPrice * s.qty` fallback for `remainingAmount`; render `—` when the field is absent rather than
    inventing a figure.
  - `frontend/.../bayar-sample/page.tsx:78` — same fix, or delete per AR-05.
  - **[Verification]** Uploading a proof file and confirming shows a success toast, the row leaves the
    outstanding list, and `totalOutstanding` decreases by exactly `remainingAmount`.

---

## Cross-cutting

- **Decimal handling is inconsistent across the whole cluster.** Services take and return `number`
  (`CreateArReceiptDto.amount: number` at `dto/create-ar-receipt.dto.ts:26-29`) while every model column is
  `Decimal(15,2)` / `Decimal(18,2)`. Arithmetic is done in JS doubles then written back through Prisma
  (`ar-receipts.service.ts:123`, `:142`; `ap-payments.service.ts:209,:232`; both line-item services'
  `recompute*Totals`). `ap-payments.service.ts:226` and `bank-transactions.service.ts:124` are the two places
  that get it right (`increment`/`decrement` operators); everything else does read-modify-write through a
  double. Standardise on Prisma `{ increment }` / `{ decrement }` for all balance fields, and round
  explicitly (`Math.round(x * 100) / 100`) before any sum. Pillar 6 ("strict type safety") is not met today:
  `ar-receipts.controller.ts:44,52,55` and every other controller use `@Req() req: any`.
- **No endpoint in the cluster paginates.** `findAll` in all nine services returns `findMany` with `orderBy`
  and no `take`/`skip`, and no service returns `page`/`pageSize`/`totalCount`/`totalPages`. The frontend
  compensates entirely client-side (`filteredOrders` / `filteredSamples` in
  `useArHubOperations.ts:164-183`, `filteredReconSessions` in `useBankReconciliationOperations.ts:294+`).
  There is therefore **no response-shape mismatch to fix** — but every list is unbounded, so
  `GET /finance/bills` and `GET /finance/invoices` (which include `so`, `lead`, `supplier`, `workOrder`) grow
  without limit. Add `?page`/`?pageSize` with a `{ data, meta }` envelope, or cap `findAll` with a `take`.
- **Error handling.** No service in the cluster returns the `{ success:false, message, errors }` shape the
  brief specifies — they throw bare Nest exceptions, and the frontend has no field-error path
  (`useCashInOperations.ts:300` and `useBankReconciliationOperations.ts:210,231,259` all read
  `err?.response?.data?.message` and fall back to a hardcoded Indonesian string, so a `P2003` prints
  "Gagal menyimpan kas masuk" with no cause). `verifyArHubPayment` catches nothing;
  `useApAgingOperations.ts:35` and `useArHubOperations.ts:113-115` and `:99-102` swallow errors with a bare
  `catch { return [] }` / `catch { return undefined }`, which converts every failure into "no data".
- **Auth surface.** The 9 entity controllers allow 5 roles including `HEAD_OPS`; the legacy
  `finance.controller.ts` handlers that the frontend actually calls allow only `SUPER_ADMIN, FINANCE`
  (e.g. `:85`, `:158`, `:164`, `:278`, `:284`). A `DIRECTOR` or `ADMIN` can see the bank-accounts and
  bank-transactions screens and will get 403 on most of the data behind them.
- **Dead-code note for the team:** `docs/ROUTE_MAP.md` §5 lists `cash-in`, `cash-out` and
  `bank-reconciliation` but not `piutang`, `ap-aging`, `ar-hub` or `bayar-sample`. Those four routes exist,
  are reachable from the UI (`piutang/page.tsx:678` links to `/finance/ar-hub`), and are unlisted.

---

## Per-module verdict

| Module / Route | Verdict | Blocking findings |
|---|---|---|
| `ar-receipts` | **Not production-usable** — journal FK to the wrong table; receipt creation with a bank account always rolls back | AR-01, AR-10 |
| `ap-payments` | **Not production-usable** — `markPaid` cannot succeed; unbalanced/decrement race | AR-02, AR-10 |
| `bills` | **Unsafe** — post writes an unbalanced journal and silently skips on missing accounts; live create DTO unvalidated | AR-08, AR-04 |
| `sales-invoices` | **Best in cluster** — post is balanced, fails loudly on missing accounts, and is transactionally sound | AR-04 (endpoint ownership) |
| `sales-invoice-line-items` | **Acceptable** — transactional recompute, posted-invoice guard; hardcoded PPN rate | AR-11 |
| `bill-line-items` | **Acceptable with caveat** — `rejectQty` not reflected in totals and wipeable | AR-11 |
| `bank-accounts` | **Acceptable** — no write path issues found; balance operator is correct | AR-07 (read side) |
| `bank-transactions` | **Acceptable** — validates GL linkage, uses the increment operator; no delete endpoint | AR-07 |
| `bank-reconciliations` | **Broken flow** — book balance formula wrong, finalize unblocks a non-zero variance, reopen over-reaches | AR-12, AR-06 |
| `cash-in` | **Broken on the fallback path** — hardcoded non-UUID account ids | AR-09, AR-05 |
| `cash-out` | **Broken on the fallback path** — same, plus no attachment sent against a mandatory-attachment check | AR-09, AR-05 |
| `piutang` | **Not shipping-ready** — 1043 lines, dead hook, `outstanding` read from an `outstandingAmount` field | AR-05, AR-04 |
| `ap-aging` | **Renders empty/zero** — snake_case keys the API never returns, silent `catch` fallback, `balance` vs `currentBalance` | AR-03, AR-07, AR-05 |
| `ar-hub` | **Acceptable core, bloated shell** — verify flow is correct and transactional; 706-line page with a dead twin hook | AR-05 |
| `bayar-sample` | **Likely 400 on submit** — multipart header without boundary, in two duplicated copies | AR-13, AR-05 |
| `bank-reconciliation` | **Finalize unreachable** — posts the create endpoint with an incompatible body; auto-match is a rubber stamp | AR-06, AR-12 |
