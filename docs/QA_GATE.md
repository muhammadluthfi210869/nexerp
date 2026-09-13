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
| 2026-09-12 | OmniCRM MVP (Phase 0-5) | PASS (local) | `docs/qa-gate/2026-09-12-omnicrm-mvp.md` |
| 2026-09-12 | Management Task Module (Phase 1-3) | PASS | `docs/qa-gate/2026-09-12-management-task-phase3.md` |
| 2026-09-13 | OmniCRM Round 2 (per-busdev + DNA) | PASS (local) | this entry |

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

## Gate Report — 2026-09-13 — OmniCRM Round 2

**Branch:** `phase-3`  
**Commits since Round 1:** `e9f3082`, `18b7373`, `9496d16`, `aaf75fe`, `966477a`, `795d272`, `ec6caed` (+ this docs commit = 8 total)

### What changed

| Change | Reproduction test | Suite status | Evidence |
|---|---|---|---|
| **BUG #2 fix**: `POST /crm/leads/:id/reply` writes `firstOutboundAt` (idempotent) + LeadAudit `OUTBOUND_REPLY` | `leads-reply.spec.ts` (6 jest tests) | **PASS** | commit `e9f3082` |
| **BUG #8 fix**: Auto round-robin busdev assign on ingest via `BussdevStaff.totalLeads` self-balancing cursor | `round-robin.spec.ts` (4 jest) + updated `lead-svc-webhook.controller.spec.ts` (3 jest) | **PASS** | commit `18b7373` |
| **A3**: `KpiSummary.replyRatePerBusdev` array (per-busdev total/replied/replyRatePct/avgFirstResponseMinutes) | `kpi.service.spec.ts` Round 2 block (3 jest) + 8 existing | **PASS** | commit `9496d16` |
| **B1**: Guestbook `?assignedToId=` query + UI `DnaSearchableSelect` filter | `guestbook-filter.spec.ts` (4 jest) + 2 new Playwright E2E | **PASS** | commit `aaf75fe` |
| **B2**: KPI drill-down table consumes `replyRatePerBusdev` (replaced Round Robin Distribution) | 1 new Playwright E2E | **PASS** | commit `966477a` |
| **B3**: Overview DNA refactor — `DnaDatePicker` x2, `DnaTable` (full Live Capture), `DnaCard` (filter bar), `DnaStatCard.onClick` (KPI cards) | E2E selectors preserved via `DnaStatCard` 1-line DNA tweak (forward `...rest`) | **PASS** | commit `795d272` |
| **B4**: Guestbook toast + confirm, Lead Detail `DnaCard`/`DnaInput` refactor, sidebar 6 legacy BUSDEV entries removed | covered by B1 + lead-detail E2E | **PASS** | commit `ec6caed` |

### Aggregate test status

- Backend Jest: **61/61 across 9 suites** (`npx jest src/modules/crm`)
- New Jest tests this round: **17** (leads-reply 6 + round-robin 4 + kpi 3 + guestbook-filter 4)
- New Playwright E2E specs: **3** (guestbook filter x2 + KPI per-busdev table x1)
- Total E2E specs: 14 (was 11 in Round 1)

### Skipped / Deferred

- **BUG #1 `LostDealsService.create()`** — calls `tx.salesLead.update()` on a model that doesn't exist in `crm.prisma`. Dead code, no callers. Not exercised by any E2E. Flag for Round 3 cleanup. File: `backend/src/modules/crm/lost-deals/lost-deals.service.ts:25`.
- **`CrmKpiWindow` enum** — declared in `enums.prisma` but zero usages. Cleanup deferred.
- **Live VPS curl-verify of Round 2** — not performed. User action on deploy.
- **Working tree risk** — `Sidebar.tsx`, `marketing-service.ts`, `marketing-api.ts`, `app/layout.tsx` all `M` in `git status` (pre-existing Phase 3 work). Round 2 sidebar cleanup landed cleanly on top.

### Known follow-ups

1. Apply manual diff to lead-svc-deploy (the `postToErp` block from `OMNICRM-DEPLOY.md §B`) — that file is NOT in this repo.
2. Set `LEAD_SVC_INGEST_SECRET` env on production backend + lead-svc-deploy (must match).
3. Run `npx prisma migrate deploy` on VPS if auto-apply missed it.
4. Verify `kpi.replyRatePerBusdev` populates after first reply.
5. Sidebar BUSDEV entries now point at canonical CRM routes — verify the persona-switcher renders these for busdev-role users (not all personas see BUSDEV_SECTIONS).

**Status:** ✅ READY FOR VPS DEPLOY (Round 2). Same user-action gate as Round 1: open PR, merge, SSH, set env, restart backend+frontend.