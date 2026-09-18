# NEX Finance Module — Full Implementation Spec

Dokumen ini adalah spesifikasi lengkap siap-implementasi untuk modul Finance NEX ERP. Konteks bisnis: perusahaan maklon kosmetik (contract manufacturing), sudah punya modul Inventory (Stok, Mutasi Barang, Penyesuaian Stok) yang jadi data source untuk sebagian fitur costing di sini.

**Cara baca dokumen ini per halaman:**
- **Purpose** — kenapa halaman ini ada
- **Cards** — KPI card di bagian atas halaman, dengan formula/sumber data
- **Table** — kolom di tabel utama (list view)
- **Form Fields** — field di form create/edit
- **CRUD** — aturan create/read/update/delete
- **Status Flow** — state machine dokumen
- **Business Logic** — validasi dan aturan bisnis
- **Journal Posting Logic** — jurnal otomatis yang dihasilkan (Dr/Cr)

---

# BAGIAN 0 — FONDASI (wajib dibangun duluan, dipakai semua modul)

## 0.1 Financial Dimensions

> ⚠️ **Keputusan terbaru (revisi):** Field "Dimension" dihapus dari form input transaksi — tidak ada dropdown Department/Cost Center/Brand/Product Line di level input manual. Saya perlu tegaskan konsekuensinya sebelum ini dieksekusi:
> - **Cost Center Report** (Bagian 11) dan **Product/Customer Profitability** (8.3) yang tadinya bergantung ke dimension ini jadi kehilangan sumber data utamanya.
> - **Job Order Costing** (8.1) tetap aman karena Job Order Reference tetap ada sebagai field tersendiri di form (bukan bagian dari sistem Dimension generik).
> - Brand/Client tracking tetap bisa jalan **secara tidak langsung** lewat Customer Master (setiap invoice/DP sudah terikat ke Customer, dan Customer punya field Brand) — jadi laporan per-Brand masih bisa dibuat dari situ, cuma gak fleksibel untuk dimensi lain (Department, Cost Center).
> - Kalau nanti ternyata butuh Cost Center Report per Department (misal: Marketing habis berapa vs Production), itu harus dibangun ulang lewat jalur lain (kemungkinan dari Kategori Pengadaan di 2.2, atau field Department khusus di masing-masing form, bukan sistem dimension generik).
>
> Bagian data model di bawah ini saya biarkan sebagai referensi arsitektur (kalau suatu saat mau dihidupkan lagi), tapi **tidak diimplementasikan sebagai input form** sesuai keputusan ini.

**Data model (referensi, tidak diimplementasikan sebagai UI input):**
```
dimension_types: id, code (DEPT/COST_CENTER/BRAND/PRODUCT_LINE/JOB_ORDER), name, is_active
dimension_values: id, dimension_type_id, code, name, parent_id (untuk hierarki), is_active
transaction_dimensions: id, transaction_type (journal_line/ap_invoice_line/ar_invoice_line/payment), transaction_line_id, dimension_type_id, dimension_value_id
```

**Yang menggantikan peran dimension untuk sebagian kasus:**
- Client/Brand → otomatis dari Customer Master di setiap transaksi AR
- Job Order → field terpisah "Job Order Reference" di form (tetap ada)
- Kategori pengeluaran → Kategori Pengadaan (2.1/2.2), dua lapis: Kategori Riil + Kategori COA

## 0.2 Document Numbering

**Format standar:** `{PREFIX}-{YYMM}-{SEQUENCE}` — contoh `FP-2608-0001` (Faktur Pembelian Agustus 2026, urut ke-1).

| Prefix | Dokumen |
|---|---|
| FP | Faktur Pembelian |
| DPB | DP Pembelian |
| BPB | Bayar Pembelian |
| BSP | Bayar Sample |
| DPJ | DP Penjualan |
| FJ | Faktur Penjualan |
| BPJ | Bayar Penjualan |
| JU | Jurnal Umum |
| KBM | Kas Bank Masuk |
| KBK | Kas Bank Keluar |
| JO | Job Order (costing) |
| AJ | Adjustment Journal |

**Aturan:** sequence reset tiap bulan, per prefix, auto-generate, tidak bisa diedit manual (mencegah duplikasi/gap yang disengaja — penting untuk audit).

## 0.3 Generic Status Flow (dipakai semua dokumen transaksi)

```
Draft → Pending Approval → Approved → Posted → (Paid/Closed) → Cancelled*
```
*Cancelled hanya bisa dari Draft/Pending Approval. Dokumen yang sudah Posted tidak boleh dihapus/dibatalkan langsung — harus lewat dokumen pembalik (reversal/credit note/adjustment) supaya audit trail utuh.

## 0.4 Generic Approval Engine

**Data model:**
```
approval_rules: id, document_type, min_amount, max_amount, approver_role
approval_logs: id, document_type, document_id, approver_id, action (approve/reject), note, timestamp
```

**Logic:** saat dokumen di-submit dari Draft → Pending Approval, sistem cek `approval_rules` berdasarkan document_type + amount → assign ke role approver yang sesuai. Kalau amount di atas threshold tertinggi, butuh multi-level approval berurutan.

## 0.5 Prinsip Posting Otomatis (WAJIB di-lock dari awal)

> Setiap dokumen transaksi (Faktur Pembelian, Faktur Penjualan, Pembayaran, dst) yang berubah status ke **Posted**, WAJIB otomatis generate journal entry ke General Ledger. User tidak boleh input manual journal untuk transaksi yang seharusnya lewat subledger (AP/AR/Cash).

Jurnal Umum manual hanya dipakai untuk: adjustment, accrual, reclassification — bukan untuk transaksi operasional harian.

## 0.6 Inventory Ownership Type (Consignment / Free-Issue Material)

**Konteks:** dikonfirmasi ada client yang bawa kemasan/bahan baku sendiri (free-issue). Fisik barang ini masuk gudang Dreamlab, tapi **bukan aset Dreamlab** — nilainya tidak boleh masuk Inventory Valuation atau COGS milik Dreamlab.

**Data model:**
```
inventory_items: ... + ownership_type (OWNED_ASSET / CUSTOMER_CONSIGNMENT), owner_customer_id (nullable, wajib diisi kalau CUSTOMER_CONSIGNMENT)
```

**Aturan implementasi:**
- Saat barang masuk gudang (Goods Receipt) dari client (bukan dari vendor), pilih Ownership Type = `CUSTOMER_CONSIGNMENT` dan tag Owner Customer.
- Item dengan `CUSTOMER_CONSIGNMENT` **tidak generate jurnal nilai** saat masuk gudang (Dr Inventory = Rp 0) — hanya quantity yang di-track di modul Warehouse untuk keperluan fisik/opname.
- Saat item consignment dipakai di Job Order (Bagian 8.1), qty-nya tetap tercatat di konsumsi produksi (untuk keperluan yield/batch record), tapi **tidak menambah Material Cost** di cost roll-up job order.
- Report Inventory Valuation harus exclude `CUSTOMER_CONSIGNMENT` secara default, dengan opsi toggle "tampilkan quantity consignment" untuk keperluan reconciliation fisik dengan client.

## 0.7 Standar UI Global (berlaku di semua halaman)

