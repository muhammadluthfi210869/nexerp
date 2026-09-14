# R1 Master & Access Release Plan

> **Release ID:** `R1-MASTER-ACCESS`
> **Posisi di Release Train:** Release ke-1 (foundation) — mendahului R2 (P2P), R3 (L2C), R4 (Plan-to-Stock), R5 (Close), R6 (Rollout)
> **Status dokumen:** 🟡 `DESIGNED` — menunggu resolusi 7 open question di §11
> **Dibuat:** 2026-09-10
> **REALIGNED 2026-09-10:** referensi plan existing di-realign dari `docs/legacy-erp/backend/00_MASTER_PLAN.md` (TIDAK ADA) ke `docs/plan/*.md` yang real.

---

## ⚠️ REALIGN NOTICE — Referensi Plan Existing

Dokumen ini dibuat dengan asumsi ada paket plan 11 file di `docs/legacy-erp/backend/` (00..08, README, SOURCE_INDEX) yang **TIDAK ADA di filesystem**. Setelah verifikasi 2026-09-10:
- Direktori `docs/legacy-erp/backend/` hanya berisi 3 file (PHASE_0_RUNBOOK, R1_RELEASE_PLAN ini, STRICT_POLICIES_ADDENDUM).
- Real plan existing ada di **`docs/plan/`** (27 file) + **`docs/legacy-erp/_archive/`** (38 file).
- Memory project.md (Kilo) berisi keputusan strategic yang valid dan align dengan plan di `docs/plan/`.

**Cross-reference realign ke plan existing (REAL sources):**

| Topik di R1 ini | Real plan di `docs/plan/` + memory project.md |
|---|---|
| Fase 1 Backend Foundation (Prisma Repairs, State Machine, Security Fixes, Notification) | [`ERP_FINALIZATION_MASTER_PLAN.md`](../../plan/ERP_FINALIZATION_MASTER_PLAN.md) §Fase 1 |
| Strangler Fig + Modular Monolith + Hexagonal | memory project.md `architecture_style`, `module_integration`, `deploy_strategy` |
| API envelope `{ data, meta }` + camelCase naming + RFC 7807 error | memory project.md `api_envelope`, `naming_convention`, `error_format` |
| Universal Code Engine (sequence global) | `ERP_FINALIZATION_MASTER_PLAN.md` §2.2 (smart generators); `INTEGRATED_PIPELINE_PROTOCOL.md` §2.2 (`F-YYMM-[SEQ]`) |
| State Machine + 3-Tier Approval + SoD | `ERP_FINALIZATION_MASTER_PLAN.md` §1.4 (Transition Map), §1.5 (Security) |
| Universal Approval Engine (SoD + Director > 50jt) | `FINANCE_FULL_IMPLEMENTATION_PLAN.md` §2A (Fund Request 3-tier); memory project.md |
| Period Soft/Hard Lock + Adjustment Journal | `FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md` §A (`FinancialPeriod`); `FINANCE_INPUT_OUTPUT_REFINEMENT.md` §5 (Period Locking test) |
| Immutable Journal + Double-Entry Balanced | `FINANCE_FULL_IMPLEMENTATION_PLAN.md` §3B (Mandatory Upload); `ultimate_finance_testing_plan.md` Scenario 5 |
| CoA auto-numbering 1xxx-5xxx | `FINANCE_INPUT_OUTPUT_REFINEMENT.md` §1A (CoA Hierarchy) |
| Moving Average Price (MAP) Valuation | `FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md` §2A (MaterialValuation); §2B (MAP Engine) |
| Materialized Read Models / Dashboard | `PERFORMANCE_INTEGRITY_PLAN.md` §2 divisi-specific |
| Audit Trail + Activity Stream | `INTEGRATED_PIPELINE_PROTOCOL.md` §1.1 (ActivityStream + activity_timeline_logs) |
| 3-Pilar Gudang (Bagus/Reject/Free) + 3-Way Matching | `NEX_ERP_MASTER_SPECIFICATION.md` §3 + legacy `05_master_business_process_blueprint.md` (di `_archive/`) |
| Vertical Slice per-divisi setelah R1 | [`HYPER_ALIGNMENT_PLAN.md`](../../plan/HYPER_ALIGNMENT_PLAN.md) (SCM → Warehouse → Production → Integration); memory project.md `delivery_strategy` |
| E2E Golden Threads (Revenue / Production / People-Compliance) | [`ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md`](../../plan/ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md) Threads 1-3 |
| Triple-Lock Strategy (Static + Runtime + Dynamic) | [`FULLSTACK_INTEGRITY_PLAN.md`](../../plan/FULLSTACK_INTEGRITY_PLAN.md) + [`ERP_V4_QA_MASTER_PLAN.md`](../../plan/ERP_V4_QA_MASTER_PLAN.md) |
| 7 Layers Integrity (Static → Atomic → Flow → E2E → Consistency → Performance → Runtime) | [`SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md`](../../plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md) |
| Cover Lint + Husky + commitlint | [`ZERO_ERROR_ROADMAP.md`](../../plan/ZERO_ERROR_ROADMAP.md) Phase 4-5 |
| Event-Driven Cross-Modul Communication | [`INTEGRATED_PIPELINE_PROTOCOL.md`](../../plan/INTEGRATED_PIPELINE_PROTOCOL.md) + [`comm_prot_v4_implementation.md`](../../plan/comm_prot_v4_implementation.md) |

> **Catatan:** butir DoR/DoD/Go-No-Go/GT-00 di dokumen ini (§3-§6) adalah rekonstruksi dari memory project.md decisions + plan di `docs/plan/`, BUKAN dari file yang TIDAK eksis. Quality gate resmi tetap mengikuti `ERP_FINALIZATION_MASTER_PLAN.md` Fase 5 (Hardening) + `ZERO_ERROR_ROADMAP.md` Phase 5 (Verification).

---

## 0. Ringkasan

### 0.1 Tujuan
Layer pertama ERP siap pakai:
- **Admin** bisa mengelola seluruh master data (CoA, barang, pelanggan, gudang, bank, aset, sales) + user/role/hak akses.
- **Integrator** punya referensi master yang stabil + kontrak API ter-publish (OpenAPI) sebagai fondasi untuk transaction slice R2→R6.
- **Backend primitives** (Universal Code Engine, Audit Log, RBAC, Error Contract, Period Lock, Approval Engine, Journal Engine, MAP Valuation) siap sebagai landasan R2-R6.

### 0.2 Strategi Delivery
**Per-divisi murni** untuk fase ini. Alasan:
- Master Data bersifat *cross-cutting* — ia adalah **dependency inbound** untuk semua slice lain, bukan peserta di dalam business flow.
- Tidak ada satu pun business flow di Master Specification §6 ("Alur Makro Bisnis End-to-End, 10 Fase") yang melibatkan master data sebagai *langkah proses*; semua fase justru **mensyaratkan master data sudah ada**.
- Karena itu vertical slice tidak memberi nilai di R1 — tidak ada "thread" untuk disliced. Yang dibutuhkan adalah *breadth-first completeness* per-divisi.
- Mulai R2, delivery beralih ke vertical slice per [`HYPER_ALIGNMENT_PLAN.md`](../../plan/HYPER_ALIGNMENT_PLAN.md): SCM (Fase 1) → Warehouse (Fase 2) → Production (Fase 3) → Unified Communication (Fase 4).
- Strategi HYBRID keseluruhan disimpan di memory project.md `delivery_strategy`.

### 0.3 Out of Scope R1 (HARD BOUNDARY)
- ❌ Transaksi apapun: **tidak ada** PO, PR, SO, Faktur, DO, Jurnal Umum, Kas Bank Masuk/Keluar, Retur, Adjustment Journal, Depreciation Run, Bank Reconciliation, Budget Entry.
- ❌ Semua screen `area = Operasional` (79 layar), `Laporan` (18 layar), `Dasbor` (22 layar), `Umum` (8 layar), `Pengaturan` (4 layar).
- ❌ Perhitungan turunan: aging barang aktual, book value aktual, achievement % aktual — **kolomnya dibuat, sumber datanya di-null/0 dengan flag `pendingSlice`**.
- ✅ Hanya CRUD master + auth/RBAC + backend primitives.

> **Catatan penting:** beberapa screen master memiliki *action* yang secara natur adalah transaksi (`Run Allocation Test` SCR-023, `Run Amortization` SCR-026, `Transfer Lokasi`/`Dispose Aset` SCR-024). Di R1 aksi ini di-render **disabled dengan tooltip "Tersedia di R5 Close"**, bukan dihapus (menjaga spec conformity visual). Lihat §11 Q5.

### 0.4 Timeline Target
| Kapasitas | Durasi | Catatan |
|---|---|---|
| 1 engineer full-stack | **3 minggu** (15 hari kerja) | sesuai breakdown §7; klaim "2 minggu" tidak realistis — lihat §11 Q7 |
| 2 engineer (1 BE + 1 FE) | **2 minggu** (10 hari kerja) | Mini-Sprint 1–9 tetap sekuensial di BE, FE mengejar dengan lag 1 sprint |
| 2 engineer full-stack (split by divisi) | **8–9 hari** | butuh backend primitives selesai hari 1–3 dulu (tidak bisa diparalelkan) |

