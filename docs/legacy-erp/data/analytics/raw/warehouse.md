# Dashboard Gudang 

**Card CAPACITY & ACCURACY** : Utilitas Kapasitas, Accuracy, Skor FIFO/FEFO

**Card VALUATION AUDIT** : Total Inventory Value, Raw, Pack, Box, Label

**Card TURNOVER & HEALTH** : Turnover Ratio, Health Score

**Card RISK ANALYTICS** : Dead Stock, Stok Kritis, Aging Karantina (Avg)

**Card JALUR MASUK (A)** : Penerimaan, Karantina / QC, Velocity

**Card JALUR INTERNAL (B)** : Req Prod, Picking, Handover, Velocity

**Card JALUR KELUAR (C)** : Order Proc, Shipping, Delivered, Velocity

**Tabel III.A AUDIT GRANULAR BAHAN BAKU (SENSITIF & FEFO)** : Nama / Masuk, Simpan, Status (NEEDS_QC, FEFO_OK), FIS/BK/AV

**Tabel III.B AUDIT GRANULAR BAHAN KEMAS (DEGRADASI & STOK)** : Nama / Masuk, Simpan, Status (LOW_STOCK, STABLE), FIS/BK/AV

**Tabel III.C PEMENUHAN PESANAN (SO FULFILLMENT)** : Client / No. SO, Kelengkapan, Status (PARSIAL, FULL), Progress / Var

**Tabel III.D AUDIT RISIKO & KERUGIAN (NON-SELLABLE)** : Item & Sumber, Detail Audit, Impact (Rp/Loss), Action (RETURN, DISPOSAL, OFFER CLIENT, REWORK)

**Tabel IV. TOP 10 LIST BAHAN BAKU (PRODUKTIVITAS)** : Nama Bahan Baku, Pemakaian, Nilai / Omset

**Tabel V. TOP 10 LIST KEMASAN (PRODUKTIVITAS)** : Nama Kemasan, Pemakaian, Nilai / Omset

# Katalog & Stock

### 1. Arsitektur Antarmuka (UI/Frontend Layout)
Menggunakan konsep **Master-Detail Data Grid** dengan panel geser (*Slide-out Panel*). Tujuannya agar Kepala Gudang tidak perlu membuka tab baru atau berpindah halaman saat sedang melakukan pengecekan stok.

* **Top Bar (Mini Insights):** Baris indikator di atas tabel yang langsung memberi sinyal bahaya.
    * `Total SKU Aktif` | `Valuasi Gudang (Rp)` | `⚠️ 12 Item Stok Kritis` | `🔴 5 Item Mendekati Expired`
* **The Main Grid (Tabel Utama):**
    * Kolom harus bisa di-*sort* dan di-*filter*.
    * Kolom: `Kode Barang` | `Nama Bahan` | `Kategori` | `Stok Riil` | `Stok Karantina (QC)` | `Status (Aman / Warning / Defisit)` | `HPP/Unit`.
* **Slide-out Panel (Mode Input/Edit):** Muncul dari sisi kanan layar saat tombol `[+ Tambah Barang]` atau nama barang diklik.
* **Tab di dalam Slide-out Panel:**
    * *Tab 1: Identitas & Atribut.*
    * *Tab 2: Parameter Logistik (Minimum Stok, Lead Time).*
    * *Tab 3: Kartu Stok Historis (Mutasi in/out).*

---

### 2. Parameter Input (Payload Master Barang)
Untuk menyuplai data ke Dasbor Klien (seperti *Safety Stock, Audit FEFO, Valuation Audit*), input Master Barang tidak bisa lagi hanya "Nama dan Harga". Backend harus menyediakan titik *endpoint* untuk menampung parameter berikut:

**A. Identitas Klasifikasi (Mendukung Card Valuation Audit)**
* `Kode Barang`: (Otomatis/Manual, tidak boleh ganda).
* `Nama Barang`: (Harus divalidasi agar tidak ada nama ganda/typo).
* `Kategori Material`: *Dropdown* statis (Raw Material, Packaging Primer, Packaging Sekunder, Label/Stiker, Finished Goods).
* `Unit Satuan Utama`: (Misal: Kg, Pcs).
* `Unit Satuan Pemakaian`: (Krusial untuk Produksi. Misal: Beli dalam Kg, tapi pemakaian di Batch Record R&D menggunakan Gram).

