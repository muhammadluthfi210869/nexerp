# Legacy ERP Audit: SCM, Warehouse, & Production

This document provides a granular mapping of input and output data structures from the legacy ERP modules to guide the migration to the new event-driven architecture.

## 1. Divisi SCM (Supply Chain Management)

### A. Master Data SCM
*   **Kategori Supplier:**
    *   **Input:** Nama Kategori, Deskripsi.
*   **Supplier:**
    *   **Input:** Nama Supplier, Kategori (Select), Telepon Kontak Person, Pajak (PPN/Non), Deskripsi, Provinsi, Kota, Alamat.
    *   **Output (Tabel):** Supplier, PIC, Telepon, Kategori, Kota, Pajak.

### B. Permintaan Barang (Internal/Inter-Warehouse)
*   **Input:** Gudang Peminta, Gudang Penyedia, Tanggal, Catatan, Item Cart (Barang, Qty).
*   **Output:** Tabel Status (Draft -> Menunggu Approval -> Dikirim -> Selesai).

### C. Siklus Transaksi Pembelian (Purchasing Cycle)

#### 1. Buat Pembelian (Purchase Order)
*   **Input:** Gudang Tujuan, Supplier, Tanggal, Jatuh Tempo (TOP), Catatan, **Cart Item** (Barang, Qty, Harga, Total).
*   **Output (Tabel):** Kode, Tanggal, Supplier, Gudang, Pembuat, Nominal, Status.
*   **Persetujuan:** Modul khusus untuk Approval PO sebelum lanjut ke tahap berikutnya.

#### 2. DP Pembelian (Down Payment)
*   **Input:** Pilih No. PO (Reference), Pilih Kas/Bank, Jumlah DP, Catatan.
*   **Output (Tabel):** Kode DP, Tanggal, No. PO, Supplier, Kas/Bank, Jumlah DP, Terpakai, Sisa, Status.

#### 3. Faktur Pembelian / Penerimaan (Goods Receipt)
*   **Output (Tabel):** Kode GR, Tanggal, Supplier, Gudang, Total, Pembuat, Status.
*   **Logic:** Modul ini mencatat kedatangan barang fisik dan menagih hutang (Invoice).

#### 4. Retur Pembelian
*   **Input:** Pilih Pembelian Masuk (GR Reference), Catatan, **Qty Retur** (Validasi terhadap Qty Tersedia).
    *   *Auto-filled info:* Kode GR, Kode PO, Supplier, Gudang, Tabel Barang (Satuan, Qty, Sudah Retur, Qty Tersedia).
*   **Output (Tabel):** Tanggal, Kode Retur, Pembelian Masuk, Supplier, Total, Status.
*   **Persetujuan:** Modul Approval khusus untuk validasi fisik barang yang diretur.

#### 5. Bayar Pembelian (Payment)
*   **Output (Tabel):** Kode Faktur, Kode GR, Kode PO, Tanggal, Supplier, Grand Total, Dibayar, Sisa, Status.
*   **Logic:** Melunasi hutang dari Faktur/GR yang sudah jatuh tempo atau akan dibayar.

---

### Efficiency & Architecture Analysis (SCM)
1.  **Automated State Machine:** Transisi dari PO -> DP -> GR -> Payment akan dilakukan secara otomatis melalui *Event Bus*. User tidak perlu mencari No. PO secara manual; sistem akan menampilkan aksi "Buat DP" atau "Terima Barang" hanya pada PO yang sudah di-approve.
2.  **Integrasi Finance:** Semua nominal (Nominal PO, DP, Bayar) akan langsung terhubung ke *Financial Ledger* tanpa double entry.
3.  **Stock Safety:** Retur Pembelian dikunci oleh validasi "Qty Tersedia" untuk mencegah *human error* (melebihi stok gudang saat ini).

---

## 2. Divisi Gudang (Warehouse)

### A. Master Data Gudang
*   **Input:** Nama Gudang, Provinsi, Kota, Alamat Lengkap, Telepon.
*   **Output (Tabel):** Gudang, Lokasi, Telepon.

### B. Perencanaan & Permintaan (Planning)

#### 1. Kebutuhan Barang (Material Requirements)
*   **Input:** Cari No. SO (Dropdown), Pilih Produk & Customer, Tambah Barang (Barang, Qty, Tanggal, Catatan).
*   **Output (Tabel):** Kode, Tanggal, SO, Customer, Produk, Brand, Pembuat, Status Process.
*   *Logic:* Digunakan untuk memetakan kebutuhan bahan baku/kemas berdasarkan order yang masuk.

#### 2. Permintaan Barang (Internal Request)
*   **Input:** Peminta (link ke SO), Penyedia (Gudang Sumber), Tanggal, Catatan.
    *   **Cart Barang:** Pilih Barang, Info Stok (Peminta & Penyedia), Qty, Catatan.
    *   **Cart Formula:** Langsung memilih **Batch Record** terkait.
*   **Output (Tabel):** Kode, Tanggal, Peminta, Penyedia, Pembuat, Catatan, Status.

### C. Mutasi & Distribusi (Movement)

#### 1. Pembelian Masuk (Purchase In / GR)
*   **Output (Tabel):** Kode, Tanggal, No. PO, Supplier, Gudang, Total, Pembuat, Status.
*   *Logic:* Pencatatan fisik barang masuk dari supplier (Match dengan SCM).

#### 2. Transfer Barang (Inter-Warehouse Transfer)
*   **Input:** Gudang Pengirim, Gudang Penerima, Tanggal, Cart Barang (Barang, Stok Tersedia, Jumlah, Catatan).
*   **Output (Tabel):** Kode Transfer, Tanggal, Pengirim, Penerima, Pembuat, Status.

