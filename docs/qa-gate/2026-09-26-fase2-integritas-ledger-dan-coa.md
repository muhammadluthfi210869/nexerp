# QA Gate — Fase 2 Refactor Arsitektur: Integritas Ledger & Standarisasi COA

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Commit: `dc95efb3`
- Status: **BELUM SIAP KIRIM** — lihat bagian 8. Fase 2 lulus seluruh gerbang yang
  relevan, tetapi sertifikasi P03 tetap MERAH (17/21) karena sebab yang sudah
  terdokumentasi sebelum perubahan ini (basis diff beku). Dua keputusan terbuka
  menunggu pemilik: regime COA mana yang kanonik (bagian 6.1) dan pair akun duplikat
  (bagian 6.2).

## 0. Ringkas

Fase 2 dari rencana refactor jangka panjang. Empat defect ditutup, **semuanya diukur
dulu terhadap database live `erp_db_test` (73 akun, 35 journal entry, 70 journal line),
bukan diambil dari laporan audit**. Tiga klaim rencana awal ternyata salah dan
dikoreksi (bagian 7.2).

| # | Defect | Akibat nyata | Status |
|---|---|---|---|
| D1 | Foreign key ledger tidak terindeks | Full scan per dokumen di volume produksi | **FIXED** |
| D2 | `getProfitLoss` membuang akun tanpa parent, lalu membuang `reportGroup` tak dikenal | Laba-rugi selalu nol, tak bisa membedakan dari "tidak ada aktivitas" | **FIXED** |
| D3 | `seedInitialAccounts()` belum pernah jalan (`count() > 0` guard) | WIP → `1401 Uang Muka Pembelian`; FG → `1400 PPN Masukan`; kas → `1100` | **FIXED** |
| D4 | Tiga regime COA saling bertentangan | Akun yang sama, nama berbeda; 25 dari 33 kode di `src/` tidak ada di DB | **TERBUKA — keputusan pemilik** |
| D5 | Pair akun duplikat + 2 akun salah grup | `1103`/`1151` (ASSET) terbaca sebagai beban | **SEBAGIAN** — grup diperbaiki, duplikat sengaja dibiarkan |
| D6 | 305 dari 375 relasi tanpa `onDelete` | Bukan masalah integritas, masalah kehilangan data | **SENGAJA TIDAK DIKERJAKAN** |

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

CLAUDE.md mewajibkan test reproduksi yang GAGAL lebih dulu. Bukti merah yang diambil
sebelum fix apa pun ditulis:

### 1.1 D1 — hitungan indeks sebelum fix

```
journal_entries  → 1 indeks (primary key), 35 baris
journal_lines    → 1 indeks (primary key), 70 baris
accounts         → 2 indeks (primary key + code unique), 73 baris
```

`journal_entries` punya 11 kolom dokumen sumber yang semuanya foreign key nyata
(`soId`, `poId`, `paymentId`, `adjustmentId`, `returnId`, `purchaseReturnId`, `planId`,
`requisitionId`, `invoiceId`, `billId`, `salesInvoiceId`) dan tidak satu pun terindeks.
PostgreSQL hanya mengindeks sisi yang **dirujuk**, bukan sisi yang merujuk; Prisma tidak
menambahkan apa pun. Relasinya terbaca lengkap — `@relation(fields: [x], references:
[id])` — sehingga tidak ada satu pun petunjuk di skema bahwa indeksnya hilang.

### 1.2 D2 — semua 73 akun punya `parentId = NULL`

```
SELECT count(*) FROM accounts WHERE "parentId" IS NULL;  -- 73
```

Builder `getProfitLoss` membuka dengan `if (!acc.parent) return;`, jadi **setiap** akun
dilewati sebelum total dihitung. Laporan kembali sebagai struktur valid berisi nol.
Tidak ada error, tidak ada log. "Tidak ada aktivitas" dan "laporan saya rusak" tidak
bisa dibedakan dari luar.

### 1.3 D3 — lima kode posting tidak ada

