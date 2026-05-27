# ERP Restoration Plan — Visual DNA Alignment & Input Fix

**Date**: 2026-05-28
**Status**: Approved
**Goal**: Restore ERP to deploy-ready state by aligning all pages to VISUAL_DNA.md, fixing Finance inputs per docs/inputs specs, and cleaning up BussDev redundancies.

---

## Strategy: Foundation First (Approach B)

1. Fix core DNA components first
2. Pilot on Finance (most critical)
3. Cascade to remaining divisions
4. Final deploy preparation

---

## Phase 1: DNA Component Refactor

All changes in `frontend/src/components/dna/` and `frontend/src/app/globals.css`.

### DataCard.tsx
| Property | Value |
|----------|-------|
| border-radius | 24px (was rounded-2xl = 16px) |
| padding | 2rem (32px) |
| border | 1px solid #E2E8F0 |
| box-shadow | 0 4px 6px -1px rgba(0,0,0,0.02) |
| hover | translateY(-4px), shadow 0 20px 25px -5px rgba(0,0,0,0.05) |

### TableWrapper.tsx
- Table header: bg #F9FAFB, padding 1.5rem, font 10px weight 800
- Table cells: padding 1.25rem 1.5rem, font-size 11px, weight 500
- border-bottom per row: 1px solid #E2E8F0
- Row hover: background #F8FAFC

### SectionLabel.tsx
- font-size 10px, weight 800, letter-spacing 0.3em, UPPERCASE
- Left border accent (4px colored)

### StatCard.tsx (KPI Cards)
- Primary value: 32px, weight 900, letter-spacing -0.02em
- Secondary value: 24px, weight 950, letter-spacing -0.02em
- Micro label: 9px, weight 900, letter-spacing 0.1em, uppercase

### DnaBadge.tsx
- border-radius: 8px
- font-size 10px, weight 900, uppercase
- Success: bg #ECFDF5, color #059669
- Critical: bg #FEF2F2, color #DC2626
- Warning: bg #FFFBEB, color #D97706
- Default: bg #F9FAFB, color #6B7280

### DnaInput.tsx
- border-radius: 12px (standard)
- font-variant-numeric: tabular-nums for number inputs

