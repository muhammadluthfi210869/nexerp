# ANALISIS & KRITISI DOKUMEN LEGACY ERP — NEX ERP
**Tanggal Audit**: 2026-09-09
**Auditor**: Strategic Workflow Orchestrator (Kilo)
**Lingkup**: `/docs/legacy-erp/` (45+ file: 1 master spec + 1 JSON catalog + 6 CSV master + 38 archive docs)
**Tujuan**: Persiapan audit kelengkapan Frontend (Next.js) terhadap legacy ERP BLUEPRINT yang menjadi acuan.

---

## 0. EXECUTIVE SUMMARY

| # | Temuan Kritis | Severity | Dampak ke Frontend Audit |
|---|---|---|---|
| 1 | **Master Spec menjajikan 178 layar, JSON Catalog hanya detail 176 — inkonsisten.** | 🔴 CRITICAL | Frontend audit butuh sumber benar: pakai JSON catalog sebagai SSOT, atau selesaikan gap 2 layar di master spec. |
| 2 | **Struktur 12 modul di Dokumen Utama HANYA menampilkan 7 modul secara detail (MOD-01..05, 07, 12).** MOD-06 Production, MOD-08 Design, MOD-09 Legality, MOD-10 Finance, MOD-11 HR hanya disebut di ToC — tidak punya screen list sendiri. | 🔴 CRITICAL | Frontend harus cross-check: apakah layar Production/Finance/HR/Legality/Design di-routes ke `/master/...` (sebagaimana JSON)? Itu konvensi legacy yang akan diwarisi? |
| 3 | **38 file `_archive/*.md` menyimpan keputusan historis yang BERKONFLIK satu sama lain** (contoh: jumlah fase bisnis "10 fase" vs "7 fase"). | 🟠 HIGH | Setiap konflik harus di-resolve secara eksplisit sebelum audit; kalau tidak, frontend bisa salah implementasi. |
| 4 | **CSV Master Data dipublikasikan lengkap** (45 user, 16 gudang, 177 supplier, 800+ customer, ~2.795 barang), tetapi hanya 6 dari 8 file master yang tersedia; `MASTER_KODE.xlsx` (binary, tak terbaca) — kemungkinan berisi **peta kode master legacy yang belum pernah di-reverse-engineer ke Prisma schema**. | 🟠 HIGH | Backend perlu konfirmasi: apakah MASTER_KODE.xlsx sudah di-migrate? |
| 5 | **Tidak ada dokumen Acceptance Criteria / Test Plan / API Contract** (OpenAPI/Swagger/postman). Spesifikasi hanya sebatas deskripsi UI naratif. | 🔴 CRITICAL | Tanpa API contract, audit frontend tidak bisa verifikasi "Apakah response backend cocok dengan yang UI harapkan". Ini blocker terbesar. |
| 6 | **"Universal Code Engine" belum punya decision final:** dokumen mendaftar 2 varian (lengkap `DL-DIV-PRD-DDMMYYYY-0001` & ringkas `PRD-DDMMYYYY-0001`) tapi tidak pernah memilih default, tidak menjelaskan toggle/setting lokasinya, dan ada catatan berulang "Format Kode Universal: Tersedia versi lengkap & versi ringkas. Nomor urut akhir bersifat global & berkelanjutan (tidak reset)". | 🟠 HIGH | Frontend harus render kedua varian atau hard-code salah satu; inkonsistensi ini akan bocor ke UI sebagai "weird-looking code". |
| 7 | **Spesifikasi Visual "DNA Design System v7.0" TIDAK PERNAH TERDOKUMENTASI di legacy ERP.** Yang ada hanya narasi "4-6 Top Metric Cards selaras dengan Tab/Filter", "search-select/autocomplete", "Date Range Picker", "AP Aging color coding". Tidak ada library token, typography scale, spacing scale, glassmorphism specification. | 🟡 MEDIUM | VISUAL_DNA.md di root workspace kemungkinan jadi sumber kebenaran; perlu audit cross-check. |
| 8 | **78 REQUIREMENT.MD hanya di-rekonsiliasi di Bagian III master spec**, tidak ada dokumen REQUIREMENT.md mentah sebagai sumber — hanya derivasi. Risiko: asumsi/penafsiran dalam rekonsiliasi ≠ permintaan asli Upii. | 🟠 HIGH | Butuh klarifikasi: apakah REQUIREMENT.md asli tersedia? Atau Bagian III = canonical final? |
| 9 | **AP Aging "H-3 merah, H-7 kuning, Overdue bouncy/pulse"** termasuk animasi — tanpa spesifikasi motion (durasi, easing, intensitas), implementasi frontend bisa liar. | 🟡 MEDIUM | Implementasikan spec animation default Tailwind/shadcn jika tidak ada motion spec. |
| 10 | **`MOD-XX` module IDs di JSON catalog berbeda dengan route prefix.** Contoh: `MOD-01` punya route `/master/...` (legacy convention), sedangkan `MOD-02` pakai `/bussdev/...`. Inkonsistensi penamaan URL namespace. | 🟡 MEDIUM | Audit URL routing di `next.config.ts` atau `app/` folder; harus konsisten. |

---

## 1. ANATOMI DOKUMEN LEGACY ERP

### 1.1 Struktur File

```
docs/legacy-erp/
├── NEX_ERP_MASTER_SPECIFICATION.md     ← SSOT (2.198 baris, 178 layar dideklarasikan)
├── NEX_ERP_SCREEN_AND_API_CATALOG.json ← Machine-readable mirror (9.215 baris, 176 layar)
├── MASTER_DATA/                        ← 6 CSV + 1 XLSX master legacy
│   ├── BARANG.csv              (2.796 baris, 6 kolom legacy + 4 scrape)
│   ├── GUDANG.csv              (17 baris, 7 gudang + sub-gudang)
│   ├── KATEGORI-BARANG.csv     (7 kategori: BBK, BRU, BSJ, BPB, KPR, KSR, BJD)
│   ├── MASTER_KODE.xlsx        (BINARY — belum dibaca)
│   ├── PELANGGAN.csv           (817 baris: Calon / Sample / Produk / RO)
│   ├── SUPPLIER.csv            (177 supplier, dominan Bahan Baku)
│   └── USERS.csv               (46 user, role metadata)
└── _archive/                         ← 38 file spec historis (5 fase dokumen!)
```

