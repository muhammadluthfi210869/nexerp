# Aureon ERP UI/UX V2 — Master Expectation & Implementation Plan

**Status:** Proposed / menunggu persetujuan final  
**Tanggal:** 17 Agustus 2026  
**Target:** Prototype pembanding sebelum perubahan UI produksi  
**Nama kerja:** Visual DNA v2 — Operational Intelligence  

---

## 1. Tujuan Dokumen

Dokumen ini menjadi satu acuan untuk eksperimen UI/UX V2 Aureon ERP. Dokumen ini merangkum:

- hasil audit UI ERP lama dan UI saat ini;
- ekspektasi pengalaman pengguna;
- arah revisi Visual DNA;
- aturan density, typography, layout, tabel, form, dan mobile;
- strategi library;
- strategi branch, deployment, dan subdomain pembanding;
- pilot page, tahapan implementasi, pengujian, dan acceptance criteria;
- batasan agar perubahan UI tidak mengubah business rule tanpa persetujuan.

Dokumen ini **belum memberi izin untuk mengganti UI produksi**. Semua perubahan pertama dilakukan di prototype terpisah dan dibandingkan dengan baseline yang tetap tersedia.

---

## 2. Ringkasan Keputusan

### 2.1 Keputusan utama

Aureon ERP tidak akan kembali ke tampilan AdminLTE ERP lama. Identitas visual baru tetap dipertahankan, tetapi struktur operasional, terminology, density, dan pola penyelesaian pekerjaan akan didekatkan kembali dengan mental model pengguna lama.

Komposisi arah desain:

- **60% struktur kerja dan mental model ERP lama**;
- **30% peningkatan UX ERP modern**;
- **10% karakter visual premium Aureon**.

Angka ini bukan persentase elemen visual secara literal. Ini adalah pedoman prioritas ketika terjadi konflik antara estetika, familiarity, dan efisiensi kerja.

### 2.2 Definisi V2

Visual DNA V2 bukan sekadar versi V1 yang diperkecil. V2 harus mencakup:

1. density profile berdasarkan perangkat dan konteks kerja;
2. page archetype berdasarkan jenis pekerjaan;
3. typography yang lebih tenang dan mudah dipindai;
4. terminology bisnis yang familiar;
5. table system yang memiliki fungsi enterprise;
6. responsive mobile renderer;
7. progressive disclosure untuk fitur baru;
8. usability validation sebelum rollout.

### 2.3 Strategi prototype

| Lingkungan | Branch | Subdomain | Fungsi |
|---|---|---|---|
| Baseline V1 | `prototype-demo` | `demo.nexerp.id` | Visual saat ini; pembanding; dibekukan dari perubahan UI besar |
| Eksperimen V2 | `codex/ui-ux-v2-prototype` | `compact.nexerp.id` | Operational redesign desktop, tablet, dan mobile |

`compact.nexerp.id` telah dipilih sebagai target pembanding. Aktivasi DNS, SSL, container, dan konfigurasi reverse proxy tetap memerlukan verifikasi deployment.

---

## 3. Klasifikasi Produk Saat Ini

ERP saat ini lebih tepat disebut **replatform/new ERP berdasarkan business flow legacy**, bukan redesign visual biasa.

Alasannya:

- stack berubah dari HTML/AdminLTE menjadi Next.js/React;
- jumlah dan cakupan halaman berkembang signifikan;
- navigation hierarchy dan terminology berubah;
- komponen, workflow, dan fitur baru sudah jauh melampaui source lama;
- pengguna lama harus mempelajari bukan hanya tampilan, tetapi juga cara menemukan fungsi.

Konsekuensinya, rollout tidak boleh diperlakukan seperti pergantian skin. Dibutuhkan strategi change management dan progressive learning.

---

## 4. Temuan Audit Baseline

### 4.1 Perbandingan ukuran

Pengukuran dilakukan pada viewport desktop 1440 × 900 px.

| Elemen | ERP lama | Visual DNA V1 saat ini | Dampak |
|---|---:|---:|---|
| Sidebar | sekitar 250 px | 280–288 px | Area kerja berkurang |
| Page padding | sekitar 15–20 px | 48 px | Terlalu banyak ruang kosong |
| Table row | 37 px terukur | token 48 px; beberapa implementasi dapat 56–64 px | Record yang terlihat jauh lebih sedikit |
| Table cell horizontal padding | sekitar 5–12 px | 24 px | Tabel cepat melebar |
| Card padding | sekitar 16–20 px | 32 px | Cocok untuk presentasi, boros untuk operasi |
| Card radius | sekitar 4 px | 24–32 px | Terasa seperti SaaS showcase |
| Section gap | sekitar 16–24 px | 40 px | Konten utama terdorong ke bawah |
| Posisi data pertama pada Barang | sekitar y=243 px | sekitar y=557 px | Pengguna kehilangan sekitar 314 px sebelum melihat data |

### 4.2 Masalah desain sistemik

Masalah saat ini bukan hanya berasal dari halaman individual. Token global V1 menetapkan:

- page padding 48 px;
- card gap 32 px;
- card padding 32 px;
- card radius 24 px;
- section gap 40 px;
- table row 48 px;
- sidebar token 280 px.

Halaman analitik, master data, transaksi, approval, dan workstation akhirnya diarahkan menggunakan ritme visual yang terlalu seragam.

### 4.3 Konflik source of truth

Repository memiliki pedoman yang saling bertentangan:

- `docs/design/LAYOUT_GOVERNANCE.md` mengarah ke radius 8 px, input 32/40 px, dan row compact 40 px;
- `VISUAL_DNA.md` serta restoration spec lama mengarah ke radius 24–32 px, padding 32 px, micro-text 9–10 px, uppercase, tracking lebar, dan weight 900/950.

Mulai prototype V2, urutan source of truth yang diusulkan adalah:

