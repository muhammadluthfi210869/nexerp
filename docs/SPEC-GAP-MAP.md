# 📋 SPEC-GAP MAP — Single Source of Truth

**Tanggal**: 2026-09-09
**Versi**: 1.0
**Status**: 🔒 **BINDING CONTRACT** antara Stream A (Visual DNA + Frontend) dan Stream B (Backend)
**Working Directory**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO`

---

## 0. PURPOSE

Dokumen ini adalah **kontrak pengerjaan** untuk seluruh pekerjaan implementasi NEX ERP.
- Stream A (Visual DNA + Frontend) **WAJIB** memenuhi Section 10 (Stream A Backlog).
- Stream B (Backend) **WAJIB** memenuhi Section 11 (Stream B Backlog).
- Keduanya harus menghormati Section 9 (Business Rules) dan `docs/DNA-RULES-CONTRACT.md`.

**Source of Truth**:
- `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` — spec untuk 178 fitur/layar
- `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` — 176 SCR machine-readable
- `VISUAL_DNA.md` — design contract 5-layer
- `docs/DNA-RULES-CONTRACT.md` — coding contract

**Source Audits**:
- `docs/_AUDIT_FIELDS_2026-09-09.md` — per-field gap matrix
- `docs/_AUDIT_RULES_2026-09-09.md` — 52 cross-field business rules
- `docs/_AUDIT_BACKEND_2026-09-09.md` — Prisma schema + API gaps
- `docs/_AUDIT_DRIFT_2026-09-09.md` — ghost routes + duplicates + hardcoded values (REFERENCED BUT NOT IN REPO — drift numbers below reconciled against `docs/_AUDIT_FULL_REPORT_2026-09-09.md` which is the canonical source)

**Last verified**: 2026-09-12 (post-audit reconciliation against `_AUDIT_FULL_REPORT_2026-09-09.md`)

---

## 1. EXECUTIVE SCORECARD

| Dimensi | Score | Baseline | Target | Sprint |
|---|---:|---:|---:|---|
| Legacy ERP Spec Coverage | **62/100** | 62 | 90+ | S5 |
| DNA Component Adoption | **88.6%** | 88.6 | 96%+ | S3 |
| Hardcoded UI Purity | **26%** (74% have raw HTML) | 26 | 96%+ | S3 |
| Visual DNA 5-Layer Compliance | **51%** | 51 | 90%+ | S2 |
| Sidebar Legacy Coverage | **13%** (23/176 SCRs) | 13 | 60%+ | S4 |
| Business Rules Coverage | **23%** (12/52) | 23 | 80%+ | S1-S2 |
| Backend Service Completeness | **70/100** | 70 | 90+ | S1-S3 |
| **OVERALL** | **62/100** | 62 | **90+** | **S1-S5** |

---

## 2. SCOPE & METHODOLOGY

### 2.1 Coverage
| Aset | Jumlah |
|---|---:|
| Page.tsx files audited | 223 |
| Sidebar hrefs (across 3 sidebars) | 129 |
| Legacy SCRs in catalog | 176 |
| Form fields in spec | 726 |
| Table columns in spec | 4,090 |
| Actions in spec | 631 |
| Business rules extracted | 52 |
| Prisma models in backend | ~85 |
| REST endpoints in backend | ~250 |

### 2.2 Severity Legend
- 🔴 **CRITICAL** — Financial loss, legal non-compliance, atau data corruption
- 🟠 **HIGH** — Spec deviation yang signifikan, user-blocking
- 🟡 **MEDIUM** — UX gap, incomplete feature
- 🟢 **LOW** — Cosmetic / nice-to-have

---

## 3. BUSINESS RULES STATUS (52 Rules)

Per `docs/_AUDIT_RULES_2026-09-09.md`:

| # | Rule | SCR Ref | Status | Severity |
|---|---|---|---|---|
| R1 | Universal Code Engine (no-reset, DDMMYYYY) | SCR-030, 080, Bagian I.1 | ⚠️ Partial (IdGenerator split) | 🔴 CRITICAL |
| R2 | Approval 3-Tier (>50jt → Director) | Bagian I.2 | ⚠️ Partial (FundRequest only) | 🔴 CRITICAL |
| R3 | 3-Pilar Gudang (Bagus/Reject/Free) | SCR-091, Bagian I.3 | ❌ Missing (schema absent) | 🔴 CRITICAL |
| R4 | Auto-Jurnal Engine (9 event triggers) | Bagian I.4, SCR-079 | ❌ Missing (service unwired) | 🔴 CRITICAL |
| R5 | AR Gatekeeper HELD/RELEASED | SCR-101 | ⚠️ Partial (SO missing field) | 🟠 HIGH |
| R6 | Client Escrow 0% P&L | SCR-077 | ⚠️ Partial (no sub-ledger) | 🔴 CRITICAL |
| R7 | Period Lock (Soft/Hard) | SCR-070 | ⚠️ Partial (binary only) | 🟠 HIGH |
| R8 | Top Metric Cards ordered ↔ Tabs | Bagian I.5 | ✅ Partial | 🟡 MED |
| R9 | Search-Select / Autocomplete | Bagian I.5 | ⚠️ Partial | 🟡 MED |
| R10 | Custom Date Range Filter | Bagian I.5, SCR-079-085 | ✅ Implemented | 🟢 LOW |
| R11 | AP Aging H-3/H-7/Overdue | SCR-085, Bagian I.5 | ✅ Implemented | 🟢 LOW |
| R12 | 10-Fase Bisnis end-to-end | Bagian I.6 | ❌ Missing (no state machine) | 🟠 HIGH |
| R13 | KPI Universal (CR, SAR, OTD, BSR, QDR) | Bagian I.7 | ✅ Partial | 🟡 MED |
| R14-22 | MOD-01 Master rules (CoA 11 akun, useful life, etc.) | MOD-01 | ⚠️ Partial | 🟡 MED |
| R23-30 | MOD-02 BusDev rules (Sample→SO→DP gate) | MOD-02 | ⚠️ Partial | 🟠 HIGH |
| R31-35 | MOD-03 R&D rules (max 3 revisi, BPOM/HKI tracking) | MOD-03 | ⚠️ Partial | 🟡 MED |
| R36-40 | MOD-04 SCM rules (3-way match, diskon Rp, ongkir separate) | MOD-04 | ❌ Missing (3-Way) | 🔴 CRITICAL |
| R41-45 | MOD-05 Warehouse (Aging barang, free HPP=0) | MOD-05 | ⚠️ Partial | 🟡 MED |
| R46-50 | MOD-06 Production (Mix→Fill→Pack, COGS auto) | MOD-06 | ⚠️ Partial | 🟡 MED |
| R51 | MOD-09 Legality Client Escrow | SCR-077 | ❌ Missing | 🔴 CRITICAL |
| R52 | MOD-12 Executive read-only aggregation | SCR-006-022 | ❌ Missing (3/17 live) | 🔴 CRITICAL |

**Distribution**: 12 ✅ (23%) · 15 ⚠️ (29%) · 25 ❌ (48%) · **9 CRITICAL**

---

## 4. PER-MODULE GAP MATRIX

| Module | Legacy SCRs | Pages Exist | Pages In Spec | Spec Coverage | Hardcoded UI | DNA % | Backend | Grade |
|---|---:|---:|---:|---:|---:|---:|---|---|
| MOD-01 Master Data | 107 | 24 | 24 | 22% | 22 | 62% | ✅ CoA, Bank Acct | C+ |
| MOD-02 BusDev & CRM | 12 | 12 | 11 | **92%** | 18 | 95% | ✅ A grade | A- |
| MOD-03 R&D & Formulation | 8 | 6 | 6 | 75% | 30 | 93% | ⚠️ Mostly in spec | B+ |
| MOD-04 SCM & Purchasing | 29 | 17 | 17 | 59% | **45** | 94% | ⚠️ Partial | B |
| MOD-05 Warehouse | 4 | 4 | 4 | **100%** | **67** | 92% | ✅ A grade | A+ |
| MOD-06 Production & PPIC | 19 | 17 | 17 | 89% | **75** | 87% | ⚠️ B+ | B+ |
| MOD-07 QC & Compliance | 8 | 5 | 5 | 63% | 14 | 100% | ✅ Mostly | B- |
| MOD-08 Design | 2 | 2 | 2 | 100% | 8 | 100% | ✅ A grade | A |
| MOD-09 Legality & Regulation | 10 | 10 | 10 | 100% | 18 | 100% | ✅ A- | A- |
| MOD-10 Finance & Accounting | 30 | 22 | 22 | 73% | **40** | 100% | ⚠️ B- (no Auto-Jurnal) | B+ |
| MOD-11 HR | 5 | 5 | 5 | 100% | 5 | 83% | ❌ Tickets orphan | B+ |
| MOD-12 Executive & Analytics | 17 | 3 | 3 | **18%** | 8 | 75% | ❌ D | D |

---

## 5. SHARED DEBT CATALOG

### 5.1 Hardcoded HTML Elements (per Agent-Field-Audit)

| Element | Count | Pages Affected | Severity |
|---|---:|---:|---|
| `<input>` | **318** | 76 | 🔴 |
| `<select>` | **156** | 78 | 🔴 |
| `<textarea>` | **65** | 54 | 🟠 |
| `<input type="date">` | **91** | 50 | 🔴 |
| `<input type="checkbox">` | 14 | 12 | 🟠 |
| `<table>` | **170** | 103 | 🔴 |
| **Total raw HTML** | **814** | | |

### 5.2 UI Library Violations

| Import Source | Count | Severity |
|---|---:|---|
| `@/components/ui/table` | 39 | 🔴 Should use `DnaTable` |
| `@/components/ui/button` | 26 | 🔴 Should use `DnaButton` |
| `@/components/ui/dialog` | 18 | 🔴 Should use `DnaModal` |
| `@/components/ui/input` | 17 | 🔴 Should use `DnaInput` |
| `@/components/ui/select` | 12 | 🔴 Should use `DnaSelect` |
| `@/components/ui/card` | 11 | 🟠 Should use `DashboardCard` |
| `@/components/ui/badge` | 4 | 🟠 Should use `DnaCell.Badge` |
| `@/components/ui/textarea` | 9 | 🔴 Should use `DnaTextarea` |
| `@/components/ui/checkbox` | 5 | 🟠 Should use `DnaCheckbox` |
| Other `@/components/ui/*` | 25 | 🟡 |
| **Total violations** | **166** | |

### 5.3 Hardcoded Values

| Pattern | Count | Fix |
|---|---:|---|
| `Rp ` literals | **469** | Replace with `formatIDR()` or `<DnaCell.Currency>` |
| `toLocaleString("id-ID")` | **486** | Replace with `formatIDR()` or `<DnaCell.Currency>` |
| `toLocaleDateString()` | ~50 | Replace with `formatIDDate()` or `<DnaCell.Date>` |
| Hardcoded hex colors | **419** | Replace with Tailwind tokens or DNA palette |
| `MOCK_*` literals | 78 | Replace with API call |
| `INITIAL_*` literals | 135 | Replace with API call |

### 5.4 Cleanup Debt

| Item | Count | Severity |
|---|---:|---|
| `console.log` in production | **14** | 🟠 |
| `debugger;` | 0 | — |
| `TODO` comments | ~25 | 🟡 |
| `FIXME` comments | ~8 | 🟡 |

---

## 6. DRIFT CATALOG (per Agent-Drift-Audit, reconciled 2026-09-12)

> **Angka drift resolution** (reconciled against `_AUDIT_FULL_REPORT_2026-09-09.md`):
> - Ghost Routes: 12 → **10** (per §2.1 + §2.4 + QW6)
> - Within-Sidebar Duplicates: 51 → **46** (per §2.1 + QW5)
> - Dead-Code Orphan Pages: 106 → **unverified** (referenced `_AUDIT_DRIFT_2026-09-09.md` not present in repo; SPEC-GAP-MAP originally cited from that file)
> - Suspicious Duplicates: 9 pairs → **unverified** (same source gap as orphans)

### 6.1 Ghost Routes (10 total — per `_AUDIT_FULL_REPORT_2026-09-09.md` §2.4)
Sidebar hrefs tanpa `page.tsx` (10 unique hrefs, Next.js 404 on click):
1. `/finance/aset-tetap` → canonical: `/finance/assets`
2. `/finance/buku-besar` → canonical: `/finance/ledger`
3. `/crm/dashboard` → canonical: `/bussdev/...`
4. `/crm/clients` → canonical: `/bussdev/client-manager?tab=clients`
5. `/crm/deals` → canonical: `/bussdev/client-manager?tab=deals`
6. `/crm/pipeline` → canonical: `/bussdev/pipeline`
7. `/crm/activities` → canonical: `/bussdev/...`
8. `/marketing/management-task/overview`
9. `/rnd/formula/new`
10. (1 additional, see audit §2.4)

### 6.2 Within-Sidebar Duplicates (46 total — per `_AUDIT_FULL_REPORT_2026-09-09.md` §2.1 + QW5)
46 hrefs appear 2-5× each. 3 hrefs appear 5× each (top offenders):
- `/production/schedule`
- `/project-control/checklist-tracking`
- `/scm/checklist-progress`

### 6.3 Dead-Code Orphan Pages (count unverified)
Pages exist but no sidebar links to them. Worst offenders per original SPEC-GAP-MAP claim:
- `marketing/` (17 orphans)
- `finance/` (14 orphans)
- `rnd/` (8 orphans)
- `qc/` (7 orphans)
- `logistics/` (4 orphans — entire module has no sidebar presence)

> ⚠ **Note**: The 106 figure originates from `_AUDIT_DRIFT_2026-09-09.md` referenced in the Sources block. That file is not present in the repo as of 2026-09-12. Verify before relying on the per-module breakdown.

### 6.4 Suspicious Duplicates (9 pairs — per original SPEC-GAP-MAP claim, unverified)
- `finance/jurnal` vs `finance/jurnal-umum` vs `finance/general-journal`
- `finance/dp-pembelian` vs `finance/uang-muka-pembelian`
- `finance/dp-penjualan` vs `finance/uang-muka-penjualan`
- `sales/orders` vs `sales/sales-orders`
- `master/vendors` vs `master/suppliers`
- `finance/coa` vs `master/coa-manage`

### 6.5 Dependency Drift
| Item | Severity |
|---|---|
| `lucide-react@^1.7.0` (likely typo, current is 0.x) | 🟠 |
| `prisma` in devDeps (should be deps) | 🟡 |
| `eslint-config-next` lags `next@^16.2.6` | 🟡 |
| `FinanceSidebar.tsx` uses undefined `bg-brand-*` tokens | 🟠 |

---

## 7. BACKEND GAPS (per Agent-Backend-Gap-Audit)

### 7.1 Missing Prisma Models/Fields
| Model | Issue | SCR Ref | Severity |
|---|---|---|---|
| `InboundItem` | Missing `qtyGood`, `qtyReject`, `qtyFree` (currently `qtyActual` + `isQuarantine`) | SCR-091, R3 | 🔴 |
| `SalesOrder` | Missing `deliveryStatus` HELD/RELEASED field | SCR-101, R5 | 🟠 |
| `ClientEscrow` | Missing immutable debit/credit sub-ledger | SCR-077, R6 | 🔴 |
| `PeriodLock` | Should be enum SOFT/HARD not Boolean | SCR-070, R7 | 🟠 |
| `Approval` | No universal model (only FundRequest has it) | Bagian I.2, R2 | 🟠 |
| `MasterKode` | Defined but unused — parallel to IdGenerator | SCR-030, 080, R1 | 🟠 |
| `JobOrderCosting` | Model exists but no roll-up logic | SCR-146 | 🔴 |

### 7.2 Missing API Endpoints
| Endpoint | SCR Ref | Severity |
|---|---|---|
| `POST /journal/auto` (event-driven listeners) | R4 | 🔴 |
| `GET /executive/hub` (aggregator) | SCR-007 | 🔴 |
| `POST /escrow/deposit` + `/escrow/disburse` | SCR-077 | 🔴 |
| `POST /job-order/cost-rollup` | SCR-146 | 🔴 |
| `POST /inbound/3-pilar` (Bagus/Reject/Free enforcement) | SCR-091 | 🔴 |
| `POST /purchase/3-way-match` (PO/GR/Invoice) | SCR-106 | 🔴 |
| `GET /hr/tickets` | SCR-174 | 🟠 |

### 7.3 Missing Services
| Service | Status |
|---|---|
| `journalEngine` | Service exists, NOT event-wired |
| `idGenerator` | Split (IdGeneratorService + MasterKode) |
| `approvalEngine` | Only in FundRequest context |
| `escrowLedger` | ❌ Missing |
| `costRollUp` | ❌ Missing |
| `periodLock` | Binary only |
| `arGatekeeper` | Runtime check, no persisted state |

### 7.4 Mock Pages (22 confirmed)
- **HR (5)**: `hr/employees`, `hr/attendance`, `hr/payroll`, `hr/recruitment`, `hr/tickets`
- **R&D (8)**: `rnd/sample-requests`, `rnd/sales-sample`, `rnd/master-inci`, `rnd/lab-test`, `rnd/stability`, `rnd/dashboard-rnd`, `rnd/dashboard-sample`, `rnd/dashboard-sales-sample`
- **Finance (9)**: `finance/jurnal`, `finance/jurnal-umum`, `finance/dp-pembelian`, `finance/dp-penjualan`, `finance/coa`, `finance/general-journal`, `finance/kas-masuk`, `finance/kas-keluar`, `finance/buku-besar`

For each mock page, backend endpoint exists for **17/22** — wiring is the bottleneck.

---

## 8. TOP 20 PAGES WITH MOST GAPS

| Rank | Page | SCR | Hardcoded | Missing Fields | Severity |
|---:|---|---|---:|---:|---|
| 1 | `legality/input` | SCR-128 | 6 raw `<input type="date">` | 6 | 🔴 CRITICAL |
| 2 | `scm/purchasing` | SCR-103 | 7 raw `ui/*` imports | 7 | 🔴 CRITICAL |
| 3 | `warehouse/gudang` | SCR-091 | 25 raw tags | 4 | 🟠 HIGH |
| 4 | `production/mixing` | SCR-141 | 15 raw `<input>` | 3 | 🟠 HIGH |
| 5 | `production/filling` | SCR-142 | 13 raw `<input>` | 3 | 🟠 HIGH |
| 6 | `production/packaging` | SCR-143 | 13 raw `<input>` | 3 | 🟠 HIGH |
| 7 | `production/work-orders` | SCR-139 | 12 raw `<input>` | 4 | 🟠 HIGH |
| 8 | `finance/faktur-pembelian` | SCR-104 | 17 tags + 21 `Rp ` | 5 | 🟠 HIGH |
| 9 | `finance/faktur-penjualan` | SCR-105 | 14 tags | 5 | 🟠 HIGH |
| 10 | `finance/transactions` | SCR-085 | 14 tags | 3 | 🟠 HIGH |
| 11 | `qc/checklist-category` | SCR-068 | 16 `var(--border-color)` | 2 | 🟠 HIGH |
| 12 | `qc/coa` | SCR-069 | 5 `var(--border-color)` | 2 | 🟠 HIGH |
| 13 | `warehouse/workstation` | SCR-094 | 6 raw `ui/*` imports | 4 | 🟠 HIGH |
| 14 | `scm/receiving` | SCR-091 | 4 `ui/*` imports + no 3-Pilar columns | 3 | 🔴 CRITICAL |
| 15 | `finance/fund` | SCR-110 | 4 `ui/*` imports | 2 | 🟠 HIGH |
| 16 | `master/customers` | SCR-042 | Badge bug (1 instance) | 2 | 🟡 MED |
| 17 | `master/goods` | SCR-029 | Badge bug (1 instance) | 1 | 🟡 MED |
| 18 | `master/suppliers` | SCR-038 | Badge bug (1 instance) | 1 | 🟡 MED |
| 19 | `master/warehouses` | SCR-035 | Badge bug (1 instance) | 1 | 🟡 MED |
| 20 | `user/todo` | SCR-178 | 10 `DashboardCard` leaks | 0 | 🟠 HIGH (DNA leak) |

---

## 9. BUSINESS RULES — IMPLEMENTATION CONTRACT (R1-R7)

### R1: Universal Code Engine
**Spec**: `KODE_PERUSAHAAN-DIVISI-TIPE_DOKUMEN-DDMMYYYY-NNNN` atau `TIPE-DDMMYYYY-NNNN`. Global, no reset.

**Contract for Stream B**:
- `IdGeneratorService` (existing) must support spec format
- Sequence table (`MasterKode` model OR equivalent) — global counters per TIPE
- NO year/month reset
- Both compact + full format returned

**Contract for Stream A**:
- All "Kode" fields are READ-ONLY (auto-generated on save)
- Display using `<DnaCell.Text>` with muted style

### R2: Approval 3-Tier (>50jt → Director)
**Spec**: Amount ≤ 50jt → Finance approves; > 50jt → Director.

**Contract for Stream B**:
- Universal `Approval` model (extend from FundRequest)
- Threshold check in service layer
- Director pool assignment when amount > 50jt

**Contract for Stream A**:
- 9 approval pages (already at 8/8 PASS) — extend with tier indicator
- `<DnaCell.Text>` for amount with `font-mono`
- Director escalation badge when amount > 50jt

### R3: 3-Pilar Gudang (Bagus/Reject/Free)
**Spec**: Inbound wajib pisah qty_good / qty_reject / qty_free. Payment HANYA qty_good.

**Contract for Stream B**:
- Add `qtyGood`, `qtyReject`, `qtyFree` to `InboundItem`
- Validation: qtyGood + qtyReject + qtyFree = qtyReceived (Zod refine)
- AP/Invoice settlement only on qtyGood

**Contract for Stream A**:
- `/scm/receiving` table MUST have 3 columns: Bagus / Reject / Free
- Form MUST have 3 inputs with same total check (client-side)
- Use `<DnaDataTableCard>` + `<DnaTableCell>` for status colors

### R4: Auto-Jurnal Engine (9 Event Triggers)
**Spec**: 9 events post to GL automatically (Bagian I.4 table).

**Contract for Stream B**:
- Wire `@nestjs/event-emitter` to AP/AR/Inventory services
- Each event triggers `JournalEngineService.generateJournal()`
- Dr = Cr validation enforced
- Hard error if no matching `CoaAutoManage` rule

**Contract for Stream A**:
- "Simpan & Posting" buttons remove `toast.success()` placeholder
- Add posting status badge (Draft / Posted / Failed)
- Failed posts show retry button

### R5: AR Gatekeeper HELD/RELEASED
**Spec**: SO dapat state HELD sampai pelunasan verified, baru RELEASED untuk delivery.

**Contract for Stream B**:
- Add `deliveryStatus: enum HELD | RELEASED` to `SalesOrder`
- Hook on `SO_PAID` event → set RELEASED
- `/warehouse/delivery-out` filter: only RELEASED SOs

**Contract for Stream A**:
- `/bussdev/dashboard-business-development` — add AR Aging widget (Poin 17/76)
- SO list shows HELD badge (amber) / RELEASED badge (green)
- `/warehouse/delivery-out` — filter chips HELD/RELEASED

### R6: Client Escrow 0% P&L
**Spec**: PNBP/Lab/HKI client funds pass through, never touch P&L.

**Contract for Stream B**:
- New `ClientEscrowLedger` model (immutable debit/credit)
- `Dr Bank, Cr EscrowDeposit` on receipt
- `Dr EscrowDeposit, Cr Bank` on disbursement
- NO entry to revenue/expense accounts

**Contract for Stream A**:
- New page `/master/client-escrow` (SCR-077) with `<DnaDataTableCard>`
- Top Metric Cards: Total Deposit Outstanding / Disbursed This Month / Unreimbursed
- Status: Deposited / Partially Used / Fully Settled

### R7: Period Lock (Soft/Hard)
**Spec**: Soft Lock = warning; Hard Lock = read-only. Adjustment Journal only path.

**Contract for Stream B**:
- `PeriodLock` enum: `OPEN | SOFT | HARD`
- Middleware check on all transaction endpoints
- `AdjustmentJournal` is only escape hatch

**Contract for Stream A**:
- `/master/closing-checklist` (SCR-070) — already exists, verify
- Status badge in Topbar: 🟢 Open / 🟡 Soft / 🔴 Hard
- All posting buttons disabled when Hard

---

## 10. STREAM A BACKLOG — Visual DNA + Frontend

Per `DNA-RULES-CONTRACT.md`, all work uses DNA components only.

### S1-A (Week 1): Critical Fixes — Top 10 items
| # | Page | Fix | Effort |
|---|---|---|---|
| 1 | `legality/input/page.tsx` | 6 raw `<input type="date">` → `<DnaDatePicker>` | 30 min |
| 2 | `scm/purchasing/page.tsx` | 7 raw `ui/*` imports → DNA | 1 hr |
| 3 | `DnaCell.tsx:76-94` | Fix `getStatusBadgeStyle()` English enum bug | 1 hr |
| 4 | `DnaPageHeader.tsx:82` | Fix H1 `26px → 32px` | 5 min |
| 5 | `TableWrapper.tsx` | Fix `var(--border-color)` → `border-slate-200` | 5 min |
| 6 | `Sidebar.tsx` + 2 others | Remove 12 ghost routes or add page.tsx | 2 hr |
| 7 | `Sidebar.tsx` + 2 others | Dedupe 51 duplicate hrefs | 3 hr |
| 8 | `Topbar` | Add Saldo Bank Card (per SCR-037) | 2 hr |
| 9 | `scm/receiving` | Add 3-Pilar columns (Bagus/Reject/Free) | 4 hr |
| 10 | `bussdev/dashboard-business-development` | Add AR Aging widget | 4 hr |

### S2-A (Week 2-3): Visual DNA 5-Layer Compliance
- **L04 Toolbar**: Currently 1.3% — refactor all operational pages
- **L03 Tab Navigation**: Currently 28.2% — add `<DnaTabs>` where multi-section
- **L02 KPI Cards**: Currently 37.4% — add ordered metric cards
- 7 golden-reference deviations (H1 size, rounded-xl, etc.)
- Effort: 60-80 hrs

### S3-A (Week 4): DNA Migration — Bulk
- 166 `@/components/ui/*` imports → DNA equivalents
- 91 raw `<input type="date">` → `<DnaDatePicker>`
- 14 raw checkboxes → `<DnaCheckbox>`
- 318 raw `<input>` → `<DnaInput>`
- 156 raw `<select>` → `<DnaSelect>` / `<DnaAutocomplete>`
- 170 raw `<table>` → `<DnaTable>`
- Effort: 80-100 hrs

### S4-A (Week 5-6): Sidebar + Pages Coverage
- Add 153 missing SCRs (priority order per critical gaps)
- Remove 106 dead-code orphan pages (or document as internal)
- Resolve 9 suspicious duplicates (consolidate or rename)
- Effort: 60-100 hrs

### S5-A (Week 7-8): Drift Cleanup
- 419 hardcoded hex colors → Tailwind tokens
- 469 `Rp ` literals → `formatIDR()` / `<DnaCell.Currency>`
- 486 `toLocaleString()` → `formatIDR()` / `<DnaCell.Currency>`
- 14 `console.log` → remove
- Dependency cleanup
- Effort: 40 hrs

**Stream A total**: ~280-360 hrs (7-9 weeks)

---

## 11. STREAM B BACKLOG — Backend

### S1-B (Week 1): Foundation Services
| # | Service | Description | Effort |
|---|---|---|---|
| 1 | `IdGeneratorService` consolidation | Merge IdGeneratorService + MasterKode, support spec format | 8 hr |
| 2 | `JournalEngineService` event-wiring | Add `@nestjs/event-emitter` listeners on AP/AR/Inventory | 16 hr |
| 3 | `ApprovalEngine` universal model | Extend from FundRequest to all 9 approval flows | 16 hr |
| 4 | `PeriodLock` enum migration | Boolean → enum, add middleware | 4 hr |
| 5 | Mock page wiring (17/22 with existing endpoints) | Just swap `useState` → `useSWR` | 16 hr |
| **S1-B Total** | | | **60 hr** |

### S2-B (Week 2-3): 3-Pilar Gudang + 3-Way Match + AR Gatekeeper
| # | Service | Description | Effort |
|---|---|---|---|
| 1 | `InboundItem` schema migration | Add qtyGood/qtyReject/qtyFree + Zod validation | 8 hr |
| 2 | `APInvoice` settlement logic | Only qtyGood for vendor payment | 8 hr |
| 3 | `ThreeWayMatchService` | Match PO/GR/Invoice within tolerance | 24 hr |
| 4 | `SalesOrder.deliveryStatus` field + auto-set on `SO_PAID` | R5 wire | 8 hr |
| **S2-B Total** | | | **48 hr** |

### S3-B (Week 4): Client Escrow + Job Order Costing
| # | Service | Description | Effort |
|---|---|---|---|
| 1 | `ClientEscrowLedger` model + service | Immutable sub-ledger, 0% P&L | 24 hr |
| 2 | `JobOrderCostingService` | Cost roll-up: Dr COGS / Cr WIP | 32 hr |
| 3 | `HR Tickets` controller | Fix orphan | 8 hr |
| 4 | `Approval` universal service | Tier indicator + Director escalation | 16 hr |
| **S3-B Total** | | | **80 hr** |

### S4-B (Week 5-6): Executive Hub + Remaining Pages
| # | Service | Description | Effort |
|---|---|---|---|
| 1 | `ExecutiveHubService` aggregator | Pull from all subledgers, trend charts | 40 hr |
| 2 | `KPIService` formulas (CR, SAR, OTD, BSR, QDR) | R13 wire | 16 hr |
| 3 | Mock page wiring (5 remaining) | The 5 with NO existing endpoints | 40 hr |
| **S4-B Total** | | | **96 hr** |

### S5-B (Week 7-8): Schema Cleanup + Production Hardening
| # | Service | Description | Effort |
|---|---|---|---|
| 1 | Schema audit + cleanup | Remove unused, add indexes, cascade rules | 16 hr |
| 2 | Auth + RBAC enforcement | All approval endpoints require role check | 16 hr |
| 3 | E2E tests for critical paths | Auto-Jurnal, Escrow, 3-Way, AR Gate | 24 hr |
| **S5-B Total** | | | **56 hr** |

**Stream B total**: ~340 hrs (8-9 weeks)

---

## 12. SHARED CRITICAL ANCHORS

These 5 fixes are **cross-stream dependencies** and must be coordinated:

### Anchor 1: 3-Pilar Gudang
- **Stream B (S2-B)**: Add qtyGood/qtyReject/qtyFree to InboundItem
- **Stream A (S1-A #9)**: Add 3 columns to `/scm/receiving` table
- **Coordination**: B must deploy BEFORE A can validate

### Anchor 2: Auto-Jurnal Engine
- **Stream B (S1-B)**: Wire event listeners + JournalEngineService
- **Stream A (S2-A)**: Replace toast.success() with real posting status
- **Coordination**: B deploys first; A mocks before, swaps after

### Anchor 3: Client Escrow
- **Stream B (S3-B)**: ClientEscrowLedger model + service
- **Stream A (S3-A)**: New page `/master/client-escrow` (SCR-077)
- **Coordination**: A mocks the UI first with placeholder data, B plugs in real

### Anchor 4: AR Gatekeeper
- **Stream B (S2-B)**: SalesOrder.deliveryStatus + auto-set
- **Stream A (S1-A #10)**: AR Aging widget + delivery filter
- **Coordination**: Independent, can deploy in parallel

### Anchor 5: Period Lock
- **Stream B (S1-B)**: PeriodLock enum + middleware
- **Stream A (S2-A)**: Topbar status badge + button disable
- **Coordination**: Independent, can deploy in parallel

---

## 13. DEFINITION OF DONE (per Sprint)

A sprint is COMPLETE only when:
- [ ] Code passes ESLint with zero `@/components/ui/*` violations (outside DNA barrel)
- [ ] Code passes TypeScript check (zero `any` in new code)
- [ ] All new code has `// SPEC: SCR-NNN` comment
- [ ] All non-spec fields marked `// NON-SPEC:`
- [ ] No raw `<input>`, `<select>`, `<table>` in new code
- [ ] No `toLocaleString()`, `Rp ` literal in new code (use DNA cells)
- [ ] No `console.log` in new code
- [ ] Backend: E2E test for each new endpoint
- [ ] Documentation updated (if API contract changes)
- [ ] 1 demo screenshot of the feature working

---

## 14. SIGN-OFF

| Stream | Owner | Sprint Coverage |
|---|---|---|
| **A** — Visual DNA + Frontend | (assign) | S1-A through S5-A |
| **B** — Backend | (assign) | S1-B through S5-B |

**Both streams read this SPEC-GAP MAP + DNA-RULES-CONTRACT as binding contract.**

**Target Score**: 62 → 90+ in 5 sprints (8-9 weeks).

**Critical Risk**: Tanpa Stream B's Auto-Jurnal + Universal Code + Approval Threshold, ERP = spreadsheet dengan skin DNA. Stream B S1 (60 hrs) is the highest-priority foundation work.

---

## 15. APPENDIX INDEX

| File | Purpose |
|---|---|
| `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` | SSOT for spec |
| `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` | Machine-readable 176 SCRs |
| `VISUAL_DNA.md` | Design contract 5-layer |
| `docs/DNA-RULES-CONTRACT.md` | Coding rules (BINDING) |
| `docs/_AUDIT_FULL_REPORT_2026-09-09.md` | Phase 0 baseline audit |
| `docs/_AUDIT_FIELDS_2026-09-09.md` | Per-field gap matrix |
| `docs/_AUDIT_RULES_2026-09-09.md` | 52 business rules |
| `docs/_AUDIT_BACKEND_2026-09-09.md` | Prisma + API gaps |
| `docs/_AUDIT_DRIFT_2026-09-09.md` | Drift catalog |
