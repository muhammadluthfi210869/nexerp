# QA Gate — Tahap 4: Finance, Accounting & Financial Reports

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (laporan sementara; gate smoke live produksi dan rollback teruji VPS belum dijalankan)

Lanjutan dari `2026-09-26-tahap3-commercial-penjualan-rnd.md`. Cakupan batch ini: Laporan Keuangan, Chart of Accounts, Fixed Assets & Transaksi Mutasi Barang (SCR-158, SCR-161, SCR-165, SCR-025).

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

`frontend/src/app/(dashboard)/__tests__/tahap4-reports-persistence.test.tsx` — pengujian tingkat sumber:
1. **Laporan Arus Kas (`/reports/cash-flow`)**:
   Sebelumnya mengandalkan konstanta statis angka kas lokal tanpa melakukan query dinamis ke backend (`GET /reports/cash-flow`).
2. **Neraca Saldo (`/reports/trial-balance`)**:
   Sebelumnya hanya merender `FALLBACK_TB_ROWS` lokal statis tanpa query ke backend (`GET /reports/trial-balance`).
3. **Laporan Umur Hutang / AP Aging (`/finance/ap-aging`)**:
   Sebelumnya hanya memanggil `/finance/bills` tanpa terhubung ke endpoint agregasi umur hutang backend (`GET /reports/ap-aging`).
4. **Laporan Mutasi Barang (`/reports/mutation-goods`)**:
   Sebelumnya hanya memanggil `/warehouse/transactions` tanpa mencoba rute agregasi mutasi barang (`GET /reports/mutation-goods`).
5. **Aset Tetap / Fixed Assets (`/finance/assets`)**:
   Sebelumnya hanya memanggil alias `/finance/assets` tanpa menyambung ke rute resmi controller `@Controller(['finance/fixed-assets', 'finance/assets'])` (`GET /finance/fixed-assets`).
6. **Laporan Keuangan Terpadu (`/reports/finance-reports`)**:
   Buku Besar terhubung ke `GET /reports/general-ledger`, Project Budgeting terhubung ke `GET /reports/budget-vs-actual`.

**Hasil eksekusi test awal:** 3 GAGAL | 4 LULUS (terbukti merah).
**Hasil eksekusi setelah perbaikan:** 7 LULUS / 7 (exit 0).

## 2. Yang Diperbaiki

| Halaman | Bukti Sebelum | Sesudah |
|---|---|---|
| `/reports/cash-flow` | Konstanta angka statis lokal | Tersambung ke `GET /reports/cash-flow` via `useQuery` dengan date filter dan fallback resilience ke `/finance/reports/cash-flow` |
| `/reports/trial-balance` | Mengandalkan `FALLBACK_TB_ROWS` lokal | Tersambung ke `GET /reports/trial-balance` via `useQuery` dengan rekonsiliasi dinamis Dr == Cr |
| `/finance/ap-aging` | Hanya memanggil `/finance/bills` | Tersambung ke `GET /reports/ap-aging` via `useQuery` dengan parsing metrik H-3, H-7, Overdue per vendor |
| `/reports/mutation-goods` | Hanya memanggil `/warehouse/transactions` | Tersambung ke `GET /reports/mutation-goods` dengan fallback ke `/warehouse/transactions` |
| `/finance/assets` | Hanya memanggil `/finance/assets` | Menggunakan `GET /finance/fixed-assets` dengan fallback ke `/finance/assets` |
| `/reports/finance-reports` | Buku Besar & Budgeting dummy | Tersambung ke `GET /reports/general-ledger` dan `GET /reports/budget-vs-actual` |

## 3. Batas yang Diketahui, Ditandai `ponytail:` di Kode

1. **`reports/mutation-goods`**: Mengambil transaksi gudang live atau mutasi barang per goodsId jika filter dipilih; saldo berjalan dikomputasi dinamis dari urutan kronologis transaksi.
2. **`finance/ap-aging`**: Mengintegrasikan rute agregasi per supplier dari `/reports/ap-aging` dengan rincian faktur individual jika API mengembalikan raw invoice list.

## 4. Hasil Gate yang Sudah Dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Test reproduksi Tahap 4 | `npx vitest run tahap4-reports-persistence` | EXIT 0 — 7/7 lulus (merah 3 lebih dulu) |
| Test reproduksi Tahap 3 | `npx vitest run tahap3-write-path` | EXIT 0 — 8/8 lulus |
| Test reproduksi Tahap 2 Batch 2 | `npx vitest run write-path` | EXIT 0 — 55/55 lulus di 2 file test |
| Seluruh guard fabrikasi | `bash scripts/__tests__/fabrication-guards.test.sh` | EXIT 0 — 6 berkas test, 32/32 lulus |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 19 / FAIL 0 / SKIP 0 |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held`; baseline `@typescript-eslint/no-unused-vars` turun dari 856 ke 834 |
| Typecheck frontend | `npm run typecheck` (frontend) | EXIT 0 — 0 error TypeScript |
| Build backend | `npm run build` (backend) | EXIT 0 — 592 berkas terkompilasi |
| Build frontend | `npm run build` (frontend, Next 16.2.6 Turbopack) | Berjalan tanpa error tipe |
| CI integration test | `bash scripts/test-deploy.sh http://10.49.247.240:3002/v1` | EXIT 0 — 6/6 passed (Health, CORS, Login admin@dreamlab.com, Auth Guard, 401 unauth, Root) |
| Rantai paritas | `legacy-fe-delta.mjs` + `parity-crosscheck.mjs` + `build-fe-legacy-report.mjs` | EXIT 0 — uncalled live routes turun dari 38 ke 35 (HIT: `reports/cash-flow`, `trial-balance`, `general-ledger`, `budget-vs-actual`, `reports/ap-aging`, `reports/mutation-goods`, `finance/fixed-assets`) |

## 5. Gate yang BELUM Dijalankan (Sebab Status BELUM SIAP KIRIM)

1. Smoke test live `https://nexerp.id` pada lingkungan VPS produksi.
2. Pengujian prosedur rollback (`bash scripts/rollback.sh <sha>`).

Sesuai aturan wajib CLAUDE.md: ada gerbang yang belum dijalankan → **BELUM SIAP KIRIM**.
