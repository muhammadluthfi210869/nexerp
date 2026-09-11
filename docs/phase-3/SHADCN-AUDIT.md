# Phase 3(a) — shadcn Usage Baseline (pre DNA-Only Migration)

**ADR-013** signed 2026-09-11: TOTAL removal of `frontend/src/components/ui/` as part of the DNA-Only design system cut-over. This document is the **read-only baseline** the migration sweep will be sized against.

**Method**: `grep -rE "from ['\"]@/components/ui" frontend/src --include="*.tsx" --include="*.ts"`. No code was edited.

---

## 1. Headline numbers

| Metric | Value |
| --- | ---: |
| Total `from "@/components/ui/..."` import statements | **248** |
| Unique files importing shadcn | **90** |
| shadcn primitive files in `frontend/src/components/ui/` | **27** |
| shadcn primitives actually referenced by code | **21** |
| DNA primitive files in `frontend/src/components/dna/*.tsx` | **47** |
| DNA files that **still** re-import shadcn (blockers) | **5** |
| Pages with **>=4 distinct** shadcn primitives (high-risk) | **25** |

---

## 2. Per-file count — top 20

| # | Imports | File |
| --: | --: | --- |
| 1 | 15 | `frontend/src/components/dna/DnaFieldCompat.tsx` *(pure re-export hub — kill it)* |
| 2 | 8 | `frontend/src/app/(dashboard)/dashboard/finance/page.tsx` |
| 3 | 7 | `frontend/src/components/bussdev/BussdevActionDialog.tsx` |
| 3 | 7 | `frontend/src/app/(dashboard)/production/production-planning-dashboard/page.tsx` |
| 5 | 6 | `frontend/src/components/rnd/formula-builder.tsx` |
| 5 | 6 | `frontend/src/components/commercial/lead-board.tsx` |
| 5 | 6 | `frontend/src/app/(dashboard)/production/production-floor-dashboard/page.tsx` |
| 8 | 5 | `frontend/src/components/marketing/marketing-log-manager.tsx` |
| 8 | 5 | `frontend/src/app/(dashboard)/warehouse/workstation/page.tsx` |
| 8 | 5 | `frontend/src/app/(dashboard)/samples/input/page.tsx` |
| 8 | 5 | `frontend/src/app/(dashboard)/inventory/warehouse-dashboard/page.tsx` |
| 8 | 5 | `frontend/src/app/(dashboard)/dashboard/fulfillment/page.tsx` |
| 13 | 4 | `frontend/src/components/qc/DefectDetailModal.tsx` |
| 13 | 4 | `frontend/src/components/hr/OrganogramManager.tsx` |
| 13 | 4 | `frontend/src/components/hr/KpiConfigManager.tsx` |
| 13 | 4 | `frontend/src/components/finance/TransactionLedgerTable.tsx` |
| 13 | 4 | `frontend/src/components/finance/GeneralLedgerTable.tsx` |
| 13 | 4 | `frontend/src/components/commercial/marketing-form.tsx` |
| 13 | 4 | `frontend/src/components/bussdev/StatusActions.tsx` |
| 13 | 4 | `frontend/src/components/automation/AutomationShell.tsx` |

**Tally**: top 20 = **116 imports / 248** = **46.8 %** of all shadcn usage lives in 20 files. Long-tail (the other 70 files) = 132 imports.

---

## 3. Per-primitive count

| shadcn primitive | Imports | Files | DNA replacement |
| --- | --: | --: | --- |
| `card` | **41** | 32 | **PARTIAL** — `DataCard`, `DashboardCard`, `StatCard` exist; raw `Card / CardHeader / CardTitle / CardDescription / CardContent` pattern has **NO direct equivalent** |
| `button` | **34** | 28 | `DnaButton` |
| `badge` | **26** | 21 | `DnaBadge` |
| `table` | **25** | 18 | `DnaTable` / `DnaDataTable` |
| `dialog` | **24** | 19 | `DnaDialog` / `DnaModal` |
| `input` | **17** | 14 | `DnaInput` |
| `skeleton` | **14** | 11 | **NO EQUIVALENT** — re-exported today via `DnaFieldCompat` only |
| `select` | **13** | 10 | `DnaSelect` |
| `label` | **13** | 9 | **NO EQUIVALENT** — today only re-exported via `DnaFieldCompat` |
| `tabs` | **10** | 8 | **PARTIAL** — `DnaTabNav` is a button-group, **NOT** Radix `Tabs/TabsList/Trigger/Content` API |
| `textarea` | **6** | 5 | `DnaTextarea` |
| `dropdown-menu` | **6** | 4 | **NO EQUIVALENT** — currently used **inside** `DnaDataTable` and `DnaTableRowActions` (i.e. DNA itself depends on shadcn here) |
| `sheet` | **4** | 3 | `DnaSheet` / `DnaDrawer` |
| `progress` | **4** | 3 | `DnaProgress` |
| `tooltip` | **3** | 2 | **NO EQUIVALENT** — `frontend/src/components/ui/tooltip.tsx` already wraps `@base-ui/react/tooltip`, no DNA port exists |
| `switch` | **2** | 1 | **NO EQUIVALENT** — `DnaInteractiveElements` re-exports shadcn `Switch as RawSwitch`; no proper wrapper |
| `empty-state` | **2** | 2 | **NO EQUIVALENT** |
| `sonner` | **1** | 1 | **NO EQUIVALENT** — toast system (`Toaster` mount in app root) |
| `slider` | **1** | 1 | **NO EQUIVALENT** |
| `loading-skeleton` | **1** | 1 | `DnaSkeleton` (proposed — not implemented; currently just an alias to `Skeleton`) |
| `checkbox` | **1** | 1 | `DnaCheckbox` |

