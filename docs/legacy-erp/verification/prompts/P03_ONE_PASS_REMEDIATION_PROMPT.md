# Prompt — P03 One-Pass Remediation

You are the implementation owner for NEX ERP Phase P03. Remediate every P03 blocker in one coordinated pass. Do not merely make the existing audit print PASS.

## Mandatory reading order

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/evidence/batches/P03-P03_BATCH_REVERIFICATION_R3_2026-09-18.md`
3. `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml` — P03 only
4. `docs/legacy-erp/process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` — P03 and test architecture
5. `docs/legacy-erp/verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md`
6. `docs/legacy-erp/verification/_UI_DNA_COMPLIANCE_STANDARD.md`
7. Existing P03 scripts, CI workflow, debt baseline, exception registry, and implementor evidence.

Treat the R3 report as the complete defect ledger. Resolve every P03 phase-gate portion of **R3-B1 through R3-B9**; explicitly schedule the heavy Docker/runtime/clean-room/deployed-E2E portions at their integration or release checkpoint rather than executing them now.

## Non-negotiable implementation constraints

- Preserve all existing user work. Do not reset, delete, discard, or overwrite unrelated dirty/untracked files.
- Capture `HEAD`, merge base, and `git status --short` before editing. Produce a path-level scope/impact ledger.
- Do not use `npm install` fallback, `--force`, `--legacy-peer-deps`, shared `node_modules`, junctions, symlinks, cached build artifacts, synthetic PASS overrides, or `CI`-dependent shortcuts in certifying paths.
- Do not weaken thresholds or expand baselines/exceptions to pass.
- Do not trust `_LIFECYCLE_REGISTRY.json` as reachability/coverage truth; derive truth from source and compare/regenerate the registry.
- P03 phase certification does not require Docker image build/runtime or deployment. Validate container definitions statically; real images and runtime smoke are deferred to the integration/release checkpoints.
- Do not mark P03 PASS or P04 certifiable until every final acceptance check has genuinely passed against one immutable commit.

## Required implementation sequence

1. Repair root dependency compatibility and synchronize all lockfiles so plain root/backend/frontend `npm ci --ignore-scripts=false --no-audit` succeeds.
2. Remove the unsafe shared-dependency/junction behavior and CI artifacts-only bypass from the old clean-checkout verifier. The bounded P03 phase runner uses parallel lockfile dry-runs plus real type/lint/unit/build commands; full clean-room installation is deferred to an integration checkpoint.
3. Make `unit_smoke` execute real Jest/Vitest commands with machine-readable counts and fail closed. Prove removal of generated Prisma client causes failure.
4. Keep P03 container scope to deterministic static Dockerfile/Compose validation. Do not wait for a Docker daemon, build images, start containers, deploy, or run deployed E2E in this phase.
5. Correct architecture ratchets: changed-code duplication <=1% regardless of changed-file count; changed functions <=10 or governed 11–15; no ungoverned >15; zero new lint warning on changed lines; whole-codebase debt cannot increase. Resolve the diff base explicitly rather than hard-coding it.
6. Build a source-derived dependency/reachability graph covering imports/exports, Nest registrations, Next routes, jobs, events, Prisma access, and package usage. Use it for boundary, unused, orphan, and coverage gates; regenerate and compare the lifecycle registry.
7. Expand DNA scanning to each screen's complete production dependency closure. Resolve aliases/re-exports; detect all interactive elements, hardcoded visual forms, and semantic primitive duplication. Make exceptions occurrence-scoped with stable fingerprints.
8. Add the bounded mutation IDs required by `certify_p03_phase.js`. Invoke the same production paths used by CI and assert non-zero exit plus the correct failed gate; record release-depth Docker/runtime mutations for the later checkpoint.
9. Repair evidence generation so it is produced from raw machine results bound to one SHA. Correct all commit-SHA, warning/exception, duplication, and zero-waiver contradictions.
10. Run the bounded P03 phase command below. Heavy clean-room, Docker runtime, deployed E2E, load, browser matrix, and DR remain explicit later-checkpoint obligations and are not P03 blockers.

## Required handoff

Return:

1. candidate SHA and base SHA;
2. changed-file scope ledger and explanation for every non-P03 path;
3. R3-B1..B9 remediation table with exact files changed;
4. raw command, exit code, duration, and numeric result for every acceptance check;
5. parallel root/backend/frontend lockfile dry-run proof;
6. proof that unsafe junction/shared-dependency behavior and CI artifact bypass were removed;
7. before/after debt metrics for lint, duplication, complexity, architecture exceptions, and DNA exceptions;
8. negative-test list and result for every new bypass scenario;
9. static Dockerfile/Compose validation result and the recorded later checkpoint owner;
10. remaining failures, without changing P03 to PASS if any item is incomplete.

Definition of done is the updated bounded P03 phase acceptance sequence in R3 passing independently. A green result from the old 21/21 or 36/36 suite alone is explicitly insufficient.

## Single authoritative finish command

After implementing and committing every remediation, run exactly:

```text
node scripts/ssot/certify_p03_phase.js
```

Do not stop, hand off, or claim completion unless this command exits `0`, prints `PHASE_PASS`, and produces `P03:<candidate-sha>:PHASE_PASS`. This bounded runner performs parallel phase-level checks and deliberately excludes Docker runtime/deployment and release-depth suites.
