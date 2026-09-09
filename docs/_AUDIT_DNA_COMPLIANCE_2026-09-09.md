# AGENT-DNA-COMPLIANCE AUDIT REPORT
**Tanggal**: 2026-09-09
**Agent**: Agent-DNA-Compliance (ses_f7962d631ffeGvF4I1xxRNoFuq)
**Scope**: Global DNA component usage (185 operational pages)
**Status**: ✅ COMPLETED

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total operational pages audited | **185** |
| Pages using DNA (✅) | **122** (65.9%) |
| Pages using raw `@/components/ui/*` (❌) | **2** (1.1%) |
| Pages mixing DNA + raw UI (⚠️) | **42** (22.7%) |
| Pages with neither (⚪) | **19** (10.3%) |
| **Global DNA Adoption Rate** | **88.6%** (DNA + Mixed) |
| Pages importing from `@/components/ui/*` | **44** (23.8%) |
| Total raw `<input>` tags | **299** across 76 pages |
| Total raw `<select>` tags | **147** across 78 pages |
| Total raw `<textarea>` tags | **63** across 54 pages |
| Total raw `<table>` tags | **145** across 103 pages |
| Total raw `<input type="date">` | **90** across 50 pages |
| **Confirmed `DnaCell.Badge` English-enum bug instances** | **4** across 4 pages |
| Operational pages using dashboard DNA (forbidden) | **16+** |

---

## 2. ADOPTION BY STATE

| State | Count | % |
|---|---:|---:|
| ✅ DNA only | 122 | 65.9% |
| ⚠️ Mixed | 42 | 22.7% |
| ❌ UI only | 2 | 1.1% |
| ⚪ None | 19 | 10.3% |

---

## 3. RAW UI IMPORTS BY PAGE (TOP OFFENDERS)

| Page | UI Imports | Severity |
|---|---:|---|
| `scm/purchasing/page.tsx` | 7 | 🔴 HIGH |
| `warehouse/workstation/page.tsx` | 6 | 🔴 HIGH |
| `scm/purchase-approval/page.tsx` | 4 | 🟠 MED |
| `finance/fund/page.tsx` | 4 | 🟠 MED |
| `production/operations/page.tsx` | 4 | 🟠 MED |
| `finance/transactions/page.tsx` | 4 | 🟠 MED |
| `rnd/master-inci/page.tsx` | 4 | 🟠 MED |
| `scm/receiving/page.tsx` | 4 | 🟠 MED |
| `user/todo/page.tsx` | 4 | 🔴 HIGH — **zero DNA, 10×DashboardCard leak** |
| `finance/bayar-sample/page.tsx` | 4 | 🟠 MED |
| `warehouse/transfers/page.tsx` | 4 | 🔴 HIGH — zero DNA |
| `warehouse/hub/page.tsx` | 3 | 🔴 HIGH — zero DNA |
| `rnd/lab-test/page.tsx` | 3 | 🟠 MED |

---

## 4. RAW HTML FORM ELEMENTS (TOP 30)

| Page | `<input>` | `<select>` | `<textarea>` | `<table>` | `<input type="date">` |
|---|---:|---:|---:|---:|---:|
| `production/mixing` | 15 | 1 | 2 | 1 | 0 |
| `production/filling` | 13 | 1 | 2 | 1 | 0 |
| `production/packaging` | 13 | 1 | 2 | 1 | 0 |
| `warehouse/gudang` | 13 | 8 | 1 | 3 | 0 |
| `production/work-orders` | 12 | 2 | 2 | 1 | 2 |
| `finance/faktur-pembelian` | 11 | 1 | 1 | 2 | 2 |
| `legality/input` | 1 | 3 | 0 | 0 | **6 (raw date!)** |
| ... | ... | ... | ... | ... | ... |

---

## 5. `DnaCell.Badge` ENGLISH-ENUM BUG (CONFIRMED)

**Root cause**: `frontend/src/components/dna/cells/DnaCell.tsx:76-94`. `getStatusBadgeStyle()` uses `.includes()` keyword matching against Indonesian/English word fragments. Pure English enum strings like `"success"`, `"warning"`, `"critical"`, `"purple"`, `"neutral"` fall through to default slate.

**Confirmed buggy instances: 4**:
| File | Line | Snippet |
|---|---:|---|
| `master/customers/page.tsx` | 952 | `<DnaCell.Badge label=... status="info" />` |
| `master/goods/page.tsx` | 1009 | `<DnaCell.Badge label=... status="info" />` |
| `master/suppliers/page.tsx` | 1008 | `<DnaCell.Badge label=... status="info" />` |
| `master/warehouses/page.tsx` | 891 | `<DnaCell.Badge label=... status="info" />` |

---

## 6. DASHBOARD DNA LEAKS ON OPERATIONAL PAGES (16+)

