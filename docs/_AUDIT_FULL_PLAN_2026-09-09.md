# RANCANGAN PLAN AUDIT FRONTEND NEX ERP
**Tanggal**: 2026-09-09
**Orchestrator**: Strategic Workflow Orchestrator (Kilo)
**Tujuan**: Audit seluruh page di ERP, bandingkan dengan legacy spec, DNA components, dan VISUAL_DNA

---

## 0. EXECUTIVE PLAN

### 0.1 Scope
| Dimensi Audit | Deskripsi | Sumber Kebenaran |
|---|---|---|
| **D1 — Sidebar Coverage** | Apakah sidebar ERP saat ini mencakup SEMUA 176 screen di legacy ERP? Ada sidebar item yang tidak ada di spec? | `Sidebar.tsx`/`FinanceSidebar.tsx`/`LegalitySidebar.tsx` vs `NEX_ERP_SCREEN_AND_API_CATALOG.json` |
| **D2 — Page-by-Page Legacy Compliance** | Apakah setiap page actual mengimplementasikan screen ID yang benar? Apakah input form, output tabel, aksi, dan detail modal sesuai spec? | Page.tsx vs `NEX_ERP_SCREEN_AND_API_CATALOG.json` |
| **D3 — VISUAL_DNA Compliance** | Apakah setiap page mengikuti 5-layer anatomy dari `VISUAL_DNA.md`? | Page.tsx className vs VISUAL_DNA spec |
| **D4 — DNA Component Compliance** | Apakah setiap page pakai DNA components (bukan raw UI imports)? | `grep "from ['\"]@/components/ui"` di setiap page |
| **D5 — Detail/Action Completeness** | Apakah setiap page mengimplementasikan SEMUA field input, table column, action button, dan detail modal sesuai spec? | Cross-reference spec vs actual |

### 0.2 Statistik Scope
| Item | Jumlah |
|---|---|
| Pages di `frontend/src/app/(dashboard)/**/page.tsx` | **~170+** |
| Sidebar items (3 sidebar files) | **~150** |
| Legacy ERP screens | **176** |
| DNA components | **65+** |
| Visual regression tests | **1** |

### 0.3 Rekomendasi Jumlah Agent: **13 agent dalam 4 wave**

---

## 1. ARSITEKTUR AGENT

### 1.1 Mengapa 13 Agent?

| Opsi | Agent Count | Trade-off |
|---|---|---|
| **1 super-agent** | 1 | Terlalu lama (~60+ min), context overflow, single point of failure |
| **5 super-agents** | 5 | Masih besar per-agent (~35 pages), masih ~25-40 min |
| **12 module-agents** | 12 | ✅ Optimal balance, ~10-15 pages per agent, ~15-25 min wall clock |
| **170 page-agents** | 170 | Coordination overhead, overkill, banyak noise |
| **13 agents (REKOMENDASI)** | **13** | **3 cross-cutting + 10 module agents** dengan optimal coverage |

### 1.2 Wave Structure

```
WAVE 1 (5 agent paralel, ~5 min) ──── Fondasi
├── Agent-Sidebar          → sidebar audit
├── Agent-Master           → MOD-01 (107 screens)
├── Agent-Finance          → MOD-10 + reports
├── Agent-SCM-Warehouse    → MOD-04 + MOD-05
└── Agent-Bussdev          → MOD-02

WAVE 2 (5 agent paralel, ~5 min) ──── Modul Lain
├── Agent-RnD              → MOD-03
├── Agent-Production-QC    → MOD-06 + MOD-07
├── Agent-Design-Legality  → MOD-08 + MOD-09
├── Agent-HR-System        → MOD-11 + system settings
└── Agent-Exec-Approvals-Reports → MOD-12 + approvals + cross-cutting

WAVE 3 (2 agent paralel, ~5 min) ──── Library Audit
├── Agent-DNA-Compliance   → DNA component usage
└── Agent-Visual-Compliance → VISUAL_DNA 5-layer compliance

WAVE 4 (1 agent, ~5 min) ────────── Synthesis
└── Agent-Synthesis        → gabung semua jadi laporan akhir
```

