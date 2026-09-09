# AGENT-SIDEBAR AUDIT REPORT
**Tanggal**: 2026-09-09
**Agent**: Agent-Sidebar (ses_f7979dbc3ffev4DpWOb0gY9DM1)
**Scope**: Sidebar coverage vs legacy spec
**Status**: ✅ COMPLETED

---

## 1. EXECUTIVE SUMMARY

| Metric | Count |
|---|---|
| Total legacy screens (SCR-001..176) | **176** |
| MainSidebar items / unique hrefs | 187 / 120 |
| FinanceSidebar items / unique | 18 / 18 |
| LegalitySidebar items / unique | 7 / 7 |
| Total unique (sidebar, href) pairs | **145** |
| Unique hrefs across all sidebars | **135** |
| Sidebar hrefs with **exact** nexerpRoute match | **1** (`/bussdev/guest-book` → SCR-094) |
| Sidebar hrefs matching **legacyUrl only** | **1** (`/checklist` → SCR-066) |
| Sidebar hrefs matching by **prefix overlap** | **1** (`/warehouse` → SCR-125, *false positive*) |
| **Legacy SCRs reachable from any sidebar** | **23 / 176 (13%)** |
| **Legacy SCRs MISSING from all sidebars** | **153 / 176 (87%)** |
| Sidebar items without `page.tsx` (ghosts) | **10 unique hrefs** |

**Match Rate: 13 %** — other 87 % exist only as catalog entries.

---

## 2. SIDEBAR → LEGACY MAPPING (HIGHLIGHTS)

### MainSidebar (120 unique hrefs)

| Sidebar Label | href | Legacy SCR | Match |
|---|---|---|---|
| Buku Tamu | `/bussdev/guest-book` | SCR-094 | ✅ **EXACT MATCH** |
| Checklist | `/checklist` | SCR-066 | ⚠️ legacyUrl match |
| Master Barang & Kategori | `/master/goods` | SCR-027/029 | ⚠️ prefix overlap |
| Pelanggan / Customer | `/master/customers` | SCR-042 | ⚠️ prefix overlap |
| Gudang & Lokasi | `/master/warehouses` | SCR-035 | ⚠️ prefix overlap |
| Vendor Master | `/master/suppliers` | SCR-056 | ❌ route mismatch |
| Faktur Pembelian | `/finance/faktur-pembelian` | SCR-106 | ❌ route mismatch |
| DP Pembelian | `/finance/dp-pembelian` | SCR-104 | ❌ route mismatch |
| Bayar Pembelian | `/finance/bayar-pembelian` | SCR-107 | ❌ route mismatch |
| AP Aging & QC Toleransi | `/finance/ap-aging` | SCR-158 | ❌ route mismatch |
| Faktur Penjualan | `/finance/faktur-penjualan` | SCR-117 | ❌ route mismatch |
| DP Penjualan | `/finance/dp-penjualan` | SCR-115 | ❌ route mismatch |
| AR Aging & Collections | `/finance/reports/ar-aging` | SCR-159 | ❌ route mismatch |
| Kas Bank Masuk | `/finance/cash-in` | SCR-081 | ❌ route mismatch |
| Kas Bank Keluar | `/finance/cash-out` | SCR-083 | ❌ route mismatch |
| Rekonsiliasi Bank | `/finance/bank-reconciliation` | SCR-076 | ❌ route mismatch |
| Pengajuan Dana | `/finance/fund-requests` | SCR-111 | ❌ route mismatch |
| Jurnal Umum | `/finance/jurnal-umum` | SCR-079 | ❌ route mismatch |
| Laba Rugi | `/finance/laba-rugi` | SCR-163 | ❌ route mismatch |
| Aset Tetap & Depresiasi | `/finance/aset-tetap` | SCR-024 | ❌ route mismatch |
| Chart of Accounts (CoA) | `/finance/accounting/coa` | SCR-032 | ❌ route mismatch |
| Pengiriman Barang (Release) | `/warehouse/release` | SCR-086 | ❌ route mismatch |
| Transfer Antar Gudang | `/warehouse/pindah-gudang` | SCR-088 | ❌ route mismatch |
| ... | ... | ... | ❌ route mismatch |

### FinanceSidebar (18 unique hrefs) — **entirely new module**
All 18 entries have no legacy counterpart (e.g. `/finance/bills`, `/finance/invoices`, `/finance/sales-orders`, `/finance/accounting/auto-journal`, `/finance/ar-hub`).

### LegalitySidebar (7 unique hrefs) — **entirely new module**
All 7 entries new (`/legality/dashboard`, `/legality/pipeline`, etc.).

---

## 3. LEGACY → SIDEBAR INVERSE MAPPING

**Only 23 / 176 SCRs reachable from any sidebar**, and **only 1 exact match** (`/bussdev/guest-book` → SCR-094).