```
SELECT code FROM accounts WHERE code IN ('1121','1153','1154','1157','6224');
-- 0 rows
```

`seedInitialAccounts()` — fungsi yang ditulis untuk membuatnya — membuka dengan
`if (await account.count() > 0) return;`. Seed COA lain sudah mengisi 73 akun lebih dulu,
jadi fungsi ini menjadi **no-op permanen**. Rantai OR di kode posting lalu jatuh ke
akun berikutnya yang ada, dan akun itu tidak berarti hal yang sama:

```
WIP  → 1401 Uang Muka Pembelian (Advance)    [uang muka aset, bukan WIP]
FG   → 1400 PPN Masukan (Input Tax)          [kredit pajak masukan, bukan barang jadi]
kas  → 1100 Kas & Bank (Aset Lancar)         [catch-all, bukan bank]
```

### 1.4 D3 lanjutan — dua kode hantu

`1157` dan `1120` muncul sebagai preferensi pertama di dua rantai OR tetapi **tidak
dibuat oleh seeder mana pun**. Rantai yang membuka dengan kode yang tidak pernah bisa
resolve bukan fallback; itu komentar yang terbaca seperti keputusan.

## 2. Yang Diubah

### 2.1 Skema — `backend/prisma/schema/finance.prisma`

- `Account`: `@@index([parentId])`.
- `JournalEntry`: 11 `@@index` pada kolom dokumen sumber.
- `JournalLine`: `@@index([journalId])`, `@@index([accountId])`,
  `@@index([taxAccountId])`.

`taxAccountId` **tidak ada di daftar awal** — ditemukan oleh gerbang shell baru setelah
regex-nya diperbaiki (bagian 7.1). Itu satu-satunya miss nyata yang ditemukan gerbang.

### 2.2 Migrasi — `backend/prisma/migrations/20260926110000_fase2_ledger_indexes/migration.sql`

Satu file, tiga perubahan:

1. 15 `CREATE INDEX IF NOT EXISTS` (11 + 3 + 1). Idempoten sesuai gaya migrasi lain di
   folder ini, karena `prisma migrate deploy` adalah jalur boot container
   (`backend/init-db.sh`) dan database live dibentuk oleh `db push`.
2. Reklasifikasi `reportGroup`: `1103` dan `1151` dari `OTHER_EXPENSE` → `CURRENT_ASSET`,
   dijaga `type = 'ASSET'` dan `reportGroup = 'OTHER_EXPENSE'` supaya pilihan operator
   yang sudah diubah tidak ditimpa.
3. Satu `INSERT` untuk `6224 Beban Administrasi Bank` — kode posting yang benar-benar
   tidak ada dan benar-benar dibutuhkan, dijaga `WHERE NOT EXISTS`. Memakai
   `gen_random_uuid()` karena kolom `accounts.id` **tidak punya default di database**
   (Prisma menghasilkan UUID di sisi klien, jadi INSERT mentah harus menyuplai sendiri).

**`prisma db push` TIDAK BISA dipakai di database ini** — rencana awal menyebutnya. Ia
mencoba menambahkan kembali `finished_goods_woId_fkey` yang sengaja di-drop migrasi
`20260923200000_relax_p13_p14_legacy_fks`. Karena itu migrasinya SQL mentah, bukan
`db push`.

### 2.3 `backend/src/modules/finance/finance.service.ts`

**`getProfitLoss` — berhenti membuang diam-diam.** `switch` diganti lookup map; penjaga
`if (!acc.parent) return;` diganti pemeriksaan anak. Akun yang tidak bisa ditempatkan
dikumpulkan ke `unplacedAccounts` dengan alasannya:

```ts
type UnplacedAccount = ReportLine & {
  reason: 'REPORT_GROUP_NOT_MAPPED' | 'HEADER_ACCOUNT_HAS_OWN_LINES';
};
```

Alasan kedua disengaja: akun header yang **punya** saldo sendiri berarti barisnya ada di
suatu tempat tetapi tidak akan pernah muncul di laporan, dan itu harus terlihat.

