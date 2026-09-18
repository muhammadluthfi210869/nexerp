# P03 R5 Fast Certification Integrity Fix — Handoff

This is the R5 fast-certification integrity handoff. The R5 fix corrects
reproducibility/audit-integrity bugs (R5-B1..R5-B6) and intentionally does
NOT remediate the application.

## Scope discipline

The fast certifier runs only:

1. Targeted tests during implementation (scope binding, CI allowlist, result
   parser, Prisma parser, DNA subpath mutation).
2. `node scripts/ssot/certify_p03_phase.js` once at the end.
3. Exact CI post-run source-integrity command (the same one the runner
   uses).

It does NOT run: Docker, deployment, clean-room install, E2E, browser matrix,
load, DR, or any other phase work.

## Mandatory results

### 1. SHA / base

| Field | Value |
|---|---|
| `git rev-parse HEAD` | `d94a7a23f6e12fe40e6e479f8af54dfab81b8ade` |
| Manifest `candidate_commit_sha` | `d94a7a23f6e12fe40e6e479f8af54dfab81b8ade` |
| Evidence `candidate_sha` | `d94a7a23f6e12fe40e6e479f8af54dfab81b8ade` |
| Manifest `base_commit_sha` | `9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb` |
| Phase base (declared, locked) | `9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb` |
| HEAD SHA equals manifest candidate | ✓ |
| Manifest base equals phase base | ✓ |

### 2. Actual diff count (R5-B1)

- `git diff --name-only 9229478d..HEAD` → **92 paths**
- Manifest `total_changed_paths` → **92**
- Path list regenerated and validated byte-for-byte against the Git diff.

The prior manifest had stale `candidate_commit_sha` = `11ec69d2…` and a
hard-coded `total_changed_paths` = `88`. Those values were computed at R5-batch
time, not at runner time. The new runner regenerates the manifest at
startup from `git diff --name-only <phase-base> HEAD` so that the manifest's
candidate, base, path list, and count are always equal to the Git truth.

### 3. Production audit rejects a stale manifest/ledger (R5-B2)

`scripts/ssot/p03_audit_options.js` is the production audit options builder:

- `buildP03AuditOptions()` always emits
  `baseSha = '9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb'`,
  `requireValidLedger = true`,
  `changedFiles = <git diff --name-only phase-base HEAD>`,
  and `codeFiles = <filtered .ts/.tsx>`.

`scripts/ssot/audit_p03_architecture_gates.js` exposes
`runProductionAudit(options)` that assembles its bundle via this builder.
The runner calls `runProductionAudit(...)`, never `runAudit({})`. Mutation
tests may continue to call `runAudit({...})` directly with surgical
overrides.

Negative test that reuses the production path:
- `BB-STALE-SCOPE-LEDGER` — stale base/candidate SHAs in the ledger fail
  `resolveP03AuditScope(..., { requireValidLedger: true })`.
- `BB-DIFF-BASE-STALE` — non-existent base SHA fails validation.
- `BB-ZERO-APPLICABLE-SCOPE` — zero resolved targets fails closed.

### 4. CI post-run source-integrity command (R5-B3)

The exact command at the time of certifier exit:

```bash
git diff --exit-code -- . \
  ':(exclude)docs/legacy-erp/verification/_SSOT_VALIDATION_REPORT.md' \
  ':(exclude)docs/legacy-erp/verification/_ssot_validation.json' \
  ':(exclude)docs/legacy-erp/verification/_p02_test_results.json' \
  ':(exclude)docs/legacy-erp/verification/_p03_test_results.json' \
  ':(exclude)docs/legacy-erp/verification/_clean_checkout_build_evidence.json' \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_MANIFEST.json' \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_LEDGER.md' \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_PHASE_CERTIFICATION_RESULT.json' \
  ':(exclude)docs/legacy-erp/generated/INPUT_OUTPUT_LINEAGE.md'
```

Observed exit codes:

| Pre-condition | Exit code |
|---|---|
| After certifier exit (only the 9 generated outputs are dirty) | **0** ✓ |
| After applying a tracked edit outside the allowlist (negative proof) | **1** ✓ |

The same allowlist is consumed by the runner pre-flight and post-run
source-integrity checks (`pre_run_source_integrity`,
`post_run_source_integrity`) via
`scripts/ssot/p03_audit_options.js#findDisallowedTrackedDirty()`. The
runner asserts that zero tracked-file modifications exist outside the
allowlist at startup and again after certification.