- **Search-select, bukan free-type:** semua field yang merujuk ke master data (Vendor, Customer, Account/COA, Bank Account, Job Order, dll) wajib pakai komponen searchable-dropdown (ketik untuk cari, pilih dari list) — tidak ada field bebas ketik untuk data yang seharusnya merujuk ke master data. Ini mencegah typo dan data duplikat.
- **Periode custom di semua menu:** setiap halaman yang punya filter Periode (dashboard, semua laporan, semua list transaksi) wajib pakai date range picker bebas (dari tanggal berapa sampai tanggal berapa), bukan cuma dropdown bulan. User bisa pilih rentang custom kapan saja, termasuk lintas bulan/tahun.
- **Kode/tag otomatis penuh:** semua nomor dokumen (Bagian 0.2) dan semua kode master data (Vendor Code, Customer Code, Asset Code, dst) di-generate otomatis berdasarkan kategori/tipe-nya — tidak ada input manual untuk kode.

---

# BAGIAN 1 — GENERAL LEDGER

## 1.1 Page: COA (Chart of Accounts)

**Table columns:** Account Code | Account Name | Account Type (Asset/Liability/Equity/Revenue/Expense) | Parent Account | Normal Balance (Debit/Credit) | Is Active

**Form Fields:** Account Code (unique, format bebas tapi disarankan numbering by type: 1xxx Asset, 2xxx Liability, dst), Account Name, Account Type, Parent Account (untuk hierarki/subtotal), Normal Balance, Allow Manual Journal (boolean — kalau false, akun ini cuma bisa kena posting otomatis dari subledger, gak boleh dipakai di Jurnal Umum manual. Ini penting untuk akun kayak AP Control/AR Control/WIP supaya gak ada yang input manual sembarangan)

**CRUD:**
- Create/Update: bebas selama akun belum pernah dipakai transaksi
- Delete: hanya kalau belum pernah dipakai transaksi (cek referential integrity), kalau sudah dipakai → deactivate saja

**Business Logic:** account code harus unique, tidak boleh sirkular di hierarki parent-child.

## 1.2 Page: COA Jurnal Otomatis (Posting Rules)

**Purpose:** mapping transaksi ke akun GL, ini "otak" dari prinsip posting otomatis di 0.5.

**Table columns:** Rule Name | Document Type | Condition (contoh: Contract Type = Jasa Maklon) | Debit Account | Credit Account | Active

**Form Fields:** Document Type (dropdown: Faktur Pembelian, Faktur Penjualan, Bayar Pembelian, dst), Condition (opsional, misal beda akun untuk Contract Type beda), Debit Account, Credit Account

**Contoh isi:**
```
Faktur Pembelian (non-inventory)  → Dr Expense/Inventory   | Cr AP Control
Faktur Pembelian (raw material)   → Dr Inventory Raw Material | Cr AP Control
DP Pembelian                      → Dr AP Prepayment        | Cr Bank/Cash
Bayar Pembelian                   → Dr AP Control            | Cr Bank/Cash
Faktur Penjualan (jasa maklon)    → Dr AR Control            | Cr Revenue - Jasa Maklon
Faktur Penjualan (jual putus)     → Dr AR Control            | Cr Revenue - Penjualan Barang
DP Penjualan                      → Dr Bank/Cash             | Cr AR Advance
Bayar Penjualan                   → Dr Bank/Cash             | Cr AR Control
```

**CRUD:** hanya Finance Admin/Controller yang boleh edit rule ini (high-risk area, salah setting bisa bikin semua transaksi salah posting).

**Business Logic:** setiap Document Type wajib punya minimal 1 rule aktif sebelum modul terkait bisa dipakai transaksi live (validasi saat setup).

## 1.3 Page: Jurnal Umum

**Cards:** Total Debit Bulan Ini, Total Credit Bulan Ini, Unbalanced Draft Journal (harus 0)

**Table columns (disamakan dengan ERP existing):** # | Kode | Tanggal | Deskripsi | Debit | Kredit | Tipe (Manual/Sales Sample Invoice/Good Receipt/Stock Opname/dst — otomatis terisi sesuai sumber posting) | Referensi (link ke dokumen sumber) | Status (Aktif/Draft) | Aksi (lihat/print)

**Filter:** Periode — **date range picker custom** (dari tanggal s.d. tanggal, bebas lintas bulan), bukan cuma bulan berjalan

**Form Fields (header):** Date, Description, Reference (opsional)
**Form Fields (line, repeatable):** Account (search-select), Debit, Credit, Line Description

**CRUD:**
- Create: manual multi-line
- Update: hanya Draft
- Delete: hanya Draft

**Status Flow:** Draft → Pending Approval (kalau amount di atas threshold) → Approved → Posted

**Business Logic:**
- Total Debit harus sama dengan Total Credit sebelum bisa submit (balanced check)
- Tidak boleh posting ke akun dengan `Allow Manual Journal = false`
- Tidak boleh posting ke periode yang sudah Locked (lihat Closing & Controls) kecuali via Adjustment Journal
- Kolom "Tipe" dan "Referensi" wajib terisi otomatis untuk semua entry hasil posting otomatis dari subledger (AP/AR/Cash/Stock) — user cukup lihat, tidak input manual untuk baris jenis ini.

## 1.4 Page: Buku Besar (General Ledger Report)

**Cards:** Opening Balance, Total Debit, Total Credit, Closing Balance (per akun yang dipilih)

**Table columns (disamakan dengan ERP existing):** Kode CoA | Nama CoA | Opening | Debet | Kredit | Perubahan | Saldo — ditampilkan hierarkis per grup akun (mengikuti struktur parent-child COA di 1.1)

**Filter:** Periode — date range picker custom, Account (single/multi)

**Fitur wajib:** drill-down dari baris → buka journal entry asli → buka source document (Faktur Pembelian/Penjualan asli kalau ada); tombol Export Excel

---

# BAGIAN 2 — ACCOUNTS PAYABLE

## 2.1 Page: Vendor Master

**Table columns:** Vendor Code | Name | Kategori Riil | Kategori COA | Payment Term | Bank Account | NPWP | PKP Status | Active

**Form Fields:** Vendor Code (auto), Name, **Kategori Riil** (Raw Material/Packaging/Jasa/Lainnya — kategori operasional/fisik), **Kategori COA** (search-select ke akun GL — menentukan akun mana yang otomatis kepakai saat Faktur Pembelian dibuat untuk vendor ini; dua field ini dipisah karena satu kategori riil bisa saja mapping ke lebih dari satu akun COA tergantung konteks), Address, PIC, Phone, Payment Term (Net 30/Net 60/dst — angka hari), Bank Account (untuk referensi pembayaran), NPWP, PKP Status (boolean — kena PPN atau tidak)

**CRUD:** full CRUD; Delete hanya kalau belum pernah ada transaksi, kalau sudah → deactivate

**Fitur Import:** tombol "Import Excel" — upload template (Vendor Code kosong/auto, Name, Kategori Riil, Kategori COA, Payment Term, dst), sistem validasi baris per baris (duplikat nama, kategori tidak ditemukan, dll) sebelum commit, dan kasih preview + error report sebelum final import.

## 2.2 Page: Faktur Pembelian (Vendor Invoice)

**Cards:** Outstanding AP Total, Due This Week, Overdue, Awaiting Approval

**Navbar tabs:** `Semua Tagihan` | `Sudah Dibayar` | `Belum Dibayar`

