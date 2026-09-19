# NEX ERP — Layered Certification Acceleration Standard

## Purpose

This standard shortens the implementation feedback loop without weakening the frozen phase contract. The authoritative phase certifier remains the only command allowed to emit a SHA-bound `PHASE_PASS`. Development and remediation use smaller production-path diagnostic groups so one defect does not repeatedly trigger the entire phase suite.

The required operating loop is:

`inventory all failures once → cluster by root cause → repair one cluster → targeted production-path test → cumulative preflight → one authoritative certification → one independent reproduction`

## Two runners, two different authorities

Each phase must provide both interfaces before implementation begins:

1. **Diagnostic runner** — fast, selectable, non-certifying, and safe on a dirty working tree. It exercises the same gate functions and test implementations as the authoritative runner, but may select a gate group, gate ID, mutation ID, or changed-file impact set. It must print `NON_CERTIFYING` and can never create a PASS token.
2. **Authoritative certifier** — immutable/frozen, complete, fail-closed, committed-candidate only, and the sole producer of `Pxx:<sha>:PHASE_PASS`.

The diagnostic runner must not contain a second implementation of any business rule, analyzer, oracle, threshold, or mutation. Both runners import the same production gate registry and test functions. Selection changes what executes, never what PASS means.

## Required execution layers

| Layer | Purpose | Expected warm-workspace target | When to run |
|---|---|---:|---|
| `L0 inventory` | Parse changed paths, dependency impact, prerequisites, and all currently reproducible failures | <= 30 seconds excluding an explicitly requested baseline scan | Once at task start and after scope changes |
| `L1 static` | Contract/schema parsing, AST, dependency boundaries, lint/typecheck for affected files, evidence schema | 10–60 seconds per group | After each relevant edit |
| `L2 focused` | Direct unit tests or one gate/mutation for the repaired root-cause cluster | 10–120 seconds per group | Repeated development loop |
| `L3 integration` | Affected database/API/service/UI integration and affected golden thread | 1–5 minutes per group | After the cluster is locally green |
| `L4 preflight` | All phase groups, using shared setup and bounded parallelism, without final evidence/token | 5–8 minutes normally | Once after every cluster is green |
| `L5 certification` | Complete frozen acceptance contract and evidence generation | Phase-specific; normally 10–25 minutes | Once after L4 is 100% green |
| `L6 reproduction` | Independent rerun against the unchanged committed candidate | Same as L5 | Once by auditor or clean CI |

Time targets are engineering budgets, not reasons to skip a required test. If a layer exceeds its budget, record the slow test and optimize setup, selection, fixture reuse, process startup, or safe parallelism. Do not weaken assertions.

## Mandatory diagnostic CLI contract

The exact filenames may be phase-specific, but every phase prompt must declare commands equivalent to:

```text
node scripts/ssot/diagnose_pXX_phase.js --list
node scripts/ssot/diagnose_pXX_phase.js --changed
node scripts/ssot/diagnose_pXX_phase.js --group <group-id>
node scripts/ssot/diagnose_pXX_phase.js --gate <gate-id>
node scripts/ssot/diagnose_pXX_phase.js --mutation <mutation-id>
node scripts/ssot/diagnose_pXX_phase.js --preflight
node scripts/ssot/certify_pXX_phase.js
```

Every diagnostic result must include selector, gate/test IDs, target count, exit code, duration, reason code, and the exact next smallest rerun command. Unknown selectors, zero applicable targets where targets are expected, crashes, timeouts, and ambiguous output fail closed.

## Failure inventory and root-cause clustering

Before modifying code, execute one baseline inventory. Do not repair only the first surfaced symptom. Produce a machine-readable failure inventory with:

- failing gate/test/mutation ID;
- structured reason code and shortest reproduction;
- owning contract and code path;
- dependency/blast-radius paths;
- root-cause cluster ID;
- targeted positive, negative, and regression command;
- whether database, build, browser, Docker, or external service startup is actually required.

Failures caused by the same underlying implementation or harness defect are repaired together. A group is complete only when its positive test, corresponding adversarial mutation, and affected regression test all pass.

