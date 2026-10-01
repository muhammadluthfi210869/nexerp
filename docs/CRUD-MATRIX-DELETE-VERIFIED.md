# Fase 0 Addendum — Delete, sudah diverifikasi

**Tanggal:** 2026-10-01 ·/addendum ke `CRUD-MATRIX-2026-10-01.md` bagian 5 butir 1

Caveat di matriks menyatakan "D=0 belum tentu berarti tidak bisa hapus, soft delete tidak terlihat di census." **Pertanyaan itu sudah dijawab dengan census flag.** Hasilnya justru memperkuat kekhawatiran, bukan meredakannya.

---

## 1. Inventaris flag (212 model)

| Flag | Model owner | Write site | Catatan |
|:---|--:|--:|:---|
| `deletedAt` | 10 | **7** | |
| `isActive` | 15 | **4** | |
| `isDeleted` | 0 | 0 | tidak ada sama sekali |
| `archivedAt` | 0 | 0 | |
| `isArchived` | 0 | 0 | |
| `isVoid` / `isCancelled` | 0 | 0 | pembatalan dokumen tidak direpresentasikan |

Total **11 titik tulis soft-delete/archive di seluruh backend.** Tujuh di antaranya: `materialItem` (2), `user` (2), `salesReturn` (1), `supplier` (1), `comm-channel` (1, ke metadata JSON bukan kolom). Empat `isActive:false`: `account`, `employee`, `masterCategory`, `machine`.

---

## 2. P0 — 6 model punya kolom `deletedAt` tapi tidak pernah ditulis

Kolom ada, dan pada sebagian sogar **dibaca sebagai filter** — jadi filternya permanen benar dan tidak pernah menyaring apa pun.

| Model | Kolom | Ditulis? | Dibaca/filter? | Efektif |
|:---|:-:|:-:|:-:|:---|
| `SalesOrder` | ✅ | **TIDAK PERNAH** | 4 file | filter mati |
| `Invoice` | ✅ | **TIDAK PERNAH** | 1 file | filter mati |
| `Payment` | ✅ | **TIDAK PERNAH** | 0 | kolom mati |
| `ProductionPlan` | ✅ | **TIDAK PERNAH** | 0 | kolom mati |
| `WorkOrder` | ✅ | **TIDAK PERNAH** | 0 | kolom mati |
| `PurchaseOrder` | ✅ | **TIDAK PERNAH** | 0 | kolom mati |
| `User` | ✅ | 2 file | 3 file | bekerja |
| `MaterialItem` | ✅ | 2 file | 5 file | bekerja |
| `SalesReturn` | ✅ | 1 file | 1 file | bekerja |
| `Supplier` | ✅ | 1 file | 1 file | bekerja |

### Konsekuensi

**Enam dokumen inti — SalesOrder, PurchaseOrder, Invoice, Payment, WorkOrder, ProductionPlan — tidak bisa dihapus lewat jalur mana pun.** Bukan soft delete, bukan hard delete. Satu-satunya jalan adalah membalik status lewat transisi yang ada, dan `executeTransition` tidak terpanggil (lihat Batch F).

Untuk dokumen keuangan, "tidak bisa dihapus" memang bisa jadi yang diinginkan — tapi itu harus **keputusan**, bukan ketiadaan implementasi. Sekarang tidak ada satu pun tempat di kode yang menyatakan keputusan itu. `isVoid`/`isCancelled` nol di 212 model, jadi tidak ada cara merepresentasikan pembatalan tanpa memakai enum `status` yang sudah ada, dan pemeriksaannya nol.

`CreativeRequest` dan `Lead` memfilter `deletedAt: null` pada model yang tidak punya kolom itu — filter tersebut sama sekali tidak memblokir apa pun.

---

## 3. Hard delete: 33 call site, 26 model

4 di antaranya ada di `__tests__/` (`lead-capture-e2e.spec.ts` ×2, `lead-capture-fields.spec.ts` ×2) — bukan produksi. Jadi **29 call site produksi pada 25 model.**

