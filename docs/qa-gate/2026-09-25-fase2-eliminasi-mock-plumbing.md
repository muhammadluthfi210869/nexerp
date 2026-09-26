# QA Gate — Fase 2: Verifikasi Konektivitas DB↔Backend↔Frontend (2026-09-25)

**Topik:** Eksekusi tangga 6 gate (G1–G6) untuk menjawab keluhan "sistem terasa tidak
nyambung", menutup celah transport/skema/paritas, dan mengukur sisa pekerjaan eliminasi
mock.

**Branch:** `feat/p08-contracts-subject-ownership`
**Tanggal:** 2026-09-25
**Basis plan:** `~/.claude/plans/aku-butuh-bantuanmu-bagaimana-glowing-metcalfe.md`

---

## Verdict

# BELUM SIAP KIRIM

G1, G2, G3, G4 **LULUS** dengan bukti terukur. **G4 kini penuh: 13/13 `EXIT=0`** (`p07`,
`p09`–`p19`, plus `p08`) pada **satu tree**, fingerprint `3c955d20…` identik sebelum/sesudah —
celah §5 item 1 (gate diwarisi antar-tree) **tertutup** (§8.0). Fase 2 juga **mengeliminasi 4
dari 6 fabrikasi nyata**, masing-masing dengan tes reproduksi yang gagal dulu.

Dua koreksi faktual menyusul, karena klaim yang salah di laporan gate adalah cacat gate itu
sendiri: **§7.6** — `unit_smoke` bukan "flaky", ia **selalu** melewati plafon `spawnSync`
180 s (suite 184.25 s); **§7.7** — `SalesTarget` **ada** sebagai model Prisma, yang tidak ada
adalah route-nya.

**Blocker "siap kirim" yang tersisa tinggal dua, dan keduanya butuh izin pengguna**, bukan
pekerjaan: **G5** (uji live di server) dan **G6** (bukti run CI nyata). Dua fabrikasi sisa
terblokir pada backend yang belum lengkap (`SalesTarget` butuh modul; `LeadBatch`/
`LeadAllocation` butuh model). Sesuai CLAUDE.md QA GATE: kalau ada satu item belum jelas →
**BELUM SIAP KIRIM**.

Tidak ada klaim "selesai" pada dokumen ini.

---

## 1. Hasil Tangga Gate

| Gate | Kriteria lulus | Hasil | Verdict |
|---|---|---|:---:|
| **G1** Transport & wiring | satu axios client; nol `localhost` di jalur data produksi; `/api/*`→`/v1/*` konsisten dev+docker+nginx; port diseragamkan | 1 axios client (`frontend/src/lib/api.ts`); **0** `localhost` di `frontend/src` (non-test); `nginx.conf:80-84` `location /api/` + `rewrite ^/api/(.*) /v1/$1`; `next.config.ts:50-51` `/api/:path*`→`${backendOrigin}/v1/:path*`; `api.ts` browser selalu same-origin `/api`, SSR fallback `http://backend:3001/v1` | **PASS** |
| **G2** DB & skema | 24 file `.prisma` valid; model terbaca Prisma client; **nol** drift dua arah | 24 file, **208 model dmmf**, **208 tabel live** (`information_schema`); `prisma migrate diff` bersih kecuali 2 FK yang sengaja dilepas | **PASS** |
| **G3** Paritas FE↔BE | (c) ⊆ (a); nol method-mismatch; tiap selisih terklasifikasi | FE calls tanpa route BE **46 → 0**; method-mismatch **0**; unclassified **0**; bad-target **0**; 76 selisih terkalsifikasi `RENAMED 49 / ABSENT 26 / OUT_OF_SCOPE 1`. Exit code **0** (diambil tanpa pipe) | **PASS** |
| **G4** Gate per fase P07–P19 | tiap `verify:pNN` exit 0 | **12/12 exit 0** — `p07 p09 p10 p11 p12 p13 p14 p15 p16 p17 p18 p19` semuanya **0**, diukur pada **satu tree** bersama `verify:p08`, fingerprint `3c955d20…` beku terbukti (§8) | **PASS** |
| **G5** Uji live E2E di server | ≥1 golden-thread lewat HTTP nyata + baris terbukti di DB | belum dieksekusi | **BELUM** |
| **G6** Penegakan CI | CI jalankan paritas G3 + `verify:p09..p19` + smoke tiap deploy | langkah `verify:p09..p19` **ditambahkan** ke job `push-images`; **belum dibuktikan** lewat run CI nyata | **BELUM** |

### Bukti pendukung lintas-gate

- `bash scripts/__tests__/run-all.sh` → **PASS: 13  FAIL: 0  SKIP: 0**, exit **0**
  (termasuk `clean-db-no-phantom-tables` — penjaga bahwa gate residu tidak bisa
  "menelan" error probe lagi, `validate-env-ci-checkout-safe`, dan
  `no-fabricated-mock-page-guards` — 5 berkas / 24 tes penjaga fabrikasi).
- Backend fabrication scan (`scripts/audit/scan-backend-fabrication.mjs`):
  **0 findings** dari 109 controller / 126 service.
- Frontend fabrication scan (`scripts/audit/scan-frontend-fabrication.mjs`):
  **21 → 18 → 13** findings. Setelah lima perbaikan §7.5, sisa 13 = 7 inisialisasi
  `= []` + 3 `NO_API_INTEGRATION` terbukti false positive/by-design + 1 `ROUTING_SHELL`
  + **2 yang benar-benar berisi dan terblokir pada backend yang belum ada** (§7.5.H).
  Jadi fabrication nyata: **6 → 4 dieliminasi, 2 tersisa dan terblokir di backend**.
- Typecheck: `npx tsc --noEmit -p frontend/tsconfig.json` → exit **0** setelah kelima
  perbaikan (dijalankan berdiri sendiri, tanpa kontensi dengan suite lain).

---

## 2. Defect yang Diperbaiki di Fase 2

### A. [P0] Gerbang P00 mematikan build CI secara struktural

- **Gejala:** `validate_env.js` mewajibkan `.env` **ADA** sekaligus mewajibkan `.gitignore`
  mengabaikannya. Berkas yang di-gitignore + untracked **tidak mungkin** ada di checkout CI,
  sehingga langkah "Security & Secret Gate (P00)" keluar **1 di setiap run**. CI di `main`
  terakhir sukses 2026-09-16; run terakhir (2026-09-20) **FAILURE** 1m42s — sebelum
  certifier dan sebelum push image GHCR. **Tidak ada image yang pernah dibangun sejak itu.**
- **Perbaikan:** `scripts/security/validate_env.js` — validasi `.env` hanya **jika ada**;
  ketiadaan dilaporkan sebagai array string (bukan error). `.env.production.example` tetap
  divalidasi penuh terhadap `REQUIRED_PRODUCTION_KEYS`.
- **Aturan regresi CLAUDE.md:** tes reproduksi yang **GAGAL dulu** →
  `scripts/__tests__/validate-env-ci-checkout.test.sh` (mengunci dua perilaku: exit 0 tanpa
  `.env` = kondisi CI, dan tetap menolak baris `.env` yang rusak). Gagal sebelum fix,
  lulus sesudah. Terdaftar di `run-all.sh` sebagai `validate-env-ci-checkout-safe`.

