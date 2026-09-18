# P05 Baseline and Root-Cause Audit — 2026-09-18

## Verdict before implementation

`P05 = NOT_STARTED / BLOCKED_BY_P04_SECURITY_HOLD`.

The P05 acceptance package may be prepared now, but P05 may not be certified until P04 is recorded as `PASS` at exact SHA `5195fa2aaa838ebb7faea2a3b207f27689b7ed4a`. The outstanding owner action is rotation/revocation of the database credential that previously entered Git history, followed by the P04 auditor registry update. A source-code redaction cannot revoke a credential that may already have been copied.

## Evidence-backed root causes

| ID | Root cause | Consequence | One-pass repair family |
|---|---|---|---|
| P05-B1 | Authentication currently centers on access-token issuance; persistent sessions, one-time refresh rotation/replay-family revocation, complete session invalidation, and enforceable MFA are not one lifecycle. Password hashing is below the canonical bcrypt cost. | A stolen/replayed token can outlive the control expected by the contracts; revocation evidence cannot be proven transactionally. | Add canonical session/MFA schema, repository and service boundary, atomic refresh rotation, family revocation, reset/logout invalidation, enumeration-safe responses, and audit. |
| P05-B2 | Authorization is role-oriented instead of one fail-closed permission + tenant + row/data + field-scope decision. Some logging contains identity attributes. | Correct role alone can become excessive access; guessed IDs, exports, batches, or cross-tenant queries can bypass policy consistency. | Introduce one policy decision API/guard, canonical permission slugs, server-derived scope, query constraints, output field filtering, and redacted decision telemetry. |
| P05-B3 | Audit and maker-checker behavior is implemented unevenly across mutation paths and is not certified as part of the same transaction. | A mutation may succeed without durable audit, audit can be mutable, or a maker may approve their own record. | One transactional mutation/audit pattern, immutable database enforcement, actor-at-event snapshot, separation-of-duties policy, concurrency tests. |
| P05-B4 | Communication authorization and note/mention/notification/audit/outbox effects are not consistently resolved from the parent entity and committed atomically. | Unauthorized notes/mentions, duplicate notifications, or silent side-effect loss are possible. | Parent-resource ACL adapter registry plus one transaction for note/mention/audit/outbox; stable idempotency keys, retry and DLQ. |
| P05-B5 | Cross-cutting communication orchestration directly reaches multiple domain persistence implementations. | Domain ownership is blurred and a small change creates unrelated-domain edits. | Replace direct reach-through with owned application ports/handlers and canonical events; enforce dependency direction through AST/source graph. |
| P05-B6 | Ownership, dependency graph, shared-kernel policy, config ownership, dead-code/dependency debt, and representative change blast radius are not one machine-verifiable system. | Architecture claims can pass while the code remains expensive to change. | Generate complete ownership/graph manifests, apply zero-regression ratchets, and rehearse three representative changes in an isolated temp worktree/fixture. |
| P05-B7 | Errors and configuration access are distributed across filters, services, and direct environment reads. | Envelopes/status/codes diverge; PII/secrets or internal errors can leak; startup can accept unsafe configuration. | One canonical error factory/filter and one typed configuration boundary with ownership, validation, safe defaults, redaction, and negative tests. |

## Frozen solution boundary

The authoritative acceptance is [P05_FROZEN_ACCEPTANCE_CONTRACT.md](../P05_FROZEN_ACCEPTANCE_CONTRACT.md) and `scripts/ssot/p05_acceptance_contract.json`. It contains 19 required checks, 31 named mutations, numeric thresholds, mandatory evidence, and the exact certification command.

P05 includes real local PostgreSQL integration for P05 controls. It excludes Docker runtime, deployment, full browser/visual matrices, load/soak, DAST/chaos, DR, full legacy migration, and release clean-room work; those remain P20–P22.

## Expected implementation surface

The executor must derive final paths from ownership and Git diff rather than treating this list as an exemption list. Expected areas are:

- canonical contracts and traceability affected by locked P05 decisions;
- backward-compatible Prisma models/migrations for sessions, MFA, audit enforcement, approvals, and outbox where missing;
- owned auth, policy/tenant scope, audit/maker-checker, communication/outbox, error, and configuration modules;
- `scripts/ssot/lib/p05_certification.js`, `p05_gates.js`, `p05_analyzers.js`, and `p05_safety.js`;
- `scripts/ssot/test_p05_platform_negative.js`;
- deterministic P05 ownership, graph, control, scope, and certification evidence.

Unrelated P06–P18 feature work and UI redesign are out of scope. Any necessary UI touch must import only from `@/components/dna` and satisfy the existing DNA gates.

## Fastest safe execution order

1. Clear and record the P04 security hold; freeze/commit the P05 acceptance package.
2. Build ownership, dependency graph, architecture analyzers, and representative-change predictor first so refactors are guided by measured boundaries.
3. Implement schema/migrations and shared transactional infrastructure once.
4. Complete auth/session/MFA and authorization/tenant controls.
5. Complete audit/maker-checker and outbox/communication controls on the same transaction primitives.
6. Consolidate error/configuration boundaries.
7. Run targeted positive tests per repair family, then all 31 production-path mutations.
8. Run the authoritative certifier once at the end; repair by `gate_id`/`reason_code` until the unchanged committed candidate emits `PHASE_PASS`.

This ordering removes the common source of repeated revisions: implementing business behavior before the certifying analyzer, evidence schema, and failure taxonomy exist.
