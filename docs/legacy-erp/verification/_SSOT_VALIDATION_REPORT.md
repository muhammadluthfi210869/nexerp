# NEX ERP — SSOT Validation Report

> GENERATED — DO NOT EDIT DIRECTLY. Run `node scripts/ssot/validate_ssot.js`.

Generated: 2026-09-17T15:06:23.416Z

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

- prisma_models: 92
- api_operations: 377
- roles: 44
- permissions: 144
- screens: 179
- screen_api_refs: 209
- screen_permission_refs: 372
- business_rules: 106
- workflows: 37
- integration_events: 76
- requirements: 37
- trace_tests: 239

## Exact failed gates

None.
