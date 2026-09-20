# NEX ERP — Practical Cumulative Regression Standard

This historical filename is retained for links. The active authority is `_FAST_DELIVERY_EXECUTION_STANDARD.md`.

Normal phases do not maintain certificate validity, SHA-bound tokens, integration-health ledgers, impact-graph digests or historical certifier reruns.

## Per phase

Run only:

- the current phase's focused suites;
- affected typecheck/lint/build checks;
- an earlier smoke test only when the current change directly consumes or modifies its interface;
- one integration thread for the capability being delivered.

An earlier accepted phase is not reopened for P2/P3 debt. Reopen only when a reproducible P0/P1 regression affects current behavior.

## Cumulative checkpoints

- after P10;
- after P15;
- after P19;
- at P22/UAT readiness.

Checkpoints use existing native tests and business reconciliation. They do not create or rerun bespoke phase certifiers, diagnose runners, SHA tokens, mutation engines or generated evidence systems.

When a checkpoint fails, isolate the owning domain and rerun its focused tests. Do not serially rerun every old phase.
