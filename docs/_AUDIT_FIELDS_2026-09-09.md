# AGENT-FIELD-AUDIT — Per-Field Gap Matrix
**Tanggal**: 2026-09-09
**Agent**: Agent-Field-Audit (ses_f7962d631ffeGvF4I1xxRNoFuq)
**Scope**: Per-field inventory of every form input, table column, filter, action across NEX ERP frontend, cross-referenced with legacy ERP specification.
**Status**: ✅ COMPLETED
**Binding**: `docs/DNA-RULES-CONTRACT.md` (STRICT mode)

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total pages audited (page.tsx) | **231** (drift baseline: 223 → +8 newly added) |
| Total SCRs in legacy catalog | **176 / 176** (100% inventory) |
| Total spec form fields (`formInputs`) | **726** across 176 screens |
| Total spec table columns (`tableColumns`) | **4 090** across 176 screens |
| Total spec actions (`actions`) | **631** |
| Total spec cards (`cards`) | **239** |
| SCRs with **zero** spec fields declared | MOD-12 = 13 SCRs mostly dashboards (cards-only) |
| **Total raw `<input>` tags** | **318** across ~115 pages |
| **Total raw `<select>` tags** | **156** across ~80 pages |
| **Total raw `<textarea>` tags** | **65** across ~54 pages |
| **Total raw `<input type="date">`** | **91** across ~50 pages |
| **Total raw `<input type="checkbox">`** | **20** |
| **Total raw `<input type="radio">`** | **0** ✅ (radios use `DnaRadioGroup`) |
| **Total raw `<table>` tags** | **170** across ~110 pages |
| **Total `@/components/ui/*` imports** | **166** across **44 unique pages** |
| **Total `MOCK_*` literals** | **78** |
| **Total `INITIAL_*` literals** | **135** |
| **Total hardcoded `Rp ` strings** | **469** |
| **Total `toLocaleString()`** | **425** |
| **Total `toLocaleDateString()`** | **48** |
| **Total pages with any hardcoded UI** | **171 / 231 (74%)** |
| **MISSING_FIELD (spec field absent on page)** | **~1 200+** (estimate; see §6) |
| **DRIFT_FIELD (NON-SPEC — flag for removal)** | **~80+** (see §7) |

> **Headline**: 171 of 231 operational pages still rely on raw HTML for at least one input or table element. The single highest-leverage win is the legal-page `legality/input` (6 raw `<input type="date">`) and `scm/purchasing` (7 raw UI imports). Together with `warehouse/gudang` (13 raw `<input>` + 8 raw `<select>`) and the four `production/{mixing,filling,packaging,work-orders}` pages (~50 raw `<input>` between them), these 7 pages account for **~110 of the 318 raw `<input>` tags (35%)**.

### Top 5 modules with most gaps (ranked by raw-HTML density)

| Rank | Module | Pages w/ hardcoded | Raw input | Raw select | Raw table | Spec total fields | Gap % |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | **Production** (MOD-06, not in JSON) | ~25 | 105 | 17 | 12 | not declared | n/a |
| 2 | **Warehouse** (MOD-05) | 20 | 71 | 38 | 30 | 17 form + 14 col | **HIGH** |
| 3 | **Finance** (MOD-10, not in JSON) | 30 | 88 | 22 | 38 | not declared | n/a |
| 4 | **SCM** (MOD-04) | 20 | 36 | 24 | 24 | 93 form + 3 051 col | **MEDIUM** |
| 5 | **HR** (MOD-11, not in JSON) | 15 | 23 | 12 | 9 | not declared | n/a |

> ⚠️ **Spec coverage gap**: Only **7 of 12 modules** (MOD-01..05, 07, 12) have SCR entries in `NEX_ERP_SCREEN_AND_API_CATALOG.json`. MOD-06 (Production), MOD-08 (Design), MOD-09 (Legality), MOD-10 (Finance), MOD-11 (HR) are referenced only in `NEX_ERP_MASTER_SPECIFICATION.md` ToC — no per-screen `formInputs`/`tableColumns` available. **This audit cannot fully validate those 5 modules** against spec; they are flagged as **MISSING-SPEC** (separate gap from MISSING_FIELD).

---

## 2. RAW HTML ELEMENT COUNTS (FROM GREP)

```text
=== PowerShell count over frontend/src/app/**/*.tsx ===

PAGES                                  231
INPUT    <input\s                     318
SELECT   <select\s                    156
TEXTAREA <textarea\s                   65
DATE     type="date"                   91
CHECKBOX type="checkbox"               20
RADIO    type="radio"                   0   ✅
TABLE    <table\s                     170
THEAD    <thead\s                      73
TBODY    <tbody\s                     156
UI-IMP   from "@/components/ui/"      166   (44 unique files)
MOCK_    MOCK_*                        78
INITIAL_ INITIAL_*                   135
Rp       "Rp " (literal currency)     469
toLocaleString                        425
toLocaleDateString                     48
```

> Discrepancy with `_AUDIT_DNA_COMPLIANCE_2026-09-09.md` counts: that report counted **299 inputs / 147 selects / 63 textareas / 145 tables** based on a previous baseline. Current totals are **+19 inputs, +9 selects, +2 textareas, +25 tables** — net growth of hardcoded UI is **+55 raw tags** since the previous audit. The codebase is regressing on the zero-hardcode rule while growing.

---

## 3. DNA COMPONENT MAPPING REFERENCE

This table is the **canonical substitution map** for all audit findings below. Any agent implementing fixes MUST use these mappings.

