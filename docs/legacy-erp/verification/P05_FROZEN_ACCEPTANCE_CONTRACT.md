# P05 Frozen Acceptance Contract v1.0.0

## Certification identity

- Phase: `P05 — Platform architecture, maintainability, and controls`
- Required predecessor: P04 PASS at `5195fa2aaa838ebb7faea2a3b207f27689b7ed4a`
- Immutable phase base: `5195fa2aaa838ebb7faea2a3b207f27689b7ed4a`
- Level: bounded `PHASE_GATE`
- Authoritative command: `node scripts/ssot/certify_p05_phase.js`
- Success: exit `0`, verdict `PHASE_PASS`, token `P05:<candidate-full-sha>:PHASE_PASS`
- Machine contract: `scripts/ssot/p05_acceptance_contract.json`
- Evidence: `docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json`

This contract is frozen before P05 implementation. The auditor will use the same criteria and command. No ordinary criterion may be added after implementation starts; only a newly discovered P0/P1 safety, security, authorization, correctness, or data-integrity defect may amend it with a reproducer.

P05 implementation may be prepared while the P04 credential-rotation hold is open, but P05 certification must fail closed until P04 is recorded PASS at the exact predecessor SHA.

## Objective baseline and known root causes

| ID | Observed baseline defect | Required repair direction |
|---|---|---|
| P05-B1 | `AuthService` issues one access JWT only; no database-backed session, refresh rotation/replay detection, revocation, logout-all, or complete MFA enforcement. Password hashing uses bcrypt cost 10 instead of canonical cost 12. | Implement canonical session/refresh/MFA lifecycle with hashed refresh material, atomic rotation, replay-family revocation, expiry, device/session listing, logout/revoke, password reset invalidation, and audit. |
| P05-B2 | `RolesGuard` checks roles rather than the canonical permission/data-scope matrix and logs user email/roles. Tenant/data scope is not centrally fail-closed. | Central policy service/guard using canonical permission slugs, organization and owner/division/field scope; deny by default; scrub logs. |
| P05-B3 | Cross-cutting mutations do not universally prove audit-before-success, actor-at-event, immutable audit, or maker-checker separation. | Transactional audit and approval controls with database enforcement where applicable; self-approval and audit update/delete rejected. |
| P05-B4 | Communication thread/note/mention operations do not consistently resolve the parent entity ACL. Reply/mention/notification/audit side effects are not one atomic outbox transaction. | Canonical parent-resource ACL adapter registry, tenant enforcement, deduplicated mention notification, transactional outbox, retry/DLQ/idempotency. |
| P05-B5 | `CommunicationProtocolService` reaches directly through production, warehouse, inventory, purchasing, invoice, and ledger persistence, creating a cross-domain orchestration dumping ground. | Move behavior to owned application handlers/interfaces and canonical events; forbid cross-domain Prisma/table reach-through. |
| P05-B6 | Module ownership, dependency graph, shared-kernel policy, configuration ownership, architecture debt, and representative change blast radius are not certified together. | Machine-derived registries/graph, ratchets, CI gates, and isolated representative-change rehearsals. |
| P05-B7 | Error behavior is spread across filters/exceptions/services and may expose PII or noncanonical envelopes/codes. | One canonical error factory/filter; registered codes, correlation ID, field errors, PII/secret scrubbing, stable 4xx/5xx behavior. |

## Scope and cadence

P05 owns cross-cutting platform code and the architectural seams used by all domain phases: module ownership/boundaries, dependency direction, shared kernel, auth/session/MFA, authorization/data scope, tenant isolation, audit, maker-checker, outbox/idempotency, communication ACL/mentions, canonical errors, and configuration ownership.

P05 does not implement P06–P18 domain features, perform legacy bulk migration, polish UI, run browser/load/DR matrices, deploy, push images, or require Docker. It may add backward-compatible database migrations required by its controls and must reuse P04 migration safety. Target runtime is local Node 22 + PostgreSQL 15/16 with unique `nex_p05_<sha>_<pid>_<purpose>` databases.

## Canonical authorities

- Global authority routing: `contracts/00_MASTER_SPEC.md §9.1`
- Entity/schema: `contracts/01_DOMAIN_MODEL.md`, `contracts/schema.prisma`
- Ownership/writers: `contracts/02_DATA_OWNERSHIP.yaml`
- Workflow and approval: `contracts/03_WORKFLOW_STATE_MACHINE.yaml`
- Invariants: `contracts/04_BUSINESS_RULES.md`
- API/errors: `contracts/05_API_CONTRACT.yaml`, `contracts/09_NON_FUNCTIONAL_CONTRACT.md §7–9, §19`
- RBAC/data scopes: `contracts/07_RBAC_MATRIX.yaml`
- Events/outbox: `contracts/08_INTEGRATION_EVENT_CONTRACT.yaml`
- Auth provenance: `ssot/_SSOT_AUTH.md`
- Communication provenance: `ssot/_SSOT_COMMUNICATION.md`, with locked decisions in canonical contracts taking precedence
- Maintainability: `verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md`

## Required gates

