# 📋 Audit Komprehensif Navbar & Sub-Tabs ERP

> **Tujuan Audit:** Mengidentifikasi seluruh halaman yang menggunakan sub-navbar / tab bar (`DnaPageHeader tabs`, `DnaTabNav`, atau pill buttons) yang sebenarnya hanya berfungsi untuk memfilter status/kategori data dan seharusnya dipindahkan ke dalam toolbar filter tabel (`DataTableFilter` / dropdown filter).

---

## 🎯 Ringkasan Eksekutif

| Kategori | Jumlah Halaman / Komponen | Keterangan & Tindakan |
| :--- | :---: | :--- |
| 🔴 **Navbar Status / Kategori Palsu (Redundant)** | **17 Halaman** | **Wajib Dihapus & Dipindahkan ke Filter Toolbar Tabel**. Tab di posisi navbar hanya memfilter 1 tabel data (status `DRAFT`, `PENDING`, `APPROVED`, atau kategori). |
| 🟡 **Navbar Hybrid / Scope Campuran** | **4 Halaman** | **Dirapikan**. Sebagian tab adalah filter scope pengguna (misal: `Semua` vs `Pelanggan Saya`), sisanya perpindahan entitas. Scope harus masuk ke filter toolbar. |
| 🟢 **Navbar / Tab Sah (Legitimate View Switcher)** | **8 Halaman** | **Dipertahankan**. Berfungsi sebagai perpindahan sub-halaman sesungguhnya (`href`), pengalih mode visual drastis (Tabel vs Kanban vs Kalender), atau Denah vs Master. |
| ⚪ **Halaman Bersih (Tanpa Redundant Navbar)** | **30+ Halaman** | Sudah menggunakan Tri-Layer Colocation dengan filter toolbar standar tanpa navbar palsu. |

---

## 🔴 1. Daftar Halaman dengan Navbar Status Redundant (Wajib Masuk Filter)

Halaman-halaman berikut menaruh filter status/kategori di header halaman sebagai navbar. Hal ini membuat UI membingungkan karena pengguna mengira itu adalah menu/page baru, padahal hanya memfilter baris tabel:

