# NEX ERP — P08 Full Conformance Closure

Close **P08 — Sample, R&D, formulation, creative, and legality** in one bounded execution.
Work through completion; do not stop for plan approval or partial-green reporting.

P08 is functionally ~90% built. What is missing is *proof*: the frozen contract's HTTP-level
backend suites, the entire frontend Acceptance-5 suite, the contract-named commands, and the
one thin final verification. When `npm run verify:p08` exits naturally with `0`, no scoped
P0/P1 remains, and the contract-named test files exist, P08 is closed. P2/P3 cannot reopen it.

## Read first

1. `docs/legacy-erp/verification/P08_FROZEN_ACCEPTANCE_CONTRACT.md` — the frozen acceptance text; this prompt compresses it, the contract governs.
2. `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`
3. `docs/legacy-erp/AGENTS.md`

Do not read or rerun P00–P07 certifiers, suites, or historical evidence engines.

## Scope

- Objective: a tenant-scoped, audited sample → formulation → design/artwork → permit chain that a
  real user completes through production APIs, plus a live UI that reads those APIs.
- Risk tier: **HIGH** (payment gate, RBAC, tenancy, transactional audit/outbox).
- In scope: the five acceptance behaviors below and their proof; contract-named test files and
  commands; the finalized-design page and permit expiry view; audit/outbox atomicity.
- Out of scope: permit submission/regulatory filing/stability testing (deferred 2026-09-20);
  P09 sales/AR; P14 QC release; P15 journals; P17 provider hardening; P19 polish; the
  `SalesSample`/`Formulation` vs `SampleRequest`/`Formula` rename (DEC-2026-09-20-060 defers it).
- Known P0/P1 (all are *unproven acceptance*, treat each as blocking):
  - Acceptance 1 has no HTTP-level proof; the existing `sf2` spec exercises the service directly.
  - Acceptance 5 has no test at all; no `*p08*` file exists anywhere under `frontend/src`.
  - `npm run verify:p08` and `verify:p08:clean-db` do not exist.
  - `npm --prefix frontend run test:p08` and `lint:p08` do not exist.
  - Backend command and test-file names diverge from the contract.
- Minimum sufficient proof for this tier: real Nest HTTP + real PostgreSQL for S1–S3, one
  disposable-database golden thread, one behavior suite for the live UI. Mocks only at external
  network/provider boundaries (e.g. `bcrypt`), never for a claimed rule, RBAC decision,
  transaction, or persistence seam.
- Environment preflight: `backend/.env` `DATABASE_URL` points at a live local PostgreSQL 16
  (`postgres` superuser) with zero existing `nex_p08_*` databases. Verify this before editing;
  it is not a blocker you may work around by weakening tests.

## Provenance freeze

| Acceptance | Behavior | Label | Boundary |
|---|---|---|---|
| 1 | Finance is the only writer of sample-payment verification; unverified sample absent from R&D inbox; canonical roles/transitions; rejection reason + audit/event | `OWNER_APPROVED_EVOLUTION` (DEC-051) | Legacy shows separate payment and formulation surfaces but does **not** establish a Finance-only gate (`PV-001`). Never label this legacy parity. |
| 2 | Valid phases, exactly `100.00% ± 0.001`, `grams = percentage × targetNetto / 100`, deterministic persisted-cost HPP, actor captured on submit/approve/lock, locked rejects update/delete | `LEGACY_OBSERVED` + `TECHNICAL_SAFETY` for the immutability guard | Threshold and immutability are technical safety, not legacy policy. |
| 3 | Formal rework clones to `version + 1` and links parent, approved/locked source stays read-only; adjustment is a separate auditable ledger entry that never mutates the parent | `OWNER_REQUIRED` | Unauthorized/invalid-state actions must fail. |
| 4 | Artwork decisions bind to an immutable version with segregated actors; client approval final without hard-lock; fourth revision locks; authorized reasoned reopen resets the allowance without deleting history; BPOM/HKI-Merek/Halal preserve issue/expiry with consistent buckets; every governed write commits audit/outbox exactly once or rolls back | `OWNER_APPROVED_EVOLUTION` (`PV-002`) | Design/permit workflow is not an observed legacy parity route. |
| 5 | Primary UI reads production APIs (no static array, `localStorage`, placeholder URL, or mock fallback), exactly one finalized-design history page and one permit expiry view, primitives only from `@/components/dna`, visibly handles loading/empty/error/denied/success | `OWNER_REQUIRED` | — |