1. dokumen master ini;
2. Visual DNA V2 yang nantinya diturunkan dari dokumen ini;
3. page-specific specification;
4. `LAYOUT_GOVERNANCE.md` setelah diselaraskan;
5. Visual DNA V1 sebagai baseline historis, bukan acuan implementasi V2.

### 4.4 Masalah typography

Keluhan pengguna terhadap font dinilai valid. Masalah utama bukan keluarga font Inter, tetapi treatment yang berlebihan:

- terlalu banyak `font-black`;
- terlalu banyak uppercase;
- terlalu banyak `tracking-widest`;
- micro-text 8–10 px;
- heading, label, data, dan tombol memiliki weight yang hampir sama;
- teks sekunder terlalu pucat;
- istilah panjang ditulis kapital dan letter-spaced.

Dampaknya:

- hierarchy visual melemah;
- halaman terasa berisik dan kaku;
- scanning tabel melambat;
- kelelahan visual meningkat;
- UI terlihat seperti control-room demo, bukan aplikasi kerja harian.

### 4.5 Masalah familiarity dan learning curve

Perubahan terminology meningkatkan beban kognitif. Contoh:

| Istilah V1 | Istilah yang disarankan |
|---|---|
| Goods Catalog | Barang / Daftar Barang |
| Initialize Good | Buat Barang |
| Logistical Intelligence | Pengaturan Stok dan Pengiriman |
| Outbound Engine | Metode Pengeluaran Stok |
| Protocol / Engine / Intelligence | Gunakan hanya pada system/admin area jika memang diperlukan |

Keluhan terhadap fitur baru tidak dapat diselesaikan hanya dengan membuat layout mirip ERP lama. Fitur baru membutuhkan progressive disclosure, contextual explanation, dan vocabulary yang mengikuti bahasa kerja pengguna.

---

## 5. Product Experience Principles

### 5.1 Work software first

ERP adalah work software. Prioritas berurutan:

1. business correctness;
2. kemampuan menemukan status dan next action;
3. kecepatan menyelesaikan tugas berulang;
4. traceability dan auditability;
5. learnability;
6. accessibility;
7. estetika.

Estetika tetap penting, tetapi tidak boleh mengurangi jumlah informasi relevan atau memperpanjang workflow.

### 5.2 Familiar structure, modern capability

Yang dipertahankan dari ERP lama:

- sidebar dan group modul yang mudah dipetakan;
- istilah bisnis Indonesia;
- table-first untuk halaman list;
- posisi aksi yang konsisten;
- urutan kolom penting;
- alur dokumen dan status yang familiar.

Yang dipertahankan dari ERP baru:

- semantic status color;
- audit trail;
- drawer/detail panel;
- alert blocked/overdue;
- bulk action;
- saved filters;
- integrasi antarproses;
- validation dan contextual next action;
- visual hierarchy yang lebih bersih.

### 5.3 Compact is not tiny

Compact berarti:

- spacing lebih efisien;
- dekorasi dikurangi;
- informasi sekunder ditampilkan sesuai kebutuhan;
- typography tetap terbaca;
- area layar diberikan kepada data dan tindakan.

Compact tidak berarti:

- font 8–10 px;
- target sentuh terlalu kecil;
- semua kolom dipaksakan masuk;
- line-height terlalu rapat;
- menghilangkan label penting.

### 5.4 Progressive disclosure

- Default memperlihatkan workflow inti.
- Advanced action masuk ke `Lainnya` atau panel detail.
- Fitur baru dapat diberi badge `Baru` untuk periode terbatas.
- Penjelasan harus satu kalimat dan kontekstual.
- Jangan mengharuskan pengguna mempelajari semua fitur sekaligus.

### 5.5 Role and context driven

Tampilan harus menyesuaikan pekerjaan:

- executive membutuhkan exception dan decision support;
- operator membutuhkan queue dan next action;
- admin master data membutuhkan pencarian, filter, dan bulk operation;
- approver membutuhkan dokumen, risiko, nominal, dan consequence;
- workstation produksi/QC membutuhkan touch target dan input cepat;
- mobile user membutuhkan monitoring dan action singkat.

---

## 6. Visual DNA V2

### 6.1 Yang dipertahankan

- Inter sebagai font awal;
- tabular numbers untuk nominal dan kuantitas;
- background neutral terang;
- white surface;
- border tipis;
- semantic status palette;
- Lucide icon;
- reusable components;
- visible focus state;
- audit, alert, dan status clarity.

### 6.2 Yang direvisi

- density dan spacing;
- radius;
- typography weight dan casing;
- hierarchy halaman;
- penggunaan card;
- terminology;
- motion;
- table capability;
- responsive renderer.

### 6.3 Yang dibatasi

- card lift pada setiap container;
- hover animation dekoratif;
- watermark icon besar;
- bento card pada halaman registry;
- micro-label di bawah 11 px;
- weight 900 untuk body/table;
- uppercase pada kalimat panjang;
- stagger animation pada baris tabel;
- glow dan pulse yang tidak menunjukkan perubahan state.

---

## 7. Density Profiles

### 7.1 Token target

| Token | Compact Operational | Standard Dashboard | Comfortable Touch |
|---|---:|---:|---:|
| Page padding X | 20–24 px | 28–32 px | 24–32 px |
| Page padding Y | 20–24 px | 28–32 px | 24–32 px |
| Section gap | 20 px | 24–28 px | 24 px |
| Card gap | 12–16 px | 20–24 px | 16–24 px |
| Card padding | 16–20 px | 20–24 px | 20–24 px |
| Card radius | 8–12 px | 12–16 px | 12–16 px |
| Table row | 36–40 px | 44–48 px | 52–56 px |
| Table header | 36–40 px | 40–44 px | 48–52 px |
| Table cell padding X | 12–16 px | 16–20 px | 16–20 px |
| Input/button height | 32–36 px | 40 px | 44–48 px |
| Sidebar | 240–252 px | 252–260 px | drawer/bottom navigation |
| Page title | 24–28 px | 28 px | 24–28 px |

