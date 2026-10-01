# [SCR-029] Target Penjualan, Buku Tamu & OmniCRM Leads

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Target Penjualan: `/penjualan/sales-target`
  - Buku Tamu Pabrik: `/penjualan/guest-book`
  - OmniCRM WhatsApp: `/samples/omni-crm`
- **Menu Sidebar:** `2. PENJUALAN & CRM`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Pemantauan realisasi target sales vs target bulanan tim BusDev, pencatatan registrasi kunjungan tamu/klien maklon ke pabrik (Buku Tamu), dan integrasi perpesanan prospek WhatsApp omnichannel.

---

## 2. Struktur Tabel Target Penjualan & Performa BusDev
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Periode Bulan | `period` | `September 2026` | Left |
| 3 | Nama PIC BusDev | `salesPerson` | Nama PIC Sales | Left |
| 4 | Target Nominal | `targetAmount` | `Rp #.##0` (tabular-nums) | Right |
| 5 | Realisasi Terverifikasi | `achievedAmount` | `Rp #.##0` (tabular-nums) | Right |
| 6 | Persentase Capaian | `percentage` | `105.4%` (Progress Bar DNA) | Center |
| 7 | Insentif Estimasi | `bonusEstimate` | `Rp #.##0` | Right |
| 8 | Status Target | `status` | Badge: `TERCAPAI`, `ON_TRACK`, `UNDER_PERFORM` | Center |
