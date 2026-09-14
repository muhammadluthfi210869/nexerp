# 02 — OPEN ADR TRACKER (15 Decisions Pending)

> **Tujuan:** Track 15 Architectural Decision Record (ADR) yang masih PENDING keputusan user. Setiap ADR bisa memblokir slice tertentu. Sign-off minimal untuk foundational ADR sebelum implementasi.
> **Last updated:** 2026-09-10
> **Format:** Tabel per ADR dengan status, owner, related SCR/Rule, options, recommendation, blocker impact.

---

## Status Legend

- 🟢 **SIGNED** — Sudah ada keputusan final
- 🟡 **PROPOSED** — Ada rekomendasi, menunggu owner sign-off
- 🟠 **PARTIAL** — Diskusi berjalan, butuh klarifikasi
- 🔴 **CRITICAL** — Memblokir slice tertentu, prioritas tinggi
- ⚪ **OPEN** — Belum didiskusikan

---

## ADR Summary (11 Pending, 4 SIGNED)

| # | ID | Topik | Status | Sign-off Priority |
|---|---|---|---|---|
| 1 | ADR-001 | Canonical Screen Count (176 vs 178) | 🟢 SIGNED via ADR-002 (JSON = SSOT) | ✅ Resolved |
| 2 | **ADR-002** | **12 Modul Final + Canonical Routes** | 🟢 **SIGNED 2026-09-10** | ✅ Done |
| 3 | **ADR-003** | **Universal Code Format** | 🟢 **SIGNED 2026-09-10** | ✅ Done |
| 4 | ADR-004 | Vendor/Customer Code Prefix | ⚪ OPEN | 🟡 High |
| 5 | **ADR-005** | **Approval Threshold + SoD Policy** | 🟢 **SIGNED 2026-09-10** | ✅ Done |
| 6 | ADR-006 | Max KPI Cards (4 atau 4-6) | ⚪ OPEN | 🟢 Low |
| 7 | **ADR-007** | **Visual DNA 5-Layer Order** | 🟢 **SIGNED 2026-09-10** | ✅ Done |
| 8 | ADR-008 | Dashboard vs Marketing Visual Exception | ⚪ OPEN | 🟢 Low |
| 9 | ADR-009 | Negative-Stock Policy | ⚪ OPEN | 🟠 Medium |
| 10 | ADR-010 | Costing Method + Rounding | 🟡 PROPOSED | 🟡 High |
| 11 | ADR-011 | Retention/Backup/RPO/RTO | 🟡 PROPOSED | 🟡 High |
| 12 | ADR-012 | Release Train Order | 🟡 PROPOSED | 🟢 Low |
| 13 | **ADR-013** | **Legacy shadcn (keep sebagai base, DNA membungkus)** | 🟡 **PROPOSED 2026-09-11** | ✅ Recommendation ready |
| 14 | ADR-014 | Marketing module exception (full atau wajib DNA) | ⚪ OPEN | 🟡 High |
| 15 | ADR-015 | Commitlint strict vs flexible | ⚪ OPEN | 🟢 Low |

---

## ADR-001: Canonical Screen Count (176 vs 178)

- **Status:** 🟡 PROPOSED
- **Owner:** ERP Architect (Kilo) + Product Owner
- **Related:** `NEX_ERP_MASTER_SPECIFICATION.md` (claim 178) vs `NEX_ERP_SCREEN_AND_API_CATALOG.json` (ada 176)
- **Gap:** 2 layar tidak ada di JSON catalog (per audit exploration)

**Options:**
- (A) **178 adalah SSOT** — update JSON catalog dengan 2 layar tambahan. Cari layar yang hilang.
- (B) **176 adalah SSOT** — Master Spec over-claim, update spec ke 176.
- (C) **Hybrid** — pakai 178 sebagai planning, 176 sebagai implementasi phase 1.

**Recommendation:** **(B) 176 sebagai SSOT untuk implementasi**. Reconcile Spec ke 176 dengan diff report.

**Blocker Impact:** Semua slice reference screen catalog — perlu angka final sebelum hitung screen per release.

---

## ADR-002: 12 Modul Final + Canonical Routes

- **Status:** 🟢 **SIGNED** (revised 2026-09-10, original superseded)
- **Signed by:** Muhammad Luthfi
- **Signed at:** 2026-09-10
- **Owner:** ERP Architect + Frontend Lead
- **Related:** Master Spec Bagian II MOD-01..MOD-12 + `NEX_ERP_SCREEN_AND_API_CATALOG.json` (176 screens)

