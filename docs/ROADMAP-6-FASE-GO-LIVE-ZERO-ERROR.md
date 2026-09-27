# ROADMAP 6 FASE MENUJU 100% SIAP OPERASIONAL (ZERO FATAL ERROR)

**Target Sistem**: ERP Manufaktur & Trading (NEX ERP)  
**Tujuan Dokumen**: Single Source of Truth (SSOT) teknis pelaksanaan pemulihan dan penuntasan sistem hingga 100% siap operasional klien tanpa risiko kegagalan bisnis.  
**Aturan Utama**: Dilarang melompat ke fase berikutnya jika gerbang verifikasi fase berjalan belum bernilai **100% PASS (Exit Code 0)**.

---

## Ringkasan Eksekutif & Realitas Codebase (Audit 2026-09-23)
* **Klaim Lama**: 19 Fase Selesai.
* **Fakta Lapangan**: P09–P19 dibatalkan (11/11 FAIL). Build frontend halted dengan 89+ error `tsc`. Foreign key database patah (`P2003`). 90% halaman UI (245+ file) masih memakai mock/dummy data dan tidak terkoneksi ke backend NestJS.
* **Total Durasi Realistis**: 8 – 12 Minggu pengerjaan terstruktur.

---

## FASE 1: Pembersihan Bangkai & Stabilisasi Build

### 1.1 Deskripsi Pekerjaan
Membersihkan seluruh error kompilasi, tipe data, dependensi komponen, dan foreign key yang menyebabkan build pipeline gagal total.

1. **Frontend Type-Check & Component Fixes**:
   * Selesaikan 89–91 error TypeScript pada `tsc --noEmit`.
   * Perbaiki missing import dan komponen hilang: `DnaBadge`, `DnaCell`, dan layout wrapper pada halaman-halaman yang crash (misal: `penjualan/bayar-penjualan`, halaman HR).
   * Pastikan `npm run build` di folder `frontend/` sukses membuat standalone build tanpa peringatan fatal.
2. **Backend & Prisma Foreign Key Fixes**:
   * Perbaiki bug `P2003` di `backend/src/modules/production/production.service.ts:2877` (`qc_audits_stepLogId_fkey` mencoba menulis log ID yang tidak dibuat).
   * Perbaiki bug `P2003` di modul QC (`finished_goods_woId_fkey` saat pelepasan barang karantina).
3. **Penyusunan Kontrak Penerimaan**:
   * Buat `_FROZEN_ACCEPTANCE_CONTRACT.md` resmi untuk P09 (Sales & AR) dan P19 (DNA Migration & UI).

### 1.2 Parameter & Kriteria Sukses
* `tsc --noEmit` di backend: **0 error**.
* `tsc --noEmit` di frontend: **0 error**.
* `npm run build` di frontend: **Berhasil (Exit Code 0)**.
* Prisma schema validation: sinkron dengan database (`npx prisma validate` & `prisma db push --dry-run`).

### 1.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Test Command**:
  ```bash
  cd frontend && npm run build
  cd ../backend && npm run build
  npm run test:p09:golden-thread
  npm run test:p13
  npm run test:p14
  ```
* **Kriteria Lolos Fase 1**: Seluruh batch certifier `verify:p09` sampai `verify:p19` exit code `0`. Laporan QA Gate ditulis di `docs/qa-gate/YYYY-MM-DD-fase1-build-stabilization.md`.

---

## FASE 2: Eliminasi Mock & Plumbing Frontend-Backend

### 2.1 Deskripsi Pekerjaan
Menghubungkan antarmuka pengguna ke controller NestJS dan database nyata, menghapus ilusi tampilan statis.

1. **Pembersihan Mock Data**:
   * Hapus seluruh data statis (`mockData`, `MOCK_*`, array fiktif di `useState`) dari 245 file di `frontend/src/app/(dashboard)`.
   * Ganti dengan integration layer riil (`apiClient` / TanStack React Query).
