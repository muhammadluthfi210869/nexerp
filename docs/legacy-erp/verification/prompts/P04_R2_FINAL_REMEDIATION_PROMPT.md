# Prompt — P04 R2 Final Narrow Remediation

Perbaiki hanya empat blocker tersisa pada `docs/legacy-erp/verification/evidence/batches/P04-P04_AUDIT_R2_2026-09-18.md`. Pertahankan seluruh perbaikan R1 yang sudah lulus. Jangan mengubah frozen wrapper, machine contract, phase base, threshold, required IDs, atau migration pre-base. Jangan berhenti sampai kandidat committed memenuhi acceptance contract dan authoritative command PASS.

## 1. Jadikan mutation benar-benar melewati gate produksi

- Refactor setiap gate agar menerima dependency/input terisolasi yang dapat dimutasi tanpa mengubah source kerja utama: migration root, evidence object, fixture mutation callback, backfill callback, rollback callback, compatibility manifest, dan command runner.
- Seluruh 16 mutation wajib memanggil exported `gate*` function yang sama dengan certification. Memanggil `analyzers.*` langsung tidak boleh diberi `production_path: true`.
- Ganti literal fake digest, fabricated fixture object, fabricated backfill counts, dan fabricated manifest dengan mutation nyata pada temp workspace/database/evidence, kemudian jalankan gate terkait.
- `production_path: true` hanya boleh dihasilkan setelah instrumentasi membuktikan expected exported gate function dijalankan dan melempar exact `gate_id` + `reason_code`. Exception dari setup/cleanup tidak boleh dihitung PASS.
- Tambahkan self-test yang memindai mutation result dan menolak mutation tanpa `gate_function`, `mutated_target`, dan structured rejection evidence.

## 2. Lengkapi dan validasi evidence

- Setiap check harus mencatat minimal: `id`, status/executed/synthetic/skipped, redacted command atau daftar command, exit code tiap command, duration, timeout state, base SHA, candidate SHA, DB purpose/name, dan field gate-specific yang diwajibkan frozen contract.
- Baseline/rollback/idempotency harus memuat migration checksums, ledger before/after, schema/data hashes, fixture/backfill totals, dan cleanup ownership. Compatibility harus memuat operation result nyata per table, bukan hanya boolean.
- Buat internal `validateP04Evidence()` dan panggil sebelum return PASS. Validator wajib fail pada missing field, zero target, command tanpa exit code, hash kosong, affected table tanpa fixture/probe, created DB tanpa dropped DB, atau mutation tanpa production gate proof.
- Tambahkan negative mutation nyata untuk evidence field missing melalui production evidence validator; petakan ke salah satu required mutation yang relevan tanpa menambah/mengubah required ID.

## 3. Uji idempotency dan concurrency melalui production migration path

- Jalankan dua proses `prisma migrate deploy` yang benar-benar berkompetisi pada database isolated yang sama dengan timeout bounded. Capture start/end, exit code, stdout/stderr redacted, ledger row count/checksum, dan buktikan candidate migration diterapkan tepat satu kali tanpa partial/failed row.
- Jangan memakai advisory lock buatan dengan key arbitrary sebagai pengganti dua proses Prisma. PostgreSQL lock query boleh dipakai hanya sebagai evidence tambahan.
- Ubah backfill menjadi predicate idempotent sehingga pass kedua menghasilkan `updated = 0`, atau buktikan exact stable data digest dan zero changed values. Catat digest sebelum pass 1, sesudah pass 1, dan sesudah pass 2.
- Mutation `P04-SECOND-DEPLOY-NOT-NOOP` harus merusak real migration/backfill state lalu menjalankan `gateMigrationIdempotency`, bukan hanya helper/ledger assertion yang tidak mencapai seluruh gate.

## 4. Hilangkan hard-code scope dan fail-open capture

- Derive owner table untuk `DROP INDEX` dari phase-base schema/catalog or migration SQL index definition. Jangan memiliki branch nama khusus `articles`/`website_products` atau prefix guessing.
- Assert derived affected tables/columns exactly match candidate SQL/schema delta; missing or ambiguous index owner harus FAIL.
- `captureFixtureDigest` wajib melempar structured error jika affected table/query/order key tidak tersedia; jangan mengubah error menjadi `[]`.
- Source fingerprint wajib FAIL jika salah satu table aggregate yang diwajibkan gagal. Jangan `catch { continue }`.
- Tambahkan targeted negative cases yang membuktikan unknown dropped-index owner, unreadable affected table, dan failed source aggregate tidak dapat menghasilkan PASS.

## Targeted workflow

1. Jalankan test statis scope + evidence validator.
2. Jalankan hanya mutation suite sampai 16/16 memakai exported gate path.
3. Jalankan targeted idempotency/concurrency database test.
4. Jalankan targeted baseline/rollback/compatibility test.
5. Commit seluruh implementation; working tree hanya boleh memiliki generated allowlist.
6. Jalankan sekali: `node scripts/ssot/certify_p04_phase.js`.

## Finish condition

Jangan handoff hanya karena token keluar. Handoff hanya bila:

- 11/11 checks memiliki evidence lengkap dan lolos internal evidence validator;
- 16/16 mutations mencantumkan exported `gate_function`, real `mutated_target`, exact gate/reason, dan `production_path: true` yang dibuktikan;
- dua competing Prisma deploy benar-benar dieksekusi dan ledger menunjukkan apply tepat sekali;
- backfill pass kedua zero-change atau stable digest dengan zero changed values;
- scope tidak mengandung hard-coded table mapping;
- semua capture fail-closed;
- source untouched, cleanup residue 0;
- committed candidate menghasilkan exit 0 dan `P04:<HEAD>:PHASE_PASS`.

