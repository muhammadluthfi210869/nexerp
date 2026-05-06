Ini adalah inti dari *Enterprise Resource Planning* sejati. Kita akan membunuh tradisi kuno di mana HR membagikan form Excel setiap akhir bulan untuk menilai karyawan. Di V4, HR bertindak sebagai **"The Invisible Appraiser"** (Penilai Tak Kasat Mata).

Data performa tidak diinput manual. Sistem akan secara pasif "mencuri dengar" (*eavesdropping*) dari aktivitas setiap karyawan saat mereka menekan tombol di modul masing-masing.

Berikut adalah rancangan absolut untuk **Proses Bisnis dan Protokol Komunikasi (Event-Driven KPI)** yang menyuplai data ke Dasbor HR Anda secara otomatis.

---

### 1. Proses Bisnis: The Passive Harvesting
Sistem HR V4 tidak memiliki form input performa. Halaman HR bertindak murni sebagai "Penerima Sinyal" (Receiver) dari 6 modul operasional lainnya.

*   **Fase 1: Pemicu Aktivitas (Action)**
    Karyawan melakukan tugas hariannya. (Contoh: Nisa di Marketing membuat SO, Agus di Produksi menyelesaikan proses *Mixing*).
*   **Fase 2: Tembakan Webhook (The Trigger)**
    Sistem di modul tersebut menembakkan data JSON kecil ke *Endpoint* Modul HR secara otomatis di belakang layar.
*   **Fase 3: Agregasi & Ekuivalensi Nilai (The Scoring)**
    *Backend* HR menerima data tersebut, melihat ID Karyawan, dan menambahkan "Poin Positif" atau "Poin Penalti" ke dalam keranjang performa mereka bulan itu.
*   **Fase 4: Real-Time Render**
    Dasbor Yulia (HR) dan Fadhilah/Bagir (*Head*) akan bergerak naik turun angkanya setiap detik mengikuti aktivitas pabrik yang sedang berjalan.

---

### 2. Protokol Komunikasi: Peta Integrasi Lintas Divisi
Agar Dasbor HR bisa melacak semua orang, AI Coder Anda harus memasang *Event Listener* di setiap ujung modul. Berikut adalah data persis yang ditarik oleh sistem HR dari masing-masing divisi:

#### A. Data Tarikan Divisi Marketing / BusDev (Contoh: Nisa, Diva)
*   **Trigger (Listen to Modul Sales):** `SO_STATUS_CHANGED_TO_WAITING_DP` dan `DP_PAID`.
*   **Data Output ke HR:**
    *   `Total Omset Valid (Rp)`: Mengukur pencapaian target penjualan bulanan.
    *   `Lead-to-Order Conversion Time`: Waktu yang dibutuhkan dari pembuatan prospek hingga klien membayar DP.

#### B. Data Tarikan Divisi R&D (Contoh: Amira, Panca)
*   **Trigger (Listen to Modul QC & Pra-Produksi):** `FORMULA_SUBMITTED` dan `QC_BULK_INSPECTION`.
*   **Data Output ke HR:**
    *   `SLA Penyelesaian Formula`: Durasi hari dari *Design Brief* hingga sampel disetujui klien.
    *   `Formula Defect Rate (Penalti)`: Jika QC menekan tombol `HOLD_ADJUSTMENT` di mesin *Mixer*, poin KPI R&D otomatis terpotong karena formula mereka terbukti tidak stabil di skala besar.

#### C. Data Tarikan Divisi Produksi (Contoh: Agus, Makhmud)
*   **Trigger (Listen to Modul Produksi & QC):** `BATCH_MIXING_DONE` dan `IN_PROCESS_QC`.
*   **Data Output ke HR:**
    *   `Volume Output`: Jumlah kilogram cairan atau *pieces* botol yang diselesaikan *operator* per *shift*.
    *   `Production Reject Rate (Penalti)`: Jika QC menekan `REJECT` atau mesin *Filling* bocor, poin KPI *operator* yang bertugas di *batch* tersebut dipotong otomatis.