**Total wall-clock: ~20-25 menit** (paralelisme di setiap wave)

### 1.3 Per-Agent Output Spec
Setiap agent WAJIB return markdown dengan struktur:
```markdown
# AGENT-[NAME] — Audit Report

## Files Audited
- `path/page.tsx` — [STATUS: ✅ Full | 🟡 Partial | ❌ Missing/Broken]

## D1. Sidebar Coverage (khusus Agent-Sidebar)
| Sidebar Item | Legacy SCR | Actual Route | Status |

## D2. Legacy Compliance
| Page | SCR Match | Input Fields Match | Output Columns Match | Actions Match | Modal Match | Score |

## D3. VISUAL_DNA Compliance
| Page | Layer 01 | Layer 02 | Layer 03 | Layer 04 | Layer 05 | Score |

## D4. DNA Component Compliance
| Page | DNA Imports | UI Imports (BAD) | Custom Raw | Score |

## D5. Detail/Action Completeness
| Spec'd Item | Present? | Implementation Quality |

## Critical Issues Found (Top 5)
1. ...
2. ...

## Quick Wins (Top 3)
1. ...
2. ...
```

---

## 2. WAVE 1: FOUNDATION (5 Agent)

### 2.1 Agent-Sidebar (P0 — Cross-Cutting)

**Tujuan**: Audit apakah SEMUA sidebar items ada di legacy spec, dan SEMUA legacy screens ada di sidebar.

**Files to read**:
- `frontend/src/components/layout/Sidebar.tsx` (full, ~700 lines)
- `frontend/src/components/layout/SidebarWrapper.tsx`
- `frontend/src/components/layout/FinanceSidebar.tsx`
- `frontend/src/components/layout/LegalitySidebar.tsx`
- `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` (full)

**Audit output**:
- Tabel: sidebar item → legacy SCR → actual route → status (✅ Match / ⚠️ Mismatch / ❌ Missing)
- Tabel inverse: legacy SCR → apakah ada di sidebar?
- Identifikasi: route prefix inconsistency (`/master/*` legacy vs `/finance/*` actual)
- Identifikasi: duplicate sidebar items (satu spec muncul di 3 sidebar berbeda)

**Sub-agent type**: `explore` (read-only analysis)

---

### 2.2 Agent-Master (MOD-01: 107 screens)

**Tujuan**: Audit 107 halaman Master Data.

**Files to read (page-by-page)**:
- `frontend/src/app/(dashboard)/master/**/page.tsx` (~15+ pages)
- `frontend/src/app/(dashboard)/master/{vendors,customers,goods,warehouses,personnel,page}.tsx`
- Spec: SCR-023 sampai SCR-053 (Master) + SCR-058 (Sales approval) + SCR-061-065 (other approvals under Master) + SCR-070 (Closing) + SCR-074-085 (Accounting screens under Master) + SCR-086-096 (other operational screens under Master)

**Audit output**:
- Setiap page: apakah match dengan SCR ID yang benar
- Apakah page pakai `DnaDataTableCard` (atau `<TableShell>` legacy)?
- Apakah form pakai `DnaSearchableSelect` (atau `<select>` legacy)?
- Apakah ada 4-6 top metric cards?

**Sub-agent type**: `general`

---

### 2.3 Agent-Finance (MOD-10 + Finance Reports)

**Tujuan**: Audit Finance & Accounting pages.

**Files to read**:
- `frontend/src/app/(dashboard)/finance/**/page.tsx` (~30+ pages: cash-in, cash-out, bank-reconciliation, jurnal-umum, ledger, laba-rugi, closing, dp-pembelian, dp-penjualan, faktur-pembelian, faktur-penjualan, bayar-pembelian, bayar-penjualan, fund-requests, client-escrow, assets, accounting/coa, accounting/auto-journal, etc)
- Spec: SCR-074-085 (Accounting screens) + SCR-104-107 (Purchase DP/Bayar) + SCR-117 (Sales Invoice) + SCR-118 (Sales Payment) + SCR-155-165 (Reports)

