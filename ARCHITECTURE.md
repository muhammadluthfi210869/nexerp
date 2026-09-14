# NexERP Architecture

> **Last updated**: 2026-09-14 (deploy-architecture-fix plan, see `docs/qa-gate/2026-09-14-deploy-architecture-fix.md`)

## Branch Topology

```
                    ┌────────────────────────────────────────────┐
                    │  Common ancestor: 59eeca2c (2026-07-24)   │
                    └────────┬───────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       phase-3                       production-light
       (no remote)                   (origin/production-light)
       399 commits ahead              68 commits ahead
       38 backend modules             5 backend modules
       23 schema files                6 schema files
       18 frontend page folders       5 frontend page folders
       Full ERP rebuild               Intentionally pruned ERP
                                      (canonical-marketing bridged)
              │                             ▲
              │   bridge (surgical          │
              │   single-commit             │
              │   cherry-pick)              │
              └─────────────────────────────┘
                       │
                       ▼
                Biznet VPS 103.93.134.215
                compose project: production-light
                containers: backend :3001 + frontend :3000
                             + nginx (80/443) + certbot + db :5432
                       │
                       ▼
                https://nexerp.id
```

## Why this bifurcation exists

`production-light` and `phase-3` are **two different products** from the same ancestor, not two versions of the same product:

- **`production-light`** (per `PRODUCTION_LIGHT.md`) is the **pruned ERP** — only RND, DigiMar, HR, Marketing (prototype + canonical-bridged). Built for stable VPS deploy of the minimum viable feature set.
- **`phase-3`** is the **additive rebuild** — all 38 modules, 23 schema files, full governance. Designed for full-ERP demos and dev work.

Trying to wholesale-merge them fails (proven 2026-09-14, commit `e75fbe1` reverted because of 50 Prisma errors + 6 missing NestJS modules). The two have mutually exclusive refactor mandates.

## Deploy Workflow (the ONLY working pattern)

When phase-3 work is needed on production-light:

1. Pick the smallest atomic commit group from phase-3
2. `bash scripts/bridge-to-production-light.sh phase-3 <commit-ish>`
   - Validates: clean tree, ≤50 files, ≤5000 lines, no `pg_advisory_xact_lock` reintro
   - Runs `prisma generate`, jest, tsc on touched modules
   - Auto-aborts on any guard failure
3. Bridge commit gets pushed to `origin/production-light`
4. On VPS: `git pull --ff-only origin production-light && docker compose -p production-light up -d --build backend frontend`

**NEVER do** `git merge phase-3 --no-ff` — this is blocked by `scripts/safe-merge.sh` (whole repo guard) and by CI `bridge-size-guard` job.

## Live Stack

- **Domain**: `https://nexerp.id`
- **HTTPS**: nginx (certbot-managed LetsEncrypt)
- **Backend**: NestJS + Prisma (Driver Adapter) on port 3001
- **Frontend**: Next.js standalone on port 3000
- **DB**: postgres:15-alpine on port 5432
- **Volumes**: postgres_data (persistent), certbot/conf, certbot/www, backend/uploads

## Source-of-Truth Reference

| Layer | Doc |
|---|---|
| Why ERP is pruned | `PRODUCTION_LIGHT.md` (repo root) |
| Deploy procedure | `DEPLOY.md` (repo root) |
| Incident response | `RUNBOOK.md` (repo root) |
| Bridge pattern (canonical-marketing template) | `docs/BridgePattern.md` |
| Canonical mgmt-task contract | `docs/marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md` |
| QA gate history | `docs/qa-gate/` |
| Code governance | `docs/governance/` (cherry-picked from phase-3 `docs/ssot/`) |
| Doc navigation hub | `docs/INDEX.md` |

## Critical Scripts

| Script | Purpose |
|---|---|
| `scripts/bridge-to-production-light.sh` | **The centerpiece.** Cherry-picks single atomic commit from phase-3 with full validation guards. |
| `scripts/safe-merge.sh` | Wrapper for `git merge` that BLOCKS wholesale phase-3 merge + enforces small-size threshold for other branches. |
| `scripts/rollback.sh` | Sub-10s image-tag-based rollback. Previous image tags preserved by `scripts/deploy.sh` after each build. |
| `scripts/db-snapshot.sh` | Standalone `pg_dumpall` to `backups/snapshot-YYYYMMDD-HHMMSS.sql.gz`. Run before risky deploys. |
| `scripts/deploy.sh` | Server-side deploy (run on VPS after `git pull`). Tags images with timestamp for rollback. |
| `scripts/deploy-biznet.sh` | Biznet-only deploy without `--build` (image-transfer model). |
| `scripts/verify-deploy.sh` | Pre-deploy sanity check. Filename refs fixed 2026-09-14. |
| `scripts/test-deploy.sh` | CI integration test. |
| `scripts/__tests__/` | Regression test harness for all deploy-architecture invariants. Run via `bash scripts/__tests__/run-all.sh`. |

## CI / CD

Single workflow: `.github/workflows/ci.yml`:
- Triggers on push to `production-light`, `main`, `phase-3` + PRs to `main` and `production-light`
- Jobs: `build-and-test` (compile + integration test) + `bridge-size-guard` (wholesale-merge blocker)
- No deploy step. Deploy is manual via SSH (Biznet 4 GB RAM, no rebuild-from-scratch capability).

## Hard Rules (enforced)

1. **Production-light runs on `nexerp.id`. Period.** preview-kil-*, demo.*, kil.* — all decommissioned 2026-09-14.
2. **Wholesale phase-3 merge is BLOCKED** at three layers: `scripts/safe-merge.sh`, `scripts/bridge-to-production-light.sh` (size guard), `.github/workflows/ci.yml` (bridge-size-guard job).
3. **DB changes are additive only.** Tables get added; existing tables never get columns dropped in production. Migration scripts (`backend/prisma/migrations/`) are append-only.
4. **`prisma generate` is required** in CI (within backend Dockerfile build). Skipping it = production will not boot.
5. **`docs/` is tracked** (was mistakenly gitignored 2026-09-14; removed from `.gitignore`). Force-add removed.
