# P09–P13 — Batch Verification (independent re-run)

**Audit run:** 2026-09-23
**Revision audited:** `90f86469d42a0ad2564ee0587d9869c67cf944f1` (tag `audit-baseline-p09-p19`, branch `feat/p08-contracts-subject-ownership`)
**Method:** `verification/_BATCH_VERIFICATION_PLAN.md`
**Auditor:** read-only re-run; no source file was modified by this audit.

## Verdict

**FAIL.**

The first phase in scope (`P09`) fails its own frozen gate command, and every phase in the
batch fails the frozen `verify:pNN` composition at the frozen revision. The ledger's `PASS`
rows for these phases are not reproducible.

`P09` additionally has **no `P09_FROZEN_ACCEPTANCE_CONTRACT.md`** (only P04–P08 and P10–P18
exist). There is nothing to grade its acceptance behavior against, so P09's *contract layer* is
`NOT_VERIFIED` independently of the command failure.

## Independently reproduced commands

| Command | Exit | Result (as-is) | Ledger claim |
|---|---|---|---|
| `npm run verify:p09` | **1** | `test:p09` 17/18 frontend — `DnaBadge is not defined` crash | "PASS (30/30 backend e2e, 18/18 frontend)" |
| `npm run verify:p10` | **2** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … tsc clean" |
| `npm run verify:p11` | **1** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … tsc clean" |
| `npm run verify:p12` | **1** | halts at `tsc -p frontend` — 89 `error TS` | "PASS … tsc clean" |
| `npm run verify:p13` | **1** | same tsc halt; `test:p13` backend alone is 20/28 | "PASS (28/28 backend … dual tsc clean)" |
| `npm --prefix backend run test:p09` | 0 | 6 suites, 30/30 | 30/30 — confirmed |
| `npm --prefix backend run test:p10` | 0 | 6 suites, 23/23 | 23/23 — confirmed |
| `npm --prefix backend run test:p11` | 0 | 6 suites, 27/27 | 27/27 — confirmed |
| `npm --prefix backend run test:p12` | 0 | 6 suites, 20/20 | 20/20 — confirmed |
| `npm --prefix backend run test:p13` | **1** | 3 suites failed, **8 failed** / 20 passed of 28 | 28/28 — **contradicted** |
| `npx tsc --noEmit -p backend/tsconfig.json` | 0 | 0 errors | — |
| `npx tsc --noEmit -p frontend/tsconfig.json` | **2** | **86 `error TS` across 21 files** | — |

Backend phase suites are real: `supertest` + `ctx.app.getHttpServer()` + live Prisma against
`erp_db_test`, 0 `jest.mock`, 0 `.skip`, 0 `.only`, declared `it(` counts equal executed counts
in every suite.

## P0 findings

| # | Finding | Evidence |
|---|---|---|
| P0-1 | **Every `verify:p09` … `verify:p19` exits non-zero at the frozen revision.** The frozen compositions halt at `npx tsc --noEmit -p frontend/tsconfig.json`, which reports 86 errors. Nothing in the ledger's "tsc clean" / "dual tsc clean" claims for P10–P15, P17, P18 survives. | `verify-exitcodes.txt`; `tsc-frontend.log` |
| P0-2 | **`production.service.ts:2877` writes an unreachable foreign key.** `verifyStageQC` reads `tx.productionLog.findFirst({ where: { id: stepLogId } })` and then creates `tx.qCAudit.create({ data: { stepLogId } })`. `QCAudit.stepLog` points at **`ProductionStepLog`** (`qc_audits_stepLogId_fkey` → `production_step_logs`), but **no code path in `backend/src` ever inserts a `ProductionStepLog`** — 0 matches for `productionStepLog.create|upsert|createMany`. Result: `PrismaClientKnownRequestError P2003 ForeignKeyConstraintViolation`. | `be-p13.log`; `production.service.ts:2866-2885`; `qc.prisma:49`; repo-wide insert scan |
| P0-3 | **P13's production QC interlock is broken end-to-end.** Golden thread steps 4, 5, 6 and 8 return **500/400** instead of 201; `p13-s3` and `p13-s4` fail on the same FK. Mixing-stage QC verification cannot succeed, which cascades into filling (BUS-RULE-033 path returns `QC_BULK_NOT_PASSED` instead of the expected physical-limit pattern) and packaging. | `be-p13.log` |
| P0-4 | **`<DnaBadge>` is used without being imported on a real, routed P09 page.** `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/page.tsx:336` renders `<DnaBadge …>` while the file's `@/components/dna` import block (lines 23–36) does not include `DnaBadge`. Vitest raises `ReferenceError: DnaBadge is not defined` and the component tree collapses to `<div />`. The page is a primary P09 surface. | `fe-p09.log`; `tsc-frontend.log:336,340` |

