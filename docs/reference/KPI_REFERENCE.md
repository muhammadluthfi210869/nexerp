# 🧬 KPI Reference — Nex Matrix ERP

> Single source of truth for every KPI card across all dashboards.  
> Includes: KpiCard component spec, backend API mapping, target thresholds, and integration plan.

---

## 1. KpiCard Component Spec

### Visual DNA (100% StatCard-compatible)

```
┌─────────────────────────────────────┐
│  REVENUE                             │  ← label: 9px / 900w / uppercase / tracking-[0.1em]
│                                      │
│  Rp 850 Jt                           │  ← value: 32px / 900w / tabular-nums / tracking-[-0.02em]
│  ██████░░░░░░░░ 57%                 │  ← target bar: 4px height, width = min(pct, 100)
│                                      │
│            🏭 (bg icon faded 110px)  │
└─────────────────────────────────────┘
  h-[148px]  │  p-7  │  rounded-[24px]  │  shadow-sm  │  overflow-hidden
```

### Props

```typescript
interface KpiCardProps {
  label: string           // KPI title — uses SectionLabel DNA class
  value: string           // Formatted value (e.g., "Rp 850 Jt", "62.4%")
  targetPct: number       // value / target * 100
  subValue?: string       // Optional sub-line (e.g., "Revenue MTD")
  icon?: React.ReactNode  // Lucide icon (renders foreground + faded background)
}
```

### Threshold Logic

| Condition | % of Target | Value Color | Border Color | Icon BG Color | Animation |
|-----------|:-----------:|-------------|-------------|---------------|-----------|
| **Underperform** | `< 70%` | `text-rose-600` | `border-rose-300` | `bg-rose-50` | Pulse (2s, institutional ease) |
| **Stable** | `70% — 99%` | `text-slate-900` | `border-slate-200` | `bg-slate-50` | None |
| **On Track** | `≥ 100%` | `text-emerald-600` | `border-emerald-300` | `bg-emerald-50` | None |

### Direction

| Direction | Meaning | Example KPIs |
|-----------|---------|-------------|
| `higher-better` | Higher % = better | Revenue, OEE, Yield, FTY |
| `lower-better` | Lower % = better (invert: `pct = max(0, target - value) / target * 100`) | Defect Rate, Overdue, COPQ |
| `zero-target` | 0 is the target (any > 0 = underperform) | Breakdowns, Shortages, Expired |

### CSS (add to `globals.css`)

```css
@keyframes kpi-pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
}
```

### Location

```
frontend/src/components/dna/KpiCard.tsx   ← NEW component
frontend/src/app/globals.css              ← add @keyframes kpi-pulse-border
```

---

## 2. Backend Logic — Threshold Computation

### Formula per Direction

```typescript
// higher-better (e.g., Revenue, OEE, On-Time Rate)
const pct = target > 0 ? Math.round((value / target) * 100) : 0

// lower-better (e.g., Defect Rate, Downtime, Overdue)
const deficit = Math.max(0, actual - maxAllowed)
const pct = maxAllowed > 0 ? Math.max(0, Math.round(100 - (deficit / maxAllowed) * 100)) : 100

// zero-target (e.g., Breakdowns, Shortages, Expired)
const pct = value === 0 ? 100 : 0   // 100% if zero, 0% if any
```

### Recommended Backend Response Extension

Each dashboard API should include a `kpi` object with pre-computed percentages:

```json
{
  "cards": { ... },
  "kpi": {
    "revenue": { "value": 850000000, "target": 1500000000, "pct": 57, "direction": "higher-better" },
    "oee":    { "value": 62.4, "target": 85, "pct": 73, "direction": "higher-better" },
    "defect": { "value": 3.2, "target": 2, "pct": 40, "direction": "lower-better" },
    "breakdowns": { "value": 1, "target": 0, "pct": 0, "direction": "zero-target" }
  }
}
```

---

## 3. Complete KPI Catalog — Per Division

### 3.1 — EXECUTIVE

**Dashboard:** `executive/dashboard/`  
**⚠ Status: ALL DATA HARDCODED — needs complete API wiring**

