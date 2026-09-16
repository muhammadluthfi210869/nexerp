# DOKUMEN PATOKAN RESMI: AUDIT LIVE ERP (kil.gserp.id) & REKONSILIASI REQUIREMENT V2
**Kode Dokumen**: `DOC-REF-LEGACY-001`  
**Versi**: 2.1.0  
**Tanggal Audit**: 2026-09-15  
**Auditor**: Antigravity Pair-Programming Agent (DeepMind)  
**Target Live ERP**: `https://kil.gserp.id`  
**Kredensial**: `zaki@dreamlab.id` (Tercatat di `.env`)  
**Tujuan Dokumen**: Menjadi **Single Source of Truth (SSOT) Patokan Arsitektur** antara sistem operasional live lama, file inventaris arsip (`v0` dan `v2`), serta spesifikasi catalog JSON (`NEX_ERP_SCREEN_AND_API_CATALOG.json`) untuk pengembangan frontend Next.js dan backend NestJS.

---

## 1. STRUKTUR EVOLUSI FILE INVENTARIS & GAP METRICS

Pemahaman mengenai file-file acuan di `docs/legacy-erp/` sangat krusial agar seluruh pengembang memiliki persepsi yang sama:

```
docs/legacy-erp/
├── _archive/
│   ├── kil_erp_full_inventory.csv       (v0: 146 baris — PURE LEGACY SCRAPE)
│   ├── kil_erp_full_inventory_v1.csv    (v1: Refinement penamaan)
│   └── kil_erp_full_inventory_v2.csv    (v2: 176 baris — FULL REQUIREMENT DENGAN FINANCE/SCM EXPANSION)
├── NEX_ERP_SCREEN_AND_API_CATALOG.json  (Mirror v2 dalam JSON machine-readable — 176 layar)
├── NEX_ERP_MASTER_SPECIFICATION.md      (Master Blueprint v2.0 — 178 layar deklarasi)
└── NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md ← BERKAS INI (PATOKAN RESMI PER 15-SEP-2026)
```

### 1.1. Perhitungan Persentase Gap Resmi
| Komparasi | Total Layar | Cocok di Live | Tidak Ada / Error | Persentase | Status Makna Bisnis |
|---|:---:|:---:|:---:|:---:|---|
| **Live ERP vs `v0` (`kil_erp_full_inventory.csv`)** | 146 | **144** | 2 | **`98.63% Kesesuaian`**<br>(Gap 1.37%) | **Baseline Operasional Riil Pabrik**.<br>`v0` adalah rekaman paling murni dari ERP lama yang saat ini berjalan. |
| **Live ERP vs `v2` (`kil_erp_full_inventory_v2.csv` / JSON Catalog)** | 176 | **144** | 32 | **`81.82% Kesesuaian`**<br>(**`18.18% Gap`**) | **Full Enterprise Target**.<br>Selisih 18.18% (32 layar) terdiri dari **31 Requirement Tambahan** + **1 Defect Server**. |

---

## 2. DOKUMENTASI LENGKAP 31 LAYAR "REQUIREMENT TAMBAHAN" (HTTP 404)

> [!IMPORTANT]
> **PENEGASAN ARSITEKTUR TENTANG STATUS HTTP 404**:  
> 31 Layar di bawah ini **BUKANLAH BUG DAN BUKAN HILANG KARENA TERHAPUS**, melainkan **REQUIREMENT TAMBAHAN TAHAP 2 & 3 (EXPANSION SCOPE)** yang sengaja dimasukkan ke dalam `kil_erp_full_inventory_v2.csv` oleh arsitek sistem saat merancang modernisasi NEX ERP.  
> 
> Layar-layar ini **belum pernah dibuat di server lama `kil.gserp.id`**, sehingga rute URL legacy-nya otomatis mengembalikan **HTTP 404**.  
> **Petunjuk Pengembang**: Jangan mencari tabel database legacy untuk 31 layar ini. Bangunlah menggunakan skema baru Prisma di backend NestJS.

### Rincian 31 Layar Requirement Tambahan Berdasarkan Domain Bisnis:

#### A. Domain Kelola Aset Tetap (Fixed Assets Management) — 5 Layar
1. **`SCR-023` Cost Allocation Setup** (`/cost-allocation-setup`)
   - *Tujuan Bisnis*: Pengaturan Activity-Based Costing (ABC) dan alokasi overhead pabrik (listrik, depresiasi kettle, maintenance boiler).
2. **`SCR-024` Asset Register** (`/asset-register`)
   - *Tujuan Bisnis*: Pencatatan inventaris mesin pabrik, kendaraan operasional, gedung, dan peralatan laboratorium.
3. **`SCR-025` Buat Asset Register** (`/asset-register/create`)
   - *Tujuan Bisnis*: Form perolehan aset baru dengan auto universal sequence number dan estimasi masa manfaat pajak.
4. **`SCR-026` Compliance / Intangible Asset** (`/compliance-asset`)
   - *Tujuan Bisnis*: Monitoring sertifikasi Halal, izin edar BPOM NA, HKI merk dagang, dan jadwal amortisasi biaya legalitas.
5. **`SCR-075` Asset Transfer / Disposal** (`/asset-transfer-disposal`)
   - *Tujuan Bisnis*: Eksekusi pelepasan aset, penjualan mesin afkir, dan pencatatan laba/rugi pelepasan aset tetap.

#### B. Domain Perbankan, Pajak & Periode Akuntansi — 8 Layar
6. **`SCR-037` Bank Account Master** (`/bank-account-manage`)
   - *Tujuan Bisnis*: Master rekening bank operasional terpisah dari CoA (di legacy digabung ke `/coa-manage`).
7. **`SCR-038` Buat Bank Account** (`/bank-account-manage/create`)
   - *Tujuan Bisnis*: Form pembukaan akun kas/bank baru beserta mapping otomatis GL CoA.
8. **`SCR-039` Tax Setup** (`/tax-setup`)
   - *Tujuan Bisnis*: Konfigurasi master tarif pajak (PPN 11%, PPh 21, PPh 23, PPh Final) yang dinamis.
9. **`SCR-070` Closing Checklist & Period Lock** (`/closing-checklist`)
   - *Tujuan Bisnis*: Tata kelola tutup buku bulanan & penguncian periode transaksi agar pembukuan tidak dapat diedit mundur.
10. **`SCR-074` Adjustment Journal** (`/adjustment-journal`)
    - *Tujuan Bisnis*: Jurnal penyesuaian khusus auditor/supervisor saat periode akuntansi terkunci.
11. **`SCR-076` Bank Reconciliation** (`/bank-reconciliation`)
    - *Tujuan Bisnis*: Rekonsiliasi dua kolom antara buku kas sistem vs rekening koran bank (e-Statement import).
12. **`SCR-078` Depreciation Schedule** (`/depreciation-schedule`)
    - *Tujuan Bisnis*: Runner batch otomatis untuk memposting beban penyusutan aset tetap setiap akhir bulan.
13. **`SCR-085` Tax Transactions** (`/tax-transactions`)
    - *Tujuan Bisnis*: Buku besar transaksi pajak (PPN Masukan, PPN Keluaran, Bukti Potong PPh).

#### C. Domain Keuangan Khusus Maklon (Finance & Escrow) — 4 Layar
14. **`SCR-077` Client Escrow / Pass-Through Disbursement Ledger** (`/client-escrow`)
    - *Tujuan Bisnis*: Pencatatan dana titipan klien untuk pengurusan legalitas BPOM/Uji Lab independen (dana non-revenue).
15. **`SCR-093` Budget Entry** (`/budget-entry`)
    - *Tujuan Bisnis*: Input plafon anggaran biaya per departemen (R&D, Produksi, Promosi).
16. **`SCR-111` Pengajuan Dana (Fund Request)** (`/fund-request`)
    - *Tujuan Bisnis*: Pengajuan kasbon operasional, uang muka kerja dinas, dan reimbursement staf.