**Audit output**:
- Apakah Auto-Journal Engine implemented?
- Apakah Bank Reconciliation pakai matching engine?
- Apakah Escrow ledger proper journal entries (Dr Bank, Cr Escrow Deposit)?
- Apakah Period Lock (Soft/Hard) implemented?
- Apakah COA hierarchy benar?

**Sub-agent type**: `general`

---

### 2.4 Agent-SCM-Warehouse (MOD-04 + MOD-05)

**Tujuan**: Audit SCM, Purchasing, Warehouse.

**Files to read**:
- `frontend/src/app/(dashboard)/scm/**/page.tsx` (~15+ pages: pembelian, receiving, kebutuhan-barang, warehouse/requisition, mrp, vendors/performance, purchasing/page.tsx, purchasing/payments, rangkuman-kebutuhan)
- `frontend/src/app/(dashboard)/warehouse/**/page.tsx` (~13 pages: stok, mutasi-stok, opname, adjustment, pindah-gudang, release, inbound, hub, map, workstation, transfers)
- Spec: SCR-058, 061-065 (approvals) + SCR-100-110 (purchasing) + SCR-129-130 (purchase request) + SCR-125-126 (stock adjustment) + SCR-150-151 (opname)

**Audit output**:
- Apakah 3-pillar gudang (Bagus/Reject/Free) implemented?
- Apakah Diskon dalam Rp (bukan %) implemented?
- Apakah 3-Way Matching disembunyikan dari UI tapi engine di backend?
- Apakah AR Gatekeeper (HELD/RELEASED) untuk delivery implemented?
- Apakah PO tanda tangan digital implemented?

**Sub-agent type**: `general`

---

### 2.5 Agent-Bussdev (MOD-02: 12 screens + CRM extensions)

**Tujuan**: Audit BusDev, CRM, Sales pages.

**Files to read**:
- `frontend/src/app/(dashboard)/bussdev/**/page.tsx` (~13 pages: dashboard, guest-book, sample-tracking, sample-sales, sales-orders, retur-penjualan, retention-engine, client-manager, pipeline, down-payment, lost, my-performance, intake, sales-target)
- Spec: SCR-001-005 (BusDev dashboards) + SCR-013 (Lost) + SCR-094-095 (Buku Tamu) + SCR-102 (Leads) + SCR-114-118 (Sales) + SCR-119-120 (Retur)

**Audit output**:
- Apakah auto-save saat keluar dari form implemented (Buku Tamu Poin 78)?
- Apakah filter bulan + search nama implemented?
- Apakah DP Penjualan tabs (Sample/Legalitas/Produksi) implemented?
- Apakah AR Aging widget muncul di dashboard BusDev?
- Apakah 3 card khusus Customer (Sample/Produksi/Legalitas) ada?

**Sub-agent type**: `general`

---

## 3. WAVE 2: MODULES (5 Agent)

### 3.1 Agent-RnD (MOD-03: 8 screens)

**Tujuan**: Audit R&D, Formulation, Lab Testing.

**Files to read**:
- `frontend/src/app/(dashboard)/rnd/**/page.tsx` (revision-tracker, schedule, master-inci)
- `frontend/src/app/(dashboard)/production/formula-adjustment/page.tsx`
- Spec: SCR-122-123 (Penjualan Sample) + SCR-135-139 (Formulasi) + SCR-176 (R&D Project Monitoring)

**Audit output**:
- Apakah formula revision tracking implemented?
- Apakah sample lifecycle (Rev 1, 2, 3) implemented?
- Apakah INCI master implemented?
- Apakah Project Monitoring R&D dengan folder formula link implemented?

**Sub-agent type**: `general`

---

### 3.2 Agent-Production-QC (MOD-06 + MOD-07: 7+ screens)

