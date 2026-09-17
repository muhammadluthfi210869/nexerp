# Cross-Document Inconsistencies — NEX ERP Contracts

> Dokumen ini khusus untuk findings yang **melintasi banyak file**. Per-file ada di file `_REVIEW/<FILE>_REVIEW.md` masing-masing.

---

## X-1. ENTITY COUNT — 4 angka berbeda

| Sumber | Klaim | Actual | Status |
|--------|-------|--------|--------|
| `schema.prisma` | (definitive) | **89 models** | ✅ ground truth |
| `01_DOMAIN_MODEL.md §1.1` | "70 Prisma models grouped into 10 sections" | 89 | ❌ STALE |
| `02_DATA_OWNERSHIP.yaml` (comment) | "78 entity catalog" | 89 | ❌ STALE |
| `05_API_CONTRACT.yaml` | "schema.prisma (89 entities, this spec covers ~78)" | 89 / ~78 | ⚠️ PARTIAL |

**Fix**: 
- Update `01_DOMAIN_MODEL.md §1.1` → "**89 Prisma models in 10 sections**".
- Hapus/sederhanakan comment di `02_DATA_OWNERSHIP.yaml`.
- API contract sudah benar (89/~78), tidak perlu diubah kecuali coverage 78 belum diverifikasi.

---

## X-2. ROLE COUNT — 4 angka berbeda

| Sumber | Klaim | Actual | Status |
|--------|-------|--------|--------|
| `00_MASTER_SPEC.md §3` (paragraf) | "16 legacy + 2 NEX cross-cutting = **18 named roles**" | 43 | ❌ WRONG |
| `00_MASTER_SPEC.md §3.1` (footer) | "**25 distinct named roles** in NEX" | 43 | ❌ WRONG |
| `07_RBAC_MATRIX.yaml` (header) | "**16 legacy + 14 new = 30 total**" | 43 | ❌ WRONG |
| `07_RBAC_MATRIX.yaml` (actual) | (definitive) | **43 roles** | ✅ ground truth |
| `01_DOMAIN_MODEL.md` §2.1 tabel | "User, Role" only — too low | 43 (in RBAC) | ❌ STALE |
| `06_SCREEN_CONTRACT.json` | (implicit, role checks) | n/a | — |

**Analisis gap**:
- 16 legacy roles (legacy_id 1-16, role 10 dihapus per DEC-023 = 15 legacy active)
- Plus: SuperAdmin, Administrator, HR Admin, HR Staff, Purchasing Admin, Purchasing Staff, Warehouse Admin, Warehouse Staff, BusDev Manager, BusDev Admin, BusDev Staff, RnD Manager, RnD Admin, RnD Chemist, Production Admin, Production Operator Mixing, Production Operator Filling, Production Operator Packaging, Apoteker, Finance Manager, Finance Admin, Finance Staff, Digital Marketing Admin, Digital Marketing Staff, Legalitas Admin, Legalitas Staff, Executive, Auditor, Viewer = ~29 NEX roles
- Plus legacy combos: BusDev+HRD, BusDev+Purchasing = 2 more
- **Total expected**: 15 + 29 + 2 = 46 (vs actual 43 → 3 short, likely legacy_id duplicates removed)

**Fix**:
- MASTER_SPEC §3: "NEX has **43 roles total** — 16 legacy (1 ORPHAN deleted per DEC-023 = 15 active) + 28 new NEX roles."
- MASTER_SPEC §3.1 tabel: rebuild dari RBAC matrix.
- RBAC header comment: hapus angka, tulis "See roles[] for actual count."

---

## X-3. SCREEN COUNT — 2 angka berbeda

| Sumber | Klaim | Actual | Status |
|--------|-------|--------|--------|
| `00_MASTER_SPEC.md §1.4` | "**176 screens**" | 178 | ❌ STALE |
| `00_MASTER_SPEC.md §9.1` | "**176-screen catalog**" | 178 | ❌ STALE |
| `06_SCREEN_CONTRACT.json` `total_screens` | **178** | 178 | ✅ CORRECT |

**Breakdown actual 178 screens per module**:
| Module | Count | Range |
|--------|------:|-------|
| auth | 5 | SCR-001..005 |
| users | 4 | SCR-006..009 |
| master | 15 | SCR-010..024 |
| sales | 25 | SCR-025..049 |
| purchase | 25 | SCR-050..074 |
| production | 12 | SCR-075..086 |
| warehouse | 8 | SCR-087..094 |
| rnd | 6 | SCR-095..100 |
| finance | 16 | SCR-101..116 |
| checklist | 5 | SCR-117..121 |
| reports | 14 | SCR-122..135 |
| communication | 10 | SCR-136..145 |
| audit | 5 | SCR-146..150 |
| dashboards | 13 | SCR-DASH-001..013 |
| system | 15 | SCR-SYS-001..015 |
| **Total** | **178** | |

