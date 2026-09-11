# OmniCRM MVP — Deployment & Smoke Test Guide

**Branch:** `phase-3` (latest: `4ddd06b` for Phase 4 frontend, `71c2d6b` for Phase 5 ingest wiring)
**Target:** Biznet VPS `dreamlab@103.93.134.215` (`/home/dreamlab/nexerp`)
**Project:** nexerp.id (production-light compose)

---

## A. Pre-deploy: environment variables

### Backend (NexERP `.env` or Docker env)

Add to `backend/.env` (and to the production env injected into the backend container):

```bash
# Required for OmniCRM ingest webhook (HMAC validation)
# Generate with: openssl rand -hex 32
LEAD_SVC_INGEST_SECRET=<32-byte-hex-shared-with-lead-svc-deploy>
```

The same `LEAD_SVC_INGEST_SECRET` MUST be set on both sides. If they differ,
every ingest will return 401.

### lead-svc-deploy (`C:\GAWE\Web Dev\Porto Aureon\CRAWL WEBSITE DREAMLAB\lead-svc-deploy`)

This file is **NOT** in the nexerp git repo. Apply the diff below manually
or via the team's deploy script for the dreamlab.id site.

```bash
# Existing
PORT=3456
PGHOST=dreamlab-lead-pgbouncer-1
PGPORT=5432
PGDATABASE=dreamlab
PGUSER=dreamlab1
PGPASSWORD=...
ALLOWED_ORIGIN=https://dreamlab.id

# New for OmniCRM ingest
ERP_BACKEND_URL=https://nexerp.id
ERP_INGEST_PATH=/api/crm/leads/ingest
LEAD_SVC_INGEST_SECRET=<same-secret-as-backend>
ERP_INGEST_TIMEOUT_MS=5000
```

If `ERP_BACKEND_URL` is empty, the bridge is a no-op (existing /convert
behaviour unchanged) — safe to deploy lead-svc-deploy first, then backend.

---

## B. lead-svc-deploy diff (not in ERP repo)

Apply to `C:\GAWE\Web Dev\Porto Aureon\CRAWL WEBSITE DREAMLAB\lead-svc-deploy\server.mjs`:

```diff
 import http from 'node:http';
+import crypto from 'node:crypto';
 import pg from 'pg';

+// ERP backend bridge (Phase 5 wiring)
+const ERP_BACKEND_URL = process.env.ERP_BACKEND_URL ?? '';
+const ERP_INGEST_PATH = process.env.ERP_INGEST_PATH ?? '/api/crm/leads/ingest';
+const INGEST_SECRET = process.env.LEAD_SVC_INGEST_SECRET ?? '';
+const INGEST_TIMEOUT_MS = Number(process.env.ERP_INGEST_TIMEOUT_MS ?? 5000);
+
+function postToErp(payload) {
+  if (!ERP_BACKEND_URL || !INGEST_SECRET) return Promise.resolve();
+  const ts = Math.floor(Date.now() / 1000);
+  const rawBody = JSON.stringify(payload);
+  const signature = 'sha256=' + crypto.createHmac('sha256', INGEST_SECRET)
+    .update(`${ts}.${rawBody}`).digest('hex');
+  const url = new URL(ERP_BACKEND_URL.replace(/\/$/, '') + ERP_INGEST_PATH);
+  return new Promise((resolve) => {
+    const req = http.request({
+      method: 'POST', hostname: url.hostname,
+      port: url.port || (url.protocol === 'https:' ? 443 : 80),
+      path: url.pathname + url.search,
+      headers: {
+        'Content-Type': 'application/json',
+        'Content-Length': Buffer.byteLength(rawBody),
+        'X-Dreamlab-Signature': signature,
+        'X-Dreamlab-Timestamp': String(ts),
+      },
+      timeout: INGEST_TIMEOUT_MS,
+    }, (res) => {
+      let body = '';
+      res.on('data', (c) => (body += c));
+      res.on('end', () => {
+        if (res.statusCode < 200 || res.statusCode >= 300) {
+          console.warn(`[lead-svc] ERP ingest ${res.statusCode}: ${body.slice(0, 200)}`);
+        }
+        resolve();
+      });
+    });
+    req.on('error', (e) => console.warn(`[lead-svc] ERP ingest failed: ${e.message}`));
+    req.on('timeout', () => { req.destroy(); resolve(); });
+    req.write(rawBody);
+    req.end();
+  });
+}

 // ... in the /convert handler, AFTER convertLead() succeeds:
       const result = await convertLead(body);
+      postToErp({
+        leadCaptureId: result.id,
+        trackingCode: result.trackingCode,
+        phone: body.hp ?? null,
+        source: body.source ?? 'WEBSITE',
+        pageUrl: body.pageUrl ?? null,
+        pageTitle: body.pageTitle ?? null,
+        referrer: body.referrer ?? null,
+        intent: body.intent ?? null,
+        deviceType: body.deviceType ?? null,
+        browser: body.browser ?? null,
+        displayName: body.nama ?? null,
+      });
       json(res, 200, result);
```

Bridge is fire-and-forget — failures logged but don't break /convert.

---

## C. Deploy to VPS

