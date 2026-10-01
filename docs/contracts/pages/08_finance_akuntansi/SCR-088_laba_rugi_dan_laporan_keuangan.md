# [SCR-088] Laba Rugi & Laporan Keuangan Standar SAK (Income Statement & Balance Sheet)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Laba Rugi: `/finance/laba-rugi`
  - Neraca Keuangan: `/reports/balance-sheet`
  - Arus Kas: `/reports/cash-flow`
  - Neraca Saldo: `/reports/trial-balance`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Laba Rugi`
- **Hak Akses (RBAC):** `ACCOUNTING`, `FINANCE`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Penyajian laporan laba rugi komprehensif (Pendapatan Maklon, Beban Pokok Penjualan/COGS Maklon, Laba Kotor, Beban Operasional/SGA, dan Laba Bersih Bersih Sebelum Pajak).

---

## 2. Struktur Penyajian Laporan Laba Rugi
1. **Pendapatan Usaha (Revenue):** Penjualan Jasa Maklon, Penjualan Produk Ruahan/FG, Penjualan Sample R&D.
2. **Beban Pokok Penjualan (HPP):** Pemakaian Bahan Baku, Pemakaian Bahan Kemas, Biaya Tenaga Kerja Langsung Pabrik, Biaya Overhead Pabrik (BOP).
3. **Laba Kotor (Gross Profit):** Pendapatan - HPP.
4. **Beban Operasional:** Beban Gaji Staf Kantor, Beban Pemasaran, Beban Administrasi & Umum.
5. **Laba Bersih Operasional (EBIT):** Laba Kotor - Beban Operasional.
