# [SCR-086] Rekonsiliasi Bank (Bank Statement vs General Ledger Balancing)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/bank-reconciliation`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Rekonsiliasi Bank`
- **Hak Akses (RBAC):** `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Pencocokan berkala antara mutasi rekening koran bank riil (hasil import CSV/Excel e-banking) dengan catatan pembukuan ERP untuk menemukan transaksi belum tercatat, biaya admin, atau bunga bank.

---

## 2. Struktur Tampilan Rekonsiliasi Dua Sisi
1. **Sisi Kiri (Rekening Koran Bank):** Mutasi bank impor.
2. **Sisi Kanan (Buku Kas ERP):** Catatan transaksi kas/bank sistem.
3. **Tombol Auto-Match:** Algoritma pencocokan otomatis berdasarkan tanggal, nominal, dan nomor referensi.
4. **Indikator Unreconciled Difference:** Wajib Rp 0 sebelum penutupan rekonsiliasi.