### 7.2 Default profile

- Desktop mouse/keyboard: `compact`.
- Dashboard executive: `standard`.
- Tablet/workstation touch: `comfortable`.
- Hybrid device: user dapat memilih compact atau comfortable.
- Preferensi density disimpan per user.
- Density tidak boleh dicampur secara acak dalam satu page hierarchy.

### 7.3 Contoh token awal

```css
[data-density="compact"] {
  --page-px: 24px;
  --page-py: 24px;
  --section-gap: 20px;
  --card-gap: 16px;
  --card-px: 18px;
  --card-py: 16px;
  --card-radius: 10px;
  --table-row-h: 38px;
  --table-header-h: 38px;
  --table-cell-px: 14px;
  --control-height: 36px;
  --sidebar-width: 248px;
}

[data-density="standard"] {
  --page-px: 32px;
  --page-py: 28px;
  --section-gap: 28px;
  --card-gap: 20px;
  --card-px: 24px;
  --card-py: 20px;
  --card-radius: 16px;
  --table-row-h: 44px;
  --table-header-h: 42px;
  --table-cell-px: 18px;
  --control-height: 40px;
  --sidebar-width: 256px;
}

[data-density="comfortable"] {
  --page-px: 24px;
  --page-py: 24px;
  --section-gap: 24px;
  --card-gap: 20px;
  --card-px: 24px;
  --card-py: 22px;
  --card-radius: 16px;
  --table-row-h: 54px;
  --table-header-h: 48px;
  --table-cell-px: 20px;
  --control-height: 48px;
}
```

Nilai final ditentukan setelah visual prototype dan usability test.

---

## 8. Typography System

### 8.1 Font family

Inter dipertahankan pada tahap pertama. Pergantian keluarga font hanya dilakukan setelah typography reset diuji. Kandidat A/B jika masih ada keluhan:

- Plus Jakarta Sans;
- Geist Sans.

### 8.2 Type scale

| Penggunaan | Ukuran | Weight | Casing |
|---|---:|---:|---|
| Page title | 24–28 px | 700 | Title case |
| Section title | 14–16 px | 600–700 | Title case |
| Card title | 13–14 px | 600 | Title case |
| Body | 13–14 px | 400–500 | Sentence case |
| Table content | 12.5–13.5 px | 400–500 | Sesuai data |
| Table header | 11–12 px | 600 | Title case |
| Field label | 12–13 px | 500–600 | Sentence case |
| Metadata | 11–12 px | 400–500 | Sentence case |
| KPI utama | 26–32 px | 700 | Tabular numbers |
| Status badge | 10–11 px | 600 | Uppercase diperbolehkan |
| Kode dokumen | 12–13 px | 500–600 | Uppercase/monospace opsional |

### 8.3 Rules

- Weight 900 bukan default untuk content.
- Maksimal 3–4 weight level dalam satu halaman.
- Uppercase hanya untuk status, kode, badge, dan micro-label yang sangat pendek.
- Nama barang, customer, supplier, menu, dan kalimat menggunakan title/sentence case.
- Body text tidak boleh lebih kecil dari 12 px.
- Line-height content sekitar 1.4–1.5.
- Text muted harus tetap memenuhi kontras minimum.
- Nominal, kuantitas, persentase, dan kode penting menggunakan tabular numbers.

---

## 9. Page Archetypes

Satu layout global tidak boleh dipaksakan untuk seluruh ERP.

### 9.1 Executive dashboard

Tujuan: keputusan dan exception.

- Boleh memakai card dan chart.
- Prioritaskan blocked, overdue, trend, target, dan anomaly.
- Maksimal 4–6 KPI utama di above-the-fold.
- Semua KPI harus dapat drill down ke transaksi.
- Insight harus actionable, bukan dekoratif.

### 9.2 Operational dashboard

Tujuan: melihat queue dan next action.

- Lebih padat daripada executive dashboard.
- Gunakan summary strip dan work queue.
- Status owner, SLA, due date, dan next action terlihat.
- Hindari card besar untuk angka pasif.

### 9.3 Registry/master data

Tujuan: menemukan dan mengelola banyak record.

- Table-first.
- Header + toolbar + summary strip maksimal sekitar 180–220 px sebelum data.
- KPI besar tidak ditempatkan sebelum tabel.
- Search, filter, column visibility, import/export, dan create mudah ditemukan.
- Detail dibuka melalui drawer atau detail page.

### 9.4 Transaction/document

Tujuan: membuat dan memproses dokumen bisnis.

- Document identity, status, owner, tanggal, nomor, dan amount selalu jelas.
- Item lines menggunakan grid/table.
- Primary action sticky dan sesuai state.
- Submit, approve, post, cancel, dan delete dibedakan secara visual dan semantik.
- Consequence ditampilkan sebelum irreversible action.

### 9.5 Approval queue

Tujuan: mengambil keputusan cepat dan aman.

- Queue-first dengan default sort berdasarkan risiko/SLA.
- Nominal, requester, due date, exception, attachment, dan impact terlihat.
- Bulk approval hanya untuk kasus yang business rule-nya aman.
- Reject wajib memiliki reason jika diperlukan proses.

### 9.6 Form/master configuration

- Field dikelompokkan berdasarkan makna bisnis.
- Label selalu terlihat.
- Required state jelas.
- Maksimal sekitar 5–7 field per logical group sebelum sub-section.
- Calculated field transparan.
- Draft dipertahankan jika workflow membutuhkan.
- Error berada di dekat field.

### 9.7 Workstation produksi/QC/warehouse

- Comfortable touch density.
- Target sentuh minimal 44 × 44 px.
- High contrast untuk state kritis.
- Input jumlah dapat memakai numpad khusus.
- Kamera/barcode/QR diprioritaskan jika relevan.
- Proses harus tetap aman terhadap double submit dan retry.

