# [SCR-084] Buku Besar & Riwayat Mutasi Akun (General Ledger Statement)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/ledger`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Buku Besar (Ledger)`
- **Hak Akses (RBAC):** `ACCOUNTING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Rekapitulasi pergerakan mutasi debit/kredit dan saldo berjalan per akun CoA dalam rentang tanggal tertentu untuk audit laporan keuangan.

---

## 2. Struktur Tampilan Buku Besar
1. **Filter Header:** Pilihan Akun CoA (misal: `1-1002 Bank BCA`), Rentang Tanggal (`DD/MM/YYYY - DD/MM/YYYY`).
2. **Ringkasan Saldo:** Saldo Awal, Total Mutasi Debit, Total Mutasi Kredit, Saldo Akhir.
3. **Tabel Mutasi Rinci:**
   - Kolom: Tanggal, No. Bukti Jurnal, Deskripsi, Lawan Akun (Offset), Debit, Kredit, Saldo Berjalan.
