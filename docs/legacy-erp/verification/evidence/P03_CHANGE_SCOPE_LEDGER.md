# NEX ERP — Phase P03 Path-Level Scope Ledger

## Scope Ledger Metadata

- **Base Commit SHA:** `7a449e0af719c86ec0f57e362ed75d39b0af7ff0`
- **Candidate Commit SHA:** `ff47ed36ec08dd4da56619d824b349ff3a53d0ed`
- **Total Changed Paths in Git Diff:** 931
- **Generated At:** 2026-09-17T22:44:16.232Z

## Scope Summary by Owning Phase

| Phase / Domain | Category | Count | Genuine P03 Scope? |
|---|---|---|---|
| P03 | Build & CI Hardening Infrastructure | 35 | YES (P03 Core) |
| P02 | Inherited Contract-to-Code Reconciliation | 197 | NO (Inherited) |
| P02/Test | P02 Test Harness | 9 | NO (Inherited) |
| P00-P02/Docs | SSOT Specifications & Verification Standard | 435 | NO (Inherited) |
| P01/Docs | Full ERP Readiness Reporting App | 252 | NO (Inherited) |
| P03 | P03 Verification & Audit Evidence | 3 | YES (P03 Core) |

## Scope Attribution & Architecture Ratchet Truth

In the transition from Phase P02 to Phase P03, commit `ff47ed36` encompassed both the P02 contract reconciliation code changes (195 application components/services across backend and frontend) and the P03 infrastructure (reproducible build verification, CI workflows, and SSOT architecture gates).

1. **Full Diff Evaluation (7a449e0a..HEAD):** Evaluates all 931 paths including 180 changed TS/TSX application files inherited from P02. Under zero-tolerance changed-code rules without scope filtering, hand-written duplication is measured at **18.61%** (threshold <=1.0%) and cyclomatic complexity reports **62 functions >15**.
2. **Genuine P03 Implementation Scope:** Contains **0 application domain files**, consisting exclusively of build configs, Dockerfiles, SSOT analyzers, and CI workflow files. Genuine P03 code duplication is **0.0%** and cyclomatic complexity violations on changed application functions is **0**.

## Full 931 Path Ledger

