# W1 — VPS Reconnaissance (2026-09-13)

**Server**: `dreamlab@103.93.134.215`
**Deploy root**: `/home/dreamlab/nexerp/`
**Production branch**: **`production-light`** (NOT `phase-3`)
**Latest commit**: `6d5966c fix(deploy): add mgmt-task Board + [member] route, restore Biznet hotfixes`

---

## 1. Container State

| Container | Status | Ports | Notes |
|---|---|---|---|
| `production-light-frontend-1` | Up 5h (unhealthy) | 3000/tcp | Next.js 16.3.4, Ready |
| `production-light-backend-1` | Up 5h (unhealthy) | 3001/tcp | NestJS, listens 0.0.0.0:3001 |
| `production-light-nginx-1` | Up 33h (unhealthy) | 80, 443 | nginx/1.29.8 |
| `production-light-db-1` | Up 33h (healthy) | 5432 | Postgres 15-alpine |
| `production-light-certbot-1` | Up 33h | 80, 443 | certbot renew loop |
| `dreamlab-lead-pgbouncer-1` | Up 4d | 6432 | pgbouncer for dreamlab-lead |
| `dreamlab-lead-db-lead-1` | Up 4d (healthy) | 127.0.0.1:5433 | Postgres for dreamlab-lead |
| `nexerp-db-1` | Up 4d (healthy) | 5432 | Older nexerp DB (separate) |
| `nexerp-certbot-1` | Up 4d | 80, 443 | Older certbot |
| `preview-kil-frontend` | Up 4d | 3500 | preview-kil stack |
| `preview-kil-backend` | Up 4d | 3501 | preview-kil stack |

**All production containers up. "unhealthy" status is healthcheck artifact (wget/curl missing in container images), not actual downtime.**

---

## 2. Architecture

```
Internet (HTTPS) → nginx:443 (host) → frontend:3000 (internal docker network)
                                → backend:3001 (internal docker network)
                                → backend:3001/system/health (healthcheck)
```

- Backend listens `0.0.0.0:3001` **only on docker network** (`erp_network`)
- Frontend listens `0.0.0.0:3000` **only on docker network**
- nginx proxies `https://{DOMAIN_NAME}/api/*` → `http://backend:3001/*`
- nginx proxies `https://{DOMAIN_NAME}/*` → `http://frontend:3000/*`
- Backend healthcheck: `curl http://localhost:3001/system/health`
- DB: `db:5432` (Postgres 15-alpine)

---

## 3. DNS / External Access

- `erp.dreamlab.id` — DNS does not resolve from local network (Non-existent domain via nslookup)
- Direct IP `https://103.93.134.215/` — works, returns 307 → `/login?redirect=/`
- Production must be accessed via direct IP (DNS issue) or alternate domain

---

## 4. Git State (Production Repo)

- Branch: `production-light`
- Latest 5 commits:
  ```
  6d5966c fix(deploy): add mgmt-task Board + [member] route, restore Biznet hotfixes
  9de36d6 feat(digital-marketing): full division rebuild
  b186b04 feat(restore): revert management-task landing to production-light redirect
  59eeca2 fix: master seed, JWT_SECRET, CORS, middleware, UNKNOWN_UUID, hardcoded IP, healthcheck
  2773297 fix: upgrade recharts from 3.8.1 to 3.10.0 for React 19 compatibility
  ```
- Working tree has many modified files (uncommitted Biznet hotfixes)
- Branch diverged from local `phase-3` — **schema split differs**:
  - Local `phase-3`: includes `marketing.prisma`
  - Production `production-light`: marketing uses prototype controller, not canonical module

---

## 5. Backend Source Layout