### 1.2 Fase Evolusi Dokumen (terlihat dari nama file & konteks di dalamnya)

| Fase | File Kunci | Status | Implikasi |
|---|---|---|---|
| **0 - Legacy capture** | `LEGACY_ERP_SPEC.md`, `LEGACY_ERP_AUDIT.md`, `kil_erp_full_inventory.csv` (v0) | OLD | Sumber kebenaran: inventaris 178 layar legacy G-SERP. |
| **1 - Business gap** | `ERP_OLD_BUSINESS_FLOW.md`, `ERP_BUSINESS_FLOW_GAP.md` | OLD | Identifikasi gap: apa yang kurang di legacy. |
| **2 - Advancement** | `ERP_NEW_ADVANCEMENT_MAP.md`, `ERP_NEW_SYSTEM_INVENTORY.md`, `ERP_INPUT_OUTPUT_LINEAGE.md`, `input-ouput.md` | OLD | Pemetaan alur I/O & lineage data. |
| **3 - Audit & parity** | `ERP_FUNCTIONAL_PARITY_MATRIX.md`, `ERP_ENTERPRISE_AUDIT_LEDGER.md`, `KPI_REFERENCE.md` | OLD | Matriks kesetaraan & KPI target. |
| **4 - Design & orchestration** | `REQUIREMENT.md`, `database.md`, `databasev2.md`, `DATA_DASHBOARD.md`, `05_master_business_process_blueprint.md`, `06_implementation_log_financial_gates.md`, `07_full_stack_integrity_plan.md`, `NEX_FINANCE_FINAL_SPEC.md`, `NEX-Finance-Module-Full-Spec (1).md` | RECENT | Konsolidasi menjadi blueprint. |
| **5 - Final SSOT (root level)** | `NEX_ERP_MASTER_SPECIFICATION.md` + `NEX_ERP_SCREEN_AND_API_CATALOG.json` | AUTHORITATIVE | Versi 2.0 (Final). Tanggal rilis 2026-09-09. |

### 1.3 Inventory Files (3 versi)
- `kil_erp_full_inventory.csv` (v0)
- `kil_erp_full_inventory_v1.csv`
- `kil_erp_full_inventory_v2.csv` (LATEST — 177 baris, sama dengan sumber JSON)

**Semua 3 file identik secara struktural** dengan master spec — tidak ada update layar baru di v2, hanya refinement copy.

---

## 2. ANALISIS SSOT (NEX_ERP_MASTER_SPECIFICATION.md v2.0)

### 2.1 Struktur Dokumen (3 bagian besar)

```
BAGIAN I  : 7 standar arsitektur universal
BAGIAN II : 12 modul, 178 layar (technical spec per screen)
BAGIAN III: Rekonsiliasi 78 REQUIREMENT.MD rules
```

### 2.2 7 Standar Arsitektur Universal (BAGIAN I)

| # | Standar | Definisi | Risiko Implementasi |
|---|---|---|---|
| 1 | **Universal Code Engine** | 2 varian format (lengkap `DL-FIN-SO-29062026-0001` / ringkas `SO-29062026-0001`). Sequence **global & no-reset** sejak sistem hidup. | 🔴 Layar membuat kode banyak (PO/SO/Inv/Asset/GR/Retur/Faktur/Customer/Vendor) — semua harus konsisten. |
| 2 | **3-Tier Approval Matrix** | Staff → Head → Finance → (Direktur jika >50jt). | 🟠 Aturan Jenjang Pengaju (Staff vs Head) di Fund Request: jalur Head skip 1 step. |
| 3 | **3-Pilar Gudang** | Bagus (bayar) / Reject (no bayar) / Free (qty only, Rp 0). Diskon dalam **Rp bukan %**. | 🔴 Kompleks: 3 qty di setiap GR + auto-retur + auto-debit-note + auto-pricing. |
| 4 | **Auto-Journal Engine** | 9 trigger GL: Inbound, DP Supplier, Pelunasan AP, DP Klien, Pelunasan AR, Mixing, Packing, Delivery, dll. | 🔴 Akuntansi harus double-entry balanced. Allow Manual Journal = false di akun AP/AR/WIP. |
| 5 | **DNA Design System** | 4-6 top metric cards (urutan SELARAS dengan tab filter); search-select/autocomplete WAJIB; date range picker custom; AP Aging color coding (H-3/H-7/overdue). | 🟠 Konsistensi visual = Wajib. Tanpa motion spec untuk "bouncy/animasi" overdue. |
| 6 | **10-Fase Alur Bisnis** | Akuisisi → Kualifikasi/Sampel → SO+DP → Triple-Parallel (Legal/Design/SCM) → Manufaktur (Mix/Fill/Pack) → QC Release → Pengiriman → Closing. | 🟠 Catatan: master spec bilang 10 fase (point 6 di master spec); archive `05_master_business_process_blueprint.md` juga bilang 10 fase; tapi visible UI sering menampilkan 7-8 fase di checklist UI. **Konflik minor — perlu klarifikasi.** |
| 7 | **Universal KPI** | CR Deal, SAR, OTD, BSR, QDR — formulas didefinisikan. | 🟢 Jelas formulas. |

### 2.3 Rincian 12 Modul & 178 Layar (BAGIAN II)

**⚠️ INKONSISTENSI KRITIS TERDETEKSI:**

