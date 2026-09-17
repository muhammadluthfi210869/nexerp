# ERP INPUT / OUTPUT LINEAGE & DATA INTEGRITY AUDIT
**Document Version:** 1.0 — Traceability, Lineage & Integrity Report  
**Enterprise:** PT. Karya Impian Laboratoris (Dreamlab - Toll Manufacturing Kosmetik)  
**Auditor:** ERP Systems Analyst & Data Architect  

---

## 1. End-to-End Core Data Lineage (The Golden Thread)

Diagram berikut memetakan perjalanan data dari awal interaksi prospek komersial hingga pelaporan laba rugi di buku besar:

```text
[Buku Tamu / WhatsApp Leads]
      ↓ (Lead Data: Nama, Kontak, Minat Kategori)
[Penjualan Sample Lab (SS)]
      ↓ (Approval & Validasi Bayar Sample di Finance)
[Formulasi Lab (R&D BOM)]
      ↓ (Komposisi Kimia 100%, Spesifikasi Fisik & Netto)
[Permintaan HPP (Costing COGS)]
      ↓ (HPP Terkunci: Bahan Kimia + Kemasan Primer/Sekunder + Upah Pabrik)
[Sales Order Kontrak Maklon (SO)]
      ↓ (Nomor SO, Pelanggan, Produk, Qty MOQ, Nilai Kontrak)
[Penerimaan DP Penjualan 50%]
      ↓ (Status SO Aktif / Siap Produksi & Pengadaan)
      ├──→ [SCM: Kebutuhan Barang / MRP]
      │         ↓ (Perhitungan Defisit Bahan)
      │    [Permintaan Pembelian (PR)]
      │         ↓ (Item, Qty, Target Gudang)
      │    [Purchase Order (PO)]
      │         ↓ (Supplier, Harga, TOP, PPN)
      │    [Inbound Goods Receipt (GR)]
      │         ↓ (Stok Bahan Baku & Kemasan Bertambah)
      │    [Faktur Pembelian & Pelunasan AP]
      │
      └──→ [Produksi: Batch Record CPKB (BMR)]
                ↓ (No Batch Resmi Pabrik)
           [1. Eksekusi Mixing Ruahan]
                ↓ (Pemotongan Stok Bahan Baku Kimia → Hasil Ruahan WIP)
           [2. Eksekusi Filling Botol/Pot]
                ↓ (Pemotongan Ruahan + Botol Primer → Produk Unboxed)
           [3. Eksekusi Packaging & Coding]
                ↓ (Pemotongan Box + Etiket BPOM → Finished Goods)
           [Gudang Barang Jadi (FG)]
                ↓ (Stok Produk Siap Kirim)
           [Pengiriman Barang / Surat Jalan (DO)]
                ↓ (Pemotongan Stok FG, Terbit Dokumen Kirim)
           [Faktur Penjualan Pelunasan (AR)]
                ↓ (Pemotongan DP 50%, Sisa Tagihan 50%)
           [Bayar Penjualan / Pelunasan Piutang]
                ↓ (Kas Bank Masuk)
           [Posting Jurnal Umum & Laporan Keuangan]
                ↓ (Pengakuan Pendapatan, HPP Riil & Laba Bersih)
           [Dashboard Eksekutif & Real-time Margin]
```

---

## 2. Orphan Input Audit (Input Diminta Namun Tidak Digunakan)

### ORPHAN INPUT 1: Target Penjualan Bulanan (Old ERP)
* **Module:** Master / Kelola Penjualan
* **Page:** `/sales-target` (`target-penjualan-input.html`)
* **Field:** `Marketing`, `Tahun`, `Bulan`, `Target (Rp)`
* **Reason Suspected:** Input diminta dan disimpan di database, namun tidak pernah dihubungkan dengan laporan realisasi omzet penjualan actual atau dashboard KPI sales.
* **Evidence:** File `target-penjualan-input.html` mengumpulkan target rupiah per staf marketing, namun di `penjualan.html` dan `d-penjualan-barang.html` tidak terdapat komparasi Target vs Actual.
* **Impact:** Data menjadi "dead record" yang membebani staf tanpa memberikan nilai analitik.

