# Rancangan Persiapan: Self-QR Jessica + Broadcast Nomor Terdaftar

Tanggal: 2026-09-25
Status: **RANCANGAN — belum ada kode diubah.**
Keputusan terkunci: D1 = service terpisah, D2 = terima saja.
Diusulkan, belum dikonfirmasi: D3 = migrasi baru pasca-P04, D4 = angkut selektif dari branch.

---

## Bagian A — Broadcast ke nomor yang sudah terdaftar (kecuali Jessica)

### Jalur broadcast yang benar-benar ada

Satu-satunya jalur kirim nyata di ERP:

```
POST /marketing/omni-crm/conversations/send     (JwtAuthGuard + RolesGuard)
  → omni-crm-conversation.service.ts::sendOutbound()
  → https://graph.facebook.com/v18.0/{phoneNumberId}/messages
     body: { messaging_product, recipient_type:'individual', to, type:'text', text:{body} }
```

Persyaratan runtime (dibaca dari env, **bukan** dari DB):

| Env var | Dipakai untuk | Ada di server live `nexerp.id`? |
|---|---|---|
| `META_WHATSAPP_ACCESS_TOKEN` atau `USER_TOKEN` | Bearer token Graph API | **TIDAK ADA** |
| `BUSDEV_1_PHONE_NUMBER_ID` | nomor pengirim Annisa | **TIDAK ADA** |
| `BUSDEV_2_PHONE_NUMBER_ID` | nomor pengirim Irma | **TIDAK ADA** |
| `BUSDEV_3_PHONE_NUMBER_ID` | nomor pengirim Diaz | **TIDAK ADA** (dan tidak ada di mana pun di repo) |

`getGatewayStatus()` akan melaporkan `configured:false, tokenConfigured:false, configuredAccountCount:0`.

### Kesimpulan broadcast

- **Hari ini: 0 nomor bisa dibroadcast.** Bukan karena Jessica, tapi karena server live hanya punya satu identitas WA (`WA_PHONE_NUMBER_ID=1250985101431319`, nomor `6287793032556`, WABA `1580085997047909`) — dan jalur kirim omni-crm **tidak membaca** variabel `WA_*` itu sama sekali. Ia hanya membaca `META_WHATSAPP_ACCESS_TOKEN`/`USER_TOKEN` + `BUSDEV_{n}_PHONE_NUMBER_ID`.
- Bahkan setelah env ditambahkan: **Annisa (`BUSDEV_1`) + Irma (`BUSDEV_2`) = 2 nomor.** Diaz **tidak** terjangkau — tidak ada slot `BUSDEV_3` di mana pun.
- **Ketidakcocokan yang harus diverifikasi lebih dulu:** `BUSDEV_1_PHONE_NUMBER_ID=116397311522216` di `.env` ERP. Menurut tabel WABA yang terverifikasi, `116397311522216` itu **WABA ID** milik Annisa, sedangkan **phone_number_id** Annisa adalah `105186819325503`. `scripts/verify-waba-e2e.mjs` memperlakukan `116397311522216` sebagai `phoneNumberId`. Salah satu dari dua ini keliru; kirim ke ID yang salah akan balas error Graph API. **Verifikasi via `GET /v18.0/{id}?fields=display_phone_number` sebelum kirim apa pun.**

### Batas 24 jam Meta (blocker untuk broadcast dingin)

Kode saat ini **text-only, tanpa dukungan template**. Broadcast ke nomor yang tidak mengirim pesan dalam 24 jam terakhir akan ditolak Meta dengan error `131047` (re-engagement message). Token System User yang ada sekarang juga **tidak bisa** list/create template:

- `GET /{waba}/message_templates` → `(#100) Tried accessing nonexisting field`
- `GET /me/businesses` → `(#100) Missing Permission`

Artinya: token ter-scope hanya ke WABA milik app sendiri (`341949621370175`), bukan WABA bizdev. **Broadcast dingin tidak mungkin sampai token di-scope ulang atau template dibuat lewat Business Manager.**

Praktisnya: broadcast hanya jalan untuk lead yang **sudah chat dalam 24 jam terakhir** (= balasan di dalam thread aktif), atau setelah template disetujui.

### Langkah minimum kalau broadcast tetap mau dijalankan

1. Tambah ke `.env` server: `META_WHATSAPP_ACCESS_TOKEN` (System User, never-expire), `BUSDEV_1_PHONE_NUMBER_ID`, `BUSDEV_2_PHONE_NUMBER_ID`, opsional `BUSDEV_3_*` untuk Diaz.
2. Tambah `BUSDEV_*` ke blok `environment:` di `docker-compose.yml` (sekarang **tidak ada** — jadi walau `.env` diisi, container tidak akan melihatnya).
3. Verifikasi setiap `phone_number_id` via Graph API sebelum dipakai.
4. Tambah guard window 24 jam + jalur template di `sendOutbound()` (`ponytail:` penanda batas), atau batasi broadcast ke thread aktif saja.
5. Diaz butuh onboarding WABA dulu (nomor + verifikasi) sebelum punya `BUSDEV_3`.

