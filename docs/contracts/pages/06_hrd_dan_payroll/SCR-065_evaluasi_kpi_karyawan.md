# [SCR-065] Evaluasi KPI & Penilaian Kinerja Karyawan (Performance Appraisal)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/kpi`
- **Menu Sidebar:** `8. HR & PERSONALIA > Evaluasi KPI Karyawan`
- **Hak Akses (RBAC):** `HRD`, `HEAD_DEPT`, `SUPERADMIN`
- **Tujuan Operasional:** Lembar kerja evaluasi pencapaian target kerja karyawan, scoring skor KPI berkala (A/B/C/D), dan rekapitulasi penilaian untuk pertimbangan bonus atau kenaikan golongan upah.

---

## 2. Struktur Tabel Evaluasi Kinerja
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | NIK Pegawai | `nik` | `EMP-2026-XXXX` | Left |
| 3 | Nama Karyawan | `employeeName` | Nama Staf (Bold) | Left |
| 4 | Divisi & Jabatan | `departmentRole` | Dept / Posisi | Left |
| 5 | Skor Capaian KPI | `score` | `88.5 / 100` (tabular-nums) | Right |
| 6 | Kategori Nilai | `grade` | Badge: `A (SANGAT_BAIK)`, `B (BAIK)`, `C (CUKUP)`, `D (KURANG)` | Center |
| 7 | Periode Penilaian | `period` | `Q3 2026` | Center |
| 8 | Aksi | `actions` | Tombol: `Input Skor`, `Lihat Evaluasi`, `Cetak Scorecard` | Center |
