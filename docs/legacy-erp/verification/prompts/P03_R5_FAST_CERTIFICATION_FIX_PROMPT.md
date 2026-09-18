# Prompt — P03 R5 Fast Certification Integrity Fix

Lakukan koreksi terakhir P03 berdasarkan:

`docs/legacy-erp/verification/evidence/batches/P03-P03_BATCH_REVERIFICATION_R5_2026-09-18.md`

Ini bukan remediasi aplikasi ulang. Pertahankan perbaikan aplikasi yang sudah lulus dan selesaikan hanya **R5-B1 sampai R5-B6**. Jangan menjalankan Docker, deploy, clean-room install, E2E, browser matrix, load, atau DR.

## Cara kerja cepat

1. Catat working tree tanpa membuang perubahan generated evidence yang ada.
2. Gunakan `9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb` sebagai **P03 phase base**, bukan sebagai parent. Parent candidate saat ini adalah `11ec69d2...`; jangan salah menamainya.
3. Buat manifest scope di dalam production certification path. Base, candidate, daftar path, dan count harus dihitung dari Git pada saat run dan divalidasi terhadap `HEAD`; jangan memakai manifest/ledger lama sebagai truth.
4. Buat satu production audit-options builder yang memasukkan phase base dan strict scope validation ke duplication, complexity, serta seluruh DNA gates. Negative tests harus memanggil builder/path yang sama, bukan hanya helper dengan option test-only.
5. Perbaiki repeatability/CI: tetapkan satu allowlist exact untuk output generated SSOT/P02/P03. Startup dan post-run boleh mengabaikan hanya path tersebut, tetapi wajib gagal pada dirty source lain. Gunakan allowlist yang sama dalam `.github/workflows/ci.yml`. Buktikan exact CI post-run command exit 0.
6. Jangan memberi analyzer output yang sudah dipotong. Ambil Jest, Vitest, dan ESLint melalui JSON/machine-readable result atau parse raw output penuh terlebih dahulu; simpan hanya ringkasan terstruktur dan log pendek ke evidence. Missing/unparseable/zero test count harus FAIL. Evidence final wajib menunjukkan Jest 23/23 dan 260 passed/0 skipped, Vitest 55 files dan 355 passed/0 skipped, serta warning lint aktual dengan changed scope 0/0.
7. Periksa Prisma dari local CLI dan installed `backend/node_modules/@prisma/client/package.json`, lalu cocokkan dengan manifest dan lock. `Not found`, missing, unparseable, atau mismatch wajib FAIL.
8. Perluas `checkDnaImportBoundary()` agar `@/components/dna/*` di luar implementation root selalu gagal. Tambahkan mutation nyata memakai `@/components/dna/DnaButton` melalui production analyzer path.
9. Regenerasikan ledger/manifest dengan metadata yang benar dan hilangkan kontradiksi `88` versus `87` serta judul “Full 931 Path Ledger”.

## Disiplin eksekusi

- Selama mengedit, jalankan hanya targeted tests untuk scope binding, CI allowlist, result parser, Prisma parser, dan DNA subpath mutation.
- Jangan menjalankan full build/unit suite berulang kali.
- Setelah seluruh targeted tests hijau, commit semua koreksi lalu jalankan sekali:

```text
node scripts/ssot/certify_p03_phase.js
```

- Setelah runner selesai, jalankan source-integrity check yang sama dengan CI dan pastikan exit 0.
- Jangan mengubah registry menjadi PASS; auditor yang akan melakukannya setelah reproduksi independen.
- Jangan handoff apabila manifest SHA berbeda dari token/HEAD, count test tidak terbaca, Prisma masih `Not found`, atau working tree mempunyai perubahan di luar allowlist generated evidence.

Handoff wajib berisi SHA/base, diff count aktual, generated allowlist, hasil exact CI integrity command, metrik machine-readable lint/unit, versi Prisma terpasang, hasil DNA subpath mutation, hasil negative suite, final runner exit/token, dan remaining failures (harus kosong).
