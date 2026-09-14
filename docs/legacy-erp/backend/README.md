# 📚 `docs/legacy-erp/backend/` — Backend Documentation Package

> **Folder ini ADALAH paket dokumentasi backend ERP DREAMLAB** — semua keputusan, runbook, release plan, dan addendum kebijakan.
> **Last updated:** 2026-09-10

---

## 🚪 Pintu Masuk — Baca dengan Urutan Ini

Jika baru pertama datang ke folder ini (atau memory hilang), baca file dengan **urutan** berikut:

| # | File | Tipe | Kapan Baca |
|---|---|---|---|
| 1 | **`01_DECISIONS_LOG.md`** | Compact | **Selalu pertama** — 24 keputusan final dalam 1 tabel |
| 2 | **`00_DISCUSSION_NOTES_2026-09-10.md`** | Comprehensive | Panjang, baca kalau butuh konteks lengkap diskusi |
| 3 | **`02_OPEN_ADR_TRACKER.md`** | Tracker | Sebelum mulai R2+ implementation, cek 15 ADR open |
| 4 | **`PHASE_0_RUNBOOK.md`** | Runbook | **Sebelum apa pun** — PowerShell commands untuk evidence freeze |
| 5 | **`R1_MASTER_ACCESS_RELEASE_PLAN.md`** | Release Plan | Sebelum mulai R1 implementation |
| 6 | **`STRICT_POLICIES_ADDENDUM.md`** | Addendum | Sebelum code apapun — DNA-Only + Atomic Commit policy |

---

## 📂 Daftar File (6 substance + 1 README)

| File | Ukuran | Fungsi |
|---|---|---|
| `00_DISCUSSION_NOTES_2026-09-10.md` | ~500 baris | Catatan lengkap diskusi 2026-09-09 s/d 2026-09-10 + 24 keputusan + 14 keinginan + lessons learned |
| `01_DECISIONS_LOG.md` | ~150 baris | **Quick reference 24 keputusan final (D-01 s/d D-24)** + paths + critical numbers |
| `02_OPEN_ADR_TRACKER.md` | ~200 baris | 15 ADR open (12 dari existing + 3 baru) + sign-off priority |
| `PHASE_0_RUNBOOK.md` | ~470 baris | PowerShell runbook evidence freeze (2-4 hari kerja) |
| `R1_MASTER_ACCESS_RELEASE_PLAN.md` | ~750 baris | R1 Master & Access release plan lengkap (110 layar + 10 hari + 2 eng paralel) |
| `STRICT_POLICIES_ADDENDUM.md` | ~543 baris | DNA-Only Component Policy + Atomic Commit Discipline + Husky setup |

**Total: ~2.600 baris dokumentasi substansial**

---

## 🎯 Quick-Reference: Status Saat Ini

- ✅ **Decisions final:** 24 keputusan (D-01 s/d D-24)
- 🟡 **ADR pending:** 15 (12 existing + 3 baru) — lihat `02_OPEN_ADR_TRACKER.md`
- 🟡 **Action user:** Setup Husky lokal + jalan PHASE_0_RUNBOOK manual
- 🟢 **Memory project.md:** Hold semua keputusan strategic untuk continuity
- 🟢 **Enforcement tooling:** 5 file enforcement tools di `frontend/` (Husky, commitlint, ESLint custom rule)

---

## 🚀 Next Step — Tergantung Status Anda

### Jika baru mulai session baru:

1. Buka `01_DECISIONS_LOG.md` (1 menit baca).
2. Cek `02_OPEN_ADR_TRACKER.md` untuk status ADR.
3. Lanjut ke action pending user atau implementation.

### Jika mau lanjut R1 implementation:

1. Sudah selesai PHASE_0 evidence freeze (baseline hijau).
2. Husky + commitlint aktif.
3. ADR foundational (001, 003, 005, 010) sudah disign.
4. Buka `R1_MASTER_ACCESS_RELEASE_PLAN.md` dan mulai Backend Primitives hari 1-3 dengan 4 agent paralel.

### Jika ada konflik dokumen:

- `00_DISCUSSION_NOTES_2026-09-10.md` adalah sumber kebenaran utama.
- Diskusikan dengan Kilo, update ADR, revise dokumen.

---

## 🔗 Cross-Reference Penting

### Plan Existing (REAL di `docs/plan/`)

- `docs/plan/ERP_FINALIZATION_MASTER_PLAN.md` — Master execution plan (740 baris, 5 fase)
- `docs/plan/ZERO_ERROR_ROADMAP.md` — Status saat ini (Phase 1-3 ✅ DONE, 4 🏗 IN PROGRESS)
- `docs/plan/HYPER_ALIGNMENT_PLAN.md` — Vertical slicing per-divisi (SCM → WH → Production)
- `docs/plan/FULLSTACK_INTEGRITY_PLAN.md` + `ERP_V4_QA_MASTER_PLAN.md` — Triple-Lock Strategy
- `docs/plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md` — 7 Layers Integrity
- `docs/plan/FINANCE_ULTIMATE_ARCHITECTURE_PLAN.md` — Finance 4 fase
- 21 file lain di `docs/plan/` — lihat `00_DISCUSSION_NOTES_2026-09-10.md` §9 untuk daftar lengkap.

### Legacy Spec (di `docs/legacy-erp/_archive/`)

- 38 file business spec, blueprint, dan audit legacy
- `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md` — 178 layar SSOT
- `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` — 176 screen machine-readable

### Visual DNA Authority

- `docs/DNA-RULES-CONTRACT.md` — Wajib ZERO-HARDCODE-UI rule
- `docs/design/LAYOUT_GOVERNANCE.md` — Engineering rule
- `frontend/src/components/dna/COMPONENT_INVENTORY.md` — 60+ DNA component exports

### Memory Project.md (Kilo)

Key memory records:
- `delivery_strategy` — HYBRID (R1 per-divisi, R2-R6 vertical slice)
- `r1_release_scope` — 110 layar MOD-01
- `dna_only_policy` — DNA-Only enforcement
- `atomic_commit_policy` — Conventional Commits + Husky
- `open_adrs_3_new` — ADR-013/014/015 baru
- `plan_files_real_location` — real plan location correction
- `architecture_style`, `module_integration`, `api_envelope`, `error_format`, `naming_convention`, `api_versioning` — strategic decisions

---

## ⚠️ CRITICAL REMINDERS

1. **JANGAN** mulai R1 implementation sebelum PHASE_0 evidence freeze hijau.
2. **JANGAN** mulai R1 implementation sebelum ADR-001/003/005/010 disign.
3. **JANGAN** modify migration applied (`prisma/migrations/`) — forward-fix only.
4. **JANGAN** import `@/components/ui/*` di operational routes (DNA-Only).
5. **JANGAN** campur concerns dalam 1 commit (Atomic Commit).
6. **SELALU** pakai Conventional Commits (`feat/fix/refactor/dna/...`).
7. **SELALU** reference screen ke `NEX_ERP_SCREEN_AND_API_CATALOG.json` untuk spec-conformity.
8. **SELALU** tag release per R0/R1/R2/.../R6 + per slice complete + per migration impact.

---

*Folder ini adalah living documentation package. Update setiap ada keputusan baru.*

*Last updated: 2026-09-10*
