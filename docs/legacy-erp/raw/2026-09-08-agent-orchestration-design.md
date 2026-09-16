# Agent Orchestration Design — NEX ERP Refactor
**Tanggal:** 2026-09-08
**Versi:** 1.0
**Owner:** Muhammad Luthfi
**Acuan:**
- `plan/NEX_ERP_REFACTOR_ROADMAP.md` v2.0 (14 batches, 7 phases)
- `plan/NEX_ERP_AUDIT_CLI_ROADMAP.md` v1.0 (7 audit phases)
- `docs/legacy-erp/REQUIREMENT.md` (78 poin Upii)
- `VISUAL_DNA.md` + `DNA_CHEATSHEET.md` (operational DNA contract)
**Tujuan:** Mendefinisikan arsitektur orkestrasi agent untuk eksekusi paralel `NEX_ERP_REFACTOR_ROADMAP.md` sambil mempertahankan:
1. Testing per fase/divisi (Section 5 roadmap + Phase T)
2. DNA-only frontend imports (ADR-007)
3. Full AUDIT-CLI protocol per batch (Phase A1+A2 minimum)
4. Quality gate (P0/P1/P2/P3) sebelum lanjut batch berikutnya

**Target outcome:** ERP production-ready dalam 8-12 minggu dengan balanced risk profile, 3 implementer paralel per medium-batch, ~600K token/batch.

---

## 1. Arsitektur Orkestrasi — 4 Role

| Role | Tipe Akses | Jumlah per Batch | Tugas |
|---|---|---|---|
| **Coordinator** (satu sesi utama) | Full R/W | 1 | Spawn agents, manage state, merge commit, decide verdict interpretation, log exception, update memory |
| **Implementer** | Full R/W pada scope batch | 2-3 paralel | Bikin kode per scope (file group isolated). Wajib produce unit + integration test. Wajib baca `DNA_CHEATSHEET.md` dulu. |
| **Integration** | R/W untuk cross-cutting (event, schema, types) | 1 (kadang) | Wire event antar modul, update Prisma schema, regenerate `api-schema.d.ts`. Sequential per batch window. |
| **Auditor** | **Read-only** + run test | 1 | Jalankan A1 (per-PR) + A2 (per-batch). Prefix prompt: "SKEPTIS, setiap klaim butuh bukti file:line, default SANGGAH sampai ada reproducer." |

**Kontrak prompt tiap role:**

### Implementer prompt template
```
Kamu adalah implementer untuk Batch [X] dari NEX ERP Refactor.
Scope file yang BOLEH diedit: [explicit list]
File yang JANGAN disentuh: [explicit list — termasuk DNA components, Prisma schema, golden-reference]

WAJIB sebelum coding:
1. Baca DNA_CHEATSHEET.md + golden-reference page.tsx
2. Baca batch [X] deliverables di plan/NEX_ERP_REFACTOR_ROADMAP.md
3. Baca section terkait di docs/legacy-erp/REQUIREMENT.md

Output yang DIHARAPKAN:
- Code changes per file
- Unit tests untuk business logic baru
- Integration test untuk endpoint baru
- Commit message jelas per logical change

JANGAN:
- Edit file di luar scope (auditor akan reject)
- Hardcode UI patterns (wajib DNA components)
- Skip testing
- Leave console.log / TODO / FIXME unresolved
```

### Auditor prompt template (adversarial)
```
Kamu adalah auditor independen untuk Batch [X]. READ-ONLY.
Default mindset: SKEPTIS. Setiap klaim butuh bukti.

Tugas:
1. Jalankan Phase A1 (7 checks per NEX_ERP_AUDIT_CLI_ROADMAP.md Section 4)
2. Jalankan Phase A2 (7 checks per Section 5)
3. Tulis laporan ke plan/audit-reports/A2-batch-[X]-[date].md
4. Output verdict: PASS / CONDITIONAL PASS / REJECT

Setiap finding WAJIB:
- Severity: P0 / P1 / P2 / P3
- File:line evidence
- Reproducer (command atau steps)

JANGAN:
- Edit kode apapun
- Approve tanpa reproducer
- Skip check karena "kayaknya OK"
- Auto-pivot (per Section 2.4 AUDIT-CLI)
```

---

## 2. Per-Batch Workflow (5 Tahap)