**6 unused-by-code primitives** still in `frontend/src/components/ui/`: `alert`, `cascading-address`, `form-field`, `GlobalAlert`, `InsightCallout`, `StatusPill` — **custom wrappers**, not stock shadcn; safe to delete as part of the sweep (no impact on import count).

---

## 4. DNA coverage matrix (used primitives only)

| shadcn name | DNA equivalent | Gap / migration note |
| --- | --- | --- |
| `card` | `DataCard`, `DashboardCard`, `StatCard` (semantic variants) | **GAP**: raw `Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter` API used 41× — needs `DnaCard` (or rename semantic variants to export those sub-parts) |
| `button` | `DnaButton` | none |
| `badge` | `DnaBadge` | none |
| `table` | `DnaTable`, `DnaDataTable` | `DnaDataTable` already wraps shadcn `DropdownMenu` internally — fixing `dropdown-menu` also fixes the data-table |
| `dialog` | `DnaDialog`, `DnaModal` | `DnaDialog` itself re-exports from `@/components/ui/dialog` — **must rewrite internally first** |
| `input` | `DnaInput` | none |
| `skeleton` | **NO EQUIVALENT** | propose `DnaSkeleton` |
| `select` | `DnaSelect` | none |
| `label` | **NO EQUIVALENT** | propose `DnaLabel` (trivial wrapper around native `<label>`) |
| `tabs` | **PARTIAL** (`DnaTabNav` is button-group only) | propose `DnaTabs` with `TabsList / TabsTrigger / TabsContent` (Radix-style API) |
| `textarea` | `DnaTextarea` | none |
| `dropdown-menu` | **NO EQUIVALENT** | propose `DnaDropdownMenu` — **HIGHEST PRIORITY** because 2 DNA primitives depend on it |
| `sheet` | `DnaSheet`, `DnaDrawer` | confirm both are not aliased to shadcn |
| `progress` | `DnaProgress` | none |
| `tooltip` | **NO EQUIVALENT** | propose `DnaTooltip` (or inline `@base-ui/react/tooltip` directly) |
| `switch` | **NO EQUIVALENT** | propose `DnaSwitch` — `DnaInteractiveElements` already imports the raw shadcn version as `RawSwitch` |
| `empty-state` | **NO EQUIVALENT** | propose `DnaEmptyState` |
| `sonner` | **NO EQUIVALENT** | propose `DnaToast` (sonner-style toast mount + `toast()` API) |
| `slider` | **NO EQUIVALENT** | propose `DnaSlider` (1 usage — single file migration) |
| `loading-skeleton` | `DnaSkeleton` (alias) | collapse into the proposed `DnaSkeleton` |
| `checkbox` | `DnaCheckbox` | none |

**Summary of new DNA primitives required**: `DnaCard` (raw API), `DnaSkeleton`, `DnaLabel`, `DnaTabs`, `DnaDropdownMenu`, `DnaTooltip`, `DnaSwitch`, `DnaEmptyState`, `DnaToast`, `DnaSlider` — **10 new primitives** to close the gap.

---

## 5. Existing DNA primitives inventory (47 files)

