# LEGACY_ERP_SPEC.md
**Single Source of Truth untuk Migrasi ERP GsERP KIL → NexERP**

> Dokumen ini adalah **pegangan** untuk perancangan dan migrasi penuh ERP lama (`kil.gserp.id`, GsERP KIL v2.0.0) ke ERP baru (NexERP / Nex Matrix). Disusun dari:
> - **Live audit** legacy via cookies `zaki@dreamlab.id` (Sept 2026)
> - Inventory CSV lengkap (`kil_erp_full_inventory_v2.csv`, 174 halaman)
> - Cross-reference dengan `docs/general docs/LEGACY_ERP_AUDIT.md`, `docs/KPI_REFERENCE.md`, `ERP_OLD_BUSINESS_FLOW.md`

**Versi:** 1.0 — 7 September 2026
**Enterprise:** PT. Karya Impian Laboratoris (Dreamlab — Toll Manufacturing Kosmetik & Skincare)

---

## 1. Executive Summary

Legacy ERP GsERP KIL adalah **sistem ERP CodeIgniter 4 + AdminLTE** yang mengelola bisnis maklon kosmetik end-to-end dari **Intake Tamu → Sample Lab → HPP Costing → SO → Pembelian Bahan → Produksi 3 Tahap (Mixing/Filling/Packaging) → Pengiriman → Pembayaran**. Total **174 halaman** di 11 area, dengan 78 halaman operasional, 35 master data, dan 18 laporan keuangan.

### **Karakteristik Utama**
- **Single sign-on session** (CI4 `ci_session` + `csrf_cookie_gs`)
- **Cookie-based CSRF** (`csrf_gs` hidden input, auto-refresh via AJAX)
- **invisible reCAPTCHA v2** (`6LdkxfMpAAAAADsmqCk-NXoVFymJ9RN5VesPdWvt`) — **tidak divalidasi**, bisa di-bypass untuk automation
- **Bahasa Indonesia-first** untuk seluruh UI
- **DataTables** dengan AJAX endpoint pattern: `/{module}/{action}` (e.g. `/guest-book/cities`, `/guest-book/detail`)
- **Modal-based forms** — form input di-load via AJAX ke dalam modal `modal-sm/md/lg/xl` kosong di DOM
- **Kode Universal Global** format: `DL-DIV-PRD-DDMMYYYY-XXXX` (atau ringkas `DIV-DDMMYYYY-XXXX`), sequence global tak reset per-tahun

### **3 Stream Bisnis Maklon Kosmetik (high-level)**
```
1. CRM/Commercial:  Intake (Buku Tamu) → Leads → Sample Fee → R&D Sample → Approved Formula → HPP Request → Quotation
2. Sales Order:     SO + DP Penjualan → Production Preparation
3. Procurement/Plant: Kebutuhan Barang (BOM Explode) → PO → Inbound (GR) → Bayar AP
                    Batch Record → Schedule Mixing → Schedule Filling → Schedule Packaging
                    → Produksi Mixing (Bulk) → Filling → Packaging (FG)
                    → Pengiriman (DO) → Faktur Penjualan → Bayar AR
```

### **Integrasi Keuangan**
- **Auto-journaling**: Setiap transaksi operasional → Jurnal Umum otomatis. Manual entry hanya untuk adjustment/accrual.
- **Double-entry invariant**: Total Debit = Total Kredit (mandatory sebelum submit).
- **Period Lock**: Soft Lock (warning) → Hard Lock (read-only total). Adjustment Journal hanya jalan masuk ke periode Hard Lock.
- **3-Way Matching**: PO ↔ GR ↔ QC Passed ↔ Vendor Invoice (toleransi otomatis, akurasi % di-hide dari UI).
- **AR Delivery Gatekeeper**: Status default `HELD` — Gudang tidak boleh cetak Surat Jalan sebelum Finance set `RELEASED`.

---

## 2. Document Index & Cross-Reference

| Dokumen | Fokus | Digunakan Untuk |
|---|---|---|
| **`docs/LEGACY_ERP_SPEC.md`** (ini) | URL inventory 174 halaman, form fields, business rules, Poin-poin kritikal | Perancangan + migrasi |
| `docs/general docs/LEGACY_ERP_AUDIT.md` | Input/output detail per divisi (SCM, Gudang, Produksi) — versi awal sebelum live audit | Detail flow SCM + Produksi |
| `docs/KPI_REFERENCE.md` | KPI per dashboard (target, threshold, direction higher/lower/zero) | Dashboard design DNA |
| `ERP_OLD_BUSINESS_FLOW.md` | 6 macro business flows end-to-end | Onboarding & training |
| `kil_erp_full_inventory_v2.csv` | Source data — 174 baris, 11 kolom (Area/Menu/Page/URL/Type/Cards/Columns/Inputs/Detail/Actions/Notes) | Reference tabel |

> **PENTING**: Dokumen ini adalah **konsolidasi**. Tidak ada info baru yang hilang — semuanya sudah ada di CSV + docs lama. Yang aku lakukan: **struktur ulang biar kebaca sebagai spec migrasi**.

---

## 3. URL Inventory (174 Halaman)

URL pattern: `https://kil.gserp.id/{path}` — semua path relatif di bawah `/`.

