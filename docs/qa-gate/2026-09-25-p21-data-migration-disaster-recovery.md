# QA Gate — Fase 5: Migrasi Data & Disaster Recovery (2026-09-25)

**Topik:** Eksekusi Fase 5 / P21 — Pipeline Import Master Data yang Diperkeras (10.000 baris, zero corruption) serta Rehearsal Snapshot/Restore & Kontrak Rollback (RTO < 15 menit, RPO = 0).

**Branch:** `feat/p08-contracts-subject-ownership`
**Dokumen Referensi:** `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md` (baris 140–166)
**Laporan Sebelumnya:** `docs/qa-gate/2026-09-25-p20-golden-thread-concurrency.md`

---

## Verdict

# BELUM SIAP KIRIM

**Fase 5 terukur HIJAU dan TUNTAS pada tingkat kode, test harness, dan rehearsal database lokal:**

| Gate | Command | Exit Code | Bukti |
|---|---|---|---|
| Build backend | `npm run build` | **0** | `nest build` sukses |
| Build frontend | `npm run build` (frontend/) | **0** | 100+ route ter-prerender tanpa error baru |
| Typecheck backend | `npx tsc --noEmit` | **0** | 0 error |
| Smoke test live (lokal) | `bash scripts/test-deploy.sh http://localhost:3002/v1` | **0** | 6/6 passed (health, CORS, login, profile, 401 anon, API root) |
| Migrasi master data | `bash scripts/test-migration-pipeline.sh` | **0** | 5/5 test, "10.000-row master import committed in 26.9s" |
| Rehearsal snapshot/restore | `bash scripts/test-rollback-rehearsal.sh` | **0** | 11/11 check, RPO 208/208 tabel identik, RTO 6s |
| Negatif (fail-closed) | `DATABASE_URL=...@127.0.0.1:59999/nope bash scripts/test-rollback-rehearsal.sh` | **1** | "rehearsal did NOT run (not a pass)" |
| Suite shell regresi | `bash scripts/__tests__/run-all.sh` | **0** | PASS: 16 FAIL: 0 SKIP: 0 |
| Regresi merah→hijau `dr-drill.sh` | `bash scripts/__tests__/p21-disaster-recovery.test.sh` | RED=**1** → GREEN=**0** | Tooling lama gagal, setelah fix hijau |

Verdict tetap **BELUM SIAP KIRIM** karena:

1. **Drill DR di VPS belum dijalankan.** `scripts/dr-drill.sh` adalah drill live (stop stack → drop DB → restore → start stack → health). Docker daemon di workstation ini TIDAK berjalan, dan menjalankan drill terhadap server produksi tanpa otorisasi bersifat destruktif. Rehearsal di laporan ini membuktikan snapshot dan restore di PostgreSQL lokal; **klaim RTO/RPO pada server produksi masih belum terbukti**.
2. **Fase 6 (UAT Klien & Dual-Run 14 Hari) belum dijalankan** — butuh runtime 14 hari dan tanda tangan owner.
3. **Deploy Drift Production masih terbuka** (live berjalan di commit `7a449e0a`, 100+ commit di belakang working tree; memori `production-deploy-drift-2026-09-25`). Tidak ada satu pun perbaikan P07–P21 yang ter-deploy.
4. **Regime kode COA masih divergen** (25 dari 33 kode COA yang direferensikan backend tidak ada di database; memori `coa-code-regimes-diverge`). Import "Saldo Awal Akun COA" akan **ditolak oleh gate `COA_NOT_REGISTERED`** pada data live sampai seed COA diselaraskan — ini perilaku yang benar (fail-closed), tapi berarti jalur saldo awal belum bisa dipakai produksi.
5. Working tree masih `433` file di atas HEAD; seluruh exit code di laporan ini mengukur **working tree**, bukan sebuah commit (memori `gate-measures-working-tree-not-commit`).

---

## 1. Migrasi Data & Pipeline Import (AC-P21-01)

