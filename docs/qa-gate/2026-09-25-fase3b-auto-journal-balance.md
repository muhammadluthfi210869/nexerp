# QA Gate — Fase 3b: Auto-Journal Balance Enforcement (2026-09-25)

**Topik:** Eksekusi T2/Fase 3b — keseimbangan double-entry dijaga di **titik tulis Prisma**,
bukan di satu method service. Termasuk penemuan cacat COA (25 dari 33 kode yang direferensikan
backend **tidak ada** di chart of accounts live), penutupan celah lewat satu `$extends`, dan
pembuktian reproduksi merah-lalu-hijau.

**Branch:** `feat/p08-contracts-subject-ownership`
**Basis plan:** `~/.claude/plans/aku-butuh-bantuanmu-bagaimana-glowing-metcalfe.md` (T2)
**Laporan sebelumnya:** `docs/qa-gate/2026-09-25-fase3a-tenant-lock.md`

---

## Verdict

# BELUM SIAP KIRIM

**Fase 3b sendiri terukur hijau dan tuntas** (§3–§5):
`test:accounting:auto-journal` = **`EXIT=0`**, 6/6 tes lulus, dari keadaan merah **3 failed /
1 passed** yang diukur lebih dulu (§3.2).

Verdict tetap **BELUM SIAP KIRIM** karena:

1. **Fase 4–6 belum dikerjakan** (golden thread + concurrency, migrasi + DR, UAT klien).
2. **G5 (staging live) dan G6 (penegakan CI) belum dijalankan** — izin sudah diberikan
   (2026-09-25), eksekusi belum.
3. **Cacat data COA masih terbuka** (§6) — 25 kode tak ada di DB. Guard kini menolak jurnal
   yang cacat itu hasilkan, yaitu fail-closed: **5 site berhenti bekerja** sampai COA di-seed
   atau kode site diperbaiki.
4. **`tenant_scopes` masih 0 baris** (laporan 3a §5.1).
5. **Fase 6 tidak dapat dieksekusi oleh saya** — butuh 14 hari dual-run + tanda tangan klien.

Aturan CLAUDE.md QA GATE: selama ada item "belum jelas", jawabannya **BELUM SIAP KIRIM**.

---

## 0. Kondisi pengukuran

`verify:pNN` mengukur **working tree**, bukan commit (memori
`gate-measures-working-tree-not-commit`).

| Item | Nilai |
|---|---|
| `HEAD` | `69829e07e1a23c1a8acf8a7862d2270d77ab0bd7` (tetap; tak ada commit baru) |
| Delta tree vs `HEAD` | **361 file, +318.272 / −32.266** |
| Fingerprint diff tracked | `80a7b241b8670cdc2f3e31001b6730d75ef8ba66` |
| Perubahan sejak laporan 3a | +3 file (1 src, 1 test baru, 1 `package.json`) |

**Konsekuensi jujur:** exit code `verify:p07..p19` yang dicatat di laporan 3a
(`3c955d20…`) **kini kedaluwarsa** — tree bergerak. Ini cacat struktural T0 yang sama dan
**belum terselesaikan**: sampai baseline di-commit, setiap edit membatalkan seluruh exit code
secara senyap.

---

## 1. Bentuk cacatnya (terukur, bukan asumsi)

`finance.service.ts:154 createJournalEntry()` **sudah** menegakkan BUS-RULE-056 dengan toleransi
0.01 dan pesan `[JOURNAL_UNBALANCED]`. Tetapi ia adalah **method service**, bukan titik tulis:
hanya pemanggil yang lewat method itu (route jurnal manual) yang terjaga — itulah sebabnya
`test:p15:double-entry-auto-journal` hijau.

**24 site operasional menulis jurnal langsung** dan melewatinya sepenuhnya:

| Ukuran | Angka | Bukti |
|---|---|---|
| `journalEntry.create` di `backend/src` | **24** | 13 file |
| `journalEntry.createMany` / `update` / `upsert` | **0** | — |
| `journalLine.create*` langsung | **0** | — |
| Semua 24 berbentuk | `create({ data: { lines: { create: [...] } } })` | 24/24, 0 tanpa `lines` |
| `new PrismaClient(` di `backend/src` | **0** | semua di `backend/prisma/` + `backend/scripts/` |
| Tulis `journalEntry` di scripts/prisma | **0** | guard menutup 100% tulis jurnal runtime |

