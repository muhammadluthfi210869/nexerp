# QA Gate — Fase 3C: Dekomposisi Dua God Service

Tanggal: 2026-09-26
Branch: `feat/p08-contracts-subject-ownership`
Slice: **3C** — `finance.service.ts` dan `production.service.ts`
Status: **BELUM SIAP KIRIM**

---

## 0. Ringkas

Fase 3A membuat kegagalan terdengar, 3B membuat kegagalan berstatus benar. 3C
memotong file yang selama ini menumpuk keduanya.

| File | Sebelum | Sesudah | Keluar ke |
|---|--:|--:|---|
| `finance.service.ts` | 2627 baris | **2160** | `finance-report.service.ts` (527 baris) |
| `production.service.ts` | 3532 baris | **2443** | `production-analytics.service.ts` (1187 baris) |

Angka di tabel dan di §2 adalah keluaran `wc -l` supaya siapa pun bisa
mereproduksinya. (Hitungan internal script pemindah berbeda 1–4 baris karena
memisah dengan `split('\n')` menghitung baris kosong di ujung berbeda; yang di
sini yang benar.)

Pola yang dipakai di keduanya: **extract class, keep the facade**. Method yang
pindah tetap ada di kelas lama sebagai delegator satu baris, jadi kontrak yang
sudah dipakai tidak berubah hanya karena file dipecah.

Yang dipindah bukan "separuh file secara acak", tapi dua pulau yang terukur
mandiri:

- **Laporan keuangan** — 6 method, 481 baris, satu blok bersambung. Isinya hanya
  `prisma.account` / `prisma.journalLine` / `prisma.journalEntry`, tidak pernah
  posting, tidak pernah emit event, tidak menyentuh SCM atau gudang.
- **Analitik produksi** — 16 method, 1149 baris, tersebar (343–988, 1215–1349,
  3017–3455). Hanya `findMany` / `aggregate` / `groupBy` / `count` /
  `findUnique` — **nol tulisan**.

---

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

Aturan: bug → tulis test reproduksi yang **GAGAL** dulu → baru fix. Untuk
refactor, bentuk "gagal dulu"-nya adalah test yang mengunci kontrak pasca-pecah,
dijalankan sebelum satu baris pun dipindah.

### 1.1 Merah karena modul belum ada

| Spec | Run merah |
|---|---|
| `test/unit/finance-report-extraction.unit-spec.ts` | `Test Suites: 1 failed, Tests: 0 total` — `Cannot find module '.../finance-report.service'` |
| `test/unit/production-analytics-extraction.unit-spec.ts` | `Test Suites: 1 failed, Tests: 0 total` — `Cannot find module '.../production-analytics.service'` |

### 1.2 Penjaganya dibuktikan bukan tautologi

Test yang hijau karena tidak menguji apa pun lebih berbahaya daripada tidak ada
test. Karena itu satu delegator di tiap slice dirusak sengaja (diganti stub
lokal), lalu dijalankan:

| Slice | Delegator yang dirusak | Hasil |
|---|---|---|
| Finance | `getProfitLoss` → `return { broken: true }` | **3 test gagal**, 19 lulus |
| Produksi | `getLeakageData` → `return { broken: true }` | **3 test gagal**, 40 lulus |

Dipulihkan → hijau lagi. Yang gagal persis assertion delegasi dan argument-pass,
bukan yang lain.

---

## 2. Yang Diubah

### 2.1 `finance-report.service.ts` (baru, 527 baris)

`@Injectable()`, satu dependensi: `PrismaService`. Berisi `getTrialBalance`,
`getDetailedTrialBalance`, `getBalanceSheet`, `getProfitLoss`, `getCashFlow`,
`getGeneralLedger` — 481 baris dipindah **verbatim** (bukan diketik ulang; script
pemindah memverifikasi batas baris lalu memindahkan byte apa adanya), plus tiga
tipe modul `ReportLine` / `ReportBucket` / `UnplacedAccount` dan import yang
ternyata dibutuhkan (`NotFoundException`, `AccountType`, `NormalBalance`,
`ReportGroup`).

`FinanceService` tinggal 6 delegator:

```ts
getProfitLoss(...args: Parameters<FinanceReportService['getProfitLoss']>) {
  return this.reportService.getProfitLoss(...args);
}
```

`Parameters<...>` dipilih, bukan menyalin tanda tangan: arity tidak bisa
menyimpang dari method aslinya, dan `...args` tidak bisa menghilangkan parameter.
Tanda tangan hasil salinan adalah cara paling umum sebuah pemecahan file mulai
berbohong.

### 2.2 `production-analytics.service.ts` (baru, 1187 baris)

`@Injectable()`, satu dependensi: `PrismaService`. 16 method analitik dipindah
verbatim. `ProductionService` tinggal 16 delegator dengan pola yang sama.

Yang penting di sini bukan jumlah barisnya, tapi apa yang **tidak** ikut pindah.
Diukur per kemunculan (`grep -o | wc -l`), bukan perkiraan:

| Penanda | `production.service.ts` sebelum | sesudah | kelas analitik baru |
|---|--:|--:|--:|
| `.aggregate(` | 2 | **0** | 2 |
| `.groupBy(` | 2 | **0** | 2 |
| `.create(`/`.update(`/`.upsert(`/`.delete(` | 47 | **47** | **0** |
| `$transaction` | 14 | **14** | **0** |

Baris tulis tidak berkurang satu pun, dan kelas hasil ekstraksi tidak punya satu
pun. Itu definisi slice ini: yang keluar hanya baca.

### 2.3 Wiring

