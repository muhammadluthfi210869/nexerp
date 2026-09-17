Berikut adalah spesifikasi teknis dan logis untuk **Modul Creative & Packaging Design V4**. Modul ini beroperasi sebagai sistem *Digital Asset Management* (DAM) tertutup dengan antarmuka *Kanban Board*.

Spesifikasi ini dirancang agar AI Coder Anda memahami bahwa modul desain bukanlah tempat penyimpanan gambar biasa, melainkan jalur persetujuan legal dan ujung tombak spesifikasi cetak pabrik.

### 1. Proses Bisnis (The Kanban State Machine)
Setiap desain kemasan diperlakukan sebagai sebuah entitas tiket (Tugas/Kartu) yang bergerak maju mundur melintasi 6 fase (*State*) yang ketat.

*   **State 1: INBOX (Pemicu Awal)**
    *   *Mekanisme:* Saat BusDev mengeklik `[Request Design]` pada *Sales Order*, sistem menciptakan tiket otomatis di kolom ini.
    *   *Isi Tiket:* Tenggat waktu (SLA), Dimensi Kemasan, Referensi Warna (Hex/Pantone), Teks Klaim Produk, dan Nomor BPOM sementara.
*   **State 2: IN PROGRESS (Eksekusi Draft)**
    *   *Mekanisme:* Desainer menarik kartu ke kolom ini saat mulai bekerja.
    *   *Aksi:* Desainer mengunggah *file artwork* (misal: PDF/Ai) dan *mockup* visual (JPG/PNG). Sistem secara paksa melabeli file ini sebagai **V1** (Versi 1).
*   **State 3: WAITING APJ APPROVAL (Gerbang Legal)**
    *   *Mekanisme:* Desainer mengeklik `[Submit for Internal Review]`. Tiket berpindah dan terkunci.
    *   *Aksi:* Apoteker Penanggung Jawab (APJ) atau Tim Legal memverifikasi kesesuaian draf dengan regulasi kosmetik BPOM (Cek INCI komposisi, nomor notifikasi, dan larangan klaim *overpromising*).
*   **State 4: WAITING CLIENT APPROVAL (Validasi Eksternal)**
    *   *Mekanisme:* Jika APJ setuju, tiket otomatis mengirim sinyal ke BusDev. BusDev mempresentasikan desain V1 ke Klien.
*   **State 5: REVISION (Siklus Koreksi)**
    *   *Mekanisme:* Jika Klien atau APJ menolak desain, tiket dibanting kembali ke kolom ini secara paksa.
    *   *Aksi:* BusDev/APJ wajib mengetik instruksi perbaikan (Misal: "Font komposisi terlalu kecil"). Desainer memperbaiki dan mengunggah **V2**. V2 wajib mengulang rute ke State 3.
*   **State 6: LOCKED & READY TO PRINT (Distribusi Akhir)**
    *   *Mekanisme:* Setelah Klien memberikan ACC final, BusDev menekan `[Final Approve]`.
    *   *Aksi:* Tiket menjadi *Read-Only*. *Artwork* berubah status menjadi `MASTER_ASSET`.

### 2. Parameter Input & Output
Data yang dikelola di sini adalah kombinasi spesifikasi teknis dan aset digital berukuran besar.

**Input Sistem:**
*   `Design Brief Data`: Ditarik dari formulir SO milik BusDev.
*   `Approval & Feedback Log`: Teks komentar dari APJ, BusDev, dan Klien beserta *Timestamp*.
*   `Digital Assets`: *File Upload* (PDF, AI, CDR) dibatasi maksimal ukuran tertentu (misal: 50MB per file) yang ditangani oleh infrastruktur penyimpanan eksternal (seperti AWS S3 atau Google Cloud Storage) agar tidak membebani *database* utama.

**Output Sistem:**
*   `Final Print Specifications`: Data detail (*Finishing* Hotprint/Poly, Emboss, Doff/Glossy) yang menjadi lampiran mutlak bagi divisi pengadaan (SCM).
*   `Visual Blueprint`: Gambar referensi (*Mockup*) untuk panduan operator mesin.

### 3. Logika Backend & Constraint (The Defense System)
AI Coder harus menanamkan tembok pertahanan ini untuk mencegah kerugian cetak atau masalah hukum.

