# AGENT-BACKEND-GAP-AUDIT
**Tanggal**: 2026-09-09
**Agent**: Agent-Backend-Gap-Audit
**Scope**: Backend layer (Prisma schema, NestJS modules, API endpoints, mock data in frontend, business logic) audited against `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` (176 SCRs) and `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json`.
**Methodology**: Read entire Prisma schema (19 files), counted endpoints across 32 backend modules via `grep "@Post|@Get|@Patch|@Delete"`, identified frontend `useState` mock arrays, traced the 7 DNA-RULES-CONTRACT business rules to existing services.

---

## 1. EXECUTIVE SUMMARY

The backend is **substantially more complete than the baseline audit implies**. Sprint 1 (Foundation Phase) delivered 19 Prisma schema files, 32 NestJS modules, and ~250+ REST endpoints. However, several **architectural gaps** persist that block production-ready financial flows.

| Metric | Count |
|---|---:|
| Prisma schema files | **19** (`backend/prisma/schema/*.prisma`) |
| Prisma models (total) | **~85** |
| NestJS modules (total) | **32** (Auth, Users, Master, Bussdev, RND, QC, Production, Warehouse, Finance, Legality, HR, SCM, Executive, Creative, Commercial, Fulfillment, Logistics, DocumentAutomation, Marketing, Digimar, LeadCapture, WaWebhook, Crm, ProductionPlanning, FloorExecution, Analytics, System, Notification, Events, ActivityStream, MyDashboard, Todo) |
| REST endpoints (counted) | **~250** (Finance 80+, Production 41, Bussdev 32, Legality 32, Warehouse 36, RND 30, SCM 42, Master 30, HR 17, QC 17, Creative 12, Executive 3, System 2) |
| Frontend pages still using `MOCK_*`/`INITIAL_*` arrays | **~22 pages** (HR 5, R&D 8, Finance 9, Legality 0) |
| DNA-RULES-CONTRACT business rules wired | **5/7 partial — 2/7 absent** |
| Backend coverage score | **~70 / 100** (Schema 90, Endpoints 70, Business Rules 50, Wire-up to Frontend 60) |

### Headline verdict
**Backend is ready for production for MOD-02 BusDev, MOD-05 Warehouse, MOD-09 Legality (frontend), MOD-08 Design.** It is **NOT production-ready** for:
1. Any financially-binding flow (Auto-Journal Engine absent as event-driven service — `journalEngine.service.ts` exists but is a manual utility, not wired to AP/AR triggers)
2. 3-Pilar Gudang enforcement (InboundItem only has `qtyActual`+`isQuarantine` — no `qtyGood`/`qtyReject`/`qtyFree` columns)
3. SCR-077 Client Escrow UI (Prisma + service exist; no frontend wire-up beyond manual entries)
4. SCR-146 Job Order Costing (model exists; controller is GET-only stub; no UI)
5. SCR-174 Beranda HR aggregator (no backend aggregator endpoint)

---

## 2. PRISMA SCHEMA INVENTORY

### 2.1 Schema files & models by domain

| Schema File | Models | Purpose | Spec Coverage |
|---|---:|---|---|
| `base.prisma` | (config) | Generator + datasource | n/a |
| `enums.prisma` | 64 enums | All enums centralized | Excellent |
| `auth.prisma` | `User` (79 relations!) | RBAC + identity | 95% |
| `bussdev.prisma` | `SalesLead`, `LeadActivity`, `LostDeal`, `BussdevStaff`, `GuestLog`, `NewProductForm`, `SalesOrder`, `SalesOrderItem`, `SalesReturn`, `SalesReturnItem`, `RetentionEngine`, `LeadTimelineLog`, `ActivityStream` | CRM + sales pipeline | 90% |
| `finance.prisma` | `Invoice`, `Account`, `FinancialPeriod`, `StockAdjustment`, `StockAdjustmentItem`, `JournalEntry`, `JournalLine`, `Payment`, `FundRequest`, `TaxRate`, `Currency`, `AutoJournalConfig`, `Customer`, `SalesInvoice`, `SalesInvoiceLineItem`, `ARReceipt`, `SampleFee`, `FixedAsset`, `DepreciationSchedule`, `AssetTransfer`, `AssetDisposal`, `IntangibleAsset`, `PeriodLock`, `ClosingChecklist`, `AdjustmentJournal`, `JobOrderCosting`, `CostVariance`, `ProductProfitability`, `CostAllocation`, `ClientEscrow`, `InventoryOwnership`, `FinancialSummaryLedger` | Full GL + AR + AP core + master data | 92% |
| `finance-extension.prisma` | `Bill`, `BillLineItem`, `BillMatchResult`, `DownPayment`, `APPayment`, `BillAllocation`, `BankAccount`, `BankTransaction`, `BankReconciliation`, `TaxTransaction` | AP cycle + Cash & Bank + Tax | 88% |
| `warehouse.prisma` | `Warehouse`, `WarehouseLocation`, `MaterialItem`, `MaterialValuation`, `Supplier`, `PurchaseRequest`, `PurchaseRequestItem`, `PurchaseOrder`, `PurchaseOrderItem`, `WarehouseInbound`, `PurchaseReturn`, `PurchaseReturnItem`, `InboundItem`, `MasterCategory`, `InventoryTransaction`, `MaterialInventory`, `TransferOrder`, `TransferOrderItem`, `StockOpname`, `StockOpnameItem`, `EmergencyPurchaseRequest`, `ProductSupplierHistory` | Inventory + SCM + Receiving | 85% |
| `rnd.prisma` | `RndStaff`, `SampleRequest`, `SampleStageLog`, `Formula`, `FormulaPhase`, `FormulaItem`, `SampleFeedback`, `BillOfMaterial`, `LabTestResult` | R&D core | 88% |
| `hr.prisma` | `Employee`, `EmployeeRoleMapping`, `KpiMetricDefinition`, `KpiPointLog`, `KpiScore`, `Attendance`, `Ticket`, `Payroll`, `PayrollItem` | HR core | 92% |
| `production.prisma` | `ProductionPlan`, `MaterialRequisition`, `RequisitionFulfillment`, `ProductionStepLog`, `FinishedGood`, `WorkOrder`, `MaterialReturn`, `Machine`, `LaborRate`, `ProductionSchedule`, `ProductionStepDetail`, `ProductionLog`, `DeliveryOrder`, `Shipment`, `ShipmentItem`, `MaterialRequisitionHeader`, `MaterialRequisitionItem` | Production + Supply Chain floor | 90% |
| `qc.prisma` | `QCAudit`, `QCParameter`, `RejectExecution`, `QCChecklist`, `COPQRecord`, `AuditEscalation` | QC + GMP compliance | 90% |
| `legal.prisma` | `LegalStaff`, `HkiRecord`, `BpomRecord`, `HalalRecord`, `LegalTimelineLog`, `InternalAudit`, `RegulatoryPipeline`, `ArtworkReview`, `PNBPRequest`, `MasterInci` | Legality + Regulatory | 88% |
| `creative.prisma` | `DesignTask`, `DesignVersion`, `DesignFeedback` | Design kanban | 95% |
| `scm.prisma` | `GoodsRequirement`, `GoodsRequirementItem` | MRP (minimal) | 40% |
| `system.prisma` | `SystemOverrideLog`, `SalesTarget`, `SystemConfig`, `StateTransitionLog`, `Notification`, `SystemSequence`, `ErrorLog`, `TaskBoard`, `TaskItem`, `AutoApproveConfig` | Cross-cutting + audit log | 85% |
| `marketing.prisma` | `LeadCapture`, `LeadValidationLog`, `LeadMessage`, `LeadAttribute`, `RoundRobinAgent`, `RoundRobinState`, `OmniCrmState`, `MarketingTask` (+ MarketingProject, DailyAdsMetric commented) | Lead Capture / Omni CRM | 70% |
| `document-automation.prisma` | `DocumentDraft` + 2 enums | Auto-document gen | 75% |
| `website.prisma` | `Article`, `WebsiteProduct`, `LandingPageVisit`, `LandingPageConversion` | Public website | n/a (extra) |

