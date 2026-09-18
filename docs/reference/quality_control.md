### A. 4 Card Indikator Kritis (Top Level Pulse)
Area ini memberikan ringkasan performa mutu pabrik dalam hitungan detik.

1. **Card FTY (First Time Yield):** Persentase produk yang lolos 4 fase QC tanpa cacat atau tanpa perlu perbaikan (*rework*). 
   * *Target:* > 98%. Jika angka ini turun, pabrik sedang membuang-buang waktu dan bahan.
2. **Card COPQ (Cost of Poor Quality):** Nilai kerugian absolut (dalam Rupiah) dari seluruh barang yang berstatus `REJECTED` bulan ini. Angka ini ditarik langsung dari HPP di modul Finance.
3. **Card LEAKAGE HOTSPOT:** Menampilkan fase mana yang paling banyak menghasilkan produk gagal secara *real-time*. (Misal: `FASE FILLING - 45% Total Reject`).
4. **Card ACTIVE QUARANTINES:** Jumlah *Batch* atau Truk Supplier yang saat ini tertahan dan belum divonis. Menandakan *bottleneck* di tim lab.

---

### B. 3 Visualisasi Pola (Pattern Trackers)
Ini adalah mesin penjawab untuk masalah "pola supplier jelek" dan "rusak selalu di botol". Backend harus mengolah data *log* penolakan menjadi grafik.



1. **Grafik Radar Kinerja Supplier (Inbound Quality):**
   * *Sumbu:* Nama Supplier (Top 5).
   * *Data:* Persentase kedatangan barang cacat. Jika "PT Plastik Jaya" grafiknya meruncing ke arah *Reject*, Kepala QC punya data absolut untuk memaksa tim SCM mencari vendor botol baru.
2. **Pareto Tipologi Cacat (Defect Distribution):**
   * *Tipe Visual:* *Bar Chart* diurutkan dari yang terbesar.
   * *Data:* Memecah kategori *reject*. Bar tertinggi mungkin menunjukkan "Botol Penyok/Bocor" (30%), diikuti "pH Out of Spec" (20%), lalu "Label Miring" (15%). Ini memberitahu divisi Maintenance mesin mana yang harus segera dikalibrasi.
3. **Funnel Degradasi Mutu (Quality Drop-off):**
   * *Tipe Visual:* Diagram Corong (*Funnel*).
   * *Data:* Melacak satu siklus produksi. Masuk fase *Mixing* (1000 Kg) $\rightarrow$ *Filling* (Tersisa 980 Kg setara botol karena tumpah/bocor) $\rightarrow$ *Packing* (Tersisa 960 Kg setara produk jadi karena boks cacat). Titik penyusutan terbesar langsung terlihat.

---

### C. 2 Tabel Analitik Granular (Actionable Output)
Tabel ini berisi data kotor yang sudah disaring agar Kepala QC bisa langsung melakukan penindakan (Eskalasi).

1. **Tabel "Critical Vendor Watchlist":**
   * *Kolom:* `Nama Supplier` | `Material Terdampak` | `Total Reject (Bulan Ini)` | `Nilai Kerugian (Rp)` | `Status Rekomendasi`.
   * *Logika:* Backend secara otomatis memasukkan *supplier* ke tabel ini jika *Acceptance Rate* mereka turun di bawah 90%. Tombol `[Blokir Vendor]` tersedia di ujung baris, yang jika diklik akan mengunci *supplier* tersebut di halaman *Purchase Order* (Modul SCM).
2. **Tabel "Rework & Hold Action Log":**
   * *Kolom:* `Nomor Batch` | `Fase` | `Alasan Hold (Misal: Viskositas Rendah)` | `Durasi Tertahan (Jam)` | `Status R&D`.
   * *Logika:* Menampilkan proyek-proyek yang sedang macet di tengah jalan karena menunggu "Resep Koreksi" dari R&D. Baris akan berkedip merah jika *Durasi Tertahan* melebihi 24 jam, karena cairan curah di dalam mesin *mixer* bisa rusak/berjamur jika didiamkan terlalu lama.

Halaman kedua, **QC Inspector Workbench**, adalah ujung tombak operasional. Meskipun secara teknis hanya satu rute URL (misal: `/qc/tablet`), halaman ini dirancang dengan logika **Polymorphic UI**—antarmuka yang berubah bentuk secara otomatis berdasarkan objek fisik yang dipindai oleh inspektur.

Berikut adalah rincian fungsionalitas dan alasan arsitektural mengapa halaman ini harus berdiri sendiri.

### Rincian Halaman: QC Inspector Workbench (Tablet UI)

Halaman ini didesain dengan prinsip **"Focus-Mode"**. Tidak ada navigasi yang rumit, hanya ada satu alur kerja linear: **Scan $\rightarrow$ Uji $\rightarrow$ Putuskan.**

**1. State: Inbound Inspection (Karantina Gudang)**
* **Trigger:** Memindai QR Code Surat Jalan atau Drum Bahan Baku dari supplier.
* **Input:** Checklist kelengkapan CoA (Certificate of Analysis), foto fisik label supplier, dan hasil uji organoleptik (warna/bau) bahan mentah.
* **Output:** Mengubah status bahan dari `QUARANTINE` menjadi `READY_TO_USE`.

