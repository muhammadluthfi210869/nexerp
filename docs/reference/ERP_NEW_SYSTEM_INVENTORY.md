# ERP NEW SYSTEM INVENTORY (NexERP / Porto Aureon)
**Document Version:** 1.0 — Target System Architecture & Module Audit  
**Audit Context:** Fase 1 — Complete ERP Discovery & Functional Parity Mapping  
**Target Enterprise:** PT. Karya Impian Laboratoris (Dreamlab - Toll Manufacturing Kosmetik & Skincare)  
**Codebase Repositories:** Frontend (`Next.js 15 App Router` in `frontend/`) + Backend (`NestJS 11 Modular` in `backend/`) + Database (`PostgreSQL / Prisma ORM` with 110 Models and 69 Enums).  
**Baseline Principle:** ERP Baru dirancang jauh lebih modern, terstruktur, berbasis peran (persona-based role access), memiliki traceability kuat (Golden Thread), serta mengintegrasikan digital verification dan multi-channel commercial pipelines.

---

## 1. Technical Architecture Overview

* **Frontend:** Next.js 15 with React Server & Client Components, Tailwind CSS, Lucide Icons, Shadcn UI / Custom DNA Component Design System (`DnaPageContainer`, `DnaPageHeader`, `DnaKpiGrid`, `TableWrapper`, etc.).
* **Backend:** NestJS 11 microservice/modular architecture comprising 33 functional domain modules (`scm`, `warehouse`, `production`, `rnd`, `crm`, `commercial`, `finance`, `qc`, `legality`, `marketing`, `lead-capture`, `executive`, `system`, etc.).
* **Data Persistence:** Prisma 7 ORM connected to PostgreSQL. Total database entities: **110 Models**, **69 Enums**.
* **Integrations:**
  * Kommo CRM Auto-Sync Webhook (`kommo-auto-sync.service.ts`)
  * WhatsApp Cloud API WABA Webhook (`wa-webhook.service.ts`)
  * Meta Ads Graph API Engine (`meta-graph.service.ts`)
  * Document Automation & PDF Engine (`pdf-engine.service.ts`)
  * Sentry Error Monitoring & Telemetry
  * Real-Time Socket.IO Notification Gateway.

---

## 2. Persona-Based Navigation Hierarchy (Sidebar System)

Akses navigasi diatur secara granular melalui matriks hak akses persona di `frontend/src/components/layout/Sidebar.tsx`:

