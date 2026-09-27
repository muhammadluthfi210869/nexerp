# QA Gate — Fase 1 Refactor Arsitektur: Tenant Binding & Universal Audit Trail

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** — lihat bagian 7. Sertifikasi P03 produksi tetap MERAH
  (16/21) karena sebab yang sudah terdokumentasi sebelum perubahan ini, bukan karena
  perubahan ini. Fase 1 sendiri lulus seluruh gerbang yang relevan.

## 0. Ringkas

Fase 1 dari rencana refactor jangka panjang (`docs` — lihat rencana di
`~/.claude/plans/imperative-wishing-turing.md`). Dua defect arsitektural yang ditutup:

1. **`users` tidak punya kolom tenant sama sekali.** Tenant sebuah login hanya bisa
   dijangkau lewat `JOIN tenant_scopes` (`auth.service.ts:78-89`). Identitas tidak
   membawa tenant-nya sendiri, jadi setiap konsumen wajib mengingat join itu.
2. **Audit trail tidak ditegakkan.** `AuditLog` ada di skema dan dirancang benar
   (`actorUserId`, `tenantId`, `correlationId`, `beforeSnapshot`, `afterSnapshot`, `txId`),
   tetapi hanya **4 dari 47 service** yang menulisnya — keempatnya di modul SCM. Tidak ada
   satu pun service di `finance/`, `production/`, `commercial/`, `hr/`, `bussiness-dev/`,
   `crm/` yang menulis jejak audit. Mutasi finansial tidak punya riwayat yang bisa
   dipertanggungjawabkan.

Perubahan: kolom tenant pada identitas, konteks tenant per-request lewat
`AsyncLocalStorage`, dan satu interceptor global yang menulis jejak audit untuk setiap
mutasi HTTP di seluruh 36 modul.

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

CLAUDE.md mewajibkan test reproduksi yang GAGAL lebih dulu sebelum fix. Untuk defect
"tidak ada kode" (interceptor belum ada), yang bisa dibuktikan merah adalah **ketiadaan
perilaku**, dan itu dibuktikan dua cara:

### 1.1 Bukti empiris sebelum fix — `audit_logs` kosong untuk mutasi non-SCM

Diukur pada database test sebelum interceptor dipasang:

```
SELECT count(*) FROM audit_logs WHERE action LIKE 'POST %' OR action LIKE 'PATCH %' ...;
-- 0
```

Tidak ada satu baris pun yang berasal dari lalu lintas HTTP. Satu-satunya penulis adalah
4 service SCM yang memanggil `withAudit()` secara manual, dan `platform/audit`.

### 1.2 Bukti empiris sebelum fix — `users.organizationId` tidak ada

```
ERROR: The column `users.organizationId` does not exist in the current database.
```

Galat ini muncul dari 7 suite unit P07/P08/P09 segera setelah kolom ditambahkan ke skema
tetapi sebelum migrasi diterapkan — 39 test merah. Itu sendiri adalah bukti bahwa kolom
itu sebelumnya tidak ada dan tidak ada jalur kode yang bergantung padanya.

## 2. Yang Diubah

### 2.1 Skema: tenant pada identitas

- `backend/prisma/schema/auth.prisma` — `User.organizationId String? @db.Uuid`.
  Nullable dengan sengaja: user tanpa scope tetap ada, dan `auth.service.ts` sudah
  fail-closed pada claim yang hilang. Kolomnya membuat tenant menjadi atribut identitas,
  bukan sesuatu yang hanya terjangkau lewat join.
- `backend/prisma/schema/platform-controls.prisma` — `@@index([organizationId])` pada
  `TenantScope`, untuk pencarian balik dari tenant ke anggotanya.

**Sengaja BUKAN foreign key.** Tidak ada tabel `Organization`. FK ke `tenant_scopes.id`
akan salah: satu organisasi dipakai banyak user, jadi kolom yang dirujuk tidak unik —
Prisma menolaknya, dan itu memang benar secara model. Lihat bagian 5 untuk tindak
lanjutnya.

### 2.2 Migrasi

`backend/prisma/migrations/20260926100000_user_tenant_binding/migration.sql`