17. **`SCR-112` Buat Pengajuan Dana** (`/fund-request/create`)
    - *Tujuan Bisnis*: Form permohonan dana dengan alur persetujuan bertingkat (Staff -> Head -> Finance).

#### D. Domain Penagihan & Biaya Produksi (Costing & Collections) — 3 Layar
18. **`SCR-113` Collections** (`/collections`)
    - *Tujuan Bisnis*: Dasbor kerja tim finance AR untuk memantau penagihan piutang, log kontak penagihan, dan janji bayar klien.
19. **`SCR-133` Kelola Desain & Kemasan** (`/design-manage`)
    - *Tujuan Bisnis*: Modul mandiri manajemen revisi desain kemasan dan status ACC cetak klien (di legacy masih checklist manual).
20. **`SCR-134` Buat / Revisi Desain** (`/design-manage/create`)
    - *Tujuan Bisnis*: Form submission revisi desain etiket/karton kemasan kosmetik.
21. **`SCR-146` Job Order Costing** (`/job-order-costing`)
    - *Tujuan Bisnis*: Akumulasi biaya riil per batch produksi (Bahan Baku riil + Tenaga Kerja Langsung + FOH applied).

#### E. Domain Laporan Lanjutan (Advanced Reports) — 8 Layar
22. **`SCR-155` Budget vs Actual** (`/budget-vs-actual`)
    - *Tujuan Bisnis*: Laporan analisis varian antara anggaran yang disetujui vs realisasi pengeluaran kas.
23. **`SCR-156` Cost Variance** (`/cost-variance`)
    - *Tujuan Bisnis*: Analisis varian harga beli bahan baku (PPV) dan varian efisiensi pemakaian produksi.
24. **`SCR-157` Product / Customer Profitability** (`/product-customer-profitability`)
    - *Tujuan Bisnis*: Matriks analisis keuntungan bersih per formula produk dan per akun pelanggan maklon.
25. **`SCR-158` AP Aging Report** (`/report-ap-aging`)
    - *Tujuan Bisnis*: Laporan terperinci umur hutang supplier (Current, 1-30, 31-60, 61-90, >90 hari) dengan color-coding H-3/H-7.
26. **`SCR-159` AR Aging Report** (`/report-ar-aging`)
    - *Tujuan Bisnis*: Laporan terperinci umur piutang klien maklon.
27. **`SCR-161` Cash Flow Statement** (`/report-cash-flow`)
    - *Tujuan Bisnis*: Laporan arus kas metode langsung/tidak langsung (Arus Kas Operasi, Investasi, Pendanaan).
28. **`SCR-164` Report Penjualan** (`/report-sales-summary`)
    - *Tujuan Bisnis*: Laporan rekapitulasi penjualan analitik per kategori brand, sales PIC, dan performa produk.
29. **`SCR-166` Report Penerimaan Barang** (`/report-goods-receipt`)
    - *Tujuan Bisnis*: Laporan rekap audit log inbound gudang per supplier dan nomor PO.

#### F. Domain Dasbor & Monitoring R&D Tambahan — 2 Layar
30. **`SCR-022` D. Sample** (`/dashboard-sample`)
    - *Tujuan Bisnis*: Dasbor konsolidasi sample (di legacy live dipecah menjadi `/dashboard-sales-sample` dan `/dashboard-rnd`).
31. **`SCR-176` Project Monitoring R&D** (`/rnd/project-monitoring`)
    - *Tujuan Bisnis*: Monitoring timeline stabilitas sample, mikroba test, dan formula trial (sebelumnya manual di Google Sheets).

---

## 3. DOKUMENTASI DEFECT SERVER LIVE: `/dashboard-human-resources` (HTTP 500)

* **Status di Live**: Halaman terdaftar di sidebar menu `D. HR`, namun saat diakses menghasilkan **HTTP 500 (Internal Server Error)** dengan halaman kosong.
* **Penyebab Teknis**: Controller PHP CodeIgniter di server legacy mengalami *unhandled exception* (kemungkinan kegagalan query relasi tabel presensi/karyawan yang korup).
* **Solusi di NEX ERP**: Modul Human Resources (`MOD-11`) tidak perlu merekayasa balik (*reverse-engineer*) kode lama, melainkan harus dibangun secara **clean-slate** menggunakan rancangan modul HR modern di Next.js & NestJS.

