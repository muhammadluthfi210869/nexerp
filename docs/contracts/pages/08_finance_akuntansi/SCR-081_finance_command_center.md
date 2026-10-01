# [SCR-081] Finance Command Center Dashboard (Executive Cash Flow & Liquidity)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/dashboard`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Command Center`
- **Hak Akses (RBAC):** `FINANCE`, `ACCOUNTING`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Pusat kendali posisi kas & bank riil, likuiditas perusahaan, monitoring piutang (AR) dan hutang (AP) jatuh tempo, serta profitabilitas operasional maklon.

---

## 2. Struktur Komponen Dashboard
1. **Total Kas & Bank Likuid:** Agregasi saldo seluruh rekening bank operasional (BCA, Mandiri, BRI, Kas Kecil).
2. **Outstanding AR vs AP:** Total piutang tertagih vs hutang vendor yang jatuh tempo dalam 30 hari.
3. **Net Cash Flow Bulanan:** Arus kas masuk vs arus kas keluar riil.
4. **Grafik Pendapatan & Beban Pokok (HPP):** Visualisasi margin kotor dan laba bersih operasional.