- `finance.module.ts`: `FinanceReportService` masuk `providers`.
- `production.module.ts`: `ProductionAnalyticsService` masuk `providers`.
- Tiga spec finance + dua spec produksi menambahkan provider baru ke Nest
  `TestingModule`-nya. **Kelas asli yang diprovide, bukan stub** — supaya
  assertion `getProfitLoss` / `getMicroFlowDiagnostics` yang sudah ada tetap
  menjalankan query builder sebenarnya terhadap prisma tiruan.
- `_LIFECYCLE_REGISTRY.json` diregenerasi (bukan diedit tangan).

### 2.4 Yang sengaja TIDAK diubah

- `production.controller.ts` dan `finance.controller.ts`: nol perubahan. Itulah
  gunanya facade.
- `formulaAdjustments` di `production.service.ts`: field yang dideklarasikan dan
  tidak pernah dibaca. **Sudah begitu di HEAD sebelum 3C** (diverifikasi dengan
  `git show HEAD:...`), jadi bukan akibat pemecahan ini. Tidak dihapus — di luar
  lingkup, dan aturan "no blind deletes" berlaku.

---

## 3. Test Regresi (permanen)

| Spec | Test | Lapis yang dikunci |
|---|--:|---|
| `finance-report-extraction.unit-spec.ts` | 22 | enam method ada di kedua kelas; delegasi tepat sekali; argumen lewat utuh; facade tidak lagi memuat `ReportLine`/`ReportBucket`/`UnplacedAccount` dan `this.prisma.journalLine`; facade < 2200 baris; kelas hasil ekstraksi hanya bergantung `prisma` |
| `production-analytics-extraction.unit-spec.ts` | 43 | enam belas method ada di kedua kelas; delegasi + argumen; facade tidak lagi punya `.aggregate(` / `.groupBy(`; **kelas hasil ekstraksi tidak boleh punya `.create(` / `.update(` / `.upsert(` / `.delete(` / `$transaction`**; jalur tulis tetap di facade; modul mendaftarkan provider |

Assertion "kelas analitik tidak boleh menulis" adalah penjaga desain, bukan
formalitas: kalau suatu hari sebuah tulisan pindah ke sana, itu keputusan
arsitektur yang layak dibahas, bukan efek samping refactor.

Kontraknya sengaja di-assert lewat **tipe dan delegasi**, bukan prosa. Pelajaran
3B: `legality.unit-spec.ts:77` pecah karena meng-assert kalimat, bukan perilaku.

---

## 4. Verifikasi

### 4.1 Gerbang yang dijalankan

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **rc=0**, 0 error |
| Lint backend | `bash scripts/__tests__/backend-lint-clean.test.sh` | **rc=0** — bersih |
| Unit backend | `npm run test:unit` | **41/41 suite, 412/412 test** |
| e2e p15 statements (live DB) | `npm run test:p15:subledgers-statements` | **4/4** |
| e2e p15 golden thread (live DB) | `npm run test:p15:golden-thread` | **1/1** |
| e2e p20 golden thread (live DB) | `npm run test:p20:golden-thread` | **1/1** |
| e2e p07 http-closure (boot modul nyata) | `npm run test:p07:http-closure` | **8/8** |
| e2e p13 golden thread (jalur tulis produksi) | `npm run test:p13:golden-thread` | **8/8** |
| Suite shell | `bash scripts/__tests__/run-all.sh` | **PASS: 26, FAIL: 0, SKIP: 0** |
| SSOT | `node scripts/ssot/validate_ssot.js` | **19 pass, 0 fail — CERTIFIED** |
| Lifecycle | `node scripts/ssot/audit_lifecycle_reconciliation.js` | **14/14 PASS — OVERALL P02: PASS** |

Progres unit: 39/347 → 40/369 (setelah 3C-a) → 41/412 (setelah 3C-b). Suite unit
dijalankan dengan `--max-old-space-size=8192`.

### 4.2 Gerbang lifecycle sempat MERAH, dan itu benar

Setelah 3C-a, `caller_import_registration_scan` gagal:

```
Missing service in registry: "backend/src/modules/finance/finance-report.service.ts"|"FinanceReportService"
```

13/14, verdict FAIL. Gerbangnya bekerja sebagaimana mestinya: kelas baru wajib
terdaftar. Setelah `generate_lifecycle_registry.js` dijalankan, 14/14 PASS.
Registry adalah keluaran generator, bukan file yang diedit tangan — kalau
ditempel manual, audit berikutnya akan tetap merah.

### 4.3 Yang **belum** dijalankan

- **Smoke test live** — butuh deploy.
- **Rollback teruji** — butuh deploy.

P03 sudah dijalankan setelah commit kedua; hasilnya di §8 dan **tidak hijau**.

---

## 5. Yang Sengaja BELUM Dikerjakan

`production.service.ts` masih 2443 baris dengan 39 method. Setelah slice ini,
sisa klaster yang terukur (nomor baris mengacu versi 3532 baris, sebelum
pemecahan) adalah:

| Klaster | Method | Baris | Catatan |
|---|---|--:|---|
| Eksekusi stage & QC | `startProduction`, `startStage`, `reportBreakdown`, `submitStageLog`, `issueMaterial`, `flagShortage`, `getPendingAudits`, `submitAudit`, `calculateNextStage`, `calculateCOPQ`, `resolveQRContext`, `checkMaterialReadiness`, `verifyStageQC`, `returnMaterial`, `finalizeWorkOrderCosting` | ~1000 | butuh `legality` + `stateTransition` + `eventEmitter`; ini jalur tulis |
| Penjadwalan | `createBatchSchedule`, `rescheduleBatchSchedule`, `dispatchWorkOrder`, `getSchedulesByStage`, `updateScheduleResult`, `submitStepActuals` | ~900 | butuh `eventEmitter` + `idGenerator` |
| Batch record | `getBatchRecordDetail`, `createBatchRecord`, `getBatchRecord`, `updateBatchRecord`, `deleteBatchRecord`, `transitionBatchRecord`, `getBatchRecords` | 362 | satu blok **bersambung** (2489–2852) — seam paling bersih berikutnya |
| Penyesuaian formula | `getFormulaAdjustments`, `createFormulaAdjustment` + field `formulaAdjustments` | ~57 | termasuk field mati di atas |

