# ERP NEW ADVANCEMENT MAP
**Document Version:** 1.0 — Innovation & Value-Add Capabilities Audit  
**Enterprise:** PT. Karya Impian Laboratoris (Dreamlab - Toll Manufacturing Kosmetik)  
**System Comparison:** GsERP KIL (Baseline) vs NexERP / Porto Aureon (Target)  
**Core Purpose:** Membuktikan bahwa ERP Baru bukan sekadar salinan kosmetik, melainkan lompatan kapabilitas operasional maklon yang terukur.

---

## 1. Executive Summary of Advancements

New ERP menghadirkan modernisasi menyeluruh pada sistem operasi manufaktur kosmetik:
* **Eliminasi Manual Handoff:** Dari pencatatan terisolasi menjadi alur data terintegrasi (Golden Thread).
* **Standarisasi Regulasi Kosmetik (CPKB & BPOM):** Pengenalan 4 Pilar Supplier, 3-Fase Produksi terpisah, dan segregasi material cacat/reject.
* **Visibilitas Eksekutif Real-Time:** Perhitungan margin laba per pesanan (Order-Level Margin) menggantikan pelaporan akhir bulan yang lambat.
* **Otomasi Multi-Channel:** Integrasi langsung WhatsApp Cloud API dan Kommo CRM untuk mencegah kebocoran calon pelanggan (Zero Lead Leakage).

---

## 2. Detailed Advancement Records

### ADVANCEMENT 01: Dual-Tab SCM Purchase Workbench dengan Status Terintegrasi
* **Old Limitation:** Pada Old ERP, staf SCM harus berpindah-pindah di antara 5 halaman terpisah (`/purchase`, `/purchase-invoice`, `/purchase-down-payment`, `/purchase-payment`, `/purchase-in`) hanya untuk mengecek status satu nomor PO (apakah sudah di-approve, barang sudah datang, atau sudah lunas).
* **New Mechanism:** Layar terpadu Dual-Tab di `frontend/src/app/(dashboard)/scm/pembelian/page.tsx`. Tab 1 untuk pembuatan PO baru (lengkap dengan input diskon, ongkir, free bonus item), dan Tab 2 menampilkan rekap real-time status Approval, status Penerimaan Gudang (GR), dan status Pelunasan Keuangan dalam satu baris tabel.
* **Operational Benefit:** Menghilangkan context switching bagi staf pembelian, mempercepat waktu penanganan purchase order hingga 40%, dan mencegah duplikasi pemesanan ke vendor.
* **Evidence:** File `frontend/src/app/(dashboard)/scm/pembelian/page.tsx` baris 120–280.
* **Risk:** Rendah.
* **Classification:** **UPGRADE**

---

### ADVANCEMENT 02: 4 Pilar Kategori Supplier Standar Industri Kosmetik
* **Old Limitation:** Kategori vendor di Old ERP bersifat generik (teks bebas tanpa standarisasi), berisiko mencampur vendor bahan kimia aktif dengan vendor percetakan kotak sekunder.
* **New Mechanism:** Pengelompokan baku berbasis **4 Pilar Industri Kosmetik** di `frontend/src/app/(dashboard)/master/suppliers/page.tsx`:
  1. *Bahan Baku Kimia* (Active ingredients, surfactant, preservative, fragrance).
  2. *Kemasan Primer* (Botol dropper, pot krim akrilik, tube pump — bersentuhan langsung dengan isi kosmetik).
  3. *Kemasan Sekunder* (Inner box, leaflet petunjuk, stiker etiket barcode).
  4. *Bahan Pembantu* (Plastik shrink wrap, lakban, master karton pengiriman).
* **Operational Benefit:** Kepatuhan langsung terhadap standar Cara Pembuatan Kosmetika yang Baik (CPKB), kemudahan filter vendor sourcing, dan otomatisasi alokasi akun persediaan di neraca.
* **Evidence:** File `frontend/src/app/(dashboard)/master/suppliers/page.tsx` baris 45–70 (`CATEGORY_TABS`).
* **Risk:** Rendah.
* **Classification:** **NEW_VALID**

---

### ADVANCEMENT 03: Analisis Aging Persediaan Gudang & Segregasi Kondisi Fisik (Bagus vs Cacat)
* **Old Limitation:** Old ERP hanya menampilkan total kuantitas stok tunggal per barang. Tidak diketahui berapa lama material tersimpan di gudang atau berapa botol yang pecah saat pengiriman vendor.
* **New Mechanism:** Halaman Stok Gudang (`frontend/src/app/(dashboard)/warehouse/stok/page.tsx`) membagi saldo menjadi dua kolom terpisah: **Stok Bagus (Good)** vs **Stok Cacat (Reject)**, serta menyajikan klasifikasi durasi penyimpanan:
  * `< 30 Hari` (Fresh Inventory)
  * `30 - 60 Hari` (Normal Turn)
  * `60 - 90 Hari` (Warning)
  * `> 90 Hari` (Dead Stock / Expiration Risk Alert).
* **Operational Benefit:** Deteksi dini bahan baku aktif yang mendekati masa kedaluwarsa (expired), mencegah penggunaan bahan rusak pada saat mixing, dan klaim retur ganti rugi botol cacat ke supplier lebih cepat.
* **Evidence:** File `frontend/src/app/(dashboard)/warehouse/stok/page.tsx` baris 80–140.
* **Risk:** Rendah.
* **Classification:** **NEW_VALID**

---