#### D. Data Tarikan Divisi Quality Control (Contoh: Ribut)
*   **Trigger (Listen to Modul QC):** `QUARANTINE_SCANNED` dan `STATUS_DISPOSITION`.
*   **Data Output ke HR:**
    *   `Inspection SLA`: Kecepatan waktu QC memvonis barang sejak drum keluar dari mesin *Mixer* (Tujuan: mencegah *bottleneck* antrean drum).
    *   `Inspection Volume`: Berapa banyak drum/palet yang diinspeksi per hari.

#### E. Data Tarikan Divisi SCM / Purchasing / Gudang (Contoh: Bagir, Ghufron, Irma)
*   **Trigger (Listen to Modul SCM):** `PO_GENERATED`, `GOODS_RECEIPT`, dan `DELIVERY_SHIPPED`.
*   **Data Output ke HR:**
    *   `Material Availability Rate`: Jika produksi terhenti karena bahan baku habis, poin KPI *Purchasing* (Irma/Bagir) terpotong.
    *   `Inventory Accuracy`: Hasil kecocokan antara *Stock Opname* fisik dan data sistem di gudang.
    *   `On-Time Delivery`: Ketepatan waktu barang sampai ke tangan klien.

#### F. Data Tarikan Divisi Creative / Design (Contoh: Gusti, Edi, Diaz)
*   **Trigger (Listen to Modul Creative):** `ARTWORK_UPLOADED` dan `DESIGN_LOCKED`.
*   **Data Output ke HR:**
    *   `SLA Design`: Waktu yang dibutuhkan dari *briefing* BusDev hingga *upload* V1.
    *   `Revision Loop Count (Penalti)`: Semakin banyak versi (V2, V3, V4) yang dibuat karena ditolak oleh Legal/APJ atau Klien, semakin kecil skor kualitas desainer tersebut.

---

### 3. Solusi Sistemik untuk Masalah "Dual-Role" (Peran Ganda)
Saya perhatikan di struktur Anda, Amira memegang fungsi R&D sekaligus Penyelia Halal, dan Irma di Keuangan sekaligus Purchasing. Sistem yang kaku akan bingung menghitung KPI mereka.

**Solusi Algoritma (Dual-Scorecard):**
*Backend* HR harus memisahkan perhitungan berdasarkan *Role ID*, bukan *User ID*. 
Saat sistem mengakumulasi poin Irma, sistem akan membuat dua rapot virtual:
1. `Scorecard Keuangan`: (Misal: Kecepatan memproses *invoice*).
2. `Scorecard Purchasing`: (Misal: Kecepatan menerbitkan PO bahan baku).
Di Dasbor HR, nilai Irma adalah **Nilai Rata-rata Gabungan (Weighted Average)** dari kedua peran tersebut. Sistem tidak akan pernah *error* dan karyawan mendapat penilaian yang sangat adil atas beban kerja gandanya.

Secara arsitektural, **ya, pasti ada input.** Namun, Anda harus membedakan antara **"Input Aktif"** (diketik oleh manusia) dan **"Input Pasif"** (ditarik otomatis oleh sistem dari modul lain). Kelemahan sistem HR tradisional adalah terlalu banyak meminta *Input Aktif* untuk hal-hal yang sebenarnya bisa dilacak.

Berikut adalah pemetaan absolut untuk Input dan Output (I/O) pada 2 Halaman Utama di Modul HR V4:

---

### 1. Page: HR & Executive Command Center (Desktop UI)
Halaman ini adalah pusat komputasi dan pengaturan. Semua aturan main perusahaan diketik di sini.

