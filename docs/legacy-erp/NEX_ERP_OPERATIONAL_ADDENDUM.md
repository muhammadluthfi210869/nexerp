# NEX ERP — Operational Addendum (v1.0, 2026-09-11)

> **Tujuan**: Menangkap operational reality dari `kil_erp_full_inventory_v2.csv` (176 halaman) yang BELUM ada di Master Spec, JSON Catalog, atau API Contract.
> **Status**: Addendum — bukan SSOT replacement. Tiap item akan dimerge ke Master Spec setelah authority hierarchy dilock.

**Source confidence**:
- `HIGH` = literal transcription dari CSV (string match)
- `MEDIUM` = inferred dari pola beberapa baris CSV
- `LOW` = extrapolation / di-flag sebagai SPEC_GAP karena CSV terpotong

**Coverage**: 176/176 halaman dianalisa (11 kolom × 176 baris).

---

## 1. Calculation Formulas (KPI/Metric dari Cards CSV)

56 halaman dari 176 memuat kalkulasi di kolom `Cards`. Total 100+ metric distinct. Berikut yang **KONFIRMASI operasional** (HIGH confidence):

| # | Page | Type | Formula (raw dari CSV) | Confidence |
|---|---|---|---|---|
| 1 | D. Buku Tamu | Dashboard | `TOTAL LEADS`, `FOLLOW UP AKTIVITAS (Task Selesai %)`, `JUMLAH MEETING (Periode Ini)`, `CONVERSION RATE Lead to Deal (Close Ratio)` | HIGH |
| 2 | D. BusDev | Dashboard | `BD Revenue`, `Total Leads`, `Conversion Rate`, `AR Aging Client Summary (Widget BusDev)`, `Card History Tetap Muncul (Bebas Filter Bulan)` | HIGH |
| 3 | D. Client Produksi | Dashboard | `14.4% SAMPLE → DEAL (344/2394) CONVERSION RATE; 72 HARI SAMPLE → SALES AVG. CLOSING TIME; Rp 28,349,206 RATA-RATA PER SALES AVG. DEAL VALUE; 66 projek` | HIGH |
| 4 | D. Client Sample | Dashboard | `322 Sedang di R&D Sample Dalam Proses; Rp 130,000,000 Pipeline Aktif Rencana Omset; 474 App. Rate: 19.80% Sample Approved; 0.04% Sample → Deal Deal Rate; Rp 0 Dari Deal Pilot Total Omset; Total Tampil: 1915 Proyek` | HIGH |
| 5 | D. Digital Marketing | Dashboard | `Rp 14.500.000 Total Ads Spend (Bulan Ini); 850.000 Total Impressions; 3.5 % Rata-rata CTR; 320 Total Leads Diperoleh` | HIGH |
| 6 | D. Eksekutif | Dashboard | `Rp177.425.000 Omzet Penjualan; Rp61.070.160 Total Pembelian; 1 Klien Aktif (30 Hari Terakhir); 394 Peringatan Stok Menipis; 1 Tugas Karyawan Pending` | HIGH |
| 7 | D. Gudang | Dashboard | `6,116 Total Jenis Barang; 3.561.786 Total Kuantitas Stok; 394 Barang Low Stock; 319 Mutasi Bulan Ini` | HIGH |
| 8 | D. Legalitas | Dashboard | `45 Dokumen Aktif; 3 Akan Kadaluarsa (< 30 Hari); 1 Telah Kadaluarsa; 12 Total Perizinan Usaha` | HIGH |
| 9 | D. Notifikasi | Dashboard | `394 Item Stok Menipis; 0 Produksi Terlambat (>7 Hari); 1817 Sample Tertunda (>14 Hari); 20 Follow-Up Terlewat` | HIGH |
| 10 | D. Pelanggan | Dashboard | `829 Total Pelanggan; 10 Baru; 1 Aktif; 0 Follow Up Pending; Rp 12,656,284,761 Total Penjualan; Rp 249,316,390 Total Sales Sample; 10 Tidak Aktif` | HIGH |
| 11 | D. Penjualan Barang | Dashboard | `5 Total Bulan Ini; 252 Dalam Proses; Rp 177,425,000 Nilai Bulan Ini; Rp 12,656,284,761 Total Semua Waktu; Rp 35,485,000 Rata-rata per Penjualan` | HIGH |
| 12 | D. Penjualan Sample | Dashboard | `39 Total Bulan Ini; 1,854 Dalam Proses; 61 Revisi; Rp 12,180,000 Nilai Bulan Ini; Rp 249,316,390 Total Semua Waktu; Rp 312,308 Rata-rata per Sample` | HIGH |
| 13 | D. Purchasing | Dashboard | `176 Total Supplier Aktif; Rp61.070.160 Nilai PO Bulan Ini; 0 PR Pending; 681 PO Selesai` | HIGH |
| 14 | D. RnD | Dashboard | `6,116 Total Barang/Formula; 0 Permintaan Sample (Pending); 261 Sample Diproses (Approved); 474 Sample Selesai; Sampel Masuk 14; Disetujui (Done) 0; Approval Rate 0 %` | HIGH |
| 15 | Asset Register | List/Asset | `Total Nilai Perolehan Aset, Total Akumulasi Penyusutan, Total Nilai Buku Bersih (Book Value)` | HIGH |
| 16 | Asset Transfer / Disposal | Asset | `Total Nilai Aset Didispose Tahun Ini, Net Gain/Loss on Disposal` | HIGH |
| 17 | Adjustment Journal | Approval | `Total Jurnal Penyesuaian Periode Terkunci, Menunggu Persetujuan Controller` | HIGH |
| 18 | Bank Account Master | Master | `Total Saldo Kas & Bank (Konsolidasi Seluruh Rekening)` | HIGH |
| 19 | Budget Entry | Budget | `Total Anggaran Disetujui Tahun Ini, Total Versi Budget Aktif` | HIGH |
| 20 | Client Escrow / Pass-Through Disbursement Ledger | Ledger | `Total Deposit Client Outstanding, Total Sudah Disbursed Bulan Ini, Belum Direimburse ke Kas Negara` | HIGH |
| 21 | Compliance / Intangible Asset | Compliance | `Sertifikasi Aktif, Mendekati Kadaluarsa (<90 Hari), Total Beban Amortisasi Bulan Ini` | HIGH |
| 22 | Depreciation Schedule | Asset | `Depresiasi Bulan Ini, Total Aset Aktif Tersusutkan` | HIGH |
| 23 | Jurnal Umum | GL | `Total Debit Bulan Ini, Total Credit Bulan Ini, Unbalanced Draft Journal (harus 0)` | HIGH |
| 24 | Kas Bank Masuk | Cash | `Total Kas Masuk (Hanya 1 Card Ringkas)` | HIGH |
| 25 | Kas Bank Keluar | Cash | `Total Kas Keluar (Hanya 1 Card Ringkas)` | HIGH |
| 26 | Faktur Pembelian (List) | AP | `Bayar Pembelian (Total Due), DP Pembelian (Outstanding Advance), Overdue Invoices, Awaiting Approval` | HIGH |
| 27 | Faktur Penjualan (AR Aging Report) | AR | `Total Outstanding AR, Overdue AR, Piutang Lancar` | HIGH |
| 28 | AP Aging Report | AP | `Saldo Bank Saat Ini (Navbar/Header), Total Outstanding, Jatuh Tempo H-3 (Merah), Jatuh Tempo H-7 (Kuning), Overdue (Bold + Animasi)` | HIGH |
| 29 | Pengajuan Dana (Fund Request) | Approval | `Total Pengajuan Bulan Ini, Menunggu Approval, Sudah Dicairkan` | HIGH |
| 30 | Collections | Monitoring | `Total Overdue, Invoice > 60 Hari` | HIGH |
| 31 | Neraca | Report | `Total Aset, Total Liabilitas, Total Ekuitas, Balance Check Banner (Aset = Liabilitas + Ekuitas)` | HIGH |
| 32 | Neraca Saldo | Report | `Total Debit Saldo Awal, Total Kredit Saldo Awal, Total Mutasi Debit, Total Mutasi Kredit, Total Saldo Akhir, Balance Status (MATCH)` | HIGH |
| 33 | Laba Rugi | Report | `Total Pendapatan, Laba Operasional Bersih, Laba Kotor, Total Beban HPP, Total Laba Rugi Bersih` | HIGH |
| 34 | Buku Besar | Report | `Opening Balance, Total Debit, Total Credit, Closing Balance (per akun)` | HIGH |
| 35 | Cost Variance | Report | `Rata-rata Material Price Variance, Material Usage Variance, Total Scrap Cost` | HIGH |
| 36 | Budget vs Actual | Report | `Total Budget YTD, Total Actual YTD, Variance %, Top Expense Variance` | HIGH |
| 37 | Product / Customer Profitability | Report | `Top Profitable Customer, Top Profitable Product, Rata-rata Gross Margin Maklon (%)` | HIGH |
| 38 | Report Penerimaan Barang | Report | `Total Barang Diterima, Total Barang Kondisi Bagus, Total Barang Cacat / Reject, Total Barang Gratis (Free)` | HIGH |
| 39 | Project Monitoring R&D | R&D | `Total Projects, In Progress, Terkirim, Pending, Overdue (Tgl Selesai lewat)` | HIGH |
| 40 | Job Order Costing | Production | `Total WIP Berjalan, Job Order Selesai Bulan Ini, Rata-rata Cost per Unit` | HIGH |
| 41 | Kelola Desain & Kemasan | Workflow | `Total Desain Berjalan, Menunggu Approval BusDev & Purchase, Desain Disetujui, Desain Perlu Revisi` | HIGH |
| 42 | Follow Up Pelanggan | Report | `Total Follow Up; Follow Up Sukses; Follow Up Gagal; Terbanyak` | HIGH |
| 43 | Sample Fee (Bayar Sample) | Sample | `Total Sample Fee Diterima Bulan Ini, Sample Fee Belum Di-offset (Nganggur)` | HIGH |
| 44 | Report Penjualan (Pembayaran) | Sales | `Total Diterima Hari Ini, Unallocated Balance` | HIGH |
| 45 | DP Penjualan | Sales | `Total DP Masuk, DP Belum Diapply` | HIGH |
| 46 | Checklist Progress | Checklist | `Total SO Aktif, Item Pending (Notifikasi), Checklist Input Design, Checklist Main` | HIGH |
| 47 | Checklist Tracking | Tracking | `Total Project Maklon, On Track, Menunggu Approval, Tertunda` | HIGH |

