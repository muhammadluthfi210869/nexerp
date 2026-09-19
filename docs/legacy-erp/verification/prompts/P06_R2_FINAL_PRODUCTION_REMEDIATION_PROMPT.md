# NEX ERP P06 R2 — Final Production-Behavior Remediation

Continue autonomously from candidate `59bf62820280d86b1b2830e7892632551e3fe091`. Read `docs/legacy-erp/verification/evidence/batches/P06-P06_AUDIT_R2_2026-09-19.md` completely. Do not stop at a plan, do not ask for approval, and do not run the authoritative certifier until every targeted production-behavior test below is green.

Preserve the empty-database migration safety and atomic category sequence. Do not modify the three frozen P06 files or weaken any contract ID/threshold.

## 1. Correct scope before implementation

- Restore these P16-owned files exactly to their state at `b0cfb3186ce1317a3b3c16c567df58ca9e02f954`:
  - `frontend/src/app/(dashboard)/master/hr-attendance/page.tsx`
  - `frontend/src/app/(dashboard)/master/hr-payroll/page.tsx`
  - `frontend/src/app/(dashboard)/master/hr-recruitment/page.tsx`
- Exclude later-phase HR/KPI/automation behavior using contract-derived ownership, not filename renaming.
- Keep P06-owned personnel user/role administration in scope.

## 2. Replace false-positive harness paths

- Remove default PASS semantics from `baseShape`; require explicit observed assertions and calculated target counts.
- Delete every unconditional seam PASS and every existence/text-only substitute for behavioral requirements.
- Missing DB/service/component context must fail, never fall back to PASS.
- Remove every `?? 0/50/100` compliance default. Missing provenance is a certification failure.
- Each metric must cite executable observation IDs and be recomputable.
- Rewrite all 20 mutations so the test does not throw the expected rejection itself. Mutate a disposable source tree/database/production input and call the exact production gate/service.
- Meta-test every mutation by disabling its real detector/control and require the mutation suite to fail.

Targeted harness acceptance:

```text
node scripts/ssot/test_p06_master_negative.js --meta
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory
```

The current incomplete application must fail after this harness correction. Do not weaken the harness to regain green.

## 3. Implement SF2 identity/config and P05 controls

- Implement the canonical organization, division, user-role administration, warehouse access and typed non-secret configuration lifecycle.
- Call the real P05 Policy, Scope, Audit, Outbox and canonical Error boundaries from production services.
- Seed two tenants, divisions, roles with different permissions, owners and field scopes in isolated PostgreSQL.
- Execute real allow/deny tests for list, detail, search, export, create, update, deactivate, guessed ID, tenant, division/owner and restricted fields.
- Prove mutation + audit + outbox commit together and injected audit/outbox failure rolls the master mutation back.

Targeted acceptance:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF2-identity-config
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-P05-POLICY
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IDENTITY-MASTER
```

## 4. Complete SF3 catalog runtime behavior

- Exercise every canonical P06 master through its real service/controller/database path.
- Test validation, normalized uniqueness, two concurrent generated codes, reference integrity, active/inactive visibility, referenced deactivation, historical reads, cross-tenant references, bounded pagination and filtered totals.
- Do not certify a catalog merely because its model/controller exists.

Targeted acceptance:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF3-catalog-masters
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-CATALOG-REFERENCES
```

## 5. Make SF4 import/export reachable and complete

- Add governed controller/API endpoints and typed request contracts; wire frontend/API clients where canonical.
- Parse the declared formats with size/type/encoding/header validation.
- Reuse normal entity DTO validators and production CRUD services; do not maintain a weaker validation switch.
- Require a stable persisted idempotency key and return the original result on retry.
- Make batch commit all-or-nothing with redacted row diagnostics.
- Apply trusted policy/tenant/owner/field scope and atomic audit/outbox.
- Cover every canonical P06 import/export entity, especially supplier import required by REQ-001/BUS-RULE-026.
- Export exactly the filtered authorized dataset and neutralize formula cells.

Tests must call the actual service/API against isolated PostgreSQL and assert before/after row, audit and outbox counts. Merely checking that `import-export.service.ts` exists is forbidden.

Targeted acceptance:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF4-bulk-io
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-IMPORT-CRUD
```

## 6. Complete SF5 live UI behavior

- P06-owned screens must load from typed API clients and expose loading, empty, error/retry, denied, validation, conflict, inactive/reference and success states.
- An API exception must visibly set an error state and retry action; silently returning an empty array fails.
- Personnel user/role administration must use live data.
- Add component tests that mock success, empty, 403, 409, 422 and network failure and assert rendered state/actions.
- Keep all visual/interactive primitives imported from `@/components/dna`.

Targeted acceptance:

```text
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF5-frontend-ui
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-API-UI
```

## 7. SHA-bound admission and certification

The preflight/certifier must record actual commands, exit codes, durations, parsed counts and skip counts for:

- backend/frontend changed-scope lint and typecheck;
- related backend/frontend unit and integration tests;
- backend/frontend production builds;
- SSOT validation and affected P03/P04/P05 fast regressions;
- all six subphases, six seams, 16 gates and 20 real mutations;
- source fingerprint/session integrity and disposable DB cleanup.

Run only after all targets above pass:

```text
node scripts/ssot/diagnose_p06_phase.js --seam P06-SEAM-MUTATION-AUDIT
node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF6-integration
node scripts/ssot/diagnose_p06_phase.js --preflight
```

Commit the candidate, then run the authoritative certifier twice on the same SHA. Return only if both exit `0`, emit the identical SHA-bound token, no non-allowlisted file changes, no source DB disturbance and zero disposable DB residue. The handoff must report actual behavioral assertion counts; file existence and PASS labels are not evidence.
