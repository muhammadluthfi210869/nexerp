# 🧪 Ultimate R&D Backend Testing Plan
**Module:** Research & Development (R&D) V4
**Standard:** Enterprise Grade / High Precision Laboratory ERP
**Objective:** Zero-Leaked Logic & 100% Data Integrity for Chemical Formulations

---

## 1. Core Logic & Validation (Hard-Gates)
These are the non-negotiable rules that govern the R&D module.

### 1.1. The 100% Rule (Law of Mass Conservation)
- **Scenario:** Creating or Updating a Formula.
- **Logic:** Sum of `dosagePercentage` across all phases must be exactly `100.000%`.
- **Test Cases:**
    - [ ] **Exact Match:** Submit formula with total exactly 100.00000. (Expect: `SUCCESS`)
    - [ ] **Precision Boundary (Under):** Submit 99.99999. (Expect: `FAIL - 400 Bad Request`)
    - [ ] **Precision Boundary (Over):** Submit 100.00001. (Expect: `FAIL - 400 Bad Request`)
    - [ ] **Empty Items:** Submit 0 items. (Expect: `FAIL`)
    - [ ] **Negative Dosage:** Submit item with `-5%`. (Expect: `FAIL`)

### 1.2. The Production Gate (Anti-Dummy System)
- **Scenario:** Locking a formula for Production (`status: PRODUCTION_LOCKED`).
- **Logic:** Backend must reject locking if any `FormulaItem` has `isDummy: true`.
- **Test Cases:**
    - [ ] **Pure SCM Formula:** All items are real materials from SCM. (Expect: `SUCCESS`)
    - [ ] **Hidden Dummy:** 1 item in Phase C is a dummy. (Expect: `FAIL - 400 Bad Request`)
    - [ ] **Mixed Dummy:** Material ID exists but `isDummy` is true. (Expect: `FAIL`)

### 1.3. Payment Verification Gate
- **Scenario:** Moving Sample from `QUEUE` to `FORMULATING`.
- **Logic:** `isPaymentVerified` must be `true` in `SampleRequest`.
- **Test Cases:**
    - [ ] **Unpaid Sample:** R&D tries to accept sample where `isPaymentVerified: false`. (Expect: `FAIL - 400 Bad Request`)
    - [ ] **Paid Sample:** Finance has verified, R&D accepts. (Expect: `SUCCESS`)

---

## 2. Dynamic Calculations (The Chemistry Engine)

### 2.1. Yield & Weight Conversion
- **Formula:** `(dosagePercentage / 100) * targetYieldGram`.
- **Test Cases:**
    - [ ] **Standard Yield (1kg):** 5% dosage -> 50g.
    - [ ] **Small Yield (20g):** 0.5% dosage -> 0.1g. (Verify decimal precision in DB)
    - [ ] **Large Yield (500kg):** 20% dosage -> 100kg.

### 2.2. Live HPP Costing
- **Formula:** `SUM(dosagePercentage * costSnapshot / 100)`.
- **Test Cases:**
    - [ ] **Accuracy:** Verify backend HPP matches manual calculation for 10+ ingredients.
    - [ ] **Null Cost:** Item has no price in SCM. (Expect: `HPP 0` or `Warning`, but must not crash).
    - [ ] **Dummy Cost:** Dummy items use `dummyPrice` for calculation.

---

## 3. Version Control & Immutability

### 3.1. Revisioning (Cloning Logic)
- **Scenario:** `createRevision(formulaId)`.
- **Logic:** Deep copy of Phases, Items, and QC Parameters; Old version -> `SUPERSEDED`.
- **Test Cases:**
    - [ ] **Increment:** V1 -> V2 (Check version number).
    - [ ] **Status Change:** Verify V1 status becomes `SUPERSEDED`.
    - [ ] **Deep Copy:** Update Phase A in V2; verify Phase A in V1 remains unchanged.
    - [ ] **ID Consistency:** New Formula ID follows `F-YYMM-XXX` sequence.

### 3.2. Immutability of Locked Formula
- **Scenario:** Update request to a `LOCKED` or `PRODUCTION_LOCKED` formula.
- **Logic:** Backend must reject `PATCH/PUT` requests.
- **Test Cases:**
    - [ ] **Lock Bypass:** Try to update a locked formula via API. (Expect: `FAIL - 403/400`)

---

## 4. Cross-Module Integration (The Bridge)

### 4.1. R&D ↔ BusDev Handover
- [ ] **Trigger:** `advanceSampleStage` to `APPROVED`.
- [ ] **Effect:** `SalesLead.stage` must automatically update to `SAMPLE_APPROVED`.
- [ ] **Activity Log:** Verify `ACTIVITY_EVENT` is emitted with `eventType: HANDOVER`.

### 4.2. R&D ↔ Legal (INCI Dispatcher)
- [ ] **Logic:** `generateInci(formulaId)` returns items sorted by `%` DESC.
- [ ] **Test Case:** Item 1 (80%), Item 2 (5%), Item 3 (15%). (Expect: Item 1, Item 3, Item 2).

### 4.3. R&D ↔ Production (Batch Record Generation)
- [ ] **Logic:** Ensure weights are calculated correctly for any given SPK Quantity (e.g., 50kg, 1000kg).

---

## 5. Security & Access Control

### 5.1. Role-Based Access (RBAC)
- [ ] **RND Role:** Can Create/Update/Lock formulas assigned to them.
- [ ] **SALES Role:** Can view Pipeline, but cannot edit Phase Builder.
- [ ] **FINANCE Role:** Can view HPP, but cannot edit Chemistry logic.

---

## 6. Database Integrity & Stress Testing

### 6.1. Transaction Atomicity
- [ ] **Update Failure:** Mock a database error during Phase recreation. Verify that the entire formula is NOT deleted (Rollback).

### 6.2. Concurrency (ID Generator)
- [ ] **Race Condition:** Two analysts create a formula at the exact same millisecond. (Expect: No duplicate IDs, no primary key violations).

### 6.3. Orphan Cleanup
- [ ] **Cascade Delete:** Delete a `Formula`. Verify `FormulaPhase` and `FormulaItem` are also deleted.

---

## 7. Performance Benchmarking
- [ ] **Complex Formula:** Formula with 5 phases and 50+ ingredients. (Expect: Update time < 500ms).
- [ ] **Dashboard Metrics:** Calculate metrics for 10,000+ sample requests. (Expect: Response time < 1s).

---

> [!IMPORTANT]
> All automated tests must run against the `test.db` and use mocks for external event emitters to ensure deterministic results.