Kenapa berhenti di sini: pemecahan berikutnya tidak lagi memisahkan baca dari
tulis. Ia memotong jalur tulis yang saling memanggil, jadi risikonya berbeda
tingkat. Fase 3C sengaja mengambil dua pulau yang bisa dibuktikan mandiri lebih
dulu — dan untuk pemecahan pertama, 1133 baris keluar dari file terbesar tanpa
satu pun perilaku berubah.

Fase 4 (frontend) dan Fase 5 (modernisasi gate SSOT) tetap belum dimulai.

---

## 6. Catatan Proses

### 6.1 Satu kekeliruan pengukuran, dan koreksinya

Saat memilih seam produksi, `grep` atas **nama method** menemukan
`getDashboardAnalytics` di `lead-capture.controller.ts` dan
`marketing.controller.ts`, `getActiveWorkOrders` di `scm.controller.ts`,
`getExecutiveSummary` di `hr.controller.ts`. Kesimpulan pertama saya: "jadi
`ProductionService` sebenarnya punya konsumen lintas-modul". Saya sempat menulis
komentar itu di file.

Itu **salah**. Setelah binding-nya diresolve satu per satu, keempatnya adalah
method **bernama sama** milik service modul itu sendiri
(`hrService.getExecutiveSummary`, `scmService.getActiveWorkOrders`,
`leadCaptureService.getDashboardAnalytics`, `marketingService.getDashboardAnalytics`).
`ProductionService` memang tidak punya konsumen di luar modul produksi; pemanggil
produksinya hanya `production.controller.ts` dan dua unit spec. Komentar yang
salah itu dihapus dari ketiga tempat dan diganti dengan hasil pengukuran yang
benar, termasuk catatan tabrakan nama itu sendiri supaya tidak menyesatkan orang
berikutnya.

Pelajaran yang layak dicatat: `grep` nama method menjawab "string ini ada di
mana", bukan "siapa memanggil siapa". Menghitung kemunculan bukan mengaudit
maksud — sama seperti pelajaran 3A/3B di §6.2 laporan sebelumnya.

### 6.2 Kesalahan saya sendiri di tengah jalan

- Helper pemindah pertama gagal pada baris 42 karena file ini CRLF; script
  memisah dengan `\n` sehingga setiap baris menyisakan `\r`. Diperbaiki dengan
  menormalkan ke LF lalu memulihkan EOL file saat menulis — kalau tidak, seluruh
  file 3500 baris akan jadi satu diff raksasa.
- Import `NotFoundException` sempat muncul dua kali di file baru (dua baris
  `@nestjs/common` terpisah). Digabung.
- Dua spec (finance dan produksi) lupa provider baru sehingga gagal dengan
  `Nest can't resolve dependencies ... at index [6]` / `[5]`. Itu justru bukti
  DI-nya benar-benar tersambung, bukan sekadar dekorasi.
- `noUnusedLocals` sempat menandai `args` di delegator yang saya rusak sengaja —
  sinyal yang berguna, dan hilang setelah dipulihkan.

### 6.3 Tidak menyentuh frontend sama sekali

Nol file di `frontend/` berubah di seluruh Fase 3 (3A, 3B, 3C-a, 3C-b). Tidak ada
adopsi `@/components/ui`, tidak ada perubahan komponen, tidak ada perubahan tipe,
tidak ada route yang berubah.

---

## 7. Verdict

**BELUM SIAP KIRIM.**

Yang sudah bisa dibuktikan:

- dua file terbesar turun 467 + 1089 baris, tanpa satu pun perilaku berubah
- kontrak publik kedua service utuh; controller, e2e, dan spec lama tetap hijau
- test regresi ada di kedua slice, dan **keduanya dibuktikan merah dulu** serta
  dibuktikan bukan tautologi dengan merusak delegator
- typecheck 0 error, lint bersih, unit 412/412, shell 26/26, SSOT 19/19
  CERTIFIED, lifecycle 14/14 PASS
- lima spec e2e terhadap database hidup hijau, termasuk satu yang mem-boot modul
  Nest sungguhan (membuktikan wiring DI yang baru)

Yang belum ada hasilnya, dan karena itu verdict-nya tetap belum siap:

1. **Smoke test live** — butuh deploy.
2. **Rollback teruji** — butuh deploy.
3. **P03 phase certification — sudah dijalankan, dan MERAH: 17/21, verdict FAIL,
   token `null`** di SHA `5de307db`. Rinciannya di §8. Angka ini tidak boleh
   disebut hijau, dan juga tidak boleh disebut "gagal karena 3C" — lihat §8.3
   untuk apa yang bisa dan tidak bisa disimpulkan.

---

## 8. P03 Phase Certification (dijalankan setelah commit)

`node scripts/ssot/certify_p03_phase.js` pada working tree bersih di SHA
`5de307db`, 2026-09-26T16:43:25Z → 16:48:59Z (5m34s).

```
verdict: FAIL      token: null      passed_tests: 17 / 21
candidate_sha: 5de307dbb9bae51d3906828a62ede079388ae87c
base_sha:      9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb
```

### 8.1 Yang lulus (17)

