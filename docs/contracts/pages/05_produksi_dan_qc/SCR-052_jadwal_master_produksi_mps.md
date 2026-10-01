# [SCR-052] Jadwal Master Produksi & Kapasitas Mesin (Master Production Schedule - MPS)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/production/schedule`
- **Menu Sidebar:** `6. R&D & PRODUKSI > Jadwal Produksi`
- **Hak Akses (RBAC):** `PPIC`, `PRODUCTION`, `HEAD_PRODUCTION`, `SUPERADMIN`
- **Tujuan Operasional:** Penjadwalan kapasitas mesin mixing (Homogenizer 500L, 200L, 50L) dan line filling otomatis harian/mingguan, mencegah bottleneck dan bentrok jadwal batch SPK.

---

## 2. Tampilan Kalender & Timeline Gantt
1. **Gantt Chart & Timeline Mesin:** Visualisasi alokasi batch per nomor mesin dan shift kerja.
2. **Kapasitas Terpakai (%):** Indikator utilisasi mesin harian.
3. **Konflik Jadwal:** Peringatan otomatis jika terjadi tumpang tindih waktu mixing atau pembersihan mesin (CIP / Clean-in-Place).
