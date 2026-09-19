# NEX ERP — Batch Phase Verification Plan

**Purpose:** make short commands such as **“verifikasi fase 1-5”** sufficient to trigger a complete, repeatable, independent verification without restating a long prompt. This is an audit/certification procedure, not runtime business authority.

## 1. Accepted command forms

The following commands are equivalent and inclusive:

```text
verifikasi fase 1-5
verifikasi 1-5 fase
verifikasi P01-P05
audit fase 1 sampai 5
```

Interpretation rules:

- Bare numbers are normalized to two digits: `1` → `P01`, `5` → `P05`.
- `0` means `P00`; `22` means `P22`.
- The range is inclusive and must be ascending.
- The default action is **independent read-only application audit plus evidence/status documentation**. Do not implement application fixes unless the user separately asks to fix/remediate.
- A requested range of more than five phases is automatically split into ordered batches of at most five. Certification still follows strict phase order.
- If the phrase does not contain an unambiguous start and end phase, ask one concise clarification; otherwise begin immediately.

## 2. Mandatory sources

For every batch, read:

1. `AGENTS.md` and `README.md`.
2. `contracts/00_MASTER_SPEC.md §9.1`.
3. `process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md`.
4. `verification/_PRODUCTION_PHASE_GATES.yaml`.
5. `process/_PROCESS_DECISIONS_LOG.md` and `verification/_DECISIONS_REQUIRED.yaml`.
6. This batch verification plan.
7. The evidence pack, changed files, canonical owners, tests, and implementation for every requested phase.
8. `verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md` for changed scope.
9. `verification/_UI_DNA_COMPLIANCE_STANDARD.md` for any affected UI.
10. `verification/_CUMULATIVE_REGRESSION_AND_CERTIFICATE_VALIDITY_STANDARD.md` for historical-certificate reuse, impact-selected predecessor sentinels, and current-HEAD integration health.

Never accept an implementor summary, claimed PASS, screenshot, test count, or evidence pack without checking it against repository state and rerunning the relevant commands.

For one-phase execution/remediation, also apply `verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`. Before implementation begins, the auditor must provide the phase prompt, frozen acceptance contract, complete remediation map, adversarial IDs, pre-certification checklist, and one authoritative certification command. A SHA-bound independent reproduction of that unchanged contract eliminates ordinary post-hoc acceptance criteria.

## 3. Pre-flight

Before tests:

1. Resolve the requested range and list every included phase.
2. Inspect git status without deleting, resetting, or overwriting unrelated user changes.
3. Verify that the phase immediately preceding the range is certified `PASS`; `P00` has no predecessor.
4. Load each phase's current status, dependencies, required gates, and required tests from `_PRODUCTION_PHASE_GATES.yaml`.
5. Inspect evidence packs and confirm their claimed commands, timestamps, outputs, and artifact paths exist.
6. Build a phase-to-contract/code/test/change map.
7. Identify secrets before printing output; never echo credential values.
8. Record environment limitations. A test that cannot run is `NOT VERIFIED`, never an inferred PASS.

If the predecessor is not PASS, the batch may still be diagnostically inspected, but no phase in the range can be certified PASS until the dependency is satisfied.

## 4. Three verification layers

### Layer A — Per-phase gate verification

For each phase in ascending order:

- rerun every `required_test` that can be executed in the repository/environment;
- independently verify every `required_gate`;
- inspect canonical contract alignment and relevant decision records;
- review migrations/data behavior, backend, frontend, RBAC/data scope, audit, events, notes/@mention, UI DNA, architecture, security, and operations where affected;
- search for mock/fallback/hardcode/bypass/skip/only/flaky/quarantine and hidden failure paths;
- compare actual results with the phase evidence pack;
- assign a phase verdict with evidence.

### Layer B — Cumulative batch verification

After individual phase checks, verify interaction across the entire requested range:

- integration between phase outputs and downstream consumers;
- cumulative schema/migration compatibility;
- cross-domain golden threads affected by the batch;
- contract/API/screen/RBAC/event/traceability consistency;
- architecture dependency and maintainability ratchet;
- UI DNA import/render compliance for changed screens;
- data reconciliation and finance/inventory invariants where applicable;
- security and regression impact;
- no earlier certified fast gate regressed.
- current-HEAD integration ledger includes every impact-selected predecessor sentinel and distinguishes historical certificate validity from integrated health.

### Layer C — Boundary verification

Verify:

- input assumptions supplied by the immediately preceding phase;
- outputs promised to the next phase;
- no scope was silently deferred across the batch boundary;
- compatibility contracts required by already-deployed or parallel components remain valid.

## 5. Test execution policy

Always run, when applicable:

- SSOT/contract validators;
- build, typecheck, and lint gates required by the included phases;
- requested phases' unit/component/integration/contract/E2E tests;
- affected golden threads;
- migration validation/rehearsal when database scope exists;
- security/dependency checks when security/runtime dependencies changed;
- architecture/unused/orphan/duplicate checks for changed scope;
- DNA import/native-control/hardcoded-token/reference/accessibility checks for UI scope;
- data reconciliation for inventory, finance, reports, migration, or master-data changes.

