# Batch 1 Visual Index (correction pass)

Captured at viewport 1600x1000, light theme, 100% browser zoom.
Build: `NEXT_PUBLIC_HIDE_PROTOTYPE_BANNER=true npm run build`.

## Pages

| File | Source route | Domain | Primitives exercised |
|---|---|---|---|
| 01-busdev.png     | /bussdev/client-manager   | BUSDEV     | MetricCards ×3 (info/neutral/neutral), OperationalTabs (4), DataTable + EmptyState |
| 02-finance.png    | /finance/jurnal           | FINANCE    | MetricCards ×3 (info/neutral/success), Tabs ×3, DataTable + EmptyState + toolbarRight |
| 03-scm.png        | /scm/pembelian            | SCM        | MetricCards ×3 (info/warning/danger), OperationalTabs ×6, canonical loading + DataTable |
| 04-production.png | /production/operations    | PRODUCTION | MetricCards ×3 (info/warning/success), OperationalTabs ×4, canonical toolbar, DataTable + Dialog form |
| 05-warehouse.png  | /warehouse/stok           | WAREHOUSE  | MetricCards ×4 (info/neutral/danger/neutral), OperationalTabs ×4, filter Select, DataTable + EmptyState |

## Visual verification checklist

- [x] Same MetricCard structure across pages (label / value / helper / icon badge top-right)
- [x] Same 1px subtle neutral border (#E2E8F0) on every MetricCard
- [x] Same 12px border radius across cards and tables
- [x] Same typography (label 11px uppercase / value 26px / helper 11px / Inter)
- [x] Semantic icon tints only when metric has semantic meaning
- [x] Compact canonical empty states (~80px) — no giant 250–400px blank rectangles
- [x] Subtle canonical table border + header surface + 42px header / 44px body rows
- [x] Canonical OperationalTabs (rounded pill, blue-600 active)
- [x] No thick black borders, no decorative shadows, no glow, no decorative bg SVG
- [x] Page title + KPI + beginning of operational content visible at first viewport
- [x] No 4+1 orphan KPI layout
- [x] No PROTOTYPE MODE — DATA CONTOH banner in evidence (hidden via env flag)
- [x] Same visual language across all five pages

## Accepted drift (deferred to Batch 2)

- Operational legacy data-tables in non-representative pages (`my-performance`, dashboard cards)
- Modal `Dialog` variants still use `sm:max-w-[440px]` shells (in-page Form canonicalization deferred)
- Empty placeholder panels on `05-warehouse` Peta Gudang tab (map renderer deferred)
- Bespoke `PipelineLeadTable` / `StageConfirmDialog` on BUSDEV tabs (workflow widgets deferred)

## Environment

- Production build (`npm run build`) compiled successfully.
- Server: `npx next start -p 3001` with `NEXT_PUBLIC_HIDE_PROTOTYPE_BANNER=true`.
- Captured via Playwright chromium @ 1600×1000.
- Auth: prototype demo credentials.
