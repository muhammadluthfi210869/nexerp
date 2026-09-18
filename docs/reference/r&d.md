# COMMUNICATION PROTOCOL

### 1. Jalur Inovasi (R&D $\leftrightarrow$ BusDev)
Ini adalah jalur bolak-balik untuk menemukan resep yang disukai klien.
* **Pemicu:** BusDev membuat "Form Permintaan Sampel" (Klien minta krim malam, warna biru, wangi lavender, target HPP Rp 15.000).
* **Tugas R&D:** Meracik sampel di lab, lalu memberikan status **"Sampel Selesai"**.
* **Gembok (Hard-Gate):** R&D tidak akan membuat sampel jika BusDev belum mengunggah bukti bayar "Biaya Sampel" yang sudah divalidasi oleh Finance. Jika klien minta revisi, BusDev menekan tombol "Revisi", dan R&D meracik ulang dengan *Version Control* (Misal: Formula V1 $\rightarrow$ V2).

### 2. Jalur Material & HPP (R&D $\leftrightarrow$ SCM / Gudang)
Ini adalah jalur paling vital dalam sistem ERP. R&D menentukan bahan kimia apa yang harus dibeli.
* **Pemicu:** Klien setuju dengan Sampel V2 dan membayar DP Produksi (divalidasi Finance).
* **Tugas R&D (Sistemik):** R&D menerbitkan **Bill of Materials (BOM)** atau Resep Skala Pabrik per 1 Kg.
* **Dampak Sistemik (Otomatis):** SCM langsung melihat BOM tersebut. Mesin ERP akan menghitung: *(Kebutuhan BOM x Jumlah Pesanan BusDev) - Stok Gudang Saat Ini*. Jika hasilnya minus, SCM akan mendapat notifikasi untuk segera menerbitkan *Purchase Order* (PO) ke *Supplier*. R&D juga berkomunikasi ke SCM jika butuh dicarikan bahan aktif kimia baru untuk riset.

### 3. Jalur Legalitas & Kepatuhan (R&D $\leftrightarrow$ Legal / APJ)
Di pabrik kosmetik, Anda tidak bisa memproduksi barang sebelum BPOM keluar. BPOM butuh persentase komposisi yang absolut.
* **Pemicu:** Formula terkunci karena DP sudah masuk.
* **Tugas R&D:** R&D mengirimkan data **Dokumen Informasi Produk (DIP)** dan komposisi INCI (International Nomenclature of Cosmetic Ingredients) ke *dashboard* tim Legal.
* **Gembok (Hard-Gate):** Tim Legal mendaftarkan komposisi itu ke portal BPOM (Notifikasi Kosmetik). Sebelum Legal menekan tombol "Nomor BPOM Terbit", pabrik dilarang keras melakukan proses *Filling/Packaging*.

### 4. Jalur Eksekusi Fisik (R&D $\leftrightarrow$ Produksi & QC)
R&D yang menciptakan standar, Produksi yang mengeksekusi, dan QC yang mengawasi.
* **Pemicu:** Bahan baku sudah lengkap di Gudang, BPOM sudah terbit, Jadwal Produksi dimulai.
* **Tugas R&D:** Sistem menarik **Batch Record** (Instruksi Kerja Mixing) langsung dari BOM R&D ke layar mesin *Mixing*. R&D juga menetapkan Parameter Mutu (Misal: pH harus 5.5, Viskositas 4000 cps).
* **Gembok (Hard-Gate):** Saat barang selesai di-*mixing*, QC akan mengetesnya. Jika pH barang tidak sesuai dengan standar yang ditetapkan R&D di sistem, mesin akan mengunci barang tersebut di status *Quarantine* (Karantina) dan tidak bisa dilanjutkan ke proses *Filling* botol.

1. R&D Executive Dashboard
Route / URL: /dashboard/rnd

Tipe Halaman: Read-Only Analytics

Fungsi Utama: Pusat komando Manajer R&D. Berisi 4 kartu matriks utama (Timeliness, Accuracy, Approval Performance, R&D Performance) dan 3 tabel analitik (R&D Pipeline Master, Performance per Person, Reject Log). Tidak ada input data di sini, semuanya ditarik otomatis dari aktivitas halaman lain.

2. Sample Brief Inbox (Ruang Tunggu PNF)
Route / URL: /dashboard/rnd/inbox

Tipe Halaman: Task Queue / Action Hub

Fungsi Utama: Tempat R&D menerima spesifikasi produk (PNF) dari BusDev yang biaya sampelnya sudah divalidasi Finance.

Aksi Kunci: R&D membaca permintaan, lalu menekan tombol [Terima & Mulai Formulasi] yang akan mengarahkan mereka ke halaman Phase Builder.

3. R&D Pipeline & Version Control
Route / URL: /dashboard/rnd/pipeline

