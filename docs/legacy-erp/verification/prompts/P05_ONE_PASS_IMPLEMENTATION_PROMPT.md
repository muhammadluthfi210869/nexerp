# NEX ERP — P05 One-Pass Implementation and Certification Prompt

Copy everything below into the executor CLI as one task. Do not shorten the acceptance criteria.

---

You are the implementation owner for **NEX ERP Phase P05 — Platform architecture, maintainability, and controls**. Work autonomously from diagnosis through a reproducible authoritative certification. Do not stop at an implementation summary, partial test result, or self-declared PASS.

## Required outcome

Finish only when this exact command, run against the unchanged committed candidate, exits `0` and emits a SHA-bound token:

```text
node scripts/ssot/certify_p05_phase.js
P05:<candidate-full-sha>:PHASE_PASS
```

If the exact P04 predecessor is not yet registered PASS, prepare P05 without weakening anything, report `BLOCKED_BY_P04_SECURITY_HOLD`, and do not claim or fabricate P05 certification. Once the owner clears that external hold, continue from the same package until authoritative PASS.

## Read completely before editing

1. `AGENTS.md` and `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/P05_FROZEN_ACCEPTANCE_CONTRACT.md`
3. `scripts/ssot/p05_acceptance_contract.json`
4. `scripts/ssot/certify_p05_phase.js`
5. `docs/legacy-erp/verification/evidence/P05_BASELINE_AND_ROOT_CAUSE_2026-09-18.md`
6. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
7. `docs/legacy-erp/verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md`
8. P04 and P05 entries in `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml`
9. Canonical authorities: `contracts/00_MASTER_SPEC.md`, `01_DOMAIN_MODEL.md`, `schema.prisma`, `02_DATA_OWNERSHIP.yaml`, `03_WORKFLOW_STATE_MACHINE.yaml`, `04_BUSINESS_RULES.md`, `05_API_CONTRACT.yaml`, `07_RBAC_MATRIX.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`, `09_NON_FUNCTIONAL_CONTRACT.md`, and `10_TRACEABILITY_MATRIX.yaml`
10. Provenance only after canonical authorities: `ssot/_SSOT_AUTH.md` and `ssot/_SSOT_COMMUNICATION.md`
11. Current auth/guard/policy/audit/approval/communication/notification/outbox/error/config code, modules, tests, migrations, and P03/P04 reusable safety helpers.

Resolve contradictions using the authority ladder in the master contract. Update canonical contracts and traceability first when an accepted P05 decision is missing. Never silently choose an implementation because a legacy service already behaves that way.

## Frozen items — never move the finish line

Do not edit, replace, bypass, wrap around, or regenerate:

- `scripts/ssot/certify_p05_phase.js`
- `scripts/ssot/p05_acceptance_contract.json`
- the base SHA, required IDs, thresholds, evidence schema, or success semantics in `P05_FROZEN_ACCEPTANCE_CONTRACT.md`
- P03/P04 certifiers, their contracts, migrations, or evidence to make P05 pass
- Git history, ignore rules, or environment values to hide a failure

No skip, fast, cached, mocked, synthetic, warning-only, zero-target, text-presence-only, or self-declared PASS is acceptable. Never expose credentials in terminal output or artifacts. Do not rotate external credentials yourself unless the owner explicitly authorizes it.

## Scope discipline

P05 owns architecture seams and cross-cutting platform controls. Do not implement P06–P18 domain features, redesign the UI, use Docker, deploy, run full browser/load/DR suites, or perform legacy bulk migration. Local Node 22 and isolated PostgreSQL 15/16 databases are sufficient. Create only databases matching `nex_p05_<sha>_<pid>_<purpose>` and drop every one in `finally` cleanup.

If frontend UI must change for a necessary auth/control flow, every primitive must import from `@/components/dna`; no native interactive element, hardcoded visual token, duplicate primitive, or inline style is allowed. Run the existing P03 DNA source gates on the touched closure.

## Build the certifying implementation first

Implement these files as small, testable modules rather than one monolithic runner:

- `scripts/ssot/lib/p05_certification.js` exporting `certifyP05({ root, contract, candidateSha })`
- `scripts/ssot/lib/p05_gates.js` with one exported fail-closed function per required check
- `scripts/ssot/lib/p05_analyzers.js` for AST/source graph, ownership, dependency direction, duplication/dead code, complexity, and representative-change analysis
- `scripts/ssot/lib/p05_safety.js` for target validation, process execution, cleanup, hashing, evidence redaction, and recursive secret assertion
- `scripts/ssot/test_p05_platform_negative.js` containing every required mutation ID

Use a structured `P05GateError(gate_id, reason_code, message, safe_details)` everywhere. The same production gate functions used by certification must be called by negative tests. Do not create separate permissive test-only logic.

