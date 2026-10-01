# CRUD Audit — Batch E (Marketing / Website / CRM / LeadCapture / Communication / WA / Guests)

Tanggal audit: 2026-10-01 · Branch: `feat/p08-contracts-subject-ownership`
Basis: setiap angka di bawah hasil dari grep/command yang tercatat; tidak ada angka yang diambil dari pass sebelumnya.

---

## 0. Koreksi terhadap premis yang diberikan (WAJIB dibaca lebih dulu)

Tiga dari empat dugaan "P0 suspect" **tidak terbukti**.isans:

| Dugaan | Hasil | Command |
|---|---|---|
| `SocialPost` tidak punya delegate call | **SALAH** — 12 call di `backend/src/modules/marketing/social-planner/social-planner.service.ts:80,93,135,177,242,276,311` | `grep -rn --include=*.ts -iE "\.socialPost\b" backend/src` |
| `MetaAccountConfig` punya FE page tapi tanpa service | **SALAH sebagai Pageable** — tidak ada halaman CRUD; yang ada adalah view hardcoded di `samples/social-tracker/`, dan token masuk lewat `@Post('meta/test-connection')` yang **tidak** menyentuh `MetaAccountConfig` | `grep -rnw MetaAccountConfig backend/src` → 0 hit |
| `MarketingChannelFunnel` punya FE page | **SALAH** — 0 kemunculan di seluruh `frontend/src`; tidak ada halaman, bukan "halaman tanpa service" | `grep -rn "ChannelFunnel" frontend/src` → 0 hit |
| `Article` punya FE page tapi 0 delegate | **BENAR, dan lebih buruk dari dugaan** — prorses | lihat §1 P0-1 |

Sku teoretis yang tidak dihitung: `Article`, `WebsiteProduct`, `SocialPostMedia`, `MarketingChannelFunnel`, `MetaAccountConfig` — 5 model dengan **0** pemanggilan delegate di seluruh `backend/src`.

---

## 1. Ringkasan Tabel

Verdict: **WORKS** = end-to-end jalan · **PARTIAL** = jalan sebagian/ada caveat · **MISSING** = tidak ada · **UNVERIFIED** = tidak bisa dibuktikan tanpa runtime.

### 1.1 Marketing — Canonical Task domain (backend terkuat di batch ini)

| Entity | C | R | U | D |
|---|---|---|---|---|
| `MarketingTask` | **WORKS** — `canonical-marketing.controller.ts:94`, class-validator DTO, idempotency key | **WORKS** — `:73,88`, `PaginationQueryDto` page/limit/max100/q/sort | **PARTIAL** — `:104,114`, PATCH; `version` ada di schema `marketing.prisma:252` tapi controller tidak menerima `If-Match`/expectedVersion | **WORKS** — `:124`, `marketing-task.service.ts` cascade |
| `MarketingProject` | **WORKS** — `:253`, `@Roles(...MANAGER_ROLES)` | **WORKS** — `:244` | **WORKS** — `:263`, MANAGER_ROLES | **MISSING** — tak ada `@Delete('projects/:id')` |
| `MarketingBrand` | **WORKS** — `:282` | **WORKS** — `:273` | **WORKS** — `:292` | **PARTIAL** — tak ada DELETE route; `isActive @default(true)` `marketing.prisma:464` jadi soft-disable hanya via PATCH |
| `MarketingTaskComment` | **WORKS** — `:190` | **WORKS** — `:181` | **MISSING** — tak ada `@Patch` comment | **WORKS** — `:171`, ownership guard `marketing-task.service.ts:777` |
| `MarketingTaskAttachment` | **WORKS** — `:142` | **WORKS** — `:152` | **MISSING** | **WORKS** — `:218`, ownership guard `marketing-task.service.ts:831` |
| `MarketingTaskChecklistItem` | **WORKS** — `:161` | **WORKS** (ikut `listTasks`) | **WORKS** — `:131` | **MISSING** |
| `MarketingTaskHistory` | **PARTIAL** — append-only `marketing-task.service.ts`, 1 call | via detail task | **MISSING** — sesuai desain (audit) | **MISSING** — sesuai desain |
| `MarketingTeamMember` | **WORKS** | **WORKS** — `:228` | **PARTIAL** — `:234` memakai `TASK_READ_ROLES` (bukan MANAGER) | **MISSING** |
| `RoundRobinAgent` | **WORKS** — `lead-round-robin.service.ts` | **WORKS** | **WORKS** | **WORKS** — `marketing-ads`? tidak; `lead-round-robin.service.ts` |