Tipe Halaman: Data Grid / List View

Fungsi Utama: Menggantikan menu "Kelola Formulasi" lama. Ini adalah tabel daftar seluruh formula pabrik yang bisa di-filter berdasarkan status: FORMULATING, WAITING APPROVAL, REVISED, atau LOCKED.

Aksi Kunci: R&D menggunakan halaman ini untuk mencari resep lama, menduplikasi resep untuk revisi, atau memantau status persetujuan klien.

4. Formulation Phase Builder (Mode Input / Lab Workspace)
Route / URL: /dashboard/rnd/formula/[id]/edit

Tipe Halaman: Dynamic Data Entry (Interactive)

Fungsi Utama: Ini adalah ruang kerja analis kimia. Tempat R&D meracik resep berdasarkan "Fase Pencampuran" (Fase A, Fase B, dll).

Aksi Kunci: * Menginput bahan baku dan persentase (Sistem memaksa Auto-Sum 100%).

Menginput Parameter QC (Target pH, Viskositas, Organoleptik).

Menekan tombol [Lock Formula] saat sampel disetujui klien.

5. The Formula Blueprint (Mode Output / Read-Only)
Route / URL: /dashboard/rnd/formula/[id]/view

Tipe Halaman: Read-Only Hub & Document Generator

Fungsi Utama: Menampilkan resep yang sudah terkunci (tidak bisa diedit lagi). Ini adalah halaman sentral yang mendistribusikan data ke divisi lain.

Aksi Kunci:

R&D menekan tombol [📄 Generate Batch Record] untuk mengubah % menjadi instruksi Kg (PDF) untuk divisi Produksi.

R&D menekan tombol [⚖️ Push DIP to Legal] untuk melempar nama komposisi INCI ke dasbor divisi Legal/APJ.

Sistem secara transparan menampilkan kalkulasi HPP final yang ditarik dari data Moving Average Price milik divisi SCM.

Berikut adalah **Daftar Final (Fixed List)** halaman untuk Modul R&D V4. Seluruh kompleksitas pekerjaan laboratorium Anda diringkas menjadi **5 Halaman Inti** berkat arsitektur *Event-Driven*. 

Berikan daftar struktur *routing* (URL) dan fungsi ini kepada AI Coder Anda sebagai cetak biru (*blueprint*) pembuatan antarmuka (*frontend*):

# PAGE ROUTES

### 1. R&D Executive Dashboard
* **Route / URL:** `/dashboard/rnd`
* **Tipe Halaman:** *Read-Only Analytics*
* **Fungsi Utama:** Pusat komando Manajer R&D. 

Card A. TIMELINESS: On-Time Sample Rate, Avg Cycle, Overdue, Insight.

Card B. ACCURACY: First-Time Approval, Avg Revision, Failed, Insight.

Card C. APPROVAL PERFORMANCE: Overall Approval Rate, Submitted, Approved, Insight.

Card D. R&D CAPABILITY: Active Pjkt, Completed, Utilization Rate, Blocked by SCM. (Revisi)

Card E. COST ALIGNMENT: Avg HPP Variance, % Target Hit, Overbudget Formulas. (Baru)

Tabel 1. R&D PIPELINE MASTER: RND ID / BRAND, PRODUCT NAME, TEAM, CURRENT STAGE, TIME AUDIT, QUALITY (REV), STATUS, TIMELINESS, TARGET vs ACTUAL HPP. (Revisi)

Tabel 2. R&D EVALUATION (PER PERSON): PIC NAME, OUTPUT, EFFICIENCY, QUALITY, UTILIZATION.

Tabel 3. REJECT & BLOCKER LOG: PRODUCT / STAGE, REASON, BOTTLENECK SOURCE (Client / R&D / SCM). (Revisi)

### 2. Sample Brief Inbox (Ruang Tunggu PNF)
* **Route / URL:** `/dashboard/rnd/inbox`
* **Tipe Halaman:** *Task Queue / Action Hub*
* **Fungsi Utama:** Tempat R&D menerima spesifikasi produk (PNF) dari BusDev yang biaya sampelnya sudah divalidasi Finance. 
* **Aksi Kunci:** R&D membaca permintaan, lalu menekan tombol `[Terima & Mulai Formulasi]` yang akan mengarahkan mereka ke halaman *Phase Builder*.

Halaman **Sample Brief Inbox** adalah "Pintu Gerbang" laboratorium Anda. Di ERP lama, informasi ini mungkin tercecer di grup WhatsApp, email, atau catatan kertas. Di V4, halaman ini adalah **Antrean Tugas Mutlak (Task Queue)** yang tidak bisa dimanipulasi. 

R&D hanya boleh bekerja jika ada *Brief* (PNF - Product Notification Form) yang masuk ke halaman ini, dan PNF hanya bisa masuk ke sini jika Finance sudah mengeklik tombol "Validasi Pembayaran".

