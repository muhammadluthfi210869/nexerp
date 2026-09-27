# QA Gate — Rute Mati (13), OperationId Ganda (5), dan Tiga Layar Yang Mati Oleh Bentuk Respons Live

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (sertifikasi P03 produksi MERAH: 16/21; lihat bagian 8)

Lanjutan dari `2026-09-26-tahap5-dashboards-marketing.md`.

## 0. Ringkas

Tiga kelas cacat, semuanya "hijau di CI, mati di layar":

1. **13 rute ganda** — dua controller mendeklarasikan `METHOD + path` yang sama. Express hanya
   memanggil pendaftar pertama; sisanya kode mati yang tetap ter-compile, tetap lolos lint, tetap
   tampak hidup di editor.
2. **5 operationId ganda** — dua class bernama `MaterialsController`. Nest membentuk operationId
   sebagai `${ClassName}_${methodName}`, jadi `openapi-typescript` menulis operasi yang sama dua
   kali ke `frontend/src/types/api.ts` dan `tsc` gagal di artefak 30 ribu baris yang tidak pernah
   ditulis manusia.
3. **Tiga layar mati** oleh respons 200 yang bentuknya salah. Ditemukan oleh sweep browser P22,
   bukan oleh test unit mana pun.
4. **Gerbang P03 melaporkan hijau secara hampa.** CLI audit yang dijalankan manusia mengukur
   satu commit terakhir, bukan basis fase, dan mencetak `21/21 PASS` dengan 0 berkas dipindai
   sementara runner CI gagal di atas pohon yang sama. Bagian 8.

Ketiganya kini punya gerbang sendiri yang terbukti merah lebih dulu.

## 1. REVISI PENTING atas Rencana: Gerbang, Bukan Penghapusan

`backend-route-uniqueness.test.sh` melaporkan **13 tabrakan** pada kondisi awal. Keputusan untuk
setiap tabrakan **tidak** diambil dari urutan registrasi saja, melainkan dari mana implementasi
yang benar:

| Rute | Pemilik yang dipertahankan | Alasan berbasis bukti |
|---|---|---|
| `GET/POST finance/bills` | `finance/finance.controller.ts` | Frontend mengirim `{vendorId, billRef, issueDate, dueDate, amount}` — DTO milik rute hidup, bukan `CreateBillDto`. Daftar hidupnya juga sudah meratakan `billNumber`/`vendorName` untuk layar tagihan. |
| `GET/POST hr/tickets` | `hr/hr.controller.ts` | `Ticket.amount` tersimpan terenkripsi dan `hr.service.getTickets` mendekripsinya. `TicketsService.create` akan menulis jumlah sebagai plaintext ke kolom yang setiap pembaca coba dekripsi. |
| `GET rnd/formulas` | `rnd/formulas/formulas.controller.ts` | Controller itu yang membawa scoping P08 `formulaTenantWhere` (`rndActorFromRequest(req)`). Menyimpan versi `rnd.controller.ts` akan menghapus proteksi tenancy. |
| 8 × `GET reports/*` | `reports/reports.controller.ts` | Hanya menyisakan path yang tidak diklaim controller lain; delapan handler yang tunduk pada pendaftar pertama dihapus. |

Total dekorator rute yang dihapus: 2 + 2 + 1 + 8 = **13**.

Setiap pemangkasan diverifikasi melawan server hidup: `/finance/bills` 200, `/hr/tickets` 200,
`/rnd/formulas` 400 (tetap milik FormulasController), `/reports/profit-loss` 200,
`POST /reports/goods-receipts` 202.

## 2. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

### 2.1 `scripts/__tests__/backend-route-uniqueness.test.sh`

Ditulis lebih dulu dan awalnya **MERAH: 13 tabrakan rute**. Setelah pemangkasan: **HIJAU —
981 rute unik**.

Gerbang ini kemudian diperluas ke kelas cacat kedua, karena tabrakan operationId adalah cacat yang
sama (dua implementasi menyamar sebagai satu) dan P03 `duplicate_code_scan` tidak melihat bentuk
`@Get()`/`@Post()` tanpa argumen.