---

## 4. STANDAR OPERASIONAL SISTEM LIVE BASELINE (144 LAYAR)

Untuk 144 layar baseline legacy yang berjalan aktif, berikut adalah standar implementasi yang terbukti valid di live server:

### 4.1. Pola Routing CRUD
* **List Page**: `https://kil.gserp.id/{resource}` (contoh: `/goods-manage`, `/purchase`, `/sales`).
* **Create Page**: `https://kil.gserp.id/{resource}/create` (contoh: `/goods-manage/create`, `/purchase/create`).
* **Edit/Update Page**: `https://kil.gserp.id/{resource}/{id}/update` (contoh: `/goods-manage/1541/update`).
* **Delete Action**: POST/GET `https://kil.gserp.id/{resource}/{id}/delete` via prompt konfirmasi `uriAlert(...)`.

### 4.2. Pola View Detail Modal via AJAX
* Seluruh tombol "Lihat / Detail" memanggil JavaScript:
  ```javascript
  ajaxDetail(id, 'modal-xl'); // Memanggil GET /{resource}/detail?id={id}
  ```
* Header wajib menyertakan `X-Requested-With: XMLHttpRequest`.
* Backend merespon dengan payload JSON: `{ "view": "<div class='modal-content'>...</div>" }`.
* **Data yang disajikan**: Ringkasan dokumen, counterparty (Klien/Supplier), tabel baris barang, riwayat approval berjenjang, dan entri jurnal otomatis.

### 4.3. Pola Template Cetak (Print Format)
* Mengakses view cetak mandiri di `https://kil.gserp.id/{resource}/{id}/print`.
* Bersih dari sidebar/navbar dengan layout `@media print`.
* Memuat Kop Resmi:
  ```
  PT. KARYA IMPIAN LABORATORIS
  Jl. Raya Industri Kosmetika, Surabaya / Sidoarjo
  ```
* Nomor dokumen unik (misal: `DO-202608-000002`, `PI-202609-000001`, `BR-202609-000018`).
* Tabel barang (Kode, Nama, Qty, Satuan, Harga, Total).
* Rincian finansial (Subtotal, Diskon Rp, Beban Tambahan, PPN 11%, Grand Total).
* 2–4 Kolom tanda tangan otorisasi (*Dibuat Oleh, Disetujui, Mengetahui, Penerima*).

---

## 5. PANDUAN IMPLEMENTASI UNTUK TIM DEVELOPER & AI

1. **Frontend (Next.js App Router)**:
   * **Fase 1 (Wajib Parity)**: Bangun 144 layar baseline terlebih dahulu. Rute diselaraskan ke namespace bersih (`/bussdev/*`, `/scm/*`, `/finance/*`, `/production/*`, `/master/*`).
   * **Fase 2 & 3 (Expansion)**: Bangun 31 layar requirement tambahan (Aset Tetap, Escrow, Bank Recon, Laporan Aging).
   * **Dynamic Cart**: Ganti penyimpanan session PHP lama dengan state management lokal (Zustand / TanStack React Form) dengan *single atomic commit* saat simpan transaksi.
2. **Backend (NestJS + Prisma)**:
   * **Skrip Migrasi Data (ETL)**: Hanya lakukan ekstrak data legacy dari tabel-tabel yang berkaitan dengan 144 layar baseline. Jangan buat script migrasi data untuk 31 layar tambahan karena datanya memang tidak ada di database legacy lama.
   * **Prisma Schema**: Buat model entitas baru yang bersih untuk `FixedAsset`, `AssetDisposal`, `ClientEscrowLedger`, `BankReconciliation`, `FundRequest`, dan `JobOrderCosting`.
3. **Template Cetak**:
   * Implementasikan komponen cetak universal menggunakan Tailwind CSS (`print:block`, `print:text-black`) yang mendukung rendering PDF server-side dan client-side print dialog.