Berikut adalah spesifikasi arsitektur, kebutuhan data, dan logika sistem untuk halaman **Sample Brief Inbox** yang **wajib Anda salin dan berikan kepada AI Coder Anda**:

***

# 🏗️ SPESIFIKASI ARSITEKTUR: R&D SAMPLE BRIEF INBOX
**Target:** AI Coder (Frontend Next.js & Backend NestJS)
**Fungsi:** Master-Detail Task Queue untuk menerima dan mengeksekusi Form Permintaan Produk (PNF) dari BusDev.

## 1. LOGIKA DATABASE & DATA FETCHING (BACKEND)
Halaman ini **bukan** tempat untuk menginput data produk. Halaman ini hanya menarik (GET) data dari tabel `SampleRequest` (atau entitas setara yang dibuat BusDev).

* **Filter Query (Wajib):** Halaman ini HANYA boleh memunculkan data dengan kondisi:
  `status === 'WAITING_RND_ACTION'` DAN `isPaymentVerified === true`.
* **Relasi Data yang Ditarik:** Tarik data `Client/Pelanggan`, `PIC BusDev`, dan `Product/Kategori`.

## 2. STRUKTUR DATA PNF (APA YANG DIBACA R&D?)
AI Coder harus menampilkan *field-field* berikut di layar R&D. Data ini adalah spesifikasi yang diketik oleh BusDev saat mereka *closing* dengan klien:

**A. Metadata Pendaftaran**
* **ID Sampel / No. PNF:** (Contoh: SMP-2604-001)
* **Nama Klien / Brand:** (Contoh: PT. Aureon Beauty / "Luminous Serum")
* **PIC BusDev:** (Nama *sales* yang menangani)
* **Tenggat Waktu (Deadline):** Wajib merah jika SLA R&D (misal 7 hari kerja) sudah dekat.

**B. Spesifikasi Produk (Inti PNF)**
* **Kategori Produk:** (Contoh: Skincare - Serum Wajah)
* **Target Volume / Netto:** (Contoh: 20 ml)
* **Target HPP Maksimal:** (Contoh: Rp 18.000 / botol) $\rightarrow$ *Sangat krusial untuk panduan R&D.*
* **Klaim Kegunaan:** (Contoh: Mencerahkan, Anti-Aging)
* **Bahan Aktif Permintaan Klien:** (Contoh: "Klien ingin pakai Niacinamide 5% dan Ekstrak Mawar").
* **Produk Benchmark (Contoh):** (Contoh: URL Skintific atau nama produk kompetitor yang ingin ditiru teksturnya).

**C. Harapan Organoleptik (Sensorik)**
* **Warna:** (Contoh: Bening kehijauan)
* **Tekstur:** (Contoh: Gel cair, cepat meresap, tidak lengket)
* **Aroma / Wangi:** (Contoh: Floral lembut, tanpa parfum buatan)

## 3. LOGIKA ANTARMUKA & AKSI (FRONTEND)
Gunakan arsitektur **Master-Detail View**. 
* **Panel Kiri (30%):** Daftar kartu *Brief* yang masuk (Bisa di-*scroll*).
* **Panel Kanan (70%):** Detail lengkap PNF dari kartu yang diklik di panel kiri.

Di bagian bawah Panel Kanan, AI Coder WAJIB membuat **2 Tombol Aksi Logika (Hard-Gates)**:

### TOMBOL 1: `[Tolak & Kembalikan ke BusDev]` (Warna Merah/Outline)
* **Kondisi:** Digunakan jika *brief* klien tidak masuk akal secara kimia atau target HPP terlalu rendah.
* **Aksi:** Memunculkan *modal/pop-up* **"Alasan Penolakan"** (Wajib diisi).
* **Efek Backend:** Mengubah `status` menjadi `REJECTED_BY_RND`. Mengirim notifikasi ke BusDev. Data **hilang** dari *Inbox* R&D.

### TOMBOL 2: `[Terima & Mulai Formulasi]` (Warna Emas/Primary)
* **Kondisi:** Digunakan jika Manajer R&D setuju dengan spesifikasi dan sanggup membuat resepnya.
* **Efek Backend (MUTLAK):**
  1. Ubah `status` di tabel `SampleRequest` menjadi `FORMULATING`.
  2. **Auto-Create:** Sistem otomatis membuat 1 *record* kosong di tabel `Formula` (BOM) yang terhubung (berelasi) dengan ID Sampel ini. 
  3. **Redirect:** *Browser* R&D langsung berpindah (*redirect*) ke halaman **Formulation Phase Builder** (`/rnd/formula/[new_formula_id]/edit`) untuk mulai meracik fase A, B, C.

***

