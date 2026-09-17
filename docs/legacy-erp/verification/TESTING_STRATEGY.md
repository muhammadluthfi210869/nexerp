# NEX ERP — Contract Testing Strategy

This is supporting infrastructure. Canonical behavior remains in `../contracts/`.

Every critical requirement/rule must link to inspectable test IDs in `10_TRACEABILITY_MATRIX.yaml` and cover:

| Layer | Required evidence |
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

For a critical workflow rule such as QC release, tests must include the successful transition, forbidden bypass, direct API bypass, unauthorized-role bypass, and duplicate-event behavior. A `LOCKED` contract requires all critical test references to resolve and pass.

Run deterministic documentation validation with:

```text
node scripts/ssot/validate_ssot.js
```