```powershell
# 1. Open PR phase-3 → production-light on GitHub
#    https://github.com/muhammadluthfi210869/nexerp/pull/new/phase-3
gh pr create --base production-light --head phase-3 \
  --title "OmniCRM MVP: schema + 5 controllers + Overview UI + lead-svc ingest" \
  --body "Bare-minimum Omni CRM MVP for head marketing. See docs/marketing/PHASE-0-OMNICRM-CONTRACT.md."

# 2. After PR merge, SSH to VPS and deploy
ssh dreamlab@103.93.134.215
cd /home/dreamlab/nexerp
git pull origin production-light
sudo docker compose -p production-light up -d --build backend frontend

# 3. Verify backend picked up new migration + env
sudo docker logs backend --tail 100 2>&1 | grep -E "omnicrm_foundation|LEAD_SVC_INGEST_SECRET|prisma"
```

If `LEAD_SVC_INGEST_SECRET` is missing in the prod container env, add it
to the docker-compose.prod.yml `backend.environment` block and re-deploy.

---

## D. Smoke test (per QA gate §Phase 6)

Run these in order. If any step fails, check `docker logs backend` for the
specific signature before continuing.

### D.1. Backend health

```powershell
curl https://nexerp.id/api/crm/kpi/summary -H "Authorization: Bearer <jwt>"
# Expected: 200 with { leadsToday, leadsThisWeek, replyRate, ... } — may be 401 if JWT missing, that's OK.
```

### D.2. Prisma migration applied

```bash
sudo docker exec -it production-light-backend-1 npx prisma migrate status
# Expected: "Database schema is up to date" with 20260911225751_omnicrm_foundation listed.
```

### D.3. Mgmt-task page renders (regression guard)

```powershell
# Browser
start https://nexerp.id/marketing/management-task
# Expected: lands on /marketing/management-task/{aurel|revi|...} (NOT /overview which is 404)
```

### D.4. OmniCRM Overview

```powershell
start https://nexerp.id/marketing/omnicrm
# Expected: Single page with 4 KPI cards + filter bar + Live Capture table.
# No 404s in browser console.
```

### D.5. Buku Tamu approval flow

```powershell
# 1. Visit https://dreamlab.id/ads/thankyou/google-ads/ (any of the 5 thankyou pages)
# 2. Click the WA button — this triggers assign_and_insert_lead on lead-svc-deploy
# 3. Within 30s, refresh https://nexerp.id/marketing/omnicrm
# 4. New row appears in Live Capture table with Buku Tamu badge = PENDING
# 5. Click "Detail →" → land on /marketing/omnicrm/leads/{id}
# 6. (Optional) Edit displayName, change stage
# 7. Go back to overview → KPI "Buku Tamu Pending" decrements after approve
```

To approve:
```powershell
start https://nexerp.id/marketing/omnicrm/guestbook
# Click Approve button → row disappears from PENDING list, MARKETSUPERADMIN audit logged.
```

### D.6. KPI tiles update

```powershell
# Refresh https://nexerp.id/marketing/omnicrm/kpi
# Numbers should match /api/crm/kpi/summary (verify in DevTools Network tab).
# Reply Rate < 10% flagged '⚠ rendah'.
```

### D.7. HMAC validation rejects bad signatures

```powershell
curl -X POST https://nexerp.id/api/crm/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-Dreamlab-Signature: sha256=WRONG" \
  -H "X-Dreamlab-Timestamp: $(date +%s)" \
  -d '{"leadCaptureId":"x","phone":"0812","source":"WEBSITE"}'
# Expected: 401 with body "Invalid HMAC: INVALID_SIGNATURE"
```

---

## E. Monitoring

Add to `/home/dreamlab/nexerp/docker-compose.prod.yml` `backend.logging` or
your existing log aggregator:

```yaml
backend:
  logging:
    driver: json-file
    options:
      labels: "service=crm-ingest"
```

Alerts (suggested):
- HMAC validation fail rate > 5/min → likely secret leak or clock skew
- `POST /crm/leads/ingest` 5xx rate > 1% → lead-svc-deploy can't reach ERP
- New CrmLead creation rate = 0 for > 1h during business hours → webhook broken

Daily backup (add to existing cron):
```bash
pg_dump -t crm_leads -t lead_audits -t guestbook_events \
  -t lead_captures -t lead_messages nexerp > /backup/crm-$(date +%Y%m%d).sql
```

---

## F. Rollback

If OmniCRM breaks production:

```bash
# Revert the migration (drops new tables)
sudo docker exec -it production-light-backend-1 npx prisma migrate resolve --rolled-back 20260911225751_omnicrm_foundation

# Revert the deploy to previous commit
cd /home/dreamlab/nexerp
git checkout HEAD~1 -- backend/
sudo docker compose -p production-light up -d --build backend

# Disable the bridge on lead-svc-deploy side (empty ERP_BACKEND_URL = no-op)
# No code change needed — restart lead-svc-deploy container with empty env
```

The OmniCRM frontend lives under `/marketing/omnicrm/*` — if it 5xx's,
users just see an empty page; existing routes (`/marketing/management-task`,
`/marketing/social-tracker`, etc.) are unaffected.
