# CRUD Maturity Audit — Batch F

**Scope**: `backend/src/modules/{system,platform,auth,activity-log,notification,document-automation,todo}`, skim `digimar/events/my-dashboard/executive/files/reports/analytics/kpi`; Prisma `system/platform-controls/auth/activity/document-automation/state-machine`; FE `approvals/`, `system/`, `todo`, `notifications/`, `dna/approval/`.
**Date**: 2026-10-01 · Semua angka di bawah dihitung ulang dengan grep/count sendiri; perintah dicantumkan.

---

## 1. Ringkasan per Entitas

Verdict: **WORKS** (fungsional end-to-end) · **PARTIAL** (jalur ada tapi cacat) · **MISSING** (tidak ada) · **UNVERIFIED**.

| Entitas | C | R | U | D |
|---|---|---|---|---|
| `Approval` (platform) | MISSING — `requestApproval` 0 call site produksi | MISSING — `listPending` 0 call site, tak ada route read | PARTIAL — `decide()` punya `FOR UPDATE`+maker-checker+version, tapi controller tak kirim `expectedVersion` | MISSING — tidak ada |
| `AuthSession` | WORKS — `issueSession` (session.service.ts:47) | WORKS — `listSessionsForUser` (:188) | WORKS — `rotateRefresh` atomik + family revoke saat replay (:77) | WORKS — soft, `revokedAt` (:167-186), terhubung ke `verifyAccessToken` via jwt.strategy.ts:53 |
| `MfaSecret` | WORKS — `enrollTOTP` (mfa.service.ts:107) | PARTIAL — hanya via `verifyTOTPChallenge`, tak ada read endpoint | PARTIAL — `confirmTOTP`/`recoverWithCode` ada, tak ada reset/disable | MISSING — tak ada `delete`/`deleteMany` |
| `MfaChallenge` | MISSING — model ada, 0 referensi kode | MISSING | MISSING | MISSING |
| `AuditLog` | WORKS — interceptor global (audit.interceptor.ts:151) | WORKS — `GET system/audit-logs` (system.controller.ts:29) | - (immutable by design) | - (immutable, trigger DB) |
| `ActivityLog` | WORKS — interceptor global (activity-log.interceptor.ts:72) | WORKS — `GET activity-log/me` | - | - |
| `TenantScope` | PARTIAL — ditulis manual, tak ada service | MISSING — tak ada route read | PARTIAL — hanya dibaca saat login (auth.service.ts:127) | MISSING |
| `TaskBoard` | WORKS — POST todo/boards (todo.controller.ts:36) | WORKS — list + get-with-tasks (todo.service.ts:30) | WORKS — PATCH, DTO tervalidasi | WORKS — hard delete + cascade task (todo.service.ts:50) |
| `TaskItem` | WORKS — POST boards/:id/tasks (:74) | WORKS — via `getBoard` | PARTIAL — blind setter 2 endpoint (:83, :92) | WORKS — hard delete (:90) |
| `ChangeRequest` | WORKS — 2 route duplikat (system.controller.ts:126,148) | PARTIAL — 2 route read identik (:112,:119) | PARTIAL — blind PATCH, body mentah tanpa DTO (:162) | MISSING |
| `SystemConfig` | WORKS — upsert (system.controller.ts:218) | WORKS — GET configs (:213) | WORKS — upsert = create-or-update | - (upsert, tak ada hapus) |
| `ErrorLog` | WORKS — POST errors/ingest (:202) | WORKS — summary + timeline (:192,:197) | WORKS — PATCH resolve (:207) | MISSING |
| `Notification` | PARTIAL — dibuat event-driven, tak ada route create | WORKS — list/unread/unread-count/:id | PARTIAL — mark-read ada, edit isi tidak | MISSING — violates contract (NFR §5 exception) |
| `DocumentDraft` | WORKS — 5 generator + 1 controller | PARTIAL — list tanpa pagination | WORKS — approve/reject/update | PARTIAL — lihat P1-9 |
| `OutboxEvent` / `OutboxDlq` | UNVERIFIED — di luar jejak audit ini | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `CommunicationPolicy` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `SystemOverrideLog` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `SalesTarget` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `SystemSequence` | WORKS — `IdGeneratorService.generateId` (id-generator.service.ts:16) | - | - | - |
| `AutoApproveConfig` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `User` | UNVERIFIED (di luar scope modul auth) | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `digimar/events/my-dashboard/executive/analytics` | - | WORKS — read-only (8/0/1/12/4 @Get) | - | - |
| `files` | WORKS — 2 @Post | WORKS — 4 @Get | MISSING — 0 @Patch/@Put | MISSING |
| `reports` | WORKS — 1 @Post | WORKS — 8 @Get | MISSING | MISSING |
| `kpi` | WORKS — 2 @Post | WORKS — 13 @Get | MISSING | MISSING |

