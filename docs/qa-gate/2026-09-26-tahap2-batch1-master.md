# QA Gate — Tahap 2 Batch 1: Master Data (tulis-aksi palsu)

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (laporan sementara, gate build/deploy/smoke live belum dijalankan)

## 1. Temuan yang dikerjakan

Empat halaman Master adalah cangkang read-only: aksi tulisnya hanya mengubah state React
lalu `toast.success("... berhasil ...")`. Tidak ada request yang dikirim. Refresh →
data hilang. Import "Excel" supplier bahkan tidak pernah membaca file dan melaporkan
jumlah baris yang dikarang (`"12 Rekanan Supplier berhasil diimpor dari Excel."`).

| Halaman | Bukti sebelum | Sesudah |
|---|---|---|
| `/master/suppliers` | `id: \`sup-${Date.now()}\`` + `setSuppliersList`; import tanpa `<input type="file">` | `POST/PATCH/DELETE /master/suppliers`, import `POST /master/suppliers/import` (`{ csvContent }`), template CSV nyata |
| `/master/customers` | `id: \`cust-${Date.now()}\`` + `setCustomersList` | `POST/PATCH/DELETE /master/customers` (payload `clientName`, `instansi`, `phone`, `alamatDetail`) |
| `/master/goods` | `id: \`brg-${Date.now()}\`` + `setGoodsList`; kategori `cat-${Date.now()}` | `POST/PATCH/DELETE /master/materials`, `POST/PATCH /master/categories` |
| `/master/warehouses` | `id: \`wh-${Date.now()}\`` + `setWarehousesList` | `POST/PATCH/DELETE /master/warehouses` |

Reproduksi lebih dulu (wajib per CLAUDE.md), baru fix:
`frontend/src/app/(dashboard)/master/__tests__/master-crud-persistence.test.tsx` — GAGAL 8/8
sebelum fix, HIJAU 8/8 sesudah.

## 2. Batas yang diketahui dan sengaja tidak ditutup

Ditandai `ponytail:` di kode:

1. **Supplier `categoryId`** tidak dikirim. Form hanya punya label kategori ("Bahan Baku"),
   backend menuntut `@IsUUID()`. Kolom jadi display-only sampai ada rute daftar kategori supplier.
2. **Customer `status`** tidak dikirim. `SalesLead.status` bertipe `WorkflowStatus`
   (`NEW_LEAD`…`WON_DEAL`/`LOST`), sedangkan form ini ACTIVE/INACTIVE. Mengirimnya akan
   error enum atau berbohong soal tahap pipeline.
3. **Material `stockQty`** tidak dikirim. Menulis stok di sini akan menyetel on-hand tanpa
   entri ledger inventory. Stok mulai 0 dan hanya bergerak lewat penerimaan/opening balance.
4. **Warehouse `kodeGudang` dan `status`** tidak tersimpan — tabel `warehouses` tidak punya
   kolomnya; daftar menurunkan kode dari id. Yang benar-benar tersimpan: name, pic, phone,
   province, city, address.
5. **Import hanya CSV.** `.xlsx` butuh parser yang belum ada; modal sekarang jujur menyebut
   CSV, bukan mengiklankan `.xlsx` lalu toast palsu.

## 3. Hasil gate yang SUDAH dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Test reproduksi Master | `npx vitest run src/app/(dashboard)/master/__tests__/master-crud-persistence.test.tsx` | EXIT 0 — 8/8 lulus |
| Seluruh guard fabrikasi | `bash scripts/__tests__/fabrication-guards.test.sh` | EXIT 0 — 6 berkas, 32/32 lulus |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 19 / FAIL 0 / SKIP 0 |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held`; baseline `no-unused-vars` 893 → 885 diturunkan di commit yang sama |
| Typecheck frontend | `npx tsc --noEmit` | EXIT 0 — 0 error |
| Rute backend terdaftar | log `backend-dev.log` | `POST /v1/master/suppliers`, `PATCH :id`, `DELETE :id`, `POST import`, `GET export` terdaftar; idem materials/categories/warehouses |
| Rantai paritas | `legacy-fe-delta.mjs` + `parity-crosscheck.mjs` + `build-fe-legacy-report.mjs` | EXIT 0 — 276 halaman, 140 ber-modal; halaman zero-call tetap 18 (fix menambah aksi tulis, bukan GET) |

## 4. Gate yang BELUM dijalankan (sebab verdict BELUM SIAP KIRIM)

1. `cd frontend && npm run build` (build produksi standalone).
2. `cd backend && npm run build`.
3. `bash scripts/test-deploy.sh` (CI).
4. Smoke test live (`nexerp.id`) — probe tulis belum dilakukan; butuh `PROBE_EMAIL` /
   `PROBE_PASSWORD` dari environment, tidak ada default produksi.
5. Rollback teruji.

## 5. Sisa kelas cacat yang sama (terukur, belum diperbaiki)

Pindai `scripts/.t2-scan.mjs` (handler yang `toast.success` + mengubah state lokal tanpa
panggilan jaringan). 42 handler di 29 berkas. Yang **di dalam cakupan Tahap 2** dan
menandai cacat nyata (mengarang id atau mengubah status tanpa backend):

| Berkas | Handler |
|---|---|
| `master/personnel/PersonnelRegistry.tsx` | `handleSaveUser` (mengarang id), `handleDeleteUser` |
| `master/warehouses/page.tsx` | `handleSaveAccess` (grant akses gudang hanya lokal; backend punya `POST /master/warehouses/access`) |
| `pembelian/kebutuhan/page.tsx` | `handleCreateSubmit` (mengarang id) |
| `pembelian/faktur-pembelian/page.tsx` | `handleCreateBill`, `handleSaveReason`, `handleImportExcel` |
| `pembelian/purchase-returns/page.tsx` | `handleApproveVendor`, `handleCompleteReturn` |
| `pembelian/dp-pembelian/page.tsx` | `handleApprovePayment` |
| `warehouse/gudang/page.tsx` | `handleSaveBin`, `handleSaveCategory` |
| `warehouse/release/page.tsx` | `handleConfirmDelivered` |
| `warehouse/workstation/page.tsx` | `handleIssueConfirmation` |

Di luar cakupan Tahap 2 (produksi, penjualan, kualitas, marketing, system) — 20 berkas lagi,
termasuk `production/work-orders` `handleCreateWo`/`handleAdvanceStage` dan tiga halaman
produksi `handleStartProduce`/`handleCompleteProduce`.

Catatan keandalan pindai: beberapa hasil adalah positif palsu yang wajar — `handleExportExcel`,
`handleDownloadTemplate`, `handleExportCSV` menulis berkas lalu toast, dan
`handleUpdatePassword` bisa lewat service. Untuk kelas cacat, patokan tepatnya penanda
`[mints id]`.

## 6. Kesimpulan

Empat halaman Master sekarang benar-benar menyimpan. Empat gate lokal hijau
(test, suite shell, ratchet DNA, typecheck). **BELUM SIAP KIRIM**: build backend+frontend,
`test-deploy.sh`, smoke live, dan rollback teruji belum dijalankan; sisa 9 handler
dalam cakupan Tahap 2 masih mengarang keberhasilan.