```text
NEXERP TARGET ARCHITECTURE
├── 1. DIGITAL MARKETING PERSONA (Revita)
│   ├── Dasbor: Dashboard (/marketing/dashboard)
│   ├── Marketing & CRM: OmniCRM Core (/marketing/omni-crm), Lead Capture (/marketing/omni-crm/lead-capture)
│   ├── Konten & Media: Social Media (/marketing/social-tracker)
│   └── Task Management: Management Task (/marketing/management-task)
├── 2. DESIGN & CREATIVE PERSONA (Edi)
│   ├── Dasbor: Workspace Design (/design/artwork-approval)
│   ├── Kreatif & Desain: Artwork Approval & Riwayat (/design/artwork-approval), Creative Board (/creative/board)
│   └── Kendali & Tracking: Tracking Progress (/scm/checklist-progress), Tracking Checklist (/project-control/checklist-tracking)
├── 3. FINANCE & ACCOUNTING PERSONA
│   ├── Dasbor: Command Center (/finance/dashboard)
│   ├── Operasional Keuangan:
│   │   ├── Hutang Usaha (AP): Vendor Master (/master/vendors), Faktur Pembelian (/finance/faktur-pembelian), DP Pembelian (/finance/dp-pembelian), Bayar Pembelian (/finance/bayar-pembelian), AP Aging & QC Toleransi (/finance/ap-aging)
│   │   ├── Piutang Usaha (AR): Customer Master (/master/customers), Faktur Penjualan (/finance/faktur-penjualan), DP Penjualan (/finance/dp-penjualan), Report Penjualan (/finance/report-penjualan), AR Aging & Collections (/finance/ar-aging)
│   │   └── Kas, Bank & Dana: Kas Bank Masuk (/finance/kas-bank-masuk), Kas Bank Keluar (/finance/kas-bank-keluar), Rekonsiliasi Bank (/finance/rekonsiliasi), Pengajuan Dana (/finance/pengajuan-dana)
│   ├── Akuntansi & Laporan: Jurnal Umum (/finance/jurnal-umum), Laporan Keuangan (/finance/buku-besar, /finance/laba-rugi), Aset Tetap & Depresiasi (/finance/aset-tetap)
│   └── Master & Setup: Chart of Accounts (/finance/accounting/coa), CoA Jurnal Otomatis (/finance/accounting/auto-journal)
├── 4. PURCHASE & SCM PERSONA
│   ├── Dasbor: Dashboard SCM (/scm/dashboard), Dashboard Gudang (/warehouse), Dashboard Produksi (/production)
│   ├── Master Data: Barang (/master/goods), Kategori Supplier (/master/categories), Supplier (/master/suppliers)
│   ├── Umum & Tracking: Checklist Progress (/scm/checklist-progress), Checklist Tracking (/project-control/checklist-tracking), Checklist Tracking CRM (/qc/checklist/tracking)
│   ├── Operasional SCM: Permintaan Pembelian (/scm/purchase-requests), Pembelian ~ (/scm/purchase-approval), Faktur Pembelian (/scm/faktur-pembelian), DP Pembelian (/scm/purchasing/down-payment), Bayar Pembelian (/finance/bayar-pembelian), Kebutuhan Barang (/scm/kebutuhan-barang), Permintaan Barang (/scm/permintaan-barang), Permintaan HPP (/scm/hpp-requests), Stok Opname (/warehouse/opname)
│   ├── Barang Masuk: Pembelian Masuk (/scm/barang-masuk/pembelian-masuk), Retur Penjualan (/scm/barang-masuk/retur-penjualan)
│   ├── Barang Keluar: Transfer Barang (/warehouse/transfers), Pengiriman Barang (/warehouse/release), Retur Pembelian (/scm/purchase-returns)
│   └── Laporan: Stok (/warehouse/stok), Mutasi Barang (/warehouse/mutasi-stok), Stok Valuation (/warehouse/stok-valuation)
├── 5. BUSDEV & COMMERCIAL PERSONA
│   ├── Sales Pipeline (CRM): Buku Tamu (/crm/buku-tamu), Client Sample (/crm/client-sample), Client Produksi (/crm/client-produksi), Client RO (/crm/client-ro), Client Lost (/crm/client-lost)
│   ├── Penjualan: Penjualan Sample (/bussdev/sample-sales), Bayar Sample (/finance/bayar-sample), Penjualan (/sales), Retur Penjualan (/bussdev/retur-penjualan), DP Penjualan (/finance/dp-penjualan), Faktur Penjualan (/finance/faktur-penjualan), Bayar Penjualan (/finance/bayar-penjualan), AR Aging Piutang (/bussdev/ar-aging)
│   ├── Master & Data: Kelola Pelanggan (/bussdev/kelola-pelanggan), Permintaan HPP (/scm/hpp-requests), Barang, Supplier, Kategori Supplier
│   ├── Kendali & Tracking: Checklist Progress (/scm/checklist-progress), Checklist Tracking (/project-control/checklist-tracking)
│   └── Laporan BusDev: Buku Tamu (/crm/buku-tamu), Follow Up Pelanggan (/bussdev/follow-up-pelanggan)
├── 6. R&D & FORMULASI PERSONA
│   ├── Dasbor: Formula Analytics (/rnd/dashboard), Active Pipeline (/rnd/pipeline), D. Jadwal Produksi (/production/schedule), Project Control (/project-control)
│   ├── Pra Produksi: Sample Inbox PNF (/rnd/inbox), Kelola Formulasi (/rnd/kelola-formulasi), Penyesuaian Formulasi (/rnd/penyesuaian-formulasi), Formulasi (/rnd/formulasi), Permintaan HPP (/rnd/permintaan-hpp), Batch Record (/pra-produksi/batch-record), Jadwal Mixing (/pra-produksi/jadwal-mixing), Jadwal Filling (/pra-produksi/jadwal-filling), Jadwal Packaging (/pra-produksi/jadwal-packaging)
│   ├── Produksi: Produksi Mixing (/produksi/mixing), Produksi Filling (/produksi/filling), Produksi Packaging (/produksi/packaging)
│   ├── Revisi & Tracking: Revision Tracker (/rnd/revision-tracker)
│   ├── Daily Tracking & Project: Daily Tracking (/rnd/daily-tracking), Project Monitoring (/rnd/project-monitoring)
│   └── Operasional Lab: Penjualan Sample (/bussdev/sample-sales), Kebutuhan Barang Lab (/scm/kebutuhan-barang), Permintaan Pembelian (/scm/purchase-requests), Stok Barang (/warehouse/stok)
└── 7. SUPERADMIN / DIRECTORS
    ├── Full Unrestricted Access across all above modules
    ├── Executive Cockpit (/executive/dashboard) & KPI SLA (/executive/kpi-accountability)
    ├── Master Hak Akses & Users (/system/roles, /master/personnel)
    └── System Audit Ledger (/system/audit-ledger) & Error Monitoring (/system/error-dashboard)
```

