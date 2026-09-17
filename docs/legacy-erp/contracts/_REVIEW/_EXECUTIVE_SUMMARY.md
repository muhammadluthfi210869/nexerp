# NEX ERP Contracts — Forensic Audit (Executive Summary)

> **Audit date**: 2026-09-16
> **Scope**: 12 documents di `docs/legacy-erp/contracts/` (~1.1 MB, ~36,000 baris)
> **Roles applied**: Senior ERP Technical Auditor + Business Analyst/Functional Consultant + Software Architect/Lead Developer + QA/Test Engineer
> **Methodology**: Document parsing (count, cross-reference, structural) + semantic review + consistency check
> **Severity legend**: 🔴 Critical (blocker) · 🟠 Major (must fix before impl) · 🟡 Minor (should fix) · 🔵 Nit (polish)

---

## 1. Verdict Ringkas

| # | Dokumen | Status | Critical | Major | Minor | Nit |
|---|---------|--------|---------:|------:|------:|----:|
| 00 | MASTER_SPEC.md | 🟠 Out-of-sync angka | 1 | 6 | 4 | 2 |
| 01 | DOMAIN_MODEL.md | 🟠 Count mismatch | 1 | 5 | 3 | 1 |
| 02 | DATA_OWNERSHIP.yaml | 🟢 Solid | 0 | 2 | 3 | 1 |
| 03 | WORKFLOW_STATE_MACHINE.yaml | 🟢 Comprehensive | 0 | 3 | 4 | 1 |
| 04 | BUSINESS_RULES.md | 🟠 1 rule bloated | 0 | 4 | 2 | 1 |
| 05 | API_CONTRACT.yaml | 🟢 Comprehensive | 0 | 3 | 3 | 2 |
| 06 | SCREEN_CONTRACT.json | 🟠 Modules mismatch | 1 | 3 | 4 | 1 |
| 07 | RBAC_MATRIX.yaml | 🔴 **Duplicate role ID** | **1** | **4** | 3 | 1 |
| 08 | INTEGRATION_EVENT_CONTRACT.yaml | 🟢 Solid | 0 | 2 | 2 | 1 |
| 09 | NON_FUNCTIONAL_CONTRACT.md | 🟢 Comprehensive | 0 | 2 | 2 | 1 |
| 10 | TRACEABILITY_MATRIX.yaml | 🟢 Well-structured | 0 | 1 | 2 | 1 |
| — | schema.prisma | 🟠 Drift dari docs | 1 | 4 | 3 | 2 |
| **TOTAL** | | | **4** | **39** | **35** | **15** |

---

## 2. 🔴 Critical Findings (4) — Blockers

### CRIT-01: RBAC Matrix — Duplicate Role ID
- **File**: `07_RBAC_MATRIX.yaml`, lines **508** dan **1208**
- **Issue**: `id: role-nex-production-packaging` didefinisikan **DUA KALI**.
  - Line 508: bagian legacy role (legacy_id: 11, "Production Packaging" legacy)
  - Line 1208: bagian NEX role (category: division_role)
- **Dampak**:
  - Backend guard (`@Roles()` decorator) yang resolve `role-nex-production-packaging` ke permissions akan **mengambil entry terakhir** (atau crash dengan YAML duplicate key warning).
  - `inherits_from` chain untuk role lain bisa salah target.
  - Migration script dari legacy akan memetakan legacy_id=11 ke role ini — tapi ada 2 entry untuk legacy_id=11 yang berbeda permission set.
- **Rekomendasi**:
  1. Pilih mana yang canonical (kemungkinan entry line 508 = legacy migration, line 1208 = production-packaging operator yang sebenarnya).
  2. Rename salah satu (mis. `role-nex-production-packaging-legacy` untuk entry migrasi) ATAU hapus yang legacy dan migrate via `legacy_id: 11` saja.
  3. Tambahkan unique constraint di schema.prisma `@@unique([id])` (sudah implicit) + validator di CI.
  4. Tulis unit test: "RBAC matrix YAML tidak mengandung duplicate id".

### CRIT-02: Schema/Count Drift — schema.prisma vs Domain Model
- **Files**: `schema.prisma`, `01_DOMAIN_MODEL.md`, `02_DATA_OWNERSHIP.yaml`, `05_API_CONTRACT.yaml`
- **Issue**: 4 dokumen mengklaim jumlah entity berbeda:
  - `schema.prisma`: **89 models** (verified by grep)
  - `01_DOMAIN_MODEL.md §1.1`: **"70 Prisma models"** (sudah outdated)
  - `02_DATA_OWNERSHIP.yaml` comment: **"78 entity catalog"**
  - `05_API_CONTRACT.yaml`: **"89 entities, this spec covers ~78"**