### 1.2 Marketing — Social Planner

| Entity | C | R | U | D |
|---|---|---|---|---|
| `SocialPost` | **WORKS** — `social-planner.controller.ts:68`, `SOCIAL_WRITE_ROLES`, `crypto.randomUUID()` idempotency, `version: 1` di-set | **WORKS** — `:35`, page/limit/total/hasMore (`social-planner.service.ts:80-104`) | **PARTIAL** — `:81` PATCH; `version` ada (`marketing.prisma:550`) tapi tidak dikonsultasikan | **WORKS** — `:94`, hard delete + role check `social-planner.service.ts:301` |
| `SocialChecklistItem` | **WORKS** — nested create | via post | **MISSING** | **WORKS** — `social-planner.service.ts` `deleteMany` |
| `SocialPostMedia` | **PARTIAL** — dibaca saat create, tapi 0 delegate terpisah | **MISSING** — 0 call | **MISSING** | **MISSING** |
| `SocialPostMetricSnapshot` | **PARTIAL** — write-only (`create` 1 call) | **MISSING** — 0 read call | — | **MISSING** |
| `MarketingChannelFunnel` | **MISSING** | **MISSING** | **MISSING** | **MISSING** |
| `MetaAccountConfig` | **MISSING** | **MISSING** | **MISSING** | **MISSING** |

### 1.3 Marketing — Report / Ads / Organic / Landing / OmniCRM / Vercel

| Entity | C | R | U | D |
|---|---|---|---|---|
| `LandingPageVisit` | **WORKS** — `landing-tracker.controller.ts:109` (tanpa auth, by design tracker) | **WORKS** — `:119,137` | **MISSING** | **MISSING** |
| `LandingPageConversion` | **WORKS** — `:114` | **WORKS** — `:124` | **PARTIAL** — `:143` `@Put` (bukan PATCH), `status` arbitrary string tanpa enum | **WORKS** — `:153,160` |
| `OmniCrmState` | **WORKS** — `omni-crm-state.service.ts:18` | **WORKS** — `omni-crm-state.controller.ts:21` | **PARTIAL** — `:36` `@Put`; version check opsional (`omni-crm-state.service.ts:22`), client boleh omit → lost-update | **MISSING** |
| `RoundRobinState` | **PARTIAL** — upsert `lead-round-robin.service.ts` | **PARTIAL** | **MISSING** — tak ada route | **MISSING** |
| `DailyAdsMetric` | **WORKS** — `marketing.controller.ts:23` | **WORKS** | **WORKS** — `:100` PATCH | **WORKS** — `:106` hard delete |
| `ContentAsset` | **WORKS** — `:55` | **WORKS** — `:136` | **MISSING** | **MISSING** |
| `AccountHealthLog` | **PARTIAL** — upsert dari service | **WORKS** | **PARTIAL** | **WORKS** — cascade |
| `MarketingTarget` | **WORKS** — `:280` | **WORKS** — `:295` | **MISSING** | **MISSING** |
| `SearchVisibilityMetric` | **PARTIAL** | **PARTIAL** (1 findUnique) | **MISSING** | **MISSING** |
| `MarketingReportingPeriod` | **WORKS** | **WORKS** | **MISSING** | **MISSING** |
| `BrandChannelMetric` | **WORKS** — `:311` upsert | **PARTIAL** | **MISSING** | **MISSING** |
| `WeeklySocialReport` | **WORKS** — `:321` upsert | **PARTIAL** | **MISSING** | **MISSING** |
| `StoryDailyMetric` | **WORKS** — `:331` upsert | **PARTIAL** | **MISSING** | **MISSING** |
| `CampaignOkr` | **MISSING** | **PARTIAL** — 1 `count` di `dashboards.service.ts` | **MISSING** | **MISSING** |
| `MarketingIntegrationConnection` | **WORKS** — `marketing-report.service.ts:466` upsert, secret di-encode | **WORKS** — `listIntegrations` | **PARTIAL** — upsert do-while | **MISSING** |
| `MarketingIntegrationSyncJob` | **PARTIAL** — row dibuat `:520`, **tidak pernah dieksekusi** | **MISSING** | **MISSING** | **MISSING** |
| `MarketingIdempotencyKey` | **WORKS** — `marketing-task.service.ts:287` | **WORKS** — `:272` | — | **WORKS** — `:284` |

