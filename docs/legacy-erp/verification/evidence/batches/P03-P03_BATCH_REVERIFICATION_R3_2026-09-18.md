# P03 Independent Reverification R3 — One-Pass Remediation Blueprint

## Certification result

- Batch: `P03-P03`
- Candidate commit audited: `ff47ed36ec08dd4da56619d824b349ff3a53d0ed`
- Independent verdict: **FAIL**
- Certified through: `P02`
- First failed gate: **P03 / clean install and production build**
- Downstream effect: P04 may be inspected, but it is not certifiable until P03 passes.

The implementor suite reports 21/21 tests and 36/36 negative scenarios as PASS. Independent execution proves that result is a false positive: the root clean install fails, the isolated clean build fails, backend unit tests fail in clean state, and the container gate returns PASS without a working Docker daemon.

## Independently reproduced results

| Check | Result | Evidence |
|---|---:|---|
| P03 implementor negative suite | 36/36 PASS | The suite does not cover the bypasses listed below. |
| P03 implementor full audit | 21/21 reported PASS | Several gates only inspect files/artifacts or count test files. |
| Root `npm ci --ignore-scripts=false --no-audit` | **FAIL** | `ERESOLVE`: TypeScript `6.0.3` conflicts with `openapi-typescript@7.13.0` peer `^5.x`. |
| Root `npm ci --legacy-peer-deps ...` | **FAIL** | Root `package.json` and lockfile are not synchronized; `@types/js-yaml@4.0.9` is missing from the lockfile. |
| Backend `npm ci ...` | PASS | 1,242 packages installed. |
| Frontend `npm ci ...` | PASS | 994 packages installed. |
| `verify_clean_checkout_build.js --isolated` | **FAIL** | Frontend build aborts because the temporary checkout's `node_modules` junction points outside the Turbopack filesystem root. |
| Safety of isolated verifier | **FAIL / P0** | Removing the temporary worktree emptied the source checkout's root/backend/frontend `node_modules` directories. Dependencies had to be reinstalled. Never share dependency directories with a disposable worktree. |
| Backend unit suite after clean install | **FAIL** | 22 failed suites, 1 passed; Prisma client was not generated (`Cannot find module '.prisma/client/default'`). |
| Frontend unit suite after clean install | PASS | 53 files passed, 2 skipped; 348 tests passed, 7 skipped. |
| SSOT validation | PASS | 19/19 gates. |
| P02 lifecycle audit | PASS | 14/14 tests. |
| Docker daemon | **NOT AVAILABLE** | `docker info` cannot connect to `dockerDesktopLinuxEngine`. |
| P03 `container_build` analyzer | Incorrectly reports PASS | It checks strings and never fails on the Docker subprocess status. |
| Delivery scope | **FAIL reviewability/change-impact** | Candidate changes 931 paths versus `7a449e0a`, including 206 TS/TSX paths and 23 deletions across unrelated business domains. |

## Root-cause ledger and exact repair method

### R3-B1 — Clean install is not reproducible

**Root causes**

1. Root dependency versions violate peer constraints: TypeScript 6 versus `openapi-typescript` requiring TypeScript 5.
2. Root `package.json` and `package-lock.json` are out of sync (`@types/js-yaml` missing).
3. The CI's first root `npm ci` therefore cannot reach later gates.

**Repair method**

1. Choose a single supported TypeScript line for all three packages. The lowest-risk repair is to pin root TypeScript to the same supported 5.x line used by the OpenAPI tool, unless the OpenAPI package is deliberately upgraded to a version whose declared peer range includes the selected TypeScript version.
2. Regenerate only the affected lockfile using the project's declared npm/Node version; do not add `--force`, `--legacy-peer-deps`, or an `npm install` fallback to CI.
3. Run plain `npm ci --ignore-scripts=false --no-audit` independently in root, backend, and frontend after deleting their dependency directories in an isolated disposable copy.
4. Add a negative test that mutates a package/lock mismatch and proves the clean-install gate fails before build.

**Acceptance**: all three plain `npm ci` commands exit 0 with no fallback or peer override.

### R3-B2 — The clean-checkout verifier is unsafe and does not verify clean dependency installation

**Root causes**

- `scripts/ssot/verify_clean_checkout_build.js` links the disposable checkout to the source checkout's dependency directories.
- The verifier builds with shared dependencies, so it cannot prove lockfile reproducibility.
- Cleanup of the worktree can remove contents reachable through those junctions.
- When `CI` is set, the script silently switches to `--artifacts-only`; CI therefore validates artifacts created in the current checkout, not an independent clean checkout.
- `checkCleanCheckoutBuild()` in `p03_analyzers.js` only checks whether existing `dist/.next` files and minimum counts exist.

**Replacement design**

1. Create a disposable directory under the OS temp directory and place a unique marker file inside it.
2. Materialize exactly the candidate commit with `git archive <sha>` or a detached clone. Do not use junctions/symlinks/hard links to `node_modules`, build outputs, or source checkout paths.
3. Verify the resolved cleanup target is a child of the OS temp directory and contains the marker before deletion.
4. In the disposable checkout run, in order:
   - root/backend/frontend plain `npm ci`;
   - Prisma validate and generate;
   - backend/frontend typecheck;
   - backend/frontend lint;
   - backend/frontend unit tests;
   - backend/frontend production builds;
   - artifact and route manifest validation.
