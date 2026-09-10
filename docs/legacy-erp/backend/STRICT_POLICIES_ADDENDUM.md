# STRICT POLICIES ADDENDUM — ERP DREAMLAB

> **Status:** Addendum Wajib ke seluruh dokumen plan di `docs/legacy-erp/backend/`
> **REALIGN 2026-09-10:** Referensi eksternal di-realign dari `docs/legacy-erp/backend/{00_MASTER,02_REFACTOR,04_FRONTEND}.md` (TIDAK ADA) ke [`docs/plan/`](../../plan/) dan [`docs/legacy-erp/_archive/`](../../legacy-erp/_archive/) yang REAL. Lihat tabel cross-reference di bawah.

---

## ⚠️ REALIGN NOTICE — Cross-Reference ke Plan Existing (REAL)

| Topik di addendum ini | Real plan references (post-realign) |
|---|---|
| DNA-Only Component Policy + Visual DNA authority | [`docs/design/LAYOUT_GOVERNANCE.md`](../../design/LAYOUT_GOVERNANCE.md) + [`docs/DNA-RULES-CONTRACT.md`](../../DNA-RULES-CONTRACT.md) + `frontend/src/components/dna/COMPONENT_INVENTORY.md` |
| Visual DNA reset (cyber → minimal Sleek Modern) | [`docs/plan/UI_PARITY_RESTORATION_PLAN.md`](../../plan/UI_PARITY_RESTORATION_PLAN.md) |
| Triple-Lock Strategy (Static + Runtime + Dynamic E2E) | [`docs/plan/FULLSTACK_INTEGRITY_PLAN.md`](../../plan/FULLSTACK_INTEGRITY_PLAN.md) + [`docs/plan/ERP_V4_QA_MASTER_PLAN.md`](../../plan/ERP_V4_QA_MASTER_PLAN.md) |
| 7 Layers Integrity + Atomic Fix Workflow | [`docs/plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md`](../../plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md) |
| Husky pre-commit + lint-staged + commitlint (Code Quality phase) | [`docs/plan/ZERO_ERROR_ROADMAP.md`](../../plan/ZERO_ERROR_ROADMAP.md) Phase 4 + Phase 5 |
| Per-divisi vertical slice after R1 | [`docs/plan/HYPER_ALIGNMENT_PLAN.md`](../../plan/HYPER_ALIGNMENT_PLAN.md) Fase 1-4 |
| Backend Foundation + State Machine + Security (overlap R1 area) | [`docs/plan/ERP_FINALIZATION_MASTER_PLAN.md`](../../plan/ERP_FINALIZATION_MASTER_PLAN.md) Fase 1 |
| R1 Master & Access scope + Backend Primitives (110-layar scope) | [`R1_MASTER_ACCESS_RELEASE_PLAN.md`](./R1_MASTER_ACCESS_RELEASE_PLAN.md) (sudah di-realign) |
| Architecture decisions (Modular Monolith + Hexagonal + Domain Event + Outbox) | memory project.md `architecture_style`, `module_integration`, `api_envelope`, `naming_convention`, `error_format`, `api_versioning` |

> **Status:** Addendum Wajib ke seluruh dokumen plan di `docs/legacy-erp/backend/`
> **Tanggal:** 2026-09-10
> ** Berlaku sejak:** Phase 1 Baseline Recovery (existing plan)
> **Author:** Sprint 5 Architecture Team

---

## Pendahuluan

Dua kebijakan ini adalah **tambahan WAJIB** di atas semua plan existing. Tujuan:

- **Konsistensi UI 100%** — tidak boleh ada komponen UI tradisional seperti `<button>` raw, shadcn `@/components/ui/*`, atau library lain selain DNA di halaman **operational**.
- **Reproducibility & rollback yang andal** — setiap perubahan besar = **1 atomic commit**, dengan conventional message, tag, dan kemampuan revert per-commit atau per-group.

