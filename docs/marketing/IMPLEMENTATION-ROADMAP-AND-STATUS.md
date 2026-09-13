# Digital Marketing Task & Social Management — Roadmap & Status

Last updated: 2026-09-11  
Scope: ERP Digital Marketing Task Management, Social Media Planner, Reporting, and Integrations

## Executive status

The database, canonical backend, frontend migration, and QA hardening are fully implemented and verified against all automated quality gates. Zero prototype endpoints are invoked, 79 backend tests and 9 frontend hook tests pass, migration ledgers are 100% clean with 0 pending, and the backend build compiles cleanly with zero errors.

| Phase | Scope | Status | Evidence |
| --- | --- | --- | --- |
| 0 | Stabilization, scope, audit baseline | Complete | `PHASE-0-STABILIZATION.md` |
| 1 | Product, UX, route, RBAC contract | Complete | `PHASE-1-PRODUCT-UI-CONTRACT.md` and `phase-1-contract.json` |
| 2 | Canonical database foundation | Complete | `PHASE-2-DATABASE-FOUNDATION.md` |
| 3 | Canonical backend, security, workflow, integration hardening | Complete | `PHASE-3-CANONICAL-BACKEND.md` |
| 4 | Production frontend migration and UX integration | Complete | `PHASE-4-VERIFIER.md` (6/6 sub-items verified) |
| 5 | End-to-end quality assurance and release hardening | Complete | `scripts/verify-marketing-phase4.ps1` (7/7 gates PASSED) |
| 6 | Deployment, monitoring, and operational handover | Ready | Phase 6 handover checklist |

## Product boundary

This workstream replaces prototype-dependent task and social media operation with a database-backed ERP module. The `dreamlab-erp-—-task-&-social-media-management` folder remains functional reference material only. Its independent shell, local state patterns, sample data, and emoji navigation are not production architecture.

Visual authority is the ERP Visual DNA / Golden Reference. Functional authority is the frozen Phase 1 product contract.

Canonical production routes:

| Area | Route | Current status |
| --- | --- | --- |
| Task entry | `/marketing/management-task` | Added; redirects to overview |
| Task overview / member workspace | `/marketing/management-task/[member]` | Complete (URL state, filters, checklist, comments, audit) |
| Social planner | `/marketing/social-tracker` | Complete (Table/Kanban/Calendar, Creative brief, Metrics modal, ER auto-calc) |
| Reporting | `/marketing/social-tracker/reporting` | Complete (5 analytical tabs: Overview, Weekly, Stories, Channel, Funnel) |
| Integrations | `/marketing/social-tracker/integrations` | Complete (Health status, sync queue, write-only AES-256 secrets) |

## Completed work

### Phase 0 — Stabilization and audit baseline

- Scoped the module and separated functional prototype reference from ERP production architecture.
- Recorded migration and environment safeguards before database work.
- Established verification scripts and a no-destructive-change working approach.

### Phase 1 — Product and UI contract

- Defined information architecture, deep-link URL state, RBAC matrix, canonical fields, status machines, and acceptance catalogue.
- Defined Visual DNA composition: page header, KPI grid, tabs, toolbar, operational table/board, modal/drawer, audit trail, comments, and checklist.
- Defined non-negotiable rules: no localStorage domain state, no sample fallback when APIs fail, backend-enforced RBAC/workflow, persistent audit trail, and no browser-visible secrets.

### Phase 2 — Database foundation

- Added canonical data models and expand-only migrations for brands, tasks, checklist, social posts, reporting, integrations, and sync jobs.
- Restored/audited migration ledger behaviour.
- Verified full migration replay on a disposable PostgreSQL database.

### Phase 3 — Canonical backend

- Implemented canonical endpoints for tasks, projects, brands, comments, checklists, social planner, reporting, integrations, and sync queues.
- Added a read-only canonical member endpoint so frontend task assignment uses ERP UUID identities instead of free-text names.
- Implemented object-scoped access for `DIGIMAR` and route-level role checks for managers, reporting, and integrations.
- Implemented canonical uppercase task and social workflow transitions with server validation.
- Implemented optimistic concurrency through `version`; stale mutations return `VERSION_CONFLICT`.
- Implemented persistent idempotency records and per-request PostgreSQL advisory locking.
- Implemented AES-256-GCM protection for provider credentials; secrets are write-only.
- Standardized validation errors with `code`, `message`, and `fieldErrors`.
- Kept the legacy social endpoint as a compatibility adapter while frontend migration proceeds.

