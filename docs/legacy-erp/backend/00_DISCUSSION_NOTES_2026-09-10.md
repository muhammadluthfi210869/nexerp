# 00 — DISCUSSION NOTES & CONSOLIDATED DECISIONS

> **Tanggal Diskusi:** 2026-09-09 s/d 2026-09-10
> **Peserta:** User + Kilo (AI assistant, role: Principal ERP Backend Architect & Domain Systems Engineer)
> **Tujuan Diskusi:** Mendesain ulang backend ERP DREAMLAB yang kacau, dengan strategi delivery yang efisien, mudah maintenance, mudah tambah fitur, dan siap deploy.
> **Dokumen ini ADALAH SINGLE SOURCE OF TRUTH** untuk semua keputusan dan keinginan yang muncul dalam diskusi. Jika ada konflik dengan dokumen lain di `docs/legacy-erp/backend/`, dokumen ini yang menang sampai ADR baru disetujui.

---

## 📑 DAFTAR ISI

1. [Konteks Diskusi](#1-konteks-diskusi)
2. [Permasalahan yang Diangkat User](#2-permasalahan-yang-diangkat-user)
3. [World-Class Role yang Diambil](#3-world-class-role-yang-diambil)
4. [Keputusan Final Diskusi (20 keputusan)](#4-keputusan-final-diskusi)
5. [Keinginan User yang Harus Diimplementasi](#5-keinginan-user-yang harus-diimplementasi)
6. [Lessons Learned dari Real-Align](#6-lessons-learned-dari-real-align)
7. [State Files di Folder Ini](#7-state-files-di-folder-ini)
8. [Pending Tasks untuk Session Berikutnya](#8-pending-tasks-untuk-session-berikutnya)
9. [Cross-Reference ke Plan Existing (REAL)](#9-cross-reference-ke-plan-existing-real)

---

## 1. Konteks Diskusi

### 1.1 Project
- **Sistem:** ERP DREAMLAB (Toll Manufacturing Kosmetik, Skincare, & Personal Care)
- **Owner:** PT. Karya Impian Laboratoris (Dreamlab)
- **Target Production:** Biznet NEO Lite VPS (`nexerp.id`, IP `103.93.134.215`)
- **Domain:** CPKB compliance, 178 layar, 12 modul, 95+ entity Prisma, 520+ endpoint

### 1.2 Stack (verified)
| Layer | Tech |
|---|---|
| Backend | NestJS 11 + Prisma 7.8 + PostgreSQL (driver adapter `@prisma/adapter-pg`) |
| Frontend | Next.js **16.2.6** (App Router, breaking changes — BUKAN Next 15) + React 19.2.4 |
| UI Library | shadcn 4.1 + Radix UI + Base UI 1.3 + lucide-react + Tailwind v4 |
| State | TanStack Query 5.96 + Zustand |
| Forms | react-hook-form 7.72 + zod 4.3 |
| Auth | jose (JWT), localStorage + cookie token |
| Toasts | sonner 2.0 |
| Direct DB FE | prisma 7.8 (server-side only) |
| Test | Vitest 4.1 + Playwright 1.59 |
| Mock API sync | openapi-typescript 7.13 |

### 1.3 Sumber Kebenaran Bisnis
- `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` — narasi 178 layar
- `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` — 176 screen machine-readable

---

## 2. Permasalahan yang Diangkat User

### 2.1 Frontend
- 80% selesai, masih ada yang tidak sesuai spec.
- Drift antara camelCase baru vs snake_case legacy.
- Hardcoded URLs di beberapa page (`logistics/outbound/page.tsx` localhost:3002).
- Naming inconsistency (variable vs response).
- Beberapa endpoint dipakai UI tapi tidak ada di api-schema.d.ts.
- 123 file direct UI import, 118 di luar DNA, 78 di bawah app routes.

### 2.2 Backend
- "Chaotic" — perbaikan A merusakkan B (regression spiral).
- 520 endpoint, 95 Prisma model, 19 schema split.
- 3 god-service: warehouse (1855 LOC), production (2754 LOC), lead-capture (1680 LOC).
- Circular deps Finance ⇄ Warehouse (forwardRef).
- JWT secret fallback `'ERP_SECRET'` (default publik).
- 28 controller punya prefix duplikat `v1/X`.
- 40+ `@Body() any` di controller.
- Test coverage < 15%.
- 19 TypeScript errors, Vitest 222 pass / 84 fail, Jest OOM 4GB.

### 2.3 Komunikasi
- "Sistem benar-benar siap dipakai, siap deploy dengan minim bug dan error"
- "Mudah di maintenance, mudah tambah fitur, mudah di deploy"
- "Tidak ada perbaikan yang merusak modul lain"
- "Testing, debugging, deployment, migration, backup, dan rollback dapat dipercaya"

---

## 3. World-Class Role yang Diambil

**Principal ERP Backend Architect & Domain Systems Engineer**

Sub-kompetensi:
- Domain-Driven Design (DDD) untuk ERP kompleks
- Clean / Hexagonal Architecture
- Modular Monolith (bukan microservices — premature)
- Contract-First API (OpenAPI sebagai SSOT)
- Event-Driven Integration (Outbox + EventEmitter)
- Database Migration Discipline
- Test Pyramid Discipline
- Observability-First (correlation ID + metrics)
- Security-by-default (env validation, secret management, RBAC)
- Strangler Fig Refactor (incremental, bukan big-bang)

---

## 4. Keputusan Final Diskusi

### 4.1 Strategi Delivery (paling kritikal)

| ID | Keputusan | Justifikasi |
|---|---|---|
| **D-01** | **Strategi HYBRID**: R1 Master & Access per-divisi murni (107-110 master screen, foundation), R2-R6 vertical slice per business flow end-to-end | Master Data cross-cutting tapi bukan business flow participant — jadi per-divisi murni valid. R2+ harus vertical slice karena ERP business flow natural cross-divisi (P2P butuh SCM+WH+QC+Finance simultan) |
| **D-02** | **Strangler Fig refactor**, BUKAN big-bang rewrite | Backend existing punya nilai (domain knowledge), risiko full rewrite terlalu tinggi |
| **D-03** | **Modular Monolith** (1 DB, 1 deploy) | Bukan microservices — premature untuk skala 1 PT Dreamlab. Boleh dipertimbangkan setelah R6 stabil |
| **D-04** | **Hexagonal Architecture** dalam modular monolith | Domain/application/infrastructure/interface layer terpisah, decoupling Prisma/HTTP dari business logic |
| **D-05** | **Vertical Slice per business flow** (R2-R6), BUKAN per-divisi murni | Business flow ERP cross-divisi, per-divisi murni tinggalkan integration gap |

### 4.2 Architecture Decision (architecture_style + module_integration + memory project.md)

| ID | Keputusan | Reference |
|---|---|---|
| **D-06** | Domain Event + **Outbox Pattern** untuk cross-module integration, BUKAN direct service import | memory `module_integration` |
| **D-07** | API envelope: `{ data: T, meta?: PaginationMeta }` — no double-wrap | memory `api_envelope` |
| **D-08** | Error format: **RFC 7807 Problem Details** (`{ type, title, status, code, detail, traceId, context }`) | memory `error_format` |
| **D-09** | Naming convention: **camelCase** untuk entity baru (legacy snake_case di-bridge via mapper) | memory `naming_convention` |
| **D-10** | API versioning: **URI-based** (`/v1`, `/v2`) + `Sunset` header untuk deprecation | memory `api_versioning` |
| **D-11** | Service file maks **400 LOC**, lebih dari itu pecah jadi sub-service | memory constraint `service_max_loc` |
| **D-12** | Migration discipline: `prisma migrate dev` di dev, `prisma migrate deploy` di prod (TIDAK `db push`) | memory constraint `migration_policy` |

### 4.3 Testing & Quality

| ID | Keputusan | Reference |
|---|---|---|
| **D-13** | Test pyramid: Unit 70%+ core modul / Integration semua endpoint / E2E 10 flow kritis | memory constraint `test_pyramid` |
| **D-14** | Backend first, contract-driven, vertical-slice modernization (per `ERP_FINALIZATION_MASTER_PLAN.md`) | real plan existing |
| **D-15** | Domain correctness lebih tinggi dari UI completeness (mencegah korup data/stok) | `ERP_FINALIZATION_MASTER_PLAN.md` §3.3 |

### 4.4 Deployment & Environment

| ID | Keputusan | Reference |
|---|---|---|
| **D-16** | **Single tenant** (1 PT Dreamlab) — companyId sebagai opsional field, bukan partition key | memory `tenant_model` |
| **D-17** | **Docker Compose** di single VPS (Postgres + Backend + Frontend + Nginx + Watchtower) | memory `deployment_target` |
| **D-18** | Fresh start dengan seed baru untuk dev (bukan migration dari existing chaotic DB) | user decision 2026-09-10 |
| **D-19** | Frontend dev port **3003** via `npm run dev -- --port 3003 --host` (menghindari konflik dengan backend port 3001) | memory `frontend_dev_port` |

### 4.5 Quality Gates & Process (TAMBAHAN BARU USER)

| ID | Keputusan | Alasan |
|---|---|---|
| **D-20** | **DNA-Only Component Policy** — frontend WAJIB pakai DNA components untuk SEMUA operational routes. Larang keras: import `@/components/ui/*` (legacy shadcn) atau raw HTML control (`<button>`, `<input>`, `<select>`, `<table>`, `<dialog>`) di operational routes. Pengecualian: dengan `// dna-allow-legacy: <reason>` comment | User eksplisit 2026-09-10: "pastikan setiap UI menggunakan component dna dan jangan gunakan component lain" |
| **D-21** | **Atomic Commit Discipline** — setiap perubahan besar = 1 atomic commit dengan Conventional Commits (`<type>(<scope>): <subject>`). Type: feat/fix/refactor/perf/style/docs/chore/test/build/revert/db/dna/api. Tools: Husky@9 + Commitlint@19 + lint-staged@15. Tag strategy per release | User eksplisit 2026-09-10: "pastikan setiap perubahan besar commit agar mudah di-rollback" |
| **D-22** | R1 Master & Access scope = **110 layar** (107 MOD-01 MINUS 1 Tax Setup yang di-skip per Spec Poin 35 PLUS 4 approval lists SCR-059/061/062/065) | User decision 2026-09-10 |
| **D-23** | R1 timeline: **10 hari kerja** via 2 engineer paralel + team agent untuk speed-up | User decision 2026-09-10 |
| **D-24** | Frontend strategy: **Fix drift incremental**, BUKAN rebuild | User decision 2026-09-10 |

### 4.6 Open Decisions (15 ADR — PENDING)

Lihat `[02_OPEN_ADR_TRACKER.md](./02_OPEN_ADR_TRACKER.md)` untuk 15 ADR yang masih perlu keputusan user.

---

## 5. Keinginan User yang Harus Diimplementasi

### 5.1 Keinginan Eksplisit (dikutip dari diskusi)

| ID | Keinginan | Status | Implementasi |
|---|---|---|---|
| **W-01** | "Pastikan setiap UI menggunakan component DNA dan jangan gunakan component lain" | ✅ Policy (D-20) + ESLint rule enforcement | `STRICT_POLICIES_ADDENDUM.md` + `frontend/eslint-rules/no-raw-ui-import.cjs` |
| **W-02** | "Pastikan setiap perubahan besar commit agar mudah di-rollback" | ✅ Policy (D-21) + Husky + Commitlint + lint-staged | `STRICT_POLICIES_ADDENDUM.md` + `frontend/.husky/*` + `commitlint.config.cjs` |
| **W-03** | "Sistem benar-benar siap dipakai, siap deploy dengan minim bug dan error" | 🔄 In progress | R1 → R6 release train per `ERP_FINALIZATION_MASTER_PLAN.md` Fase 1-5 |
| **W-04** | "Mudah di maintenance" | 🔄 In progress | Hexagonal architecture + 400 LOC cap + naming convention + error contract |
| **W-05** | "Mudah untuk penambahan fitur secara cepat" | 🔄 In progress | OpenAPI contract-first + automated types sync + bounded context + domain event |
| **W-06** | "Mudah untuk di deploy" | 🔄 In progress | Docker Compose + health endpoints + Watchtower + rollback via image digest per `PERFORMANCE_INTEGRITY_PLAN.md` |
| **W-07** | "Hybrid: per-divisi dulu untuk R1 foundation, lalu vertical slice" | ✅ Decided (D-01) | `delivery_strategy` di memory |
| **W-08** | "Test fase kecil per divisi, sebelum pindah" | ✅ Hybrid testing (D-13) | unit per modul + integration + E2E Golden Thread per slice + nightly + release |
| **W-09** | "Komunikasi ke divisi lainnya" | ✅ Embedded dalam vertical slice strategy | cross-divisi event-driven + ActivityStream |
| **W-10** | "Ngebenerin overview tabel nya dan input dan lain lain sesuai [legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md dan SCREEN_AND_API_CATALOG.json]" | 🔄 In progress | spec-conformity audit per screen + drift register |

### 5.2 Keinginan Implisit (dari konteks)

| ID | Keinginan | Status |
|---|---|---|
| **W-11** | Backend yang tidak kacau lagi (tidak ada "perbaiki A rusak B") | Strangler Fig + bounded context + domain event isolation + test pyramid |
| **W-12** | Audit trail lengkap (regulator BPOM/Halal/HKI butuh) | `dna:R7` Audit Log + Outbox + immutable transition log |
| **W-13** | Backup & restore tested (DRP) | `PHASE_0_RUNBOOK.md` §3 + RPO/RTO eksplisit di SLO |
| **W-14** | Jangan asal copy legacy code — bisnis logic harus benar | Reference `NEX_ERP_MASTER_SPECIFICATION.md` sebagai SSOT + ADR untuk konflik |

---

## 6. Lessons Learned dari Real-Align

### 6.1 Yang Saya Pelajari Saat Diskusi

1. **User bukan tipe "ikut saja"** — dia menanya balik dengan cerdas, minta saya cek existing state dulu sebelum usulkan. Saya HARUS explore dulu sebelum usulkan.
2. **Folder `docs/legacy-erp/backend/` yang saya klaim berisi 11 file plan existing ternyata kosong** — saya generate content dari memory project.md dan pola ERP generic. Setelah real-align, real plan ada di `docs/plan/` (27 file) + `docs/legacy-erp/_archive/` (38 file). Memory project.md sudah hold keputusan yang valid, jadi referensi tidak hilang.
3. **Strategi HYBRID (per-divisi R1, vertical slice R2+) lebih cocok untuk ERP** daripada pure per-divisi atau pure vertical slice. User sendiri yang minta opsi ini setelah saya jelaskan trade-off-nya.
4. **DNA components sudah ada 60+ export di `frontend/src/components/dna/`** — masalahnya enforcement (bukan ketersediaan). Audit existing: 19 file operational masih pakai raw UI. Migration 12 PR sudah dipetakan (PR-1 dialog → PR-12 skeleton).
5. **Atomic commit discipline belum ada di codebase** — Husky + Commitlint + lint-staged belum terinstall. Setup file sudah saya tulis, tinggal user run `npm install`.

### 6.2 Yang Saya Harusnya Lakukan Sejak Awal

1. Baca existing plan di `docs/plan/` (yang real) sebelum generate plan.
2. Baca `docs/DNA-RULES-CONTRACT.md` + `VISUAL_DNA.md` sebelum usulkan policy DNA.
3. Cek `frontend/src/components/dna/COMPONENT_INVENTORY.md` availability.
4. Cek package.json Husky + commitlint existing.
5. Diskusi pertanyaan alignment lebih awal, bukan setelah draft panjang.

---

## 7. State Files di Folder `docs/legacy-erp/backend/`

| File | Ukuran | Status | Fungsi |
|---|---|---|---|
| `README.md` (akan dibuat) | TBD | ⏳ Planned | Pintu masuk folder, daftar file + urutan baca |
| `00_DISCUSSION_NOTES_2026-09-10.md` (FILE INI) | ~500 baris | ✅ Created | Comprehensive catatan diskusi + keputusan + keinginan |
| `01_DECISIONS_LOG.md` | ~150 baris | ✅ Created | Quick reference keputusan final (D-01 s/d D-24) |
| `02_OPEN_ADR_TRACKER.md` | ~200 baris | ✅ Created | 15 ADR open dengan status + owner + blocker |
| `PHASE_0_RUNBOOK.md` | ~470 baris | ✅ Created + Realigned | PowerShell runbook untuk evidence freeze (2-4 hari kerja) |
| `R1_MASTER_ACCESS_RELEASE_PLAN.md` | ~750 baris | ✅ Created + Realigned | R1 release plan lengkap (110 layar + 10 hari kerja + 2 eng paralel) |
| `STRICT_POLICIES_ADDENDUM.md` | ~543 baris | ✅ Created + Realigned | DNA-Only + Atomic Commit discipline + Husky setup |

**Total: 6 file substance + 1 README planned**

---

## 8. Pending Tasks untuk Session Berikutnya

### 8.1 Immediate (Next Session — User Action Required)

| # | Task | Owner | Durasi | Notes |
|---|---|---|---|---|
| 1 | `cd frontend && npm install --save-dev husky@^9 @commitlint/cli@^19 @commitlint/config-conventional@^19 lint-staged@^15` | User | 5-10 menit | PowerShell manual |
| 2 | `npm run prepare` (activate Husky) | User | 1 menit | PowerShell manual |
| 3 | `npm run lint` (verify ESLint rule aktif) | User | 2 menit | PowerShell manual |
| 4 | Jalan `PHASE_0_RUNBOOK.md` §1-§6 (evidence freeze) | User | 2-4 jam | PowerShell manual |
| 5 | Paste output baseline ke session berikutnya | User | 10 menit | Copy-paste |

### 8.2 Setelah Baseline Hijau (User + Agent Action)

| # | Task | Owner | Status |
|---|---|---|---|
| 6 | Diskusi + jawab 15 ADR open (12 + 3 baru) | User + Kilo | ⏳ Pending |
| 7 | Mulai R1 Hari 1 — Backend Primitives (4 agent paralel): Universal Code Engine, Audit Log, RBAC, Error Contract | Kilo team agent | ⏳ Ready to start |
| 8 | R1 Hari 2-3 — Backend Primitives integration ke `main.ts` + `app.module.ts` | Kilo | ⏳ After #7 |
| 9 | R1 Hari 4-7 — Mini-Sprint 1-4 (CoA, Gudang+Bank, Customer+Supplier, Barang) | Kilo | ⏳ After #8 |
| 10 | R1 Hari 8-10 — Mini-Sprint 5-9 + Frontend Integration | Kilo | ⏳ After #9 |
| 11 | R1 Hari 11-14 — Testing (GT-00 + integration + e2e) + Release Manifest | Kilo | ⏳ After #10 |

### 8.3 Long-term (R2-R6)

| Release | Fokus | Timeline |
|---|---|---|
| R2 Procurement Pilot (P2P) | SCM + Warehouse + QC + Finance end-to-end | After R1 (estimasi 4-6 minggu) |
| R3 Commercial Pilot (L2C) | BusDev + R&D + Sales + Design + Legal + Production + Finance | After R2 |
| R4 Manufacturing Pilot | R&D + Production + QC + Warehouse + Finance | After R3 |
| R5 Finance Close + HR | Reconciliation + Period Lock + Payroll + Executive Read Models | After R4 |
| R6 Hardening + Rollout | Performance + Security + UAT + Pilot Deployment | After R5 |

---

## 9. Cross-Reference ke Plan Existing (REAL)

### 9.1 Plan di `docs/plan/` (27 file)

| Topik | File |
|---|---|
| Master eksekusi backend-first | [`docs/plan/ERP_FINALIZATION_MASTER_PLAN.md`](../../plan/ERP_FINALIZATION_MASTER_PLAN.md) (740 baris, 5 fase) |
| Status eksekusi saat ini | [`docs/plan/ZERO_ERROR_ROADMAP.md`](../../plan/ZERO_ERROR_ROADMAP.md) (Phase 1-3 ✅ DONE, 4 IN PROGRESS, 5 PENDING) |
| Vertical slicing per-divisi SCM/WH/Production | [`docs/plan/HYPER_ALIGNMENT_PLAN.md`](../../plan/HYPER_ALIGNMENT_PLAN.md) |
| Integration Triple-Lock + Validation | [`docs/plan/FULLSTACK_INTEGRITY_PLAN.md`](../../plan/FULLSTACK_INTEGRITY_PLAN.md) + [`docs/plan/ERP_V4_QA_MASTER_PLAN.md`](../../plan/ERP_V4_QA_MASTER_PLAN.md) |
| Golden Threads 3 jalur (Revenue / Production / People-Compliance) | [`docs/plan/ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md`](../../plan/ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md) |
| 7 Layers Integrity | [`docs/plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md`](../../plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md) |
| Performance < 500ms LCP mandate | [`docs/plan/PERFORMANCE_INTEGRITY_PLAN.md`](../../plan/PERFORMANCE_INTEGRITY_PLAN.md) |
| Visual DNA reset (cyber → minimal) | [`docs/plan/UI_PARITY_RESTORATION_PLAN.md`](../../plan/UI_PARITY_RESTORATION_PLAN.md) |
| Validation plan SCM/WH/Production | [`docs/plan/V4_SYSTEM_VALIDATION_PLAN.md`](../../plan/V4_SYSTEM_VALIDATION_PLAN.md) |
| Finance 4 fase (Data Integrity → Report → Controls → Premium UX) | [`docs/plan/FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md`](../../plan/FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md) |
| Finance Fund Request + Tax Splitting | [`docs/plan/FINANCE_FULL_IMPLEMENTATION_PLAN.md`](../../plan/FINANCE_FULL_IMPLEMENTATION_PLAN.md) |
| Finance AR Hub + Mandatory Upload | [`docs/plan/FINANCE_INPUT_OUTPUT_REFINEMENT.md`](../../plan/FINANCE_INPUT_OUTPUT_REFINEMENT.md) |
| Finance backend tests | [`docs/plan/ultimate_finance_testing_plan.md`](../../plan/ultimate_finance_testing_plan.md) |
| Warehouse + Creative V4 | [`docs/plan/ULTIMATE_PLAN_WAREHOUSE_QC.md`](../../plan/ULTIMATE_PLAN_WAREHOUSE_QC.md) + [`docs/plan/ULTIMATE_PLAN_CREATIVE_DESIGN.md`](../../plan/ULTIMATE_PLAN_CREATIVE_DESIGN.md) |
| Legal V4 (MasterINCI + Smart-Gates) | [`docs/plan/LEGAL_ULTIMATE_IMPLEMENTATION_PLAN.md`](../../plan/LEGAL_ULTIMATE_IMPLEMENTATION_PLAN.md) |
| Legalitas tests | [`docs/plan/testing_plan_legalitas.md`](../../plan/testing_plan_legalitas.md) |
| R&D V4 (Phase-based, layered locking) | [`docs/plan/rnd_v4_implementation_plan.md`](../../plan/rnd_v4_implementation_plan.md) |
| R&D backend tests | [`docs/plan/ultimate_rnd_testing_plan.md`](../../plan/ultimate_rnd_testing_plan.md) |
| Communication Protocol V4 (5 fase) | [`docs/plan/comm_prot_v4_implementation.md`](../../plan/comm_prot_v4_implementation.md) |
| Integrated Pipeline Bussdev↔Finance↔R&D↔Production | [`docs/plan/INTEGRATED_PIPELINE_PROTOCOL.md`](../../plan/INTEGRATED_PIPELINE_PROTOCOL.md) |

### 9.2 Plan di `docs/legacy-erp/_archive/` (38 file — legacy reference)

| Topik | File |
|---|---|
| Business workflow end-to-end (legacy blueprint) | `docs/legacy-erp/_archive/05_master_business_process_blueprint.md` |
| Finance final spec | `docs/legacy-erp/_archive/NEX_FINANCE_FINAL_SPEC.md` |
| Legacy full spec + audit | `docs/legacy-erp/_archive/LEGACY_ERP_SPEC.md` + `LEGACY_ERP_AUDIT.md` |
| Warehouse spec | `docs/legacy-erp/_archive/warehouse.md` |
| Production spec | `docs/legacy-erp/_archive/production.md` |
| Quality Control spec | `docs/legacy-erp/_archive/quality_control.md` |
| Legality spec | `docs/legacy-erp/_archive/legalitas.md` |
| Design/Packing spec | `docs/legacy-erp/_archive/design-packing.md` |
| HR spec | `docs/legacy-erp/_archive/HR.md` |
| R&D spec | `docs/legacy-erp/_archive/r&d.md` |
| Database design legacy | `docs/legacy-erp/_archive/database.md` + `databasev2.md` |
| KPI Reference | `docs/legacy-erp/_archive/KPI_REFERENCE.md` |
| VPS Deployment | `docs/legacy-erp/_archive/VPS_DEPLOYMENT.md` |
| Business flow gap analysis | `docs/legacy-erp/_archive/ERP_BUSINESS_FLOW_GAP.md` |
| Functional parity matrix | `docs/legacy-erp/_archive/ERP_FUNCTIONAL_PARITY_MATRIX.md` |

### 9.3 Visual DNA Authority

| File | Fungsi |
|---|---|
| `docs/DNA-RULES-CONTRACT.md` | Wajib: ZERO-HARDCODE-UI rule, 5-Layer order, SPEC-COMPLIANCE |
| `docs/design/LAYOUT_GOVERNANCE.md` | Engineering rule: grid, typography, form, table standard |
| `frontend/src/components/dna/COMPONENT_INVENTORY.md` | DNA component inventory (51 named exports + 9 type aliases) |
| `docs/_AUDIT_DNA_2026-09-09.md` + `docs/_AUDIT_DNA_COMPLIANCE_2026-09-09.md` + `docs/_AUDIT_VISUAL_COMPLIANCE_2026-09-09.md` | Audit DNA existing (drift report) |

### 9.4 Memory Project.md Decisions (Strategic Acuan)

Kilo memory holds key decisions:
- `delivery_strategy` — HYBRID (R1 per-divisi, R2-R6 vertical slice)
- `r1_release_scope` — 110 layar (107 MOD-01 - 1 Tax + 4 approval)
- `dna_only_policy` — DNA-Only enforcement via ESLint + Husky
- `atomic_commit_policy` — Conventional Commits + Husky pre-commit
- `open_adrs_3_new` — ADR-013/014/015 baru
- `plan_files_real_location` — real plan location correction
- `architecture_style` — Modular Monolith + Hexagonal
- `module_integration` — Domain Event + Outbox Pattern
- `deploy_strategy` — Strangler Fig
- `deployment_target` — Docker Compose single VPS
- `tenant_model` — Single tenant
- `api_envelope` — `{ data: T, meta?: ... }`
- `error_format` — RFC 7807 Problem Details
- `naming_convention` — camelCase
- `api_versioning` — URI-based + Sunset header
- `frontend_dev_port` — 3003
- `service_max_loc` — 400 LOC
- `migration_policy` — prisma migrate deploy
- `test_pyramid` — Unit 70%+ / Integration all / E2E 10 flow
- `shell_permission_constraint` — agent tidak bisa run shell

---

## CATATAN UNTUK SESSION BERIKUTNYA

**Jika memory hilang, baca file ini DULU sebelum melakukan apa pun.**

**Jika ragu tentang keputusan, lihat `01_DECISIONS_LOG.md` (compact).**

**Jika ada konflik antara dokumen di folder ini, dokumen ini yang menang.**

**Open ADR yang belum disign lihat `02_OPEN_ADR_TRACKER.md`.**

**Setelah evidence freeze hijau + Husky aktif + ADR foundational disign, mulai R1 backend primitives dengan 4 agent paralel.**

---

*Dokumen ini ADALAH catatan hidup (living document). Update setiap ada keputusan baru.*
*Last updated: 2026-09-10*