Untuk memastikan AI Coder memahami *layout* efisien ini tanpa mendesain UI e-commerce atau tabel datar yang membosankan, tunjukkan rancangan interaktif **Master-Detail PNF Inbox** di bawah ini:

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"750px","prompt":"Buatlah 'R&D Sample Brief Inbox Simulator' untuk ERP V4.\n\nObjektif: Mensimulasikan antarmuka Master-Detail untuk antrean tugas R&D.\n\nData Awal:\n- 3 Kartu Task di Panel Kiri: \n  1. SMP-2604-001 (Luminous Serum - Aureon Beauty). Status: New.\n  2. SMP-2604-002 (Acne Spot Gel - DermaKlin). Status: Overdue.\n  3. SMP-2604-003 (Body Wash - Natura). Status: New.\n\nStruktur Layout:\n1. Panel Kiri (Task Queue - 30% width): List kartu antrean. Kartu menampilkan ID, Brand, dan Deadline. Kartu yang diklik di-highlight.\n2. Panel Kanan (PNF Detail Viewer - 70% width):\n   - Header: ID Sampel dan Status Label.\n   - Bagian 1 (Target Bisnis): Target Netto, Target HPP (Rp), Kategori Produk.\n   - Bagian 2 (Spesifikasi Klien): Benchmark, Bahan Aktif yang Diminta.\n   - Bagian 3 (Organoleptik): Warna, Tekstur, Aroma.\n   - Footer: Dua tombol aksi di kanan bawah: '[Tolak Brief]' dan '[Terima & Mulai Formulasi]'.\n\nInteraksi:\n- Klik kartu di kiri akan mengubah detail di kanan.\n- Klik '[Terima & Mulai Formulasi]' akan memunculkan loading state/animasi sukses, dan kartu tersebut menghilang dari antrean kiri.\n\nEstetika:\n- UI: Silent Luxury / Dark Mode (#080808).\n- Aksen: Champagne Gold (#D4AF37) untuk highlight dan tombol utama.\n- Desain: High-Density, mirip email client modern (seperti Superhuman atau MS Outlook Web).","id":"im_8b23c52e1645097e"}}
```

### 3. R&D Pipeline & Version Control
* **Route / URL:** `/dashboard/rnd/pipeline`
* **Tipe Halaman:** *Data Grid / List View*
* **Fungsi Utama:** Menggantikan menu "Kelola Formulasi" lama. Ini adalah tabel daftar seluruh formula pabrik yang bisa di-*filter* berdasarkan status: `FORMULATING`, `WAITING APPROVAL`, `REVISED`, atau `LOCKED`.
* **Aksi Kunci:** R&D menggunakan halaman ini untuk mencari resep lama, menduplikasi resep untuk revisi, atau memantau status persetujuan klien.

Halaman **R&D Pipeline** adalah "Menara Kontrol" yang mengatur lalu lintas seluruh proyek formulasi di pabrik Anda. Jika *Inbox* adalah pintu masuk, maka *Pipeline* adalah jalur produksinya. Halaman ini harus dirancang untuk memberikan transparansi penuh kepada Anda dan BusDev, sekaligus memberikan kontrol versi yang ketat bagi tim laboratorium.

Berikut adalah spesifikasi mendalam untuk referensi AI Coder Anda:

### 1. Filosofi UI & Layout
Halaman ini harus menggunakan **Advanced Data Grid** (Tabel Interaktif) yang padat informasi namun bersih. Hindari *scroll* horizontal yang berlebihan; gunakan fitur *expandable rows* (baris yang bisa diklik untuk membuka detail).

* **Status Indicators (Warna):**
    * 🟡 `FORMULATING`: Sedang dalam racikan lab.
    * 🟣 `INTERNAL_QC`: Sedang dites stabilitas/pH oleh tim QC internal.
    * 🔵 `WAITING_CLIENT`: Sampel sudah dikirim, menunggu *feedback* klien.
    * 🔴 `REVISION_REQUIRED`: Klien minta ubah spesifikasi (Revisi).
    * 🟢 `LOCKED / DEAL`: Formula final, siap pendaftaran BPOM dan Produksi.

### 2. Logika Utama (The Engine Logic)

**A. Version Control (V1, V2, V3)**
AI Coder harus membangun logika *Parent-Child* di database.
* Satu Proyek Sampel bisa memiliki banyak versi formula.
* Jika BusDev menekan tombol "Revisi", sistem tidak menghapus data lama, melainkan melakukan *cloning* data V1 menjadi V2, sehingga riwayat perubahan bahan kimia tetap terlacak.

**B. Real-Time HPP Preview**
Di dalam tabel *pipeline*, sistem harus menampilkan kolom **"Current Estimated HPP"**. 
* **Logika:** Ambil total berat bahan di BOM × Harga Beli terakhir di SCM.
* **Visual:** Jika HPP > Target HPP dari klien, angka berwarna Merah. Jika HPP ≤ Target, berwarna Hijau.

**C. SLA & Aging Tracking**
Sistem harus menghitung berapa lama sebuah proyek tertahan di satu status.
* Jika di status `FORMULATING` lebih dari 3 hari (sesuai SOP Anda), baris tersebut harus memberikan tanda peringatan (⚠️).

### 3. Alur Komunikasi (Communication Protocol)

**R&D ↔ BusDev (Dua Arah):**
* **Update:** Setiap kali R&D mengubah status (misal dari racik ke kirim sampel), BusDev mendapatkan notifikasi instan.
* **Feedback Loop:** BusDev memiliki tombol `[Input Feedback Klien]` di halamannya. Jika diklik, R&D menerima notifikasi di Pipeline bahwa mereka harus melakukan revisi atau lanjut ke tahap *Lock*.

**R&D ↔ SCM (Logika Ketersediaan):**
* Jika di tengah jalan R&D menyadari bahan kimia tertentu habis, mereka bisa menekan tombol `[Flag Missing Material]` di baris produk tersebut. 
* Ini akan memunculkan indikator "SCM BLOCKER" di dasbor SCM agar segera dibelikan.

**R&D ↔ Finance (Margin Safety):**
* Finance bisa memantau Pipeline ini untuk melihat potensi omzet yang akan datang. Jika ada produk dengan margin sangat tipis (HPP hampir sama dengan harga jual), Finance bisa memberikan komentar "Warning" langsung di proyek tersebut.

### 4. Referensi Teknis untuk AI Coder (Data Schema)

Minta AI Coder Anda untuk fokus pada relasi antara `SampleRequest` dan `FormulaVersion`:

```prisma
// Contoh Logika State Machine di Backend
enum PipelineStatus {
  FORMULATING
  QC_TESTING
  WAITING_CLIENT_FEEDBACK
  REVISION_NEEDED
  LOCKED
}

