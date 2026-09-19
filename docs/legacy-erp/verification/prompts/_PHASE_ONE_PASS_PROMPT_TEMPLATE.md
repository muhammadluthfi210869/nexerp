# Prompt Template — NEX ERP Phase {{PHASE_ID}} One-Pass Execution

You own implementation and remediation for **{{PHASE_ID}} — {{PHASE_NAME}}**. Continue autonomously until the single authoritative certification command produces the declared SHA-bound PASS. Do not stop after planning, partial implementation, or a subset of green tests.

## Mandatory sources

Read completely before editing:

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
3. `docs/legacy-erp/verification/_LAYERED_CERTIFICATION_ACCELERATION_STANDARD.md`
4. `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml` — `{{PHASE_ID}}` and predecessor
5. `docs/legacy-erp/process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` — `{{PHASE_ID}}`
6. `{{PHASE_AUDIT_EVIDENCE_PATH}}`
7. `{{PHASE_REMEDIATION_MAP_PATH}}`
8. `{{PHASE_SPECIFIC_CONTRACTS_AND_STANDARDS}}`
9. existing implementation, tests, migrations, evidence, CI and operational files in scope

## Frozen acceptance contract

- Phase: `{{PHASE_ID}}`
- Predecessor and required status: `{{PREDECESSOR_ID}} = PASS`
- Reviewed base SHA: `{{BASE_SHA_OR_RESOLUTION_RULE}}`
- Contract version/path: `{{ACCEPTANCE_CONTRACT_PATH_OR_VERSION}}`
- Authoritative command: `{{CERTIFICATION_COMMAND}}`
- Verification level: `{{PHASE_GATE_OR_CHECKPOINT_OR_RELEASE}}`
- Required success: exit `0`, `{{EXPECTED_PASS_VERDICT}}`, token `{{EXPECTED_SHA_BOUND_TOKEN}}`
- Required tests/gates: `{{REQUIRED_TEST_AND_GATE_IDS}}`
- Required adversarial IDs: `{{REQUIRED_ADVERSARIAL_IDS}}`
- Required environment/services: `{{REQUIRED_ENVIRONMENT}}`
- Non-certifying diagnostic command: `{{DIAGNOSTIC_COMMAND}}`
- Cumulative preflight command: `{{PREFLIGHT_COMMAND}}`
- Gate/mutation groups and expected budgets: `{{LAYERED_GROUP_MAP_AND_BUDGETS}}`

Do not modify or weaken this contract to obtain PASS. If the contract itself is demonstrably defective, record the reproduction and proposed correction; do not silently change it.

## Objective baseline and verdict

- Current verdict: `{{CURRENT_VERDICT}}`
- First failed gate: `{{FIRST_FAILED_GATE}}`
- Verified passing areas: `{{VERIFIED_PASSING_AREAS}}`
- Environment limitations: `{{ENVIRONMENT_LIMITATIONS}}`
- Delivery/scope state: `{{DELIVERY_STATE}}`

## Complete remediation ledger

Resolve every entry; none may be deferred without an allowed canonical decision:

`{{ROOT_CAUSE_AND_REMEDIATION_TABLE}}`

For every item include reproduction, root cause, blast radius, concrete method, owning files, positive test, adversarial test, regression test, deploy/reversal, and evidence.

## Mandatory cross-cutting disposition

Mark each lens `REQUIRED` or `NOT_APPLICABLE` with evidence-backed rationale, then implement every required item:

`{{CONTRACT_DATA_BACKEND_API_RBAC_AUDIT_COMMUNICATION_EVENT_UI_DNA_REPORTING_ARCHITECTURE_SECURITY_PERFORMANCE_OPERATIONS_MATRIX}}`

## One-pass execution order

1. Preserve current state; record HEAD/base/status and create a path-level impact ledger.
2. Run one baseline inventory and enumerate all reproducible failures before editing; cluster them by root cause and owning gate group.
3. Resolve contract/decision ambiguity first; update canonical owners and traceability before behavior.
4. Repair shared foundations and root causes before dependent symptoms.
5. Implement database/backfill/backend/API/RBAC/audit/events/frontend/UI DNA/reports/operations in dependency order.
6. Add positive, negative, mutation, authorization, idempotency, concurrency, rollback, regression and failure tests required by the phase.
7. After each root-cause cluster, run only its production-path gate, mapped mutations, and affected regressions. Target 10–120 seconds per feedback group.
8. Once every group is green, run cumulative preflight. Do not invoke the full certifier while preflight is red or scope changed afterward.
9. Run the authoritative certifier once, repair any certification-only failure through its smallest owning group, rerun preflight, and only then rerun certification when justified.
10. Generate evidence from raw outputs, bind it to the candidate SHA, and complete the pre-certification checklist.

Phase-specific ordered details:

`{{PHASE_SPECIFIC_EXECUTION_STEPS}}`

## Prohibited shortcuts

- no test/gate/threshold weakening, synthetic PASS, stale artifacts, trusted summary metrics, fabricated evidence, skipped failures, broad exception, mock/fallback production path, or install fallback;
- no direct UI-kit/DNA-subpath import or manual primitive when UI is affected;
- no contract change solely to match an incorrect implementation;
- no unrelated-domain edits without an explicit dependency and impact explanation;
- no reset/delete/overwrite of unrelated user work;
- no PASS claim from a non-certifying diagnostic mode.
- no repeated full-certifier execution for a failure reproducible by a smaller gate/group command;
- no independent duplicate implementation of rules or thresholds in the diagnostic runner;
- no deploy, image push, Docker runtime, full browser/load/DR, or release-depth suite during a normal phase unless explicitly required by that phase's frozen contract.

## Pre-certification checklist

Complete every applicable item in `_ONE_PASS_PHASE_EXECUTION_STANDARD.md`, plus:

`{{PHASE_SPECIFIC_PRECERT_CHECKLIST}}`

## Required handoff

Return only after the authoritative command passes, with:

1. candidate/base SHA and complete changed-path scope ledger;
2. root-cause/remediation closure table;
3. cross-cutting disposition matrix;
4. raw commands, exit codes, durations and numeric results;
5. positive/adversarial/regression results;
6. data reconciliation and migration/reversal proof where applicable;
7. RBAC/audit/communication/event evidence where applicable;
8. UI DNA/a11y/responsive/visual evidence where applicable;
9. architecture/security/performance/operational deltas;
10. evidence paths and SHA-bound certification token.

If a permitted external blocker remains, do not claim completion. Return its exact reproduction, preserved state, and shortest user action required, then resume until PASS when the blocker is removed.