### 0.5 Dependencies (entry condition)
- [ ] 🔴 Phase 0 **evidence freeze** hijau — *definisi & checklist ada di `00_MASTER_PLAN.md` yang belum eksis*
- [ ] 🔴 Minimal **7 dari 12 ADR foundational** ber-status `Accepted` — *register ADR belum eksis; lihat §11 Q6*
- [ ] `docs/legacy-erp/backend/00_MASTER_PLAN.md` + `03_TESTING_AND_QUALITY_GATES.md` ditulis dan di-review
- [ ] Spec-conformity audit §2 dijalankan dan drift list dibekukan

---

## 1. Scope R1

### 1.0 ⚠️ KOREKSI SCOPE: "107 layar SCR-023 s/d SCR-096" TIDAK AKURAT

Verifikasi langsung terhadap `NEX_ERP_SCREEN_AND_API_CATALOG.json`:

```powershell
$j = Get-Content "docs\legacy-erp\NEX_ERP_SCREEN_AND_API_CATALOG.json" -Raw | ConvertFrom-Json
$j.screens | Group-Object area   | Sort-Object Count -Descending
$j.screens | Group-Object moduleId
```

| Klaim di instruksi | Fakta di catalog |
|---|---|
| "107 layar Master dari SCR-023 s/d SCR-096" | **Tidak cocok.** `area = "Master"` hanya **35 layar**, yaitu `SCR-023` … `SCR-057` (kontinu, tanpa gap). |
| — | Angka **107** adalah jumlah layar `moduleId = "MOD-01"` (konsisten dengan header spec: *"MOD-01: Master Data — Total Layar/Fitur Terdaftar: 107 Layar"*). Tapi MOD-01 mencakup **Operasional > Akuntansi** (SCR-074…085: Jurnal Umum, Bank Reconciliation, Depreciation Schedule, Client Escrow, dll) dan **Laporan**, yang eksplisit *out of scope* per §0.3. |
| — | Rentang `SCR-023`…`SCR-096` = **74 layar**, dan di dalamnya `SCR-066`…`SCR-096` adalah `area = Umum` / `Operasional` (Checklist QC, Jurnal, Kas Bank, Barang Masuk/Keluar, Budgeting, Buku Tamu, Client Lost). Bukan master. |

**Distribusi area lengkap (176 layar):**

| Area | Jumlah |
|---|---:|
| Operasional | 79 |
| Laporan | 18 |
| Dasbor Departemen | 9 |
| **Master** | **35** |
| Persetujuan | 8 |
| Umum | 8 |
| Dasbor | 6 |
| Dasbor BusDev | 5 |
| Pengaturan | 4 |
| Dasbor Eksekutif | 2 |
| BERANDA | 2 |
| Dasbor Eksekutif (lain) | 2 |

**Scope R1 yang dipakai dokumen ini (definitif, dapat diaudit):**

```
R1 = 35 layar area "Master" (SCR-023 … SCR-057)
   +  4 layar area "Persetujuan" ber-moduleId MOD-01 (SCR-059, SCR-061, SCR-062, SCR-065)
   +  N layar Auth/Session yang BELUM ADA di catalog (Login/Logout/Profile) → lihat §1.3
   = 39 layar ter-katalog + auth surface
```

Angka **107** dipertahankan hanya sebagai *module-level denominator* untuk pelacakan MOD-01 lintas release, bukan sebagai scope R1. Lihat §11 Q1 untuk keputusan yang dibutuhkan.

---

### 1.1 Sub-bagian Master (35 layar, area = `Master`)

Semua data di bawah diekstrak langsung dari catalog. `cols` = `tableColumns.length`, `inp` = `formInputs.length`, `crd` = `cards.length`, `act` = `actions.length`, `note` = `specialRequirementsNotes.length`.

#### 1.1.1 Cost Allocation Setup — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-023 | Cost Allocation Setup | `/master/cost-allocation-setup` | Overhead Allocation Rules | 7 | 4 | 0 | 4 | 1 |

#### 1.1.2 Asset Register — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-024 | Asset Register | `/master/asset-register` | Master List & Asset History | 11 | 3 | 1 | 5 | 1 |
| SCR-025 | Buat Asset Register | `/master/asset-register/create` | Form | 0 | 11 | 0 | 2 | 1 |
| SCR-026 | Compliance / Intangible Asset | `/master/compliance-asset` | Compliance & Amortization Tracker | 9 | 2 | 1 | 4 | 1 |

#### 1.1.3 Kategori Barang — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-027 | Kategori Barang | `/master/goods-category-manage` | Master List | 5 | 2 | 0 | 4 | 0 |
| SCR-028 | Buat Kategori Barang | `/master/goods-category-manage/create` | Form | 0 | 11 | 0 | 2 | 0 |

#### 1.1.4 Barang — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-029 | Barang | `/master/goods-manage` | Master List | 12 | 4 | 0 | **17** | 1 |
| SCR-030 | Buat Barang | `/master/goods-manage/create` | Form | 0 | **18** | 0 | 2 | 1 |

#### 1.1.5 CoA Jurnal Otomatis — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-031 | CoA Jurnal Otomatis | `/master/coa-auto-manage` | Master List | 8 | 9 | 0 | 5 | 1 |

#### 1.1.6 CoA — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-032 | CoA | `/master/coa-manage` | Master List | 7 | 3 | 0 | 6 | 1 |
| SCR-033 | Buat CoA | `/master/coa-manage/create` | Form | 0 | 6 | 0 | 2 | 1 |

#### 1.1.7 Gudang + Akses Gudang — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-034 | Hak Akses Gudang | `/master/warehouse-access-manage` | Master List | 7 | 2 | 0 | 3 | 0 |
| SCR-035 | Gudang | `/master/warehouse-manage` | Master List | 5 | 2 | 0 | 3 | 0 |
| SCR-036 | Buat Gudang | `/master/warehouse-manage/create` | Form | 0 | 5 | 0 | 2 | 0 |

#### 1.1.8 Bank Account — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-037 | Bank Account Master | `/master/bank-account-manage` | Master List | 8 | 2 | 1 | 3 | 1 |
| SCR-038 | Buat Bank Account | `/master/bank-account-manage/create` | Form | 0 | 5 | 0 | 2 | 1 |

#### 1.1.9 Tax Setup — `MOD-01` ⚠️ SPEC CONFLICT
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-039 | Tax Setup | `/master/tax-setup` | Master List | 6 | 1 | 0 | 3 | 1 |

> 🚨 `specialRequirementsNotes` SCR-039 berbunyi: *"**Poin 35: Modul Pajak dan e-Faktur TIDAK PERLU DIKERJAKAN** (di-skip dari scope pengerjaan sesuai arahan final)"* — sementara instruksi R1 memasukkan Tax ke Mini-Sprint 2. Konflik ini **harus** diselesaikan sebelum DoR. Lihat §11 Q3.

#### 1.1.10 Pelanggan + Kategori — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-040 | Kategori Pelanggan | `/master/customer-category-manage` | Master List | 4 | 2 | 0 | 3 | 0 |
| SCR-041 | Buat Kategori Pelanggan | `/master/customer-category-manage/create` | Form | 0 | 2 | 0 | 2 | 0 |
| SCR-042 | Pelanggan | `/master/customer-manage` | Master List | 10 | 3 | **5** | 8 | 1 |
| SCR-043 | Buat Pelanggan | `/master/customer-manage/create` | Form | 0 | 8 | 0 | 2 | 1 |
| SCR-044 | Pelanggan Saya | `/master/customer-my-manage` | Master List | 7 | 2 | 0 | 1 | 0 |
| SCR-045 | Buat Pelanggan Saya | `/master/customer-my-manage/create` | Form | 0 | 9 | 0 | 2 | 0 |

#### 1.1.11 Role / Hak Akses — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-046 | Hak Akses | `/master/role-manage` | Master List | 3 | 2 | 0 | 4 | 0 |
| SCR-047 | Buat Hak Akses | `/master/role-manage/create` | Form | 0 | 1 | 0 | 2 | 0 |

#### 1.1.12 User / Pengguna — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-048 | Pengguna | `/master/user-manage` | Master List | 7 | 2 | 0 | 5 | 0 |
| SCR-049 | Buat Pengguna | `/master/user-manage/create` | Form | 0 | 9 | 0 | 2 | 0 |

#### 1.1.13 Sales Category + Target — `MOD-01`
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-050 | Kategori Penjualan | `/master/sales-category` | Master List | 4 | 2 | 0 | 7 | 0 |
| SCR-051 | Buat Kategori Penjualan | `/master/sales-category/create` | Form | 0 | 2 | 0 | 2 | 0 |
| SCR-052 | Target Penjualan | `/master/sales-target` | Master List | 7 | 2 | 0 | 1 | 0 |
| SCR-053 | Buat Target Penjualan | `/master/sales-target/create` | Form | 0 | 4 | 0 | 2 | 0 |