All 19 gates must record the exact evidence required by the frozen wrapper: actual command/exit code, duration, immutable base/candidate SHA, nonzero target count, numeric metrics, input/source digest, and runtime/persistence proof. Preserve full subprocess streams long enough to parse results, then redact and cap stored evidence. Reject stale, missing, zero-target, skipped, dirty, unparseable, or credential-bearing evidence.

## Complete remediation map

### A. Architecture, ownership, and maintainability

1. Generate a complete module-owner registry from real deployable backend modules and cross-cutting packages. Each entry declares owner, purpose, layer, public interface, owned persistence, allowed dependencies, tests, and architecture exceptions.
2. Derive a deterministic import/provider/module/persistence dependency graph from AST and framework metadata. Record baseline and candidate digests plus every classified edge delta.
3. Enforce domain/application/infrastructure dependency direction. Reject domain cycles, controller/service reach-through, direct use of another domain's Prisma delegate/table, and generic shared dumping grounds.
4. `shared`/`common` may contain only stable cross-cutting primitives with named owner and consumers; domain behavior belongs to its owning module.
5. Scan real production scope for unused dependencies/exports, orphan providers/controllers, duplicate rules/code, and changed complexity. Exclude tests by parsed path conventions, not convenient manual lists. Apply the frozen thresholds exactly.
6. Rehearse three representative changes in isolated temporary fixtures/worktrees: an auth policy change, communication ACL/rule change, and outbox handler change. Predict owners/dependants before mutation; prove touched paths and targeted tests match the prediction with 100% coverage and no unexplained unrelated-domain edit. Restore/clean every mutation.
7. Wire the architecture fitness suite into the existing CI fast gate without adding release-depth work.

### B. Authentication, persistent sessions, and MFA

1. Implement database-backed session/token-family state. Store only hashes for refresh/recovery material; encrypt MFA secrets using approved secret indirection. Never persist plaintext credentials/tokens.
2. Enforce canonical access and refresh lifetimes, atomic one-time refresh rotation, replay detection, family revocation, expiry, session listing, single-session revoke, logout, logout-all, and reset/password-change invalidation.
3. Use bcrypt cost 12 for newly created/changed passwords and a safe transparent upgrade path for older valid hashes.
4. Make login and recovery enumeration-safe with generic external responses, rate-limit/audit evidence, and no email/phone/token leakage.
5. Implement TOTP enrollment/confirmation/challenge/recovery and admin-enforced MFA. A pending or required MFA state must never receive a fully authorized session.
6. Test concurrent refresh attempts: exactly one succeeds; the replay policy deterministically revokes the expected family without creating multiple live sessions.

### C. Permission, data scope, field scope, and tenant isolation

1. Implement one fail-closed policy decision API used by guards and service/repository boundaries. Resolve canonical permission slugs and action scopes from server-side actor-at-event state.
2. Derive organization/tenant and owner/division/department/region scopes on the server. Never trust a tenant/scope/role supplied by a client.
3. Apply query constraints before data retrieval for reads, writes, search, aggregates, export, batch endpoints, and communication parent resolution. Apply canonical field masking/omission after authorization.
4. Reject cross-tenant guessed IDs and mixed-tenant batch inputs atomically. Avoid existence leaks in status/message/timing where the contract requires concealment.
5. Remove identity/roles/tokens from application logs; retain safe correlation and decision identifiers.

### D. Immutable audit and maker-checker

1. Put governed state mutation, audit row, approval action, and any outbox row in one database transaction. Never write audit “after success.”
2. Record actor-at-event, role/permission snapshot, tenant, correlation/idempotency key, source, before/after, entity/version, and timestamp according to contracts.
3. Enforce audit immutability at service and database level; update/delete attempts must fail and be tested.
4. Centralize maker-checker rules. Reject self-approval/release, wrong role, stale version, missing threshold approvals, duplicate action, and concurrent double approval.

### E. Transactional outbox and communication protocol

1. Replace ephemeral-only delivery with a durable transactional outbox. Business state + audit + outbox must commit atomically.
2. Use stable event and idempotency keys, deterministic deduplication, bounded retry/backoff, lease/claim safety, observability, and DLQ after the configured terminal policy. Duplicate and out-of-order delivery must not duplicate side effects.
3. Replace direct cross-domain persistence in communication orchestration with owned ports/adapters/application handlers or canonical events.
4. Resolve note/thread/reply/attachment/watch/mention permission through a typed parent-resource ACL adapter registry. Enforce tenant, permission, data scope, field visibility, and target-user eligibility.
5. Note/reply + mentions + deduplicated notifications + audit + outbox are one transaction. Reject inaccessible parents/references and unauthorized or cross-tenant mention targets.
6. Retain in-process events only as post-commit optimization; they cannot be the durability source.

