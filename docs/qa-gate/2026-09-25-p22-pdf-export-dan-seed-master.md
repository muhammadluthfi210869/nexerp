# QA Gate — P22: Ekspor PDF & Seed Master Data Legacy — 2026-09-25

Cakupan: dua cacat yang dibuktikan pada sesi 2026-09-25 (laporan
[P22 UAT pre-flight](2026-09-25-p22-uat-preflight-browser-agent.md) §3.4–3.5) —
ekspor PDF yang mengembalikan placeholder HTTP 200, dan master data legacy yang belum
masuk database.

## Verdict

# BELUM SIAP KIRIM

Alasan: aturan CLAUDE.md mensyaratkan build + CI (`scripts/test-deploy.sh`) hijau +
smoke test live + rollback teruji. Yang sudah dijalankan di dokumen ini hanya
**type-check**, **suite test**, dan **verifikasi endpoint lokal**. **CI belum dijalankan,
dan deploy belum dilakukan.**

---

## 1. Cacat #1 — Ekspor PDF: HTTP 200 berisi placeholder

### 1.1 Gejala produksi

`POST /v1/document-automation/pdf` dan `GET /v1/document-automation/drafts/:id/pdf`
mengembalikan `200 application/pdf` yang isinya **satu baris teks**
(`NEX ERP Fallback Document Snapshot`, ~700 byte). Tombol "Download PDF" di
`finance/invoices`, `penjualan/delivery-orders`, `penjualan/sales-order-finance`,
dan `documents/drafts` menghasilkan file yang bisa diunduh tetapi bukan dokumen.

### 1.2 Akar masalah (dua lapis, keduanya perlu)

1. **Image produksi tidak punya browser.** `backend/Dockerfile` (`node:20-alpine`)
   tidak memasang Chromium, sedangkan render memakai `html-pdf-node@1.0.8` →
   `puppeteer@10.4.0`. Gejala persis: `spawn .../linux-901912/chrome-linux/chrome ENOENT`.
2. **Kegagalan render ditelan.** `pdf-engine.service.ts` membungkus render dengan
   `try/catch` yang **mengembalikan placeholder alih-alih melempar**, dan jalur
   placeholder itu juga aktif otomatis saat `NODE_ENV === 'test'`. Jadi setiap
   kegagalan render berubah menjadi dokumen "sah" berstatus 200.

Yang membuat ini bertahan lama: seluruh test yang ada hanya memeriksa `%PDF` +
`length > 100` — syarat yang **juga dipenuhi placeholder**. Test hijau, produksi rusak.

### 1.3 Perbaikan

| Berkas | Perubahan |
| --- | --- |
| `backend/src/modules/document-automation/services/pdf-engine.service.ts` | Engine deterministik hanya aktif bila `FAST_PDF === '1'` (eksplisit). `try/catch` melempar `ServiceUnavailableException` + log `error`, bukan mengembalikan placeholder. Buffer kosong juga ditolak. |
| `backend/test/setup-fast-pdf.cjs` (baru) | Suite unit/e2e memilih engine deterministik secara eksplisit. Sebelumnya tersirat dari `NODE_ENV === 'test'` — justru itu yang menyembunyikan cacat produksi. |
| `backend/test/jest-unit.json`, `backend/test/jest-e2e.json` | `setupFiles` → `setup-fast-pdf.cjs`. |
| `backend/Dockerfile` | Tambah `chromium nss freetype harfbuzz ca-certificates ttf-freefont`; `ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`, `CHROME_EXECUTABLE_PATH`, dan `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` **sebelum** `npm ci --omit=dev`. Resep sama dengan `Dockerfile.self-qr`. |
| `.github/workflows/ci.yml` | Step baru **"PDF Renderer Probe (gagal = fail closed)"** — terjadi **sebelum** push GHCR. Melempar 500, bukan 200, bila render gagal. |
| `scripts/verify-pdf-live.sh` (baru) | Probe pasca-deploy di server live. `PROBE_EMAIL`/`PROBE_PASSWORD` wajib dari environment (tidak ada default kredensial produksi). |