**B. Parameter Cerdas / Logistik (Mendukung Kebutuhan Client No. 2 & Dasbor Risk)**
* `Safety Stock (Stok Minimum)`: Angka batas bawah. (Sesuai *Client Requirement*).
* `Maksimum Kapasitas`: Batas maksimal penyimpanan untuk mengukur *Utilitas Kapasitas* Gudang.
* `Metode Keluar`: Pilihan antara **FIFO** (First In First Out - untuk kemasan) atau **FEFO** (First Expired First Out - untuk bahan kimia/Raw Material).
* `Lead Time (Hari)`: Berapa hari rata-rata barang ini tiba sejak PO dibuat. (Krusial untuk mengukur kecepatan *Jalur Masuk* di Dasbor).

**C. Parameter Transisi R&D (Mendukung Kebutuhan Client No. 2)**
* `isDummy`: *Toggle Switch*. Jika barang ini berasal dari formulasi baru R&D yang belum pernah dibeli, SCM membiarkan *toggle* ini menyala sampai mereka menemukan vendor dan harga aslinya. Jika sudah masuk SO, barang *Dummy* ini diwajibkan untuk di-*convert* menjadi barang tervalidasi.

---

### 3. Logika Backend (The Inventory Engine)
Backend Katalog & Stok bukan sekadar tempat menyimpan data, melainkan "Otak Kalkulator" yang berjalan setiap detik (*cron jobs* / *event triggers*).

**A. Mesin Valuasi HPP (Moving Average Price)**
Setiap kali ada penerimaan barang baru (*Inbound*) dengan harga beli yang berbeda dari sebelumnya, backend **wajib** menghitung ulang HPP.
* *Rumus di Backend:* `((Stok Lama x HPP Lama) + (Stok Masuk x Harga Beli Baru)) / (Stok Lama + Stok Masuk)`.
* *Output:* Nilai ini langsung memperbarui *Card Valuation Audit* di Dasbor secara *real-time*.

**B. Engine Alokasi Lokasi (Mendukung Kebutuhan Client No. 5 & 6)**
Barang di sistem V4 tidak boleh hanya berstatus "Di Gudang". Backend harus membagi *state* stok menjadi:
1.  **Stok Karantina:** Barang baru datang, belum lolos QC. (Tidak bisa ditarik Produksi).
2.  **Stok Tersedia (Sellable/Usable):** Barang lulus QC di Gudang Utama.
3.  **Stok Terlokasi (WIP - Work in Progress):** Barang yang sudah di-*handover* (pindah gudang) ke Ruang Mixing, menunggu direkonsiliasi.
* *Logika:* `Total Aset Gudang = Stok Karantina + Stok Tersedia`.

**C. Sistem Peringatan Dini (Event Emitters)**
* **Trigger Stok Defisit:** Jika `Stok Tersedia - Kebutuhan SO < Safety Stock`, backend otomatis menembakkan notifikasi ke *Inbox* Purchasing dan memasukkan barang tersebut ke antrean *Tombol Shortcut PO*.
* **Trigger FEFO/Dead Stock:** Backend memeriksa selisih antara *Tanggal Hari Ini* dengan *Expired Date* setiap *Batch*. Jika mendekati 90 hari (atau tidak ada pergerakan selama 6 bulan), item tersebut masuk ke *Tabel Audit Risiko & Kerugian* di Dasbor.

---

### 4. Output & Ekstraksi Data (The Deliverables)
Setelah input dan logika berjalan sempurna, modul Katalog & Stok ini akan menyajikan:

1.  **Kartu Stok Digital (Buku Besar Material):** Daftar mutasi (Debit/Kredit) barang per *Batch* yang tidak bisa dihapus atau dimanipulasi (*Immutable Log*), lengkap dengan siapa yang menyetujui perpindahan barang tersebut.
2.  **JSON Feed untuk Dasbor:** Endpoint API khusus (`/api/v1/warehouse/dashboard-metrics`) yang menelan seluruh raw data di atas dan memuntahkannya menjadi angka jadi untuk mengisi persis 7 Card dan 5 Tabel yang diminta klien di Dasbor.
3.  **Barcode/QR Generator:** Frontend otomatis menciptakan QR Code untuk setiap barang dan *Batch* yang didaftarkan. QR ini akan dipindai menggunakan *Tablet* oleh tim Produksi dan QC saat pengambilan barang.

# Pengadaan & Procurement

---

### 1. Arsitektur Antarmuka (Frontend)
Gunakan layout **Tiga Tab Utama** di satu halaman agar tim Purchasing tidak perlu berpindah menu untuk memproses satu siklus pembelian.