---

## 10. Navigation & Information Architecture

### 10.1 Desktop

- Sidebar tetap digunakan.
- Lebar target sekitar 248 px.
- Group mengikuti domain bisnis, bukan istilah teknologi.
- Active state kuat tetapi tidak terlalu besar.
- Menu item target sekitar 36–40 px pada compact mode.
- Badge count hanya ditampilkan jika actionable.
- Global search tetap tersedia.
- Breadcrumb digunakan pada flow yang dalam.

### 10.2 Mobile

- Sidebar berubah menjadi drawer atau bottom navigation.
- Bottom navigation maksimal lima destination utama.
- Menu lain berada di `Lainnya`.
- Navigasi back harus predictable.
- Deep link ke dokumen/status wajib bekerja.

### 10.3 Terminology

- Bahasa utama operasional: Indonesia.
- Istilah industri yang sudah umum boleh tetap English.
- Label tombol menggunakan kata kerja yang jelas.
- Hindari istilah dekoratif dan metafora teknologi.
- Satu objek harus memiliki nama yang sama di sidebar, page title, form, tabel, dan notifikasi.

---

## 11. Data Table V2

### 11.1 Library strategy

Rekomendasi:

- visual primitives: Tailwind + shadcn/ui + Aureon components;
- table state/behavior: `@tanstack/react-table`;
- server data/cache: TanStack Query yang sudah digunakan;
- virtualization: TanStack Virtual hanya jika volume memerlukan;
- AG Grid dievaluasi hanya untuk use case seperti spreadsheet/pivot/inline mass editing yang benar-benar kompleks;
- MUI Data Grid tidak menjadi pilihan awal agar tidak menambah bahasa desain baru.

### 11.2 Capability minimum

DataTable V2 harus mendukung:

- sorting;
- global search;
- column filter;
- saved filters/views;
- column visibility;
- column order;
- optional column pinning;
- row selection;
- safe bulk actions;
- pagination atau server-side pagination;
- sticky header;
- consistent empty/loading/error state;
- export/import entry point jika diizinkan;
- density selector;
- keyboard navigation;
- row action menu;
- count dan selection state;
- preference persistence.

### 11.3 Column priority

Kolom berikut diprioritaskan jika relevan:

1. document/record identity;
2. status;
3. owner/requester;
4. due date/SLA;
5. amount/quantity;
6. next action;
7. exception/risk.

Informasi tambahan dapat masuk ke hidden column, expandable row, atau detail drawer.

### 11.4 Alignment

- Text: kiri.
- Number/currency/quantity: kanan.
- Status: kiri atau center secara konsisten.
- Action: kanan.
- Decimal dan currency menggunakan tabular numbers.
- Header dan row menggunakan height yang konsisten dalam satu density.

### 11.5 Desktop target

Pada viewport 1440 × 900 px, halaman registry idealnya:

- data dimulai tidak lebih rendah dari sekitar 220 px;
- menampilkan sekitar 14–18 row compact, tergantung toolbar dan pagination;
- tidak mengurangi font content di bawah 12 px;
- mempertahankan focus, hover, selected, error, dan disabled state yang jelas.

---

## 12. Card & Dashboard Rules

- Card digunakan jika informasi memang merupakan satu unit konseptual.
- Tabel tidak perlu selalu dibungkus card besar.
- Master/list page menggunakan summary strip, bukan empat KPI card besar.
- Radius default operational 8–12 px.
- Hover lift hanya untuk card yang benar-benar clickable.
- Insight callout harus menjawab `apa yang terjadi` dan `apa tindakan berikutnya`.
- KPI yang tidak dapat ditindaklanjuti atau di-drilldown harus dievaluasi manfaatnya.
- Warna status tidak digunakan sebagai dekorasi.

---

## 13. Forms & Transaction UX

- Gunakan visible label, bukan placeholder-only.
- Compact desktop input 32–36 px; standard 40 px; touch 44–48 px.
- Required indicator konsisten.
- Inline validation tidak mengganggu saat user masih mengetik.
- Error summary boleh tersedia, tetapi error tetap ditampilkan dekat field.
- Primary action sticky jika form panjang.
- Auto-calculation dijelaskan dan dapat ditelusuri.
- Item table mendukung keyboard flow.
- Draft dan unsaved change warning disesuaikan workflow.
- Upload memperlihatkan progress, success, failure, dan retry.
- Approval/reversal/cancel harus memperlihatkan consequence.

---

## 14. Motion & Feedback

- Micro-interaction 150–200 ms.
- Dialog/drawer sekitar 200–300 ms.
- Tidak ada row stagger pada tabel besar.
- Tidak ada card lift jika bukan clickable.
- Loading tidak boleh menggeser layout.
- Skeleton mengikuti ukuran final content.
- Respect `prefers-reduced-motion`.
- Toast digunakan untuk feedback singkat; error penting tidak hanya mengandalkan toast.
- Pulse hanya digunakan untuk live/critical state yang benar-benar berubah.

---

## 15. Mobile & PWA Strategy

### 15.1 Keputusan platform

Tahap pertama menggunakan responsive PWA dalam codebase Next.js yang sama. Native React Native/Flutter tidak menjadi target awal.

Alasan:

- satu codebase;
- deployment lebih cepat;
- dapat dipasang ke home screen;
- mendukung standalone experience;
- dapat dikembangkan menuju push notification;
- cukup untuk monitoring dan action ringan.

### 15.2 Mobile scope prioritas

- executive/operational summary;
- notification dan overdue;
- approve/reject;
- status PO, produksi, QC, warehouse, dan delivery;
- search barang dan stock check;
- update progress sederhana;
- upload foto/dokumen;
- QR/barcode scanning jika dibutuhkan;
- komentar, assignment, dan follow-up;
- detail transaksi read-only atau light edit.

