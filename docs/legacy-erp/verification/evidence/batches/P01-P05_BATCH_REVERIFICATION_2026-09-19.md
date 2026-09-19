# P01–P05 Batch Reverification — 2026-09-19

## Batch verdict

`PARTIAL_PASS — CURRENTLY CERTIFIED THROUGH P01`

First failed phase/gate: `P02 / schema_diff`.

Requested range P01–P06 was split at five phases according to `_BATCH_VERIFICATION_PLAN.md`. This file covers P01–P05; P06 is recorded separately.

Baseline inspected: HEAD `59bf62820280d86b1b2830e7892632551e3fe091` plus an active dirty P06 remediation working tree. User changes were preserved. Generated P01/P02 reports were refreshed by read-only validators.

## Current execution results

| Command | Result |
|---|---|
| `node scripts/ssot/validate_ssot.js` | Exit 0; 19/19 PASS; 0 decisions; 92 canonical models, 377 APIs, 179 screens |
| `node scripts/ssot/test_source_inventory.js` | FAIL after seven passing assertions; Nest reachability expected dead but derived live |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | Exit 1; 10/14 PASS |
| `node scripts/ssot/test_lifecycle_reconciliation_negative.js` | Exit 0; 40/40 mutations rejected |
| `node scripts/ssot/validate_model_targets.js` | Exit 0; 92/92 targets valid |
| `node scripts/ssot/validate_api_mappings.js` | Exit 0; 377/377 classified/mapped or planned |
| `node scripts/ssot/validate_screen_mappings.js` | Exit 0; 179/179 classified/mapped or planned |
| `node scripts/ssot/validate_classifications.js` | Exit 0 for the stale registry snapshot; 1,089 recorded objects classified |
| `node scripts/ssot/validate_adapter_metadata.js` | Exit 0; 10/10 adapter metadata entries valid |
| `npm --prefix backend run build` | Exit 0; 523 files compiled |
| `npx tsc --noEmit --project frontend/tsconfig.json` | Exit 0 |
| Current P03 architecture suite | NOT VERIFIED; long run was interrupted before final output and was not rerun after P02 failed |

## Phase verdicts

### P01 — PASS

The current canonical SSOT remains aligned and deterministic: 19/19 gates pass, all four historical business decisions remain resolved, there are no open blocking decisions, and locked-status integrity passes. P01 remains valid.

### P02 — FAIL

The adversarial suite remains strong (40/40), but the positive lifecycle registry is stale relative to repository implementation.

Four required gates fail:

1. `schema_diff`
   - P05 platform models are missing from the registry: AuthSession, MFA, AuditLog, Approval, Outbox, TenantScope and CommunicationPolicy families.
   - P04/P05 migrations are missing from the registry, including the slug-index migration and platform-controls migration.
2. `event_workflow_diff`
   - BussDev Lead/Pipeline publishers are marked unreachable while the derived Nest graph now finds them reachable.
3. `caller_import_registration_scan`
   - P05 platform services/modules and the P06 `ImportExportService` are missing from the registry.
   - Several pre-existing services have stale dead/live reachability classifications.
4. `unused_export_dependency_scan`
   - `backend/src/platform/index.ts` and its public members are absent from registry accounting.

`test_source_inventory.js` independently reproduces the reachability disagreement. Therefore P02's registry `PASS` status is no longer true for the integrated repository.

### P03 — HISTORICAL PASS / CURRENT NOT CERTIFIABLE

Candidate `cf8b725d9fec4c808937c50217a3bc45050d271a` remains an ancestor of HEAD and has a valid independent historical token. Current backend build and frontend typecheck pass. However:

- P02 currently fails, so strict sequencing blocks current P03 certification;
- the current architecture suite did not complete in this audit;
- the old `_p03_test_results.json` is not current evidence and contains a historical `skipSubprocess`/zero-DNA-target representation that was superseded by the SHA-bound R6 certification.

The historical P03 result is not erased, but it cannot certify the present integrated working tree.

### P04 — TECHNICAL HISTORICAL PASS / SECURITY HOLD

Candidate `5195fa2aaa838ebb7faea2a3b207f27689b7ed4a` has valid technical evidence: 11/11 checks and 16/16 mutations. The latest independent P04 audit nevertheless states `TECHNICAL_PASS / SECURITY_HOLD` and requires credential rotation/revocation plus a rerun.

No later repository evidence confirms that owner action. A path-only credential-pattern scan finds 24 tracked candidate files; many are deliberate examples/negative fixtures, but multiple local utility scripts still contain hardcoded credential-shaped connection strings. Secret values were not printed.

The registry's unconditional P04 `PASS` conflicts with its latest audit evidence and must not be relied upon until owner rotation/revocation is confirmed and hardcoded operational credentials are removed or replaced with environment reads.

### P05 — HISTORICAL TECHNICAL PASS / CURRENT NOT CERTIFIABLE

Candidate `c7cb59ebed247cce3d947ecb6454a45d92c32ca8` remains an ancestor of HEAD and independently passed its frozen 19 gates and 31 mutations. Its historical implementation result remains useful.

For the current integrated chain it is not certifiable because:

- strict sequencing is already stopped by P02;
- P04's latest independent evidence still has a security hold;
- P05 additions were not reconciled back into the lifecycle registry, directly causing P02 failures.

## Cumulative and boundary findings

1. The canonical contracts are internally consistent, but the implementation-lifecycle registry was treated as a one-time artifact instead of a cumulative control.
2. P04/P05 implementation changed schema, services, modules, events and public barrels without refreshing and re-certifying P02 reconciliation.
3. Historical SHA-bound phase tokens prove their candidates, not every later integrated HEAD.
4. P05→P06 functional dependency cannot be trusted until lifecycle classifications and P04 security status are reconciled.

## Required recovery order

1. Finish or pause the active P06 edits at a known commit; do not certify a dirty candidate.
2. Regenerate the P02 lifecycle registry from the current source and review every changed classification; do not manually patch counts.
3. Rerun P02 positive 14/14, source-inventory unit tests and negative 40/40.
4. Confirm credential rotation/revocation, remove operational hardcoded credentials, and independently close P04's security hold.
5. Run one cumulative P03 architecture/DNA regression and the P05 affected fast regression on the reconciled commit.
6. Only then resume P06 certification.

No application remediation was performed by this audit.
