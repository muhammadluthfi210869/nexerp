# ERP FROM ZERO — Comprehensive Testing Plan

> **Version:** 1.0 | **Date:** 2026-05-28 | **Author:** AI Agent (OpenCode)
> **Target:** Production-ready deployment readiness verification
> **Scope:** 11 business steps, 19 divisions, 151 pages, ~319 API endpoints

---

## Executive Summary

Nex Matrix ERP is a cosmetics contract manufacturing system spanning 19 divisions with a business process that flows from **Lead Acquisition → Repeat Order**. The system has ~319 backend API endpoints across 49 controllers and 151 frontend pages. Current test coverage includes 50 test files (45 specs + 5 fixtures), but most existing E2E tests target the old React dashboard, NOT the new Next.js frontend.

**This plan defines a layered testing strategy:**
1. **Layer 1 — Communication Protocol** (API connectivity, auth/RBAC, data contracts)
2. **Layer 2 — Unit & Integration** (isolated business logic, service correctness)
3. **Layer 3 — E2E Business Process** (11-step golden thread from Lead → Repeat Order)
4. **Layer 4 — Deployment Readiness** (Docker, performance, error handling, security)

---

## Business Process Flow: 11 Steps to Master

```
STEP 1   →  LEAD CAPTURE (Buku Tamu)           ─ BD
STEP 2   →  SAMPLE REQUEST & R&D                ─ BD → R&D → Legality
STEP 3   →  NEGOTIATION                          ─ BD
STEP 4   →  SALES ORDER (SO/SPK)                ─ BD
STEP 5   →  DOWN PAYMENT (DP)                   ─ Finance
STEP 6   →  PRODUCTION (Mixing→Filling→Packing) ─ Production + Warehouse
STEP 7   →  QUALITY CONTROL (QC)                ─ QC
STEP 8   →  DELIVERY / SHIPPING                 ─ Warehouse + Logistics
STEP 9   →  INVOICING                           ─ Finance
STEP 10  →  PAYMENT COLLECTION                  ─ Finance + BD
STEP 11  →  REPEAT ORDER (RO)                   ─ BD → Production
```

| Step | Division(s) | Key Data | Status Transitions | Avg Time |
|------|-------------|----------|--------------------|----------|
| 1 Lead | BD, Marketing | Name, Phone, Product, MOQ | NEW → CONTACTED → SAMPLE | 24h |
| 2 Sample | BD, R&D, Legality | NPF code, Revisions, HKI/BPOM | REQ → DEV → TEST → REV → APPROVED | 4.2d |
| 3 Negotiation | BD | MOQ, Harga, Kontrak | PENAWARAN → MOQ → HARGA → KONTRAK → DEAL | 28d |
| 4 SO/SPK | BD, Warehouse | SO#, SKU, Qty, Margin | SPK → MATERIAL CHECKED | 1d |
| 5 DP | Finance | DP amount, Payment proof | PENDING → PAID | 2d |
| 6 Production | Production, Warehouse | WO, Formula, Batch | PLANNING → MIXING → FILLING → PACKING → FG | 24h |
| 7 QC | QC | Test results, Defect, Rework | FG → QC IN PROGRESS → PASSED/REJECTED | 4h |
| 8 Delivery | Warehouse, Logistics | DO, SO qty, Photos | READY → SHIPPING → DELIVERED | 2d |
| 9 Invoice | Finance | INV#, DP deduction | DELIVERED → INVOICE CREATED | 1h |
| 10 Payment | Finance, BD | TX ID, Amount, Method | PENDING → PARTIAL → PAID → CLOSED | 7d |
| 11 Repeat Order | BD, Production | Empty date, Reminder, LTV | MONITORING → FOLLOW UP → RO / LOST | 58d cycle |

---

## Existing Test Inventory

### Summary

| Category | Count | Framework | Condition |
|----------|-------|-----------|-----------|
| Root E2E (API) | 11 | Playwright | 7 complete, 3 partial/broken |
| Production E2E (API) | 7 | Playwright | 7 complete |
| Frontend E2E (UI) | 17 | Playwright | 10 complete, 5 partial/screenshot, 2 placeholder |
| Frontend Unit | 4 | Vitest | 4 complete |
| Backend Unit | 5 | Jest | 5 complete |
| Fixtures/Support | 5 | - | 5 complete |
| **Total** | **50 files** | | |

### E2E by Division (Existing)

| Division | Test Files | Status |
|----------|-----------|--------|
| SCM / Warehouse | 5 | 3 complete, 1 broken, 1 partial |
| Production | 7 | 7 complete |
| Legality | 1 | 1 complete |
| Finance | 2 | 1 complete, 1 partial |
| BussDev | 4 | 4 complete |
| Marketing | 3 | 2 complete, 1 partial |
| Cross-divisional | 6 | 4 complete, 2 partial |
| R&D | 1 | 1 partial (screenshot only) |
| Performance/System | 4 | 4 complete |
| Auth/RBAC | 1 | 1 complete |

### Coverage Gaps — Divisions with ZERO dedicated tests

- **Executive** — no tests at all
- **HR** — no unit/E2E tests (only touched in performance audits)
- **Logistics** — no tests (only in performance audits)
- **Creative** — no tests at all
- **Master Data** — no E2E tests
- **Legalitas (frontend)** — no frontend unit/component tests
- **QC (backend)** — no backend service unit tests
- **Finance (backend)** — no backend service unit tests
- **Production (backend)** — no backend service unit tests
- **Marketing (backend)** — no backend service unit tests
- **R&D** — only one visual screenshot test

### Existing Test Files — Full Catalog

#### Root-Level E2E (`tests/e2e/`)

