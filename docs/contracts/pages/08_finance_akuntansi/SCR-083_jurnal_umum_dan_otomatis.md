# [SCR-083] Jurnal Umum & Auto-Journal Invariant (General Journal Entries)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Jurnal Umum: `/finance/jurnal-umum`
  - Auto-Journal Config: `/finance/accounting/auto-journal`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Jurnal Umum`
- **Hak Akses (RBAC):** `ACCOUNTING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan jurnal manual penyesuaian (adjustment journal), audit log seluruh auto-journal dari modul penjualan/pembelian/gudang, dan penjaminan **Invarian Akuntansi Mutlak: Total Debit == Total Kredit**.

---

## 2. Struktur Tabel Jurnal Umum
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Jurnal | `entryDate` | `DD/MM/YYYY` | Left |
| 3 | No. Bukti Jurnal | `journalNumber` | `JV-{YYYYMM}-{XXXX}` (Mono Bold) | Left |
| 4 | No. Referensi Dokumen | `docRef` | `INV-001` / `PO-002` / `MANUAL` | Left |
| 5 | Deskripsi / Keterangan | `description` | Uraian Transaksi | Left |
| 6 | Total Debit (IDR) | `totalDebit` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Total Kredit (IDR) | `totalCredit` | `Rp #.##0` (tabular-nums) | Right |
| 8 | Status Balance | `isBalanced` | Badge: `BALANCED`, `UNBALANCED (ERROR)` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Garis Jurnal`, `Cetak Voucher` | Center |