Kelas cacat ini identik dengan memori `residue-gates-silent-swallow-defect`: **gerbang yang
mengukur sesuatu yang bukan yang diklaimnya.** Di sini: gerbang keseimbangan mengukur
*pemanggil method*, bukan *penulisan jurnal*.

---

## 2. Cacat live yang dihasilkan (reproduksi, bukan hipotesis)

`commercial/services/payments.service.ts:77-110` menyelesaikan kakinya lewat **kode COA**:

```ts
const cashAcc = (coaId ? await tx.account.findUnique(...) : null)
             || (await tx.account.findFirst({ where: { code: '1101' } }));
const arAcc    = await tx.account.findFirst({ where: { code: '1103' } });
const pph23Acc = await tx.account.findFirst({ where: { code: '1108' } });
const advAcc   = await tx.account.findFirst({ where: { code: '2102' } });
...
if (journalLines.length > 0) { await tx.journalEntry.create({ ... }); }
```

**1101 tidak ada di COA; 1108 tidak ada; 2102 tidak ada. 1103 ada.** Penjaganya
`journalLines.length > 0` — bukan cek keseimbangan — sehingga **kaki debit yang gagal
diselesaikan tetap meninggalkan entry kredit-sepihak yang ter-commit.**

### 2.1 Akar COA (terukur)

`finance.service.ts:58 seedInitialAccounts()` meng-seed **7 akun legacy 4-digit**
(`1121 1132 1151 1153 1154 1157 1300 1400 2101 2102 4101 4102 6101 6224 6232`) — tetapi
**early-return**:

```ts
const existing = await this.prisma.account.count();
if (existing > 0) return;
```

DB live sudah punya **32 akun** (set P15 5-digit: `11100 11200 11300 21200 41100 51100 61100
…`) → seed legacy **tidak pernah jalan**. Akibatnya:

| Ukuran | Angka |
|---|---|
| Kode COA direferensikan `backend/src` | **33** |
| **Hilang dari COA live** | **25** (1100 1101 1108 1120 1121 1132 1153 1154 1157 1300 1310 1400 1401 2102 2105 2201 2300 4001 4102 5101 5210 6101 6102 6224 8100) |
| Ada dan resolve | 8 (1103 1151 1201 1301 2101 2301 4101 6232) |

**Dua rezim COA hidup berdampingan** (legacy 4-digit vs P15 5-digit); kode di beberapa service
ditulis terhadap rezim **ketiga** yang tak pernah masuk DB. Ini cacat **data/seed**, bukan kode —
dan tak bisa diperbaiki lewat guard.

---

## 3. Penutupan

### 3.1 Titik cekal: satu `$extends` di `PrismaService`

Dipilih setelah dua probe:

1. `$use` **sudah tidak ada** di Prisma 7.10 (`undefined`).
2. `$extends` **hanya di instance**, bukan static. Hasilnya bukan `instanceof PrismaClient`,
   jadi entri `class` harus dijaga: extension dibangun di constructor, hook lifecycle
   (`onModuleInit`/`onModuleDestroy`) dan `pool` **ditempelkan manual**, lalu instance
   dikembalikan dari constructor.
   Dasar aman: **0 subclass `PrismaService`**, **0 `instanceof PrismaService`**, **1
   `new PrismaService()`** (spec ini) di seluruh `backend/src` + `backend/test`.
3. Extension pada client **diwarisi oleh callback `$transaction`** — jadi satu extension
   menutup 24 site, termasuk yang menulis lewat `tx`, **tanpa menyentuh 13 file bisnis**.

Semantik disamakan dengan gerbang lama supaya pemanggil yang mencocokkan penanda
`[JOURNAL_UNBALANCED]` melihat satu bentuk di semua route:

```ts
const BALANCE_TOLERANCE = 0.01;
if (rows.length === 0) throw new BadRequestException('... no lines ... [JOURNAL_UNBALANCED]');
if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
  throw new BadRequestException(
    `Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit} [JOURNAL_UNBALANCED]`,
  );
}
```