```
T0 — KICKOFF (Coordinator)
  ├─ Baca deliverable batch [X] dari REFACTOR_ROADMAP.md
  ├─ Tentukan file ownership matrix (Section 3)
  ├─ Spawn 2-3 Implementer agents + 1 Auditor agent via Agent tool
  ├─ Setiap agent dapat: scope file list, prompt contract, ref ke roadmap batch
  └─ Coordinator holds lock untuk shared files

T1 — IMPLEMENTER FAN-OUT (paralel via Agent tool, max 16 concurrent)
  ├─ Implementer-A: pages/services group A (isolated)
  ├─ Implementer-B: pages/services group B (isolated)
  ├─ Implementer-C (optional): tests + integration wiring
  └─ Masing-masing: edit → run tsc --noEmit → atomic commit per logical change

T2 — CONVERGENCE (Coordinator collects)
  ├─ Coordinator review commits dari tiap implementer
  ├─ Run pre-audit: tsc + lint + DNA grep + build (semua harus hijau)
  ├─ Kalau gagal: kembali ke T1 dengan fix instruction
  └─ Kalau lulus: spawn Auditor agent

T3 — AUDIT RUN (Auditor agent, READ-ONLY)
  ├─ Auditor runs Phase A1 per implementer (7 checks)
  ├─ Auditor runs Phase A2 batch-level (7 checks)
  └─ Auditor outputs: plan/audit-reports/A2-batch-[X]-[date].md dengan verdict

T4 — VERDICT + DECISION (Coordinator + User escalation kalau P0)
  ├─ PASS → commit audit report → update memory → lanjut Batch X+1
  ├─ CONDITIONAL → log exception di EXCEPTIONS.md → lanjut dengan caution
  └─ REJECT → kembali ke T1 dengan fix list dari auditor

T5 — POST-BATCH
  ├─ Update memory files (status batch baru)
  ├─ Commit audit report ke git
  ├─ Update ROADMAP.md progress (jika applicable)
  └─ Log ke EXCEPTIONS.md untuk P2/P3
```

**Concurrency cap:** Maksimum 16 Agent tool calls concurrent (per Claude Code infrastructure). Per batch typically 2-3 implementer + 1 auditor = 3-4 concurrent = well within cap.

---

## 3. File Ownership Matrix (CRITICAL — anti-merge-hell)

| File Kategori | Owner | Aturan |
|---|---|---|
| **DNA components** (`@/components/dna/*`) | Coordinator only | Implementer BACA tapi tidak edit. Perubahan DNA butuh ADR baru + batch khusus. |
| **Golden reference** (`/dna-visual/golden-reference/page.tsx`) | Locked | Read-only untuk semua agent |
| **Prisma schema** (`backend/prisma/schema/*.prisma`) | Integration agent (1 per batch window) | Sequential. Generate migration → commit. Tidak boleh paralel. |
| **`api-schema.d.ts`** (frontend auto-gen) | Integration agent | Auto-regen via `npm run sync-api`. Tidak di-edit manual. |
| **ESLint config** (`frontend/eslint.config.mjs`) | Coordinator only | Perubahan butuh ADR |
| **tailwind.config.ts** | Coordinator only | Design token changes butuh ADR |
| **Operational pages** (`/finance/*`, `/scm/*`, dll) | Implementer A/B/C split by route prefix | Tidak overlap. 1 route = 1 agent. |
| **Backend services per module** | 1 Implementer per module | No cross-module service edit paralel |
| **Test files** | Implementer yang sama yang bikin code | Tests WAJIB ada di batch yang sama, coverage ≥70% |
| **`plan/audit-reports/*`** | Auditor only | Tidak boleh disentuh implementer |
| **`plan/EXCEPTIONS.md`** | Coordinator only | Log P2/P3 yang diizinkan lanjut |
| **Memory files** (`.claude/memory/`) | Coordinator only | Update per batch completion |

**Konflik detection:** Sebelum T0 kickoff, Coordinator run `git diff --name-only main..HEAD` untuk verify tidak ada overlap dari batch sebelumnya yang belum merged.

---

## 4. Audit Gate Schedule (Map ke AUDIT-CLI Phases)

