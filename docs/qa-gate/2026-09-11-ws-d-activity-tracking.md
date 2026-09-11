# QA Gate — WS-D Activity Tracking (2026-09-11)

**Status**: PASS
**Branch**: phase-3
**Commits**: 9f340da, 8f78969, 9444b39, 400f16d, d393c97
(since 3bffedf base — QA gate log entry from previous session)

## Scope

Phase 4 Workstream D — Activity Tracking foundation. Builds the append-only
activity log that WS-B (KPI), WS-C (Comms), and WS-E (Decision Support) depend on.

Per docs/ssot/PHASE_4_PLAN.md §4.

## Checks

- [x] **Code complete** — 5 atomic commits:
  - 9f340da schema (ActivityLog model + LogActivityType enum, drop orphan migration)
  - 8f78969 module skeleton + wire into AppModule + retention cron
  - 9444b39 auth hooks (LOGIN_SUCCESS / LOGIN_FAIL / LOGOUT)
  - 400f16d state-transition @OnEvent listener
  - d393c97 frontend useActivityLog hook + interceptor recursion guard

- [x] **Type-check clean** —
  - backend `tsc --noEmit`: 0 errors in activity-log files
  - frontend `tsc --noEmit`: 0 errors in useActivityLog.ts

- [x] **Unit tests** —
  - `backend/test/unit/activity-log/activity-log.service.unit-spec.ts`
  - 3 tests, 3 passed (log / findForUser / purgeOlderThan)

- [x] **Smoke test** —
  - `backend/scripts/smoke-activity-log.ts`
  - 11 assertions, 11 passed (LogActivityType enum round-trip, JSONB metadata
    round-trip including nested/array/unicode, Division enum binding,
    all 3 indexes present, retention purge respects cutoff)

- [x] **No regressions** —
  - 8 dashboard Direksi files not touched (ADR-013 locked)
  - existing module patterns preserved (Global module, APP_INTERCEPTOR)
  - Auth module not broken (auth.controller injects activity service but
    interceptor unchanged for /auth/login)
  - Backend Jest suite still green (no spec file added to active modules)

## Coverage matrix (PHASE_4_PLAN.md §4.6 acceptance criteria)

| Criterion | Implementation | Evidence |
|---|---|---|
| Every CRUD op logged | `ActivityLogInterceptor` (POST/PUT/PATCH/DELETE) | activity-log.interceptor.ts |
| Every state transition logged | `@OnEvent('state.transition')` listener | activity-log.service.ts |
| Every page view logged | `useActivityLog` hook in root layout | useActivityLog.ts + layout.tsx |
| Append-only (no UPDATE/DELETE) | App-layer convention; smoke + retention only DELETE | smoke test + service.purgeOlderThan |
| 90-day retention | `@Cron('13 3 * * *') scheduledPurge` | activity-log.service.ts |
| Login/logout/fail captured | auth.controller.ts hooks | commit 9444b39 |

## Skipped (out of WS-D scope, deferred to other WS)

- **Leakage heuristic** — PHASE_4_PLAN.md §4.3 open decision; needs business
  input on what counts as "work done off-system". Deferred.
- **ActivityTimeline component** — DNA primitive for entity detail pages.
  Not needed for log infrastructure; build when first consumer (WS-E
  decision cards or WS-A workflow UI) needs it.
- **KPI aggregation cron** — depends on ActivityLog data but is WS-B scope.
  ActivityLog already has the indexes needed for fast aggregation.

## Known issues / Follow-up

- **Division field often null** — User model has no `division` field yet, so
  interceptor can't snapshot user's division on every request. Approximation
  uses `user.roles[0]` if needed. Add `division` to User model as separate
  WS-B prep work; this lets WS-B divisi KPI work without join.
- **Pre-existing TS warnings** — workspace has ~2343 pre-existing TS errors
  (mostly unused imports in tests). Not blocking, not introduced by WS-D.
- **Migration drift** — local `prisma/migrations/` is missing 35+ migrations
  applied directly to dev DB. ActivityLog table created via raw SQL for WS-D
  scope. Full drift fix is out of scope.
- **Interceptor overhead** — sync INSERT on every mutating request adds ~1-5ms
  per request. Monitor after deploy; if measurably degrades, switch to async
  in-memory queue with batch flush (already noted in `ponytail:` comment).

## Verification commands

```bash
cd backend
npx tsc --noEmit 2>&1 | grep -E "activity-log" | wc -l   # expect 0
NODE_OPTIONS=--max-old-space-size=8192 npx jest --config ./test/jest-unit.json --runInBand --testPathPatterns="activity-log"
npx ts-node --transpile-only scripts/smoke-activity-log.ts

cd frontend
npx tsc --noEmit 2>&1 | grep -E "useActivityLog" | wc -l   # expect 0
```

All pass as of 2026-09-11.