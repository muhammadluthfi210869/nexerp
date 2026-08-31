# NEX ERP UI System Contract — Batch 1

ONE ERP. ONE DESIGN SYSTEM. ONE source of truth.

Pages MUST import canonical primitives from `@/components/canonical`.
Pages MUST NOT introduce independent KPI / Table / Tab / Form / Badge markup.

## Canonical Imports

```ts
import {
  MetricCard,            // = StatCard
  CanonicalMetricGrid,   // anti-orphan row layout
  MetricGrid,            // = KPIGrid (legacy 4-col)
  SectionCard,           // = ui Card
  PageHeader,            // = ModuleHeader
  StatusBadge,           // = ui Badge (semantic mapping)
  mapStatus,             // status string -> StatusVariant
  OperationalTabs,       // = ui Tabs
  DataTable,             // = ErpDataTable
  FormSection,           // = FormShell
  EmptyState,            // = components/empty-state
  LoadingState,          // = SegmentLoading
  PageSection,           // = dna PageSection
} from "@/components/canonical";
```

## Rules

### 1. MetricCard
- Single primitive. Variants via semantic accent only.
- No FinanceMetricCard / ScmMetricCard / ProductionMetricCard wrappers.

### 2. MetricGrid
- Use `CanonicalMetricGrid` for layouts > 2 cards.
- Anti-orphan rows:
  1 → 1
  2 → 2
  3 → 3
  4 → 4
  5 → 3 + 2
  6 → 3 + 3
  7 → 4 + 3
  8 → 4 + 4

### 3. SectionCard
- White surface, 1px border, 12px radius, 16–20px padding, subtle shadow.
- No `shadow-2xl`, no thick black borders, no glow, no decorative gradients.

### 4. DataTable
- Use `ErpDataTable` (canonical). Pages supply columns + data.
- No bespoke `<table>` markup with custom header styling.
- Toolbar: search + filters left, primary action right.

### 5. OperationalTabs
- Use `Tabs` (Radix). Same height/radius/padding across divisions.
- No per-division tab styling.

### 6. StatusBadge
- Variants: `default | secondary | destructive | outline | success | info | critical | warning`.
- Use `mapStatus()` to convert domain status strings.

### 7. Typography scale
- Page title: 28–32 / 700
- Section title: 16–20 / 600
- Body: 14 / 400
- Helper: 12 / muted
- KPI label: 13 / 500
- KPI value: 24–30 / 700

### 8. Spacing / radius
- 4px base.
- Card radius 12, control radius 8, container max 16.
- Page horizontal padding 20–24.
- Section gap 16–24.

### 9. Color semantics
- Neutral: slate.
- Info: blue.
- Success: green tint only.
- Warning: amber tint only.
- Danger: red tint only.
- No per-division palette, no decorative gradients.

## Static Guard (informational)

Manual review — flag any of these in PRs:
- `shadow-2xl`
- `drop-shadow`
- `bg-gradient`
- `rounded-[24px]` / `rounded-[32px]` (cards)
- Custom `<table>` with bespoke header styling
- Per-division `*MetricCard.tsx`
- `DnaBadge` (replaced by StatusBadge)

A scripted guard is deferred to a later batch; current rule is documentation +
code review.

## Protected Dashboards

Some dashboards are frozen by Git provenance (e.g. `dashboard/finance`,
`dashboard/warehouse`, `dashboard/commercial`). Standardization is allowed on
shared primitives (typography, badge, spacing) without altering dashboard
information architecture.

## What is NOT changed in Batch 1

- Dark theme infrastructure preserved (light-only screenshots).
- Sidebar/Topbar visual language preserved.
- Route hierarchy preserved.
- Backend workflows preserved.
- Custom domain shells (OperationalMigrationShell, DashboardShell) preserved —
  they are page containers, not KPI/Table primitives.