# Daftar Perubahan ERP (Rapi & Terstruktur — Final)

## 1. Master Data

1. Master Vendor: tambahkan fitur import data vendor via Excel.
2. Master Customer: tambahkan field/card baru untuk **Sample**, **Produksi**, dan **Legalitas**.
3. Kategori pengadaan: kategorisasi dilakukan berdasarkan **COA** (Chart of Accounts) saja.

## 2. Faktur Pembelian

1. Tanggal pembuatan invoice: bisa diubah manual (custom), tidak read-only.
2. Faktur pembelian: tambahkan fitur import data faktur.
3. Detail faktur pembelian: tambahkan rincian barang yang dibeli, dan tambahkan field **diskon**.
4. Faktur pembelian: tambahkan navbar filter dengan pilihan **Semua Tagihan**, **Sudah Dibayar**, **Belum Dibayar**; tambahkan field catatan/notes alasan belum dibayar untuk tagihan yang belum lunas.
5. Sembunyikan (hide) informasi akurasi 3-way match dari tampilan.
6. Terapkan pola tampilan "card ringkasan di atas + navbar/tab filter di bawahnya yang urutannya selaras dengan card tersebut" — **referensi**: halaman Work Orders & Production (4 card status di atas: Total Omset, Sample Approved, Pending Review, Aktif Mixing; lalu tab Semua Work Orders/Mixing & Batch/Filling Line/Packaging Box/History Audit/Analytics di bawahnya, dan tiap tab bisa diklik untuk memfilter tabel). Pola ini diterapkan pada menu Pembayaran, dengan urutan card & tab: **Bayar Pembelian** lalu **DP Pembelian**.

## 3. AP Aging

1. Beri pewarnaan status jatuh tempo: **H-3** = merah, **H-7** = kuning, **lewat jatuh tempo** = bold dan sedikit efek bouncy/animasi.
2. Tambahkan card ringkasan untuk H-3 dan H-7.
3. Tambahkan keterangan **saldo bank** di navbar AP Aging.

## 4. Faktur Penjualan, AR & Pajak Penjualan

1. Faktur penjualan: terapkan seluruh perubahan yang sama seperti Faktur Pembelian (poin 4–9).
2. DP Penjualan: pisahkan navbar menjadi **Sample**, **Legalitas**, **Produksi**.
3. Tetap sediakan perhitungan/laporan **PPh 21** dan **PPh 23**.
4. Pada menu pembayaran penjualan, ganti judul/headline sidebar-nya menjadi **"Report Penjualan"**.
5. AR Aging: harus muncul juga di modul BusDev.

## 5. Kas & Bank

1. Card "Kas Bank Masuk": tampilkan hanya total kas, dengan filter kalender lengkap (bisa pilih rentang tanggal apa pun).
2. Terapkan perubahan yang sama (poin 18) pada "Kas Bank Keluar".

## 6. Rekonsiliasi Bank

1. Tambahkan filter tanggal dengan kalender lengkap.
2. Tambahkan filter berdasarkan COA.

## 7. Pengajuan Dana

1. Sesuaikan alur dengan Google Form yang sudah ada.
2. Tingkatan approval berdasarkan jenjang pengaju:
    - Jika diajukan oleh **Staff** → harus di-approve **Head** terlebih dahulu → lanjut ke **Accounting** → lanjut ke **Direktur**.
    - Jika diajukan oleh **Head** → langsung ke **Accounting** → lanjut ke **Direktur** (tanpa perlu approval Head lain).
3. Samakan proses pengajuan dana dengan proses **persetujuan pembelian** yang sudah ada.

## 8. Jurnal Umum

1. Tambahkan filter periode custom.
2. Samakan tampilan/format Jurnal Umum seperti sistem **ERP lama (G-SERP)**. *(Jika AI CLI butuh referensi visual persis, minta screenshot tampilan G-SERP dari Upii terlebih dahulu.)*
3. Hapus input "Dimensi Finansial".

## 9. Input Field (Berlaku Global)

1. Semua field input: ganti dari mode ketik manual menjadi mode **search/autocomplete**.
2. Semua menu: tambahkan filter periode.

## 10. Aset Tetap

