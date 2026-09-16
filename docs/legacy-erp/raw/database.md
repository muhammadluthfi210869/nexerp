### FASE 1: Membangun "Jantung Finansial" (Prioritas Absolut)
- [x] **PHASE 1: THE FINANCIAL HEART (Centralization)**
    - *Goal:* Unified Invoice & Ledger.
    - *Status:* COMPLETED.
    - *Key Action:* Merged `SalesInvoice`, `Bill`, and `Invoice` into a single, polymorphic `Invoice` model. Linked all operational docs (PO, SO, WO) to this core.

**2. Integrasi 3-Way Matching (Procurement to Pay)**
*   **Masalah:** Gudang terima barang (`WarehouseInbound`), tapi Finance tidak tahu kapan harus bayar *supplier* karena tidak ada tagihan otomatis.
*   **Perbaikan:** Buat aturan *database*: Saat status `WarehouseInbound` berubah menjadi `APPROVED` (barang fisik diterima), sistem **wajib** menghasilkan baris baru di tabel `Invoice` (tipe `PAYABLE`) yang diikat ke `PurchaseOrder` tersebut.

**3. Penghapusan "Shadow Finance" di Modul Operasional**
*   **Masalah:** R&D dan Sales bisa "memverifikasi" pembayaran sendiri (`financialStatus`, `isPaymentVerified`).
*   **Perbaikan:** Hapus kolom-kolom ini dari `SalesOrder` dan `SampleRequest`. Status pembayaran harus menjadi *computed property* (hasil kalkulasi) yang ditarik dari total nilai di tabel `Payment` yang terikat ke `Invoice`. Hanya divisi Finance yang boleh menyentuh tabel `Payment`.

**4. Kewajiban Relasi Jurnal Keuangan (The Ledger Rule)**
*   **Masalah:** Tabel `JournalEntry` tidak terikat ke transaksi fisik apa pun.
*   **Perbaikan:** Tambahkan kolom `sourceDocumentType` dan `sourceDocumentId` pada `JournalEntry`. Setiap transaksi (`Payment`, `StockAdjustment`, `SalesReturn`) harus memiliki *Foreign Key* ke jurnal agar bisa diaudit.

---

### FASE 2: Mengunci Integritas Rantai Pasok (HPP & Valuasi)
Tanpa fase ini, perusahaan tidak akan pernah tahu apakah mereka untung atau rugi.

**5. Rekaman Harga Berbasis Waktu (Snapshot HPP)** [COMPLETED]
*   **Masalah:** Anda mencatat *kuantitas* material yang dipakai produksi, tapi tidak mencatat harganya *pada saat itu*, sehingga perhitungan Harga Pokok Produksi (HPP) menjadi halusinasi.
*   **Perbaikan:** Di dalam tabel `InventoryTransaction` dan `ProductionLog`, tambahkan kolom wajib `unitValueAtTransaction`. Saat barang ditarik, sistem harus mengambil nilai dari `MaterialValuation` saat ini dan merekamnya mati secara permanen di transaksi tersebut.

**6. Mencegah "Denormalisasi Bunuh Diri" pada Stok** [COMPLETED]
*   **Masalah:** Kolom `stockQty` ditaruh mentah-mentah di tabel `MaterialItem`. Jika *query* *update* gagal di tengah jalan, stok akan rusak selamanya.
*   **Perbaikan:** Anda bisa mempertahankan kolom ini untuk kecepatan pembacaan (*caching*), namun harus membangun *Trigger Database* atau fungsi yang selalu menghitung ulang total dari tabel `InventoryTransaction` secara berkala (Sinkronisasi).

**7. Menghubungkan Konsumsi Produksi dengan Batch Material (FIFO)** [COMPLETED]
*   **Masalah:** Bagian Produksi menggunakan "Material X", tapi tidak tahu "Batch yang mana" dari gudang.
*   **Perbaikan:** Relasikan `ProductionLog` langsung ke `MaterialInventory` (yang memiliki `batchNumber`), bukan hanya ke `MaterialItem` generiknya.

---

### FASE 3: Pembersihan Kode Sampah & Anti-Pattern [COMPLETED]
Ini untuk mencegah ERP rontok saat terjadi perubahan regulasi eksternal atau skala bisnis.

**8. Dinamisasi Regulasi Pajak dan Mata Uang** [COMPLETED]
*   **Masalah:** Terdapat kode *hardcode* `taxType @default("PPN_11")` dan `currency @default("IDR")`.
*   **Perbaikan:** Buat tabel referensi master `TaxRate` dan `Currency`. Ganti *string* tersebut dengan ID relasional. Jika besok PPN naik jadi 12%, Anda hanya mengubah satu baris di master data, tanpa perlu *maintenance server*.

**9. Membongkar "God Model" di R&D** [COMPLETED]
*   **Masalah:** `SampleRequest` mengurus pendaftaran BPOM dan pembayaran tagihan.
*   **Perbaikan:** Normalisasi model. Keluarkan `bpomProgress` dan biarkan diurus oleh tabel `RegulatoryPipeline`.

**10. Menghapus Praktik "Data Dummy" di Produksi** [COMPLETED]
*   **Masalah:** `FormulaItem` memiliki kolom `isDummy` dan `dummyPrice`.
*   **Perbaikan:** Hapus atribut tersebut. Jika R&D ingin uji coba material baru, wajib daftarkan ke tabel `MaterialItem` dengan status "DRAFT", agar arsitektur *database* tetap suci dari *string* mentah.

---

### FASE 4: Visualisasi & Komunikasi Antar Divisi

**11. Konsolidasi Status Alur Kerja (State Machine)** [COMPLETED]
*   **Masalah:** Terlalu banyak status yang tumpang tindih untuk satu benda (contoh: `LeadStatus`, `LeadState`, `PipelineStage`).
*   **Perbaikan:** Gabungkan seluruh *enum* status tersebut menjadi satu sistem terpusat. Untuk setiap transisi status, catat perubahannya di satu tabel universal `StateTransitionLog` untuk diaudit.

**12. Mengamankan Analitik Dashboard Ekskutif** [COMPLETED]
*   **Masalah:** Gaji (Payroll) dienkripsi dalam format *String*, membuat kalkulasi analitik total beban gaji untuk *dashboard* menjadi berat dan lambat.
*   **Perbaikan:** Buat satu tabel terpisah bernama `FinancialSummaryLedger` yang menyimpan angka nominal dalam bentuk desimal khusus untuk keperluan *dashboard agregat*. Tabel ini tidak berisi rincian "milik siapa", hanya angka total bulanan, sehingga performa *query* tetap tinggi dan kerahasiaan karyawan terjaga.