**2. State: Mixing/Bulk Inspection (Produk Curah)**
* **Trigger:** Memindai QR Code pada drum mesin mixer.
* **Input:** Kolom angka besar (Numpad) untuk pH, Viskositas (cps), dan Berat Jenis.
* **Output:** Membuka kunci (interlock) mesin *Filling* agar bisa menyedot cairan tersebut.

**3. State: Filling & Packing Inspection (In-Process Control)**
* **Trigger:** Memindai Batch Code pada lini conveyor.
* **Input:** Uji Torsi (kekuatan tutup), Uji Kebocoran (Vakum), dan verifikasi visual kode kedaluwarsa pada botol.
* **Output:** Validasi akhir sebelum barang masuk ke Gudang Jadi (Finished Goods).

Saya harus meluruskan kembali logika arsitektural Anda secara tegas. **Tidak ada halaman lain.** Jika kita menambahkan halaman baru untuk setiap jenis inspeksi (misalnya *Page QC Bahan Baku*, *Page QC Curah*, dll.), kita mengulangi dosa besar ERP tradisional: *Interface Bloat* (antarmuka yang membengkak). 

Divisi QC secara fisik hanya membutuhkan **2 Halaman** yang sudah saya sebutkan sebelumnya. Rahasianya ada pada *State Management* di halaman kedua (**QC Inspector Workbench** di Tablet). Halaman tersebut bersifat *Polymorphic*—antarmukanya berubah bentuk (*morphing*) secara otomatis tergantung pada fase apa yang sedang dipindai oleh inspektur.

Berikut adalah rincian absolut untuk **Input dan Output di 4 Fase QC** yang bergantian muncul pada layar tablet tersebut:

---

### Fase 1: Inbound QC (Karantina Kedatangan Supplier)
**Konteks:** Truk supplier datang membawa bahan baku kimia atau botol kosong. Inspektur memindai QR Surat Jalan.
* **Input (Checklist & Pengukuran Fisik):**
    * Verifikasi CoA (*Certificate of Analysis*): Ada / Tidak Ada.
    * Cek Visual Kemasan Supplier: Utuh / Bocor / Penyok.
    * Input Organoleptik Dasar: Warna, Bau, dan Tekstur (dicocokkan dengan standar Master Material).
    * *Cek Khusus Kemasan:* Input dimensi kalibrasi (misal: diameter leher botol menggunakan jangka sorong) untuk memastikan botol tidak akan macet di mesin *Filling*.
* **Output Logis:**
    * `RELEASED`: Menggembok material dari status *Karantina* menjadi *Tersedia* di Gudang Utama.
    * `REJECTED`: Memblokir material dan memicu dokumen *Return to Vendor* (RTV) di Modul Pembelian.

### Fase 2: Mixing QC (Inspeksi Produk Curah / Bulk)
**Konteks:** Mesin *mixer* raksasa selesai mengaduk *lotion/cream*. Inspektur memindai QR Drum *Mixer*.
* **Input (Analytical Data):**
    * Input pH Aktual (Angka desimal, misal: 5.5).
    * Input Viskositas Aktual (Angka *Centipoise* / cps, misal: 15.000).
    * Input Berat Jenis / Densitas (Angka desimal).
    * Uji Homogenitas: *Pass / Fail* (Mengecek apakah air dan minyak terpisah/pecah).
* **Output Logis:**
    * `APPROVED_BULK`: Membuka *Interlock* mesin *Filling*. Cairan diizinkan untuk disedot.
    * `HOLD_ADJUSTMENT`: Mengirim tiket darurat ke R&D untuk meminta "Resep Koreksi" (penambahan bahan kimia penyeimbang).

### Fase 3: Filling QC (In-Process Control)
**Konteks:** Produk sedang diisikan ke dalam botol di *conveyor belt*. Inspektur mengambil sampel acak setiap 30 menit dan memindai QR Lini Produksi.
* **Input (Mechanical & Volume Data):**
    * Uji Torsi: Input batas putaran tutup botol (memastikan tidak kendor dan tidak terlalu rapat hingga *pump* rusak).
    * Uji Kebocoran: *Pass / Fail* (Botol dimasukkan ke ruang vakum).
    * Verifikasi Volume/Berat Aktual: Input berat botol terisi untuk memastikan 100ml benar-benar berisi cairan seberat 100 gram (menghindari kerugian HPP atau komplain klien).
* **Output Logis:**
    * `PROCEED`: Lini mesin berjalan normal.
    * `HALT_LINE`: Mesin *Filling* otomatis dihentikan karena jarum pengisi tidak presisi. Memicu panggilan ke teknisi *Maintenance*.

### Fase 4: Packing QC (Final Release Barang Jadi)
**Konteks:** Produk sudah masuk ke *Master Box* / kardus besar. Inspektur memindai QR Kode Kardus.
* **Input (Visual & Traceability):**
    * Verifikasi Keterbacaan Inkjet: *Pass / Fail* (Mengecek apakah cetakan nomor *Batch* dan *Expired Date* di pantat botol buram atau luntur).
    * Keutuhan Segel: *Pass / Fail* (Mengecek *shrink wrap* atau plastik segel).
    * Kelengkapan *Master Box*: Verifikasi jumlah unit di dalam kardus besar sudah pas (misal 24 pcs/karton).
* **Output Logis:**
    * `READY_TO_SELL`: Aset secara resmi diserahkan ke Gudang Barang Jadi (Finished Goods). Modul BusDev langsung menerima sinyal bahwa barang siap dikirim ke klien.


