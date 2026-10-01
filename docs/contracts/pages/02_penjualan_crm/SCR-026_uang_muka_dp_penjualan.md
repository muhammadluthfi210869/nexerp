# [SCR-026] Uang Muka & DP Penjualan (Customer Down Payments)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/down-payment`
- **Menu Sidebar:** `2. PENJUALAN & CRM > DP Penjualan`
- **Hak Akses (RBAC):** `COMMERCIAL`, `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Penerbitan invoice uang muka (DP) maklon sebelum produksi dijalankan, pencatatan penerimaan kas/bank, dan auto-journal Uang Muka Penjualan (Kewajiban Lancar / Unearned Revenue).

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal DP | `dpDate` | `DD/MM/YYYY` | Left |
| 3 | No. Invoice DP | `dpInvoiceNumber` | `INV-DP-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Rujukan No. SO | `soNumber` | `SO-{YYYYMMDD}-{XXXX}` | Left |
| 5 | Pelanggan / Brand | `customerName` | Nama Klien (Bold) | Left |
| 6 | Nominal DP Tagihan | `dpAmount` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Kas/Bank Tujuan | `bankAccount` | `BCA Operasional` | Left |
| 8 | Status Pembayaran | `status` | Badge: `MENUNGGU_BAYAR`, `LUNAS_TERVERIFIKASI`, `BATAL` | Center |
| 9 | Aksi | `actions` | Tombol: `Konfirmasi Bayar`, `Cetak Kuitansi`, `Jurnal` | Center |