### 1.4 CRM / LeadCapture / Guests

| Entity | C | R | U | D |
|---|---|---|---|---|
| `LeadCapture` | **WORKS** — `lead-capture.controller.ts:129`, service 118 delegate call | **WORKS** — `:148,155,162` | **PARTIAL** — `:169` `@Patch`, tak ada version check | **WORKS** — `delete/deleteMany` ada di `lead-ingestion.service.ts` |
| `CrmLead` | **MISSING** — nol create; lead lahir dari ingestion | **WORKS** — `leads.controller.ts:30,64,98` | **PARTIAL** — hanya `:111` stage + `:129` displayName + `:147` assign | **MISSING** |
| `LeadMessage` | **WORKS** — `omni-crm-conversation.service.ts` | **WORKS** — `leads.controller.ts:159` | **MISSING** | **MISSING** |
| `LeadAttribute` | **WORKS** — `lead-ingestion.service.ts` | **PARTIAL** | **WORKS** — upsert | **MISSING** |
| `LeadValidationLog` | **WORKS** — append-only | via stats | — | **MISSING** |
| `LeadAudit` | **WORKS** — `leads.service.ts`, `guestbook.service.ts` | **MISSING** — 0 read | — | **MISSING** |
| `GuestbookEvent` | **PARTIAL** — `guestbook.controller.ts:88` `@Body() body: any`, tanpa DTO | **WORKS** — `:28,55`, `take: min(limit,200)` | **PARTIAL** — `:70,79` approve/reject, status transition tanpa version | **MISSING** |
| `GuestLog` | **WORKS** — `guests.controller.ts:22`, `CreateGuestDto` class-validator penuh | **WORKS** — `:31,37` | **MISSING** | **MISSING** |
| `LostDeal` | **WORKS** — `lost-deals.controller.ts:21` | **WORKS** — `:30` | **MISSING** | **MISSING** |
| `RoundRobinState` | lihat 1.3 | | | |

### 1.5 Communication

| Entity | C | R | U | D |
|---|---|---|---|---|
| `CommunicationThread` | **WORKS** — `communication.controller.ts:34` | **WORKS** — `:42,72` | **PARTIAL** — `:77` `@Patch`, **tanpa `@Roles`** | **MISSING** |
| `CommunicationThreadReply` | **WORKS** — `:88` | **WORKS** | **PARTIAL** — service `update`, **tanpa `@Roles`** | **WORKS** — `comm-channel.service.ts` |
| `CommunicationMention` | **WORKS** — `:103` | **MISSING** | **MISSING** | **MISSING** |
| `CommunicationAttachment` | **WORKS** — `:118,144` | **WORKS** | **MISSING** | **MISSING** |
| `CommunicationPolicy` (platform-controls) | **MISSING** di controller | **MISSING** | **MISSING** | **MISSING** |

