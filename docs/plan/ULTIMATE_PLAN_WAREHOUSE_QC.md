# Ultimate Plan: Warehouse & Packaging Design V4

This plan outlines the complete transformation of the **Creative & Packaging Design** module and the hardening of the **Warehouse (Gudang)** division to reach the "V4 World-Class" standard.

## I. Gap Analysis Report

Based on the analysis of the current codebase vs. `design-packing.md` and `warehouse.md`:

| Layer | Module: Creative / Packaging Design | Module: Warehouse (Gudang) |
| :--- | :--- | :--- |
| **Database** | **Gap: 65%** - Basic `DesignTask` exists, but missing: Versioning History (Immutable), Kanban States, Feedback Logs, and SLA tracking. | **Gap: 15%** - Schema is solid but needs `WIP_RETURN` tracking and tighter `FEFO_ENFORCEMENT` flags. |
| **Backend** | **Gap: 75%** - Lacks the State Machine logic, Strict Routing, Broadcasters (Webhooks/SSE), and Revision Cap logic. | **Gap: 20%** - Needs OEE calculation engine, automated COGS absorption from loss, and FEFO hardware/UI locking. |
| **Frontend** | **Gap: 85%** - Missing Kanban Board, Micro-Dashboard KPI, and the "Design Hub" Right Drawer UI. Current UI is a simple card list. | **Gap: 25%** - Dashboard is excellent (Premium), but sub-pages (Inbound/Transfer) lack the same "Silent Luxury" polish. |

---

## II. Technical & Business Decisions (V4 Implementation)

Based on the recent alignment, the following technical and business rules are finalized:

1.  **Absolute Module Isolation**: The **Creative & Packaging Design** module is an independent entity in the "Pre-Production" stage. It is NOT part of the Warehouse. It acts as a **Producer** of assets (Ai/PDF) and status events, while the Warehouse/SCM acts as a **Consumer**.
2.  **MVP File Infrastructure**: We will use **Local Storage** (on-server) located in `backend/uploads/creative_assets/`. 
    *   *Hard Limits*: Mockups (JPG/PNG) max 5MB, Master Files (Ai/PDF/CDR) max 50MB.
    *   *Scalability*: Architecture will support future migration to S3/GCP.
3.  **Lightweight Communication**: **Server-Sent Events (SSE)** will be used for one-way status broadcasting (Server → BusDev/Designer). This minimizes RAM overhead compared to Socket.io.
4.  **Internal E-Signature**: APJ (Legal) approval will use a **6-Digit Encrypted PIN** (Bcrypt/Argon2). 
    *   *Audit Trail*: Every approval will log `user_id`, `timestamp`, and `IP_address`.
    *   *Compliance*: Equivalent to internal 21 CFR Part 11 standards.
5.  **Soft-Block Revision Cap**: After the 3rd revision, the system will **freeze the Designer's upload capability**. 
    *   *BusDev Intervention*: BusDev must choose between `[Unlock & Charge]` (adds extra cost to SO) or `[Unlock & Waive]` (requires Manager PIN).

---

## III. The Ultimate Plan (Phased Execution)

### Phase 1: Database Hardening (The Foundation)
*   **Creative Module**: 
    *   Create `DesignVersion` model (Immutable history).
    *   Create `DesignFeedback` model (Timestamped audit trail).
    *   Update `DesignTask` with `kanban_state`, `sla_deadline`, and `revision_count`.
*   **Warehouse Module**:
    *   Add `ProductionDebt` model to track material borrowed by Production but not yet reconciled.
    *   Add `oee_metrics` table for machine efficiency.

### Phase 2: The Logic Engine (Backend State Machine)
*   Implement `DesignStateMachine` in NestJS to enforce strict routing (e.g., Designer cannot skip APJ).
*   Develop `RevisionCapGuard` to freeze tasks after 3 revisions.
*   Implement `WarehouseFEFOEnforcer` to block QR scans of newer batches if older ones exist.
*   Build `COGS_Calculator` to absorb "Loss Variance" into actual product HPP in real-time.

### Phase 3: The Design Hub & Kanban (Frontend Premium)
*   **Kanban Board**: Build the 6-state board with Drag & Drop and "SLA Warning" glow effects.
*   **Micro-Dashboard**: Implement the 4-block KPI header with real-time SSE updates.
*   **Design Hub (Drawer)**: Create the Side Panel with 3 Tabs:
    *   *Tab A (Brief)*: Read-only data from R&D/BusDev.
    *   *Tab B (Versioning)*: Secure upload with auto-tagging (V1, V2...).
    *   *Tab C (Logs)*: Professional audit trail with "APJ Signature" UI.

### Phase 4: The Interlock System (Integration)
*   **Design $\rightarrow$ SCM**: Auto-generate "Printing PO" when status hits `LOCKED`.
*   **Design $\rightarrow$ Production**: Inject `MASTER_ASSET` mockup into the Tablet UI for operators.
*   **Warehouse $\rightarrow$ Finance**: Automated journal entry for "Stock Opname Loss".

### Phase 5: Verification & Stress Testing
*   Execute E2E tests for the "Happy Path" (Brief $\rightarrow$ Design $\rightarrow$ APJ Approved $\rightarrow$ Client ACC $\rightarrow$ Locked).
*   Test "Conflict Path" (FEFO Violation, Revision Overlimit, APJ Rejection).
*   100% Code Quality audit for "Silent Luxury" CSS tokens.

---

**Prioritas Anda?** Apakah saya harus mulai dengan merombak **Database & Backend Creative** dulu, atau Anda ingin melihat **Mockup Frontend** dari papan Kanban yang baru?