**⚠️ REVISION 2026-09-10-2:** Original decision (Option A, 7 route prefix per divisi) **diubah** karena analisis cross-functional access (RnD butuh akses ke Production/Warehouse/QC) menunjukkan route per divisi membuat navigasi awkward. Keputusan baru: **Hybrid per Business Function + Role-based Menu**.

**Decision (revised Option C - Hybrid):**

**12 Modul tetap dipakai sebagai ARSITEKTUR konsep internal** (master data, scm, bussdev, rnd, warehouse, qc, production, design, legal, finance, hr, executive) — sebagai domain ownership.

**Route URL diganti ke 11 Business Function** (proses bisnis, bukan divisi):
```
/samples          → Sample pipeline (RnD → Mixing → QC → Release)        [Owning: RnD]
/pembelian        → PO Inbound, GR, Faktur, Bayar, Retur                 [Owning: SCM]
/penjualan        → SO, Quotation, DP, Delivery, Faktur                  [Owning: BusDev]
/inventory        → Stok, Mutasi, Adjustment, Opname                     [Owning: Warehouse]
/production       → Batch Record, Mixing, Filling, Packing               [Owning: Production]
/quality          → QC Test, Compliance, Release, Checklist             [Owning: QC]
/finance          → CoA, Journal, Bank, Closing, Aging                   [Owning: Finance]
/master           → Customer, Supplier, Material, User (cross-cutting)  [Owning: Master Data]
/approvals        → Fund Request, Approval Queue, Signature             [Owning: Finance]
/reports          → Cross-divisional reports, Aging, KPI                 [Owning: Exec]
/exec             → Executive dashboard                                  [Owning: Executive]
```

**Frontend Menu: RBAC-based filter** — user lihat menu yang relevan dengan role-nya saja.

**Contoh menu per role:**
- **RnD user**: Sample | Master (Material, Supplier) | Quality (test results) | Inventory (sample stock)
- **BusDev user**: Sample | Sales | Master (Customer) | Delivery | Approvals
- **Warehouse user**: Inbound (Pembelian) | Inventory | Outbound (Penjualan) | Quality (release)
- **Finance user**: Pembelian | Penjualan | Bank | Closing | Reports | Approvals
- **Director**: Semua menu

**Implikasi bisnis (revisi):**
- ✅ Cross-functional user (RnD, BusDev, Warehouse) navigasi natural — menu berdasarkan proses bisnis
- ✅ Setiap halaman tetap punya 1 owning division (tanggung jawab jelas)
- ✅ Permission/menu RBAC = kepatuhan audit (siapa akses apa tercatat)
- ✅ Legacy G-SERP pattern terbukti untuk daily operations (reduce training time)
- ⚠️ Frontend routes butuh reorganize (~10-12 folder rename atomic per divisi)
- ⚠️ Backend API endpoint TIDAK berubah (per-controller per-domain sudah benar)

**Refactor effort:** 1-2 minggu atomic batch per divisi (routes reorganization + RBAC menu). Bisa parallel dengan Phase 1 Baseline Recovery.

**Resolved dependencies:** ADR-001 (176 vs 178) — JSON catalog = SSOT, 176 screens final.

---

---

## ADR-003: Universal Code Format

- **Status:** 🟢 **SIGNED**
- **Signed by:** Muhammad Luthfi
- **Signed at:** 2026-09-10
- **Owner:** ERP Architect + Finance Controller
- **Related:** Master Spec §1 Universal Code Engine; SCR-105 DP Pembelian pakai format lokal `DPB-YYMM-XXXX` (inkonsisten)

**Decision (Option C, extended):**
- **Format lengkap** `DL-{DIV}-{TYPE}-{DDMMYYYY}-{seq4}` (audit, internal, log) — contoh: `DL-FIN-SO-29062026-0001`
- **Format ringkas** `{TYPE}-{DDMMYYYY}-{seq4}` (UI, customer-facing) — contoh: `SO-29062026-0001`
- User pilih per preferensi di profil (default ringkas).
- Sequence **GLOBAL & NO-RESET** sejak sistem hidup.
- Counter via tabel `universal_sequence` di Prisma (atomic via outbox pattern).
- DP Pembelian `DPB-YYMM-XXXX` exception → **migrate ke format universal** (resolve legacy inconsistency).

**Implikasi bisnis:**
- ✅ Setiap dokumen (PO, SO, Invoice, Pembayaran) punya nomor unik selamanya, tidak akan tabrakan
- ✅ Laporan audit jadi mudah: nomor urut kontinyu dari hari pertama sistem
- ✅ Customer lihat nomor ringkas (lebih friendly), auditor bisa telusuri ke nomor lengkap