#### 1.1.14 Supplier + Kategori Supplier — ⚠️ `MOD-04`, bukan MOD-01
| SCR | Page | Route | Type | cols | inp | crd | act | note |
|---|---|---|---|---:|---:|---:|---:|---:|
| SCR-054 | Kategori Supplier | `/scm/supplier-category-manage` | Master List | 4 | 2 | 0 | 3 | 0 |
| SCR-055 | Buat Kategori Supplier | `/scm/supplier-category-manage/create` | Form | 0 | 2 | 0 | 2 | 0 |
| SCR-056 | Supplier | `/scm/supplier-manage` | Master List | 11 | 3 | 0 | 6 | 1 |
| SCR-057 | Buat Supplier | `/scm/supplier-manage/create` | Form | 0 | 11 | 0 | 2 | 1 |

> 🚨 Instruksi R1 menyebut *"Mini-Sprint 3: Master Pelanggan + Supplier (SCR-040-045 + supplier dari SCR lain)"*. Catalog menempatkan supplier di `area=Master` tapi `moduleId=MOD-04` dengan route prefix `/scm/*`. Ada ambiguitas ownership: apakah supplier master milik R1 (Master) atau R2 (P2P/SCM)? Rekomendasi: **masuk R1** (semua slice P2P butuh supplier ada), tapi route tetap `/scm/*` dan module owner tetap `MOD-04`. Lihat §11 Q2.

---

### 1.2 Screen Approval yang masuk R1 (4 layar, `area=Persetujuan`, `moduleId=MOD-01`)

| SCR | Page | Route | cols | act | Kolom tabel (verbatim catalog) |
|---|---|---|---:|---:|---|
| SCR-059 | Penjualan Produk ~ | `/master/sales-approval` | 10 | 5 | `# \| Kode \| Tanggal \| Pelanggan \| Kategori \| Merek \| Pembuat \| Total \| Status \| #` |
| SCR-061 | Permintaan Barang ~ | `/master/goods-request-approval` | 9 | 6 | `# \| Kode \| Tanggal \| Peminta \| Penyedia \| Pembuat \| Catatan \| Status \| #` |
| SCR-062 | Permintaan HPP ~ | `/master/request-cogs-approval` | 10 | 5 | `# \| Kode \| Tanggal \| Pelanggan \| Sales Sample \| Produk \| Pembuat \| Catatan \| Status \| #` |
| SCR-065 | Retur Penjualan ~ | `/master/sales-return-approval` | 9 | 5 | `# \| Tanggal \| Kode Retur \| No. Faktur \| Pelanggan \| Total \| Pembuat \| Status \| #` |

Actions umum: `Riwayat | Lihat | Modal Setuju | Modal Tolak | Tutup` (SCR-061 tambah `Cetak Dokumen`).

> ⚠️ **Ketegangan arsitektural:** keempat screen ini adalah *approval inbox untuk dokumen transaksi* (Penjualan Produk, Permintaan Barang, Permintaan HPP, Retur Penjualan) — dan dokumen-dokumen itu **out of scope R1**. Artinya di R1 keempat screen hanya bisa di-deliver sebagai:
> - **Shell + kontrak API + RBAC + audit trail + approval state machine** (yang memang primitive R1), dengan
> - **dataset kosong** (`data: []`, `meta.total: 0`) karena belum ada dokumen sumber.
>
> Nilai R1-nya nyata: *approval engine* + *permission matrix* + *`Riwayat` audit view* jadi reusable untuk R2 3-Tier Approval. Tapi keempat screen **tidak bisa** lulus acceptance "user bisa approve dokumen nyata" di R1. Lihat §11 Q4.

---

### 1.3 Auth & User Management

**Temuan:** catalog `NEX_ERP_SCREEN_AND_API_CATALOG.json` **tidak memuat** screen Login / Logout / Profile. Tidak ada `screenId` dengan area auth. Screen terdekat adalah `Pengaturan` (4 layar) dan `SCR-046`…`SCR-049`.

Karena itu auth surface R1 didefinisikan **di luar catalog** dan harus di-backfill ke catalog sebagai `SCR-AUTH-001..004` (lihat §11 Q1).

| Ref baru | Surface | Route | Deliverable R1 |
|---|---|---|---|
| `SCR-AUTH-001` | Login | `/login` | form email/NIP + password, rate limit, lockout, error contract 401 |
| `SCR-AUTH-002` | Logout | (action) | invalidate session/refresh token, audit `AUTH.LOGOUT` |
| `SCR-AUTH-003` | Profile / Ganti Password | `/profile` | edit nama/foto/telepon, ganti password (old+new+confirm) |
| `SCR-AUTH-004` | Session / Token refresh | (API) | refresh token rotation, `GET /v1/auth/me` |

**User CRUD dengan role assignment** → SCR-048 / SCR-049. Field form SCR-049 (verbatim): `Kode/NIP (opsional) | Nama* | Foto (opsional) | Email (opsional) | Nomor Telepon (opsional) | Kata Sandi* | Konfirmasi Kata Sandi* | Hak Akses* (Role)`.

> ⚠️ Spec legacy menandai **Email sebagai opsional** dan `Kode/NIP` opsional. Untuk auth berbasis email ini tidak konsisten — minimal satu identifier unik wajib. Rekomendasi ADR: `identifier = NIP ?? email`, salah satu WAJIB dan unik. Masuk drift list §2.

**Role/Permission matrix** → SCR-046 / SCR-047. Catalog SCR-047 hanya punya **1 input** (`Nama * Nama role`) — tidak ada permission picker. Ini gap fungsional serius: role tanpa permission assignment tidak bisa menegakkan RBAC. Rekomendasi: extend SCR-047 dengan permission matrix tree (menu × action), dicatat sebagai **ADR override** terhadap spec legacy. Masuk drift list §2.

---

### 1.4 Backend Primitives yang PERLU di-build untuk R1

| # | Primitive | Kebutuhan konkret dari spec | Consumer R1 | Consumer slice berikut |
|---|---|---|---|---|
| P1 | **Universal Code Engine** | Format lengkap `DL-DIV-PRD-DDMMYYYY-0001` + ringkas `PRD-DDMMYYYY-0001`; nomor urut akhir **global & berkelanjutan, tidak reset** (SCR-030 note). Asset: `DL-FIN-AST-…` urut global tanpa reset (SCR-024 note). Vendor: universal auto ringkas/lengkap global sequence (SCR-057). Customer: auto global (SCR-043). CoA: auto numbering by type `1xxx Asset, 2xxx Liability, …` (SCR-032 note) | SCR-024/025, 029/030, 042/043, 032/033, 056/057 | semua dokumen transaksi R2–R6 |
| P2 | **Audit Log service** | Aksi `Riwayat` di SCR-059/061/062/065; jejak deactivate vs delete (SCR-032, 037, 039, 056) | seluruh mutasi master | approval trail, period lock |
| P3 | **Idempotency interceptor** | Belum dipakai transaksi di R1, tapi harus **siap & teruji** | POST create master (defensif) | R2 PO/PR, R3 SO/Invoice |
| P4 | **Error Contract (RFC 7807)** | `error_format :: RFC 7807 Problem Details` | validasi form, unique violation, referential integrity block (SCR-032) | semua |
| P5 | **API Response Envelope** | `{ data: T, meta?: PaginationMeta }` — **no double-wrap** | semua list master | semua |
| P6 | **OpenAPI generation + typesync ke frontend** | zero-drift; FE **wajib** pakai generated types, no manual types | semua endpoint R1 | CI gate permanen |
| P7 | **RBAC enforcement di endpoint** | SCR-031 note: *"Restriksi hak akses hanya Finance Admin/Controller"*; SCR-034 Hak Akses Gudang (user × warehouse scope) | seluruh endpoint R1 | semua |
| P8 | **File upload** | `Foto Barang` (SCR-030), `Foto` profil user (SCR-049), `Dokumen Sertifikat PDF` (SCR-026 detail modal) | 3 screen | lampiran PO/Invoice/COA |
| P9 | **Search-Select / Autocomplete endpoints** | Master Spec §5 DNA: *"Search-Select/Autocomplete WAJIB pada semua field relasi (Supplier, Customer, COA, Material). Tidak ada dropdown statis"* | SCR-030 (8 field COA!), 031, 033, 038, 043, 057 | semua form transaksi |
| P10 | **Soft-delete / Deactivate policy** | SCR-032 note: *"Delete hanya jika belum ada transaksi (referential integrity); jika ada → deactivate"* | CoA, Bank, Tax, Supplier, Customer, User | semua master |

> P9 dan P10 **tidak disebut** di instruksi asli tapi wajib ditambahkan: tanpa P9, 8 field COA di form Buat Barang (SCR-030) tidak bisa dibangun sesuai DNA; tanpa P10, `Hapus / Deactivate` di SCR-032 tidak bisa diimplementasikan benar.

---

## 2. Spec-Conformity Audit (WAJIB vs JSON Catalog)

### 2.1 Metodologi
Untuk **setiap** screen di §1.1–§1.3, bandingkan implementasi vs catalog pada 5 dimensi:

| Dimensi | Field catalog | Kriteria lulus |
|---|---|---|
| D1 Kolom tabel | `tableColumns[]` | jumlah & label sama (urutan sama), termasuk kolom `#` di awal/akhir |
| D2 Input form | `formInputs[]` | jumlah & label sama; marker `*` = required dipertahankan; `(opsional)` = optional |
| D3 Top metric cards | `cards[]` | jumlah & label sama, **dan urutan selaras dengan tab/filter di bawahnya** (Master Spec §5) |
| D4 Actions | `actions[]` | semua tombol ada (boleh `disabled` + tooltip jika out-of-scope, tidak boleh hilang) |
| D5 Special requirements | `specialRequirementsNotes[]` | tiap note punya implementasi atau ADR override tertulis |