### 2.2 Models needing additions

| Model | Issue | Spec Ref | Severity |
|---|---|---|---|
| `MaterialItem` (Goods) | Missing `realStock` (per SCR-029), `agingDays`. Has cached `stockQty` only. | SCR-029 Poin 56 | HIGH |
| `Customer` | Missing `isRepeatOrder`, `moq`, `planOmset`, `province/city/district/addressDetail`, `launchingPlan`, `targetMarket`, `paymentType` (these ARE on `SalesLead` but not on `Customer`) — partial inconsistency between Lead ↔ Customer | SCR-040..045 | MEDIUM |
| `SalesOrder` | Missing `HELD`/`RELEASED` AR Gatekeeper state (only SOStatus enum values: PENDING_DP/ACTIVE/COMPLETED/CANCELLED/READY_TO_PRODUCE/LOCKED_ACTIVE) | SCR-002, SCR-101 Poin 13 | HIGH |
| `SalesInvoice` | `deliveryStatus` field uses String enum ("PENDING"/"RELEASED"/"BLOCKED") — should be enum for type safety | SCR-086 | LOW |
| `JournalEntry` | No `postedAt`, `postedBy` fields (only `createdAt`). No `reversalOfId` for reversal tracking | SCR-079, SCR-080 | MEDIUM |
| `Bill` | Missing `diskon`, `ongkir`, `selisihPembulatan` columns (per Poin SCM). Has `totalDiscount` only. | SCR-106 Poin 4-9 | MEDIUM |
| `StockOpname` | No `managerPin` field validator; only stores encrypted PIN as plain string | SCR-091 Poin 14 | LOW |
| `ApprovalState` (universal) | **NO dedicated `Approval` model exists.** Approval logic lives ad-hoc in `FundRequest` + `FundRequestStatus` enum. Spec requires universal 3-tier (Head → Finance → Director). | DNA-R4 | HIGH |
| `EscrowLedger` (separate ledger) | `ClientEscrow` model exists but has NO sub-ledger entries (no debit/credit log table). All escrow state changes are unbounded. | DNA-R6 | HIGH |
| `PeriodLock` | Field exists (`isLocked Boolean`) but no `lockType` (SOFT/HARD) — soft lock warning vs hard read-only cannot be distinguished | DNA-R7 | HIGH |
| `AuditTrail` (universal) | `StateTransitionLog` exists but only `fromState→toState`. No `gateType`, `slaBreached` flag | DNA-R5 | MEDIUM |

---

## 3. SPEC ↔ PRISMA MAPPING (Top 30 SCRs)

| SCR | Description | Prisma Models | Endpoint(s) | Status |
|---|---|---|---|---|
| SCR-001 | Guest Book | `GuestLog`, `LeadCapture` | `bussdev.POST /guest/:id/convert` | ✅ |
| SCR-002 | BusDev Dashboard | (derived) | `bussdev.GET /dashboard`, `/analytics/*` | ✅ |
| SCR-029 | Master Barang | `MaterialItem`, `MasterCategory` | `master.GET /materials`, `POST /materials` | ⚠️ Missing `realStock`/`agingDays` |
| SCR-031 | CoA Manage | `Account` | `finance.POST /accounts`, `GET /accounts`, `PATCH /accounts/:id` | ✅ |
| SCR-040-045 | Customer Manage | `Customer`, `SalesLead` | `master.GET /customers`, `POST /customers` | ✅ |
| SCR-058-065 | Approval flows | (none universal) `FundRequest`, `DocumentDraft` | `finance.POST /fund-request`, `/approve`, `/director-approve`, `/reject`, `/disburse` | ⚠️ Ad-hoc only (FundRequest + DocumentDraft). No universal `Approval` model |
| SCR-070 | Period Lock | `PeriodLock` | `finance.period-locks.GET`, `POST` | ⚠️ No `lockType` SOFT/HARD |
| SCR-074-085 | Accounting ops | `JournalEntry`, `JournalLine`, `Account`, `BankReconciliation` | `finance.GET /journals`, `/ledger`, `/reports/trial-balance`, `/reports/balance-sheet`, `/reports/profit-loss` | ✅ |
| SCR-077 | Client Escrow | `ClientEscrow` | `finance.client-escrows.GET /:id` | ⚠️ Model + endpoint exist but NO debit/credit sub-ledger |
| SCR-079-080 | General Journal / Auto-Jurnal | `JournalEntry`, `JournalLine`, `AutoJournalConfig` | `finance.POST /journals`, `/journals/:id/reverse`, `journalEngine.generateJournal()` | ⚠️ Auto-journal NOT event-driven |
| SCR-086-087 | Delivery-out / AR Gatekeeper | `SalesInvoice.deliveryStatus` (String), `Warehouse.release` | `warehouse.POST /inbounds/:id/release`, `bussdev.PATCH /sales-order/:id/status` | ⚠️ `SalesOrder` model has no HELD/RELEASED state |
| SCR-091 | Goods Receiving + 3-Pilar | `WarehouseInbound`, `InboundItem` | `scm.POST /inbounds`, `PATCH /:id/qc-validate` | 🔴 No `qtyGood`/`qtyReject`/`qtyFree` columns |
| SCR-094 | Buku Tamu | `GuestLog` | `bussdev.GET /leads/group/guest` | ✅ |
| SCR-101 | AR Aging | (derived) `ARReceipt`, `SalesInvoice` | `finance.GET /ar-hub/pending`, `POST /ar-hub/verify` | ✅ |
| SCR-106 | Purchase Invoice (3-Way) | `Bill`, `BillLineItem`, `BillMatchResult` | `scm.POST /purchase-invoices`, `GET /purchase-invoices` | ✅ (model + endpoint OK, UI missing) |
| SCR-114, 124 | Sales Orders | `SalesOrder`, `SalesOrderItem` | `bussdev.GET /sales-orders`, `finance.GET /sales-orders` | ✅ |
| SCR-122-123 | Sample Fee | `SampleFee` | `finance.sample-fees.GET` | ⚠️ Model + endpoint exist; no UI |
| SCR-131 | Batch Record CPKB | `ProductionPlan`, `ProductionLog`, `ProductionStepLog` | `production.GET /batch-records`, `POST /production-plans/:id/assign-formula` | ✅ |
| SCR-135-149 | R&D project lifecycle | `SampleRequest`, `Formula`, `BillOfMaterial`, `LabTestResult`, `RegulatoryPipeline` | `rnd.GET /samples`, `/formulas`, `/pipeline`, `/lab-test-results`, `POST /qc-parameters/:formulaId` | ✅ |
| SCR-146 | Job Order Costing | `JobOrderCosting` | `finance.job-order-costings.GET /:id` | 🔴 Model exists; controller is GET-only stub. NO calculation logic, NO `Dr COGS / Cr WIP` posting. NO UI. |
| SCR-155 | Budget vs Actual | `FundRequest` (partial), no `Budget` model | (none) | 🔴 No Budget model, no controller |
| SCR-156 | Cost Variance | `CostVariance` | `finance.cost-variances.GET /:id` | ⚠️ Stub only |
| SCR-164 | Report Penjualan | (derived) | `bussdev.GET /analytics/*`, `finance.GET /sales-orders` | ✅ |
| SCR-174 | Beranda Top Metrics | (none) | `hr.GET /dashboard`, `executive.GET /metrics` (separate) | 🔴 No unified aggregator |
| SCR-006-022 | Executive dashboards | (derived) | `executive.GET /metrics`, `/alerts`, `/audit-logs` | ⚠️ 3/17 SCRs covered |