| Dna* file | Replaces shadcn |
| --- | --- |
| `DnaButton.tsx` | `button` |
| `DnaBadge.tsx` | `badge` |
| `DnaInput.tsx` | `input` |
| `DnaTextarea.tsx` | `textarea` |
| `DnaSelect.tsx` | `select` |
| `DnaCheckbox.tsx` | `checkbox` |
| `DnaDialog.tsx` | `dialog` *(internally still re-exports from `@/components/ui/dialog`)* |
| `DnaModal.tsx` | `dialog` (alt variant) |
| `DnaSheet.tsx` | `sheet` |
| `DnaDrawer.tsx` | `sheet` (alt) |
| `DnaProgress.tsx` | `progress` |
| `DnaTable.tsx` | `table` (low-level) |
| `DnaDataTable.tsx` | `table` + `dropdown-menu` *(internally re-exports `dropdown-menu`)* |
| `DnaTableRowActions.tsx` | `dropdown-menu` *(internally re-exports `dropdown-menu`)* |
| `DnaTabNav.tsx` | `tabs` (button-group variant only) |
| `DnaPagination.tsx` | (new — no shadcn equiv) |
| `DnaToolbar.tsx` | (new — overlaps `FilterBar`) |
| `DnaBulkActionBar.tsx` | (new) |
| `DnaColumnFilter.tsx` | (new) |
| `DnaDateFilter.tsx` | (new) |
| `DnaFeedbackStates.tsx` | covers `empty-state`, `loading`, `error` |
| `DnaFieldCompat.tsx` | **re-export hub — 15 shadcn imports, ZERO external callers, delete outright** |
| `DnaInteractiveElements.tsx` | imports raw shadcn `Switch` as `RawSwitch` |
| `DnaInternalThread.tsx` | (new) |
| `DnaSlaBadge.tsx` | (semantic badge variant) |
| `DnaAuditTimeline.tsx` | (new) |
| `DnaStatCard.tsx` | `card` (semantic) |
| `DnaKpiGrid.tsx` | (new) |
| `DnaLegacyCompat.tsx` | shim layer (audit before deletion) |
| `DnaPageContainer.tsx` | (new — layout) |
| `DnaPageHeader.tsx` | (new — layout) |
| **Non-Dna in `/dna/`** (still DNA-aligned, not blocking) | |
| `DataCard`, `DashboardCard`, `StatCard`, `KpiCard`, `MetricRow` | `card` (semantic) |
| `TableWrapper`, `DashboardMetric`, `DashboardMetricGrid` | `table` / `card` (semantic) |
| `FilterBar`, `TabButton`, `TabButtonGroup` | `tabs` (button variant) |
| `MasterPageShell`, `PageSection`, `SectionLabel` | layout |
| `PipelineNode`, `PipelineRow` | (new) |
| `CategorySelect`, `CoaSelect`, `CustomerSelect`, `GoodsSelect`, `SupplierSelect` | domain wrappers over `select` |

**DNA internal blockers** (5 files still importing shadcn — must be rewritten before `frontend/src/components/ui/` can be deleted):

1. `DnaFieldCompat.tsx` — pure re-export, **0 external callers**, delete first
2. `DnaDialog.tsx` line 15 — re-exports `Dialog / DialogContent / DialogHeader / DialogFooter / DialogTitle / DialogDescription`
3. `DnaDataTable.tsx` line 43 — re-exports `DropdownMenu / DropdownMenuTrigger / DropdownMenuContent / DropdownMenuItem / DropdownMenuCheckboxItem / DropdownMenuRadioItem / DropdownMenuLabel / DropdownMenuSeparator / DropdownMenuShortcut`
4. `DnaTableRowActions.tsx` line 12 — re-exports `DropdownMenu*` family
5. `DnaInteractiveElements.tsx` line 9 — `import { Switch as RawSwitch }`

---

## 6. Migration impact estimate

| Item | Value |
| --- | --- |
| Total `from "@/components/ui/*"` lines to rewrite | **248** |
| Files to touch | **90** |
| New DNA primitives required | **10** (`DnaCard`, `DnaSkeleton`, `DnaLabel`, `DnaTabs`, `DnaDropdownMenu`, `DnaTooltip`, `DnaSwitch`, `DnaEmptyState`, `DnaToast`, `DnaSlider`) |
| Avg LOC delta per file | **~3 LOC** (1-line import swap + ~2-line JSX prop rename for `Card → DataCard`, `Dialog → DnaDialog`, etc.) — **except** files that re-shape components (Tabs API change, dropdown-menu → menu) where it can be **20–60 LOC** |
| Total estimated diff size | **~1.5–3 KLOC net additions** (new primitives) + **~270 LOC edits** (rewrites) |
| Files importing **>=4 distinct** shadcn primitives | **25** (highest migration cost) |
| Files importing **>=3 distinct** shadcn primitives | **45** (≈50 % of all files) |
| Single-primitive files (trivial swap) | **45** |

**Migration order (lowest risk first)**:

