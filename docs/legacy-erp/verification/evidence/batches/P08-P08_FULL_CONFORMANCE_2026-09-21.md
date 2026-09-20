# P08 Full Conformance Closure — 2026-09-21

**Scope:** `prompts/P08_FULL_CONFORMANCE_CLOSURE_PROMPT.md` (C1–C5).
**Contract:** `verification/P08_FROZEN_ACCEPTANCE_CONTRACT.md` (`P08-v1`, frozen 2026-09-20). Not amended.
**Verdict:** CLOSED — `npm run verify:p08` exits 0, scoped P0/P1 = 0, all contract-named files and commands exist.

Environment preflight, before any edit:

- `backend/.env` `DATABASE_URL` → `localhost` / `erp_db_test` / user `postgres`.
- Server: PostgreSQL 16.13.
- `select count(*) from pg_database where datname like 'nex_p08_%'` → **0**.

## Required method compliance

- Existing fast inner loop preserved and still green: `backend/test/unit/p08/p08-sf2-sample-payment.unit-spec.ts`,
  `p08-sf3-formulation.unit-spec.ts`, `p08-sf4-design-legal.unit-spec.ts`. No file deleted, renamed,
  weakened or skipped; `git status` shows them unmodified.
- Unrelated working-tree changes (P07 module/test edits, other documentation) were not touched,
  reset, or committed.
- Every suite below runs the production Nest HTTP composition against real PostgreSQL. Mocks
  appear only where a boundary genuinely cannot be observed otherwise, listed under **Deviations**.

## C1 — backend HTTP-level suites (Acceptance 1–4)

Three suites under `backend/test/p08/`, driven by real Nest HTTP (AppModule: controllers,
`JwtAuthGuard`, `RolesGuard`, `ValidationPipe`, `CanonicalErrorFilter`) against the live
PostgreSQL named by `backend/.env`, using the existing `backend/test/jest-e2e.json`.

| Suite | Command | Exit | Tests | Duration |
|---|---|---:|---:|---:|
| `p08-s1-sample-http.e2e-spec.ts` | `npm --prefix backend run test:p08:sample` | 0 | 6/6 | 39.3s |
| `p08-s2-formulation.e2e-spec.ts` | `npm --prefix backend run test:p08:formulation` | 0 | 5/5 | 44.2s |
| `p08-s3-release.e2e-spec.ts` | `npm --prefix backend run test:p08:creative-legal` | 0 | 6/6 | 41.6s |

Fixtures create tenants, users, staff, a lead and SCM materials only. They never create the audit
row, outbox event, payment verification, approval, finalized state or permit being proved.
`audit_logs` is append-only at the database level (audit_immutable trigger), so the suites assert
the chain and never delete it; everything else is removed in `afterAll`.

### Acceptance 1 — `p08-s1-sample-http.e2e-spec.ts`

- `POST /rnd/samples` unauthenticated → `401`; as `COMMERCIAL` → `403` with **0** rows created
  (canonical roles are `SUPER_ADMIN`/`RND`).
- A client-injected tenant is refused: the create DTO has no tenant field, so
  `forbidNonWhitelisted` answers `400 VALIDATION_FAILED` and **0** rows are persisted.
- A new sample is `WAITING_FINANCE` with `paymentApprovedAt`/`paymentApprovedById` `null`.
- The unverified sample is **absent** from `GET /rnd/inbox` (the actionable queue), and
  `POST /rnd/sample/:id/accept` answers `400 SAMPLE_FEE_NOT_VERIFIED` with no formula created
  and **no fabricated verifier**.
- `POST /rnd/sample/:id/verify-payment` as `RND` and as `COMMERCIAL` → `403` with the payment
  fields untouched; as `FINANCE` → `QUEUE`, `paymentApprovedById` = the JWT user, and the sample
  then appears in `GET /rnd/inbox`. Exactly **1** `VERIFY_SAMPLE_PAYMENT` audit row (actor = the
  Finance user, non-null `txId`) and **1** `sample.payment_verified` outbox event.