Bukti pendukung yang sudah diperiksa langsung: `puppeteer@10.4.0` memang membaca
`PUPPETEER_EXECUTABLE_PATH` (`node_modules/puppeteer/lib/cjs/puppeteer/node/Launcher.js:510`),
dan `html-pdf-node` **hanya** meneruskan `args` ke `puppeteer.launch` — maka variabel
environment adalah satu-satunya tuas untuk menunjuk Chromium. Default `args` bawaan
sudah memuat `--no-sandbox`.

### 1.4 Bukti RED → GREEN (aturan regresi CLAUDE.md)

Test reproduksi: `backend/test/document-automation/unit/pdf-engine.service.unit-spec.ts`
(blok `a failed render must reach the caller`, kasus R1). `html-pdf-node` di-mock agar
`generatePdf` menolak dengan error ENOENT yang sama seperti di server.

```
# SEBELUM perbaikan — R1 GAGAL (inilah buktinya)
● R1: rejects instead of returning a placeholder when the browser is missing
  expect(received).rejects.toThrow()
  Received promise resolved instead of rejected
  Resolved to value: {"data": [37, 80, 68, 70, 45, 49, 46, 52, …], "type": "Buffer"}
Tests: 1 failed, 10 passed, 11 total

# SESUDAH perbaikan
[Nest] ERROR [PdfEngineService] PDF render failed: Error: spawn … chrome ENOENT
Test Suites: 1 passed, 1 total
Tests: 11 passed, 11 total
```

`[37, 80, 68, 70]` = `%PDF`. Yang "diterima" pemanggil pada run merah itu adalah
placeholder — persis yang terjadi di produksi.

Guard probe juga dibuktikan **load-bearing**: salinan `verify-pdf-live.sh` dengan
pemeriksaan ukuran + placeholder dihapus melaporkan
`PASS: dokumen nyata dari server live (66 bytes)` terhadap server yang hanya
mengembalikan placeholder. Tanpa kedua pemeriksaan itu, probe itu sendiri akan
memberi lampu hijau palsu.

Test regresi shell: `scripts/__tests__/p22-pdf-live-probe.test.sh` (3 kasus:
placeholder ditolak, dokumen nyata diterima, kredensial wajib eksplisit).

---

## 2. Cacat #2 — Master data legacy belum pernah masuk database

### 2.1 Kenapa belum pernah jalan

`backend/prisma/seed-fase1-master.js` menunjuk
`docs/legacy-erp/MASTER_DATA` — **direktori itu tidak ada**. Yang ada:
`docs/legacy-erp/data/master/MASTER_DATA`. Akibatnya setiap `readCsv` mencetak
`CSV not found` dan mengembalikan `[]`, lalu skrip tetap menutup dengan
`🎉 ALL FASE 1 MASTER DATA SEEDING COMPLETE`. Seeder yang melaporkan sukses atas
input yang tidak pernah dibacanya.

Cacat lain pada skrip yang sama:

| Lokasi | Cacat |
| --- | --- |
| `rootDir = 'c:/GAWE/…'` | Path absolut satu mesin; hanya jalan di satu checkout. |
| `console.log('Target DB:', env.DATABASE_URL)` | Mencetak connection string **beserta password** ke log/riwayat shell. |
| `SEED_DEFAULT_PASSWORD` | Dibaca dari `process.env`, tetapi `.env` yang di-parse tidak pernah dipublikasikan ke `process.env` — jadi user hasil seed tidak pernah bisa login. |
| `CUST-${i+1}` | Kode customer diturunkan dari **nomor urut baris**. Sisipkan satu baris PELANGGAN dan seluruh kode bergeser ke orang lain; cabang `update` lalu menimpa record orang yang salah. |
| `catch {}` per baris BARANG | Baris gagal dihitung sebagai "sukses". |

`backend/prisma/seed-master-data.ts` **dihapus**. Audit 2026-09-25 menemukan ia tidak
dirujuk apa pun (hanya komentar sendiri + dokumen QA), dan tidak bisa menyemai apa pun
sebagaimana tertulis: `MaterialItem` ditulis tanpa `minLevel`/`maxLevel`/`reorderPoint`
(kolom wajib tanpa default) dan `SalesLead` ditulis dengan field `name` yang tidak ada
di model itu, plus tiga field wajib lain yang tidak punya kolom CSV. Setiap baris
melempar ke `catch {}`. Skrip itu duplikat yang rusak dari `seed-fase1-master.js`, jadi
yang dihapus adalah duplikatnya, bukan cakupannya.

