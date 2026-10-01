# [SCR-063] Pipeline Rekrutmen Kandidat (Recruitment & Applicant Tracking)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/recruitment`
- **Menu Sidebar:** `3. HRD & SUMBER DAYA > Rekrutmen & Pelamar`
- **Hak Akses (RBAC):** `HRD`, `HEAD_HRD`, `HEAD_DEPT`, `SUPERADMIN`
- **Tujuan Operasional:** Pengelolaan proses seleksi calon karyawan baru dari tahap berkas/CV masuk, tahapan tes teknis/interview, hingga keputusan lolos/tidak lolos dengan otomatisasi reminder notifikasi email.

---

## 2. Struktur Tabel Kandidat & Pelamar
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Melamar`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Melamar | `applyDate` | `DD/MM/YYYY` | Left |
| 3 | Nama Kandidat | `candidateName` | Nama Lengkap (Bold) + No WhatsApp | Left |
| 4 | Departemen & Posisi Dilamar| `targetRole` | Posisi (misal: "Operator Mixing - Produksi") | Left |
| 5 | Dokumen CV | `cvFileUrl` | Clickable Link: `Lihat CV (PDF)` | Center |
| 6 | Hasil Screening CV | `cvScreeningResult`| Badge 1 Baris: `MATCH`, `PERTIMBANGAN`, `TIDAK_COCOK` | Center |
| 7 | Tahap Seleksi Saat Ini | `currentStage` | Badge 1 Baris: `SELEKSI_BERKAS`, `INTERVIEW_HR`, `TES_PRAKTIK`, `OFFERING` | Center |
| 8 | Hasil Akhir | `finalStatus` | Badge 1 Baris: `PROSES`, `LOLOS (HIRED)`, `TIDAK_LOLOS (REJECT)` | Center |
| 9 | Notifikasi Reminder | `emailReminder` | Status Email: `Terkirim (Undangan Interview / Penolakan)` | Left |
| 10 | Aksi | `actions` | Tombol: `Ubah Tahap (Done/Reject)`, `Jadwalkan Interview`, `Konversi ke Karyawan` | Center |

---

## 3. Secondary Window: Form Input Pelamar & Upload CV (Floating Modal)
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-2xl`).
- **Trigger:** Tombol `+ Tambah Kandidat Pelamar`.
- **Field:** Nama Lengkap, Email, No WhatsApp, Posisi yang Dilamar, Departemen Tujuan, Upload CV (PDF), Catatan Hasil Screening Awal.

---

## 4. Alur Otomatisasi Reminder & Notifikasi
1. **Jika Tahap Berubah ke "LOLOS (Next Stage)":** Sistem menyediakan template WhatsApp / Email otomatis: *"Selamat [Nama], Anda dinyatakan lolos ke tahap interview pada [Tanggal/Jam]"*.
2. **Jika Tahap Berubah ke "REJECT":** Sistem otomatis mengirimkan email apresiasi penolakan yang profesional.
3. **Konversi ke Karyawan Baru:** Mengklik tombol `Konversi ke Karyawan` otomatis memindahkan data pelamar menjadi profil karyawan baru di `/hr/employees` untuk persiapan onboarding 3 hari.
