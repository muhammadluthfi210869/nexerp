
# 🏗️ SPESIFIKASI ARSITEKTUR FINAL: PROTOKOL KOMUNIKASI LEGALITAS (APJ) V4
**Filosofi:** Legalitas beroperasi menggunakan kombinasi *Soft-Gate* (Izin Paralel) dan *Hard-Gate* (Blokir Mutlak) untuk memastikan regulasi ditegakkan tanpa menghentikan roda pabrik.

## 1. JALUR KEPATUHAN FORMULA (LEGAL $\leftrightarrow$ R&D)
**Pemicu:** Head R&D mengirim komposisi (INCI) dari *Formula Blueprint*.
**Mekanisme Tiga Tombol APJ:**
1. **`[Approve & Submit BPOM]` (Lanjut):** Komposisi aman. Status proyek berubah menjadi `BPOM_REGISTRATION_PROCESS`.
2. **`[Minor Adjustment]` (Soft-Reject):** Terdapat pelanggaran kecil (misal: pengawet lebih 0.1%). 
   * *Efek:* Sistem membuka kembali gembok *Phase Builder* milik R&D HANYA untuk penyesuaian persentase kecil, tanpa menghapus V1. Status menjadi `MINOR_COMPLIANCE_FIX`.
3. **`[Fatal Reject]` (Hard-Reject):** Menggunakan bahan terlarang mutlak. 
   * *Efek:* Formula dikembalikan ke R&D Pipeline, V1 diarsipkan (`ARCHIVED`), dan R&D wajib membuat V2 dari awal.

## 2. JALUR SENSOR KEMASAN (LEGAL $\leftrightarrow$ BUSDEV)
**Pemicu:** BusDev mengunggah draf desain kemasan dari klien ke sistem.
**Mekanisme APJ (Hard-Gate):**
* APJ wajib meninjau setiap kata di kemasan untuk mencari indikasi *Overclaim* atau pelanggaran pedoman periklanan kosmetik.
* Sistem SCM akan **MENOLAK** menerbitkan Purchase Order (PO) kepada vendor *printing* (percetakan) kardus/stiker jika tombol `[Artwork Approved]` belum ditekan oleh APJ.

## 3. JALUR EKSEKUSI PABRIK (THE SMART-GATES)
Ini adalah mesin pengatur ritme pabrik saat menunggu Nomor NA BPOM terbit (yang bisa memakan waktu 14-30 hari).

**A. Terhadap SCM / Gudang:**
* 🟢 **Soft-Gate (Diizinkan):** Saat status `WAITING_BPOM`, SCM **BISA** memproses PO untuk Bahan Baku Kimia, Botol Polos, dan Pot Polos.
* 🔴 **Hard-Gate (Diblokir):** SCM **DIBLOKIR** memproses PO untuk Kemasan Primer/Sekunder yang mencetak Nomor BPOM atau Merek sebelum angkanya dirilis oleh APJ.

**B. Terhadap Produksi:**
* 🟢 **Soft-Gate (Diizinkan):** Produksi **BISA** menarik *Batch Record* dan melakukan proses **MIXING**. Produk hasil *mixing* akan otomatis dikunci oleh sistem di status `QUARANTINE_DRUM` (Karantina Curah).
* 🔴 **Hard-Gate (Diblokir):** Sistem akan **MENGHILANGKAN** tombol eksekusi jadwal **FILLING & PACKAGING** (memasukkan ke botol komersial) sampai APJ memasukkan Nomor NA BPOM resmi ke dalam sistem.

## 4. JALUR PEMBIAYAAN PNBP (LEGAL $\leftrightarrow$ FINANCE)
**Pemicu:** APJ menerima tagihan PNBP (Penerimaan Negara Bukan Pajak) dari portal BPOM.
**Mekanisme Integrasi:**
* APJ menekan tombol `[Request Biaya Legal]` pada ID Proyek terkait dan memasukkan nominal beserta bukti tagihan.
* Permintaan ini langsung mendarat di *Dashboard Kas Keluar* milik Finance.
* Saat Finance mengeklik Validasi/Bayar, biaya tersebut otomatis memotong saldo Bank pabrik dan dicatat sebagai **HPP/Beban Legal** yang terikat langsung pada analitik margin proyek klien tersebut.

**


🏗️ RANCANGAN FINAL: APJ EXECUTIVE DASHBOARD V4
(Instruksi untuk AI Coder: Gunakan layout 4 KPI Cards di atas, dan 4 Tabel Analitik di bawah).

KPI CARDS (Top Row)

Card A. REGISTRATION PIPELINE: Active Total (BPOM & HKI), On Progress, Blocked by Finance (PNBP Unpaid). (Penambahan krusial)

