# QA Gate — Tahap 2 Batch 2: Pembelian & Gudang (tulis-aksi palsu)

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (laporan sementara; gate CI, smoke live, dan rollback teruji belum dijalankan)

Lanjutan dari `2026-09-26-tahap2-batch1-master.md`. Cakupan batch ini: sisa Master
(personil, hak akses gudang) + Pembelian + Gudang.

## 1. Reproduksi lebih dulu (wajib per CLAUDE.md)

`frontend/src/app/(dashboard)/__tests__/write-path-persistence.test.tsx` — berkas baru,
level sumber (bukan render). Tiga kelas cacat:

- **A — handler yang berbohong soal tulis yang tidak pernah dikirim.** `toast.success("... berhasil ...")`
  setelah mengubah state React saja.
- **B — handler tanpa rute backend sama sekali, tetap melaporkan sukses.**
- **C — prefiks `/v1` ganda.** `next.config.ts` menulis ulang `/api/:path*` → `<backend>/v1/:path*`,
  jadi halaman yang meminta `/api/v1/users` meminta `/v1/v1/users`.

Progres: **GAGAL 27 | LULUS 14** sebelum fix → **GAGAL 1 | LULUS 46** setelah semua kecuali
workstation → **LULUS 47 / 47**. Setiap kasus tambahan (workstation, `handleCreateDelivery`)
dibuktikan merah dulu sebelum diperbaiki.

Bukti kelas C diukur ke backend lokal: `GET /v1/users` → 401 (ada), `GET /v1/v1/users` → 404.
Test menelusuri seluruh pohon `(dashboard)` (276 berkas) dan melarang `/api/v1/**`.

## 2. Yang diperbaiki

| Halaman | Bukti sebelum | Sesudah |
|---|---|---|
| `/master/personnel` | `fetch("/api/v1/users")` (dobel prefiks, tanpa JWT) + `id: \`u-${Date.now()}\`` + `setUsersList` | `api.get("/users")` + `unwrapResponse`; `POST/PATCH/DELETE /users`; dropdown peran memakai slug (`COMMERCIAL`), bukan label |
| `/master/warehouses` (tab akses) | `setAccessList(prev.map(...))` — `POST /master/warehouses/access` ada dan tidak pernah dipanggil | `POST /master/warehouses/access` per gudang terpilih; grid dimuat dari `GET .../access`; pemilih personel ditambahkan |
| `/pembelian/faktur-pembelian` | `handleCreateBill` set state + toast `"masuk ke Hutang Dagang"`; `handleImportExcel` toast `"3 Faktur Pembelian baru ditambahkan"` tanpa membaca file | `POST /purchase/invoices` (vendor UUID dari `GET /master/suppliers`); `POST /purchase/invoices/import` dengan CSV nyata + input berkas + unduh template; ringkasan impor dihitung dari verdict server |
| `/pembelian/purchase-returns` | `handleApproveVendor` / `handleCompleteReturn` hanya set state + toast | `POST /purchase/returns/:id/approve`; `PATCH /purchase/returns/:id/status { COMPLETED }` |
| `/warehouse/release` | `handleConfirmDelivered` memblokir UI dengan `prompt()` lalu toast | `PATCH /fulfillment/shipments/:id/status { DELIVERED }`; overlay state lokal dihapus, grid di-refetch |
| `/warehouse/workstation` | Cabang "tidak ada batch FEFO" tetap `toast.success("Material Issued Following FEFO.")` | Cabang itu jadi `toast.error`; hanya jalur yang benar-benar mengirim batch yang melaporkan sukses |

## 3. Kebohongan yang dihentikan (rutenya memang tidak ada)

Tidak dikarang rutenya. Handler-nya berhenti mengklaim tersimpan dan menyebut rute yang hilang:

| Handler | Kenapa tidak bisa disambung | Perlakuan |
|---|---|---|
| `pembelian/kebutuhan handleCreateSubmit` | `CreateGoodsRequirementDto` menuntut `salesOrderId` UUID + `items[].materialId` UUID; form berisi kode/nama material | `toast.warning` — dicatat lokal, tidak dikirim |
| `pembelian/dp-pembelian handleApprovePayment` | `PurchasePaymentsController` hanya `POST /` dan `POST /:id/reverse`; `POST .../approve` → 404 | `toast.warning`; state lokal `PAID` tidak lagi dipalsukan |
| `pembelian/faktur-pembelian handleSaveReason` | Controller faktur hanya `POST /`, `POST /import`, `GET /`, `GET /:id`; tidak ada PATCH | `toast.warning`; `bill.unpaidReason` tidak ditulis |
| `warehouse/gudang handleSaveBin` | `POST /warehouse/locations` → 404 (hanya `GET`) | `toast.warning` |
| `warehouse/gudang handleSaveCategory` | tidak ada rute yang menerima field mapping CoA kategori | `toast.warning` |
| `warehouse/release handleCreateDelivery` | `CreateShipmentDto` menuntut `soId` UUID + `logisticsId` UUID; modal berisi nomor SO dan nama ekspedisi bebas | `toast.warning`; surat jalan tidak diterbitkan |