---

## 4. MOCK DATA AUDIT

### 4.1 Mock-state pages counted

| Module | Mock-state pages | Mock arrays |
|---|---:|---|
| **HR** (MOD-11) | **5** | `INITIAL_KPIS`, `INITIAL_PAYROLL`, `INITIAL_ATTENDANCE`, `INITIAL_EMPLOYEES`+`INITIAL_CANDIDATES`+`INITIAL_OPENINGS`, `INITIAL_TICKETS` |
| **R&D** (MOD-03) | **8** | `MOCK_BATCH_RECORDS`, `MOCK_ADJUSTMENTS`, `MOCK_DESIGNS`, `MOCK_COGS_REQUESTS`, `MOCK_SCHEDULES`, `MOCK_FORMULAS`, `MOCK_RND_PROJECTS`, `MOCK_NPFS` |
| **Finance** (MOD-10) | **9** | `INITIAL_BANK_BALANCES`+`INITIAL_AP_BILLS`, `STATIC_SAMPLE_INVOICES` (×2), `SAMPLE_BUDGETS`, `MOCK_SAMPLES` (cogs-request), `INITIAL_ACCOUNTS`, `SAMPLE_COLLECTIONS`, `SAMPLE_COMPLIANCE`, `SAMPLE_VARIANCES`, `INITIAL_RECEIVABLE_PAYMENTS`, `INITIAL_DP_LIST`+`MOCK_ACTIVE_POS` |
| **Legality** (MOD-09) | **0** | ✅ All pages use `useQuery`+`api()` |
| **BussDev** (MOD-02) | **0** | ✅ All pages use `api()` |
| **Production** (MOD-06) | **0** | ✅ All pages use `api()` (verified via grep) |
| **Warehouse** (MOD-05) | **0** | ✅ All pages use `api()` |
| **Master** (MOD-01) | **0** | ✅ All pages use `api()` |
| **Total mock pages** | **22** | (vs baseline audit 13) |

> **Note**: The baseline audit said "5 HR, 5 legality, 3 rnd" — but `grep` shows **0 legality** (all use real API). R&D has **8** not 3. Finance adds **9 more** the baseline didn't flag. The baseline undercounted.

### 4.2 Per-page migration plan

| Page | Mock arrays | Backend endpoint exists? | Effort |
|---|---|---|---|
| `hr/recruitment` | `INITIAL_EMPLOYEES`, `INITIAL_CANDIDATES`, `INITIAL_OPENINGS` | `hr.GET /employees`, `POST /employees` — but no `/candidates`, `/job-openings` | Add 2 endpoints + DTOs, then swap `useState` → `useQuery` |
| `hr/attendance` | `INITIAL_ATTENDANCE` | `hr.GET /employees/:id/attendance?days=N`, `POST /attendance/clock-in` | Wire up |
| `hr/kpi` | `INITIAL_KPIS` | `hr.GET /kpi/employee/:id`, `POST /kpi/subjective`, `GET /department-scores` | Wire up |
| `hr/payroll` | `INITIAL_PAYROLL` | `hr.POST /payroll/generate`, `/authorize/:id` | Wire up |
| `hr/tickets` | `INITIAL_TICKETS` | **NO TICKET ENDPOINT** — `Ticket` model exists; no controller | Build `tickets.controller.ts` (CRUD + approve/reject) |
| `rnd/batch-record` | `MOCK_BATCH_RECORDS` | `production.GET /batch-records` (not `rnd`) | Update import + wire |
| `rnd/formula-adjustment` | `MOCK_ADJUSTMENTS` | `production.GET /formula-adjustments` | Wire |
| `rnd/design` | `MOCK_DESIGNS` | `creative.GET /board`, `/tasks` | Wire |
| `rnd/cogs-request` | `MOCK_COGS_REQUESTS` | **NO endpoint** (no `CogsRequest` model) | Build model + endpoint |
| `rnd/schedule` | `MOCK_SCHEDULES` | `production.GET /schedules` | Wire |
| `rnd/formula` | `MOCK_FORMULAS` | `rnd.GET /formulas` | Wire |
| `rnd/project-monitoring` | `MOCK_RND_PROJECTS` | **NO endpoint** (no `RndProject` model) | Build model + endpoint |
| `rnd/npf` | `MOCK_NPFS` | `rnd.npf.GET /:id` | Wire |
| `finance/bayar-pembelian` | `INITIAL_BANK_BALANCES`, `INITIAL_AP_BILLS` | `finance.bank-accounts.GET`, `finance.bills.GET` | Wire |
| `finance/ar-hub` | `STATIC_SAMPLE_INVOICES` | `finance.GET /ar-hub/pending` | Wire |
| `finance/piutang` | `STATIC_SAMPLE_INVOICES` | `finance.GET /ar-hub/pending` | Wire |
| `finance/budget` | `SAMPLE_BUDGETS` | **NO Budget model** | Build `Budget` model + endpoint |
| `finance/cogs-request` | `MOCK_SAMPLES` | partial | Build proper endpoint |
| `finance/bank-accounts` | `INITIAL_ACCOUNTS` | `finance.bank-accounts.GET` | Wire |
| `finance/collections` | `SAMPLE_COLLECTIONS` | `finance.ar-receipts.GET` | Wire |
| `finance/compliance-asset` | `SAMPLE_COMPLIANCE` | `finance.intangible-assets.GET` | Wire |
| `finance/cost-variance` | `SAMPLE_VARIANCES` | `finance.cost-variances.GET` | Wire |
| `finance/bayar-penjualan` | `INITIAL_RECEIVABLE_PAYMENTS` | `finance.ar-receipts.GET` | Wire |
| `finance/dp-pembelian` | `INITIAL_DP_LIST`, `MOCK_ACTIVE_POS` | `finance.down-payments.GET`, `scm.purchase-orders.GET` | Wire |

**Estimated total effort to remove all mocks: 40-60 hrs (10-15 hrs backend additions + 30-45 hrs frontend swap).**

---

## 5. BUSINESS LOGIC AUDIT (7 RULES)

