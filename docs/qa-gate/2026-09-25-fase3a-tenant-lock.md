# QA Gate — Fase 3a: Multi-Tenant Lock Jalur B (2026-09-25)

**Topik:** Eksekusi T1/Fase 3a sesuai keputusan pengguna **Jalur B** — scope tenant P08 dibaca
lewat parent `Lead` (`DEC-2026-09-20-059` LOCKED), **tanpa DDL** di tabel P08. Termasuk penemuan
dan penutupan celah lintas-tenant nyata di seluruh permukaan `/rnd/formulas`, pembangunan fondasi
tenant minimum (klaim JWT dari `tenant_scopes`), dan pembuktian reproduksi merah-lalu-hijau.

**Branch:** `feat/p08-contracts-subject-ownership`
**Tanggal:** 2026-09-25
**Basis plan:** `~/.claude/plans/aku-butuh-bantuanmu-bagaimana-glowing-metcalfe.md` (T1)
**Laporan sebelumnya:** `docs/qa-gate/2026-09-25-g4-gate-ladder-tenant-recon.md` (§5 item 2 adalah
scope statement yang dieksekusi di sini)

---

## Verdict

# BELUM SIAP KIRIM

**Fase 3a sendiri terukur hijau dan tuntas** (§2–§5): `verify:p08` = **`EXIT=0`**, diukur **dua
kali** — sekali sebelum dan sekali sesudah perubahan auth — dengan hasil identik. Celah
lintas-tenant yang nyata ditemukan dan ditutup, dan penutupannya **dibuktikan dengan tes
reproduksi yang gagal lebih dulu** (§3.2).

Verdict tetap **BELUM SIAP KIRIM** karena:

1. **Fase 3b–6 belum dikerjakan.** Auto-Journal 9-trigger (T2), golden thread + concurrency (T3),
   migrasi + DR rehearsal (T4) belum ada.
2. **G5 (staging live) dan G6 (penegakan CI) belum dijalankan** — keduanya ditandai BUTUH IZIN,
   izin belum diberikan.
3. **`tenant_scopes` masih 0 baris** (§5). Klaim isolasi **terbukti untuk keanggotaan yang di-seed**
   — oleh harness dan oleh spec — **belum terbukti untuk login pengguna produksi**, karena belum
   ada satu pun baris keanggotaan yang bisa dibaca `resolvePrimaryTenant`. Konsekuensinya keras:
   **men-deploy Fase 3a tanpa meng-seed keanggotaan mengubah fail-open menjadi fail-closed —
   layar P08 berhenti bekerja seluruhnya.**
4. **Bahaya deploy `sales-orders.findAll`** (§5.2) tak dapat diukur lokal: tabelnya kosong di sini.
   Ia dicatat sebagai bahaya, **bukan** sebagai fakta teruji.
5. **Fase 6 tidak dapat dieksekusi oleh saya** — butuh 14 hari dual-run + tanda tangan klien.

Aturan CLAUDE.md QA GATE: selama ada item "belum jelas", jawabannya **BELUM SIAP KIRIM**.

---

## 0. Kondisi pengukuran (syarat kejujuran exit code)

`verify:pNN` mengukur **working tree**, bukan commit (memori `gate-measures-working-tree-not-commit`).

| Item | Nilai |
|---|---|
| `HEAD` | `69829e07e1a23c1a8acf8a7862d2270d77ab0bd7` (tetap, tidak ada commit baru) |
| Delta tree vs `HEAD` | **360 file, +318.194 / −32.264** |
| Fingerprint diff tracked | `3c955d20d426e2ee16b709a60ddeb8d6a5f3d90d` |
| Perubahan sejak laporan G4 | +7 file, +647/−165 vs `fb141841…` (§2) |
| Bukti tree beku | fingerprint `3c955d20…` **identik sebelum/sesudah** `verify:p08` (2×) dan tangga 12 gate (§6) |

**Konsekuensi jujur:** semua exit code `verify:p09..p19` yang dicatat di laporan G4
(`fb141841…`) **kini kedaluwarsa** — tree bergerak. Pengukuran ulang tangga dijalankan di latar
(§6); hasilnya dilampirkan apa adanya saat selesai. Ini kelemahan struktural T0 yang sudah
dicatat di laporan G4 dan **belum terselesaikan**: sampai baseline di-commit, setiap edit
membatalkan seluruh exit code secara senyap.

---

## 1. Keputusan scope — Jalur B

