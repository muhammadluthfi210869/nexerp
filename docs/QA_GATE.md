# QA Gate — Mandatory Checklist (per CLAUDE.md)

**Status:** **BELUM SIAP KIRIM** until every item below is checked + signed off.

This gate must be run for EVERY change, no matter how small (including badge /
status changes). It applies to backend, frontend, infra, and docs.

---

## Aturan Inti (Hard Rules)

1. **No "selesai" / "siap dikirim"** without this gate executed in full and the
   gate report (this file, "## Gate Report" section at the bottom) written.
2. **Bug → reproduction test FIRST**: write a test that FAILS on the buggy state
   → THEN apply the fix → then the entire suite is green. No test = no fix claim.
3. **One logical change per commit** with a clear `type(scope): subject` subject.
4. **No silent scope expansion**. If you fix a redirect, you don't also rename
   the sidebar. Defer unrelated improvements.

---

## Pre-Merge Checklist (run BEFORE claiming a feature "done")

### A. Code correctness
- [ ] Reproduction test added **first** for any bug fix (fails before fix, passes after)
- [ ] All new endpoints / functions have at least one positive + one negative case
- [ ] TypeScript strict mode: no `any` escape hatches except at well-marked trust
      boundaries (HMAC validators, third-party SDKs). `@typescript-eslint/no-explicit-any`
      warnings tagged with `ponytail:` ceiling comment allowed.
- [ ] Schema changes have a migration (`prisma migrate dev --name <scope>`),
      not a manual `ALTER TABLE`.
- [ ] No N+1 queries introduced (grep `await prisma.*\.findMany` inside loops).

### B. Frontend
- [ ] All new pages/components visually match `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`
      + `frontend/VISUAL_DNA.md`. No one-off styling.
- [ ] Sidebar changes go through `docs/design/LAYOUT_GOVERNANCE.md` PR review
      (frozen sidebar rule).
- [ ] No `localStorage` for domain state (RBAC, lead data, KPI). `localStorage`
      is allowed ONLY for ephemeral UI prefs (sidebar collapsed, theme).
- [ ] E2E test for any user-visible redirect (use `tests/e2e/<scope>-redirect.spec.ts`
      pattern).

### C. Backend
- [ ] New endpoints behind `RolesGuard` or the scoped guard for the module.
      `MARKETING_DEV_AUTH_BYPASS=false` enforced in production env.
- [ ] Idempotency keys on POST/PUT/PATCH that mutate state (canonical module
      pattern — keep using `@Idempotent()` decorator).
- [ ] Optimistic concurrency: PATCH that updates a versioned record requires
      `If-Match: <version>` header → `VERSION_CONFLICT` on stale.
- [ ] Secrets write-only (AES-256-GCM). Never returned in GET responses.
- [ ] Audit trail entry on every write that changes business state.

### D. Tests
- [ ] Backend unit tests green: `cd backend && npm test -- --testPathPattern=<scope>/`
      (use `--max-old-space-size=8192` if Jest heap OOMs; default `npm test` excludes e2e).
- [ ] Backend e2e (only on demand): `cd backend && npm run test:e2e`
- [ ] Frontend unit: `cd frontend && npm run test:unit` (or `vitest`)
- [ ] Frontend E2E: `cd frontend && npx playwright test tests/e2e/<scope>/`
      against a running dev server (`npm run dev`). Headless in CI.
- [ ] **Regression suite**: every previously-fixed bug has a test in
      `tests/e2e/regressions/` that still passes.

### E. Deployment
- [ ] Build artifacts clean: no stale `.next/`, `dist/`, `coverage/` from previous runs
- [ ] Docker compose port consistency verified (`docker-compose.yml` and
      `docker-compose.prod.yml` agree on 3000/3001)
- [ ] Migration ledger clean: `npx prisma migrate status` → 0 pending, 0 checksum mismatch
- [ ] Branch policy: feature branches merge to `production-light` (VPS deploy
      target). Phase-3 is now archived; new work goes to fresh branches.

### F. Documentation
- [ ] New module: `docs/<area>/PHASE-0-*.md` + contract JSON exists
- [ ] Visual DNA / LAYOUT_GOVERNANCE.md updated if sidebar/layout changed
- [ ] CHANGELOG or commit message references Phase + Workstream

---

## Gate Report

> Each work item below must have a **TANGGAL + HASIL + EVIDENSI** before the
> change can be claimed shipped. Example: `2026-09-11 | PASS | playwright
> tests/e2e/management-task-redirect-bug.spec.ts (3/3 green)`.

| Date | Change | Reproduction test | Suite status | Evidence |
|------|--------|-------------------|--------------|----------|
| _pending_ | _next change_ | _path to spec_ | _green/red_ | _commit hash + log line_ |

---

## Quick Verification Commands

```powershell
# Backend (Jest unit only — e2e excluded by default per memory)
cd backend && npm test -- --testPathPattern=<scope>/

# Frontend (Vitest unit)
cd frontend && npx vitest run

# Frontend (Playwright E2E — requires dev server up on :3003)
cd frontend && npx playwright test tests/e2e/<scope>/ --reporter=list

# Migration status
cd backend && npx prisma migrate status

# Build sanity (production)
cd backend && npm run build
cd frontend && npm run build
```

---

## Exceptions (add only with explicit user approval)

- Skipping the reproduction-test rule: only allowed for trivial changes
  (typo, single-line import path). Anything that fixes user-visible
  behavior **must** have a test.
- Skipping the E2E suite for marketing pages: allowed only when the change
  is docs/visual-only and the production-light version has its own E2E
  coverage that still passes.

If any item above is unchecked, the change is **BELUM SIAP KIRIM**.