### B. [P0] Tabel `change_requests` tidak pernah dibuat

- **Gejala (ditemukan G2):** `backend/prisma/schema/system.prisma:149` mendeklarasikan
  `model ChangeRequest` → `change_requests`, dan `system.controller.ts` memakainya di 4
  endpoint (`findMany` x2, `.create`, `.update`), tetapi **tidak ada migrasi** yang pernah
  membuat tabelnya → setiap endpoint gagal runtime `relation change_requests does not exist`.
- **Perbaikan:** `backend/prisma/migrations/20260925100000_p03_reconcile_change_requests/migration.sql`
  (aditif, `CREATE TABLE IF NOT EXISTS`).
- **Catatan penting:** DB lokal dan CI diterapkan lewat `prisma db push` (per CLAUDE.md),
  sehingga **tidak ada baseline `_prisma_migrations`** dan `prisma migrate deploy` gagal
  `P3005`. DDL identik diterapkan langsung ke DB lokal; setelah itu `prisma migrate diff`
  bersih dan tabel live **208 == 208 model**. Migrasi tetap disimpan sebagai artefak resmi
  untuk CI (yang menjalankan `migrate deploy` pada DB bersih).

### C. 2 foreign key yang dilaporkan `migrate diff` = **divergensi sengaja**

`finished_goods_woId_fkey` dan `qc_audits_stepLogId_fkey` dilepas oleh migrasi
`20260923200000_relax_p13_p14_legacy_fks` sebagai **perbaikan** P13/P14 (pelanggaran
`P2003`): alur pelepasan karantina menulis id `work_orders`, sedangkan constraint menuntut
`production_plans`; sebaliknya untuk `production_logs` vs `production_step_logs`. Lihat
`docs/qa-gate/2026-09-24-fase1-build-stabilization.md` §2.B. **Bukan drift** — Prisma
menyelesaikan relasi di kode aplikasi, bukan lewat constraint DB. **Jangan "diperbaiki".**

### D. [P0] Riwayat migrasi tidak mampu membangun ulang skema — CI mustahil hijau

- **Gejala (ditemukan saat merehearsal langkah CI sendiri):** `prisma migrate deploy` adalah
  **jalur boot kanonik** (`backend/init-db.sh:29`) — dijalankan otomatis **setiap kali kontainer
  produksi naik**. Tetapi 51 migrasi di folder itu **tidak bisa** membangun ulang skema saat ini,
  karena DB hidup selama ini diterapkan lewat `prisma db push` (per CLAUDE.md). Diukur dengan
  merehearsal langkah CI persis pada DB bersih `erp_migrate_rehearsal`:

  | | jumlah tabel | `candidates` / `employee_trainings` / `employee_loans` | `sales_orders.netto` |
  |---|---:|---|:---:|
  | **LIVE** (`db push`) | 208 | ketiganya ADA | tidak ada (benar) |
  | **MIGRATIONS ONLY** (`migrate deploy`) | 206 | **ketiganya HILANG** | ada (sisa) |

  Diff `migrate diff --from-config-datasource --to-schema=prisma/schema --script` pada DB
  rehearsal = **210 baris**: 3 `CREATE TABLE`, 22 `ALTER TABLE`, 5 `DROP INDEX`, 3 `ALTER TYPE`,
  1 `DROP COLUMN`, 0 `CREATE INDEX`.
- **Mengapa ini memblokir G6 (bukan kosmetik):** `scripts/ssot/p16_clean_db.js:25` mem-probe
  `candidates`, dan suite e2e P16 menulis ke ketiga tabel itu. Pada DB hasil `migrate deploy`,
  gate itu gagal `relation "public.candidates" does not exist`. **Gerbang P16 tidak mungkin
  hijau di CI** — inilah alasan struktural mengapa CI selama ini menjalankan **nol** `verify:pNN`.
- **Perbaikan:** `backend/prisma/migrations/20260925120000_reconcile_schema_gaps/migration.sql`.
  Semua statement **dijaga** (`IF NOT EXISTS` / `IF EXISTS` / preflight katalog `pg_constraint`
  untuk `ADD CONSTRAINT`, yang tidak punya `IF NOT EXISTS`). Urutannya **setelah**
  `20260923200000_relax_p13_p14_legacy_fks`, dan **tidak** menambah kembali 2 FK yang sengaja
  dilepas (§2.C) — kalau ditambah, alur pelepas karantina P13/P14 rusak lagi.
- **Bukti keamanan di bentuk produksi (wajib, karena ini jalan otomatis saat boot):** migrasi
  dijalankan di **DB live di dalam transaksi lalu `ROLLBACK`** — berhasil tanpa error, dan
  seluruh hitungan **tidak berubah** (208 tabel → 208 tabel, 3 tabel HR tetap ada,
  `sales_orders.netto` tetap tidak ada). Jadi pada DB yang sudah sesuai skema migrasi ini
  **no-op murni**.
- **Bukti di bentuk CI:** `migrate deploy` pada DB rehearsal menerapkannya sebagai migrasi #52
  (exit 0), lalu diff menyusut **210 → 61 baris** — sisanya hanya residu yang memang dinyatakan
  sengaja di bawah.
- **Aturan regresi CLAUDE.md — tes reproduksi GAGAL dulu:**

  | | `p16:clean-db` pada DB hasil `migrate deploy` saja |
  |---|---|
  | **tanpa** migrasi rekonsiliasi | **FAIL** exit 1 — `relation "public.candidates" does not exist`; *"2 probe(s) could not run, residue is UNKNOWN not zero"* |
  | **dengan** migrasi rekonsiliasi | **PASS** exit 0 — *"0 residue rows in public schema"* |

  Penjaga statis baru: `scripts/__tests__/gate-tables-are-migration-created.test.sh`
  (di `run-all.sh` sebagai `gate-tables-are-migration-created`) — invariannya
  **tabel yang di-probe gate ⊆ tabel yang dibuat migrasi**. Terbukti: **exit 1** tanpa migrasi
  (menyebut ketiga tabel), **exit 0** dengan migrasi. Invarian ini yang benar-benar menangkap
  bug ini; membandingkan *model schema* vs migrasi tidak akan menangkapnya, karena ketiga tabel
  itu memang ada di schema.
- **Residu yang SENGAJA tidak diperbaiki** (didokumentasikan, bukan disembunyikan — `migrate diff`
  masih melaporkannya):
  1. 2 FK P13/P14 (§2.C) — memperbaikinya = mengembalikan bug.
  2. ±14 tabel `ALTER COLUMN "id" DROP DEFAULT` — skema mendeklarasikan id sebagai UUID tanpa
     `@default`, sedangkan DB hasil migrasi punya `DEFAULT gen_random_uuid()`. **DB yang lebih
     longgar ini lebih benar** untuk `INSERT` raw SQL tanpa id. Menegakkan `DROP DEFAULT` hanya
     mempersempit tanpa manfaat bagi gate → **di luar lingkup**, dilaporkan apa adanya.
  3. `TIMESTAMP(3)` / `varchar`→`text` — metadata-only; **nol** gate bergantung padanya
     (diverifikasi: `deliveryGateStatus` bertipe `varchar` bukan enum, jadi `SET NOT NULL`
     sudah cukup).