`clean_checkout_build` (599 file JS backend, 282 rute frontend), `typecheck`
(backend + frontend exit 0), `lint` (backend 0 error 0 warning; frontend 3810
warning dari plafon 8218, ratchet patuh), `unit_smoke` (backend 41/41 suite 412
test; frontend 83 suite 670 test; 0 skip tak terduga), `container_build`,
`ci_required_check_test` (15 penanda CI lengkap), `module_boundary_test` (41
modul, 0 pelanggaran), `dependency_direction_test` (146 service, 0 pelanggaran),
`circular_dependency_scan` (1306 file, 0 siklus), `unused_export_dependency_scan`
(0 dependensi tak terpakai), `orphan_object_scan` (114 controller / 146 service /
278 halaman, 0 objek tak dijelaskan), `dna_import_boundary_ast`,
`dna_primitive_duplication_scan`, `dna_barrel_integrity`,
`dna_reference_route_and_composition`, `dna_screen_coverage_manifest`,
`dna_exception_registry_validation`.

Perhatikan dua yang lulus ini justru menyangkut pekerjaan 3C:
`module_boundary_test` dan `dependency_direction_test` keduanya 0 pelanggaran
setelah dua kelas baru masuk. Memecah god service adalah operasi yang justru
paling mudah menciptakan ketergantungan terlarang; di sini tidak terjadi.

### 8.2 Yang gagal (4)

| Check | Angka | Plafon | Catatan |
|---|---|---|---|
| `duplicate_code_scan` | **22.14%** token terduplikasi (121322/548086) | 1% | 57777 clone; didominasi `backend/prisma/seed-coa-v2.ts` dan `seed-golden-showcase.ts` (jendela 8 token pada berkas seed yang memang berulang) |
| `changed_complexity_check` | **590 pelanggaran, 304 tanpa rationale**, dari 607 berkas berubah | kompleksitas 10 (absolut 15) | ratchet `zero_tolerance_changed_code` |
| `dna_native_interactive_scan` | **65 layar** dengan elemen interaktif native tak tertangani | 0 | frontend |
| `dna_hardcoded_visual_scan` | **22 layar** dengan visual hardcoded | 0 | frontend |

Basis pembandingnya `9229478d` (2026-09-18), bukan delta branch ini. Karena itu
angka-angka ini mengukur **seluruh 607 berkas yang berubah sejak basis beku itu**,
termasuk seluruh kerja Fase 1, 2, dan 3.

### 8.3 Apa yang boleh dan tidak boleh disimpulkan

Yang **boleh**: `duplicate_code_scan` bergerak dari 22.16% (baseline sebelum
pekerjaan ini) ke 22.14%. Arahnya benar, besarannya tidak berarti — memindahkan
1149 baris tidak menurunkan duplikasi dua persen, karena yang mendominasi angka
itu berkas seed COA, bukan service.

Yang **tidak boleh**: mengklaim 3C tidak menyumbang pelanggaran apa pun.
`changed_complexity_check` mencacah 590 pelanggaran tetapi berkas buktinya hanya
memuat cuplikan 5 entri; 5 entri itu semuanya di `bussdev/`, `prisma/seed-*`, dan
`auth/`, tidak satu pun di `production/` atau `finance/` — tapi cuplikan 5 dari
590 bukan bukti tentang 585 sisanya. Untuk memastikannya, gate perlu dijalankan
ulang dengan daftar pelanggaran penuh, dan itu belum dilakukan.

Tiga dari empat kegagalan (`dna_*` dua biji, `changed_complexity_check`) menyentuh
wilayah frontend dan berkas lama, bukan wilayah yang 3C sentuh. Tapi itu
penjelasan, bukan izin: gate-nya tetap merah.

---

## 9. Lanjutan 3C: penutupan kelas silent-swallow + slice batch record

Dua commit setelah §8, keduanya belum di-push:

| Commit | Isi |
|---|---|
| `83cfd2a0` | `fix(platform): close the silent-swallow class, not just the instances` |
| `b89b6437` | `refactor(production): move batch records out of the god service (3C part 3)` |

Urutannya bukan kebetulan. Slice batch record memuat satu dari swallow yang
belum tertutup (site `production:work-order-plan-link`), dan memindahkan berkas
yang masih berisi defect hanya memindahkan defect itu.

### 9.1 Kenapa 3A belum menutup kelasnya

Fase 3A memperbaiki situs swallow yang bisa ia enumerasi. `production.service.ts`
**tidak ada di daftar berkas 3A**, dan begitu juga tiga berkas lain; di situlah
tujuh swallow sisanya bersembunyi.

Gate barunya (`backend/test/unit/no-silent-swallow.unit-spec.ts`) memindai seluruh
pohon, bukan daftar yang diketahui, karena gate yang menghitung instance yang ia
kenal mengukur perbaikannya, bukan kelasnya. Ia **mem-parse dengan TypeScript
compiler API, bukan regex**, dan itu keputusan yang terbukti perlu: regex
`catch\s*\{\s*\}` yang saya pakai sebelumnya menemukan 4, parser menemukan **8**.
Empat yang lolos adalah `catch {` yang bloknya multi-baris. Parser juga tidak
salah-tandai `catch {}` di dalam template literal (kasus browser-JS di
`wa-self-qr`), sehingga gate ini tidak butuh escape hatch allowlist sama sekali.

Empat sidik jari gate:

| Test | Gunanya |
|---|---|
| `scans a non-empty tree` (`files.length > 300`) | anti-vakum: gate yang memindai 0 berkas juga melaporkan 0 pelanggaran |
| positive control menanam dua bentuk lalu mengharapkannya ketemu | membuktikan gate bisa merah, bukan selamanya hijau |
| `finds none in the real tree` | klaim yang sebenarnya, dengan nama pelanggar dicetak kalau gagal |

