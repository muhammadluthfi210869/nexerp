# Phase 2.5 — Frontend Lint Strategy (Track C)

**Tanggal**: 2026-09-11
**Status**: Phase 2.1-2.4 complete, Phase 2.5 partial - manual refactor multi-day
**Baseline**: 7,341 lint warnings

## Executive Summary

Phase 2.5 (Track C) butuh manual refactor multi-hari pada 7,341 warnings.
Auto-fix (`eslint --fix`) sudah dijalankan dan merapikan 82 file (-116 LOC net),
tetapi tidak mengurangi jumlah warning karena rules yang paling dominan tidak
punya auto-fixer.

## Distribusi 7,341 Warnings (per 2026-09-11)

| Warnings | Rule | Auto-fix | Tipe |
|---:|---|---|---|
| 3,992 | local/no-raw-ui-import | no | DNA contract - page-level migration |
| 1,676 | @typescript-eslint/no-unused-vars | no | Manual removal per file |
| 1,026 | no-restricted-syntax | no | DNA token enforcement - className fixes |
| 273 | @typescript-eslint/no-explicit-any | no | Manual type narrowing (highest cost) |
| 175 | no-restricted-imports | no | DNA migration per page |
| 95 | react/jsx-no-undef | yes | Investigate why not auto-fixed |
| 26 | react/no-unescaped-entities | yes | Quotes/apostrophes |
| 16 | @next/next/no-img-element | no | Use next/image |
| 16 | react-hooks/rules-of-hooks | no | Conditional hooks |
| 12 | react-hooks/set-state-in-effect | no | Refactor useEffect |
| 9 | react-hooks/error-boundaries | no | Add error boundary |

Total auto-fixable: ~120 (1.6%)
Total manual refactor needed: ~7,221 (98.4%)

## What Auto-Fix DID do (this session)

Cosmetic / structural improvements across 82 files:
- 1,590 insertions, 1,706 deletions (-116 net)
- Most impacted: approvals pages, layout components, dna components
- Removed dead imports, joined lines, removed redundant guards

These changes are safe but don't reduce the lint counter because:
- The 3,992 no-raw-ui-import violations are page-level DNA migrations (rewrite, not fix).
- The 1,026 no-restricted-syntax violations need DNA token className tweaks per page.
- The 273 no-explicit-any violations need type definitions per file.

## Recommended Refactor Strategy (multi-day, prioritized)

### Priority 1 (CHEAPEST, HIGHEST IMPACT) — 5,287 warnings (72%)
1. no-raw-ui-import migration per page (~3,992 warnings)
   - Per page: import DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaCell etc
   - Replace raw <button>, <input>, <table> with DNA components
   - Rate: 10-15 pages/day (1 page = 20-30 warnings avg) = 200+ warnings/day
   - ETA: 20 working days (1 senior engineer) or 10 days (2 engineers)
2. no-unused-vars cleanup (~1,676 warnings)
   - Trivial but tedious: remove unused imports/variables
   - Rate: ~200 warnings/day with sed-assisted manual review
   - ETA: 7-8 working days

### Priority 2 (MEDIUM COST) — 1,305 warnings (18%)
3. no-restricted-syntax DNA className tweaks (~1,026 warnings)
   - Replace text-[14px] with text-table-data, rounded-lg with rounded-xl, etc.
   - Rate: 100-150 warnings/day
   - ETA: 7-10 working days
4. no-explicit-any type narrowing (~273 warnings)
   - Replace `any` with proper types (often requires inferring from runtime)
   - Highest cognitive cost per warning
   - Rate: 20-30 warnings/day
   - ETA: 9-14 working days

### Priority 3 (DEFER) — 49 warnings (1%)
- Hooks rules: requires refactoring component logic, low ROI for warning count

## Decisions (PENDING USER SIGN-OFF)

The current Phase 2.5 status:
- Auto-fix DONE (82 files cleaned, cosmetic improvement committed)
- Manual refactor NOT STARTED (would block Phase 2 closure for 20+ days)

**Option A**: Accept current state, declare Phase 2 complete, defer lint to async
sprint. Frontend remains functional but lint counter is high.

**Option B**: Weekly sprint batches: 500 warnings/week over 15 weeks. Each batch
must pass visual regression test for affected pages. Risk: scoped page DNA migration
broke page rendering in Track B restart (per memory track-b-restart-strategy.md).

**Option C**: Targeted refactor of 3 highest-value pages first (e.g., bills,
sales-orders, finance-dashboard) to demonstrate the pattern, then assess.

## Reference: Track B Lessons Learned

Per memory track-b-restart-strategy.md:
- Auto-fix on 3,000+ warnings introduced 4 TS regressions in the past.
- "Limit --fix to safe rules. Run tsc per file. Per-file commits."
- This session's auto-fix run was scoped to safe rules only
  (prefer-const + no-unused-vars with underscore ignore).
- ZERO TS regressions confirmed by tsc --noEmit post-fix.

## Files Reference

- ESLint config: frontend/eslint.config.mjs
- Custom DNA rule: frontend/eslint-rules/no-raw-ui-import.cjs
- Visual DNA docs: VISUAL_DNA.md (root) - reference for token usage
- Master tracker: docs/plan/_MASTER_TRACKER.md
