# Phase 0 Evidence Freeze — README

**Project**: ERP DREAMLAB (nexerp.id)
**Capture date**: 2026-09-10
**Branch**: `main` @ `3308a9d197ec51442ec2290155cc516d41ee5503`
**Status**: 🟡 **PARTIAL FREEZE** — local state captured, production state pending user actions

## Quick Start (baca urutan)

1. **[SUMMARY.md](SUMMARY.md)** — read first, ini overview + rekomendasi
2. **[08-adr-signoff/ADR_RECOMMENDATIONS_2026-09-10.md](08-adr-signoff/ADR_RECOMMENDATIONS_2026-09-10.md)** — sign 4 ADR foundational
3. **[06-migrations/critical-db-findings.txt](06-migrations/critical-db-findings.txt)** — apply pending migrations ASAP
4. **[09-api-contract/INDEX.md](09-api-contract/INDEX.md)** — review API_CONTRACT.yaml v0.1 (49 endpoints)
5. **[07-worktree-classification/classification-report.txt](07-worktree-classification/classification-report.txt)** — review dirty tree classification

## Folder Structure

```
evidence/2026-09-10/
├── README.md                            (this file)
├── SUMMARY.md                           (start here)
├── 01-git/
│   ├── release-identity.txt             Branch, SHA, dirty count
│   ├── dirty-by-status.txt              Status distribution
│   ├── dirty-files-raw.txt              All 145 dirty files
│   ├── env-summary.txt                  Env var keys (no values)
│   └── recent-commits.txt               Last 10 commits
├── 02-images/                           (USER ACTION: VPS SSH required)
├── 03-db/                               (USER ACTION: backup)
├── 04-restore/                          (USER ACTION: restore test)
├── 05-baselines/
│   ├── 01-backend-typecheck.txt         195 TS errors
│   ├── 02-backend-lint.txt              2116 errors, 4974 warnings
│   ├── 03-frontend-typecheck.txt        20 TS errors
│   ├── 04-frontend-lint.txt             418 errors, 5084 warnings
│   └── 05-prisma-validate.txt           Schema valid, prismaSchemaFolder deprecated warning
├── 06-migrations/
│   ├── migration-directories.txt        36 migrations
│   ├── migration-file-checksums.txt     sha256 per migration.sql
│   ├── prisma-migrate-status.txt        6 pending migrations
│   ├── db-status-script.txt             12 tables MISSING in DB
│   ├── pending-migrations.txt           Detail pending migrations
│   ├── schema-info.txt                  Multi-file schema info
│   ├── schema-structure.txt             19 schema files
│   └── critical-db-findings.txt         Root cause analysis
├── 07-worktree-classification/
│   ├── all-dirty-files.csv              Full list 145 files
│   ├── classified-dirty-files.csv       Categorized
│   └── classification-report.txt        Report + recommendations
├── 08-adr-signoff/
│   └── ADR_RECOMMENDATIONS_2026-09-10.md  Sign-off recommendations for 4 ADR foundational
└── 09-api-contract/
    ├── INDEX.md                         API contract index
    ├── critical-flows.json              157 screens across 7 critical flows
    ├── catalog-overview.csv             Full catalog stats
    └── API_CONTRACT.yaml                49 endpoints first-cut
```

## User Actions Required (3 items)

### 1. Apply pending migrations (HIGH PRIORITY — DO FIRST)

```powershell
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\backend"
npx prisma migrate dev
```

This will apply 6 pending migrations, create 12 missing tables. Backend TS errors expected to drop significantly (from 195 → ~50 estimated).

### 2. Sign 4 ADR foundational

Update `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md`:
- ADR-002: 12 Modul + 176 screens + 7 route prefix
- ADR-003: Universal Code Format (2 varian, global sequence)
- ADR-005: Approval Threshold 50jt + Strict SoD
- ADR-007: Visual DNA 5-Layer Order (per LAYOUT_GOVERNANCE.md)

Detail sign-off text di `08-adr-signoff/ADR_RECOMMENDATIONS_2026-09-10.md`.

### 3. VPS actions (maintenance window)

```powershell
# SSH to nexerp.id (requires user to be on VPN or VPS network)
ssh <USER>@nexerp.id "date -u +'%Y-%m-%dT%H:%M:%SZ'; uptime"
ssh <USER>@nexerp.id "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'"
ssh <USER>@nexerp.id "cat /etc/nginx/sites-enabled/*"

# Database backup
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) pg_dump -U <DB_USER> -d <DB_NAME> > /tmp/backup-2026-09-10.sql"
# Save backup to: evidence/2026-09-10/03-db/

# Restore test (isolated DB)
ssh <USER>@nexerp.id "createdb -U <DB_USER> erp_db_restore_test"
ssh <USER>@nexerp.id "psql -U <DB_USER> -d erp_db_restore_test < /tmp/backup-2026-09-10.sql"
# Verify: counts per table (Lampiran B PHASE_0_RUNBOOK.md)
# Cleanup: dropdb erp_db_restore_test
```

## Phase 0 Exit Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Working tree captured | ✅ |
| 2 | Branch + SHA captured | ✅ |
| 3 | Recent commits logged | ✅ |
| 4 | Migration dirs + checksums | ✅ |
| 5 | Prisma migrate status | ✅ |
| 6 | Prisma validate | ✅ |
| 7 | Backend typecheck | ✅ |
| 8 | Backend lint | ✅ |
| 9 | Frontend typecheck | ✅ |
| 10 | Frontend lint | ✅ |
| 11 | DB backup | ⏳ USER ACTION |
| 12 | DB restore test | ⏳ USER ACTION |
| 13 | Production timestamp + nginx | ⏳ USER ACTION |
| 14 | ADR foundational signed | ⏳ USER ACTION |
| 15 | Worktree classification | ✅ |
| 16 | SUMMARY.md | ✅ |

**10/16 green locally. 5 require user action. 1 (DB backup) pending user VPN/maintenance window.**

## Next Phase (Phase 1 — Baseline Recovery)

After all 16 exit criteria green:

| Ticket | Scope | Estimated effort |
|---|---|---|
| BUILD-001 | Backend TS errors 195 → 0 | ~3-5 days (after migrations applied) |
| TEST-001 | Jest OOM fix (project split, worker control) | ~2-3 days |
| PRISMA-001 | Auto-validate migrations di CI | ~1 day |
| DEPLOY-001 | Healthcheck `/v1/system/live|ready` + fail on unhealthy | ~2-3 days |
| FRONTEND-TEST-001 | 84 vitest failures → 0 | ~3-5 days |

**Phase 1 estimated**: 2-3 weeks with focused execution.

## File Reference

- **Runbook**: `docs/legacy-erp/backend/PHASE_0_RUNBOOK.md`
- **Decisions log**: `docs/legacy-erp/backend/01_DECISIONS_LOG.md`
- **ADR tracker**: `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md`
- **Strict policies**: `docs/legacy-erp/backend/STRICT_POLICIES_ADDENDUM.md`
- **Legacy spec**: `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` + `NEX_ERP_SCREEN_AND_API_CATALOG.json`
- **Plan (REAL)**: `docs/plan/ERP_FINALIZATION_MASTER_PLAN.md` + `ZERO_ERROR_ROADMAP.md` + `HYPER_ALIGNMENT_PLAN.md`
- **Memory (Kilo)**: `~/.claude-minimax/projects/.../memory/MEMORY.md`

---

**Status**: Phase 0 evidence captured locally. User actions required: (1) apply migrations, (2) sign 4 ADR, (3) VPS backup/restore. Phase 1 Baseline Recovery can start in next session setelah exit criteria #11-#14 green.