### 1.6 WA / Website

| Entity | C | R | U | D |
|---|---|---|---|---|
| `SelfQrDevice` | **WORKS** — `sales-device-manager.ts` | **WORKS** — `wa-self-qr.controller.ts:34,54,74` | **PARTIAL** — `:90,108` | **MISSING** |
| `SelfQrNormalizedEvent` | **WORKS** — `collector.service.ts` | **WORKS** — `:127` | **MISSING** | **MISSING** |
| `SelfQrHistoryRun` | **WORKS** | **WORKS** | **PARTIAL** | **MISSING** |
| `Article` | **MISSING** | **MISSING** | **MISSING** | **MISSING** |
| `WebsiteProduct` | **MISSING** | **MISSING** | **MISSING** | **MISSING** |

---

## 2. Temuan, dari yang paling parah

### P0-1 — `Article` (website.prisma:1) nol implementasi total; UI-nya menampilkan angka hardcoded
`Article` punya **0** pemanggilan delegate di seluruh `backend/src` (`grep -rn --include=*.ts -iE "\.article\b" backend/src` → 0 hit). Halaman yang menampilkannya adalah `frontend/src/app/(dashboard)/marketing/reports/workspace/components/WebsiteSection.tsx`, yang membaca dari konstanta modul `channelReportsData.ts:163` (`export const DREAMLAB_WEBSITE_REPORT: WebsiteReportData`) dan `:538` (`TORIBIO_WEBSITE_REPORT`) — objek literal 874 baris (`grep -c "" channelReportsData.ts` → 874). Ekspresi `Blog Article` yang muncul di `WebsiteSection.tsx:321,363` adalah `<option>` kategori task, bukan Article entity.
**Dampak:** kolom pengunjung, ranking query, dan traffic organic di UI tidak pernah menyentuh database. Angka yang tampil fiktif tapi tampil seolah real.
**Status:** inferensi kuat — tidak ada jalur lain yang bisa menghasilkannya, karena tidak ada kode server yang mengenal model ini.

### P0-2 — `POST /marketing-command/sync` mengembalikan sukses tanpa melakukan apa pun
`backend/src/modules/marketing/marketing-command.controller.ts:201-209` dan `:212-221` mengembalikan literal `{ success: true, message: 'Marketing data sync completed' }` tanpa menyentuh service, Prisma, atau HTTP mana pun. FE memanggilnya: `frontend/src/app/(dashboard)/marketing/digital/hooks/useSyncMarketing.ts:12` lalu `invalidateQueries` di `:16` sehingga UI me-refresh dan menampilkan data lama seolah-olah baru.
**Dampak:** pengguna menekan "Sync", melihat spinner selesai, dan yakin data Meta/Google sudah ditarik. Tidak pernah terjadi. Ini adalah silent-success — lebih buruk dari error.

### P0-3 — 8 endpoint `landing-tracker` tanpa guard, salah satunya **memutasi** state routing
`backend/src/modules/marketing/landing-tracker.controller.ts:30` `@Get()` dan `:51` `@Post()` tidak punya `@UseGuards`. Guard hanya mulai di `:84`. Yang problematic:
- `GET /marketing/landing-tracker?action=pick` (`:30-42`) memanggil `landingTrackerService.pickNextSales()`, yang di `landing-tracker.service.ts:110` menjalankan `incrementRotationCounter(counter)` — **read endpoint yang menulis state internal** (`RoundRobinState`), dapat dipanggil siapa pun tanpa auth.
- `POST /marketing/landing-tracker` (`:51`) `@Body() body: any` menulis `LandingPageConversion` (PII: nama, perusahaan, HP) tanpa validasi DTO.
- `:109` track, `:114` conversion, `:119` visits, `:124` conversions, `:129` stats, `:137` recent — semua terbuka; `:124`/`:129` mengembalikan PII lead ke publik.
**Dampak:** siapa pun bisa menggeser rotasi assignment sales (mempengaruhi routing lead sungguhan) dan men-scraper daftar prospek.