| # | KPI Name | API Endpoint | Data Field | Target | Direction | Notes |
|---|----------|-------------|-----------|--------|-----------|-------|
| 1 | Omset Bulan Ini (Revenue MTD) | *(needs API)* | `revenue.mtd` | Rp 4.5 M | higher-better | Wire to `GET /finance/dashboard/advanced` → `metrics.totalRevenue` |
| 2 | Sales Pipeline Value | *(needs API)* | `pipeline.value` | — | informational | Wire to `GET /bussdev/dashboard` → `data.revenuePipeline.totalPipelineValue` |
| 3 | Conversion Rate | *(needs API)* | `pipeline.conversion` | 12% | higher-better | Derived from lead→deal funnel |
| 4 | Production On-Time | *(needs API)* | `production.onTime` | 100% | higher-better | Wire to `GET /production/dashboard` → `cards.timeliness.rate` |
| 5 | Cash In MTD | *(needs API)* | `cash.in` | positive | informational | Wire to `GET /finance/dashboard/advanced` → `metrics.cashIn` |
| 6 | Piutang AR | *(needs API)* | `cash.ar` | 0 | lower-better | Wire to `metrics.overdueAR` |
| 7 | Repeat Order Rate | *(needs API)* | `ro.rate` | ≥60% | higher-better | Wire to retention engine |
| 8 | Churn Rate | *(needs API)* | `ro.churn` | ≤3% | lower-better | Wire to retention engine |

**System Alert Bar:**

| # | KPI Name | Target | Direction | Notes |
|---|----------|--------|-----------|-------|
| 9 | Order Telat Produksi | 0 | zero-target | Wire to production delayed count |
| 10 | Client Belum Bayar (Overdue) | 0 | zero-target | Wire to finance overdue AR |
| 11 | Leads Belum Follow Up | 0 | zero-target | Wire to BD unfollowed count |

---

### 3.2 — FINANCE

**Dashboard:** `finance/dashboard/`  
**API:** `GET /finance/dashboard/advanced`  
**Data field:** `metrics.*`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Total Revenue | `metrics.totalRevenue \|\| metrics.revenue` | budget target | higher-better | Compare vs `SalesTarget` |
| 2 | Collection Rate | `metrics.collectionRate` | ≥90% | higher-better | |
| 3 | Expense Ratio | `metrics.expenseRatio` | ≤70% of revenue | lower-better | |
| 4 | Net Cash Flow | `metrics.netCashFlow` | positive | higher-better | |
| 5 | Net Profit Margin | `metrics.margin` | ≥15% | higher-better | |
| 6 | GP Margin | `metrics.gpMargin` | ≥40% | higher-better | |
| 7 | Overdue AR | `metrics.overdueAR` | 0 | zero-target | |
| 8 | Overdue AP | `metrics.overdueAP` | 0 | zero-target | |
| 9 | COGS | `metrics.cogs` | ≤budget | lower-better | |
| 10 | Cash In | `metrics.cashIn` | — | informational | |
| 11 | Cash Out | `metrics.cashOut` | — | informational | |
| 12 | Gross Profit | `metrics.grossProfit` | — | informational | |

---

### 3.3 — BUSDEV

**Dashboard:** `bussdev/dashboard/`  
**API:** `GET /bussdev/dashboard`  
**⚠ BD Performance table is hardcoded**

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Contact Rate | `overview.contactRate` | ≥80% | higher-better | `contactedLeads / totalLeads` |
| 2 | Sample Rate | `overview.sampleRate` | ≥40% | higher-better | `sampleProcess / contactedLeads` |
| 3 | DP Rate | `overview.dpRate` | ≥25% | higher-better | `dpReceived / totalLeads` |
| 4 | Deal Rate | `overview.dealRate` | ≥15% | higher-better | `dealConfirmed / totalLeads` |
| 5 | Retention Rate | `overview.retentionRate` | ≥60% | higher-better | `repeatOrder / totalLeads` |
| 6 | Unfollowed Leads | `criticalAlerts.unfollowedLeads` | 0 | zero-target | |
| 7 | Stuck Samples (>14d) | `criticalAlerts.stuckSamples` | 0 | zero-target | |
| 8 | Stuck Negotiation | `criticalAlerts.stuckNego` | 0 | zero-target | |
| 9 | At Risk Clients | `criticalAlerts.atRiskClients` | 0 | zero-target | |
| 10 | Avg Response Time | `activityPerformance.avgResponse` | ≤2h | lower-better | |
| 11 | Follow-Up Today | `activityPerformance.followUpToday` | ≥0 overdue | higher-better | |
| 12 | BD Performance Table | *(hardcoded)* | per staff | higher-better | **NEEDS API WIRING** |
| 13 | Lost & Churn | *(hardcoded)* | ≤5% pipeline | lower-better | **NEEDS API WIRING** |