### 2.2 Cara menjalankan audit (script harness)

```powershell
# ekstrak baseline catalog untuk 39 screen R1
$j = Get-Content "docs\legacy-erp\NEX_ERP_SCREEN_AND_API_CATALOG.json" -Raw | ConvertFrom-Json
$r1 = $j.screens | Where-Object { $_.area -eq 'Master' -or $_.screenId -in @('SCR-059','SCR-061','SCR-062','SCR-065') }
$r1 | Select-Object screenId,nexerpRoute,
    @{n='cols';e={$_.tableColumns.Count}},
    @{n='inputs';e={$_.formInputs.Count}},
    @{n='cards';e={$_.cards.Count}},
    @{n='actions';e={$_.actions.Count}} |
  Export-Csv "artifacts\r1-spec-baseline.csv" -NoTypeInformation
```

Output audit disimpan ke:
```
artifacts/r1-spec-baseline.csv        # dari catalog (expected)
artifacts/r1-spec-actual.csv          # dari static-scan implementasi
artifacts/r1-spec-drift.md            # diff + keputusan per drift
```

### 2.3 Drift Register (per screen)

Format tabel yang harus diisi selama audit:

| SCR | Route | D1 cols | D2 inputs | D3 cards | D4 actions | D5 notes | Keputusan |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| SCR-023 | `/master/cost-allocation-setup` | ⬜ | ⬜ | ⬜ n/a | ⬜ | ⬜ | |
| SCR-024 | `/master/asset-register` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| … | … | | | | | | |

Legenda keputusan: `FIX` (perbaiki implementasi) · `ADR-OVERRIDE` (spec legacy sengaja dilanggar, butuh ADR) · `DEFER` (tunda ke slice pemilik) · `OK`.

### 2.4 Drift yang SUDAH TERDETEKSI (pra-audit, dari inspeksi repo)

Inspeksi cepat filesystem sudah memunculkan drift struktural besar:

**Backend** — `backend/src/modules/master/` hanya punya 5 sub-resource:
```
controllers/  categories | customers | materials | suppliers | warehouses
services/     categories | customers | materials | suppliers | warehouses
dto/          category | customer | material | warehouse
```
**Missing sepenuhnya (10 resource):** `coa`, `coa-auto` (auto-journal rules), `bank-account`, `tax-setup`, `asset-register`, `compliance-asset`, `cost-allocation`, `sales-category`, `sales-target`, `warehouse-access`. Role/user ada di module terpisah (`users`, `auth`) — perlu keputusan apakah SCR-046..049 di-serve dari `master` atau `users`.

**Frontend** — `frontend/src/app/(dashboard)/master/` hanya punya 7 folder:
```
categories | customers | goods | personnel | suppliers | vendors | warehouses
```
Bandingkan dengan route catalog: `cost-allocation-setup`, `asset-register`, `compliance-asset`, `goods-category-manage`, `goods-manage`, `coa-auto-manage`, `coa-manage`, `warehouse-access-manage`, `warehouse-manage`, `bank-account-manage`, `tax-setup`, `customer-category-manage`, `customer-manage`, `customer-my-manage`, `role-manage`, `user-manage`, `sales-category`, `sales-target`.

| Drift | Severity | Detail |
|---|---|---|
| **DR-001 Route naming drift total** | 🔴 P0 | FE memakai `goods`, `vendors`, `personnel`, `categories` — catalog memakai `goods-manage`, `supplier-manage` (di `/scm/`), `user-manage`+`role-manage`, `goods-category-manage`+`customer-category-manage`+`sales-category`+`supplier-category-manage`. Nyaris **tidak ada** route yang match. Butuh keputusan: rename FE ke catalog, atau ADR override + update catalog. |
| **DR-002 `/master/coa-manage` tidak ada** | 🔴 P0 | Konsisten dengan blocker verifier Sprint 4 yang sudah tercatat. CoA adalah fondasi 8 field akun di SCR-030 → blocking Mini-Sprint 4. |
| **DR-003 `vendors` vs `suppliers` duplikat FE** | 🟠 P1 | Dua folder FE untuk satu konsep catalog (`supplier-manage`). Salah satu harus dihapus. |
| **DR-004 SCR-047 tanpa permission picker** | 🟠 P1 | Catalog `formInputs` = 1 (`Nama*`). RBAC tidak enforceable. Butuh ADR override. |
| **DR-005 SCR-049 email opsional** | 🟠 P1 | Bentrok dengan login berbasis email. Butuh ADR `identifier = NIP ?? email`. |
| **DR-006 SCR-039 note "TIDAK PERLU DIKERJAKAN"** | 🟠 P1 | Bentrok dengan Mini-Sprint 2. Lihat §11 Q3. |
| **DR-007 SCR-029 17 actions termasuk 13 "Modal …"** | 🟡 P2 | 13 dari 17 action adalah artefak scraping modal detail (`Modal Hydro Marine Collagen`, `Modal gr`, dst) — bukan tombol nyata. Catalog perlu di-normalisasi, jangan diimplementasikan literal. |
| **DR-008 SCR-027 cols mismatch spec vs JSON** | 🟡 P2 | JSON: `cols=5`; Master Spec baris 217: `# \| Kode \| Kategori \| Deskripsi \| #` (=4 label + 1). Perlu reconcile JSON↔MD. |
| **DR-009 Kolom turunan tanpa sumber data** | 🟡 P2 | `Real Stok` & `Aging Barang` (SCR-029), `Accum. Depreciation`/`Book Value` (SCR-024), `Achievement`/`% Capaian` (SCR-052), `Current Book Balance` (SCR-037), `Real Stok Supplier` (SCR-056) — semuanya butuh transaksi yang out-of-scope R1. |
| **DR-010 Auth screens absen dari catalog** | 🟠 P1 | Lihat §1.3. |

---

## 3. Acceptance Test Plan untuk R1

### 3.1 Test Topology 🔶 PROVISIONAL
*(`03_TESTING_AND_QUALITY_GATES.md` belum eksis — topologi berikut direkonstruksi dari `test_pyramid :: Unit 70%+ core modul / Integration semua endpoint / E2E 10 flow kritis`)*

| Lapis | Target R1 | Tooling | Gate |
|---|---|---|---|
| L1 Unit | ≥70% coverage untuk **core primitives** (P1 Universal Code, P2 Audit Log, P7 RBAC, P10 soft-delete policy) | Jest | CI blocking |
| L2 Integration | **100% endpoint master** ter-cover (happy + 1 error path minimum) | Jest + Supertest + **real Postgres** (testcontainer / dedicated test DB) | CI blocking |
| L3 API Contract | setiap endpoint runtime ada di OpenAPI spec & sebaliknya (bidirectional) | `openapi-diff` + spec snapshot | CI blocking |
| L4 Component (FE) | setiap screen R1 punya component test dengan **MSW** — **TIDAK live API** | Vitest/Jest + Testing Library + MSW | CI blocking |
| L5 E2E Golden Thread | **GT-00** (Identity & Master Data) | Playwright | release gate |

### 3.2 Unit test wajib (primitives)

- [ ] **P1 Universal Code Engine**
  - [ ] format lengkap `DL-DIV-PRD-DDMMYYYY-0001` benar
  - [ ] format ringkas `PRD-DDMMYYYY-0001` benar
  - [ ] sequence **global, tidak reset** melintasi tanggal & divisi (test: generate lintas 3 tanggal berbeda, urutan tetap naik)
  - [ ] concurrency: 100 generate paralel → 0 duplikat (advisory lock / sequence DB)
  - [ ] asset prefix `DL-FIN-AST-` sesuai SCR-024
  - [ ] CoA auto-numbering by type: `1xxx` Asset, `2xxx` Liability, `3xxx` Equity, `4xxx` Revenue, `5xxx` Expense
- [ ] **P2 Audit Log**
  - [ ] create/update/deactivate menghasilkan entri dengan actor, before, after, timestamp
  - [ ] entri **immutable** (tidak ada endpoint update/delete)
  - [ ] `Riwayat` query mengembalikan urutan kronologis
- [ ] **P7 RBAC**
  - [ ] SCR-031 (`/master/coa-auto-manage`) hanya `Finance Admin` / `Finance Controller` → role lain 403
  - [ ] SCR-034 warehouse-scope: user hanya melihat gudang yang di-assign
  - [ ] permission matrix deny-by-default (tidak ada endpoint tanpa guard)
- [ ] **P10 Soft-delete policy**
  - [ ] CoA dengan transaksi → `DELETE` ditolak `409` + Problem Details, `deactivate` sukses
  - [ ] CoA tanpa transaksi → `DELETE` sukses

### 3.3 🔶 PROVISIONAL — Golden Thread **GT-00: Identity & Master Data**

*Definisi resmi GT-00 seharusnya ada di `03_TESTING_AND_QUALITY_GATES.md` §3 yang belum eksis. Berikut rekonstruksi berbasis scope R1 — WAJIB diganti dengan versi resmi.*

