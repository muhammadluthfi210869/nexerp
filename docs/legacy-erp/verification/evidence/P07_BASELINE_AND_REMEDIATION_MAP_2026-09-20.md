# P07 Baseline and Remediation Map — 2026-09-20

**Base:** `5542855667ca47b2e9a55c0e2c897db697b3929d`  
**Entry:** P06 accepted PASS  
**P07 baseline verdict:** `FAIL / READY FOR ONE-PASS IMPLEMENTATION`

This baseline replaces the stale 2026-09-17 P07 dependency-blocked verdict. Upstream P02–P06 have since been accepted; the old evidence remains historical and must not be treated as current status.

## Measured baseline

| Check | Result | Interpretation |
|---|---|---|
| Complete backend unit suite | `23/23` suites, `260/260` tests PASS in about 59s | broad platform baseline is green |
| BusDev targeted unit tests | `3/3` suites, `43/43` tests PASS in about 24s | existing BusDev unit baseline is green |
| Frontend marketing/BusDev/guest/CRM/lead tests | `11/11` files, `24/24` tests PASS in about 8s | existing UI tests are fast but not sufficient golden-thread proof |
| Lead-capture tests | `7/7` suites, `35/35` tests report PASS in about 49s | suite emits swallowed dependency errors and an open-handle warning; green result is not yet trustworthy acceptance evidence |
| Backend marketing typecheck | FAIL: `canonical-marketing.controller.ts` cannot resolve `Express.Multer` | changed-domain compile blocker |
| Backend marketing suite | FAIL before assertions in `roles.guard.ts` because `context.getClass().name` is undefined | test/guard compatibility blocker; production guard must remain fail-closed |
| Frontend marketing typecheck | PASS | targeted frontend compile baseline green |

## Root-cause clusters to close in one implementation pass

| ID | Cluster | Required repair method | Owning tests |
|---|---|---|---|
| `P07-B1` | Canonical authority drift risk across lead-capture, BusDev, CRM, marketing and guests | derive fresh inventory from contracts/schema/routes; designate one write authority and keep compatibility adapters thin; remove production fallback/mock paths in touched scope | SF1 and all seams |
| `P07-B2` | Marketing typecheck lacks upload type visibility | repair project/type boundary or controller typing without global unsafe casts; keep DTO validation and file safety intact | SF1/SF5 targeted typecheck |
| `P07-B3` | Roles guard crashes under valid test execution context | make resource-name extraction deterministic and fail-closed; repair mocks to resemble real Nest context; add malformed-context denial test | SF3 auth negative tests |
| `P07-B4` | Lead-capture tests swallow missing Prisma methods and leave async handles | replace incomplete mocks or move critical cases to disposable PostgreSQL; await/close timers, clients and apps in `finally`; treat unexpected internal errors as failures | SF2 plus `--detectOpenHandles` once |
| `P07-B5` | Existing green tests do not prove the complete P07 workflow | add focused production-path integration tests for dedup, consent, attribution, ownership, reassignment, lifecycle, SLA, idempotency, concurrency, audit/outbox and qualified handoff | SF2/SF3/SF6 |
| `P07-B6` | Dashboard/UI tests are mostly isolated and can pass while data diverges | reconcile projections against seeded source rows and bind UI tests to the same API contract; prove all UI states and DNA imports | SF4/SF5/SF6 |
| `P07-B7` | Historical P07 evidence is stale | generate current candidate-bound evidence and retain the old report as historical only | cleanup/evidence gate |

## Efficiency constraints

- Do not build a generic mutation framework or duplicate P03–P06 infrastructure.
- Reuse P05 policy/audit/outbox/idempotency and P06 safe disposable-database patterns.
- Do not run Docker, deploy, call real WhatsApp/Kommo/Supabase/cloud services or implement P08/P09/P17 behavior.
- Diagnose every blocker before editing; do not alternate one small fix with the full certifier.
- Ordinary P2/P3 cleanup outside changed P07 paths is recorded, not repaired in this phase.
