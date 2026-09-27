# P18 Frozen Acceptance Contract

**Phase:** P18 — Reporting, Executive Analytics, and KPI Governance  
**Contract version:** `P18-v1`, frozen 2026-09-22  
**Final verification command:** `npm run verify:p18`  
**Success:** natural exit `0`; all focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, dual typechecks, and database cleanup checks pass  

## Purpose and finish line

P18 is complete when one real, tenant-safe production Reporting, Executive Analytics, and KPI Governance golden thread proves:

`Financial Transactions (Sales Invoices, Payments, Journal Entries, Expenses) + Warehouse Movements (Stock, Valuations, Mutations) → Canonical Financial Reports Reconciled to Source (Profit & Loss with BUS-RULE-070 Card Order, Balanced Balance Sheet Assets = Liabilities + Equity, Balanced Trial Balance Debits = Credits, General Ledger per Account, Cash Flow, AR/AP Aging with BUS-RULE-059 Color Coding) → Operational & Commercial Reports (Stock by Warehouse & Category with BUS-RULE-053 Bagus/Reject/Free Pillars, FIFO/Average Stock Valuation, Goods Mutation In/Out/Adj, Sales Summary by Grouping BUS-RULE-069, Customer Follow-up & Guest Book) → Executive Analytics & 13 Canonical Dashboards (/dashboards/executive, finance, busdev, production, warehouse, qc, rnd, marketing, hr, legality, notifications, procurement, system-errors with Cache Freshness SLA) → KPI Governance Registry (Every Published Metric has Declared Owner, Formula, Grain, Source, Target, Direction; Event-Driven Attribution strictly rejecting manual HR scores PERFORMANCE_MANUAL_BLOCKED; Dual-Role Weights totaling exactly 100% BUS-RULE-074; Zero Denominator Null Safety BUS-RULE-106) → 100% Zero-Mock Live DNA Frontend Screens with Export Parity (CSV/PDF) and Graceful Error Handling (BUS-RULE-105)`

and the transactions produce immutable audit records, maintain strict tenant isolation, render 100% live data in all named P18 surfaces without static array mocks, and leave zero residue rows in PostgreSQL.

## Frozen scope

In scope:
- **Canonical Financial Reports Engine (`05_API_CONTRACT.yaml`, `BUS-RULE-059`, `BUS-RULE-070`)**:
  - `/reports/profit-loss`: Revenue, COGS, Gross Profit, Operating Expenses, Operating Income, Other Income/Expenses, Net Income, period comparison, and card order enforcement per `BUS-RULE-070`.
  - `/reports/balance-sheet`: Asset == Liability + Equity balancing enforcement.
  - `/reports/trial-balance`: Debit == Credit balancing enforcement.
  - `/reports/general-ledger`: Journal entries per COA with opening, movements, and ending balance.
  - `/reports/cash-flow`: Operating, Investing, and Financing cash movements.
  - `/reports/ar-aging` & `/reports/ap-aging`: Overdue categorization with H-3 (red), H-7 (yellow), >tempo (bold/pulse animation) buckets per `BUS-RULE-059`.
  - `/reports/budget-vs-actual`, `/reports/cost-variance`, `/reports/product-profitability`.
- **Operational, Warehouse & Commercial Reports Engine (`BUS-RULE-053`, `BUS-RULE-069`)**:
  - `/reports/stock`: Warehouse & category breakdown with Bagus/Reject/Free status pillars.
  - `/reports/stock-valuation`: Inventory valuation via FIFO and AVERAGE methods.
  - `/reports/mutation-goods`: Period movements: Opening + In - Out $\pm$ Adjustments = Closing.
  - `/reports/sales-summary`: Aggregation by customer, goods, owner, and month.
  - `/reports/follow-up-customer` & `/reports/guest-book`.
  - `/reports/goods-receipts`: Operational receipt generation status.
- **Cross-Domain Executive Analytics & 13 Canonical Dashboards**:
  - 13 canonical dashboard endpoints: `/dashboards/executive`, `/dashboards/finance`, `/dashboards/busdev`, `/dashboards/production`, `/dashboards/warehouse`, `/dashboards/qc`, `/dashboards/rnd`, `/dashboards/marketing`, `/dashboards/hr`, `/dashboards/legality`, `/dashboards/notifications`, `/dashboards/procurement`, `/dashboards/system-errors`.
  - Performance-optimized queries, tenant isolation, and cache freshness SLA headers (`X-Cache-Freshness`, `Cache-Control`).