| # | File | Division | Lines | Status |
|---|------|----------|-------|--------|
| 1 | `legality-full-cycle.spec.ts` | Legality | 542 | Complete — auth, HKI/BPOM/Halal CRUD, pipeline, master INCI |
| 2 | `scm-warehouse-flow.spec.ts` | SCM/Warehouse | 136 | Complete — requisition CRUD + approval flow |
| 3 | `scm-mrp-flow.spec.ts` | SCM/MRP | 151 | **BROKEN** — Prisma schema issue, all tests fixme'd |
| 4 | `scm-reverse-logistics.spec.ts` | SCM | 126 | Complete — purchase returns lifecycle |
| 5 | `scm-full-cycle.spec.ts` | SCM | 205 | **PARTIAL** — API ok, UI tests fixme'd |
| 6 | `qc-v4-full-cycle.spec.ts` | QC | 166 | Complete — inbound QC PASS, production QC REJECT, final approval |
| 7 | `finance-comprehensive.spec.ts` | Finance | 315 | **PARTIAL** — API active, UI skipped |
| 8 | `finance-core-flow.spec.ts` | Finance | 99 | Complete — Kas Masuk/Keluar, journal API |
| 9 | `performance-audit.spec.ts` | Cross-module | 93 | Complete — 13 route loading audit |
| 10 | `bussdev-pipeline-flow.spec.ts` | BussDev | 126 | Complete — intake → lead → stage advance |
| 11 | `procurement.spec.ts` | SCM | 42 | **PARTIAL/placeholder** |

#### Production E2E (`tests/e2e/production/`)

| # | File | Purpose | Lines | Status |
|---|------|---------|-------|--------|
| 12 | `01-business-flow.spec.ts` | Happy path: PLANNING → DONE | 161 | Complete |
| 13 | `02-industrial-gates.spec.ts` | Atomic sequence, physics validation, weight PIN | 152 | Complete |
| 14 | `03-input-output.spec.ts` | Mass balance, shrinkage, yield | 85 | Complete |
| 15 | `04-communication.spec.ts` | Event emissions, activity audit | 78 | Complete |
| 16 | `05-leakage-detection.spec.ts` | Leakage center API | 51 | Complete |
| 17 | `06-ui-flows.spec.ts` | Dashboard, Floor, Leakage, Terminal UI | 57 | Complete |
| 18 | `07-data-integrity.spec.ts` | Uniqueness, rollback, edge cases | 73 | Complete |

#### Frontend E2E (`frontend/tests/e2e/`)

| # | File | Division | Lines | Status |
|---|------|----------|-------|--------|
| 19 | `workflow.spec.ts` | Cross-div | 94 | Complete — Commercial → R&D → Finance |
| 20 | `validation.spec.ts` | R&D+Production | 65 | Complete — dosage 100%, mass balance |
| 21 | `rnd-visual.spec.ts` | R&D | 30 | Partial — screenshot only |
| 22 | `performance_audit.spec.ts` | Cross-module | 54 | Complete — 8 page status + latency |
| 23 | `performance-audit.spec.ts` | Cross-module | 98 | Complete — 14 module loading audit |
| 24 | `marketing-flow.spec.ts` | Marketing | 41 | Complete — ads data → dashboard |
| 25 | `marketing-command-center.spec.ts` | Marketing | 71 | Complete — matrix entry + persistence |
| 26 | `marketing-audit.spec.ts` | Marketing+Finance | 61 | Partial — 1 placeholder |
| 27 | `lead-intake-fix.spec.ts` | BussDev | 49 | Complete — auto-assignment verification |
| 28 | `hub-modals.spec.ts` | BussDev | 33 | Partial — screenshot only |
| 29 | `hub-demo.spec.ts` | BussDev | 28 | Partial — screenshot only |
| 30 | `golden-thread-phase3.spec.ts` | Cross-div | 127 | Complete — Commercial→Finance→Production→SCM |
| 31 | `golden-thread-phase2.spec.ts` | Cross-div | 86 | Partial — many optional checks |
| 32 | `dreamlab_v4_protocol.spec.ts` | BussDev | 79 | Complete — Lead→Won Deal with gates |
| 33 | `bussdev-dashboard.spec.ts` | BussDev | 53 | Complete — 4 cards, 18 metrics |
| 34 | `auth.spec.ts` | Auth | 39 | Complete — redirect, RBAC, login |
| 35 | `PERFORMANCE_INTEGRITY_AUDIT.spec.ts` | Cross-module | 97 | Complete — 6 modules, <1500ms |

#### Frontend Unit/Integration (`frontend/test/`)

| # | File | Type | Lines | Status |
|---|------|------|-------|--------|
| 36 | `qc-workbench.test.tsx` | Unit (Vitest) | 354 | Complete — DefectModal, Signature, Numpad |
| 37 | `api-client.test.ts` | Integration (MSW) | 144 | Complete — BussDev API client |
| 38 | `empty-state.test.tsx` | Unit (Vitest) | 28 | Complete — shared component |
| 39 | `bussdev-dashboard-cards.test.tsx` | Unit (Vitest) | 82 | Complete — 7 variant modes |

#### Backend Unit (`backend/src/`)

| # | File | Service | Lines | Status |
|---|------|---------|-------|--------|
| 40 | `scm.service.spec.ts` | ScmService | 108 | Complete — dashboard stats |
| 41 | `purchase-payments.service.spec.ts` | PurchasePaymentsService | 185 | Complete — full/partial/overpayment |
| 42 | `purchase-invoices.service.spec.ts` | PurchaseInvoicesService | 183 | Complete — invoice from GRN |
| 43 | `supplier-score.service.spec.ts` | SupplierScoreService | 137 | Complete — scoring algorithm |
| 44 | `file-storage.service.spec.ts` | FileStorageService | 47 | Complete — path, 5MB limit |
| 45 | `prisma.service.spec.ts` | PrismaService | 18 | Minimal — instantiation only |
| 46 | `app.controller.spec.ts` | AppController | 22 | Minimal — scaffold default |

#### Fixtures/Support Files

