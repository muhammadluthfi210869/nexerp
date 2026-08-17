# Phase 4 — Pilot Page Polish

Phase 4 standardizes the three comparison pilots without changing business behavior:

- **Master Goods** — compact DataTable V2 from Phase 3, record context, dense row rhythm, and contained mobile table scrolling.
- **Purchase / SCM** — lighter responsive tab strip, compact shared stat cards, consistent card radius, and the same dense table rhythm across PR, PO, receiving, returns, payments, and DP tabs.
- **Executive Dashboard** — shared compact stat-card treatment and reduced inline card chrome while preserving the existing KPI calculations and alert/insight content.

## Business contract preserved

No API endpoint, query key, role, permission, document state, approval transition, accounting impact, stock impact, or mutation handler was changed. The page remains read-only at the pilot comparison layer except for the existing Goods detail/QC interactions.

## Shared polish decisions

- Stat cards use the Phase 2 density tokens (`--card-px`, `--card-py`, `--card-radius`) instead of fixed 32px/24px chrome.
- SCM tabs are now light, keyboard-visible, and horizontally scrollable inside the tab strip on narrow screens.
- Status remains semantic through existing `DnaBadge` mappings; color is not the only signal because each badge retains text.
- Mobile overflow is contained in the table/tab region; the page itself must remain viewport-width.

## V1/V2 comparison task script

Use the same prototype credentials and dataset on both domains:

1. **Goods lookup (60 seconds):** open Master Goods, search `CODE-003`, identify stock status, open detail, and return to list.
2. **Purchase scan (60 seconds):** open Pembelian, switch PR → PO → Receiving, identify one pending/active item and follow the “Lihat” path.
3. **Executive triage (60 seconds):** open Executive Dashboard, state the largest alert, revenue achievement, and the next recommended action from Owner Insight.

Record completion time, wrong clicks, confidence (1–5), and any readability issue for V1 (`demo.nexerp.id`) and V2 (`compact.nexerp.id`). Do not compare with different roles or datasets.

## Verification

- `npm run build` passes with all 169 routes generated.
- Live screenshots and browser checks are stored in `screenshots/` for all three pilots at 1440px and the two responsive pages at 375px. Browser console reported 0 messages. At 375px the Purchase tab strip is intentionally contained (`pageScrollWidth=375`, tabs content `894px` inside a `351px` viewport region) and Executive Dashboard remained `pageScrollWidth=375`.

Evidence files:

- `screenshots/goods-1440.png`
- `screenshots/purchase-1440.png`
- `screenshots/purchase-375.png`
- `screenshots/executive-1440.png`
- `screenshots/executive-375.png`