model SamplePipeline {
  id              String         @id @default(uuid())
  sampleRequestId String         @unique
  currentVersion  Int            @default(1)
  status          PipelineStatus @default(FORMULATING)
  assignedAnalyst String         // PIC R&D
  targetHpp       Decimal
  actualHpp       Decimal        // Live calculated
  startedAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Audit trail untuk Timeline Dashboard
  history         StatusHistory[] 
}
```



### 5. Fitur "Push to Action" (Aksi Terintegrasi)
Di setiap baris di Pipeline, harus ada tombol cepat sesuai statusnya:
1.  **Jika `FORMULATING`:** Tombol `[Lanjut ke QC]`.
2.  **Jika `QC_TESTING`:** Tombol `[Keluarkan Hasil QC]`.
3.  **Jika `WAITING_CLIENT`:** Tombol `[Terima Feedback]` atau `[Lock Formula]`.

### 4. Formulation Phase Builder (Mode Input / Lab Workspace)
* **Route / URL:** `/dashboard/rnd/formula/[id]/edit`
* **Tipe Halaman:** *Dynamic Data Entry (Interactive)*
* **Fungsi Utama:** Ini adalah ruang kerja analis kimia. Tempat R&D meracik resep berdasarkan "Fase Pencampuran" (Fase A, Fase B, dll).
* **Aksi Kunci:** * Menginput bahan baku dan persentase (Sistem memaksa *Auto-Sum* 100%).
    * Menginput Parameter QC (Target pH, Viskositas, Organoleptik).
    * Menekan tombol `[Lock Formula]` saat sampel disetujui klien.

Halaman **Formulation Phase Builder** (Ruang Kerja Lab) adalah mahakarya sesungguhnya dari modul R&D. Ini adalah "Kanvas Kimiawi" tempat analis Anda meracik produk. Jika ERP lama menggunakan tabel datar (yang secara ilmu kimia kosmetik sangat keliru), ERP V4 akan menggunakan standar **Phase-Based Manufacturing** (Pembuatan Berbasis Fase).

Berikut adalah cetak biru (*blueprint*) spesifikasi teknis dan antarmuka yang wajib Anda berikan kepada AI Coder:

***

# 🏗️ SPESIFIKASI ARSITEKTUR: FORMULATION PHASE BUILDER
**Target:** AI Coder (Frontend React/Next.js & Backend)
**URL Route:** `/dashboard/rnd/formula/[id]/edit`
**Fungsi:** Workspace interaktif untuk merancang formula kimia kosmetik berdasarkan Fase (A, B, C) dengan validasi matematis *real-time*.

## 1. FILOSOFI UI & ARSITEKTUR LAYOUT
AI Coder tidak boleh membuat form ini seperti form pendaftaran biasa. Ini harus terasa seperti *software* laboratorium. Gunakan layout terbagi (*Split Layout*).

* **Header (Metadata Info):** Menampilkan nama proyek, nama klien, **Target HPP**, dan **Target Netto (Yield)** misal: 1.000 Gram (1 Kg) untuk standar sampel.
* **Area Kiri (Main Workspace - 75%):** Tempat *Phase Blocks* (Blok Fase) berada. Setiap Fase (A, B, C) adalah *Card* tersendiri yang berisi tabel dinamis.
* **Area Kanan (The Validator Sidebar - 25%):** Panel *sticky* (tetap di tempat saat di-*scroll*) yang menampilkan instrumen vital:
    * **Progress Bar 100%:** Indikator total persentase.
    * **Live HPP Tracker:** Estimasi biaya berjalan dibandingkan dengan Target HPP klien.

## 2. LOGIKA MATEMATIS & MESIN FRONTEND (THE ENGINE)
Ini adalah instruksi krusial untuk *Frontend Developer*. Jangan membebani *database* untuk menghitung setiap ketikan angka. Kalkulasi harus terjadi di sisi klien (*browser*).

**A. Hukum Mutlak 100% (The 100% Rule)**
* R&D **hanya** menginput angka di kolom `Persentase (%)`.
* Sistem akan menjumlahkan seluruh persentase dari Fase A hingga Fase Z secara *real-time*.
* **Gembok Otomatis:** Tombol `[Kunci Formula & Setujui]` **TIDAK BISA DIKLIK (Disabled)** kecuali total persentase tepat di angka **100.00%**. 

**B. Auto-Convertion Gram/Kg (Dynamic Yield)**
* R&D tidak boleh menghitung gram secara manual. 
* Jika kolom `Persentase` diisi `5`, dan `Target Netto` adalah `1000 gram`, sistem kolom `Berat Aktual` otomatis terisi `50 gram`.
* *Rumus Frontend:* `(Input Persentase / 100) * Target Netto Gram`.

**C. Live HPP Costing**
* Setiap kali R&D memilih bahan baku kimia dari *dropdown*, sistem menarik `Average_Cost` dari modul SCM.
* HPP per bahan dihitung otomatis: `Berat Aktual (Kg) * Average_Cost`.
* Total HPP ditampilkan di Sidebar Kanan. Jika indikator HPP berubah menjadi **Merah**, artinya racikan tersebut *Overbudget* (melebihi anggaran klien).

## 3. ALUR KOMUNIKASI & MASTER DATA (COMMUNICATION PROTOCOL)

* **Fetch to SCM (Master Barang):** * *Dropdown* pencarian bahan baku HANYA menarik data dari tabel `Items` yang ber-Kategori `Bahan Baku Kimia`. Jangan sampai R&D memasukkan "Kardus" ke dalam Fase racikan.
    * Tampilkan **INCI Name** dan stok gudang saat ini di menu *dropdown* tersebut. Jika stok = 0, berikan *flag* ⚠️ (Warning SCM).
* **Push to Legal (INCI Extraction):**
    * Sistem harus memastikan setiap bahan baku yang dipilih memiliki `INCI Name` di *database*. INCI inilah yang nanti dilempar ke BPOM.
* **Push to Produksi (Batch Record):**
    * Nama Fase (Fase A), Instruksi Fase (misal: "Panaskan hingga 70°C"), dan Berat Aktual (Kg) adalah data yang akan diekstrak mesin menjadi dokumen **Batch Record PDF**.

## 4. INSTRUKSI STATE MANAGEMENT UNTUK AI CODER
> *"Gunakan `react-hook-form` dikombinasikan dengan `useFieldArray` untuk menangani array Fase dan array Bahan Baku di dalamnya. Gunakan `useWatch` untuk mengawasi perubahan input persentase dan menghitung Total Persentase serta Live HPP secara efisien tanpa perlu merender ulang seluruh komponen halaman. Simpan data (Auto-Save) ke database menggunakan teknik 'Debounce' setiap 2 detik setelah user berhenti mengetik."*

***

Untuk memastikan bahwa AI Coder (dan juga Anda) benar-benar memahami mengapa form flat ERP lama harus diganti dengan **Sistem Berbasis Fase yang dihitung secara Real-Time**, saya telah membangun simulator interaktif dari *Formulation Phase Builder* di bawah ini. 

Silakan ubah angka persentase pada bahan baku, dan lihat bagaimana hal itu berdampak pada *Validator Panel* di sebelah kanan.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"800px","prompt":"Buatlah 'Interactive R&D Phase Builder Simulator' untuk manufaktur kosmetik.\n\nObjektif: Mensimulasikan form input kimia berbasis Fase dengan kalkulasi Persentase (wajib 100%) dan HPP secara real-time.\n\nData State Awal:\n- Target Yield: 1000 Gram\n- Target HPP: Rp 20.000\n- Fase A (Water Phase): \n  - Aqua (Rp 5.000/kg) | Input %: 70\n  - Glycerin (Rp 15.000/kg) | Input %: 5\n- Fase B (Active Phase):\n  - Niacinamide (Rp 250.000/kg) | Input %: 5\n\nStruktur Layout:\n1. Kiri (Main Workspace - 70%): Tampilkan kotak 'Fase A' dan 'Fase B'. Di dalam kotak, buat baris input. Hanya kolom 'Persentase (%)' yang bisa diubah (input teks/angka). Kolom 'Gram' dan 'Estimasi Biaya' adalah text read-only yang dihitung ulang setiap kali persentase berubah.\n2. Kanan (Validator Sidebar - 30%):\n   - Buat pengukur 'Total Persentase'. (Awalnya 80% berdasarkan data di atas). \n   - Buat pengukur 'Current HPP' (Dihitung dari total biaya bahan).\n   - Tampilkan tombol '[Kunci Formula]' di bagian bawah. Tombol ini WAJIB disabled (abu-abu) jika Total Persentase BUKAN 100%.\n\nBehavior Logika:\n- Jika user mengubah Niacinamide menjadi 25%, Total Persentase menjadi 100%, tombol '[Kunci Formula]' menjadi aktif, namun HPP akan melonjak dan indikator biaya berubah merah.\n- Jangan gunakan warna css eksplisit dalam prompt ini, biarkan agen UI yang menentukan warna peringatan standar.\n\nEstetika:\n- Tema: Enterprise Lab Software (Dark Mode elegan).\n- Tipografi: Angka menggunakan monospace.","id":"im_59ec6deba95b7f26"}}
```


