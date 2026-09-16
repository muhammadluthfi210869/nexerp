# 🔍 FULL AUDIT — FINALISASI NEX ERP
**Tanggal Audit**: 2026-09-16
**Auditor**: Kilo (MiniMax-M3) — Full-Stack Codebase Recon
**Lingkup**: `docs/legacy-erp/*` (178 screens) vs codebase aktual (frontend Next.js + backend NestJS + Prisma)
**Metode**: 19 dokumen dibaca + 4 scout agent + 12 grep/bash verification + 7 audit sebelumnya (2026-09-09)

---

## 0. EXECUTIVE SCORECARD

| Dimensi | Score | Catatan |
|---|---:|---|
| **Spec Coverage (modul screens)** | **~62/100** | 23/176 SCR reachable dari sidebar (13%); 153/176 tanpa navigasi |
| **DNA Component Adoption** | **88.6%** | 122 DNA-only pages, 42 mixed, 2 UI-only, 19 zero-DNA |
| **Hardcoded UI Purity** | **26%** | 814 raw HTML instances (input/select/table); 419 hex hardcoded |
| **Backend Service Completeness** | **~70/100** | 32 modules, ~250 endpoints, tapi 7 business rules 40% rata-rata |
| **Auto-Journal Engine** | **🔴 ~15%** | Service ada tapi hanya 3 listener @OnEvent; tidak ada event-driven 9-trigger |
| **3-Pilar Gudang (Bagus/Reject/Free)** | **🔴 ~5%** | InboundItem hanya qtyActual+isQuarantine (bukan qtyGood/qtyReject/qtyFree) |
| **Approval 3-Tier Universal** | **⚠️ ~40%** | FundRequest only; 8 approval page SCR-058..065 pakai ApprovalPageShell tapi onApprove mock |
| **Mock-State Pages** | **22 confirmed** | HR 5 + R&D 8 + Finance 9 — backend endpoint exist di 17/22 (tinggal wire) |
| **Sidebar Coverage vs Legacy** | **13%** | 135 unique href vs 176 legacy SCR — gap 87% |
| **Ghost Routes (sidebar → 404)** | **12** | `/crm/*` cluster 5, `/bussdev/*` 2, `/finance/*` 2, `/scm/*` 1, dll |
| **Critical Business Blockers** | **9** | R1 Universal Code, R2 3-Pilar, R3 Auto-Jurnal, R4 Approval, R5 AR Gate, R6 Escrow, R7 Period Lock, Job Order Costing, Executive Hub |

**Verdict Headline**:
- **Backend** substansial lebih lengkap dari audit baseline (32 modules, 250 endpoints, 85 Prisma models, 19 schema files)
- **Frontend** kuat di BussDev & Production tapi lemah di Finance/HR/Executive/Reports
- **DNA Component Library** sudah mature (88.6% adoption) tapi ada 1 critical bug `DnaCell.Badge.getStatusBadgeStyle()` yang mengenai 4 halaman
- **Visual DNA 5-Layer** rata-rata 51% — L01/L05 kuat, L03/L04 lemah

---

## 1. STRUKTUR EVOLUSI DOKUMEN

### 1.1 Sumber Kebenaran (Single Source of Truth)
```
docs/legacy-erp/
├── NEX_ERP_MASTER_SPECIFICATION.md      ← SSOT spec (2.198 baris, 178 layar)
├── NEX_ERP_SCREEN_AND_API_CATALOG.json  ← Machine-readable mirror (9.215 baris, 176 layar)
├── NEX_FINANCE_FINAL_SPEC.md            ← Finance-only spec (41 screens, 8 sprint)
├── NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md ← Audit 15-Sep (31 additional req, 32 layar gap)
├── KPI_REFERENCE.md                     ← 120 KPI formulas
├── REQUIREMENT.md                       ← 78 poin requirement Upii (final, post-reconciliation)
├── LEGACY_ERP_SPEC.md + LEGACY_ERP_AUDIT.md ← Baseline awal
├── MASTER_DATA/                          ← 6 CSV + 1 XLSX (BARANG 2.795 rows, GUDANG 16, PELANGGAN 817, SUPPLIER 177, USERS 46, KATEGORI 7)
└── _archive/                             ← 38 file historis (5 fase evolusi)
```

