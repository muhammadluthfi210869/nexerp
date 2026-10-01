# F2-WAREHOUSE — Validasi CRUD Dinamis (API + DB)

Box: port **3213**, db **`audit_f2_warehouse`**. Tanggal 2026-10-01.
Ruang lingkup: 5 test yang ditugaskan orkes (bukan sweep CRUD penuh).
Semua data uji ber-prefix `AUDIT_F2_`.

---

## TEST 1 — Apakah on-hand = start + N − M?

**Verdict: LULUS pada jalur inbound → QC release → picking.** Tidak ada drift.

Rute yang dipakai: `POST /v1/warehouse/inbounds` → `POST /v1/warehouse/inbounds/:id/release`
→ `POST /v1/warehouse/picking/execute`.

| titik | nilai |
|---|---|
| **start** | **1000** |
| **after-in (N=120)** | **1120** |
| **after-out (M=45)** | **1075** |
| **expected (1000+120−45)** | **1075** |

- `material_items.stockQty` == expected: **YA**.
- Sum baris `inventory_transactions` (INBOUND 120, OUTBOUND 45 → NET 75) + start 1000 = 1075: **YA**.
- Sum `material_inventories.currentStock` = 75: **YA**, cocok dengan summary.

Status HTTP: create material 201, inbounds 201, release 201, picking/execute 201.

### [F2-WH-001] `POST /v1/warehouse/inbounds` tidak mengubah on-hand sama sekali
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:163-238`
               (createInbound) vs `:317-320` (releaseFromQuarantine)
- Bukti:       Setelah `POST /v1/warehouse/inbounds` dengan 120 KG, `material_items.stockQty`
               tetap **1000.00** (tidak berubah), `inventory_transactions` = 0 baris, dan satu
               `material_inventories` baris dibuat dengan `currentStock=120.00`,
               `qcStatus=QUARANTINE`. `stockQty` baru naik ke 1120 setelah dipanggil
               `POST /v1/warehouse/inbounds/:id/release`. `createInbound` tidak pernah menyentuh
               `materialItem.stockQty` maupun membuat `inventoryTransaction`.
- Repro:       `POST /v1/warehouse/inbounds {"items":[{"materialId":"<id>","quantity":120,"batchNumber":"B1","expiryDate":"2027-12-31"}]}` lalu
               `SELECT "stockQty" FROM material_items WHERE id='<id>'` → 1000 (tidak berubah).
- Dampak ke client: Petugas gudang yang menerima barang lalu langsung mencocokkan "stok sistem"
               akan melihat angka yang tidak bergerak although 120 unit sudah masuk gudang.
- Lapis:       API / DB

### [F2-WH-002] `POST /v1/warehouse/inbounds/:id/release` tidak menulis `material_valuations`
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:281-334`
- Bukti:       Setelah QC release 120 KG, `material_valuations` untuk material uji = **0 baris**
               (table kosong di DB box ini), padahal `receiveGoods()` pada file yang sama
               (`:86-95`) selalu menulis `materialValuation.create`. Jalur yang benar-benar dipakai
               warehouse release tidak menulis valuasi sama sekali, dan `material_items.unitPrice`
               tetap 100000.
- Repro:       Jalankan t1.js; setelah release, `SELECT * FROM material_valuations WHERE "materialId"='<id>'` → 0 rows.
- Dampak ke client: HPP (harga pokok penjualan) barang yang diterima lewat GRN tidak pernah ikut
               bergerak, sehingga laba per unit bahan selalu salah.
- Lapis:       DB

---

## TEST 2 — Bisakah on-hand turun ke bawah nol?

**Verdict: YA. Diterima, tanpa peringatan, tanpa pemblokiran. BLOCKER.**

| kasus | endpoint | hasil |
|---|---|---|
| Picking melebihi stok batch | `POST /v1/warehouse/picking/execute` qty=9999 (batch 20) | **400** "Insufficient stock in batch. Available: 20, Requested: 9999" — benar diblokir |
| **Inbound quantity negatif** | `POST /v1/warehouse/inbounds` qty=**-80** | **201 CREATED** → on-hand **-30** |
| Inbound quantity nol | `POST /v1/warehouse/inbounds` qty=0 | **201 CREATED** → on-hand 50 (batch 0.00 GOOD) |

