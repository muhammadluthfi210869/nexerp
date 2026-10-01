# [SCR-048] Transfer Stok Antar Gudang (Inter-Warehouse Stock Transfer)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/pindah-gudang`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Transfer Gudang`
- **Hak Akses (RBAC):** `WAREHOUSE`, `PPIC`, `SUPERADMIN`
- **Tujuan Operasional:** Perpindahan fisik dan sistem atas material/barang antar gudang (misal: Gudang Pusat -> Gudang Transit Ruang Produksi/Penimbangan).

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Transfer | `transferDate` | `DD/MM/YYYY` | Left |
| 3 | No. Transfer | `transferNumber` | `TRF-{YYYYMM}-{XXXX}` | Left |
| 4 | Gudang Asal | `sourceWarehouse` | `Gudang Bahan Baku Utama` | Left |
| 5 | Gudang Tujuan | `targetWarehouse` | `Ruang Timbang / Mixing` | Left |
| 6 | Jumlah Item | `itemCount` | `5 Item Bahan` | Center |
| 7 | Status | `status` | Badge: `DRAF`, `DALAM_PERJALANAN`, `DITERIMA` | Center |
| 8 | Aksi | `actions` | Tombol: `Konfirmasi Terima`, `Cetak Form Transfer` | Center |
