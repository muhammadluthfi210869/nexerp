# E2E Live Execution — Status 2026-09-13

**Status**: SPECS READY, LIVE EXECUTION DEFERRED TO DEPLOY PHASE

## Specs present (committed earlier)
- `frontend/tests/e2e/management-task/ac-task-suite.spec.ts` (AC-TASK-001..013)
- `frontend/tests/e2e/management-task/roles-and-error-matrix.spec.ts`

## Why not executed in this phase

Full E2E execution in local sandbox requires:
1. Docker Compose up: postgres + backend + frontend dev server (port 3003)
2. Database seed for marketing module
3. JWT fixtures for `SUPER_ADMIN`, `MARKETING`, `DIGIMAR`, `DIRECTOR`, `COMMERCIAL` roles
4. Live browser (Chromium via Playwright)

Local sandbox lacks persistent Docker daemon + sufficient resources for parallel backend + frontend + Postgres + headless browser within Phase 3 plan budget. Earlier audit confirmed 2 specs were "defined but not executed in a live browser at gate time" (Phase 4 verifier sub-item 6, 2026-09-11). This phase did not close that gap.

## What this phase DID verify
- tsc clean across both refactored files (TaskWorkspaceV2 + MemberProfileView + TaskDetailModal + marketing-api.ts)
- vitest hook layer 5/5 PASS
- Spec files present and lint-clean (manually inspected)

## Execution plan (deploy phase / user-driven)

```powershell
# From repo root
docker compose up -d db
npm --prefix backend run db:migrate:deploy
npm --prefix backend run db:seed:marketing
npm --prefix backend run start:dev &           # port 3002
npm --prefix frontend run dev -- -p 3003 &     # port 3003
cd frontend && npx playwright test tests/e2e/management-task/ --reporter=html
```

Expected: both specs PASS (matches QA Gate 2026-09-12 PASS claim for AC-TASK-*).

## Risk if skipped
- AC-TASK-* acceptance IDs unproven in running browser
- Optimistic concurrency 409 dialog UX unproven at runtime
- Role×error state matrix (401/403/404/409/validation) unproven

Mitigation: roll back mock data leak = 0 invariant (manual verification per Phase 4 verifier sub-item 3 already documented).