**Note**: ID pattern tidak konsisten — 150 pakai format `SCR-XXX`, lalu ada 2 namespace `SCR-DASH-*` dan `SCR-SYS-*`. Untuk traceability lebih baik pakai prefix konsisten atau satu continuous numbering.

**Fix**:
- Update MASTER_SPEC ke **178 screens**.
- Atau hapus 2 screens (`SCR-DASH-*` dan `SCR-SYS-*` mungkin masuk kategori berbeda).

---

## X-4. AUTHORITY ORDER — 6 definisi berbeda

| Dokumen | Order |
|---------|-------|
| `00_MASTER_SPEC.md §9.4` | REQUIREMENT.md → _PROCESS_DECISIONS_LOG.md → _SSOT_*.md → NEX_ERP_MASTER_SPECIFICATION.md → NEX_FINANCE_FINAL_SPEC.md |
| `04_BUSINESS_RULES.md §1.4` | REQUIREMENT.md → DEC-* LOCKED → NEX spec → NFR → technical default |
| `01_DOMAIN_MODEL.md` | _SSOT_FINAL.md → 00_MASTER_SPEC.md → 09_NON_FUNCTIONAL_CONTRACT.md → this document |
| `02_DATA_OWNERSHIP.yaml` | _SSOT_FINAL.md → 00_MASTER_SPEC.md → 09_NON_FUNCTIONAL_CONTRACT.md → 01_DOMAIN_MODEL.md → this document |
| `03_WORKFLOW_STATE_MACHINE.yaml` | _SSOT_FINAL.md → 00_MASTER_SPEC.md → 09_NON_FUNCTIONAL_CONTRACT.md → this file |
| `07_RBAC_MATRIX.yaml` | _SSOT_AUTH.md §4 → 09_NFR §8 → this file |
| `05_API_CONTRACT.yaml` | 00_MASTER_SPEC.md, schema.prisma, 07_RBAC_MATRIX.yaml, 03_WORKFLOW_STATE_MACHINE.yaml (no order) |

**Problem**:
- 4 orderings berbeda untuk kontrak yang sama. Domain arsitek bilang "this document" menang atas SSOT, tapi MASTER_SPEC bilang SSOT > NEX spec.
- Apakah `_SSOT_FINAL.md` masuk top tier? MASTER_SPEC §9.4 tidak menyebut secara eksplisit, tapi dokumen lain klaim "SSOT > MASTER_SPEC".
- RBAC punya order berbeda sendiri (auth > nfr > this).

**Rekomendasi**:
1. Pilih satu canonical: MASTER_SPEC §9.4 adalah best (paling lengkap).
2. Setiap kontrak **harus** reference: "Per `00_MASTER_SPEC.md §9.4`" bukan definisikan ulang.
3. Hapus definisi `authority_order` lokal di setiap kontrak kecuali untuk **sub-authority** yang spesifik.

---

## X-5. DEC NUMBERING — 2 angka berbeda

| Sumber | Klaim |
|--------|-------|
| `00_MASTER_SPEC.md §9.1` | "**26 LOCKED decisions** + 9 PENDING" (DEC-001..026 LOCKED) |
| `04_BUSINESS_RULES.md §1.2` | "**DEC-001..034 (LOCKED)**" = 34 |
| BUSINESS_RULES referensi DEC-028 (line 899) | DEC-028 exists |

**Conflict**: 26 vs 34. Mana yang benar?

**Hypothesis**:
- _PROCESS_DECISIONS_LOG.md (offline, 11KB referenced) adalah ground truth.
- Kemungkinan: 26 LOCKED + 8 baru di BUS-RULES references (DEC-027..034).
- Atau: BUS-RULES outdated references, actual 26.

**Fix**:
1. Verify `_PROCESS_DECISIONS_LOG.md` content.
2. Sync semua referensi.
3. BUSINESS_RULES juga reference DEC-024, DEC-015, DEC-017, DEC-019, DEC-005, DEC-009 — semua ≤ DEC-026. Jadi DEC-028 di line 899 adalah suspect.

---

## X-6. MODULE/DOMAIN/SECTION COUNT