**Catatan jujur soal cakupan**: baris `UNVERIFIED` bukan "tidak ada" — saya tidak menelusuri controller/service-nya karena berada di luar jalur CRUD yang saya dalami. Menandainya `MISSING` tanpa bukti akan mengulang kesalahan yang sama seperti yang sayaudit.

---

## 2. Temuan (paling parah dulu)

### P0

**P0-1 — `executeTransition` tidak pernah dipanggil; tabel log transisi dan gate enforcement mati total.**
`state-transition.service.ts:218` mendefinisikan `executeTransition` — satu-satunya method yang melakukan `GATE_BLOCKED`, `verifyOverridePin`, tulis ke `StateTransitionLog`, dan emit event. Command:
```
grep -rn "executeTransition" backend/src frontend/src docs
```
Hasil: 1 definisi (`state-transition.service.ts:218`) + 4 kemunculan di `__tests__/state-transition.service.spec.ts:96,123,140,162`. **0 call site produksi.** Konsekuensi: `state_transition_logs` tidak pernah terisi, gate G1/G2/G3 tidak pernah menolak, `SystemOverrideLog` tidak pernah ditulis. Yang berjalan hanya `validateTransition` (pure check) di 5 titik.

**P0-2 — Multi-tenant isolation belum diimplementasikan; tabel `Organization` tidak ada sama sekali.**
`grep -rn "^model Organization" backend/prisma/schema/*.prisma` → **kosong**. Yang ada hanya `TenantScope` (`platform-controls.prisma:145`) yang menunjuk `organizationId String @db.Uuid` **tanpa relasi ke tabel mana pun** — tidak ada FK, jadi tidak ada tabel yang bisa Foundry. Klaim kontrak `02_DATA_OWNERSHIP.yaml:40` ("Organization — Tenant root. One row per tenant") dan `BUS-RULE-098` (`04_BUSINESS_RULES.md:1489`) tidak punya implementasi. Worse: `grep -rn "TenantContext" backend/src/modules/{system,platform,auth,activity-log,notification,document-automation,todo}` → **kosong**. Tidak ada satu pun query di scope Batch F yang di-scope by tenant.

**P0-3 — Interceptor audit global memakai jalur non-transaksional, melanggar BUS-RULE-113.**
`audit.interceptor.ts:181` memanggil `writeDirectAudit` (`audit.service.ts:97`), yang didefinisikan — dalam komentar sendiri baris 98 — sebagai "Direct write (not inside a tx)". `withAudit` (`:37`) — jalur yang benar dan satu-satunya yang menulis `txId` via `SET LOCAL` — **tidak pernah dipakai interceptor**.BUS-RULE-113 (`04_BUSINESS_RULES.md:1860`) mewajibkan `businessWrite AND auditLog.create AND outboxEvent.create` dalam satu `$transaction`; kalau audit ditunda keluar, wajib tolak `AUDIT_NOT_ATOMIC`. Interceptor justru menulis audit terpisah secara diam-diam, jadi mutasi bisa commit tanpa baris audit. Klaim "global audit interceptor menuju audit trail" benar secara penulisan, salah secara atomisitas.