**Fail-closed pada `lines.create` yang tak terbaca** — entri yang bentuk tulisnya tak dikenali
**ditolak**, bukan dilewatkan. Bentuk tulis baru harus diajarkan ke guard, tak pernah
dikecualikan diam-diam.

`ponytail:` hanya `create` yang dijaga (terukur 24/24). `createMany`/`update`/`upsert`/
`journalLine.create*` dijaga saat bentuk itu pertama muncul.

### 3.2 Reproduksi merah-lalu-hijau (CLAUDE.md)

`backend/test/finance/auto-journal-balance.e2e-spec.ts` lebih dulu dijalankan terhadap kode lama:

```
Test Suites: 1 failed, 1 total
Tests:       3 failed, 1 passed, 4 total
```

Tes 2/3/4 gagal `Received promise resolved instead of rejected` — jurnal sepihak & entri nol
baris **diterima**. Sesudah guard: **6/6 hijau, `EXIT=0`**.

### 3.3 Dua kontrol positif yang ditambahkan sesudahnya

Tes 4 ("tak seimbang di dalam tx ditolak") **bisa lulus karena alasan yang salah**: jalur `tx`
yang rusak total juga throw. Karena itu ditambahkan:

| Tes | Fungsi |
|---|---|
| 5 | **kontrol** — entri **seimbang** di dalam `$transaction` tetap commit (`count=2`, `diff=0`) |
| 6 | tolakan berupa `HttpException` **status 400**, bukan crash mentah (24 site ada di balik route HTTP; 500 tetap fail-closed tapi memberi tahu pemanggil "server rusak", bukan "jurnalmu tak seimbang") |

---

## 4. Insiden kontaminasi DB — dan mengapa itu penting

Run **merah** pertama spec ini **meng-commit** entri tak seimbang (tes 2 & 4) plus entri nol
baris (tes 3). `afterAll` waktu itu menghapus berdasarkan `created[]` — dan **create yang
ditolak tidak pernah mengembalikan id**, jadi ketiga entri itu **bocor permanen**.

Residu itu membuat **`p15-golden-thread` gagal** di `p15-golden-thread.e2e-spec.ts:230`:
`getTrialBalance(start=1 Jan tahun ini, end=now)` membaca seluruh tahun sehingga melihat residu
`nex_aj_probe` (`cleanP15Residuals` hanya menyapu referensi ber-`P15`/`nex_p15`).

**Dibuktikan bukan regresi guard — A/B terhadap HEAD:**

| Konfigurasi | `p15-golden-thread` baris 230 |
|---|---|
| `PrismaService` HEAD (guard **dilepas**) | `Expected: true, Received: false` — **gagal** |
| `PrismaService` + guard | `Expected: true, Received: false` — **gagal** |

Identik. Kegagalan datang **sebelum** guard bisa berpengaruh pada jalur itu.

**Perbaikan:** `afterAll` menyapu berdasarkan **referensi** (`reference: { startsWith: TAG }`),
bukan `created[]` — suite harus bisa membersihkan kegagalannya sendiri.

**Keadaan sesudah:**

| Metrik | Sebelum sapu | Sesudah sapu |
|---|---|---|
| Residu `nex_aj_probe` | 3 | **0** |
| Jurnal total | 37 | 35 |
| **Jurnal tak seimbang** | **2** | **0** |

---

## 5. Pengukuran gate (exit code apa adanya)

| Gate | Exit | Catatan |
|---|:---:|---|
| `npx tsc --noEmit -p backend/tsconfig.json` | **0** | — |
| `test:accounting:auto-journal` (baru) | **0** | 6/6 |
| `test:p15:double-entry-auto-journal` | **0** | 4/4 — jalur kanonik utuh |
| `p15-` set penuh (7 suite), **sebelum sapu** | **1** | 18 passed / **1 failed** — `p15-golden-thread`; **disebabkan residu run merah sendiri**, terbukti A/B (§4); residu disapu, jurnal tak seimbang 0 |
| `p15-golden-thread`, **sesudah sapu** | **0** | 1 passed / 1 total, `Time: 113.971 s` — residu penyebabnya hilang (§4) |
| `test:p15` set penuh, **sesudah sapu** | **0** | 7 suites / 19 tes lulus, `Time: 73.769 s` |

