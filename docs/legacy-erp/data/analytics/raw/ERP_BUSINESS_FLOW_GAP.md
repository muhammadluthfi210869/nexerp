# ERP BUSINESS FLOW GAP ANALYSIS
**Document Version:** 1.0 — Operational Gaps, Integrity Flaws & Architectural Risks  
**Enterprise:** PT. Karya Impian Laboratoris (Dreamlab - Toll Manufacturing Kosmetik)  
**Classification Severity Scale:**
* **P0:** Critical Data Corruption, Financial Loss, or Complete Data Loss Risk.
* **P1:** Critical Operational Function Missing, Broken, or Disconnected.
* **P2:** Important Operational Inefficiency, Mock Data Dependency, or State Inconsistency.
* **P3:** Minor Usability Flaw, Path Inconsistency, or Non-Blocking Improvement.

---

## 1. Summary of Identified Gaps

* **P0 Findings:** 1 finding
* **P1 Findings:** 3 findings
* **P2 Findings:** 3 findings
* **P3 Findings:** 1 finding

---

## 2. Detailed Gap Records

### GAP-01
* **ID:** GAP-01
* **SEVERITY:** P0
* **MODULE:** Finance & Accounting
* **OLD BEHAVIOR:** Old ERP menyimpan input Jurnal Umum langsung ke database MySQL melalui form submit `POST /general-journal/save`, sehingga data debit/kredit langsung tercatat di tabel jurnal dan mengupdate mutasi buku besar.
* **NEW BEHAVIOR:** Halaman Jurnal Umum di New ERP (`/finance/jurnal-umum/page.tsx` dan `/finance/general-journal/page.tsx`) hanya memanipulasi data di memori browser lokal (`useState(INITIAL_JOURNALS)`). Tidak ada panggilan `fetch()` atau `api.post()` ke backend sama sekali.
* **EXPECTED:** Setiap baris jurnal umum manual yang disimpan user wajib dikirim ke backend NestJS (`POST /api/finance/journal`), divalidasi balance `Sum(Debit) == Sum(Credit)`, dan disimpan secara permanen ke tabel database PostgreSQL `JournalEntry` dan `JournalLine`.
* **PROBLEM:** Frontend Jurnal Umum terputus dari backend (`journal-engine.service.ts`). Jurnal yang diinput staf akuntan akan **hilang total** begitu halaman di-refresh!
* **BUSINESS IMPACT:** Resiko fatal hilangnya data pembukuan akuntansi, laporan keuangan tidak mencerminkan penyesuaian akhir bulan, dan kegagalan audit kepatuhan perpajakan.
* **EVIDENCE:**
  * File `frontend/src/app/(dashboard)/finance/jurnal-umum/page.tsx` baris 77–85:
    ```typescript
    const INITIAL_JOURNALS: JournalEntry[] = [ ... ];
    const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
    ```
  * Inspeksi grep pada file tersebut menunjukkan **0 panggilan API / fetch**.
  * File backend `backend/src/modules/finance/journal-engine.service.ts` sudah siap menerima entri jurnal namun tidak pernah dipanggil oleh halaman ini.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Hubungkan form submit jurnal umum ke endpoint backend `POST /api/finance/journal`, hilangkan hardcoded `INITIAL_JOURNALS`, dan muat data riil menggunakan query ke Prisma model `JournalEntry`.

---

### GAP-02
* **ID:** GAP-02
* **SEVERITY:** P1
* **MODULE:** Production & Warehouse (Finished Goods Inbound)
* **OLD BEHAVIOR:** Pada Old ERP, setelah Produksi Packaging selesai (`/production-packaging`), staf gudang harus membuka menu Stok/Penyesuaian secara manual untuk menginput penambahan stok barang jadi karena tidak ada integrasi otomatis.
* **NEW BEHAVIOR:** Di New ERP, modul Produksi Packaging mencatat `ProductionStepLog` dengan status `COMPLETED`, namun tidak terdapat event listener atau service call yang secara otomatis membuat record mutasi penambahan barang jadi di model `FinishedGood` atau `MaterialInventory` di gudang barang jadi.
* **EXPECTED:** Ketika supervisor menutup SPK Produksi Packaging dengan status `COMPLETED`, sistem harus secara otomatis mengeksekusi mutasi inventori masuk (Auto-Receipt Finished Goods) ke Gudang Barang Jadi sesuai jumlah pcs yang lolos QC, serta mencatat nomor batch dan tanggal kadaluwarsa produk.
* **PROBLEM:** Aliran data antara Lantai Produksi (Shopfloor) dan Gudang Barang Jadi terputus (Broken Handoff). Kuantitas fisik barang yang sudah dikemas tidak tercermin di saldo sistem gudang.
* **BUSINESS IMPACT:** Staf logistik tidak dapat menerbitkan Surat Jalan (Delivery Order) karena stok barang jadi di sistem masih tercatat 0 atau belum bertambah, menyebabkan keterlambatan pengiriman ke brand owner.
* **EVIDENCE:**
  * File `backend/src/modules/production/production.service.ts` dan `backend/src/modules/warehouse/warehouse.service.ts`.
  * Tidak ada event handler `@OnEvent('production.packaging.completed')` di modul warehouse yang meng-kredit saldo `FinishedGood`.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Buat event-driven handoff atau database transaction atomik saat `WorkOrder` / `ProductionSchedule` berstatus `COMPLETED` untuk otomatis menambah inventori barang jadi di gudang terkait.