**P0-4 — `DEFER` di decision controller diam-diam menjadi `REJECTED`.**
`decision.controller.ts:26-28`:
```ts
const decision = body.action === 'APPROVE' ? ApprovalDecision.APPROVED : ApprovalDecision.REJECTED;
```
Body menerima `'APPROVE' | 'REJECT' | 'DEFER'` (`:21`), tapi `DEFER` jatuh ke cabang `else` → `REJECTED`. Approver yang menekan "tunda" justru menolak pengajuan secara permanen (`approval.service.ts:98` langsung commit `REJECTED`). Tidak ada enum `DEFER` di `ApprovalDecision` (`platform-controls.prisma:14-17` hanya `APPROVED`/`REJECTED`), jadi ini mungkin unintended — tapi tetap destruktif.

**P0-5 — `rationale` yang FE wajibkan dibuang begitu sampai di server.**
`DnaDecisionModal.tsx:69-72` menolak submit bila `rationale.trim().length < 5`. Tapi `decision.controller.ts:30-35` hanya meneruskan `(id, actorId, decision, expectedVersion)` — `body.rationale` tidak pernah dibaca, dan `Approval` (`platform-controls.prisma:90-106`) tidak punya kolom rationale. Alasan penolakan hilang permanen; FE mengarang aturan yang tidak ada di server.

### P1

**P1-6 — `expectedVersion` ada di DTO tapi tak pernah dikirim, jadi optimistic locking mati.**
`decision.controller.ts:21` mendeklarasikan `expectedVersion?: number` dan meneruskannya (`:34`). Namun `DnaDecisionModal.tsx:76-79` POST body hanya `{action, rationale}` — tanpa `expectedVersion`. Di `approval.service.ts:56`, pengecekan versi bersifat `if (expectedVersion !== undefined && ...)`, jadi ketika field tidak dikirim, guard dilewati diam-diam. Konsekuensi: version mismatch tidak pernah terdeteksi. (Perhatikan: `decide()` sendiri sudah benar — `FOR UPDATE` baris 90, maker-checker baris 53, duplicate-checker baris 60. Yang hilang hanya transmisi version dari FE.)

**P1-7 — `DecisionController` tidak punya gate role apa pun.**
`decision.controller.ts:18` hanya `@UseGuards(JwtAuthGuard)`. `grep -n "RolesGuard|@Roles|PolicyGuard" decision.controller.ts` → **kosong**. `app.module.ts:135` mendaftarkan global `ThrottlerGuard` saja, bukan `RolesGuard`. Artinya siapa pun dengan JWT valid — termasuk akun non-approver — dapat memanggil `/decision/:id/resolve`. Yang menahan hanya maker-checker di service, yang menilai identitas, bukan kewenangan.

**P1-8 — `actorId` jatuh ke string `'SYSTEM'` yang bukan UUID, dan bypass `@Req() req: any`.**
`decision.controller.ts:24`: `req?.user?.id || req?.user?.sub || 'SYSTEM'`. String `'SYSTEM'` masuk ke kolom `@db.Uuid` `requestedById`/`decidedById` saat write. Selain itu `jwt.strategy.ts:58-63` mengembalikan objek user yang **tidak punya properti `id`** (mengembalikan `...user` dari `usersService.findOneById` — perlu konfirmasi shape), sehingga `req.user.id` bisa undefined dan jatuh ke `sub`. Perilaku aktual bergantung pada shape `User`; saya tandai sebagai **inference**, bukan fakta terverifikasi.

