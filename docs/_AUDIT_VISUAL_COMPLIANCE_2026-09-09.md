# AGENT-VISUAL-COMPLIANCE AUDIT REPORT
**Tanggal**: 2026-09-09
**Agent**: Agent-Visual-Compliance (ses_f7962b84dffebVB2gc5qs8URbM)
**Scope**: VISUAL_DNA 5-layer global audit (227 operational pages)
**Status**: ✅ COMPLETED

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total operational pages audited | **227** |
| Pages using `DnaPageHeader` | 183 (80.6%) ✅ |
| Pages using `DnaKpiGrid`/`DnaStatCard`/`KpiCard` | ~85 (37.4%) ⚠️ |
| Pages using `DnaTabNav` (standalone container) | 64 (28.2%) ❌ |
| Pages using `DnaDataTableCard` | ~150 (66.1%) ✅ |
| Pages with raw `<table>` | 0 ✅ |
| Pages with border opacity variants | 31 (13.7%) ⚠️ |
| Pages with off-scale font sizes | 20 (8.8%) ⚠️ |
| Pages with `tabular-nums` | 138 (60.8%) ✅ |
| **Overall 5-Layer Average Compliance** | **~51%** (mixed) |

**Verdict**: ERP is **~51% compliant** with 5-Layer DNA. Header (L01) and Table (L05) strongest. **Layer 03 Tab Nav and Layer 04 Toolbar severely underspecified**.

---

## 2. 5-LAYER COMPLIANCE

| Layer | Spec | Used By | % |
|---|---|---|---|
| **L01 Header** | `DnaPageHeader` OR raw `text-[32px]` | 183/227 | **80.6%** ✅ |
| **L02 KPI Cards** | `DnaKpiGrid`/`DnaStatCard` | ~85/227 | **37.4%** ⚠️ |
| **L03 Tab Nav** | `DnaTabNav` standalone | 64/227 | **28.2%** ❌ |
| **L04 Toolbar** | `DnaToolbar` dedicated | 3/227 | **1.3%** ❌ |
| **L05 Data Table** | `DnaDataTableCard`/`DnaTable` | ~150/227 | **66.1%** ✅ |

---

## 3. ANTI-PATTERN VIOLATIONS

| Anti-Pattern | Violators |
|---|---|
| ❌ Giant card wrapping all 5 layers | ~10 pages (legality, creative, dashboard) |
| ❌ Traffic-light buttons per row | <5 pages |
| ❌ Random primary buttons in tables | ~20 pages |
| ❌ Mixing 2 info into 1 column | ~30 pages |
| ❌ Hardcoded font sizes outside spec | **20 pages** |
| ❌ Raw `<table>` outside DNA | **0 pages** ✅ |
| ⚠️ Tab-as-prop pattern (no dedicated container) | ~183 pages |

---

## 4. TOKEN DRIFT

### A. Off-Scale Font Sizes
- `text-[26px] md:text-[28px]` in h1 → 183 pages using DnaPageHeader (vs spec 32px)
- `text-[22px]` for KPI → All using DnaKpiCard (vs spec 24px)

### B. Border Opacity Variants (31 pages)
- `border-slate-200/90` — DnaDataTableCard, DnaPageHeader
- `border-slate-200/80` — TableWrapper, DnaStatCard

### C. Border Radius Variants
- `rounded-2xl` in DnaDataTableCard + DnaKpiCard → should be `rounded-xl`

---

## 5. LAYER-BY-LAYER BREAKDOWN (Most Missing)

| Rank | Layer | % Missing | Reason |
|---|---|---|---|
| 🥇 #1 | **L04 DnaToolbar dedicated** | **98.7%** | Component exists but only `dna-visual/page.tsx` demo uses it |
| 🥈 #2 | **L03 DnaTabNav standalone** | **71.8%** | Most use `DnaPageHeader.tabs=[...]` inline |
| 🥉 #3 | **L02 KPI Grid** | **62.6%** | Many list/form pages omit KPI |
| #4 | **L01 Header** | 19.4% | 44 legacy pages still use raw `<h1>` |
| #5 | **L05 Table** | 33.9% | All raw `<table>` properly encapsulated ✅ |