**`seedInitialAccounts()` — penjaga `count() > 0` dihapus, jadi upsert.** `update: {}`
dengan sengaja: akun yang sudah ada mempertahankan nama dan `reportGroup`-nya. Kembalian
`{ created, existing, required }` supaya pemanggil bisa tahu mana yang baru.

**Daftar seed dipangkas dari 12 → 8 entri.** Empat entri dibuang alih-alih dibuat:
`1121` (bank kedua), `1132` (piutang kedua), `1153` dan `1154` (WIP kedua dan barang jadi
kedua). Masing-masing menduplikasi akun yang sudah ada dan berarti hal yang sama
(`1110`, `1200`/`1201`, `1302`, `1303`). Membuat akun paralel memecah saldo ke dua baris
yang tidak bisa dibedakan laporan mana pun. Sisa: `1151`, `2101`, `2102`, `4101`, `4102`,
`6101`, `6224`, `6232`.

**Rantai posting diarahkan ulang** ke akun yang sudah ada dan sudah berarti benar,
semua diukur di 0 journal line sebelum diubah sehingga tidak ada risiko pemecahan saldo:

| Rantai | Sebelum | Sesudah |
|---|---|---|
| WIP (3 titik) | `1302` \| `1153` \| `1401` | `1302` \| `1401` |
| Barang jadi | `1303` \| `1154` \| `1400` | `1303` \| `1400` |
| Bank | `1110` \| `1121` \| `1100` | `1110` \| `1100` |
| Beban selisih stok | `1157` \| `6232` \| `6102` | `6232` \| `6102` |

Pesan error bank ikut diperbarui: `'Finance Accounts (1110/1121 or 6101) not
configured.'`

**SENGAJA TIDAK DIUBAH: bahan baku tetap `1151` lebih dulu.** `1151 Persediaan Barang`
adalah akun tempat 35 journal line yang ada benar-benar berada; `1300 Persediaan Bahan
Baku` tidak memuat satu pun. Nama yang lebih akurat kalah dari kesinambungan data.
Menukarnya ke nama yang lebih baik akan memecah persediaan menjadi dua akun.

**SENGAJA TIDAK DIBUAT: `1157`.** Membuatnya akan memindahkan kerugian selisih stok ke
depan ke akun kosong baru, sementara Rp 26.600.000 yang sudah ada duduk di `6232`. Fix
yang benar adalah menghapus preferensi mati dari rantai, bukan membuat akunnya.

## 3. Test Regresi (permanen)

- `backend/test/unit/finance-coa-integrity.unit-spec.ts` — **6 test, HIJAU.**
  Membuktikan: akun revenue tanpa parent dihitung, bukan dibuang; `unplacedAccounts`
  memuat kode yang tidak bisa ditempatkan; kosong ketika semuanya bisa ditempatkan;
  seed menyentuh setiap kode yang diwajibkan ketika tabel sudah terisi 73 akun
  (reproduksi kondisi live); seed idempoten; dan scan sumber yang menegaskan tidak ada
  lagi preferensi `1157`/`1120` di rantai mana pun.
- `backend/test/finance/coa-seed-integrity.e2e-spec.ts` — **3 test, PASS terhadap
  database live.** Mock tidak bisa membuktikan sebuah baris benar-benar ditulis, jadi
  yang ini menjalankan `seedInitialAccounts()` lewat Prisma nyata dan memeriksa barisnya
  ada, `reportGroup`-nya tidak null, dan `normalBalance`-nya terisi.
- `scripts/__tests__/finance-ledger-indexes.test.sh` — **HIJAU.** Scan statis: setiap
  kolom FK di `JournalEntry`/`JournalLine` harus muncul di `@@index`/`@@unique`, dan
  migrasi `*fase2_ledger_indexes*` harus `CREATE` kelima belas indeks dengan
  `IF NOT EXISTS`. Terdaftar di `scripts/__tests__/run-all.sh`.

