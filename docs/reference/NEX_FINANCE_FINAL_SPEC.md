# NEX FINANCE MODULE — FINAL SPECIFICATION
**Single Source of Truth untuk Modul Finance NEX ERP**

> **Versi:** 1.0 — 7 September 2026
> **Enterprise:** PT. Karya Impian Laboratoris (Dreamlab — Toll Manufacturing Kosmetik & Skincare)
> **Spesifikasi ini adalah hasil rekonsiliasi dari 3 sumber:**
> 1. `NEX-Finance-Module-Full-Spec (1).md` — Spec D365-inspired (struktur utama)
> 2. `REQUIREMENT.md` — 34 poin perubahan Upii (kewenangan final untuk behaviour)
> 3. `LEGACY_ERP_SPEC.md` + `kil_erp_full_inventory_v2.csv` — Kolom/tabel ERP lama GsERP KIL

---

## Cara Baca Dokumen Ini

Per halaman finance, dokumen mengikuti format:

```
**Legacy URL**         — path di ERP lama (kalau ada), untuk konsistensi migrasi data
**Table Columns**      — Kolom tabel = SAMA PERSIS ERP LAMA (konsistensi data historis)
**Form Fields**        — Field input, ada tambahan D365-style (search-select, date range custom)
**Cards (NEW)**        — KPI cards di atas tabel = BARU (D365-inspired), bukan dari legacy
**Status Flow**        — state machine dokumen
**Business Logic**     — validasi & aturan
**Journal Posting**    — jurnal otomatis saat Posted
**Ref**                — NEX-Finance §X.X | REQUIREMENT Poin # | Legacy URL
```

---

## Prinsip Penyelarasan (Reconciliation Rules)

1. **Kolom & Tabel dari legacy** → Pakai **nama persis ERP lama**. Kalau ada kolom "Real Stok" di legacy, pakai "Real Stok" (jangan ganti jadi "Current Stock"). Ini untuk konsistensi migrasi data historis.
2. **Cards & KPI di atas tabel** → Boleh **baru (D365-inspired)**. Legacy GsERP tidak punya cards untuk banyak halaman (kasus seperti Faktur Pembelian cuma tabel). Tambahan cards dari D365 jadi value-add.
3. **Behaviour** → **REQUIREMENT.md selalu menang.** Setiap poin Upii yang dikonfirmasi adalah binding — overrides default D365 behaviour kalau konflik.
4. **Search-select & date range picker** → WAJIB di semua field master-data reference dan semua filter periode (REQUIREMENT Poin 26, 58).
5. **Auto-generated codes** → Semua kode dokumen & master data auto-generate (tidak ada input manual) — sesuai Format Kode Universal (Lampiran A).
6. **Posting Otomatis** → Wajib locked dari awal: setiap dokumen operasional saat Posted otomatis generate journal entry. Jurnal Umum manual hanya untuk adjustment/accrual (REQUIREMENT Poin 23-25).

---

## Cross-Reference Matrix (Ringkasan)

| Halaman | Legacy URL | NEX-Finance § | REQUIREMENT Poin |
|---|---|---|---|
| COA | `/coa-manage` | 1.1 | — |
| CoA Jurnal Otomatis | `/coa-auto-manage` | 1.2 | — |
| Jurnal Umum | `/general-journal` | 1.3 | 23, 24, 25 |
| Buku Besar | `/report-general-ledger` | 1.4 | 30 |
| Vendor Master | `/supplier-manage` | 2.1 | 1, 3 |
| Faktur Pembelian | `/purchase-invoice` | 2.2 | 4, 5, 6, 7, 8, 9 |
| DP Pembelian | `/purchase-down-payment` | 2.3 | 9 |
| Bayar Pembelian | `/purchase-payment` | 2.4 | 9 |
| AP Aging | `/report-ap-aging` | 2.5 | 10, 11, 12 |
| Pengajuan Dana | `/fund-request` | 2.6 | 20, 21, 22 |
| Customer Master | `/customer-manage` | 3.1 | 2 |
| Faktur Penjualan | `/sales-invoice` | 3.2 | 13, 14 |
| DP Penjualan | `/sales-down-payment` | 3.3 | 14 (tab) |
| Bayar Penjualan | `/sales-payment` | 3.4 | 13, 14, 15 |
| Collections | `/collections` | 3.5 | — |
| AR Aging | `/report-ar-aging` | 3.6 | 15 |
| Sample Fee | `/sales-sample-payment` | 3.7 | 14 (offsetting) |
| Bank Account Master | `/bank-account-manage` | 4.1 | — |
| Kas Bank Masuk | `/other-deposit` | 4.2 | 16, 17 |
| Kas Bank Keluar | `/other-payment` | 4.2b | 17 |
| Bank Reconciliation | `/bank-reconciliation` | 4.3 | 18, 19 |
| Tax Setup | `/tax-setup` | 5.1 | 34 |
| Tax Transactions | `/tax-transactions` | 5.2 | 13 (PPh 23), 34 |
| Client Escrow | `/client-escrow` | 5.3 | — |
| Asset Register | `/asset-register` | 6.1 | 27, 28, 29, 30 |
| Depresiasi Schedule | `/depreciation-schedule` | 6.2 | 29, 30 |
| Asset Transfer/Disposal | `/asset-transfer-disposal` | 6.3 | — |
| Compliance/Intangible | `/compliance-asset` | 6.4 | — |
| Budget Entry | `/budget-entry` | 7.1 | — |
| Budget vs Actual | `/budget-vs-actual` | 7.2 | — |
| Job Order Costing | `/job-order-costing` | 8.1 | — |
| Cost Variance | `/cost-variance` | 8.2 | — |
| Product/Customer Profitability | `/product-customer-profitability` | 8.3 | — |
| Cost Allocation Setup | `/cost-allocation-setup` | 8.4 | — |
| Checklist Progress / Period Lock | `/closing-checklist` | 9.1 | — |
| Adjustment Journal | `/adjustment-journal` | 9.2 | — |
| Dashboard Finance | `/dashboard-finance` | 10.1 | — |
| Widget AR Aging di BusDev | `/dashboard-business-development` | 10.2 | 15 |
| Neraca | `/report-balance-sheet` | 11.1 | 30 |
| Neraca Saldo | `/report-trial-balance` | 11.1b | — |
| Laba Rugi | `/report-profit-loss` | 11.2 | 30, 31, 32, 33 |
| Cash Flow | `/report-cash-flow` | 11.4 | — |
| Report Penjualan | `/report-sales-summary` | 11.5 | 14 (sidebar rename) |

---

# BAGIAN 0 — FONDASI
*Dipakai semua modul finance. Wajib dibangun duluan.*

## 0.1 Financial Dimensions — DIHAPUS

> **Status per REQUIREMENT Poin 25:** Field "Dimensi Finansial" di form input transaksi **DIHAPUS**.
>
> **Implikasi yang terkunci:**
> - Tidak ada dropdown Department/Cost Center/Brand/Product Line di level input manual.
> - **Cost Center Report** dan **Product/Customer Profitability** yang tadinya bergantung dimension → kehilangan sumber data. Solusi: gunakan Customer Master untuk per-Brand tracking, Kategori Pengadaan (POA) untuk per-kategori.
> - **Job Order Costing** tetap aman (ada field Job Order Reference tersendiri).
> - Brand/Client tracking otomatis dari Customer Master.
>
> **Data model di bawah TIDAK diimplementasikan sebagai UI input** — hanya jadi referensi arsitektur kalau suatu saat mau dihidupkan lagi.

```
dimension_types, dimension_values, transaction_dimensions (REFERENSI ONLY)
```

## 0.2 Document Numbering

**Format:** `{PREFIX}-{YYMM}-{XXXX}` — sequence **reset tiap bulan per prefix**.

| Prefix | Dokumen | Legacy code | Catatan |
|---|---|---|---|
| FP | Faktur Pembelian | `FP-YYMM-XXXX` | sequence per bulan |
| DPB | DP Pembelian | `DPB-YYMM-XXXX` | |
| BPB | Bayar Pembelian | `BPB-YYMM-XXXX` | |
| BSP | Bayar Sample | `BSP-YYMM-XXXX` | |
| DPJ | DP Penjualan | `DPJ-YYMM-XXXX` | |
| FJ | Faktur Penjualan | `FJ-YYMM-XXXX` | |
| BPJ | Bayar Penjualan | `BPJ-YYMM-XXXX` | |
| JU | Jurnal Umum | `JU-YYMM-XXXX` | |
| KBM | Kas Bank Masuk | `KBM-YYMM-XXXX` | |
| KBK | Kas Bank Keluar | `KBK-YYMM-XXXX` | |
| JO | Job Order | `JO-YYMM-XXXX` | |
| AJ | Adjustment Journal | `AJ-YYMM-XXXX` | |
| ESC | Client Escrow | `ESC-YYMM-XXXX` | |
| AST | Asset Code | `DL-FIN-AST-DDMMYYYY-XXXX` | **Global sequence, tidak reset** (REQUIREMENT Poin 28) |
| SO | Sales Order | `DL-SAL-SO-DDMMYYYY-XXXX` | **Global sequence** (Lampiran A) |
| PO | Purchase Order | `DL-PRD-PO-DDMMYYYY-XXXX` | **Global sequence** (REQUIREMENT Poin 56) |