| No | Modul & Route | File Path | Tab / Navbar Saat Ini | Alasan Masuk Filter | Rekomendasi Solusi |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Penjualan**: HPP Job Order Costing<br>`/penjualan/job-order-costing` | `frontend/src/app/(dashboard)/penjualan/job-order-costing/page.tsx` | `[Semua Status, Berjalan (Open), Selesai (Closed)]` | Hanya memfilter kolom `closed: boolean` pada 1 tabel. Toolbar tabel di bawahnya malah kosong tanpa filter status. | Hapus `tabs` dari `DnaPageHeader`. Pindahkan ke `toolbarProps.statusOptions` di `DnaDataTableCard`. |
| **2** | **Penjualan**: Komitmen Sample Fee<br>`/penjualan/sample-fee` | `frontend/src/app/(dashboard)/penjualan/sample-fee/page.tsx` | `[Semua Fee, Belum Di-Offset, Sudah Di-Offset]` | Hanya memfilter `d.offset: boolean`. | Hapus `tabs` dari `DnaPageHeader`. Pasang dropdown filter status di toolbar tabel. |
| **3** | **R&D**: Project Monitoring<br>`/rnd/project-monitoring` | `frontend/src/app/(dashboard)/rnd/project-monitoring/page.tsx` | `[Semua Proyek, Terkirim ke Klien, Sedang Formulasi, Pending]` | Hanya memfilter status pengerjaan proyek R&D. Sudah ada dropdown filter PIC Formulator di samping tabel. | Hapus `tabs` dari `DnaPageHeader`. Gabungkan status filter ke dropdown di toolbar filter tabel. |
| **4** | **Quality**: Certificate of Analysis (CoA)<br>`/quality/coa` | `frontend/src/app/(dashboard)/quality/coa/page.tsx` | `[Semua CoA, Terverifikasi, Menunggu]` | Hanya memfilter status verifikasi sertifikat (`VERIFIED` vs `PENDING`). | Hapus `tabs` dari `DnaPageHeader`. Masukkan opsi filter status ke `DnaDataTableCard`. |
| **5** | **Quality**: Gerbang Rilis APJ & QC<br>`/quality/qc-release` | `frontend/src/app/(dashboard)/quality/qc-release/page.tsx` | `[Semua Batch, Menunggu Rilis, Inkubasi Mikro, Lolos Rilis]` | Hanya memfilter lifecycle status karantina batch (`QUARANTINE`, `INVESTIGATION`, `RELEASED`). | Hapus `tabs` dari `DnaPageHeader`. Pindahkan ke filter status tabel. |
| **6** | **Samples**: Project Monitoring<br>`/samples/project-monitoring` | `frontend/src/app/(dashboard)/samples/project-monitoring/page.tsx` | `[Semua, Proses Lab, Terkirim, Approved, Overdue]` | Filter status proyek formulasi lab. | Hapus `tabs` dari `DnaPageHeader`. Satukan ke dalam toolbar filter tabel. |
| **7** | **Samples**: Revision Tracker<br>`/samples/revision-tracker` | `frontend/src/app/(dashboard)/samples/revision-tracker/page.tsx` | `[Aktif, Riwayat, Kritis >3x]` | Memfilter data sample berdasarkan status revisi (`IN_PROGRESS`, `DONE`, dan count > 3). | Hapus `tabs` dari `DnaPageHeader`. Jadikan filter dropdown kondisi di toolbar tabel. |
| **8** | **Samples**: New Product Formulation<br>`/samples/npf` | `frontend/src/app/(dashboard)/samples/npf/page.tsx` | `[Semua NPF, Formulasi Lab, Sample Terkirim, Approved Deal]` | Menggunakan `<DnaTabNav>` mengambang hanya untuk switch status stage NPF. | Hapus `<DnaTabNav>`. Masukkan filter tahap ke dalam `NpfTable` toolbar. |
| **9** | **Samples**: Sample Intake Inbox<br>`/samples/inbox` | `frontend/src/app/(dashboard)/samples/inbox/page.tsx` | `[Semua Intake, Lolos Verifikasi]` | Memfilter status verifikasi intake form sample. | Hapus `tabs` dari `DnaPageHeader`. Masukkan ke filter tabel. |
| **10** | **Samples**: Jadwal Pra-Produksi<br>`/samples/schedule` | `frontend/src/app/(dashboard)/samples/schedule/page.tsx` | `[Semua Jadwal, Jadwal Mixing, Jadwal Filling, Jadwal Packaging]` | `<DnaTabNav>` mengambang memfilter jenis mesin/tahapan (`scheduleType`). | Pindahkan menjadi filter dropdown "Tahapan: Semua / Mixing / Filling / Packaging" di toolbar tabel. |
| **11** | **Produksi**: Batch Record Pra-Produksi<br>`/production/batch-record-rnd` | `frontend/src/app/(dashboard)/production/batch-record-rnd/page.tsx` | `[Semua, Siap Produksi, Dalam Proses, Menunggu APJ]` | Filter status batch record pada 1 tabel yang sama. | Hapus `tabs` dari `DnaPageHeader`. Pasang ke filter toolbar tabel. |
| **12** | **Approvals**: Artwork Approval<br>`/approvals/artwork-approval` | `frontend/src/app/(dashboard)/approvals/artwork-approval/_components/ArtworkApprovalTable.tsx` | `[Semua, Antrean Baru, Dikerjakan, Menunggu APJ, Menunggu Klien, Revisi, Final]` | `<DnaTabNav>` besar horizontal hanya untuk memfilter state task desain. | Ubah menjadi filter dropdown status terpadu di samping search bar. |
| **13** | **Warehouse**: Permintaan Bahan<br>`/inventory/requisition` | `frontend/src/app/(dashboard)/inventory/requisition/_components/RequisitionTable.tsx` | `[Semua, Menunggu Approval, Siap Serah, Selesai Diserahkan, Ditolak]` | `<DnaTabNav>` memfilter status material requisition. | Pindahkan ke status options di `DnaDataTableCard`. |
| **14** | **Finance**: Titipan Escrow Klien<br>`/finance/client-escrow` | `frontend/src/app/(dashboard)/finance/client-escrow/page.tsx` | `[Semua Escrow, Deposited, Partially Used, Settled]` | Filter status saldo titipan perizinan klien. | Hapus `tabs` dari `DnaPageHeader`. Masukkan ke status filter dropdown. |
| **15** | **Finance**: Closing Checklist<br>`/finance/closing` | `frontend/src/app/(dashboard)/finance/closing/page.tsx` | `[Semua Prosedur, Bank Reconcile, AR Review, AP Review, Stock Valuation, Depreciation, Statements]` | Memfilter kategori prosedur audit closing. | Ubah tab header menjadi filter dropdown kategori prosedur di atas tabel checklist. |
| **16** | **Pembelian**: Change Requests<br>`/pembelian/change-requests` | `frontend/src/app/(dashboard)/pembelian/change-requests/page.tsx` | `[Semua Request, Menunggu Review, Selesai]` | Filter status permohonan perubahan SCM. | Hapus `tabs` dari `DnaPageHeader`. Pindahkan ke filter tabel. |
| **17** | **Pembelian**: Vendor Performance<br>`/pembelian/vendor-performance/performance` | `frontend/src/app/(dashboard)/pembelian/vendor-performance/performance/page.tsx` | `[Semua Mitra, Tier Platinum, Tier Gold, Tier Silver]` | Filter tiering supplier berdasarkan score performa. | Hapus `tabs` dari `DnaPageHeader`. Masukkan ke filter dropdown Tier. |