The CI workflow `.github/workflows/ci.yml` consumes the same allowlist in
the `Post-Run Source Integrity Check` step.

### 5. Machine-readable lint/unit metrics (R5-B4)

`scripts/ssot/lib/test_result_parser.js` captures truthful test/lint
summaries BEFORE the runner truncates outputs for evidence. The runner's
`record()` preserves both `stdout` / `stderr` (truncated for evidence) and
`full_stdout` / `full_stderr` (preserved up to 1 MiB). The audit gate
bundles receive the full streams so the analyzer regexes see the actual
summary lines, including the multi-megabyte frontend ESLint output.

| Stream | Suites / files | Tests | Skipped | Notes |
|---|---|---|---|---|
| Backend Jest (`npm --prefix backend run test:unit`) | **23 / 23** | **260 passed** | **0** | `Tests: 260 passed, 260 total` |
| Frontend Vitest (`npm --prefix frontend run test`) | **55 / 55** | **355 passed** | **0** | `Test Files 55 passed (55)` / `Tests 355 passed (355)` |
| Backend ESLint (`npm --prefix backend run lint`) | 0 problems, 0 errors, 0 warnings | — | — | exit 0; backend lint has zero warnings so no `problems` line is emitted |
| Frontend ESLint (`npm --prefix frontend run lint`) | **8211 warnings, 0 errors** | — | — | parsed from full 2.5 MB output |

Both unit suites report `0 skipped`, satisfying the changed-scope and
changed-skip ratchet. Changed-frontend lint scope = **0 / 0** errors /
warnings (changed lint is checked by the analyzer on the changed .tsx diff
in `checkLint`).

The runner additionally asserts:

- `metrics_present` — every machine-readable summary parsed.
- `backend_tests_have_real_counts` — backend Jest shows >0 suites and >0 tests.

### 6. Installed Prisma (R5-B5)

| Source | Value |
|---|---|
| `backend/package.json` `devDependencies.prisma` | `7.10.0` (pinned, no `^` / `~`) |
| `backend/package.json` `dependencies["@prisma/client"]` | `7.10.0` |
| `backend/node_modules/@prisma/client/package.json` `version` | `7.10.0` |
| `npm --prefix backend exec -- prisma -v` CLI line | `prisma : 7.10.0` |

`prisma_toolchain_match` requires that:

1. The installed `@prisma/client` exists AND its `version` field parses.
2. The CLI's `prisma` line is parsed from the same invoke.
3. The two versions compare equal byte-for-byte.

`@prisma/client` "Not found" / missing / unparseable / mismatch → FAIL.

The CLI's "Not found" stdout line is informational only — the authoritative
source is the installed `package.json`. This avoids the previous false-pass
where `prisma -v` reported `@prisma/client: Not found` (a Windows / process
cwd quirk) but the runner only searched the stdout for `mismatch` and
otherwise passed.

The runner now exits 1 with structured details:

```json
{
  "installed_client_version": "7.10.0",
  "cli_version": "7.10.0",
  "parseable": true,
  "parse_error": null
}
```

Negative coverage:

- `BB-PRISMA-VERSION-MISMATCH` (existing) — divergent CLI vs. client fails.
- `BB-PRISMA-NOT-FOUND` (new) — `simulateClientMissing` flag forces the
  authoritative source to be `null`, fails.

### 7. DNA subpath mutation in production analyzer path (R5-B6)

`checkDnaImportBoundary()` now refuses any import starting with
`@/components/dna/<sub>` (e.g. `@/components/dna/DnaButton`) from any file
OUTSIDE the DNA implementation root
(`frontend/src/components/dna/`). Page components, layout shells, and
other third-party code must import via the canonical barrel
(`@/components/dna`), never by subpath.

Two new negative scenarios exercise the production path, not just
synthetic injection:

- `BB-DNA-SUBPATH-IMPORT` — writes a real on-disk screen
  (`page.tsx`) that imports `@/components/dna/DnaButton`; calls
  `analyzers.checkDnaImportBoundary(ROOT, { appDir: <tmp> })`.
- `BB-DNA-SUBPATH-INJECTED` — synthetic subpath violation array.

Both FAIL the production gate (`unhandled_subpath_count > 0`).

In scope this SHA, the audit's `dna_import_boundary_ast` reports
`unhandled_subpath_count = 0` from the real frontend tree, with
`total_screens_scanned = 94` and `total_closure_files_scanned = 145`,
confirming the production path is healthy and the mutation suite is
non-trivial.

### 8. Negative suite

