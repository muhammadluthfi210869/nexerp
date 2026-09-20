# Prompt Template — NEX ERP Phase {{PHASE_ID}} Fast One-Pass Execution

Implement **{{PHASE_ID}} — {{PHASE_NAME}}** until its focused acceptance passes. This is an execution task; do not stop for plan approval or partial-green reporting.

## Read first

1. `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`
2. `docs/legacy-erp/AGENTS.md`
3. the `{{PHASE_ID}}` row in the roadmap and registry
4. `{{ACCEPTANCE_CHECKLIST_PATH}}`
5. `{{REMEDIATION_MAP_PATH}}`
6. only the canonical contracts traced to this phase

## Scope

- Objective: `{{BUSINESS_OBJECTIVE}}`
- In scope: `{{IN_SCOPE}}`
- Out of scope: `{{OUT_OF_SCOPE}}`
- Known P0/P1: `{{KNOWN_BLOCKERS}}`
- P2/P3 backlog is non-blocking.

## Required method

1. Preserve unrelated work.
2. Inventory all phase failures once before editing.
3. Repair by root-cause group and dependency order.
4. Run the smallest related test while editing.
5. Complete each business subphase and its focused test:

`{{SUBPHASES_AND_TARGETED_COMMANDS}}`

6. After every subphase is green, run exactly one thin final command: `{{FINAL_VERIFY_COMMAND}}`.
7. If it fails, isolate and fix the owning subphase, rerun that focused test, then allow one final-command rerun.
8. Finish when scoped acceptance passes and no P0/P1 remains.

## Prohibited

- do not create/run `certify_pXX_phase.*` or `diagnose_pXX_phase.*`;
- do not create SHA/base/candidate validation, PASS tokens, evidence digests, gate engines, mutation frameworks or generated evidence systems;
- do not rerun historical phase certifiers or every old phase suite;
- do not use full final verification as a debugger;
- do not run Docker/deploy/load/browser/DR work outside its owning phase;
- do not perform repo-wide cleanup or block on P2/P3 perfection;
- do not weaken/delete/skip frozen acceptance behavior;
- do not overwrite unrelated user changes.

## Time budget

- related test: normally under 60 seconds;
- subphase suite: normally under 120 seconds;
- database golden thread: normally under 240 seconds;
- final verification: normally 5–10 minutes;
- maximum normal correction cycle: one.

## Handoff

Return concise results only:

- business capabilities completed;
- changed paths grouped by area;
- targeted commands with numeric results and durations;
- final verification result;
- P0/P1 remaining: must be zero;
- P2/P3 backlog: record without blocking.
