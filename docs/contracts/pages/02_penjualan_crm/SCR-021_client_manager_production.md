# [SCR-021] Client Manager — Tab 2: Client Produksi (Project Tracking)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/client-manager?tab=production`
- **Menu Sidebar:** `6. CRM & BUSDEV > Client Produksi`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `PPIC`, `PRODUCTION`, `SUPERADMIN`
- **Tujuan Operasional:** Pelacakan status proyek produksi maklon massal dari SPK awal hingga produk jadi siap dikirim ke klien.

---

## 2. Keputusan Arsitektur Mutlak (LOCKED CONTRACT)
### A. Independent Page Architecture (Tanpa Header Navbar Tabs)
> **KEPUTUSAN KUNCI:**
> Halaman **Client Produksi** adalah halaman operasional mandiri yang diakses langsung dari menu sidebar. **DILARANG** menampilkan navbar tabs (`tabs={[...]}`) di dalam `DnaPageHeader` agar terpisah secara tegas dari Client Sample.

### B. Tabel Ramping 2 Baris Pipeline CPKB (Bebas Scroll Horizontal)
> **Aturan Wajib:** Mengingat proyek maklon memiliki checkpoint milestone (Desain, HKI, BPOM, Bahan Baku, Mixing, Kemas, dll.), **DILARANG membuat tabel 20 kolom melebar ke kanan** karena merusak readability dan memaksa scrolling horizontal.
> **Solusi:** Tabel utama menggunakan representasi 2 baris terstruktur dengan standar chip Visual DNA:
> - Polos Putih: Belum Dimulai
> - Biru Aktif: Sedang Berjalan
> - Hijau: Selesai
> - Merah: Terlambat
> Kolom aksi menggunakan icon-only Visual DNA (`Eye` detail).

---

## 3. Struktur Tabel Utama (Overview Table)
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Mulai Projek`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Mulai | `startDate` | `DD/MM/YYYY` | Left |
| 3 | Brand / Produk | `brandProduct` | Nama Brand (Tebal) + Nama Produk | Left |
| 4 | Sales Order (SPK) | `soNumber` | Link Dokumen SO | Left |
| 5 | BusDev | `picBusDev` | Nama PIC BusDev | Left |
| 6 | Berakhir / Deadline | `deadlineDate` | `DD/MM/YYYY` (Warna merah jika H-3) | Left |
| 7 | Progress | `progressPercent` | Progress Bar Mini + Angka % (misal: 65%) | Center |
| 8 | Status Projek | `projectStatus` | Badge 1 Baris: `ON_TRACK`, `DELAY`, `NEARING_DEADLINE`, `COMPLETED` | Center |
| 9 | Aksi | `actions` | Tombol: `Buka Checklist Tracking (14 Tahap)`, `Detail SO` | Center |

---

## 4. Secondary Window: Interactive Milestone Checklist Popup (14 Tahapan Maklon)
- **Tipe Tampilan:** Floating Modal Lebar (`max-w-4xl`) dengan visual timeline stepper interaktif.
- **Trigger:** Klik tombol `Buka Checklist Tracking` atau klik nama baris.
- **Daftar 14 Checkpoint Milestone:**
  1. Desain Logo
  2. HKI Merek
  3. BPOM Notifikasi (BPOM NA) + Link Nomor Notifikasi
  4. Perjanjian Kerja Sama (MoU)
  5. Desain Kemasan
  6. Approval Desain Kemasan
  7. Ketersediaan Bahan Baku
  8. Pelunasan Pembayaran Klien
  9. Proses Produksi Mixing (Ruahan)
  10. Ketersediaan Bahan Kemas
  11. Proses Filing (Pengisian)
  12. Penempelan Label
  13. Pengepakan Box Sekunder
  14. Delivery & Pengiriman ke Klien
- **Status per Checkpoint:** `Belum Dimulai` (Abu-abu), `Sedang Berjalan` (Kuning), `Selesai / Approved` (Hijau).