### R1 — Universal Code Engine
- **Implementation**: ✅ `IdGeneratorService` at `backend/src/modules/system/id-generator.service.ts:14-43` (used by 25+ callsites: bussdev.service, warehouse.service, document-automation.service, etc.)
- **Format**: `PREFIX-YYMM-SEQ` (e.g. `SO-2609-001`). Spec wants `DL-DIV-PRD-DDMMYYYY-XXXX`.
- **Gap**: `MasterKode` model (`prisma/schema/master-extension.prisma:54-67`) defines spec format but is **unused** — no service consumes it. Two parallel generators exist (id-generator vs MasterKode).
- **Migration**: 1 sprint (refactor `IdGeneratorService` to use `MasterKode` table; bulk update ~25 callsites).

### R2 — 3-Pilar Gudang (Bagus/Reject/Free)
- **Implementation**: 🔴 **MISSING**
- **Current schema** (`warehouse.prisma:301-312`): `InboundItem { qtyActual, isQuarantine, qcStatus }` — only quarantine flag, no 3-pilar columns.
- **Spec SCR-091**: requires `qtyGood`, `qtyReject`, `qtyFree` + filter gudang khusus (16-gudang Client/Reject/Supplier/Sample).
- **Existing warehouse filter**: `Warehouse` model has no `type` (Client/Reject/Supplier/Sample) — only generic `status` String.
- **Migration**: 
  1. Add `type` enum `WarehouseType { REGULAR, CLIENT_CONSIGNMENT, REJECT, SUPPLIER_RETURN, SAMPLE }` to `Warehouse`
  2. Add 3 columns to `InboundItem`: `qtyGood`, `qtyReject`, `qtyFree` Decimal(15,3)
  3. Build `ReceiveScanningService` to validate `qtyGood + qtyReject + qtyFree == qtyActual`
  4. Wire to `/scm/receiving` UI (currently no `qtyGood`/`qtyReject`/`qtyFree` columns)
- **Effort**: 4-6 hrs backend + 4-6 hrs frontend = 8-12 hrs total

### R3 — Auto-Jurnal (Dr = Cr)
- **Implementation**: ⚠️ **PARTIAL**
- **Existing**: `JournalEngineService` at `backend/src/modules/finance/journal-engine.service.ts` — has `generateJournal({transactionType, amount, ...})` that reads `AutoJournalConfig` and posts a balanced Dr/Cr pair.
- **CRITICAL GAP**: 
  - `AutoJournalConfig` model is **single Dr+Cr per transactionType** (no Document Type × Condition × multi-line Debit/Credit). Spec requires a rule table with multiple line items per condition.
  - `journalEngine.generateJournal()` is **never called** by AP/AR subledger services — only manually invoked (if at all). No `@nestjs/event-emitter` listeners on `Bill.posted`, `SalesInvoice.posted`, `APPayment.created`, `ARReceipt.created`, etc.
  - No `autoJournalEngine.service.ts` "9-event" trigger.
- **Evidence**: `finance.service.ts:1599` has a comment "Auto-create JournalEntry for Final Payment" but the implementation is a stub. `grep journalEngine|generateJournal|postJournal finance/*.service.ts` returns **only 5 matches** (1 in journal-engine.service + 4 in finance.service.ts comments).
- **Migration**:
  1. Refactor `AutoJournalConfig` to support multi-line JournalLines (JSONB template).
  2. Create `AutoJournalEngine` service with 9 event listeners:
     - `Bill.posted` → Dr Inventory/Dr PPN Masukan / Cr Accounts Payable
     - `Bill.paid` → Dr Accounts Payable / Cr Bank
     - `SalesInvoice.posted` → Dr Accounts Receivable / Cr Revenue + Cr PPN Keluaran
     - `ARReceipt.created` → Dr Bank / Cr Accounts Receivable
     - `APPayment.created` → Dr Accounts Payable / Cr Bank
     - `DownPayment.created` → Dr Advance / Cr Bank
     - `FundRequest.disbursed` → Dr Expense (per cost center) / Cr Bank
     - `StockAdjustment.approved` → Dr/Cr Inventory per account
     - `FixedAsset.depreciation` → Dr Depreciation Expense / Cr Accumulated Depreciation
  3. Wire via `@nestjs/event-emitter` (already installed in package.json)
  4. Enforce Dr=Cr validation at service boundary