---

### GAP-03
* **ID:** GAP-03
* **SEVERITY:** P1
* **MODULE:** Finance & User Persona Architecture
* **OLD BEHAVIOR:** Seluruh user mengakses satu set halaman akuntansi standar: `/general-journal`, `/other-payment`, `/other-deposit`, `/report-general-ledger`, `/report-profit-loss`.
* **NEW BEHAVIOR:** Di New ERP terdapat dua set rute paralel yang saling menduplikasi:
  * Rute Bahasa Indonesia: `/finance/jurnal-umum`, `/finance/kas-bank-keluar`, `/finance/kas-bank-masuk`, `/finance/buku-besar`, `/finance/laba-rugi`.
  * Rute Bahasa Inggris: `/finance/general-journal`, `/finance/cash-out`, `/finance/cash-in`, `/finance/ledger`, `/finance/reports`.
  * Sidebar Persona Superadmin mengarahkan ke rute Bahasa Inggris, sedangkan Persona Finance mengarahkan ke rute Bahasa Indonesia!
* **EXPECTED:** Sistem harus memiliki satu rute kanonikal tunggal untuk setiap entitas akuntansi yang digunakan bersama oleh seluruh persona pengguna.
* **PROBLEM:** Fragmentasi rute dan kode duplikasi. Dua orang dengan persona berbeda yang mengoperasikan akuntansi membuka dua codebase dan UI berbeda yang tidak saling terhubung.
* **BUSINESS IMPACT:** Kebingungan operasional, perbedaan tampilan angka finansial antar user, dan peningkatan beban maintenance kode hingga dua kali lipat.
* **EVIDENCE:**
  * File `frontend/src/components/layout/Sidebar.tsx`:
    * Baris 221–232 (FINANCE_SECTIONS): mengarah ke `/finance/jurnal-umum`, `/finance/buku-besar`, dll.
    * Baris 688–695 (SUPERADMIN_SECTIONS): mengarah ke `/finance/general-journal`, `/finance/ledger`, dll.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Konsolidasikan rute keuangan menjadi satu set kanonikal (pilih salah satu, e.g. terminologi resmi D365/Indonesian standard), dan redirect rute duplikat.

---

### GAP-04
* **ID:** GAP-04
* **SEVERITY:** P1
* **MODULE:** Commercial & Finance Navigation
* **OLD BEHAVIOR:** Old ERP memiliki menu Laporan Penjualan di bawah grup Dasbor (`/dashboard-sales-product`).
* **NEW BEHAVIOR:** Pada `Sidebar.tsx`, persona Finance memiliki item menu: `{ name: "Report Penjualan", href: "/finance/report-penjualan", icon: BarChart3 }`. Namun, file halaman fisik `frontend/src/app/(dashboard)/finance/report-penjualan/page.tsx` **TIDAK ADA**.
* **EXPECTED:** Setiap tautan di sidebar wajib mengarah ke halaman yang valid dan dapat diakses.
* **PROBLEM:** Mengklik menu "Report Penjualan" di sidebar persona Finance akan menghasilkan halaman error **404 Not Found**.
* **BUSINESS IMPACT:** Gangguan operasional user finance saat ingin mencetak rekap omzet penjualan bulanan.
* **EVIDENCE:**
  * File `frontend/src/components/layout/Sidebar.tsx` baris 199.
  * Verifikasi filesystem: Direktori `frontend/src/app/(dashboard)/finance/report-penjualan` tidak ditemukan.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Buat page kanonikal `/finance/report-penjualan` atau arahkan link tersebut ke laporan penjualan komersial yang sudah ada di `/commercial/reports` atau `/sales`.

---

### GAP-05
* **ID:** GAP-05
* **SEVERITY:** P2
* **MODULE:** Warehouse & Analytics
* **OLD BEHAVIOR:** Old ERP menyediakan laporan mutasi barang dan laporan stok sederhana tanpa fitur analitik cerdas.
* **NEW BEHAVIOR:** New ERP mengiklankan fitur analisis kecerdasan stok (ABC Analysis, Dead Stock, Fast/Slow Movers) pada arsitektur warehouse. Namun backend service `StockIntelligenceService` hanya mengembalikan array kosong statis (`return []`).
* **EXPECTED:** Service backend harus menghitung klasifikasi ABC berdasarkan Pareto nilai transaksi persediaan (80/15/5) dari histori mutasi riil di database PostgreSQL.
* **PROBLEM:** Fitur analitik inventori belum diimplementasikan di backend (Orphan / Stub Service).
* **BUSINESS IMPACT:** Tim SCM tidak mendapatkan wawasan barang yang lambat bergerak (slow-moving) dan risiko material kadaluwarsa tidak terdeteksi secara otomatis.
* **EVIDENCE:**
  * File `backend/src/modules/warehouse/services/stock-intelligence.service.ts` baris 8–13:
    ```typescript
    async getABCAnalysis(): Promise<any[]> { return []; }
    async getDeadStockItems(): Promise<any[]> { return []; }
    async getFastMovers(_limit?: number): Promise<any[]> { return []; }
    ```
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Bangun query agregasi SQL/Prisma riil pada tabel `InventoryTransaction` untuk menghitung perputaran stok (Stock Turnover Ratio) dan klasifikasi ABC.