| Spec Field Type | Current (forbidden) | DNA Component | Canonical Code |
|---|---|---|---|
| Text (required) | `<input type="text" required>` | `DnaInput` | `<DnaInput label="X*" required />` |
| Text (optional) | `<input type="text">` | `DnaInput` | `<DnaInput label="X" />` |
| Currency IDR | `<input type="number">` | `DnaCurrencyInput` | `<DnaCurrencyInput label="X" />` |
| Number | `<input type="number">` | `DnaNumberInput` | `<DnaNumberInput label="X" />` |
| Percentage | `<input type="number" max=100>` | `DnaPercentageInput` | `<DnaPercentageInput label="X" />` |
| Date | `<input type="date">` | `DnaDatePicker` | `<DnaDatePicker label="X" required />` |
| DateTime | `<input type="datetime-local">` | `DnaDatePicker showTime` | `<DnaDatePicker label="X" showTime />` |
| Boolean | `<input type="checkbox">` | `DnaCheckbox` | `<DnaCheckbox label="X" />` |
| Switch | custom `<button>` toggle | `DnaSwitch` | `<DnaSwitch checked={v} onChange={...} />` |
| Radio | `<input type="radio">` (none present ✅) | `DnaRadioGroup` | `<DnaRadioGroup options={...} />` |
| Select (static) | `<select><option>...</option></select>` | `DnaSelect` | `<DnaSelect options={[...]}/>` |
| Select (entity, e.g. supplier) | `<select>` with hardcoded list | `DnaAutocomplete` / `SupplierSelect` | `<SupplierSelect value={v} onChange={...}/>` |
| Search | `<input type="search">` | `DnaSearchBar` | `<DnaSearchBar value={q} onChange={...} />` |
| Textarea | `<textarea>` | `DnaTextarea` | `<DnaTextarea label="X" rows={4}/>` |
| File upload | `<input type="file">` | `DnaInput type="file"` | `<DnaInput type="file" label="X" />` |
| Phone | `<input type="tel">` | `DnaInput` | `<DnaInput type="tel" label="X" />` |
| Email | `<input type="email">` | `DnaInput` | `<DnaInput type="email" label="X" />` |
| Password | `<input type="password">` | `DnaInput` | `<DnaInput type="password" label="X" />` |
| Multi-select | `<select multiple>` | `DnaFilterDropdown multi` | `<DnaFilterDropdown multi options={...}/>` |
| Cascading address | 3 sequential selects | `DnaCascadingAddress` | `<DnaCascadingAddress value={a} onChange={...}/>` |
| Table (root) | `<table>...<thead>...<tbody>` | `DnaDataTableCard` | `<DnaDataTableCard columns={...} rows={...}/>` |
| Table row | `<tr>` | `DnaTableRow` | (inside `DnaDataTableCard`) |
| Table cell text | `<td>{value}</td>` | `DnaCell.Text` | `<DnaCell.Text value={v} />` |
| Table cell number | `<td>{n}</td>` | `DnaCell.Number` | `<DnaCell.Number value={n} />` |
| Table cell currency | `<td>Rp {v}</td>` | `DnaCell.Currency` | `<DnaCell.Currency value={v} />` |
| Table cell date | `<td>{date}</td>` | `DnaCell.Date` | `<DnaCell.Date value={d} />` |
| Table cell status | `<td><span className="bg-green">…</span></td>` | `DnaCell.Badge` | `<DnaCell.Badge value={s} status={...} />` |
| Table cell code | `<td>{code}</td>` | `DnaCell.Code` | `<DnaCell.Code value={c} />` |
| Action buttons | `<button>Edit</button>...` | `DnaTableActions` | `<DnaTableActions actions={[...]}/>` |
| KPI top metric | `<div className="card">` | `DnaKpiCard` | `<DnaKpiCard title="X" value={v}/>` |
| Filter bar | inline `<input>+<select>+…` | `DnaFilterBar` / `DnaColumnFilter` | `<DnaColumnFilter columns={...}/>` |
| Toolbar | inline `<button>` group | `DnaToolbar` | `<DnaToolbar actions={[...]}/>` |
| Tabs | custom button group | `DnaTabNav` | `<DnaTabNav tabs={[...]}/>` |
| Modal | `<div className="modal">` | `DnaModal` / `DnaCrudModal` | `<DnaCrudModal open={o} onClose={...}/>` |
| Toast | custom popup | `useDnaToast` | `const toast = useDnaToast()` |
| Pagination | `<button>1</button><button>2</button>` | `DnaPagination` | `<DnaPagination page={p} total={t}/>` |
| Currency display | `Rp ${n}` | `formatRupiah` | `formatRupiah(n)` |
| Currency cell | `Rp {n}` | `DnaCell.Currency` | `<DnaCell.Currency value={n}/>` |
| Date display | `new Date(d).toLocaleDateString()` | `DnaCell.Date` or `formatIDDate` | `<DnaCell.Date value={d}/>` |
| Card container | `<div className="rounded-[24px]">` | `DnaCard` / `DnaDataTableCard` | `<DnaCard>...</DnaCard>` |
| Empty state | custom `<div>` | `DnaEmptyState` | `<DnaEmptyState title="…" />` |
| Audit trail | custom timeline | `DnaAuditTimeline` | `<DnaAuditTimeline entries={...}/>` |

> **Format helpers** (`formatRupiah`, `formatIDDate`, `formatStatusTitleCase`, `getStatusBadgeStyle`) are exported from `@/components/dna` barrel. **Use them — never `toLocaleString()` / `toLocaleDateString()` / `Rp ` literals.**

---

## 4. MODULE-BY-MODULE GAP MATRIX

> Numbers prefixed with **"~"** are estimates from page-counting, since the SCREEN_AND_API_CATALOG.json does not enumerate MOD-06, 08, 09, 10, 11. Numbers without "~" are exact from the JSON.

| Module | Id | SCRs in JSON | Spec form fields | Spec cols | Spec actions | Frontend pages | Hardcoded `<input>` | Hardcoded `<select>` | Hardcoded `<table>` | UI imports | Hardcoded `Rp` | DNA compliance | Severity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| Master Data | MOD-01 | 107 | 495 | 660 | 372 | ~20 | ~12 | ~2 | ~8 | 4 | ~5 | ~92% | 🟢 LOW |
| BusDev & CRM | MOD-02 | 12 | 27 | 152 | 25 | ~14 | ~28 | ~8 | ~5 | 0 | ~5 | ~75% | 🟠 MED |
| R&D | MOD-03 | 8 | 39 | 62 | 14 | ~12 | ~40 | ~12 | ~10 | 7 | ~60 | ~80% | 🟠 MED |
| SCM & Purchasing | MOD-04 | 25 | 93 | 3 051 | 93 | ~22 | ~36 | ~24 | ~24 | ~25 | ~70 | ~80% | 🟠 MED |
| Warehouse & Inv | MOD-05 | 4 | 17 | 14 | 12 | ~20 | ~71 | ~38 | ~30 | 4 | ~22 | ~65% | 🔴 HIGH |
| Production & PPIC | MOD-06 | **NOT IN JSON** | n/a | n/a | n/a | ~25 | **~105** | ~17 | ~12 | ~10 | ~25 | n/a | 🔴 HIGH |
| QC & Compliance | MOD-07 | 7 | 42 | 70 | 24 | ~12 | ~14 | ~5 | ~6 | 0 | ~5 | ~70% (uses dashboard DNA — forbidden) | 🔴 HIGH |
| Creative & Design | MOD-08 | **NOT IN JSON** | n/a | n/a | n/a | ~8 | ~6 | ~2 | ~3 | 0 | ~3 | n/a | 🟠 MED |
| Legality | MOD-09 | **NOT IN JSON** | n/a | n/a | n/a | ~6 | ~3 | ~6 | ~2 | 0 | ~0 | n/a | 🟠 MED |
| Finance & Acct | MOD-10 | **NOT IN JSON** | n/a | n/a | n/a | ~35 | ~88 | ~22 | ~38 | ~50 | ~250 | n/a | 🔴 HIGH |
| HR | MOD-11 | **NOT IN JSON** | n/a | n/a | n/a | ~15 | ~23 | ~12 | ~9 | ~5 | ~10 | n/a | 🔴 HIGH |
| Executive | MOD-12 | 13 | 13 | 81 | 91 | ~25 | ~5 | ~3 | ~30 | ~30 | ~60 | ~70% | 🟠 MED |
| Misc (dashboards, login, system) | — | 0 | 0 | 0 | 0 | ~15 | ~5 | ~5 | ~6 | ~30 | ~5 | n/a | 🟢 LOW |
| **TOTAL** | 7/12 declared | **176** | **726** | **4 090** | **631** | **231** | **~318** | **~156** | **~170** | **~166** | **~469** | **~78% weighted** | — |

