# PROCESS — Decisions Log

> **PROCESS DOC** (bukan spec). Catatan semua keputusan yang dibuat untuk SSOT dan implikasinya.
> File ini adalah **meta-artifact** tentang how we build NEX — tidak map ke legacy entity apapun.
> Versi: 1.0 | Tanggal: 2026-09-16 | Workflow: **Doc-first** (ubah dokumen dulu sebelum implementasi)

**Perbedaan dengan `_SSOT_*.md`**:
- `_SSOT_*.md` = spec doc untuk functionality (apa yang kita build)
- `_PROCESS_*.md` = process doc untuk workflow (gimana kita kerja)

---

## Cara Pakai Dokumen Ini

1. Sebelum **perubahan apa pun** ke codebase NEX ERP, cek apakah keputusan terkait sudah ada di sini
2. Kalau keputusan baru dibuat, **tambah entry** di sini dengan rationale
3. Kalau keputusan direvisi, tambahkan entry baru (jangan edit yang lama — history penting)
4. Setiap entry di-trace ke spec doc yang relevan (`_SSOT_AUTH.md`, `_SSOT_COMMUNICATION.md`, dst.)

---

## Decisions Log

### DEC-2026-09-16-001 — Single Source of Truth (SSOT) Folder

**Topik**: Lokasi SSOT
**Keputusan**: `docs/legacy-erp/` adalah satu-satunya folder SSOT. Semua reference docs (requirement, spec, finance, auth, communication, KPI, legacy crawl) hidup di sini.
**Rationale**: User ingin 1 folder untuk semua referensi. Single source eliminates ambiguity.
**Implikasi ke code**: Tidak ada. Hanya dokumentasi.
**Spec doc affected**: All
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-002 — Documentation-First Workflow

**Topik**: Workflow perubahan
**Keputusan**: Untuk mengubah **apa pun** (database, backend, frontend), **ubah spec doc dulu**. Implementasi mengikuti spec yang sudah di-update.
**Rationale**: User explicit. Hindari drift antara code dan dokumentasi.
**Workflow**:
1. Update spec doc di `docs/legacy-erp/_SSOT_*.md`
2. Review & approval (jika ada)
3. Implement (DB → backend → frontend)
4. Update audit trail
**Spec doc affected**: All
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-003 — Authentication Strategy

**Topik**: Auth mechanism
**Keputusan**: **JWT (Access Token) + Refresh Token rotation**, long-lived session.
**Rationale**: User "menyesuaikan aja yang emang lebih long lived aja" — production staff butuh session yang tidak mudah logout. Refresh token rotation = best practice + security.
**Detail**: Lihat `_SSOT_AUTH.md`
**Spec doc affected**: `_SSOT_AUTH.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-004 — Communication Protocol Scope

**Topik**: Fitur komunikasi internal
**Keputusan**: **Notes + Document Transfer Status + Tags (@mention) + Cross-Reference Comments**. **TIDAK ADA** real-time chat.
**Rationale**: User explicit "ga ada chat real time" + "notes, document transfer, status, bisa di luar WA jadi full di dalam ini".
**Detail**: Lihat `_SSOT_COMMUNICATION.md`
**Spec doc affected**: `_SSOT_COMMUNICATION.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-005 — KPI Benchmark Scope

**Topik**: KPI benchmark reference
**Keputusan**: **National + Global, multi-industry** (tidak fokus ke satu industri). Per-person KPI **SKIP dulu**.
**Rationale**: User "industri reference nya ke nasional dan global ga usah fokus ke salah satu industri juga ga apa apa si". Per-person "saat ini belum ada keputusan fix".
**Detail**: Lihat `_SSOT_KPI_BENCHMARK.md`
**Spec doc affected**: `_SSOT_KPI_BENCHMARK.md`, `KPI_REFERENCE.md` (targets)
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-006 — Old ERP Shutdown

**Topik**: Timeline migrasi legacy
**Keputusan**: Old ERP `kil.gserp.id` shutdown dalam **6-9 bulan** (aman sampai **1 tahun**). Parallel run minimal 2-4 minggu.
**Rationale**: User "6-9 bulan lagi tapi aman kalau belum lanjut juga" + "1 tahun an".
**Implikasi**: New ERP harus bisa handle data migrasi dari old + parallel operation sementara.
**Spec doc affected**: SSOT_FINAL §7 (Migration Strategy)
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-007 — Stock Intelligence Module

**Topik**: ABC Analysis backend service
**Keputusan**: **REMOVE** dari NEX scope. Saat ini stub returning empty array.
**Rationale**: User "stock intelligence remove". Service tsb tidak ada rencana jelas kapan diisi logic riil.
**Implikasi**: Hapus `backend/src/modules/warehouse/services/stock-intelligence.service.ts`. Jangan reference di frontend.
**Spec doc affected**: NEX spec (Master Data Warehouse section)
**Status**: ✅ LOCKED — needs code removal

---

### DEC-2026-09-16-008 — Finance Module Source of Truth

**Topik**: Acuan spec finance
**Keputusan**: `NEX_FINANCE_FINAL_SPEC.md` adalah SSOT untuk modul Finance. Sudah rekonsiliasi dari 3 sumber (D365-inspired spec + REQUIREMENT.md + legacy).
**Rationale**: User "finance nya yang di @NEX_FINANCE_FINAL_SPEC.md". Doc ini udah paling lengkap.
**Format**: Setiap halaman finance punya: Legacy URL, Table Columns, Form Fields, Cards (NEW), Status Flow, Business Logic, Journal Posting, Ref.
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-009 — Requirement Source

**Topik**: Acuan requirement user (Upii)
**Keputusan**: `REQUIREMENT.md` adalah acuan requirement bisnis. **SELALU MENANG** di atas default behavior (per NEX_FINANCE_FINAL_SPEC §1).
**Rationale**: Requirement Upii adalah konfirmasi final. Tidak boleh di-override.
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-010 — Live ERP Baseline Reference

**Topik**: Sumber kebenaran untuk functional parity
**Keputusan**: `kil.gserp.id` (live) adalah baseline operasional riil. `NEX_ERP_SCREEN_AND_API_CATALOG.json` (176 screens) adalah target build. **Gap = 18.18%** (32 screens, mostly 31 expansion + 1 defect).
**Rationale**: Existing SSOT patokan (`NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md`).
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-011 — Auth Data Extraction from Legacy

**Topik**: Migrasi data auth
**Keputusan**: **YA**, tarik semua data auth dari legacy (`/account`, `/user-manage`, `/role-manage`, `/activity-log`) di Phase 6 (migration prep).
**Rationale**: User explicit "apakah bisa nanti kamu tarik semua data auth termasuka access masing masing role dan account dari erp yang lama".
**Implikasi**: Tambahkan Phase 6 task. Passwords akan di-rehash dengan bcrypt (12 cost factor) — migrated users HARUS reset password di first login.
**Spec doc affected**: `_SSOT_AUTH.md` §5
**Status**: ✅ LOCKED — task pending

---

### DEC-2026-09-16-012 — Tag User Feature Required