| SCR | Legacy nexerpRoute | Actual Sidebar href | Match |
|---|---|---|---|
| SCR-010 | `/executive/dashboard-production-schedule` | `/production/schedule` | ⚠️ wrong page |
| SCR-011 | `/executive/dashboard-finance` | `/finance/dashboard` | ⚠️ wrong page |
| SCR-018 | `/executive/dashboard-production` | `/production` | ⚠️ wrong page |
| SCR-021 | `/rnd/dashboard-rnd` | `/rnd/dashboard` | ⚠️ wrong page |
| SCR-042 | `/master/customer-manage` | `/master/customers` | ⚠️ wrong page |
| SCR-052 | `/master/sales-target` | `/bussdev/sales-target` | ⚠️ wrong page |
| SCR-056 | `/scm/supplier-manage` | `/master/suppliers` | ⚠️ wrong page |
| SCR-058 | `/scm/purchase-approval` | `/approvals/purchase` | ⚠️ wrong page |
| SCR-059 | `/master/sales-approval` | `/approvals/sales` | ⚠️ wrong page |
| SCR-060 | `/rnd/sales-sample-approval` | `/approvals/sales-sample` | ⚠️ wrong page |
| SCR-061 | `/master/goods-request-approval` | `/approvals/goods-request` | ⚠️ wrong page |
| SCR-062 | `/master/request-cogs-approval` | `/approvals/request-cogs` | ⚠️ wrong page |
| SCR-063 | `/scm/purchase-request-approval` | `/approvals/purchase-request` | ⚠️ wrong page |
| SCR-064 | `/scm/purchase-return-approval` | `/approvals/purchase-return` | ⚠️ wrong page |
| SCR-065 | `/master/sales-return-approval` | `/approvals/sales-return` | ⚠️ wrong page |
| SCR-066 | `/qc/checklist` | `/checklist` | ⚠️ wrong page |
| **SCR-094** | **`/bussdev/guest-book`** | **`/bussdev/guest-book`** | ✅ **EXACT MATCH** |
| SCR-096 | `/master/client-lost` | `/bussdev/lost` | ⚠️ wrong page |
| SCR-099 | `/rnd/client-sample` | `/crm/client-sample` | ⚠️ wrong page |
| SCR-100 | `/scm/need-for-goods` | `/scm/kebutuhan-barang` | ⚠️ wrong page |
| SCR-106 | `/scm/purchase-invoice` | `/finance/faktur-pembelian` | ⚠️ wrong page |
| SCR-121 | `/rnd/sales-sample` | `/bussdev/sample-sales` | ⚠️ wrong page |

---

## 4. ROUTE PREFIX INCONSISTENCY

Legacy uses prefixes `/master/*`, `/scm/*`, `/bussdev/*`, `/rnd/*`, `/warehouse/*`, `/qc/*`, `/executive/*`. Actual uses heavily `/finance/*`, `/approvals/*`, `/production/*`, `/hr/*`, `/system/*`, `/marketing/*`, `/design/*`, `/legality/*`, plus small `/master/*` subset.

**Massive drift examples**:
| Legacy Route | Actual Route | SCR examples |
|---|---|---|
| `/master/customer-manage` | `/master/customers` | SCR-040..045 |
| `/master/goods-manage` | `/master/goods` | SCR-027..030 |
| `/master/sales-approval` | `/approvals/sales` | SCR-059, 061, 062, 065 |
| `/scm/purchase-approval` | `/approvals/purchase` | SCR-058, 063, 064 |
| `/scm/purchase-invoice` | `/finance/faktur-pembelian` AND `/finance/bills` | SCR-106 |
| `/scm/purchase-payment` | `/finance/bayar-pembelian` | SCR-107 |
| `/scm/sales-payment` | `/finance/bayar-penjualan` | SCR-118 |
| `/scm/need-for-goods` | `/scm/kebutuhan-barang` | SCR-100..101 |
| `/master/other-deposit` | `/finance/cash-in` | SCR-081 |
| `/master/other-payment` | `/finance/cash-out` | SCR-083 |
| `/master/general-journal` | `/finance/jurnal-umum` AND `/finance/transactions` | SCR-079..080 |
| `/master/asset-register` | `/finance/aset-tetap` AND `/finance/assets` | SCR-024, 078 |
| `/master/coa-manage` | `/finance/accounting/coa` | SCR-031..033 |
| `/master/bank-reconciliation` | `/finance/bank-reconciliation` | SCR-076 |
| `/master/fund-request` | `/finance/fund-requests` | SCR-111..112 |
| `/master/client-escrow` | `/finance/client-escrow` | SCR-077 |
| `/master/closing-checklist` | `/finance/closing` | SCR-070 |
| `/master/delivery-out` | `/warehouse/release` | SCR-086..087 |
| `/master/goods-transfer` | `/warehouse/pindah-gudang` | SCR-088..089 |
| `/master/purchase-in` | `/warehouse/inbound` | SCR-091 |
| `/master/formulation-manage` | (none — only `/rnd/repository`) | SCR-135, 137 |
| `/master/batch-record` | `/production/batch-records` | SCR-131..132 |
| `/master/schedule-mixing` | `/production/schedule?type=mixing` | SCR-140..145 |
| `/master/sales` | `/bussdev/sales-orders` AND `/finance/sales-orders` | SCR-114, 124 |
| `/master/warehouse-manage` | `/master/warehouses` | SCR-034..036 |
| `/master/role-manage` | `/master/personnel` | SCR-046..049 |
| `/qc/checklist` | `/checklist` | SCR-066..073 |
| All `/executive/dashboard-*` | per-module dashboards | SCR-006..020 |