- **Dampak**:
  - Setiap reference ke "70 models" di kode review akan salah.
  - ETL mapping merujuk ke count yang tidak valid.
  - Confusing bagi developer baru.
- **Rekomendasi**: Update `01_DOMAIN_MODEL.md §1.1` jadi **"89 Prisma models in 10 sections"**, hapus comment 78 di data_ownership, dan validasi bahwa API contract memang cover semua entity.

### CRIT-03: Screen Count Drift — MASTER_SPEC vs SCREEN_CONTRACT
- **Files**: `00_MASTER_SPEC.md`, `06_SCREEN_CONTRACT.json`
- **Issue**:
  - MASTER_SPEC §1.4: **"176 screens"** target
  - SCREEN_CONTRACT: **178 screens** aktual (verified `j.screens.length === 178`, matches `total_screens` field)
  - Drift: +2 screens
- **Dampak**: Parity tracking, migration completeness checker akan false-pass atau false-fail.
- **Rekomendasi**:
  1. Decide: apakah 178 adalah target baru (legacy parity + NEX additions)?
  2. Update MASTER_SPEC §1.4 + §1.1 tabel menjadi "178 screens".
  3. Atau remove 2 screens dari contract.

### CRIT-04: Role Count Chaos (4 sumber angka berbeda)
- **Files**: `00_MASTER_SPEC.md`, `07_RBAC_MATRIX.yaml`, `01_DOMAIN_MODEL.md`, `04_BUSINESS_RULES.md`
- **Issue**: 4 angka berbeda untuk "total roles":
  - MASTER_SPEC §3: **"16 legacy + 2 cross-cutting = 18 named roles"** (paragraf pertama)
  - MASTER_SPEC §3.1: **"25 distinct named roles in NEX"**
  - RBAC header comment: **"16 legacy + 14 new = 30 total"**
  - RBAC actual YAML: **43 roles** (verified count)
- **Dampak**:
  - Setiap referensi ke "jumlah role" ambigu.
  - Migration script legacy→NEX mungkin salah asumsi role map.
  - RBAC matrix header (30) != actual (43) — siapa yang akan percaya mana?
- **Rekomendasi**: 
  1. Single source of truth: gunakan hitungan aktual `roles.length === 43` di RBAC YAML.
  2. Update MASTER_SPEC §3 jadi konsisten.
  3. Hapus angka "30 total" di header RBAC.

---

## 3. 🟠 Major Findings (39) — Rangkuman Tematik

### 3.1 Authority Order Conflict (6 dokumen punya urutan berbeda)
- **MASTER_SPEC §9.4**: `REQUIREMENT > DEC > SSOT > MASTER_SPEC > FINANCE_SPEC`
- **04_BUSINESS_RULES §1.4**: `REQUIREMENT > DEC > NEX spec > NFR > technical default`
- **01_DOMAIN_MODEL**: `_SSOT_FINAL > 00_MASTER_SPEC > 09_NFR > this doc`
- **02_DATA_OWNERSHIP**: `_SSOT_FINAL > 00_MASTER_SPEC > 09_NFR > 01_DOMAIN_MODEL > this`
- **03_WORKFLOW_STATE_MACHINE**: `_SSOT_FINAL > 00_MASTER_SPEC > 09_NFR > this file`
- **07_RBAC_MATRIX**: `_SSOT_AUTH §4 > 09_NFR §8 > this file`
- **Dampak**: Ketika dua kontrak konflik, developer tidak tahu mana yang menang.
- **Fix**: Tentukan satu canonical order (MASTER_SPEC §9.4 adalah yang paling lengkap dan authoritative). Tambahkan explicit reference ke §9.4 di setiap kontrak lain.

### 3.2 DEC Numbering Inconsistency
- **MASTER_SPEC §9.1**: "**26 LOCKED decisions**" (DEC-001..026)
- **04_BUSINESS_RULES §1.2**: "**DEC-001..034** (LOCKED)" = 34
- BUSINESS_RULES juga reference **DEC-028** (line 899, money integer)
- **Dampak**: Developer yang baca MASTER_SPEC kira ada 26 DEC, BUSINESS_RULES bilang 34. Mana yang benar? Apakah DEC-027..034 ada?
- **Fix**: Verify `_PROCESS_DECISIONS_LOG.md` (offline) untuk actual count, lalu update semua referensi.

### 3.3 Module/Domain Count Drift
- **MASTER_SPEC §1.1**: "9 ERP domains"
- **MASTER_SPEC §2.1**: Lists **10 modules** + cross-cutting
- **MASTER_SPEC §7.1**: Lists **12 modules** dengan build order
- **Domain Model §1.1**: "10 sections"
- **Screen contract**: **15 module keys**
- **Dampak**: Inkonsistensi fundamental di definisi "modules" vs "domains" vs "sections".
- **Fix**: Pilih satu istilah dan konsisten: "9 ERP **domains** (functional areas) + 2 cross-cutting **layers** + 1 dashboard layer = 12 NEX **modules** (buildable units)".

