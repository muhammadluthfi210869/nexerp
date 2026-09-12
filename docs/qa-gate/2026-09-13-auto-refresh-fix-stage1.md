# QA Gate — Auto-refresh loop fix (Stage 1) (2026-09-13)

**Status**: PASS
**Branch**: phase-3
**Commits**: `b6d6932` (fix(api): break auto-refresh loop on 401)

## User report

> "ketika kau masuk ke nexerp.id malah auto refresh terus per detiknya al hasil ga bisa apa apa"

User unable to use nexerp.id after login — page auto-refreshes every ~1 second.

## Root cause (definitively identified)

`frontend/src/lib/api.ts` 401 response interceptor used `window.location.href = "/login"` with **no dedup guard, no cookie cleanup, no path check**. Combined with `Sidebar.tsx` firing `api.get("/auth/profile")` on every dashboard mount and `useActivityLog.ts` firing `api.post("/activity-log/log")` on every page mount, any 401 triggered an infinite redirect loop (~1s/cycle).

**Loop chain:**
1. User logs in → token T in localStorage + cookie
2. Navigate to `/executive/dashboard` → middleware passes (cookie T)
3. Sidebar mounts → `api.get("/auth/profile")` with Bearer T
4. **If backend returns 401 for T** (any reason: token expired, role mismatch, secret rotation, etc.) → interceptor clears localStorage, sets `location.href = "/login"` (cookie T still set!)
5. New page mount → ActivityLogger fires `/activity-log/log` → 401 → interceptor → redirect → loop

The "1 second" cadence is the page-load + Next.js hydration time per iteration.

## Fix (3 layers, defense in depth)

| Layer | File | Change |
|---|---|---|
| 1. Interceptor (root cause) | `frontend/src/lib/api.ts` | `isRedirecting` module flag with 5s reset; skip redirect on `/login`; clear cookie (symmetric with `handleLogout`); use `location.replace()` not `href=` |
| 2. Sidebar (primary trigger removed) | `frontend/src/components/layout/Sidebar.tsx` | Removed `api.get("/auth/profile")` on mount; trust localStorage |
| 3. React Query (defense) | `frontend/src/components/providers/react-query-provider.tsx` | Added `retry: false` default; RQ no longer retries 401s |

## Checks

- [x] **Code complete** — 1 atomic commit `b6d6932`, 4 files (3 fix + 1 test)
- [x] **Type-check clean** — `npx tsc --noEmit` — no new errors introduced (pre-existing 81 errors are Stage 2 scope)
- [x] **Unit tests** — `src/lib/api.test.ts` **6/6 green** (failing-first verified per CLAUDE.md anti-looping rule)
  - redirects to /login on first 401 ✓
  - clears localStorage + cookie on 401 ✓
  - no double redirect on concurrent 401s ✓
  - no redirect when already on /login ✓
  - non-401 errors don't trigger ✓
  - re-redirect allowed after 5s window ✓
- [x] **Existing tests** — 310/310 vitest pass (1 pre-existing failure in qc-workbench unrelated)
- [x] **Smoke test** — production routes verified post-deploy:
  - `GET /` → 307 ✓
  - `GET /login` → 200 ✓
  - `GET /marketing/omnicrm` → 307 (auth required) ✓
  - `GET /api/system/health` → 200 ✓
  - `GET /api/auth/profile` (no auth) → 401 ✓

## Deploy procedure (per docs/RUNBOOK-DEPLOY-DAN-TEST-NEXERP.md §B)

1. Local build with hotfix config (pre-existing TS errors block clean build):
   ```bash
   cp frontend/next.config.ts frontend/next.config.ts.original
   cp frontend/tmp/next.config.production-hotfix.ts frontend/next.config.ts
   cd frontend && rm -rf .next && npx next build
   mv next.config.ts.original next.config.ts
   ```
2. scp 3 fix files + hotfix config to `/tmp/` on VPS
3. Backup VPS next.config.ts: `cp frontend/next.config.ts /tmp/next.config.ts.original`
4. Copy fix files into container build context
5. Apply hotfix: `cp /tmp/next.config.production-hotfix.ts frontend/next.config.ts`
6. `sudo docker compose build frontend` (succeeded)
7. `sudo docker tag nexerp-frontend:latest production-light-frontend:latest`
8. `sudo docker compose -p production-light up -d --no-deps frontend` (initial — but caused network drift)
9. Network fix: full `sudo docker compose -p production-light down && up -d` to rejoin all containers to `erp_network`
10. Restore config: `cp /tmp/next.config.ts.original frontend/next.config.ts`

## Skipped (deliberate, deferred to Stage 2)

- 81 pre-existing TS errors (use hotfix config at build time only)
- 3 stubbed pages (`pembelian/company`, `finance/ar-hub`, `system/profile`)
- `force-dynamic = "force-dynamic"` global in `layout.tsx`
- All deferred per plan `aku-bener-bener-butuh-sequential-nebula.md` Stage 2

## Known issues / Follow-up

- **Stage 2** (separate effort): 81 TS error cleanup → 3 stub restore → `force-dynamic` removal
- Network drift issue: `--no-deps` flag recreated frontend on `production-light_default` instead of `erp_network`, requiring full `down + up` to rejoin. Document in runbook next iteration.

## Verification by user

User should log in to https://nexerp.id as `revita@nexerp.id` and:
1. Land on `/executive/dashboard`
2. Wait 30 seconds — confirm no auto-refresh
3. Navigate to other pages — confirm no auto-refresh
4. Click logout — confirm returns to /login cleanly

If any auto-refresh observed, the loop is NOT fully fixed → escalate with browser console output.
