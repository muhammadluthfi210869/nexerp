# QA Gate — T0 Hygiene, G2 Drift, G4 Tangga Gate & Recon Fondasi Tenant (2026-09-25)

**Topik:** Rekonsiliasi artefak generated, penutupan cacat gate `pNN_clean_db.js`, eksekusi
tangga `verify:p09..p19` dengan exit code apa adanya, dan rekon pembatas Fase 3a
(multi-tenant lock) — termasuk penetapan bahwa fondasi tenant **belum ada sama sekali**.

**Branch:** `feat/p08-contracts-subject-ownership`
**Tanggal:** 2026-09-25
**Standar Pengujian:** `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md` &
`docs/legacy-erp/verification/_BATCH_VERIFICATION_PLAN.md`
**Basis plan:** `~/.claude/plans/aku-butuh-bantuanmu-bagaimana-glowing-metcalfe.md` (T0, G2, G4)

---

## Verdict

# BELUM SIAP KIRIM

**Tangga gate kini LENGKAP dan SELURUHNYA HIJAU: 11/11 `EXIT=0`** (§3). Perbaikan sejak
draf pertama laporan ini: `verify:p18` dan `verify:p19` dijalankan ulang atas persetujuan
eksplisit pengguna, pada tree beku yang sama, dan keduanya lulus. Itu **menghapus** sebab
pertama dari verdict sebelumnya.

Verdict tetap **BELUM SIAP KIRIM** karena sebab yang tersisa — semuanya soal **cakupan
fase**, bukan soal gate:

1. **Fase 3a–6 belum dikerjakan.** `P08-B6` masih terbuka: pengguna tenant B masih dapat
   membaca Sample lewat id telanjang, karena tak ada predikat tenant di query mana pun.
2. **Fase 3a tidak bisa dikerjakan sebagaimana direncanakan.** Recon (§4) menemukan
   multi-tenant **tidak punya fondasi sama sekali** di sistem berjalan: tak ada tabel
   `Organization`, tak ada klaim tenant di JWT, tak ada enforcement Prisma, nol baris
   `tenant_scopes`. Menambah `organizationId` ke 25 model P08 tidak akan menutup `P08-B6`,
   dan guard fail-closed yang dipasang hari ini akan menolak **seluruh** pengguna nyata.
   Pengguna memilih **Jalur B** (scope lewat parent `Lead`, sesuai DEC-059 LOCKED).
3. **Produksi berjalan 102 commit di belakang HEAD** (SHA `7a449e0a`, 2026-09-16): tak satu
   pun perbaikan P07–P19 ter-deploy. G5 (staging) dan G6 (penegakan CI) belum dijalankan —
   keduanya ditandai BUTUH IZIN dan izin itu belum diberikan.
4. **Fase 6 tidak dapat dieksekusi oleh saya.** Kriteria lulusnya adalah Berita Acara
   ditandatangani klien setelah 14 hari dual-run — perbuatan klien, bukan kode.

Aturan CLAUDE.md QA GATE: selama ada item "belum jelas", jawabannya **BELUM SIAP KIRIM**.
Yang **selesai dan terbukti** adalah tangga gate + T0 hygiene + G2; yang **belum** adalah
Fase 3a–6.

---

## 0. Kondisi pengukuran (syarat kejujuran exit code)

`verify:pNN` mengukur **working tree**, bukan commit (lihat memori
`gate-measures-working-tree-not-commit`). Maka exit code hanya sah bila tree **tidak bergerak**.

| Item | Nilai |
|---|---|
| `HEAD` | `69829e07e1a23c1a8acf8a7862d2270d77ab0bd7` |
| Commit baseline T0 | `69829e07` — membekukan **16 file** (12 gate `pNN_clean_db.js`, 2 guard test, `run-all.sh`, `frontend/scripts/orphan-routes.mjs`) |
| Delta tree vs `HEAD` | **353 file, +317.547 / −32.099** |
| Fingerprint diff tracked (`git diff HEAD \| git hash-object --stdin`) | `fb14184102192fa85ca45cbae7ab6accf0ffa2fb` |
| Pergerakan selama tangga gate | **NOL** — fingerprint & shortstat identik sebelum dan sesudah |

**Konsekuensi jujur yang harus dicatat:** **tidak ada "SHA beku"** untuk sisa pekerjaan.
Commit baseline hanya membekukan perbaikan gate; **~337 file delta Fase 2 tetap uncommitted**.
Yang beku adalah **tree** pada jendela 12:14–12:22, dibuktikan dengan fingerprint. Ini
kelemahan struktural T0, bukan sekadar catatan kaki: satu edit saja membatalkan seluruh 11
exit code, dan pembatalan itu **senyap**.

---

