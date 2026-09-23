# NEX ERP — Fast Delivery Execution Standard

**Status:** ACTIVE and mandatory for P07 onward, future feature work, and all later chats/agents.  
**Priority:** this file overrides older verification-process instructions when they conflict about certifiers, diagnostics, SHA binding, evidence machinery, mutation frameworks, rerun cadence, or blocking severity. Runtime business authority remains `contracts/00_MASTER_SPEC.md §9.1`.

Decision history and root-cause record: `../process/_DELIVERY_PROCESS_POSTMORTEM_AND_DECISION_2026-09-20.md`.

## Product objective

Finish a usable, correct ERP as quickly as practical. Engineering quality supports delivery; it is not an independent pursuit of perfection. A phase exists to deliver a coherent business capability, not to behave like a standalone release certification.

The default loop is:

`inventory once → implement by business subphase → targeted tests → one thin final verification → one audit → continue`

## Operating target

Optimize for **maximum usable business output per elapsed hour**, not maximum checks per phase. The intended balance is approximately `9/10`: strong protection for business-critical behavior with deliberately limited ceremony. A theoretical `10/10` per phase is not a target because it delays usable ERP delivery and still cannot eliminate all future regressions.

Use this priority order whenever time and quality compete:

1. protect data, money, inventory, credentials, authorization and tenant boundaries;
2. make the primary user workflow correct and usable end to end;
3. preserve the contracts/interfaces actually affected by the change;
4. keep touched code reasonably maintainable;
5. defer unrelated cleanup, speculative hardening and cosmetic perfection.

Success means the capability is usable, its material risks are covered, and the next change remains practical. It does not mean the repository has zero warnings, zero debt or exhaustive proof at every layer.

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

The phase brief should fit on roughly one page and normally contain no more than five primary acceptance behaviors. Split a larger capability into internal subphases; do not expand the acceptance checklist indefinitely.

## Phase design workflow

Design each phase in this order before giving it to an executor:

1. **Business outcome:** describe what a real user can complete when the phase is done.
2. **Canonical trace:** identify only the requirement, business-rule, workflow, ownership, RBAC, API, screen and event IDs touched by that outcome.
3. **Change-impact map:** list touched interfaces, consumers, tables and predecessor smoke tests. Do not load or retest unrelated domains.
4. **Risk tier:** choose `LOW`, `MEDIUM` or `HIGH` using the highest material risk in scope.
5. **Acceptance freeze:** define at most five observable primary behaviors plus explicit P0/P1 conditions.
6. **Subphase graph:** create three to six dependency-ordered vertical business slices with an owner, touched paths, focused command and completion condition.
7. **Seam map:** identify where subphases exchange data or control. Give each material seam one contract/integration assertion.
8. **Final composition:** define one thin `verify:pXX` that only composes the already selected native commands.

Prefer vertical slices such as `create order → authorize → persist → display status` over layer-only batches such as `all repositories → all services → all controllers`. A vertical slice produces usable behavior earlier and exposes interface mistakes sooner.

Do not start implementation when the business outcome, affected contract or destructive-data choice is genuinely ambiguous. All other minor uncertainty should be resolved through the narrowest reasonable assumption and recorded in the phase brief.

## Subphase contract

Each subphase must state only:

- observable behavior completed;
- dependencies and affected interfaces;
- paths expected to change;
- smallest test command that proves the behavior;
- completion condition;
- whether it can run independently or must wait for a frozen interface.

Subphases are implementation units, not mini certification projects. Do not give them separate evidence engines, full builds, SHA checks or exhaustive test matrices.

## Risk-tier test selection

Use the smallest proof appropriate to the risk. Not every phase receives the same test package.

| Tier | Typical change | Minimum sufficient proof |
|---|---|---|
| `LOW` | documentation, copy, isolated visual composition, non-behavioral configuration | related static/component test and affected typecheck; no database golden thread |
| `MEDIUM` | normal CRUD, search/filter, dashboard query, non-financial workflow, ordinary API/UI behavior | related unit/component tests plus one production-service integration; focused UI behavior test when UI changes |
| `HIGH` | auth/tenant scope, destructive operation, migration, finance/inventory balance, audit/outbox atomicity, idempotency/concurrency | production-service tests plus one real disposable-database golden thread and the smallest relevant negative/concurrency case |

Do not test framework/library behavior, trivial getters, static DTO shape already enforced by typecheck, or the same invariant at several layers without a demonstrated regression risk. Coverage percentage is diagnostic, not a normal phase target.

