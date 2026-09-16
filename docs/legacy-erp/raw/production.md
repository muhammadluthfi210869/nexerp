# Dashboard Produksi

**Card A. OUTPUT & ACHIEVEMENT** : Achievement Rate, Planned, Actual, Completed Orders

**Card B. TIMELINESS AUDIT** : On-Time Rate, Delayed, Avg Cycle

**Card C. RESOURCE EFFICIENCY** : Machine Util., Labor Prod., Downtime (MTD)

**Card D. QUALITY CONTROL** : Good Units, Defect Rate, Rework Count

**Card E. CRITICAL ALERTS** : Breakdowns, Shortages, Urgent Alert

**Tabel II. PENYIAPAN BAHAN (FROM WAREHOUSE)** : WORK ORDER / PRODUK, STATUS PICKING, KELENGKAPAN, ESTIMASI KIRIM

**Card III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK)** : Antrean WO, Mixing, Filling, Packing, Finished Goods

**Tabel IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING)** : DEADLINE (H-MINUS), PRODUCT ID / NAME, CHAIN OF CUSTODY (UNIT FLOW), ANOMALY STATUS, STATUS & REASON

**Tabel V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI)** : NO. WORK ORDER, NAMA KLIEN & PRODUK, TAHAPAN SAAT INI, ESTIMASI SELESAI, QTY DEFECT

# COMMUNICATION PROTOCOL 

Anda sangat tajam, dan saya mengakui kelalaian dalam analisis sebelumnya. Anda benar, jika kita hanya membatasi komunikasi ke Gudang, Legal, QC, dan R&D, kita masih mendesain sistem yang beroperasi dalam "silo" (terisolasi) dan belum mencerminkan *Enterprise Resource Planning* (ERP) yang sejati.

Ada **3 Protokol Komunikasi Lintas-Divisi** krusial yang terlewat dan wajib ditanamkan ke dalam halaman Produksi V4:

### 1. Protokol Visibilitas Klien ($\leftrightarrow$ Divisi BusDev / Sales)
Di pabrik konvensional, BusDev sering kali buta terhadap status pesanan klien dan harus turun ke lapangan atau mengirim WhatsApp ke Kepala Produksi hanya untuk bertanya, *"Barang PT X sudah sampai mana?"*

* **Pemicu (Trigger):** Setiap kali operator mengeklik tombol `[Selesai Mixing]`, `[Selesai Filling]`, atau `[Selesai Packing]` di Tablet Digital Batch Record.
* **Aksi Sistem:** Mendorong notifikasi *real-time* ke Dasbor BusDev dan secara otomatis memperbarui *Progress Bar* pada Sales Order (SO) terkait.
* **Dampak:** BusDev memiliki jawaban instan dan akurat saat ditagih oleh klien, tanpa perlu mengganggu konsentrasi tim Produksi.

### 2. Protokol Penyerapan Biaya / Costing ($\leftrightarrow$ Divisi Finance / Akuntansi)
Pada analisis sebelumnya, saya hanya menyebutkan rekonsiliasi material (susut/loss bahan baku). Padahal, **HPP (Harga Pokok Penjualan)** pabrik terdiri dari: *Material + Tenaga Kerja Langsung (Labor) + Overhead Mesin*.

* **Pemicu (Trigger):** Operator menginput *Waktu Mulai* dan *Waktu Selesai* pada stasiun kerja (misal: Mesin Mixer menyala dari jam 08:00 - 12:00 = 4 jam).
* **Aksi Sistem:** Data durasi 4 jam ini langsung ditarik ke modul Akuntansi untuk mengalkulasi **Biaya Overhead Pabrik (Listrik, Air, Depresiasi Mesin)** dan **Upah Operator** yang harus diserap oleh *Batch* tersebut.
* **Dampak:** Finance tidak lagi menebak-nebak HPP. Mereka mendapatkan angka *Actual COGS* yang memperhitungkan waktu riil dan efisiensi mesin, bukan sekadar harga bahan kimia.

### 3. Protokol Utilitas & Kerusakan Mesin ($\leftrightarrow$ Divisi Maintenance/Teknisi)
Mesin produksi kosmetik (*homogenizer, filling tube*) rentan mengalami masalah. Jika mesin rusak di tengah jalan, sistem tidak boleh hanya diam.

