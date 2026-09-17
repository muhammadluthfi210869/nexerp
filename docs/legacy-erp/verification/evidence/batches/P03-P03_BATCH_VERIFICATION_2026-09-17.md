# P03 Independent Batch Verification

**Verification date:** 2026-09-17  
**Parsed request:** verify Phase 3 → `P03-P03`  
**Verdict:** **FAIL**  
**Certified through:** P02  
**First failed gate:** clean-checkout/CI reproducibility and required-check enforcement

## Baseline and predecessor

- Branch: `main`
- Baseline commit: `7a449e0af719c86ec0f57e362ed75d39b0af7ff0`
- Working tree: dirty, 366 entries at preflight; unrelated changes were preserved.
- P02 predecessor: `PASS` and independently certified in R6.
- The implementor-set P03 `PASS` status is reverted to `FAIL` by this verification.

## What independently passed

| Check | Exit | Result |
|---|---:|---|
| `node scripts/ssot/audit_p03_architecture_gates.js` | 0 | Claimed 21/21 PASS |
| `node scripts/ssot/test_p03_architecture_gates_negative.js` | 0 | 32/32 synthetic scenarios PASS |
| Backend `tsc -p tsconfig.build.json --noEmit` | 0 | Zero diagnostics |
| Frontend `tsc --project tsconfig.json --noEmit` | 0 | Zero diagnostics |
| Backend ESLint | 0 | Zero errors |
| Frontend ESLint | 0 | Zero errors, but 8,218 warnings |
| Backend unit suite | 0 | 23/23 suites; 259 passed, 1 skipped |
| Frontend unit suite | 0 | 53 passed, 2 skipped; 348 tests passed, 7 skipped |
| Backend production build | 0 | 478 files compiled |
| Frontend production build | 0 | 261 routes generated |
| `docker compose config -q` | 0 | Compose syntax resolved |

Frontend production build emitted non-blocking warnings for multiple lockfiles/workspace-root inference and deprecated middleware convention.

## Blocking findings

### Critical — CI cannot run on a clean hosted runner

`.github/workflows/ci.yml` invokes SSOT/P02/P03 Node scripts immediately after `actions/setup-node`. It contains zero `npm ci` or `npm install` steps. The scripts require packages by explicit paths such as:

- `backend/node_modules/js-yaml`;
- `backend/node_modules/typescript`.

A fresh GitHub-hosted runner does not contain these directories. Both `fast-gate` and `push-images` therefore fail before the claimed checks can execute.

### Critical — required CI checks are absent

The workflow contains none of the required commands for:

- backend/frontend package installation;
- backend/frontend production builds;
- backend/frontend typecheck;
- backend/frontend lint;
- backend/frontend unit suites;
- migration validation/rehearsal;
- scoped application E2E.

`scripts/__tests__/run-all.sh` is not a substitute. It runs nine deployment/document/contract shell checks and does not run TypeScript compilation, ESLint, Jest, Vitest, Prisma migrations, or application E2E.

### Critical — “clean checkout build” is a stale-artifact check

`checkCleanCheckoutBuild()` only checks existing `backend/dist` and `frontend/.next` files/counts. It does not:

- create a clean checkout/worktree;
- run `npm ci` from lockfiles;
- run either production build;
- prove artifacts correspond to current sources.

The core P03 analyzer/audit/evidence files are currently untracked, so a checkout of the recorded baseline commit does not contain them. A reproducible clean-checkout certification is therefore not established.

### High — five executable gates are presence checks

The normal P03 audit does not execute:

- TypeScript for `typecheck` (it only parses tsconfig files);
- ESLint for `lint` (it only checks configuration text);
- Jest/Vitest for `unit_smoke` (it only counts test files and checks script text);
- Docker builds for `container_build` (it searches Dockerfile/Compose strings);
- clean builds for `clean_checkout_build` (it checks existing output directories).

