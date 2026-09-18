# Prompt — P03 Final One-Pass Remediation

Anda adalah implementation owner NEX ERP Phase P03. Selesaikan seluruh blocker P03 dalam **satu putaran terkoordinasi**. Jangan berhenti pada analisis, jangan sekadar membuat output PASS, dan jangan handoff selama acceptance contract belum benar-benar hijau.

## Baca berurutan

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/evidence/batches/P03-P03_BATCH_REVERIFICATION_R4_2026-09-18.md`
3. `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml` — hanya policy global dan P03
4. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
5. `docs/legacy-erp/verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md`
6. `docs/legacy-erp/verification/_UI_DNA_COMPLIANCE_STANDARD.md`
7. P03 runner/analyzers/negative suite, CI workflow, package manifests/locks, DNA barrel, exception registry, dan file yang tercantum dalam R4

R4 adalah defect ledger dan frozen acceptance contract yang lengkap. Tutup **R4-B1 sampai R4-B10**. Jangan menambah Docker runtime, deployment, deployed E2E, load test, browser matrix, DR, atau clean-room install ke bounded P03; semua itu tetap dijadwalkan pada integration/release phase.

## Aturan wajib

- Pertahankan seluruh pekerjaan user yang sudah ada. Jangan reset, checkout, menghapus, atau menimpa perubahan unrelated.
- Jangan melemahkan threshold, memperluas baseline/exception, menghapus test agar hijau, memakai `--force`/`--legacy-peer-deps`, memakai global Prisma, atau memalsukan hasil.
- Scope testing berasal dari pasangan base/candidate SHA dan diff Git yang immutable, bukan label manual pada ledger atau `origin/main` yang stale.
- Setiap gate kritis dengan file applicable tetapi target terselesaikan nol harus FAIL.
- Semua UI consumer hanya mengimpor primitive melalui `@/components/dna`. Tidak boleh subpath import, raw interactive primitive, atau hardcoded visual value yang tidak terdaftar.
- Semua unit test wajib berjalan: skipped/pending/todo/quarantined/flaky = 0.
- Gunakan output machine-readable untuk lint dan unit test; exit code 0 saja tidak cukup.
- Evidence harus berisi hasil command yang benar-benar dijalankan; `skipSubprocess` atau angka nol placeholder tidak boleh mengesahkan gate.
- CI dan lokal harus memanggil production certification path yang sama tanpa CI menciptakan dirty tree sebelum clean-state assertion.
- Jangan menandai registry PASS sendiri. Auditor akan mempromosikan setelah reproduksi independen pada SHA yang sama.

## Urutan eksekusi satu putaran

1. Catat `HEAD`, `HEAD~1`/base eksplisit, dan `git status --short`; buat manifest scope machine-readable base/candidate/path/analyzer/closure. Tolak ledger dengan SHA stale dan jangan gunakan klasifikasi ledger untuk mengecualikan source.
2. Perbaiki `resolveP03AuditScope()` serta setiap analyzer sehingga seluruh file produksi pada diff masuk pemeriksaan yang applicable dan zero-target fail closed.
3. Perbaiki `frontend/src/app/(dashboard)/finance/audit-ledger/page.tsx`: barrel-only DNA imports, hapus/gunakan import yang unused, ganti input serta seluruh button mentah dengan primitive DNA. Perbaiki pelanggaran visual pada closure termasuk `TableShell.tsx` dan `ModuleHeader.tsx`; tambah primitive ke DNA lebih dahulu bila belum tersedia.
4. Jalankan ESLint JSON pada changed production scope; parser runner wajib menggagalkan error **atau warning**. Target final 0/0.
5. Aktifkan dan perbaiki tujuh test Vitest yang saat ini di-skip. Parse report Jest/Vitest dan gagalkan skipped/pending/todo/quarantined/flaky.
6. Hubungkan hasil riil typecheck/lint/unit/build ke audit P03. Hapus substitusi certifying `skipSubprocess`; evidence wajib merekam command, exit, durasi, target, pass/fail/skip, error, dan warning.
7. Rapikan CI fast gate agar authoritative runner dipanggil sekali dari checkout bersih. Lakukan clean assertion sebelum generator menulis evidence dan izinkan setelahnya hanya output evidence yang dideklarasikan secara exact, atau tulis output ke temp/untracked path. Tambahkan post-run source-integrity check.
8. Samakan toolchain: pilih Node yang memenuhi seluruh engine (Node 22 untuk dependency graph saat ini, kecuali dependency Node-22-only dihapus), pin `prisma` dan `@prisma/client` pada versi exact yang sama, gunakan local CLI saja, dan fail pada `EBADENGINE`/version mismatch.
9. Tambahkan sepuluh mutation IDs dari bagian R4 “Add missing adversarial acceptance tests”. Setiap test memutasi input nyata, menjalankan production analyzer path, lalu membuktikan non-zero dan gate failure yang tepat.
10. Audit scope 78-file candidate. Pisahkan P04/future implementation ke owning phase/commit jika aman; jika tidak, klasifikasikan semua path dan buktikan tidak ada yang dikeluarkan dari pemeriksaan.
11. Jalankan pre-certification checklist R4 dari atas ke bawah. Jika satu baris gagal, perbaiki root cause dan ulangi subset relevan; jangan berhenti atau mengklaim selesai.
12. Commit seluruh remediasi, pastikan working tree sesuai kebijakan runner, lalu jalankan finish command tunggal.

## Finish command tunggal

```text
node scripts/ssot/certify_p03_phase.js
```

Selesai hanya jika command tersebut:

1. exit code `0`;
2. mencetak `PHASE_PASS`;
3. mencetak `P03:<current-full-candidate-sha>:PHASE_PASS`;
4. seluruh checklist R4 terbukti dari raw evidence;
5. tidak ada remaining failure atau waiver baru.

## Handoff wajib

Berikan candidate SHA dan base SHA; manifest scope; tabel R4-B1..B10 beserta file perbaikannya; hasil numerik semua check; hasil sepuluh mutation baru; lint error/warning; unit pass/fail/skip; target count tiap architecture/DNA analyzer; bukti Node/Prisma match; bukti CI ordering; token akhir; dan daftar pekerjaan release-depth yang memang deferred. Bila satu saja belum lengkap, lanjutkan perbaikan dan jangan handoff.
