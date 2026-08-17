# Phase 2 — Compact UI Foundation

Phase 2 establishes the compact shell and accessibility foundation for the V2 prototype on branch `codex/ui-ux-v2-prototype`. It intentionally does not change business flows, permissions, API contracts, mock data, or the V1 deployment.

## Implemented

- Reduced page, section, card, table, sidebar, and header dimensions through centralized CSS tokens.
- Added shared shell classes for the sidebar, top bar, page shell, and prototype badge.
- Added responsive behavior for the 1023px and 639px breakpoints; the desktop sidebar is hidden on narrow screens until the Phase 5 mobile navigation pattern is implemented.
- Added reduced-motion support, visible minimum touch targets for icon actions, and accessible labels for navigation/search/sign-out controls.
- Removed the mobile zoom restriction and limited the Inter font request to weights used by the visual system (400–800).
- Kept the existing Visual DNA colors, semantic status colors, and interaction patterns intact.

## Density tokens

| Token | V1 | V2 compact |
| --- | ---: | ---: |
| Page gutter | 48px | 24px |
| Card padding | 32px | 16px |
| Card gap | 32px | 16px |
| Card radius | 24px | 12px |
| Table header / row | 44px / 48px | 40px / 40px |
| Sidebar / header | 280px / 72px | 248px / 56px |

## Verification

- `npm run build` passes: Next.js compile, TypeScript, and all 169 routes generated.
- Live checks are recorded after deployment below (login, dashboard route, console, desktop 1440/1280, mobile 375).
- V1 remains available at `https://demo.nexerp.id`; V2 remains isolated at `https://compact.nexerp.id`.

## Next phase

Phase 3 will apply the same tokens to DataTable V2 (column density, sticky header, bulk actions, and responsive overflow) without changing the underlying data behavior.
