# P07 Frozen Acceptance Contract

**Phase:** P07 — CRM, Marketing, Guest Book, and BusDev  
**Contract version:** `P07-v1`, frozen 2026-09-20  
**Final verification command:** `npm run verify:p07`
**Success:** natural exit `0`; all focused backend, frontend, PostgreSQL golden-thread, affected build/type/lint and cleanup checks pass

## Purpose and finish line

P07 is complete when one real, tenant-safe golden thread proves:

`lead intake/guest book → deterministic dedup → consent and attribution → owner assignment/reassignment → follow-up/SLA → qualification → qualified commercial-opportunity handoff`

The same transactions must reconcile in CRM/BusDev/marketing dashboards and produce the required immutable audit and outbox effects exactly once.

## Frozen scope

In scope:

- canonical lead, lead-detail/contact/activity, guest-book, ownership, pipeline stage, follow-up/SLA, consent, attribution, marketing activity/task and P07 dashboard behavior;
- CRM, marketing, guests/guest-book, lead-capture and BusDev modules and their affected screens;
- P05 platform controls and P06 master references used by these workflows;
- contract/traceability corrections needed to establish one authority per concept;
- live internal APIs, canonical DNA composition and loading/empty/error/denied/success UI states.

Out of scope:

- sample/formulation/artwork/legal workflows (P08);
- quotation, SO, DP, delivery, invoice, receipt and returns (P09);
- real provider/webhook/outage hardening, scheduler reliability and external connector certification (P17);
- repo-wide warning cleanup, Docker, deployment, load testing, browser matrix and release-depth security/DR work.

External marketing/communication providers may use the existing adapter boundary in tests. Production code may not contain mock success or fallback data.

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `contract_inventory` | Every P07 entity/API/screen/permission/workflow/event has a canonical owner and traceability; aliases/duplicates are consolidated or explicitly adapted. |
| `lead_intake_dedup_consent_attribution` | Normalized phone/email/external identity dedup works under retry and concurrency; consent and attribution history are preserved rather than overwritten. |
| `ownership_reassignment_visibility` | Assignment and reassignment obey canonical roles, tenant/data scope and actor-at-event audit; unauthorized and cross-tenant access fail. |
| `lifecycle_sla_idempotency_concurrency` | Only legal stage transitions occur; follow-up due/overdue uses one time policy; repeated and concurrent commands create one business effect. |
| `guestbook_marketing_activity` | Guest-book intake/reporting and required marketing activities/tasks are persisted, searchable and connected to the canonical lead without a parallel source of truth. |
| `audit_outbox_atomicity` | Lead mutation, audit and required outbox event commit together exactly once or roll back together. |
| `dashboard_reconciliation` | CRM/BusDev/marketing totals, stages, owner filters, attribution and SLA counts equal source transactions for the same tenant/time/filter set. |
| `frontend_live_data_dna_states` | Affected canonical screens call live internal APIs, import interactive/visual primitives through `@/components/dna`, and prove loading/empty/error/denied/success states. |
| `golden_thread` | The complete lead-to-qualified-opportunity flow passes through real production services and PostgreSQL, including one retry and one unauthorized attempt. |
| `affected_regression_and_cleanup` | Affected P01/P02/P05/P06 sentinels, type/build/lint checks and P07 tests pass; temporary `nex_p07_*` databases are removed; concise evidence records commands and numeric assertions. |

## Required adversarial cases

The production path must reject or safely collapse all of these:

1. same normalized identity submitted twice;
2. concurrent duplicate intake or qualification;
3. missing/withdrawn consent for a consent-required action;
4. unauthorized or cross-tenant owner reassignment/read;
5. illegal stage transition and stale update;
6. repeated idempotency key with conflicting payload;
7. transaction failure between business write and audit/outbox;
8. dashboard query whose result differs from source control totals.

These are ordinary negative business tests, not a mutation framework. Each case must use the same production service used by valid traffic.

## Thresholds

- all 10 acceptance checks and all required subphase/seam tests pass;
- golden thread produces exactly one canonical lead, one current owner, one qualification effect, one required audit chain and one required outbox effect;
- dashboard/control-total delta is `0` for every asserted dimension;
- cross-tenant or unauthorized disclosure/mutation count is `0`;
- unexpected skipped, pending, todo, only or flaky tests: `0`;
- new type errors and lint errors in changed scope: `0`;
- production mocks/fallbacks and new unregistered DNA violations in changed scope: `0`;
- residual temporary databases and plaintext secrets in evidence: `0`.

No repository-wide zero-warning or historical-debt cleanup is required by P07 unless the changed code increases that debt or blocks the owned workflow.

## Final-verification admission and rerun policy

P07 does not create a bespoke certifier, gate engine, mutation harness, SHA-token system or generated evidence framework. `npm run verify:p07` is a thin fail-fast composition of the already exercised focused commands. It may run only after all targeted subphases pass. If it fails, rerun only the owning targeted test before one final verification rerun. Independent auditor reproduction is the second proof.

New ordinary acceptance criteria may not be added after execution begins. Only a newly reproduced P0/P1 security, authorization, correctness or data-loss defect can amend this contract.