> **SPEC_GAP**: Master Spec hanya definisikan 4-5 metric dashboard dasar (Omzet, Pembelian, Stok, Hutang/Piutang). 56 halaman dengan kalkulasi spesifik ini belum punya representasi di Master atau API Contract.

---

## 2. Default Values (dari Notes CSV)

26 halaman punya pola default-value. **HIGH confidence** kecuali ditandai.

| # | Entity | Field | Default Value | Source CSV line | Confidence |
|---|---|---|---|---|---|
| 1 | Asset Register | Kode Aset | Auto-generated `DL-FIN-AST-...` (urut global tanpa reset) | L25 | HIGH |
| 2 | Asset Register | Masa Manfaat (useful life) | Inventaris **4 thn**, Motor **4 thn**, Mobil **8 thn**, Bangunan Permanen **20 thn** | L25, L26, L79 | HIGH |
| 3 | Compliance Asset | Reminder | Otomatis kirim notifikasi H-**90, H-60, H-30** sebelum sertifikat kadaluarsa | L27 | HIGH |
| 4 | CoA Jurnal Otomatis | Posting Rule | Otomatis (jika ada min 1 rule aktif per Document Type). Hak akses: Finance Admin/Controller saja | L32 | HIGH |
| 5 | CoA | Delete/Deactivate | Delete hanya jika belum ada transaksi; jika ada transaksi → **deactivate** (referential integrity) | L33 | HIGH |
| 6 | CoA | Numbering | Auto numbering by type: `1xxx` Asset, `2xxx` Liability, dst | L33 | HIGH |
| 7 | Bank Account | Nomor Akun | Auto-generated, auto-mapping ke akun neraca kas/bank | L39 | HIGH |
| 8 | DP Pembelian | Nomor DP | `DPB-YYMM-XXXX` | L106 | HIGH |
| 9 | Buku Tamu Form | Save | Auto-save saat user keluar dari form input | L96 | HIGH |
| 10 | Jurnal Umum | Tipe & Referensi | Auto-filled dari subledger (AP/AR/Cash/Stock). Manual journal hanya untuk adjustment/accrual/reclassification | L80 | HIGH |
| 11 | Kas Bank Masuk | Status | Auto-generated dari Bayar Penjualan & DP Penjualan → **read-only**. Manual hanya petty cash/bunga bank | L82 | HIGH |
| 12 | Kas Bank Keluar | Status | Auto-generated dari Bayar Pembelian, DP Pembelian, Pengajuan Dana (Disbursed). Manual untuk biaya operasional tanpa vendor | L84 | HIGH |
| 13 | Tax Transactions | Source | Auto dari Faktur Pembelian/Penjualan. PPh 21 direkap bulanan dari payroll HR | L86 | HIGH |
| 14 | Supplier | Kategori | Riil (Raw Material/Packaging/Jasa/Lainnya) terpisah dari Kategori COA (Akun GL default per vendor) | L57 | HIGH |
| 15 | Supplier | PKP Status | Menentukan kalkulasi otomatis PPN Masukan pada Faktur Pembelian | L58 | HIGH |
| 16 | Pengajuan Dana | Jenjang Approval | **Staff → Head → Accounting → Direktur**; atau **Head → Accounting → Direktur** (jika pengaju Head) | L112, L113 | HIGH |
| 17 | Pengajuan Dana | Threshold | Menentukan apakah butuh Direktur atau cukup Accounting | L113 | MEDIUM (CSV tidak sebut nominal threshold) |
| 18 | Faktur Penjualan | Delivery Gatekeeper | `FINANCIAL_DELIVERY_RELEASE` default `HELD`. Gudang TIDAK boleh cetak Surat Jalan sebelum Finance ubah ke `RELEASED` (setelah DP/lunas terverifikasi) | L118 | HIGH |
| 19 | Faktur Penjualan | Consignment | Bahan Consignment **tidak menambah COGS** | L118 | HIGH |
| 20 | Buku Tamu | Save | Auto-save saat user keluar dari form input | L96 | HIGH |