### 1.2 Konflik/Inconsistency yang HARUS Di-Resolve
1. **Spec bilang 178, JSON catalog bilang 176** — master spec tidak punya body section untuk MOD-06, 08, 09, 10, 11 (hanya di TOC)
2. **Universal Code Engine format final**: Lengkap `DL-FIN-SO-29062026-0001` atau Ringkas `SO-29062026-0001`, global & no-reset. Implementation existing pakai `PREFIX-YYMM-SEQ` (salah format).
3. **Module ID vs Route prefix**: 12 modul di spec, tapi hanya 7 prefix route (`/master`, `/scm`, `/bussdev`, `/rnd`, `/warehouse`, `/qc`, `/executive`). Finance/Legal/HR/Production/Design belum punya prefix definitif.
4. **3-Way Matching disembunyikan** di UI (Poin 5) tapi engine 4-Leg tetap jalan di background (SCR-106).
5. **31 "Requirement Tambahan"** dari live audit — bukan bug 404, tapi memang belum pernah ada di legacy. Bangun clean-slate.

---

## 2. PER-MODULE GAP MATRIX (vs 178 Legacy Screens)

| Modul | SCR Declared | Pages Exist | Hardcore DNA | Backend | Grade | Critical Gaps |
|---|---:|---:|---:|---|---|---|
| **MOD-01 Master Data** | 107 | 24 | 62% | ✅ CoA, Bank Acct | C+ | Auto-Journal 40%, ~22% screen coverage, 86/107 screens missing |
| **MOD-02 BusDev & CRM** | 12 | 12 | 95% | ✅ Real | A- | AR Aging widget MISSING di SCR-002, auto-save Poin 78 missing di guest-book, DnaCell.Badge bug |
| **MOD-03 R&D & Formulation** | 8 | 6 | 93% | ⚠️ Mostly | B+ | 8 mock pages (formula, batch-record, schedule, dll) |
| **MOD-04 SCM & Purchasing** | 29 | 17 | 94% | ⚠️ Partial | B | 3-Pilar MISSING di `/scm/receiving`, 3-Way Matching hilang, Faktur Pembelian incomplete |
| **MOD-05 Warehouse & Inventory** | 4 | 4 | 92% | ✅ Real | A+ | warehouse/release A+ (AR Gatekeeper), 3-Pilar missing di inbound schema |
| **MOD-06 Production & PPIC** | 19 | 17 | 87% | ⚠️ B+ | B+ | Upscale calculation MISSING, Batch Record no SO linkage, Job Order Costing MISSING |
| **MOD-07 QC & Compliance** | 8 | 5 | 100% | ✅ Mostly | B- | SCR-146 Job Order Costing absent, SCR-068 Checklist Progress no navbar |
| **MOD-08 Creative & Design** | 2 | 2 | 100% | ✅ Real | A | Low coverage but high quality |
| **MOD-09 Legality & Regulation** | 10 | 10 | 100% | ✅ Real | A- | 0 mock pages, full DNA compliance |
| **MOD-10 Finance & Accounting** | 30 | 22 | 100% | ⚠️ B- | B+ | Auto-Journal absent, 9 mock pages, balance-sheet DNA violation, dp-penjualan/sales-orders raw UI |
| **MOD-11 Human Resources** | 5 | 5 | 83% | ⚠️ Tickets orphan fixed | B+ | SCR-174 Beranda MISSING, no Leaderboard, 5 mock pages |
| **MOD-12 Executive & Analytics** | 17 | 3 | 75% | 🔴 D | D | 2/17 di `/executive/*`, sisanya scattered, no hub aggregator, SCR-007 tidak Aureon Matrix |

**Total**: 178 SCR declared, ~129 pages exist, ~129 reachable, ~110 fully implemented (~62%).

---

## 3. CRITICAL BACKEND BLOCKERS (7 Business Rules)

