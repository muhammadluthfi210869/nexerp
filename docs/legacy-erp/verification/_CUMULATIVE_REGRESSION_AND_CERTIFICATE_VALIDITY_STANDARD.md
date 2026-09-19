# NEX ERP — Cumulative Regression and Certificate Validity Standard

## Purpose

This standard prevents a later phase from silently invalidating an earlier phase without forcing every historical full certifier to run after every change.

The system maintains two different truths:

1. **Phase certificate** — immutable proof that one committed candidate SHA passed one frozen phase contract. Later changes do not rewrite this history.
2. **Integrated health** — current-HEAD proof that all permanent invariants affected by later changes still pass.

A historical certificate may remain valid for its candidate while current integrated health is red. Progression and release decisions use integrated health, not token existence alone.

## Permanent fast sentinels

Every phase must export a permanent, production-path sentinel suite that protects its durable invariants. A sentinel is not a second or weaker implementation of the phase rule; it calls the same analyzer, contract test, service test or schema assertion used by the phase.

Each sentinel records:

- owning phase and invariant ID;
- owning contracts and production paths;
- consumed and exported interfaces;
- change triggers and downstream consumers;
- command, expected target count and duration;
- positive and adversarial test IDs;
- last passing integrated SHA.

Expected duration is normally 10–120 seconds per impacted group. A phase that cannot provide fast sentinels must explain why and may be selected for a heavier rerun.

## Mandatory always-on foundation sentinels

Every phase from P03 onward runs these once in cumulative preflight:

1. P01 SSOT parse/reference/decision integrity.
2. P02 source-derived lifecycle delta: models, migrations, APIs, screens, controllers, services, modules, jobs, events, dependencies, barrels, adapters and reachability.
3. P03 changed-scope build/type/lint plus architecture and UI DNA boundaries.
4. Secret/credential-pattern scan with approved fixture/example classification.

Conditional foundation sentinels:

- P04 migration/schema sentinel when Prisma schema, migrations, persistence models, database configuration or compatibility adapters change.
- P05 platform-control sentinels when auth, session, MFA, RBAC, scope, audit, approval, outbox, communication, configuration, errors, or any governed consumer changes.

These sentinels are cumulative controls. Later phases may add objects only when P02 derives and classifies them in the same candidate; manually preserved old registry counts are forbidden.

## Impact selection

Before edits, the phase diagnostic produces a source-derived impact manifest. Selection is the union of:

- changed files and symbols;
- contract/traceability owners;
- schema models, migrations and foreign-key consumers;
- imported/exported module graph;
- API callers and frontend consumers;
- workflow/event producers and subscribers;
- policy/scope/audit/outbox/configuration consumers;
- DNA component dependency closure;
- explicitly declared compatibility adapters and downstream phases.

Every selected sentinel must run. A zero-target result when an applicable change exists fails closed. The executor may not hand-edit the impact set to suppress a test.

## Certificate invalidation rules

A historical phase certifier is rerun only when at least one condition is true:

1. its frozen contract, wrapper, threshold, required ID or evidence validator changed;
2. a production path or invariant owned by that phase changed;
3. an exported interface consumed by another phase changed incompatibly;
4. one of its sentinels fails or cannot determine impact;
5. a new P0/P1 finding reproduces inside its certified scope;
6. an integration checkpoint explicitly requires the full suite.

Otherwise its historical SHA-bound certificate remains historical evidence and only its selected sentinel participates in current-HEAD preflight.

## Integration health ledger

Every committed phase candidate generates one current-HEAD ledger containing:

- candidate SHA and predecessor integration-baseline SHA;
- changed paths and derived impact graph digest;
- all selected phase/sentinel IDs and why they were selected;
- pass/fail/not-applicable results with targets and durations;
- historical certificates reused without rerun and the reason reuse is safe;
- certificates invalidated and exact rerun requirement;
- schema/contract/API/event/DNA compatibility deltas;
- open P0/P1 issues and external owner actions;
- overall `INTEGRATED_GREEN` or `INTEGRATED_RED` verdict.

No phase can certify when this ledger is red, stale, manually incomplete, or bound to another SHA.

## Checkpoint cadence

| Cadence | Scope | Typical timing |
|---|---|---|
| Every edit/cluster | Selected L1/L2 sentinel only | 10–120 seconds |
| Every phase admission | All impacted sentinels plus current phase preflight | normally 5–10 minutes |
| Integration checkpoint | Complete cumulative fast suite, affected golden threads, migration/API/event/UI seams | after P05, P10, P15, P19 and P22, or after a major boundary change |

Full clean-room, all-browser, load/soak, deployment and DR remain P20–P22 work. Checkpoints are not excuses to run every historical full certifier serially; independent groups run in bounded parallel workers and reuse one safe setup per group.

## Failure behavior

When an earlier sentinel fails during a later phase:

1. mark integrated health red and identify the first failed invariant;
2. keep the historical certificate intact as history;
3. repair the current change and the stale derived artifact together;
4. rerun the failed sentinel and its dependency closure;
5. rerun cumulative preflight once;
6. rerun an old full certifier only if an invalidation rule requires it.

Do not discover regression by waiting for a later five-phase manual audit. CI must execute the impact-selected sentinels on every candidate.

## Current P01–P06 recovery application

The current P02 regression is a missing cumulative sentinel failure: P04/P05/P06 added models, migrations, services, modules and barrels without regenerating/revalidating lifecycle reconciliation.

Recovery order:

1. reach a known committed P06 implementation checkpoint without claiming certification;
2. regenerate P02 lifecycle data from current source and obtain 14/14 positive plus 40/40 negative tests;
3. resolve or explicitly retain the external P04 credential hold—implementation work may continue, but integrated certification and production readiness remain red until rotation/revocation proof exists;
4. run one P01–P06 foundation checkpoint, including P03 changed-scope and affected P05 platform sentinels;
5. bind the green integration ledger to the P06 candidate SHA;
6. run P06 certification and independent reproduction once each.

This recovery is one cumulative checkpoint, not six serial full-certifier reruns.