### 15.3 Bukan prioritas awal di mobile

- jurnal kompleks;
- reconciliation;
- formula builder besar;
- mass editing banyak kolom;
- laporan keuangan lebar;
- configuration/master data kompleks.

### 15.4 Responsive data rendering

Desktop dan mobile memakai data/query/table state yang sama, tetapi renderer berbeda:

- desktop: dense semantic table;
- tablet: adaptive table atau comfortable list;
- mobile: compact record list/card;
- tap membuka detail page atau bottom sheet;
- hanya 3–5 informasi paling penting terlihat langsung;
- filter menjadi drawer;
- action utama mudah dijangkau ibu jari;
- horizontal table hanya menjadi pengecualian untuk data yang memang harus dibandingkan kolomnya.

### 15.5 Offline policy

PWA tahap awal bersifat **online-first**.

- Tidak ada offline mutation untuk stok, posting, payment, atau approval sebelum reconciliation/idempotency dirancang.
- Offline draft boleh dievaluasi untuk form tertentu.
- Cached read-only data boleh dipertimbangkan sesuai sensitivity.
- Service worker tidak boleh menyajikan data transaksional basi tanpa indikator.

---

## 16. Prototype and Deployment Strategy

### 16.1 Baseline preservation

Sebelum perubahan V2:

1. buat tag baseline yang jelas dari `prototype-demo`;
2. simpan screenshot golden desktop dan mobile;
3. salin/arsipkan Visual DNA V1 sebagai dokumen historis;
4. pastikan `demo.nexerp.id` tetap dapat diakses selama evaluasi;
5. hanya izinkan critical bug fix pada baseline.

### 16.2 V2 branch

Branch eksperimen dibuat dari baseline:

```text
prototype-demo
└── codex/ui-ux-v2-prototype
```

Perubahan business logic tidak dicampur dengan eksperimen visual kecuali diperlukan dan didokumentasikan.

### 16.3 Long-term deployment

Setelah pola stabil, pertimbangkan satu commit/codebase dengan environment variant:

```env
NEXT_PUBLIC_UI_VARIANT=v1
```

atau:

```env
NEXT_PUBLIC_UI_VARIANT=v2
```

Ini mencegah business logic dua deployment semakin berbeda. Branch terpisah digunakan selama eksplorasi; environment variant menjadi sasaran setelah arsitektur komponen V2 stabil.

### 16.4 Dataset

Perbandingan V1 dan V2 harus memakai:

- dataset prototype yang sama;
- role yang sama;
- permission yang sama;
- viewport yang sama;
- skenario tugas yang sama;
- terminology mapping yang terdokumentasi.

---

## 17. Pilot Pages

### 17.1 Pilot 1 — Master Barang

Menguji:

- registry/table-first layout;
- compact density;
- typography reset;
- terminology Indonesia;
- toolbar;
- filter dan column visibility;
- detail drawer;
- desktop/mobile renderer.

Target struktur:

```text
Barang                                             [+ Buat Barang]
Kelola daftar barang, kategori, stok, dan satuan

[Cari barang...] [Kategori] [Status stok] [Filter] [Kolom] [Density]
2.482 barang • 17 stok kritis • Sinkron terakhir 2 menit lalu

| Kode | Nama Barang | Kategori | Stok | Satuan | Status | ... |
```

### 17.2 Pilot 2 — Purchase Order

Menguji:

- document lifecycle;
- transaction header;
- item lines;
- approval state;
- amount dan supplier visibility;
- validation dan consequence;
- mobile approval/detail.

### 17.3 Pilot 3 — Executive Dashboard

Menguji:

- Standard Dashboard density;
- card simplification;
- exception-first hierarchy;
- actionable KPI;
- drilldown;
- mobile summary.

### 17.4 Rollout gate

Tidak ada migrasi massal ke halaman lain sebelum ketiga pilot:

- lolos functional regression;
- lolos visual QA;
- lolos responsive QA;
- diuji oleh pengguna target;
- memiliki pola reusable;
- disetujui sebagai Visual DNA V2.

---

## 18. Implementation Phases

### Phase 0 — Freeze & documentation

- Freeze baseline V1.
- Tag commit baseline.
- Dokumentasikan screenshot golden.
- Dokumentasikan conflict source of truth.
- Konfirmasi deployment owner.
- Selaraskan deployment `demo.nexerp.id` dengan branch `prototype-demo`.
- Verifikasi badge Prototype Mode dan kredensial demo sebelum menjadikannya baseline resmi.

### Phase 1 — Foundation

- Tambah density provider dan token V2.
- Perbaiki sidebar width dan layout offset.
- Typography reset.
- Standardisasi button/input/badge.
- Tambah page archetype shells.
- Pertahankan feature flag/variant boundary.

### Phase 2 — DataTable V2

- Tambah `@tanstack/react-table`.
- Buat column definition pattern.
- Toolbar, filters, visibility, selection, pagination, density.
- Saved view persistence.
- Sticky header dan optional pinning.
- Server-side mode contract.
- Loading/empty/error state.

### Phase 3 — Master Barang pilot

- Implement desktop compact.
- Implement tablet/mobile renderer.
- Detail drawer.
- Uji data panjang, nominal, status, empty/error/loading.
- Bandingkan V1, V2, dan legacy reference.

### Phase 4 — Purchase Order pilot

- Implement transaction/document shell.
- Item grid dan keyboard workflow.
- Approval consequence dan audit visibility.
- Mobile approval flow.

### Phase 5 — Executive Dashboard pilot

- Kurangi decorative card.
- Prioritaskan exception dan decision.
- Pastikan semua KPI drillable.
- Responsive summary.

### Phase 6 — Usability & iteration

- Uji dengan 3–5 pengguna per role prioritas jika memungkinkan.
- Rekam waktu, error, pertanyaan, dan preference.
- Perbaiki terminology dan hierarchy.
- Finalisasi Visual DNA V2.

