# 00 — GLOBAL PAGE SPECIFICATION & ARCHITECTURAL STANDARD
**NEX ERP Enterprise Authority Document**

> **Tujuan:** Dokumen ini adalah acuan mutlak (Single Source of Truth) untuk seluruh antarmuka, tata letak data, format cetak, interaksi modal, penanganan kesalahan, dan sesi otentikasi di seluruh modul NEX ERP.
> **Kewenangan:** Setiap developer, QA, dan AI Agent WAJIB mematuhi dokumen ini sebelum membuat atau memodifikasi file kode di frontend maupun backend.

---

## 1. Aturan Global Kolom Tabel (Universal Table Grid Rule)

Di seluruh halaman daftar/overview (Master Data, Penjualan, Pembelian, Gudang, Produksi, HRD, dan Keuangan):

1. **Kolom 1 Wajib:** `#` (Nomor Urut, Checkbox Seleksi Batch, atau Nomor Baris).
   - Tipe: Text / Number / Checkbox.
   - Alignment: `Center`.
   - Width: Ramping (`w-12` sampai `w-14`).
2. **Kolom 2 Wajib:** `Tanggal` (Tanggal Transaksi, Tanggal Pembuatan, Tanggal Masuk, atau Tanggal Dokumen).
   - Format: `DD/MM/YYYY` (atau `DD/MM/YYYY HH:mm` untuk audit log).
   - Alignment: `Left`.
   - Width: Proporsional (`w-28` sampai `w-32`).
3. **Format Baris & Font Tabel:**
   - **TIDAK ADA DATA TERTUMPUK:** Dilarang menaruh 2 metrik data berlainan arti dalam 1 sel (contoh: jangan tumpuk stok fisik dan stok reserved dalam 1 sel hingga bikin pusing). 1 Kolom = 1 Metrik Spesifik.
   - Ukuran font data cell: Standar Inter `text-xs (12px)`, warna `text-slate-700` atau `text-slate-900`.
   - Padding cell: Vertikal seragam `py-2.5 px-3.5`.
   - Header table: Uppercase `text-[11px] font-bold text-slate-500 tracking-wider bg-slate-50/80 border-b border-slate-200`.

---

## 2. Standar Status Badge (1 Baris Dinamis)

Seluruh status dokumen dan tahapan alur kerja wajib menggunakan **1 Baris Dinamis** (`whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border`):
* **DILARANG:** Status badge terlipat menjadi 2 baris teks.
* **Palet Warna Semantik Baku (Zero Rainbow UI):**
  * `DRAFT` / `INACTIVE` / `PLANNED` $\rightarrow$ **Neutral (Slate/Gray):** `bg-slate-100 text-slate-700 border-slate-200`.
  * `PENDING` / `WAITING` / `PROSES` / `IN_PROGRESS` $\rightarrow$ **Warning (Amber/Orange):** `bg-amber-50 text-amber-700 border-amber-200`.
  * `APPROVED` / `SELESAI` / `COMPLETED` / `RELEASED` / `PAID` $\rightarrow$ **Success (Emerald/Green):** `bg-emerald-50 text-emerald-700 border-emerald-200`.
  * `REJECTED` / `BATAL` / `CANCELLED` / `FAILED` / `OVERDUE` $\rightarrow$ **Critical (Rose/Red):** `bg-rose-50 text-rose-700 border-rose-200`.
  * `VERIFIED` / `INFO` / `SUBMITTED` $\rightarrow$ **Info (Blue/Sky):** `bg-blue-50 text-blue-700 border-blue-200`.

---

## 3. Standar Modal Input & Window Detail (Hapus Side Drawer Sempit)

1. **Form Input Dokumen Baru (Create / Input):**
   - Wajib menggunakan **Centered Floating Modal** (`max-w-3xl`, `max-w-4xl`, atau `max-w-5xl` tergantung kompleksitas form) dengan *backdrop overlay* gelap transparan (`bg-slate-900/40 backdrop-blur-xs`).
   - Bagian header modal berisi Judul Jelas, Subtitle instruksi singkat, dan Tombol Close `✕` di kanan atas.
   - Footer modal selalu menempel di bawah (*sticky footer*) dengan 2 tombol: `Batal` (Secondary) dan `Simpan / Submit` (Primary).
2. **Aksi Lihat / Detail Dokumen:**
   - **TIDAK MENGGUNAKAN SIDE DRAWER** yang sempit untuk dokumen transaksi.
   - Quick Preview: Menggunakan **Floating Modal Ringkas** (`max-w-4xl`).
   - Detail Kompleks / Workbench: Menggunakan **Dedicated Full-Page Window** (URL langsung, contoh: `/pembelian/scm-pembelian/[id]`).

---

## 4. Standar Universal Print Engine (Ctrl + P & Tombol Cetak)

