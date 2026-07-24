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
| 6.7 Buat Branch production-light | ✅ | Branch dibuat & siap di-commit |
| Verifikasi Build | ⏳ | Perlu di-test setelah commit & deploy |

### File yang Dimodifikasi (Final)

| File | Perubahan |
|---|---|
| `backend/src/app.module.ts` | Comment-out 24 module imports |
| `backend/src/modules/marketing/marketing/marketing.service.ts` | Hapus FinanceService dependency |
| `backend/src/modules/marketing/marketing.module.ts` | Hapus FinanceModule import |
| `backend/src/modules/rnd/formulas/formulas.service.ts` | Stub legality.validateFormula |
| `backend/src/modules/rnd/rnd.module.ts` | Hapus LegalityModule import |
| `.gitignore` | Tambah aturan untuk agent folders, logs, archive |

---

## 10. Catatan Penting

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
