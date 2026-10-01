# [SCR-089] Aset Tetap & Depresiasi Otomatis (Fixed Assets & Depreciation Schedule)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/assets`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Aset Tetap`
- **Hak Akses (RBAC):** `ACCOUNTING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Master pencatatan aset tetap pabrik dan kantor (Mesin Homogenizer, Line Filling Otomatis, Komputer Lab, Kendaraan Operasional), metode depresiasi garis lurus (straight-line), dan posting jurnal penyusutan bulanan otomatis.

---

## 2. Struktur Tabel Master Aset
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Perolehan | `acquisitionDate` | `DD/MM/YYYY` | Left |
| 3 | Kode Aset | `assetCode` | `AST-{CAT}-{XXXX}` (Mono Bold) | Left |
| 4 | Nama Aset Tetap | `name` | Nama Mesin / Peralatan | Left |
| 5 | Kategori Aset | `category` | Badge: `MESIN_PABRIK`, `PERALATAN_LAB`, `KENDARAAN`, `GEDUNG` | Center |
| 6 | Nilai Perolehan Awal | `cost` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Akumulasi Penyusutan | `accumulatedDepr` | `Rp #.##0` (tabular-nums) | Right |
| 8 | Nilai Buku Bersih | `bookValue` | `Rp #.##0` (tabular-nums Bold) | Right |
| 9 | Aksi | `actions` | Tombol: `Jadwal Depresiasi`, `Post Penyusutan Bulanan` | Center |