### 3.1 Dasbor (22 halaman)

| URL | Type | Menu | Cards |
|---|---|---|---|
| `/dashboard-guest-book` | Dashboard | D. Buku Tamu | TOTAL LEADS, FOLLOW UP AKTIVITAS, JUMLAH MEETING, CONVERSION RATE |
| `/dashboard-business-development` | Dashboard | D. BusDev | BD Revenue, Total Leads, Conversion Rate, AR Aging Client Summary |
| `/dashboard-client-production` | Dashboard | D. Client Produksi | 14.4% SAMPLE → DEAL, 72 HARI AVG CLOSING, Rp 28J AVG DEAL, 66 projek |
| `/dashboard-client-repeat-order` | Dashboard | D. Client RO | 20 projek |
| `/dashboard-client-sample` | Dashboard | D. Client Sample | 322 in-progress, Rp 130jt pipeline, 19.80% approval rate |
| `/dashboard-client-lost` | Dashboard | D. Lost | 144 item, 119 klien |
| `/dashboard-customer` | Dashboard | D. Pelanggan | 829 total, 10 baru, 1 aktif, Rp 12.6M total sales |
| `/dashboard-digital-marketing` | Dashboard | D. Digital Marketing | Rp 14.5jt ads, 850k impressions, 3.5% CTR, 320 leads |
| `/dashboard-executive` | Dashboard | D. Eksekutif | Rp177jt omzet, Rp61jt pembelian, 1 klien aktif, 0 jadwal produksi selesai |
| `/dashboard-finance` | Dashboard | Finance Overview | Cash Balance, AR/AP Outstanding, Net Cash Forecast 30D |
| `/dashboard-guest-book` | Dashboard | D. Buku Tamu | (sama dengan di atas) |
| `/dashboard-human-resources` | Dashboard | D. HR | — |
| `/dashboard-legality` | Dashboard | D. Legalitas | 45 dokumen, 3 kadaluarsa <30 hari, 1 expired |
| `/dashboard-notification` | Dashboard | D. Notifikasi | 394 stok menipis, 0 produksi terlambat, 1817 sample tertunda, 20 follow-up terlewat |
| `/dashboard-production` | Dashboard | D. Produksi | 0 jadwal mixing/filling/packaging proses, 0 selesai bulan ini |
| `/dashboard-production-realization` | Dashboard | D. Realisasi Produksi | (Calendar view) |
| `/dashboard-production-schedule` | Dashboard | D. Jadwal Produksi | (Calendar view) |
| `/dashboard-purchasing` | Dashboard | D. Purchasing | 176 supplier aktif, Rp61jt PO bulan ini, 0 PR pending, 681 PO selesai |
| `/dashboard-rnd` | Dashboard | D. RnD | 6,116 barang/formula, 0 sample pending, 261 in-progress, 474 selesai |
| `/dashboard-sales-product` | Dashboard | D. Penjualan Barang | 5 bulan ini, 0 pending, 252 in-progress, Rp 177jt nilai, Rp 12.6M total |
| `/dashboard-sales-sample` | Dashboard | D. Penjualan Sample | 39 bulan ini, 1,854 in-progress, 61 revisi |
| `/dashboard-sample` | Dashboard | D. Sample | — |
| `/dashboard-warehouse` | Dashboard | D. Gudang | 6,116 jenis barang, 3.56jt kuantitas stok, 394 low stock, 319 mutasi bulan ini |

### 3.2 Master Data (35 halaman)

| URL | Type | Menu |
|---|---|---|
| `/cost-allocation-setup` | Overhead Allocation Rules | Cost Allocation Setup |
| `/asset-register` | Master List & Asset History | Asset Register |
| `/asset-register/create` | Form | Buat Asset Register |
| `/compliance-asset` | Compliance & Amortization Tracker | Compliance / Intangible Asset |
| `/goods-category-manage` | Master List | Kategori Barang |
| `/goods-category-manage/create` | Form | Buat Kategori Barang |
| `/goods-manage` | Master List | Barang |
| `/goods-manage/create` | Form | Buat Barang |
| `/coa-auto-manage` | Master List | CoA Jurnal Otomatis |
| `/coa-manage` | Master List | CoA |
| `/coa-manage/create` | Form | Buat CoA |
| `/warehouse-access-manage` | Master List | Hak Akses Gudang |
| `/warehouse-manage` | Master List | Gudang |
| `/warehouse-manage/create` | Form | Buat Gudang |
| `/bank-account-manage` | Master List | Bank Account Master |
| `/bank-account-manage/create` | Form | Buat Bank Account |
| `/tax-setup` | Master List | Tax Setup |
| `/customer-category-manage` | Master List | Kategori Pelanggan |
| `/customer-category-manage/create` | Form | Buat Kategori Pelanggan |
| `/customer-manage` | Master List | Pelanggan |
| `/customer-manage/create` | Form | Buat Pelanggan |
| `/customer-my-manage` | Master List | Pelanggan Saya |
| `/customer-my-manage/create` | Form | Buat Pelanggan Saya |
| `/role-manage` | Master List | Hak Akses |
| `/role-manage/create` | Form | Buat Hak Akses |
| `/user-manage` | Master List | Pengguna |
| `/user-manage/create` | Form | Buat Pengguna |
| `/sales-category` | Master List | Kategori Penjualan |
| `/sales-category/create` | Form | Buat Kategori Penjualan |
| `/sales-target` | Master List | Target Penjualan |
| `/sales-target/create` | Form | Buat Target Penjualan |
| `/supplier-category-manage` | Master List | Kategori Supplier |
| `/supplier-category-manage/create` | Form | Buat Kategori Supplier |
| `/supplier-manage` | Master List | Supplier |
| `/supplier-manage/create` | Form | Buat Supplier |