> **Untuk kode master data non-finance** (SO, PO, barang, aset): sequence global & berkelanjutan (tidak reset per tahun/bulan), lihat Lampiran A.
> **Ref:** NEX-Finance §0.2 | REQUIREMENT Poin 28, 56

## 0.3 Generic Status Flow
```
Draft → Pending Approval → Approved → Posted → (Paid/Closed) → Cancelled*
```
*Cancelled hanya bisa dari Draft/Pending Approval. Dokumen Posted tidak boleh dihapus langsung — harus lewat reversal/credit note/adjustment.*

## 0.4 Generic Approval Engine
```
approval_rules: id, document_type, min_amount, max_amount, approver_role
approval_logs: id, document_type, document_id, approver_id, action, note, timestamp
```
Engine assign approver role sesuai document_type + amount threshold.

## 0.5 Prinsip Posting Otomatis (WAJIB LOCKED)
> Setiap dokumen transaksi yang berubah status ke **Posted** WAJIB otomatis generate journal entry. User tidak boleh input manual journal untuk transaksi operasional harian — manual hanya untuk adjustment/accrual/reclassification.
>
> **Ref:** NEX-Finance §0.5 | REQUIREMENT Poin 23-25 (Jurnal Umum)

## 0.6 Inventory Ownership Type (Consignment / Free-Issue)

```
inventory_items: ... + ownership_type (OWNED_ASSET / CUSTOMER_CONSIGNMENT), owner_customer_id
```

- `CUSTOMER_CONSIGNMENT` dari client (bukan vendor) → **Dr Inventory = Rp 0** saat Goods Receipt.
- Item consignment dipakai di Job Order → qty tercatat untuk batch record, **tidak menambah Material Cost**.
- Report Inventory Valuation → exclude consignment secara default.
- **Ref:** NEX-Finance §0.6

## 0.7 Standar UI Global (WAJIB)
- **Search-select** untuk semua field master-data reference (Vendor, Customer, Account/COA, Bank, Job Order). Tidak ada free-type untuk data master.
- **Date range picker custom** untuk semua filter periode (bukan dropdown bulan saja). Bebas lintas bulan/tahun.
- **Kode otomatis** untuk semua nomor dokumen & kode master data.
- **Ref:** NEX-Finance §0.7 | REQUIREMENT Poin 26, 58

---

# BAGIAN 1 — GENERAL LEDGER

## 1.1 COA (Chart of Accounts)

**Legacy URL:** `/coa-manage` (+ `/coa-manage/create`)

**Table Columns (SAMA LEGACY):**
| Column | Type | Keterangan |
|---|---|---|
| Account Code | string | unique, format `1xxx` Asset, `2xxx` Liability, dst (lihat Lampiran B) |
| Account Name | string | |
| Account Type | enum | Asset / Liability / Equity / Revenue / Expense |
| Parent Account | ref | untuk hierarki/subtotal |
| Normal Balance | enum | Debit / Credit |
| Is Active | bool | |

**Form Fields:**
- Account Code (auto numbering by type)
- Account Name
- Account Type
- Parent Account (search-select)
- Normal Balance
- **Allow Manual Journal** (bool — default `false` untuk akun kontrol: AP Control, AR Control, WIP; override `true` untuk akun yang butuh accrual)

**CRUD:**
- Create/Update: bebas selama belum ada transaksi
- **Delete: hanya kalau belum pernah dipakai transaksi** (FK constraint) — kalau sudah → **deactivate** (bukan hard delete)

**Ref:** NEX-Finance §1.1

## 1.2 CoA Jurnal Otomatis (Posting Rules)

**Legacy URL:** `/coa-auto-manage`

**Purpose:** "Otak" dari prinsip posting otomatis (§0.5).

**Table Columns:** Rule Name | Document Type | Condition | Debit Account | Credit Account | Active

**Form Fields:**
- Document Type (dropdown: Faktur Pembelian, Faktur Penjualan, DP, Pembayaran, Konsumsi BOM, dll)
- Condition (opsional, misal `Contract Type = Jasa Maklon` → akun revenue beda dengan `Jual Putus`)
- Debit Account (search-select COA)
- Credit Account (search-select COA)

**Contoh isi:**
```
Faktur Pembelian (non-inventory) → Dr Expense/Inventory | Cr AP Control
Faktur Pembelian (raw material)  → Dr Inventory Raw Material | Cr AP Control
DP Pembelian                     → Dr AP Prepayment        | Cr Bank/Cash
Bayar Pembelian                  → Dr AP Control           | Cr Bank/Cash
Faktur Penjualan (jasa maklon)   → Dr AR Control           | Cr Revenue - Jasa Maklon
Faktur Penjualan (jual putus)    → Dr AR Control           | Cr Revenue - Penjualan Barang
DP Penjualan                     → Dr Bank/Cash            | Cr AR Advance
Bayar Penjualan                  → Dr Bank/Cash            | Cr AR Control
```

**Akses:** Hanya Finance Admin/Controller yang boleh edit (high-risk area).

**Ref:** NEX-Finance §1.2

## 1.3 Jurnal Umum

**Legacy URL:** `/general-journal` (+ `/general-journal/create`)

**Cards (NEW — tidak ada di legacy):**
- Total Debit Bulan Ini
- Total Credit Bulan Ini
- **Unbalanced Draft Journal (harus 0)**

**Table Columns (SAMA LEGACY G-SERP — REQUIREMENT Poin 24):**
| # | Kode | Tanggal | Deskripsi | Debit | Kredit | Tipe | Referensi | Status | Aksi |
|---|---|---|---|---|---|---|---|---|---|

- **Tipe** otomatis terisi sesuai sumber posting (Manual / Sales Sample Invoice / Good Receipt / Stock Opname / dll)
- **Referensi** link ke dokumen sumber

**Filter (NEW):**
- **Periode — date range picker custom** (REQUIREMENT Poin 23, 58) — bukan dropdown bulan

**Form Fields:**
- Header: Date, Description, Reference (opsional)
- Line (repeatable): Account (search-select), Debit, Credit, Line Description

**Status Flow:** Draft → Pending Approval (kalau amount > threshold) → Approved → Posted

**Business Logic (WAJIB):**
- Total Debit = Total Kredit sebelum submit (**Balanced Check**).
- **Tidak boleh posting ke akun `Allow Manual Journal = false`** (kecuali via Adjustment Journal khusus).
- **Tidak boleh posting ke periode Hard-Locked** — harus lewat Adjustment Journal (§9.2).
- **Field "Dimensi Finansial" DIHAPUS** dari form (REQUIREMENT Poin 25).
- Kolom Tipe & Referensi **wajib auto-filled** untuk semua entry hasil posting otomatis dari subledger.

**Ref:** NEX-Finance §1.3 | REQUIREMENT Poin 23, 24, 25

## 1.4 Buku Besar (General Ledger Report)

**Legacy URL:** `/report-general-ledger`

**Cards (NEW):** Opening Balance, Total Debit, Total Credit, Closing Balance (per akun yang dipilih)

**Table Columns (SAMA LEGACY — hierarkis per grup akun):**
| Kode CoA | Nama CoA | Opening | Debet | Kredit | Perubahan | Saldo |

**Filter (NEW):**
- **Periode — date range picker custom** (REQUIREMENT Poin 30)
- Account (single/multi, search-select)

**Fitur wajib:**
- Drill-down dari baris → buka journal entry asli → buka source document
- Tombol **Export Excel**
- Tampilan hierarkis (mengikuti parent-child COA dari §1.1)

**Ref:** NEX-Finance §1.4 | REQUIREMENT Poin 30

---

# BAGIAN 2 — ACCOUNTS PAYABLE

## 2.1 Vendor Master

**Legacy URL:** `/supplier-manage` (+ `/supplier-manage/create`, `/supplier-category-manage`)

**Table Columns (SAMA LEGACY + tambahan sesuai REQUIREMENT):**
| Vendor Code | Name | Kategori COA | Payment Term | Bank Account | NPWP | PKP Status | Active |

> **Per REQUIREMENT Poin 1:** **Vendor Code** auto-generate (bukan input manual).
> **Per REQUIREMENT Poin 1:** Kategori pengadaan **hanya berdasarkan COA** (tidak ada kategori riil Bahan Baku/Primer/Sekunder/Pembantu sebagai field terpisah — lihat klarifikasi di Poin 47 legacy).

