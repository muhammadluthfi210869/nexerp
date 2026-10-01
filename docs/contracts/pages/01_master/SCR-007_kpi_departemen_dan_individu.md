# [SCR-007] Konfigurasi KPI Departemen & KPI Individu (Department & Individual KPI Config)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - KPI Departemen: `/master/kpi-department`
  - KPI Individu: `/master/kpi-individual`
- **Menu Sidebar:** `1. MASTER DATA > KPI Departemen & KPI Individu`
- **Hak Akses (RBAC):** `SUPERADMIN`, `HRD`, `HEAD_HRD`, `DIRECTOR`
- **Tujuan Operasional:** Konfigurasi master matriks Key Performance Indicators (KPI), bobot penilaian (weights), target tahunan/kuartalan, dan formula kalkulasi kinerja divisi & staf.

---

## 2. Struktur Tabel Konfigurasi KPI
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Departemen / Posisi | `department` | Nama Divisi / Jabatan (Bold) | Left |
| 3 | Indikator Kinerja | `indicatorName` | Judul Matriks KPI | Left |
| 4 | Satuan Ukur | `unit` | `PERSEN (%)`, `DOKUMEN`, `JAM`, `RUPIAH` | Center |
| 5 | Bobot KPI | `weight` | `20%` (tabular-nums) | Right |
| 6 | Target Standar | `targetValue` | Target Benchmark | Right |
| 7 | Periode Evaluasi | `evaluationPeriod` | `BULANAN`, `KUARTAL`, `TAHUNAN` | Center |
| 8 | Aksi | `actions` | Tombol: `Edit Matriks`, `Setup Formula` | Center |
