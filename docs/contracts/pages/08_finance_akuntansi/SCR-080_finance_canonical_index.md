# [SCR-080] Direktori Kanonik Modul Finance & Akuntansi (NEX Finance Parity)

## 1. Otoritas Dokumen
- **Dokumen Sumber Kebenaran (Master Authority):** [NEX_FINANCE_FINAL_SPEC.md](file:///c:/GAWE/Web%20Dev/Porto%20Aureon/ERP%20FROM%20ZERO/docs/reference/NEX_FINANCE_FINAL_SPEC.md)
- **Menu Sidebar:** `12. KEUANGAN & AKUNTANSI`
- **Hak Akses (RBAC):** `FINANCE`, `ACCOUNTING`, `DIRECTOR`, `SUPERADMIN`

---

## 2. Pemulihan & Pelengkapan Halaman Finance (32 Sub-Layar Wajib)
Seluruh sub-halaman di bawah ini wajib aktif dan terhubung di sidebar sesuai spesifikasi final:

### Bagian A: Operasional Keuangan & Kas Bank
1. **Vendor Master & Hutang (AP):** `/master/suppliers` & `/pembelian/faktur-pembelian` (Ref §2.1-2.2)
2. **DP Pembelian & Bayar Pembelian:** `/pembelian/dp-pembelian` & `/pembelian/bayar-pembelian` (Ref §2.3-2.4)
3. **AP Aging & QC Toleransi:** `/finance/ap-aging` (Ref §2.5)
4. **Pengajuan Dana Operasional (Fund Request):** `/finance/fund-requests` (Ref §2.6)
5. **Customer Master & Piutang (AR):** `/master/customers` & `/penjualan/faktur-penjualan` (Ref §3.1-3.2)
6. **DP Penjualan & Bayar Penjualan:** `/penjualan/down-payment` & `/penjualan/bayar-penjualan` (Ref §3.3-3.4)
7. **Sample Fee & Bayar Sample:** `/penjualan/sample-fee` (Ref §3.7)
8. **AR Aging & Collections:** `/reports/ar-aging` (Ref §3.6)
9. **Kas Bank Masuk & Keluar:** `/finance/cash-in` & `/finance/cash-out` (Ref §4.2)
10. **Rekonsiliasi Bank:** `/finance/bank-reconciliation` (Ref §4.3)

### Bagian B: Akuntansi, Jurnal & Buku Besar
11. **Bagan Akun (CoA Master):** `/finance/accounting/coa` (Ref §1.1)
12. **Aturan Jurnal Otomatis (Auto-Journal Rules):** `/finance/accounting/auto-journal` (Ref §1.2)
13. **Jurnal Umum (General Journal):** `/finance/jurnal-umum` (Ref §1.3)
14. **Buku Besar (General Ledger):** `/finance/ledger` (Ref §1.4)
15. **Jurnal Penyesuaian (Adjustment Journal):** `/finance/adjustment-journal` (Ref §9.2)

### Bagian C: Laporan Keuangan Standar SAK
16. **Laba Rugi (Profit & Loss):** `/finance/laba-rugi` (Ref §11.2)
17. **Neraca (Balance Sheet):** `/finance/balance-sheet` (Ref §11.1)
18. **Neraca Saldo (Trial Balance):** `/finance/trial-balance` (Ref §11.1b)
19. **Laporan Arus Kas (Cash Flow):** `/finance/cash-flow` (Ref §11.4)
20. **Laporan Penjualan (Sales Summary):** `/reports/sales-summary` (Ref §11.5)

### Bagian D: Biaya Pokok, Job Costing & Pajak
21. **Permintaan HPP (COGS Request):** `/finance/cogs-request` (DIPULIHKAN)
22. **Job Order Costing (HPP Riil per SPK):** `/finance/job-order-costing` (Ref §8.1)
23. **Cost Variance Analysis:** `/finance/cost-variance` (Ref §8.2)
24. **Pengaturan Pajak & Transaksi Pajak (PPN/PPh):** `/finance/tax-setup` & `/finance/tax-transactions` (Ref §5.1-5.2)
25. **Register Aset Tetap & Depresiasi:** `/finance/asset-register` & `/finance/depreciation-schedule` (Ref §6.1-6.2)
26. **Anggaran vs Realisasi (Budget vs Actual):** `/finance/budget-vs-actual` (Ref §7.2)
27. **Penutupan Periode (Closing Checklist):** `/finance/closing` (Ref §9.1)

---

## 3. Aturan Jurnal Mutlak (Financial Invariant)
Setiap transaksi operasional yang berstatus `POSTED` otomatis memicu penulisan jurnal berpasangan seimbang ($Debit = Credit$). Jurnal manual dilarang mengubah akun persediaan atau kas bank tanpa bukti rekonsiliasi.