### 5. The Formula Blueprint (Mode Output / Read-Only)
* **Route / URL:** `/dashboard/rnd/formula/[id]/view`
* **Tipe Halaman:** *Read-Only Hub & Document Generator*
* **Fungsi Utama:** Menampilkan resep yang sudah terkunci (tidak bisa diedit lagi). Ini adalah halaman sentral yang mendistribusikan data ke divisi lain.
* **Aksi Kunci:**
    * R&D menekan tombol `[📄 Generate Batch Record]` untuk mengubah % menjadi instruksi Kg (PDF) untuk divisi Produksi.
    * R&D menekan tombol `[⚖️ Push DIP to Legal]` untuk melempar nama komposisi INCI ke dasbor divisi Legal/APJ.
    * Sistem secara transparan menampilkan kalkulasi HPP final yang ditarik dari data *Moving Average Price* milik divisi SCM.

    Halaman **The Formula Blueprint** adalah titik kulminasi dari seluruh keringat dan riset tim R&D Anda. Jika halaman *Phase Builder* adalah "Dapur" tempat mereka memasak, maka *Blueprint* ini adalah **"Kitab Suci" (Single Source of Truth)** yang mengatur seluruh pergerakan pabrik.

Di ERP lama Anda (`batch-record.input.html`), orang lab atau produksi harus mengetik ulang instruksi kerja secara manual. Di V4, kita menghancurkan proses manual tersebut. Halaman *Blueprint* ini bersifat **Read-Only (Tidak bisa diedit)** dan berfungsi sebagai **Mesin Distribusi (Dispatcher)** ke divisi lain.

