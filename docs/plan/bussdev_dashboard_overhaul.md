# Implementation Plan: Bussdev Dashboard Overhaul (100% Fidelity)

## Objective
To restructure the Business Development Command Center cards to perfectly match the specifications in `DATA_DASHBOARD.md`, ensuring data accuracy across the database, backend, and frontend.

## Phase 1: Backend Intelligence (API Layer)
**Target File**: `backend/src/modules/bussdev/bussdev.service.ts`
**Goal**: Implement advanced aggregation and filtering for the four requested cards.

### 1.1 Revenue Pipeline Aggregation
Calculate the monetary value (SUM of `estimatedValue`) for the following pipeline states:
- **Total Pipeline Value**: Sum of all leads excluding `WON_DEAL` and `LOST`.
- **Potential Sample**: Sum of leads in `SAMPLE_PROCESS`.
- **Potential Deal**: Sum of leads in `SAMPLE_APPROVED` and `SPK_SIGNED`.
- **Confirmed Deal**: Sum of leads in `WON_DEAL`.
- **Repeat Order Value**: Sum of leads where `isRepeatOrder` is true.

### 1.2 Activity Performance Metrics
Calculate real-time operational efficiency:
- **Follow-up Today**: Count `LeadActivity` where `createdAt >= startOfToday`.
- **Avg Response**: Calculate the average of `responseTime` from all activity logs.
- **Active Leads**: Count leads with `leadState: ACTIVE`.

### 1.3 Critical Alert Refinement
- Ensure `stuckNego` uses a 7-day threshold.
- Ensure `atRiskClients` uses a 30-day inactivity threshold (based on `lastFollowUpAt`).

---

## Phase 2: Frontend Visual Excellence (UI Layer)
**Target File**: `frontend/src/components/bussdev/DashboardCards.tsx`
**Goal**: Redesign the `dashboard` variant to display exactly 4 specialized cards.

### 2.1 Component Restructuring
Modify the `variant === 'dashboard'` case to render:
1. **Card I: FUNNEL OVERVIEW** (Rose/Slate Theme)
2. **Card II: REVENUE PIPELINE** (Emerald/Gold Theme)
3. **Card III: ACTIVITY PERFORMANCE** (Amber/Blue Theme)
4. **Card IV: CRITICAL ALERT** (Rose/Pulsing Theme)

### 2.2 Data Mapping
Map the new backend JSON structure (`overview`, `revenuePipeline`, `activityPerformance`, `criticalAlerts`) to the `StatRow` and `AlertItem` sub-components.

---

## Phase 3: Page Integration & HUD Polish
**Target File**: `frontend/src/app/(dashboard)/bussdev/dashboard/page.tsx`
**Goal**: Ensure the data fetching hook retrieves the expanded analytics object and passes it correctly.

---

## Phase 4: Automated Validation (Testing)
**Target File**: `frontend/tests/bussdev-dashboard.spec.ts`
**Goal**: Verify 100% visual and data integrity using Playwright.

### 4.1 Test Suite Specifications
- **Existence Test**: Verify all 4 card headers are present in the DOM.
- **Field Test**: Verify all 18 sub-metrics (6+5+3+4) are rendered with valid numbers or currency formats.
- **SLA Test**: Verify the "Critical Alert" card displays the correct count for unfollowed leads.

### 4.2 Execution Command
```bash
npx playwright test tests/bussdev-dashboard.spec.ts
```

## Success Criteria
- [ ] Backend returns all 18 metrics correctly calculated from the DB.
- [ ] Frontend UI matches the order and grouping in `DATA_DASHBOARD.md`.
- [ ] Currency values are correctly formatted (IDR).
- [ ] Playwright tests pass in the terminal.