### 2.2 Perbaikan

- `CSV_DIR` → `docs/legacy-erp/data/master/MASTER_DATA`; `rootDir` diturunkan dari
  `__dirname`.
- `readCsv` **melempar** bila file hilang (fail closed), bukan mengembalikan `[]`.
- Tidak lagi mencetak `DATABASE_URL`; hanya `host:port/db`.
- `SEED_DEFAULT_PASSWORD` dari `.env` diteruskan ke `process.env`.
- Kode customer = `CUST-` + sha1(`nama|phone`) 8 hex — stabil terhadap perubahan urutan.
- Error per baris BARANG dihitung lalu dilempar; ringkasan "tersimpan / baris CSV"
  dicetak sebelum banner, dan run berhenti bila ada entitas yang nol baris.
- `npm run seed:master` didaftarkan di `backend/package.json`.

### 2.3 Hasil eksekusi (lokal, `localhost:5432/erp_db_test`)

```
--- Ringkasan seed (tersimpan / baris CSV) ---
  master_categories    7 / 7
  warehouses           16 / 16
  users                45 / 45
  suppliers            176 / 176
  customers            816 / 816
  material_items       2790 / 2795
⚠️  5 baris BARANG dilewati (kode/barang kosong).
```

Hitungan tabel setelah seed: `material_items` 2804 (2790 seed + 14 fixture),
`suppliers` 179 (+3), `warehouses` 19 (+3), `users` 139, `customers` **806**.
Selisih 816 → 806 adalah **10 pasangan (nama, phone) kembar di CSV** yang jatuh ke
kode hash yang sama — perilaku upsert yang diinginkan, tetapi angkanya perlu
diketahui supaya tidak dikira data hilang.

### 2.4 Apakah master data sekarang menjadi acuan dropdown/search?

Diperiksa langsung ke endpoint yang benar-benar dipanggil komponen
`frontend/src/components/dna/*Select.tsx`:

| Endpoint | Pemanggil | Sebelum | Sesudah |
| --- | --- | --- | --- |
| `GET /master/materials/active` | `GoodsSelect` | 200 (14 fixture) | **200, 200+ baris data legacy**; `?search=collagen` → 9 hasil |
| `GET /master/categories` | `CategorySelect` | 200, 0 | **200, 7** |
| `GET /master/units` | — | 200, 7 | 200, 7 |
| `GET /master/warehouses` | halaman gudang | 200 | 200, 19 |
| `GET /master/suppliers/active` | `SupplierSelect` | **500** | **200, 179**; `?search=PT` → 33 |
| `GET /master/customers/active` | `CustomerSelect` | **500** | **200, 500 baris** (cap `take: 500` dari 806); `?search=sigviolet` → 1 |
| `GET /master/customers?search=Djafar` | halaman Master → Customers | 200, 0 | **200, 1** |

`?search=Fadilah` → 0 baris. Itu benar, bukan bug: pencarian dropdown mencakup
`clientName`/`brandName`/`contactInfo`/`city` — persis yang dijanjikan placeholder-nya
("nama, brand, nomor HP, kota"). Nama PIC tinggal di `notes`, bukan kolom yang dicari.

---

## 3. Cacat #3 — `/master/*/active` tertelan rute `:id` (500)

`GET /master/suppliers/active` dan `GET /master/customers/active` mengembalikan 500:

```
Invalid `this.prisma.supplier.findUnique()` invocation in …/suppliers.service.ts:94:49
Invalid input value: invalid input syntax for type uuid: "active"
```

Express mencocokkan rute sesuai urutan deklarasi. Di `materials.controller.ts`,
`@Get('active')` berada **sebelum** `@Get(':id')` sehingga aman; di controller
suppliers dan customers tidak ada handler `active` sama sekali, sehingga `:id`
menangkap string `"active"`. `SuppliersService.findActive()` sudah ada dan tidak
pernah terpakai — yang hilang hanya rutenya.

Perbaikan: `@Get('active')` ditambahkan **di atas** `@Get(':id')` di kedua controller;
`CustomersService.findActive()` ditambahkan (mengembalikan bentuk yang sudah diharapkan
`CustomerSelect`: `id`, `clientName`, `brandName`, `contactInfo`, `city`).