---

## 5. DUPLICATES & GHOSTS

### Sidebar items in MULTIPLE sidebars (10 cross-sidebar overlaps)
- `/finance/dashboard`, `/finance/cash-in`, `/finance/cash-out`, `/finance/dp-pembelian`, `/finance/dp-penjualan`, `/finance/bayar-pembelian`, `/finance/bayar-penjualan`, `/finance/reports`, `/finance/fund-requests`, `/finance/accounting/coa`

### Within-sidebar duplicates (46 hrefs appear 2-5×)
| href | × | Labels |
|---|---|---|
| `/scm/checklist-progress` | 5 | Tracking Progress / Checklist Progress / etc. |
| `/project-control/checklist-tracking` | 5 | Tracking Checklist / etc. |
| `/master/suppliers` | 4 | Vendor Master / Supplier / Supplier & Vendor |
| `/warehouse/stok` | 4 | Stok / Stok Barang & Bahan / Laporan Stok Persediaan |
| `/marketing/omni-crm` | 3 | OmniCRM ×3 |
| `/design/artwork-approval` | 3 | Workspace Design / Artwork / Kelola Desain |
| `/master/goods` | 3 | Barang / Barang / Master Barang & Kategori |
| `/finance/faktur-pembelian` | 3 | Faktur Pembelian ×3 |

### Ghost routes (10 unique hrefs without `page.tsx`)
| Label | href |
|---|---|
| Buku Besar | `/finance/buku-besar` |
| Aset Tetap & Depresiasi | `/finance/aset-tetap` |
| Permintaan HPP | `/scm/hpp-requests` |
| Buku Tamu | `/crm/buku-tamu` |
| Client Sample | `/crm/client-sample` |
| Client Produksi | `/crm/client-produksi` |
| Client RO | `/crm/client-ro` |
| Client Lost | `/crm/client-lost` |
| AR Aging Piutang | `/bussdev/ar-aging` |
| Kelola Pelanggan | `/bussdev/kelola-pelanggan` |

---

## 6. ANSWERS TO CRITICAL ANALYSIS QUESTIONS

1. **All 8 Persetujuan screens present?** ✅ YES but at WRONG ROUTE — all 8 SCR-058..065 appear in MainSidebar but actual URLs do NOT match legacy `nexerpRoute`.
2. **All Master screens (SCR-023..053) accessible?** ❌ NO — only 3 of 31 appear, all via different URLs.
3. **SCM/Warehouse screens properly grouped?** ⚠️ PARTIAL — Warehouse section good; SCM mixes `/scm/*`, `/finance/*`, `/approvals/*`.
4. **All dashboards (SCR-006..022) accessible?** ❌ NO — all 17 legacy department dashboards missing.
5. **TOTAL sidebar count vs legacy screen count?** 135 unique sidebar hrefs vs **176** legacy screens — **76%** of legacy screens have NO sidebar entry.

---

## 7. TOP 5 CRITICAL ISSUES

1. 🔴 **Massive route drift** — 80+ legacy `/master/*` SCRs scattered across `/finance/*`, `/scm/*`, `/bussdev/*`, `/rnd/*`, `/production/*`, `/warehouse/*`, `/approvals/*`, `/system/*`. Any code keying off `nexerpRoute` will fail.
2. 🔴 **Same legacy screen reached by 2-3 URLs** (SCR-042, 056, 099, 100, 106, 121).
3. 🔴 **153 of 176 legacy screens have NO sidebar entry** — most dashboards, all `qc/*`, all `master/general-journal`, all `/create` form pages, 15 of 18 reports.
4. 🔴 **Approval Center restructured** — 8 legacy approvals collapsed into `/approvals/*`.
5. 🔴 **10 sidebar items point to non-existent `page.tsx`** — ghost links cause Next.js 404.

---

## 8. TOP 3 QUICK WINS

1. 🟢 **Fix 10 ghost routes** — create missing `page.tsx` OR rewire sidebar hrefs (≤ 2 jam).
2. 🟢 **Deduplicate 46 within-sidebar duplicates** — collapse to single entries (≤ 1 jam).
3. 🟢 **Decide canonical URL per legacy SCR** — document mapping in `legacy_to_sidebar.tsv` (≤ 1 jam).

---

**Audit completed in ~10 minutes.**