### Phase 7 — Controlled rollout

- Migrasi per archetype, bukan per divisi secara acak.
- Prioritas registry/list, approval, transaction, dashboard, workstation.
- Regression test setiap module.
- Sediakan rollback ke V1 selama masa transisi.

---

## 19. Usability Test Plan

### 19.1 Pertanyaan yang tidak cukup

Jangan hanya bertanya: `Mana yang lebih bagus?`

Pertanyaan tersebut cenderung mengukur selera visual, bukan efisiensi.

### 19.2 Skenario contoh Barang

1. Cari barang tertentu.
2. Lihat total stock dan gudang.
3. Periksa apakah stock berada di bawah minimum.
4. Ubah minimum stock.
5. Simpan.
6. Kembali ke hasil pencarian.

### 19.3 Skenario contoh PO

1. Cari PO yang menunggu approval.
2. Periksa supplier, amount, item, attachment, dan exception.
3. Approve atau reject dengan alasan.
4. Verifikasi perubahan status dan audit trail.

### 19.4 Metrik

- task completion rate;
- time on task;
- wrong click;
- backtracking;
- jumlah pertanyaan;
- feature discovery;
- error recovery;
- System Usability Scale atau skor sederhana;
- visual comfort setelah penggunaan berulang;
- preference dan alasan.

### 19.5 Target awal

- Pengguna lama dapat menyelesaikan tugas inti tanpa pelatihan formal.
- Waktu penyelesaian V2 tidak lebih lambat dari legacy untuk tugas yang sama.
- Fitur baru dapat ditemukan dengan bantuan kontekstual minimal.
- Wrong click dan backtracking menurun dibanding V1.
- Tidak ada penurunan business correctness.

---

## 20. Accessibility & Responsive Acceptance

- Kontras text minimum WCAG AA.
- Body/content tidak di bawah 12 px.
- Visible keyboard focus.
- Tabel dapat digunakan dengan keyboard.
- Icon-only action memiliki accessible name/tooltip.
- Touch target mobile minimal 44 × 44 px.
- Tidak mengandalkan hover sebagai satu-satunya interaksi.
- Tidak mengandalkan warna sebagai satu-satunya status.
- Mendukung reduced motion.
- Diuji pada 375, 768, 1024, 1280, dan 1440 px.
- Zoom browser tidak dinonaktifkan.
- Tidak ada horizontal page scroll yang tidak disengaja.
- Complex table memiliki deliberate responsive behavior.

---

## 21. Performance Expectations

- Tidak ada layout shift signifikan saat data dimuat.
- Table state tidak menyebabkan full-page rerender yang tidak perlu.
- Pagination/filter/sort server-side tersedia untuk dataset besar.
- Virtualization hanya digunakan ketika memang dibutuhkan.
- Row animation tidak digunakan pada volume besar.
- Column widths stabil selama loading.
- Mobile payload dan chart bundle dievaluasi terpisah.
- Prototype diuji dengan dataset realistis, bukan hanya lima row.

---

## 22. Business Safety Rules

UI V2 tidak boleh secara diam-diam mengubah:

- status lifecycle;
- approval matrix;
- permission dan scope;
- document numbering;
- accounting posting;
- stock ledger impact;
- tax calculation;
- audit trail;
- attachment requirement;
- irreversible action consequence;
- integration ownership.

Jika perubahan UI menemukan business rule yang tidak jelas, rule tersebut ditandai **UNCONFIRMED** dan tidak diasumsikan.

---

## 23. Definition of Done per Page

Sebuah halaman V2 dinyatakan selesai jika:

### Business

- lifecycle dan permission sesuai;
- status dan next action jelas;
- exception path tersedia;
- audit trail tidak hilang;
- angka dan state berasal dari source yang benar.

### UX

- page archetype sesuai;
- tugas utama dapat ditemukan;
- table/form density sesuai konteks;
- terminology konsisten;
- error dapat dipulihkan;
- empty/loading/error states lengkap.

### Visual

- typography mengikuti scale;
- spacing mengikuti density token;
- radius dan card usage sesuai archetype;
- tidak ada raw one-off styling tanpa alasan;
- desktop dan mobile memiliki hierarchy yang jelas.

### Accessibility

- keyboard/focus lulus;
- contrast lulus;
- accessible name tersedia;
- touch target mobile lulus;
- reduced motion didukung.

### Engineering

- reusable component digunakan;
- type check, lint, unit/component test lulus;
- responsive E2E/screenshot tersedia;
- tidak ada regression route/permission;
- performance tetap proporsional terhadap dataset.

---

## 24. Risks & Mitigation

| Risiko | Dampak | Mitigasi |
|---|---|---|
| V1 dan V2 berbeda business logic | Perbandingan tidak valid | Dataset dan API contract sama; UI branch fokus visual/interaction |
| Dua branch drift terlalu lama | Bug fix sulit disinkronkan | Setelah foundation stabil, pindah ke environment UI variant |
| Compact berubah menjadi terlalu kecil | Readability turun | Minimum font dan density acceptance ditetapkan |
| Mobile mencoba menampung semua fungsi desktop | UX gagal | Mobile scope dibatasi berdasarkan pekerjaan |
| Library tabel terlalu kompleks | Delivery melambat | Mulai TanStack headless; evaluasi AG Grid hanya dengan use case nyata |
| Terminology baru membingungkan | Learning curve tinggi | Mapping istilah dan usability test |
| Perubahan visual mengubah business behavior | Risiko operasional | Business safety gate dan regression test |
| KPI/card tetap mendominasi registry | Data sulit terlihat | Registry wajib table-first dan summary strip |
| Visual DNA lama tetap dipakai tim | Inconsistency | Tetapkan source of truth dan deprecate V1 untuk implementasi baru |

---

## 25. Deliverables

