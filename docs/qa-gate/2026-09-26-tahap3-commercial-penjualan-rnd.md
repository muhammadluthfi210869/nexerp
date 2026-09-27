# QA Gate — Tahap 3: Commercial, Penjualan, R&D & Checklist Tracking

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (laporan sementara; gate smoke live produksi dan rollback teruji VPS belum dijalankan)

Lanjutan dari `2026-09-26-tahap2-batch2-pembelian-gudang.md`. Cakupan batch ini: Commercial, Penjualan, R&D & Checklist Tracking (SCR-121, SCR-136, approval sample, sample sales, sales target).

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

`frontend/src/app/(dashboard)/__tests__/tahap3-write-path.test.tsx` — pengujian tingkat sumber:
1. **R&D / Formula Adjustment (`/inventory/formula-adjustment-rnd`)**:
   `handleSaveUpscale` sebelumnya memancarkan `toast.success("Penyesuaian Formulasi Disimpan", ...)` padahal backend tidak memiliki endpoint penyimpanan penyesuaian formulasi (`POST /rnd/formulas/adjustments`).
2. **Persetujuan Sample R&D (`/approvals/sales-sample`)**:
   Sebelumnya tidak memasang prop `onApprove` dan `onReject` pada `ApprovalPageShell`, sehingga tindakan persetujuan/penolakan operator hanya memodifikasi state lokal tanpa memanggil endpoint transisi sample R&D backend.
3. **Penjualan Sample (`/penjualan/sample-sales`)**:
   `handleCreateSubmit` membuat ID buatan `smp-${Date.now()}` dan memasukkannya ke state lokal via queryClient tanpa mengirim request HTTP ke `POST /bussdev/samples`.
4. **Target Penjualan BusDev (`/penjualan/sales-target`)**:
   `handleCreateSubmit` membuat ID `st-${Date.now()}` dan melaporkan `toast.success("Target Ditambahkan", ...)` padahal backend belum menyediakan HTTP controller untuk `SalesTarget`.
5. **Checklist Tracking & Progres Mutu (`/quality/checklist-progress`, `/quality/checklist-tracking`)**:
   Memverifikasi bahwa data dimuat dari rute backend QC langsung (`GET /qc/checklists` dan `GET /qc/checklists/completed`) tanpa fallback array palsu hardcoded.

**Hasil eksekusi test awal:** 7 GAGAL | 1 LULUS (terbukti merah).
**Hasil eksekusi setelah perbaikan:** 8 LULUS / 8 (exit 0).

## 2. Yang Diperbaiki

| Halaman | Bukti Sebelum | Sesudah |
|---|---|---|
| `/inventory/formula-adjustment-rnd` | `handleSaveUpscale` memancarkan `toast.success` klaim diajukan ke SPK Produksi | Diubah menjadi `toast.warning` jujur: perhitungan upscaling disimpan di memori sesi aktif lokal karena backend belum menyediakan endpoint persistensi |
| `/approvals/sales-sample` | `ApprovalPageShell` tanpa `onApprove` / `onReject` | Tersambung ke `PATCH /rnd/sample/:id/advance` (`newStage: APPROVED / REJECTED`), fallback ke `POST /rnd/sample/:id/accept`, serta refetch query otomatis |
| `/penjualan/sample-sales` | `handleCreateSubmit` meracik `smp-${Date.now()}` dan mutate local array | Menggunakan `useMutation` tersambung ke `POST /bussdev/samples`, reset form bersih, dan invalidasi query |
| `/penjualan/sales-target` | `handleCreateSubmit` memancarkan `toast.success` untuk ID `st-${Date.now()}` | Diubah menjadi `toast.warning` jujur bahwa alokasi target disimpan di memori sesi aktif dan controller backend belum dibuka |
| `/quality/checklist-progress` & `/quality/checklist-tracking` | Verifikasi integrasi endpoint live | Terhubung ke `GET /qc/checklists` dan `GET /qc/checklists/completed` (mengembalikan 401 saat belum auth, 200 saat auth) |

## 3. Batas yang Diketahui, Ditandai `ponytail:` di Kode

1. **`inventory/formula-adjustment-rnd`**: Bersifat alat hitung analitik operasional pra-produksi. Hasil upscale berfungsi sebagai parameter panduan SPK, bukan tabel transaksi mandiri di backend saat ini.
2. **`penjualan/sales-target`**: Model Prisma `SalesTarget` ada di schema `system.prisma`, namun controller HTTP belum diekspos di backend. Form mengalokasikan target lokal sesi aktif dengan peringatan jujur.
3. **`approvals/sales-sample`**: Memanfaatkan transisi stage `SampleStage.APPROVED` / `REJECTED` pada `SampleRequest`.

## 4. Hasil Gate yang Sudah Dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Test reproduksi Tahap 3 | `npx vitest run tahap3-write-path` | EXIT 0 — 8/8 lulus (merah 7 lebih dulu) |
| Test reproduksi Tahap 2 Batch 2 | `npx vitest run write-path` | EXIT 0 — 55/55 lulus di 2 file test |
| Seluruh guard fabrikasi | `bash scripts/__tests__/fabrication-guards.test.sh` | EXIT 0 — 6 berkas test, 32/32 lulus |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 19 / FAIL 0 / SKIP 0 |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held`; baseline `@typescript-eslint/no-unused-vars` turun dari 880 ke 856 |
| Typecheck frontend | `npm run typecheck` (frontend) | EXIT 0 — 0 error TypeScript |
| Build backend | `npm run build` (backend) | EXIT 0 — 592 berkas terkompilasi |
| Build frontend | `npm run build` (frontend, Next 16.2.6 Turbopack) | EXIT 0 — `Compiled successfully in 18.7s` (266/266 static pages generated) |
| CI integration test | `bash scripts/test-deploy.sh http://10.49.247.240:3002/v1` | EXIT 0 — 6/6 passed (Health, CORS, Login admin@dreamlab.com, Auth Guard, 401 unauth, Root) |
| Rantai paritas | `legacy-fe-delta.mjs` + `parity-crosscheck.mjs` + `build-fe-legacy-report.mjs` | EXIT 0 — 276 halaman, 140 ber-modal |

## 5. Gate yang BELUM Dijalankan (Sebab Status BELUM SIAP KIRIM)

1. Smoke test live `https://nexerp.id` pada lingkungan VPS produksi.
2. Pengujian prosedur rollback (`bash scripts/rollback.sh <sha>`).

Sesuai aturan wajib CLAUDE.md: ada gerbang yang belum dijalankan → **BELUM SIAP KIRIM**.