### F. Canonical error and configuration boundaries

1. Use one canonical error factory/filter/registry. Validate registered code, HTTP status, safe message, correlation ID, and structured field details.
2. Scrub stack traces, SQL/internal paths, credentials, authorization/cookie headers, refresh/access tokens, email, phone, NIK, and other governed PII from API response, logs, command evidence, and certification artifacts.
3. Create one typed runtime configuration schema/boundary with named owner, startup validation, safe nonsecret defaults, secret indirection, and redacted diagnostics.
4. Reject direct module-specific `process.env` access outside approved bootstrap/config/safety boundaries and reject secret-like committed defaults.

### G. Database migration safety

Any P05 schema change must be backward-compatible and reuse P04 safety: `prisma migrate deploy`, immutable pre-base migrations, reversible candidate migration with `down.sql` where required, isolated database rehearsal, idempotency, catalog checks, source fingerprint preservation, and full cleanup. Never use `db push` or `--accept-data-loss`.

## Mandatory positive and adversarial tests

Implement targeted unit/integration/contract tests for every behavior above. Then execute every mutation in `required_mutations` from `scripts/ssot/p05_acceptance_contract.json` through the same production gate/control path. Each mutation must change real temporary source, policy, database state, HTTP/service input, event/outbox state, or evidence and prove rejection with the expected `gate_id` and `reason_code`.

Especially prove:

- domain cycle, forbidden import, direct cross-domain persistence, unowned module, shared dumping ground, orphan/unused dependency, complexity, duplication, and blast-radius regressions fail;
- revoked session reuse, refresh replay, MFA bypass, login enumeration, permission bypass, cross-tenant access, and field leak fail;
- post-success audit, audit mutation, and self-approval fail;
- non-atomic/lost/duplicate outbox and unauthorized/deduplicated communication mutations fail;
- error-envelope/PII leak, unsafe config, stale SHA evidence, and unexpected skipped test fail.

Mutation tests must restore all files and database state in `finally`. A mutation is PASS only when the expected production gate rejects it; unexpected crashes, setup failures, or a different gate do not count.

## Efficient execution order

Do not run the full certifier after every edit. Use this sequence:

1. static ownership/graph/boundary/complexity/duplication targeted checks;
2. auth/session/MFA targeted unit + DB integration tests;
3. permission/tenant/field-scope targeted tests;
4. audit/maker-checker transactional tests;
5. outbox/communication transactional and retry tests;
6. error/config tests and recursive secret scan;
7. representative-change rehearsals and all 31 adversarial mutations;
8. relevant backend typecheck/lint/unit/integration/build plus touched frontend checks if any;
9. commit the candidate, ensure source tree cleanliness, and run the authoritative certifier once;
10. if it fails, repair by the emitted `gate_id`/`reason_code`, rerun only that targeted family, recommit, then rerun authoritative certification. Continue until PASS.

Do not spend P05 time on Docker, deployment, full frontend build/browser matrices, load, DAST, chaos, DR, or future domain suites.

## Pre-certification checklist

Before the authoritative run, verify all are true:

- P04 exact predecessor is registered PASS and credentials exposed in prior history have been rotated/revoked by the owner;
- all frozen acceptance files are byte-identical to phase-start versions;
- canonical contracts, schema, migration, code, tests, and traceability agree;
- 19/19 gates pass targeted execution with nonzero real targets;
- 31/31 mutations reject through production paths;
- no unexpected skip/todo/quarantine, synthetic evidence, warning-only gate, or zero-target pass;
- all P05-created databases were dropped and source database fingerprint is unchanged;
- recursive evidence scan finds no URL user-info, credential, token, cookie/auth header, PII, or secret;
- working tree is committed and clean except the declared generated evidence allowlist;
- candidate is a descendant of the frozen base and evidence uses exact candidate SHA.

## Final handoff format

Return:

1. authoritative command, exit code, verdict, candidate/base SHA, and exact token;
2. 19/19 check table with targets, metrics, duration, and evidence path;
3. 31/31 mutation table with production gate function and structured rejection;
4. changed-path ownership ledger and explanation of every cross-cutting path;
5. migration/source-integrity/database-cleanup proof;
6. test/typecheck/lint/build counts with zero unexpected skips;
7. recursive secret/PII scan result;
8. explicit deferred P20–P22 work;
9. any genuine external blocker. Do not describe unfinished implementation as complete.

The success token is the only completion claim. Persist until it exists or an external owner-only blocker makes further progress impossible.

---

This is a one-pass target, not a mathematical promise that no unknown P0/P1 defect exists. The frozen contract guarantees that a reproducing PASS will not be rejected later by newly invented ordinary criteria.