1. Tambahkan riwayat (history) pembelian pada tiap aset.
2. Kode aset: generate otomatis mengikuti format kode standar (lihat bagian "Format Kode Universal" di bawah).
3. Masa manfaat aset ditetapkan sebagai berikut:
    - Inventaris: 4 tahun
    - Motor: 4 tahun
    - Mobil: 8 tahun
    - Bangunan permanen: 20 tahun

## 11. Laporan (Buku Besar & Laba Rugi)

1. Buku Besar & Laba Rugi: tambahkan filter periode.
2. Tambahkan card total Laba Rugi.
3. Tukar posisi tampilan card antara **Total Beban HPP** dan **Laba Operasional Bersih**.
4. Format tabel Laba Rugi: gunakan tabel gabungan seperti di ERP lama (G-SERP), tetapi struktur kolom mengikuti ERP baru.

## 12. Pajak

1. Modul Pajak dan e-Faktur: **tidak perlu dikerjakan** (di-skip dari scope).

---

# 13. Modul Purchase (PO & Gudang)

### Notifikasi & Pencarian

1. Notifikasi mengarah ke daftar item yang **pending**.
2. Tambahkan history: kode barang menunjukkan diambil dari supplier mana.
3. Perluas fitur search agar bisa mencari berdasarkan detail-detail transaksi secara lebih lengkap.
4. Buat Pembelian: tambahkan fitur search detail.

### Deadline & PIC

1. Ganti label "jatuh tempo" menjadi "**deadline**" pada modul purchasing.
2. Sales Order (SO): tambahkan deadline per PIC.
3. Checklist tracking: tambahkan deadline, dan deadline terpisah untuk masing-masing PIC (desain, MoU, dll).
4. Checklist tracking: tambahkan estimasi deadline.

### Diskon, Ongkir & Penerimaan Barang

1. Input PO wajib menyertakan field **diskon** dan **ongkir**. Untuk pembulatan qty per packing, selisih hasil pembulatan dimasukkan ke field diskon.
2. Diskon dihitung dalam **Rupiah** (bukan persen), dikurangi dari ongkir.
3. Fitur pencocokan otomatis selisih nominal antara Invoice dan PO: **dinonaktifkan** (tidak perlu dibangun/diaktifkan).
4. Modul Penerimaan Barang wajib mencantumkan rincian: jumlah **free**, jumlah **cacat/reject**, dan jumlah kondisi **bagus** (lihat juga poin 55 dan 65).

### Supplier & Kondisi Barang

1. Filter supplier berdasarkan jenis bahan: **bahan baku**, **primer**, **sekunder**, **pembantu**.
2. History barang: tampilkan sudah berapa lama barang tersebut ada, kondisinya, dll.
3. Setiap bahan: catat wujud fisik dan kondisinya.
4. Data gudang per jenis bahan: tampilkan jumlah kondisi **bagus** dan jumlah kondisi **reject**.
5. Pembayaran ke supplier hanya dilakukan untuk barang dengan kondisi bagus (barang reject tidak dibayar).
6. Hapus kolom "kondisi bagus" dan "kondisi cacat" pada barang; ganti dengan kolom **Real Stok**.
7. Input barang gratis (free) dicatat pada bagian penerimaan barang di gudang.

### Checklist Progress & Status

1. Checklist progress: 1 SO hanya punya 1 checklist utama, namun saat dibuka detailnya berisi banyak kategori (bukan checklist terpisah per baris kategori seperti box, label, dll).
2. Checklist progress: sediakan versi **keseluruhan** dan versi khusus **kebutuhan PIC** saja.
3. Checklist tracking: kategori (misal box, label, dll) baru dianggap selesai dan pindah status setelah **semua** kategori dalam SO tersebut selesai — bukan begitu satu kategori selesai langsung pindah.
4. Urutan baris tabel pada detail checklist harus mengikuti urutan kronologis proses.
5. Setiap perubahan status (termasuk status pending) harus tercatat: tanggal perubahan, dan catatan wajib jika berstatus pending.
6. Status yang sudah "done" dapat dikembalikan ke proses berjalan jika ditemukan kendala.
7. Approval status berikutnya (misal "sudah diterima" atau "belum") tidak boleh sama dengan status "done" sebelumnya, untuk mencegah manipulasi data yang menyulitkan perhitungan KPI (contoh: status packing tidak bisa "selesai" jika kemasan belum tersedia).