| # | File | Purpose |
|---|------|---------|
| 47 | `tests/fixtures/legality-auth.ts` | Legality auth helpers (login + token) |
| 48 | `tests/fixtures/scm-auth.ts` | SCM auth helpers (login + token) |
| 49 | `tests/e2e/production/fixtures/constants.ts` | Production seed data constants |
| 50 | `tests/e2e/production/fixtures/auth.setup.ts` | Production test data seeder |

---

## Layer 1: Communication Protocol Testing

**Goal:** Ensure EVERY API endpoint is reachable, authed, and returns correct HTTP status codes with proper data shapes.

### CP-1: Auth & RBAC Integrity

- [ ] `POST /auth/login` — valid credentials → 200 + token
- [ ] `POST /auth/login` — invalid credentials → 401
- [ ] `POST /auth/login` — missing body → 400
- [ ] All protected endpoints without token → 401
- [ ] BD role user accessing Finance endpoints → 403
- [ ] Finance role user accessing Production endpoints → 403
- [ ] Admin user accessing all modules → 200

### CP-2: Health & System Endpoints

- [ ] `GET /system/health` → 200 + `{ status: "ok" }`
- [ ] `GET /system/audit-logs` → 200 + array
- [ ] `GET /notifications` → 200 + array
- [ ] `GET /notifications/unread` → 200 + array
- [ ] `POST /notifications/:id/read` → 200
- [ ] `POST /notifications/read-all` → 200

### CP-3: SSE Event Streams

- [ ] `SSE /events/busdev` — open connection, receive heartbeats
- [ ] `SSE /events/qc` — open connection, receive heartbeats
- [ ] `SSE /events/maintenance` — open connection, receive heartbeats
- [ ] `SSE /events/creative` — open connection, receive heartbeats

### CP-4: Master Data Endpoints

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/master/customers` | GET | 200 + array |
| `/master/customers/:id` | GET | 200 + object |
| `/master/suppliers` | GET | 200 + array |
| `/master/suppliers` | POST | 201 |
| `/master/suppliers/:id` | PATCH | 200 |
| `/master/goods` | GET | 200 + array |
| `/master/categories` | GET | 200 + array |
| `/master/categories` | POST | 201 |
| `/master/warehouses/active` | GET | 200 + array |
| `/master/warehouses` | POST | 201 |
| `/master/warehouses/:id` | DELETE | 200 |

### CP-5: BussDev Division (Lead-to-Deal Pipeline)

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/bussdev/leads` | GET | 200 + array with id/clientName/status |
| `/bussdev/leads/group/:group` | GET | 200 (group = guest/sample/production/ro/lost) |
| `/bussdev/lead` | POST | 201 + lead object |
| `/bussdev/lead/:id` | GET | 200 + full lead detail |
| `/bussdev/lead/:id` | PUT | 200 |
| `/bussdev/lead/:id` | DELETE | 200 (admin only) |
| `/bussdev/lead/:id/advance` | PATCH | 200 + new status |
| `/bussdev/lead/:id/activity` | POST | 201 + activity log |
| `/bussdev/lead/:id/activity-stream` | GET | 200 + activity array |
| `/bussdev/lead/:id/balance` | GET | 200 + totalEstimated/totalPaid/balance |
| `/bussdev/dashboard` | GET | 200 + overview/metrics |
| `/bussdev/analytics/funnel` | GET | 200 + funnel data |
| `/bussdev/analytics/pipeline-granular` | GET | 200 + pipeline table |
| `/bussdev/analytics/staff-performance` | GET | 200 + staff metrics |
| `/bussdev/analytics/lost-churn` | GET | 200 + lost/churn data |
| `/bussdev/staffs` | GET | 200 + staff array |
| `/bussdev/samples` | GET | 200 + samples array |
| `/bussdev/samples` | POST | 201 + sample object |
| `/bussdev/sample/:id/ship` | PATCH | 200 |
| `/bussdev/sample/:id/feedback` | PATCH | 200 |
| `/bussdev/sales-orders` | GET | 200 + array |
| `/bussdev/sales-order` | POST | 201 + SO object |
| `/bussdev/sales-order/:id/status` | PATCH | 200 |
| `/bussdev/sample-request` | POST | 201 |
| `/bussdev/sample-request/:id` | PATCH | 200 |
| `/bussdev/guest/:id/convert` | POST | 200 |
| `/bussdev/lead/:id/override` | PATCH | 200 (admin) |
| `/bussdev/retention-engine/:id/trigger` | POST | 200 |