The synthetic negative suite exercises override branches and missing paths, not failure of the real external commands. Actual commands passed in this working tree, but CI and the declared audit do not enforce them.

### High — strict DNA violations are warnings, not blockers

Actual frontend ESLint completed with **8,218 warnings**, including raw interactive controls/tables, restricted/deep DNA imports, hardcoded styling, and related operational UI rules. The relevant ESLint rules are configured as `warn`, and the normal `frontend` lint command has no blocking `--max-warnings 0`.

The P03 DNA checks read values from the generated lifecycle registry instead of rescanning the current source. CI does not regenerate the registry before P03. A source violation introduced after registry generation can therefore remain invisible. Exception handling is file-level per rule during scans and does not enforce the declared exception `scope` against the actual violating node/line.

This does not require all legacy DNA debt to be removed in P03, but every unexcepted/new violation and exception scope must be blocking as required by the gate.

### High — architecture ratchets are not real ratchets

- DNA exception baseline is a hardcoded `205`. If debt decreases and later returns up to 205, the gate still passes; no prior/base-branch snapshot ratchets the value downward.
- `changed_complexity_check` examines two hardcoded files while the working tree contains 216 changed source files.
- It declares `maxComplexity = 10` but only fails above `absoluteMax = 15`; values 11–15 require rationale under the standard, yet no rationale/exception is checked.

### High — architecture and duplication checks are materially incomplete

- `module_boundary_test` only prohibits controllers importing other controllers.
- `dependency_direction_test` only prohibits services importing controllers and common files importing domain modules.
- It does not enforce the full domain ownership/dependency policy, forbidden cross-domain persistence access, shared-kernel policy, or a base-branch architecture debt delta.
- `duplicate_code_scan` is a route-collision scanner; it performs no duplicate-code measurement despite the required test name and thresholds.

### Not verified — real container builds

Docker Compose syntax resolves, but the Docker daemon is unavailable in this environment. Backend/frontend image builds were not independently executed. The P03 audit's text search cannot replace a real container build result.

## Evidence discrepancies

The implementor evidence says all 21 gates are “real” and CI enforces build/static/unit/migration/security/scoped E2E. Repository inspection contradicts this:

- normal gates 1–5 do not execute the named tools;
- CI has no dependency-install, build, typecheck, lint, unit, migration, or scoped E2E commands;
- the evidence reports zero-error lint while omitting 8,218 frontend warnings, many from the policies the gate claims to block;
- `changed_complexity_check` reports two selected files, not the actual changed scope.

## Required remediation and retest scope

1. Make CI install dependencies deterministically with lockfiles before Node-based gates.
2. Add blocking backend/frontend build, typecheck, lint, unit, migration, security, and scoped E2E steps to the appropriate PR/main jobs.
3. Replace artifact/config presence checks with subprocess execution whose command, exit code, and output are captured.
4. Implement a clean worktree/checkout install-and-build verifier or use a dedicated clean CI job.
5. Run actual Docker image builds and Compose configuration validation.
6. Make DNA checks scan current source directly and enforce exact scoped exceptions; block new/unexcepted violations.
7. Implement a persisted/base-branch downward ratchet for DNA/architecture debt.
8. Determine changed files from Git rather than two hardcoded paths; enforce complexity >10 rationale and >15 failure.
9. Implement full module/dependency policy checks and a real duplicate-code scan with the documented thresholds.
10. Add adversarial tests that mutate actual temporary source/config/CI fixtures and prove the normal execution paths fail, not only `syntheticViolations` options.
11. Commit/track all P03 gate scripts needed by a clean checkout before requesting certification.
12. Rerun `verifikasi fase 3` after remediation.

## Phase and boundary result

| Phase | Verdict | Registry status |
|---|---|---|
| P03 | **FAIL** | **FAIL** |

P02 remains certified. P04 may be diagnostically developed, but it cannot be sequentially certified while P03 is failed.

