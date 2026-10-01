# [SCR-020] Client Sample R&D (Aktivitas Formulasi & Prospek Klien)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/client-manager?tab=sample`
- **Menu Sidebar:** `SALES & CRM > Client Sample`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `RND`, `SUPERADMIN`
- **Tujuan Operasional:** Halaman mandiri pemantauan dan pengelolaan aktivitas prospek klien maklon pada fase pengembangan sample formula (Sample 1, Revisi 1, Revisi 2, Kesiapan Legalitas HKI & Kemasan, hingga Komitmen DP 30 Hari).

---

## 2. Keputusan Arsitektur Mutlak (LOCKED CONTRACT)

### A. Independent Page Architecture (Tanpa Header Navbar Tabs)
> **KEPUTUSAN KUNCI:**
> Halaman **Client Sample** dan **Client Produksi** adalah **dua halaman yang berdiri sendiri secara mandiri** dengan menu akses langsung dari sidebar.
> **DILARANG** menampilkan navbar tabs (`tabs={[...]}`) di dalam `DnaPageHeader` karena memicu redundansi navigasi dan membingungkan pengguna.

### B. Standardisasi Toolbar Visual DNA Golden Reference (`DnaDataTableCard`)
Toolbar tabel wajib 100% menggunakan arsitektur bawaan **`DnaDataTableCard`** melalui **`toolbarProps`** (bukan toolbar kustom berbasis pill button terpisah):
1. **Search Input (`searchValue`):** Real-time search nama klien, brand, produk sampel, domisili, atau status.
2. **Dedicated Status Filter (`statusOptions`):** Dropdown pilihan status:
   - `ALL` (Semua Status)
   - `PROCESS`
   - `POTENTIAL DEALING`
   - `NEGOTIABLE`
   - `DEAL`
   - `LOST`
3. **Secondary Filter (`filterColumns`):** Filter kolom bertingkat (misal: Sumber Leads: Instagram, TikTok, Website, Referral, Walk In, WhatsApp).
4. **Primary Action Button (`actionButton`):** Tombol utama `+ Tambah Sample Klien` terintegrasi langsung di toolbar.
5. **Tombol Reset Semua Filter (`onResetAll`):** Mengembalikan seluruh state pencarian dan filter ke default.

### C. Mode Tampilan Ganda (Dual View Modes)
Disediakan tombol pengalih tampilan di pojok kanan atas tabel:
1. **Mode Kompak (Pipeline 2-Baris):**
   - Bebas scroll horizontal (Zero Horizontal Scroll Policy).
   - Dilengkapi *Interactive Mini-Stepper Pipeline Rail* (`S1 ➔ R1 ➔ R2 ➔ HKI ➔ DP`) dengan indikator warna status Visual DNA:
     - Polos Putih: Belum Dikerjakan
     - Biru Aktif: Sedang Berjalan (NPF)
     - Hijau: Selesai / Terkirim Sesuai SLA / Deal
     - Merah: Terlambat / Overdue
2. **Mode Spreadsheet (34 Kolom AMI Activity Work):**
   - Struktur hierarki 7 kelompok kolom 1:1 format spreadsheet operasional master BD.

---

## 3. Secondary Window: Floating Modal Tambah / Edit Sample Klien
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-4xl`).
- **Trigger:** Tombol `+ Tambah Sample Klien` di toolbar atau tombol Edit di kolom Aksi.
- **Section Data:**
  - Section 1: Data Klien & Rencana Order (Nama, Brand, Domisili, Kontak, Produk, Rencana MOQ, Rencana Budget Closing).
  - Section 2: Progres Sampel & NPF (S1 NPF & Delivery, R1 NPF & Delivery, R2 NPF & Delivery, Status Progres).
  - Section 3: Legalitas & Kemasan (Fix Formula, HKI, Kemasan Primer & Sekunder, Mockup).
  - Section 4: Target DP & Arahan Head BD (Tanggal Permintaan, Tanggal Kirim, Tanggal Target DP otomatis +30 hari, Status Akhir, Arahan Head BD).