**P1-9 — `document-automation`: 1 dari 5 listener tidak punya emitter.**
Command `grep -rn "delivery_order.created" backend/src --include=*.ts` → **1 hit**, yaitu `@OnEvent('delivery_order.created')` di `document-automation.service.ts:65`. Tidak ada `emit('delivery_order.created')` di mana pun. Jadi `generateSuratJalanDraft` + `generateDeliveryJournalDraft` (`:70-71`) tidak pernah terpicu. 4 listener lain punya emitter nyata: `sales-orders.service.ts:100`, `production.service.ts:420`, `sales-orders.service.ts:185` + `sales-down-payments.service.ts:151`, `lead-stage.service.ts:782`. PelPositive: nomor dokumen dibuat server-side via `idGenerator.generateId('QUO')` (`:118`) dengan `SystemSequence` upsert transaksional — tidak ada minting di client.

**P1-10 — Blind setter pada `TaskItem`, dan 2 dari 5 endpoint tanpa `@Roles`.**
`todo.controller.ts:83-90` (`updateTaskStatus`) — dikonfirmasi blind setter: `todo.service.ts:84-87` `prisma.taskItem.update({where:{id}, data:{status: dto.status}})`, tanpa dirty-state guard, tanpa optimistic lock, tanpa validasi transisi (tidak pernah memanggil `validateTransition`). **`@Roles` tidak ada** di `:83` meski endpoint board di `:37/:56/:66` memakainya. `@Patch('tasks/:id')` (`:92`) juga tanpa `@Roles` dan menerima `UpdateTaskDto` penuh termasuk `status` — jalur kedua untuk menimpa status tanpa gate.

**P1-11 — Dua route duplikat untuk operasi yang sama di `system.controller.ts`.**
`POST change-request` (`:126`) dan `POST change-requests` (`:148`) keduanya memanggil `createChangeRequest` yang sama; `PATCH change-request/:id` (`:162`) dan `PATCH change-requests/:id` (`:178`) identik; `GET change-requests` (`:112`) dan `GET change-requests/all` (`:119`) mengembalikan query identik. Ini melanggar CLAUDE.md §4 "Zero Dead Code — 0 duplicate routes". Named entity: **fossil routes**.

**P1-12 — `ChangeRequest` create/update tanpa DTO, tanpa validasi.**
`system.controller.ts:126-146` dan `:162-176` menerima object literal inline (bukan class DTO dengan `class-validator`) dan meneruskan `data` mentah ke Prisma pada `:174`. Tidak ada whitelist field — client boleh menulis kolom apa pun yang cocok skema. Bandingkan `todo.dto.ts` yang benar-benar memakai `@IsString`/`@IsIn`/`@IsUUID`.

**P1-13 — Hapus fisik melanggar NFR §5 soft-delete, dan middleware yang dikontraskan tidak ada.**
`09_NON_FUNCTIONAL_CONTRACT.md:137` mewajibkan "Every entity has `deletedAt: DateTime?`". `grep -rh "deletedAt" backend/prisma/schema/*.prisma | wc -l` → **10 field** di seluruh 24 file schema. `grep -rn "\$use(" backend/src --include=*.ts` → **kosong**: Prisma extension auto-filter yang dijanjikan NFR:152 (`backend/src/prisma/middleware/soft-delete.middleware.ts`) tidak pernah dibuat. `todo.service.ts:51-52` memanggil `taskItem.deleteMany` lalu `taskBoard.delete` — hard delete berantai tanpa jejak.

### P2

**P2-14 — `MfaChallenge` adalah model mati.**
`grep -rn "mfaChallenge" backend/src backend/prisma` → **0 hit di `backend/src`**. Model ada di `platform-controls.prisma:54-63` lengkap dengan `expiresAt`, `consumedAt`, `attempts` (yangAbort-brute-force), tapi tidak ada kode yang pernah menyentuh. Konsekuensi: rate-limit percobaan MFA tidak ada, dan challenge row tidak pernah dibuat atau dibersihkan.