### P0-4 — Signature verifikasi webhook WhatsApp bisa dilewati hanya dengan tidak meng-set env
`backend/src/modules/wa-webhook/wa-webhook.service.ts:67` — `if (process.env.WA_APP_SECRET) { ...verify... }`. Bila env kosong, seluruh blok dilewati dan `handleIncoming` memproses payload apa pun. Default fallback-nya adalah string hardcoded: `:17` `process.env.WA_APP_SECRET || 'nex_wa_app_secret_test'` dan `:51` `process.env.WA_WEBHOOK_VERIFY_TOKEN || 'dreamlab_secret_2026'`.
Ditambah `:26` `return signature === expected` — perbandingan string biasa, bukan `crypto.timingSafeEqual` (timing attack, severity lebih rendah karena perlu presisi timing). Tidak ada proteksi replay: `isDuplicate(msgId)` ada tapi hanya setelah payload diterima dan body sudah diparse.
**Dampak:** di environment yang lupa set `WA_APP_SECRET`, endpoint publik `/wa-webhook` dan `/webhooks/whatsapp` menerima payload Metro se_When saja, dan `handleGateway` (`wa-gateway.controller.ts:14`, `@Body() body: any`, tanpa guard sama sekali) menulis ke DB dari sumber ketiga yang tidak diverifikasi.

### P0-5 — `MarketingIntegrationSyncJob` adalah tabel write-only
`marketing-report.service.ts:520` membuat row job lalu langsung mengembalikannya. `grep -rn "marketingIntegrationSyncJob" backend/src --include=*.ts` → **2 hit**: yang satu di service, satu di spec mock. Tidak ada worker, `@Cron`, `@Interval`, `BullModule`, atau `@Processor` di seluruh `backend/src/modules/marketing` yang menyentuh job ini. `status` akan `PENDING` selamanya.
**Dampak:** UI "Sync" untuk brand channel tidak pernah mengubah apa pun; `MarketingIntegrationConnection.lastSyncAt` tidak pernah bergerak.

### P1-6 — Tiga controller punya `JwtAuthGuard` tanpa `RolesGuard` dan tanpa satu pun `@Roles`
`grep -c "@Roles"` → **0** untuk ketiganya:
- `backend/src/modules/communication/communication.controller.ts:28` — 8 endpoint (create/read/update thread, reply, mention, attachment). `:77` `@Patch('threads/:id')` = user terautentikasi mana pun dapat mengubah thread milik siapa pun bila `comm-channel.service.ts` tidak scoping sendiri.
- `backend/src/modules/communication/entity-communication.controller.ts:23` — 14 endpoint lintas-entitas, termasuk `:50` `@Put notes/:noteId`, `:72` `@Delete notes/:noteId`.
- `backend/src/modules/wa-self-qr/wa-self-qr.controller.ts:25` — 9 endpoint devices, termasuk `:157` `POST sales-devices/:internalCode/connect-token` yang Residencekan perangkat WhatsApp sales.
**Catatan:** `wa-gateway.controller.ts:8` memang sengaja tanpa guard (gateway publik), tetapi `wa-self-qr.controller.ts` adalah surface internal yang bocor role check yang sama.

### P1-7 — `@Put` dengan `status` free-form pada `LandingPageConversion`
`landing-tracker.controller.ts:143-151` `@Put('conversions/:id/status')` menerima `@Body('status') status: string` (bukan DTO, bukan enum) lalu `landing-tracker.service.ts:409-412` menulis apa adanya. Tidak ada `updateMany({ where: { id, status: expected } })` → **lost update** dan **transisi status ilegal** keduanya mungkin; `PrismaClientKnownRequestError` saat `id` tidak ada akan menghasilkan 500, bukan 404.
**Verifikasi:** Reported candidate "canonical-marketing.controller.ts ~114" ternyata **aman** — `:114 @Patch('tasks/:id/status')` + `:115 @Roles(...TASK_READ_ROLES)`. Yang bermasalah di file itu adalah role set, bukan ketiadaan guard (§P2-9).