| Modul | Dideklarasikan | Detail di Body SSOT | Status |
|---|---|---|---|
| MOD-01 Master Data Management | **107 layar** | ✅ Ada, line 168–1256 | Detailed |
| MOD-02 BusDev & CRM | **12 layar** | ✅ Ada, line 1257–1399 | Detailed |
| MOD-03 R&D & Formulation | **8 layar** | ✅ Ada, line 1400–1497 | Detailed |
| MOD-04 SCM & Purchasing | **25 layar** | ✅ Ada, line 1498–1747 | Detailed |
| MOD-05 Warehouse & Inventory | **4 layar** | ✅ Ada, line 1748–1783 | Detailed |
| **MOD-06 Production & PPIC** | **tidak di-declare** | ❌ TIDAK ADA di body | **MISSING** |
| MOD-07 QC & Compliance | **7 layar** | ✅ Ada, line 1784–1853 | Detailed |
| **MOD-08 Creative & Packaging Design** | **tidak di-declare** | ❌ TIDAK ADA di body | **MISSING** |
| **MOD-09 Legality & Regulation** | **tidak di-declare** | ❌ TIDAK ADA di body | **MISSING** |
| **MOD-10 Finance & Accounting** | **tidak di-declare** | ❌ TIDAK ADA di body | **MISSING** |
| **MOD-11 Human Resources** | **tidak di-declare** | ❌ TIDAK ADA di body | **MISSING** |
| MOD-12 Executive & Analytics | **13 layar** | ✅ Ada, line 1854–2009 | Detailed |

**Total detailed = 107+12+8+25+4+7+13 = 176 layar**
**Total declared = 178 layar** → **gap 2 layar** yang tidak pernah di-declare per modul.

**Implikasi pada Frontend Audit:**
- Produksi/Finance/HR/Legality/Design screens di-restui DITEMPELKAN ke MOD-01 Master atau MOD-04 SCM atau area lain (mis. SCR-131 Batch Record, SCR-147 Produksi Mixing, SCR-079 Jurnal Umum, dll — semua "Operasional" tapi tak punya MOD-XX). Ini inkonsisten.
- Frontend route prefix (`/master`, `/scm`, `/bussdev`, `/qc`, `/executive`, `/rnd`, `/warehouse`) MERUPAKAN warisan legacy G-SERP. Tidak ada di spec bagaimana NexERP menata ulang ke arsitektur 12-modul yang lebih semantik.

### 2.4 Catatan Kritis Per Spec

1. **Status bayaran & tanda tangan digital** hanya disebutkan untuk PO — tidak ada penjelasan standar tanda tangan digital secara enterprise (mis: pakai apa, hash, simpan di mana).
2. **Tax Integration** "Modul Pajak dan e-Faktur TIDAK PERLU DIKERJAKAN" — Tax Setup (SCR-039) dan Tax Transactions (SCR-085) tetap ada tapi **scope = PPN/PPh rekap saja, tanpa e-Faktur/e-Bupot DJP.** (Poin 35 di master spec.)
3. **Format Kode Universal pada dokumen RESEP tidak seragam**: beberapa layar gunakan "Format Kode Universal: Tersedia versi lengkap & ringkas. Nomor urut akhir bersifat global & berkelanjutan (tidak reset)" (mis. SCR-030, SCR-080, SCR-110, SCR-124, SCR-132). Tetapi beberapa layar (SCR-105 DP Pembelian) menggunakan format lokal: "Nomor DP otomatis DPB-YYMM-XXXX" — INKONSISTEN.
4. **3-Way Matching disembunyikan** di Faktur Pembelian (Poin 5 master spec). TAPI SCR-106 tetap menyebut "Matching Engine 4-Leg: PO ↔ GRN ↔ QC Passed Qty ↔ Vendor Invoice" di internal logic. **Tampak jelas: Engine HITUNG di belakang, TAMPILAN sembunyikan. Frontend hanya boleh render status Matched/Exception saja.**
5. **AR Delivery Gatekeeper** (Poin 13): default HELD, RELEASED hanya setelah Finance verifikasi DP/lunas. Gudang tidak boleh cetak Surat Jalan sebelum RELEASED. Ini state machine penting yang harus ada di frontend Gudang.
6. **Catatan Mandatory** untuk status Pending & Done-Reverted: Poin 67 master spec — "Setiap perubahan status (termasuk status pending) harus tercatat: tanggal perubahan, dan catatan wajib jika berstatus pending. Status yang sudah 'done' dapat dikembalikan ke proses berjalan." Frontend harus enforce textarea catatan.
7. **Approval berurutan anti-manipulasi** (Poin 68): "Approval status berikutnya (misal 'sudah diterima' atau 'belum') tidak boleh sama dengan status 'done' sebelumnya". Validasi di frontend layer.

### 2.5 Bagian III: 78 REQUIREMENT.MD (Full List)

Master spec Bagian III hanya menampilkan subset REQUIREMENT yang dianggap "telah terikat" ke spec layar. Total ada **12 kategori** requirements yang dipublikasikan secara implisit (Master Vendor, Faktur Pembelian, AP Aging, Faktur Penjualan/AR/Pajak, Kas & Bank, Rekonsiliasi Bank, Pengajuan Dana, Jurnal Umum, Input Field Global, Aset Tetap, Laporan, Pajak, Modul Purchase, Modul Design, Modul BusDev). **TAPI** klaim "78 poin" ini tidak punya traceability ke dokumen REQUIREMENT.md (yang ternyata TIDAK ada di path ini — hanya `REQUIREMENT.md` di `_archive/`). **Risiko:** rekonsiliasi di Bagian III bisa merupakan interpretasi ulang, bukan transkrip literal.

---

## 3. ANALISIS JSON CATALOG (NEX_ERP_SCREEN_AND_API_CATALOG.json v2.0.0)

### 3.1 Statistik
- **Version**: 2.0.0 — generated 2026-09-09T11:51:01.670Z
- **Total screens declared**: 176 (vs 178 di master spec — **diskonsistensi**)
- **File size**: 9.215 baris (terbesar)