### globals.css
- Verify .text-dashboard-title (32px, 900, -0.05em)
- Verify .text-section-label (10px, 800, 0.3em, uppercase)
- Verify .text-micro-label (9px, 900, 0.1em, uppercase)
- Verify .text-primary-value (32px, 900, -0.02em)
- Verify .text-table-header (10px, 800, 0.05em, uppercase)
- Verify ::-webkit-scrollbar (4px, gray thumb #D1D5DB)

---

## Phase 2: Finance Division (Pilot)

### 2A. Finance Dashboard (`finance/dashboard/page.tsx`)
- Refactor all cards to use DNA DataCard
- Replace inline text size classes with DNA typography classes
- Tables use TableWrapper DNA component
- Standardize status badges to DnaBadge

### 2B. Finance Input (`finance/input/page.tsx`)
**Jurnal Umum:**
- Add "Keterangan Baris" column per line (missing from current impl)
- Keep existing: date, reference, description, dynamic line rows, balanced check, file upload

**Kas Masuk (Cash Receipt):**
- Replace category card buttons with dynamic rows table (per docs/inputs spec)
- Fields: date, "Terima Dari" text, "Simpan Ke Akun" dropdown (kas/bank only), "Keterangan" textarea
- Table: Akun Pendapatan/Asal (dropdown) + Nominal (Rp input)
- **Not** the current implementation with 5 category cards

**Kas Keluar (Cash Disbursement):**
- Same structure as Kas Masuk but for OUT
- Fields: date, "Bayar Kepada" text, "Ambil Dari Akun" dropdown (kas/bank only), "Keterangan" textarea
- Table: Akun Biaya/Tujuan (dropdown) + Nominal (Rp input)
- Mandatory attachment for cash out

### 2C. Finance Sub-pages Visual Alignment
- ar-hub, bills, ledger, reports
- accounting, actual-costing
- transactions, sales-orders
- fund-requests, approvals, cogs-request

---

## Phase 3: BussDev Cleanup

### Redundancy Resolution
| Path | Action |
|------|--------|
| `pipeline-v2/` | KEEP (more current) |
| `pipeline/` | REMOVE (or alias to v2) |
| `client-manager/` | MERGE into pipeline-v2 |
| `client-production/` | MERGE into pipeline-v2 |
| `client-ro/` | MERGE into client-manager |
| `client-sample/` | MERGE into pipeline-v2 |
| `down-payment/` | KEEP (cross-division) |
| `retur-penjualan/` | KEEP |
| `guest-book/` | KEEP |
| `retention-engine/` | KEEP |
| `sales-orders/` | KEEP |
| `sales-target/` | KEEP |
| `lost/` | KEEP |

### Correct Pipeline (per SOT_BUSSDEV.md)
1. intake/ → Lead Intake
2. pipeline/ → Granular Tracker (choose v2)
3. sales-orders/ → Sales Order Central
4. retur-penjualan/ → Returns
5. retention-engine/ → Retention Engine
6. lost/ → Lost & Churn

### BussDev Dashboard
- Refactor to DNA components
- 4-column KPI grid (Funnel, Revenue, Activity, Alert)
- BD Performance table with merged headers
- Granular deal tracking table (matching old_erp reference)

---

## Phase 4: SCM + Warehouse

### SCM Dashboard & Pages
- dashboard, materials, purchase-orders, inbounds → DNA alignment
- Supplier score, payments, invoices → DNA alignment

### Warehouse Dashboard & Pages
- dashboard, hub, catalog, adjustment, opname
- release, inbound, transfers, map, workstation → DNA alignment
- Pastiin semua StockOpname, Adjustment, Release pake DataCard

---

## Phase 5: Production + R&D

### Production
- dashboard (OEE, yield, COPQ) → DNA alignment
- analytics, terminal, qc stats → DNA alignment
- warehouse command center → DNA alignment

### R&D
- dashboard, samples, formula lab, lab test → DNA alignment
- revision tracker → DNA alignment

---

## Phase 6: Other Divisions

- Marketing, HR, Legal/QC, Creative, Executive
- DNA alignment for all dashboards and data tables
- Pastiin executive dashboard juga konsisten

---

## Phase 7: Deploy Preparation

- [ ] `npm run build` both frontend and backend
- [ ] Verify no broken imports or routes
- [ ] Prisma generate + migrate check
- [ ] Docker compose up test
- [ ] VISUAL_DNA.md Audit Checklist:
  1. Main body bg #F3F4F6
  2. tabular-nums on all data elements
  3. Labels uppercase with 0.1-0.3em spacing
  4. Primary numbers weight 900/950
  5. Card borders 1px solid #E2E8F0
  6. Card corners 24px/32px
  7. Card gaps 2rem/2.5rem
  8. Charts have correct gradient
  9. Insight callouts correct color scheme
  10. Scrollbar 4px gray thumb

---

## File References

| Component | Path |
|-----------|------|
| DataCard | `frontend/src/components/dna/DataCard.tsx` |
| TableWrapper | `frontend/src/components/dna/TableWrapper.tsx` |
| StatCard | `frontend/src/components/dna/StatCard.tsx` |
| SectionLabel | `frontend/src/components/dna/SectionLabel.tsx` |
| DnaBadge | `frontend/src/components/dna/DnaBadge.tsx` |
| DnaInput | `frontend/src/components/dna/DnaInput.tsx` |
| DnaButton | `frontend/src/components/dna/DnaButton.tsx` |
| Globals CSS | `frontend/src/app/globals.css` |
| Finance Dashboard | `frontend/src/app/(dashboard)/finance/dashboard/page.tsx` |
| Finance Input | `frontend/src/app/(dashboard)/finance/input/page.tsx` |
| BussDev Dashboard | `frontend/src/app/(dashboard)/bussdev/dashboard/BussdevDashboardClient.tsx` |
| Visual DNA | `VISUAL_DNA.md` |
| Finance Input Spec | `docs/inputs/finance-utility-input.md` |
| SOT BussDev | `docs/SOT_BUSSDEV.md` |
| SOT Finance | `docs/SOT_FINANCE.md` |
| Old ERP Reference Finance | `old_erp/ACUAN_DASHBOARD/src/views/Finance.tsx` |
| Old ERP Reference BussDev | `old_erp/ACUAN_DASHBOARD/src/views/BusinessDevelopment.tsx` |
