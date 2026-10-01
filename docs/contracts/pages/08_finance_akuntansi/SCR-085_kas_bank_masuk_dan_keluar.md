# [SCR-085] Kas & Bank Masuk / Keluar (Cash & Bank Transactions)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Kas Masuk (Receipts): `/finance/cash-in`
  - Kas Keluar (Disbursements): `/finance/cash-out`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Kas Bank Masuk & Keluar`
- **Hak Akses (RBAC):** `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan penerimaan dana di luar piutang dagang (setoran modal, bunga bank, pendapatan lain) dan pengeluaran kas non-PO (biaya operasional, utilitas listrik/air, reimburs).

---

## 2. Struktur Tabel Kas/Bank
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Transaksi | `txDate` | `DD/MM/YYYY` | Left |
| 3 | No. Voucher Kas | `voucherNo` | `CR-{YYYYMM}-{XXXX}` / `CD-{...}` | Left |
| 4 | Rekening Kas/Bank | `bankName` | `Bank BCA Operasional` | Left |
| 5 | Dibayar Ke / Diterima Dari | `recipient` | Pihak Ketiga / Vendor | Left |
| 6 | Total Nominal | `amount` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Status | `status` | Badge: `TERCATAT`, `POSTED_JURNAL` | Center |
| 8 | Aksi | `actions` | Tombol: `Cetak Bukti Kas`, `Lihat Jurnal` | Center |