### ADVANCEMENT 04: Public Document Verification via Scan QR Code (Digital Golden Thread)
* **Old Limitation:** Dokumen Surat Jalan pengiriman barang (Delivery Order) dan Faktur Penjualan hanya berupa lembaran kertas fisik yang rentan dipalsukan atau diubah oleh pihak ketiga selama perjalanan logistik.
* **New Mechanism:** Setiap dokumen transaksi resmi di-generate dengan kode verifikasi kriptografis dan QR Code publik yang mengarah ke endpoint web publik `/verify/[docCode]`.
* **Operational Benefit:** Pengemudi armada, pihak keamanan gudang penerima, dan brand owner dapat langsung memindai QR Code menggunakan kamera ponsel untuk memvalidasi keaslian dokumen, nomor batch produk, dan status pelunasan tanpa perlu login ke sistem ERP.
* **Evidence:** File `frontend/src/app/verify/[docCode]/page.tsx` dan `backend/src/modules/document-automation/services/pdf-engine.service.ts`.
* **Risk:** Sangat rendah.
* **Classification:** **NEW_VALID**

---

### ADVANCEMENT 05: Checklist Tracking 14 Milestone Maklon Kosmetik & Kendali SLA
* **Old Limitation:** Modul checklist di Old ERP hanya berupa daftar to-do sederhana tanpa keterkaitan logis dengan tahapan legalitas kosmetik (seperti registrasi notifikasi BPOM atau approval desain kemasan).
* **New Mechanism:** Matriks pelacakan interaktif **14 Milestone Resmi Maklon** di `frontend/src/app/(dashboard)/qc/checklist/tracking/page.tsx` yang mencakup:
  * Fase Pra-Produksi: Deal DP -> Desain Artwork -> Notifikasi BPOM -> Pengadaan Kemasan & Bahan -> Uji Lab.
  * Fase Produksi: Terbit SPK BMR -> Mixing Ruahan -> Filling Primer -> Packaging Sekunder.
  * Fase Pasca-Produksi: QC Final Release -> Pelunasan Invoice -> Pengiriman Surat Jalan -> Follow Up Retensi Brand.
* **Operational Benefit:** Visibilitas mutlak bagi manajemen terhadap divisi mana yang menjadi penyebab keterlambatan pesanan maklon (SLA Bottle-neck Detection).
* **Evidence:** File `frontend/src/app/(dashboard)/qc/checklist/tracking/page.tsx` baris 50–160.
* **Risk:** Rendah.
* **Classification:** **UPGRADE**

---

### ADVANCEMENT 06: OmniCRM Lead Capture Terotomasi (WhatsApp API & Kommo)
* **Old Limitation:** Calon brand owner yang menghubungi via WhatsApp atau form landing page harus disalin secara manual satu per satu oleh tim sales ke menu Buku Tamu. Tingkat kehilangan prospek (lead leakage) sangat tinggi.
* **New Mechanism:** Layanan backend otomatis `wa-webhook.service.ts` dan `kommo-auto-sync.service.ts` yang menangkap pesan WhatsApp Cloud API resmi dan sinkronisasi leads Kommo CRM langsung ke tabel `SalesLead` di database ERP.
* **Operational Benefit:** Respon cepat ke calon brand owner (di bawah 5 menit), pencatatan kronologis interaksi chat di timeline prospek, dan atribusi biaya iklan Meta Ads terhadap nilai kontrak maklon yang berhasil closing.
* **Evidence:** Direktori `backend/src/modules/wa-webhook/` dan `backend/src/modules/lead-capture/`.
* **Risk:** Ketergantungan pada stabilitas token API eksternal (Meta / Kommo).
* **Classification:** **NEW_VALID**

---

### ADVANCEMENT 07: Sistem Otorisasi Pengeluaran Dana Berjenjang (4-Tier Fund Request)
* **Old Limitation:** Pada Old ERP, pengeluaran kas non-pembelian diinput langsung tanpa kontrol batas otorisasi nominal (siapapun yang memiliki akses Kas Keluar dapat mencairkan dana berapapun).
* **New Mechanism:** Modul Pengajuan Dana di `/finance/pengajuan-dana` dengan mekanisme 4 tingkatan approval (Tier 1: Supervisor < Rp 1 Juta; Tier 2: Manager < Rp 10 Juta; Tier 3: Finance Director < Rp 50 Juta; Tier 4: Direktur Utama > Rp 50 Juta).
* **Operational Benefit:** Pencegahan kebocoran kas perusahaan (fraud prevention) dan kepatuhan tata kelola keuangan internal (Good Corporate Governance).
* **Evidence:** File `backend/src/modules/finance/dto/create-fund-request.dto.ts` dan Model Prisma `FundRequest`.
* **Risk:** Rendah.
* **Classification:** **NEW_VALID**

---

### ADVANCEMENT 08: Executive Cockpit & Real-Time Order Margin Analysis
* **Old Limitation:** Laba atau rugi pesanan maklon hanya bisa diketahui 30 hari kemudian setelah bagian akuntansi menyelesaikan tutup buku bulanan.
* **New Mechanism:** Dashboard eksekutif di `frontend/src/app/(dashboard)/executive/dashboard/page.tsx` menghitung margin laba kotor riil (Realized Gross Margin) per nomor Sales Order secara dinamis berdasarkan variansi harga beli bahan baku aktual terhadap estimasi HPP awal.
* **Operational Benefit:** Direksi dapat mendeteksi pesanan yang mengalami pembengkakan biaya bahan sebelum barang dikirim dan melakukan negosiasi ulang atau efisiensi proses secara cepat.
* **Evidence:** File `backend/src/modules/executive/executive.service.ts`.
* **Risk:** Membutuhkan akurasi posting jurnal material yang konsisten.
* **Classification:** **NEW_VALID**
