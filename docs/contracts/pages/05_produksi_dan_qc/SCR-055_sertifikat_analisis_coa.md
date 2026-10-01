# [SCR-055] Sertifikat Analisis / CoA (Certificate of Analysis)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/quality/coa`
- **Legacy GsERP URL:** `/certificate-of-analysis`
- **Menu Sidebar:** `9. RISET & FORMULASI (R&D) > Sertifikat Analisis (CoA)`
- **Hak Akses (RBAC):** `QC`, `APJ`, `RND`, `SUPERADMIN`
- **Tujuan Operasional:** Penerbitan lembar sertifikat resmi hasil pengujian mutu fisik, kimia, dan mikrobiologi produk jadi kosmetik per nomor batch, sebagai syarat rilis ke klien dan pemenuhan regulasi BPOM.

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Terbit CoA`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Terbit | `issueDate` | `DD/MM/YYYY` | Left |
| 3 | No. CoA | `coaNumber` | Clickable Link: `COA-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. Batch / Lot | `batchNumber` | Auto-generate dari DBR | Left |
| 5 | Brand & Produk | `brandProduct` | Brand (Bold) + Nama Produk | Left |
| 6 | No. Notifikasi BPOM | `bpomNumber` | Nomor Notifikasi Resmi (misal: `NA18230105432`) | Left |
| 7 | Tanggal Kadaluarsa (ED) | `expiredDate` | `DD/MM/YYYY` (misal: 2-3 Tahun dari produksi) | Left |
| 8 | Kesimpulan Mutu | `qualityVerdict`| Badge 1 Baris: `MEMENUHI_SYARAT (PASS)`, `TIDAK_MEMENUHI (FAIL)` | Center |
| 9 | Apoteker (APJ) | `apjSigner` | Nama Apoteker Penanggung Jawab | Left |
| 10 | Aksi | `actions` | Tombol: `Input Hasil Uji`, `Cetak Lembar CoA Resmi`, `Download PDF` | Center |

---

## 3. Secondary Window: Form Input Hasil Uji Laboratorium (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Buat CoA Baru` atau `Input Hasil Uji`.

| Parameter Uji | Standar Spesifikasi Mutu | Kolom Input Hasil Pengujian (Manual) | Kesimpulan |
|---|---|---|---|
| Bentuk / Pemerian | Cairan kental, tidak ada endapan | Text (misal: "Sesuai spesifikasi") | `Pass / Fail` |
| Warna | Bening transparan kehijauan | Text (misal: "Bening kehijauan") | `Pass / Fail` |
| Bau / Aroma | Khas aroma ekstrak teh | Text (misal: "Khas teh, tidak tengik")| `Pass / Fail` |
| pH ($25^\circ\text{C}$) | $5.00 - 5.50$ | Angka (misal: `5.25`) | `Pass / Fail` |
| Viskositas ($25^\circ\text{C}$)| $3.500 - 5.000\text{ cPs}$ | Angka (misal: `4.200 cPs`) | `Pass / Fail` |
| Berat Jenis | $1.00 - 1.05\text{ g/ml}$ | Angka (misal: `1.02 g/ml`) | `Pass / Fail` |
| Angka Lempeng Total (ALT)| $< 100\text{ CFU/ml}$ | Angka / Text (misal: `< 10 CFU/ml`)| `Pass / Fail` |
| Uji Jamur & Ragi | $< 10\text{ CFU/ml}$ | Angka / Text (misal: `Negatif`)| `Pass / Fail` |

---

## 4. Lembar Cetak Sertifikat Analisis (Universal Print A4)
Format dokumen resmi berlogo laboratorium pabrik, mencantumkan tabel spesifikasi vs hasil uji, nomor notifikasi BPOM, dan tanda tangan basah/digital **Apoteker Penanggung Jawab (APJ) (SIPA/STRA)**.