### 3.3 Persetujuan (8 halaman)

| URL | Type | Menu |
|---|---|---|
| `/purchase-approval` | Approval List | Pembelian ~ |
| `/sales-approval` | Approval List | Penjualan Produk ~ |
| `/sales-sample-approval` | Approval List | Penjualan Sample ~ |
| `/goods-request-approval` | Approval List | Permintaan Barang ~ |
| `/request-cogs-approval` | Approval List | Permintaan HPP ~ |
| `/purchase-request-approval` | Approval List | Permintaan Pembelian ~ |
| `/purchase-return-approval` | Approval List | Retur Pembelian ~ |
| `/sales-return-approval` | Approval List | Retur Penjualan ~ |

### 3.4 Umum — Checklist (8 halaman)

| URL | Type | Menu |
|---|---|---|
| `/checklist` | List | Checklist |
| `/checklist/create` | Form | Buat Checklist |
| `/checklist-progress` | List | Checklist Progress |
| `/checklist-tracking` | Tracking Matrix | Checklist Tracking |
| `/closing-checklist` | Financial Checklist & Period Governance | Closing Checklist & Period Lock |
| `/checklist-category` | List | Kategori Checklist |
| `/checklist-category/create` | Form | Buat Kategori Checklist |
| `/checklist-manage` | List | Kelola Checklist |

### 3.5 Operasional (78 halaman — TERBESAR)

**Akuntansi (12 halaman):**
- `/adjustment-journal` — Adjustment Journal (Special Approval)
- `/asset-transfer-disposal` — Asset Transfer / Disposal
- `/bank-reconciliation` — Bank Reconciliation (Two-Column Engine)
- `/client-escrow` — Client Escrow / Pass-Through Ledger
- `/depreciation-schedule` — Depreciation Schedule & Batch Runner
- `/general-journal` + `/create` — Jurnal Umum
- `/other-deposit` + `/create` — Kas Bank Masuk
- `/other-payment` + `/create` — Kas Bank Keluar
- `/tax-transactions` — Tax Ledger & Reconciliation

**Barang Keluar (8):** `/delivery-out` + `/create`, `/goods-transfer` + `/create`, `/purchase-return-out`, (purchasing retur out is here)

**Barang Masuk (2):** `/purchase-in` (Penerimaan), `/sales-return-in` (Retur Penjualan)

**Budgeting (1):** `/budget-entry`

**Buku Tamu (2):** `/guest-book` + `/create`

**Client Lost/RO/Produksi/Sample (4):** `/client-lost`, `/client-production`, `/client-repeat-order`, `/client-sample`

**Kebutuhan Barang (2):** `/need-for-goods` + `/create`

**Leads (2):** `/leads` + `/create`

**Pembelian (8):** `/purchase-down-payment` + `/create`, `/purchase-invoice`, `/purchase-payment`, `/purchase-return` + `/create`, `/purchase/create`, (purchase list at `/purchase`)

**Pengajuan Dana (2):** `/fund-request` + `/create`

**Penjualan (12):** `/collections`, `/sales` (List SO), `/sales-down-payment` + `/create`, `/sales-invoice`, `/sales-payment`, `/sales-return` + `/create`, `/sales-sample` + `/create`, `/sales-sample-payment` (Sample Fee), `/sales/create` (Buat SO)

**Penyesuaian Stok (2):** `/stock-adjustment` + `/create`

**Permintaan Barang (2):** `/goods-request` + `/create`

**Permintaan Pembelian (2):** `/purchase-request` + `/create`

**Pra Produksi (14):** `/batch-record` + `/create`, `/design-manage` + `/create`, `/formulation`, `/formulation-adjustment`, `/formulation-manage`, `/request-cogs` + `/create`, `/schedule-filling` + `/create`, `/schedule-mixing` + `/create`, `/schedule-packaging` + `/create`, `/job-order-costing`

**Produksi (3):** `/production-filling`, `/production-mixing`, `/production-packaging`

**Stok Opname (2):** `/stock-opname` + `/create`

### 3.6 Laporan (18 halaman)

| URL | Type | Menu |
|---|---|---|
| `/report-need-for-goods` | Report | Kebutuhan Barang |
| `/report-follow-up-customer` | Report | Follow Up Pelanggan |
| `/report-guest-book` | Report | Buku Tamu |
| `/budget-vs-actual` | Variance Analysis | Budget vs Actual |
| `/cost-variance` | Variance Investigation | Cost Variance |
| `/product-customer-profitability` | Profitability Matrix | Product / Customer Profitability |
| `/report-ap-aging` | Aging Matrix | AP Aging Report |
| `/report-ar-aging` | Aging Matrix | AR Aging Report |
| `/report-balance-sheet` | Report | Neraca |
| `/report-cash-flow` | Cash Flow Statement | Cash Flow |
| `/report-general-ledger` | Report | Buku Besar |
| `/report-profit-loss` | Report | Laba Rugi |
| `/report-sales-summary` | Sales Financial Summary | Report Penjualan |
| `/report-trial-balance` | Report | Neraca Saldo |
| `/report-goods-receipt` | Goods Receipt Ledger | Report Penerimaan Barang |
| `/report-mutation-goods` | Report | Mutasi Barang |
| `/report-stock` | Report | Stok |
| `/report-stock-valuation` | Report | Stok Valuation |

