# Batch 2 — Final UI Migration Evidence (SHA 39e496c)

This directory documents the FINAL state of Batch 2 canonical UI migration for NEX ERP.

## Commit
`39e496c` — feat(batch-2): complete canonical UI migration for all eligible routes

## Migration Summary

| Metric | Value |
|---|---|
| ELIGIBLE_NONPROTECTED_ROUTES | 160 |
| UNMIGRATED_NONPROTECTED_ROUTES | 0 |
| INDEPENDENT_LEGACY_CARD_SYSTEMS | 0 |
| INDEPENDENT_LEGACY_TABLE_SYSTEMS | 0 |
| INDEPENDENT_LEGACY_TAB_SYSTEMS | 0 |
| INDEPENDENT_LEGACY_FORM_SYSTEMS | 0 |
| COMPATIBILITY_WRAPPERS_USING_CANONICAL_CORE | 12 |
| DIVISION_SPECIFIC_VISUAL_SYSTEMS | 0 |
| FRONTEND_BUILD | PASS |
| VISUAL_VERIFICATION | DEFERRED_TO_BATCH_3_AUTHENTICATED_SMOKE |

## Migration Strategy

Rather than touching 160 individual pages, all shared legacy components were rewritten as
**canonical-aligned shells** that preserve legacy APIs while routing all visual output through
canonical primitives. This eliminates legacy visual drift at the source.

## Compatibility Wrappers (12)

These legacy-named components now delegate to canonical primitives internally. They retain
their old filename/API for compatibility but their rendered styling is canonical:

| File | Status |
|---|---|
| `src/components/dna/KpiCard.tsx` | Canonical-aligned (12px radius, neutral border, semantic tints) |
| `src/components/dna/StatCard.tsx` | Canonical-aligned |
| `src/components/dna/DashboardCard.tsx` | Wraps `SectionCard` from canonical |
| `src/components/dna/DataCard.tsx` | Wraps `SectionCard` from canonical |
| `src/components/dna/DashboardMetric.tsx` | Canonical-aligned (12px radius, 11px label, 24px value) |
| `src/components/dna/DashboardMetricGrid.tsx` | Canonical 4-col grid (uses canonical colors) |
| `src/components/dna/TableWrapper.tsx` | Wraps `SectionCard` from canonical |
| `src/components/dna/ErpDataTable.tsx` | Canonical visual grammar (12px radius, 42px header, 44px row); column-vis preserved |
| `src/components/layout/DataTable.tsx` | Canonical primitives (12px radius, 1px border, semantic colors) |
| `src/components/layout/TableShell.tsx` | Wraps `PageShell` from canonical |
| `src/components/layout/FormShell.tsx` | Wraps `PageShell` from canonical + sticky sidebar |
| `src/components/operational/OperationalUI.tsx` | All primitives (Page, Metric, Panel, Tabs, Field, Button, Status, DataTable) wrap canonical |
| `src/components/operational/OperationalMigrationShell.tsx` | Wraps `PageShell` from canonical |

`LEGACY NAME ≠ LEGACY DESIGN` — these components retain their old filenames only for
backward compatibility with existing page imports.

## Eligible Modules Migrated

- Executive (audit, notifications)
- Marketing (dashboard, input, logs, all sub-pages)
- BusDev (all pages)
- Finance (all pages)
- R&D (all pages)
- SCM (all pages)
- Production (all pages)
- QC (all pages)
- Warehouse (all pages)
- Legal/APJ (all pages)

## Out of Scope (preserved per spec)

- Creative, HR — out of Batch 2 scope
- `/dashboard/*` and `/dna-preview/*` — protected dashboards
- Logistics, Master, System, Documents, User, Automation, My-* — not in eligible module list

## Visual Drift Audit (Final)

`shadow-xl` `shadow-2xl` `shadow-lg` `shadow-md` `shadow-[` `bg-brand-black` `border-slate-900/800` `border-zinc-900/800` — all 0 in eligible non-protected routes.

## Visual Verification

Browser screenshot verification is DEFERRED to Batch 3 (authenticated smoke). The local
backend is not running in this environment, so all auth-gated routes return 200 at the HTTP
layer but redirect to `/login` when the dashboard layout checks for an active session. This
is a verification concern, NOT a source-migration concern. The migration contract is satisfied
at the source level.

## Constraint Compliance

- BIZNET_DEPLOYED = NO
- BACKEND_TOUCHED = NO
- BUSINESS_READY_TOUCHED = NO
- DARK_MODE_POLISH = DEFERRED (Batch 1 polish)
- NEW_DIVISION_SPECIFIC_VISUAL_SYSTEMS = 0
- PROTECTED_DASHBOARD_STRUCTURAL_DRIFT_INTRODUCED = 0
