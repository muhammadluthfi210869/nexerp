# P07 Frozen Acceptance Contract

**Phase:** P07 — CRM, Marketing, Guest Book, and BusDev  
**Base SHA:** `5542855667ca47b2e9a55c0e2c897db697b3929d`  
**Contract version:** `P07-v1`, frozen 2026-09-20  
**Authoritative command:** `node scripts/ssot/certify_p07_phase.js`  
**Success:** natural exit `0` and token `P07:<candidate-full-sha>:PHASE_PASS`

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

## Exact required gates

| ID | Required proof |
|---|---|
| `predecessor_and_scope` | P06 token/base is recognized; candidate is committed; changed scope is derived from Git; Node 22 and PostgreSQL 16 are used; no source database is mutated. |
| `contract_inventory` | Every P07 entity/API/screen/permission/workflow/event has a canonical owner and traceability; aliases/duplicates are consolidated or explicitly adapted. |
| `lead_intake_dedup_consent_attribution` | Normalized phone/email/external identity dedup works under retry and concurrency; consent and attribution history are preserved rather than overwritten. |
| `ownership_reassignment_visibility` | Assignment and reassignment obey canonical roles, tenant/data scope and actor-at-event audit; unauthorized and cross-tenant access fail. |
| `lifecycle_sla_idempotency_concurrency` | Only legal stage transitions occur; follow-up due/overdue uses one time policy; repeated and concurrent commands create one business effect. |
| `guestbook_marketing_activity` | Guest-book intake/reporting and required marketing activities/tasks are persisted, searchable and connected to the canonical lead without a parallel source of truth. |
| `audit_outbox_atomicity` | Lead mutation, audit and required outbox event commit together exactly once or roll back together. |
| `dashboard_reconciliation` | CRM/BusDev/marketing totals, stages, owner filters, attribution and SLA counts equal source transactions for the same tenant/time/filter set. |
| `frontend_live_data_dna_states` | Affected canonical screens call live internal APIs, import interactive/visual primitives through `@/components/dna`, and prove loading/empty/error/denied/success states. |
| `golden_thread` | The complete lead-to-qualified-opportunity flow passes through real production services and PostgreSQL, including one retry and one unauthorized attempt. |
| `changed_scope_quality` | Affected typecheck, lint, related tests and production builds pass; no new skip/only/mock fallback, forbidden dependency, dead duplicate path or DNA violation is introduced. |
| `cleanup_and_evidence` | Temporary `nex_p07_*` databases are balanced and removed; evidence contains commands, exit codes, durations, numeric assertions and redacted diagnostics bound to candidate SHA. |

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

These are business acceptance cases, not a requirement to build a large mutation-testing framework. Each case must use the same production service/gate used by valid traffic.

## Thresholds

- all 12 gates pass; all required subphase and seam tests pass;
- golden thread produces exactly one canonical lead, one current owner, one qualification effect, one required audit chain and one required outbox effect;
- dashboard/control-total delta is `0` for every asserted dimension;
- cross-tenant or unauthorized disclosure/mutation count is `0`;
- unexpected skipped, pending, todo, only or flaky tests: `0`;
- new type errors and lint errors in changed scope: `0`;
- production mocks/fallbacks and new unregistered DNA violations in changed scope: `0`;
- residual temporary databases and plaintext secrets in evidence: `0`.

No repository-wide zero-warning or historical-debt cleanup is required by P07 unless the changed code increases that debt or blocks the owned workflow.

## Certification admission and rerun policy

The full certifier is not a debugger. It may run only after all targeted subphases and the bounded preflight pass. The executor performs one authoritative run. A second executor run is allowed only after a certification-environment defect is isolated with a targeted reproducer. Independent auditor reproduction is the second proof.

New ordinary acceptance criteria may not be added after execution begins. Only a newly reproduced P0/P1 security, authorization, correctness or data-loss defect can amend this contract.
