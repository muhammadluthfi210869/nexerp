# Phase 3 Transition — Frontend Repair (2026-09-11)

**Status**: Phase 2 DONE ✅ → Phase 3 STARTING 🟡
**Goal**: Fix bugs, replace mock data, add missing pages, build component library, add gate indicators
**Estimasi**: 7-10 hari (per `ERP_FINALIZATION_MASTER_PLAN.md` §3)

---

## What's Done (Phase 2 Closure + Pre-Phase 3 Fixes)

### Phase 2 — Service Layer Integrity
- 2.1 Split Workflows: DownPayment (301 LOC), APPayment (338 LOC, 2-person rule), ARReceipt (261 LOC)
- 2.2 27 Finance Stubs: ~112 new endpoints across journal automation, auto-posting, period management
- 2.3 RFC 7807 Problem Details error responses
- 2.4 Gate conditions (period lock + SoD) wired into finance services
- 2.5 Lint cleanup (Phase 2.5/Track C) deferred per user priority

### Batch 1 — Frontend Build Blockers (Phase 6 gate)
9 files fixed: AuditTables, Rankings, workstation, inbound, production-warehouse, down-payment, batch-records, formula-adjustment-production, mrp. All `tsc --noEmit` clean.

### Phase 1.4 — State Machine Centralization
StateTransitionService wired into RndService + ProductionService. Canonical TRANSITION_MAP validates before stage updates.

### Phase 1.5 — Security Audit (CRITICAL FINDING)
ZERO_ERROR_ROADMAP claim "0 vulnerabilities" — **FALSE**. Real audit shows **75 vulns** (2 critical, 50 high). See `docs/security/SECURITY-AUDIT-2026-09-11.md`.

### Phase 1.6 — Notification Wiring
NotificationService gate event handlers wired (now actually fires — previously handlers existed but no emitter).

---

## Phase 3 — Frontend Repair (Sub-tasks)

### 3.1 Emergency Fixes (1 hari) — 9 anti-patterns
| # | Anti-pattern | File | Fix |
|---|---|---|---|
| 3.1.1 | `prompt("Scan QR...")` | `production/terminal/mixing/page.tsx` | Replace with `<QRScannerDialog>` |
| 3.1.2 | `prompt("Scan QR...")` | `production/terminal/filling/page.tsx` | Replace with `<QRScannerDialog>` |
| 3.1.3 | `prompt()` twice | `production/terminal/packing/page.tsx` | Single scan + auto-detect |
| 3.1.4 | Hardcoded `"MANAGER_ID"` | `production/terminal/mixing/page.tsx` | Use actual user from auth |
| 3.1.5 | `console.log('DEBUG_PIPELINE_GRANULAR:')` | `bussdev/pipeline/page.tsx` | Remove debug logging |
| 3.1.6 | `confirm()` dialog | `bussdev/guest-book/page.tsx` | Replace with proper modal |
| 3.1.7 | `setTimeout` fake API | `finance/actual-costing/page.tsx` | Replace with real API |
| 3.1.8 | `toast.success` tanpa API | `finance/bills/page.tsx` | Add real mutation |
| 3.1.9 | Hardcoded COA | `finance/transactions/page.tsx` | Fetch from `/finance/accounts` |

### 3.2 Replace Mock Data (1.5 hari) — 6 pages
| # | Page | Replace With |
|---|---|---|
| 3.2.1 | `qc/coa/page.tsx` | API: `GET /qc/audits?type=inbound` |
| 3.2.2 | `qc/inspections/page.tsx` | API: `GET /qc/audits?status=PENDING` |
| 3.2.3 | `qc/stability/page.tsx` | API: `GET /rnd/lab-test-results?type=stability` |
| 3.2.4 | `rnd/repository/page.tsx` | API: `GET /formulas?status=ARCHIVED` |
| 3.2.5 | `finance/transactions/page.tsx` | API: `GET /finance/journal` |
| 3.2.6 | `production/dashboard/page.tsx` | API: `GET /production/dashboard` |

