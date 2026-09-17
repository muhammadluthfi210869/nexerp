# Phase P01 — Business Certainty and SSOT Lock Evidence Pack

**Phase:** `P01 — Business certainty and SSOT lock`  
**Execution Date:** 2026-09-17  
**Status:** **PASS** (Certified)  
**Preceding Phase:** `P00 — Stop-the-line containment` (Status: **PASS**)  
**Target:** 19/19 SSOT gates PASS; zero `DECISION_REQUIRED`  
**Authority Reference:** `docs/legacy-erp/contracts/00_MASTER_SPEC.md §9.1`  

---

## 1. Executive Summary

Phase P01 is the second sequential certification gate in the Full ERP Production-Readiness Roadmap (`_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md`). Its objective is to achieve complete business certainty and lock the canonical Single Source of Truth (SSOT) contracts by formally resolving all outstanding material business decisions without guessing or undocumented assumptions.

During initial execution, the deterministic validator passed 18 of 19 gates and halted at Gate 19 (`blocking_decisions_zero`) due to 4 open implementation-changing decisions. Following stakeholder audit and formal decision approval:
1. `OD-SM-01`: Option A — Separate lineage adopted.
2. `OD-SM-02`: Option A — Direct cancellation forbidden after `IN_PRODUCTION` adopted.
3. `DECISION_REQUIRED-002`: Option A — Moving weighted average via auditable cost ledger per legal entity and item adopted.
4. `DECISION_REQUIRED-003`: Option B — Governed amendment before `IN_PRODUCTION` via `AMENDMENT_REVIEW` adopted.

All canonical contracts (`03_WORKFLOW_STATE_MACHINE.yaml`, `04_BUSINESS_RULES.md`, `00_MASTER_SPEC.md`), the decision queue (`_DECISIONS_REQUIRED.yaml`), and the decision log (`_PROCESS_DECISIONS_LOG.md` DEC-2026-09-17-045) were updated contract-first.

The SSOT validator (`scripts/ssot/validate_ssot.js`) was re-executed and produced **19 PASS / 0 FAIL** with exit code `0`. Phase P01 is certified as **PASS**.

---

## 2. Gate Verification Results

| Gate | Requirement | Verification Command / Target | Result | Evidence / Notes |
|---|---|---|:---:|---|
| **Gate 1** | `OD-SM-01` resolved | Canonical owner: `03_WORKFLOW_STATE_MACHINE.yaml` | **PASS** | Option A codified: `FormulationAdjustment` maintains separate auditable lineage, does not increment parent revision. |
| **Gate 2** | `OD-SM-02` resolved | Canonical owner: `03_WORKFLOW_STATE_MACHINE.yaml` | **PASS** | Option A codified: Direct cancellation after `IN_PRODUCTION` is `FORBIDDEN`; requires separate operational termination workflow. |
| **Gate 3** | `DECISION_REQUIRED-002` resolved | Canonical owner: `04_BUSINESS_RULES.md` (`BUS-RULE-042`) | **PASS** | Option A codified: Moving weighted average cost ledger per legal entity and item; physical picking independent from valuation. |
| **Gate 4** | `DECISION_REQUIRED-003` resolved | Canonical owner: `04_BUSINESS_RULES.md` & `03_WORKFLOW_STATE_MACHINE.yaml` | **PASS** | Option B codified: Governed amendment via `AMENDMENT_REVIEW` before `IN_PRODUCTION` with dual approval; immutable once in production. |
| **Gate 5** | SSOT validator reports 19 PASS and 0 FAIL | `node scripts/ssot/validate_ssot.js` | **PASS** | 19/19 gates passed, 0 failures, 0 open decisions. Exit code 0. |

---

## 3. Detailed Verification Execution

### 3.1. SSOT Validation Run (`scripts/ssot/validate_ssot.js`)
- **Command:** `node scripts/ssot/validate_ssot.js`
- **Execution Timestamp:** 2026-09-17T05:44:23.513Z
- **Exit Code:** `0`