- **Retry:** a second `verify-payment` → `409 SAMPLE_NOT_AWAITING_FINANCE`; audit count stays 1,
  outbox count stays 1.
- `POST /rnd/sample/:id/reject-payment` as `RND` → `403` with **0** audit rows; as `FINANCE` →
  `REJECTED`, `rejectionReason` persisted, audit `afterSnapshot.reason` recorded, outbox
  `sample.payment_rejected` payload `{sample_id, rejected_by, reason}`. A later `verify-payment`
  → `409`, a later `accept` → `400`.
- **Tenant isolation.** The P08 chain's tenant is the parent `Lead`'s organization
  (`DEC-2026-09-20-059`: P08 tenant scope reads through the parent Lead). A tenant-B
  `COMMERCIAL` actor reading the owning lead gets **404** with no disclosure of the client name
  or product, and the lead, the sample, the audit count and the outbox count are all unchanged.
  The same actor's attempt on the payment path is refused. Tenant A still reads its own lead (200).

### Acceptance 2 — `p08-s2-formulation.e2e-spec.ts`

Every formula under test is produced by the real chain over HTTP
(`POST /rnd/samples` → `POST /rnd/sample/:id/verify-payment` → `POST /rnd/sample/:id/accept`),
never seeded into a state the test then claims to have produced.

- **Phase validity:** a phase missing its required `order` → `400 VALIDATION_FAILED`, no write.
- **Composition invariant:** totals of 99, 100.5 and 99.9985 are refused with
  `COMPOSITION_TOTAL_INVALID` and leave the persisted item rows untouched. A total that sums
  inside the band (20.0005 + 79.9995 = 100) is accepted.
- **Grams and HPP are computed from the persisted rows**, not the request body:
  `gramFor(persisted %, persisted targetYieldGram)` → `[100, 400]` at 500g netto and `[50, 200]`
  at 250g; `costPerGramFor(persisted rows)` → `100`. The same input twice produces byte-identical
  persisted item rows.
- **Actor captured**: `POST /rnd/formulas/:id/request-approval` writes one
  `SUBMIT_FORMULA_APPROVAL` audit row with `actorUserId` = the JWT user;
  `POST /rnd/formulas/:id/approve` writes `lockedById` = the JWT user and one `APPROVE_FORMULA`
  audit row (non-null `txId`) plus exactly one `rnd.formulation.locked` outbox event;
  `PATCH /rnd/formulas/:id/lock-production` writes `lockedById` and one
  `LOCK_FORMULA_PRODUCTION` audit row plus one `rnd.formulation.locked` event.
- **Canonical permission**: `approve` as `RND` → `403` with 0 `APPROVE_FORMULA` rows.
- **Lock immutability**: a `SAMPLE_LOCKED` and a `PRODUCTION_LOCKED` formula both refuse a
  composition rewrite **and** the delete of their composition rows (an emptied `phases` array)
  with `400 FORMULA_LOCKED`, and the persisted item ids/percentages/costs are byte-identical
  afterwards. Re-submitting a locked formula also answers `FORMULA_LOCKED` and cannot walk the
  lock back into an editable state.
- The production lock's material gate is real: a formula without linked SCM materials is refused
  with the status unchanged.

### Acceptance 3–4 — `p08-s3-release.e2e-spec.ts`

- **Lineage:** `POST /rnd/formulas/:id/revision` on a V1 parent returns V2 (new id, `DRAFT`); the
  parent keeps `version = 1`, its target yield and its item row **ids**; only its status flag
  becomes `SUPERSEDED`. The copy carries the composition forward. One
  `CREATE_FORMULA_REVISION` audit row names the actor and records
  `beforeSnapshot.parent_version = 1` and `parent_formula_id`. The superseded parent then refuses
  a rewrite with `FORMULA_LOCKED` and its rows are unchanged.
