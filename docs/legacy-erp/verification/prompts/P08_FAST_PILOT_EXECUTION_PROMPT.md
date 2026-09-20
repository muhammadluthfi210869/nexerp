# P08 Fast Pilot Execution — Sample, R&D, Creative, and Legality

You are the sole P08 executor. Deliver the frozen capability below; do not redesign the phase or ask for plan approval.
Read `AGENTS.md`, `docs/legacy-erp/AGENTS.md`, `_FAST_DELIVERY_EXECUTION_STANDARD.md`, and `_ONE_PASS_PHASE_EXECUTION_STANDARD.md` first.
Read `docs/legacy-erp/verification/ALL_PHASE_LEGACY_PARITY_AND_PROVENANCE_AUDIT.md`; preserve the distinction between observed legacy behavior, owner-approved evolution, and technical safety controls.
Preserve the dirty working tree and unrelated changes. Never reset, clean, discard, or rewrite them.

## Outcome, risk, and authority

Outcome: a paid sample can move through authorized R&D formulation, immutable revision/adjustment, artwork/legal release, and live-data UI.
Risk tier: `HIGH` (payment gate, segregated approvals, immutable regulated records, attachments, and release decisions).
Canonical trace: `REQ-035..042`, `BUS-RULE-038..045`, `BUS-RULE-107..114`, `WF-SAMPLE`, `WF-FRM`, `creative_pipeline`, `FormulationAdjustment`, P08 operations/screens/tests in `10_TRACEABILITY_MATRIX.yaml`, and P08 sample/formulation/design events.
Also obey `02_DATA_OWNERSHIP.yaml`, `07_RBAC_MATRIX.yaml`, API/screen contracts, and `09_NON_FUNCTIONAL_CONTRACT.md §11A`.
Canonical contracts win over runtime names, historical tests, roadmap prose, and folder names.

Owner decisions `DEC-2026-09-20-051..061` are frozen. Reuse canonical `DesignTask`, `DesignVersion`, `DesignFeedback`, `HkiRecord`, `BpomRecord`, `HalalRecord`, and `LegalTimelineLog` boundaries.
Do not canonicalize or expand the deferred `RegulatoryPipeline`, `ArtworkReview`, or `PNBPRequest` submission stack.

## Scope freeze

In scope: sample fee verification handoff; submit/approve/reject; formulation composition, grams and HPP snapshot calculation; formal revision and separate adjustment lineage; lock immutability; versioned artwork/APJ/client review with bounded reopen; permit recording/expiry visibility; live-data phase UI; audit/outbox atomicity.
Out of scope: permit submission/regulatory filing/product stability testing; P09 sales/AR beyond the existing sample-payment fact; P14 QC stock release; P15 journals/cost-ledger redesign; P17 provider/storage hardening; P19 product-wide polish; unrelated refactors.
Remove any P08 flow that auto-creates P09 SO/invoice merely as a formula-create side effect unless a canonical P08 seam explicitly requires it.
Do not rename `SalesSample`/`Formulation` versus runtime `SampleRequest`/`Formula`; `DEC-2026-09-20-060` defers that migration.
Use at most two lanes; backend/schema/contracts and final integration have one owner. UI may start only after request/response/status shapes freeze.

## Frozen acceptance — do not delete, skip, weaken, or rewrite

1. Finance is the only writer of sample-payment verification. An unverified sample is absent from the R&D actionable inbox and cannot be accepted; a verified sample can be submitted, approved or rejected only by canonical roles and transitions, with rejection reason and audit/event recorded.
2. A formulation linked to that sample enforces valid phases and exactly `100.00% ± 0.001`; grams equal `percentage × targetNetto / 100`, HPP uses persisted cost snapshots deterministically, and authorized submit/approve/lock records the actor. A locked formula rejects update/delete with the canonical error.
3. Formal rework clones to `version + 1`, links its parent, and preserves the approved/locked source read-only. An adjustment is a separate auditable ledger entry and never changes the parent version or composition; unauthorized or invalid-state actions fail.
4. Artwork decisions bind to an immutable version and segregated actors; client approval marks final without hard-lock, the fourth revision locks, and an authorized reasoned reopen resets the allowance without deleting history. BPOM/HKI-Merek/Halal records preserve issue/expiry facts, expose consistent expiry buckets, and every governed write commits its audit/outbox effect exactly once or rolls back.
5. The primary UI reads production APIs (no static array, localStorage, placeholder URL, or mock fallback), including exactly one finalized-design history page and permit expiry view. It uses primitives only from `@/components/dna` and visibly handles loading, empty, error, denied, and success states.

Scoped P0/P1: payment/RBAC/tenant bypass; mutable approved/locked history; wrong grams/HPP; overwritten lineage; design decision detached from its version; broken revision bound/reopen; expired permit treated as valid; non-live or unusable primary UI; unsafe migration; audit/outbox non-atomicity or duplicate effect.
P2/P3 is backlog and never expands acceptance. Known backlog: LeadCapture admin tenant filtering remains deferred unless P08 consumes those endpoints.

## Inventory disposition to follow

`REUSE`: newly frozen P08 canonical contracts/decisions, current R&D/creative/legality Prisma models/modules, production-path services, formula detail UI, creative board, legality permit views, and matching focused tests.
`REPAIR`: authenticated actor/tenant scoping; immutable formula guards; deterministic calculations; revision/adjustment lineage; design version binding and revision bound/reopen; permit expiry consistency; live UI states; audit/outbox transactions; safe cleanup.
`CONSOLIDATE`: only duplicate static/live P08 frontend surfaces needed by Acceptance 5. Preserve the deferred model/route naming divergence and unrelated live regulatory-submission endpoints.
`MISSING`: P08-native focused scripts, isolated disposable database bootstrap/cleanup, production-path seam assertions, one tenant-safe golden thread, the finalized-design page, and thin `verify:p08`.