**Merah:** 5 operationId dipakai dua controller berbeda.
**Hijau:** `981 rute unik, 919 operationId unik`.

Pemeriksa ini sengaja **tidak** menandai dua pasang class lain yang namanya juga kembar —
`KpiController` (`crm/kpi` + `kpi`) dan `ReportsController` (`executive` + `reports`) — karena
nama method mereka tidak beririsan, sehingga operationId-nya tetap unik. Ia hanya gagal ketika
nama class **dan** nama method sama, yaitu tepat kondisi yang mematikan `tsc`.

### 2.2 `scripts/__tests__/finance-invoice-alias-contract.test.sh`

Kontrak dua sisi untuk `totalAmount` / `paidAmount` / `remaining`. Awalnya **MERAH (3 hilang)**,
kini **HIJAU**. Tanpa alias itu kolom uang mencetak `NaN` — tanpa error di mana pun.

### 2.3 `frontend/src/app/(dashboard)/__tests__/live-shape-crash-guards.behavior.test.tsx`

Tiga halaman, tiga payload live. **Merah 3/3 sebelum perbaikan**, masing-masing dengan pesan yang
sama persis seperti di browser:

```
TypeError: Cannot read properties of undefined (reading 'revenue_mtd')   (/dashboard)
TypeError: t.rate.toFixed is not a function                              (/finance/taxes)
TypeError: Cannot read properties of undefined (reading 'name')          (/reports/finance-reports)
```

**Hijau 3/3 setelah perbaikan.**

### 2.4 `frontend/src/app/(dashboard)/finance/__tests__/bills-live-shape.behavior.test.tsx`

3 test, merah lebih dulu, kini hijau. Dua cacat nyata: kolom uang `NaN` dan layar yang mati begitu
vendor dicari (`Cannot read properties of null (reading 'toLowerCase')`).

Catatan metode: versi pertama test ini **lulus di percobaan pertama** karena `b.id.toLowerCase().includes("")`
selalu `true`, sehingga operand kanan `||` tidak pernah dievaluasi dan vendor `null` tidak pernah
disentuh. Test ditulis ulang untuk mengetik kata kunci pencarian yang tidak cocok — barulah merah.

## 3. Tiga Layar Yang Mati Oleh Bentuk Respons Live

Sweep browser P22 (264 rute) melaporkan 6 pesan di 3 halaman. Semua **bukan** flake login; ketiganya
crash runtime nyata.

| Halaman | Payload live | Penyebab | Perbaikan |
|---|---|---|---|
| `/dashboard` | `GET /dashboards/marketing` → `{data:{cards,freshness}}` | Halaman membaca `audit.acquisition.revenue_mtd`; fallback hanya berjalan saat request **melempar**, jadi 200 dengan bentuk salah mematikan halaman. | Bentuk yang menentukan, bukan status code: pilih payload yang punya `acquisition`, jatuh ke `/analytics/executive`. |
| `/finance/taxes` | `GET /finance/taxes` → `rate: "11"`, `"0.5"` | `rate` adalah Prisma Decimal yang dikirim sebagai string JSON, sementara layar memperlakukannya sebagai number: `t.rate.toFixed(2)`. | Koersi di batas: `Number(t.rate)` di `queryFn`, sehingga interface di atasnya benar untuk semua pembaca (termasuk `maxRate`). |
| `/reports/finance-reports` | `GET /reports/general-ledger` → `{"data":[]}` | Panel menggambar `ledgerData.account.name`. Karena **semua tab dirender sekaligus**, satu crash menjatuhkan Laba Rugi, Neraca, dan Neraca Saldo juga. | Rute finance (`/finance/reports/general-ledger/:id`) yang memang berbentuk itu dijadikan utama; rute reports jadi cadangan; body tanpa `account` tidak pernah disimpan. |

