# Master Gap Analysis & Alignment Matrix: G-SERP (Legacy) vs NexERP

Dokumen ini adalah acuan resmi perbedaan fitur, kolom, form input, tombol aksi, dan backend logic antara sistem ERP lama (**`kil.gserp.id`**) dan sistem baru (**NexERP**), yang disusun berdasarkan hasil audit browser Playwright langsung dari perspektif end-user.

---

## 🗺️ Ringkasan Roadmap 8 Fase Audit

- [ ] **Fase 1: Master Data & Konfigurasi** *(Status: AUDITED & READY FOR DEV)*
- [ ] **Fase 2: Pengadaan / Purchasing & Hutang (AP)** *(Status: Pending)*
- [ ] **Fase 3: Gudang & Inventori (Warehouse)** *(Status: Pending)*
- [ ] **Fase 4: CRM, Leads & Penjualan (Sales & AR)** *(Status: Pending)*
- [ ] **Fase 5: RnD & Formulasi** *(Status: Pending)*
- [ ] **Fase 6: Produksi & Penjadwalan** *(Status: Pending)*
- [ ] **Fase 7: Finance, Kas Bank & Akuntansi** *(Status: Pending)*
- [ ] **Fase 8: Modul Tambahan / New Specs (KPI, Protocol, Project Control)** *(Status: Pending)*

---

# FASE 1: MASTER DATA & KONFIGURASI

Dokumen acuan tambahan: `docs/reference/REQUIREMENT.md` (Poin 1, 2, 3, dan Poin 58–59).

---

### 1.1 Master Barang & Kategori Barang
- **URL G-SERP**: `https://kil.gserp.id/goods-manage` & `/goods-category-manage`
- **URL NexERP**: `/master/goods` (Tab: "Master Barang" & "Kategori Barang")
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` (Nomor urut) | ✅ Ada | Sudah sesuai |
| `Kode` | ✅ Ada | Kode SKU barang |
| `Barang` (Nama) | ✅ Ada | Nama barang |
| `Harga Beli` | ✅ Ada | Harga pokok / modal |
| `Kategori` | ✅ Ada | Dropdown kategori |
| `Sub Kategori` | ✅ Ada | Sub-kategori |
| `Satuan` | ✅ Ada | Satuan (pcs, gr, ml, kg, dll) |
| `Tanggal` (Pembelian Terakhir) | ⚠️ Belum Lengkap | G-SERP menampilkan tanggal PO terakhir langsung di baris barang |
| `No. Pembelian` | ⚠️ Belum Lengkap | G-SERP menampilkan Nomor PO terakhir |
| `Supplier` (Supplier Terakhir) | ⚠️ Belum Lengkap | G-SERP menampilkan Nama Supplier terakhir pembelian |
| `Qty` (Qty Pembelian Terakhir) | ⚠️ Belum Lengkap | G-SERP menampilkan Qty PO terakhir |
| `Harga` (Harga PO Terakhir) | ⚠️ Belum Lengkap | G-SERP menampilkan harga beli pada transaksi terakhir |

#### B. Modal & Tombol Aksi
- [ ] **Modal Riwayat Pembelian (`#modal-purchase-history`)**: Di G-SERP terdapat modal popup untuk melihat riwayat seluruh transaksi pembelian barang tersebut (Tanggal, No. Pembelian, Supplier, Qty, Harga). Di NexERP perlu dipastikan drawer detail/modal memuat riwayat PO ini.
- [ ] **8 Akun CoA Pemetaan di Form Input Barang & Kategori Barang**:
  G-SERP mewajibkan pemetaan 8 akun CoA otomatis per kategori barang/barang:
  1. `coa_1`: **Akun Persediaan** *(Wajib)*
  2. `coa_2`: **Akun Penjualan** *(Wajib)*
  3. `coa_3`: **Akun Retur Penjualan** *(Wajib)*
  4. `coa_4`: **Akun Diskon Penjualan** *(Wajib)*
  5. `coa_5`: **Persediaan (Dalam Perjalanan)** *(Wajib)*
  6. `coa_6`: **Akun COGS / Beban Pokok Penjualan** *(Wajib)*
  7. `coa_7`: **Akun Retur Pembelian** *(Wajib)*
  8. `coa_8`: **Akun Barang Belum Faktur** *(Wajib)*
