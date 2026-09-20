# NEX ERP — AI Agent Router

This file is supporting guidance, not business truth. The only global authority map is `contracts/00_MASTER_SPEC.md §9.1`.

## Before implementation

1. Read `verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`. It is mandatory for execution/testing workflow and overrides historical certifier, diagnose, SHA-token, mutation-harness, evidence-engine, and rerun instructions.
2. Identify the requirement ID in `contracts/00_MASTER_SPEC.md` or `reference/REQUIREMENT.md` as provenance.
3. Start from `contracts/10_TRACEABILITY_MATRIX.yaml` and load only the linked IDs.
4. Read the owning contracts needed for the change:
   - validation/calculation/invariant → `04_BUSINESS_RULES.md`
   - lifecycle/transition/actor/side effect → `03_WORKFLOW_STATE_MACHINE.yaml`
   - entity meaning → `01_DOMAIN_MODEL.md`
   - fields/indexes/relations → `schema.prisma`
   - writer/system of record → `02_DATA_OWNERSHIP.yaml`
   - access/action/data scope → `07_RBAC_MATRIX.yaml`
   - HTTP interface → `05_API_CONTRACT.yaml`
   - UI behavior → `06_SCREEN_CONTRACT.json`
   - events → `08_INTEGRATION_EVENT_CONTRACT.yaml`
   - global technical constraints → `09_NON_FUNCTIONAL_CONTRACT.md`
   - any UI/page/component/style change → `09_NON_FUNCTIONAL_CONTRACT.md §11A` and `verification/_UI_DNA_COMPLIANCE_STANDARD.md`; application UI imports primitives only from `@/components/dna`
5. Do not infer behavior from implementation, legacy/raw files, `_REVIEW`, generated reports, or this router.
6. If evidence supports different material business choices, add a structured `DECISION_REQUIRED`, keep affected contracts `PROVISIONAL`, and continue non-blocked work.
7. Update the owning contract first, then dependent contracts, tests, traceability, generated views, and implementation.
8. Run only the focused SSOT/test/build checks affected by the change before handoff.
9. For any UI change, use `@/components/dna` and run the affected DNA checks; system-wide UI certification remains P19.

## Short verification commands

When the user writes `verifikasi fase X-Y`, `verifikasi X-Y fase`, `verifikasi Pxx-Pyy`, or an equivalent unambiguous range, immediately follow `verification/_BATCH_VERIFICATION_PLAN.md`. Bare numbers normalize to phase IDs and the range is inclusive. Do not ask for the long prompt again. Verification audits evidence and application state; it does not authorize implementation fixes unless the user separately requests remediation.

## Status rules

- `LOCKED` means parse-valid, references resolved, no blocking open decision, and deterministic validation passing.
- `PROVISIONAL` means usable only with limitations listed in `verification/_SSOT_CERTIFICATION_REPORT.md`.
- `GENERATED` means do not edit directly; regenerate from canonical contracts.

Implementation is presumed wrong when it conflicts with a canonical contract until the owning contract is explicitly changed. Emergency code-first hotfixes require contract backfill before incident closure.

For phase implementation/remediation, read `verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`, `verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`, and the concise phase prompt. P07 onward must not create or run bespoke `certify_pXX`/`diagnose_pXX` scripts, SHA-bound tokens, mutation frameworks, or generated evidence engines. A phase is complete when its focused acceptance and thin `verify:pXX` command pass and no scoped P0/P1 remains. P2/P3 is backlog, not a blocker.

## Narrow-context example

For `REQ-XXX`, follow only its trace to `BUS-RULE-*`, workflow entity, canonical entities, API operation, screen, permission, events, NFR controls, and tests. Do not load or alter unrelated ERP behavior.