2. **Wiring Mutasi Data (CUD Operations)**:
   * Form pembuatan, pengeditan, dan penghapusan (Sales Order, Purchase Order, Pengeluaran Gudang, SPK Produksi, Jurnal Akuntansi) harus memanggil REST endpoint backend dengan error handling standar (toast error, validasi input Zod/DTO).
3. **Penyelesaian Rute & Navigasi**:
   * Hubungkan 153 orphan screen yang belum terdaftar di navigasi sidebar atau buat sub-route terstruktur.
   * Pastikan hak akses (RBAC) diterapkan di setiap rute frontend.

### 2.2 Parameter & Kriteria Sukses
* Script scanner `frontend/scripts/devils-advocate-audit.mjs` mencatat:
  * Raw mock files: **0**.
  * Fake DNA adoption: **0**.
* Tidak ada form yang mengembalikan alert dummy atau hanya manipulasi state lokal tanpa HTTP request.

### 2.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Test Command**:
  ```bash
  node frontend/scripts/devils-advocate-audit.mjs
  # Verifikasi E2E form mutation di setiap modul utama via Playwright/Vitest
  npm run test:e2e:crud-all
  ```
* **Kriteria Lolos Fase 2**: Payload masuk ke PostgreSQL, tabel UI menampilkan data dari database, filter dan paginasi berfungsi via query params backend.

---

## FASE 3: Financial Engine & Multi-Tenant Lock

### 3.1 Deskripsi Pekerjaan
Menjamin integritas moneter, kebenaran pembukuan akuntansi otomatis, dan isolasi keamanan data perusahaan.

1. **Auto-Journal Engine 9-Trigger**:
   * Hubungkan seluruh event operasional ke Buku Besar (General Ledger):
     1. Penjualan (Piutang AR & Pengakuan Pendapatan).
     2. Penerimaan Pembayaran / Kas Masuk.
     3. Pembelian / Goods Received Note (Hutang AP Belum Difakturkan).
     4. Tagihan Vendor (AP Final).
     5. Pembayaran Kas Keluar.
     6. Pengeluaran Bahan Baku Produksi (WIP Transfer).
     7. Penyelesaian Barang Jadi (WIP ke Finished Goods).
     8. Scrap / Waste / Penyesuaian Stok Opname.
     9. Beban Pokok Penjualan (COGS / HPP) saat Delivery Order.
2. **Multi-Tenant Security Hardening**:
   * Tambahkan kolom `organizationId` pada seluruh tabel P08 (Sample, R&D, Formulasi, Legalitas) dan tabel transaksi terkait.
   * Aktifkan tenant filter otomatis pada NestJS Prisma Interceptor agar data antar entitas/organisasi tidak bocor.

### 3.2 Parameter & Kriteria Sukses
* Seluruh transaksi operasional menghasilkan entri debit-kredit seimbang (*balanced entry*).
* Trial Balance (Neraca Saldo), Laba Rugi, dan Neraca terisi otomatis secara real-time.
* Permintaan API lintas tenant menghasilkan HTTP 403 Forbidden.

### 3.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Test Command**:
  ```bash
  cd backend && npm run test:accounting:auto-journal
  npm run test:security:tenant-isolation
  ```
* **Kriteria Lolos Fase 3**: `Sum(Debit) - Sum(Credit) == 0` pada seluruh transaksi uji coba. Tidak ada transaksi yang tertinggal tanpa jurnal.

---

## FASE 4: Fase P20 — End-to-End Golden Thread & Concurrency

### 4.1 Deskripsi Pekerjaan
Menguji sistem secara utuh dari hulu ke hilir dalam kondisi operasional terberat.

1. **Simulasi Golden Thread (Full Lifecycle)**:
   * Eksekusi alur tunggal tanpa jeda:
     `CRM Lead` → `Sample R&D` → `Quotation` → `Sales Order` → `Kalkulasi MRP` → `PO Supplier` → `GRN Penerimaan Gudang` → `SPK Produksi / BMR` → `QC Lab & Release` → `Delivery Order` → `Sales Invoice` → `Pelunasan Pembayaran` → `Tutup Buku Finansial`.
