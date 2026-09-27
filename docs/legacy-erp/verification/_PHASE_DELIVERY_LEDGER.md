# NEX ERP — Phase Delivery Ledger

Orchestration state for the 23-phase production-readiness programme (P00–P22).
Governed by `_FAST_DELIVERY_EXECUTION_STANDARD.md`; audit method in `_BATCH_VERIFICATION_PLAN.md`.

This file is the orchestrator's durable state. One row per phase, plus the frozen acceptance
pointer and the standing rules learned from executed phases. It is not a certifier, contains no
PASS token, and issues no business authority.

## 2026-09-24 Fase 1 Build Stabilization & Re-Verification

On 2026-09-24, execution of **Fase 1 (Pembersihan Bangkai & Stabilisasi Build)** from `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md` was completed.
All TypeScript errors were resolved (0 `tsc` errors), foreign key bugs in P13/P14 were fixed, acceptance contracts `P09_FROZEN_ACCEPTANCE_CONTRACT.md` (`P09-v1`) and `P19_FROZEN_ACCEPTANCE_CONTRACT.md` (`P19-v1`) were formally established, and `package.json` verify scripts were standardized to include dual `tsc` checks.
**All 11 commands `verify:p09` … `verify:p19` exit with code 0.**
Formal QA Gate report: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md`.

## 2026-09-25 Fase 2 — elimination of mock & FE↔BE plumbing (IN PROGRESS)

Execution of **Fase 2 (Eliminasi Mock & Plumbing Frontend-Backend)** from
`docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md`. Its charter claimed *"245 file UI berisi data
statis"*; the fabrication scan disproved that number — real fabrication is **6 files**.

**Corrected** (each with a reproduction test that failed first, per CLAUDE.md QA GATE):

| Surface | Defect | Guard |
|---|---|---|
| `finance/piutang` | AR Hub rendered `STATIC_SALES_INVOICES` / `STATIC_SAMPLE_INVOICES` with no fetch at all | `piutang-ar-hub-fabrication.test.tsx` |
| `samples/npf` | `MOCK_NPFS` returned whenever the live query yielded nothing — including on request failure | `npf-fabrication.test.tsx` |
| `finance/jurnal` | Auto Journal labelled COA mappings from a hardcoded `STATIC_COA` literal, not the live COA; KPI read a non-existent `metrics.totalTransactions` | `jurnal-static-coa-fabrication.test.tsx` (4/4) |
| `quality/checklist-category` | `STATIC_CATEGORIES` (8 invented rows) reached the screen on failure, on empty, **and** via fabricated in-mapping defaults on success; 4 KPI tiles were literals | `checklist-category-fabrication.test.tsx` (5/5) |
| `quality/checklist` | Three seed literals + a bare `catch {}` + invented SO identity in a successful mapping; category writes had no backend route | `checklist-hub-fabrication.test.tsx` (7/7) |

**Not corrected, and why (honest):** `penjualan/crm-leads` (`INITIAL_BATCHES`) and
`penjualan/sales-target` (`INITIAL_TARGETS`) are fabricated, but their backend does not exist:
`SalesTarget` / `LeadBatch` / `LeadAllocation` have **zero** matches anywhere in `backend/`
(schema or modules). Removing the literals yields a permanently empty page; wiring them
requires a new Prisma model + NestJS module + contract. That is outside Fase 2's charter
("connect CUD forms to *existing* REST") and outside the plan's scope.

**Ledger status board is NOT updated by this section.** The P09–P19 rows above still record
the 2026-09-24 Fase 1 re-verification at its own tree state. Fase 2 changed `finance/*`,
`samples/*` and `quality/*`, so `verify:p08` / `p14` / `p15` / `p19` were re-measured on the
new tree and re-recorded in `docs/qa-gate/2026-09-25-fase2-eliminasi-mock-plumbing.md` §8.
**G5 (live E2E on the server) and G6 (a real CI run) remain unexecuted** — the plan's gate
ladder is therefore incomplete and the verdict stays **BELUM SIAP KIRIM**.

## 2026-09-23 independent audit correction

On 2026-09-23 every phase **P09–P19 was independently re-run** at the frozen revision
`90f86469` (tag `audit-baseline-p09-p19`) by an auditor that modified no source file. **All
eleven `verify:pNN` commands exit non-zero.** The `PASS` rows these phases previously carried
were not reproducible and have been replaced with the audited verdicts below.

| Batch | Verdict | Report |
|---|---|---|
| P09–P13 | **FAIL** | `evidence/batches/P09-P13_BATCH_VERIFICATION_2026-09-23.md` |
| P14–P18 | **FAIL** | `evidence/batches/P14-P18_BATCH_VERIFICATION_2026-09-23.md` |
| P19 | **FAIL** | `evidence/batches/P19-P19_BATCH_VERIFICATION_2026-09-23.md` |
| QA gate record | — | `docs/qa-gate/2026-09-23-audit-p09-p19.md` |

**P09 and P19 have no `_FROZEN_ACCEPTANCE_CONTRACT.md`** — their contract layer is
`NOT_VERIFIED` independently of any command result. What the audit *confirmed* as genuinely
passing is recorded in each batch report; the audit separates "suite passes" from
"frozen composition passes" from "canonical contract reconciled", and only the first is true
for most of these phases.

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
| **P09** | Sales, DP, delivery, AR, returns | **PASS** (re-verified 2026-09-24) | `P09_FROZEN_ACCEPTANCE_CONTRACT.md` (`P09-v1`) | `verify:p09` **exit 0** (Dual tsc clean; backend golden thread 7/7; frontend 18/18; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P10** | SCM, MRP, procurement, AP, matching | **PASS** (re-verified 2026-09-24) | `P10_FROZEN_ACCEPTANCE_CONTRACT.md` (`P10-v1`) | `verify:p10` **exit 0** (Dual tsc clean; backend 23/23; frontend 24/24; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P11** | Warehouse and inventory | **PASS** (re-verified 2026-09-24) | `P11_FROZEN_ACCEPTANCE_CONTRACT.md` (`P11-v1`) | `verify:p11` **exit 0** (Dual tsc clean; backend 27/27; frontend 20/20; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P12** | Production planning and dispatch | **PASS** (re-verified 2026-09-24) | `P12_FROZEN_ACCEPTANCE_CONTRACT.md` (`P12-v1`) | `verify:p12` **exit 0** (Dual tsc clean; backend 20/20; frontend 18/18; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P13** | Production execution & BMR | **PASS** (re-verified 2026-09-24) | P13-v1 (`BUS-RULE-076` .. `090`) | `verify:p13` **exit 0** (Dual tsc clean; backend 28/28; frontend 20/20; clean-db 0 residue). FK bug relaxed via migration. QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P14** | QC, quarantine, release, traceability | **PASS** (re-verified 2026-09-24) | P14-v1 (`BUS-RULE-047`, `BUS-RULE-077`, `BUS-RULE-078`) | `verify:p14` **exit 0** (Dual tsc clean; backend 30/30; frontend 6/6; clean-db 0 residue). FK bug relaxed via migration. QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P15** | Finance, costing, accounting, closing & Cumulative Checkpoint | **PASS** (re-verified 2026-09-24) | `P15_FROZEN_ACCEPTANCE_CONTRACT.md` (`P15-v1`) | `verify:p15` **exit 0** (Dual tsc clean; backend 19/19; frontend 12/12; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P16** | HR, personnel, attendance/payroll scope, KPI | **PASS** (re-verified 2026-09-24) | `P16_FROZEN_ACCEPTANCE_CONTRACT.md` (`P16-v1`) | `verify:p16` **exit 0** (Dual tsc clean; backend 27/27; frontend 6/6; clean-db 0 residue). Script updated with tsc step. QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P17** | Documents, communication, integrations, automation | **PASS** (re-verified 2026-09-24) | `P17-v1` (AC-P17-01..07, `BUS-RULE-092`, `093`, `101`) | `verify:p17` **exit 0** (Dual tsc clean; backend 27/27; frontend 4/4; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P18** | Reporting, executive analytics, KPI governance | **PASS** (re-verified 2026-09-24) | `P18-v1` (`BUS-RULE-070`, `BUS-RULE-105`, AC-P18-01..05) | `verify:p18` **exit 0** (Dual tsc clean; backend 22/22; frontend 4/4; clean-db 0 residue). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| **P19** | Strict DNA migration, UI/UX polish, a11y | **PASS** (re-verified 2026-09-24) | `P19_FROZEN_ACCEPTANCE_CONTRACT.md` (`P19-v1`) | `verify:p19` **exit 0** (AST scan clean; shell audit clean; vitest 11/11; Next build 265 static pages). QA gate: `docs/qa-gate/2026-09-24-fase1-build-stabilization.md` |
| P20 | System-wide verification, maintainability, resilience | NOT_STARTED | — | — |
| P21 | Migration, change delivery, ops, cutover, DR rehearsal | NOT_STARTED | — | — |
| P22 | Independent pre-UAT readiness review | NOT_STARTED | — | — |

Rows P00–P07 predate this ledger; their delivery metrics were not captured in this column format.
Do not reconstruct them retroactively and do not rerun their certifiers.

## Delivery metrics

| Phase | Risk | Implementation | Focused verify | First pass | Corrections | Escaped P0/P1 | Deferred P2/P3 | Over-budget commands |
|---|---|---|---|---|---|---|---|---|
| P08 | HIGH | ~78 min executor across 3 cycles | 3 independent `verify:p08` runs | **FAIL** | **3** (closure + C6 + C7) — exceeded the 1-cycle norm | **2** (audit): placeholder artwork on the legality review surface; fabricated business content on 3 P08 surfaces | 4 (see below) | 0 (all suites under their 120s/240s targets; `verify:p08` ~3.5 min vs 5–10 min) |
| P09 | HIGH | Fast-Delivery One-Pass (Backend 30 E2Es, 6 Live UI Surfaces) | `verify:p09` (Golden Thread + Live Behavior + Clean DB) | **FAIL** (audited `90f86469`) | not observed — self-reported 0, unreproducible | **1** (frontend 17/18: `DnaBadge is not defined` on `penjualan/bayar-penjualan`) | see batch report | not measured by audit |
| P10 | HIGH | Fast-Delivery One-Pass (Backend 23 E2Es, 8 Live UI Surfaces) | `verify:p10` (All suites + Live Behavior + Clean DB + tsc) | **FAIL** (audited `90f86469`) | not observed | **1** (89 `error TS` in the frozen tsc step) | see batch report | not measured by audit |
| P11 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 7 Live UI Surfaces) | `verify:p11` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **FAIL** (audited `90f86469`) | not observed | **1** (89 `error TS`) | see batch report | not measured by audit |
| P12 | HIGH | Fast-Delivery One-Pass (Backend 20 E2Es, 5 Live UI Surfaces) | `verify:p12` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **FAIL** (audited `90f86469`) | not observed | **1** (89 `error TS`) | see batch report | not measured by audit |
| P13 | HIGH | Fast-Delivery One-Pass (Backend 28 E2Es, 6 Live UI Surfaces) | `verify:p13` (All 6 backend suites + Live Behavior + Clean DB + tsc) | **FAIL** (audited `90f86469`) | not observed | **2** (backend 20/28; unreachable `qc_audits_stepLogId_fkey`) | see batch report | not measured by audit |
| P14 | HIGH | Fast-Delivery One-Pass (Backend 30 E2Es, 2 Live UI Surfaces) | `verify:p14` (All 6 backend suites + Live Behavior + Clean DB + dual tsc) | **FAIL** (audited `90f86469`) | not observed | **2** (backend 29/30 `finished_goods_woId_fkey`; frontend 4/6) | see batch report | not measured by audit |
| P15 | HIGH | Fast-Delivery One-Pass (Backend 19 E2Es, 6 Bridges 11 E2Es, 8 Live UI Surfaces) | `verify:p15` + `verify:p15:checkpoint` (All 7 backend suites + 6 Bridges + Live Behavior + Clean DB + dual tsc) | **FAIL** (audited `90f86469`) — suite layer is clean | not observed | **1** (89 `error TS` in the frozen tsc step) | see batch report | not measured by audit |
| P16 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 4 Live UI Surfaces) | `verify:p16` (All 6 backend suites + Live Behavior + Clean DB) | **FAIL** (audited `90f86469`) | not observed | **2** (frontend 1/6; no typecheck step in composition) | see batch report | not measured by audit |
| P17 | HIGH | Fast-Delivery One-Pass (Backend 27 E2Es, 4 Live UI Surfaces) | `verify:p17` (All 5 backend suites + Live Behavior + Clean DB + dual tsc) | **FAIL** (audited `90f86469`) | not observed | **1** (89 `error TS`) | see batch report | not measured by audit |
| P18 | HIGH | Fast-Delivery One-Pass (Backend 22 E2Es, 3 Live UI Surfaces) | `verify:p18` (All 5 backend suites + Live Behavior + Clean DB + dual tsc) | **FAIL** (audited `90f86469`) | not observed | **1** (91 `error TS`) | see batch report | not measured by audit |
| P19 | MEDIUM | Fast-Delivery One-Pass (77 files migrated to `@/components/dna`, Dual-DNA parity) | `verify:p19` (Boundary AST scan + Dual-DNA Vitest + tsc + Next build) | **FAIL** (audited `90f86469`) | not observed | **2** (step-2 layout gate fails 3 dashboards; no frozen contract) | see batch report | not measured by audit |

P09–P19 audit figures: the columns above reflect the independent re-run at `90f86469`, not the
executor's original self-report. `First pass`, `Corrections`, `Deferred P2/P3` and `Over-budget
commands` were never independently measured and are marked so rather than reconstructed.

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