Bukti RED → GREEN: `backend/test/master/master-active-route-order.unit-spec.ts`.
Urutan deklarasi adalah seluruh invariannya, jadi itu yang di-assert.

```
# RED — rute `active` dihapus sementara dari customers.controller.ts
● CustomersController declares "active" before ":id"
  Expected: >= 0
  Received:    -1
Tests: 1 failed, 2 passed   →   # GREEN setelah dipulihkan: 3 passed
```

Verifikasi live setelah perbaikan: `/master/suppliers/active` → 200 (179 baris),
`?search=PT` → 33 baris; `/master/customers/active` → 200 (0 baris).

---

## 4. Cacat #4 — PELANGGAN belum masuk `salesLead` (dropdown pelanggan kosong)

> **KOREKSI 2026-09-26.** Bagian ini semula merekomendasikan opsi (1), "jadikan `customer`
> kanonik". Rekomendasi itu **salah** dan sudah dibatalkan sebelum dikerjakan. Bukti di
> bawah membalikkannya.

### 4.1 Bukti bahwa keduanya entitas berbeda, bukan satu tabel dibaca dua kali

| Bukti | Isi |
| --- | --- |
| FK ke `salesLead` | `SampleRequest.leadId`, `WorkOrder.leadId`, `NewProductForm.leadId`, `DesignTask.leadId`, `RegulatoryPipeline.leadId`, `LeadCapture.salesLeads`, `MasterCategory.customers` (`relation "CustomerToCategory"`), `User.leadsManaged` |
| FK ke `customer` | hanya 3 model finance: `SalesInvoice`, `ARReceipt`, `ClientEscrow` |
| `CustomerSelect` menulis | `samples/npf/page.tsx:507` menyetel `createForm.leadId = id` → id itu **harus** `SalesLead.id`. Bila dropdown membaca `customer`, form NPF gagal FK. |
| Bentuk CSV | `PELANGGAN.csv` punya `kategori`, `penginput`, `kota`, `nominal_so_produk`, `so_sample`, `so_produk` — dan halaman Master → Customers membaca tepat field itu (`page.tsx:159-163`, termasuk `notes` berformat `Kategori: … | Penginput: …`). Halaman itu memang dirancang untuk `salesLead`. |

Kesimpulan: `salesLead` = hub lead/relasi komersial (sampel → JO → escrow, kategori,
PIC). `customer` = master AR di finance. Keduanya benar dan harus hidup berdampingan.
Cacatnya bukan "dua tabel", tapi **CSV lama hanya disemai ke `customer`**, sehingga
seluruh layar yang membaca `salesLead` kosong sementara finance melihat 806 baris.

### 4.2 Perbaikan

`backend/prisma/seed-fase1-master.js` blok **9b** — baris PELANGGAN yang sama disemai ke
`salesLead` dengan pemetaan yang **sudah dipakai aplikasi sendiri**
(`import-export.service.ts:637-650` untuk entitas `customer` → `salesLead`):

| Kolom `salesLead` | Sumber |
| --- | --- |
| `brandCode` | `CUST-<sha1(nama\|phone) 8 hex>` — sama dengan `customer.code`, jadi AR dan lead satu baris PELANGGAN bisa dipasangkan lewat kode, bukan nama. Sekaligus kunci `upsert`. |
| `clientName` / `contactInfo` / `city` | `nama` / `phone` / `kota` |
| `source` | `'LEGACY_KIL_IMPORT'` |
| `status` | `WON_DEAL` — **bukan** default `NEW_LEAD`. 806 pelanggan lama dimasukkan ke pipeline lead baru akan merusak setiap hitungan funnel. |
| `picId` | cocokkan `penginput` ke `BussdevStaff`; fallback ke staff pertama, **dihitung dan dilaporkan** |
| `estimatedValue` | `nominal_so_produk` (pemisah ribuan koma dibuang — `Number("400,299,500.00")` = `NaN`) |
| `orderCount` | `so_sample + so_produk` |
| `notes` | `Kategori: … | Penginput: …` — bentuk yang sudah diparse halaman Master |

`productInterest` dikosongkan: tidak ada kolom CSV-nya, dan mengarang kategori lebih buruk
daripada kosong. `categoryId` tidak diisi karena nama kategori CSV tidak dipetakan ke
`MasterCategory`.