## 1. T0 — Hygiene Tree (5 item)

| # | Item | Status | Bukti |
|---|---|---|---|
| 1 | Pisah artefak generated dari noise | **Selesai (analisis)** | 3 blob = **bukti/kontrak sah, bukan noise**: `swagger-spec.json` adalah input `sync:types`/`sync-api`; `certify_p03_release.js:337-340` membaca `_p03_test_results.json` setelah `certify_p03_phase.js` meregenerasinya; CI tidak pernah meregenerasi `_LIFECYCLE_REGISTRY.json`. Regenerasi di sini **degenerate** (`base_sha == HEAD` ⇒ `changed_files_scanned: 0`) dan akan menghapus 1500+ catatan clone ⇒ blob adalah **bukti**, dilarang di-untrack |
| 2 | Cacat `pNN_clean_db.js` menelan error | **Selesai** | 12 gate fail-closed; guard `clean-db-gates-fail-closed.test.sh` + `clean-db-admin-connection.test.sh` |
| 3 | Cacat orphan-guard `includes("/x")` | **Selesai** | `frontend/scripts/orphan-routes.mjs` → pencocokan `href` exact/ancestor |
| 4 | Commit baseline + catat SHA | **Sebagian** | SHA `69829e07` ada, tetapi hanya 16 file; 353 file delta tetap uncommitted |
| 5 | `run-all.sh` wajib hijau | **Selesai** | `PASS: 15  FAIL: 0  SKIP: 0`, `SUITE_EXIT=0` |

**Angka orphan (setelah perbaikan item 3):** 276 halaman, 113 `href` sidebar unik,
**149 orphan**, **136 di antaranya tanpa rujukan literal di mana pun**. `/dashboard` memang
tidak ada di sidebar.

---

## 2. G2 — Drift Foreign Key: **disengaja, bukan cacat**

`prisma migrate diff --from-config-datasource --to-schema prisma/schema --exit-code` → **EXIT=2**
dengan tepat dua perbedaan: `finished_goods.woId` dan `qc_audits.stepLogId`.

Akar: migrasi `20260923200000_relax_p13_p14_legacy_fks` **menjatuhkan keduanya dengan sengaja**
sebagai perbaikan P2003 P13/P14 (`docs/qa-gate/2026-09-24-fase1-build-stabilization.md` §2.B).
FK menunjuk tabel yang salah: P13 menulis id `production_logs` ke `qc_audits.stepLogId` sedangkan
FK menuntut `production_step_logs`; P14 menulis id `work_orders` ke `finished_goods.woId`
sedangkan FK menuntut `production_plans`.

| | tabel | punya kedua FK |
|---|---|---|
| lokal `erp_db_test` | 208 | **tidak** (pasca-drop, benar) |
| produksi `erp_database` | 195 | **ya** (pra-drop, basi) |

**Lokal yang benar, produksi yang basi.** `ADD CONSTRAINT` telanjang gagal
(`violates foreign key constraint`) karena `finished_goods` lokal menyimpan 7 baris `woId`
yatim — dan **tidak boleh** diterapkan. `migrate diff` bukan bagian dari gate `verify:p09..p19`;
hanya `scripts/ssot/lib/p04_gates.js:453` yang menjalankannya. Ini akan mematahkan G6 bila
`migrate diff` ditambahkan ke CI dengan toleransi nol tanpa mengecualikan dua constraint ini.

---

## 3. G4 — Tangga Gate `verify:p09..p19`

**Aturan yang dipegang:** exit code dicatat apa adanya; `exit ≠ 0` = gagal, tidak ditafsir ulang.

| Gate | Exit Code | Verdict | Bukti ringkas |
|---|:---:|:---:|---|
| `npm run verify:p09` | **0** | **PASS** | Backend golden thread 7/7; frontend 18/18; `[P09] test-DB residue: 0`; `[P09] server residue: 0 nex_p09_* databases`; cleanup verified |
| `npm run verify:p10` | **0** | **PASS** | Backend 23/23; frontend 1 file pass; residue 0 |
| `npm run verify:p11` | **0** | **PASS** | Backend 27/27; frontend 1 file pass; residue 0 |
| `npm run verify:p12` | **0** | **PASS** | Backend 20/20; frontend 1 file pass; `P12 clean-db: PASS - 0 residue rows, 0 disposable databases left` |
| `npm run verify:p13` | **0** | **PASS** | Backend 28/28; frontend 1 file pass; clean-db PASS |
| `npm run verify:p14` | **0** | **PASS** | Backend 30/30; frontend 1 file pass; clean-db PASS |
| `npm run verify:p15` | **0** | **PASS** | Backend 19/19; frontend 1 file pass; clean-db PASS |
| `npm run verify:p16` | **0** | **PASS** | Backend 27/27; frontend 1 file pass; clean-db PASS |
| `npm run verify:p17` | **0** | **PASS** | Backend 27/27; frontend 1 file pass; clean-db PASS |
| `npm run verify:p18` | **0** | **PASS** | Backend 22/22; frontend 2 file lulus; `P18 clean-db: PASS - 0 residue rows, 0 disposable databases left` |
| `npm run verify:p19` | **0** | **PASS** | `PHASE P19 DNA COMPLIANCE VERIFICATION: ALL CHECKS PASSED` (32 komponen Dual-DNA diekspor; 4 alias legacy diarahkan ke `/visual-dna*`; 0 tabel telanjang); frontend 1 file lulus; `✓ Compiled successfully in 28.5s`; 266 halaman statis digenerate oleh 11 worker |

