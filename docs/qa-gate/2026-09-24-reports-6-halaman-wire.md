# QA GATE — Wire 6 halaman report ke backend nyata

Tanggal: 2026-09-24
Isu: 6 halaman report menampilkan data statis palsu
Perubahan: frontend saja (6 file), TIDAK ada file backend disentuh

## Ringkasan

6 halaman report di `frontend/src/app/(dashboard)/reports/` diganti dari array
statis (`SAMPLE_*`, `STATIC_*`, `INITIAL_*`) menjadi `useQuery` +
`api` dari `@/lib/api` yang menembak endpoint backend yang SUDAH ADA.

## Endpoint per file

| File | Endpoint | Sumber |
| --- | --- | --- |
| `busdev-follow-up/page.tsx` | `GET /reports/follow-up-customer` | `reports.controller.ts` (sudah ada) |
| `goods-receipt/page.tsx` | `GET /purchase/goods-receipts` | `InboundsController` alias `['purchase/goods-receipts','scm/inbounds']` |
| `guest-book/page.tsx` | `GET /reports/guest-book` | `reports.controller.ts` (sudah ada) |
| `mutation-goods/page.tsx` | `GET /warehouse/transactions` | `warehouse.controller.ts` (sudah ada) |
| `stock/page.tsx` | `GET /reports/stock` | `reports.controller.ts` (sudah ada) |
| `stock-valuation/page.tsx` | `GET /reports/stock-valuation` | `reports.controller.ts` (sudah ada) |

Catatan pemakaian ulang endpoint:
- `GET /reports/mutation-goods` TIDAK dipakai — service melempar
  `BadRequestException('goods_id is required for mutation report')` bila
  `goods_id` kosong, sehingga tidak bisa jadi tabel. Halaman memakai
  `GET /warehouse/transactions` lalu menghitung saldo berjalan per material
  di komponen.
- `POST /reports/goods-receipts` hanya stub 202 `{status:'QUEUED'}` (bukan
  listing), jadi halaman GRN memakai listing nyata `GET /purchase/goods-receipts`.

## Gerbang

| Gate | Perintah | Hasil |
| --- | --- | --- |
| tsc, filter reports | `cd frontend && npx tsc --noEmit 2>&1 \| grep "reports"` | KOSONG (lulus) |
| tsc, total error | `cd frontend && npx tsc --noEmit 2>&1 \| grep -c "error TS"` | 1 |
| array statis sisa | `grep -nE "const (SAMPLE\|STATIC\|MOCK\|DUMMY\|INITIAL)_"` di 6 file | KOSONG (lulus) |
| backend disentuh | `git status -- backend/` vs task | TIDAK ADA file backend diubah untuk task ini |

### Satu error tsc yang tersisa (BUKAN dari task ini)

```
src/app/(dashboard)/finance/collections/page.tsx(155,9): error TS2322:
  Property 'extraActions' does not exist on type 'DnaDataTableCardProps'.
```

File ini di luar scope 6 file (sudah dimodifikasi sebelum task, oleh pekerjaan
lain). `DnaDataTableCard` tidak punya prop `extraActions` — pola yang benar
adalah `toolbarProps={{ ... }}` (dipakai di `reports/stock`, `mutation-goods`,
`goods-receipt`). Perbaikannya: pindahkan `searchPlaceholder`/`searchValue`/
`onSearchChange`/`extraActions` ke dalam `toolbarProps`.

## Status: BELUM SIAP KIRIM

Alasan: `npx tsc --noEmit` masih 1 error (walau di luar 6 file scope), jadi
gerbang "build frontend tanpa error baru" belum hijau bersih. Sisa gate pada
CLAUDE.md (CI `scripts/test-deploy.sh`, smoke test live, rollback teruji)
BELUM dijalankan di sesi ini.