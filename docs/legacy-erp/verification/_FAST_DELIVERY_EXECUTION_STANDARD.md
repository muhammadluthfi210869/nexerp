# NEX ERP — Fast Delivery Execution Standard

**Status:** ACTIVE and mandatory for P07 onward, future feature work, and all later chats/agents.  
**Priority:** this file overrides older verification-process instructions when they conflict about certifiers, diagnostics, SHA binding, evidence machinery, mutation frameworks, rerun cadence, or blocking severity. Runtime business authority remains `contracts/00_MASTER_SPEC.md §9.1`.

Decision history and root-cause record: `../process/_DELIVERY_PROCESS_POSTMORTEM_AND_DECISION_2026-09-20.md`.

## Product objective

Finish a usable, correct ERP as quickly as practical. Engineering quality supports delivery; it is not an independent pursuit of perfection. A phase exists to deliver a coherent business capability, not to behave like a standalone release certification.

The default loop is:

`inventory once → implement by business subphase → targeted tests → one thin final verification → one audit → continue`

## Prohibited for normal phases

Do not create, require, copy, extend, or run any of the following for P07 onward or ordinary future feature phases:

- `certify_pXX_phase.*`, phase certifier, certification engine or `PHASE_PASS` token;
- `diagnose_pXX_phase.*`, generic diagnostic runner or selectable gate CLI;
- SHA-bound acceptance, base/candidate SHA validation, evidence digests or hash-bound tokens;
- bespoke gate registries, pass-label generators, current-SHA health ledgers or generated evidence frameworks;
- mutation/adversarial frameworks that duplicate ordinary negative business tests;
- automatic full reruns of earlier phase suites/certifiers;
- clean-working-tree requirements unrelated to product correctness;
- Docker, deployment, browser matrices, load/soak, disaster recovery or clean-room tests outside their owning late phase;
- repo-wide cleanup, warning elimination, dead-code perfection or architecture refactoring unrelated to the current capability.

Existing P03–P06 certifier/diagnostic files and tokens are historical artifacts only. Never use them as a template and never rerun them merely to advance a later phase.

## Allowed verification

Each normal phase may add only:

1. focused framework-native unit/component/integration/E2E tests;
2. simple package scripts such as `test:pXX:<subphase>`;
3. one thin `verify:pXX` script that composes already exercised commands and contains no business logic, gate logic, Git/SHA logic, evidence generation or pass fabrication;
4. a short human-readable result ledger with commands, numeric results and remaining P2/P3 backlog.

The thin final verification is not a certifier. It exits with the natural status of its component commands.

## Phase package

Before implementation, define only:

- one concise objective and explicit in/out scope;
- three to six dependency-ordered business subphases;
- a frozen acceptance checklist of observable business behavior;
- known P0/P1 blockers and one remediation map;
- exact targeted test commands and one thin final verification command;
- affected predecessor smoke tests only when the changed interface actually consumes them.

Prompts should normally be 40–100 lines. Prefer references to canonical contracts and exact commands over repeating repository-wide policy.

## Severity and blocking policy

Only these block phase progression:

- **P0:** data loss/corruption, credential exposure, critical security bypass, destructive unsafe operation, materially unbalanced financial/inventory transaction.
- **P1:** the phase's primary business flow is wrong/unusable, authorization or tenant isolation is wrong, required transaction/audit effect is incorrect, migration for changed data is unsafe, or a required acceptance test cannot pass reproducibly.

These do not block a normal phase unless they directly cause P0/P1:

- **P2:** maintainability improvement, incomplete non-critical coverage, historical warnings/debt, minor performance concern, weak evidence formatting, local duplication or non-critical fallback outside touched flow.
- **P3:** naming, formatting, documentation polish, optional refactor, cosmetic issue or preference.

P2/P3 findings are recorded in backlog and the project continues. Zero warnings, zero technical debt, perfect coverage and ideal architecture are not per-phase requirements.

## Test and time budget

- test while editing: the smallest related test, normally under 60 seconds;
- targeted subphase suite: normally at most 120 seconds;
- database golden-thread test: normally at most 240 seconds;
- final `verify:pXX`: normally 5–10 minutes;
- one executor final-verification run after targeted green; one rerun is allowed only after a real fix;
- one independent auditor run of the same focused commands.

If a command fails twice without code/environment change, stop repeating it and investigate. Do not use the complete final verification as a debugger.

## Revision and acceptance freeze

- Maximum normal correction cycle per phase: one.
- Acceptance behavior is frozen before implementation.
- The executor may add implementation tests but may not delete, skip, weaken or rewrite the frozen acceptance behavior to pass.
- The auditor may introduce a new blocker after execution starts only for a reproducible P0/P1 issue.
- New P2/P3 discoveries go to backlog and cannot force R2/R3/R4 cycles.
- An imperfect harness must be simplified or fixed; it must not become a new product requirement.

## Parallel work

Parallelize only isolated subphases with disjoint files, schemas, ports and databases. Shared contracts, schema, generated types, transaction services and integration seams remain sequential. One executor owns the final integration.

## Checkpoints

Cumulative integration is performed after P10, P15, P19 and P22 using existing native suites and business golden threads. Checkpoints still do not create bespoke certifiers, diagnose CLIs, SHA tokens or evidence engines.

- P10: P07–P10 commercial/procurement integration.
- P15: operational-to-finance reconciliation.
- P19: product-wide UI/DNA/accessibility polish.
- P22: release/UAT readiness, security, performance, deployment and recovery evidence.

## Completion rule

A normal phase is complete when:

- its scoped acceptance checklist passes;
- its targeted backend/frontend/database tests pass naturally;
- affected typecheck/lint/build checks pass without new phase-owned errors;
- one business integration smoke/golden thread passes where applicable;
- no open P0/P1 exists in phase scope;
- remaining P2/P3 items are recorded;
- the auditor reproduces the focused result without expanding ordinary criteria.

Then continue immediately to the next phase. Do not wait for perfection.

## Model routing

- complex cross-stack/long-context phase: MiniMax M3 max or the strongest available long-horizon coding model;
- backend/database targeted work: DeepSeek V4.1 medium or stronger;
- small frontend/documentation/targeted fixes: Gemini 3.8 Flash;
- do not switch models mid-phase unless the current executor is technically blocked.

Process discipline matters more than provider choice.