### 3.1 Kebocoran residu di e2e — ditemukan dan diperbaiki

Versi pertama spec e2e menyimpan daftar tetap kode yang dibuat (`REQUIRED_CODES`), lalu
`afterAll` menghapus hanya kode-kode itu. Karena `seedInitialAccounts()` membuat lebih
banyak kode daripada yang ada di daftar, satu akun bocor: `1132 Piutang Dagang -
kosmetik`, menaikkan tabel dari 73 → 74.

Residu seperti ini tidak inert: `getTrialBalance` dan laba-rugi membaca **seluruh**
tabel, jadi akun bocor muncul di assertion spec lain. Header
`auto-journal-balance.e2e-spec.ts` sudah memperingatkan mode kegagalan ini persis
("jendela trial balance-nya Jan 1 → sekarang, jadi ia membaca residu").

Perbaikannya: `beforeAll` mengambil snapshot **seluruh** himpunan kode, `afterAll`
menghapus tepat kode yang muncul setelahnya (tetap menolak menghapus akun yang
mendapat journal line di antaranya). Snapshot penuh tidak bisa bocor, seberapa pun
seed tumbuh. Baris `1132` yang sudah bocor dihapus manual dari database test; hitungan
kembali 73 → 74 setelah migrasi membuat `6224`, dan **tetap 74 setelah suite e2e
dijalankan** (bagian 4.2).

## 4. Verifikasi

### 4.1 Suite yang dijalankan

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck backend | `npx tsc --noEmit` | **exit 0** |
| Build backend | `npm run build` | **exit 0** |
| Typecheck frontend | `npx tsc --noEmit` | **exit 0** (0 error TS) |
| Unit backend | `npx jest --config test/jest-unit.json` | **37/37 suite, 328 test** (baseline 36/322) |
| E2E COA seed | `--config test/jest-e2e.json coa-seed-integrity` | **3/3 PASS** |
| Gerbang indeks ledger | `scripts/__tests__/finance-ledger-indexes.test.sh` | **✅ 11/11, 3/3, 15 indeks** |
| Suite regresi shell | `bash scripts/__tests__/run-all.sh` | **26 PASS / 0 FAIL** (baseline 25) |
| SSOT contract | `node scripts/ssot/validate_ssot.js` | **exit 0 — CERTIFIED** |
| Lifecycle reconciliation | `node scripts/ssot/audit_lifecycle_reconciliation.js` | **14/14 — VERDICT PASS** |
| Sertifikasi P03 | `node scripts/ssot/certify_p03_phase.js` | **17/21 MERAH** (lihat bagian 8) |

### 4.2 Bukti idempotensi migrasi dan bebas residu

```
node scripts/_apply-migration.cjs …fase2_ledger_indexes/migration.sql   → applied
node scripts/_apply-migration.cjs …fase2_ledger_indexes/migration.sql   → applied (kedua kali)
accounts: 74 → 74        # tidak ada duplikasi
6224 present: 1          # INSERT dijaga WHERE NOT EXISTS
```

```
setelah suite e2e dijalankan:
accounts before: 74
accounts after:  74      # tidak ada residu
```

### 4.3 Regenerasi registry

`node scripts/ssot/generate_lifecycle_registry.js` dijalankan karena migrasi baru harus
terdaftar. Tanpa langkah ini lifecycle audit gagal dengan `Missing migration in
registry`. Setelah regenerasi: 14/14, `missing_blocker_count: 0`,
`unexplained_objects: 0`.

### 4.4 Catatan P03 dan working tree

`certify_p03_phase.js` menolak berjalan pada working tree yang kotor: percobaan pertama
gagal di `pre_run_source_integrity` dengan daftar file yang belum di-commit. Karena itu
sertifikasi dijalankan **setelah** commit `dc95efb3`, bukan sebelumnya. Ini mode
kegagalan yang sudah tercatat (gerbang mengukur working tree, bukan commit); angka di
bagian 4.1 dan 8 berasal dari run pasca-commit.

## 5. Yang Sengaja BELUM Dikerjakan