*   **Constraint 1: The Immutability Rule (Hukum Kekekalan File)**
    *   *Mekanisme:* Saat desain dikembalikan untuk revisi dan desainer mengunggah V2, *backend* dilarang keras menimpa (*overwrite*) atau menghapus file V1.
    *   *Tujuan:* Jika klien di kemudian hari menuntut, "Saya mau kembali ke desain yang pertama saja," sistem memiliki rekam jejak (*history*) fisik file V1 yang bisa ditarik kembali seketika.
*   **Constraint 2: Revision Cap Limit (Batas Finansial Revisi)**
    *   *Mekanisme:* *Backend* menghitung putaran *Revision Loop*. Jika tiket masuk ke State 5 melebihi batas kesepakatan (misal: lebih dari 3 kali revisi), sistem membekukan tiket.
    *   *Tujuan:* BusDev harus mengeklik `[Request Overlimit Revision]` yang memicu penambahan tagihan "Biaya Desain Ekstra" ke dalam faktur klien sebelum desainer bisa mengunggah V4. Ini menghentikan eksploitasi tenaga kerja desainer oleh klien.
*   **Constraint 3: Strict Routing (Anti-Jalan Pintas)**
    *   *Mekanisme:* Sistem melarang perpindahan tiket dari *IN PROGRESS* (State 2) langsung melompat ke *WAITING CLIENT* (State 4). Validasi mutlak harus melewati gerbang *WAITING APJ* (State 3).

### 4. Protokol Komunikasi Terpusat (Webhooks)
Modul Creative adalah *Broadcaster* yang menyuplai data visual ke tiga divisi hilir saat desain mencapai status final (LOCKED).

*   **$\leftrightarrow$ Protokol SCM / Purchasing**
    *   *Event:* Status tiket menjadi `LOCKED & READY TO PRINT`.
    *   *Action:* *Backend* mengirimkan Sinyal dan Tautan (*Link Download*) *High-Res File Artwork* beserta spesifikasi kertas/finishing ke *Dashboard Procurement*. Tim SCM langsung menerbitkan *Purchase Order* (PO) Kemasan ke vendor percetakan luar.
*   **$\leftrightarrow$ Protokol Produksi Pabrik**
    *   *Event:* Status tiket menjadi `LOCKED`.
    *   *Action:* *Mockup Visual* desain disuntikkan ke dalam *Production Batch Record*. Saat operator pabrik membuka halaman *Packaging (Tablet UI)*, mereka melihat gambar produk jadi yang sah sebagai panduan merakit kardus dan menempel stiker.
*   **$\leftrightarrow$ Protokol BusDev**
    *   *Event:* Status tiket bergeser di setiap fase.
    *   *Action:* *Push notification* ringan ke Dasbor BusDev (via SSE) agar Sales bisa mengetahui apakah desain masih dikerjakan, sedang dicek APJ, atau sudah siap dikirim ke klien tanpa perlu menelepon desainer.


Untuk memastikan AI Coder Anda dapat membangun struktur *database* dan rute API yang presisi, kita harus membedah **Sistem Input dan Output (I/O)** dari arsitektur *1-Page Single Page Application* (SPA) Creative Workspace ini. 

Dalam SPA, perpindahan data terjadi di belakang layar melalui format JSON (API Calls) tanpa harus memuat ulang elemen visual. Berikut adalah pemetaan absolut data I/O yang mengalir pada ketiga bagian utama di halaman tersebut:

---

### Bagian 1: Micro-Dashboard (Header KPI)
Bagian ini murni bersifat komputasional (*Read-Only* bagi pengguna). Backend bertugas menghitung agregasi data dari tabel Kanban.

*   **Input (Data Source dari Backend):**
    *   Kueri `COUNT` tiket dengan status `STATE_ID = 1` (New Briefs).
    *   Kueri `COUNT` tiket dengan status `STATE_ID = 5` (In Revision).
    *   Kueri `COUNT` tiket di mana tanggal hari ini melewati kolom `SLA_TARGET_DATE`.
    *   Kueri `COUNT` tiket dengan status `LOCKED` dalam bulan berjalan.
*   **Output (Render ke Layar):**
    *   Empat blok angka dinamis yang berkedip/berubah warna (hijau/merah) secara *real-time* jika ada pembaruan dari divisi BusDev.