**Total backend tes yang terverifikasi lulus di 11 gate: 230** (208 untuk p09–p17, ditambah
22 dari p18), ditambah 12 file tes frontend lulus, semuanya dengan residue DB & server = 0.
P19 juga membuktikan **build produksi Next.js berhasil** — sesuatu yang tidak teruji sebelumnya.

**Riwayat p18/p19 — dilaporkan apa adanya, tanpa menghapus jejaknya.** Pada percobaan pertama,
harness Claude Code menghentikan perintah latar karena **memori mesin kritis** saat sesi idle;
`verify:p18` terpotong di dalam `test:p18` dan `verify:p19` tidak pernah mulai, sehingga
keduanya **TIDAK TERUKUR** (bukan lulus, bukan gagal). Notifikasi sistem menyatakan eksplisit
itu **bukan kegagalan perintah** dan melarang menjalankan ulang tanpa diminta. Atas keputusan
eksplisit pengguna, keduanya dijalankan ulang pada **tree yang sama dan tetap beku**
(fingerprint `fb141841…` identik sebelum dan sesudah), secara foreground agar tidak terkena
reaper latar. Keduanya lulus. Kebutuhan memori yang membuat percobaan pertama jatuh tetap
nyata: jest dijalankan dengan `--max-old-space-size=8192` dan p19 memuat `next build`.

---

## 4. Recon Fase 3a — Fondasi Tenant **Tidak Ada**

Ini temuan material terbesar sesi ini, dan ia **mengubah rencana T1**.

**Niat kanonik jelas.** `docs/legacy-erp/contracts/01_DOMAIN_MODEL.md` §1.3:
"**Every business entity carries `organizationId`** (UUID, FK to `Organization`). Tenant
isolation is enforced at **Prisma middleware level**." `contracts/schema.prisma:36` mendeklarasikan
`model Organization` (tenant root) dan tiap entitas merujuknya dengan
`@relation(fields:[organizationId], references:[id])` sungguhan.

**Tak satu pun ada di sistem berjalan.** Lima lapis hilang:

| Lapis | Kenyataan terukur |
|---|---|
| Tabel `Organization` + relasi FK | **absen** — tak ada tabel `organizations`/`companies`/`branches` sama sekali; 12 kolom `organizationId` yang ada hanyalah UUID menggantung tanpa FK |
| `users.organizationId` | **absen** (82 user) — keanggotaan hanya lewat `tenant_scopes` |
| `tenant_scopes` (model ada di `platform-controls.prisma:145`) | **0 baris**, tak pernah di-seed; satu-satunya penulis `master/services/personnel.service.ts:170` (alur HR) |
| Klaim tenant di JWT | **absen** — `auth.service.ts:103-108` memuat `{sub, email, roles, sessionId}` saja; `jwt.strategy.ts:60` memetakan `payload.organizationId \|\| payload.tenantId` yang selalu `undefined` untuk login nyata |
| Enforcement Prisma | **absen** — `PrismaService` adalah `PrismaClient` polos; **nol** `$extends`/`$use` di seluruh repo |

**Akibatnya:** tak ada login nyata yang membawa identitas tenant ⇒ `ScopeService.resolveActorScopes`
mengembalikan `[]` untuk setiap pengguna nyata. **Guard tenant fail-closed yang dipasang hari ini
akan menolak seluruh aplikasi.** Sumber tenant dari klien (`req.body.tenantId`/`req.query.tenantId`)
memang sudah **ditolak benar** oleh `platform/policy/policy.service.ts:182` — jadi itu bukan celahnya.

**P08-B6, dinyatakan ulang tepat.** Penolakan lintas-tenant **lewat parent `Lead`** sudah terbukti
(`backend/test/p08/p08-s1-sample-http.e2e-spec.ts:316` → 404). Yang **tak terbukti** adalah
pengguna tenant B membaca Sample lewat id telanjang (`/rnd/inbox`, `/rnd/samples/:id`): query
`rnd.service.ts` (`sampleRequest.findMany`, ~6 titik) **tak punya predikat tenant dan tak punya
kolom untuk dipredikatkan**. Menutupnya butuh lapis 1–5, **bukan** "tambah `organizationId`
ke 25 model P08".