**P2-15 — Tidak ada disable/reset MFA.**
`grep -n "deleteMany|delete(" backend/src/platform/auth/mfa.service.ts` → **kosong**. Satu-satunya write adalah `confirmTOTP` (`:131`) dan `recoverWithCode` (`:163`). Artinya TOTP yang sudah aktif tidak bisa dimatikan — tidak ada `DELETE /mfa` maupun reset. Untuk entity security-sensitive ini, ketiadaan jalur revokasi adalah cacat, bukan sekadar fitur yang belum dibuat.

**P2-16 — `MfaService` fallback ke kunci enkripsi hardcoded saat DI tidak menyuntik config.**
`mfa.service.ts:67-72`: bila `config` tidak di-inject, memakai `'test-jfa-encryption-key-min-32-chars-long'` dari env/procEnv. Idempoten selama `@Optional()` tidak terpicu di produksi, tapi ini pola fail-open pada material kripto — layak di-flag sebagai risiko, **belum terverifikasi** apakah route produksi menyuntik `PlatformConfig`.

**P2-17 — Tidak ada bulk-import di scope, jadi path itu tidak terlewati oleh interceptor.**
Task menyebut "apakah berjalan untuk bulk-import". Command `grep -rn "bulk\|import.*csv\|parseAsync" backend/src/modules/{system,platform,auth,activity-log,notification,document-automation,todo}` → tidak ada endpoint bulk-import di scope. Jadi tidak ada jalur bulk yang lolos interceptor; **tidak ada temuan** di sini. (Inferensi: jangan generalize ke modul lain — belum dicek.)

**P2-18 — `Notification` tidak punya delete, padahal kontrak melarang dihapus.**
`02_DATA_OWNERSHIP.yaml:930` menyatakan "Never deleted (NFR §5 exception)". Implementasinya konsisten: `grep -rn "notification.delete"` → **kosong**, hanya `update` untuk `isRead`. Ini **kepatuhan**, bukan defect — dicatat agar tidak dilaporkan sebagai bug. Yang tetap jadi gap: tidak ada endpoint create (creating only via 7 event-driven call site), dan tidak ada ada UI delete (sesuai kontrak).

**P2-19 — `StateTransitionLog` tidak pernah ditulis.**
Langsung konsekuensi P0-1. Perlu dicurigai: tabelnya ada dan terindeks (`system.prisma:38-52`) sehingga terlihat siap pakai.

**P2-20 — `state-machine.prisma` tidak berisi model apa pun.**
File itu (`state-machine.prisma`) hanya berisi `enum StateEventTrigger` dengan 9 nilai. Prisma akan menolak file tanpa model bila di-`generator`, tapi tidak ada error saat ini → kemungkinan file di-exclude dari schema utama. `grep -n "^model" state-machine.prisma` → **0**. 6 dari 9 enum trigger (`SO_CREATED`…`PERIOD_LOCKED`) tidak punya service yang mengimplementasikan entry point yang disebut di comment file tersebut (`StateMachineService.transition()`), dan `grep -rn "StateMachineService" backend/src` → **0 hit**.

**P2-21 — `DnaDecisionModal` dan `ApprovalDetailModal` tidak ter-mount di mana pun.**
`grep -rn "DnaDecisionModal" frontend/src` di luar file definisinya → **kosong**. `DnaDecisionModal.tsx:76` adalah satu-satunya klien yang memanggil `/decision/:id/resolve`, jadi endpoint approval kanonik itu **tidak punya konsumen FE**. Konsekuensi: `ApprovalService` praktis mati dari sisi UI — FE approvals Instead memanggil endpoint spesifik domain (`api.post('/scm/purchase-orders/${id}/approve')` dll.), melewati `Approval` table sama sekali.

