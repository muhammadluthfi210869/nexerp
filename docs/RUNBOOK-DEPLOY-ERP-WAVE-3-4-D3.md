# RUNBOOK: Deploy ERP Wave 3+4+D3 to Production

> **Status:** ✅ VALIDATED 2026-09-13 (E2 backend) + 2026-09-14 (F2 preview-kil live update)
> **Author:** Claude Code (auto-generated from E2 + F2 session)
> **Last updated:** 2026-09-14

## Overview

This runbook documents how to deploy **Wave 3 (Comms + KPI)**, **Wave 4 D3 (Decision Support)**, and any subsequent code to the ERP production stack.

**Critical context:** The "live" stack serving public traffic is **`preview-kil-*`**, NOT `production-light-*`. CF Tunnel routes:
- `kil.nexerp.id` → `localhost:3500` (preview-kil-frontend)
- `kil-api.nexerp.id` → `localhost:3501` (preview-kil-backend)

The `production-light-*` stack is a separate environment with its own DB (`erp_database`). Updating production-light does NOT affect public traffic.

**Two databases:**
- `erp_database` (production-light stack) — Wave 1-4 fully migrated here
- `erp_preview_kil` (preview-kil stack) — public-facing, also has Wave 1+OmniCRM schemas; **Comms migration must be applied here too**

---

## Pre-Deploy Checklist

### Local checks

- [ ] Working tree clean: `git status --short` empty
- [ ] On correct branch: `phase-3` (or release branch)
- [ ] Latest commits pulled
- [ ] Backend tests pass: `cd backend && NODE_OPTIONS=--max-old-space-size=8192 --maxWorkers=1 npx jest --config ./test/jest-unit.json --runInBand test/unit/{communication,notification,kpi,decision-support}`
- [ ] Frontend tests pass: `cd frontend && npx vitest run`
- [ ] `cd backend && npx tsc --noEmit` clean for new code

### VPS checks

- [ ] SSH access works: `ssh dreamlab@103.93.134.215 echo OK`
- [ ] Containers running: `docker ps | grep -E 'preview-kil|production-light'`
- [ ] Recent DB backup exists: `ls -la /home/dreamlab/deploy-backup-*/erp_pre_*.sql | tail -3`

---

## Stage 1 — Backup database

```bash
BACKUP_DIR=/home/dreamlab/deploy-backup-$(date +%Y-%m-%d)
mkdir -p $BACKUP_DIR
cd $BACKUP_DIR

# Backup BOTH databases
docker exec production-light-db-1 pg_dump -U erp_user -d erp_database --no-owner --no-acl --schema=public > erp_database_pre_wave.sql
docker exec production-light-db-1 pg_dump -U erp_user -d erp_preview_kil --no-owner --no-acl --schema=public > erp_preview_kil_pre_wave.sql

ls -la *.sql
```

**Verify backup size > 0.** If empty, container `db-1` is in a different state — investigate before continuing.

---

## Stage 2 — Build + tar local artifacts

```bash
# Backend build
cd backend && npm run build 2>&1 | tail -3
mkdir -p /tmp/wave34-deploy
tar -czf /tmp/wave34-deploy/dist.tar.gz dist

# Frontend build
cd ../frontend && npm run build 2>&1 | tail -5
mkdir -p /tmp/wave34-deploy/frontend-build
cp -r .next /tmp/wave34-deploy/frontend-build/ 2>&1 || echo "no .next"
cp -r public /tmp/wave34-deploy/frontend-build/ 2>&1 || echo "no public"
cp package.json /tmp/wave34-deploy/frontend-build/
cp next.config.* /tmp/wave34-deploy/frontend-build/ 2>&1 || echo "no next.config"

# Stage new Prisma migrations (only NEW ones — not all)
# Find migrations newer than what's already in production
LATEST_PROD_MIG=$(ssh dreamlab@103.93.134.215 \
  'docker exec production-light-backend-1 ls /app/prisma/migrations/ | grep -v migration_lock | sort | tail -1' \
  | tr -d '\r')
echo "Latest prod migration: $LATEST_PROD_MIG"

# List migrations newer than that in local
cd ../backend
ls prisma/migrations/ | grep -v migration_lock | sort | awk -v latest="$LATEST_PROD_MIG" \
  '$0 > latest { print }' | while read mig; do
    if [ -d "prisma/migrations/$mig" ]; then
      mkdir -p "/tmp/wave34-deploy/new-migrations/$mig"
      cp "prisma/migrations/$mig/migration.sql" "/tmp/wave34-deploy/new-migrations/$mig/"
      echo "Staged: $mig"
    fi
  done

# Stage config files (alert-rules.yaml, etc.)
cp src/modules/decision-support/alert-rules.yaml /tmp/wave34-deploy/alert-rules.yaml 2>/dev/null
ls /tmp/wave34-deploy/
```

---

## Stage 3 — SCP to VPS + extract

