# NEX ERP — Single Source of Truth Remediation Ledger

**Audit date:** 2026-09-17  
**Scope:** `docs/legacy-erp/contracts/` plus canonical requirement, finance, crawl, and decision evidence  
**Status:** REMEDIATED WITH FOUR DECISIONS REQUIRED

This ledger is audit evidence. Runtime authority remains with the subject owner in `contracts/00_MASTER_SPEC.md §9.1`. A finding is only `RESOLVED` when its canonical owner and dependent contracts agree and the deterministic validator passes.

## Remediation ledger

| ID | Severity | Finding | Resolution and evidence | Gate / result | Status |
|---|---|---|---|---|---|
| REM-001 | BLOCKER | Competing document precedence chains | Replaced with one subject-based authority map; reference, crawl, SSOT, process, and review documents are provenance only. | authority/manual review | RESOLVED |
| REM-002 | BLOCKER | Prisma relations were not semantically valid | Repaired 11 reciprocal/orphan relation declarations. Canonical schema now contains 92 models. | `prisma_validate` PASS | RESOLVED |
| REM-003 | BLOCKER | Physical models did not all have an authoritative writer | Added missing `RolePermission` ownership and coverage for the new KPI models. | 92/92 models, PASS | RESOLVED |
| REM-004 | BLOCKER | Workflow actors and required principals did not resolve | Normalized compound actor expressions and added the evidence-backed Director principal. | `workflow_ids_entities_actors` PASS | RESOLVED |
| REM-005 | BLOCKER | Workflow triggers referenced missing/non-canonical events | Aligned trigger names and event definitions, including transactional-outbox delivery semantics. | 33/33 event refs, PASS | RESOLVED |
| REM-006 | BLOCKER | Workflow business-rule references were not certified | Added recursive rule-reference validation across every workflow structure. | 1,744/1,744 refs, PASS | RESOLVED |
| REM-007 | BLOCKER | Purchase invoice matching was ambiguous | Canonical rule is four-leg PO ↔ GR ↔ QC-passed ↔ invoice matching with zero quantity/price tolerance; every variance is `EXCEPTION`, accuracy percentage is hidden. | BUS-RULE-023 + workflow | RESOLVED |
| REM-008 | BLOCKER | Packaging completion could incorrectly make FG sellable before QC | Packaging creates `FG_QUARANTINE`; only idempotent QC release moves availability from `QUARANTINE` to `AVAILABLE`. | BUS-RULE-037/047 + event/workflow | RESOLVED |
| REM-009 | BLOCKER | Per-person KPI had no complete persistence, calculation, API, access, evidence, or UI contract | Added effective-dated multi-role assignments, KPI definitions/results, event-derived attribution, evidence links, APIs, permissions, screen, events, and tests. Manual score input is prohibited. | REQ-035..037; TEST-251..256 | RESOLVED |
| REM-010 | BLOCKER | Notes, comments, attachments, tags, and @mentions were not a coherent protocol | Canonicalized generic entity communication APIs, parent-entity ACL, atomic tag/notification/outbox behavior, events, permissions, UI references, and tests. | BUS-RULE-091 + reference gates | RESOLVED |
| REM-011 | BLOCKER | 148 of 207 screen HTTP references were dangling | Added missing explicit OpenAPI capabilities and normalized screen references. | 209/209 refs, PASS | RESOLVED |
| REM-012 | BLOCKER | 163 of 370 screen permission references were dangling | Canonicalized resource/action slugs and added required communication/KPI permissions. | 372/372 refs, PASS | RESOLVED |
| REM-013 | BLOCKER | 130 traceability references were dangling | Reconciled requirement-to-rule/workflow/entity/API/screen/test references and generated lineage. | 37 requirements, 0 dangling, PASS | RESOLVED |
| REM-014 | MAJOR | Business rules could exist without test evidence | Added a validator gate requiring every canonical rule to be referenced by at least one trace test. | 106/106 rules, PASS | RESOLVED |
| REM-015 | MAJOR | OD-1..OD-9 and several workflow/event questions were stale despite explicit evidence/defaults | Recorded evidence-backed resolutions for security, notifications, communication, KPI governance, migration routes, OD-SM-03..06, and EVENT-DECISION-01..05. | decision log + owning contracts | RESOLVED |
| REM-016 | BLOCKER | Inventory valuation/HPP method and persisted source are undefined | No method was inferred. Decision remains in the structured queue. | DECISION_REQUIRED-002 | OPEN |
| REM-017 | BLOCKER | Commercial amendment behavior after an accepted sales DP is undefined | No immutability/recalculation policy was inferred. Decision remains in the structured queue. | DECISION_REQUIRED-003 | OPEN |
| REM-018 | BLOCKER | Effect of `FormulationAdjustment` on parent revision is undefined | Proposed answer is documented but has no authoritative approval. | OD-SM-01 | OPEN |
| REM-019 | BLOCKER | Whether an SO can be cancelled after `IN_PRODUCTION` is undefined | Proposed triple approval/recovery behavior is documented but has no authoritative approval. | OD-SM-02 | OPEN |

## Verified inventory

| Artifact | Verified count |
|---|---:|
| Prisma models | 92 |
| OpenAPI operations | 377 |
| Roles / permissions | 44 / 144 |
| Screens | 179 |
| Business rules | 106 |
| Workflows / events | 37 / 76 |
| Requirements / trace tests | 37 / 239 |

## Validation limitation

Live revalidation against `kil.gserp.id` could not be executed in this run because the local computer-use runtime returned `runtime_unavailable`. Parity evidence was therefore checked against the captured crawl snapshot in `data/crawl/`, plus `reference/REQUIREMENT.md` and `reference/NEX_FINANCE_FINAL_SPEC.md`. Credentials were not printed or copied into any document.

The current machine result is **18 PASS / 1 FAIL**. The only failed gate is `blocking_decisions_zero`, containing exactly OD-SM-01, OD-SM-02, DECISION_REQUIRED-002, and DECISION_REQUIRED-003.