Do not rerun the entire global suite for every small phase unless its gate requires it. Run the full clean-room suite for P20–P22 and when cumulative evidence indicates cross-system risk.

No unexplained test skip, `only`, flaky retry, quarantined test, worker crash, OOM, or environment boot failure counts as PASS.

## 6. Certification ordering and stop rule

Certification is strictly sequential even when diagnostics run across the whole range.

Example for `P01–P05`:

- If P01–P03 pass and P04 fails, P01–P03 may be certified PASS.
- P04 is FAIL/REMEDIATION.
- P05 may be inspected and reported, but its certification is `NOT CERTIFIABLE — P04 FAILED`.
- Do not mark downstream phases PASS based on isolated tests.

A failure does not erase valid earlier phase evidence. Retest the failed phase and every downstream phase/golden thread materially affected by its remediation.

## 7. Batch verdicts

| Verdict | Meaning |
|---|---|
| `PASS` | Predecessor and every requested phase/gate/test pass; cumulative and boundary checks pass |
| `PARTIAL_PASS` | One or more leading phases pass, followed by a failed/not-verifiable phase; later phases cannot be certified |
| `FAIL` | The first requested phase fails, evidence is materially false, or a P0/P1 issue invalidates the batch |
| `USER_DECISION_REQUIRED` | A material canonical business decision is required; registry status remains one of its allowed machine states, normally `FAIL` or `TESTING` |
| `NOT_VERIFIED` | Required evidence cannot be executed or inspected; never equivalent to PASS |

`BLOCKED_BY_DECISION` may be used as explanatory prose but must not be written as a registry status unless `_PRODUCTION_PHASE_GATES.yaml` explicitly adds it to `allowed_statuses`.

## 8. Special audit phases

The following receive dedicated depth even when included in a larger range:

- `P15`: finance, costing, accounting, closing, subledger-to-GL, valuation, reversal, and period-lock audit.
- `P19`: every-screen DNA, UI/UX, accessibility, responsive, browser, and visual evidence; sampling is insufficient for certification.
- `P20`: full-system, architecture, security, performance, resilience, and complete regression.
- `P21`: migration, change-delivery, cutover, backup/restore, rollback/roll-forward, and DR rehearsals.
- `P22`: independent clean-room pre-UAT certification; cannot reuse implementor conclusions as proof.

For clarity and context control, prefer a dedicated verification task for each of P15 and P19–P22.

## 9. Evidence output

Create one batch evidence file:

```text
docs/legacy-erp/verification/evidence/batches/Pxx-Pyy_BATCH_VERIFICATION_YYYY-MM-DD.md
```

It must contain:

1. Parsed command and inclusive phase range.
2. Baseline commit/working-tree state and predecessor status.
3. Per-phase required gates/tests and actual results.
4. Commands, exit codes, numeric test results, and artifact locations.
5. Contract/code/evidence discrepancies.
6. Cumulative integration and boundary results.
7. Security, architecture, DNA, data/migration, and UI findings where applicable.
8. Findings ordered by severity with file/line and reproduction evidence.
9. Phase-by-phase verdict and registry update, if justified.
10. Batch verdict and first failed gate.
11. Exact remediation/retest scope and next short command.

Evidence must distinguish `PASS`, `FAIL`, `NOT RUN`, `NOT APPLICABLE`, and `NOT VERIFIED`.

## 10. Allowed mutations during verification

The verifier may:

- create/update verification evidence;
- correct a phase registry status when objective evidence proves the current status false;
- update generated audit summaries that are explicitly non-authoritative.

The verifier must not, unless separately requested:

- implement backend/frontend/database fixes;
- change business contracts to make tests pass;
- resolve business decisions on behalf of stakeholders;
- weaken thresholds, tests, lint rules, security controls, DNA rules, or evidence requirements;
- delete/reset unrelated working-tree changes.

If a documentation-only factual correction is essential to keep verification truthful, record it explicitly in the evidence pack.

## 11. Final response format

Return a compact audit report:

```text
Batch: Pxx–Pyy
Verdict: PASS | PARTIAL_PASS | FAIL | USER_DECISION_REQUIRED | NOT_VERIFIED
Certified through: Pzz or none
First failed gate: exact phase/gate

Critical findings:
- severity, evidence, impact

Per-phase results:
- Pxx: PASS/FAIL/NOT CERTIFIABLE — key evidence

Tests:
- command/suite: numeric result

Evidence:
- absolute clickable evidence path

Next command:
- verifikasi fase ...
  or
- remediasi fase ... lalu verifikasi ulang fase ...
```

Lead with the verdict. Do not bury a failed gate beneath implementation detail.

## 12. One-phase one-prompt efficiency rule

For each phase, prefer exactly one complete executor prompt derived from `verification/prompts/_PHASE_ONE_PASS_PROMPT_TEMPLATE.md`. The prompt must cover the entire known failure surface and instruct the executor to continue through diagnosis, repair, and rerun until the phase command passes. Do not split known blockers into serial prompts merely to reduce prompt length.

The auditor still performs an independent rerun. If the frozen runner passes on the same SHA and no newly discovered P0/P1 issue exists, the auditor records PASS rather than introducing an undisclosed non-critical requirement.
