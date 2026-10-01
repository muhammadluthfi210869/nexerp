# [SCR-060] Master Data Karyawan & Personel (Employee Master)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/employees`
- **Menu Sidebar:** `3. HRD & SUMBER DAYA > Data Karyawan` (MEMISAHKAN URL DARI DASHBOARD HR)
- **Hak Akses (RBAC):** `HRD`, `HEAD_HRD`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Master sentral pencatatan profil karyawan pabrik & kantor, kontrak kerja, skema kompensasi upah tetap, catatan KPI, data BPJS, dan pemeliharaan data kepegawaian.

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Masuk`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Masuk | `joinDate` | `DD/MM/YYYY` | Left |
| 3 | NIK & Nama | `employeeName` | Nama Karyawan (Bold) + NIK Karyawan | Left |
| 4 | Usia & Tgl Lahir | `ageDob` | `28 Thn` • `DD/MM/YYYY` | Left |
| 5 | Departemen & Jabatan | `deptPosition` | Dept (Produksi/QC/Sales) • Jabatan | Left |
| 6 | Status Kontrak | `contractStatus`| Badge 1 Baris: `TETAP (PKWTT)`, `KONTRAK (PKWT)`, `PROBATION` | Center |
| 7 | Skor KPI | `kpiScore` | Skor Angka (misal: `88.5`) + Trend Ikon | Center |
| 8 | Status BPJS | `bpjsStatus` | Nomor BPJS Kesehatan & Ketenagakerjaan (atau `Belum Terdaftar`) | Left |
| 9 | Peringkat (Rank) | `rankBadge` | Badge Karyawan Terbaik (misal: `⭐ Top 5`) | Center |
| 10 | Aksi | `actions` | Tombol: `Lihat Profil`, `Edit Data`, `Slip Gaji`, `Riwayat Training` | Center |

---

## 3. Secondary Window: Form Input & Profil Karyawan (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`) dengan Tab Navigasi:

### Tab A: Biodata & Kepegawaian
* Nama Lengkap, NIK KTP, NIK Karyawan (Auto-generate), Tempat/Tanggal Lahir, Jenis Kelamin, Alamat Domisili, No WhatsApp Aktif, Email.
* Departemen, Jabatan, Atasan Langsung, Tanggal Masuk Kerja, Durasi Kontrak, Sisa Masa Kontrak (dengan reminder otomatis `H-30` sebelum kontrak habis).

### Tab B: Struktur Upah & Kompensasi
* **Upah Tetap:**
  - Gaji Pokok (`Rp #.##0`)
  - Tunjangan Jabatan (`Rp #.##0`)
* **Tunjangan Transportasi (2 Kolom):**
  - Transport Flat Bulanan (`Rp #.##0`)
  - Transport Tentatif / Kehadiran Harian (`Rp #.##0 / Hari Hadir`)
* **BPJS:**
  - No BPJS Ketenagakerjaan & No BPJS Kesehatan (Boleh dikosongkan jika belum terdaftar).
* **Catatan Komponen Gaji:** Deskripsi tambahan (Boleh dikosongkan / opsional).

### Tab C: Penilaian Kinerja (KPI) & Grafik
* Menampilkan grafik riwayat skor KPI bulanan karyawan (Trend 6 bulan terakhir).
* Peringkat performa karyawan di departemennya.
