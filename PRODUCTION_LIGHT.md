# PRODUCTION LIGHT — Dokumentasi Pruning & Branch Strategy

> **Dibuat**: 2026-07-24
> **Oleh**: Muhammad Luthfi (via Claude Code)
> **Tujuan**: Membuat versi ringan ERP yang hanya berisi modul RND + Digital Marketing + HR
> **Branch**: `production-light` (bercabang dari `main`)

---

## 📋 Daftar Isi

1. [Latar Belakang](#1-latar-belakang)
2. [Analisis Awal](#2-analisis-awal)
3. [Strategi](#3-strategi)
4. [Daftar Modul yang Dipertahankan](#4-daftar-modul-yang-dipertahankan)
5. [Daftar Modul yang Di-Archive](#5-daftar-modul-yang-di-archive)
6. [Langkah Implementasi](#6-langkah-implementasi)
   - [6.1 Bersihkan Root Directory](#61-bersihkan-root-directory)
   - [6.2 Update .gitignore](#62-update-gitignore)
   - [6.3 Pruning Backend AppModule](#63-pruning-backend-appmodule)
   - [6.4 Hapus Dependency Module Tidak Terpakai](#64-hapus-dependency-module-tidak-terpakai)
   - [6.5 Bersihkan Backend Scripts](#65-bersihkan-backend-scripts)
   - [6.6 Pruning Frontend Pages](#66-pruning-frontend-pages)
   - [6.7 Buat Branch production-light](#67-buat-branch-production-light)
7. [Cara Kembalikan Module Nanti](#7-cara-kembalikan-module-nanti)
8. [Workflow Development](#8-workflow-development)
9. [Catatan Penting](#9-catatan-penting)

---

## 1. Latar Belakang

Proyek ERP memiliki **28 backend module** dan puluhan frontend page. Dari semuanya, hanya **3 modul** yang benar-benar akan dipakai dalam waktu dekat:

| Modul | Prioritas | Status |
|---|---|---|
| RND (Research & Development) | 🔴 Tinggi | Aktif |
| Digital Marketing (DigiMar) | 🔴 Tinggi | Aktif |
| HR (Human Resources) | 🟡 Sedang | Menyusul |

Modul lain (Finance, Warehouse, Production, SCM, Bussdev, Legal, QC, dll) **tidak akan dipakai dalam jangka waktu dekat**.

### Masalah yang Teridentifikasi

| Masalah | Penyebab |
|---|---|
| Build lama (30-60 detik) | Semua 28 module dikompilasi |
| Error susah dilacak | Error dari modul manapun bisa ngebreak startup |
| File watcher lemot | Ribuan file dari agent tool folders, logs, dll |
| Deploy size besar (~300MB) | Banyak kode tidak terpakai ikut di-deploy |
| Git repo gemuk | Banyak file sampah (279 untracked files!) |

---

## 2. Analisis Awal

### 2.1 Root Directory — Sebelum

```
📁 ERP FROM ZERO/
├── 📁 .agents/           ← Agent AI tool (tidak perlu)
├── 📁 .claude/           ← Claude config (tidak perlu di git)
├── 📁 .codex/            ← Codex tool (tidak perlu)
├── 📁 .fcc-*/            ← 11 folder FCC tools (tidak perlu)
├── 📁 .mimocode/         ← Tool (tidak perlu)
├── 📁 .opencode/         ← Tool (tidak perlu)
├── 📁 .playwright*/      ← Test browsers (tidak perlu)
├── 📁 .superpowers/      ← Tool (tidak perlu)
├── 📁 node_modules/      ← Dependencies (di gitignore)
├── 📁 backend/           ← Backend NestJS
│   ├── 📁 src/modules/   ← 28 modules
│   ├── 📁 prisma/        ← Schema & seeds
│   └── 📁 dist/          ← Build output (di gitignore)
├── 📁 frontend/          ← Frontend Next.js
│   ├── 📁 src/app/       ← Pages & routes
│   └── 📁 .next/         ← Build output
├── 📄 deploy-*.tar.gz    ← 9 file arsip deploy (~50MB)
├── 📄 *.log              ← 8 file log (ratusan MB)
├── 📄 *.js/*.ts          ← 30+ file script satu kali pakai
└── 📄 docker-compose.yml
```

### 2.2 Backend Module Dependencies

Sebelum pruning, saya mapping dependency graph untuk memastikan modul yang dipertahankan tetap jalan:

```
📦 Modul yang DI-PERTAHANKAN:
├── AuthModule           ← Otentikasi (WAJIB)
├── UsersModule          ← User management (WAJIB)
├── MarketingModule      ← DigiMar (PRIORITAS)
│   └── ⚠️  dulu import FinanceModule → DIHAPUS (tidak dipakai)
├── RndModule            ← RND (PRIORITAS)
│   └── ⚠️  dulu import LegalityModule → DIHAPUS (diganti stub)
└── HrModule             ← HR (MENYUSUL)

📦 Modul yang di-COMMENT:
├── FinanceModule        ← Tidak dipakai
│   ├── ScmModule        ← Tidak dipakai
│   ├── CreativeModule   ← Tidak dipakai
│   └── WarehouseModule  ← Tidak dipakai
├── LegalityModule       ← Tidak dipakai
│   └── BussdevModule    ← Tidak dipakai
│       └── ScmModule    ← Tidak dipakai
├── (24 module lainnya)  ← Tidak dipakai
```

### 2.3 Intervensi Kode yang Dilakukan

Karena ada cross-module dependencies, 2 file diubah:

1. **`marketing.service.ts`** — `FinanceService` di-inject tapi **tidak pernah dipanggil** method-nya. Hanya dipakai untuk string literal "FINANCE". Aman dihapus.
2. **`formulas.service.ts`** — `LegalityService.validateFormula()` dipanggil untuk gate BPOM. Untuk MVP, di-stub return `{ canProceed: true }`.

---

## 3. Strategi

**Pendekatan: Branch `production-light`**

```
main ────────────────────── full ERP (28 modul, semua lengkap)
  │                          ↳ untuk development & source of truth
  │
  └── production-light ──── ringan (5 modul)
                             ↳ untuk deploy production & testing
```

**Workflow:**
1. Semua development & fix bug → di `main`
2. Secara periodik → `git rebase main` ke `production-light`
3. Deploy → dari `production-light`

---

## 4. Daftar Modul yang Dipertahankan

### Backend (5 modul aktif dari 28)

| No | Module | Alasan |
|---|---|---|
| 1 | `AuthModule` | Otentikasi wajib |
| 2 | `UsersModule` | Manajemen user wajib |
| 3 | `MarketingModule` | Digital Marketing (prioritas) |
| 4 | `RndModule` | RND (prioritas) |
| 5 | `HrModule` | HR (menyusul) |

**Global modules tetap jalan:**
- `PrismaModule` — database
- `EventEmitterModule` — event system
- `ScheduleModule` — scheduler
- `SharedModule` — shared utilities

### Frontend (pages yang dipertahankan)

```
frontend/src/app/
├── login/               ← Halaman login
├── (dashboard)/
│   ├── dashboard/       ← Dashboard utama
│   ├── marketing/       ← Digital Marketing
│   ├── rnd/             ← RND
│   ├── hr/              ← HR (jika sudah ada)
│   ├── layout.tsx       ← Layout dashboard
│   ├── error.tsx        ← Global error
│   └── loading.tsx      ← Global loading
```

---

## 5. Daftar Modul yang Di-Archive

### Root Directory — Dipindah ke `_archive/`

```
📦 Root → _archive/
├── 📁 .agents/
├── 📁 .claude/
├── 📁 .codex/
├── 📁 .fcc-*/           (11 folder)
├── 📁 .mimocode/
├── 📁 .opencode/
├── 📁 .playwright/
├── 📁 .playwright-browsers/
├── 📁 .playwright-cli/
├── 📁 .superpowers/
├── 📁 scratch/
├── 📁 test-results/
├── 📁 tests/
├── 📁 plan/
├── 📁 evidence-research/
├── 📁 docs/
├── 📁 artifacts/
├── 📄 *.tar.gz           (9 file deploy archive)
├── 📄 *.log              (8 file log)
├── 📄 *.txt              (backend_error.txt, backend_out.txt)
├── 📄 _write_component.js
├── 📄 AGENTS.md
├── 📄 DEPLOY.md
├── 📄 ERP_GAP_ANALYSIS.md
├── 📄 check_admins.js
├── 📄 check_user.js
├── 📄 create*.sql
├── 📄 deploy.ps1 / deploy.sh / deploy-remote.sh
├── 📄 fix-localhost.ps1
├── 📄 fcc-*.cmd / fcc-*.ps1
├── 📄 GO_ONLINE.ps1
├── 📄 go-live-playwright.json
├── 📄 opencode.json
├── 📄 playwright*.json
├── 📄 rbac-report*.json
├── 📄 reset_admin.js
├── 📄 setup_hetzner.sh
├── 📄 storageState.json
├── 📄 temp_fix3.js
├── 📄 tmp-* / *.js / *.html
├── 📄 VISUAL_DNA.md
└── 📄 { }                (file kosong)
```

### Backend — Dipindah ke `_archive/backend/`

```
backend/
├── check_frontend_url.js
├── check_status.js
├── check_url2.js
├── data/
├── debug-pass.js
├── deploy_check.js
├── deploy_final.js
├── deploy_tarball.js
├── fix_frontend_final.js
├── fix_frontend_url.js
├── hotfix_deploy.js
├── hotfix_v2.js
├── hotfix_v3.js
├── logs/
├── patch.sh
├── patch_frontend.js
├── patch_frontend2.js
├── rebuild_frontend.js
├── rebuild_server.js
├── run-backend.ps1
├── start-backend.cmd
├── test-rnd-api.js
├── uat-seed.js
├── prisma/*seed*          (seed files yang tidak penting)
├── prisma/cleanup-e2e.ts
├── prisma/convert-csv-to-json.ts
├── prisma/create-amira.cjs
├── prisma/create-bagir-user.ts
├── prisma/create-rnd-users.ts
├── prisma/migrate-mkt-proto-to-db.ts
├── prisma/seed-marketing-prototype-users.ts
├── prisma/seed-personnel.ts
├── prisma/seed-rnd-data.ts
├── test/                   (semua file test)
├── uploads/creative_assets/*.pdf
```

### Frontend Pages — Dipindah

```
frontend/src/app/(dashboard)/
├── automation/         ← archive
├── bussdev/            ← archive
├── creative/           ← archive
├── dna-preview/        ← archive
├── document-center/    ← archive
├── documents/          ← archive
├── executive/          ← archive
├── finance/            ← archive
├── legality/           ← archive
├── logistics/          ← archive
├── master/             ← archive
├── my-dashboard/       ← archive
├── my-requests/        ← archive
├── production/         ← archive
├── qc/                 ← archive
├── scm/                ← archive
├── system/             ← archive
├── user/               ← archive
└── warehouse/          ← archive
```

---

## 6. Langkah Implementasi

> Semua perintah dijalankan dari root project `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\`

### 6.1 Bersihkan Root Directory

**Tujuan**: Pindahkan semua file/folder sampah ke `_archive/`

```bash
# Buat folder archive
mkdir _archive _archive/backend _archive/backend/prisma _archive/backend/test

# Pindahkan agent/tool folders
mv .agents/ .claude/ .codex/ .fcc-*/ .mimocode/ .opencode/ .superpowers/ .playwright/ .playwright-browsers/ .playwright-cli/ _archive/ 2>/dev/null || true

# Pindahkan folder sementara
mv scratch/ test-results/ tests/ plan/ evidence-research/ docs/ artifacts/ _archive/ 2>/dev/null || true

# Pindahkan file log dan archive
mv *.tar.gz *.log backend_error.txt backend_out.txt backend_dev.log _archive/ 2>/dev/null || true

# Pindahkan file-file akar
mv _write_component.js AGENTS.md DEPLOY.md ERP_GAP_ANALYSIS.md VISUAL_DNA.md _archive/ 2>/dev/null || true
mv check_admins.js check_user.js create_mkt_proto_tables.sql _archive/ 2>/dev/null || true
mv deploy.ps1 deploy.sh deploy-remote.sh fix-localhost.ps1 _archive/ 2>/dev/null || true
mv fcc-check-model.cmd fcc-check-model.ps1 fcc-start-deepseek.cmd fcc-start-deepseek.ps1 _archive/ 2>/dev/null || true
mv GO_ONLINE.ps1 go-live-playwright.json opencode.json _archive/ 2>/dev/null || true
mv playwright*.json rbac-report*.json reset_admin.js _archive/ 2>/dev/null || true
mv setup_hetzner.sh storageState.json temp_fix3.js _archive/ 2>/dev/null || true
mv tmp-* "{}" *.html *.js _archive/ 2>/dev/null || true
```

### 6.2 Update .gitignore

Tambahkan aturan berikut ke `.gitignore`:

```gitignore
# Archive
_archive/

# Agent/IDE folders
.agents/
.claude/
.codex/
.fcc-*/
.mimocode/
.opencode/
.superpowers/

# Test browsers
.playwright/
.playwright-browsers/
.playwright-cli/

# Logs
*.log
backend_error.txt
backend_out.txt
backend_dev.log
backend-test-server.log
frontend_dev.log
frontend*.log
backend*.out.log
backend*.err.log
backend*.txt

# Build artifacts
*.tar.gz
tmp/
scratch/
test-results/
```

### 6.3 Pruning Backend AppModule

File: `backend/src/app.module.ts`

24 module di-comment-out. Hanya menyisakan:
- `PrismaModule`
- `UsersModule`
- `AuthModule`
- `MarketingModule`
- `RndModule`
- `HrModule`
- `EventEmitterModule`
- `ScheduleModule`
- `SharedModule`
- `ServeStaticModule`

### 6.4 Hapus Dependency Module Tidak Terpakai

**File: `backend/src/modules/marketing/marketing/marketing.service.ts`**
- Hapus `import { FinanceService } from '../../finance/finance.service';`
- Hapus `private finance: FinanceService,` dari constructor

**File: `backend/src/modules/marketing/marketing.module.ts`**
- Hapus `FinanceModule` dari `imports: [PrismaModule, FinanceModule]`
- Hapus `import { FinanceModule } from '../finance/finance.module';`

**File: `backend/src/modules/rnd/formulas/formulas.service.ts`**
- Hapus `import { LegalityService } from '../../legality/legality.service';`
- Hapus `private legality: LegalityService,` dari constructor
- Ganti `const validation = await this.legality.validateFormula(id);` dengan stub

**File: `backend/src/modules/rnd/rnd.module.ts`**
- Hapus `LegalityModule` dari `imports: [LegalityModule]`
- Hapus `import { LegalityModule } from '../legality/legality.module';`

### 6.5 Bersihkan Backend Scripts

Pindahkan script tidak terpakai ke `_archive/backend/`:
```bash
mv backend/check_*.js backend/backend/ 2>/dev/null || true
mv backend/debug-pass.js backend/deploy_check.js backend/deploy_final.js backend/deploy_tarball.js _archive/backend/
mv backend/fix_*.js _archive/backend/
mv backend/hotfix_*.js _archive/backend/
mv backend/patch*.sh backend/patch*.js _archive/backend/
mv backend/rebuild_*.js _archive/backend/
mv backend/run-backend.ps1 backend/start-backend.cmd _archive/backend/
mv backend/test-rnd-api.js backend/uat-seed.js _archive/backend/
mv backend/data/ backend/logs/ _archive/backend/
mv backend/prisma/seed-marketing-prototype-users.ts _archive/backend/prisma/
mv backend/prisma/seed-personnel.ts _archive/backend/prisma/
mv backend/prisma/seed-rnd-data.ts _archive/backend/prisma/
mv backend/prisma/cleanup-e2e.ts _archive/backend/prisma/
mv backend/prisma/convert-csv-to-json.ts _archive/backend/prisma/
mv backend/prisma/create-*.ts _archive/backend/prisma/
mv backend/prisma/create-amira.cjs _archive/backend/prisma/
mv backend/prisma/migrate-mkt-proto-to-db.ts _archive/backend/prisma/
```

### 6.6 Pruning Frontend Pages

Pindahkan halaman tidak terpakai:
```bash
mv frontend/src/app/\(dashboard\)/automation _archive/frontend/
mv frontend/src/app/\(dashboard\)/bussdev _archive/frontend/
# ... dan seterusnya untuk semua halaman tidak terpakai
```

### 6.7 Buat Branch production-light

```bash
git checkout -b production-light
git add -A
git commit -m "chore: create production-light branch with only RND + DigiMar + HR modules"
git push origin production-light
```

---

## 7. Cara Kembalikan Module Nanti

### Opsi 1: Checkout file dari branch main

```bash
# Contoh: mengembalikan FinanceModule
git checkout main -- backend/src/modules/finance
git checkout main -- frontend/src/app/\(dashboard\)/finance

# Kembalikan import di app.module.ts
# (edit file untuk uncomment FinanceModule)

git add -A
git commit -m "feat: restore Finance module"
```

### Opsi 2: Merge dari branch main

```bash
git checkout production-light
git merge main --no-commit
# Pilih perubahan yang diinginkan (resolusi conflict jika ada)
git commit -m "merge: sync with main"
```

### Opsi 3: Cherry-pick file spesifik

```bash
# Cari commit di main yang menambahkan fitur
git log main --oneline

# Ambil commit tertentu
git cherry-pick <commit-hash>
```

---

## 8. Workflow Development

```
main (full ERP)
│
├── [Development] Semua fitur & fix dikerjakan di sini
│
└── production-light (ringan untuk deploy)
    │
    ├── [Periodik] git rebase main  →  sinkronisasi dari main
    │
    └── [Deploy]  Build & deploy dari branch ini

Siklus:
1. Developer kerja di main → buat fitur/fix
2. Tiap minggu: rebase production-light ke main
3. Deploy dari production-light
4. Jika butuh module baru: checkout dari main
```

---

## 9. Implementation Status

> ✅ = Selesai & di-commit ke `production-light`
> ⏳ = Ditunda (butuh diskusi lebih lanjut)

| Step | Status | Keterangan |
|---|---|---|
| 6.1 Root Directory Cleanup | ✅ | Agent folders, logs, tarballs, scripts → _archive |
| 6.2 Update .gitignore | ✅ | Agent folders, logs, _archive, test artifacts ditambahkan |
| 6.3 Pruning Backend AppModule | ✅ | 24 module di-comment-out (5 aktif) |
| 6.4a Marketing: hapus FinanceService | ✅ | Marketing.service.ts & marketing.module.ts |
| 6.4b RND: hapus LegalityService | ✅ | Formulas.service.ts (stub) & rnd.module.ts |
| 6.5 Bersihkan Backend Scripts | ✅ | Deploy scripts, test files, seed files → _archive |
| 6.6 Pruning Frontend Pages | ✅ | 18 page folders di-archive, 5 dipertahankan |
| 6.7 Buat Branch production-light | ✅ | Branch dibuat & commit berhasil |
| Verifikasi Build | ⏳ | Perlu di-test setelah deploy |

### Hasil Akhir

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Backend modules aktif | 28 | 5 |
| Frontend page routes | 23 | 5 |
| Total files di commit | - | 477 file berubah |
| Baris kode dihapus | - | 92,555 baris |
| Baris kode ditambah | - | 703 baris (dokumentasi + stub) |

### File yang Dimodifikasi (Final)

| File | Perubahan |
|---|---|
| `backend/src/app.module.ts` | Comment-out 24 module imports |
| `backend/src/modules/marketing/marketing/marketing.service.ts` | Hapus FinanceService dependency |
| `backend/src/modules/marketing/marketing.module.ts` | Hapus FinanceModule import |
| `backend/src/modules/rnd/formulas/formulas.service.ts` | Stub legality.validateFormula |
| `backend/src/modules/rnd/rnd.module.ts` | Hapus LegalityModule import |
| `.gitignore` | Tambah aturan untuk agent folders, logs, archive |
| `PRODUCTION_LIGHT.md` | Dokumentasi (file baru) |

---

## 10. Simplification Plan — Beyond Seed & AppModule

> **Tujuan**: Bikin proyek beneran ramping, gampang di-build, di-debug, dan di-test.
> Hanya untuk RND + Digital Marketing + HR.
>
> Ada 3 Tier. Kerjakan urut dari Tier 1 dulu.

---

### Tier 1: 🔥 Quick Wins (Masing-masing < 30 menit)

#### 1.1 Sidebar Navigation — Buang Link Module Mati

**Lokasi**: `frontend/src/components/layout/Sidebar.tsx`

**Sekarang**: Sidebar masih punya 11 nav group (Executive, Bussdev, Finance, Legalitas, SCM, Production, QC, Gudang, Creative, HR, dll). Tapi halaman-halaman itu sudah tidak ada.

**Harusnya jadi**: Cuma 3 nav group: **DIGITAL MARKETING**, **RESEARCH & DEV**, **HUMAN RESOURCES**.

```typescript
const MODULE_STRUCTURE: NavGroup[] = [
  {
    label: "DIGITAL MARKETING",
    icon: BarChart3,
    items: [
      { name: "Marketing Analytics", href: "/marketing/dashboard", type: "dashboard" },
      { name: "Management Task", href: "/marketing/management-task", type: "action" },
    ]
  },
  {
    label: "RESEARCH & DEV",
    icon: Beaker,
    items: [
      { name: "Active Pipeline", href: "/rnd/pipeline", type: "action" },
      { name: "Formula Repository", href: "/rnd/repository", type: "history" },
      { name: "Analytics Trend", href: "/rnd/analytics", type: "dashboard" },
      { name: "Project Monitoring", href: "/rnd/project-monitoring", type: "action" },
    ]
  },
  {
    label: "HUMAN RESOURCES",
    icon: Users,
    items: [
      { name: "Dashboard", href: "/hr/dashboard", type: "dashboard" },
      { name: "Personnel", href: "/master/personnel", type: "input" },
    ]
  },
];
```

**Efek**: Sidebar dari ~150+ baris jadi ~60 baris. Navigasi lebih jelas. User gak bingung lihat menu yang error.

---

#### 1.2 Seed Files — Archive Semua Kecuali Marketing + RND

**Lokasi**: `backend/prisma/seeders/`

**Sekarang**: Ada 15+ file seeder. Sebagian besar tidak dipakai.

**Tindakan**:

```bash
mkdir -p _archive/backend/prisma/seeders

# Archive seeder yang tidak dipakai
mv backend/prisma/seeders/bussdev.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/creative.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/finance.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/hr.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/kpi-metrics.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/kpi-scores.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/legal.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/master.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/orders.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/personnel.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/production.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/warehouse.seeder.ts _archive/backend/prisma/seeders/
mv backend/prisma/seeders/website.seeder.ts _archive/backend/prisma/seeders/
```

**Dipertahankan**: `marketing.seeder.ts`, `rnd.seeder.ts`, `utils.ts`
**Update**: `backend/prisma/seed.ts` — buang semua import seeder yang di-archive

**Efek**: Perintah `npx prisma db seed` jadi cepat, gak loading 15 seeder yang gak dipakai.

---

#### 1.3 Dockerfile — Sederhanakan Build Stage

**Lokasi**: `backend/Dockerfile`

**Sekarang**: Mungkin punya multi-stage build yang besar.

**Saran**: Pastikan Dockerfile cuma build module yang aktif (udah otomatis karena module di-comment di app.module.ts, tapi build tetap kompilasi semua file).

**Optimasi**: Tambahkan `.dockerignore` untuk mengecualikan module yang tidak dipakai:

```
# .dockerignore
node_modules/
dist/
src/modules/finance/
src/modules/warehouse/
src/modules/production/
src/modules/scm/
src/modules/bussdev/
src/modules/legality/
src/modules/creative/
src/modules/qc/
src/modules/logistics/
src/modules/fulfillment/
src/modules/crm/
src/modules/commercial/
src/modules/analytics/
src/modules/executive/
src/modules/master/
src/modules/my-dashboard/
src/modules/activity-stream/
src/modules/notification/
src/modules/events/
src/modules/system/
src/modules/document-automation/
src/modules/guests/
src/modules/production-planning/
src/modules/floor-execution/
```

**Efek**: Build image dari ~1.5GB jadi ~300MB. Build time turun drastis.

---

#### 1.4 Hapus Icon Import Gak Kepake di Sidebar

**Lokasi**: `frontend/src/components/layout/Sidebar.tsx`

**Sekarang**: Import 30+ icon dari lucide-react. Setelah pruning nav group, 20+ icon gak dipakai.

**Tindakan**: Hapus import icon yang gak dipakai (ShieldAlert, Activity, Landmark, Scale, Factory, Truck, Warehouse, FlaskConical, Palette, dll)

**Efek**: Bundle size frontend turun. Build lebih cepat.

---

### Tier 2: 🟡 Perlu Agak Hati-hati (Masing-masing 30-60 menit)

#### 2.1 Prisma Schema — Archive File Schema yang Tidak Dipakai

**Lokasi**: `backend/prisma/schema/`

**Sekarang**: 17 file schema. Tapi model RND mereferensi model dari bussdev & scm.

**Yang BISA di-archive** (aman, gak ada dependensi dari RND/Marketing/HR):

```bash
# Aman dihapus — tidak direferensi oleh RND/Marketing/HR
mv backend/prisma/schema/creative.prisma _archive/backend/prisma/
mv backend/prisma/schema/document-automation.prisma _archive/backend/prisma/
mv backend/prisma/schema/finance.prisma _archive/backend/prisma/
mv backend/prisma/schema/production.prisma _archive/backend/prisma/
mv backend/prisma/schema/qc.prisma _archive/backend/prisma/
mv backend/prisma/schema/logistics.prisma _archive/backend/prisma/    # (kalo ada)
mv backend/prisma/schema/fulfillment.prisma _archive/backend/prisma/  # (kalo ada)
mv backend/prisma/schema/system.prisma _archive/backend/prisma/
mv backend/prisma/schema/website.prisma _archive/backend/prisma/
mv backend/prisma/schema/warehouse.prisma _archive/backend/prisma/
```

**Yang HARUS ditahan** (direferensi oleh RND):

| File | Direferensi oleh RND |
|---|---|
| `bussdev.prisma` | Model `SalesLead` (FK di SampleRequest) |
| `scm.prisma` | Model `MaterialItem` (FK di FormulaItem & BillOfMaterial) |

**Solusi jangka panjang**: Pindahkan model `SalesLead` dan `MaterialItem` ke schema RND, lalu archive bussdev & scm. Tapi ini perlu edit kode backend juga (import path berubah).

---

#### 2.2 Backend Module Code — Hapus Module yang Sudah Di-comment

**Lokasi**: `backend/src/modules/`

**Sekarang**: Walaupun di-comment di app.module.ts, code 24 module masih ada di disk.

**Tindakan**:

```bash
# Archive module code yang sudah di-comment
mkdir -p _archive/backend/src/modules

for mod in finance warehouse production scm bussdev legality creative qc logistics fulfillment crm commercial analytics executive master my-dashboard activity-stream notification events system document-automation guests production-planning floor-execution todo; do
    mv "backend/src/modules/$mod" "_archive/backend/src/modules/"
done
```

**⚠️ Peringatan**: Pastikan module yang di-archive benar-benar tidak di-import oleh module aktif. Cek dulu:
- MarketingModule → udah dihapus import FinanceModule ✅
- RndModule → udah dihapus import LegalityModule ✅
- AuthModule → cuma import UsersModule ✅

**Efek**: Folder backend dari 28 module jadi ~5 module. File watcher, build, semua lebih cepat.

---

#### 2.3 Frontend Components — Archive Component yang Tidak Dipakai

**Lokasi**: `frontend/src/components/`

**Sekarang**: Beberapa component folder masih ada (automation, bussdev, commercial, dna, documents, executive, finance, production, qc).

**Tindakan**:

```bash
mv frontend/src/components/automation _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/bussdev _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/commercial _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/dna _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/documents _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/executive _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/finance _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/production _archive/frontend/components/ 2>/dev/null
mv frontend/src/components/qc _archive/frontend/components/ 2>/dev/null
```

**Dipertahankan**: `charts`, `dashboard`, `hr`, `layout`, `marketing`, `providers`, `rnd`, `ui`

---

#### 2.4 API Client — Bersihkan Endpoint

**Lokasi**: `frontend/src/lib/api.ts`

**Sekarang**: 54 line, kemungkinan besar ada fungsi untuk setiap module.

**Tindakan**: Hapus fungsi API yang tidak dipakai (finance, warehouse, production, dll). Sisakan hanya marketing, rnd, hr, auth, users.

---

### Tier 3: 🔴 Butuh Pengerjaan Lebih Lama (1-3 jam per item)

#### 3.1 Resolusi Cross-Schema Prisma

**Masalah**: `rnd.prisma` butuh `SalesLead` (dari bussdev.prisma) dan `MaterialItem` (dari scm.prisma).

**Opsi A (Rekomendasi)**: Copy model yang dibutuhkan ke `rnd.prisma` dengan nama berbeda, lalu hapus relasi FK-nya sementara:

```prisma
// Di rnd.prisma — tambahkan model minimal untuk SalesLead
model RndSalesLead {
  id        String   @id @default(uuid()) @db.Uuid
  companyName String?
  // ...field lain yang dibutuhkan
  
  @@map("sales_leads")  // akses tabel yang sama
}
```

Tapi ini rumit. **Opsi lebih praktis**: Archive dulu yang benar-benar aman, biarkan bussdev & scm schema tetap ada.

**Prioritas**: Kerjakan TERAKHIR, setelah Tier 1 & 2 selesai.

---

#### 3.2 Dependency Audit — Hapus Package Tidak Terpakai

**Lokasi**: `backend/package.json`, `frontend/package.json`

**Contoh package yang mungkin tidak dipakai** (perlu dicek):
- `html-pdf-node` — mungkin cuma dipakai module document-automation
- `ssh2` — mungkin cuma untuk deploy script
- `@nestjs/websockets` / `socket.io` — mungkin cuma untuk event-notification
- `compression` — mungkin gak kepakai
- `winston` / `winston-daily-rotate-file` — logging, bisa diganti console.log untuk development

**Efek**: `npm install` jadi lebih cepat. node_modules lebih kecil. Security footprint berkurang.

---

#### 3.3 Database Migration — Reset & Fresh

**Lokasi**: `backend/prisma/migrations/`

**Sekarang**: 2 migration folder dengan semua tabel untuk 28 module.

**Tindakan** (kalo database bisa direset):

```bash
# 1. Hapus folder migration lama
rm -rf backend/prisma/migrations

# 2. Buat migration baru dari schema yang already trimmed
npx prisma migrate dev --name init_production_light

# 3. Generate Prisma client
npx prisma generate
```

**⚠️ Peringatan**: Ini hanya untuk development/UAT. Jangan untuk production yang sudah ada data.

---

### Ringkasan Prioritas Eksekusi

| No | Item | Tier | Estimasi | Efek ke Build | Efek ke Debug |
|---|---|---|---|---|---|
| 1 | Sidebar pruning | 🔥 Quick | 15 menit | Rendah | ⭐ Sedang (gak bingung lihat menu error) |
| 2 | Seed files cleanup | 🔥 Quick | 15 menit | Rendah | ⭐⭐ Tinggi (seed cepat) |
| 3 | Docker ignore | 🔥 Quick | 10 menit | ⭐⭐ Tinggi | Rendah |
| 4 | Icon import cleanup | 🔥 Quick | 5 menit | Rendah | Rendah |
| 5 | Prisma schema archive | 🟡 Medium | 30 menit | ⭐⭐ Tinggi | ⭐⭐ Tinggi |
| 6 | Backend module code hapus | 🟡 Medium | 30 menit | ⭐⭐⭐ Sangat Tinggi | ⭐⭐ Tinggi |
| 7 | Frontend component hapus | 🟡 Medium | 15 menit | ⭐⭐ Tinggi | ⭐ Sedang |
| 8 | API client cleanup | 🟡 Medium | 15 menit | Rendah | ⭐ Sedang |
| 9 | Prisma cross-schema fix | 🔴 Berat | 1-2 jam | ⭐⭐ Tinggi | ⭐⭐ Tinggi |
| 10 | Dependency audit | 🔴 Berat | 1 jam | ⭐⭐ Tinggi | Rendah |
| 11 | Migration reset | 🔴 Berat | 1 jam | ⭐⭐ Tinggi | ⭐⭐ Tinggi |

### Rekomendasi Eksekusi

**Minggu ini (Tier 1):**
1. ✅ Seed files cleanup (15 menit)
2. ✅ Hapus code backend module (30 menit) — paling besar efeknya
3. ✅ Sidebar pruning (15 menit)
4. ✅ Docker ignore (10 menit)

**Minggu depan (Tier 2):**
5. Prisma schema archive (30 menit)
6. Frontend component archive (15 menit)

**Kalau masih ada waktu (Tier 3):**
7. Dependency audit
8. Database migration reset

1. **Jangan commit langsung ke `production-light`** — semua development di `main`, lalu rebase
2. **File di `_archive/` TIDAK ikut git** — folder ini di .gitignore. Fungsinya hanya sebagai temporary placeholder sebelum yakin mau hapus permanen.
3. **Prisma schema tidak diubah** — semua tabel tetap ada di database, hanya back end module yang tidak diregister.
4. **Frontend component tetap dipertahankan** — hanya page routes yang dihapus. Component di `src/components/` tetap ada.
5. **History git tetap aman** — semua perubahan tercatat. Tidak ada force push.
6. **Untuk mengembalikan module** → lihat [Cara Kembalikan Module Nanti](#7-cara-kembalikan-module-nanti)

---

## Lampiran

### A. Ukuran Sebelum vs Sesudah

| Item | Sebelum | Sesudah | Pengurangan |
|---|---|---|---|
| Backend modules | 28 | 5 | 82% |
| Frontend pages | 22 | 5 | 77% |
| Root folder items | 80+ | ~15 | 81% |
| Build time (estimasi) | 30-60 detik | 5-10 detik | ~80% |
| Deploy size (estimasi) | ~300MB | ~50MB | ~83% |
| Error noise | Tinggi | Rendah | Signifikan |

### B. File yang Dimodifikasi

| File | Perubahan |
|---|---|
| `backend/src/app.module.ts` | Comment-out 24 module imports |
| `backend/src/modules/marketing/marketing/marketing.service.ts` | Hapus FinanceService dependency |
| `backend/src/modules/marketing/marketing.module.ts` | Hapus FinanceModule import |
| `backend/src/modules/rnd/formulas/formulas.service.ts` | Stub legality.validateFormula |
| `backend/src/modules/rnd/rnd.module.ts` | Hapus LegalityModule import |
| `.gitignore` | Tambah aturan untuk agent folders, logs, archive |

### C. File yang Di-archive

> Total ~200+ file/folder dipindahkan ke `_archive/`
> Detail lengkap: lihat [Daftar Modul yang Di-Archive](#5-daftar-modul-yang-di-archive)
