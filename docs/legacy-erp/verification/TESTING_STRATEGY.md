# NEX ERP — Risk-Based Contract Testing Strategy

This is supporting infrastructure. Canonical behavior remains in `../contracts/`. Test selection and execution cadence are governed by `_FAST_DELIVERY_EXECUTION_STANDARD.md`.

Every critical requirement/rule must link to inspectable test IDs in `10_TRACEABILITY_MATRIX.yaml`. The following table is a catalog of applicable test layers, **not a requirement to test every rule at every layer**:

| Layer | Use when the risk exists |
|---|---|
| Unit | Calculation, validation, rounding, threshold, and invariant tests |
| Integration | Persistence constraints, transaction rollback, ownership boundaries, and audit writes |
| API contract | OpenAPI request/response/error/auth conformance for every operationId |
| Workflow | Every allowed transition plus every forbidden direct transition |
| RBAC/data scope | Positive and negative role tests, ownership/division/warehouse scope, maker/approver separation |
| Idempotency | Same request or event key twice produces one business mutation |
| Event consumer | Payload schema, retry, DLQ, ordering constraint, duplicate delivery, outbox publication |
| Cross-module | Sales, procurement, production/QC, finance, and access golden threads |
| E2E | Screen action → API → rule → transition → persistence → event/output |
| Migration | Row counts, identifiers, opening balances, rejected rows, and reconciliation totals |

Select the smallest set that proves the material risk:

- `LOW`: related static/component behavior and affected typecheck;
- `MEDIUM`: focused unit/component behavior, one production-service integration and focused UI behavior when UI changes;
- `HIGH`: focused production-service behavior, one real disposable-database golden thread and the smallest relevant negative/concurrency test.

For a critical workflow such as QC release, cover the successful primary thread plus negative cases for actual risks such as forbidden transition, authorization bypass or duplicate delivery. Do not duplicate every case across every layer. A `LOCKED` contract requires its selected critical test references to resolve and pass, not universal layer coverage.

Use one phase-level seam/golden-thread test to catch integration errors after subphase tests are green. Broader cumulative regression runs only at the declared P10, P15, P19 and P22 checkpoints or when a current change directly affects an earlier interface.

Do not create phase certifiers, mutation frameworks, SHA-bound proof, evidence engines or repeated historical-suite reruns. Native framework tests are the durable regression assets.

Run deterministic documentation validation with:

```text
node scripts/ssot/validate_ssot.js
```
