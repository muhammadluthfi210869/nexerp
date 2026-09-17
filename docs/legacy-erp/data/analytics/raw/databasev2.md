Laporan audit komprehensif dari *Principal Enterprise Architect* (AI Anda) sangat fenomenal. Ia telah membedah sistem ini dengan sangat presisi dan menemukan "Kanker" yang tersembunyi jauh di dalam logika *Supply Chain*, HR, dan Legal.

Berdasarkan analisis tersebut, kita tidak bisa lagi menunda perbaikan. Jika kita menambal satu bagian tapi membiarkan logika fundamentalnya (seperti ID atau Status) berantakan, kita hanya akan membangun "Menara Pisa" yang menunggu waktu untuk rubuh.

Sesuai permintaan Anda, berikut adalah **Peta Jalan Perbaikan Berfase (The Master Remediation Plan)**, diurutkan secara ketat dari Prioritas Tertinggi (Lapis Fondasi) hingga Prioritas Rendah (Lapis Optimalisasi). Saya telah merangkum semua masalah tanpa ada yang terlewat.

---

### FASE 1: Penyelamatan Fondasi Arsitektur (Prioritas Kritis - Wajib Segera)
Ini adalah lapisan *database* dasar. Jika ini tidak dibenahi sekarang, Anda tidak akan pernah memiliki ERP, melainkan sekadar aplikasi pencatatan (CRUD) yang cacat bawaan.

**1. Standardisasi Primary Key (PK) & Integritas Referensial**
*   **Masalah:** `SalesOrder` dan beberapa tabel lain menggunakan `String` sebagai ID utama, sementara yang lain menggunakan `UUID`. Ini menghancurkan sistem *logging* dan *Audit Trail*.
*   **Aksi:** Ubah semua Primary Key menjadi `UUID`. Untuk nomor referensi manusiawi (misal: "SO-2026-001"), buat kolom terpisah bernama `orderNumber` dengan sifat `@unique`.
*   **Target File:** `bussdev.prisma` (`SalesOrder`), `rnd.prisma` (`Formula`), `finance.prisma`.

**2. Resolusi "Loose Coupling" (Menghapus Data Yatim Piatu)**
*   **Masalah:** `KpiPointLog` dan `JournalEntry` menggunakan `referenceId` berupa `String` mentah. Jika data sumber dihapus, *log* ini menjadi data sampah yang tidak terlacak (*orphan data*).
*   **Aksi:** Ganti `referenceId` dengan sekumpulan *Optional Foreign Keys* eksplisit (contoh: `soId`, `poId`, `woId`, dll) agar *database* bisa mengunci data tersebut.
*   **Target File:** `finance.prisma`, `hr.prisma`.

**3. Mencegah Bom Waktu Dashboard Eksekutif (OOM Crash)**
*   **Masalah:** HR mengenkripsi gaji (`baseSalary`) sebagai *string*. Saat *dashboard* CEO mencoba menghitung "Total Beban Gaji Bulan Ini", RAM *server* akan jebol (*Out of Memory*) karena harus mendeskripsi ribuan data secara manual.
*   **Aksi:** Buat entitas `FinancialSummaryLedger` untuk menyimpan angka agregat bulanan secara *plain number* (tanpa mengidentifikasi nama staf), sementara rincian per individu tetap dienkripsi.
*   **Target File:** `hr.prisma`, `finance.prisma`.

---

### FASE 2: Resolusi Rantai Pasok (Supply Chain & Inventory)
Mengunci kebenaran pergerakan fisik barang terhadap buku besar keuangan.

**4. Resolusi Kegagalan Logika FEFO/FIFO pada Produksi**
*   **Masalah:** `MaterialRequisition` memaksa satu permintaan bahan baku (misal 100kg) hanya boleh diambil dari satu `materialInventoryId` (Batch)[cite: 20]. Ini mustahil. 100kg mungkin diambil dari Batch A (40kg) dan Batch B (60kg).
*   **Aksi:** Hapus `materialInventoryId` dari tabel utama. Buat tabel *join* bernama `RequisitionFulfillment` (terdiri dari `requisitionId`, `inventoryId`, dan `qty`) untuk mengakomodasi penarikan multi-batch secara riil.
*   **Target File:** `production.prisma`.