- [ ] **Input Field Global**: Ganti input CoA dan kategori dari teks bebas menjadi **Search/Autocomplete** (Sesuai REQUIREMENT.md poin 58).

---

### 1.2 Master Supplier & Kategori Supplier
- **URL G-SERP**: `https://kil.gserp.id/supplier-manage` & `/supplier-category-manage`
- **URL NexERP**: `/master/suppliers` & `/master/vendors`
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` (Nomor urut) | ✅ Ada | Sudah sesuai |
| `Supplier` | ✅ Ada | Nama perusahaan supplier |
| `PIC` | ✅ Ada | Nama Person in Charge |
| `Telepon` | ✅ Ada | No handphone / WA |
| `Kategori` | ✅ Ada | Kategori pengadaan supplier |
| `Kota` | ⚠️ Kurang | G-SERP menampilkan Kota lokasi supplier di tabel utama |
| `Pajak (%)` | ⚠️ Kurang | G-SERP menampilkan tarif Pajak default (PPN) per supplier |

#### B. Form Input (Tambah / Edit)
- [ ] Field `Pajak (%)` (Input persentase pajak default faktur pembelian).
- [ ] Field Wilayah Bertingkat: `Provinsi` (Dropdown) $\rightarrow$ `Kota/Kabupaten` (Dropdown dependent).
- [ ] **Fitur Import Excel**: Sesuai REQUIREMENT.md Poin 1 (*"Master Vendor: tambahkan fitur import data vendor via Excel"*).
- [ ] **Kategori Pengadaan Sesuai CoA**: Sesuai REQUIREMENT.md Poin 3 (*"Kategori pengadaan: kategorisasi dilakukan berdasarkan COA saja"*).

---

### 1.3 Master Pelanggan & Pelanggan Saya
- **URL G-SERP**: `https://kil.gserp.id/customer-manage` & `/customer-my-manage`
- **URL NexERP**: `/master/customers` (Tab: "Semua Pelanggan", "Pelanggan Saya", "Kategori")
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview (Kolom)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Nama` | ✅ Ada | Nama pelanggan/brand |
| `Telepon` | ✅ Ada | No kontak |
| `Kategori` | ✅ Ada | Calon Pelanggan / Pelanggan Sample / Pelanggan Produk |
| `Kota` | ✅ Ada | Kota domisili |
| `Penginput` (PIC Sales) | ✅ Ada | User sales yang menginput/memegang akun |
| `SO Sample` | ⚠️ Perlu Sinkron | Jumlah total pesanan sampel customer |
| `SO Produk` | ⚠️ Perlu Sinkron | Jumlah total pesanan produk maklon customer |
| `Nominal SO Produk` | ⚠️ Perlu Sinkron | Total omset uang/penjualan dari customer tersebut |

#### B. Fitur & Form Input
- [ ] **Filter Toolbar**: G-SERP memiliki filter `filter_user` (Pilih Sales) dan `filter_category` + tombol `Export Excel`.
- [ ] **Requirement Tambahan (REQUIREMENT.md Poin 2)**:
  - Tambahkan card/field khusus untuk:
    1. **Sample**: status approval sampel, nomor SPK sampel, riwayat formula.
    2. **Produksi**: batch order aktif, nomor PO/SPK produksi maklon.
    3. **Legalitas**: status BPOM, Halal, HKI, Escrow deposit.
- [ ] Field Form: `date_birth` (Tanggal Lahir/Ulang Tahun Pelanggan), `user` (PIC Sales), `province`, `city`, `address`.

---

### 1.4 Master Gudang & Hak Akses Gudang
- **URL G-SERP**: `https://kil.gserp.id/warehouse-manage` & `/warehouse-access-manage`
- **URL NexERP**: `/master/warehouses`
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview (Kolom Gudang)
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Gudang` | ✅ Ada | Nama gudang |
| `Lokasi` | ✅ Ada | Alamat / Kota gudang |
| `Telepon` | ✅ Ada | Nomor kontak PIC gudang |

#### B. Modul Baru / Sub-Tab: Hak Akses Gudang (`warehouse-access-manage`)
- [ ] **Gap Kritis**: Di G-SERP terdapat halaman dedicated `warehouse-access-manage` untuk membatasi staf mana saja yang berhak melihat dan memutasi stok di gudang tertentu.
- [ ] **Kolom Hak Akses Gudang**:
  - `Nama User`
  - `Email`
  - `Nomor Telepon`
  - `Hak Akses` (Role)
  - `Gudang` (Multi-select / Badge gudang yang diizinkan untuk diakses user tersebut)
- [ ] **Form Input Gudang**: `name`, `phone`, `province`, `city`, `address`.

---

### 1.5 Master CoA & CoA Jurnal Otomatis
- **URL G-SERP**: `https://kil.gserp.id/coa-manage` & `/coa-auto-manage`
- **URL NexERP**: `/finance/accounting/coa` & `/finance/accounting/coa-auto`
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview CoA
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Kode` | ✅ Ada | Nomor akun (contoh: 11111) |
| `Nama` | ✅ Ada | Nama akun (contoh: Kas Utama) |
| `Tipe` | ✅ Ada | Kas/Bank, Piutang Dagang, Persediaan, Hutang, Modal, Pendapatan, Beban |
- [ ] **Fitur Aksi CoA**:
  - Tombol **Copy CoA** (Menduplikasi struktur akun).
  - Tombol **Export Excel**.
  - Checkbox **Header Akun** (`head`) untuk akun induk yang tidak bisa dijurnal langsung.

#### B. Halaman CoA Jurnal Otomatis (`coa-auto-manage`)
Di G-SERP ada form pemetaan otomatis untuk 12 transaksi akuntansi:
- [ ] `coa_1`: **Hutang Dagang** (akun hutang saat penerbitan Faktur Pembelian)
- [ ] `coa_2`: **Potongan Pembayaran** (akun diskon saat Faktur Pembelian)
- [ ] `coa_3`: **Beban Lainnya** (akun biaya angkut/ekstra saat Faktur Pembelian)
- [ ] `coa_4`: **PPN Masukan** (akun pajak masukan Faktur Pembelian)
- [ ] `coa_5`: **Koreksi Stok** (akun penyesuaian saat Stok Opname)
- [ ] `coa_6`: **Persediaan Dalam Perjalanan** (akun persediaan saat Pengiriman Barang)
- [ ] `coa_7`: **Piutang Dagang** (akun piutang saat penerbitan Faktur Penjualan)
- [ ] `coa_8`: **Potongan Penjualan** (akun diskon penjualan & pelunasan)
- [ ] `coa_9`: **PPN Keluaran** (akun pajak keluaran Faktur Penjualan)
- [ ] `coa_10`: **Uang Muka Pembelian** (akun DP Pembelian)
- [ ] `coa_11`: **Uang Muka Penjualan** (akun DP Penjualan)
- [ ] `coa_12`: **Selisih Harga Pembelian** (akun selisih harga saat Retur Pembelian)

---

### 1.6 Target Penjualan & Kategori Penjualan
- **URL G-SERP**: `https://kil.gserp.id/sales-target` & `/sales-category`
- **URL NexERP**: `/penjualan/target` atau `/master/sales-target`
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview Target Penjualan
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` | ⚠️ Perlu Cek | Nomor urut |
| `Marketing` | ⚠️ Perlu Cek | Nama Sales / Marketing person |
| `Periode` | ⚠️ Perlu Cek | Bulan & Tahun (contoh: Januari 2026) |
| `Target` | ⚠️ Perlu Cek | Nominal target rupiah |
| `Achievement` | ⚠️ Perlu Cek | Realisasi omset penjualan tercapai |
| `% Capaian` | ⚠️ Perlu Cek | Persentase capaian target ($Achievement / Target \times 100\%$) |

#### B. Form Input Target Penjualan:
- [ ] `users_id`: Dropdown Sales / Marketing
- [ ] `year`: Tahun (Input number)
- [ ] `month`: Bulan (Januari s/d Desember)
- [ ] `target`: Nominal Target (Currency input)

---

### 1.7 Hak Akses (Role) & Pengguna (User)
- **URL G-SERP**: `https://kil.gserp.id/role-manage` & `/user-manage`
- **URL NexERP**: `/system/settings` atau `/master/personnel` / `/master/users`
- **Status Alignment**: `[ ] IN PROGRESS`