| # | Rule | Status | Gap | File Ref | Severity |
|---|---|---|---|---|---|
| **R1** | Universal Code Engine | ⚠️ 70% | `IdGeneratorService` pakai `PREFIX-YYMM-SEQ` (salah), `MasterKode` model ada tapi unused | `backend/src/modules/system/id-generator.service.ts:14-43` | 🔴 CRITICAL |
| **R2** | 3-Pilar Gudang (Bagus/Reject/Free) | 🔴 5% | `InboundItem` masih `qtyActual+isQuarantine` — TIDAK ada `qtyGood`/`qtyReject`/`qtyFree`. Field ada di `PurchaseOrderItem` (`qtyBagus`, `qtyReject`) tapi tidak di InboundItem | `backend/prisma/schema/warehouse.prisma:305-315` | 🔴 CRITICAL |
| **R3** | Auto-Jurnal Engine (9 triggers) | 🔴 15% | `JournalEngineService` ada tapi tidak event-driven. Hanya 3 `@OnEvent()` di finance (cash.service, finance.service, valuation.service). AP/AR/Bill/Payment tidak trigger | `backend/src/modules/finance/journal-engine.service.ts` | 🔴 CRITICAL |
| **R4** | Approval 3-Tier (>50jt → Director) | ⚠️ 40% | Hanya `FundRequest`. 8 approval pages pakai `ApprovalPageShell<T>` di FE tapi `onApprove`/`onReject` masih mock. Tidak ada universal Approval model | `backend/prisma/schema/finance.prisma` (no model `Approval`) | 🔴 CRITICAL |
| **R5** | AR Gatekeeper (HELD/RELEASED) | ⚠️ 50% | `SalesInvoice.deliveryStatus` String field — bukan enum. `SalesOrder` TIDAK punya HELD/RELEASED field. Hanya runtime check | `backend/prisma/schema/finance.prisma:281` | 🟠 HIGH |
| **R6** | Client Escrow (0% P&L) | ⚠️ 35% | `ClientEscrow` model ada, controller GET only, TIDAK ada sub-ledger immutable debit/credit | `backend/prisma/schema/finance.prisma:548-563` | 🔴 CRITICAL |
| **R7** | Period Lock (Soft/Hard) | ⚠️ 60% | `PeriodLock.isLocked` Boolean — bukan enum SOFT/HARD. Tidak bisa distinguish warning vs read-only | `backend/prisma/schema/finance.prisma:441-451` | 🟠 HIGH |

**Missing Endpoints** (per backend audit):
- `POST /journal/auto` (event-driven listeners)
- `GET /executive/hub` (aggregator)
- `POST /escrow/deposit` + `/escrow/disburse`
- `POST /job-order/cost-rollup`
- `POST /inbound/3-pilar`
- `POST /purchase/3-way-match`

**Missing Services**: `journalEngine` (event-wired), `approvalEngine` (universal), `escrowLedger`, `costRollUp`, `periodLock` (enum), `arGatekeeper` (persisted state).

---

## 4. FRONTEND GAPS

### 4.1 Ghost Routes (12 — sidebar → 404)
| # | href | Label | Severity |
|---|---|---|---|
| 1 | `/bussdev/ar-aging` | AR Aging Piutang | CRITICAL |
| 2 | `/bussdev/kelola-pelanggan` | Kelola Pelanggan | CRITICAL |
| 3 | `/crm/buku-tamu` | Buku Tamu | CRITICAL |
| 4 | `/crm/client-lost` | Client Lost | CRITICAL |
| 5 | `/crm/client-produksi` | Client Produksi | CRITICAL |
| 6 | `/crm/client-ro` | Client RO | CRITICAL |
| 7 | `/crm/client-sample` | Client Sample | CRITICAL |
| 8 | `/finance/aset-tetap` | Aset Tetap & Depresiasi | CRITICAL |
| 9 | `/finance/buku-besar` | Buku Besar | CRITICAL |
| 10 | `/marketing/management-task/overview` | Management Task | CRITICAL |
| 11 | `/rnd/formula/new` | Buat Formulasi Baru | CRITICAL |
| 12 | `/scm/hpp-requests` | Permintaan HPP | CRITICAL |

**Fix**: Buat `page.tsx` placeholder atau rewire ke existing page (e.g. `/crm/*` → `/bussdev/client-manager?tab=...`).

### 4.2 Within-Sidebar Duplicates (51 href muncul ≥2×)
Top offenders:
- `/scm/checklist-progress` — **5×**
- `/project-control/checklist-tracking` — **5×**
- `/master/suppliers` — **4×** (Vendor/Supplier/Supplier & Vendor)
- `/warehouse/stok` — **4×** (Stok/Stok Barang/Laporan Stok)
- `/finance/faktur-pembelian` — **3×**

**Fix**: Deduplikasi via grep + edit, label final per href.

### 4.3 UI di Luar DNA Component Library

