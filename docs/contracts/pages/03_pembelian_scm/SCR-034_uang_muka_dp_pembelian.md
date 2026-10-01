# [SCR-034] Uang Muka & DP Pembelian (Vendor Down Payments)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/dp-pembelian`
- **Menu Sidebar:** `3. PEMBELIAN & PENGADAAN > DP Pembelian`
- **Hak Akses (RBAC):** `PPIC`, `SCM`, `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan dan verifikasi pembayaran uang muka pembelian bahan baku/kemas kepada supplier sebelum barang dikirim, auto-journal ke akun Uang Muka Pembelian (Aset Lancar).

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal DP | `dpDate` | `DD/MM/YYYY` | Left |
| 3 | No. DP Pembelian | `dpNumber` | `DP-PURCH-{YYYYMM}-{XXXX}` | Left |
| 4 | No. PO Rujukan | `poNumber` | `PO-{YYYYMM}-{XXXX}` (Mono Bold) | Left |
| 5 | Supplier / Vendor | `vendorName` | Nama Supplier PT | Left |
| 6 | Nominal DP Keluar | `amount` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Akun Kas/Bank | `bankAccount` | `Mandiri Operasional` | Left |
| 8 | Status | `status` | Badge: `DRAFT`, `DISETUJUI`, `DIBAYARKAN` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Voucher`, `Cetak Bukti`, `Audit Jurnal` | Center |
