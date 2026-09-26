# NEX ERP — SSOT Validation Report

> GENERATED — DO NOT EDIT DIRECTLY. Run `node scripts/ssot/validate_ssot.js`.

Generated: 2026-09-26T08:59:15.172Z

## Result

**CERTIFIED** — 19 gates passed; 0 failed.

## Deterministic gates

| Gate | Status |
|---|---|
| yaml_parse | PASS |
| json_parse | PASS |
| prisma_validate | PASS |
| openapi_structure | PASS |
| rbac_ids_and_inheritance | PASS |
| screen_ids | PASS |
| screen_api_refs | PASS |
| screen_rbac_refs | PASS |
| business_rule_ids | PASS |
| workflow_ids_entities_actors | PASS |
| workflow_event_refs | PASS |
| workflow_rule_refs | PASS |
| event_ids | PASS |
| data_ownership_coverage | PASS |
| traceability_ids | PASS |
| traceability_refs | PASS |
| business_rule_test_refs | PASS |
| blocking_decisions_zero | PASS |
| locked_status_integrity | PASS |

## Generated counts

- prisma_models: 100
- api_operations: 407
- roles: 44
- permissions: 149
- screens: 184
- screen_api_refs: 221
- screen_permission_refs: 384
- business_rules: 114
- workflows: 38
- integration_events: 88
- requirements: 42
- trace_tests: 260

## Exact failed gates

None.