1. `predecessor_scope_and_safety` — exact P04 predecessor PASS, committed descendant, safe isolated DBs, no secret/full URL in evidence, no unrelated domain/UI changes.
2. `canonical_traceability` — every implemented control maps to canonical IDs; conflicts are resolved contract-first; P02 lifecycle mappings updated honestly.
3. `architecture_fitness_suite` — real source graph; no bypass/skip; architecture checks block CI.
4. `module_owner_registry` — 100% deployable modules/cross-cutting packages have owner, purpose, layer, allowed dependencies, data owner, public interface, and tests.
5. `dependency_graph_snapshot` — deterministic node/edge graph from AST/module metadata with baseline/candidate digest and classified edge delta.
6. `module_boundary_test` — zero forbidden imports, cross-domain controller/service/table reach-through, or generic shared dumping-ground paths.
7. `circular_dependency_scan` — zero forbidden domain/application cycles.
8. `coupling_complexity_scan` — changed functions complexity ≤10; coupling/debt does not regress; exceptions exact, owned, justified, tested, and expiring.
9. `duplicate_dead_code_scan` — changed duplication ≤1%; whole-code debt does not rise; zero unexplained orphan/dead/duplicate/unused production dependency.
10. `representative_module_change_test` — ephemeral auth-policy, communication-rule, and outbox-handler changes touch only predicted owners/dependants and run targeted tests without unrelated modules.
11. `auth_session_mfa` — login enumeration-safe; bcrypt 12; access 15m; refresh 30d and one-time rotation; replay revokes token family; logout/session revoke/logout-all/reset invalidate; optional/admin-enforced TOTP MFA cannot be bypassed; secrets stored hashed/encrypted as required.
12. `role_permission_matrix` — canonical slugs and action/data/field scopes are enforced deny-by-default; permission decisions use actor-at-event state and never trust client-supplied scope.
13. `tenant_isolation` — cross-organization read/write/search/export/communication access is rejected at service/repository boundary, including guessed IDs and batch paths.
14. `immutable_audit` — every governed mutation writes canonical audit in the same transaction before success; before/after, actor/role, tenant, correlation and source recorded; audit update/delete forbidden.
15. `maker_checker` — maker cannot approve/check/release own governed record; required role and threshold approvals are enforced under concurrency and retries.
16. `outbox_retry_dedup` — state + outbox atomic; stable event/idempotency key; duplicate/out-of-order/retry safe; bounded backoff; DLQ and observability; no silent loss or duplicate side effect.
17. `communication_acl` — notes/replies/attachments/watch/@mention inherit parent entity tenant/RBAC/data scope; unauthorized target/reference rejected; mention + notification + outbox + audit atomic and deduplicated.
18. `canonical_error_contract` — all sampled API failures use canonical envelope/code/status/correlation/field details; no stack, token, credential, email, phone, NIK, cookie, authorization, or internal SQL leaks.
19. `configuration_ownership_test` — runtime configuration has typed schema, owner, safe defaults, startup validation, secret indirection/redaction, and no module-specific environment reads outside the approved configuration boundary.

## Thresholds

- All zero-count safety/correctness thresholds in the machine contract must equal zero.
- Changed duplication must be `<=1.0%`; whole-code duplication/debt delta must be `<=0` relative to P03/P05 base.
- Changed maximum cyclomatic complexity must be `<=10`; 11–15 only through a frozen exact exception; >15 fails.
- Module ownership and representative-change prediction coverage must be `100%`.
- Required RBAC/tenant/maker-checker/auth/outbox/communication/error test matrices must have `100%` executed coverage and zero unexpected skips.

## Adversarial acceptance

Every mutation ID in `p05_acceptance_contract.json` must modify a real temp source fixture, isolated database, HTTP/service input, policy state, event/outbox state, or evidence object and invoke the exact production gate/control path. Self-declared PASS, text-presence-only checks, fabricated summaries, or direct testing of a helper that bypasses the certifying gate are forbidden. Each result records `gate_function`, `mutated_target`, expected/observed `gate_id`, `reason_code`, and cleanup.

## Evidence schema

Every check records `id/status/executed/synthetic/skipped`, redacted commands and exit codes, duration/timeout, base/candidate SHA, target count, numeric metrics, input/source digest, and gate-specific runtime proof. The result includes graph/ownership/scope manifests, architecture debt delta, auth/RBAC/tenant matrices, transaction IDs and persisted row proofs, audit/outbox/mention/error evidence, created/dropped database inventory, and recursive secret scan. Missing, stale, unparseable, zero-target, skipped, synthetic, dirty-source, or credential-bearing evidence is FAIL.

## Deferred release-depth work

Docker/runtime packaging, remote deployment, full browser/UI, load/soak, DAST, chaos, backup/restore DR, full legacy migration, and clean-room release certification remain P20–P22. P05 must still run real local integration tests for its own database-backed controls.

## Auditor guarantee

If the unchanged committed candidate reproduces the authoritative PASS, all frozen checks/mutations/evidence validate, P04 is PASS, and no new P0/P1 issue is found, the auditor accepts P05 without adding ordinary criteria.

