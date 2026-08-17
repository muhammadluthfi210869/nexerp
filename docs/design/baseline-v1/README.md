# NexERP UI V1 Baseline Evidence

Phase 0 baseline freeze: 17 August 2026 (Asia/Jakarta).

## Source of truth

- Branch: `prototype-demo`
- Baseline tag: `ui-v1-baseline-2026-08-17`
- Baseline commit: `0f4986550ee06c9719719fdb9ae78f4d4e3811e6`
- Demo: [demo.nexerp.id](https://demo.nexerp.id)
- Intended V2 comparison target: `compact.nexerp.id` (not deployed in Phase 0)

The tag preserves the pre-polish V1 visual and interaction baseline. The later commits on `prototype-demo` only repair demo-host mode detection and deployment routing; they do not represent the future compact redesign.

## Deployment verification

The active Cloudflare DNS record for `demo.nexerp.id` targets Biznet (`103.93.134.215`). The demo now runs as an isolated `prototype-frontend` container on the `production-light_default` network, with mock data and no backend/database dependency.

Verified on the live HTTPS URL:

- `/login` returns HTTP 200 and shows the Prototype Mode disclosure.
- `superadmin@nexerp.id` / `password123` enters `/executive/dashboard`.
- Dashboard shows `⚡ PROTOTYPE MODE — DATA CONTOH`.
- Console errors: 0 after login.
- Origin and nginx backups are retained on Biznet for rollback.

Cloudflare cache purge was not used because the available token has DNS permissions but no purge permission. Origin HTTPS was enabled with a dedicated Let's Encrypt certificate, then the DNS record was returned to proxied mode.

## Golden screenshots

- [Login desktop](screenshots/v1-login-desktop.png)
- [Executive dashboard desktop](screenshots/v1-dashboard-desktop.png)
- [Executive dashboard mobile](screenshots/v1-dashboard-mobile.png)

These files are evidence for A/B comparison; do not overwrite them during V2 work. New captures belong under a separate `compact-v2/` evidence directory.

## Rollback references

- Biznet demo source backups: `/home/dreamlab/demo-prototype-backup-20260817-phase0`, plus `frontend-before-fix*` directories.
- Biznet nginx backups: `/home/dreamlab/nexerp/nginx.conf.backup-20260817-phase0*`.
- Hetzner probe deployment was isolated and backed up under `/root/demo-prototype-backup-20260817-phase0`; it is not the active Cloudflare origin.