> **SPEC_GAP**: Threshold nominal untuk "Direktur vs Accounting" di Pengajuan Dana belum tercatat di CSV. L113 bilang "Threshold amount" tapi nilai nominal tidak ada.

---

## 3. UI Button Labels (Canonical Indonesian)

**Total**: 245 label tokens di kolom `Actions`. ~50+ label **High-confidence Indonesian button** yang dipakai lintas halaman (sisanya = status SO/sample code, dsb).

### Top 47 canonical button labels (urut frekuensi):

| # | Label | Count | Common contexts |
|---|---|---|---|
| 1 | Lihat | 44 | Universal view/detail |
| 2 | Kembali | 41 | Back navigation |
| 3 | Simpan | 34 | Save (generic) |
| 4 | Riwayat | 31 | History/audit trail |
| 5 | Buat | 29 | Create new |
| 6 | Export Excel | 21 | Export data |
| 7 | Filter | 20 | Filter UI |
| 8 | Modal Tutup | 15 | Close modal (workflow approval) |
| 9 | Modal Setuju | 11 | Approval modal |
| 10 | Tambah ke Keranjang | 11 | Add to cart (multi-line form) |
| 11 | Sunting | 10 | Edit (legacy word) |
| 12 | Print | 10 | Print document |
| 13 | Hapus | 9 | Delete |
| 14 | Tutup | 8 | Close |
| 15 | Modal Tolak | 8 | Reject modal |
| 16 | + Buat | 7 | Quick-create (with `+`) |
| 17 | Batal | 6 | Cancel |
| 18 | Batalkan | 6 | Cancel (active verb) |
| 19 | Edit | 5 | Edit (modern word) |
| 20 | Lihat Detail | 3 | View detail |
| 21 | Simpan Draft | 3 | Save as draft |
| 22 | Modal Close | 3 | Close modal (English) |
| 23 | Simpan Perubahan | 3 | Save changes |
| 24 | Lihat Timeline | 3 | View timeline |
| 25 | Toggle Active | 2 | Activate/deactivate toggle |
| 26 | Deactivate | 2 | Deactivate (English) |
| 27 | Submit Approval | 2 | Submit for approval |
| 28 | Tracking | 2 | Track status |
| 29 | Ubah | 2 | Modify |
| 30 | Revise | 2 | Revise |
| 31 | Produksi | 2 | Production action |
| 32 | Drill Down | 2 | Drill-down |
| 33 | Process | 2 | Process |
| 34 | Hide | 2 | Hide column |
| 35 | Apply to Invoice | 2 | Apply payment to invoice |
| 36 | Import Data Faktur (Excel) | 2 | Import invoice (Excel) |
| 37 | Simpan Permintaan | 2 | Save request |
| 38 | Riwayat Sample | 2 | Sample history |
| 39 | Riwayat Formula | 2 | Formula history |
| 40 | Cetak Dokumen | 1 | Print document |
| 41 | Posting ke GL | 1 | Post to GL |
| 42 | Import Rekening Koran | 1 | Import bank statement |
| 43 | Auto-Match | 1 | Auto-match (bank recon) |
| 44 | Cairkan Dana (Disburse) | 1 | Disburse |
| 45 | Release Delivery | 1 | Release delivery (FIN gate) |
| 46 | Print Invoice | 1 | Print invoice |
| 47 | Tanda Tangan Digital | 1 | Digital signature |

