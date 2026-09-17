# Review: `04_BUSINESS_RULES.md`

> **Audit date**: 2026-09-16
> **File**: 1,801 lines, ~80KB
> **Status declared**: LOCKED (Document Version 1.0, 2026-09-16)
> **Verdict**: 🟠 **1 rule bloated** — comprehensive catalog dengan anomali satu rule yang 30x lebih besar dari rule lain

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 1,801 | wc -l |
| Total BUS-RULE | **105** | grep `^### BUS-RULE-` |
| Sections (##) | 14 (Pendahuluan, 2-12 Rules, Lampiran) | grep |
| Rules per section | Sales: 15, Purchase: 12, Production: 10, R&D: 8, Warehouse: 10, Finance: 15, HR: 5, QC: 5, KPI: 10, Comm: 5, Cross-cutting: 10 | manual |
| Anomaly: BUS-RULE-005 size | ~17.6KB | suspicious (vs avg 0.5-3KB per rule) |

---

## ✅ Strengths

### Business Analyst view
- **Bahasa Indonesia** untuk tim operasional (Upii & staff) — accessibility bagus.
- **Format konsisten** per rule: Deskripsi, Konteks, Logika, Pesan Error, Sumber Spec, Siapa Terlibat, Test Case, Catatan.
- **Coverage matrix** (Lampiran A) — bisa verify completeness.
- **Test Case** eksplisit per rule — langsung jadi test scenario.
- **Pesan Error** eksplisit — bisa verify error code & message di backend.

### Software Architect view
- **Prioritas order** (§1.4) — REQUIREMENT > DEC > NEX > NFR > default — clear precedence.
- **Authority chain** — director override allowed dengan audit log.
- **DEC reference** per rule — traceability bagus.

### QA view
- **105 rules** dengan explicit test cases — excellent untuk QA planning.
- **Error codes** standard (DP_MINIMUM_NOT_MET, dll) — bisa di-assert.
- **Sources Spec** reference — bisa verify dengan dokumen lain.

---

## 🔴 Critical Findings

**None** untuk dokumen ini. Tapi ada 1 anomali yang perlu investigasi.

---

## 🟠 Major Findings

### MAJ-1: BUS-RULE-005 Bloated (~17.6KB vs avg ~1KB)
Rule ini (Credit Limit Check) memakan ~17.6KB sementara rule lain 0.5-3KB. Tampaknya berisi JSON schema atau SQL inline.

**Action needed**:
1. Inspect BUS-RULE-005 content untuk lihat apa yang bloated.
2. Extract schema/SQL ke appendix atau file terpisah.
3. Keep rule body ringkas (logic only).

### MAJ-2: DEC numbering reference conflict
Line 6: `_PROCESS_DECISIONS_LOG.md — DEC-001..034 (LOCKED)` = 34
Tapi MASTER_SPEC §9.1: "26 LOCKED decisions" = 26.

Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-5.

### MAJ-3: Reference ke `raw/HR.md` (line 1055)
"raw/HR.md (Passive Harvesting), DEC-005"
File `raw/` referenced tapi tidak di folder `contracts/`. Verify location.

### MAJ-4: References ke file yang tidak ada di folder `contracts/`
BUSINESS_RULES references beberapa file yang referenced tapi offline:
- `raw/ERP_INPUT_OUTPUT_LINEAGE.md`
- `raw/05_master_business_process_blueprint.md` (referenced di workflow state machine §6)
- `raw/warehouse.md`
- `raw/production.md`
- `raw/HR.md`

Apakah ini di folder `docs/legacy-erp/raw/`? Verify.

---

## 🟡 Minor Findings

### MIN-1: HR Rules (8) & QC Rules (5) labeled "Phase 2"
Apakah Phase 2 module rules perlu di-lock sekarang atau di-defer?

### MIN-2: KPI Calculation Rules (10) — apakah ini di-implement sebagai scheduled jobs atau real-time calculation?
Lihat BUS-RULE-095..104.

### MIN-3: Cross-cutting Rules (10) — apakah overlap dengan Global Principles di MASTER_SPEC §5?
- BUS-RULE-096 Idempotency Key vs MASTER_SPEC §5.2 #11
- BUS-RULE-097 Format Kode Universal vs MASTER_SPEC §5.2 #16
- BUS-RULE-098 Document Numbering Finance vs NEX_FINANCE_FINAL_SPEC
- BUS-RULE-099 CoA Delete vs LOCKED principle?

Verify tidak duplikat.

### MIN-4: Pesan Error format tidak konsisten
Beberapa pakai underscore_case, beberapa pakai Title Case. Standarkan.

### MIN-5: Logika code blocks — beberapa pakai pseudo-code, beberapa pakai SQL, beberapa English prose. Pilih 1 format.

---

## 🔵 Nit / Polish

### NIT-1: Document Version di header — 1.0 (2026-09-16). Apakah ini first release atau ada v0.x sebelumnya?

### NIT-2: Lampiran B "Open Questions untuk User (Upii)" — apakah sudah resolved atau masih open? Cross-ref ke MASTER_SPEC §8.3 (9 PENDING).

### NIT-3: Tidak ada explicit "rule priority" — semua kelihatan equal priority. Beberapa rule mungkin lebih critical dari yang lain (mis. credit limit vs sample fee).

---

## 📋 Rekomendasi per Section

| § | Issue | Priority |
|---|-------|----------|
| Header | DEC numbering sync | P0 |
| BUS-RULE-005 | Extract bloated content | P1 |
| Various | Verify raw/ references | P2 |
| 1.4 | Confirm priority order vs MASTER_SPEC §9.4 | P1 |
| Cross-cutting | Check overlap dengan MASTER_SPEC §5 | P2 |
| Lampiran B | Sync dengan MASTER_SPEC §8.3 | P1 |
| Pesan Error | Format consistency | P3 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-4, X-5, X-9
- See `01_DOMAIN_MODEL_REVIEW.md`, `03_WORKFLOW_STATE_MACHINE_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md`
