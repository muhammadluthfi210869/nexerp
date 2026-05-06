# FASE 4: COMMERCIAL (SALES)
*Dokumen Spesifikasi Input UI - Modul Penjualan & Akuisisi*

## 1. Form Penjualan Sample (Pre-Sales)
*Fungsi: Mencatat permintaan sampel (R&D) dari klien sebelum kontrak produksi massal (SO) dibuat.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Default: Hari ini |
| Nama Pelanggan | Dropdown (Search) | Wajib | Diambil dari Master Pelanggan |
| Kategori Penjualan | Dropdown | Wajib | Misal: B2B, B2C, Maklon Full |
| Keterangan | Teks (Area) | Opsional | Catatan khusus ke tim R&D |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Nama Sample/Formula | Teks / Dropdown | Wajib | Nama kandidat produk |
| -- Qty | Angka | Wajib | Jumlah sampel yang diminta |
| -- Harga | Angka (Rp) | Wajib | Bisa diisi 0 jika sampel gratis |

---

## 2. Form Penjualan (Sales Order / SO Utama)
*Fungsi: Kontrak pemesanan resmi dari klien. Menjadi jangkar data untuk Produksi dan Penagihan.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Transaksi | Date | Wajib | Tanggal SO diterbitkan |
| Tanggal Jatuh Tempo | Date | Wajib | Batas akhir pelunasan |
| Nama Pelanggan | Dropdown (Search) | Wajib | Diambil dari Master Pelanggan |
| Kategori Penjualan | Dropdown | Wajib | Misal: Ekspor, Lokal, Private Label |
| Merek / Brand | Teks | Wajib | Nama merek dagang yang akan dicetak |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Referensi Sample | Dropdown (Search) | Opsional | Menarik data dari form Penjualan Sample (jika ada) |
| -- Formula Terpilih | Dropdown (Search) | Wajib | Kode formula R&D yang sudah disetujui |
| -- Nama Barang Jadi | Teks | Wajib | Nama spesifik untuk dicetak di *Invoice* |
| -- Netto | Angka | Wajib | Berat bersih (Gram/ML) per kemasan |
| -- Qty | Angka | Wajib | Jumlah pesanan (Minimum Order Quantity) |
| -- Harga Satuan | Angka (Rp) | Wajib | Harga per *piece* (pcs) hasil negosiasi |
| -- Pajak | Dropdown | Wajib | PPN (11%) / Non-PPN |
| -- Subtotal | Angka (Readonly) | Otomatis | (Qty * Harga) + Pajak |

---

## 3. Form DP Penjualan (Uang Muka)
*Fungsi: Bukti komitmen finansial. Ini adalah **Absolute Trigger** untuk membebaskan SO agar bisa diproduksi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Pembayaran | Date | Wajib | Tanggal uang masuk ke rekening |
| No. Penjualan (SO) | Dropdown (Search) | Wajib | **Hanya menampilkan SO yang belum lunas/DP** |
| Nama Pelanggan | Teks (Readonly) | Otomatis | Ditarik dari SO yang dipilih |
| Total Tagihan | Angka (Readonly) | Otomatis | Nilai Grand Total dari SO |
| Akun Penerimaan (CoA) | Dropdown (Search) | Wajib | Rekening tujuan (misal: Bank BCA, Kas Besar) |
| Nominal Uang Muka (DP) | Angka (Rp) | Wajib | Jumlah dana yang ditransfer klien |
| Bukti Transfer | File Upload | Opsional | PDF / Gambar struk |

---

## 4. Form Retur Penjualan
*Fungsi: Logistik balik (*reverse logistics*) jika barang yang dikirim ke pelanggan cacat atau ditolak.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Retur | Date | Wajib | Waktu barang kembali ke pabrik |
| No. Penjualan (SO) | Dropdown (Search) | Wajib | SO referensi yang bermasalah |
| Nama Pelanggan | Teks (Readonly) | Otomatis | Ditarik dari SO |
| Gudang Tujuan | Dropdown | Wajib | Tujuan barang retur (misal: Gudang Karantina/Reject) |
| Keterangan | Teks (Area) | Wajib | Alasan detail pengembalian |
| **Tabel Items** | **Grid/Table** | **Wajib** | **Input baris barang (Dynamic Rows)** |
| -- Barang Diretur | Dropdown | Wajib | Hanya menampilkan barang yang ada di SO tersebut |
| -- Qty Beli | Angka (Readonly) | Otomatis | Jumlah asli yang dibeli klien |
| -- Qty Retur | Angka | Wajib | Jumlah yang dikembalikan (Tidak boleh > Qty Beli) |
| -- Status Retur | Dropdown | Wajib | `Potong Tagihan` (Uang kembali) atau `Tukar Barang` |

---

