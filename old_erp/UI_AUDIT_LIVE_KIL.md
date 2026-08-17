# Audit UI/UX Old ERP — GsERP KIL

Dokumen ini mencatat audit read-only terhadap UI live `https://kil.gserp.id` dan pembacaan source HTML di folder `old_erp`. Audit ini digunakan sebagai baseline familiarity untuk pengembangan `compact.nexerp.id`.

Tanggal audit: 17 Agustus 2026  
Scope: shell aplikasi, dashboard, navigasi, pola data-heavy, dan asset frontend yang terlihat dari browser.

> Catatan keamanan: audit tidak mengubah, menghapus, atau mengekspor massal data bisnis. Credential tidak dicatat di repository.

## 1. Baseline live yang teramati

| Area | Temuan |
|---|---|
| Framework visual | AdminLTE + Bootstrap |
| Font | Source Sans Pro, weight 300/400/400 italic/700 |
| Sidebar | sekitar 250px, dark, fixed, `sidebar-mini layout-fixed` |
| Navbar | sekitar 57px, putih, fixed |
| Sidebar item | sekitar 40–43px tinggi; ikon di kiri, label di kanan |
| Page header | title kiri, breadcrumb kanan |
| Dashboard tile | grid 3 kolom; sekitar 323 × 80px pada viewport 1280px |
| Card | putih, border tipis, radius kecil, shadow ringan |
| Tile icon | blok biru solid di sisi kiri |
| Status/count | badge angka tampil langsung di menu |
| Data table | DataTables Bootstrap, responsive, pagination, export button |
| Form control | Bootstrap input/select; Select2 dan date range picker tersedia |
| Feedback | SweetAlert2 dan jQuery Validation tersedia |

## 2. Struktur mental pengguna

Pola halaman utama yang perlu dipertahankan:

```text
Sidebar 250px
  → Navbar 57px
  → Page title + breadcrumb
  → Content card / dashboard tile
  → Table atau form
  → Action, status, approval, dan feedback
```

Menu dikelompokkan berdasarkan pekerjaan, bukan hanya berdasarkan tipe halaman:

- Dasbor
- Master
- Persetujuan
- Umum
- Operasional
- Laporan
- Pengaturan

Ini merupakan bagian dari muscle memory pengguna dan lebih penting daripada meniru gaya visual ERP modern secara penuh.

## 3. Temuan UX yang perlu dipertahankan

- Posisi sidebar dan navbar.
- Pengelompokan menu berdasarkan domain pekerjaan.
- Submenu bertingkat untuk Master dan Operasional.
- Badge jumlah pekerjaan/persetujuan di navigasi.
- Urutan title → breadcrumb → content.
- Tabel sebagai pusat pekerjaan operasional.
- Aksi create/edit/detail berada dekat dengan data.
- Dashboard menggunakan tile ringkas, bukan card insight berukuran besar.
- Kontras warna biru untuk item aktif dan action utama.

## 4. Temuan yang boleh dipoles

Poles tanpa mengubah mental model:

- Ganti font secara bertahap setelah uji readability dengan pengguna lama.
- Rapikan typography hierarchy dan line-height.
- Pertahankan sidebar sekitar 248–250px; jangan diperkecil drastis.
- Pertahankan tinggi navbar sekitar 56–58px.
- Kurangi card radius dan shadow yang berlebihan.
- Pertahankan card putih dengan border ringan untuk halaman data.
- Gunakan row density compact, tetapi jangan membuat teks di bawah ukuran terbaca.
- Perjelas active state, focus state, status, dan feedback.
- Tambahkan saved filter, bulk action, column visibility, dan mobile behavior secara bertahap.

## 5. Perbandingan dengan compact prototype

| Komponen | Old ERP | Arah compact |
|---|---|---|
| Sidebar | 250px, padat, dark | sekitar 248px, hierarchy lebih jelas |
| Navbar | 57px, utilitarian | sekitar 56px, fokus pada utilitas |
| Dashboard | tile 80px, 3 kolom | tetap ringkas; kurangi bento/insight besar |
| Card data | flat, border tipis | gunakan border dan radius kecil |
| Tabel | DataTables, compact | DataTableV2 dengan sticky header dan toolbar |
| Typography | Source Sans Pro | uji font baru tanpa mengubah layout lebih dulu |
| Menu | kategori domain + submenu | pertahankan kategori dan urutan familiar |
| Status | badge/count di menu | pertahankan, perbaiki kontras dan semantics |

## 6. Urutan perubahan yang aman

Satu elemen per iterasi:

1. Font family.
2. Font weight.
3. Font size dan line-height.
4. Page/card spacing.
5. Card radius dan border.
6. Card shadow/background.
7. Sidebar hierarchy.
8. Page header dan breadcrumb.
9. Table header.
10. Table row density.
11. Search/filter toolbar.
12. Bulk action dan status feedback.
13. Form grouping dan validation.
14. Mobile sidebar, table, dan touch target.

Setiap iterasi harus dibandingkan pada halaman yang sama di `old_erp`, `demo.nexerp.id`, dan `compact.nexerp.id` pada desktop 1440/1280px serta mobile 375px.

## 7. Kesimpulan desain

Prinsip baseline compact:

> Familiarity dari old ERP, visual DNA dari NexERP, dan efisiensi interaksi dari ERP modern.

Kita tidak menyalin seluruh kekurangan visual old ERP. Kita mempertahankan struktur, posisi, density, dan workflow yang sudah dikenal; kemudian memperbaiki readability, accessibility, feedback, responsive behavior, serta fitur data-heavy yang mengurangi pekerjaan berulang.