```bash
scp -o StrictHostKeyChecking=no /tmp/wave34-deploy/dist.tar.gz dreamlab@103.93.134.215:/tmp/wave34-deploy/
scp -o StrictHostKeyChecking=no /tmp/wave34-deploy/frontend-build/.next.tar.gz dreamlab@103.93.134.215:/tmp/wave34-deploy/ 2>/dev/null || \
  scp -o StrictHostKeyChecking=no -r /tmp/wave34-deploy/frontend-build/.next dreamlab@103.93.134.215:/tmp/wave34-deploy/frontend-build-next
scp -o StrictHostKeyChecking=no /tmp/wave34-deploy/alert-rules.yaml dreamlab@103.93.134.215:/tmp/wave34-deploy/
```

On VPS, extract:
```bash
ssh dreamlab@103.93.134.215 '
  cd /tmp/wave34-deploy
  mkdir -p dist-extracted
  tar -xzf dist.tar.gz -C dist-extracted/
  ls dist-extracted/modules/ | head -20
  echo "---"
  # Stage new migrations
  if [ -d new-migrations ]; then
    find new-migrations -type f -name migration.sql
  fi
'
```

---

## Stage 4 — Apply migrations to BOTH databases

**Why both:** preview-kil uses `erp_preview_kil` (separate DB). Comms tables need to exist there too.

```bash
# 4.1 — Apply migrations to production-light backend (uses erp_database)
ssh dreamlab@103.93.134.215 '
  for mig_dir in /tmp/wave34-deploy/new-migrations/*/; do
    mig_name=$(basename "$mig_dir")
    docker cp "$mig_dir" production-light-backend-1:/app/prisma/migrations/
    echo "Copied: $mig_name → production-light"
  done
  docker exec production-light-backend-1 npx prisma migrate deploy 2>&1 | tail -10
'

# 4.2 — Apply migrations to preview-kil backend (uses erp_preview_kil)
ssh dreamlab@103.93.134.215 '
  for mig_dir in /tmp/wave34-deploy/new-migrations/*/; do
    mig_name=$(basename "$mig_dir")
    docker exec preview-kil-backend sh -c "mkdir -p /app/prisma/migrations/$mig_name"
    docker cp "$mig_dir/migration.sql" preview-kil-backend:/app/prisma/migrations/$mig_name/
    echo "Copied: $mig_name → preview-kil"
  done
  docker exec preview-kil-backend npx prisma migrate deploy 2>&1 | tail -10
'
```

**Verify:**
```bash
ssh dreamlab@103.93.134.215 '
  echo "=== erp_database tables ==="
  docker exec production-light-db-1 psql -U erp_user -d erp_database -tAc \
    "SELECT tablename FROM pg_tables WHERE schemaname='\''public'\'' AND tablename LIKE '\''communication%'\''"
  echo "=== erp_preview_kil tables ==="
  docker exec production-light-db-1 psql -U erp_user -d erp_preview_kil -tAc \
    "SELECT tablename FROM pg_tables WHERE schemaname='\''public'\'' AND tablename LIKE '\''communication%'\''"
'
```

---

## Stage 5 — Replace backend dist (both containers)

```bash
# production-light
ssh dreamlab@103.93.134.215 '
  docker cp /tmp/wave34-deploy/dist-extracted/. production-light-backend-1:/app/dist/
  docker cp /tmp/wave34-deploy/alert-rules.yaml production-light-backend-1:/app/dist/modules/decision-support/alert-rules.yaml 2>&1 || echo "no alert-rules.yaml to copy"
'

# preview-kil
ssh dreamlab@103.93.134.215 '
  docker cp /tmp/wave34-deploy/dist-extracted/. preview-kil-backend:/app/dist/
  docker cp /tmp/wave34-deploy/alert-rules.yaml preview-kil-backend:/app/dist/modules/decision-support/alert-rules.yaml 2>&1 || echo "no alert-rules.yaml to copy"
'
```

---

## Stage 6 — Replace frontend build (preview-kil only — public traffic)

```bash
ssh dreamlab@103.93.134.215 '
  docker cp /tmp/wave34-deploy/frontend-build/.next/. preview-kil-frontend:/app/.next/
  docker cp /tmp/wave34-deploy/frontend-build/public/. preview-kil-frontend:/app/public/
  docker cp /tmp/wave34-deploy/frontend-build/package.json preview-kil-frontend:/app/package.json
'
```

**Note:** Frontend container has NO bind mounts (full image). To survive rebuilds, the new build should be baked into the image. For now, `docker cp` works until the container is rebuilt.

---

## Stage 7 — Restart containers

```bash
ssh dreamlab@103.93.134.215 '
  docker restart preview-kil-backend preview-kil-frontend production-light-backend-1
  sleep 25
  docker ps --filter "name=preview-kil" --filter "name=production-light-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
'
```

---

## Stage 8 — Verify

### Backend container logs