**Suite:** `backend/test/p21/p21-migration-pipeline.e2e-spec.ts` (5 test)
**Runner:** `scripts/test-migration-pipeline.sh` → `npm run test:p21:migration-pipeline`
**Hasil:** `EXIT=0` — `Test Suites: 1 passed, 1 total` / `Tests: 5 passed, 5 total` / `Time: 52.6s`

| # | Test | Kriteria Lulus |
|---|---|---|
| 1 | `Imports 10.000 master rows atomically with zero data corruption` | 10.000 baris ter-commit dalam **26.9s**; jumlah baris persis; probe korupsi (baris kosong/duplikat/nilai hilang) = 0; spot check titik tengah cocok; **tepat 1** baris audit |
| 2 | `Rejects a batch that lists the same SKU twice and writes nothing` | Batch dengan SKU ganda ditolak (`VALIDATION_FAILED`), 0 baris tertulis |
| 3 | `Rejects unregistered COA accounts and unbalanced opening balances; posts one balanced journal for a valid batch` | `COA_NOT_REGISTERED` dan `OPENING_BALANCE_UNBALANCED` ditolak; batch valid menulis **tepat 1** jurnal seimbang |
| 4 | `Rejects opening stock for unknown materials and keeps ledger vs stock cache consistent` | `MATERIAL_NOT_REGISTERED` ditolak; batch valid: `ledgerTotal === batchTotal === cacheDelta === 400` |
| 5 | `Replaying the same idempotency key returns the durable result without a second write` | Replay mengembalikan hasil durabel, tetap 1 `importExecution`; payload berbeda → `IDEMPOTENCY_CONFLICT` |

### Perubahan kode yang diuji

`backend/src/modules/master/services/import-export.service.ts`:

1. **Validasi baris** saldo awal akun & stok awal: menolak kode kosong, nominal non-numerik/negatif/nol (debit maupun kredit), kuantitas ≤ 0, tanggal tak terparse.
2. **Deteksi duplikat dalam batch** (`CODE_KEYED_ENTITIES`) dengan satu pengecualian nyata: stok awal sah menyebut satu material berkali-kali (satu per batch), sehingga identitasnya `code::batchNumber`, bukan `code` saja.
3. **Validasi referensi sebelum transaksi:** `COA_NOT_REGISTERED`, `OPENING_BALANCE_UNBALANCED`, `OPENING_BALANCE_MIXED_DATES`, `MATERIAL_NOT_REGISTERED` — dijalankan **sebelum** cabang `dryRun`, sehingga dry run adalah rehearsal nyata.
4. **Satu jurnal gabungan** pasca-loop untuk seluruh baris saldo awal (bukan satu jurnal per baris), tetap melewati `journal-balance-guard`.
5. **`batchId`** dinaikkan ke atas loop; satu deklarasi saja.
6. **Batas transaksi** untuk beban 10.000 baris: `{ maxWait: 60_000, timeout: 600_000 }` (default Prisma 5s akan membatalkan load master yang sah di tengah jalan).
7. **`OPENING_STOCK_SUPPLIER`** (`OPENING-BALANCE (SYSTEM)`): `MaterialInventory.supplierId` adalah NOT NULL, sedangkan stok awal legacy tidak punya vendor. Seluruh batch stok awal diparkir pada satu supplier sistem kanonik alih-alih dibebankan diam-diam ke vendor nyata.

Jalur governed tetap utuh: `enforcePolicy` → validasi baris → satu `$transaction` (`pg_advisory_xact_lock` untuk idempotensi) → `AuditService.withAudit` → `OutboxService.enqueue` — all-or-nothing.

---

## 2. Disaster Recovery & Rollback Rehearsal (AC-P21-02/03)

**Runner:** `bash scripts/test-rollback-rehearsal.sh` — `EXIT=0`, **11/11 check passed**