### 3.4 BUS-RULE-005 Bloated
- **File**: `04_BUSINESS_RULES.md`
- **Issue**: BUS-RULE-005 (Credit Limit Check) occupies ~17.6KB, jauh lebih besar dari rule lain (~0.5-3KB). Tampaknya berisi JSON schema atau SQL inline yang mestinya di file lain.
- **Fix**: Extract schema definition ke appendix atau pisahkan jadi BUS-RULE-005 (logic) + BUS-RULE-005a (schema).

### 3.5 TBD Markers in Migration Mapping
- **File**: `01_DOMAIN_MODEL.md §15`
- **Issue**: 7+ entries bertuliskan "(TBD)" — Customer, Supplier, Goods, SalesOrder, PurchaseOrder, SalesInvoice, dst.
- **Fix**: TBD di dokumen **LOCKED** bukan placeholder — harus diisi sebelum status LOCKED valid. Atau downgrade ke "DRAFT" sampai ETL mapping selesai.

### 3.6 API Path Coverage Gap
- **API Contract**: 97 paths, 297 operations, 16 tags
- **Schema**: 89 entities
- **Issue**: Ratio ~1.1 paths per entity. Untuk ERP sekompleks ini, umumnya perlu 3-5 endpoints per entity (list, create, read, update, delete, plus actions). Coverage kemungkinan under-spec'd.
- **Verifikasi**: Bandingkan setiap entity di schema dengan path di API. Flag entity yang tidak punya endpoint.

### 3.7 Screen Form/Column Coverage
- **Screen contract**: 178 screens, 116 tanpa forms, 90 tanpa columns
- **Issue**: 65% screens tanpa forms (acceptable untuk list/detail/dashboard), tapi 51% tanpa columns = banyak list screens yang mungkin belum punya kolom definition. Verifikasi manually.
- **Fix**: Spot-check 10 list screens untuk konsistensi column definitions.

### 3.8 Legacy Role Mapping Ambiguity
- **RBAC**: 16 legacy roles (legacy_id 1-16) + DEC-023 deletes Role 10
- **Issue**: Role `role-nex-orphan-production-mixing-filling` masih ada di RBAC dengan `legacy_id: null` tapi `name: Production Mixing & Filling` — DEC-023 bilang ini harus DIHAPUS.
- **Fix**: Hapus entry orphan atau tandai dengan `is_legacy: true, is_active: false, migrated: false`.

### 3.9 Communication Layer Entities
- **Schema**: Ada `Note, StatusTransition, Tag, Comment, Attachment, Notification` (6 models)
- **MASTER_SPEC §2.2**: "Notes, Document Transfer Status, @mention tags, cross-reference comments"
- **Screen contract**: `communication` module dengan 10 screens
- **Issue**: Definisi "Communication Layer" tersebar di 3 dokumen, belum ada dokumen kontrak khusus `08_COMMUNICATION_CONTRACT.md` (note: file 08 adalah INTEGRATION_EVENT, bukan communication).
- **Fix**: Cross-reference atau tambah dokumen kontrak untuk konsistensi.

### 3.10 Finance LOCKED Principles — Enforcement Gap
- **MASTER_SPEC §5.8**: 7 finance principles (auto-journal, three-pillar, three-tier approval, dll)
- **API contract**: Hanya mention "jurnal-umum" dan "general-journal" parallel routes (DEC-018)
- **Issue**: Belum jelas bagaimana 7 principles ini enforced di code/API.
- **Fix**: Mapping principle → API guard ataukah DB constraint ataukah business rule. Tambah di RBAC matrix atau workflow state machine.

---

## 4. 🟡 Minor Findings (35) — Highlights

- **Format Kode Universal inconsistency**: Domain model §4 uses `{PREFIX}-{YYMM}-{XXXX}` tapi beberapa entity pakai `{DDMMYYYY}-{XXXX}` (PO, SO, AST, DO). Apakah intentional atau drift?
- **Glossary**: 80+ terms di MASTER_SPEC tapi tidak semua ada di schema/entity model.
- **Glossary line 274**: "Goodwill" didefinisikan tapi tidak ada model `Goodwill` di schema.
- **MASTER_SPEC §1.1 tabel**: "31 Expansion Features" tapi referensi internal bilang "31 expansion screens" — inconsistent unit.
- **Schema.prisma line 506-1033**: 13 entities punya code format berbeda, belum ada single regex validator.
- **API contract**: `unique tag names: 62` tapi declared tags cuma 16. 46 extra = parameter names ter-capture sebagai tags. Berarti ada parameter naming drift.
- **BUSINESS_RULES §1.2**: Reference ke "raw/" folder yang tidak ada di `contracts/`.
- **DATA_OWNERSHIP.yaml**: "delegations" section belum dicek apakah lengkap.
- **Workflow state machine §16 CHANGELOG**: Tidak ada entry — apakah baru atau lupa?
- **Traceability matrix**: 9 sections (requirements, business_rules, workflows, entities, api_endpoints, screens, tests, gaps, index). Apakah tests sudah populated?