---

## Bagian B — Self-QR untuk Jessica

### Yang sudah ada (bukan dari nol)

Branch **belum di-merge**: `release/marketing-self-qr` @ `0a7d24c7` — **bukan ancestor** dari HEAD (`69829e07`) maupun `main`.

Isi yang relevan:

| Artefak | Path | Catatan |
|---|---|---|
| Modul NestJS (21 file) | `backend/src/modules/wa-self-qr/` | collector, sales-device-manager, connect-page controller, transport, dedup, identity-resolver, dll |
| Skema | `backend/prisma/schema/self-qr.prisma` | `SelfQrDevice`, `SelfQrNormalizedEvent`, `SelfQrHistoryRun` + 3 enum |
| Migrasi | `backend/prisma/migrations/20260824000000_self_qr_tables/` & `20260823200000_r4_create_self_qr_devices/` | 114 baris |
| Deps | `whatsapp-web.js@1.34.7`, `qrcode`, `qrcode-terminal`, `@types/qrcode` | sudah di `package.json` branch |
| Registrasi | `backend/src/app.module.ts` | sudah terdaftar di branch |
| Sesi pairing nyata di disk | `backend/storage/self-qr-auth/{SALES-LUTHFI,TESTER-1}/` | bukti QR pernah di-scan |

**`SALES_DEVICES` sudah memuat Jessica:**
```
SALES-NISA    6281952417051
SALES-JESSICA 6287712232389   ← target
SALES-DIAZ    6287776550657
SALES-IRMA    6285133188827
```

### Tiga blocker nyata

1. **Transport read-only.** `whatsapp-webjs-transport.ts` sengaja tidak mengekspos method kirim apa pun (header komentar eksplisit: tidak ada `sendMessage`/`reply`/`forward`/`broadcast`/`relayMessage`/`sendTemplate`/`sendChat`/`sendText`). Collector bisa **menerima**, tidak bisa **mengirim**. Verifikasi ulang: grep seluruh modul → satu-satunya `.send()` adalah `res.send()` milik HTTP response controller.

2. **Host tidak punya Chrome.** `CHROME_PATH` di-hardcode ke `C:\Program Files\Google\Chrome\Application\chrome.exe` — Windows-only. Server live Biznet = Alpine Linux, backend container Alpine, **tidak ada Chrome/Chromium** di host maupun container. whatsapp-web.js (Puppeteer) tidak bisa jalan di sana apa adanya.

3. **Tabel tidak ada di DB live.** Query `information_schema` untuk `self%`/`%qr%` → **kosong**. `backend/prisma/diff_p04.sql` L735/L780 justru `DROP TABLE "self_qr_devices"` + `DROP TYPE "SelfQrDeviceStatus"`, sementara migrasi pre-flight masih membuatnya. Rantai migrasi kanonik dan kode self-QR **saling bertentangan**.

Tambahan: nama env melenceng — variabel bernama `SELF_QR_BAILEYS_*` padahal transportnya whatsapp-web.js, dan `SELF_QR_INTERNAL_DEVICE_PHONES` / `SELF_QR_AUTH_ROOT` di `.env` lokal **tidak dibaca kode mana pun** (yatim), serta **tidak ada** di `.env` server.

### Keputusan yang sudah diambil (2026-09-25)

**D1 — Host collector: SERVICE TERPISAH.** ✅ diputuskan
Container/VPS kecil sendiri yang punya Chromium. Backend Alpine di VPS 4GB dengan guard `--max-old-space-size=1536` tidak ditambah beban Chromium (~400MB image + RAM per sesi WA).

Bentuk yang paling murah: **satu basis kode, dua image.** Modul `wa-self-qr` tetap di repo backend, tapi dapat Dockerfile sendiri (ber-Chromium) dan service sendiri di `docker-compose.yml`. Collector bicara ke DB yang sama lewat jaringan. Tidak perlu memecah repo atau menulis app NestJS kedua — dua deployable dari satu sumber. Ini menghindari langkah "ekstrak modul" yang tidak perlu.

Kalau nanti collector harus jalan di VPS yang berbeda dari DB, baru pertimbangkan endpoint HTTP internal sebagai pengganti akses DB langsung.

**D2 — Peran Jessica: TERIMA SAJA.** ✅ diputuskan
Pertahankan transport read-only apa adanya. Tidak ada kode kirim baru, tidak ada perubahan di `sendOutbound()`. Jessica capture inbound (nama + nomor) untuk lead monitor; tidak ikut broadcast. Boundary read-only jadi aset, bukan halangan.

