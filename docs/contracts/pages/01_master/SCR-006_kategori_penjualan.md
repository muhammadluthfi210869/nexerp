# [SCR-006] Kategori Penjualan & Pipeline Stages (Sales Category Master)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/sales-category`
- **Menu Sidebar:** `1. MASTER DATA > Kategori Penjualan`
- **Hak Akses (RBAC):** `SUPERADMIN`, `COMMERCIAL`, `BUSSDEV`, `DIRECTOR`
- **Tujuan Operasional:** Master kategori jenis transaksi penjualan maklon (Maklon Full Service, Maklon Maklon Jasa/Toll In, Maklon Semi-Finished, Penjualan Sample R&D, dan Whitelabel Brands) beserta pipeline tahapan deal.

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Kode Kategori | `categoryCode` | `SCAT-{XXX}` (Font mono) | Left |
| 3 | Nama Kategori | `name` | Kategori Penjualan (Bold) | Left |
| 4 | Jenis Kontrak | `contractType` | Badge: `FULL_SERVICE`, `TOLL_MANUFACTURING`, `SAMPLE_ORDER` | Center |
| 5 | Akun Pendapatan (CoA) | `revenueAccount` | `4-1001 Penjualan Maklon` | Left |
| 6 | Target Margin Minimum | `minMargin` | `25.0%` (Font tabular-nums) | Right |
| 7 | Status | `status` | Badge: `AKTIF`, `NONAKTIF` | Center |
| 8 | Aksi | `actions` | Tombol: `Edit`, `Atur Pipeline` | Center |
