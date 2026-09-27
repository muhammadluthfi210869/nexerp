# P15 Frozen Acceptance Contract

**Phase:** P15 — Finance, Costing, Accounting, and Closing  
**Contract version:** `P15-v1`, frozen 2026-09-22  
**Final verification command:** `npm run verify:p15`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, affected typecheck and database cleanup checks pass  

## Purpose and finish line

P15 is complete when one real, tenant-safe production operational-to-finance reconciliation golden thread proves:

`Inbound Goods Receipt (BUS-RULE-046, BUS-RULE-027) updates Moving Weighted Average Cost (MAP) in valuation history → Batch Production rolls up material + packaging into Finished Goods HPP (BUS-RULE-042) → QC Scrap Dispositions log Cost of Poor Quality (COPQ BUS-RULE-077) into GL expense accounts → Sales Invoicing & Vendor Bills post balanced double-entry journals exactly once (BUS-RULE-056, BUS-RULE-057) → Direct manual entries to control accounts (AR, AP, Inventory) are strictly blocked (BUS-RULE-068) → Cash & Bank In/Out disbursements post balanced entries, DownPayment Legalitas routes strictly to Client Escrow liability without touching P&L revenue (BUS-RULE-060, BUS-RULE-061), and Fund Requests enforce Segregation of Duties maker-checker → Financial Period Closing checklist enforces Hard Lock (BUS-RULE-064) blocking normal operational postings while permitting audited Adjustment Journals with Manager approval and exact counter-entry Reversals → Subledgers (AR Aging with 4 buckets BUS-RULE-058 & AP Aging with H-3/H-7 color tags BUS-RULE-059) reconcile with General Ledger → Financial Statements balance (Trial Balance Dr = Cr, Balance Sheet Assets = Liabilities + Equity, and Profit & Loss enforces card order BUS-RULE-070)`

and the transactions produce immutable audit logs, balanced double-entry lines, zero static array mocks in the UI, and zero residue rows under concurrent load.

## Frozen scope

In scope:
- **Double-Entry Core Invariant & Auto-Journal Protection (`BUS-RULE-056`, `BUS-RULE-057`, `BUS-RULE-068`)**:
  - Every journal entry (manual or automated) strictly balances ($\sum \text{Debit} = \sum \text{Credit}$). Unbalanced drafts are rejected with `JOURNAL_UNBALANCED`.
  - Control accounts (AR, AP, Inventory, WIP) default to `allowManualJournal = false`. Direct manual journals to control accounts are rejected with `MANUAL_JOURNAL_BLOCKED`.
  - Operational documents (Sales Invoices, Vendor Bills, Cash In/Out) generate balanced journals automatically via configured CoA rules.
- **Inventory Valuation, Job Costing & COPQ Loss (`BUS-RULE-027`, `BUS-RULE-042`, `BUS-RULE-077`)**:
  - Moving Weighted Average Price (MAP) recalculates atomically on inbound material receipts.
  - Finished goods costing: batch production aggregates consumed raw material, packaging, and standard overhead into unit HPP.
  - Quality scrap/reject executions generate Cost of Poor Quality (COPQ) expense/loss journal entries.
- **Cash & Bank, Client Escrow & Maker-Checker Fund Requests (`BUS-RULE-060`, `BUS-RULE-061`, `BUS-RULE-062`, `BUS-RULE-063`)**:
  - Cash In / Cash Out operations generate balanced double-entry lines.
  - DownPayment with category `LEGALITAS` routes strictly to Client Escrow Deposit (Liability account `21200`), never touching revenue or expense P&L.
  - Multi-tier Fund Requests enforce Segregation of Duties maker-checker: requester cannot approve or disburse their own request.
  - Tax computation: 11% PPN Masukan auto-calculated for PKP vendors, integer IDR currency rounding.
- **Period Closing, Hard-Lock & Counter-Entry Reversals (`BUS-RULE-064`)**:
  - Monthly period closing checklist.
  - Hard-locked periods strictly reject normal postings (`PERIOD_HARD_LOCKED`).
  - Adjustment Journals for locked periods require Finance Manager / Director approval.
  - Reversal of a posted journal entry creates an exact balanced counter-entry.
- **Subledgers, Financial Statements & DNA UI Surfaces (`BUS-RULE-058`, `BUS-RULE-059`, `BUS-RULE-069`, `BUS-RULE-070`)**:
  - Subledger reconciliation: AR Aging (4 buckets: 0-30, 31-60, 61-90, >90 days) and AP Aging (H-7 warning/yellow, H-3 urgent/red, Overdue pulse) match GL balances.
  - Financial statements: Trial Balance ($\sum \text{Dr} = \sum \text{Cr}$), Balance Sheet ($\text{Assets} = \text{Liabilities} + \text{Equity}$), and Profit & Loss (Total Pendapatan $\rightarrow$ Total Beban HPP $\rightarrow$ Laba Operasional Bersih).
  - Named finance surfaces (`/finance/dashboard`, `/finance/ap-aging`, `/finance/cash-in`, `/finance/cash-out`, `/finance/client-escrow`, `/finance/closing`, `/finance/fund-requests`, `/finance/assets`, `/finance/cogs-request`), eliminating all static mock arrays (`FALLBACK_*`, `MOCK_*`) and using `@/components/dna`.