- **Catatan operasional (bukan blocker):** kini ada **dua** migrasi berbeda yang membuat tabel
  `change_requests` (`20260925100000` + `20260925120000`). Karena keduanya dijaga, itu
  **tidak berbahaya** dan tidak memicu drift `_prisma_migrations`. Masalah hanya muncul bila
  seseorang menghapus migrasi lama yang non-idempoten.

---

## 3. Register Temuan Plan Sudah USANG (jangan dikerjakan ulang)

Plan (`aku-butuh-bantuanmu…`) memuat register temuan P0/P1. Verifikasi ulang 2026-09-25
menunjukkan **seluruh item P0 sudah diperbaiki** di working tree:

| Temuan plan | Status nyata | Bukti |
|---|---|---|
| 4 halaman produksi tampilkan mock (KPI dept/individual, project-control, marketing-log-manager) | **SUDAH BENAR** | 0 referensi `MOCK` di keempat file; masing-masing punya panggilan API (`kpi-department` 1, `kpi-individual` 1, `project-control` 2, `marketing-log-manager` 7) |
| 4 operasi tulis FE pasti gagal: `POST/PATCH/DELETE /finance/currencies`, `/finance/taxes` | **SUDAH BENAR** | `finance.controller.ts` kini punya `@Get/@Post/@Patch/@Delete` untuk `taxes` (362/367/373/379) **dan** `currencies` (385/390/396/402) + `@Put('currencies/:id/exchange-rate')` |
| `system/error-dashboard` mati (`/system/errors/summary` + `/timeline` tidak ada) | **SUDAH BENAR** | `system.controller.ts:185 @Get('errors/summary')`, `:190 @Get('errors/timeline')` |
| `verify:p07,p08,p09,p16` tanpa `tsc --noEmit` | **KLAIM SALAH** | Keempatnya **sudah** memuat `npx tsc --noEmit -p backend/tsconfig.json && npx tsc --noEmit -p frontend/tsconfig.json`. Fase 1 sudah menambahkannya (`2026-09-24-fase1-build-stabilization.md` §2.D) |
| Port default `next.config.ts` 3002 vs `api.ts` 3001 | **SUDAH BENAR** | `next.config.ts:46` default `http://localhost:3001`; `api.ts` browser selalu `/api` |
| 3 `localhost` keras FE | **SUDAH BENAR** | 0 hasil di `frontend/src` (non-test) |

Konsekuensi: item P0 di plan **tidak perlu dikerjakan**; plan perlu dikoreksi agar tidak
mengirim pekerjaan hantu.

---

## 4. Triase Scan Fabrikasi Frontend (18 → 13 findings)

Scan awal melaporkan 21 findings; setelah lima perbaikan §7.5 angkanya **13**. Triase jujur
atas 13 yang tersisa:

| Kelas | Jumlah | Penilaian |
|---|:---:|---|
| `STATIC_DATA_ARRAY` dengan `= []` (inisialisasi kosong) | 7 | **FALSE POSITIVE** — `production/{schedule-filling,schedule-mixing,schedule-packaging,filling,mixing,packaging,batch-record-rnd}` semuanya `: T[] = [];` |
| `NO_API_INTEGRATION` karena fetch di **server component** | 1 | **FALSE POSITIVE** — `warehouse/WarehouseDashboardClient.tsx` menerima `initialStats`/`initialAudit` dari `warehouse/page.tsx` (async server component, `fetch(.../warehouse/stats)` + `.../warehouse/audit`, `cache:'no-store'`) |
| `NO_API_INTEGRATION` karena turunan objek nyata | 1 | **FALSE POSITIVE** — `OmniCrmClient.tsx`: `currentUser` ⊆ `authenticatedUser`, `realLead` ⊆ objek `conv.*` hasil query |
| `NO_API_INTEGRATION` halaman referensi desain | 1 | **BY DESIGN** — `visual-dna/page.tsx` = halaman acuan DNA P19; tidak menyentuh API |
| `ROUTING_SHELL` (redirect saja) | 1 | **BUKAN DATA SURFACE** — `marketing/management-task/page.tsx` 61 baris, hanya redirect |
| `STATIC_DATA_ARRAY` berisi data bisnis nyata, **sudah diperbaiki** | 4 | **SELESAI §7.5** — ~~`finance/piutang`~~ (A), ~~`samples/npf`~~ (B), ~~`finance/jurnal`~~ (D), ~~`quality/checklist-category`~~ (E), ~~`quality/checklist`~~ (F) |
| `STATIC_DATA_ARRAY` berisi data bisnis nyata, **sisa** | 2 | **BUTUH BACKEND BARU** — `penjualan/crm-leads` (`INITIAL_BATCHES`), `penjualan/sales-target` (`INITIAL_TARGETS`). Keduanya **tidak punya model Prisma maupun route** (`SalesTarget`/`LeadBatch`/`LeadAllocation` → 0 kecocokan di seluruh `backend/`). Ini bukan plumbing FE: menuntut model + modul + kontrak baru, di luar charter "hubungkan form CUD ke REST yang ada". |

**Kesimpulan triase:** fabrication nyata = **6 file**; **4 sudah dieliminasi** di Fase 2,
**2 tersisa dan terblokir pada backend yang belum ada** (bukan pada UI). Scanner **tidak bisa**
melihat (a) fetch di server component, (b) query via hook yang di-mock, (c) array kosong, dan
(d) **fabrikasi di dalam mapping yang sukses** — pola (d) inilah yang membuat empat dari lima
perbaikan §7.5 tidak terdeteksi sebagai "mock" olehnya. Karena itu **G5 (HTTP nyata) yang
menjadi arbiter**, bukan scan statis.

---

## 5. Yang Belum Selesai (blocker "siap kirim")

1. **G4 sudah dijalankan ulang setelah tree berubah** (**SELESAI, semua exit 0**).
   Pengukuran asli (11/11 = 0) sah hanya untuk tree state `.p04tmp`-chain; lima perbaikan §7.5
   mengubah `finance/*`, `samples/*`, dan `quality/*`, sehingga gate yang menyentuhnya diukur
   ulang: gelombang 1 = `p08=0`, `p15=0`, `p19=0` (setelah perbaikan A–B); gelombang 2 =
   `p14=0`, `p19=0` (setelah perbaikan D–F menyentuh ruang lingkup P14), diambil pada tree beku
   chain `.p04tmp/p2c`. Angka apa adanya ada di §8.
   **Sisa itu kini DITUTUP** — lihat §8.0: seluruh tangga (`p07`+`p09`–`p19`) dijalankan ulang
   pada **satu** tree bersama `p08`, hasilnya **13/13 `EXIT=0`**, fingerprint `3c955d20…` identik
   sebelum/sesudah. Tidak ada lagi gate yang diwarisi dari tree sebelumnya.
