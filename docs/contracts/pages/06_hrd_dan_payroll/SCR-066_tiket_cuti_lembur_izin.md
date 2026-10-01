# [SCR-066] Tiket Izin, Cuti & Lembur Karyawan (Leave & Overtime Tickets)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/tickets`
- **Menu Sidebar:** `8. HR & PERSONALIA > Izin, Cuti & Lembur`
- **Hak Akses (RBAC):** `HRD`, `HEAD_DEPT`, `SUPERADMIN`
- **Tujuan Operasional:** Alur pengajuan dan persetujuan tiket izin ketidakhadiran, cuti tahunan, sakit dengan surat dokter, serta surat perintah kerja lembur (SPKL) pabrik yang terintegrasi langsung ke workbench payroll.

---

## 2. Struktur Tabel Utama Tiket
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Pengajuan | `submitDate` | `DD/MM/YYYY` | Left |
| 3 | No. Tiket | `ticketNumber` | `TCK-HR-{YYYYMM}-{XXXX}` | Left |
| 4 | Nama Karyawan | `employeeName` | Nama Staf & Divisi | Left |
| 5 | Tipe Pengajuan | `ticketType` | Badge: `CUTI_TAHUNAN`, `IZIN_SAKIT`, `LEMBUR_PABRIK`, `TUGAS_LUAR` | Center |
| 6 | Durasi / Jam | `duration` | `1 Hari` / `3.5 Jam Lembur` | Center |
| 7 | Lampiran Bukti | `attachment` | File Upload / Link Surat Dokter | Center |
| 8 | Status Otorisasi | `approvalStatus` | Badge: `PENDING_ATASAN`, `DISETUJUI_HRD`, `DITOLAK` | Center |
| 9 | Aksi | `actions` | Tombol: `Setujui`, `Tolak`, `Lihat Detail` | Center |