```
backend/src/modules/marketing/
├── canonical/                    # Canonical module (UPPER_CASE enums)
│   ├── canonical-marketing.controller.ts
│   ├── canonical-marketing.service.ts
│   ├── canonical-marketing.dto.ts  # CreateCanonicalTaskDto with required fields
│   └── __tests__/
├── prototype/                     # Prototype module (Title Case enums)
│   ├── marketing-prototype.controller.ts
│   ├── marketing-prototype.service.ts
│   └── dto/prototype-task.dto.ts  # CreateTaskDto with all-Optional fields
├── social-planner/
├── decision-support/
└── ...

backend/src/modules/crm/           # OmniCRM MVP (deployed 2026-09-12)
├── leads/
├── guestbook/
├── ingest/lead-svc-webhook.controller.ts
└── common/hmac.ts
```

---

## 6. Frontend Stack

- Next.js 16.3.4
- React 19
- Compiled successfully (`_next/static` present in HTML)

---

## 7. Database State

- Backend logs show: `prisma:error Invalid 'prisma.activityLog.create()' invocation: The table 'public.activity_logs' does not exist in the current database.`
- This is from `LeadCaptureService` (WhatsApp inbound handler) trying to log activity
- **Migration gap**: `activity_logs` table not in schema → migration missing or skipped
- Inbound WhatsApp leads still work (data goes into `crm_leads`), just the activity log entry fails silently

---

## 8. Live In-Progress Services (from logs)

- `LeadCaptureService` actively receiving WhatsApp messages from `62881023221414`
- `AutoGreetService` sending auto-greetings to leads
- `WaWebhookService` receiving `📩 WA Gateway webhook received` events
- `KommoService` attempting sync (`KOMMO_SUBDOMAIN` not set → warn, not error)
- `extractName` failing with `Failed to parse URL from undefined/chat/completions` — LLM endpoint URL not set

---

## 9. Environment Variables (Backend)

| Var | Present | Notes |
|---|---|---|
| `DATABASE_URL` | ✓ | postgres URL |
| `JWT_SECRET` | ✓ | (from .env, value not exposed) |
| `AES_SECRET_KEY` | ✓ | |
| `CORS_ORIGIN` | ✓ | https://nexerp.id |
| `NODE_ENV` | ✓ | production |
| `PORT` | ✓ | 3001 |
| `META_*` (5 vars) | ✓ | WhatsApp/IG creds |
| `WA_WEBHOOK_VERIFY_TOKEN` | ✓ | |
| `BUSDEV_*_PHONE_NUMBER_ID` | ✓ | |
| `USER_TOKEN` | ✓ | |
| `GEMINI_API_KEY` | ✗ | Missing (AI copy won't work) |
| `LEAD_SVC_INGEST_SECRET` | ✗ | Missing (HMAC inbound webhook won't validate) |
| `MARKETING_INTEGRATION_KEY` | ✗ | Missing (provider credential encryption broken) |

---

## 10. Backup Locations

- `/home/dreamlab/backups/` — manual backups
- `/home/dreamlab/nexerp/db-backups/` — DB backups
- `/home/dreamlab/nexerp/db-backups /` — duplicate-named (with trailing space)

---

## 11. Other Stacks Co-Located

- `nexerp-r4/` — older R4 deploy (4 days old, separate DB)
- `staging-nexerp/` — staging env (separate)
- `compact-prototype/`, `demo-prototype/` — prototype deployments
- `preview-kil-src/` + `preview-kil` — preview environment on port 3500
- `dreamlab-lead/` — dreamlab-lead service (uses 5433/6432)

---

## 12. Decision Pivot Applied

This is **NOT phase-3** (which has `marketing.prisma` schema split + TaskWorkspaceV2).

Production-light has different architecture:
- Marketing: prototype controller (Title Case enums) + canonical controller (UPPER_CASE enums) BOTH active
- Routes resolve to canonical (UPPER_CASE) — verified by PATCH status with `IN_PROGRESS` accepted, `In Progress` rejected
- mgmt-task page uses `ManagementTaskBoard.tsx` (not `TaskWorkspaceV2.tsx`)
- CRM is event-driven (WhatsApp/webhook), not REST-created

Plan adaptation: W2-W5 test against actual production-light endpoints, not phase-3 ones.
