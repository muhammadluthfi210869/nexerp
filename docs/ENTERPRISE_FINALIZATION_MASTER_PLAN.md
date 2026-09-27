# NEX ERP — Enterprise Finalization & Zero-Defect Release Master Plan

**Target:** Mission-Critical Zero-Defect Production Release  
**Arsitektur:** NestJS 11 + Prisma PostgreSQL 15 (Backend) | Next.js 15 + React 19 + Tailwind (Frontend)  
**Dokumen Induk:**  
- `docs/REFACTOR_CLEAN_CODE_FINAL_REPORT.md` (Fondasi Refaktor Arsitektur)  
- `docs/E2E_BROWSER_AUTOMATION_AND_INTER_DIVISION_FLOW_MASTER_PLAN.md` (Blueprint Rantai Pasok 9 Tahap)  
- `docs/legacy-erp/contracts/` (Spesifikasi Kontrak, State Machine, RBAC, Business Rules)

---

## 1. Kebijakan Eksekusi & Protokol Subagent (Subagent-First Policy)

Untuk memaksimalkan efisiensi waktu, throughput, dan akurasi tanpa membebani context window:
1. **Utamakan Subagent (Prioritaskan Paralelisme):**
   - Gunakan subagent saat tugas melibatkan eksplorasi multi-file, analisis AST luas, audit arsitektur/keamanan, review kode mendalam, atau pengujian terisolasi.
   - Subagent yang tersedia:
     - `architect`: Review struktur modul, ketergantungan, event boundary, dan SRP.
     - `security-reviewer`: Audit RBAC 18 role, IDOR, SQL/Prisma injection, auth bypass.
     - `get-shit-done:gsd-code-reviewer`: Audit baris per baris, kompleksitas siklomatis, exception handling.
     - `qa-engineer`: Verifikasi assertions, suite regresi, dan pengujian edge case.
     - `Explore`: Pencarian dan pembacaan read-only file secara paralel.
2. **Kondisi Tidak Menggunakan Subagent (Direct Execution):**
   - Jika tugas berupa eksekusi CLI tunggal deterministik (misal `npx knip`, `tsc --noEmit`), edit 1-2 file spesifik yang sudah diketahui jalurnya, atau verifikasi build cepat. Menggunakan subagent untuk hal sepele justru boros overhead.

---

## 2. Peta Alur 6 Fase & Hard Quality Gates

Sistem menerapkan **Hard Quality Gate**: setiap fase wajib mengantongi 100% PASS berbasis bukti fisik dan file log sebelum fase berikutnya dapat dieksekusi.

```
[Fase 1: Deterministic Static Hygiene] (knip, madge, jscpd, tsc, eslint)
                   │
                   ▼ (Gate 1 PASS: 0 deadcode, 0 circular, 0 type error)
[Fase 2: Deep AI Architectural & Security Audit] (architect, security-reviewer, gsd-code-reviewer)
                   │
                   ▼ (Gate 2 PASS: 0 RBAC loophole, 0 bare Error, SSOT 19/19 Certified)
[Fase 3: Frontend-to-Backend Plumbing] (apiClient, useApiQuery, eliminasi SAMPLE_*)
                   │
                   ▼ (Gate 3 PASS: 0 mock di 9 tahap bisnis, Next.js build clean)
[Fase 4: Database ACID Invariants & Race Stress] (GL debit=credit, row lock, idempotensi)
                   │
                   ▼ (Gate 4 PASS: 100% invarian seimbang, 0 minus stock under concurrency)
[Fase 5: Playwright Golden Thread E2E] (9 Tahap Alur Lintas Divisi, Seam Assertion)
                   │
                   ▼ (Gate 5 PASS: Exit Code 0, 0 console error, DB verified)
[Fase 6: Staging Deploy, DR Drill & UAT] (GHCR Docker, Rollback drill, Multi-role walkthrough)
                   │
                   ▼ (Gate 6 PASS: Laporan Resmi QA Gate "SIAP KIRIM")
```

---

## 3. Rincian Fase, Kriteria & Pengujian Wajib

### Fase 1: Deterministic Static Hygiene
*Tujuan: Eliminasi dead code, circular dependencies, duplikasi, dan type errors secara deterministik.*
- **Aksi:**
  - Hapus dummy data statis `frontend/src/components/project-control/mock-data.ts` dan bersihkan consumer-nya.
  - Jalankan `knip` (via `npx knip`) di root, `backend/`, dan `frontend/`.
  - Jalankan `npx madge --circular --extensions ts backend/src frontend/src`.
  - Jalankan `npx jscpd backend/src frontend/src --threshold 3`.
  - Typecheck: `tsc --noEmit` di backend dan frontend.
  - Verifikasi batas DNA: `node scripts/dna-boundary-gate.mjs` (ratchet = 0).