**Premis:** satu thread linear yang membuktikan sistem bisa di-bootstrap dari database kosong sampai siap menerima transaksi R2.

| Step | Aksi | Screen | Assert |
|---:|---|---|---|
| 1 | Login sebagai seed superadmin | `SCR-AUTH-001` | 200, token valid, audit `AUTH.LOGIN` |
| 2 | Buat Role `Finance Controller` + permission matrix | SCR-046/047 | role tersimpan, permission terpasang |
| 3 | Buat User `fin01` dengan role di step 2 | SCR-048/049 | user aktif, password ter-hash (bukan plaintext di DB) |
| 4 | Logout, login sebagai `fin01` | AUTH | 200, menu terbatas sesuai permission |
| 5 | Buat CoA hierarki minimum (Asset/Liability/Equity/Revenue/Expense) | SCR-032/033 | auto-numbering by type benar, `allowManualJournal=false` untuk AP/AR Control & WIP |
| 6 | Buat CoA Auto-Journal Rule ≥1 per Document Type | SCR-031 | tersimpan; user non-Finance dapat 403 |
| 7 | Buat Bank Account + mapping GL ke CoA step 5 | SCR-037/038 | FK ke CoA valid |
| 8 | Buat Tax Setup (jika Q3 = IN-SCOPE) | SCR-039 | rate & GL account tersimpan |
| 9 | Buat Gudang + assign Hak Akses Gudang ke `fin01` | SCR-035/036/034 | `fin01` hanya lihat gudang ter-assign |
| 10 | Buat Kategori Barang (8 field akun → CoA step 5) | SCR-027/028 | 8 FK COA tervalidasi |
| 11 | Buat Barang (inherit akun dari kategori, upload foto) | SCR-029/030 | kode universal global, file tersimpan, 8 akun terisi |
| 12 | Buat Kategori Supplier + Supplier | SCR-054–057 | vendor code global sequence, `pkpStatus` tersimpan |
| 13 | Buat Kategori Pelanggan + Pelanggan (segmentasi Sample/Produksi/Legalitas) | SCR-040–043 | customer code auto global, 5 cards render |
| 14 | Buat Kategori Penjualan + Target Penjualan | SCR-050–053 | target per marketing/tahun/bulan unik |
| 15 | Buat Asset Register (Mobil → useful life auto 8 th) | SCR-024/025 | default useful life auto-fill benar (Inventaris 4, Motor 4, Mobil 8, Bangunan 20) |
| 16 | Buat Compliance Asset dengan expiry H-45 | SCR-026 | masuk card "Mendekati Kadaluarsa (<90 Hari)", reminder H-90/60/30 ter-schedule |
| 17 | Buat Cost Allocation Rule | SCR-023 | tersimpan; `Run Allocation Test` disabled (out of scope) |
| 18 | Coba `DELETE` CoA yang direferensi Kategori Barang | SCR-032 | `409` + Problem Details; `deactivate` sukses |
| 19 | Buka 4 approval inbox | SCR-059/061/062/065 | render, `data: []`, `meta.total: 0`, tombol Setuju/Tolak disabled saat kosong |
| 20 | Verifikasi audit trail lengkap step 2–18 | Audit API | jumlah entri = jumlah mutasi, semua ber-actor |
| 21 | Verifikasi OpenAPI drift | CI | `openapi-diff` = 0 breaking, 0 undocumented endpoint |

**Kriteria lulus GT-00:** 21/21 step hijau, dijalankan terhadap **database kosong hasil `prisma migrate deploy`** (bukan DB dev yang sudah ter-seed manual), 3 kali berturut-turut tanpa flake.

### 3.4 Integration test per endpoint
Setiap resource master (14 resource) × minimum 6 kasus:
`list+pagination` · `list+search/filter` · `create valid` · `create invalid (422 Problem Details)` · `update` · `delete/deactivate (incl. referential integrity)` · `403 unauthorized`

Target: **14 resource × 7 = 98 integration test minimum.**

### 3.5 API contract test
- [ ] Setiap route runtime terdaftar di OpenAPI (`no undocumented endpoint`)
- [ ] Setiap path OpenAPI punya implementasi (`no phantom endpoint`)
- [ ] Semua response 2xx mematuhi `{ data, meta? }` — **no double-wrap**
- [ ] Semua response 4xx/5xx mematuhi RFC 7807 (`type`, `title`, `status`, `detail`, `instance`)
- [ ] Generated FE types = commit ter-track, dan `git diff --exit-code` bersih setelah regenerate

### 3.6 Frontend component test (MSW, no live API)
Per screen R1 (39 screen), minimum:
- [ ] render kolom tabel = `tableColumns` catalog (snapshot header)
- [ ] render cards = `cards` catalog, urutan selaras tab/filter (DNA §5)
- [ ] render actions = `actions` catalog (termasuk yang `disabled`)
- [ ] form: field required ditandai, submit invalid → error dari Problem Details ter-render
- [ ] loading / empty / error state (3 state wajib)
- [ ] search-select/autocomplete: debounce + hasil dari MSW handler

---

## 4. DoR Checklist (Definition of Ready) 🔶 PROVISIONAL

*Sumber resmi `00_MASTER_PLAN.md` §7 tidak ditemukan. Berikut rekonstruksi dari instruksi + praktik repo.*

- [ ] **DoR-1** Spec catalog drift diperbaiki — drift register §2.3 terisi 100% untuk 39 screen, tiap baris punya keputusan (`FIX`/`ADR-OVERRIDE`/`DEFER`/`OK`)
- [ ] **DoR-2** DR-001 … DR-010 (§2.4) punya keputusan tertulis, khususnya DR-001 (route naming) dan DR-002 (`/master/coa-manage`)
- [ ] **DoR-3** ADR foundational ber-status `Accepted` — minimal **ADR-003, ADR-005, ADR-007** *(⚠️ penomoran ADR belum bisa diverifikasi; tidak ada direktori ADR di repo — lihat §11 Q6)*
- [ ] **DoR-4** Setiap screen R1 punya **8 atribut** terdokumentasi:
  - [ ] actor (role yang boleh akses)
  - [ ] input (field + required/optional + validasi)
  - [ ] output (response shape)
  - [ ] action (tombol + efek + guard)
  - [ ] state (loading/empty/error/success)
  - [ ] error path (kode + Problem Details `type`)
  - [ ] DB owner (tabel + module pemilik tulis)
  - [ ] test plan (unit/integration/component/E2E mana yang cover)
- [ ] **DoR-5** Migration plan untuk schema baru disetujui:
  - [ ] `ChartOfAccount` (+ `parentId` hierarki, `normalBalance`, `allowManualJournal`, `isActive`)
  - [ ] `AutoJournalRule` (documentType, condition, debitAccountId, creditAccountId, isActive)
  - [ ] `BankAccount` (+ `glAccountId`, `currency`, `accountType`)
  - [ ] `TaxSetup` (taxCode, rate, glAccountId, status) — pending Q3
  - [ ] `AssetRegister` (+ `usefulLifeYears` default per kategori, `purchaseHistory[]`)
  - [ ] `ComplianceAsset` (certName, type, issueDate, expiryDate, cost, amortizationStatus)
  - [ ] `CostAllocationRule` (poolName, expenseAccountId, allocationBase, weight)
  - [ ] `SalesCategory`, `SalesTarget` (marketingUserId, year, month, targetAmount) — unique composite
  - [ ] `WarehouseAccess` (userId × warehouseId)
  - [ ] `Role` + `Permission` + `RolePermission` (matrix)
  - [ ] `AuditLog` (immutable, append-only)
  - [ ] `UniversalSequence` (global counter, tidak reset)
  - [ ] extension `Customer` (segmentasi Sample/Produksi/Legalitas, creditLimit, paymentTerm, contractType)
  - [ ] extension `Supplier` (kategoriBahan, kategoriCoaId, npwp, pkpStatus)
  - [ ] extension `Material`/`GoodsCategory` (8 akun COA)
- [ ] **DoR-6** Permission matrix untuk menu R1 disetujui (role × menu × action) — termasuk restriksi eksplisit SCR-031 (Finance Admin/Controller only)
- [ ] **DoR-7** Test DB & migration rehearsal environment tersedia (`prisma migrate deploy` di DB kosong sukses)
- [ ] **DoR-8** `00_MASTER_PLAN.md` + `03_TESTING_AND_QUALITY_GATES.md` ditulis, dan §4/§5/§6/§3.3 dokumen ini direkonsiliasi dengannya
- [ ] **DoR-9** DNA compliance plan untuk affected routes — lihat [STRICT_POLICIES_ADDENDUM.md](./STRICT_POLICIES_ADDENDUM.md) **BAGIAN A** (audit pelanggaran + migration order 12 component family)
- [ ] **DoR-10** Commit strategy terdefinisi (berapa atomic commit, conventional message per slice) — lihat [STRICT_POLICIES_ADDENDUM.md](./STRICT_POLICIES_ADDENDUM.md) **BAGIAN B** (atomic rules, scope kecil, reversible)

---

## 5. DoD Checklist (Definition of Done) 🔶 PROVISIONAL

*Instruksi menyebut "12 butir DoD" di `00_MASTER_PLAN.md` §8. File tidak ada. 12 butir berikut adalah rekonstruksi — **wajib diganti** dengan daftar resmi.*

