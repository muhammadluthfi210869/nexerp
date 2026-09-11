# SSOT Authority Hierarchy Policy

## 0. Status

- **Version**: 1.0
- **Date**: 2026-09-11
- **Authority**: User (Luthfi, single IT engineer, NEX ERP project owner)
- **Status**: LOCKED — supersedes any conflicting governance text in other documents

## 1. Authority Hierarchy (6 tiers, ordered by priority)

When documents conflict, the higher tier wins.

```
AUTHORITY-1: Locked Stakeholder Decision
  └─ Explicit decisions recorded in decisions log
  └─ E.g. "supplier category = COA only" (no Bahan field)
  └─ Overrides everything below

AUTHORITY-2: Master Business Specification
  └─ NEX_ERP_MASTER_SPECIFICATION.md
  └─ Defines WHAT the system does
  └─ Overrides implementation details

AUTHORITY-3: Screen & API Catalog
  └─ NEX_ERP_SCREEN_AND_API_CATALOG.json
  └─ Defines WHICH screens exist + UI structure
  └─ CANNOT introduce new business rules (those go in master)

AUTHORITY-4: API Contract (transport only)
  └─ API_CONTRACT.yaml
  └─ Defines HOW data moves
  └─ CANNOT redefine business semantics (those go in master)
  └─ Schema-only, not authority for business logic

AUTHORITY-5: Operational Addendum
  └─ NEX_ERP_OPERATIONAL_ADDENDUM.md
  └─ Captures operational reality (formulas, defaults, UI labels)
  └─ ADDITIVE only — fills gaps in master, never contradicts
  └─ Conflicts with master → master wins (but flag for next master revision)

AUTHORITY-6: Legacy / Archive Evidence
  └─ docs/legacy-erp/_archive/kil_erp_full_inventory_v2.csv (176 rows)
  └─ docs/LEGACY_ERP_SPEC.md
  └─ READ-ONLY reference for operational reality
  └─ NEVER overrides anything above
  └─ Use to validate proposed implementations against legacy behavior

NON-AUTHORITATIVE:
  - _AUDIT_ANALYSIS_2026-09-09.md → diagnostic, NOT authority
  - Branch memory files → context only
  - AI agent inference → NEVER authority (always SPEC_GAP)
```

## 2. Conflict Resolution Policy

When 2+ documents conflict:
1. **Different tiers** → higher tier wins (per §1)
2. **Same tier** → STOP. Register SPEC_GAP. Do NOT implement.
3. **Missing in higher tier** → MAY use lower tier IF no contradiction
4. **Addendum vs Master conflict** → Master wins. Flag for next master revision.

## 3. DO NOT INFER Policy (CRITICAL for AI)

When information is missing, conflicting, or undefined:

```
DO NOT INFER.
DO NOT CREATE.
DO NOT ASSUME.
DO NOT USE MOCK as transactional fallback.
DO NOT USE localStorage for business state.
DO NOT USE silent fallback.
DO NOT DUAL-WRITE.

RAISE SPEC_GAP.
```

AI agents MUST flag any of these as a SPEC_GAP, not invent behavior.

## 4. SPEC_GAP Categories

Every gap must be tagged:
- `LOCKED` — decided, source documented
- `PROPOSED` — proposed, awaiting sign-off
- `UNKNOWN` — explicitly unknown
- `NOT_APPLICABLE` — documented as not applicable
- `DEPRECATED` — previously used, now removed
- `OUT_OF_SCOPE` — explicitly excluded
- `SPEC_GAP` — missing, must be raised, not inferred

## 5. Data Ownership

Authoritative owner per business object (matters when multiple modules touch same data):

```
Customer         → Customer Master (MOD-01)
Vendor           → Vendor Master (MOD-01)
Material         → Material Master (MOD-01)
Formula          → R&D (MOD-03)
Inventory Balance → Inventory Ledger (NOT in any module — needs owner)
Payment          → Finance (MOD-10)
Journal Entry    → Finance (MOD-10)
BPOM Registration → Legal (MOD-09)
Artwork Master   → Design (MOD-08)
Production Order → Production (MOD-06)
SO (Sales Order) → BusDev (MOD-02)
PO (Purchase Order) → SCM (MOD-04)
```

**Note**: This ownership table itself needs LOCKED stakeholder decision (some modules not yet in current code, e.g. MOD-08, MOD-09, MOD-10, MOD-11 per audit finding BLK-002).

## 6. Implementation Safety Invariants

These can NEVER be violated:

```
NO_LOCAL_BUSINESS_STATE       — no localStorage for business transactions
NO_TRANSACTIONAL_MOCK         — no fake data in production
NO_SILENT_FALLBACK            — errors must surface to user
NO_DUAL_WRITE                 — one authoritative writer per object
NO_HARDCODED_OPERATIONAL_DATA — no `/test/data` paths in production
NO_BYPASS_CANONICAL_API       — frontend must use documented API
```

## 7. Change Control

Every rule change requires:
```
ruleId              (e.g. AUTH-001)
status             (LOCKED | PROPOSED | DEPRECATED)
effectiveDate
source             (which decision)
supersedes         (previous ruleId)
affectedScreens    (SCR-XXX list)
affectedApis       (operation IDs)
approvedBy         (stakeholder role)
```

## 8. Glossary

- **SSOT**: Single Source of Truth — the canonical documentation set
- **SPEC_GAP**: A documented gap that must be filled, not inferred
- **SOT**: Source of Truth (synonym for SSOT)
- **SS**: NEX ERP Standard Specification (legacy term for master spec)

## 9. Reference

- Audit findings: `docs/legacy-erp/_AUDIT_ANALYSIS_2026-09-09.md` (NOT authority)
- Operational addendum: `docs/legacy-erp/NEX_ERP_OPERATIONAL_ADDENDUM.md`
- Master Spec: `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md`
- Branch: `phase-3`

---

*This document is AUTHORITY-1 and overrides any conflicting text in other SSOT documents until superseded by a new LOCKED decision.*