### CP-6: R&D Division (Sample & Formula)

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/rnd/dashboard` | GET | 200 + metrics |
| `/rnd/samples` | GET | 200 + array |
| `/rnd/samples/:id` | GET | 200 + detail |
| `/rnd/samples` | POST | 201 |
| `/rnd/sample/:id/advance` | PATCH | 200 |
| `/rnd/sample/:id/accept` | POST | 200 |
| `/rnd/sample/:id/assign` | PATCH | 200 |
| `/rnd/inbox` | GET | 200 + array |
| `/rnd/staffs` | GET | 200 + array |
| `/rnd/revisions` | GET | 200 + array |
| `/rnd/revisions/history` | GET | 200 + array |
| `/rnd/revision/:id/start` | POST | 200 |
| `/rnd/revision/:id/complete` | POST | 200 |
| `/rnd/formulas` | GET | 200 + array |
| `/rnd/formulas` | POST | 201 |
| `/rnd/formulas/:id` | GET | 200 + full formula |
| `/rnd/formulas/:id` | PATCH | 200 |
| `/rnd/formulas/:id/revision` | POST | 201 |
| `/rnd/formulas/:id/request-approval` | POST | 200 |
| `/rnd/formulas/:id/approve` | POST | 200 |
| `/rnd/formulas/:id/lock-production` | PATCH | 200 |
| `/rnd/formulas/:id/lab-tests` | POST | 201 |
| `/rnd/formulas/:id/lab-tests` | GET | 200 |
| `/rnd/npf` | GET | 200 + array |
| `/rnd/npf` | POST | 201 |
| `/rnd/lab-test-results` | GET | 200 + array |
| `/rnd/lab-test-results` | POST | 201 |

### CP-7: Legality Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/legality/dashboard` | GET | 200 + metrics |
| `/legality/hki` | GET | 200 + array |
| `/legality/hki` | POST | 201 |
| `/legality/hki/:id/advance` | PATCH | 200 |
| `/legality/bpom` | GET | 200 + array |
| `/legality/bpom` | POST | 201 |
| `/legality/bpom/:id/advance` | PATCH | 200 |
| `/legality/halal` | GET | 200 + array |
| `/legality/halal` | POST | 201 |
| `/legality/halal/:id/advance` | PATCH | 200 |
| `/legality/permits` | GET | 200 + array |
| `/legality/expiry` | GET | 200 + array |
| `/legality/pipeline/stats` | GET | 200 |
| `/legality/pipeline` | GET | 200 + array |
| `/legality/pipeline/:id` | GET | 200 |
| `/legality/pipeline/:id` | PATCH | 200 |
| `/legality/inbox/tasks` | GET | 200 + array |
| `/legality/master-inci` | GET | 200 + array |
| `/legality/master-inci` | POST | 201 |
| `/legality/master-inci/:id` | PATCH | 200 |
| `/legality/master-inci/:id` | DELETE | 200 |
| `/legality/staffs` | GET | 200 + array |
| `/legality/:id/logs` | GET | 200 |
| `/legality/log` | POST | 201 |
| `/legality/formula/:id/validate` | GET | 200 |
| `/legality/formula/:id/review` | POST | 200 |
| `/legality/check-scm/:leadId` | GET | 200 |
| `/legality/check-production/:leadId` | GET | 200 |

### CP-8: Finance Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/finance/dashboard` | GET | 200 + metrics |
| `/finance/dashboard/advanced` | GET | 200 + full stats |
| `/finance/journals` | GET | 200 + array |
| `/finance/journals` | POST | 201 + journal |
| `/finance/journals/:id/reverse` | POST | 200 |
| `/finance/ledger/recent` | GET | 200 + array |
| `/finance/accounts` | GET | 200 + COA array |
| `/finance/accounts` | POST | 201 |
| `/finance/accounts/:id` | PATCH | 200 |
| `/finance/accounts/:id` | DELETE | 200 |
| `/finance/invoices` | GET | 200 + array |
| `/finance/bills` | GET | 200 + array |
| `/finance/bills` | POST | 201 |
| `/finance/invoices/final` | GET | 200 |
| `/finance/invoice/generate/:deliveryOrderId` | POST | 201 |
| `/finance/invoice/validate/:invoiceId` | POST | 200 |
| `/finance/verify-payment` | POST | 201 |
| `/finance/payment/verify` | POST | 201 |
| `/finance/validate-payment/:activityId` | PATCH | 200 |
| `/finance/deliveries` | GET | 200 + array |
| `/finance/sales-orders` | GET | 200 + array |
| `/finance/cash/receive` | POST | 201 |
| `/finance/cash/disburse` | POST | 201 |
| `/finance/ar-hub/pending` | GET | 200 |
| `/finance/ar-hub/verify` | POST | 200 |
| `/finance/fund-request` | POST | 201 |
| `/finance/fund-requests` | GET | 200 |
| `/finance/fund-requests/me` | GET | 200 |
| `/finance/fund-request/:id/approve` | PATCH | 200 |
| `/finance/fund-request/:id/disburse` | POST | 200 |
| `/finance/fund-request/:id/director-approve` | POST | 200 |
| `/finance/fund-request/:id/reject` | PATCH | 200 |
| `/finance/reports/trial-balance` | GET | 200 |
| `/finance/reports/balance-sheet` | GET | 200 |
| `/finance/reports/profit-loss` | GET | 200 |
| `/finance/reports/cash-flow` | GET | 200 |
| `/finance/reports/general-ledger/:accountId` | GET | 200 |
| `/finance/taxes` | GET | 200 |
| `/finance/currencies` | GET | 200 |

### CP-9: Production Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/production/analytics/dashboard` | GET | 200 |
| `/production/analytics/oee` | GET | 200 |
| `/production/summary` | GET | 200 |
| `/production/machines` | GET | 200 + array |
| `/production/work-orders` | GET | 200 + array |
| `/production/work-orders` | POST | 201 |
| `/production/active` | GET | 200 + array |
| `/production/work-orders/:woId/timeline` | GET | 200 |
| `/production/schedules` | GET | 200 + array |
| `/production/schedules` | POST | 201 |
| `/production/schedules/:id/actuals` | POST | 200 |
| `/production/schedules/:id/result` | POST | 200 |
| `/production/start/:workOrderId` | POST | 200 |
| `/production/start-stage` | POST | 200 |
| `/production/:workOrderId/submit-log` | POST | 201 |
| `/production/breakdown` | POST | 201 |
| `/production/step-logs` | GET | 200 |
| `/production/batch-records` | GET | 200 + array |
| `/production/audit` | GET | 200 |
| `/production/chain-of-custody` | GET | 200 |
| `/production/leakage` | GET | 200 |
| `/production/floor` | GET | 200 |
| `/production/qc/pending` | GET | 200 |
| `/production/qc/stats` | GET | 200 |
| `/production/formula-adjustments` | GET | 200 |
| `/production/formula-adjustments` | POST | 201 |
| `/production/requisitions` | GET | 200 |
| `/production/requisitions/:id/issue` | POST | 200 |
| `/production/requisitions/:id/shortage` | POST | 200 |
| `/production/reconciliation/return` | POST | 200 |