### P1-8 — `OmniCrmState` version check opsional → lost update
`omni-crm-state.service.ts:22` `if (expectedVersion !== undefined && expectedVersion !== existing.version)`. Bila clientomit `version` (DTO di `omni-crm-state.controller.ts:47` `@Body() body: { state: unknown; version?: number }`), pengecekan dilewati dan `:32` menulis `version: existing.version + 1` — optimistic concurrency yang bisa dimatikan oleh client, jadi tidak berfungsi sebagai guarantee.
**Ditambah:** `state: unknown` tanpa validasi → JSON sembarang bisa masuk ke kolom Json tanpa batas ukuran maupun bentuk.

### P1-9 — 5 model punya nol delegat: `Article`, `WebsiteProduct`, `SocialPostMedia`, `MarketingChannelFunnel`, `MetaAccountConfig`
Command: loop grep `\.{lc}\.(create|findMany|...)` per model terhadap `backend/src`. Kelima keluar `0`. Konsekuensi:
- `MetaAccountConfig` (`marketing.prisma:853`) — FE menyimpan `accessToken`/`pageId`/`igAccountId` di `useState` lokal (`MetaApiHubView.tsx:32-34`) dan mengirimkannya lewat `@Post('meta/test-connection')` (`:45`). Credensial Meta tidak pernah dienkripsi/disimpan; tiap muat ulang halaman = user paste ulang.
- `MarketingChannelFunnel` (`marketing.prisma:769`) — 0 kemunculan di `frontend/src` juga. Model mati total, bukan "page tanpa service".

### P2-10 — Tujuh ID di-mint di sisi client dengan `Date.now()`
`grep -rnE "Date\.now\(\)|Math\.random\(\)|crypto\.randomUUID" "app/(dashboard)/marketing" "app/(dashboard)/samples/social-tracker"` → **8 hit**, 7 di antaranya ID minting:
- `samples/social-tracker/components/NewPostModal.tsx:80` — `id: \`post-${Date.now()}\``
- `samples/social-tracker/SocialTrackerClient.tsx:326` — `id: \`post-${Date.now()}\``
- `samples/social-tracker/components/PostDrawer.tsx:114` — `id: \`c-${Date.now()}\`` (checklist item)
- `marketing/reports/workspace/components/WebsiteSection.tsx:103` — `id: \`wt-${Date.now()}\``
- `marketing/reports/workspace/components/WeeklyMetricModal.tsx:112` dan `WeeklyReportingSection.tsx:115` — `id: \`wr-${Date.now()}\``
- `marketing/reports/workspace/components/Modals.tsx:1978` — `id: story?.id || \`ds-${Date.now()}\``
Kedelapan hit, `marketing/management-task/components/CreateTaskModal.tsx:176`, **benar** — `crypto.randomUUID()` untuk idempotency key.
**Pola:** 5 dari 7 timestamp ID dibuat dalam rentang < 1 detik dari `NewPostModal`/`SocialTrackerClient` yang keduanya memakai prefiks `post-` → risiko collision nyata pada create beruntun.
**Koreksi terhadap premis:** pass sebelumnya melaporkan "7"; jumlah sebenarnya di scope ini juga 7, tapi saya hit sendiri (`grep`, bukan estimasi) — dan 8 bila `crypto.randomUUID` ikut dihitung.

