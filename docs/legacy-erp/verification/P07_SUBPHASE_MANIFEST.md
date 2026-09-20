# P07 Subphase and Fast-Test Manifest

P07 uses one executor and six dependency-ordered subphases. Isolated UI work may run while SF2–SF4 backend work is underway only when it does not edit the same contracts, generated types or shared files.

| Subphase | Owned outcome | Targeted command | Budget | Exit condition |
|---|---|---|---:|---|
| `P07-SF1-contract-inventory` | Fresh contract/code inventory, one canonical lead authority, route/model/permission/workflow/event mapping | `npm run verify:p07:contracts` | 10–60s | zero unknown/duplicate authority; exact remediation ledger frozen |
| `P07-SF2-intake-identity` | intake, guest-book linkage, normalization, dedup, consent and attribution | `npm --prefix backend run test:p07:intake` | 30–120s | valid/retry/concurrent/conflict/withdrawn-consent cases pass |
| `P07-SF3-pipeline-ownership` | legal lifecycle, owner assignment/reassignment, role/tenant visibility, SLA and qualification | `npm --prefix backend run test:p07:pipeline` | 30–180s | transitions, authorization, stale update, SLA and idempotency pass |
| `P07-SF4-activity-reporting` | marketing activity/task, guest-book report and dashboard reconciliation | `npm --prefix backend run test:p07:reporting` | 30–180s | persisted activity and every control-total delta equal zero |
| `P07-SF5-frontend-ui` | canonical CRM/marketing/guest-book/BusDev screens use live APIs and DNA with complete states | `npm --prefix frontend run test:p07` | 20–120s | affected screen manifest and UI state tests pass; no production fallback |
| `P07-SF6-golden-thread` | production-path PostgreSQL golden thread, audit/outbox atomicity, retries, cleanup and affected predecessor sentinels | `npm --prefix backend run test:p07:golden` | 60–240s | all seams pass and one end-to-end business effect reconciles exactly |

## Required seams

1. intake/guest book → canonical lead identity;
2. lead identity → owner and SLA;
3. lifecycle → qualified-opportunity handoff boundary;
4. every governed business write → P05 policy/audit/outbox;
5. source transactions → dashboard/report projection;
6. backend contract → frontend UI behavior.

An interface change invalidates only its owning subphase plus dependent seams. It does not trigger the full final verification.

## Execution cadence

1. Inventory contracts, code, tests and every existing blocker once.
2. Repair by root-cause group.
3. Run the smallest owning subphase after each group.
4. Once six subphases and six seams are green, run `npm run verify:p07` once.
5. Commit the candidate.
6. Hand off the committed candidate and concise command/result ledger for independent audit.

The final verification target is 5–10 minutes. If it exceeds its budget, record per-command durations and remove duplicated work before rerunning. Do not add sleeps or repeat predecessor phase suites.