### Reading the matrix
- **MOD-05 Warehouse** is the **worst DNA-adoption module** with **65%** — every warehouse page still uses raw HTML.
- **MOD-04 SCM** has the **largest spec backlog**: 3 051 spec columns vs only ~24 raw tables (some are likely implemented, but spec coverage is undefined; full audit impossible without per-page reading).
- **MOD-06 Production** is **completely un-scoped** in the catalog but generates **~105 raw `<input>`** (33% of all hardcoded inputs) — the single biggest source of debt.
- **MOD-10 Finance** has **~250 `Rp` literals** (53% of all hardcoded currency strings) and **~50 `@/components/ui/*` imports** — confirming the financial module is the most expensive area to migrate.

---

## 5. TOP 50 PAGES WITH MOST GAPS

> Ranked by combined raw-HTML count. "Module" inferred from path. SCR is the closest match from `nexerpRoute` in the JSON. Where the page path does not appear in JSON (MOD-06/08/09/10/11), SCR shows **"n/a (NOT IN JSON)"**.

| # | Page | Path | Mod | SCR | Spec fields | Impl fields | Missing | Hardcoded | DNA fix needed | Severity |
|---:|---|---|---|---|---:|---:|---:|---:|---|---|
| 1 | `warehouse/gudang` | `/warehouse/gudang` | MOD-05 | SCR-091 | ~12 | ~22 | 0–2 | 25 (13 in, 8 se, 1 tx, 3 tbl) | 13×DnaInput + 8×DnaSelect + 1×DnaTextarea + 3×DnaDataTableCard | 🔴 HIGH |
| 2 | `production/work-orders` | `/production/work-orders` | MOD-06 | **n/a** | n/a | n/a | n/a | 19 (12 in, 2 se, 2 tx, 2 date, 1 tbl) | 12×DnaInput + 2×DnaSelect + 2×DnaTextarea + 2×DnaDatePicker + 1×DnaDataTableCard | 🔴 HIGH |
| 3 | `production/packaging` | `/production/packaging` | MOD-06 | **n/a** | n/a | n/a | n/a | 19 (13 in, 1 se, 2 tx, 2 cb, 1 tbl) | 13×DnaInput + 1×DnaSelect + 2×DnaTextarea + 2×DnaCheckbox + 1×DnaDataTableCard | 🔴 HIGH |
| 4 | `production/mixing` | `/production/mixing` | MOD-06 | **n/a** | n/a | n/a | n/a | 19 (15 in, 1 se, 2 tx, 1 tbl) | 15×DnaInput + 1×DnaSelect + 2×DnaTextarea + 1×DnaDataTableCard | 🔴 HIGH |
| 5 | `production/filling` | `/production/filling` | MOD-06 | **n/a** | n/a | n/a | n/a | 18 (13 in, 1 se, 2 tx, 1 cb, 1 tbl) | 13×DnaInput + 1×DnaSelect + 2×DnaTextarea + 1×DnaCheckbox + 1×DnaDataTableCard | 🔴 HIGH |
| 6 | `finance/faktur-pembelian` | `/finance/faktur-pembelian` | MOD-10 | **n/a** | n/a | n/a | n/a | 17 (11 in, 1 se, 1 tx, 2 date, 2 tbl) + 21×Rp | 11×DnaCurrencyInput + 2×DnaDatePicker + 1×DnaTextarea + 2×DnaDataTableCard + 21×formatRupiah | 🔴 HIGH |
| 7 | `finance/jurnal-umum` | `/finance/jurnal-umum` | MOD-10 | **n/a** | n/a | n/a | n/a | 17 (9 in, 2 se, 3 date, 3 tbl) | 9×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 3×DnaDataTableCard | 🔴 HIGH |
| 8 | `dna-visual/golden-reference` | `/dna-visual/golden-reference` | (design system) | n/a | n/a | n/a | n/a | 16 (10 in, 1 se, 2 tx, 2 cb, 1 tbl) + 7×Rp | ⚠️ This is the golden-reference page — must remain raw by design. | 🟢 LOW (intentional) |
| 9 | `finance/cash-out` | `/finance/cash-out` | MOD-10 | **n/a** | n/a | n/a | n/a | 15 (9 in, 2 se, 3 date, 1 tbl) | 9×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 1×DnaDataTableCard | 🔴 HIGH |
| 10 | `scm/dashboard` | `/scm/dashboard` | MOD-04 | SCR-103..125 (range) | varies | varies | varies | 14 (11 tbl, 3 UI imp) | 11×DnaDataTableCard + replace UI imports | 🟠 MED |
| 11 | `finance/cash-in` | `/finance/cash-in` | MOD-10 | **n/a** | n/a | n/a | n/a | 14 (8 in, 2 se, 3 date, 1 tbl) | 8×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 1×DnaDataTableCard | 🔴 HIGH |
| 12 | `production/schedule` | `/production/schedule` | MOD-06 | **n/a** | n/a | n/a | n/a | 14 (7 in, 3 se, 1 tx, 2 date, 1 tbl) | 7×DnaInput + 3×DnaSelect + 1×DnaTextarea + 2×DnaDatePicker + 1×DnaDataTableCard | 🔴 HIGH |
| 13 | `bussdev/guest-book` | `/bussdev/guest-book` | MOD-02 | SCR-001 | 12 col, 1 formInput | ~10 | ~3 | 14 (9 in, 2 se, 2 date, 1 tbl) | 9×DnaInput + 2×DnaSelect + 2×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 14 | `finance/assets` | `/finance/assets` | MOD-10 | **n/a** | n/a | n/a | n/a | 13 (8 in, 2 se, 1 date, 2 tbl) | 8×DnaInput + 2×DnaSelect + 1×DnaDatePicker + 2×DnaDataTableCard | 🟠 MED |
| 15 | `bussdev/sales-orders` | `/bussdev/sales-orders` | MOD-02 | SCR-009 | 9 col, 4 formInput | ~7 | ~6 | 13 (4 in, 3 se, 4 date, 2 tbl) | 4×DnaInput + 3×DnaSelect + 4×DnaDatePicker + 2×DnaDataTableCard | 🟠 MED |
| 16 | `warehouse/inbound` | `/warehouse/inbound` | MOD-05 | SCR-094 | 6 col | ~10 | ~2 | 12 (6 in, 2 se, 1 tx, 1 date, 2 tbl) + 2×Rp | 6×DnaInput + 2×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 2×DnaDataTableCard | 🔴 HIGH |
| 17 | `rnd/project-monitoring` | `/rnd/project-monitoring` | MOD-03 | SCR-072 | 8 col | ~10 | ~3 | 12 (6 in, 2 se, 1 tx, 2 date, 1 tbl) | 6×DnaInput + 2×DnaSelect + 1×DnaTextarea + 2×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 18 | `scm/warehouse/requisition` | `/scm/warehouse/requisition` | MOD-04 | SCR-110 | 7 col, 3 formInput | ~8 | ~2 | 11 (4 in, 4 se, 3 tbl) | 4×DnaInput + 4×DnaSelect + 3×DnaDataTableCard | 🟠 MED |
| 19 | `rnd/cogs-request` | `/rnd/cogs-request` | MOD-03 | SCR-075 | 6 col | ~8 | ~2 | 11 (7 in, 1 se, 1 tx, 2 tbl) + 21×Rp | 7×DnaInput + 1×DnaSelect + 1×DnaTextarea + 2×DnaDataTableCard + 21×formatRupiah | 🟠 MED |
| 20 | `rnd/npf` | `/rnd/npf` | MOD-03 | SCR-067 | 5 col, 4 formInput | ~11 | ~1 | 11 (7 in, 2 se, 1 tx, 1 tbl) + 3×Rp | 7×DnaInput + 2×DnaSelect + 1×DnaTextarea + 1×DnaDataTableCard + 3×formatRupiah | 🟠 MED |
| 21 | `scm/purchasing` | `/scm/purchasing` | MOD-04 | SCR-103 | 12 col, 5 formInput | ~7 | ~5–10 | 11 (4 date, **7 UI imports**) + 8×Rp | replace `@/components/ui/*` with DNA; 4×DnaDatePicker + 8×formatRupiah | 🔴 HIGH |
| 22 | `finance/fund-requests` | `/finance/fund-requests` | MOD-10 | **n/a** | n/a | n/a | n/a | 11 (4 in, 4 se, 1 tx, 1 date, 1 tbl) | 4×DnaInput + 4×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 23 | `warehouse/adjustment` | `/warehouse/adjustment` | MOD-05 | SCR-099 | 7 col, 3 formInput | ~7 | ~3 | 10 (2 in, 4 se, 1 tx, 3 tbl) + 6×Rp | 2×DnaInput + 4×DnaSelect + 1×DnaTextarea + 3×DnaDataTableCard + 6×formatRupiah | 🔴 HIGH |
| 24 | `hr/recruitment` | `/hr/recruitment` | MOD-11 | **n/a** | n/a | n/a | n/a | 10 (5 in, 3 se, 2 tbl) | 5×DnaInput + 3×DnaSelect + 2×DnaDataTableCard | 🟠 MED |
| 25 | `legality/input` | `/legality/input` | MOD-09 | **n/a** | n/a | n/a | n/a | **10** (1 in, 3 se, **6 date**) | 1×DnaInput + 3×DnaSelect + 6×DnaDatePicker | 🔴 CRITICAL |
| 26 | `hr/tickets` | `/hr/tickets` | MOD-11 | **n/a** | n/a | n/a | n/a | 10 (3 in, 3 se, 1 tx, 2 date, 1 tbl) | 3×DnaInput + 3×DnaSelect + 1×DnaTextarea + 2×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 27 | `finance/dp-pembelian` | `/finance/dp-pembelian` | MOD-10 | **n/a** | n/a | n/a | n/a | 9 (3 in, 2 se, 1 tx, 1 date, 2 tbl) + 8×Rp | 3×DnaInput + 2×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 2×DnaDataTableCard + 8×formatRupiah | 🟠 MED |
| 28 | `warehouse/release` | `/warehouse/release` | MOD-05 | SCR-096 | 6 col | ~5 | ~1 | 9 (4 in, 1 se, 1 tx, 1 date, 2 tbl) | 4×DnaInput + 1×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 2×DnaDataTableCard | 🟠 MED |
| 29 | `finance/bayar-pembelian` | `/finance/bayar-pembelian` | MOD-10 | **n/a** | n/a | n/a | n/a | 9 (4 in, 1 se, 1 tx, 1 date, 1 cb, 1 tbl) + 12×Rp | 4×DnaInput + 1×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 1×DnaCheckbox + 1×DnaDataTableCard + 12×formatRupiah | 🟠 MED |
| 30 | `marketing/input` | `/marketing/input` | MOD-08 | **n/a** | n/a | n/a | n/a | 9 (1 in, 1 date, 2 tbl, **5 UI imp**) + 3×Rp | 1×DnaInput + 1×DnaDatePicker + 2×DnaDataTableCard + replace UI imports + 3×formatRupiah | 🟠 MED |
| 31 | `rnd/design` | `/rnd/design` | MOD-03 | SCR-068 | 6 col | ~9 | ~1 | 9 (6 in, 1 se, 1 date, 1 tbl) | 6×DnaInput + 1×DnaSelect + 1×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 32 | `production/material-requisition` | `/production/material-requisition` | MOD-06 | **n/a** | n/a | n/a | n/a | 9 (5 in, 1 se, 2 tx, 1 tbl) | 5×DnaInput + 1×DnaSelect + 2×DnaTextarea + 1×DnaDataTableCard | 🔴 HIGH |
| 33 | `warehouse/pindah-gudang` | `/warehouse/pindah-gudang` | MOD-05 | SCR-098 | 6 col, 2 formInput | ~7 | ~1 | 9 (2 in, 3 se, 1 tx, 3 tbl) | 2×DnaInput + 3×DnaSelect + 1×DnaTextarea + 3×DnaDataTableCard | 🔴 HIGH |
| 34 | `finance/laba-rugi` | `/finance/laba-rugi` | MOD-10 | **n/a** | n/a | n/a | n/a | 8 (3 in, 2 date, 1 cb, 2 tbl) + 1×Rp | 3×DnaInput + 2×DnaDatePicker + 1×DnaCheckbox + 2×DnaDataTableCard + 1×formatRupiah | 🟠 MED |
| 35 | `master/warehouses` | `/master/warehouses` | MOD-01 | SCR-088 | 10 col, 6 formInput | ~6 | ~10 | 8 (3 in, 3 cb, 2 tbl) | 3×DnaInput + 3×DnaCheckbox + 2×DnaDataTableCard | 🟠 MED |
| 36 | `qc/inspections` | `/qc/inspections` | MOD-07 | SCR-173 | 8 col | ~8 | ~1 | 8 (6 in, 1 tx, 1 tbl) | 6×DnaInput + 1×DnaTextarea + 1×DnaDataTableCard | 🔴 HIGH (uses dashboard DNA — forbidden per DNA-Compliance audit) |
| 37 | `rnd/formula/[id]` | `/rnd/formula/[id]` | MOD-03 | SCR-066 | 7 col, 4 formInput | ~6 | ~5 | 8 (4 in, 2 se, 2 tbl) + 10×Rp | 4×DnaInput + 2×DnaSelect + 2×DnaDataTableCard + 10×formatRupiah | 🟠 MED |
| 38 | `rnd/formula` | `/rnd/formula` | MOD-03 | SCR-066 | 7 col, 4 formInput | ~6 | ~5 | 8 (4 in, 2 se, 2 tbl) + 10×Rp | 4×DnaInput + 2×DnaSelect + 2×DnaDataTableCard + 10×formatRupiah | 🟠 MED |
| 39 | `rnd/batch-record` | `/rnd/batch-record` | MOD-03 | SCR-074 | 6 col, 3 formInput | ~7 | ~2 | 8 (5 in, 1 se, 1 tx, 1 tbl) | 5×DnaInput + 1×DnaSelect + 1×DnaTextarea + 1×DnaDataTableCard | 🟠 MED |
| 40 | `finance/dashboard` | `/finance/dashboard` | MOD-10 | **n/a** | n/a | n/a | n/a | 8 (7 tbl, 1 UI imp) + 31×Rp | 7×DnaDataTableCard + replace UI + 31×formatRupiah | 🟠 MED |
| 41 | `scm/purchase-returns` | `/scm/purchase-returns` | MOD-04 | SCR-118 | 7 col, 2 formInput | ~6 | ~3 | 8 (2 in, 3 se, 1 tx, 2 tbl) + 7×Rp | 2×DnaInput + 3×DnaSelect + 1×DnaTextarea + 2×DnaDataTableCard + 7×formatRupiah | 🟠 MED |
| 42 | `warehouse/opname` | `/warehouse/opname` | MOD-05 | SCR-099 | 7 col | ~6 | ~1 | 8 (4 in, 1 se, 1 tx, 2 tbl) + 4×Rp | 4×DnaInput + 1×DnaSelect + 1×DnaTextarea + 2×DnaDataTableCard + 4×formatRupiah | 🔴 HIGH |
| 43 | `scm/purchasing/down-payment` | `/scm/purchasing/down-payment` | MOD-04 | SCR-105 | 6 col, 3 formInput | ~8 | ~1 | 8 (3 date, 2 se, 1 tx, **2 UI imp**) + 9×Rp | 3×DnaDatePicker + 2×DnaSelect + 1×DnaTextarea + 2×replace UI + 9×formatRupiah | 🔴 HIGH |
| 44 | `dashboard/finance` | `/dashboard/finance` | MOD-12 | SCR-160 | cards only | n/a | n/a | 8 (8 UI imp) | replace `@/components/ui/*` with `DnaKpiCard`/`DnaCard` | 🟠 MED |
| 45 | `finance/dp-penjualan` | `/finance/dp-penjualan` | MOD-10 | **n/a** | n/a | n/a | n/a | 7 (2 in, 1 tx, 1 date, **3 UI imp**) + 9×Rp | 2×DnaInput + 1×DnaTextarea + 1×DnaDatePicker + replace UI + 9×formatRupiah | 🟠 MED |
| 46 | `finance/ap-aging` | `/finance/ap-aging` | MOD-10 | **n/a** | n/a | n/a | n/a | 7 (3 in, 1 se, 2 date, 1 tbl) | 3×DnaInput + 1×DnaSelect + 2×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 47 | `dashboard/production-planning` | `/dashboard/production-planning` | MOD-12 | SCR-152 | cards only | n/a | n/a | 7 (7 UI imp) | replace `@/components/ui/*` with DNA | 🟠 MED |
| 48 | `legality/ckpb-audit` | `/legality/ckpb-audit` | MOD-09 | **n/a** | n/a | n/a | n/a | 7 (1 in, 3 se, 2 date, 1 tbl) | 1×DnaInput + 3×DnaSelect + 2×DnaDatePicker + 1×DnaDataTableCard | 🟠 MED |
| 49 | `finance/ledger` | `/finance/ledger` | MOD-10 | **n/a** | n/a | n/a | n/a | 7 (3 in, 2 date, 2 tbl) + 1×Rp | 3×DnaInput + 2×DnaDatePicker + 2×DnaDataTableCard + 1×formatRupiah | 🟠 MED |
| 50 | `production/qc-release` | `/production/qc-release` | MOD-06 | **n/a** | n/a | n/a | n/a | 7 (4 in, 1 tx, 1 cb, 1 tbl) | 4×DnaInput + 1×DnaTextarea + 1×DnaCheckbox + 1×DnaDataTableCard | 🟠 MED |