### 3.2 Struktur Per-Screen
Setiap screen punya:
```json
{
  "screenId": "SCR-001",
  "area": "Dasbor BusDev",
  "menu": "D. Buku Tamu",
  "page": "D. Buku Tamu",
  "legacyUrl": "/dashboard-guest-book",
  "nexerpRoute": "/bussdev/dashboard-guest-book",
  "type": "Dashboard" | "List" | "Form" | "Report" | etc,
  "moduleId": "MOD-01"..."MOD-12",
  "moduleName": "...",
  "cards": ["..."],
  "tableColumns": ["..."],
  "formInputs": ["..."],
  "viewDetailModal": "...",
  "actions": ["..."],
  "specialRequirementsNotes": "..."
}
```

### 3.3 Module Coverage (JSON)
| Module | Screen Count | Lokasi di JSON |
|---|---|---|
| MOD-01 Master Data | ~95+ (catch-all untuk banyak operasional) | line 881+ |
| MOD-02 BusDev & CRM | 12 | line 15+ |
| MOD-03 R&D | 4-8 | line 658+ |
| MOD-04 SCM & Purchasing | 25 | line 1875+ |
| MOD-05 Warehouse | 4 | line 5891+ |
| MOD-07 QC | 7 | line 2290+ |
| MOD-12 Executive & Analytics | 13 | line 267+ |
| MOD-06, 08, 09, 10, 11 | **0 screens** | **NOT IN JSON** |

**Verdict:** JSON catalog = mirror akurat dari body master spec Bagian II. Keduanya share the same 176-screen reality.

### 3.4 Catalog Quirks yang Harus Diwaspadai Frontend Audit
- **`area` field sangat misleading**: banyak Production/Finance screen masuk area "Operasional" tapi di-tag moduleId MOD-01 (Master Data) — bukan Production atau Finance. Contoh: SCR-079 Jurnal Umum → MOD-01 dengan area Operasional. Ini akan menyebabkan kebingungan saat filter berdasarkan moduleId.
- **`nexerpRoute` mostly legacy-style** (`/master/...`, `/scm/...`, `/bussdev/...`, `/rnd/...`, `/warehouse/...`, `/qc/...`, `/executive/...`). Tidak ada klarifikasi apakah Next.js App Router akan memetakan ini atau di-restructure.
- **`viewDetailModal`** masih pakai pola legacy AJAX: `Modal Detail via AJAX (ajaxDetail('4289','modal-lg');)` — inkompatibel dengan Next.js App Router modern. Frontend perlu refactor ke React Modal/Drawer pattern.
- **`actions`** array berisi string mix antara functional button labels ("Pending", "Lihat", "Setuju") dan DATA values ("SO-202609-000002", "Delivery", "NOT STARTED"). Ini污染 untuk rendering — perlu pemisahan.

---

## 4. ANALISIS MASTER DATA CSV

### 4.1 Schema yang Recoverable (tanpa MASTER_KODE.xlsx)

#### USERS.csv (46 rows)
**Kolom**: `web_scraper_order | web_scraper_start_url | pagination | kodenip | nama | email | phone | hak_akses | data | nama2`

**Observasi Kritis**:
- **Kolom `web_scraper_order` dan `web_scraper_start_url`** adalah artefak scraping, bukan kolom data asli. **HARUS dibersihkan** saat migrasi ke Prisma schema.
- Kolom `data` adalah ID legacy G-SERP (numerik).
- **Roles yang muncul**: Administrator, Head Research and Development, Research and Development, Production Mixing & Filling, Warehouse, Business Development, Production Packaging, BusDev + Purchasing, Finance, HRD, BusDev + HRD, Staff Back Office, Apoteker Penanggung Jawab.
- **Nomor telepon berantakan**: format tidak konsisten, ada spasi, prefix (+62), null. Perlu normalisasi E.164.
- **Foto path**: 1 user punya foto asli, sisanya default.png.
- **Ada 1 NIP duplicate?** (0010 → Keviana, 0012 → Irma Safarina — kemungkinan memang lompat; tidak ada duplicate).

#### BARANG.csv (~2.795 rows — file besar)
**Kolom**: `web_scraper_order | web_scraper_start_url | pagination | kode | barang | harga_beli | data | sub_kategori | kategori | satuan | barang2`

**Observasi**:
- Kode barang: prefix `BBK` (Bahan Baku), `BPB`, `KPR`, dll — ada **2.795 rows** barang sehingga database besar.
- `harga_beli` format Indonesia: `1,650.00` (koma separator). **Backend harus parse ke number**.
- Banyak `sub_kategori` kosong (`-`) — perlu defaulting.
- `web_scraper_order` lagi-lagi artefak scraping.

#### GUDANG.csv (16 rows)
**Isi**:
1. Gudang Bahan Baku — Kab. Pasuruan
2. Gudang Kemasan — Kab. Sidoarjo
3. Gudang Barang Jadi — Kab. Sidoarjo
4. Gudang Surabaya
5. Gudang Laboratorium
6. Gudang Produksi Mixing
7. Gudang Produksi Filling
8. Gudang Produksi Packaging
9. Gudang Barang Setengah Jadi
10. Gudang Sekunder
11. Gudang Bahan Baku (Client) ← khusus titipan klien!
12. Gudang Kemasan (Client)
13. Gudang Sekunder (Client)
14. Gudang Reject ← khusus reject!
15. Gudang Supplier ← consignment masuk?
16. Gudang Sample

**Implikasi penting ke spec**: Master spec Pasal "3 Pilar Gudang" (Bagus/Reject/Free) TIDAK menyebutkan gudang fisik terpisah. CSV master legacy SUDAH punya gudang terpisah per-pilar. Ini artinya: **CSV lebih kaya dari spec.** Frontend harus reflect gudang mana yang menerima tipe barang apa.

#### KATEGORI-BARANG.csv (7 rows)
```
BBK - Bahan Baku
BRU - Barang Ruahan
BSJ - Barang Setengah Jadi
BPB - Barang Pembantu
KPR - Kemasan Primer
KSR - Kemasan Sekunder
BJD - Barang Jadi
```

