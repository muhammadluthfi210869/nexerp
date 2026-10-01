# [SCR-070] Digital Marketing & Brand Workspace (Management Task, Dreamlab, Toribio)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Overview / Tasks: `/marketing/management-task/overview`
  - Brand Dreamlab: `/marketing/dreamlab`
  - Brand Toribio: `/marketing/toribio`
  - Dashboard Digimar: `/marketing/dashboard`
- **Menu Sidebar:** `8. MARKETING & BRANDS`
- **Hak Akses (RBAC):** `DIGIMAR`, `DIGITAL_MARKETING`, `SUPERADMIN`
- **Tujuan Operasional:** Pusat kendali task management kreatif, kampanye pemasaran digital B2B (Dreamlab) dan B2C (Toribio), kalender konten, dan pelacakan metrik media sosial.

---

## 2. Penyelarasan Visual DNA (Unifikasi Komponen)
> **Penyelesaian Masalah:** 
> Sebelumnya komponen, font, tombol, dan warna di modul marketing berbeda dari sistem ERP utama, merusak konsistensi visual.
> **Aturan Wajib:**
> 1. Menggunakan komponen primitif `@/components/dna` (`DnaButton`, `DnaInput`, `DnaDataTableCard`).
> 2. Font seragam: Standar Inter sans, tabel `text-xs (12px)`, heading `font-bold tracking-tight text-slate-900`.
> 3. Pembeda Brand menggunakan **Subtle Color Tagging**:
>    - Brand Dreamlab (B2B): Aksen Biru Slate / Dark Navy.
>    - Brand Toribio (B2C): Aksen Ungu / Lavender.
>    - Tidak boleh ada warna acak pelangi di luar palet sistem.

---

## 3. Struktur Tabel Management Task
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Deadline Task`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Deadline | `dueDate` | `DD/MM/YYYY` (Merah jika H-1) | Left |
| 3 | Judul Task / Konten | `taskTitle` | Judul (Bold) + Sub-deskripsi | Left |
| 4 | Brand Target | `brandTarget` | Badge 1 Baris: `DREAMLAB (B2B)` / `TORIBIO (B2C)` | Center |
| 5 | Channel / Media | `channel` | Badge: `INSTAGRAM`, `TIKTOK`, `LINKEDIN`, `ADS` | Center |
| 6 | PIC Tim | `assignee` | Avatar inisial + Nama PIC Konten | Left |
| 7 | Status Konten | `taskStatus` | Badge 1 Baris: `TODO`, `IN_PRODUCTION`, `REVIEW`, `PUBLISHED` | Center |
| 8 | Aksi | `actions` | Tombol: `Buka Detail Task`, `Ubah Status`, `Preview Konten` | Center |