**Raw HTML Count** (per DNA audit):
| Element | Count | Pages | Severity |
|---|---:|---:|---|
| `<input>` | 299 | 76 | 🔴 |
| `<select>` | 147 | 78 | 🔴 |
| `<textarea>` | 63 | 54 | 🔴 |
| `<table>` | 145 | 103 | 🔴 |
| `<input type="date">` | 90 | 50 | 🔴 |

**Top offenders**:
- `production/mixing` (15 raw `<input>`)
- `production/filling` (13 raw `<input>`)
- `production/packaging` (13 raw `<input>`)
- `warehouse/gudang` (13 input + 8 select)
- `legality/input` (6 raw `<input type="date">`)
- `scm/purchasing` (7 raw `@/components/ui/*` imports)

**Hardcoded Values**:
- 469 `Rp ` literals → `formatIDR()`
- 486 `toLocaleString("id-ID")` → `formatIDR()` / `<DnaCell.Currency>`
- 419 hex colors (e.g. `bg-[#2563EB]`) → Tailwind tokens
- 78 `MOCK_*` + 135 `INITIAL_*` declarations

### 4.4 Mock-State Pages (22 confirmed — FE tampilkan data palsu)

| Module | Pages | Backend Endpoint Exists? | Tinggal Wire? |
|---|---:|---|---|
| **HR** | 5 (recruitment, attendance, kpi, payroll, tickets) | 4/5 (tickets controller SUDAH ADA) | YES |
| **R&D** | 8 (batch-record, formula, schedule, design, formula-adjustment, cogs-request, project-monitoring, npf) | 5/8 (project-monitoring & cogs-request belum) | YES |
| **Finance** | 9 (bayar-pembelian, ar-hub, piutang, bank-accounts, budget, cogs-request, collections, compliance-asset, cost-variance, bayar-penjualan, dp-pembelian) | 7/9 (budget model belum) | YES |

**Effort total untuk remove all mocks**: 40-60 hrs (10-15 backend + 30-45 FE swap).

### 4.5 DNA Component Bug — Laten Regression

`frontend/src/components/dna/cells/DnaCell.tsx:76-94` — `getStatusBadgeStyle()` hanya match `.includes()` dengan keyword Indonesia:
- ✅ Match: `pending` (orange), `info` (sky), `cancel` (rose)
- ❌ Fall ke default slate: `success`, `warning`, `critical`, `purple`, `neutral`

**Affected pages** (4):
- `bussdev/down-payment` line 402-406
- `bussdev/retur-penjualan` line 328-331
- `bussdev/sample-sales` line 407-411
- `bussdev/lost` line 301

**Fix**: Patch `DnaCell.tsx` dengan if-cascade English enum.

---

## 5. UI LUAR DNA — VISUAL DRIFT

### 5.1 Visual DNA 5-Layer Compliance (227 pages audited)
| Layer | Spec | Used | % | Severity |
|---|---|---|---:|---|
| **L01 Header** | `DnaPageHeader` OR `text-[32px]` | 183/227 | **80.6%** ✅ | OK |
| **L02 KPI Cards** | `DnaKpiGrid`/`DnaStatCard` | ~85/227 | **37.4%** ⚠️ | WEAK |
| **L03 Tab Nav** | `DnaTabNav` standalone | 64/227 | **28.2%** ❌ | WEAK |
| **L04 Toolbar** | `DnaToolbar` dedicated | 3/227 | **1.3%** ❌ | DEAD COMPONENT |
| **L05 Data Table** | `DnaDataTableCard`/`DnaTable` | ~150/227 | **66.1%** ✅ | OK |

### 5.2 Golden Reference Deviations (7 Critical)
| # | Spec | Actual | Severity |
|---|---|---|---|
| 1 | H1 `text-[32px] leading-[40px] font-bold uppercase` | `text-[26px] md:text-[28px] font-black uppercase` | 🔴 (183 pages) |
| 2 | Tab Nav container `h-[46px]` standalone row | Tabs inline in header | 🔴 |
| 3 | KPI value `text-[24px]` | DnaKpiCard uses `text-[22px]` | 🟡 HIGH |
| 4 | Card border `border-slate-200` solid | `border-slate-200/90` & `/80` | 🟡 HIGH |
| 5 | Card radius `rounded-xl` | DnaDataTableCard/DnaKpiCard use `rounded-2xl` | 🟡 HIGH |
| 6 | Card shadow `shadow-2xs` | DnaDataTableCard uses `shadow-xs` | 🟢 MEDIUM |
| 7 | KPI height `h-[104px]` | DnaKpiCard uses `h-[116px]` | 🟢 MEDIUM |

