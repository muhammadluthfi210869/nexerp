# Ultimate Plan: Creative & Packaging Design V4

This plan outlines the complete transformation of the **Creative & Packaging Design** module to reach the "V4 World-Class" standard.

## I. Technical & Business Decisions (V4 Implementation)

1.  **Module Isolation**: The **Creative & Packaging Design** module is an independent entity. It acts as a **Producer** of assets (Ai/PDF) and status events.
2.  **MVP File Infrastructure**: **Local Storage** located in `backend/uploads/creative_assets/`. 
    *   *Hard Limits*: Mockups max 5MB, Master Files max 50MB.
3.  **Lightweight Communication**: **Server-Sent Events (SSE)** for one-way status broadcasting (Server → BusDev/Designer).
4.  **Internal E-Signature**: APJ (Legal) approval via **6-Digit Encrypted PIN** (Bcrypt). 
    *   *Audit Trail*: Logs `user_id`, `timestamp`, and `IP_address`.
5.  **Soft-Block Revision Cap**: After the 3rd revision, the system **freezes the Designer's upload capability** until BusDev unlocks it.

---

## II. Execution Roadmap

### Phase 1: Database Hardening [COMPLETED ✅]
*   Created `creative.prisma` with `DesignTask`, `DesignVersion`, and `DesignFeedback`.
*   Added `approvalPin` to `User` model for E-Signatures.

### Phase 2: Logic Engine (Backend) [COMPLETED ✅]
*   Implemented `CreativeService` with state machine logic.
*   Added Revision counting and locking mechanism.
*   Integrated `EventEmitter` for real-time SSE broadcasts.

### Phase 3: The Design Hub UI (Frontend) [COMPLETED ✅]
*   **Kanban Board**: 6-stage visualization.
*   **Design Hub Drawer**: 3-Tab system (Brief, Versions, Feedback).
*   **Micro-Dashboard**: Live project KPIs.

### Phase 4: SCM & Production Integration [PENDING ⏳]
*   Auto-generate "Printing PO" in SCM when status hits `LOCKED`.
*   Connect `finalArtworkUrl` to the Production Tablet UI.

### Phase 5: Verification & Stress Testing [PENDING ⏳]
*   E2E testing of the full revision-to-lock lifecycle.