### BPOM

1. BPOM: tambahkan field nomor BPOM untuk keperluan pengecekan ulang (recheck) apakah sudah benar atau belum.
2. BPOM: tambahkan history status dan progress, termasuk keterangan penyebab jika prosesnya memakan waktu lama.

### PO & Approval

1. History PO: harus jelas menampilkan status — sudah dibayar, sudah diterima, dll.
2. Penanggung jawab PO dan approval-nya: gunakan tanda tangan digital pada dokumen PO.
3. Sediakan mekanisme untuk mengatasi konflik input data antar user.
4. Buat SOP terkait ketentuan range harga.
5. Tanggal input PO: read-only, otomatis terisi tanggal hari ini, berlaku di seluruh input.
6. Pengambilan/pemakaian barang harus bersumber dari salah satu: PO pembelian atau stok barang gudang.
7. Kebutuhan HPP (Harga Pokok Penjualan): datanya diambil/terhubung melalui modul Purchase.
8. Hapus kolom/data yang tidak diperlukan pada tampilan (kolom yang selama ini banyak tapi tidak terpakai).

### Report & Format Kode

1. Buat modul baru **Report Penerimaan Barang**, formatnya mirip modul Pembelian, ditambah kolom: jumlah barang diterima, jumlah reject, jumlah bagus, jumlah barang gratis (free).
2. Format nomor kuitansi dan invoice: samakan dengan format nomor di sistem ERP lama (G-SERP).

**Format Kode Universal** — berlaku untuk semua kode otomatis di sistem (kode barang, kode aset, kode SO, kode invoice, dll), tersedia dalam **2 versi** yang bisa dipilih/diganti:

- **Versi lengkap**: `kode-perusahaan-divisi-produk-tanggal-nomor-urut`
Contoh: `DL-FIN-SO-29062026-0001`
- **Versi ringkas**: `produk-tanggal-nomor-urut` (tanpa kode perusahaan & divisi)
Contoh: `SO-29062026-0001`
1. Nomor urut pada kode (bagian paling akhir) bersifat **global dan berkelanjutan** — dimulai dari `0001` dan terus bertambah (`0002`, `0003`, dst.) mengikuti seluruh riwayat produk dari awal sampai saat ini, tidak reset per kategori/periode.

### Notifikasi Design & Milestone

1. Checklist progress: sesuaikan sistem notifikasi berdasarkan jumlah item pending, dibedakan navbar untuk **Input Design** dan **Main**.
2. Input design (PIC: Mas Edi) harus tertelusur lewat checklist progress; tambahkan kolom jenis SO (kategori).
3. Kolom milestone: tambahkan field estimasi.
4. Kolom milestone: field status tidak read-only — bisa diganti; setiap perubahan status wajib mengganti estimasi juga; jika status diubah ke pending wajib diisi catatan.

---

# 14. Modul Design

1. Dokumen BPOM juga ditampilkan di checklist progress, agar terlihat status BPOM sudah keluar atau belum per SO.
2. Buat communication protocol khusus untuk tim Design.
3. Modul Design terhubung dengan modul QC, Purchase, dan BusDev.
4. Master Design: mendukung fitur revisi.
5. Kolom BPOM: datanya masuk ke bagian dokumen.
6. Approval cukup dilakukan oleh BusDev dan Purchase.
7. Tambahkan field: batch, expired date, dan file lampiran.
8. Checklist tracking: tampilkan foto kemasan.

---

# 15. Modul BusDev

1. Data history: card tetap muncul meskipun user berpindah filter bulan.
2. Buku Tamu: tambahkan filter bulan dan search berdasarkan nama.
3. Tambahkan auto-save saat user keluar dari form input.

---

*Catatan: seluruh poin sudah final berdasarkan klarifikasi Upii — tidak ada lagi item ambigu, kecuali referensi visual format G-SERP (poin 26, 75) yang perlu screenshot tambahan saat implementasi jika AI CLI membutuhkan detail persis.*