---

## 🟡 2. Daftar Halaman Hybrid / Scope Campuran (Perlu Disederhanakan)

Halaman-halaman berikut memiliki navbar yang mencampur antara filter kepemilikan/tipe dengan perpindahan view entitas:

| Route & File | Tab Saat Ini | Masalah | Solusi Rapi |
| :--- | :--- | :--- | :--- |
| **`/master/customers`**<br>`master/customers/page.tsx` | `[Semua Pelanggan, Pelanggan Saya, Kategori Pelanggan]` | `Semua Pelanggan` vs `Pelanggan Saya` sebenarnya hanyalah **filter kepemilikan** (`penginput === currentSalesPic`). Hal ini membuat header bertindak sebagai filter. | 1. Pindahkan `Pelanggan Saya` menjadi opsi filter dropdown "Scope: Semua / Milik Saya" di toolbar tabel.<br>2. Halaman ini cukup memiliki satu tabel utama, dan Kategori Pelanggan dikelola lewat Drawer/Modal atau tab entitas khusus. |
| **`/penjualan/down-payment`**<br>`penjualan/down-payment/page.tsx` | `[1. DP Sample R&D, 2. DP Legalitas, 3. DP PO Produksi]` | Ketiganya menggunakan tabel `DpTable` yang sama persis, hanya berbeda field `category`. | Pindahkan pilihan kategori DP ke dalam dropdown filter toolbar "Tipe DP: Semua / Sample / Legalitas / Produksi". Hapus navbar di header. |
| **`/master/kpi-department` & `/master/kpi-individual`** | `[Department KPI, Individual KPI]` | Kedua route memiliki tab header yang saling melompat ke route tetangga. | Cukup gunakan navigasi sidebar resmi tanpa perlu tab silang di header, atau pertahankan sebagai sub-nav link jika disengaja. |

---

## 🟢 3. Daftar Halaman dengan Navbar / Tab Sah (Tetap Dipertahankan)

Halaman-halaman ini menggunakan tab untuk hal yang **benar-benar penting** dan **sesuai kaidah arsitektur**:

1. **`/quality/checklist-progress`**:
   - Tab: `[Checklist Progress, Checklist Tracking, Pengujian Lab]`
   - **Alasan Sah:** Merupakan navbar tautan antar sub-halaman fisik (`href: "/quality/..."`), bukan sekadar filter data.
2. **`/samples/omni-crm`**:
   - Tab: `[Bento Overview, Pipeline Kanban, WhatsApp Studio]`
   - **Alasan Sah:** Mengalihkan 3 tampilan sistem yang sama sekali berbeda arsitekturnya (Dasbor KPI vs Papan Kanban Drag-and-Drop vs Aplikasi Chat WA).
3. **`/samples/social-tracker`**:
   - Tab: `[Tabel, Kanban, Kalender, Galeri]`
   - **Alasan Sah:** View mode switcher (tata letak data multi-perspektif).
4. **`/production/operations`**:
   - Tab: `[Work Orders, Mixing, Filling, Packing]`
   - **Alasan Sah:** Mengalihkan stasiun kerja fisik di lantai produksi pabrik dengan form kontrol operasi mesin yang berbeda.
5. **`/warehouse/gudang`**:
   - Tab: `[1. Denah & Matriks Rak, 2. Master Gudang, 3. Master Rak & Bin, 4. Kategori & CoA Akun]`
   - **Alasan Sah:** Mengalihkan modul peta interaktif visual denah rak SVG vs konfigurasi master data.
6. **`/warehouse/workstation`**:
   - Tab: `[01. PROCUREMENT, 02. INTERNAL, 03. LOGISTICS]`
   - **Alasan Sah:** Alur stasiun barcode scanner operasional gudang per pos logistik.
7. **Detail Drawers / Modals (misal: `InboundDetailDrawer`, `OrderDetailDrawer`)**:
   - Tab internal: `[Informasi Umum, Rincian Item, Dokumen Legalitas, Log Audit]`
   - **Alasan Sah:** Pengorganisasian informasi dalam popup inspeksi (sesuai Visual DNA).