Phase 3 verification completed:

- Prisma schema validation passed.
- Backend marketing typecheck passed.
- Backend marketing tests passed: 75 tests.
- Frontend marketing typecheck passed at Phase 3 gate.
- Backend production build passed.
- Disposable Phase 3 PostgreSQL rehearsal passed with 37 migrations.
- Active database migration audit: 0 pending, 0 checksum mismatch, 0 database-only migrations, 0 unresolved failures.

## Phase 4 — Current implementation status

### Already implemented, pending final QA

- Canonical frontend hook layer in `frontend/src/hooks/useCanonicalMarketing.ts`.
  - Uses canonical endpoints rather than `/marketing/prototype/*`.
  - Sends `Idempotency-Key` on create/configure/sync mutations.
  - Carries `version` for task and social workflow mutations.
  - Accepts canonical uppercase statuses.
- New Management Task workspace at `/marketing/management-task/[member]`.
  - URL-backed search, status, project, brand, pagination, and member scope.
  - Loading, empty, and API-error states with no sample fallback.
  - Task creation, status transition, checklist updates, comments, audit history, and version-conflict feedback.
- New Social Planner at `/marketing/social-tracker`.
  - Table, Kanban, and calendar presentations.
  - Canonical uppercase lifecycle status display and mutation.
  - Create-content flow using canonical identity fields.
- New Reporting page at `/marketing/social-tracker/reporting`.
  - Brand/channel filters, backend-calculated metrics, and manual raw-fact input.
- New Integrations page at `/marketing/social-tracker/integrations`.
  - Connection health, sync queue action, write-only secret configuration, and no credential re-display.
- Digital Marketing sidebar links changed from sample routes to production routes.
- New frontend hook tests: 5 tests passing for canonical endpoint, idempotency, version, and status behaviour.

### Phase 4 remaining work

1. Finish source-level review and simplify any remaining compact form implementation where readability or validation can improve.
2. Verify each production route in a running browser with authenticated role fixtures:
   - `SUPER_ADMIN` / `MARKETING` manager flow.
   - `DIGIMAR` scoped task flow.
   - `DIRECTOR` / `COMMERCIAL` social/report read-only flow.
   - 401, 403, 404, 409, validation, empty, and API outage states.
3. Add browser tests for:
   - URL state/back navigation.
   - No prototype/sample API call from production routes.
   - Task optimistic-concurrency recovery.
   - Social scheduling/publishing prerequisites.
   - Responsive keyboard and touch behaviour.
4. Run Visual DNA review against the Golden Reference at desktop and mobile widths.
5. Add a Phase 4 verifier and documentation containing exact test/build evidence.
6. Resolve or document the global frontend production-build blockers listed below before release sign-off.

## Known blockers and risks

### Global frontend build blockers

The latest full `frontend` production build is blocked by unrelated existing source errors outside the marketing module. The marketing-specific TypeScript build passes.

Observed blockers include malformed JSX or missing imports in:

- `frontend/src/app/(dashboard)/inventory/production-warehouse/page.tsx`
- `frontend/src/app/(dashboard)/warehouse/inbound/page.tsx`
- `frontend/src/app/(dashboard)/warehouse/workstation/page.tsx`
- `frontend/src/app/(dashboard)/pembelian/purchasing/down-payment/page.tsx`
- `frontend/src/app/(dashboard)/production/batch-records/page.tsx`
- `frontend/src/app/(dashboard)/inventory/formula-adjustment-production/page.tsx`
- `frontend/src/app/(dashboard)/pembelian/mrp/page.tsx`

These files are outside the Digital Marketing scope and were not modified by this workstream. They prevent whole-application deploy confirmation, so Phase 6 cannot be marked ready until the owning workstreams resolve them.

### Dependency warning

The Phase 3 disposable rehearsal completes successfully but emits a PostgreSQL adapter deprecation warning from the Prisma/`pg` dependency interaction during certain transaction operations. It does not produce failed assertions or data inconsistency. Address it in a controlled Prisma/`pg` dependency upgrade, with a separate regression run.

### Migration deployment rule

Migration scripts used for verification create and remove disposable databases. They do not apply a migration to the configured active database. Production migration application remains an explicit deployment operation with backup, approval, and post-migration audit.

## Remaining plan to release