**Pengguna memilih Jalur B** (sesi sebelumnya, opsi "Recommended"): scope tenant P08 dibaca lewat
parent `Lead`, sesuai `DEC-2026-09-20-059` LOCKED, **nol DDL** di tabel P08.

Justifikasi terukur (dari laporan G4 §4):
- `SampleRequest.lead` adalah relasi **wajib**, dan `SalesLead.organizationId` **ada** ⇒ Prisma
  dapat memfilter `where: { lead: { organizationId } }` tanpa kolom baru.
- Seluruh 15 tabel P08 = **0 baris** lokal *dan* produksi ⇒ tidak ada risiko data.
- Jalur A (tabel `Organization` + FK + enforcement Prisma) tetap merupakan backlog kanonik, tetapi
  **bukan** yang diminta DEC-059, dan jauh lebih mahal.

**Predikat rantai yang dipakai** (satu per bentuk query — bentuk pendek dan panjang berbeda dan
**tidak boleh** dipertukarkan):

| Tabel target | Predikat |
|---|---|
| `SampleRequest` / `NewProductForm` | `{ lead: { organizationId } }` |
| `Formula` | `{ sampleRequest: { lead: { organizationId } } }` |
| `LabTestResult` | `{ formula: { sampleRequest: { lead: { organizationId } } } }` |

**Cacat yang sempat saya perkenalkan lalu tangkap sendiri:** di `FormulasService.create()` saya
pertama menulis `where: { id: dto.sampleRequestId, ...formulaTenantWhere(actor) }` — fragmen itu
berbentuk **formula** (`sampleRequest.lead.organizationId`), salah untuk query ke `sampleRequest`.
Diperbaiki menjadi `lead: { organizationId: orgId }` eksplisit, dengan komentar yang menamai
perbedaannya.

---

## 2. Change set

| File | +/− | Peran |
|---|---|---|
| `backend/src/modules/rnd/rnd.service.ts` | +352/−84 | `RndActorContext`, `rndActorFromRequest`, predikat tenant di seluruh permukaan sample |
| `backend/src/modules/rnd/formulas/formulas.service.ts` | +142/−33 | **celah baru ditemukan & ditutup** (§3) |
| `backend/src/modules/rnd/formulas/formulas.controller.ts` | +39/−17 | 12 handler meneruskan aktor |
| `backend/src/modules/rnd/rnd.controller.ts` | +64/−39 | handler meneruskan aktor |
| `backend/src/modules/rnd/samples/samples.controller.ts` | +11/−8 | idem |
| `backend/src/modules/rnd/npf/npf.controller.ts` | +8/−8 | idem |
| `backend/src/modules/auth/auth.service.ts` | +31/−1 | `resolvePrimaryTenant()` + klaim JWT (§4) |
| `backend/test/p08/p08-s2-formulation.e2e-spec.ts` | +15/−4 | fixture & token membawa tenant |
| `backend/test/p08/p08-s3-release.e2e-spec.ts` | +24/−11 | idem (termasuk JWT buatan describe rollback) |
| `backend/package.json` | +3/−1 | `test:p08:tenant-isolation` |
| `package.json` (root) | +4/−4 | rantai `verify:p08` |
| `backend/test/security/tenant-isolation.e2e-spec.ts` | (untracked) | suite isolasi, diperluas |
| `backend/test/security/login-tenant-claim.e2e-spec.ts` | (untracked) | reproduksi fondasi tenant |

**Nol DDL. Nol migrasi. Nol perubahan `prisma/schema/`.** Sesuai Jalur B.

---

## 3. Celah lintas-tenant nyata yang ditemukan dan ditutup

### 3.1 Temuan

`FormulasController` **tidak punya scoping tenant sama sekali**. Aktor asing yang memegang id
formula dapat:

- membaca formula tenant lain (`GET /rnd/formulas/:id`),
- menulis ulang komposisinya (`PATCH /rnd/formulas/:id`),
- menjalankan mesin statusnya (`approve`, `request-approval`, `revision`, `lock-production`),
- membaca/menulis hasil lab dan INCI (`lab-tests`, `inci`),
- menyisipkan formula baru ke sample tenant lain (`POST /rnd/formulas`).

Ini kelas cacat yang sama dengan `P08-B6`, tetapi pada permukaan yang **belum tercakup** suite
isolasi saat itu.

### 3.2 Bukti reproduksi (CLAUDE.md: tes GAGAL dulu)

Guard di-nekuk sementara — `formulaTenantWhere` dikembalikan `{}` dan `hasTenant` dikembalikan
`false` — lalu suite dijalankan:

```
Expected: 403, Received: 200
```

Aktor tenant A membaca formula tenant B. Guard dikembalikan, suite dijalankan ulang: **8/8 hijau**.

**Catatan metode:** nekukan dilakukan dengan menyalin dua file ke `.tmp-baseline/`, menyuntik
baris `TEMP PROBE`, menjalankan suite, lalu memulihkan dari salinan. `git stash` gagal
(`error: could not write index`) dan `git checkout --` gagal
(`Unable to create '.git/index.lock': File exists`) karena `.git/index.lock` 0-byte basi tanpa
proses git berjalan. Lock dihapus, backup dipakai sebagai gantinya. Direktori `.tmp-baseline/`
sudah dihapus.

### 3.3 Bentuk penutupan

```ts
export function formulaTenantWhere(actor?: RndActorContext): Record<string, any> {
  const orgId = actor?.organizationId;
  if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
    return { sampleRequest: { lead: { organizationId: orgId } } };
  }
  if (actor?.enforce) {
    throw new BadRequestException({ code: 'TENANT_UNRESOLVED', ... });
  }
  return {};
}
```

Dua detail yang disengaja:

1. **403 dinaikkan SEBELUM `assertMutable`.** `assertMutable` yang memancarkan `FORMULA_LOCKED`;
   bila dipanggil lebih dulu, penolakan justru memberi tahu pemanggil asing bahwa barisnya ada.
   Id yang tidak ada dan id milik tenant lain kini mengembalikan **status yang sama** — tanpa
   konfirmasi keberadaan.
2. **Dua kode berbeda, sesuai arti:** `TENANT_UNRESOLVED` (400) = permintaan HTTP tanpa klaim
   tenant; `TENANT_ISOLATION_VIOLATION` (403) = tenant diklaim, sumber daya milik tenant lain.

### 3.4 Serah-terima yang dibersihkan di suite

`rndB` (aktor asing) kini memegang `['RND', 'HEAD_OPS', 'SUPER_ADMIN']` dengan komentar eksplisit:
*"The foreign actor holds every role the formula routes accept, so a 403 can only come from the
tenant guard — never from the role guard, which would make the isolation assertion pass for the
wrong reason."*

Ini menutup cacat pengukuran yang nyata: sebelum perubahan, `POST /rnd/formulas/:id/approve`
adalah `@Roles(SUPER_ADMIN, HEAD_OPS)` sedangkan `rndB` hanya `RND` ⇒ `RolesGuard` menjawab lebih
dulu ⇒ 403 muncul dengan **alasan yang salah**.

---

## 4. Fondasi tenant minimum

`platform/scope/scope.service.ts` dan `platform/communication/acl.adapter.ts` sudah membaca
`tenant_scopes`; `jwt.strategy.ts:60-61` sudah memetakan `payload.organizationId || payload.tenantId`.
Yang hilang hanya **produsen** klaim. Ditambahkan:

```ts
private async resolvePrimaryTenant(userId: string): Promise<string | undefined> {
  const now = new Date();
  const scope = await this.prisma.tenantScope.findFirst({
    where: { userId, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
    orderBy: [{ primary: 'desc' }, { effectiveFrom: 'desc' }],
    select: { organizationId: true },
  });
  return scope?.organizationId;
}
```

`prisma` sudah ter-inject — **nol dependensi baru**. Bila tak ada keanggotaan, klaim **tidak
ditandatangani** (`...(tenantId ? {...} : {})`), yang memang disengaja: klaim hilang fail-closed di
guard, sedangkan default karangan akan diam-diam memberi akses ke satu tenant.

**Reproduksi merah-lalu-hijau.** `backend/test/security/login-tenant-claim.e2e-spec.ts` dibuat
lebih dulu dan dijalankan terhadap kode lama:

```
expect(decoded!.organizationId ?? decoded!.tenantId).toBe(tenant)
Received: undefined
```

Spec ini menggerakkan `POST /auth/login` **nyata** (password bcrypt nyata via
`ctx.app.get(AuthService).hashPassword`), men-decode token terbitan, lalu membuktikan sesi itu
benar-benar dapat `POST /rnd/samples` untuk lead tenant-nya (201, bukan 400
`TENANT_UNRESOLVED`). Setelah `resolvePrimaryTenant` masuk: **hijau**.

---

## 5. Batas jujur dari yang terbukti

### 5.1 `tenant_scopes` = 0 baris

