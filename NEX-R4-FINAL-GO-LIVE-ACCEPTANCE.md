# NEX ERP — R4 FINAL GO-LIVE ACCEPTANCE

**Status:** IN_PROGRESS
**Director-Ready:** NO
**Date:** 2026-08-25
**Mode:** R4 verification — no R5, no new batch, fix inside R4

## Release artifact

| Field | Value |
|---|---|
| RELEASE_BRANCH | release/r4-candidate |
| RELEASE_SHA | `163f11249fa3b8651fb2a4e0dc70964f3ec944ad` |
| WORKTREE_PATH | C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO |
| DIRTY_TRACKED | 0 (243 files committed as release candidate) |
| DIRTY_UNTRACKED_ARTIFACTS | 382 (logs / debug scripts — not part of release) |
| BUILD_TIMESTAMP | 2026-08-25T01:36:38Z |
| HOST | Windows 11 / Node 22.21.0 / npm 10.9.4 |

## Gate results

### Gate 1 — Release Artifact — FAIL

| Sub-gate | Result |
|---|---|
| Backend production build | PASS — prisma generate OK, env validator OK, nest build (SWC) compiled 296 files in 650 ms |
| Frontend production build | PASS — `next build` emitted 166 routes, BUILD_ID `5pTaANJJFfIIPnUMffVlm`, exit 0 |
| Day-1 remediation Playwright | **FAIL — migration chain blocked** |
| Clean release SHA recorded | PASS |

Two systemic P1 migration bugs were discovered during fresh-DB
`prisma migrate deploy` rehearsal (R4 §13/14 path):

1. `LeadStatus` enum conflict between phase1 and
   lead_attribution_journey — phase1 declared the legacy values
   (`NEW / CONTACTED / SAMPLE / NEGO / DEAL / LOST`) and
   lead_attribution_journey used an idempotent `DO $$ BEGIN ...
   EXCEPTION` block, so the legacy enum is never replaced and the
   downstream `DEFAULT 'PENDING'` fails on a fresh DB.
2. `formulas.id` type mismatch — phase1 created the column as
   `TEXT`, marketing_batch3_placeholder_repair used
   `CREATE TABLE IF NOT EXISTS` (no-op), and batch3_so_formula_pinning
   tries to add `sales_orders.formulaId UUID` with an FK to
   `formulas(id)` — type mismatch.

Both follow the same anti-pattern: a later migration assumes
phase1's schema is replaceable when in fact it is frozen.

### Gate 2 — Production-like Deployment — FAIL

The worktree is a Windows 11 dev machine. R4 §10 demands a Linux host
with Docker Compose + Caddy + HTTPS + reverse proxy + persistent
storage + NODE_ENV=production. None of the §10 requirements for
production-like parity (Linux, Caddy, real HTTPS, real reverse
proxy, prod NODE_ENV) are satisfiable from this worktree. Postgres
16 runs in Docker locally, but `docker compose` is not used to bring
up the production stack and there is no TLS terminator.

### Gate 3 — Full Browser Golden Flow — BLOCKED (Gate 2 dependent)

Gate 3 requires a real production deployment with role-based auth
over HTTPS. Gate 2 = FAIL ⇒ Gate 3 cannot run from this worktree.
The role-based flow described in R4 §21–§35 cannot be executed
against a non-existent production deployment.

### Gate 4 — Business Truth + Cutover Rehearsal — BLOCKED (Gate 2 dependent)

Reconciliation, formula-version pinning, exactly-once shipment /
payment, master data rehearsal, opening-stock rehearsal, open
transaction rehearsal, and authorization negative tests all require
the production-like deployment from Gate 2. None can be run.

### Gate 5 — Human Role UAT — PENDING_HUMAN_UAT

R4 §50 is explicit: this gate cannot be self-approved by AI and
requires actual representative company users per role. None are in
the scope of this verification. The verdict per R4 §57 is
`PENDING_HUMAN_UAT` regardless of any other gate.

## Counts

| Metric | Count |
|---|---|
| P0 remaining | 0 (Day-1 remediation closure holds — software-level) |
| CORE P1 remaining | 2 (LeadStatus enum conflict, formulas.id type mismatch) |
| P2/P3 backlog | TBD — not enumerated in R4 scope; collected under 30-day watchlist |
| Developer-intervention count in human UAT | N/A (no human UAT participants in scope) |

## Rollback readiness

Repository contains:
- `NEX-PRODUCTION-RELEASE-ROLLBACK-CHECKLIST.md`
- `releases/r1-backup-final/`, `releases/r1-backup/`,
  `releases/r1-archive/`
- `docker-compose.yml` and `docker-compose.prod.yml`

The release SHA `163f112` is the rollback target for the in-progress
fix; once a clean migration fix lands, the SHA will be re-frozen.

## 30-day watchlist

Path: `NEX-30-DAY-OPERATIONAL-WATCHLIST.md` (already in repo).
Updated by SRE after R4 PASS.

## Final verdict

**R4 = IN_PROGRESS**
**DIRECTOR_READY = NO**
**BLOCKER = migration chain has 2 systemic P1 bugs (LeadStatus enum,
formulas.id type) that block Gate 1 Playwright; in addition, this
worktree is a Windows dev machine and cannot satisfy Gate 2
production-like parity (Linux / Caddy / HTTPS / prod NODE_ENV).
Fix inside R4:**
1. Add a single coordinated migration
   `r4_pre_flight_schema_realign` that brings the schema into a
   state where the existing chain applies cleanly on a fresh DB
   (drop-and-recreate `LeadStatus`, ALTER `formulas.id` to UUID with
   type cast) — **requires user approval**.
2. Re-freeze the release SHA after the fix.
3. Promote the new SHA to the production-like Linux host where
   §10 parity holds.
4. Re-run Gate 1, Gate 2, Gate 3, Gate 4 on that host.
5. Recruit representative company users per role for Gate 5.

No R5 created. No new batch opened. The fix path lives inside R4.