| # | Butir DoD | Status |
|---:|---|:---:|
| 1 | Semua 39 screen R1 ter-implementasi & route sesuai keputusan DR-001 | ⬜ |
| 2 | Drift register §2.3 = 0 baris berstatus `FIX` terbuka | ⬜ |
| 3 | Unit coverage core primitives ≥ 70% | ⬜ |
| 4 | Integration test 100% endpoint master lulus (≥98 test) | ⬜ |
| 5 | Golden Thread **GT-00** lulus 21/21, 3× tanpa flake, di DB kosong | ⬜ |
| 6 | API contract test lulus — **OpenAPI drift = 0** (bidirectional) | ⬜ |
| 7 | Frontend component test (MSW) lulus untuk 39 screen | ⬜ |
| 8 | FE memakai **generated types** — grep manual interface API = 0 hit | ⬜ |
| 9 | **Real DB-backed, no mock** — 0 hardcoded/dummy data di path produksi | ⬜ |
| 10 | Tidak ada **P0/P1 terbuka** di slice | ⬜ |
| 11 | Migration reversible & rehearsed (apply + rollback drill sukses) | ⬜ |
| 12 | Audit log ter-populate untuk semua mutasi master; RBAC deny-by-default terverifikasi (0 endpoint tanpa guard) | ⬜ |
| 13 | **DNA compliance scan hijau** untuk screen R1 yang disentuh (ESLint `no-raw-ui-import-on-operational` severity = `warn` di R1, transisi ke `error` post-R1). Lihat [STRICT_POLICIES_ADDENDUM.md](./STRICT_POLICIES_ADDENDUM.md) **BAGIAN A.4** + **BAGIAN G** (severity escalation timeline) | ⬜ |
| 14 | **Commit history bersih** — atomic + conventional commits compliant untuk seluruh R1. Tidak boleh campur `fix` + `refactor` + `feat` dalam 1 commit. Lihat [STRICT_POLICIES_ADDENDUM.md](./STRICT_POLICIES_ADDENDUM.md) **BAGIAN B.3** (atomic rules) | ⬜ |

**Butir eksplisit dari instruksi (tercakup di atas):**
- [x] 12 butir DoD dipenuhi → tabel di atas
- [x] Tidak ada P0/P1 terbuka → #10
- [x] Golden Thread GT-00 lulus → #5
- [x] OpenAPI sync ke frontend (zero drift) → #6, #8
- [x] Real DB-backed, no mock → #9

**Verifikasi otomatis yang harus hijau:**
```powershell
# backend
cd backend; npm run lint; npm run test; npm run test:e2e
# frontend
cd frontend; npm run lint; npm run typecheck; npm run test
# contract
npm run openapi:generate; git diff --exit-code -- frontend/src/types/api
```
> ⚠️ Nama script di atas **belum diverifikasi** terhadap `package.json` backend/frontend. Konfirmasi sebelum dipakai sebagai gate.

---

## 6. Go/No-Go Gates untuk Promote ke R2 🔶 PROVISIONAL

*Instruksi menyebut "11 kondisi NO-GO check dari `00_MASTER_PLAN.md` §9". File tidak ada. 11 kondisi berikut adalah rekonstruksi.*

Semua 11 harus **🟢 hijau**. Satu saja 🔴 = **NO-GO**, R2 tidak boleh dimulai.

| # | Kondisi NO-GO | Cara verifikasi | Status |
|---:|---|---|:---:|
| 1 | GT-00 gagal / flaky | Playwright 3 run berturut | ⬜ |
| 2 | OpenAPI drift ≠ 0 | `openapi-diff` di CI | ⬜ |
| 3 | Ada endpoint tanpa RBAC guard | static scan decorator coverage | ⬜ |
| 4 | Universal Code Engine menghasilkan duplikat / reset sequence | concurrency test 100 paralel | ⬜ |
| 5 | Migration tidak reversible / rollback drill gagal | rehearsal di DB clone | ⬜ |
| 6 | Ada mock/dummy data di path produksi | grep + manual review | ⬜ |
| 7 | P0/P1 terbuka | issue tracker | ⬜ |
| 8 | Coverage core primitives < 70% | coverage report | ⬜ |
| 9 | Integration coverage endpoint < 100% | endpoint↔test mapping report | ⬜ |
| 10 | CoA + Auto-Journal Rule belum punya ≥1 rule aktif per Document Type | data check (prasyarat mutlak R2 posting otomatis, SCR-031 note) | ⬜ |
| 11 | Audit log tidak lengkap / mutable | audit completeness test + absence of update/delete endpoint | ⬜ |
| 12 | **Pre-commit hook (Husky + lint-staged) tidak aktif atau commitlint gagal validate** | `npx husky` + `commitlint --edit` di local + CI check | ⬜ |
| 13 | **CI scan menemukan raw-UI-import di operational route tanpa `// dna-allow-legacy` justify** | ESLint `no-raw-ui-import-on-operational` di CI per-PR | ⬜ |

**Gate tambahan yang direkomendasikan (bukan bagian dari 11 asli):**
- [ ] Supplier master (SCR-054–057) selesai — **prasyarat keras R2 P2P**
- [ ] Warehouse + Warehouse Access selesai — prasyarat R4 Plan-to-Stock
- [ ] Approval engine + audit `Riwayat` reusable — prasyarat R2 3-Tier Approval

---

## 7. Implementation Order (per-divisi murni, bagian kecil)

### 7.1 Hari 1–3: Backend Primitives (blocking, tidak bisa diparalelkan)

| Hari | Deliverable | Primitive |
|---|---|---|
| 1 | Response envelope + Error contract + OpenAPI bootstrap + typesync pipeline | P4, P5, P6 |
| 2 | Universal Code Engine (+ concurrency test) + Audit Log service | P1, P2 |
| 3 | RBAC guard + permission matrix + Idempotency interceptor + File upload + Search-select base + soft-delete policy | P3, P7, P8, P9, P10 |

**Exit gate hari 3:** unit test primitives hijau, OpenAPI ter-generate, FE types ter-sync, 1 endpoint contoh end-to-end lulus.

### 7.2 Hari 4–7: Mini-Sprint per Divisi

Urutan **wajib** karena dependency FK. CoA harus pertama — 8 field akun di Kategori/Barang, GL mapping Bank, GL account Tax, dan akun biaya Cost Allocation semuanya menunjuk ke CoA.

| MS | Nama | Screens | Resource baru | Depends on | Est. |
|---:|---|---|---|---|---:|
| **MS-1** | CoA + Auto-Journal Rules — *Finance foundation* | SCR-031, 032, 033 | `ChartOfAccount`, `AutoJournalRule` | primitives | 0.75 hari |
| **MS-2** | Gudang + Bank Account + Tax | SCR-034, 035, 036, 037, 038, 039 | `Warehouse`(ext), `WarehouseAccess`, `BankAccount`, `TaxSetup` | MS-1 (GL mapping) | 0.75 hari |
| **MS-3** | Pelanggan + Supplier | SCR-040–045, SCR-054–057 | `CustomerCategory`, `Customer`(ext), `SupplierCategory`, `Supplier`(ext) | MS-1 (kategori COA vendor) | 1 hari |
| **MS-4** | Barang + Kategori Barang | SCR-027, 028, 029, 030 | `GoodsCategory`(ext 8 akun), `Material`(ext) | MS-1 (8 FK COA), MS-3 (supplier asal) | 0.75 hari |
| **MS-5** | Master Sales | SCR-050, 051, 052, 053 | `SalesCategory`, `SalesTarget` | MS-8 (marketing = user) | 0.5 hari |
| **MS-6** | Asset + Compliance Asset | SCR-024, 025, 026 | `AssetRegister`, `AssetPurchaseHistory`, `ComplianceAsset` | MS-1 (akun aset/akumulasi) | 0.75 hari |
| **MS-7** | Cost Allocation | SCR-023 | `CostAllocationRule` | MS-1 (akun biaya) | 0.25 hari |
| **MS-8** | User + Role + Hak Akses + Auth | SCR-046, 047, 048, 049 + `SCR-AUTH-001..004` | `Role`, `Permission`, `RolePermission`, `User`(ext), session | primitives (P7) | 1 hari |
| **MS-9** | Approval List screens | SCR-059, 061, 062, 065 | `ApprovalRequest` (generic), `ApprovalHistory` | MS-8 (actor/role), P2 (audit) | 0.75 hari |

> ⚠️ **Konflik urutan:** instruksi menaruh MS-8 (User/Role) di posisi ke-8, tapi MS-5 (`Target Penjualan` → field `Marketing *` = user) dan MS-9 (approval → actor) **bergantung** pada MS-8. Selain itu RBAC (P7) di hari 3 sudah butuh model `Role`/`Permission`. **Rekomendasi: pindahkan MS-8 menjadi MS-1a (dieksekusi bersama primitives hari 3)**, sehingga urutan eksekusi jadi:
> `MS-8 → MS-1 → MS-2 → MS-3 → MS-4 → MS-6 → MS-7 → MS-5 → MS-9`
> Lihat §11 Q4.