#### 3. Pengiriman Barang (Shipping)
*   **Input:** Pilih Sales Order (SO), Kode Sales, Tanggal Sales, Customer.
    *   **Tabel Barang:** Satuan, Qty Sales, Qty Tersedia, Qty Kirim.
    *   **Informasi:** Catatan Pengiriman, Foto (Opsional).
*   **Output (Tabel):** Kode, Tanggal, No. Sales, Tanggal Sales, Customer, Pembuat, Status.

### D. Reverse Logistics & Audit

#### 1. Retur Penjualan (Sales Return)
*   **Output (Tabel):** Kode Retur, Tanggal, SO, Customer, Pembuat, Status.
*   *Logic:* Penerimaan kembali barang dari customer ke gudang.

#### 2. Retur Pembelian Keluar (Purchase Return - Physical)
*   **Output (Tabel):** Kode Retur, Tanggal Retur, Supplier, Gudang, Pembuat, Status.
*   *Logic:* Pengeluaran fisik barang yang dikembalikan ke supplier (Match dengan SCM Retur).

#### 3. Stok Opname (Stock Count)
*   **Input:** Gudang, Tanggal, Catatan, Item List (Barang, Stok Sistem, Stok Aktual).
*   **Output (Tabel):** Kode, Tanggal, Gudang, Pembuat, Catatan.

---

---

## 3. Divisi Produksi (Mixing, Filling, Packaging)

### A. Inisiasi (Batch Record)
*   **Input:** Pilih Sales Order (SO), Produk dari SO, Upload Dokumen Batch Record (PDF Attachment).
*   **Output (Tabel):** Kode, Tanggal, Sales Order, Pelanggan, Kategori Produk, Status.

### B. Penjadwalan Produksi (Scheduling)

#### 1. Jadwal Mixing (SM)
*   **Input:** Pilih dari Batch Record (Auto-fill: Kode Batch, SO, Pelanggan, Produk, Qty, Netto/pcs).
    *   **User Input:** Tanggal Jadwal, Target Produksi (PCS).
    *   **Upscale Calculation:** Base Result (Formula), Upscale (%), Hasil Upscale (Qty Produksi), Catatan.
*   **Output (Tabel):** Kode SM, Tanggal, Batch Record, Pelanggan, Produk, Target PCS, Hasil Upscale, Status.

#### 2. Jadwal Filling (SF)
*   **Input:** Pilih Batch Record, Tanggal Jadwal, Target (PCS).
    *   **User Input:** Kemasan Primer (Dropdown), Qty Kemasan, Catatan.
*   **Output (Tabel):** Kode SF, Tanggal, Batch Record, Pelanggan, Produk, Target, Hasil, Status.

#### 3. Jadwal Packaging (SP)
*   **Input:** Pilih Batch Record, Tanggal Jadwal, Target (PCS).
    *   **User Input:** Kemasan Sekunder (Dropdown), Qty Kemasan, Catatan.
*   **Output (Tabel):** Kode, Tanggal, Batch Record, Pelanggan, Produk, Target, PCS, Status.

### C. Eksekusi Produksi (Execution)

#### 1. Produksi Mixing
*   **Input:** Progress Update (Pilih Mesin, Qty Diproduksi, Catatan).
    *   **Formula Table:** Kode Bahan, Nama Bahan, Konsentrasi (%), Qty Teoritis, Stok Tersedia, Qty Nyata.
    *   **Output Ruahan:** Hasil Ruahan (Bulk Result).
*   **Output (Tabel):** Kode, Tanggal, Batch Record, SM, Pelanggan, Produk, Target PCS, Status.

#### 2. Produksi Filling
*   **Input:** Progress Update (Pilih Mesin, Qty Produksi, Catatan).
    *   **Input Bahan:** Bahan Ruahan (Stok Tersedia, Qty Pakai), Bahan Kemas Primer (Kode Barang, Stok Tersedia, Qty Pakai).
*   **Output (Tabel):** Kode, Tanggal, SF, Batch Record, Pelanggan, Produk, Target, Status.

#### 3. Produksi Packaging
*   **Input:** Progress Update (Pilih Jadwal SP, Kode Jadwal, Tanggal, Target, Hasil Aktual, Catatan).
*   **Output (Tabel):** Kode, Tanggal, Batch Record, Pelanggan, Produk, Target, Status.

---

### Efficiency & Architecture Analysis (Produksi)
1.  **Stage Interlock:** Produksi Filling secara otomatis akan mengunci "Bahan Ruahan" dari hasil Produksi Mixing. Jika Mixing belum selesai atau hasil ruahan nol, Filling tidak bisa dimulai.
2.  **Upscale Intelligence:** Sistem secara otomatis menghitung "Qty Teoritis" untuk setiap bahan baku di tabel Mixing berdasarkan persentase Upscale yang diinput pada tahap Penjadwalan.
3.  **Traceability:** Setiap bahan (Baku/Kemas) yang digunakan dalam eksekusi akan tercatat pengurangannya secara otomatis dari gudang terkait, lengkap dengan histori pemakaian per Batch Record.

---

## 4. Technical Dependencies Summary
*   **Security:** CSRF protection mandatory on all state-changing operations.
*   **Validation:** Real-time stock availability check and Manager PIN authorization for critical actions.
*   **Data Consistency:** Standardized decimal precision (2-4 places) across all modules.
*   **Relational Integrity:** Strong linkage between Batch Record -> Schedule -> Production Output.
