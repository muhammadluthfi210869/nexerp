# Phase 3 — DataTable V2

Phase 3 applies the compact data-heavy table foundation to the Master Goods pilot at `/master/goods`. It changes presentation and table ergonomics only; the API calls, data model, row detail flow, and mutation behavior remain unchanged.

## Implemented

- Reusable `DataTableV2` primitives in `frontend/src/components/layout/DataTableV2.tsx`.
- Compact 40px table rows and 40px headers driven by the Phase 2 density tokens.
- Sticky table header and a keyboard-focusable horizontal scroll region for dense mobile/tablet tables.
- A compact context toolbar showing filtered/total record counts and the row-detail affordance.
- Deliberate `840px` minimum width for the six-column Goods table so values do not collapse; the table scrolls inside its own region on narrow screens rather than widening the page.
- Accessible labels on the scroll region and row inspection action.

## ERP interaction contract

- Default sort, search semantics, API endpoints, row click detail panel, QC status mutation, and permissions are unchanged.
- Bulk actions and column visibility controls remain planned for the next DataTable iteration after the pilot review; this phase establishes the shared density and shell behavior first.

## Verification

- `npm run build` passes: Next.js compile, TypeScript, and all 169 routes generated.
- Live compact verification is recorded in `screenshots/`: `/master/goods` loads after prototype login, the `5 records · 5 total SKUs` toolbar renders, the browser console reports 0 messages, and at 375px the page remains `375px` wide while the table scroll region contains its `840px` content width (`clientWidth=351px`).

## Next phase

Phase 4 will polish the three pilot pages (Goods, Purchase Order, Executive Dashboard) using this table foundation and add comparable task scripts for V1/V2 usability review.
