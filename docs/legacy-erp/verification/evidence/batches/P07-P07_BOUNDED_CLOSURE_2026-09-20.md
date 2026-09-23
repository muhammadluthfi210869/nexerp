# P07 Bounded Closure Handoff — 2026-09-20

**Scope:** P07 CRM, Marketing, Guest Book and BusDev closure per
`P07_FINAL_BOUNDED_CLOSURE_PROMPT.md`.
**Verdict:** CLOSED. All four P1 root-cause groups (A–D) pass through
production paths; `npm run verify:p07` exits 0; predecessor E2E passes;
residue 0.

## Canonical HTTP/service path selected

- `BussdevController.lead` and `BussdevController.lead/:id/advance` now call
  `LeadService` (the canonical P07 lead implementation) directly. The legacy
  parallel `BussdevService` still backs non-lead endpoints (analytics, sample
  hub, retention) but no longer fronts lead create/advance.
- `LeadService.createLead` accepts `organizationId` in the dto; if absent,
  the row is persisted with `organizationId = null` (legacy inaccessibility
  rule for ordinary tenants).
- `LeadService.advanceLeadStageGoverned` is the canonical stage/qualification
  command; it requires an actor context (`userId`, `organizationId`, `roles`,
  `correlationId`, optional `idempotencyKey`). Duplicate `BussdevService`
  paths for these endpoints were removed from the controller.

## Migration / backfill / null-row handling

- New migration `20260920120000_p07_tenant_isolation` adds
  `organizationId UUID NULL` columns + indexes on `sales_leads`,
  `lead_captures`, `bussdev_staffs`, `guest_logs`. Safe expand only;
  no backfill; legacy null rows are excluded from tenant-scoped reads.
- `LeadService.getLeadByIdScoped`, `listLeadsScoped`, and
  `getLeadDashboardScoped` reject with `TENANT_UNRESOLVED` (400) when the
  caller does not provide a trusted server-resolved `organizationId`. For
  ordinary tenants, rows whose `organizationId` does not match are returned
  as non-disclosing `404 Lead tidak ditemukan`.
- Public lead intake (`LeadCaptureService.upsertOrphanLead`) remains
  unaffected; trust boundary stays at the WhatsApp webhook.

## A–D commands with exit codes, counts and durations

| Group | Command | Exit | Tests | Duration |
|---|---|---:|---:|---:|
| A | `npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns p07-sf3-pipeline` | 0 | 9/9 (incl. cross-tenant deny, idempotency, illegal-transition) | ~100s |
| B | `npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns p07-sf6-golden-thread` | 0 | 1/1 (1 audit + 1 outbox + 1 business effect; rollback leaves zero) | ~90s |
| C | `npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns p07-sf2-intake` | 0 | 4/4 (incl. consent-rejected appendAttribution with zero side effects) | ~120s |
| D | `npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns p07-sf4-dashboard` | 0 | 2/2 (incl. tenant-scoped exact `toBe` reconciliation) | ~75s |
| Neg | `npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns p07-negative-` | 0 | 2/2 (audit/outbox denial + dashboard divergence) | ~60s |

## Exact assertions

- **Tenant denial:** `p07-sf3-pipeline.unit-spec.ts → cross-tenant attempt
  via governed path is denied with zero side effects`. Asserts: tenant B
  call rejects, `salesLead.status === NEW_LEAD` unchanged, `auditLog` and
  `outboxEvent` counts unchanged.
- **Rollback atomicity:** `p07-sf6-golden-thread.unit-spec.ts → golden
  thread`. Asserts success path produces exactly 1 audit row + 1 outbox row
  per `correlationId`. Illegal-transition attempt rolls back: status
  unchanged, `auditLog`/`outboxEvent` counts unchanged.
- **Concurrency:** `p07-sf3-pipeline.unit-spec.ts → concurrent identical
  governed commands collapse to one business effect`. Three concurrent
  identical commands resolve to one `auditLog` row and one `outboxEvent`
  row.
- **Dashboard numeric:** `p07-sf4-dashboard.unit-spec.ts → tenant-scoped
  dashboard reconciles exactly with seeded source totals`. Seeds 2
  tenant-A in-range + 1 tenant-A out-of-range + 1 tenant-B in-range; asserts
  `dashboard.total === sourceTenantAInRange` (strict `toBe`), and that
  dashboard total is NOT equal to the seeded mixed counts (excludes
  cross-tenant and out-of-range rows).
- **Idempotency conflict:** `p07-sf3-pipeline.unit-spec.ts → idempotency:
  same scope+key + different payload is rejected`. Asserts second call with
  same `(scope, key)` but different payload throws
  `IDEMPOTENCY_KEY_REUSED`.

## `verify:p07` and predecessor E2E

| Command | Exit | Tests | Duration |
|---|---:|---:|---:|
| `npm run verify:p07` | 0 | 21 backend + 6 frontend | ~155s |
| `npx jest --config ./test/jest-e2e.json --runInBand --runTestsByPath test/master/master-governed-import.e2e-spec.ts` | 0 | 14/14 | ~204s |

## Residue

`scripts/ssot/p07_clean_db.js` reports `test-DB residue: 0` and
`server residue: 0 nex_p07_* databases` after `verify:p07`.

## Remaining scoped P0/P1

- Scoped P0: 0
- Scoped P1: 0

## P2/P3 backlog (non-blocking)

- `BussdevService` still exists and backs non-lead endpoints (analytics,
  sample hub, retention). It does not duplicate lead-create or
  lead-advance anymore; collapsing it into `LeadService` for non-lead
  endpoints is cosmetic and P3.
- `p07_clean_db.js` warns but exits 0 when server-level `nex_p07_*`
  databases exist. Same behaviour as before.
- Jest reports an open-handle warning after the P07 backend suites.
- Tenant resolution for `LeadCaptureService.upsertOrphanLead` (public
  intake) is not yet wired into the new `organizationId` column on
  `lead_captures`. Public intake still relies on the trusted config /
  agent assignment.

## Deviations

- `LeadCaptureService` is not converged into `LeadService` because it is
  public intake (different trust boundary). The controller path for lead
  CRUD and lead advance now flows through `LeadService` directly.
- Tests call `LeadService.advanceLeadStageGoverned` with a synthesized
  actor context; the production controller wires the JWT actor at the
  edge. The seam is one composition site (controller method).
- The Dashboard test still uses `LeadCaptureService.getDashboardAnalytics`
  as a baseline (legacy CRM surface) and adds a separate
  `LeadService.getLeadDashboardScoped` test that proves exact `toBe`
  reconciliation for the production BusDev dashboard. Both pass.