---

### 3.4 — PRODUCTION

**Dashboard:** `production/` + `production/dashboard/`  
**API:** `GET /production/dashboard`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Output (pcs) | `cards.output.total` | production plan | higher-better | |
| 2 | Quality Rate | `cards.quality.rate` | ≥98% | higher-better | |
| 3 | OEE | `oee.average` | ≥85% | higher-better | |
| 4 | WIP | `wip` | minimize | lower-better | |
| 5 | Achievement Rate | `cards.achievement.rate` | ≥90% | higher-better | |
| 6 | On-Time Rate | `cards.timeliness.rate` | ≥90% | higher-better | |
| 7 | Delayed Orders | `cards.timeliness.delayed` | 0 | zero-target | |
| 8 | Defect Rate | `cards.quality.defectRate` | ≤2% | lower-better | |
| 9 | Machine Utilization | `cards.efficiency.utilization` | ≥80% | higher-better | |
| 10 | Labor Productivity | `cards.efficiency.labor` | ≥85% | higher-better | |
| 11 | Downtime MTD | `cards.efficiency.downtime` | 0 | zero-target | |
| 12 | Rework Count | `cards.quality.reworkCount` | 0 | zero-target | |
| 13 | Breakdowns | `cards.alerts.breakdown` | 0 | zero-target | |
| 14 | Shortages | `cards.alerts.shortages` | 0 | zero-target | |
| 15 | Urgent Anomalies | `cards.alerts.urgent` | 0 | zero-target | |

---

### 3.5 — WAREHOUSE

**Dashboard:** `warehouse/WarehouseDashboardClient.tsx`  
**⚠ Props-driven (parent must fetch and pass data)**

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Capacity Utilization | `capacity.utility` | ≤85% | lower-better | >90% = red |
| 2 | Accuracy | `capacity.accuracy` | ≥98% | higher-better | <95% = red |
| 3 | FIFO Score | `capacity.fifoScore` | ≥8/10 | higher-better | <6 = red |
| 4 | Inventory Value | `valuation.total` | — | informational | |
| 5 | Turnover Ratio | `turnover.ratio` | ≥4x | higher-better | <2x = red |
| 6 | Stock Health | `turnover.health` | ≥90% | higher-better | <80% = red |
| 7 | Dead Stock | `risk.deadStock` | 0 | zero-target | |
| 8 | Critical Items | `risk.criticalItems` | 0 | zero-target | |

**Data needed from backend:**
```
GET /warehouse/dashboard-stats
→ { capacity, valuation, turnover, risk }
```

---

### 3.6 — QC

**Dashboard:** `qc/dashboard/`  
**APIs:** `GET /production/qc/stats` + 4 analytics endpoints

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | FTY (First Time Yield) | `fty * 100` | ≥95% | higher-better | Already uses `ftyColor()` |
| 2 | COPQ (Cost of Poor Quality) | `copq` | ≤3% revenue | lower-better | |
| 3 | Leakage Hotspot | `leakageHotspot` | 0 | informational | |
| 4 | Active Quarantines | `activeQuarantines` | 0 | zero-target | |
| 5 | Vendor Accept Rate | `vendor-watchlist[].acceptRate` | ≥90% | higher-better | From `GET /qc/analytics/vendor-watchlist` |
| 6 | Held Hours | `rework-hold-log[].heldHours` | ≤24h | lower-better | From `GET /qc/analytics/rework-hold-log` |

---

### 3.7 — R&D