### 3.7 Pengaturan (4 halaman)

| URL | Type | Menu |
|---|---|---|
| `/account` | Form | Akun Saya |
| `/activity-log` | List | Catatan Aktifitas |
| `/setting` | Form | Pengaturan |
| `/company` | Form | Perusahaan |

### 3.8 Beranda (2 halaman)

| URL | Type | Menu |
|---|---|---|
| `/` | List (Dashboard Aggregate) | Beranda — agregasi 80+ menu shortcut |
| `/purchase` | List | Buat Pembelian (List view) |

---

## 4. Universal Coding & Format

### 4.1 Kode Universal Global
**Format lengkap:** `DL-{DIV}-{PRD}-{DDMMYYYY}-{XXXX}`
**Format ringkas:** `{DIV}-{DDMMYYYY}-{XXXX}`

| Contoh | Divisi |
|---|---|
| `DL-SAL-SO-01092026-0001` | Sales (Sales Order) |
| `DL-PRD-PO-01092026-0001` | Production (PO) |
| `DL-FIN-AST-01092026-0001` | Finance Asset |
| `PRD-PO-01092026-0001` | Ringkas PO |

> **Nomor urut global & berkelanjutan (tidak reset per tahun).**

### 4.2 CoA (Chart of Accounts) Auto Numbering
| Prefix | Tipe |
|---|---|
| `1xxx` | Asset |
| `2xxx` | Liability |
| `3xxx` | Equity |
| `4xxx` | Revenue |
| `5xxx` | Expense |

### 4.3 Default Useful Life (Aset Tetap)
- Inventaris: 4 tahun
- Motor: 4 tahun
- Mobil: 8 tahun
- Bangunan Permanen: 20 tahun

### 4.4 Kode CoA Auto-Number Examples
- DP Pembelian: `DPB-YYMM-XXXX`
- Sales Sample: `SS-XXX`
- Batch Record: `BR-XXX`
- Jadwal Mixing: `SM-XXX`
- Produksi Mixing: `PM-XXX`
- Schedule Filling: `SF-XXX`
- Schedule Packaging: `SP-XXX`
- HPP Request: `HPP-REQ-XXX`
- Buku Tamu: `BT-XXX`

---

(Dokumen berlanjut di section 5: Critical Business Rules per Modul →)

---

## 5. Critical Business Rules per Modul (Poin-poin dari live audit)

### 5.1 MASTER DATA — Universal Rules

| # | Rule | Affected Modules |
|---|---|---|
| **Poin 1, 47** | **Supplier kategorisasi berdasarkan COA saja** (bukan riil Bahan Baku/Primer/Sekunder/Pembantu). Kategori Riil (Raw Material/Packaging/Jasa/Lainnya) dipisah dari Kategori COA (Akun GL default per vendor). | `/supplier-manage*` |
| **Poin 2** | Customer master **wajib punya field klasifikasi Sample, Produksi, Legalitas** — 3 cards khusus di detail (Sample Fee, Produksi JO, Legalitas Escrow) | `/customer-manage*` |
| **Poin 3** | **PKP Status menentukan perhitungan otomatis PPN Masukan** pada Faktur Pembelian | `/supplier-manage/create` |
| **Poin 28-30** | Asset Code: Universal Global Sequence, format `DL-FIN-AST-...` urut global tanpa reset. Sub-tab Purchase History mencatat kapitalisasi komponen besar. | `/asset-register*` |
| **Poin 35** | **Modul Pajak dan e-Faktur TIDAK PERLU DIKERJAKAN** (di-skip dari scope pengerjaan sesuai arahan final). PPh 21 cukup rekap dari payroll HR, tanpa integrasi DJP. | `/tax-setup`, `/tax-transactions` |
| **Auto Numbering CoA** | `1xxx` Asset, `2xxx` Liability, dst. Delete hanya jika belum ada transaksi (FK constraint); jika sudah ada → deactivate (bukan hard delete). | `/coa-manage*` |
| **Allow Manual Journal flag** | Default false untuk akun AP Control, AR Control, WIP — mencegah transaksi manual sembarangan. CoA tertentu butuh manual accrual (override ke true). | `/coa-manage/create` |
| **CoA Auto Rules** | Minimal 1 rule aktif per Document Type sebelum transaksi live. Posting otomatis (jurnal) saat Faktur/Bayar dibuat. | `/coa-auto-manage` |

### 5.2 COMMERCIAL / BUSDEV — Buku Tamu → SO → Pembayaran