Situs yang diperbaiki (7), semuanya lewat `logBestEffort(logger, '<entity>:<action>', err)`
yang `warn` dan sengaja **tidak** melempar ulang — semuanya tulisan best-effort
di samping baris otoritatif yang sudah commit, jadi melempar justru me-rollback
kerja yang tidak boleh hilang:

`production:finished-good-mirror`, `production:work-order-plan-link`,
`marketing:member-user-mirror`, `wa-self-qr:destination-phone-lookup`,
`wa-self-qr:client-destroy`, `wa-self-qr:qr-png-persist`,
`warehouse:stock-shortage-alert`.

`roles.guard.ts` adalah satu-satunya empty catch yang sah — pembacaan
`constructor`/`name` hanya untuk label log, dan `'anonymous'` jawaban yang benar
apa pun yang terjadi. Perilakunya tidak berubah, tapi empty catch-nya hilang dan
fall-through-nya dinyatakan, karena empty catch tidak bisa dibedakan dari
kegagalan yang dibuang oleh siapa pun yang membacanya nanti. Karena itu gate-nya
tidak butuh pengecualian.

### 9.2 Slice batch record (3C bagian 3)

Tiga slice 3C sekarang dipotong pada dua sumbu berbeda, dan bedanya disengaja:

| Slice | Sumbu | Guard |
|---|---|---|
| finance-report | kemutakhiran (hanya baca) | tidak menulis |
| production-analytics | kemutakhiran (16 metode hanya baca) | `aggregate`/`groupBy` pindah, tulis tidak |
| **batch record** | **kohesi domain** (baca, tulis, emit) | model yang dimiliki vs model stage-execution |

Seam diukur dulu, bukan diasumsikan: baris **1853-2219**, tujuh metode
berdampingan; `this.X` di dalam blok hanya `prisma` (13), `eventEmitter` (2),
`logger` (1); tidak satu pun dari tujuh nama dirujuk di tempat lain di facade
(0); pemanggil nyata hanya `production.controller.ts` (7 call site).

Angka terakhir diukur ulang, tidak dipercaya. Grep seluruh repo atas ketujuh nama
menghasilkan **11 berkas**; sepuluh di antaranya deskriptif — `swagger-spec.json`,
`src/metadata.ts`, tipe frontend yang di-generate, dan dua kontrak YAML — dan tidak
satu pun mengikat nama itu ke sebuah instance. Grep menjawab "string ini di mana",
bukan "siapa memanggil siapa" — kesalahan yang fase ini sudah sekali lakukan lalu
dibatalkan (§6.1), jadi pengulangannya disengaja sebagai verifikasi.

Pemindahan dilakukan **verbatim oleh skrip**, bukan dengan mengetik ulang 367
baris. Skrip itu gagal-tertutup: ia memastikan tiap nama muncul tepat sekali di
dalam blok dan nol kali di luar, blok dimulai di deklarasi metode dan berakhir di
kurung tutup, blok tidak menyentuh kolaborator lain, dan keempat sidik jari isi
ada — semuanya sebelum satu byte ditulis. Blok yang hampir benar tetap tidak
pernah ditulis.

`ProductionService` menyisakan tujuh delegator berbentuk
`(...args: Parameters<ProductionBatchRecordService['m']>)`, jadi arity tidak bisa
menyimpang dari metode aslinya. Tidak ada call site yang berubah.

`EventEmitter2` adalah satu-satunya pelanggaran aturan "prisma dan tidak ada lagi"
dari slice analytics, dan itu sah: dua metode di sini menerbitkan domain event,
yang memang cara codebase ini memisahkan modul. Service yang tidak bisa emit
harus tetap menempel di facade.

Berkas: `production.service.ts` **2459 → 2128** baris;
`production-batch-record.service.ts` **412** baris.

### 9.3 Satu asersi yang salah, diperbaiki sebelum commit

Suite baru awalnya menegaskan `this.prisma.workOrder.` **tidak ada** di service
hasil ekstraksi. Itu salah secara konstruksi — baris 1918 melakukan
`workOrder.update({ data: { planId } })`. Model yang benar-benar disentuh blok itu:
`productionPlan` (10), `salesOrder` (1), `user` (1), `workOrder` (1).

Tiga yang terakhir bukan "asing": itu bahan dari sebuah batch record — sales order
yang dipenuhinya, operator yang bertindak, dan work order yang ditautkan kembali.
Asersinya sekarang menegaskan himpunan model yang terukur, dan menegaskan yang
benar-benar akan mematahkan klaim seam: model stage-execution
(`productionSchedule`, `productionStepLog`, `materialRequisition`, `machine`,
`finishedGood`) tidak ikut pindah.

Catatan yang sama berlaku untuk `production-analytics-extraction.unit-spec.ts`:
daftar "still keeps the write path" menukar `transitionBatchRecord` dengan
`startStage`. `transitionBatchRecord` sekarang delegator, dan `typeof` tidak bisa
membedakan delegator dari body — membiarkannya di daftar akan terbaca sebagai
lulus padahal menguji lebih sedikit. Suite batch record yang menguji body, lewat
sidik jari.

### 9.4 Verifikasi setelah dua commit

| Gate | Hasil |
|---|---|
| `tsc --noEmit` | rc 0 |
| `npm run lint` | rc 0 (0 error, 0 warning) |
| `npm run test:unit` | **43/43 suite, 443/443 test** (sebelumnya 42/415) |
| `bash scripts/__tests__/run-all.sh` | PASS 26, FAIL 0, SKIP 0 |
| `node scripts/ssot/validate_ssot.js` | 19 pass, 0 fail, CERTIFIED |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 14/14 PASS |