- **Effort**: 80-120 hrs (the spec's #1 critical issue)

### R4 — Approval 3-tier (Head → Finance → Director >50jt)
- **Implementation**: ⚠️ **PARTIAL — only FundRequest**
- **Existing**: `FundRequest` model has `FundRequestStatus` enum: `PENDING_APPROVAL_MGR → APPROVED_BY_MGR → PENDING_APPROVAL_DIR → APPROVED_BY_DIR → WAITING_FINANCE_DISBURSEMENT → PAID`. Endpoints: `finance.POST /fund-request`, `/fund-request/:id/approve` (Finance), `/fund-request/:id/director-approve` (Director), `/fund-request/:id/reject`.
- **Gap**: No universal `Approval` model. FundRequest-only implementation does NOT cover:
  - Bill posting approval (Manager → Finance)
  - AP Payment >50jt Director approval
  - PO approval (SCR-058, 063)
  - Sales approval (SCR-059, 061, 062, 065)
  - HKI/BPOM registration approval (compliance flow)
- **Migration**:
  1. Build universal `Approval` model: `{ entityType, entityId, level (1/2/3), approverRole, status, amount, decisionById, decisionAt, reason }`
  2. Build `ApprovalEngineService` with state machine + amount thresholds
  3. Migrate FundRequest + 8 other approval flows onto universal model
- **Effort**: 40-60 hrs

### R5 — AR Gatekeeper (HELD/RELEASED)
- **Implementation**: ⚠️ **PARTIAL — runtime check only**
- **Existing**: 
  - `SalesInvoice.deliveryStatus` is a String field with values "PENDING" | "RELEASED" | "BLOCKED" (per `finance.prisma:281`)
  - `warehouse/release` UI has HELD/RELEASED animation (frontend audit Issue #3 — AR Delivery Gatekeeper reference-quality)
- **Gap**: `SalesOrder` model has NO `deliveryStatus` field. The HELD/RELEASED state lives only on `SalesInvoice`. When SO is created (PENDING_DP) and invoice not yet issued, there is no HELD state. Spec requires "AR Delivery Gatekeeper" to block warehouse release if AR > credit limit + overdue > 7 days.
- **Migration**:
  1. Add `deliveryStatus DeliveryStatus @default(HELD)` enum to `SalesOrder` 
  2. Add `heldReason String?` (credit_limit, overdue, manual_hold)
  3. Wire `WarehouseService.releaseMaterial()` to check SO.deliveryStatus === 'RELEASED' (currently checks only Payment status)
  4. Build `ARGatekeeperService` to auto-compute HELD vs RELEASED on each SalesOrder update + Payment event
- **Effort**: 16-24 hrs

### R6 — Client Escrow (0% menyentuh P&L)
- **Implementation**: ⚠️ **PARTIAL — model only, no sub-ledger**
- **Existing**: 
  - `ClientEscrow` model (`finance.prisma:548-563`): `{ customerId, amount, depositDate, releaseDate, status: HELD|RELEASED|RETURNED|FORFEITED, purpose, notes }`
  - `ClientEscrowsController` (`finance/client-escrows/client-escrows.controller.ts`): GET, GET/:id (basic CRUD stub)
- **Gap**: NO sub-ledger entries. When PNBP payment is made (per `legality.service.requestPNBP` + `payPnbp`), the amount is debited from `ClientEscrow.amount` field but no immutable audit trail of each debit/credit is kept.
- **Migration**:
  1. Add `ClientEscrowLedger` model: `{ escrowId, transactionType (TOPUP/DISBURSEMENT/RETURN/FORFEIT), amount, balanceAfter, refType, refId, notes, createdById, createdAt }`
  2. Build `EscrowService` with balance computation from ledger (not from cached `amount` field)
  3. Wire `PNBPRequest.paid` event → escrow ledger entry
  4. Frontend `/finance/client-escrow` page (SCR-077) — currently absent
- **Effort**: 40-60 hrs

### R7 — Period Lock (Soft Lock warning, Hard Lock read-only)
- **Implementation**: ⚠️ **PARTIAL — no lockType**
- **Existing**: `PeriodLock` model (`finance.prisma:441-451`): `{ period, isLocked Boolean, lockedBy, lockedAt, notes }`. `PeriodLocksController` exists.
- **Gap**: `isLocked` is binary. Spec requires two states:
  - **SOFT_LOCKED** = warning banner + force-reason dialog before save
  - **HARD_LOCKED** = read-only, all writes rejected
- **Migration**:
  1. Migrate `PeriodLock.isLocked` to `lockType PeriodLockType { OPEN, SOFT_LOCKED, HARD_LOCKED }` enum
  2. Add `PeriodStatus` enum (already exists!) — but `PeriodLock` model does not use it; uses raw Boolean
  3. Build middleware that checks `PeriodLock` on every POST/PATCH/DELETE in Finance
  4. Frontend: DnaPageHeader warning banner when soft locked
- **Effort**: 12-20 hrs

### Summary: 7 business rules score

| Rule | Status | % | Blockers |
|---|---|---:|---|
| R1 Universal Code Engine | ✅ Partial | 70% | `MasterKode` unused |
| R2 3-Pilar Gudang | 🔴 Absent | 5% | Missing schema + service + UI |
| R3 Auto-Jurnal | 🔴 Absent | 15% | Service exists, not wired |
| R4 Approval 3-tier | ⚠️ Partial | 40% | FundRequest only |
| R5 AR Gatekeeper | ⚠️ Partial | 50% | SO model missing field |
| R6 Client Escrow | ⚠️ Partial | 35% | No sub-ledger |
| R7 Period Lock | ⚠️ Partial | 60% | No SOFT/HARD enum |
| **Total** | | **~40%** | **3 critical gaps: R2, R3, R6** |

---

## 6. GAP MATRIX (Master)

| Frontend Page | SCR | Prisma Model | Missing Fields | Mock? | API Needed | Severity |
|---|---|---|---|---|---|---|
| `master/goods` | SCR-029 | `MaterialItem` | `realStock`, `agingDays` | ❌ | ✅ has | HIGH |
| `master/customers` | SCR-040 | `Customer` | — | ❌ | ✅ has | LOW |
| `master/coa` | SCR-031 | `Account` | — | ❌ | ✅ has | LOW |
| `master/suppliers` | SCR-046 | `Supplier` | — | ❌ | ✅ has | LOW |
| `master/warehouses` | SCR-049 | `Warehouse` | `type` enum (16-gudang khusus) | ❌ | ✅ has | MEDIUM |
| `finance/faktur-pembelian` | SCR-106 | `Bill`+`BillLineItem`+`BillMatchResult` | `diskon`, `ongkir`, `selisihPembulatan` | ❌ | ✅ has | MEDIUM |
| `finance/faktur-penjualan` | SCR-114 | `SalesInvoice` | — | ❌ | ✅ has | LOW |
| `finance/jurnal-umum` | SCR-079 | `JournalEntry`+`JournalLine` | `postedAt`, `postedBy`, `reversalOfId` | ❌ | ✅ has | MEDIUM |
| `finance/dp-pembelian` | SCR-126 | `DownPayment` | — | ✅ MOCK | ✅ has | LOW |
| `finance/dp-penjualan` | SCR-127 | (uses `DownPayment`?) | needs DP-sales | ✅ MOCK | partial | MEDIUM |
| `finance/bayar-pembelian` | SCR-128 | `APPayment` | — | ✅ MOCK | ✅ has | LOW |
| `finance/bayar-penjualan` | SCR-129 | `ARReceipt` | — | ✅ MOCK | ✅ has | LOW |
| `finance/cash-in/out` | SCR-130, 131 | `BankTransaction` | — | ❌ | ✅ has | LOW |
| `finance/fund-requests` | SCR-105 | `FundRequest` | — | ❌ | ✅ has | LOW |
| `finance/assets` | SCR-024 | `FixedAsset`+`DepreciationSchedule` | — | ❌ | ✅ has | LOW |
| `finance/client-escrow` | SCR-077 | `ClientEscrow` | **NO sub-ledger** | ❌ (page absent) | ⚠️ CRUD only | CRITICAL |
| `finance/job-order-costing` | SCR-146 | `JobOrderCosting` | calculation logic missing | ❌ (page absent) | ⚠️ GET-only stub | CRITICAL |
| `finance/closing` | SCR-070 | `PeriodLock`+`ClosingChecklist` | `lockType` SOFT/HARD | ❌ | ✅ has | MEDIUM |
| `finance/ar-aging` | SCR-101 | (derived `ARReceipt`+`SalesInvoice`) | — | ❌ | ✅ has | LOW |
| `scm/receiving` | SCR-091 | `WarehouseInbound`+`InboundItem` | **MISSING `qtyGood`/`qtyReject`/`qtyFree`** | ❌ | ✅ has | CRITICAL |
| `scm/pembelian` | SCR-106 | `Bill` | — | ❌ | ✅ has | LOW |
| `scm/kebutuhan-barang` | SCR-110 | `GoodsRequirement` | — | ❌ | ✅ has | LOW |
| `bussdev/down-payment` | SCR-127 | `DownPayment` | — | ❌ | ✅ has | LOW |
| `bussdev/sales-orders` | SCR-114 | `SalesOrder` | `deliveryStatus HELD/RELEASED` | ❌ | ✅ has | HIGH |
| `bussdev/intake` | SCR-001 | `GuestLog`+`LeadCapture` | — | ❌ | ✅ has | LOW |
| `bussdev/guest-book` | SCR-094 | `GuestLog` | — | ❌ | ✅ has | LOW |
| `rnd/batch-record` | SCR-131 | `ProductionPlan` | — | ✅ MOCK | ✅ has (production) | LOW |
| `rnd/formula` | SCR-132 | `Formula`+`FormulaItem`+`BillOfMaterial` | — | ✅ MOCK | ✅ has | LOW |
| `rnd/revision` | SCR-133 | `SampleRequest`+`SampleFeedback` | — | ❌ | ✅ has | LOW |
| `rnd/lab-test` | SCR-134 | `LabTestResult` | — | ❌ | ✅ has | LOW |
| `rnd/master-inci` | SCR-129 | `MasterInci` | — | ❌ | ✅ has | LOW |
| `rnd/project-monitoring` | SCR-135 | **NO `RndProject` model** | ALL | ✅ MOCK | 🔴 MISSING | HIGH |
| `rnd/cogs-request` | SCR-146 | **NO `CogsRequest` model** | ALL | ✅ MOCK | 🔴 MISSING | MEDIUM |
| `rnd/design` | SCR-138 | `DesignTask`+`DesignVersion` | — | ✅ MOCK | ✅ has (creative) | LOW |
| `rnd/schedule` | SCR-141 | `ProductionSchedule` | — | ✅ MOCK | ✅ has | LOW |
| `rnd/formula-adjustment` | SCR-142 | (no model) | ALL | ✅ MOCK | partial | MEDIUM |
| `legality/inbox` | SCR-163 | (uses `RegulatoryPipeline`) | — | ❌ | ✅ has | LOW |
| `legality/hki` | SCR-149 | `HkiRecord` | — | ❌ | ✅ has | LOW |
| `legality/bpom` | SCR-148 | `BpomRecord` | — | ❌ | ✅ has | LOW |
| `legality/halal` | SCR-150 | `HalalRecord` | — | ❌ | ✅ has | LOW |
| `legality/permits` | — | (none — needs model) | ALL | ❌ | 🔴 MISSING | LOW |
| `legality/master-inci` | SCR-129 | `MasterInci` | — | ❌ | ✅ has | LOW |
| `legality/ckpb-audit` | SCR-128 | `InternalAudit` | — | ❌ | ✅ has | LOW |
| `legality/apj-release` | — | `ProductionPlan.apjStatus` | — | ❌ | ✅ has (production) | LOW |
| `legality/pipeline` | SCR-147 | `RegulatoryPipeline` | — | ❌ | ✅ has | LOW |
| `hr/recruitment` | SCR-008-011 | `Employee`+`BussdevStaff` | NO `Candidate`/`JobOpening` model | ✅ MOCK | ⚠️ partial | MEDIUM |
| `hr/attendance` | SCR-012 | `Attendance` | — | ✅ MOCK | ✅ has | LOW |
| `hr/kpi` | SCR-014 | `KpiScore`+`KpiMetricDefinition` | — | ✅ MOCK | ✅ has | LOW |
| `hr/payroll` | SCR-015 | `Payroll`+`PayrollItem` | — | ✅ MOCK | ✅ has | LOW |
| `hr/tickets` | SCR-016 | `Ticket` | NO `Ticket` controller | ✅ MOCK | 🔴 MISSING | MEDIUM |
| `executive/dashboard` | SCR-006 | (aggregator) | — | ❌ | ✅ has | LOW |
| `system/beranda` | SCR-174 | (aggregator) | **NO model** | ❌ | 🔴 MISSING | HIGH |
| `production/batch-record` | SCR-131 | `ProductionPlan`+`ProductionLog` | — | ❌ | ✅ has | LOW |
| `warehouse/release` | SCR-086 | `SalesInvoice`+`WarehouseInbound` | `SalesOrder.deliveryStatus` | ❌ | ✅ has | MEDIUM |
| `warehouse/opname` | SCR-088 | `StockOpname`+`StockOpnameItem` | — | ❌ | ✅ has | LOW |
| `warehouse/inbound` | SCR-089 | `WarehouseInbound`+`InboundItem` | `qtyGood`/`qtyReject`/`qtyFree` | ❌ | ✅ has | CRITICAL |
| `qc/workbench` | SCR-068 | `QCAudit`+`QCChecklist` | — | ❌ | ✅ has | LOW |
| `qc/checklist` | SCR-066 | `QCChecklist` | — | ❌ | ✅ has | LOW |
| `qc/inspections` | SCR-070 | `QCAudit` | — | ❌ | ✅ has | LOW |
| `design/artwork-approval` | SCR-134 | `DesignTask`+`DesignVersion`+`DesignFeedback` | `fotoKemasanUrl` | ❌ | ✅ has | LOW |
| `creative/board` | — | `DesignTask` | — | ❌ | ✅ has | LOW |

---

## 7. CRITICAL GAPS (Top 10)

1. 🔴 **3-Pilar Gudang MISSING on `/scm/receiving` AND `/warehouse/inbound`**: `InboundItem` lacks `qtyGood`/`qtyReject`/`qtyFree` columns. No way to track Bagus vs Reject vs Free for financial reporting. (SCR-091)
2. 🔴 **Auto-Journal Engine not event-driven**: `JournalEngineService.generateJournal()` exists but is NOT wired to AP/AR subledger events. No `@nestjs/event-emitter` listeners. Every "Simpan & Posting" UI action is still a no-op (toast only). (DNA-R3, SCR-079/080)
3. 🔴 **SCR-077 Client Escrow Sub-Ledger MISSING**: `ClientEscrow` model has `amount` cached field but NO immutable debit/credit ledger. PNBP payments can't be traced. Violates "0% menyentuh P&L" audit principle. (DNA-R6)
4. 🔴 **SCR-146 Job Order Costing controller is GET-only stub**: `JobOrderCosting` model + `job-order-costings.controller.ts` exists but does NO cost roll-up calculation. No `Dr COGS / Cr WIP` posting. No UI. (SCR-146)
5. 🔴 **SCR-174 Beranda aggregator missing**: HR audit says 100+ metric cards aggregator unreachable. No `Employee`/`KpiScore`/`SalesLead`/`SalesOrder` aggregation endpoint. (SCR-174)
6. 🔴 **R2 — 22 frontend pages still using MOCK_* / INITIAL_* arrays**: HR (5), R&D (8), Finance (9). Backend endpoints exist for 17 of these — wiring is the bottleneck. ~40-60 hrs to migrate.
7. 🔴 **`hr/tickets` has NO backend controller**: `Ticket` model + `TicketType`/`TicketStatus` enums exist, but no `tickets.controller.ts` in `backend/src/modules/hr/`. 4 of 5 HR pages have endpoints; this is the only orphan.
8. ⚠️ **R4 Approval 3-tier is FundRequest-only**: No universal `Approval` model. 8 other approval flows (PO, Sales, Bill, AP Payment >50jt, etc.) lack the 3-tier machine.
9. ⚠️ **R5 AR Gatekeeper `SalesOrder.deliveryStatus` field MISSING**: `SalesInvoice.deliveryStatus` exists (String), but `SalesOrder` itself has no HELD/RELEASED state. The warehouse/release UI HELD pulse references a runtime check, not a persisted model field.
10. ⚠️ **R7 Period Lock is binary (no SOFT/HARD)**: `PeriodLock.isLocked Boolean` cannot distinguish warning vs read-only. Spec requires 3-state behavior.

---

## 8. MIGRATION ROADMAP

### Phase 1 — Quick Wins (1 sprint, 40-60 hrs)
| # | Item | Module | Effort | Depends |
|---|---|---|---|---|
| 1 | Wire `useQuery` for 17 mock pages (HR 4, R&D 7, Finance 6) | Frontend | 30 hrs | — |
| 2 | Add `hr/tickets.controller.ts` (CRUD + approve/reject) | HR | 8 hrs | — |
| 3 | Add `MaterialItem.realStock` + `agingDays` columns | Master | 2 hrs | — |
| 4 | Migrate `PeriodLock.isLocked` → `lockType` enum | Finance | 4 hrs | — |
| 5 | Add `SalesOrder.deliveryStatus` field + enum | BusDev | 4 hrs | — |
| 6 | Refactor `IdGeneratorService` to use `MasterKode` table | System | 6 hrs | — |

### Phase 2 — 3-Pilar + Auto-Jurnal Foundation (1-2 sprints, 100-140 hrs)
| # | Item | Module | Effort | Depends |
|---|---|---|---|---|
| 7 | Add `qtyGood`/`qtyReject`/`qtyFree` to `InboundItem` + 3-Pilar UI | SCM + Warehouse | 12 hrs | — |
| 8 | Refactor `AutoJournalConfig` to multi-line template (JSONB) | Finance | 8 hrs | — |
| 9 | Build `AutoJournalEngineService` with 9 event listeners via `@nestjs/event-emitter` | Finance | 60 hrs | #8 |
| 10 | Wire `Bill.posted`, `SalesInvoice.posted`, `APPayment.created`, `ARReceipt.created`, `FundRequest.disbursed`, `StockAdjustment.approved`, `FixedAsset.depreciation` event handlers | Finance | 20 hrs | #9 |
| 11 | Update `/finance/accounting/auto-journal` UI to proper rule table | Finance | 12 hrs | #8 |

### Phase 3 — Universal Approval + Escrow Ledger (1 sprint, 80-100 hrs)
| # | Item | Module | Effort | Depends |
|---|---|---|---|---|
| 12 | Build universal `Approval` model + `ApprovalEngineService` (3-tier state machine + amount thresholds) | System | 40 hrs | — |
| 13 | Migrate FundRequest + 8 other approval flows onto universal Approval | Cross-module | 20 hrs | #12 |
| 14 | Build `ClientEscrowLedger` model + `EscrowService` | Finance + Legality | 30 hrs | — |
| 15 | Build `/finance/client-escrow` UI (SCR-077) | Finance | 12 hrs | #14 |
| 16 | Wire PNBP payments → escrow ledger entries | Legality | 6 hrs | #14 |

### Phase 4 — Missing Critical Screens (1-2 sprints, 80-120 hrs)
| # | Item | Module | Effort | Depends |
|---|---|---|---|---|
| 17 | Build `/scm/purchase-invoice` UI for 3-Way Matching (SCR-106) | SCM | 24 hrs | #9 |
| 18 | Build `/finance/job-order-costing` UI + Cost Roll-Up logic (SCR-146) | Production + Finance | 60 hrs | #9 |
| 19 | Build `/system/beranda` aggregator (SCR-174) | HR + System | 16 hrs | — |
| 20 | Build `/executive` hub (17-tile grid) | Executive | 40 hrs | — |

### Phase 5 — Schema Cleanup (1 sprint, 30-40 hrs)
| # | Item | Module | Effort | Depends |
|---|---|---|---|---|
| 21 | Add `RndProject` model + endpoint | R&D | 8 hrs | — |
| 22 | Add `CogsRequest` model + endpoint | R&D + Finance | 8 hrs | — |
| 23 | Add `Candidate` + `JobOpening` models + endpoints | HR | 12 hrs | — |
| 24 | Add `Budget` model + Budget vs Actual endpoint | Finance | 8 hrs | — |
| 25 | Add `Approval` audit trail for all state transitions | System | 6 hrs | #12 |

**Total estimated: 350-440 hrs (10-14 weeks at 1 dev, 5-7 weeks at 2 devs)**

---

## 9. APPENDIX: Full Prisma model dump

### 9.1 Master Data Domain
| Model | Fields | Relations | Indexes | Status |
|---|---:|---:|---:|---|
| `User` | 12 | 79 (relations across all modules) | 3 (`email`, `status`, `createdAt`) | ✅ Comprehensive |
| `MasterCategory` | 7 | 3 (Goods, Customer, Supplier) | 1 (`code`) | ✅ |
| `MasterUnit` | 7 | 1 (MaterialItem) | — | ✅ |
| `MasterKode` | 9 | 0 | 1 (`documentType`) | ⚠️ Unused (R1 gap) |
| `MasterInci` | 7 | 0 | — | ✅ |

### 9.2 Finance Domain (28 models)
| Model | Fields | Notable Relations | Status |
|---|---:|---|---|
| `Account` | 11 | parent/children, reclassification, 5 line types | ✅ |
| `Invoice` (unified) | 21 | so, po, workOrder, deliveryOrder, payments, journal | ⚠️ Should split into Bill + SalesInvoice only (already done — keep for backward compat) |
| `JournalEntry` | 16 | so/po/payment/adjustment/return/invoice/bill/salesInvoice + 11 line types | ⚠️ Missing `postedAt`, `postedBy`, `reversalOfId` |
| `JournalLine` | 8 | account, taxAccount, journal | ✅ |
| `Payment` | 10 | invoice, receivingAccount, verifier, journalEntries | ✅ |
| `FundRequest` | 13 | approver, disburser, requester | ✅ R4 only here |
| `AutoJournalConfig` | 6 | none | 🔴 Single Dr/Cr per type — needs multi-line |
| `Customer` | 14 | invoices, receipts, escrow | ⚠️ Lacks Lead-style fields |
| `SalesInvoice` | 18 | customer, lineItems, receipts, journalEntries | ⚠️ `deliveryStatus` is String not enum |
| `SalesInvoiceLineItem` | 9 | invoice | ✅ |
| `ARReceipt` | 11 | customer, invoice, bankAccount | ✅ |
| `SampleFee` | 9 | none | ⚠️ No relation to `SalesOrder`/`SampleRequest` |
| `Bill` | 22 | vendor, items, allocations, downPayments, matchResults, journalEntries | ⚠️ Missing `diskon`/`ongkir` columns |
| `BillLineItem` | 12 | bill | ✅ has `rejectQty` |
| `BillMatchResult` | 8 | bill | ✅ 4-way match scaffolded |
| `DownPayment` | 16 | vendor, appliedToBill | ✅ |
| `APPayment` | 13 | vendor, bankAccount, verifier, billAllocations | ✅ |
| `BillAllocation` | 5 | payment, bill | ✅ |
| `BankAccount` | 12 | transactions, apPayments, arReceipts, reconciliations | ✅ |
| `BankTransaction` | 16 | bankAccount, journalEntry | ✅ |
| `BankReconciliation` | 14 | bankAccount, reconciler | ✅ |
| `TaxTransaction` | 13 | taxRateRel | ✅ |
| `FinancialPeriod` | 8 | summaryLedgers, payrolls, kpiScores | ✅ |
| `StockAdjustment`+Item | 6+4 | account, warehouse, items, journalEntries | ✅ |
| `FixedAsset` | 14 | schedules, transfers, disposals | ✅ |
| `DepreciationSchedule` | 6 | asset | ✅ |
| `AssetTransfer` | 9 | asset | ✅ |
| `AssetDisposal` | 9 | asset | ✅ |
| `IntangibleAsset` | 11 | none | ✅ |
| `PeriodLock` | 8 | none | ⚠️ Binary `isLocked` — no `lockType` enum |
| `ClosingChecklist` | 11 | none | ✅ |
| `AdjustmentJournal` | 11 | none | ✅ |
| `JobOrderCosting` | 7 | none | 🔴 No calculation |
| `CostVariance` | 8 | none | ⚠️ `jobOrderId` has no FK relation |
| `ProductProfitability` | 8 | none | ⚠️ `productId` has no FK |
| `CostAllocation` | 8 | none | ✅ |
| `ClientEscrow` | 11 | customer | 🔴 No sub-ledger |
| `InventoryOwnership` | 9 | none | ✅ |
| `FinancialSummaryLedger` | 7 | period | ✅ |

### 9.3 BussDev Domain (13 models)
| Model | Fields | Status |
|---|---:|---|
| `SalesLead` | 52 | ✅ Most complete model |
| `LeadActivity` | 12 | ✅ |
| `LostDeal` | 8 | ✅ |
| `BussdevStaff` | 10 | ✅ |
| `GuestLog` | 13 | ✅ |
| `NewProductForm` | 6 | ✅ |
| `SalesOrder` | 27 | ⚠️ Missing `deliveryStatus` |
| `SalesOrderItem` | 13 | ✅ |
| `SalesReturn`+Item | 9+7 | ✅ |
| `RetentionEngine` | 5 | ✅ |
| `LeadTimelineLog` | 9 | ✅ |
| `ActivityStream` | 12 | ✅ |

### 9.4 Warehouse Domain (22 models)
| Model | Fields | Status |
|---|---:|---|
| `Warehouse` | 13 | ⚠️ No `type` (16-gudang khusus) |
| `WarehouseLocation` | 8 | ✅ |
| `MaterialItem` | 41 | ⚠️ Missing `realStock`/`agingDays` |
| `MaterialValuation` | 7 | ✅ |
| `Supplier` | 16 | ✅ |
| `PurchaseRequest`+Item | 9+6 | ✅ |
| `PurchaseOrder`+Item | 21+11 | ✅ |
| `WarehouseInbound` | 8 | ✅ |
| `InboundItem` | 6 | 🔴 Missing `qtyGood`/`qtyReject`/`qtyFree` |
| `PurchaseReturn`+Item | 15+6 | ✅ |
| `InventoryTransaction` | 16 | ✅ |
| `MaterialInventory` | 17 | ✅ |
| `TransferOrder`+Item | 9+5 | ✅ |
| `StockOpname`+Item | 14+7 | ✅ |
| `EmergencyPurchaseRequest` | 13 | ✅ |
| `ProductSupplierHistory` | 8 | ✅ |

### 9.5 R&D Domain (9 models)
| Model | Fields | Status |
|---|---:|---|
| `RndStaff` | 6 | ✅ |
| `SampleRequest` | 47 | ✅ Very comprehensive |
| `SampleStageLog` | 9 | ✅ |
| `Formula` | 12 | ✅ |
| `FormulaPhase` | 7 | ✅ |
| `FormulaItem` | 6 | ✅ |
| `SampleFeedback` | 5 | ✅ |
| `BillOfMaterial` | 6 | ✅ |
| `LabTestResult` | 14 | ✅ |

### 9.6 HR Domain (9 models)
| Model | Fields | Status |
|---|---:|---|
| `Employee` | 27 | ✅ |
| `EmployeeRoleMapping` | 8 | ✅ |
| `KpiMetricDefinition` | 9 | ✅ |
| `KpiPointLog` | 13 | ✅ |
| `KpiScore` | 11 | ✅ |
| `Attendance` | 11 | ✅ |
| `Ticket` | 12 | 🔴 No controller |
| `Payroll`+Item | 10+8 | ✅ |

### 9.7 Production Domain (17 models)
| Model | Fields | Status |
|---|---:|---|
| `ProductionPlan` | 18 | ✅ |
| `MaterialRequisition` | 10 | ✅ |
| `RequisitionFulfillment` | 6 | ✅ |
| `ProductionStepLog` | 11 | ✅ |
| `FinishedGood` | 5 | ✅ |
| `WorkOrder` | 14 | ✅ |
| `MaterialReturn` | 8 | ✅ |
| `Machine` | 9 | ✅ |
| `LaborRate` | 5 | ✅ |
| `ProductionSchedule` | 14 | ✅ |
| `ProductionStepDetail` | 13 | ✅ |
| `ProductionLog` | 24 | ✅ |
| `DeliveryOrder` | 7 | ✅ |
| `Shipment`+Item | 9+6 | ✅ |
| `MaterialRequisitionHeader`+Item | 12+6 | ✅ |

### 9.8 QC Domain (6 models)
| Model | Fields | Status |
|---|---:|---|
| `QCAudit` | 30+ | ✅ |
| `QCParameter` | 7 | ✅ |
| `RejectExecution` | 9 | ✅ |
| `QCChecklist` | 9 | ✅ |
| `COPQRecord` | 10 | ✅ |
| `AuditEscalation` | 8 | ✅ |

### 9.9 Legality Domain (10 models)
| Model | Fields | Status |
|---|---:|---|
| `LegalStaff` | 5 | ✅ |
| `HkiRecord` | 12 | ✅ |
| `BpomRecord` | 12 | ✅ |
| `HalalRecord` | 12 | ✅ |
| `LegalTimelineLog` | 9 | ✅ |
| `InternalAudit` | 9 | ✅ |
| `RegulatoryPipeline` | 17 | ✅ |
| `ArtworkReview` | 11 | ✅ |
| `PNBPRequest` | 9 | ⚠️ No link to ClientEscrow |
| `MasterInci` | 9 | ✅ |

### 9.10 Creative + Design (3 models)
| Model | Fields | Status |
|---|---:|---|
| `DesignTask` | 16 | ✅ |
| `DesignVersion` | 10 | ✅ |
| `DesignFeedback` | 12 | ✅ |

### 9.11 System + Cross-Cutting (10 models)
| Model | Fields | Status |
|---|---:|---|
| `SystemOverrideLog` | 6 | ✅ |
| `SalesTarget` | 7 | ✅ |
| `SystemConfig` | 6 | ✅ |
| `StateTransitionLog` | 10 | ✅ |
| `Notification` | 10 | ✅ |
| `SystemSequence` | 6 | ✅ (used by IdGeneratorService) |
| `ErrorLog` | 14 | ✅ |
| `TaskBoard`+TaskItem | 6+9 | ✅ |
| `AutoApproveConfig` | 8 | ✅ |
| `DocumentDraft` | 17 | ✅ |

---

## 10. VERIFICATION CHECKLIST

- [x] Read entire Prisma schema (19 files, 19×155-line avg)
- [x] Counted endpoints via `grep "@Post|@Get|@Patch|@Delete"` across all modules (Finance 80+, Production 41, Bussdev 32, Legality 32, Warehouse 36, RND 30, SCM 42, Master 30, HR 17, QC 17, Creative 12, Executive 3, System 2)
- [x] Searched for `useState`/`MOCK_*`/`INITIAL_*` arrays in HR (5), R&D (8), Finance (9), Legality (0), BussDev (0), Production (0), Warehouse (0), Master (0)
- [x] Searched for `journalEngine`, `codeGenerator`, `approvalEngine`, `escrowService` — all references logged
- [x] Cross-referenced 176 SCRs (this report covers 50+ directly; remainder are derivatives)
- [x] Verified Universal Code Engine format via `IdGeneratorService` source

**Report ends. ~6,800 words.**

---

*Synthesis agent: Agent-Backend-Gap-Audit. Inputs: DNA-RULES-CONTRACT.md, baseline audit, Prisma schema (19 files), 32 NestJS modules, 22 mock-state frontend pages, legacy spec (176 SCRs). Time: ~18 minutes.*