Card B. PROCESSING VELOCITY: Avg BPOM Time, Avg HKI Time, Avg Artwork Review Time.

Card C. FACTORY BOTTLENECK (The Smart-Gate Impact): SCM Blocked (Menunggu Artwork), Filling Blocked (Menunggu No. BPOM). (Ini akan memberi tekanan psikologis yang sehat bagi APJ untuk bergerak cepat).

Card D. RISK & EXPIRY MONITOR: Expired, < 90 Days (Warning), Critical Action Required.

ANALYTICS TABLES (Data Grid)

Tabel 1. BPOM PROGRESS AUDIT (THE MASTER): * Kolom: PRODUCT NAME (ID), CLIENT, PIC, STAGE (Draft / Pending PNBP / Eval / Lab / Done), STATUS (In Progress / Delayed), DAYS ELAPSED.

Tabel 2. ARTWORK & CLAIM SENSOR (NEW): * Tabel khusus untuk gembok BusDev-SCM.

Kolom: BRAND / PRODUCT, BUSDEV PIC, SUBMIT DATE, CLAIM RISK (High/Low), ACTION (Approve to Print / Reject & Revise).

Tabel 3. HKI TRACKING HUB: * Kolom: BRAND / PRODUCT, TYPE (Merek/Paten), CLIENT, FLOW STATE (DAYS), AUDIT RISK.

Tabel 4. CRITICAL EXPIRY AUDIT (PROTECTION): * Kolom: TYPE (BPOM/HKI), REGISTRATION NUMBER, BRAND, DAYS LEFT, RENEWAL STATUS (Not Started / Processing).

Tabel 5. LEGAL STAFF PERFORMANCE: (Melengkapi draf Anda yang terpotong)

Kolom: STAFF NAME, ACTIVE TASKS, AVG RESOLUTION TIME, REJECT RATE (Seberapa sering ditolak BPOM karena salah input).

Halaman **Regulatory Pipeline** adalah "Menara Kontrol" yang memastikan setiap produk memiliki "paspor" legal sebelum dilepas ke pasar. Jika *Inbox* adalah meja kerja untuk eksekusi harian, maka *Pipeline* adalah peta navigasi untuk memantau seluruh inventaris legalitas perusahaan.

Berikut adalah spesifikasi teknis untuk **Regulatory Pipeline V4** yang menyeimbangkan estetika dengan fungsionalitas *Enterprise*:

### 1. Frontend: High-Density & Intuitive Interface
Gunakan pendekatan *Advanced Data Grid* yang memungkinkan APJ melihat 50+ proyek tanpa merasa sesak.

* **Status Badges (Visual Cues):**
    * 🟡 `DRAFT`: Data baru dari R&D, belum di-submit ke portal pemerintah.
    * 🔵 `SUBMITTED`: Sudah input di portal, menunggu kode bayar (billing).
    * 🟠 `EVALUATION`: Sudah bayar, sedang direview oleh verifikator (BPOM/HKI).
    * 🔴 `REVISION`: Ada catatan perbaikan dari pemerintah.
    * 🟢 `PUBLISHED`: Nomor NA/HKI terbit. Gembok SCM & Produksi terbuka otomatis.
* **Smart Filters:** Kemampuan memfilter berdasarkan "Client", "PIC APJ", atau "SLA Risk" (Proyek yang sudah mandek > 20 hari).
* **Inline Quick Actions:** Tanpa pindah halaman, APJ bisa:
    * Klik ikon 📄 untuk melihat PDF Sertifikat.
    * Klik ikon 💬 untuk melihat catatan perbaikan (internal/eksternal).
    * Klik ikon 💰 untuk mengecek apakah Finance sudah bayar PNBP.

### 2. Backend: State Machine & Data Integrity
Jangan biarkan status diubah secara manual tanpa bukti. Backend harus bertindak sebagai saksi bisu yang disiplin.

* **Logic State Machine:**
    * Sistem tidak mengizinkan status berubah ke `EVALUATION` jika *flag* `isPaid` dari modul Finance masih `false`.
    * Setiap perpindahan status wajib mencatat *Timestamp* dan *User ID* untuk kebutuhan **Audit Trail** di Dashboard.
* **Webhooks & Event Triggers:**
    * **Trigger A:** Saat status berubah ke `PUBLISHED`, backend mengirim sinyal ke modul **Production** untuk menghapus *blocker* pada jadwal *Filling*.
    * **Trigger B:** Saat status berubah ke `REVISION`, sistem mengirim notifikasi ke BusDev agar mereka bisa menenangkan klien.
