# P07 — Final HTTP Seam Fix (DeepSeek Flash)

Fix the current uncommitted P07 candidate. Do not plan, request approval, redesign P07, or stop at partial green. The existing unit suites pass but miss the real HTTP composition. Work only on the four frozen seams below until the mandatory HTTP closure test and existing focused verification pass.

## Read only

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`
3. `docs/legacy-erp/verification/evidence/batches/P07-P07_BOUNDED_CLOSURE_AUDIT_2026-09-20.md`

Preserve unrelated changes. Do not implement P08. Do not apply migrations to a shared/live database; use one disposable P07 database and clean it in `finally`.

## First action: freeze one HTTP test

Create `backend/test/p07/p07-http-closure.e2e-spec.ts` and package script `test:p07:http-closure`. It must boot the real Nest application/controller/guards/services against PostgreSQL and assert all items below. Write this test before production edits; after its first failure, do not weaken/delete/skip its assertions.

1. Unauthenticated `lead-capture` admin list/dashboard/update returns `401/403`; explicitly public track/WhatsApp intake remains reachable.
2. Public intake resolves a server-owned `P07_PUBLIC_LEAD_ORGANIZATION_ID`, persists it on `LeadCapture`, and fails closed with `P07_TENANT_UNRESOLVED` when missing/invalid. Client body/query cannot override it.
3. Tenant-A authenticated create produces a `SalesLead.organizationId = tenantA` linked by `leadCaptureId` to a tenant-A `LeadCapture`. Organization comes from `req.user`, never DTO.
4. Tenant-B read/update/reassign/advance of that lead returns non-disclosing `403/404`; lead, audit and outbox counts remain unchanged.
5. Tenant-A HTTP advance reaches the governed command. One success creates exactly one state effect, one audit and one outbox with the same tenant/correlation. Three concurrent requests with the same idempotency key produce one effect; same key/different payload returns `IDEMPOTENCY_KEY_REUSED`.
6. Confirmed withdrawn or missing required consent on the linked `LeadCapture` blocks the HTTP qualification/marketing action with zero business/audit/outbox effects. Granted consent succeeds. The check must follow `SalesLead.leadCaptureId`; never query `LeadAttribute` using `SalesLead.id`.
7. Tenant-A `/bussdev/dashboard` excludes tenant B and out-of-range rows and exactly reconciles total, status/workflow, owner, source/attribution and SLA buckets for tenant/date/owner/source/stage/SLA filters.

Fixture inserts may create tenants/users/initial consent records. They may not create the audit, outbox, idempotency result, qualified state or dashboard result being proved.

## Production fixes — exactly four seams

### 1. Controller actor wiring

- Build one trusted actor helper from `req.user.id`, `req.user.organizationId || req.user.tenantId`, roles, `idempotency-key`, and correlation header/generated UUID.
- `POST /bussdev/lead`: pass actor separately to the service; never merge organization into `CreateLeadDto` from client input.
- `GET/list/update/reassign /bussdev/lead*`: use tenant-scoped `LeadService` methods.
- `PATCH /bussdev/lead/:id/advance`: call `advanceLeadStageGoverned`, not `advanceLeadStage`.
- `GET /bussdev/dashboard`: call the scoped dashboard method with actor tenant and filters.

### 2. LeadCapture tenant/auth boundary

- Add method guards/roles to admin list, stats, dashboard, update and bulk-update; keep only documented intake/webhook endpoints public.
- Resolve public intake organization from server-only `P07_PUBLIC_LEAD_ORGANIZATION_ID`; validate UUID, fail closed, and persist it on every create/update/dedup path.
- Never accept tenant/roles from public or authenticated request payload/query.

### 3. Canonical capture-to-commercial linkage and consent

- Add safe expand migration and Prisma relation: nullable unique `SalesLead.leadCaptureId` → `LeadCapture.id` with index/FK; do not destroy or guess legacy links.
- During tenant-A lead creation/handoff, load `leadCaptureId` under the same organization and persist the link; reject cross-tenant capture IDs.
- `advanceLeadStageGoverned` resolves consent through the linked LeadCapture. Missing/withdrawn required consent rejects before mutation. Attribution is appended through the production writer.

### 4. Governed dashboard/transaction wiring

- Keep business update + durable idempotency + `AuditService.withAudit` + `OutboxService.enqueue(tx, ..., {requireExternalTransaction:true})` in one Prisma transaction.
- Add a focused rollback test by making the real command's outbox/audit dependency throw after the staged update; transaction must leave zero changes.
- Dashboard accepts and applies tenant/date/owner/source/stage/SLA filters to every aggregate. `byWorkflow` must not duplicate `byStatus`, and assertions must use exact equality, never `<=`.

## Commands

Run only the owning test while editing:

```text
npm --prefix backend run test:p07:http-closure
npm --prefix backend run test:p07:intake
npm --prefix backend run test:p07:pipeline
npm --prefix backend run test:p07:dashboard
npm --prefix backend run test:p07:golden-thread
```

After all are green, run once:

```text
npm run verify:p07
npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts
```

One final `verify:p07` rerun is allowed only after a real fix. Do not run historical certifiers or unrelated suites.

## Prohibited and finish condition

No certifier, diagnose CLI, SHA/PASS token, mutation framework, direct-result fixtures, test-only production methods, client tenant fallback, shared/live DB migration, P2/P3 cleanup, or new acceptance criteria.

Finish only when the HTTP closure E2E passes without weakened assertions, existing focused commands exit naturally with `0`, residue is `0`, and scoped P0/P1 is `0`. Return changed paths, numeric test results/durations, and exact HTTP assertions only.
