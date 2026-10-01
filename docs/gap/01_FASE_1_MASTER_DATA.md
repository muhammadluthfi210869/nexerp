# FASE 1: MASTER DATA & KONFIGURASI

> **Status Audit**: ✅ AUDITED VIA PLAYWRIGHT BROWSER (Perspektif User Langsung)  
> **Status Implementasi**: 🔄 WAITING FOR DEVELOPER FIXES  
> **Tangkapan Layar & Data Ekstraksi**: `artifacts/gserp_audit/fase1/`  
> **Referensi Tambahan**: `docs/reference/REQUIREMENT.md` (Poin 1, 2, 3, dan Poin 58–59)

---

## 1.1 Master Barang & Kategori Barang

- **URL G-SERP**: `https://kil.gserp.id/goods-manage` & `https://kil.gserp.id/goods-category-manage`
- **URL NexERP**: `/master/goods` (Tab: "Master Barang" & "Kategori Barang")
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI (Full-stack PostgreSQL + NestJS + Next.js DNA UI)`

### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Analisis Gap & Rekomendasi |
| :--- | :---: | :--- |
| `#` (Nomor urut) | ✅ Ada | Sudah sesuai |
| `Kode` | ✅ Ada | Kode SKU barang |
| `Barang` (Nama) | ✅ Ada | Nama barang |
| `Harga Beli` | ✅ Ada | Harga pokok / modal |
| `Kategori` | ✅ Ada | Dropdown kategori |
| `Sub Kategori` | ✅ Ada | Sub-kategori persediaan |
| `Satuan` | ✅ Ada | Satuan (pcs, gr, ml, kg, dll) |
| `Tanggal` (PO Terakhir) | ✅ Ada | Ditampilkan tanggal transaksi PO pembelian terakhir per barang |
| `No. Pembelian` | ✅ Ada | Ditampilkan No. PO pembelian terakhir |
| `Supplier` | ✅ Ada | Ditampilkan Nama Supplier pembelian terakhir |
| `Qty` | ✅ Ada | Ditampilkan Qty pembelian terakhir |
| `Harga` | ✅ Ada | Ditampilkan Harga satuan beli transaksi terakhir |

### B. Form Modal / Halaman Buat (`goods-manage/create`)
- [x] `code` (Kode unik barang - *Text, Wajib*)
- [x] `name` (Nama barang - *Text, Wajib*)
- [x] `category` (Kategori barang - *Dropdown dinamis DB, Wajib*)
- [x] `sub_category` (Sub kategori - *Text/Dropdown*)
- [x] `description` (Deskripsi - *Textarea*)
- [x] `price` (Harga beli standar - *Text/Currency, Wajib*)
- [x] `lowest_stock` (Stok minimum reorder point - *Number, Wajib*)
- [x] `unit` (Satuan - *Dropdown, Wajib: pcs, gr, ml, kg, dll*)
- [x] `photo` (Upload/URL foto barang - *File/Text*)
- [x] **8 Akun CoA Pemetaan Otomatis**:
  - `coa_1`: **Akun Persediaan** *(Select CoA dinamis dari /finance/accounts, Wajib)*
  - `coa_2`: **Akun Penjualan** *(Select CoA dinamis, Wajib)*
  - `coa_3`: **Akun Retur Penjualan** *(Select CoA dinamis)*
  - `coa_4`: **Akun Diskon Penjualan** *(Select CoA dinamis)*
  - `coa_5`: **Persediaan (Dalam Perjalanan)** *(Select CoA dinamis)*
  - `coa_6`: **Akun COGS / Beban Pokok** *(Select CoA dinamis, Wajib)*
  - `coa_7`: **Akun Retur Pembelian** *(Select CoA dinamis)*
  - `coa_8`: **Akun Barang Belum Faktur** *(Select CoA dinamis)*

