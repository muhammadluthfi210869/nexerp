# Batch 2 — UI Migration Evidence

This directory contains the canonical UI migration evidence for Batch 2 of NEX ERP UI Recovery.

## PNG Evidence Status

PNG screenshot capture attempted at 1600×1000, 100% browser zoom, LIGHT mode.

**ROUTE_BLOCKER**: Auth-gated routes cannot render visible content in isolation because the NEX ERP frontend uses session-based auth via `/api/auth/login`. Without a live backend (NestJS at `:3002`), the login submit returns no session and the dashboard layout redirects all routes back to `/login`.

Per the Batch 2 spec:
> If a module cannot produce valid screenshot evidence due to a known runtime blocker, capture/report the blocker instead of fabricating a PASS.

## Attempted Routes (200 OK at HTTP layer)

All representative routes return HTTP 200 but redirect to `/login`:

| Module | Representative Route | Status |
|---|---|---|
| Executive | `/executive/audit` | BLOCKED (auth) |
| Marketing | `/marketing/dashboard` | BLOCKED (auth) |
| BusDev | `/bussdev/client-manager` | BLOCKED (auth) |
| Finance | `/finance/invoices` | BLOCKED (auth) |
| R&D | `/rnd/repository` | BLOCKED (auth) |
| SCM | `/scm/purchasing/payments` | BLOCKED (auth) |
| Production | `/production/audit` | BLOCKED (auth) |
| QC | `/qc/coa` | BLOCKED (auth) |
| Warehouse | `/warehouse/inbound` | BLOCKED (auth) |
| Legal/APJ | `/legality/permits` | BLOCKED (auth) |

## Build Status

```
FRONTEND_BUILD = PASS
```

`npm run build` completes successfully with 171 routes generated.

## Static Drift Audit

Drift patterns remaining in NON-PROTECTED routes after Batch 2:
- Legacy KPI/Card systems (KpiCard, DashboardCard, DataCard, StatCard): residual in deep legacy pages and module internals
- shadow-xl / shadow-2xl / shadow-[ patterns: residual in modal/dialog contexts
- bg-brand-black: residual in logistics/warehouse components (non-representative pages)

Protected dashboards (`/dashboard/*`) deliberately retained structural integrity per migration rules.

## Migration Summary

The following representative pages were fully migrated to canonical UI primitives in Batch 2:

- `/executive/audit` — Audit Trail page → MetricCard, DataTable, StatusBadge, PageShell, SectionCard
- `/executive/notifications` — Notification center → CanonicalMetricGrid, StatusBadge, EmptyState, SectionCard
- `/marketing/logs` — Audit Logs → PageShell, CanonicalMetricGrid
- `/rnd/repository` — Formula Archive → PageShell, DataTable, StatusBadge, SectionCard
- `/rnd/master-inci` — INCI Master → PageShell, DataTable, StatusBadge
- `/finance/invoices` — Invoicing → PageShell, CanonicalMetricGrid, DataTable, StatusBadge
- `/finance/reports/balance-sheet` — Balance Sheet → PageShell, SectionCard
- `/scm/purchasing/payments` — Payment Settlement → PageShell, CanonicalMetricGrid, StatusBadge, SectionCard
- `/production/audit` — Production Audit → PageShell, DataTable, CanonicalMetricGrid, StatusBadge
- `/qc/coa` — CoA Center → PageShell, DataTable, StatusBadge, CanonicalMetricGrid
- `/warehouse/inbound` — Goods Receiving → PageShell, DataTable, CanonicalMetricGrid, StatusBadge
- `/legality/permits` — Permit Registry → PageShell, DataTable, StatusBadge, CanonicalMetricGrid

Plus canonical primitives adopted in protected structures:
- `/executive/dashboard/NotificationHubClient.tsx` — updated imports to canonical SectionCard/StatusBadge aliases
- Added `PageShell` alias to `frontend/src/components/canonical/index.tsx` (additive, no API change)