Enam modul Testing yang membangun `ProductionService` (4 e2e + 2 unit) mendapat
`ProductionBatchRecordService` sebagai provider **nyata**, bukan stub — stub akan
meluluskan wiring yang belum diuji. `_LIFECYCLE_REGISTRY.json` diregenerasi oleh
skripnya, tidak pernah diedit tangan.

### 9.5 Yang TIDAK dijalankan, dan apa artinya

1. **P03 phase certification tidak dijalankan ulang** setelah `83cfd2a0` dan
   `b89b6437`. Alasan: hasil terakhirnya (§8) sudah FAIL dan sudah tidak bisa
   membersihkan apa pun — berkas buktinya memotong daftar `clones` dan
   `violations` (5 dari 590), jadi menjalankannya lagi menghasilkan angka baru
   tanpa mengubah kesimpulan. Angka di §8 karena itu berlaku untuk SHA
   `5de307db`, bukan `b89b6437`, dan itu dinyatakan di sini alih-alih didiamkan.
2. **Smoke test live** — masih butuh deploy.
3. **Rollback teruji** — masih butuh deploy.

### 9.6 Verdict setelah §9

**BELUM SIAP KIRIM.** Tidak berubah dari §7, dan dua implementasi tambahan tidak
mengubahnya: tiga dari empat gate minimum CLAUDE.md masih belum ada hasilnya.

Satu hal yang **tidak** diklaim: bahwa slice batch record memberi nilai perilaku.
Ia tidak mengubah perilaku apa pun, dan memang tidak dimaksudkan. Yang ia beri
adalah berkas 412 baris yang bisa diaudit sendirian, dan suite yang gagal kalau
badan-badannya diam-diam kembali ke facade.

---

## 10. Slice keempat: production planning (`7a145418`)

Slice pertama yang sumbunya bukan kemutakhiran dan bukan satu tipe record. Enam
metode ini satu-satunya tempat di modul production yang memutuskan **kapan**
pekerjaan berjalan — itu yang membuatnya domain, bukan pengelompokan praktis.

| Slice | Sumbu | Baris keluar |
|---|---|---|
| finance-report | kemutakhiran | 527 |
| production-analytics | kemutakhiran | 1187 |
| batch record | satu tipe record | 412 |
| **production planning** | **kapan pekerjaan berjalan** | **554** |

Seam: baris **883-1391**, enam metode, bersebelahan, tidak ada anggota lain
diselipkan. `this.X`: `prisma` (6), `eventEmitter` (5), `idGenerator` (1). Nol
rujukan ke keenam nama di luar blok, dan nol panggilan dari blok ke metode
`ProductionService` lain.

Blok menyentuh database terutama lewat `tx` di dalam `$transaction` (empat biji),
bukan lewat `this.prisma` — itu sebabnya `this.prisma` mencacah 6 sementara model
yang disentuh 10. Transaction client adalah parameter callback, jadi hanya
`$transaction` terluar yang perlu di-inject.

`production.service.ts` **2128 → 1649** baris; `ProductionPlanningService` **554**.

### 10.1 Dua kegagalan yang ditangkap di jalan

**Sidik jari yang didiskualifikasi.** `STAGE_ORDER_VIOLATION` semula dipakai
sebagai salah satu sidik jari, dan skrip menolaknya: string itu juga ada di
metode yang **tinggal** di facade. String yang dipakai bersama kode yang tidak
pindah tidak bisa membuktikan pemindahan apa pun — ia hanya membuktikan string
itu ada. Diganti empat sidik jari yang unik ke blok. Aturan ini sekarang jadi
asersi tetap di skrip, bukan pengecualian sekali pakai.

**Skrip bukan compiler.** Skrip gagal-tertutup lulus semua asersinya sementara
`rel(...)` di dalam blok tidak punya import di berkas baru — `tsc` yang
menangkapnya, bukan skrip. Ini ditulis apa adanya karena pemeriksaan yang
*terbaca* lebih kuat daripada kenyataannya lebih berbahaya daripada tidak ada
pemeriksaan: asersi skrip menguji bentuk dan keterhubungan, kelengkapan nama
tetap milik compiler.

### 10.2 Verifikasi

| Gate | Hasil |
|---|---|
| `tsc --noEmit` | rc 0 |
| `npm run lint` | rc 0 |
| `npm run test:unit` | **44/44 suite, 470/470 test** |
| `bash scripts/__tests__/run-all.sh` | PASS 26, FAIL 0, SKIP 0 |
| `node scripts/ssot/validate_ssot.js` | 19 pass, 0 fail, CERTIFIED |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 14/14 PASS |

### 10.3 Verdict

**BELUM SIAP KIRIM**, tidak berubah. Ketiga gate yang belum ada hasilnya tetap
sama: smoke test live, rollback teruji, dan P03 (yang hasil terakhirnya merah di
SHA `5de307db`, bukan di HEAD — lihat §9.5).

Sisa `production.service.ts` 1649 baris: stage execution/QC (`startProduction`,
`startStage`, `reportBreakdown`, `submitStageLog`, baris 40-348), step actuals
(`updateScheduleResult`, `submitStepActuals`, ~470 baris), work order + material
(`createWorkOrder`, `issueMaterial`, `flagShortage`, ~170 baris), dan ekor berkas
(handler `@OnEvent` + formula adjustment, ~74 baris). Yang terakhir itu belum
dikerjakan karena handler event punya dekorator dan urutan registrasinya
load-bearing — bukan karena sulit dipotong.

---

## 11. Slice kelima: schedule actuals (`1bba1f22`)

Slice §10 menyebut blok ini ~470 baris; pengukuran tepatnya **458** (baris
914-1371). Sumbunya kelima dan berbeda lagi: **mencatat hasil**. Dua metode ini
mengambil schedule yang sudah ada lalu menuliskan apa yang dihasilkannya — qty
output aktual, konsumsi aktual per step — berikut gerbang interlock yang menolak
angka mustahil sebelum tersimpan.

