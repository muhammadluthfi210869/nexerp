# NEX ERP P05 — R2 Final Harness and Control Remediation Prompt

Read these files completely before editing:

1. `docs/legacy-erp/verification/evidence/batches/P05-P05_AUDIT_R2_2026-09-19.md`
2. `docs/legacy-erp/verification/evidence/batches/P05-P05_AUDIT_R1_2026-09-18.md`
3. `docs/legacy-erp/verification/P05_FROZEN_ACCEPTANCE_CONTRACT.md`
4. `scripts/ssot/p05_acceptance_contract.json`
5. the current P05 certifier, gates, analyzers, safety, mutation suite, platform code, and evidence.

Preserve all valid R1 improvements. Resolve every blocker `P05-R2-B1` through `P05-R2-B11` in one coherent revision. Do not mark P05 PASS in the registry.

## Authorized frozen-wrapper amendment

The auditor authorizes exactly one narrow change to `scripts/ssot/certify_p05_phase.js`: fix porcelain parsing so leading status bytes are preserved. Replace broad `.trim()` behavior for `git status --porcelain` with trailing-newline removal or a raw-output path. Add regression tests covering ` M`, `M `, `??`, quoted paths, the first line, multiple lines, allowlisted generated files, and forbidden files. Record old and new SHA-256 hashes. Do not modify any other frozen semantics, IDs, thresholds, phase base, or validation requirements.

## Mandatory corrections

- Require `observedReasonCode === expectedReasonCode` and observed gate ID equality in the mutation oracle. Store both. A generic exception, TypeError, timeout, fixture error, or different rejection must fail the mutation.
- Remove every fallback that manufactures the expected rejection. Each mutation must call the exact production gate/control that certification uses.
- Build real resolved base/candidate graphs for relative imports, aliases, Nest module relationships, and Prisma delegate ownership. Remove constant-zero direct-persistence analysis.
- Derive every exact/maximum/minimum metric from gate/test output. No literal compliance zero or 100 is allowed.
- Execute three real representative changes in disposable trees, run predicted targeted tests, and compare predicted versus actual paths and owners.
- Make policy authorization resolve trusted actor-at-event role → permission and data scope. Prove that a user assigned permission A is denied valid permission B.
- Inject typed configuration into platform services; scan platform production code too, allowing direct environment access only in named config/bootstrap/safety files.
- Seed and test real communication parents, actors, tenants, and mention targets. Prove allowed same-tenant behavior plus denied parent/cross-tenant/duplicate behavior through the atomic note+mention+notification+audit+outbox transaction.
- Prove refresh replay leaves zero active sessions in the family and concurrent rotation has one winner without deadlock.
- Replace existence-only coverage claims with honest ownership-field validation and test-depth classification. Do not delete useful module tests, but do not treat class-defined assertions as meaningful control coverage.

## Mandatory verification sequence

1. Targeted analyzer unit tests including relative-import, alias, Nest edge, Prisma delegate, cycle, and clean controls.
2. Mutation-oracle meta-tests: correct reason passes; wrong reason, wrong gate, generic exception, and no rejection fail.
3. Targeted auth concurrency/family-revocation tests.
4. Targeted actor-permission/tenant/data/field-scope tests.
5. Communication atomicity/deduplication tests.
6. Backend typecheck, lint, full unit suite, P05 integration suite, and build.
7. All 31 mutations through exact production paths.
8. Commit candidate and ensure no non-allowlisted dirty paths.
9. Run `node scripts/ssot/certify_p05_phase.js` twice consecutively without resetting generated evidence. Both runs must exit `0` and emit the same exact-HEAD token.

Do not stop after the first PASS. Do not work around the second-run dirty-evidence check by deleting, checking out, or committing generated evidence between runs.

## Completion output

Return:

- exact HEAD and identical token from consecutive run 1 and run 2;
- old/new wrapper hashes and parser regression results;
- 19 real gate results and derived metrics;
- 31 mutations with expected and observed gate/reason;
- analyzer mutation matrix;
- auth/policy/communication persistence proofs;
- compiler, lint, unit, integration, and build exit codes/counts;
- physical manifest byte digests and balanced database cleanup;
- clean-tree classification after the second run.

Anything less is `FAIL`, not `PHASE_PASS`.
