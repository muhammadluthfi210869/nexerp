# 01 — DECISIONS LOG (Quick Reference)

> **Tujuan:** Compact reference keputusan final untuk session berikutnya. Jika memory hilang, baca file ini lebih dulu sebelum `00_DISCUSSION_NOTES_2026-09-10.md` (yang lebih panjang).
> **Last updated:** 2026-09-10
> **Format:** Tabel sederhana, satu baris = satu keputusan. ID bisa dirujuk dari file lain.

---

## Strategi Delivery

| ID | Keputusan | Alasan Singkat |
|---|---|---|
| **D-01** | **HYBRID**: R1 Master per-divisi murni (110 layar), R2-R6 vertical slice per business flow end-to-end | Master cross-cutting tapi bukan flow participant; R2+ flow natural cross-divisi |
| **D-02** | **Strangler Fig** refactor, bukan big-bang rewrite | Risiko full rewrite terlalu tinggi |
| **D-03** | **Modular Monolith** (1 DB, 1 deploy) | Premature microservices |
| **D-04** | **Hexagonal Architecture** (domain/application/infrastructure/interface) | Decoupling Prisma/HTTP dari business logic |
| **D-05** | **Vertical Slice per business flow** (R2-R6) | ERP flow cross-divisi |

## Architecture

| ID | Keputusan | Reference |
|---|---|---|
| **D-06** | **Domain Event + Outbox Pattern** (bukan direct service import) | memory `module_integration` |
| **D-07** | API envelope: `{ data: T, meta?: PaginationMeta }` | memory `api_envelope` |
| **D-08** | Error: **RFC 7807 Problem Details** | memory `error_format` |
| **D-09** | Naming: **camelCase** (legacy snake_case via mapper) | memory `naming_convention` |
| **D-10** | API versioning: URI `/v1` `/v2` + `Sunset` header | memory `api_versioning` |
| **D-11** | Service maks **400 LOC**, pecah jadi sub-service | memory `service_max_loc` |
| **D-12** | Migration: `prisma migrate deploy` prod (no `db push`) | memory `migration_policy` |

## Testing & Quality

| ID | Keputusan | Reference |
|---|---|---|
| **D-13** | Test pyramid: Unit 70%+ / Integration all / E2E 10 flow | memory `test_pyramid` |
| **D-14** | Backend first, contract-driven, vertical-slice modernization | `docs/plan/ERP_FINALIZATION_MASTER_PLAN.md` |
| **D-15** | Domain correctness > UI completeness | `ERP_FINALIZATION_MASTER_PLAN.md` §3.3 |

## Deployment & Environment

| ID | Keputusan | Reference |
|---|---|---|
| **D-16** | **Single tenant** (companyId opsional) | memory `tenant_model` |
| **D-17** | **Docker Compose** VPS (Postgres + BE + FE + Nginx + Watchtower) | memory `deployment_target` |
| **D-18** | **Fresh start** seed untuk dev | User decision 2026-09-10 |
| **D-19** | FE dev port **3003** | memory `frontend_dev_port` |

## Quality Gates & Process (NEW — User Explicit 2026-09-10)

| ID | Keputusan | Enforcement |
|---|---|---|
| **D-20** | **DNA-Only Component Policy** — operasional route wajib DNA, larang `@/components/ui/*` + raw HTML | `STRICT_POLICIES_ADDENDUM.md` + ESLint rule `no-raw-ui-import-on-operational` + Husky |
| **D-21** | **Atomic Commit Discipline** — 1 perubahan besar = 1 atomic commit, Conventional Commits | `STRICT_POLICIES_ADDENDUM.md` + Husky + Commitlint + lint-staged |
| **D-22** | R1 Master scope = **110 layar** (107 MOD-01 - 1 Tax + 4 approval) | User decision 2026-09-10 |
| **D-23** | R1 timeline = **10 hari kerja** 2 engineer paralel + team agent | User decision 2026-09-10 |
| **D-24** | Frontend strategy: **Fix drift incremental** | User decision 2026-09-10 |

---

## File Location (paths absolute, di repo ini)

