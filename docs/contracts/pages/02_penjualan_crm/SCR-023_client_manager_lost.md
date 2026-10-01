# [SCR-023] Client Manager / Lost Deals (Client Lost)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/lost`
- **Menu Sidebar:** `6. CRM & BUSDEV > Client Lost`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Analisis penyebab kegagalan transaksi/lead (Lost Analysis) untuk perbaikan pricing, formulasi, atau layanan BusDev.

---

## 2. Struktur Tabel Utama (Format Bersih Sesuai Standar)
> **Pembersihan DNA:** Hilangkan perubahan font dan ukuran acak. Gunakan standar Inter `text-xs (12px)`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | BRAND & PRODUK | `brandProduct` | Brand (Bold) + Jenis Produk yang diajukan | Left |
| 2 | PIC BD | `picBusDev` | Nama Sales / Business Development | Left |
| 3 | EST. VALUE DEAL | `estDealValue` | `Rp #.##0` (Font tabular-nums) | Right |
| 4 | STAGE TERAKHIR | `lastStage` | Badge 1 Baris: `PROPOSAL`, `SAMPLE_TRIAL`, `NEGO_HARGA`, `KONTRAK` | Center |
| 5 | ALASAN LOST (CRITICAL) | `lostReason` | Teks Alasan Jelas: *Harga MOQ terlalu tinggi, Tekstur sample tidak cocok, Klien batal rilis brand, Lead time terlalu lama* | Left |

---

## 3. Secondary Window: Form Catat Lost Deal (Floating Modal)
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-xl`)
- **Field:** Brand, PIC BusDev, Nilai Deal, Tahap Terakhir, Kategori Alasan (Dropdown: Harga, Kualitas Sample, Regulasi, Waktu, Lainnya), Catatan Detail Penjelasan.