---

## 3. Detailed Page-by-Page Audit of Target ERP (NexERP)

### 3.1 MODULE: MASTER DATA & FONDASI

#### PAGE 1: Master Barang (Goods Master)
* **Route / File:** `/master/goods` (`frontend/src/app/(dashboard)/master/goods/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL (Locked under Purchase Module Contract).
* **Purpose:** Katalog komprehensif seluruh material maklon (Bahan Baku Kimia, Kemasan Primer, Kemasan Sekunder, Bahan Pembantu, Ruahan, Barang Jadi) dengan pelacakan fisik kondisi Bagus vs Reject/Cacat.
* **Backend Service & Prisma Model:** `backend/src/modules/master/master.service.ts`, Model `MaterialItem` & `MaterialInventory`.
* **Inputs & Controls:**
  * Filter Kategori (Bahan Baku, Kemasan Primer, Kemasan Sekunder, Bahan Pembantu, Produk Jadi).
  * Filter Periode Bulan & Tahun.
  * Search Bar (Kode SKU, Nama Bahan, No. CAS, Supplier Asal).
  * Modal Create/Edit Barang: Kode, Nama, Kategori, Satuan UoM, Safety Stock, Lead Time Vendor, Standar Harga Beli (Rp), Suhu Penyimpanan (Ruang AC, Suhu Kamar, Cold Room).
* **Outputs:**
  * Tabel Data: SKU, Nama Barang, Kategori, Satuan, Stok Fisik Total, Stok Kondisi Bagus, Stok Cacat/Reject, Rata-rata Harga Beli, Status Buffer.
  * Drawer Histori Pembelian Supplier: Riwayat PO terakhir yang memuat barang tersebut, tanggal beli, harga unit, dan nama vendor.
* **Actions:** Tambah Barang, Edit SKU, Buka Drawer Histori PO, Export Excel.

#### PAGE 2: Master Supplier (Vendor Master)
* **Route / File:** `/master/suppliers` (`frontend/src/app/(dashboard)/master/suppliers/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Database vendor penyedia bahan dan kemasan dengan segmentasi khusus **4 Pilar Kategori Industri Kosmetik**:
  1. Bahan Baku Kimia (Active Ingredients, Base, Fragrance)
  2. Kemasan Primer (Botol Kaca, Pot Krim, Tube)
  3. Kemasan Sekunder (Box Cetak, Brosur, Stiker Etiket)
  4. Bahan Pembantu (Plastik Shrink, Karton Master, Solasi, Sanitizer)
* **Backend Service & Prisma Model:** Model `Supplier`.
* **Inputs:** Nama Supplier, Kategori 4 Pilar, Kontak PIC, Telepon, Email, Alamat, Termin Pembayaran (TOP Days), Status Pajak (PKP / Non-PKP), Bank & No Rekening Vendor.
* **Outputs:** Kartu profil supplier, rating performa ketepatan waktu & mutu kemasan.

#### PAGE 3: Master Pelanggan (Customer Master / Kelola Pelanggan)
* **Route / File:** `/bussdev/kelola-pelanggan` & `/master/customers`
* **Purpose:** Pengelolaan portofolio brand owner maklon, kontak owner, legalitas kontrak (MoU), dan assignment ke BusDev representative.
* **Backend Service & Prisma Model:** `bussdev.service.ts`, Model `Customer` & `SalesLead`.

---

### 3.2 MODULE: SCM & PROCUREMENT (PURCHASING)

#### PAGE 4: Buat Pembelian & Histori PO
* **Route / File:** `/scm/pembelian` (`frontend/src/app/(dashboard)/scm/pembelian/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Single unified workbench untuk menerbitkan Purchase Order baru ke supplier sekaligus memantau status eksekusi & pelunasan PO berjalan via dual-tab interface.
* **Backend Service & Prisma Model:** `backend/src/modules/scm/scm.service.ts`, Model `PurchaseOrder` & `PurchaseOrderItem`.
* **Inputs & Controls:**
  * **Dual Tab:** `[Buat PO Baru]` vs `[Histori PO & Pelunasan]`.
  * **Form Header:** Supplier Terdaftar (Dropdown searchable), Gudang Bongkar, Tanggal PO, Estimasi Kedatangan (Lead Time), Syarat Pembayaran (TOP), Catatan COA/Spesifikasi.
  * **Keranjang Items:** SKU Material, Qty Pesanan, Satuan Dasar, Harga Satuan Nego, Diskon (Nominal/%), Free/Bonus Qty, Subtotal Otomatis, Pajak PPN (11%/0%), Ongkos Kirim Vendor.
* **Outputs:**
  * Dokumen PO Resmi dengan QR Code Verifikasi Golden Thread.
  * Tab Histori: No PO, Tanggal, Supplier, Nilai PO, Status Approval (`PENDING`, `APPROVED`, `REJECTED`), Status Inbound GR (`NOT_RECEIVED`, `PARTIAL`, `COMPLETED`), Status Pembayaran (`UNPAID`, `DOWN_PAYMENT`, `PAID`).
* **Actions:** Simpan Draf PO, Ajukan Persetujuan, Cetak PO PDF, Batalkan PO.

#### PAGE 5: Permintaan Pembelian (Purchase Requests)
* **Route / File:** `/scm/purchase-requests` (`frontend/src/app/(dashboard)/scm/purchase-requests/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Workbench internal staf gudang/PPIC meminta tim Purchasing membelikan material yang kekurangan stok.
* **Backend Service & Prisma Model:** Model `PurchaseRequest`, `PurchaseRequestItem`.
* **Advancement Over Old:** Mendukung konversi langsung (1-click conversion) dari PR approved menjadi baris PO tanpa input manual ulang!

#### PAGE 6: Kebutuhan Barang (MRP Material Requirements)
* **Route / File:** `/scm/kebutuhan-barang` (`frontend/src/app/(dashboard)/scm/kebutuhan-barang/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Perhitungan ledakan kebutuhan bahan (BOM Explosion) otomatis dari Sales Order aktif terhadap saldo fisik gudang.
* **Inputs:** Pemilihan Sales Order aktif.
* **Outputs:** Tabel analitik kebutuhan bahan baku per fase mixing, kebutuhan botol primer, kebutuhan etiket sekunder, stok on-hand, stok booked, dan kuantitas defisit bersih (Net Requirement).
* **Actions:** Tombol otomatis `Generate Purchase Request` untuk semua item yang defisit.

#### PAGE 7: Pembelian Masuk (Goods Receipt / Inbound)
* **Route / File:** `/scm/barang-masuk/pembelian-masuk`
* **Purpose:** Registrasi fisik penerimaan barang di loading dock gudang dengan verifikasi nomor batch supplier, Certificate of Analysis (COA), dan tanggal kedaluwarsa (Expired Date).
* **Backend Service & Prisma Model:** `backend/src/modules/warehouse/warehouse.service.ts`, Model `WarehouseInbound` & `InboundItem`.

#### PAGE 8: Retur Pembelian (Purchase Returns)
* **Route / File:** `/scm/purchase-returns` (`frontend/src/app/(dashboard)/scm/purchase-returns/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Penanganan pengembalian material cacat/reject ke vendor dengan integrasi memo debit ke finance.
* **Backend Model:** `PurchaseReturn`, `PurchaseReturnItem`.

---

### 3.3 MODULE: WAREHOUSE & INVENTORY MANAGEMENT

#### PAGE 9: Stok & Aging Warehouse
* **Route / File:** `/warehouse/stok` (`frontend/src/app/(dashboard)/warehouse/stok/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Visibilitas real-time stok material dan barang jadi di seluruh gudang, dilengkapi fitur **Aging Stok** (<30 hari, 30-60 hari, 60-90 hari, >90 hari / Dead Stock Alert).
* **Backend Service & Model:** Model `MaterialInventory`, `FinishedGood`.
* **Inputs & Filters:** Gudang, Kategori Bahan, Range Aging, Search SKU.
* **Outputs:** SKU, Nama, Satuan, Total Qty, Saldo Good, Saldo Reject, Nilai Valuasi (Rp), Badge Kategori Aging.

#### PAGE 10: Mutasi Stok Barang
* **Route / File:** `/warehouse/mutasi-stok` (`frontend/src/app/(dashboard)/warehouse/mutasi-stok/page.tsx`)
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Audit ledger kronologis setiap pergerakan barang (Inbound PO, Outbound Produksi Mixing, Outbound Filling, Retur, Transfer, Opname Adjustment).
* **Backend Model:** `InventoryTransaction`.

#### PAGE 11: Stok Opname & Penyesuaian
* **Route / File:** `/warehouse/opname` & `/warehouse/adjustment`
* **Purpose:** Pelaksanaan audit fisik siklus stok (Cycle Counting) dengan approval flow selisih stok sebelum diposting ke ledger keuangan.
* **Backend Model:** `StockOpname`, `StockOpnameItem`, `StockAdjustment`.

#### PAGE 12: Pengiriman Barang (Release / Delivery Order)
* **Route / File:** `/warehouse/release`
* **Purpose:** Pengeluaran produk jadi, penerbitan Surat Jalan pengiriman, dan pencatatan nomor resi ekspedisi atau armada pabrik.
* **Backend Model:** `DeliveryOrder`, `Shipment`.

---

### 3.4 MODULE: R&D, LAB & FORMULASI

#### PAGE 13: Kelola Formulasi & Formulasi Master
* **Route / File:** `/rnd/kelola-formulasi` & `/rnd/formulasi`
* **Purpose:** Desain formula kosmetik berbasis CPKB: fase kimia (Fase A Oil, Fase B Water, Fase C Actives, Fase Fragrance), persentase konsentrasi 100.00%, spesifikasi pH, viskositas, dan berat jenis.
* **Backend Model:** `Formula`, `FormulaItem`, `FormulaPhase`.

#### PAGE 14: Penyesuaian Formulasi & Revision Tracker
* **Route / File:** `/rnd/penyesuaian-formulasi` & `/rnd/revision-tracker`
* **Purpose:** Pelacakan evolusi formula (Version Control BOM: Rev 0, Rev 1, Rev 2) dengan rekaman feedback tester brand owner dan alasan penyesuaian kimiawi.
* **Backend Model:** `SampleRevision`.

#### PAGE 15: Permintaan HPP (Costing Engine)
* **Route / File:** `/rnd/permintaan-hpp` & `/scm/hpp-requests`
* **Purpose:** Kalkulasi otomatis Harga Pokok Penjualan (HPP) berbasis harga material terkini di database SCM + biaya kemasan + upah maklon + overhead pabrik.

---

### 3.5 MODULE: PRODUKSI & FLOOR EXECUTION

#### PAGE 16: Batch Record (SPK Induk)
* **Route / File:** `/pra-produksi/batch-record`
* **Purpose:** Digital Batch Manufacturing Record (BMR) mengikat Sales Order dengan target kuantitas batch, SOP instruksi kerja, dan pelacakan batch number resmi.
* **Backend Model:** `ProductionPlan`, `WorkOrder`.

#### PAGE 17: Jadwal & Eksekusi Mixing, Filling, Packaging
* **Route / Files:**
  * `/pra-produksi/jadwal-mixing` & `/produksi/mixing`
  * `/pra-produksi/jadwal-filling` & `/produksi/filling`
  * `/pra-produksi/jadwal-packaging` & `/produksi/packaging`
* **Purpose:** Penjadwalan mesin dan pelaporan eksekusi 3-fase produksi CPKB:
  1. Mixing: Peleburan ruahan/bulk, pencatatan suhu & waktu homogenize.
  2. Filling: Pengisian ruahan ke botol/jar primer, pencatatan reject botol.
  3. Packaging: Perakitan box sekunder, barcode BPOM, expired date inkjet, shrink wrap, dan penyerahan ke gudang barang jadi.
* **Backend Model:** `ProductionSchedule`, `ProductionStepDetail`, `ProductionStepLog`.

---

### 3.6 MODULE: SALES PIPELINE, CRM & MARKETING

#### PAGE 18: OmniCRM & Lead Capture
* **Route / File:** `/marketing/omni-crm` & `/marketing/omni-crm/lead-capture`
* **Advancement Over Old:** Fitur canggih integrasi langsung dengan Kommo CRM, webhook WhatsApp Cloud API resmi, dan Facebook/Instagram Ads Lead Generation.
* **Backend Services:** `wa-webhook.service.ts`, `kommo-auto-sync.service.ts`, `meta-graph.service.ts`.
* **Backend Model:** `SalesLead`, `LeadActivity`, `LeadTimelineLog`.

#### PAGE 19: Sales Pipeline CRM (5 Stages)
* **Route / Files:**
  * `/crm/buku-tamu` (Visitor Intake)
  * `/crm/client-sample` (Prospek Pembuatan Sampel)
  * `/crm/client-produksi` (Prospek Kontrak Produksi Massal)
  * `/crm/client-ro` (Repeat Order Retention)
  * `/crm/client-lost` (Analisis Lost Deals & Win-Back)
* **Purpose:** Visualisasi Kanban corong penjualan maklon dari prospek awal hingga repeat order.
* **Backend Model:** `GuestLog`, `SampleRequest`, `LostDeal`, `RetentionEngine`.

#### PAGE 20: Penjualan (Sales Order) & Penjualan Sample
* **Route / File:** `/sales` & `/bussdev/sample-sales`
* **Purpose:** Transaksi kontrak pesanan massal dan pesanan sampel lab berbayar.
* **Backend Model:** `SalesOrder`, `SalesOrderItem`, `SampleRequest`.

---

### 3.7 MODULE: FINANCE & ACCOUNTING

#### PAGE 21: Command Center Keuangan (Finance Dashboard)
* **Route / File:** `/finance/dashboard`
* **Purpose:** Monitoring kas harian, saldo rekening BCA/Mandiri, total hutang dagang (AP), total piutang maklon (AR), dan cash flow forecast.

#### PAGE 22: Operasional Hutang & Piutang (AP & AR)
* **Route / Files:**
  * `/finance/faktur-pembelian`, `/finance/dp-pembelian`, `/finance/bayar-pembelian`
  * `/finance/faktur-penjualan`, `/finance/dp-penjualan`, `/finance/bayar-penjualan`
  * `/finance/ap-aging` (Aging Hutang Supplier) & `/finance/ar-aging` (Aging Piutang Brand Owner)
* **Backend Service & Model:** `backend/src/modules/finance/`, Model `Invoice`, `Bill`, `Payment`.

#### PAGE 23: Akuntansi & Pelaporan Keuangan
* **Route / Files:**
  * `/finance/jurnal-umum` (General Journal Entry)
  * `/finance/kas-bank-masuk` & `/finance/kas-bank-keluar`
  * `/finance/buku-besar` (General Ledger)
  * `/finance/laba-rugi` (Income Statement)
  * `/finance/accounting/coa` (Chart of Accounts)
  * `/finance/accounting/auto-journal` (Aturan Posting Jurnal Otomatis)
* **Backend Service & Model:** `journal-engine.service.ts`, Model `JournalEntry`, `JournalLine`, `Account`.

---

### 3.8 MODULE: QC & PROJECT TRACKING (14 MILESTONES)

#### PAGE 24: Checklist Tracking & Checklist Progress
* **Route / Files:**
  * `/qc/checklist/tracking` & `/project-control/checklist-tracking`
  * `/scm/checklist-progress` & `/qc/checklist/progress`
* **Status:** 🔒 FROZEN / CANONICAL.
* **Purpose:** Pemantauan komprehensif **14 Milestone Resmi Maklon Kosmetik KIL**:
  1. Deal Commercial & DP 50%
  2. Brief Konsep & Desain Kemasan
  3. Registrasi Notifikasi BPOM
  4. Pengadaan Kemasan Primer & Sekunder
  5. Pengadaan Bahan Baku Kimia
  6. Uji Laboratorium & Mikrobiologi
  7. Terbit SPK Batch Record
  8. Eksekusi Mixing Ruahan
  9. Eksekusi Filling
  10. Eksekusi Packaging & Coding
  11. Rilis QC Akhir
  12. Pelunasan Faktur Penjualan (Sisa 50%)
  13. Pengiriman Finished Goods
  14. Follow Up Retensi & Evaluasi Brand
* **Outputs:** Accordion timeline interaktif, status SLA antar divisi, dan peringatan keterlambatan (Delay Badge).

---

### 3.9 MODULE: EXECUTIVE COCKPIT & SYSTEM AUDIT

#### PAGE 25: Executive Dashboard & KPI SLA
* **Route / File:** `/executive/dashboard` & `/executive/kpi-accountability`
* **Purpose:** Dashboard Direksi untuk memantau performa maklon holistik: Gross Margin per Sales Order, Utilisasi Kapasitas Pabrik, SLA Handoff antar divisi, dan skor akuntabilitas staf.

#### PAGE 26: System Audit Ledger & Error Monitoring
* **Route / File:** `/system/audit-ledger` & `/system/error-dashboard`
* **Purpose:** Immutable audit trail mencatat setiap perubahan data, override otorisasi, dan penangkapan anomali sistem secara real-time.