### ORPHAN INPUT 2: Pajak (%) pada Master Supplier (Old ERP)
* **Module:** Master Supplier
* **Page:** `/supplier-manage/create` (`supplier-input.html`)
* **Field:** `pajak` (Persentase Pajak)
* **Reason Suspected:** Disimpan di profil vendor, namun saat staf SCM membuat Purchase Order di `buat-pembelian-input.html`, sistem tidak menarik default pajak vendor tersebut; staf tetap harus memilih atau menghitung PPN secara manual.
* **Evidence:** Inspeksi DOM `buat-pembelian-input.html` tidak memiliki listener auto-fill tax dari relasi `supplier_id`.

### ORPHAN INPUT 3: Foto Bukti Muat Surat Jalan (Old ERP & New ERP)
* **Module:** Warehouse / Pengiriman Barang
* **Page:** `/delivery-out` (`pengiriman-barang-input.html`) & `/warehouse/release`
* **Field:** `foto_opsional` (Upload File Foto Muatan Armada)
* **Reason Suspected:** Disimpan sebagai binary/file path, namun tidak pernah ditampilkan pada Surat Jalan cetak, dokumen verifikasi supir, atau di halaman tracking pelanggan.
* **Evidence:** Template Surat Jalan hanya menampilkan tabel teks tanpa container image placeholder untuk foto muatan.

---

## 3. Orphan Output Audit (Output / Dashboard Tanpa Sumber Data Jelas)

### ORPHAN OUTPUT 1: ABC Analysis & Stock Intelligence Metrics
* **Module:** Warehouse & SCM
* **Output / Metrics:** ABC Analysis Matrix, Dead Stock Ranking, Fast/Slow Movers, Reorder Suggestions.
* **Claimed Value:** Tampil pada UI atau spesifikasi dashboard pergudangan cerdas.
* **Expected Source:** Query agregasi pergerakan inventori dari tabel `InventoryTransaction` dan `MaterialValuation`.
* **Actual Source:** File `backend/src/modules/warehouse/services/stock-intelligence.service.ts` baris 8–13 mengembalikan array kosong statis (`return [];`).
* **Problem:** Backend service hanya berupa stub kosong bertanda `// Stub service — see Phase 0-5 report... Real stock-intelligence logic is being rebuilt separately.`
* **Severity:** P2 (Incomplete Analytics Engine).

### ORPHAN OUTPUT 2: Fallback Mock Data pada Finance Command Center
* **Module:** Finance & Accounting
* **Page:** `/finance/dashboard` (`frontend/src/app/(dashboard)/finance/dashboard/page.tsx`)
* **Output / Metrics:** Card Saldo Kas/Bank, Grafik AR Aging, AP Aging, Monthly Revenue, Expense Breakdown, KPI Rasio Likuiditas.
* **Claimed Value:** Menampilkan posisi finansial perusahaan terkini.
* **Expected Source:** Endpoint API `/api/finance/analytics` yang mengambil data riil dari PostgreSQL.
* **Actual Source:** Baris 85–180 pada file frontend mendefinisikan array konstan: `FALLBACK_TRANSACTIONS`, `FALLBACK_AR`, `FALLBACK_AP`, `FALLBACK_EXPENSE`, `FALLBACK_REVENUE`, `FALLBACK_CASH`, `FALLBACK_KPI`.
* **Problem:** Jika koneksi API gagal atau terjadi network error, UI secara diam-diam menampilkan angka tiruan yang tampak realistis tanpa ada banner peringatan bahwa data yang ditampilkan adalah data tiruan!
* **Severity:** P1 (Financial Misrepresentation Risk).

### ORPHAN OUTPUT 3: Mock Data pada HPP Request Board
* **Module:** SCM / R&D
* **Page:** `/scm/hpp-requests` (`frontend/src/app/(dashboard)/scm/hpp-requests/HppRequestBoard.tsx`)
* **Output / Metrics:** Daftar Customer, Daftar Produk Maklon, dan Daftar Versi Formula.
* **Actual Source:** Ditemukan array `const MOCK_CUSTOMERS = [...]`, `const MOCK_PRODUCTS = [...]`, `const MOCK_FORMULAS = [...]` di dalam komponen.
* **Problem:** Komponen UI belum terhubung penuh ke Master Customer dan Master Formula backend.