**Dashboard:** `rnd/dashboard/`  
**API:** `GET /rnd/dashboard`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | On-Time Sample Rate | `timeliness.onTimeRate` | ≥90% | higher-better | |
| 2 | Avg Cycle Time | `timeliness.avgCycleTime` | ≤5 days | lower-better | >7d = red |
| 3 | Overdue Samples | `timeliness.overdueCount` | 0 | zero-target | |
| 4 | First-Time Approval | `accuracy.firstTimeApprovalRate` | ≥80% | higher-better | |
| 5 | Avg Revisions | `accuracy.avgRevision` | ≤1x | lower-better | >2x = red |
| 6 | Failed Items | `accuracy.failedItemsCount` | 0 | zero-target | |
| 7 | Overall Approval Rate | `approval.overallRate` | ≥90% | higher-better | |
| 8 | Utilization Rate | `performance.utilizationRate` | 80-90% ideal | higher-better | >95% = red (overload) |
| 9 | Active Projects | `performance.activeProjects` | — | informational | |
| 10 | Completed Projects | `performance.completedProjects` | — | informational | |

---

### 3.8 — MARKETING

**Dashboard:** `marketing/dashboard/`  
**API:** `GET /marketing/analytics`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Revenue MTD | `acquisition.revenue` | 350M | higher-better | |
| 2 | Lead → Sample Rate | `funnel.leadToSampleRate` | ≥50% | higher-better | |
| 3 | Closing Rate | `funnel.closingRate` | ≥60% | higher-better | |
| 4 | Budget Usage % | `budget.budgetUsagePercent` | ≤100% | lower-better | >95% = red |
| 5 | CPL (Cost Per Lead) | `budget.costPerLead` | <Rp 30k | lower-better | >Rp 40k = red |
| 6 | Avg Engagement | `vitality.avgEngagement` | ≥3% | higher-better | ⚠ Bug: comments/shares fields swapped |
| 7 | Content Production | `vitality.totalPosts / postTarget` | ≥90% | higher-better | |
| 8 | Search CTR | `searchVisibility.avgCtr` | ≥5.5% | higher-better | |
| 9 | Avg Position | `searchVisibility.avgPosition` | ≤3 | lower-better | |

---

### 3.9 — HR

**Dashboard:** `hr/`  
**API:** `GET /hr/executive-summary` + `GET /hr/department-scores`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Budget Savings | `executive.budgetSavings` | >0 | higher-better | Negative = red |
| 2 | Hiring Speed | `executive.hiringSpeed` | ≤30 days | lower-better | >45d = red |
| 3 | Stability Index | `executive.stabilityIndex` | ≥85% | higher-better | <80% = red |
| 4 | Workload Balance | `executive.workload` | balanced | informational | |
| 5 | Avg KPI Score | `executive.avgKpi` | ≥75 | higher-better | <70 = red (existing) |
| 6 | Contract Expiry | per employee `daysLeft` | ≥30d | lower-better | <30d = red (existing) |

---

### 3.10 — SCM

**Dashboard:** `scm/dashboard/`  
**API:** `GET /scm/dashboard` + `GET /scm/work-orders/active`  
**⚠ Most cards are hardcoded — needs API wiring**

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Stock Value | *(hardcoded)* | — | informational | **NEEDS WIRING** |
| 2 | Excess Stock | *(hardcoded)* | 0 | zero-target | **NEEDS WIRING** |
| 3 | Dead Stock | *(hardcoded)* | 0 | zero-target | **NEEDS WIRING** |
| 4 | Turnover Days | *(hardcoded)* | ≤30d | lower-better | **NEEDS WIRING** |
| 5 | Material Readiness | *(hardcoded)* | ≥95% | higher-better | **NEEDS WIRING** |
| 6 | Shortage Items | *(hardcoded)* | 0 | zero-target | **NEEDS WIRING** |
| 7 | Cost Variance | *(hardcoded)* | ≤3% | lower-better | **NEEDS WIRING** |
| 8 | On-Time Purchase | *(hardcoded)* | ≥90% | higher-better | **NEEDS WIRING** |
| 9 | Category Scores | *(hardcoded)* | ≥85 | higher-better | **NEEDS WIRING** |
| 10 | OTD (Work Orders) | `GET /scm/work-orders/active` | ≥95% | higher-better | Available from API |

---

### 3.11 — LEGALITY

