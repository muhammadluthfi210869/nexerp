# NEX ERP — P07 Final Bounded Closure

Close P07 in one bounded correction. Work through completion; do not stop for plan approval or partial-green reporting. This prompt freezes the final P07 blocker set. When the four acceptance groups below pass through production paths, `npm run verify:p07` exits naturally with `0`, the affected master E2E passes and no scoped P0/P1 remains, P07 is closed. P2/P3 cannot reopen it.

## Read first

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`
3. `docs/legacy-erp/verification/evidence/batches/P07-P07_BATCH_VERIFICATION_2026-09-20.md`
4. P07-linked canonical contracts only, especially tenant scope, RBAC, workflow, `BUS-RULE-097`, audit/outbox and idempotency

Preserve unrelated working-tree changes. Do not start P08.

## Scope and fixed acceptance

Fix exactly these four P1 root-cause groups. Do not add architecture cleanup, coverage targets or unrelated requirements.

### A. One canonical HTTP path and tenant isolation

- `BussdevController` currently calls `BussdevService`, while P07 tests call the parallel `LeadService`. Converge this: controller, production behavior and tests must use one canonical lead implementation. Do not leave the required controls only in an unused parallel service.
- Use the existing P05 `TenantScope`, `PolicyService`/`ScopeService` and JWT actor organization context. Never trust `organizationId`/`tenantId` or roles from request body/query.
- Add a safe expand migration for the canonical organization key on P07-owned records that require isolation (`SalesLead`, `LeadCapture`, `BussdevStaff`, `GuestLog`, and directly governed dependent records). New writes require a server-resolved organization. Legacy null rows must be inaccessible to ordinary tenants until deterministically assigned; do not invent a tenant or use a broad fallback.
- Resolve public lead-intake tenant from trusted server-side site/campaign/agent configuration. Fail closed with a stable safe error when it cannot be resolved.
- Protect LeadCapture admin list/stats/dashboard/update/bulk routes with existing auth/role guards while keeping explicitly public intake/webhook routes public.
- Every P07 create/read/update/reassign/dashboard query must be tenant-scoped.

Required proof: using real Nest guards/controller and real PostgreSQL, tenant A creates a lead; tenant B cannot read or mutate/reassign it (`403` or non-disclosing `404`), zero row/audit/outbox changes occur, body/query tenant spoofing fails, and tenant A succeeds.

### B. Atomic governed lead command

- The canonical stage/qualification command accepts trusted actor context, correlation ID and idempotency key.
- Inside one Prisma transaction: acquire idempotency/concurrency protection, load the tenant-scoped lead, enforce role and legal transition, update the lead, write immutable audit through `AuditService.withAudit`, and enqueue the required event through `OutboxService.enqueue(tx, ..., { requireExternalTransaction: true })` or its supported equivalent.
- Use one stable payload digest/key. Same key plus same payload replays the original result; same key plus different payload returns conflict; concurrent identical calls create one business effect.
- Critical delivery must not depend on in-process `EventEmitter` execution inside an uncommitted transaction.

Required proof: success produces exactly one state effect, one audit row and one outbox row with the same tenant/correlation; an induced outbox/audit failure rolls back all three; three concurrent identical commands resolve deterministically with one effect.

### C. Consent, attribution and command idempotency

- Implement a production consent-required lead action through the canonical service. A confirmed withdrawn/missing consent must reject before mutation, audit or outbox side effects.
- Append attribution history through a production writer; never overwrite prior snapshots.
- Reuse the existing platform/canonical idempotency mechanism. Tests may seed actors, tenants and initial leads directly, but may not directly create the audit, outbox, idempotency result or attribution result they claim to prove.

Required proof: withdrawn consent rejects the real action with zero effects; two attribution updates retain two ordered snapshots; retry/concurrency uses the production command and leaves one business effect; conflicting payload with the same key is rejected.

### D. Exact scoped dashboard reconciliation

- The production dashboard query must accept trusted tenant plus canonical date/owner/source/stage/SLA filters and apply the same scope to every aggregate.
- Seed tenant A rows inside the range, tenant A rows outside it, and tenant B rows inside it.
- Call the real controller/service query and independently compute source totals.
- Assert exact equality (`toBe`/deep equality), never `<=`, for total, workflow/status, owner, source/attribution and SLA buckets. Tenant B and out-of-range rows must contribute zero.

## Frozen targeted tests

Repair the existing native P07 files rather than creating a harness:

1. `npm --prefix backend run test:p07:intake` — trusted tenant intake, consent, attribution and concurrent dedup.
2. `npm --prefix backend run test:p07:pipeline` — actual controller-delegated canonical command, tenant/RBAC, lifecycle and idempotency.
3. `npm --prefix backend run test:p07:dashboard` — exact tenant/time/filter reconciliation.
4. `npm --prefix backend run test:p07:negative` — cross-tenant/spoof/conflicting-idempotency/atomic rollback cases through production entry points.
5. `npm --prefix backend run test:p07:golden-thread` — HTTP/service seam from intake to qualified handoff with one audit and one outbox effect.
6. `npm --prefix frontend run test:p07` only if the existing UI contract changes.

Tests must fail against the current defect before the owning fix where practical. Do not duplicate business algorithms inside tests. Do not accept direct Prisma result creation as proof of governed behavior. Do not weaken, skip, rename away or delete a required assertion.

## Execution order and time control

1. Make the schema/tenant boundary and canonical service convergence first.
2. Run only tenant/pipeline tests until green.
3. Implement atomic command plus consent/idempotency; run intake/pipeline/negative/golden tests only.
4. Implement scoped dashboard; run dashboard test only.
5. Apply the migration to one disposable P07 database, run the focused set once, and clean only that database in `finally`.
6. Run `npm run verify:p07` exactly once after all targeted tests are green.
7. Run the affected predecessor smoke once:
   `npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts`
8. If final verification fails, fix only its owning group, rerun that targeted command, then allow one final `verify:p07` rerun.

## Prohibited

- no certifier/diagnose CLI, SHA token, mutation framework, evidence engine or historical phase reruns;
- no fake/local policy oracle, manual PASS metric or direct DB insert masquerading as production behavior;
- no client-controlled tenant/roles, default-tenant fallback or credential output;
- no Docker/deploy/load/browser work, repo-wide refactor or P2/P3 cleanup;
- no new ordinary acceptance criterion beyond A–D.

## Mandatory handoff

Return only:

- canonical HTTP/service path selected and duplicate path disposition;
- migration/backfill/null-row handling;
- A–D commands with exit code, counts and durations;
- exact tenant denial, rollback, concurrency and dashboard numeric assertions;
- `npm run verify:p07` result and predecessor E2E result;
- residue count;
- remaining scoped P0/P1, which must be zero;
- P2/P3 backlog, non-blocking.

Do not claim P07 closure if any A–D proof is missing, mocked at the governed boundary, or only represented by a direct fixture write.