5. Remove the `Boolean(process.env.CI)` artifacts-only shortcut. `--artifacts-only` may exist only as a separately named non-certifying diagnostic command and must never satisfy `clean_checkout_build`.
6. Record candidate SHA, Node/npm versions, lockfile hashes, command/exit-code list, artifact hashes/counts, and temp isolation proof in machine-readable JSON.

**Safety mutation tests**

- Source dependency directories contain sentinel files before the run; all sentinels must survive both success and forced failure cleanup.
- A missing lockfile entry, missing Prisma generation, stale pre-existing artifact, or source-checkout-only dependency must fail.
- Setting `CI=true` must not change the isolation behavior.

### R3-B3 — `unit_smoke` does not run tests

`checkUnitSmoke()` only counts `*.spec.ts`/`*.test.ts(x)` files and always returns PASS when both counts are non-zero. This hid 22 failing backend suites after clean install.

**Repair method**

1. Execute both package test commands via `spawnSync` with explicit timeout, deterministic worker settings, and captured exit code.
2. Run Prisma generation before backend tests, either as an explicit CI step or a deterministic package lifecycle step.
3. Fail on non-zero exit, zero executed tests, unexpected skipped critical suites, open handles/timeouts, or truncated/unparseable result output.
4. Emit suite/test pass/fail/skip counts from machine-readable Jest/Vitest reporters.
5. Mutation test: remove the generated Prisma client and prove `unit_smoke` fails.

### R3-B4 — Container certification is static-only and fail-open

`checkContainerBuild()` verifies a few Dockerfile strings. Its Docker Compose subprocess status is ignored and `composeConfigValid` remains true. It never builds either image.

**Repair method**

1. Separate `container_definition_static` from the certifying `container_build_and_smoke` gate.
2. In CI, run `docker compose config --quiet`, BuildKit builds for both images with `--pull`, and start the production images with health checks.
3. Verify non-root runtime user, expected exposed/listening ports, health endpoint, required runtime artifacts, no dev dependency required at startup, graceful shutdown, and a frontend HTTP smoke.
4. Any missing daemon/buildx/build failure is `NOT_VERIFIED` locally and a hard FAIL in certifying CI; never PASS.
5. Add black-box tests for unavailable Docker, invalid Compose syntax, failing `RUN`, missing runtime artifact, root user, and unhealthy container.

### R3-B5 — Architecture ratchets become weaker when a change is larger

**Root causes**

- The duplication gate uses the 28.7% codebase baseline when more than five files change, even though changed hand-written code must be <=1%.
- The complexity gate similarly allows up to 62 functions above 15 and 58 functions without rationale when more than five files change. This permits new debt in a large PR.
- The diff base is hard-coded to `7a449e0a` instead of the reviewed merge base/candidate manifest.
- `changed_files_max_warnings: 0` is declared but not enforced.

**Repair method**

1. Compute `base_sha` explicitly from evidence input or `git merge-base origin/main HEAD`; fail if it cannot be resolved. Record it.
2. Always apply changed-code limits to changed hunks regardless of file count: duplication <=1%; complexity <=10, 11–15 only with approved rationale/tests; >15 requires an actual time-bounded exception.
3. Independently compute full-codebase metrics and compare them with the frozen baseline; no count or percentage may increase.
4. Map ESLint findings to changed lines/files and enforce zero new warnings. Whole-codebase warnings may remain at the P03 baseline only if the exact debt inventory is frozen and cannot grow or move.
5. Add mutations with 6+ changed files containing one new clone, complex function, or lint warning; each must fail.

### R3-B6 — Several architecture gates trust derived registries instead of source truth

- `unused_export_dependency_scan` trusts `reachable` flags in `_LIFECYCLE_REGISTRY.json` rather than deriving imports/runtime registrations.
- `orphan_object_scan` trusts a stored `unexplained_objects` metric.
- screen coverage trusts stored registry totals and defaults missing values to 100%.
- module boundary/dependency checks cover only narrow controller/service patterns and do not detect cross-domain persistence reach-through required by the standard.

**Repair method**

1. Build one source-derived graph for imports/exports, Nest module/controller/provider registrations, Next routes, scheduled jobs, events, Prisma model access, package imports, and test-only reachability.
2. Compare generated inventory to canonical/API/screen/RBAC/event contracts and lifecycle classifications; treat the registry as generated output, never input truth.
3. Detect unused direct dependencies from actual import/require/dynamic-import/config/plugin usage with an explicit config allowlist.
4. Detect unreachable exports/providers/routes/jobs/events and cross-domain Prisma access. Exceptions require owner, ADR/decision, scope fingerprint, test, and expiry.
5. Regenerate the registry from the graph and fail when committed registry differs.
6. Mutate source without regenerating the registry and prove all applicable gates fail.

### R3-B7 — UI DNA scans remain easy to bypass

