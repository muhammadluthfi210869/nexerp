# P02 Independent Batch Reverification — R4

**Verification date:** 2026-09-17  
**Parsed command:** `verifikasi fase 2` → `P02-P02`  
**Verdict:** **FAIL**  
**Certified through:** P01  
**First failed gate:** `caller_import_registration_scan` does not verify controller/service/module reachability against the NestJS registration graph

## Baseline

- Branch: `main`
- Commit: `7a449e0af719c86ec0f57e362ed75d39b0af7ff0`
- Dirty working tree: 361 entries; no unrelated changes were reset or overwritten.
- P01 predecessor: `PASS`.
- P02 registry status: `FAIL`; retained.

## Verified remediation improvements

The R3 job/event/migration/barrel blockers were materially remediated:

- AST inventory and Nest registration helpers exist.
- Source-inventory tests pass 8/8.
- Job, event, migration, barrel-file, and barrel-member substitutions are rejected.
- Job/event reachability is derived instead of hardcoded.
- Registry now contains 3 jobs, 217 events, 42 migrations, 3 barrel files, and exact barrel members.
- Current generated registry has zero controller/service/module reachability differences when manually compared with the current graph.
- Current job/event reachability contradictions are zero.

## Command results

| Command | Exit | Result |
|---|---:|---|
| `node scripts/ssot/test_source_inventory.js` | 0 | 8/8 PASS |
| `node scripts/ssot/validate_ssot.js` | 0 | 19/19 PASS |
| `node scripts/ssot/generate_lifecycle_registry.js` | 0 | Generated successfully |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 0 | Claimed 14/14 PASS |
| `node scripts/ssot/test_lifecycle_reconciliation_negative.js` | 0 | 25/25 PASS after process completion |
| `node scripts/ssot/validate_model_targets.js` | 0 | 92 accepted |
| `node scripts/ssot/validate_api_mappings.js` | 0 | 377 accepted |
| `node scripts/ssot/validate_screen_mappings.js` | 0 | 179 accepted |
| `node scripts/ssot/validate_classifications.js` | 0 | 1,089 accepted |
| `node scripts/ssot/validate_adapter_metadata.js` | 0 | 10 accepted |

## Newly reproduced false positives

The verifier cloned the fresh registry, changed only reachability plus the matching lifecycle classification, and called exported `runAudit(customRegistry)`. No collection count or identity changed.

| Mutation | Expected | Actual |
|---|---:|---:|
| Reachable controller → `reachable:false`, `DEAD_CODE` | FAIL | **FALSE PASS 14/14** |
| Unreachable controller → `reachable:true`, `APPROVED_EXTENSION` | FAIL | **FALSE PASS 14/14** |
| Reachable service without job/event → `reachable:false`, `DEAD_CODE` | FAIL | **FALSE PASS 14/14** |
| Unreachable service without job/event → `reachable:true`, `APPROVED_EXTENSION` | FAIL | **FALSE PASS 14/14** |
| Reachable module → `reachable:false`, `DEAD_CODE` | FAIL | **FALSE PASS 14/14** |
| Unreachable module → `reachable:true`, `APPROVED_EXTENSION` | FAIL | **FALSE PASS 14/14** |
| Reachable job → dead | FAIL | Correctly rejected 13/14 |
| Reachable event → dead | FAIL | Correctly rejected 13/14 |

## Root cause

`audit_lifecycle_reconciliation.js` builds `nestGraph` at line 101, but `caller_import_registration_scan` lines 592-619 only:

- checks that not all objects are unreachable;
- checks classification compatibility with the registry's own `reachable` value;
- checks owner and rationale.

It never compares each controller, service/provider, and module registry record to `nestGraph.isControllerReachable`, `isProviderReachable`, or `isModuleReachable`. The registry can therefore lie consistently about reachability and classification while the gate passes.

## Evidence-pack discrepancies

The implementor evidence claims zero reachability contradictions for services/controllers/modules, but the audit does not enforce those comparisons. Its named dead-object examples also do not match the freshly generated registry (for example, it lists `CrmModule` as dead although the current graph and registry mark it reachable). The evidence cannot be accepted verbatim.

## Required narrow remediation

1. In `caller_import_registration_scan`, compare every registry controller to `nestGraph.isControllerReachable(file, symbol)`.
2. Compare every service/provider to `nestGraph.isProviderReachable(file, symbol)`.
3. Compare every module to `nestGraph.isModuleReachable(file, symbol)`.
4. Add stable `provider_symbol`/`module_symbol` fields where needed; do not rely only on file-level truth when multiple classes may share a file.
5. Fail on either direction of mismatch and include the object identity in the failure message.
6. Add six negative tests covering live→dead and dead→live for controllers, services, and modules.
7. Correct the final evidence counts/examples from the freshly generated registry.
8. Rerun the full P02 suite and independent adversarial checks.

## Boundary result

P01 remains valid. P02 cannot yet provide a trustworthy lifecycle/reachability registry to P03, so P03 remains dependency-blocked.

