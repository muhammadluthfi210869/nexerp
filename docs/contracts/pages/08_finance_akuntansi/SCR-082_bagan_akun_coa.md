# [SCR-082] Bagan Akun Standar / Chart of Accounts (CoA Tree & Rules)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/accounting/coa`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Chart of Accounts (CoA)`
- **Hak Akses (RBAC):** `ACCOUNTING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Master hierarki 5 kelompok akun akuntansi (1-Aset, 2-Kewajiban, 3-Ekuitas, 4-Pendapatan, 5-Beban Pokok Penjualan, 6-Beban Operasional) dan mapping auto-journaling otomatis seluruh transaksi ERP.

---

## 2. Struktur Tabel Hierarki Akun
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Kode Akun (No. CoA) | `accountCode` | `1-1001`, `2-1000` (Mono Bold) | Left |
| 3 | Nama Akun | `accountName` | Nama Akun Akuntansi (Indent per level) | Left |
| 4 | Klasifikasi / Header | `classification` | Badge: `ASET_LANCAR`, `KEWAJIBAN`, `PENDAPATAN` | Center |
| 5 | Saldo Normal | `normalBalance` | `DEBIT` / `KREDIT` | Center |
| 6 | Saldo Berjalan | `currentBalance` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Status | `status` | Badge: `AKTIF`, `TERKUNCI_SISTEM` | Center |
| 8 | Aksi | `actions` | Tombol: `Buku Besar`, `Edit`, `Tambah Sub-Akun` | Center |