**P2-22 — Drawer tidak pernah fetch data sendiri (repo-wide), tapi ini bukan bug.**
`find frontend/src -name '*Drawer*.tsx' -o -name '*Detail*.tsx' | wc -l` → **86**; yang berisi pola fetch (`useQuery|api.get|fetch(|axios.`) → **1**. Awalnya tampak seperti temuan serius, tapi setelah membaca `ArtworkApprovalDetailDrawer.tsx:25-38`, pola repo adalah **prop-drilling**: `selectedTask`, `history`, `isHistoryLoading` masuk sebagai props, dan `page.tsx:144,160` yang menjalankan `useQuery`. Ini arsitektur yang disengaja dan benar. Yang bermasalah justru sebaliknya: **tidak ada satu pun approval page yang memanggil endpoint line-item** (lihat P2-23).

**P2-23 — 0 dari 11 approval page memuat request line detail.**
`for d in "frontend/src/app/(dashboard)/approvals"/*/; do grep -c "lines\|items\|detail" ...; done` → **0 untuk semua 11 direktori**. Daftar endpoint yang benar-benar dipanggil FE di `approvals/`: `/scm/purchase-orders`, `/scm/purchase-returns`, `/scm/goods-requirements`, `/rnd/samples`, `/purchase/requests`, `/finance/job-order-costings`, `/finance/fund-requests`, `/creative/tasks`, `/commercial/sales-orders`, `/bussdev/returns` — semuanya **collection** endpoint, tidak ada satu pun `/:id` line-items. Approver memutuskan tanpa melihat baris yang disetujui. Ini gap yang lebih nyata daripada "drawer tidak fetch".

**P2-24 — Angka FE approval yang dilaporkan (41 halaman, 22 drawer) tidak cocok disk realities.**
`find "frontend/src/app/(dashboard)/approvals" -name 'page.tsx' | wc -l` → **11**. Drawer/modal di `approvals/` → **6** (bukan 22). Angka 41/22 kemungkinan menghitung seluruh repo atau termasuk file di luar path. Verified count wins.

**P2-25 — `files`, `reports`, `kpi` punya create+read tapi nol update/delete.**
Census `@Get|@Post|@Patch|@Delete|@Put` per controller: `files.controller.ts` 4@GET/2@POST/0 lain; `reports.controller.ts` 8@GET/1@POST/0 lain; `kpi.controller.ts` 13@GET/2@POST/0 lain. Sesuai instruksi ini read-only-ish dan hanya di-skim, jadi saya catat tanpa menghakimi.

---

## 3. Verifikasi Tiga Prioritas

### Prioritas 1 — `StateTransitionService` efektif dead code → **CONFIRMED**

| Klaim | Perintah | Hasil |
|---|---|---|
| `validateTransition` 5 call site produksi | `grep -rn "validateTransition" backend/src` | **Tepat 5**: `sales-orders.service.ts:148`, `production-execution.service.ts:342`, `rnd-sample.service.ts:446,516,673`. Plus 1 panggilan internal `state-transition.service.ts:236` dan 5 di spec. |
| `executeTransition` 0 call site produksi | `grep -rn "executeTransition" backend/src frontend/src docs` | **0 produksi.** 1 definisi (`:218`) + 4 di `__tests__/state-transition.service.spec.ts:96,123,140,162`. |
| Map cuma 7 entitas | `sed -n '11,17p'` (union `EntityType`) | **7**: `SalesLead, SampleStage, SOStatus, FormulaStatus, LifecycleStatus, DesignState, RegStage` (`state-transition.service.ts:11-18`) |

**Cakupan map vs kontrak** — command: ekstrak `- entity:` dari `03_WORKFLOW_STATE_MACHINE.yaml`.
- Entitas kontrak: **37** (bukan 165 — 165 adalah jumlah *transisi*, `grep -cE "^\s+to:" ` → **165**, terkonfirmasi).
- Entitas kontrak yang punya padanan nama di map: **1** (`Lead` ↔ `SalesLead`).
- **36 dari 37 entitas kontrak tidak terpetakan.**

Kesimpulan: konsekuensi P0-1 valid — `state_transition_logs` kosong, `SystemOverrideLog` tidak pernah ditulis, gate G1/G2/G3 tidak pernah menolak.