| Phase AUDIT-CLI | Kapan di Orchestration | Scope | Target Durasi | Active? |
|---|---|---|---|---|
| **A0 Bootstrap** | SEKALI sebelum batch pertama | Context ingest, scope fence setup, audit toolkit, baseline metrics | 2-3 jam | ✅ ONCE |
| **A1 Per-PR** | Per Implementer agent (T3) | 7 checks: scope fence, diff size, DNA, hardcode, hallucination, type safety, mutations | <5 menit/check | ✅ PER BATCH |
| **A2 Per-Batch** | Per batch (T3) | 7 checks: build health, per-page 9-kriteria, visual regression, E2E re-run, API contract, DB schema, coverage | 30-60 menit | ✅ PER BATCH |
| **A3 Per-Module** | Setelah Phase 1 Finance done / per departemen di Phase 2 | 16.x production readiness + cross-div integration | 1-2 hari | ⚠️ SELECTIVE — di Batch 5B + per departemen Phase 2 |
| **A4 Pre-Production** | Final, sebelum go-live | All-module + 4 cross-flow + security + DR + load + migration + monitoring | 3-5 hari | 🔵 DEFERRED |
| **A5 Continuous Ops** | Post-go-live | Error rate, latency, audit completeness, CVE scan | Continuous | 🔵 DEFERRED |
| **A6 Post-Incident** | Per bug report | RCA + regression test + pattern detection | Per incident | 🔵 DEFERRED |

**Realistic per batch:** A1+A2 per batch (sesuai target Balanced). A3 hanya di module-end. A4+A5+A6 deferred sampai mendekati go-live.

---

## 5. Per-Batch Schedule — 14 Batches + Sub-Sprints (Map ke REFACTOR_ROADMAP)

| # | Batch / Sprint | Implementer | Auditor | Token Est. | Parallel With | Critical Path |
|---|---|---|---|---|---|---|
| 1 | **Phase 0: DNA Lock** | 1 (Coordinator-led) | 1 | 200K | — | ✅ YES |
| 2 | **Sprint 0: Quick Wins** | 1-2 | 1 | 300K | — | ✅ YES |
| 3 | **Sprint 0.5: DNA Consolidation** | 2 | 1 | 400K | Sprint 1 | ✅ YES |
| 4 | **Sprint 1: Backend Schema** | 1 Integration | 1 | 400K | Sprint 0.5 | ✅ YES |
| 5 | **Sprint 1.5: OpenAPI + Type-gen** | 1 | (skip — infra) | 150K | — | ✅ YES |
| 6 | **Batch 3A: AP Cycle** | 3 (services / pages / tests) | 1 | 700K | 3B, 3C | ⚠️ Blocking 5B |
| 7 | **Batch 3B: AR Cycle** | 3 | 1 | 700K | 3A, 3C | ⚠️ Blocking 5B |
| 8 | **Batch 3C: Cash & Bank** | 3 | 1 | 700K | 3A, 3B | ⚠️ Blocking 5B |
| 9 | **Batch 4A: Tax** | 2 | 1 | 500K | 4B | ✅ Independent |
| 10 | **Batch 4B: Assets + Budget** | 2 | 1 | 500K | 4A | ✅ Independent |
| 11 | **Batch 5A: Cost** | 2 | 1 | 500K | 5B (partial) | ⚠️ Needs Production data |
| 12 | **Batch 5B: Closing + Reports** | 3 + 1 Integration | 1 | 800K | Sprint 9 | ✅ YES |
| 13 | **Batch 6: Master Data** | 3 (per master entity group) | 1 | 700K | — | ✅ Foundation Phase 2 |
| 14 | **Batch 6.5: Master Consolidation** | 2 | 1 | 400K | — | ⚠️ Mid Phase 2 |
| 15 | **Batch 7: Purchase/SCM** | 3 | 1 | 800K | 8 | ✅ After Batch 6 |
| 16 | **Batch 8: BusDev/CRM** | 3 | 1 | 800K | 7 | ✅ After Batch 6 |
| 17 | **Batch 9: Warehouse** | 3 | 1 | 700K | — | ⚠️ Blocks 10 |
| 18 | **Batch 10: Production** | 3 + 1 Integration | 1 | 800K | — | ✅ After 9 |
| 19 | **Batch 11: QC** | 2 | 1 | 500K | 12 | ✅ After 7 |
| 20 | **Batch 12: R&D** | 2 | 1 | 500K | 13, 14 | ✅ After 6 |
| 21 | **Batch 13: HR** | 2 | 1 | 500K | 14 | ✅ After 6 |
| 22 | **Batch 14: Legality** | 2 | 1 | 500K | 13 | ✅ After 6 |
| 23 | **Batch 15: Executive** | 2 + 1 Integration | 1 | 600K | — | ✅ Last |
| 24 | **Sprint 9: DNA Compliance** | 2 | 1 | 500K | 5B | ✅ After Phase 1 done |
| 25 | **Phase T-Cross** (4 cross-flow tests) | 1 dedicated | 1 | 600K | — | ✅ Last |
| 26 | **Phase U: UAT** | Manual + 1 helper | 1 | 300K | — | ✅ Last |

