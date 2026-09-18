# Prompt — P04 R3 Secret Redaction Final Remediation

Perbaiki hanya blocker P0 pada `docs/legacy-erp/verification/evidence/batches/P04-P04_AUDIT_R3_2026-09-18.md`. Pertahankan seluruh perbaikan R1/R2. Jangan mengubah frozen wrapper, acceptance contract, threshold, phase base, migration, gate semantics, atau mutation semantics.

## Wajib dilakukan

1. Pisahkan runtime connection URL dari evidence object. Semua gate hanya boleh mengembalikan generated database name/purpose, PostgreSQL major, dan host class `loopback`; jangan mengembalikan `baseline_db_url`, `dbUrl`, connection string, user-info, username, password, atau URL lengkap.
2. Ubah field `database` pada seluruh 11 check menjadi nama database aman atau label seperti `source-read-only`, bukan URL. Pastikan nested fields, mutation target, command metadata, stdout/stderr snippets, error stack, manifest, dan summary report juga bebas secret.
3. Tambahkan recursive `assertNoSecrets(value, env)` ke jalur production sebelum evidence/report ditulis. Validator wajib menolak:
   - `postgres://` atau `postgresql://` di artifact;
   - pola URL user-info `://...@`;
   - nilai non-kosong dari `DATABASE_URL`, `P04_TEST_ADMIN_URL`, password DB, atau komponen credential environment;
   - command/stdout/stderr/error yang belum disanitasi.
4. Gunakan satu fungsi redaction pusat untuk command/error metadata. Jangan sekadar mengganti satu field yang saat ini diketahui.
5. Tambahkan targeted negative test: inject URL bercredential ke nested evidence, command output, dan error string; production evidence validator harus menolak dengan structured `EVIDENCE_SECRET_DETECTED`.
6. Regenerasi `_p04_test_results.json`, `P04_PHASE_CERTIFICATION_RESULT.json`, dan `P04_MIGRATION_SCOPE_MANIFEST.json`. Jalankan recursive secret scan terhadap seluruh `docs/legacy-erp/verification` dan stdout final. Scan harus memberikan jumlah raw DB URL `0` dan matched configured secret values `0`.
7. Bersihkan credential dari candidate commit terbaru dan commit hasil aman. Karena credential sudah pernah tracked, laporkan kebutuhan rotasi kepada owner. Jangan melakukan history rewrite/force-push tanpa instruksi eksplisit.
8. Setelah credential lokal dirotasi oleh owner atau menggunakan credential test baru, jalankan sekali `node scripts/ssot/certify_p04_phase.js`; pastikan 11/11, 16/16, cleanup 0, token SHA-bound, dan scan artifact tetap 0 secret.

## Finish condition

Jangan handoff sampai candidate committed bersih dan semua kondisi ini terpenuhi:

- tidak ada raw database URL/user-info/password pada seluruh tracked/generated verification artifact;
- validator production menolak nested secret mutation;
- functional P04 gates tetap 11/11 PASS;
- adversarial mutations tetap 16/16 PASS;
- temporary database residue 0;
- authoritative command exit 0 dan token terikat HEAD;
- handoff menyatakan apakah credential sudah dirotasi, tanpa menampilkan nilainya.

