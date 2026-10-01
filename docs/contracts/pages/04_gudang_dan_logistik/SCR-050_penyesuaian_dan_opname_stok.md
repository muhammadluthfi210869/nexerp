# [SCR-050] Penyesuaian & Opname Stok (Stock Adjustment & Physical Count)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/adjustment`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Penyesuaian Stok`
- **Hak Akses (RBAC):** `HEAD_WAREHOUSE`, `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Rekonsiliasi selisih stok fisik hasil Stock Opname bulanan vs stok sistem ERP, pencatatan scrap/rusak/kadaluwarsa, dan approval penyesuaian nilai buku persediaan.

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Opname | `adjustmentDate` | `DD/MM/YYYY` | Left |
| 3 | No. Dokumen Opname | `docNumber` | `ADJ-{YYYYMM}-{XXXX}` | Left |
| 4 | Gudang Lokasi | `warehouseName` | Nama Gudang Fisik | Left |
| 5 | Tipe Penyesuaian | `type` | Badge: `STOCK_OPNAME_BULANAN`, `SCRAP_RUSAK`, `KADALUWARSA` | Center |
| 6 | Total Selisih Nilai | `varianceValue` | `+Rp 450.000` / `-Rp 120.000` (tabular-nums) | Right |
| 7 | Status Approval | `status` | Badge: `DRAFT`, `WAITING_FINANCE_APPROVAL`, `POSTED` | Center |
| 8 | Aksi | `actions` | Tombol: `Review Selisih`, `Approve Posting`, `Cetak BA Opname` | Center |