Idempoten (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`), sesuai gaya
migrasi lain di folder ini, karena `prisma migrate deploy` adalah jalur boot container
(`backend/init-db.sh`) dan database live dibentuk oleh `db push`. Dibuktikan idempoten
dengan menjalankannya dua kali berturut-turut (bagian 4.2).

### 2.3 Konteks tenant per-request

- `backend/src/platform/tenant/tenant.context.ts` — `AsyncLocalStorage` + aksesor
  (`getTenantId`, `getUserId`, `getRoles`, `isSuperAdmin`).
- `backend/src/platform/tenant/tenant.middleware.ts` — pass pertama, dari header.
  Middleware berjalan **sebelum** guard, jadi `req.user` masih kosong di sini; pass ini
  hanya melayani rute tanpa guard.
- `backend/src/platform/tenant/tenant.interceptor.ts` — pass kedua, dari **claim JWT yang
  sudah diverifikasi**. Guard berjalan sebelum interceptor, jadi di sini `req.user` sudah
  terisi. Hanya nilai berbentuk UUID yang dipublikasikan: header `x-organization-id`
  bukan sumber tepercaya, jadi `organizationId: 'org-a'` tidak akan pernah masuk konteks.

### 2.4 Jejak audit universal

- `backend/src/platform/audit/audit.interceptor.ts` — interceptor global.
  - Menangkap `POST`, `PUT`, `PATCH`, `DELETE` saja. `GET` tidak menulis apa pun.
  - Melewati `/health`, `/metrics`, `/auth/login`.
  - Aktor, tenant, dan `correlationId` berasal dari claim terverifikasi + `CorrelationIdMiddleware`.
  - `entityType` diturunkan dari nama controller (`RndController` → `Rnd`).
  - `action` = `"METHOD path"`.
  - Snapshot body **dan** respons dibersihkan: `password`, `passwordHash`, `pin`,
    `managerPin`, `approvalPin`, `token`, `secret`, `refreshToken`, `apiKey` → `[REDACTED]`,
    kedalaman maksimum 3, array dipotong 20 item.
  - Setiap `entityId` divalidasi UUID; yang bukan UUID diganti UUID segar. Kolomnya
    bertipe `@db.Uuid`, jadi nilai non-UUID akan menggagalkan INSERT.
  - Kegagalan tulis audit **tidak** menggagalkan respons bisnis — dicatat sebagai
    `warn`, bukan dilempar.

- `backend/src/platform/platform.module.ts` — kedua interceptor didaftarkan lewat
  `APP_INTERCEPTOR`. **Urutan penting** dan dikomentari di kode: `TenantContextInterceptor`
  mendaftar lebih dulu supaya konteks tenant sudah terbit sebelum auditor membacanya.

- `backend/src/app.module.ts` — `TenantMiddleware` dipasang setelah `CorrelationIdMiddleware`.

## 3. Semantik Audit yang Dipilih (dan alasannya)

`tap` hanya menyala pada respons sukses. Artinya:

- **Mutasi yang commit → ada baris audit.** Baris berarti "ini benar-benar terjadi".
- **Permintaan yang ditolak → tidak ada baris audit.** Penolakan sudah dicatat
  `PolicyGuard` ke stdout sebagai `{gate_id, decision_id, reason_code}` (tanpa email/role,
  lihat `policy.guard.ts:40-47`). Menulis baris audit untuk penolakan akan menyamakan
  "terjadi" dengan "dicoba", dan `audit_logs` dimaksudkan untuk yang pertama.

Pemisahan ini disengaja dan diuji (`test/unit/audit-log-coverage.unit-spec.ts`).

## 4. Verifikasi

### 4.1 Suite yang dijalankan

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck backend | `npm run typecheck` | **exit 0** |
| Unit backend | `npm run test` | **36/36 suite, 322 test** (baseline 34/313) |
| E2E HTTP tenant isolation | `--config ./test/jest-e2e.json --testPathPatterns "security/tenant-isolation"` | **8/8 PASS** |
| E2E HTTP login tenant claim | `--testPathPatterns "login-tenant-claim"` | **1/1 PASS** |
| Lint gate (sama dengan certify P03) | `scripts/__tests__/backend-lint-clean.test.sh` | **✅ 0 error** |
| Suite regresi shell | `bash scripts/__tests__/run-all.sh` | **25 PASS / 0 FAIL** |
| SSOT contract | `node scripts/ssot/validate_ssot.js` | **19 pass / 0 fail — CERTIFIED** |
| Lifecycle reconciliation | `node scripts/ssot/audit_lifecycle_reconciliation.js` | **14/14 — VERDICT PASS** |

### 4.2 Bukti idempotensi migrasi

```

apply → "applied once"
apply → "applied twice (idempotent)"
SELECT indexname ... → tenant_scopes_organizationId_idx ✅
```

### 4.3 Bukti audit trail bekerja pada lalu lintas HTTP nyata

Ini bukti terpenting: bukan test unit mock, melainkan baris yang benar-benar ditulis
server saat suite e2e `security/tenant-isolation` berjalan (mutasi HTTP sungguhan lewat
Express + guard + interceptor):

| entityType | action | source | actorRoleSlug | corr | before | after |
|---|---|---|---|---|---|---|
| `Rnd` | `POST /rnd/sample/:id/verify-payment` | `::ffff:127.0.0.1` | `FINANCE` | ✅ | ✅ | ✅ |
| `Rnd` | `POST /rnd/samples` | `::ffff:127.0.0.1` | `RND` | ✅ | ✅ | ✅ |
| `Rnd` | `POST /rnd/samples` | `::ffff:127.0.0.1` | `RND` | ✅ | ✅ | ✅ |
| `Rnd` | `POST /rnd/samples` | `::ffff:127.0.0.1` | `RND` | ✅ | ✅ | ✅ |

Sebelum perubahan ini, query yang sama mengembalikan **0 baris**.

### 4.4 Test baru (regresi permanen)

- `backend/test/unit/audit-log-coverage.unit-spec.ts` — 4 test: `GET` tidak menulis;
  `POST` menulis dengan redaksi kredensial; `/health` dilewati; kegagalan audit tidak
  merusak respons bisnis.
- `backend/test/unit/tenant-context.unit-spec.ts` — 5 test: claim terverifikasi terbit;
  `tenantId` sebagai nama alternatif; **claim non-UUID ditolak**; request tanpa auth
  tidak mengotori konteks; `isSuperAdmin` bekerja.

### 4.5 Regenerasi registry

`node scripts/ssot/generate_lifecycle_registry.js` dijalankan karena migrasi baru harus
terdaftar. Tanpa langkah ini lifecycle audit gagal dengan
`Missing migration in registry` — kebetulan staleness registry yang sudah tercatat di
audit sebelumnya. Setelah regenerasi: 14/14.

## 5. Yang Sengaja BELUM Dikerjakan (dan kapan ditambahkan)

Ditandai eksplisit supaya tidak terbaca sebagai "sudah beres":

1. **Prisma Client Extension untuk auto-inject `tenantId`.** Rencana awal Fase 1
   menyebut ini. Tidak dikerjakan: injeksi otomatis butuh tahu model mana yang
   tenant-owned, dan tanpa tabel `Organization` daftar itu belum bisa didefinisikan.
   Menebaknya akan memaksa filter pada tabel yang tidak punya kolomnya dan memecahkan
   rute yang sudah punya scoping sendiri (`rnd.service.ts`). **Tambahkan setelah tabel
   `Organization` ada.**
2. **Tabel `Organization` + FK `users.organizationId`.** Prasyarat untuk (1). Sekarang
   kolomnya berupa identifier tenant biasa.
3. **Multi-tenant context switch saat runtime.** `auth.service.ts` masih membaca satu
   `TenantScope` primary saat login. Pengguna yang berpindah tenant belum didukung.
4. **Wire `ApprovalService` ke alur komersial.** Itu Fase 3 pada rencana, bukan Fase 1.

## 6. Risiko yang Diukur

- **Interceptor global menyentuh semua request.** Diuji pada dua suite e2e HTTP nyata
  (9 test) plus 322 test unit: tidak ada perubahan perilaku selain baris audit baru.
- **Kegagalan audit tidak boleh mematikan bisnis.** Diuji eksplisit (4.4).
- **Beban tulis.** Setiap mutasi menambah satu INSERT. `audit_logs` sudah punya indeks
  pada `entityType+entityId`, `correlationId`, `actorUserId`, dan trigger imutabilitas
  dari migrasi 20260918 melarang UPDATE/DELETE. Volume perlu dipantau di produksi;
  retensi belum diatur.

## 7. Verdict

**BELUM SIAP KIRIM.** Fase 1 lulus seluruh gerbang yang relevan (bagian 4), tetapi repo
secara keseluruhan belum: `certify_p03_phase.js` tetap **16/21 MERAH** dengan lima
gerbang arsitektur yang gagal — `duplicate_code_scan` (22,23 % > 1 %),
`changed_complexity_check`, `dna_import_boundary_ast`, `dna_native_interactive_scan`,
`dna_hardcoded_visual_scan`.

Kelima kegagalan itu **sudah ada sebelum perubahan ini** dan tidak bertambah:
`audit_p03_architecture_gates.js` dijalankan ulang setelah perubahan dan mencetak
daftar kegagalan yang identik. Sebabnya adalah ukuran diff yang dibekukan pada
`PHASE_BASE_SHA = 9229478d` (2026-09-18) sehingga 594 berkas lama ikut dinilai terhadap
ambang P03. Perbaikan ukuran diff itu adalah **Fase 5** pada rencana, bukan Fase 1.

Karena itu: pekerjaan Fase 1 selesai dan terverifikasi; sertifikasi P03 tidak berubah
dan tidak boleh diklaim hijau. Baca bagian 8 laporan
`2026-09-26-rute-mati-dan-shape-live.md` untuk konteks gerbang P03.