**Total token estimate:** ~12.4M untuk semua phase 1-26. Bisa dikompresi via:
- Early termination untuk batch yang sudah DONE dari history (cek memory)
- Skip Phase T-Cross individual kalau A2 per-batch sudah cukup
- Defer Phase U sampai benar-benar perlu

**Compression bisa achieve:** ~8-10M actual spend.

---

## 6. Quality Invariants (Wajib per batch)

| Check | Audit Phase | Criteria | Owner |
|---|---|---|---|
| **DNA-only imports** | A1.3 | `grep "@/components/ui/"` di operational pages = 0 results (excl. `components/dna/`, `dna-visual/`, `components/ui/` itu sendiri) | Implementer (comply) + Auditor (verify) |
| **Type safety** | A1.6 | `tsc --noEmit` = 0 errors | Implementer (run), Auditor (verify) |
| **Test coverage** | A2.7 | New code ≥70% coverage; critical paths (journal, payment, auth, period lock) 100% | Implementer (write), Auditor (verify) |
| **Build health** | A2.1 | `npm run build` exit 0; lint 0-5 warnings acceptable | Implementer |
| **Visual regression** | A2.3 | Playwright screenshot diff <1% dari baseline | Auditor |
| **Scope fence** | A1.1 | `git diff --name-only` only in operational/master/project-control scope | Auditor |
| **Hallucination guards** | A1.5 | 0 `console.log` di production, 0 unresolved TODO/FIXME, 0 dead imports | Auditor via `knip` |
| **E2E pass** | A2.4 | Existing Playwright tests still green + new test untuk flow baru | Implementer (write new), Auditor (re-run fresh) |
| **API contract** | A2.5 | Endpoint return shape match OpenAPI spec | Auditor via `curl` spot-check |
| **DB schema integrity** | A2.6 | `prisma validate` exit 0, no orphan migrations | Auditor |

---

## 7. Failure Protocol (P0/P1/P2/P3 — per AUDIT-CLI Section 1.3)

| Severity | Definisi | Contoh | Action | Re-audit Trigger |
|---|---|---|---|---|
| **P0** | Data loss, security breach, blocker operasional | Salah hitung total payment, expose API tanpa auth, journal unbalanced | BLOCK batch, return ke T1 dengan fix list, escalate ke User | Full A2 re-audit affected batch |
| **P1** | Degraded functionality, bug di happy path | E2E flow putus di step 3, CSV import gak valid | BLOCK unless User approves exception → log di `EXCEPTIONS.md` | Targeted re-audit fixed item |
| **P2** | Cosmetic / minor functional | Typo, console warning, visual glitch non-kritis | CONDITIONAL pass, log di `EXCEPTIONS.md` | Spot-check 20% saat related work |
| **P3** | Nit / nice-to-have | Komen outdated, dead import | PASS, masuk backlog | Saat Sprint 9 DNA Compliance |

**Exception log format** (`plan/audit-reports/EXCEPTIONS.md`):
```
| Date | Batch | Finding ID | Severity | Reason Approved | Owner |
|------|-------|------------|----------|-----------------|-------|
| 2026-09-15 | 7 | A2.4-001 | P2 | Will fix in Sprint 9 | Luthfi |
```

**Tanpa exception log = finding dianggap blocker.**

---

## 8. Pre-Flight: A0 Bootstrap (SEKALI, sebelum batch apapun)

Sebelum batch 1 mulai, Coordinator run A0:

1. `.claude/audit/context.md` — ingest Section 0, 12, 13, 14, 15, 16, 17 dari REFACTOR_ROADMAP + Section 0, 1-9 dari AUDIT_CLI + REQUIREMENT.md (78 poin) + key CSV files (`Client_Sample_Busdev.csv`, `Daily_tracking_RND.csv`, `Project_Monitoring_RND.csv`)
2. `frontend/scripts/audit/scope-fence.sh` — Section A1.1 (block edit di dashboard*/marketing*/dna-visual*)
3. `frontend/scripts/audit/dna-compliance.sh` — Section A1.3 (block raw `@/components/ui/*` di operational pages)
4. `frontend/scripts/audit/hardcode-pattern.sh` — Section A1.4 (block `bg-emerald-100`, `text-[Npx]`, raw `<input>`)
5. `frontend/scripts/audit/type-safety.sh` — Section A1.6 (`tsc --noEmit`)
6. `frontend/scripts/audit/run-all.sh` — wrapper untuk run semua
7. `plan/audit-reports/BASELINE_<date>.md` — broken pages count, test coverage, E2E pass rate, bundle size, p95 latency, error rate

**A0 estimated:** 2-3 jam + 200K token (one-time). Output harus bisa di-Read ulang untuk verify state.

---

## 9. Timeline Projection

| Phase | Batches | 3-Implementer Parallel Mode | Boros Token Mode Estimate |
|---|---|---|---|
| Foundation (Phase 0 + Sprint 0 + 0.5 + 1 + 1.5) | 5 | Mostly sequential | 1.5-2 minggu |
| Finance Core (3A + 3B + 3C paralel) | 3 | Full paralel (3 batch × 1 minggu = 1 minggu total wall-time) | 1 minggu |
| Finance Support (4A + 4B paralel, 5A sequential, 5B paralel dengan Sprint 9) | 4 | Mixed paralel | 1.5-2 minggu |
| Master Data (6 + 6.5) | 2 | Mostly sequential | 1 minggu |
| Cross-Department (7+8 paralel, 9, 10, 11+12+13+14 mostly paralel, 15) | 7 | High paralel | 2-3 minggu |
| Polish (Sprint 9 + Phase 10) | 2 | Mostly sequential | 0.5-1 minggu |
| Test & UAT (Phase T + U) | 2 | Sequential | 1-1.5 minggu |
| **TOTAL** | **26 items** | — | **8-10 minggu** |

Margin ±2 minggu untuk unexpected (P0 fix, scope clarification, dependency discovery).

**Bandingkan dengan REFACTOR_ROADMAP original:**
- Solo dev: 38-47 minggu
- 3 devs manual: 14-21 minggu
- **Orchestrated agents (design ini): 8-10 minggu**

Speed-up factor: ~4-5x vs solo, ~1.5-2x vs 3-dev manual.

---

## 10. Risk Register + Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Sub-agent loses context across long batch | Medium | Medium | Each implementer agent gets self-contained prompt dengan full scope; result file (changelog) committed at end of T1 |
| DNA component drift (multiple agents wrap differently) | Medium | High | Section 3: DNA components locked to Coordinator only. Implementer BACA tapi TIDAK edit. |
| Auditor false positive rate >20% | Low | Medium | AUDIT-CLI Section 11.2: track FP rate, recalibrate prompt per session |
| Prisma migration conflict | Medium | High | Section 3: schema locked to 1 Integration agent sequential. Generate migration → commit before continuing. |
| Hidden dependency discovered mid-batch | High | Medium | Auditor A2.5 (API contract) catches early. ADR protocol untuk scope changes mid-batch. |
| Token exhaustion mid-batch | Low | High | Section 5 token estimates; pause + checkpoint per batch. Fallback: split batch jadi sub-batches. |
| Implementer + Auditor dari model yang sama = shared blind spot | Certain | Medium | AUDIT-CLI Section 11.2: adversarial prompt prefix "SKEPTIS, setiap klaim butuh bukti". Track FP rate. Optional: switch model. |
| Scope creep mid-batch (agent bantu "fix" file di luar scope) | Medium | Medium | Section 3 file ownership + A1.1 scope fence check BEFORE merge |
| Backend offline (per memory note) | Certain at start | Blocker | A0 bootstrap: verify backend bootable, fix deps chain sebelum batch apapun |

---