No behavior above may be relabeled legacy. No numeric threshold, actor, or SLA may be invented
to fill a gap — if one is genuinely missing, stop that slice and return the gap in the handoff.

## Required method

1. Preserve unrelated work. Never reset, discard, rewrite, or clean another person's changes.
2. Inventory the phase's failures once before editing.
3. Keep the existing fast inner loop intact: `backend/test/unit/p08/p08-sf2-*.unit-spec.ts`,
   `p08-sf3-*.unit-spec.ts`, `p08-sf4-*.unit-spec.ts` already prove the service-level behavior
   with real Prisma, real audit, and real outbox. Do not delete, rename, weaken, or replace them.
   Run them while editing: `npm --prefix backend run test:p08`.
4. Complete each subphase in order and run its focused command.

### C1 — Backend HTTP-level suites (Acceptance 1–4 over real HTTP)

Create three suites under `backend/test/p08/`, driven by real Nest HTTP against the live
PostgreSQL, using the existing `backend/test/jest-e2e.json` config (its `testRegex` already
matches `*.e2e-spec.ts`):

- `backend/test/p08/p08-s1-sample-http.e2e-spec.ts` — Acceptance 1. An unverified sample is absent
  from the R&D actionable inbox and cannot be accepted; only Finance writes verification; submit/
  approve/reject restricted to canonical roles and transitions; rejection reason and audit/event
  recorded; tenant isolation between two tenants.
- `backend/test/p08/p08-s2-formulation.e2e-spec.ts` — Acceptance 2. Phase validity, exactly
  `100.00% ± 0.001`, `grams = percentage × targetNetto / 100`, HPP from persisted cost snapshots,
  actor on submit/approve/lock, locked formula rejects update/delete with the canonical error.
- `backend/test/p08/p08-s3-release.e2e-spec.ts` — Acceptance 3–4. Revision clone to `version + 1`
  with parent link and read-only source; separate adjustment ledger entry; version-bound artwork
  decision with segregated actors; fourth revision locks; reasoned supervisor reopen; BPOM/HKI-
  Merek/Halal issue/expiry buckets; plus the adversarial cases below.

Adversarial cases that must appear and must fail safely: unauthorized actor, fourth revision,
duplicate decision, rollback leaving no partial audit/outbox effect, and an expired permit not
treated as valid.

Completion: all three suites pass through production Nest HTTP and PostgreSQL with no mocked
business rule, RBAC decision, transaction, or persistence seam.

### C2 — Contract-named commands and the thin final verification

Backend (`backend/package.json`) — the contract names these exactly:

- rename `test:p08:sample-payment` → `test:p08:sample`, pointing at `p08-s1-sample-http`
  under `test/jest-e2e.json`;
- keep `test:p08:formulation` but point it at `p08-s2-formulation` under `test/jest-e2e.json`;
- rename `test:p08:design-legal` → `test:p08:creative-legal`, pointing at `p08-s3-release`
  under `test/jest-e2e.json`;
- rename `test:p08:golden` → `test:p08:golden-thread`;
- keep bare `test:p08` as the unit inner loop over `p08-sf2|sf3|sf4`.

Frontend (`frontend/package.json`): add `test:p08` and `lint:p08`, each ≤120s, `lint:p08`
listing only the actual changed P08 UI paths.

Root (`package.json`): add

- `verify:p08:clean-db` — asserts zero `nex_p08_*` residue only. No business logic, no PASS token,
  no gate logic.
