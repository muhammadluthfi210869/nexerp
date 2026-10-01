# [SCR-051] Tahapan Produksi Aktif (Mixing, Filling, Packaging)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Mixing: `/production/mixing`
  - Filling: `/production/filling`
  - Packaging: `/production/packaging`
- **Menu Sidebar:** `11. PRODUKSI PABRIK > Produksi Mixing / Filling / Packaging`
- **Hak Akses (RBAC):** `PRODUCTION_OP`, `HEAD_PRODUCTION`, `QC`, `SUPERADMIN`
- **Tujuan Operasional:** Pelaksanaan operasional pabrik nyata (bukan hanya read-only), mencatat waktu mulai, waktu selesai, input rendemen aktual, reject botol/kemasan, dan pergantian status batch.

---

## 2. Pembenahan Masalah "Halaman Produksi Hanya Read-Only"
> **Koreksi:** Sebelumnya halaman ini hanya menampilkan tabel tanpa tombol aksi. Operator pabrik tidak bisa mencatat perkembangan batch.
> **Fitur Baru Wajib:** Disediakan tombol aksi operasional per baris transaksi.

---

## 3. Struktur Tabel Operasional (Berlaku untuk Mixing, Filling, dan Packaging)
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Pelaksanaan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal | `executionDate` | `DD/MM/YYYY` | Left |
| 3 | No. Batch / Lot | `batchNumber` | Clickable Link (Buka DBR) | Left |
| 4 | Brand & Produk | `brandProduct` | Brand (Bold) + Nama Produk | Left |
| 5 | Target Output | `targetOutput` | Angka (misal: `500 Kg` di mixing, atau `10.000 Pcs` di filling) | Right |
| 6 | Realisasi Output (Rendemen) | `actualYield` | Angka Aktual (misal: `492 Kg` / `9.850 Pcs`) | Right |
| 7 | Reject / Susut | `rejectQty` | Angka Reject (misal: `150 Botol Cacat / 8 Kg Adonan`) | Right |
| 8 | Operator / Regu | `operatorName` | Nama Kepala Regu Shift | Left |
| 9 | Status Tahap | `stageStatus` | Badge 1 Baris: `MENUNGGU_GILIRAN`, `SEDANG_BERJALAN`, `SELESAI`, `HOLD_QC` | Center |
| 10 | Aksi Operasional | `actions` | Tombol: `▶ Mulai Proses`, `✓ Catat Hasil & Selesai`, `Cetak Log` | Center |

---

## 4. Secondary Window: Form Catat Hasil Riil & Reject (Floating Modal)
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-2xl`).
- **Trigger:** Tombol `✓ Catat Hasil & Selesai`.
- **Field:**
  * Waktu Mulai & Waktu Selesai (Jam:Menit).
  * Jumlah Output Bersih yang Lolos (Kg / Pcs).
  * Jumlah Reject / Limbah (Kg / Pcs).
  * Kategori Alasan Reject (Dropdown: Mesin Bocor, Cacat Botol Supplier, Suhu Overheat, Tumpah).
  * Catatan Operator Shift.
- **Dampak Status:** Mengubah status batch menjadi `SELESAI` dan otomatis meneruskan batch ke stasiun berikutnya (Mixing $\rightarrow$ Filling $\rightarrow$ Packaging $\rightarrow$ Karantina QC).