Isolasi terbukti **untuk keanggotaan yang di-seed** (oleh harness P08 dan oleh spec login), bukan
untuk pengguna produksi — tak ada satu pun baris keanggotaan yang dapat dibaca. **Men-deploy Fase
3a ke produksi tanpa meng-seed `tenant_scopes` akan mematikan seluruh layar P08.** Ini prasyarat
deploy, bukan catatan kaki. Ditulis juga ke memori `tenant-chain-unimplemented`.

### 5.2 Bahaya `sales-orders.findAll` (tak terukur lokal)

Perubahan auth mengubah `user.tenantId` dari selalu-`undefined` menjadi nilai nyata di **28
referensi / 19 file**. Yang paling tajam:

`backend/src/modules/commercial/controllers/sales-orders.controller.ts:34`
→ `findAll({ organizationId: req.user?.tenantId })`
→ `sales-orders.service.ts:110` memasang `where.organizationId = filter.organizationId`
**bila truthy**.

Sebelum perubahan filter itu **selalu tidak terpasang**. Sesudahnya, filter terpasang nyata.
Baris produksi lama membawa `organizationId = NULL` (dulu `tenantId` selalu `undefined` saat
`create` di `sales-orders.service.ts:67`) ⇒ **pesanan lama menjadi tidak terlihat oleh pemiliknya
sendiri**. Tabel `sales_orders`/`sales_leads` **0 baris lokal**, jadi ini **tidak dapat diukur di
sini** — dicatat sebagai bahaya deploy, bukan fakta teruji. Wajib diuji di staging (G5) sebelum
produksi.

### 5.3 Hybrid socket-cap yang terdokumentasi

19 call site di dua suite lama (`test/rnd-audit.e2e-spec.ts`,
`test/rnd-business-process.e2e-spec.ts`) memanggil `rndService.*`/`formulasService.*` **in-process
tanpa aktor** (`enforce` absen ⇒ tak ada `TENANT_UNRESOLVED`, dan tenant juga tak dibawa ⇒ tak ada
predikat). Kedua suite itu **sudah merah di HEAD** karena cacat DI yang tak berhubungan:
`RootTestModule` mencantumkan `LegalityService` tanpa `BussdevService`, sedangkan
`legality.service.ts:111-112` membutuhkannya lewat `@Inject(forwardRef(() => BussdevService))`.
Keduanya **tidak** bagian dari `verify:p08` dan **tidak diperbaiki di sini** — dicatat apa adanya.

---

## 6. Pengukuran gate

### 6.1 `verify:p08` — `EXIT=0`, dua kali

Diukur **dua kali**: sekali sebelum perubahan `auth.service.ts`, sekali sesudah. Hasil **identik**.

| Tahap | Hasil |
|---|---|
| `tsc --noEmit` backend + frontend | **0 error** |
| `test:p08:sample` | **6/6** |
| `test:p08:formulation` | **5/5** |
| `test:p08:creative-legal` | **7/7** |
| `test:p08:tenant-isolation` | **2 suite / 9 tes** |
| `test:p08` (frontend) + `lint:p08` | lulus |
| build backend + frontend | lulus (`✓ Compiled successfully in 74s`) |
| `test:p08:golden-thread` | **7/7** |
| `verify:p08:clean-db` | `test-DB residue: 0` · `server residue: 0 nex_p08_* databases` · cleanup verified |

**`VERIFY_P08_EXIT=0`** — dicatat apa adanya.

### 6.2 Reconilisasi spec s2/s3 (dilaporkan apa adanya)

Pada percobaan pertama sesudah guard dipasang, `s2` gagal **5×** `Expected: 201, Received: 400`
dan `s3` gagal pada describe rollback-nya. Penyebabnya **benar dan diharapkan**: fixture dan token
kedua spec itu tidak membawa tenant, sedangkan guard kini fail-closed. Jawabannya adalah memberi
spec tenant yang kini disyaratkan — bentuk yang `p08-s1-sample-http.e2e-spec.ts` **sudah** pakai
(`tenantA` di token *dan* lead). `s3` juga membuka inkonsistensi laten: describe rollback-nya
mencetak JWT sendiri, sehingga klaimnya harus ditambahkan terpisah di `ctxToken`-nya.

### 6.3 Tangga `verify:p07..p19` — pengukuran ulang

Dijalankan ulang di latar pada tree yang bergerak (§0), karena exit code laporan G4 kedaluwarsa.
Hasil dilampirkan apa adanya saat selesai — **tidak dibulatkan**. Aturan yang dipegang: exit code
dicatat apa adanya; `exit ≠ 0` = gagal, tidak ditafsir ulang.