### C. Tombol Aksi & Fitur
- [x] **Modal Riwayat Pembelian (`#modal-purchase-history`)**: Tersedia tombol dan modal interaktif untuk melihat seluruh riwayat PO pembelian barang tersebut (Tanggal, No. Pembelian, Supplier, Qty, Harga Satuan, Total Transaksi, Status).
- [x] **Search / Autocomplete**: Field pemilihan CoA dan Kategori dinamis dari database.
- [x] **Kategori Barang CRUD**: Tab "Kategori Barang" terhubung ke `master_categories` (type: GOODS) untuk tambah/sunting/hapus.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_3_goods.cjs` (6/6 check passed).

---

## 1.2 Master Supplier & Kategori Supplier

- **URL G-SERP**: `https://kil.gserp.id/supplier-manage` & `https://kil.gserp.id/supplier-category-manage`
- **URL NexERP**: `/master/suppliers` & `/master/vendors`
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI (Full-stack PostgreSQL + NestJS + Next.js DNA UI)`

### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Analisis Gap & Rekomendasi |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Supplier` | ✅ Ada | Nama perusahaan supplier |
| `PIC` | ✅ Ada | Nama Person in Charge |
| `Telepon` | ✅ Ada | No handphone / WA PIC |
| `Kategori` | ✅ Ada | Kategori supplier dari `master_categories` (type: SUPPLIER) |
| `Kota` | ✅ Ada | Ditambahkan kolom Kota Domisili pada overview table |
| `Pajak (%)` | ✅ Ada | Ditambahkan badge tarif Pajak default (PPN: 11% / 12% / 0%) |

### B. Form Input (`supplier-manage/create`)
- [x] `name`: Nama supplier (*Wajib*)
- [x] `category`: Kategori supplier (*Wajib, dinamis dari API master categories*)
- [x] `phone`: Nomor telepon / HP (*Wajib*)
- [x] `pic`: Nama PIC supplier (*Wajib*)
- [x] `tax`: Pajak default dalam % (*Wajib, dropdown 11%, 12%, 0%*)
- [x] `description`: Catatan / deskripsi (*Textarea*)
- [x] `province`: Input / Dropdown Provinsi
- [x] `city`: Input / Dropdown Kota/Kabupaten
- [x] `address`: Alamat lengkap (*Textarea*)

### C. Tombol Aksi & Fitur Khusus
- [x] **Kategori Berbasis DB**: CRUD Kategori Supplier terhubung ke `master_categories` type `SUPPLIER` tanpa dummy data.
- [x] **Tombol Aksi Baris**: Tombol Edit (Kelola) dan Hapus tersambung ke backend API.
- [x] **Fitur Import Excel**: Backend DTO & Import service disiapkan untuk parsing data supplier lengkap.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_1_supplier.cjs` (5/5 check passed).

---

## 1.3 Master Pelanggan & Pelanggan Saya

- **URL G-SERP**: `https://kil.gserp.id/customer-manage` & `https://kil.gserp.id/customer-my-manage`
- **URL NexERP**: `/master/customers` (Tab: "Semua Pelanggan", "Pelanggan Saya", "Kategori")
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI (Full-stack PostgreSQL + NestJS + Next.js DNA UI)`

### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Analisis Gap & Rekomendasi |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Nama` | ✅ Ada | Nama pelanggan & brand |
| `Telepon` | ✅ Ada | Kontak telepon / WhatsApp |
| `Kategori` | ✅ Ada | Calon Pelanggan / Pelanggan Sample / Pelanggan Produk / Pelanggan RO |
| `Kota` | ✅ Ada | Kota domisili |
| `Penginput` (Sales) | ✅ Ada | User / PIC Sales dinamis dari DB |
| `SO Sample` | ✅ Ada | Badge jumlah request formulasi sampel langsung dari database |
| `SO Produk` | ✅ Ada | Badge jumlah pesanan Job Order batch produksi dari database |
| `Nominal SO Produk`| ✅ Ada | Total omset uang/penjualan dari pelanggan tersebut (Currency Rp) |

### B. Form Input Pelanggan (`customer-manage/create`)
- [x] `name`: Nama pelanggan / Brand (*Wajib*)
- [x] `code`: Kode unik pelanggan
- [x] `category`: Kategori (*Dinamis dari master_categories type CUSTOMER*)
- [x] `phone`: Nomor telepon (*Wajib*)
- [x] `email`: Email pelanggan
- [x] `date_birth`: Tanggal lahir pelanggan / founder (`birthDate` terhubung ke DB)
- [x] `user`: Dropdown PIC Sales yang menangani (dinamis dari API sales-staff)
- [x] `province`: Input/Dropdown Provinsi
- [x] `city`: Input/Dropdown Kota
- [x] `address`: Alamat lengkap (*Textarea*)

### C. Fitur Khusus Berdasarkan REQUIREMENT.md (Poin 2)
- [x] **3 Dedicated Inspection Cards/Tabs**:
  1. **Sample**: Detail pengajuan formulasi sample, status approval R&D, riwayat iterasi formula.
  2. **Produksi**: Riwayat pesanan produksi massal (SPK/PO), nomor batch produksi.
  3. **Legalitas & Escrow**: Tracking perizinan BPOM, Sertifikasi Halal, HKI Merek, Saldo Escrow Deposit.
