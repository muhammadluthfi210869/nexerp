# NEX ERP — SSOT Certification Report

**Certification result: CERTIFIED — 19/19 DETERMINISTIC GATES PASS**  
**Validation date:** 2026-09-17  
**Machine evidence:** `_SSOT_VALIDATION_REPORT.md` and `_ssot_validation.json`

The canonical contract set is completely coherent, deterministic validation passes with zero errors, and all four material business decisions have been officially resolved and codified in their canonical owners.

## Certification domains

| Domain | Result | Evidence |
|---|---|---|
| Authority and governance | PASS | One subject-based authority map; canonical owners and provenance boundaries are explicit |
| Machine validity | PASS | Six YAML files, one JSON contract, OpenAPI references, and Prisma semantic validation pass |
| Domain and persistence | PASS | 92 Prisma models; relations, ownership, and KPI persistence validate |
| Data ownership | PASS | 92/92 persisted models have ownership coverage and an authoritative writer |
| Workflow integrity | PASS | 37 workflows; entity/actor references resolve; 33/33 event and 1,769/1,769 rule references resolve |
| Event contract | PASS | 76 canonical events with outbox/idempotency policy |
| Screen/API | PASS | 209/209 screen HTTP references resolve to 377 OpenAPI operations |
| Screen/RBAC | PASS | 372/372 screen permission references resolve across 44 roles and 144 permissions |
| Traceability | PASS | 37 requirements resolve with zero dangling references |
| Rule test coverage | PASS | 106/106 business rules have trace-test evidence; 239 tests are indexed |
| Business certainty | PASS | OD-SM-01, OD-SM-02, DECISION_REQUIRED-002, DECISION_REQUIRED-003 all resolved (DEC-2026-09-17-045) |

Machine summary: **19 PASS, 0 FAIL**. The gate `blocking_decisions_zero` reports 0 open decisions.

## Golden-thread result

| Thread | Structural result | Certification notes |
|---|---|---|
| Procurement: PR → PO → GR → QC → invoice → payment → journal | PASS | Exact four-leg/zero-tolerance matching and moving weighted average valuation via auditable cost ledger resolved. |
| Production: formulation → batch → mixing → filling → packaging → quarantine → QC release → FG | PASS | Quarantine/release resolved; separate formulation adjustment lineage (OD-SM-01) resolved. |
| Sales: lead → sample → SO → DP → production → delivery → invoice → receipt | PASS | Governed amendment before production (DECISION_REQUIRED-003) and direct cancellation forbidden post-IN_PRODUCTION (OD-SM-02) resolved. |
| Finance: source document → CoA → balanced journal → lock/reversal | PASS | Double-entry ledger mechanics and perpetual moving weighted average cost ledger resolved. |
| Access and communication: screen → permission → scope → action → notes/@mention/evidence | PASS | Screen, RBAC, parent ACL, notification, outbox, and evidence links resolve. |
| KPI per person: event → actor-at-event → role weight → metric → scorecard → evidence | PASS | Effective-dated multi-role attribution, N/A denominator handling, immutable finalized periods, APIs, UI, permissions, events, and tests are defined. |

## Resolved Decisions (DEC-2026-09-17-045)

1. **OD-SM-01 (Option A — Separate Lineage)**: `FormulationAdjustment` maintains separate auditable history; does not mutate or increment parent formulation revision.
2. **OD-SM-02 (Option A — Direct Cancellation Forbidden)**: Direct cancellation of Sales Order after `IN_PRODUCTION` is forbidden; emergency work-stop requires separate operational termination/disposition workflow.
3. **DECISION_REQUIRED-002 (Option A — Moving Weighted Average via Cost Ledger)**: Inventory valuation and HPP use perpetual Moving Weighted Average Cost recorded in auditable cost ledger per legal entity/item on each transaction. Physical picking (FIFO/FEFO) is independent of accounting valuation.
4. **DECISION_REQUIRED-003 (Option B — Governed Amendment Before IN_PRODUCTION)**: SO amendments post-DP are permitted only before production via `AMENDMENT_REVIEW` with dual approval (BusDev + Finance) and DP delta recalculation. Once in production, commercial fields are immutable.

## Legacy parity evidence

The captured crawl snapshot under `data/crawl/` and the explicit requirements in `reference/REQUIREMENT.md` and `reference/NEX_FINANCE_FINAL_SPEC.md` were used. No credentials were exposed.

## Certification Verdict

**PHASE P01 STATUS: PASS**  
The Single Source of Truth contracts achieve 19/19 PASS on deterministic validation and 0 blocking decisions. The roadmap is now cleared to proceed to Phase P02.