**SELESAI — 12/12 `EXIT=0`**, diukur pada **tree yang sama** dengan `verify:p08` di §6.1:

| Gate | Exit | Gate | Exit |
|---|:---:|---|:---:|
| `verify:p07` | **0** | `verify:p14` | **0** |
| `verify:p09` | **0** | `verify:p15` | **0** |
| `verify:p10` | **0** | `verify:p16` | **0** |
| `verify:p11` | **0** | `verify:p17` | **0** |
| `verify:p12` | **0** | `verify:p18` | **0** |
| `verify:p13` | **0** | `verify:p19` | **0** |

**Bukti tree beku:** fingerprint `git diff HEAD | git hash-object --stdin` =
`3c955d20d426e2ee16b709a60ddeb8d6a5f3d90d` — **identik sebelum dan sesudah** tangga berjalan.

Ini **pengukuran pertama yang mencakup seluruh tangga pada satu tree**: laporan G4 (§3) mengukur
11 gate tetapi hanya menjalankan ulang gate yang ruang lingkupnya tersentuh, sehingga tak satu
pun pengukuran sebelumnya mencakup semua gate atas satu keadaan tree yang sama. Cacat itu kini
tertutup — dan sekaligus membuktikan bahwa perubahan Fase 3a (auth + guard) tidak meregresikan
gate mana pun.

Konteks biaya: dua belas gate berjalan ≈ 13 menit (`P07` 14:26 → `LADDER_DONE`), bukan berjam-jam
seperti perkiraan awal — perkiraan itu keliru dan dicatat apa adanya.

---

## 7. Yang Harus Terjadi Berikutnya

1. ~~Selesaikan pengukuran ulang tangga~~ — **SELESAI: 12/12 `EXIT=0`** (§6.3), pada tree yang
   sama dengan `verify:p08`, fingerprint beku terbukti.
2. **Sebelum deploy apa pun:** seed `tenant_scopes` (§5.1). Tanpa itu Fase 3a mematikan P08.
3. **Uji `sales-orders.findAll` di staging** (§5.2) terhadap baris ber-`organizationId = NULL`.
4. **T1 selesai ⇒ T2 boleh mulai** — Auto-Journal 9-trigger. T2 **tidak boleh** mendahului T1
   (jurnal tanpa tenant akan mencampur buku besar antar-entitas). `journal-engine.service.ts` 103
   baris, hanya di-import `finance.module.ts`, sedangkan **30 call site di 15 modul** menulis jurnal
   mentah; `test:accounting:auto-journal` belum ada.
5. **G5/G6 masih BUTUH IZIN.** Push → CI → image GHCR per-SHA → staging `nexerp-staging`.
   Jangan mulai tanpa izin.
6. **Perbaiki cacat struktural T0:** commit baseline agar exit code tidak lagi kedaluwarsa senyap
   (§0).

---

## 8. Perintah Reproduksi

```bash
# Fase 3a — gate
npm run verify:p08                       # harapan: 0 (catat $? APA ADANYA)

# Reproduksi isolasi lintas-tenant
npm --prefix backend run test:p08:tenant-isolation    # harapan: 2 suite / 9 tes lulus
npm --prefix backend run test:p08:formulation         # harapan: 5/5
npm --prefix backend run test:p08:sample              # harapan: 6/6

# Reproduksi fondasi tenant (login nyata)
npx --prefix backend jest --config backend/test/jest-e2e.json \
  --runInBand backend/test/security/login-tenant-claim.e2e-spec.ts

# Bukti celah formula: nekuk guard lalu jalankan suite isolasi
#   formulas.service.ts → formulaTenantWhere() ⇒ {}  dan  hasTenant() ⇒ false
#   harapan: Expected: 403, Received: 200      (guard dikembalikan ⇒ 8/8 hijau)

# Bukti tree
git diff HEAD --ignore-cr-at-eol --shortstat          # 360 file, +318194/-32264
git rev-parse HEAD                                     # 69829e07

# Recon tenant
grep -rn '\.tenantId' backend/src/ --include=*.ts      # 28 referensi / 19 file
grep -c 'tenantScope' backend/src/modules/auth/auth.service.ts
```

---

**Disusun:** 2026-09-25 · **Verdict:** BELUM SIAP KIRIM ·
**Fase 3a: `verify:p08 EXIT=0` (2×)** · Fase 3b–6 belum dikerjakan ·
**Prasyarat deploy: seed `tenant_scopes`** ·
**Celah baru ditutup: `/rnd/formulas` (nol scoping sebelum hari ini)**