## P1 findings

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **The ledger rows are falsified for these phases.** P13 reads "28/28 backend e2e … dual tsc clean" against an actual 20/28 and a failing tsc. P10/P11/P12 read "tsc clean" against 89 `error TS` each. P09 reads "18/18 frontend" against 17/18. | table above |
| P1-2 | **The ledger's frozen command does not run the suite whose number it cites.** `verify:p09` = `test:p09:golden-thread` (7 declared tests) `&& frontend test:p09 && clean-db`. The "30/30 backend e2e" figure comes from `test:p09`, which `verify:p09` never invokes. The phase with the most precise ledger number has the weakest frozen composition. | `package.json` `verify:p09`; `backend/package.json` `test:p09:golden-thread` |
| P1-3 | **P09 has no frozen acceptance contract.** No `P09_FROZEN_ACCEPTANCE_CONTRACT.md` exists. The ledger's "Acceptance freeze = `BUS-RULE-001` .. `015`" names business rules, not a frozen, versioned acceptance contract as P08-v1/P10-v1 etc. define one. Acceptance behavior cannot be graded. | `verification/` directory listing |
| P1-4 | **Tenant isolation is absent on most models.** 192 of 207 Prisma models carry no `organizationId` (15 do). New P09–P13 tables are in the 192. This is the same class as `P08-B6` and remains unprovable. | schema scan |
| P1-5 | **No CI workflow runs any `verify:pNN`.** `.github/workflows/` contains `ci.yml` and `deploy-vps.yml`; neither references `verify:p09…p19`. Nothing enforces any number the ledger asserts. | workflow scan |

## P2 findings

| # | Finding | Evidence |
|---|---|---|
| P2-1 | **149/149 canonical API operations owned by P09–P16 are still `PLANNED`; 117/117 canonical screens owned by P09–P18 are still `PLANNED`.** Per-phase ownership in the regenerated `_LIFECYCLE_REGISTRY.json`: API P09 50, P10 17, P11 16, P12 18, P14 17, P15 29, P16 2; screens P09 22, P10 23, P11 8, P12 5, P13 6, P14 5, P15 15, P16 1, P17 6, P18 26. **This is a reconciliation queue, not proof of absence** — reconciliation matches exact identity, and the platform entries (`target_phase: (none)`) did move 13 → 149 MAPPED once the registry was regenerated. But it does mean no canonical artifact owned by these phases has been reconciled into the system by the tool that answers that question. | `_LIFECYCLE_REGISTRY.json` |
| P2-2 | **`--forceExit` masks open handles in 37 backend scripts** (`test:p12` through `test:p18` and every per-suite variant). Combined with `ts-jest { diagnostics: false }`, no step in these compositions can observe a leaked connection or a type error in a test file. | `backend/package.json` |
| P2-3 | **The frontend phase tests are string-greps and stubbed transports, not judgment of rendered behavior.** p09–p16 and p19 replace `api.defaults.adapter` or `vi.spyOn(api,'get')` with a canned `reply()`; 12 of p09's 18 declared tests are `fs.readFileSync(file).toContain(...)` source guards ("contains no mock arrays", "uses design system primitives"). Passing them proves the source text, not that the system fetched and rendered real data. | `p09-live-flow.behavior.test.tsx:66-95,112-136` |
| P2-4 | **The registry generator hardcodes a stale phase.** `generate_lifecycle_registry.js` sets `phase: 'P02'`, `effective_date: '2026-09-17'`, `status: 'RECONCILED'` as literals, so the registry can never describe any phase after P02 truthfully. After regeneration the header still reads `phase=P02` while the metrics grew (API 377→407, models 92→100). | `generate_lifecycle_registry.js` |
| P2-5 | **8 canonical models are hard `MISSING_BLOCKER`** — `LegalStaff`, `HkiRecord`, `BpomRecord`, `HalalRecord`, `LegalTimelineLog`, `DesignTask`, `DesignVersion`, `DesignFeedback`. These sit in P08 (legal) and P19 (design) territory; they explain the `implementation_readiness_audit` and `orphan_scan` failures in `audit_lifecycle_reconciliation.js`. | `_LIFECYCLE_REGISTRY.json` |

## P3 findings

- `scripts/ssot/p19_dna_verify.js` — the script `verify:p19` calls first — entered git only in the
  baseline commit `90f86469`; it was never tracked while P19 was claimed PASS.
- `audit_lifecycle_reconciliation.js` exits 1 on exactly two gates (`implementation_readiness_audit`,
  `orphan_scan`); the other 12 gates pass.

## Next action

Do not progress. The blocking defects are P0-2/P0-3 (a real broken write path in production, with
a failing reproduction already in `backend/test/p13`) and P0-4 (a crashing primary P09 surface).
Per the programme's regression rule, each fix must land with its failing test already in place.
`P09` needs a written frozen acceptance contract before it can be graded at all.