### 4.3 Hasil (lokal)

```
--- 9b. Seeding Sales Leads from PELANGGAN.csv ---
✅ 816 Sales Leads seeded.
⚠️  662 lead tanpa PIC yang cocok di bussdev_staff — dipetakan ke "Admin".
   Nama PIC asli tetap tersimpan di notes (kolom Penginput di Master → Customers).
     - Fadilah Syahab: 259 baris
     - Annisa Shalihah: 229 baris
```

806 baris unik (816 ditulis; 10 pasangan `nama|phone` kembar bertabrakan pada `brandCode`
yang sama — upsert yang diinginkan, sama seperti `customer` 816 → 806). Semua `WON_DEAL`.
`estimatedValue > 0` pada 151 baris (maks 2.739.240.000), `orderCount > 0` pada 741.
Dijalankan dua kali: tetap 806 baris — idempoten.

662 dari 806 baris dipetakan ke PIC default karena CSV memuat 16 nama PIC sementara
`bussdev_staff` hanya 6. Ini **dilaporkan, bukan ditelan** — kode diam-diam menaruh 806
baris pada satu orang tampak identik dengan pemetaan yang bekerja. Nama PIC asli tetap utuh
di `notes` dan tampil di kolom Penginput.

Guard: `scripts/__tests__/master-seed-guard.test.sh` +7 pemeriksaan (upsert pada
`brandCode`, `WON_DEAL` bukan `NEW_LEAD`, gagal-keras saat `BussdevStaff` kosong,
`sales_leads` masuk ringkasan, helper `parseRupiah`, laporan PIC tak cocok). Tujuh-tujuhnya
GAGAL dulu sebelum blok 9b ditulis.

**Tidak ada kode backend yang berubah** untuk ini — `CustomersService` sudah membaca
`salesLead`; yang hilang hanya datanya.

---


## 5. Gerbang yang dijalankan pada perubahan ini

| Gerbang | Hasil |
| --- | --- |
| Type-check backend (`tsc -p tsconfig.build.json --noEmit`) | **exit 0** |
| Suite unit (document-automation + master route order) | **36/36 lulus**, 3 suite |
| Suite test shell (`bash scripts/__tests__/run-all.sh`) | **PASS 19 / FAIL 0 / SKIP 0**, exit 0 |
| Verifikasi endpoint lokal (backend :3002) | §2.4 — data legacy melayani dropdown materials/categories/units/warehouses/suppliers/customers |
| Build frontend | **belum dijalankan** (tidak ada perubahan frontend pada pekerjaan ini) |
| `scripts/test-deploy.sh` (CI) | **BELUM dijalankan** |
| Smoke test live (nexerp.id) | **BELUM dijalankan** |
| Rollback teruji | **BELUM dijalankan** |

Karena tiga baris terakhir belum, verdict tetap **BELUM SIAP KIRIM**.

### Test regresi baru

| Test | Menjaga |
| --- | --- |
| `backend/test/document-automation/unit/pdf-engine.service.unit-spec.ts` (R1) | Render gagal harus sampai ke pemanggil |
| `scripts/__tests__/p22-pdf-live-probe.test.sh` | Probe PDF menolak 200 yang hanya placeholder |
| `backend/test/master/master-active-route-order.unit-spec.ts` | `@Get('active')` di atas `@Get(':id')` |
| `scripts/__tests__/master-seed-guard.test.sh` (26 pemeriksaan) | Seeder menunjuk direktori CSV yang ada, fail-closed, tidak mencetak kredensial, kode customer stabil, PELANGGAN juga masuk `salesLead` dengan status `WON_DEAL`, PIC tak cocok dilaporkan |

---

## 6. Langkah berikutnya (urutan yang benar)

1. Jalankan gerbang penuh: build frontend, `scripts/test-deploy.sh`, CI.
2. Commit → PR → CI → merge `main` → image GHCR.
3. **Setelah deploy disetujui**: `bash scripts/verify-pdf-live.sh` di server
   (bukti ekspor PDF nyata), lalu `npm run seed:master` untuk data legacy —
   seeder sekarang fail-closed, jadi kegagalan akan terlihat.
4. Snapshot baru + DR drill di maintenance window yang disetujui.

Catatan: seed master ke database **produksi** belum dilakukan dan belum diminta.