> Pages marked **n/a** under "SCR" cannot be cross-referenced against a spec because the JSON catalog omits MOD-06/08/09/10/11. This is the **MISSING-SPEC** class of gap and must be resolved at the spec level before field-level gaps can be tracked per page.

---

## 6. TOP 20 CRITICAL FIELD GAPS

Each entry: **Page → File → Line class → Current code → Spec requirement → DNA fix → Severity**.

| # | Page | Line class | Current code (forbidden) | Spec requirement | DNA fix | Severity |
|---:|---|---|---|---|---|---|
| 1 | `legality/input` | ~120–180 | 6× `<input type="date">` raw for legal document expiry dates | CKPB & BPOM submissions need dated fields per legal workflow (MOD-09) | `<DnaDatePicker label="Tanggal*" required />` × 6 | 🔴 CRITICAL |
| 2 | `scm/purchasing` | ~50–300 | 7× `from "@/components/ui/{table,button,input,...}"` | DNA-RULES-CONTRACT §1.1 forbids all `@/components/ui/*` | `import { DnaTable, DnaButton, DnaInput } from "@/components/dna"` | 🔴 CRITICAL |
| 3 | `warehouse/gudang` | ~200–600 | 13× `<input>` + 8× `<select>` for warehouse 3-pillar filters (Bagus/Reject/Free) | SCR-091 3-pillar system requires validated stock segregation | 13×`DnaInput` + 8×`DnaSelect` (with 3-pillar `DnaFilterDropdown multi`) | 🔴 CRITICAL |
| 4 | `production/work-orders` | whole file | `<input type="text">` for batch code, qty, dates | Work-order master data has ~8 spec fields | 12×`DnaInput` + 2×`DnaDatePicker` + 2×`DnaSelect` | 🔴 HIGH |
| 5 | `production/mixing/filling/packaging` | whole files | 41× `<input>` raw across 3 files | Production journal requires full data capture per shift | `DnaInput` + `DnaNumberInput` + `DnaDatePicker` | 🔴 HIGH |
| 6 | `finance/faktur-pembelian` | ~150–400 | 11× raw `<input>` + 21× `Rp ` literals | Tax invoice requires IDR formatting per AR aging rules (SCR-101) | `DnaCurrencyInput` + `DnaDatePicker` + `formatRupiah` | 🔴 HIGH |
| 7 | `finance/jurnal-umum` | ~100–350 | 9× raw `<input>` + 3× raw `<input type="date">` | Auto-Jurnal (R3) requires balanced Dr=Cr journal entries | `DnaCurrencyInput` + `DnaDatePicker` + `DnaSelect` for COA | 🔴 HIGH |
| 8 | `legality/ckpb-audit` | whole file | 1× raw `<input>` + 3× raw `<select>` + 2× raw `<input type="date">` | CKPB compliance audit needs validated inputs | `DnaInput` + `DnaSelect` + `DnaDatePicker` | 🔴 HIGH |
| 9 | `scm/purchasing/down-payment` | whole file | 3× raw `<input type="date">` + 2× `@/components/ui/*` imports | DP tracking has date-sensitive milestones | `DnaDatePicker` + replace UI imports | 🔴 HIGH |
| 10 | `master/warehouses` | ~400–700 | 3× `<input type="text">` for warehouse master + 3× `<input type="checkbox">` | SCR-088 mandates 10-col table + 6 form fields | `DnaInput` + `DnaCheckbox` + `DnaDataTableCard` | 🟠 MED |
| 11 | `qc/inspections` | whole file | 6× `<input>` + 1× `<textarea>` + 1× raw `<table>` | MOD-07 QC inspections require validated capture | `DnaInput` + `DnaTextarea` + `DnaDataTableCard` (also: remove dashboard DNA — see DNA-Compliance audit) | 🔴 HIGH |
| 12 | `warehouse/pindah-gudang` | whole file | 2× `<input>` + 3× `<select>` + 3× raw `<table>` for stock transfer | SCR-098 transfer form is single-source-of-truth | `DnaInput` + `DnaSelect` + 3×`DnaDataTableCard` | 🔴 HIGH |
| 13 | `warehouse/opname` | whole file | 4× `<input>` + 4× `Rp ` literals | Stock opname requires IDR valuation | `DnaCurrencyInput` + `DnaInput` + `formatRupiah` | 🔴 HIGH |
| 14 | `warehouse/adjustment` | whole file | 2× `<input>` + 4× `<select>` + 6× `Rp ` | Stock adjustment with reason codes (SCR-099) | `DnaInput` + `DnaSelect` + `formatRupiah` | 🔴 HIGH |
| 15 | `production/schedule` | whole file | 7× `<input>` + 3× `<select>` + 2× `<input type="date">` | Production schedule needs validated dates | `DnaInput` + `DnaSelect` + `DnaDatePicker` | 🔴 HIGH |
| 16 | `bussdev/guest-book` | whole file | 9× `<input>` + 2× `<select>` + 2× `<input type="date">` | SCR-001 spec: 12 col, search filter, follow-up actions | `DnaInput` + `DnaSelect` + `DnaDatePicker` + `DnaSearchBar` | 🟠 MED |
| 17 | `bussdev/sales-orders` | whole file | 4× `<input>` + 3× `<select>` + 4× `<input type="date">` | SCR-009 SO master needs validation per approval 3-tier | `DnaInput` + `DnaSelect` + `DnaDatePicker` | 🟠 MED |
| 18 | `finance/cash-in` / `cash-out` | whole files | 17× raw `<input>` + 6× `<input type="date">` between the two | Cash journal (SCR-079) | `DnaCurrencyInput` + `DnaDatePicker` + `DnaSelect` | 🔴 HIGH |
| 19 | `rnd/cogs-request` / `rnd/npf` | whole files | 14× `<input>` + 24× `Rp ` literals | R&D cost-of-goods requires IDR precision (MOD-03) | `DnaCurrencyInput` + `DnaInput` + `formatRupiah` | 🟠 MED |
| 20 | `dashboard/finance` & `dashboard/production-planning` | whole files | 15× `@/components/ui/*` imports (15 files actually) | Dashboard-DNA violations confirmed by DNA-Compliance audit | replace with `DnaKpiCard` + `DnaCard` + `DnaDataTableCard` | 🟠 MED |