**Topik**: Mention/tag di notes & comments
**Keputusan**: **YA**, tag/@mention adalah fitur wajib untuk notes dan comments. Notifikasi in-app + email.
**Rationale**: User "tag aku butuh".
**Detail**: Lihat `_SSOT_COMMUNICATION.md` §4
**Spec doc affected**: `_SSOT_COMMUNICATION.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-013 — Cross-Reference Comments Limited Scope

**Topik**: Comment yang link ke entity lain
**Keputusan**: Comments **BISA** cross-reference ke entity lain **HANYA jika memang berkaitan** (user explicit "comment bisa yang emang bersangkutan aja").
**Rationale**: Hindari comment spam yang link ke entity random.
**Implikasi**: UX harus discourage link random. Mungkin perlu confirmation "is this comment related to [other entity]?"
**Spec doc affected**: `_SSOT_COMMUNICATION.md` §5
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-014 — Crawl Coverage Strategy

**Topik**: Strategi reconnaissance live ERP
**Keputusan**: Crawl 93 representative URLs (5 domains × 18-22 URLs). Bukan full 138 URLs karena terlalu noisy. Fokus ke pipeline + master data + reports.
**Rationale**: Efficient use of agents + parallel crawl.
**Hasil**: 89 of 93 returned 200, 4 returned 404 (semua `/create` child entities — created from parent detail).
**Spec doc affected**: SSOT_FINAL §2
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-015 — Cart Pattern Preservation

**Topik**: Multi-line item forms (sales, purchase)
**Keputusan**: Pertahankan **cart pattern** dari legacy: `/{module}/add-cart`, `get-cart`, `delete-cart`, `clear-cart`.
**Rationale**: Session-backed cart allows multi-line items with single submit.
**Implikasi**: Backend NestJS implement Redis-backed cart store. Frontend pakai optimistic update.
**Spec doc affected**: SSOT_FINAL §4.1
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-016 — Child Entity Creation Pattern

**Topik**: Goods Receipt, Sales Invoice, Purchase Invoice creation
**Keputusan**: **TIDAK** ada standalone `/create` URL. Dibuat via button di **parent detail view** (e.g., Sales Order detail → "Buat Faktur").
**Rationale**: 4 dari 4 halaman 404 confirm pattern ini di legacy.
**Spec doc affected**: SSOT_FINAL §4.3
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-017 — `sales_details_id` as Bridge Field

**Topik**: Foreign key untuk traceability lintas pipeline
**Keputusan**: Field `sales_details_id` adalah **bridge** antara Sales Order → Batch Record → Schedule → Production → Delivery.
**Rationale**: Setiap stage stores and forwards the same `sales_details_id`.
**Implikasi**: DB schema HARUS preserve FK ini. Migration tidak boleh orphan records.
**Spec doc affected**: SSOT_FINAL §3.3
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-018 — Parallel Routes in Finance (jurnal-umum vs general-journal)

**Topik**: Dua route paralel untuk Jurnal Umum di NEX build
**Keputusan**: Kedua route dipertahankan selama migrasi dan wajib memakai satu backend/store canonical; satu route canonical dipilih saat cutover Phase 7.
**Rationale**: Menjaga parity navigasi tanpa mengizinkan dua sumber data. `00_MASTER_SPEC.md` menetapkan periode migrasi dan cutover sebagai batas keputusan route publik.
**Status**: ✅ LOCKED — resolved 2026-09-17

---

### DEC-2026-09-16-019 — Finance Mock Fallback Removal

**Topik**: Finance dashboard uses `FALLBACK_*` arrays
**Keputusan**: **HARUS HAPUS** FALLBACK arrays. UI harus show error banner "API unavailable" jika gagal.
**Rationale**: Per `ERP_INPUT_OUTPUT_LINEAGE §3.2` — financial misrepresentation risk jika UI show fake numbers tanpa warning.
**Spec doc affected**: Frontend finance dashboard
**Status**: ✅ LOCKED — needs code change

---

### DEC-2026-09-16-020 — Format Kode Universal

**Topik**: Auto-generated document codes
**Keputusan**: Format kode: `kode-perusahaan-divisi-produk-tanggal-nomor-urut` (lengkap) ATAU `produk-tanggal-nomor-urut` (ringkas).
**Rationale**: Per `REQUIREMENT Poin 64-65`. Nomor urut global & berkelanjutan.
**Implikasi**: Backend generator function shared across modules.
**Spec doc affected**: All transaction modules
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-021 — reCAPTCHA Key Rotation

**Topik**: reCAPTCHA site key leaked in `/setting` legacy page
**Keputusan**: Generate **fresh reCAPTCHA key pair** for NEX domain (`nexerp.id`). Do NOT reuse legacy.
**Rationale**: Legacy `/setting` exposes reCAPTCHA site key (`6LdkxfMpAAAAADsmqCk-NXoVFymJ9RN5VesPdWvt`). Even site key is public, full pair must be rotated for security hygiene + domain-specific.
**Implikasi**: Register NEX domain at `google.com/recaptcha`, store new keys in env (server-side only).
**Spec doc affected**: `_SSOT_AUTH.md` §11.1
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-022 — Legacy Password Hash Verification

**Topik**: Confirm bcrypt vs md5 vs sha1 used in legacy DB
**Keputusan**: **Cannot determine from DOM**. Need **DB sampling** during migration prep (Phase 6 step 0).
**Rationale**: Per crawl analysis — login posts plaintext over HTTPS, no client-side hashing, CI3 framework likely uses `password_hash()` (bcrypt) but could be md5/sha1 from older CI version.
**Action**: Before migration, dump ONE sample password hash from legacy DB → compare format → confirm algorithm. Document result in `_SSOT_AUTH.md` §11.
**Spec doc affected**: `_SSOT_AUTH.md` §5.4
**Status**: ⏳ PENDING (Phase 6 task)

---

### DEC-2026-09-16-023 — Orphan Role Cleanup

**Topik**: Role 10 "Production Mixing & Filling" has 0 users
**Keputusan**: **DELETE** role 10 before migration.
**Rationale**: Orphan role with 0 users in legacy. No reason to migrate unused data.
**Action**: Before Phase 6 migration, remove role 10 from legacy DB (or map to null during migration).
**Spec doc affected**: `_SSOT_AUTH.md` §5.5
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-024 — Permission Slug Preservation

**Topik**: Kebab-case permission slugs from legacy
**Keputusan**: **Preserve verbatim** as canonical permission keys in NEX. 55 sub-module + 22 dashboard widget slugs (77 total).
**Rationale**: Easier migration, auditability, consistent UI (user sees same module names). No reason to rename.
**Spec doc affected**: `_SSOT_AUTH.md` §5.3
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-025 — Legacy Role ID Preservation Strategy

**Topik**: Legacy role IDs 1-16 in NEX schema
**Keputusan**: NEX uses **UUID primary keys**, but preserve legacy IDs in `Role.legacyId` and `User.legacyRoleId` fields for migration traceability + historical audit.
**Rationale**: UUIDs are NEX standard (per existing Prisma schema). Legacy IDs preserved for analytics/reporting that references old system.
**Spec doc affected**: `_SSOT_AUTH.md` §5.4
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-026 — Auth Data Extraction Completion

**Topik**: Migrate all auth data from legacy
**Keputusan**: Auth data extraction **COMPLETE** 2026-09-16 via subagent. Found 45 users, 16 roles, 77 permissions, 4,989 activity log entries. Documented in `_SSOT_AUTH.md` §5 + `_crawl/auth/_auth_extract.json`.
**Rationale**: User requested "tarik semua data auth termasuka access masing masing role dan account dari erp yang lama" — done.
**Spec doc affected**: `_SSOT_AUTH.md` §5 (complete), `_crawl/auth/*` (raw data)
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-027 — Soft-Delete Enforced at Prisma Middleware

**Topik**: Soft-delete implementation pattern
**Keputusan**: Auto-filter `deletedAt IS NULL` di Prisma middleware level, **bukan per-call boilerplate**. Admin bisa override via explicit `includeDeleted: true` (audit-required).
**Rationale**: Reduces per-call boilerplate + prevents accidental leak of deleted records. Single point of enforcement.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §5
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-028 — IDR as Integer in API (Smallest Unit)

**Topik**: Currency representation
**Keputusan**: IDR stored as `DECIMAL(18,2)` di DB, tapi transmitted as **integer (smallest unit = Rupiah)** over API. No float drift, no conversion logic.
**Rationale**: Since IDR has no subunit (Rp 100.50 doesn't exist), this avoids confusion. UI formats with thousand separator + decimal place per locale.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §3
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-029 — Audit Log 3-Tier Retention

**Topik**: Audit log retention policy
**Keputusan**: **3-tier retention**: hot 1 year → cold 5 years → permanent (for financial events, role changes, auth events per UU28/2007 compliance).
**Rationale**: Indonesian UU28/2007 mandates 5-year retention for financial records. Hot storage for active queries (90 days for performance), cold for compliance, permanent for critical events.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §6
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-030 — Canonical Error Code in API Response

**Topik**: API error response format
**Keputusan**: Single canonical error code (`error.code` field). Frontend switches on code (NOT HTTP status), and localizes via `t('errors.{code}')`. New codes require registration in `05_API_CONTRACT.yaml`.
**Rationale**: Decouples frontend from HTTP status, easier i18n, consistent UX.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §9, §19
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-031 — Idempotency Keys for State-Changing Ops

**Topik**: Retry safety for distributed ops
**Keputusan**: Idempotency keys supported on all `POST`/`PUT`/`DELETE` with **24h TTL** cache. Client sends `Idempotency-Key: <UUID>` header.
**Rationale**: Critical for retry safety in distributed operations (e.g., payment submissions, approval clicks). Prevents duplicate transactions.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §9
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-032 — Performance Floor Enforcement + Coverage Gate

**Topik**: Quality gates
**Keputusan**: Pages missing FCP/LCP targets are **P1 bugs (not goals)**. CI blocks merge if unit test coverage drops below **70% for `src/services/**` and `src/business-rules/**`**.
**Rationale**: Enforce performance + coverage as quality gate, not nice-to-have.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §12, §16
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-033 — Data Residency Locked to Indonesia

**Topik**: Data sovereignty
**Keputusan**: All data stored in **Indonesia** (Biznet NEO VPS per master spec). No cross-border financial data transfer without explicit consent.
**Rationale**: Aligns with UU PDP (Indonesian personal data protection). No international cloud for MVP.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §18
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-034 — Direct-to-S3 File Upload with Presigned URLs

**Topik**: File upload architecture
**Keputusan**: Upload via **direct-to-S3 with presigned PUT URLs** (not via backend). Server only validates permission + issues presigned URL + confirms upload. Supports multipart for large files.
**Rationale**: Avoids backend bottleneck, supports parallel chunked uploads, scales better.
**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` §10
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-035 — All 11 Implementation Contracts LOCKED

**Topik**: Implementation contract layer completion
**Keputusan**: All **11 implementation contracts + schema.prisma** completed and LOCKED 2026-09-16.
- `00_MASTER_SPEC.md` (48KB) — scope, modules, actors, glossary, 52 principles
- `01_DOMAIN_MODEL.md` (75KB) + `schema.prisma` (93KB) — 78 entities
- `02_DATA_OWNERSHIP.yaml` (51KB) — 74 entities with owners + 14 cross-module rules + 7 delegations
- `03_WORKFLOW_STATE_MACHINE.yaml` (101KB) — 36 entities, 129 transitions, 94 forbidden
- `04_BUSINESS_RULES.md` (82KB) — 105 rules (Indonesian, 100% REQUIREMENT.md coverage)
- `05_API_CONTRACT.yaml` (230KB) — 297 operations, OpenAPI 3.0.3
- `06_SCREEN_CONTRACT.json` (359KB) — 178 screens across 11 modules
- `07_RBAC_MATRIX.yaml` (88KB) — 43 roles × 86 permissions
- `08_INTEGRATION_EVENT_CONTRACT.yaml` (36KB) — 59 events
- `09_NON_FUNCTIONAL_CONTRACT.md` (33KB) — NFR constraints
- `10_TRACEABILITY_MATRIX.yaml` (122KB) — full req → test trace

**Total**: 1.3 MB, 37,145 baris.

**Rationale**: User request: "build semua 11 (5 waves)". Plan approved. All docs generated by parallel AI agents dengan consistent cross-references. AI CLI now has implementation-ready contracts to generate code.

**Spec doc affected**: `_IMPLEMENTATION_CONTRACTS/*` (semua 11 docs)
**Status**: ✅ LOCKED — implementation contract layer complete

---

### DEC-2026-09-16-036 — 06_SCREEN_CONTRACT.json Supplemented After Network Failure

**Topik**: 06_SCREEN_CONTRACT.json initial agent network failure
**Keputusan**: Initial agent completed 74/178 screens (auth, users, master, sales, purchase), failed mid-Wave 4. Retry agent also failed. **Decision**: spawn supplement agent to add remaining 104 screens (production, warehouse, rnd, finance, checklist, reports, communication, audit, dashboards, system).
**Rationale**: Required total 178 screens for full coverage per NEX spec. Partial file unacceptable.
**Action**: Supplement agent completed. File now has 178 screens across 11 modules.
**Spec doc affected**: `06_SCREEN_CONTRACT.json`
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-037 — Folder Structure Restructure (Clean SSOT Hierarchy)

**Topik**: Folder structure clarity for AI CLI navigation
**Keputusan**: Restructure `docs/legacy-erp/` into 6 purpose-grouped subfolders + add `AGENTS.md` entry point:
- `ssot/` — 4 overview SSOT docs
- `process/` — 3 process docs (decisions, crawl, cleanup)
- `contracts/` — 11 LOCKED implementation contracts
- `reference/` — External specs (legacy + NEX base)
- `data/` — Raw data (crawl + master + analytics)
- `_archive/` — Historical project docs

Plus `AGENTS.md` at root as **AI CLI entry point** with:
- Authority order
- Task lookup table ("User says... → First file to read")
- File naming conventions
- Key principles + tech constraints
- Hard constraints (what NOT to do)
- How to add new decision

**Rationale**: User: "kita rancang agar struktur legacy_erp ini jadi bagus... ketika kau mention legacy_erp itu terstruktur, rapi dan bisa dengan mudah paham arah erp nya kemana". For AI CLI to navigate efficiently, need clear tier separation + entry point that explains HOW to read this folder.
**Action**: Restructured 2026-09-16. Root has 6 subfolders + README.md + AGENTS.md only. Old paths still work (file content unchanged), but new structure is canonical.
**Spec doc affected**: All paths in `_SSOT_FINAL.md` + `README.md` updated.
**Status**: ✅ LOCKED

---

### DEC-2026-09-16-038 — AGENTS.md Convention for AI CLI

**Topik**: How to make legacy_erp folder AI-CLI-friendly
**Keputusan**: Adopt `AGENTS.md` convention (used by many AI coding tools) as the **canonical AI CLI entry point** for this folder.
**Rationale**: When AI CLI encounters a complex folder, having a single "how to navigate me" doc (following the AGENTS.md convention used by Codex, Cursor, etc.) dramatically improves navigation. The AGENTS.md is auto-discovered by most tools and serves as a navigation guide.
**Spec doc affected**: `docs/legacy-erp/AGENTS.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-039 — Per-Person KPI and Communication Protocol Activated

**Topik**: KPI individu, dual-role, notes, dan mention
**Keputusan**: Pembatasan per-person pada DEC-2026-09-16-005 digantikan. KPI per orang masuk MVP, dihitung hanya dari event yang memiliki actor/evidence, mendukung assignment multi-role effective-dated, dan tidak menerima input skor manual. Notes/comments/@mention menjadi communication protocol lintas entity dengan parent ACL.
**Rationale**: Instruksi eksplisit pengguna 2026-09-17.
**Spec doc affected**: `contracts/00_MASTER_SPEC.md`, `01_DOMAIN_MODEL.md`, `schema.prisma`, `02_DATA_OWNERSHIP.yaml`, `04_BUSINESS_RULES.md`, `05_API_CONTRACT.yaml`, `06_SCREEN_CONTRACT.json`, `07_RBAC_MATRIX.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`, `10_TRACEABILITY_MATRIX.yaml`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-040 — Purchase Invoice Matching Uses Zero Tolerance

**Topik**: Konflik tolerance matching Purchase Invoice
**Keputusan**: Matching memakai empat leg (PO, GR, QC passed, Vendor Invoice) dengan tolerance quantity dan harga = 0. Setiap selisih menjadi `EXCEPTION` dan wajib direview manual; accuracy percentage tidak ditampilkan.
**Rationale**: `REQUIREMENT.md` final menonaktifkan pencocokan otomatis selisih nominal dan memiliki prioritas atas usulan tolerance kategori pada Finance spec. Empat leg dan hidden accuracy dari Finance spec tetap dipertahankan.
**Spec doc affected**: `contracts/04_BUSINESS_RULES.md` BUS-RULE-023 dan `03_WORKFLOW_STATE_MACHINE.yaml`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-041 — Evidence-Backed Open Decisions Reconciled

**Topik**: OD-1..OD-9, OD-SM-03..06, dan EVENT-DECISION-01..05
**Keputusan**: Session idle 30 menit; legacy user wajib reset password saat login pertama; notifikasi kritis per-event dan non-kritis daily digest; mobile push Phase 2; feed hanya internal dan WA untuk komunikasi eksternal; note menyimpan body terkini dengan seluruh edit di AuditLog; review benchmark manual; KPI dapat berbeda per divisi tetapi hasil individu hanya event-derived; dua route Finance berbagi satu store selama migrasi dan dipilih saat cutover. Workflow OD-SM-03..06 dan lima keputusan event mengikuti resolusi yang tertulis pada canonical owner masing-masing.
**Rationale**: Seluruh pilihan ini sudah memiliki requirement, NFR, keputusan locked, atau default eksplisit pada kontrak canonical; membiarkannya berstatus pending menciptakan kontradiksi dokumentasi.
**Spec doc affected**: `contracts/00_MASTER_SPEC.md`, `03_WORKFLOW_STATE_MACHINE.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`, `09_NON_FUNCTIONAL_CONTRACT.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-042 — Finished Goods Require QC Release

**Topik**: Ketersediaan Finished Goods setelah packaging
**Keputusan**: Packaging completion membuat stok `FG_QUARANTINE` dengan availability `QUARANTINE`. Hanya QC release idempotent yang memindahkannya ke `AVAILABLE`; reject mengikuti rework/scrap/hold dan tidak boleh menjadi sellable stock.
**Rationale**: Bukti warehouse/QC secara eksplisit memisahkan hasil packaging dari stok yang boleh dijual.
**Spec doc affected**: `contracts/schema.prisma`, `03_WORKFLOW_STATE_MACHINE.yaml`, `04_BUSINESS_RULES.md`, `08_INTEGRATION_EVENT_CONTRACT.yaml`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-043 — Phase P00 Stop-the-Line Containment Certified

**Topik**: Penahanan kredensial, perbaikan environment, validasi docker compose, dan pemetaan remediasi dependensi produksi
**Keputusan**: 
1. Seluruh plaintext kredensial pada dokumentasi (termasuk `_PROCESS_CRAWL_STATUS.md`) dan seed script (`seed-fase1-master.js`) disanitasi/dihapus; tidak ada kredensial aktif yang terlacak di git.
2. File `.env` lokal diperbaiki sintaksnya (spasi dan kutip bersarang pada baris 57-60) sehingga `docker compose config` parse bersih dengan exit code 0.
3. Seluruh 27 kerentanan tingkat *high* pada dependensi produksi backend dan 12 temuan *critical/high* pada frontend telah dikatalogkan dengan *approved remediation path* dan dipetakan ke fase target (P03, P04, P05, P17) dalam `verification/evidence/P00_STOP_THE_LINE_EVIDENCE.md`.
4. Diterapkan tiga script verifikasi deterministik: `scripts/security/secret_scan_with_history.js`, `scripts/security/validate_env.js`, dan `scripts/security/npm_audit_production.js`.
5. Status Fase P00 dinaikkan menjadi `PASS`.
**Rationale**: Syarat mutlak roadmap produksi penuh (`_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` dan `_PRODUCTION_PHASE_GATES.yaml`).
**Spec doc affected**: `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml`, `docs/legacy-erp/contracts/09_NON_FUNCTIONAL_CONTRACT.md`, `docs/legacy-erp/process/_PROCESS_CRAWL_STATUS.md`
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-044 — Strict DNA-Only UI Composition

**Topik**: Satu implementation boundary untuk seluruh UI NEX ERP  
**Keputusan**: Setiap canonical dan approved-extension application UI wajib mengimpor visual/interactive primitives hanya melalui barrel `@/components/dna`. Direct import ke DNA subpath, `@/components/ui/**`, Radix/shadcn/UI kit, raw interactive control, duplicated local primitive, dan hardcoded visual value dilarang di luar implementasi DNA. Canonical reference routes adalah `/visual-dna` dan `/visual-dna/golden-reference`; route `/dna-visual*` dan `/master/dna-visual*` hanya compatibility redirect sementara dan tidak boleh memiliki implementasi paralel. Golden reference wajib merender public DNA exports yang sebenarnya, bukan meniru melalui raw HTML/Tailwind.  
**Rationale**: Instruksi eksplisit pengguna 2026-09-17 agar setiap UI konsisten, mudah dirawat saat menerima 8–15 perubahan per bulan, dan tidak membangun komponen/hardcode manual di setiap halaman.  
**Enforcement**: Blocking AST/import, native-interactive, hardcoded-token, barrel/reference-integrity, visual, accessibility, responsive/browser, screen-coverage, dan exception-registry gates.  
**Spec doc affected**: `contracts/09_NON_FUNCTIONAL_CONTRACT.md §11A`, `verification/_UI_DNA_COMPLIANCE_STANDARD.md`, `verification/_PRODUCTION_PHASE_GATES.yaml`, `process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md`  
**Status**: ✅ LOCKED — implementation and migration enforced through P02/P03/domain phases/P19/P20/P22

---

### DEC-2026-09-17-045 — Phase P01 Business Certainty and SSOT Lock Certified

**Topik**: Penyelesaian 4 keputusan bisnis material untuk sertifikasi SSOT P01  
**Keputusan**: 
1. **OD-SM-01 (Option A — Separate Lineage)**: `FormulationAdjustment` memiliki riwayat terpisah dan tidak mengubah/meng-increment `rev_number` parent formula. Revisi baru hanya dibuat melalui workflow revisi formal (DRAFT Rev N+1 -> PENDING -> APPROVED -> LOCKED) guna menjaga batch reproducibility dan integritas regulatori BPOM.
2. **OD-SM-02 (Option A — Direct Cancellation Forbidden)**: Pembatalan langsung Sales Order setelah berstatus `IN_PRODUCTION` dilarang mutlak (`FORBIDDEN`). Penghentian pekerjaan akibat kendala operasional/klien wajib diselesaikan melalui alur terpisah: production termination, WIP disposition, scrap/material recovery, dan financial settlement.
3. **DECISION_REQUIRED-002 (Option A — Moving Weighted Average via Auditable Cost Ledger)**: Valuasi persediaan dan HPP menggunakan *Moving Weighted Average Cost* yang dicatat dan diaudit secara atomik dalam cost ledger/snapshot per legal entity dan item pada setiap penerimaan barang (Goods Receipt), retur pembelian, penyesuaian stok, dan reversal. Alur fisik barang (FIFO/FEFO) beroperasi secara independen dari akuntansi biaya rata-rata bergerak.
4. **DECISION_REQUIRED-003 (Option B — Governed Amendment Before IN_PRODUCTION)**: Amandemen data komersial SO setelah DP diterima diperbolehkan hanya sebelum masuk `IN_PRODUCTION`. SO masuk status `AMENDMENT_REVIEW`, jadwal produksi ditahan (*hold*), total dan selisih DP dihitung ulang (kekurangan ditagih via invoice DP tambahan, kelebihan dikreditkan/offset), dan memerlukan persetujuan bersama `BusDevManager` dan `FinanceManager`. Setelah `IN_PRODUCTION`, data komersial terkunci (*immutable*).
5. **Sertifikasi**: Status Fase P01 dinaikkan menjadi `PASS`. SSOT validator mencatat 19/19 gate PASS, 0 open decisions.

**Rationale**: Persetujuan dan instruksi eksplisit stakeholder/pengguna pada 2026-09-17.  
**Spec doc affected**: `contracts/03_WORKFLOW_STATE_MACHINE.yaml`, `contracts/04_BUSINESS_RULES.md`, `contracts/00_MASTER_SPEC.md`, `verification/_DECISIONS_REQUIRED.yaml`, `verification/_PRODUCTION_PHASE_GATES.yaml`  
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-046 — Phase P02 Contract-to-Code and Lifecycle Reconciliation Certified

**Topik**: Rekonsiliasi model kanonikal, operasi API, screen, adapter kompatibilitas, eliminasi route double-prefix, dan inventarisasi UI DNA  
**Keputusan**: 
1. **Normalisasi Route**: Menghapus deklarasi prefix redundant `'v1/'` pada 32 controller NestJS backend sehingga route ganda `/v1/v1` tereliminasi sepenuhnya dan seluruh endpoint beroperasi bersih di bawah global prefix `/v1/...`.
2. **Lifecycle Registry**: Menerbitkan `_LIFECYCLE_REGISTRY.json` yang memetakan 100% dari 92 model kanonikal, 100% dari 377 operasi API kanonikal, 100% dari 179 layar kanonikal, dan mengklasifikasikan seluruh 194 model implementasi serta 270 halaman frontend ke dalam klasifikasi kanonikal (`CANONICAL`, `APPROVED_EXTENSION`, `COMPATIBILITY_ADAPTER`, `DUPLICATE`, `DEPRECATED`, `DEAD_CODE`).
3. **Adapter & Redirects**: Mengatalogkan 5 adapter kompatibilitas lengkap dengan owner, alasan, dan syarat penghapusan; mengaktifkan redirect Next.js resmi dari `/dna-visual*` dan `/master/dna-visual*` ke `/visual-dna*`.
4. **Inventarisasi UI DNA**: Memvalidasi status impor dan visual hardcoded pada 270 layar frontend (213 impor `@/components/dna`, 37 `@/components/ui`) dengan disposisi migrasi lengkap menuju P19.
5. **Sertifikasi**: Status Fase P02 dinaikkan menjadi `PASS` setelah 14 dari 14 pengujian pada `scripts/ssot/audit_lifecycle_reconciliation.js` lulus 100%.

**Rationale**: Memenuhi seluruh 8 exit gates dan 14 required tests pada `_PRODUCTION_PHASE_GATES.yaml` tanpa waiver.  
**Spec doc affected**: `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml`, `docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json`, `docs/legacy-erp/verification/evidence/P02_CONTRACT_TO_CODE_RECONCILIATION_EVIDENCE.md`  
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-047 — Phase P03 Certification, Architecture Gates, and Deterministic Builds

**Topik**: Sertifikasi Fase P03 (Reproducible build architecture gates and CI)  
**Keputusan**: Sertifikasi resmi penyelesaian Fase P03 dengan status **PASS** setelah memenuhi seluruh 7 exit gates dan 21 required tests tanpa waiver.  
**Tindakan Pelaksanaan**:
1. **Reproducible Production Builds**:
   - Backend NestJS SWC build berhasil mengompilasi 478 file ke `dist/` dengan titik masuk standalone.
   - Frontend Next.js 16 build berhasil merender 259+ halaman statis/dinamis dan output standalone server.
2. **Deterministic Test Execution**:
   - Backend unit test suite stabil dengan parameter memory `--max-old-space-size=8192 --runInBand`, lulus 23/23 suites (259 passed, 0 failed).
   - Frontend unit test suite lulus 53/53 suites (348 passed, 0 failed).
3. **Zero-Error Static Analysis**:
   - Backend linting: 0 errors (`eslint "{src,apps,libs,test}/**/*.ts" --quiet`).
   - Frontend linting: 0 errors (`eslint --quiet`).
   - TypeScript compilation (`tsc --noEmit` & `tsc -p tsconfig.build.json`): 0 errors.