## Dependency-ordered vertical subphases

S1 — payment-to-R&D boundary. Freeze sample API/status/role shapes; repair finance verification plus authorized submit/approve/reject and audit/event.
Paths: canonical contracts; sample/finance/R&D controller-service-schema; `backend/test/p08/p08-s1-sample-http.e2e-spec.ts`.
Command: `npm --prefix backend run test:p08:sample` (target ≤120s); include one narrow P07→P08 handoff smoke only if that interface changed. Complete when Acceptance 1 passes against production Nest HTTP/service and PostgreSQL.

S2 — formulation and lineage. Repair 100%, phase, grams/HPP, transitions, actor capture, immutable lock, formal revision, and separate adjustment transaction.
Paths: canonical contracts; R&D DTO/controller/service/schema/migration; `backend/test/p08/p08-s2-formulation.e2e-spec.ts`.
Command: `npm --prefix backend run test:p08:formulation` (target ≤120s). Complete when Acceptance 2–3 pass without mocking rules/RBAC/persistence.

S3 — creative and permit boundary. Repair immutable design versions, APJ/client role segregation, three-revision bound, reasoned supervisor reopen, finalized history, permit record/expiry policy, and audit/outbox atomicity; do not implement submission or stability.
Paths: narrow creative/legality/R&D contracts, schema, controllers/services; `backend/test/p08/p08-s3-release.e2e-spec.ts`.
Command: `npm --prefix backend run test:p08:creative-legal` (target ≤120s). Complete when Acceptance 4 plus unauthorized, fourth-revision, duplicate, rollback, and expired-permit cases pass through production services.

S4 — live UI after API freeze. Consolidate only the primary sample/formula/creative/legal screens, remove P08 static/localStorage/placeholder sources, use the DNA barrel, and cover five visible states.
Paths: affected P08 pages/components/API client only; `frontend/src/**/__tests__/p08-live-flow.behavior.test.tsx`.
Commands: `npm --prefix frontend run test:p08` and `npm --prefix frontend run lint:p08` (each target ≤120s); `lint:p08` lists only the actual changed P08 UI paths. Exercise `npm --prefix backend run build` and `npm --prefix frontend run build` once before final composition.
Complete when Acceptance 5 passes with frozen API shapes.

S5 — real phase composition. Add `backend/test/p08/p08-golden-thread.e2e-spec.ts` using a unique disposable `nex_p08_*` PostgreSQL database; fail on unsafe name or cleanup residue.
Command: `npm --prefix backend run test:p08:golden-thread` (target ≤240s).
Golden thread: tenant-scoped verified sample → authorized acceptance → 100% formula/grams/HPP → approval/lock → immutable revision/adjustment → version-bound APJ/client design finalization → permit record/expiry → live API payload consumed by UI, including one retry and one unauthorized attempt.

## Material seams — exactly one production-path assertion each

- Finance verification → R&D inbox/accept: persisted verifier and timestamp control eligibility.
- Sample approval → formulation: linked IDs and initial state are committed atomically with audit/event.
- Formula composition → calculation/lock: persisted phases produce exact grams/HPP and the lock freezes them.
- Locked source → revision/adjustment: lineage is queryable and source bytes/rows remain unchanged.
- Artwork version → APJ/client/reopen: every decision names the current version and the bound/history remain correct.
- Permit record → expiry UI: stored issue/expiry dates map consistently to expiry buckets; no fabricated fallback.
- Governed write → audit/outbox: business row, audit row, and one outbox event commit or roll back together.
- API → UI: one component behavior test proves live payload plus loading/empty/error/denied/success rendering.

## Commands and execution limits

Add simple package scripts for the four commands above and one thin root `verify:p08` that only composes:
`npm --prefix backend run test:p08:sample && npm --prefix backend run test:p08:formulation && npm --prefix backend run test:p08:creative-legal && npm --prefix frontend run test:p08 && npm --prefix frontend run lint:p08 && npm --prefix backend run build && npm --prefix frontend run build && npm --prefix backend run test:p08:golden-thread && npm run verify:p08:clean-db`.
`verify:p08:clean-db` may only assert zero `nex_p08_*` residue; it contains no business/gate/PASS-token logic. Target final verify: 5–10 minutes.
While editing run only the owning test, normally ≤60s. Run final `npm run verify:p08` once after all subphases are green; one rerun only after a real fix.
Mocks are allowed only at external network/provider boundaries, never for a claimed rule, RBAC decision, transaction, or persistence seam.
Do not run P01–P07 suites, Docker, deployment, browser/load matrices, historical certifiers, or generic repo-wide checks.
Do not create certifier/diagnose/SHA/token/mutation/evidence machinery. Do not copy P03–P06 harnesses.

## Handoff and pilot measurements

Stop after frozen acceptance passes and scoped P0/P1 is zero. Return: capabilities; changed paths grouped by contracts/database/backend/frontend/tests; numeric test outcomes and durations; golden-thread and final-verify results; deviations; zero remaining P0/P1; deferred P2/P3.
Append one Markdown metrics row only: `| P08 | HIGH | elapsed implementation | focused-test time | first-pass yes/no | correction cycles (target ≤1) | escaped P0/P1 (target 0) | deferred P2/P3 count | over-budget commands |`.
Do not fabricate certification language, hashes, tokens, or evidence packs.