* **Pemicu (Trigger):** Operator menekan tombol darurat `[LAPORKAN KENDALA MESIN]` pada layar tablet saat jadwal produksi sedang berjalan.
* **Aksi Sistem:**
    1. Sistem menjeda (*pause*) perhitungan waktu efisiensi produksi.
    2. Menciptakan tiket otomatis (*Work Order*) ke Dasbor Teknisi/Maintenance dengan keterangan mesin mana yang macet.
    3. Memberikan peringatan ke *Production Control Board* (Jadwal) bahwa antrean di belakang mesin tersebut berpotensi mengalami keterlambatan (*delay*).
* **Dampak:** Penanganan kerusakan lebih cepat terukur, dan rekam jejak (*history*) kerusakan mesin tercatat untuk evaluasi pembaruan aset perusahaan di masa depan.

---

Kritik Anda sangat tepat sasaran. Tanpa ketiga protokol tambahan di atas, kita hanya membuat sistem pencatatan biasa, bukan sistem pengendali. 

Dengan ditariknya data durasi mesin untuk *Finance*, visibilitas untuk *BusDev*, dan kendali darurat untuk *Maintenance*, apakah *blind spot* (titik buta) di lantai produksi pabrik Anda sekarang sudah tertutupi sepenuhnya?

$\leftrightarrow$ Modul R&D:Mekanisme: Sistem menarik BOM dan parameter spesifikasi (Target pH, Viskositas) secara statis (Read-only).Trade-off: Operator produksi tidak memiliki akses untuk memodifikasi rasio formula, meminimalkan deviasi kualitas.$\leftrightarrow$ Modul QC:Mekanisme: Notifikasi sistematis terkirim ke tablet QC saat operator menyelesaikan tahap Mixing dan Filling.

# MIXING PAGE
Berikut adalah spesifikasi teknis dan logis untuk **Fase Eksekusi Mixing** (direpresentasikan sebagai satu *View* atau Halaman di dalam *Digital Batch Record*). Spesifikasi ini dirancang dengan pendekatan sistemik untuk memandu AI Coder Anda dalam membangun *backend* yang absolut dan *frontend* yang presisi.

### 1. Arsitektur Antarmuka (Frontend - Tablet UI)
Antarmuka harus dioptimalkan untuk pengoperasian layar sentuh di area pabrik dengan mengenakan sarung tangan industri. Estetika menggunakan standar *Silent Luxury* (Latar belakang `#000000`, teks informasi abu-abu terang, dan aksen *Aureon Gold* `#d4af37` khusus untuk tombol eksekusi utama).

* **Layout Split-Screen:**
    * **Panel Kiri (Instruksi R&D):** Bersifat *Read-only*. Menampilkan daftar Fase (A, B, C), Nama Bahan (INCI/Lokal), Target Gramasi, dan parameter mesin (Suhu, RPM, Waktu) yang dikunci oleh R&D.
    * **Panel Kanan (Panel Eksekusi):** Area interaktif untuk *Barcode Scanning*, *Stopwatch* mesin, dan input aktual operator.

### 2. Parameter Input & Output
Data yang ditangkap pada halaman ini mendefinisikan akurasi HPP dan kualitas produk secara keseluruhan.

**Input Operator (Data Collection):**
* `Scanned Material Batch`: Memindai QR Code pada drum bahan kimia sebelum menuangkannya ke dalam *mixer*.
* `Actual Weight Input`: Berat aktual bahan yang dituang (dalam gram/kilogram).
* `Machine Parameters`: Input manual untuk Suhu Aktual (°C) dan RPM Aktual.
* `Time Tracker`: Tombol `[Start Mesin]` dan `[Stop Mesin]` untuk merekam durasi kerja *real-time*.
* `Actual Bulk Yield`: Hasil akhir penimbangan total cairan/krim setelah proses *mixing* selesai (sebelum dipindah ke drum karantina).

**Output Komputasi:**
* `Mixing Variance (Loss)`: Perhitungan otomatis antara total bahan yang masuk ke *mixer* dikurangi `Actual Bulk Yield`. (Misal: Masuk 100 Kg, Hasil Curah 98 Kg. Loss = 2 Kg).
* `WIP Bulk Product`: Penciptaan identitas barang baru di sistem berupa "Produk Curah (WIP)" lengkap dengan Nomor Batch Produksinya.