#### Tab A: Organogram & Master Data (Pusat Aturan)
*   **Input (Aktif oleh HR):**
    *   Pendaftaran Karyawan Baru (Nama, Rekening Bank, Jabatan).
    *   Definisi *Dual-Role* (Memasukkan 1 Karyawan ke 2 Divisi berbeda).
    *   *Target Setting*: Menetapkan angka target bulanan per divisi (Misal: Target BusDev Rp 500 Juta, Target Produksi 5 Ton, Target Max Reject QC 2%).
    *   *Approval Routing*: Menentukan hierarki (Siapa menyetujui cuti siapa).
*   **Output:**
    *   Pohon hierarki organisasi (Digital Twin) yang mengatur arus *approval* di seluruh modul ERP.

#### Tab B: Performance Matrix (Dasbor Pemantauan)
*   **Input (Aktif oleh Head/Manager):**
    *   *Subjective Review*: Form penilaian akhir bulan (Bobot 30%) untuk bawahan langsung mereka. Menilai variabel non-teknis seperti inisiatif dan etika kerja.
*   **Input (Pasif dari ERP):**
    *   Tarikan data JSON (*Webhooks*) dari aktivitas Modul Sales, R&D, QC, dan SCM (Bobot 70%).
*   **Output:**
    *   *Leaderboard* Karyawan (Peringkat performa tertinggi ke terendah).
    *   *Leakage Warning*: Indikator visual merah jika suatu divisi gagal mencapai target mingguan mereka.

#### Tab C: Payroll & Settlement (Penggajian)
*   **Input (Aktif oleh HR):**
    *   Pemotongan manual (misal: bayar cicilan kasbon).
    *   Klik tombol `[Generate Payroll]`.
*   **Output:**
    *   Slip Gaji Elektronik (PDF) untuk semua karyawan.
    *   File CSV format Bank (*Payroll Disbursement*) untuk diunggah ke *Internet Banking* perusahaan.
    *   *Jurnal Gaji Otomatis*: Sistem menembakkan *output* berupa Jurnal Akuntansi (Beban Gaji pada Kas) ke Modul Finance secara transparan.

---

### 2. Page: Employee Self-Service Portal (Mobile / Tablet UI)
Halaman ini adalah "Rapor" dan "Loket Administrasi" untuk staf. Desainnya harus seringan mungkin.

#### Tab A: Live Scorecard (Rapor Kinerja)
*   **Input:** **TIDAK ADA INPUT.** Karyawan dilarang keras menginput atau memanipulasi data performa mereka sendiri.
*   **Output:**
    *   Meteran visual pencapaian target berjalan (Misal: "SLA Pengiriman: 95% Sesuai").
    *   Transparansi poin penalti (Misal: "-5 Poin karena *Batch* X di-*reject* QC").

#### Tab B: Attendance & Tracker (Absensi)
*   **Input (Aktif oleh Karyawan):**
    *   Tombol `[Clock In]` dan `[Clock Out]`.
    *   Kordinat GPS aktual ponsel karyawan dan foto *selfie* (mencegah titip absen). ATAU jika Anda menggunakan mesin absensi sidik jari di pabrik, sistem akan menarik log data tersebut secara *Pasif*.
*   **Output:**
    *   Riwayat jam masuk/keluar bulan berjalan.
    *   Akumulasi pemotongan poin akibat keterlambatan atau *Alpha*.

#### Tab C: Ticketing Area (Administrasi Karyawan)
*   **Input (Aktif oleh Karyawan):**
    *   *Form Cuti*: Pilih tanggal mulai-selesai dan alasan.
    *   *Form Lembur*: Input jam mulai-selesai dan pekerjaan yang diselesaikan (wajib sebagai justifikasi penambahan upah).
    *   *Form Reimburse*: Upload foto bon/struk, input nominal, dan kategori (misal: Bensin, Tol, Perlengkapan Pabrik).
*   **Output:**
    *   Status pengajuan tiket secara *real-time* (`WAITING_APPROVAL`, `APPROVED`, `REJECTED`).
    *   (Jika *Reimburse* disetujui), *output* sistem otomatis melempar tagihan ini ke antrean "Kas Keluar" di Modul Finance untuk dicairkan oleh Bendahara.
