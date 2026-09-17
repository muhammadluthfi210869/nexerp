# P02 Final Remediation Method

**Purpose:** close the remaining P02 false-positive paths with a concrete implementation design. This is an implementation playbook, not certification evidence. P02 remains `FAIL` until an independent rerun proves every gate.

## 1. Root cause

The current generator discovers jobs, events, and migrations, but the audit does not reconstruct and compare their exact identities. Barrel discovery is a hardcoded single record. Job/event reachability is literal `true` rather than derived from NestJS runtime registration. The official negative suite consequently tests only the older failure modes.

The repair must establish this invariant:

> Repository discovery produces the registry; a separately implemented audit reconstructs the repository truth and compares exact multisets, classifications, and reachability. A same-count replacement, omission, addition, duplicate, or reachability lie must fail.

## 2. Files to change

Required:

- `scripts/ssot/generate_lifecycle_registry.js`
- `scripts/ssot/audit_lifecycle_reconciliation.js`
- `scripts/ssot/test_lifecycle_reconciliation_negative.js`

Recommended new testable helpers:

- `scripts/ssot/lib/nest_registration_graph.js`
- `scripts/ssot/lib/source_inventory.js`
- `scripts/ssot/test_source_inventory.js`

The independent audit must not accept registry-derived expected values. It may share low-level path normalization, but its expected inventory and expected reachability must be reconstructed from source files during every audit run.

## 3. Canonical identity and multiset comparison

Use normalized forward-slash repository-relative paths and stable tuple keys:

| Object | Identity tuple |
|---|---|
| Job | `file`, `provider_symbol`, `type`, `trigger` |
| Event | `file`, `provider_symbol`, `role`, `event` |
| Migration | `file` |
| Barrel file | `file` |
| Barrel member | `file`, `kind`, `exported_name`, `source` |

Do not compare only array lengths or JavaScript `Set` values. Duplicate occurrences matter. Implement a multiset counter:

```js
function stableKey(parts) {
  return parts.map(value => JSON.stringify(value ?? null)).join('|');
}

function toMultiset(rows, keyOf) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function diffMultiset(actual, registered, keyOf) {
  const expectedCounts = toMultiset(actual, keyOf);
  const registeredCounts = toMultiset(registered, keyOf);
  const missing = [];
  const extraneous = [];
  for (const [key, count] of expectedCounts) {
    const delta = count - (registeredCounts.get(key) || 0);
    if (delta > 0) missing.push({ key, count: delta });
  }
  for (const [key, count] of registeredCounts) {
    const delta = count - (expectedCounts.get(key) || 0);
    if (delta > 0) extraneous.push({ key, count: delta });
  }
  return { missing, extraneous, pass: missing.length === 0 && extraneous.length === 0 };
}
```

Every relevant audit result must expose `missing`, `extraneous`, and duplicate-count mismatches so a failure is diagnosable.

## 4. Source inventory implementation

Use the TypeScript compiler API available from `backend/node_modules/typescript`, not regex alone, for TypeScript constructs. Regex can remain only as a tested fallback for plain migration paths.

### 4.1 Jobs

Scan `backend/src/**/*.{ts,js}` and visit class methods with `@Cron(...)`, `@Interval(...)`, or other explicitly supported scheduler decorators. Record:

```js
{
  file,
  provider_symbol: containingClassName,
  type: 'CRON' | 'INTERVAL',
  trigger: normalizedSourceText,
  reachable,
  lifecycle_classification,
  owner,
  rationale
}
```

Normalization must trim whitespace while preserving the expression identity. Do not evaluate arbitrary source code.

### 4.2 Events

Visit:

- `@OnEvent(event)` decorators → `SUBSCRIBER`;
- `emit(event, ...)` and `emitAsync(event, ...)` calls → `PUBLISHER`.

Record the containing class as `provider_symbol`. Preserve multiset occurrence counts; two emissions of the same event from the same provider are two occurrences unless a deliberate `occurrence_count` representation is used consistently in generator and audit.