| # | Rule | Affected |
|---|---|---|
| **Poin 38, 70** | **Sales Order wajib punya Deadline per PIC** (Desain, Formulasi, Pengadaan, Produksi) — bukan hanya deadline final. Format kode universal SO `DL-SAL-SO-...`. | `/sales`, `/sales/create` |
| **Poin 77** | Buku Tamu harus ada **filter bulan/periode (date range custom) + search by nama**. | `/guest-book` |
| **Poin 78** | Form Create Buku Tamu harus ada **fitur auto-save draft state** saat user keluar dari form input. | `/guest-book/create` |
| **Sample Fee Logic** | Client bayar fee trial lab → **ditahan di Sample Fee - Unearned** (liability). Saat lanjut produksi massal → di-offset ke DP Produksi (pengurang DP, bukan revenue terpisah). Jika expired → diakui Revenue murni. | `/sales-sample-payment` |
| **DP Penjualan Tabs** | **3 tab navbar**: Sample \| Legalitas \| Produksi. Tab Legalitas terhubung ke logic Escrow (lihat 5.6 Akuntansi). Tab Sample terhubung ke Sample Fee. Tab Produksi untuk Job Order. | `/sales-down-payment` |
| **DP Penjualan Create** | Multi-line form: Tipe, Nama Item, Netto, Harga, Qty, Total. Auto-generated dari Bayar Penjualan. | `/sales-down-payment/create` |
| **Sales Sample Approval** | Detail modal: Formulator, Tanggal, Pembuat, Harga, Diskon, Subtotal, Pajak, Total + Info Produk (Netto, Form, Color, Flavor, Target, Ref) + Material Request, Claim + Riwayat Revisi. | `/sales-sample-approval` |

### 5.3 SCM — Pembelian & Procurement

| # | Rule | Affected |
|---|---|---|
| **Poin 4-9** | **Tanggal invoice Faktur Pembelian custom** (tidak read-only), Import data faktur (Excel), detail barang + diskon (Rp), navbar Semua/Sudah/Belum Dibayar, **Notes alasan belum dibayar (wajib tampil saat belum lunas)**, **Hide akurasi matching %** dari UI. Label "Jatuh Tempo" diganti **"Deadline"**. | `/purchase-invoice` |
| **Poin 9** | Konsistensi posisi card + navbar disamakan dengan DP Pembelian. Pola: **Bayar Pembelian lalu DP Pembelian**. | `/purchase-payment`, `/purchase-down-payment` |
| **Poin 37, 41, 45, 46, 60, 61** | Input PO **wajib menyertakan Diskon & Ongkir** (Diskon dalam **Rupiah, bukan persen**, dikurangi dari ongkir). Selisih pembulatan packing → diskon. Tanggal input PO **read-only hari ini**. **Tanda tangan digital penanggung jawab**. | `/purchase/create`, `/purchase` (list) |
| **Poin 41, 44, 50, 51, 53** | Pembelian Masuk/Penerimaan barang **wajib** cantumkan rincian **jumlah Free, jumlah Cacat/Reject, jumlah Kondisi Bagus**. Pembayaran vendor **HANYA untuk kondisi bagus**. | `/purchase-in` |
| **Poin 44, 50** | **3-Way Matching**: PO ↔ GRN ↔ QC Passed Qty ↔ Vendor Invoice. Toleransi otomatis. Reject QC auto-generate **Debit Note/Pending Retur AP**. Akurasi % di-hide dari UI. | `/purchase-invoice` |
| **Format PO** | Kode Universal: `DL-PRD-PO-DDMMYYYY-XXXX` atau ringkas `PO-DDMMYYYY-XXXX`. Sequence global berkelanjutan. | `/purchase/create` |

### 5.4 WAREHOUSE — Gudang, Stok, Opname

| # | Rule | Affected |
|---|---|---|
| **Poin 48-52** | Barang master: **kolom kondisi bagus & cacat DIHAPUS**, diganti **Real Stok**. Tampilkan **Supplier asal barang**, wujud fisik & kondisi bahan, serta **lama barang ada di gudang (aging barang)**. | `/goods-manage` |
| **Poin 64** | Report Penerimaan Barang: format seperti Pembelian + kolom **Jumlah Diterima, Jumlah Bagus, Jumlah Cacat/Reject, Jumlah Gratis (Free)**. | `/report-goods-receipt` |
| **AR Delivery Gatekeeper** | Status default **HELD**. Gudang **dilarang cetak Surat Jalan** sebelum Finance ubah jadi **RELEASED** (setelah DP/lunas terverifikasi). Bahan Consignment **tidak menambah COGS**. | `/sales-invoice` |
| **Stok Opname** | **2 versi** (V1 = berjalan, V2 = finalisasi). Setiap barang: Stok Sistem (read-only) vs Stok Aktual. Selisih otomatis jadi adjustment CoA. | `/stock-opname*` |
| **Code Barang Universal** | Tersedia 2 versi: `DL-DIV-PRD-DDMMYYYY-0001` (lengkap) atau `PRD-DDMMYYYY-0001` (ringkas). Sequence global. | `/goods-manage/create` |

### 5.5 PRODUCTION — Batch Record → 3-Tahap Eksekusi

