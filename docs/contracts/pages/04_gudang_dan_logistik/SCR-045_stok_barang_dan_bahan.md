# [SCR-045] Stok Barang & Bahan (Live Inventory & Lot Tracking)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/stok`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Stok Barang & Bahan`
- **Hak Akses (RBAC):** `WAREHOUSE`, `HEAD_WAREHOUSE`, `PPIC`, `QC`, `SUPERADMIN`
- **Tujuan Operasional:** Pemantauan posisi saldo stok real-time seluruh bahan baku, kemasan, bulk, dan finished goods per gudang, nomor lot, tanggal expired, dan status karantina.

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Kode Barang / SKU | `skuCode` | `SKU-{XXX}` (Mono) | Left |
| 3 | Nama Barang | `itemName` | Nama Material / Produk (Bold) | Left |
| 4 | Kategori | `category` | Badge: `RAW_MATERIAL`, `PACKAGING`, `FG` | Center |
| 5 | Lokasi Gudang & Rak | `warehouseRack` | `Gudang Utama - Rak A-02` | Left |
| 6 | No. Batch / Lot | `lotNumber` | `LOT-{YYYYMMDD}-{XX}` | Left |
| 7 | Tgl Kadaluwarsa (Exp) | `expiredDate` | `DD/MM/YYYY` (Peringatan warna jika < 6 bulan) | Center |
| 8 | Saldo Tersedia | `availableQty` | `1.250,50 KG` (tabular-nums) | Right |
| 9 | Status Stok | `status` | Badge: `TERSEDIA`, `KARANTINA_QC`, `RESERVED_SPK` | Center |
| 10 | Aksi | `actions` | Tombol: `Kartu Stok`, `Transfer`, `Hold/Release` | Center |