---

### Bagian 2: The Pipeline (Kanban Board)
Ini adalah antarmuka interaktif. Data di sini adalah metadata ringan (hanya teks pendukung agar render papan Kanban cepat).

*   **Input (Tindakan Desainer & Trigger BusDev):**
    *   `Drag & Drop Event`: Saat desainer menggeser kartu, *frontend* menembakkan API `PATCH` ke backend yang berisi `ticket_id` dan `new_state_id`.
*   **Output (Metadata Kartu Kanban):**
    *   `Design Ticket ID` (misal: `DSG-2604-015`).
    *   `Client Name` & `Product Name` (ditarik via *Foreign Key* dari tabel Sales Order BusDev).
    *   `Due Date / SLA` (Render warna: Merah jika sisa waktu < 24 jam).
    *   `Revision Counter` (Menampilkan `Rev: 2/3`, mengacu pada batas toleransi revisi finansial).
    *   *Thumbnail Indicator*: Foto kecil *mockup* V-terakhir agar desainer mudah mengenali visual kartu tersebut.

---

### Bagian 3: The Design Hub (Right Drawer UI)
Panel laci samping ini adalah "mesin berat". Semua pertukaran spesifikasi cetak, *file* raksasa, dan validasi legal terjadi di sini. Panel ini dibagi menjadi 3 Tab fungsional:

#### Tab A: Brief & Tech Specs (Instruksi Kerja)
*   **Input (Ditarik otomatis oleh sistem dari Modul R&D & Sales):**
    *   *Reference ID:* Nomor Sales Order BusDev (SO-...).
    *   *Packaging Dimension:* Parameter ukuran fisik (Tinggi/Diameter botol) hasil ukur tim Inbound QC Gudang.
    *   *Mandatory Regulatory Text:* Tarikan teks absolut dari Modul R&D/Legal (Nomor Notifikasi BPOM, Barcode EAN, List INCI *Ingredients*).
    *   *Design Theme:* Teks referensi gaya dan *Hex Color Code* yang diketik BusDev saat awal negosiasi.
*   **Output:** Teks statis (*Read-Only*) yang tidak bisa diubah desainer, berfungsi murni sebagai "Buku Panduan" wajib saat mendesain.

#### Tab B: Versioning & Asset Upload (Area Kerja Desainer)
*   **Input (Tindakan Desainer via Form):**
    *   `High-Res Artwork File`: (*File Binary*) Format PDF, Ai, CDR (Dibatasi maks 50MB, masuk ke *Cloud Storage*).
    *   `Mockup Image`: (*File Binary*) Format JPG/PNG kompresi rendah untuk *preview* ringan di layar BusDev dan Produksi.
    *   `Print Specifications`: *Dropdown/Checkbox* untuk jenis kertas cetak (ArtCarton, Ivory), Laminasi (Doff, Glossy), atau Emboss/Poly Emas.
    *   `Action Button Payload`: Klik `[Submit to APJ]` yang mengubah `state_id` Kanban.
*   **Output (Generasi Sistem):**
    *   *Immutable Version Tag*: Sistem melabeli file unggahan menjadi V1, V2, V3.
    *   *Secure Download Link*: *Backend* menghasilkan URL enkripsi untuk *file master* agar divisi luar (SCM/Vendor) bisa mengunduhnya tanpa perlu masuk ke ERP.

#### Tab C: Feedback & Approval Log (Jejak Rekam)
*   **Input (Tindakan APJ / BusDev):**
    *   `Review Note`: Input teks *multiline* berisi instruksi koreksi (misal: "Klaim 'Mencerahkan dalam 3 hari' ditolak BPOM, ganti kalimatnya").
    *   `Approval Signature`: Hash kriptografi (PIN) dari Apoteker Penanggung Jawab (APJ) sebagai bukti sah verifikasi desain.
*   **Output (Audit Trail):**
    *   Daftar riwayat percakapan/revisi berstempel waktu (*Timestamped Log*) yang mengikat ID Pengguna.
    *   Status *Lock/Unlock*: Sistem mengunci tombol *Upload* di Tab B jika status sedang berada di tangan APJ/Klien untuk mencegah desainer mengunggah *file* tumpang tindih.