### CP-10: QC Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/qc/audits` | GET | 200 + array |
| `/qc/audits` | POST | 201 |
| `/qc/audits/:id` | GET | 200 |
| `/qc/checklists` | GET | 200 + array |
| `/qc/checklists` | POST | 201 |
| `/qc/checklists/:id` | GET | 200 |
| `/qc/checklists/:id` | PATCH | 200 |
| `/qc/checklists/completed` | GET | 200 + array |
| `/qc/analytics/defect-pareto` | GET | 200 |
| `/qc/analytics/supplier-quality` | GET | 200 |
| `/qc/analytics/vendor-watchlist` | GET | 200 |
| `/qc/analytics/rework-hold-log` | GET | 200 |

### CP-11: SCM Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/scm/dashboard` | GET | 200 |
| `/scm/vendors` | GET | 200 + array |
| `/scm/purchase-orders` | GET | 200 + array |
| `/scm/purchase-orders` | POST | 201 |
| `/scm/purchase-orders/:id` | GET | 200 |
| `/scm/purchase-orders/:id/down-payment` | POST | 201 |
| `/scm/purchase-requests` | GET | 200 + array |
| `/scm/purchase-request` | POST | 201 |
| `/scm/purchase-requests/:id/approve` | POST | 200 |
| `/scm/inbounds` | GET | 200 + array |
| `/scm/inbounds` | POST | 201 |
| `/scm/inbounds/:id/status` | PATCH | 200 |
| `/scm/inbounds/:id/qc-validate` | POST | 200 |
| `/scm/inbounds/:id/reject` | POST | 200 |
| `/scm/materials` | GET | 200 + array |
| `/scm/materials` | POST | 201 |
| `/scm/materials/:id` | PUT | 200 |
| `/scm/materials/:id` | DELETE | 200 |
| `/scm/purchase-invoices` | GET | 200 + array |
| `/scm/purchase-invoices` | POST | 201 |
| `/scm/purchase-payments` | GET | 200 + array |
| `/scm/purchase-payments` | POST | 201 |
| `/scm/purchase-returns` | GET | 200 + array |
| `/scm/purchase-returns` | POST | 201 |
| `/scm/purchase-returns/:id/status` | PATCH | 200 |
| `/scm/goods-requirements` | GET | 200 + array |
| `/scm/goods-requirements` | POST | 201 |
| `/scm/goods-requirements/:id/status` | PATCH | 200 |

### CP-12: Warehouse Division

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/warehouse/stats` | GET | 200 |
| `/warehouse/audit` | GET | 200 |
| `/warehouse/catalog` | GET | 200 + array |
| `/warehouse/history/:materialId` | GET | 200 |
| `/warehouse/locations` | GET | 200 + array |
| `/warehouse/inbounds` | GET | 200 + array |
| `/warehouse/inbounds` | POST | 201 |
| `/warehouse/inbounds/:id/release` | POST | 200 |
| `/warehouse/transfers` | GET | 200 + array |
| `/warehouse/transfers` | POST | 201 |
| `/warehouse/transfers/:id/execute` | POST | 200 |
| `/warehouse/opname` | GET | 200 + array |
| `/warehouse/opname` | POST | 201 |
| `/warehouse/opname/:id/approve` | POST | 200 |
| `/warehouse/adjustments` | GET | 200 + array |
| `/warehouse/adjustments` | POST | 201 |
| `/warehouse/adjustments/:id/approve` | POST | 200 |
| `/warehouse/requisitions` | GET | 200 + array |
| `/warehouse/requisitions` | POST | 201 |
| `/warehouse/requisitions/:id` | GET | 200 |
| `/warehouse/requisitions/:id/status` | PATCH | 200 |
| `/warehouse/release-requests` | GET | 200 + array |
| `/warehouse/release/:workOrderId` | POST | 200 |
| `/warehouse/validate-handover` | POST | 200 |
| `/warehouse/stock-intelligence/abc` | GET | 200 |
| `/warehouse/stock-intelligence/dead-stock` | GET | 200 |
| `/warehouse/stock-intelligence/critical` | GET | 200 |
| `/warehouse/stock-intelligence/fast-movers` | GET | 200 |
| `/warehouse/stock-intelligence/reorder-suggestions` | GET | 200 |

### CP-13: Remaining Divisions

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/executive/metrics` | GET | 200 + KPIs |
| `/executive/alerts` | GET | 200 + alerts |
| `/hr/employees` | GET | 200 + array |
| `/hr/employees` | POST | 201 |
| `/hr/employees/:id` | PATCH | 200 |
| `/hr/dashboard` | GET | 200 |
| `/hr/attendance/clock-in` | POST | 201 |
| `/hr/attendance/clock-out` | POST | 201 |
| `/hr/payroll/generate` | POST | 201 |
| `/hr/payroll/authorize/:id` | POST | 200 |
| `/hr/kpi/employee/:id` | GET | 200 |
| `/marketing/daily-ads` | POST | 201 |
| `/marketing/analytics` | GET | 200 |
| `/marketing/targets` | GET | 200 |
| `/logistics/deliverable` | GET | 200 + array |
| `/logistics/deliver/:workOrderId` | POST | 200 |
| `/creative/board` | GET | 200 |
| `/creative/tasks` | GET | 200 + array |
| `/creative/task` | POST | 201 |
| `/crm/lost-deals` | GET | 200 + array |
| `/crm/lost-deals` | POST | 201 |
| `/guests` | GET | 200 + array |
| `/guests` | POST | 201 |

---

## Layer 2: Unit & Integration Testing

**Goal:** Isolate business logic and verify correctness independently of UI and database.

### U-1: Backend Service Unit Tests (Jest) — NEW