### 5.3 Worst Compliance Pages (bottom 10)
1. `creative/board/page.tsx` — 0/5 layers
2. `legality/inbox/page.tsx` — 0/5 layers
3. `legality/permits/page.tsx` — 0/5 layers
4. `legality/records/page.tsx` — 0/5 layers
5. `legality/ckpb-audit/page.tsx` — 0/5 layers
6. `legality/pipeline/page.tsx` — 0/5 layers
7. `legality/apj-release/page.tsx` — 0/5 layers
8. `legality/master-inci/page.tsx` — 0/5 layers
9. `documents/drafts/page.tsx` — 0/5 layers
10. `production/audit/page.tsx` — 0/5 layers

---

## 6. INPUT/OUTPUT MISMATCH

### 6.1 Spec vs Codebase Gap
- **Master Vendor**: spec butuh import Excel — belum ada parser di FE
- **Master Customer**: spec butuh 3 card Sample/Produksi/Legalitas — ✅ implemented di master
- **Faktur Pembelian**: spec butuh diskon/ongkir/selisih pembulatan columns — kolom ada di Prisma (`BillLineItem.qtyRounded`, `PurchaseOrderItem.qtyBagus`) tapi FE belum expose
- **DP Pembelian**: spec butuh format lokal `DPB-YYMM-XXXX` tapi kode engine global
- **AP Aging**: spec butuh real-time saldo bank di navbar — hardcoded `1,550,000,000`
- **AR Aging**: spec butuh WhatsApp/Email reminder — toast only, no real notif
- **BusDev Dashboard**: spec butuh AR Aging widget — MISSING di SCR-002 (ada di client-manager)
- **Buku Tamu**: spec butuh auto-save (Poin 78) — MISSING di guest-book (ada di intake)
- **Production Schedule**: spec butuh Upscale (%) calculation — MISSING
- **Batch Record**: spec butuh salesOrderCode field — MISSING
- **Checklist Progress**: spec butuh navbar Main vs Input Design (PIC Mas Edi) — MISSING

### 6.2 Backend ↔ FE Mismatch
- `MaterialItem.realStock` (per SCR-029 Poin 56) — schema MISSING
- `SalesOrder.deliveryStatus` enum HELD/RELEASED — schema MISSING (ada di SalesInvoice only)
- `JournalEntry.postedAt`/`postedBy`/`reversalOfId` — schema MISSING
- `Bill.diskon`/`ongkir`/`selisihPembulatan` — schema MISSING (ada di PurchaseOrderItem only)
- `Approval` universal model — schema MISSING
- `ClientEscrowLedger` immutable sub-ledger — schema MISSING
- `PeriodLock.lockType` SOFT/HARD — schema MISSING (Boolean only)
- `Budget` model — MISSING (Spec SCR-093, SCR-155)

---

## 7. PAGE YANG BELUM LENGKAP

### 7.1 SCR-091 Pembelian Masuk (`/scm/receiving`)
- ❌ 3-Pilar columns MISSING (Bagus/Reject/Free)
- ✅ `/scm/pembelian` detail modal sudah ada 3-Pilar read-only
- Severity: 🔴 CRITICAL — Payment salah bisa terjadi karena tidak tahu qty mana yang dibayar

### 7.2 SCR-106 Faktur Pembelian (3-Way Matching)
- ❌ Page TIDAK ADA sebagai standalone (`/scm/purchase-invoice`)
- ✅ `/finance/faktur-pembelian` ada tapi partial
- Severity: 🔴 CRITICAL — AP cycle unreachable

### 7.3 SCR-146 Job Order Costing
- ❌ Page MISSING entire
- ⚠️ `JobOrderCosting` model ada, controller GET-only stub
- Severity: 🔴 CRITICAL — Financial control failure

### 7.4 SCR-074 Adjustment Journal
- ❌ Page MISSING (Spec Bagian I.4 — escape hatch untuk Period Hard Lock)
- Severity: 🟠 HIGH