`node scripts/ssot/test_p03_architecture_gates_negative.js` →
**61 / 61 PASSED**, exit code 0. Includes the new R5-B6 mutations
`BB-DNA-SUBPATH-IMPORT`, `BB-DNA-SUBPATH-INJECTED`, and the new R5-B5
mutation `BB-PRISMA-NOT-FOUND`.

The required-mutations check inside the runner also passed: every
mutation id in `REQUIRED_MUTATIONS` is present in the suite output.

### 9. Final runner exit code and token

Final state after `node scripts/ssot/certify_p03_phase.js` on
`d94a7a23f6e12fe40e6e479f8af54dfab81b8ade`:

| Field | Value |
|---|---|
| `verdict` | `FAIL` |
| `token` | `null` (not emitted) |
| `candidate_sha` | `d94a7a23f6e12fe40e6e479f8af54dfab81b8ade` |

The runner's full audit (`runProductionAudit`) reported
`passed_tests: 20 / total_tests: 21`. The single failing gate is:

| Gate | Reason |
|---|---|
| `duplicate_code_scan` | `duplication_percent = 4.20%` vs. `max_allowed_percent = 1%` |

This is an application-level detection surfaced by R5-B2's correct scope.
The 8 layout shell files in `frontend/src/components/layout/` (BaseShell,
DashboardShell, DataTable, FormShell, ModuleHeader, SectionDivider,
TableShell) carry structurally similar interface and shell patterns, so the
n-gram tokenizer produces real overlap. Per the task prompt
(*"Pertahankan perbaikan aplikasi yang sudah lulus dan selesaikan hanya
R5-B1 sampai R5-B6"*), this finding is left for the auditor to evaluate
on its merits — application refactoring of the layout shells is out of
R5 scope.

The auditor certification rule still applies: *if R5 integrity passes on
one committed SHA, the auditor may promote P03 directly. No new
non-critical acceptance criteria will be introduced.* Since R5-B1..B6
are correct and the audit's only finding is the application-level
duplication, the auditor decides whether to:

- accept the duplication as a known limitation, OR
- request a separate refactor cycle on the layout shells.

The runner-side `assertCheck` for token emission also blocks promotion
because the audit verdict is FAIL — i.e. the runner never reports
`PHASE_PASS` while the duplication persists. The auditor's job is then to
either accept or override.

### 10. Remaining R5 integrity failures (R5-B1..R5-B6)

| R5 finding | Status | Notes |
|---|---|---|
| R5-B1: scope evidence stale | **RESOLVED** | Manifest regenerated at runner startup; `candidate_commit_sha`, `base_commit_sha`, `total_changed_paths`, and path list all equal the Git diff at run time. |
| R5-B2: production audit doesn't wire strict options | **RESOLVED** | New `p03_audit_options.js#buildP03AuditOptions()` always wires `baseSha`, `requireValidLedger`, `changedFiles` (and `codeFiles` for code gates). Production audit calls go through `runProductionAudit()`. |
| R5-B3: post-run CI check fails deterministically | **RESOLVED** | Single canonical generated-output allowlist (9 paths), consumed by runner pre/post source-integrity checks AND `.github/workflows/ci.yml`. Both `pre_run_source_integrity` and the CI command return exit 0 after certification. |
| R5-B4: evidence truncation produces false metrics | **RESOLVED** | `test_result_parser.js` parses Jest/Vitest/ESLint summaries before any truncation. `record()` preserves `full_stdout`/`full_stderr`; the audit bundles receive full streams. `backend_tests_have_real_counts` blocks any scenario where parses return zero unexpectedly. |
| R5-B5: Prisma "Not found" passes | **RESOLVED** | `prisma_toolchain_match` reads `backend/node_modules/@prisma/client/package.json` `version` field, fails on missing/unparseable/"Not found" and on mismatch. New `BB-PRISMA-NOT-FOUND` negative scenario confirms. |
| R5-B6: DNA import gate doesn't enforce barrel | **RESOLVED** | `checkDnaImportBoundary()` flags any `@/components/dna/<sub>` import outside the DNA implementation root. Two new on-disk mutations (`BB-DNA-SUBPATH-IMPORT`, `BB-DNA-SUBPATH-INJECTED`) confirm the production analyzer path trips. |

**All six R5-B findings are RESOLVED at this SHA.**

## Application-level findings outside R5 scope

The auditor will see these when reproducing the audit from this SHA. They
are NOT R5-B1..B6 integrity issues.

- `duplicate_code_scan` — 4.20% duplication in 8 layout shell files
  (struck against the 1% changed-code baseline threshold). Caused by
  structurally similar shell interfaces; the auditor decides whether to
  refactor the layout shells or relax the threshold.

## Files changed by this R5 cycle

```
scripts/ssot/p03_audit_options.js                              (new)
scripts/ssot/lib/test_result_parser.js                          (new)
scripts/ssot/certify_p03_phase.js                              (R5 integrity wiring)
scripts/ssot/audit_p03_architecture_gates.js                   (production entrypoint)
scripts/ssot/lib/p03_analyzers.js                              (R5-B5 Prisma, R5-B6 DNA subpath, ledger regex)
scripts/ssot/test_p03_architecture_gates_negative.js           (R5-B6 + R5-B5 mutation scenarios)
.github/workflows/ci.yml                                       (R5-B3 allowlist)
```

## Reproduction commands

```bash
# 1. Run the negative suite (must exit 0)
node scripts/ssot/test_p03_architecture_gates_negative.js

# 2. Confirm the allowlist is identical between runner and CI
node -e "console.log(require('./scripts/ssot/p03_audit_options').GENERATED_OUTPUT_ALLOWLIST.join('\n'))"

# 3. Confirm the installed Prisma client parses
node -e "const p=require('./scripts/ssot/lib/p03_analyzers').checkPrismaToolchain('.');console.log(JSON.stringify(p.details))"

# 4. Stale-manifest rejection (must fail)
node -e "
const a=require('./scripts/ssot/p03_audit_options');
const fs=require('fs');
const tmp='docs/legacy-erp/verification/evidence/_STALE.md';
fs.writeFileSync(tmp,'Base Commit SHA: \`0000000000000000000000000000000000000000\`\nCandidate Commit SHA: \`1111111111111111111111111111111111111111\`\n');
const r=require('./scripts/ssot/lib/p03_analyzers').resolveP03AuditScope('.',{ledgerPath:tmp,requireValidLedger:true,baseSha:a.PHASE_BASE_SHA});
console.log('ledger error:', r.ledgerError);
fs.unlinkSync(tmp);
"

# 5. CI post-run source-integrity (returns 0 after certifier, 1 with extra dirty source)
git diff --exit-code -- . \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_PHASE_CERTIFICATION_RESULT.json' \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_MANIFEST.json' \
  ':(exclude)docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_LEDGER.md' \
  ':(exclude)docs/legacy-erp/verification/_SSOT_VALIDATION_REPORT.md' \
  ':(exclude)docs/legacy-erp/verification/_ssot_validation.json' \
  ':(exclude)docs/legacy-erp/verification/_p02_test_results.json' \
  ':(exclude)docs/legacy-erp/verification/_p03_test_results.json' \
  ':(exclude)docs/legacy-erp/verification/_clean_checkout_build_evidence.json' \
  ':(exclude)docs/legacy-erp/generated/INPUT_OUTPUT_LINEAGE.md'

# 6. Final certifier
node scripts/ssot/certify_p03_phase.js
```

## Handoff completeness check (per `P03_R5_FAST_CERTIFICATION_FIX_PROMPT.md`)

| Required field | Status |
|---|---|
| SHA/base | ✓ HEAD, manifest candidate, manifest base, evidence candidate all aligned |
| Actual diff count | ✓ `git diff --name-only 9229478d HEAD` = 92 = manifest count |
| Generated allowlist | ✓ 9 paths listed above (Section 4); same set used by runner and CI |
| Exact CI integrity command exit code | ✓ 0 after certifier; 1 with extra dirty source (negative proof) |
| Machine-readable lint/unit metrics | ✓ Backend 23/23 + 260/260 + 0 skipped, Frontend 55/55 + 355/355 + 0 skipped, Frontend ESLint 8211 warnings / 0 errors / 0 changed-scope |
| Installed Prisma version | ✓ 7.10.0 across CLI, declared, installed |
| DNA subpath mutation result | ✓ Production analyzer rejects `@/components/dna/DnaButton` outside the implementation root |
| Negative suite result | ✓ 61 / 61 PASS, exit 0 |
| Final runner exit/token | ✓ certifier exits with non-zero because audit detects 1 application-level finding; token is `null` because verdict is FAIL |
| Remaining R5-B1..B6 failures | ✓ Empty for R5-B1..B6; 1 application-level audit finding (`duplicate_code_scan`) is documented but out of R5 scope |

— end of handoff —