`/reports/general-ledger` punya **tepat satu** pemanggil di seluruh frontend — halaman ini. Kedua
layar buku besar lain (`finance/laba-rugi`, `finance/ledger`) sudah memakai rute finance. Jadi rute
reports itu praktis stub yang salah bentuk untuk satu-satunya pembacanya. **Tidak diubah** di sini;
mengubah bentuk respons backend adalah keputusan tersendiri, bukan pekerjaan wiring.

### 3.1 Catatan kejujuran: fixture yang salah, bukan halaman

Percobaan pertama test ini memakai payload balance-sheet tanpa `items`, sehingga gagal pada
`buildTree(data.assets.items)` — cacat di **fixture saya**, bukan di halaman. Setelah live
diperiksa, `/finance/reports/balance-sheet` memang mengirim `{items,total}` untuk assets,
liabilities, dan equity. Fixture diperbaiki ke bentuk live, barulah pesan merahnya sama persis
dengan pesan browser.

## 4. OperationId Ganda (5)

Dua class bernama `MaterialsController`:

- `backend/src/modules/master/controllers/materials.controller.ts` — `@Controller('master/materials')`
- `backend/src/modules/scm/controllers/materials.controller.ts` — `@Controller('scm/materials')`

Keduanya rute hidup (diverifikasi 200 untuk keduanya). Karena keduanya berbagi lima nama method
(`findAll`, `create`, `findOne`, `update`, `remove`), Nest menghasilkan lima operationId yang sama.

**Bukan cacat yang saya perkenalkan:** spec di `HEAD` sudah memuat lima operationId ganda yang sama.
Yang saya lakukan adalah regenerasi spec, dan `openapi-typescript` setia menuliskannya dua kali.

`scm` di-rename menjadi `ScmMaterialsController` — yang dipertahankan adalah controller master
(lebih lengkap: export/import, `@ApiTags`). Sesudahnya spec bersih: **995 operasi, 0 operationId
ganda**. Tag rute SCM ikut berubah menjadi `ScmMaterials`; sudah diperiksa bahwa tidak ada satu pun
konsumen yang merujuk operationId lama maupun tag itu di luar artefak generated (frontend memanggil
path, bukan operationId).

## 5. Dua Artefak Generated Diperbarui

- `backend/swagger-spec.json` — 802 templat path (tidak ada yang hilang dibanding `HEAD`), 995 operasi.
- `frontend/src/types/api.ts` + `frontend/src/types/api-schema.d.ts` — diregenerasi dari spec di atas.

Sebelas endpoint yang sebelumnya ambigu kini memakai tag pemilik hidupnya:
`/v1/finance/bills [GET,POST] tags=finance`, `/v1/hr/tickets [GET,POST] tags=hr`,
8 × `/v1/reports/* [GET] tags=Reports`, `/v1/rnd/formulas [GET,POST] tags=Formulas`.

## 6. Kesalahan Saya Sendiri di Sesi Ini (dan perbaikannya)

**Suite FE merah di dalam P03 `unit_smoke`, hijau saat dijalankan langsung.** Penyebabnya saya:
`waitFor` di testing-library punya batas 1000 ms sendiri, terlepas dari `testTimeout: 15000`.
Test baru saya menunggu rantai dua request, dan saya menjalankannya bersamaan dengan dua pekerjaan
berat lain — jadi timeout, bukan bug produk. Batas eksplisit 5000 ms dipasang di ketiga `waitFor`.
Sesudah itu P03 dijalankan **sendirian**: 21/21 PASS.

**Build browser-agent gagal sekali karena cache `.next` basi** (`next/font/google queries have
exactly one entry`, 42 error). Bukan berasal dari perubahan saya: setelah `rm -rf .next`, build
bersih exit 0 dan sweep browser hijau 7/7. Juga dicatat bahwa exit code build sebelumnya sempat
terbaca dari `tail`, bukan dari `npm` — perhitungan exit code sekarang tanpa pipe.