| Langkah | Hasil terukur |
|---|---|
| 1. Toolchain PostgreSQL | ✅ `/c/Program Files/PostgreSQL/16/bin` (autodetect: `PGBIN` → PATH → glob) |
| 2. Resolusi `DATABASE_URL` | ✅ database sumber `erp_db_test` (kredensial tidak pernah dicetak) |
| 3. Reachability probe | ✅ sumber terjangkau (`psql -w`, tidak pernah menunggu prompt password) |
| 4. Snapshot | ✅ `backups/dr-rehearsal-20260925-173704.sql.gz` — **370.494 byte** (`pg_dump` plain SQL → gzip) |
| 5. Baseline hitungan baris | ✅ **208 tabel, 5.266 baris** di `public` |
| 6. Database sekali-pakai | ✅ `erp_dr_rehearsal_<ts>` dibuat; database sumber hanya dibaca |
| 7. Restore | ✅ `gunzip -c \| psql -v ON_ERROR_STOP=1` selesai dalam **2s** |
| 8. Perbandingan RPO | ✅ **seluruh 208 hitungan tabel identik** (`diff` bersih, 0 divergen) |
| 9. Budget RTO | ✅ jendela recovery **6s ≤ 900s** |
| 10. Pembersihan | ✅ database sekali-pakai di-drop (`trap ... EXIT` sebagai jaring) |
| 11. Kontrak `rollback.sh` | ✅ switch `IMAGE_TAG` + health gate + argumen SHA target, tanpa `git revert`/`git reset` |

```
RPO: 208 tables compared, 0 divergent
RTO: 6s (budget 900s)
Snapshot: backups/dr-rehearsal-20260925-173704.sql.gz
Evidence: evidence/dr-rehearsal/
```

**Kriteria sukses roadmap 5.2:**

| Kriteria | Target | Hasil lokal | Status |
|---|---|---|---|
| Import master data | 10.000 baris, 0 korupsi | 10.000 baris, probe korupsi 0, 26.9s | ✅ lokal |
| RTO | < 15 menit | 6s (restore 2s) | ✅ lokal / ⏳ VPS |
| RPO | 0 transaksi hilang | 208/208 tabel identik | ✅ lokal / ⏳ VPS |

### Bukti fail-closed (bukan gate yang "hijau tanpa melihat")

Gate rehearsal dijalankan dua arah:

- **Positif:** `EXIT=0` dengan 11 check (tabel di atas).
- **Negatif:** `DATABASE_URL="postgresql://nobody@127.0.0.1:59999/nope"` → `EXIT=1`, output `❌ cannot reach source database — rehearsal did NOT run (not a pass)` dan `VERDICT: FAILED — server unreachable`.

Desain fail-closed: `set -euo pipefail`, `ON_ERROR_STOP=1` pada setiap `psql`, `psql -w`/`pg_dump -w` (tidak pernah memblokir di stdin — gate yang menggantung terlihat identik dengan database yang menggantung), tanpa `|| true` pada langkah pembuktian, dan toolchain yang tidak ada = gagal, bukan skip.

---

## 3. Siklus Regresi Merah→Hijau (Aturan CLAUDE.md)

Bug ditemukan 2026-09-25 pada `scripts/dr-drill.sh`: script menunjuk `docker-compose.prod.yml` (sudah pensiun — file kanonik adalah `docker-compose.yml`), mem-probe port `3002` (backend listen di `3001`), dan me-replay snapshot plain-SQL `pg_dumpall` dengan `pg_restore` (yang hanya membaca arsip custom/tar). Akibatnya **setiap fase setelah langkah 1 selalu gagal** — drill tidak akan pernah bisa mensertifikasi sebuah restore.

Urutan yang dijalankan (bukan klaim):

1. **MERAH dulu:** `git show HEAD:scripts/dr-drill.sh` dikembalikan → `bash scripts/__tests__/p21-disaster-recovery.test.sh` → **`EXIT=1`**.
2. **Fix:** `dr-drill.sh` ditulis ulang (compose kanonik, `DB_CONTAINER`, health `:3001`, restore `gunzip -c | psql -v ON_ERROR_STOP=1`, sanity hitungan tabel, budget RTO, `LOG_DIR` fallback).
3. **HIJAU:** test yang sama → **`EXIT=0`**.
4. **Registrasi:** `run-all.sh` mendapat `run_test "p21-dr-tooling-contract" "$SCRIPT_DIR/p21-disaster-recovery.test.sh"`; suite penuh **16 PASS / 0 FAIL / EXIT=0**.