### [F2-WH-003] Inbound menerima quantity negatif dan on-hand menjadi negatif
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:152-161` (validasi createInbound)
               dan `:317-320` (`stockQty: { increment: item.qtyActual }`)
- Bukti:       `POST /v1/warehouse/inbounds {"items":[{"materialId":"<id>","quantity":-80,...}]}`
               → **HTTP 201**, `inboundNumber` dibuat normal. Setelah `POST /v1/warehouse/inbounds/:id/release`
               → **HTTP 201** dan `material_items.stockQty` = **-30.00** (dari 50). Tabel
               `material_inventories` menyimpan `currentStock = -80.00` dengan `qcStatus=GOOD`.
               Validasi `createInbound` hanya memeriksa `!item.items.length` dan
               `!item.batchNumber || !item.expiryDate` — **tidak ada pemeriksaan `quantity > 0`**.
               Karena `qtyActual` tidak bertipe dicek, `increment` dengan nilai negatif langsung
               applies. Di DB: `SELECT * FROM material_items WHERE "stockQty"<0` → 1 baris
               (`qty=-30.00`); `SELECT * FROM material_inventories WHERE "currentStock"<0` → 1 baris.
- Repro:       `curl -X POST localhost:3213/v1/warehouse/inbounds -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"items":[{"materialId":"<uuid>","quantity":-80,"batchNumber":"X","expiryDate":"2027-12-31"}]}'`
               lalu `POST /v1/warehouse/inbounds/<id>/release`.
- Dampak ke client: Satu ketikan salah (tanda minus, atau tidak sengaja) membuat sistem mencatat
               barang keluar padahal tidak ada barang yang keluar, dan stok sistem menjadi minus —
               clerk tidak akan pernah bisa mencocokkan angka fisiknya dengan sistem.
- Lapis:       API / DB

**Catatan positif:** jalur picking DOES punya guard. `warehouse-release.service.ts:377` dan `:453`
membalik `INSUFFICIENT_STOCK` baik di `picking/validate` maupun `picking/execute`, keduanya 400.
Jadi proteksi ada — tapi hanya di satu dari dua pintu yang bisa mengubah `stockQty`.

---

## TEST 3 — D4-004: valuasi jadi basi diam-diam

**Verdict: F1 SALAH pada mekanismenya, tapi TEPAT pada akibatnya./plugin yang lebih buruk ditemukan.**

### 3a. Posisi `catch` relatif terhadap transaksi — F1 D4-004

F1 menyebut `valuation.service.ts:78-90` catch di luar `$transaction`. **Benar soal posisi, salah soal nomor baris.**

- `$transaction` dibuka di **line 22** (bukan 23), callback-nya ditutup di **line 84** (`});`).
- `catch` ada di **line 85-90** — jadi memang **di luar** `$transaction`, dan **di dalam** loop
  `for (const item of payload.items)` yang mulai di **line 20**.
- Konsekuensi: satu item yang gagal **tidak menghentikan** item lain, dan tidak ada yang
  dilempar ke pemanggil..only `console.error` di line 86.

### 3b. Bukti eksekusi — MAP TIDAK COCOK dengan hitungan sendiri

Kasus A (start 200 @50000, masuk 60 @54000 — kasus bersih, tanpa reject):

| | nilai |
|---|---|
| `material_items.stockQty` setelah approve | **260** |
| `material_valuations.totalQty` yang tersimpan | **200** |
| `material_valuations.movingAveragePrice` tersimpan | **51200.00** |
| MAP saya: ((200×50000)+(60×54000))/260 | **50923.0769** |
| Selisih | **+276.92 (MAP terlalu tinggi 0.54%)** |
| `material_valuations.totalValue` tersimpan | **10,240,000** |
| Nilai inventaris sebenarnya (260 × 50923.08) | **13,240,000** |

