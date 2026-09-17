# P03 Independent Reverification R2 — Reproducible Build, Architecture Gates, and CI

**Date:** 2026-09-17  
**Scope:** P03 only  
**Verdict:** **FAIL**  
**Previous claimed state:** PASS  
**Registry correction:** P03 changed from `PASS` to `FAIL`

## Executive result

The implementation has materially improved: real backend/frontend typechecks, unit suites, and production builds pass. It is nevertheless not certifiable as P03 because required gates still admit false positives and the claimed reproducible/clean state has not been demonstrated. The internal P03 runner reports 21/21 PASS and its negative suite reports 32/32 PASS, but several normal-path checks validate the presence of configuration, artifacts, strings, or precomputed registry values rather than executing or deriving the claimed control.

## Independently executed evidence

| Check | Command / observation | Result |
|---|---|---|
| P03 internal runner | `node scripts/ssot/audit_p03_architecture_gates.js` | 21/21 PASS, exit 0 |
| P03 negative suite | `node scripts/ssot/test_p03_architecture_gates_negative.js` | 32/32 PASS, exit 0 |
| Backend typecheck | `npx tsc -p backend/tsconfig.build.json --noEmit` | PASS, exit 0 |
| Frontend typecheck | `npx tsc --project frontend/tsconfig.json --noEmit` | PASS, exit 0 |
| Backend lint | `npm --prefix backend run lint` | PASS, 0 errors/warnings |
| Frontend lint | `npm --prefix frontend run lint` | **8,218 warnings**, 0 errors, exit 0 |
| Backend unit | `npm --prefix backend run test:unit` | 23 suites; 259 passed, 1 skipped; exit 0 |
| Frontend unit | `npm --prefix frontend run test` | 53 passed/2 skipped files; 348 passed/7 skipped tests; exit 0 |
| Backend build | `npm --prefix backend run build` | PASS; 478 files compiled; exit 0 |
| Frontend build | `npm --prefix frontend run build` | PASS; 261 pages generated; exit 0 |
| Artifact verifier | `node scripts/ssot/verify_clean_checkout_build.js` | PASS, but only checks existing artifacts |
| Compose syntax | `docker compose config --quiet` | PASS |
| Docker engine/image build | `docker info` | NOT VERIFIED; daemon unavailable, exit 1 |
| Repository delivery state | `git cat-file -e HEAD:<P03 script>` | P03 runner, analyzer, negative suite, baseline, and clean-build verifier absent from HEAD |

## Blocking findings

### B1 — “Clean checkout build” is not a clean-checkout test

`scripts/ssot/verify_clean_checkout_build.js` and `checkCleanCheckoutBuild()` only inspect `backend/dist` and `frontend/.next` already present in the current working tree. They do not create an isolated checkout, perform clean dependency installation, build there, or prove that generated/untracked local state is unnecessary.

At audit time, 717 paths were staged and 213 tracked paths had unstaged changes. The P03 runner, analyzer, negative suite, architecture baseline, and artifact verifier were absent from commit `7a449e0af719c86ec0f57e362ed75d39b0af7ff0`. A checkout of the audited HEAD therefore cannot run P03 at all.

**Required remediation:** commit the intended scoped state, then have CI create/use the checkout supplied by `actions/checkout`, run strict lockfile installs, delete/avoid pre-existing build outputs, execute both builds, and validate newly produced artifacts. For local proof, create an isolated temporary worktree/archive from the exact commit and execute the same commands there.

### B2 — Dependency installation is not deterministic

Both CI jobs use `npm ci ... || npm install` (and equivalent backend/frontend fallbacks). A broken or stale lockfile can therefore be silently bypassed and rewritten/resolved by `npm install`.

**Required remediation:** use only `npm ci --ignore-scripts=false --no-audit` (or the explicitly approved equivalent) for each package root; fail immediately if a lockfile is absent or inconsistent. Cache may accelerate installation but must not change resolution semantics.

### B3 — Required migration gate is absent from CI

P03 requires CI to enforce SSOT, build, static, unit, **migration**, security, and scoped E2E gates. The current workflow contains no Prisma validation/migration command; the only `schema` occurrence is inside `DATABASE_URL`.

`checkCiRequiredChecks()` does not test for typecheck, lint, unit, migration, security, scoped E2E, strict install, or actual command success. It passes based on seven string-presence checks.

**Required remediation:** add a disposable PostgreSQL service and blocking migration validation appropriate to P03/P04 boundaries (at minimum schema validate/generate plus an empty-database migration rehearsal), and rewrite `checkCiRequiredChecks()` to parse/assert every required job and command. Add a negative mutation that removes each required CI category one at a time.

### B4 — Lint evidence is factually incorrect and warning debt is non-blocking

The phase evidence claims frontend lint has zero warnings. Independent execution produced 8,218 warnings while returning exit 0. The internal `checkLint()` only verifies that ESLint configuration files contain selected text; it never runs ESLint.

**Required remediation:** make the agreed P03 warning policy explicit. If P03 requires zero warning, run ESLint with `--max-warnings 0` and remediate all warnings. If legacy warnings are temporarily allowed, persist a measured baseline, block any increase and all warnings on changed files, and correct the evidence. In all cases, the normal P03 check must execute the real lint commands and preserve their exit/output summary.