4. **Canonical UI DNA & Exception Registry**:
   - Rute spesifikasi dan referensi kanonikal didirikan di `/visual-dna` dan `/visual-dna/golden-reference`.
   - Rute legacy (`/master/dna-visual*`) dikonversi menjadi permanent redirect ke rute kanonikal.
   - Menerbitkan `frontend/src/components/dna/dna-exceptions.yaml` dengan 205 item kakek-buyut (grandfathered), valid terhadap skema 10-atribut dengan tanggal kedaluwarsa seragam `2026-12-31` (menjelang P19).
5. **CI Pipeline Hardening**:
   - `.github/workflows/ci.yml` diperbarui untuk menegakkan P00 (secret/env), P01 (SSOT), P02 (lifecycle reconciliation), dan P03 (architecture & DNA gates) pada fast-gate PR dan push-images.
6. **Sertifikasi**:
   - Pengujian terpadu `scripts/ssot/audit_p03_architecture_gates.js` lulus 21/21 pengujian (100% PASS).

**Rationale**: Memenuhi seluruh 7 exit gates dan 21 required tests pada `_PRODUCTION_PHASE_GATES.yaml` untuk P03.  
**Spec doc affected**: `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml`, `docs/legacy-erp/verification/evidence/P03_REPRODUCIBLE_BUILD_AND_CI_EVIDENCE.md`, `frontend/src/components/dna/dna-exceptions.yaml`  
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-048 — Maximum Five-Phase Independent Verification Batches