MATH CHECK-nya cocok: `((140×50000)+(60×54000))/200 = 10,240,000/200 = 51200`.
Artinya kode memakai `qtyLama = 200−60 = 140`, padahal `qtyLama` yang benar adalah 200.
Penyebabnya: `valuation.service.ts:46` membaca `material.stockQty` dari **koneksi Prisma
terpisah (`this.prisma`, bukan `tx`)**, sementara event di-emit dari ** dalam `$transaction`
SCM yang belum commit** (`scm/services/inbounds.service.ts:124` di dalam `$transaction` line 82).
Jadi handler membaca nilai **sebelum** `stockQty: {increment}` ter-commit. `totalQty` = 200 (lama),
`qtyLama` = 140 (salah), MAP naik, dan kolom `totalValue` salah 3 juta rupiah.

Kasus B (tambah reject): `MAP tersimpan 52400.00` vs `benar 51333.3333` — **selisih +1066.67**.
Di sini ada **dua** bugbertumpuk: (1) penyebut basi seperti di atas, dan (2) payload event
mengirim `qty: i.qtyActual` (`inbounds.service.ts:130`) sementara stok yang benar-benar
naik hanya `qtyGood` (`inbounds.service.ts:103`). Item yang direject ikut dihitung seolah
masuk ke stok.

### [F2-WH-004] MAP dihitung dari `stockQty` basi — HPP salah di SETIAP inbound
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/valuation.service.ts:46` (baca `this.prisma` di luar `tx`)
               vs `backend/src/modules/scm/services/inbounds.service.ts:124` (emit di dalam `$transaction`)
- Bukti:       start 200 @50000, inbound 60 @54000 → stok jadi **260**, tapi baris
               `material_valuations` tersimpan `totalQty=200.00`, `totalValue=10240000.00`,
               `movingAveragePrice=51200.00`. MAP benar = **50923.0769**. Selisih **+276.92**.
               Nilai inventaris tercatat meleset **3,000,000** (10.24 jt vs 13.24 jt).
- Repro:       buat material stockQty=200 unitPrice=50000; buat PO 60 @54000; `POST /v1/scm/inbounds`;
               `POST /v1/scm/inbounds/:id/post`; `SELECT * FROM material_valuations`.
- Dampak ke client: HPP bahan salah pada setiap penerimaan barang, dan `material_items.unitPrice`
               ikut ditulis dengan angka yang salah sehingga seluruh downstream (nilai stok, laba)
               mewarisi kesalahan yang sama.
- Lapis:       DB

### [F2-WH-005] Valuasi gagal → klien tetap dapat 201, MAP basi permanen (D4-004 TERBUKTI)
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/valuation.service.ts:85-90`
- Bukti:       Dipaksa gagal dengan `unitPrice=1e12`, `stockQty=1`, inbound `qtyActual=1e6`,
               `qtyGood=0` (stok tidak naik, guard `if (qtyGood>0)`), `poId` menunjuk PO tanpa item
               sehingga `purchasePrice` jatuh ke `material.unitPrice` (line 37). `newMap = 1e18`
               melewati `numeric(15,2)` → Prisma melempar → tertangkap `catch` line 85.
               Hasil: `POST /v1/scm/inbounds/:id/post` → **HTTP 201**, body
               `"status":"APPROVED"`. Di DB: inbound `status=APPROVED`,
               `material_valuations` **0 baris** (sebelum juga 0), `material_items.unitPrice`
               **tidak berubah**. Tidak ada pesan error, tidak ada retry, tidak adaantrean.
- Repro:       material `{unitPrice:1e12, stockQty:1}`; `POST /v1/scm/purchase-orders {}`;
               `POST /v1/scm/inbounds` dengan `{materialId, qtyActual:1e6, qtyGood:0, qtyFree:1e6}`;
               `POST /v1/scm/inbounds/:id/post` → 201; `SELECT * FROM material_valuations` → 0 rows.
- Dampak ke client: Petugas mengira barang sudah valued dan akan bergerak ke HPP; sebenarnya
               valuasi hilang tanpa jejak. Tidak ada layar yang menunjukkan ini terjadi.
- Lapis:       API / DB