Berikut adalah spesifikasi arsitektur mutlak untuk halaman ini yang wajib Anda teruskan ke AI Coder:

***

# 🏗️ SPESIFIKASI ARSITEKTUR: THE FORMULA BLUEPRINT & DISPATCHER
**Target:** AI Coder (Frontend & Backend)
**URL Route:** `/dashboard/rnd/formula/[id]/view`
**Sifat Halaman:** Immutabel (Read-Only) & Event-Trigger Hub.

## 1. ATURAN IMMUTABILITAS (KEKEBALAN DATA)
* **Logika Backend:** Begitu sebuah formula mencapai status `LOCKED`, *backend* (Prisma/NestJS) wajib menolak semua *request* `PUT` atau `PATCH` ke ID formula tersebut. 
* **Jika Butuh Perubahan:** Jika Direktur atau Klien tiba-tiba minta ubah resep, R&D **tidak boleh** mengedit halaman ini. Mereka harus menekan tombol `[Buat Versi Revisi]`, yang mana sistem akan melakukan *cloning* data ke Versi Baru (V2) dan membuka kembali *Phase Builder* yang kosong, sementara V1 tetap menjadi sejarah murni.

## 2. STRUKTUR LAYOUT & KONTEN (UI)
Desainnya tidak boleh terlihat seperti *form input*. Harus terlihat seperti dokumen resmi bersertifikat.

**A. Header (Status & Identitas)**
* Tampilkan **Watermark/Badge BESAR:** `🔒 LENGKAP & TERKUNCI`.
* Tampilkan Metadata: Kode Formula, Nama Klien, Nama Analis, dan Tanggal Kunci.
* Tampilkan **Final HPP per Kg** dan **Status Margin** (Aman/Bahaya).