**Tujuan**: Audit Production, QC, Work Orders.

**Files to read**:
- `frontend/src/app/(dashboard)/production/**/page.tsx` (work-orders, filling, batch-records, warehouse, operations, audit, spk, schedule, formula-adjustment, my-performance)
- Spec: SCR-066-073 (QC Checklist) + SCR-131-149 (Production: Batch Record, Jadwal Mixing/Filling/Packaging, Produksi Mixing/Filling/Packaging, Job Order Costing) + SCR-146 (Job Order Costing)

**Audit output**:
- Apakah Batch Record proper state machine?
- Apakah Job Order Costing dengan material/labor/overhead calculation implemented?
- Apakah QC Release workflow implemented (COA + Mikrobiologi)?
- Apakah BOM consumed vs WIP transfer implemented?

**Sub-agent type**: `general`

---

### 3.3 Agent-Design-Legality (MOD-08 + MOD-09: 8 screens)

**Tujuan**: Audit Design/Packaging + Legality/Regulation.

**Files to read**:
- `frontend/src/app/(dashboard)/design/**/page.tsx` (artwork-approval)
- `frontend/src/app/(dashboard)/creative/board/page.tsx`
- `frontend/src/app/(dashboard)/legality/**/page.tsx` (records, pipeline, permits, ckpb-audit, apj-release, master-inci, input, inbox, dashboard)
- Spec: SCR-133-134 (Design/Kemasan) + SCR-012 (Legalitas Dashboard) + SCR-026 (Compliance Asset) — Note: banyak legalitas screens ada di archive

**Audit output**:
- Apakah design revision workflow (V1/V2) implemented?
- Apakah approval BusDev & Purchase implemented?
- Apakah BPOM/HKI/MoU tracking implemented?
- Apakah escrow untuk biaya legalitas implemented?
- Apakah sertifikat reminder H-90/H-60/H-30 implemented?

**Sub-agent type**: `general`

---

### 3.4 Agent-HR-System (MOD-11 + System Settings)

**Tujuan**: Audit HR + System/Settings.

**Files to read**:
- `frontend/src/app/(dashboard)/hr/**/page.tsx` (page, dashboard, payroll, kpi, recruitment, attendance, tickets)
- `frontend/src/app/(dashboard)/system/**/page.tsx` (settings, request-list, profile, error-dashboard, company, audit-ledger, change-requests)
- `frontend/src/app/(dashboard)/user/todo/page.tsx`
- `frontend/src/app/(dashboard)/kpi-management/**/page.tsx`
- Spec: SCR-170-172 (Settings) + SCR-009 (HR Dashboard) + MOD-11 (HR module not detailed in spec)

**Audit output**:
- Apakah payroll workbench implemented (PPh 21 integration)?
- Apakah KPI leaderboard untuk departemen/individual implemented?
- Apakah attendance live feed implemented?
- Apakah audit ledger transaksi implemented?
- Apakah change request workflow implemented?

**Sub-agent type**: `general`

---

### 3.5 Agent-Exec-Approvals-Reports (MOD-12 + Approvals + Reports)

**Tujuan**: Audit Executive dashboards, Approval pages, Reports.

**Files to read**:
- `frontend/src/app/(dashboard)/executive/**/page.tsx` (dashboard, notifications, audit)
- `frontend/src/app/(dashboard)/approvals/**/page.tsx` (purchase, purchase-return, sales, sales-sample, sales-return, request-cogs, purchase-request, goods-request)
- `frontend/src/app/(dashboard)/dashboard/**/page.tsx` (page, finance, warehouse, qc, production-planning, production-floor, fulfillment, commercial, super-admin)
- Spec: SCR-006-022 (All dashboards) + SCR-058-065 (All approvals) + SCR-155-169 (All reports)

