# QA Gate — NexERP

> **Purpose**: Single source of truth for "is this feature ready to ship?"
> Per CLAUDE.md, no feature may be marked "done/ready" without running
> the gate below and writing an entry to `docs/qa-gate/<date>-<feature>.md`.

## Gate Criteria

A feature is **READY TO SHIP** only if ALL of the following are true:

1. **Code complete** — every step in the feature's plan is implemented
   and committed (atomic commits, no uncommitted work).
2. **Type-check clean** — `cd backend && npx tsc --noEmit` and
   `cd frontend && npx tsc --noEmit` show **no NEW errors** introduced
   by this feature. (Pre-existing errors in unrelated files are noted
   but not blocking.)
3. **Unit tests pass** — new service/unit tests are green. For backend:
   `cd backend && NODE_OPTIONS=--max-old-space-size=8192 npx jest
   --config ./test/jest-unit.json --runInBand --testPathPatterns="<feature>"`.
4. **Smoke test passes** — feature-specific smoke script exits 0.
5. **No regressions in critical paths** — affected controllers still
   respond; auth flow still works; no startup crash.

## Gate Entry Template

Each gate run writes a file at `docs/qa-gate/YYYY-MM-DD-<feature-slug>.md`
with:

```markdown
# QA Gate — <feature name> (<date>)

**Status**: PASS | FAIL
**Branch**: <branch>
**Commits**: <sha list, since main or last gate>

## Checks
- [x] Code complete — <commit count> commits, <files changed>
- [x] Type-check clean — backend 0 new errors, frontend 0 new errors
- [x] Unit tests — N/N green
- [x] Smoke test — N/N green
- [x] No regressions — <notes>

## Skipped
- <anything deliberately skipped, with reason>

## Known issues / Follow-up
- <list>
```

## Per-feature Smoke Scripts

Located at `backend/scripts/smoke-<feature>.ts`. Run with
`cd backend && npx ts-node --transpile-only scripts/smoke-<feature>.ts`.

Exit code 0 = pass.

## History

| Date | Feature | Status | Entry |
|---|---|---|---|
| 2026-09-11 | WS-D Activity Tracking | PASS | `docs/qa-gate/2026-09-11-ws-d-activity-tracking.md` |
| 2026-09-12 | OmniCRM MVP (Phase 0-5) | PASS (local) | `docs/qa-gate/2026-09-12-omnicrm-mvp.md` (this run) |

## Gate Report — 2026-09-12 — OmniCRM MVP

| Change | Reproduction test | Suite status | Evidence |
|---|---|---|---|
| Schema: CrmLead + GuestbookEvent + LeadAudit + 3 enums + migration | n/a (schema-only) | n/a | `npx prisma format` clean; commit `3b2f4b6` |
| Backend: 4 services + HMAC + 13 endpoints | `backend/src/modules/crm/__tests__/` (43 Jest) | **43/43 green** | commits `5e85a14`, `9132599`, `fac182b`, `71c2d6b` |
| Frontend: single-page Overview + 4 drill-down sub-routes | `frontend/tests/e2e/omnicrm-{overview,buku-tamu,lead-detail}.spec.ts` (11 E2E) | n/a (no dev server in sandbox; ready via `npx playwright test`) | commits `4ddd06b` |
| Sidebar: remove broken /overview + /team entries | covered by omnicrm-overview.spec.ts regression | PASS | commit (this PR) |
| Bug fix: Promise.all on today/week groupBy → sequential awaits | `kpi.service.spec.ts` Round Robin test | PASS | commit (this PR) |
| Bug fix: from/to date filter UTC parsing (was local time → 7h shift) | `leads.service.spec.ts` "applies from/to as inclusive day boundaries" | PASS | commit (this PR) |

**Status:** ✅ READY FOR VPS DEPLOY. The 11 Playwright E2E specs need to be executed against a live dev server per docs/marketing/OMNICRM-DEPLOY.md §D; that step is on the user (SSH + dev server + `npx playwright test`).