**Table columns:** Invoice No | Vendor | Invoice Date | Due Date | Amount | Outstanding | Status | **Notes (alasan belum dibayar — hanya tampil kalau ada isi & status Belum Dibayar)**

**Fitur Import:** tombol "Import Excel" untuk input faktur secara batch (berguna untuk migrasi data awal atau vendor dengan volume invoice tinggi), dengan validasi + preview sebelum commit sama seperti Vendor Master.

**Form Fields (header):** Vendor (search-select), Invoice No (vendor's own number), **Invoice Date (bisa di-custom bebas, tidak terkunci ke tanggal sistem)**, Due Date (auto dari Payment Term vendor, bisa override), PO Reference (opsional — link ke Purchase Order kalau ada), **Notes (alasan belum dibayar — muncul/wajib diisi kalau invoice lewat due date tapi status masih Belum Dibayar)**
**Form Fields (line):** **Detail Barang/Jasa yang Dibeli** (search-select ke Item Master atau free text spec kalau non-item), Qty, Unit Price, **Diskon (nominal atau %, per line)**, Amount (setelah diskon), Account (auto dari Kategori COA vendor, bisa override), Job Order Reference (opsional)
**Attachment:** upload invoice asli (PDF/image)

**CRUD:**
- Create: manual, generate dari PO + Goods Receipt (matched), atau via Import Excel
- Update: hanya Draft
- Delete: hanya Draft (soft delete + log)

**Status Flow:** Draft → (Matching Check kalau ada PO) → Pending Approval → Approved → Posted → Paid/Partial

**Business Logic:**
- **Matching engine, 4 leg** (kalau ada PO Reference): `PO (Ordered) ↔ GRN (Warehouse Received) ↔ QC Passed Qty ↔ Vendor Invoice`. Invoice hanya boleh di-matching ke **Qty yang lolos QC**, bukan Qty yang sekadar diterima gudang — supaya reject kemasan/bahan baku gak ikut kebayar.
- **Tolerance Engine:** qty & price variance punya toleransi yang bisa di-setting per kategori vendor (misal Raw Material ±5%, Packaging ±3%). Dalam toleransi → auto-approve matching. Di luar toleransi → status "Exception", butuh review manual.
- **Tampilan angka akurasi matching (%) di-hide dari UI** — engine tetap jalan di belakang layar untuk menentukan status Exception/tidak, tapi user cuma lihat status akhirnya (Matched/Exception), bukan angka persentase mentahnya. Ini supaya UI gak terlalu teknis buat user Finance sehari-hari.
- **Reject handling:** kalau QC reject sebagian barang saat inbound, sistem otomatis generate **Debit Note / Pending Retur AP** untuk selisih qty reject tersebut — supaya Finance tidak over-payment ke vendor sebelum retur clear.
- Diskon per line dikurangkan dari Amount sebelum PPN dihitung.
- PPN otomatis dihitung kalau Vendor.PKP_Status = true (link ke Tax module)

**Prasyarat integrasi:** butuh field "QC Passed Qty" dari modul QC/Inbound Inspection sebagai data source. Kalau modul QC belum granular sampai per-item inspection, matching engine ini turun ke 3-leg (PO-GRN-Invoice) dulu sampai data QC siap.

**Journal Posting Logic (saat status → Posted):**
```
Dr Inventory/Expense (per line, sesuai account)     xxx
Dr PPN Masukan (kalau PKP)                          xxx
    Cr AP Control (Vendor)                              xxx
```

## 2.3 Page: DP Pembelian (Advance to Vendor)

**Cards:** Total DP Outstanding, DP Belum Diapply

**Table columns:** DP No | Vendor | Date | Amount | Applied To (invoice mana, kalau sudah dipakai) | Remaining Balance | Status

**Form Fields:** Vendor (search-select), Date, Amount, Bank Account (sumber dana), Note

**CRUD:** create, update saat Draft, tidak bisa delete kalau sudah Posted

**Status Flow:** Draft → Approved → Posted → (Applied - saat dipakai untuk offset invoice) → Fully Applied

**Business Logic:** saat Faktur Pembelian dibuat untuk vendor yang punya DP outstanding, sistem harus tampilkan notifikasi/opsi untuk apply DP ke invoice tersebut (kurangi outstanding invoice sejumlah DP yang dipakai)

**Journal Posting Logic:**
```
Saat DP dibayar:
Dr AP Prepayment (Vendor)     xxx
    Cr Bank/Cash                  xxx

Saat DP diapply ke invoice:
Dr AP Control (Vendor)        xxx
    Cr AP Prepayment (Vendor)     xxx
```

## 2.4 Page: Bayar Pembelian (Vendor Payment)

> **Konsistensi navbar & card:** urutan card dan navbar di halaman ini harus sama polanya dengan DP Pembelian (2.3) — Total Outstanding-nya duluan, baru status/proses berikutnya — supaya user yang bolak-balik dua halaman ini gak bingung posisi elemen berubah-ubah.

**Cards:** Total to Pay Today, Total Selected (saat batch payment)

**Table columns (Payment Proposal view):** checklist | Vendor | Invoice Ref | Due Date | Amount | Bank Account tujuan

**Form Fields:** Payment Date, Bank Account (search-select), pilih 1 atau banyak invoice untuk dibayar sekaligus (batch payment)

**CRUD:** create payment (single atau batch), tidak bisa update setelah Posted (kalau salah → reversal)

**Status Flow:** Draft → Pending Approval → Approved → Posted (auto-update status invoice terkait jadi Paid/Partial)

**Business Logic:**
- Partial payment diperbolehkan — outstanding invoice berkurang sejumlah yang dibayar
- Kalau ada selisih pembulatan/diskon pembayaran cepat, harus ada field adjustment terpisah (bukan diselipkan ke amount utama)

**Journal Posting Logic:**
```
Dr AP Control (Vendor)     xxx
    Cr Bank/Cash                xxx
```

## 2.5 Page: AP Aging Report

> **Koreksi:** "Bayar Sample" awalnya ditaruh di sini sebagai cost keluar (AP-side). Setelah dikonfirmasi, arahnya sebenarnya **client bayar fee sample ke Dreamlab** — ini AR-side, bukan AP. Halaman lengkapnya dipindah ke **Bagian 3.7**.

**Navbar:** menampilkan **Saldo Bank saat ini** (real-time dari 4.1 Bank Account Master, total semua akun aktif) — supaya user langsung bisa bandingkan "AP yang harus dibayar minggu ini" vs "uang yang tersedia" tanpa pindah halaman.

**Cards:** Total Outstanding, **Jatuh Tempo H-7** (jumlah invoice due dalam 7 hari), **Jatuh Tempo H-3** (due dalam 3 hari), Overdue

**Table columns:** Vendor | Invoice No | Invoice Date | Due Date | Days to Due / Days Overdue | Amount | Bucket

**Color coding & styling (per baris):**
- **H-7 sampai H-4** (jatuh tempo 4-7 hari lagi): highlight **kuning**
- **H-3 sampai H-0** (jatuh tempo 0-3 hari lagi): highlight **merah**
- **Overdue** (lewat jatuh tempo): teks **bold**, plus animasi ringan (subtle bounce/pulse) pada baris atau badge status-nya supaya benar-benar menarik perhatian — jangan berlebihan sampai mengganggu, cukup pulse halus

**Filter:** Vendor, Date Range (custom), Bucket
**Fitur:** drill-down ke invoice detail

## 2.6 Page: Pengajuan Dana (Fund Request / Cash Advance)

**Purpose:** request dana talangan/reimbursement dari karyawan (operasional, perjalanan dinas, dll), menggantikan proses Google Form yang dipakai sekarang. **Pola UI dan alur approval-nya disamakan dengan halaman Persetujuan Pembelian yang sudah ada** — supaya user yang sudah familiar dengan approval pembelian gak perlu belajar pola baru.

**Cards:** Total Pengajuan Bulan Ini, Menunggu Approval, Sudah Dicairkan

**Table columns:** No. Pengajuan | Pemohon | Departemen | Tujuan/Keperluan | Amount | Level Approval Saat Ini | Status | Tanggal Pengajuan

**Form Fields:** Pemohon (search-select ke Employee Master, atau auto dari user login), Departemen, Tujuan/Keperluan, Amount, Tanggal Dibutuhkan, Attachment (bukti pendukung kalau ada, misal quotation)

**CRUD:** create oleh karyawan; approve/reject oleh approver sesuai level; tidak bisa edit setelah masuk approval chain (kalau perlu revisi → reject dulu, buat pengajuan baru)

**Status Flow (tiered approval — perlu konfirmasi struktur final):**
```
Draft → Submitted
     → Approval Level 1 (Kepala Divisi/Departemen pemohon)
     → Approval Level 2 (Accounting)
     → Approval Level 3 (Direktur)
     → Approved → Disbursed (dana cair, generate Kas Bank Keluar otomatis) → Closed
```

> **Catatan:** urutan approval saya asumsikan **Kepala Divisi dulu (bukan karyawan biasa yang approve), baru Accounting, baru Direktur** — sesuai arahan "approval-nya ke accounting baru ke direktur." Kalau ternyata karyawan biasa juga perlu approve duluan sebelum ke Kepala Divisi (2 layer di internal divisi), tinggal tambah satu level lagi di depan Approval Level 1.

**Business Logic:**
- Threshold amount bisa nentuin skip level tertentu (misal di bawah 500rb cukup approval Accounting, gak perlu ke Direktur) — pakai Generic Approval Engine (0.4)
- Setelah Disbursed, otomatis generate entry di Kas Bank Keluar (4.2b) dengan referensi ke Pengajuan Dana ini

**Journal Posting Logic (saat Disbursed):**
```
Dr Uang Muka Karyawan / Beban (sesuai kategori)     xxx
    Cr Bank/Cash                                         xxx
```

---

# BAGIAN 3 — ACCOUNTS RECEIVABLE

## 3.1 Page: Customer Master

**Table columns:** Customer Code | Brand Name | Contract Type | Credit Limit | Payment Term | Active

**Cards (di halaman detail customer):** Total Sample Fee (dari 3.7), Total Produksi/Job Order (dari AR + Job Order Costing), Total Legalitas/Escrow (dari 5.3) — supaya satu layar bisa nunjukin keterlibatan penuh satu client di tiga kategori ini, gak perlu buka 3 modul terpisah.

**Form Fields:** Customer Code (auto), Brand/Company Name, PIC, Contract Type (**Jasa Maklon** / **Jual Putus** — field krusial, lihat catatan di 3.2), Credit Limit, Payment Term, NPWP, Default Revenue Account

**CRUD:** full CRUD; Delete hanya kalau belum ada transaksi

## 3.2 Page: Faktur Penjualan (Customer Invoice)

**Cards:** Outstanding AR, Overdue AR, Awaiting Approval

**Navbar tabs:** `Semua Tagihan` | `Sudah Dibayar` | `Belum Dibayar` (sama seperti Faktur Pembelian, 2.2)

**Table columns:** Invoice No | Customer | Contract Type | Job Order Ref | Invoice Date | Due Date | Amount | Outstanding | Status | Notes (alasan belum dibayar, sama seperti 2.2)

**Fitur Import:** tombol "Import Excel" — sama pola dengan 2.2.

**Form Fields (header):** Customer (search-select; Contract Type auto-terisi dari Customer Master, bisa override per invoice kalau ada kasus campuran), **Invoice Date (bisa di-custom bebas)**, Due Date (auto dari Payment Term), Job Order Reference (opsional), Notes (alasan belum dibayar)
**Form Fields (line):** **Detail Produk/Jasa** (search-select), Qty, Unit Price, **Diskon (nominal atau %, per line)**, Amount (setelah diskon)

**CRUD:**
- Create: manual, generate dari Delivery Order/Job Order selesai, atau via Import Excel
- Update: hanya Draft
- Delete: hanya Draft

**Status Flow:** Draft → Credit Limit Check → Pending Approval → Approved → Posted → Paid/Partial

**Business Logic:**
- **Credit limit check:** saat submit, sistem cek total outstanding AR customer + invoice baru ini terhadap Credit Limit di Customer Master. Kalau melebihi → block atau butuh approval khusus (tergantung kebijakan)
- **Contract Type menentukan tax treatment dan akun revenue** (lihat posting rule di 1.2) — ini beda paling signifikan dari AR generik
- PPN dihitung otomatis sesuai jenis Contract Type
- **AR Delivery Gatekeeper (`FINANCIAL_DELIVERY_RELEASE`):** field status tambahan di header, default `HELD`. Gudang **tidak bisa cetak Surat Jalan/DO** untuk job order/invoice terkait selama status ini masih `HELD`. Finance mengubah jadi `RELEASED` setelah pelunasan (biasanya sisa 50%) terverifikasi masuk — atau lewat approval "Credit Limit Bypass" khusus untuk client korporat term 30 hari. Ini butuh integrasi dua arah dengan modul Warehouse (Surat Jalan cek status ini sebelum bisa diterbitkan).
- **Consignment-aware COGS:** kalau line item pakai bahan/kemasan consignment milik client (lihat 0.6), qty tetap tercatat di Delivery Order tapi **tidak menambah COGS** — hanya bahan `OWNED_ASSET` yang masuk perhitungan COGS.
- Diskon per line dikurangkan dari Amount sebelum PPN dihitung.

**Journal Posting Logic:**
```
Jasa Maklon:
Dr AR Control (Customer)              xxx
    Cr Revenue - Jasa Maklon              xxx
    Cr PPN Keluaran                       xxx

Jual Putus:
Dr AR Control (Customer)              xxx
    Cr Revenue - Penjualan Barang         xxx
    Cr PPN Keluaran                       xxx
(+ COGS otomatis dari Inventory kalau jual putus:
Dr COGS   xxx
    Cr Inventory   xxx )
```

## 3.3 Page: DP Penjualan (Customer Advance)

**Navbar tabs:** `Sample` | `Legalitas` | `Produksi` — DP dikelompokkan berdasarkan tujuannya, karena tiap kategori punya sifat dan tujuan offsetting yang beda (Sample → offset ke DP Produksi lewat 3.7, Legalitas → sebenarnya masuk Client Escrow di 5.3 bukan DP biasa, Produksi → DP murni untuk job order produksi massal).

**Table columns:** DP No | Customer | Kategori | Date | Amount | Applied To | Remaining Balance | Status

**Form Fields:** Customer (search-select), Kategori (Sample/Legalitas/Produksi), Date, Amount, Bank Account (search-select), Note

**CRUD & Status Flow:** sama pola dengan DP Pembelian (2.3)

> **Catatan:** untuk kategori "Legalitas," alur uangnya sebenarnya masuk ke **Client Escrow Ledger (5.3)**, bukan akun AR Advance biasa — tab ini di UI cukup jadi pintu masuk cepat, tapi posting jurnalnya ngikutin logic 5.3, bukan logic DP Penjualan biasa di bawah ini.

**Journal Posting Logic (untuk kategori Sample & Produksi):**
```
Saat DP diterima:
Dr Bank/Cash                xxx
    Cr AR Advance (Customer)    xxx

Saat DP diapply ke invoice:
Dr AR Advance (Customer)    xxx
    Cr AR Control (Customer)    xxx
```

## 3.4 Page: Bayar Penjualan (Customer Receipt)

**Table columns:** Receipt No | Customer | Date | Amount | Allocated To (invoice mana) | Unallocated Balance

**Form Fields:** Customer (search-select), Date, Amount, Bank Account (search-select), alokasi ke 1 atau banyak invoice (partial allocation), **PPh 23 Dipotong Customer (opsional, kalau customer withholding pajak sendiri — lihat 5.2)**

**CRUD:** create, tidak bisa update setelah Posted

**Status Flow:** Draft → Posted (auto-update status invoice terkait)

**Business Logic:** kalau amount diterima lebih besar dari total outstanding invoice yang dipilih, sisanya otomatis jadi AR Advance (bisa dipakai untuk invoice berikutnya)

**Halaman terkait — Report Penjualan:** selain halaman transaksi ini, tambahkan halaman **Report Penjualan** terpisah (di bawah Bagian 11 — Financial Reports) yang merekap semua penerimaan penjualan dalam format ringkasan (per customer/per periode), supaya user gak perlu buka satu-satu transaksi Bayar Penjualan untuk lihat rekap.

**Journal Posting Logic:**
```
Dr Bank/Cash               xxx
    Cr AR Control (Customer)   xxx
```

## 3.5 Page: Collections

**Cards:** Total Overdue, Invoice >60 hari
**Table columns:** Invoice | Customer | Days Overdue | Last Contact | Next Action Date | Notes
**CRUD:** create/update collection note & reminder history per invoice (tidak menghasilkan jurnal, murni tracking)

## 3.6 Page: AR Aging Report

Struktur sama seperti AP Aging (2.5), tapi dari sisi customer.

**Cross-module visibility:** data AR Aging (minimal ringkasan: Outstanding per customer + bucket) harus juga muncul di dashboard **Laporan BusDev** (menu existing di sidebar) — supaya tim BusDev bisa lihat status piutang client yang mereka pegang tanpa harus masuk ke modul Finance. Bisa berupa widget/card ringkas yang nge-pull data dari sini, bukan modul AR Aging terpisah yang datanya dobel.

## 3.7 Page: Sample Fee (Bayar Sample — versi terkoreksi)

**Purpose:** client bayar fee trial/sample formula ke Dreamlab. Kalau client lanjut ke kontrak produksi massal, fee ini **dikompensasikan sebagai pengurang DP Produksi**.

**Cards:** Total Sample Fee Diterima Bulan Ini, Sample Fee Belum Di-offset (masih "nganggur", belum ada kontrak lanjutan)

**Table columns:** Sample Fee No | Prospective Client/Customer | Date | Amount | Status (Received/Offset/Expired) | Offset To (DP Produksi No, kalau sudah dipakai) | Job Order Ref (sample production, opsional)

**Form Fields:** Customer/Prospective Client (bisa belum ada di Customer Master kalau masih prospek — pakai lightweight "Prospect" record yang bisa di-convert jadi Customer Master penuh saat closing), Date, Amount, Bank Account, Note, Validity Period (opsional — kalau kebijakannya fee cuma bisa di-offset dalam X bulan)

**CRUD:** create saat fee diterima; update status saat di-offset atau expired

**Status Flow:** `Received` → `Offset` (saat dipakai potong DP Produksi) atau `Expired` (kalau lewat validity period tanpa lanjut kontrak — jadi revenue murni, bukan lagi dana mengambang)

**Business Logic:**
- **Offsetting engine:** saat DP Penjualan (3.3) dibuat untuk client yang punya Sample Fee berstatus `Received`, sistem tampilkan opsi "Apply Sample Fee sebagai pengurang DP" — user pilih, sistem otomatis kurangi jumlah DP yang perlu dibayar client sejumlah Sample Fee tadi.
- Sample Fee yang di-offset **tidak diakui sebagai revenue terpisah** — nilainya "berpindah" jadi bagian dari DP Produksi.
- Sample Fee yang `Expired` (gak pernah di-offset) baru diakui sebagai Revenue - Sample Fee murni saat itu juga.

**Journal Posting Logic:**
```
Saat fee diterima:
Dr Bank/Cash                    xxx
    Cr Sample Fee - Unearned (liability-like)   xxx

Saat di-offset ke DP Produksi:
Dr Sample Fee - Unearned        xxx
    Cr AR Advance (Customer)        xxx
(mengurangi jumlah DP yang perlu ditagih terpisah)

Saat Expired (gak jadi kontrak):
Dr Sample Fee - Unearned        xxx
    Cr Revenue - Sample Fee         xxx
```

---

# BAGIAN 4 — CASH & BANK

## 4.1 Page: Bank Account Master

**Table columns:** Bank Name | Account No | Currency | Current Book Balance
**Form Fields:** Bank Name, Account No, Account Type (Bank/Cash/Petty Cash), Currency, GL Account mapping
**CRUD:** full CRUD

## 4.2 Page: Kas Bank Masuk

**Cards:** hanya **Total Kas Masuk** (sesuai periode filter yang dipilih) — tidak perlu card lain di halaman ini supaya ringkas.

**Filter:** Periode — date range picker custom lengkap kalender (dari tanggal s.d. tanggal), plus tombol Filter.

**Table columns (disamakan dengan ERP existing):** # | Kode | Tanggal | Deskripsi | Dari | Kas/Bank | Jumlah | Status | Aksi

**Form Fields:** Tanggal, Dari (search-select — bisa Customer kalau auto dari AR, atau free description kalau manual), Kas/Bank (search-select ke Bank Account Master), Jumlah, Deskripsi, Category (kalau manual entry — misal Bank Charge, Interest, Petty Cash)

**CRUD:**
- **Auto-generated entries** (dari Bayar Penjualan, DP Penjualan): read-only di halaman ini, cuma bisa dilihat, editnya harus dari dokumen sumber
- **Manual entries** (petty cash masuk, dll yang gak ada dokumen sumber AR): full CRUD saat Draft via tombol "+Buat"

## 4.2b Page: Kas Bank Keluar

**Struktur sama persis dengan Kas Bank Masuk (4.2)**, dengan perbedaan:

**Table columns (disamakan dengan ERP existing):** # | Kode | Tanggal | Deskripsi | **Kepada** | **No. Tagihan** | Kas/Bank | Jumlah | Status | Aksi

**Form Fields:** Tanggal, Kepada (search-select — Vendor kalau auto dari AP), No. Tagihan (ref invoice), Kas/Bank (search-select), Jumlah, Deskripsi, Category

**Cards:** hanya **Total Kas Keluar** (sesuai periode filter)

**Business Logic (berlaku untuk 4.2 & 4.2b):** ini prinsip penting — begitu modul AP/AR (bagian 2 & 3) sudah live, sebagian besar entry di halaman ini seharusnya muncul otomatis, bukan diinput manual lagi. Manual entry cuma untuk transaksi yang benar-benar tidak ada dokumen sumber lain.

## 4.3 Page: Bank Reconciliation

**Cards:** Statement Balance, Book Balance, Difference (harus 0 setelah reconciled)

**Filter:** Periode — date range picker custom lengkap kalender, **Filter berdasarkan COA** (akun bank/kas mana yang mau di-reconcile — search-select ke COA)

**Table (2 kolom):** Bank Statement Lines (dari import CSV/Excel) | System Transactions (dari Kas Bank Masuk/Keluar)

**Fitur:**
- Import bank statement (CSV/Excel upload)
- **Matching engine:** auto-match by amount + date (toleransi ±2 hari), sisanya manual match drag-drop atau pilih pasangan
- Selisih yang gak ada pasangannya (misal bank charge yang belum tercatat) → create reconciliation journal langsung dari sini

**CRUD:** create reconciliation session per periode per bank account

**Journal Posting Logic (untuk selisih yang ditemukan):**
```
Dr Bank Charge Expense     xxx
    Cr Bank                    xxx
```

---

# BAGIAN 5 — TAX & COMPLIANCE

## 5.1 Page: Tax Setup

**Table:** Tax Code | Name (PPN Keluaran/PPN Masukan/PPh 23/dst) | Rate (%) | GL Account
**CRUD:** setup oleh Finance Admin

## 5.2 Page: Tax Transactions

**Cards:** PPN Keluaran Bulan Ini, PPN Masukan Bulan Ini, PPN Kurang/Lebih Bayar, PPh 23 Belum Disetor

**Table columns:** Ref Document (Invoice No) | Tax Type | Base Amount | Rate | Tax Amount | Status (Accrued/Reported/Paid)

**Business Logic:** baris di sini otomatis muncul dari Faktur Pembelian (PPN Masukan) dan Faktur Penjualan (PPN Keluaran, dan PPh 23 kalau Contract Type = Jasa dan customer withholding) — bukan input manual.

**WHT (PPh 23) Deduction Engine:** untuk invoice Jasa Maklon, customer sering memotong PPh 23 sendiri saat bayar (bukan Dreamlab yang setor). Artinya jumlah yang diterima Dreamlab < nilai invoice. Bayar Penjualan (3.4) perlu field "PPh 23 Dipotong Customer" — sistem catat ini sebagai piutang pajak (bukti potong/Bupot jadi kredit pajak Dreamlab), bukan dianggap invoice belum lunas penuh.

**PPh 21:** direkap di halaman ini sebagai baris informasi (total PPh 21 karyawan per bulan) untuk keperluan laporan keuangan — sumber datanya dari payroll/HR, Finance cuma menampilkan rekapnya untuk kelengkapan laporan pajak bulanan, bukan menghitung sendiri.

**Ruang lingkup pajak (dipersempit sesuai arahan):** modul ini cukup PPN, PPh 23, dan rekap PPh 21. **Tidak perlu integrasi e-Faktur atau e-Bupot DJP** — pelaporan resmi ke DJP tetap dilakukan manual/lewat aplikasi resmi DJP di luar NEX, modul ini cukup untuk pencatatan internal dan rekonsiliasi angka.

**CRUD:** read-only untuk baris auto-generated; update status jadi "Reported"/"Paid" setelah lapor SPT

**Journal Posting Logic (PPh 23 dipotong saat penerimaan):**
```
Dr Bank/Cash                    xxx  (jumlah net diterima)
Dr PPh 23 Dibayar Dimuka         xxx  (kredit pajak, dari Bukti Potong)
    Cr AR Control (Customer)         xxx  (invoice tetap lunas penuh)
```

## 5.3 Page: Client Escrow / Pass-Through Disbursement Ledger

**Purpose:** dikonfirmasi Dreamlab menangani pembayaran BPOM/HKI/uji lab atas nama client. Ini dana titipan (bukan revenue Dreamlab) — kalau salah dicatat sebagai revenue, P&L jadi bias dan pajak jadi salah hitung.

**Cards:** Total Deposit Client Outstanding, Total Sudah Disbursed Bulan Ini, Belum Direimburse ke Kas Negara

**Table columns:** Escrow No | Client | Purpose (BPOM Registration/Uji Lab/HKI/Lainnya) | Deposit Received | Disbursed Amount | Remaining Balance | Status (Deposited/Partially Used/Fully Settled)

**Form Fields (deposit masuk):** Client, Purpose, Amount Diterima, Date, Bank Account
**Form Fields (disbursement/pembayaran keluar):** Escrow Ref, Purpose Detail (misal "PNBP Simponi - Produk X"), Amount, Date, Attachment (bukti bayar ke instansi/lab)

**CRUD:** full CRUD dengan approval untuk disbursement (uang keluar ke pihak ketiga)

**Status Flow:** `Deposited` → `Partially Used` (sebagian sudah dibayarkan) → `Fully Settled` (semua dana titipan sudah dipakai/dikembalikan sisa ke client)

**Business Logic:**
- Deposit dari client **tidak pernah masuk Revenue** — selalu ke akun Liability (Client Escrow Deposit).
- Kalau ada sisa dana setelah semua kebutuhan dibayar (misal biaya lab lebih murah dari estimasi awal), sistem harus bisa generate refund ke client atau offer untuk offset ke tagihan lain.
- Kalau dana titipan kurang (biaya aktual lebih besar dari deposit), sistem munculkan notifikasi untuk minta top-up ke client — bukan Dreamlab yang nombokin otomatis.
- Report bulanan: rekonsiliasi antara total deposit diterima vs total disbursed vs sisa balance, per client, untuk transparansi ke client kalau diminta.

**Journal Posting Logic:**
```
Saat deposit diterima dari client:
Dr Bank/Cash                         xxx
    Cr Client Escrow Deposit (Liability)  xxx

Saat dibayarkan ke instansi/lab:
Dr Client Escrow Deposit (Liability) xxx
    Cr Bank/Cash                         xxx

(Tidak ada baris yang menyentuh akun Revenue atau Expense P&L Dreamlab sama sekali)
```

---

# BAGIAN 6 — FIXED ASSETS

## 6.1 Page: Asset Register

**Table columns:** Asset Code | Name | Category | Acquisition Date | Acquisition Cost | Accum. Depreciation | Book Value | Location | Department

**Form Fields:** Asset Code (auto), Name, Category, Acquisition Date, Acquisition Cost, Useful Life (bulan/tahun — **default auto-terisi dari tabel Kategori Masa Manfaat di bawah, bisa override**), Depreciation Method (Straight Line), Location, Department, Source (manual atau generate dari Faktur Pembelian yang di-flag sebagai capital expenditure)

**CRUD:** full CRUD saat belum ada depresiasi berjalan; setelah ada → hanya bisa transfer/dispose, tidak edit langsung

**Sub-tab: Purchase History** — di halaman detail tiap asset, tambahkan tab riwayat pembelian yang mencatat: kalau ada penambahan/upgrade komponen ke asset yang sama (misal spare part besar yang menambah nilai buku), riwayat perbaikan besar, dan link ke Faktur Pembelian asli. Ini beda dari Depreciation Schedule (yang nyatet penyusutan) — ini nyatet histori penambahan nilai/perawatan besar.

**Table columns (Purchase History):** Tanggal | Jenis (Acquisition/Upgrade/Major Repair) | Ref Faktur Pembelian | Amount | Keterangan

## 6.2 Page: Depreciation Schedule

**Table:** Asset | Method | Monthly Depreciation | Next Run Date | Last Run Date

**Kategori Masa Manfaat (default useful life per kategori, dipakai auto-fill di 6.1):**

| Kategori Asset | Masa Manfaat |
|---|---|
| Inventaris (furniture, alat kantor) | 4 tahun |
| Motor | 4 tahun |
| Mobil | 8 tahun |
| Bangunan Permanen | 20 tahun |

*(Kategori lain yang belum ada di tabel ini perlu di-set manual per aset sampai ditambahkan ke tabel default.)*

**Action:** tombol "Run Depreciation" bulanan (bisa manual trigger atau scheduled job) → generate journal untuk semua asset aktif

**Journal Posting Logic:**
```
Dr Depreciation Expense (per Department asset)     xxx
    Cr Accumulated Depreciation                         xxx
```

## 6.3 Page: Asset Transfer / Disposal

**CRUD:** create transfer (ubah Department/Location) atau disposal (hitung gain/loss = Disposal Proceeds - Book Value)

**Journal Posting Logic (Disposal):**
```
Dr Accumulated Depreciation     xxx
Dr Cash (kalau dijual)          xxx
Dr/Cr Loss/Gain on Disposal     xxx
    Cr Fixed Asset (at cost)        xxx
```

## 6.4 Page: Compliance/Intangible Asset (Sertifikasi BPOM/Halal/ISO)

**Table columns:** Cert Name | Product/Brand | Issue Date | Expiry Date | Cost | Amortization Status | Days to Expiry

**Form Fields:** Cert Name, Type, Product/Brand, Issue Date, Expiry Date, Cost, Amortization Period (biasanya = masa berlaku sertifikat)

**Business Logic:** reminder otomatis (notifikasi) 90/60/30 hari sebelum expiry. Amortisasi jalan otomatis tiap bulan sepanjang masa berlaku, mirip depresiasi.

**Journal Posting Logic (amortisasi bulanan):**
```
Dr Amortization Expense - Compliance     xxx
    Cr Accumulated Amortization - Intangible  xxx
```

---

# BAGIAN 7 — BUDGET & PLANNING

## 7.1 Page: Budget Entry

**Table:** grid Account x Department x Month (editable cell)
**Form Fields:** Budget Version (Draft/Approved), Fiscal Year, copy-from-previous-year + growth % (opsional fitur cepat)
**CRUD:** full CRUD saat Draft; Approved version read-only (revisi = buat versi baru)

## 7.2 Page: Budget vs Actual

**Cards:** Total Budget YTD, Total Actual YTD, Variance %
**Table columns:** Department | Account | Budget | Actual | Variance | Variance % — drill-down ke transaksi actual

---

# BAGIAN 8 — COST & PROFITABILITY

**Prasyarat:** modul Production/Manufacturing sudah punya data BOM (formulasi) dan Job Order. Kalau belum ada, halaman 8.1-8.2 perlu tunggu modul itu jalan dulu.

## 8.1 Page: Job Order Costing

**Table columns:** Job Order No | Client/Brand | Product | Qty | Material Cost | Labor Cost | Overhead Allocated | Packaging Cost | Total Cost | Cost/Unit | Status (Open/WIP/Closed)

**Form Fields:** biasanya auto-generate dari modul Production saat Job Order dibuat, Finance cuma menerima cost roll-up-nya. Kalau perlu manual adjustment → form terpisah dengan approval.

**Business Logic:**
- Material cost roll-up dari BOM x actual consumption (dari Inventory/Mutasi Barang) — **hanya item `OWNED_ASSET` yang masuk Material Cost** (lihat 0.6); item `CUSTOMER_CONSIGNMENT` tetap tercatat qty-nya untuk batch record tapi cost-nya Rp 0.
- **Scrap/Wastage tracking:** setiap Job Order punya expected yield % (dari BOM/formulasi). Selisih actual output vs expected → tercatat sebagai baris terpisah "Scrap/Wastage Cost" di cost roll-up, bukan tercampur ke Material Cost biasa — supaya kelihatan jelas berapa cost yang hilang karena reject/susut produksi.
- Overhead allocated dari Cost Allocation Setup (8.4)
- Status "Closed" memicu posting COGS dan menutup WIP

**Journal Posting Logic:**
```
Saat konsumsi material (dari Inventory):
Dr WIP     xxx
    Cr Inventory Raw Material    xxx

Saat Job Order Closed:
Dr COGS - Job Order    xxx
    Cr WIP                  xxx
```

## 8.2 Page: Cost Variance

**Table columns:** Job Order | Standard Cost | Actual Cost | Material Price Variance | Material Usage Variance | Labor Variance
**Fitur:** highlight variance di atas threshold tertentu (misal >10%) untuk investigasi

## 8.3 Page: Product/Customer Profitability

**Table columns:** Product/Customer | Revenue | COGS | Gross Margin | Margin %
**Chart:** ranking

## 8.4 Page: Cost Allocation Setup

**Table:** Overhead Pool (misal Listrik Factory) | Allocation Base (Machine Hours/Volume/Headcount) | Formula
**CRUD:** setup oleh Finance Controller

---

# BAGIAN 9 — CLOSING & CONTROLS

## 9.1 Page: Checklist Progress / Checklist Tracking

**Cards:** X/Y Tasks Completed (progress bar per periode)

**Table columns:** Task Name | Owner | Due Date | Status (Not Started/In Progress/Done/Blocked) | Evidence (attachment) | Approver | Completed At

**Form Fields (task template):** Task Name, Category (Bank Reconciliation/AP Review/AR Review/Inventory Valuation/Depreciation/Accrual/Tax/GL Review/Financial Statements), Owner, Due Date

**CRUD:** create task template (recurring tiap bulan), update status per periode

**Fitur tambahan yang perlu ditambahkan (belum ada saat ini):**
- **Period Lock:** setelah semua/mayoritas task Done, ada tombol "Lock Period [Bulan]" → semua transaksi di periode itu jadi read-only
- Kalau ada transaksi baru untuk periode yang sudah locked → harus lewat Adjustment Journal dengan approval khusus

## 9.2 Page: Adjustment Journal

**Table columns:** Adjustment No | Original Period | Reason | Amount | Approver | Status

**Form Fields:** sama seperti Jurnal Umum, tapi dengan field wajib "Reason" dan flag "This is for locked period"

**CRUD:** create dengan approval wajib (tidak ada shortcut)

**Business Logic:** hanya bisa posting ke periode locked kalau lewat halaman ini, dan approval-nya minimal level Finance Manager/Controller

---

# BAGIAN 10 — FINANCE OVERVIEW (Dashboard)

**Cards (row 1):** Cash Balance | AR Outstanding | Overdue AR | AP Outstanding | AP Due This Week | Net Cash Forecast 30D

**Sections:**
- Cash Position & Forecast (chart line, 30 hari ke depan berdasarkan AR due + AP due)
- AR Aging vs AP Aging (side by side bar chart)
- Revenue / Gross Profit / Net Profit — MTD vs YTD (comparison)
- Budget vs Actual summary (per department, top 5 variance)
- Closing Progress (dari modul 9.1)
- Alerts/Exceptions: invoice matching exception, overdue >90 hari, credit limit breach, sertifikasi mendekati expired

**Business Logic:** semua card ini read-only, hasil query/aggregate dari modul lain — tidak ada input di halaman ini.

---

# BAGIAN 11 — FINANCIAL REPORTS

**Aturan global:** semua report di bawah ini pakai **date range picker custom** (lihat 0.7), bukan cuma dropdown bulan.

## 11.1 Neraca, Neraca Saldo (dipertahankan seperti sekarang)

Format sudah sesuai standar (hierarkis Description/Balance dengan indentasi per grup, Balance Check banner, tombol Export Excel) — tidak perlu diubah strukturnya, cuma pastikan filter periode-nya date range custom.

## 11.2 Laba Rugi (format disesuaikan)

**Cards (di atas tabel):** Total Pendapatan, **Total Beban HPP**, **Laba Operasional Bersih** — dengan urutan card **Pendapatan → HPP → Laba Kotor → Laba Operasional Bersih** (kalau posisi "Total Beban HPP" dan "Laba Operasional Bersih" yang dimaksud tertukar di versi sekarang, ini urutan yang saya sarankan; tolong konfirmasi ulang urutan persisnya sebelum dev mulai supaya gak salah asumsi).

**Format tabel:** dipertahankan **gaya ERP lama** — hierarkis Description/Balance dengan indentasi per grup (OPERATING REVENUE → PENJUALAN → Penjualan Kosmetik/Sampel/dst, lalu COST OF GOODS SOLD → HARGA POKOK PENJUALAN → rincian per akun, dst) untuk **tabel gabungan/ringkasan utama**. Untuk breakdown tambahan di luar tabel utama ini (misal drill-down per akun atau per periode banding), baru pakai format kolom gaya ERP baru (kolom-kolom terpisah, bukan hierarkis).

**Filter:** Periode date range custom, Export Excel

## 11.3 Report Penjualan (halaman baru)

**Purpose:** rekap penjualan (lihat catatan di 3.4) — ringkasan penerimaan/transaksi penjualan per customer/per periode, terpisah dari halaman transaksi Bayar Penjualan.

**Cards:** Total Penjualan Periode Ini, Total Diterima, Outstanding
**Table columns:** Customer | Contract Type | Jumlah Invoice | Total Amount | Total Diterima | Outstanding
**Filter:** Periode date range custom, Customer, Contract Type

## 11.4 Report Lainnya

| Report | Sumber Data |
|---|---|
| Cash Flow Statement | Kas Bank Masuk/Keluar + adjustment non-cash |
| AR Aging | Bagian 3.6 (juga muncul di BusDev) |
| AP Aging | Bagian 2.5 |
| Budget vs Actual | Bagian 7.2 |
| Product/Customer Profitability | Bagian 8.3 |

> Catatan: "Cost Center Report by Dimension" yang tadinya direncanakan di sini **tidak jadi dibangun** karena Financial Dimensions dihapus dari input (lihat 0.1). Analisis per-Brand masih bisa didekati lewat Customer Master, tapi analisis per-Department/Cost Center perlu jalur data lain kalau nanti dibutuhkan.

**Fitur wajib di semua report:** drill-down dari angka summary → transaksi detail → journal entry → source document. Ini yang paling sering dilewatkan — kalau gak ada, laporan cuma angka statis yang gak bisa diaudit.

---

# Urutan Implementasi yang Disarankan untuk AI/Developer

```
Sprint 1 — Fondasi
  0.1 Financial Dimensions — TIDAK diimplementasi sebagai input (lihat catatan revisi di 0.1), cukup baca sebagai referensi arsitektur
  0.2 Document Numbering — full auto-generate semua kode (dokumen + master data)
  0.3-0.5 Status Flow, Approval Engine, Posting Principle
  0.6 Inventory Ownership Type (Consignment) — koordinasi dengan modul Inventory
  0.7 Standar UI Global — search-select di semua field master data, date range picker custom di semua filter periode
  1.1-1.2 COA + Posting Rules
  1.3-1.4 Jurnal Umum + Buku Besar (kolom disamakan ke ERP existing)

Sprint 2 — AP lengkap
  2.1 Vendor Master (+ Import Excel, Kategori Riil + Kategori COA)
  2.2 Faktur Pembelian (+ Import Excel, custom invoice date, detail barang + diskon, tab Semua/Sudah/Belum Dibayar + notes, matching engine 4-leg dengan akurasi di-hide dari UI)
  2.3 DP Pembelian
  2.4 Bayar Pembelian (navbar/card konsisten dengan 2.3)
  2.5 AP Aging (+ color coding H-7/H-3/overdue, card H-7 & H-3, saldo bank di navbar)
  2.6 Pengajuan Dana (baru — pola sama dengan Persetujuan Pembelian, approval Kepala Divisi → Accounting → Direktur)
  ⚠ butuh modul QC punya field "QC Passed Qty" per item sebelum matching engine full 4-leg jalan
  ⚠ butuh konfirmasi urutan approval Pengajuan Dana yang persis (lihat catatan di 2.6)

Sprint 3 — AR lengkap
  3.1 Customer Master (+ Contract Type, cards Sample/Produksi/Legalitas)
  3.2 Faktur Penjualan (semua fitur sama dengan 2.2 + AR Delivery Gatekeeper — butuh integrasi 2 arah dengan modul Warehouse)
  3.3 DP Penjualan (tab Sample/Legalitas/Produksi)
  3.4 Bayar Penjualan (+ field PPh 23 dipotong customer)
  3.5 Collections
  3.6 AR Aging (+ muncul di dashboard Laporan BusDev)
  3.7 Sample Fee (+ offsetting engine ke DP Produksi)

Sprint 4 — Cash & Bank upgrade
  4.1 Bank Account Master
  4.2 Kas Bank Masuk (card cuma Total Kas, kolom disamakan ERP existing)
  4.2b Kas Bank Keluar (struktur sama dengan 4.2)
  4.3 Bank Reconciliation (+ filter COA, date range custom)
  (pastikan integrasi auto-post dari Sprint 2 & 3)

Sprint 5 — Tax & Compliance (ruang lingkup dipersempit — TANPA e-Faktur/e-Bupot)
  5.1-5.2 PPN, PPh 23 WHT Deduction Engine, rekap PPh 21
  5.3 Client Escrow / Pass-Through Disbursement Ledger (BPOM/HKI/uji lab)

Sprint 6 — Fixed Assets, Budget
  6.1 Asset Register (+ sub-tab Purchase History)
  6.2 Depreciation Schedule (+ tabel default masa manfaat: Inventaris 4th, Motor 4th, Mobil 8th, Bangunan Permanen 20th)
  6.3-6.4, 7.1-7.2

Sprint 7 — Cost & Profitability (setelah modul Production siap data BOM/Job Order)
  8.1-8.4 (+ Scrap/Wastage cost tracking, consignment-aware material cost)

Sprint 8 — Closing & Controls upgrade, Dashboard, Reports
  9.1-9.2 (tambah Period Lock: soft lock = warning+override, hard lock = butuh Adjustment Journal)
  10 Finance Overview
  11.1-11.4 (Laba Rugi format hybrid lama+baru, Report Penjualan baru, semua report pakai date range custom)
```
