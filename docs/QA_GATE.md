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