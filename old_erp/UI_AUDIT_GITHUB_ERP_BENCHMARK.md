# Audit Benchmark UI ERP Open Source di GitHub

Dokumen ini adalah benchmark terkurasi terhadap repository dan dokumentasi ERP open-source yang relevan untuk UI operasional. “Terbaik” di sini berarti paling berguna sebagai referensi untuk ERP data-heavy—bukan berarti seluruh visualnya harus ditiru.

Tanggal audit: 17 Agustus 2026  
Baseline internal: `old_erp` dan live `https://kil.gserp.id`  
Target: `compact.nexerp.id`

## 1. Cara memilih benchmark

Benchmark dipilih berdasarkan empat kriteria:

1. Memiliki UI ERP operasional yang nyata, bukan hanya landing page.
2. Memiliki pola list, form, search/filter, workflow, atau dashboard yang dapat dipelajari dari source/dokumentasi.
3. Memiliki ekosistem atau repository yang cukup aktif untuk menjadi referensi jangka panjang.
4. Relevan dengan kebutuhan NexERP: procurement, inventory, sales, finance, approval, dan laporan.

Repository yang diaudit:

- [Odoo](https://github.com/odoo/odoo)
- [OCA/web](https://github.com/OCA/web)
- [ERPNext](https://github.com/frappe/erpnext)
- [Frappe UI](https://github.com/frappe/frappe-ui)
- [Tryton view model](https://docs.tryton.org/latest/server/topics/views/index.html)

Skor di bawah adalah penilaian desain untuk kebutuhan NexERP, bukan benchmark performa atau rating resmi proyek.

## 2. Ringkasan skor desain

Skala: 1 = kurang cocok, 5 = sangat kuat untuk kebutuhan tersebut.

| Sistem | List/table | Search/filter | Form/workflow | Dashboard | Responsive | Extensibility | Relevansi untuk NexERP |
|---|---:|---:|---:|---:|---:|---:|---:|
| Odoo | 5 | 5 | 5 | 4 | 4 | 5 | 5 |
| OCA/web | 5 | 5 | 4 | 3 | 5 | 5 | 5 |
| ERPNext/Frappe | 4 | 5 | 5 | 5 | 4 | 5 | 5 |
| Frappe UI | 4 | 4 | 4 | 4 | 5 | 5 | 4 |
| Tryton | 5 | 4 | 5 | 3 | 2 | 4 | 3 |
| old_erp KIL | 4 | 3 | 4 | 3 | 2 | 2 | 5 sebagai familiarity baseline |

## 3. Audit Odoo

### Pola terbaik

- Memisahkan `list`, `form`, `search`, `graph`, dan view lain sebagai konsep yang jelas.
- List view didukung search view dan control panel; ini cocok untuk halaman yang berisi ratusan sampai ribuan record.
- Field optional dan konfigurasi kolom memungkinkan pengguna menyesuaikan informasi yang ingin dilihat.
- Form view dan action controller terhubung dengan lifecycle record, bukan hanya halaman CRUD.
- Struktur view berbasis metadata membuat pola UI dapat digunakan lintas modul.

Odoo mendokumentasikan view sebagai bagian dari web client—termasuk `form`, `list`, dan search view—sehingga hubungan antara data, filter, dan halaman lebih konsisten daripada halaman custom yang berdiri sendiri. Lihat [Odoo frontend framework](https://www.odoo.com/documentation/18.0/developer/reference/frontend/framework_overview.html) dan [model view di source](https://github.com/odoo/odoo/blob/19.0/odoo/addons/base/models/ir_ui_view.py).

### Yang perlu diambil untuk NexERP

- Satu standar `ListPage` untuk seluruh modul.
- Search/filter sebagai bagian dari page header, bukan elemen terpisah yang berpindah-pindah.
- Konfigurasi kolom dan filter tersimpan per pengguna.
- Mode list, detail, dan form memiliki transisi yang konsisten.
- Action utama dan bulk action mengikuti status record.

### Yang tidak perlu ditiru mentah-mentah

- Kompleksitas konfigurasi Odoo yang dapat terasa berat bagi pengguna lama.
- Banyaknya variasi view jika tidak diperlukan oleh proses KIL.
- UI enterprise yang terlalu generik untuk domain operasional spesifik.

## 4. Audit OCA/web

OCA/web paling berguna sebagai katalog masalah nyata yang sering muncul setelah ERP dipakai lama. Repository ini menyediakan addon untuk dark mode, responsive web client, filter header, remembered column width, export, save/discard, notification, dan pengaturan dialog. Lihat [daftar addon OCA/web](https://github.com/OCA/web).

### Pola terbaik

- Column width dapat diingat.
- Filter aktif dapat ditampilkan sebagai tombol/chip.
- Responsive web client diperlakukan sebagai concern khusus, bukan sekadar CSS breakpoint.
- Export, notification, dialog size, dan save/discard memiliki komponen tersendiri.

### Yang perlu diambil untuk NexERP

Prioritas tinggi:

1. Remembered column width.
2. Saved filter dan active-filter chip.
3. Responsive table strategy.
4. Save/discard state.
5. Export yang permission-aware.
6. Notification dan confirmation yang konsisten.

Ini lebih bernilai untuk pengguna ERP daripada menambah dekorasi dashboard.

## 5. Audit ERPNext/Frappe

ERPNext memakai pendekatan metadata-driven melalui Frappe. Route standar mencakup pola list, form, report, calendar, tree, dan dashboard. Dokumentasi Frappe juga menunjukkan resource list/document dengan state `data`, `loading`, `error`, serta operasi update, insert, dan delete. Lihat [repository ERPNext](https://github.com/frappe/erpnext), [Frappe route/view reference](https://github.com/frappe/frappe/wiki/Developer-Cheatsheet/7fa0b4aba4ff68fe716ae5388c268108717d3550), dan [Frappe UI](https://github.com/frappe/frappe-ui).

### Pola terbaik

- Workspace/module menjadi entry point berdasarkan pekerjaan.
- List dan form mengikuti metadata DocType.
- Link field, child table, quick entry, report, dan dashboard terintegrasi.
- Loading, error, dan success state diperlakukan sebagai bagian dari data flow.
- Frappe UI menyediakan primitive yang dapat digunakan ulang untuk list, document, resource, dan form.

### Yang perlu diambil untuk NexERP

- Model route yang konsisten: `List → Detail/Form → Workflow/Report`.
- Komponen resource dengan state loading/error/success eksplisit.
- Child table untuk transaksi pembelian, penjualan, dan produksi.
- Workspace yang berorientasi peran, bukan hanya daftar semua halaman.
- Quick entry hanya untuk field minimal; form lengkap tetap tersedia.

### Yang perlu diwaspadai

- Workspace yang terlalu bebas dapat membuat navigasi tidak konsisten.
- Metadata-driven UI tetap membutuhkan design governance agar setiap modul tidak memiliki interpretasi visual sendiri.
- Meniru seluruh desk view akan menjauh dari mental model `old_erp`.

## 6. Audit Tryton

Tryton mendefinisikan Form, Tree, List-Form, Graph, Board, dan Calendar sebagai tipe view yang eksplisit. Dokumentasinya kuat untuk memahami pemisahan list/form dan lifecycle action, tetapi karakter web/mobile-nya bukan baseline utama NexERP. Lihat [Tryton views documentation](https://docs.tryton.org/latest/server/topics/views/index.html).

### Pola terbaik

- View type sangat jelas dan dapat diprediksi.
- Tree/list berfokus pada data dan kolom.
- Form memiliki grouping, notebook/tab, button, dan wizard.
- Action seperti new, delete, copy, next, previous, close, dan reload didefinisikan eksplisit.

### Yang perlu diambil untuk NexERP

- Definisikan page archetype secara resmi: `List`, `Form`, `Report`, `Dashboard`, `Approval`.
- Definisikan action lifecycle agar tombol tidak bergantung pada improvisasi setiap halaman.
- Gunakan wizard untuk proses multi-langkah seperti approval, retur, atau stok opname.

### Yang tidak perlu ditiru

- Orientasi desktop yang kurang sesuai untuk mobile.
- List-form editable untuk data besar; dokumentasi Tryton sendiri memperingatkan bahwa mode ini tidak scale baik untuk banyak record.

## 7. Perbandingan dengan old_erp KIL

| Area | old_erp KIL | Pola terbaik dari benchmark | Keputusan NexERP |
|---|---|---|---|
| Shell | AdminLTE, sidebar 250px, navbar 57px | Odoo/Frappe workspace dan control panel | Pertahankan posisi dan density old_erp |
| Menu | Domain + submenu + badge count | Role/workspace-aware navigation | Pertahankan kategori KIL, rapikan hierarchy |
| List | DataTables, pagination, export | Odoo search/list + OCA column/filter memory | Tambahkan saved filter dan column preferences |
| Form | Bootstrap input dan jQuery validation | Metadata form + explicit workflow | Buat form archetype dan status lifecycle |
| Dashboard | Tile 3 kolom, sekitar 80px | Frappe workspace dan KPI yang actionable | Pertahankan tile ringkas; hindari bento besar |
| Feedback | SweetAlert2 | State loading/error/success terstruktur | Standarkan inline + toast/dialog |
| Responsive | Terbatas | OCA/Frappe responsive patterns | Tambahkan mobile strategy per page archetype |
| Extensibility | Page HTML terpisah | Metadata/component system | Bangun shared component tanpa mengubah route lama |

## 8. Rekomendasi adopsi

### Wajib diadopsi

- `ListPage` dan `FormPage` archetype.
- Search/filter toolbar terpadu.
- Saved filter.
- Remembered column width/visibility.
- Bulk action yang mengikuti permission dan status.
- Sticky table header.
- Loading, empty, error, dan success state standar.
- Workflow state yang terlihat jelas.
- Responsive behavior untuk list, form, dan approval.
- Audit-friendly confirmation untuk aksi destruktif.

### Diadopsi setelah validasi pengguna

- Workspace berbasis peran.
- Quick entry.
- Inline edit pada field tertentu.
- Dashboard KPI interaktif.
- Command/keyboard navigation.
- Column chooser dan personal view.

### Tidak menjadi prioritas

- Glassmorphism, gradient card, atau bento layout besar.
- Animasi dekoratif.
- Mengganti seluruh sidebar.
- Meniru warna atau branding Odoo/Frappe.
- Mengubah route dan istilah bisnis hanya agar terlihat modern.

## 9. Formula desain untuk NexERP

```text
70% familiarity old_erp
20% visual DNA NexERP
10% interaction pattern dari ERP open-source
```

Formula tersebut berlaku untuk layout dan behavior, bukan untuk seluruh tampilan pixel-per-pixel. Pada komponen data-heavy, proporsinya dapat bergeser menjadi:

```text
60% old_erp workflow
30% proven ERP interaction pattern
10% NexERP visual treatment
```

## 10. Roadmap implementasi dari audit

1. Tetapkan `ListPage`, `FormPage`, `ApprovalPage`, `ReportPage`, dan `DashboardPage`.
2. Migrasikan satu halaman Goods sebagai pilot.
3. Tambahkan search/filter dan saved view.
4. Tambahkan column preference dan bulk action.
5. Migrasikan Purchase karena memiliki workflow dan approval.
6. Standarkan form state dan validation.
7. Uji responsive behavior pada mobile.
8. Uji dengan pengguna lama menggunakan task yang sama di old ERP dan compact.
9. Baru sesuaikan dashboard dan visual polish.

## Kesimpulan

Benchmark terbaik untuk NexERP bukan satu produk tunggal. Odoo paling kuat untuk konsep list/search/form dan extensibility; OCA/web paling kuat sebagai katalog improvement untuk masalah ERP sehari-hari; ERPNext/Frappe paling kuat untuk metadata-driven workspace, resource state, dan integrasi form-list-workflow; Tryton paling berguna untuk mendefinisikan archetype view dan action lifecycle.

Namun, `old_erp` KIL tetap menjadi baseline familiarity. Kita mengambil pola interaksi yang terbukti, bukan menyalin seluruh shell atau branding proyek lain.

