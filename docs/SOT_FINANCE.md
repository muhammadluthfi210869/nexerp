# SOURCE OF TRUTH (SoT): FINANCE & ACCOUNTING DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: The Economic Brain — Double-Entry Accounting, 3 Gates Keeper, and Compliance Guardian.

---

## 1. BUSINESS PROCESS FLOW (THE FINANCIAL CYCLE)

| Phase | System Action | Trigger Event | Mandatory Output |
|:---|:---|:---|:---|
| **P-1: AR Hub** | Verify Payment | Transfer client (Sample/DP/Lunas) | `JournalEntry` (Kas↑, AR↓, Unearned↓) |
| **P-2: AP Hub** | Disburse Fund | Supplier bill / Internal fund request | `JournalEntry` (Kas↓, AP↓) |
| **P-3: General Ledger** | Journal Post | Input manual (OPEX/Adjustment) | `JournalLine` (Balanced Dr/Cr) |
| **P-4: Costing** | HPP Snap | QC Release / Mixing Done | `COGS Adjustment` (auto) |
| **P-5: Period Closing** | Report Gen | End of period | BalanceSheet, P&L, CashFlow |
| **P-6: Fund Request** | Approve & Disburse | Internal fund request (OPEX) | `FundRequest.status = PAID` |
| **P-7: PNBP** | Bayar PNBP | Legal inisiasi BPOM/HKI | `PNBPRequest.isPaid = true` |

---

## 2. THE 3 FINANCIAL HARD GATES

| Gate | Name | Trigger | From → To | Impact |
|:---|:---|---:|:---:|---:|
| **G1** | Sample Gate | Client pays sample fee | `WAITING_FINANCE` → `QUEUE` | R&D unlock |
| **G2** | Production Gate | Client pays DP ≥ 50% | `SPK_SIGNED` → `LOCKED_ACTIVE` | Legal/SCM/Creative/WH unlock |
| **G3** | Delivery Gate | Client pays remaining | `READY_TO_SHIP` → `WON_DEAL` | WH DO unlock |

### Audit Logic:
- G1: `paymentApprovedAt` + `verifiedBy` terisi permanent
- G2: `SO.status = LOCKED_ACTIVE` → trigger 5 modul paralel
- G3: `Invoice.status = PAID` → trigger DO & Shipment

---

## 3. BACKEND API ENDPOINTS

### Finance Module (`/finance`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/finance` | Dashboard | Financial overview |
| POST | `/finance/payment/verify` | `verifyPayment()` | Verify payment (G1/G2/G3) |
| GET | `/finance/ar-hub` | `getArHub()` | Accounts Receivable with aging |
| POST | `/finance/ap-hub` | `createApDisbursement()` | AP disbursement |
| POST | `/finance/journal` | `createJournalEntry()` | Create journal entry |
| GET | `/finance/journal` | `getJournalEntries()` | List journal entries |
| GET | `/finance/trial-balance` | `getTrialBalance()` | Trial balance report |
| GET | `/finance/profit-loss` | `getProfitLoss()` | P&L statement |
| GET | `/finance/balance-sheet` | `getBalanceSheet()` | Balance sheet |
| POST | `/finance/fund-request` | `createFundRequest()` | Create fund request |
| PATCH | `/finance/fund-request/:id` | `approveFundRequest()` | Approve/reject fund request |
| POST | `/finance/pnbp/pay` | `payPnbp()` | Pay PNBP for Legal |
| POST | `/finance/adjustment-journal` | `createInventoryAdjustmentJournal()` | Auto journal from warehouse |

---

## 4. CORE MODELS & MASTER DATA

### 4.1. CHART OF ACCOUNTS (COA)
- **Model**: `Account` — tree structure dengan parent-child
- **Fields**: `code`, `name`, `type` (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE), `normalBalance` (DEBIT/CREDIT), `reportGroup`, `isActive`

### 4.2. TAX RATES
- **Model**: `TaxRate` — `name` (PPN 11%, PPH 23), `rate`, `isActive`
- **Link**: SalesOrder, PurchaseOrder

### 4.3. CURRENCIES
- **Model**: `Currency` — `code` (IDR/USD), `symbol`, `exchangeRate`, `isMain`

### 4.4. FINANCIAL PERIOD
- **Model**: `FinancialPeriod` — `name` (Jan 2026), `startDate`, `endDate`, `status` (OPEN/SOFT_LOCKED/CLOSED)

---

## 5. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger |
|------------|------------|---------|
| `activity.logged` | All mutation endpoints | Generic audit trail |

---

## 6. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **BD**: `SalesOrder` + payment proof
2. **SCM**: `PurchaseOrder` + supplier invoice
3. **PRODUCTION**: Actual COGS (from BOM × moving avg price)
4. **HR**: Payroll summary (encrypted net salary)
5. **ALL DIVISIONS**: `FundRequest` untuk OPEX
6. **LEGAL**: `PNBPRequest` — untuk bayar PNBP

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **ALL DIVISIONS**: Payment verification (G1/G2/G3) — operational gates
2. **LEGAL**: `PNBPRequest.isPaid` — unlock BPOM submission
3. **MANAGEMENT**: Financial dashboard — strategic decisions
4. **HR**: Payroll disbursement
5. **WAREHOUSE**: Stock adjustment journal entries + Manager PIN verification

---

## 7. DASHBOARD KPIs

| KPI | Formula |
|:---|---:|
| Cash In (MTD) | Sum of verified payments this month |
| AR Aging | Invoice.amountDue - Payment.amountPaid, grouped by days |
| Achievement Rate | Paid revenue / Monthly target |
| Expense Ratio | Total OPEX / Total Revenue |
| Net Profit Margin | (Revenue - COGS - OPEX) / Revenue |
| Working Capital | Current Assets - Current Liabilities |

---

## 8. AUDIT & COMPLIANCE
1. **Imbalance Alert**: Blokir Closing Period jika Trial Balance ≠ 0
2. **Override Log**: Setiap reversal jurnal wajib alasan — tidak hapus data lama
3. **Tax Integrity**: PPN/PPH dipisahkan ke akun penampungan auto saat Invoice/Bill
4. **Period Lock**: Period CLOSED tidak bisa diubah — butuh SUPER_ADMIN override

---

## 9. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (finance) | `backend/prisma/schema/finance.prisma` |
| Finance service | `backend/src/modules/finance/finance.service.ts` |
| Finance controller | `backend/src/modules/finance/finance.controller.ts` |
| Finance module | `backend/src/modules/finance/finance.module.ts` |
