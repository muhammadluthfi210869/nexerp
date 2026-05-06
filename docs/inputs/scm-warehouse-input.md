

# FASE 2: SCM & WAREHOUSE (LOGISTIK INTERNAL)
*Dokumen Spesifikasi Input UI - Modul Operasional Logistik*

## 1. Form Kebutuhan Barang (Material Requirement)
*Fungsi: Digunakan oleh staf gudang/produksi untuk mencatat daftar barang yang stoknya sudah kritis.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Default: Hari ini |
| Lokasi Gudang | Dropdown | Wajib | Gudang yang membutuhkan barang |
| Keterangan | Teks (Area) | Opsional | Alasan kebutuhan (misal: Persiapan Batch X) |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Filter berdasarkan Master Barang |
| -- Qty Dibutuhkan | Angka | Wajib | Jumlah fisik yang diminta |

---

## 2. Form Permintaan Pembelian (Purchase Request)
*Fungsi: Dokumen internal untuk meminta divisi SCM membelikan barang ke Supplier.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Default: Hari ini |
| Gudang Tujuan | Dropdown | Wajib | Barang akan dikirim ke gudang mana |
| Prioritas | Dropdown | Wajib | Rendah, Sedang, Mendesak |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Filter berdasarkan Master Barang |
| -- Qty | Angka | Wajib | Jumlah yang harus dibeli |
| -- Harga Estimasi | Angka (Rp) | Opsional | Referensi harga dari Master Barang |

---

## 3. Form Buat Pembelian (Purchase Order)
*Fungsi: Dokumen legal eksternal yang dikirimkan ke Supplier.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Tanggal resmi pemesanan |
| Pilih Supplier | Dropdown (Search) | Wajib | Filter berdasarkan Master Supplier |
| Gudang Penerima | Dropdown | Wajib | Lokasi truk supplier akan bongkar muat |
| Jatuh Tempo | Angka (Hari) | Wajib | Diambil otomatis dari *Term of Payment* Supplier |
| Keterangan | Teks (Area) | Opsional | Instruksi pengiriman (misal: packing kayu) |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Mengambil data barang |
| -- Harga Satuan | Angka (Rp) | Wajib | Harga kesepakatan dengan supplier |
| -- Qty | Angka | Wajib | Jumlah yang dipesan |
| -- Jenis Pajak | Dropdown | Wajib | PPN (11%), Non-PPN |
| -- Subtotal | Angka (Readonly) | Otomatis | (Qty * Harga) + Pajak |

---

## 4. Form Stok Opname (Audit Fisik)
*Fungsi: Sinkronisasi data sistem dengan stok nyata di gudang.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Audit | Date | Wajib | Kunci stok pada tanggal tersebut |
| Gudang | Dropdown | Wajib | Lokasi yang diaudit |
| PIC Audit | Dropdown | Wajib | Pegawai yang bertanggung jawab |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Mengambil data barang |
| -- Stok Sistem | Angka (Readonly) | Otomatis | Stok yang tercatat di database saat ini |
| -- Stok Fisik | Angka | Wajib | Jumlah barang yang dihitung manual |
| -- Selisih | Angka (Readonly) | Otomatis | Fisik - Sistem |

---

## 5. Form Penyesuaian Stok (Stock Adjustment)
*Fungsi: Mengoreksi stok di luar jalur pembelian/penjualan (misal: barang rusak atau bonus).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Tanggal koreksi |
| Gudang | Dropdown | Wajib | Lokasi barang |
| Jenis Penyesuaian | Dropdown | Wajib | `Masuk` (Penambahan) / `Keluar` (Pengurangan) |
| Akun Penyesuaian | Dropdown (Search) | Wajib | Mengambil CoA (misal: Biaya Barang Rusak) |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Mengambil data barang |
| -- Qty | Angka | Wajib | Jumlah yang disesuaikan |

---

## 6. Form Transfer Barang (Antar Gudang)
*Fungsi: Perpindahan stok internal antar lokasi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Tanggal mutasi |
| Gudang Asal | Dropdown | Wajib | Stok akan berkurang di sini |
| Gudang Tujuan | Dropdown | Wajib | Stok akan bertambah di sini |
| No. Kendaraan | Teks | Opsional | Jika menggunakan kurir internal/truk |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Dropdown (Search) | Wajib | Mengambil data barang |
| -- Qty Transfer | Angka | Wajib | Pastikan tidak melebihi stok di Gudang Asal |

---

## 7. Form Pengiriman Barang (Delivery Order)
*Fungsi: Dokumen fisik untuk melepaskan barang ke ekspedisi/pelanggan.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Kirim | Date | Wajib | Default: Hari ini |
| No. Penjualan (SO) | Dropdown (Search) | Wajib | Menarik data barang dari pesanan pelanggan |
| Nama Pelanggan | Teks (Readonly) | Otomatis | Diambil dari data SO |
| Alamat Kirim | Teks (Area) | Otomatis | Diambil dari data SO (Bisa diedit manual) |
| Ekspedisi | Teks | Wajib | Misal: JNE, Cargo internal, J&T |
| No. Resi | Teks | Opsional | Bukti pelacakan |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Barang | Teks (Readonly) | Otomatis | Barang yang dipesan di SO |
| -- Qty Order | Angka (Readonly) | Otomatis | Jumlah pesanan asli |
| -- Qty Kirim | Angka | Wajib | Jumlah yang dimasukkan ke paket |

---
