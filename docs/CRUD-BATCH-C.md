# CRUD Audit — Batch C (Finance & Commercial)

**Tanggal audit:** 2026-10-01
**Branch:** `feat/p08-contracts-subject-ownership` @ `b561dffe`
**Scope:** `backend/src/modules/finance/**` (30 subdir, 33 controller), `backend/src/modules/commercial/**`, `backend/prisma/schema/finance*.prisma` (41 model), `frontend/src/app/(dashboard)/finance/**` (40 route) + `.../penjualan/**` (21 route)

Semua angka di bawah dihitung dengan grep/script terhadap working tree pada SHA di atas. Metode census ada di bagian [Klaim yang tidak bisa diverifikasi](#4-klaim-yang-tidak-bisa-diverifikasi).

---

## 1. Ringkasan per entitas

Verdict: **WORKS** = alur end-to-end ada dan Dijaga · **PARTIAL** = ada tapi cacat/lubuk · **MISSING** = tidak ada · **UNVERIFIED** = tidak bisa dipastikan tanpa runtime.

### 1.1 Entitas dengan Prisma model dedicated

| Entitas | C | R | U | D |
|---|---|---|---|---|
| `Account` (CoA, `accounts`) | PARTIAL — create ada, duplikasi dicek; FE: `useCoaOperations.ts` | WORKS — `GET /finance/accounts`, live | PARTIAL — Patch ada, **tanpa cek journal line** | PARTIAL — soft (`isActive:false`), **tanpa cek terpakai** |
| `JournalEntry` | PARTIAL — balance dicek, tapi tax-split memecah balance | WORKS — list `include:{lines,account}` | MISSING — tak ada `@Put`/`@Patch`; hanya `reverse` | MISSING — tak ada endpoint delete (default: terlindungi) |
| `JournalLine` | PARTIAL — hanya via `createJournalEntry` (nested) | PARTIAL — terbaca, tak ada filter per line | MISSING — tak ada endpoint | MISSING — tak ada endpoint |
| `FinancialPeriod` | MISSING — **nol writer di seluruh backend** | PARTIAL — hanya `findFirst` gate | MISSING | MISSING |
| `PeriodLock` (`period_locks`) | WORKS — `lock()` upsert | WORKS | PARTIAL — `unlock` ada, tanpa SoD/approval | MISSING |
| `ClosingChecklist` | PARTIAL — `generateMonthlyChecklist` idempoten? perlu cek | WORKS | PARTIAL — `completeItem`/`reopenItem` | MISSING |
| `AdjustmentJournal` | PARTIAL | PARTIAL — `getProgress` | PARTIAL — `review`/`approve` (state machine) | MISSING |
| `FixedAsset` | PARTIAL | PARTIAL — tanpa pagination | PARTIAL — Patch, tanpa guard status | MISSING |
| `DepreciationSchedule` | PARTIAL — `generate()` `skipDuplicates` | PARTIAL | MISSING | MISSING |
| `AssetTransfer` | PARTIAL | PARTIAL | MISSING | MISSING |
| `AssetDisposal` | PARTIAL — `create` = disposal, flip status | PARTIAL | PARTIAL — `reverse` | MISSING |
| `IntangibleAsset` | PARTIAL | PARTIAL | PARTIAL — `retire` | MISSING |
| `BankAccount` | PARTIAL | PARTIAL | PARTIAL — Patch | MISSING |
| `BankTransaction` | PARTIAL — **`create` tak pernah menulis baris** (`prisma.bankTransaction.update` saja) | PARTIAL | PARTIAL — `reconcile`/`unreconcile` | MISSING |
| `BankReconciliation` | PARTIAL | PARTIAL | PARTIAL — `finalize`/`reopen` | MISSING |
| `APPayment` | PARTIAL | PARTIAL | PARTIAL — `verify`/`markPaid` | MISSING |
| `ARReceipt` | PARTIAL — nomor **`count+1` racy** | PARTIAL | PARTIAL — `allocateToInvoice` | MISSING |
| `Bill` | PARTIAL | PARTIAL — `findAll` 1 route saja | PARTIAL — `post`/`cancel` | MISSING |
| `BillLineItem` | PARTIAL | PARTIAL | PARTIAL — Patch, ada guard `postedAt` | WORKS — `remove` hard delete + guard `postedAt` |
| `BillAllocation` | PARTIAL — via `ap-payments.allocateToBill` | UNVERIFIED | UNVERIFIED | MISSING |
| `BillMatchResult` | PARTIAL | PARTIAL | MISSING | MISSING |
| `DownPayment` | PARTIAL | PARTIAL | PARTIAL — `post`/`applyToBill`/`cancel` | MISSING |
| `SalesInvoice` + `SalesInvoiceLineItem` | PARTIAL — **`post` tidak balance** | PARTIAL | PARTIAL — `cancel`; **line item Patch/Delete ada** | PARTIAL — line-item delete ada; invoice tidak |
| `SampleFee` | PARTIAL | PARTIAL | PARTIAL — `link/unlink` | MISSING |
| `TaxRate` (`Tax`) | WORKS — ada create | WORKS | WORKS — Patch | WORKS — hard delete |
| `TaxTransaction` | PARTIAL | PARTIAL | PARTIAL — `markReported`/`markPaid` | MISSING |
| `Currency` | WORKS | WORKS | WORKS — Patch + `PUT exchange-rate` | WORKS — hard delete |
| `AutoJournalConfig` | WORKS | WORKS | WORKS — upsert | WORKS |
| `ClientEscrow` | MISSING — tak ada `create`; hanya `deposit`/`release` | PARTIAL | PARTIAL | MISSING |
| `CostAllocation` | PARTIAL | PARTIAL | MISSING | MISSING |
| `CostVariance` | PARTIAL | PARTIAL | MISSING | MISSING |
| `JobOrderCosting` | PARTIAL | PARTIAL | PARTIAL — `close`/`reopen`/`updateTotals` | MISSING |
| `ProductProfitability` | PARTIAL — `upsert` saja | PARTIAL — `getTop/WorstPerformers` ada `take` | PARTIAL (upsert) | MISSING |
| `InventoryOwnership` | PARTIAL | PARTIAL | PARTIAL — `adjustQuantity`/`transferOwnership` | MISSING |
| `FinancialSummaryLedger` | UNVERIFIED — tak ada service/controller | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `StockAdjustment` / `StockAdjustmentItem` | UNVERIFIED — di luar `finance/`, tak di-audit | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `FundRequest` | PARTIAL — create + approve/reject/disburse | PARTIAL | PARTIAL — blind status setter | MISSING |
| `Customer` (finance-scoped) | PARTIAL | PARTIAL | PARTIAL | MISSING |

### 1.2 Entitas di `unified_invoices` (tabel `Invoice`)

| Entitas | C | R | U | D |
|---|---|---|---|---|
| `Invoice` / `unified_invoices` | PARTIAL — **nomor invoice = `dto.id` dari client** | PARTIAL — `findAll` hardcode `category:'RECEIVABLE'` | PARTIAL — Patch `{amountDue, notes}`, tanpa gate periode | PARTIAL — ada `deletedAt` di schema, tapi tak ada service delete |
| `Payment` | PARTIAL — `create` benar + double-entry | PARTIAL | MISSING — tak ada Patch | PARTIAL — `deletedAt` ada, tak ada service |
| `SalesOrder` (commercial) | PARTIAL | PARTIAL | PARTIAL — `update`/`requestAmendment`/`approveAmendment`/`setDeliveryGate` | MISSING |
| `SalesDownPayment` (commercial) | PARTIAL | PARTIAL | MISSING | MISSING |
| `RetentionEngine` | MISSING — read-only radar | WORKS — `@Get('radar')` | MISSING | MISSING |

**Temuan penting soal Invoice vs SalesInvoice:** keduanya **dua entitas berbeda**, bukan satu dengan dua nama.
- `Invoice` → tabel `unified_invoices` (`finance.prisma`), dilayani `commercial/services/invoices.service.ts`, category RECEIVABLE **dan** PAYABLE, relasi ke `SalesOrder`/`PurchaseOrder`/`Supplier`/`WorkOrder`/`DeliveryOrder`.
- `SalesInvoice` → tabel `sales_invoices` (`finance.prisma`), dilayani `finance/sales-invoices/sales-invoices.service.ts`, relasi ke `Customer`, punya `lineItems` dan `postedAt`.

Keduanya punya `invoiceNumber @unique` sendiri dan masing-masing membuat jurnal. FE memanggil keduanya: `/finance/invoices` dan `/commercial/invoices`.

---

## 2. Temuan, dari yang paling sever

### P0-1 — `FinancialPeriod` tidak pernah ditulis: gate periode pada jurnal & kas adalah kode mati

`createJournalEntry` menolak transaksi bila ada `FinancialPeriod` berstatus `SOFT_LOCKED`/`CLOSED` (`backend/src/modules/finance/services/finance-journal.service.ts:120-132`), sama di `reverseJournalEntry` (`:238-249`) dan `cash.service.ts:25-37, 145-157`.

Perintah:
```
grep -rn "financialPeriod\.\(create\|update\|upsert\|createMany\|updateMany\)" backend/src
```
**Hasil: 0 baris.** Tidak ada satu pun penulis `financial_periods` di seluruh backend. Tabel itu tidak pernah terisi, jadi `findFirst` selalu `null` dan gate tidak pernah menolak apa pun.

Dampaknya langsung: **menutup periode tidak menghentikan pembukuan sama sekali.** Yang dikunci UI `/finance/periods` menulis ke tabel `period_locks` — tabel yang tidak dibaca oleh gate jurnal.

---

### P0-2 — Dua sistem penguncian periode yang tidak saling terhubung

`PeriodLock` dibaca `FinanceGateHelper.assertPeriodOpen` (`backend/src/common/helpers/gate.helper.ts:22-30`).
`FinancialPeriod` dibaca `finance-journal.service.ts:120` dan `cash.service.ts:25`.

Pemanggil `assertPeriodOpen` di seluruh backend — hanya 5, semuanya di finance:

| Lokasi | Label | Data yang di-gate |
|---|---|---|
| `ar-receipts.service.ts:76` | `AR-RECEIPT` | `new Date()` — hari ini, bukan `receiptDate` |
| `bank-reconciliations.service.ts:145` | `BANK-RECON-FINALIZE` | `recon.periodEnd` ✅ |
| `bills.service.ts:132` | `BILL-POST` | `new Date()` |
| `down-payments.service.ts:97` | `DP-POST` | `new Date()` |
| `sales-invoices.service.ts:124` | `SALES-INVOICE-POST` | `new Date()` |

Tiga dari lima mengoper `new Date()` alih-alih tanggal dokumen. Efeknya: faktur bertanggal 2026-01 dibuat/diposting pada 2026-02 akan lolos gate walau Januari sudah `period_locks` terkunci — gate memeriksa Februari.

`assertPeriodNotLocked` (`period-locks.service.ts:41`) **tidak punya pemanggil mana pun** di backend.

---

### P0-3 — `SalesInvoice.post()` membuat jurnal tidak balance dan membuang pajak

`backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:138-163`:
- Baris 152: `debit: Number(inv.totalAmount)`
- Baris 158: `credit: Number(inv.subtotal)`
- `taxAmount` tidak dikreditkan ke akun pajak mana pun.

Untuk faktur ber-pajak, `debit − credit = taxAmount` persis. Klaim "ada `assertPeriodOpen` tapi tidak ada cek debit=kredit" **terverifikasi**: tidak ada `JOURNAL_UNBALANCED` di file ini (berbeda dengan `finance-journal.service.ts:137-141` yang punya).

Ditambah dua cacat di blok yang sama:
- Baris 141 `if (arAcc && revAcc)` — kalau salah satu akun 1201/4001 tidak ada, jurnal **diam-diam tidak dibuat**, tapi `postedAt` tetap di-set (`:133`) dan transaksi dianggap sukses. Faktur terkunci sebagai posted tanpa jejak akuntansi.
- Baris 147 `sourceDocumentType: 'SALES_ORDER' as any` — faktur penjualan diberi tipe dokumen penjualan order.

---

### P0-4 — `createJournalEntry` menambahkan baris pajak *setelah* cek balance

`backend/src/modules/finance/services/finance-journal.service.ts:134-141` memvalidasi `totalDebit === totalCredit` dari `dto.lines`. Lalu `:196-204`—when `l.taxRate > 0 && l.taxAccountId`—menambah **baris baru**:

```ts
const taxAmount = (l.debit || l.credit) * (l.taxRate / 100);
lines.push({ accountId: l.taxAccountId, debit: l.debit > 0 ? taxAmount : 0, credit: l.credit > 0 ? taxAmount : 0 });
```

Baris pajak hanya ada di sisi yang sama. Jurnal yang tervalidasi seimbang sebelum transformasi menjadi tidak seimbang setelah disimpan. Tidak ada validasi ulang setelah `flatMap`.

---

### P0-5 — Jurnal penyesuaian rekonsiliasi bank dikirim dengan payload yang pasti ditolak 400

`frontend/src/app/(dashboard)/finance/bank-reconciliation/_hooks/useBankReconciliationOperations.ts:238-251`:

```ts
await api.post("/finance/journals", {
  journalNumber: `ADJ-RECON-${Date.now()...}`,
  transactionDate: new Date().toISOString(),
  sourceDocument: `RECON-${...}`,
  items: [{ accountId: ..., description: ..., debit: 0, credit: 0 }]
});
```

`CreateJournalDto` (`backend/src/modules/finance/dto/create-journal.dto.ts:40-75`) hanya menerima `date`, `reference`, `description`, `attachmentUrls`, `sourceDocumentType`, `sourceDocumentId`, `lines`. Dan `main.ts:56` menyetel `forbidNonWhitelisted: true`.

Empat field asing (`journalNumber`, `transactionDate`, `sourceDocument`, `items`) plus `debit: 0, credit: 0` pada satu-satunya baris. Handler menolak dengan 400. `onSuccess` (`:253`) tidak pernah berjalan; tidak ada `onError` yang menandai status gagal di luar toast.

Ini satu-satunya mekanisme jurnal penyesuaian bank, dan `difference` yang dihitung `bank-reconciliations.service.ts:105` tidak pernah masuk GL.

---

### P0-6 — `depreciation-schedules.postJournal` tidak idempoten dan bisa dobel-post

`backend/src/modules/finance/depreciation-schedules/depreciation-schedules.service.ts:118-151`. Model `DepreciationSchedule` (`finance-extension.prisma`) **tidak punya** `postedAt`, `journalEntryId`, maupun penandaAPUNAK sudah diposting:

```
model DepreciationSchedule {
  id assetId period amount accumulated notes asset
  @@unique([assetId, period])
}
```

`generate()` (`:101-104`) memang `skipDuplicates: true` sehingga jadwalnya unik. Tapi `postJournal` hanya `findUnique` lalu `journalEntry.create` — tanpa cek apakah entri ini sudah punya jurnal. Memanggil `POST .../post` dua kali pada `id` yang sama membuat **dua jurnal dengan `reference` identik** `DEP-{assetNumber}-{YYYY-MM}` (`:141`). Akuntansi penyusutan dobel.

---

### P0-7 — `BankTransaction.create` tidak pernah menulis baris

Census pada `backend/src/modules/finance/bank-transactions/bank-transactions.service.ts`:
```
prisma.bankTransaction.findMany, findUnique, update
```
Tidak ada `bankTransaction.create` / `createMany`. Method `create` ada di controller (`G3/P3`), tetapi service hanya membaca. Rekonsiliasi bank dijalankan di atas tabel yang tidak bisa diisi lewat API ini.

---

### P0-8 — `ClientEscrow` tidak punya create; `deposit` hanya `update`


Census `backend/src/modules/finance/client-escrows/client-escrows.service.ts`:
```
prisma: clientEscrow.findMany, findUnique, customer.findUnique, clientEscrow.update
```
Tidak ada `clientEscrow.create`. Method `deposit`/`release` memanggil `update`. Entitas escrow tidak dapat dibuka lewat API mana pun; FE `/finance/client-escrow` hanya `GET /finance/client-escrows` — read-only terhadap tabel yang tak bisa diisi.

---

### P1-9 — `Account` bisa diedit/dinonaktifkan meski sudah punya journal line

`backend/src/modules/finance/services/finance-journal.service.ts`:
- `updateAccount` (`:643-670`) — cek duplikasi `code`, lalu `account.update` mentah. Tidak memeriksa `account.journalLines`. Mengubah `code`/`type`/`normalBalance` pada akun yang sudah jadi post akan menulis ulang sejarah pembukuan.
- `softDeleteAccount` (`:672-679`) — `update({ isActive: false })` tanpa cek pemakaian. Menonaktifkan akun 1201 (Piutang) membuat seluruh trial balance kehilangan baris piutang tanpa satu pun jejak.

Ini menjawab pertanyaan "2 update apa itu": keduanya `updateAccount` (PATCH, sinkronisasi `finance.service.ts:75`) dan `softDeleteAccount` (DELETE, `finance.service.ts:79`).

---

### P1-10 — 24 dari 24 drawer/detail component di scope tidak mengambil data sendiri

Perintah:
```
find frontend/src/app/\(dashboard\)/{finance,penjualan} -name '*Drawer*.tsx' -o -name '*Detail*.tsx'
  | xargs grep -cE 'useQuery|useSWR|api\.(get|post)|fetch\(|axios|useMutation'
```
**Hasil: 24 file, 0 yang punya fetch. 24/24 nol.**

Semuanya menerima objek dari list-query sebagai prop. Untuk entity tanpa `include` relasi, detail yang tampil adalah data yang sudah dipotong oleh query list — bukan data record.

Yang **aman** (bukan temuan): `JurnalUmumDetailDrawer.tsx:51` merender `selectedJournal?.lines`, dan list `/finance/journals` memang mengirim `include: { lines: { include: { account: true } } }` (`finance-journal.service.ts:277-282`). Jurnal umum tidak masuk hitungan ini karena loader-nya benar.

Yang **bermasalah**: `InvoiceDetailDrawer` (`penjualan/faktur-penjualan`) — invoice punya `lineItems` di `SalesInvoice` tapi endpoint `commercial/invoices` `findAll` (`invoices.service.ts:98-119`) hanya `include: { so: {...}, payments: true }`, tanpa `lineItems`. Detail faktur tidak pernah menampilkan rincian item.

---

### P1-11 — Validasi form: nol react-hook-form, nol zod di seluruh 152 route

Census pada 152 route/file di `finance/` dan `penjualan/` untuk `react-hook-form|zodResolver|useForm(`: **0 file.** Semua form create adalah `useState` + `if`, tanpa skema.

Konsekuensi yang terverifikasi: `useCashInOperations.ts:280-287` mengirim `accountId: cashAcc?.id || "default-cash"` dan `"default-rev"` — UUID fallback yang pasti gagal FK, dan branch `else` (`/finance/cash/receive` gagal) justru menulis jurnal lewat `/finance/journals` tanpa `attachmentUrls`, padahal `createJournalEntry` mewajibkan attach untuk akun berawalan 6/12/15 (`finance-journal.service.ts:170-177`).

---

### P1-12 — Nomor dokumen dicetak di sisi client di 10 titik

Perintah: regex `/`[^`]*\$\{[^}]*Date\.now\(\)[^}]*\}[^`]*`/` atas seluruh `.ts`/`.tsx` di `finance/` + `penjualan/`.
**Hasil: 10.** Laporan sebelumnya menyebut 7; ada 3 tambahan di luar finance.

| # | Lokasi | Pola |
|---|---|---|
| 1 | `finance/bank-reconciliation/_hooks/useBankReconciliationOperations.ts:239` | `ADJ-RECON-${Date.now().toString().slice(-6)}` |
| 2 | `finance/cash-in/_hooks/useCashInOperations.ts:276` | `KM-${Date.now().toString().slice(-6)}` |
| 3 | `finance/cash-out/_hooks/useCashOutOperations.ts:278` | `KK-${Date.now().toString().slice(-6)}` |
| 4 | `finance/cogs-request/page.tsx:92` | `JO-${year}-${String(Date.now()).slice(-4)}` |
| 5 | `finance/cogs-request/_hooks/useCogsRequestOperations.ts:59` | idem |
| 6 | `finance/cogs-request-rnd/page.tsx:163` | idem |
| 7 | `finance/cogs-request-rnd/_hooks/useCogsRequestRndOperations.ts:109` | idem |
| 8 | `penjualan/client-manager/_components/ClientSampleActivitySection.tsx:234` | `AMI-JULI-${Date.now()}` |
| 9 | `penjualan/delivery-orders/page.tsx:146` | `DO-2026-${Date.now().toString().slice(-4)}` |
| 10 | `penjualan/sales-target/page.tsx:354` | `st-${Date.now()}` |

Plus 1 di backend: `ARReceipt` (`ar-receipts.service.ts:95-98`) menghitung nomor `RECV-{yymm}-{count+1}` dari `count()` di luar transaksi — dua receipt bersamaan menghasilkan nomor kembar.

`IdGeneratorService` (`backend/src/modules/system/id-generator.service.ts`) berbasis `systemSequence.upsert` dalam transaksi, benar dan race-safe. Census pengguna: **36 file**, tersebar di 12 modul. Di dalam batch ini dipakai oleh `finance/cash.service.ts:58` (`generateId('KLR')`) dan `finance-journal.service.ts:182` (`generateId('JRN')` fallback). Selain kedua file itu, **0 pemanggil** di 28 submodul finance lain. FE tidak pernah memanggilnya (2 referensi di `frontend/src` hanya teks UI "dibuat otomatis oleh server" di `pembelian/scm-pembelian/create`).

---

### P1-13 — `Invoice.invoiceNumber` diisi dari `dto.id` milik client

`backend/src/modules/commercial/services/invoices.service.ts:77`:
```ts
invoiceNumber: dto.id,
```
Kolom `invoiceNumber` @unique diisi UUID milik caller, bukan nomor dokumen. Aturan penomoran (prefix/tahun/urut) tidak berlaku; nomor faktur tidak terbaca sebagai dokumen bisnis.

---

### P1-14 — SoD bank reconciliation adalah guard mati

`bank-reconciliations.service.ts:136-142` membaca pembuka dari `notes`:
```ts
const openerMatch = recon.notes?.match(/\[opened by ([^\]]+)\]/);
```
 suitablykan `create` (`:58-118`) tidak pernah menulis penanda `[opened by ...]` ke `notes` — ia menerima `dto.notes` apa adanya (`:116`). `openedBy` selalu `null`, cabang `SoDViolationException` tidak pernah tereksekusi.

Yang ironisnya, `PeriodStatus` gate di `finalize` (`:145`) bekerja benar.

---

### P1-15 — `reopen` rekonsiliasi tidak dibatasi periode, dan menimpa rekonsiliasi lain

`bank-reconciliations.service.ts:202-212` melakukan `updateMany` pada seluruh transaksi di rentang `periodStart..periodEnd` **tanpa filter `reconciledBy` atau `reconciledAt`**. Bila ada dua sesi rekonsiliasi yang tumpang tindih pada `bankAccountId` yang sama, `reopen` satu sesi menandai ulang `reconciled: false` transaksi yang mungkin sudah direkonsiliasi di sesi lain. Sesi yang sudah `RECONCILED` tetap berstatus reconciled sementara transaksinya tidak.

---

### P1-16 — Tidak ada optimistic concurrency di mana pun pada baris pembawa saldo

```
grep -rnE 'If-Match|ifMatch|@Version|optimistic|updatedAt:\s*\{\s*(equals|lt|gt)' backend/src/modules/{finance,commercial}
```
**Hasil: 0 baris.** Tidak ada field `version` di model finance manapun, tidak ada `If-Match`, tidak ada perbandingan `updatedAt`.

Kasus paling berbahaya: `PaymentsService.create` (`commercial/services/payments.service.ts:21-35`) membaca `invoice.outstandingAmount` lalu menghitung `newOutstanding` di memori, baru `invoice.update` (`:55-60`). Dua pembayaran bersamaan untuk invoice yang sama sama-sama melihat `outstandingAmount` lama — pembayaran kedua menimpa hasil yang pertama, dan `Invoice.status` berakhir pada nilai yang dihitung dari snapshot basi. Tidak ada `updateMany` bersyarat, tidak ada row lock eksplisit.

---

### P1-17 — Pagination hampir tidak ada; semua `findAll` mengembalikan seluruh tabel

```
grep -rnE '\b(skip|take|cursor|perPage|pageSize|limit)\b\s*[:=]' ... (dekat findMany)
```
**4 hasil**, semuanya `take: limit` pada query "recent"/"top-N", bukan paginasi daftar. `SalesInvoicesService.findAll`, `BillsService.findAll`, `BillLineItemService.findAllByBill`, `ClientEscrowService.findAll`, `CostAllocationService.findAll`, dan seterusnya tidak punya `skip`/`take`/`cursor`.

Di sisi FE, dari 60 file page/hooks: **2** punya indikator paginasi, **26** punya pencarian. Jadi tabel membesar tanpa batas.

---

### P2-18 — `catch { return [] }` menutupi kegagalan pada 4 query FE

`finance/jurnal-umum/_hooks/useJurnalUmumOperations.ts:38-40` dan `:52-54`:
```ts
} catch {
  return [];
}
```
`accounts` dan `rawJournals` kembali array kosong diam-diam. Halaman menampilkan "tidak ada jurnal" — bukan error — saat backend mati, 500, atau token kedaluwarsa. Pola yang sama di `piutang`, `ar-hub`, `cogs-request`.

---

### P2-19 — 6 kode COA dirujuk tapi tidak pernah di-seed

Membaca seluruh `backend/prisma/**` (169 kode berbeda) lalu membandingkan dengan 35 kode yang di-hardcode di finance/commercial. **6 tidak ada di seed mana pun:** `1121`, `1151`, `1153`, `1154`, `2105`, `5001`.

Dampaknya terbatas: keenamnya muncul sebagai anggota kedua/ketiga dalam rantai `OR` (mis. `finance-cogs.service.ts:45, 48, 120, 123, 303`; `finance-journal.service.ts:346, 419, 452, 504, 507, 719`), dan kode primernya ada. Yang tersisa tetap bocor diam-diam lewat `if (acc && acc2)` yang tidak melempar — `finance-cogs.service.ts:51` dan `:126`, `finance-journal.service.ts:141`.

Kode yang крити: `1201`, `4001`, `1310`, `5210`, `2101`, `2301` semuanya **ada** di `seed-coa-v2.ts`.

---

### P2-20 — Halaman dengan nol panggilan API

80 dari 152 route/file yang di-census tidak punya satu pun `api.*`. Sebagian besar adalah `_components`/`_types` presentasional — itu wajar. Yang berulang:

**Halaman yang benar-benar tidak punya pemuatan data:**
- `penjualan/lost/**` — `page.tsx` 718L, `_hooks` 162L, `_components` 503L, **nol API**
- `penjualan/sample-sales/page.tsx` (100L) — loader ada di `_hooks` ( wired ke `/bussdev/samples`)
- `penjualan/pipeline/page.tsx` (11L) dan `retention-engine/page.tsx` (19L) — keduanya pure `router.replace` ke `/bussdev/*`
- `finance/laba-rugi/page.tsx`, `finance/ledger/page.tsx` — loader di `_hooks` (aman)
- `finance/fund-requests/page.tsx` (129L) — loader di `_hooks` (aman)

**Halaman tanpa service pendukung:** `penjualan/retention-engine` redirect, tapi `RetentionController` (`commercial/controllers/retention.controller.ts`) adalah satu-satunya consumer `RetentionEngine` dan read-only.

---

### P2-21 — Tidak ada filter periode pada query laporan

`finance.service.ts:356-431` — `getProfitLoss`, `getBalanceSheet`, `getTrialBalance`, `getDetailedTrialBalance`, `getGeneralLedger`, `getCashFlow`, `getArAging`, `getApAging`, `getBudgetVsActual` semuanya menerima `startDateOrQuery?: any`. Galois. Says "Lebar".

---

### P2-22 — Audit trail hanya lewat interceptor, tanpa eksplisit

Tidak ada satu pun file di `backend/src/modules/finance/**` atau `commercial/**` yang memanggil `AuditService` (census: 0 file). Audit Passive dari `AuditLogInterceptor` (`backend/src/platform/audit/audit.interceptor.ts:117`) menutup semua request mutating, jadi jejak tetap ada — tapi `entityType` diambil dari nama class controller (`context.getClass()?.name?.replace(/Controller$/i,'')`), sehingga `finance/taxes/:id` dan `finance/currencies/:id` sama-sama menjadi `Finance`. `entityId` juga bergantung pada `pickEntityId(req, response)`.

Konsekuensi untuk `softDeleteAccount` (P1-9): audit mencatat `DELETE finance/:id` yang terjadi, tetapi tidak mencatat akun mana yang dinonaktifkan atau berapa journal line yang bergantung padanya.

---

## 3. Klaim yang diverifikasi / dibantah

| Klaim | Status | Bukti |
|---|---|---|
| `sales-invoices.controller.ts:43` punya bare `@Post()` melanggar DEC-016 | **BENAR** | `sales-invoices.controller.ts:43-50` — `@Post()` tanpa prefix, dan `create()` memang mandiri |
| `sales-invoices.service.ts:124` tidak punya cek debit=kredit | **BENAR** | `sales-invoices.service.ts:129-163` — 2 baris, `debit: totalAmount` vs `credit: subtotal` |
| Cash-in/out/bank-recon/cogs/cogs-rnd masing-masing punya skema nomor sendiri | **BENAR, tapi 7 bukan 4** | Lihat P1-12; 5 dari 7 sudah tercatat, total sebenarnya 10 |
| Drawer repo-wide nol fetch | **BENAR di scope ini** | 24/24 nol di finance+penjualan |
| `Currency` 29 halaman FE, 0 service call | **SALAH** | `finance/currencies/page.tsx:63,73,84` memanggil `POST /finance/currencies`, `PATCH`, `DELETE`, `PUT /:id/exchange-rate`; dilayani `finance.controller.ts:385-414` |
| Jurnal Umum FE terputus dari backend (GAP-01) | **SUDAH DIPERBAIKI** | `useJurnalUmumOperations.ts:45-56` `useQuery` → `GET /finance/journals`; `POST /finance/journals` di `:274`. Dokumen gap usang |
| 80 route tanpa API call berarti 80 halaman rusak | **SALAH** | 80 termasuk `_components`/`_types` presentasional. Halaman rusak nyata: 1 (`penjualan/lost`) |
| 2 update pada `Account` | **BENAR** | `finance-journal.service.ts:643` (update) dan `:672` (softDelete) |

---

## 4. Klaim yang tidak bisa diverifikasi, dan alasannya

1. **`FinancialSummaryLedger`** — model ada di `finance.prisma`, tapi nol service/controller/yield FE yang menyentuhnya. Saya tidak menjalankan `prisma migrate` atau query DB, jadi tidak bisa memastikan apakah ia tabel mati yang di-populate via SQL mentah di luar repo.
2. **`StockAdjustment` / `StockAdjustmentItem`** — model ada di `finance.prisma` tetapi tidak ada direktori `finance/stock-adjustments/`. Service-nya mungkin di `warehouse/`. Di luar scope batch C, jadi ditandai UNVERIFIED, bukan MISSING.
3. **`BillAllocation`** — hanya dibuat lewat `ap-payments.service.ts` (`billAllocation.create`). Tidak ada controller sendiri, jadi kapabilitas Update/Delete tidak bisa dibedakan "tidak ada" dari "tidak diekspos".
4. **Idempotensi `ClosingChecklist.generateMonthlyChecklist`** — `closing-checklists.service.ts:46-160` tidak saya baca baris per baris; `upsert`/`skipDuplicates` usage tidak terverifikasi.
5. **Golden COA di DB berjalan** — saya hanya membaca file seed. Code `1201`/`4001` diasumsikan ada di DB produksi berdasarkan `seed-coa-v2.ts`; tanpa akses DB, itu asumsi.
6. **Perilaku runtime `forbidNonWhitelisted` pada payload bank-recon** — P0-5 menyimpulkan dari DTO + konfigurasi `main.ts:53-56`. Belum ada request HTTP nyata yang mengonfirmasi 400.
7. **Apakah `post()` SalesInvoice benar-benar tidak balance di produksi** — `taxAmount` default 0 di `SalesInvoice` (`finance.prisma`), jadi untuk faktur tanpa pajak Defisitnya 0 dan jurnal kebetulan seimbang. Kerusakan muncul hanya ketika `taxAmount > 0`. Tidak bisa memastikan berapa persen faktur produksi yangaffected tanpa data.
8. **`getProfitLoss` dan laporan lain** — signature `(startDateOrQuery?: any, endDate?: any)`; implementasi tidak dibaca. Apakah filter tanggal benar-benar diterapkan belum dipastikan.
9. **`product-profitabilities.upsert` sebagai "Create"** —-upsert memerlukan `productId` yang sudah ada; apakah FE membuatnya dari `cogs-requests` atau standalone belum diperiksa.
10. **Skema migrasi aktual** — `migrate_diff` dan status DB tidak dijalankan. Semua temuan "tidak ada writer" berbasis grep atas source, bukan atas state database.

---

## 5. Angka akhir

Census yang dijalankan (semua atas working tree `b561dffe`):

```
33 controller di finance+commercial; 8 punya Update (Patch/Put), 4 punya Delete
152 route/file FE di finance+penjualan; 80 tanpa api.* call
24 drawer/detail component; 0 dengan fetch sendiri
10 titik minting nomor dokumen di FE; 1 lagi di BE (ARReceipt count+1)
0 file finance/commercial memanggil AuditService
0 match untuk If-Match|@Version|updatedAt-compare
35 kode COA hardcoded; 6 tidak ada di seed mana pun
41 model Prisma di finance.prisma + finance-extension.prisma
```
