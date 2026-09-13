# QA Gate — Marketing Finalization (2026-09-13)

**Status**: PASS (with documented gaps)
**Feature**: Management Task + Social Media Brands production-readiness closure
**Scope**: BrandWorkspace brands/members wiring, mgmt-task /overview canonical hooks, TaskStatus unification, AI copy clarification, frontend build unblock
**Branch**: `phase-3`
**Date**: 2026-09-13

---

## Checks

- [x] **Code complete** — atomic commits landed on `phase-3`:
  - `b106869` fix(frontend): Toaster richColors
  - `1444476` fix(frontend): DnaProgress indicatorClassName
  - `450f895` fix(frontend): Select required prop in samples/intake
  - `0498a67` fix(frontend): OmniCrmClient currentUser hoisting
  - `a64e212` fix(frontend): Lucide icons as JSX in system/settings
  - `f8459d4` refactor(frontend): BrandWorkspace reads brands/members from canonical API
  - `2362af9` refactor(frontend): mgmt-task /overview reads tasks via canonical hooks
  - `06209d9` refactor(frontend): unify TaskStatus to canonical IN_REVIEW
  - `a127c46` docs(marketing): clarify AI copy generation is live Gemini
  - `9e6a1a4` docs(e2e): record deferred live execution status

- [x] **Type-check clean**:
  - `cd frontend && npx tsc --noEmit` → **exit 0** (after B0 TS blocker fixes; previously 8 errors)

- [x] **Unit tests pass**:
  - `cd frontend && npx vitest run src/hooks/useCanonicalMarketing.test.ts` → **5/5 PASS**

- [ ] **E2E Playwright test suites** — **DEFERRED** (see `evidence/2026-09-13/e2e-management-task/STATUS.md`):
  - Specs present and lint-clean: `ac-task-suite.spec.ts` (AC-TASK-001..013), `roles-and-error-matrix.spec.ts`
  - Live execution requires docker + postgres + backend + frontend + browser; deferred to deploy phase
  - Earlier audit (Phase 4 verifier sub-item 6, 2026-09-11) already noted this gap; this phase did not close it

- [x] **No regressions**:
  - BrandWorkspace brands + members now source from `/v1/marketing/brands` and `/v1/marketing/members`
  - mgmt-task /overview (`TaskWorkspaceV2`) reads via `useMarketingTasks` + `useMarketingMembers` + `useTaskStatusMutation`
  - HttpMarketingService remains broken (no auth, wrong path) — refactor sidesteps it; consumers switched to canonical `api` hooks
  - MockMarketingService still active by default (NEXT_PUBLIC_MARKETING_API_MODE=mock); flag noted for future deprecation

---

## Gate Report — 2026-09-13 — Marketing Finalization

| Change / Subsystem | Reproduction Test / Evidence | Status | Keterangan & Bukti |
|---|---|---|---|
| **Frontend production build green** | `npx tsc --noEmit` exit 0 | **PASS** | 8 prior TS errors across 5 files fixed (Toaster richColors, DnaProgress indicatorClassName, Select required, OmniCrm currentUser hoisting, Lucide icon as JSX) |
| **BrandWorkspace brands/members real API** | `useMarketingBrands` + `useMarketingMembers` replace `INITIAL_BRANDS`/`INITIAL_MEMBERS` | **PASS** | Adapter maps lean hook shape ({fullName}, {code, accentToken}) to local Member/Brand types. Brand-add modal no-op pending `useCreateBrand` hook. Posts/reports still on local mock (canonical BrandReportKPIs doesn't cover local tiktokReport/leadFunnels substructures — gap documented) |
| **toribio + dreamlab wiring** | Routed via `BrandWorkspace` with `initialBrandSlug` prop | **PASS (implicit)** | M1.1 commits wire both routes — no separate commit needed |
| **mgmt-task /overview canonical hooks** | `useMarketingTasks` + `useMarketingMembers` + `useTaskStatusMutation` | **PASS** | Replaces `marketingService.listTasks/listMembers/updateTaskStatus` in TaskWorkspaceV2. Idempotency-Key + version handled by hooks. Sub-modals (CreateTaskModal, TaskDetailModal, MemberProfileView) still on marketingService (mock) — deferred |
| **TaskStatus drift unified** | `"REVIEW"` → `"IN_REVIEW"` across 4 files | **PASS** | 19 string literals + 3 ALLOWED_TRANSITIONS keys aligned to canonical hook enum matching backend |
| **AI copy generation clarification** | `social-planner.service.ts:generateAiCopy` review | **PASS (doc)** | Confirmed LIVE Gemini 2.5 Flash via `GEMINI_API_KEY`. Earlier "stub" notes were wrong. Roadmap updated to require GEMINI_API_KEY in Phase 6 deploy |
| **E2E live execution** | Playwright specs | **DEFERRED** | See `evidence/2026-09-13/e2e-management-task/STATUS.md` |

---

## Status Kelulusan

✅ **READY FOR DEPLOY PHASE (with documented gaps)**.

Kriteria fungsional (code complete, typecheck, unit tests, no regressions) terpenuhi. Kriteria E2E live execution documented sebagai deferred — masuk Phase 6 deploy checklist.

**Remaining gaps to track**:
1. BrandWorkspace posts + reports still on local mock — needs backend `BrandReportKPIs`-compatible endpoint + post/channel adapter
2. mgmt-task sub-modals (CreateTaskModal, TaskDetailModal, MemberProfileView) still use marketingService — could refactor to canonical hooks in future phase
3. MockMarketingService still default — should be deprecated + HttpMarketingService rewritten (auth, /api path) when sub-modals converted
4. E2E live execution deferred to deploy phase (infrastructure-heavy)