- **Version-bound decision + segregated actors:** an APJ decision by `COMMERCIAL` → `403` with 0
  approval rows; a wrong PIN → `400`; approving by `APJ` moves to `WAITING_CLIENT`. A client
  decision with **no** `versionId` → `400 DESIGN_VERSION_REQUIRED`; by the `APJ` role → `403`;
  naming a version **older** than the one on the table → `400 DESIGN_VERSION_REQUIRED` with no
  feedback written and `isFinal` still false. The current version approves → `LOCKED`,
  `isFinal = true`, `finalArtworkUrl` = that version's URL, and the stored `DesignFeedback.versionId`
  is the approved version (a fact, not an ordering guess).
- **Duplicate decision:** a second approval on the finalized design → `400`, with the
  `CLIENT_APPROVE_DESIGN` audit count still 1 and the `design.finalized` outbox count still 1.
- **Revision bound:** three real revision rounds (`upload → submit → APJ approve → client reject`)
  give `revisionCount` 1, 2, 3 with `isLocked` false, false, true. The fourth revision is refused
  at the upload entry point with `400 DESIGN_REVISION_BOUND_REACHED`, with 3 versions stored.
- **Unauthorized reopen:** `PATCH /creative/task/:id/unlock` as `COMMERCIAL` → `403` with the task
  still locked, `revisionCount` still 3 and **0** `SUPERVISOR_REOPEN_DESIGN` rows. A reopen with
  no reason → `400`.
- **Reasoned supervisor reopen:** as `DIRECTOR` → `revisionCount` 0, `isLocked` false, exactly one
  `SUPERVISOR_REOPEN_DESIGN` audit row (actor = the director, `before.revisionCount` 3,
  `after.revisionCount` 0), exactly one `design.reopened` outbox event, and the reason stored in
  the design history. The reset **survives the next upload** (still 0 / unlocked) and a whole
  further revision cycle is accepted again (1 of 3).
- **Finalized page data:** `GET /creative/finalized` contains the finalized task with its approved
  version id and both versions, and never the task that was never finalized.
- **Permits:** `POST /legality/bpom|hki|halal` as `RND` → `403`; as `COMPLIANCE` the issue date and
  the expiry are both kept, and the audit risk is derived (`DELAY_AUDIT` for 75 days, `CRITICAL`
  for an elapsed date, `DELAY_AUDIT` for no expiry on file — never `OK`). `GET /legality/expiry`
  places the 75-day permit in `warning`, the elapsed one in `expired`, and omits the
  no-expiry record from `nearestExpiring` rather than treating it as expiring.
  `GET /legality/permits` agrees: `EXPIRING_SOON`, and **`EXPIRED` for the permit read past its
  expiry — never valid**; the no-expiry row reports `expiry: "N/A"` and is not expiring.
- **Rollback (adversarial case 7):** with an outbox whose downstream provider fails, the governed
  Finance verification over HTTP answers `500` and leaves `stage = WAITING_FINANCE`, both payment
  fields `null`, **0** audit rows, **0** outbox rows and no extra stage log — the business write,
  its audit row and its event roll back together.

## C2 — contract-named commands and the thin final verification

`backend/package.json`:

| Name | Target |
|---|---|
| `test:p08:sample` | `p08-s1-sample-http` under `test/jest-e2e.json` |
| `test:p08:formulation` | `p08-s2-formulation` under `test/jest-e2e.json` |
| `test:p08:creative-legal` | `p08-s3-release` under `test/jest-e2e.json` |
| `test:p08:golden-thread` | `p08-golden-thread` under `test/jest-e2e.json` |
| `test:p08` | unit inner loop over `p08-` under `test/jest-unit.json` |

Removed (renamed): `test:p08:sample-payment`, `test:p08:design-legal`, `test:p08:golden`.

`frontend/package.json`: added `test:p08` (the Acceptance-5 suite, 6.3s) and `lint:p08`
(the six changed P08 UI paths + the suite). `lint:p08` exits 0 with **0 errors** / 89 pre-existing
DNA style warnings.