| File path | Fungsi |
|---|---|
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\00_DISCUSSION_NOTES_2026-09-10.md` | Catatan lengkap diskusi (panjang) |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\01_DECISIONS_LOG.md` | **FILE INI** (compact) |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\02_OPEN_ADR_TRACKER.md` | 15 ADR pending |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\PHASE_0_RUNBOOK.md` | PowerShell runbook evidence freeze |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\R1_MASTER_ACCESS_RELEASE_PLAN.md` | R1 release plan lengkap |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\docs\legacy-erp\backend\STRICT_POLICIES_ADDENDUM.md` | DNA-Only + Atomic Commit addendum |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\.husky\pre-commit` | Husky hook lint-staged |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\.husky\commit-msg` | Husky hook commitlint |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\commitlint.config.cjs` | Conventional Commits config |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\eslint.config.mjs` | Flat ESLint config |
| `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\eslint-rules\no-raw-ui-import.cjs` | Custom ESLint rule |

---

## Stack Snapshot

| Layer | Tech |
|---|---|
| Backend | NestJS 11 + Prisma 7.8 + PostgreSQL (`@prisma/adapter-pg`) |
| Frontend | Next.js **16.2.6** + React 19.2.4 (App Router, `output: "standalone"`) |
| UI | shadcn 4.1 (legacy) + DNA components (target) + Tailwind v4 + lucide-react |
| Forms | react-hook-form 7.72 + zod 4.3 |
| State | TanStack Query 5.96 |
| Auth | jose (JWT) |
| Test | Vitest 4.1 (FE) + Playwright 1.59 (E2E) |
| TypeSync | openapi-typescript 7.13 |
| Dev port | Backend 3001, Frontend 3003 |

---

## Critical Numbers to Remember

- **178 layar ERP** (`NEX_ERP_MASTER_SPECIFICATION.md`) / **176 screens JSON** (gap 2 — ADR-001)
- **95 Prisma model** di **19 schema file split** (akan dikonsolidasi)
- **520 endpoint** (per audit awal, mungkin sudah lebih sekarang)
- **210+ TypeScript source files** di backend
- **110 layar R1 scope** (D-22)
- **10 hari kerja** R1 timeline (D-23)
- **400 LOC max** per service file (D-11)
- **70%+ unit test coverage** core services (D-13)
- **9 trigger auto-jurnal** + 6 Golden Threads (per Master Spec + plan existing)

---

## Yang TIDAK Boleh Dilanggar (Hard Constraints)

1. ❌ Big-bang rewrite (D-02)
2. ❌ `prisma db push` di production (D-12)
3. ❌ `@Body() any` di controller baru (existing 40+ violation harus dimigrasi)
4. ❌ Raw HTML control di operational routes (D-20)
5. ❌ Mix concerns dalam 1 commit (D-21 atomic)
6. ❌ Skip Quality Gate — exit criteria PHASE_0 + R1 DoD harus hijau
7. ❌ Multi-tenant (D-16 single tenant)
8. ❌ Microservices premature (D-03 modular monolith)
9. ❌ Direct service import cross-module (D-06 domain event + outbox)
10. ❌ Mutation tanpa idempotency-key di PO/GR/Invoice/Payment/SO/Fund Request

---

## Actions Pending User (PowerShell Manual)

```powershell
# 1. Setup Husky (10 menit)
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend"
npm install --save-dev husky@^9 @commitlint/cli@^19 @commitlint/config-conventional@^19 lint-staged@^15
npm run prepare
npm run lint

# 2. Evidence Freeze (2-4 jam)
# Buka: docs\legacy-erp\backend\PHASE_0_RUNBOOK.md
# Jalan §1 sampai §6, paste output ke session berikutnya

# 3. Diskusi 15 ADR (split dengan Kilo di session berikutnya)
# Lihat: docs\legacy-erp\backend\02_OPEN_ADR_TRACKER.md
```

---

*Dokumen ini boleh dipaste ke dalam chat session berikutnya sebagai konteks awal.*
*Last updated: 2026-09-10*
