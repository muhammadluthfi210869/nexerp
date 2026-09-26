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

- **P03 phase certification** — dijalankan setelah commit (`certify_p03_phase.js`
  menolak working tree kotor).
- **Smoke test live** — butuh deploy.
- **Rollback teruji** — butuh deploy.

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
3. **P03 phase certification** — baru bisa setelah commit; terakhir tercatat
   17/21 dengan verdict FAIL pada basis beku `9229478d`, dan itu **tidak boleh**
   diklaim hijau sampai dijalankan ulang di SHA ini.
