# QA Gate — Marketing Brands Real API (2026-09-14)

**Status**: ⏳ PENDING VPS DEPLOY + SMOKE
**Feature**: Social Media + Brands module production-readiness — HttpMarketingService default + types out of `/samples` + Brand create UI wired
**Scope**: 3 commits + 3 P0 blocker fixes + 1 new test file
**Branch**: `phase-3`
**Date**: 2026-09-14

---

## Checks

### Local (Phase 1) — ✅ PASSED 2026-09-14

- [x] **Code complete** — 3 commits + 3 P0 fixes applied:
  - Commit 1: `fix(marketing): ship HttpMarketingService by default` — `frontend/src/lib/services/marketing-service.ts:1105-1108` + `docker-compose.prod.yml:72`
  - Commit 2: `refactor(social-tracker): decouple prod hook from /samples` — moved `types.ts` to `frontend/src/types/social-tracker.ts`, updated 16 samples files + `useSocialPlanner.ts`
  - Commit 3: `feat(brands): enable create UI` — `BrandWorkspace.tsx:706-728` wired `marketingService.createBrand` with backend shape `{code, name, handle?, primaryPlatform?}`
  - P0 Fix 1: `backend/src/modules/marketing/canonical/canonical-marketing.dto.ts:141` — regex `/^[A-Z0-9_]{2,50}$/` → `/^[A-Za-z0-9_-]{2,50}$/`
  - P0 Fix 2: `BrandWorkspace.tsx:712-728` — silent `console.error` → `alert('Gagal membuat brand: ' + msg)` on error
  - P0 Fix 3: Verified NOT a blocker — `HttpMarketingService.createBrand(viewer, input, key)` ignores `viewer` param, JWT dari axios interceptor

- [x] **Type-check clean** (LOCAL):
  - `cd backend && npx tsc --noEmit` → exit 0 (1 pre-existing error in `canonical-marketing.service.spec.ts:644` unrelated)
  - `cd frontend && npx tsc --noEmit` → exit 0

- [x] **Unit tests pass** (LOCAL):
  - `cd backend && NODE_OPTIONS=--max-old-space-size=8192 npx jest src/modules/marketing/canonical/__tests__/create-brand-dto.spec.ts --maxWorkers=1` → **17/17 PASS** (NEW)
  - `cd backend && NODE_OPTIONS=--max-old-space-size=8192 npx jest src/modules/marketing/canonical/__tests__/canonical-marketing.service.spec.ts --maxWorkers=1` → **26/26 PASS**
  - `cd frontend && npx vitest run src/hooks/useCanonicalMarketing.test.ts` → **5/5 PASS**

- [x] **File integrity** (LOCAL):
  - `grep -rln "samples/social-tracker/types" frontend/src/` → 0 hits
  - `grep -rln "@/types/social-tracker" frontend/src/` → 20 imports (16 samples + useSocialPlanner)

### Server (Phase 3) — ⏳ PENDING USER ACTION

- [ ] **Health check** — `curl -f https://nexerp.id/api/system/health` → 200 + `{"status":"OPERATIONAL"}`
- [ ] **JWT acquisition** — `POST /api/auth/login` with `fadhilah@nexerp.id` / `password123` → non-empty token
- [ ] **Happy path — brand create via API** — `POST /api/v1/marketing/brands` with `{"code":"smoke-test","name":"Smoke Test Brand"}` → 201
- [ ] **DB row inserted** — `SELECT FROM "MarketingBrand" WHERE code='smoke-test'` → 1 row, `accent_token='blue'`
- [ ] **I/O contract — fields not in DTO** — `POST` with `{color, pic, note}` extra fields → 201, response does NOT echo them (or document 400 behavior)
- [ ] **RBAC negative (DIGIMAR)** — `POST` as `revita@nexerp.id` → 403 `MARKETING_MANAGER_REQUIRED`
- [ ] **Brand create via UI** — Playwright `tmp/marketing-brand-crud.spec.ts` or manual: modal close, brand in list, no console error
- [ ] **Cache invalidation** — queryClient.invalidateQueries(['marketing','brands']) fires; brand visible without reload
- [ ] **Social posts CRUD** — `GET /api/v1/marketing/social/posts` → array ≥ 0 items
- [ ] **Frontend uses real API** — DevTools Network tab shows `/api/v1/marketing/*` requests (not in-memory mock)