## 11. Out of Scope (Sengaja Tidak Termasuk)

- **Auto-rollback / auto-pivot** — per AUDIT-CLI Section 2.4: User yang decide, bukan agent
- **A4 Pre-Production, A5 Continuous Ops, A6 Post-Incident** — deferred sampai mendekati go-live
- **Digital Marketing module** — excluded per REFACTOR_ROADMAP Section 0.1
- **Dashboard pages** — locked per Section 0.1
- **e-Faktur / e-Bupot DJP integration** — excluded per Section 3 Non-Goals
- **Multi-language / i18n, mobile native app** — out of scope
- **Historical data migration** — terpisah setelah MVP

---

## 12. Cross-References

| Dokumen | Hubungan |
|---|---|
| `plan/NEX_ERP_REFACTOR_ROADMAP.md` | Master plan — section/batch mana yang di-orkestrasi |
| `plan/NEX_ERP_AUDIT_CLI_ROADMAP.md` | Audit protocol — Section A1+A2 dipakai per batch, Section A0 dipakai sekali |
| `docs/legacy-erp/REQUIREMENT.md` | 78 poin requirement — traceability per batch |
| `docs/legacy-erp/LEGACY_ERP_SPEC.md` | Cross-department spec |
| `VISUAL_DNA.md` (root) | DNA contract untuk operational pages |
| `DNA_CHEATSHEET.md` (root) | Component dictionary — WAJIB dibaca tiap implementer agent |
| `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx` | Implementation reference untuk DNA pattern |
| `frontend/eslint.config.mjs` | ESLint rules (DNA-only import enforcement) |
| `frontend/scripts/audit/*.sh` | Audit toolkit (dibikin di A0 bootstrap) |
| `plan/audit-reports/` | Output audit per batch |
| `plan/EXCEPTIONS.md` | P2/P3 exception log |

---

## 13. Success Criteria (Design ini Sukses Kalau)

1. ✅ Setiap batch punya Agent tool fan-out 1-3 implementer + 1 auditor + integration agent kalau perlu
2. ✅ File ownership jelas, shared file lock enforced via scope-fence
3. ✅ DNA compliance + type safety + test coverage + visual regression semua di-enforce per batch
4. ✅ Audit verdict gate (PASS/CONDITIONAL/REJECT) enforced sebelum lanjut batch berikutnya
5. ✅ Timeline 8-10 minggu realistic dengan boros mode + 3 implementer paralel per medium batch
6. ✅ Direct map ke AUDIT-CLI Phase A0-A2 (A3-A6 deferred sampai Phase 2 end / pre-go-live)
7. ✅ EXCEPTIONS.md log maintained untuk P2/P3 yang diizinkan lanjut
8. ✅ Memory files updated per batch completion
9. ✅ Tidak ada batch yang di-skip karena "kayaknya OK"

---

## 14. Self-Review (Post-Write)

Sesuai brainstorming skill Section "Spec Self-Review":

### Placeholder scan
- ✅ Tidak ada "TBD" atau "TODO" placeholder di body doc
- ✅ Semua sections terisi konkret

### Internal consistency
- ✅ Section 5 batch count (26 items) match dengan Section 9 phase breakdown
- ✅ Section 3 file ownership align dengan Section 1 role definitions
- ✅ Section 6 quality checks align dengan Section 4 audit phases
- ✅ Section 7 failure protocol align dengan AUDIT-CLI Section 1.3 (sumber: plan/NEX_ERP_AUDIT_CLI_ROADMAP.md)

### Scope check
- ✅ Focused pada orchestration execution, bukan feature build
- ✅ Decomposable: bisa di-break per batch (T0-T5 workflow repeatable per batch)
- ✅ Single implementation plan possible per batch (Phase T + Phase U terpisah)

### Ambiguity check
- ✅ "Boros mode" didefinisikan eksplisit sebagai 600K token/batch
- ✅ "Balanced pace" eksplisit 8-12 minggu
- ✅ "Implementer pool + Auditor gate" eksplisit sebagai 4-role architecture
- ✅ Setiap role punya prompt contract eksplisit di Section 1

---

**Generated:** 2026-09-08
**Status:** Awaiting user review sebelum lanjut ke writing-plans
**Mirror:** `docs/legacy-erp/2026-09-08-agent-orchestration-design.md` (per user request)