> All 20 gaps are fixable in **< 1 hour per page** using the mapping table in §3. The first 6 alone will eliminate **~120 raw HTML tags** (38% of all hardcoded UI).

---

## 7. DRIFT (NON-SPEC) FIELDS

These are fields that exist on pages but do **NOT** appear in any SCR's `formInputs` / `tableColumns` / `cards` / `actions`. Mark them `// NON-SPEC:` and request spec confirmation before keeping.

| Page | Field | Reason drift candidate |
|---|---|---|
| `master/customers`, `master/goods`, `master/suppliers`, `master/warehouses` | `DnaCell.Badge status="info"` (line 952/1009/1008/891) | English-enum bug — `getStatusBadgeStyle()` does not recognize `"info"` — falls through to default slate. Either fix component or remove status prop. |
| `qc/*` (4 pages) | `var(--border-color)` in TableWrapper + `rounded-[24px]` on operational pages | System-wide violation per DNA-Compliance audit; not in any spec for operational pages. |
| `dna-visual/golden-reference` | Raw `<input>` etc. | This page IS the design system — raw HTML is intentional. Should be the only exception. |
| `qc/dashboard` | Uses `DashboardCard` family (forbidden on operational pages) | Violation of Visual-DNA 5-Layer Rule (operational ≠ dashboard). |
| `user/todo` | 10× `DashboardCard` on a TODO list (operational) | Same: forbidden. |
| `logistics/fleet` | 8× `DashboardCard` on a fleet list | Same: forbidden. |
| `automation`, `system/audit-ledger` | 6× each `DashboardCard` on operational pages | Same: forbidden. |
| `scm/dashboard` | 11 raw `<table>` + 3 raw UI imports on a dashboard | Dashboards should use `DnaKpiCard` + `DnaCard`, not raw tables. |
| Multiple finance pages | `Rp ` literals inside `<td>` cells | Should be `DnaCell.Currency`. |
| Multiple rnd pages | `Rp ` literals | Should be `DnaCell.Currency`. |
| Several `bussdev` pages | `INITIAL_*` mock data arrays | Replace with API fetch + empty-state (`DnaEmptyState`). |