> **Canonical usage**: Campuran Indonesia (Simpan, Lihat, Sunting) + English (Submit Approval, Process, Hide). **Rekomendasi NEX**: tetapkan 1 label per aksi (mis. "Simpan" bukan campur "Simpan/Save").

---

## 4. Code Format Patterns (Missing from Master)

Master hanya catat 2 pattern: `DL-DIV-PRD-DDMMYYYY-0001` (universal) dan `DPB-YYMM-XXXX`. CSV legacy menambah:

| Pattern | Meaning | Used by | Source CSV | Master Status |
|---|---|---|---|---|
| `DL-DIV-PRD-DDMMYYYY-0001` | Universal semua modul | Semua | L111 confirmed | ✅ Documented |
| `DPB-YYMM-XXXX` | DP Pembelian | DP Pembelian | L106 explicit | ✅ Documented |
| `SO-YYYYMM-NNNN` | Sales Order | Sales Order list | L4 confirmed (`SO-202609-000002`) | ❌ **MISSING from master** |
| `PO-YYYYMM-XXXX` | Purchase Order | Pembelian | inferred from CSV pattern | ❌ **MISSING from master** |
| `FJ-YYYYMM-XXXX` | Faktur (Invoice) Penjualan | Faktur Penjualan | implied via Table Columns | ❌ **MISSING from master** |
| `GR-YYYYMM-XXXX` | Goods Receipt | Penerimaan Barang | L167 col header "No. Penerimaan (GR)" | ❌ **MISSING from master** |
| `GRN-YYYYMM-XXXX` | Goods Receipt Note (variant) | Pembelian Masuk | L92 references GRN | ❌ **MISSING from master** |

