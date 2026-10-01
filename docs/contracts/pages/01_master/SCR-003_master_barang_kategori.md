# [SCR-003] Master Barang & Kategori (Goods, Materials & Categories)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/goods`
- **Menu Sidebar:** `1. MASTER DATA > Master Barang & Kategori`
- **Hak Akses (RBAC):** `SUPERADMIN`, `PPIC`, `WAREHOUSE`, `FINANCE`, `COMMERCIAL`
- **Tujuan Operasional:** Katalog induk seluruh bahan baku (raw materials), bahan kemas (packaging), produk ruahan (bulk), dan produk jadi (finished goods), mencakup batas minimum stok, satuan (UoM), dan kategori.

---

## 2. Card Status & KPI Inventori
Di atas tabel utama, terdapat ringkasan stok master:
1. **Total Master Barang:** Jumlah SKU aktif terdaftar di sistem.
2. **Bahan Baku & Kemas (Raw/Pack):** Total SKU material produksi aktif.
3. **Produk Jadi & Ruahan (FG/Bulk):** Total formula rilis dan barang jadi.
4. **Stok di Bawah Minimum:** Indikator peringatan dini re-order point.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Registrasi`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Registrasi | `createdAt` | `DD/MM/YYYY` | Left |
| 3 | Kode Barang / SKU | `skuCode` | `SKU-{CAT}-{XXXX}` (Font mono) | Left |
| 4 | Nama Barang / Material | `name` | Nama resmi bahan / barang (Bold) | Left |
| 5 | Tipe & Kategori | `category` | Badge: `RAW_MATERIAL`, `PACKAGING`, `BULK`, `FINISHED_GOOD` | Center |
| 6 | Satuan (UoM) | `uom` | `KG`, `GRAM`, `PCS`, `BOTOL`, `BOX` | Center |
| 7 | Min. Stock & Buffer | `minStock` | Angka tabular-nums | Right |
| 8 | Status | `status` | Badge: `AKTIF`, `NONAKTIF`, `DISCONTINUED` | Center |
| 9 | Aksi | `actions` | Tombol: `Detail`, `Edit`, `Kartu Stok` | Center |

---

## 4. Secondary Window: Form Input & Edit Barang (Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Tambah Barang Baru`.
- **Field:** Kode SKU, Nama Barang, Kategori Material, Satuan Dasar (UoM), Satuan Pembelian (Purchase UoM), Konversi Rasio, Minimum Safety Stock, Titik Reorder (ROP), Lokasi Rak Default, Catatan COA/MSDS.