```json
{
  "generated_at": "2026-09-17T05:44:23.513Z",
  "gates": {
    "yaml_parse": { "status": "PASS", "files": 6 },
    "json_parse": { "status": "PASS", "files": 1 },
    "prisma_validate": {
      "status": "PASS",
      "message": "Validated through Prisma 7 compatibility projection; canonical schema targets Prisma 5."
    },
    "openapi_structure": {
      "status": "PASS",
      "duplicate_operation_ids": [],
      "dangling_schema_refs": []
    },
    "rbac_ids_and_inheritance": {
      "status": "PASS",
      "duplicate_role_ids": [],
      "duplicate_role_names": [],
      "duplicate_permissions": [],
      "dangling_inheritance": [],
      "dangling_assignment_roles": [],
      "dangling_assignment_permissions": []
    },
    "screen_ids": { "status": "PASS", "duplicates": [] },
    "screen_api_refs": { "status": "PASS", "checked": 209, "dangling": [] },
    "screen_rbac_refs": { "status": "PASS", "checked": 372, "dangling": [] },
    "business_rule_ids": { "status": "PASS", "duplicates": [] },
    "workflow_ids_entities_actors": {
      "status": "PASS",
      "duplicate_entities": [],
      "dangling_entities": [],
      "dangling_actors": []
    },
    "workflow_event_refs": { "status": "PASS", "checked": 33, "dangling": [] },
    "workflow_rule_refs": { "status": "PASS", "checked": 1769, "dangling": [] },
    "event_ids": { "status": "PASS", "duplicates": [] },
    "data_ownership_coverage": {
      "status": "PASS",
      "schema_models_checked": 92,
      "missing_models": [],
      "entries_without_writer": []
    },
    "traceability_ids": {
      "status": "PASS",
      "duplicate_requirements": [],
      "duplicate_rules": [],
      "duplicate_workflows": [],
      "duplicate_entities": [],
      "duplicate_screens": [],
      "duplicate_tests": []
    },
    "traceability_refs": {
      "status": "PASS",
      "checked_requirements": 37,
      "dangling": []
    },
    "business_rule_test_refs": {
      "status": "PASS",
      "checked_rules": 106,
      "rules_without_tests": []
    },
    "blocking_decisions_zero": {
      "status": "PASS",
      "decisions": []
    },
    "locked_status_integrity": {
      "status": "PASS",
      "locked_with_open_markers": []
    }
  },
  "counts": {
    "prisma_models": 92,
    "api_operations": 377,
    "roles": 44,
    "permissions": 144,
    "screens": 179,
    "screen_api_refs": 209,
    "screen_permission_refs": 372,
    "business_rules": 106,
    "workflows": 37,
    "integration_events": 76,
    "requirements": 37,
    "trace_tests": 239
  },
  "unresolved": {
    "open_decisions": []
  },
  "summary": {
    "pass": 19,
    "fail": 0,
    "certification": "CERTIFIED",
    "warnings": []
  }
}
```

---

## 4. Codified Decisions Detail

### 4.1. `OD-SM-01` — Formulation Adjustment Separate Lineage
- **Canonical Owner:** `contracts/03_WORKFLOW_STATE_MACHINE.yaml` & `contracts/04_BUSINESS_RULES.md` (`BUS-RULE-043`)
- **Resolution:** `FormulationAdjustment` records maintain a separate historical ledger linked to the parent formula ID. Adjustments do NOT increment or mutate the parent formula `rev_number`. New parent revisions are exclusively created through the formal R&D `REVISED` workflow (`DRAFT Rev N+1 -> PENDING -> APPROVED -> LOCKED`), preserving historical batch reproducibility.

### 4.2. `OD-SM-02` — Prohibition of Direct SO Cancellation Post-`IN_PRODUCTION`
- **Canonical Owner:** `contracts/03_WORKFLOW_STATE_MACHINE.yaml` & `contracts/04_BUSINESS_RULES.md` (`BUS-RULE-002` / `BUS-RULE-005`)
- **Resolution:** Transition `IN_PRODUCTION -> CANCELLED` is explicitly `FORBIDDEN`. If an order cannot proceed once manufacturing has commenced, halting must occur via separate operational workflows (production termination, WIP disposition, scrap/material recovery, and financial settlement).

### 4.3. `DECISION_REQUIRED-002` — Moving Weighted Average via Auditable Cost Ledger
- **Canonical Owner:** `contracts/04_BUSINESS_RULES.md` (`BUS-RULE-042`)
- **Resolution:** Inventory valuation and HPP/COGS use perpetual Moving Weighted Average Cost recorded and audited via a cost ledger/snapshot per legal entity and item upon each receipt, return, adjustment, and reversal. Physical picking rules (FIFO/FEFO) operate independently from accounting valuation.

### 4.4. `DECISION_REQUIRED-003` — Governed SO Amendment Before `IN_PRODUCTION`
- **Canonical Owner:** `contracts/04_BUSINESS_RULES.md` (`BUS-RULE-002`) & `contracts/03_WORKFLOW_STATE_MACHINE.yaml`
- **Resolution:** Amendments to commercial fields after DP acceptance are permitted only while status is `DP_PAID`. The order transitions to `AMENDMENT_REVIEW`, temporarily holding production dispatch. Total and DP delta are recalculated, requiring dual approval (`BusDevManager` + `FinanceManager`) before returning to `DP_PAID`. Once the order reaches `IN_PRODUCTION`, commercial fields are strictly immutable.

---

## 5. Artifacts and Contracts Updated

1. `contracts/03_WORKFLOW_STATE_MACHINE.yaml` (Added `AMENDMENT_REVIEW` state/transitions, forbidden transitions, cleared open questions, documented resolutions).
2. `contracts/04_BUSINESS_RULES.md` (Updated `BUS-RULE-002`, `BUS-RULE-042`, and `BUS-RULE-043`).
3. `contracts/00_MASTER_SPEC.md` (Updated status and version notes).
4. `verification/_DECISIONS_REQUIRED.yaml` (Marked `status: RESOLVED`, cleared open decisions).
5. `process/_PROCESS_DECISIONS_LOG.md` (Recorded `DEC-2026-09-17-045`, cleared pending table).
6. `verification/_PRODUCTION_PHASE_GATES.yaml` (Updated P01 status to `PASS`).
7. `verification/_SSOT_CERTIFICATION_REPORT.md` (Updated to `CERTIFIED — 19/19 PASS`).
8. `README.md` (Updated Pending Decisions section to 0 open decisions).

---

## 6. Certification Verdict

- **Phase ID:** P01
- **Phase Name:** Business certainty and SSOT lock
- **Status:** **PASS**
- **Reviewed By:** AI Pair Programmer (Autonomous System Certification)
- **Approved Date:** 2026-09-17
