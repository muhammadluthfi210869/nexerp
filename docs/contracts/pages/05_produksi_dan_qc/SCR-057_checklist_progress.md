# [SCR-057] Checklist Progress (Monitoring SPK & BPOM)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/quality/checklist-progress`
- **Legacy GsERP URL:** `/checklist-progress` (kil.gserp.id)
- **Menu Sidebar:** `10. PRA PRODUKSI (PPIC) > Checklist Progress`
- **Hak Akses (RBAC):** `PPIC`, `PRODUCTION`, `QC`, `COMMERCIAL`, `SUPERADMIN`
- **Tujuan Operasional:** Tabel kendali terpadu pemantauan seluruh SPK maklon yang sedang berjalan, status tahapan pengerjaan, dan verifikasi nomor BPOM yang terhubung langsung ke portal resmi BPOM.

---

## 2. Struktur Tabel Utama (Sama Persis kil.gserp.id + Link BPOM)
> **Sesuai Standar Persis Permintaan:** 
> `| # | No. Sales | Brand/Produk | Customer | Kategori | Tanggal Mulai | Tanggal Selesai | Status | # |` + Link BPOM di overview.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | No. Sales | `salesOrderNumber` | Clickable Link Dokumen SO | Left |
| 3 | Brand / Produk | `brandProduct` | Brand (Bold) + Nama Produk | Left |
| 4 | Customer | `customerName` | Nama Klien / Perusahaan | Left |
| 5 | Kategori | `category` | Badge 1 Baris: `SKINCARE`, `BODYCARE`, dll. | Center |
| 6 | Tanggal Mulai | `startDate` | `DD/MM/YYYY` | Left |
| 7 | Tanggal Selesai | `endDate` | `DD/MM/YYYY` | Left |
| 8 | Nomor BPOM | `bpomNumber` | **Clickable Link ke Cek BPOM** (`https://cekbpom.pom.go.id`) | Center |
| 9 | Status | `status` | Badge 1 Baris: `ON_PROGRESS`, `PENDING_MATERIAL`, `COMPLETED`, `DELAY` | Center |
| 10 | # (Aksi) | `actions` | Tombol: `Buka Checklist Detail (14 Tahap)` | Center |