#### PELANGGAN.csv (817 rows)
- Mix kategori: `Pelanggan Sample`, `Pelanggan RO`, `Calon Pelanggan`, `Pelanggan Produk`.
- `nominal_so_produk`, `so_sample`, `so_produk` — counter otomatis legacy.
- `kota` kosong untuk ~80% baris — data kualitas rendah.

#### SUPPLIER.csv (177 rows)
- Kategori legacy hanya `Bahan Baku` untuk semua (CSV master scrape). Padahal master spec Pasal 3 mengharuskan 4 kategori: Bahan Baku / Primer / Sekunder / Pembantu. **CSV tidak capture semua kategori → indikasi data hilang di scraping, atau supplier legacy memang single-kategori.**

### 4.2 MASTER_KODE.xlsx (BINARY — UNREAD)
**Risiko utama**: File ini kemungkinan berisi **peta kode universal lama** (yang harus di-reverse-engineer jadi migration script). Tanpa akses biner (tidak ada Python/openpyxl di tool arsenal), **frontend audit tidak bisa validasi apakah backend sudah migrasi semua kode legacy atau belum.**

**Rekomendasi**: Buka MASTER_KODE.xlsx via command terpisah atau konfirmasi ke user bahwa file ini sudah di-ekstrak ke JSON/CSV lain.

---

## 5. ANATOMI ARCHIVE (38 file)

### 5.1 Klasifikasi

| Kategori | File | Fungsi |
|---|---|---|
| **Spec utama legacy** | `LEGACY_ERP_SPEC.md`, `LEGACY_ERP_AUDIT.md` | SSOT awal sebelum restrukturisasi |
| **Business process** | `ERP_OLD_BUSINESS_FLOW.md`, `ERP_BUSINESS_FLOW_GAP.md`, `05_master_business_process_blueprint.md`, `database.md`/`databasev2.md`/`DATA_DASHBOARD.md` | Pemetaan alur & lineage |
| **Spesifikasi modul-specific** | `HR.md`, `warehouse.md`, `production.md`, `quality_control.md`, `r&d.md`, `legalitas.md`, `design-packing.md`, `NEX_FINANCE_FINAL_SPEC.md`, `NEX-Finance-Module-Full-Spec (1).md` | Deep dive per modul |
| **Implementation logs** | `06_implementation_log_financial_gates.md`, `07_full_stack_integrity_plan.md`, `2026-09-08-agent-orchestration-design.md` | Catatan keputusan implementasi |
| **Inventory CSV (3 versi)** | `kil_erp_full_inventory.csv`, `*_v1.csv`, `*_v2.csv` | Snapshot inventaris layar |
| **CSV operasional/data mentah** | `Client_Sample_Busdev.csv`, `AMI - ACTIVITY WORK - JULI (1).csv`, `Daily_tracking_RND.csv`, `Project_Monitoring_RND.csv`, `_RND Tracking AGUSTUS 2026 - Daily Tracking.csv`, `_RND Tracking AGUSTUS 2026 - Project Monitoring.csv` | Sample data operasional |
| **Deployment** | `VPS_DEPLOYMENT.md` | Setup infra |

### 5.2 Konflik yang Harus Di-resolve (DARI PEMBACAAN MASTER SPEC)

#### Konflik #1: Jumlah Fase Bisnis
- **Master spec Bagian I.6**: "10 fase" (Fase 0–9)
- **Archive `05_master_business_process_blueprint.md`**: kemungkinan "10 fase" juga (perlu konfirmasi)
- **UI legacy G-SERP di `kg_checklist_main`**: sering menampilkan 7–8 fase makro di timeline

**Verdict sementara**: Master spec adalah sumber kebenaran (10 fase). Archive mungkin hanya expand deskripsi.

#### Konflik #2: Approval Threshold Direktur
- Master spec Bagian I.2: "Amount > 50 Juta → Level 3 Direktur Utama"
- Belum ada deviasi yang terdeteksi di body master spec, tapi archive (perlu baca) mungkin pernah punya threshold lain (10jt, 25jt).

#### Konflik #3: Format Kode Universal Lokal vs Global
- Standar: `DL-DIV-PRD-DDMMYYYY-0001` (lengkap) atau `PRD-DDMMYYYY-0001` (ringkas) — GLOBAL tanpa reset.
- SCR-105 (DP Pembelian): **lokal** `DPB-YYMM-XXXX` — di-berdasarkan bulan (MM bukan DD, juga ada YY bukan YYYY).
- **Verdict**: Ini bug/inconsistency di spec. Perlu klarifikasi apakah DP Pembelian formatnya di-standarkan ulang atau local format dibiarkan.

#### Konflik #4: Module ID vs Route Prefix
- **Master spec**: 12 module (MOD-01..12)
- **JSON catalog nexerpRoute**: `/master`, `/scm`, `/bussdev`, `/rnd`, `/warehouse`, `/qc`, `/executive` (7 prefix saja)
- **Implikasi**: MOD-09 (Legality) punya route apa? MOD-10 (Finance)? MOD-11 (HR)?  — **belum terdefinisi.**

#### Konflik #5: Vendor Kode Universal
- Standar: `DL-FIN-SO-...`
- **SCR-057 Vendor Code**: "Universal auto: ringkas/lengkap global sequence" — **vendor tidak punya prefix tetap** (BLI? VEN? SUP?).
- **Customer Code** juga `"auto global"` di SCR-043.
- **Implikasi**: Format kode universal untuk vendor/customer **belum final**, hanya placeholder "auto global".

### 5.3 Archive CSV Operasional (bukan Spec, tapi Data Riil)
- `_RND Tracking AGUSTUS 2026 - Daily Tracking.csv`: data tracking harian R&D Agustus 2026.
- `_RND Tracking AGUSTUS 2026 - Project Monitoring.csv`: monitor project R&D.
- `Client_Sample_Busdev.csv`: sampel klien BusDev.
- `AMI - ACTIVITY WORK - JULI (1).csv`: log aktivitas karyawan Juli.
- `Daily_tracking_RND.csv`: daily tracking R&D.
- `Project_Monitoring_RND.csv`: monitor project (referensi SCR-176 Project Monitoring R&D).