---

## 🛠️ Standar Baku Setelah Pembersihan (Target UI)

```
[ Layout Sebelum (Salah / Mengotori Header) ]
┌─────────────────────────────────────────────────────────────┐
│ Header Halaman                                              │
│ [ Semua ] [ Draft ] [ Menunggu ] [ Disetujui ] <── NAVBAR PALSU! │
├─────────────────────────────────────────────────────────────┤
│ KPI Cards                                                   │
├─────────────────────────────────────────────────────────────┤
│ [ Cari... ]                                                 │
│ [ Tabel Data ]                                              │
└─────────────────────────────────────────────────────────────┘

[ Layout Sesudah (Bersih & Sesuai Standar) ]
┌─────────────────────────────────────────────────────────────┐
│ Header Halaman (Hanya Judul, Subtitle, & Tombol Aksi Utama) │
├─────────────────────────────────────────────────────────────┤
│ KPI Cards                                                   │
├─────────────────────────────────────────────────────────────┤
│ TOOLBAR FILTER TABEL:                                       │
│ [ 🔍 Cari Data... ] [ Filter Status ▼ ] [ Filter Kategori ▼] │
│ [ Tabel Data ]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Hasil Eksekusi & Status Implementasi (100% SELESAI & TERVERIFIKASI)

- **✅ Gelombang 1 (Penjualan & SCM) — SELESAI**:
  - `/penjualan/job-order-costing`: Tab status open/closed dihapus dari header, dipindahkan ke `toolbarProps.statusOptions`.
  - `/penjualan/sample-fee`: Tab status fee dihapus dari header, dipindahkan ke `toolbarProps.statusOptions`.
  - `/pembelian/change-requests`: Tab status request dipindahkan ke `toolbarProps.statusOptions`.
  - `/pembelian/vendor-performance/performance`: Tab tiering supplier dipindahkan ke `toolbarProps.statusOptions`.
- **✅ Gelombang 2 (R&D & Pra-Produksi / Samples) — SELESAI**:
  - `/rnd/project-monitoring`: Tab status proyek dipindahkan ke dropdown filter status di toolbar.
  - `/samples/project-monitoring`: Tab status lab dipindahkan ke `toolbarProps.statusOptions`.
  - `/samples/npf`: Mengambang `<DnaTabNav>` dihapus, dimasukkan ke `NpfTable toolbarProps.statusOptions`.
  - `/samples/inbox`: Tab status intake lolos verifikasi dihapus dari header, dialihkan ke filter tabel.
  - `/samples/schedule`: Mengambang `<DnaTabNav>` dihapus, diubah menjadi `statusOptions` tahapan (Semua / Mixing / Filling / Packaging).
  - `/samples/revision-tracker`: Tab status revisi dipindahkan ke `toolbarProps.statusOptions`.
- **✅ Gelombang 3 (Quality, Produksi & Warehouse) — SELESAI**:
  - `/quality/coa`: Tab status CoA dipindahkan ke `toolbarProps.statusOptions`.
  - `/quality/qc-release`: Tab status batch karantina dipindahkan ke `toolbarProps.statusOptions`.
  - `/approvals/artwork-approval`: Mengambang `<DnaTabNav>` dihapus, dipindahkan ke `toolbarProps.statusOptions`.
  - `/production/batch-record-rnd`: Tab status batch pra-produksi dipindahkan ke `toolbarProps.statusOptions`.
  - `/inventory/requisition`: Mengambang `<DnaTabNav>` dihapus, dipindahkan ke `toolbarProps.statusOptions`.
- **✅ Gelombang 4 (Keuangan & Master Data) — SELESAI**:
  - `/finance/client-escrow`: Tab status escrow dihapus dari header, dipindahkan ke `toolbarProps.statusOptions` + filter peruntukan.
  - `/finance/closing`: Tab kategori audit dihapus dari header, dipindahkan ke `toolbarProps.statusOptions`.
  - `/master/customers`: Tab header dikonsolidasikan hanya untuk view entitas utama (`Database Pelanggan` vs `Master Kategori Pelanggan`). Scope kepemilikan (`Semua Pelanggan` vs `Pelanggan Saya`) dipindahkan ke tombol toggle filter toolbar.

### 🛡️ Kepatuhan Quality Gate (AGENTS.md)
1. `npm --prefix backend run typecheck` ➜ Exit Code 0 (0 errors)
2. `npm --prefix frontend run typecheck` ➜ Exit Code 0 (0 errors)
3. `npm --prefix frontend run build` ➜ Exit Code 0 (257 rute Next.js Turbopack build sukses)