### 3.3 Add Missing Pages (3 hari) — 17 pages
- **P0** (1 hari): Lab Test Center, Fund Request UI
- **P1** (1 hari): Material Master, Attendance, Tickets, Supplier Management
- **P2** (1 hari): Payroll, Recruitment, Tax Mgmt, Currency, Period Mgmt, Revision Tracker, Returns
- **P3** (compliance): Internal Audit, Artwork Review, Retention Sample

### 3.4 Component Library (1 hari)
Reusable primitives. **BLOCKED BY ADR-013** (see recommendation below).

### 3.5 Gate Visual Indicators (0.5 hari)
`<GateIndicator>` component. No evidence of existing implementation in codebase.

---

## Blocking Decisions (Sign-off Needed)

| ADR | Topik | Status | Recommendation | Blocker |
|---|---|---|---|---|
| **ADR-013** | Legacy shadcn (keep vs hapus) | 🟡 **PROPOSED** | **B: keep as base, DNA wraps** | Phase 3.4 |
| ADR-004 | Vendor/Customer Code Prefix | ⚪ OPEN | TBD | Phase 3.3 P1 |
| ADR-006 | Max KPI Cards (4 atau 4-6) | ⚪ OPEN | TBD | Phase 3.3 P2 |
| ADR-008 | Dashboard vs Marketing Visual | ⚪ OPEN | TBD | Marketing |
| ADR-009 | Negative-Stock Policy | ⚪ OPEN | TBD | Finance ops |
| ADR-014 | Marketing DNA exception | ⚪ OPEN | TBD | Phase 3.4 |
| ADR-015 | Commitlint strict vs flexible | ⚪ OPEN | TBD | Process |

---

## Recommended Sequence (next 2 weeks)

### Week 1 (Days 1-5): Foundation
1. **Day 1**: Sign ADR-013 (Phase 3.4 unblocked) + sign ADR-006 (KPI cards)
2. **Day 1**: Update `API_CONTRACT.yaml` v0.1 → v0.2 (49 → 161 endpoints, covers Phase 2 finance stubs)
3. **Day 2**: 3.1 Emergency Fixes (9 anti-patterns) — quick wins, batch commit
4. **Day 3**: 3.2 Replace Mock Data (6 pages) — sequential, one per page
5. **Day 4-5**: 3.3 P0 + P1 (Lab Test, Fund Request, Material Master, Attendance, Tickets, Suppliers)

### Week 2 (Days 6-10): Completion
6. **Day 6-7**: 3.3 P2 + P3 (Payroll, Recruitment, Tax, Currency, Period, Revision, Returns, Internal Audit, Artwork, Retention)
7. **Day 8**: 3.4 Component Library (after ADR-013 signed)
8. **Day 9**: 3.5 Gate Visual Indicators
9. **Day 10**: Phase 3 verification + transition to Phase 4 (State Machine UI)

---

## Cross-cutting Concerns (not Phase 3 specific)

1. **Security audit (75 vulns)** — 2 critical should be addressed ASAP regardless of Phase 3:
   - `@xhmikosr/decompress` (backend) — likely removable
   - `next` middleware bypass (frontend) — major version upgrade
2. **Track B backend lint (2116 errors)** — paused, user decision pending
3. **Track C frontend lint (7341 warnings)** — deferred, multi-day
4. **Marketing Phase 4 sub-item 6** — manual browser QA required

---

## Files Touched This Session (Phase 2 → Phase 3 prep)

- `docs/legacy-erp/backend/01_DECISIONS_LOG.md` — Phase 2 → Phase 3 transition marker
- `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md` — ADR-013 PROPOSED with recommendation
- `docs/legacy-erp/API_CONTRACT.yaml` — version 0.1.1 + coverage gap noted

---

## Next User Action (1 of 3 decisions needed to unblock Phase 3)

```
ADR-013: B (keep shadcn as base, DNA wraps)
```

After sign-off, Phase 3.4 Component Library work can begin.