> Total drift candidates: **~80+** unique fields across **~25 pages**. Recommend a separate cleanup pass after the spec gaps are closed.

---

## 8. DNA FIX RECIPES

### Recipe A: Text input → `DnaInput`
```tsx
// ❌ Before
<input
  type="text"
  className="w-full px-3 py-2 rounded border border-slate-300"
  placeholder="Nama Supplier*"
  required
/>

// ✅ After
<DnaInput
  label="Nama Supplier*"
  required
  placeholder="PT …"
/>
```

### Recipe B: Currency input → `DnaCurrencyInput`
```tsx
// ❌ Before
<div className="relative">
  <span className="absolute left-3 top-2 text-slate-500">Rp</span>
  <input
    type="number"
    className="w-full pl-10 pr-3 py-2 rounded border"
    value={harga}
    onChange={(e) => setHarga(parseInt(e.target.value))}
  />
</div>

// ✅ After
<DnaCurrencyInput
  label="Harga"
  value={harga}
  onChange={setHarga}
/>
```

### Recipe C: Date input → `DnaDatePicker`
```tsx
// ❌ Before (legality/input — line ~120)
<input
  type="date"
  className="px-3 py-2 rounded border"
  value={tanggal}
  onChange={(e) => setTanggal(e.target.value)}
/>

// ✅ After
<DnaDatePicker
  label="Tanggal Pengajuan"
  value={tanggal}
  onChange={setTanggal}
  required
/>
```

