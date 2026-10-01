# Temuan Lintas-Modul — hasil verifikasi ulang

**Tanggal:** 2026-10-01
**Asal:** 4 dari 6 batch (A, C, E, F) sudah lapor; temuan di sini diverifikasi ulang langsung terhadap source, bukan diteruskan dari laporan agent.
**Status:** keenam batch sudah lapor. Verifikasi ulang di bawah dilakukan langsung terhadap source; temuan yang tidak saya cek sendiri ditandai begitu.

---

## 0. P0 — 63 dari 107 file `_hooks/` tidak punya importer sama sekali

Ini membatalkan sebagian hitungan di dokumen lain, termasuk hitungan penomoran di dokumen utama, jadi ditulis paling atas.

Standar CLAUDE.md mewajibkan Tri-Layer Colocation: `_components/`, `_hooks/`, `_types/`, lalu `page.tsx` tipis. Konvensinya diterapkan. **Isinya tidak.**

| | |
|:---|--:|
| File `_hooks/` di `frontend/src` | 107 |
| Yang punya minimal satu importer | 44 |
| **Yang nol importer** | **63** |

Logika domain ditulis dua kali: sekali di `_hooks/` yang tidak pernah diimpor, dan sekali inline di `page.tsx` yang jalan. **Keduanya tidak sama.** Contoh terverifikasi: `master/goods/_hooks/useGoodsOperations.ts` mengarang `BRG-${Date.now().slice(-4)}`, sedangkan `master/goods/page.tsx:491` yang benar-benar jalan mengarang `BBK${String(goodsList.length + 1).padStart(5,"0")}`.

Dua akibat langsung:

1. **Hitungan mana pun di `_hooks/` tidak menggambarkan perilaku aplikasi.** Nomor penomoran 43 di dokumen utama tercampur file mati dan file hidup; angka hidup lebih kecil.
2. **Perangkap untuk setiap audit berikutnya dan setiap developer.** Dua salinan logika yang berbeda, tanpa penanda mana yang benar.

Yang terverifikasi mismatch, selain master data:

- `useWarehouseOperations.ts:358` memakai `PUT`, halaman yang jalan memakai `PATCH` — jadi request ke endpoint yang salah
- `useQualityChecklistTrackingOperations.ts:25` menunjuk endpoint yang sama sekali berbeda

Daftar 63 file ada di laporan Batch D. Hapus atau hubungkan — pilihan mana pun lebih baik dari sekarang, karena sekarang ada dua sumber kebenaran dan yang menang ditentukan oleh siapa yang lupa mengimpor.

---

---

## Ringkasan

Empat dari enam batch melaporkan pola yang sama berulang: **sistem punya sebuah pemeriksaan yang ditulis dengan benar, dan hampir tidak ada yang memanggilnya.** Delete kosong, gate mati, jalur yang benar sudah ada tapi dilewati.

Temuan di dokumen ini lebih luas daripada P0 per-batch, karena dua di antaranya terverifikasi langsung dan mengubah prioritas.

---

## 1. P0 — 18 dari 19 jalur tulis jurnal melewati seluruh validasi

Ini temuan terbesar, dan menjelaskan sebagian besar P0 Batch C sebagai gejala, bukan kasus terpisah.

`finance-journal.service.ts:117 createJournalEntry` adalah satu-satunya jalur yang membawa:

- cek balance (`:134-141`)
- gate periode (`:120-128`)
- validasi control account (`:143-148`)
- pemecahan pajak (`:196-204`)

**-file service lain memanggil `journalEntry.create` langsung** dan поэтому tidak membawa satu pun dari empat hal di atas:

| Modul | File |
|:---|:---|
| bussdev | `returns/returns.service.ts` |
| commercial | `services/payments.service.ts` |
| document-automation | `document-automation.service.ts` |
| finance | `ap-payments`, `ar-receipts`, `bills`, `cash`, `client-escrows`, `depreciation-schedules`, `down-payments`, `journal-engine`, `sales-invoices`, `finance-cogs`, `finance-fund-request`, `finance-invoice` |
| master | `import-export.service.ts` |
| prisma | `prisma.service.ts` |

Dari 18 itu, beberapa juga memanggil gate periode yang berfungsi (`ap-payments`, `ar-receipts`, `bills`, `down-payments`, `sales-invoices`) — jadi jalur yang **sudah** memeriksa apakah periode terkunci tetap menulis jurnal tanpa cek balance.

**Artinya: cek balance itu benar ada, dan berlaku pada kurang dari satu dari sembilan belas jalur yang butuh.** Jurnal tidak seimbang bukan bug di satu tempat; itu sifat default sistem.