| # | Service | Module | Key Scenarios |
|---|---------|--------|---------------|
| U-1.1 | `BussdevService` | bussdev | Lead creation, stage advance validation, duplicate detection |
| U-1.2 | `FinanceService` | finance | Journal balancing, COA validation, DP calculation |
| U-1.3 | `ProductionService` | production | WO creation, formula assignment, cost calculation |
| U-1.4 | `QCService` | qc | Audit creation, defect classification, threshold checks |
| U-1.5 | `RndService` | rnd | Formula validation (100% dosage), revision lifecycle |
| U-1.6 | `LegalityService` | legality | HKI/BPOM stage advancement, compliance gate checks |
| U-1.7 | `HRService` | hr | Attendance calculation, KPI scoring, payroll generation |
| U-1.8 | `WarehouseService` | warehouse | FEFO batch suggestion, stock reservation, mutation validation |
| U-1.9 | `MarketingService` | marketing | ROI calculation, funnel efficiency, CPA metrics |
| U-1.10 | `NotificationsService` | notification | Alert generation rules, read/unread tracking |

### U-2: Frontend Component Unit Tests (Vitest) — NEW

| # | Component | Module | Key Scenarios |
|---|-----------|--------|---------------|
| U-2.1 | `DataCard` | dna | Rendering, empty state, loading skeleton |
| U-2.2 | `TableWrapper` | dna | Rows, loading, empty, search, sort |
| U-2.3 | `DnaInput` | dna | Value binding, error state, required indicator |
| U-2.4 | `DnaSelect` | dna | Options rendering, selection, required indicator |
| U-2.5 | `DnaBadge` | dna | All status variants (critical, success, warning, info) |
| U-2.6 | `StatCard` | dna | Value formatting, label, trend indicator |
| U-2.7 | `SectionLabel` | dna | Required asterisk, label text |
| U-2.8 | `DashboardShell` | layout | Sidebar, header, children rendering |
| U-2.9 | `CascadingAddress` | ui | Province→City→District cascade, reset logic |
| U-2.10 | `ConfirmationDialog` | ui | Open, confirm, cancel, title/description |

### U-3: Frontend Integration Tests (Vitest + MSW)

| # | Integration | Key Scenarios |
|---|-------------|---------------|
| U-3.1 | Finance API client | Fund request CRUD, journal entry, payment verification |
| U-3.2 | Production API client | WO create/start, schedule result, leakage data |
| U-3.3 | R&D API client | Formula CRUD, lab test, revision lifecycle |
| U-3.4 | Warehouse API client | Stock catalog, requisitions, transfers |
| U-3.5 | Master Data API client | Customers, suppliers, categories, goods |

---

## Layer 3: E2E Business Process Testing (11-Step Golden Thread)

**Goal:** Test the complete business process from Lead → Repeat Order with real data flowing between divisions.

### GT-1: Lead Capture → Sample → Deal Flow

**File:** `tests/e2e/golden-thread/01-lead-to-deal.spec.ts`

```
Step 1: LEAD CAPTURE
  - Navigate to /bussdev/intake
  - Fill form: clientName, brandName, contactInfo (phone), source (Instagram), productInterest (Serum), moq, category
  - Verify PIC auto-assigned
  - Submit → verify redirect to /bussdev/client-manager
  - Verify lead appears in table with status NEW_LEAD

Step 2: LEAD FOLLOW-UP + SAMPLE REQUEST
  - Advance lead: CONTACTED (log activity WhatsApp)
  - Advance lead: SAMPLE_REQUESTED (log activity Sample Request)
  - API: verify /bussdev/lead/:id/activity-stream shows both events

Step 3: R&D SAMPLE DEVELOPMENT
  - Login as R&D user
  - Navigate to /rnd/inbox → verify sample request appears
  - Accept sample → advance through REV 1 → REV 2 → APPROVED

Step 4: SAMPLE SALES
  - Login as BD user
  - Navigate to /bussdev/sample-sales
  - Create sample sales order with approved sample reference
  - Set MOQ, price → verify sample sales appears in table

Step 5: NEGOTIATION
  - Advance lead: PENAWARAN → NEGO_MOQ → NEGO_HARGA → DRAFT_KONTRAK → DEAL
  - At each stage: verify activity log entry created
  - At DEAL: verify estimatedValue locked

Step 6: SALES ORDER (SO)
  - Navigate to /commercial/sales-orders
  - Create SO linked to lead → verify SO number generated
  - Verify SO appears in finance SO list
```

### GT-2: DP → Production → QC Flow

**File:** `tests/e2e/golden-thread/02-dp-to-qc.spec.ts`

```
Step 7: DOWN PAYMENT
  - Login as Finance user
  - Navigate to /finance/dp-penjualan
  - Upload bukti transfer, enter DP amount (50% of SO)
  - Submit → verify DP recorded, status PAID

Step 8: PRODUCTION
  - Login as Production user
  - Navigate to /production/work-orders
  - Create WO linked to SO → verify WO number, status PLANNING
  - Start production → status IN_PROGRESS
  - Create mixing schedule → assign formula → submit actuals
  - Create filling schedule → submit actuals
  - Create packing schedule → submit result
  - Verify WO timeline shows all stages

Step 9: QC
  - Login as QC user
  - Navigate to /qc/workbench
  - Scan/select finished batch
  - Enter QC parameters (pH, viscosity, color)
  - Submit QC report → verify status PASSED
  - Verify QC data appears in warehouse catalog
```

### GT-3: Delivery → Invoice → Payment → RO Flow

**File:** `tests/e2e/golden-thread/03-delivery-to-ro.spec.ts`

```
Step 10: DELIVERY
  - Login as Warehouse user
  - Navigate to /warehouse/release
  - Create delivery for SO → enter qty, add notes
  - Submit → verify status SHIPPING → DELIVERED

Step 11: INVOICE → PAYMENT → CLOSE
  - Login as Finance user
  - Navigate to /finance/invoices
  - Generate final invoice from delivery → verify DP deducted
  - Record payment → verify status PAID → CLOSED

Step 12: REPEAT ORDER
  - Login as BD user
  - Navigate to /bussdev/retention-engine
  - Verify client appears with Est. Empty Date in future
  - Trigger retention check → verify RO status
```

### GT-4: Cross-Divisional Integration Tests