Total estimasi MS: **6.5 hari** — melebihi window "Hari 4–7" (4 hari) untuk 1 engineer. Realistis: **hari 4–10** untuk 1 engineer, atau hari 4–7 untuk 2 engineer paralel.

### 7.3 Hari 8–10: Frontend Integration per Screen
- TanStack Query hooks per resource (`useList`, `useDetail`, `useCreate`, `useUpdate`, `useDeactivate`)
- **Wajib** pakai generated types dari typesync (P6) — no manual interface
- Per screen: table (kolom = catalog), cards (urutan selaras tab/filter), form (required marker), 3 state (loading/empty/error)
- Search-select component reusable untuk semua field relasi (COA, Supplier, Customer, Material)
- Route rename sesuai keputusan DR-001

### 7.4 Hari 11–14: Testing + Reconciliation
| Hari | Fokus |
|---|---|
| 11 | Integration test 14 resource (98 test) |
| 12 | Component test MSW 39 screen |
| 13 | Golden Thread GT-00 (Playwright) + fix |
| 14 | Reconciliation check: drift register re-run, OpenAPI diff, coverage report, P0/P1 sweep |

### 7.5 Hari 14–15: Release Preparation
- [ ] Release manifest (`artifacts/r1-release-manifest.json`: commit SHA, migration list, screen list, test report)
- [ ] Migration rehearsal di clone DB produksi (`prisma migrate deploy`)
- [ ] Rollback plan tertulis + rollback drill dieksekusi
- [ ] Tag: `git tag r1-master-access-<YYYY-MM-DD>`
- [ ] Go/No-Go review §6 (11 kondisi)

---

## 8. Risk Register untuk R1

| ID | Risiko | Likelihood | Impact | Mitigasi | Owner |
|---|---|---|---|---|---|
| **RSK-01** | Drift screen vs JSON catalog — **sudah terkonfirmasi parah** (DR-001: nyaris semua route FE tidak match; hanya 7 folder FE vs 18 route catalog; 5 resource BE vs 14 dibutuhkan) | 🔴 Terjadi | 🔴 High | Spec-conformity audit §2 dijalankan **sebelum** coding; drift register jadi DoR-1 gate; harness CSV `artifacts/r1-spec-baseline.csv` sebagai baseline yang dapat di-diff ulang | Tech Lead |
| **RSK-02** | Backend primitive baru merusak modul existing (33 module sudah ada di `backend/src/modules/`) | 🟠 Medium | 🔴 High | Feature flag per primitive; parallel endpoint `/v1` baru vs legacy; dual-write window untuk audit log; smoke test modul existing di CI | BE Lead |
| **RSK-03** | Migration script korup / data loss (banyak `ext` ke tabel existing: Customer, Supplier, Material, Warehouse, User) | 🟠 Medium | 🔴 Critical | Backup pre-migration wajib; restore drill; immutable migration (`prisma migrate dev` di dev, `deploy` di prod, **no `db push`**); additive-only untuk kolom baru (nullable dulu, backfill, baru NOT NULL) | BE Lead |
| **RSK-04** | OpenAPI drift FE↔BE | 🟠 Medium | 🟠 Medium | CI `openapi-diff` blocking; auto-generated types **wajib** dipakai (grep gate: 0 manual API interface); `git diff --exit-code` setelah regenerate | Full-stack |
| **RSK-05** | Universal Code Engine sequence collision / reset tak sengaja | 🟡 Low | 🔴 Critical | DB sequence / advisory lock (bukan `MAX(id)+1`); concurrency test 100 paralel di CI; sequence table terpisah & tidak pernah di-truncate | BE Lead |
| **RSK-06** | 4 approval screen tidak bisa di-accept karena dokumen sumber out-of-scope | 🔴 Terjadi | 🟠 Medium | Redefinisi acceptance jadi "shell + engine + kontrak + empty state"; approval fungsional penuh di-defer ke slice pemilik dokumen | PO |
| **RSK-07** | Kolom turunan (Real Stok, Aging, Book Value, Achievement, Current Balance) tidak punya sumber data di R1 | 🔴 Terjadi | 🟡 Low | Render kolom dengan placeholder `—` + flag `pendingSlice`; component test assert placeholder, bukan angka; dicatat di drift register sebagai `DEFER` | FE Lead |
| **RSK-08** | Konflik spec Tax Setup (`Poin 35: TIDAK PERLU DIKERJAKAN`) menyebabkan rework | 🟠 Medium | 🟡 Low | Selesaikan Q3 sebelum MS-2 dimulai | PO |
| **RSK-09** | SCR-047 tanpa permission picker → RBAC tidak enforceable, ditemukan terlambat | 🟠 Medium | 🔴 High | ADR override ditulis di DoR-3; permission matrix design jadi artefak DoR-6 | Tech Lead |
| **RSK-10** | Timeline underestimate: total MS = 6.5 hari vs window 4 hari | 🔴 Terjadi | 🟠 Medium | Re-baseline ke 15 hari (1 eng) / 10 hari (2 eng); §0.4 sudah dikoreksi | PO |
| **RSK-11** | Dokumen referensi (`00_MASTER_PLAN.md`, `03_TESTING_AND_QUALITY_GATES.md`) tidak ada → gate R1 tidak berdasar | 🔴 Terjadi | 🔴 High | DoR-8; semua butir `🔶 PROVISIONAL` diblokir sampai rekonsiliasi | Tech Lead |

---

## 9. Definition of Status

State machine pelacakan **per screen** dan **per Mini-Sprint**:

```
DISCOVERY ──► DESIGNED ──► IMPLEMENTING ──► VERIFYING ──► READY_FOR_UAT ──► READY_FOR_RELEASE ──► RELEASED
     │            │             │               │              │                    │
     └────────────┴─────────────┴───────────────┴──────────────┴────────────────────┴──► BLOCKED
                                                                                          │
                                                                         (kembali ke state asal setelah unblock)
```

| Status | Emoji | Kriteria masuk | Kriteria keluar |
|---|:---:|---|---|
| `DISCOVERY` | 🔍 | screen teridentifikasi di catalog | 8 atribut DoR-4 terisi |
| `DESIGNED` | 📐 | 8 atribut DoR-4 lengkap + drift decision ada + migration plan ada | kode mulai ditulis |
| `IMPLEMENTING` | 🔨 | BE endpoint + FE screen sedang dibangun | endpoint + screen selesai, self-test lokal lulus |
| `VERIFYING` | 🧪 | unit + integration + component test ditulis & dijalankan | semua lapis test hijau, drift = OK |
| `READY_FOR_UAT` | 👀 | test hijau, deployed ke staging, real DB-backed | UAT sign-off |
| `READY_FOR_RELEASE` | 📦 | UAT sign-off + DoD 12 butir hijau + manifest siap | Go/No-Go §6 = 11 hijau |
| `RELEASED` | ✅ | tag dibuat, deployed ke prod, rollback plan aktif | — |
| `BLOCKED` | 🚧 | dependency/keputusan/defect menghalangi | blocker resolved |

### 9.1 Status Board Awal (per Mini-Sprint)

| MS | Nama | Status | Blocker |
|---:|---|:---:|---|
| MS-8 | User + Role + Auth | 🚧 `BLOCKED` | DR-004 (permission picker), DR-005 (email opsional), Q6 (ADR) |
| MS-1 | CoA + Auto-Journal | 🚧 `BLOCKED` | DR-002 (`/master/coa-manage` tidak ada), DoR-3 |
| MS-2 | Gudang + Bank + Tax | 🚧 `BLOCKED` | Q3 (konflik scope Tax), DR-001 |
| MS-3 | Pelanggan + Supplier | 🚧 `BLOCKED` | Q2 (ownership supplier MOD-04), DR-003 (`vendors` vs `suppliers`) |
| MS-4 | Barang + Kategori | 🚧 `BLOCKED` | MS-1, DR-007, DR-008 |
| MS-5 | Master Sales | 🔍 `DISCOVERY` | MS-8 |
| MS-6 | Asset + Compliance | 🔍 `DISCOVERY` | MS-1 |
| MS-7 | Cost Allocation | 🔍 `DISCOVERY` | MS-1, Q5 (`Run Allocation Test`) |
| MS-9 | Approval Lists | 🚧 `BLOCKED` | Q4 (acceptance redefinition), MS-8 |
| P1–P10 | Backend Primitives | 📐 `DESIGNED` | Q6 (ADR belum ada) |

---

## 10. Traceability Matrix (ringkas)