## Standard gate groups

Use only applicable groups, but record every group as `REQUIRED` or `NOT_APPLICABLE`:

| Group | Typical scope |
|---|---|
| `contract-static` | Canonical contracts, traceability, schemas, generated manifest validation |
| `architecture-static` | Ownership, dependency direction, cycles, dead/orphan/duplicate code, complexity |
| `backend-unit` | Pure business rules, errors, state transitions, calculations |
| `database-integration` | Migration, constraints, isolation, transaction, idempotency, rollback |
| `security-access` | Authentication, sessions, MFA, RBAC, tenant/field scope, PII |
| `audit-workflow-events` | Immutable audit, maker-checker, outbox, retry/dedup, communication/@mention ACL |
| `frontend-ui` | Live-data states, DNA imports, accessibility, responsive behavior, affected component tests |
| `affected-golden-thread` | Only end-to-end flows touched by the phase/change |
| `adversarial` | Mutations mapped to the groups above; selectable individually and by group |
| `build-regression` | Affected typecheck/lint/build plus predecessor fast gates |

## Shared setup and performance rules

1. Within one diagnostic or preflight process, compile/generate/load schemas once and reuse them across groups when safe.
2. A database group creates one isolated database per worker or transactionally resets a known fixture; it must not create a fresh database for every assertion unless isolation requires it.
3. Independent static, frontend, and backend groups may run in parallel with an explicit memory-safe worker limit. Database tests sharing state remain isolated or serial.
4. Test output is parsed once from the full stream; do not rerun a suite merely to obtain metrics.
5. A failed group reruns that group or exact failed ID, not all predecessor phases and not the authoritative certifier.
6. Full installs, Docker builds/runtime, multi-browser matrices, load/soak, deploy, DR, and clean-room work stay in their declared integration/release phase unless the current phase owns that capability.
7. Cache only immutable inputs such as dependency installs or compiler artifacts. Never reuse PASS evidence, mutable database state, candidate-SHA validation, security results, or final certification outcomes.

## Certification admission rule

The executor may invoke the authoritative certifier only when a fresh preflight manifest proves:

- all required groups executed and passed;
- all required mutation IDs executed through production paths and passed;
- no unexpected skip, retry, quarantine, timeout, worker crash, or zero-target ambiguity;
- candidate scope has not changed since preflight began;
- no unresolved failure inventory item remains;
- required services and resource budgets are ready.

If the authoritative certifier fails, classify the failure first. Repair and rerun the smallest owning group, then rerun preflight. Do not immediately repeat the full certifier with unchanged code/environment.

## Anti-loop limits

- Maximum normal full-certifier executions by the executor: **one admission run plus one rerun only when the first exposed a certification-only/environment defect that targeted tests could not reproduce**.
- A third executor run requires a written harness/root-cause explanation in the evidence ledger.
- A command that fails twice without a code/environment change must not be repeated; investigate the cause.
- Slow tests are reported with durations. Any individual diagnostic group over 120 seconds or preflight over 8 minutes needs a performance remediation or explicit phase-specific justification.

These limits control waste, not quality. They never permit advancing with a failed required gate.

## P05 example partition

For the existing P05 scope, the 19 gates and 31 mutations should be partitioned approximately as follows:

- `architecture-static`: architecture fitness, ownership, dependency graph, boundaries, cycles, coupling/complexity, duplicate/dead code, representative-change rehearsal and their mapped mutations;
- `security-access`: session/MFA, permission matrix, tenant/field isolation and their mapped mutations;
- `audit-workflow-events`: immutable audit, maker-checker, outbox, communication ACL and their mapped mutations;
- `contract-static`: predecessor/scope safety, traceability, canonical errors, configuration ownership, evidence/secret checks;
- `preflight`: the four groups above using one shared build/schema load and one isolated database lifecycle where safe;
- `certification`: the unchanged `node scripts/ssot/certify_p05_phase.js` only after preflight passes.

This partition is an execution optimization only. P05 remains FAIL until the frozen authoritative certifier and independent reproduction pass.