### Prioritas 2 — Multi-tenant tidak diimplementasikan → **CONFIRMED**

| Aspek | Perintah | Hasil |
|---|---|---|
| Tabel `Organization` | `grep -rn "^model Organization" backend/prisma/schema/*.prisma` | **0 hit** |
| `TenantId` kolom | `grep -rc "tenantId" backend/prisma/schema/*.prisma` | Hanya 2 file: `master-extension.prisma` (2), `platform-controls.prisma` (2) |
| Klaim tenant di JWT | `auth.service.ts:189` | **ADA** — `...(tenantId ? { organizationId: tenantId, tenantId } : {})`, dibaca `jwt.strategy.ts:60-61` |
| Query ter-scope tenant | `grep -rn "TenantContext" backend/src/modules/{system,platform,auth,activity-log,notification,document-automation,todo}` | **0 hit** |

**Nuansa yang harus jujur ditambahkan**: claim JWT **sudah ada** dan fail-closed (tanpa `tenant_scopes` → tanpa claim → guard menolak, `auth.service.ts:118-124`). Yang hilang adalah fondasinya: tidak ada tabel `Organization`, jadi `TenantScope.organizationId` adalah UUID liar tanpa FK, dan **tidak ada satupun query di Batch F yang memakainya**. Modul `bussdev` adalah satu-satunya yang melakukan filter `organizationId` secara eksplisit (`lead-query.service.ts:168,189,204,311`; `lead-stage.service.ts:415,443`) — di luar scope Batch F tapi membuktikan polanya bisa dibuat. Jadi: "tidak ada claim" = **REFUTED**; "tidak ada implementasi isolasi" = **CONFIRMED**.

### Prioritas 3 — Global audit-log interceptor → **CONFIRMED (dengan koreksi penting)**

- **Terdaftar di**: `platform.module.ts:38-41`, `APP_INTERCEPTOR` → `AuditLogInterceptor`, setelah `TenantContextInterceptor` (`:34-37`). Urutan memang load-bearing dan benar sesuai komentar `:32-33`.
- **Menangkap**: HTTP mutating saja (`POST/PUT/PATCH/DELETE`, `:28`); skip `/health /metrics /auth/login` (`:30`); actor dari `req.user` (`:136`); tenant dari claim atau `TenantContext` (`:137-138`); `correlationId`, `idempotency-key` header (`:140-148`); before = `req.body`, after = response (`:147,161`); redaksi key sensitif (`:32-42`, `password`/`token`/`secret`/`pin`); depth 3 + array 20 (`:44-45`).
- **Yang KEHILANG**:
  1. **Bukan transaksional** — pakai `writeDirectAudit` (`:181`), bukan `withAudit`. Melanggar BUS-RULE-113. → **P0-3**
  2. **Tidak ada `entityVersion`** — kolom ada di `AuditLog` (`platform-controls.prisma`) tapi interceptor tidak mengirimnya; checksum optimistic tidak terekam.
  3. **Tidak jalan bila handler throw** — memakai `tap()` biasa (`:151`), bukan `tap({error})`; request yang gagal total tidak menghasilkan baris audit. Untuk audit trail approval, justru kasus yang paling perlu tercatat.
  4. **Bukan kebal concurrent** — `writeDirectAudit` di luar transaksi, tidak ada `txId` nyata (`:107` mengarang `audit:${uuid}` tanpa `SET LOCAL`).
  5. **Tidak ada bulk-import** di scope untuk dilewati (P2-17).
- **Catatan tambahan**: ada **dua** sistem audit global yang berebut. `activity-log.interceptor.ts` (APP_INTERCEPTOR di `activity-log.module.ts:15`) menulis ke tabel `activity_logs`; `audit.interceptor.ts` menulis `audit_logs`. Keduanya global, keduanya `void`-fire-and-forget (`:72-83` dan `:152`). Kegagalan log tidak pernah menggagalkan request — dapat dipertahankan, tapi berarti "audit trail" repo ini sebenarnya dua sumber yang tidak direkonsiliasi.

