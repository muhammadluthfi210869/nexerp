# P19 Frozen Acceptance Contract

**Phase:** P19 — Strict UI DNA Migration, Golden Reference Page Layouts, Shell Compliance, and Build Parity  
**Contract version:** `P19-v1`, frozen 2026-09-24  
**Final verification command:** `npm run verify:p19`  
**Success:** natural exit `0`; boundary AST scan, layout shell audit, frontend typecheck, Vitest behavior suite, and Next.js production standalone build pass cleanly  

## Purpose and finish line

P19 is complete when the entire frontend architecture enforces the Binary Audit Vision v7.0 and Canonical DNA Design System:
1. Zero direct imports from `@/components/ui/*` across the entire codebase (enforced via AST boundary scan);
2. All dashboard routes wrap tabular data inside standard DNA cards (zero naked/detached tables);
3. Full TypeScript type safety (`tsc --noEmit` exit 0 with 0 errors);
4. Complete UI component parity and behavior tests passing;
5. Next.js standalone production build completes with 0 errors and generates valid production artifacts.

## Frozen scope

In scope:
- Full elimination of `@/components/ui/` imports in favor of canonical `@/components/dna`;
- Dual-DNA component barrel integrity (`frontend/src/components/dna/index.ts`) providing layout, headers, KPI grids, tables, toolbars, cells, and feedback states;
- Golden reference page layouts audited across all 275+ operational routes under `src/app/(dashboard)`;
- Layout shell compliance script `scripts/ssot/check_page_shell_layout.js` passing with 0 violations;
- Component behavior test suite `src/app/(dashboard)/visual-dna/__tests__/p19-dna-system.behavior.test.tsx` (11/11 tests pass);
- Next.js legacy route redirects (`/dna-v3`, `/dna-showcase`, `/dna-v3-components`, `/dual-dna-test` → `/visual-dna*`);
- Next.js production build (`npm --prefix frontend run build`) succeeding with exit code 0.

Out of scope:
- Backend business logic changes;
- Database schema changes;
- Adding unrequested UI features or altering existing business APIs.

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P19-01` | **AST Import Boundary Enforcement:** `node scripts/ssot/p19_dna_verify.js` proves 0 direct imports from `@/components/ui/` across all source files. |
| `AC-P19-02` | **Layout Shell Compliance:** `node scripts/ssot/check_page_shell_layout.js` audits all operational routes and finds 0 naked/detached tables. |
| `AC-P19-03` | **Frontend Static Type Safety:** `npx tsc --noEmit -p frontend/tsconfig.json` exits `0` with exactly 0 type errors. |
| `AC-P19-04` | **DNA System Behavior Tests:** `npm --prefix frontend run test:p19` passes all 11 unit/behavior tests. |
| `AC-P19-05` | **Production Build Parity:** `npm --prefix frontend run build` completes cleanly, generating valid route chunks and standalone deployment bundle. |
| `AC-P19-06` | **Thin Final Verification:** Unified command `npm run verify:p19` executes all steps in sequence and terminates with exit code `0`. |