| Sumber | Klaim | Item |
|--------|-------|------|
| `00_MASTER_SPEC.md §1.1` | "**9 ERP domains**" | Sales, Purchase, Production, R&D, Warehouse, Finance, HR, Marketing, SCM |
| `00_MASTER_SPEC.md §2.1` | **10 modules** tabel | + Dashboards |
| `00_MASTER_SPEC.md §7.1` | **12 modules** build order | + Auth & Master Data & HR & SCM |
| `01_DOMAIN_MODEL.md §1.1` | **10 sections** | Auth, Master, Sales, Purchase, Production, Warehouse, Finance, Checklist, HR, Communication |
| `06_SCREEN_CONTRACT.json` modules keys | **15** | auth, users, master, sales, purchase, production, warehouse, rnd, finance, checklist, reports, dashboards, system, communication, audit |

**Analisis**:
- "9 ERP domains" = top-level business areas (functional)
- "10 modules" = NEX buildable units (tambah dashboards)
- "12 modules" = dengan Auth & Master Data sebagai foundation
- "10 sections" = schema.prisma grouping (different organization!)
- "15 modules" = screen catalog organization (tambah reports, system, audit)

**Terminology chaos**: domains ≠ modules ≠ sections. Belum ada glosarium yang membedakan ketiganya.

**Fix**:
1. Definisikan hirarki eksplisit:
   - **Domain** = business area (9): Sales, Purchase, Production, R&D, Warehouse, Finance, HR, Marketing, SCM
   - **Module** = NEX buildable unit (12): + Auth, Master Data, Dashboards
   - **Section** = schema.prisma group (10): Auth, Master, Sales, Purchase, Production, Warehouse, Finance, Checklist, HR, Communication
   - **Catalog module** = screen contract organization (15): + users, reports, system, communication, audit
2. Update semua dokumen dengan terminology yang konsisten.

---

## X-7. FORMAT KODE UNIVERSAL — Inconsistent application

| Entity | Code Format | File:Line |
|--------|-------------|-----------|
| CustomerCategory | `CC-YYMM-XXXX`? | TBD |
| Customer | (auto) | Domain Model §4 |
| Supplier | (auto) | Domain Model §4 |
| Goods | (auto) | Domain Model §4 |
| SalesSample | `BSP-YYMM-XXXX` | line 506 |
| SalesDownPayment | `DPJ-YYMM-XXXX` | line 522 |
| SalesOrder | `SO-YYYYMMDD-XXXX` (global sequence) | line 537 |
| SalesInvoice | `FJ-YYMM-XXXX` | line 577 |
| SalesPayment | `BPJ-YYMM-XXXX` | line 604 |
| PurchaseOrder | `PO-YYYYMMDD-XXXX` (global sequence, REQUIREMENT Poin 56) | line 722 |
| PurchaseDownPayment | `DPB-YYMM-XXXX` | line 763 |
| GoodsReceipt | `GR-YYMM-XXXX` | line 779 |
| PurchaseInvoice | `FP-YYMM-XXXX` | line 816 |
| PurchasePayment | `BPB-YYMM-XXXX` | line 845 |
| DeliveryOut | `DO-YYYYMMDD-XXXX` | line 1033 |
| JournalEntry | `JU-YYMM-XXXX` | line 1155 |
| FixedAsset | `AST-YYYYMMDD-XXXX` (global sequence, REQUIREMENT Poin 28) | line 1206 |

**Inconsistency**: 
- YYMM vs YYYYMMDD format dipakai mixed. 
- SalesOrder, PurchaseOrder, DeliveryOut, FixedAsset = global sequence (YYYYMMDD).
- Lainnya = per-bulan (YYMM).
- DEC-020 reference: "Format Kode Universal" — apakah ada dua varian? Atau drift?

**Rekomendasi**: Konsolidasi jadi 1 format atau dokumentasikan kapan pakai yang mana.

---

## X-8. ORPHAN / LEGACY ROLE CLEANUP

| DEC-023 | Says | Actual RBAC |
|---------|------|-------------|
| "Role 10 (Production Mixing & Filling, 0 users) is **ORPHAN** and is **NOT migrated**" | Hapus / skip | Entry masih ada: `role-nex-orphan-production-mixing-filling` (line 14), `role-nex-production-mixing-filling` (line 508) |

**Conflict**: DEC bilang "not migrated", tapi RBAC masih mendefinisikan role dengan ID eksplisit. Apakah ini untuk referensi legacy_id mapping atau memang masih dipakai?

**Fix**: Tandai dengan flag `is_legacy_migration: true, is_active: false, is_system: false` agar jelas.

---

## X-9. THREE-WAY MATCH HIDDEN (DEC-023 vs REQUIREMENT)

