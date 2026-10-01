# [SCR-002] Master Vendor & Supplier (Vendor Master Data)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/suppliers`
- **Legacy GsERP URL:** `/supplier-manage`
- **Menu Sidebar:** `1. MASTER DATA > Supplier & Vendor`
- **Hak Akses (RBAC):** `PURCHASING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Master data seluruh rekanan pemasok bahan baku kimia kosmetik, bahan kemas, kemasan karton, dan jasa maklon eksternal.

---

## 2. Fitur Khusus: Import Excel Vendor (REQUIREMENT Poin 1)
Tersedia tombol **"Import Excel Vendor"** di samping tombol tambah:
* Download template file Excel resmi (`.xlsx`).
* Parsing validasi data massal (Nama Vendor, Kontak, TOP, No Rekening Bank, NPWP).
* Pencegahan duplikasi data otomatis sebelum disimpan ke database.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Terdaftar`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Terdaftar | `createdAt` | `DD/MM/YYYY` | Left |
| 3 | Kode Vendor | `supplierCode` | `SUPP-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Nama Vendor / PT | `name` | Nama Supplier (Bold) | Left |
| 5 | Kategori Bahan | `materialCategory` | Badge 1 Baris: `BAHAN_BAKU`, `BAHAN_KEMAS_PRIMER`, `SEKUNDER`, `PERLENGKAPAN` | Center |
| 6 | Kontak / Telp | `phone` | Nomor Telepon / WA Sales Vendor | Left |
| 7 | Rekening Bank | `bankDetails` | Bank BCA / Mandiri • No Rekening • A/N | Left |
| 8 | Syarat Bayar (TOP) | `paymentTerms` | Angka Hari (misal: `Net 30 Hari`, `COD`, `DP 50%`) | Center |
| 9 | Status Vendor | `status` | Badge 1 Baris: `AKTIF`, `EVALUASI_QC`, `BLACKLIST` | Center |
| 10 | Aksi | `actions` | Tombol: `Lihat Detail`, `Edit Data`, `Katalog Bahan` | Center |

---

## 4. Secondary Window: Form Input Vendor Baru (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Tambah Supplier`.
- **Field:** Nama Vendor, Kategori Bahan Pemasok, Alamat Gudang/Kantor Vendor, Nama Sales PIC & No WA, Email Tagihan Invoice, Nomor Rekening Pembayaran (Bank, Cabang, No Rek, Nama Pemilik), NPWP, TOP Hari.
