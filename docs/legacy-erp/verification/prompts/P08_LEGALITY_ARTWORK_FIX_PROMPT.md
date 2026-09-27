# NEX ERP — P08 Bounded Correction: the legality artwork review must show the real artwork

One bounded correction cycle. Work through completion; do not stop for plan approval.

An independent audit of the P08 full-conformance closure found one scoped P1. Everything else
in the closure was verified and stands — do not redo it, do not touch it.

## The P1

`frontend/src/app/(dashboard)/legality/inbox/page.tsx:225` renders a hardcoded placeholder as
the artwork under review:

```tsx
<Image
  src="https://placehold.co/1200x800/f8fafc/cbd5e1?text=ARTWORK+PREVIEW"
  alt="Artwork Preview"
  ...
/>
```

That block is inside the `activeTask.type === "ARTWORK_REVIEW"` branch. Artwork review is a P08
subject ("design/artwork approval with bounded revision"), so this is a P08 primary surface
rendering a **placeholder URL** — which frozen Acceptance 5 forbids, and which the scoped P0/P1
list names as "non-live or unusable primary UI". An artwork reviewer cannot review artwork here.

The backend already persists the real thing: `backend/src/modules/creative/creative.service.ts`
carries `artworkUrl` and `finalArtworkUrl` on design versions. The gap is that the legality
pipeline task payload this screen consumes does not carry the artwork URL for the design version
under review.

## Required outcome

1. The legality `ARTWORK_REVIEW` surface renders the **governed artwork of the exact design
   version under review**, read from a production API — not a placeholder, not a static asset.
2. It visibly handles loading, empty ("no artwork on this version yet"), error, and denied — in
   the same DNA primitives the rest of P08 uses (`@/components/dna` only).
3. No `placehold.co`, no `via.placeholder`, no `example.com`, no static image URL remains
   anywhere in a P08 UI surface.
4. Carry the artwork URL on the backend payload that this screen actually consumes. Keep the
   change inside the narrow legality/creative/R&D controller-service boundary — do not reshape
   unrelated modules, and do not alter the frozen `SalesSample`/`Formula` naming.

## Regression test first

Per the project regression rule and the execution standard: write the failing test **before** the
fix, confirm it fails for the right reason, then fix, then confirm the whole suite is green.

Extend `frontend/src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx`
with a case that asserts the legality artwork-review surface renders an artwork URL derived from
the API response and that no placeholder URL is reachable in the rendered output. The existing
"no static, localStorage, placeholder or mock data source is reachable" describe block is the
right home for it. If a backend assertion is needed to prove the payload carries the URL, add it
to `backend/test/p08/p08-s3-release.e2e-spec.ts` through real HTTP.

## Also required in this cycle

- **Affected predecessor smoke.** The closure changed
  `backend/src/platform/errors/error.filter.ts`, which alters error-code precedence for 19 files
  and 43 `reason_code` sites across auth, `roles.guard`, policy, scope, master, communication,
  mfa, config, approval, audit and outbox. Roadmap rule 6 requires the directly affected
  predecessor smoke, and it was never run. Run
  `npm --prefix backend run test:p07:http-closure` and record its numeric result. If it fails,
  the error-filter change is the cause and fixing it is in scope.
- **Type error.** `backend/test/p08/p08-s3-release.e2e-spec.ts:700` imports `INestApplication`
  as a value from `@nestjs/common` while it is type-only. Fix the import. No command in
  `verify:p08` can catch this, so fix it by inspection and confirm the suite still passes.

## Prohibited

- do not amend, weaken, or rewrite `P08_FROZEN_ACCEPTANCE_CONTRACT.md`;
- do not delete, rename, weaken or skip any existing P08, `sf2/sf3/sf4`, or P07 test;
- do not add or reorder any step of the frozen `verify:p08` composition;
- do not create a certifier, diagnose runner, PASS token, SHA check, or evidence engine;
- do not mock a business rule, RBAC decision, transaction or persistence seam;
- do not substitute a different placeholder, a bundled stock image, or a "coming soon" graphic
  for the placeholder you are removing — the artwork must be the real governed version, or an
  honest empty state;
- do not touch unrelated working-tree changes.

## Finish

Run the affected suites, then one `npm run verify:p08` (one rerun only after a real fix). Then
update `docs/legacy-erp/verification/evidence/batches/P08-P08_FULL_CONFORMANCE_2026-09-21.md`
with this correction: what the audit found, what you changed, the regression test, the P07 smoke
result, and the new `verify:p08` result. Commit.

## Handoff

Return only: the artwork payload change, the frontend render change, the failing-then-passing
regression test name, the `test:p07:http-closure` numeric result, the type-error fix, the
`verify:p08` exit code, and any behavior you still could not prove.
