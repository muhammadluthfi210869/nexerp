# [SCR-062] Onboarding & Pelatihan Karyawan (Training & Development)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/training`
- **Menu Sidebar:** `3. HRD & SUMBER DAYA > Onboarding & Training`
- **Hak Akses (RBAC):** `HRD`, `HEAD_DEPT`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan masa orientasi/onboarding karyawan baru (standar 3 hari), akumulasi jam training tahunan per karyawan, target pembelajaran, dan penyimpanan arsip sertifikat kompetensi.

---

## 2. Struktur Tabel Log Pelatihan
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Pelatihan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Pelatihan | `trainingDate` | `DD/MM/YYYY` | Left |
| 3 | Nama Karyawan | `employeeName` | Nama Karyawan (Bold) + Departemen | Left |
| 4 | Jenis / Topik Training | `trainingTopic` | Topik (misal: "CPKB & Higiene Sanitasi Ruang Mixing") | Left |
| 5 | Durasi Jam | `trainingHours` | Angka Jam (misal: `8 Jam` / `3 Hari Onboarding`) | Center |
| 6 | Goal / Target Capaian | `trainingGoal` | Teks bebas: Target penguasaan kompetensi | Left |
| 7 | Sertifikat | `certificateUrl` | Badge / Link: `Download Sertifikat (PDF/JPG)` | Center |
| 8 | Status Kelulusan | `status` | Badge 1 Baris: `ONBOARDING_DAY_1..3`, `LULUS`, `PERLU_REMEDIAL` | Center |
| 9 | Aksi | `actions` | Tombol: `Input Nilai`, `Upload Sertifikat`, `Cetak Lembar Evaluasi` | Center |

---

## 3. Secondary Window: Form Catat Training & Import Sertifikat (Floating Modal)
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-2xl`).
- **Trigger:** Tombol `+ Catat Pelatihan Baru`.
- **Field:** Nama Karyawan (SearchSelect), Tanggal Pelatihan, Topik Training (Dropdown / Ketik Bebas), Durasi Jam, Tipe (Onboarding 3 Hari / Training Reguler / Sertifikasi Eksternal), Goal/Target yang ingin dicapai, Upload/Import Dokumen Sertifikat.
