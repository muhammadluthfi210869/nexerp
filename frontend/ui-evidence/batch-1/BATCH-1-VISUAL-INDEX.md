# Batch 1 Visual Index

Captured at viewport 1600x1000, light theme, 100% browser zoom.

## Pages

| File | Source route | Domain | Primitives exercised |
|---|---|---|---|
| 01-busdev.png | /bussdev/my-performance | BUSDEV | MetricCard × 4 (anti-orphan single row), DataTable with toolbar + EmptyState, SectionCard |
| 02-finance.png | /finance/sales-orders | FINANCE | OperationalMigrationShell + canonical StatusBadge, page-header + bespoke verification table |
| 03-scm.png | /scm/pembelian | SCM | OperationalTabs (6 tabs), MetricCard × 3 (anti-orphan single row), table header |
| 04-production.png | /production/work-orders | PRODUCTION | MetricCard × 4, table + EmptyState "NO WORK ORDERS ACTIVE" |
| 05-warehouse.png | /warehouse/stok | WAREHOUSE | OperationalTabs (4 tabs), MetricCard × 4, table header |

## Visual verification checklist

- [x] Same MetricCard structure across pages (label / value / subValue / icon position)
- [x] Same card height within equivalent rows
- [x] Same typography (label/value/body/header) within MetricCard family
- [x] Same border/radius language (12px radius, 1px subtle border)
- [x] Same table language (header row, body rhythm, toolbar)
- [x] Same tab language (rounded pill, blue-600 active state)
- [x] No 4+1 orphan KPI layout
- [x] No thick black table borders
- [x] No aggressive semantic glow
- [x] No huge empty rectangles
- [x] No accidental dashboard structural redesign

## Accepted drift (deferred to Batch 2)

- OperationalMigrationShell dark header (finance sales-orders) — domain shell, not primitive
- shadow-2xl on modal dialogs (production/work-orders, finance/sales-orders)
- 24px rounded corners in some non-canonical section cards
- Bespoke "Master Sales Order Log" toolbar (finance) — pending migration to canonical TableToolbar

## Environment

- Production build (`npm run build`) compiled successfully.
- Server: `next start -p 3001` with `NEXT_PUBLIC_PROTOTYPE_MODE=true`.
- Captured via Playwright chromium @ 1600×1000.
- Auth: prototype demo credentials (no real backend, so tables show canonical EmptyState / loading state).