# [SCR-049] Mutasi & Kartu Stok Barang (Stock Movement & Inventory Card)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/mutasi-stok`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Mutasi Stok`
- **Hak Akses (RBAC):** `WAREHOUSE`, `FINANCE`, `ACCOUNTING`, `PPIC`, `SUPERADMIN`
- **Tujuan Operasional:** Jejak audit pergerakan keluar-masuk barang (In, Out, Saldo Akhir) yang terhubung dengan dokumen sumber (PO, Inbound LPB, SPK Penimbangan, DO Pengiriman, atau Adjustment).

---

## 2. Struktur Tabel Kartu Stok Terpadu
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Waktu / Timestamp | `timestamp` | `DD/MM/YYYY HH:mm` | Left |
| 3 | No. Referensi Dokumen | `docRef` | `LPB-001` / `SPK-002` / `DO-003` | Left |
| 4 | Nama Barang & SKU | `itemSku` | Nama Material (Bold) | Left |
| 5 | Tipe Mutasi | `mutationType` | Badge: `INBOUND`, `OUTBOUND_PRODUKSI`, `DISPATCH`, `ADJUSTMENT` | Center |
| 6 | Qty Masuk | `inQty` | `+100,00 KG` (Warna Hijau) | Right |
| 7 | Qty Keluar | `outQty` | `-25,00 KG` (Warna Merah) | Right |
| 8 | Saldo Berjalan | `balanceQty` | `1.075,00 KG` (tabular-nums Bold) | Right |
| 9 | Gudang & Petugas | `warehouseUser` | `Gudang Utama • Budi S.` | Left |