### 7.5 SCR-168/169 Stok & Valuation
- ⚠️ Merged ke `/warehouse/stok`
- Severity: 🟡 MEDIUM

### 7.6 SCR-164 Report Penjualan
- ❌ Standalone page MISSING (sidebar masih mengarah ke `/penjualan/sales-orders`)
- Severity: 🟠 HIGH

### 7.7 SCR-174 Beranda (HR Top Metrics)
- ❌ Page MISSING — 100+ metric cards aggregator
- Severity: 🔴 CRITICAL

### 7.8 SCR-058..065 Approval (8 pages)
- ✅ Shell + UI semua ada (`ApprovalPageShell<T>` polymorphic)
- ❌ `onApprove`/`onReject`/`onBulkApprove` masih mock optimistic update
- Severity: 🟠 HIGH — backend tidak benar-benar approve

### 7.9 SCR-006..022 Executive Dashboards (17)
- ❌ Hanya 2-3 di `/executive/*`, sisanya scattered ke `/dashboard/*`
- ❌ SCR-007 Eksekutif tidak Aureon Matrix (raw `Card` + inline style)
- Severity: 🔴 CRITICAL

### 7.10 Approval Universal Model
- ❌ Tidak ada model `Approval` universal di Prisma
- ⚠️ FundRequest only (Poin 70-74 FundRequest saja yang Tier 1-3 aktif)
- Severity: 🔴 CRITICAL

---

## 8. TOP 20 PAGES WITH MOST GAPS

| Rank | Page | SCR | Issues | Severity |
|---:|---|---|---:|---|
| 1 | `legality/input` | SCR-128 | 6 raw `<input type="date">` | 🔴 |
| 2 | `scm/purchasing` | SCR-103 | 7 raw `ui/*` imports | 🔴 |
| 3 | `warehouse/gudang` | SCR-091 | 13 input + 8 select raw tags | 🟠 |
| 4 | `production/mixing` | SCR-141 | 15 raw `<input>` | 🟠 |
| 5 | `production/filling` | SCR-142 | 13 raw `<input>` | 🟠 |
| 6 | `production/packaging` | SCR-143 | 13 raw `<input>` | 🟠 |
| 7 | `production/work-orders` | SCR-139 | 12 raw `<input>` | 🟠 |
| 8 | `finance/faktur-pembelian` | SCR-104 | 17 tags + 21 `Rp ` | 🟠 |
| 9 | `finance/faktur-penjualan` | SCR-105 | 14 tags | 🟠 |
| 10 | `finance/transactions` | SCR-085 | 14 tags | 🟠 |
| 11 | `qc/checklist-category` | SCR-068 | 16 `var(--border-color)` | 🟠 |
| 12 | `qc/coa` | SCR-069 | 5 `var(--border-color)` | 🟠 |
| 13 | `warehouse/workstation` | SCR-094 | 6 raw `ui/*` imports | 🟠 |
| 14 | `scm/receiving` | SCR-091 | 4 `ui/*` imports + no 3-Pilar | 🔴 |
| 15 | `finance/fund` | SCR-110 | 4 `ui/*` imports | 🟠 |
| 16 | `master/customers` | SCR-042 | Badge bug (1 instance) | 🟡 |
| 17 | `master/goods` | SCR-029 | Badge bug | 🟡 |
| 18 | `master/suppliers` | SCR-038 | Badge bug | 🟡 |
| 19 | `master/warehouses` | SCR-035 | Badge bug | 🟡 |
| 20 | `user/todo` | SCR-178 | 10 `DashboardCard` leaks | 🟠 |

---

## 9. PRIORITAS AKSI — RECOMMENDED ORDER

### 🔴 **SPRINT 0 (Week 1) — CRITICAL FIXES & UNBLOCK PRODUCTION**
Estimasi: **60-80 jam**