Current scans inspect mainly `page.tsx` files. Native controls cover only `button` and `input`; hardcoded visuals detect only the literal `style={{`; duplicate primitives detect only six names. A file-level exception waives every matching violation in that file, not one exact occurrence.

**Repair method**

1. Scan the complete production UI dependency closure for every application screen, including imported local components/hooks/render helpers; exclude only tests, generated code, and the canonical DNA implementation itself.
2. Resolve aliases and re-exports. Require application UI primitives to enter only through `@/components/dna`.
3. Detect all interactive HTML elements and interaction-role constructs (`button`, `input`, `select`, `textarea`, `a` used as control, dialog/menu/checkbox/radio/switch/tab patterns, click handlers on non-interactive elements).
4. Detect inline style objects, raw color/spacing/typography/shadow/radius literals, arbitrary Tailwind values, direct CSS values, and duplicated primitive semantics—not component names alone.
5. Exception identity must include rule + file + AST node/import specifier + stable scope fingerprint. One exception must not waive a newly added violation elsewhere in the same file.
6. Derive screen coverage from filesystem routes plus the canonical screen contract; fail on either missing or extra unclassified screens.
7. Add bypass mutations for imported child components, aliased imports, `<select>`, `onClick` on `<div>`, `style = {obj}`, hex/rgb/Tailwind arbitrary colors, renamed primitive, and a second violation in an already excepted file.

### R3-B8 — Negative tests validate selected examples, not the actual certification boundary

The 36 tests pass but omit the exact failure modes above. Some use synthetic override hooks rather than invoking the production CLI as a black box.

**Repair method**

1. Keep small unit tests, but make certification depend on black-box fixtures/copies invoking the same CLI command used by CI.
2. Every blocker B1–B7 must have at least one positive control and one negative mutation.
3. Assert gate ID, non-zero exit code, and absence of modified source/sentinel loss after every mutation.
4. Run mutations from a disposable copy and verify restoration even after interruption.

### R3-B9 — Evidence and delivery are not trustworthy enough to certify

- Evidence names `ff47ed36...` as candidate but later records P03 as certified on `fb31777c`.
- It calls the result `zero-waiver` while accepting 8,218 warnings and 205 DNA exceptions.
- It describes changed-code duplication <=1% while reporting/allowing a much larger baseline mode.
- The single candidate commit spans 931 paths and many unrelated domains without the required change-impact statement.

**Repair method**

1. Produce evidence only from a machine-generated run manifest bound to one immutable candidate SHA.
2. Use accurate language: legacy debt baseline/waivers are not zero-waiver compliance.
3. Provide a path-level scope ledger for all 931 changed paths, mapping each to P00/P01/P02/P03 or an approved prior deliverable. Unexplained domain edits fail delivery review.
4. Prefer separate reviewable commits by phase. Do not destructively rewrite or discard user work; preserve the current commit before any history restructuring.
5. Evidence must include exact commands, environment versions, durations, exit codes, test counts, baseline deltas, exception delta, CI run URL/ID, and image digests.

## One-pass execution order for the implementing AI CLI

1. Preserve current state and capture candidate/base SHA plus a complete path scope ledger.
2. Repair root dependency and lockfile consistency; prove all three plain clean installs.
3. Replace the unsafe isolated verifier and add its safety/CI-mode mutations.
4. Make unit, typecheck, lint, build, migration, and container gates execute real commands and fail closed.
5. Replace registry-trusting architecture checks with a source-derived graph and generated registry comparison.
6. Correct changed-code versus whole-codebase ratchets and enforce changed-line lint.
7. Expand DNA analysis to the complete screen dependency closure and occurrence-scoped exceptions.
8. Add every negative scenario listed in B1–B8.
9. Run the full acceptance sequence from an immutable clean copy and a real CI run.
10. Generate evidence from results; only then set P03 to PASS. Do not set P04 certifiable in the same step.

## Required final acceptance sequence

All commands must run against the same SHA and every certifying command must exit 0:

1. Safe isolated clean pipeline: three `npm ci`, Prisma validate/generate, typechecks, lints, units, builds.
2. `node scripts/ssot/validate_ssot.js`.
3. P02 audit and P02 adversarial suite.
4. P03 architecture audit with no fast/skip/artifacts-only mode.
5. Expanded P03 black-box negative suite.
6. Empty-database Prisma migration rehearsal.
7. Real backend and frontend Docker builds plus runtime health/HTTP smoke.
8. Git diff/status check proving evidence belongs to the recorded candidate and no verifier changed/deleted source checkout content.

P03 may be marked PASS only when these checks are green, the reported metrics match raw outputs, and an independent rerun reproduces them.

## Auditor–executor single-command contract

The sole P03 finish command is:

```text
node scripts/ssot/certify_p03_release.js
```

Only exit code `0` plus `CERTIFIED_PASS` and a SHA-bound certification token is acceptable. The runner creates an immutable clean copy, installs dependencies independently, executes the complete gate chain, requires all R3 mutation identifiers, performs real Docker build/runtime smoke, verifies source-checkout safety, and writes `docs/legacy-erp/verification/evidence/P03_CERTIFICATION_RESULT.json`. No partial mode can certify.
