# NEX ERP — One-Pass Phase Execution and Certification Standard

## Purpose

This standard minimizes auditor–executor loops. Every phase receives one complete implementation prompt and one authoritative certification command before implementation starts. The target operating loop is:

`one phase contract → one implementation pass → one certifying command → one independent rerun → PASS`

One-pass success is the engineering target, not permission to hide unknown defects. Correctness, security, authorization, data integrity, and destructive-operation safety always take precedence over speed.

## Mandatory package for every phase

Before the executor starts phase `Pxx`, the auditor prepares all of the following:

1. **Objective verdict/baseline** — current `PASS`, `FAIL`, `NOT_VERIFIED`, first failed gate, predecessor status, and immutable base SHA.
2. **Frozen acceptance contract** — exact required gates, test IDs, thresholds, environment, evidence schema, and certification command. No hidden acceptance criterion may be introduced after execution begins except a newly discovered P0/P1 safety, security, correctness, or data-loss defect.
3. **Root-cause map** — symptoms are traced to underlying implementation, verification, delivery, environment, contract, data, or architecture causes.
4. **Complete remediation map** — every root cause maps to affected contracts, database, backend, frontend, RBAC/data scope, audit, events/integrations, notes/@mention, reports/KPI, UI DNA, tests, deployment, and rollback where applicable.
5. **One-pass execution plan** — dependency-ordered implementation steps with exact files/components to inspect, prohibited shortcuts, and completion conditions.
6. **Adversarial acceptance suite** — positive, validation, authorization, negative, mutation, idempotency, concurrency, rollback, regression, and failure-injection coverage appropriate to the phase.
7. **Single authoritative certification runner** — one default command with no certifying fast/skip/cached-artifact mode. It is fail-closed and emits a SHA-bound result.
8. **Pre-certification checklist** — all prerequisites, environments, services, migrations/data, tests, UI evidence, operations, and documentation checked before handoff.
9. **Evidence requirements** — raw commands, exit codes, numeric results, environment/tool versions, durations, hashes/digests, deltas, artifacts, and remaining failures.
10. **Independent reproduction rule** — PASS requires the auditor to rerun the unchanged certification contract against the same candidate SHA.

## Acceptance-contract freeze

- The phase registry records `certification_command` and `certification_success` before the executor claims completion.
- The prompt names the acceptance-contract version or file and candidate base SHA.
- The executor must not weaken, delete, bypass, or rewrite the certification runner, thresholds, required mutation IDs, or evidence checks merely to obtain PASS.
- Necessary test/gate changes require an explicit change ledger explaining why the contract was wrong and must themselves pass adversarial review.
- When the unchanged runner exits `0`, prints the declared PASS token, binds it to the candidate SHA, and the auditor independently reproduces it, the auditor accepts the phase without adding ordinary new criteria.
- A newly discovered P0/P1 issue may stop certification even if the runner passed. The auditor must add a reproducing test and update the contract transparently; this exception cannot be used for preference changes or scope expansion.

## Root-cause and remediation coverage matrix

Each finding must contain:

| Field | Required content |
|---|---|
| ID/severity | Stable ID and P0–P3 severity |
| Reproduction | Exact command/input and observed result |
| Root cause | Why the system or gate permits the failure |
| Blast radius | Requirements, domains, roles, data, screens, integrations, reports, operations |
| Repair method | Concrete technical approach, not only expected outcome |
| Files/owners | Expected owning files/modules/contracts and accountable owner |
| Positive proof | Expected valid behavior |
| Negative/adversarial proof | Mutation or invalid behavior that must fail |
| Regression proof | Earlier certified behavior that must remain green |
| Deploy/reversal | Migration, compatibility, feature flag, rollback/roll-forward, recovery |
| Evidence | Machine-readable result and human-review artifact |

No finding may be silently deferred. A deferral requires an allowed canonical scope decision; otherwise the phase remains FAIL.

## Certification-runner requirements

The single phase runner must:

1. certify one immutable candidate SHA and record its reviewed merge base;
2. use a safe clean copy without shared dependencies or build artifacts;
3. fail on missing tools/services, ambiguous output, timeout, worker crash, unexpected skip, stale evidence, or environment boot failure;
4. execute prerequisites and earlier fast gates;
5. execute every phase-required test and independently verify every gate;
6. require real source/runtime-derived truth instead of trusting manually maintained summaries;
7. execute phase-specific adversarial mutations through the same production code path used in CI;
8. verify no source checkout, external data, or unrelated user work was damaged;
9. produce a structured evidence artifact containing all raw result metadata;
10. emit a token shaped like `Pxx:<candidate-sha>:CERTIFIED_PASS` only when every required check passes.

Diagnostic modes may exist, but they must exit non-zero or clearly emit `NON_CERTIFYING`. No partial result is equivalent to PASS.

## Mandatory cross-cutting test lenses

Every phase prompt explicitly evaluates each lens as `REQUIRED` or `NOT_APPLICABLE` with rationale:

- canonical contract and traceability;
- database migration, seed, backfill, integrity, reconciliation, rollback/roll-forward;
- backend rules, state transitions, money/rounding, idempotency and concurrency;
- API schema, errors, compatibility and pagination/filter/export where relevant;
- authentication, authorization, tenant/data scope, maker-checker and PII;
- immutable audit, actor-at-event, notes/comments/attachments/@mention and notifications;
- integrations/events/webhooks, retry/deduplication/out-of-order/DLQ/degraded provider;
- frontend live-data behavior, all UI states, accessibility, responsiveness and browser behavior;
- mandatory `@/components/dna` composition and visual/golden-reference evidence;
- reporting/KPI formula, grain, lineage, access, freshness and reconciliation;
- architecture ownership, boundaries, unused/orphan/dead/duplicate code, complexity and dependency direction;
- security, secrets, dependency/container/static/dynamic checks appropriate to the change;
- performance, observability, alerts, health/readiness, failure recovery and resource limits;
- production build/container/deployment/runbook and safe reversal.

## Executor persistence and stop conditions

The executor is instructed to continue autonomously through implementation, test, diagnosis, repair, and rerun until the certification command passes. It must not stop after writing a plan, after a partial suite passes, or after producing an evidence narrative.

The executor may stop without PASS only for:

1. a material unresolved business decision;
2. missing authority or secret that cannot safely be inferred;
3. an unavailable external system required for real proof;
4. a destructive operation requiring explicit approval;
5. a repeated tool/environment failure for which safe alternatives are exhausted.

In that case it returns the exact blocker, completed work, failing command, preserved state, and shortest user action needed. It must never fabricate PASS.

## Pre-certification checklist

Before handoff, the executor confirms:

- predecessor is PASS and candidate/base SHA are recorded;
- tracked candidate state is committed and the scope ledger explains all changed paths;
- contracts and traceability precede implementation changes;
- every remediation-map item is closed with positive and negative proof;
- all phase tests plus earlier fast gates pass on a clean copy;
- no unexpected skip/retry/quarantine/only/OOM/timeout exists;
- migrations and data totals are reproducible and reversible where applicable;
- RBAC/data scope/audit/communication/event side effects are proven;
- affected UI uses DNA and has complete state/a11y/responsive evidence;
- architecture and debt deltas do not regress;
- production build/container/runtime/health and required E2E pass;
- deploy, rollback/roll-forward, monitoring, and incident notes exist;
- evidence is generated from raw results and bound to the same SHA;
- the authoritative command exits `0` and emits the expected certification token.

## Auditor response guarantee

For the frozen phase contract, the auditor will use the same authoritative command and declared manual review items. If the unchanged candidate independently reproduces the SHA-bound PASS and no new P0/P1 defect is discovered, the phase is accepted as PASS and progression may continue. Ordinary preferences or previously undisclosed non-critical criteria cannot be used to force another revision.