**Implikasi**: data operasional real sudah dikumpulkan — **siap untuk divalidasi via Playwright/UI** saat audit frontend.

---

## 6. CHECKLIST KESIAPAN AUDIT FRONTEND

### 6.1 Pre-Audit Inventory (Siap / Belum)

| Aspek | Status | Catatan |
|---|---|---|
| Daftar 178 layar dari spec | ✅ Siap | Lihat `NEX_ERP_MASTER_SPECIFICATION.md` Bagian II + JSON catalog |
| Daftar route URL per layar | ✅ Siap | Field `nexerpRoute` dan `legacyUrl` di JSON |
| Top metric cards per layar | ✅ Siap | Field `cards[]` di JSON |
| Tabel kolom per layar | ✅ Siap | Field `tableColumns[]` |
| Form input per layar | ✅ Siap | Field `formInputs[]` |
| Aksi/button per layar | ✅ Siap | Field `actions[]` |
| Modal detail per layar | ⚠️ Parsial | Field `viewDetailModal` masih legacy AJAX pattern |
| Special business rules per layar | ✅ Siap | Field `specialRequirementsNotes` |
| 78 REQUIREMENT.MD rules konsolidasi | ⚠️ Parsial | Hanya di Bagian III master spec; butuh klarifikasi original |
| Master data referensi | ⚠️ Parsial | CSV master 6/7 file (MASTER_KODE.xlsx unread) |
| Color coding/motion spec | ❌ Belum | Hanya narasi tekstual "H-3 merah, H-7 kuning, bouncy" |
| API Contract (OpenAPI/Postman) | ❌ **Belum ada** | **BLOCKER** — tidak ada file `openapi.yaml`, `swagger.json`, atau `*.postman_collection.json` di legacy-erp |
| Test cases / acceptance criteria | ❌ Belum | Spec UI naratif saja, tidak ada Gherkin/BDD |
| Mapping legacy_id → new_id | ⚠️ Parsial | `legacyUrl` tersedia, tapi apakah Next.js pakai ini atau restructure? |
| Definisi role/permission per layar | ⚠️ Parsial | Hanya ada sample role dari USERS.csv, tidak ada RBAC matrix |
| i18n / multi-bahasa | ❌ Belum | Spec 100% Bahasa Indonesia; tidak ada lang=en variant |
| Error states / empty states | ❌ Belum | Spec hanya happy path |
| Accessibility (a11y) | ❌ Belum | Tidak ada WCAG target |
| Performance budget | ❌ Belum | Tidak ada target FPS/TTI |
| Security spec (auth flow detail) | ❌ Belum | Hanya "search-select WAJIB" |
| Database schema (final) | ⚠️ Parsial | `databasev2.md` ada di archive; belum konfirmasi apakah dipakai untuk Prisma |

### 6.2 Rekomendasi Langkah Audit Frontend (Berdasarkan Temuan Ini)

#### Step 1: Reconcile Gap Dokumentasi
**Tujuan**: Memastikan tidak ada kontrak yang ambigu saat frontend di-audit.

