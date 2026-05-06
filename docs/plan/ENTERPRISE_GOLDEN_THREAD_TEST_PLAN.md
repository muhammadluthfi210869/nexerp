# Enterprise Full-Stack Integrity & Golden Thread Plan (ERP V4)

## 1. Executive Summary
This document outlines the comprehensive strategy for validating the end-to-end integrity of the Porto Aureon ERP system. The goal is to eliminate the "Sync-Gap" between Frontend (FE) and Backend (BE) by implementing a cross-divisional testing architecture that mirrors real-world business operations.

## 2. The Problem: Fragmentation & Schema Drift
While individual backend services may pass unit tests, the frontend often fails due to:
- **Payload Mismatch**: FE sends data in a format the BE doesn't expect.
- **State Desync**: FE assumes a transaction is complete, but BE has it in a "Pending" state.
- **Divisional Silos**: A change in R&D (Formula) breaks Production (Work Order) because they share data structures that aren't synchronized.

## 3. The "Golden Thread" Methodology
We will not just test buttons; we will test **Business Lifecycles**. A "Golden Thread" is a test case that spans multiple divisions to ensure data integrity across the entire organization.

### Thread 1: The Revenue Lifecycle (Lead-to-Cash)
*Validates the flow of money into the company.*
- **Marketing**: Create a Lead -> Convert to Opportunity.
- **Bussdev**: Generate Quotation -> Create Sales Order (SO).
- **Legal**: Verify Contract/Terms for the SO.
- **Finance**: Generate Down Payment Invoice -> Verify Payment.
- **Output**: Validated Revenue Stream & Financial Ledger.

### Thread 2: The Production Lifecycle (Idea-to-Stock)
*Validates the creation of value.*
- **R&D**: Create Product Formula (BOM) -> Define Packaging Spec.
- **SCM**: Check Raw Material Stock -> Create Purchase Order (PO) for missing items.
- **Warehouse**: Inbound PO -> Quality Control (QC) Inspection.
- **Production**: Create Work Order (WO) -> Record Material Usage -> Finish WO.
- **Warehouse**: Auto-receive Finished Goods.
- **Output**: Inventory Accuracy & Cost of Goods Sold (COGS).

### Thread 3: The People & Compliance Lifecycle
- **HR**: Employee Onboarding -> Set Salary & Grade.
- **HR**: Record Attendance -> Generate Monthly Payroll.
- **Finance**: Verify Payroll Expense -> Post to General Ledger.
- **Output**: HR-Finance Synchronization & Audit Trail.

## 4. Technical Implementation Strategy

### Layer 1: Contractual Integrity (The "Triple Lock")
1. **Schema-First Types**: Use `backend/prisma/schema/*.prisma` as the single source of truth.
2. **API Client Auto-Gen**: Regenerate `frontend/src/types/api.ts` on every BE change.
3. **Zod Validation**: Intercept every API response in the FE and validate it against the expected schema at runtime.

### Layer 2: E2E Playwright Automation
We will implement a `tests/e2e/golden-threads/` directory. Each spec will:
1. **Login** as the relevant persona (Marketing Manager, Warehouse Staff, etc.).
2. **Execute** the sequence of actions across different dashboard modules.
3. **Verify** BE state changes by querying the database or checking "History/Logs" in the UI.

### Layer 3: Cross-Divisional Gatekeepers
Test cases specifically designed to fail if business rules are violated:
- *Gate 1*: Production cannot start if SCM has not fulfilled the BOM raw materials.
- *Gate 2*: Finance cannot pay a vendor if the Warehouse hasn't marked the items as "Received & QC Passed".
- *Gate 3*: HR cannot process payroll if Legal hasn't uploaded the Employee Contract.

## 5. Execution Roadmap

| Phase | Focus | Key Deliverable |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | Fix all current TypeScript errors in FE and sync with BE Swagger. |
| **Phase 2** | **Master Data** | E2E tests for Master Products, Suppliers, and Users. |
| **Phase 3** | **Core Operations** | Implement "Thread 2" (Production Lifecycle). |
| **Phase 4** | **Commercial** | Implement "Thread 1" (Revenue Lifecycle). |
| **Phase 5** | **Executive Audit** | Validate all Analytics & Financial Reporting dashboards. |

## 6. Definition of Done (DoD) for Integration
- [ ] FE types are 100% synchronized with BE Prisma/Swagger.
- [ ] No "Any" types used in FE API calls.
- [ ] Playwright "Golden Thread" suite runs daily without flakiness.
- [ ] API responses are wrapped in a standard `EnterpriseResponse` interface.

---
*Created by: Antigravity (World-Class QA & SDET)*