### Bukti langsung

`sales-invoices/sales-invoices.service.ts:141-163` — jalur yang dilaporkan Batch C, sekarang jelas sebagai salah satu instans:

```
Dr AR (1201)      = inv.totalAmount
Cr Revenue (4001) = inv.subtotal
selisih            = inv.taxAmount
```

Jalur ini memanggil `tx.journalEntry.create` langsung, jadi `finance-journal.service.ts:137` tidak pernah berjalan untuknya. Selisih pajak hilang tanpa satu pun error.

Lebih buruk, `if (arAcc && revAcc)` di `:141`: kalau salah satu akun tidak ada, blok jurnal **dilewati diam-diam** sementara `postedAt` di `:130` tetap ter-set dalam transaksi yang sama. Invoice bertanda posted tanpa jurnal sama sekali.

Dan `sourceDocumentType: 'SALES_ORDER'` di `:147` untuk invoice penjualan — tipe referensi yang salah.

---

## 2. P0 — gate periode punya dua sistem yang tidak pernah bertemu

| Sistem | Tabel | Ditulis? | Dipakai siapa |
|:---|:---|:-:|:---|
| `FinanceGateHelper.assertPeriodOpen` | `PeriodLock` | ya | 6 service lewat `assertCanPost` |
| `finance-journal.service.ts:120` | `FinancialPeriod` | **tidak pernah** | hanya `createJournalEntry` |

`FinancialPeriod` punya **0 call site tulis** di seluruh backend, tapi **5 call site baca** (`executive`, `cash`, `finance-journal`, `hr-payroll`, `hr-performance`).

Jadi gate palingunik di sistem — yang ada di dalam service yang membuat jurnal — adalah yang mati. Yang hidup adalah helper, dan hanya 6 service yang memakainya. Modul lain yang membuat jurnal tidak punya gate periode sama sekali.

Menutup periode dengan `PeriodLock` menghentikan 6 jalur. Tidak menghentikan jalur lain.

---

## 3. P0 — cek balance dilewati, lalu pajak ditambahkan setelahnya

`finance-journal.service.ts`:

- `:137` cek balance atas `dto.lines`
- `:197-204` kalau sebuah baris punya `taxRate > 0` dan `taxAccountId`, service **menambah baris baru** ke array `lines` dan menuliskan itu ke database

Baris pajak ditambahkan **setelah**balance check selesai. Masukan yang seimbang menghasilkan keluaran yang tidak seimbang. Tidak ada cek kedua.

### Dan satuan taxRate tidak konsisten antar modul

| Lokasi | Rumus | Satuan |
|:---|:---|:---|
| `finance-journal.service.ts:198` | `x * (taxRate / 100)` | persen (0–100) |
| `tax-transactions.service.ts:83` | `base * taxRate / 100` | persen, divalidasi 0–100 di `:72` |
| `pdf-engine.service.ts:68` | `subtotal * (taxRate / 100)` | persen |
| **`create-journal.dto.ts:28`** | `@ApiProperty({ example: 0.1, description: 'Tax rate (0.1 = 10%)' })` | **pecahan** |

Tiga implementasi memakai persen. Dokumentasi DTO — satu-satunya tempat developer|authoritative melihat — mengatakan pecahan. Siapa pun yang mengikuti dokumentasi itu mengirim `0.1`, dan `0.1 / 100 = 0.001` menghasilkan pajak **seratus kali terlalu kecil**, tanpa error.

---

## 4. P0 — Currency: UI CRUD lengkap, backend nol

Ini koreksi terhadap klaim saya sendiri di matriks dan koreksi sebagian terhadap Batch C.

Batch C benar bahwa `finance/currencies/page.tsx` melakukan CRUD lengkap. Batch C belum tahu bahwa **tidak ada backend-nya sama sekali.**

| Fakta | Nilai |
|:---|--:|
| Model Prisma `Currency` | ada, `finance.prisma`, dipetakan ke `master_currencies` |
| Relasi masuk | `PurchaseOrder[]`, `SalesOrder[]` |
| Controller yang melayani `/finance/currencies` | **0** |
| Baris di `page.tsx` | 331 |

UI itu memanggil lima endpoint: `GET`, `POST`, `PATCH :id`, `DELETE :id`, `PUT :id/exchange-rate`. Kelimanya 404.

Konsekuensi kedua lebih serius daripada UI mati: `master_currencies` adalah target foreign key untuk `PurchaseOrder` dan `SalesOrder`, dan **tidak ada jalur yang bisa mengisinya**. Setiap SO dan PO yang butuh currency bergantung pada baris yang hanya bisa dibuat di luar aplikasi.