**Dua jalur yang tersedia, keduanya sah secara kontrak:**

- **Jalur A (sesuai plan T1):** bangun fondasi — tabel `Organization` → keanggotaan user → klaim JWT
  → enforcement Prisma → lalu kolom per-model. Mahal, tetapi menutup seluruh kelas cacat, bukan
  hanya P08.
- **Jalur B (doktrin DEC-059, jauh lebih murah):** `DEC-2026-09-20-059` **LOCKED** justru
  menginstruksikan "Scope tenant untuk P08 dibaca melalui parent `Lead`", dan mencatat kolom
  per-tabel sebagai backlog. Terverifikasi bisa: `SampleRequest.lead` adalah relasi **wajib**, dan
  `SalesLead.organizationId` ada ⇒ Prisma dapat memfilter `where: { lead: { organizationId } }`
  **tanpa DDL apa pun di tabel P08**. Nol `findMany` di `rnd.service.ts` yang saat ini memakai klausa itu.

**Keduanya tetap terblokir oleh rantai yang hilang** (tak ada aktor punya tenant), jadi Jalur B pun
butuh minimal: 1 baris `Organization` + keanggotaan per user + klaim JWT.

**Murah dari sisi DDL:** seluruh **15 tabel P08 = 0 baris** di lokal *dan* di produksi ⇒
DDL P08 apa pun murni perubahan skema, tanpa backfill, tanpa risiko data.

**25 model P08 (rnd 9, legal 10, qc 6) — nol punya `organizationId`.** `DEC-2026-09-20-058`
(LOCKED) mengecualikan `RegulatoryPipeline`, `ArtworkReview`, `PNBPRequest` dari cakupan kanonik
P08 ⇒ kolom untuk ketiganya **jangan** ditambahkan.

**Dua nama tabel meleset dari asumsi** (dipakai bila menulis DDL):
`SampleFeedback` → `@@map("sample_feedback")` (tunggal), `MasterInci` → `@@map("master_inci")`.

---

## 5. Yang Harus Terjadi Berikutnya

1. ~~Selesaikan pengukuran p18 & p19~~ — **SELESAI**. Keduanya `EXIT=0` pada tree beku (§3).
2. **Fase 3a — keputusan pengguna: Jalur B.** Scope tenant P08 dibaca lewat parent `Lead`
   (sesuai DEC-2026-09-20-059 LOCKED), **tanpa** DDL di tabel P08. Prasyarat minimum yang
   tetap wajib ada agar klaim isolasi bisa **dibuktikan**, bukan sekadar diklaim:
   1 baris `Organization` + keanggotaan per user + klaim tenant di `auth.service.ts:103-108`.
   Urutan wajib: **tes reproduksi GAGAL dulu** (CLAUDE.md) → prasyarat fondasi minimum →
   predikat `where: { lead: { organizationId } }` di `rnd.service.ts` → tes cross-tenant
   mengembalikan 403.
3. **Tegakkan urutan T1 sebelum T2** (jurnal tanpa tenant akan mencampur buku besar antar-entitas).
4. **Jangan tambahkan `migrate diff` telanjang ke CI** (G6) tanpa mengecualikan dua FK P13/P14.
5. **G5/G6 masih BUTUH IZIN.** Push → CI → image GHCR per-SHA → staging `nexerp-staging`
   di VPS, lalu penegakan CI. Belum ada izin; jangan mulai.

---

## 6. Perintah Reproduksi

```bash
# T0 item 5
bash scripts/__tests__/run-all.sh                       # harapan: PASS: 15  FAIL: 0  SKIP: 0

# G2
cd backend && npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --exit-code
# harapan: 2 (dua FK P13/P14 — disengaja, lihat §2)

# G4
npm run verify:p09   # ..s/d..  npm run verify:p19     # catat $? APA ADANYA

# Bukti tree beku
git diff HEAD --shortstat
git diff HEAD | git hash-object --stdin                # fb14184102192fa85ca45cbae7ab6accf0ffa2fb

# Recon tenant (read-only)
grep -rn 'organizationId' backend/prisma/schema/*.prisma
grep -rn '\$extends\|\$use' backend/src/
sed -n '103,108p' backend/src/modules/auth/auth.service.ts
```

---

**Disusun:** 2026-09-25 (revisi 1 — p18/p19 dilengkapi) ·
**Verdict:** BELUM SIAP KIRIM · **Tangga gate: 11/11 PASS** · Fase 3a–6 belum dikerjakan