### 3. Logika Backend & Constraints (The Mixing Engine)
AI Coder harus menanamkan mekanisme pertahanan berlapis di *backend* agar operator tidak dapat melakukan kesalahan fatal.

* **Constraint 1: FEFO & Material Match-Gate**
    * *Mekanisme:* Saat operator memindai QR Code drum bahan, *backend* mencocokkannya dengan dua parameter: (1) Apakah bahan ini sesuai dengan *BOM* R&D? (2) Apakah *Batch* drum ini adalah yang dialokasikan oleh SCM di halaman *Internal Transfer*?
    * *Tindakan:* Jika operator memindai bahan yang salah atau *Batch* yang lebih baru (pelanggaran FEFO), sistem menolak input dan membekukan form hingga drum yang benar dipindai.
* **Constraint 2: Weight Tolerance Hard-Stop**
    * *Mekanisme:* Menghitung rasio deviasi antara `Actual Weight Input` dengan `Target Weight` R&D.
    * *Tindakan:* Jika deviasi melampaui batas toleransi (misal: > 0.5%), sistem memblokir tombol `[Lanjut Fase Berikutnya]` dan memerlukan input PIN Supervisor Produksi sebagai persetujuan deviasi (*Override*).
* **Constraint 3: Atomic Phase Execution**
    * *Mekanisme:* Operator tidak dapat membuka kunci form eksekusi Fase B sebelum seluruh bahan di Fase A selesai dipindai dan dimasukkan.

### 4. Protokol Komunikasi (Event-Driven Triggers)
Halaman *Mixing* ini bertindak sebagai *Transmitter* utama yang mengirimkan sinyal ke 5 divisi berbeda seketika tombol `[Selesai Mixing]` ditekan.

* **$\leftrightarrow$ Protokol Gudang (SCM)**
    * *Event:* Mengurangi persediaan *Raw Material* (Bahan Baku) secara fisik dan finansial.
    * *Event:* Menambahkan persediaan barang setengah jadi (*Work In Progress - Bulk*) sebesar `Actual Bulk Yield`.
* **$\leftrightarrow$ Protokol Kualitas (QC)**
    * *Event:* Status *Batch* langsung diubah menjadi `WAITING_QC_BULK`. Sistem mengunci produk curah ini agar tidak bisa ditarik ke mesin *Filling*.
    * *Push Notification:* Terkirim ke *Tablet QC* untuk segera mengambil sampel curah dari mesin *mixer* guna pengujian pH dan viskositas.
* **$\leftrightarrow$ Protokol Keuangan (Finance / Costing)**
    * *Event:* *Backend* mengkalkulasi durasi dari `Time Tracker` (misal: 180 menit). Durasi ini dikalikan dengan parameter `Tarif Listrik/Jam Mesin Mixer` dan `Upah Operator/Jam`.
    * *Output:* Sistem menghasilkan nilai *Overhead Cost* yang disuntikkan langsung ke dalam perhitungan HPP Aktual *Batch* tersebut.
* **$\leftrightarrow$ Protokol Visibilitas Klien (BusDev)**
    * *Event:* Mengubah status *Sales Order* (SO) dari `ON_QUEUE` menjadi `MIXING_COMPLETED`. Dasbor BusDev diperbarui seketika.
* **$\leftrightarrow$ Protokol Perawatan Fasilitas (Maintenance)**
    * *Pemicu Manual:* Jika operator menekan tombol darurat `[🚨 Lapor Kendala Mesin]`.
    * *Event:* *Time tracker* mesin otomatis berhenti (*Pause*). Sistem melempar tiket gangguan mesin ke Dasbor Teknisi beserta *Timestamp* kerusakan.

Dengan instruksi di atas, AI Coder akan memahami bahwa halaman *Mixing* bukanlah sekadar formulir pencatatan biasa, melainkan simpul krusial tempat perhitungan HPP, kualitas formulasi, dan kepatuhan inventaris divalidasi secara matematis.


# FILING PAGE

Fase **Filling (Pengisian)** adalah titik paling rawan dalam manufaktur kosmetik. Secara fisika dan akuntansi, ini adalah titik di mana satuan ukur berubah: dari **Massa/Berat (Kilogram)** menjadi **Kuantitas (Pieces/Botol)**. Di titik inilah kebocoran nilai HPP paling sering terjadi jika tidak diawasi ketat oleh sistem.