---

## 4. Klaim yang TIDAK bisa saya verifikasi

1. **`audit_logs` benar-benar terisi di produksi** — `AuditLog.create` ada di kode, tapi saya tidak punya akses DB. Kepastian butuh query: `SELECT count(*) FROM audit_logs`. Dugaanku: interceptor jalan, tapi barisnya `txId` palsu (P0-3), jadi artifact-nya tidak bisa dipakai untuk forensik.
2. **`req.user.id` undefined atau tidak di `JwtStrategy.validate()`** (P1-8) — bergantung shape balik `usersService.findOneById()`. Saya tidak membuka `users.service.ts`. Ditandai inference.
3. **`@Optional()` MfaService di produksi memakai key hardcoded** (P2-16) — bergantung DI wiring di `AppModule`, belum dicek.
4. **`PlatformConfig` ter-inject ke `MfaService`** — asumsi saya di P2-16 belum diuji.
5. **Skor `withAudit` benar-benar nol di produksi** — `grep` saya mencakup `backend/src`; mungkin ada consumer lewat alias atau dynamic import. Saya tidak melakukan exhaustive check atas semua bentuk import.
6. **`AuditLog` immutable trigger benar-benar ada** — `audit.service.ts:5` mengutip "migration 20260918"; saya tidak membaca `backend/prisma/migrations/`.
7. **Entitas bertanda `UNVERIFIED` di tabel** — `OutboxEvent`, `OutboxDlq`, `CommunicationPolicy`, `SystemOverrideLog`, `SalesTarget`, `AutoApproveConfig`, `User`. Tidak ada klaim yang saya buat tentang mereka.
8. **Effectiveness `PolicyGuard`** — terdaftar di `platform.module.ts:47` tapi tidak ada `APP_GUARD`, jadi kemungkinan tidak aktif global. Tidak saya telusuri lebih jauh; di luar scope.
9. **Skim surfaces (`digimar`/`events`/`my-dashboard`/`executive`/`analytics`/`files`/`reports`/`kpi`)** — hanya census jumlah route verb, **tidak** audit kualitas list/pagination/search/export. Verdict WORKS di tabel berarti "ada endpoint baca yang berfungsi", bukan "list quality baik".
10. **`03_WORKFLOW_STATE_MACHINE.yaml` status `PROVISIONAL`** (`:4`) — kontrak ini sendiri belum final, jadi "coverage 1/37" adalah deviasi terhadap dokumen provisional. Tetap temuan, tapi bobotnya lebih ringan dari P0-1/P0-2 yang melanggar kode yang berjalan.

---

## Ringkasan Angka

| | WORKS | PARTIAL | MISSING | UNVERIFIED | N/A |
|---|---|---|---|---|---|
| **C** (Create) | 14 | 2 | 2 | 6 | 1 |
| **R** (Read) | 12 | 3 | 3 | 6 | 1 |
| **U** (Update) | 5 | 6 | 4 | 6 | 4 |
| **D** (Delete) | 3 | 1 | 10 | 6 | 5 |

Angka dihitung dengan program dari 25 baris tabel entitas di atas, bukan diketik manual. Kolom `N/A` = sel yang memang tidak berlaku (immutable by design, atau read-only surface) dan tidak masuk hitungan WORKS/PARTIAL/MISSING.

**Catatan interpretasi**: angka WORKS pada C/R cukup tinggi bukan karena sistem matang, melainkan karena `AuthSession`, `TaskBoard`, `TaskItem`, `SystemConfig`, `ErrorLog`, `DocumentDraft` benar-benar punya endpoint create/read yang berfungsi. Yang bobotnya berat justru kolom **D**: 10 dari 25 entitas tidak punya delete sama sekali, dan soft-delete yang disyaratkan kontrak tidak ada (−P1-13).