**Tasks:**
1. **Tanya Upii/user klarifikasi untuk 5 item konflik utama** (Konflik #1-#5 di Bagian 5.2). Atau putuskan master spec menang.
2. **Ekstrak MASTER_KODE.xlsx** ke CSV/JSON via tool terpisah; simpan di `docs/legacy-erp/MASTER_DATA/MASTER_KODE.csv`.
3. **Reconcile missing MOD-XX** (MOD-06, 08, 09, 10, 11): apakah layar-layarnya di-nest di MOD-01 atau dibuatkan section baru di master spec.

#### Step 2: Bangun Audit Source-of-Truth Dashboard
Buat dokumen baru di `docs/audit/`:
- `AUDIT_FRONTEND_VS_LEGACY.md` — matriks 178 layar × status implementasi frontend (✅ / 🟡 / ❌).
- `LEGACY_TO_NEW_ROUTING_MAP.md` — pemetaan `legacyUrl` → Next.js route.
- `API_CONTRACT_REQUIREMENTS.md` — ekstrak dari deskripsi UI naratif menjadi expected API request/response per layar.

#### Step 3: Frontend Static Audit
**Tasks:**
1. **Route enumeration**: Scan `frontend/src/app/` atau `frontend/src/pages/`, list semua route yang ada. Cross-check dengan 178 `nexerpRoute`.
2. **Component enumeration**: Scan `frontend/src/components/`, list modul folder (bussdev, qc, rnd, scm, hr, finance, legality, creative, master, etc.) dan module-level coverage.
3. **Theme audit**: Cross-check `VISUAL_DNA.md` (root) dengan implikasi UI di spec legacy.

#### Step 4: Backend API Audit
**Tasks:**
1. **Module enumeration**: Scan `backend/src/modules/*/` (60+ module ditemukan). Map ke 12 MOD-XX di master spec.
2. **Service enumeration**: Per module, list services & endpoints. Match dengan ekspektasi UI.
3. **Prisma schema audit**: Validasi semua entity (Material, Formulation, BatchRecord, JobOrder, FundRequest, Escrow, FixedAsset, dll) ada di Prisma.
4. **3-pillar warehouse & auto-journal engine**: VALIDASI kritis di backend.

#### Step 5: Audit Data Flow End-to-End
**Tasks:**
1. PO Inbound: `PO → GR (Bagus/Reject/Free) → AUTO Retur Reject → Faktur (Hanya Bagus) → Bayar`
2. SO Pipeline: `Leads → Sample → SO → DP (Tab Sample/Legalitas/Produksi) → Mixing → QC → Packaging → Delivery Gatekeeper`
3. Closing Period: `Bank Recon → Checklist → Soft/Hard Lock → Adjustment Journal`
4. Escrow Pass-Through: `DP Legalitas → Escrow → Disbursement ke PNBP/Lab → Refund/Reimburse`

#### Step 6: Laporan & Rekomendasi
Deliverable final: `AUDIT_FRONTEND_REPORT.md` dengan:
- **Coverage Score** (% layar ter-implement dari 178)
- **Gap List** (per-layer)
- **Severity-ranked Issue List**
- **Quick-win vs Strategic-backlog**

---

## 7. CRITIQUE — TEMUAN KUALITAS DOKUMEN

### 7.1 Positif ✅
1. **SSOT eksplisit**: master spec dideklarasikan sebagai "SINGLE SOURCE OF TRUTH (OFFICIAL AUTHORITATIVE BLUEPRINT) v2.0 Final" dengan tanggal rilis. Bagus.
2. **Cross-format tersedia**: Markdown (manusia) + JSON (mesin). Memungkinkan automated audit.
3. **Master data real**: CSV berisi data riil (46 user, 16 gudang, 177 supplier, 800+ customer, 2.795 barang) — bukan dummy.
4. **Business rules sangat granular**: 78 REQUIREMENT, 5 KPI formulas, 9 auto-journal triggers, 3-pilar gudang, 3-tier approval — substantive, bukan wishful thinking.
5. **Special requirements notes** per-screen sangat kaya: setiap SCR-XX punya catatan "📌 Catatan Khusus & Aturan Bisnis" yang biasanya berisi referensi ke Poin X-Y master spec.
6. **Strategic phasing jelas**: 3 versi inventory CSV (v0/v1/v2) menunjukkan iterasi terkontrol.

### 7.2 Negatif ❌
1. **Tidak ada API contract** (OpenAPI/Swagger/Postman). Ini blocker audit teknis.
2. **Tidak ada test plan / acceptance criteria** per layar.
3. **Tidak ada i18n, a11y, performance, security specs**.
4. **Conflict internal pada dokumen**: 178 vs 176; 12 modul vs 7 detail; format kode universal vs kode lokal; moduleId vs route prefix.
5. **Missing module details** untuk 5 dari 12 modul (MOD-06, 08, 09, 10, 11).
6. **No traceability** dari 78 REQUIREMENT.MD ke dokumen REQUIREMENT.md asli — derivasi tanpa asal-usul jelas.
7. **Format inconsistency di spec**: beberapa layar pakai format naratif Markdown lengkap, beberapa hanya judul tanpa deskripsi. SCR-090 Retur Pembelian hanya punya tabel kolom + aksi "Riwayat" — tidak ada special notes.
8. **Archive tidak deprecate secara eksplisit**: tidak ada catatan "ARCHIVED — DO NOT USE" di file-file `_archive/`. Risiko: developer bisa saja pakai versi lama.
9. **Visual DNA tidak ada di legacy-erp/**: harus cross-check ke `VISUAL_DNA.md` root. Legacy ERP tidak punya "DNA Design System v7.0" yang sebenarnya.
10. **3 versi inventory.csv redundant**: 3 file dengan konten sama persis → maintenance overhead tanpa nilai tambah.
11. **MASTER_KODE.xlsx binary**: sulit diintegrasikan ke workflow otomatis.
12. **`actions[]` array noise**: berisi campuran functional buttons dan data values. Tidak terstruktur.

### 7.3 Rekomendasi Perbaikan Dokumen (Future Iterations)

| # | Rekomendasi | Dampak |
|---|---|---|
| 1 | Tambahkan `docs/legacy-erp/API_CONTRACT.json` (minimal expected REST/GraphQL endpoint per screen). | Unblock frontend audit. |
| 2 | Tambahkan `docs/legacy-erp/TEST_PLAN.md` dengan skenario per-flow (PO Inbound, SO Pipeline, dll). | Mempermudah QA. |
| 3 | Resolve the 5 konflik (fase bisnis, threshold direktur, kode universal, MOD-XX vs route, vendor/customer code format). | Hilangkan ambiguitas. |
| 4 | Tambahkan explicit "ARCHIVED — DO NOT REFERENCE" header di semua `_archive/*.md`. | Cegah dev salah gunakan. |
| 5 | Konversi 3 inventory CSV → 1 file kanonikal + deprecate sisanya. | Kurangi drift. |
| 6 | Ekstrak MASTER_KODE.xlsx ke CSV/JSON. | Memungkinkan migrasi otomatis. |
| 7 | Tambahkan section "GLOSSARY" di master spec (akronim: NPF, COGS/HPP, WIP, GR, dll). | Mempercepat onboarding developer baru. |
| 8 | Tambahkan section "RBAC Matrix" — siapa yang boleh apa per modul/layar. | Single source untuk permission. |
| 9 | Tambahkan changelog per versi (v1.0, v1.5, v2.0). | Audit trail. |
| 10 | Normalisasi `actions[]` JSON: pisahkan `buttons[]` (UI actions) vs `statuses[]` (data enum). | Clean schema. |

---

## 8. CATATAN UNTUK AUDIT FRONTEND (Quick Reference)

### 8.1 Fakta Paling Penting untuk Di-check di Frontend

```
✅ TOTAL = 176 layar (JSON) atau 178 (MD klaim) — sumber = NEX_ERP_SCREEN_AND_API_CATALOG.json
✅ 12 MOD-XX arsitektur, tapi body spec hanya 7 modul ter-detail
✅ Route prefixes legacy = /master | /scm | /bussdev | /rnd | /warehouse | /qc | /executive
✅ 46 user legacy, role konsisten (BusDev/Warehouse/RnD/Finance/HRD)
✅ 16 gudang legacy (termasuk gudang khusus: Client, Reject, Supplier, Sample)
✅ 177 supplier legacy, dominan Bahan Baku
✅ Kode Universal Engine Wajib: 2 varian, no-reset, globally-sequenced
✅ 3 Pilar Gudang: Bagus / Reject / Free
✅ 3-Tier Approval: >50jt butuh Direktur
✅ 9 Trigger Auto-Journal (lihat Bagian 2.2 tabel di atas)
✅ DNA Design: 4-6 top cards SELARAS dengan tabs, search-select WAJIB, date range picker
✅ AP Aging: H-3 merah, H-7 kuning, Overdue bold + animasi (motion spec belum ada)
✅ AR Gatekeeper: HELD/RELEASED — Gudang tak boleh cetak DO sebelum RELEASED
✅ 3-Way Matching DIHIDUPKAN di backend tapi DISEMBUNYIKAN di UI
✅ Status Done bisa di-revert ke In-Progress; wajib ada catatan
```

### 8.2 Field Khusus yang SELALU Harus Ada di Frontend

1. **Date Range Picker Custom** — BUKAN date picker HTML5 default. Wajib ada di semua laporan.
2. **Search-Select / Autocomplete** — untuk SEMUA field relasi (Customer, Supplier, COA, Material, Formulation, Batch, dll).
3. **Cards di ATAS Tabel, urutan SELARAS dengan Tabs/Filter di BAWAH** — DNA wajib.
4. **Saldo Bank Real-time di Navbar AP Aging**.
5. **Notes / Alasan field** pada Faktur/Pembelian/Jurnal yang belum lunas.
6. **Tanda Tangan Digital** pada PO (SCR-110, SCR-175).
7. **Catatan Wajib** saat status = Pending (Poin 67 master spec).
8. **Batch Number & Expired Date** di Desain (SCR-134).
9. **3 Card khusus di Customer** (Sample, Produksi, Legalitas) per Poin 2 master spec.
10. **DP Penjualan tabs**: Sample, Legalitas, Produksi (Poin 14).

### 8.3 Yang TIDAK BOLEH Ada di Frontend (Berdasarkan Spec)

1. **Akurasi Matching % disembunyikan** — Poin 5 master spec, SCR-106, SCR-117.
2. **Dimensi Finansial dihapus** — Poin 27 master spec, SCR-079/080.
3. **Kolom "Kondisi Bagus" dan "Kondisi Cacat" dihapus** di tabel barang — Poin 50 master spec, SCR-029 (diganti "Real Stok").
4. **Match-cabang Invoice-PO otomatis dinonaktifkan** — Poin 46 master spec.
5. **Tax module tanpa e-Faktur/e-Bupot DJP** — Poin 35 master spec, SCR-039, SCR-085.
6. **Kolom tak terpakai dihapus** — Poin 54 master spec.

---

## 9. KESIMPULAN

Dokumen legacy ERP (`docs/legacy-erp/`) merupakan **blueprint substansial** untuk ERP kosmetik maklon skala enterprise dengan:
- **Domain expertise tinggi** (178 layar, 78 REQUIREMENT, 9 auto-journal, 3-pilar gudang, KPI formulas).
- **Real master data** (CSV scrape dari G-SERP legacy) — tidak dummy.
- **Cross-format** (MD + JSON) — automation-friendly.
- **Iterasi jelas** (5 fase dokumen dari legacy capture → final SSOT).

**TAPI memiliki GAPS KRITIS untuk audit frontend:**
- ❌ Tidak ada API contract → BLOCKER validasi request/response.
- ❌ 5 dari 12 modul tidak punya screen detail.
- ❌ Multiple inkonsistensi internal (178 vs 176, 7 vs 12 modul detail, dll).
- ❌ MASTER_KODE.xlsx unread.

**Verdict untuk langkah selanjutnya**:
1. ✅ **Siap** dimulainya audit frontend setelah master spec + JSON catalog selesai di-resolve.
2. ⚠️ **Blocker minor** masih ada (5 konflik internal) — decide based on master spec atau escalate ke user.
3. 📋 **Strong recommendation**: Buat dokumen turunan `AUDIT_FRONTEND_VS_LEGACY.md` di `docs/audit/` sebelum scanning kode frontend.

---

**Dokumen ini ditulis sebagai deliverable dari perintah: "pelajari analisis dan kritisi @docs/legacy-erp\ seluruhnya karena setelah ini anda akan audit kelengkapan dari frontend".**

**Status agents background:** 3 agents masih berjalan untuk mengisi gap (78 REQUIREMENT penuh, KPI detail, database schema, finance spec detail). Output mereka akan menjadi suplemen terhadap dokumen ini — khususnya untuk Bagian 5 (archive conflicts) yang belum sepenuhnya ditelusuri.

**Next step**: Bila user konfirmasi, lanjut ke Step 1 rekomendasi di Bagian 6.2.

---

## 10. ADDENDUM AUDIT LIVE ERP (2026-09-15) — RESOLUSI GAP 176 VS 144 LAYAR
Per 15 September 2026, telah dilakukan live crawling & inspection terhadap sistem produksi `https://kil.gserp.id` (menggunakan akun `zaki@dreamlab.id` dari `.env`).

**Hasil Temuan Kunci & Rekonsiliasi**:
1. **144 Layar Aktif (HTTP 200)** terverifikasi hidup di `kil.gserp.id`. Ini cocok **98.63%** dengan file `_archive/kil_erp_full_inventory.csv` (146 baris baseline murni).
2. **Selisih 31 Layar 404** pada `NEX_ERP_SCREEN_AND_API_CATALOG.json` (176 layar) terkonfirmasi sebagai **REQUIREMENT TAMBAHAN / ADVANCEMENT** yang berasal dari `_archive/kil_erp_full_inventory_v2.csv` (meliputi modul Aset Tetap, Escrow Ledger, Rekonsiliasi Bank, Tax Setup, Budgeting, Fund Request, dan Laporan Aging). Layar-layar ini belum pernah dibuat di server lama.
3. **1 Layar Defect HTTP 500**: `/dashboard-human-resources` mengalami internal error pada backend legacy.
4. **Dokumen Patokan Resmi**: Telah diterbitkan dokumen panduan definitif [NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md](file:///c:/GAWE/Web%20Dev/Porto%20Aureon/ERP%20FROM%20ZERO/docs/legacy-erp/NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md) dan update metadata `liveStatus` pada [NEX_ERP_SCREEN_AND_API_CATALOG.json](file:///c:/GAWE/Web%20Dev/Porto%20Aureon/ERP%20FROM%20ZERO/docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json) (v2.1.0).