### B5 — Container build is a text-pattern check, not a build

`checkContainerBuild()` only searches Dockerfiles/Compose for `FROM node:`, `WORKDIR`, `npm run build`, port strings, and service names. It cannot detect an invalid Docker instruction, missing copied file, failed dependency install, or non-starting image. Docker was unavailable locally and no immutable CI-run evidence for this uncommitted state exists.

**Required remediation:** in CI build backend and frontend images from the exact commit, start them with disposable dependencies, run health/readiness smoke tests, and retain run URL/SHA/digests. The negative suite must mutate a real Docker build context and prove `docker build` fails.

### B6 — Architecture gates do not cover their claimed scope

- `changed_complexity_check` defaults to only two hard-coded files when no list is passed. It does not derive changed TypeScript files from the merge base/index, uses the absolute threshold 15 for failure, and does not enforce the standard threshold 10 plus approved 11–15 exceptions.
- `duplicate_code_scan` detects duplicate HTTP routes/double prefixes only; it is not a duplicate-code regression detector.
- `orphan_object_scan` trusts `metrics.unexplained_objects` from the lifecycle registry instead of deriving reachability from the current source.
- `unused_export_dependency_scan` trusts stored `reachable` classifications and does not prove imports/reachability in the current source.

**Required remediation:** derive changed files from the CI merge base, run AST complexity on every changed function, require governed exceptions for 11–15, and fail above 15. Add a real clone/duplication detector with a committed downward baseline. Recompute orphan/dependency reachability from source and compare the generated result to the committed registry; fail on drift. Add disk/source mutation tests for every normal path.

### B7 — DNA gates trust a stale inventory and grant whole-file exemptions

Import, native-interactive, and hardcoded-visual checks read `dna_screen_inventory` instead of rescanning current TSX source. Exceptions are reduced to a set of file paths; `scope`, `test`, and the exact violation are ignored. Consequently, any new same-rule violation in an excepted file is automatically waived. The primitive-duplication check only recognizes four literal names (`CustomButton`, `CustomDialog`, `CustomTable`, `CustomBadge`).

**Required remediation:** scan every current application TS/TSX screen directly, reconcile the generated inventory against the committed manifest, and match exceptions by rule + file + narrow source scope/fingerprint. A new violation outside the approved scope must fail even in an excepted file. Detect semantic/local primitive duplication beyond four names. Add mutation tests against real source files, including a second violation in an already-excepted file.

### B8 — Architecture debt baseline does not ratchet

`_ARCHITECTURE_DEBT_BASELINE.json` is not read by the analyzer. Exception validation uses a hard-coded default of 205 and permits equality forever. Complexity and duplication baseline fields are likewise not enforced, so the baseline is informational.

**Required remediation:** load a versioned baseline tied to the comparison commit, calculate current values, fail any increase, and require the baseline to be lowered automatically/explicitly when debt decreases. Prevent a PR from editing the baseline upward without an approved decision record and dedicated authorization check.

### B9 — Negative suite proves injected branches, not all production controls

Most negative scenarios call analyzer override hooks such as `syntheticViolations`, `syntheticGraph`, or synthetic registry files. They prove those explicit branches return FAIL, but not that production source/CI changes are detected. The successful 32/32 result therefore cannot close B1–B8.

**Required remediation:** retain fast unit-level injections, but add black-box adversarial tests that copy a minimal repository fixture, mutate actual TS/TSX, package, CI, Docker, lockfile, and exception-scope files on disk, then invoke the same CLI used in CI and assert a non-zero exit.

## Gate disposition

| Required P03 gate | Disposition |
|---|---|
| Clean install and production build | **FAIL** — current-tree builds pass; clean checkout/install not proven |
| Typecheck and lint | **FAIL** — typecheck passes; lint evidence/control is not truthful or blocking for 8,218 warnings |
| CI enforces all required categories | **FAIL** — migration absent; CI checker incomplete |
| CI blocks architecture regressions | **FAIL** — complexity, duplication, orphan, and dependency controls incomplete |
| CI blocks every DNA violation | **FAIL** — snapshot-based scans and whole-file exception bypass |
| Architecture debt ratchets downward | **FAIL** — baseline file unenforced; hard-coded ceiling |
| Deterministic test memory/workers | **PASS** for the inspected scripts/configuration |

P03 requires all gates without waiver; therefore the phase remains **FAIL**. P04 and later phases must not treat P03 as certified until remediation is committed and a new independent reverification passes from the exact commit delivered to CI.

## Reverification acceptance checklist

1. Exact candidate commit is identified and working tree is clean for certification.
2. Strict `npm ci` succeeds at root/backend/frontend in an isolated checkout.
3. Typecheck, lint policy, unit suites, and backend/frontend builds execute there and pass.
4. Backend/frontend Docker images build, start, and pass health smoke tests.
5. CI includes and adversarially proves every P03 required category, including migration.
6. Complexity, duplication, orphan, dependency, and DNA checks derive from current source/merge-base changes.
7. Exception scope/fingerprint and all debt baselines are enforced with non-increasing ratchets.
8. Black-box on-disk mutations cause the production P03 CLI and CI-equivalent command to exit non-zero.
9. Evidence is regenerated from captured command outputs and contains no zero-warning/clean-checkout claims unsupported by execution.
