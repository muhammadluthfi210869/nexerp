# NEX ERP — Phase Delivery Ledger

Orchestration state for the 23-phase production-readiness programme (P00–P22).
Governed by `_FAST_DELIVERY_EXECUTION_STANDARD.md`; audit method in `_BATCH_VERIFICATION_PLAN.md`.

This file is the orchestrator's durable state. One row per phase, plus the frozen acceptance
pointer and the standing rules learned from executed phases. It is not a certifier, contains no
PASS token, and issues no business authority.

## Status board

| Phase | Name | Status | Acceptance freeze | Evidence |
|---|---|---|---|---|
| P00 | Stop-the-line containment | PASS | pre-ledger | `evidence/P00_STOP_THE_LINE_EVIDENCE.md` |
| P01 | Business certainty and SSOT lock | PASS | pre-ledger | `evidence/P01_BUSINESS_CERTAINTY_SSOT_LOCK_EVIDENCE.md` |
| P02 | Contract-to-code and lifecycle reconciliation | PASS | pre-ledger | `evidence/P02_CONTRACT_TO_CODE_RECONCILIATION_EVIDENCE.md` |
| P03 | Reproducible build, architecture gates, CI | PASS | pre-ledger | `evidence/P03_*` |
| P04 | Canonical database and migration chain | PASS | pre-ledger | `evidence/P04_*` |
| P05 | Platform architecture, maintainability, controls | PASS | pre-ledger | `evidence/P05_*` |
| P06 | Master data and system configuration | PASS | pre-ledger | `evidence/P06_*`, `batches/P06-P06_FINAL_CLOSEOUT_2026-09-20.md` |
| P07 | CRM, marketing, guest book, BusDev | PASS (independently reproduced) | pre-ledger | `batches/P07-P07_BOUNDED_CLOSURE_AUDIT_2026-09-20.md` |
| **P08** | Sample, R&D, formulation, creative, legality | **PASS** for progression (audited `2f8f4366`); not a production/UAT statement — `P08-B6` stays open | `P08_FROZEN_ACCEPTANCE_CONTRACT.md` (`P08-v1`) | executor `batches/P08-P08_FULL_CONFORMANCE_2026-09-21.md`; auditor `batches/P08-P08_FULL_CONFORMANCE_AUDIT_2026-09-21.md` |
| **P09** | Sales, DP, delivery, AR, returns | **PASS** | `BUS-RULE-001` .. `015` | `verify:p09` (30/30 backend e2e, 18/18 frontend behavior, 0 DB residue) |
| **P10** | SCM, MRP, procurement, AP, matching | **PASS** | `BUS-RULE-016` .. `030` | `verify:p10` (23/23 backend e2e, 24/24 frontend behavior, 0 DB residue, tsc clean, next build clean) |
| **P11** | Warehouse and inventory | **PASS** | `BUS-RULE-046` .. `055` | `verify:p11` (27/27 backend e2e, 20/20 frontend behavior, 0 DB residue, tsc clean) |
| **P12** | Production planning and dispatch | **PASS** | `BUS-RULE-031` .. `045` | `verify:p12` (20/20 backend e2e across 6 suites, 18/18 frontend behavior, 0 DB residue, tsc clean) |
| **P13** | Production execution & BMR | **PASS** | P13-v1 (`BUS-RULE-076` .. `090`) | `verify:p13` (28/28 backend e2e across 6 suites, 20/20 frontend behavior, 0 DB residue, dual tsc clean) |
| **P14** | QC, quarantine, release, traceability | **PASS** | P14-v1 (`BUS-RULE-047`, `BUS-RULE-077`, `BUS-RULE-078`) | `verify:p14` (30/30 backend e2e across 6 suites, 6/6 frontend behavior, 0 DB residue, dual tsc clean) |
| **P15** | Finance, costing, accounting, closing & Cumulative Checkpoint | **PASS** | `P15_FROZEN_ACCEPTANCE_CONTRACT.md` (`P15-v1`) | `verify:p15` + `verify:p15:checkpoint` (19/19 backend e2e across 7 suites, 11/11 bridge e2e across 6 suites, 12/12 frontend behavior, 0 DB residue, dual tsc clean); `batches/P15-P15_CUMULATIVE_CHECKPOINT_2026-09-22.md` |
| **P16** | HR, personnel, attendance/payroll scope, KPI | **PASS** | `BUS-RULE-071` .. `075`, `BUS-RULE-115` .. `118` | `verify:p16` (27/27 backend e2e across 6 suites, 6/6 frontend behavior, 0 DB residue) |
| **P17** | Documents, communication, integrations, automation | **PASS** | `P17-v1` (AC-P17-01..07, `BUS-RULE-092`, `093`, `101`) | `verify:p17` (27/27 backend e2e across 5 suites, 4/4 frontend behavior, 0 DB residue, dual tsc clean) |
| **P18** | Reporting, executive analytics, KPI governance | **PASS** | `P18-v1` (`BUS-RULE-070`, `BUS-RULE-105`, AC-P18-01..05) | `verify:p18` (22/22 backend e2e across 5 suites, 4/4 frontend behavior, 0 DB residue, dual tsc clean) |
| **P19** | Strict DNA migration, UI/UX polish, a11y | **PASS** | AC-P19-01..05, §11A | `verify:p19` (0 direct `@/components/ui/` imports across 672 files, 32 Dual-DNA exports, 10/10 Vitest, tsc clean, Next.js build clean) |
| P20 | System-wide verification, maintainability, resilience | NOT_STARTED | — | — |
| P21 | Migration, change delivery, ops, cutover, DR rehearsal | NOT_STARTED | — | — |
| P22 | Independent pre-UAT readiness review | NOT_STARTED | — | — |