Ditandai eksplisit supaya tidak terbaca sebagai "sudah beres":

1. **Kebijakan `onDelete`.** 305 dari 375 relasi tidak mendeklarasikannya (18,7% punya,
   0 memakai `onUpdate`). Menulis ulang seluruhnya adalah perubahan **kehilangan data**,
   bukan perubahan integritas — cascade yang salah pada relasi yang salah menghapus
   baris yang tidak diminta siapa pun. `journal_lines` → `journal_entries` sudah cascade,
   dan itu yang penting di sini. **Tambahkan per-modul, dengan pemilik keputusan.**
2. **Konsolidasi tiga regime COA.** Lihat bagian 6.1.
3. **Pair akun duplikat dan 55 akun yang tidak dirujuk kode mana pun.** Lihat bagian 6.2.
4. **Pembersihan `enums.prisma`.** Rencana awal menyebut "82 enum, 10+ tidak terpakai,
   `UserRole` duplikat". Diukur ulang: **93 enum, hanya 3 tidak terpakai**
   (`QualityStage`, `RejectReason`, `StateEventTrigger`), dan `UserRole` didefinisikan
   **tepat satu kali**. Klaim rencananya salah; tidak ada churn yang sepadan.
5. **`onUpdate` pada 375 relasi.** Tidak ada satu pun yang mendeklarasikannya. Bukan
   masalah yang diukur Fase 2.

## 6. Keputusan Terbuka (butuh pemilik, bukan migrasi)

### 6.1 D4 — Regime COA mana yang kanonik

Tiga regime hidup bersamaan:

| Regime | Contoh | Di mana |
|---|---|---|
| 4 digit | `1100`, `1200` | database (73 akun) |
| 5 digit `(P15)` | `11100`, `11300`, `41100` | database (campuran, nama berakhiran "(P15)") |
| Peta frontend sendiri | `frontend/src/lib/coa-utils.ts` | hardcoded di frontend |

**25 dari 33 kode COA yang dirujuk `backend/src` tidak ada di database.** Nama di
`coa-utils.ts` berbeda dari nama database untuk **minimal 5 kode**.

Bug konkret yang ikut ditemukan: `frontend/src/app/(dashboard)/finance/bank-accounts/page.tsx:88,104`
meng-hardcode `glAccountCode: "11300"`, yang di database berarti
**"Piutang Usaha Kontrol (P15)"** — akun bank dipetakan ke akun kontrol piutang.

Ini **tidak** dikerjakan di Fase 2 karena mengubah regime berarti mengubah **akun mana
sebuah angka mendarat**. Itu keputusan akuntansi dengan pemilik, bukan perubahan teknis.
Yang dibutuhkan dari pemilik: regime mana yang kanonik, dan apakah `11320`/`11300` di
halaman bank-accounts adalah bug yang harus diperbaiki sekarang.

### 6.2 D5 — Pair akun duplikat

Nama identik: `1200`/`1201`, `1303`/`1304`, `1401`/`1402`, `1501`/`1502`, `2201`/`2202`,
`4101`/`4102`. Nyaris duplikat: `4001`/`4100`, `5103`/`5110`.

Tidak dihapus: **menghapus akun yang memegang saldo menghancurkan riwayat.** Pair-pair
ini dibiarkan sampai regime kanonik dipilih di 6.1.

## 7. Catatan Proses

### 7.1 Regex gerbang saya sendiri salah, dan gerbangnya menemukan bug nyata

Versi pertama gerbang shell memakai
`@relation(?:\(\s*"([^"]+)"\s*,)?\s*fields:` — itu hanya cocok untuk relasi **bernama**,
dan melaporkan "JournalEntry: 3 foreign key" padahal ada 11 (tiga yang bernama:
`PaymentToJournal`, `BillJournalEntries`, `SalesInvoiceJournalEntries`).
Setelah diperbaiki menjadi `@relation\(\s*(?:"([^"]+)"\s*,\s*)?fields:\s*\[([^\]]*)\]`,
gerbangnya justru menemukan miss nyata: **`JournalLine.taxAccountId` memang tidak
terindeks**, dan ditambahkan ke skema maupun migrasi. Regresi yang lolos dari
pemeriksaan manual, tertangkap gerbang.