## 7. Hasil Gate yang Sudah Dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Gerbang rute + operationId | `bash scripts/__tests__/backend-route-uniqueness.test.sh` | EXIT 0 — 981 rute unik, 919 operationId unik (merah 13 rute lebih dulu, lalu merah 5 operationId) |
| Kontrak alias invoice | `bash scripts/__tests__/finance-invoice-alias-contract.test.sh` | EXIT 0 (merah 3 lebih dulu) |
| Test shape live (3 halaman) | `npx vitest run live-shape-crash-guards` | EXIT 0 — 3/3 (merah 3/3 lebih dulu) |
| Test shape live (tagihan vendor) | `npx vitest run bills-live-shape` | EXIT 0 — 3/3 (merah lebih dulu) |
| Typecheck frontend | `npm run typecheck` | EXIT 0 — 0 error |
| Vitest penuh | `npx vitest run` | EXIT 0 — 83 berkas / 669 test |
| Build frontend | `npm run build` (Turbopack) | EXIT 0 |
| Typecheck backend | `npx tsc --noEmit` | EXIT 0 |
| Build backend | `npm run build` | EXIT 0 — 592 berkas (SWC, 811 ms) |
| Audit P03 | `node scripts/ssot/audit_p03_architecture_gates.js` | ⚠️ Angka lama BATAL — lihat bagian 8. CLI ini mengukur satu commit, bukan fase |
| Sertifikasi P03 (produksi) | `node scripts/ssot/certify_p03_phase.js` | **EXIT 1 — 16/21 FAIL** (5 gerbang merah, semuanya warisan cabang; lihat bagian 8) |
| Batas impor DNA | gerbang `dna_import_boundary_ast` | subpath 25 → **0** |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held` |
| Suite negatif P03 | `node scripts/ssot/test_p03_architecture_gates_negative.js` | EXIT 0 |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 25 / FAIL 0 / SKIP 0 (termasuk 2 gerbang baru) |
| Smoke integrasi live | `bash scripts/test-deploy.sh http://127.0.0.1:3002/v1` | EXIT 0 — 6/6 |
| Sweep browser P22 | `bash scripts/test-browser-agent.sh` | EXIT 0 — **7/7 lulus, 264 rute bersih** (sebelumnya 6 pesan di 3 halaman) |
| Rantai paritas | `legacy-fe-delta` + `parity-crosscheck` + `build-fe-legacy-report` | EXIT 0 |
| Typecheck frontend (setelah 25 perbaikan impor) | `npx tsc --noEmit` | EXIT 0 |

## 8. Koreksi Penting: "P03 21/21 PASS" Itu Hijau Hampa

Saat menulis laporan ini saya menjalankan sertifikasi produksi, bukan CLI audit, dan
hasilnya **FAIL 16/21**. Penelusurannya menemukan cacat gerbang, bukan cacat kode:

`scripts/ssot/audit_p03_architecture_gates.js` — CLI yang saya (dan siapa pun) jalankan
lokal — memanggil `runAudit()` **tanpa** `baseSha`. Akibatnya `resolveDiffBase` jatuh ke
`HEAD~1`, dan gerbang duplikasi memindai **satu commit terakhir**. Buktinya ada di
artefak yang saya commit sebelumnya:

```
"base_sha": "43adc697...",        <- HEAD~1, bukan basis fase
"changed_files_scanned": 0,
"total_tokens": 0,
"duplication_percent": 0          <- dan gerbang ini PASS
```

Nol berkas dipindai, jadi hasilnya PASS. Runner yang dipakai CI
(`certify_p03_phase.js`) memakai bundel ketat dari `buildP03AuditOptions()` dengan basis
fase `9229478d`, memindai 595 berkas, dan gagal. Itulah sebabnya empat push CI terakhir
di cabang ini merah sementara laporan lokal hijau. Klaim "21/21 PASS" di versi awal
laporan ini berasal dari jalur yang hampa itu, dan **dibatalkan**.

Perbaikannya ada di commit `7cb1ab70`: CLI kini memanggil `runProductionAudit`, yaitu
bundel ketat yang sama dengan CI — persis seperti yang sudah diklaim docstring modul itu
sendiri sejak awal.

### 8.1 Lima Gerbang Merah (semuanya warisan cabang, bukan dari perubahan hari ini)

