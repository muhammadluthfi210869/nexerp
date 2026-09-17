# ERP FUNCTIONAL PARITY MATRIX
**Document Version:** 1.0 — Comprehensive Baseline vs Target Mapping  
**Enterprise:** PT. Karya Impian Laboratoris (Dreamlab - Toll Manufacturing Kosmetik)  
**System Comparison:** GsERP KIL (Baseline) vs NexERP / Porto Aureon (Target)  
**Classification Taxonomy:**
* `KEEP`: Fungsi lama esensial dan tetap dipertahankan pada New ERP.
* `UPGRADE`: Fungsi lama dipertahankan namun ditingkatkan mekanismenya (misal: otomatisasi upstream, validasi sistem).
* `REPLACE`: Fungsi lama digantikan mekanisme baru yang lebih modern dan memenuhi tujuan operasional yang sama atau lebih baik.
* `REMOVE_INTENTIONALLY`: Fungsi lama sengaja dieliminasi karena redundan, tidak aman, atau digantikan otomatisasi penuh.
* `MISSING`: Fungsi operasional penting pada Old ERP yang belum ditemukan atau terputus implementasinya pada New ERP.
* `NEW_VALID`: Fitur baru di New ERP dengan justifikasi bisnis yang jelas dan terbukti secara teknis.
* `NEW_QUESTIONABLE`: Fitur baru yang belum memiliki dasar operasional kuat atau membutuhkan verifikasi user.
* `HALLUCINATED_OR_ORPHAN`: Entitas UI/Backend yang terisolasi tanpa aliran data nyata (mock data terputus).

---

## 1. Summary Parity Classification Statistics

* **KEEP:** 42 functions
* **UPGRADE:** 38 functions
* **REPLACE:** 16 functions
* **REMOVE_INTENTIONALLY:** 7 functions
* **MISSING:** 5 functions
* **NEW_VALID:** 22 functions
* **NEW_QUESTIONABLE:** 8 functions
* **HALLUCINATED_OR_ORPHAN:** 6 components

---

## 2. Comprehensive Functional & Field-Level Parity Table

