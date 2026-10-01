# [SCR-040] Kelola & Buat Formulasi (Formula Management & Creation)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/samples/formula` & `/samples/repository`
- **Legacy GsERP URL:** `/formulation` & `/formulation-manage`
- **Menu Sidebar:** `9. RISET & FORMULASI (R&D) > Kelola Formulasi / Buat Formula Baru`
- **Hak Akses (RBAC):** `RND`, `HEAD_RND`, `SUPERADMIN`
- **Tujuan Operasional:** Repositori resep kimia produk maklon, pembuatan formula baru baik dari nol (inovasi R&D) maupun penarikan resmi dari Sample Trial yang telah di-ACC klien.

---

## 2. Struktur Tabel Utama (Daftar Formula)
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Dibuat`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Dibuat | `createdAt` | `DD/MM/YYYY` | Left |
| 3 | Kode Formula | `formulaCode` | Clickable Link: `FRM-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Nama Formula / Produk | `formulaName` | Nama Formula (Bold) | Left |
| 5 | Klien / Brand Acuan | `clientBrand` | Nama Klien / Brand (atau "Formula Umum Pabrik") | Left |
| 6 | Kategori & Bentuk | `categoryForm` | Kategori (Skincare) • Bentuk (Serum Gel) | Left |
| 7 | Versi Revisi | `revision` | Badge 1 Baris: `Rev 0`, `Rev 1 (Approved)`, `Rev 2` | Center |
| 8 | Formulator R&D | `formulatorName` | Nama Apoteker / Formulator | Left |
| 9 | Status Formula | `status` | Badge 1 Baris: `DRAFT`, `LAB_TRIAL`, `ACC_APPROVED`, `PRODUCTION_READY`, `ARCHIVED` | Center |
| 10 | Aksi | `actions` | Tombol: `Lihat Resep`, `Duplikasi / Revisi`, `Cetak Lembar Kerja` | Center |

---

## 3. Secondary Window: Form Input Formula Baru (Floating Modal Lebar)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-5xl`) dengan tab spesifikasi & bahan.
- **Trigger:** Tombol `+ Buat Formula Baru`.

### Pilihan Metode Pembuatan (Dua Jalur):
1. **Opsi A: Buat dari Awal (Inovasi Lab Baru)**
2. **Opsi B: Tarik Otomatis dari Sample Approved (Rekomendasi Utama)**
   - Formulator memilih Nomor Dokumen Sample (`SMP-...`) yang statusnya sudah `ACC_APPROVED` oleh klien.
   - Sistem meng-auto-populate seluruh komposisi bahan dan klaim produk secara instan.

### Field Input Utama:
| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| Kode Formula | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format: `FRM-{YYYYMMDD}-{XXXX}` |
| Versi Revisi | Auto-Increment | Badge / Text | Mandatory | Default: `Rev 1` (Terkunci jika disetujui) |
| Nama Formula | Manual Input | TextInput | Mandatory | Contoh: "Hydrating Brightening Serum 5%" |
| Kategori Produk | Manual Input | Select | Mandatory | Skincare, Haircare, Bodycare, Decorative |
| Target pH | Manual Input | TextInput | Mandatory | Contoh: `5.0 - 5.5` |
| Target Viskositas | Manual Input | TextInput | Mandatory | Contoh: `3.000 - 5.000 cPs` |
| Target Warna & Aroma | Manual Input | TextInput | Opsional | Contoh: "Bening transparan, aroma chamomile" |

### Tabel Bahan Baku (% b/b Matrix):
Formulator menginput baris bahan:
* **Fase:** Dropdown (`Fase A (Water Phase)`, `Fase B (Oil Phase)`, `Fase C (Active Phase)`, `Fase D (Preservative & Fragrance)`).
* **Bahan Baku:** SearchSelect terhubung ke Master Bahan Baku (`RM-...`).
* **Konsentrasi (% b/b):** Angka persentase berat (contoh: Aqua `85.50%`, Niacinamide `5.00%`, Phenoxyethanol `0.80%`).
* **Auto-Validation Total:** **Sistem mewajibkan total akumulasi persentase seluruh bahan tepat $100.00\%$.** Jika tidak 100%, tombol simpan terkunci dan muncul peringatan selisih.