For subscribers, require all of the following for `reachable: true`:

1. containing provider is registered in a reachable module;
2. the reachable root graph contains `EventEmitterModule.forRoot(...)`;
3. the decorated method belongs to the registered provider symbol.

For publishers, require the containing controller/provider to be registered and reachable. When the class uses `EventEmitter2`, verify that the dependency is actually injected or otherwise resolved through an approved adapter.

### 4.3 Migrations

Recursively scan `backend/prisma/migrations/**/migration.sql`. Normalize each file path. Exact multiset comparison must reject fake, missing, and duplicate migration records. Migration status/owner/rationale are validated separately from identity.

### 4.4 Barrels and public exports

Discover `index.ts`, `index.tsx`, `index.js`, and `index.jsx` below `frontend/src` and `backend/src`, excluding tests, fixtures, generated output, and vendor directories. A file is a barrel/public-export surface when its AST contains at least one:

- `export ... from './x'`;
- `export * from './x'`;
- exported declaration such as `export interface`, `export type`, `export class`, `export function`, or exported variable.

For every discovered index file, store the file plus a sorted `exports` list. Each member descriptor contains:

```js
{ kind: 'STAR' | 'NAMED_REEXPORT' | 'DECLARATION', exported_name, source }
```

Current repository discovery must at least account for:

- `frontend/src/components/dna/index.ts`
- `frontend/src/components/automation/index.ts`
- `frontend/src/types/index.ts`

Do not hardcode these paths as the complete list. The audit independently repeats the AST discovery and exact-compares barrel files and members.

## 5. NestJS registration graph

Replace the current “any relative import means reachable” traversal with a metadata graph rooted at `backend/src/app.module.ts`.

### 5.1 Parse modules

For each class decorated with `@Module({...})`, use the TypeScript AST to read:

- `imports`;
- `controllers`;
- `providers`;
- `exports`.

Resolve imported identifiers through `ImportDeclaration` nodes. Support:

- direct module identifiers;
- `forwardRef(() => ModuleName)`;
- dynamic module calls such as `EventEmitterModule.forRoot()` and `ScheduleModule.forRoot()`;
- provider objects such as `{ provide: TOKEN, useClass: SomeProvider }`.

An identifier being imported at the top of a file does not make it registered. It becomes reachable only when it appears in the relevant `@Module` metadata of a module reachable from `AppModule`.

### 5.2 Traverse

Run breadth-first traversal from `AppModule` through `imports`. Collect:

- reachable module symbols/files;
- reachable controller symbols/files;
- reachable provider symbols/files;
- enabled runtime facilities such as scheduler and event emitter.

Use symbol-level keys (`file + class`) internally. File-level reachability may be derived only when at least one contained runtime symbol is reachable.

### 5.3 Classify

- reachable runtime object → `CANONICAL`, `APPROVED_EXTENSION`, or another justified live classification;
- unreachable object → `DEAD_CODE` or `DEPRECATED`, with owner and rationale;
- never force a dead provider's job/event to live status;
- a reachable job additionally requires scheduler registration;
- a reachable subscriber additionally requires event-emitter registration.

The current activity-log job/subscriber and unreachable BussDev/communication publishers must therefore either become correctly registered through application modules as an intentional implementation change, or remain unreachable and be classified `DEAD_CODE`/`DEPRECATED`. P02 does not require activating dead functionality; it requires truthful classification.

## 6. Audit gate integration

Add exact comparisons to existing required gates rather than inventing informational-only output:

- `caller_import_registration_scan` owns module/provider reachability plus job/event reachability consistency;
- `event_workflow_diff` owns exact implementation event inventory and subscriber/publisher registration checks;
- `unused_export_dependency_scan` owns exact barrel/public-export inventory and member comparison;
- `schema_diff` or `lifecycle_registry_validation` owns exact migration inventory.

