

# FASE 1: MASTER DATA (FONDASI)
*Dokumen Spesifikasi Input UI - Modul Master*

## 1. Form Kategori (Barang / Supplier / Pelanggan)
*Catatan UI: Karena struktur form kategori untuk Barang, Supplier, dan Pelanggan di ERP lama identik, kita jadikan satu komponen form yang bisa di-reuse.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Nama Kategori | Teks | Wajib | Misal: Kemasan Primer (Barang), B2B (Pelanggan) |
| Keterangan | Teks (Area) | Opsional | Deskripsi singkat mengenai kategori tersebut |

---

## 2. Form Kelola Gudang
*Fungsi: Mendaftarkan lokasi fisik penyimpanan material dan barang jadi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Nama Gudang | Teks | Wajib | Misal: Gudang Bahan Baku A |
| Penanggung Jawab | Teks | Opsional | Nama Kepala Gudang / PIC |
| Keterangan | Teks (Area) | Opsional | Detail lokasi atau peruntukan |
| Status | Dropdown | Wajib | Pilihan: `Aktif`, `Tidak Aktif` |

---

## 3. Form Master Chart of Accounts (CoA)
*Fungsi: Mendaftarkan akun untuk pembukuan akuntansi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tipe Akun | Dropdown | Wajib | Harta, Hutang, Modal, Pendapatan, Biaya |
| Kode Akun | Teks | Wajib, Unik | Misal: `1-10001` (Sesuai format akuntansi) |
| Nama Akun | Teks | Wajib | Misal: `Kas Besar` |
| Saldo Normal | Dropdown | Wajib | Pilihan: `Debit`, `Kredit` |

---

## 4. Form Master Barang (Material & Produk)
*Fungsi: Jantung SCM. Setiap barang wajib diikat ke satuan dan batas stok terbawah.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Kategori Barang | Dropdown (Search) | Wajib | Mengambil dari Master Kategori Barang |
| Kode Barang | Teks | Wajib, Unik | Sering kali *auto-generated* atau *scan barcode* |
| Nama Barang | Teks | Wajib | Penamaan material/produk secara spesifik |
| Satuan Dasar | Dropdown | Wajib | Pilihan: `Pcs`, `Kg`, `Gram`, `Liter`, `Botol` |
| Minimal Stok | Angka | Wajib | Batas bawah (Trigger *Purchase Request*) |
| Harga Beli / HPP | Angka (Rp) | Wajib | Harga standar untuk estimasi SCM |
| Akun Persediaan | Dropdown (Search) | Opsional/Auto | Diambil dari Master CoA (*Bisa otomatis via Kategori*) |
| Akun Penjualan | Dropdown (Search) | Opsional/Auto | Diambil dari Master CoA (*Bisa otomatis via Kategori*) |

---

## 5. Form Master Supplier
*Fungsi: Pangkalan data vendor pemasok bahan baku/kemasan.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Kategori Supplier | Dropdown | Wajib | Mengambil dari Master Kategori Supplier |
| Nama Supplier | Teks | Wajib | Nama PT / CV / Perorangan |
| Kontak Person | Teks | Wajib | Nama perwakilan vendor |
| No. Telepon / WA | Teks (Angka) | Wajib | Format nomor telepon aktif |
| Email | Teks (Email) | Opsional | Validasi format email standard (@) |
| Alamat Lengkap | Teks (Area) | Wajib | Digunakan untuk tujuan Retur / Tagihan |
| Term of Payment | Angka | Wajib | Jumlah hari jatuh tempo tagihan (Misal: `30` hari) |

---

## 6. Form Master Pelanggan
*Fungsi: Pangkalan data klien maklon. Terintegrasi dengan hierarki wilayah.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Kategori Pelanggan| Dropdown | Wajib | Mengambil dari Master Kategori Pelanggan |
| Nama Klien | Teks | Wajib | Nama PT / CV / Perorangan |
| Instansi/Brand | Teks | Opsional | Nama Merek Dagang klien |
| No. Telepon / WA | Teks (Angka) | Wajib | Format nomor telepon aktif |
| Email | Teks (Email) | Opsional | Validasi format email standard |
| Provinsi | Dropdown (Search) | Wajib | *Cascading* (Otomatis membuka pilihan Kota) |
| Kota/Kabupaten | Dropdown (Search) | Wajib | *Cascading* (Otomatis membuka pilihan Kecamatan) |
| Kecamatan | Dropdown (Search) | Wajib | Membantu kalkulasi logistik / pengiriman |
| Alamat Detail | Teks (Area) | Wajib | Jalan, RT/RW, Patokan gedung |
| Sales Assignee | Dropdown | Wajib | Siapa Bussdev/Sales yang memegang klien ini |

---

## 7. Form Target Penjualan
*Fungsi: KPI Setter untuk Divisi Komersial (Menyuplai data ke Dashboard).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Periode Bulan | Dropdown | Wajib | Pilihan: Januari - Desember |
| Periode Tahun | Angka | Wajib | Misal: 2026 |
| Nama Sales | Dropdown (Search) | Wajib | Mengambil dari Master User/Pegawai |
| Target Nominal | Angka (Rp) | Wajib | Jumlah target pendapatan (*Revenue*) dalam Rupiah |

