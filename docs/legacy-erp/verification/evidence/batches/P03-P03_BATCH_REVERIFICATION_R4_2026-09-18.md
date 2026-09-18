# P03 Independent Reverification R4 — Final Bounded Remediation Contract

## Verdict

- Candidate audited: `11ec69d2bcb4c7b62d164e5bfea6ed77a9c4443b`
- Candidate parent: `9229478d`
- Implementor result: `PHASE_PASS`
- Independent verdict: **FAIL**
- Certified through: `P02`
- P04 status: not certifiable until P03 passes
- Authoritative bounded command: `node scripts/ssot/certify_p03_phase.js`
- Heavy Docker runtime, deployment, deployed E2E, load, browser matrix, and DR: explicitly deferred to their integration/release phases

The candidate materially improves P03 and its ordinary type, unit, and production-build commands passed. The certification is nevertheless a false positive because required checks accepted zero applicable UI targets, ignored changed-file lint warnings and skipped tests, and cannot execute successfully in the current CI ordering.

## Independent evidence

| ID | Finding | Objective evidence | Required result |
|---|---|---|---|
| R4-B1 | Stale diff/scope authority | `resolveP03AuditScope()` derives from stale `origin/main` and a manual ledger whose candidate is not `11ec69d2`; the ledger labels current frontend changes as inherited P02 work. | Scope is generated from an explicit immutable base/candidate SHA pair; a stale ledger fails closed and can never remove changed source from checks. |
| R4-B2 | Zero-target DNA false PASS | Implementor evidence records `total_screens_scanned: 0` and `total_closure_files_scanned: 0` for critical DNA checks although `HEAD~1..HEAD` changes seven production TS/TSX files. | A critical gate with applicable changed files and zero resolved targets is FAIL. |
| R4-B3 | Changed frontend warnings accepted | Independent ESLint JSON run exits 0 but reports exactly seven warnings in `frontend/src/app/(dashboard)/finance/audit-ledger/page.tsx`: two restricted legacy DNA subpath imports, one unused import, one raw input, and three raw buttons. The source actually contains four DNA subpath imports, all forbidden by the global barrel-only policy even though the current ESLint configuration flags only two. | Changed-file lint must parse structured output and require 0 errors and 0 warnings; the DNA gate must enforce the stricter barrel-only policy. |
| R4-B4 | UI/DNA violations hidden | The page imports DNA implementation subpaths at lines 18-21 and renders raw interactive elements at lines 89, 99, 196, and 199. A direct closure scan also identifies unhandled hardcoded visual usage in the audit page, `TableShell.tsx`, and `ModuleHeader.tsx`. | Consumers import only `@/components/dna`; interactive and visual primitives use exported DNA components/tokens; exceptions are occurrence-scoped, not file-wide. |
| R4-B5 | Unexpected skipped tests accepted | Vitest reports 53 passed/2 skipped files and 348 passed/7 skipped tests. Static search locates six skips in the two production tests and one in `qc-workbench.test.tsx`. The registry threshold is `unexpected_skips: 0`. | Machine-readable unit results contain zero skipped tests/files. |
| R4-B6 | CI invocation is self-contradictory | CI runs SSOT/P02/P03 generators before `certify_p03_phase.js`; those commands modify tracked result artifacts, while the runner rejects any non-empty `git status --porcelain` at startup. | The same bounded runner succeeds in CI from a clean checkout; generated evidence cannot make the later gate reject its own job. |
| R4-B7 | Recorded audit detail is not the executed result | The runner executes real type/lint/unit commands, then invokes `runAudit()` with `skipSubprocess: true`; generated audit details can report zero warnings/pass without carrying the real command metrics. | Certification evidence embeds or references the actual parsed result for every gate; skipped subprocess placeholders cannot certify a gate. |
| R4-B8 | Node/Prisma toolchain is internally inconsistent | CI selects Node 20 while installed `@prisma/streams-local` declares Node >=22. `prisma generate` warns that global/local Prisma CLI 7.10.0 does not match `@prisma/client` 7.8.0. | One supported Node major is declared everywhere; local `prisma` and `@prisma/client` are exact matching versions; engine/version warnings fail the gate. |
| R4-B9 | Negative suite misses the real bypasses | The 48/48 mutation suite did not detect zero applicable scope, stale SHA ledger, broad exception hiding, skipped tests, CI-generated dirtiness, or toolchain mismatch. | Each bypass below has a deterministic mutation test that reaches the production certification path and fails the named gate. |
| R4-B10 | Candidate scope is poorly isolated | `HEAD~1..HEAD` changes 78 files and includes P04 migrations/seeds and many reference documents in a P03 candidate. | Produce a generated path ledger; move unrelated implementation to its owning phase/commit where safely possible, otherwise classify and prove why it cannot affect P03. No manual classification may suppress tests. |

## Complete one-pass remediation map

### 1. Make immutable scope the only testing authority

1. Resolve `candidate_sha` from `HEAD` and require an explicit base SHA. For this candidate the expected base is its parent, `9229478d`; do not silently substitute a stale remote-tracking branch.
2. Generate a machine-readable scope manifest containing base SHA, candidate SHA, changed paths, applicable analyzers, and resolved dependency closures.
3. Treat `P03_CHANGE_SCOPE_LEDGER.md` as explanatory evidence only. Reject it when its SHAs differ, and never allow its phase labels to remove a changed production file from lint, architecture, or DNA checks.
4. Fail if an applicable critical analyzer resolves zero targets. Report target counts and paths.