#### A. Tabel Overview Pengguna
| Kolom di G-SERP | Ada di NexERP? | Keterangan & Gap |
| :--- | :---: | :--- |
| `#` | ✅ Ada | Sudah sesuai |
| `Kode/NIP` | ⚠️ Kurang | Nomor Induk Pegawai / Kode User |
| `Nama` | ✅ Ada | Nama lengkap user |
| `Email` | ✅ Ada | Email login |
| `Nomor Telepon` | ✅ Ada | No telepon / WA |
| `Hak Akses` | ✅ Ada | Role user |

#### B. Fitur & Form Input Pengguna
- [ ] Filter tab / tombol: **Pengguna Tidak Aktif** (Melihat daftar user non-aktif / suspend).
- [ ] Checkbox `is_bd`: **Tampilkan di Evaluasi BusDev** (Menentukan apakah performa user ini dimasukkan dalam kalkulasi KPI BusDev).
- [ ] Field Form: `code` (NIP), `name`, `photo`, `email`, `phone`, `password`, `password_confirm`, `role`, `is_bd`.

---

## 🛠️ Rekomendasi Teknis Backend, API & Prisma DB

1. **Prisma Model `Customer`**:
   - Pastikan field agregat terisi saat query: `soSampleCount`, `soProdukCount`, `soProdukNominal`.
   - Pastikan field `birthDate`, `province`, `city`, `assignedUserId` tersedia di schema.
