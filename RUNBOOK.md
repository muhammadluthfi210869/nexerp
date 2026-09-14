# NexERP Production Runbook

> **Last updated**: 2026-09-14 (deploy-architecture-fix)
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
sudo docker logs production-light-backend-1 --tail 100
sudo docker logs production-light-frontend-1 --tail 100
sudo docker logs production-light-nginx-1 --tail 50
```

Common root causes:
- `Cannot find module './modules/X'` → missing module after merge → revert commit penyebab di `main` (jangan cherry-pick lintas branch — workflow bridge sudah diarsipkan)
- `prisma generate` failure → schema broken → revert + fix schema
- `502 Bad Gateway` → backend crashed or nginx upstream wrong → check backend logs

---

## P1 — API Returning 500

### Step 1: Health check

```bash
curl -sf http://127.0.0.1:3001/health
# Expected: 200 OK with JSON like {"status":"operational",...}
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
free -h                                  # VPS RAM (Biznet = 4 GB)
sudo docker stats --no-stream           # container memory usage
```

If backend OOM: `sudo docker compose -p production-light restart backend`.

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
sudo nano .env  # add missing key
docker compose -p production-light up -d backend  # retry without rebuild
```

### Scenario C: Migrations out of sync

```bash
# On VPS: compare migration history
sudo docker exec production-light-db-1 psql -U erp_user -d erp_database -c "SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5"
# Compare with backend/prisma/migrations/ directory on local
# If missing on local: regenerate via prisma migrate dev
```

---

## Secret Rotation

### Rotate JWT_SECRET / AES_SECRET_KEY

```bash
# On local: generate new secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # AES_SECRET_KEY

# On VPS: edit .env
sudo nano /home/dreamlab/nexerp/backend/.env
# Replace JWT_SECRET= and AES_SECRET_KEY= values

# Restart backend
cd /home/dreamlab/nexerp
sudo docker compose -p production-light restart backend

# Verify
curl -s http://127.0.0.1:3001/health
# All existing JWTs become INVALID — users must re-login (expected)
```

### Rotate Google Sheets / Kommo / WA secrets

```bash
# Edit .env on VPS as above
sudo docker compose -p production-light restart backend
# No DB migration needed — these are external service credentials
```

---

## DB Restore from Snapshot

```bash
# Find snapshot
ls -lht backups/snapshot-*.sql.gz | head -5

# Restore (DESTRUCTIVE — drops + recreates DB)
gunzip -c backups/snapshot-20260914-120000.sql.gz | \
  sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database

# Restart backend (drop connections to old DB)
sudo docker compose -p production-light restart backend

# Verify
curl -s http://127.0.0.1:3001/v1/marketing/members \
  -H "Authorization: Bearer $JWT" | jq '.data | length'
```

---

## Disk Cleanup

```bash
# Prune stopped containers
sudo docker container prune -f

# Prune dangling images
sudo docker image prune -f

# Prune old image tags (keep last 5 per service)
sudo docker images --format '{{.Tag}} {{.CreatedAt}}' production-light-backend \
  | sort -k2 -r | tail -n +6 | awk '{print $1}' \
  | xargs -I{} sudo docker rmi production-light-backend:{} 2>/dev/null || true
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
| Backend health | `curl -s http://127.0.0.1:3001/health` |
| Container status | `docker ps --format "{{.Names}} {{.Status}}"` |
| Recent backend logs | `docker logs production-light-backend-1 --tail 50` |
| Rollback | `bash scripts/rollback.sh <sha_sebelumnya>` |
| Snapshot DB | `bash scripts/db-snapshot.sh` |
| Restart backend only | `docker compose -p production-light restart backend` |
| Pull + rebuild | `git pull --ff-only && bash scripts/deploy.sh <sha_baru>   # pull image GHCR, tanpa build` |
