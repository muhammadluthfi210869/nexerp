# Review: `09_NON_FUNCTIONAL_CONTRACT.md`

> **Audit date**: 2026-09-16
> **File**: 826 lines, ~32KB
> **Status declared**: LOCKED
> **Verdict**: 🟢 **Comprehensive** — clear NFR, minor gaps

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 826 | wc -l |
| Major sections | §1-§X (timezone, currency, formats, etc.) | sample |

---

## ✅ Strengths

### Business Analyst view
- **Timezone/locale**: Asia/Jakarta, IDR currency — explicit Indonesian-first.
- **Date formats**: ISO 8601 for API, Indonesian format for UI.
- **Currency formatting**: `Rp 1.500.000,00` dengan dot-thousand dan comma-decimal.
- **Calendar**: Indonesian holiday calendar + cuti bersama.

### Software Architect view
- **DB rule**: every DateTime = TIMESTAMP WITH TIME ZONE, UTC in storage, WIB for display.
- **Money rule**: DECIMAL(18,2) in DB, integer in API (no subunit).
- **Implementation rule**: never use `new Date()` without explicit timezone.
- **Backend converts UTC → WIB** for "today" comparisons.

### QA view
- **Test scenarios** bisa verify: format output, timezone conversion, currency rounding.
- **Locale-specific** testing untuk Indonesian format.

---

## 🔴 Critical Findings

**None** untuk dokumen ini.

---

## 🟠 Major Findings

### MAJ-1: Authority order — referenced by RBAC as `09_NFR §8`
Line di RBAC: `_SSOT_AUTH.md §4 > 09_NFR §8 > this file`

Apakah `09_NFR §8` adalah sub-authority atau specific topic? Verify.

Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-4.

### MAJ-2: Reference ke `_SSOT_FINANCE.md` (tax section)
BUSINESS_RULES reference `_SSOT_FINANCE.md` tapi dokumen ini tidak eksplisit di NFR. Apakah `_SSOT_FINANCE.md` ada atau merge ke `NEX_FINANCE_FINAL_SPEC.md`?

---

## 🟡 Minor Findings

### MIN-1: Performance/load requirements — tidak ada explicit SLA
- Response time target (p95)?
- Concurrent users target?
- Throughput target?

**Fix**: Tambah §X Performance SLAs.

### MIN-2: Backup & DR — tidak explicit
- RPO/RTO targets?
- Backup frequency?
- DR strategy?

### MIN-3: Logging level standardization
- Apakah ada standard untuk log levels (DEBUG, INFO, WARN, ERROR)?
- Structured logging requirement (JSON)?
- Log retention policy?

### MIN-4: Monitoring & alerting
- APM tool (New Relic, Datadog, Sentry)?
- Alert thresholds?
- Uptime monitoring?

### MIN-5: Scalability
- Horizontal scaling support?
- Stateless backend?
- Database connection pooling?

---

## 🔵 Nit / Polish

### NIT-1: Holiday calendar — apakah include cuti bersama (joint leave)? Sample bilang ya tapi belum definitive list.

### NIT-2: `Intl.DateTimeFormat` reference — apakah ini standard library atau perlu polyfill untuk older Node?

---

## 📋 Rekomendasi per Section

| Section | Issue | Priority |
|---------|-------|----------|
| Authority | Sync dengan MASTER_SPEC §9.4 | P1 |
| Tax | `_SSOT_FINANCE.md` reference verify | P2 |
| N/A | Add Performance SLA | P1 |
| N/A | Add Backup/DR | P2 |
| N/A | Add logging standard | P2 |
| N/A | Add monitoring | P2 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-4
- See `07_RBAC_MATRIX_REVIEW.md`, `08_INTEGRATION_EVENT_CONTRACT_REVIEW.md`
