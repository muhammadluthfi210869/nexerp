# NexERP Production Runbook

> **Last updated**: 2026-09-14 (pasca-cutover konsolidasi — `/v1/health`, tanpa sudo, RAM 8GB)
> **Panduan lengkap testing+deploy**: [docs/PANDUAN-TESTING-DAN-DEPLOY-LENGKAP.md](docs/PANDUAN-TESTING-DAN-DEPLOY-LENGKAP.md)
> **Scope**: P0-P2 incident response for production deploy on `nexerp.id`
> **Audience**: On-call developer with VPS SSH access

---

## P0 — Site Down (https://nexerp.id unreachable / 5xx)

### Step 1: Quick triage (30s)

```bash
ssh dreamlab@103.93.134.215
docker ps --format "{{.Names}} {{.Status}}" | grep -v "dreamlab-lead\|nexerp-db"
# Expected: 4 services — backend, frontend, nginx, db (certbot optional)
```

If any container is `Exited (X)` or `Restarting`, that's likely the cause.

### Step 2: Rollback (sub-10s)

```bash
# On VPS: roll back to previous known-good image tag
bash scripts/rollback.sh <sha_sebelumnya>
# This swaps image tags; no git revert, no rebuild
```

Verify: `curl -sI https://nexerp.id/` returns 200.

If rollback doesn't fix it:
```bash
bash scripts/rollback.sh <sha_yang_bisa>   # SHA lama masih valid di GHCR
```

### Step 3: Snapshot DB before any rebuild

```bash
bash scripts/db-snapshot.sh
# Creates backups/snapshot-YYYYMMDD-HHMMSS.sql.gz
```

### Step 4: Check logs

```bash
docker logs production-light-backend-1 --tail 100
docker logs production-light-frontend-1 --tail 100
docker logs production-light-nginx-1 --tail 50
# Catatan: user dreamlab sudah di grup docker — sudo TIDAK diperlukan.
# Healthcheck nginx bisa "unhealthy" semu (wget --spider ikut redirect https);
# kebenaran = curl -sI https://nexerp.id/
```

Common root causes:
- `Cannot find module './modules/X'` → missing module after merge → revert commit penyebab di `main` (jangan cherry-pick lintas branch — workflow bridge sudah diarsipkan)
- `prisma generate` failure → schema broken → revert + fix schema
- `502 Bad Gateway` → backend crashed or nginx upstream wrong → check backend logs

---

## P1 — API Returning 500

### Step 1: Health check

```bash
curl -sf http://127.0.0.1:3001/v1/health
# Expected: 200 OK with JSON like {"status":"operational",...}
# (prefix API global NestJS = /v1 sejak konsolidasi)
```

If 404 or 000: backend not running → check `docker logs production-light-backend-1`.

### Step 2: Snapshot + rollback

```bash
bash scripts/db-snapshot.sh
bash scripts/rollback.sh <sha_sebelumnya>
```

If rollback fixes it → file bug report with the failing commit SHA.

### Step 3: Check for n+1 / OOM

```bash
free -h                                  # VPS RAM (Biznet = 8 GB + swap 4 GB)
docker stats --no-stream                # container memory usage (backend budget < ~512MB)
```

If backend OOM: `docker compose -p production-light restart backend`.

---

## P2 — Deploy Failed Mid-Flight

### Scenario A: Image build failed

```bash
# On local: identify failing commit
git log --oneline -5
# Revert locally
git revert <bad-commit-sha>
git push origin main   # CI build+push image
# On VPS
cd /home/dreamlab/nexerp
git pull --ff-only
bash scripts/deploy.sh <sha_baru>   # pull image GHCR, tanpa build
```

### Scenario B: Compose up failed (container won't start)

```bash
# On VPS: check what's wrong
docker compose -p production-light logs backend --tail 50
# Most common: env var missing in .env
nano .env  # add missing key (user dreamlab, tanpa sudo)
docker compose -p production-light up -d backend  # retry without rebuild
```

### Scenario C: Schema out of sync (era `db push` — TIDAK pakai `_prisma_migrations`)

```bash
# Skema live diterapkan backend/init-db.sh saat boot (prisma db push, safe-first).
# Jika boot terblokir DROP: baca rencananya dulu:
docker exec production-light-backend-1 cat /app/data/.schema-drift-acknowledged.plan
# Audit drift manual (offline, nol tulis): prisma migrate diff --from-config-datasource
# vs skema — lihat docs/PANDUAN-TESTING-DAN-DEPLOY-LENGKAP.md § Level 5.
# Setujui sadar → hapus marker → restart backend.
```

---

## Secret Rotation

### Rotate JWT_SECRET / AES_SECRET_KEY

```bash
# On local: generate new secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # AES_SECRET_KEY

# On VPS: edit .env root proyek
nano /home/dreamlab/nexerp/.env
# Replace JWT_SECRET= (dan AES_SECRET_KEY= bila ada)
# PENTING: sinkronkan juga ke GitHub: gh secret set JWT_SECRET
# (frontend dibuild CI dengan secret ini — beda nilai = token invalid)

# Restart backend
cd /home/dreamlab/nexerp
docker compose -p production-light restart backend

# Verify
curl -s http://127.0.0.1:3001/v1/health
# All existing JWTs become INVALID — users must re-login (expected)
```

### Rotate Google Sheets / Kommo / WA secrets

```bash
# Edit .env on VPS as above
docker compose -p production-light restart backend
# No DB migration needed — these are external service credentials
```

---

## DB Restore from Snapshot

```bash
# Find snapshot
ls -lht backups/snapshot-*.sql.gz | head -5

# Restore (DESTRUCTIVE — drops + recreates DB)
gunzip -c backups/snapshot-20260914-120000.sql.gz | \
  docker exec -i production-light-db-1 psql -U erp_user -d erp_database

# Restart backend (drop connections to old DB)
docker compose -p production-light restart backend

# Verify
curl -s http://127.0.0.1:3001/v1/marketing/members \
  -H "Authorization: Bearer $JWT" | jq '.data | length'
```

---

## Disk Cleanup

```bash
# Prune stopped containers
docker container prune -f

# Prune dangling images
docker image prune -f

# Prune old image tags (keep last 5 per service)
docker images --format '{{.Tag}} {{.CreatedAt}}' production-light-backend \
  | sort -k2 -r | tail -n +6 | awk '{print $1}' \
  | xargs -I{} docker rmi production-light-backend:{} 2>/dev/null || true
```

---

## Contacts

- **VPS provider**: Biznet (BiznetGio / Neo Metal / Metro), control panel: https://portal.biznetgio.com/
- **Domain registrar**: Cloudflare (account needed for DNS records)
- **Repo owner**: Muhammad Luthfi (luthfi@gawe.plus / 2966luthfi@gmail.com)
- **Escalation**: open GitHub issue at https://github.com/muhammadluthfi210869/nexerp/issues

---

## Quick Reference

| What | Command |
|---|---|
| Check site | `curl -sI https://nexerp.id/` |
| Backend health | `curl -s http://127.0.0.1:3001/v1/health` |
| Container status | `docker ps --format "{{.Names}} {{.Status}}"` |
| Recent backend logs | `docker logs production-light-backend-1 --tail 50` |
| Rollback | `bash scripts/rollback.sh <sha_sebelumnya>` |
| Snapshot DB | `bash scripts/db-snapshot.sh` |
| Restart backend only | `docker compose -p production-light restart backend` |
| Pull + rebuild | `git pull --ff-only && bash scripts/deploy.sh <sha_baru>   # pull image GHCR, tanpa build` |
