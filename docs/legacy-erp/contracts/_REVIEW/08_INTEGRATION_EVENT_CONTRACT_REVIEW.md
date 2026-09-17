# Review: `08_INTEGRATION_EVENT_CONTRACT.yaml`

> **Audit date**: 2026-09-16
> **File**: 1,041 lines, ~36KB
> **Status declared**: LOCKED
> **Verdict**: 🟢 **Solid** — well-structured event spec, minor gaps

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 1,041 | wc -l |
| Common schema | CloudEvents 1.0 subset | header |
| Delivery patterns | fan_out, chain, fire_and_forget, request_response | 4 patterns |
| Module events covered | Sales (started), Purchase, Production, etc. | sample |

---

## ✅ Strengths

### Business Analyst view
- **Event-driven architecture** clearly documented.
- **Per-event payload schema** — payload type-safe.
- **Source-of-truth references** jelas ke workflow, business rules, data ownership.

### Software Architect view
- **CloudEvents 1.0 subset** — industry standard.
- **Common schema** dengan `id, source, type, time, subject, correlation_id, tenant, version, data`.
- **Tenant isolation** explicit via `tenant` field.
- **Idempotency** via event ID.
- **Retry + DLQ** pattern documented.

### QA view
- **at_least_once delivery** — easier to test.
- **Idempotent handlers** requirement — explicit.

---

## 🔴 Critical Findings

**None** untuk dokumen ini.

---

## 🟠 Major Findings

### MAJ-1: Authority order conflict (consistent with other docs)
Line: `Source-of-truth references: 03_WORKFLOW_STATE_MACHINE.yaml, 04_BUSINESS_RULES.md, 02_DATA_OWNERSHIP.yaml, _SSOT_COMMUNICATION.md, raw/ERP_INPUT_OUTPUT_LINEAGE.md`

Tidak ada explicit `authority_order` di header (lain dari kontrak lain yang punya). Tapi referenced files punya urutan berbeda.

Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-4.

### MAJ-2: Reference ke `raw/ERP_INPUT_OUTPUT_LINEAGE.md` (line)
File ini referenced tapi tidak di folder `contracts/`. Verify location.

---

## 🟡 Minor Findings

### MIN-1: Common patterns documentation bagus, tapi tidak ada specific retry configuration
- Retry up to 3 attempts dengan exponential backoff (1s → 60s)
- DLQ: `events.dlq`

Verify:
- Apakah exponential backoff exact (1s, 2s, 4s, 8s, 16s, 32s, 60s)?
- DLQ retention period?
- DLQ replay mechanism?

### MIN-2: Schema version evolution
- `version: "1.0"` di common schema
- Apakah ada migration strategy untuk backward compatibility?

### MIN-3: Event ordering guarantee
- Apakah events dari 1 source dijamin ordered?
- Cross-source ordering?

### MIN-4: Schema registry
- Apakah ada schema registry untuk event payload?
- Validasi payload structure on emit/consume?

---

## 🔵 Nit / Polish

### NIT-1: Sales events listing sudah ekspansif di awal dokumen, tapi section lain (Purchase, Production, dll) apakah sejajar panjangnya? Spot-check.

### NIT-2: Tidak ada explicit SLA per event (max processing time).

---

## 📋 Rekomendasi per Section

| Section | Issue | Priority |
|---------|-------|----------|
| Header | Authority order ref | P1 |
| Line ~10 | Verify raw/ location | P2 |
| Common patterns | Retry config detail | P2 |
| Schema | Versioning strategy | P2 |
| Schema registry | Optional add | P3 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-4
- See `03_WORKFLOW_STATE_MACHINE_REVIEW.md`, `04_BUSINESS_RULES_REVIEW.md`
