# ⚖️ ULTIMATE IMPLEMENTATION PLAN: LEGALITY MODULE V4
**Objective:** Transforming the existing MVP Legality module into a 100% compliant, automated, and high-performance "Gatekeeper" system as specified in the [Legalitas V4 Protocol](../general%20docs/legalitas.md).

---

## PHASE 1: DATABASE ARCHITECTURE (PRISMA SCHEMA)
Refactoring the data layer to support cross-divisional gating and regulatory automation.

### 1.1 Enums Overhaul (`enums.prisma`)
-   **`RegStage`**: Update to `[DRAFT, SUBMITTED, EVALUATION, REVISION, PUBLISHED]`.
-   **`FormulaStatus`**: Add `[MINOR_COMPLIANCE_FIX, BPOM_REGISTRATION_PROCESS]`.
-   **`IngredientCategory`**: Add `[ALLOWED, RESTRICTED, PROHIBITED, COLORANT, PRESERVATIVE, UV_FILTER]`.
-   **`ClaimRisk`**: New enum `[LOW, MEDIUM, HIGH]`.

### 1.2 Schema Extension (`legal.prisma`)
-   **`MasterINCI`**: Store international ingredient names, CAS numbers, max concentrations, and mandatory warning text.
-   **`RegulatoryPipeline`**: Unified model for BPOM & HKI with `pnbpStatus`, `daysInStage`, and `logHistory`.
-   **`ArtworkReview`**: Track designer uploads, claim risk analysis, and "Izin Cetak" flag for SCM.
-   **`PNBPRequest`**: Link directly to `FinanceRecord` for automated payment tracking.

---

## PHASE 2: BACKEND - THE GATEKEEPER ENGINE (NESTJS)
Implementing the logic that controls the rhythm of the factory.

### 2.1 Regulatory Validator Service
-   **`Formula Compliance`**: API to accept INCI arrays from R&D and return specific violations based on `MasterINCI` limits.
-   **`The Three-Button Logic`**:
    -   `Approve`: Status -> `BPOM_REGISTRATION_PROCESS`.
    -   `Minor Adjustment`: Unlock R&D Phase Builder (Soft-Reject).
    -   `Fatal Reject`: Archive Formula & trigger new version requirement.

### 2.2 The Smart-Gate Engine
-   **SCM Intercept**: Logic to block PO creation for `MaterialType.PACKAGING` if `ArtworkReview.isApproved` is false.
-   **Production Intercept**: Logic to hide/disable `FILLING` & `PACKAGING` execution in Work Orders until `RegulatoryPipeline.registrationNo` is present.
-   **Mixing Soft-Gate**: Allow `MIXING` status but lock results in `QUARANTINE_DRUM`.

### 2.3 Finance Integration
-   Automated event: When `PNBPRequest` is paid by Finance, `RegulatoryPipeline.stage` automatically advances to `EVALUATION`.

---

## PHASE 3: FRONTEND - APJ EXECUTIVE DASHBOARD
Moving from "Basic List" to "Control Tower" with premium aesthetics.

### 3.1 Visual Identity (Aureon V4 Style)
-   **Background**: Deep Dark (`#0A0A0A`).
-   **Cards**: Transparent Glassmorphism with `backdrop-filter: blur(20px)`.
-   **Typography**: *Inter* for body, *JetBrains Mono* for technical IDs and numbers.

### 3.2 KPI Cards (The V4 Set)
-   **Card A: Registration Pipeline**: Active totals + Blocked by PNBP status.
-   **Card B: Processing Velocity**: Average SLA times for BPOM & Artwork.
-   **Card C: Factory Bottleneck**: Count of SCM/Production tasks currently blocked by Legal.
-   **Card D: Risk Monitor**: Critical expiry and regulatory warnings.

---

## PHASE 4: FRONTEND - COMPLIANCE WORKSPACE
High-density interfaces for high-speed decision making.

### 4.1 Legal Compliance Inbox (Master-Detail)
-   **Left Panel**: Urgency-sorted queue (Formula vs Artwork vs PNBP).
-   **Right Panel**: Smart Viewer.
    -   *Formula Mode*: Side-by-side comparison with MasterINCI limits.
    -   *Artwork Mode*: High-res image viewer with Zoom & Annotation tool.

### 4.2 Regulatory Pipeline (Data Grid)
-   Status Badges: 🟡 Draft, 🔵 Submitted, 🟠 Evaluation, 🔴 Revision, 🟢 Published.
-   Inline Actions: Fast-track PNBP payment request & NA number entry.

---

## PHASE 5: MASTER DATA MANAGEMENT
The "Brain" of the regulatory system.

### 5.1 Master INCI Control Center
-   **Bulk Import**: Excel/CSV uploader for thousands of BPOM-regulated ingredients.
-   **Search & Filter**: Blazing fast search by INCI name or CAS Number.
-   **Auto-Annotation**: Automatically generate mandatory labels/warnings based on ingredient selection.

---

## PHASE 6: TESTING & VALIDATION (100% COMPLIANCE)
Ensuring zero errors in the "Gatekeeper" system.

### 6.1 Backend Logic Testing (Jest)
-   **Unit Tests**: Validate `MasterINCI` concentration limits logic.
-   **Integration Tests**: Verify that `SalesOrder` / `WorkOrder` cannot proceed to Filling without NA Number.
-   **State Machine Tests**: Ensure status cannot skip steps (e.g., cannot go to Evaluation without Payment).

### 6.2 Implementation Checklist
- [ ] Schema Updated & Migrated.
- [ ] Master INCI Seeded with real BPOM data.
- [ ] Backend Gating Logic implemented in SCM & Production modules.
- [ ] Frontend Dashboard updated to Dark Glass Style.
- [ ] All 3 Formula decision buttons tested.