### 7.2 Klaim rencana awal yang dikoreksi oleh pengukuran

1. "3 seed COA yang bertentangan dengan hanya 6 akun" — **understate.** Kenyataannya 73
   akun live, tiga **regime**, dan 5 dari 23 kode yang dirujuk hilang.
2. "82 enum / 10+ tidak terpakai / `UserRole` duplikat" — **salah.** 93 enum, 3 tidak
   terpakai, `UserRole` tunggal.
3. "Terapkan migrasi via `prisma db push`" — **tidak mungkin** di database ini (akan
   menambahkan kembali FK yang sengaja di-drop).

### 7.3 Keputusan yang dibalik sendiri (dan alasannya)

- **`1151` vs `1300`.** Rantai bahan baku sempat dibalik agar memilih
  `1300 Persediaan Bahan Baku` (nama lebih akurat), lalu dikembalikan: `1151` memegang
  35 journal line yang ada, `1300` tidak memegang satu pun. Akurasi nama kalah dari
  kesinambungan data.
- **Membuat `1157`.** Sempat direncanakan, ditolak: akan memindahkan kerugian selisih
  stok ke depan ke akun kosong baru sementara Rp 26.600.000 duduk di `6232`. Fix yang
  benar adalah menghapus preferensi mati, bukan membuat akunnya.

## 8. Verdict

**BELUM SIAP KIRIM.**

Fase 2 lulus seluruh gerbang yang relevan (bagian 4.1): typecheck backend dan frontend
0 error, build backend bersih, 328 test unit hijau, 3 test e2e terhadap database nyata
hijau, 26 gerbang shell hijau, SSOT CERTIFIED, lifecycle 14/14.

Repo secara keseluruhan belum, karena satu alasan yang sama seperti Fase 1:
`certify_p03_phase.js` tetap MERAH — **17/21**, naik dari 16/21 karena
`dna_import_boundary_ast` sekarang lulus. Empat kegagalan yang tersisa:

| Gerbang | Angka | Sebab |
|---|---|---|
| `duplicate_code_scan` | 22,19% > 1% | Basis diff beku `9229478d` (2026-09-18), 598 berkas lama ikut dinilai |
| `changed_complexity_check` | 599 berkas | Basis diff yang sama |
| `dna_native_interactive_scan` | 65 kontrol native di 255 screen | Frontend lama, tidak disentuh Fase 2 |
| `dna_hardcoded_visual_scan` | 22 berkas | Frontend lama, tidak disentuh Fase 2 |

**Tidak ada satu pun dari empat kegagalan itu yang bertambah karena perubahan ini.**
`duplicate_code_scan` justru **turun** 22,23% → 22,19% (daftar seed yang dipangkas).
Fase 2 tidak menyentuh satu berkas frontend pun, jadi kedua gerbang DNA tidak bisa
terpengaruh. `changed_complexity_check` tidak menyebut `finance.service.ts` sama sekali.
Perbaikan basis diff itu adalah **Fase 5** pada rencana, bukan Fase 2.

**Gerbang yang belum bisa dijalankan, dan kenapa:** `scripts/test-deploy.sh` (CI penuh
+ smoke test live) dan **uji rollback** belum dijalankan. Keduanya memerlukan deploy ke
`nexerp.id`, dan commit ini belum di-push maupun diotorisasi untuk push.

Karena itu: pekerjaan Fase 2 selesai dan terverifikasi; sertifikasi P03 tidak berubah
dan tidak boleh diklaim hijau; dan **dua keputusan di bagian 6 menunggu pemilik** —
selama regime COA kanonik belum dipilih, D4 tetap terbuka dan `bank-accounts/page.tsx`
tetap memetakan akun bank ke akun kontrol piutang.
