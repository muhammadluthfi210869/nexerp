# Phase P02 — Contract-to-Code and Lifecycle Reconciliation Implementation Plan

**Objective:** Fully execute Phase P02 with strict compliance to all 12 user-mandated constraints: dynamic denominators, lifecycle vs. implementation state separation, verified typed mappings for authorization/session constructs, explicit records for all canonical API operations and screens, individual classifications for implementation objects, elimination of hardcoded assertions, verified calculation in audit suite, and comprehensive negative test coverage.

---

## 1. Architectural Design & Taxonomy

### 1.1 Lifecycle Classification Enum
- `CANONICAL`: Item originates directly from canonical SSOT contracts (`00_MASTER_SPEC.md`, `schema.prisma`, `05_API_CONTRACT.yaml`, `06_SCREEN_CONTRACT.json`, `07_RBAC_MATRIX.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`).
- `APPROVED_EXTENSION`: Legitimate production expansion beyond canonical baseline (e.g., Omnichannel CRM, BPOM/HKI regulatory tracking, creative design workflows, document automation).
- `COMPATIBILITY_ADAPTER`: Temporary translation layer or alias bridging legacy patterns to canonical architecture (e.g., Next.js visual DNA redirects, `MasterKode` sequence bridge, legacy ID preservation). Must have an existing runtime target and concrete removal condition.
- `DUPLICATE`: Redundant implementation that must be consolidated.
- `DEPRECATED`: Active code marked for phaseout.
- `DEAD_CODE`: Unreachable code to be removed.
- `DECISION_REQUIRED`: Unresolved architecture ambiguity requiring stakeholder decision.

### 1.2 Implementation State Enum
- `IMPLEMENTED_EXACT`: Runtime path, method, and signature match the canonical specification identically.
- `IMPLEMENTED_MAPPED`: Feature is fully implemented under a verified semantic equivalent model, controller route, or page component.
- `IMPLEMENTED_ADAPTER`: Feature is reachable via an active, verifiable compatibility adapter.
- `PLANNED`: Canonical capability formally scheduled for future implementation phase (`P04`–`P18`). Must satisfy 7 mandatory fields:
  1. `target_implementation_phase`
  2. `target_planned_path` (module, file, or route)
  3. `owner`
  4. `rationale`
  5. `acceptance_gate`
  6. `required_test`
  7. `dependency`
- `MISSING_BLOCKER`: Unimplemented canonical item lacking approved planning metadata. (Any occurrence forces Phase P02 to FAIL).

---

## 2. Separate Metric Computation
Registry and audit report will expose distinct, independently calculated metrics:
- `reconciliation_coverage_percent`: `(reconciled_canonical / total_canonical) * 100` (Measures whether 100% of canonical specifications are accounted for).
- `implemented_coverage_percent`: `((implemented_exact + implemented_mapped) / total_canonical) * 100` (Measures true implemented state without falsifying PLANNED items).
- `planned_coverage_percent`: `(planned_canonical / total_canonical) * 100` (Measures capabilities scheduled for subsequent delivery phases).
- `adapter_coverage_percent`: `(adapter_canonical / total_canonical) * 100`
- `missing_blocker_count`: Count of unmapped canonical objects without valid phase plans (Must be `0` for P02 PASS).
- `unexplained_objects`: Count of implementation objects lacking owner, rationale, or valid classification (Must be `0` for P02 PASS).

---

## 3. Typed Mapping for Authorization & Session Constructs
Prevent incorrect conflation of role definitions (`Role`) with employee assignments (`EmployeeRoleMapping`).
Canonical items without direct 1:1 database models will use explicit typed mappings:
- `Role`:
  - `implementation_kind`: `ENUM`
  - `implementation_path`: `backend/prisma/schema/enums.prisma`
  - `implementation_symbol`: `enum UserRole`
  - `semantic_equivalence`: Static enumeration of system roles representing user authorities, planned for dynamic DB role entities in P04/P05.
  - `owner`: Platform Security Team
  - `rationale`: Role definitions currently maintained as static Prisma enum UserRole; transition to dynamic Role model scheduled for P04.
  - `verification_method`: PRISMA_ENUM_PARSER
  - `target_phase`: P04
  - `removal_condition`: Migration to dynamic Role entity in database in P04.