2. **G5 belum dieksekusi.** Uji live harus di server, artefak = image GHCR per-SHA,
   tanpa menyentuh `nexerp.id` secara destruktif, RAM VPS 4GB tidak dilanggar.
   Rekomendasi plan: staging stack terpisah (compose project/port/DB volume/nginx port
   beda) dengan SHA yang sama; produksi hanya smoke baca + login.
3. **G6 belum dibuktikan.** Langkah CI sudah ditambahkan tetapi belum ada run CI nyata yang
   menghijaukannya. Penghalang **struktural**-nya sudah dibuka di §2.D (tanpa itu, `verify:p16`
   mustahil hijau di DB hasil `migrate deploy`) — tetapi klaim "CI hijau" tetap **belum**
   terbukti sampai ada run CI nyata. Tambahan yang **diputuskan sengaja**: `push-images`
   **tidak** punya `needs: fast-gate` (`.github/workflows/ci.yml:118-119`). Kedua job dipicu
   `push` ke `main` dan berjalan paralel; `push-images` mengulang sendiri seluruh gate
   (Security/SSOT, paritas G3, `run-all.sh`) sebelum membangun image, sehingga tidak ada gate
   yang **dilewati**. Konsekuensinya: kalau fast-gate merah, image tetap bisa ter-push.
   **Rekomendasi: tambahkan `needs: fast-gate`** agar image yang tidak lolos fast-gate tidak
   pernah masuk registry. **Belum diterapkan** — ini menyentuh jalur deploy, jadi menunggu
   keputusan pemilik repo, bukan diubah diam-diam.
   Utang yang **belum** diuji: e2e P16 di CI mungkin juga butuh **data seed** (bukan hanya tabel);
   rehearsal di §2.D membuktikan tabelnya ada, bukan bahwa suite-nya lulus.
4. **Certifier P03 merah (15/21) — DI LUAR LINGKUP, dilaporkan apa adanya.**
   `scripts/ssot/certify_p03_phase.js:343` menuntut `passed_tests === 21`. Yang gagal:
   `unit_smoke` (**bukan flaky — plafon timeout; lihat §7.6**),
   `duplicate_code_scan` (22.59% vs maks 1%), `changed_complexity_check`
   (392 > 10), dan 3 gate DNA (24 + 22 + 8 file). **Semua mengukur tree P09–P19 yang sudah
   ter-commit**, terhadap `PHASE_BASE_SHA = 9229478d…` yang di-hardcode dan tidak pernah maju
   (kini 97 commit di belakang HEAD). Registry pengecualian DNA tepat di plafon
   **205/205** sehingga tidak bisa menyerap pelanggaran baru. Plan menyatakan
   *"P01–P06 diuji ulang penuh"* **di luar lingkup**, dan `certify_p03_phase.js` adalah
   certifier lama itu. **Tidak ada baseline P03 yang ditulis ulang di fase ini.**
5. **Temuan plan P1 sisa** (46 panggilan FE, registry DNA, dll.) sudah tidak relevan untuk
   paritas (G3 = 0 putus); sisa yang nyata = 45 route BE live yang tidak dipanggil FE
   (backlog, tidak memblokir) dan 26 route `ABSENT`.
6. **Fabrication sisa yang terblokir backend (bukan UI)** — `penjualan/crm-leads`
   (`INITIAL_BATCHES`) dan `penjualan/sales-target` (`INITIAL_TARGETS`).
   **Dikoreksi di §7.7:** klaim "0 kecocokan" salah untuk `SalesTarget` — modelnya **ada**
   (`system.prisma:13` → `sales_targets`); yang tidak ada adalah **route/modul**-nya, dan bentuk
   FE-nya tidak cocok dengan modelnya (`realizedRevenue` tak tersimpan di kolom mana pun).
   `LeadBatch`/`LeadAllocation` memang benar-benar tidak ada. Menuntut modul + kontrak baru →
   di luar charter Fase 2 dan di luar lingkup plan (§7.5.H). **Tidak** dihapus, karena menghapus
   hanya menghasilkan halaman kosong permanen tanpa memindahkan data ke mana pun.
7. **Registrasi penjaga di CI belum ada.** `fabrication-guards.test.sh` sudah terdaftar di
   `run-all.sh` (13/13 PASS lokal), dan `run-all.sh` sudah dipanggil CI — tetapi belum ada
   run CI nyata yang membuktikannya (sama dengan G6).

---

## 6. Perintah Bukti (dapat dijalankan ulang)

```
node scripts/ssot/audit_fe_be_parity.js                 # G3 → exit 0, 46→0 putus
npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema --script   # G2 — DB live: hanya 2 FK sengaja
bash scripts/__tests__/run-all.sh                       # 12 PASS / 0 FAIL
node scripts/audit/scan-backend-fabrication.mjs         # 0 findings
node scripts/audit/scan-frontend-fabrication.mjs        # 13 findings (lihat triase §4)
bash scripts/__tests__/fabrication-guards.test.sh       # 5 files / 24 tes penjaga fabrikasi
npm run verify:p09 … verify:p19                         # G4 — exit dicatat apa adanya
```

Rehearsal bentuk CI (dipakai untuk membuktikan §2.D). Ganti kredensial dengan yang ada di
`backend/.env`; `erp_migrate_rehearsal` adalah DB buangan, aman di-`DROP` kapan saja:

```
# 1. DB bersih, lalu terapkan riwayat migrasi persis seperti CI
DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/erp_migrate_rehearsal?schema=public" \
  npx prisma migrate deploy

# 2. Diff hasilnya terhadap skema — 210 baris SEBELUM rekonsiliasi, 61 sesudah
DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/erp_migrate_rehearsal?schema=public" \
  npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema --script

# 3. Jalankan gate yang membuktikannya (FAIL tanpa rekonsiliasi, PASS dengannya)
DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/erp_migrate_rehearsal?schema=public" \
  node scripts/ssot/p16_clean_db.js

# 4. Penjaga statis: tabel yang di-probe gate ⊆ tabel yang dibuat migrasi
bash scripts/__tests__/gate-tables-are-migration-created.test.sh
```

---

## 7. Langkah Selanjutnya

1. ~~**G4 dijalankan ulang** pada tree state sekarang (lihat §8) — exit code dicatat apa adanya.~~
   — **SELESAI: 13/13 `EXIT=0`** pada satu tree, fingerprint `3c955d20…` beku terbukti (§8.0).
2. ~~Verifikasi ulang `npm --prefix frontend run test` **tanpa** kontensi → pastikan
   `unit_smoke` flaky, bukan regresi.~~ — **SELESAI, dan hasilnya membalik dugaan.** Lihat §7.6:
   suite-nya hijau bersih (75 file / 575 tes, `EXIT=0`) tetapi butuh **184 s**, di atas plafon
   `spawnSync` certifier (180 s). Ia **tidak pernah flaky** — ia **selalu** melewati plafon.
3. Putuskan mode G5 (staging vs tulis ke organisasi `E2E` di DB produksi) **pakai angka
   `docker stats` nyata**, lalu eksekusi.