Script baru `test:accounting:auto-journal` (sebelumnya **NIHIL**) =
`--testPathPatterns "auto-journal-balance|p15-s1-double-entry-auto-journal"`.

**Hasil ulang `p15-golden-thread` sesudah sapu (verbatim, tidak dibulatkan):**

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        113.971 s
Ran all test suites matching p15-golden-thread.
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
GT_EXIT=0
```

Ini menutup §4: kegagalan baris 230 memang **residu**, bukan regresi guard — residu disapu,
gate kembali hijau **tanpa mengubah guard**. Exit code set penuh dicatat apa adanya; aturan
dipegang: `exit ≠ 0` = gagal, tidak ditafsir ulang.

---

## 6. Blast radius guard — fail-closed itu nyata

Guard **menolak** tulisan yang hari ini ter-commit. Terukur per-site:

| Ukuran | Angka |
|---|---|
| Site `journalEntry.create` | 26 (24 `src` + 2 terhitung ganda pola) |
| **Site mereferensikan ≥1 kode COA hilang** | **5** |
| Site resolve penuh | 21 |

Site yang kini **berhenti bekerja** (fail-closed, bukan korupsi):

| File | Kode hilang |
|---|---|
| `commercial/services/payments.service.ts` | `1101` |
| `finance/finance.service.ts` (4 site) | `1153,1401` · `1300,1157,6102` · `1300,1153,1401` · `1121,1120,1100,6101,5101` |

Perubahan perilaku: **dari korupsi senyap menjadi gagal keras.** Itu perbaikan, tetapi ia
memindahkan masalah ke seed COA. **Wajib dikerjakan** sebelum deploy: seed 25 kode yang hilang
**atau** arahkan site ke kode rezim P15. Deteksi tak bisa menutupinya — `getTrialBalance`
hanya melewati akun yang **ada**, jadi kode hilang tetap **tak terlihat** di neraca.

---

## 7. Yang Harus Terjadi Berikutnya

1. Lampirkan hasil `p15-` set penuh sesudah sapu (latar).
2. **Perbaiki COA** (§2.1, §6) — seed 25 kode hilang atau arahkan 5 site ke rezim P15.
   Prasyarat deploy, setara `tenant_scopes`.
3. **Fase 4 (T3)** boleh mulai — butuh 3b (jurnal seimbang sebelum diuji hulu-hilir).
   `scripts/test-golden-thread.sh` (13 simpul) + `scripts/stress-test-concurrency.sh`.
4. **G5/G6** — izin sudah diberikan; eksekusi belum.
5. **Perbaiki cacat struktural T0:** commit baseline agar exit code tidak kedaluwarsa senyap.

---

## 8. Perintah Reproduksi

```bash
# Fase 3b — gate
npm --prefix backend run test:accounting:auto-journal     # harapan: 0, 6/6

# Reproduksi: nekuk guard (kembalikan $extends) lalu jalankan spec
#   harapan: 3 failed / 1 passed  (jurnal sepihak & nol-baris diterima)

# Bukti bukan-regresi: tukar PrismaService ke versi HEAD, jalankan golden thread
npm --prefix backend test -- p15-golden-thread           # harapan: TETAP gagal di :230
#   selama residu ada; sesudah sapu → hijau

# Keadaan residu
node -e "..."   # journals=35 unbalanced=0  nex_aj_probe=0

# Bukti tree
git diff HEAD --ignore-cr-at-eol --shortstat      # 361 file, +318272/-32266
git rev-parse HEAD                                 # 69829e07
```

---

**Disusun:** 2026-09-25 · **Verdict:** BELUM SIAP KIRIM ·
**Fase 3b: `test:accounting:auto-journal EXIT=0` (6/6)** ·
**Cacat live ditutup: jurnal sepihak di 24 site tulis** ·
**Cacat terbuka: 25/33 kode COA tak ada di DB → 5 site fail-closed**