Model inti yang punya hard delete: `salesLead`, `taskItem`, `taskBoard`, `ticket`, `salesTarget`, `salesCategory`, `warehouseAccess`, `roundRobinAgent`, `assetDisposal`, `productionPlan` (di `production-batch-record.service.ts:253`).

`productionPlan` menarik: satu-satunya model dokumen inti yang bisa dihapus, dan itupun di dalam service batch record — bukan dari controller produksi.

Model yang **tidak punya** hard delete maupun soft delete: `salesOrder`, `purchaseOrder`, `purchaseReturn`, `invoice`, `salesInvoice`, `payment`, `workOrder`, `materialItem` (yang punya soft, tapi tidak hard), `customer`, `bill`, `journalEntry`, `journalLine`, `sampleRequest`, `formula`, `leadCapture`, `materialInventory`, `inventoryTransaction`, `bankAccount`, `bankTransaction`, `fixedAsset`, `shipment`, `deliveryOrder`, `goodsRequirement`, `documentDraft`, `notification`, `approval`, `activityStream`.

---

## 4. P1 — split-brain pada MaterialItem

Dua service berbeda sama-sama soft-delete `materialItem`:

- `backend/src/modules/master/services/materials.service.ts:409`
- `backend/src/modules/scm/services/materials.service.ts:82`

Dua service, satu entitas, tanpa koordinasi Dosnda modul SCM dan modul master punya ide berbeda tentang siapa yang berhak menghapus barang. Cek Fase 3/D: apakah read path-nya juga terpecah.

---

## 5. Angka DELETE yang dikoreksi

Matriksermen feared "149 dari 173 entitas tanpa delete" terlalu longgar. Angka yang benar:

| Kategori | Jumlah |
|:---|--:|
| Entitas dengan soft delete **berfungsi** | 4 (user, materialItem, salesReturn, supplier) |
| Entitas dengan archive flag **berfungsi** | 4 (account, employee, masterCategory, machine) |
| Entitas dengan hard delete | 25 |
| Entitas tanpa jalur hapus apa pun | **±140** |
| Entitas dengan kolom `deletedAt` yang **tidak pernah ditulis** | **6** |

Koreksinya: memang 149-ish, tapi sekarang kita tahu itu **bukan** artefak census — soft delete memang nyaris tidak diimplementasikan. Yang paling tajam bukan jumlahnya, tapi 6 model yang punya kolom dan filter tapi nol write.

---

## 6. Yang harus dikerjakan agent Batch

- **Batch C (finance):** `Invoice`, `SalesInvoice`, `Bill`, `Payment`, `JournalEntry`, `ARReceipt`, `APPayment`, `BankTransaction` — konfirmasi tidak ada jalur hapus, dan_putuskan apakah itu disengaja.
- **Batch B (supply):** `PurchaseOrder`, `PurchaseReturn`, `WorkOrder`, `Shipment`, `DeliveryOrder`, `GoodsRequirement` — sama.
- **Batch D (master):** split-brain `materials.service.ts` di master vs scm.
- **Semua batch:** kalau menemukan enum status yang berfungsi sebagai pembatalan (mis. `CANCELLED`, `VOID`), laporkan — itu jalur hapus yang sebenarnya ada.

---

## 7. Metodologi (untuk reproducibility)

Census dilakukan terhadap `backend/src/**/*.ts`:
- tulis soft-delete: regex `deletedAt\s*:\s*new Date\(\)` dan `isActive\s*:\s*false`, lalu mundur 900 karakter untuk menemukan `prisma.<accessor>` terdekat yang menentukan model target.
- hard delete: regex `(?:prisma|tx|client)\.(\w+)\.delete(Many)?\s*\(`.
- filter baca: `deletedAt\s*:\s*null`, `isActive\s*:\s*(true|false)`, per file.

Semua angka di dokumen ini berasal dari ketiga census tersebut, bukan dari estimasi.