4. Jalankan CI nyata untuk membuktikan G6.
5. ~~Perbaiki sisa item `PERLU DIPERIKSA` di §4~~ — **4 dari 6 selesai** (§7.5 D–F).
   Sisa 2 (`penjualan/crm-leads`, `penjualan/sales-target`) **terblokir pada backend yang
   belum lengkap** — **dikoreksi di §7.7**: klaim "`SalesTarget` → 0 kecocokan" **salah**, modelnya
   ada (`system.prisma:13`); yang tidak ada route/modulnya. `LeadBatch`/`LeadAllocation` memang
   benar-benar tidak ada. Di luar charter Fase 2 — lihat §7.5.H.
6. ~~Baru tulis ulang verdict dokumen ini.~~ — **SELESAI**: verdict di atas sudah final untuk
   Fase 2. Blocker yang tersisa = **G5 & G6**, keduanya butuh izin pengguna (push → CI → GHCR →
   staging). Sesudah izin, verdict dapat naik.

---

## 7.5 Perbaikan Fabrikasi Fase 2 (charter "eliminasi mock & plumbing")

Charter Fase 2 (`docs/qa-gate/2026-09-24-fase1-build-stabilization.md`) menyebut
"245 file UI berisi data statis". Scan (§4) menunjukkan angka itu **salah** — fabrikasi nyata
adalah **6 file**. **Lima** di antaranya sudah diperbaiki tuntas di fase ini, masing-masing
dengan tes reproduksi yang **GAGAL dulu** per aturan CLAUDE.md. Satu sisanya terblokir pada
backend yang belum ada, bukan pada UI.

Pola yang berulang di kelimanya, dan sebab mengapa scan statis hanya menangkap sebagian:
fabrikasi tidak selalu berupa array keras. Tiga bentuk nyata yang ditemukan —

| Bentuk | Contoh | Terdeteksi scanner? |
|---|---|---|
| (a) literal dirender sebagai fallback saat query kosong/gagal | `quality/checklist` `catch {}` → `INITIAL_CHECKLISTS` | ya |
| (b) literal dipakai untuk memberi label nilai nyata | `finance/jurnal` `STATIC_COA.find(c => c.kode === val)` | ya |
| (c) **default dikarang di dalam mapping yang SUKSES** | `c.defaultDays \|\| 7`, `c.salesOrder?.soNumber \|\| "SO-NEX-001"` | **tidak** |
| (d) KPI tile berisi literal keras | `"24"`, `"84d"`, `"Low"` | **tidak** |

Bentuk (c) adalah yang paling berbahaya: request-nya nyata, response-nya nyata, dan tabelnya
tetap berisi angka yang tidak pernah dikirim backend.

### A. `finance/piutang` — tab AR Hub tidak pernah memanggil API

| | |
|---|---|
| **Gejala** | `ARHubTab` sama sekali **tidak melakukan fetch**. Ia merender dua array keras — `STATIC_SALES_INVOICES` (baris 585) dan `STATIC_SAMPLE_INVOICES` (baris 651) — sehingga permukaan "Penerimaan Piutang" menampilkan **5 faktur rekaan**, klien rekaan (`PT Maju Jaya`, `CV Sejahtera`, `UD Sinar Jaya`), total rekaan dan status rekaan untuk **setiap** penonton, produksi termasuk. |
| **Kontrak nyata** | Tab saudaranya `FakturJualTab` sudah jujur (`GET /finance/invoices`), jadi kontraknya sudah ada dan terbukti. `STATIC_SAMPLE_INVOICES` **tidak punya sumber backend sama sekali** — tidak ada endpoint faktur-sample → satu-satunya pengganti jujur adalah empty state. |
| **Perbaikan** | Hapus kedua array. `ARHubTab`/`FakturJualTab`/`FakturBeliTab` kini memakai `/finance/invoices`, `/finance/ar-hub/pending`, `/bussdev/returns`; empty state jujur; agregat dihitung dari baris nyata. Bug nyata yang ikut ketahuan saat ini: `TypeError: Cannot read properties of undefined (reading 'charAt')` dari `FakturJualTab` yang merender `inv.customer.charAt(0)` → diperbaiki dengan rantai fallback `customerName`. |
| **Tes reproduksi** | `frontend/src/app/(dashboard)/finance/__tests__/piutang-ar-hub-fabrication.test.tsx` — 4 tes: (1) sumber tidak memuat `const STATIC_SALES_INVOICES`/`const STATIC_SAMPLE_INVOICES`; (2) AR Hub merender `INV-ARHUB-LIVE-001` dari `/finance/invoices`; (3) tidak pernah menampilkan `SI-001/SI-005/SSI-001/PT Maju Jaya/CV Sejahtera/UD Sinar Jaya`; (4) empty state jujur. |

### B. `samples/npf` — `MOCK_NPFS` menelan kegagalan request

| | |
|---|---|
| **Gejala** | `MOCK_NPFS` (3 dokumen NPF rekaan: `NPF-202603-001/002/003` untuk "PT Cantika Glow Nusantara", "CV Derma Estetika Mandiri", "PT Miracle Beauty Lab") dikembalikan oleh `useMemo` **setiap kali** query live tidak menghasilkan apa-apa — termasuk ketika request **GAGAL** (suku `catch { return null }` menelan error) dan ketika API jujur melaporkan **nol** baris. Tiga dokumen rekaan itu ikut menggerakkan **KPI tile**. |
| **Kontrak nyata** | `NewProductForm` (`/rnd/npf`) **tidak bisa** menggerakkan tabel ini: ia hanya punya `id/leadId/productName/targetPrice/conceptNotes/status/lead` dan **tanpa `createdAt`**. Field kaya per-sample (tahap, revisi, PIC, kurir, resi, feedback) hidup di `SampleRequest` di balik `GET /rnd/samples` — kontrak yang sama yang sudah dipakai 5 halaman saudaranya. |
| **Perbaikan** | Hapus `MOCK_NPFS` dan `catch` yang menelan error. Baris bersumber dari `GET /rnd/samples` dengan pemetaan eksplisit. Union status rekaan 7-nilai dan union kategori rekaan 4-nilai diganti **`SampleStage` kanonik 11-nilai** (peta label + badge dari `backend/src/modules/system/state-transition.service.ts`). Empat tab digerakkan tahap nyata. Alur buat menjadi jujur: `CustomerSelect` → `POST /rnd/npf` (`leadId`+`productName`+`targetPrice`+`conceptNotes`). Alur feedback menjadi nyata: `PATCH /rnd/sample/:id/advance` yang **digate pada `CLIENT_REVIEW`** — peta transisi kanonik membuktikan itu **satu-satunya** tahap yang menerima keputusan klien, dan tidak ada tahap `REVISION_REQUESTED` di backend. Tombol Excel yang hanya memunculkan toast diganti **unduhan CSV nyata** (Blob). Setiap field tanpa sumber backend merender `—`. |
| **Tes reproduksi** | `frontend/src/app/(dashboard)/samples/__tests__/npf-fabrication.test.tsx` — 4 tes: (1) sumber tidak memuat `MOCK_NPFS`; (2) empty state (`"Tidak ada permintaan sample NPF yang sesuai."`), bukan dokumen mock, saat API mengembalikan kosong; (3) **tidak mengarang dokumen saat request gagal (500)**; (4) merender sample live dan KPI menghitung dokumen live saja (`"1 Dokumen"`). |