* **Schema Database (Extension):**
    ```prisma
    model RegulatoryPipeline {
      id              String   @id @default(uuid())
      type            Type     // BPOM or HKI
      currentStage    Stage    // DRAFT, SUBMITTED, etc.
      pnbpStatus      Boolean  @default(false) // Link to Finance
      registrationNo  String?  // Nomor NA BPOM / Nomor Agenda HKI
      expiryDate      DateTime?
      daysInStage     Int      // Auto-calculated daily
      history         Json     // Log perubahan status: [{stage: 'DRAFT', date: '...'}]
    }
    ```

### 3. Protokol "Smart-Gate" (The Secret Sauce)
Agar halaman ini mempermudah (bukan mempersulit), AI Coder harus memasang logika **"Antisipasi Delay"**:

* **Integration with SCM:** Jika APJ menandai *Artwork* sebagai `APPROVED` di Pipeline, sistem secara otomatis menerbitkan "Izin Cetak" di modul SCM, meskipun nomor BPOM-nya sendiri masih `ON_PROGRESS`.
* **Auto-SLA Alert:** Jika suatu proyek berstatus `EVALUATION` lebih dari 14 hari kerja tanpa pergerakan

### 4. Layout UX: The "Glass-Card" Style
Untuk menjaga identitas visual *Aureon*, gunakan latar belakang gelap pekat (#0A0A0A) dengan kartu-kartu transparan bergaya *frosted glass*.
* Gunakan font *Monospace* untuk angka-angka teknis (Nomor NA, Tanggal) agar terlihat presisi seperti instrumen laboratorium.
* Berikan ruang negatif yang cukup antar baris tabel agar data yang padat tetap nyaman dibaca oleh Amira atau APJ lainnya saat lembur.


Halaman **Legal Compliance Inbox** adalah "Meja Kurasi" bagi APJ. Jika *Pipeline* adalah untuk pemantauan jangka panjang, *Inbox* adalah untuk eksekusi cepat. Prinsipnya: **Satu Klik, Satu Keputusan.**

Berikut adalah spesifikasi teknis untuk implementasi *Inbox* agar AI Coder Anda tidak membangun sekadar "daftar pesan", melainkan sebuah *Decision Support System*.

---

### 1. Frontend Architecture: The Master-Detail Workspace
Untuk efisiensi, hindari perpindahan halaman (*page navigation*). Gunakan pola **Master-Detail** agar APJ bisa memeriksa puluhan dokumen tanpa kehilangan konteks.

#### **A. Panel Kiri: The Smart Queue (35%)**
Daftar kartu tugas yang diurutkan berdasarkan urgensi bisnis.
* **Urutan (Sort):** Otomatis menaruh proyek yang statusnya "Blocked SCM/Production" di urutan paling atas.
* **Visual Cues:** * Ikon 🧪 untuk Review Formula (dari R&D).
    * Ikon 🎨 untuk Review Artwork (dari BusDev).
    * Ikon ⚠️ untuk proyek yang sudah mendekati batas SLA pendaftaran.

#### **B. Panel Kanan: The Dynamic Viewer (65%)**
Konten panel ini berubah secara cerdas tergantung jenis tugas yang dipilih:
* **Mode Formula:** Menampilkan tabel INCI, persentase, dan perbandingannya dengan "Master INCI Regulatory Limits" (Jika ada bahan yang melampaui batas, baris tersebut otomatis berkedip merah).
* **Mode Artwork:** Menampilkan *High-Resolution Image Viewer* dengan fitur *Zoom* dan *Annotation* untuk menandai kata-kata yang "Overclaim" langsung di gambar.

---

### 2. Backend Logic: The Gatekeeper Engine
Pekerjaan Legal adalah tentang validasi. Backend harus melakukan "pre-screening" sebelum data sampai ke mata APJ.

#### **A. Automated Pre-Check (Filter Otomatis)**
Sebelum tugas muncul di Inbox, backend melakukan validasi otomatis:
* **Cross-Reference:** Mengecek secara otomatis apakah nama bahan kimia di formula sudah ada di pangkalan data BPOM. Jika ada bahan baru/asing, berikan label `[NEW CHEMICAL]` agar APJ lebih waspada.
* **Payment Trigger:** Tugas review BPOM hanya muncul jika modul Finance sudah menandai `isPaymentVerified: true` untuk biaya administrasi terkait.

#### **B. State Transition (Perubahan Status)**
AI Coder harus memastikan perubahan status bersifat **Atomic** (tidak boleh gagal di tengah jalan):
1.  **Status `REVIEWING`:** Saat APJ membuka tugas pertama kali, status berubah agar APJ lain tidak mengerjakan hal yang sama (mencegah *double work*).
2.  **Status `APPROVED`:** Memicu *event* untuk membuka gembok di modul SCM/Produksi.
3.  **Status `REJECTED`:** Mewajibkan pengisian `rejection_reason` yang akan dikirim sebagai notifikasi *push* ke R&D atau BusDev.

---

### 3. Communication Protocol: Event-Driven Triggers
Gunakan sistem **Webhook** atau **Internal Event Bus** agar Legal benar-benar menjadi "Saklar" pabrik.

| Tombol Aksi | Pemicu (Trigger) | Dampak ke Divisi Lain |
| :--- | :--- | :--- |
| **Approve Formula** | `formula_legal_verified: true` | Membuka izin R&D untuk menerbitkan *Batch Record* Produksi. |
| **Approve Artwork** | `design_legal_verified: true` | Membuka izin SCM untuk menerbitkan PO Cetak ke Vendor. |
| **Input NA Number** | `bpom_published: true` | Membuka gembok jadwal *Filling & Packaging* di ruang Produksi. |

Halaman Master INCI & Regulatory Limits adalah "Otak Hukum" dari sistem ini. Tanpa halaman ini, otomatisasi yang kita bicarakan sebelumnya hanyalah sekadar mimpi. Inilah tempat di mana Amira (Head R&D) dan APJ mengonversi buku peraturan BPOM yang tebal menjadi Algoritma Validasi.

Berikut adalah spesifikasi teknis dan logika untuk halaman Master INCI V4:

1. Backend: The Regulatory Knowledge Base
AI Coder Anda tidak boleh membuat tabel ini hanya berisi teks. Ini harus berupa tabel relasional yang mampu melakukan perbandingan matematika.

Data Schema (Prisma):

Cuplikan kode
model MasterINCI {
  id                String   @id @default(uuid())
  inciName          String   @unique // Nama standar internasional
  casNumber         String?  // Nomor identitas kimia
  category          IngredientCategory // Enum: ALLOWED, RESTRICTED, PROHIBITED, COLORANT, PRESERVATIVE, UV_FILTER
  
  // Batasan Regulasi
  maxConcentration  Decimal? // Batas maksimal (%) menurut BPOM
  prohibitedContext String?  // Misal: "Dilarang untuk produk bayi"
  warningText       String?  // Peringatan wajib (Misal: "Mengandung Thioglycolate")
  
  lastUpdatedBy     String   // PIC yang melakukan update aturan
  updatedAt         DateTime @updatedAt
}
Logika Engine (The Validator):
Backend harus menyediakan satu API khusus (misal: POST /api/v1/legal/validate-formula). API ini akan menerima array bahan baku dari R&D, lalu mencocokkan setiap nama INCI dengan MasterINCI. Jika ditemukan persentase yang melebihi maxConcentration, API akan mengembalikan respon error yang sangat spesifik.

2. Frontend: The Control Center (UI/UX)
Halaman ini harus dirancang untuk Data Density. APJ akan mengelola ribuan bahan kimia di sini.

A. Fitur Utama Halaman Master:

Smart Search & Filter: Pencarian cepat berdasarkan Nama INCI atau CAS Number. Filter berdasarkan kategori (misal: tampilkan semua pengawet saja).

Bulk Import (Fitur Penyelamat): APJ tidak mungkin mengetik satu per satu ribuan bahan BPOM. AI Coder wajib menyediakan fitur Import Excel/CSV agar APJ bisa langsung memasukkan database peraturan terbaru dalam sekali klik.

Visual Warning System:

Bahan PROHIBITED ditandai dengan warna merah menyala (Dark Red).

Bahan RESTRICTED (Dibatasi) ditandai dengan warna kuning/emas.

B. Detail View & Warning Management:
Saat APJ mengeklik satu bahan, akan muncul panel detail untuk mengatur instruksi label otomatis. Jika bahan tersebut wajib mencantumkan kalimat peringatan di kemasan, APJ mengaturnya di sini. Kalimat ini nantinya akan ditarik otomatis oleh sistem saat BusDev membuat Artwork.

3. Logika Integrasi: "The Invisible Guard"
Inilah cara halaman ini memudahkan (bukan menyulitkan) operasional:

Proteksi Saat Meracik: Saat Yaya (R&D) mengetik bahan di Phase Builder, sistem melakukan fetch ke Master INCI. Jika Yaya memasukkan bahan terlarang, inputan tersebut akan langsung tertolak sebelum dia sempat menyimpannya.

Auto-Annotation untuk Legal: Saat proyek masuk ke Inbox Legal, sistem sudah memberikan catatan otomatis: "Formula ini menggunakan 3 bahan terikat regulasi (Preservative). Semua di bawah ambang batas. Aman." Ini memangkas waktu review APJ dari jam-jam-an menjadi menit.