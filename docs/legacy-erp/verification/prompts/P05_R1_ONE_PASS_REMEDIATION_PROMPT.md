# NEX ERP P05 — R1 One-Pass Honest Remediation Prompt

You are remediating a false-positive P05 certification. Read completely before editing:

1. `docs/legacy-erp/verification/evidence/batches/P05-P05_AUDIT_R1_2026-09-18.md`
2. `docs/legacy-erp/verification/P05_FROZEN_ACCEPTANCE_CONTRACT.md`
3. `scripts/ssot/p05_acceptance_contract.json`
4. `scripts/ssot/certify_p05_phase.js`
5. the original P05 implementation prompt and all canonical authorities it lists.

Do not modify the frozen wrapper, machine contract, frozen contract, base SHA, required IDs, or thresholds. Do not mark P05 PASS in the registry. Preserve valid P04/P05 work, but remove every synthetic or self-declared certification shortcut.

Your objective is not to make the JSON say PASS. Your objective is to make the production application and exact production controls pass, with evidence that independently proves execution.

## Mandatory remediation

Resolve every blocker `P05-R1-B1` through `P05-R1-B10` in the R1 audit together:

- delete all hardcoded P05 callbacks that return `{ pass: true }` and invoke real booted application/service/database tests;
- replace unconditional `mutationResult(status=PASS, production_path=true)` with fail-closed `expectProductionRejection` that calls the exact gate/control and matches its thrown/returned `gate_id` and `reason_code`;
- ensure every architecture fixture is inside the analyzer's explicit disposable scan root and prove the unmutated fixture passes while its mutation fails;
- fix all backend compiler errors and wire a real `PlatformModule` into Nest, including Prisma, auth/session/MFA, policy/scope, audit, approval, outbox, communication ACL, canonical global error filter, and typed fail-closed configuration;
- replace `opaque` access tokens with signed 15-minute session-bound JWTs; implement atomic one-time refresh rotation and commit family revocation on replay; test concurrency, revoke, logout-all, and reset invalidation;
- implement actual RFC 6238 TOTP verification and remove `p05-default-key`, `ERP_SECRET`, and all weak/missing-secret fallbacks;
- replace simulated “any role works,” magic actor IDs, fabricated tenants, and fabricated parent ownership with persistent actor-at-event permission/data/field scope and real parent-resource ACL resolution;
- execute immutable audit, distinct-maker/checker thresholds and concurrency, state+outbox atomicity, duplicate/retry/out-of-order/lease/DLQ, mention/notification deduplication, and canonical errors through production code against isolated PostgreSQL;
- repair the integration test so it tests services/Nest rather than raw SQL stand-ins, closes every client, leaves zero DB residue, and exits `0`;
- make `architecture_fitness_suite` run backend typecheck, lint, existing unit suite, production P05 unit/integration suite, and build; preserve full streams for parsing and store redacted evidence;
- compute complexity, duplication, unused/orphan, dependency delta, ownership/test coverage, and representative-change metrics from observed targets—never literals or `Math.max(1, ...)` target fabrication;
- write all declared manifest files and `_p05_test_results.json`, hash actual file bytes, and validate real changed paths/owners/reasons against Git.

## Required test sequence

Use targeted iterations, not repeated full certification:

1. `npx tsc -p backend/tsconfig.build.json --noEmit`
2. backend lint and existing unit suite
3. P05 production auth/MFA tests
4. policy/tenant/field-scope tests
5. audit/maker-checker tests
6. outbox/communication/error/config tests
7. architecture analyzers and three real representative-change rehearsals
8. all 31 fail-closed production-path mutations
9. backend build
10. commit candidate, confirm only generated allowlist may change, then run `node scripts/ssot/certify_p05_phase.js`

Do not count a printed assertion total if the process exits nonzero. Do not count raw SQL as service behavior. Do not count a mutation unless disabling/bypassing the corresponding control makes that mutation test fail.

## Finish condition

Continue until all R1 exit conditions are met and the unchanged committed HEAD emits:

```text
P05:<exact-HEAD-full-sha>:PHASE_PASS
```

Return the exact command outputs, compiler/lint/build/unit/integration counts, 19-gate table, 31-mutation table with observed rejection, physical evidence paths/digests, DB cleanup proof, and clean-tree proof. If any item is incomplete, report FAIL rather than PHASE_PASS.