### P2-11 — Nol schema validation di FE batch ini
`grep -rln "react-hook-form\|zodResolver\|from 'zod'" "app/(dashboard)/marketing" "app/(dashboard)/samples/social-tracker" hooks/useCanonicalMarketing.ts` → **0 file**. `grep -rln "react-hook-form" "app/(dashboard)/marketing" | wc -l` → **0**. Sementara total `useState` di marketing FE = **314**. `CreateTaskModal.tsx:57-69` mendefinisikan 13 field via `useState` murni; `:127 handleSubmit` memvalidasi secara ad-hoc.
**Catatan membanding:** backend contemporaneous memakai class-validator penuh (`canonical-marketing.dto.ts`, `CreateGuestDto` 12 field teranotasi). Asymmetry ini berarti error tervalidasi baru muncul setelah round-trip.

### P2-12 — `GuestbookEvent` create tanpa DTO
`crm/guestbook/guestbook.controller.ts:88-93` `@Post('guestbook/events/:id') @Body() body: any`, lalu `guestbook.service.ts:56 decide()`. Bandingkan `CreateGuestDto` (`guests/dto/create-guest.dto.ts`) yang tidak punya anotasi 12 anotasi — standar tidak konsisten dalam batch yang sama.

### P2-13 — Tulisan memakai role READ
`canonical-marketing.controller.ts` memakai `TASK_READ_ROLES` (`:46-51` = SUPER_ADMIN, HEAD_OPS, MARKETING, DIGIMAR) untuk operasi tulis: `:94` create task, `:104` update, `:114` status, `:124` delete task, `:142` create attachment, `:161` create checklist, `:190` create comment, `:234` update member. Hanya project & brand yang memakai `MANAGER_ROLES` (`:253,263,282,292`) atau `SOCIAL_WRITE_ROLES` (`:311,321,331`).
**Dampak:** `DIGIMAR` yang seharusnya read-only bisa menghapus task. Ini inkonsistensi internal, bukan bypass total.

### P2-14 — FE workspace Abu yang terkait P0-1 masih menampilkan data klinis
Catatan sampingan: `channelReportsData.ts` juga memasok `DREAMLAB_TIKTOK_REPORT:82`, `DREAMLAB_YOUTUBE_REPORT:123`, `DREAMLAB_META_ADS_REPORT:259`, `DREAMLAB_GOOGLE_ADS_REPORT:324` — semua konstanta. Yang ke-4 ini **bertentangan langsung** dengan `04_BUSINESS_RULES.md:1951` "Output 4: CRM Client Manager DUMMY arrays | BUS-RULE-105 (replace dengan SalesLead/LostDeal backend)" — aturan repo melarang array dummy, dan 4 report channel ini masih dummy.

### P2-15 — `connect-page.controller.ts` public tanpa rate limit
`wa-self-qr/connect-page.controller.ts:30 @Controller('connect-whatsapp')` tanpa guard; `:39 servePage` dan `:50 serveState` menyelesaikan token pada setiap request. Token-nya sendiri 32-byte hex dengan TTL 5 menit (komentar `:6-8`), jadi window-nya pendek. Yang perlu dicatat: `:55 serveQrPng` mengirim PNG dan `:39` mengirim HTML inline via `renderPage()` (`:44`) yang berarti string HTML besar di-assemble per-request. Rate limit pada `POST :token/regenerate` disebut di komentar tapi **belum diverifikasi ada di kode** → lihat §3.

---

## 3. Klaim yang TIDAK bisa saya verifikasi (dan kenapa)