---

## 6. GOLDEN REFERENCE DEVIATION (7 Key Deviations)

| # | Spec | Actual | Severity |
|---|---|---|---|
| 1 | H1 `text-[32px] leading-[40px] font-bold uppercase` | `text-[26px] md:text-[28px] font-black uppercase` | 🔴 **CRITICAL** (183 pages) |
| 2 | Tab Nav container `h-[46px]` standalone row | Tabs inline in header | 🔴 **CRITICAL** |
| 3 | KPI value `text-[24px] leading-[32px] font-bold` | DnaKpiCard uses `text-[22px] font-black leading-none` | 🟡 HIGH |
| 4 | Card border `border-slate-200` (solid) | `border-slate-200/90` & `/80` | 🟡 HIGH |
| 5 | Card radius `rounded-xl` | DnaDataTableCard/DnaKpiCard use `rounded-2xl` | 🟡 HIGH |
| 6 | Card shadow `shadow-2xs` | DnaDataTableCard uses `shadow-xs` | 🟢 MEDIUM |
| 7 | KPI height `h-[104px]` | DnaKpiCard uses `h-[116px]` | 🟢 MEDIUM |

---

## 7. TOP 10 COMPLIANT vs LEAST COMPLIANT

### 🏆 TOP 10 (5/5 layers)
1. `scm/pembelian/page.tsx`
2. `scm/purchase-requests/page.tsx`
3. `scm/kebutuhan-barang/page.tsx`
4. `master/customers/page.tsx`
5. `master/suppliers/page.tsx`
6. `master/warehouses/page.tsx`
7. `bussdev/client-manager/page.tsx`
8. `finance/faktur-pembelian/page.tsx`
9. `finance/faktur-penjualan/page.tsx`
10. `warehouse/inbound/page.tsx`

### 🚨 BOTTOM 10 (0-2/5 layers)
1. `creative/board/page.tsx`
2. `legality/inbox/page.tsx`
3. `legality/permits/page.tsx`
4. `legality/records/page.tsx`
5. `legality/ckpb-audit/page.tsx`
6. `legality/pipeline/page.tsx`
7. `legality/apj-release/page.tsx`
8. `legality/master-inci/page.tsx`
9. `documents/drafts/page.tsx`
10. `production/audit/page.tsx`

---

## 8. TOP 5 CRITICAL ISSUES

1. 🔴 **DnaPageHeader H1 is 26/28px, spec is 32/40px** — affects 183 pages in 1 file edit
2. 🔴 **No standalone Layer 03 container** — tabs inline in header
3. 🔴 **`DnaToolbar`/`DnaTableToolbar` are dead components** — needs UX decision
4. 🟡 **Two competing KPI components** (`DnaKpiCard` 22px/116px vs `DnaStatCard` 24px/104px)
5. 🟡 **44 pages still lack `DnaPageHeader`**

---

## 9. TOP 3 QUICK WINS

| Win | Effort | Impact |
|---|---|---|
| **A. Fix DnaPageHeader.tsx:82** to `text-[32px] leading-[40px] font-bold` | 1 file edit | 183 pages corrected |
| **B. Migrate 8 legality/* legacy pages to DnaDataTableCard** | 8 × 30 min | 8 pages to 4/5 compliance |
| **C. Fix DnaDataTableCard.tsx:53** `rounded-2xl` → `rounded-xl` + `shadow-xs` → `shadow-2xs` | 2 char edits | ~150 pages corrected |

---

## 10. ESTIMATED FIX EFFORT

| Layer | Pages | Hours |
|---|---|---|
| L01 Header | 44 × 5 min | 3.7 hrs |
| L02 KPI | 142 × 15 min | 35 hrs |
| L03 Tab Nav | 163 × 10 min | 27 hrs |
| L04 Toolbar | 224 × 8 min | 30 hrs (after design decision) |
| L05 Table | 77 × 20 min | 25 hrs |
| **TOTAL** | — | **~120 hrs** (3 weeks @ 40hrs/wk) |

**Prerequisite**: Resolve 7 golden-reference deviations FIRST (est. 4 hrs).