**Form Fields:**
- Vendor Code (auto)
- Name
- **Kategori COA** (search-select ke akun GL — menentukan akun otomatis saat Faktur Pembelian untuk vendor ini)
- Address, PIC, Phone
- Payment Term (Net 30/Net 60/dst — angka hari)
- Bank Account (referensi pembayaran)
- NPWP
- PKP Status (bool — kena PPN atau tidak; **REQUIREMENT Poin 3**: PKP Status menentukan auto-calc PPN Masukan di Faktur Pembelian)

**CRUD:** Full CRUD; Delete hanya kalau belum ada transaksi, kalau sudah → deactivate.

**Import Excel (NEW):**
- Tombol "Import Excel" (REQUIREMENT Poin 1)
- Template: Vendor Code kosong/auto, Name, Kategori COA, Payment Term, dst
- Validasi baris per baris (duplikat nama, kategori tidak ditemukan, dll) → preview + error report sebelum commit final

**Ref:** NEX-Finance §2.1 | REQUIREMENT Poin 1, 3

## 2.2 Faktur Pembelian (Vendor Invoice)

**Legacy URL:** `/purchase-invoice`

**Cards (NEW):**
- Outstanding AP Total
- Due This Week
- Overdue
- Awaiting Approval

**Navbar tabs (NEW — REQUIREMENT Poin 7):** `Semua Tagihan` | `Sudah Dibayar` | `Belum Dibayar`

**Table Columns (SAMA LEGACY + tambahan):**
| Invoice No | Vendor | Invoice Date | Due Date | Amount | Outstanding | Status | **Notes** (alasan belum dibayar, hanya tampil kalau ada isi & status Belum Dibayar) |

> **Per REQUIREMENT Poin 4:** **Invoice Date bisa di-custom** (tidak read-only, tidak terkunci tanggal sistem)
> **Per REQUIREMENT Poin 5:** Tombol "Import Excel" untuk batch input
> **Per REQUIREMENT Poin 6:** Line detail = **rincian barang yang dibeli** + **field Diskon**
> **Per REQUIREMENT Poin 7:** Tab filter + Notes alasan belum dibayar
> **Per REQUIREMENT Poin 8:** **Akurasi 3-way matching % di-HIDE dari UI** (engine jalan di belakang, user cuma lihat status Matched/Exception)