Angka matriks saya (`Currency` Pg 29, Dr 11) adalah artefak scan nama longgar. Hanya ada 1 file currency di FE. Polanya sama seperti baris `Approval` yang juga saya koreksi.

---

## 5. P0 — jurnal hasil rekonsiliasi bank pasti 400

Diberi sebagai "belum terverifikasi" oleh Batch C. Sekarang terverifikasi dari sisi server.

FE `useBankReconciliationOperations.ts:238-251` mengirim:

```js
{ journalNumber, transactionDate, description, sourceDocument, items: [{accountId, description, debit: 0, credit: 0}] }
```

Server: `journals.controller.ts:49-53` menerima `CreateAdjustmentJournalDto`, dan `main.ts:53-56` memasang `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.

Tiga field pertama tidak ada di DTO mana pun di modul journal, dan `items` bukan `lines`. Dengan `forbidNonWhitelisted`, request ditolak 400 sebelum controller melihatnya.

Dua masalah lain di payload yang sama, yang akan muncul kalau nama field diperbaiki:

- `accountId: selectedAccount?.glAccountId || "6190"` — `6190` adalah **kode akun**, sedangkan `accountId` berisi UUID
- `debit: 0, credit: 0` — kalau lolos, balance check lolos, dan jurnal bernilai nol tersimpan

Jalur ini adalah satu-satunya cara membuat jurnal penyesuaian rekonsiliasi bank, jadi fitur itu tidak pernah berhasil dipakai.

---

## 6. P0 — otorisasi: 188 endpoint tanpa `@Roles`

Diberi Batch E sebagai 31 endpoint di 3 controller. Angka sebenarnya jauh lebih luas — dihitung ulang di seluruh backend:

| | |
|:---|--:|
| Controller dengan nol `@Roles` | 24 dari 113 |
| **Endpoint di dalam controller itu** | **188 dari 947** |

| Controller | Endpoint tanpa guard |
|:---|--:|
| `production/production.controller.ts` | **57** |
| `communication/entity-communication.controller.ts` | 12 |
| `master/controllers/materials.controller.ts` | 12 |
| `master/controllers/sales-targets.controller.ts` | 11 |
| `notification/notification.controller.ts` | 10 |
| `master/controllers/customers.controller.ts` | 9 |
| `wa-self-qr/wa-self-qr.controller.ts` | 9 |
| `master/controllers/suppliers.controller.ts` | 8 |
| `master/controllers/system-config.controller.ts` | 8 |
| `master/controllers/categories.controller.ts` | 7 |

`production.controller.ts` sendiri adalah yang terbesar di backend dan tidak punya satu pun `@Roles`. Master data — customers, suppliers, materials, categories, system-config — seluruhnya terbuka untuk setiap user yang lolos autentikasi.

---

## 7. P0 — nomor supplier tidak pernah ada

Ini membatalkan kalimat di dokumen audit utama yang menyebut `@unique` berlaku untuk `Supplier`. Tidak berlaku — kolomnya tidak ada.

| Model | Kolom kode |
|:---|:---|
| `Customer` | `code String @unique` ✅ |
| `Supplier` | **tidak ada kolom `code` sama sekali** |

Scalar `Supplier` di `warehouse.prisma`: `id, name, contact, phone, email, isBlacklisted, address, province, city, district, addressDetail, termOfPayment, tax, description, categoryId, performanceScore, deletedAt, createdAt`.

`suppliers/page.tsx:405` mengarang `VND-BBK-${String(suppliersList.length + 1).padStart(3,"0")}`, lalu `suppliers.service.ts:104-120` membangun `data` tanpa `code` — nomor itu dibuang.

Akibatnya bukan sekadar nomor tidak stabil: **nomor supplier tidak pernah tersimpan.** Tidak ada yang bisa bentrok, tidak ada yang bisa dirujuk, dan tidak ada nomor untuk dicetak di dokumen pembelian. Mitigasi P2002 yang saya sebut di dokumen audit hanya berlaku untuk model yang benar-benar punya kolom.

---

## 8. P0 — `QCAudit` tidak bisa dikoreksi

`grep qcAudit\.(update|delete|updateMany|deleteMany|upsert)` di seluruh `backend/src` = **0 hit**. Controller modul QC: **0 `@Delete`**.

Audit QC yang salah ukur tidak bisa diperbaiki, dan `production-kpi.service.ts:277` memakainya sebagai bukti. Angka KPI produksi diturunkan dari catatan yang sekali tertulis tidak bisa ditarik kembali.

---

## 9. P1 — `LegalStatus` tidak punya keadaan dicabut

Enum `LegalStatus` tidak punya `EXPIRED` maupun `REVOKED`, dan `advance` hanya bergerak maju. Sertifikat halal yang dicabut tidak punya representasi di model — status terbaik yang bisa dicatat adalah masih berlaku.

Untuk domain yang kegunaan utamanya justru membuktikan kepatuhan, ini lubang representasi, bukan sekadar bug status.

---

## 10. P0 — 11 dari 13 perubahan `stockQty` tidak meninggalkan jejak

Diberi Batch B sebagai "4 dari 10 file". Dihitung ulang di seluruh backend, dan angkanya lebih luas.

Sistem punya `stock-ledger.service.ts` yang benar, dan `InventoryTransaction` adalah tabel gerakan. Tujuh file menulis ledger itu. Tapi hanya sebagian kecil perubahan stok yang lewat sana.

| | |
|:---|--:|
| Total call site backend yang menulis `stockQty` | 31 |
| Yang punya penulisan ledger dalam 25 baris ke dekatnya | 13 |
| Yang tidak | **18** |

Dibatasi ke `MaterialItem` saja — satu-satunya yang jadiattach master barang:

| File | Ledger? |
|:---|:---|
| `production/production-work-order.service.ts:124` | ✅ |
| `warehouse/services/warehouse-stock.service.ts:126` | ✅ |
| `scm/services/inbounds.service.ts:100` | ❌ |
| `scm/services/purchase-returns.service.ts:127` | ❌ |
| `scm/services/materials.service.ts:38` | ❌ |
| `scm/services/materials.service.ts:57` | ❌ |
| `production-planning/services/requisitions.service.ts:45` | ❌ |
| `production-planning/services/requisitions.service.ts:53` | ❌ |
| `production-planning/services/production-plans.service.ts:190` | ❌ |
| `master/services/materials.service.ts:273` | ❌ |
| `master/services/materials.service.ts:344` | ❌ |
| `master/services/import-export.service.ts:665` | ❌ |

**11 dari 13 perubahan kuantitas `MaterialItem` tidak menulis satu baris `InventoryTransaction`.** Stok berubah, tidak ada catatan movements. Kartu stok dan neraca persediaan tidak bisa_check karena tidak ada sumber untuk dibandingkan.

---

## 11. P0 — barang masuk bisa dibuat terhadap PO yang ditolak

`scm/services/inbounds.service.ts` mengimpor `POStatus` dan **tidak pernah memakai satu pun anggotanya**. Di 7 modul, `POStatus.(APPROVED|ORDERED|SENT)` = 0 hasil.

Gabungan dengan temuan DEC-016 (§1 dokumen utama): `scm/controllers/inbounds.controller.ts:22` punya `@Post()` mandiri, jadi GoodsReceipt bisa dibuat tanpa konteks PO sama sekali — dan kalau ada konteksnya, status PO tidak pernah diperiksa. Barang masuk terhadap PO `REJECTED` lolos.

Bonus dari Batch B, pola yang sama: `purchase-invoices.service.ts:149` punya gate 4-leg, tapi `if (po && po.items)` membuat seluruh gate dilewati begitu parent tidak ada — dan `inboundId?/grId?/poId?` semuanya opsional di `purchase-invoice.dto.ts:59-82`. **Faktur pembelian bisa terbit tanpa parent.**

---

## 12. P1 — approve tanpa isi

Dikonfirmasi ulang oleh Batch F: **0 dari 11 halaman approval memuat baris item** dari request yang diputuskan.

Ini bukan "drawer tidak bisa fetch" — daftar approval memang tidak mengambil detail, dan tidak ada lapisan yang mengambilnya setelahnya. Approver memutuskan approve/reject/tunda tanpa pernah melihat apa yang diputuskan.

---

## 7. Angka yang sudah dikoreksi

Empat angka yang pernah saya terbitkan terbukti salah. Semuanya karena scan nama longgar, semuanya ketahuan karena ada yang mengukur ulang.

| Klaim lama | Sebenarnya | Cara hitung yang benar |
|---|---|---|
| 98 file FE mengarang nomor | 43 situs di 29 file | irisan ketat `PREFIX-…${angka}`; angka 98 dan 131 keduanya terlalu longgar |
| 0 dari 78 drawer self-fetch | 1 dari 86 | `WoDetailDrawer.tsx` satu-satunya. `PostDrawer.tsx` cuma `api.post` untuk rewrite caption; subjeknya prop |
| 41 halaman approval | 11 | semuanya di `approvals/`; nama file longgar bikin 4x lipat |
| `Currency` Pg 29 / Dr 11 | 1 file FE | hanya ada `finance/currencies/page.tsx` |

Angka 110 controller di audit juga tertinggal — yang benar 113.

Pelajaran yang diambil sudah disimpan: hitungan yang bergantung pada regex pilihan bukan pengukuran sampai definisinya dikunci dan hasilnya bisa direproduksi. Lihat memory `loose-name-match-census-inflates-counts`.

---

## 14. Prioritas setelah penggabungan

Urutan ini menggantikan daftar P0 per-batch, karena beberapa item per-batch ternyata gejala dari satu akar yang lebih besar.

### Validasi yang ada tapi tidak dipanggil

1. **Satukan jalur tulis jurnal.** 18 service menulis langsung; 1 yang membawa validasi. Selama ini belum, balance check tidak akan pernah berlaku. Menghidupkan `createJournalEntry` saja tidak cukup — harus menggabungkan 18 pemanggil, atau memindahkan validasi ke level `prisma.service`.
2. **Paksa setiap perubahan stok lewat ledger.** 11 dari 13 perubahan `MaterialItem.stockQty` tidak menulis `InventoryTransaction`. centralized lewat `stock-ledger.service.ts` yang sudah ada.
3. **Putuskan periode mana yang benar** — `PeriodLock` atau `FinancialPeriod` — lalu hapus yang tidak dipakai. Tabel yang dibaca gate jurnal tidak pernah ditulis.
4. **Hidupkan `executeTransition`** — dikonfirmasi 3x (saya, A, F), nol call site produksi.
5. **Jadikan audit interceptor atomik** — `audit.interceptor.ts:181` memanggil di luar transaksi, jadi `AuditLog` bisa kosong saat mutasi sudah commit.

### Koreksi pembukuan

6. **Tutup `sales-invoices.service.ts:141`** — kalau akun 1201 atau 4001 hilang, jangan tetap set `postedAt`.
7. **Pindahkan cek balance ke setelah pemecahan pajak**, atau hitung pajak sebelum validasi.
8. **Selaraskan satuan `taxRate`.** DTO bilang pecahan, tiga implementasi bilang persen. Pilih satu.
9. **Perbaiki payload jurnal rekonsiliasi bank** — atau hapus tombolnya kalau memang tidak dipakai.

### Integritas data

10. **Tutup 3 endpoint create yang melanggar DEC-016** — `inbounds`, `purchase-invoices`, `sales-invoices`.
11. **Wajibkan parent.** `purchase-invoice.dto.ts:59-82` membuat semua parent opsional, dan `if (po && po.items)` di `purchase-invoices.service.ts:149` membuat gate 4-leg bisa dilewati.
12. **Periksa status PO sebelum barang masuk.** `inbounds.service.ts` mengimpor `POStatus` tanpa memakainya.
13. **Beri `QCAudit` jalur koreksi** — 0 update, 0 delete, padahal jadi bukti KPI produksi.
14. **Tambahkan `code` ke `Supplier`** atau hapus penomoran FE-nya. Sekarang `VND-BBK-001` dibuat lalu dibuang.
15. **Bangun atau hapus modul currency.** 331 baris UI, nol backend, dua FK jadi buntu.

### Otorisasi dan approval

16. **Pasang `@Roles` di 188 endpoint.** 24 controller tanpa satu pun guard; `production.controller.ts` menyumbang 57.
17. **`DEFER` jangan jadi `REJECTED`** — `decision.controller.ts:26-28`.
18. **Baca `rationale` di server, dan simpan.** Kolomnya belum ada.
19. **Muat baris item di 11 halaman approval** — 0 dari 11 sekarang.

### Kebersihan

20. **Putuskan 63 `_hooks/` yang mati** — hapus atau hubungkan. Sekarang ada dua salinan logika yang berbeda untuk tiap domain, dan yang menang ditentukan oleh siapa yang lupa mengimpor.
21. **Tutup bypass verifikasi webhook WA** — `if (process.env.WA_APP_SECRET)` dilewati kalau env kosong; secret hardcoded di `:17` dan `:51`.
22. **Bikin kontrak nomor dulu.** 0 controller mengekspos `IdGeneratorService`, jadi tidak ada jalur FE ke generator. Prioritas akhir, bukan 5 seperti sebelumnya — karena tanpa kontrak endpoint, pekerjaan nomor tidak bisa dimulai sama sekali.
23. **Tambahkan keadaan `EXPIRED` / `REVOKED` ke `LegalStatus`.**

