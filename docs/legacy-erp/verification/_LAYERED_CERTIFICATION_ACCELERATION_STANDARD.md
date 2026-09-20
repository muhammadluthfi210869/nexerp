# NEX ERP — Layered Fast Feedback Standard

This historical filename is retained for links. The active authority is `_FAST_DELIVERY_EXECUTION_STANDARD.md`.

There is no phase certifier and no generic diagnose CLI.

## Layers

| Layer | Scope | Normal budget |
|---|---|---:|
| Edit check | changed file, function or closest unit test | 5–60s |
| Subphase | focused unit/component/integration tests for one business capability | 10–120s |
| Golden thread | one disposable-DB business integration where needed | 60–240s |
| Final phase verification | thin composition of already-green commands | 5–10m |
| Checkpoint | cumulative native suites at P10/P15/P19/P22 | scheduled, not inner loop |

Inventory failures once, repair by root-cause cluster, and rerun only the owning layer. Never respond to a local failure by running the complete phase or earlier phases.

Standard package-manager test commands are preferred. A `verify:pXX` script may sequence them but may not implement rules, inspect Git/SHA, generate PASS evidence, fabricate metrics, or duplicate application logic.

Parallel execution is allowed only for isolated files and resources. Shared schema/contracts/integration remain sequential.