Rows P00–P07 predate this ledger; their delivery metrics were not captured in this column format.
Do not reconstruct them retroactively and do not rerun their certifiers.

## Delivery metrics

| Phase | Risk | Implementation | Focused verify | First pass | Corrections | Escaped P0/P1 | Deferred P2/P3 | Over-budget commands |
|---|---|---|---|---|---|---|---|---|
| P08 | HIGH | ~78 min executor across 3 cycles | 3 independent `verify:p08` runs | **FAIL** | **3** (closure + C6 + C7) — exceeded the 1-cycle norm | **2** (audit): placeholder artwork on the legality review surface; fabricated business content on 3 P08 surfaces | 4 (see below) | 0 (all suites under their 120s/240s targets; `verify:p08` ~3.5 min vs 5–10 min) |
| P09 | HIGH | Fast-Delivery One-Pass (Backend 30 E2Es, 6 Live UI Surfaces) | `verify:p09` (Golden Thread + Live Behavior + Clean DB) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P10 | HIGH | Fast-Delivery One-Pass (Backend 23 E2Es, 8 Live UI Surfaces) | `verify:p10` (All suites + Live Behavior + Clean DB + tsc) | **PASS** | 1 (Typecheck & Next Build closure) | 0 | 0 | 0 (under execution budgets) |
| P11 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 7 Live UI Surfaces) | `verify:p11` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P12 | HIGH | Fast-Delivery One-Pass (Backend 20 E2Es, 5 Live UI Surfaces) | `verify:p12` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P13 | HIGH | Fast-Delivery One-Pass (Backend 28 E2Es, 6 Live UI Surfaces) | `verify:p13` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P14 | HIGH | Fast-Delivery One-Pass (Backend 30 E2Es, 2 Live UI Surfaces) | `verify:p14` (All 6 backend suites + Live Behavior + Clean DB + dual tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P15 | HIGH | Fast-Delivery One-Pass (Backend 19 E2Es, 6 Bridges 11 E2Es, 8 Live UI Surfaces) | `verify:p15` + `verify:p15:checkpoint` (All 7 backend suites + 6 Bridges + Live Behavior + Clean DB + dual tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P16 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 4 Live UI Surfaces) | `verify:p16` (All 6 backend suites + Live Behavior + Clean DB) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P17 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 4 Live UI Surfaces) | `verify:p17` (All 5 backend suites + Live Behavior + Clean DB + dual tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |
| P18 | HIGH | Fast-Delivery One-Pass (Backend 22 E2Es, 3 Live UI Surfaces) | `verify:p18` (All 5 backend suites + Live Behavior + Clean DB + dual tsc) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets: ~170s vs 300s target) |
| P19 | MEDIUM | Fast-Delivery One-Pass (77 files migrated to `@/components/dna`, Dual-DNA parity) | `verify:p19` (Boundary AST scan + Dual-DNA Vitest + tsc + Next build) | **PASS** | 0 | 0 | 0 | 0 (under execution budgets) |