### 2. Fix the actual changed UI

1. In `finance/audit-ledger/page.tsx`, replace all `@/components/dna/*` imports with exports from `@/components/dna`.
2. Remove the unused `DnaInput` import or use it to replace the raw search input.
3. Replace all raw buttons with the appropriate DNA button/icon-button export while preserving semantics, labels, keyboard access, and focus behavior.
4. Replace hardcoded visual primitives in the page and its changed closure, including `TableShell.tsx` and `ModuleHeader.tsx`, with canonical DNA composition/tokens.
5. If DNA lacks a needed primitive, implement, test, export, and document it first. Do not add broad exceptions.
6. Parse ESLint JSON for the actual changed production paths and require zero errors and warnings.

### 3. Make test and evidence results truthful

1. Produce Jest/Vitest machine-readable reports and fail on any skipped, pending, todo, quarantined, or flaky test. Enable and repair the seven currently skipped Vitest cases.
2. Pass real type/lint/unit command results into the P03 audit or make the audit consume their immutable result artifacts. Remove certifying `skipSubprocess` placeholders.
3. Every result row must include command, exit code, duration, target count, errors, warnings, passed, failed, and skipped where applicable.
4. A result with missing metrics, zero applicable targets, or a command not executed is FAIL.

### 4. Make CI and local certification the same path

1. In the fast gate, invoke the bounded P03 runner once after dependency installation instead of first running generators that dirty tracked evidence and later asking the runner for a pristine tree.
2. Perform the initial clean-tree assertion before any generated result is written. After execution, permit only the runner's declared evidence outputs or write generated results to a temporary/untracked output directory.
3. Add a post-run source-integrity comparison excluding only the exact declared evidence outputs.
4. Do not add Docker builds, deployment, browser suites, or clean-room installation to this P03 command.

### 5. Align the toolchain

1. Select the canonical Node version based on all declared engines. With the current dependency graph, Node 22 is the direct compatible choice; otherwise remove/replace the Node-22-only dependency before retaining Node 20.
2. Pin `prisma` and `@prisma/client` to the same exact version in package manifests and locks.
3. Generate through the repository-local CLI only, e.g. `npm --prefix backend exec -- prisma generate`; remove global-CLI fallback.
4. Treat `EBADENGINE` and Prisma CLI/client mismatch output as certification failures.

### 6. Add missing adversarial acceptance tests

The production runner must require and the negative suite must print PASS for all of these IDs:

- `BB-DIFF-BASE-STALE`
- `BB-STALE-SCOPE-LEDGER`
- `BB-ZERO-APPLICABLE-SCOPE`
- `BB-CHANGED-LINT-WARNING`
- `BB-BROAD-DNA-EXCEPTION`
- `BB-UNEXPECTED-TEST-SKIP`
- `BB-CI-GENERATED-DIRTY`
- `BB-SUBPROCESS-RESULT-SUBSTITUTION`
- `BB-NODE-ENGINE-MISMATCH`
- `BB-PRISMA-VERSION-MISMATCH`

Each mutation must alter real fixture/source input, invoke the same analyzer path used by certification, assert a non-zero result, and assert the exact failed gate. Source-text matching alone is insufficient.

## Frozen pre-certification checklist

All rows are mandatory. Do not change this checklist after implementation begins except to make a requirement stricter.

- [ ] Candidate is committed and base/candidate SHAs are embedded in a generated scope manifest.
- [ ] Every changed production path appears in at least one applicable analyzer; no applicable critical analyzer has zero targets.
- [ ] Root/backend/frontend lock dry-runs pass without peer, engine, lock mismatch, or fallback warnings.
- [ ] Local Prisma CLI and client versions match exactly; generate passes without mismatch warning.
- [ ] SSOT is 19/19; P02 audit is 14/14; P02 negative suite is 40/40.
- [ ] Backend and frontend typecheck pass.
- [ ] Backend and frontend lint have 0 errors; changed production scope has 0 warnings.
- [ ] Backend and frontend unit suites pass with 0 failed and 0 skipped/pending/todo/quarantined tests.
- [ ] Backend and frontend production builds pass.
- [ ] All 21 P03 architecture/DNA gates execute against non-zero applicable targets and pass.
- [ ] Audit-ledger and changed closure have no DNA subpath import, raw interactive primitive, broad exception, or unregistered visual token.
- [ ] All existing and ten newly required adversarial IDs pass.
- [ ] The CI fast-gate ordering can execute the authoritative command without self-created dirtiness.
- [ ] Evidence metrics are taken from actual commands and are SHA-bound.
- [ ] `node scripts/ssot/certify_p03_phase.js` exits 0, prints `PHASE_PASS`, and prints `P03:<current-full-sha>:PHASE_PASS`.
- [ ] An independent rerun on that exact committed SHA reproduces the same result.

## Certification rule

Until every checklist row passes, P03 remains `FAIL`. A green legacy 21/21 audit, a green 48/48 negative suite, or a locally printed token does not override this R4 contract. Once the corrected bounded command passes on a committed SHA and an independent run reproduces it, the auditor can promote P03 directly without introducing new non-critical criteria.