| Gerbang | Angka | Sebab | Yang dibutuhkan |
|---|---|---|---|
| `duplicate_code_scan` | 121.056 / 544.590 token = **22,23%** (batas 1%), 57.696 klon di 594 berkas | Seluruh cabang P07–P22 adalah kode baru; ambang 1% dirancang untuk perubahan tambahan, bukan untuk cabang yang isinya seluruh basis kode | Refactor berskala fase, atau keputusan pemilik atas cakupan pengukuran |
| `changed_complexity_check` | **588** fungsi di atas kompleksitas 15, **305** di rentang 11–15 tanpa `@complexity-rationale` | Sama: 595 berkas "berubah" = seluruh basis kode | Refactor berskala fase |
| `dna_import_boundary_ast` | 25 → **0** ✅ | 25 layar mengimpor subpath `@/components/dna/*` | **SELESAI** di commit `e77b4b49` |
| `dna_native_interactive_scan` | **65** berkas memakai elemen interaktif mentah tanpa pengecualian terdaftar | Migrasi DNA yang oleh registry sendiri dijadwalkan ke P19 | Konversi ke `DnaButton`/`DnaInput`/`DnaSelect`, atau pengecualian yang disetujui dewan arsitektur |
| `dna_hardcoded_visual_scan` | **22** berkas memakai gaya/warna mentah tanpa pengecualian | Sama | Sama |

`frontend/src/components/dna/dna-exceptions.yaml` sudah memuat pengecualian ber-id
`DNA-EXC-nnn` dengan `approved_by: architecture_review_board`, `expires_at: 2026-12-31`,
dan `dna_extension_issue: P19-STRICT-DNA-MIGRATION`. **87 berkas tidak ada di sana.**
Menambahkan 87 "persetujuan" tanpa dewan yang menyetujuinya adalah pemalsuan governance,
jadi tidak dilakukan. Yang 87 berkas ini juga **bukan** 13 dashboard departemen yang
sudah ditandatangani (hanya 1 dari 65 dan 4 dari 22 yang berupa dashboard); mayoritas
adalah workspace marketing, `samples/social-tracker`, dan `samples/omni-crm`.

### 8.2 Satu Cacat Input yang Diperbaiki (bukan ambang yang dilonggarkan)

97,6% dari angka duplikasi lama (155.488 dari 159.337 token) berasal dari **satu berkas
generated**: `frontend/src/types/api.ts`, keluaran `openapi-typescript` atas
`backend/swagger-spec.json`. Ia kini dikeluarkan dari pemindaian klon lewat daftar path
eksplisit, sehingga angkanya turun dari 27,04% ke **22,23%** — gerbangnya **tetap merah**.
Ambang tidak disentuh; hanya masukan palsu yang dibuang.

Sesuai aturan wajib CLAUDE.md: ada gerbang yang belum dijalankan → **BELUM SIAP KIRIM**.

## 9. Gate yang BELUM Dijalankan

1. **Sertifikasi P03 produksi** (`node scripts/ssot/certify_p03_phase.js`) — merah 16/21;
   rincian di bagian 8.1. CI di cabang ini merah sejak empat push sebelum hari ini.
2. Smoke test live `https://nexerp.id` pada lingkungan VPS produksi.
3. Pengujian prosedur rollback (`bash scripts/rollback.sh <sha>`).
4. Produksi masih menjalankan SHA `7a449e0a` (2026-09-16); tidak satu pun perbaikan hari ini
   (maupun P07–P19) sudah ter-deploy. Deploy hanya boleh lewat `main` → GHCR → `deploy.sh <sha>`.
   Catatan: CI di `main` juga merah pada run terakhirnya (`c0d46de3`, 2026-09-20).
5. Bentuk respons `/reports/general-ledger` (stub `{"data":[]}`) belum diselaraskan di backend.
6. Keputusan pemilik produk atas ≈3025 baris kode marketing yatim (bagian 6 laporan sebelumnya).

Sesuai aturan wajib CLAUDE.md: ada gerbang yang belum dijalankan → **BELUM SIAP KIRIM**.