Catatan: kontrak test menemukan dua kegagalan hijau pada percobaan pertama (komentar script masih menyebut nama compose pensiun dan `:3002`; satu pemanggilan `pg_dump` belum `-w`). Keduanya diperbaiki sebelum `EXIT=0` — jadi hijau di atas bukan hijau pada percobaan pertama.

---

## 4. Artefak Fase 5

| Artefak | Keterangan |
|---|---|
| `backend/test/p21/p21-migration-pipeline.e2e-spec.ts` | 5 test e2e (memakai ulang `bootP20App` dari `test/p20/p20-http-harness.ts`); `codePrefix = P21-<UPPERCASE-runId>` karena kode tersimpan di-uppercase |
| `backend/src/modules/master/services/import-export.service.ts` | Pipeline import diperkeras (lihat §1) |
| `backend/package.json` | `test:p21:migration-pipeline`, `test:p21` (`--testTimeout=900000 --runInBand`) |
| `scripts/test-migration-pipeline.sh` | Runner Fase 5.3 (meneruskan exit code jest) |
| `scripts/test-rollback-rehearsal.sh` | Rehearsal snapshot/restore + kontrak rollback, fail-closed |
| `scripts/dr-drill.sh` | Drill live VPS (diperbaiki; **belum dijalankan di VPS**) |
| `scripts/__tests__/p21-disaster-recovery.test.sh` | Regresi tooling P21 (merah→hijau) |
| `scripts/__tests__/run-all.sh` | Registrasi test P21 |
| `.gitignore` | `*.sql`, `*.sql.gz`, `backups/`, `evidence/dr-rehearsal/` — dump berisi data nyata tidak boleh ter-commit |

---

## 5. Yang Belum Terbukti (alasan verdict BELUM SIAP KIRIM)

| # | Item | Kenapa belum | Cara menutupnya |
|---|---|---|---|
| 1 | Drill DR live di VPS | Docker daemon workstation mati; drill = stop stack + drop DB produksi → butuh otorisasi | `ssh dreamlab@103.93.134.215` → `bash scripts/db-snapshot.sh` → `bash scripts/dr-drill.sh <snapshot>` → verifikasi `RTO < 900s` dan tabel < 50 = gagal |
| 2 | RTO/RPO pada data produksi | Rehearsal laporan ini di PostgreSQL lokal (`erp_db_test`), bukan volume produksi | jalankan item 1 dan catat RTO terukur |
| 3 | UAT klien + dual-run 14 hari | Fase 6, butuh runtime & tanda tangan owner | eksekusi Fase 6 sesuai roadmap |
| 4 | Deploy drift | Live di `7a449e0a`; tidak ada perbaikan P07–P21 yang ter-deploy | merge `main` → CI GHCR → `bash scripts/deploy.sh <sha>` → rollback teruji |
| 5 | Import COA saldo awal di live | 25/33 kode COA belum diseed → gate `COA_NOT_REGISTERED` menolak | selaraskan seed COA lalu ulangi import rehearsal pada data live |
| 6 | Working tree 433 file di atas HEAD | Exit code mengukur working tree, bukan commit | commit/bekukan baseline, lalu ulangi gate pada commit itu |

---

## 6. Rekapitulasi Rencana Go-Live

| Fase | Deskripsi | Status | Kebutuhan Lanjut |
|---|---|---|---|
| **Fase 1** | Build Stabilization & Typecheck | ✅ HIJAU | Selesai |
| **Fase 2** | Eliminasi Mock Plumbing | ✅ HIJAU | Selesai |
| **Fase 3a** | Multi-tenant Hard Lock | ✅ HIJAU | Selesai |
| **Fase 3b** | Auto-Journal Double-Entry Balance Guard | ✅ HIJAU | Selesai |
| **Fase 4** | E2E Golden Thread & Concurrency Stress Test | ✅ HIJAU | Selesai |
| **Fase 5** | Migrasi Data & Disaster Recovery | ✅ **HIJAU (lokal)** | Drill DR live di VPS + selaraskan seed COA |
| **Fase 6** | UAT Klien & Dual-Run 14 Hari | ⏳ PENDING | Runtime approval owner / stakeholder |