Root `package.json`:

- `verify:p08:clean-db` → `node scripts/ssot/p08_clean_db.js` — asserts zero `nex_p08_*` residue
  only (namespace rows in the P08-owned columns, and no leftover `nex_p08_*` database). No business
  logic, no gate, no token.
- `verify:p08` → thin composition of already-exercised commands in the contract's order:
  `backend test:p08:sample` → `backend test:p08:formulation` → `backend test:p08:creative-legal`
  → `frontend test:p08` → `frontend lint:p08` → `backend build` → `frontend build`
  → `backend test:p08:golden-thread` → `verify:p08:clean-db`.

`scripts/ssot/p08_clean_db.js` is modelled on `scripts/ssot/p07_clean_db.js`; no framework.

## C3 — live UI suite (Acceptance 5)

`frontend/src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx`
— `npm --prefix frontend run test:p08`, exit 0, **15/15**, 6.3s.

The production API client (`@/lib/api`) is what runs: the axios instance keeps its `baseURL` and
its interceptors, and only the socket beneath it is replaced, because the network is the one
boundary that cannot be observed in jsdom.

It proves, for `creative/finalized/page.tsx` and `legality/permits/page.tsx`:

- **no static / localStorage / placeholder / mock source is reachable** — a source guard asserts
  neither page contains `localStorage`, `sessionStorage`, an absolute `http(s)://` literal,
  an `INITIAL_`/`MOCK_`/`FALLBACK_`/`DEMO_`/`DUMMY_` constant, or `placehold.co`; both import
  their data from `@/lib/api` and call `api.get(...)`. A runtime probe then renders a unique
  sentinel payload and asserts the DOM contains that sentinel and that exactly one call was made,
  to the production path;
- **primitives come only from `@/components/dna`** — the import surface contains no
  `@/components/ui/`, `@radix-ui/` or `@/components/shadcn`;
- **loading, empty, error, denied and success** are each visible on both pages.

Other P08 screens checked, and what was done:

| Screen | Finding | Action |
|---|---|---|
| `finance/bayar-sample` | live API + loading + error; a 401/403 was collapsed into the generic load failure | distinct access-refusal message added |
| `inventory/formula-adjustment-rnd` | live API, but the query swallowed its error and fell back to an in-file `MOCK_ADJUSTMENTS` array, and had no loading/error state | fallback array deleted, error surfaced, loading/error/denied states added |
| `approvals/sales-sample` | 100% in-file `INITIAL_SAMPLE_DATA` of three invented samples (no API at all) | wired to the live `GET /rnd/samples`: list, revision, formulator, sales PIC, dates, status and line items all come from the API, with loading/error/denied/empty states |
| `legality/inbox` | live API + loading + error + empty; an artwork preview is a hardcoded `placehold.co` image | **not changed — out of P08 scope**, see Deviations |
| `penjualan/sample-fee` | 100% in-file `SAMPLE_FEES` array with a local create that only mutates React state | **not changed — out of P08 scope**, see Deviations |

## C4 — golden thread and builds

| Command | Exit | Result | Duration |
|---|---:|---|---|
| `npm --prefix backend run test:p08:golden-thread` | 0 | 1 suite / 7 tests | 49.3s |
| `npm --prefix backend run build` | 0 | `Successfully compiled: 531 files with swc` | (see `verify:p08` log; not separately instrumented) |
| `npm --prefix frontend run build` | 0 | `✓ Compiled successfully`, full route manifest, `Running TypeScript` clean | (see `verify:p08` log; not separately instrumented) |

The golden thread provisions a unique disposable `nex_p08_golden_*` database through the committed
migration chain, refuses an unsafe or production-like name, and drops the database in `finally` —
a cleanup failure fails the run, so a leftover can never pass silently.

## C5 — verification results