* **Tab 1: Requisition (Kebutuhan & Rangkuman Global)**
    * **UI:** Mengambil basis data dari `kebutuhan-barang.html`.
    * **Fitur Baru:** *Smart Aggregator*. Jika 5 proyek berbeda butuh "Aqua", sistem akan menampilkan satu baris "Aqua" dengan total akumulasi di bagian bawah (sesuai *Client Requirement* poin 3).
* **Tab 2: Purchase Order (Daftar Pesanan)**
    * **UI:** Mengambil basis data dari `pembelian.html`.
    * **Fitur Baru:** *Payment Status Tracking*. Indikator apakah PO ini sudah dibayar DP-nya atau sudah lunas oleh Finance.
* **Tab 3: Supplier Database**
    * **UI:** Direktori vendor kemasan dan bahan kimia.

---

### 2. Parameter Input & UI Detail (Berdasarkan Reborn Requirement)

Untuk memenuhi permintaan khusus klien Anda, berikut adalah elemen yang wajib ada di form input:

**A. Form Kebutuhan Barang (Integrasi SO & Formula)**
* **Input:** Pencarian berdasarkan **No. SO** atau **Proyek**.
* **Auto-Pull Data:** Begitu SO dipilih, sistem otomatis menarik:
    * Kode Formula R&D (Daftar Bahan Baku & Gramasi).
    * Detail Kemasan (Botol, Cap, Pump).
    * Detail Sekunder (Box, Etiket, Label Boks).
* **Kolom Indikator (Client Requirement No. 2):**
    * `Kebutuhan (Qty)` | `Stok Tersedia` | `Selisih (Minus = Merah)`.
    * **Tombol Shortcut:** Di samping baris yang "Minus", muncul tombol emas `[🛒 Buat PO]`.

**B. Form Pembuatan PO (Finalisasi)**
* **Input:** Pemilihan Vendor, Termin Pembayaran, dan Tanggal Estimasi Kedatangan.
* **Budgeting Visibility:** Di pojok kanan atas form PO, tampilkan **"Total Anggaran Proyek"** vs **"Sisa Dana Proyek"**. (Sesuai *Client Requirement* poin 1).

---

### 3. Logika Backend (The Procurement Engine)

**A. Global Aggregation Logic (Poin 3 Requirement)**
* **Proses:** Backend melakukan *query* ke seluruh `Requisition` yang berstatus `PENDING`.
* **Output:** Menggabungkan item dengan ID barang yang sama. 
* *Contoh:* Proyek A (10kg) + Proyek B (20kg) = Total Order 30kg. Ini memberikan daya tawar lebih tinggi saat tim Purchasing bernegosiasi harga dengan *supplier*.

**B. Skala Prioritas & Cash Flow Logic (Poin 3 Requirement)**
* **Logic:** Backend menghitung selisih hari antara *Tanggal Hari Ini* dengan *Target Produksi* di Sales Order.
* **Action:** Baris kebutuhan untuk proyek yang target produksinya masih > 90 hari akan diberi label `[Low Priority - Chill]`. Proyek yang akan produksi dalam < 14 hari akan berstatus `[CRITICAL - Immediate Purchase]`.

**C. Verification Gate (Poin 2 Requirement)**
* **Constraint:** Backend akan menolak pembuatan PO jika barang tersebut masih berstatus `isDummy`. SCM wajib melakukan konfirmasi barang ke Master Data (mengisi harga dan nama resmi) sebelum PO bisa diterbitkan. Ini memastikan timeline tidak mundur karena data barang "asal minta".

---

### 4. Output & Integrasi Dashboard

Dari data yang diolah di halaman ini, sistem akan memuntahkan data ke **Dashboard Gudang** Anda:

1.  **Card JALUR MASUK (A):** Menghitung rata-rata waktu dari PO dibuat hingga barang berstatus `Penerimaan`.
2.  **Card VALUATION AUDIT:** Mengakumulasi nilai uang yang sedang "terkunci" di dalam PO yang belum datang (Outstanding PO).
3.  **Tabel III.C PEMENUHAN PESANAN:** Menampilkan persentase kelengkapan bahan per SO. Jika semua bahan (Raw & Pack) sudah masuk gudang, status berubah menjadi `FULL_READY` (Siap Produksi).

--

# Lalu Lintas Logistik

### 1. Arsitektur Antarmuka (Frontend Workstation)
Halaman ini harus dirancang untuk **Kecepatan Input**. Operator gudang yang sedang berdiri di depan palet barang tidak punya waktu untuk mencari-cari menu kecil.