---

## 5. 🔵 Nit / Polish (15) — Highlights

- MASTER_SPEC line 144: "16 legacy roles + 2 NEX cross-cutting roles (Executive, Auditor) for a total of 18" — "Executive" dan "Auditor" tidak ada di tabel §3.1.
- Multiple documents reference `_SSOT_FINAL.md` tapi file tidak ada di folder `contracts/` (ada di `docs/legacy-erp/`).
- Inconsistent file naming: `00_MASTER_SPEC.md` tapi `01_DOMAIN_MODEL.md` (zero-padded) vs other files (e.g., `schema.prisma` no prefix).
- Beberapa ID prefix tidak konsisten: `role-nex-*` vs `nex_role:` reference.

---

## 6. Rekomendasi Prioritas

### P0 — Block release
1. **Fix CRIT-01**: RBAC duplicate role ID (5 menit, rename atau hapus salah satu entry).
2. **Fix CRIT-04**: Role count consistency (10 menit, audit actual vs doc).
3. **Fix CRIT-02**: Entity count sync (15 menit, update 3 docs).
4. **Fix CRIT-03**: Screen count sync (5 menit, decide 176 vs 178).

### P1 — Fix before implementation
1. Authority order conflict — pilih satu canonical (§9.4) dan reference dari semua.
2. DEC numbering — verifikasi actual count.
3. BUS-RULE-005 bloat — extract schema.
4. TBD markers di migration mapping — isi atau downgrade ke DRAFT.
5. Module/domain terminology consistency.

### P2 — Quality improvement
1. Spot-check screen form/column definitions.
2. Verify API path coverage per entity.
3. Tambah communication contract dokumen.
4. Map LOCKED principles ke enforcement mechanism.
5. Format Kode Universal consistency check.

---

## 7. Metrik Dokumen (Ringkasan)

| File | Lines | Size | Models/Items | Status |
|------|------:|-----:|-------------:|--------|
| 00_MASTER_SPEC.md | 756 | 47KB | 9 domains | 🟠 |
| 01_DOMAIN_MODEL.md | 1,917 | 73KB | 89 models (doc says 70) | 🟠 |
| 02_DATA_OWNERSHIP.yaml | 1,416 | 50KB | n/a | 🟢 |
| 03_WORKFLOW_STATE_MACHINE.yaml | 2,791 | 99KB | 16 sections | 🟢 |
| 04_BUSINESS_RULES.md | 1,801 | 80KB | 105 rules | 🟠 |
| 05_API_CONTRACT.yaml | 6,496 | 224KB | 97 paths / 297 ops | 🟢 |
| 06_SCREEN_CONTRACT.json | 14,077 | 350KB | 178 screens | 🟠 |
| 07_RBAC_MATRIX.yaml | 2,343 | 86KB | 43 roles (header says 30) | 🔴 |
| 08_INTEGRATION_EVENT_CONTRACT.yaml | 1,041 | 36KB | n/a | 🟢 |
| 09_NON_FUNCTIONAL_CONTRACT.md | 826 | 32KB | n/a | 🟢 |
| 10_TRACEABILITY_MATRIX.yaml | 1,423 | 119KB | 9 sections | 🟢 |
| schema.prisma | 2,258 | 91KB | **89 models** | 🟠 |
| **TOTAL** | **37,143** | **~1.27 MB** | | |

---

## 8. Catatan Metodologi

- **Parsing**: `grep -c`, `node -e` JSON/YAML parse, `wc -l` per file.
- **Cross-reference**: Manual comparison antar dokumen untuk angka, terminologi, dan authority order.
- **Belum dicek** (luar scope atau butuh akses):
  - `_SSOT_*.md` (di folder `docs/legacy-erp/`, bukan `contracts/`)
  - `_PROCESS_DECISIONS_LOG.md` (referenced tapi offline)
  - `NEX_ERP_MASTER_SPECIFICATION.md` (193KB referenced)
  - `NEX_FINANCE_FINAL_SPEC.md` (59KB referenced)
  - `REQUIREMENT.md` (Upii's 34 points, referenced)
  - Code implementation (belum ada)
  - Test coverage actual

---

> **End of Executive Summary** — See individual `_REVIEW/<FILE>_REVIEW.md` for detailed per-document analysis.