```bash
ssh dreamlab@103.93.134.215 '
  echo "=== preview-kil-backend ==="
  docker logs --tail 50 preview-kil-backend 2>&1 | grep -E "AlertEngine|NestApplication|ERROR|Mapped.*v1/(comm|kpi|decision)" | head -15
  echo ""
  echo "=== production-light-backend-1 ==="
  docker logs --tail 50 production-light-backend-1 2>&1 | grep -E "AlertEngine|NestApplication|ERROR" | head -5
'
```

**Expected:**
- `Loaded 5 alert rules from /app/dist/modules/decision-support/alert-rules.yaml`
- `Nest application successfully started`
- 20+ new routes Mapped (Comms 8 + KPI 5 + Decision 7)

### Public URLs

```bash
echo "=== API ==="
curl -sS -o /dev/null -w "GET /v1/health: %{http_code}\n" "https://kil-api.nexerp.id/v1/health"
curl -sS -o /dev/null -w "GET /v1/communications/threads: %{http_code}\n" "https://kil-api.nexerp.id/v1/communications/threads"
curl -sS -o /dev/null -w "GET /v1/kpi/person/me: %{http_code}\n" "https://kil-api.nexerp.id/v1/kpi/person/me"
curl -sS -o /dev/null -w "GET /v1/decision/pending: %{http_code}\n" "https://kil-api.nexerp.id/v1/decision/pending"
echo "Expected: 401 (auth enforced), NOT 404"

echo "=== Frontend ==="
curl -sS -o /dev/null -w "GET /: %{http_code}\n" "https://kil.nexerp.id/"
curl -sS "https://kil.nexerp.id/" | grep -oE "<title>[^<]+</title>" | head -1
```

---

## Stage 9 — Cleanup

```bash
# Remove old backups (>7 days)
ssh dreamlab@103.93.134.215 '
  find /home/dreamlab/deploy-backup-* -maxdepth 0 -type d -mtime +7 -exec rm -rf {} \;
  ls -la /home/dreamlab/ | grep deploy-backup
'

# Clean local temp
rm -rf /tmp/wave34-deploy
```

---

## Rollback Procedure

If something breaks after deploy:

### Rollback DB (one or both databases)
```bash
BACKUP_DIR=/home/dreamlab/deploy-backup-2026-09-14  # adjust date
ssh dreamlab@103.93.134.215 "
  docker exec -i production-light-db-1 psql -U erp_user -d erp_database < $BACKUP_DIR/erp_database_pre_wave.sql
  docker exec -i production-light-db-1 psql -U erp_user -d erp_preview_kil < $BACKUP_DIR/erp_preview_kil_pre_wave.sql
"
```

### Rollback backend (revert to old image)
```bash
# If you have a backup tarball of the previous dist:
ssh dreamlab@103.93.134.215 '
  docker cp /path/to/old-dist.tar.gz preview-kil-backend:/tmp/
  docker exec preview-kil-backend sh -c "rm -rf /app/dist && mkdir -p /app/dist && tar -xzf /tmp/old-dist.tar.gz -C /app/dist"
  docker restart preview-kil-backend
'
```

### Rollback frontend
```bash
# If you have backup of previous .next:
ssh dreamlab@103.93.134.215 '
  docker cp /path/to/old-next.tar preview-kil-frontend:/tmp/
  docker exec preview-kil-frontend sh -c "rm -rf /app/.next && mkdir -p /app/.next && tar -xf /tmp/old-next.tar -C /app/.next"
  docker restart preview-kil-frontend
'
```

**Better long-term:** commit changes to Docker images (via Dockerfile + rebuild) so they're durable. Current `docker cp` pattern is non-persistent across `docker-compose up --build`.

---

## Lessons Learned (from E2 + F2 session)

1. **`production-light-*` ≠ live.** Always update `preview-kil-*` for public traffic changes. F2 agent learned this the hard way.
2. **`docker cp dist/` only copies `.js` files, NOT config files.** Always also copy `.yaml`, `.json`, etc. config files separately.
3. **`docker cp` to running container is non-persistent.** Changes lost if container is rebuilt via `docker-compose up --build`. For durable changes, bake into Dockerfile + rebuild image.
4. **CF Tunnel bypasses nginx.** `/etc/cloudflared/config.yml` routes public traffic directly to localhost ports, not through nginx. So nginx proxy_pass fixes don't help public URLs — only local container-to-container traffic.
5. **`prisma migrate deploy` auto-regenerates client.** No need to manually run `prisma generate` after applying new migration.
6. **Two databases, two schemas.** `erp_database` (production-light) and `erp_preview_kil` (preview-kil). They have different migration histories. Apply new migrations to BOTH when adding features.
7. **Frontend container has NO bind mounts.** All static assets baked in. To update, must `docker cp` or rebuild image.

---

## Related Documentation

- `docs/infra/nginx.conf` — nginx config for production-light (now with /v1 proxy_pass from F1)
- `docs/QA_GATE.md` — overall QA status
- `docs/plan/_MASTER_TRACKER.md` — phase closure audit
- Memory: `wave-4-e2-backend-deploy-2026-09-13.md`, `wave-4-e1-qa-gate-complete-2026-09-13.md`