* **Layout:** Terbagi menjadi **3 Tab Aksi Cepat**:
    * **Tab IN (Terima Barang):** Untuk truk *supplier* yang datang membawa bahan pesanan (PO).
    * **Tab INTERNAL (Pindah Gudang):** Mengakomodasi Kebutuhan Klien No. 5 (Gudang Utama $\rightarrow$ Gudang Produksi/Mixing).
    * **Tab OUT (Kirim Pesanan):** Untuk barang jadi (FG) yang dikirim ke klien (SO).
* **Scan-First Interface:** Kursor harus selalu aktif (*auto-focus*) di kolom pencarian. Begitu operator menembak QR Code PO atau Surat Jalan, sistem langsung membuka form yang relevan.

---

### 2. Parameter Input (Strict Data Collection)
Kita mengambil struktur form dari `pembelian-masuk.html`, tetapi memberikan validasi ketat.

**A. Form Terima Barang (Inbound)**
* **Data Tarikan:** Sistem menarik data dari PO (misal: Pesan 100 kg Aqua).
* **Input Aktual Gudang:** Qty Aktual Diterima (bisa kurang/parsial dari PO).
* **Input Wajib (Hard-Gate CPKB):** `Nomor Batch Supplier` dan `Expired Date`. Jika operator gudang tidak mengisi dua kolom ini, tombol simpan mati. Ini adalah fondasi dari seluruh dasbor FEFO klien Anda.

**B. Form Pindah Gudang (Internal Transfer ke Produksi)**
* Sesuai *Client Requirement* No. 5: Produksi tidak boleh asal ambil.
* **Input:** Operator memasukkan **ID Permintaan Produksi (Batch Record)**.
* **Tindakan:** Mengisi jumlah yang diserahkan fisik (misal: diminta 2.6 kg, diserahkan 1 jerigen utuh 5 kg).

---

### 3. Logika Backend (The Movement Engine)
Ini adalah mesin pengawal regulasi. Backend harus lebih pintar dari operator.

**A. The Quarantine Gate (Kebutuhan Klien No. 6)**
* **Logic:** Begitu barang dari *supplier* di-klik `[Terima]`, sistem **TIDAK** menambahkannya ke `Stok Tersedia`. 
* **Status:** Barang langsung masuk ke status `QUARANTINE_DRUM`.
* **Aksi Lanjutan:** Backend memicu notifikasi ke **Tablet QC**. Barang ini baru berpindah ke `Stok Tersedia` (bisa dipakai produksi) HANYA JIKA tim QC sudah mengeklik `[Lulus Uji Fisik]` di tablet mereka.

**B. FEFO Auto-Enforcer (Pencegah Dead Stock)**
* **Kelemahan Sistem Lama:** Saat produksi minta bahan, operator gudang mengambil drum mana saja yang terdekat. Ini membuat bahan lama membusuk (Expired).
* **Sistem V4:** Saat operator gudang membuka form "Pindah Gudang", layar **mengunci pilihan**. Layar akan menginstruksikan: *"AMBIL BATCH #XYZ (Exp: Nov 2026)"*. 
* Jika operator mencoba melakukan scan pada drum Batch #ABC (yang lebih baru), sistem memunculkan warna merah: `[ERROR: FEFO VIOLATION. HABISKAN BATCH #XYZ TERLEBIH DAHULU]`. Ini adalah cara paling efektif memastikan indikator *Dead Stock* di Dasbor Klien tetap nol.

**C. Rekonsiliasi Otomatis (The Balance Tracker)**
* Sesuai *Client Requirement* No. 5: Jika gudang kirim 5 kg untuk kebutuhan 2.6 kg, backend langsung membuat "Hutang Material" kepada Produksi sebesar 2.4 kg.
* Status 2.4 kg ini melayang sebagai `WIP_PENDING_RETURN`. Produksi tidak bisa menutup *Batch Record* harian mereka sebelum 2.4 kg ini dikembalikan secara sistemik (atau dilaporkan sebagai tumpah/susut).

---

### 4. Output & Integrasi Dashboard
Data pergerakan dari halaman ini adalah urat nadi Dasbor Klien Anda:

1.  **Card JALUR MASUK (A) & INTERNAL (B):** Menghitung *Velocity* (Kecepatan). Backend mengukur: Jam berapa truk *supplier* datang vs Jam berapa barang masuk gudang.
2.  **Tabel III.A (Audit Granular Bahan Baku):** Status barang secara *live* berubah dari `NEEDS_QC` menjadi `FEFO_OK` ketika melewati fase karantina halaman ini.
3.  **Dokumen Fisik:** Mencetak "Label Karantina" atau "Label Lulus QC" secara otomatis dari *printer thermal* untuk ditempel di drum bahan kimia.


# Kendali Mutu & Opname