### Dokumentasi

- Master plan ini.
- Visual DNA V1 baseline archive.
- Visual DNA V2 final.
- Terminology mapping.
- Page archetype specification.
- DataTable V2 contract.
- Responsive/mobile guideline.
- Usability test report.

### Engineering

- Density provider/tokens.
- Typography reset.
- Page shells.
- DataTable V2.
- Responsive record list.
- Pilot Barang.
- Pilot Purchase Order.
- Pilot Executive Dashboard.
- V1/V2 deployment configuration.

### QA

- Golden screenshots.
- Cross-viewport tests.
- Keyboard/accessibility checks.
- Functional regression.
- Performance test dengan data realistis.
- User test results.

---

## 26. External Reference Direction

Referensi implementasi dan pattern yang dipakai sebagai pembanding:

- SAP Fiori Content Density: <https://experience.sap.com/fiori-design-web/cozy-compact/>
- Carbon Data Table: <https://carbondesignsystem.com/components/data-table/usage/>
- PatternFly Table: <https://www.patternfly.org/components/table/design-guidelines/>
- MUI Data Grid Density: <https://mui.com/x/react-data-grid/accessibility/>
- Odoo List View: <https://www.odoo.com/documentation/19.0/applications/studio/views.html>
- TanStack Table: <https://tanstack.com/table/latest>
- shadcn Data Table: <https://ui.shadcn.com/docs/components/base/data-table>
- AG Grid Compactness: <https://www.ag-grid.com/react-data-grid/theming-compactness/>
- Next.js PWA Guide: <https://nextjs.org/docs/app/guides/progressive-web-apps>
- MDN PWA Best Practices: <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices>

Referensi tersebut bukan template visual yang harus disalin. Yang diambil adalah prinsip density, data interaction, responsive behavior, dan accessibility.

---

## 27. Open Decisions

Hal-hal yang perlu dikonfirmasi sebelum implementasi penuh:

1. Siapa pemilik deployment dan DNS.
2. Role pengguna pertama untuk usability test.
3. Dataset prototype yang dianggap representatif.
4. Apakah Bahasa Indonesia menjadi default seluruh modul.
5. Apakah density preference disimpan per user atau per device.
6. Apakah mobile tahap pertama hanya read/approve atau termasuk input operasional.
7. Use case yang mungkin membutuhkan AG Grid.
8. Kebijakan PWA notification.
9. Durasi V1 dan V2 berjalan paralel.

---

## 28. Recommended Immediate Next Step

Urutan kerja berikutnya yang direkomendasikan:

1. Setujui atau revisi dokumen master ini.
2. Freeze dan tag baseline V1.
3. Buat branch `codex/ui-ux-v2-prototype`.
4. Buat Visual DNA V2 dari bagian 5–15 dokumen ini.
5. Implement density provider dan typography reset.
6. Bangun DataTable V2.
7. Implement Master Barang desktop + mobile sebagai design spike.
8. Deploy ke subdomain V2.
9. Lakukan side-by-side review dan usability test.
10. Baru putuskan rollout selanjutnya.

---

## 29. Final Product Expectation

Hasil akhir yang diharapkan adalah ERP yang:

- tetap terasa modern dan memiliki identitas Aureon;
- tidak membuat pengguna lama merasa belajar ERP dari nol;
- menampilkan banyak data tanpa mengecilkan keterbacaan;
- lebih cepat untuk pekerjaan berulang;
- memberikan fitur enterprise seperti saved view, bulk action, audit, dan next action;
- nyaman dipakai berjam-jam di desktop;
- dapat digunakan secara sengaja dan aman di mobile;
- konsisten antara desain, business workflow, permission, dan traceability;
- dapat diuji secara objektif terhadap baseline V1 dan legacy ERP.

**Prinsip penutup:** modernisasi capability dan clarity, pertahankan familiarity, kurangi dekorasi yang tidak membantu pekerjaan.

---

## 30. Compact Prototype Execution Plan

### 30.1 Jumlah fase

Prototype pembanding yang polished membutuhkan **8 fase (Phase 0–7)**. Fase ini menghasilkan prototype representatif, bukan langsung memigrasikan seluruh 168 halaman.

Tiga milestone utama:

- **Milestone A — Visual Direction Review:** selesai setelah Phase 2.
- **Milestone B — Comparison Ready:** selesai setelah Phase 4.
- **Milestone C — Polished Compact Prototype:** selesai setelah Phase 7.

### 30.2 Fase dan output

| Fase | Fokus | Output utama | Quality gate |
|---|---|---|---|
| 0 | Baseline integrity | V1 dibekukan, tag dan golden screenshots, deployment `demo.nexerp.id` sesuai `prototype-demo` | Login demo berhasil, badge prototype terlihat, halaman pembanding konsisten |
| 1 | Branch & compact environment | Branch V2, deployment skeleton, DNS/SSL/reverse proxy `compact.nexerp.id` | Kedua subdomain hidup secara independen dan memakai dataset/role setara |
| 2 | Visual foundation | Density tokens, typography reset, sidebar/header, page shells, terminology foundation | Review desktop 1440/1280 dan mobile 375; tidak ada business flow berubah |
| 3 | Data interaction foundation | DataTable V2 berbasis TanStack, filter, sort, visibility, selection, pagination, density | Keyboard, loading/empty/error, data panjang, dan dataset realistis lulus |
| 4 | Three pilot pages | Master Barang, Purchase Order, Executive Dashboard | V1 vs Compact dapat dibandingkan end-to-end pada tugas nyata |
| 5 | Responsive & PWA | Mobile renderer, navigation, bottom sheet/detail, manifest PWA, installability | 375/768/1024 lulus; touch target dan deep link lulus |
| 6 | Usability iteration | Pengujian pengguna, terminology revision, hierarchy dan density tuning | Task completion dan learnability memenuhi target awal |
| 7 | Polish, QA & release | Visual consistency, accessibility, regression, performance, golden screenshots, deployment final | Tidak ada critical gate gagal; `compact.nexerp.id` siap dipresentasikan |