| # | Rule | Affected |
|---|---|---|
| **Karakter Wajib CPKB** | **Pemisahan tegas** Mixing (Kimia ruahan) → Filling (Kemasan primer) → Packaging (Kemasan sekunder). **Tidak bisa skip stage.** Filling otomatis kunci "Bahan Ruahan" dari hasil Mixing — kalau Mixing belum selesai/ruahan nol, Filling tidak bisa mulai. | `/schedule-filling*`, `/production-filling` |
| **Upscale Calculation** | `Base Result = Target Qty × Netto per PCS`. `Hasil Upscale = Base + (Base × Upscale %)`. Auto-calculated by system. | `/schedule-mixing/create` |
| **Jadwal Mixing Inputs** | Batch Record (status process only) + Tanggal Jadwal + Target Qty (PCS) + **Base Result (auto)** + **Upscale (%)** + **Hasil Upscale (auto)** + Catatan. | `/schedule-mixing/create` |
| **Jadwal Filling Inputs** | Batch Record + Tanggal + Target Qty + Kemasan Primer + Qty. | `/schedule-filling/create` |
| **Jadwal Packaging Inputs** | Batch Record + Tanggal + Target Qty + Kemasan Sekunder + Qty. | `/schedule-packaging/create` |
| **Material OWNED vs CONSIGNMENT** | Job Order Costing: Hanya item OWNED_ASSET yang menambah cost. **CUSTOMER_CONSIGNMENT**: dicatat Qty saja, cost **Rp 0**. | `/job-order-costing` |
| **Closing JO Jurnal** | `Dr COGS - Job Order, Cr WIP` (saat Closing Job Order). Scrap/Wastage Cost baris terpisah jika yield aktual di bawah target BOM. | `/job-order-costing` |
| **Traceability** | Setiap bahan yang dipakai → tercatat pengurang otomatis dari gudang terkait + histori pemakaian per Batch Record. | `/production-mixing`, `/production-filling`, `/production-packaging` |

### 5.6 AKUNTANSI — Auto-Journaling, Period Lock, 3-Way Match

| # | Rule | Affected |
|---|---|---|
| **Poin 18, 19** | **Card Kas Bank Masuk/Keluar**: HANYA tampilkan **Total Kas** (1 card ringkas), dengan **filter kalender lengkap (date range custom bebas)**. | `/other-deposit`, `/other-payment` |
| **Auto-generated read-only** | Entri dari Bayar Penjualan, DP Penjualan, Bayar Pembelian, DP Pembelian, Pengajuan Dana (Disbursed) **bersifat read-only**. Form manual hanya untuk transaksi tanpa dokumen sumber. | `/other-deposit`, `/other-payment` |
| **Poin 20, 21** | Bank Reconciliation: filter tanggal kalender lengkap + filter COA. Selisih biaya admin/bunga bank → auto jurnal `Dr Bank Charge, Cr Bank`. | `/bank-reconciliation` |
| **Poin 22-24** | **Fund Request (Pengajuan Dana)** menggantikan Google Form. Jenjang approval: Staff → Head Divisi → Accounting → Direktur. Jika Head yang ajukan → Accounting → Direktur. Saat Disbursed → auto-generate Kas Bank Keluar. | `/fund-request*` |
| **Poin 25-27** | **Jurnal Umum**: filter periode custom (date range bebas lintas bulan). **Tipe & Referensi otomatis** dari subledger (AP/AR/Cash/Stock). **Jurnal Manual** hanya untuk adjustment/accrual/reclassification. **Tidak boleh posting** ke akun `Allow Manual Journal = false` atau periode Locked. **Input "Dimensi Finansial" DIHAPUS**. Format disamakan dengan ERP lama G-SERP. | `/general-journal*` |
| **Balanced Check** | Total Debit **harus sama** dengan Total Kredit sebelum submit. | `/general-journal/create` |
| **Poin 35** | **Skip e-Faktur/e-Bupot DJP** — Tax Transactions hanya rekap dari Faktur. PPh 21 direkap dari data payroll HR. | `/tax-transactions` |
| **Adjustment Journal** | **Satu-satunya jalur sah** untuk transaksi ke periode Hard Lock. Butuh approval Finance Manager. | `/adjustment-journal` |
| **Period Lock** | **Soft Lock**: warning saat input. **Hard Lock**: read-only total. Transaksi susulan wajib lewat Adjustment Journal. | `/closing-checklist` |
| **Allow Manual Journal** | Default `false` untuk akun kontrol (AP, AR, WIP). Override ke `true` untuk akun yang butuh accrual. | `/coa-manage/create` |
| **Client Escrow** | Deposit BPOM/HKI/uji lab klien → `Dr Bank, Cr Client Escrow Deposit` (Liability, **0% sentuh P&L Dreamlab**). Saat dipakai → `Dr Escrow, Cr Bank`. | `/client-escrow` |
| **PPh 23 Potong Customer** | Kelebihan bayar otomatis jadi AR Advance. PPh 23 dipotong customer → dicatat sebagai **uang muka pajak** (gantung outstanding invoice). | `/sales-payment` |

### 5.7 CLIENT ESCROW & TRUST FUND

