# Review: `00_MASTER_SPEC.md`

> **Audit date**: 2026-09-16
> **File**: 756 lines, ~47KB
> **Status declared**: LOCKED (condensed top-of-stack reference)
> **Verdict**: 🟠 **Out-of-sync angka** — acceptable sebagai referensi utama tapi perlu sync count

---

## 📊 Metrics Snapshot

| Metric | Value | Source |
|--------|-------|--------|
| Lines | 756 | wc -l |
| Sections (##) | 9 | grep |
| Subsections (###) | 35+ | manual |
| Tables | 25+ | manual |
| Glossary terms | 80+ | §4 |
| LOCKED principles | 52 (5.1-5.8) | §5 |
| Modules listed (tersebut) | 9 (domain) / 10 (modul) / 12 (build order) | §1.1, §2.1, §7.1 |

---

## ✅ Strengths

### Business Analyst view
- **Glossary bilingual ID/EN** (80+ terms) sangat membantu onboarding dan konsistensi terminology lintas tim.
- **Actor Perspective Summary** (§3.3) langsung kasih "what they care about" — useful untuk product owner.
- **Out-of-Scope** (§8) eksplisit, mengurangi scope creep.
- **References** (§9) komprehensif dengan deskripsi tiap dokumen.

### Software Architect view
- **LOCKED Global Principles** (§5) terstruktur per kategori (process, arch, data, UX, security, comm, migration, finance) — enforceable di code review.
- **Module Cross-Dependencies** (§6) dengan mermaid diagram + matrix — readable.
- **Migration Phases** (§7.2) dengan durasi jelas (16-18 weeks total).

### QA view
- Setiap principle di §5 punya **enforceable in code review** statement.
- Migration mapping dari legacy ke NEX jelas (45 users, 16 roles, 77 permissions).
- §9.4 decision authority chain — siapa menang saat konflik jelas.

---

## 🔴 Critical Findings

### CRIT-1: Out-of-sync numbers
| Klaim | Actual | Lokasi |
|-------|--------|--------|
| "9 ERP domains" (§1.1) | Listed: 9 + 2 cross-cutting | OK tapi §7.1 lists 12 modules |
| "176 screens" (§1.4, §9.1) | 178 di screen contract | ❌ DRIFT |
| "16 legacy roles + 2 = 18" (§3 intro) | 43 di RBAC | ❌ DRIFT |
| "25 distinct named roles" (§3.1 footer) | 43 di RBAC | ❌ DRIFT |
| "26 LOCKED decisions" (§9.1) | BUS-RULES klaim 34 (DEC-001..034) | ❌ DRIFT |

**Fix**: Cross-reference dokumen `_REVIEW/_CROSS_DOC_INCONSISTENCIES.md` untuk detail.

---

## 🟠 Major Findings

### MAJ-1: Module/Domain terminology chaos
- §1.1: "**9 ERP domains**"
- §2.1: tabel **10 modules** (+ Dashboards)
- §7.1: build order **12 modules** (+ Auth, Master Data)
- §9.2: 11 implementation contracts referenced
- Actual di folder `contracts/`: 00..10 files (11 files)

**Rekomendasi**: 
- **Domain** = business area (9)
- **Module** = NEX buildable unit (12)
- **Section** = schema.prisma group (10)
- **Catalog** = screen contract organization (15)

### MAJ-2: §9.2 Implementation Contracts reference file yang TIDAK ADA
§9.2 tabel referensi:
- `01_AUTH_RBAC_CONTRACT.md` — ❌ TIDAK ADA (yang ada `01_DOMAIN_MODEL.md` + `07_RBAC_MATRIX.yaml`)
- `02_MASTER_DATA_CONTRACT.md` — ❌ TIDAK ADA
- `03_SALES_PIPELINE_CONTRACT.md` — ❌ TIDAK ADA
- ... semua referenced file TIDAK ADA

**Actual di folder `contracts/`**:
- `00_MASTER_SPEC.md`, `01_DOMAIN_MODEL.md`, `02_DATA_OWNERSHIP.yaml`, `03_WORKFLOW_STATE_MACHINE.yaml`, `04_BUSINESS_RULES.md`, `05_API_CONTRACT.yaml`, `06_SCREEN_CONTRACT.json`, `07_RBAC_MATRIX.yaml`, `08_INTEGRATION_EVENT_CONTRACT.yaml`, `09_NON_FUNCTIONAL_CONTRACT.md`, `10_TRACEABILITY_MATRIX.yaml`, `schema.prisma`

**Fix**: Update §9.2 dengan file aktual, atau rename file existing.

### MAJ-3: §1.2 "31 Phase-2 Candidate Set" tapi §1.4 bilang "144 parity + 1 defect = 145"
- §1.2: "**31 expansion screens** beyond the 144 parity baseline"
- §1.4 Migration Baseline: "**144 baseline + 1 defect** = 145"
- §1.3: "(32 screens, mostly 31 expansion + 1 defect)"
- §9.1: "**176-screen catalog**"

**Math**: 144 + 31 + 1 = 176 ✓ (target 176)
- Actual: 178 screens
- Gap: 178 - 176 = 2 screens over target

**Fix**: Reconcile angka, atau hapus 2 screens dari contract.

### MAJ-4: §6.1 mermaid diagram tidak include Master Data
Diagram mermaid punya AUTH, MASTER (tanpa arrow dari AUTH ke MASTER — padahal §6.2 matrix bilang Master depends on Auth).
Verify visual: `AUTH --> MASTER` line 453, OK ada. Tapi diagram tidak include **Master Data Layer** eksplisit (ada sebagai box tapi tidak ada arrow dari Finance ke Master, dari WHS ke Master, dll).

### MAJ-5: §3 Role Matrix — count internal inconsistency
- Tabel §3.1 punya **25 rows** (entries), tapi intro paragraf §3 bilang "**18 named roles**", footer bilang "**25 distinct named roles**".
- Plus 2 cross-cutting (Executive, Auditor) dan 2 legacy combos (BusDev+HRD, BusDev+Purchasing).
- Total rows in table: 25 + 2 + 2 + 1 ORPHAN nota = 30 rows.
- Actual: 43 di RBAC.

**Fix**: Hapus intro paragraf §3 yang bilang "18", replace dengan "**43 roles total**" atau reference RBAC.

### MAJ-6: §5.6 — Communication Principles reference DEC-013 tapi role definition §3 tidak include "Auditor" dengan notifikasi khusus
DEC-013: "Cross-reference comments limited" — UI harus discourage random linking. Tapi tidak ada spec bagaimana UI enforce ini (counter, suggestion, validation, dll?).

---

## 🟡 Minor Findings

### MIN-1: §4 Glossary includes "Goodwill" tapi tidak ada entity `Goodwill` di schema
- Line 274: "**Goodwill** | Nama Baik | Brand reputation affecting lead conversion."
- schema.prisma grep: tidak ada model `Goodwill`.

**Fix**: Hapus dari glossary atau define sebagai field di entity lain (mis. `Customer.goodwillScore`).

### MIN-2: §5.4 #27 "Currency: IDR only (MVP)" — multi-currency Phase 2, tapi §9.4 reference tidak ada
Cross-reference: tidak ada DEC ID untuk multi-currency deferral.

### MIN-3: §5.6 #39 "Sidebar badge polling (legacy pattern preserved)" — frekuensi "every 30s" tapi tidak ada DEC untuk angka 30 ini
DEC untuk angka polling frequency?

### MIN-4: §7.1 "P3: Sales + Purchase pipeline" tapi §6.1 diagram menunjukkan Master Data → Sales dan Master Data → Purchase sebagai dependency. Apakah Master Data di P2 sudah cukup sebelum Sales/Purchase di P3? Verify timeline overlap.

### MIN-5: §1.2 "Real-time chat — customer-facing WA stays as the channel of choice" — apakah ini principle atau DEC ID? Tidak ada DEC untuk ini secara eksplisit.

### MIN-6: §5.7 #42 "ETL for parity screens only — do NOT migrate data for the 31 Phase-2 expansion screens" — bagus tapi tidak ada DEC ID.

---

## 🔵 Nit / Polish

### NIT-1: §3.1 row 174-175 — Executive dan Auditor ada di tabel tapi intro paragraf §3 tidak menyebut sebagai "18 total".
Intro §3 bilang "16 legacy + 2 NEX cross-cutting (Executive, Auditor) = 18", tapi tabel punya 25 rows + 2 combos = 27. Inkonsisten.

### NIT-2: §4 Glossary entry "**Cart Pattern** | Pola Cart" — DEC-015 referenced di entry ini bagus, tapi pattern DEC-ID di seluruh glossary tidak konsisten (beberapa punya DEC, beberapa tidak).

### NIT-3: §5.6 #40 "Watch / Subscribe — users can opt-in to entity-level notifications" — referenced `See _SSOT_COMMUNICATION.md §7` — bagus, traceability OK.

### NIT-4: §7.1 modul ke-10 "HR" di P5 (Phase 2 priority), tapi §1.1 bilang HR di scope. Apakah prioritas atau scope?

---

## 📋 Rekomendasi per Section

| § | Issue | Priority |
|---|-------|----------|
| 1.1 | Count consistency check | P0 |
| 1.4 | Screen count 176 → 178 | P0 |
| 3 | Role count 18/25 → 43 | P0 |
| 5.6 | Cross-ref comment UI enforcement spec missing | P1 |
| 6.1 | Diagram completeness | P2 |
| 7.1 | Phase boundary clarity | P2 |
| 8.3 | 9 PENDING — link ke BUSINESS_RULES Lampiran B | P1 |
| 9.2 | Update referenced filenames | P0 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md` for overall verdict
- See `_CROSS_DOC_INCONSISTENCIES.md` for cross-file conflicts
- See `01_DOMAIN_MODEL_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md` for dependent docs
