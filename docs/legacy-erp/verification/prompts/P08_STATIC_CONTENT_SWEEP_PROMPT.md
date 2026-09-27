# NEX ERP — P08 Bounded Correction 2: remove fabricated content from the P08 review surfaces

One bounded correction cycle. Work through completion; do not stop for plan approval.

An independent audit of the second P08 revision found a scoped P1 of the same class as the
placeholder artwork already fixed in `P08_LEGALITY_ARTWORK_FIX_PROMPT.md`. Everything else in
that revision was verified: `verify:p08` exit 0, `test:p07:http-closure` 8/8 exit 0,
`npx tsc --noEmit -p backend/tsconfig.json` exit 0 with 0 errors, `placehold.co` 0 hits.

## The P1

`frontend/src/app/(dashboard)/legality/inbox/page.tsx`, inside the `ARTWORK_REVIEW` workspace —
the compliance officer's decision surface:

1. **Line ~339 — a fabricated compliance checklist.** A static array renders four items
   (`"Batch Number"`, `"Composition"`, `"Net Weight"`, `"Manufacturer"`), each with a green
   `CheckCircle2`. Nothing reads any data. The panel asserts that four regulatory checks passed
   when no check ran. Frozen Acceptance 5 forbids a static array on a primary P08 surface, and
   the scoped P0/P1 list names "non-live or unusable primary UI". This is worse than cosmetic:
   it is a false compliance claim on the screen whose entire purpose is regulatory truth.

2. **Lines ~347–355 — a fabricated designer note.** A hardcoded quoted string
   (`"Updated version based on revision #3. Adjusted font size to meet requirements."`) is
   presented as the designer's actual note for the version under review.

A previous executor disclosed both in its handoff but graded them backlog and did not record
them in the evidence file. The owner has ruled: **remove them.**

## Required outcome

1. Remove the static REGULATORY CHECKLIST card and the hardcoded DESIGNER NOTES quote.
   Do not replace them with a different static claim, a "coming soon" graphic, or a
   different fabricated string. Either render the real value from the API, or render an
   honest empty/absent state, or remove the card. Where no API field exists today, an honest
   empty state (or nothing) is correct — do not invent an endpoint for this cycle.
2. **Sweep every P08 UI surface for the same class and fix each instance the same way.**
   The class is: *a rendered static array or hardcoded string that presents business data,
   status, or a claim, rather than UI chrome.*
   - **In class (fix):** fabricated checklists, hardcoded status/verdict claims, quoted notes
     or remarks presented as real records, hardcoded counts, dates, names, or scores.
   - **Not in class (leave alone):** `breadcrumbs`, `tabs`, select `options`/enums,
     state-transition maps used for validation (e.g. the `DRAFT: ["PENDING_REVIEW", ...]` map in
     `legality/permits/page.tsx`), labels, and placeholder *attributes* on inputs.
   P08 surfaces: `legality/inbox`, `legality/permits`, `legality/records`, `legality/dashboard`,
   `legality/ckpb-audit`, `legality/input`, `creative/board`, `creative/finalized`,
   `approvals/sales-sample`, `finance/bayar-sample`, `inventory/formula-adjustment-rnd`,
   `penjualan/sample-fee`, `penjualan/pipeline-rnd`. Record every instance you fixed and every
   borderline one you deliberately left, with its path and reason, in the handoff and the
   evidence file.
3. Do not touch `frontend/src/components/dashboard/QCNotificationHub.tsx` or
   `creative/board`'s `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'` fallback —
   those are recorded backlog items, not this cycle's scope.

## Regression test first

Per the project regression rule and the execution standard: write the failing test **before**
the fix, confirm it fails for the right reason, then fix.

Extend `frontend/src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx`.
Add a case asserting the legality artwork-review workspace renders no fabricated compliance
claim and no hardcoded note: with an API response that carries no checklist or designer-note
data, none of the four checklist labels and none of the quoted note text may appear in the
rendered output. Follow the existing source-guard pattern in that file where a render-level
assertion is impractical.

## Also required in this cycle

Update `docs/legacy-erp/verification/evidence/batches/P08-P08_FULL_CONFORMANCE_2026-09-21.md`
so the durable record carries this finding and its fix. It currently mentions only the
`placehold.co` item. Record, in the existing structure:

- this second P1, its path, and that a previous handoff disclosed it while the evidence file
  omitted it;
- the sweep result: every instance fixed, every borderline instance left, with reasons;
- the new backlog row: the error code `ARTWORK_NOT_ON_FILE`
  (`backend/src/modules/legality/legality.service.ts:29`) is used by a P08 refusal but appears in
  **no** canonical contract or traceability entry — it needs a contract home or a rename to an
  existing code;
- keep the existing P2/P3 rows (the `creative/board` localhost fallback, the lint-warning count)
  intact.

## Prohibited

- do not amend, weaken, or rewrite `P08_FROZEN_ACCEPTANCE_CONTRACT.md`;
- do not delete, rename, weaken or skip any existing P08, `sf2/sf3/sf4`, or P07 test;
- do not add, remove, or reorder any step of the frozen `verify:p08` composition;
- do not create a certifier, diagnose runner, PASS token, SHA check, or evidence engine;
- do not mock a business rule, RBAC decision, transaction or persistence seam;
- do not invent a new API endpoint in this cycle;
- do not touch unrelated working-tree changes.

## Finish

Run the affected suites, then one `npm run verify:p08` (one rerun only after a real fix). Commit.

## Handoff

Return only: each instance found and how it was fixed; the borderline instances left and why;
the failing-then-passing regression test name; the sweep's coverage list; the `verify:p08` exit
code with its per-step numbers; and anything you still could not prove.