### D. `finance/jurnal` — label COA dikarang dari literal, bukan dari COA live

| | |
|---|---|
| **Gejala** | Tab "Auto Journal" melabeli setiap mapping dengan `STATIC_COA.find(c => c.kode === val)` — literal **10 akun rekaan** (`11111 Kas Utama`, `11212 BCA (2640351589)`, `31111 Modal Saham`, `61111 Beban Gaji`, …). Akun live yang tidak ada di literal jatuh ke `"— Not Set —"` **meski mapping-nya terisi**, jadi layar berbohong dua arah. Cacat kedua di halaman yang sama: KPI "Total Jurnal" membaca `stats?.totalTransactions`, kunci yang **tidak ada** di `getAdvancedDashboardStats()` — `metrics.transactions` adalah **array** jurnal terakhir — sehingga tile-nya merender `undefined`. |
| **Kontrak nyata** | `Account` (`prisma/schema`) berfield **`code`/`name`**, bukan `kode`/`nama`. Halaman ini **sudah** memanggil `GET /finance/accounts` untuk tab COA, jadi label bisa diambil dari sana tanpa route baru. |
| **Perbaikan** | `STATIC_COA` dihapus. Label = `accounts?.find(c => c.code === val)` dari respons live yang sudah ada. Kode yang tidak ada di COA merender `"<code> — Nama akun tidak ditemukan"` — jujur, bukan nama karangan. KPI diperbaiki ke `stats?.transactions?.length`. |
| **Tes reproduksi** | `frontend/src/app/(dashboard)/finance/__tests__/jurnal-static-coa-fabrication.test.tsx` — 4 tes: (1) sumber tidak memuat `const STATIC_COA`; (2) mapping dilabeli dari akun **live** dan tidak ada nama hantu; (3) COA live kosong → tidak ada nama karangan; (4) request akun **500** → tidak ada nama karangan. |

### E. `quality/checklist-category` — literal dirender tiga jalan sekaligus

| | |
|---|---|
| **Gejala** | `STATIC_CATEGORIES` (**8 baris rekaan** dengan lead-time rekaan) bisa sampai ke layar lewat **tiga** jalan: `catch {}` yang menelan kegagalan request; respons jujur-kosong; dan — bahkan saat request **SUKSES** — mapper-nya mengarang sendiri (`lama_hari: c.defaultDays \|\| 7` selalu 7 karena `/qc/checklists/categories` hanya mengirim `{id,label,order,gate}`; `setelah: … \|\| "-"`). Empat KPI tile berisi literal keras (`"24"`, `"84d"`, `"18"`, `"Low"`). |
| **Kontrak nyata** | `GET /qc/checklists/categories` → `{id,label,order,gate}` saja. Tidak ada `defaultDays`, tidak ada `afterCategory`. |
| **Perbaikan** | Literal dihapus, `try/catch` dibuang, baris diberi tipe `CategoryRow { lama_hari: number \| null }`; field yang tidak dikirim backend merender `—` (`UNKNOWN`) alih-alih default yang terbaca seperti data. KPI diturunkan dari baris live (atau `—` bila tak bisa diturunkan). Ditambah state error/empty yang jujur di tabel. |
| **Tes reproduksi** | `frontend/src/app/(dashboard)/quality/__tests__/checklist-category-fabrication.test.tsx` — 5 tes; **4 di antaranya GAGAL sebelum perbaikan**. Termasuk satu tes khusus yang menuntut angka `7` **tidak** muncul (lead-time karangan) dan `"84d"`/`"24"`/`"Low"` tidak muncul. |

### F. `quality/checklist` — tiga literal + `catch {}` + identitas SO rekaan

| | |
|---|---|
| **Gejala** | Tiga array keras sekaligus: `INITIAL_CHECKLISTS` (4 SO rekaan — `SO-2026-0512`, `PT Glow Skin Global`, `GlowSkin Aesthetic`), `INITIAL_CATEGORIES` (16 milestone rekaan + departemen rekaan), `INITIAL_MANAGE_CHECKLISTS` (PIC rekaan, catatan kendala rekaan). Tab 1 ditempuh **dua** jalan: `queryFn`-nya dibungkus `catch {}` sehingga request gagal diam-diam jadi literal, **dan** mapper-nya mengarang di dalam respons sukses (`c.salesOrder?.soNumber \|\| "SO-NEX-001"`, `\|\| "PT Glow Skin Global"`, `\|\| "Protokol audit mutu CPKB untuk batch produksi."`). Tab 2 `handleSaveCategory`/`handleDeleteCategory` dan Tab 3 `handleToggleSubItemStatus` hanya mengubah `useState` lokal — tidak ada request sama sekali. |
| **Kontrak nyata** | `GET /qc/checklists` → `QCChecklist + {progress, creator}`. **Kritis:** `qc.prisma` **tidak** mendeklarasikan relasi `salesOrder` pada `QCChecklist` — `salesOrderId` adalah skalar telanjang dan `findAll` hanya `include: { creator }`. Jadi payload itu **tidak memuat nomor SO, nama klien, maupun brand sama sekali**; mengarangnya bukan "fallback", itu menciptakan identitas. `GET /qc/checklists/categories` hanya **GET** — controller tidak punya POST/PATCH/DELETE, jadi tulis kategori memang tidak punya tujuan. `POST /qc/checklists` menerima `{title, workOrderId?, items[]}`; `PATCH /qc/checklists/:id` menerima `{status?, completedItems?, notes?}` — itulah jalur milestone yang nyata. |
| **Perbaikan** | Ketiga literal dan `catch {}` dihapus. Baris dipetakan eksplisit ke `ChecklistItem`; **`salesOrderId` ditampilkan sebagai potongan UUID atau `—`**, tidak pernah disintesis jadi nomor SO. Tanggal tanpa nilai → `—`; milestone dihitung dari `items.length`/`completedItems.length` nyata. Tab 1: buat checklist → `POST` nyata; tab 2: 16 kolom rekaan (departemen, SLA, hari-per-kategori) diganti kolom yang benar-benar ada (`order`, `gate`, `id`), dan tulis/labelnya dinyatakan **read-only** karena route-nya tidak ada. Tab 3: toggle milestone → `PATCH { completedItems }` nyata dengan toast error saat server menolak. State loading/error/empty ditambahkan. |
| **Tes reproduksi** | `frontend/src/app/(dashboard)/quality/__tests__/checklist-hub-fabrication.test.tsx` — 7 tes, **7/7 GAGAL sebelum perbaikan**. Termasuk penjaga khusus "tidak mengarang identitas SO" (`SO-NEX-001`, `PT Glow Skin Global`, `GlowSkin`, `Maklon Baru` harus `null`) dan dua tes yang menuntut `handleDeleteCategory`/`handleSaveCategory` tidak ada lagi di sumber. |

