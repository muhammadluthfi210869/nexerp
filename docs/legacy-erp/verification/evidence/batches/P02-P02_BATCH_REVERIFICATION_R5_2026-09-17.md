# P02 Independent Batch Reverification — R5

**Verification date:** 2026-09-17  
**Parsed range:** `P02-P02`  
**Verdict:** **FAIL**  
**Certified through:** P01  
**First failed gate:** controller/service/module exact-identity multiset verification

## Baseline

- Branch: `main`
- Commit: `7a449e0af719c86ec0f57e362ed75d39b0af7ff0`
- Dirty working tree preserved; no unrelated changes reset.
- P01 is `PASS`; P02 remains `FAIL`.

## Passing evidence

| Command | Exit | Result |
|---|---:|---|
| `node scripts/ssot/test_source_inventory.js` | 0 | 8/8 PASS |
| `node scripts/ssot/validate_ssot.js` | 0 | 19/19 PASS |
| `node scripts/ssot/generate_lifecycle_registry.js` | 0 | Generated successfully |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 0 | 14/14 PASS on clean generated registry |
| `node scripts/ssot/test_lifecycle_reconciliation_negative.js` | 0 | 31/31 PASS after process completion |
| `node scripts/ssot/validate_model_targets.js` | 0 | 92 accepted |
| `node scripts/ssot/validate_api_mappings.js` | 0 | 377 accepted |
| `node scripts/ssot/validate_screen_mappings.js` | 0 | 179 accepted |
| `node scripts/ssot/validate_classifications.js` | 0 | 1,089 accepted |
| `node scripts/ssot/validate_adapter_metadata.js` | 0 | 10 accepted |

The six R4 reachability mutations are now correctly rejected by `caller_import_registration_scan`:

- reachable/dead controller in both directions;
- reachable/dead service in both directions;
- reachable/dead module in both directions.

Job, event, migration, barrel, barrel-member, and reachability remediations from earlier rounds also remain green.

## Remaining exact-identity false positives

The freshly generated registry explicitly contains symbols for all objects:

- 96/96 controllers have `controller_symbol`;
- 118/118 services have `provider_symbol`;
- 70/70 modules have `module_symbol`.

The independent verifier cloned that registry and applied the following mutations:

| Mutation | Expected | Actual |
|---|---:|---:|
| Live controller symbol changed to `FakeController`, then consistently marked dead | FAIL | **FALSE PASS 14/14** |
| Live service symbol changed to `FakeService`, then consistently marked dead | FAIL | **FALSE PASS 14/14** |
| Live module symbol changed to `FakeModule`, then consistently marked dead | FAIL | **FALSE PASS 14/14** |
| Remove `controller_symbol` | FAIL | **FALSE PASS 14/14** |
| Remove `provider_symbol` | FAIL | **FALSE PASS 14/14** |
| Remove `module_symbol` | FAIL | **FALSE PASS 14/14** |
| Append a duplicate controller record | FAIL | **FALSE PASS 14/14** |
| Append a duplicate service record | FAIL | **FALSE PASS 14/14** |
| Append a duplicate module record | FAIL | **FALSE PASS 14/14** |

## Root cause

The verifier compares controller/service/module inventories using file-only JavaScript `Set` equality. It does not reconstruct exact source identities as `{file,symbol}` multisets. It then trusts a supplied symbol when calculating expected reachability, and falls back to extracting a symbol when the registry field is missing. Consequently:

- a fake symbol plus self-consistent dead classification is accepted;
- a missing mandatory symbol is silently repaired by fallback;
- duplicate records collapse inside file-only sets.

The current clean registry happens to match the current graph, but the required audit cannot prove identity completeness or uniqueness.

## Required final narrow remediation

1. Independently scan TypeScript source and reconstruct:
   - controllers: `{file, controller_symbol}` for every `@Controller` class;
   - services/providers in the P02 service inventory: `{file, provider_symbol}` for every inventoried service class;
   - modules: `{file, module_symbol}` for every `@Module` class.
2. Use `diffMultiset`, not `Set`, with stable tuple keys for all three categories.
3. Make all three symbol fields mandatory in registry validation. Do not use fallback extraction to excuse a missing registry field.
4. After exact identity passes, compare each record's reachability with the Nest registration graph.
5. Reject duplicate, missing, extraneous, and same-file/fake-symbol records with the exact identity in the error.
6. Add nine negative tests covering fake symbol, missing symbol, and duplicate append for each category.
7. Retain the existing six R4 reachability tests and all prior mutation tests.
8. Correct final evidence from freshly generated output and rerun independent verification.

## Boundary result

P01 remains certified. P02 cannot yet establish an exact lifecycle inventory for P03, so P03 remains dependency-blocked.