**Resolved:** SCR-105 inconsistency. No more DP Pembelian exception.

---

---

## ADR-004: Vendor/Customer Code Prefix

- **Status:** ⚪ OPEN
- **Owner:** Product Owner
- **Related:** SCR-043, SCR-057 (Customer/Supplier Code)

**Options:**
- (A) **No prefix** — auto global sequence saja (raw UUID-derived)
- (B) **`SUP-` untuk supplier, `CST-` untuk customer**
- (C) **`VEN-` untuk vendor, `CUST-` untuk customer**
- (D) **Other** — sebutkan prefer

**Recommendation:** **(C) `VEN-` + `CUST-`** — align dengan istilah legacy dan ERP standards.

**Blocker Impact:** Master Customer/Supplier CRUD di R1 — minor delay, bisa default ke (A) lalu migrate.

---

## ADR-005: Approval Threshold + SoD Policy

- **Status:** 🟢 **SIGNED**
- **Signed by:** Muhammad Luthfi
- **Signed at:** 2026-09-10
- **Owner:** Director + Finance Manager
- **Related:** Master Spec §2 3-Tier Approval; FINANCE_FULL_IMPLEMENTATION_PLAN §2A

**Decision (Option A):**
- **Threshold**: pengajuan **> Rp 50.000.000** → butuh Director (Bos Besar) approve
- **Jenjang**: Staff → Head → Finance → Director (jika > 50jt)
- **Jenjang Head skip**: Head boleh skip 1 step di Fund Request (per spec)
- **SoD (Pisah Tugas)**: **STRICT** — tidak boleh approve pengajuan sendiri (anti-korupsi). Sistem TOLAK.
- **Override**: TIDAK ADA tanpa Director approval (Director hanya escalate, bukan bypass)
- **Audit**: WAJIB log setiap approval transition (timestamp + actor + reason)

**Implikasi bisnis:**
- ✅ Pengajuan < 50jt:流程 cepat (3 level), cocok untuk operasional harian
- ✅ Pengajuan > 50jt: ada check & balance Director, mitigasi risiko fraud
- ✅ Zero self-approval = audit bersih, pass review eksternal (BI, pajak, dll)
- ✅ Semua jejak persetujuan tercatat permanen (siapa, kapan, alasannya)

**Risk:** Kalau ada kebutuhan urgent > 50jt di luar jam kerja, harus tersedia Director on-call. Mitigation: notifikasi real-time ke Director via WA/email saat approval pending > 50jt.

---

---

## ADR-006: Maximum KPI Cards

- **Status:** ⚪ OPEN
- **Owner:** UX Lead + Product Owner
- **Related:** Master Spec §5 (4-6 KPI cards); `DNA-RULES-CONTRACT.md` (max 4 per spec lain)

**Options:**
- (A) **Max 4 KPI cards** (DNA-RULES-CONTRACT alignment)
- (B) **4-6 KPI cards** (Master Spec flexibility)
- (C) Per-page category: dashboard max 8, operational max 4

**Recommendation:** **(C) Per-page category** — operational max 4, dashboard max 8 (kebijakan).

**Blocker Impact:** Minor — implement di DNA Page Shell. Tidak memblokir R1 backend.

---

## ADR-007: Visual DNA 5-Layer Order

- **Status:** 🟢 **SIGNED**
- **Signed by:** Muhammad Luthfi
- **Signed at:** 2026-09-10
- **Owner:** UX Lead + Frontend Lead
- **Related:** `LAYOUT_GOVERNANCE.md`, `DNA-RULES-CONTRACT.md`, `frontend/src/components/dna/COMPONENT_INVENTORY.md`

**Decision (Option C - Hybrid):**
- **DNA Source of Truth** (canonical references):
  - Tata letak: `docs/design/LAYOUT_GOVERNANCE.md`
  - Rules: `docs/DNA-RULES-CONTRACT.md`
  - Inventory komponen: `frontend/src/components/dna/COMPONENT_INVENTORY.md`
- **5-Layer order** (otomatis dari LAYOUT_GOVERNANCE.md):
  1. Alert Banner (pemberitahuan penting)
  2. Header (judul halaman + breadcrumb)
  3. KPI Cards (ringkasan angka, max 4-6)
  4. Tab Filter (pemfilteran data)
  5. Toolbar Aksi (tombol Create/Export/Import)
  6. Tabel Data (daftar records)
- **Enforcement**:
  - ESLint rule `no-raw-ui-import-on-operational` aktif di CI
  - Husky pre-commit reject raw UI import di operational routes
  - Frontend engineer yang melanggar = PR auto-reject