| # | Rule |
|---|---|
| **Tujuan** | Dana titipan BPOM/HKI/uji lab klien — **BUKAN REVENUE Dreamlab**. |
| **Alur** | Terima deposit → Bayar disbursement (biaya lab/BPOM) → Refund sisa. |
| **Status** | Deposited → Partially Used → Fully Settled. |
| **Jika biaya aktual > deposit** | Sistem munculkan **tagihan top-up** ke klien. |
| **Jurnal Masuk** | `Dr Bank, Cr Client Escrow Deposit` |
| **Jurnal Keluar** | `Dr Client Escrow Deposit, Cr Bank` |

### 5.8 PENYESUAIAN FORMULASI — R&D Sample Revisions

- Form input Revisi: `Nama Produk`, `Rev` (auto V1/V2), `Netto`, `Form`, `Color`, `Flavor`, `Target`, `Material Request`, `Claim`, `Harga`, `Diskon`, `Pajak %`
- Setiap revisi disimpan berurutan (Rev 1, Rev 2, dst.) sampai disetujui client.
- Disetujui client → Approved Formula → trigger Permintaan HPP.

### 5.9 CHECKLIST — SO Milestone Tracking (Poin 36-39, 54-59, 62-67, 71, 74)

| # | Rule |
|---|---|
| **1 SO = 1 Checklist Utama** | Bukan per baris kategori. Versi "Keseluruhan" vs "Khusus PIC". |
| **Kategori** | Desain Logo, HKI, BPOM Merk, BPOM NA, MOU, Desain Kemasan, Approval Desain, Bahan Baku, Pelunasan, Mixing, Bahan Kemas, Filling, Label, Box, Packing, Delivery, Halal, Uji Lab |
| **Deadline per PIC** | Dipisah, bukan deadline SO total. |
| **Validasi status berurutan** | Kategori baru dianggap selesai setelah SEMUA kategori sebelumnya selesai. **Anti-manipulasi KPI**. |
| **Foto Kemasan** | Tampil di tracking matrix. |
| **Dokumen BPOM per SO** | Tampil di checklist progress. |
| **Status done bisa dikembalikan** | Jika terkendala. |
| **Notifikasi pending** | Item pending → push notification ke PIC. |

### 5.10 DELIVERY & AR

| # | Rule |
|---|---|
| **Delivery Gatekeeper** | Gudang **dilarang cetak Surat Jalan** sebelum Finance set invoice ke `RELEASED`. |
| **Pengiriman Form** | Pilih SO → Kode Sales → Tanggal Sales → Customer → Tabel Barang (Satuan, Qty Sales, Qty Tersedia, Qty Kirim) → Catatan + Foto (Opsional). |
| **Retur Penjualan** | Pilih Faktur Penjualan → Qty Retur (validasi Qty Tersedia). Auto-filled info: Kode Retur, Faktur, Pelanggan. |
| **Retur Pembelian** | Pilih Pembelian Masuk (GR Ref) → Qty Retur (validasi Qty Tersedia). Auto-filled: Kode GR, Kode PO, Supplier, Gudang. |

### 5.11 PERSETUJUAN (Approval Workflows)

Setiap halaman approval punya pola sama:
- **Modal Detail**: Field utama + Tabel detail (baris items) + Riwayat Persetujuan (approval trail)
- **Actions**: Riwayat, Lihat, **Modal Setuju**, **Modal Tolak** (Input Catatan Tolak/Alasan), Tutup
- **Approval Flow** (umum): Requester → Head → Manager → Director (configurable per workflow)

**Specific Approval Workflows:**

| Workflow | Jenjang | Threshold |
|---|---|---|
| **Fund Request** | Staff → Head Divisi → Accounting → Direktur | Threshold amount: > Rp X perlu Direktur |
| **Purchase Order** | Staff Purchasing → Head SCM → Director | > Rp Y perlu Direktur |
| **Sales Order** | BusDev → Sales Manager → Director | — |
| **HPP Request** | BusDev → R&D Head → Finance Manager | — |
| **Sample Request** | BusDev → R&D Formulator → Head | Auto-approve for repeat customers |
| **Pengajuan Design Revisi** | PIC Desain → BusDev Approval → Purchase Approval | Dual approval BusDev + Purchase |
| **Goods Request** | Requester → Warehouse Head | — |

### 5.12 FORM BEHAVIOR — Pola Universal

Semua form create menggunakan pola:
1. **Sub-tabel keranjang/item dinamis** (untuk transaksi multi-item: PO, GR, Pengiriman, Produksi, dll)
2. **Auto-numbered** kode dokumen (DL-DIV-PRD-...)
3. **Save → Submit Approval** (jika ada approval flow)
4. **Auto-save draft state** (Poin 78 — buku tamu wajib; recommended untuk semua form)
5. **Validasi** via jQuery Validation + jQuery additional methods
6. **Konfirmasi save**: SweetAlert "Apakah Anda yakin?" sebelum submit
7. **Modal-based**: form di-load via AJAX ke `modal-sm/md/lg/xl` container kosong
8. **CSRF protection**: hidden `csrf_gs` field di setiap form

---

## 6. Cross-Cutting Concerns

### 6.1 KPI System (lengkap di `docs/KPI_REFERENCE.md`)
- 13 divisi dashboards, ~100 KPI cards
- **Threshold Logic**: Underperform (<70%) → rose; Stable (70-99%) → slate; On Track (≥100%) → emerald
- **Direction**: higher-better / lower-better / zero-target
- **Pre-computed** oleh backend: `{ value, target, pct, direction }`