**Audit output**:
- Apakah 8 executive dashboards (D. Eksekutif, Notifikasi, HR, Produksi, Purchasing, dll) semua implemented?
- Apakah 8 approval pages (Pembelian, Retur Pembelian, Penjualan Sample, Penjualan Produk, Retur Penjualan, Permintaan HPP, Permintaan Pembelian, Permintaan Barang) semua implemented?
- Apakah AP/AR Aging reports dengan color coding implemented?
- Apakah 7 financial reports (Laba Rugi, Neraca, Cash Flow, Buku Besar, Neraca Saldo, dll) implemented?

**Sub-agent type**: `general`

---

## 4. WAVE 3: LIBRARY AUDIT (2 Agent)

### 4.1 Agent-DNA-Compliance

**Tujuan**: Audit apakah pages pakai DNA components (bukan raw `@/components/ui/*` imports).

**Files to audit (all page.tsx)**:
- Glob pattern: `frontend/src/app/(dashboard)/**/page.tsx`
- Exclude: `dna-visual/*`

**Audit commands**:
- `grep -c "from ['\"]@/components/dna" page.tsx` (count DNA imports — should be > 0)
- `grep -c "from ['\"]@/components/ui" page.tsx` (count raw UI imports — should be 0)
- `grep -E "(<table|<input|<select|<button)" page.tsx` (count raw HTML — should be 0 if using DNA)

**Output**:
- Tabel: Page | DNA Imports | UI Imports | Raw HTML Tags | Score (A/B/C/D/F)
- Summary: % pages yang comply
- Top 10 violators
- Top 10 best-practices

**Sub-agent type**: `general`

---

### 4.2 Agent-Visual-Compliance

**Tujuan**: Audit apakah pages mengikuti VISUAL_DNA 5-layer anatomy.

**Audit checks per page**:
- **Layer 01**: Page header text size `text-[32px]` atau `text-[26px]` (DNA actual)?
- **Layer 02**: 4-6 KPI metric cards, ordered to match tabs?
- **Layer 03**: Bordered tab nav container `h-[46px] p-1`? (atau inline di header)
- **Layer 04**: Search h-9 + dropdown + reset + 1 primary button?
- **Layer 05**: Table container `rounded-xl`, header `h-10 bg-slate-50/75`, row `h-[42px]`?

**Output**:
- Tabel per page: setiap layer ✅/⚠️/❌
- Score per page
- Top issues

**Sub-agent type**: `general`

---

## 5. WAVE 4: SYNTHESIS (1 Agent)

### 5.1 Agent-Synthesis

**Tujuan**: Konsolidasi semua 12 agent outputs menjadi 1 final audit report.

**Inputs**:
- 12 markdown files dari wave 1-3
- Optional: langsung membaca key files untuk verifikasi

**Output**:
1. **Executive Summary** — overall health score (0-100)
2. **Coverage Matrix** — sidebar vs legacy (semua 176 screens), pages vs spec
3. **Visual DNA Compliance** — % per module, top violators
4. **DNA Component Compliance** — % per module, top violators
5. **Critical Issues** — Top 10 issues dengan severity
6. **Quick Wins** — Top 5 fixes (< 1 hari)
7. **Strategic Backlog** — Top 10 strategic improvements
8. **Module-by-Module Score** — scorecard per module
9. **Production Readiness Checklist** — apa yang harus fix sebelum go-live

**Sub-agent type**: `general`

---

## 6. EXPECTED OUTPUT FILES

```
docs/_AUDIT_FULL_REPORT_2026-09-09.md           ← FINAL (Agent-Synthesis)
docs/_AUDIT_SIDEBAR_2026-09-09.md               ← Agent-Sidebar
docs/_AUDIT_MASTER_2026-09-09.md                ← Agent-Master
docs/_AUDIT_FINANCE_2026-09-09.md               ← Agent-Finance
docs/_AUDIT_SCM_WAREHOUSE_2026-09-09.md         ← Agent-SCM-Warehouse
docs/_AUDIT_BUSSDEV_2026-09-09.md               ← Agent-Bussdev
docs/_AUDIT_RND_2026-09-09.md                   ← Agent-RnD
docs/_AUDIT_PRODUCTION_QC_2026-09-09.md          ← Agent-Production-QC
docs/_AUDIT_DESIGN_LEGALITY_2026-09-09.md       ← Agent-Design-Legality
docs/_AUDIT_HR_SYSTEM_2026-09-09.md             ← Agent-HR-System
docs/_AUDIT_EXEC_APPROVALS_REPORTS_2026-09-09.md ← Agent-Exec-Approvals-Reports
docs/_AUDIT_DNA_COMPLIANCE_2026-09-09.md        ← Agent-DNA-Compliance
docs/_AUDIT_VISUAL_COMPLIANCE_2026-09-09.md     ← Agent-Visual-Compliance
```