### 1. Arsitektur Antarmuka (Frontend Audit)
Menggunakan pendekatan *Split-View* atau *Tabular* murni agar operator dapat melakukan audit dengan cepat. Estetika *Silent Luxury* diterapkan menggunakan latar hitam pekat (#000000) dengan aksen peringatan berwarna emas (#d4af37) atau merah gelap untuk barang yang hilang.

* **Mode Pemindai Cepat:** Operator dapat memindai *QR Code* pada drum, dan sistem akan langsung memunculkan baris barang tersebut tanpa harus mencarinya secara manual.
* **Kolom Input Wajib (Berdasarkan HTML Lama):**
    * `Nama Barang / Batch`
    * `Kuantitas Sistem` (Read-only, dikunci oleh *backend*)
    * `Kuantitas Fisik` (Kolom input utama)
    * `Selisih (Variance)` (Otomatis terhitung: Fisik - Sistem)
    * `Kategori Penyesuaian` (Dropdown: Susut/Tumpah, Kedaluwarsa, Reject QC, Selisih Hitung)

### 2. Mekanisme & Constraint (Backend Logic)
Halaman ini adalah satu-satunya tempat di mana data aset perusahaan bisa dikurangi tanpa adanya penjualan (Sales Order). Oleh karena itu, hukum ketat harus diberlakukan.

**A. Threshold Approval (Batas Otoritas)**
* **Mekanisme:** Jika `Kuantitas Fisik` lebih kecil dari `Kuantitas Sistem`, backend otomatis menghitung *Loss Value* (Selisih Qty × HPP Material).
* **Constraint:** Jika *Loss Value* di bawah Rp 500.000 (angka bisa disesuaikan), sistem mengizinkan *Auto-Approve* dan stok langsung diperbarui. Jika *Loss Value* melampaui batas tersebut, tombol simpan berubah menjadi `[Ajukan Persetujuan]`. Data akan terkunci (berstatus `PENDING_AUDIT`) dan mengirimkan notifikasi kepada Manajer Gudang atau Finance untuk diinvestigasi.

**B. QC Disposition Engine (Penanganan Barang Karantina)**
* **Mekanisme:** Barang yang sebelumnya digembok di tab *Lalu Lintas Logistik* karena berstatus `QUARANTINE_DRUM` dan dinilai "Gagal" oleh QC di tablet mereka, akan otomatis masuk ke antrean halaman ini.
* **Tindakan (Trade-off):** Admin gudang harus memilih tindakan eksekusi:
    1. `RETURN_TO_SUPPLIER` $\rightarrow$ Memicu pembuatan dokumen Retur Pembelian dan memotong tagihan Hutang Dagang di Finance.
    2. `DISPOSAL` (Pemusnahan) $\rightarrow$ Barang dihapus dari sistem, dan kerugian finansial dicatat secara permanen di Jurnal Umum.

**C. Production Reconciliation (Susut Produksi)**
* **Mekanisme:** Menyelesaikan Kebutuhan Klien No. 5 (Rekonsiliasi). Jika produksi meminjam 5 Kg bahan dan hanya mengembalikan 2 Kg (padahal di *Batch Record* tertera pemakaian 2.6 Kg), terdapat selisih 0.4 Kg yang hilang/susut di mesin *mixing*.
* **Tindakan:** Selisih 0.4 Kg ini otomatis ditarik ke halaman Penyesuaian Stok dengan kategori `SUSUT_PRODUKSI`, memastikan HPP produk jadi yang dihasilkan hari itu menyerap biaya kerugian 0.4 Kg tersebut secara proporsional.

### 3. Output & Integrasi Dasbor
Aksi yang dilakukan di halaman ini secara langsung mensuplai metrik paling kritis untuk eksekutif:

1.  **Tabel III.D (Audit Risiko & Kerugian):** Semua data barang yang di-*disposal*, kedaluwarsa, atau susut otomatis masuk ke tabel Dasbor Klien ini, lengkap dengan nilai Rupiah (Impact Loss) yang hangus.
2.  **Card CAPACITY & ACCURACY:** Akurasi gudang diukur secara otomatis dari persentase selisih antara `Kuantitas Sistem` dan `Kuantitas Fisik` saat rutinitas Stok Opname dilakukan.
3.  **Jurnal Umum Akuntansi:** Setiap pengurangan stok yang tidak disertai *Sales Order* akan otomatis menghasilkan entri *Double-Entry* di modul Finance:
    * *Debit:* Beban Kerugian Persediaan
    * *Kredit:* Persediaan Bahan Baku Gudang