Out of scope:
- HR payroll disbursement, attendance tracking, and staff contracts (P16);
- WhatsApp / Email automated notifications and webhooks (P17);
- Executive BI cross-domain dashboards and external board reports (P18).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P15-01` | **Double-Entry Invariant & Auto-Journal Protection:** Every journal entry strictly balances. Unbalanced entries are rejected with 400 (`JOURNAL_UNBALANCED`). Manual journals to control accounts are rejected (`MANUAL_JOURNAL_BLOCKED`). Operational postings automatically produce balanced journals. |
| `AC-P15-02` | **Inventory Valuation, Job Costing & COPQ:** Approved inbound receipt recalculates material MAP atomically. Batch production rolls up consumption into Finished Goods HPP. QC scrap dispositions post COPQ expense entries to GL. |
| `AC-P15-03` | **Cash/Bank, Client Escrow & Maker-Checker Fund Requests:** Cash transactions generate balanced journals. DP Legalitas posts to Client Escrow liability without touching P&L revenue. Fund request enforces multi-tier maker-checker (requester cannot approve/disburse their own request). |
| `AC-P15-04` | **Period Closing, Hard-Lock & Counter-Entry Reversal:** Closed accounting period enforces hard-lock (rejection of normal operational/journal postings). Adjustments to locked periods succeed only via Adjustment Journal with manager approval. Reversing a posted journal generates an exact counter-entry. |
| `AC-P15-05` | **Subledgers, Financial Statements & DNA UI Surfaces:** AP Aging (H-3/H-7 color tags) and AR Aging (4 buckets) reconcile to GL control balances. Trial Balance balances ($\text{Dr} = \text{Cr}$). Balance Sheet balances ($\text{Assets} = \text{Liabilities} + \text{Equity}$). Profit & Loss renders required card order. Named finance UI surfaces fetch live API data, handle loading/empty/error states with `@/components/dna`, and contain zero static mock arrays. |
| `AC-P15-06` | **Thin Final Verification & Clean DB:** `npm run verify:p15` runs all focused backend suites, frontend live UI behavior suite, real DB golden thread, dual typechecks, and DB cleanup checks with natural exit `0`, leaving 0 residue rows in PostgreSQL. |

## Provenance table

| Behavior | Primary label | Exact source / Evidence | Verified boundary | Unresolved choice |
|---|---|---|---|---|
| Double-Entry Invariant | Debit = Kredit | `contracts/04_BUSINESS_RULES.md` `BUS-RULE-056` | sum(Dr) == sum(Cr), unbalanced blocked | None |
| Auto-Journal Posting | Locked Auto Posting | `BUS-RULE-057`, `NEX_FINANCE_FINAL_SPEC §0.5` | Invoices, Bills, Cash auto-post to GL | None |
| Control Account Guard | Manual Journal Block | `BUS-RULE-068`, `NEX_FINANCE_FINAL_SPEC §1.1` | allowManualJournal=false blocks manual entries | None |
| AR Aging Buckets | 4 AR Buckets | `BUS-RULE-058`, `NEX_FINANCE_FINAL_SPEC §3.6` | 0-30, 31-60, 61-90, >90 days | None |
| AP Aging Triggers | H-3 / H-7 AP Coding | `BUS-RULE-059`, `REQUIREMENT.md Poin 10` | H-7 yellow, H-3 red, Overdue pulse | None |
| Client Escrow Routing | Escrow Liability | `BUS-RULE-060`, `BUS-RULE-061` | DP Legalitas $\rightarrow$ Escrow; 0 revenue impact | None |
| Currency IDR Integer | Integer Rupiah | `BUS-RULE-062`, `DEC-028` | Whole numbers only, no decimal subunits | None |
| PPN Masukan PKP | Auto PPN Masukan | `BUS-RULE-063`, `REQUIREMENT.md Poin 3` | 11% PPN computed for PKP vendors | None |
| Period Lock Rules | Soft & Hard Lock | `BUS-RULE-064`, `NEX_FINANCE_FINAL_SPEC §9.1` | Hard-lock rejects normal entries | None |
| P&L Card Order | Statement Card Order | `BUS-RULE-070`, `REQUIREMENT.md Poin 32` | Pendapatan $\rightarrow$ HPP $\rightarrow$ Laba Ops | None |
| Inventory Valuation | Moving Average Price | `BUS-RULE-042`, `DECISION_REQUIRED-002` | Real-time MAP on inbound receipts | None |
| Scrap COPQ Expense | Cost of Poor Quality | `BUS-RULE-077`, `raw/quality_control.md` | Scrap logged to COPQ expense in GL | None |

## Verification composition

The frozen verification command `npm run verify:p15` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p15:double-entry-auto-journal` (Double-entry core & auto-journal)
3. `npm --prefix backend run test:p15:valuation-cogs` (Inventory MAP, production costing & COPQ)
4. `npm --prefix backend run test:p15:cash-escrow-funds` (Cash & bank, escrow liability & SOD fund requests)
5. `npm --prefix backend run test:p15:period-lock-reversal` (Period closing, hard-lock & reversal)
6. `npm --prefix backend run test:p15:subledgers-statements` (AR/AP aging, subledgers & financial statements)
7. `npm --prefix backend run test:p15:golden-thread` (Operational-to-finance reconciliation golden thread)
8. `npm --prefix frontend run test:p15` (Frontend live finance UI behavior suite)
9. `npm run verify:p15:clean-db` (Residue check ensuring 0 `nex_p15_*` rows in PostgreSQL)