Berikut adalah spesifikasi teknis dengan pendekatan Mekanisme, Batasan (Constraints), dan *Trade-offs* untuk AI Coder Anda dalam merancang halaman **Fase Eksekusi Filling (Tablet UI)**.

### 1. Arsitektur Antarmuka (Frontend - Tablet UI)
Masih menggunakan kerangka *Digital Batch Record* di tablet, antarmuka ini dirancang untuk operator mesin *filling*.

* **Panel Kiri (Spesifikasi Teknis - Read Only):**
    * Menampilkan Target Volume per kemasan (misal: 100 ml / 100 gram).
    * Menampilkan Visual/Foto Kemasan Primer (Botol, *Pump*, Tutup) agar operator tidak salah memasang botol ke mesin conveyor.
* **Panel Kanan (Panel Interaktif):**
    * *Dual Scanner Input:* Membutuhkan pemindaian dua entitas fisik (Drum Curah & Dus Botol Kosong).
    * *Numpad Digital:* Tombol angka besar di layar sentuh untuk memasukkan jumlah *Reject*.

### 2. Parameter Input & Output
Data di halaman ini memetakan persentase efisiensi mesin (OEE - *Overall Equipment Effectiveness*).

**Input Operator (Data Collection):**
* `Scanned Bulk WIP`: Memindai QR Code drum hasil *Mixing* kemarin.
* `Scanned Primary Packaging`: Memindai QR Code kardus botol kosong/pot cream dari Gudang.
* `Good Output`: Jumlah unit (Pcs) botol yang terisi sempurna dan lolos inspeksi visual operator.
* `Reject Bulk (Loss Cairan)`: Estimasi sisa cairan yang menempel di pipa mesin *filling* atau tumpah ke lantai (dalam Kg/Gram).
* `Reject Packaging (Loss Kemasan)`: Jumlah botol penyok, tutup pecah, atau *pump* macet (dalam Pcs).
* `Time Tracker`: Tombol `[Mulai Filling]` dan `[Hentikan Filling]`.

**Output Komputasi:**
* `WIP Filled Product`: Status barang naik tingkat menjadi "Botol Terisi" yang siap masuk ke tahap *Secondary Packaging* (Pemasangan stiker label dan kardus luar).
* `Filling Efficiency Ratio`: Kalkulasi persentase antara cairan yang dikonsumsi dengan jumlah botol yang berhasil diproduksi.

### 3. Logika Backend & Constraints (The Filling Engine)
*Backend* harus bertindak sebagai kalkulator fisik yang tidak bisa ditipu.

* **Constraint 1: The QC Interlock (Gerbang Mutu)**
    * *Mekanisme:* Saat operator memindai drum curah (`Scanned Bulk WIP`), *backend* mengecek statusnya.
    * *Tindakan:* Jika status *Bulk* masih `WAITING_QC_BULK` (belum di-ACC oleh QC lab), mesin *filling* secara sistemik menolak input dan memunculkan layar merah: `[AKSES DITOLAK: CURAH BELUM LULUS UJI LAB]`. Ini adalah *Trade-off* yang memperlambat kerja operator, tetapi menjamin 100% produk yang masuk botol adalah produk yang aman.
* **Constraint 2: Mathematical Limit (Hukum Fisika)**
    * *Mekanisme:* Sistem menghitung batas logis. Jika drum berisi 50 Kg cairan, dan volume botol adalah 100 Gram, maka batas maksimal teoritis adalah 500 Pcs.
    * *Tindakan:* Jika operator menginput `Good Output` = 510 Pcs, sistem akan memblokir dan menolak input karena hal tersebut mustahil secara fisika (mengindikasikan volume isi botol dikurangi/tidak standar).
* **Constraint 3: Packaging FEFO Guard**
    * *Mekanisme:* Memastikan botol/kemasan primer yang dipindai adalah *Batch* yang telah dialokasikan oleh tim SCM Gudang, mencegah operator mengambil sembarang kardus kemasan di lorong pabrik.

### 4. Protokol Komunikasi (Event-Driven Triggers)
Begitu tombol `[Selesai Filling]` ditekan, *backend* mendistribusikan data ke 5 simpul berikut:

* **$\leftrightarrow$ Protokol Gudang (SCM)**
    * *Event:* Mengurangi persediaan *Primary Packaging* (Botol/Tutup) di Master Stok sejumlah `Good Output + Reject Packaging`.
    * *Event:* Mengonversi WIP Curah (Kg) menjadi WIP Botol Terisi (Pcs).
* **$\leftrightarrow$ Protokol Keuangan (Finance & Costing)**
    * *Event:* Menarik nilai uang dari kemasan yang pecah (`Reject Packaging`) dan mengonversinya menjadi *Waste Cost*. Biaya ini langsung ditambahkan ke HPP *Batch* tersebut, sehingga Finance tahu persis kerugian dari botol yang cacat produksi.
    * *Event:* Menambahkan *Overhead Cost* berdasarkan `Time Tracker` mesin *filling*.
* **$\leftrightarrow$ Protokol Kualitas (QC)**
    * *Event:* Memicu tugas inspeksi baru di *Tablet QC*. QC harus turun ke ruang *filling* untuk mengambil beberapa sampel botol secara acak (Uji Kebocoran Botol & Uji Torsi Tutup).
* **$\leftrightarrow$ Protokol Visibilitas Klien (BusDev)**
    * *Event:* Memperbarui *Progress Bar* pesanan klien di dasbor BusDev menjadi `FILLING_COMPLETED`.
* **$\leftrightarrow$ Protokol Perawatan Mesin (Maintenance)**
    * *Event:* Jika operator memasukkan angka `Reject Packaging` yang tidak wajar (misal: > 5% dari total produksi), sistem otomatis mengirim peringatan kuning ke teknisi bahwa mesin *filling* mungkin perlu kalibrasi ulang (jarum pengisi tidak presisi).

Dengan spesifikasi ini, AI Coder memiliki cetak biru untuk mengubah proses *Filling* dari sekadar aktivitas memindahkan cairan menjadi sebuah sistem audit mekanis.

Apakah arsitektur transisi Fisika ke Kuantitas ini sudah cukup solid, atau kita langsung aplikasikan pola logis yang sama ke halaman penutup produksi: **Packaging (Pengemasan Sekunder & Pelabelan)**?

# PACKING PAGE

Fase **Packaging (Pengemasan Sekunder)** adalah gerbang akhir lantai produksi. Secara sistemik, tahap ini adalah proses perakitan final di mana produk setengah jadi (WIP Botol Terisi) digabungkan dengan material pendukung (Stiker, Boks, *Master Carton*, Brosur) untuk dikonversi menjadi entitas baru: **Barang Jadi (Finished Goods - FG)**.

Berikut adalah spesifikasi teknis operasional dengan struktur Mekanisme, Batasan (Constraints), dan *Trade-offs* untuk diimplementasikan oleh AI Coder pada halaman **Fase Eksekusi Packaging (Tablet UI)**.

### 1. Arsitektur Antarmuka (Frontend - Tablet UI)
Desain antarmuka tetap konsisten dengan fase sebelumnya, dioptimalkan untuk layar sentuh dan pemindaian berkecepatan tinggi di akhir *conveyor belt*.

* **Panel Kiri (Spesifikasi Visual & Identitas - Read Only):**
    * Menampilkan desain final *Artwork* (Label/Boks) yang telah disetujui oleh APJ (Legal).
    * Menampilkan instruksi perakitan (misal: "Masukkan 1 brosur ke dalam setiap boks, segel dengan *shrink wrap*").
    * Menampilkan **Nomor Batch dan Expired Date (Generate by System)** dalam ukuran *font* sangat besar. Ini adalah teks yang wajib dicetak operator menggunakan mesin *inkjet coder*.
* **Panel Kanan (Panel Eksekusi Interaktif):**
    * *Multi-Scanner Input*: Memindai WIP Botol Terisi, Boks Primer, dan Karton *Master*.
    * *Numpad* Digital untuk mencatat barang cacat (*Reject*).
    * Tombol kontrol waktu operasional (*Time Tracker*).

### 2. Parameter Input & Output
Data yang masuk di sini mengunci total Harga Pokok Penjualan (HPP) aktual dari proyek tersebut.

