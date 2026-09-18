# P03 Independent Reverification R5 — Certification Integrity Audit

## Verdict

- Candidate: `3b6322d3aaec1be9b8d0e45c16c1e8a194261562`
- Actual parent: `11ec69d2bcb4c7b62d164e5bfea6ed77a9c4443b`
- P03 phase base: `9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb`
- Implementor token: `P03:3b6322d3aaec1be9b8d0e45c16c1e8a194261562:PHASE_PASS`
- Independent verdict: **FAIL — certification integrity only**
- Application remediation: materially improved; changed frontend lint is 0/0, ordinary test/build commands exited 0, DNA target counts are non-zero, and the adversarial suite contains the requested cases.
- P04 remains not certifiable until the small R5 correction below passes.

The remaining work is not another broad application refactor. It is a bounded correction to make the token reproducible and its evidence truthful.

## Reproduced blockers

| ID | Finding | Reproduction | Required correction |
|---|---|---|---|
| R5-B1 | Scope evidence is stale | `P03_CHANGE_SCOPE_MANIFEST.json` and the ledger contain candidate `11ec69d2`, while the token uses `3b6322d3`. The manifest says 88 paths; the current phase-base diff contains 87. The handoff also incorrectly calls `9229478d` the parent; it is the phase base, not the parent. | Generate and validate the manifest during certification. Its base must equal the declared P03 phase base, candidate must equal `HEAD`, and paths/count must exactly equal the Git diff. |
| R5-B2 | Strict ledger/scope validation is not wired into production | The stale-ledger mutation calls `resolveP03AuditScope(..., {requireValidLedger:true})`, but the production `runAudit()` call supplies no `baseSha` or `requireValidLedger`. Default production scope therefore reports no ledger error. | Production certification must pass the same strict scope options to duplication, complexity, and all DNA gates. Mutation tests must invoke that production option builder/path. |
| R5-B3 | CI post-run check deterministically fails | Immediately after the successful runner, `_SSOT_VALIDATION_REPORT.md`, `_ssot_validation.json`, and `_p02_test_results.json` are modified. Running the exact CI command `git diff --exit-code -- . ':(exclude)...P03_PHASE_CERTIFICATION_RESULT.json'` returns exit `1`. | Use one exact generated-output allowlist both at runner startup/post-run and in CI, or write generated evidence outside tracked source. Reject every dirty path outside that allowlist. The runner must be safely repeatable after a previous run. |
| R5-B4 | Evidence truncation produces false metrics | The evidence truncates output to 8,000 characters before analyzers consume it. The Jest summary is lost and the gate records `backend_tests: 0 passed, 0 skipped` while the handoff claims 260. The frontend ESLint summary is also truncated, so the audit records 0 warnings while the handoff claims 8,211. | Parse full machine-readable Jest/Vitest/ESLint results before truncating human logs. Fail if counts are missing or zero unexpectedly. Evidence must contain the actual aggregated metrics. |
| R5-B5 | Prisma check accepts `@prisma/client: Not found` | `npm --prefix backend exec -- prisma -v` prints CLI 7.10.0 and `@prisma/client: Not found`; the runner merely checks for the word `mismatch` and passes. | Resolve the installed local package JSON, compare its exact version with the local CLI and declared/locked versions, and fail on missing/not-found/unparseable values. |
| R5-B6 | DNA import gate does not enforce the declared barrel boundary | `checkDnaImportBoundary()` rejects `@/components/ui/*` and Radix imports but does not reject `@/components/dna/*`. The current page was repaired, but the certification promise is broader than its implementation. | Reject every DNA implementation subpath import outside the DNA implementation root; add a production-path mutation using `@/components/dna/DnaButton`. |

## Fast acceptance sequence

During implementation, run only targeted checks for R5-B1..B6. Do not rerun builds or all unit suites after each edit. When all targeted checks pass, run the authoritative command exactly once.

Mandatory final results:

1. `git rev-parse HEAD` equals manifest `candidate_commit_sha` and evidence `candidate_sha`.
2. Manifest `base_commit_sha` equals the declared P03 phase base and its path list/count exactly matches `git diff --name-only <phase-base> HEAD`.
3. Production audit rejects a deliberately stale manifest/ledger without special test-only options.
4. The exact CI post-run source-integrity command returns 0 after certification, while an unrelated modified source file makes it fail.
5. Evidence reports real full metrics: backend 23/23 suites and 260 tests, frontend 55 files and 355 tests, both with zero skipped; frontend lint reports the true whole-codebase warning count and changed scope 0/0.
6. Installed local Prisma CLI/client, declared versions, and lock versions match exactly; no missing/unparseable value passes.
7. A DNA subpath import mutation fails the production DNA import gate.
8. `node scripts/ssot/test_p03_architecture_gates_negative.js` exits 0.
9. `node scripts/ssot/certify_p03_phase.js` exits 0 and emits a token bound to the new committed SHA.
10. No Docker, deployment, clean-room install, browser matrix, load, or DR execution is added.

## Auditor certification rule

Once these ten results pass on one committed SHA, the auditor will reproduce the same frozen R5 checks and may promote P03 directly. No new non-critical acceptance criteria will be introduced.