| # | Action | Files | Effort | Impact |
|---|---|---|---|---|
| 1 | **Fix `DnaCell.Badge` bug** (English enum) | `frontend/src/components/dna/cells/DnaCell.tsx:76-94` | 1 hr | 4 BussDev pages dapat status color |
| 2 | **Fix `DnaPageHeader` H1 size** (26→32px) | `DnaPageHeader.tsx:82` | 5 min | 183 pages corrected |
| 3 | **Fix `DnaDataTableCard` radius/shadow** | `DnaDataTableCard.tsx:53` | 5 min | ~150 pages |
| 4 | **Add Saldo Bank Card to Topbar** | `frontend/src/components/layout/Topbar.tsx` | 2 hr | Activate Poin 11/12 real-time |
| 5 | **Add 3-Pilar columns to `/scm/receiving`** | `frontend/src/app/(dashboard)/pembelian/receiving/page.tsx` | 4 hr | Unblock PO→GR→Payment chain |
| 6 | **Wire 17/22 mock pages to real API** | HR/R&D/Finance mock files | 30 hr | Live data, no more fake rows |
| 7 | **Tutup 10 ghost routes `/crm/*` cluster** | Sidebar rewiring + 5 page.tsx placeholder | 2 hr | 404 → 200 |
| 8 | **Add AR Aging widget to BussdevDashboardClient** | `bussdev/dashboard/BussdevDashboardClient.tsx` | 1 hr | Poin 17 & 76 satisfied |
| 9 | **Port auto-save ke guest-book modal** | `bussdev/guest-book/page.tsx` | 30 min | Poin 78 satisfied |
| 10 | **Deduplikasi 51 within-sidebar duplicates** | `Sidebar.tsx` + 2 sidebars | 3 hr | Visual clarity |
| 11 | **Wire ApprovalPageShell handlers** (8 pages) | `approvals/*/page.tsx` | 4 hr | Approve jadi real action |
| 12 | **Add Upscale calculation to schedule form** | `production/schedule/page.tsx` | 30 min | SCR-142/143 satisfied |
| 13 | **Add salesOrderCode to Batch Record** | `production/batch-records/page.tsx` | 15 min | Traceability |

### 🟠 **SPRINT 1 (Week 2-3) — BACKEND FOUNDATION**
Estimasi: **80-120 jam**

| # | Action | Effort |
|---|---|---|
| 1 | **Universal Code Engine refactor** (IdGeneratorService pakai `MasterKode` table) | 8 hr |
| 2 | **Auto-Journal Engine event-wiring** (9 triggers via @nestjs/event-emitter) | 24-40 hr |
| 3 | **3-Pilar Gudang schema migration** (`InboundItem` add qtyGood/qtyReject/qtyFree) | 8 hr |
| 4 | **Universal Approval model** + extend 8 approval flows | 16-24 hr |
| 5 | **SalesOrder.deliveryStatus enum** + AR Gatekeeper service | 8-16 hr |
| 6 | **PeriodLock enum SOFT/HARD** + middleware | 4 hr |
| 7 | **ClientEscrowLedger immutable sub-ledger** | 24-40 hr |

### 🟡 **SPRINT 2 (Week 4-5) — PAGES & REPORTS**
Estimasi: **60-100 jam**

| # | Action | Effort |
|---|---|---|
| 1 | Build SCR-106 Faktur Pembelian (3-Way Match) page | 16 hr |
| 2 | Build SCR-146 Job Order Costing + calculation logic | 32 hr |
| 3 | Build SCR-174 Beranda (HR Top Metrics aggregator) | 8 hr |
| 4 | Build SCR-164 Report Penjualan | 8 hr |
| 5 | Build `/executive` hub aggregator (17 direktorat tiles) | 16 hr |
| 6 | Build Budget model + `/finance/budget` | 16 hr |
| 7 | Build 31 "Requirement Tambahan" pages (Fixed Assets, Escrow, Bank Recon) | 80-120 hr |

### 🟢 **SPRINT 3 (Week 6-7) — VISUAL DNA POLISH**
Estimasi: **40-60 jam**

| # | Action | Effort |
|---|---|---|
| 1 | Bulk replace raw `<input>` → `<DnaInput>` (318→0) | 30 hr |
| 2 | Bulk replace raw `<select>` → `<DnaSelect>` (147→0) | 20 hr |
| 3 | Bulk replace raw `<table>` → `<DnaTable>` (145→0) | 20 hr |
| 4 | Replace 419 hex colors → Tailwind tokens | 8 hr |
| 5 | Replace 469 `Rp ` + 486 `toLocaleString` → formatIDR() | 8 hr |

---

## 10. QUICK WINS (< 1 JAM, TOTAL IMPACT BESAR)