### G. Penjaga regresi terdaftar di suite shell

Kelima penjaga adalah berkas vitest, jadi semuanya dibungkus oleh
`scripts/__tests__/fabrication-guards.test.sh` dan didaftarkan di `run-all.sh` sebagai
`no-fabricated-mock-page-guards` → **5 file / 24 tes, exit 0**. Dengan ini mock tidak bisa
kembali diam-diam tanpa menjatuhkan suite regresi yang diwajibkan CLAUDE.md.

### H. Sisa yang **tidak** dikerjakan, dan alasannya

`penjualan/crm-leads` (`INITIAL_BATCHES`) dan `penjualan/sales-target` (`INITIAL_TARGETS`)
memang berisi data rekaan, dan backend-nya **belum dapat melayaninya** — tetapi alasan yang
tertulis di draf pertama paragraf ini **salah** dan dikoreksi di §7.7. Ringkas: `SalesTarget`
**bukan** model yang tidak ada; ia ada di `system.prisma:13` (→ `sales_targets`). Yang tidak ada
adalah **route/modulnya**, dan bentuk FE-nya tidak cocok dengan modelnya. Lihat §7.7 untuk
angka verifikasinya.

Menghapus literalnya hanya akan menghasilkan halaman kosong permanen; menghubungkannya menuntut
modul NestJS + kontrak baru (dan, untuk `sales-target`, penyesuaian bentuk). Itu **di luar**
charter Fase 2 ("menghubungkan form mutasi CUD ke REST API NestJS" yang sudah ada) dan di luar
lingkup plan. Dibiarkan apa adanya dan dilaporkan di sini, bukan ditutupi.

---

## 7.6 Koreksi: `unit_smoke` bukan flaky — plafon 180 s

§5 item 4 sebelumnya menyebut `unit_smoke` "flaky: vitest bertabrakan dengan gate lain". Itu
**salah**, dan §7 item 2 sudah ditutup dengan pengukuran langsung.

```
$ cd frontend && npm run test
Test Files  75 passed (75)
     Tests  575 passed (575)
  Duration  184.25s
FRONTEND_TEST_EXIT=0      FRONTEND_TEST_SECONDS=186
```

Akar masalahnya di certifier, bukan di suite:

| | |
|---|---|
| `scripts/ssot/lib/p03_analyzers.js:571` | `spawnSync('npm', [...'run','test'], { timeout: 180000 })` |
| Durasi nyata suite frontend | **184.25 s** (wall 186 s) |

Suite-nya **selalu** melewati plafon, terlepas dari kontensi; kontensi hanya memperbesar
selisihnya. Karena `spawnSync` yang kehabisan waktu mengembalikan status non-nol, gate melaporkan
"suite gagal" untuk suite yang sesungguhnya lulus penuh — kelas cacat yang sama dengan
`residue-gates-silent-swallow-defect` di memori: gate melaporkan sesuatu yang tidak ia ukur.

**Tidak diperbaiki di fase ini, dan itu disengaja.** Menaikkan plafon berarti menyunting
`scripts/ssot/lib/p03_analyzers.js`, yaitu certifier P03 lama yang oleh ledger plan dinyatakan
**di luar lingkup** ("P01–P06 diuji ulang penuh" dilarang). Lebih jauh, menaikkan plafon pun
**tidak** akan menghijaukan gate: `changed_complexity_check` (392 > 10), `duplicate_code_scan`
(22.59% vs maks 1%), dan 3 gate DNA tetap merah, dan `PHASE_BASE_SHA` ter-hardcode
`9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb` (§1) sehingga certifier ini tidak dapat hijau tanpa
re-baseline — yang juga dilarang. Dicatat sebagai temuan terukur, bukan diperbaiki.

---

## 7.7 Koreksi: `SalesTarget` **ada** sebagai model Prisma

§5 item 6 dan draf pertama §7.5.H menyatakan `SalesTarget`/`LeadBatch`/`LeadAllocation`
menghasilkan "**0 kecocokan** di seluruh `backend/` (baik `prisma/schema/` maupun
`src/modules/`)". Verifikasi ulang membuktikan separuh klaim itu salah:

| Pencarian | Hasil terukur |
|---|---|
| `model SalesTarget` di `backend/prisma/schema/` | **ADA** — `system.prisma:13`, `@@map("sales_targets")` |
| `model LeadBatch` | 0 |
| `model LeadAllocation` | 0 |
| `SalesTarget` di `backend/src/` (route/service/modul) | **0** — tak ada permukaan HTTP |

Jadi backend **memang tidak dapat melayani** halaman itu (kesimpulan §7.5.H tetap benar), tetapi
**bukan** karena modelnya tak ada — karena **route-nya** tak ada. Dua alasan berbeda, dan yang
kedua lebih murah: modelnya sudah ada dan bermigrasi, sehingga yang dibutuhkan adalah modul
NestJS yang membacanya, bukan model + migrasi baru.

Ada satu hambatan bentuk yang perlu dicatat bila kelak dikerjakan: `SalesTargetItem` di FE
(`page.tsx:41`) membawa `picName`, `picEmail`, `role`, `realizedRevenue`, `notes` — sedangkan
model Prisma hanya punya `userId`, `month`, `year`, `nominalTarget` (+ `createdAt`/`updatedAt`).
`realizedRevenue` tidak tersimpan di mana pun; ia harus dihitung dari pesanan/faktur, bukan
dibaca dari kolom.

**Mengapa tetap tidak dikerjakan di fase ini:** menghubungkan `sales-target` menuntut route baru
+ modul NestJS + turunan `realizedRevenue`, sedangkan `crm-leads` tetap menuntut model
`LeadBatch`/`LeadAllocation` yang benar-benar tidak ada. Keduanya di luar charter Fase 2.
Koreksi ini dicatat karena klaim faktual yang salah di laporan gate adalah cacat gate itu
sendiri — kelas yang sama dengan `residue-gates-silent-swallow-defect` di memori.

---

## 8. Catatan Pengukuran G4 (mengapa §5 item 1 menyebut "tree state")

### 8.0 Penutupan: tangga penuh pada satu tree (2026-09-25, menyusul §7.6–§7.7)

Re-run gelombang 1–2 di bawah hanya menjalankan gate yang **ruang lingkupnya tersentuh**.
Akibatnya tidak ada satu pun pengukuran yang mencakup **seluruh** gate atas satu keadaan tree
yang sama — setiap kali sebuah tree dinyatakan "hijau", selalu ada gate yang diwarisi dari tree
sebelumnya. Itu cacat pengukuran, bukan sekadar catatan kaki.

Ditutup dengan menjalankan **seluruh tangga sekali lagi pada satu tree**, bersamaan dengan
`verify:p08`:

| Gate | Exit | Gate | Exit |
|---|:---:|---|:---:|
| `verify:p07` | **0** | `verify:p14` | **0** |
| `verify:p08` | **0** | `verify:p15` | **0** |
| `verify:p09` | **0** | `verify:p16` | **0** |
| `verify:p10` | **0** | `verify:p17` | **0** |
| `verify:p11` | **0** | `verify:p18` | **0** |
| `verify:p12` | **0** | `verify:p19` | **0** |
| `verify:p13` | **0** | | |