Akar masalah cetak rusak (navbar ikut tercetak, margin terpotong) diselesaikan secara universal:
1. **Penyembunyian Shell Total saat Cetak:**
   - Semua elemen dashboard: `<aside>` (Sidebar), Top Navigation Bar, Header non-print, Button, Toast, Modal backdrop **wajib disembunyikan 100%** via `@media print`.
   - Layout `<main>` saat cetak wajib: `margin-left: 0 !important; width: 100% !important; overflow: visible !important;`.
2. **Komponen Cetak Resmi (`.dna-print-document`):**
   - Format: A4 Portrait / Landscape standar (Margin 12mm - 15mm).
   - KOP Surat Resmi PT. Karya Impian Laboratoris (Dreamlab) lengkap dengan Logo, Alamat, Kontak, dan Garis Pembatas Kop.
   - Header Dokumen: Nama Dokumen Besar (misal: "FAKTUR PENJUALAN"), No Dokumen, Tanggal, Ref Transaksi, Info Penerima/Pengirim.
   - Tabel Bergaris Tegas Hitam (`border border-slate-900/40 text-[10.5pt]`).
   - Kotak Otorisasi & Tanda Tangan: Minimal 3 kolom tanda tangan (*Dibuat Oleh, Diperiksa Oleh, Disetujui Oleh*).

---

## 5. Standar Penanganan Error & Pesan Toast Ramah Pengguna

Dilarang menampilkan pesan teknis mentah seperti `Error 400`, `Bad Request`, `PrismaClientKnownRequestError`, atau `Failed to fetch`.
API Client dan Frontend Interceptor wajib menerjemahkan error menjadi kalimat manusia operasional:
* `400 / 422 (Validation Error)` $\rightarrow$ *"Mohon periksa data: [Nama Field] wajib diisi dengan benar."*
* `404 (Not Found)` $\rightarrow$ *"Data dokumen yang dicari tidak ditemukan atau telah dihapus."*
* `409 (Conflict / Duplicate)` $\rightarrow$ *"Nomor dokumen [X] sudah terdaftar. Sistem telah memperbarui ke nomor baru."*
* `403 (Forbidden)` $\rightarrow$ *"Anda tidak memiliki hak akses untuk melakukan aksi ini. Hubungi Administrator."*
* `500 (Internal Error)` $\rightarrow$ *"Terjadi kendala pada server. Mohon tunggu beberapa saat atau hubungi tim IT."*
* **Form Submit Guard:** Jika tombol simpan ditekan namun form tidak valid, sistem wajib memunculkan Toast peringatan: *"Formulir belum lengkap. Silakan lengkapi field bertanda bintang (*)"* dan otomatis menyorot field yang belum terisi.

---

## 6. Standar Sesi Login & Persistensi (Remember Me 30 Hari)

* Fitur *"Ingat Saya di Perangkat Ini"* pada form login `/login`:
  * Default Cookie Session: 30 Hari (`maxAge: 30 * 24 * 60 * 60 = 2,592,000 detik`).
  * Token JWT di-refresh secara berkala di background tanpa memaksa user logout di tengah operasional harian.

---

## 7. Format Kode Dokumen Universal (2 Versi Kanonik — REQUIREMENT Poin 148-155)

Seluruh penomoran otomatis dokumen dan master data di sistem (SO, PO, Faktur, DBR, Sample, Aset) wajib mematuhi standar format universal:
1. **Versi Lengkap:** `kode_perusahaan-divisi-tipe_dokumen-tanggal-nomor_urut`
   - Contoh: `DL-FIN-SO-29062026-0001`
2. **Versi Ringkas:** `tipe_dokumen-tanggal-nomor_urut`
   - Contoh: `SO-29062026-0001`
3. **Aturan Nomor Urut Global:**
   - Bagian paling akhir (`0001`, `0002`, dst.) bersifat **global dan berkelanjutan** (tidak di-reset per bulan/kategori).

---

## 8. Standar Kondisi Barang Gudang & Penerimaan (REQUIREMENT Poin 105, 112-116)

Setiap penerimaan barang (Inbound / Goods Receipt) wajib memisahkan 3 kondisi:
1. **Jumlah Kondisi Bagus:** Barang lolos QC dan masuk saldo `Real Stok` yang dapat digunakan produksi.
2. **Jumlah Cacat / Reject:** Barang rusak dari supplier, masuk status karantina, dan **TIDAK DIBAYAR** oleh Finance.
3. **Jumlah Barang Free (Gratis / Bonus):** Dicatat kuantitas fisiknya di gudang tanpa menambah tagihan hutang (AP).

---

## 9. Invariant Finansial & Otorisasi Kritis (04_BUSINESS_RULES.md)

1. **DP Penjualan Minimum 50% (BUS-RULE-002):** Sales Order (SPK) dilarang masuk status `READY_PROD` atau menerbitkan DBR/PR jika akumulasi DP berstatus `POSTED` masih kurang dari $50\%$ nilai kontrak.
2. **Double-Entry Journal Invariant:** Setiap transaksi operasional yang berstatus `POSTED` (Faktur, Bayar, Retur, Depresiasi) wajib menghasilkan jurnal otomatis dengan balance $Debit = Credit$. Dilarang ada selisih pembulatan sen.