| Page | `DashboardCard` | `rounded-[24px]` | `var(--border-color)` |
|---|---:|---:|---:|
| `qc/checklist-category` | 0 | 6 | **10** 🔴 |
| `qc/coa` | 0 | 3 | **5** 🔴 |
| `qc/inspections` | 0 | 5 | **3** 🔴 |
| `qc/workbench` | 0 | 0 | **4** 🔴 |
| `qc/checklist/tracking` | 0 | 2 | 2 🟠 |
| `qc/stability` | 0 | 0 | 2 🟠 |
| `user/todo` | **10** 🔴 | 0 | 0 🔴 |
| `logistics/fleet` | 8 | 0 | 0 🔴 |
| `system/audit-ledger` | 6 | 0 | 0 🟠 |
| `automation` | 6 | 0 | 0 🟠 |
| `logistics/outbound` | 5 | 3 | 0 🟠 |
| `my-requests` | 4 | 2 | 0 🟠 |
| `warehouse/workstation` | 0 | 4 | 0 🟠 |

**The entire `qc/` module** is built with Aureon Matrix dashboard DNA on operational pages — **systemic violation**.

---

## 7. TOP 10 BEST & WORST ADOPTERS

### ✅ TOP 10
| Rank | Score | Page |
|---:|---:|---|
| 1 | +73 | `design/artwork-approval` |
| 2 | +60 | `checklist` |
| 3 | +54 | `master/customers` |
| 4 | +50 | `master/goods` |
| 5 | +46 | `master/suppliers` |
| 6 | +40 | `master/warehouses` |
| 7 | +40 | `finance/accounting/coa` |
| 8 | +34 | `bussdev/lost` |
| 9 | +31 | `scm/purchase-requests` |
| 10 | +31 | `bussdev/sample-sales` |

### ❌ BOTTOM 10
| Rank | Score | Page |
|---:|---:|---|
| 1 | −5 | `project-control` |
| 2 | −5 | `kpi-management/individual` |
| 3 | −4 | `user/todo` |
| 4 | −4 | `legality/input` |
| 5 | −3 | `kpi-management/department` |
| 6 | −2 | `kpi-management/settings` |
| 7 | −2 | `warehouse/transfers` |
| 8 | −2 | `rnd/master-inci` |
| 9 | −1 | `bussdev/my-performance` |
| 10 | −1 | `project-control/[projectId]` |

**The entire `kpi-management/` and `project-control/` modules** (8+ pages) have **0% DNA adoption**.

---

## 8. MODULE-LEVEL ADOPTION

| Module | Adopt % | Notes |
|---|---:|---|
| approvals | **100%** | Exemplar |
| finance | 100% | Some still mix raw `ui/table` |
| qc | 100% | But ALL use dashboard DNA (forbidden) |
| legality | 100% | `legality/input` has 6 raw `<input type="date">` |
| design | 100% | `artwork-approval` best adopter |
| rnd | 93.3% | 42 raw `<input>` tags still present |
| scm | 93.8% | `purchasing` is worst single page |
| warehouse | 92.3% | `gudang` has 13 raw `<input>` + 8 raw `<select>` |
| production | 86.7% | 69 raw `<input>` total |
| hr | 83.3% | `recruitment` has 5 raw `<input>` |
| bussdev | 78.6% | `my-performance/pipeline/intake` no DNA |
| master | 62.5% | 4 pages have badge bug |
| **kpi-management** | **0%** | 🔴 Zero DNA |
| **project-control** | **0%** | 🔴 Zero DNA |
| **user/todo** | **0%** | 🔴 Worst single page |

---

## 9. TOP 5 CRITICAL ISSUES

1. 🔴 **`qc/` module is systemic DNA-violator** (4 pages with `rounded-[24px]` + `var(--border-color)`)
2. 🔴 **`legality/input/page.tsx`** has 6 raw `<input type="date">`
3. 🟠 **`DnaCell.Badge` English-enum bug** — 4 master pages silently degraded
4. 🟠 **`scm/purchasing/page.tsx`** has 7 raw UI imports (worst single page)
5. 🟠 **Zero-DNA modules**: `kpi-management/` (5) + `project-control/` (3)

---

## 10. TOP 3 QUICK WINS

1. 🟢 **Fix `DnaCell.Badge` bug** (1 file, ~15 lines) — extend `getStatusBadgeStyle()` with English enum strings. Repairs 4 master pages.
2. 🟢 **Fix `TableWrapper` CSS var** (1 line) — replace `border-[var(--border-color)]` with `border-slate-200`. Repairs ~6 QC pages.
3. 🟢 **Bulk replace `@/components/ui/table` → `DnaTable`** across 39 pages. Lifts 88.6% → ~96%.

---

## 11. ESTIMATED FIX EFFORT

| Effort | Pages | Hours |
|---|---:|---:|
| 🔴 Trivial (badge bug, var fix) | 10 | 1-2 hrs |
| 🟠 Small (swap ui/table, dialog, button) | 25 | 8-12 hrs |
| 🟡 Medium (full re-skin) | 22 | 30-40 hrs |
| 🔵 Large (qc/ full migration) | 6 | 15-20 hrs |
| **TOTAL** | **63 pages** | **~55-75 hrs** |

**Realistic 1-week sprint target**: Fix Top 5 + Quick Wins 1-2 → **88.6% → 96%+** in under 6 hours.