---

### GAP-06
* **ID:** GAP-06
* **SEVERITY:** P2
* **MODULE:** SCM / R&D (HPP Request Board) & CRM
* **OLD BEHAVIOR:** Form Permintaan HPP di Old ERP mengambil master pelanggan dan formula yang tersimpan di database.
* **NEW BEHAVIOR:** Komponen `HppRequestBoard.tsx` di New ERP menggunakan data tiruan (`MOCK_CUSTOMERS`, `MOCK_PRODUCTS`, `MOCK_FORMULAS`). Begitu pula di modul CRM Client Manager (`DUMMY_SAMPLE_LEADS`, dll).
* **EXPECTED:** Seluruh opsi dropdown dan kartu Kanban wajib bersumber dari API backend yang membaca tabel PostgreSQL `Customer`, `Formula`, dan `SalesLead`.
* **PROBLEM:** Mock data terisolasi di dalam komponen frontend, sehingga data pelanggan dan produk baru yang dibuat user tidak muncul di papan permintaan HPP.
* **BUSINESS IMPACT:** Disparitas data antar modul; R&D dan SCM tidak melihat permintaan HPP yang diajukan oleh tim sales.
* **EVIDENCE:**
  * File `frontend/src/app/(dashboard)/scm/hpp-requests/HppRequestBoard.tsx` baris 24–45.
  * File `frontend/src/app/(dashboard)/bussdev/client-manager/page.tsx` baris 30–60.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Ganti inisialisasi array mock dengan hook `useQuery` yang memanggil endpoint backend `/api/bussdev/customers` dan `/api/rnd/formulas`.

---

### GAP-07
* **ID:** GAP-07
* **SEVERITY:** P2
* **MODULE:** Finance Command Center
* **OLD BEHAVIOR:** Old ERP menampilkan dashboard keuangan dari query database MySQL langsung. Jika database error, sistem memunculkan pesan error PHP / 500.
* **NEW BEHAVIOR:** Di New ERP, ketika terjadi kegagalan koneksi API, dashboard keuangan secara otomatis beralih menampilkan konstanta tiruan (`FALLBACK_AR`, `FALLBACK_AP`, `FALLBACK_REVENUE`, dll) tanpa menampilkan indikator peringatan visual bahwa data tersebut bukan data riil.
* **EXPECTED:** Jika terjadi kegagalan fetching data backend, UI harus menampilkan komponen Error State atau Disconnected Alert yang jelas, bukan diam-diam menyamarkan error dengan data fiktif.
* **PROBLEM:** Halusinasi data di sisi antarmuka pengguna (Silent Fallback Misrepresentation).
* **BUSINESS IMPACT:** Risiko fatal jika manajemen mengambil keputusan komitmen belanja atau pencairan dividen berdasarkan angka kas dan piutang fiktif dari konstanta fallback.
* **EVIDENCE:**
  * File `frontend/src/app/(dashboard)/finance/dashboard/page.tsx` baris 185–220:
    ```typescript
    const revenueData = apiData?.revenue || FALLBACK_REVENUE;
    const cashBalance = apiData?.cash || FALLBACK_CASH;
    ```
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Hapus konstanta fallback fiktif dan ganti dengan penanganan error state yang transparan (misal: `DnaErrorState` dengan tombol `Retry Fetching`).

---

### GAP-08
* **ID:** GAP-08
* **SEVERITY:** P3
* **MODULE:** Master & System Navigation
* **OLD BEHAVIOR:** Menu Hak Akses berada di `/role-manage`.
* **NEW BEHAVIOR:** Di `Sidebar.tsx`, tautan menu Hak Akses untuk Superadmin tertulis `href: "/master/roles"`. Namun rute fisik Next.js berada di `/system/roles`.
* **EXPECTED:** Tautan navigasi harus konsisten mengarah ke rute halaman yang tepat.
* **PROBLEM:** Mismatch path navigasi (`/master/roles` vs `/system/roles`).
* **BUSINESS IMPACT:** Potensi error navigasi atau ketergantungan pada rewrite middleware yang tidak perlu.
* **EVIDENCE:**
  * File `frontend/src/components/layout/Sidebar.tsx` baris 541: `href: "/master/roles"`.
  * Direktori fisik: `frontend/src/app/(dashboard)/system/roles/page.tsx`.
* **RECOMMENDED DIRECTION (JANGAN IMPLEMENTASI SEKARANG):** Ubah href di `Sidebar.tsx` baris 541 menjadi `/system/roles`.