### 30.3 Relative effort

Estimasi berikut adalah ukuran pekerjaan relatif, bukan janji tanggal kalender:

| Fase | Bobot usaha |
|---|---:|
| Phase 0 | 5% |
| Phase 1 | 8% |
| Phase 2 | 20% |
| Phase 3 | 22% |
| Phase 4 | 25% |
| Phase 5 | 10% |
| Phase 6 | 5% |
| Phase 7 | 5% |

Pekerjaan terbesar adalah foundation, DataTable V2, dan tiga pilot page. Jika tiga bagian tersebut benar, halaman lain dapat dimigrasikan lebih cepat melalui archetype dan reusable components.

### 30.4 Review checkpoints

#### Checkpoint 1 — Foundation preview

Setelah Phase 2, review mencakup:

- sidebar compact;
- header dan page spacing;
- Inter typography reset;
- button/input/badge;
- desktop dan mobile shell;
- perbandingan density V1/V2.

Pada tahap ini belum semua tabel memiliki fitur final.

#### Checkpoint 2 — Functional comparison

Setelah Phase 4, pengguna dapat membandingkan:

- mencari dan memeriksa Barang;
- membuka detail dan melakukan light edit pada prototype;
- melihat/memproses alur Purchase Order;
- membaca Executive Dashboard;
- membandingkan jumlah data yang terlihat, kecepatan menemukan tindakan, dan kenyamanan typography.

Ini adalah titik paling awal untuk keputusan desain yang bermakna.

#### Checkpoint 3 — Polished comparison

Setelah Phase 7:

- `demo.nexerp.id` menjadi baseline V1;
- `compact.nexerp.id` menjadi prototype V2;
- dataset, role, dan task script disamakan;
- desktop, tablet, dan mobile sudah diuji;
- hasil usability dan known limitations didokumentasikan.

### 30.5 Scope prototype vs full migration

**Scope prototype polished:**

- global shell V2;
- Visual DNA V2 foundation;
- DataTable V2;
- Master Barang;
- Purchase Order;
- Executive Dashboard;
- mobile patterns untuk ketiga pilot;
- deployment dan QA pembanding.

**Di luar scope prototype awal:**

- migrasi seluruh 168 halaman;
- perubahan business rule;
- redesign semua laporan finance;
- offline transactional mutation;
- native mobile application;
- AG Grid enterprise adoption;
- penghapusan V1.

### 30.6 Post-prototype decision

Setelah side-by-side test, keputusan dapat berupa:

1. terima V2 dan lanjut rollout per archetype;
2. terima dengan revisi density/typography/terminology;
3. pertahankan sebagian V1 untuk archetype tertentu;
4. hentikan rollout jika tidak menghasilkan improvement terukur.

Rollout seluruh ERP akan direncanakan sebagai program terpisah setelah prototype V2 disetujui.

### 30.7 Phase 0 verification result — completed 17 August 2026

Phase 0 is complete. The baseline is tagged as `ui-v1-baseline-2026-08-17` at commit `0f4986550ee06c9719719fdb9ae78f4d4e3811e6`. The active Cloudflare record for `demo.nexerp.id` targets Biznet, so the isolated `prototype-frontend` deployment was aligned there; the old Hetzner path was retained only as a recoverable backup.

Live verification now passes:

- `https://demo.nexerp.id/login` returns 200 and displays the Prototype Mode disclosure;
- `superadmin@nexerp.id` / `password123` reaches `/executive/dashboard`;
- the dashboard badge `⚡ PROTOTYPE MODE — DATA CONTOH` is visible;
- the post-login browser console has zero errors;
- golden screenshots are stored in `docs/design/baseline-v1/screenshots/`.

The evidence index and rollback references are documented in `docs/design/baseline-v1/README.md`. The baseline is now safe for A/B comparison; V2 work should start from a separate branch and evidence directory.

### 30.8 Phase 1 verification result — completed 17 August 2026

Phase 1 is complete on branch `codex/ui-ux-v2-prototype`. The compact environment is live at `https://compact.nexerp.id` with a dedicated `compact-frontend` container, separate nginx virtual host, Cloudflare DNS record, and Let’s Encrypt certificate. It uses the same frontend mock dataset and role set as V1 so comparisons are not confounded by data or access differences.

Both subdomains were verified independently with the documented demo credentials. Each reaches `/executive/dashboard`, displays the Prototype Mode badge, and reports zero post-login browser console errors. Phase 1 evidence is stored in `docs/design/phase1-compact/`.

Phase 2 is the first phase allowed to alter the compact visual system. `demo.nexerp.id`, the V1 tag, and `docs/design/baseline-v1/` remain unchanged comparison references.

### 30.9 Phase 2 verification result — completed 17 August 2026

Phase 2 establishes the compact visual foundation on `codex/ui-ux-v2-prototype`. Centralized tokens now reduce the shell and card/table chrome while preserving the existing Visual DNA. Typography was limited to the intended Inter weights, mobile zoom is no longer disabled, and shell controls have accessible labels and minimum touch targets. Responsive rules cover desktop, tablet, and the 375px mobile viewport; mobile navigation remains a Phase 5 deliverable.

The implementation is documented in `docs/design/phase2-foundation/README.md`. No business flow, API contract, role, dataset, or V1 deployment was changed.

### 30.10 Phase 3 implementation — DataTable V2 pilot

Phase 3 applies the compact table foundation to Master Goods at `/master/goods`. The reusable `DataTableV2` component provides compact rows, sticky headers, contained horizontal overflow, a keyboard-focusable scroll region, and record context without changing the underlying API or row detail flow. Evidence and acceptance notes are tracked in `docs/design/phase3-datatable/README.md`.