| # | File | Flow | Divisions |
|---|------|------|-----------|
| GT-4.1 | `04-scm-procurement.spec.ts` | PR → PO → Inbound/GRN → Invoice → Payment | SCM, Finance, Warehouse |
| GT-4.2 | `05-legality-compliance.spec.ts` | HKI → BPOM → Halal → APJ Release → CKPB Audit | Legality, R&D, BussDev |
| GT-4.3 | `06-hr-lifecycle.spec.ts` | Employee create → KPI set → Attendance → Payroll | HR, Finance |
| GT-4.4 | `07-marketing-finance.spec.ts` | Ads data → Budget audit → Journal entry | Marketing, Finance |
| GT-4.5 | `08-finance-reports.spec.ts` | Trial Balance → Balance Sheet → P&L → Cash Flow | Finance |
| GT-4.6 | `09-warehouse-operations.spec.ts` | Inbound → Transfer → Opname → Adjustment → Release | Warehouse, Production |
| GT-4.7 | `10-creative-legal-flow.spec.ts` | Artwork → Client review → APJ review → Approval | Creative, Legality |

### GT-5: Error & Edge Case Flow

| # | File | Flow |
|---|------|------|
| GT-5.1 | `11-error-paths.spec.ts` | Invalid WO start → 400, Missing DP before production → blocked |
| GT-5.2 | `12-data-edge-cases.spec.ts` | Empty list safety, null foreign keys, duplicate SO numbers |
| GT-5.3 | `13-concurrent-ops.spec.ts` | Multiple users same lead, stage race conditions |

### GT-6: Frontend Page Rendering Audit (ALL 151 pages)

| # | File | Pages |
|---|------|-------|
| GT-6.1 | `14-page-audit-dashboard.spec.ts` | 9 dashboard routes |
| GT-6.2 | `15-page-audit-bussdev.spec.ts` | 15 bussdev routes |
| GT-6.3 | `16-page-audit-finance.spec.ts` | 23 finance routes |
| GT-6.4 | `17-page-audit-scm-warehouse.spec.ts` | 24 scm + warehouse routes |
| GT-6.5 | `18-page-audit-production.spec.ts` | 17 production routes |
| GT-6.6 | `19-page-audit-rd-qc.spec.ts` | 17 R&D + QC routes |
| GT-6.7 | `20-page-audit-legality-exec-hr.spec.ts` | 19 legality + executive + HR routes |
| GT-6.8 | `21-page-audit-mktg-logistics-creative-sys.spec.ts` | 14 marketing + logistics + creative + system routes |
| GT-6.9 | `22-page-audit-master-user.spec.ts` | 9 master + user + dna-preview routes |

Each page audit should verify:
- Page loads without error (no blank screen)
- No console errors
- Main heading/title visible
- Navigation works (breadcrumb/sidebar active state)
- DNA components render correctly

---

## Layer 4: Deployment Readiness

### DR-1: Docker Compose Verification

- [ ] `docker compose build` succeeds (backend + frontend + db)
- [ ] `docker compose up -d` starts all services
- [ ] Backend health check: `GET /api/system/health` → 200
- [ ] Frontend health check: `GET /` → 200, HTML renders
- [ ] PostgreSQL accessible at port 5432
- [ ] Prisma migrations run automatically (init-db.sh)
- [ ] Nginx reverse proxy routes correctly (prod config)
- [ ] SSL certificate works (prod config, certbot)

### DR-2: Performance Benchmarks

| Metric | Target | Test |
|--------|--------|------|
| Page Load (LCP) | < 1.5s per page | Playwright Web Performance API |
| API Response | < 300ms avg | k6 / artillery |
| Build Size | < 2MB per chunk | Next.js build output |
| Lighthouse | > 90 all scores | Playwright Lighthouse |
| DB Queries | < 50ms per query | Prisma query log |

### DR-3: Error Handling & Graceful Degradation

- [ ] 404 page renders for unknown routes
- [ ] API errors show user-friendly toast (not raw JSON)
- [ ] Network disconnection → offline indicator
- [ ] Token expiry → auto-redirect to login
- [ ] Rate limiting returns 429 with Retry-After
- [ ] CORS properly configured (prod domain)
- [ ] File uploads: size limit enforced, invalid types rejected
- [ ] Empty states: all tables show EmptyState component

### DR-4: Security Checklist

- [ ] All passwords hashed (bcrypt)
- [ ] JWT tokens expire properly
- [ ] All sensitive endpoints require authentication
- [ ] Role-based access enforced on all endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF tokens for state-changing operations
- [ ] File upload virus scanning (if applicable)
- [ ] HTTPS enforced in production
- [ ] Environment variables not exposed to client
- [ ] No secrets in git history

### DR-5: Data Integrity

- [ ] SO number auto-generation produces unique codes
- [ ] WO number auto-generation produces unique codes
- [ ] Invoice number sequencing is correct
- [ ] Prisma migrations run without data loss
- [ ] Seed data script works for fresh database
- [ ] Foreign key cascades prevent orphaned records
- [ ] Soft delete preserves referential integrity

### DR-6: Mobile Responsiveness

- [ ] Dashboard shell sidebar collapses on mobile
- [ ] Tables have horizontal scroll on small screens
- [ ] Forms stack vertically on mobile
- [ ] Modals/dialogs are usable on mobile
- [ ] Touch targets are >= 44px

### DR-7: VISUAL_DNA Compliance

- [ ] All pages use Inter font (globals.css)
- [ ] All number values use tabular-nums
- [ ] All labels use uppercase tracking
- [ ] Cards use rounded-24px (rounded-3xl)
- [ ] Badge colors match VISUAL_DNA hex values
- [ ] Dark mode / glassmorphism consistent
- [ ] Confirmation dialogs before all destructive actions
- [ ] Red asterisk `*` on all required fields
- [ ] Submission loading states prevent double-submit

---

## Test Execution Strategy

### Phase 1: Communication Protocol (Week 1)

