# Phase 6 — Deployment Runbook (Marketing Finalization 2026-09-13)

**Audience**: deployment operator (user, manual-driven)
**Trigger**: QA Gate `2026-09-13-marketing-finalization.md` status = PASS
**Scope**: Management Task + Social Media Brands production deploy

---

## Pre-deploy checklist

- [ ] All commits from `phase-3` are pushed: `git log phase-3 --oneline | head -20`
- [ ] No pending migrations: `cd backend && npx prisma migrate status`
- [ ] Backup production DB: `pg_dump -Fc prod_erp > backup-$(date +%F).dump`
- [ ] Test restore on isolated DB first (per `evidence/2026-09-10/production-restore-test.md`)
- [ ] Environment variables ready (see below)
- [ ] DNS / proxy config unchanged (no new public routes)
- [ ] On-call window scheduled

---

## Environment variables (backend)

Required at backend runtime. Add to deployment secret manager (NOT `.env` file in repo).

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Standard ERP connection |
| `JWT_SECRET` | Auth token signing | Standard ERP |
| `MARKETING_INTEGRATION_KEY` | Provider credential encryption (AES-256-GCM) | Per `marketing-domain.policy.ts` |
| `GEMINI_API_KEY` | AI copywriter (`generateAiCopy`) | **Live Gemini 2.5 Flash call** (per 2026-09-13 clarification) |
| `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN` | Meta Graph API integration (social-planner insights) | Optional, only if Meta integration in use |

If `GEMINI_API_KEY` is missing, the AI copy endpoint returns 503. Other endpoints unaffected.

## Environment variables (frontend)

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend proxy target | `http://localhost:3002` (dev) / VPS URL (prod) |
| `NEXT_PUBLIC_MARKETING_API_MODE` | `mock` or `real` for marketingService consumers | Currently `mock` (default). Leave as `mock` until sub-modals refactored. |

---

## Deployment steps

### 1. Merge `phase-3` → `main`

```powershell
# On local clone
git fetch origin
git checkout main
git merge phase-3 --no-ff -m "release: management task + social brands finalization (2026-09-13)"
git push origin main
```

### 2. SSH to VPS

```bash
ssh dreamlab@103.93.134.215
cd /opt/erp
git pull origin main
```

### 3. Apply database migrations

```bash
cd backend
npx prisma migrate deploy      # NOT 'migrate dev' (prod)
npx prisma generate
```

If migration fails, **STOP** and restore from backup. Do not retry without investigation.

### 4. Restart backend

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

Verify no startup error. Verify `/v1/marketing/brands` returns 200 (with valid auth).

### 5. Rebuild frontend

```bash
cd ../frontend
npm run build                  # production build, NO ignoreBuildErrors
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml logs --tail=50 frontend
```

If build fails on TS errors, **STOP**. Either fix or use temporary `typescript.ignoreBuildErrors=true` (NOT recommended for long-term).

### 6. Smoke test canonical routes

```bash
# Auth: get token first via existing login flow
TOKEN="..."

# 5 canonical production routes
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/v1/marketing/tasks
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/v1/marketing/brands
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/v1/marketing/members
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/v1/marketing/social/posts
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/v1/marketing/social/reports
```

All should return 200 (or 403 if auth role insufficient). 401 means token invalid.

### 7. Verify frontend pages render

```powershell
# Open browser manually
Start-Process "https://erp.dreamlab.id/marketing/management-task/overview"
Start-Process "https://erp.dreamlab.id/marketing/reports/dreamlab"
Start-Process "https://erp.dreamlab.id/marketing/reports/toribio"
Start-Process "https://erp.dreamlab.id/marketing/social-tracker"
Start-Process "https://erp.dreamlab.id/marketing/social-tracker/reporting"
Start-Process "https://erp.dreamlab.id/marketing/social-tracker/integrations"
```

Expected:
- mgmt-task /overview: tasks from API, no mock data
- reports/dreamlab + /toribio: brands from `/v1/marketing/brands`, no `INITIAL_BRANDS` mock
- social-tracker + reporting + integrations: unchanged (already on real API per QA Gate 2026-09-12)

### 8. Run E2E specs (closes deferred gap)

```powershell
cd frontend
npx playwright test tests/e2e/management-task/ --reporter=html
```

Expected: both specs PASS. HTML report at `frontend/playwright-report/`.

---

## Rollback procedure

If smoke test or E2E fails after deploy:

```bash
# 1. Restore DB
pg_restore -d prod_erp --clean --if-exists backup-YYYY-MM-DD.dump

# 2. Revert code
cd /opt/erp
git revert --no-edit HEAD       # or specific commit range

# 3. Restart services
docker compose -f docker-compose.prod.yml restart

# 4. Verify
curl -s http://localhost:3002/health
```

Notify in #/ops-channel with: deploy time, rollback reason, evidence link.

---

## Post-deploy monitoring

Watch for 24h:
- API error rate spike on `/v1/marketing/*`
- Frontend console errors on canonical routes (browser-side via observability dashboard)
- Failed sync jobs in `MarketingIntegrationSyncJob`
- AI copy endpoint failures (Gemini 4xx/5xx rate limit or quota)
- Database connection pool saturation

If any spike above baseline, follow rollback procedure or open incident.

---

## Notes for next iteration

Future work NOT in this deploy (track separately):
1. BrandWorkspace posts + reports wire to canonical API (gap from QA Gate)
2. mgmt-task sub-modals refactor to canonical hooks (CreateTaskModal, TaskDetailModal, MemberProfileView)
3. HttpMarketingService rewrite (auth + `/api` path) → enables `NEXT_PUBLIC_MARKETING_API_MODE=real`
4. MockMarketingService deprecation + removal
5. E2E live execution as part of CI (GitHub Actions workflow)