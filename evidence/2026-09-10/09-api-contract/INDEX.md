# API_CONTRACT.yaml v0.1 — First-Cut Summary

**Generated**: 2026-09-10T07:07:38.231Z
**Source**: NEX_ERP_SCREEN_AND_API_CATALOG.json v2.0.0 (176 screens)
**Total endpoints**: 49
**Critical flows covered**: 7
**Tag distribution**: MOD-04=8, MOD-01=28, MOD-02=2, MOD-03=4, MOD-12=6, MOD-05=1

## Endpoint Index by Flow

### PO Inbound Flow (5 picked)
- SCR-058 | /scm/purchase-approval | Approval List
- SCR-090 | /master/purchase-return-out | List
- SCR-091 | /master/purchase-in | List
- SCR-104 | /scm/purchase-down-payment | List
- SCR-105 | /scm/purchase-down-payment/create | Form

### SO Pipeline Flow (2 picked)
- SCR-001 | /bussdev/dashboard-guest-book | Dashboard
- SCR-022 | /rnd/dashboard-sample | Dashboard

### Closing Period Flow (2 picked)
- SCR-070 | /master/closing-checklist | Financial Checklist & Period Governance
- SCR-074 | /master/adjustment-journal | Special Approval Journal

### Escrow Flow (1 picked)
- SCR-077 | /master/client-escrow | Trust Fund / Escrow Ledger

### Approval Workflow (3 picked)
- SCR-059 | /master/sales-approval | Approval List
- SCR-060 | /rnd/sales-sample-approval | Approval List
- SCR-061 | /master/goods-request-approval | Approval List

### Master Data (representative) (5 picked)
- SCR-029 | /master/goods-manage | Master List
- SCR-032 | /master/coa-manage | Master List
- SCR-043 | /master/customer-manage/create | Form
- SCR-057 | /scm/supplier-manage/create | Form
- SCR-087 | /master/delivery-out/create | Form

### Dashboard & Report (representative) (3 picked)
- SCR-007 | /executive/dashboard-executive | Dashboard
- SCR-008 | /executive/dashboard-warehouse | Dashboard
- SCR-009 | /executive/dashboard-human-resources | Dashboard

## Tag Distribution

- MOD-04: 8 endpoints
- MOD-01: 28 endpoints
- MOD-02: 2 endpoints
- MOD-03: 4 endpoints
- MOD-12: 6 endpoints
- MOD-05: 1 endpoints

## Coverage Gap

Total screens in catalog: 176
Covered in this first-cut: 49 (~28%)

**Missing coverage** (next iteration priorities):
1. All 107 MOD-01 screens need CRUD endpoints (we covered ~6)
2. All 25 MOD-04 SCM screens (we covered ~5)
3. All 12 MOD-02 BusDev screens (we covered ~1)
4. Approval engines: 8 approval screens (we covered ~3)
5. Production: 0 MOD-06 (no screens in catalog - ADR-002 must re-nest)
6. Finance: 0 MOD-10 (no screens in catalog - ADR-002 must re-nest)

## Next Actions

1. Backend team review each endpoint, validate against controller implementation
2. Add detail endpoints /v1/<route>/{id} for representative screens
3. Add bulk operations where applicable (PO batch GR, SO batch approve)
4. Add search/filter parameters from JSON catalog cards[] array
5. Generate TypeScript types via openapi-typescript-codegen
6. Validate response shape against @nestjs/swagger decorators in backend