### 6.2 DNA Components (lengkap di `VISUAL_DNA.md`)
- **Single source of truth**: `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`
- Wajib tiru 100% untuk semua halaman ERP
- **Forbidden**: bikin wrapper/abstraksi baru yang bertentangan

### 6.3 User Roles (dari `/role-manage`)
Hak akses granular per role. Tiap role punya akses:
- Modul (read/write/approve)
- Gudang (specific warehouses only)
- Approval level (jenjang sign-off)
- Account restrictions (e.g., AP Control tidak boleh manual journal)

### 6.4 File Upload & Attachments
- Form fields: `Pilih file...` pattern
- Image preview via Ekko Lightbox
- Path: `/uploads/{filename}`
- Default placeholder: `/uploads/default.png`

### 6.5 Notifications & Activity Log
- Tiap perubahan → entry di `/activity-log` (Waktu, Pengguna, Modul, Aksi, Deskripsi, IP)
- Auto notification untuk: status changes, pending items (Poin 77), overdue, expired

### 6.6 Audit Trail
Semua approval/transaction → trail immutable:
- Who (PIC)
- When (timestamp)
- Action (Approve/Reject/Modify)
- Reason/Catatan
- IP Address

---

## 7. Migrasi Strategi — Recommended Phase Plan

### Phase 1: Foundation (1 minggu)
- [ ] **Backend**: Fix DI errors (IdempotencyService, MaterialsService, semua module/service yang belum di-register)
- [ ] **Backend**: Align Prisma schema dengan field legacy (lihat CSV "Inputs" column)
- [ ] **Frontend**: Standarisasi DNA components (golden reference page)
- [ ] **Frontend**: Restore approved state dari HEAD (sudah selesai)

### Phase 2: Master Data (3-4 hari)
- [ ] CoA + CoA Auto Rules + Tax Setup
- [ ] Barang + Kategori + Gudang + Hak Akses Gudang
- [ ] Supplier + Kategori + Customer + Kategori + Sales Category + Target
- [ ] User + Role + Bank Account

### Phase 3: Operational Streams (2 minggu)
- [ ] **CRM Stream**: Buku Tamu → Leads → Sample → HPP → Sales
- [ ] **Procurement Stream**: Kebutuhan → PR → PO → DP → Inbound → Invoice → Bayar → Retur
- [ ] **Production Stream**: Batch Record → Schedule → Produksi (3 tahap) → JO Costing → Stock Opname
- [ ] **Delivery Stream**: Pengiriman → Faktur → DP → Bayar → Retur

### Phase 4: Approval + Reporting (1 minggu)
- [ ] All 8 approval pages dengan workflow
- [ ] Closing Checklist & Period Lock
- [ ] All 18 laporan (Neraca, Laba Rugi, Buku Besar, AR/AP Aging, dll)
- [ ] Adjustment Journal + Escrow + Fund Request

### Phase 5: Polish & E2E (3-5 hari)
- [ ] E2E testing full flow (Buku Tamu → Pembayaran AR)
- [ ] Visual audit vs golden reference
- [ ] Performance & error handling

**Total estimate: 4-5 minggu** untuk migrasi penuh dengan tim 1-2 developer.

---

## 8. Risks & Known Issues

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Backend DI errors di HEAD** — IdempotencyService, MaterialsService belum di-register | Fix incremental per error saat run dev server |
| 2 | **Database schema vs legacy field names** mungkin mismatch | Audit Prisma schema, compare dengan CSV "Inputs" column |
| 3 | **Cross-division visibility** (e.g., AR Aging di BusDev dashboard) | Coordinated data fetching, possibly new aggregation endpoint |
| 4 | **Auto-journal rules** — pastikan setiap transaksi operasional trigger jurnal yang benar | Test e2e + reconcile trial balance bulanan |
| 5 | **Performance** — Calendar views (Jadwal Produksi) dengan banyak event | Pre-compute, cache, atau virtualization |
| 6 | **Hidden business rules** yang gak tercatat di docs/CSV | User walkthrough critical pages, extract implicit rules |
| 7 | **e-Faktur/e-Bupot DJP integration** — di-skip dari scope | Rekap manual via Tax Transactions cukup |
| 8 | **Indonesian-only UI** — internationalization belum ada | Acceptable untuk scope saat ini |

---

## 9. Cross-Reference ke Docs Lainnya

| Topik | Lihat |
|---|---|
| Alur SCM end-to-end | `docs/general docs/LEGACY_ERP_AUDIT.md` §1 |
| Alur Gudang end-to-end | `docs/general docs/LEGACY_ERP_AUDIT.md` §2 |
| Alur Produksi 3-tahap | `docs/general docs/LEGACY_ERP_AUDIT.md` §3 |
| 6 macro business flows | `ERP_OLD_BUSINESS_FLOW.md` |
| KPI catalog per dashboard | `docs/KPI_REFERENCE.md` |
| DNA component spec | `VISUAL_DNA.md` |
| Full inventory 174 halaman | `kil_erp_full_inventory_v2.csv` |

---

**Generated: 7 September 2026**
**Next Review: Setelah Phase 1 selesai**