## 4. Perubahan kosakata status yang ikut dibetulkan

`/pembelian/purchase-returns` memakai kosakata karangan (`PENDING_VENDOR/APPROVED/COMPLETED/REJECTED`)
lalu menerjemahkannya di satu baris yang salah: `DRAFT` **dan** `CANCELLED` sama-sama dirender
`"APPROVED"` — klaim palsu kelas yang sama dengan cacat A. Sekarang status memakai enum backend
apa adanya (`DRAFT | WAITING_APPROVAL | COMPLETED | CANCELLED`), penerjemahan dihapus, dan
tombol aksi mengikuti status nyata. Enum backend tidak punya `APPROVED`; `approve` memindahkan
retur ke `COMPLETED`, dan toast-nya mengatakan itu.

## 5. Batas yang diketahui, ditandai `ponytail:` di kode

1. **Grid hak akses gudang hanya menampilkan milik pemanggil.** `warehouses.service.ts findAccess`
   memfilter `where.userId = req.user.id`, jadi admin hanya melihat grant miliknya sendiri.
   Tulisnya benar dan tersimpan; bacanya terbatas. Butuh query param `userId` di backend.
2. **`poNumber` di form faktur display-only.** Service menyetel `poNumber: po?.poNumber` dari
   record PO tertaut; DTO tidak punya field `poNumber` bebas. Diberi catatan di UI.
3. **Nama penerima barang tidak dikirim.** `model Shipment` tidak punya kolom penerima dan
   `UpdateShipmentStatusDto` hanya membawa `status`. Blok POD sekarang menampilkan tanggal
   server (`deliveredAt`), bukan nama yang diketik lalu dibuang.
4. **Import faktur hanya CSV.** Parsing `split(",")` di browser; `.xlsx` butuh dependensi
   pembaca spreadsheet. Modal berhenti mengiklankan `.xlsx`.
5. **`kodeNip`, `phone`, `divisi` personil display-only** — tabel `users` tidak punya kolomnya
   dan `CreateUserDto` tidak punya fieldnya.

## 6. Hasil gate yang SUDAH dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Test reproduksi batch 2 | `npx vitest run "src/app/(dashboard)/__tests__/write-path-persistence.test.tsx"` | EXIT 0 — 47/47 lulus (merah 27 lebih dulu) |
| Seluruh guard fabrikasi | `bash scripts/__tests__/fabrication-guards.test.sh` | EXIT 0 — 6 berkas, 32/32 lulus |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 19 / FAIL 0 / SKIP 0 |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held`; baseline diturunkan di commit yang sama: `no-unused-vars` 885 → 880, `no-raw-ui-import` 1462 → 1461 |
| Typecheck frontend | `npx tsc --noEmit` | EXIT 0 — 0 error |
| Build backend | `npm run build` (backend) | EXIT 0 — 592 berkas terkompilasi |
| Build frontend | `npm run build` (frontend, Next 16.2.6 Turbopack) | EXIT 0 — `Compiled successfully in 23.4s`, seluruh rute termasuk `/warehouse/release`, `/warehouse/gudang`, `/warehouse/workstation`, `/pembelian/purchase-returns` ter-render |
| CI integration test | `bash scripts/test-deploy.sh http://localhost:3002/v1` | EXIT 0 — 6/6 passed (Health, CORS, Login admin@dreamlab.com, Auth Guard, 401 unauth, Root) |
| Keberadaan rute (lokal, 3002) | probe tanpa kredensial: 401 = ada, 404 = tidak ada | `POST users`, `POST/PATCH master/warehouses/access`, `POST purchase/invoices`, `POST purchase/invoices/import`, `POST purchase/returns/:id/approve`, `PATCH purchase/returns/:id/status`, `PATCH fulfillment/shipments/:id/status`, `POST warehouse/batches/:id/status` → **401 (ada)**; `POST warehouse/locations`, `POST purchase/down-payments/:id/approve` → **404 (benar tidak ada)** |
| Rantai paritas | `legacy-fe-delta.mjs` + `parity-crosscheck.mjs` + `build-fe-legacy-report.mjs` | EXIT 0 — 276 halaman, 140 ber-modal; `really_unwired` tetap 41 (+22 renamed tak berpindah) — batch ini menambah aksi tulis, bukan GET |

## 7. Gate yang BELUM dijalankan (sebab verdict BELUM SIAP KIRIM)

1. Smoke test live `https://nexerp.id` — probe tulis belum dijalankan; butuh `PROBE_EMAIL` /
   `PROBE_PASSWORD` dari environment, tidak ada default produksi.
2. Rollback teruji (`bash scripts/rollback.sh <sha>`).

Catatan: build backend, build frontend, dan CI integration smoke test lokal **sudah** hijau (bagian 6). Dua gerbang tersisa berada di ranah live production VPS (smoke live dan rollback teruji).

Sesuai QA GATE CLAUDE.md: satu item belum jelas → **BELUM SIAP KIRIM**.

## 8. Belum di-commit

Semua perubahan batch ini masih di working tree; belum ada commit yang diotorisasi pengguna.
