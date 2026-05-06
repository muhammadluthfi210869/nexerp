# 🏗️ INTEGRATED PIPELINE PROTOCOL: Implementation Plan

## 📌 OVERVIEW
This plan establishes a 100% synchronized, cross-divisional workflow for Business Development (BD), Finance, R&D, and Production. It ensures data integrity through an **Immutable Ledger** system and real-time synchronization using **WebSockets**.

---

## 🛠️ PHASE 1: DATABASE & INFRASTRUCTURE [BACKEND]
**Goal:** Establish the data foundation for locking and parallel execution.

### 1.1 Database Schema (Prisma)
Update `bussdev.prisma` and `finance.prisma`:
*   **SalesLead**: Add `formulaId` (String, Optional), `spkFileUrl` (String, Optional), `isFormulaLocked` (Boolean).
*   **SalesActivity**: Ensure fields for `fileUrl`, `fileUrlSecondary`, `amount`, and `metadata` (JSON for specific stage data).
*   **BussdevStaff**: Add performance metrics tracking.
*   **Formula**: New Model for R&D records (`id`, `leadId`, `version`, `composition`, `status`).

### 1.2 File Service
*   Implement `FileStorageService`: Local VPS storage with 5MB strict limit.
*   Path logic: `/uploads/bussdev/[leadId]/[stage_name]/file.pdf`.

### 1.3 EventEmitter2 Setup
*   Implement `BussdevEvents`:
    *   `lead.stage_updated`
    *   `finance.payment_validated`
    *   `rnd.formula_locked`
    *   `warehouse.order_shipped`

---

## ⚙️ PHASE 2: STATE MACHINE & BUSINESS LOGIC [BACKEND]
**Goal:** Implement the "Gembok" (Locking) logic and automated calculations.

### 2.1 Formula ID Generator
*   Format: `F-YYMM-[SEQ]`.
*   Logic: Query current month count and increment.

### 2.2 Finance Validation Endpoint
*   `PATCH /finance/validate-payment/:activityId`:
    *   Checks if user is `FINANCE` or `SUPER_ADMIN`.
    *   Updates `paymentStatus` and triggers parallel events (APJ/Designer/SCM).

### 2.3 Ready to Ship Calculator
*   Service method to fetch `estimatedValue` from Lead vs `amount` from validated Finance activities.
*   Expose via `GET /bussdev/lead/:id/balance`.

---

## 📡 PHASE 3: REAL-TIME SYNC (WEBSOCKET) [BACKEND/FRONTEND]
**Goal:** Zero-latency notifications and live badge updates.

### 3.1 Socket.io Gateway
*   Room logic: `joinRoom('finance')`, `joinRoom('bd')`.
*   Emit `NOTIFY_FINANCE` when BD uploads proof of payment.
*   Emit `NOTIFY_BD` when Finance validates or Warehouse ships.

### 3.2 Frontend HUD Integration
*   Use `useSocket` hook in `Sidebar.tsx` to update notification badges.
*   Real-time `toast` notifications for stage transitions.

---

## 🎨 PHASE 4: FRONTEND HUD & ACTION CENTER [FRONTEND]
**Goal:** Premium UI/UX that reflects the "Gembok" system.

### 4.1 Dynamic Action Dialog
*   **State-based Forms**:
    *   `CONTACTED`: Single upload (Quotation).
    *   `CLOSING SAMPLE`: Dual fields (PNF Summary + Bukti Bayar).
    *   `DEAL`: Dual upload (SPK + Proof of DP).
*   **Locking UI**:
    *   Check `lead.lastActivity.isValidated` status.
    *   If false: Set button to `Disabled`, color `bg-slate-800`, text "🔒 Menunggu Validasi Finance".
    *   **SUPER_ADMIN Bypass**: Show "⚡ BYPASS VALIDATION" button in red.

### 4.2 Immutable Ledger Component
*   Disable `Edit` and `Delete` buttons for all activities.
*   Add "Koreksi" button that opens a new log entry typed as `CORRECTION`.

---

## 🔄 PHASE 5: CROSS-DIVISIONAL INTEGRATION
**Goal:** Parallel execution of APJ, Designer, SCM, and Warehouse.

### 5.1 Parallel Event Handlers
When `DEAL_VALIDATED` is fired:
1.  **APJ**: Create record in `LegalityQueue`.
2.  **Designer**: Create record in `DesignTask`.
3.  **SCM**: Trigger `BoMCheck` process.

---

## 🧪 TESTING & VERIFICATION PROTOCOL

### T1: The "Gembok" Integrity Test
1.  BD uploads `CLOSING SAMPLE` docs.
2.  Verify BD button turns to "🔒 Menunggu Validasi Finance".
3.  Verify R&D cannot see the lead in their active pipeline yet.
4.  Finance validates -> Verify R&D gembok opens instantly (WebSocket).

### T2: Super Admin Bypass Test
1.  Repeat T1.
2.  Use Super Admin account to click "BYPASS".
3.  Verify flow proceeds to next stage without Finance intervention.

### T3: Calculation Precision Test
1.  Lead Value: Rp 100.000.000.
2.  DP Validated: Rp 50.000.000.
3.  Verify "Ready to Ship" screen shows exactly "Sisa Tagihan: Rp 50.000.000".

### T4: Multi-file Validation Test
1.  Attempt to submit `DEAL` with only `SPK` (missing Bukti DP).
2.  Verify Backend returns 400 Bad Request and UI shows error.

---

## 🗓️ TIMELINE (ESTIMATED)
*   **Phase 1 & 2**: 2 Days (Core logic & DB).
*   **Phase 3 & 4**: 2 Days (WebSocket & Frontend HUD).
*   **Phase 5 & Testing**: 1 Day (Integration & QA).