**Koreksi terhadap F1:** D4-004 menyebut "valuation basi diam-diam" — benar. Yang belum
tertangkap F1: (a)nomor baris sebenarnya 22/85 bukan 19-25/78-90; (b) Akar masalah bukan hanya
`catch` — **`catch` hanya menutupi**; bugs yang bikin valuasi salah adalah **bacaan stok basi**
(WH-004). Kalau `catch` diperbaiki tapi bacaan basi tidak, MAP tetap salah. (c) Ada bug ketiga
yang tidak disebut F1 sama sekali: `qty` di payload = `qtyActual`, bukan `qtyGood`.

---

## TEST 4 — Idempotency pada stock-in

**Verdict: proteksi ADA tapi tidak pernah dipakai, dan kedaluwarsa setelah 60 detik. BLOCKER di jalur tanpa header.**

| skenario | hasil |
|---|---|
| (a) POST ×2, `Idempotency-Key` sama, < 60 dtk | **AMAN** — `inboundId` sama, 1 baris, header `X-Idempotency-Replay: true` |
| (a2) POST ×2, key sama, **63 dtk** | **MENGGANDAKAN** — baris 11 → 12 |
| (b) POST ×2, **tanpa header** | **MENGGANDAKAN** — stok akhir **160**, seharusnya 130 |

### [F2-WH-006] Retry tanpa `Idempotency-Key` menggandakan stok:fisik 30 jadi 60
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/common/interceptors/idempotency.interceptor.ts:30-32` (no-op bila key absen)
- Bukti:       `POST /v1/warehouse/inbounds` dua kali dengan payload identik tanpa header →
               **201** + **201**, dua `warehouse_inbounds` berbeda
               (`3825de5c…` dan `d0a05768…`), lalu `release` keduanya → `material_items.stockQty`
               = **160.00** (start **100**, satu pengiriman **30**). Dua `material_inventories`
               dengan `batchNumber` sama-sama **30.00**, dan dua `inventory_transactions`
               `INBOUND:30.00`. Stok sistem **+30** lebih besar dari barang yang benar-benar tiba.
- Repro:       `curl -X POST localhost:3213/v1/warehouse/inbounds -H "Authorization: Bearer $T" -d '{"items":[{"materialId":"<uuid>","quantity":30,"batchNumber":"B","expiryDate":"2027-12-31"}]}'` dua kali,
               lalu `POST /v1/warehouse/inbounds/<id1>/release` dan `<id2>/release`.
- Dampak ke client: Timeout jaringan lalu user menekan "kirim lagi" = gudang mencatat 60 unit
               padahal 30 unit yang datang. Selisih 30 unit tidak akan ketahuan sampai opname.
- Lapis:       API / DB

### [F2-WH-007] TTL idempotency 60 detik — retry setelah 63 detik tetap menggandakan
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/common/idempotency/idempotency.service.ts:11` (`defaultTtlMs = 60_000`),
               Map in-memory `private readonly cache = new Map(...)` baris 10
- Bukti:       POST dengan `Idempotency-Key` yang sama: `t=0` → 201, `t=63s` → **201 lagi dengan
               inbound baru** (baris `warehouse_inbounds` 11 → 12), header `X-Idempotency-Replay`
               tidak ada. `check()` di baris 21-23 menghapus entri ketika `Date.now() > expiresAt`.
- Repro:       dua POST beruntun dengan key sama, jeda 63 detik.
- Dampak ke client: Jendela proteksi hanya 1 menit. Retry yang lambat (user tidak yakin
               tombol sudah bekerja, atau proxy timeout 60 detik) melewati jendela itu dan
               menggandakan stok. Untuk penerimaan barang, jendela wajar adalah >= 24 jam.
- Lapis:       API

**Catatan FE-BE:** `Idempotency-Key` di repo frontend hanya dipakai di 2 tempat —
`src/hooks/useCanonicalMarketing.ts:73` dan `src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:348`.
**Tidak ada satu pun** pemanggilan warehouse/SCM yang mengirim header ini. Jadi proteksi yang
memang bekerja (skenario a) **tidak pernah aktif di aplikasi**.