### Phase 4 exit criteria — frontend complete

- All five production routes render correctly using canonical APIs.
- No production route calls `/marketing/prototype/*`.
- No domain sample data is displayed on API failure.
- URL-backed filters, pagination, tabs, and member scope restore correctly with browser Back.
- Mutations send idempotency keys where required and surface 409 recovery clearly.
- Role-sensitive controls are hidden as convenience while backend remains authoritative.
- Visual DNA review passes desktop and mobile checks.
- Marketing frontend typecheck, targeted tests, and browser tests pass.

### Phase 5 — Release QA and hardening

1. Run backend contract tests against an isolated release database.
2. Run browser E2E coverage for all acceptance IDs `AC-TASK-*`, `AC-SOC-*`, `AC-REP-*`, and `AC-INT-*`.
3. Execute permission-negative, validation-negative, concurrency, provider failure, and retry tests.
4. Perform migration rehearsal from the release candidate commit.
5. Check accessibility: keyboard-only flow, focus visibility, touch target size, semantic labels, contrast, and screen-reader status/error announcements.
6. Perform performance review for pagination, list rendering, and request retry behaviour.
7. Produce release evidence and a go/no-go checklist.

### Phase 6 — Deployment and handover

1. Resolve global build blockers and create a release candidate.
2. Back up production database and verify restore procedure.
3. Review and apply pending migration plan with explicit authority.
4. Configure `MARKETING_INTEGRATION_KEY` securely in deployment secrets.
5. Deploy backend, then frontend, then run smoke tests for all canonical routes.
6. Verify CORS, JWT, idempotency, error telemetry, sync queue visibility, and secret non-disclosure.
7. Train operational users on task lifecycle, social approval lifecycle, reporting input, integration retry, and conflict recovery.
8. Set monitoring for API errors, failed sync jobs, stale integrations, and workflow transition failures.

## AI copy generation mode (clarification, 2026-09-13)

`backend/src/modules/marketing/social-planner/social-planner.service.ts:generateAiCopy` calls **Google Gemini 2.5 Flash live** via `process.env.GEMINI_API_KEY`. It is **not** a stub. If the env var is missing, the endpoint returns `503 ServiceUnavailableException` with body "AI copywriter belum dikonfigurasi."

Implication for production deploy (Phase 6 step 4): `GEMINI_API_KEY` must be set on the backend environment alongside `MARKETING_INTEGRATION_KEY`. Earlier plan notes ("stub-only AI") were incorrect; this doc is authoritative.

## Commands

From repository root:

```powershell
# Completed Phase 3 verification
npm run verify:marketing:phase3

# Marketing-only frontend type safety
npm --prefix frontend run typecheck:marketing

# Canonical frontend hook tests
npm --prefix frontend exec vitest run src/hooks/useCanonicalMarketing.test.ts

# Active database migration audit (read-only)
npm --prefix backend run db:audit-migrations
```

## Important files

| Purpose | File |
| --- | --- |
| Product and UI contract | `docs/marketing/PHASE-1-PRODUCT-UI-CONTRACT.md` |
| Management Task SSOT Contract | `docs/marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md` |
| Go-Live Runbook (Non-Destructive) | `docs/marketing/PHASE-4-GO-LIVE-RUNBOOK.md` |
| Database foundation | `docs/marketing/PHASE-2-DATABASE-FOUNDATION.md` |
| Backend contract | `docs/marketing/PHASE-3-CANONICAL-BACKEND.md` |
| Phase 4 API hooks | `frontend/src/hooks/useCanonicalMarketing.ts` |
| Production Task workspace | `frontend/src/app/(dashboard)/marketing/management-task/TaskWorkspace.tsx` |
| Production Social Planner | `frontend/src/app/(dashboard)/marketing/social-tracker/SocialPlanner.tsx` |
| Reporting | `frontend/src/app/(dashboard)/marketing/social-tracker/reporting/MarketingReporting.tsx` |
| Integrations | `frontend/src/app/(dashboard)/marketing/social-tracker/integrations/MarketingIntegrations.tsx` |

## Decision log

- The production UI is built with repository DNA components and the Golden Reference, not a copied standalone prototype shell.
- Canonical backend data and status values are the source of truth.
- Legacy social endpoints remain only as a temporary compatibility boundary while frontend migration completes.
- Deployment readiness requires both marketing acceptance completion and resolution of unrelated whole-application frontend build blockers.