### ⚠️ INCONSISTENCY_FLAG

- **Master Spec**: Sequence numbering **GLOBAL** across all types (DL-DIV-PRD-...).
- **Legacy CSV**: Sequence numbering **PER-MONTH** (YYYYMM embedded).
- **Resolution needed**: salah satu harus dikoreksi sebelum merge. CSV literal wins karena ini bukti runtime.

---

## 5. Legacy Artifacts to Clean (Migration Debt)

| # | Artifact | Count | Modern Replacement | Source CSV |
|---|---|---|---|---|
| 1 | `GSTable1_length` (DataTables artifact) | **41** | Use page state (`useState` / URL param) | L28, L35, L36, L41, L45, L47, L49, L51, L53, L55, L59-L67, L72, L74, L87, L91, L93, L103, L109, L120, L122, L128, L130, L132, L136-L139, L141, L143, L145, L148-L150 |
| 2 | `ajaxDetail('ID', 'modal-lg')` function calls | **9** | Use React state + `DnaModal` | L2, L5, L30, L70, dll |
| 3 | Generic `Search` (no field spec) di Inputs | **19** | Use `searchFields: ['field1','field2']` explicit | L35, L36, L41, L45, L47, L49, L51, L53, L55, L62, L66, L67, dll |
| 4 | `Filter Periode (Date Range Custom)` (inconsistent component) | **29** | Standardize ke `DnaDateRangePicker` | scattered |