2. **Stress & Concurrency Testing**:
   * Uji 50–100 simulasi user melakukan transaksi serentak (mencegah deadlock database PostgreSQL, race condition nomor urut faktur/surat jalan, dan double-booking stok gudang).

### 4.2 Parameter & Kriteria Sukses
* Error rate: **0.00%**.
* Database deadlock count: **0**.
* Tidak ada selisih stok fisik vs stok sistem (*zero discrepancy*).

### 4.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Test Command**:
  ```bash
  bash scripts/test-golden-thread.sh
  bash scripts/stress-test-concurrency.sh
  ```
* **Kriteria Lolos Fase 4**: Laporan gate P20 disahkan di `docs/qa-gate/YYYY-MM-DD-p20-golden-thread.md`.

---

## FASE 5: Fase P21 — Migrasi Data & Disaster Recovery

### 5.1 Deskripsi Pekerjaan
Mempersiapkan infrastruktur untuk menampung data nyata klien dan memastikan pemulihan bencana berjalan mulus.

1. **Data Migration Tools**:
   * Bangun script import data Excel/CSV yang tahan banting (Master Barang, Satuan, Pelanggan, Vendor, Saldo Awal Akun COA, Stok Awal Gudang, Piutang/Hutang Berjalan).
   * Validasi integritas data saat import (tolak format tidak valid, duplikasi SKU, atau akun COA tidak terdaftar).
2. **Disaster Recovery & Rollback Rehearsal**:
   * Jalankan simulasi restore database PostgreSQL dari snapshot VPS.
   * Uji skrip rollback `scripts/rollback.sh <sha>` di server staging/production untuk memvalidasi pemulihan jika terjadi kegagalan deploy.

### 5.2 Parameter & Kriteria Sukses
* Import 10.000 baris master data selesai tanpa data corrupt.
* Waktu pemulihan sistem (Recovery Time Objective / RTO): **< 15 menit**.
* Kehilangan data maksimal (Recovery Point Objective / RPO): **0 data transaksi**.

### 5.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Test Command**:
  ```bash
  bash scripts/test-migration-pipeline.sh
  bash scripts/test-rollback-rehearsal.sh
  ```
* **Kriteria Lolos Fase 5**: Backup dan restore berhasil dibuktikan secara live di server VPS.

---

## FASE 6: Fase P22 — Pilot UAT & Dual-Run Operasional

### 6.1 Deskripsi Pekerjaan
Verifikasi lapangan bersama klien sebelum cut-off penuh dari sistem lama ke NEX ERP.

1. **Pilot Run (Departemen Terpilih)**:
   * Terapkan sistem terbatas pada 1–2 alur (misal: Gudang & Pembelian saja) selama 1 minggu.
2. **Dual-Run Operasional (2 Minggu Penuh)**:
   * Tim operasional klien menginput seluruh transaksi harian ke sistem lama DAN ke NEX ERP secara bersamaan.
   * Rekonsiliasi harian antara laporan sistem lama vs laporan NEX ERP.
3. **Formal Sign-Off**:
   * Penandatanganan Berita Acara UAT setelah 14 hari dual-run tanpa deviasi angka finansial dan stok.

### 6.2 Parameter & Kriteria Sukses
* Deviasi stok fisik vs sistem: **0%**.
* Deviasi neraca saldo sistem lama vs NEX ERP: **Rp 0 (Sempurna)**.
* Klien mengonfirmasi persetujuan operasional penuh.

### 6.3 Testing & Verifikasi Wajib (Gerbang Kelulusan)
* **Kriteria Lolos Fase 6**: Dokumen UAT resmi ditandatangani. Sistem dinyatakan **100% PRODUCTION READY**.