- `verify:p08` — a thin composition of already-exercised commands only, in this order:
  `backend test:p08:sample` → `backend test:p08:formulation` → `backend test:p08:creative-legal`
  → `frontend test:p08` → `frontend lint:p08` → `backend build` → `frontend build` →
  `backend test:p08:golden-thread` → `verify:p08:clean-db`.

Create `scripts/ssot/p08_clean_db.js` for the residue assertion. Model it on the existing
`scripts/ssot/p07_clean_db.js`; do not build a framework.

### C3 — Live UI suite (Acceptance 5)

Create `frontend/src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx`
using the existing vitest setup. It must prove, against the production API client:

- the primary P08 screens read production APIs — assert no static array, no `localStorage`, no
  placeholder URL, and no mock fallback is reachable;
- primitives are imported only from `@/components/dna`;
- loading, empty, error, denied, and success are each visibly handled.

The finalized-design history page (`frontend/src/app/(dashboard)/creative/finalized/page.tsx`)
and the permit expiry view (`frontend/src/app/(dashboard)/legality/permits/page.tsx`) are the
pages under test. Check the other P08 screens (`approvals/sales-sample`, `finance/bayar-sample`,
`inventory/formula-adjustment-rnd`, `legality/inbox`, `penjualan/sample-fee`) and remove any
static/localStorage/placeholder data source that a P08 flow actually renders. Record any that
are legitimately out of P08 scope in the handoff rather than deleting them.

### C4 — Golden thread and builds

Run `npm --prefix backend run test:p08:golden-thread` (unique disposable `nex_p08_*` database,
fails on unsafe name or cleanup residue) and, once, `npm --prefix backend run build` and
`npm --prefix frontend run build`.

### C5 — Evidence and commit

Write `docs/legacy-erp/verification/evidence/batches/P08-P08_FULL_CONFORMANCE_<YYYY-MM-DD>.md`
recording commands, exit codes, numeric results, P0/P1 findings, P2/P3 backlog, next action, and
the delivery metric row. Commit the untracked P08 artifacts that are currently on disk and
uncommitted: `frontend/src/app/(dashboard)/creative/finalized/`,
`docs/legacy-erp/verification/P08_FROZEN_ACCEPTANCE_CONTRACT.md`, and the two P08 prompt files.

## Prohibited

- do not create or run `certify_pXX_phase.*` or `diagnose_pXX_phase.*`;
- do not create SHA/base/candidate validation, PASS tokens, evidence digests, gate engines,
  mutation frameworks, or generated evidence systems;
- do not amend, weaken, or rewrite `P08_FROZEN_ACCEPTANCE_CONTRACT.md` — this execution conforms
  to the contract, it does not negotiate with it;
- do not delete, rename, weaken, or skip the existing `sf2/sf3/sf4` unit specs or any frozen
  acceptance behavior;
- do not mock the business rule, authorization, transaction, or persistence path claimed as proof;
- do not rerun historical phase certifiers or unrelated phase suites;
- do not run Docker, deploy, load, browser-matrix, or DR work;
- do not use the full final verification as a debugger;
- do not overwrite unrelated user changes;
- do not implement P09 or any later phase;
- do not turn an inferred threshold, actor, transition, or SLA into company SOP.

## Time budget

- related test while editing: under 60s;
- each subphase suite: at most 120s;
- golden thread: at most 240s;
- `npm run verify:p08`: 5–10 minutes;
- maximum normal correction cycle: **one**. If a command fails twice without a code or
  environment change, stop repeating it and investigate.

## Handoff

Return concise results only:

1. business capabilities completed, one line each;
2. changed paths grouped by area;
3. targeted commands with numeric results and durations;
4. `npm run verify:p08` result and exit code;
5. confirmation that each contract-named file exists (list them);
6. P0/P1 remaining — must be zero;
7. P2/P3 backlog, recorded without blocking;
8. elapsed implementation and focused-verification time, correction-cycle count;
9. any acceptance behavior you could not prove, and exactly why.