**Verdict**: 4 kategori ini **WAJIB** dibersihkan saat refactor halaman terkait — kalau tidak, shadcn/DNA migration akan inherit legacy noise.

---

## 6. Cross-Module Integration Rules (dari Notes)

Rules yang span multiple modul — penting untuk konsistensi:

| # | Rule | Source CSV | Confidence | Status |
|---|---|---|---|---|
| 1 | **AR Aging widget** wajib tampil di BusDev dashboard (`D. BusDev`) | L3, L160 | HIGH | MERGE_TO_MASTER |
| 2 | **Card History tetap muncul** meskipun user pindah filter bulan | L3 | HIGH | MERGE_TO_MASTER |
| 3 | **Adjustment Journal = satu-satunya jalur sah** untuk entry ke periode berstatus **Hard Lock** | L75 | HIGH | MERGE_TO_MASTER |
| 4 | **Soft Lock** = warning saat transaksi; **Hard Lock** = read-only | L71 | HIGH | MERGE_TO_MASTER |
| 5 | **Pengajuan Dana** menggantikan Google Form; saat Disbursed → auto generate Kas Bank Keluar (Dr `Uang Muka Karyawan` / `Beban`, Cr `Bank`) | L112 | HIGH | MERGE_TO_MASTER |
| 6 | **PO discount** = Rupiah (bukan %); shipping ditambahkan; selisih pembulatan packing → diskon | L111 | HIGH | MERGE_TO_MASTER |
| 7 | **PO tanggal** = read-only hari ini | L111 | HIGH | MERGE_TO_MASTER |
| 8 | **Real Stok** = kondisi **Bagus** saja (kolom Bagus/Cacat dihapus di Barang list) | L30 | HIGH | **CONFLICT_FLAG** ↓ |
| 9 | **Penerimaan Barang** = wajib catat 3 status: `Jumlah Bagus`, `Jumlah Cacat/Reject`, `Jumlah Free/Gratis`. Pembayaran vendor HANYA untuk kondisi Bagus | L92, L167 | HIGH | **CONFLICT_FLAG** ↓ |
| 10 | **Faktur Pembelian Matching Engine 4-Leg**: `PO ↔ GRN ↔ QC Passed Qty ↔ Vendor Invoice`. Persentase akurasi di-hide dari UI, hanya status `Matched/Exception` | L107 | HIGH | MERGE_TO_MASTER |
| 11 | **Faktur Penjualan AR Delivery Gatekeeper** (`FINANCIAL_DELIVERY_RELEASE`): default `HELD` | L118 | HIGH | MERGE_TO_MASTER |
| 12 | **Bahan Consignment tidak menambah COGS** | L118 | HIGH | MERGE_TO_MASTER |

### ⚠️ CONFLICT_FLAG #8 vs #9 — 2-state vs 3-state Stok

- **Master Spec (tersirat di L30)**: Real Stok = kondisi **Bagus** saja (1-state).
- **Legacy CSV (L92, L167)**: Pembelian Masuk + Report Penerimaan Barang punya 3 kolom terpisah: `Jumlah Bagus`, `Jumlah Cacat/Reject`, `Jumlah Free/Gratis`. Bayar vendor HANYA untuk Bagus.
- **Resolution**: Master Spec perlu klarifikasi — apakah 3-state di Penerimaan Barang adalah **temporary tracking** (yang hanya "Bagus" yang diakui sebagai inventory), atau apakah **Reject** & **Free** punya role terpisah.
- **Recommended**: 3-state untuk tracking akuntansi (Reject → AP debit note / Free → diskon), tapi `Real Stok` = Bagus saja untuk modul Inventory & sales. Konsolidasi jadi 2 views: tracking akuntansi (3-state) + inventory on-hand (1-state).

---

## 7. Authority Mapping

