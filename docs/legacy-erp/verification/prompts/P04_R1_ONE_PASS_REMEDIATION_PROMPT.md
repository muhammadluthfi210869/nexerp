# Prompt — P04 R1 One-Pass Remediation and Honest Certification

Anda adalah implementation owner NEX ERP P04. Kandidat `1c626009259291eec08162d3232f5dce3bd87e95` menghasilkan token dari wrapper, tetapi audit independen menolaknya karena implementasi gate belum memenuhi frozen acceptance contract. Kerjakan seluruh remediation di bawah sampai satu kandidat committed benar-benar layak `PHASE_PASS`. Jangan berhenti pada token palsu, partial pass, laporan blocker yang masih dapat diperbaiki, atau permintaan waiver.

## Authority yang wajib dibaca berurutan

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/P04_FROZEN_ACCEPTANCE_CONTRACT.md`
3. `scripts/ssot/p04_acceptance_contract.json`
4. `docs/legacy-erp/verification/evidence/batches/P04-P04_AUDIT_R1_2026-09-18.md`
5. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
6. P03 registry/evidence pada SHA frozen, lifecycle registry P02, canonical/implementation Prisma schema, seluruh migration, init/deploy/CI scripts

## Kontrak yang dilarang diubah

- Jangan edit `scripts/ssot/certify_p04_phase.js`, `scripts/ssot/p04_acceptance_contract.json`, phase base, threshold, required gate ID, atau mutation ID untuk memperoleh PASS.
- Jangan mengubah migration yang sudah ada pada phase-base.
- Jangan menggunakan `db push`, `--accept-data-loss`, `migrate resolve`, synthetic PASS, hard-coded coverage, atau self-declared `production_path`.
- Jangan menyentuh database remote/shared/production. Semua mutation dan migration rehearsal hanya pada database loopback `nex_p04_<sha>_<pid>_<purpose>` milik run.
- Jangan menandai registry P04 PASS. Auditor yang melakukannya setelah reproduksi independen.

## Remediation map wajib — selesaikan semuanya

### R1. Satukan gate implementation menjadi fungsi production yang dapat diuji

- Pecah 11 gate menjadi fungsi produksi terpisah yang dipanggil oleh `certifyP04`; mutation suite harus memanggil fungsi yang sama dengan input/workspace/database terisolasi yang dimutasi.
- Result `production_path` hanya boleh ditambahkan oleh orchestrator setelah fungsi gate yang diharapkan benar-benar melempar structured error berisi `gate_id` dan `reason_code`. Hapus literal `production_path: true` dari recorder umum.
- Setiap gate wajib fail-closed pada command error, timeout, parse error, missing target, zero target, missing digest, missing fixture, atau cleanup error.

### R2. Perbaiki scope authority dan phase-base deployment

- Derive daftar migration phase-base dari Git object dan daftar candidate migration dari committed diff `phase_base..HEAD`; jangan hard-code nama migration/tabel.
- Materialisasikan schema, config, dan migration tree phase-base ke direktori OS temp tanpa symlink/junction. Jalankan local Prisma CLI dengan schema/config/migrations yang benar-benar berasal dari direktori temp tersebut. Buktikan path yang dipakai di evidence.
- Saat ini delta migration terhadap phase base adalah nol. Frozen contract melarang zero-target PASS. Cari gap nyata antara canonical schema, implementation schema, runtime result, dan migration lineage. Bila ada gap, perbaiki hanya melalui migration forward baru yang monotonic dan reversible. Jangan membuat migration kosong hanya untuk memuaskan gate.
- Jika tidak ada gap schema nyata sehingga tidak sah membuat migration baru, berhenti sebelum implementasi lanjutan dan laporkan konflik phase-base secara eksplisit; jangan menghasilkan PASS semu. Ini satu-satunya blocker desain yang memerlukan keputusan auditor.
- Generate affected-table/column manifest dari AST/SQL delta migration aktual. Semua gate upgrade, rollback, fixture, dan compatibility memakai manifest tunggal tersebut.

### R3. Baseline upgrade dan data preservation nyata

- Deploy hanya phase-base tree ke DB baseline.
- Seed fixture deterministik untuk setiap affected table dan setiap affected column, termasuk FK dependencies, nullable/default transitions, enum, unique key, money/decimal, timestamp, JSON/array bila relevan.
- Catat per tabel: row count, stable canonical row hash, null counts, FK/orphan count, dan affected values sebelum upgrade.
- Apply candidate migration dengan current production path; jalankan backfill yang nyata.
- Bandingkan equality nilai yang harus dipertahankan, bukan hanya field missing/null. Detect deletion, duplication, changed value, truncation, default corruption, orphan, dan unexpected null.
- Backfill evidence wajib memiliki `affected`, `updated`, `skipped`, `rejected` dan total yang reconcile. Rerun harus menghasilkan nilai/hash identik.

### R4. Idempotency dan concurrency

- Jalankan second real `migrate deploy`, parse migration ledger, dan buktikan zero pending/failed/rolled-back.
- Rerun setiap backfill dan buktikan zero duplicate serta stable digest.
- Jalankan dua deploy contender terkontrol terhadap DB yang sama dengan timeout bounded; buktikan advisory-lock behavior aman dan migration tidak diterapkan dua kali.
- Mutation `P04-SECOND-DEPLOY-NOT-NOOP` harus memodifikasi migration/backfill fixture/database nyata lalu ditolak oleh fungsi gate produksi—hapus `simulatedPending`.

### R5. Rollback/roll-forward lengkap

- Gate wajib gagal jika candidate migration kosong, deploy gagal, `down.sql` hilang, atau down/up tidak tepat mencakup candidate delta.
- Mulai dari phase-base DB plus fixtures. Capture canonical schema digest yang mencakup tables, columns, types, defaults, nullability, enums, PK/unique/check/FK constraints, indexes, dan migration ledger; capture stable data digest per affected table.
- Upgrade candidate, capture candidate digests; jalankan candidate `down.sql` reverse-order, hapus hanya ledger row miliknya, lalu cocokkan kembali exact baseline schema/data digests.
- Roll-forward ulang dan cocokkan exact candidate schema/data digests serta ledger health.
- Mutation rollback harus merusak real isolated schema/data/down input dan masuk ke fungsi rollback gate yang sama; literal fake digest tidak diterima.

### R6. N-1/N coexistence real

- Generate N-1 access definitions/client dari phase-base schema dan N dari candidate schema.
- Pada database yang sama setelah candidate upgrade, untuk setiap tabel pada derived manifest jalankan real N-1 create/read/update (dan delete bila aman), lalu real N create/read/update terhadap fixture yang sama.
- Assert actual defaults, nullable transition, dual read/write/backfill result, decimal/enum/JSON behavior, dan cleanup. Jangan menulis boolean `true` kecuali berasal dari hasil operation yang tersimpan.
- Coverage denominator dan numerator berasal dari manifest aktual; verify setiap probe memiliki raw operation result. `SELECT count(*)` bukan read/write compatibility proof.
- Mutation missing-probe menghapus satu probe dari manifest aktual lalu memanggil production compatibility gate.

### R7. Model, constraint, index, dan source safety

- Reconcile setiap canonical model melalui P02 lifecycle mapping sampai physical implementation model/table/status; validate mapped fields/identity yang diwajibkan, bukan sekadar key presence/count.
- Audit duplicate/conflicting indexes, invalid indexes, unvalidated constraints, PK/unique/idempotency constraints, FK target/action/index coverage, enums, and migration ledger from runtime metadata.
- Expected indexes/constraints harus diturunkan dari Prisma schema/migration/runtime mapping, bukan arbitrary minimum count.
- Target parser wajib menolak non-loopback, ambiguous URL, dan production-like/unrecognized source DB name sesuai frozen contract.
- Buka source connection read-only dan jangan berikan connection itu ke migration/fixture functions. Evidence harus membuktikan no write path serta before/after schema and safe aggregate fingerprint. Fingerprint error/unreachable wajib FAIL, bukan nilai yang dapat dibandingkan.

### R8. Evidence dan mutation suite

- Setiap gate record: command redacted, exit code, duration, timeout/worker state, DB purpose/name, base/candidate SHA, migration checksum/delta, schema/data digest, fixture/backfill totals, ledger state, dan cleanup result yang relevan.
- Tambahkan internal evidence validator yang menolak missing/zero/unparseable/contradictory fields, termasuk `candidate_migrations_scanned: 0`, `affected_tables > fixture_tables`, atau claimed writes tanpa operation result.
- Implementasikan ulang seluruh 16 mutation sebagai real input/database/workspace mutation melalui gate production yang sama. Setiap mutation assert expected `gate_id` dan `reason_code`; exception acak tidak boleh dihitung PASS.
- Pastikan mutation temp paths dan DB selalu dibersihkan dalam `finally` dan tidak mengubah source tree.

## Targeted execution order agar cepat

Jangan menjalankan full certifier setelah setiap edit. Gunakan urutan berikut dan berhenti pada kelompok pertama yang merah:

1. `scope/base/static`: immutable migration, actual base materialization, candidate delta, canonical mapping, unsafe DDL, target safety.
2. `empty/runtime`: validate/generate, empty deploy, complete runtime metadata, drift, constraints/indexes.
3. `upgrade/data`: baseline fixtures, candidate upgrade, hashes, backfill reconciliation and rerun.
4. `rollback/idempotency`: down/up digest round trip, second deploy, concurrent lock.
5. `compatibility`: all dynamically affected tables with real N-1/N operations.
6. `adversarial`: 16/16 real production-gate mutations with exact reason assertions.
7. Commit all implementation changes, ensure clean tree except generated allowlist, then run authoritative command exactly once.

## Pre-certification assertions

Sebelum final run, buat validator otomatis dan pastikan semuanya benar:

- candidate migration scope > 0 and derived from Git, not hard-coded;
- base deployment command proves it used materialized base tree;
- affected table/column manifest equals SQL/Prisma delta;
- fixture coverage = 100% affected scope and stable hashes match;
- backfill totals reconcile and rerun is stable;
- schema/data/ledger digests round-trip on rollback and roll-forward;
- N-1/N real read/write coverage = 100%; no claimed operation lacks raw result;
- all 16 mutations reject at expected production gate/reason;
- no gate is skipped/synthetic/zero-target;
- source read-only fingerprint unchanged and all run-owned DBs removed;
- no credential/full URL appears in stdout, stderr, JSON, or git diff.

## Finish condition

Commit candidate terlebih dahulu, lalu jalankan:

```text
node scripts/ssot/certify_p04_phase.js
```

Jangan handoff sampai exit `0`, 11/11 gate PASS, 16/16 real mutations PASS, threshold exact, seluruh evidence lengkap, cleanup tersisa nol, source untouched, dan token `P04:<current-full-sha>:PHASE_PASS` keluar. Handoff wajib menyertakan scope delta, raw structured checks, before/after digests, per-table fixture/probe matrix, mutation gate/reason matrix, cleanup query, dan daftar remaining failure kosong.