When one integration test proves several steps of the same business thread, prefer it over many overlapping micro-tests. Add a regression test only for an observed defect or a primary business invariant.

## Preventing all-green subphases from failing when combined

Focused tests alone are insufficient when subphases communicate. Prevent late integration surprises with three inexpensive controls:

1. freeze shared request/response/event/schema shapes before parallel implementation;
2. add one assertion at each material seam, preferably against the real production service rather than a duplicate fake;
3. run one phase-level golden thread after all subphases are green.

The golden thread should traverse only the phase's primary flow, for example `screen/action → API → business rule → transaction → audit/event → returned state`. It is not a full-system E2E suite. For `LOW` risk it may be omitted; for `MEDIUM` use a lightweight production-service integration; for `HIGH` use the smallest real disposable-database path that proves the invariant.

Mocks are allowed at external network/provider boundaries. Do not mock the business rule, transaction, authorization decision or persistence behavior that the test claims to prove.

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

Time budgets are decision triggers, not reasons to hide failures. When a command exceeds its budget:

1. identify whether the cost is environment startup, compilation, fixture setup or test behavior;
2. cache/reuse only safe immutable setup;
3. run the smallest owning test during repair;
4. split an oversized suite by business responsibility;
5. retain one final composition run after targeted green.

Do not replace deterministic correctness with arbitrary sleeps or weaker assertions merely to meet the budget.

## Environment readiness

Environment failures do not count as implementation correction cycles. Before implementation timing begins, perform only the prerequisites actually needed by the phase:

- supported runtime/package manager is available;
- dependencies for touched packages are installed;
- required generated client/types exist or are generated once;
- required local database/service is reachable;
- disposable database naming and cleanup are safe for a `HIGH`-risk data test;
- required environment variables are present without printing their values.

Use existing native commands for these checks. Do not create a generic diagnose CLI, evidence report or new health framework.

## Revision and acceptance freeze

- Maximum normal correction cycle per phase: one.
- Acceptance behavior is frozen before implementation.
- The executor may add implementation tests but may not delete, skip, weaken or rewrite the frozen acceptance behavior to pass.
- The auditor may introduce a new blocker after execution starts only for a reproducible P0/P1 issue.
- New P2/P3 discoveries go to backlog and cannot force R2/R3/R4 cycles.
- An imperfect harness must be simplified or fixed; it must not become a new product requirement.

## Parallel work

Parallelize only isolated subphases with disjoint files, schemas, ports and databases. Shared contracts, schema, generated types, transaction services and integration seams remain sequential. One executor owns the final integration.

Maximum work in progress is two implementation lanes:

1. current-phase backend/data/business flow;
2. current-phase UI after API freeze, or read-only inventory for the next phase.

More than two lanes requires explicit evidence that merge/coordination cost is lower than the expected time saved. The next phase may be researched in parallel but may not change shared contracts, schema or APIs before the current phase freezes its boundary.

Parallelize when paths and interfaces are independent. Keep work sequential when it touches the same schema, canonical contract, generated type, transaction boundary, API shape or shared state machine. Backend and UI may proceed in parallel only after their interface is frozen; one owner performs final integration.

Allowed next-phase parallel work is limited to contract reading, inventory, risk classification and draft acceptance. Implementation of the next phase waits if it can invalidate the current phase's shared boundary.

## Waste controls

- Do not rerun a passing command when neither its inputs nor dependencies changed.
- Do not add a shared helper/framework until the same need has appeared in at least three places; before that, keep the test local and simple.
- Keep one source of test fixtures per domain and reuse it; avoid large general-purpose harnesses.
- Prefer deterministic barriers/fake clocks over sleeps.
- Profile a slow test once; do not repeatedly tolerate unexplained setup/build work.
- Delete or consolidate tests that prove the same behavior through the same path.
- Stop phase work immediately after acceptance and P0/P1 closure; do not use spare context/time for opportunistic refactoring.

Also avoid these common sources of false quality:

- testing library/framework behavior instead of NEX business behavior;
- asserting implementation details that can change without affecting users;
- duplicating the same invariant in unit, integration, E2E and mutation form without distinct risk coverage;
- writing large generalized harnesses for one phase;
- counting mocks, hard-coded metrics or PASS labels as production-path proof;
- allowing an executor to weaken, skip or rewrite acceptance after seeing failures;
- reopening an accepted phase for P2/P3 discoveries.

## Delivery metrics

After each phase record only:

- elapsed implementation time;
- focused verification duration;
- first-pass result;
- number of correction cycles;
- escaped P0/P1 found by the auditor;
- number of P2/P3 items deferred;
- commands exceeding their time budget.

Use these numbers to improve the next phase. Do not create a reporting system or evidence database for them; a short Markdown row is sufficient.

Use the following adaptation rules:

- more than one correction cycle: inspect acceptance ambiguity, seam coverage and executor discipline before adding tests;
- final verification over ten minutes twice: split it or remove redundant setup/tests;
- repeated escaped P0/P1: strengthen only the owning risk test or seam, not the whole repository;
- consistently zero escaped P0/P1: do not add ceremony;
- repeated model confusion: shorten scope and improve canonical references before changing provider;
- phase repeatedly exceeds one working session: reduce acceptance scope or divide the capability into smaller vertical phases.

Suggested ledger row:

`| Phase | Risk | Implementation | Focused verify | First pass | Corrections | Escaped P0/P1 | Deferred P2/P3 | Over-budget commands |`

## Checkpoints

Cumulative integration is performed after P10, P15, P19 and P22 using existing native suites and business golden threads. Checkpoints still do not create bespoke certifiers, diagnose CLIs, SHA tokens or evidence engines.

- P10: P07–P10 commercial/procurement integration.
- P15: operational-to-finance reconciliation.
- P19: product-wide UI/DNA/accessibility polish.
- P22: release/UAT readiness, security, performance, deployment and recovery evidence.

Checkpoint tests are selected by changed business threads and shared risks, not by blindly rerunning every historical phase command. Every accepted focused regression test remains in its normal framework suite so checkpoints can compose existing tests without recreating phase machinery.

When a checkpoint fails, map the failure to its owning domain, repair through that domain's focused test, and rerun only the affected checkpoint thread before one final checkpoint run.

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

## Auditor contract

The auditor verifies the frozen acceptance, material seam/golden thread, affected quality checks and scoped P0/P1 status. The auditor must:

- reproduce existing focused commands rather than invent a second harness;
- report one consolidated set of findings grouped by root cause;
- distinguish product defect, test defect and environment defect;
- provide a concrete remediation map for every P0/P1;
- avoid expanding scope with preferences or P2/P3 cleanup;
- accept the phase after the frozen criteria pass and no scoped P0/P1 remains.

An auditor finding is not blocking merely because it is technically valid. It blocks only when it meets the P0/P1 definition in this standard.

## Executor handoff contract

The executor returns a short handoff containing:

- completed user-visible capabilities;
- changed paths grouped by backend/frontend/database/contracts;
- focused commands, numeric outcomes and durations;
- phase golden-thread and thin verification results where applicable;
- remaining P0/P1, which must be zero;
- deferred P2/P3;
- deviations from the phase brief and why they were necessary.

Do not return invented certification claims, hashes, token strings, giant walkthroughs or generated evidence packs.

## Operational checklist

Before execution:

- [ ] business outcome and scope fit on roughly one page;
- [ ] no more than five primary acceptance behaviors;
- [ ] risk tier and minimum proof are declared;
- [ ] three to six subphases and material seams are mapped;
- [ ] environment prerequisites are ready;
- [ ] shared interfaces are frozen before parallel work.

During execution:

- [ ] one inventory and root-cause grouping is performed;
- [ ] smallest owning test is used while editing;
- [ ] passing unchanged tests are not rerun;
- [ ] P2/P3 is recorded without interruption;
- [ ] maximum work in progress remains two lanes.

Before progression:

- [ ] every scoped acceptance behavior passes;
- [ ] material seam assertions and required golden thread pass;
- [ ] thin `verify:pXX` passes naturally;
- [ ] no scoped P0/P1 remains;
- [ ] short handoff and metrics row are recorded;
- [ ] work stops without opportunistic expansion.

## Model routing

- complex cross-stack/long-context phase: MiniMax M3 max or the strongest available long-horizon coding model;
- backend/database targeted work: DeepSeek V4.1 medium or stronger;
- small frontend/documentation/targeted fixes: Gemini 3.8 Flash;
- do not switch models mid-phase unless the current executor is technically blocked.

Process discipline matters more than provider choice.

Use the model as a role fit, not as a substitute for scope discipline:

- one primary executor owns the phase and integration;
- a fast model may inventory files, draft focused tests or implement isolated UI work;
- a stronger backend model may own transactional/data/security slices;
- an auditor reviews only after the executor's focused tests are green;
- do not have several models independently redesign the same contracts;
- do not switch providers merely because a legitimate test exposed a defect.