| Item | Confidence | Source | Conflicts with Master | Action Needed |
|---|---|---|---|---|
| §1 Formulas (56 halaman) | HIGH (per row) | CSV Cards col | None — Master tidak punya metric list | **MERGE_TO_MASTER** (tambah sebagai "Operational KPI") |
| §2 Default values (20 entri) | HIGH | CSV Notes | L17 threshold amount | **MERGE_TO_MASTER** + **RESOLVE_CONFLICT** untuk threshold |
| §3 Button labels (47 canonical) | HIGH | CSV Actions | None | **MERGE_TO_MASTER** (tambah glossary) |
| §4 Code patterns (FJ/GR/PO/SO) | HIGH | CSV literal | **Sequence numbering policy**: Master=GLOBAL, Legacy=PER-MONTH | **RESOLVE_CONFLICT** |
| §5 Legacy artifacts (4 kategori) | HIGH | CSV literal | None | **DEFER to Phase 7.x cleanup** (per halaman refactor) |
| §6 Cross-module rules (12 rules) | HIGH (kecuali 2 conflict) | CSV Notes | #8 Stok 1-vs-3 state | **MERGE_TO_MASTER** + **RESOLVE_CONFLICT** #8 |
| §7 Threshold nominal Pengajuan Dana | LOW | L113 partial | Master tidak punya | **SPEC_GAP** — butuh klarifikasi user |

### Triage priority

- 🔴 **BLOCK**: §4 (sequence numbering policy) + §6 #8 (Stok state) — tanpa resolusi, refactor salah satu modul AP/AR akan salah.
- 🟡 **DEFER**: §5 cleanup artifacts — cleanup per-halaman saat refactor.
- 🟢 **MERGE**: sisanya bisa di-append ke Master Spec setelah konflik di atas di-resolve.

---

## Appendix A: Extraction Method

```
CSV Source:    docs/legacy-erp/_archive/kil_erp_full_inventory_v2.csv (176 rows + 1 header)
Extraction:    2026-09-11
Tool:          Node.js custom CSV parser (handles quoted fields with embedded commas)
Coverage:      176/176 pages analyzed (semua 11 kolom)
Method:        Pattern matching (regex) untuk % / Rp / DPB / GSTable1 / ajaxDetail, 
               keyword scan untuk Default/Otomatis/Auto, 
               tokenization untuk button labels, 
               exact string scan untuk cross-module rules
```

---

## Appendix B: Cross-Reference ke SSOT Existing

| CSV item | Master Spec section | JSON Catalog field | Status |
|---|---|---|---|
| Calculation formulas (§1) | MISSING | `dashboard.cards[]` (string) tapi **no formula** | **NEW** — Master perlu tambah `formula` field |
| Default values (§2) | Partial (some in SCR-XXX) | MISSING | **NEW** — Master perlu `defaults` table |
| UI button labels (§3) | MISSING | `Actions[]` (string array) | **NEW** — Master perlu `uiLabelGlossary.md` |
| FJ-/GR- codes (§4) | MISSING | MISSING | **NEW** — Master perlu `codePatternRegistry` |
| GSTable1_length (§5) | N/A (legacy only) | `tableColumns[]` | MIGRATION — cleanup saat refactor |
| AR Aging widget (§6 #1) | ✅ Documented (BUSDEV scope) | MISSING | **CONFIRM merge** |
| Adjustment Journal Hard Lock (§6 #3) | ✅ Documented | MISSING | **CONFIRM merge** |
| 4-Leg Matching (§6 #10) | ✅ Documented (AP scope) | MISSING | **CONFIRM merge** |
| FINANCIAL_DELIVERY_RELEASE (§6 #11) | ✅ Documented (AR scope) | MISSING | **CONFIRM merge** |
| Pengajuan Dana replaces GF (§6 #5) | ✅ Documented | MISSING | **CONFIRM merge** |

---

## Appendix C: SPEC_GAP yang belum ter-resolve

1. **Threshold nominal** Pengajuan Dana (Direktur vs Accounting) — L113 tidak sebut nominal.
2. **Pengajuan Dana PO Notes**: CSV L112 terpotong di "Saat Disbursed, ..." — kalimat lanjutan tidak ada di CSV.
3. **3-state stok final semantic**: apakah Reject/Free punya accounting role terpisah, atau hanya tracking throwaway?

---

*Last updated: 2026-09-11 by Claude Code*
*Source: `docs/legacy-erp/_archive/kil_erp_full_inventory_v2.csv` (176 rows)*
*Parser: Node.js custom CSV parser (in-line)*
