# Phase 1 — Compact V2 Environment

Completed: 17 August 2026.

## Environment contract

| Concern | V1 baseline | V2 compact skeleton |
|---|---|---|
| URL | `https://demo.nexerp.id` | `https://compact.nexerp.id` |
| Container | `prototype-frontend` | `compact-frontend` |
| Source | `prototype-demo` | `codex/ui-ux-v2-prototype` |
| Data | frontend mock | frontend mock, same role set |
| Backend/database | not used | not used |
| Origin | Biznet | Biznet, separate virtual host |

Phase 1 intentionally renders the V1 visual while infrastructure and comparison mechanics are validated. No density, typography, navigation, or business-flow redesign belongs in this phase.

## Acceptance evidence

- Cloudflare A record `compact.nexerp.id` → `103.93.134.215`, proxied.
- Dedicated Let’s Encrypt certificate for `compact.nexerp.id`.
- Dedicated nginx 80/443 server blocks and isolated `compact-frontend` container.
- Compact login reaches `/executive/dashboard` with `superadmin@nexerp.id` / `password123`.
- Compact dashboard shows Prototype Mode badge; post-login console errors: 0.
- Demo login was rerun after compact deployment and still reaches `/executive/dashboard`; demo container remained independent.

## Evidence screenshots

- [Compact dashboard desktop](screenshots/compact-dashboard-desktop.png)
- [Compact dashboard mobile](screenshots/compact-dashboard-mobile.png)
- [Compact login mobile](screenshots/compact-login-mobile.png)

## Next phase

Phase 2 may now change the compact branch UI: density tokens, typography reset, sidebar/header shell, page shell, and terminology foundation. `demo.nexerp.id` and `docs/design/baseline-v1/` remain read-only comparison references.