### ORPHAN OUTPUT 4: Mock Data pada CRM Client Manager & Lost Deals
* **Module:** BusDev / Commercial
* **Pages:** `/bussdev/client-manager` & `/bussdev/lost`
* **Output / Metrics:** Pipeline Lead Sample, Production Leads, Repeat Order Leads, Churn Analysis.
* **Actual Source:** Ditemukan hardcoded mock: `const DUMMY_SAMPLE_LEADS`, `const DUMMY_PRODUCTION_LEADS`, `const DUMMY_RO_LEADS`, `const DUMMY_PROSPECTS`, `const DUMMY_CHURN`.
* **Problem:** Halaman visual CRM ini belum melakukan fetch dinamis terhadap tabel Prisma `SalesLead` dan `LostDeal`.

---

## 4. Duplicate Input Audit (Redundansi Input antar Proses)

### DUPLICATE INPUT 1: Input Ulang Data Pelanggan & Produk pada Kebutuhan Barang (Old ERP)
* **Source Already Available:** Dokumen Sales Order (`SO-xxx`) yang sudah memuat identitas Pelanggan, Produk Jadi, dan Formula terkait.
* **Duplicate Field:** Di form `kebutuhan-barang-input.html`, setelah memilih No. SO, staf masih harus memilih `produk_id` dan `customer_id` secara manual lewat dropdown terpisah.
* **Risk:** Ketidakcocokan data jika staf salah memilih kombinasi customer dan SO.
* **Recommended Classification:** UPGRADE (Auto-fill / Lock berdasarkan relasi SO di New ERP).

### DUPLICATE INPUT 2: Input Ulang Identitas Supplier & Gudang pada Penerimaan Barang (Old ERP)
* **Source Already Available:** Dokumen Purchase Order (`PO-xxx`) yang sudah mengunci Supplier dan Gudang Tujuan Bongkar.
* **Duplicate Field:** Di `pembelian-masuk.html`, staf gudang harus memilih kembali Supplier dan Gudang Penerima.
* **Risk:** Kesalahan penerimaan barang ke gudang yang salah (misal: bahan kimia masuk gudang kemasan sekunder).

### DUPLICATE INPUT 3: Rute Duplikat Paralel pada Modul Keuangan (New ERP)
* **Source Already Available:** Modul Jurnal Umum, Kas Masuk, Kas Keluar, Buku Besar, dan Laba Rugi.
* **Duplicate Field / Pages:**
  * `/finance/jurnal-umum` vs `/finance/general-journal`
  * `/finance/kas-bank-masuk` vs `/finance/cash-in`
  * `/finance/kas-bank-keluar` vs `/finance/cash-out`
  * `/finance/buku-besar` vs `/finance/ledger`
  * `/finance/laba-rugi` vs `/finance/reports`
* **Risk:** Staf dengan peran Superadmin menginput di route berbahasa Inggris, sedangkan staf Finance menginput di route berbahasa Indonesia; data tidak sinkron karena masing-masing menyimpan di local state frontend yang terpisah!

---

## 5. Broken Lineage & Handoff Breakdown

```text
[Lantai Produksi: Produksi Packaging Selesai]
      ↓ (Output: Hasil Jadi 5.000 Pcs Produk Jadi)
      ✕ [BROKEN LINEAGE] ✕
      ↓ (Tidak ada pemicu otomatis penerimaan barang di Gudang FG)
[Gudang Finished Goods: Saldo Stok Tidak Bertambah Otomatis]
      ↓
[Staf Gudang harus melakukan penyesuaian stok manual]
```

* **Penjelasan Masalah:** Di kedua sistem (Old ERP dan implementasi New ERP saat ini), penutupan transaksi Produksi Packaging tidak memiliki event emitter atau database trigger yang secara atomik menambahkan kuantitas barang jadi ke tabel inventori `FinishedGood` / `MaterialInventory` di gudang barang jadi. Hal ini menyebabkan saldo stok fisik barang jadi di sistem sering tertinggal dari kondisi riil di lantai pabrik.