- [x] **Filter Toolbar**: Filter per Sales (`filter_user`), filter kategori (`filter_category`), dan tombol **Export Excel** (CSV).
- [x] **Kategori Pelanggan CRUD**: Tab Kategori Pelanggan terhubung ke `master_categories` (type: CUSTOMER) dengan aksi tambah/sunting/hapus.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_2_customer.cjs` (6/6 check passed).

---

## 1.4 Master Gudang & Hak Akses Gudang

- **URL G-SERP**: `https://kil.gserp.id/warehouse-manage` & `https://kil.gserp.id/warehouse-access-manage`
- **URL NexERP**: `/master/warehouses`
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI` (6/6 Test Lolos)

### A. Tabel Overview (Kolom Gudang)
| Kolom di G-SERP | Ada di NexERP? | Keterangan |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Nomor urut |
| `Gudang` | ✅ Ada | Nama gudang (`name`) |
| `Lokasi` | ✅ Ada | Alamat / Kota gudang (`city`, `province`) |
| `Telepon` | ✅ Ada | No telepon gudang (`phone`) |
| `Aksi` | ✅ Ada | Sunting (modal edit) & Hapus (soft-delete INACTIVE) |

### B. Sub-Halaman: Hak Akses Gudang (`warehouse-access-manage`)
- [x] **Parity Modul Kontrol Hak Akses Gudang**: Menampilkan seluruh personel dari DB beserta hak akses gudang masing-masing.
- [x] **Kolom Tabel Hak Akses Gudang**:
  - `#`
  - `Nama Pegawai` (`namaPersonel`)
  - `Email` (`email`)
  - `Nomor Telepon` (`phone` dari `employeeProfile`)
  - `Hak Akses` (`hakAkses` / role)
  - `Gudang` (Badges list gudang yang boleh diakses/dimutasi, atau badge 'Belum Ada Akses')
  - `Aksi` (Tombol 'Atur Akses' untuk membuka modal otorisasi per user)
- [x] **Modal Otorisasi Hak Akses**:
  - Pilihan personel (*select*).
  - Ringkasan nama dan jabatan personel.
  - Checkbox daftar semua fasilitas gudang aktif dengan info nama dan kota lokasi.
  - Simpan otorisasi terhubung ke API `PUT /master/warehouses/access/:userId` (sinkronisasi atomik via Prisma `$transaction`).
- [x] **Form Buat/Edit Gudang**: `name`, `phone`, `province`, `city`, `address`, `picName`, `tipePenyimpanan`.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_4_warehouse.cjs` (6/6 checks passed).


---

## 1.5 Master CoA & CoA Jurnal Otomatis

- **URL G-SERP**: `https://kil.gserp.id/coa-manage` & `https://kil.gserp.id/coa-auto-manage`
- **URL NexERP**: `/finance/accounting/coa` & `/finance/accounting/coa-auto`
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI` (7/7 Automated Integration Checks Passed)

### A. Master CoA (`/finance/accounting/coa`)
- [x] **Kolom Overview**: `#`, `Kode Akun`, `Nama Rekening Akun`, `Tipe Laporan`, `Induk Akun`, `Saldo Normal`, `Header Akun`, `Kelompok Kategori`, `Status`, `Aksi`.
- [x] **Fitur Tombol Aksi & Navigasi**:
  - Tombol **CoA Jurnal Otomatis**: Navigasi langsung ke `/finance/accounting/coa-auto`.
  - Tombol **Copy CoA**: Inisialisasi/duplikasi template bagan akun standar.
  - Tombol **Export Excel**: Ekspor seluruh baris akun ke lembar kerja Excel (CSV kompatibel).
  - Field **Induk Akun (Parent)**: Relasi hirarki akun induk dan sub-akun (`parentId` -> `Account`).
  - Toggle / Checkbox **Header Akun**: Menandai akun sebagai klasifikasi header (`allowManualJournal: false`).
- [x] **Modal CRUD & Detail**: Form tambah/sunting akun mendukung seleksi akun induk, pengaturan header level, tipe finansial, dan saldo normal (Debit/Credit).

