# 🛡️ V4 System Validation Plan: SCM, Warehouse & Production
**Objective**: Guarantee 100% operational integrity, event-driven reliability, and financial auditability of the unified ERP state machine.

---

## 1. Executive Summary
This validation plan outlines the rigorous testing protocols required to verify the "Phase 4: Unified Communication Protocol". We will move beyond simple CRUD testing to **Behavioral Flow Validation**, ensuring that every event (Production Finish, PO Receipt) triggers the correct downstream cascades in Inventory and Finance without manual intervention.

---

## 2. Testing Layers & Architecture

### A. Unit Validation (Service Level)
*   **StockLedgerService**: Verify that `recordMovement` correctly increments/decrements `MaterialItem` cache and creates `InventoryTransaction` in a single transaction.
*   **ProductionService**: Verify `EventEmitter2` triggers during `updateScheduleResult`.
*   **CommunicationProtocolService**: Verify handlers correctly calculate stock deductions based on `stepDetails`.

### B. Integration Validation (Event-Bus)
*   **The Golden Thread**: Test the link between `production.schedule.finished` -> `StockLedger` -> `JournalEntry`.
*   **The Inbound Loop**: Test `warehouse.inbound.approved` -> `MaterialInventory (Batch)` -> `Payable Invoice`.
*   **Audit Consistency**: Ensure every `OnEvent` creates a corresponding `StateTransitionLog`.

### C. E2E Operational Scenarios (UI-to-DB)
*   **The Full Cycle**: PO Creation → Goods Receipt → Stock Update → Production Work Order → Material Release → Production Terminal Output → Finished Goods Inventory → Financial Posting.

---

## 3. High-Priority Test Cases

### Scenario 1: The Procurement-to-Stock Loop
| ID | Action | Expected Outcome | Verification |
| :--- | :--- | :--- | :--- |
| **P1.1** | Approve Inbound for PO-001 | Inbound status changes to `APPROVED`. | `WarehouseInbound.status === 'APPROVED'` |
| **P1.2** | Automated Stock Increase | `MaterialItem.stockQty` increases by exact GRN amount. | `StockLedgerService` audit log generated. |
| **P1.3** | Automated Journaling | A `PAYABLE` invoice and Journal Entry are created. | `Invoice` table contains link to `poId`. |
| **P1.4** | Batch Generation | A new `MaterialInventory` batch is created with `AUTO-` prefix. | Batch visible in Warehouse Hub. |

### Scenario 2: The Production Consumption Loop
| ID | Action | Expected Outcome | Verification |
| :--- | :--- | :--- | :--- |
| **T2.1** | Finish Mixing Schedule | `production.schedule.finished` emitted. | Terminal UI shows `COMPLETED` status. |
| **T2.2** | Automated Deduction | Warehouse stock for materials used in Mixing is decremented. | `InventoryTransaction` type `OUTBOUND`. |
| **T2.3** | Real-time HPP | Finance Journal Entry created for WIP cost. | `JournalEntry` reference contains `PROD-COST-`. |
| **T2.4** | Audit Trail | `StateTransitionLog` created for `PRODUCTION_SCHEDULE`. | Visible in **Audit Ledger** Dashboard. |

### Scenario 3: Anomaly & Guardrail Testing
| ID | Action | Expected Outcome | Verification |
| :--- | :--- | :--- | :--- |
| **G3.1** | Negative Stock Guard | Transaction should fail if stock is insufficient (if configured). | `BadRequestException` thrown. |
| **G3.2** | Invalid State Jump | Attempting to finish a schedule that hasn't started. | System enforces state machine flow. |
| **G3.3** | Atomic Failure | If Journal posting fails, Stock movement must ROLLBACK. | Database remains in consistent pre-test state. |

---

## 4. UI/UX Regression Suite
*   [ ] **Sidebar Navigation**: Verify "System Control" section is visible to Super Admins.
*   [ ] **Audit Ledger**: Verify real-time polling (10s) updates the feed with new events.
*   [ ] **Terminal Responsiveness**: Verify result submission triggers immediate UI feedback.
*   [ ] **Batch Records**: Verify drill-down shows correct material consumption totals.

---

## 5. Success Metrics (The "Zero-Error" Bar)
1.  **Zero Orphans**: Every Stock Movement must have a parent `InventoryTransaction`.
2.  **Financial Balance**: Every Production Event must have a balanced Debit/Credit in the Ledger.
3.  **Audit Fidelity**: 100% of state changes must be recorded in the `StateTransitionLog`.
4.  **Uptime**: Event Bus must handle concurrent production terminal submissions without race conditions.

---

## 6. Execution Timeline
- **Phase A (Unit/Integration)**: 1 Day
- **Phase B (E2E Manual Walkthrough)**: 1 Day
- **Phase C (Stress/Anomaly Testing)**: 1 Day
- **Final Sign-off**: End of Week

---
**Prepared by**: Antigravity AI
**Status**: Ready for Execution