- **Marketing exception** (ADR-014): marketing BUKAN operasional, boleh raw UI (terpisah, akan di-sign terpisah)
- **Visual Regression**: Chromatic/Percy baseline dibuat SETELAH R1 selesai (sebelum R2 mulai)

**Implikasi bisnis:**
- ✅ Konsistensi visual di semua 176 layar (user tidak bingung pindah halaman)
- ✅ Onboarding karyawan baru lebih cepat (pola tampilan seragam)
- ✅ Perawatan frontend lebih mudah (1 pola = 1 perbaikan)
- ✅ Mencegah "frontend drift" yang selama ini Anda keluhkan

**Marketing pengecualian**: Dashboard marketing akan tetap pakai visual style sendiri (lebih colorful, real-time data) — bukan sasaran DNA enforcement.

---

---

## ADR-008: Dashboard vs Marketing Visual Exception

- **Status:** ⚪ OPEN
- **Owner:** UX Lead
- **Related:** VISUAL_DNA scope exception

**Options:**
- (A) Marketing pakai DNA juga (no exception)
- (B) Marketing boleh pakai custom components (existing)

**Recommendation:** **(B) Marketing exception** — incremental, jangan rewrite marketing.

**Blocker Impact:** Minor — DNA rule exclude marketing folder.

---

## ADR-009: Negative-Stock Policy

- **Status:** ⚪ OPEN
- **Owner:** Warehouse Manager + Finance Manager
- **Related:** Inventory management

**Options:**
- (A) **Strict non-negative** — semua warehouse strict
- (B) **Allow consignment negative** — bahan konsinyasi boleh minus sementara
- (C) **Per warehouse config** — admin set policy per gudang

**Recommendation:** **(C) Per warehouse config** — flexible, opsional per use case.

**Blocker Impact:** Warehouse inbound/transfer logic — implementasi R2 (P2P slice).

---

## ADR-010: Costing Method + Rounding

- **Status:** 🟡 PROPOSED
- **Owner:** Finance Manager
- **Related:** `FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md` §1B (MAP)

**Options:**
- (A) **Moving Average Price (MAP)** untuk semua material
- (B) **FIFO** untuk semua material
- (C) **Hybrid** — MAP default, FIFO optional per kategori
- (D) **Specific** — MAP untuk raw material, FIFO untuk finished goods

**Recommendation:** **(A) MAP untuk semua** — sesuai `FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md` §2A. Rounding: banker's rounding (midpoint ke even) untuk akurasi.

**Blocker Impact:** Material Valuation service di R1 CoA/Finance area (Mini-Sprint 1-2).

---

## ADR-011: Retention / Backup / RPO / RTO

- **Status:** 🟡 PROPOSED
- **Owner:** DevOps/SRE
- **Related:** Provisional target di `ERP_FINALIZATION_MASTER_PLAN.md` (RPO 15min, RTO 60min)

**Provisional Target:**
- **Backup:** harian (incremental) + mingguan (full) + bulanan (archive off-host)
- **Retention:** harian 7 hari, mingguan 4 minggu, bulanan 12 bulan
- **RPO:** ≤15 menit (incremental backup)
- **RTO:** ≤60 menit (full restore tested)

**Blocker Impact:** Backup runbook di PHASE_0 §3. Pakai provisional dulu, finalize di R6.

---

## ADR-012: Release Train Order

- **Status:** 🟡 PROPOSED
- **Owner:** ERP Architect
- **Related:** R1=R0, R2-R6 per `ERP_FINALIZATION_MASTER_PLAN.md`

**Proposed:**
- R0 Engineering Baseline (Phase 0+1 selesai)
- R1 Master & Access (110 layar, 10 hari kerja) ← **kita di sini**
- R2 Procurement Pilot (P2P)
- R3 Commercial Pilot (L2C)
- R4 Manufacturing Pilot (Plan-to-Stock)
- R5 Finance Close + HR + Executive
- R6 Hardening + UAT + Rollout

**Blocker Impact:** Sprint planning — finalize sebelum R2 mulai.

---

## ADR-013: Legacy shadcn (`frontend/src/components/ui/`)

- **Status:** 🟡 **PROPOSED 2026-09-11** (recommendation ready, user sign-off needed)
- **Owner:** Frontend Lead + ERP Architect
- **Related:** STRICT_POLICIES_ADDENDUM BAGIAN A + BAGIAN F.1
- **Blocks:** Phase 3.4 Global Component Library