1. Delete `DnaFieldCompat.tsx` (no external callers) + 6 unused custom files (`alert`, `cascading-address`, `form-field`, `GlobalAlert`, `InsightCallout`, `StatusPill`)
2. Build the **10 missing DNA primitives**
3. Rewrite the 5 DNA-internal blockers (`DnaDialog`, `DnaDataTable`, `DnaTableRowActions`, `DnaInteractiveElements`, `DnaFieldCompat`)
4. Mass-rewrite the 90 consumer files — start with single-primitive files (45 trivial)
5. Hand-rewrite the 25 multi-primitive files (Tabs API + DropdownMenu shape changes)

**LOC estimate per migration type**:
- Trivial 1:1 swap (button / badge / input / textarea / checkbox / label / progress / sheet / card-sub-part / select): **2–4 LOC change** per file
- Shape change (Dialog footer, Tabs, DropdownMenu → Menu): **10–60 LOC change** per file
- New primitive creation: **40–120 LOC** each (10 primitives ≈ **600–1200 LOC**)

---

## 7. Critical files — complexity notes

| File | Lines | Distinct shadcn primitives | Notes |
| --- | --: | --: | --- |
| `frontend/src/app/(dashboard)/warehouse/workstation/page.tsx` | **687** | 5 (button, input, dialog, tabs-content, select) | Longest file. Dialog + Tabs.Content + nested Select. Tabs API used (only TabsContent here, likely sibling Tabs in parent). |
| `frontend/src/components/bussdev/BussdevActionDialog.tsx` | **326** | **7** (dialog, button, textarea, input, select, badge, tabs) | Highest primitive count in a non-page file. Full Tabs API + Dialog + multi-form input stack. |
| `frontend/src/app/(dashboard)/inventory/warehouse-dashboard/page.tsx` | **313** | 5 (table, card, badge, button, dialog) | Card-heavy dashboard. Card composition pattern repeats ~5×. |
| `frontend/src/app/(dashboard)/production/production-planning-dashboard/page.tsx` | **284** | **7** (table, card, badge, button, dialog, input, label) | Dialog + form pattern. Card variants repeated. |
| `frontend/src/app/(dashboard)/production/production-floor-dashboard/page.tsx` | **313** | 6 (card, badge, button, dialog, input, label) | Similar shape to planning dashboard; likely shares a refactor pattern. |
| `frontend/src/components/dna/DnaFieldCompat.tsx` | 84 | 15 re-exports | Pure shadcn re-export. **0 external importers** — delete first. |
| `frontend/src/app/(dashboard)/dashboard/finance/page.tsx` | (top-2 imports) | 8 (table, card, badge, button, dialog, input, label, select) | One of the highest-density pages. |

**High-risk files** (multi-primitive + shape-change primitives: `tabs`, `dialog`, `dropdown-menu`, `select`, `sheet`) — handle last and individually:

- `creative/board/components/CreateDesignTaskModal.tsx` (dialog + select)
- `creative/board/components/DesignHubDrawer.tsx` (tabs + button + badge + textarea)
- `documents/drafts/page.tsx` (dialog)
- `inventory/outbound/page.tsx` (dialog)
- `production/production-planning-dashboard/page.tsx` (full dialog/form stack)
- `bussdev/BussdevActionDialog.tsx` (full Tabs + Dialog + Form stack)
- `rnd/formula-builder.tsx` (6 imports — formula editor)
- `commercial/lead-board.tsx` (6 imports)

---

## 8. Recommendation (for the executor agent)

- **Phase 3(a) — current**: this audit (committed).
- **Phase 3(b)** *(next agent)*: build the 10 missing DNA primitives. **Order**: `DnaCard` (raw API, used 41×), `DnaDropdownMenu` (blocks 3 DNA files), `DnaSkeleton`, `DnaLabel`, `DnaTabs` (Radix-style), `DnaTooltip`, `DnaSwitch`, `DnaEmptyState`, `DnaToast`, `DnaSlider`.
- **Phase 3(c)**: rewrite the 5 internal blockers, delete `DnaFieldCompat.tsx` and 6 unused `frontend/src/components/ui/*.tsx` files.
- **Phase 3(d)**: mass-rewrite 90 consumer files. 45 are trivial 1:1 swaps; 25 need shape-aware edits.
- **Phase 3(e)**: `rm -rf frontend/src/components/ui/`, run vitest + E2E.

**Estimated end-state**: `frontend/src/components/ui/` deleted, all 248 imports redirected to `frontend/src/components/dna/`, 10 new DNA primitives shipped.

---

**Baseline frozen 2026-09-11.** Numbers reproducible via the single grep in §1. Any drift after this commit invalidates the migration sizing.