**Input Operator (Data Collection):**
* `Scanned WIP Filled`: Memindai QR Code kontainer yang berisi botol dari fase *Filling*.
* `Scanned Secondary PM`: Memindai material pengemas sekunder (Label, Boks, Segel).
* `Good FG Output`: Total kardus/botol jadi yang siap jual (Pcs).
* `Reject WIP (Cacat Perakitan)`: Jumlah botol yang tergores, stiker miring, atau segel robek saat proses perakitan (Pcs).
* `Reject Packaging (Loss Material)`: Boks yang sobek sebelum dipakai atau label yang salah cetak (Pcs).

**Output Komputasi:**
* `Finished Goods (FG)`: Produk final yang memiliki *SKU (Stock Keeping Unit)* yang siap diperjualbelikan.
* `Final Packaging Efficiency`: Rasio pemakaian material sekunder terhadap produk jadi.

### 3. Logika Backend & Constraints (The Packaging Engine)
*Backend* mengamankan integritas produk sebelum diserahkan kembali ke Gudang.

* **Constraint 1: The Artwork Interlock**
    * *Mekanisme:* Sistem memverifikasi status dokumen *Artwork* di modul Legal/APJ.
    * *Tindakan:* Jika *Artwork* berstatus `REVISION` atau `EVALUATION`, halaman *Packaging* terkunci total. Mesin menolak input `Scanned Secondary PM` hingga Legal memberikan status `APPROVED`. *Trade-off*: Keterlambatan produksi diizinkan demi mencegah kerugian masif akibat penarikan produk (recall) karena label salah.
* **Constraint 2: Mathematical Cap (Batas Logis)**
    * *Mekanisme:* `Good FG Output` + `Reject WIP` tidak boleh melebihi total `WIP Filled` yang diproduksi di tahap sebelumnya.
    * *Tindakan:* Pemblokiran simpan data otomatis jika angka yang dimasukkan tidak masuk akal secara matematis.
* **Constraint 3: Traceability Encoding (Sistem Pelacakan)**
    * *Mekanisme:* *Backend* secara permanen mengikat/me-relasikan ID Bahan Baku, ID Botol, ID Label, ID Operator, dan Hasil QC ke dalam satu **QR Code Finished Goods**.

### 4. Protokol Komunikasi (Event-Driven Triggers)
Aksi menekan tombol `[Selesai Packaging]` adalah titik penutupan (*Closure*) dari satu siklus manufaktur.

* **$\leftrightarrow$ Protokol Gudang (SCM) - Handover Final**
    * *Event:* Mengurangi stok material kemasan sekunder secara presisi.
    * *Event:* Mengirimkan entitas `Finished Goods` sejumlah `Good FG Output` ke halaman *Production Reconciliation* untuk divalidasi sebelum secara resmi masuk ke `Stok Tersedia` di Gudang Utama.
* **$\leftrightarrow$ Protokol Keuangan (Finance & Costing)**
    * *Event:* *Backend* menjumlahkan: [HPP Material Fase Mixing] + [Waste Kemasan Fase Filling & Packing] + [Total Overhead Durasi Mesin 3 Fase] + [Upah Tenaga Kerja Langsung].
    * *Output:* Sistem menetapkan *Actual COGS* (HPP Aktual per Botol) dan mengirimkannya ke modul Akuntansi, mengunci nilai profitabilitas pesanan tersebut.
* **$\leftrightarrow$ Protokol Kualitas (QC) - Final Release**
    * *Event:* Mengirim notifikasi ke Kepala QC untuk melakukan *Final Inspection* (Inspeksi Visual Akhir) sebelum produk dimasukkan ke truk pengiriman.
* **$\leftrightarrow$ Protokol Visibilitas Klien (BusDev)**
    * *Event:* Memperbarui status Dasbor BusDev dan Sales Order menjadi `READY_TO_SHIP`.
    * *Event Ekstra:* Memicu sistem untuk mengirim email/notifikasi otomatis (jika diaktifkan) kepada Klien bahwa barang pesanan mereka telah selesai diproduksi dan siap dikirim atau diambil.

Dengan terdefinisikannya fase *Packaging* ini, kerangka sistem untuk lantai produksi (Mesin Pabrik) telah lengkap. Transisi fisik dan perhitungan biaya dari bahan baku menjadi barang siap jual kini sepenuhnya diatur oleh mesin *backend* yang presisi. Tahap selanjutnya adalah menganalisis bagaimana data finansial (HPP, Penjualan, Jurnal Umum) divalidasi di stasiun **Akuntansi & Keuangan**.