**13/13 `EXIT=0`.** Bukti tree beku: `git diff HEAD | git hash-object --stdin` =
`3c955d20d426e2ee16b709a60ddeb8d6a5f3d90d`, **identik sebelum dan sesudah** — pengukuran tidak
melintasi suntingan apa pun. Gate ini juga membuktikan perubahan **Fase 3a** (klaim tenant di
`auth.service.ts` + guard tenant di seluruh permukaan `/rnd`) tidak meregresikan gate mana pun.

Durasi nyata: ≈ 13 menit untuk dua belas gate (`P07` 14:26 → selesai), bukan berjam-jam seperti
perkiraan sebelumnya — perkiraan itu **keliru** dan dicatat apa adanya.

Catatan di bawah (§8.1–) tetap berlaku sebagai riwayat: ia menjelaskan mengapa re-run parsial
dilakukan sebelum penutupan ini.

### 8.1 Riwayat pengukuran parsial

`verify:pNN` mengukur **working tree**, bukan commit. Karena itu exit code G4 di §1 sah
**hanya untuk tree state saat ia diambil** (`.p04tmp/exits.txt`, chain `bidl808ld`).
Lima perbaikan fabrikasi di §7.5 mengubah tree, sehingga gate yang menyentuh berkas berubah
**kehilangan** buktinya. Aturannya sederhana dan tidak boleh ditafsir ulang:

- exit code dicatat **apa adanya**;
- exit ≠ 0 dilaporkan **gagal**;
- setelah tree berubah, gate yang terpengaruh **dijalankan ulang** dan tabel G4 diperbarui
  dengan angka baru — bukan dengan angka lama yang "seharusnya masih sama".

Re-run yang diwajibkan oleh perbaikan-perbaikan itu, hasil apa adanya:

**Gelombang 1** — setelah perbaikan A (`finance/piutang`) dan B (`samples/npf`), chain `.p04tmp/p2`:

| Gate | Exit code | Cara diambil |
|---|:---:|---|
| `verify:p08` | **0** | `npm run verify:p08` → `.p04tmp/p2/p08.log` |
| `verify:p15` | **0** | `npm run verify:p15` → `.p04tmp/p2/p15.log` |
| `verify:p19` | **0** | `npm run verify:p19` → `.p04tmp/p2/p19.log` |

**Gelombang 2** — setelah perbaikan D–F (`finance/jurnal`, `quality/checklist-category`,
`quality/checklist`) menyentuh `(dashboard)/quality/*` yang merupakan ruang lingkup **P14**,
plus `p19` yang menyapu semua `page.tsx`. Measurement pertama (`chain .p04tmp/p2b`) melintasi
satu suntingan typing terakhir, jadi dijalankan **sekali lagi** pada tree beku
(chain `.p04tmp/p2c`):

| Gate | Exit code | Cara diambil |
|---|:---:|---|
| `verify:p14` | **0** | `npm run verify:p14` → `.p04tmp/p2c/p14.log` |
| `verify:p19` | **0** | `npm run verify:p19` → `.p04tmp/p2c/p19.log` |

Seluruh exit code diambil dari sub-shell `( … ; echo "verify:pN=$?" )` — **tanpa pipe**, jadi
`$?` adalah exit code perintah itu sendiri, bukan exit `tail`. Tidak ada satu pun exit ≠ 0 yang
ditafsir ulang atau disembunyikan: **tidak ada yang gagal untuk dilaporkan.**

**Yang tidak dijalankan ulang, dan mengapa itu sah:** `p09`–`p13` dan `p16`–`p18`. Perbaikan
§7.5 tidak menyentuh berkas mana pun yang masuk ruang lingkup fase-fase itu, dan langkah
`tsc --noEmit -p frontend/tsconfig.json` yang dipakai bersama sudah diverifikasi hijau
berdiri sendiri setelah suntingan terakhir. Ini **bukan** klaim bahwa gate-gate itu hijau
pada tree sekarang berdasarkan pengukuran langsung — hanya bahwa tidak ada alasan terukur
untuk meragukan angka Fase 1-nya. Bila anggaran mengizinkan, jalankan seluruh 11 gate sekali
lagi pada tree beku ini untuk menutup celah itu sepenuhnya.

**Cakupan re-run dan alasannya (jujur, bukan asumsi):** `verify:pNN` memuat dua kelas langkah —
(a) `tsc --noEmit` backend+frontend, dan (b) suite tes fase (unit jest / vitest / e2e).
Perbaikan §7.5 menyentuh berkas di dalam `(dashboard)/finance/*`, `(dashboard)/samples/npf`,
dan `(dashboard)/quality/*`. Yang benar-benar berubah karena itu:

| Gate | Langkah yang benar-benar terpengaruh | Alasan |
|---|---|---|
| `p08` | `tsc --noEmit` frontend, build frontend, `test:p08` (build) | `samples/*` adalah ruang lingkup P08; `samples/npf` di-rewrite (§7.5.B) |
| `p15` | `tsc --noEmit` frontend, `test:p15` (FE) | `finance/*` adalah ruang lingkup P15; `finance/piutang` (§7.5.A) + `finance/jurnal` (§7.5.D) di-rewrite |
| `p14` | `tsc --noEmit` frontend, `test:p14` (FE) | `quality/*` adalah ruang lingkup P14; `quality/checklist` + `quality/checklist-category` di-rewrite (§7.5.E–F) |
| `p19` | `tsc --noEmit` frontend, build + DNA/shell check (menyapu **semua** `page.tsx`) | P19 memeriksa kepatuhan DNA seluruh dashboard; dua `page.tsx` `quality/*` di-rewrite |

`p09`–`p13` dan `p16`–`p18` mengukur suite fase-nya sendiri, yang tidak menyentuh berkas
mana pun di atas; langkah `tsc` mereka tetap ter-cover oleh re-run `p08`/`p14`/`p15`/`p19`
di atas (konfigurasi `tsconfig` sama, dan `tsc --noEmit -p frontend/tsconfig.json` sudah
diverifikasi hijau berdiri sendiri setelah perbaikan terakhir). **Bukan** alasan untuk tidak
menjalankan ulang selainnya bila anggaran mengizinkan — tapi bukan pula alasan untuk memakai
angka lama pada empat gate di atas.

**Catatan kontensi (kejujuran pengukuran):** re-run pertama `p14`/`p19` melintasi satu
suntingan kecil terakhir pada `frontend/src/app/(dashboard)/quality/checklist/page.tsx`
(mengetik `creator` sebagai bagian dari `ChecklistItem` alih-alih `(item as any).creator`).
Suntingan itu **tidak mengubah perilaku** (hasil tes penjaga identik, 24/24 hijau sebelum dan
sesudah), tetapi ia tetap berarti tree berubah **setelah** gate mulai berjalan — jadi
`p14`/`p19` dijalankan sekali lagi pada tree yang benar-benar beku. Angka di tabel di atas
diambil dari jalan terakhir itu.