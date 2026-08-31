# NEX ERP UI Drift Inventory — Batch 1

Quick scan, not a full audit. Goal: prepare Batch 2 migration.

## KPI / Metric Card implementations (5+)

| File | Notes |
|---|---|
| `src/components/dna/KpiCard.tsx` | Drifted — `targetPct` bar, border tint, fade-slide-in. Now wrapped by canonical `MetricCard`. |
| `src/components/dna/StatCard.tsx` | Closest to canonical; wrapped as `MetricCard`. |
| `src/components/dna/DashboardMetric.tsx` | Dashboard variant — used in protected dashboards. Preserved. |
| `src/components/layout/KPICrid.tsx` (and `KPICard`) | Different shell language (`brand-black` danger variant). Wrapped as `MetricGrid`. |
| `src/components/dna/DashboardCard.tsx` | Section card variant. |
| `src/components/dna/DataCard.tsx` | Data card variant. |

**Consolidation plan:** Batch 2 retires `KpiCard`, `DashboardCard`, `DataCard`, layout `KPICard` in favor of canonical `MetricCard` / `SectionCard`.

## Table implementations (5+)

| File | Notes |
|---|---|
| `src/components/dna/ErpDataTable.tsx` | Canonical-ish: search, sort, paginate, column visibility. Wrapped as `DataTable`. |
| `src/components/layout/DataTable.tsx` | Older shell variant. |
| `src/components/dna/TableWrapper.tsx` | Wraps content. |
| `src/components/layout/TableShell.tsx` | Page-level shell. |
| `src/components/dna/TableToolbar.tsx` | Toolbar component. |

**Consolidation plan:** Batch 2 retires layout `DataTable`, `TableWrapper`, `TableShell`, `TableToolbar` (keep wrapper for now — pages depend).

## Tab/Navbar implementations

| File | Notes |
|---|---|
| `src/components/ui/tabs.tsx` | Radix wrapper, dark zinc styling. Wrapped as `OperationalTabs`. |
| `phase4-tabs-list`, `phase4-tabs-trigger` classes | SCM uses separate classes — non-canonical. |
| Bespoke inline tab buttons in dashboard pages | Per-page tab markup. |

**Consolidation plan:** Batch 2 introduces canonical Tabs styling override for light theme + retire per-division class systems.

## Form implementations

| File | Notes |
|---|---|
| `src/components/layout/FormShell.tsx` | Section wrapper. Wrapped as `FormSection`. |
| Bespoke `<form>` markup in modal dialogs (work-orders, advance-stage, payment-proof) | Domain forms. |

**Consolidation plan:** Batch 2 wraps form fields (label + input + helper) into `FormField` primitive.

## Badge implementations (2+)

| File | Notes |
|---|---|
| `src/components/dna/DnaBadge.tsx` | `success/info/warning/critical/purple/default`. |
| `src/components/ui/badge.tsx` | CVA variant system. Wrapped as `StatusBadge`. |

**Consolidation plan:** Batch 2 retires `DnaBadge` in favor of canonical `StatusBadge` + `mapStatus()`.

## Sidebar / Topbar

- `src/components/layout/Sidebar.tsx` + `SidebarWrapper.tsx`
- Topbar in `src/app/(dashboard)/layout.tsx`

Both preserved per Batch 1 contract (single source). No drift intervention in Batch 1.

## Per-division visual language divergences

Observed but out-of-scope for Batch 1 (left for Batch 2+):

- `shadow-2xl` in modal dialogs (production/work-orders, finance/sales-orders)
- `rounded-2xl` (24px) on verification cards (finance/sales-orders)
- `bg-slate-900 p-5` dark dialog headers (production/work-orders, finance/sales-orders)
- `border-l-4 border-amber-500` accent borders (finance verification queue)
- `bg-brand-black` danger variant (layout/KPICard)
- `animate-pulse` on QC REQUIRED badge
- Per-page `text-[9px]/[10px]` micro-typography outside canonical scale

## Pages known to have render issues (carry over to Batch 3)

- `bussdev/sales-orders/page.tsx` — redirect only
- `bussdev/pipeline/page.tsx` — redirect only

These are not blockers for Batch 1; listed for Batch 3 route integrity work.