### B. CoA Jurnal Otomatis (`/finance/accounting/coa-auto` — 12 Transaksi Kunci)
Di G-SERP terdapat aturan pemetaan posting otomatis untuk 12 transaksi akuntansi ke buku besar umum:
- [x] `coa_1`: `FAKTUR_PEMBELIAN_HUTANG` — **Hutang Dagang** (akun hutang saat penerbitan Faktur Pembelian)
- [x] `coa_2`: `FAKTUR_PEMBELIAN_DISKON` — **Potongan Pembayaran** (akun diskon saat Faktur Pembelian)
- [x] `coa_3`: `FAKTUR_PEMBELIAN_BIAYA_LAIN` — **Beban Lainnya** (akun biaya angkut/ekstra saat Faktur Pembelian)
- [x] `coa_4`: `FAKTUR_PEMBELIAN_PPN_MASUKAN` — **PPN Masukan** (akun pajak masukan Faktur Pembelian)
- [x] `coa_5`: `STOK_OPNAME_KOREKSI` — **Koreksi Stok** (akun penyesuaian saat Stok Opname)
- [x] `coa_6`: `PENGIRIMAN_BARANG_TRANSIT` — **Persediaan Dalam Perjalanan** (akun persediaan saat Pengiriman Barang)
- [x] `coa_7`: `FAKTUR_PENJUALAN_PIUTANG` — **Piutang Dagang** (akun piutang saat penerbitan Faktur Penjualan)
- [x] `coa_8`: `PENJUALAN_POTONGAN` — **Potongan Penjualan** (akun diskon penjualan & pelunasan)
- [x] `coa_9`: `PENJUALAN_PPN_KELUARAN` — **PPN Keluaran** (akun pajak keluaran Faktur Penjualan)
- [x] `coa_10`: `UANG_MUKA_PEMBELIAN` — **Uang Muka Pembelian** (akun DP Pembelian Supplier)
- [x] `coa_11`: `UANG_MUKA_PENJUALAN` — **Uang Muka Penjualan** (akun DP Penjualan Pelanggan)
- [x] `coa_12`: `RETUR_PEMBELIAN_SELISIH` — **Selisih Harga Pembelian** (akun selisih harga saat Retur Pembelian)
- [x] **Backend & API**:
  - `GET /finance/auto-journal-configs`: Query konfigurasi rules.
  - `POST /finance/auto-journal-configs`: Upsert rule debit/credit mapping.
  - `POST /finance/auto-journal-configs/seed`: Inisialisasi otomatis 12 standar G-SERP.
  - `DELETE /finance/auto-journal-configs/:transactionType`: Hapus aturan.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_5_coa.cjs` (7/7 checks passed).

---

## 1.6 Target Penjualan & Kategori Penjualan

- **URL G-SERP**: `https://kil.gserp.id/sales-target` & `https://kil.gserp.id/sales-category`
- **URL NexERP**: `/penjualan/sales-target` & `/master/sales-category`
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI` (7/7 Automated Integration Checks Passed)

### A. Tabel Overview Target Penjualan (`sales-target`)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Realisasi Live DB |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Nomor urut dinamis |
| `Marketing` | ✅ Ada | Nama Marketing/Sales PIC (`fullName`, `email`, role) |
| `Periode` | ✅ Ada | Bulan & Tahun (contoh: Maret 2026) |
| `Target` | ✅ Ada | Nominal kuota target omzet rupiah (cth: Rp 500.000.000) |
| `Achievement` | ✅ Ada | Realisasi penjualan terbayar aktual dihitung live dari invoice (`amountDue - outstandingAmount`) |
| `% Capaian` | ✅ Ada | Persentase capaian target ($Achievement / Target \times 100\%$) dengan progress bar visual |
| `Catatan` | ✅ Ada | Catatan operasional & strategi alokasi kuota |
| `Aksi` | ✅ Ada | Detail Drawer, Sunting (modal edit), Hapus (dialog konfirmasi) |

### B. Form Modal Input Target Penjualan:
- [x] `userId`: Dropdown Sales / Marketing person dinamis dari DB (`/master/sales-targets/users`).
- [x] `year`: Tahun (2024 - 2028).
- [x] `month`: Bulan (Januari s/d Desember).
- [x] `nominalTarget`: Nominal target omzet (Currency IDR).
- [x] `notes`: Catatan operasional target.

### C. Kategori Penjualan (`sales-category`):
- [x] **Tabel Parity 1:1**: `#`, `Kategori Penjualan`, `Deskripsi Proses Bisnis`, `Pipeline Timeline`, `Aksi`.
- [x] **Sub-Tabel Timeline Pipeline**: 7 tahapan standar siklus penjualan maklon kosmetik (Registrasi Lead $\rightarrow$ Formulasi RnD $\rightarrow$ Penawaran HPP $\rightarrow$ SPK & Kontrak $\rightarrow$ DP Faktur 50% $\rightarrow$ Batch Produksi $\rightarrow$ Pelunasan & DO).
- [x] **Standard Categories Seeding**: 5 kategori standar G-SERP (Maklon Baru, Repeat Order, Sample RnD, Jasa Maklon, Produk Ruahan) terdaftar di database `sales_categories`.
- [x] **Backend & API**:
  - `GET /master/sales-targets`: Query target omzet bulanan dengan kalkulasi realisasi otomatis.
  - `POST /master/sales-targets`: Upsert alokasi target omzet marketing.
  - `PUT /master/sales-targets/:id`: Sunting alokasi target.
  - `DELETE /master/sales-targets/:id`: Hapus target omzet.
  - `GET /master/sales-categories`: Query daftar kategori penjualan.
  - `POST /master/sales-categories`: Buat kategori penjualan baru.
  - `PUT /master/sales-categories/:id`: Sunting kategori penjualan.
  - `DELETE /master/sales-categories/:id`: Hapus kategori penjualan.
  - `POST /master/sales-categories/seed`: Inisialisasi 5 kategori standar G-SERP.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_6_sales_target.cjs` (7/7 checks passed).

---

## 1.7 Hak Akses (Role) & Pengguna (User)

- **URL G-SERP**: `https://kil.gserp.id/role-manage` & `https://kil.gserp.id/user-manage`
- **URL NexERP**: `/master/personnel` (Tab: Daftar Pengguna & Personel / Hak Akses & Role), `/user-manage`, `/role-manage`, `/master/users`
- **Status Verifikasi**: `[x] SELESAI & TERVERIFIKASI` (8/8 Automated Integration Checks Passed)

