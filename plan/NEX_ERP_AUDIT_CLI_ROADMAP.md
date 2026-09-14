# NEX ERP AUDIT-CLI ROADMAP
**Companion document to `NEX_ERP_REFACTOR_ROADMAP.md`**

> **Versi:** 1.0 — 8 September 2026 (regenerated 9 September 2026)
> **Owner:** Muhammad Luthfi
> **Acuan:** `plan/NEX_ERP_REFACTOR_ROADMAP.md` v2.0 + Section 12 (Hallucination Rules), 13 (Ship Criteria), 14 (Phase Gates), 16 (Production Readiness), 17 (Kontradiksi Resolution), 78 poin `docs/legacy-erp/REQUIREMENT.md`
> **Tujuan:** Mendefinisikan peran **AI Auditor CLI** terpisah dari AI Implementer — untuk validasi independen agar ERP benar-benar production-ready dengan **resilience**, bukan sekadar zero-bug.

---

## 📑 Table of Contents

0. **[🔴 READ FIRST — Apa & Mengapa Audit-CLI](#0--read-first--apa--mengapa-audit-cli)
1. [Konsep & Prinsip Desain](#1-konsep--prinsip-desain)
2. [Workflow: Auditor dalam Pipeline Implementer](#2-workflow-auditor-dalam-pipeline-implementer)
3. [Phase A0: BOOTSTRAP (sekali)](#3-phase-a0-bootstrap-sekali)
4. [Phase A1: PER-PR GATE (per commit/PR)](#4-phase-a1-per-pr-gate)
5. [Phase A2: PER-BATCH GATE (per roadmap batch)](#5-phase-a2-per-batch-gate)
6. [Phase A3: PER-MODULE GATE (per departemen)](#6-phase-a3-per-module-gate)
7. [Phase A4: PRE-PRODUCTION GATE (per release)](#7-phase-a4-pre-production-gate)
8. [Phase A5: CONTINUOUS OPS (saat live)](#8-phase-a5-continuous-ops)
9. [Phase A6: POST-INCIDENT (per bug report)](#9-phase-a6-post-incident)
10. [Operational Safety: Bug Ada Tapi Tidak Mengganggu](#10-operational-safety)
11. [Opini Jujur: Risiko yang Perlu Diwaspadai](#11-opini-jujur)
12. [Action Plan — Urutan Implementasi](#12-action-plan)
13. **[📋 AUDIT_VERDICT_FORMAT — Template Laporan](#13--audit_verdict_format)
14. **[🔗 INTEGRATION_DENGAN_ROADMAP](#14--integration-dengan-roadmap)
15. **[🛡️ THE 7 PILLARS DEEP-DIVE AUDIT PROTOCOLS](#15--the-7-pillars-deep-dive-audit-protocols)
16. **[🧪 ALL-TESTING HARNESS & ORCHESTRATION](#16--all-testing-harness--orchestration)
17. **[🔍 MICRO-ERROR & DEFECT HUNTING CATALOG](#17--micro-error--defect-hunting-catalog)
18. **[📊 MASTER_DEFECT_REGISTER_PROTOCOL](#18--master-defect-register-protocol)

---

## 0. 🔴 READ FIRST — Apa & Mengapa Audit-CLI

### 0.1 Gap yang Ditemukan

Roadmap v2.0 sudah mature untuk sisi **implementer**: Ship Criteria, Phase Gates, Hallucination Rules, Production Readiness — semua ada. Tapi ada **gap besar**:

> **Tidak ada independen auditor yang memvalidasi klaim implementer.**

Buktinya ada di memory: wrapper Omni CRM hilang saat merge production-light, tidak ada yang notice sampai E2E test dijalankan.

### 0.2 Solusi: 2 Peran AI Terpisah

| Peran | Tugas | Mindset | Akses |
|---|---|---|---|
| **AI Implementer** | Bikin sesuai batch di roadmap | "Pekerjaan selesai" | Full read/write |
| **AI Auditor (BARU)** | Verify klaim implementer | "Saya tidak percaya sampai ada bukti" | **Read-only** |

### 0.3 Apa yang Boleh & Tidak Boleh Dilakukan Auditor

**BOLEH:**
- ✅ Baca semua file, run test, grep/ripgrep pattern
- ✅ Generate laporan audit ke `plan/audit-reports/`
- ✅ Update memory file tentang audit findings
- ✅ Kasih verdict PASS/FAIL dengan evidence

**TIDAK BOLEH:**
- 🚫 Edit kode produksi
- 🚫 Auto-pivot / auto-rollback (user yang decide)
- 🚫 Approve klaim tanpa reproducer / evidence
- 🚫 Modify roadmap tanpa ADR baru

---

## 1. Konsep & Prinsip Desain

### 1.1 Lima Prinsip

1. **Read-only access** — tidak boleh Edit/Write kode produksi
2. **Scope-aware** — operational ✅, dashboard 🔒, Digital Marketing 🚫
3. **Evidence-first** — setiap verdict wajib ada file:line atau screenshot
4. **Domain-loaded** — wajib baca Section 0, 12-17 + REQUIREMENT.md sebelum audit
5. **Severity-graded** — P0/P1/P2/P3 dengan SLA beda

### 1.2 Severity Classification

| Severity | Definisi | Contoh | SLA Fix |
|---|---|---|---|
| **P0** | Data loss, security breach, blocker | Salah hitung payment, expose API tanpa auth | Same day |
| **P1** | Degraded functionality, happy path broken | E2E flow putus step 3 | 3 hari |
| **P2** | Cosmetic / minor functional | Typo, console warning | Sprint berikutnya |
| **P3** | Nit / nice-to-have | Komen outdated, dead import | Backlog |

---

## 2. Workflow: Auditor dalam Pipeline Implementer

```
Implementer selesai Batch X
        ↓
Implementer kasih "Submit for Audit" + klaim ringkasan
        ↓
Auditor jalankan Audit (A1/A2/A3/dst)
        ↓
PASS → lanjut Batch X+1
        ↓
FAIL → temuan + daftar fix → implementer perbaiki → re-audit
```

**Exception Logging (P2/P3 yang dilanjut):**
```
plan/audit-reports/EXCEPTIONS.md

| Date | Batch | Finding ID | Severity | Reason Approved | Owner |
|------|-------|------------|----------|-----------------|-------|
| 2026-09-15 | 7 | A2.4-001 | P2 | Will fix Sprint 9 | Luthfi |
```

---

## 3. Phase A0: BOOTSTRAP (sekali)

**Tujuan:** Setup auditor + baseline metrics SEBELUM batch apapun diaudit.

| Batch | Apa yang dilakukan | Output |
|---|---|---|
| **A0.1 — Doc Ingestion** | Baca Section 0, 12-17, Appendix D/E + REQUIREMENT.md | `.claude/audit/context.md` |
| **A0.2 — Audit Toolkit** | Script: scope fence, DNA compliance, hardcode pattern, type safety | `frontend/scripts/audit/*.sh` |
| **A0.3 — Baseline Metrics** | Snapshot: broken pages, test coverage, E2E pass rate, bundle size | `plan/audit-reports/BASELINE_<date>.md` |
| **A0.4 — Scope Fence Whitelist** | Whitelist path boleh edit, blacklist (dashboard, marketing, dna-visual) | `frontend/scripts/audit/scope-fence.json` |

---

## 4. Phase A1: PER-PR GATE

**Target durasi: <5 menit per PR. Kapan: tiap PR sebelum merge.**

| Batch | Cek apa | Severity kalau FAIL |
|---|---|---|
| **A1.1 Scope Fence** | File berubah sesuai scope (bukan dashboard/marketing/dna-visual) | **P0** |
| **A1.2 Diff Size** | Max 100 baris/commit; >500 = REJECT | **P0** |
| **A1.3 DNA Compliance** | Zero `@/components/ui/*` imports di operational pages (ADR-007) | **P0** |
| **A1.4 Hardcode Patterns** | `bg-emerald-100`, `bg-blue-600`, `text-[14px]`, raw `<input>` di luar DNA | **P1** |
| **A1.5 Hallucination Markers** | Tidak ada `console.log`, TODO unresolved, dead imports | **P2** |
| **A1.6 Type Safety** | `tsc --noEmit` exit 0, zero `: any` baru | **P1** |
| **A1.7 Forbidden Mutations** | File dihapus tapi masih ada referensi | **P0** |

**Tools:**
```bash
# Scope fence
git diff --name-only | grep -E "^frontend/src/app/\(dashboard\)/dashboard|^frontend/src/app/\(dashboard\)/marketing|^frontend/src/app/\(dashboard\)/dna-visual" && exit 1

# DNA compliance
grep -rEln "from ['\"]@/components/ui/" frontend/src \
  | grep -v "/components/dna/" | grep -v "/dna-visual/" \
  | grep -v "/components/ui/" | grep -v "/dashboard" | grep -v "/marketing/"

# Type safety
cd frontend && npx tsc --noEmit
```

---

## 5. Phase A2: PER-BATCH GATE

**Target durasi: 30-60 menit per batch. Kapan: setiap batch di-declare DONE.**

| Batch | Cek apa | Severity kalau FAIL |
|---|---|---|
| **A2.1 Build Health** | tsc --noEmit + lint + build = 4/4 hijau | **P0** |
| **A2.2 Per-Page Audit (9 kriteria)** | Render, visual match, DNA, API real, loading/empty/error states, responsive, a11y, E2E pass, traceable | **P0/P1** |
| **A2.3 Visual Regression** | Playwright screenshot vs baseline ≥99% similarity | **P1** |
| **A2.4 E2E Re-Run (Independent)** | Auditor run ulang sendiri dengan fresh DB seed | **P0** |
| **A2.5 API Contract Match** | Swagger spec vs @ApiProperty vs actual endpoint | **P0** |
| **A2.6 DB Schema Integrity** | prisma validate + migrate status = 0 error | **P0** |
| **A2.7 Test Coverage** | Unit ≥70% untuk business logic baru | **P1** |

**9 Kriteria per page (SHIP_CRITERIA 13.1):**
1. ✅ Halaman render tanpa error di console
2. ✅ Visual match golden reference
3. ✅ Pakai DNA components (bukan hardcoded UI)
4. ✅ API endpoint real (bukan mock data)
5. ✅ Loading + empty + error states implemented
6. ✅ Responsive (desktop + tablet minimum)
7. ✅ Accessibility (keyboard nav, ARIA labels, contrast)
8. ✅ E2E test passing
9. ✅ Traceable ke requirement ID

---

## 6. Phase A3: PER-MODULE GATE

**Target durasi: 1-2 hari per modul. Kapan: sebelum modul di-declare PRODUCTION-READY.**

| Batch | Cek apa |
|---|---|
| **A3.1 Functional Spec Match** | 100% poin REQUIREMENT.md applicable ke modul ini covered |
| **A3.2 Section 16.1-16.7** | Atomicity, concurrent editing, audit trail, upload security, OWASP, rate limit, money/tax |
| **A3.3 Section 16.8-16.13** | Timezone, performance, observability, backup, WCAG AA, browser matrix |
| **A3.4 Section 16.14 Cutover** | Cutover plan, rollback criteria, hypercare period, on-call rotation, runbook |
| **A3.5 Cross-Div Integration** | Event chain antar modul (PO→Bill, DO→AR, dll) |

**Modul yang diaudit:** Finance, SCM, Warehouse, QC, Production, BusDev, R&D, HR, Legality, Executive

---

## 7. Phase A4: PRE-PRODUCTION GATE

**Target durasi: 3-5 hari. Kapan: 1-2 minggu sebelum go-live.**

| Batch | Cek apa |
|---|---|
| **A4.1 All Modules PRODUCTION-READY** | A3 passed 10/10 modul |
| **A4.2 4 Cross-Div Test Flows** | BusDev→R&D→Prod→Deal, Purchase→GR→QC→AP, SO→DO→AR→Receipt, Closing→Reports→Executive |
| **A4.3 Security Audit** | OWASP top 10 scan, npm audit, penetration test basic |
| **A4.4 DR Drill** | Restore from backup dalam RTO target |
| **A4.5 Performance Load Test** | 100 concurrent users, p95 <2s page, <500ms API |
| **A4.6 Migration Rehearsal** | Data ERP lama dry-run, zero data loss |
| **A4.7 Monitoring Operational** | Sentry wired, alert thresholds, health check, dashboard accessible |

---

## 8. Phase A5: CONTINUOUS OPS

**Kapan: setelah go-live, continuous.**

| Batch | Cek apa | Threshold |
|---|---|---|
| **A5.1 Error Rate Monitor** | Real-time error rate | Warning >1%, Critical >5% |
| **A5.2 Latency SLO** | p95 API/page load | Warning p95 >1.5s/400ms, Critical >2s/500ms |
| **A5.3 Audit Log Completeness** | Ratio operasi/log | <0.95 → investigate |
| **A5.4 Money/Tax Spot-Check** | Weekly recalc 5 random jurnal | Mismatch → P0 |
| **A5.5 Dependency CVE Scan** | Weekly npm audit | High/Critical → 7 hari SLA |
| **A5.6 User-Reported Bug Triage** | Per tiket | P0 <1jam respond, P1 <4jam |
| **A5.7 Performance Regression** | Weekly bundle + query trend | Bundle >+5%, Query p95 >+20% |

---

## 9. Phase A6: POST-INCIDENT

**Kapan: per incident report (P0/P1/P2). SLA per severity.**

| Batch | Cek apa |
|---|---|
| **A6.1 Bug Reproduction** | Auditor reproduces independently in sandbox |
| **A6.2 Root Cause Analysis** | 5-why, file:line culprit |
| **A6.3 Severity Classification** | P0/P1/P2/P3 (per Section 1.2) |
| **A6.4 Regression Test Creation** | Test yang fail saat bug, pass setelah fix |
| **A6.5 Fix Verification** | Re-audit affected module |
| **A6.6 Pattern Detection** | Cek bug pattern di tempat lain |

---

## 10. Operational Safety

### 10.1 Tujuh Mekanisme WAJIB (sebelum go-live)

| # | Mekanisme | Implementasi |
|---|---|---|
| 1 | **Feature flags** | Disable fitur tanpa redeploy |
| 2 | **Idempotency keys** | UUID per request, server-side dedup |
| 3 | **Graceful degradation** | Circuit breaker, fallback UI, cached last-known-good |
| 4 | **Soft delete + retention** | `deletedAt` field, restore via audit |
| 5 | **Per-user session isolation** | Sandbox per-session, no shared mutable state |
| 6 | **Bulk operation guards** | Confirmation + dry-run preview + max-rows-per-action |
| 7 | **Canary releases** | Feature flag + cohort routing 1%→10%→100% |

### 10.2 SLA Metrics

| Metric | Target |
|---|---|
| **MTTR** | <30 menit untuk P0 |
| **Rollback success rate** | 100% |
| **Error budget** | 99.9% uptime (43 menit downtime/bulan) |
| **User-impacting bug rate** | <1/week reach production |

---

## 11. Opini Jujur

### 11.1 Auditor TIDAK Bisa Replace UAT Manusia
Auditor bagus untuk code quality, contract drift, performance regression. **Tidak bisa** judge UX feel, terminology bisnis, atau apakah angka "masuk akal". Tetap butuh UAT + human sign-off.

### 11.2 Shared Model Blind Spot
Kalau implementer & auditor sama model, ada blind spot sama. Mitigasi: auditor prompt prefixed adversarial framing + track false-positive rate.

### 11.3 Hallucination Risk di Auditor Juga
Finding tanpa reproducer = drop langsung. Track false-positive rate, recalibrate kalau >20%.

### 11.4 Scope Creep Audit = Mahal
Fokus: P0 paths (money/auth/journal) > P1 (transactional) > P2 (master data/read-only) > P3 (dashboard/decorative).

### 11.5 Memory Wajib Update
Setiap audit cycle → update memory. Audit tanpa memory = lesson hilang.

---

## 12. Action Plan

| Urutan | Aksi | Estimasi |
|---|---|---|
| 1 | Save file ini | done |
| 2 | Setup folder `plan/audit-reports/` + `frontend/scripts/audit/` | 1 jam |
| 3 | Baseline metrics snapshot → `BASELINE_<date>.md` | 2-3 jam |
| 4 | Implement Phase A0 (context.md + toolkit) | 1-2 hari |
| 5 | Mulai Phase A1 untuk PR berikutnya | immediate |
| 6 | Update roadmap utama Section 13/14 dengan referensi audit protocol | 1 jam |

**Quick win (bisa sekarang):**
```bash
mkdir -p plan/audit-reports/INCIDENTS
mkdir -p frontend/scripts/audit

# Scope fence
cat > frontend/scripts/audit/scope-fence.sh <<'EOF'
#!/bin/bash
FORBIDDEN=$(git diff --name-only "$1" | \
  grep -E '^frontend/src/app/\(dashboard\)/dashboard|^frontend/src/app/\(dashboard\)/marketing|^frontend/src/app/\(dashboard\)/dna-visual' || true)
if [ -n "$FORBIDDEN" ]; then
  echo "SCOPE VIOLATION: $FORBIDDEN"
  exit 1
fi
echo "Scope clean"
EOF
chmod +x frontend/scripts/audit/scope-fence.sh

# DNA compliance
cat > frontend/scripts/audit/dna-compliance.sh <<'EOF'
#!/bin/bash
VIOLATIONS=$(grep -rEln "from ['\"]@/components/ui/" frontend/src \
  | grep -v "/components/dna/" | grep -v "/dna-visual/" \
  | grep -v "/components/ui/" | grep -v "/dashboard" | grep -v "/marketing/" || true)
if [ -n "$VIOLATIONS" ]; then
  echo "DNA VIOLATIONS:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "DNA clean"
EOF
chmod +x frontend/scripts/audit/dna-compliance.sh
```

---

## 13. 📋 AUDIT_VERDICT_FORMAT

### 13.1 Per-PR (Phase A1)

```markdown
# A1 Per-PR Audit — PR #<num>
**Tanggal:** <date>

## Checklist
| Check | Result | Evidence |
|-------|--------|----------|
| A1.1 Scope Fence | ✅/🚫 | <evidence> |
| A1.2 Diff Size | ✅/🚫 | <lines> |
| A1.3 DNA Compliance | ✅/🚫 | <grep result> |
| A1.4 Hardcode | ✅/🚫 | <file:line> |
| A1.5 Hallucination | ✅/🚫 | <findings> |
| A1.6 Type Safety | ✅/🚫 | <tsc output> |
| A1.7 Mutations | ✅/🚫 | <deleted files> |

## Verdict: ✅ PASS / 🚫 REJECT / ⚠️ CONDITIONAL PASS
## Action Items: <list>
```

### 13.2 Per-Batch (Phase A2)

```markdown
# A2 Per-Batch Audit — Batch <id>
**Tanggal:** <date>

## Checklist
| Check | Result | Evidence |
|-------|--------|----------|
| A2.1 Build Health | ✅/🚫 | tsc+lint+build exit codes |
| A2.2 Per-Page (X pages) | N/N ✅ | <detail per page> |
| A2.3 Visual Regression | ✅/🚫 | <screenshot diff> |
| A2.4 E2E Re-Run | ✅/🚫 | X/Y green |
| A2.5 API Contract | ✅/🚫 | <endpoint checks> |
| A2.6 DB Schema | ✅/🚫 | prisma validate |
| A2.7 Test Coverage | ✅/🚫 | <%> |

## Verdict: ✅ PASS / 🚫 REJECT / ⚠️ CONDITIONAL PASS
## Exceptions Logged: <P2/P3 list>
## Sign-off: Auditor <session> — <date>
```

### 13.3 Per-Module (Phase A3)

```markdown
# A3 Per-Module Audit — <Module> Module
**Tanggal:** <date>

## Area Summary
| Area | Status |
|------|--------|
| A3.1 Functional Spec | ✅/⚠️/🚫 |
| A3.2 NFR 16.1-16.7 | ✅/⚠️/🚫 |
| A3.3 NFR 16.8-16.13 | ✅/⚠️/🚫 |
| A3.4 Cutover | ✅/⚠️/🚫 |
| A3.5 Cross-Div | ✅/⚠️/🚫 |

## Findings
- P0: <list>
- P1: <list>
- P2: <list>

## Verdict: ✅ PRODUCTION-READY / ⚠️ CONDITIONAL / 🚫 NOT-READY
## Tindak Lanjut: <fix list>
```

### 13.4 Pre-Production (Phase A4)

```markdown
# A4 Pre-Production Audit — Release v<X.Y.Z>
**Tanggal:** <date>
**Target Go-Live:** <date>

## Final Verdict: 🟢 GO / 🔴 NO-GO

## Checklist
| Area | Status |
|------|--------|
| A4.1 All Modules | ✅ 10/10 |
| A4.2 Cross-Div Flows | ✅ 4/4 |
| A4.3 Security | ✅ 0 critical |
| A4.4 DR Drill | ✅ RTO <30min |
| A4.5 Performance | ✅ p95 <2s |
| A4.6 Migration | ✅ Dry-run OK |
| A4.7 Monitoring | ✅ All wired |

## Sign-off Block
- Implementer Lead: ____________
- Auditor: ____________
- Product Owner: ____________
- Finance Manager: ____________
- IT/Ops: ____________
```

### 13.5 Incident (Phase A6)

```markdown
# Incident #<id> — <slug>
**Tanggal:** <date>
**Severity:** P<0|1|2|3>
**Status:** Investigating / Resolved / Closed

## Timeline
- HH:MM — <event>

## Root Cause
<File>:<line> — <explanation>

## Impact
<# users, data, duration>

## Fix
<commit hash> + <description>

## Regression Test
`tests/regression/incident-<id>.spec.ts` ✅

## Pattern Detection
<Similar bugs elsewhere, if any>

## Lessons Learned
- Process gap: <apa yang harusnya catch ini>
- Preventive Action: <list>
```

---

## 14. 🔗 INTEGRATION_DENGAN_ROADMAP

### Update Section 13 (SHIP_CRITERIA):
> "Sebelum batch di-declare DONE, batch HARUS lulus Phase A2 dari companion document `plan/NEX_ERP_AUDIT_CLI_ROADMAP.md`."

### Update Section 14 (PHASE_GATES):
> "Mapping audit gate: Phase 0/Sprint 0/Sprint 0.5 → A1 Per-PR; Sprint 1 → A2 schema validation; Batch 3A/3B/3C → A2 + A3 Finance; Sprint 9 → A2 + visual regression; Pre-go-live → A4 Pre-Production."

### Update CLAUDE.md:
```markdown
## Audit-CLI Protocol
Sebelum setiap PR / batch di-declare DONE, jalankan audit per
`plan/NEX_ERP_AUDIT_CLI_ROADMAP.md`. Auditor = read-only, adversarial.
Quick audit: `frontend/scripts/audit/*.sh`
```

---

## 15. 🛡️ THE 7 PILLARS DEEP-DIVE AUDIT PROTOCOLS

Untuk memastikan ERP benar-benar zero-silent-failure dan beroperasi dengan integritas penuh, auditor menjalankan protokol audit mendalam yang dibagi menjadi **7 Pilar**.

### 15.1 Pilar 1: Static Code Health & Zero-Tolerance Micro-Errors
Audit statik otomatis untuk mendeteksi error sintaks, tipe data kendor, dan bad practices sebelum kode dieksekusi.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **Strict Type Safety (FE)** | `cd frontend && npx tsc --noEmit` | Exit code 0, 0 errors, zero `: any` baru | **P1** |
| **Strict Type Safety (BE)** | `cd backend && npx tsc --noEmit` | Exit code 0, 0 errors, zero `: any` baru | **P1** |
| **DNA Component Enforcement** | `./frontend/scripts/audit/dna-compliance.sh` | 0 import `@/components/ui/*` pada operational pages | **P0** (ADR-007) |
| **Hardcode Pattern Lint** | `./frontend/scripts/audit/hardcode-pattern.sh` | 0 raw arbitrary Tailwind colors/spacing di luar DNA | **P1** |
| **Dead Code & Zombie Assets** | `npx knip` atau `eslint --rule 'no-unused-vars: error'` | Tidak ada dead files, dead exports, unused dependencies | **P2** |
| **Console Noise & Debug Leaks** | `grep -rn "console.log" frontend/src backend/src` | Bersih dari `console.log` debug (hanya boleh logger resmi) | **P2** |

### 15.2 Pilar 2: Database Integrity & Financial Precision
Audit pada level Prisma ORM (150 model), skema database, dan kalkulasi uang/pajak.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **Decimal Precision Money/Tax** | Grep `Float` pada field currency/tax/balance di Prisma schema | **Zero `Float`** untuk uang/PPN/stok nominal; Wajib `Decimal(15, 2)` atau `Decimal(18, 4)` | **P0** |
| **Soft-Delete Leakage** | Audit query `prisma.<model>.findMany/findFirst/aggregate` | 100% query operasional menyertakan filter `deletedAt: null` | **P0** |
| **Transaction Atomicity** | Audit mutasi multi-tabel (PO, Invoice, DO, Stock Move) | Wajib dibungkus dalam `prisma.$transaction([ ... ])` | **P0** |
| **Sequence Number Concurrency** | Test race condition 50 concurrent request ke sequence generator | Zero nomor faktur/SO/PO duplikat, sequence gap tercatat | **P0** |
| **Foreign Key & Orphan Cascade** | `npx prisma validate` & audit `onDelete` referential actions | Relasi master-detail tidak boleh cascade delete ke data akuntansi | **P0** |
| **Rounding Reconciliation** | Recalculate PPN 11% & diskon bertingkat vs Jurnal Umum | Selisih total pembulatan sen = Rp 0 | **P0** |

### 15.3 Pilar 3: Backend Security & Architecture (OWASP & RBAC)
Audit pada 82 NestJS services & 49 controllers untuk memastikan sistem aman dari eksploitasi dan kebocoran otorisasi.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **RBAC Guard Coverage** | Grep semua controller `@Post`, `@Put`, `@Patch`, `@Delete` | 100% endpoint mutasi memiliki `@UseGuards(JwtAuthGuard, RolesGuard)` | **P0** |
| **IDOR & Multi-Tenant Isolation** | Audit query backend terhadap session user | User tidak dapat mengakses/memutasi data divisi/tenant lain tanpa izin | **P0** |
| **DTO Input Sanitization** | Cek `main.ts`: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` | Request payload asing otomatis di-reject (HTTP 400) | **P1** |
| **Financial Idempotency** | Audit header `Idempotency-Key` pada endpoint Payment & Approval | Mencegah double-posting saat user klik ganda atau network timeout | **P0** |
| **File Upload Path Traversal** | Audit interceptor upload dokumen (NPF, CoA, BPOM, Bukti Transfer) | Validasi MIME type biner, rename random UUID, no directory traversal | **P0** |
| **Orphan Storage Cleanup** | Jalankan `npm run cleanup:uploads` di backend | Storage bebas dari file sisa upload form yang dibatalkan | **P2** |

### 15.4 Pilar 4: Frontend UI/UX States & Resilience
Audit terhadap 278 operational pages Next.js 16 (App Router) untuk memastikan tidak ada UI crash di hadapan user.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **9 Kriteria Per-Page** | Audit per page sesuai Section 13.1 `NEX_ERP_REFACTOR_ROADMAP.md` | Render, Visual match, DNA components, Real API, 3 States, Responsive, a11y, E2E, Traceable | **P0/P1** |
| **3 Essential States** | Periksa setiap page fetching async | Ada skeleton/spinner (Loading), ilustrasi DNA (Empty), banner retry (Error) | **P1** |
| **React 19 & Hydration Safety** | Playwright console error monitor saat initial load | Zero Hydration mismatch (`Text content did not match server-rendered HTML`) | **P1** |
| **Table Overflow & Responsive** | Periksa viewport tablet (768px - 1024px) | Data table memiliki horizontal scroll wrapper, tombol aksi tidak terpotong | **P2** |
| **Dirty Form Guard** | Test navigasi saat form terisi tapi belum disubmit | Tampil prompt konfirmasi peringatan data hilang | **P2** |
| **Unhandled Promise Rejection** | Test API endpoint error (HTTP 500/404) | UI tidak blank putih; ditangkap TanStack Query / Sonner toast | **P1** |

### 15.5 Pilar 5: Cross-Department Business Logic (78 Requirements)
Audit integritas alur operasional nyata pabrik kosmetik sesuai `docs/legacy-erp/REQUIREMENT.md`.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **78 Poin Requirement Matrix** | Traceability mapping per poin di Section 15 Roadmap | 100% item terpetakan memiliki verifikasi automated/manual | **P0/P1** |
| **CSV Single Source of Truth** | Verifikasi kolom & sample terhadap CSV acuan | 28 kolom BusDev, 14 kolom Daily R&D, 11 kolom Monitoring R&D tercover | **P0** |
| **FIFO / FEFO Material Valuation** | Audit algoritma pengeluaran bahan baku di Gudang | Batch terdekat expired date dialokasikan lebih dulu ke SPK Mixing | **P0** |
| **Reversing Journal (Jurnal Balik)** | Test pembatalan transaksi (Retur DO, Void Invoice) | Jurnal pembalik otomatis ter-create di general ledger tanpa edit manual | **P0** |
| **NPF & Formula Versioning** | Audit modul R&D & Legality | Setiap revisi formula memiliki snapshot immutable dan approval trail | **P0** |

### 15.6 Pilar 6: Non-Functional Requirements (NFR) & Resilience
Audit stabilitas sistem saat beban tinggi dan simulasi kegagalan server.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **Disaster Recovery (DR Drill)** | Eksekusi `./scripts/dr-drill.sh` di sandbox | Restore DB backup berhasil 100% dalam target RTO < 30 menit | **P0** |
| **Concurrency Load Test** | Jalankan `node scripts/load-test.js` (100 concurrent users) | Error rate < 1%, p95 API latency < 500ms, p95 page render < 2000ms | **P1** |
| **Memory Leak & Event Emitter** | Audit leak listener pada WebSocket / Event Emitter NestJS | Heap memory backend stabil setelah 1000 request berseri | **P1** |
| **Audit Trail Completeness** | Cek tabel `AuditLog` pasca mutasi entitas sensitif | Kolom `userId`, `action`, `ipAddress`, `oldValue`, `newValue` tercatat | **P0** |

### 15.7 Pilar 7: Production Ops & Observability
Audit kesiapan infrastruktur monitoring sebelum dan saat fase go-live.

| Target | Metodologi / Command | Kriteria Lolos (PASS) | Severity jika FAIL |
|---|---|---|---|
| **Health Check Endpoints** | `curl -f http://localhost:4000/api/health` | Response `200 OK` mencakup status DB connection, Redis, Disk space | **P0** |
| **Sentry / Error Tracking** | Uji throw test error di sandbox | Error masuk ke dashboard Sentry dengan call stack dan breadcrumbs lengkap | **P1** |
| **Graceful Degradation** | Matikan service eksternal (e.g. WA Gateway / Email) | ERP tetap dapat menjalankan proses core tanpa fatal server crash | **P1** |
| **Dependency Vulnerability** | `npm audit --audit-level=high` (BE & FE) | 0 critical vulnerabilities pada production dependencies | **P1** |

---

## 16. 🧪 ALL-TESTING HARNESS & ORCHESTRATION

Untuk mencapai full audit, seluruh test suite harus dijalankan secara terstruktur dalam 4 Layer piramida pengujian:

```
                  ┌─────────────────────────┐
                  │ Layer 4: Visual & Perf  │  Playwright Visual & Load Test
                  ├─────────────────────────┤
                  │ Layer 3: E2E Golden Path│  11 Business Steps (Playwright)
                  ├─────────────────────────┤
                  │ Layer 2: API & Contract │  Supertest E2E + OpenAPI Schema
                  ├─────────────────────────┤
                  │ Layer 1: Unit & Isolasi │  Jest (BE) + Vitest (FE)
                  └─────────────────────────┘
```

### 16.1 Layer 1 — Unit & Component Tests (Pondasi Logika)
* **Backend Unit (Jest)**:
  ```bash
  cd backend && npm run test:unit
  ```
  *Fokus Audit:* Logika kalkulasi pajak, COA posting balance, formula HPP, generator nomor seri dokumen.
* **Frontend Component (Vitest)**:
  ```bash
  cd frontend && npm run test
  ```
  *Fokus Audit:* Komponen DNA visual, form field formatter (mata uang Rupiah, tanggal WIB, validasi NPWP/NIB).

### 16.2 Layer 2 — API Contract & Integration Tests
* **OpenAPI Specification Match**:
  ```bash
  cd frontend && npm run sync-api -- --check
  ```
  *Fokus Audit:* Memastikan DTO NestJS tidak mengalami drift/desinkronisasi dengan TypeScript interface di Next.js.
* **Backend Integration E2E (Jest + Supertest)**:
  ```bash
  cd backend && npm run test:e2e
  ```
  *Fokus Audit:* Alur autentikasi JWT, lifecycle status per controller, Prisma transaction rollback saat error.

### 16.3 Layer 3 — Playwright E2E Golden Path (11 Business Steps)
Eksekusi alur bisnis end-to-end tanpa terputus dari awal order hingga repeat order:

| Step | Modul | Test File Terkait | Critical Assertion |
|---|---|---|---|
| **Step 1: Lead Capture** | BussDev | `tests/e2e/bussdev-lead.spec.ts` | Data Buku Tamu tersimpan, status `NEW` → `SAMPLE` |
| **Step 2: Sample & R&D** | R&D + Legal | `tests/e2e/rnd-sample.spec.ts` | Formula NPF terdaftar, nomor BPOM & HKI terverifikasi |
| **Step 3: Negotiation** | BussDev | `tests/e2e/bussdev-deal.spec.ts` | Kesepakatan harga & MOQ valid, status berubah `DEAL` |
| **Step 4: Sales Order (SPK)** | BussDev + WH | `tests/e2e/sales-order.spec.ts` | SO terbuat, reservasi stok kemasan/bahan baku terpicu |
| **Step 5: Down Payment** | Finance | `tests/e2e/finance-dp.spec.ts` | Verifikasi bukti bayar DP, jurnal Kas/Bank → Uang Muka |
| **Step 6: Production** | Production | `tests/e2e/production-flow.spec.ts` | SPK Mixing → Filling → Packing selesai, Finished Good tercatat |
| **Step 7: Quality Control** | QC | `tests/e2e/qc-inspection.spec.ts` | QC pass release batch; jika defect masuk karantina/rework |
| **Step 8: Delivery** | Logistics + WH | `tests/e2e/warehouse-do.spec.ts` | DO terbit, stok gudang berkurang sesuai kuantitas riil |
| **Step 9: Invoicing** | Finance | `tests/e2e/finance-invoice.spec.ts` | Faktur terpotong DP, perhitungan PPN 11% presisi |
| **Step 10: Payment Settlement** | Finance | `tests/e2e/finance-settlement.spec.ts` | Pelunasan sisa tagihan, piutang (AR) nol, jurnal penutup |
| **Step 11: Repeat Order** | BussDev | `tests/e2e/repeat-order.spec.ts` | Reminder interval konsumsi produk aktif, auto-draft SO baru |

*Command Eksekusi:*
```bash
npx playwright test tests/e2e/ --reporter=html
```

### 16.4 Layer 4 — Visual Regression & Performance Tests
* **Visual Regression (Playwright)**:
  ```bash
  cd frontend && npm run test:visual
  ```
  *Toleransi:* Pixel mismatch < 1%. Halaman operational wajib identik dengan golden reference.
* **Performance & Bundle Integrity**:
  ```bash
  cd frontend && npm run test:perf
  ```
  *Kriteria:* First Contentful Paint (FCP) < 1.5s, DOM elements < 1500, zero layout shift (CLS < 0.1).

---

## 17. 🔍 MICRO-ERROR & DEFECT HUNTING CATALOG

Auditor wajib mencari dan menolak temuan-temuan kecil berikut yang sering menjadi bom waktu produksi:

### 17.1 Daftar Anti-Pattern Mikro
1. **Enum Mismatch & String Drift**:
   * *Masalah:* Backend mengembalikan `'IN_PROGRESS'`, tapi frontend membandingkan `status === 'in-progress'`.
   * *Dampak:* Badge status selalu abu-abu / tombol submit terkunci selamanya.
2. **Floating-Point Currency Math**:
   * *Masalah:* Perhitungan total di JavaScript `const total = subtotal * 1.11`.
   * *Dampak:* Nilai `10000.000000000002` merusak tampilan cetak faktur dan ditolak bank.
3. **Leaking Soft-Delete pada Aggregations**:
   * *Masalah:* `prisma.stockItem.aggregate({ _sum: { quantity: true } })` tanpa `where: { deletedAt: null }`.
   * *Dampak:* Barang yang sudah di-void tetap terhitung dalam total aset gudang.
4. **Unchecked Nullable Access**:
   * *Masalah:* Akses `item.supplier.name` tanpa safe navigation `item.supplier?.name`.
   * *Dampak:* Halaman crash layar putih (white screen of death) jika relasi supplier terhapus.
5. **Orphaned File Storage**:
   * *Masalah:* User mengunggah lampiran PDF, tetapi kemudian membatalkan form atau terjadi error validasi. File tetap tersimpan di server.
   * *Dampak:* Disk server penuh oleh file sampah tanpa relasi database.
6. **Timezone Offset Glitches (WIB vs UTC)**:
   * *Masalah:* Input tanggal dari browser dikonversi tanpa timezone awareness, menyebabkan `2026-09-09 00:00 WIB` tersimpan sebagai `2026-09-08 17:00 UTC`.
   * *Dampak:* Tanggal faktur atau tanggal kedaluwarsa batch mundur 1 hari.
7. **Form Validation Drift (Zod vs Class-Validator)**:
   * *Masalah:* Skema Zod frontend mengizinkan string kosong `""`, tetapi DTO backend mewajibkan `@IsNotEmpty()`.
   * *Dampak:* Form submit gagal dengan error 400 samar tanpa pesan validasi yang jelas di UI.
8. **Silent React Query / Axios Error**:
   * *Masalah:* `catch (e) { console.error(e) }` tanpa me-rethrow error atau menampilkan notifikasi toast.
   * *Dampak:* User mengira proses berhasil padahal API backend gagal memproses data.
9. **Navbar Broken Links / Zombie Routes**:
   * *Masalah:* Tautan di menu samping mengarah ke path lama yang sudah di-refactor, menghasilkan 404.
   * *Dampak:* Alur kerja karyawan macet karena menu tidak bisa diakses.
10. **Missing DB Index pada Foreign Key**:
    * *Masalah:* Foreign key `salesOrderId` pada tabel transaksi besar tidak memiliki index.
    * *Dampak:* Query pencarian faktur melambat drastis setelah database berisi ribuan transaksi.

---

## 18. 📊 MASTER_DEFECT_REGISTER_PROTOCOL

Setiap temuan dari audit per-PR, per-batch, maupun per-modul wajib dicatat secara terpusat pada file:
`plan/audit-reports/MASTER_DEFECT_REGISTER.md`

### 18.1 Skema Defect Register

| Kolom | Deskripsi | Contoh |
|---|---|---|
| **Defect ID** | Format: `DEF-<Pilar>-<Nomor>` | `DEF-P2-042` |
| **Severity** | P0 (Blocker), P1 (Critical), P2 (Major), P3 (Minor) | `P0` |
| **Modul** | Divisi / Sub-sistem terkait | `Finance / Invoicing` |
| **Lokasi (Evidence)** | `file:line` atau route URL | `backend/src/modules/finance/invoice.service.ts:184` |
| **Deskripsi Temuan** | Detail kegagalan, reproducer, dan dampak bisnis | PPN dihitung menggunakan Float, selisih Rp 1 pada invoice multi-item |
| **Status** | `OPEN` / `IN_PROGRESS` / `RESOLVED` / `EXCEPTION` | `OPEN` |
| **Fix Commit** | Hash commit penyelesaian oleh Implementer | `a1b2c3d` |
| **Sign-off Auditor** | Tanggal & sesi verifikasi ulang | `Auditor-A2 — 2026-09-10` |

### 18.2 Aturan Resolusi Defect
1. **P0**: Release / Merge diblokir total. Wajib diperbaiki dan diverifikasi pada hari yang sama.
2. **P1**: Block feature release. Boleh dilanjut hanya jika ada persetujuan tertulis di `EXCEPTIONS.md` dengan SLA perbaikan maksimal 3 hari.
3. **P2 & P3**: Boleh dilanjut ke batch berikutnya, namun wajib terdaftar di `EXCEPTIONS.md` untuk diselesaikan pada sprint stabilisasi.

---

## 📎 Appendices

### Appendix A: Script Index

| Script | Fase / Pilar | Run | Deskripsi |
|---|---|---|---|
| `scope-fence.sh` | A1 / Pilar 1 | `./frontend/scripts/audit/scope-fence.sh <base-commit>` | Cek modifikasi di luar scope operational |
| `dna-compliance.sh` | A1 / Pilar 1 | `./frontend/scripts/audit/dna-compliance.sh` | Cek zero raw `@/components/ui/*` imports |
| `hardcode-pattern.sh` | A1 / Pilar 1 | `./frontend/scripts/audit/hardcode-pattern.sh` | Cek hardcoded color/spacing di luar DNA |
| `type-safety.sh` | A1 / Pilar 1 | `./frontend/scripts/audit/type-safety.sh` | Run TypeScript check frontend |
| `run-all.sh` | A1 / Pre-commit | `./frontend/scripts/audit/run-all.sh <base-commit>` | Eksekusi seluruh quick audit script |
| `e2e-api-tests.ps1` | A2 / Pilar 3 | `powershell -File ./scripts/e2e-api-tests.ps1` | Sanity check seluruh API backend |
| `dr-drill.sh` | A4 / Pilar 6 | `./scripts/dr-drill.sh` | Disaster recovery backup & restore rehearsal |
| `load-test.js` | A4 / Pilar 6 | `node ./scripts/load-test.js` | Performance stress test 100 concurrent users |
| `cleanup-orphan-uploads.ts`| A3 / Pilar 3 | `cd backend && npm run cleanup:uploads` | Scan dan audit file storage orphan |

### Appendix B: Report Index Template

```
plan/audit-reports/
├── BASELINE_<date>.md
├── MASTER_DEFECT_REGISTER.md
├── A1-pr-<num>-<date>.md
├── A2-batch-<id>-<date>.md
├── A3-module-<name>-<date>.md
├── A4-release-<version>-<date>.md
├── EXCEPTIONS.md
└── INCIDENTS/
    └── <id>-<slug>.md
```

### Appendix C: Glossary

| Istilah | Definisi |
|---|---|
| **Auditor** | AI CLI verifikasi, read-only, adversarial mindset |
| **Implementer** | AI CLI yang bikin kode per roadmap utama |
| **Scope Fence** | Whitelist/blacklist path yang boleh diedit |
| **DNA Compliance** | UI component harus dari DNA wrapper, bukan raw Radix |
| **SHIP_CRITERIA** | Definition of Done per level |
| **Hypercare** | 2 minggu setelah go-live dengan monitoring intensif |
| **RTO** | Recovery Time Objective |
| **P0/P1/P2/P3** | Severity (Section 1.2) |
| **Exception Logged** | P2/P3 yang dilanjut, masuk EXCEPTIONS.md |

---

**Generated:** 8 September 2026 (original)
**Regenerated:** 9 September 2026
**Maintained by:** Muhammad Luthfi + AI Auditor CLI