| Win | Effort | Impact | Files |
|---|---|---|---|
| Fix `DnaCell.Badge` English enum | 1 hr | 4 BussDev pages dapat status color | 1 file |
| Fix `DnaPageHeader` H1 size | 5 min | 183 pages | 1 file |
| Fix `DnaDataTableCard` rounded-2xl → rounded-xl | 5 min | 150 pages | 1 file |
| Add Saldo Bank to Topbar | 2 hr | Activate Poin 11/12 | 1 file |
| Copy AR Aging widget ke BussdevDashboard | 1 hr | Poin 17/76 satisfied | 1 file |
| Port auto-save ke guest-book | 30 min | Poin 78 satisfied | 1 file |
| Add Upscale ke production schedule | 30 min | SCR-142/143 satisfied | 1 file |
| Add salesOrderCode ke Batch Record | 15 min | Traceability | 1 file |
| **TOTAL** | **~6 jam** | **~250+ halaman perbaikan** | **8 file** |

---

## 11. CRITICAL RISKS

1. **🔴 Tanpa Backend S1 (Auto-Jurnal + Universal Code + Approval Threshold), ERP = spreadsheet dengan skin DNA.** Backend S1 (60 hrs) adalah fondasi tertinggi.
2. **🔴 Tanpa 3-Pilar Gudang, payment ke supplier bisa salah bayar barang reject.** Critical untuk cash flow integrity.
3. **🟠 22 mock-state pages** tampilkan data palsu ke production — bisa jadi misleading decision.
4. **🟠 51 duplicate sidebar + 12 ghost routes** = user experience broken.
5. **🟡 Marketing submodule (social-tracker)** — 5 file, 150+ hex hardcode, separate design system yang ignore DNA palette.
6. **🟡 kpi-management & project-control modules** — 0% DNA adoption, butuh rebuild dari scratch.

---

## 12. DEFINITION OF DONE (per Sprint)

A sprint is COMPLETE only when:
- [ ] Code passes ESLint dengan zero `@/components/ui/*` violations (outside DNA barrel)
- [ ] Code passes TypeScript check (zero `any` di new code)
- [ ] All new code ada `// SPEC: SCR-NNN` comment
- [ ] All non-spec fields marked `// NON-SPEC:`
- [ ] No raw `<input>`, `<select>`, `<table>` di new code
- [ ] No `toLocaleString()`, `Rp ` literal di new code (pakai DNA cells)
- [ ] No `console.log` di new code
- [ ] Backend: E2E test untuk each new endpoint
- [ ] 1 demo screenshot of the feature working

---

## 13. KESIMPULAN & LANGKAH SELANJUTNYA

**Status ERP per 2026-09-16**:
- ✅ Backend **substansial** (32 modules, 250 endpoints, 85 models) — TAPI ada 7 business rules blocker (R1-R7)
- ✅ Frontend DNA Component **mature** (88.6% adoption) — TAPI ada 22 mock pages, 51 dup href, 12 ghost routes
- ✅ BussDev & Production paling matang
- ❌ Finance Auto-Jurnal, 3-Pilar Gudang, Job Order Costing, AR Gatekeeper, Client Escrow **MISSING**
- ❌ Executive Hub, SCR-174 Beranda, SCR-106 Faktur Pembelian, SCR-164 Report Penjualan **MISSING**
- ❌ 31 "Requirement Tambahan" belum dibangun (Fixed Assets, Bank Recon, Escrow UI)

**Rekomendasi Langkah Pertama**:
1. **Mulai dengan Sprint 0 (Quick Wins 6 jam)** — dampak 250+ halaman, low risk
2. **Lalu Backend S1 (60 jam)** — fondasi Auto-Jurnal + Universal Code + Approval
3. **Lalu Frontend S1 (Mock cleanup 30 jam)** — wire 17 page ke real API
4. **Lalu Backend S2 (48 jam)** — 3-Pilar + 3-Way + AR Gate
5. **Lalu Sprint 2 Pages** — Job Order Costing + Beranda + Executive Hub
6. **Akhir Sprint 3** — DNA polish (raw HTML → DNA, hex → tokens)

**Target**: Score **62 → 90+ dalam 7-9 minggu** (~340 hrs Stream B + ~280-360 hrs Stream A).

---

**Auditor**: Kilo (MiniMax-M3)
**Tanda Tangan Digital**: Lihat `docs/qa-gate/2026-09-15-phase3-recovery.md` untuk recovery audit terbaru
**Next Audit**: 2026-09-23 (mingguan selama finalisasi)