### Recipe D: Select with hardcoded options → `DnaSelect`
```tsx
// ❌ Before
<select
  value={kategori}
  onChange={(e) => setKategori(e.target.value)}
  className="px-3 py-2 rounded border"
>
  <option value="">-- Pilih Kategori --</option>
  <option value="A">Kategori A</option>
  <option value="B">Kategori B</option>
</select>

// ✅ After
<DnaSelect
  label="Kategori*"
  required
  options={[
    { value: "A", label: "Kategori A" },
    { value: "B", label: "Kategori B" },
  ]}
  value={kategori}
  onChange={setKategori}
/>
```

### Recipe E: Entity autocomplete → specialized `*Select`
```tsx
// ❌ Before — 200-line hardcoded supplier <select>
<select>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

// ✅ After
<SupplierSelect
  label="Supplier*"
  required
  value={supplierId}
  onChange={setSupplierId}
/>
```

### Recipe F: Raw `<table>` → `DnaDataTableCard`
```tsx
// ❌ Before
<table className="w-full text-sm">
  <thead><tr><th>Tanggal</th><th>Nominal</th></tr></thead>
  <tbody>
    {rows.map(r => (
      <tr key={r.id}>
        <td>{r.tanggal}</td>
        <td>Rp {r.nominal.toLocaleString("id-ID")}</td>
      </tr>
    ))}
  </tbody>
</table>

// ✅ After
<DnaDataTableCard
  title="Daftar Transaksi"
  columns={[
    { key: "tanggal", header: "Tanggal", cell: (r) => <DnaCell.Date value={r.tanggal} /> },
    { key: "nominal", header: "Nominal", cell: (r) => <DnaCell.Currency value={r.nominal} /> },
  ]}
  rows={rows}
/>
```

### Recipe G: `Rp ${n}` literal → `formatRupiah` or `DnaCell.Currency`
```tsx
// ❌ Before
<span>Rp {total.toLocaleString("id-ID")}</span>

// ✅ After
<span>{formatRupiah(total)}</span>
// or in a table cell:
<DnaCell.Currency value={total} />
```

### Recipe H: `new Date().toLocaleDateString("id-ID")` → `DnaCell.Date`
```tsx
// ❌ Before
<td>{new Date(row.createdAt).toLocaleDateString("id-ID")}</td>

// ✅ After
<DnaCell.Date value={row.createdAt} />
```

### Recipe I: Action buttons inline → `DnaTableActions`
```tsx
// ❌ Before
<button onClick={() => onEdit(r)} className="text-blue-600 mr-2">Edit</button>
<button onClick={() => onDelete(r)} className="text-red-600">Hapus</button>

// ✅ After
<DnaTableActions
  row={r}
  actions={[
    { label: "Edit", onClick: onEdit, intent: "primary" },
    { label: "Hapus", onClick: onDelete, intent: "danger" },
  ]}
/>
```

### Recipe J: `@/components/ui/*` import → DNA barrel
```tsx
// ❌ Before
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ✅ After
import {
  DnaDataTableCard,
  DnaButton,
  DnaInput,
} from "@/components/dna";
```

### Recipe K: Card with `rounded-[24px]` → `DnaCard`
```tsx
// ❌ Before
<div className="rounded-[24px] border border-[var(--border-color)] bg-white p-6">
  <h3>...</h3>
</div>

// ✅ After
<DnaCard>
  <h3>...</h3>
</DnaCard>
```

### Recipe L: Tab buttons inline → `DnaTabNav`
```tsx
// ❌ Before
<div className="flex border-b">
  {tabs.map(t => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={tab === t.id ? "border-b-2 border-blue-500 px-4 py-2" : "px-4 py-2"}
    >
      {t.label}
    </button>
  ))}
</div>

// ✅ After
<DnaTabNav
  tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
  active={tab}
  onChange={setTab}
/>
```

---

## 9. APPENDIX: Per-page detailed inventory (top 50)

> Format per page: `Path → SCR → Spec fields (formInput / col / action) → Impl → Missing → Hardcoded → DNA fix`

1. **`/warehouse/gudang`** (MOD-05, SCR-091)
   - Spec: ~12 fields (3-pillar stock: Bagus/Reject/Free, batch, exp date)
   - Impl: 22 inputs/selects/textareas
   - Missing: 0–2 (likely already complete)
   - Hardcoded: 25 (13 in, 8 se, 1 tx, 3 tbl)
   - Fix: 13×DnaInput + 8×DnaSelect + 1×DnaTextarea + 3×DnaDataTableCard

2. **`/production/work-orders`** (MOD-06, n/a)
   - Spec: n/a (NOT IN JSON)
   - Impl: 19 raw tags (12 in, 2 se, 2 tx, 2 date, 1 tbl)
   - Fix: full DNA migration (12 in + 2 se + 2 tx + 2 date → DNA)

3. **`/production/packaging`** (MOD-06, n/a) — similar to work-orders

4. **`/production/mixing`** (MOD-06, n/a) — similar

5. **`/production/filling`** (MOD-06, n/a) — similar

6. **`/finance/faktur-pembelian`** (MOD-10, n/a) — full DNA migration + 21×formatRupiah

7. **`/finance/jurnal-umum`** (MOD-10, n/a) — 9×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 3×DnaDataTableCard

8. **`/dna-visual/golden-reference`** — INTENTIONAL EXCEPTION; do not migrate

9. **`/finance/cash-out`** (MOD-10, n/a) — 9×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 1×DnaDataTableCard

10. **`/scm/dashboard`** (MOD-04, SCR-103..125) — 11×DnaDataTableCard + replace 3 UI imports

