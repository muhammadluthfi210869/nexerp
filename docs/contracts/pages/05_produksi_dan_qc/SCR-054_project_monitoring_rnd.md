# [SCR-054] Project Monitoring R&D & Pengujian Lab Mutu

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Project Monitoring R&D: `/rnd/project-monitoring`
  - Pengujian Lab: `/quality/lab-test`
- **Menu Sidebar:** `6. R&D & PRODUKSI`
- **Hak Akses (RBAC):** `RND`, `QC`, `APJ`, `COMMERCIAL`, `SUPERADMIN`
- **Tujuan Operasional:** Pemantauan timeline formulasi sampel maklon, pengujian stabilitas (Stability Chamber 40°C), uji kompatibilitas kemasan, dan approval panel sensori.

---

## 2. Struktur Tabel Monitoring Proyek R&D
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Mulai | `startDate` | `DD/MM/YYYY` | Left |
| 3 | Kode Proyek | `projectCode` | `RND-PRJ-{YYYY}-{XXXX}` | Left |
| 4 | Klien / Brand | `clientBrand` | Nama Klien & Target Produk | Left |
| 5 | Formulator Utama | `formulator` | Nama Apoteker / Formulator | Left |
| 6 | Uji Stabilitas (Real/Acc) | `stabilityStatus` | Badge: `TESTING_30_DAYS`, `PASSED`, `FAILED` | Center |
| 7 | Status Feedback Klien | `clientFeedback` | Badge: `SAMPLE_SENT`, `REVISION_REQUESTED`, `APPROVED` | Center |
| 8 | Aksi | `actions` | Tombol: `Buka Folder Proyek`, `Hasil Uji Lab`, `Revisi Formula` | Center |
