
# FASE 5: FINANCE & UTILITY (AKUNTANSI & UMUM)
*Dokumen Spesifikasi Input UI - Modul Keuangan & Operasional Kantor*

## 1. Form Jurnal Umum (General Journal)
*Fungsi: Pencatatan akuntansi manual untuk transaksi yang tidak diakomodasi oleh modul otomatis (seperti penyusutan aset atau penyesuaian akhir bulan).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Waktu pencatatan buku besar |
| No. Bukti / Referensi | Teks | Opsional | Nomor memo internal atau dokumen fisik |
| Keterangan Umum | Teks (Area) | Wajib | Deskripsi tujuan jurnal dibuat |
| **Tabel Transaksi** | **Grid/Table** | **Wajib** | **Input baris akun (Dynamic Rows)** |
| -- Pilih Akun (CoA) | Dropdown (Search) | Wajib | Diambil dari Master Chart of Accounts |
| -- Debit | Angka (Rp) | Opsional* | Nominal uang masuk/bertambah (*isi salah satu) |
| -- Kredit | Angka (Rp) | Opsional* | Nominal uang keluar/berkurang (*isi salah satu) |
| -- Keterangan Baris | Teks | Opsional | Catatan spesifik per baris akun |
| **Total Debit** | Angka (Readonly) | Otomatis | Sum dari kolom Debit |
| **Total Kredit** | Angka (Readonly) | Otomatis | Sum dari kolom Kredit (**Wajib sama dengan Debit**) |

---

## 2. Form Kas & Bank Masuk (Cash Receipt)
*Fungsi: Mencatat uang masuk di luar jalur DP/Pelunasan SO otomatis (misal: suntikan modal, pencairan bunga bank, atau penjualan aset).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Waktu dana diterima |
| Terima Dari | Teks | Wajib | Nama individu / instansi pengirim |
| Simpan Ke Akun | Dropdown (Search) | Wajib | Pilih rekening tujuan (Hanya tampil CoA Kas & Bank) |
| Keterangan | Teks (Area) | Opsional | Catatan penerimaan |
| **Tabel Alokasi** | **Grid/Table** | **Wajib** | **Input baris akun (Dynamic Rows)** |
| -- Akun Pendapatan/Asal| Dropdown (Search) | Wajib | Pilih sumber dana (misal: Pendapatan Bunga) |
| -- Nominal | Angka (Rp) | Wajib | Jumlah uang yang masuk |

---

## 3. Form Kas & Bank Keluar (Cash Disbursement)
*Fungsi: Pembayaran operasional di luar jalur SCM otomatis (misal: bayar listrik, gaji karyawan, beli token).*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal | Date | Wajib | Waktu dana dikeluarkan |
| Bayar Kepada | Teks | Wajib | Nama vendor / karyawan penerima |
| Ambil Dari Akun | Dropdown (Search) | Wajib | Pilih rekening sumber (Hanya tampil CoA Kas & Bank) |
| Keterangan | Teks (Area) | Opsional | Catatan pengeluaran |
| **Tabel Alokasi** | **Grid/Table** | **Wajib** | **Input baris akun (Dynamic Rows)** |
| -- Akun Biaya/Tujuan | Dropdown (Search) | Wajib | Pilih pos pengeluaran (misal: Biaya Listrik, Biaya Gaji) |
| -- Nominal | Angka (Rp) | Wajib | Jumlah uang yang dibayarkan |

---

## 4. Form Checklist (SOP & Inspeksi)
*Fungsi: Alat kontrol mutu untuk kebersihan mesin, kesiapan area, atau prosedur HR.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Inspeksi | Date | Wajib | Waktu pelaksanaan |
| Kategori Checklist | Dropdown | Wajib | Diambil dari Master Kategori Checklist |
| Nama Form Checklist | Teks | Wajib | Judul inspeksi (misal: Kebersihan Ruang Mixing) |
| Penanggung Jawab | Dropdown (Search) | Wajib | Nama PIC / Pegawai |
| **Tabel Poin Cek** | **Grid/Table** | **Wajib** | **Input baris inspeksi (Dynamic Rows)** |
| -- Parameter / Tugas | Teks | Wajib | Hal yang harus dicek (misal: "Lantai disapu") |
| -- Status | Dropdown | Wajib | Pilihan: `Selesai`, `Belum`, `Tidak Relevan` |
| -- Catatan | Teks | Opsional | Temuan lapangan |

---

## 5. Form Buku Tamu (Guest Book)
*Fungsi: Mencatat log keamanan fisik siapa saja entitas eksternal yang masuk ke area pabrik.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal & Waktu | Date/Time | Wajib | Otomatis terisi waktu saat ini, bisa diedit |
| Nama Tamu | Teks | Wajib | Nama individu |
| Asal Instansi | Teks | Opsional | Nama perusahaan/institusi tamu |
| No. Telepon | Teks (Angka) | Wajib | Kontak aktif |
| Tujuan / Keperluan | Teks (Area) | Wajib | Alasan kunjungan (misal: Audit BPOM, Meeting R&D) |
| Bertemu Dengan | Dropdown (Search) | Wajib | Pilih nama karyawan internal yang dituju |

---