| Slice | Sumbu | Baris keluar |
|---|---|---|
| finance-report | kemutakhiran | 527 |
| production-analytics | kemutakhiran | 1187 |
| batch record | satu tipe record | 412 |
| production planning | kapan pekerjaan berjalan | 554 |
| **schedule actuals** | **mencatat hasil** | **458** |

Seam: dua metode, bersebelahan, tidak ada anggota lain diselipkan. `this.X`:
`prisma` (2), `eventEmitter` (5), `logger` (1), `idGenerator` (1). Nol rujukan ke
kedua nama di luar blok. Keduanya menyentuh database lewat `tx` di dalam
`$transaction` sendiri (dua biji), jadi `this.prisma` mencacah 2 sementara model
yang disentuh sembilan.

`production.service.ts` **1649 → 1200** baris; `ProductionActualsService` **509**.

### 11.1 Tiga hal yang ditangkap sebelum sempat jadi salah

**Daftar sidik jari dibangun dari pengukuran.** Sembilan string masing-masing
dikonfirmasi "di dalam 1, di luar 0" lebih dulu. `STAGE_ORDER_VIOLATION` di blok
ini justru terukur unik (dalam 2, luar 0) — tapi tetap **tidak** dipakai: ia
string yang di §10.1 harus didiskualifikasi, dan sembilan string yang terbukti
unik sudah cukup tanpa memakai ulang satu yang butuh penjelasan.

**Nama model ditebak, lalu dikoreksi sebelum pindah.** Draf pertama asersi
kepemilikan model menulis `tx.productionStepLog.`; nama sebenarnya
`tx.productionLog.`. Asersi ditulis ulang terhadap sensus terukur
(`productionSchedule` 6, `finishedGood` 3, `productionStepDetail` 3,
`productionLog` 2, `materialInventory` 2, `requisitionFulfillment` 2, `qCAudit` 1,
`workOrder` 1, `user` 1). Ini kesalahan yang sama yang harus diperbaiki suite
batch-record sebelum pemindahannya — bedanya kali ini gagal di draf, bukan di
suite yang merah.

**Satu asersi skrip extractor salah dan menembak.** Ia mencacah `logBestEffort`
di luar blok tanpa mengecualikan baris import — baris import itu sendiri ada di
luar blok. Skrip berhenti (`ABORT: logBestEffort still used outside the block`)
sebelum menulis apa pun. Itu memang gunanya menaruh semua asersi sebelum write:
satu pemeriksaan yang salah bentuk berhenti sebagai pesan, bukan sebagai diff.

Yang **tidak** dilakukan: tidak ada perilaku yang berubah, tidak ada rute
controller yang disentuh, tidak ada tes lama yang diubah selain menambah argumen
kesembilan pada `buildFacade` di tiga suite extraction dan provider asli di enam
modul `Testing`.

### 11.2 Verifikasi

| Gate | Hasil |
|---|---|
| `tsc --noEmit` | rc 0 |
| `npm run lint` (modul production + spec baru) | 0 error, 866 warning (pra-eksisting) |
| `npm run test:unit` | **45/45 suite, 493/493 test** |
| `bash scripts/__tests__/run-all.sh` | PASS 26, FAIL 0, SKIP 0 |
| `node scripts/ssot/validate_ssot.js` | 19 pass, 0 fail, CERTIFIED |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 14/14 PASS |

### 11.3 Verdict

**BELUM SIAP KIRIM**, tidak berubah. Tiga gate minimum CLAUDE.md yang belum
punya hasil tetap sama seperti §9.5 dan §10.3: smoke test live, rollback teruji,
dan P03 — yang hasil terakhirnya merah di SHA `5de307db` dengan `base_sha`
`9229478d`, bukan di HEAD, dan berkas buktinya memotong array
`clones`/`violations` sehingga menjalankannya ulang menghasilkan angka baru tanpa
mengubah kesimpulan.

Sisa `production.service.ts` **1200 baris**: stage execution/QC (`startProduction`,
`startStage`, `reportBreakdown`, `submitStageLog`, baris 40-348), work order +
material (`createWorkOrder`, `issueMaterial`, `flagShortage`, ~170 baris), blok
audit + machine (`596-880`, 285 baris — punya satu rujukan ke luar,
`calculateCOPQ`), dan ekor berkas (`@OnEvent` + formula adjustment, ~74 baris;
ditunda karena urutan registrasi handler event load-bearing).

---

## 12. Slice keenam: stage execution (`e735316b`)

Slice ini yang sejak awal dinamai rencana refactor — `ProductionExecutionService`.
Isinya seluruh lantai produksi: memulai work order, memulai dan menutup stage,
melaporkan breakdown, mengirim stage log, dan angka cost-of-poor-quality yang
diturunkan dari qty reject log tersebut.

Ia juga slice pertama yang **bukan satu rentang bersebelahan**. Empat metode
eksekusi ada di baris 42-350; `calculateCOPQ` — satu-satunya metode yang mereka
panggil pada dirinya sendiri — sendirian di 814-881.

| Slice | Sumbu | Rentang | Baris keluar |
|---|---|---|---|
| finance-report | kemutakhiran | satu | 527 |
| production-analytics | kemutakhiran | satu | 1187 |
| batch record | satu tipe record | satu | 412 |
| production planning | kapan pekerjaan berjalan | satu | 554 |
| schedule actuals | mencatat hasil | satu | 458 |
| **stage execution** | **lantai produksi** | **dua** | **377** |

