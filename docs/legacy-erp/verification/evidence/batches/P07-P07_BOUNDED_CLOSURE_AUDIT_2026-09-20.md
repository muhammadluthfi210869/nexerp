# P07 Bounded Closure Independent Audit — 2026-09-20

**Verdict:** `FAIL` — commands pass, but the frozen A–D acceptance is not wired to the real HTTP paths.  
**Progression:** P08 implementation remains blocked; read-only inventory is allowed.

## Reproduced commands

| Command | Exit | Result |
|---|---:|---|
| `npm run verify:p07` | 0 | backend 7/7 suites, 21/21 tests; frontend 1/1 suite, 6/6 tests; residue 0 |
| `npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts` | 0 | 1/1 suite, 14/14 tests, 45.855s |

These green commands are false-positive for the production seams below.

## Frozen-acceptance P1 findings

### P1-1 — Real BussDev HTTP create/advance routes bypass the tenant-governed command

- `BussdevController.createLead()` passes `CreateLeadDto` directly to `LeadService.createLead()`. The DTO has no `organizationId`, and the global validation pipe forbids non-whitelisted fields, so the production HTTP route creates `organizationId = null`.
- `BussdevController.advanceLead()` still calls legacy `advanceLeadStage()`, not `advanceLeadStageGoverned()`. It passes no JWT actor organization, correlation ID or idempotency key.
- The tests call `advanceLeadStageGoverned()` directly and therefore never exercise the controller composition claimed in the handoff.

Result: newly created HTTP leads are excluded from scoped reads, and the actual advance endpoint bypasses tenant isolation, governed idempotency, audit and outbox. This violates frozen acceptance A/B and is P1.

### P1-2 — LeadCapture admin routes remain unauthenticated and public intake remains tenant-unresolved

- `LeadCaptureController` has no class or method auth/role guard on list, stats, dashboard, update or bulk-update endpoints.
- `LeadCaptureService.upsertOrphanLead()` still creates/updates `LeadCapture` without `organizationId`.
- The handoff explicitly demotes this missing frozen acceptance to P2/P3 even though prompt A required trusted server-side tenant resolution and fail-closed behavior.

Result: tenant isolation and authorization are not closed for the primary CRM intake/admin surface. This is P1, not backlog.

### P1-3 — Consent is checked against the wrong identity boundary

- `LeadAttribute.leadId` belongs to `LeadCapture`.
- `advanceLeadStageGoverned()` calls `ensureConsentNotWithdrawn(tx, leadId)` using a `SalesLead.id`.
- The golden thread creates a LeadCapture and a separate SalesLead but persists no canonical linkage between them.
- The consent test calls `appendAttribution()` directly with the LeadCapture ID; it does not show that qualification of the linked SalesLead is denied.

Result: a withdrawn LeadCapture consent does not govern the actual SalesLead qualification command. Frozen acceptance C and the lead-to-qualified golden thread remain P1-open.

### P1-4 — Scoped dashboard implementation is neither wired nor complete

- The real `GET /bussdev/dashboard` route still calls `BussdevService.getPageAnalytics('dashboard')`, not `LeadService.getLeadDashboardScoped()`.
- `getLeadDashboardScoped()` implements tenant/date only; it does not accept the frozen owner/source/stage/SLA filters.
- `byWorkflow` is computed by grouping the same `status` field as `byStatus`, and the test asserts only `total` equality.

Result: the production dashboard route can pass while ignoring the scoped reconciliation implementation. Frozen acceptance D remains P1-open.

## Exact minimal closure map

Do not redesign the phase again. Make only these production seams real:

1. Derive a trusted actor context from `req.user` in BussDev create/advance/read/dashboard routes. Pass server organization into `createLead`; call `advanceLeadStageGoverned`; reject absent tenant and client tenant/role injection.
2. Add method-level guards to LeadCapture admin endpoints. Resolve public-intake tenant through trusted site/campaign/agent configuration and persist it; fail closed when unresolved.
3. Persist one canonical LeadCapture-to-SalesLead linkage during handoff. Resolve and check consent through that link inside `advanceLeadStageGoverned`; test qualification rejection from the HTTP/service composition, not `appendAttribution()` alone.
4. Wire `/bussdev/dashboard` to the scoped production query and implement/assert exact tenant/date/owner/source/stage/SLA buckets. Do not leave the new method test-only.
5. Add one controller-composition integration test covering create → read → governed advance → dashboard for tenant A plus denial for tenant B. Existing lower-level tests may remain; do not create a new harness.

After the owning targeted tests pass, run `npm run verify:p07` once and the same predecessor E2E once. No new acceptance, certifier, SHA token, broad refactor or P2/P3 cleanup is authorized.

## P2/P3

- Jest still reports an open handle after P07 suites.
- Cleanup script behavior for foreign concurrent P07 databases remains non-blocking while observed residue is zero.