- **KPI Governance Registry & Event-Driven Engine (`BUS-RULE-072`, `BUS-RULE-074`, `BUS-RULE-106`)**:
  - KPI Metric Catalog declaring Owner Role, Formula Expression, Grain, Source Entities, Target, and Direction.
  - Event-driven recomputation from transactional evidence; manual score injections strictly blocked (`PERFORMANCE_MANUAL_BLOCKED` - HTTP 400).
  - Multi-role active weights validation summing to exactly 100% (`KPI_ROLE_WEIGHT_INVALID`).
  - Zero-denominator null safety ($0 \to \text{null/N/A}$).
- **Named Live DNA UI Surfaces & Export Parity (100% Zero Mock, `BUS-RULE-105`)**:
  - Clean up all fallback arrays and hardcoded values (`FALLBACK_BALANCE_SHEET`, etc.).
  - Named Live DNA UI Surfaces:
    - `/reports/balance-sheet`
    - `/reports/finance-reports`
    - `/reports/ar-aging`
    - `/reports/stock-valuation`
    - `/reports/sales-summary`
    - `/reports/mutation-goods`
    - `/executive/dashboard`
  - Export parity: CSV/Excel and PDF generation matching on-screen transactional figures.

Out of scope:
- Product-wide WCAG AA accessibility certification & universal UI DNA migration (P19);
- Global disaster recovery rehearsal & failover (P21);
- Independent pre-UAT external review (P22).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P18-01` | **Financial Reports Reconciliation:** `/reports/profit-loss`, `/reports/balance-sheet`, `/reports/trial-balance`, `/reports/general-ledger`, and `/reports/cash-flow` reconcile directly to journal entries and subledgers; Balance Sheet satisfies Assets == Liabilities + Equity; Trial Balance satisfies Debits == Credits. |
| `AC-P18-02` | **Operational & Inventory Parity:** `/reports/stock`, `/reports/stock-valuation`, and `/reports/mutation-goods` verify the 3 pillars (Bagus/Reject/Free per `BUS-RULE-053`) and calculate mutations (Opening + In - Out $\pm$ Adj = Closing) correctly per warehouse. |
| `AC-P18-03` | **Aging & Commercial Reporting Rules:** `/reports/ar-aging` and `/reports/ap-aging` group overdue aging into H-3, H-7, >tempo buckets with `BUS-RULE-059` rules. Profit & Loss card ordering follows Revenue $\to$ COGS $\to$ Operating Profit per `BUS-RULE-070`. |
| `AC-P18-04` | **Executive Analytics & Cross-Domain Dashboards:** All 13 canonical `/dashboards/*` endpoints provide tenant-isolated metric rollups with valid cache freshness metadata. |
| `AC-P18-05` | **KPI Governance & Event Replay:** KPI catalog declares Owner, Formula, Grain, Source, Target, Direction. Scores derive purely from transactions; manual scoring is rejected (`PERFORMANCE_MANUAL_BLOCKED`); dual-role weights validate to 100%. |
| `AC-P18-06` | **Zero-Mock DNA Frontend & Export Parity:** Named P18 reports and executive surfaces consume 100% live API data without static mock/fallback arrays (`BUS-RULE-105`). Export endpoints output parity data. |
| `AC-P18-07` | **Thin Final Verification & Clean DB:** `npm run verify:p18` executes dual typechecks, focused backend suites, frontend live UI behavior suite, PostgreSQL golden-thread, and residue check with natural exit `0`, leaving 0 residue rows in PostgreSQL. |

## Verification composition

The frozen verification command `npm run verify:p18` executes:
1. `npx tsc --noEmit -p backend/tsconfig.json` & `npx tsc --noEmit -p frontend/tsconfig.json`
2. `npm --prefix backend run test:p18:financial-reports`
3. `npm --prefix backend run test:p18:operational-reports`
4. `npm --prefix backend run test:p18:dashboards`
5. `npm --prefix backend run test:p18:kpi-governance`
6. `npm --prefix backend run test:p18:golden-thread`
7. `npm --prefix frontend run test:p18`
8. `node scripts/ssot/p18_clean_db.js`