**Topik**: Cadence verifikasi dan shorthand audit fase  
**Keputusan**: Setiap fase tetap menjalankan scoped self-verification, tetapi independent deep audit dikelompokkan maksimal lima fase secara inklusif. Perintah singkat seperti `verifikasi fase 1-5` cukup untuk menjalankan protokol penuh dalam `verification/_BATCH_VERIFICATION_PLAN.md`. Range lebih dari lima fase otomatis dipecah. Sertifikasi tetap berurutan dan berhenti pada fase gagal pertama; fase setelahnya hanya boleh diperiksa secara diagnostik sampai dependency kembali PASS. P15 dan P19–P22 menerima audit dedicated-depth.  
**Rationale**: Mengurangi overhead audit berulang tanpa membiarkan defect terakumulasi melewati terlalu banyak dependency backend, frontend, database, finance, UI, dan operasi.  
**Spec doc affected**: `process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md`, `verification/_PRODUCTION_PHASE_GATES.yaml`, `verification/_BATCH_VERIFICATION_PLAN.md`, `AGENTS.md`  
**Status**: ✅ LOCKED

---

### DEC-2026-09-17-049 — Phase P04 Canonical Database and Migration Chain Certification

**Topik**: Sertifikasi Phase P04 (Database Canonical, Ledger Migrasi Prisma, dan Kebijakan Rollback/Expand-Contract)
**Keputusan**: 
1. Mengesahkan seluruh physical schema database PostgreSQL menjadi 100% konsisten antara `backend/prisma/schema/*.prisma` (194 models) dan rantai migrasi resmi di `backend/prisma/migrations/`.
2. Menerbitkan migrasi kanonikal `20260917000000_p04_canonical_database_alignment` yang menyelaraskan seluruh 41 migrasi historis dengan skema multi-file modular, menghilangkan kebutuhan akan `prisma db push` berbahaya di environment staging/production.
3. Seluruh script DDL migrasi dimodifikasi agar sepenuhnya idempoten (`DROP CONSTRAINT IF EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, guarded enums).
4. Menyediakan dan menguji skenario rollback `down.sql` serta re-deployment ulang tanpa data corruption (`rollback_rehearsal` PASS).
5. Memverifikasi kepatuhan *expand/contract* dan koeksistensi query versi N-1 dan N secara simultan.
6. Seluruh 8 pengujian gerbang P04 (`prisma_validate_generate`, `empty_db_migrate`, `baseline_upgrade`, `migration_idempotency`, `rollback_rehearsal`, `constraint_index_audit`, `expand_contract_compatibility`, `old_new_version_coexistence`) lulus 100% (8/8 PASS).

**Rationale**: Memenuhi seluruh 5 exit gates dan 8 required tests pada `_PRODUCTION_PHASE_GATES.yaml` untuk P04. Menghapus schema drift dan mengunci determinisme skema database NEX ERP.  
**Spec doc affected**: `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml`, `docs/legacy-erp/verification/evidence/P04_CANONICAL_DATABASE_AND_MIGRATION_CHAIN_EVIDENCE.md`  
**Status**: ✅ LOCKED

---

### DEC-2026-09-19-050 — Layered Diagnostic and Certification Execution

**Topik**: Mempercepat loop implementasi tanpa melemahkan sertifikasi fase
**Keputusan**: Setiap fase menyediakan diagnostic runner non-certifying yang memakai fungsi gate, mutation, oracle, dan threshold produksi yang sama dengan authoritative certifier. Eksekusi wajib mengikuti urutan inventory seluruh failure, clustering root cause, targeted group tests, cumulative preflight, satu authoritative certification, dan satu independent reproduction. Full certifier tidak menjadi inner development loop. Target normal adalah 10–120 detik per targeted group dan 5–8 menit untuk preflight; keterlambatan harus diatasi melalui shared setup, impact selection, fixture reuse, atau parallelism yang aman, bukan melalui pengurangan assertion.
**Rationale**: Runner monolitik P03–P05 menyebabkan satu defect lokal berulang kali memicu build, database lifecycle, seluruh gate, dan mutation suite selama 20–30 menit. Pemisahan feedback runner dari decision runner mempertahankan satu sumber kebenaran dan hasil fail-closed, tetapi menurunkan waktu diagnosis dan remediasi secara signifikan.
**Spec doc affected**: `verification/_LAYERED_CERTIFICATION_ACCELERATION_STANDARD.md`, `verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`, `verification/prompts/_PHASE_ONE_PASS_PROMPT_TEMPLATE.md`, `process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md`
**Status**: ✅ LOCKED

---

# P08 — Owner Business Decisions (2026-09-20)

> Decisions 051–057 are the owner's answers about **business flow**, given in business language
> on 2026-09-20. Decisions 058–060 are the technical consequences recorded for auditability.
> These are additive: no DEC-001..050 entry is amended or superseded. They resolve the
> previously unowned **design/artwork** and **legality permit** subjects and close the sample-fee
> gate that `RndService.acceptSample` was bypassing.

### DEC-2026-09-20-051 — Sample Fee: Finance Must Verify Before Formulation

**Topik**: Gerbang verifikasi pembayaran sample
**Keputusan**: Formulasi tidak boleh dimulai sebelum Finance memverifikasi bahwa biaya sample benar-benar sudah diterima. Auto-approval pada saat R&D menerima sample **dihapus**, bukan ditandai atau dibiarkan sebagai mode dev. Finance adalah satu-satunya penulis `paymentApprovedAt` dan `paymentApprovedById`, dan verifikatornya harus tercatat. Transisi `WAITING_FINANCE → IN_PROGRESS` menjadi gerbang keras; transisi langsung `SUBMITTED → IN_PROGRESS` dilarang.
**Rationale**: Implementasi berjalan menandai "biaya sample sudah dibayar" secara otomatis begitu R&D menerima sample, tanpa ada yang mengecek uangnya masuk, dan meninggalkan `paymentApprovedById` kosong sehingga jejak auditnya hilang. Gate `G1_SAMPLE` sudah dideklarasikan di kode tetapi tidak pernah ditegakkan. Ini jalur uang pada ERP produksi.
**Implikasi ke code**: `rnd.service.ts` blok auto-approve dihapus; `SampleRequest.paymentApprovedById` wajib terisi; `advanceSampleStage` melewati jalur gate, bukan menambah pemeriksaan kedua di tempat lain.
**Spec doc affected**: `contracts/03_WORKFLOW_STATE_MACHINE.yaml`, `contracts/04_BUSINESS_RULES.md` (BUS-RULE-107), `contracts/05_API_CONTRACT.yaml`, `contracts/06_SCREEN_CONTRACT.json` (SCR-182), `contracts/07_RBAC_MATRIX.yaml`, `contracts/08_INTEGRATION_EVENT_CONTRACT.yaml`
**Status**: ✅ LOCKED

### DEC-2026-09-20-052 — A Client-Approved Artwork Is Not Hard-Locked

**Topik**: Penguncian desain setelah approval klien
**Keputusan**: Desain yang sudah disetujui klien **tidak** terkunci permanen. Revisi masih boleh diminta, dibatasi sampai batas tertentu; desain baru terkunci setelah batas itu terlampaui.
**Rationale**: Jawaban owner atas pilihan antara kunci permanen dan kunci terbatas. Klien di lapangan sering meminta perubahan kecil setelah approval; mengunci permanen memaksa membuat desain baru dari nol untuk perubahan sepele.
**Implikasi ke code**: `DesignTask.isFinal` (disetujui klien) dipisahkan dari `DesignTask.isLocked` (kunci keras). Keadaan `LOCKED` berarti "final/disetujui", bukan "tidak bisa diubah".
**Spec doc affected**: `contracts/03_WORKFLOW_STATE_MACHINE.yaml` (`creative_pipeline`), `contracts/04_BUSINESS_RULES.md` (BUS-RULE-111)
**Status**: ✅ LOCKED

### DEC-2026-09-20-053 — Permits: Record and Monitor Expiry Only

**Topik**: Cakupan modul legalitas dalam P08
**Keputusan**: Izin BPOM, HKI-Merek, dan Halal **dicatat** dan **kadaluarsanya dipantau**. Alur pengajuan izin, pendaftaran regulasi, dan uji stabilitas produk **di luar cakupan P08**.
**Rationale**: Jawaban owner. Pencatatan + pengingat kadaluarsa sudah memberi nilai operasional penuh tanpa menyeret alur regulasi yang panjang dan berisiko.
**Implikasi ke code**: `HkiRecord`/`BpomRecord`/`HalalRecord` menjadi subjek kanonik dengan fokus tanggal terbit dan tanggal kadaluarsa. Empat tabel alur pengajuan (`RegulatoryPipeline`, `ArtworkReview`, `PNBPRequest`, dan status `pnbp_*`) tetap tanpa pemilik kanonik dan tidak didokumentasikan — lihat DEC-2026-09-20-058.
**Spec doc affected**: `contracts/01_DOMAIN_MODEL.md`, `contracts/schema.prisma` (SECTION 11), `contracts/04_BUSINESS_RULES.md` (BUS-RULE-112), `contracts/05_API_CONTRACT.yaml`, `contracts/06_SCREEN_CONTRACT.json` (SCR-183, SCR-184)
**Status**: ✅ LOCKED

### DEC-2026-09-20-054 — Exactly One Dedicated Design Page

**Topik**: Halaman khusus untuk pekerjaan approval desain
**Keputusan**: Dibuat **satu** halaman tersendiri yang menampilkan **riwayat revisi dan desain yang sudah difinalisasi saja**. Halaman ini tidak menampilkan pekerjaan yang masih berjalan. Halaman P08 lainnya mengikuti pola rumah yang sudah ada (checklist progress, checklist tracking), tanpa merancang ulang.
**Rationale**: Permintaan eksplisit owner: "aku ingin rancang 1 page tersendiri untuk ada history dan design yang di finalisasi aja, itu aja".
**Implikasi ke code**: Route baru `/creative/finalized`; halaman `/samples/design` tetap menjadi daftar permintaan desain dan kehilangan data karangannya.
**Spec doc affected**: `contracts/06_SCREEN_CONTRACT.json` (SCR-180), `contracts/05_API_CONTRACT.yaml` (`GET /creative/finalized`)
**Status**: ✅ LOCKED

### DEC-2026-09-20-055 — Design Revision Bound Is Three

**Topik**: Batas jumlah revisi desain
**Keputusan**: Klien boleh meminta revisi maksimal **3 kali** per jatah. Revisi ke-4 dalam jatah yang sama ditolak dan desain terkunci.
**Rationale**: Jawaban owner atas pilihan 2/3/5/konfigurabel. Angka 3 juga sudah menjadi `REVISION_LIMIT` di `creative.service.ts`, jadi keputusan ini menyelaraskan aturan dengan implementasi alih-alih mengubah keduanya.
**Implikasi ke code**: Batas menjadi aturan kanonik, bukan sekadar konstanta kelas. Percobaan revisi ke-4 mengembalikan `DESIGN_REVISION_BOUND_REACHED`.
**Spec doc affected**: `contracts/04_BUSINESS_RULES.md` (BUS-RULE-111), `contracts/03_WORKFLOW_STATE_MACHINE.yaml`
**Status**: ✅ LOCKED

### DEC-2026-09-20-056 — A Supervisor Reopen Restarts the Revision Allowance

**Topik**: Jalan keluar setelah desain terkunci
**Keputusan**: Setelah batas tercapai dan desain terkunci, atasan (Director/Admin) boleh membukanya kembali, **dan jatah revisi dihitung ulang dari nol**. Pembukaan itu wajib beralasan dan tercatat di riwayat desain.
**Rationale**: Jawaban owner: kunci permanen terlalu kaku, tetapi membuka tanpa aturan menghapus gunanya batas. Menghitung ulang jatah membuat override tetap terukur dan terlihat.
**Implikasi ke code**: `CreativeService.unlockTask` saat ini membersihkan `isLocked` tetapi **tidak** mengembalikan `revisionCount` — diperbaiki. Reopen hanya berlaku saat `isLocked == true`; revisi biasa di dalam jatah memakai jalur berbeda yang **menghabiskan** jatah, bukan mengembalikannya.
**Spec doc affected**: `contracts/03_WORKFLOW_STATE_MACHINE.yaml` (`supervisor.reopen`), `contracts/04_BUSINESS_RULES.md` (BUS-RULE-111), `contracts/07_RBAC_MATRIX.yaml`
**Status**: ✅ LOCKED

### DEC-2026-09-20-057 — Broad Read Scope for the Finalized-Design Page

**Topik**: Siapa yang boleh membuka halaman desain final
**Keputusan**: Semua pihak yang muncul sebagai PIC pada milestone **checklist progress dan checklist tracking** boleh membaca halaman riwayat + desain final. Penulisan dan approval tetap sempit.
**Rationale**: Jawaban owner: "semua yang ada di milestone checklist progress dan tracking, banyak PIC kan" — pekerjaan desain menyentuh banyak divisi, jadi membaca tidak perlu dibatasi per peran.
**Implikasi ke code**: Matriks RBAC `creative.read` mencakup BusDev, R&D, Desain, Legalitas, APJ, Executive, Auditor, Viewer, Administrator. `create`/`update` hanya Director; `approve` hanya Director/APJ/BusDev sesuai tahap.
**Spec doc affected**: `contracts/07_RBAC_MATRIX.yaml` (matrix `creative`), `contracts/06_SCREEN_CONTRACT.json` (SCR-180)
**Status**: ✅ LOCKED

### DEC-2026-09-20-058 — Design/Artwork and Permit Subjects Are Canonicalized; the Submission Stack Is Not

**Topik**: Kepemilikan kanonik subjek P08
**Keputusan**: Subjek **design/artwork** dan **permit record** mendapat pemilik kanonik lengkap di seluruh kontrak (`01`, `schema.prisma`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `10`). Tumpukan alur **pengajuan** izin (`RegulatoryPipeline`, `ArtworkReview`, `PNBPRequest`) **sengaja dibiarkan tanpa pemilik kanonik dan tanpa dokumentasi**, karena DEC-2026-09-20-053 menaruhnya di luar cakupan P08. Endpoint live-nya tetap ada tetapi tidak diklaim sebagai perilaku kanonik.
**Rationale**: Sebelum keputusan ini, `artwork_status`, `design_locked` dan `legal_artwork_approved` dipakai sebagai predikat precondition di `03` tanpa entity, state machine, API, atau screen di belakangnya — implementasi berjalan tanpa kontrak. Aturan `00_MASTER_SPEC.md §9.1`/`§9.3` mengharuskan perubahan perilaku dimulai dari kontrak pemilik subjek.
**Implikasi ke code**: 8 model baru di `schema.prisma` SECTION 11; 5 screen baru (SCR-180..184); 8 aturan baru (BUS-RULE-107..114); `creative_pipeline` baru di `03`; 17 operasi API baru; 5 slug izin baru.
**Spec doc affected**: seluruh `contracts/`, terutama `01_DOMAIN_MODEL.md` §12A dan `schema.prisma` SECTION 11
**Status**: ✅ LOCKED

### DEC-2026-09-20-059 — Canonical Schema Is a Projection; Tenant Column Gap Recorded

**Topik**: Jarak antara skema kanonik dan database berjalan
**Keputusan**: `contracts/schema.prisma` tetap merupakan **proyeksi sebagian** dari database berjalan (100 model kanonik vs 203 model live). P08 mengkanonikalisasi hanya model yang dibutuhkan acceptance-nya. Rekonsiliasi penuh dicatat sebagai backlog repo-wide dan tidak dibebankan ke satu fase. Selain itu, tabel P08 (`design_tasks`, `hki_records`, `bpom_records`, `halal_records`) belum memiliki kolom `organizationId` di database berjalan; kolom itu ditetapkan di kontrak sebagai target dan dicatat sebagai backlog isolasi tenant — **tidak** diklaim sudah diperbaiki.
**Rationale**: Menarik seluruh 203 model ke dalam kontrak adalah pekerjaan lintas fase yang tidak mengubah perilaku bisnis P08. Menyembunyikan jaraknya akan membuat kontrak tampak lengkap padahal tidak.
**Implikasi ke code**: Scope tenant untuk P08 dibaca melalui parent `Lead`/`organizationId` (pola yang sama dengan slice P07). Kolom per-tabel ditambahkan saat backlog isolasi tenant dikerjakan.
**Spec doc affected**: `contracts/01_DOMAIN_MODEL.md` §1.1, `contracts/schema.prisma` SECTION 11, `contracts/02_DATA_OWNERSHIP.yaml` §11
**Status**: ✅ LOCKED

### DEC-2026-09-20-060 — Naming Divergence and Traceability Drift Recorded

**Topik**: Nama konsep dan integritas katalog bukti
**Keputusan**: Dua divergensi dicatat apa adanya dan **tidak** diselesaikan di dalam paket kepemilikan subjek P08:
1. Konsep sample dan formula dinamai berbeda antara kontrak (`SalesSample`, `Formulation`) dan kode berjalan (`SampleRequest`, `Formula`). Arah penyelesaiannya adalah **mengikuti nama kode berjalan**, karena mengganti nama tabel di ERP produksi tidak memberi nilai bisnis dan berisiko data. Penggantian nama dikerjakan sebagai perubahan tersendiri.
2. `10_TRACEABILITY_MATRIX.yaml` mengalami drift: blok sales-nya bergeser satu slot dan memuat ID yang tidak ada di `06_SCREEN_CONTRACT.json` (SCR-186, SCR-189, SCR-190..197). Baris yang bersinggungan dengan P08 dan seluruh ID phantom pada blok sales sudah dikoreksi; sisa drift modul lain dicatat sebagai backlog. `06_SCREEN_CONTRACT.json` selalu menang karena `10` hanya bukti cakupan (`00_MASTER_SPEC.md §9.1`).
**Rationale**: Keduanya nyata dan berisiko membingungkan pembaca berikutnya. Menyelesaikannya sekaligus akan memperbesar diff P08 ke wilayah yang bukan miliknya; mendiamkannya akan membuat kontrak menyesatkan.
**Implikasi ke code**: Tidak ada perubahan perilaku. Perubahan nama model Prisma dan endpoint `/sales/samples` vs `/rnd/sample` menunggu keputusan tersendiri.
**Spec doc affected**: `contracts/01_DOMAIN_MODEL.md` §1.1, `contracts/10_TRACEABILITY_MATRIX.yaml`
**Status**: ✅ LOCKED

### DEC-2026-09-20-061 — Two Legacy R&D E2E Suites Cannot Build; Recorded, Not Chased

**Topik**: Suite e2e R&D lama yang tidak pernah benar-benar berjalan
**Keputusan**: `backend/test/rnd-audit.e2e-spec.ts` dan `backend/test/rnd-business-process.e2e-spec.ts` **tidak dapat dibangun** oleh Nest karena `TestingModule`-nya tidak menyediakan seluruh dependensi `RndService`/`LegalityService`. Kekurangan ini **sudah ada sebelum P08** dan tidak diperbaiki di dalam P08. Yang dilakukan P08 hanya memperbaiki bagian yang bersinggungan langsung dengan perubahannya (menambahkan `paymentApprovedById` pada helper `markAsPaid` sesuai BUS-RULE-107, serta menyediakan `AuditService`/`OutboxService` yang kini dibutuhkan `RndService`). Sisa kekurangan dependensi dicatat sebagai backlog P2 dengan bukti di bawah.
**Rationale**: Setiap kali satu dependensi ditambahkan, muncul kekurangan berikutnya (`IdGeneratorService`, lalu `BussdevService` melalui `forwardRef`). Suite ini jelas ditulis terhadap graf DI yang lebih lama dan tidak pernah dieksekusi. Mengejarnya berpotensi tak berujung dan bukan bagian dari acceptance P08. Menyembunyikannya akan membuat status pengujian P08 terlihat lebih baik daripada kenyataan.
**Bukti**:
- `RndService` sudah membutuhkan `IdGeneratorService` pada `HEAD` (sebelum perubahan P08), sementara kedua spec tidak pernah menyediakannya.
- `LegalityService` membutuhkan `BussdevService` lewat `@Inject(forwardRef(...))`; `backend/src/modules/legality/legality.service.ts` tidak disentuh P08 sama sekali.
- Akibatnya: `Tests: 12 failed, 12 total` pada `rnd-audit`, gagal di `beforeAll` saat kompilasi modul — bukan kegagalan assertion.
**Implikasi ke code**: Tidak ada perubahan perilaku. Acceptance P08 tidak bergantung pada kedua suite ini; buktinya adalah suite baru `test/unit/p08/*` dan golden thread disposable-database.
**Spec doc affected**: `verification/TESTING_STRATEGY.md` (backlog), `verification/P08_FROZEN_ACCEPTANCE_CONTRACT.md` (tidak mengubah acceptance)
**Status**: ✅ LOCKED

---

## Pending Decisions (Open)

*Semua keputusan bisnis terbuka telah diselesaikan pada 2026-09-17 (DEC-2026-09-17-045). Saat ini ada 0 keputusan terbuka (zero open decisions).*

| ID | Topik | Status | Owner |
|----|-------|--------|-------|
| *None* | — | ✅ ALL RESOLVED | — |

---

## Workflow Reminder

**Sebelum ngubah kode**:
1. Cek apakah keputusan terkait ada di sini
2. Cek spec doc terkait (`_SSOT_*.md`)
3. Kalau belum ada, **tambah entry** di sini dulu dengan rationale
4. Baru mulai implementasi

**Setelah implementasi**:
1. Mark decision sebagai ✅ IMPLEMENTED (kalau locked + implemented)
2. Update spec doc kalau ada deviation

---

**Dokumen ini WAJIB di-update setiap ada keputusan baru. Ubah spec dulu sebelum code.**
