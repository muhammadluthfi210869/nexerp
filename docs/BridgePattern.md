# Bridge Pattern — phase-3 → production-light

> **Last updated**: 2026-09-14
> **Status**: BINDING workflow for any phase-3 → production-light code movement
> **Template commit**: `20fb4e1 feat(marketing): bridge canonical-marketing into production-light`

---

## Why this pattern exists

`phase-3` and `production-light` are **two different products** from the same ancestor (2026-07-24). Wholesale merge is **architecturally impossible** — it was attempted 2026-09-14 (commit `e75fbe1`) and caused:
- 50 Prisma schema validation errors
- 6 missing NestJS modules
- Prisma client generation failure
- Boot loop on VPS

The wholesale-merge disaster is reverted, but the **tooling gap** that enabled it remained. This document + the `scripts/bridge-to-production-light.sh` script + the `scripts/safe-merge.sh` wrapper + the CI `bridge-size-guard` job together enforce the bridge pattern at FOUR layers.

---

## When to use the bridge

| Scenario | Approach |
|---|---|
| 1-3 atomic commits from phase-3 needed on prod | **Use bridge** (`scripts/bridge-to-production-light.sh`) |
| Whole new module needed on prod (e.g. `omni-crm`) | **Use bridge** — bring module + schema additions in one commit, with back-references if needed |
| 100+ files / +5000 lines from phase-3 | **Split first.** Make atomic commits on phase-3 first, then bridge each one. NEVER wholesale. |
| Production-light needs refactor (e.g. RolesGuard policy) | **NOT a bridge** — edit production-light directly with proper QA gate. |

---

## The 7-step pattern (what the bridge script enforces)

1. **Verify DB state** — confirm tables exist before adding Prisma models.
   ```bash
   ssh dreamlab@103.93.134.215 "docker exec production-light-db-1 psql -U erp_user -d erp_database -c '\dt'"
   ```

2. **Code-only bridge, no DB migration** — when tables already exist on prod, the bridge is just code + schema definitions. No `prisma migrate deploy`.

3. **Preserve production-light's existing routes** — add new ones at NEW prefix, don't overwrite.
   - Production-light prototype: `/v1/marketing/prototype/*`
   - Production-light canonical-bridged: `/v1/marketing/*`

4. **Declare literal routes BEFORE parametric ones** in NestJS controllers.
   ```ts
   @Get('tasks/kpi')         // ← literal first
   @Get('tasks/:id')         // ← parametric second
   ```
   Otherwise NestJS resolves `"kpi"` as the `:id` param.

5. **Add source-level regression test** that grep-asserts the new code doesn't reintroduce a removed bad pattern.
   ```ts
   it('source file does NOT contain pg_advisory_xact_lock as executable code', () => {
     const src = fs.readFileSync(servicePath, 'utf8');
     // Strip comments, assert no executable occurrence
   });
   ```

6. **Single atomic commit, narrowly scoped** — 13 files / +3990 lines is the sweet spot (canonical-bridge template). 50 files / +5000 lines is the hard ceiling.

7. **Push to origin** → user-action on VPS: `git pull --ff-only && docker compose -p production-light up -d --build backend frontend`.

---

## Anti-patterns that produce the wholesale-merge disaster

| # | Anti-pattern | What goes wrong | Detection |
|---|---|---|---|
| 1 | `git merge phase-3 --no-ff` on production-light | Wholesale merge — 1423 files, +410k/-509k | `scripts/safe-merge.sh phase-3` blocks |
| 2 | Cherry-pick >50 files / >5000 lines in one bridge | Schema validation errors (too many relations to validate) | `scripts/bridge-to-production-light.sh` size guard |
| 3 | Skip `prisma generate` | Backend boots but all Prisma queries fail at runtime | CI build step enforces |
| 4 | Add `@relation` field on User/Invoice/JournalEntry to a model that doesn't exist in schema | 50+ "Type X is neither a built-in type" errors | Bridge script runs `npx prisma generate` BEFORE commit |
| 5 | Bridge `pg_advisory_xact_lock` (Driver-Adapter incompatible) | All POST/PATCH/DELETE with Idempotency-Key return 500 | Bridge script grep-guards against this |
| 6 | Cherry-pick `package.json` changes casually | Drift in npm dependencies → lockfile conflicts | Bridge script prompts for confirmation on root-level files |
| 7 | Skip jest/tsc validation before push | Push broken code | Bridge script runs both before commit |

---

## Concrete example

The canonical-bridge commit (`20fb4e1`) brought the entire `canonical-marketing/` module from phase-3 to production-light. It worked because:

- 13 files / +3990 lines (within size guard)
- 30 Prisma models added in `marketing.prisma` — but production DB already had all 22 `marketing_*` tables from the additive migration in `5cfaeb1 fix(r4): production-light → canonical additive migration`
- `marketing.module.ts` updated to register `CanonicalMarketingController` alongside the existing `MarketingPrototypeController`
- Route conflict avoided by ordering `@Get('tasks/kpi')` before `@Get('tasks/:id')`
- Source-level regression test (`void-query-regression.spec.ts`) asserts `pg_advisory_xact_lock` is never reintroduced
- Production-light's permissive RolesGuard (SUPER_ADMIN OR DIRECTOR bypass) preserved per `docs/qa-gate/2026-09-14-canonical-bridge-prod-light.md`

QA gate at `docs/qa-gate/2026-09-14-canonical-bridge-prod-light.md` documents the full result: **51/51 jest PASS, tsc clean, awaiting VPS rebuild**.

---

## Usage

```bash
# 1. Make sure you're on production-light with clean tree
git checkout production-light
git status  # confirm clean

# 2. Verify the commit you want to bridge exists locally
git log phase-3 --oneline | grep "your commit"

# 3. Dry-run bridge (validates but doesn't commit)
bash scripts/bridge-to-production-light.sh phase-3 <commit-ish>

# 4. If all guards pass, press Enter to commit + push
#    If any guard fails, cherry-pick aborts automatically

# 5. Notify VPS user to rebuild
echo "Main: git pull && docker compose -p production-light up -d --build backend frontend"
```

---

## Cross-references

- **Canonical-bridge QA gate**: `docs/qa-gate/2026-09-14-canonical-bridge-prod-light.md`
- **Production-light refactor rationale**: `PRODUCTION_LIGHT.md` (repo root)
- **Architecture diagram**: `ARCHITECTURE.md` (repo root)
- **Deploy runbook**: `RUNBOOK.md` (repo root)
- **CI guard**: `.github/workflows/ci.yml` job `bridge-size-guard`
- **Wholesale-merge block**: `scripts/safe-merge.sh`
