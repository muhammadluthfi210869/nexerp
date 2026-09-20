# NEX ERP — One-Pass Phase Execution Standard

This standard is governed by `_FAST_DELIVERY_EXECUTION_STANDARD.md`. If any historical prompt or evidence conflicts with it, the fast-delivery standard wins.

## Required loop

`one inventory → one implementation pass by subphase → targeted tests → one thin verify:pXX → one audit → continue`

Every phase has concise scope, three to six subphases, observable acceptance behavior, exact focused commands and a P0/P1 remediation map. It does not receive a bespoke certifier, diagnose runner, SHA token, gate engine, mutation framework or generated evidence system.

## Acceptance freeze

- Freeze business behavior and required focused tests before the executor edits code.
- Executor may add tests but may not weaken/delete/skip frozen acceptance behavior.
- Auditor cannot add a normal blocker afterward. Only a newly reproduced P0/P1 may amend acceptance.
- P2/P3 findings are backlog and do not delay progression.

## Execution

1. Read canonical contracts and current implementation.
2. Inventory all known failures once.
3. Group by root cause and repair in dependency order.
4. Run only the smallest related test while editing.
5. Pass each subphase suite.
6. Run one thin `npm run verify:pXX` after every subphase is green.
7. Fix a genuine failure with its focused test; allow at most one normal final-verification rerun.
8. Hand off concise numeric results and remaining P2/P3 backlog.

The executor does not stop for plan approval or partial-green reporting. It stops only on completion or a real decision/external/destructive-action blocker.

## Phase result

The phase passes when scoped behavior and focused tests pass, affected build/type/lint has no new phase-owned error, one required integration thread passes, and no P0/P1 remains. No SHA binding, token or pristine Git tree is required.
