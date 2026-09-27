# NEX ERP — Master Blueprint: Alur End-to-End Lintas Divisi & Otomasi Pengujian Browser (Playwright / Browser-Use)

**Status:** ACTIVE & AUTHORITATIVE EXECUTION BLUEPRINT  
**Target:** Penyelesaian Penuh Alur Rantai Pasok Manufaktur (Zero Fatal Error & 100% Tembus Database)  
**Dokumen Rujukan:**
- `docs/legacy-erp/reference/REQUIREMENT.md` (34 Poin Kebutuhan Upii — Otoritas Tertinggi)
- `docs/legacy-erp/contracts/00_MASTER_SPEC.md` (Spesifikasi Master, Prinsip Terkunci §5, Dependensi Modul §6, Urutan Build §7)
- `docs/legacy-erp/contracts/01_DOMAIN_MODEL.md` & `schema.prisma` (Entitas & Relasi Data PostgreSQL)
- `docs/legacy-erp/contracts/03_WORKFLOW_STATE_MACHINE.yaml` (129 Transisi State & Aturan Terlarang)
- `docs/legacy-erp/contracts/04_BUSINESS_RULES.md` (105 Aturan Bisnis Inti)
- `docs/legacy-erp/contracts/05_API_CONTRACT.yaml` (Spesifikasi Endpoint REST OpenAPI)
- `docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json` (Kontrak Layar UI)
- `docs/legacy-erp/contracts/07_RBAC_MATRIX.yaml` (Matriks Hak Akses 18 Role)
- `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md` (Standar Pengiriman Cepat 9/10)
- `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md` (Fase 2: Eliminasi Mock & Plumbing Frontend-Backend)

---

## DAFTAR ISI

