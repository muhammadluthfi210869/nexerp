# NEX ERP — Fast Batch Verification Plan

Commands such as `verifikasi fase 7-10` request a read-only, severity-based audit. This plan is governed by `_FAST_DELIVERY_EXECUTION_STANDARD.md`.

## Audit method

1. Read the phase objectives, frozen acceptance behavior and changed implementation.
2. Run each phase's focused native tests and the affected cross-phase golden thread.
3. Verify business correctness, authorization/tenant isolation and data/transaction integrity.
4. Classify findings P0–P3.
5. Block progression only for P0/P1.
6. Put P2/P3 into backlog and continue.

Do not create/run a bespoke certifier, diagnose CLI, SHA/token check, mutation framework, evidence hash or serial historical-phase rerun during batch verification.

## Verdicts

- `PASS`: scoped tests and integration pass; no P0/P1.
- `PARTIAL_PASS`: earlier phases pass and a later phase has P0/P1 or cannot run a required primary-flow test.
- `FAIL`: the first requested phase has P0/P1.
- `NOT_VERIFIED`: environment prevents meaningful execution.

P2/P3 observations do not change PASS.

## Evidence

One concise batch Markdown file records commands, exit codes, numeric results, P0/P1 findings, P2/P3 backlog and the next action. Screenshots, hashes, digests and verbose generated ledgers are unnecessary unless the phase itself owns visual or cryptographic proof.

## Efficiency

- related test while debugging: under 60s;
- focused phase suite: normally under 10m;
- cumulative checkpoints only after P10/P15/P19/P22;
- maximum one normal correction cycle per phase;
- no new post-hoc blocker except a reproduced P0/P1.
