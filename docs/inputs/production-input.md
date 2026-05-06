# FASE 3: PRODUKSI (MANUFACTURING)
*Dokumen Spesifikasi Input UI - Modul Transformasi Fisik*

## 1. Form Permintaan HPP (Harga Pokok Penjualan)
*Fungsi: Menghitung estimasi biaya produksi dari formula R&D sebelum diajukan ke klien.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Tanggal perhitungan |
| Nama Formula / Produk | Dropdown (Search) | Wajib | Target produk yang akan diproduksi |
| Target Qty (Yield) | Angka | Wajib | Rencana produksi (misal: 1000 kg / 5000 pcs) |
| Keterangan | Teks (Area) | Opsional | Catatan tambahan |
| **Tabel Items (BOM)** | **Grid/Table** | **Wajib** | **Daftar Komposisi (Dynamic Rows)** |
| -- Nama Bahan | Dropdown (Search) | Wajib | Memilih material dari Master Barang |
| -- Qty (Persentase/Gram) | Angka | Wajib | Kebutuhan material per 1 unit/batch |
| -- Harga Satuan | Angka (Readonly) | Otomatis | Ditarik otomatis dari Master Barang |
| -- Subtotal Biaya | Angka (Readonly) | Otomatis | Qty * Harga Satuan |

---

## 2. Form Batch Record (Perintah Produksi Utama)
*Fungsi: Entitas induk (master ticket) untuk dimulainya proses di lantai pabrik.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Penjualan (SO) | Dropdown (Search) | Wajib | Hanya menampilkan SO yang sudah DP / Lunas |
| Tanggal Produksi | Date | Wajib | Jadwal eksekusi di pabrik |
| Nomor Batch | Teks | Wajib, Unik | Nomor pelacakan identitas produk |
| Pilih Formula/Produk | Dropdown (Search) | Wajib | Diambil dari rincian SO yang dipilih |
| Target Output | Angka | Wajib | Jumlah target barang jadi |
| Keterangan | Teks (Area) | Opsional | Instruksi khusus operator |
| **Tabel Material** | **Grid/Table** | **Wajib** | **Lock otomatis (Readonly) dari BOM** |
| -- Material | Teks (Readonly) | Otomatis | Daftar bahan baku & kemasan |
| -- Qty Dibutuhkan | Angka (Readonly) | Otomatis | Hasil kalkulasi BOM * Target Output |

---

## 3. Form Jadwal Mixing (Pembuatan Ruahan)
*Fungsi: Mencatat proses pencampuran bahan baku (Raw Material) menjadi Ruahan (Bulk).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Mixing | Date | Wajib | Waktu eksekusi aktual |
| No. Batch Record | Dropdown (Search) | Wajib | Referensi ke dokumen Batch Record |
| Operator/PIC | Dropdown | Wajib | Penanggung jawab mesin |
| Mesin Mixing | Dropdown | Wajib | Pilihan mesin yang digunakan (Kapasitas) |
| Jam Mulai | Waktu (Time) | Wajib | Untuk menghitung lama proses (OEE) |
| Jam Selesai | Waktu (Time) | Wajib | Untuk menghitung lama proses (OEE) |
| **Hasil Mixing (Kg/Liter)** | Angka | Wajib | *Output* aktual ruahan (untuk cek penyusutan) |
| Status QC Ruahan | Dropdown | Wajib | `Pass`, `Reject`, `Hold` |

---

## 4. Form Jadwal Filling (Pengisian)
*Fungsi: Mencatat proses penuangan Ruahan ke dalam Kemasan Primer (Botol/Pot).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Filling | Date | Wajib | Waktu eksekusi aktual |
| No. Batch Record | Dropdown (Search) | Wajib | Referensi ke dokumen Batch Record |
| Operator/PIC | Dropdown | Wajib | Penanggung jawab mesin |
| Mesin Filling | Dropdown | Wajib | Pilihan mesin yang digunakan |
| Jam Mulai | Waktu (Time) | Wajib | Pencatatan waktu mulai |
| Jam Selesai | Waktu (Time) | Wajib | Pencatatan waktu selesai |
| **Qty Hasil Baik (Good)** | Angka | Wajib | Jumlah botol/pot yang berhasil diisi |
| **Qty Reject (Gagal)** | Angka | Wajib | Jumlah botol/pot yang tumpah/rusak |

---

## 5. Form Jadwal Packaging (Pengemasan Akhir)
*Fungsi: Memasukkan kemasan primer ke dalam kemasan sekunder (Kardus/Box) dan pelabelan.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Packaging | Date | Wajib | Waktu eksekusi aktual |
| No. Batch Record | Dropdown (Search) | Wajib | Referensi ke dokumen Batch Record |
| Operator/PIC | Dropdown | Wajib | Penanggung jawab jalur pengemasan |
| Jam Mulai | Waktu (Time) | Wajib | Pencatatan waktu mulai |
| Jam Selesai | Waktu (Time) | Wajib | Pencatatan waktu selesai |
| **Qty Finish Good** | Angka | Wajib | Hasil akhir yang siap masuk gudang barang jadi |
| **Qty Reject** | Angka | Wajib | Kemasan penyok/label miring |