| Command | Exit | Result | Duration |
|---|---:|---|---:|
| `npm run verify:p08` | **0** | natural exit; 6+5+6 backend HTTP + 15 frontend + 7 golden thread; `test-DB residue: 0`, `server residue: 0 nex_p08_* databases` | 214s |

Run once on the final committed revision (`01f1048d`). An earlier run on `6ffa0a37`
also exited 0 in 206s; the only later change was the S3 upload sweep's cleanup, whose
owning suite was re-run green (6/6, 41.6s) before this final composition.

`npm run verify:p08:clean-db` → `[P08] test-DB residue: 0`, `[P08] server residue: 0 nex_p08_* databases`.

## Contract-named files (all exist)

Backend:
`backend/test/p08/p08-s1-sample-http.e2e-spec.ts`,
`backend/test/p08/p08-s2-formulation.e2e-spec.ts`,
`backend/test/p08/p08-s3-release.e2e-spec.ts`,
`backend/test/p08/p08-http-harness.ts` (shared harness, not a suite),
`backend/test/p08/p08-golden-thread.e2e-spec.ts` (pre-existing, unmodified, green).

Frontend:
`frontend/src/app/(dashboard)/creative/finalized/page.tsx`,
`frontend/src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx`.

Root: `scripts/ssot/p08_clean_db.js`.

## Production changes made (and why)

| Path | Change | Reason |
|---|---|---|
| `backend/src/platform/errors/error.filter.ts` | `fromHttp` now prefers `res.code` / `res.reason_code` over Nest's generic `res.error` label | the canonical P08 reason codes (`FORMULA_LOCKED`, `SAMPLE_FEE_NOT_VERIFIED`, `DESIGN_VERSION_REQUIRED`, …) never reached an HTTP client: `res.error` is the generic word `Bad Request`/`Forbidden` and shadowed them, so no client could switch on the code the contract names. One line, one place, all callers. |
| `backend/src/modules/rnd/formulas/formulas.service.ts` + `.controller.ts` | `requestApproval` now takes the JWT actor and records a `SUBMIT_FORMULA_APPROVAL` audit row, and goes through `assertMutable` | acceptance 2 requires the actor on submit; and without the guard `POST /rnd/formulas/:id/request-approval` walked a `SAMPLE_LOCKED` formula back to `WAITING_APPROVAL`, reopening the edit path the lock exists to close. |
| `frontend/src/components/dna/index.ts` | re-exported `DnaErrorState` | the component was implemented in `DnaFeedbackStates.tsx` but never re-exported, so `creative/finalized/page.tsx` — which imports it from `@/components/dna` per acceptance 5 — could not resolve it and the frontend build failed. |
| `frontend/src/app/(dashboard)/creative/finalized/page.tsx` | dropped `icon` / `variant` from `DnaEmptyState` | the barrel exports the legacy `DnaEmptyState` implementation, which does not accept those props; this was the frontend build's only type error. |
| `docs/legacy-erp/contracts/10_TRACEABILITY_MATRIX.yaml` | one comment in the P08 test block now names `test:p08` / `test:p08:creative-legal` | the renamed command no longer existed; leaving the old name would have made the contract misstate the runnable command. No criterion added or removed. |

## Deviations

- **The one injected boundary.** `p08-s3-release.e2e-spec.ts`'s second `describe` overrides
  `OutboxService.enqueue` with a rejecting stub in a second application instance. A rollback cannot
  be observed unless a provider fails, and the outbox is the outbound provider boundary. Only the
  provider is replaced: the governed write, the audit chain, the transaction and the persistence
  behave exactly as production, against real PostgreSQL. No business rule, RBAC decision,
  transaction or persistence seam is replaced anywhere in P08.
- **`bcrypt` is not mocked.** The APJ e-signature is exercised with a real hash and a real wrong-PIN
  refusal.