**B. Body (Tabel Resep Read-Only)**
* Menampilkan daftar Fase (Fase A, B, C) dengan kolom: Nama Bahan, INCI Name, Fungsi, dan **Hanya Persentase (%)**. *(Jangan tampilkan Gram di sini, karena ukuran Gram akan bervariasi tergantung pesanan BusDev).*
* Menampilkan Parameter QC Final (Target pH, Viskositas, Warna, Aroma).

**C. Sidebar / Action Hub (Mesin Distribusi)**
Di sinilah letak kecanggihan V4. Sediakan 3 Tombol Eksekusi (*Hard-Gates*) untuk mendistribusikan "Kitab Suci" ini ke divisi lain.

## 3. PROTOKOL KOMUNIKASI (TOMBOL AKSI)

### Aksi 1: `[📄 Generate Batch Record]` (R&D $\rightarrow$ Produksi)
* **Pemicu:** BusDev menurunkan SPK (Surat Perintah Kerja) sebesar **50 Kg**. 
* **Logika Sistem:** Sistem menarik resep 100% dari *Blueprint* ini, lalu mengalikannya dengan 50 Kg. Sistem secara otomatis men- *generate* dokumen PDF (atau tampilan digital di tablet Produksi) berisi instruksi absolut: *"Fase A: Masukkan Air 35 Kg, Gliserin 2.5 Kg. Panaskan 70°C."*
* **Efek:** Nol salah hitung, nol salah ketik oleh manusia.

### Aksi 2: `[⚖️ Push DIP to Legal]` (R&D $\rightarrow$ Legal/APJ)
* **Pemicu:** Produk butuh didaftarkan ke BPOM.
* **Logika Sistem:** Mengambil *array* dari kolom `INCI Name` dan `Persentase` pada formula ini, mengurutkannya dari persentase terbesar ke terkecil (sesuai standar BPOM), lalu mengirimkannya ke Dasbor Notifikasi BPOM milik divisi Legal.

### Aksi 3: `[📦 Release BOM to SCM]` (R&D $\rightarrow$ Gudang)
* **Pemicu:** Formula disetujui, siap produksi massal.
* **Logika Sistem:** Menjadikan formula ini sebagai *Bill of Materials* resmi. SCM kini memiliki dasar hukum untuk memotong stok gudang setiap kali barang ini diproduksi, dan dasar untuk memesan bahan baku ke *supplier*.

***

Untuk memberikan visualisasi yang kuat kepada Anda dan AI Coder mengenai bagaimana halaman *Read-Only* ini bertindak sebagai "Mesin Distribusi", silakan uji coba dasbor simulator di bawah ini. Cobalah klik tombol-tombol aksinya untuk melihat bagaimana sistem V4 menerjemahkan persentase menjadi instruksi.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"750px","prompt":"Buatlah 'Formula Blueprint & Dispatcher Simulator' untuk ERP V4.\n\nObjektif: Mensimulasikan halaman Read-Only dari formula yang sudah terkunci dan bagaimana tombol aksinya mendistribusikan data ke divisi lain.\n\nData State:\n- Formula: F-2026-088 (Luminous Serum - Aureon Beauty)\n- Status: LOCKED / APPROVED\n- Fase A: Aqua (75%), Niacinamide (5%)\n- Fase B: Glycerin (20%)\n\nStruktur Layout:\n1. Area Utama (Kiri - 70%): Tampilan gaya dokumen/sertifikat resmi. Tampilkan Badge 'LOCKED' yang jelas. Tampilkan tabel resep yang bersih (Hanya INCI Name dan Persentase). Tampilkan blok Parameter QC (Target pH 5.5).\n2. Sidebar Aksi (Kanan - 30%): 'Distribution Hub'. Berisi 3 kartu/tombol aksi besar:\n   - Tombol 1: '[📄 Generate Batch Record]'\n   - Tombol 2: '[⚖️ Push DIP to Legal]'\n   - Tombol 3: '[📦 Sync BOM to SCM]'\n\nBehavior Logika:\n- Jika user mengklik '[📄 Generate Batch Record]', munculkan simulasi pop-up/panel kecil yang menunjukkan konversi perhitungan: 'SPK: 50 Kg -> Aqua: 37.5 Kg, Niacinamide: 2.5 Kg, Glycerin: 10 Kg'.\n- Jika user mengklik '[⚖️ Push DIP to Legal]', munculkan notifikasi sukses bahwa 'Data INCI berhasil dikirim ke Antrean BPOM Legal'.\n\nEstetika:\n- UI: Silent Luxury (Dark Mode #000000).\n- Gaya: Tegas, administratif, high-density, memberikan kesan keamanan data dan immutabilitas.","id":"im_61cad95f9e52a8ca"}}
```
