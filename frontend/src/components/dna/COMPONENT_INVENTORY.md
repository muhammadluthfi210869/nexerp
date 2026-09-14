# DNA Component Library — Component Inventory

> Generated from analysis of `frontend/src/components/dna/`
> Golden reference: `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`

---

## 1. Complete Component Status Table

| Component | File | Status | Default Export | Types | console.log | TODO/FIXME | Notes |
|-----------|------|--------|----------------|-------|-------------|-------------|-------|
| `DataCard` | DataCard.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `MetricRow` | MetricRow.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `SectionLabel` | SectionLabel.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `PageSection` | PageSection.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `TableWrapper` | TableWrapper.tsx | IMPLEMENTED | YES | YES | NO | NO | Uses undefined CSS var `--border-color` |
| `StatCard` | StatCard.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `KpiCard` | KpiCard.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DashboardCard` | DashboardCard.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DashboardMetric` | DashboardMetric.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DashboardMetricGrid` | DashboardMetric.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `PipelineNode` | PipelineNode.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `PipelineRow` | PipelineNode.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaInput` | DnaInput.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only — blocks tree-shaking |
| `DnaButton` | DnaButton.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only |
| `DnaBadge` | DnaBadge.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only |
| `TabButton` | TabButton.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `TabButtonGroup` | TabButton.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `FilterBar` | FilterBar.tsx | IMPLEMENTED | YES | YES | NO | NO | Overlaps with DnaToolbar |
| `DnaPageContainer` | DnaPageContainer.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaPageHeader` | DnaPageHeader.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTabNav` | DnaTabNav.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaKpiGrid` | DnaKpiGrid.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTable` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTableHead` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTableRow` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTh` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTableBody` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTd` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTdNumber` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTdCode` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaEmptyState` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaLoadingSkeleton` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DNA_TABLE_CLASSES` | DnaTable.tsx | IMPLEMENTED | YES | YES | NO | NO | Const export |
| `DnaErrorState` | DnaFeedbackStates.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaPagination` | DnaPagination.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaDateFilter` | DnaDateFilter.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaColumnFilter` | DnaColumnFilter.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaTableRowActions` | DnaTableRowActions.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaModal` | DnaModal.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaSelect` | DnaSelect.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only |
| `DnaTextarea` | DnaTextarea.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only |
| `DnaDrawer` | DnaDrawer.tsx | IMPLEMENTED | YES | YES | NO | NO | Thin wrapper over DnaModal |
| `DnaToolbar` | DnaToolbar.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaSlaBadge` | DnaSlaBadge.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaProgress` | DnaProgress.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaCheckbox` | DnaCheckbox.tsx | IMPLEMENTED | **NO** | YES | NO | NO | Named export only |
| `DnaAuditTimeline` | DnaAuditTimeline.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaInternalThread` | DnaInternalThread.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaBulkActionBar` | DnaBulkActionBar.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `SupplierSelect` | SupplierSelect.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `GoodsSelect` | GoodsSelect.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `CustomerSelect` | CustomerSelect.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `CategorySelect` | CategorySelect.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `CoaSelect` | CoaSelect.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaDataTable` | DnaDataTable.tsx | IMPLEMENTED | YES | YES | NO | NO | |
| `DnaColumnDef` (type) | DnaDataTable.tsx | IMPLEMENTED | N/A | YES | NO | NO | Type alias |
| `DnaColumn` (type) | DnaDataTable.tsx | IMPLEMENTED | N/A | YES | NO | NO | Type alias, same as DnaColumnDef |
| `ColumnDef` (type) | DnaDataTable.tsx | IMPLEMENTED | N/A | YES | NO | NO | Type alias, same as DnaColumnDef |
| `DnaKpiItem` (type) | DnaDataTable.tsx | IMPLEMENTED | N/A | YES | NO | NO | |
| `DnaDataTableProps` (type) | DnaDataTable.tsx | IMPLEMENTED | N/A | YES | NO | NO | |

---

## 2. Tree-Shaking Issues

### Named-export-only components (6)
These components are only available as named exports, preventing bundlers from eliminating them as dead code when unused:

- `DnaInput` — `export const DnaInput = ...`
- `DnaButton` — `export function DnaButton` (no default)
- `DnaBadge` — `export function DnaBadge` (no default)
- `DnaSelect` — `export const DnaSelect = ...`
- `DnaTextarea` — `export const DnaTextarea = ...`
- `DnaCheckbox` — `export const DnaCheckbox = ...`

**Recommendation:** Add `export default` alongside named exports for each, or convert to a consistent default-export pattern preferred by the library.

---

## 3. Duplicate / Overlapping Components

### A. `TableWrapper` vs `DnaTable`
- `TableWrapper` — card wrapper with optional `title`, `badge`, `filters`, `pagination` slots; uses undefined CSS variable `--border-color`
- `DnaTable` — low-level `<table>` element with head/body/row/cell primitives