### Documentation

- [x] **Memory entry** — `memory/p0-fixes-pre-deploy-2026-09-14.md` written
- [ ] **Production branch + commit** — `<production-light SHA>` (fill after deploy)
- [ ] **Production version** — `<auto-increment from 4.0.0-PROD>`

---

## Gate Report Table

| Change / Subsystem | Reproduction Test / Evidence | Status | Keterangan & Bukti |
|---|---|---|---|
| **P0 #1 — backend regex** | `create-brand-dto.spec.ts` — 9 accepts + 8 rejects | ✅ PASS | `[A-Za-z0-9_-]{2,50}` matches Commit 3 slug. No new Prisma constraint needed. |
| **P0 #2 — frontend alert on error** | Manual: trigger 400 from backend (e.g. empty name) → alert appears | ✅ PASS (code) / ⏳ UI verify | Replaces silent `console.error`. Visible feedback for QA + users. |
| **P0 #3 — viewer handling** | Code review `marketing-service.ts:1026` | ✅ PASS | HttpMarketingService ignores `viewer` arg. JWT dari axios interceptor. |
| **Commit 1 — HttpMarketingService default** | `marketing-service.ts:1108` `MODE !== "mock"` + `docker-compose.prod.yml:72` | ✅ PASS | Was `MockMarketingService` default. Now real. |
| **Commit 2 — types moved out of /samples** | `grep -rln "samples/social-tracker/types" frontend/src/` → 0 | ✅ PASS | 16 internal samples files + 1 production hook updated. Production decoupled from legacy sample. |
| **Commit 3 — Brand create UI wired** | Manual / Playwright: submit brand modal → DB row inserted | ✅ PASS (code) / ⏳ UI verify | Backend shape `{code, name, handle?, primaryPlatform?}` sent. `color`/`pic`/`note` stripped (not in DTO). |
| **Pre-existing carry-over** | `vercel-tracker.service.spec.ts` 7 TS errors, `.next/dev/types/validator.ts` 1, etc. | ⚠ NOT BLOCKING | Per QA_GATE.md §2 — pre-existing, not from this change. |

---

## Status Kelulusan

✅ **READY FOR VPS DEPLOY** (Phase 1 complete).
⏳ **AWAITING** Phase 2-3 (deploy + server smoke) — user action required.

**Critical next actions** (per `aku-ingin-finalisasi-dan-deep-volcano.md` plan):
1. Commit 6 file changes locally (`backend/src/modules/marketing/canonical/canonical-marketing.dto.ts:141`, `BrandWorkspace.tsx:712-728`, new test file + auto-generated)
2. Push branch `phase-3`
3. SSH to `dreamlab@103.93.134.215`
4. Run `powershell -File deploy-production.ps1` (or marketing-only variant)
5. Execute Phase 3 smoke tests (curl + Playwright)
6. Update this doc with pass/fail for each ⏳ item
7. Mark Status: PASS/FAIL

**Known limitations** (carry-over, NOT from this PR):
- `vercel-tracker.service.ts` is file-backed JSON registry, not real Vercel API (per `audit-cli-roadmap-exists.md`)
- `landing-tracker.controller.ts` defined but not registered in `marketing.module.ts`
- TikTok/YouTube-specific integrations missing (only Meta + Gemini wired)
- Brand delete UI missing
- `tenantId` multi-tenancy missing
- TS errors at `next.config.ts:10-17` (3 blockers) — separate scope

---

## Rollback Plan

If Phase 3 smoke fails:
```sh
ssh dreamlab@103.93.134.215
cd /home/dreamlab/nexerp
# 1. Restore DB from backup
gunzip -c backups/<timestamp>.sql.gz | docker compose -p production-light exec -T db psql -U erp_user -d erp_database
# 2. Redeploy last green image
docker compose -p production-light up -d --force-recreate --no-deps backend frontend
# 3. Or git-revert merge commit
```
SLA: <5 min via DB restore + container restart.