1. [Tujuan Dokumen & Metodologi Otomasi Browser](#1-tujuan-dokumen--metodologi-otomasi-browser)
2. [Prinsip Arsitektur "Seam" & Garansi Lintas Divisi (Input A ➔ Output B)](#2-prinsip-arsitektur-seam--garansi-lintas-divisi-input-a--output-b)
3. [Peta Alur Makro Hulu ke Hilir (9 Tahap Rantai Pasok)](#3-peta-alur-makro-hulu-ke-hilir-9-tahap-rantai-pasok)
4. [Spesifikasi Teknis Detail per Halaman & Kontrak Lintas Divisi](#4-spesifikasi-teknis-detail-per-halaman--kontrak-lintas-divisi)
   - [Tahap 1: Master Data & CRM/BusDev (Hulu Inti)](#tahap-1-master-data--crmbusdev-hulu-inti)
   - [Tahap 2: R&D, Formulasi, Creative Design & Legalitas](#tahap-2-rd-formulasi-creative-design--legalitas)
   - [Tahap 3: Sales Pipeline & Order Management](#tahap-3-sales-pipeline--order-management)
   - [Tahap 4: SCM Procurement & Purchase Order](#tahap-4-scm-procurement--purchase-order)
   - [Tahap 5: Gudang / Warehouse (GRN Tiga Pilar & Stok Real)](#tahap-5-gudang--warehouse-grn-tiga-pilar--stok-real)
   - [Tahap 6: Eksekusi Produksi & Quality Control (QC Lab)](#tahap-6-eksekusi-produksi--quality-control-qc-lab)
   - [Tahap 7: Pengiriman (Delivery Order) & Penagihan (AR Invoice)](#tahap-7-pengiriman-delivery-order--penagihan-ar-invoice)
   - [Tahap 8: Keuangan, Kas/Bank, Pengajuan Dana & Auto-Journal](#tahap-8-keuangan-kasbank-pengajuan-dana--auto-journal)
   - [Tahap 9: SDM / HR & Event-Derived KPI Governance](#tahap-9-sdm--hr--event-derived-kpi-governance)
5. [Arsitektur Pengujian Otomatis Playwright / Browser-Use](#5-arsitektur-pengujian-otomatis-playwright--browser-use)
6. [Matriks Pemeriksaan Kesesuaian REQUIREMENT.md (Traceability Audit)](#6-matriks-pemeriksaan-kesesuaian-requirementmd-traceability-audit)
7. [Protokol Eksekusi & Pemulihan Error Mandiri (Self-Healing Loop)](#7-protokol-eksekusi--pemulihan-error-mandiri-self-healing-loop)

---

## 1. TUJUAN DOKUMEN & METODOLOGI OTOMASI BROWSER

### 1.1 Masalah Codebase Saat Ini
Sebagaimana dibuktikan dalam audit `2026-09-23` dan `_PHASE_DELIVERY_LEDGER.md`:
* 245+ halaman di `frontend/src/app/(dashboard)` masih menggunakan mock statis (`useState`, `SAMPLE_*`, array dummy lokal).
* Ketika tombol simpan ditekan, tidak ada panggilan HTTP `POST`/`PATCH` ke NestJS, sehingga data hilang saat halaman di-refresh.
* Backend NestJS dan skema Prisma PostgreSQL telah selesai dibangun, namun antarmuka frontend berjalan seperti "dua sistem terpisah".

### 1.2 Solusi: Uji Otomasi Browser Berbasis Alur Nyata
Alih-alih menguji form satu per satu secara manual yang membuang waktu user:
1. **AI Agent** menjalankan browser headless (Playwright) untuk mengeksekusi skenario bisnis dari halaman hulu hingga halaman hilir.
2. Setiap kali ada tombol diklik, browser merekam:
   * **Network tab**: Memastikan request berstatus HTTP `200` atau `201` (Bukan `404`, `400 Validation Error`, atau `500 Internal Server Error`).
   * **Console logs**: Memastikan tidak ada React crash, uncaught exception, atau missing DNA components.
   * **Database assertion**: Memeriksa langsung ke PostgreSQL bahwa row baru telah masuk dengan nilai kolom dan foreign key yang tepat.
   * **Seam assertion**: Membuka halaman divisi penerima untuk memvalidasi bahwa data yang di-input di Divisi A telah muncul di tabel Divisi B.
3. Jika ditemukan bug, **AI Agent langsung memperbaiki kode di tempat** (self-healing) hingga skrip pengujian browser mengembalikan **Exit Code 0**.

---

## 2. PRINSIP ARSITEKTUR "SEAM" & GARANSI LINTAS DIVISI (INPUT A ➔ OUTPUT B)

Sesuai `00_MASTER_SPEC.md §5` dan `03_WORKFLOW_STATE_MACHINE.yaml`, data antar divisi di NEX ERP terhubung melalui **kontrak tak terputus (Deterministic Seam)**:

```
[Divisi BusDev]                  [Divisi RnD / Legal]              [Divisi Sales]
Buku Tamu / Intake Lead  ───►  Sample Request & Formula  ───►  Quotation & Sales Order
(POST /api/v1/leads)           (POST /api/v1/rnd/samples)      (Bridge: sales_details_id)
        │                                                              │
        ▼                                                              ▼
[Divisi Keuangan (DP)]                                          [Divisi Gudang / SCM]
DP Penjualan (Sample/Prod)                                     MRP & PO Bahan Baku
(Auto-Journal Kas Masuk)                                       (POST /api/v1/purchase/orders)
        │                                                              │
        ▼                                                              ▼
[Divisi Produksi]               [Divisi Quality Control]       [Divisi Gudang (Inbound)]
SPK Mixing/Filling/Packing ◄─── Release Bahan Karantina   ◄─── GRN (Bagus/Reject/Free)
(Pemakaian Bahan BOM)           (Sample Uji Lab)               (Real Stok Diperbarui)
        │
        ▼
[Divisi Pengiriman]             [Divisi Keuangan (Faktur)]     [General Ledger / Buku Besar]
Surat Jalan / Delivery Order──► Sales Invoice (AR Tagihan)───► Auto-Journal 9 Triggers
(DO Status: DELIVERED)          (Pelunasan Pembayaran Kas)     (Debit-Kredit Seimbang = 0)
```

### Aturan Baku Pertukaran Data Lintas Divisi:
1. **Bridge Field `sales_details_id` (DEC-017 / LOCKED):**
   Sales Order adalah jangkar utama produksi. Modul Produksi dan Pengiriman membaca data spesifikasi pesanan melalui bridge field `sales_details_id`. Produksi tidak boleh membaca data harga/komisi Sales; Produksi hanya membaca volume, formula, dan target kemasan.
2. **Prinsip Tiga Pilar Gudang (Bagus / Reject / Free — REQUIREMENT Poin 48 & 54):**
   Setiap barang masuk wajib dicatat dalam 3 kolom terpisah:
   * **Bagus**: Masuk stok aktif & diakui sebagai hutang dagang (AP) vendor.
   * **Reject**: Masuk karantina, **TIDAK DIBAYAR** ke vendor (faktur hanya menagih barang bagus).
   * **Free (Gratis)**: Masuk stok aktif, nilai hutang AP = Rp 0.
3. **Format Kode Universal Otomatis (REQUIREMENT Poin 65 / DEC-020):**
   Semua kode dokumen (SO, PO, GRN, DO, INV, BMR) dibuat otomatis oleh generator backend:
   * Versi Lengkap: `DL-DIV-TIPE-DDMMYYYY-XXXX` (misal: `DL-SLS-SO-26092026-0001`).
   * Versi Ringkas: `TIPE-DDMMYYYY-XXXX` (misal: `SO-26092026-0001`).
   * Nomor urut (`XXXX`) bersifat global dan berkelanjutan sepanjang masa (tidak reset per bulan).
4. **Auto-Journal Tanpa Pengecualian (DEC-015 / LOCKED):**
   Semua transaksi operasional memicu event akuntansi otomatis ke General Ledger (GL). Tidak ada transaksi keuangan yang dibuat lewat ketik manual jika transaksinya berasal dari mutasi barang, faktur, atau pembayaran kas.

---

## 3. PETA ALUR MAKRO HULU KE HILIR (9 TAHAP RANTAI PASOK)

| Urutan | Tahap Bisnis | Halaman Frontend Utama | Divisi Pemilik | Dokumen Input ➔ Output |
|:---:|---|---|---|---|
| **1** | **Master Data & BusDev** | `/penjualan/guest-book`<br>`/master/customers`<br>`/master/vendors` | BusDev & Admin Master | Kunjungan Tamu ➔ Lead Calon Klien ➔ Master Customer Terverifikasi |
| **2** | **R&D, Sample & Desain** | `/samples/request`<br>`/rnd/formula`<br>`/creative/board`<br>`/legality/permits` | R&D, Creative, Legalitas | Permintaan Sample ➔ SPK Sample R&D ➔ Formulasi Dikunci (FPR) ➔ Desain & BPOM Disetujui |
| **3** | **Sales Order & DP** | `/penjualan/quotation`<br>`/penjualan/sales-orders`<br>`/penjualan/bayar-penjualan` | Sales & BusDev | Quotation (Penawaran) ➔ Sales Order (SO) ➔ Pembayaran DP Penjualan (Sample/Produksi) |
| **4** | **Pengadaan / Purchasing** | `/pembelian/kalkulasi-mrp`<br>`/pembelian/purchase-orders`<br>`/pembelian/bayar-pembelian` | SCM & Purchasing | Kalkulasi Kebutuhan Bahan (MRP) ➔ Purchase Order (PO) ➔ DP Pembelian Vendor |
| **5** | **Gudang / Penerimaan (GRN)** | `/warehouse/receipts`<br>`/warehouse/stock`<br>`/warehouse/movements` | Gudang (Inbound) | Penerimaan Barang (GRN Bagus/Reject/Free) ➔ Real Stok Gudang Bertambah |
| **6** | **Produksi & QC Lab** | `/production/spk`<br>`/production/mixing`<br>`/production/filling`<br>`/quality/release` | Produksi & QC | SPK Produksi (BMR) ➔ Pemakaian Bahan Baku (WIP) ➔ QC Release Finished Goods |
| **7** | **Pengiriman & Faktur AR** | `/pengiriman/delivery-orders`<br>`/penjualan/faktur`<br>`/finance/ar-hub` | Logistik & Keuangan | Surat Jalan (DO) Diterbitkan ➔ Barang Terkirim ➔ Terbit Faktur Penjualan (AR) |
| **8** | **Kas/Bank, AP & Auto-Journal** | `/finance/bank-accounts`<br>`/finance/pengajuan-dana`<br>`/finance/accounting/general-ledger` | Keuangan (Finance) | Pelunasan Piutang (AR) / Hutang (AP) ➔ Pengajuan Dana ➔ Jurnal Umum Seimbang |
| **9** | **SDM / HR & KPI Event** | `/hr/karyawan`<br>`/hr/payroll`<br>`/executive/dashboard` | HRD & Direksi | Presensi & Gaji (Potongan Kasbon & Transport) ➔ Rekap KPI Karyawan Otomatis |

---

## 4. SPESIFIKASI TEKNIS DETAIL PER HALAMAN & KONTRAK LINTAS DIVISI

### TAHAP 1: MASTER DATA & CRM/BUSDEV (HULU INTI)

#### Halaman 1.1: Buku Tamu Kunjungan Klien (Guest Book)
* **URL Frontend:** `/penjualan/guest-book` (SCR-014 / Parity)
* **Aktor / Role:** BusDev Staff (`Role 7`), BusDev Admin (`Role 10`)
* **Spesifikasi Input (Form Buat Buku Tamu):**
  - `name`: Nama lengkap tamu (Text, Required)
  - `phone`: Nomor WhatsApp/Kontak (Text, Autocomplete format Indonesia `08...`, Required)
  - `company`: Nama Brand / Perusahaan (Text, Required)
  - `city`: Asal kota (Text search autocomplete)
  - `category`: Kategori prospek (`BRANDED` | `PEMULA` | `KLINIK` | `DISTRIBUTOR`)
  - `productInterest`: Rencana produk kosmetik (misal: "Serum Retinol 30ml")
  - `moq`: Target rencana pesanan (Number, default 1000)
  - `meetingWith`: PIC Internal penerima kunjungan
  - `busDev`: Pendamping tim BusDev
* **Fitur Sesuai REQUIREMENT.md Poin 180–183:**
  - Card ringkasan total tetap tampil saat user mengganti filter bulan.
  - Filter rentang bulan dan search box berdasarkan nama klien/brand.
  - Auto-save form draft agar input tidak hilang jika berpindah halaman.
* **API Backend:**
  - `GET /api/v1/buku-tamu?month=2026-09&search=...` (Response: Array record dari PostgreSQL)
  - `POST /api/v1/buku-tamu` (Payload: JSON data form di atas)
* **Penyimpanan Database (Prisma):**
  - Tabel: `buku_tamu_entries`
  - Kolom: `id`, `no`, `clientName`, `contact`, `city`, `productInterest`, `moq`, `category`, `meetingPic`, `status: "PENDING_CONVERSION"`, `createdAt`, `organizationId`
* **SEAM LINTAS DIVISI (Handshake Hulu ➔ Hilir):**
  - **Aksi:** Klik tombol *"Konversi ke Calon Klien / Lead"*.
  - **Efek Lintas Halaman:** Otomatis membuat entitas `crm_leads` dan data tamu muncul di `/marketing/omnicrm` dan `/master/customers` dengan status prospek.

#### Halaman 1.2: Master Customer & Klasifikasi Lifecycle
* **URL Frontend:** `/master/customers` (SCR-011)
* **Aktor / Role:** BusDev Admin, Administrator
* **Spesifikasi Khusus (REQUIREMENT.md Poin 2):**
  - Form customer wajib memiliki 3 card/tab klasifikasi khusus:
    1. **Card Sample**: Riwayat sample yang pernah diminta, status evaluasi sample, formula ID terkait.
    2. **Card Produksi**: Riwayat pesanan maklon berjalan, status batch, target deadline produksi.
    3. **Card Legalitas**: Nomor izin BPOM atas nama merek tersebut, sertifikat HKI/Merek, status sertifikasi Halal.
* **API Backend:**
  - `GET /api/v1/customers`
  - `POST /api/v1/customers` / `PATCH /api/v1/customers/{id}`
* **Penyimpanan Database:**
  - Tabel: `customers` (kolom relasi ke `sales_samples`, `production_plans`, `legality_records`)

#### Halaman 1.3: Master Vendor / Supplier
* **URL Frontend:** `/master/vendors` (SCR-013)
* **Aktor / Role:** Purchasing Admin (`Role 4`), Administrator
* **Spesifikasi Khusus (REQUIREMENT.md Poin 1, 3, 49):**
  - Fitur **Import Excel Data Vendor** (`POST /api/v1/suppliers/import`).
  - Pengelompokan kategori vendor **hanya berbasis COA** (Chart of Accounts) — bukan teks bebas.
  - Filter vendor berdasarkan jenis pasokan: `Bahan Baku`, `Kemasan Primer`, `Kemasan Sekunder`, `Bahan Pembantu`.

---

### TAHAP 2: R&D, FORMULASI, CREATIVE DESIGN & LEGALITAS

#### Halaman 2.1: Permintaan & Pembayaran Sample (Sales Sample & Sample Fee)
* **URL Frontend:** `/samples/request` & `/penjualan/sample-fee` (SCR-182)
* **Aktor / Role:** BusDev Staff ➔ Apoteker Penanggung Jawab (APJ) ➔ Finance Staff
* **Alur Bisnis & Seam:**
  1. BusDev mengajukan permintaan sample produk untuk calon klien: nama produk, tekstur, target khasiat, aroma, kemasan sample.
  2. Sistem menerbitkan kode `SMP-YYYYMMDD-XXXX`.
  3. **Biaya Sample (Sample Fee)**: BusDev mengisi nominal biaya sample.
  4. Keuangan menerima notifikasi di `/finance/bayar-sample`: Verifikasi pembayaran sample fee oleh klien.
  5. Begitu status pembayaran `VERIFIED`, tiket otomatis terbuka di dashboard R&D (`/rnd/formula`).

#### Halaman 2.2: Formulasi R&D & Formula Lock (First Pass Right / FPR)
* **URL Frontend:** `/rnd/formula` (SCR-027)
* **Aktor / Role:** RnD Chemist (`Role 9`), RnD Manager (`Role 8`), Apoteker (APJ `Role 12`)
* **Spesifikasi Bisnis (BUS-RULE-108, 109, 114):**
  - Pembuatan formula komposisi bahan baku (BOM Formula).
  - Jika sample revisi: catat nomor revisi (Rev 1, Rev 2, Rev 3).
  - **Formula Lock**: Persetujuan bersama oleh RnD Manager dan APJ. Setelah dikunci, komposisi menjadi read-only dan siap ditarik ke SPK Produksi Pabrik.

#### Halaman 2.3: Creative Design Board & Legalitas BPOM
* **URL Frontend:** `/creative/board` & `/legality/permits` (SCR-180, 183)
* **Aktor / Role:** Tim Desain (PIC Mas Edi), Legalitas Admin
* **Spesifikasi Khusus (REQUIREMENT.md Poin 63, 71–76):**
  - Checklist desain kemasan per SO (tampilkan foto kemasan, label, karton box).
  - Pelacakan nomor izin edar BPOM dan status notifikasi (tambahkan kolom recheck status dan tanggal terbit).
  - Status desain disetujui (Approved) oleh BusDev dan Purchasing.

---

### TAHAP 3: SALES PIPELINE & ORDER MANAGEMENT

#### Halaman 3.1: Quotation (Surat Penawaran Harga)
* **URL Frontend:** `/penjualan/quotation` (SCR-028)
* **Aktor:** BusDev Staff / Sales Admin
* **Input:** Customer terpilih, item produk (formula locked), quantity MOQ, harga penawaran per pcs, estimasi lead time produksi.

#### Halaman 3.2: Sales Order (SO) & Universal Code
* **URL Frontend:** `/penjualan/sales-orders` (SCR-030)
* **Aktor:** Sales Admin, BusDev Manager
* **Spesifikasi Khusus (REQUIREMENT.md Poin 42, 56–62):**
  - Penomoran otomatis: `DL-SLS-SO-DDMMYYYY-XXXX` atau `SO-DDMMYYYY-XXXX`.
  - Satu SO memiliki **1 checklist progress utama** dengan detail breakdown multi-kategori (Formula, Desain Kemasan, Pengadaan Bahan, Produksi, QC, Pengiriman).
  - Deadline per PIC (PIC Desain, PIC Bahan Baku, PIC Produksi).
  - Input field menggunakan sistem **search/autocomplete**.
* **SEAM LINTAS DIVISI (Sales Order ➔ Pabrik & Keuangan):**
  - Begitu SO berstatus `APPROVED`:
    1. Bridge field `sales_details_id` memicu draft Work Order di modul Produksi `/production/spk`.
    2. Modul Pengadaan `/pembelian/kalkulasi-mrp` menerima kebutuhan bahan baku (BOM x Qty Pesanan).
    3. Modul Keuangan `/penjualan/bayar-penjualan` menerima tagihan Down Payment (DP Penjualan).

#### Halaman 3.3: Pembayaran DP Penjualan (Down Payment)
* **URL Frontend:** `/penjualan/bayar-penjualan` (SCR-029)
* **Aktor:** Finance Staff
* **Spesifikasi Khusus (REQUIREMENT.md Poin 14, 27):**
  - Navbar filter dipisahkan menjadi 3 kategori: **Sample**, **Legalitas**, dan **Produksi**.
  - Pola tampilan: 4 Card Ringkasan Status di atas + Navbar Tab Filter di bawahnya dengan urutan selaras.
  - Pelunasan DP memicu auto-journal penerimaan kas ke General Ledger.

---

### TAHAP 4: SCM PROCUREMENT & PURCHASE ORDER

#### Halaman 4.1: Kalkulasi MRP & Kebutuhan Bahan
* **URL Frontend:** `/pembelian/kalkulasi-mrp` (SCR-048)
* **Logika Sistem:**
  $$\text{Kebutuhan Beli} = (\text{Qty Pesanan SO} \times \text{BOM Komposisi}) - \text{Stok Bebas Gudang} - \text{PO On-Order}$$

#### Halaman 4.2: Pembuatan Purchase Order (PO Supplier)
* **URL Frontend:** `/pembelian/purchase-orders` (SCR-050)
* **Aktor:** Purchasing Staff (`Role 6`), Purchasing Admin (`Role 5`)
* **Spesifikasi Khusus (REQUIREMENT.md Poin 10, 41, 45, 46, 67):**
  - Tanggal PO **read-only**, otomatis terisi tanggal hari ini (`today`).
  - Ganti label "jatuh tempo" menjadi "**Deadline**".
  - Field wajib: **Diskon (dalam Rupiah, bukan persen)** dan **Ongkir**. Diskon otomatis mengurangi ongkos kirim.
  - Tanda tangan digital pada dokumen PO sebelum dikirim ke supplier.
  - History status: pending, approved, PO dikirim, barang diterima, lunas.
* **SEAM LINTAS DIVISI (PO ➔ Gudang):**
  - PO yang berstatus `SENT_TO_SUPPLIER` otomatis memunculkan tiket penerimaan barang pending di modul Gudang `/warehouse/receipts`.

---

### TAHAP 5: GUDANG / WAREHOUSE (GRN TIGA PILAR & STOK REAL)

#### Halaman 5.1: Penerimaan Barang Masuk (Goods Receipt Note / GRN)
* **URL Frontend:** `/warehouse/receipts` (SCR-053)
* **Aktor:** Warehouse Staff (`Role 8`), Warehouse Admin (`Role 7`)
* **Spesifikasi Khusus (REQUIREMENT.md Poin 48, 51, 54, 70):**
  - Saat barang dari supplier tiba, petugas gudang wajib menginput kuantitas fisik dalam **3 Pilar**:
    1. **Qty Bagus**: Barang utuh memenuhi standar QC (menambah stok siap pakai).
    2. **Qty Reject / Cacat**: Barang rusak/bocor/kadaluarsa (masuk karantina reject, **TIDAK DIBAYAR** ke supplier).
    3. **Qty Free (Gratis)**: Barang bonus/sampel dari supplier (menambah stok siap pakai, nilai tagihan Rp 0).
  - Tampilan tabel barang menggunakan kolom **Real Stok**.
  - Input penerimaan barang gratis langsung dicatat pada dokumen GRN ini.
* **SEAM LINTAS DIVISI (GRN ➔ Finance AP & Produksi):**
  - **Keuangan (`/pembelian/faktur`):** Menerbitkan Faktur Hutang AP hanya untuk `Qty Bagus` dikalikan harga satuan PO. Barang reject otomatis dipotong dari tagihan.
  - **Produksi (`/production/spk`):** Indikator bahan baku untuk SPK terkait berubah menjadi hijau (*Ready for Mixing*).

---

### TAHAP 6: EKSEKUSI PRODUKSI & QUALITY CONTROL (QC LAB)

#### Halaman 6.1: Surat Perintah Kerja (SPK) & Batch Record
* **URL Frontend:** `/production/spk` (SCR-070)
* **Aktor:** Production Admin (`Role 17`)
* **Alur Eksekusi:**
  - Penerbitan SPK berdasarkan `sales_details_id` dari SO.
  - Menentukan batch number, tanggal mulai produksi, dan alokasi mesin.
  - Mengunci bahan baku dari gudang (Stock Reservation).

#### Halaman 6.2: 3 Tahapan Proses Produksi (Mixing ➔ Filling ➔ Packaging)
* **URL Frontend:** `/production/mixing`, `/production/filling`, `/production/packaging` (SCR-072..075)
* **Aktor:** Production Operator Mixing (`Role 15`), Filling (`Role 16`), Packaging (`Role 17`)
* **Spesifikasi Eksekusi:**
  - Operator mencatat pemakaian bahan aktual vs target formula.
  - Jika ada penyusutan/loss, dicatat persentasenya (OEE calculation).
  - Tahap pengemasan (Packaging) tidak boleh berstatus selesai (*Done*) sebelum kemasan (botol, label, karton) tersedia dan lolos cek.

#### Halaman 6.3: QC Lab, Uji Sampel & Pelepasan Karantina (Release)
* **URL Frontend:** `/quality/release` (SCR-080)
* **Aktor:** Quality Control Staff, Apoteker (APJ)
* **Aturan Bisnis (BUS-RULE-077, BUS-RULE-078):**
  - Uji mikrobiologi, pH, viskositas, dan kestabilan kemasan.
  - Jika lolos: status produk berubah menjadi `RELEASED_TO_FINISHED_GOODS`.
  - **SEAM ke Gudang & Pengiriman:** Barang jadi berpindah ke tabel stok gudang barang jadi (`warehouse_finished_goods`), siap dibuatkan Surat Jalan Pengiriman.

---

### TAHAP 7: PENGIRIMAN (DELIVERY ORDER) & PENAGIHAN (AR INVOICE)

#### Halaman 7.1: Surat Jalan / Delivery Order (DO)
* **URL Frontend:** `/pengiriman/delivery-orders` (SCR-038)
* **Aktor:** Warehouse Outbound / Logistik
* **Input:** Pilih nomor SO yang barang jadinya sudah QC Release, masukkan tanggal kirim, nomor resi/kendaraan, nama kurir.
* **Output:** Cetak Surat Jalan resmi format standar perusahaan.

#### Halaman 7.2: Faktur Penjualan (Sales Invoice / AR Hub)
* **URL Frontend:** `/penjualan/faktur` & `/finance/ar-hub` (SCR-035)
* **Aktor:** Finance Staff
* **Spesifikasi Khusus (REQUIREMENT.md Poin 4, 9, 13, 26):**
  - Tanggal invoice dapat diubah manual (custom), tidak read-only.
  - Detail faktur mencantumkan rincian barang, harga satuan, nilai DP yang sudah dibayar, sisa tagihan, dan diskon.
  - Navbar filter: **Semua Tagihan**, **Sudah Dibayar**, **Belum Dibayar** (dilengkapi field catatan/alasan kenapa belum dibayar).
  - Tampilan AR Aging dengan pewarnaan jatuh tempo:
    - **H-3**: Merah
    - **H-7**: Kuning
    - **Lewat Jatuh Tempo**: Teks tebal (bold) dengan animasi bouncing.
  - Card ringkasan AR Aging muncul juga pada modul BusDev.

---

### TAHAP 8: KEUANGAN, KAS/BANK, PENGAJUAN DANA & AUTO-JOURNAL

#### Halaman 8.1: Kas & Bank (Kas Masuk / Kas Keluar)
* **URL Frontend:** `/finance/bank-accounts` & `/finance/cash-banks` (SCR-103, 104)
* **Spesifikasi Khusus (REQUIREMENT.md Poin 18, 19, 20):**
  - Card "Kas Bank Masuk" dan "Kas Bank Keluar" hanya menampilkan total kas dengan filter rentang kalender lengkap.
  - Navbar menampilkan informasi **Saldo Bank** terkini secara real-time.
  - Rekonsiliasi Bank: filter tanggal lengkap dan filter berdasarkan akun COA.

#### Halaman 8.2: Pengajuan Dana Operasional (Multi-Tier Approval)
* **URL Frontend:** `/finance/pengajuan-dana` (SCR-116)
* **Spesifikasi Alur (REQUIREMENT.md Poin 22–24):**
  - Formulir pengajuan dana dengan tingkatan approval otomatis:
    - **Jika diajukan oleh Staff**: Harus disetujui **Head/Manager** ➔ lanjut ke **Accounting** ➔ disahkan oleh **Direktur**.
    - **Jika diajukan oleh Head/Manager**: Langsung ke **Accounting** ➔ disahkan oleh **Direktur** (tanpa perlu approval Head lain).
  - Status pengajuan: `DRAFT` ➔ `PENDING_HEAD` ➔ `PENDING_ACCOUNTING` ➔ `PENDING_DIRECTOR` ➔ `DISBURSED`.

#### Halaman 8.3: General Ledger & Jurnal Umum Otomatis (9 Triggers)
* **URL Frontend:** `/finance/accounting/general-ledger` (SCR-105)
* **Spesifikasi (REQUIREMENT.md Poin 25, 33–35, DEC-015):**
  - Filter periode tanggal custom.
  - Menghapus input manual "Dimensi Finansial".
  - Format Laporan Laba Rugi: Mengikuti format gabungan sistem lama G-SERP, posisi card ditukar: **Total Beban HPP** di kiri dan **Laba Operasional Bersih** di kanan.
  - **9 Pemicu Auto-Journal**:
    1. Pengakuan Piutang Penjualan (AR) saat Invoice terbit.
    2. Kas Masuk saat pembayaran DP / pelunasan klien.
    3. Pengakuan Hutang Pembelian (AP) saat GRN Bagus disetujui.
    4. Kas Keluar saat membayar supplier.
    5. Transfer Bahan Baku Gudang ke WIP Produksi saat SPK dimulai.
    6. Transfer WIP ke Barang Jadi saat QC Release disetujui.
    7. Pembebanan Biaya Pokok Penjualan (COGS / HPP) saat Surat Jalan terbit.
    8. Pencatatan Scrap/Reject gudang sebagai beban kerugian.
    9. Pengeluaran kasbon & biaya operasional kantor.
  - **Invarian Wajib**: $\sum \text{Debit} - \sum \text{Credit} = 0$ (Harus seimbang sempurna).

---

### TAHAP 9: SDM / HR & EVENT-DERIVED KPI GOVERNANCE

#### Halaman 9.1: Master Data Karyawan, Training & Kontrak
* **URL Frontend:** `/hr/karyawan` (SCR-175)
* **Spesifikasi Khusus (REQUIREMENT.md Poin 81):**
  - Data karyawan lengkap: tanggal lahir (hitung umur otomatis), jenis kontrak (PKWT/Tetap), durasi kontrak.
  - Masa onboarding standar 3 hari.
  - Pencatatan jam pelatihan (training): durasi jam, target/goal, upload sertifikat.
  - Notifikasi otomatis untuk pengingat kontrak habis pada H-30.

#### Halaman 9.2: Payroll Komprehensif & Pemotongan Kasbon
* **URL Frontend:** `/hr/payroll` (SCR-177)
* **Spesifikasi Khusus (REQUIREMENT.md Poin 82):**
  - Komponen Upah Tetap: Gaji Pokok + Tunjangan Jabatan.
  - Tunjangan Transport: 2 kolom terpisah yaitu **Transport Flat** dan **Transport Tentatif** (berbasis kehadiran aktual).
  - Overtime (Lembur) terhubung ke presensi shift.
  - **Cicilan Pinjaman / Kasbon**: Dipotong otomatis dari total gaji bulanan, dilengkapi tampilan sisa hutang karyawan.
  - Kolom BPJS Kesehatan & BPJS Ketenagakerjaan wajib ada di slip gaji.
  - Aturan PPh 21: Di atas UMR/PTKP dipotong pajak, di bawah UMR bebas potongan.
  - Cetak Slip Gaji resmi.

#### Halaman 9.3: Leaderboard KPI Karyawan Berbasis Event Operasional
* **URL Frontend:** `/hr/kpi` & `/executive/dashboard` (SCR-179, SCR-DASH-001)
* **Spesifikasi Khusus (REQ-035, REQ-036, REQUIREMENT.md Poin 83):**
  - **Dilarang Skor Manual**: Nilai KPI dihitung murni dari log event operasional (misal: jumlah lead dikonversi BusDev, OTD pengiriman tepat waktu logistik, First Pass Right R&D, kepatuhan BMR produksi).
  - Grafik tren bulanan dan papan peringkat (*Top Performers Rank*).

---

## 5. ARSITEKTUR PENGUJIAN OTOMATIS PLAYWRIGHT / BROWSER-USE

Pengujian otomatis dibangun menggunakan **Playwright Test Suite** modular yang mengeksekusi 1 rantai pasok penuh dari hulu ke hilir tanpa terputus.

### 5.1 Struktur File Uji Otomasi Browser
```
frontend/tests/e2e/golden-thread/
├── 01-master-data-and-busdev.spec.ts       # Uji Buku Tamu, Customer, Vendor
├── 02-rnd-sample-and-creative.spec.ts      # Uji Sample Fee, Formulasi Lock, Desain & BPOM
├── 03-sales-order-and-dp.spec.ts           # Uji Quotation, SO Universal Code, Pembayaran DP
├── 04-procurement-and-warehouse.spec.ts    # Uji MRP, PO Deadline/Diskon, GRN Tiga Pilar
├── 05-production-and-qc-release.spec.ts    # Uji SPK BMR, Mixing, QC Release Finished Goods
├── 06-delivery-and-ar-invoice.spec.ts      # Uji Surat Jalan DO, Faktur AR, AP Matching
├── 07-finance-and-auto-journal.spec.ts     # Uji Kas Masuk/Keluar, Pengajuan Dana, Auto-Journal
├── 08-hr-payroll-and-kpi.spec.ts           # Uji Gaji, Kasbon, Slip Gaji, KPI Leaderboard
└── full-lifecycle-golden-thread.spec.ts    # Master Runner Eksekusi Simultan (Exit Code 0)
```

### 5.2 Contoh Skenario Uji Playwright (Seam Validation):
```typescript
import { test, expect } from '@playwright/test';

test.describe('NEX ERP — Golden Thread Seam Test', () => {
  const testId = Date.now();
  const clientBrand = `Brand Glowing ${testId}`;

  test('Step 1: Input Buku Tamu & Konversi ke Lead', async ({ page }) => {
    await page.goto('/penjualan/guest-book');
    await page.click('button:has-text("Buat Buku Tamu")');
    
    // Isi Form
    await page.fill('input[placeholder="Ibu Amanda Putri"]', `Ibu Dewi ${testId}`);
    await page.fill('input[placeholder="0812-xxxx-xxxx"]', '081299887766');
    await page.fill('input[placeholder="PT Kosmetika Cantik"]', clientBrand);
    await page.selectOption('select', 'BRANDED');
    await page.click('button:has-text("Simpan Buku Tamu")');

    // Assertion 1: Toast Success & Muncul di Tabel
    await expect(page.locator('text=Catatan kunjungan tamu berhasil disimpan')).toBeVisible();
    await expect(page.locator(`text=${clientBrand}`)).toBeVisible();

    // Assertion 2: Seam Lintas Divisi — Konversi ke Lead
    await page.click(`tr:has-text("${clientBrand}") button:has-text("Konversi Lead")`);
    await page.goto('/marketing/omnicrm');
    await expect(page.locator(`text=${clientBrand}`)).toBeVisible();
  });

  test('Step 2: Penerimaan Barang GRN Tiga Pilar & Verifikasi Hutang AP', async ({ page }) => {
    await page.goto('/warehouse/receipts');
    await page.click('button:has-text("Penerimaan Baru")');
    
    // Input 3 Pilar (Bagus: 100, Reject: 10, Free: 5)
    await page.fill('input[name="qtyBagus"]', '100');
    await page.fill('input[name="qtyReject"]', '10');
    await page.fill('input[name="qtyFree"]', '5');
    await page.click('button:has-text("Simpan Penerimaan")');

    // Assertion Stok Gudang
    await page.goto('/warehouse/stock');
    await expect(page.locator('td:has-text("105")')).toBeVisible(); // 100 Bagus + 5 Free

    // Assertion Seam Keuangan: Hutang AP Hanya Menagih 100 Pcs
    await page.goto('/pembelian/faktur');
    const invoiceRow = page.locator('tr:has-text("Tagihan GRN")');
    await expect(invoiceRow).toContainText('100 Pcs'); // Reject 10 TIDAK dibayar
  });
});
```

---

## 6. MATRIKS PEMERIKSAAN KESESUAIAN REQUIREMENT.MD (TRACEABILITY AUDIT)

| Bab / No | Isi Kebutuhan Bisnis (`REQUIREMENT.md`) | Status Verifikasi Kode | Target Implementasi & Bukti Test |
|---|---|:---:|---|
| **1.1** | Import vendor via Excel | AKTIF | `POST /api/v1/suppliers/import` ➔ Form upload di `/master/vendors` |
| **1.2** | Master Customer: Card Sample, Produksi, Legalitas | AKTIF | 3 Sub-card terhubung di `/master/customers` |
| **1.3** | Kategori vendor/pengadaan hanya berbasis COA | AKTIF | Dropdown COA selector di Master Supplier |
| **2.1** | Tanggal pembuatan faktur pembelian bisa diubah manual | AKTIF | Input date picker bebas di `/pembelian/faktur` |
| **2.3** | Detail faktur ada rincian barang & diskon Rupiah | AKTIF | Tabel baris barang + diskon nominal Rupiah |
| **2.4** | Navbar filter Semua/Sudah/Belum dibayar + notes alasan | AKTIF | Tab filter status + text area alasan belum lunas |
| **2.5** | Sembunyikan informasi akurasi 3-way match | AKTIF | Hidden dari tampilan DOM |
| **2.6** | Pola 4 Card ringkasan atas + tab filter selaras di bawah | AKTIF | DnaKpiGrid + DnaTabs selaras di `/penjualan/bayar-penjualan` |
| **3.1** | AP Aging: H-3 merah, H-7 kuning, lewat jatuh tempo bouncing | AKTIF | CSS badge warna & animation bounce di `/finance/ap-aging` |
| **3.3** | Saldo bank tampil di navbar AP Aging | AKTIF | Widget header real-time saldo kas bank |
| **4.2** | DP Penjualan: Tab navbar Sample, Legalitas, Produksi | AKTIF | 3 Tab kategori DP di `/penjualan/bayar-penjualan` |
| **4.5** | AR Aging muncul di modul BusDev | AKTIF | Sub-dashboard widget di `/bussdev/dashboard` |
| **7.2** | Approval Pengajuan Dana: Staff (3-tier) vs Head (2-tier) | AKTIF | State machine workflow di `/finance/pengajuan-dana` |
| **8.3** | Hapus input "Dimensi Finansial" di Jurnal Umum | AKTIF | Input dihapus total dari form jurnal umum |
| **9.1** | Semua input menggunakan mode autocomplete | AKTIF | DnaAutocomplete menggantikan input teks biasa |
| **9.2** | Semua menu dilengkapi filter rentang periode | AKTIF | DnaDateRangeFilter terpasang di seluruh header list |
| **12.1**| Modul Pajak dan e-Faktur di-skip dari scope | SKIPPED | Sesuai keputusan resmi, tidak dibangun pada fase ini |
| **13.1**| Input PO diskon & ongkir, diskon Rupiah kurangi ongkir | AKTIF | Kalkulasi matematika otomatis di form PO |
| **13.4**| Penerimaan Gudang rincian: Bagus, Reject, Free | AKTIF | Tiga Pilar Gudang tersimpan di database `goods_receipts` |
| **13.6**| Kolom Real Stok menggantikan kondisi bagus/cacat | AKTIF | Tabel stok gudang menggunakan kolom `real_stock` |
| **13.14**| Format Kode Universal: Lengkap & Ringkas, nomor urut global | AKTIF | Generator kode backend `UniversalCodeService` |
| **15.2**| Buku Tamu filter bulan dan search nama klien | AKTIF | Filter bulan & search query di `/penjualan/guest-book` |
| **16.3**| Gaji: Transport Flat & Tentatif, potongan cicilan kasbon | AKTIF | Perhitungan slip gaji komprehensif di `/hr/payroll` |

---

## 7. PROTOKOL EKSEKUSI & PEMULIHAN ERROR MANDIRI (SELF-HEALING LOOP)

Agar seluruh proses selesai dalam target 5–6 hari secara solid, AI Agent dan Pengembang menjalankan protokol operasi berikut:

```
                  ┌──────────────────────────────────────────┐
                  │ 1. Pilih 1 Sub-Tahap Alur               │
                  │    (Misal: Tahap 1.1 Buku Tamu)          │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │ 2. Sinkronkan API NestJS & Skema Prisma  │
                  │    - Pastikan endpoint aktif             │
                  │    - Pastikan migrasi DB terpasang       │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │ 3. Hubungkan Frontend & Buang Mock Data   │
                  │    - Pasang apiClient / React Query      │
                  │    - Ganti dummy array dengan DB call    │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │ 4. Jalankan Headless Playwright Test     │
                  │    - Buka form di browser                │
                  │    - Input data riil & klik simpan       │
                  └────────────────────┬─────────────────────┘
                                       │
                       Ada Error? ─────┴───── Sukses (Exit 0)?
                           │                         │
            YA (Crash / 400 / 500)                   │
                           │                         ▼
                           ▼            ┌──────────────────────────────────────────┐
                  ┌──────────────────┐  │ 6. Uji Seam Lintas Divisi                │
                  │ 5. Self-Healing: │  │    - Cek apakah data muncul di Divisi B  │
                  │    Perbaiki kode │  └────────────────────┬─────────────────────┘
                  │    seketika &    │                       │
                  │    ulangi test   │                       ▼
                  └────────┬─────────┘  ┌──────────────────────────────────────────┐
                           │            │ 7. Handover ke User:                     │
                           └──────────► │    "Tahap X sudah 100% Live & Lolos      │
                                        │     Playwright, silakan review!"         │
                                        └──────────────────────────────────────────┘
```

Dengan blueprint terdokumentasi ini, setiap halaman, alur perpindahan data antar divisi, skema database, dan pengujian browser telah terdefinisi secara presisi tanpa ada yang terlewat.
