# [SCR-058] Checklist Tracking & Timeline Projek Maklon (SLA Multi-Departemen)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/quality/checklist-tracking`
- **Menu Sidebar:** `9. QUALITY CONTROL > Checklist Tracking`
- **Hak Akses (RBAC):** `QC`, `PPIC`, `PRODUCTION`, `COMMERCIAL`, `SUPERADMIN`
- **Tujuan Operasional:** Pusat kendali SLA proyek maklon multi-departemen untuk memantau 20 milestone kritis (Busdev, Desain Kemasan, Legalitas BPOM/HKI, Formulasi R&D, SCM Bahan, Produksi Pabrikasi, Lab QC, Finance, hingga Pengiriman) dengan dropdown inline dan estimasi tanggal penyelesaian.

---

## 2. Keputusan Arsitektur Mutlak (LOCKED CONTRACT)

### A. Non-Sequential Architecture (Bukan Stepper Linear)
> **KEPUTUSAN KUNCI:**
> Proses maklon memiliki milestone yang **berjalan paralel dan simultan di berbagai departemen** (misalnya: Formulasi R&D, Pendaftaran BPOM NA, dan Desain Kemasan dapat berlangsung bersamaan tanpa saling memblokir secara linear).
>
> **ATURAN WAJIB:**
> 1. **DILARANG** menampilkan badge sequential seperti `▶ Tahap Aktif: ...` pada overview tabel projek.
> 2. **DILARANG** menyisipkan panah sequential `→` antar-chip milestone.
> 3. Header kolom overview dinamai **`CHECKLIST MILESTONE DEPARTEMEN`** (bukan *Pipeline*).
> 4. Status ditampilkan sebagai **Matriks Chip 2 Baris Non-Sequential** yang merefleksikan progress riil masing-masing departemen secara independen.

### B. Standar Visual DNA Chip Status (Konsisten Lintas Modul)
Semua chip milestone di Checklist Tracking, Client Produksi, dan Client Sample wajib mematuhi kode warna berikut:
- **Belum Dikerjakan / Pending:** **Polos Putih** (`bg-white text-slate-400 border border-slate-200 hover:bg-slate-50`).
- **Sedang Berjalan / In Progress:** **Biru Aktif** (`bg-blue-600 text-white font-bold animate-pulse shadow-2xs`).
- **Selesai / Done:** **Hijau Halus** (`bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold`).
- **Terlambat / Delayed / Overdue:** **Merah Halus** (`bg-rose-50 text-rose-800 border border-rose-300 font-semibold`).
- **Hold:** **Amber Halus** (`bg-amber-50 text-amber-800 border border-amber-300 font-semibold`).

### C. Kolom AKSI Wajib Icon-Only (Visual DNA)
- Kolom AKSI dirancang ringkas (`w-16`, text-center) tanpa label teks yang memicu pembengkakan horizontal:
  - 📊 **Icon Gantt Chart (`BarChart3`):** Membuka visualisasi interaktif Gantt Timeline SLA per departemen.
  - 🔽 **Icon Expand Dropdown (`ChevronDown`):** Membuka sub-tabel vertikal 20 milestone per baris langsung di bawah projek (inline accordion tanpa pindah halaman).
  - ✏️ **Icon Edit (`Edit2`):** Terletak pada sub-tabel baris milestone untuk update estimasi tanggal & catatan delay.

### D. Zero Horizontal Scroll Policy (6 Kolom Presisi)
Tabel utama overview dirancang dengan kepadatan informasi tinggi (high-density layout) tepat **6 kolom** tanpa scroll horizontal:
1. `#` (`w-10`, Center) — Penomoran indeks.
2. `PROJEK & PELANGGAN` (`w-60`, Left) — Penggabungan SO Code (badge font mono), Nama Customer, serta Brand & Nama Produk.
3. `TARGET & SLA` (`w-28`, Left) — Tanggal deadline final kontrak + pill hitung mundur sisa hari / overdue.
4. `CHECKLIST MILESTONE DEPARTEMEN` (`min-w-[460px]`, Left) — Matriks 2 baris representasi progress multi-departemen.
5. `STATUS & PROGRESS` (`w-32`, Center) — Badge status keseluruhan projek (`ON_TRACK`, `DELAYED`, `PENDING`, `COMPLETED`) + Progress Bar % numerik.
6. `AKSI` (`w-16`, Center) — Icon-only action buttons (`BarChart3` + `ChevronDown`).

### E. Single-View Layout (Tanpa Header Navbar Tabs)
> **Aturan Wajib:** Seluruh kendali filter status, pencarian, dan filter departemen telah terintegrasi di dalam toolbar `DnaDataTableCard`. **DILARANG** menampilkan navbar tabs (`tabs={[...]}`) di dalam `DnaPageHeader` agar tampilan lapang, bebas duplikasi, dan langsung fokus ke tabel tracking.

---

## 3. Toolbar & Filtering Sesuai Golden Reference
Toolbar `DnaDataTableCard` wajib menyediakan filter lengkap:
1. **Search Bar:** Real-time search query mencakup SO Code, Nama Customer, Nama Brand, Nama Produk, dan PIC Busdev.
2. **Dedicated Status Filter:** Dropdown status SLA (`Semua Status`, `On Track`, `Delayed / Terlambat`, `Pending`, `Selesai Penuh`).
3. **Multi-Level Secondary Filter:**
   - Filter Departemen PIC (`Busdev`, `Design`, `R&D`, `Legalitas`, `SCM`, `Produksi`, `QC`, `Finance`).
   - Filter Status Milestone (`Bahan Baku: PENDING`, `Mixing: PENDING`, `BPOM NA: PENDING`, `Delivery: PENDING`, dll.).
4. **Tombol Reset Semua Filter:** Mengembalikan tabel ke state default satu kali klik.

---

## 4. Sub-Tabel Expanded: 20 Milestone Vertikal (1 Row per Milestone)
Ketika baris projek atau icon `ChevronDown` diklik, muncul dropdown vertikal yang menampilkan 20 milestone dengan atribut:
- Nomor Urut Milestone
- Nama Tahapan / Kategori & Ketergantungan (Dependency)
- Badge Departemen PIC
- Nama PIC yang bertanggung jawab
- Durasi SLA (Hari)
- Tanggal Deadline PIC
- Estimasi Tanggal Selesai (dengan icon Calendar)
- Dropdown Status Langsung (`PENDING`, `IN_PROGRESS`, `DONE`, `DELAYED`, `HOLD`)
- Catatan / Alasan Pending
- Tombol Aksi Edit Estimasi & Catatan