**Options:**
- (A) **Hapus total** — paksa migrasi 100% ke DNA
- (B) **Keep sebagai internal base** — DNA membungkus shadcn, shadcn tidak diimport langsung

**RECOMMENDATION (B)** — Keep shadcn as base, DNA wraps it.

**Rationale:**
1. **Pragmatic**: shadcn primitives (Button, Input, Dialog, Select, Tabs) are battle-tested Radix wrappers. Reinventing them wastes 2-3 weeks.
2. **De-facto state**: Build blocker fixes (Batch 1) already use this pattern. E.g. `import { Button } from "@/components/ui/button"` works in `workstation/page.tsx` while DnaButton wraps higher-level actions.
3. **Enforcement**: Add ESLint rule `no-raw-ui-import-on-operational` that BLOCKS direct shadcn imports in `app/(dashboard)/*` (operational routes), ALLOWS them in `components/dna/*` (DNA wrappers).
4. **Gradual migration**: DNA components can progressively replace shadcn usage without breaking changes.

**Implementation:**
- ESLint rule already exists: `frontend/eslint-rules/no-raw-ui-import.cjs` (per D-20)
- 7,341 lint warnings in Phase 2.5 lint cleanup are mostly this — auto-fix has near-zero impact, manual refactor multi-day
- For Phase 3.4: focus on creating DNA wrappers for NEW components first, then migrate existing usages batch by batch

**Awaiting user sign-off:**
```
ADR-013: B (keep as base)
```
- (C) **Deprecate gradual** — keep file tapi ESLint block import

**Recommendation:** **(B) Keep sebagai internal base** — DNA components sudah extend shadcn (`Dialog`, `Drawer`, `DropdownMenu`), remove = break DNA. Tapi CSS/HTML control raw (button/input) WAJIB lewat DNA wrapper, bukan direct shadcn import.

**Blocker Impact:** Migration order (12 PR sudah dipetakan) — bisa mulai tanpa ADR ini, finalize sebelum R1 selesai.

---

## ADR-014: Marketing Module Exception (DNA-Only Policy)

- **Status:** ⚪ OPEN
- **Owner:** UX Lead
- **Related:** STRICT_POLICIES_ADDENDUM BAGIAN F.2

**Options:**
- (A) **Full exception** — marketing boleh pakai custom library/HTML
- (B) **Wajib DNA** — semua production routes pakai DNA termasuk marketing
- (C) **Hybrid** — marketing pages boleh HTML untuk embed/se特殊 use cases, tapi components standard pakai DNA

**Recommendation:** **(C) Hybrid** — operational marketing pages pakai DNA, custom embed (analytics dashboards, third-party widget) boleh raw.

**Blocker Impact:** ESLint rule config — exclude marketing folder atau tidak.

---

## ADR-015: Commitlint Strict vs Flexible

- **Status:** ⚪ OPEN
- **Owner:** Lead Dev + Tech Lead
- **Related:** STRICT_POLICIES_ADDENDUM BAGIAN F.3

**Options:**
- (A) **Strict** — type + scope wajib sesuai enum di `commitlint.config.cjs`
- (B) **Flexible** — type wajib, scope opsional

**Recommendation:** **(A) Strict** — consistency dari awal. Kalau ada scope baru, tambahkan ke enum.

**Blocker Impact:** Minor — commitlint sudah setup dengan strict. Bisa relax nanti kalau friction tinggi.

---

## Sign-off Dependency

ADR yang harus disign SEBELUM R1 implementation dimulai (CRITICAL):

1. **ADR-001** (canonical screens) — agar hitung R1 scope final
2. **ADR-003** (Universal Code) — agar Universal Code Engine di hari 1 bisa implemented
3. **ADR-005** (Approval + SoD) — agar Universal Approval Engine di hari 1-2
4. **ADR-010** (Costing Method) — agar Material Valuation di Mini-Sprint 1

ADR yang boleh defer ke R2 atau R3:

- ADR-004, ADR-006, ADR-007, ADR-008, ADR-009 — operational, tidak memblokir R1 foundation
- ADR-011, ADR-012 — DevOps/release planning
- ADR-013, ADR-014, ADR-015 — enforcement policy refinement

---

## Cara Sign ADR

User balas dengan format:
```
ADR-001: 176 sebagai SSOT
ADR-003: Hybrid (C) + exception (D)
ADR-005: (A) Threshold 50jt + Strict SoD
ADR-010: (A) MAP universal + banker's rounding
[dst]
```

Atau jawab via question tool Kilo di session berikutnya.

---

*Dokumen ini ADALAH tracker hidup. Update setiap ada ADR baru atau sign-off.*

*Last updated: 2026-09-10*
