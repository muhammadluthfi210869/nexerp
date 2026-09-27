# P19 — Batch Verification (independent re-run)

**Audit run:** 2026-09-23
**Revision audited:** `90f86469d42a0ad2564ee0587d9869c67cf944f1` (tag `audit-baseline-p09-p19`)
**Method:** `verification/_BATCH_VERIFICATION_PLAN.md`
**Auditor:** read-only re-run; no source file was modified by this audit.

## Verdict

**FAIL.**

The frozen `verify:p19` command exits **1** at the frozen revision: the second step,
`check_page_shell_layout.js`, fails. The ledger's `PASS` row (which cites the first step's
numbers, `0 direct imports across 672 files`) is not reproducible as a whole-command pass.

P19 also has **no `P19_FROZEN_ACCEPTANCE_CONTRACT.md`**, so its acceptance behavior cannot be
graded; its contract layer is `NOT_VERIFIED` independently of the command failure.

## Independently reproduced commands

| Command | Exit | Result (as-is) | Ledger claim |
|---|---|---|---|
| `npm run verify:p19` | **1** | step 1 PASS, step 2 **FAIL** (`3 pages with raw detached tables`) | "PASS" |
| `node scripts/ssot/p19_dna_verify.js` | 0 | PASS — 0 violations across 674 files | "0 direct imports across 672 files" — count differs (674 now, 672 claimed) |
| `node scripts/ssot/check_page_shell_layout.js` | **1** | FAIL — `finance/dashboard`, `legality/dashboard`, `rnd/dashboard` have detached tables | not mentioned in the ledger |
| `npm --prefix frontend run test:p19` | 0 | 11/11 | 10/10 — superseded |
| frontend `tsc` inside `verify:p19` | — | never reached (step 2 short-circuits) | "tsc clean" |

The first step's claim is **true as stated** — reproduced against a directory where
`components/dna` and `components/ui` are excluded by design. See P2-1 for exactly what it covers.

## P0 findings

| # | Finding | Evidence |
|---|---|---|
| P0-1 | **`verify:p19` exits 1 at the frozen revision.** `check_page_shell_layout.js` fails three dashboard pages for raw detached tables. The ledger records P19 as `PASS` with "Next.js build clean"; the build is never reached because step 2 aborts the `&&` chain. | `vp19.log` |

## P1 findings

| # | Finding | Evidence |
|---|---|---|
| P1-1 | **P19 has no frozen acceptance contract.** The ledger's "Acceptance freeze" cell for P19 reads "AC-P19-01..05, §11A" — an informal pointer, not a versioned contract file as P08-v1/P10-v1 define one. Acceptance behavior cannot be graded. | `verification/` listing; `P19_FROZEN_ACCEPTANCE_CONTRACT.md` absent |
| P1-2 | **The cited number is not the number the scanner produces.** The ledger says "0 direct imports across 672 files"; the scanner itself prints 674 and the directory contains 674 eligible files at this revision. A ledger number that the producing tool does not print is not a reproducible claim. | `vp19.log`; independent re-scan |
| P1-3 | **The P19 verification script was never tracked while P19 was claimed PASS.** `scripts/ssot/p19_dna_verify.js` — the first thing `verify:p19` calls — entered git only in the baseline commit `90f86469`. The command that produced the P19 evidence did not exist in version control. | git log |

## P2 findings

| # | Finding | Evidence |
|---|---|---|
| P2-1 | **The "0 direct imports" figure excludes the two directories where such imports live.** `p19_dna_verify.js` skips any file whose path contains `/components/dna` or `/components/ui`. An unrestricted scan finds **7** files importing `@/components/ui/*` — 5 inside `components/dna/` (`DnaDataTable`, `DnaDialog`, `DnaFieldCompat`, `DnaInteractiveElements`, `DnaTableRowActions`) and 2 inside `components/ui/` (`cascading-address`, `dialog`). No **application** page imports the legacy kit, which is the migration P19 claims — but the absolute figure is a scoped measurement presented as a boundary. | `p19_dna_verify.js` gate 1; independent scan |
| P2-2 | **The P19 flow gives no evidence the migrated pages render.** `check_page_shell_layout.js` classifies pages by regex over source text (`137 "Shell & Header-Card Compliant"`, `138 "Executive Dashboards & Modular Views"`) and the Vitest suite is source-string assertions. Neither renders a migrated page against live data. | `check_page_shell_layout.js`; `p19-dna-system.behavior.test.tsx` |
| P2-3 | **The design canonicity failure is real and unowned.** Three dashboards carry raw `<table>` markup with no card container. These are the only pages the layout audit actually rejects, and nothing in the ledger carries them. | `vp19.log` |
| P2-4 | **Registry generator hardcodes `phase: 'P02'`.** The registry cannot describe P19. | `generate_lifecycle_registry.js` |

## P3 findings

- `verify:p19` composes `p19_dna_verify.js && check_page_shell_layout.js && tsc && test:p19 && build`.
  Step 2 failing means steps 3–5 have never been observed to pass together on this revision.

## Next action

Do not progress. Fix the three detached-table dashboards so `check_page_shell_layout.js` passes,
then re-run the whole `verify:p19` composition to observe steps 3–5 for the first time. Write the
missing `P19_FROZEN_ACCEPTANCE_CONTRACT.md` before P19 can be graded.