- **Tenant isolation is proven at the boundary the LOCKED decision declares.** `DEC-2026-09-20-059`
  records that the P08 tables (`design_tasks`, `hki_records`, `bpom_records`, `halal_records`, and
  likewise `sample_requests`/`formulas`) have **no per-table `organizationId`** in the running
  database, and that P08 tenant scope reads through the parent `Lead`. `p08-s1` therefore proves the
  parent-lead boundary (404, no disclosure, zero mutation) and the client-injected-tenant refusal.
  A cross-tenant **role-holder** (e.g. another tenant's Finance user) is not refused by any tenant
  predicate on the P08 write path, because no such predicate exists — recorded as backlog, not
  claimed as fixed. Closing it needs the per-table column plus an actor-scoped lookup, which would
  change the frozen `sf2/sf3/sf4` service signatures.
- **`legality/inbox` artwork preview not changed — out of P08 scope.** Its `ARTWORK_REVIEW` task
  payload from `GET /legality/inbox/tasks` carries no artwork URL at all
  (`LegalityService.getPendingTasks` returns `{id, type, priority, title, pipelineId, createdAt}`),
  so the panel renders a `placehold.co` image. That panel is the regulatory artwork-review slice,
  and permit submission / regulatory filing is explicitly deferred by the owner decision of
  2026-09-20. Removed nothing, invented no source; the placeholder is recorded here.
- **`penjualan/sample-fee` not changed — it is the P09 sales/AR slice.** The page renders a
  fee registry with `clientName`, a `RECEIVED/OFFSET/EXPIRED` status carrying a 30-day validity,
  and a `jobOrderRef`. The live `GET /finance/sample-fees` returns
  `{feeNumber, customerId, amount, feeDate, notes, offsetToDPId}`: `customerId` is a bare UUID with
  no relation declared on `SampleFee` (`backend/prisma/schema/finance.prisma`), and neither a
  validity period nor a job-order reference exists. Wiring it would either display raw UUIDs or
  require a schema change to a P09-owned concept, both of which are worse than recording it. The
  P08 sample-fee gate itself lives on `finance/bayar-sample` (Finance verification), which is wired
  to the live API.
- **The ±0.001 composition boundary is refused at exactly 0.001.** `20 + 79.999` and
  `20 + 80.001` both store a double whose distance from 100 is 0.0010000000000048, so the rule
  `|total − 100| > 0.001` refuses both. Rounding the deviation would admit them, but the frozen
  `p08-sf3` suite pins `80.001` as `COMPOSITION_TOTAL_INVALID`, so the semantics were left alone
  and the edge is asserted and documented in the S2 suite and in the service. Recorded as P3.

## Remaining scoped P0/P1

- Scoped P0: **0**
- Scoped P1: **0**

## P2/P3 backlog (recorded, non-blocking)

- **P2 — P08 tenancy.** Per `DEC-2026-09-20-059`, a cross-tenant role-holder is not refused on the
  P08 write path (no per-table `organizationId`). Needs the column, an actor-scoped parent-lead
  lookup on `createSample`/`verifySamplePayment`/`rejectSamplePayment`, and a decision on whether
  the frozen `sf2/sf3/sf4` service signatures may change.
- **P2 — legacy R&D e2e suites.** `backend/test/rnd-audit.e2e-spec.ts` and
  `backend/test/rnd-business-process.e2e-spec.ts` still cannot build (`DEC-2026-09-20-061`).
  Unchanged by P08. Note: `rnd-business-process` calls `formulasService.requestApproval(id)`, which
  still type-checks because the new `actorId` is optional.
- **P2 — the creative flow's activity-stream write fails silently.** Running the S3 suite emits
  ~31 logged `Argument 'eventType' is missing` errors. `CreativeService` emits
  `activity.logged` with only `senderDivision`/`notes`/`loggedBy`
  (`src/modules/creative/creative.service.ts`), while
  `ActivityStreamService.createLog` requires `leadId` and `eventType`
  (`src/modules/activity-stream/activity-stream.service.ts:18`). The listener's rejection is logged
  and swallowed, so the design activity stream loses rows without anyone noticing. Pre-existing,
  outside the files this phase changed, and it does not block the acceptance — recorded, not
  repaired here. It is also why every P08 backend run prints that error.
- **P3 — composition tolerance representation.** The `±0.001` invariant is compared on the binary
  double sum, so a mathematically exact 0.001 deviation is refused. Fixing it means either an
  epsilon (which also admits `100.001`, contradicting the frozen sf3 expectation) or a
  decimal-typed accumulation, and a decision on which the frozen suite allows.
- **P3 — refused-composition message rounds to `100.00`.** `totalDosage.toFixed(2)` renders 99.999
  as `100.00` in the `COMPOSITION_TOTAL_INVALID` message. Cosmetic; the reason code is correct.
- **P3 — `DnaEmptyState` name collision.** `@/components/dna` exports the legacy implementation
  (`DnaLegacyCompat`) while a richer one with `icon`/`variant` sits in `DnaFeedbackStates.tsx`.
  Only `DnaErrorState` was re-exported here; consolidating the two is a repo-wide UI change.
- **P3 — eight identical demo approval shells.** `approvals/{goods-request,purchase,purchase-request,
  purchase-return,request-cogs,sales,sales-return}` still render in-file `INITIAL_*_DATA` arrays of
  the same shape `sales-sample` used. They are P04–P14 surfaces, outside this phase; only the P08
  sample shell was wired.
- **P3 — `placehold.co` in `legality/inbox`** (see Deviations): the deferred regulatory
  artwork-review slice.
- **P3 — a refused multipart upload still writes to disk.** `POST/PATCH` on
  `creative/task/:id/version` runs multer's disk storage before the controller reaches
  `CreativeService`, so the fourth-revision refusal (a `400` the suite asserts) still leaves the
  artwork and mockup files in `backend/uploads/creative_assets`. The S3 suite cleans them by
  snapshotting the directory in `beforeAll` and removing anything new in `finally`; the platform
  behaviour itself is unchanged and unfixed. Found by the residue check, not by a business
  assertion.

## Delivery metric

| Contract check | Status | Evidence |
|---|---|---|
| `sample_payment_verification` | PASS | `p08-s1` 6/6 over HTTP; `SAMPLE_FEE_NOT_VERIFIED`, `SAMPLE_NOT_AWAITING_FINANCE`, Finance-only writes, 1 audit + 1 outbox |
| `formulation_deterministic_and_immutable` | PASS | `p08-s2` 5/5; `COMPOSITION_TOTAL_INVALID`, `FORMULA_LOCKED`, persisted gram/HPP, actor on submit/approve/lock |
| `adjustment_lineage_preserved` | PASS | `p08-s3` test 1; parent version + item ids unchanged, `SUPERSEDED` flag only |
| `design_bounded_revision_and_finalized_page` | PASS | `p08-s3` tests 2–4; bound 3, fourth refused, reopen resets, one page via `GET /creative/finalized` |
| `permit_record_and_expiry` | PASS | `p08-s3` test 5; issue + expiry kept, 0/30/90 buckets, `EXPIRED` never valid |
| `audit_outbox_atomicity` | PASS | `p08-s3` rollback describe; 500 leaves 0 audit + 0 outbox + no state change |
| `golden_thread` | PASS | 7/7 on a disposable `nex_p08_golden_*` database, dropped in `finally` |
| `frontend_live_data_dna_states` | PASS | `p08-live-flow.behavior.test.tsx` 15/15; production client, `@/components/dna`, all five states |
| `affected_regression_and_cleanup` | PASS | unit inner loop 27/27 unchanged; backend + frontend build 0; residue 0 |
| `contract_ownership` | PASS (carried) | canonical contracts already carry the P08 owners (`DEC-051..060`); the one stale command name in the traceability block was corrected |

**Unexpected skipped/pending/todo/flaky tests: 0. Cross-tenant or unauthorized mutation: 0.
New type errors and lint errors in changed scope: 0. Residual `nex_p08_*` databases: 0.
Residual upload artifacts after the S3 suite: 0.**