Run the CP checklist for all ~319 endpoints:
```bash
# API smoke test all endpoints
cd tests && npx playwright test --config=playwright.config.ts communication-protocol.spec.ts
```

**Success Criteria:** 100% of endpoints return expected HTTP status codes.

### Phase 2: Unit Tests (Week 1-2)

Write and run all U-1 (backend service) and U-2 (frontend component) tests:
```bash
# Backend unit tests
cd backend && npm run test:unit
cd backend && npm run test -- --coverage

# Frontend unit tests
cd frontend && npx vitest run --coverage
```

**Success Criteria:** 80%+ code coverage on critical services, 100% on DNA components.

### Phase 3: Golden Thread E2E (Week 2)

Run the 11-step business flow tests:
```bash
# Golden Thread tests
cd tests && npx playwright test golden-thread/
cd frontend && npx playwright test tests/e2e/
```

**Success Criteria:** All golden thread tests pass end-to-end without manual intervention.

### Phase 4: Page Audit (Week 2-3)

Run the page rendering audit across all 151 pages:
```bash
# Page audit
cd frontend && npx playwright test tests/e2e/page-audit/
```

**Success Criteria:** Zero blank pages, zero console errors.

### Phase 5: Deployment Readiness (Week 3)

Run the full DR checklist:
```bash
# Docker build + health check
docker compose -f docker-compose.prod.yml up -d --build
curl -s http://localhost/api/system/health

# Performance audit
cd frontend && npx playwright test tests/e2e/PERFORMANCE_INTEGRITY_AUDIT.spec.ts

# Security audit
npm audit --production
```
**Success Criteria:** All DR checkboxes ticked.

---

## Test Infrastructure & Commands

### Configuration Files

| File | Framework | Description |
|------|-----------|-------------|
| `playwright.config.ts` (root) | Playwright | 4 projects: production-e2e, scm-e2e, scm-e2e-api, legality-e2e |
| `frontend/playwright.config.ts` | Playwright | Chromium, port 3001, frontend E2E |
| `frontend/vitest.config.ts` | Vitest | jsdom environment, MSW setup |
| `backend/package.json` (jest) | Jest | ts-jest, rootDir src, .spec.ts pattern |
| `backend/test/jest-e2e.json` | Jest | E2E config, .e2e-spec.ts |
| `backend/test/jest-unit.json` | Jest | Unit config, .unit-spec.ts |

### Quick Commands

```bash
# ===== BACKEND =====
cd backend
npm run test              # All backend tests (Jest)
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests only
npm run test:unit         # Unit tests only
npm run start:dev         # Start NestJS dev server (port 3002)

# ===== FRONTEND =====
cd frontend
npm run test              # All vitest tests
npm run test:watch        # Watch mode
npm run test:perf         # Performance audit (Playwright)
npx vitest run            # One-shot run
npx playwright test       # E2E tests (port 3001)
npx tsc --noEmit          # TypeScript check

# ===== ROOT E2E =====
npx playwright test       # Root-level E2E tests (port 3000)
npx playwright test --project=production-e2e
npx playwright test --project=scm-e2e
npx playwright test --project=legality-e2e
```

---

## Priority Matrix

| Priority | Layer | What to do | Effort | Impact |
|----------|-------|-----------|--------|--------|
| **P0** | CP+GT | Communication protocol + Golden Thread E2E | 3 days | Deployment blocker |
| **P1** | DR | Docker compose + Health check + Security | 1 day | Deployment blocker |
| **P2** | GT | Page audit (all 151 pages) | 2 days | UX quality |
| **P3** | U | Backend service unit tests (10 new) | 3 days | Code quality |
| **P4** | U | Frontend component unit tests (10 new) | 2 days | Component reliability |
| **P5** | GT | Error paths + edge cases | 1 day | Robustness |
| **P6** | DR | Performance benchmarks | 1 day | Production SLA |
| **P7** | DR | Mobile responsiveness | 1 day | Mobile UX |
| **P8** | U | Integration tests (5 new) | 2 days | API contract safety |

---

## Appendix A: Division-Specific Test Gaps

### Executive (0 tests)
- **Needs:** E2E for `/executive/dashboard`, `/executive/alerts`, `/executive/notifications`
- **Needs:** Unit test for `ExecutiveService.getMetrics()`

### HR (0 tests)
- **Needs:** E2E for employee CRUD, attendance, payroll, KPI
- **Needs:** Unit tests for payroll calculation, KPI scoring

### Logistics (0 tests)
- **Needs:** E2E for delivery order creation, fleet status
- **Needs:** Unit test for `LogisticsService.deliver()`

### Creative (0 tests)
- **Needs:** E2E for task board, artwork upload, APJ/client review
- **Needs:** Unit test for `CreativeService` version/lock/unlock

### Master Data (0 tests)
- **Needs:** E2E for customer, supplier, goods, category CRUD
- **Needs:** Integration test for cascading address component

### R&D (1 partial screenshot test)
- **Needs:** E2E for formula editor, lab test entry, revision tracker
- **Needs:** Unit test for formula validation (100% dosage rule)

### Finance Backend (0 service tests)
- **Needs:** Unit tests for FinanceService, JournalService, COAService, FundRequestService

### Production Backend (0 service tests)
- **Needs:** Unit tests for ProductionService, ScheduleService, LeakageService, ReconciliationService

### QC Backend (0 service tests)
- **Needs:** Unit tests for QCAuditService, QCChecklistService, QCAnalyticsService

### Marketing Backend (0 service tests)
- **Needs:** Unit tests for MarketingService.ROICalculator, FunnelEfficiencyService

---

## Appendix B: Framework References

- **Playwright:** https://playwright.dev/docs/intro
- **Vitest:** https://vitest.dev/guide/
- **Jest:** https://jestjs.io/docs/getting-started
- **MSW:** https://mswjs.io/docs/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **k6 (performance):** https://k6.io/docs/
- **OWASP (security):** https://owasp.org/www-project-top-ten/