**Form Fields (header):**
- Vendor (search-select)
- Invoice No (vendor's own number)
- **Invoice Date (custom, bukan read-only)** — REQUIREMENT Poin 4
- Due Date (auto dari Payment Term vendor, bisa override)
- PO Reference (opsional — link ke Purchase Order)
- **Notes** (alasan belum dibayar, wajib tampil/muncul saat invoice lewat due date & status Belum Dibayar)

**Form Fields (line):**
- **Detail Barang/Jasa** (search-select ke Item Master atau free text spec untuk non-item)
- Qty, Unit Price
- **Diskon (nominal atau %, per line)** — REQUIREMENT Poin 6
- Amount (setelah diskon)
- Account (auto dari Kategori COA vendor, bisa override)
- Job Order Reference (opsional)

**Attachment:** Upload invoice asli (PDF/image).

**Status Flow:** Draft → (Matching Check kalau ada PO) → Pending Approval → Approved → Posted → Paid/Partial

**Business Logic (REQUIREMENT Poin 5, 8, 13):**
- **Matching engine 4-leg:** `PO (Ordered) ↔ GRN (Warehouse Received) ↔ QC Passed Qty ↔ Vendor Invoice`. Invoice hanya match ke **Qty yang lolos QC**, bukan sekadar diterima gudang.
- **Tolerance Engine:** qty & price variance punya toleransi per kategori vendor. Dalam toleransi → auto-approve matching. Di luar → status "Exception", butuh review manual.
- **Akurasi matching (%) di-hide dari UI** — user hanya lihat status akhirnya (Matched/Exception).
- **Reject handling:** QC reject sebagian → otomatis generate **Debit Note / Pending Retur AP** untuk selisih qty reject.
- **Diskon per line dikurangkan dari Amount sebelum PPN dihitung.**
- **PPN otomatis dihitung** kalau Vendor.PKP_Status = true.
- **Prasyarat:** butuh field "QC Passed Qty" dari modul QC sebagai data source.

**Journal Posting Logic (saat Posted):**
```
Dr Inventory/Expense (per line, sesuai account)     xxx
Dr PPN Masukan (kalau PKP)                          xxx
    Cr AP Control (Vendor)                              xxx
```

**Ref:** NEX-Finance §2.2 | REQUIREMENT Poin 4, 5, 6, 7, 8, 13

## 2.3 DP Pembelian (Advance to Vendor)

**Legacy URL:** `/purchase-down-payment` (+ `/purchase-down-payment/create`)

**Cards (NEW):** Total DP Outstanding | DP Belum Diapply

**Table Columns:** DP No | Vendor | Date | Amount | Applied To | Remaining Balance | Status

**Form Fields:** Vendor (search-select), Date, Amount, Bank Account (search-select), Note

**CRUD:** Create, update saat Draft, **tidak bisa delete kalau sudah Posted.**

**Status Flow:** Draft → Approved → Posted → (Applied - saat offset invoice) → Fully Applied

**Business Logic:** Saat Faktur Pembelian dibuat untuk vendor yang punya DP outstanding → sistem tampilkan notifikasi/opsi apply DP ke invoice tsb.

**Journal Posting Logic:**
```
Saat DP dibayar:
Dr AP Prepayment (Vendor)        xxx
    Cr Bank/Cash                     xxx

Saat DP di-apply ke invoice:
Dr AP Control (Vendor)           xxx
    Cr AP Prepayment (Vendor)        xxx
```

**Ref:** NEX-Finance §2.3

## 2.4 Bayar Pembelian (Vendor Payment)

**Legacy URL:** `/purchase-payment`

**Cards (NEW):** Total to Pay Today | Total Selected (saat batch payment)

**Table Columns (Payment Proposal view):** checklist | Vendor | Invoice Ref | Due Date | Amount | Bank Account tujuan

**Form Fields:** Payment Date, Bank Account (search-select), pilih 1 atau banyak invoice untuk dibayar (batch)

**Status Flow:** Draft → Pending Approval → Approved → Posted (auto-update invoice terkait jadi Paid/Partial)

**Business Logic:**
- **Konsistensi navbar/card** dengan DP Pembelian (§2.3) — **REQUIREMENT Poin 9**: urutan card & tab di kedua halaman harus sama polanya. Pola: **Bayar Pembelian lalu DP Pembelian**.
- Partial payment diperbolehkan.
- Kalau ada selisih pembulatan/diskon pembayaran cepat → field adjustment terpisah (bukan diselipkan ke amount utama).

**Journal Posting Logic:**
```
Dr AP Control (Vendor)        xxx
    Cr Bank/Cash                 xxx
```

**Ref:** NEX-Finance §2.4 | REQUIREMENT Poin 9

## 2.5 AP Aging Report

**Legacy URL:** `/report-ap-aging`

**Navbar (NEW — REQUIREMENT Poin 12):** menampilkan **Saldo Bank saat ini** (real-time dari §4.1 Bank Account Master, total semua akun aktif) — biar user bisa bandingkan AP yang harus dibayar vs uang tersedia tanpa pindah halaman.

**Cards (NEW):**
- Total Outstanding
- **Jatuh Tempo H-7** (due dalam 7 hari)
- **Jatuh Tempo H-3** (due dalam 3 hari)
- Overdue

**Table Columns (SAMA LEGACY):** Vendor | Invoice No | Invoice Date | Due Date | Days to Due / Days Overdue | Amount | Bucket

**Color Coding (NEW — REQUIREMENT Poin 10):**
- **H-7 sampai H-4** (jatuh tempo 4-7 hari lagi): highlight **kuning**
- **H-3 sampai H-0** (jatuh tempo 0-3 hari lagi): highlight **merah**
- **Overdue** (lewat jatuh tempo): teks **bold** + **animasi pulse/bounce ringan** pada baris atau badge statusnya (subtle, jangan berlebihan)

**Filter:** Vendor, Date Range (custom — REQUIREMENT Poin 58), Bucket

**Fitur:** Drill-down ke invoice detail

**Ref:** NEX-Finance §2.5 | REQUIREMENT Poin 10, 11, 12

## 2.6 Pengajuan Dana (Fund Request / Cash Advance)

**Legacy URL:** `/fund-request` (+ `/fund-request/create`)

> **Menggantikan Google Form** yang dipakai sekarang. **Pola UI & alur approval disamakan dengan Persetujuan Pembelian** yang sudah ada (REQUIREMENT Poin 22).

**Cards (NEW):**
- Total Pengajuan Bulan Ini
- Menunggu Approval
- Sudah Dicairkan

**Table Columns:** No. Pengajuan | Pemohon | Departemen | Tujuan/Keperluan | Amount | Level Approval Saat Ini | Status | Tanggal Pengajuan

**Form Fields:** Pemohon (search-select Employee Master, auto dari user login), Departemen, Tujuan/Keperluan, Amount, Tanggal Dibutuhkan, Attachment (quotation, dll)

**CRUD:** Create oleh karyawan; approve/reject oleh approver sesuai level; **tidak bisa edit setelah masuk approval chain** (kalau perlu revisi → reject dulu, buat pengajuan baru)

**Status Flow (REQUIREMENT Poin 21 — tiered approval):**
```
Draft → Submitted
     → Approval Level 1 (Kepala Divisi pemohon, **skip kalau pemohon = Head**)
     → Approval Level 2 (Accounting)
     → Approval Level 3 (Direktur)
     → Approved → Disbursed (auto-generate Kas Bank Keluar) → Closed
```

> **Per REQUIREMENT Poin 21:**
> - Jika diajukan oleh **Staff** → Head → Accounting → Direktur
> - Jika diajukan oleh **Head** → langsung Accounting → Direktur (skip level Head)

**Business Logic:**
- Threshold amount bisa skip level tertentu (misal < Rp 500rb cukup Accounting, tanpa Direktur)
- Setelah Disbursed → otomatis generate entry di Kas Bank Keluar (§4.2b) dengan referensi ke Pengajuan Dana ini

**Journal Posting Logic (saat Disbursed):**
```
Dr Uang Muka Karyawan / Beban (sesuai kategori)        xxx
    Cr Bank/Cash                                            xxx
```

**Ref:** NEX-Finance §2.6 | REQUIREMENT Poin 20, 21, 22

---

# BAGIAN 3 — ACCOUNTS RECEIVABLE

## 3.1 Customer Master

**Legacy URL:** `/customer-manage` (+ `/customer-manage/create`, `/customer-category-manage`, `/customer-my-manage`)

**Table Columns (SAMA LEGACY + tambahan):**
| Customer Code | Brand Name | Contract Type | Credit Limit | Payment Term | Active |

**Cards (NEW — REQUIREMENT Poin 2):** di halaman detail customer:
- Total Sample Fee (dari §3.7)
- Total Produksi / Job Order (dari AR + JO Costing)
- Total Legalitas / Escrow (dari §5.3)
- → supaya satu layar bisa nunjukin keterlibatan penuh satu client di 3 kategori, gak perlu buka 3 modul terpisah.

**Form Fields:**
- Customer Code (auto global)
- Brand/Company Name
- PIC
- **Contract Type** (Jasa Maklon / Jual Putus — field krusial untuk tax treatment & akun revenue)
- **Segmentasi (Sample / Produksi / Legalitas)** — REQUIREMENT Poin 2: field klasifikasi 3 kategori
- Credit Limit
- Payment Term
- NPWP
- Default Revenue Account
- Alamat Kirim

**CRUD:** Full CRUD; Delete hanya kalau belum ada transaksi.

**Ref:** NEX-Finance §3.1 | REQUIREMENT Poin 2

## 3.2 Faktur Penjualan (Customer Invoice)

**Legacy URL:** `/sales-invoice`

**Cards (NEW):**
- Outstanding AR
- Overdue AR
- Awaiting Approval

**Navbar tabs (NEW — REQUIREMENT Poin 13):** `Semua Tagihan` | `Sudah Dibayar` | `Belum Dibayar` (sama seperti Faktur Pembelian §2.2)

**Table Columns (SAMA LEGACY + tambahan):**
| Invoice No | Customer | Contract Type | Job Order Ref | Invoice Date | Due Date | Amount | Outstanding | Status | **Notes** (alasan belum dibayar) |

**Import Excel (NEW):** Tombol "Import Excel" — sama pola dengan §2.2.

**Form Fields (header):**
- Customer (search-select; Contract Type auto dari Customer Master, bisa override per invoice kalau kasus campuran)
- **Invoice Date (custom)** — REQUIREMENT Poin 13
- Due Date (auto dari Payment Term)
- **Job Order Reference** (opsional)
- Notes (alasan belum dibayar)

**Form Fields (line):**
- Detail Produk/Jasa (search-select)
- Qty, Unit Price
- **Diskon (nominal atau %, per line)** — REQUIREMENT Poin 13
- Amount (setelah diskon)

**Status Flow:** Draft → **Credit Limit Check** → Pending Approval → Approved → Posted → Paid/Partial

**Business Logic:**
- **Credit Limit Check:** saat submit → cek total outstanding AR customer + invoice baru vs Credit Limit. Kalau melebihi → block atau butuh approval khusus.
- **Contract Type** menentukan tax treatment & akun revenue (lihat §1.2 Posting Rules).
- **PPN otomatis** sesuai Contract Type.
- **AR Delivery Gatekeeper (`FINANCIAL_DELIVERY_RELEASE`):** field status tambahan di header, **default `HELD`**. Gudang **tidak bisa cetak Surat Jalan/DO** selama status `HELD`. Finance ubah ke `RELEASED` setelah pelunasan (biasanya sisa 50%) terverifikasi. Atau lewat approval "Credit Limit Bypass" untuk client korporat term 30 hari. **Butuh integrasi 2 arah dengan modul Warehouse (Surat Jalan cek status ini sebelum diterbitkan).**
- **Consignment-aware COGS:** kalau line item pakai bahan/kemasan consignment (lihat §0.6), qty tercatat di Delivery Order tapi **tidak menambah COGS**.
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

**Ref:** NEX-Finance §3.2 | REQUIREMENT Poin 13, 14

## 3.3 DP Penjualan (Customer Advance)

**Legacy URL:** `/sales-down-payment` (+ `/sales-down-payment/create`)

**Navbar tabs (NEW — REQUIREMENT Poin 14):** `Sample` | `Legalitas` | `Produksi`

> Tab dikelompokkan berdasarkan tujuan DP karena tiap kategori punya sifat & tujuan offsetting yang beda:
> - **Sample** → offset ke DP Produksi lewat §3.7
> - **Legalitas** → masuk Client Escrow Ledger (§5.3), bukan AR Advance biasa
> - **Produksi** → DP murni untuk job order produksi massal

**Table Columns:** DP No | Customer | Kategori | Date | Amount | Applied To | Remaining Balance | Status

**Form Fields:** Customer (search-select), Kategori (Sample/Legalitas/Produksi), Date, Amount, Bank Account (search-select), Note

**Status Flow:** Sama dengan DP Pembelian (§2.3).

> Untuk kategori "Legalitas," jurnal ngikutin logic §5.3 (Escrow), bukan logic DP Penjualan biasa.

**Journal Posting Logic (untuk Sample & Produksi):**
```
Saat DP diterima:
Dr Bank/Cash                xxx
    Cr AR Advance (Customer)    xxx

Saat DP di-apply ke invoice:
Dr AR Advance (Customer)    xxx
    Cr AR Control (Customer)    xxx
```

**Ref:** NEX-Finance §3.3 | REQUIREMENT Poin 14

## 3.4 Bayar Penjualan (Customer Receipt)

**Legacy URL:** `/sales-payment`

**Table Columns (SAMA LEGACY):** Receipt No | Customer | Date | Amount | Allocated To | Unallocated Balance

**Form Fields:** Customer (search-select), Date, Amount, Bank Account (search-select), alokasi ke 1 atau banyak invoice (partial allocation)
- **PPh 23 Dipotong Customer (NEW — REQUIREMENT Poin 13):** opsional, kalau customer withholding pajak sendiri (lihat §5.2)

**Status Flow:** Draft → Posted (auto-update invoice terkait)

**Business Logic:**
- Kalau amount diterima > total outstanding invoice yang dipilih → sisanya otomatis jadi AR Advance (bisa dipakai untuk invoice berikutnya)

**Halaman terkait — Report Penjualan:** selain halaman transaksi ini, ada halaman **Report Penjualan** terpisah di §11.5 yang merekap penerimaan penjualan (per customer/per periode) — supaya user gak perlu buka 1-satu transaksi Bayar Penjualan untuk lihat rekap.

**Sidebar menu rename (REQUIREMENT Poin 14):** judul/headline sidebar menu pembayaran penjualan diganti menjadi **"Report Penjualan"** (link ke §11.5, bukan ke halaman Bayar Penjualan ini).

**Journal Posting Logic:**
```
Dr Bank/Cash                xxx
    Cr AR Control (Customer)    xxx
```

**Ref:** NEX-Finance §3.4 | REQUIREMENT Poin 13, 14

## 3.5 Collections

**Legacy URL:** `/collections`

**Cards (NEW):** Total Overdue | Invoice >60 hari

**Table Columns:** Invoice | Customer | Days Overdue | Last Contact | Next Action Date | Notes

**CRUD:** Create/update collection note & reminder history per invoice (tidak menghasilkan jurnal — murni tracking)

**Ref:** NEX-Finance §3.5

## 3.6 AR Aging Report

**Legacy URL:** `/report-ar-aging`

Struktur sama seperti AP Aging (§2.5), tapi dari sisi customer.

**Cross-Module Visibility (NEW — REQUIREMENT Poin 15):** ringkasan AR Aging (Outstanding per customer + bucket) **WAJIB muncul di dashboard Laporan BusDev** (`/dashboard-business-development`) sebagai widget/card ringkas. **Bisa pakai shared widget, bukan build ulang AR Aging di BusDev.**

**Ref:** NEX-Finance §3.6 | REQUIREMENT Poin 15

## 3.7 Sample Fee (Bayar Sample)

**Legacy URL:** `/sales-sample-payment`

> **Purpose:** Client bayar fee trial/sample formula ke Dreamlab. Kalau lanjut ke kontrak produksi massal, fee ini **dikompensasikan sebagai pengurang DP Produksi**. Awalnya ditaruh di AP (§2.5) — setelah konfirmasi, arahnya **client bayar fee sample ke Dreamlab** (AR-side, bukan AP).

**Cards (NEW):**
- Total Sample Fee Diterima Bulan Ini
- Sample Fee Belum Di-offset (masih "nganggur", belum ada kontrak lanjutan)

**Table Columns (SAMA LEGACY + tambahan):**
| Sample Fee No | Prospective Client/Customer | Date | Amount | Status | Offset To (DP Produksi No, kalau sudah dipakai) | Job Order Ref (sample production, opsional) |

**Form Fields:**
- Customer/Prospective Client (bisa belum ada di Customer Master kalau masih prospek — pakai lightweight "Prospect" record yang bisa di-convert jadi Customer Master penuh saat closing)
- Date
- Amount
- Bank Account
- Note
- Validity Period (opsional — kalau fee cuma bisa di-offset dalam X bulan)

**Status Flow:** `Received` → `Offset` (saat dipakai potong DP Produksi) atau `Expired` (kalau lewat validity period tanpa lanjut kontrak — jadi revenue murni)

**Business Logic:**
- **Offsetting engine:** saat DP Penjualan (§3.3) dibuat untuk client yang punya Sample Fee berstatus `Received` → sistem tampilkan opsi "Apply Sample Fee sebagai pengurang DP". User pilih, sistem otomatis kurangi jumlah DP yang perlu dibayar client sejumlah Sample Fee.
- Sample Fee yang di-offset **tidak diakui sebagai revenue terpisah** — nilainya "berpindah" jadi bagian dari DP Produksi.
- Sample Fee yang `Expired` (gak pernah di-offset) baru diakui sebagai Revenue - Sample Fee murni saat itu juga.

**Journal Posting Logic:**
```
Saat fee diterima:
Dr Bank/Cash                              xxx
    Cr Sample Fee - Unearned (liability-like)   xxx

Saat di-offset ke DP Produksi:
Dr Sample Fee - Unearned                  xxx
    Cr AR Advance (Customer)                   xxx
(mengurangi jumlah DP yang perlu ditagih terpisah)

Saat Expired (gak jadi kontrak):
Dr Sample Fee - Unearned                  xxx
    Cr Revenue - Sample Fee                    xxx
```

**Ref:** NEX-Finance §3.7 | REQUIREMENT Poin 14

---

# BAGIAN 4 — CASH & BANK

## 4.1 Bank Account Master

**Legacy URL:** `/bank-account-manage` (+ `/bank-account-manage/create`)

**Table Columns (SAMA LEGACY):**
| Bank Name | Account No | Currency | Current Book Balance |

**Form Fields:** Bank Name, Account No, Account Type (Bank / Cash / Petty Cash), Currency, GL Account mapping (search-select)

**Cards (NEW — di header list):** Total Saldo Kas & Bank (konsolidasi seluruh rekening aktif)

> **Saldo real-time dari sini** menjadi sumber data untuk:
> - **Navbar AP Aging** (§2.5) — REQUIREMENT Poin 12
> - **Cash Position dashboard** (§10.1)

**Ref:** NEX-Finance §4.1

## 4.2 Kas Bank Masuk

**Legacy URL:** `/other-deposit` (+ `/other-deposit/create`)

**Cards (NEW — REQUIREMENT Poin 16):** **HANYA tampilkan Total Kas Masuk** (sesuai periode filter). Tidak perlu card lain supaya ringkas.

**Filter (NEW):** **Periode — date range picker custom lengkap kalender** (bukan dropdown bulan) + tombol Filter.

**Table Columns (SAMA LEGACY):**
| # | Kode | Tanggal | Deskripsi | Dari | Kas/Bank | Jumlah | Status | Aksi |

**Form Fields:** Tanggal, Dari (search-select — bisa Customer kalau auto dari AR, atau free description kalau manual), Kas/Bank (search-select), Jumlah, Deskripsi, Category (kalau manual)

**CRUD:**
- **Auto-generated entries** (dari Bayar Penjualan, DP Penjualan, Bayar Pembelian, DP Pembelian, Pengajuan Dana Disbursed): **read-only**, edit harus dari dokumen sumber.
- **Manual entries** (petty cash, bank charge, interest, dll yang gak ada dokumen sumber AR/AP): full CRUD saat Draft via tombol "+Buat".

**Business Logic:** Begitu modul AP/AR live, sebagian besar entry di halaman ini seharusnya muncul **otomatis**, bukan diinput manual lagi. Manual entry cuma untuk transaksi yang benar-benar tidak ada dokumen sumber lain.

**Ref:** NEX-Finance §4.2 | REQUIREMENT Poin 16

## 4.2b Kas Bank Keluar

**Legacy URL:** `/other-payment` (+ `/other-payment/create`)

**Struktur sama persis dengan Kas Bank Masuk (§4.2)**, dengan perbedaan:

**Table Columns (SAMA LEGACY):**
| # | Kode | Tanggal | Deskripsi | **Kepada** | **No. Tagihan** | Kas/Bank | Jumlah | Status | Aksi |

**Form Fields:** Tanggal, Kepada (search-select — Vendor kalau auto dari AP), No. Tagihan (ref invoice), Kas/Bank (search-select), Jumlah, Deskripsi, Category

**Cards:** hanya **Total Kas Keluar** (sesuai periode filter) — REQUIREMENT Poin 17

**Ref:** NEX-Finance §4.2b | REQUIREMENT Poin 17

## 4.3 Bank Reconciliation

**Legacy URL:** `/bank-reconciliation`

**Cards (NEW):** Statement Balance | Book Balance | Difference (harus 0 setelah reconciled)

**Filter (NEW — REQUIREMENT Poin 18, 19):**
- **Periode — date range picker custom lengkap kalender**
- **Filter berdasarkan COA** (akun bank/kas mana yang mau di-reconcile — search-select ke COA)

**Table (2 kolom):** Bank Statement Lines (dari import) | System Transactions (dari §4.2 / §4.2b)

**Fitur:**
- Import bank statement (CSV/Excel)
- **Matching engine:** auto-match by amount + date (toleransi ±2 hari), sisanya manual match drag-drop atau pilih pasangan
- Selisih yang gak ada pasangannya → create reconciliation journal langsung dari sini

**Journal Posting Logic (untuk selisih yang ditemukan):**
```
Dr Bank Charge Expense      xxx
    Cr Bank                     xxx
```

**Ref:** NEX-Finance §4.3 | REQUIREMENT Poin 18, 19

---

# BAGIAN 5 — TAX & COMPLIANCE

## 5.1 Tax Setup

**Legacy URL:** `/tax-setup`

**Table Columns (SAMA LEGACY):** Tax Code | Name | Rate (%) | GL Account | Status

**Form Fields:** Tax Code, Name (PPN Masukan / PPN Keluaran / PPh 23 / PPh 21), Rate, GL Account (search-select), Active

**CRUD:** Setup oleh Finance Admin.

**Ruang Lingkup (REQUIREMENT Poin 34):** PPN, PPh 23, rekap PPh 21. **TIDAK PERLU integrasi e-Faktur / e-Bupot DJP** — pelaporan resmi tetap manual/di luar NEX. Modul ini cukup untuk pencatatan internal & rekonsiliasi angka.

**Ref:** NEX-Finance §5.1 | REQUIREMENT Poin 34

## 5.2 Tax Transactions

**Legacy URL:** `/tax-transactions`

**Cards (NEW):**
- PPN Keluaran Bulan Ini
- PPN Masukan Bulan Ini
- PPN Kurang/Lebih Bayar
- PPh 23 Belum Disetor

**Table Columns:** Ref Document (Invoice No) | Tax Type | Base Amount | Rate | Tax Amount | Status (Accrued/Reported/Paid)

**Business Logic:**
- Baris di sini **otomatis muncul** dari Faktur Pembelian (PPN Masukan) dan Faktur Penjualan (PPN Keluaran, dan PPh 23 kalau Contract Type = Jasa dan customer withholding) — **bukan input manual**.
- **PPh 21 (REQUIREMENT Poin 13):** direkap di halaman ini sebagai baris informasi (total PPh 21 karyawan per bulan) untuk keperluan laporan keuangan — sumber data dari payroll/HR, Finance cuma menampilkan rekapnya.

**WHT (PPh 23) Deduction Engine (NEW):**
- Untuk invoice Jasa Maklon, customer sering memotong PPh 23 sendiri saat bayar (bukan Dreamlab yang setor). Jumlah yang diterima Dreamlab < nilai invoice.
- **Bayar Penjualan (§3.4)** punya field "PPh 23 Dipotong Customer" → sistem catat ini sebagai piutang pajak (Bukti Potong jadi kredit pajak Dreamlab), bukan dianggap invoice belum lunas penuh.

**Journal Posting Logic (PPh 23 dipotong saat penerimaan):**
```
Dr Bank/Cash                          xxx  (jumlah net diterima)
Dr PPh 23 Dibayar Dimuka              xxx  (kredit pajak, dari Bukti Potong)
    Cr AR Control (Customer)              xxx  (invoice tetap lunas penuh)
```

**Ref:** NEX-Finance §5.2 | REQUIREMENT Poin 13, 34

## 5.3 Client Escrow / Pass-Through Disbursement Ledger

**Legacy URL:** `/client-escrow`

> **Purpose:** Dreamlab menangani pembayaran BPOM/HKI/uji lab atas nama client. Ini **dana titipan (bukan revenue Dreamlab)** — kalau salah dicatat sebagai revenue, P&L jadi bias & pajak jadi salah hitung.

**Cards (NEW):**
- Total Deposit Client Outstanding
- Total Sudah Disbursed Bulan Ini
- Belum Direimburse ke Kas Negara

**Table Columns:** Escrow No | Client | Purpose (BPOM Registration / Uji Lab / HKI / Lainnya) | Deposit Received | Disbursed Amount | Remaining Balance | Status (Deposited / Partially Used / Fully Settled)

**Form Fields (deposit masuk):** Client, Purpose, Amount Diterima, Date, Bank Account
**Form Fields (disbursement/pembayaran keluar):** Escrow Ref, Purpose Detail (misal "PNBP Simponi - Produk X"), Amount, Date, Attachment (bukti bayar)

**Status Flow:** `Deposited` → `Partially Used` → `Fully Settled`

**Business Logic:**
- Deposit dari client **tidak pernah masuk Revenue** — selalu ke akun Liability (Client Escrow Deposit).
- Kalau ada sisa dana setelah semua kebutuhan dibayar → sistem generate refund ke client atau offer offset ke tagihan lain.
- Kalau dana titipan kurang → notifikasi top-up ke client (bukan Dreamlab yang nombokin otomatis).
- Report bulanan: rekonsiliasi deposit vs disbursed vs sisa per client.

**CRUD:** Full CRUD dengan approval untuk disbursement (uang keluar ke pihak ketiga).

**Journal Posting Logic:**
```
Saat deposit diterima dari client:
Dr Bank/Cash                             xxx
    Cr Client Escrow Deposit (Liability)    xxx

Saat dibayarkan ke instansi/lab:
Dr Client Escrow Deposit (Liability)     xxx
    Cr Bank/Cash                             xxx

(Tidak ada baris yang menyentuh akun Revenue atau Expense P&L Dreamlab sama sekali)
```

**Ref:** NEX-Finance §5.3

---

# BAGIAN 6 — FIXED ASSETS

## 6.1 Asset Register

**Legacy URL:** `/asset-register` (+ `/asset-register/create`)

**Table Columns (SAMA LEGACY):**
| Asset Code | Name | Category | Acquisition Date | Acquisition Cost | Accum. Depreciation | Book Value | Location | Department |

**Cards (NEW):**
- Total Nilai Perolehan Aset
- Total Akumulasi Penyusutan
- Total Nilai Buku Bersih (Book Value)

**Form Fields:**
- Asset Code (**auto Universal Global Sequence** — REQUIREMENT Poin 28, format `DL-FIN-AST-DDMMYYYY-XXXX`)
- Name
- Category (Inventaris / Motor / Mobil / Bangunan Permanen)
- Acquisition Date
- Acquisition Cost
- **Masa Manfaat** (default auto-fill dari tabel Kategori Masa Manfaat — lihat §6.2)
- Depreciation Method (Straight Line)
- Location
- Department
- Source (manual atau generate dari Faktur Pembelian yang di-flag sebagai capital expenditure)

**Sub-tab (NEW — REQUIREMENT Poin 27):** **Purchase History** di halaman detail tiap aset, mencatat:
- Penambahan/upgrade komponen ke asset sama (spare part besar yang menambah nilai buku)
- Riwayat perbaikan besar
- Link ke Faktur Pembelian asli

> **Beda dari Depreciation Schedule** (§6.2 — nyatet penyusutan). Purchase History nyatet histori penambahan nilai/perawatan besar.

**Purchase History Table Columns:** Tanggal | Jenis (Acquisition/Upgrade/Major Repair) | Ref Faktur Pembelian | Amount | Keterangan

**CRUD:** Full CRUD saat belum ada depresiasi berjalan; setelah ada → hanya bisa transfer/dispose, tidak edit langsung.

**Ref:** NEX-Finance §6.1 | REQUIREMENT Poin 27, 28, 29, 30

## 6.2 Depresiasi Schedule

**Legacy URL:** `/depreciation-schedule`

**Table (SAMA LEGACY):** Asset | Method | Monthly Depreciation | Next Run Date | Last Run Date

**Kategori Masa Manfaat (REQUIREMENT Poin 29, 30 — default useful life):**

| Kategori Asset | Masa Manfaat |
|---|---|
| Inventaris (furniture, alat kantor) | 4 tahun |
| Motor | 4 tahun |
| Mobil | 8 tahun |
| Bangunan Permanen | 20 tahun |

*(Kategori lain yang belum ada di tabel ini perlu di-set manual per aset sampai ditambahkan ke tabel default.)*

**Action:** Tombol "Run Depresiasi" bulanan (manual trigger atau scheduled job) → generate journal untuk semua asset aktif.

**Journal Posting Logic:**
```
Dr Depresiasi Expense (per Department asset)        xxx
    Cr Accumulated Depresiasi                          xxx
```

**Ref:** NEX-Finance §6.2 | REQUIREMENT Poin 29, 30

## 6.3 Asset Transfer / Disposal

**Legacy URL:** `/asset-transfer-disposal`

**CRUD:**
- Create **transfer** (ubah Department/Location)
- Create **disposal** (hitung gain/loss = Disposal Proceeds - Book Value)

**Journal Posting Logic (Disposal):**
```
Dr Accumulated Depresiasi      xxx
Dr Cash (kalau dijual)         xxx
Dr/Cr Loss/Gain on Disposal    xxx
    Cr Fixed Asset (at cost)       xxx
```

**Ref:** NEX-Finance §6.3

## 6.4 Compliance/Intangible Asset (Sertifikasi BPOM/Halal/ISO)

**Legacy URL:** `/compliance-asset`

**Cards (NEW):**
- Sertifikasi Aktif
- Mendekati Kadaluarsa (<90 Hari)
- Total Beban Amortisasi Bulan Ini

**Table Columns (SAMA LEGACY):**
| Cert Name | Type | Product/Brand | Issue Date | Expiry Date | Cost | Amortization Status | Days to Expiry |

**Business Logic:**
- **Reminder otomatis (NEW)** 90/60/30 hari sebelum expiry.
- Amortisasi jalan otomatis tiap bulan sepanjang masa berlaku (mirip depresiasi).

**Journal Posting Logic (amortisasi bulanan):**
```
Dr Amortization Expense - Compliance          xxx
    Cr Accumulated Amortization - Intangible      xxx
```

**Ref:** NEX-Finance §6.4

---

# BAGIAN 7 — BUDGET & PLANNING

## 7.1 Budget Entry

**Legacy URL:** `/budget-entry`

**Table:** grid Account × Department × Month (editable cell)

**Form Fields:** Budget Version (Draft/Approved), Fiscal Year, copy-from-previous-year + growth % (fitur cepat, opsional)

**CRUD:** Full CRUD saat Draft. **Approved version read-only** (revisi = buat versi baru).

**Ref:** NEX-Finance §7.1

## 7.2 Budget vs Actual

**Legacy URL:** `/budget-vs-actual`

**Cards (NEW):** Total Budget YTD | Total Actual YTD | Variance %

**Table Columns:** Department | Account | Budget | Actual | Variance | Variance % — drill-down ke transaksi actual

**Ref:** NEX-Finance §7.2

---

# BAGIAN 8 — COST & PROFITABILITY

> **Prasyarat:** Modul Production/Manufacturing harus sudah punya data BOM (formulasi) & Job Order sebelum halaman 8.1-8.3 fully functional.

## 8.1 Job Order Costing

**Legacy URL:** `/job-order-costing`

**Table Columns (SAMA LEGACY):**
| Job Order No | Client/Brand | Product | Qty | Material Cost | Labor Cost | Overhead Allocated | Packaging Cost | Total Cost | Cost/Unit | Status (Open/WIP/Closed) |

**Form Fields:** Auto-generate dari modul Production saat Job Order dibuat, Finance menerima cost roll-up-nya. Manual adjustment → form terpisah dengan approval.

**Business Logic (NEW):**
- **Material cost roll-up** dari BOM × actual consumption (Inventory/Mutasi Barang) — **hanya item `OWNED_ASSET`** yang masuk Material Cost (lihat §0.6 Consignment).
- Item `CUSTOMER_CONSIGNMENT` tercatat qty untuk batch record, **cost Rp 0**.
- **Scrap/Wastage tracking (NEW):** setiap Job Order punya expected yield % (dari BOM). Selisih actual output vs expected → tercatat sebagai **baris terpisah "Scrap/Wastage Cost"** di cost roll-up, bukan tercampur ke Material Cost — supaya jelas berapa cost hilang karena reject/susut.
- Overhead allocated dari §8.4.
- Status "Closed" → posting COGS & menutup WIP.

**Journal Posting Logic:**
```
Saat konsumsi material (dari Inventory):
Dr WIP         xxx
    Cr Inventory Raw Material    xxx

Saat Job Order Closed:
Dr COGS - Job Order    xxx
    Cr WIP                  xxx
```

**Ref:** NEX-Finance §8.1

## 8.2 Cost Variance

**Legacy URL:** `/cost-variance`

**Table Columns:** Job Order | Standard Cost | Actual Cost | Material Price Variance | Material Usage Variance | Labor Variance

**Fitur (NEW):** Highlight variance di atas threshold tertentu (misal >10%) untuk investigasi.

**Ref:** NEX-Finance §8.2

## 8.3 Product/Customer Profitability

**Legacy URL:** `/product-customer-profitability`

**Table Columns:** Product/Customer | Revenue | COGS | Gross Margin | Margin %

**Chart (NEW):** Ranking

**Ref:** NEX-Finance §8.3

## 8.4 Cost Allocation Setup

**Legacy URL:** `/cost-allocation-setup`

**Table Columns:** Overhead Pool | Allocation Base (Machine Hours / Volume / Headcount) | Formula | Active

**Form Fields:** Nama Pool*, Akun Biaya*, Dasar Alokasi*, Bobot Alokasi*

**Action:** Simulasi distribusi pembebanan overhead ke batch mixing dan packaging, lalu Run Allocation.

**CRUD:** Setup oleh Finance Controller.

**Ref:** NEX-Finance §8.4

---

# BAGIAN 9 — CLOSING & CONTROLS

## 9.1 Checklist Progress / Period Lock

**Legacy URL:** `/closing-checklist`

**Cards (NEW):** X/Y Tasks Completed (progress bar per periode)

**Table Columns (SAMA LEGACY + tambahan):** Task Name | Owner | Due Date | Status (Not Started / In Progress / Done / Blocked) | Evidence (attachment) | Approver | Completed At

**Form Fields (task template):** Task Name, Category (Bank Reconciliation / AP Review / AR Review / Inventory Valuation / Depresiasi / Accrual / Tax / GL Review / Financial Statements), Owner, Due Date

**CRUD:** Create task template (recurring tiap bulan), update status per periode.

**Fitur tambahan (NEW):**
- **Period Lock — soft lock:** warning saat input transaksi ke periode tsb.
- **Period Lock — hard lock:** semua transaksi di periode itu jadi read-only. Tombol "Lock Period [Bulan]" setelah mayoritas task Done.
- Transaksi baru untuk periode hard-locked → **harus lewat Adjustment Journal** (§9.2).

**Ref:** NEX-Finance §9.1

## 9.2 Adjustment Journal

**Legacy URL:** `/adjustment-journal`

**Table Columns (SAMA LEGACY):** Adjustment No | Original Period | Reason | Amount | Approver | Status

**Form Fields:** Sama seperti Jurnal Umum (§1.3), tapi field wajib:
- **Reason** (alasan adjustment)
- Flag **"This is for locked period"**

**CRUD:** Create dengan approval wajib (tidak ada shortcut).

**Business Logic:** Hanya bisa posting ke periode **hard-locked** lewat halaman ini. Approval minimal level Finance Manager/Controller.

**Ref:** NEX-Finance §9.2

---

# BAGIAN 10 — FINANCE OVERVIEW (DASHBOARD)

## 10.1 Dashboard Finance

**Legacy URL:** `/dashboard-finance`

**Cards row 1 (NEW — D365 style):**
| Cash Balance | AR Outstanding | Overdue AR | AP Outstanding | AP Due This Week | Net Cash Forecast 30D |

**Sections:**
- Cash Position & Forecast (chart line, 30 hari ke depan berdasarkan AR due + AP due)
- AR Aging vs AP Aging (side by side bar chart)
- Revenue / Gross Profit / Net Profit — MTD vs YTD (comparison)
- Budget vs Actual summary (per department, top 5 variance)
- Closing Progress (dari §9.1)
- Alerts/Exceptions: invoice matching exception, overdue >90 hari, credit limit breach, sertifikasi mendekati expired

**Filter:** Date range picker custom, Toggle Entity

**Business Logic:** Semua card **read-only**, hasil query/aggregate dari modul lain — tidak ada input di halaman ini.

**Ref:** NEX-Finance §10.1

## 10.2 Widget AR Aging di Dashboard BusDev (NEW)

**Legacy URL:** `/dashboard-business-development` (existing)

**Widget:** Ringkasan AR Aging (Outstanding per customer + bucket) — muncul sebagai card ringkas di dashboard BusDev.

> **Bisa pakai shared widget** (pull data dari §3.6), **bukan build ulang AR Aging di BusDev** (REQUIREMENT Poin 15).

**Ref:** NEX-Finance §10.2 | REQUIREMENT Poin 15

---

# BAGIAN 11 — FINANCIAL REPORTS

> **Aturan global:** Semua report pakai **date range picker custom** (lihat §0.7), bukan cuma dropdown bulan (REQUIREMENT Poin 58).

## 11.1 Neraca (Balance Sheet)

**Legacy URL:** `/report-balance-sheet`

**Format:** Hierarkis Description/Balance dengan indentasi per grup (sudah sesuai standar). **Balance Check banner** di atas. Tombol Export Excel.

**Filter:** Date range custom (REQUIREMENT Poin 30)

**Ref:** NEX-Finance §11.1 | REQUIREMENT Poin 30

## 11.1b Neraca Saldo (Trial Balance)

**Legacy URL:** `/report-trial-balance`

**Format:** Sama dengan Neraca (hierarkis), Balance Check, Export Excel.

**Ref:** NEX-Finance §11.1

## 11.2 Laba Rugi (Profit & Loss)

**Legacy URL:** `/report-profit-loss`

**Cards (di atas tabel, REQUIREMENT Poin 31, 32):**
- Total Pendapatan
- Total Beban HPP
- Laba Operasional Bersih

> **Urutan card: Pendapatan → HPP → Laba Kotor → Laba Operasional Bersih** (REQUIREMENT Poin 32 — kalau posisi card sekarang tertukar, urutan ini yang dipakai).

**Format tabel (REQUIREMENT Poin 33):**
- **Tabel gabungan/ringkasan utama** pakai **gaya ERP lama G-SERP** — hierarkis Description/Balance dengan indentasi per grup (OPERATING REVENUE → PENJUALAN → Penjualan Kosmetik/Sampel/dst, lalu COST OF GOODS SOLD → HARGA POKOK PENJUALAN → rincian per akun, dst).
- Untuk breakdown tambahan di luar tabel utama (misal drill-down per akun atau per periode banding) → pakai format kolom gaya ERP baru (kolom-kolom terpisah, bukan hierarkis).

**Filter:** Date range custom, Export Excel

**Ref:** NEX-Finance §11.2 | REQUIREMENT Poin 30, 31, 32, 33

## 11.3 Cash Flow Statement

**Legacy URL:** `/report-cash-flow`

**Sumber Data:** Kas Bank Masuk/Keluar + adjustment non-cash.

**Filter:** Date range custom.

**Ref:** NEX-Finance §11.4

## 11.4 AP Aging Report

Lihat §2.5.

## 11.5 AR Aging Report

Lihat §3.6.

## 11.6 Report Penjualan

**Legacy URL:** `/report-sales-summary`

> **Purpose:** Rekap penjualan — ringkasan penerimaan/transaksi penjualan per customer/per periode, **terpisah dari halaman transaksi Bayar Penjualan** (§3.4).

**Cards (NEW):** Total Penjualan Periode Ini | Total Diterima | Outstanding

**Table Columns:** Customer | Contract Type | Jumlah Invoice | Total Amount | Total Diterima | Outstanding

**Filter:** Date range custom, Customer, Contract Type

**Sidebar Rename (REQUIREMENT Poin 14):** Judul/headline sidebar menu **"Bayar Penjualan"** diganti jadi **"Report Penjualan"** yang mengarah ke halaman ini.

**Ref:** NEX-Finance §11.3 | REQUIREMENT Poin 14

## 11.7 Budget vs Actual

Lihat §7.2.

## 11.8 Product/Customer Profitability

Lihat §8.3.

> **Catatan:** "Cost Center Report by Dimension" yang tadinya direncanakan di sini **TIDAK dibangun** karena Financial Dimensions dihapus dari input (§0.1). Analisis per-Brand masih bisa lewat Customer Master, analisis per-Department/Cost Center perlu jalur data lain kalau nanti dibutuhkan.

**Fitur wajib di semua report:** Drill-down dari angka summary → transaksi detail → journal entry → source document. **Kalau gak ada, laporan cuma angka statis yang gak bisa diaudit** — sering dilewatkan.

---

# LAMPIRAN A — FORMAT KODE UNIVERSAL GLOBAL

## A.1 Kode Dokumen Finance (sequence per bulan)
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
| JO | Job Order |
| AJ | Adjustment Journal |
| ESC | Client Escrow |

**Format:** `{PREFIX}-{YYMM}-{XXXX}` — sequence reset tiap bulan per prefix.

## A.2 Kode Master Data Non-Finance (Global Sequence)

> **Nomor urut global & berkelanjutan — dimulai dari `0001` dan terus bertambah (`0002`, `0003`, dst.) mengikuti seluruh riwayat dari awal, tidak reset per tahun/kategori/periode** (REQUIREMENT Poin 56).

**Tersedia 2 versi (bisa dipilih/diganti):**

**Versi lengkap:** `{kode-perusahaan}-{divisi}-{produk}-{tanggal}-{nomor-urut}`
Contoh: `DL-FIN-SO-29062026-0001`

**Versi ringkas:** `{produk}-{tanggal}-{nomor-urut}` (tanpa kode perusahaan & divisi)
Contoh: `SO-29062026-0001`

| Kode | Contoh Lengkap | Contoh Ringkas |
|---|---|---|
| Asset | `DL-FIN-AST-29062026-0001` | `AST-29062026-0001` |
| Sales Order | `DL-SAL-SO-29062026-0001` | `SO-29062026-0001` |
| Purchase Order | `DL-PRD-PO-29062026-0001` | `PO-29062026-0001` |
| Barang | `DL-WH-BRG-29062026-0001` | `BRG-29062026-0001` |

## A.3 CoA Auto Numbering

| Prefix | Tipe Akun |
|---|---|
| `1xxx` | Asset |
| `2xxx` | Liability |
| `3xxx` | Equity |
| `4xxx` | Revenue |
| `5xxx` | Expense |

## A.4 Default Useful Life Aset (REQUIREMENT Poin 29, 30)

| Kategori | Masa Manfaat |
|---|---|
| Inventaris (furniture, alat kantor) | 4 tahun |
| Motor | 4 tahun |
| Mobil | 8 tahun |
| Bangunan Permanen | 20 tahun |

*(Kategori lain perlu di-set manual sampai ditambahkan ke tabel default.)*

---

# LAMPIRAN B — INTEGRASI CROSS-MODULE

| Modul | Arah Integrasi | Status |
|---|---|---|
| Faktur Penjualan → Warehouse | AR Delivery Gatekeeper (`HELD`/`RELEASED`) — Warehouse cek status sebelum cetak Surat Jalan | §3.2 |
| Warehouse (Penerimaan Barang) → Faktur Pembelian | QC Passed Qty → data source untuk 4-leg matching engine | §2.2 |
| Customer (Sample Fee) → DP Penjualan | Sample Fee offsetting ke DP Produksi | §3.7 → §3.3 |
| DP Penjualan (Legalitas) → Client Escrow | Tab Legalitas posting-nya pakai logic Escrow | §3.3 → §5.3 |
| Pengajuan Dana → Kas Bank Keluar | Auto-generate saat Disbursed | §2.6 → §4.2b |
| Bank Account → AP Aging | Saldo real-time di navbar AP Aging | §4.1 → §2.5 |
| Bank Account → Dashboard Finance | Cash Position card | §4.1 → §10.1 |
| AR Aging → BusDev Dashboard | Widget ringkasan shared (bukan rebuild) | §3.6 → §10.2 |
| Jurnal Umum ← semua subledger | Auto-posting saat Posted | §1.3 ← §2.2, §3.2, §2.4, §3.4, §2.6, dll |

---

# LAMPIRAN C — URUTAN IMPLEMENTASI (Sprint Plan)

```
Sprint 1 — Fondasi (1 minggu)
  §0.1-0.7 Fondasi
  §1.1-1.4 General Ledger (COA + Posting Rules + Jurnal Umum + Buku Besar)

Sprint 2 — AP Lengkap (2 minggu)
  §2.1 Vendor Master (+ Import Excel)
  §2.2 Faktur Pembelian (matching engine, import, custom date, tabs, notes, hide akurasi)
  §2.3-2.4 DP & Bayar Pembelian (konsistensi navbar)
  §2.5 AP Aging (color coding, saldo bank di navbar)
  §2.6 Pengajuan Dana (tiered approval Staff/Head/Acc/Dir)
  ⚠ Modul QC butuh field "QC Passed Qty" sebelum matching engine full 4-leg

Sprint 3 — AR Lengkap (2 minggu)
  §3.1 Customer Master (+ Sample/Produksi/Legalitas cards)
  §3.2 Faktur Penjualan (+ AR Delivery Gatekeeper — integrasi Warehouse)
  §3.3 DP Penjualan (tabs Sample/Legalitas/Produksi)
  §3.4 Bayar Penjualan (+ PPh 23 dipotong customer)
  §3.5 Collections
  §3.6 AR Aging (+ widget BusDev)
  §3.7 Sample Fee (+ offsetting engine)

Sprint 4 — Cash & Bank (1 minggu)
  §4.1 Bank Account Master
  §4.2 Kas Bank Masuk (card cuma Total Kas, date range custom)
  §4.2b Kas Bank Keluar (sama dengan 4.2)
  §4.3 Bank Reconciliation (+ filter COA + date range custom)
  (pastikan integrasi auto-post dari Sprint 2 & 3)

Sprint 5 — Tax & Compliance (1 minggu, TANPA e-Faktur/e-Bupot)
  §5.1-5.2 PPN + PPh 23 WHT Engine + rekap PPh 21
  §5.3 Client Escrow

Sprint 6 — Fixed Assets + Budget (1 minggu)
  §6.1-6.4 Asset Register (Purchase History) + Depresiasi + Transfer/Disposal + Compliance
  §7.1-7.2 Budget Entry + Budget vs Actual

Sprint 7 — Cost & Profitability (1 minggu, setelah Production siap data BOM/JO)
  §8.1-8.4 (+ Scrap/Wastage, consignment-aware material cost)

Sprint 8 — Closing, Dashboard, Reports (1-2 minggu)
  §9.1-9.2 Period Lock + Adjustment Journal
  §10.1-10.2 Dashboard Finance + Widget BusDev
  §11.1-11.8 Reports (Laba Rugi format hybrid, Report Penjualan, dll)
```

**Total estimate: 8-10 minggu** untuk finance module penuh (tim 1-2 developer).

---

# LAMPIRAN D — DEFINISI "FINAL"

Dokumen ini **FINAL** dalam artian:
1. **Struktur spec:** NEX-Finance (D365-inspired) jadi backbone, tidak berubah lagi.
2. **Behaviour per halaman:** REQUIREMENT.md Poin 1-34 sudah dikonfirmasi Upii, binding.
3. **Kolom/tabel legacy:** Tetap dipakai untuk konsistensi data historis (akan dipakai saat migrasi data legacy → NEX).
4. **Cross-reference matrix** di awal dokumen adalah **single point lookup** untuk cari halaman NEX-Finance ↔ Legacy URL ↔ REQUIREMENT Poin.

**Yang BELUM final** (perlu konfirmasi saat implementasi):
- Detail visual mockup (lihat VISUAL_DNA.md & golden reference page)
- Spesifikasi performance (response time, concurrent user)
- Detail integrasi spesifik ke modul lain (Production, QC, Warehouse) — di luar scope finance

---

**Generated:** 7 September 2026
**Next Review:** Setelah Sprint 1 selesai
