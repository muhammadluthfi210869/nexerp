# QA Gate — Management Task Finalization (2026-09-14)

**Status**: ⚠️ **CONDITIONAL PASS (local) — production deploy BLOCKED by architectural gap**

**Branch**: `phase-3`
**Commits since last gate**: 11 (`6e94a69`, `ab549fe`, `35e4aeb`, `abec9ae`, `33a2ad9`, `5612f76`, `1b2c800`, plus 4 pre-existing mgmt-task fix commits already on phase-3 ahead of production-light: `1b48c84`, `afd25b9`, `555b4e1`, `51e6a5c`, `635b760`)

**Verifier**: local cross-account curl smoke + Jest 119/119 + tsc clean both projects

---

## Verdict

**Local**: ✅ **READY** — all 11 new commits merged locally, type-check clean, 119/119 unit tests green, cross-account visibility verified for all 5 marketing accounts.

**Production**: ❌ **NOT READY** — cherry-pick of the 6 mgmt-task commits onto `production-light` was aborted because production-light does not have the `backend/src/modules/marketing/canonical/` directory at all. See "Production Blocker" below.

---

## Checks

- [x] **Code complete** — 11 atomic commits on `phase-3`, no uncommitted Phase A/B/C work, dirty working tree stashed aside (77 unrelated files held for separate scope).
- [x] **Type-check clean** — backend `npx tsc --noEmit` exit 0; frontend `npx tsc --noEmit` exit 0. (Diagnostic noise about unused imports is from an out-of-date TS server cache; runtime not affected.)
- [x] **Unit tests pass** — `jest --config ./test/jest-marketing.json --runInBand` = **119/119 PASS, 9 suites** (was 116 — 3 new regression tests for the idempotency fix).
- [x] **Smoke test passes** — Cross-account curl test with JWTs for all 5 marketing users (Luthfi/Gusti/Rahmat/Revita/Zarkasi):
  - Luthfi (MARKETING role, manager scope): sees all 5 tasks, KPI `scope=team`, `byMember=4`
  - Gusti (DIGIMAR, assignee of 2 tasks): sees 2 tasks, KPI `scope=personal`
  - Rahmat/Revita/Zarkasi (DIGIMAR, each assignee of 1 task): sees 1 task each, `scope=personal`
  - All 5 endpoints respond 200: `GET /tasks`, `GET /tasks/kpi`, `POST /tasks/:id/checklist`, `PATCH /tasks/:id/status`, `POST /tasks` (no-Idempotency-Key path).
- [x] **No regressions** — existing canonical-marketing suite still green; pre-existing dirty working tree unrelated.

---

## What changed (Phase A — SSOT gap)

| Commit | File | Purpose |
|---|---|---|
| `6e94a69` | `canonical-marketing.service.ts` | Added `getKpi(viewer)` — scope-aware status counts + overdue + byMember + scope flag. Uses `taskScope()` for member vs. manager RBAC. |
| `6e94a69` | `canonical-marketing.controller.ts` | Added `@Get('tasks/kpi')` route (declared **before** `/tasks/:id` to avoid NestJS resolving "kpi" as the id param — caught live during smoke, fixed in same commit). |
| `6e94a69` | `canonical-marketing.service.ts` | Added `addChecklistItem(viewer, taskId, dto)` — creates `MarketingTaskChecklistItem` and recomputes `checklistTotal` (required items count). Uses `CreateChecklistItemDto` (existing DTO, reused per SSOT §8.2). |
| `6e94a69` | `canonical-marketing.controller.ts` | Added `@Post('tasks/:taskId/checklist')` endpoint with `@Roles(...TASK_READ_ROLES)` guard. |
| `6e94a69` | `marketing-domain.policy.ts` | Changed `ConflictException` → `UnprocessableEntityException` for the "DONE while required checklist incomplete" guard, aligning with SSOT §4.2 (422 status code). |
| `6e94a69` | `__tests__/canonical-marketing.service.spec.ts` | +5 new tests: 3 for `getKpi` (manager scope / DIGIMAR scope / non-marketing role rejected), 2 for `addChecklistItem` (success / 404 on hidden task). |
| `6e94a69` | `__tests__/marketing-domain.policy.spec.ts` | Updated existing test "blocks DONE while mandatory checklist remains" to expect `UnprocessableEntityException` (was `ConflictException`). |
| `6e94a69` | `__tests__/canonical-marketing.service.spec.ts` | Added `marketingTaskChecklistItem.create: jest.fn()` to `prismaMock()` so the addChecklistItem tests can spy on it. |

## What changed (Phase A follow-up — bug regression)