- **DEC-023 (atau DEC-XXX)**: "Three-way Match (PO ↔ GR ↔ Invoice) HIDDEN in NEX per REQUIREMENT §2 Poin 5"
- **BUS-RULE-023**: "PO + Invoice Matching: 3-way di-HIDE"

**Note**: Decision log reference DEC-023 salah — DEC-023 tentang ORPHAN role, bukan three-way match. Three-way match decision harus DEC terpisah (mungkin DEC-029 atau DEC-030?).

**Fix**: Verifikasi DEC ID untuk three-way match hidden.

---

## X-10. FILE LOCATION DRIFT

Beberapa dokumen reference file yang tidak ada di `contracts/`:

| Reference | Folder | Di contracts? |
|-----------|--------|---------------|
| `_SSOT_FINAL.md` | `docs/legacy-erp/` | ❌ |
| `_SSOT_AUTH.md` | `docs/legacy-erp/` | ❌ |
| `_SSOT_COMMUNICATION.md` | `docs/legacy-erp/` | ❌ |
| `_SSOT_KPI_BENCHMARK.md` | `docs/legacy-erp/` | ❌ |
| `_PROCESS_DECISIONS_LOG.md` | `docs/legacy-erp/` | ❌ |
| `NEX_ERP_MASTER_SPECIFICATION.md` | `docs/legacy-erp/` | ❌ |
| `NEX_FINANCE_FINAL_SPEC.md` | `docs/legacy-erp/` | ❌ |
| `NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md` | `docs/legacy-erp/` | ❌ |
| `NEX_ERP_SCREEN_AND_API_CATALOG.json` | `docs/legacy-erp/` | ❌ |
| `REQUIREMENT.md` | `docs/legacy-erp/` | ❌ |
| `KPI_REFERENCE.md` | `docs/legacy-erp/` | ❌ |
| `LEGACY_ERP_SPEC.md` | `docs/legacy-erp/` | ❌ |
| `LEGACY_ERP_AUDIT.md` | `docs/legacy-erp/` | ❌ |
| `README.md` | `docs/legacy-erp/` | ❌ |
| `01-09_IMPLEMENTATION_CONTRACT.md` | `contracts/` | ❌ (renamed/dropped?) |
| `02-09_MODULE_CONTRACT.md` | `contracts/` | ❌ |
| `10_DASHBOARD_REPORTING_CONTRACT.md` | `contracts/` | ❌ |

**Findings**:
- MASTER_SPEC §9.2 references 11 implementation contracts (`01..10` + master), tapi di folder `contracts/` hanya ada `00..10` dengan format berbeda.
- File `01_AUTH_RBAC_CONTRACT.md`, `02_MASTER_DATA_CONTRACT.md`, dst yang referenced **TIDAK ADA** — yang ada hanya `01_DOMAIN_MODEL.md`, `07_RBAC_MATRIX.yaml`, dst.

**Implication**: Ada **dua set kontrak paralel** — yang lama (numbered 01-10 di referenced docs) dan yang baru (00_MASTER_SPEC + 01_DOMAIN_MODEL, 02_DATA_OWNERSHIP, dst). Apakah migrasi selesai atau half-done?

**Fix**:
1. Decide: kontrak baru (saat ini) yang canonical.
2. Hapus references ke kontrak lama di MASTER_SPEC §9.2.
3. Atau rename file existing supaya match.

---

## X-11. UNRESOLVED BUSINESS RULES

BUSINESS_RULES file Lampiran B (Open Questions untuk User) adalah area yang perlu input:

- Setiap "open question" harus punya DEC atau OD entry.
- 9 PENDING decisions di MASTER_SPEC §8.3 — apakah ini match dengan lampiran B?

**Cross-check**: MASTER_SPEC §8.3 punya 9 PENDING (OD-1..OD-9). BUSINESS_RULES Lampiran B harus punya 9 yang sama.

---

## X-12. SCREEN vs ENTITY vs API vs WORKFLOW TRACEABILITY

Untuk verify apakah setiap screen punya minimal 1 API endpoint, setiap entity punya workflow state, setiap workflow punya business rule:

```
Screen → API endpoint (1:1 typically, but can be 1:N for detail screens)
API endpoint → Entity (N:1 typically, action targets 1 entity)
Entity → Workflow state machine (1:1 mandatory)
Workflow state transition → Business rule trigger (N:M, multiple rules can gate 1 transition)
```