Memindahkan metode melintasi celah 460 baris hanya aman karena satu pengukuran:
`calculateCOPQ` punya **tepat satu** pemanggil di luar badannya — baris 293, di
dalam `submitStageLog`. Dua pemanggil, dan slice ini harus ikut membawa yang
kedua. Skrip extractor sekarang mengasersikan pemanggilan tunggal itu, jadi
rentang kedua hanya ikut pindah selama alasannya masih berlaku.

Seam: dua rentang, tidak ada anggota lain di dalam keduanya. `this.X`: `prisma`
(6), `idGenerator` (3), `eventEmitter` (6), `legality` (1), `stateTransition` (1),
`calculateCOPQ` (1, diri sendiri, ikut pindah). Nol rujukan ke kelima nama di luar
rentang. Nol pemakaian `Logger` — service baru tidak diberi logger.

`production.service.ts` **1200 → 829** baris; `ProductionExecutionService` **438**.

### 12.1 Empat hal yang ikut keluar karena jadi mati

Pemindahan ini mengosongkan lebih dari satu hal di facade, dan masing-masing
dihapus — bukan dibiarkan sebagai kabel mati:

1. parameter konstruktor `legality` dan `stateTransition` — dipakai
   `submitStageLog` dan tidak ada lagi di kelas 1200 baris itu;
2. `import { LifecycleStatus, Prisma } from '@prisma/client'` — `LifecycleStatus`
   hanya dipakai di dalam blok yang pindah, dan `Prisma` sudah mati sebelumnya;
3. `private readonly logger = new Logger(ProductionService.name)`.

Yang ketiga itu **mati sejak slice sebelumnya**, bukan sejak slice ini: slice
actuals (§11) memindahkan satu-satunya `logBestEffort(this.logger, …)`, dan
akibatnya tidak terlihat waktu itu karena `tsc` tidak mengeluh dan lint hanya
menaikkan *warning*, bukan *error*. Ia ditemukan sekarang karena `tsc` melaporkan
`'logger' is declared but its value is never read` setelah baris bergeser. Ini
ditulis apa adanya: satu slice sebelumnya meninggalkan kabel mati yang tidak
dilaporkan, dan laporan ini tidak mengklaim sebaliknya.

Tiga kabel mati **pra-eksisting** tetap dibiarkan karena bukan akibat slice ini:
`userId` yang tak dipakai di `returnMaterial`, `payload` di `handleInboundReceived`,
dan field `formulaAdjustments`.

### 12.2 Satu asersi extractor yang salah bentuk

Skrip berhenti dengan `ABORT: calculateCOPQ declared 2 times inside the union`.
Asersinya mencacah kemunculan **nama**, sementara nama itu muncul dua kali karena
alasan yang justru menjadi dasar slice ini: sekali sebagai deklarasi, sekali
sebagai pemanggilan internal di baris 293. Dua slice sebelumnya aman karena
metodenya tidak saling memanggil — jadi cacah nama dan cacah deklarasi kebetulan
sama.

Diperbaiki dengan memisahkan keduanya: jumlah **deklarasi** dihitung dengan regex
anggota kelas (dan daftar nama di dalam union diasersikan persis sama dengan yang
diharapkan), sementara rujukan di luar rentang tetap harus nol. Lalu ditambah
asersi positif yang menjadi alasan rentang kedua ikut pindah: tepat satu
`this.calculateCOPQ(` di dalam union. Skrip berhenti sebelum menulis apa pun.

Pelajaran yang sama seperti §11.1 dan §10.1, sekali lagi: asersi yang terbaca
lebih kuat daripada kenyataannya adalah asersi yang paling perlu dicurigai, dan
yang membuatnya aman adalah urutan — semua pemeriksaan sebelum write.

### 12.3 Verifikasi

| Gate | Hasil |
|---|---|
| `tsc --noEmit` | rc 0 |
| `npm run lint` (modul production) | 0 error, 865 warning (pra-eksisting) |
| `npm run test:unit` | **46/46 suite, 522/522 test** |
| `bash scripts/__tests__/run-all.sh` | PASS 26, FAIL 0, SKIP 0 |
| `node scripts/ssot/validate_ssot.js` | 19 pass, 0 fail, CERTIFIED |
| `node scripts/ssot/audit_lifecycle_reconciliation.js` | 14/14 PASS |

### 12.4 Verdict

**BELUM SIAP KIRIM**, tidak berubah. Tiga gate minimum CLAUDE.md yang belum punya
hasil tetap sama sejak §9.5: smoke test live, rollback teruji, dan P03 — merah di
SHA `5de307db` dengan `base_sha` `9229478d`, bukan di HEAD.

Sisa `production.service.ts` **829 baris**, dan nomor barisnya harus diukur ulang
karena sudah bergeser dua kali. Klaster yang masih ada:

- work order + material — `createWorkOrder`, `issueMaterial`, `flagShortage`
- audit + machine — `getPendingAudits`, `submitAudit`, `calculateNextStage`,
  `createMachine`, `getAllRequisitions`, `getMachines`, `getActiveMachines`,
  `resolveQRContext` (`calculateNextStage` dipanggil `submitAudit`, jadi keduanya
  harus satu slice — persis pola `calculateCOPQ` di §12)
- QC + costing + formula — `verifyStageQC`, `returnMaterial`,
  `finalizeWorkOrderCosting`, `assignFormulaToPlan`
- ekor berkas — handler `@OnEvent` + formula adjustment, masih ditunda karena
  urutan registrasi handler event load-bearing

Dua pertanyaan yang belum dijawab dan akan menentukan bentuk slice berikutnya:
apakah `submitAudit` punya pemanggil lain selain dirinya sendiri, dan apakah
`verifyStageQC` menyentuh `calculateNextStage` juga (kalau ya, batas antar-slice
harus digeser). Keduanya diukur dulu, tidak ditebak.