### A. Tabel Overview Pengguna (`user-manage`)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Realisasi Live DB |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Nomor urut dinamis terpaginasi |
| `Kode/NIP` | ✅ Ada | Nomor Induk Pegawai (`code` di DB, e.g. `PEG-0001`), tersimpan unik di PostgreSQL |
| `Nama` | ✅ Ada | Nama lengkap staf / personel (`fullName`) |
| `Email` | ✅ Ada | Email login korporat unik (`email`) |
| `Nomor Telepon` | ✅ Ada | Nomor WhatsApp / Telepon (`phone`) |
| `Hak Akses` | ✅ Ada | Peran/Role otorisasi sistem (`roles` enum) |
| `BusDev` | ✅ Ada | Flag Evaluasi Business Development (`isBd`) dengan badge visual |
| `Status` | ✅ Ada | Status akun `ACTIVE` / `INACTIVE` |
| `Aksi` | ✅ Ada | Lihat Profil Drawer, Sunting (modal edit), Nonaktifkan (soft delete), Aktifkan Kembali |

### B. Fitur & Form Input Pengguna (`user-manage/create` & edit)
- [x] **Filter Tab / Toolbar**: Filter status (ACTIVE, INACTIVE), filter Departemen, filter Hak Akses, filter `isBd` (Tampil di Evaluasi BusDev: YA / TIDAK).
- [x] **Field Form Terintegrasi**: `code` (NIP/Kode), `fullName` (Nama lengkap), `email` (Email login), `phone` (Nomor Telepon/WA), `password` (Kata Sandi bcrypt encrypted), `roles` (Hak Akses), `divisi` (Departemen), `isBd` (Tampilkan di Evaluasi BusDev).
- [x] **Aksi Nonaktifkan & Aktifkan Kembali**: Soft delete via `DELETE /users/:id` (`status: INACTIVE` + `deletedAt`) dan aktivasi kembali via `PATCH /users/:id` (`status: ACTIVE` + `deletedAt: null`).
- [x] **Legacy URL Routing**: Tersedia redirect otomatis dari `/user-manage`, `/user-manage/create`, `/role-manage`, dan `/master/users` menuju `/master/personnel`.
- [x] **Test Otomatis**: Lolos verifikasi `scripts/test_subfase_1_7_users_roles.cjs` (8/8 checks passed).

---

## 🛠️ Catatan Backend, Database & Schema Prisma

1. **Model `Material`**:
   - Dukung 8 relasi CoA otomatis per kategori/barang.
   - Endpoint riwayat PO barang (`/api/master/materials/:id/purchase-history`).
2. **Model `Supplier`**:
   - Kolom `taxPercentage` (Float, default 11), `province`, `city`.
   - Endpoint import Excel vendor (`/api/master/suppliers/import`).
3. **Model `Customer`**:
   - Kolom `birthDate`, `province`, `city`, `assignedUserId`.
   - Virtual aggregate fields: `soSampleCount`, `soProdukCount`, `soProdukNominal`.
4. **Model `WarehouseAccess`**:
   - Relasi akses gudang per user.
5. **Model `SalesTarget`**:
   - Model pencatatan target bulanan sales (`userId`, `year`, `month`, `targetAmount`).