- **Kriteria:** Deadcode 0, Circular 0, Type error 0, DNA violation 0.
- **Gate:** Build backend dan frontend exit 0. Laporan di `docs/qa-gate/phase-1-hygiene.md`.

### Fase 2: Deep AI Architectural & Security Audit
*Tujuan: Audit kepatuhan RBAC, proteksi tenant, integritas state machine, dan exception handling.*
- **Aksi:**
  - Dispatch subagent `architect`: Audit 36 modul NestJS, decoupled event emitter, dan pemisahan sub-services.
  - Dispatch subagent `security-reviewer`: Audit controller terhadap `07_RBAC_MATRIX.yaml`, IDOR, dan sanitasi input.
  - Dispatch subagent `get-shit-done:gsd-code-reviewer`: Audit eliminasi bare `throw new Error()` (wajib `ApiException`).
- **Kriteria:** RBAC coverage 100%, bare `throw new Error()` di service layer 0, vulnerability High/Critical 0.
- **Gate:** `validate_ssot.js` (19/19 CERTIFIED), `test_p03_negative.js` (62/62 PASS), `test_lifecycle_reconciliation_negative.js` (38/38 PASS).

### Fase 3: Frontend-to-Backend Plumbing & Mock Elimination
*Tujuan: Standardisasi pemanggilan API dan eliminasi seluruh mock data pada 9 rute rantai pasok.*
- **Aksi:**
  - Migrasi konsisten ke `apiClient` (`frontend/src/lib/api-client.ts`) dan `useApiQuery` (`frontend/src/hooks/useApiQuery.ts`).
  - Sambungkan 9 tahap rantai pasok (Buku Tamu, R&D/Sample, Sales/DP, Purchasing/MRP, Gudang/GRN, Produksi/QC, Logistik/Faktur AR, Keuangan/GL, HR/Payroll).
  - Jaga 13 dashboard departemen tetap berbasis layout acuan tanpa merusak visual.
- **Kriteria:** Dummy `SAMPLE_*` di 9 rute inti 0, network response HTTP 200/201, state tersimpan persisten ke PostgreSQL.
- **Gate:** Vitest component unit tests 100% green, `npm run build` di frontend exit 0.

### Fase 4: Database ACID Invariants & Race Condition Stress Testing
*Tujuan: Uji beban matematis akuntansi dan konkurensi stok.*
- **Aksi:**
  - Uji keseimbangan double-entry General Ledger: $\sum \text{Debit} - \sum \text{Credit} = 0$ pada 9 trigger transaksi DEC-015.
  - Uji konkurensi alokasi stok lot gudang via Prisma `$transaction` dan row-level lock.
  - Uji idempotensi request kembar pada form submit penting (Sales Order, Pembayaran).
  - Uji 3 pilar GRN: Bagus masuk stok & AP, Reject masuk karantina $0 AP, Free masuk stok $0 AP.
- **Kriteria:** Jurnal tidak seimbang 0, stok minus 0, duplikasi transaksi 0.
- **Gate:** Script `scripts/__tests__/test_acid_invariants.js` exit 0.

### Fase 5: Playwright Golden Thread E2E Browser Automation
*Tujuan: Pengujian otomasi browser headless alur 9 divisi rantai pasok manufaktur.*
- **Aksi:**
  - Lengkapi Playwright suites di `frontend/tests/` mencakup hulu ke hilir.
  - Pasang verifikasi Seam (input di Divisi A terbukti muncul di tabel Divisi B dan terverifikasi di PostgreSQL).
- **Kriteria:** Network HTTP 4xx/5xx 0, React console error 0, PostgreSQL assertion 100% sinkron.
- **Gate:** `npx playwright test` menghasilkan Exit Code 0 pada seluruh supply chain suite.

### Fase 6: Staging Deploy, Disaster Recovery Drill & Operational UAT
*Tujuan: Deploy staging VPS, verifikasi rollback, dan walkthrough persona.*
- **Aksi:**
  - Build dan push Docker image ke GHCR via GitHub Actions.
  - Deploy ke VPS: `ssh dreamlab@103.93.134.215 "bash scripts/deploy.sh <sha>"`.
  - Smoke test live: `bash scripts/test-deploy.sh <url>/v1`.
  - Rollback rehearsal: `bash scripts/rollback.sh <prev-sha>` (target RTO < 60 detik).
  - Walkthrough persona operasional (Sales, R&D, Gudang, Produksi, Finance).
- **Kriteria:** Container restart count 0, latency < 200ms, rollback sukses.
- **Gate:** 26/26 regression shell tests pass (`run-all.sh`), sertifikasi resmi `SIAP KIRIM` di `docs/qa-gate/`.
