# [SCR-047] Pengiriman & Rilis Barang Jadi (Delivery Orders & Dispatch Release)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/release`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Pengiriman (Release)`
- **Hak Akses (RBAC):** `WAREHOUSE`, `LOGISTICS`, `COMMERCIAL`, `SUPERADMIN`
- **Tujuan Operasional:** Pengeluaran resmi barang jadi (Finished Goods) yang telah lolos CoA QC untuk dikirimkan kepada klien maklon, pembuatan Surat Jalan (Delivery Order), dan update status SO.

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Rilis | `releaseDate` | `DD/MM/YYYY` | Left |
| 3 | No. Surat Jalan (DO) | `deliveryNumber` | `DO-{YYYYMM}-{XXXX}` (Mono Bold) | Left |
| 4 | No. SO Rujukan | `soNumber` | `SO-{YYYYMM}-{XXXX}` | Left |
| 5 | Pelanggan & Alamat Kirim | `customerAddress` | Nama Klien + Tujuan Ekspedisi | Left |
| 6 | Total Karton / Pcs | `qtySummary` | `20 Box (10.000 Pcs)` | Right |
| 7 | Kurir / Ekspedisi | `expedition` | `Armada Pabrik`, `Dakota Cargo`, dll | Left |
| 8 | Status Pengiriman | `deliveryStatus` | Badge: `DIPACKING`, `DIKIRIM`, `DITERIMA_KLIEN` | Center |
| 9 | Aksi | `actions` | Tombol: `Cetak Surat Jalan`, `Input Resi`, `Selesaikan` | Center |