- `Permission`:
  - `implementation_kind`: `GUARD`
  - `implementation_path`: `backend/src/modules/auth/roles.guard.ts`
  - `implementation_symbol`: `RolesGuard`
  - `semantic_equivalence`: Route-level role-based authorization guard checking requested roles via Reflector metadata.
  - `owner`: Platform Security Team
  - `rationale`: Fine-grained permissions enforced via RolesGuard and roles decorator; dynamic Permission entity planned for P04.
  - `verification_method`: TYPESCRIPT_AST_SYMBOL
  - `target_phase`: P04
  - `removal_condition`: Migration to dynamic Permission table in P04.
- `RolePermission`:
  - `implementation_kind`: `GUARD`
  - `implementation_path`: `backend/src/modules/auth/roles.guard.ts`
  - `implementation_symbol`: `RolesGuard`
  - `semantic_equivalence`: Role-to-access mappings evaluated procedurally in RolesGuard logic.
  - `owner`: Platform Security Team
  - `rationale`: Evaluated dynamically in RolesGuard until dynamic relation table is implemented in P04.
  - `verification_method`: TYPESCRIPT_AST_SYMBOL
  - `target_phase`: P04
  - `removal_condition`: Migration to dynamic RolePermission schema table in P04.
- `UserSession`:
  - `implementation_kind`: `SERVICE`
  - `implementation_path`: `backend/src/modules/auth/auth.service.ts`
  - `implementation_symbol`: `AuthService`
  - `semantic_equivalence`: Stateless signed JWT token session management issued by AuthService.login().
  - `owner`: Platform Security Team
  - `rationale`: User sessions currently maintained as signed stateless JWT payloads; stateful UserSession table with revocation planned for P05.
  - `verification_method`: TYPESCRIPT_AST_SYMBOL
  - `target_phase`: P05
  - `removal_condition`: Migration to database-backed UserSession table in P05.

---

## 4. API & Screen Reconciliation Structure

### 4.1 Canonical API Reconciliation (Dynamically counted: 377 operations)
For each operation:
- Canonical method, path, operationId, tag, summary
- If implemented: actual method, actual path, controller file, controller symbol (`IMPLEMENTED_EXACT` or `IMPLEMENTED_MAPPED`)
- If planned: `target_phase`, `target_module_or_file`, `acceptance_gate`, `required_test`, `dependency`, `owner`, `rationale` (`PLANNED`)
- If adapter: adapter ID and removal condition

### 4.2 Canonical Screen Reconciliation (Dynamically counted: 179 screens)
For each screen:
- Canonical `screen_id`, title, module, canonical route
- If implemented: actual route, page component file on disk (`IMPLEMENTED_EXACT` or `IMPLEMENTED_MAPPED`)
- If planned: `target_phase`, `target_planned_route`, `acceptance_gate`, `required_test`, `dependency`, `owner`, `rationale`, `dna_migration_disposition` (`PLANNED`)

---

## 5. Individual Classification of Implementation-Only Objects
Inspect and individually classify:
- All 194 Prisma models across 15 schema files (no blanket file-level defaults)
- All 940 implementation API endpoints in `backend/swagger-spec.json`
- All 272 Next.js frontend pages
- All 96 backend controllers
- All 118 backend services
- All 70 backend modules
- All 41 database migrations
- All backend (53) and frontend (37) production dependencies

---

## 6. Audit Verifier & Negative Test Suite

### 6.1 Refactoring `audit_lifecycle_reconciliation.js`
- Remove all hardcoded constants (`377`, `179`, `270`, `272`, `100.0`, `0`).
- Dynamically parse denominators from source files.
- Verify on-disk file existence for all target paths and symbol existence for typed mappings.
- Independently compute percentages and unexplained counts from verified records.
- Set overall verdict to `PASS` only if zero failures occur.

### 6.2 Negative Test Suite (`test_lifecycle_reconciliation_negative.js`)
Validates that the audit verifier FAILS when:
1. Target file or symbol does not exist
2. Canonical API mapping is missing
3. Canonical screen mapping is missing
4. Classification is empty
5. Owner or rationale is empty
6. Adapter has no removal condition
7. PLANNED item lacks target phase or test
8. Implementation-only object is unclassified
9. Ambiguous or duplicate mapping exists
10. Denominator changes without updated registry
11. Summary values are manipulated into fake 100%