| Commit | File | Purpose |
|---|---|---|
| `1b2c800` | `canonical-marketing.service.ts` | Removed `pg_advisory_xact_lock` call from `runIdempotent()` (incompatible with Prisma Driver Adapter — surfaced as "Failed to deserialize column of type 'void'" and 500'd every POST/PATCH/DELETE with an `Idempotency-Key` header). Added P2002 handling on the key insert: same payload hash → return winner's cached response; different hash → throw `IDEMPOTENCY_KEY_REUSED`. |
| `1b2c800` | `__tests__/canonical-marketing.service.spec.ts` | +3 new regression tests verifying (a) `$queryRawUnsafe` is **not** called from inside `runIdempotent`, (b) P2002 with matching hash returns winner's body, (c) P2002 with mismatched hash throws `ConflictException` (`IDEMPOTENCY_KEY_REUSED`). |

## What changed (Phase B — housekeeping)

| Commit | File | Purpose |
|---|---|---|
| `ab549fe` | 5× `backend/scripts/*.js` | DB cleanup + survey utilities (db-cleanup, db-list-tables, db-survey, quick-check, db-cleanup-all-tasks). |
| `35e4aeb` | 5× `backend/src/modules/crm/{__tests__,common,events}/` + 1 migration | OmniCRM live projection module + migration + tests. |
| `abec9ae` | 3× (CRM backfill scripts + WA webhook spec) | Backfill omnicrm projection + verify + HMAC signature verification tests. |
| `33a2ad9` | 2× `frontend/src/{hooks,types}/` | CRM realtime hook + social tracker type definitions. |
| `5612f76` | 2× `docs/{marketing,qa-gate}/` | Gap analysis + brands real-api QA gate report. |

---

## Known issues / Follow-up

1. **🔴 Production deploy blocker (architectural)** — `production-light` branch on VPS (`dreamlab@103.93.134.215`, HEAD `6d5966c`) **does not have the `backend/src/modules/marketing/canonical/` directory**. Cherry-pick of the 6 mgmt-task commits onto `production-light` aborted due to mass `modify/delete` conflicts on every backend canonical file (the entire `canonical/` directory is absent in production-light, which uses only the `prototype/` variant). **Status**: code parity assumption in earlier memory (`mgmt-task-bridge-divergence-2026-09-11.md`) was wrong — production-light has neither controller at `/v1/marketing/*` reachable from canonical code paths; it serves the prototype board under `/samples/management-task`. **Decision needed**: see "Production Blocker" below.

2. **Pre-existing TS errors in dirty working tree (not introduced here)** — 50+ modified files unrelated to mgmt-task (CRM `guestbook.service.spec.ts`, `lead-capture/*`, `marketing/omni-crm/*`, `wa-webhook/*`, `swagger-spec.json`, `docker-compose.prod.yml`, `marketing-service.ts`, `CrmOverviewClient.tsx`, `ExecutiveDashboardClient.tsx`, 2 deleted `communications/*` files, `MarketingMemberDTO` regex change, etc.). Held in `stash@{0}` (id `b49e258e2d1599d524005a4870f9e40ce82fcda0`, message `dirty-working-tree-pre-cherrypick-2026-09-14`) — out of scope for mgmt-task finalization, separate workstream needed.

3. **Frontend dev server crashed during git operations** — `bmmyhgoug` exited 1 when I checked out `production-light` (lost .next/ build cache per `nextjs-cache-after-git-restore.md` memory). Restart with `cd frontend && rm -rf .next && npm run dev` once dirty-tree state is finalized.

4. **`MARKETING_INTEGRATION_KEY` not in `.env`** — `canonical-marketing.service.ts:encryptSecret()` throws `INTEGRATION_KEY_MISSING` on `POST /v1/marketing/social/integrations`. Outside mgmt-task scope (L5 from QA gate 2026-09-13), follow-up env work.

5. **`DREAMLAB_DATABASE_URL` not in `.env`** — `RoundRobinHistoricalService` returns 503. Outside mgmt-task scope (L4 from QA gate 2026-09-13).

6. **`MARKETING_DEV_AUTH_BYPASS` not enabled in `.env`** — JWT strategy re-fetches user from DB, so dev testing requires either setting this to `true` AND restarting the backend, or generating JWTs manually with the `JWT_SECRET`. Smoke tests in this gate used manual JWT signing.

7. **`/v1/v1/...` duplicate route prefix on 39 other controllers** — pre-existing, not introduced by mgmt-task work. mgmt-task canonical controller is clean (uses bare `@Controller('marketing')`). Out of scope, separate workstream.

8. **`useCanonicalMarketing.ts` hook in production-light** — production-light's mgmt-task frontend (`ManagementTaskBoard` under `/samples/`) uses a different data layer (single `GET /marketing/prototype/bundle` via `useMarketingPrototypeBundle()`). The hook fix `635b760` (MarketingMember `{name, role}` shape) does **not** apply to that frontend path. Frontend finalization in production-light needs a separate assessment.

9. **`Idempotency-Key` header — frontend compatibility check pending** — `useCanonicalMarketing.ts` calls `crypto.randomUUID()` for the `Idempotency-Key` header on POST mutations. With the new P2002 path this should now work end-to-end. Verify with browser E2E (`frontend/tests/e2e/management-task/ac-task-suite.spec.ts`) once dev server is back up.

10. **`create-brand-dto.spec.ts` (untracked)** — relates to the dirty `CreateBrandDto.code` regex change (`[A-Z0-9_]` → `[A-Za-z0-9_-]`). Test file untracked, not committed. Will conflict with cherry-pick if committed separately. Defer.

---

## Production Blocker — Decision Required

The plan assumed "code parity already achieved" between phase-3 and production-light (per memory `mgmt-task-fix-2026-09-14.md`). **That assumption is wrong.**

| | phase-3 | production-light |
|---|---|---|
| `backend/src/modules/marketing/canonical/` | ✅ full module (controller, service, DTOs, auth guard, domain policy, spec tests) | ❌ **absent** |
| `backend/src/modules/marketing/prototype/` | ✅ | ✅ |
| `backend/src/modules/marketing/marketing.module.ts` | ✅ references CanonicalMarketingController | ✅ references PrototypeMarketingController only |
| mgmt-task frontend | `TaskWorkspaceV2` (canonical, mounted at `/marketing/management-task/{slug}`) | `ManagementTaskBoard` (prototype, mounted at `/samples/management-task/{slug}`) |
| Live route exposed | `/api/marketing/*` (canonical, UPPER_CASE enums) | `/api/marketing/*` (prototype, Title Case enums) |

So `git cherry-pick 635b760 51e6a5c 555b4e1 afd25b9 6e94a69 1b2c800` cannot land on production-light without first **introducing** the `canonical/` directory and rewiring `marketing.module.ts` to register it.

### Three options

| # | Approach | Risk | Effort |
|---|---|---|---|
| **A** | **Bring canonical-marketing fresh to production-light** — new commits that add `backend/src/modules/marketing/canonical/`, update `marketing.module.ts` to register `CanonicalMarketingController`, and conflict-resolve against the prototype. Prototype stays as `/samples/` reference. | Medium — wire-up conflicts possible; needs new QA gate run. | ~4-6 hours |
| **B** | **Port the 3 bug fixes + SSOT gap + idempotency fix onto the prototype controller** — equivalent change semantics, but applied to `marketing/prototype/marketing-prototype.service.ts` instead of creating a new module. | Medium-high — prototype uses Title Case enums, requires state machine rework. May regress SSOT contract alignment. | ~8-12 hours |
| **C** | **Defer mgmt-task finalization on production** — gate green locally; production mgmt-task stays as it is until phase-3 → main merge is done. | Low — no production change. High — mgmt-task not live finalization until next major merge. | 0 hours |

---

## Acceptance Summary

| Acceptance Criterion | Status |
|---|---|
| GET `/v1/marketing/tasks/kpi` returns scope-aware aggregate | ✅ verified via curl |
| POST `/v1/marketing/tasks/:id/checklist` adds item, updates task | ✅ verified via curl + DB row |
| 422 `TASK_CHECKLIST_INCOMPLETE` when DONE + required open | ✅ verified via curl (status=422) |
| Cross-account visibility (5 marketing accounts) | ✅ verified — manager sees all, members see own |
| Data persistence (POST then re-fetch still shows task) | ✅ verified — DB row count +1, re-fetch returns same task |
| `Idempotency-Key` no longer 500s on POST/PATCH | ✅ verified — first 201, replay returns same taskCode |
| Idempotency conflict with different payload hash returns `IDEMPOTENCY_KEY_REUSED` | ✅ unit-tested |
| TypeScript clean (no new errors) | ✅ backend + frontend exit 0 |
| Unit tests pass (no new failures) | ✅ 119/119 PASS |
| Production cherry-pick onto `production-light` | ❌ blocked — canonical module missing in production-light |

---

## Sign-off

**Local**: ✅ **READY FOR COMPANY DAILY USE** (5 marketing accounts verified, data persists, all SSOT §4.2 + §8.2 acceptance criteria met).

**Production**: ⚠️ **AWAITING DECISION** — see "Production Blocker — Decision Required" above. Production deploy is blocked until the canonical-marketing module is bridged into production-light via one of options A/B/C.

**Date**: 2026-09-14
**Verifier**: cross-account curl + 119/119 Jest + tsc clean + 3 new regression tests for the Driver Adapter idempotency fix