| Screen R1 | Resource BE | Route FE (catalog) | Ada di BE hari ini? | Ada di FE hari ini? | MS |
|---|---|---|:---:|:---:|:---:|
| SCR-023 | `cost-allocation` | `/master/cost-allocation-setup` | ❌ | ❌ | MS-7 |
| SCR-024/025 | `asset-register` | `/master/asset-register` | ❌ | ❌ | MS-6 |
| SCR-026 | `compliance-asset` | `/master/compliance-asset` | ❌ | ❌ | MS-6 |
| SCR-027/028 | `goods-category` | `/master/goods-category-manage` | 🟡 `categories` | 🟡 `categories` | MS-4 |
| SCR-029/030 | `goods` | `/master/goods-manage` | 🟡 `materials` | 🟡 `goods` | MS-4 |
| SCR-031 | `coa-auto` | `/master/coa-auto-manage` | ❌ | ❌ | MS-1 |
| SCR-032/033 | `coa` | `/master/coa-manage` | ❌ | ❌ | MS-1 |
| SCR-034 | `warehouse-access` | `/master/warehouse-access-manage` | ❌ | ❌ | MS-2 |
| SCR-035/036 | `warehouse` | `/master/warehouse-manage` | ✅ | 🟡 `warehouses` | MS-2 |
| SCR-037/038 | `bank-account` | `/master/bank-account-manage` | ❌ | ❌ | MS-2 |
| SCR-039 | `tax-setup` | `/master/tax-setup` | ❌ | ❌ | MS-2 |
| SCR-040/041 | `customer-category` | `/master/customer-category-manage` | 🟡 `categories` | 🟡 `categories` | MS-3 |
| SCR-042/043 | `customer` | `/master/customer-manage` | ✅ | 🟡 `customers` | MS-3 |
| SCR-044/045 | `customer-my` | `/master/customer-my-manage` | ❌ | ❌ | MS-3 |
| SCR-046/047 | `role` | `/master/role-manage` | 🟡 `users`/`auth` | 🟡 `personnel` | MS-8 |
| SCR-048/049 | `user` | `/master/user-manage` | 🟡 `users` | 🟡 `personnel` | MS-8 |
| SCR-050/051 | `sales-category` | `/master/sales-category` | ❌ | ❌ | MS-5 |
| SCR-052/053 | `sales-target` | `/master/sales-target` | ❌ | ❌ | MS-5 |
| SCR-054/055 | `supplier-category` | `/scm/supplier-category-manage` | ❌ | ❌ | MS-3 |
| SCR-056/057 | `supplier` | `/scm/supplier-manage` | ✅ | 🟡 `suppliers`+`vendors` | MS-3 |
| SCR-059 | `approval/sales` | `/master/sales-approval` | ❌ | ❌ | MS-9 |
| SCR-061 | `approval/goods-request` | `/master/goods-request-approval` | ❌ | ❌ | MS-9 |
| SCR-062 | `approval/request-cogs` | `/master/request-cogs-approval` | ❌ | ❌ | MS-9 |
| SCR-065 | `approval/sales-return` | `/master/sales-return-approval` | ❌ | ❌ | MS-9 |
| SCR-AUTH-001..004 | `auth` | `/login`, `/profile` | 🟡 `auth` | ❓ | MS-8 |

Legenda: ✅ ada & namanya cocok · 🟡 ada tapi nama/route drift (butuh reconcile) · ❌ belum ada · ❓ belum diverifikasi

**Ringkas:** dari 14 resource master yang dibutuhkan R1, **hanya 5** ada di `backend/src/modules/master/` (categories, customers, materials, suppliers, warehouses) — **9 resource harus dibangun dari nol**, dan 5 yang ada pun ber-nama drift.

---

## 11. 🔴 AREA YANG BUTUH KEPUTUSAN USER (BLOCKING DoR)

| Q | Pertanyaan | Opsi | Dampak jika tidak dijawab |
|---:|---|---|---|
| **Q1** | Scope R1: **39 layar** (area `Master` 35 + 4 approval MOD-01) atau **107 layar** (seluruh MOD-01, termasuk Operasional>Akuntansi seperti Jurnal Umum, Bank Reconciliation, Depreciation, Client Escrow)? | (a) 39 layar — konsisten dengan "out of scope: transaksi apapun" ✅ *rekomendasi* · (b) 107 layar — kontradiksi dengan §0.3, akan jadi 6–8 minggu | Estimasi, DoD, GT-00 semuanya tidak valid |
| **Q2** | Supplier master (SCR-054–057, `moduleId=MOD-04`, route `/scm/*`) masuk R1 atau R2? | (a) R1, route tetap `/scm/*`, owner MOD-04 ✅ *rekomendasi* · (b) defer ke R2 → R2 P2P harus bangun supplier dulu | MS-3 tidak bisa direncanakan; Go/No-Go gate supplier ambigu |
| **Q3** | Tax Setup (SCR-039) — catalog note eksplisit *"Poin 35: Modul Pajak dan e-Faktur TIDAK PERLU DIKERJAKAN"*, tapi instruksi memasukkannya ke MS-2 | (a) build **hanya master tarif** (Tax Code/Rate/GL Account/Status) tanpa e-Faktur ✅ *rekomendasi* · (b) skip total, hapus SCR-039 dari R1 · (c) build penuh (kontradiksi arahan final) | MS-2 & GT-00 step 8 & migration `TaxSetup` menggantung |
| **Q4** | 4 approval screen (SCR-059/061/062/065) — dokumen sumbernya out-of-scope R1. Acceptance-nya apa? | (a) shell + approval engine + kontrak + audit `Riwayat` + empty state ✅ *rekomendasi* · (b) defer semuanya ke slice pemilik dokumen · (c) build + seed dokumen dummy (bentrok DoD #9 "no mock") | MS-9 tidak punya definisi selesai; RSK-06 tidak termitigasi |
| **Q5** | Action transaksional di screen master (`Run Allocation Test` SCR-023, `Run Amortization` SCR-026, `Transfer Lokasi`/`Dispose Aset` SCR-024) | (a) render `disabled` + tooltip "Tersedia di R5" ✅ *rekomendasi, jaga spec conformity* · (b) hilangkan (drift D4) · (c) implementasikan (scope creep ke R5) | Drift register D4 untuk 3 screen tidak bisa ditutup |
| **Q6** | **Penomoran ADR** — DoR menyebut "ADR 007, 003, 005" dan "7 dari 12 ADR foundational", tapi **tidak ada direktori/register ADR di repo**. ADR mana yang dimaksud? | perlu: (i) lokasi register ADR, (ii) daftar 12 ADR foundational + judulnya, (iii) mapping 003/005/007 | DoR-3 dan dependency §0.5 tidak bisa dicek — **hard blocker** |
| **Q7** | Route naming (DR-001): FE existing `goods`/`vendors`/`personnel`/`categories` vs catalog `goods-manage`/`supplier-manage`/`user-manage`+`role-manage`/`*-category-manage` | (a) rename FE ke catalog (catalog = sumber kebenaran) ✅ *rekomendasi* · (b) ADR override + update catalog ke nama FE · (c) alias/redirect dua-duanya | ~18 route FE menggantung; MS-1..MS-9 tidak bisa mulai coding |
| **Q8** | Timeline: instruksi menulis "2–3 minggu (1 eng)" tapi breakdown Hari 1–15 dengan MS total 6.5 hari > window 4 hari | (a) re-baseline 15 hari (1 eng) / 10 hari (2 eng) ✅ *rekomendasi* · (b) kurangi scope (drop MS-6/MS-7 ke R5) | Komitmen tanggal tidak realistis |
| **Q9** | SCR-047 (Buat Hak Akses) hanya 1 input `Nama*`, tanpa permission picker. RBAC tidak enforceable dari UI | (a) extend dengan permission matrix tree + ADR override ✅ *rekomendasi* · (b) permission di-seed via migration saja (tidak bisa dikelola admin) | DoD #12 (RBAC deny-by-default terverifikasi) tidak bisa dicapai |
| **Q10** | SCR-049 menandai Email & Kode/NIP keduanya **opsional** — bentrok dengan login | (a) ADR `identifier = NIP ?? email`, minimal satu wajib & unik ✅ *rekomendasi* · (b) email jadi wajib (override spec legacy) | Auth surface (SCR-AUTH-001) tidak bisa didesain |

---

## 12. Lampiran: Perintah Verifikasi

```powershell
# 1) Re-generate baseline catalog untuk 39 screen R1
$j = Get-Content "docs\legacy-erp\NEX_ERP_SCREEN_AND_API_CATALOG.json" -Raw | ConvertFrom-Json
$j.screens | Where-Object { $_.area -eq 'Master' } | Measure-Object            # harus 35
$j.screens | Where-Object { $_.moduleId -eq 'MOD-01' } | Measure-Object        # harus 107

# 2) Inventaris resource backend master saat ini
Get-ChildItem "backend\src\modules\master" -Recurse -File | Select-Object -ExpandProperty Name

# 3) Inventaris route frontend master saat ini
Get-ChildItem "frontend\src\app\(dashboard)\master" -Directory | Select-Object -ExpandProperty Name

# 4) Cek keberadaan dokumen referensi wajib
Test-Path "docs\legacy-erp\backend\00_MASTER_PLAN.md"
Test-Path "docs\legacy-erp\backend\03_TESTING_AND_QUALITY_GATES.md"

# 5) Dev servers
cd backend;  npm run start:dev
cd frontend; npm run dev -- --port 3003 --host
```

---

**Sign-off yang dibutuhkan sebelum status dokumen naik dari 🟡 `DESIGNED` ke 📐 ready-to-implement:**

- [ ] PO menjawab Q1–Q5, Q8
- [ ] Tech Lead menjawab Q6, Q7, Q9, Q10
- [ ] `00_MASTER_PLAN.md` + `03_TESTING_AND_QUALITY_GATES.md` ditulis; §3.3/§4/§5/§6 direkonsiliasi (hapus semua marker 🔶 `PROVISIONAL`)
- [ ] Drift register §2.3 terisi 100% untuk 39 screen