1. **Apakah `connect-page.controller.ts:71 POST :token/regenerate` benar-benar rate-limited.** Komentar file `:13` mengklaim "rate-limited", tapi saya tidak menjalankan server; `grep -n "rate" wa-self-qr/connect-page.controller.ts` tidak saya jalankan sebagai bukti negatif. Status: UNVERIFIED.
2. **Apakah `comm-channel.service.ts` melakukan scoping tenant/ownership di `updateThread`.** Saya mengonfirmasi `communication.controller.ts:77` tidak punya `@Roles`, tapi tidak menelusuri seluruh 713 baris service untuk memastikan `updateThread` memeriksa `createdById`. Kalau ternyata tidak ada scoping, P1-6 naik ke P0.
3. **Apakah `MetaAccountConfig` pernah terisi lewat path lain** (seed, migration, job). Saya hanya grep `backend/src`. Tidak searched `backend/prisma/seed*` atau skrip migrasi.
4. **Apakah 4 report channel di `channelReportsData.ts` benar-benar tidak pernah di-override data live.** `BrandWorkspace.tsx` mengimpor konstanta itu, tapi saya belum menelusuri apakah ada merge dengan hasil query di antara keduanya. Yang terverifikasi: tidak ada service yang menghasilkan `Article`/`WebsiteProduct`.
5. **Kecepatan `isDuplicate(msgId)` pada `wa-webhook.service.ts`.** Saya konfirmasi ini ada dan dipakai sebelum write, tapi tidak menguji perilaku under concurrent delivery → proteksi replay diasumsikan, bukan dibuktikan.
6. **Apakah `wa-self-qr` memakai multi-tenant device isolation.** `internal-device-protection.ts` (29 baris) ada, tapi saya tidak membaca isinya.

---

## 4. Entitas tanpa UI, dan UI tanpa service

**Entitas dengan 0 delegat (5):** `Article`, `WebsiteProduct`, `SocialPostMedia`, `MarketingChannelFunnel`, `MetaAccountConfig`.

**UI tanpa backing service:**
- `samples/social-tracker/*` (19 file) — `MetaApiHubView.tsx` menyimpan cred Meta di `useState`; `MetaAnalyticsView.tsx` (11 baris import, tanpa fetch) sepenuhnya presentasional; `mockData.ts` ada di direktori yang sama.
- `marketing/reports/workspace/*` — 4 channel report dari konstanta (§P2-14).

**Entitas dengan service tapi tanpa halaman CRUD:** `SocialPostMedia`, `SocialPostMetricSnapshot`, `LeadAudit`, `CommunicationMention`, `RoundRobinState`, `MarketingIntegrationSyncJob`.

**Tidak ada direktori FE untuk:** `website/`, `crm/`, `guestbook/`, `wa-self-qr/`, `wa-webhook/` — semua 5 = ABSENT di `frontend/src/app/(dashboard)/`. UI CRM hidup di bawah path lain (`samples/`, `marketing/`) atau tidak ada sama sekali; ini yang membuat `CrmLead` dan `GuestbookEvent` terorphan dari sisi UI.

---

## 5. Ringkasan angka

Cell counts untuk 60 baris entitas di §1:

| | WORKS | PARTIAL | MISSING | UNVERIFIED |
|---|---|---|---|---|
| **C** (Create) | 26 | 8 | 26 | 0 |
| **R** (Read) | 30 | 12 | 18 | 0 |
| **U** (Update) | 8 | 11 | 41 | 0 |
| **D** (Delete) | 6 | 1 | 53 | 0 |

Pola yang jelas: **Update dan Delete adalah Running Out** — 41 entitas tanpa update, 53 tanpa delete. Yang punya delete hampir semuanya anak dari `MarketingTask` (comment, attachment, checklist), yang memang dirancang untuk dihapus. Tidak ada satu pun `deletedAt`/`archivedAt` di 5 file Prisma batch ini; satu-satunya soft-flag adalah `isActive` di `RoundRobinAgent:189`, `MarketingBrand:464`, `MarketingTeamMember:885` — semuanya aktif atau tidak, tidak pernah dipakai oleh endpoint delete manapun.

---

*Dokumen ini dibuat oleh audit statis (grep + read). Tidak ada runtime test, tidak ada server yang dijalankan. Semua klaim "tidak ada" mengikuti command yang disebut; jika command-nya tidak disebut, itu interpretasi.*