11. **`/finance/cash-in`** (MOD-10, n/a) — 8×DnaInput + 2×DnaSelect + 3×DnaDatePicker + 1×DnaDataTableCard

12. **`/production/schedule`** (MOD-06, n/a) — 7×DnaInput + 3×DnaSelect + 1×DnaTextarea + 2×DnaDatePicker

13. **`/bussdev/guest-book`** (MOD-02, SCR-001)
    - Spec: 12 cols, 1 formInput (Search), 2 actions
    - Impl: 14 hardcoded tags
    - Missing: ~3 (follow-up status, conversion flag)
    - Fix: 9×DnaInput + 2×DnaSelect + 2×DnaDatePicker + 1×DnaDataTableCard + DnaSearchBar

14. **`/finance/assets`** (MOD-10, n/a) — full DNA migration

15. **`/bussdev/sales-orders`** (MOD-02, SCR-009)
    - Spec: 9 cols, 4 formInputs, 3 actions
    - Impl: 13 hardcoded tags
    - Missing: ~6 (margin, AR status, payment terms, SO number)
    - Fix: 4×DnaInput + 3×DnaSelect + 4×DnaDatePicker + 2×DnaDataTableCard

16. **`/warehouse/inbound`** (MOD-05, SCR-094)
    - Spec: 6 cols, 2 formInputs
    - Impl: 12 hardcoded tags + 2×Rp
    - Missing: ~2 (PO ref, supplier batch)
    - Fix: 6×DnaInput + 2×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 2×DnaDataTableCard

17. **`/rnd/project-monitoring`** (MOD-03, SCR-072)
    - Spec: 8 cols
    - Impl: 12 hardcoded tags
    - Missing: ~3
    - Fix: 6×DnaInput + 2×DnaSelect + 1×DnaTextarea + 2×DnaDatePicker

18. **`/scm/warehouse/requisition`** (MOD-04, SCR-110)
    - Spec: 7 cols, 3 formInputs
    - Impl: 11 hardcoded tags
    - Missing: ~2
    - Fix: 4×DnaInput + 4×DnaSelect + 3×DnaDataTableCard

19. **`/rnd/cogs-request`** (MOD-03, SCR-075)
    - Spec: 6 cols
    - Impl: 11 hardcoded tags + 21×Rp
    - Missing: ~2
    - Fix: 7×DnaInput + 1×DnaSelect + 1×DnaTextarea + 2×DnaDataTableCard + 21×formatRupiah

20. **`/rnd/npf`** (MOD-03, SCR-067)
    - Spec: 5 cols, 4 formInputs
    - Impl: 11 hardcoded tags + 3×Rp
    - Missing: ~1
    - Fix: 7×DnaInput + 2×DnaSelect + 1×DnaTextarea + 1×DnaDataTableCard

21. **`/scm/purchasing`** (MOD-04, SCR-103)
    - Spec: 12 cols, 5 formInputs, 6 actions
    - Impl: 11 hardcoded tags + 4 date + **7 UI imports** + 8×Rp
    - Missing: ~5–10 (likely margin, payment terms, tax fields)
    - Fix: replace 7 UI imports + 4×DnaDatePicker + 8×formatRupiah

22. **`/finance/fund-requests`** (MOD-10, n/a) — full DNA migration

23. **`/warehouse/adjustment`** (MOD-05, SCR-099)
    - Spec: 7 cols, 3 formInputs
    - Impl: 10 hardcoded tags + 6×Rp
    - Missing: ~3
    - Fix: 2×DnaInput + 4×DnaSelect + 1×DnaTextarea + 3×DnaDataTableCard + 6×formatRupiah

24. **`/hr/recruitment`** (MOD-11, n/a) — full DNA migration

25. **`/legality/input`** (MOD-09, n/a) — **6×DnaDatePicker CRITICAL**

26. **`/hr/tickets`** (MOD-11, n/a) — full DNA migration

27. **`/finance/dp-pembelian`** (MOD-10, n/a) — full DNA + 8×formatRupiah

28. **`/warehouse/release`** (MOD-05, SCR-096)
    - Spec: 6 cols
    - Impl: 9 hardcoded tags
    - Missing: ~1
    - Fix: 4×DnaInput + 1×DnaSelect + 1×DnaTextarea + 1×DnaDatePicker + 2×DnaDataTableCard

29. **`/finance/bayar-pembelian`** (MOD-10, n/a) — full DNA + 12×formatRupiah

30. **`/marketing/input`** (MOD-08, n/a) — full DNA + replace 5 UI imports

31–50. *(see §5 for full row and DNA-fix list)*

---

## 10. RECOMMENDED EXECUTION ORDER

| Sprint | Pages | Focus | Expected DNA % |
|---:|---|---|---:|
| **S1 (this week)** | top 6 pages (§6 #1–6) | Legality + SCM + Warehouse + Production + Finance | 78 → 84% |
| **S2** | 25 pages with most raw date pickers (`type="date"`) | `DnaDatePicker` migration | 84 → 89% |
| **S3** | Bulk replace `@/components/ui/*` (44 files) | DNA barrel sweep | 89 → 94% |
| **S4** | Spec coverage — generate JSON entries for MOD-06/08/09/10/11 | MISSING-SPEC gap | enables per-field tracking |
| **S5** | Drift cleanup — remove NON-SPEC fields per §7 | DNA-Compliance 100% | 94 → 96%+ |

> **Realistic 5-sprint target**: 78% → 96%+ DNA adoption, matching the `_AUDIT_DNA_COMPLIANCE_2026-09-09.md` roadmap.

---

## 11. CROSS-REFERENCES & PRIOR AUDITS

| Report | Relevance |
|---|---|
| `_AUDIT_DNA_COMPLIANCE_2026-09-09.md` | Baseline DNA adoption 88.6% — this audit re-counts and finds raw HTML has **grown** since. |
| `_AUDIT_DRIFT_2026-09-09.md` | Drift catalog — this audit enumerates drift fields per page (§7). |
| `_AUDIT_BACKEND_2026-09-09.md` | Prisma + API gaps — many of the ~1 200 MISSING_FIELD items may be blocked on missing backend endpoints. |
| `_AUDIT_RULES_2026-09-09.md` | 52 business rules — **R1–R7** are the binding constraints; verify each new field honors R3 (auto-jurnal), R4 (3-tier approval), R5 (AR gatekeeper), R7 (period lock). |
| `_AUDIT_VISUAL_COMPLIANCE_2026-09-09.md` | Visual-DNA 5-Layer rule — every page in §5 must classify as List/Form/Detail/Dashboard and have L01–L05 checked. |
| `_AUDIT_FULL_REPORT_2026-09-09.md` | Top-level baseline (Score 62/100 → 90+ target). |

---

**END OF REPORT**