**Dashboard:** `legality/dashboard/`  
**API:** `GET /legality/dashboard` + `GET /legality/pipeline/stats` + `GET /legality/expiry`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Active Registrations | `overall.activeTotal` | — | informational | |
| 2 | Delayed | `overall.delayed` | 0 | zero-target | |
| 3 | BPOM Avg Time | `bpomStats.avgTime` | — | informational | |
| 4 | HKI Avg Time | `hkiStats.avgTime` | — | informational | |
| 5 | Halal Certified | `halalStats.certified` | — | informational | |
| 6 | Expired | `riskMonitor.expired` | 0 | zero-target | |
| 7 | Expiring <90d | `riskMonitor.under90Days` | 0 | zero-target | |
| 8 | Days Left (per cert) | `expiry[].daysLeft` | ≥90d | higher-better | ≤30 = critical, ≤60 = warning (existing) |

---

### 3.12 — SYSTEM ERRORS

**Dashboard:** `system/error-dashboard/`  
**API:** `GET /system/errors/summary` + `GET /system/errors/timeline`

| # | KPI Name | Data Field | Target | Direction | Notes |
|---|----------|-----------|--------|-----------|-------|
| 1 | Total Errors | `summary.totalErrors` | 0 | zero-target | |
| 2 | Critical Errors | `summary.criticalErrors` | 0 | zero-target | |
| 3 | Unique Routes | `summary.byRoute.length` | — | informational | |
| 4 | Fatal Count | `summary.byLevel[level=fatal].count` | 0 | zero-target | |
| 5 | Error Count (timeline) | `timeline[].error + warning + fatal` | 0 | zero-target | |

---

### 3.13 — ROOT DASHBOARDS (Operational)

**Pages:** `dashboard/` (commercial, finance-ops, fulfillment, production-floor, production-planning, qc-ops, warehouse-ops, super-admin)  
**⚠ All currently have NO KPI strips — need new strips added**

| Page | Suggested KPI Strip | API Needed |
|------|---------------------|-----------|
| Finance Ops (SO Monitoring) | Total SO, DP Pending, Ready to Ship | `GET /commercial/sales-orders` |
| Fulfillment | FG Inventory, Pending Shipments, Delivered | `GET /fulfillment/shipments` |
| Production Floor | Active Batches, Mixing, Filling, Packing | `GET /production-plans` |
| Production Planning | Pending SO, Material Ready, Scheduled | `GET /commercial/sales-orders` + `GET /production-plans` |
| QC Ops (Audit Terminal) | Pass Rate, Reject Rate, Pending Audit | `GET /production/qc/stats` |
| Warehouse Ops (Ledger) | Inbound Today, Outbound Today, Stock Value | `GET /warehouse/adjustments` |
| Commercial | Pipeline, SLA Warning, Retention | `GET /leads` + `GET /commercial/retention/radar` |
| Super Admin | System Health, Active Nodes, Interlock, Load | `GET /system/health` (needs endpoint) |

---

## 4. Data Source Classification

| Data Mode | Dashboards | Action Required |
|-----------|-----------|----------------|
| **API-connected** (ready) | Finance, Production, QC, R&D, Marketing, HR, Legality, System Errors | Add `kpi` object to API response |
| **API + Hardcoded** (partial) | Bussdev, SCM | Wire hardcoded tables to API; add `kpi` object |
| **Hardcoded** (needs API) | Executive | Create `GET /executive/dashboard` aggregating multiple services |
| **Props-driven** (needs endpoint) | Warehouse | Create `GET /warehouse/dashboard-stats` |

---

## 5. Backend Services — Required Changes

### 5.1 — Add `kpi` object to existing API responses

For these dashboards, the backend already returns the data. Just extend the response with pre-computed percentages:

| Service | Endpoint | Add to Response |
|---------|----------|----------------|
| `FinanceService` | `GET /finance/dashboard/advanced` | `metrics.kpi: { revenue, collectionRate, ... }` |
| `ProductionService` | `GET /production/dashboard` | `data.kpi: { output, quality, oee, ... }` |
| `QCAnalyticsController` | `GET /production/qc/stats` | `data.kpi: { fty, copq, ... }` |
| `RndService` | `GET /rnd/dashboard` | `metrics.kpi: { onTime, approval, ... }` |
| `MarketingAnalyticsService` | `GET /marketing/analytics` | `data.kpi: { revenue, funnel, ... }` |
| `HRService` | `GET /hr/executive-summary` | `data.kpi: { budget, hiring, ... }` |
| `LegalityService` | `GET /legality/dashboard` | `data.kpi: { delayed, expired, ... }` |
| `SystemErrorService` | `GET /system/errors/summary` | `data.kpi: { total, critical, ... }` |