## P08 deferred backlog (non-blocking, owned)

| ID | Item | Path | Class |
|---|---|---|---|
| P08-B1 | `creative/board` keeps a `|| 'http://localhost:3002'` API fallback and is absent from `lint:p08`'s frozen file list | `frontend/src/app/(dashboard)/creative/board/` | P2 — coverage |
| P08-B2 | `lint:p08` covers 7 files while P08 touched ~13 surfaces; two cycle-2 files are outside it | `frontend/package.json` | P2 — coverage |
| P08-B3 | `ARTWORK_NOT_ON_FILE` is used by a P08 refusal but has no contract home, no `BUS-*` rule row, no traceability entry | `backend/src/modules/legality/legality.service.ts:29` | P2 — provenance |
| P08-B4 | The evidence batch's closure table still reads "not changed — out of P08 scope" for `penjualan/sample-fee`, contradicting its own cycle-2 section | `batches/P08-P08_FULL_CONFORMANCE_2026-09-21.md` | P3 — record consistency |
| P08-B5 | `SampleFee` declares no relation to a customer master, so the screen shows a raw `customerId` UUID | `frontend/src/app/(dashboard)/penjualan/sample-fee/page.tsx` | P2 — data model |
| P08-B6 | Cross-tenant refusal on the P08 write path is unprovable: P08 tables carry no `organizationId` (`DEC-2026-09-20-059`, LOCKED) | P08 schema | P1-adjacent, owner-owned decision — close before production/UAT |

## Standing rules for P09 onward

Learned from P08's three correction cycles. These are binding on every acceptance freeze I write.

1. **Name the surfaces.** "Primary UI" must be an explicit list of paths in the freeze. P08's
   Acceptance 5 said "the primary UI" without enumerating it, and three separate executors graded
   real violations down to backlog on pages they judged peripheral. Two of the three P08 P1s came
   from that single ambiguity.
2. **Test the class, not the instance.** Every acceptance about fabricated or static content must
   ship a *definition* — what is in class (rendered data, status, claim, verdict, count, metric)
   and what is not (breadcrumbs, tabs, select options, state-transition maps, input placeholder
   attributes) — plus a sweep mandate over the named surfaces. P08's first closure fixed two
   instances on pages it was already editing and missed three elsewhere.
3. **Put a typecheck in `verify:pXX`.** `ts-jest` runs with `diagnostics: false` and the backend
   build uses SWC, which strips types without checking. No step in P08's frozen composition could
   detect a type error in a test file; one survived two revisions. Add an explicit
   `tsc --noEmit` step for both packages to the frozen composition of P09 onward.
4. **Do not trust IDE diagnostics in this repo.** They lag disk state by whole edits. During P08
   audit they reported deleted files as present, fixed errors as live, and a committed file as
   syntactically broken. Verify with real commands, always.
5. **`grep -c 'it('` is not a test count.** It matches `submit(`, `split(`, `init(`. Use
   `grep -cE '^\s*(it|test)(\.each)?\('`. This produced one false audit finding in P08.
6. **A shared-platform edit inside a phase needs the affected predecessor smoke.** P08 changed
   `backend/src/platform/errors/error.filter.ts`, altering error-code precedence for 19 files and
   43 `reason_code` sites, and ran no cross-phase smoke. The auditor had to run
   `test:p07:http-closure` to close the evidence gap. When a phase touches platform code, the
   freeze names the predecessor smoke explicitly.
7. **Correction cycles are a scope signal, not an executor signal.** P08's three cycles each
   traced to acceptance wording, not to executor carelessness — the executor disclosed every
   finding honestly, including the ones it graded wrong. When a phase exceeds one cycle, inspect
   the freeze before blaming the executor.