2. **Prisma Model `Supplier`**:
   - Tambahkan field `taxPercentage` (Float, default 11 atau 12) dan `city`/`province`.
3. **Prisma Model `Material` (Barang)**:
   - Hubungkan 8 akun CoA otomatis per kategori/barang (`inventoryAccountId`, `salesAccountId`, `salesReturnAccountId`, `salesDiscountAccountId`, `inTransitAccountId`, `cogsAccountId`, `purchaseReturnAccountId`, `unbilledGoodsAccountId`).
4. **Prisma Model `WarehouseAccess`**:
   - Relasi Many-to-Many antara `User` dan `Warehouse` untuk otorisasi akses gudang.
5. **Prisma Model `SalesTarget`**:
   - Model `SalesTarget` dengan field `userId`, `year`, `month`, `targetAmount`.

---

## 🎯 Panduan Eksekusi untuk Anda (Developer)
1. Silakan periksa item checklist `[ ]` di atas pada modul yang ingin Anda sesuaikan lebih dulu (misal: **Master Barang**, **Master Supplier**, atau **Master Customer**).
2. Setelah Anda selesai melakukan penyesuaian kode pada halaman tersebut, cukup katakan:  
   *"Tolong recheck Master Customer"* atau *"Tolong recheck Fase 1"*.
3. Saya akan langsung menyalakan browser Playwright untuk memvalidasi tampilan, kolom, dan fungsinya terhadap G-SERP, lalu memperbarui status checklist menjadi `[x] VERIFIED`.
