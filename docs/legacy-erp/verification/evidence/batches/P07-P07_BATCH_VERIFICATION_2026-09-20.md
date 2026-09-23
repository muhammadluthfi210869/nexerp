# P07 Focused Batch Verification — 2026-09-20

**Scope:** P07 CRM, Marketing, Guest Book and BusDev  
**Method:** `_FAST_DELIVERY_EXECUTION_STANDARD.md` and `_BATCH_VERIFICATION_PLAN.md`  
**Verdict:** `FAIL` — focused commands pass, but reproducible scoped P1 product gaps remain

## Reproduced commands

| Command | Exit | Numeric result |
|---|---:|---|
| `npm run verify:p07` | 0 | backend typecheck/lint PASS; backend 7/7 suites and 17/17 tests; frontend 1/1 suite and 6/6 tests; test/server residue 0 |
| `npm --prefix backend run test:e2e -- --runTestsByPath test/master/master-governed-import.e2e-spec.ts` | 0 | 1/1 suite and 14/14 tests in 61.875s |

The passing command proves that the current tests execute naturally. It does not close the semantic gaps below.

## P0/P1 findings

### P1-1 — Tenant isolation is not implemented or exercised for the P07 business records

- `SalesLead`, `LeadCapture`, `BussdevStaff` and `GuestLog` do not carry an `organizationId`/tenant key in their current Prisma models.
- `MarketingViewer` and `ensureMarketingTaskRole()` validate roles only; they have no tenant/resource scope input.
- The test named `cross-tenant write attempt` explicitly asserts that the policy does **not** throw and performs no resource read or mutation. Counting pre-existing audit rows as zero cannot prove cross-tenant denial.

This conflicts with the frozen P07 requirement for tenant-safe ownership/read/reassignment and meets P1 because authorization/tenant isolation is materially wrong or unproven on the production path.

### P1-2 — Lead state mutation, audit and outbox are not one atomic production operation

- The real `BussdevController` delegates lead create/advance/read/dashboard operations to `BussdevService`, while the corrected P07 pipeline/golden tests exercise the parallel `services/lead.service.ts` implementation. A green test on `LeadService` therefore does not prove the HTTP production path used by users.
- `LeadService.advanceLeadStage()` changes the lead in a Prisma transaction but does not insert the required audit and outbox rows in that transaction.
- The golden-thread test calls `AuditService.writeDirectAudit()` afterward and inserts `outboxEvent` directly through Prisma. Those independent test actions can succeed even when the production command never writes audit/outbox.
- Its rollback case rejects an illegal transition before any audit/outbox write is attempted; it does not inject a failure between the business write and audit/outbox to prove atomic rollback.

This conflicts with `BUS-RULE-097` and the frozen `audit_outbox_atomicity` acceptance and is a P1 transaction/audit defect.

### P1-3 — Consent and idempotency acceptance are represented by fixture writes rather than governed commands

- The consent test stores and confirms a `consent_withdrawn=true` attribute but never calls a consent-required action and never proves that such an action is denied.
- No consent enforcement was found in the P07 production service scope.
- The pipeline idempotency test manually creates/refetches a `MarketingIdempotencyKey`; it never repeats or races the production lead command with the same key.
- Attribution history is inserted directly through Prisma instead of through the production intake/attribution writer.

Consequently, withdrawn consent can still reach an action that does not check it, and command-level at-most-once behavior is not established. These are P1 gaps in required primary workflow controls.

### P1-4 — Dashboard reconciliation does not prove the frozen business dimensions

- The dashboard test compares the global `LeadCapture` count to the same table's global count.
- Seed contribution is asserted with `<= dashboard.total`; it does not prove exact tenant/time/owner/source/stage/SLA reconciliation.
- It does not reconcile CRM, BusDev and marketing views to one filtered source transaction set.

The command is green even when a scoped dashboard omits or leaks records, so the required P07 dashboard flow remains materially unverified.

## One correction-cycle remediation map

Implement in dependency order and keep the correction to these four root-cause groups:

1. **Tenant boundary:** add the canonical organization key and migration to P07-owned records that require isolation; derive tenant from authenticated context, never request payload; scope create/read/update/dashboard queries; add one two-tenant production-service test covering read and reassignment denial with zero mutation/disclosure.
2. **Governed lead command:** converge the duplicate `BussdevService`/`LeadService` paths so the controller and tests call one canonical implementation. Create or extend that production transaction command for the governed stage/qualification change. In the same Prisma transaction, validate transition and tenant/role, update the lead, insert immutable audit and insert an outbox row with a stable idempotency key. Add one success case, one injected audit/outbox failure rollback and one concurrent duplicate case.
3. **Consent/attribution/idempotency:** route the consent-required action and attribution append through production methods. Reject confirmed withdrawal before side effects. Reuse the existing platform/canonical idempotency implementation rather than writing its table in the test. Test retry and concurrency through the command entry point.
4. **Scoped dashboard reconciliation:** make the production query consume the same tenant/time/filter context as source transactions. Seed relevant and irrelevant tenant/time rows, call the real dashboard query, and assert exact equality for total, status, owner, source/attribution and SLA buckets.

After each group, run only its owning P07 test. When all four are green, run `npm run verify:p07` once and the affected master-data E2E once. Do not add a certifier, mutation framework, SHA token, historical-suite rerun or unrelated refactor.

## P2/P3 backlog (non-blocking after P1 closure)

- `p07_clean_db.js` warns but still exits 0 when server-level `nex_p07_*` databases exist; current observed residue was zero.
- Jest reports an open-handle warning after the P07 backend suites even though the command exits 0.
- The thin verifier does not currently include an affected frontend typecheck/lint command; add it only if the corrected production frontend changes.

## Progression decision

Do not implement P08 against P07 lead/tenant/qualification interfaces yet. P08 may be inventoried read-only. P07 progresses after the four P1 groups above are closed through production-path focused tests and the existing thin verification.