| Kebijakan | Lokasi Detail | Hook ke Plan |
|---|---|---|
| A. DNA-Only Component Policy | [BAGIAN A](#bagian-a--dna-only-component-policy) | `04_FRONTEND_VISUAL_DNA_ALIGNMENT.md` Section 9 |
| B. Atomic Commit Discipline | [BAGIAN B](#bagian-b--atomic-commit-discipline) | `02_REFACTOR_AND_DELIVERY_PLAYBOOK.md` Section 5 |
| C. Integration Both Policies | [BAGIAN C](#bagian-c--bagaimana-2-kebijakan-ini-connect) | `00_MASTER_PLAN.md` Section 7 DoR + Section 8 DoD |
| D. Implementasi Eksekusi | [BAGIAN D](#bagian-d--implementasi-eksekusi) | Husky + Commitlint + ESLint setup |
| E. Connect ke Plan Existing | [BAGIAN E](#bagian-e--connect-dengan-plan-existing) | Update R1 release plan |
| F. Open Questions (ADR) | [BAGIAN F](#bagian-f--open-questions-perlu-adr-atau-klarifikasi-user) | ADR-013 / 014 / 015 |
| G. Kapan Mulai Berlaku | [BAGIAN G](#bagian-g--kapan-mulai-berlaku) | Severity escalation timeline |

---

## BAGIAN A — DNA-Only Component Policy

### A.1 Prinsip

Halaman **operational** (list, create/edit form, detail/inspection, approval list) WAJIB 100% menggunakan **DNA components** dari `frontend/src/components/dna/` (atau folder DNA di project ini):

- `DnaButton`, `DnaInput`, `DnaSelect`, `DnaDatePicker`, `DnaTable`, `DnaModal`, `DnaTabs`, `DnaCard`, `DnaToast`, dll.

#### ❌ LARANG ABSOLUT

- Import dari `@/components/ui/*` (legacy shadcn) di operational routes
- Raw HTML control (`<button>`, `<input>`, `<select>`, `<table>`, `<dialog>`) di operational routes, kecuali DNA primitive tidak punya (wajib ADR override)
- Library UI lain (MUI, Chakra, Ant Design, Material-UI, Bootstrap, dll)

#### ✅ Pengecualian yang BOLEH (wajib ADR)

| Tipe Route | Boleh | Alasan |
|---|---|---|
| **Marketing module** (SCR spesifik marketing) | Custom per existing DNA spec | Marketing butuh visual flexibility |
| **Digital marketing pages** | Standalone components | Public-facing, branding-driven |
| **Design system showcase** (`/dna-visual/*`, `/dna-visual/golden-reference/*`) | DNA primitive `As Is` + legacy untuk dokumentasi | Reference page, bukan production |
| **Test files** (`*.test.tsx`, `*.spec.tsx`) | Bebas | Isolation untuk unit testing |

### A.2 Klasifikasi Halaman per Kategori

Mengacu ke `04_FRONTEND_VISUAL_DNA_ALIGNMENT.md` Section 4:

| Kategori | DNA Compliance | Catatan |
|---|---|---|
| **Operational List** | ✅ Wajib DNA | Table, filter, pagination via DNA |
| **Create/Edit Form** | ✅ Wajib DNA | Input, Select, DatePicker, validation feedback |
| **Detail/Inspection** | ✅ Wajib DNA | Card, Tabs, Modal |
| **Approval List** | ✅ Wajib DNA | Action button, status badge |
| **Dashboard Eksekutif** | ✅ Wajib DNA | Boleh beda layout dari operational, tapi tetap DNA primitives |
| **Digital Marketing** | ⚠️ Bebas (ter-update sesuai scope) | Public-facing |
| **Reference / Demo / Showcase** | ⚠️ Bebas | Bukan production route |

### A.3 Migration Strategy (Increment, BUKAN Blanket Codemod)

Sesuai `04_FRONTEND_VISUAL_DNA_ALIGNMENT.md` Section 9 — dengan constraint tambahan:

> **1 Component Family = 1 PR = 1 Atomic Commit** (tidak boleh campur)

#### Component Family Migration Order (priority by count)

| # | Component Family | Reason |
|---|---|---|
| 1 | Date picker / date range picker | Paling banyak violation (form-heavy modules) |
| 2 | Select / search-select | Form field kedua paling banyak |
| 3 | Modal / Dialog | Confirmation + form dialog |
| 4 | Table (data + action) | Operational list backbone |
| 5 | Button + Icon Button | Universal |
| 6 | Card / Metric Card | Dashboard + detail |
| 7 | Tabs + Toolbar | Detail view navigation |
| 8 | Form fields (Input, Checkbox, Radio, Textarea) | Core form |
| 9 | Navigation (Sidebar, Breadcrumbs, Pagination) | Shell chrome |
| 10 | Toast, Tooltip, Popover | Feedback layer |

#### Per-PR Workflow untuk Setiap Component Family

1. Inspect existing DNA primitive → apakah sudah support kebutuhan page?
2. Kalau belum, **EXTEND DNA primitive dulu** di commit terpisah (atomic)
3. Migrasi 1 page atau 1 batch (max 3–5 file) ke DNA primitive
4. Test + visual regression
5. Commit atomic + tag, contoh:
   ```
   refactor(dna): migrate date-picker to DNA on /scm/receiving
   ```

### A.4 Enforcement (CI/CD Gates)

#### ESLint Custom Rule: `no-raw-ui-import-on-operational`

| Aspek | Detail |
|---|---|
| **Trigger** | Import statement di file di `app/(dashboard)/` operational routes |
| **Forbidden** | `from '@/components/ui/'`, `from '@/components/ui/[legacy-name]'`, raw HTML control patterns di JSX (`<button>` tanpa import DNA) |
| **Allowed escape hatch** | `// dna-allow-legacy` comment (wajib alasan di comment) |

#### Pre-Commit Hook (via Husky)

Scan file yang di-stage:
- ❌ Fail jika ada raw UI import di operational route
- ⚠️ Warning untuk raw HTML control dengan comment yang valid

#### CI Pipeline

- Scan seluruh production route untuk pattern violation
- Report warning ke PR comment
- **Block merge untuk P0 routes** (master, finance, scm inbound/outbound)

### A.5 Compliant vs Non-Compliant Examples

#### ❌ Non-compliant (di operational route)

```tsx
import { Button } from '@/components/ui/button';

export default function ReceivingForm() {
  return <Button onClick={handleClick}>Simpan</Button>;
}
```

#### ✅ Compliant

```tsx
import { DnaButton } from '@/components/dna';

export default function ReceivingForm() {
  return (
    <DnaButton variant="primary" onClick={handleClick}>
      Simpan
    </DnaButton>
  );
}
```

#### ⚠️ Allowed with ADR

Untuk 1–2 kasus terpaksa (legacy migration bertahap), boleh pakai raw dengan comment:

```tsx
// dna-allow-legacy: SCR-XXX masih pakai shadcn, akan dimigrasi di PR #YYY
import { Button } from '@/components/ui/button';
```

### A.6 Kapan Boleh di-Disable per-Route

| Route / Page | Status | Alasan |
|---|---|---|
| Marketing module specific pages | ⚠️ Disable butuh ADR override | Custom branding |
| Design system / golden reference pages | ✅ Exclude otomatis | `/dna-visual/*` di-allowlist |
| Legacy pages dengan feature flag migrasi | ⚠️ Exclude dengan comment | Transisi plan |

---

## BAGIAN B — Atomic Commit Discipline

### B.1 Prinsip

Setiap perubahan besar = **SATU atomic commit** dengan:

- ✅ Conventional Commits message
- ✅ Co-authored (jika pair)
- ✅ Tag dan reference ke Slice ID / SCR / ADR
- ✅ Bisa di-revert individual atau dalam batch

### B.2 Conventional Commits Format (WAJIB)

> **Format:** `<type>(<scope>): <subject>`

#### Type yang Dipakai

| Type | Use Case |
|---|---|
| `feat` | Fitur baru untuk user |
| `fix` | Bug fix |
| `refactor` | Code change yang tidak menambah/mengurangi fitur |
| `perf` | Performance improvement |
| `style` | Formatting saja (no logic change) |
| `docs` | Dokumentasi saja |
| `chore` | Maintenance (deps, config) |
| `test` | Tambah test |
| `build` | Build system / CI |
| `revert` | Revert commit |
| `db` | Migration schema/data |
| `dna` | DNA component migration |
| `api` | API endpoint contract change |

#### Scope (Contoh)

- **Domain:** `master`, `finance`, `scm`, `rnd`, `production`, `warehouse`, `qc`, `busdev`, `creative`, `legality`, `hr`, `executive`, `system`
- **Platform:** `code-engine`, `audit`, `outbox`, `rbac`, `error`, `envelope`, `idempotency`
- **Layer:** `frontend`, `backend`, `infra`, `ci`

#### Subject Rules

- ✅ Imperative: "add", "fix", "refactor" (bukan "added", "fixed", "refactored")
- ✅ Max 72 char
- ✅ Lowercase
- ✅ Tidak diakhiri titik

#### Body (Opsional tapi Recommended untuk Slice Besar)

```
feat(finance): implement 3-tier approval engine

- Add tier resolver service
- Add SoD policy guard
- Add tier snapshot in approval_instance
- Migration: add approval_policy table
- Tests: unit (5) + integration (3)

Refs: ADR-005, E2-008, GT-01
SCR covered: SCR-059/061/062/065
```

#### Footer (Referensi)

- `Refs: ADR-005, E2-008`
- `Slice ID: P2P-APPR-001`
- `Golden Thread: GT-01`
- `SCR: SCR-059`
- `Reverts: <commit-hash>` (untuk revert commit)

### B.3 Atomic Commit Rules

Sebuah commit dianggap **ATOMIC** jika SEMUA ini terpenuhi:

| # | Rule | Contoh Violation |
|---|---|---|
| 1 | **Scope kecil** — 1 logical change | Subject pakai "and"/"also" → pecah |
| 2 | **Buildable** — code setelah commit harus compile | Ada import yang missing → pecah |
| 3 | **Testable** — test harus bisa run setelah commit | Test broken → pecah |
| 4 | **Reversible** — 1 commit bisa di-revert tanpa mengganggu commit lain | Coupled dengan commit lain → pecah |
| 5 | **Traceable** — subject menjelaskan apa yang berubah | Vague subject → perjelas |

#### ❌ Contoh TIDAK Atomic (mixed concerns)

```
feat(finance): add CoA validation, refactor journal engine, fix billing bug
```

→ **Pecah jadi 3 commit** seperti di bawah.

#### ✅ Contoh Atomic (3 commits terpisah)

```
feat(finance): add CoA code unique constraint via migration
feat(finance): implement CoA DTO with IsCodeUnique validator
fix(finance): prevent posting to manual-journal=false accounts
```

### B.4 Branch Strategy (Single Trunk + Tag)

- **Trunk:** `main` branch (protected)
- **Tag per release:**
  - `r0-baseline-v1.0.0` (evidence freeze done)
  - `r1-master-v1.1.0-rc1` (R1 release candidate)
  - `r1-master-v1.1.0` (R1 stable)
  - `r2-procurement-v1.2.0` (R2 release)
- **Tag per slice complete:**
  - `slice-P2P-INB-001-done` (setelah GT-01 inbound lulus)
- **Tag per atomic commit dengan migration impact:**
  - `migration-2026-09-12-add-sof-flag`

### B.5 Pre-Commit Checklist (WAJIB sebelum push)

| # | Check | Tool |
|---|---|---|
| 1 | ✅ Subject conventional commits compliant | `commitlint` |
| 2 | ✅ Scope jelas (tidak mixed concerns) | manual + commitlint |
| 3 | ✅ No debug code (`console.log`, `debugger`, `// TODO remove`) | ESLint + Husky |
| 4 | ✅ Tidak ada secret / `.env` values | Husky secret-scanner |
| 5 | ✅ Tests updated/added untuk code yang berubah | CI |
| 6 | ✅ Migration file included (kalau schema berubah) | manual + DB lint |
| 7 | ✅ Docs updated (kalau API atau business rule berubah) | manual |
| 8 | ✅ Tidak ada raw UI import di operational routes | ESLint `no-raw-ui-import-on-operational` |
| 9 | ✅ Tidak ada `process.env.X` di luar `ConfigService` | ESLint `no-process-env-outside-config` |
| 10 | ✅ Tidak ada `@Body() any` atau `@Body() dto: any` pattern | ESLint `no-body-any` |

### B.6 Tooling yang Setup untuk Atomic Commit

#### Husky (pre-commit hook menjalankan):

1. `lint-staged` (ESLint + Prettier per staged file)
2. Scan raw-UI-import di operational routes
3. Scan secret leakage
4. Scan debug code (`console.log`)

#### Commitlint

- Enforce conventional commits format

#### lint-staged

- Jalankan formatter/linter hanya di staged file

#### commit-msg hook

- Reject commit message yang tidak sesuai format

### B.7 Rollback Procedure

Setiap commit harus punya rollback path:

#### 1. Single Commit Revert (kalau cause jelas)

```bash
git revert <commit-hash>
git commit -m "revert(<scope>): <reason>"
```

→ Otomatis create revert commit dengan subject `revert(...)`.

#### 2. Tag Rollback (kalau banyak commit di release)

```bash
git checkout r0-baseline-v1.0.0
git tag rollback-pre-r1
```

#### 3. Hot-Fix Rollback (kalau tag issue)

```bash
git revert <tag>..HEAD
```

→ Otomatis batch revert + 1 atomic commit.

#### 4. Migration Rollback (kalau migration applied)

- **Forward-fix lebih diutamakan** (existing plan policy)
- Backup-restore sebelum/after migration runbook sudah ada di `PHASE_0_RUNBOOK.md`

---

## BAGIAN C — Bagaimana 2 Kebijakan Ini Connect

| Layer | DNA-Only Policy | Atomic Commit |
|---|---|---|
| **CI Quality Gate** | ESLint scan raw UI import | commitlint + conventional check |
| **Position** | UI Compliance Gate | Build & Release Safety Net |
| **Kapan jalan** | Pre-commit + CI per-PR | Pre-commit + CI per-PR |
| **Block merge kalau** | P0 route violation | Invalid commit message |
| **Reference di DoR/DoD** | `00_MASTER_PLAN.md` Section 7 + 8 | `00_MASTER_PLAN.md` Section 7 + 8 |
| **Reference di Release Plan** | `R1_MASTER_ACCESS_RELEASE_PLAN.md` Quality Gates | `R1_MASTER_ACCESS_RELEASE_PLAN.md` Quality Gates |

```
┌─────────────────────────────────────────────────────────────┐
│   Developer commits → Pre-commit hooks → PR open           │
│                                                             │
│   [Husky]  ──▶ ESLint + lint-staged + secret scan           │
│   [Husky]  ──▶ commitlint (conventional commits)            │
│                                                             │
│                            │                                │
│                            ▼                                │
│                                                             │
│   CI Pipeline → Quality Gates                               │
│   • Unit test (must pass)                                   │
│   • DNA compliance scan (warning/error per BAGIAN A.4)      │
│   • Conventional commit history check                       │
│   • Visual regression (if UI change)                        │
│                                                             │
│                            │                                │
│                            ▼                                │
│                                                             │
│   Merge ke main → atomic + tag sesuai BAGIAN B.4            │
└─────────────────────────────────────────────────────────────┘
```

---

## BAGIAN D — Implementasi Eksekusi

### D.1 File yang Perlu Dibuat/Diupdate

| File | Tipe | Tujuan |
|---|---|---|
| `frontend/.eslintrc.json` | Update | Tambah custom rule `no-raw-ui-import-on-operational` |
| `frontend/.husky/pre-commit` | Create | Hook script |
| `frontend/.husky/commit-msg` | Create | commitlint call |
| `frontend/commitlint.config.js` (or .cjs) | Create | Config conventional commits |
| `frontend/package.json` | Update | Tambah husky + commitlint + lint-staged scripts |
| `dashboard/src/lib/dna-audit.ts` | Create (optional) | Runtime check helper |

### D.2 Setup Manual oleh User (shell constraint)

Karena shell permission rule `bash: deny *` aktif di agent level, **user harus menjalankan command manual di PowerShell**:

```powershell
# 1. Install deps
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend"
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional lint-staged

# 2. Init husky
npx husky init

# 3. Auto-setup husky
npm run prepare

# 4. Copy file .husky/pre-commit dan .husky/commit-msg dari template yang agent sediakan
```

### D.3 Audit Existing Violations

Sebelum rule aktif, agent `Wave 1A` akan menghasilkan:

- Total violations (count by component family)
- Sample file yang melanggar
- Migration order rekomendasi

Setelah count ada, agent `Wave 1C` akan setup rule dengan **severity warning dulu** (jangan langsung error) untuk transisi. Setelah semua violation dimigrasi, naikkan ke **error**.

---

## BAGIAN E — Connect dengan Plan Existing

### E.1 Update `04_FRONTEND_VISUAL_DNA_ALIGNMENT.md` Section 9

Tambahkan referensi ke **BAGIAN A** dari addendum ini sebagai **ENFORCEMENT LEVEL**:

> Lihat `docs/legacy-erp/backend/STRICT_POLICIES_ADDENDUM.md` BAGIAN A — DNA-Only Component Policy untuk enforcement CI/CD, ESLint rule, dan migration strategy increment.

### E.2 Update `02_REFACTOR_AND_DELIVERY_PLAYBOOK.md` Section 5 (PR Policy)

Tambahkan referensi ke **BAGIAN B** sebagai **COMMIT DISCIPLINE**:

> Lihat `docs/legacy-erp/backend/STRICT_POLICIES_ADDENDUM.md` BAGIAN B — Atomic Commit Discipline untuk conventional commits format, atomic rules, dan rollback procedure.

### E.3 Update `00_MASTER_PLAN.md` Section 7 (DoR) + Section 8 (DoD)

Tambahkan reference ke kedua-duanya:

- **DoR Section 7** — sebelum mulai slice:
  - ✅ DNA compliance plan untuk affected routes
  - ✅ Commit strategy (berapa atomic commit dibutuhkan)
- **DoD Section 8** — sebelum declare slice done:
  - ✅ Semua commit atomic + conventional compliant
  - ✅ No raw UI import di operational routes
  - ✅ Tag sesuai BAGIAN B.4

### E.4 Update `R1_MASTER_ACCESS_RELEASE_PLAN.md` Quality Gates

Tambahkan ke daftar Quality Gates:

- ✅ DNA compliance scan di PR pipeline
- ✅ Atomic commit enforcement
- ✅ Conventional commit check
- ✅ Pre-commit Husky hooks aktif

---

## BAGIAN F — Open Questions (perlu ADR atau klarifikasi user)

| # | Pertanyaan | ADR ID | Status |
|---|---|---|---|
| F.1 | Apakah legacy shadcn di `frontend/src/components/ui/` HARUS dihapus total setelah migration, atau di-keep sebagai internal DNA base (DNA membungkus shadcn)? | **ADR-013** | 🔴 Butuh keputusan user |
| F.2 | Apakah marketing module benar-benar boleh exception, atau semua production routes harus DNA? | **ADR-014** | 🔴 Butuh keputusan user |
| F.3 | Untuk atomic commit + conventional commits, apakah pakai `commitlint` strict atau ada opsional scope? | **ADR-015** | 🔴 Butuh keputusan user |

### Detail F.1 — Legacy shadcn disposition

- **Opsi A:** Hapus total `@/components/ui/*` setelah semua operational route migrated. Lebih bersih.
- **Opsi B:** Keep shadcn sebagai internal base, DNA membungkus shadcn (`DnaButton = styled(Button)`). Banyak tim pakai pendekatan ini (shadcn DNA foundation).

### Detail F.2 — Marketing exception

- **Opsi A:** Marketing module = full exception, boleh raw HTML / library lain. Trade-off: inkonsistensi tapi flexibility tinggi.
- **Opsi B:** Semua production routes (termasuk marketing) = DNA only. Trade-off: konsisten, tapi marketing visual jadi constrained.

### Detail F.3 — Commitlint strictness

- **Opsi A:** Strict — type + scope WAJIB sesuai daftar di BAGIAN B.2.
- **Opsi B:** Flexible — type WAJIB, scope opsional. Trade-off: onboarding lebih mudah tapi konsistensi lebih rendah.

---

## BAGIAN G — Kapan Mulai Berlaku

| Phase | Severity | Scope |
|---|---|---|
| **Phase 1 Baseline Recovery** | 🟡 Warning | Setup tooling Husky + Commitlint + ESLint. Existing violations belum di-block. |
| **Phase 1 → R1 release** (1 release train / 1 sprint) | 🟡 Warning | Transisi. Audit + migrate bertahap per [BAGIAN A.3 order](#a3-migration-strategy-increment-bukan-blanket-codemod). |
| **Setelah R1 selesai** | 🔴 Error | Operational routes baru = ZERO raw UI import. Existing violations harus sudah 0 atau di-feature-flag dengan ADR. |

### Enforcement Timeline

```
Phase 0            Phase 1                R1 release           Post-R1
  │                   │                      │                    │
  ▼                   ▼                      ▼                    ▼
Tooling setup    Warning severity        Migrate 90%+         Error severity
Husky + ESLint  Audit violations         violations           Block merge if
Commitlint      per BAGIAN A.3           remaining            raw UI in P0
Lint-staged     1 PR per family          Warning → Error      operational route
```

---

## Lampiran — Quick Reference

### A. Ringkasan DNA-Only Policy

```
IF  route ∈ operational (list, form, detail, approval)
AND import source ∉ @/components/dna/*
THEN
    ❌ BLOCK (unless // dna-allow-legacy with reason)
```

### B. Ringkasan Atomic Commit

```
IF  subject contains "and" or "also"
OR  commit touches > 1 logical concern
THEN
    ❌ SPLIT into multiple atomic commits
```

### C. Commit Message Template

```
<type>(<scope>): <subject>

[body — what & why, not how]

Refs: ADR-XXX, SCR-XXX
Slice ID: XXX-YYY-ZZZ
Golden Thread: GT-XX
```

---

**End of Addendum** — file ini WAJIB direferensikan di setiap dokumen plan baru yang dibuat setelah 2026-09-10.