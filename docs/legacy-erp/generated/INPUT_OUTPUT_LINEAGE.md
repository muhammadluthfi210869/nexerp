# NEX ERP — Input/Output Lineage

> GENERATED VIEW — NOT AUTHORITATIVE. DO NOT EDIT DIRECTLY. Edit the owning contracts and run `node scripts/ssot/validate_ssot.js`.

This compact projection exposes the currently available requirement-to-interface lineage. Missing actor, owner, event, permission, or test links remain certification blockers and must be added to canonical source contracts, not here.

| Requirement | Rules | Entities / storage | API input/output interface | Screens / actors |
|---|---|---|---|---|
| REQ-001 | BUS-RULE-026 | Supplier | POST /api/v1/suppliers/import | SCR-013 |
| REQ-002 | BUS-RULE-014 | Customer | PATCH /api/v1/customers/{id} | SCR-011 |
| REQ-003 | BUS-RULE-020 | Supplier, Coa | GET /api/v1/coa | SCR-013 |
| REQ-004 | BUS-RULE-003 | SalesInvoice, PurchaseInvoice | PATCH /api/v1/sales/sales-invoices/{id}<br>PATCH /api/v1/purchase/invoices/{id} | SCR-035 |
| REQ-005 | BUS-RULE-018 | PurchaseInvoice | POST /api/v1/purchase/invoices/import | SCR-061 |
| REQ-006 | BUS-RULE-017 | PurchaseInvoiceDetail | POST /api/v1/purchase/invoices/{id}/lines | SCR-062 |
| REQ-007 | — | PurchaseInvoice, SalesInvoice | GET /api/v1/purchase/invoices?status=unpaid | SCR-061 |
| REQ-008 | BUS-RULE-023 | PurchaseInvoice | GET /api/v1/purchase/invoices/{id} | SCR-062 |
| REQ-009 | — | PurchasePayment, SalesPayment | GET /api/v1/purchase/payments | SCR-068 |
| REQ-010 | BUS-RULE-059 | PurchaseInvoice | GET /api/v1/reports/ap-aging | SCR-130 |
| REQ-011 | BUS-RULE-059 | PurchaseInvoice | GET /api/v1/reports/ap-aging | SCR-130 |
| REQ-012 | — | CashBank | GET /api/v1/finance/cash-banks/balance | SCR-130 |
| REQ-013 | BUS-RULE-003, BUS-RULE-005, BUS-RULE-023 | SalesInvoice | POST /api/v1/sales/sales-invoices/import | SCR-035 |
| REQ-014 | BUS-RULE-002, BUS-RULE-004 | SalesDownPayment | GET /api/v1/sales/down-payments?category= | SCR-029 |
| REQ-015 | BUS-RULE-007 | SalesPayment, JournalEntry | POST /api/v1/sales/sales-payments | SCR-043 |
| REQ-016 | BUS-RULE-069 | — | GET /api/v1/reports/sales-summary | SCR-042 |
| REQ-017 | BUS-RULE-010, BUS-RULE-058 | SalesInvoice | GET /api/v1/reports/ar-aging | SCR-DASH-013 |
| REQ-018 | — | CashBank | GET /api/v1/finance/cash-banks | SCR-103 |
| REQ-019 | — | CashBank | GET /api/v1/finance/cash-banks | SCR-104 |
| REQ-020 | — | JournalLine, Coa | GET /api/v1/finance/bank-recon | SCR-115 |
| REQ-021 | — | FundRequest | POST /api/v1/finance/fund-requests | SCR-116 |
| REQ-022 | — | FundRequest | POST /api/v1/finance/fund-requests/{id}/approve | SCR-116 |
| REQ-023 | — | FundRequest | POST /api/v1/finance/fund-requests/{id}/approve | SCR-116 |
| REQ-024 | BUS-RULE-056 | JournalEntry | GET /api/v1/finance/journal-entries | SCR-105 |
| REQ-025 | — | — | GET /api/v1/search | ALL |
| REQ-026 | — | — | — | ALL |
| REQ-027 | BUS-RULE-067 | FixedAsset | POST /api/v1/finance/fixed-assets<br>GET /api/v1/finance/fixed-assets/{id}/history | SCR-110 |
| REQ-028 | BUS-RULE-102 | — | GET /api/v1/system/sequence/next | SCR-SYS-001 |
| REQ-029 | BUS-RULE-070 | JournalLine | GET /api/v1/reports/profit-loss | SCR-123 |
| REQ-030 | — | — | — | — |
| REQ-031 | BUS-RULE-021, BUS-RULE-091 | Goods, PurchaseOrder | GET /api/v1/purchase/orders?status=pending | SCR-050 |
| REQ-032 | BUS-RULE-011 | Checklist | PATCH /api/v1/sales/sales-orders/{id}/checklist/{itemId}/deadline | SCR-117 |
| REQ-033 | BUS-RULE-017, BUS-RULE-018, BUS-RULE-019 | PurchaseOrder, GoodsReceipt | POST /api/v1/purchase/orders<br>POST /api/v1/purchase/goods-receipts | SCR-053 |
| REQ-034 | BUS-RULE-021, BUS-RULE-053 | Goods, GoodsReceipt, Checklist | GET /api/v1/reports/stock<br>POST /api/v1/reports/goods-receipts | SCR-055 |
| REQ-035 | BUS-RULE-072, BUS-RULE-090, BUS-RULE-106 | EmployeePerformance, EmployeeKpiResult, KpiDefinition | GET /api/v1/employees/{id}/kpi | SCR-179 |
| REQ-036 | BUS-RULE-074, BUS-RULE-106 | EmployeeRoleAssignment, EmployeeKpiResult | POST /api/v1/employees/{id}/kpi/recalculate | SCR-179 |
| REQ-037 | BUS-RULE-091, BUS-RULE-092, BUS-RULE-094 | Note, Comment, Tag, Notification | POST /api/v1/entities/{type}/{id}/notes<br>POST /api/v1/entities/{type}/{id}/comments<br>POST /api/v1/entities/{type}/{id}/tags | SCR-179 |
| REQ-038 | BUS-RULE-107 | SalesSample, Formulation | POST /api/v1/rnd/sample/{id}/request-payment<br>POST /api/v1/rnd/sample/{id}/verify-payment<br>GET /api/v1/rnd/samples | SCR-182 |
| REQ-039 | BUS-RULE-110, BUS-RULE-111 | DesignTask, DesignVersion, DesignFeedback | GET /api/v1/creative/finalized<br>GET /api/v1/creative/tasks/{id}/history<br>PATCH /api/v1/creative/task/{id}/client-review<br>PATCH /api/v1/creative/task/{id}/unlock | SCR-180, SCR-181 |
| REQ-040 | BUS-RULE-112 | HkiRecord, BpomRecord, HalalRecord, LegalTimelineLog | GET /api/v1/legality/permits<br>GET /api/v1/legality/expiry<br>POST /api/v1/legality/hki<br>POST /api/v1/legality/bpom<br>POST /api/v1/legality/halal | SCR-183, SCR-184 |
| REQ-041 | BUS-RULE-108, BUS-RULE-109, BUS-RULE-114 | Formulation, FormulationAdjustment | PATCH /api/v1/rnd/formulas/{id}<br>POST /api/v1/rnd/formulas/{id}/revision | SCR-027 |
| REQ-042 | BUS-RULE-113 | AuditLog | — | ALL |
