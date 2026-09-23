# P08 — Independent Audit (full conformance closure)

**Auditor run:** 2026-09-21
**Revision audited:** `2f8f4366` on `feat/p08-contracts-subject-ownership`
**Method:** `verification/_BATCH_VERIFICATION_PLAN.md`
**Executor evidence:** `batches/P08-P08_FULL_CONFORMANCE_2026-09-21.md`

## Verdict

**PASS** for phase progression — `PARTIAL_PASS` was considered and rejected.

Every acceptance behavior in the frozen `P08-v1` contract that is provable is proven, all
frozen gates are green on an independently reproduced run, and zero *unowned* P0/P1 remains.
Two P0/P1-class gaps the audit found were fixed inside this programme (correction cycles 2 and
3); one P1-class item remains open but is owned by a LOCKED owner decision and is carried as a
pre-UAT closure requirement, matching the treatment the owner already ruled for P07's lead-capture
tenant deferral.

This is **not** a production/UAT readiness statement. `P08-B6` below must close before
production/UAT security readiness.

## Independently reproduced commands

| Command | Exit | Result |
|---|---|---|
| `npm run verify:p08` | **0** | sample 6/6 · formulation 5/5 · creative-legal 7/7 · frontend `test:p08` 27/27 · backend build 531 files (swc) · frontend build compiled 19.0s · golden thread 7/7 · clean-db test-DB residue 0 / server residue 0 |
| `npm --prefix backend run test:p07:http-closure` | **0** | 1 suite, 8/8 |
| `npx tsc --noEmit -p backend/tsconfig.json` | **0** | 0 errors |
| `npx tsc --noEmit -p frontend/tsconfig.json` | **0** | 0 errors |

Only stdout summaries were read; suite logs were processed outside the auditor's context.

## What was independently confirmed, not taken on report

- **Real HTTP seam.** `p08-s1/s2/s3` import `supertest` and drive `ctx.app.getHttpServer()`. The
  HTTP-level claim holds; the earlier unit specs remain as the fast inner loop.
- **Contract conformance.** All four contract-named backend commands exist and point at
  `test/jest-e2e.json`; `frontend test:p08`/`lint:p08` exist; the root `verify:p08` composition
  matches the contract's declared order exactly, step for step.
- **The contract was not amended.** `P08_FROZEN_ACCEPTANCE_CONTRACT.md` shows 84 insertions and 0
  deletions across the whole programme — it was committed as a new file, never edited.
- **No business-rule mocking.** `p08-s1` and `p08-s2` contain zero mocks; the shared harness
  overrides only `PlatformConfig` (a configuration boundary). `p08-s3` injects one failing outbox
  at the provider boundary, inside a `describe` that documents it.
- **`clean-db` is compliant.** `scripts/ssot/p08_clean_db.js` asserts residue only, with no
  business logic, gate engine, or PASS token.
- **No skipped tests.** Declared `it(` counts equal executed counts in every suite (6/5/6/7).
  An earlier audit suspicion of seven unrun tests in `p08-s3` was traced to the auditor's own
  `grep -c 'it('`, which also matches `submit(`, `split(`, and `init(`. The finding was withdrawn.
- **The `10_TRACEABILITY_MATRIX.yaml` edit** is a comment-only correction to a renamed command.
- **The `components/dna/index.ts` edit** is additive: it re-exports an already-implemented
  `DnaErrorState` that the P08 screens import and that could not previously resolve.

## P0/P1 found by the audit and closed in this programme

| # | Finding | Class | Disposition |
|---|---|---|---|
| A1 | The legality artwork-review surface rendered `https://placehold.co/...` as the artwork under review — frozen Acceptance 5 names a placeholder URL as forbidden, and the scoped P0/P1 list names non-live primary UI | P1 | Fixed in correction cycle 2. The API now carries `artworkUrl`/`artworkPreviewUrl`/`artworkVersion`; the surface renders the governed version with real empty/loading/error/denied states. `placehold.co` is at 0 hits repository-wide. |
| A2 | Three P08 surfaces rendered fabricated business content: a static four-item `REGULATORY CHECKLIST` with green ticks and a hardcoded `DESIGNER NOTES` quote (`legality/inbox`); a KPI tile printing the literal `"8.5%"` (`inventory/formula-adjustment-rnd`); and a 100% in-file registry of four invented sample-fee records with derived KPI totals and a create form that only mutated React state (`penjualan/sample-fee`) | P1 | Fixed in correction cycle 3, by an explicit sweep of all 13 P08 surfaces against a written in-class / not-in-class definition. Four borderline instances were deliberately left and recorded with reasons. |
| A3 | `backend/src/platform/errors/error.filter.ts` changed error-code precedence for 19 files and 43 `reason_code` sites, and no cross-phase smoke was run | P1-process | Closed by the auditor running `test:p07:http-closure` (8/8, exit 0). Not a P07 regression. |
| A4 | No command in the frozen `verify:p08` composition can detect a type error in a test file (`ts-jest` runs `diagnostics: false`; the backend build uses SWC). One such error survived two revisions | P2, systemic | Fixed by inspection; `tsc --noEmit` is clean for both packages. Carried into the standing rules for P09 onward. |

## Deferred backlog — owned, non-blocking

| ID | Item | Class |
|---|---|---|
| P08-B1 | `creative/board` keeps a `\|\| 'http://localhost:3002'` API fallback and is absent from `lint:p08` | P2 |
| P08-B2 | `lint:p08` covers 7 files while P08 touches ~13 surfaces | P2 |
| P08-B3 | `ARTWORK_NOT_ON_FILE` has no contract home or traceability entry | P2 |
| P08-B4 | The executor evidence batch's closure table still reads "not changed — out of P08 scope" for `penjualan/sample-fee`, contradicting its own correction-cycle section | P3 |
| P08-B5 | `SampleFee` has no relation to a customer master; the screen shows a raw `customerId` UUID | P2 |
| **P08-B6** | **Cross-tenant refusal on the P08 write path is unprovable.** P08 tables carry no `organizationId` (`DEC-2026-09-20-059`, LOCKED). The declared boundary is proven (parent lead 404 with no disclosure, zero mutation, plus client-injected-tenant refusal), but a *different tenant's Finance user* is not refused by any tenant predicate because none exists | **P1-class, owner-owned** |

P08-B6 is not mislabelled as fixed. By the ruling already applied to P07's deferred lead-capture
tenant filtering, it does not block phase progression but **must close before production/UAT
security readiness**.

## Process findings for the programme

Three correction cycles against a norm of one. Each traced to acceptance wording, not to executor
discipline — the executor disclosed every finding honestly, including the ones it graded down.
`Acceptance 5`'s phrase "the primary UI" was never enumerated, and A1 and A2 both exploited that
gap. P09's freeze names its surfaces explicitly and ships an in-class/not-in-class definition for
any static-content acceptance. See `_PHASE_DELIVERY_LEDGER.md` § Standing rules.

## Next action

Freeze P09 acceptance and emit its executor prompt. Close P08-B6 before production/UAT.