**Total output: 13 file markdown, ~3,000-8,000 kata per file = ~50,000 kata total**.

---

## 7. TIMELINE ESTIMASI

| Wave | Agents | Parallel? | Wall Clock |
|---|---|---|---|
| Wave 1 | 5 | ✅ Parallel | ~5-7 min |
| Wave 2 | 5 | ✅ Parallel | ~5-7 min |
| Wave 3 | 2 | ✅ Parallel | ~3-5 min |
| Wave 4 | 1 | — | ~5-8 min |
| **Total** | **13** | **4 waves** | **~18-27 min** |

---

## 8. TRADE-OFFS & ALTERNATIF

### 8.1 Trade-off Analysis

| Aspek | 13 Agent Plan | 5 Agent Plan | 1 Agent Plan |
|---|---|---|---|
| Wall clock | ~20 min ✅ | ~40 min | ~60+ min |
| Per-agent context | Kecil ✅ | Sedang | Besar (overflow risk) |
| Coordination overhead | Medium | Low | None |
| Coverage depth | Deep ✅ | Medium | Deep |
| Failure recovery | Bisa re-run 1 agent ✅ | Re-run 1/5 | Restart all |
| Output readability | 13 files ✅ | 5 files | 1 monolith |

### 8.2 Alternatif: 5 Agent Consolidated
Jika user ingin simpler:
- Agent-Master+Finance (gabung) → ~50 pages
- Agent-SCM+Warehouse (gabung) → ~30 pages
- Agent-Bussdev+RnD+Design+Legality (gabung) → ~40 pages
- Agent-Production+QC+HR+Exec (gabung) → ~40 pages
- Agent-Approvals+Reports+System (gabung) → ~30 pages
- + 1 Agent-Sidebar
- + 1 Agent-DNA-Visual (gabung)
- + 1 Agent-Synthesis

Total: 8 agent, 3 wave, ~30-40 min wall clock.

**Saya rekomendasikan 13 agent plan** karena output lebih granular dan parallelisme optimal.

---

## 9. NEXT STEPS

Setelah plan ini di-approve, saya akan:
1. Launch **Wave 1** (5 agents paralel)
2. Tunggu Wave 1 selesai, analisis output
3. Launch **Wave 2** (5 agents paralel)
4. Tunggu Wave 2 selesai
5. Launch **Wave 3** (2 agents paralel)
6. Tunggu Wave 3 selesai
7. Launch **Wave 4** (1 agent synthesis)
8. Final: presentasi `_AUDIT_FULL_REPORT_2026-09-09.md` ke user

**User approval dibutuhkan untuk lanjut** ke eksekusi.

---

## 10. CHECKPOINT SYSTEM

Sebelum tiap wave, saya akan:
1. Konfirmasi semua agent Wave sebelumnya selesai
2. Ringkas finding penting dari wave sebelumnya
3. Adjust Wave berikutnya jika ada finding yang mengubah scope (mis. ternyata lebih banyak page dari expected)

**Adaptation triggers**:
- Jika agent Wave 1 menemukan > 50 critical issues → tambah Agent-Cross-Cutting untuk root cause analysis
- Jika ada module yang ternyata kosong (0 pages) → redistribute ke agent lain
- Jika DNA library audit menemukan blocker → escalate ke user