**D3 — Rekonsiliasi skema: migrasi BARU pasca-P04.** ✅ diusulkan
Tambah migrasi baru bertanggal **setelah** P04 yang membuat ulang `self_qr_devices` + `SelfQrDeviceStatus` + `self_qr_normalized_events` + `self_qr_history_runs`. Jangan mengedit `diff_p04.sql` — itu jejak sertifikasi fase yang sudah lewat, mengeditnya membuat riwayat migrasi berbohong. Juga jangan memakai ulang `20260823200000_r4_create_self_qr_devices` apa adanya tanpa memeriksa apakah jalur P04 akan men-DROP-nya lagi di urutan berikutnya. Periksa dulu apakah P04 punya jalur re-run; kalau ya, migrasi baru harus idempoten.

**D4 — Strategi branch: angkut selektif.** ✅ diusulkan
Rebase `release/marketing-self-qr` ke HEAD, tapi **angkut hanya**: `backend/src/modules/wa-self-qr/**`, `backend/prisma/schema/self-qr.prisma`, migrasi self-QR, dep `whatsapp-web.js`/`qrcode`/`@types/qrcode`, dan baris registrasi di `app.module.ts`. Sisa cakupan branch itu (Marketing WhatsApp Sales, Lead Validation) ditinjau terpisah — jangan dibawa serta dalam satu commit besar.

Karena D1 = service terpisah dengan image sendiri, pertimbangkan **tidak** mendaftarkan `WaSelfQrModule` di `app.module.ts` backend utama sama sekali. Daftarkan hanya di entrypoint collector (`main.ts` kedua atau flag env). Diff ke ERP jadi nyaris nol, dan modul WA tidak bisa tidak sengaja membebani proses ERP.

### Urutan persiapan (D1 & D2 sudah dikunci; D3–D4 masih perlu keputusanmu)

1. Kunci D3 (bentuk migrasi rekonsiliasi) + D4 (cakupan yang diangkut dari branch). Tanpa dua ini, implementasi salah arah.
2. Rebase + angkut selektif modul self-QR ke HEAD. `npx tsc --noEmit` + jalankan 7 spec di `wa-self-qr/__tests__/`.
3. Tulis migrasi baru pasca-P04 untuk `self_qr_devices` + enum + 2 tabel lain. Terapkan ke DB. Verifikasi `information_schema` sudah memuat ketiganya.
4. Ganti `CHROME_PATH` hardcode → baca `CHROME_EXECUTABLE_PATH` dari env **tanpa** default Windows (gagal jelas kalau kosong; jangan diam-diam jatuh ke path Windows).
5. Siapkan host collector terpisah (D1). Base image ber-Chromium (`node:20-slim` + Chromium, atau Alpine + `chromium` + `nss/freetype/harfbuzz/ttf-freefont`). Salin pola sesi yang sudah berhasil dari `storage/self-qr-auth/` sebagai acuan konfigurasi LocalAuth.
6. Sediakan env collector: `SELF_QR_AUTH_ROOT`, `CHROME_EXECUTABLE_PATH`, `SELF_QR_INTERNAL_DEVICE_PHONES` (hanya kalau dipakai — sekarang yatim). Di service collector itu sendiri, **bukan** di blok `environment:` backend ERP.
7. Tentukan `SALES_DEVICES` untuk collector terpisah: hanya `SALES-JESSICA` yang perlu di-bootstrap, bukan keempatnya. Jangan bawa Nisa/Diaz/Irma ke QR kalau mereka sudah punya WABA.
8. Jalankan alur pairing lewat `connect-page.controller.ts` (`/connect-whatsapp/:token`, TTL token 5 menit, refresh QR 90 detik). Scan QR dari HP Jessica.
9. Verifikasi: pesan masuk ke nomor Jessica muncul sebagai `SelfQrNormalizedEvent` ter-dedup, ter-resolve identitasnya, dan **tidak** bocor ke jalur broadcast.
10. (Tidak berlaku — D2 = terima saja. Tidak ada jalur kirim yang ditulis.)

### Risiko yang perlu dicatat

- whatsapp-web.js adalah klien tidak resmi; sesi bisa ter-logout dan WhatsApp dapat membatasi nomor yang memakainya. Jessica akan bergantung pada sesi QR yang harus di-scan ulang saat logout.
- Nomor Jessica saat ini **belum terdaftar di WABA**. Setelah dipakai self-QR, jangan berharap nomor yang sama bisa dipakai Cloud API bersamaan tanpa konflik.
- Collector menyimpan sesi penuh (kredensial) di `storage/self-qr-auth/` — volume itu harus di luar image dan tidak pernah masuk git.