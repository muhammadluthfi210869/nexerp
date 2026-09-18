# Prompt — P04 One-Pass Canonical Database and Migration Certification

Anda adalah implementation owner NEX ERP Phase P04. Kerjakan implementasi, diagnosis, remediasi, targeted retest, dan final certification sampai P04 benar-benar `PHASE_PASS`. Jangan berhenti pada plan, partial pass, atau laporan kegagalan yang masih dapat diperbaiki di dalam scope.

## Baca berurutan

1. `docs/legacy-erp/AGENTS.md`
2. `docs/legacy-erp/verification/P04_FROZEN_ACCEPTANCE_CONTRACT.md` — authority penerimaan P04
3. `scripts/ssot/p04_acceptance_contract.json` — daftar machine-enforced checks/mutations/thresholds
4. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
5. `docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml` — policy global, P03, dan P04 saja
6. `docs/legacy-erp/contracts/00_MASTER_SPEC.md §5.7, §7.2, §9.1`
7. `docs/legacy-erp/contracts/01_DOMAIN_MODEL.md §15`
8. `docs/legacy-erp/contracts/02_DATA_OWNERSHIP.yaml` — migration/SoR mapping terkait
9. `docs/legacy-erp/contracts/09_NON_FUNCTIONAL_CONTRACT.md §16–17`
10. Prisma config/schema/migrations, init/deploy scripts, audit lama P04, dan evidence lama sebagai provenance saja—bukan bukti PASS

## Kontrak yang tidak boleh diubah

- Jangan mengedit `scripts/ssot/certify_p04_phase.js`, `scripts/ssot/p04_acceptance_contract.json`, threshold, required check IDs, atau required mutation IDs untuk memperoleh PASS.
- Phase base tetap `cf8b725d9fec4c808937c50217a3bc45050d271a`.
- P04 hanya memakai PostgreSQL sementara yang dibuat runner pada host loopback. Jangan menyentuh database sumber, staging, production, atau remote.
- Jangan memakai Docker, deploy, full legacy ETL, browser/E2E, load, atau DR.
- Jangan memakai `prisma db push`, `--accept-data-loss`, `migrate resolve` untuk menyembunyikan kegagalan, mengedit migration yang sudah ada pada phase base, atau membuat evidence sintetis.
- Jangan log credential atau connection URL lengkap.
- Jangan menandai registry P04 PASS; auditor yang melakukan setelah reproduksi independen.

## Implementasi wajib

1. Commit lebih dahulu seluruh status/evidence P03 dan paket acceptance P04 agar working tree implementation bersih.
2. Buat `scripts/ssot/lib/p04_certification.js` yang mengekspor `certifyP04({root, contract, candidateSha})` dan mengembalikan schema hasil yang divalidasi wrapper.
3. Refactor/ganti `audit_p04_database_migrations.js`; jangan memakai database tetap `erp_p04_test`, jangan load URL lalu drop tanpa guard, dan jangan menulis PASS dari hard-coded count.
4. Perbaiki kontrak lebih dahulu: ubah kebijakan production database dari `db push` menjadi `prisma migrate deploy`, dokumentasikan phase-base baseline dan N-1/N one-deployment-window expand/migrate/contract.
5. Implementasikan target-safety library tunggal untuk production runner dan mutation suite: URL redaction, loopback-only, exact generated DB prefix, created-database inventory, source fingerprint, guarded create/drop, connection termination hanya untuk DB milik run, dan cleanup `finally`.
6. Materialisasikan migration tree phase base dari Git ke OS temp tanpa junction/symlink. Bandingkan checksum semua existing migration; perbaikan schema dilakukan dengan migration baru.
7. Implementasikan seluruh 11 gate persis seperti frozen contract. Baseline upgrade harus benar-benar phase-base → candidate dengan fixture dan reconciliation, bukan sekadar menghitung ledger hasil empty migration.
8. Buat compatibility-probe manifest untuk setiap tabel yang berubah. Jalankan N-1 read/write dan N read/write pada database yang sama setelah upgrade; coverage wajib 100%.
9. Buat rollback/roll-forward nyata hanya pada DB sementara. Down migration tidak boleh silent data loss dan hanya boleh menghapus ledger miliknya sendiri.
10. Buat `scripts/ssot/test_p04_database_migrations_negative.js` untuk seluruh required mutation IDs. Setiap mutation mengubah input/fixture nyata dan memanggil safety/analyzer production path yang sama.
11. CI P04 hanya memanggil authoritative runner pada job dengan PostgreSQL 15 service. Jangan duplikasi generator yang membuat dirty source sebelum runner.
12. Evidence harus machine-readable, SHA-bound, tanpa credential, berisi command/exit/durasi serta schema/data digests dan cleanup proof.

## Metode kerja agar cepat

Gunakan kelompok targeted berikut; jangan menjalankan full certifier setiap selesai satu edit:

1. **Safety/static**: target guard, contract consistency, immutable migration/checksum, unsafe DDL analyzer.
2. **Empty/idempotent**: validate/generate, empty deploy, drift, second deploy.
3. **Upgrade/data**: phase-base database, fixtures, candidate deploy, backfill reconciliation.
4. **Rollback/compatibility**: down/up rehearsal, constraint probes, N-1/N probes.
5. **Adversarial**: seluruh mutation suite.

Jalankan targeted group yang berubah sampai hijau. Setelah semua pre-certification checklist hijau, commit seluruh implementasi dan jalankan full command hanya sekali.

## Finish command tunggal

```text
node scripts/ssot/certify_p04_phase.js
```

Jangan handoff kecuali command tersebut exit `0`, menghasilkan `PHASE_PASS` dan `P04:<current-full-sha>:PHASE_PASS`, semua 11 check PASS, seluruh mutation PASS, seluruh threshold exact, source DB untouched, dan semua temporary DB telah dibersihkan.

Jika command gagal pada gate yang masih dapat diperbaiki, perbaiki root cause dengan targeted test lalu ulangi final command; jangan menyerahkan keputusan waiver kepada auditor. Satu-satunya alasan berhenti tanpa PASS adalah tidak adanya PostgreSQL loopback/create-db permission, keputusan bisnis material yang belum memiliki authority, atau risiko destructive di luar database sementara. Laporkan bukti blocker exact bila itu terjadi.

## Handoff wajib

Berikan candidate/base SHA, scope manifest, PostgreSQL/Node/Prisma versions, nama database sementara tanpa URL/credential, tabel hasil 11 checks, seluruh mutation IDs, migration/checksum delta, drift/ledger/constraint/index metrics, before/after fixture hashes, rollback/roll-forward proof, compatibility coverage, cleanup/source-untouched proof, raw command exit/duration, token final, dan remaining failures (harus kosong).