### 5.2 — Create new aggregation endpoints

| Endpoint | Aggregates From | Notes |
|----------|----------------|-------|
| `GET /executive/dashboard` | Finance, Bussdev, Production, SCM | Currently ALL hardcoded |
| `GET /warehouse/dashboard-stats` | Warehouse Service | Currently props-driven |
| `GET /scm/dashboard` | SCM Service | Most tables currently hardcoded |

### 5.3 — Wire hardcoded tables to API

| Dashboard | Table | API Source |
|-----------|-------|-----------|
| Bussdev | BD Performance Evaluation | `GET /bussdev/dashboard` → staff metrics |
| Bussdev | Lost & Churn | `GET /bussdev/dashboard` → `lostChurn` |
| SCM | Stock Health, Readiness, Cost, Purchase | `GET /scm/dashboard` → `dashStats.cards` |
| SCM | Category Performance | `GET /scm/dashboard` → `dashStats.categories` |

---

## 6. Active Bugs Found

| # | Dashboard | Bug | File |
|---|-----------|-----|------|
| 1 | Marketing | Comments shows `shares/3`, Shares shows `saves`, Save shows `saves*0.5` | `MarketingDashboardClient.tsx` |
| 2 | HR | Progress bar width inverted (more days = smaller bar) | `HRDashboardClient.tsx` |
| 3 | Bussdev | Active Leads progress bar divides by 5 arbitrarily | `DashboardCards.tsx` |
| 4 | Production Client | OEE "88.2%" hardcoded, ignores API `oeeData` | `ProductionDashboardClient.tsx` |
| 5 | Production Client | Mass Balance "99.8%" hardcoded | `ProductionDashboardClient.tsx` |

---

## 7. Integration Order (Phase 2 Execution Plan)

### Step 1: Build KpiCard Component (2 hours)
- Create `frontend/src/components/dna/KpiCard.tsx`
- Add `@keyframes kpi-pulse-border` to `globals.css`
- Verify at `/dna-preview/kpi`

### Step 2: API-Ready Dashboards (4 hours)
Dashboards with live API data — integrate first:

| Priority | Dashboard | KPIs | Strategy |
|----------|-----------|:----:|----------|
| 1 | Finance | 12 | Data already flowing — just swap cards |
| 2 | Production | 15 | Data already flowing — just swap cards |
| 3 | QC | 6 | Data already flowing — just swap cards |
| 4 | R&D | 10 | Data already flowing — just swap cards |
| 5 | Marketing | 9 | Data flowing — fix bugs first |
| 6 | HR | 6 | Data already flowing — fix bar bug |
| 7 | Legality | 8 | Data already flowing |
| 8 | System Errors | 5 | Data already flowing |

### Step 3: Mixed Dashboards (3 hours)
Dashboards with some API data + some hardcoded:

| Priority | Dashboard | Action |
|----------|-----------|--------|
| 9 | Bussdev | Wire hardcoded tables first, then integrate cards |
| 10 | SCM | Wire all hardcoded cards to API data |

### Step 4: Create APIs + Integrate (3 hours)
Dashboards that need new backend endpoints:

| Priority | Dashboard | Action |
|----------|-----------|--------|
| 11 | Warehouse | Create `GET /warehouse/dashboard-stats` |
| 12 | Executive | Create `GET /executive/dashboard` aggregation endpoint |

### Step 5: Operational KPI Strips (2 hours)
Add 3-4 card KPI strips to 8 operational pages

### Total: ~14 hours for full Phase 2

---

## 8. File Manifest

| Action | File | Purpose |
|--------|------|---------|
| **CREATE** | `frontend/src/components/dna/KpiCard.tsx` | KpiCard React component |
| **EDIT** | `frontend/src/app/globals.css` | Add pulse animation |
| **EDIT** | 24 dashboard pages | Replace StatCard/custom cards with KpiCard |
| **CREATE** | Backend: 2 new endpoints | `GET /executive/dashboard`, `GET /warehouse/dashboard-stats` |
| **EDIT** | Backend: 8 service responses | Add `kpi` object to existing API responses |
| **EDIT** | Backend: 3 services | Wire hardcoded tables to actual data |

---

*Generated: 30 May 2026 | Nex Matrix ERP — Porto Aureon*