Alternatively add internal subchecks, but the existing 14 named gates must fail when the corresponding invariant fails.

For every registered job/event:

```js
const expectedReachable = graph.isProviderReachable(row.file, row.provider_symbol)
  && (row.type ? graph.scheduleEnabled : true)
  && (row.role === 'SUBSCRIBER' ? graph.eventEmitterEnabled : true);

if (row.reachable !== expectedReachable) {
  errors.push(`Reachability mismatch: ${identity}`);
}
```

Validate `reachable === false` items as `DEAD_CODE` or `DEPRECATED`. Validate live items do not carry dead classifications.

## 7. Negative-test implementation

Extend `test_lifecycle_reconciliation_negative.js` with at least these mutations against a freshly generated baseline:

1. replace a job identity while keeping count constant;
2. replace an event identity while keeping count constant;
3. replace a migration identity while keeping count constant;
4. replace a barrel file identity while keeping count constant;
5. replace or remove one barrel member while keeping barrel count constant;
6. mark an unreachable job reachable;
7. mark an unreachable subscriber/publisher reachable;
8. remove a real record and manipulate summary counts;
9. duplicate one record while deleting another, preserving total length;
10. insert a provider import without adding it to `@Module.providers` and prove it remains unreachable.

Each case passes only when `runAudit(mutatedRegistry)` returns `allPass: false` and the expected named gate is `FAIL`. Also assert that the failure message contains the mutated identity, preventing unrelated exceptions from satisfying the test.

Add direct unit fixtures for AST discovery and graph traversal. Include direct module metadata, `forwardRef`, dynamic modules, object providers, unused imports, duplicate events, inline exported declarations, named re-exports, and star re-exports.

## 8. Dynamic reporting

Replace literal report values:

```js
const percent = denominator === 0
  ? 100
  : Number(((numerator / denominator) * 100).toFixed(2));
```

Apply this to DNA manifest coverage and migration-disposition coverage. A displayed percentage must use the same numerator and denominator that control the gate.

## 9. Implementation sequence

1. Add AST inventory and graph helpers with unit fixtures.
2. Change generator to use the new discovery and derived reachability.
3. Regenerate `_LIFECYCLE_REGISTRY.json` and inspect all changed counts/classifications.
4. Add independent expected-inventory reconstruction and multiset checks to the audit.
5. Add all negative mutations and assert the correct failing gate/message.
6. Replace literal percentages.
7. Run the full P02 suite.
8. Manually repeat the four same-count substitutions outside the negative suite.
9. Create the final remediation evidence; only then request independent `verifikasi fase 2`.

Do not solve this by hardcoding known files, fake names, counts, or `100%`. Do not activate dead modules merely to increase reachability. Do not change canonical contracts to accommodate verifier weaknesses.

## 10. Required commands

```text
node scripts/ssot/test_source_inventory.js
node scripts/ssot/validate_ssot.js
node scripts/ssot/generate_lifecycle_registry.js
node scripts/ssot/audit_lifecycle_reconciliation.js
node scripts/ssot/test_lifecycle_reconciliation_negative.js
node scripts/ssot/validate_model_targets.js
node scripts/ssot/validate_api_mappings.js
node scripts/ssot/validate_screen_mappings.js
node scripts/ssot/validate_classifications.js
node scripts/ssot/validate_adapter_metadata.js
```

The first command applies only if the recommended helper test file is created. Every executed command, exit code, and numeric result belongs in `verification/evidence/batches/P02-P02_FINAL_REMEDIATION_YYYY-MM-DD.md`.

## 11. Completion rule

P02 can be proposed for `PASS` only when:

- official suites pass;
- all new negative tests reject the intended mutation for the intended reason;
- independent same-count substitutions fail;
- zero job/event reachability contradictions remain;
- barrel files and members exact-match source discovery;
- the authoritative registry still remains unchanged until independent verification confirms the implementor evidence.