**Missing cross-references**:
- 89 entities (schema) — berapa yang punya workflow definition di `03_WORKFLOW_STATE_MACHINE.yaml`? (sections: Sales, Purchase, Production, R&D, Checklist, Warehouse, Finance, HR — 8 pipelines, tapi belum dicek entity-per-entity coverage).
- 178 screens — berapa yang punya API endpoint di `05_API_CONTRACT.yaml`? (97 paths, jadi banyak screens share endpoint).
- 105 business rules — berapa yang sudah ter-implement jadi API guard atau DB constraint?

**Fix**: Lihat `10_TRACEABILITY_MATRIX.yaml` — apakah coverage matrix ini up-to-date? (sudah dicek ada 9 sections: requirements, business_rules, workflows, entities, api_endpoints, screens, tests, gaps, index).

---

## X-13. ID NAMING INCONSISTENCY

| Pattern | Used in | Example |
|---------|---------|---------|
| `role-nex-*` | RBAC roles | `role-nex-super-admin` |
| `nex_role:` | RBAC matrix references | line 2278 |
| `SCR-XXX` | Screen IDs (numeric) | SCR-001 |
| `SCR-DASH-XXX`, `SCR-SYS-XXX` | Special screens | SCR-DASH-001 |
| `BUS-RULE-XXX` | Business rules | BUS-RULE-005 |
| `/api/v1/<module>/<action>` | API paths | `/sales/orders` |

**Pattern tidak konsisten** — `role-nex-*` pakai dash, `nex_role:` pakai underscore. Screen IDs mostly numeric tapi ada namespace variant.

**Fix**: Tentukan satu ID convention.

---

## X-14. VERSIONING & CHANGELOG

| File | Has changelog? |
|------|----------------|
| 00_MASTER_SPEC.md | ❌ |
| 01_DOMAIN_MODEL.md | ❌ |
| 02_DATA_OWNERSHIP.yaml | ❌ |
| 03_WORKFLOW_STATE_MACHINE.yaml | ⚠️ §16 "CHANGELOG & DEC ENTRIES REQUIRED" tapi kosong |
| 04_BUSINESS_RULES.md | ❌ |
| 05_API_CONTRACT.yaml | ❌ |
| 06_SCREEN_CONTRACT.json | ❌ |
| 07_RBAC_MATRIX.yaml | ❌ |
| 08_INTEGRATION_EVENT_CONTRACT.yaml | ❌ |
| 09_NON_FUNCTIONAL_CONTRACT.md | ❌ |
| 10_TRACEABILITY_MATRIX.yaml | ❌ |
| schema.prisma | ❌ |

**Issue**: 11/12 file tidak punya changelog. Audit trail tidak ada. Siapa yang mengubah apa dan kapan?

**Fix**: Tambah minimal version history di setiap dokumen (`version: 1.0, 1.1, 2.0`) + DEC ID reference untuk setiap perubahan.

---

## X-15. STATUS INCONSISTENCY (semua LOCKED tapi ada TBD)

Semua dokumen diklaim `status: LOCKED`, tapi:
- `01_DOMAIN_MODEL.md §15`: 7+ TBD entries (migration mapping).
- `03_WORKFLOW_STATE_MACHINE.yaml §16`: CHANGELOG kosong (placeholder).
- `00_MASTER_SPEC.md §8.3`: 9 PENDING decisions.
- `07_RBAC_MATRIX.yaml`: 1 duplicate ID.
- `06_SCREEN_CONTRACT.json`: Count drift.
- `02_DATA_OWNERSHIP.yaml`: kemungkinan delegations belum lengkap.

**Definisi "LOCKED"**: apakah "no more changes allowed" atau "stable, changes via DEC only"?

**Rekomendasi**:
1. Define LOCKED status lebih ketat — checklist minimum (zero TBD, zero duplicates, zero count drift, all cross-refs valid).
2. Atau downgrade file yang punya gap ke DRAFT/STABLE.

---

## X-16. RECOMMENDED CROSS-DOC FIX ORDER

1. **Sync entity count** (schema → docs) — 30 menit.
2. **Sync role count** (RBAC actual → docs) — 30 menit.
3. **Sync screen count** (screen contract → MASTER_SPEC) — 5 menit.
4. **Fix RBAC duplicate ID** — 15 menit.
5. **Pick single authority order** (MASTER_SPEC §9.4) — 30 menit.
6. **Verify DEC count** (against _PROCESS_DECISIONS_LOG.md) — 15 menit.
7. **Reconcile file references** (decide which set of contracts is canonical) — 1 jam.
8. **Add changelog/version history** ke setiap dokumen — 2 jam.
9. **Verify trace matrix completeness** — 1 jam.
10. **Document Format Kode Universal variance** — 30 menit.

**Total estimated effort**: ~6-7 jam untuk P0+P1.