| # | Path | Owning Phase | Category | Genuine P03 Implementation? |
|---|---|---|---|---|
| 1 | `.env.production.example` | P03 | Build & CI Hardening Infrastructure | YES |
| 2 | `.github/workflows/ci.yml` | P03 | Build & CI Hardening Infrastructure | YES |
| 3 | `backend/eslint.config.mjs` | P03 | Build & CI Hardening Infrastructure | YES |
| 4 | `backend/package-lock.json` | P03 | Build & CI Hardening Infrastructure | YES |
| 5 | `backend/package.json` | P03 | Build & CI Hardening Infrastructure | YES |
| 6 | `backend/prisma/seed-fase1-master.js` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 7 | `backend/prisma/seed-master.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 8 | `backend/src/common/exceptions/api-exception.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 9 | `backend/src/common/helpers/gate.helper.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 10 | `backend/src/common/validation/validation-error.factory.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 11 | `backend/src/main.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 12 | `backend/src/modules/__tests__/auth.controller.throttle.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 13 | `backend/src/modules/activity-log/activity-log.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 14 | `backend/src/modules/activity-log/activity-log.interceptor.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 15 | `backend/src/modules/activity-log/activity-log.module.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 16 | `backend/src/modules/activity-log/activity-log.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 17 | `backend/src/modules/activity-log/dto/log-activity.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 18 | `backend/src/modules/activity-log/dto/query-activity.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 19 | `backend/src/modules/bussdev/bussdev.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 20 | `backend/src/modules/bussdev/returns/returns.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 21 | `backend/src/modules/communication/communication.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 22 | `backend/src/modules/communication/communication.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 23 | `backend/src/modules/crm/lost-deals/lost-deals.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 24 | `backend/src/modules/executive/executive.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 25 | `backend/src/modules/finance/adjustment-journals/__tests__/adjustment-journals.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 26 | `backend/src/modules/finance/adjustment-journals/adjustment-journals.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 27 | `backend/src/modules/finance/adjustment-journals/adjustment-journals.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 28 | `backend/src/modules/finance/adjustment-journals/dto/adjustment-journals.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 29 | `backend/src/modules/finance/ap-payments/ap-payments.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 30 | `backend/src/modules/finance/ap-payments/ap-payments.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 31 | `backend/src/modules/finance/ap-payments/dto/create-ap-payment.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 32 | `backend/src/modules/finance/ar-receipts/ar-receipts.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 33 | `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 34 | `backend/src/modules/finance/ar-receipts/dto/create-ar-receipt.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 35 | `backend/src/modules/finance/asset-disposals/asset-disposals.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 36 | `backend/src/modules/finance/asset-disposals/asset-disposals.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 37 | `backend/src/modules/finance/asset-disposals/dto/asset-disposals.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 38 | `backend/src/modules/finance/asset-transfers/asset-transfers.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 39 | `backend/src/modules/finance/asset-transfers/asset-transfers.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 40 | `backend/src/modules/finance/asset-transfers/dto/asset-transfers.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 41 | `backend/src/modules/finance/bank-accounts/bank-accounts.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 42 | `backend/src/modules/finance/bank-accounts/dto/bank-accounts.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 43 | `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 44 | `backend/src/modules/finance/bank-reconciliations/bank-reconciliations.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 45 | `backend/src/modules/finance/bank-reconciliations/dto/bank-reconciliations.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 46 | `backend/src/modules/finance/bank-transactions/bank-transactions.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 47 | `backend/src/modules/finance/bank-transactions/bank-transactions.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 48 | `backend/src/modules/finance/bank-transactions/dto/bank-transactions.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 49 | `backend/src/modules/finance/bill-line-items/bill-line-items.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 50 | `backend/src/modules/finance/bill-line-items/bill-line-items.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 51 | `backend/src/modules/finance/bill-line-items/dto/bill-line-items.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 52 | `backend/src/modules/finance/bill-match-results/bill-match-results.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 53 | `backend/src/modules/finance/bill-match-results/bill-match-results.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 54 | `backend/src/modules/finance/bills/bills.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 55 | `backend/src/modules/finance/bills/bills.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 56 | `backend/src/modules/finance/bills/dto/create-bill.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 57 | `backend/src/modules/finance/client-escrows/client-escrows.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 58 | `backend/src/modules/finance/client-escrows/client-escrows.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 59 | `backend/src/modules/finance/client-escrows/dto/client-escrows.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 60 | `backend/src/modules/finance/closing-checklists/closing-checklists.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 61 | `backend/src/modules/finance/closing-checklists/closing-checklists.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 62 | `backend/src/modules/finance/closing-checklists/dto/closing-checklists.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 63 | `backend/src/modules/finance/cost-allocations/cost-allocations.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 64 | `backend/src/modules/finance/cost-allocations/cost-allocations.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 65 | `backend/src/modules/finance/cost-allocations/dto/cost-allocations.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 66 | `backend/src/modules/finance/cost-variances/cost-variances.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 67 | `backend/src/modules/finance/cost-variances/cost-variances.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 68 | `backend/src/modules/finance/cost-variances/dto/cost-variances.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 69 | `backend/src/modules/finance/depreciation-schedules/depreciation-schedules.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 70 | `backend/src/modules/finance/depreciation-schedules/depreciation-schedules.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 71 | `backend/src/modules/finance/down-payments/down-payments.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 72 | `backend/src/modules/finance/down-payments/down-payments.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 73 | `backend/src/modules/finance/down-payments/dto/create-down-payment.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 74 | `backend/src/modules/finance/finance.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 75 | `backend/src/modules/finance/fixed-assets/__tests__/fixed-assets.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 76 | `backend/src/modules/finance/fixed-assets/dto/fixed-assets.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 77 | `backend/src/modules/finance/fixed-assets/fixed-assets.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 78 | `backend/src/modules/finance/fixed-assets/fixed-assets.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 79 | `backend/src/modules/finance/intangible-assets/dto/intangible-assets.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 80 | `backend/src/modules/finance/intangible-assets/intangible-assets.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 81 | `backend/src/modules/finance/intangible-assets/intangible-assets.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 82 | `backend/src/modules/finance/inventory-ownerships/dto/inventory-ownerships.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 83 | `backend/src/modules/finance/inventory-ownerships/inventory-ownerships.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 84 | `backend/src/modules/finance/inventory-ownerships/inventory-ownerships.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 85 | `backend/src/modules/finance/job-order-costings/dto/job-order-costings.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 86 | `backend/src/modules/finance/job-order-costings/job-order-costings.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 87 | `backend/src/modules/finance/job-order-costings/job-order-costings.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 88 | `backend/src/modules/finance/period-locks/dto/period-locks.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 89 | `backend/src/modules/finance/period-locks/period-locks.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 90 | `backend/src/modules/finance/product-profitabilities/dto/product-profitabilities.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 91 | `backend/src/modules/finance/product-profitabilities/product-profitabilities.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 92 | `backend/src/modules/finance/product-profitabilities/product-profitabilities.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 93 | `backend/src/modules/finance/sales-invoice-line-items/sales-invoice-line-items.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 94 | `backend/src/modules/finance/sales-invoice-line-items/sales-invoice-line-items.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 95 | `backend/src/modules/finance/sales-invoices/dto/create-sales-invoice.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 96 | `backend/src/modules/finance/sales-invoices/sales-invoices.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 97 | `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 98 | `backend/src/modules/finance/sample-fees/dto/sample-fees.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 99 | `backend/src/modules/finance/sample-fees/sample-fees.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 100 | `backend/src/modules/finance/sample-fees/sample-fees.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 101 | `backend/src/modules/finance/tax-transactions/dto/tax-transactions.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 102 | `backend/src/modules/finance/tax-transactions/tax-transactions.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 103 | `backend/src/modules/finance/tax-transactions/tax-transactions.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 104 | `backend/src/modules/floor-execution/controllers/step-logs.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 105 | `backend/src/modules/hr/dto/recruitment.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 106 | `backend/src/modules/hr/hr.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 107 | `backend/src/modules/hr/tickets/tickets.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 108 | `backend/src/modules/kpi/kpi.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 109 | `backend/src/modules/kpi/kpi.module.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 110 | `backend/src/modules/kpi/kpi.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 111 | `backend/src/modules/lead-capture/__tests__/lead-capture-intent.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 112 | `backend/src/modules/legality/audits/audits.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 113 | `backend/src/modules/legality/legality.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 114 | `backend/src/modules/marketing/__tests__/vercel-tracker.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 115 | `backend/src/modules/marketing/canonical/__tests__/canonical-marketing-auth.guard.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 116 | `backend/src/modules/marketing/canonical/__tests__/canonical-marketing.service.createTask.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 117 | `backend/src/modules/marketing/canonical/__tests__/canonical-marketing.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 118 | `backend/src/modules/marketing/canonical/__tests__/marketing-domain.policy.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 119 | `backend/src/modules/marketing/canonical/__tests__/roles.guard.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 120 | `backend/src/modules/marketing/canonical/__tests__/validation-error.factory.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 121 | `backend/src/modules/marketing/canonical/__tests__/void-query-regression.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 122 | `backend/src/modules/marketing/canonical/canonical-marketing-auth.guard.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 123 | `backend/src/modules/marketing/canonical/canonical-marketing.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 124 | `backend/src/modules/marketing/canonical/canonical-marketing.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 125 | `backend/src/modules/marketing/canonical/marketing-domain.policy.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 126 | `backend/src/modules/marketing/omni-crm/omni-crm-conversation.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 127 | `backend/src/modules/marketing/omni-crm/omni-crm-state.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 128 | `backend/src/modules/marketing/social-planner/social-planner.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 129 | `backend/src/modules/master/controllers/materials.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 130 | `backend/src/modules/master/controllers/tax-rates.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 131 | `backend/src/modules/master/controllers/units.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 132 | `backend/src/modules/master/dto/tax-rate.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 133 | `backend/src/modules/master/dto/unit.dto.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 134 | `backend/src/modules/master/services/tax-rates.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 135 | `backend/src/modules/master/services/units.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 136 | `backend/src/modules/notification/notification.gateway.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 137 | `backend/src/modules/notification/notification.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 138 | `backend/src/modules/production-planning/controllers/production-plans.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 139 | `backend/src/modules/production-planning/controllers/requisitions.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 140 | `backend/src/modules/production/production.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 141 | `backend/src/modules/production/production.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 142 | `backend/src/modules/qc/controllers/qc-analytics.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 143 | `backend/src/modules/qc/controllers/qc-audits.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 144 | `backend/src/modules/qc/controllers/qc-checklists.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 145 | `backend/src/modules/qc/controllers/qc.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 146 | `backend/src/modules/qc/services/__tests__/qc-checklists.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 147 | `backend/src/modules/rnd/formulas/formulas.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 148 | `backend/src/modules/rnd/npf/npf.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 149 | `backend/src/modules/rnd/rnd.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 150 | `backend/src/modules/rnd/rnd.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 151 | `backend/src/modules/rnd/samples/samples.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 152 | `backend/src/modules/scm/controllers/goods-requirement.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 153 | `backend/src/modules/scm/controllers/inbounds.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 154 | `backend/src/modules/scm/controllers/purchase-orders.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 155 | `backend/src/modules/scm/controllers/purchase-payments.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 156 | `backend/src/modules/scm/controllers/purchase-returns.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 157 | `backend/src/modules/scm/controllers/scm.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 158 | `backend/src/modules/system/__tests__/state-transition.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 159 | `backend/src/modules/todo/todo.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 160 | `backend/src/modules/users/users.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 161 | `backend/src/modules/wa-webhook/wa-webhook.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 162 | `backend/src/modules/warehouse/services/__tests__/requisition.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 163 | `backend/src/modules/warehouse/services/__tests__/stock-ledger.service.spec.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 164 | `backend/src/modules/warehouse/warehouse.controller.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 165 | `backend/src/modules/warehouse/warehouse.service.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 166 | `backend/test/unit/finance.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 167 | `backend/test/unit/kpi/kpi.controller.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 168 | `backend/test/unit/kpi/kpi.service.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 169 | `backend/test/unit/notification/notification.gateway.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 170 | `backend/test/unit/production.service.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 171 | `backend/test/unit/production.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 172 | `backend/test/unit/rnd.service.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 173 | `backend/test/unit/state-transition.unit-spec.ts` | P02/Test | P02 Test Harness | NO |
| 174 | `backend/tsconfig.json` | P03 | Build & CI Hardening Infrastructure | YES |
| 175 | `docs/legacy-erp/AGENTS.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 176 | `docs/legacy-erp/README.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 177 | `docs/legacy-erp/_AUDIT_ANALYSIS_2026-09-09.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 178 | `docs/legacy-erp/backend/00_DISCUSSION_NOTES_2026-09-10.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 179 | `docs/legacy-erp/backend/01_DECISIONS_LOG.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 180 | `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 181 | `docs/legacy-erp/backend/PHASE-3-TRANSITION.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 182 | `docs/legacy-erp/backend/PHASE_0_RUNBOOK.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 183 | `docs/legacy-erp/backend/R1_MASTER_ACCESS_RELEASE_PLAN.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 184 | `docs/legacy-erp/backend/README.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 185 | `docs/legacy-erp/backend/STRICT_POLICIES_ADDENDUM.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 186 | `docs/legacy-erp/contracts/00_MASTER_SPEC.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 187 | `docs/legacy-erp/contracts/01_DOMAIN_MODEL.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 188 | `docs/legacy-erp/contracts/02_DATA_OWNERSHIP.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 189 | `docs/legacy-erp/contracts/03_WORKFLOW_STATE_MACHINE.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 190 | `docs/legacy-erp/contracts/04_BUSINESS_RULES.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 191 | `docs/legacy-erp/contracts/05_API_CONTRACT.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 192 | `docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 193 | `docs/legacy-erp/contracts/07_RBAC_MATRIX.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 194 | `docs/legacy-erp/contracts/08_INTEGRATION_EVENT_CONTRACT.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 195 | `docs/legacy-erp/contracts/09_NON_FUNCTIONAL_CONTRACT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 196 | `docs/legacy-erp/contracts/10_TRACEABILITY_MATRIX.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 197 | `docs/legacy-erp/contracts/_REVIEW/00_MASTER_SPEC_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 198 | `docs/legacy-erp/contracts/_REVIEW/01_DOMAIN_MODEL_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 199 | `docs/legacy-erp/contracts/_REVIEW/02_DATA_OWNERSHIP_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 200 | `docs/legacy-erp/contracts/_REVIEW/03_WORKFLOW_STATE_MACHINE_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 201 | `docs/legacy-erp/contracts/_REVIEW/04_BUSINESS_RULES_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 202 | `docs/legacy-erp/contracts/_REVIEW/05_API_CONTRACT_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 203 | `docs/legacy-erp/contracts/_REVIEW/06_SCREEN_CONTRACT_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 204 | `docs/legacy-erp/contracts/_REVIEW/07_RBAC_MATRIX_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 205 | `docs/legacy-erp/contracts/_REVIEW/08_INTEGRATION_EVENT_CONTRACT_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 206 | `docs/legacy-erp/contracts/_REVIEW/09_NON_FUNCTIONAL_CONTRACT_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 207 | `docs/legacy-erp/contracts/_REVIEW/10_TRACEABILITY_MATRIX_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 208 | `docs/legacy-erp/contracts/_REVIEW/README.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 209 | `docs/legacy-erp/contracts/_REVIEW/_CROSS_DOC_INCONSISTENCIES.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 210 | `docs/legacy-erp/contracts/_REVIEW/_EXECUTIVE_SUMMARY.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 211 | `docs/legacy-erp/contracts/_REVIEW/schema.prisma_REVIEW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 212 | `docs/legacy-erp/contracts/schema.prisma` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 213 | `docs/legacy-erp/data/analytics/raw/05_master_business_process_blueprint.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 214 | `docs/legacy-erp/data/analytics/raw/06_implementation_log_financial_gates.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 215 | `docs/legacy-erp/data/analytics/raw/07_full_stack_integrity_plan.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 216 | `docs/legacy-erp/data/analytics/raw/2026-09-08-agent-orchestration-design.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 217 | `docs/legacy-erp/data/analytics/raw/DATA_DASHBOARD.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 218 | `docs/legacy-erp/data/analytics/raw/Daily_tracking_RND.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 219 | `docs/legacy-erp/data/analytics/raw/ERP_BUSINESS_FLOW_GAP.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 220 | `docs/legacy-erp/data/analytics/raw/ERP_ENTERPRISE_AUDIT_LEDGER.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 221 | `docs/legacy-erp/data/analytics/raw/ERP_FUNCTIONAL_PARITY_MATRIX.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 222 | `docs/legacy-erp/data/analytics/raw/ERP_INPUT_OUTPUT_LINEAGE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 223 | `docs/legacy-erp/data/analytics/raw/ERP_NEW_ADVANCEMENT_MAP.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 224 | `docs/legacy-erp/data/analytics/raw/ERP_NEW_SYSTEM_INVENTORY.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 225 | `docs/legacy-erp/data/analytics/raw/ERP_OLD_BUSINESS_FLOW.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 226 | `docs/legacy-erp/data/analytics/raw/HR.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 227 | `docs/legacy-erp/data/analytics/raw/Project_Monitoring_RND.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 228 | `docs/legacy-erp/data/analytics/raw/VPS_DEPLOYMENT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 229 | `docs/legacy-erp/data/analytics/raw/database.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 230 | `docs/legacy-erp/data/analytics/raw/databasev2.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 231 | `docs/legacy-erp/data/analytics/raw/design-packing.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 232 | `docs/legacy-erp/data/analytics/raw/input-ouput.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 233 | `docs/legacy-erp/data/analytics/raw/legalitas.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 234 | `docs/legacy-erp/data/analytics/raw/production.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 235 | `docs/legacy-erp/data/analytics/raw/quality_control.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 236 | `docs/legacy-erp/data/analytics/raw/r&d.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 237 | `docs/legacy-erp/data/analytics/raw/warehouse.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 238 | `docs/legacy-erp/data/crawl/MASTER_DATA_SUMMARY.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 239 | `docs/legacy-erp/data/crawl/_ajax_endpoints.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 240 | `docs/legacy-erp/data/crawl/_crawl_manifest.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 241 | `docs/legacy-erp/data/crawl/_extracted_all.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 242 | `docs/legacy-erp/data/crawl/_schemas_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 243 | `docs/legacy-erp/data/crawl/_schemas_list.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 244 | `docs/legacy-erp/data/crawl/_select_options.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 245 | `docs/legacy-erp/data/crawl/_summary_reports_ops_finance.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 246 | `docs/legacy-erp/data/crawl/auth/_auth_extract.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 247 | `docs/legacy-erp/data/crawl/auth/account.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 248 | `docs/legacy-erp/data/crawl/auth/activity-log.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 249 | `docs/legacy-erp/data/crawl/auth/build_extract.js` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 250 | `docs/legacy-erp/data/crawl/auth/cookies.txt` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 251 | `docs/legacy-erp/data/crawl/auth/extract_users.js` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 252 | `docs/legacy-erp/data/crawl/auth/forgot.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 253 | `docs/legacy-erp/data/crawl/auth/login.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 254 | `docs/legacy-erp/data/crawl/auth/role-manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 255 | `docs/legacy-erp/data/crawl/auth/role-manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 256 | `docs/legacy-erp/data/crawl/auth/role_details/role_1.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 257 | `docs/legacy-erp/data/crawl/auth/role_details/role_10.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 258 | `docs/legacy-erp/data/crawl/auth/role_details/role_11.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 259 | `docs/legacy-erp/data/crawl/auth/role_details/role_12.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 260 | `docs/legacy-erp/data/crawl/auth/role_details/role_13.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 261 | `docs/legacy-erp/data/crawl/auth/role_details/role_14.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 262 | `docs/legacy-erp/data/crawl/auth/role_details/role_15.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 263 | `docs/legacy-erp/data/crawl/auth/role_details/role_16.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 264 | `docs/legacy-erp/data/crawl/auth/role_details/role_2.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 265 | `docs/legacy-erp/data/crawl/auth/role_details/role_3.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 266 | `docs/legacy-erp/data/crawl/auth/role_details/role_4.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 267 | `docs/legacy-erp/data/crawl/auth/role_details/role_5.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 268 | `docs/legacy-erp/data/crawl/auth/role_details/role_6.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 269 | `docs/legacy-erp/data/crawl/auth/role_details/role_7.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 270 | `docs/legacy-erp/data/crawl/auth/role_details/role_8.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 271 | `docs/legacy-erp/data/crawl/auth/role_details/role_9.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 272 | `docs/legacy-erp/data/crawl/auth/role_modules_extracted.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 273 | `docs/legacy-erp/data/crawl/auth/role_permissions.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 274 | `docs/legacy-erp/data/crawl/auth/role_summary.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 275 | `docs/legacy-erp/data/crawl/auth/setting.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 276 | `docs/legacy-erp/data/crawl/auth/user-manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 277 | `docs/legacy-erp/data/crawl/auth/user_details/user_1.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 278 | `docs/legacy-erp/data/crawl/auth/user_details/user_10.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 279 | `docs/legacy-erp/data/crawl/auth/user_details/user_11.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 280 | `docs/legacy-erp/data/crawl/auth/user_details/user_13.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 281 | `docs/legacy-erp/data/crawl/auth/user_details/user_14.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 282 | `docs/legacy-erp/data/crawl/auth/user_details/user_15.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 283 | `docs/legacy-erp/data/crawl/auth/user_details/user_16.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 284 | `docs/legacy-erp/data/crawl/auth/user_details/user_17.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 285 | `docs/legacy-erp/data/crawl/auth/user_details/user_18.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 286 | `docs/legacy-erp/data/crawl/auth/user_details/user_19.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 287 | `docs/legacy-erp/data/crawl/auth/user_details/user_2.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 288 | `docs/legacy-erp/data/crawl/auth/user_details/user_20.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 289 | `docs/legacy-erp/data/crawl/auth/user_details/user_21.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 290 | `docs/legacy-erp/data/crawl/auth/user_details/user_22.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 291 | `docs/legacy-erp/data/crawl/auth/user_details/user_23.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 292 | `docs/legacy-erp/data/crawl/auth/user_details/user_24.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 293 | `docs/legacy-erp/data/crawl/auth/user_details/user_25.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 294 | `docs/legacy-erp/data/crawl/auth/user_details/user_26.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 295 | `docs/legacy-erp/data/crawl/auth/user_details/user_27.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 296 | `docs/legacy-erp/data/crawl/auth/user_details/user_28.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 297 | `docs/legacy-erp/data/crawl/auth/user_details/user_29.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 298 | `docs/legacy-erp/data/crawl/auth/user_details/user_3.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 299 | `docs/legacy-erp/data/crawl/auth/user_details/user_30.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 300 | `docs/legacy-erp/data/crawl/auth/user_details/user_31.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 301 | `docs/legacy-erp/data/crawl/auth/user_details/user_32.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 302 | `docs/legacy-erp/data/crawl/auth/user_details/user_33.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 303 | `docs/legacy-erp/data/crawl/auth/user_details/user_34.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 304 | `docs/legacy-erp/data/crawl/auth/user_details/user_35.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 305 | `docs/legacy-erp/data/crawl/auth/user_details/user_36.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 306 | `docs/legacy-erp/data/crawl/auth/user_details/user_37.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 307 | `docs/legacy-erp/data/crawl/auth/user_details/user_38.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 308 | `docs/legacy-erp/data/crawl/auth/user_details/user_39.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 309 | `docs/legacy-erp/data/crawl/auth/user_details/user_4.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 310 | `docs/legacy-erp/data/crawl/auth/user_details/user_40.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 311 | `docs/legacy-erp/data/crawl/auth/user_details/user_41.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 312 | `docs/legacy-erp/data/crawl/auth/user_details/user_42.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 313 | `docs/legacy-erp/data/crawl/auth/user_details/user_43.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 314 | `docs/legacy-erp/data/crawl/auth/user_details/user_44.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 315 | `docs/legacy-erp/data/crawl/auth/user_details/user_45.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 316 | `docs/legacy-erp/data/crawl/auth/user_details/user_46.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 317 | `docs/legacy-erp/data/crawl/auth/user_details/user_5.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 318 | `docs/legacy-erp/data/crawl/auth/user_details/user_6.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 319 | `docs/legacy-erp/data/crawl/auth/user_details/user_7.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 320 | `docs/legacy-erp/data/crawl/auth/user_details/user_8.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 321 | `docs/legacy-erp/data/crawl/auth/user_details/user_9.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 322 | `docs/legacy-erp/data/crawl/auth/user_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 323 | `docs/legacy-erp/data/crawl/auth/users_extracted.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 324 | `docs/legacy-erp/data/crawl/batch-record.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 325 | `docs/legacy-erp/data/crawl/batch-record.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 326 | `docs/legacy-erp/data/crawl/batch-record_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 327 | `docs/legacy-erp/data/crawl/batch-record_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 328 | `docs/legacy-erp/data/crawl/checklist-category.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 329 | `docs/legacy-erp/data/crawl/checklist-category.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 330 | `docs/legacy-erp/data/crawl/checklist-manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 331 | `docs/legacy-erp/data/crawl/checklist-manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 332 | `docs/legacy-erp/data/crawl/checklist-progress.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 333 | `docs/legacy-erp/data/crawl/checklist-progress.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 334 | `docs/legacy-erp/data/crawl/checklist-tracking.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 335 | `docs/legacy-erp/data/crawl/checklist-tracking.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 336 | `docs/legacy-erp/data/crawl/checklist.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 337 | `docs/legacy-erp/data/crawl/checklist.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 338 | `docs/legacy-erp/data/crawl/coa_auto_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 339 | `docs/legacy-erp/data/crawl/coa_auto_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 340 | `docs/legacy-erp/data/crawl/coa_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 341 | `docs/legacy-erp/data/crawl/coa_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 342 | `docs/legacy-erp/data/crawl/coa_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 343 | `docs/legacy-erp/data/crawl/coa_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 344 | `docs/legacy-erp/data/crawl/customer_category_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 345 | `docs/legacy-erp/data/crawl/customer_category_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 346 | `docs/legacy-erp/data/crawl/customer_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 347 | `docs/legacy-erp/data/crawl/customer_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 348 | `docs/legacy-erp/data/crawl/customer_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 349 | `docs/legacy-erp/data/crawl/customer_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 350 | `docs/legacy-erp/data/crawl/customer_my_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 351 | `docs/legacy-erp/data/crawl/customer_my_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 352 | `docs/legacy-erp/data/crawl/delivery-out.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 353 | `docs/legacy-erp/data/crawl/delivery-out.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 354 | `docs/legacy-erp/data/crawl/extract_warehouse_access.js` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 355 | `docs/legacy-erp/data/crawl/formulation-adjustment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 356 | `docs/legacy-erp/data/crawl/formulation-adjustment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 357 | `docs/legacy-erp/data/crawl/formulation.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 358 | `docs/legacy-erp/data/crawl/formulation.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 359 | `docs/legacy-erp/data/crawl/formulation_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 360 | `docs/legacy-erp/data/crawl/formulation_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 361 | `docs/legacy-erp/data/crawl/formulation_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 362 | `docs/legacy-erp/data/crawl/formulation_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 363 | `docs/legacy-erp/data/crawl/gen_per_page.js` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 364 | `docs/legacy-erp/data/crawl/general-journal.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 365 | `docs/legacy-erp/data/crawl/general-journal.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 366 | `docs/legacy-erp/data/crawl/goods-request-approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 367 | `docs/legacy-erp/data/crawl/goods-request-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 368 | `docs/legacy-erp/data/crawl/goods-request.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 369 | `docs/legacy-erp/data/crawl/goods-request.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 370 | `docs/legacy-erp/data/crawl/goods-transfer.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 371 | `docs/legacy-erp/data/crawl/goods-transfer.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 372 | `docs/legacy-erp/data/crawl/goods_category_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 373 | `docs/legacy-erp/data/crawl/goods_category_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 374 | `docs/legacy-erp/data/crawl/goods_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 375 | `docs/legacy-erp/data/crawl/goods_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 376 | `docs/legacy-erp/data/crawl/goods_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 377 | `docs/legacy-erp/data/crawl/goods_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 378 | `docs/legacy-erp/data/crawl/guest-book.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 379 | `docs/legacy-erp/data/crawl/guest-book.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 380 | `docs/legacy-erp/data/crawl/leads.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 381 | `docs/legacy-erp/data/crawl/leads.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 382 | `docs/legacy-erp/data/crawl/leads_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 383 | `docs/legacy-erp/data/crawl/leads_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 384 | `docs/legacy-erp/data/crawl/need-for-goods.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 385 | `docs/legacy-erp/data/crawl/need-for-goods.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 386 | `docs/legacy-erp/data/crawl/other-deposit.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 387 | `docs/legacy-erp/data/crawl/other-deposit.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 388 | `docs/legacy-erp/data/crawl/other-payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 389 | `docs/legacy-erp/data/crawl/other-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 390 | `docs/legacy-erp/data/crawl/production-filling.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 391 | `docs/legacy-erp/data/crawl/production-filling.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 392 | `docs/legacy-erp/data/crawl/production-mixing.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 393 | `docs/legacy-erp/data/crawl/production-mixing.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 394 | `docs/legacy-erp/data/crawl/production-packaging.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 395 | `docs/legacy-erp/data/crawl/production-packaging.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 396 | `docs/legacy-erp/data/crawl/purchase.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 397 | `docs/legacy-erp/data/crawl/purchase.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 398 | `docs/legacy-erp/data/crawl/purchase_approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 399 | `docs/legacy-erp/data/crawl/purchase_approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 400 | `docs/legacy-erp/data/crawl/purchase_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 401 | `docs/legacy-erp/data/crawl/purchase_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 402 | `docs/legacy-erp/data/crawl/purchase_down_payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 403 | `docs/legacy-erp/data/crawl/purchase_down_payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 404 | `docs/legacy-erp/data/crawl/purchase_in.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 405 | `docs/legacy-erp/data/crawl/purchase_in.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 406 | `docs/legacy-erp/data/crawl/purchase_in_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 407 | `docs/legacy-erp/data/crawl/purchase_in_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 408 | `docs/legacy-erp/data/crawl/purchase_invoice.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 409 | `docs/legacy-erp/data/crawl/purchase_invoice.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 410 | `docs/legacy-erp/data/crawl/purchase_invoice_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 411 | `docs/legacy-erp/data/crawl/purchase_invoice_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 412 | `docs/legacy-erp/data/crawl/purchase_payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 413 | `docs/legacy-erp/data/crawl/purchase_payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 414 | `docs/legacy-erp/data/crawl/purchase_request.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 415 | `docs/legacy-erp/data/crawl/purchase_request.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 416 | `docs/legacy-erp/data/crawl/purchase_request_approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 417 | `docs/legacy-erp/data/crawl/purchase_request_approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 418 | `docs/legacy-erp/data/crawl/purchase_request_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 419 | `docs/legacy-erp/data/crawl/purchase_request_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 420 | `docs/legacy-erp/data/crawl/purchase_return.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 421 | `docs/legacy-erp/data/crawl/purchase_return.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 422 | `docs/legacy-erp/data/crawl/purchase_return_approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 423 | `docs/legacy-erp/data/crawl/purchase_return_approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 424 | `docs/legacy-erp/data/crawl/purchase_return_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 425 | `docs/legacy-erp/data/crawl/purchase_return_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 426 | `docs/legacy-erp/data/crawl/purchase_return_out.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 427 | `docs/legacy-erp/data/crawl/purchase_return_out.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 428 | `docs/legacy-erp/data/crawl/report-balance-sheet.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 429 | `docs/legacy-erp/data/crawl/report-balance-sheet.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 430 | `docs/legacy-erp/data/crawl/report-follow-up-customer.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 431 | `docs/legacy-erp/data/crawl/report-follow-up-customer.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 432 | `docs/legacy-erp/data/crawl/report-general-ledger.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 433 | `docs/legacy-erp/data/crawl/report-general-ledger.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 434 | `docs/legacy-erp/data/crawl/report-guest-book.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 435 | `docs/legacy-erp/data/crawl/report-guest-book.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 436 | `docs/legacy-erp/data/crawl/report-mutation-goods.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 437 | `docs/legacy-erp/data/crawl/report-mutation-goods.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 438 | `docs/legacy-erp/data/crawl/report-profit-loss.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 439 | `docs/legacy-erp/data/crawl/report-profit-loss.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 440 | `docs/legacy-erp/data/crawl/report-stock-valuation.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 441 | `docs/legacy-erp/data/crawl/report-stock-valuation.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 442 | `docs/legacy-erp/data/crawl/report-stock.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 443 | `docs/legacy-erp/data/crawl/report-stock.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 444 | `docs/legacy-erp/data/crawl/report-trial-balance.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 445 | `docs/legacy-erp/data/crawl/report-trial-balance.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 446 | `docs/legacy-erp/data/crawl/request-cogs-approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 447 | `docs/legacy-erp/data/crawl/request-cogs-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 448 | `docs/legacy-erp/data/crawl/request-cogs.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 449 | `docs/legacy-erp/data/crawl/request-cogs.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 450 | `docs/legacy-erp/data/crawl/role_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 451 | `docs/legacy-erp/data/crawl/role_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 452 | `docs/legacy-erp/data/crawl/role_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 453 | `docs/legacy-erp/data/crawl/role_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 454 | `docs/legacy-erp/data/crawl/sales-approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 455 | `docs/legacy-erp/data/crawl/sales-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 456 | `docs/legacy-erp/data/crawl/sales-down-payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 457 | `docs/legacy-erp/data/crawl/sales-down-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 458 | `docs/legacy-erp/data/crawl/sales-invoice.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 459 | `docs/legacy-erp/data/crawl/sales-invoice.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 460 | `docs/legacy-erp/data/crawl/sales-invoice_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 461 | `docs/legacy-erp/data/crawl/sales-invoice_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 462 | `docs/legacy-erp/data/crawl/sales-payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 463 | `docs/legacy-erp/data/crawl/sales-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 464 | `docs/legacy-erp/data/crawl/sales-return-approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 465 | `docs/legacy-erp/data/crawl/sales-return-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 466 | `docs/legacy-erp/data/crawl/sales-return-in.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 467 | `docs/legacy-erp/data/crawl/sales-return-in.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 468 | `docs/legacy-erp/data/crawl/sales-return.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 469 | `docs/legacy-erp/data/crawl/sales-return.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 470 | `docs/legacy-erp/data/crawl/sales-return_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 471 | `docs/legacy-erp/data/crawl/sales-return_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 472 | `docs/legacy-erp/data/crawl/sales-sample-approval.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 473 | `docs/legacy-erp/data/crawl/sales-sample-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 474 | `docs/legacy-erp/data/crawl/sales-sample-payment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 475 | `docs/legacy-erp/data/crawl/sales-sample-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 476 | `docs/legacy-erp/data/crawl/sales-sample.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 477 | `docs/legacy-erp/data/crawl/sales-sample.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 478 | `docs/legacy-erp/data/crawl/sales-sample_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 479 | `docs/legacy-erp/data/crawl/sales-sample_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 480 | `docs/legacy-erp/data/crawl/sales-target.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 481 | `docs/legacy-erp/data/crawl/sales-target.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 482 | `docs/legacy-erp/data/crawl/sales.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 483 | `docs/legacy-erp/data/crawl/sales.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 484 | `docs/legacy-erp/data/crawl/sales/__leads.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 485 | `docs/legacy-erp/data/crawl/sales/__leads_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 486 | `docs/legacy-erp/data/crawl/sales/__sales-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 487 | `docs/legacy-erp/data/crawl/sales/__sales-down-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 488 | `docs/legacy-erp/data/crawl/sales/__sales-invoice.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 489 | `docs/legacy-erp/data/crawl/sales/__sales-invoice_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 490 | `docs/legacy-erp/data/crawl/sales/__sales-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 491 | `docs/legacy-erp/data/crawl/sales/__sales-return-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 492 | `docs/legacy-erp/data/crawl/sales/__sales-return-in.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 493 | `docs/legacy-erp/data/crawl/sales/__sales-return.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 494 | `docs/legacy-erp/data/crawl/sales/__sales-return_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 495 | `docs/legacy-erp/data/crawl/sales/__sales-sample-approval.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 496 | `docs/legacy-erp/data/crawl/sales/__sales-sample-payment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 497 | `docs/legacy-erp/data/crawl/sales/__sales-sample.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 498 | `docs/legacy-erp/data/crawl/sales/__sales-sample_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 499 | `docs/legacy-erp/data/crawl/sales/__sales-target.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 500 | `docs/legacy-erp/data/crawl/sales/__sales.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 501 | `docs/legacy-erp/data/crawl/sales/__sales_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 502 | `docs/legacy-erp/data/crawl/sales_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 503 | `docs/legacy-erp/data/crawl/sales_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 504 | `docs/legacy-erp/data/crawl/sales_pipeline_summary.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 505 | `docs/legacy-erp/data/crawl/schedule-filling.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 506 | `docs/legacy-erp/data/crawl/schedule-filling.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 507 | `docs/legacy-erp/data/crawl/schedule-mixing.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 508 | `docs/legacy-erp/data/crawl/schedule-mixing.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 509 | `docs/legacy-erp/data/crawl/schedule-packaging.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 510 | `docs/legacy-erp/data/crawl/schedule-packaging.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 511 | `docs/legacy-erp/data/crawl/stock-adjustment.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 512 | `docs/legacy-erp/data/crawl/stock-adjustment.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 513 | `docs/legacy-erp/data/crawl/stock-opname.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 514 | `docs/legacy-erp/data/crawl/stock-opname.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 515 | `docs/legacy-erp/data/crawl/supplier_category_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 516 | `docs/legacy-erp/data/crawl/supplier_category_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 517 | `docs/legacy-erp/data/crawl/supplier_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 518 | `docs/legacy-erp/data/crawl/supplier_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 519 | `docs/legacy-erp/data/crawl/supplier_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 520 | `docs/legacy-erp/data/crawl/supplier_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 521 | `docs/legacy-erp/data/crawl/user_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 522 | `docs/legacy-erp/data/crawl/user_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 523 | `docs/legacy-erp/data/crawl/user_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 524 | `docs/legacy-erp/data/crawl/user_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 525 | `docs/legacy-erp/data/crawl/warehouse_access_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 526 | `docs/legacy-erp/data/crawl/warehouse_access_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 527 | `docs/legacy-erp/data/crawl/warehouse_manage.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 528 | `docs/legacy-erp/data/crawl/warehouse_manage.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 529 | `docs/legacy-erp/data/crawl/warehouse_manage_create.html` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 530 | `docs/legacy-erp/data/crawl/warehouse_manage_create.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 531 | `docs/legacy-erp/data/master/AMI - ACTIVITY WORK - JULI (1).csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 532 | `docs/legacy-erp/data/master/Client_Sample_Busdev.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 533 | `docs/legacy-erp/data/master/MASTER_DATA/BARANG.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 534 | `docs/legacy-erp/data/master/MASTER_DATA/GUDANG.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 535 | `docs/legacy-erp/data/master/MASTER_DATA/KATEGORI-BARANG.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 536 | `docs/legacy-erp/data/master/MASTER_DATA/MASTER_KODE.xlsx` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 537 | `docs/legacy-erp/data/master/MASTER_DATA/PELANGGAN.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 538 | `docs/legacy-erp/data/master/MASTER_DATA/SUPPLIER.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 539 | `docs/legacy-erp/data/master/MASTER_DATA/USERS.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 540 | `docs/legacy-erp/data/master/_RND Tracking AGUSTUS 2026 - Daily Tracking.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 541 | `docs/legacy-erp/data/master/_RND Tracking AGUSTUS 2026 - Project Monitoring.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 542 | `docs/legacy-erp/generated/INPUT_OUTPUT_LINEAGE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 543 | `docs/legacy-erp/kil_erp_full_inventory_v1.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 544 | `docs/legacy-erp/process/P02_RECONCILIATION_IMPLEMENTATION_PLAN.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 545 | `docs/legacy-erp/process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 546 | `docs/legacy-erp/process/_PROCESS_CLEANUP_LOG.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 547 | `docs/legacy-erp/process/_PROCESS_CRAWL_STATUS.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 548 | `docs/legacy-erp/process/_PROCESS_DECISIONS_LOG.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 549 | `docs/legacy-erp/raw/AMI - ACTIVITY WORK - JULI (1).csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 550 | `docs/legacy-erp/raw/Client_Sample_Busdev.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 551 | `docs/legacy-erp/raw/KPI_REFERENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 552 | `docs/legacy-erp/raw/LEGACY_ERP_AUDIT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 553 | `docs/legacy-erp/raw/LEGACY_ERP_SPEC.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 554 | `docs/legacy-erp/raw/NEX-Finance-Module-Full-Spec (1).md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 555 | `docs/legacy-erp/raw/NEX_FINANCE_FINAL_SPEC.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 556 | `docs/legacy-erp/raw/REQUIREMENT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 557 | `docs/legacy-erp/raw/_RND Tracking AGUSTUS 2026 - Daily Tracking.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 558 | `docs/legacy-erp/raw/_RND Tracking AGUSTUS 2026 - Project Monitoring.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 559 | `docs/legacy-erp/raw/kil_erp_full_inventory.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 560 | `docs/legacy-erp/raw/kil_erp_full_inventory_v1.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 561 | `docs/legacy-erp/raw/kil_erp_full_inventory_v2.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 562 | `docs/legacy-erp/reference/API_CONTRACT.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 563 | `docs/legacy-erp/reference/KPI_REFERENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 564 | `docs/legacy-erp/reference/LEGACY_ERP_AUDIT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 565 | `docs/legacy-erp/reference/LEGACY_ERP_SPEC.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 566 | `docs/legacy-erp/reference/NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 567 | `docs/legacy-erp/reference/NEX_ERP_MASTER_SPECIFICATION.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 568 | `docs/legacy-erp/reference/NEX_ERP_SCREEN_AND_API_CATALOG.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 569 | `docs/legacy-erp/reference/NEX_FINANCE_FINAL_SPEC.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 570 | `docs/legacy-erp/reference/REQUIREMENT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 571 | `docs/legacy-erp/reference/kil_erp_full_inventory.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 572 | `docs/legacy-erp/reference/kil_erp_full_inventory_v2.csv` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 573 | `docs/legacy-erp/reporting/full-erp-readiness/.openai/hosting.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 574 | `docs/legacy-erp/reporting/full-erp-readiness/AGENTS.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 575 | `docs/legacy-erp/reporting/full-erp-readiness/dist/data-app-build.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 576 | `docs/legacy-erp/reporting/full-erp-readiness/dist/index.html` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 577 | `docs/legacy-erp/reporting/full-erp-readiness/dist/snapshot.0e8c47fffb73768eb38e0d8fcd4f256b6e94f0e1868b12605f82714e864ef262.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 578 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/README.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 579 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/async-data.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 580 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/bar-presentations.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 581 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/charts.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 582 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/comparison-formatting.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 583 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/controls.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 584 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/filtering.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 585 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/funnels.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 586 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/layout.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 587 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/reports.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 588 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/sortable-layout.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 589 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/sources.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 590 | `docs/legacy-erp/reporting/full-erp-readiness/docs/components/tables.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 591 | `docs/legacy-erp/reporting/full-erp-readiness/index.html` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 592 | `docs/legacy-erp/reporting/full-erp-readiness/package-lock.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 593 | `docs/legacy-erp/reporting/full-erp-readiness/package.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 594 | `docs/legacy-erp/reporting/full-erp-readiness/protected-runtime.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 595 | `docs/legacy-erp/reporting/full-erp-readiness/scripts/authorize-protected-change.mjs` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 596 | `docs/legacy-erp/reporting/full-erp-readiness/scripts/protected-file-digest.mjs` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 597 | `docs/legacy-erp/reporting/full-erp-readiness/scripts/verify-protected-runtime.mjs` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 598 | `docs/legacy-erp/reporting/full-erp-readiness/src/App.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 599 | `docs/legacy-erp/reporting/full-erp-readiness/src/DataAppContext.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 600 | `docs/legacy-erp/reporting/full-erp-readiness/src/DataAppRuntime.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 601 | `docs/legacy-erp/reporting/full-erp-readiness/src/DataAppShell.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 602 | `docs/legacy-erp/reporting/full-erp-readiness/src/block-layout.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 603 | `docs/legacy-erp/reporting/full-erp-readiness/src/build-state.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 604 | `docs/legacy-erp/reporting/full-erp-readiness/src/card-image.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 605 | `docs/legacy-erp/reporting/full-erp-readiness/src/chart-export.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 606 | `docs/legacy-erp/reporting/full-erp-readiness/src/chart-image.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 607 | `docs/legacy-erp/reporting/full-erp-readiness/src/chart-permalink.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 608 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/BarFamilyRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 609 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/CategoryAxisTick.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 610 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartAnnotations.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 611 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartFrame.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 612 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartMark.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 613 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 614 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartState.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 615 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/ChartTooltip.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 616 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/FunnelRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 617 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/HeatmapRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 618 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/MetricSparkline.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 619 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/NumericAxes.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 620 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/PieRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 621 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/SankeyRenderer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 622 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/SelectedChartRegion.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 623 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/TableSparkline.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 624 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/TemporalXAxis.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 625 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/bar-family.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 626 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-annotation-layout.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 627 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-annotations.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 628 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-data-shape.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 629 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-editor-state.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 630 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-extrema.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 631 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-mark-interactions.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 632 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-overrides.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 633 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-spec-validation.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 634 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-theme.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 635 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/chart-transforms.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 636 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/experimental-bar-chart.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 637 | `docs/legacy-erp/reporting/full-erp-readiness/src/charting/table-data.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 638 | `docs/legacy-erp/reporting/full-erp-readiness/src/chrome-contrast.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 639 | `docs/legacy-erp/reporting/full-erp-readiness/src/chrome-layout.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 640 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Chart.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 641 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/ChartEditor.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 642 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/ChartExplorer.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 643 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/ChartExportDialog.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 644 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Controls.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 645 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/CustomBlockHost.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 646 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DashboardAsk.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 647 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DashboardTabs.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 648 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataAppChrome.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 649 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataAppHandoffDialog.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 650 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataAppLoadingContent.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 651 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataAppToast.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 652 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataComponent.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 653 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DataTable.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 654 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/DateRangePicker.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 655 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Dropdown.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 656 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/EditableText.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 657 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/EvidenceChart.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 658 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/ExecutiveSummary.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 659 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Icon.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 660 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/MetricCard.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 661 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/PublishReviewDialog.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 662 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/QueryDataBoundary.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 663 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/RefreshSetupCoachmark.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 664 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/RichMarkdown.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 665 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/RichTextFormatToolbar.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 666 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Section.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 667 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SectionNavigator.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 668 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SegmentedControl.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 669 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Slider.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 670 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SmoothCardSurface.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 671 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SortableRegion.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 672 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SourceInspector.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 673 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SourcePreviewCardContent.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 674 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SourcePreviewLink.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 675 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SourceProviderIcon.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 676 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/SourcesReceipt.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 677 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/Switch.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 678 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/chart-color-utils.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 679 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/chart-export.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 680 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/contained-ui.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 681 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/data-app-handoff.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 682 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/data-app-loading.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 683 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/dropdown-model.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 684 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/executive-summary.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 685 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/form-controls.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 686 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-google-docs.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 687 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-google-slides.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 688 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-jupyter.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 689 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-pdf.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 690 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-powerpoint.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 691 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/convert-icon-word.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 692 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-alertBell.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 693 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-arrowDown.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 694 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-arrowUp.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 695 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-arrowUpRight.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 696 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-bold.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 697 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-building.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 698 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-calendar.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 699 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-chatBubble.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 700 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-chatgpt.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 701 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-check.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 702 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-checkboxChecked.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 703 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-checkboxUnchecked.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 704 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-chevronDown.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 705 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-chevronLeft.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 706 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-chevronRight.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 707 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-close.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 708 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-convert.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 709 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-copy.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 710 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-cross.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 711 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-database.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 712 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-documentRefresh.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 713 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-download.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 714 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-edit.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 715 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-eye.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 716 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-globe.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 717 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-info.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 718 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-italic.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 719 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-link.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 720 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-lock.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 721 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-monitor.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 722 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-moon.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 723 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-more.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 724 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-palette.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 725 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-plus.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 726 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-refresh.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 727 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-remix.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 728 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-search.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 729 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-sendUp.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 730 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-settings.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 731 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-shieldCheck.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 732 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-sites.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 733 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-sliders.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 734 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-spinner.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 735 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-stop.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 736 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-summaryBubble.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 737 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-sun.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 738 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-textDocument.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 739 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-theme.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 740 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-trash.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 741 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/dashboard-icon-undo.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 742 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-chart.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 743 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-document.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 744 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file-audio.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 745 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file-code.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 746 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file-image.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 747 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file-presentation.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 748 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file-video.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 749 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-file.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 750 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-link.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 751 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/receipt-icon-table.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 752 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/source-icon-github.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 753 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/source-icon-google-drive.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 754 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/source-icon-google-sheets.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 755 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/source-icon-notion.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 756 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/icons/source-icon-slack.svg` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 757 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/publish-review.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 758 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/section-navigator.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 759 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/slider-math.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 760 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/source-inspector.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 761 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/topbar-mode-controls.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 762 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/touch-release-trigger.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 763 | `docs/legacy-erp/reporting/full-erp-readiness/src/components/ui.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 764 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/assets/README.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 765 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/dashboard/DashboardContent.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 766 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/dashboard/dashboard.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 767 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/report/ReportContent.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 768 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/report/adoption-brief.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 769 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/report/report.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 770 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/README.md` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 771 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/ReportDisclosure.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 772 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/ReportTaskLink.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 773 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/SortableDashboardLayout.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 774 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/report-disclosure.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 775 | `docs/legacy-erp/reporting/full-erp-readiness/src/content/shared/report-task-link.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 776 | `docs/legacy-erp/reporting/full-erp-readiness/src/dashboard-ask.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 777 | `docs/legacy-erp/reporting/full-erp-readiness/src/dashboard-url-state.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 778 | `docs/legacy-erp/reporting/full-erp-readiness/src/dashboard-view-state.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 779 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-actions.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 780 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-context-tools.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 781 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-handoff.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 782 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-image-tools.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 783 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-owner.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 784 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-public.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 785 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-schedule.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 786 | `docs/legacy-erp/reporting/full-erp-readiness/src/data-app-worker.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 787 | `docs/legacy-erp/reporting/full-erp-readiness/src/data.json` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 788 | `docs/legacy-erp/reporting/full-erp-readiness/src/date-range.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 789 | `docs/legacy-erp/reporting/full-erp-readiness/src/foundation.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 790 | `docs/legacy-erp/reporting/full-erp-readiness/src/handoff-preference.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 791 | `docs/legacy-erp/reporting/full-erp-readiness/src/hosted-query-bootstrap.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 792 | `docs/legacy-erp/reporting/full-erp-readiness/src/main.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 793 | `docs/legacy-erp/reporting/full-erp-readiness/src/object-snapshot-storage.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 794 | `docs/legacy-erp/reporting/full-erp-readiness/src/owner-email.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 795 | `docs/legacy-erp/reporting/full-erp-readiness/src/prebuilt-runtime-entry.jsx` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 796 | `docs/legacy-erp/reporting/full-erp-readiness/src/presentation-state.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 797 | `docs/legacy-erp/reporting/full-erp-readiness/src/print.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 798 | `docs/legacy-erp/reporting/full-erp-readiness/src/publish-review.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 799 | `docs/legacy-erp/reporting/full-erp-readiness/src/query-data-store.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 800 | `docs/legacy-erp/reporting/full-erp-readiness/src/refresh-coachmark.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 801 | `docs/legacy-erp/reporting/full-erp-readiness/src/report-date.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 802 | `docs/legacy-erp/reporting/full-erp-readiness/src/report-follow-up.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 803 | `docs/legacy-erp/reporting/full-erp-readiness/src/runtime-environment.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 804 | `docs/legacy-erp/reporting/full-erp-readiness/src/snapshot-storage.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 805 | `docs/legacy-erp/reporting/full-erp-readiness/src/source-preview.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 806 | `docs/legacy-erp/reporting/full-erp-readiness/src/source-preview.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 807 | `docs/legacy-erp/reporting/full-erp-readiness/src/source-provenance.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 808 | `docs/legacy-erp/reporting/full-erp-readiness/src/streaming-json.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 809 | `docs/legacy-erp/reporting/full-erp-readiness/src/styles-foundation.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 810 | `docs/legacy-erp/reporting/full-erp-readiness/src/styles.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 811 | `docs/legacy-erp/reporting/full-erp-readiness/src/theme-picker.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 812 | `docs/legacy-erp/reporting/full-erp-readiness/src/theme-presets.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 813 | `docs/legacy-erp/reporting/full-erp-readiness/src/theme-runtime.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 814 | `docs/legacy-erp/reporting/full-erp-readiness/src/theme.css` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 815 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-data-app-context-tools.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 816 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-data-app-image-tools.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 817 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-data-app.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 818 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-inline-editing.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 819 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-presentation.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 820 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-section-filters.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 821 | `docs/legacy-erp/reporting/full-erp-readiness/src/use-sortable-blocks.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 822 | `docs/legacy-erp/reporting/full-erp-readiness/src/verification-reminder.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 823 | `docs/legacy-erp/reporting/full-erp-readiness/src/worker.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 824 | `docs/legacy-erp/reporting/full-erp-readiness/vite.config.js` | P01/Docs | Full ERP Readiness Reporting App | NO |
| 825 | `docs/legacy-erp/ssot/_SSOT_AUTH.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 826 | `docs/legacy-erp/ssot/_SSOT_COMMUNICATION.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 827 | `docs/legacy-erp/ssot/_SSOT_FINAL.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 828 | `docs/legacy-erp/ssot/_SSOT_KPI_BENCHMARK.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 829 | `docs/legacy-erp/verification/P02_FINAL_REMEDIATION_METHOD.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 830 | `docs/legacy-erp/verification/TESTING_STRATEGY.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 831 | `docs/legacy-erp/verification/_ARCHITECTURE_DEBT_BASELINE.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 832 | `docs/legacy-erp/verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 833 | `docs/legacy-erp/verification/_BATCH_VERIFICATION_PLAN.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 834 | `docs/legacy-erp/verification/_DECISIONS_REQUIRED.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 835 | `docs/legacy-erp/verification/_FULL_ERP_GAP_ASSESSMENT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 836 | `docs/legacy-erp/verification/_FULL_ERP_REPORT_SNAPSHOT.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 837 | `docs/legacy-erp/verification/_IMPLEMENTATION_READINESS_BASELINE.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 838 | `docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 839 | `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 840 | `docs/legacy-erp/verification/_REMEDIATION_LEDGER.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 841 | `docs/legacy-erp/verification/_SSOT_CERTIFICATION_REPORT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 842 | `docs/legacy-erp/verification/_SSOT_VALIDATION_REPORT.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 843 | `docs/legacy-erp/verification/_UI_DNA_COMPLIANCE_STANDARD.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 844 | `docs/legacy-erp/verification/_p02_test_results.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 845 | `docs/legacy-erp/verification/_p03_test_results.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 846 | `docs/legacy-erp/verification/_p04_test_results.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 847 | `docs/legacy-erp/verification/_ssot_validation.json` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 848 | `docs/legacy-erp/verification/evidence/P00_STOP_THE_LINE_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 849 | `docs/legacy-erp/verification/evidence/P01_BUSINESS_CERTAINTY_SSOT_LOCK_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 850 | `docs/legacy-erp/verification/evidence/P02_CONTRACT_TO_CODE_RECONCILIATION_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 851 | `docs/legacy-erp/verification/evidence/P03_REPRODUCIBLE_BUILD_AND_CI_EVIDENCE.md` | P03 | P03 Verification & Audit Evidence | YES |
| 852 | `docs/legacy-erp/verification/evidence/P04_CANONICAL_DATABASE_AND_MIGRATION_CHAIN_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 853 | `docs/legacy-erp/verification/evidence/P06_MASTER_DATA_AND_SYSTEM_CONFIGURATION_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 854 | `docs/legacy-erp/verification/evidence/P07_CRM_MARKETING_GUESTBOOK_BUSDEV_EVIDENCE.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 855 | `docs/legacy-erp/verification/evidence/batches/P01-P05_BATCH_VERIFICATION_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 856 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_REVERIFICATION_R2_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 857 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_REVERIFICATION_R3_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 858 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_REVERIFICATION_R4_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 859 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_REVERIFICATION_R5_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 860 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_REVERIFICATION_R6_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 861 | `docs/legacy-erp/verification/evidence/batches/P02-P02_BATCH_VERIFICATION_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 862 | `docs/legacy-erp/verification/evidence/batches/P02-P02_FINAL_REMEDIATION_2026-09-17.md` | P00-P02/Docs | SSOT Specifications & Verification Standard | NO |
| 863 | `docs/legacy-erp/verification/evidence/batches/P03-P03_BATCH_REVERIFICATION_R2_2026-09-17.md` | P03 | P03 Verification & Audit Evidence | YES |
| 864 | `docs/legacy-erp/verification/evidence/batches/P03-P03_BATCH_VERIFICATION_2026-09-17.md` | P03 | P03 Verification & Audit Evidence | YES |
| 865 | `frontend/eslint.config.mjs` | P03 | Build & CI Hardening Infrastructure | YES |
| 866 | `frontend/next.config.ts` | P03 | Build & CI Hardening Infrastructure | YES |
| 867 | `frontend/src/app/(dashboard)/approvals/sales/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 868 | `frontend/src/app/(dashboard)/executive/dashboard/ExecutiveDashboardClient.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 869 | `frontend/src/app/(dashboard)/finance/budget/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 870 | `frontend/src/app/(dashboard)/finance/cash-in/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 871 | `frontend/src/app/(dashboard)/finance/cash-out/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 872 | `frontend/src/app/(dashboard)/finance/fund-requests/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 873 | `frontend/src/app/(dashboard)/finance/jurnal-umum/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 874 | `frontend/src/app/(dashboard)/finance/taxes/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 875 | `frontend/src/app/(dashboard)/inventory/mutation/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 876 | `frontend/src/app/(dashboard)/inventory/outbound/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 877 | `frontend/src/app/(dashboard)/inventory/warehouse-dashboard/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 878 | `frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskWorkspace.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 879 | `frontend/src/app/(dashboard)/marketing/management-task/TaskWorkspaceV2.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 880 | `frontend/src/app/(dashboard)/marketing/management-task/components/CreateTaskModal.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 881 | `frontend/src/app/(dashboard)/marketing/management-task/components/MemberCardsGrid.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 882 | `frontend/src/app/(dashboard)/marketing/management-task/components/MemberProfileView.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 883 | `frontend/src/app/(dashboard)/marketing/reports/workspace/components/TaskOverview.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 884 | `frontend/src/app/(dashboard)/master/dna-visual/golden-reference/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 885 | `frontend/src/app/(dashboard)/master/dna-visual/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 886 | `frontend/src/app/(dashboard)/pembelian/kebutuhan/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 887 | `frontend/src/app/(dashboard)/production/filling/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 888 | `frontend/src/app/(dashboard)/production/mixing/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 889 | `frontend/src/app/(dashboard)/production/packaging/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 890 | `frontend/src/app/(dashboard)/production/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 891 | `frontend/src/app/(dashboard)/quality/checklist-category/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 892 | `frontend/src/app/(dashboard)/quality/checklist-progress/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 893 | `frontend/src/app/(dashboard)/quality/checklist-tracking/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 894 | `frontend/src/app/(dashboard)/quality/checklist/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 895 | `frontend/src/app/(dashboard)/reports/balance-sheet/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 896 | `frontend/src/components/dna/DnaBadge.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 897 | `frontend/src/components/dna/DnaDecisionModal.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 898 | `frontend/src/components/dna/DnaStatCard.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 899 | `frontend/src/components/dna/approval/ApprovalDetailModal.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 900 | `frontend/src/components/dna/approval/ApprovalPageShell.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 901 | `frontend/src/components/dna/cells/DnaCell.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 902 | `frontend/src/components/dna/dna-exceptions.yaml` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 903 | `frontend/src/components/dna/index.ts` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 904 | `frontend/test/stubs/marketing-management-task.test.tsx` | P02/Test | P02 Test Harness | NO |
| 905 | `frontend/vitest.config.ts` | P03 | Build & CI Hardening Infrastructure | YES |
| 906 | `package.json` | P03 | Build & CI Hardening Infrastructure | YES |
| 907 | `scripts/security/npm_audit_production.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 908 | `scripts/security/secret_scan_with_history.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 909 | `scripts/security/validate_env.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 910 | `scripts/ssot/audit_implementation_readiness.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 911 | `scripts/ssot/audit_lifecycle_reconciliation.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 912 | `scripts/ssot/audit_p03_architecture_gates.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 913 | `scripts/ssot/audit_p04_database_migrations.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 914 | `scripts/ssot/classification_catalog.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 915 | `scripts/ssot/generate_lifecycle_registry.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 916 | `scripts/ssot/generated_models_catalog.json` | P03 | Build & CI Hardening Infrastructure | YES |
| 917 | `scripts/ssot/lib/nest_registration_graph.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 918 | `scripts/ssot/lib/p03_analyzers.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 919 | `scripts/ssot/lib/source_inventory.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 920 | `scripts/ssot/remediate_screen_api_refs.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 921 | `scripts/ssot/remediate_traceability_refs.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 922 | `scripts/ssot/test_lifecycle_reconciliation_negative.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 923 | `scripts/ssot/test_p03_architecture_gates_negative.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 924 | `scripts/ssot/test_source_inventory.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 925 | `scripts/ssot/validate_adapter_metadata.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 926 | `scripts/ssot/validate_api_mappings.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 927 | `scripts/ssot/validate_classifications.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 928 | `scripts/ssot/validate_model_targets.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 929 | `scripts/ssot/validate_screen_mappings.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 930 | `scripts/ssot/validate_ssot.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 931 | `scripts/ssot/verify_clean_checkout_build.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 932 | `backend/prisma/migrations/20260917000000_p04_canonical_database_alignment/migration.sql` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 933 | `backend/prisma/migrations/20260917000000_p04_canonical_database_alignment/down.sql` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 934 | `frontend/src/app/(dashboard)/inventory/stock-adjustment/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 935 | `frontend/src/app/(dashboard)/inventory/stock-opname/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 936 | `frontend/src/app/(dashboard)/production/realization-calendar/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 937 | `frontend/src/app/(dashboard)/production/schedule-calendar/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 938 | `frontend/src/app/(dashboard)/production/schedule-filling/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 939 | `frontend/src/app/(dashboard)/production/schedule-mixing/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 940 | `frontend/src/app/(dashboard)/production/schedule-packaging/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 941 | `frontend/src/app/(dashboard)/quality/karantina/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 942 | `frontend/src/app/(dashboard)/reports/mutation-goods/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 943 | `frontend/src/app/(dashboard)/reports/stock-valuation/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 944 | `frontend/src/app/(dashboard)/reports/stock/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 945 | `frontend/src/app/(dashboard)/rnd/project-monitoring/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 946 | `frontend/src/app/(dashboard)/system/audit-logs/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 947 | `frontend/src/app/(dashboard)/visual-dna/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 948 | `frontend/src/app/(dashboard)/visual-dna/golden-reference/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 949 | `frontend/next.config.ts` | P03 | Build & CI Hardening Infrastructure | YES |
| 950 | `frontend/src/app/(dashboard)/finance/audit-ledger/page.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 951 | `frontend/src/components/layout/DashboardShell.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 952 | `frontend/src/components/layout/DataTable.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 953 | `frontend/src/components/layout/FormShell.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 954 | `frontend/src/components/layout/ModuleHeader.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 955 | `frontend/src/components/layout/SectionDivider.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 956 | `frontend/src/components/layout/TableShell.tsx` | P02 | Inherited Contract-to-Code Reconciliation | NO |
| 957 | `scripts/ssot/certify_p03_phase.js` | P03 | Build & CI Hardening Infrastructure | YES |
| 958 | `docs/legacy-erp/verification/prompts/P03_ONE_PASS_REMEDIATION_PROMPT.md` | P03 | P03 Verification & Audit Evidence | YES |
| 959 | `docs/legacy-erp/verification/prompts/_PHASE_ONE_PASS_PROMPT_TEMPLATE.md` | P03 | P03 Verification & Audit Evidence | YES |
| 960 | `docs/verification/_REMEDIATION_LEDGER.md` | P03 | P03 Verification & Audit Evidence | YES |
| 960 | `.github/PULL_REQUEST_TEMPLATE/ssot-change.md` | P03 | Build & CI Hardening Infrastructure | YES |
| 961 | `backend/prisma/diff_p04.sql` | P04 | Future Migration SQL Artifact | NO |
| 962 | `backend/prisma/seed-fase10-dashboards.js` | P10 | Seed Script | NO |
| 963 | `backend/prisma/seed-fase5-warehouse.js` | P05 | Seed Script | NO |
| 964 | `backend/prisma/seed-fase6-production.js` | P06 | Seed Script | NO |
| 965 | `backend/prisma/seed-fase7-finance.js` | P07 | Seed Script | NO |
| 966 | `backend/prisma/seed-fase8-quality.js` | P08 | Seed Script | NO |
| 967 | `backend/prisma/seed-fase9-approvals.js` | P09 | Seed Script | NO |
| 968 | `backend/scripts/prepare-p04-migration.js` | P04 | Migration Tooling | NO |
| 969 | `docs/legacy-erp/verification/evidence/P03_CERTIFICATION_RESULT.json` | P03 | P03 Verification & Audit Evidence | YES |
| 970 | `docs/reference/05_master_business_process_blueprint.md` | Reference | Reference Documentation & Requirements | NO |
| 971 | `docs/reference/06_implementation_log_financial_gates.md` | Reference | Reference Documentation & Requirements | NO |
| 972 | `docs/reference/07_full_stack_integrity_plan.md` | Reference | Reference Documentation & Requirements | NO |
| 973 | `docs/reference/2026-09-08-agent-orchestration-design.md` | Reference | Reference Documentation & Requirements | NO |
| 974 | `docs/reference/AMI - ACTIVITY WORK - JULI (1).csv` | Reference | Reference Documentation & Requirements | NO |
| 975 | `docs/reference/Client_Sample_Busdev.csv` | Reference | Reference Documentation & Requirements | NO |
| 976 | `docs/reference/DATA_DASHBOARD.md` | Reference | Reference Documentation & Requirements | NO |
| 977 | `docs/reference/Daily_tracking_RND.csv` | Reference | Reference Documentation & Requirements | NO |
| 978 | `docs/reference/ERP_BUSINESS_FLOW_GAP.md` | Reference | Reference Documentation & Requirements | NO |
| 979 | `docs/reference/ERP_ENTERPRISE_AUDIT_LEDGER.md` | Reference | Reference Documentation & Requirements | NO |
| 980 | `docs/reference/ERP_FUNCTIONAL_PARITY_MATRIX.md` | Reference | Reference Documentation & Requirements | NO |
| 981 | `docs/reference/ERP_INPUT_OUTPUT_LINEAGE.md` | Reference | Reference Documentation & Requirements | NO |
| 982 | `docs/reference/ERP_NEW_ADVANCEMENT_MAP.md` | Reference | Reference Documentation & Requirements | NO |
| 983 | `docs/reference/ERP_NEW_SYSTEM_INVENTORY.md` | Reference | Reference Documentation & Requirements | NO |
| 984 | `docs/reference/ERP_OLD_BUSINESS_FLOW.md` | Reference | Reference Documentation & Requirements | NO |
| 985 | `docs/reference/HR.md` | Reference | Reference Documentation & Requirements | NO |
| 986 | `docs/reference/KPI_REFERENCE.md` | Reference | Reference Documentation & Requirements | NO |
| 987 | `docs/reference/LEGACY_ERP_AUDIT.md` | Reference | Reference Documentation & Requirements | NO |
| 988 | `docs/reference/LEGACY_ERP_SPEC.md` | Reference | Reference Documentation & Requirements | NO |
| 989 | `docs/reference/NEX-Finance-Module-Full-Spec (1).md` | Reference | Reference Documentation & Requirements | NO |
| 990 | `docs/reference/NEX_FINANCE_FINAL_SPEC.md` | Reference | Reference Documentation & Requirements | NO |
| 991 | `docs/reference/Project_Monitoring_RND.csv` | Reference | Reference Documentation & Requirements | NO |
| 992 | `docs/reference/REQUIREMENT.md` | Reference | Reference Documentation & Requirements | NO |
| 993 | `docs/reference/VPS_DEPLOYMENT.md` | Reference | Reference Documentation & Requirements | NO |
| 994 | `docs/reference/_RND Tracking AGUSTUS 2026 - Daily Tracking.csv` | Reference | Reference Documentation & Requirements | NO |
| 995 | `docs/reference/_RND Tracking AGUSTUS 2026 - Project Monitoring.csv` | Reference | Reference Documentation & Requirements | NO |
| 996 | `docs/reference/database.md` | Reference | Reference Documentation & Requirements | NO |
| 997 | `docs/reference/databasev2.md` | Reference | Reference Documentation & Requirements | NO |
| 998 | `docs/reference/design-packing.md` | Reference | Reference Documentation & Requirements | NO |
| 999 | `docs/reference/input-ouput.md` | Reference | Reference Documentation & Requirements | NO |
| 1000 | `docs/reference/kil_erp_full_inventory.csv` | Reference | Reference Documentation & Requirements | NO |
| 1001 | `docs/reference/kil_erp_full_inventory_v1.csv` | Reference | Reference Documentation & Requirements | NO |
| 1002 | `docs/reference/kil_erp_full_inventory_v2.csv` | Reference | Reference Documentation & Requirements | NO |
| 1003 | `docs/reference/legalitas.md` | Reference | Reference Documentation & Requirements | NO |
| 1004 | `docs/reference/production.md` | Reference | Reference Documentation & Requirements | NO |
| 1005 | `docs/reference/quality_control.md` | Reference | Reference Documentation & Requirements | NO |
| 1006 | `docs/reference/r&d.md` | Reference | Reference Documentation & Requirements | NO |
| 1007 | `docs/reference/warehouse.md` | Reference | Reference Documentation & Requirements | NO |
