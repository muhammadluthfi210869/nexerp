# [SCR-042] Permintaan HPP / COGS (Cost of Goods Sold Calculation)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/cogs-request` & `/samples/repository?tab=hpp`
- **Legacy GsERP URL:** `/request-cogs`
- **Menu Sidebar:** `9. RISET & FORMULASI (R&D) > Permintaan HPP` dan `12. KEUANGAN & AKUNTANSI` (DIPULIHKAN DARI STATUS HILANG)
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `RND`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pengajuan kalkulasi Harga Pokok Penjualan (HPP) oleh BusDev kepada Finance & R&D berdasarkan formula tertentu dan volume pesanan (MOQ) sebelum penawaran harga resmi diberikan kepada calon klien maklon.

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Pengajuan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Pengajuan | `requestDate` | `DD/MM/YYYY` | Left |
| 3 | No. Permintaan HPP | `cogsCode` | Clickable Link: `HPP-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Pelanggan / Brand | `customerBrand` | Pelanggan (Bold) + Brand | Left |
| 5 | Produk & Formula | `productFormula` | Nama Produk • Formula Acuan | Left |
| 6 | Target MOQ | `moqUnits` | Qty Pcs Pesanan (misal: `5.000 Pcs`) | Right |
| 7 | HPP per Pcs (Kalkulasi) | `unitCogsCalculated` | `Rp #.##0` (Font tabular-nums) | Right |
| 8 | Rekomendasi Harga Jual | `suggestedSellingPrice`| `Rp #.##0` (Margin 30-40%) | Right |
| 9 | Status | `status` | Badge 1 Baris: `PENGAJUAN`, `ANALISIS_FINANCE`, `APPROVED_DIRECTOR`, `SELESAI` | Center |
| 10 | Aksi | `actions` | Tombol: `Lihat Simulasi HPP`, `Hitung Ulang`, `Cetak Lembar HPP` | Center |

---

## 3. Secondary Window: Form Input Permintaan HPP (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-3xl`).
- **Trigger:** Tombol `+ Buat Permintaan HPP`.
- **Field:** Pelanggan, Formula Acuan, Jumlah MOQ (1.000, 3.000, 5.000 pcs), Jenis Kemasan (Botol Pump, Pot Cream, Tube), Target Margin Keuntungan %, dan Catatan Tambahan.