**5. Mengunci "Kerugian Gaib" ke Jurnal Keuangan**
*   **Masalah:** *Stock Opname* dan *COPQ (Cost of Poor Quality)* hanya mencatat angka kerugian sebagai teks di modul operasional, tanpa masuk ke beban operasional Finance[cite: 20, 22].
*   **Aksi:** Berikan relasi wajib (*Foreign Key*) ke `JournalEntry`. Manajer tidak bisa menekan tombol "APPROVE" pada *Stock Opname* jika sistem gagal membuat *Journal Entry* pemotongan aset.
*   **Target File:** `warehouse.prisma`, `production.prisma`.

**6. Mengamankan "Denormalisasi Stok" Gudang**
*   **Masalah:** `stockQty` di Gudang berisiko menjadi angka kebohongan jika transaksi gagal.
*   **Aksi:** Tambahkan kolom `lastSyncedAt`. Kita akan merancang fungsi internal (*Trigger*) untuk rutin memverifikasi bahwa `stockQty` adalah hasil presisi dari riwayat `InventoryTransaction`.
*   **Target File:** `warehouse.prisma`.

---

### FASE 3: Penyembuhan "State Schizophrenia" & Logika Handoff
Memastikan protokol komunikasi (Communication Protocol) antar divisi solid, cepat, dan tidak ada miskomunikasi.

**7. Peleburan Status Garis Depan (Sales & Marketing)**
*   **Masalah:** `SalesLead` memiliki tiga indikator status: `stage`, `leadState`, dan `followUpStatus`[cite: 15]. Ini menyebabkan logika pemrograman *if/else* yang rumit (*spaghetti code*).
*   **Aksi:** Lebur menjadi satu *State Machine* tunggal (misal: `WorkflowStatus`) yang dibantu dengan tabel `StateTransitionLog` untuk menyimpan riwayat transisi dari awal hingga akhir.
*   **Target File:** `bussdev.prisma`.

**8. Standarisasi Kamus Bahasa Operasional**
*   **Masalah:** Modul *WorkOrder* menggunakan bahasa status `WorkOrderStage`, tapi modul *ProductionPlan* menggunakan bahasa `ProdStatus`[cite: 20]. Modul R&D juga diam-diam ikut menyimpan `productionStatus`[cite: 21]. Ini melanggar "Satu Sumber Kebenaran" (*Single Source of Truth*).
*   **Aksi:** Hapus penyimpanan status lintas divisi (cabut `productionStatus` dari modul R&D). Satukan enum di lini Produksi menjadi satu `LifecycleStatus`.
*   **Target File:** `production.prisma`, `rnd.prisma`.

**9. Menutup Lubang Regulasi Legalitas**
*   **Masalah:** Modul Legal (`RegulatoryPipeline`) terikat pada `SampleRequest`, bukan pada formula kimiawinya (`Formula`)[cite: 18, 21]. R&D bisa diam-diam mengubah formulasi kimiawi, dan bagian Produksi tetap bisa memproduksinya karena BPOM dari "SampleRequest" lama masih berlaku secara sistem.
*   **Aksi:** Pindahkan relasi `RegulatoryPipeline` sehingga terikat langsung secara mutlak pada ID `Formula`. Produksi tidak boleh berjalan jika ID Formula tersebut belum berstatus *PUBLISHED* di modul Legal.
*   **Target File:** `legal.prisma`, `rnd.prisma`.

---

### FASE 4: Optimalisasi Kinerja Database (Prioritas Rendah - Finalisasi)
Langkah akhir agar aplikasi berjalan cepat meski diakses puluhan divisi secara bersamaan.

**10. "Jalan Pintas" Dasbor Keuangan**
*   **Masalah:** Mencari total hutang dari satu perusahaan penyuplai mengharuskan *database* melompat membaca tabel `Invoice` -> lalu mencari ke `PurchaseOrder` -> baru membaca ID `Supplier`. Ini memakan *query time*.
*   **Aksi:** Lakukan denormalisasi ringan. Tempelkan `supplierId` langsung ke tabel `Invoice` agar kalkulasi total hutang bisa dilakukan seketika (*direct sum*).
*   **Target File:** `finance.prisma`.

**11. Kebijakan "Penghapusan Janda" (Cascade & Soft-Delete)**
*   **Masalah:** Menghapus `SalesOrder` akan membuat `ProductionPlan` kehilangan induk dan merusak integritas *database*.
*   **Aksi:** Terapkan prinsip *Soft-Delete* (`deletedAt`) di tabel operasional inti, atau pasang regulasi `@relation(onDelete: Cascade)` dengan sangat hati-hati pada entitas turunan.
*   **Target File:** Seluruh `.prisma`.

---