Both serve different purposes, but **`TableWrapper` is broken** (CSS var `--border-color` is never defined in any parent scope). `DnaDataTable` internally depends on `TableWrapper`.

**Keep:** `DnaTable` for table primitives; **fix or remove `TableWrapper`**.

---

### B. `FilterBar` vs `DnaToolbar`
- `DnaToolbar` — full-featured: search input, arbitrary filter nodes, reset button, action button slot; fully styled
- `FilterBar` — limited: search via `DnaInput` + optional platform/status selects only

`DnaToolbar` is a strict superset of `FilterBar`. `FilterBar` is never imported by `DnaDataTable` or any other DNA component.

**Keep:** `DnaToolbar`; **deprecate `FilterBar`**.

---

### C. `DnaDrawer` vs `DnaModal`
- `DnaDrawer` is a 1:1 thin wrapper that passes all props directly to `DnaModal` with no additional logic or rendering

**Keep:** `DnaModal`; **remove `DnaDrawer`**.

---

### D. Triple type alias: `DnaColumnDef` / `DnaColumn` / `ColumnDef`
Three named exports all resolve to the identical `DnaColumnDef<T>` type. `DnaColumn` and `ColumnDef` are redundant.

**Keep:** `DnaColumnDef` (primary name); **remove `DnaColumn` and `ColumnDef`** from exports.

---

## 4. Unused Exports (in `index.ts` but not referenced by `golden-reference`)

The golden-reference page uses **zero** DNA components directly — all UI is raw HTML/Tailwind. Even `DnaDataTable` itself is not used in the reference. The following exports have no confirmed consumer in the reference:

- `DataCard`, `MetricRow`, `SectionLabel`, `PageSection`
- `TableWrapper` (broken CSS var)
- `StatCard`, `KpiCard`
- `DashboardCard`, `DashboardMetric`, `DashboardMetricGrid`
- `PipelineNode`, `PipelineRow`
- `DnaInput`, `DnaButton`, `DnaBadge`
- `TabButton`, `TabButtonGroup`
- `FilterBar` (superseded by DnaToolbar)
- `DnaPageContainer`, `DnaPageHeader`
- `DnaKpiGrid`
- `DnaTable`, `DnaTableHead`, `DnaTableRow`, `DnaTh`, `DnaTableBody`, `DnaTd`, `DnaTdNumber`, `DnaTdCode`, `DnaEmptyState`, `DnaLoadingSkeleton`, `DNA_TABLE_CLASSES`
- `DnaPagination`
- `DnaDateFilter`
- `DnaColumnFilter`
- `DnaTableRowActions`
- `DnaModal`, `DnaDrawer`
- `DnaSelect`, `DnaTextarea`
- `DnaToolbar`
- `DnaSlaBadge`
- `DnaProgress`
- `DnaCheckbox`
- `DnaAuditTimeline`
- `DnaInternalThread`
- `DnaBulkActionBar`
- `SupplierSelect`, `GoodsSelect`, `CustomerSelect`, `CategorySelect`, `CoaSelect`
- `DnaColumn` (alias), `ColumnDef` (alias)
- `DnaKpiItem`, `DnaDataTableProps`
- `DnaErrorState`

**Note:** These are not necessarily dead code — they may be consumed by actual operational pages. The golden-reference is a visual spec page, not a component consumer. Cross-reference with real page imports before removing anything.

---

## 5. CSS Variable Bug

`TableWrapper` uses `var(--border-color)` in its className but no parent defines this CSS variable. Any page rendering `TableWrapper` (including via `DnaDataTable`) will render with a missing border color.

```tsx
// TableWrapper.tsx — line 14
className="... border border-[var(--border-color)] ..."
```

**Fix:** Replace with `border-slate-200` or define `--border-color` globally.

---

## 6. Recommendations Summary

| Priority | Action | Reason |
|----------|--------|--------|
| **HIGH** | Add `export default` to `DnaInput`, `DnaButton`, `DnaBadge`, `DnaSelect`, `DnaTextarea`, `DnaCheckbox` | Named-only exports block tree-shaking |
| **HIGH** | Fix `TableWrapper` CSS var `--border-color` or remove it | Broken border rendering in all consumers |
| **MED** | Remove `DnaDrawer` | Zero additional logic over `DnaModal` |
| **MED** | Remove `FilterBar` | Fully superseded by `DnaToolbar` |
| **MED** | Remove `DnaColumn` and `ColumnDef` type aliases | Identical to `DnaColumnDef` — redundant exports |
| **LOW** | Audit actual page usage before removing "unused" exports | golden-reference is a spec page, not a component consumer; components may be used on real pages |

---

*Last verified against: `frontend/src/components/dna/index.ts` and `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`