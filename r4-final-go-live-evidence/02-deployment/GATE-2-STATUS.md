# Gate 2 — Production-like Deployment

**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**Verdict:** **FAIL — environment does not satisfy R4 §10**

## Why Gate 2 cannot PASS in this worktree

R4 §10 (Deployment Target) requires:

> Linux, production Node version, PostgreSQL, production frontend build,
> production backend build, persistent filesystem/storage, Docker
> Compose + Caddy if that is the chosen deployment architecture, HTTPS,
> real reverse proxy behavior, NODE_ENV=production.

This worktree is the developer's Windows 11 workstation:

| R4 §10 requirement | This worktree | Status |
|---|---|---|
| Linux | Windows 11 Home Single Language (10.0.26200) | **FAIL** |
| Production Node version | Node 22.21.0 | OK |
| PostgreSQL | Postgres 16 in Docker (`nexerp-postgres:55432`) | OK |
| Production frontend build | `.next/` (BUILD_ID `5pTaANJJFfIIPnUMffVlm`) | OK |
| Production backend build | `backend/dist/` (296 files, 6.8 MB) | OK |
| Persistent filesystem/storage | Local NTFS, no production FS | PARTIAL |
| Docker Compose + Caddy | `docker-compose.yml` exists; no Caddy, no compose-up production stack running | **FAIL** |
| HTTPS | none — only `http://localhost` | **FAIL** |
| Real reverse proxy | none | **FAIL** |
| NODE_ENV=production | `backend/.env` has `NODE_ENV=development` | **FAIL** |

## What Gate 2 would require to PASS

A separate Linux host (Hetzner / equivalent) where:

1. `docker compose up -d` brings up `db` + `backend` + `frontend` from
   the release artifact.
2. Caddy (or equivalent) terminates TLS in front of `frontend:3000`
   and reverse-proxies `/api/*` to `backend:3002`.
3. `NODE_ENV=production` is set in the compose stack.
4. `BACKUP = pg_dump erp_db_r4_test > /var/backups/<sha>.sql.gz`
   produces a verifiable artifact, and a disposable restore confirms
   the schema + critical rows round-trip.
5. `prisma migrate deploy` runs against the shadow DB, then a second
   run produces NO-OP.
6. Auth flow exercised through the real public origin over HTTPS
   (login → navigate → hard refresh → logout → relogin) for
   representative roles.
7. Backend process restart proves health recovers and persistent
   records survive.
8. Same-SHA redeploy with NO-OP migrations preserves records and
   keeps auth working.

None of 1–8 can be executed from a Windows dev worktree. The
remediation work is correct on its own merits, but the *evidence*
R4 demands for Gate 2 has to come from a real production-like host.

## Decision

Gate 2 = FAIL until the release artifact (Gate 1) is fully fixed and
promoted to the production-like host (Hetzner / equivalent) where
the §10 characteristics hold. The deploy tooling
(`docker-compose.yml`, `Caddyfile`-equivalent if any, `deploy.ps1`)
already exists in the repo; what is missing is the host that
satisfies the §10 parity matrix.

## Gate 2 Verdict

**GATE_2_PRODUCTION_LIKE_DEPLOYMENT = FAIL**

BLOCKER: this worktree is a Windows dev machine, not the
production-like Linux host R4 §10 mandates.