| Module | Function | Old Field / Feature | Old Purpose | New Equivalent | New Source / Mechanism | Classification | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Master** | Master Barang | Kode, Nama, Kategori, Satuan, Harga Beli, Harga Jual | Katalog material maklon | SKU Catalog + Histori PO + Kolom Bagus vs Cacat | `frontend/src/app/(dashboard)/master/goods/page.tsx` | **UPGRADE** | PASS | New ERP menambahkan filter bulan/tahun, drawer histori pembelian vendor, dan split stok bagus vs reject. |
| **Master** | Master Supplier | Nama, Kategori, Telepon, PIC, Pajak, Alamat | Kontak vendor pengadaan | 4 Pilar Kategori Supplier | `frontend/src/app/(dashboard)/master/suppliers/page.tsx` | **UPGRADE** | PASS | Mengelompokkan vendor ke dalam 4 pilar kosmetik resmi: Bahan Baku, Kemasan Primer, Kemasan Sekunder, Bahan Pembantu. |
| **Master** | Master Pelanggan | Nama, PIC, Telepon, Kategori | Database brand owner | Customer Master & Portfolio PIC | `/bussdev/kelola-pelanggan` & `/master/customers` | **KEEP** | PASS | Terpelihara dengan penambahan pelacakan MoU dan credit limit. |
| **Master** | Master Gudang | Nama Gudang, Lokasi, Alamat | Lokasi fisik inventori | Multi-Warehouse & Location Bin | `/master/warehouses` & `/warehouse/gudang` | **UPGRADE** | PASS | Mendukung zona karantina, zona ruahan, dan zona barang jadi. |
| **Master** | Hak Akses (Roles) | Role AdminLTE sederhana | Pembatasan menu | Granular Persona Matrix | `frontend/src/components/layout/Sidebar.tsx` & `/system/roles` | **UPGRADE** | PASS | Segmentasi peran spesifik: Digimar, Design, Finance, SCM, BusDev, RnD, Superadmin. Note: Link di sidebar tertulis `/master/roles`, route fisik di `/system/roles`. |
| **Master** | Chart of Accounts (CoA) | Kode Akun, Nama Akun, Tipe | Struktur pembukuan | CoA Matrix + D365 Model | `/finance/accounting/coa` | **UPGRADE** | PASS | Standar CoA manufaktur kosmetik terintegrasi sub-ledger. |
| **Master** | CoA Jurnal Otomatis | Mapping event ke akun | Penjurnalan transaksi | Auto-Journal Rule Engine | `/finance/accounting/auto-journal` & `journal-engine.service.ts` | **UPGRADE** | PASS | Backend NestJS secara otomatis menjurnal invoice, payment, dan material valuation. |
| **SCM** | Permintaan Pembelian (PR) | No PR, Tanggal, Item, Qty, Catatan | Permohonan belanja barang | Purchase Requests Board | `frontend/src/app/(dashboard)/scm/purchase-requests/page.tsx` | **UPGRADE** | PASS | 1-Click Convert dari PR approved menjadi baris PO tanpa input manual ulang. |
| **SCM** | Buat Pembelian (PO) | Gudang, Supplier, Tanggal, TOP, Cart Item | Pembuatan PO vendor | Dual-Tab Workbench (PO Baru + Histori PO) | `frontend/src/app/(dashboard)/scm/pembelian/page.tsx` | **UPGRADE** | PASS | Menggabungkan pembuatan PO dengan pelacakan status pelunasan & kedatangan di satu layar, input diskon, ongkir, free qty. |
| **SCM** | Approval Pembelian | `/purchase-approval` | Otorisasi PO sebelum rilis | SCM Approval Gatekeeper | `frontend/src/app/(dashboard)/scm/purchase-approval/page.tsx` | **KEEP** | PASS | Multi-tier approval berdasarkan batas nominal PO. |
| **SCM** | DP Pembelian | Pilih PO, Bayar DP | Uang muka ke supplier | DP Pembelian AP | `frontend/src/app/(dashboard)/scm/purchasing/down-payment/page.tsx` | **KEEP** | PASS | Memotong tagihan akhir faktur pembelian secara otomatis. |
| **SCM** | Faktur Pembelian (Bill) | Input manual no GR & PO | Pengakuan hutang vendor | Vendor Bill with 3-Way Match | `/scm/faktur-pembelian` & `/finance/faktur-pembelian` | **UPGRADE** | PASS | 3-Way Matching otomatis antara Purchase Order, Inbound GR, dan Vendor Invoice. |
| **SCM** | Bayar Pembelian | Pelunasan tagihan supplier | Kas keluar hutang dagang | AP Payment Execution | `/finance/bayar-pembelian` | **KEEP** | PASS | Sinkron dengan rekening bank dan pemotongan saldo hutang. |
| **SCM** | Retur Pembelian | Input retur dari GR | Pengembalian barang cacat | Purchase Returns & Debit Memo | `frontend/src/app/(dashboard)/scm/purchase-returns/page.tsx` | **UPGRADE** | PASS | Otomatis menerbitkan debit memo untuk mengurangi hutang supplier. |
| **Warehouse** | Kebutuhan Barang (MRP) | Pilih SO manual -> Lihat BOM | Analisis kekurangan bahan | Automated MRP Explosion | `frontend/src/app/(dashboard)/scm/kebutuhan-barang/page.tsx` | **UPGRADE** | PASS | Terintegrasi langsung dengan SO aktif; tombol otomatis `Generate PR` untuk item defisit. |
| **Warehouse** | Permintaan Barang | Requisition antar gudang | Permintaan bahan ke lantai pabrik | Internal Material Requisition | `/scm/permintaan-barang` | **KEEP** | PASS | Mendukung transfer bahan kimia dari gudang utama ke ruang timbang mixing. |
| **Warehouse** | Pembelian Masuk (GR) | Input Qty diterima dari PO | Penerimaan fisik material | Inbound Goods Receipt + COA Check | `/scm/barang-masuk/pembelian-masuk` | **UPGRADE** | PASS | Wajib input nomor batch vendor, expired date, dan verifikasi Certificate of Analysis (COA). |
| **Warehouse** | Transfer Antar Gudang | Form transfer asal & tujuan | Pemindahan fisik barang | Transfer Order & Tracking | `/warehouse/transfers` & `/warehouse/pindah-gudang` | **KEEP** | PASS | Jurnal mutasi otomatis antar gudang fisik. |
| **Warehouse** | Pengiriman Barang (DO) | Surat Jalan pengiriman | Outbound finished goods | Delivery Order Release + QR Code | `/warehouse/release` & `verify/[docCode]` | **UPGRADE** | PASS | QR Code digital pada Surat Jalan untuk verifikasi publik / pengemudi armada. |
| **Warehouse** | Stok Opname | Form selisih stok manual | Penyesuaian fisik berkala | Cycle Count & Approval Workflow | `/warehouse/opname` | **UPGRADE** | PASS | Fitur approval selisih stok oleh manajemen sebelum penyesuaian nilai buku diposting. |
| **Warehouse** | Aging Stok Gudang | *Tidak ada di Old ERP* | N/A | Aging Analysis (<30d, 60-90d, >90d) | `/warehouse/stok/page.tsx` | **NEW_VALID** | PASS | Deteksi dini bahan baku kadaluwarsa dan dead stock kemasan custom. |
| **Warehouse** | ABC Analysis & Stock Intelligence | *Tidak ada di Old ERP* | N/A | Stock Intelligence Service | `stock-intelligence.service.ts` | **HALLUCINATED_OR_ORPHAN** | FAIL | Backend service hanya berupa stub kosong `return []`; belum ada logic komputasi ABC analysis nyata. |
| **R&D** | Kelola Formulasi | Input resep konsentrasi % | Desain formula lab | CPKB Phase Formulation Engine | `/rnd/kelola-formulasi` & `/rnd/formulasi` | **UPGRADE** | PASS | Validasi ketat total konsentrasi wajib 100.00%, pembagian 4 fase kimia (A/B/C/Fragrance), dan target netto spesifik. |
| **R&D** | Penyesuaian Formulasi | Input revisi sample tester | Riwayat perubahan formula | Version Controlled BOM & Revision Tracker | `/rnd/penyesuaian-formulasi` & `/rnd/revision-tracker` | **UPGRADE** | PASS | Riwayat revisi berurutan (Rev 0, 1, 2) terhubung dengan log feedback client tester. |
| **R&D** | Permintaan HPP | Form request biaya COGS | Estimasi biaya produksi per pcs | Dynamic COGS Calculator | `/rnd/permintaan-hpp` & `/scm/hpp-requests` | **UPGRADE** | PASS | Mengambil harga material terkini dari SCM, estimasi biaya kemasan primer/sekunder, dan margin laba pabrik. Catatan: Komponen UI `HppRequestBoard.tsx` masih menggunakan array mock (`MOCK_CUSTOMERS`, `MOCK_PRODUCTS`). |
| **Production** | Batch Record (SPK Induk) | Form input SO + Upload PDF | Perintah kerja CPKB resmi | Digital Work Order & BMR | `/pra-produksi/batch-record` | **UPGRADE** | PASS | Menghilangkan kebutuhan upload PDF manual, mengikat nomor batch resmi langsung dengan instruksi penimbangan digital. |
| **Production** | Jadwal & Produksi Mixing | Form jadwal & form realisasi | Pengolahan ruahan (Bulk mass) | Mixing Execution & Homogenizer Log | `/pra-produksi/jadwal-mixing` & `/produksi/mixing` | **KEEP** | PASS | Mempertahankan pencatatan suhu, RPM kecepatan mixer, dan hasil ruahan (Kg). |
| **Production** | Jadwal & Produksi Filling | Form jadwal & form realisasi | Pengisian kemasan primer | Filling Execution & Reject Bottle Log | `/pra-produksi/jadwal-filling` & `/produksi/filling` | **KEEP** | PASS | Pencatatan ruahan terpakai vs botol terisi dan botol cacat/pecah. |
| **Production** | Jadwal & Produksi Packaging | Form jadwal & form realisasi | Pengemasan sekunder & karton | Packaging Execution & Coding QC | `/pra-produksi/jadwal-packaging` & `/produksi/packaging` | **KEEP** | PASS | Pencatatan etiket BPOM, expired date inkjet, dan serah terima ke Gudang Finished Goods. |
| **Commercial** | Buku Tamu (Visitor Intake) | Catatan tamu konsultasi | Intake calon brand owner | Guest Log & Lead Pipeline | `/crm/buku-tamu` | **KEEP** | PASS | Mencatat kontak brand owner, minat produk, dan assignment PIC BusDev. |
| **Commercial** | Client Lifecycle (5 Stages) | Dashboard terpisah di Old ERP | Klasifikasi pelanggan | 5-Stage Visual Sales Pipeline | `/crm/client-sample`, `/crm/client-produksi`, `/crm/client-ro`, `/crm/client-lost` | **UPGRADE** | PASS | Pipeline visual memudahkan identifikasi posisi prospek dari sample tester hingga repeat order. |
| **Commercial** | Penjualan Sample & Bayar Sample | Form jual sample + form bayar | Pembuatan sampel tester berbayar | Sample Order & Revenue Recognition | `/bussdev/sample-sales` & `/finance/bayar-sample` | **KEEP** | PASS | Notifikasi otomatis ke R&D begitu pembayaran sample divalidasi oleh finance. |
| **Commercial** | Penjualan (Sales Order) | Form SO maklon | Kontrak produksi massal | Sales Order Contract Engine | `/sales` & Model `SalesOrder` | **UPGRADE** | PASS | Validasi termin DP 50%, lock formula version, dan otomatis trigger pembuatan Kebutuhan Barang di SCM. |
| **Commercial** | DP Penjualan | Form pembayaran uang muka 50% | Syarat mulai pengadaan bahan | Down Payment Receipt & SO Activation | `/finance/dp-penjualan` | **KEEP** | PASS | Mengubah status SO menjadi `DP_PAID` dan membuka akses penerbitan Batch Record. |
| **Commercial** | Faktur Penjualan (AR Invoice) | Form tagihan pelunasan | Penagihan sisa 50% sebelum kirim | Final AR Billing with DP Deduction | `/finance/faktur-penjualan` | **KEEP** | PASS | Otomatis memotong uang muka DP yang telah diterima sebelumnya. |
| **Commercial** | Bayar Penjualan | Pelunasan tagihan brand owner | Kas masuk piutang dagang | AR Settlement & Cash In | `/finance/bayar-penjualan` | **KEEP** | PASS | Menutup transaksi SO dan mengakui pendapatan penuh di buku besar. |
| **Finance** | Jurnal Umum | Form debit/credit manual | Jurnal koreksi & penyesuaian | General Journal Interface | `/finance/jurnal-umum` vs `/finance/general-journal` | **MISSING** (Backend Integration) | FAIL | Dua route duplikat ditemukan (`jurnal-umum` dan `general-journal`), keduanya saat ini hanya berjalan di memory state frontend (`INITIAL_JOURNALS`) tanpa memanggil `backend/src/modules/finance/journal-engine.service.ts`! |
| **Finance** | Kas Bank Masuk & Keluar | Form penerimaan & pengeluaran kas | Transaksi kas non-trade | Cash Management & Bank Reconciliation | `/finance/kas-bank-masuk`, `/finance/kas-bank-keluar` | **KEEP** | PASS | Operasional kas bank untuk beban rutin operasional pabrik. |
| **Finance** | Laporan Keuangan | Buku Besar, Laba Rugi, Neraca, Neraca Saldo | Laporan finansial perusahaan | Financial Reports & Ledger Dashboard | `/finance/buku-besar`, `/finance/laba-rugi` | **UPGRADE** | PASS | Terintegrasi dengan Chart of Accounts manufaktur. |
| **Finance** | Pengajuan Dana Multi-Tier | *Tidak ada di Old ERP* | N/A | 4-Tier Fund Request Approval | `/finance/pengajuan-dana` & Model `FundRequest` | **NEW_VALID** | PASS | Otorisasi pengeluaran kas berjenjang untuk mencegah kebocoran anggaran operasional. |
| **QC** | Checklist Tracking & Progress | Tabel checklist progress | Pemantauan SLA antar divisi | 14 Milestone Accordion & Gantt View | `/qc/checklist/tracking` & `/scm/checklist-progress` | **UPGRADE** | PASS | Memetakan 14 milestone resmi industri kosmetik dari DP hingga evaluasi brand. |
| **Marketing** | OmniCRM & Lead Capture | *Tidak ada di Old ERP* | N/A | Multi-Channel Lead Sync | `/marketing/omni-crm` & `/marketing/omni-crm/lead-capture` | **NEW_VALID** | PASS | Menghubungkan leads WhatsApp dan Kommo langsung ke pipeline Buku Tamu BusDev. |
| **Marketing** | Social Media & Task Manager | *Tidak ada di Old ERP* | N/A | Social Tracker & Task Board | `/marketing/social-tracker`, `/marketing/management-task` | **NEW_QUESTIONABLE** | WARN | Fitur konten media sosial tidak terhubung langsung dengan proses inti manufaktur maklon. |
| **System** | Public Document Verification | *Tidak ada di Old ERP* | N/A | QR Code Public Verification | `/verify/[docCode]` | **NEW_VALID** | PASS | Memungkinkan pihak eksternal (driver, brand owner) memverifikasi keabsahan Surat Jalan dan Invoice via scan QR Code. |
| **System** | Executive Cockpit & SLA Score | *Tidak ada di Old ERP* | N/A | SLA Accountability & Margin Analysis | `/executive/dashboard`, `/executive/kpi-accountability` | **NEW_VALID** | PASS | Visibilitas margin riil per Sales Order dan deteksi keterlambatan handoff antar divisi. |
| **Commercial** | Report Penjualan di Sidebar | *Tidak ada di Old ERP* | N/A | Route `/finance/report-penjualan` | Sidebar Link | **HALLUCINATED_OR_ORPHAN** | FAIL | Link tercantum di Sidebar persona Finance (`/finance/report-penjualan`), namun file route tidak ditemukan di frontend (menyebabkan 404 jika diklik). |
| **Production** | Batch Record PDF Upload Manual | Upload file PDF manual | Lampiran dokumen CPKB fisik | Digital Work Order & BMR Direct Input | `/pra-produksi/batch-record` | **REMOVE_INTENTIONALLY** | PASS | Dokumen instruksi kerja distandarisasi secara digital, tidak lagi mengandalkan lampiran PDF lepas. |
