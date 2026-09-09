# NEX ERP REFACTOR ROADMAP v2
**From 60% spec gap → production-ready ERP (cross-department)**

> **Versi:** 2.0 — 8 September 2026
> **Owner:** Muhammad Luthfi
> **Acuan:** `docs/legacy-erp/NEX_FINANCE_FINAL_SPEC.md` (Finance) + `docs/legacy-erp/REQUIREMENT.md` (78 poin Upii) + `docs/legacy-erp/LEGACY_ERP_SPEC.md` (cross-department) + `VISUAL_DNA.md` + audit 3-agent
> **Estimasi realistis:** 14-18 minggu (solo) | 8-11 minggu (2 devs) | 5-7 minggu (3 devs)
> **Catatan v2:** Verdict diubah dari "EDIT, JANGAN REBUILD" → "**Hybrid Rebuild**" (lihat [Section 0.6](#06-verdict-revisi-hybrid-rebuild)) karena kondisi codebase yang sekarang. Plan ini bukan refactor incremental tapi **controlled rebuild** dengan fondasi yang bersih.

---

## 📑 Table of Contents

0. **[🔴 READ FIRST — SCOPE DEFINITION](#0--read-first--scope-definition)** ← baca ini SEBELUM setiap edit
1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit-sept-7-2026)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Architecture Decisions (LOCKED)](#4-architecture-decisions-locked)
5. [Phase Breakdown](#5-phase-breakdown)
6. [Parallelization Strategy (THE BATCHES)](#6-parallelization-strategy-the-batches)
7. [Team Structure & Scenarios](#7-team-structure--scenarios)
8. [Dependencies & Critical Path](#8-dependencies--critical-path)
9. [Risk & Mitigation](#9-risk--mitigation)
10. [Success Metrics](#10-success-metrics)
11. [Open Questions](#11-open-questions)
12. **[🛡️ HALLUCINATION_RULES](#12--hallucination-rules)** ← WAJIB baca sebelum execute
13. **[📋 SHIP_CRITERIA](#13--ship-criteria)** ← definition of done
14. **[🚦 PHASE_GATES](#14--phase-gates)** ← checkpoint rules
15. **[🔗 REQUIREMENT_TRACEABILITY](#15--requirement-traceability)** ← matrix approach
16. **[🏭 PRODUCTION_READINESS](#16--production-readiness)** ← non-functional requirements
17. **[⚖️ KONTRADIKSI_RESOLUTION](#17--kontradiksi-resolution)** ← source of truth rules
18. **[🚀 PHASE 2: CROSS-DEPARTMENT](#18--phase-2-cross-department)** ← Batch 6-15 + 4 test flows

---

## 0. 🔴 READ FIRST — SCOPE DEFINITION

> **ATURAN INI HARUS DIBACA SEBELUM SETIAP EDIT.**
> Melanggar scope = revert. Tidak ada pengecualian.

### 0.1 Scope Definisi — Apa yang BOLEH diedit vs TIDAK

| Kategori | Status | Alasan |
|---|---|---|
| **Operational pages** (non-dashboard, semua divisi) | ✅ **EDIT** | Subject refactor — apply DNA components, fix bugs, dsb |
| **Dashboard pages** (semua divisi) | 🔒 **FIXED — JANGAN EDIT** | Sudah sesuai keinginan Direksi |
| **Digital Marketing module** (semua pages, termasuk dashboard) | 🚫 **EXCLUDED** | Sedang berjalan / live, tidak boleh disentuh |
| **Project Control pages** | ✅ EDIT | Masuk scope refactor |
| **KPI Management pages** | ✅ EDIT | Masuk scope refactor |
| **DNA components** (`@/components/dna/*`) | ✅ EDIT | Consolidation + deprecation |
| **Backend code** | ✅ EDIT | Schema + service + controller changes |
| **Frontend UI imports** (form, tabel, modal, button, input, badge, dialog, sheet, dropdown, dsb) | 🟢 **DNA-ONLY** | **WAJIB import dari `@/components/dna`**. Dilarang keras import langsung dari `@/components/ui/*`. Verifikasi: setiap page = `grep -E "from ['\"]@/components/ui/"` harus NOL hasil. Referensi: `DNA_CHEATSHEET.md` (root) — list komponen yang tersedia + aturan emas. |

### 0.2 Acuan Visual — DUA DNA System

> **PENTING:** Ada 2 DNA system yang SAH, beda konteks.

#### A. **Operational DNA** (untuk semua operational pages)
- **Contract:** `/VISUAL_DNA.md` (root)
- **Implementation:** `/frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`
- **Style:** 5-layer anatomy, `rounded-xl`, `text-[24px]` KPI value, `border-slate-200`
- **Apply to:** semua operational pages (list, form, detail)

#### B. **Dashboard DNA** (untuk semua dashboard pages)
- **Contract:** `/old_erp/ACUAN_DASHBOARD/` (Vue + Vite project) — Director's preferred UI
- **Style:** "Aureon Matrix" — `rounded-[24px]` macro cards, CSS vars (`var(--border-color)`, `var(--app-bg)`), `Inter font`, big `32px` KPI numbers
- **Apply to:** semua dashboard pages (existing sudah pakai style ini)

### 0.3 Dashboard Exceptions — Special Additions

Beberapa dashboard punya **tambahan** di bawah layout standar (per directive Direksi):

| Dashboard | Tambahan | Status |
|---|---|---|
| **Finance Dashboard** | **Trend** (chart garis tren di bawah cards) | ✅ Keep existing |
| **Bussdev Dashboard** | **Sama dengan saat ini** (sudah match reference) | ✅ Keep existing |
| **Digital Marketing Dashboard** | **Funnel per Channel** (di bawah layout standar) | 🚫 Excluded — jangan edit |
| Semua dashboard lain | Pakai Dashboard DNA standard | 🔒 Fixed |

> **RULES:** Kalau dashboard sudah punya tambahan (Finance trend, Bussdev widget, DigMar funnel) — **JANGAN HAPUS**. Pertahankan. Cuma jangan tambah/kurangi.

### 0.4 Checklist Pre-Edit (WAJIB dibaca setiap mau edit)

Sebelum mulai edit file apapun, jawab pertanyaan ini:

- [ ] Apakah file ini **operational page** (bukan dashboard)? → Lanjut cek DNA
- [ ] Apakah file ini **bukan** di module **Digital Marketing**? → Lanjut cek DNA
- [ ] Apakah file ini **bukan** di folder `dashboard*` atau `/dashboard`? → Lanjut cek DNA
- [ ] Pakai DNA yang mana?
  - Operational → `/VISUAL_DNA.md` (root) + golden-reference
  - Dashboard → `/old_erp/ACUAN_DASHBOARD/` (reference existing style)
- [ ] Apakah ada **dashboard exception** (Finance trend / Bussdev widget / DigMar funnel)? → Jangan dihapus kalau ada

**Kalau salah satu jawaban = STOP dan tanya user.**

### 0.5 Quick Reference — Pages yang JANGAN Disentuh

```
JANGAN EDIT (LOCKED / EXCLUDED):
├─ Semua dashboard pages (lihat Appendix D untuk daftar lengkap)
├─ Module Digital Marketing (semua page, termasuk dashboard-nya)
├─ old_erp/* (legacy reference, kecuali yang dipakai sbg evidence)
└─ /frontend/src/app/(dashboard)/dna-visual/* (reference, bukan operational)

BOLEH EDIT (SCOPE REFACTOR v2 — Hybrid Rebuild):
├─ Operational pages SEMUA divisi (list, form, detail, create)
├─ Module Project Control + KPI Management + Document Center
├─ DNA components (@/components/dna/*) — clean rebuild
├─ Backend modules — incremental remediation (bukan rewrite)
└─ Master data + COA + posting rules
```

### 0.6 Verdict RevisI: HYBRID REBUILD

> **🔴 VERDICT v1 salah konteks** — Plan v1 bilang "EDIT, JANGAN REBUILD" tapi situasi sekarang:
> - AI hallucination sudah terjadi (kode hancur)
> - Codebase existing tidak stabil untuk di-edit incremental
> - Legacy ERP sudah terdokumentasi lengkap di `docs/legacy-erp/` (READ-ONLY evidence)
> - Risk Git tinggi: 421 untracked changes, belum committed

**VERDICT v2: HYBRID CONTROLLED REBUILD**:
- **Frontend**: **Controlled rebuild** dari fondasi bersih (DNA + new components + new pages)
- **Backend**: **Incremental remediation** (audit, fix, extend — bukan rewrite)
- **Database**: Prisma schema extend (bukan drop & recreate)
- **Legacy ERP** (`docs/legacy-erp/`): **READ-ONLY evidence**, bukan codebase kepercayaan
- **Dashboard lama**: **LOCKED** (sudah sesuai Direksi)
- **Dashboard baru**: Build dengan DNA pattern dari awal (tidak pakai legacy code)

**Implikasi ke timeline**: estimasi v1 (10-11 minggu solo) terlalu optimistis karena tidak memperhitungkan:
- Setup ulang fondasi (3-4 hari extra)
- Audit + traceability matrix (3-4 hari)
- Production readiness checklist (1 minggu dedicated)
- UAT feedback loop (1-2 minggu)

Realistic: **14-18 minggu solo** atau **5-7 minggu (3 devs)**.

---

## 1. Executive Summary

### TL;DR
- **🔴 BACA SECTION 0 DULUAN** — scope definisi (dashboards FIXED, DigMar excluded)
- **Verdict:** **EDIT, JANGAN REBUILD.** Codebase fundamentally sound — 269 routes, 30+ modules, build bersih (TS strict pass).
- **Scope refactor:** ~200+ **operational pages** (list/form/detail) di SEMUA divisi kecuali Digital Marketing
- **TIDAK termasuk:** dashboard pages (sudah sesuai Direksi), module Digital Marketing (live)
- **Yang missing bukan struktur, tapi adoption** — DNA component compliance 0% di operational pages, 24 entities Prisma missing di backend
- **Total pekerjaan:** ~10-11 minggu (solo) atau 4-5 minggu (3 devs) dengan parallelization

### Kenapa refactor perlu arsitektur baru
User concern: ERP bakal kenceng banget perubahannya. Refactor harus **future-proof**:
- Ganti 1 warna di 1 tempat, bukan 269
- Tambah 1 kolom baru = edit 1 config, bukan 5 file
- Component baru = auto-documented, auto-lint-checked

### 4 Prinsip arsitektur yang di-LOCK
1. **Single Source of Truth (SSoT)** — VISUAL_DNA.md → golden-reference → DNA components (linked, drift-detected)
2. **Design Tokens** — semua color/size/radius via `tailwind.config.ts` extensions, bukan hardcode
3. **Config-Driven** — kolom tabel, form fields, business rules via config/schema, bukan JSX hardcode
4. **Module Isolation** — setiap module punya interface publik, gak ada cross-import liar

---

## 2. Current State Audit (Sept 7, 2026)

### 📊 Snapshot
| Layer | Total | Status | Catatan |
|---|---|---|---|
| **Frontend pages** | 269 | 0 complete / 170 partial / 40 placeholder / 6 broken | 0% DNA compliance |
| **DNA components** | 50+ | Banyak duplikat | 1 dead code, 6+ pairs of duplicate components |
| **Backend modules** | 30+ | Finance ~30% | 13 ready / 14 partial / 15 missing |
| **Prisma entities** | 25+ | 24 missing | BankAccount, Bill, DownPayment, FixedAsset, dll |
| **Build health** | ✅ TS strict pass | `backend_tsc_strict_v4.txt` 0 bytes | No circular deps |

### 🔴 Critical Issues (P0)
1. **6 broken frontend pages** — Date.now() in render, setState in effect, missing deps (semua **operational pages**, bukan dashboard)
2. **24 missing Prisma entities** — Bill, SalesInvoice, DownPayment, BankAccount, FixedAsset, dll
3. **Two-DNA-System clarity** — operasional pakai `/VISUAL_DNA.md` (root, 5-layer anatomy), dashboard pakai `/old_erp/ACUAN_DASHBOARD/` (Aureon Matrix style). **BUKAN conflict**, dua-duanya SAH untuk konteks berbeda. Lihat [Section 0](#0--read-first--scope-definition) untuk detail.

### 🟡 Structural Debt (P1)
- DNA component duplikat: 3 stat cards (StatCard/KpiCard/DashboardCard), 2 KpiGrids, 2 Paginations, 2 Badges, 2 Tables
- `DnaDataTable.tsx` 930 baris "monster" — 15 pages pakai ini TIDAK follow Golden Reference compositional pattern
- Duplicate routes: `/produksi/` vs `/production/`, `/bussdev/pipeline-v2`, `/rnd/formulasi`/`kelola-formulasi`
- Orphan: `bussdev.service.ts.tmp`

### 📋 Yang Sudah Solid
- 269 routes (semua ada), layout dashboard jalan, API wiring aktif
- 5 module aktif: Finance (49), SCM (26), Bussdev (21), Marketing (24), Warehouse (17)
- Backend core: COA, double-entry journal, Fund Request workflow, Neraca/Laba Rugi/Cash Flow
- Recent momentum: Visual DNA standardization (commit `69cf6ad`), Finance Fase 2/4, Purchase Core Fase 1/3

---

## 3. Goals & Non-Goals

### 🎯 4 Pilar Deliverable (END-TO-END)

> Refactor bukan frontend-only. PRD ini mencakup **4 pilar**:
> 1. **Backend** (NestJS + Prisma) — services, controllers, migrations, API contracts
> 2. **Frontend** (Next.js + DNA) — pages, components, UX patterns
> 3. **Testing** (unit + integration + E2E) — automated quality gates
> 4. **UAT Documentation** — user guides, test scripts, training materials

### Goals (sukses kalau)

#### Pilar 1: Backend (NestJS + Prisma)
1. **100% Finance API coverage** — semua 42 halaman punya backend endpoint real (replace mock data)
2. **Prisma schema lengkap** — 24 missing entities di-migrate (Bill, SalesInvoice, BankAccount, dll)
3. **Auto-journal posting** — setiap dokumen operasional trigger journal entry otomatis saat Posted
4. **3-Way/4-Way Matching Engine** — PO ↔ GR ↔ QC ↔ Vendor Invoice dengan tolerance per kategori vendor
5. **Period Lock enforcement** — Hard Lock阻止 transaksi di periode closed (kecuali Adjustment Journal)
6. **AR Delivery Gatekeeper** — Gudang blocked dari cetak DO kalau Finance status HELD
7. **OpenAPI/Swagger contract** — auto-generated, jadi single source of truth untuk type FE↔BE
8. **Type Safety end-to-end** — Prisma schema → backend DTOs → frontend types via auto-gen (no hand-written mirror)

#### Pilar 2: Frontend (Next.js + DNA)
9. **VISUAL_DNA compliance 100%** di semua operational pages (sekarang 0%)
10. **Zero broken pages** (sekarang 6 → harus 0)
11. **Zero duplicate components** (sekarang 6+ pairs → harus 0)
12. **Build & TS strict pass clean** (sudah ✅, pertahankan)
13. **Config-Driven pages** — tambah kolom/field = edit 1 config, ≤20 baris (proven di Faktur Pembelian)
14. **Visual regression CI** — perubahan warna auto-detected via Playwright (11 baseline screenshots udah ada)

#### Pilar 3: Testing (Automated)
15. **Unit Tests** — backend services + frontend components (target coverage ≥70%)
16. **Integration Tests** — API endpoints + database (target: semua critical path)
17. **E2E Tests** — user flows via Playwright (login → operation → verify)
18. **Visual Regression** — Playwright screenshot comparison (target: 0 drift per sprint)
19. **CI Pipeline** — semua tests jalan otomatis sebelum merge ke main

#### Pilar 4: UAT Documentation & Training
20. **UAT Test Scripts** — step-by-step manual test cases per finance module
21. **User Guide per Role** — Finance Staff, Finance Manager, AP/AR Clerk, Auditor
22. **Admin Guide** — cara setup master data, COA, posting rules
23. **Training Materials** — video walkthrough + slides untuk end-user training
24. **Deployment Runbook** — cara deploy ke production + rollback procedure

### Non-Goals (di-explicit-out)
- ❌ Rebuild dari scratch (incremental refactor saja)
- ❌ **Edit dashboard pages** (sudah sesuai Direksi — lihat Section 0 + Appendix D)
- ❌ **Edit module Digital Marketing** (sedang berjalan/live, fully excluded)
- ❌ Hapus dashboard exceptions (Finance trend, Bussdev widget, DigMar funnel)
- ❌ Migrasi data historis ERP lama (terpisah setelah MVP jalan)
- ❌ Integrasi e-Faktur / e-Bupot DJP (sesuai REQUIREMENT Poin 34)
- ❌ Module Purchase, Design, BusDev besar-besaran (focus finance dulu)
- ❌ Multi-language / i18n (Indonesia-only dulu)
- ❌ Mobile native app (web-responsive cukup)

---

## 4. Architecture Decisions (LOCKED)

> Setelah ADR ini disetujui, **tidak bisa diubah tanpa ADR baru.**

### ADR-001: Two-DNA-System (Operational + Dashboard)
- **Decision:** Dua DNA system yang SAH, beda konteks:
  - **Operational DNA:** `VISUAL_DNA.md` (root) + `/dna-visual/golden-reference/page.tsx` — untuk semua operational pages (list, form, detail)
  - **Dashboard DNA:** `/old_erp/ACUAN_DASHBOARD/` (Vue reference) — untuk semua dashboard pages (sesuai keinginan Direksi)
- **Rationale:** Dashboard punya style sendiri (Aureon Matrix: `rounded-[24px]`, CSS vars, Inter font) yang berbeda dengan operational pages (`rounded-xl`, Tailwind tints). **Keduanya benar untuk konteks masing-masing.**
- **Consequence:** Tiap perubahan visual operational update 3 file (contract + impl + library). Dashboard pakai style existing — JANGAN refactor jadi operational style. Lihat [Section 0.2](#02-acuan-visual--dua-dna-system) untuk boundary.
- **Anti-pattern:** Jangan samakan style dashboard jadi operational style (atau sebaliknya) — Direksi sudah set preferensinya.

### ADR-002: Design Tokens via Tailwind Config
- **Decision:** Semua color/size/radius hardcode diganti Tailwind extensions di `tailwind.config.ts`. Tambah token: `text-kpi-value`, `text-table-data`, `bg-card-surface`, `bg-page-bg`, dll.
- **Rationale:** Ganti 1 token = 269 pages ter-update. Bukan cari-replace manual.
- **Consequence:** ESLint rule block hardcoded `text-[24px]`, `bg-emerald-100/70`, dll di luar DNA components.

### ADR-003: Config-Driven Pages
- **Decision:** Column definitions (table) dan form fields (Zod schema) di config file, bukan JSX hardcode. Tambah kolom baru = edit 1 config.
- **Rationale:** Refactor berulang = debt. Config = single point of change.
- **Consequence:** Pattern harus distandardisasi sebelum Sprint 1 selesai. Lihat Phase 0 deliverable.

### ADR-004: Module Isolation Pattern
- **Decision:** Setiap module (finance, scm, warehouse) folder structure sama: `controllers/`, `services/`, `dto/`, `events/`. Cross-module imports hanya via `@/modules/<name>/events` atau shared interfaces.
- **Rationale:** Ganti 1 module = gak rusak yang lain. Cross-cutting concerns di-handle via events, bukan direct calls.
- **Consequence:** Refactor module besar tanpa touch module lain. Migration data per-module bisa incremental.

### ADR-005: No Hardcoded Business Rules in Frontend
- **Decision:** Tax calc, credit limit check, matching engine, dll ada di backend. Frontend cuma display.
- **Rationale:** Single source of truth untuk business logic. Frontend aman kalau business rule berubah.
- **Consequence:** Tiap business rule butuh backend endpoint. Worth it untuk long-term.

### ADR-006: Type Safety End-to-End
- **Decision:** Prisma schema → backend DTOs → frontend types via auto-generation (OpenAPI/Swagger). Gak ada hand-written mirror types.
- **Rationale:** Field rename di DB = auto-propagate. Gak ada type drift.
- **Consequence:** Setup cost 2-3 hari (generate scripts), payback setelah 1 field change.

### ADR-007: DNA-Only UI Imports (Single Source of UI)
- **Decision:** **SELURUH** UI form, button, input, badge, table, modal, sheet, dialog, dropdown, switch, breadcrumb, pagination, dll **WAJIB diimpor dari `@/components/dna`**. Dilarang import langsung dari `@/components/ui/*` di luar folder `components/dna/`.
- **Rationale:**
  1. **Single source of UI styling** — ubah visual styling 1 DNA component = otomatis propagate ke semua halaman operasional tanpa cari-replace manual.
  2. **Wrap-ready architecture** — DNA components yang wrap raw Radix (`DnaDialog`, `DnaSheet`, `DnaCascadingAddress`, dll) boleh diupgrade/diganti kapan saja di balik facade yang sama; call-site tidak ikut berubah.
  3. **Visual DNA enforcement** — drift ke tailwind hardcode (`bg-blue-600`, `rounded-lg`, raw `<input>`) dapat di-block di PR review karena `grep` straightforward.
  4. **Cheatsheet sebagai acuan tunggal** — developer/AI lihat `DNA_CHEATSHEET.md` (root) untuk komponent apa saja yang tersedia (form, dialog, layout, dll). Tidak perlu baca folder.
- **Scope Aplikasi:**
  - ✅ **Operational pages** (semua divisi kecuali Marketing) — `WAJIB`
  - 🔒 **Dashboard pages** — pakai Dashboard DNA reference (`old_erp/ACUAN_DASHBOARD/`) — kebijakan eksplisit di luar DNA swap. Import `@/components/ui/*` boleh selama berada di komponen dashboard itu sendiri.
  - 🚫 **Digital Marketing module** — EXCLUDED, tidak masuk scope.
  - ✅ **DNA components sendiri** (`components/dna/*.tsx`) — boleh import dari `@/components/ui/*` (raw Radix wrappers) untuk di-wrap jadi DNA component. Itu adalah SATU-SATUNYA pengecualian.
- **Verifikasi Otomatis:**
  ```bash
  # Run ini di CI / pre-commit hook sebelum merge PR apapun:
  cd frontend
  grep -rEln "from ['\"]@/components/ui/" src --include="*.tsx" --include="*.ts" \
    | grep -v "/components/dna/" \
    | grep -v "/dna-visual/" \
    | grep -v "/components/ui/" \
    || echo "✅ ZERO non-DNA imports detected"
  ```
- **Acuan Visual & Style:**
  - **Kontrak DNA operasional:** `VISUAL_DNA.md` (root)
  - **Implementation reference:** `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`
  - **Cheatsheet (WAJIB dibaca sebelum bikin halaman baru):** `DNA_CHEATSHEET.md` (root) — berisi 7 Aturan Emas, Kamus Komponen Visual DNA, dan 2 boilerplate siap-pakai
- **Consequence:**
  - ESLint rule `no-restricted-imports` ditambahkan di `frontend/eslint.config.mjs` untuk block import dari `@/components/ui/*` (dengan pengecualian folder `components/dna/`, `dna-visual/`, `components/ui/` itu sendiri).
  - Visual regression baseline Playwright di-rebuild setiap kali DNA component di-restyle.
  - Pre-commit hook + CI fail kalau grep di atas menghasilkan non-zero output.
  - Refactor halaman lama yang masih import `@/components/ui/*` langsung jadi priority Sprint 0.5 / Sprint 9 (DNA Compliance Pass).
- **Migration Path (per Sprint):**
  - **Phase 0:** Add ESLint rule + pre-commit hook.
  - **Sprint 0:** Tandai semua halaman yang masih import raw UI (`grep` result) sebagai technical debt di `plan/VISUAL-DNA-AUDIT.md`.
  - **Sprint 0.5:** Migrasi halaman master (5 halaman: customers, suppliers, goods, categories, warehouses) ke DNA — DONE per Batch 6.3.
  - **Per batch (6-15):** Migrasi halaman transaksional yang masuk scope batch tersebut.
  - **Sprint 9:** Final pass — 100% zero `@/components/ui/*` import di operational pages.
- **Status (Sept 8, 2026):** 🟢 **Master pages Batch 6 fully swap-ready** (customers, suppliers, goods, categories, warehouses, personnel — semua verified clean via `grep`). Audit terbaru: `193 file non-dna` masih import dari `@/components/ui/*` (mayoritas: dashboard pages `🔒`, Digital Marketing `🚫`, dan 178 operational pages yang masuk Sprint 9).

---

## 5. Phase Breakdown

> **Format:** Setiap phase punya deliverables konkret, success criteria, dan dependency ke phase sebelumnya.

### 🏗️ Phase 0: DNA LOCK (3-4 hari) — *SEQUENTIAL, NO PARALLEL*

**Tujuan:** Lock design system supaya semua perubahan berikutnya single-source.

**⚠️ SCOPE:** Phase 0 HANYA untuk **operational pages**. Dashboard pages (termasuk yang di `old_erp/ACUAN_DASHBOARD/`) **TIDAK DIUBAH** — Direksi sudah set style-nya.

**Deliverables:**
- [ ] **Document two-DNA-system** di `VISUAL_DNA.md` (root) — tambah section "Scope of This DNA" yang jelaskan: ini untuk operational pages, dashboard pakai reference berbeda
- [ ] **TIDAK quarantine legacy `old_erp/ACUAN_DASHBOARD/VISUAL_DNA.md`** — itu adalah Dashboard DNA contract (sah untuk dashboard)
- [ ] **Add design tokens ke `frontend/tailwind.config.ts`** (untuk operational pages saja):
  ```ts
  theme: {
    extend: {
      fontSize: {
        'page-title': ['32px', { lineHeight: '40px' }],
        'kpi-value': ['24px', { lineHeight: '32px' }],
        'kpi-label': ['13px', { lineHeight: '20px' }],
        'kpi-delta': ['11px', { lineHeight: '16px' }],
        'table-data': ['12px', { lineHeight: '18px' }],
        'table-header': ['11px', { lineHeight: '16px' }],
      },
      borderRadius: {
        'card': '12px',  // rounded-xl equivalent
        'macro': '24px', // only for dashboard hero cards
      },
      colors: {
        'card-surface': '#FFFFFF',
        'page-bg': '#F8FAFC',
        'border-subtle': '#E2E8F0', // slate-200
      },
    },
  }
  ```
- [ ] Lock DNA component API: tambah JSDoc ke setiap DNA component (props, defaults, examples) di `@/components/dna/`
- [ ] Add ESLint rules:
  - `no-restricted-syntax`: block hardcoded `text-[Npx]` outside DNA components
  - `no-restricted-syntax`: block hardcoded `bg-emerald-100`, `bg-blue-100/80`, `text-emerald-700`, dll (badge patterns)
  - `no-restricted-syntax`: block solid `bg-blue-600` buttons in table rows (must use `<DnaTableRowActions>`)
- [ ] Add visual regression test: Playwright screenshot golden-reference + sample 5 pages, baseline commit
- [ ] Add pre-commit hook: jalankan visual DNA check, fail kalau ada hardcoded values baru
- [ ] Update memory file: tambah `visual-dna-files-on-server.md` rules ke `.claude/memory/`

**Success Criteria:**
- ✅ `VISUAL_DNA.md` punya section "Scope of This DNA" yang eksplisit
- ✅ `old_erp/ACUAN_DASHBOARD/VISUAL_DNA.md` tetap accessible sebagai Dashboard DNA contract (TIDAK di-rename)
- ✅ `tailwind.config.ts` punya ≥8 token baru (font-size, radius, color) — apply ke operational pages only
- ✅ ESLint bisa detect & block hardcoded badge/button patterns (operational pages only)
- ✅ Visual regression test jalan untuk operational pages (dashboard di-exclude dari regression test)

**Dependencies:** None (FONDASI)

**Files Modified/Created:**
- `old_erp/ACUAN_DASHBOARD/VISUAL_DNA_LEGACY_DO_NOT_USE.md` (rename)
- `frontend/tailwind.config.ts` (extend)
- `frontend/.eslintrc.json` (rules)
- `frontend/eslint.config.mjs` (rules if using flat config)
- `frontend/playwright.config.ts` (visual regression setup)
- `frontend/tests/visual-regression/` (baseline screenshots)
- `.husky/pre-commit` (DNA check hook)
- `frontend/src/components/dna/*.tsx` (JSDoc additions)

---

### ⚡ Sprint 0: QUICK WINS (1-2 hari) — *PARALLEL OK*

**Tujuan:** Stabilitas dulu. Fix broken pages + cleanup obvious debt.

**Deliverables:**
- [ ] Fix 6 broken pages:
  - `/bussdev/lost/page.tsx` → move `Date.now()` ke useEffect
  - `/finance/reports/page.tsx` → declare `fetchLedger` sebelum dipake, move setState ke useEffect
  - `/finance/reports/balance-sheet/page.tsx` → add missing useEffect deps
  - `/finance/reports/trial-balance/page.tsx` → add missing useEffect deps
  - `/legality/inbox/page.tsx` → move setState ke useEffect
  - `/creative/board/page.tsx` → escape quote entities in JSX
- [ ] Delete dead code: `DashboardMetric.tsx`
- [ ] Delete orphan: `backend/src/modules/bussdev.service.ts.tmp`
- [ ] Hapus duplicate routes:
  - `/produksi/{filling,mixing,packaging}` → redirect ke `/production/*`
  - `/bussdev/pipeline-v2` → delete (v2 was placeholder)
  - `/rnd/formulasi`, `/rnd/kelola-formulasi` → delete (keep `/rnd/formula` only)
- [ ] Quick audit `frontend_errors_v4.txt` — fix semua error yang masih muncul

**Success Criteria:**
- ✅ 0 broken pages (verify via grep + dev server check)
- ✅ Build lint pass
- ✅ No dead code references

**Dependencies:** Phase 0 (token system untuk fix styling)

**Files Modified:**
- 6 broken pages (fix logic)
- 3 route duplikat (delete or redirect)
- `DashboardMetric.tsx`, `bussdev.service.ts.tmp` (delete)

---

### 🧬 Sprint 0.5: DNA CONSOLIDATION (3-4 hari) — *PARALLEL OK*

**Tujuan:** Merge duplicate components → 1 canonical component per purpose.

**Deliverables:**
- [ ] Merge `StatCard` + `KpiCard` + `DashboardCard` → 1 `StatCard` dengan variant prop:
  ```tsx
  <StatCard variant="simple" label="..." value="..." icon={...} />
  <StatCard variant="with-target" label="..." value="..." target={75} />
  <StatCard variant="macro" label="..." value="..." />  // for dashboard hero
  ```
- [ ] Pick 1 `DnaKpiGrid` — hapus salah satu (recommend: keep `layout/DnaKpiGrid.tsx`)
- [ ] Keep `table/DnaPagination.tsx`, hapus root `DnaPagination.tsx`
- [ ] Keep root `DnaPageContainer`, hapus dari `DnaLegacyCompat` exports
- [ ] Keep root `DnaTable`, hapus dari `DnaLegacyCompat` exports
- [ ] Deprecate `DnaDataTable.tsx` (930 baris monster) → migrate 15 pages ke compositional pattern (`DnaPageHeader` + `DnaKpiGrid` + `DnaDataTableCard`)
- [ ] Deprecate `DnaBadge.tsx` standalone → redirect ke `DnaCell.Badge`
- [ ] Mark `DnaLegacyCompat.tsx` deprecated → remove setelah Sprint 1

**Success Criteria:**
- ✅ 1 stat card component (sebelumnya 3)
- ✅ 1 pagination, 1 kpi-grid, 1 table primitive, 1 page container
- ✅ 0 imports dari `DnaLegacyCompat` (search & delete)
- ✅ 0 pages pakai `DnaDataTable.tsx` monster

**Dependencies:** Phase 0

**Files Modified:**
- `frontend/src/components/dna/StatCard.tsx` (consolidated)
- `frontend/src/components/dna/DnaKpiGrid.tsx` (delete)
- `frontend/src/components/dna/DnaPagination.tsx` (delete)
- `frontend/src/components/dna/DnaLegacyCompat.tsx` (delete or slim down)
- `frontend/src/components/dna/DnaDataTable.tsx` (mark deprecated, remove usage)
- `frontend/src/components/dna/DnaBadge.tsx` (mark deprecated)
- 15 pages (migrate compositional pattern)

---

### 🗄️ Sprint 1: BACKEND SCHEMA FOUNDATION (3-4 hari) — *PARALLEL dengan Sprint 0.5*

**Tujuan:** Pondasi data untuk 24 entity yang missing. Sebelum lanjut feature, schema harus ada dulu.

**Deliverables:**
- [ ] Add 24 Prisma models di `backend/prisma/schema/`:
  - **AP cycle:** `Bill`, `BillLineItem`, `DownPayment`, `APPayment`
  - **AR cycle:** `SalesInvoice`, `SalesInvoiceLineItem`, `ARReceipt`, `SampleFee`
  - **Cash & Bank:** `BankAccount`, `BankTransaction`, `BankReconciliation`
  - **Tax:** `TaxTransaction`
  - **Assets:** `FixedAsset`, `DepreciationSchedule`, `AssetTransfer`, `AssetDisposal`, `IntangibleAsset`
  - **Closing:** `PeriodLock`, `ClosingChecklist`, `AdjustmentJournal`
  - **Cost:** `JobOrderCosting`, `CostVariance`, `ProductProfitability`, `CostAllocation`
  - **Special:** `ClientEscrow`, `InventoryOwnership`
- [ ] Split existing `Invoice` model → migrate data (script): `Bill` (AP) + `SalesInvoice` (AR)
- [ ] Generate migration: `npx prisma migrate dev --name add-finance-foundation`
- [ ] Seed data: master COA, sample vendor/customer, sample bank account
- [ ] Module skeleton: stub controllers + services untuk setiap new entity (return `[]` atau throw `NotImplemented`)
- [ ] ✅ **OpenAPI/Swagger setup** — generate spec dari NestJS decorators, expose di `/api/docs` (done di Sprint 1.5)
- [ ] ✅ **Type-gen script** — `npm run sync-api` di frontend untuk auto-generate types dari OpenAPI spec (done di Sprint 1.5)

**Success Criteria:**
- ✅ `prisma migrate` success tanpa error
- ✅ 24 new models exist di schema
- ✅ Build backend tanpa error
- ✅ Seed script populate minimal data

**Dependencies:** None (backend-only)

**Files Modified/Created:**
- `backend/prisma/schema/finance.prisma` (extend)
- `backend/prisma/migrations/<timestamp>_add_finance_foundation/migration.sql`
- `backend/prisma/seed.ts` (extend)
- 24 new `*.service.ts` stubs di `backend/src/modules/finance/`
- 24 new `*.controller.ts` stubs

---

### 🧬 Sprint 1.5: OPENAPI + TYPE-GEN (0.5 hari) — *Setelah Sprint 1, sebelum Batch 3A*

**Tujuan:** Setup OpenAPI infrastructure + auto-generated types untuk ADR-006 (Type Safety end-to-end).

**Status:** ✅ **COMPLETE**

**Backend (NestJS Swagger):**
- ✅ `@nestjs/swagger` installed (v11.4.1)
- ✅ `SwaggerModule.setup('api/docs', app, document)` di `backend/src/main.ts`
- ✅ `DocumentBuilder` config: title "NexERP API", version 4.0, tags (rnd, finance, bussdev, dll)
- ✅ Auto-export ke `backend/swagger-spec.json` setiap backend boot
- ✅ Swagger UI accessible di `http://localhost:3002/api/docs`

**Frontend (Type-gen):**
- ✅ `openapi-typescript` installed (v7.13.0)
- ✅ Script di `frontend/package.json`: `"sync-api": "openapi-typescript ../backend/swagger-spec.json -o ./src/types/api-schema.d.ts"`
- ✅ Generated file: `frontend/src/types/api-schema.d.ts` (16,663 lines)

**Workflow saat ini:**
```bash
# 1. Start backend (Swagger auto-generates spec)
cd backend && npm run start:dev
# → swagger-spec.json updated automatically

# 2. Regenerate frontend types dari spec
cd frontend && npm run sync-api
# → api-schema.d.ts updated automatically

# 3. Import di component:
import type { paths } from "@/types/api-schema";
type Bill = paths["/finance/bills"]["get"]["responses"]["200"]["content"]["application/json"];
```

**Deliverables remaining (future):**
- [ ] **Add `@ApiProperty` decorators** ke DTOs secara bertahap (saat Batch 3A+ build controllers)
- [ ] **CI/CD pipeline** yang auto-run `sync-api` setiap backend PR (auto-update types)
- [ ] **Type-check gate** di PR (`tsc --noEmit` harus 0 errors sebelum merge)

**Files Modified:**
- `backend/src/main.ts` (Swagger setup — already done)
- `backend/package.json` (`@nestjs/swagger` — already installed)
- `frontend/package.json` (`openapi-typescript` + `sync-api` script — already done)
- `backend/swagger-spec.json` (auto-generated, 256KB)
- `frontend/src/types/api-schema.d.ts` (auto-generated, 16K lines)

**Per ADR-006:** Type Safety End-to-End — Prisma schema → backend DTOs (via @ApiProperty) → frontend types (via openapi-typescript). Tidak ada hand-written mirror types.

**Success Criteria:**
- ✅ Swagger UI accessible
- ✅ Type-gen script produces valid TypeScript
- ✅ End-to-end types flowing from backend → frontend
- ⏳ All DTOs annotated with `@ApiProperty` (will be added as controllers are built)

---

### 💰 Batch 3A: AP CYCLE (1 minggu) — *PARALLEL dengan Batch 3B & 3C*

**Tujuan:** Full Accounts Payable cycle jalan end-to-end (Backend + Frontend + Tests).

**Deliverables:**
- [ ] **Backend:**
  - [ ] `BillService` — create dengan line items, validate PO reference, generate journal saat Posted
  - [ ] `BillMatchingEngine` — 4-leg matching (PO ↔ GRN ↔ QC Passed ↔ Invoice)
  - [ ] Tolerance engine — per-kategori vendor (±5% RM, ±3% Packaging)
  - [ ] `DownPaymentService` (pembelian) — apply DP ke Bill
  - [ ] `APPaymentService` — batch payment, partial payment support
  - [ ] `APAgingService` — query dengan bucket H-7/H-3/overdue
  - [ ] Auto-journal posting saat Bill → Posted (Dr Inventory/Expense, Cr AP Control)
- [ ] **Frontend:**
  - [ ] ✅ `/finance/faktur-pembelian` — done pakai DnaStatCard + floating window detail
  - [ ] New `/finance/dp-pembelian` — DP list & form
  - [ ] New `/finance/bayar-pembelian` — batch payment UI, navbar/card konsisten dengan DP
  - [ ] New `/finance/ap-aging` — color coding H-7/H-3/overdue, saldo bank di navbar
- [ ] **Integration:**
  - [ ] PO created di SCM → emit event → Finance bisa reference di Bill
  - [ ] GR completed → emit event dengan QC Passed Qty → matching engine consume
- [ ] **Testing (per Phase T1):**
  - [ ] Unit tests: `BillService.create()` dengan line items validation, `MatchingEngine.match()` dengan tolerance
  - [ ] Integration test: POST /finance/bills → GET /finance/bills/:id (round-trip)
  - [ ] E2E test: full AP flow (vendor → PO → GR → bill → payment → journal)
- [ ] **UAT (per Phase U):**
  - [ ] UAT script untuk `/finance/faktur-pembelian` (already draft-able dari existing page)
  - [ ] UAT acceptance criteria: journal balance check, payment posting, aging calculation

**Success Criteria:**
- ✅ E2E flow: Vendor create → PO dibuat di SCM → GR received → Bill created di Finance → Match 4-leg → Payment posted → Journal entry otomatis
- ✅ AP Aging test: 3 bucket colors jalan, saldo bank real-time
- ✅ Unit + integration tests pass
- ✅ E2E test pass
- ✅ UAT script signed off

**Dependencies:** Sprint 1 (schema)

**Files Modified:**
- `backend/src/modules/finance/bills/bills.service.ts`
- `backend/src/modules/finance/bills/matching-engine.ts`
- `backend/src/modules/finance/dp-pembelian/dp-pembelian.service.ts`
- `backend/src/modules/finance/bayar-pembelian/bayar-pembelian.service.ts`
- `backend/src/modules/finance/ap-aging/ap-aging.service.ts`
- 4 frontend pages

---

### 💵 Batch 3B: AR CYCLE (1 minggu) — *PARALLEL dengan Batch 3A & 3C*

**Tujuan:** Full Accounts Receivable cycle + Sample Fee offsetting engine.

**Deliverables:**
- [ ] **Backend:**
  - [ ] `SalesInvoiceService` — manual create + auto dari DO, contract type handling, PPN auto
  - [ ] `CreditLimitService` — check saat submit invoice
  - [ ] `ARDeliveryGatekeeperService` — status HELD/RELEASED, integrate dengan Warehouse
  - [ ] `DownPaymentService` (penjualan) — tab Sample/Legalitas/Produksi routing
  - [ ] `ARReceiptService` — batch receipt, PPh 23 deduction support, auto-advance ke AR Advance
  - [ ] `CollectionsService` — reminder tracking
  - [ ] `ARAgingService` — query dengan bucket
  - [ ] `SampleFeeService` — offsetting engine ke DP Produksi
  - [ ] Auto-journal posting: Jasa Maklon (Dr AR, Cr Revenue + PPN) atau Jual Putus (+ COGS)
- [ ] **Frontend:**
  - [ ] Update `/finance/faktur-penjualan` — sama seperti Faktur Pembelian + Job Order Reference + Delivery Gatekeeper indicator
  - [ ] New `/finance/dp-penjualan` — tabs Sample/Legalitas/Produksi
  - [ ] Update `/finance/bayar-penjualan` — PPh 23 dipotong customer field
  - [ ] New `/finance/collections` — collection notes tracker
  - [ ] New `/finance/ar-aging` — sama dengan AP Aging structure
  - [ ] New `/finance/sample-fee` — offsetting ke DP Produksi
  - [ ] Update `/bussdev/dashboard` — widget AR Aging ringkasan
- [ ] **Integration:**
  - [ ] Warehouse Surat Jalan cek `FINANCIAL_DELIVERY_RELEASE` sebelum cetak

**Success Criteria:**
- ✅ E2E flow: Customer → Sales Order → DO → Finance release HELD → Surat Jalan cetak → Sales Invoice → Receipt
- ✅ Sample Fee: Received → Offset to DP Produksi works
- ✅ AR Aging widget muncul di BusDev dashboard

**Dependencies:** Sprint 1

---

### 🏦 Batch 3C: CASH & BANK (1 minggu) — *PARALLEL dengan Batch 3A & 3B*

**Tujuan:** Bank account management + auto-posted cash transactions + reconciliation.

**Deliverables:**
- [ ] **Backend:**
  - [ ] `BankAccountService` — CRUD, current balance real-time
  - [ ] `BankTransactionService` — auto-generated dari Bayar/AP/AR/DP/Fund, manual entry untuk adjustment
  - [ ] `BankReconciliationService` — import CSV, matching engine (amount + date ±2 hari)
  - [ ] Auto-journal posting: Dr/Cr Bank Account dari semua subledger
- [ ] **Frontend:**
  - [ ] Update `/finance/bank-account-manage` — list + form
  - [ ] Update `/finance/kas-bank-masuk` (rename dari `/finance/cash-in`) — Total Kas Masuk card only, date range custom
  - [ ] Update `/finance/kas-bank-keluar` (rename dari `/finance/cash-out`) — sama dengan Kas Bank Masuk
  - [ ] New `/finance/bank-reconciliation` — 2-column matching UI, filter COA

**Success Criteria:**
- ✅ Bank balance real-time di AP Aging navbar & dashboard
- ✅ Auto-posted entries read-only, manual entries editable
- ✅ Reconciliation: statement import → auto-match → manual drag-drop

**Dependencies:** Sprint 1

---

### 📋 Batch 4A: TAX & COMPLIANCE (3-4 hari) — *PARALLEL dengan Batch 4B*

**Deliverables:**
- [ ] Backend: `TaxRateService` (extend), `TaxTransactionService`, `ClientEscrowService`
- [ ] Frontend: update `/finance/tax`, new `/finance/client-escrow`
- [ ] **Skip:** e-Faktur / e-Bupot DJP integration (sesuai REQUIREMENT Poin 34)

---

### 🏢 Batch 4B: FIXED ASSETS + BUDGET (1 minggu) — *PARALLEL dengan Batch 4A*

**Deliverables:**
- [ ] Backend: `FixedAssetService`, `DepreciationScheduleService`, `AssetTransferService`, `IntangibleAssetService`, `BudgetService`, `BudgetEntryService`
- [ ] Frontend: update `/finance/aset-tetap`, new `/finance/asset-transfer-disposal`, new `/finance/compliance-asset`, new `/finance/budget-entry`, new `/finance/budget-vs-actual`
- [ ] Apply REQUIREMENT Poin 27-30: Purchase History sub-tab, default useful life table

---

### 📈 Batch 5A: COST & PROFITABILITY (1 minggu)

**Tujuan:** Job Order Costing + variance + profitability.

**Deliverables:**
- [ ] Backend: `JobOrderCostingService` (with consignment-aware material cost), `CostVarianceService`, `ProfitabilityService`, `CostAllocationService`
- [ ] Frontend: 4 new pages
- [ ] **Prasyarat:** Modul Production harus sudah ada data BOM/Job Order

**Dependencies:** Modul Production (di luar finance spec)

---

### 🔒 Batch 5B: CLOSING & CONTROLS + DASHBOARD + REPORTS (1-2 minggu)

**Deliverables:**
- [ ] Backend: `PeriodLockService` (FinancialPeriod.isLocked enforcement), `AdjustmentJournalService`, `FinanceOverviewService` (dashboard aggregation), `ReportPenjualanService`
- [ ] Frontend: update `/finance/dashboard` (D365 cards), new `/finance/closing-checklist`, new `/finance/adjustment-journal`, update `/finance/laba-rugi` (format hybrid), new `/finance/report-penjualan`, new `/dashboard/finance` (Finance Overview)
- [ ] Apply Sprint 9 DNA Compliance Pass ke semua finance pages

**Dependencies:** Batch 3A/3B/3C/4A/4B/5A

---

## 🚀 PHASE 2: CROSS-DEPARTMENT (setelah Finance Production-Ready)

> **Setelah Finance production-ready (Phase 1 complete), lanjut ke departemen lain dengan urutan:**
> 1. **Master Data Foundation** (Batch 6) — WAJIB sebelum departemen lain (semua butuh shared master data)
> 2. **Purchase/SCM** (Batch 7) — closest ke Finance (PO/GR trigger AP invoices)
> 3. **BusDev/CRM** (Batch 8) — feeds Finance via AR invoices (Lead → Sample → Quotation → SO)
> 4. **Warehouse** (Batch 9) — inventory, stock opname, mutasi
> 5. **Production** (Batch 10) — 3-tahap CPKB (Mixing → Filling → Packaging)
> 6. **QC** (Batch 11) — In-process inspection, COA, reject handling
> 7. **R&D** (Batch 12) — Formula, Sample, HPP
> 8. **HR** (Batch 13) — Employee, Payroll, Attendance, KPI
> 9. **Legality** (Batch 14) — BPOM, Halal, ISO documents
> 10. **Executive** (Batch 15) — Consolidated dashboard
>
> **Excluded:** Marketing (live, separate module)
>
> **Ordering rationale:**
> - Master Data = foundational (semua butuh)
> - Purchase/SCM = next karena feed ke Finance AP (PO → GR → Bill)
> - BusDev = next karena feed ke Finance AR (Lead → SO → Invoice)
> - Warehouse + Production + QC = trio (kalau salah satu down, sisanya ikut)
> - R&D = anteseden BusDev (formula → sample → commercial)
> - HR + Legality = supporting (relatively independent)
> - Executive = last (consolidates all departments)

---

### 📦 Batch 6: MASTER DATA FOUNDATION (1-2 minggu) — *WAJIB FIRST, blocks semua departemen*

**Tujuan:** Shared master data layer yang dipakai SEMUA departemen. Tanpa ini, departemen lain ga bisa jalan.

**Backend (Prisma + NestJS):**
- [ ] **`MasterCategory`** — kategori barang (Bahan Baku, Kemasan, Finished Goods, dll) — sudah ada di legacy, validasi
- [ ] **`MasterUnit`** — units of measure (pcs, kg, gr, ml, dll)
- [ ] **`MaterialItem`** — master barang (210+ items dari `BARANG.csv`) — validasi kategori + unit
- [ ] **`Warehouse`** — master gudang (dengan alamat, PIC, location) — sudah ada
- [ ] **`WarehouseAccess`** — RBAC per gudang (siapa bisa akses gudang mana)
- [ ] **`Supplier`** — master vendor (dengan NPWP, payment terms, kategori COA) — udah ada, extend
- [ ] **`Customer`** — master customer (dengan brand, PIC, credit limit) — sudah ada
- [ ] **`User` + `Role` + `UserRole`** — RBAC matrix — sudah ada, extend
- [ ] **`MasterKode`** — auto-numbering sequences (per `MASTER_KODE.xlsx`) — auto-gen all document numbers
- [ ] **`Currency`** — multi-currency support (currently IDR only) — sudah ada

**Frontend (DNA pattern):**
- [ ] `/master/barang` — list barang dengan filter + search + import Excel
- [ ] `/master/kategori` — list kategori barang
- [ ] `/master/gudang` — list gudang + warehouse access matrix
- [ ] `/master/vendor` — list vendor dengan payment terms + COA mapping
- [ ] `/master/customer` — list customer dengan credit limit
- [ ] `/master/user` + `/master/role` — RBAC management
- [ ] `/master/unit` — list units of measure

**Testing (Phase T1):**
- [ ] Unit tests: validation rules (e.g., NPWP format, email format)
- [ ] Integration tests: CRUD + auto-numbering
- [ ] E2E: import CSV → validate → save flow

**Success Criteria:**
- ✅ All 209 operational pages have working master data layer
- ✅ Auto-numbering works (no manual input for document numbers)
- ✅ RBAC matrix enforced (user X can't access warehouse Y if not assigned)
- ✅ Import Excel works for bulk master data

**Dependencies:** Phase 0 (DNA), Sprint 1 (schema extension)

---

### 🔀 Batch 6.5: MASTER DATA CONSOLIDATION (3-5 hari) — *PLANNED, NOT STARTED*

> **Status:** 🟡 **Backlog** — added 8 September 2026 per user directive.
> **Blocked:** Tidak bisa mulai sampai Batch 6 (master pages swap-ready) ✅ dan backend bootable. CRUD fix butuh backend hidup untuk verifikasi.

**Tujuan:** Consolidate halaman master yang punya inner sub-modul jadi 1 page dengan nested navbar. Pattern beda dari Batch 6.3 (Daftar/Kelola) — di sini **nested module**, bukan inner tab CRUD.

**Consolidation Items:**

| # | Final Page | Gabungan dari | Pattern |
|---|---|---|---|
| 1 | `/master/pengguna` | `hak-akses` + `pengguna` | 1 page, 2 inner navbar |
| 2 | `/master/coa` | `coa` + `coa-jurnal-otomatis` | 1 page, 2 inner navbar |
| 3 | `/master/supplier` | `supplier` + `kategori-supplier` | 1 page, 2 inner navbar |
| 4 | `/master/barang` | `barang` + `kategori-barang` | 1 page, kategori jadi inner tab |

**Pattern Reference:** `MasterPageShell` (Batch 6.3) handle Daftar/Kelola tab pattern. Untuk multi-modul inner navbar, butuh ekspansi shell atau new shell `MasterPageMultiSection.tsx` dengan `sections: { key, label, href, content }` prop.

**Deliverables per Consolidation:**
- [ ] Backend: verify endpoints untuk kedua sub-modul exist & return data shape kompatibel
- [ ] Frontend: bikin single page dengan inner navbar (a-la Tabs tapi dengan URL fragments)
- [ ] Old routes → redirect ke consolidated page dengan default inner section
- [ ] All operational pages yang reference sub-modul lama → update import path
- [ ] Audit grep + final 0 raw `@/components/ui/*` di konsolidasi

**Bug Fix Parallel (tidak butuh konsolidasi):**
- [ ] **`master/goods/page.tsx` CRUD verification** — user lapor CRUD tidak jalan (Sept 8). Audit menunjukkan Sheet modal + API call pattern udah benar. **Likely root cause:** backend offline (ECONNECTIONREFUSED ke `:3002`). Setelah backend bootable, re-test dan fix kalau ada issue frontend-specific.

**Dependencies:**
- Batch 6 selesai (master pages DNA-ready) — ✅ DONE (5/7 pages clean)
- Backend hidup & stable (saat ini down karena deps chain — perlu `npm ci` di `backend/` dulu)

**Effort estimate:** 3-5 hari (4 halaman x ~1 hari each, plus shared shell ~0.5 hari).

---

### 🛒 Batch 7: PURCHASE / SCM (3-4 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Full Purchase-to-Pay cycle. Purchase Request → PO → Goods Receipt → Quality Check → Bill → Payment.

**Backend:**
- [x] **`PurchaseRequest`** — request barang dari internal (dari warehouse/BOM) — extend existing
- [x] **`PurchaseRequestItem`** — line items request
- [x] **`PurchaseOrder`** — PO yang dikirim ke vendor — dual prefix `scm/purchase-orders` & `v1/scm/purchase-orders`
- [x] **`PurchaseOrderItem`** — line items PO (qty, harga, diskon, ongkir)
- [x] **`GoodsReceipt`** (Penerimaan Barang / Inbound) — actual barang yang datang dari vendor dengan batch/lot & expiry
- [x] **`GoodsReceiptItem`** — line items GR dengan qty diterima, qty reject, qty bonus
- [x] **`QCInspection`** — status inspeksi QC pada inbound
- [x] **`PurchaseReturn`** — retur ke vendor (Debit Memo)
- [x] **Event emission & Route Synchronization**: Dual route prefixes `['scm/...', 'v1/scm/...']` synced across all SCM controllers

**Frontend:**
- [x] `/scm/purchase-requests` — PR list + create + 1-click convert to PO
- [x] `/scm/pembelian` & `/scm/purchasing` — PO list + create + send to vendor
- [x] `/scm/receiving` — GR/Inbound list + create (dengan batch, lot, expired date, storage location)
- [x] `/scm/purchase-returns` — Retur ke vendor dengan Debit Memo flow
- [x] `/scm/kebutuhan-barang` & `/scm/mrp` — Perhitungan kebutuhan material & direct PO trigger
- [x] All operational pages 100% DNA compliant (zero `@/components/ui/*` imports per ADR-007)

**Integration:**
- [x] PO created di SCM → ready for reference in Finance AP Invoices (`/finance/faktur-pembelian`)
- [x] GR completed → stock-in & audit logging
- [x] Sidebar updated with `Penerimaan Barang` (`/scm/receiving`) & direct routing to Finance Bill

**Success Criteria:**
- ✅ PR → PO → GR → AP Bill chain works end-to-end
- ✅ Dual routes `scm/*` and `v1/scm/*` supported seamlessly
- ✅ Zero `@/components/ui/*` imports in operational SCM pages
- ✅ All SCM pages pass strict TypeScript verification

**Dependencies:** Batch 6 (master data) — COMPLETE

---

#### 💼 Batch 8: BUSDEV / CRM (3-4 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Full Lead-to-Cash cycle. Lead capture → Sample → Quotation → Sales Order → Delivery → Invoice → Payment.

**Backend:**
- [x] **`Lead`** — lead dari marketing/referral — dual routes `['bussdev', 'v1/bussdev']`
- [x] **`LeadActivity`** — touchpoint tracking & interaction logging
- [x] **`SampleRequest`** & **`SampleResult`** — permintaan sample & formula tracking
- [x] **`SalesOrder`** (SO) & **`SalesOrderItem`** — order confirmation
- [x] **`DeliveryOrder`** (DO / Surat Jalan) & **`SalesReturn`**
- [x] **`LostDeals`** — dual routes `['crm/lost-deals', 'v1/crm/lost-deals']`

**Frontend:**
- [x] All 9 operational pages 100% DNA compliant (ADR-007):
  - `/bussdev/client-manager`, `/bussdev/down-payment`, `/bussdev/guest-book`, `/bussdev/intake`
  - `/bussdev/retur-penjualan`, `/bussdev/sales-target`, `/bussdev/sample-sales` (input & list), `/bussdev/sample-tracking`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 🏭 Batch 9: WAREHOUSE & INVENTORY (2-3 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Full inventory management — stock movements, opname, transfer, multi-warehouse.

**Backend:**
- [x] **`IdempotencyService`** & **`IdempotencyInterceptor`** & **`@Idempotent()`** — mencegah double-click duplikasi mutasi
- [x] **`WarehouseController`** — dual routes `['warehouse', 'v1/warehouse']`
- [x] **`MaterialInventory`**, **`StockMovement`**, **`StockAdjustment`**, **`StockOpname`**

**Frontend:**
- [x] All 14 operational pages & components 100% DNA compliant (ADR-007):
  - `/warehouse/stok`, `/warehouse/mutasi-stok`, `/warehouse/opname`, `/warehouse/pindah-gudang`
  - `/warehouse/adjustment`, `/warehouse/inbound`, `/warehouse/gudang`, `/warehouse/transfers`
  - `/warehouse/release`, `/warehouse/workstation`, `/warehouse/map`, `Rankings`, `VelocityMatrix`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 🏭 Batch 10: PRODUCTION (3-4 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Full Production cycle — 3-tahap CPKB (Mixing, Filling, Packaging) dengan traceability batch record.

**Backend:**
- [x] **`ProductionController`** — dual routes `['production', 'v1/production']`
- [x] **`ProductionPlansController`** — dual routes `['production-plans', 'v1/production-plans']`
- [x] **`RequisitionsController`** — dual routes `['material-requisitions', 'v1/material-requisitions']`
- [x] **`StepLogsController`** — dual routes `['production/step-logs', 'v1/production/step-logs']`

**Frontend:**
- [x] All operational pages 100% DNA compliant (ADR-007):
  - `/production/batch-records`, `/production/formula-adjustment`, `/production/operations`
  - `/production/schedule`, `/production/work-orders`, `/production/audit`, `/production/my-performance`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 🔬 Batch 11: QC (1-2 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Quality Control — In-process inspection, Certificate of Analysis (COA), checklist & stability testing.

**Backend:**
- [x] **`QcController`** — dual routes `['qc', 'v1/qc']`
- [x] **`QCChecklistsController`** — dual routes `['qc/checklists', 'v1/qc/checklists']`
- [x] **`QCAuditsController`** — dual routes `['qc/audits', 'v1/qc/audits']`
- [x] **`QCAnalyticsController`** — dual routes `['qc/analytics', 'v1/qc/analytics']`

**Frontend:**
- [x] All 8 operational pages 100% DNA compliant (ADR-007):
  - `/qc/checklist/progress`, `/qc/checklist/tracking`, `/qc/checklist-category`
  - `/qc/coa`, `/qc/inspections`, `/qc/report`, `/qc/stability`, `/qc/workbench`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 🧪 Batch 12: R&D (2-3 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Research & Development — Formula, Sample testing, HPP calculation, INCI regulation.

**Backend:**
- [x] **`RndController`** — dual routes `['rnd', 'v1/rnd']`
- [x] **`FormulasController`** — dual routes `['rnd/formulas', 'v1/rnd/formulas']`
- [x] **`NpfController`** — dual routes `['rnd/npf', 'v1/rnd/npf']`
- [x] **`SamplesController`** — dual routes `['rnd/formulations', 'v1/rnd/formulations']`

**Frontend:**
- [x] All operational pages 100% DNA compliant (ADR-007):
  - `/rnd/formula/[id]`, `/rnd/lab-test`, `/rnd/master-inci`, `/rnd/pipeline`
  - `/rnd/repository`, `/rnd/revision-tracker`, `/rnd/inbox`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 👥 Batch 13: HR (2 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Employee management, Payroll, Attendance, KPI, Tickets.

**Backend:**
- [x] **`HrController`** — dual routes `['hr', 'v1/hr']`
- [x] **`UpdateEmployeeDto`**, **`ApproveTicketDto`**, **`CreateTicketDto`** — DTO fixes & validations

**Frontend:**
- [x] All operational pages 100% DNA compliant (ADR-007):
  - `/hr/attendance`, `/hr/kpi`, `/hr/payroll`, `/hr/recruitment`, `/hr/tickets`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### ⚖️ Batch 14: LEGALITY (1-2 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Legal document management — BPOM, Halal, ISO certification, CPKB Audit, APJ Release.

**Backend:**
- [x] **`LegalityController`** — dual routes `['legality', 'v1/legality']`
- [x] **`RegulatoryPipeline`**, **`DocumentDraft`**, **`LegalEntity`**, **`Permit`**

**Frontend:**
- [x] All operational pages 100% DNA compliant (ADR-007):
  - `/legality/records`, `/legality/input`, `/legality/ckpb-audit`, `/legality/pipeline`
  - `/legality/apj-release`, `/legality/master-inci`, `/legality/inbox`, `/legality/permits`
- [x] Zero `@/components/ui/*` imports in operational pages; 0 TypeScript errors

---

### 🏛️ Batch 15: EXECUTIVE (1-2 minggu) — *DONE (Sept 8, 2026)*

**Tujuan:** Consolidated executive dashboard — pulls data dari semua departemen (Finance, SCM, BusDev, Production, Warehouse, QC, HR, Legality).

**Backend:**
- [x] **`ExecutiveController`** — dual routes `['executive', 'v1/executive']`
- [x] **`ExecutiveService`** — consolidated aggregated KPIs & alerts (`getExecutiveMetrics`, `getExecutiveAlerts`, `getAuditLogs`)
- [x] **`AuditLogs`** API endpoint — tracking riwayat aksi seluruh subledger

**Frontend:**
- [x] All operational pages & components 100% DNA compliant (ADR-007):
  - `/executive/dashboard` (`ExecutiveDashboardClient`, `NotificationHubClient`)
  - `/executive/notifications`
  - `/executive/audit`
- [x] Zero `@/components/ui/*` imports; 0 TypeScript errors

**Dependencies:** Batch 1-14 (semua departemen production-ready) — COMPLETE!

---

## 🔄 PHASE T-CROSS: CROSS-DIVISIONAL TESTING (2 minggu, setelah Phase 2 selesai)

> **🔴 WAJIB** — Test per fase dengan flow lintas departemen. Bukan test per departemen sendiri-sendiri.

### Test Flow 1: BusDev → R&D → Production → Deal

**Skenario**: Lead tertarik produk → minta sample → R&D develop formula → customer deal → Production → Finance invoice

**Steps:**
1. Lead capture (BusDev) → create Lead
2. Sample request → R&D develops formula → lab test → approved
3. Quotation (BusDev) → customer signs → SO created
4. Production Plan → Mixing → Filling → Packaging → Finished Goods
5. Warehouse stock in → DO created → delivered
6. Finance AR Invoice → customer payment → AR Receipt
7. Executive dashboard updated with all KPIs

**Pass criteria:** All 6 departments' data flows correctly through the chain. Audit trail complete.

---

### Test Flow 2: Purchase → GR → QC → AP

**Skenario**: Internal butuh barang → Purchase Order → vendor kirim → QC check → Bill → Payment

**Steps:**
1. Material Requisition (Warehouse/Production) → Purchase Request (SCM)
2. PO created → sent to vendor
3. Goods Receipt → qty received, qty reject, qty bonus
4. QC Inspection → pass/fail
5. If pass → Finance Bill created (auto-link to PO + GR)
6. AP Payment → journal balanced
7. Vendor rating updated

**Pass criteria:** 3-way matching (PO ↔ GR ↔ QC ↔ Bill) works. Reject handling creates correct journal entries.

---

### Test Flow 3: SO → DO → AR → Receipt

**Skenario**: Customer order → Production → Delivery → Invoice → Payment

**Steps:**
1. Sales Order confirmed (BusDev)
2. Production Plan triggered → Finished Goods
3. DO created → Warehouse picking
4. DO delivered → AR Invoice (Finance)
5. AR Delivery Gatekeeper cleared
6. Customer payment → AR Receipt → bank reconcile
7. Executive dashboard updated

**Pass criteria:** AR Delivery Gatekeeper prevents DO from going to customer until finance approves.

---

### Test Flow 4: Closing Period → Reporting → Executive

**Skenario**: End of month — closing all subledgers → generating reports → executive review

**Steps:**
1. All subledgers closed for period
2. Period Lock applied
3. Adjustment Journal for known discrepancies
4. Closing Checklist completed (per department sign-off)
5. Financial Reports generated (Neraca, Laba Rugi, Cash Flow)
6. Department-specific reports (Sales Report, Purchase Report, Production Report)
7. Executive Dashboard updated
8. Period marked as Closed

**Pass criteria:** Period Lock prevents further transactions. All reports balance. Executive sees consolidated view.

---

## 📊 Updated Timeline (Cross-Department Full)

| Phase | Scope | Solo Estimate | 3-Dev Estimate |
|---|---|---|---|
| **Phase 1 (Finance)** | Sprint 0-9 (DNA, Schema, AP/AR/Cash/Tax/Assets/Cost/Closing/Compliance) | 14-18 weeks | 5-7 weeks |
| **Phase 2 (Cross-Department)** | Batch 6-15 (Master Data, SCM, BusDev, Warehouse, Production, QC, R&D, HR, Legality, Executive) | 14-18 weeks | 5-7 weeks |
| **Phase T (Testing)** | Phase T1 + T2 (unit + integration + E2E) | 3-4 weeks | 1-2 weeks |
| **Phase T-Cross (Cross-Divisional)** | 4 cross-divisional test flows | 2 weeks | 1 week |
| **Phase U (UAT)** | Per-module UAT + UAT per department | 3-4 weeks | 1-2 weeks |
| **Phase Go-Live** | Cutover + Hypercare | 2-3 weeks | 1-2 weeks |
| **TOTAL** | Full ERP excluding Marketing | **38-47 weeks solo** | **14-21 weeks (3 devs)** |

**For 3-dev realistic timeline:** 14-21 weeks (3.5-5 months)
**For solo realistic timeline:** 38-47 weeks (9-11 months)

**Marketing module is EXCLUDED** (live, separate team).

---

### 🎨 Sprint 9: DNA COMPLIANCE PASS (1 minggu)

**Tujuan:** Migrate 80+ pages dari hardcoded styles → DNA components.

**⚠️ SCOPE — READ FIRST:**
- ✅ **EDIT:** Operational pages (list, form, detail) — SEMUA divisi kecuali Digital Marketing
- ✅ **EDIT:** Project Control pages, KPI Management pages
- 🚫 **EXCLUDED:** Semua dashboard pages (lihat Appendix D)
- 🚫 **EXCLUDED:** Module Digital Marketing (seluruhnya)
- 🚫 **EXCLUDED:** Dashboard exceptions (Finance trend, Bussdev widget, DigMar funnel) — JANGAN dihapus

**Deliverables:**
- [ ] Replace hardcoded `bg-emerald-100 text-emerald-700` patterns → `<DnaCell.Badge>`
- [ ] Replace solid `bg-blue-600` table row buttons → `<DnaTableRowActions>`
- [ ] Replace `rounded-lg` cards/inputs → `rounded-xl` (token) — di operational pages ONLY
- [ ] Replace custom search inputs → `<DnaInput>`
- [ ] Replace custom pagination → `<DnaPagination>`
- [ ] Replace custom tabs → `<DnaTabNav>`
- [ ] Apply Golden Reference compositional pattern ke semua finance pages
- [ ] Visual regression test: 99% similarity dengan baseline (operational pages only)

**Success Criteria:**
- ✅ VISUAL_DNA_AUDIT.md violations: 80+ → 0 (di operational pages only)
- ✅ Dashboard pages: 0 perubahan (verified via git diff)
- ✅ Digital Marketing module: 0 file yang disentuh (verified via git diff)
- ✅ All operational pages pass Playwright visual regression

**Dependencies:** Batch 5B

---

### 📚 Phase 10: LIVING DOCUMENTATION (2-3 hari)

**Tujuan:** Documentation yang auto-update, gak manual lagi.

**Deliverables:**
- [ ] Auto-generate DNA component catalog dari JSDoc → `frontend/docs/DNA_CATALOG.md`
- [ ] Auto-update `frontend/VISUAL_DNA_AUDIT.md` setiap CI run (lint pass = violations count turun)
- [ ] Generate component dependency graph → detect dead code otomatis
- [ ] Add OpenAPI/Swagger generated types di backend → propagate ke frontend types
- [ ] Interactive playground di `/dna-visual` — developer bisa test DNA components live

**Dependencies:** Sprint 9

---

### ♾️ Phase ∞: CONFIG-DRIVEN ARCHITECTURE (ongoing, integrate ke tiap sprint)

**Tujuan:** Tambah fitur = tambah config, bukan tambah code banyak.

**Pattern Guidelines:**
- [ ] **Column definitions** di `frontend/src/modules/<name>/config/columns.tsx` — bukan di JSX render
- [ ] **Form fields** auto-generated dari Zod schema di `frontend/src/modules/<name>/schemas/*.ts`
- [ ] **API behavior flags** di `backend/src/config/features.ts` — feature toggles untuk rollout gradual
- [ ] **Module folder structure** standar:
  ```
  src/modules/<name>/
    controllers/
    services/
    dto/
    events/        ← cross-module event emitters
    interfaces/    ← public API (exported)
    internal/      ← private (NOT exported)
  ```

**Acceptance:**
- Adding new column = edit 1 column config file
- Adding new form field = edit 1 Zod schema
- Adding new feature = set feature flag + add config

---

### 🧪 Phase T: TESTING (terintegrasi di tiap sprint + dedicated phase)

**Tujuan:** Quality gate otomatis — gak ada bug lolos ke production.

#### T1. Per-Sprint Testing (continuous, ~30% sprint effort)

| Test Type | Tool | Target | Owner |
|---|---|---|---|
| **Unit tests** backend services | Jest + NestJS Testing | coverage ≥ 70% | Backend dev |
| **Unit tests** DNA components | Vitest + Testing Library | coverage ≥ 70% | Frontend dev |
| **Unit tests** business logic (tax, matching, posting) | Jest | 100% critical paths | Backend dev |
| **Integration tests** API endpoints | Jest + supertest | semua critical endpoints | Backend dev |
| **E2E tests** user flows | Playwright | critical paths per sprint | Frontend dev |

**Per-sprint deliverables:**
- [ ] Setiap sprint nambah test coverage, bukan feature
- [ ] CI pipeline run semua tests sebelum merge
- [ ] Coverage report di-comment setiap PR

#### T2. Pre-Production E2E Suite (1 minggu, dedicated)

**Deliverables:**
- [ ] **Login & Auth E2E** — login, logout, role-based access, session management
- [ ] **AP Cycle E2E** — Vendor → PO → GR → Bill → Payment → Journal
- [ ] **AR Cycle E2E** — Customer → SO → DO → Invoice → Receipt → Journal
- [ ] **Cash & Bank E2E** — Transfer reconciliation, manual entries, auto-posting
- [ ] **Tax E2E** — PPN calculation, PPh 23 withholding, tax report generation
- [ ] **Closing E2E** — Period lock, adjustment journal, closing checklist
- [ ] **Cross-module E2E** — PO creation in SCM triggers journal in Finance, AR Delivery Gatekeeper
- [ ] **Permission E2E** — different roles see different modules/actions

**Coverage target:** 100% critical paths tested, 80% happy paths tested.

**Output:** `tests/e2e/<module>/*.spec.ts` — 50+ E2E test files.

---

### 📚 Phase U: UAT DOCUMENTATION & TRAINING (1 minggu, setelah T2)

**Tujuan:** End-user bisa adopt sistem dengan mandiri — gak butuh training onsite yang lama.

#### U1. UAT Test Scripts (3 hari)

**Deliverables:**
- [ ] **UAT Script per Modul** (per finance page) — step-by-step manual test case
- [ ] **UAT Acceptance Criteria** — checklist apa yang harus verified per modul
- [ ] **UAT Sign-off Template** — form untuk finance manager approve hasil UAT
- [ ] **Known Issues Log** — issue yang di-acknowledge tapi gak blocker

**Format:** Markdown per module, copy-paste ready untuk dijalankan sama tim finance.

#### U2. User Guides per Role (2 hari)

| Role | Guide |
|---|---|
| **Finance Staff** (input transaksi) | Cara input Faktur Pembelian, Pembayaran, DP, Jurnal Umum, Sample Fee |
| **Finance Manager** (approval) | Cara approve dokumen, run closing, manage COA |
| **AP/AR Clerk** | Cara manage vendor/customer, rekonsiliasi bank, follow up collection |
| **Auditor** (read-only review) | Cara generate laporan, drill-down transaksi, audit trail |
| **Admin** | Setup master data, user management, posting rules, period lock |

**Format:** PDF + HTML (online), dengan screenshots per step.

#### U3. Admin & Deployment Guide (1 hari)

**Deliverables:**
- [ ] **Admin Guide** — setup master data awal (COA, vendor, customer, bank account), posting rules, approval workflow
- [ ] **Deployment Runbook** — step-by-step deploy ke production + rollback procedure
- [ ] **Troubleshooting Guide** — common errors + fixes (e.g., journal unbalanced, payment stuck)
- [ ] **API Documentation** — auto-generated OpenAPI/Swagger UI untuk developer
- [ ] **CHANGELOG** — per-release notes untuk end-user

**Output:** `docs/admin-guide.md`, `docs/deployment.md`, `docs/troubleshooting.md`

#### U4. Training Materials (1 hari, optional)

- [ ] Video walkthrough per modul (5-10 menit per video)
- [ ] Slide deck untuk training onsite
- [ ] FAQ document berdasarkan UAT feedback

---

## 6. Parallelization Strategy (THE BATCHES)

> **Kunci:** Phase 0-1 sequential (fondasi). Phase 2 batches bisa diparallel-kan per domain (tergantung dependency).

### 6.1 Parallelism Rules

**WAJIB SEQUENTIAL (ga bisa paralel):**
- Batch 6 (Master Data) → WAJIB sebelum Batch 7-15 (semua butuh master data)

**BISA PARALEL (per division, 1 dev per batch):**
- Batch 7 (Purchase/SCM) ↔ Batch 8 (BusDev/CRM) — beda domain
- Batch 9 (Warehouse) ↔ Batch 10 (Production) — beda domain (tapi Batch 10 butuh Batch 9)
- Batch 11 (QC) ↔ Batch 12 (R&D) — beda domain
- Batch 13 (HR) ↔ Batch 14 (Legality) — independent

**DEPENDENCIES antar batch (harus sequential):**
- Batch 7 (Purchase/SCM) → Batch 8 (BusDev) butuh reference Vendor
- Batch 9 (Warehouse) → Batch 10 (Production) butuh Material + Gudang
- Batch 10 (Production) → Batch 11 (QC) butuh hasil produksi
- Batch 8 (BusDev) → Batch 12 (R&D) — feedback loop sample

**Cross-Divisional Testing (Phase T-Cross):**
- Bisa paralel per flow setelah semua batch di flow tersebut production-ready
- Flow 1 (BusDev → R&D → Production) bisa mulai setelah Batch 8, 12, 10 done
- Flow 2 (Purchase → GR → QC → AP) bisa mulai setelah Batch 7, 11 done

### 6.2 Reference Inventory (CSV + Files Yang Digunakan PRD Ini)

> **🔴 Setiap page di PRD WAJIB refer ke file legacy yang relevan.** Kalau CSV ada, kolom di page = kolom di CSV (no inventing columns).

| Departemen | CSV/Source File | Digunakan Untuk |
|---|---|---|
| **Finance (AP)** | `docs/legacy-erp/REQUIREMENT.md` Poin 1-7 | Faktur Pembelian, DP, Bayar, AP Aging |
| **Finance (AR)** | `docs/legacy-erp/REQUIREMENT.md` Poin 24-30 | Faktur Penjualan, DP Penjualan, Bayar, AR Aging |
| **Finance (Kas/Bank)** | `docs/legacy-erp/REQUIREMENT.md` Poin 31-37 | Kas Bank Masuk/Keluar, Rekonsiliasi |
| **Finance (Aset)** | `docs/legacy-erp/REQUIREMENT.md` Poin 62-71 | Aset Tetap, Master Useful Life |
| **Finance (Pajak)** | `docs/legacy-erp/REQUIREMENT.md` Poin 80 | Tax module = SKIP (e-Faktur) |
| **Finance (Laporan)** | `docs/legacy-erp/REQUIREMENT.md` Poin 72-77 | Buku Besar, Laba Rugi, dll |
| **Master Data** | `docs/legacy-erp/kil_erp_full_inventory_v2.csv` | Master barang, vendor, customer (semua departemen) |
| **Purchase/SCM** | `docs/legacy-erp/REQUIREMENT.md` Poin 84-156 | PR, PO, GR, QC, Retur, Approval |
| **BusDev/CRM** | `docs/legacy-erp/Client_Sample_Busdev.csv` | Client Sample (28 kolom) |
| **R&D** | `docs/legacy-erp/Daily_tracking_RND.csv` | Daily Tracking (14 kolom) |
| **R&D** | `docs/legacy-erp/Project_Monitoring_RND.csv` | Project Monitoring (11 kolom) |
| **Production** | `docs/legacy-erp/LEGACY_ERP_SPEC.md` + `production.md` | Batch record, 3-tahap CPKB |
| **Warehouse** | `docs/legacy-erp/warehouse.md` | Stok, mutasi, opname |
| **QC** | `docs/legacy-erp/quality_control.md` | Checklist, COA |
| **HR** | `docs/legacy-erp/HR.md` | Employee, payroll, attendance |
| **Legality** | `docs/legacy-erp/legalitas.md` | BPOM, Halal, ISO |
| **Cross-departemen** | `docs/legacy-erp/kil_erp_full_inventory_v2.csv` + `NEX_FINANCE_FINAL_SPEC.md` | URL inventory + business process |

### 6.3 🛡️ SINGLE-TRUTH RULE (CSV Inventory)

> **🔴 HARD RULE — CSV `kil_erp_full_inventory_v2.csv` adalah SINGLE SOURCE OF TRUTH untuk inventory ERP.**

**Aturan utama:**

1. **Setiap page baru** WAJIB ditambahkan ke CSV sebelum coding dimulai
2. **Setiap requirement/input/output change** WAJIB di-update di CSV row yang relevan (kolom `Cards`, `Table Columns`, `Inputs`, `View/Detail`, `Actions`)
3. **Kolom di page = kolom di CSV** (no inventing columns). Kalau mau nambah kolom baru → update CSV dulu + note di Section 15 (REQUIREMENT_TRACEABILITY)
4. **Setiap CSV update WAJIB di-commit ke Git** dengan message jelas
5. **Conflict resolution**: CSV > REQUIREMENT.md > PRD > existing code (lihat Section 17)

**Workflow setiap ada perubahan requirement:**

```
1. Update docs/legacy-erp/kil_erp_full_inventory_v2.csv
   (tambah row baru ATAU update row existing)
   ↓
2. Update docs/legacy-erp/REQUIREMENT.md (kalau poin baru)
   ↓
3. Update plan/NEX_ERP_REFACTOR_ROADMAP.md
   (requirement traceability + batch deliverables)
   ↓
4. git commit dengan message jelas per step
```

**Contoh sudah dilakukan:**
- ✅ Daily Tracking R&D (`/rnd/daily-tracking`) — 14 kolom dari `Daily_tracking_RND.csv`
- ✅ Project Monitoring R&D (`/rnd/project-monitoring`) — 11 kolom dari `Project_Monitoring_RND.csv`
- ⚠️ Client Sample (`/bussdev/client-sample`) — existing row punya abbreviated columns, perlu update ke full 28 kolom dari `Client_Sample_Busdev.csv` (TODO saat Batch 8)

**Audit CSV periodic** (Phase T-Cross): setiap sprint, verify CSV entries match actual implemented pages. Drift detected → update CSV.

**Cara pakai references:**
1. Sebelum bikin page baru, READ CSV/spec terkait dulu
2. Kolom tabel = kolom di CSV (TIDAK boleh nambah/hapus sembarangan)
3. Kalau ada kolom baru yang ditambahkan → note di Section 15 (REQUIREMENT_TRACEABILITY)
4. Kalau CSV vs REQUIREMENT bertentangan → apply Section 17 (KONTRADIKSI_RESOLUTION) priority



### Batch Diagram

```
WEEK 1-2: FOUNDATION (sequential, semua dev full)
├─ Phase 0: DNA Lock ────────────────┐
├─ Sprint 0: Quick Wins ─────────────┤── ALL HANDS
├─ Sprint 0.5: DNA Consolidation ────┤
└─ Sprint 1: Backend Schema ─────────┘
            │
            ▼
WEEK 3-5: PARALLEL CORE (3 dev split)
┌─────────────┬─────────────┬─────────────┐
│ Batch 3A    │ Batch 3B    │ Batch 3C    │
│ AP Cycle    │ AR Cycle    │ Cash & Bank │
│ (1 week)    │ (1 week)    │ (1 week)    │
└─────────────┴─────────────┴─────────────┘
            │
            ▼
WEEK 6: PARALLEL SUPPORT (2 dev split)
┌──────────────────┬──────────────────┐
│ Batch 4A         │ Batch 4B         │
│ Tax & Compliance │ Assets + Budget  │
│ (3-4 days)       │ (1 week)         │
└──────────────────┴──────────────────┘
            │
            ▼
WEEK 7: COST (1 dev, waiting on Production data)
┌────────────────────────────────────┐
│ Batch 5A                           │
│ Cost & Profitability               │
│ (1 week)                           │
└────────────────────────────────────┘
            │
            ▼
WEEK 8-9: CLOSING + REPORTS + POLISH (parallel possible)
┌──────────────────┬──────────────────┐
│ Batch 5B         │ Sprint 9         │
│ Closing+Reports  │ DNA Compliance   │
│ (1-2 weeks)      │ (1 week)         │
└──────────────────┴──────────────────┘
            │
            ▼
WEEK 10: LIVING DNA (1 dev)
┌────────────────────────────────────┐
│ Phase 10                           │
│ Living Documentation               │
│ (2-3 days)                         │
└────────────────────────────────────┘
```

### Batch Detail

| Batch | Name | Duration | Dev Count | Parallel With | Critical Path |
|---|---|---|---|---|---|
| **1** | Foundation | 1-2 weeks | All | — | ✅ YES |
| **2** | Schema (Sprint 1) | 3-4 days | 1 | Sprint 0.5 | ✅ YES |
| **3A** | AP Cycle | 1 week | 1 | 3B, 3C | ⚠️ Blocking Batch 5B |
| **3B** | AR Cycle | 1 week | 1 | 3A, 3C | ⚠️ Blocking Batch 5B |
| **3C** | Cash & Bank | 1 week | 1 | 3A, 3B | ⚠️ Blocking Batch 5B |
| **4A** | Tax & Compliance | 3-4 days | 1 | 4B | ✅ Independent |
| **4B** | Assets + Budget | 1 week | 1 | 4A | ✅ Independent |
| **5A** | Cost & Profitability | 1 week | 1 | 5B (partial) | ⚠️ Needs Production data |
| **5B** | Closing + Reports | 1-2 weeks | 1-2 | 5A, Sprint 9 | ✅ YES (last before polish) |
| **9** | DNA Compliance | 1 week | 1 | 5B | ✅ YES |
| **10** | Living DNA | 2-3 days | 1 | — | ✅ YES |
| **∞** | Config-Driven | ongoing | All | All sprints | ✅ Continuous |

### Batch Rules (PENTING)
1. **Batch 1 sequential, no parallel.** Foundation must stabilize dulu.
2. **Batch 3A/3B/3C fully parallel.** AP, AR, Cash & Bank — beda modul, beda developer. Tidak conflict.
3. **Batch 4A/4B parallel.** Tax + Assets independent.
4. **Batch 5A bisa parallel dengan 5B** (partial), tapi Period Lock di 5B butuh 5A selesai.
5. **Sprint 9 bisa parallel dengan 5B** (beda pages, beda concern).
6. **Phase 10 starts setelah Sprint 9 first pass complete** (bisa overlap 50%).

---

## 7. Team Structure & Scenarios

### Scenario A: Solo Developer (1 dev)

```
Week 1-2:  Phase 0 + Sprint 0 + Sprint 0.5 + Sprint 1 (sequential)
Week 3:    Batch 3A (AP) — full focus
Week 4:    Batch 3B (AR) — full focus
Week 5:    Batch 3C (Cash & Bank) — full focus
Week 6:    Batch 4A + 4B (sequential, 1 dev)
Week 7:    Batch 5A (Cost)
Week 8-9:  Batch 5B + Sprint 9 (overlap 50%)
Week 10:   Phase 10 (Living DNA)

TOTAL: 10-11 weeks
```

### Scenario B: 2 Developers

```
Week 1-2:  BOTH: Phase 0 + Sprint 0 + Sprint 0.5 + Sprint 1 (pair programming for foundation)
Week 3-5:  PARALLEL
           Dev A: Batch 3A (AP) → Batch 5A (Cost)
           Dev B: Batch 3B (AR) → Batch 3C (Cash & Bank) → Batch 4A (Tax)
Week 6:    PARALLEL
           Dev A: Batch 4B (Assets)
           Dev B: Batch 5B (Closing+Reports) — partial start
Week 7-8:  PARALLEL
           Dev A: Sprint 9 (DNA Compliance)
           Dev B: Batch 5B complete
Week 9:    BOTH: Phase 10 (Living DNA)

TOTAL: 6-7 weeks
```

### Scenario C: 3 Developers (OPTIMAL)

```
Week 1:    ALL 3: Phase 0 + Sprint 0 + Sprint 0.5 + Sprint 1
Week 2-4:  PARALLEL
           Dev A: Batch 3A (AP) — owns AP forever
           Dev B: Batch 3B (AR) — owns AR forever
           Dev C: Batch 3C (Cash & Bank) — owns Banking forever
Week 5:    PARALLEL
           Dev A: Batch 5A (Cost) — AP owner, natural fit
           Dev B: Batch 4A (Tax) — AR-related tax work
           Dev C: Batch 4B (Assets)
Week 6-7:  PARALLEL
           Dev A: Batch 5B (Closing — uses AP/Cost)
           Dev B: Sprint 9 (DNA Compliance — AR pages first)
           Dev C: Sprint 9 (DNA Compliance — Cash/Bank pages)
Week 8:    ALL 3: Phase 10 (Living DNA)

TOTAL: 4-5 weeks (FASTEST with 3 devs)
```

### Scenario D: 4+ Developers

> **NOT RECOMMENDED** — coordination overhead > speed gain. Kalau memang ada 4+ devs, split ownership:
> - Dev A: AP + Cost + Closing (the "AP owner")
> - Dev B: AR + Sample Fee + AR Aging (the "AR owner")
> - Dev C: Cash + Bank + Tax + Assets (the "Treasury owner")
> - Dev D: Reports + Dashboard + Living DNA (the "Reporting owner")
>
> Pair-review each other's PR. Migrations coordinated by 1 lead.

---

## 8. Dependencies & Critical Path

### Critical Path (yang tidak bisa di-skip)
```
Phase 0 (DNA Lock)
  → Sprint 1 (Schema)
    → Batch 3A (AP) ┐
    → Batch 3B (AR) ├─ all parallel
    → Batch 3C (Cash)┘
      → Batch 5B (Closing — uses all above)
        → Sprint 9 (DNA Compliance)
          → Phase 10 (Living DNA)
```

**Minimum timeline (dengan parallelization):** 4-5 minggu (3 devs) atau 10-11 minggu (1 dev)

### Non-Critical (bisa di-defer atau parallel)
- Batch 4A (Tax) — bisa parallel dengan Batch 5A
- Batch 4B (Assets) — bisa parallel dengan Batch 5A
- Batch 5A (Cost) — butuh Production data, mungkin deliver sebagai MVP terpisah
- Sprint 9 (DNA Compliance) — bisa partial overlap dengan Batch 5B

### External Dependencies
- **Production module:** Batch 5A butuh data BOM/Job Order → koordinasikan dengan team Production
- **QC module:** AP matching 4-leg butuh QC Passed Qty → koordinasikan dengan team QC
- **Warehouse module:** AR Delivery Gatekeeper integrasi 2 arah → koordinasikan dengan team Warehouse

---

## 9. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Visual regression break** banyak pages saat refactor | High | Medium | Playwright baseline + 99% threshold per commit |
| **Schema migration breaks existing data** | Medium | High | Backup DB sebelum migrate; staging test dulu |
| **Business logic drift** (frontend hardcode vs backend) | High | High | ADR-005: NO hardcoded business rules in FE; code review enforce |
| **3 devs coordination overhead** | Medium | Medium | Pair-programming foundation week; clear ownership per module |
| **Solo dev burnout** (10-11 weeks) | Medium | High | Break jadi 2-3 mini-milestones, celebrate each |
| **Spec berubah** (Upii minta tambahan) | High | Medium | ADR process + sprint impact analysis sebelum commit |
| **e-Faktur DJP tiba-tiba diminta** | Low | High | Out-of-scope documented; offer as separate project |
| **Production/QC/Warehouse team delay** | Medium | Medium | Batch 5A (Cost) defer-able; matching engine fallback 3-leg |
| **Type generation tooling** (OpenAPI setup) | Medium | Low | Phase 10 task; bisa manual dulu selama development |

---

## 10. Success Metrics

### Phase-level Metrics

| Phase | Metric | Target | Status Check |
|---|---|---|---|
| Phase 0 | ESLint rules active | 100% | `npm run lint` exit code |
| Sprint 0 | Broken pages | 0 (dari 6) | grep broken pattern |
| Sprint 0.5 | Duplicate components | 0 pairs (dari 6+) | grep duplicate names |
| Sprint 1 | Prisma models | 24 new + 24 service stubs | `npx prisma migrate` |
| Batch 3A | AP E2E flow | Vendor → Bill → Match → Pay → Journal | manual E2E test |
| Batch 3B | AR E2E flow + Sample Fee offset | SO → DO → Invoice → Receipt → Offset | manual E2E test |
| Batch 3C | Bank reconciliation accuracy | 100% match rate di tolerance | sample data test |
| Sprint 9 | VISUAL_DNA compliance | 100% (dari 0%) | Playwright visual regression |
| Phase 10 | Docs auto-generated | All DNA components cataloged | grep catalog vs source |

### Long-term Metrics (after full completion)
- **Time-to-feature:** tambah 1 kolom baru di halaman standar = <1 hari (currently 2-3 hari)
- **Visual regression rate:** <1% false positive per sprint
- **Build health:** TS strict pass + lint pass + visual regression pass = 100% green
- **Page completeness:** 269 / 269 (currently 0/269 DNA-complete)

---

## 11. Open Questions

> Questions yang perlu confirm sebelum execution.

### Q1: Team size & timeline expectation?
- Opsi A: Solo, 10-11 minggu
- Opsi B: 2 devs, 6-7 minggu
- Opsi C: 3 devs, 4-5 minggu (recommended)

### Q2: Production/QC/Warehouse modules — sync dengan team lain atau assume done?
- Kalau sync: butuh komunikasi & dependency management
- Kalau assume done: integrasi di akhir, mungkin perlu rework

### Q3: Dashboard scope — confirm semua dashboard FIXED?
- ✅ **CONFIRMED** per directive Direksi: dashboard pages TIDAK diedit (sudah sesuai)
- ✅ **CONFIRMED** exceptions: Finance dashboard keep trend, Bussdev dashboard keep widget, DigMar dashboard keep funnel (tapi DigMar module excluded entirely)
- ✅ **CONFIRMED** module Digital Marketing FULLY EXCLUDED (sedang berjalan/live)

### Q4: e-Faktur DJP — strictly out-of-scope atau eventually?
- Saat ini strictly out (sesuai REQUIREMENT Poin 34)
- Kalau eventually: bisa add sebagai Phase 11 setelah MVP

### Q5: Multi-language (English/Indonesia)?
- Saat ini Indonesia-only
- Kalau i18n nanti: tambah phase 12 dengan i18next setup

### Q6: Mobile native app?
- Saat ini web-responsive only
- Kalau mobile nanti: tambah phase 13 dengan React Native atau PWA

### Q7: Old ERP data migration?
- Saat ini out-of-scope (refactor only)
- Kalau prioritas: tambah phase 14 dengan ETL scripts

### Q8: Feature flag system — pakai library apa?
- Opsi A: LaunchDarkly (hosted, $$$)
- Opsi B: Unleash (self-hosted)
- Opsi C: Custom simple flags di config (recommended untuk MVP)

### Q9: ADR (Architecture Decision Record) tooling?
- Opsi A: Markdown di `/plan/adr/` (simple, recommended)
- Opsi B: Log4j ADRs
- Opsi C: Dedicated tool (Architect, dll)

### Q10: Dashboard "fixed" — kalau Direksi minta perubahan di masa depan?
- Pakai ADR process dulu sebelum edit dashboard
- Update Appendix D kalau ada perubahan
- Selalu preserve existing exceptions (Finance trend, Bussdev widget, DigMar funnel)

---

## 12. 🛡️ HALLUCINATION RULES

> **🔴 WAJIB baca ini sebelum execute task apa-apa.** AI sudah menyebabkan kerusakan di session sebelumnya (kode hancur, hours kerja hilang). Aturan ini dibuat untuk mencegah pengulangan.

### 12.1 Commit Cadence

**WAJIB commit per sub-task (max 100 baris kode per commit).**

| Task Size | Commit Strategy |
|---|---|
| **Tiny** (<50 baris) | 1 commit per logical change |
| **Small** (50-200 baris) | 1 commit per file modification |
| **Medium** (200-500 baris) | Split into 2-3 commits per logical layer |
| **Large** (>500 baris) | **REJECT** — break into smaller tasks |

### 12.2 Verify Protocol

Sebelum setiap commit, AI WAJIB melakukan:

```bash
# 1. Tunjukkan diff stat
git diff --stat

# 2. Tunjukkan actual changes
git diff <file>

# 3. Verify dengan grep / read
grep -n "DnaStatCard" "src/app/(dashboard)/finance/faktur-pembelian/page.tsx"
```

**Checklist sebelum commit:**
- [ ] Diff stat sesuai dengan intent sub-task
- [ ] Tidak ada unintended file changes (`git status` cuma file yang memang diedit)
- [ ] Tidak ada deleted files yang seharusnya masih ada
- [ ] Tidak ada test breakage (run lint/test sebelum commit)
- [ ] Commit message jelas (apa + kenapa, bukan cuma gimana)

### 12.3 Anti-Hallucination Hard Rules

1. **AI output >50 baris tanpa verify = REJECT**
2. **Setiap code edit WAJIB baca file target dulu** (`Read` tool) sebelum edit
3. **Setiap code baru WAJIB grep/diff-check** terhadap file lama yang similar
4. **JANGAN regenerate file yang sudah ada** tanpa sebab yang jelas
5. **JANGAN hapus file lama tanpa `git diff` review** oleh user
6. **JANGAN assume file exist** — selalu verify path dulu
7. **Setiap agent dispatch WAJIB specify scope** (jangan "fix everything" — terlalu vague)

### 12.4 Rollback Procedure

Jika setelah commit ternyata AI hallucination detected:

```bash
# 1. STOP semua kerjaan
git status

# 2. Identify bad commit
git log --oneline -10

# 3. Show what changed
git show <commit-hash> --stat

# 4. Rollback (pilih salah satu)
git revert <commit-hash>          # safe — creates new commit
git reset --hard <previous-commit>  # destructive — only if not pushed

# 5. Verify rollback
git status
npm run lint
```

### 12.5 Session Hygiene

- **Setiap session start**: cek `git status` dan `git log` dulu sebelum lanjut kerjaan
- **Setiap 30 menit**: commit progress, jangan akumulasi
- **Session end**: final commit dengan WIP tag, dokumentasi next steps
- **Jangan trust AI memory**: semua keputusan harus ter-commit di Git

---

## 13. 📋 SHIP_CRITERIA (Definition of Done)

> **🔴 Tanpa SHIP_CRITERIA yang jelas, refactor tidak akan pernah selesai.** Single source of truth untuk "production-ready".

### 13.1 Definition of Done — Single Page

Sebuah halaman operational dianggap **DONE** kalau SEMUA ini terpenuhi:

| Kriteria | Verifikasi |
|---|---|
| ✅ Halaman render tanpa error di console | DevTools console bersih |
| ✅ Visual match golden reference | Playwright visual regression pass (1% tolerance) |
| ✅ Halaman pakai DNA components (bukan hardcoded UI) | `grep -E "from ['\"]@/components/ui/" <page>` = NOL hasil (sesuai [ADR-007](#adr-007-dna-only-ui-imports-single-source-of-ui)); grep tidak ada hardcoded `rounded-lg`, `text-[14px]`, raw `<input>` di JSX. Komponen yang dipakai harus match entry di `DNA_CHEATSHEET.md`. |
| ✅ API endpoint real (bukan mock data) | Network tab menunjukkan request sukses |
| ✅ Loading + empty + error states implemented | Tab ke masing-masing state works |
| ✅ Responsive (desktop + tablet minimum) | DevTools responsive test |
| ✅ Accessibility (keyboard nav, ARIA labels, contrast) | axe-core scan pass |
| ✅ E2E test passing | `tests/e2e/<page>.spec.ts` green |
| ✅ Traceable ke requirement ID | Lihat [Section 15](#15--requirement-traceability) |

### 13.2 Definition of Done — Sprint

Sprint dianggap **DONE** kalau:

| Kriteria | Verifikasi |
|---|---|
| ✅ Semua halaman sprint sudah sesuai [Section 13.1](#131-definition-of-done--single-page) | Per-page checklist |
| ✅ Unit tests coverage ≥70% untuk business logic | `npm run test:coverage` |
| ✅ Integration tests untuk semua API endpoint baru | Test suite green |
| ✅ E2E tests untuk critical user flow | Test suite green |
| ✅ Visual regression tests untuk semua halaman sprint | Playwright baseline committed |
| ✅ Documentation updated (UAT scripts, user guides) | PR merged with docs |
| ✅ No regression di halaman existing | `git diff` + manual smoke test |
| ✅ Build & deploy dry-run success | `npm run build` + `npm run lint` green |

### 13.3 Definition of Done — Module (Finance)

Modul dianggap **PRODUCTION-READY** kalau SEMUA ini terpenuhi:

| Pilar | Kriteria |
|---|---|
| **Backend** | Semua endpoint real, auto-journal posting jalan, business rule di-backend (ADR-005) |
| **Frontend** | Semua operational pages sesuai SHIP_CRITERIA 13.1, dashboard DNA match |
| **Testing** | Unit ≥70%, Integration 100% API, E2E critical paths, Visual regression baseline |
| **UAT** | UAT scripts signed off oleh finance manager |
| **Documentation** | Admin guide, user guides per role, API docs (auto-generated) |
| **Production Readiness** | Atomicity, idempotency, observability, security (lihat [Section 16](#16--production-readiness)) |
| **Backup & Recovery** | Backup tested, restore drill passed |
| **Performance** | Load test passed, response time <2s untuk 95th percentile |
| **Accessibility** | WCAG 2.1 AA compliance |

### 13.4 Definition of Done — Project (Overall)

Project dianggap **DONE** (v2.0 release) kalau SEMUA modul sudah **PRODUCTION-READY** + ada **Go-Live readiness check**:

- [ ] Semua departemen (Finance, SCM, Warehouse, QC, Production, BusDev, R&D, HR, Legality) sudah production-ready
- [ ] Department UAT signed off (bukan cuma Finance)
- [ ] Data migration rehearsal passed
- [ ] Disaster recovery drill passed
- [ ] Security audit passed (OWASP top 10)
- [ ] Performance benchmark passed
- [ ] Monitoring + alerting operational
- [ ] Cutover plan + rollback procedure documented

---

## 14. 🚦 PHASE_GATES (Checkpoint Rules)

> **🔴 Tanpa PHASE_GATES, satu fase gagal bisa cascade 2-3 fase berikutnya tanpa terdeteksi.**

### 14.1 Gate Structure

Setiap phase punya **gate** — checkpoint wajib sebelum lanjut ke phase berikutnya.

```
┌─────────────────────────────────────────────┐
│             PHASE X                          │
│                                              │
│  [Daily commits + verify]                    │
│           ↓                                  │
│  [Phase complete]                            │
│           ↓                                  │
│  ┌──────────────────────────────────┐       │
│  │   GATE: PHASE X COMPLETE          │       │
│  │   - Success criteria met          │       │
│  │   - Tests pass                   │       │
│  │   - User review                  │       │
│  │   - PIVOT decision if needed     │       │
│  └──────────────────────────────────┘       │
│           ↓                                  │
│  [Gate pass → Continue] OR                   │
│  [Gate fail → PIVOT to Plan B]               │
└─────────────────────────────────────────────┘
```

### 14.2 Gate Decision Criteria

Untuk setiap fase, check SEMUA ini sebelum declare "gate pass":

| Check | Question to Ask |
|---|---|
| **Functional** | Apakah SEMUA success criteria fase tercapai? |
| **Quality** | Apakah semua tests passing (unit + integration + E2E + visual)? |
| **Performance** | Apakah response time sesuai target? |
| **Security** | Apakah ada vulnerability baru yang diperkenalkan? |
| **UX** | Apakah user flow masih intuitive? |
| **Data Integrity** | Apakah journal balanced, no orphan records? |
| **Documentation** | Apakah UAT scripts + user guides updated? |

### 14.3 Pivot Rules

Jika gate fail setelah **3 hari retry** (atau sesuai scope fase):

**STOP.** Jangan paksa lanjut. Evaluasikan:

| Failure Type | Pivot Action |
|---|---|
| **Technical blocker** (e.g., Prisma migration gagal) | Re-scope: kurangi scope fase, lanjut dengan mock |
| **AI hallucination** (kode corrupt) | Rollback ke baseline (Section 12.4), restart dengan plan lebih kecil |
| **Spec berubah** (Upii minta tambahan) | Re-sprint: tambah phase baru di backlog, lanjut fase sekarang tanpa tambahan |
| **Dependency missing** (team lain delay) | Switch ke vertical slice lain, revisit dependency phase nanti |
| **Timeline over-run** (>150% fase estimate) | Re-estimate total, communicate ke stakeholder, cut scope non-critical |

**Pivot decision HARUS involve user approval** — AI tidak boleh auto-pivot tanpa konfirmasi.

### 14.4 Gate Reviews (per Phase)

| Phase | Gate Review Trigger |
|---|---|
| Phase 0 (DNA Lock) | Visual reference jalan di dev server, ESLint pass |
| Sprint 0 (Quick Wins) | 0 broken pages, build green |
| Sprint 0.5 (DNA Consolidation) | 0 duplicate components, index.ts clean |
| Sprint 1 (Schema) | `prisma validate` pass, schema tested locally |
| Batch 3A-C | E2E flow passes, UAT script drafted |
| Sprint 9 (DNA Compliance) | 0 violations in VISUAL_DNA_AUDIT.md (operational pages) |
| Phase 10 (Living Docs) | Docs auto-generated, no manual updates needed |

---

## 15. 🔗 REQUIREMENT_TRACEABILITY

> **🔴 Tanpa traceability, setiap refactor adalah tebak-tebakan.** Requirement ID harus link ke: page → field → API → DB → event → test → UAT.

### 15.1 Matrix Structure

```
REQ-ID ─┬─→ role
        ├─→ page (frontend route)
        ├─→ field (UI input/display)
        ├─→ API (backend endpoint)
        ├─→ DB (Prisma model + field)
        ├─→ event (domain event)
        ├─→ permission (RBAC)
        ├─→ test (unit + integration + E2E)
        └─→ UAT (acceptance criteria)
```

### 15.2 Requirement ID Convention

Format: `REQ-<DEPT>-<MODULE>-<NUMBER>`

Contoh:
- `REQ-FIN-AP-001` = Finance > AP > #1 (Faktur Pembelian)
- `REQ-FIN-AR-014` = Finance > AR > #14 (DP Penjualan tabs)
- `REQ-SCM-PO-003` = SCM > PO > #3 (PO Ref filter)

### 15.3 Source-of-Truth Priority

Kalau ada kontradiksi antara requirement docs, gunakan hierarki:

1. **User instruction terbaru** (WAJIB ditaati — paling tinggi prioritas)
2. **`docs/legacy-erp/REQUIREMENT.md`** (78 poin Upii — final signed-off)
3. **`docs/legacy-erp/NEX_FINANCE_FINAL_SPEC.md`** (Finance spec detail)
4. **Department-approved specs** (BusDev, SCM, dll — kalau ada)
5. **`docs/legacy-erp/LEGACY_ERP_SPEC.md`** (URL inventory, secondary evidence)
6. **Existing codebase** (LOWEST priority — bisa salah, jangan dipercaya)

**Contoh resolusi kontradiksi (case dashboard update vs locked):**
- Plan bilang "dashboard BussDev update di Phase X"
- Tapi Section 0.1 bilang "dashboard LOCKED"
- **Source-of-truth priority**: Section 0.1 (locked) > Plan phase (update)
- **Resolution**: Jangan update dashboard BussDev. Kecuali ada ADR baru + user approval

### 15.4 Initial Traceability Matrix (Finance AP Cycle)

Berikut initial matrix — akan di-update per sprint:

| REQ-ID | Page | Field | API | DB Model | Status |
|---|---|---|---|---|---|
| REQ-FIN-AP-001 | `/finance/faktur-pembelian` | Bill Number, Vendor, Date, Due Date, Total | `GET /finance/bills` | `Bill` | ✅ Done (Faktur Pembelian phase) |
| REQ-FIN-AP-002 | `/finance/faktur-pembelian/[id]` | Line Items, Diskon, PPN, Grand Total | `GET /finance/bills/:id` | `Bill + BillLineItem` | ✅ Done |
| REQ-FIN-AP-003 | `/finance/dp-pembelian` | DP Number, Amount, Applied To | `GET /finance/down-payments` | `DownPayment` | ⏳ Pending |
| REQ-FIN-AP-004 | `/finance/bayar-pembelian` | Payment Date, Vendor, Allocations | `POST /finance/ap-payments` | `APPayment + BillAllocation` | ⏳ Pending |
| REQ-FIN-AP-005 | `/finance/ap-aging` | Bucket (H-7/H-3/Overdue) | `GET /finance/ap-aging` | (computed from `Bill.dueDate`) | ⏳ Pending |
| REQ-FIN-AP-006 | `/finance/adjustment-journal` | Reason, Period, Amount | `POST /finance/adjustment-journal` | `JournalEntry` (type=adjustment) | ⏳ Pending |

(Will be expanded ke 78 REQ-ID saat Sprint 2-3)

### 15.5 Traceability Maintenance

Setiap PR yang modify code WAJIB update matrix:

```markdown
| REQ-ID | Page | Field | API | DB Model | Change Log | Test |
|---|---|---|---|---|---|---|
| REQ-FIN-AP-001 | /finance/faktur-pembelian | billNumber | GET /finance/bills | Bill | +add vendor sort | ✅ E2E |
```

---

## 16. 🏭 PRODUCTION_READINESS

> **🔴 Tanpa production readiness checklist, ERP bisa jalan di dev tapi crash di production.** Non-functional requirements yang sering dilupakan.

### 16.1 Atomicity & Transactions

- [ ] **Setiap multi-step operation dalam transaction** (Prisma `$transaction`)
- [ ] **Rollback testing**: simulate failure mid-transaction, verify rollback
- [ ] **Idempotency keys** untuk POST/PUT endpoints (prevent double-submit)
- [ ] **Optimistic locking** untuk concurrent updates (version field)

### 16.2 Concurrent Editing

- [ ] **Pessimistic locking** untuk high-conflict fields (e.g., Bill editing)
- [ ] **Conflict resolution UI** — "X is editing this row" warning
- [ ] **Last-write-wins** vs **merge** strategy documented per entity
- [ ] **Audit trail** untuk setiap concurrent edit (who, when, what)

### 16.3 Audit Trail & Immutability

- [ ] **Every action logged** (who, when, what changed, from-value, to-value)
- [ ] **Append-only log table** — no UPDATE/DELETE on audit logs
- [ ] **Crypto-chained** (optional — for compliance)
- [ ] **Searchable & exportable** (for auditor access)

### 16.4 Upload Security

- [ ] **File type validation** (whitelist: PDF, JPG, PNG, XLSX)
- [ ] **File size limit** (e.g., 10MB max per upload)
- [ ] **Antivirus scan** before save (ClamAV or cloud-based)
- [ ] **Storage path** — not in public dir, signed URLs for access
- [ ] **Attachment lifecycle** — archive after N years, soft delete with retention

### 16.5 OWASP Top 10 Coverage

- [ ] **SQL Injection** — Prisma parameterized queries only
- [ ] **XSS** — escape all user input, CSP headers
- [ ] **CSRF** — double-submit cookies, SameSite=Strict
- [ ] **Auth broken** — proper session management, no JWT in localStorage
- [ ] **Misconfig** — security headers (helmet), no default creds
- [ ] **Sensitive data** — encryption at rest + transit, no PII in logs
- [ ] **XXE** — XML parser hardening
- [ ] **Deserialization** — input validation
- [ ] **Vulnerable components** — `npm audit` CI gate, auto-update deps
- [ ] **Insufficient logging** — security events logged to SIEM

### 16.6 Rate Limiting & Session

- [ ] **Rate limit per IP** (e.g., 100 req/min)
- [ ] **Rate limit per user** (e.g., 1000 req/hour)
- [ ] **Session timeout** (idle: 30 min, absolute: 8 hours)
- [ ] **Concurrent sessions** (max 3 per user)
- [ ] **Force logout** capability

### 16.7 Money & Tax Correctness

- [ ] **Decimal everywhere** — `Decimal` type in Prisma, never Float
- [ ] **Rounding policy** documented (banker's rounding vs round-half-up)
- [ ] **Currency conversion** — explicit rate per transaction date
- [ ] **Tax calculation** — server-side only (ADR-005), test cases per tax rule
- [ ] **PPN/PPh rate** — versioned, can be queried for audit

### 16.8 Timezone

- [ ] **Storage in UTC** — DB always UTC
- [ ] **Display in user TZ** — frontend converts based on user preference
- [ ] **TZ-aware date pickers** — never send naive Date

### 16.9 Performance

- [ ] **Page load <2s** (95th percentile)
- [ ] **API response <500ms** (95th percentile)
- [ ] **DB query <100ms** (95th percentile)
- [ ] **Concurrent users** — load test 100 users
- [ ] **Index strategy** — every foreign key + frequent filter field indexed

### 16.10 Observability & Alerting

- [ ] **Structured logging** (JSON, not plain text)
- [ ] **Log levels** (DEBUG, INFO, WARN, ERROR, FATAL)
- [ ] **Error tracking** (Sentry / similar)
- [ ] **Metrics** (Prometheus / similar — request rate, error rate, latency)
- [ ] **Alerts** (e.g., error rate >5%, latency >2s)
- [ ] **Health check endpoint** (`/health`)
- [ ] **Distributed tracing** (OpenTelemetry)

### 16.11 Backup & Recovery

- [ ] **Daily automated backup** (DB + uploaded files)
- [ ] **Offsite backup** (different region)
- [ ] **Restore drill** quarterly (verify backup actually works)
- [ ] **Point-in-time recovery** (PITR enabled)
- [ ] **Backup encryption** (at rest + transit)

### 16.12 Accessibility (WCAG 2.1 AA)

- [ ] **Keyboard navigation** (all interactive elements accessible via Tab)
- [ ] **ARIA labels** on icon buttons (e.g., "Lihat detail" for Eye icon)
- [ ] **Color contrast** ≥4.5:1 for text, ≥3:1 for UI components
- [ ] **Screen reader tested** (NVDA / VoiceOver)
- [ ] **Skip navigation** link
- [ ] **Focus indicators** visible
- [ ] **Form labels** properly associated

### 16.13 Browser & Responsive Matrix

- [ ] **Desktop**: Chrome, Firefox, Edge, Safari (latest 2 versions)
- [ ] **Tablet**: iPad (Safari), Android tablet (Chrome)
- [ ] **Mobile**: iOS Safari, Android Chrome (graceful degradation)
- [ ] **Min viewport**: 1024x768 (desktop), 768x1024 (tablet portrait)

### 16.14 Cutover & Hypercare

- [ ] **Cutover plan** — step-by-step go-live procedure
- [ ] **Rollback criteria** — when to abort go-live
- [ ] **Hypercare period** — 2 weeks intensive support after go-live
- [ ] **On-call rotation** — dev team availability
- [ ] **Incident runbook** — common issues + fixes
- [ ] **Communication plan** — users notified, status page

---

## 17. ⚖️ KONTRADIKSI_RESOLUTION

> **🔴 Beberapa pernyataan di plan v1 saling bertentangan.** Bagian ini jadi source-of-truth resolusi. Kalau ada kontradiksi baru, tambah entry di sini.

### 17.1 Kontradiksi: Dashboard Locked vs Update

| Pernyataan A | Pernyataan B |
|---|---|
| Section 0.1: "Semua dashboard FIXED" | Plan Phase: "Update BussDev dashboard dengan AR Aging widget" |
| **Source priority** | **Resolution** |
| Section 0.1 (locked scope) > Phase description (specific update) | **Dashboard BussDev/FINANCE/etc TIDAK diupdate** di Phase 3A. Kalau Upii mau widget AR Aging, dia dibuat sebagai **NEW component di BussDev overview page** (operational, BUKAN dashboard). |

### 17.2 Kontradiksi: Matching Engine Tolerance

| Pernyataan A | Pernyataan B |
|---|---|
| Plan 3A: "4-leg matching dengan tolerance per kategori vendor (±5% RM, ±3% Packaging)" | REQUIREMENT Poin 100: "Fitur pencocokan otomatis selisih nominal harus dinonaktifkan (tidak perlu dibangun/diaktifkan)" |
| **Source priority** | **Resolution** |
| REQUIREMENT Poin 100 (final signed-off) > Plan description | **Matching engine BANGUN TAPI auto-match disabled.** UI masih bisa trigger manual match review, tapi tidak auto-approve. Tolerance calculation ada, tapi hasil flagged untuk manual review. |

### 17.3 Kontradiksi: Tax Module vs e-Faktur Skip

| Pernyataan A | Pernyataan B |
|---|---|
| Plan Batch 4A: "Build Tax Setup + Tax Transactions + Client Escrow" | REQUIREMENT Poin 78: "Modul Pajak dan e-Faktur tidak perlu dikerjakan (di-skip dari scope)" |
| **Source priority** | **Resolution** |
| REQUIREMENT Poin 78 (final signed-off) > Plan description | **Tax Setup CRUD = boleh dibangun (untuk track PPN/PPh rate). Tax Transactions = dibangun untuk record. e-Faktur/e-Bupot DJP integration = SKIP. Client Escrow = SEPARATE module, bukan Tax — boleh dibangun karena bukan "Pajak" per REQUIREMENT.** |

### 17.4 Kontradiksi: 10-11 Weeks Timeline

| Pernyataan A | Pernyataan B |
|---|---|
| Plan v1: "10-11 weeks solo" | Honest assessment v2: "14-18 weeks solo" (accounting for AI hallucination risk, production readiness, traceability, UAT feedback) |
| **Source priority** | **Resolution** |
| v2 reality (this section) > v1 estimate | **Use 14-18 weeks as realistic baseline. Communicate to stakeholders — over-promising causes pain.** |

### 17.5 Kontradiksi: Roadmap Finance-only vs Cross-Department

| Pernyataan A | Pernyataan B |
|---|---|
| Plan v1: Goal "Finance module 100% coverage" | Legacy ERP spec: 269 pages across ALL departments (Finance, SCM, BusDev, Warehouse, Production, dll) |
| **Source priority** | **Resolution** |
| Cross-department scope (broader) > Finance-only (narrower) | **Finance = Phase 1 priority. Other departments = Phase 2 (after Finance production-ready). Per-department plan when reaching their phase — DO NOT retrofit Finance-only plan for non-Finance modules.** |

### 17.6 Resolution Process for NEW Kontradiksi

Kalau ada kontradiksi baru:

1. **Stop** — jangan pilih sisi A atau B tanpa konfirmasi
2. **Identify** — kontradiksi apa, di section mana
3. **Apply priority order** (Section 15.3): User terbaru > REQUIREMENT final > Spec detail > Legacy > Existing code
4. **Document** — tambah entry di Section 17
5. **User approve** — kalau priority order tidak cukup jelas, tanya user
6. **ADR** — kalau resolusinya significant, tulis ADR baru

---

## 📎 Appendices

### Appendix A: Related Documents

| Document | Purpose | Scope |
|---|---|---|
| `docs/legacy-erp/NEX_FINANCE_FINAL_SPEC.md` | Single source of truth — 42 finance pages | Backend + Frontend |
| `VISUAL_DNA.md` (root) | Design contract — 5-layer anatomy | **Operational pages ONLY** |
| `old_erp/ACUAN_DASHBOARD/` | Vue + Vite reference — Aureon Matrix style | **Dashboard pages ONLY** |
| `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx` | Implementation reference | **Operational pages ONLY** |
| **`DNA_CHEATSHEET.md` (root)** | **🧬 WAJIB BACA untuk developer + AI sebelum bikin halaman baru.** Berisi 7 Aturan Emas, Kamus Komponen DNA (form/dialog/layout), 2 boilerplate siap-pakai (Master List + Transaksi Master-Detail). Acuan verifikasi ADR-007 (DNA-only UI imports). | **Operational pages ONLY** |
| `frontend/VISUAL_DNA_AUDIT.md` | Live tracking of violations per page | Operational pages |
| `frontend/DNA_COMPLIANCE_CHECKLIST.md` | Per-page DNA status | Operational pages |
| `docs/legacy-erp/LEGACY_ERP_SPEC.md` | Legacy URL inventory (untuk migrasi data) | Backend |
| `docs/legacy-erp/REQUIREMENT.md` | 34 poin Upii (binding behaviour) | All |
| `plan/VISUAL-DNA-AUDIT.md` | DNA audit summary | Operational pages |
| `plan/PRE-DEPLOY-AUDIT-PLAN.md` | Pre-deploy checklist (95KB — comprehensive) | All |

### Appendix D: Dashboard Reference Index (🔒 JANGAN EDIT)

> **DAFTAR LENGKAP dashboard pages yang FIXED dan TIDAK BOLEH diedit.**
> Setiap dashboard sudah sesuai keinginan Direksi. Edit hanya kalau ada instruksi eksplisit.

#### Top-Level Dashboards (di `/dashboard/*`)
| Path | Module | Status | Style Reference |
|---|---|---|---|
| `/dashboard` | Aggregator | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/commercial` | Commercial | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/finance` | Finance | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/fulfillment` | Fulfillment | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/production-floor` | Production | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/production-planning` | Production | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/qc` | QC | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/super-admin` | Super Admin | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard/warehouse` | Warehouse | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |

#### Legacy `/dashboard-*` Routes (URL pattern dari ERP lama)
| Path | Module | Status | Style Reference |
|---|---|---|---|
| `/dashboard-guest-book` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-business-development` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-client-production` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-client-repeat-order` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-client-sample` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-client-lost` | BusDev | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-customer` | Customer | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-digital-marketing` | Marketing | 🚫 **EXCLUDED** | — |
| `/dashboard-executive` | Executive | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-human-resources` | HR | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-legality` | Legality | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-notification` | Notification | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-production` | Production | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-production-realization` | Production | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-production-schedule` | Production | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-purchasing` | Purchasing | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-rnd` | R&D | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-sales-product` | Sales | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-sales-sample` | Sales | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-sample` | Sample | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |
| `/dashboard-warehouse` | Warehouse | 🔒 Fixed | old_erp/ACUAN_DASHBOARD |

#### Module-Specific Dashboards (di `/<module>/dashboard/*`)
| Path | Module | Status | Special Widget |
|---|---|---|---|
| `/finance/dashboard` | Finance | 🔒 Fixed | **Trend** (chart tren di bawah cards) |
| `/bussdev/dashboard` | Bussdev | 🔒 Fixed | Sama dengan existing (sudah match reference) |
| `/marketing/dashboard` | Marketing | 🚫 **EXCLUDED** | — (module excluded) |
| `/rnd/dashboard` | R&D | 🔒 Fixed | — |
| `/hr/dashboard` | HR | 🔒 Fixed | — |
| `/legality/dashboard` | Legality | 🔒 Fixed | — |
| `/executive/dashboard` | Executive | 🔒 Fixed | — |
| `/qc/dashboard` | QC | 🔒 Fixed | — |
| `/scm/dashboard` | SCM | 🔒 Fixed | — |

#### Special Dashboard — Digital Marketing Funnel
| Path | Module | Status | Special Widget |
|---|---|---|---|
| `/dashboard-digital-marketing` | Marketing | 🚫 **EXCLUDED** | **Funnel per Channel** (di bawah layout standar) — module excluded, jangan edit |
| `/marketing/dashboard` | Marketing | 🚫 **EXCLUDED** | (Module excluded) |

#### Dashboard Reference (sumber style)
```
old_erp/ACUAN_DASHBOARD/
├── main.js              ← Vue entry point
├── src/                 ← Component sources
│   ├── components/      ← Reusable dashboard components
│   ├── views/           ← Page implementations
│   └── ...
├── style.css            ← Global styles (Aureon Matrix)
├── VISUAL_DNA.md        ← Dashboard DNA contract (CSS vars, 24px radius, Inter font)
└── package.json         ← Vue + Vite dependencies
```

**Style karakteristik Dashboard DNA (Aureon Matrix):**
- Border radius: `24px` (macro cards), bukan `rounded-xl`
- Font: Inter (explicit)
- Colors: CSS variables (`var(--app-bg)`, `var(--border-color)`, `var(--status-action)`)
- Numeric standard: `tabular-nums` everywhere
- Hover effects: `translateY(-4px)` + elevated shadow
- Type hierarchy: 32px Primary Value, 10px Section Label uppercase

### Appendix E: Module-Level Scope Matrix

| Module | Pages in Scope | Pages EXCLUDED |
|---|---|---|
| **Finance** | All operational pages (49) | `/finance/dashboard` 🔒 |
| **SCM** | All operational pages (26) | `/scm/dashboard` 🔒 |
| **Warehouse** | All operational pages (17) | `/warehouse/dashboard` 🔒 |
| **Bussdev** | All operational pages (21) | `/bussdev/dashboard` 🔒 |
| **R&D** | All operational pages (17) | `/rnd/dashboard` 🔒 |
| **HR** | All operational pages (7) | `/hr/dashboard` 🔒 |
| **Legality** | All operational pages (9) | `/legality/dashboard` 🔒 |
| **Executive** | All operational pages (8) | `/executive/dashboard` 🔒 |
| **QC** | All operational pages (10) | `/qc/dashboard` 🔒 |
| **Master** | All operational pages (8) | — |
| **System** | All operational pages (6) | — |
| **Marketing** | — | **🚫 ALL EXCLUDED** |
| **Project Control** | All pages (4) ✅ INCLUDE | — |
| **KPI Management** | All pages (8) ✅ INCLUDE | — |
| **Document Center** | All pages (4) ✅ INCLUDE | — |
| **Logistics** | All pages (4) ✅ INCLUDE | — |
| **Approvals** | All pages (4) ✅ INCLUDE | — |
| **DNA-Visual** | — | Reference only (jangan edit) |

### Appendix B: File Touch List per Phase

#### Phase 0 file list
```
MODIFY: frontend/tailwind.config.ts
MODIFY: frontend/.eslintrc.json (or eslint.config.mjs)
MODIFY: frontend/playwright.config.ts
CREATE: frontend/tests/visual-regression/*.png
CREATE: .husky/pre-commit
MODIFY: frontend/src/components/dna/*.tsx (JSDoc)
RENAME: old_erp/ACUAN_DASHBOARD/VISUAL_DNA.md → VISUAL_DNA_LEGACY_DO_NOT_USE.md
```

#### Sprint 0 file list
```
MODIFY: frontend/src/app/(dashboard)/bussdev/lost/page.tsx
MODIFY: frontend/src/app/(dashboard)/finance/reports/page.tsx
MODIFY: frontend/src/app/(dashboard)/finance/reports/balance-sheet/page.tsx
MODIFY: frontend/src/app/(dashboard)/finance/reports/trial-balance/page.tsx
MODIFY: frontend/src/app/(dashboard)/legality/inbox/page.tsx
MODIFY: frontend/src/app/(dashboard)/creative/board/page.tsx
DELETE: frontend/src/components/dna/DashboardMetric.tsx
DELETE: backend/src/modules/bussdev.service.ts.tmp
DELETE: frontend/src/app/(dashboard)/produksi/
DELETE: frontend/src/app/(dashboard)/bussdev/pipeline-v2/
DELETE: frontend/src/app/(dashboard)/rnd/formulasi/
DELETE: frontend/src/app/(dashboard)/rnd/kelola-formulasi/
```

#### Sprint 0.5 file list
```
MODIFY: frontend/src/components/dna/StatCard.tsx (consolidated)
MODIFY: frontend/src/components/dna/KpiCard.tsx (merged into StatCard)
MODIFY: frontend/src/components/dna/DashboardCard.tsx (merged into StatCard)
DELETE: frontend/src/components/dna/DashboardMetric.tsx (already in Sprint 0)
DELETE: frontend/src/components/dna/DnaKpiGrid.tsx (keep layout/ version)
DELETE: frontend/src/components/dna/DnaPagination.tsx (keep table/ version)
DELETE: frontend/src/components/dna/DnaLegacyCompat.tsx (or slim)
DEPRECATE: frontend/src/components/dna/DnaDataTable.tsx
DEPRECATE: frontend/src/components/dna/DnaBadge.tsx
MODIFY: 15 pages using DnaDataTable → migrate to compositional pattern
```

#### Sprint 1 file list
```
MODIFY: backend/prisma/schema/finance.prisma
CREATE: 24 new models in schema
CREATE: backend/prisma/migrations/<timestamp>_add_finance_foundation/migration.sql
MODIFY: backend/prisma/seed.ts
CREATE: backend/src/modules/finance/<24 new services>/*.service.ts (stubs)
CREATE: backend/src/modules/finance/<24 new services>/*.controller.ts (stubs)
```

### Appendix C: Quick Decision Matrix

| Situation | Action |
|---|---|
| Tambah kolom baru di existing page | Edit column config (1 file, ≤10 baris) |
| Tambah field baru di existing form | Edit Zod schema (1 file, 1 entry) |
| Tambah halaman baru | Add config + 1 page.tsx pakai template (≤50 baris) |
| Tambah DNA component baru | Add di `@/components/dna/`, JSDoc auto-generate catalog |
| Ubah warna primary | Edit 1 token di `tailwind.config.ts` |
| Ubah struktur halaman | Update `VISUAL_DNA.md` + golden-reference (locked pair) |
| Tambah business rule | Backend endpoint only (no frontend hardcode) |

---

**Generated:** 7 September 2026
**Next Review:** Setelah Phase 0 selesai
**Maintained by:** Muhammad Luthfi + Claude
