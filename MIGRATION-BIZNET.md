# MIGRATION PLAN — Hetzner → Biznet Neo Lite (MS 4.2)

> **Dibuat**: 2026-08-05
> **Oleh**: Muhammad Luthfi (via Claude Code)
> **Target**: Biznet Neo Lite MS 4.2 — Ubuntu 26.04 LTS, 2 vCPU / 4 GB RAM / 60 GB Disk / 1 IP
> **Aplikasi**: NexERP `production-light` (RND + DigiMar + HR) + lead-capture/round-robin dreamlab.id
> **Strategi**: Dua server hidup bersamaan → DNS flip → validasi → baru matikan Hetzner

---

## 0. Prinsip Migrasi Tanpa Konflik

1. **Hetzner JANGAN dimatikan** sampai Biznet stabil minimal 3–7 hari.
2. **Semua file config/state di-copy dari server Hetzner** (bukan dari repo lokal).
3. **DNS TTL diturunkan dulu** (300 detik) 24–48 jam sebelum cutover.
4. **Cutover dilakukan di jam low-traffic** (malam), dengan dump DB final di detik terakhir.
5. **Rollback = cuma flip DNS kembali** ke Hetzner (dalam hitungan menit, tanpa kehilangan data).

---

## 1. TEMUAN ARSITEKTUR NYATA (diselidiki langsung dari server, 2026-08-05)

> ✅ Fakta ini sudah diverifikasi langsung lewat SSH ke Hetzner (5.223.80.88).

### Ada DUA sistem terpisah yang harus dimigrasi, bukan satu!

```
Hetzner 5.223.80.88 (Ubuntu, 4GB, UTC)
│
├── SISTEM 1 — NexERP ERP "production-light"
│   ├── Path:            /root/production-light        (BUKAN /opt/nexerp!)
│   ├── Containers:      frontend(3000), backend(3001), db, nginx(80/443), certbot
│   ├── Database:        postgres:15-alpine, DB `erp_database`, ±12 MB
│   ├── Volume:          production-light_postgres_data
│   ├── Domain:          nexerp.id (DNS dikelola Hetzner)
│   ├── SSL:             certbot → symlink ke archive (WAJIB rsync -a / tar -h)
│   └── Cron:            /etc/cron.d/nexerp-nginx-reload (tiap 6 jam reload nginx)
│
└── SISTEM 2 — Dreamlab Lead DB (round-robin website dreamlab)
    ├── Path:            /opt/dreamlab-lead
    ├── Containers:      dreamlab-lead-db-lead (postgres:17, localhost:5433),
    │                    dreamlab-lead-pgbouncer (0.0.0.0:6432 ← diakses VERCEL)
    ├── Database:        postgres:17-alpine, DB `dreamlab`, user `dreamlab1`, ±8 MB
    │                    Tabel: rr_counter, busdevs, leads, visitor_assignments
    ├── Volume:          dreamlab-lead_lead_postgres_data
    ├── Konsumen:        Website dreamlab.id (hosting di VERCEL) → IP:6432
    └── Cutover:         BUKAN lewat DNS — lewat env DATABASE_URL di Vercel!
```

### KOREKSI terhadap config awal (backend/.env)

| Variabel | Salah | Benar (hasil investigasi) |
|---|---|---|
| `HETZNER_DEPLOY_PATH` | `/opt/nexerp` | **`/root/production-light`** (folder /opt/nexerp cuma staging lama, tidak aktif) |
| `BIZNET_DEPLOY_PATH` | `/root/production-light` | **`/home/dreamlab/nexerp`** — karena Biznet tidak izinkan login root, project ditaruh di home user `dreamlab` (kompose pakai path relatif, jadi tidak masalah) |
| `SSH_USER` (Biznet) | `root` | **`dreamlab`** — Biznet menolak login root: "Please login as the user dreamlab" |
| Timezone | (rencana Asia/Jakarta) | **`Etc/UTC`** — Hetzner memakai UTC. Biznet default Asia/Jakarta → **WAJIB diubah ke UTC** agar logika SLA "hari ini" identik |

### DUA titik cutover yang harus dilakukan

1. **DNS `nexerp.id`** (di Hetzner DNS Console): A record `@` + `www` → `103.93.134.215` (untuk ERP)
2. **Vercel → env `DATABASE_URL`**: `postgresql://dreamlab1:<pass>@103.93.134.215:6432/dreamlab?sslmode=require` (untuk round-robin dreamlab). Ini diubah di dashboard Vercel, bukan DNS!

### Hal lain yang ditemukan

- Image yang aktif cuma 7 (production-light×5 + dreamlab-lead×2). Sisanya ~35GB image tua + build cache 36GB → **JANGAN di-transfer**, hanya `docker save` 7 image aktif.
- Certbot cert **baru di-renew hari ini** (cert2.pem) — segar, bagus untuk migrasi.
- Port 6432 (pgbouncer) harus bisa diakses Vercel → pastikan tidak diblokir firewall Biznet.
- `.env` production-light berisi `WA_BUSINESS_PHONE` + `WA_WEBHOOK_VERIFY_TOKEN` → ada WhatsApp webhook yang nge-post ke `nexerp.id/wa-webhook` → ikut DNS flip (aman).

---

## 2. DAFTAR POTENSI KONFLIK / BUG (Lengkap)

### A. Config & Secret — PALING KRITIS

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| A1 | `.env` tidak ada di git (`.gitignore`) — harus di-copy dari Hetzner, bukan dibuat baru | Semua integrasi rusak | `scp` file `.env` dari Hetzner, jangan copy-paste teks |
| A2 | `JWT_SECRET` berbeda di server baru | Semua session user invalid → semua user logout paksa | Pastikan JWT_SECRET di Biznet = persis di Hetzner |
| A3 | `AES_SECRET_KEY` berbeda | Data yang terenkripsi (kredensial WA/dll) TIDAK BISA didekripsi → permanen | Copy persis; jangan pakai default kalau Hetzner pakai custom |
| A4 | `GOOGLE_SHEETS_PRIVATE_KEY` bersifat multiline (BEGIN/END PRIVATE KEY) | Kalau ke-truncate/corrupt → dashboard Toribio gagal total | Copy via `scp` file utuh; verifikasi ada baris `-----BEGIN PRIVATE KEY-----` & `-----END PRIVATE KEY-----` |
| A5 | `KOMMO_LONG_LIVED_TOKEN` / `KOMMO_API_TOKEN` tidak ikut | Kommo auto-pull mati diam-diam | Pastikan ada di `.env` yang di-copy |
| A6 | `NODE_ENV` tidak production | Swagger aktif, CORS terbuka lebar (`origin: true`) | Pastikan `.env` punya `NODE_ENV=production` |
| A7 | `NEXT_PUBLIC_API_URL` adalah build ARG (frontend Dockerfile) | Kalau image di-build dengan URL salah → semua request API 404 | Build image dengan `NEXT_PUBLIC_API_URL=https://nexerp.id/api` |
| A8 | CORS | AMAN: sudah di-hardcode di `main.ts` (nexerp.id, www, dreamlab.id, www) | Tetap verifikasi `POST /api/lead-capture/track` dari origin dreamlab.id |

### B. Data & State

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| B1 | Versi PostgreSQL beda | `pg_dump` dari 15 → restore ke versi lain bisa gagal | Pastikan Biznet pakai `postgres:15-alpine` (sama dengan docker-compose) |
| B2 | `backend/data/marketing-prototype-state.json` adalah state LIVE — berubah setiap saat, bukan versi repo | Marketing prototype reset / kehilangan task | Copy versi terkini dari Hetzner saat cutover (bersamaan dengan dump DB) |
| B3 | `backend/dirlif-project-cbab4f5a2ec6.json` (Google service account) TIDAK di git | Kalau tidak di-copy → backend error di Google Sheets/Toribio | Wajib `scp` file ini manual dari Hetzner |
| B4 | `backend/uploads/` — attachment lead & file ERP | File hilang → gambar/download 404 | Rsync seluruh folder uploads |
| B5 | `round_robin_state` (singleton) & `round_robin_agents` | Ikut DB dump (aman) | Pastikan dump memakai `pg_dump` (bukan hanya tabel tertentu) |
| B6 | `init-db.sh` menjalankan `prisma db push --accept-data-loss` di setiap start | Normal = no-op. TAPI kalau schema di Biznet beda → bisa drop/alter data | Setelah restore, verifikasi jumlah row sama SEBELUM `up`; jangan start app dengan schema lama |
| B7 | File permission bind mount (`./backend/uploads`, `./backend/data`) | Backend container tidak bisa tulis → upload lead gagal | Pastikan owner folder sesuai UID container & chmod 755/775 |

### C. DNS & Jaringan

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| C1 | TTL DNS tinggi (default 3600+) | Setelah flip, sebagian visitor masih ke Hetzner hingga 1 jam → data terpecah | Turunkan TTL ke 300 detik minimal 24–48 jam sebelum cutover |
| C2 | Split-brain selama propagasi | Lead dari dreamlab masuk ke 2 DB (Hetzner & Biznet) | Cutover malam + dump final + jam pertama pantau; kalau lead nyasar, merge manual |
| C3 | Kommo webhook / WA webhook | Kalau di-set ke IP lama Hetzner (bukan domain) → setelah IP lama nonaktif, webhook mati | Cek di dashboard Kommo: URL harus `https://nexerp.id/api/lead-capture/kommo-webhook` (domain, bukan IP) |
| C4 | Firewall Biznet menutup port 80 | SSL HTTP-01 challenge gagal + user tidak bisa akses | Buka 80, 443, 22 di firewall Biznet SEBELUM up stack |
| C5 | `www` vs `nexerp.id` | AMAN: nginx.conf handle dua-duanya; pastikan SSL cert cover dua-duanya | Verifikasi cert SAN mencakup `nexerp.id` + `www.nexerp.id` |
| C6 | IPv6 | AMAN: `resolver ipv6=off` + health check `127.0.0.1` sudah di-commit | Tidak ada aksi |

### D. Time & Scheduling — SERING TERLUPAKAN

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| D1 | Timezone server beda | Logika "hari ini" untuk SLA due-date/task bisa bergeser → badge On time/Late salah (ingat commit SLA terakhir!) | Set `TZ=Asia/Jakarta` di Biznet, SAMAKAN dengan Hetzner (`timedatectl` di kedua server) |
| D2 | Kommo auto-pull / Toribio refresh | Jalan di container, tidak terpengaruh DNS | Cukup verifikasi jalan setelah up |

### E. Round-Robin & Website Dreamlab — KONFLIK KHUSUS

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| E1 | `dreamlab-widget.js` & `dreamlab-tracker.js` TIDAK ada di `frontend/public/` production-light — file-nya di `_archive/` | ✅ **SUDAH DIKONFIRMASI 2026-08-05**: `curl https://nexerp.id/dreamlab-widget.js` → **HTTP 307 redirect ke `/login`** (bukan 200, bukan 404). Berarti file ini TIDAK pernah diserve dari ERP → widget dreamlab PASTI di-embed inline/dihosting di tempat lain | Tidak perlu transfer file widget. Cukup verifikasi metode embed di dreamlab.id (inline script) + pastikan `window.DREAMLAB_API_URL` mengarah ke domain `nexerp.id` (bukan IP Hetzner) |
| E2 | Widget pakai `window.DREAMLAB_API_URL` | Kalau di-set ke `https://nexerp.id` → ikut DNS flip (aman). Kalau di-set ke IP Hetzner → harus update di kode dreamlab.id | Cek konfigurasi widget di dreamlab.id sebelum cutover |
| E3 | 3 sales hardcoded di widget (Annisa/Ami/Mutmah) vs `round_robin_agents` di DB | Dua sumber kebenaran → bisa tidak konsisten (mis. nomor Bu Dilla sudah dihapus di DB tapi masih di widget) | Pastikan DB `round_robin_agents` adalah sumber utama (server-side). Verifikasi setelah restore |
| E4 | Lead yang masuk selama window migrasi | Bisa terpecah antara 2 server | Merge manual kalau terjadi; atau pause smart button selama 15 menit cutover |
| E5 | CORS dreamlab.id | AMAN, sudah hardcode | — |

### F. Aplikasi / Runtime

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| F1 | Lupa `--profile server` | nginx & certbot tidak start → tidak ada HTTPS | Selalu `docker compose --profile server up -d` |
| F2 | Build di Biznet (2 vCPU/4 GB) | Next.js build bisa OOM → server restart/mati | Transfer image hasil build dari Hetzner (`docker save`/`load`), jangan build di Biznet |
| F3 | Drift kode antar server | Fitur beda antara Hetzner & Biznet | Pastikan kedua server di branch & commit yang sama (`git rev-parse HEAD` di keduanya) |
| F4 | Port 80/443 sudah terpakai | Server baru biasanya kosong | `ss -tlnp` cek sebelum up |
| F5 | `deploy.sh` pakai `--build` | Build di Biznet = OOM | Pakai `deploy-biznet.sh` (tanpa `--build`) |

### G. SSL / Certbot

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| G1 | Certbot rate limit (5/hostname/minggu) | Re-issue di server baru bisa kena limit | Copy folder `certbot/conf` + `certbot/www` dari Hetzner (bukan re-issue) |
| G2 | `certbot/conf/renewal/nexerp.id.conf` tidak ikut ter-copy | Auto-renewal gagal setelah 90 hari → SSL expired diam-diam | Pastikan seluruh folder `certbot/conf` (termasuk `renewal/`) ikut rsync |

### H. Operasional / Rollback

| # | Potensi Konflik/Bug | Dampak | Cara Menghindari |
|---|---|---|---|
| H1 | Tidak ada backup sebelum matikan Hetzner | Data hilang permanen kalau Biznet bermasalah | Sebelum matikan Hetzner: `pg_dumpall` final + tar `/opt/nexerp` (kecuali node_modules/.git) → simpan di lokal |
| H2 | Rollback tidak siap | Panik saat Biznet error | Prosedur rollback = flip DNS ke Hetzner (3 menit). Simpan IP Hetzner + catat A record lama |
| H3 | `backups/` di Hetzner berisi dump lama | Bukan konflik | Bisa dijadikan sumber fallback tambahan |

---

## 3. PLAN EKSEKUSI LANGKAH DEMI LANGKAH

### Fase 0 — Persiapan (di laptop, sebelum sentuh server)

1. **Cek akses SSH** ke Hetzner dan Biznet (`ssh root@<IP>` dua-duanya).
2. **Cek TZ kedua server**: `timedatectl` di Hetzner → catat zona (harus sama dengan Biznet nanti, biasanya `Asia/Jakarta`).
3. **Cek status widget dreamlab** (SUDAH DILAKUKAN 2026-08-05):
   ```bash
   curl -sI https://nexerp.id/dreamlab-widget.js      # → HTTP 307 (redirect ke /login)
   curl -sI https://nexerp.id/dreamlab-tracker.js     # → HTTP 307 (redirect ke /login)
   curl -s  https://nexerp.id/api/lead-capture/round-robin/status  # → HTTP 200 ✓
   ```
   - **Hasil: file widget TIDAK diserve dari ERP** (307 → login). Widget di dreamlab.id di-embed inline/dihosting lain.
   - Yang penting: **API lead-capture/round-robin hidup (200)** → ikut DNS flip.
   - **Tetap verifikasi** di kode dreamlab.id: apakah `window.DREAMLAB_API_URL` mengarah ke `https://nexerp.id` (aman) atau ke IP Hetzner (harus diupdate).
4. **Turunkan TTL DNS** `nexerp.id` (A record) ke 300 detik via panel DNS provider.
5. **Catat IP lama Hetzner** (untuk rollback).
6. **Cek webhook Kommo** di dashboard Kommo: pastikan URL pakai domain `nexerp.id`, bukan IP.

### Fase 1 — Provision Biznet (server baru)

7. `ssh root@<IP_Biznet>`
8. **Set timezone = UTC** (Hetzner memakai `Etc/UTC`; Biznet default Asia/Jakarta — kalau dibiarkan, logika SLA "hari ini" bergeser 7 jam dan badge On time/Late bisa salah):
   ```bash
   timedatectl set-timezone Etc/UTC
   ```
9. **Buka firewall**: 22, 80, 443 (UFW/firewall panel Biznet).
10. **Install Docker + compose** (pakai `scripts/setup-server.sh` yang sudah diperbaiki untuk Ubuntu).
11. **Buat swap 4 GB**:
    ```bash
    fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
12. **Clone repo** branch `production-light` ke `/opt/nexerp`.

### Fase 2 — Transfer dari Hetzner → Biznet

13. **Dump DB di Hetzner**:
    ```bash
    docker exec <db-container> pg_dumpall -U erp_user > /opt/nexerp/backups/migration.sql
    ```
14. **Rsync file-file penting SISTEM 1 (ERP)** — dari `/root/production-light` (bukan /opt/nexerp!):
    ```bash
    rsync -az root@5.223.80.88:/root/production-light/.env  /root/production-light/.env
    rsync -az root@5.223.80.88:/root/production-light/backend/dirlif-project-cbab4f5a2ec6.json  .../
    rsync -az root@5.223.80.88:/root/production-light/backend/data/  .../backend/data/
    rsync -az root@5.223.80.88:/root/production-light/backend/uploads/  .../backend/uploads/
    # ⚠️ certbot WAJIB pakai rsync -a agar SYMLINK (live → archive) tetap utuh:
    rsync -az root@5.223.80.88:/root/production-light/certbot/  .../certbot/
    ```
    **Dump DB ERP** (postgres 15, `erp_database`):
    ```bash
    docker exec production-light-db-1 pg_dump -U erp_user -d erp_database > /root/production-light/backups/migration-erp.sql
    ```

14b. **Rsync SISTEM 2 (dreamlab-lead)** — dari `/opt/dreamlab-lead`:
    ```bash
    rsync -az root@5.223.80.88:/opt/dreamlab-lead/  .../dreamlab-lead/
    # (compose + .env ikut tercopy; PASTIKAN .env ikut, berisi LEAD_DB_PASSWORD)
    ```
    **Dump DB lead** (postgres 17, `dreamlab`, user `dreamlab1`):
    ```bash
    docker exec dreamlab-lead-db-lead-1 pg_dump -U dreamlab1 -d dreamlab > /opt/dreamlab-lead/backups/migration-lead.sql
    ```
15. **Build image di Hetzner** (kalau image belum ada / kode berubah):
    ```bash
    docker compose --profile server build
    docker save <backend-img> <frontend-img> <postgres-img> <nginx-img> <certbot-img> -o images.tar
    ```
    Lalu transfer `images.tar` ke Biznet → `docker load -i images.tar`.
16. **Kalau widget ternyata 200 (step 3)** → copy `_archive/frontend/dreamlab-widget.js` & `dreamlab-tracker.js` ke `frontend/public/` dan commit.

### Fase 3 — Restore & Test di Biznet

17. **SISTEM 1**: Start DB ERP saja: `docker compose up -d db`
18. **Restore DB ERP**: `docker exec -i production-light-db-1 psql -U erp_user -d erp_database < migration-erp.sql`
18b. **SISTEM 2**: Deploy dreamlab-lead di Biznet (postgres:17 + pgbouncer):
    ```bash
    cd /opt/dreamlab-lead
    docker compose -f docker-compose-lead.yml up -d --build
    ```
18c. **Restore DB lead**: `docker exec -i dreamlab-lead-db-lead-1 psql -U dreamlab1 -d dreamlab < migration-lead.sql`
19. **Verifikasi data** (bandingkan dengan Hetzner):
    ```sql
    SELECT (SELECT count(*) FROM users) AS users,
           (SELECT count(*) FROM "LeadCapture") AS leads,
           (SELECT count(*) FROM "RoundRobinAgent") AS rr_agents;
    ```
20. **Up stack**: `bash scripts/deploy-biznet.sh` (tanpa `--build`)
21. **Test di Biznet** (lewat IP langsung, pakai `/etc/hosts` override dulu):
    - `curl http://<IP_Biznet>:3001/health` → `{"status":"ok"}`
    - Login admin → dashboard terbuka
    - `/api/lead-capture/round-robin/status` → agent list benar
    - Marketing task → task & SLA benar
22. **Test HTTPS** (sebelum DNS flip): override `/etc/hosts` `nexerp.id → IP_Biznet`, buka `https://nexerp.id` → valid cert (karena cert di-copy).

### Fase 4 — Cutover (malam, low traffic)

23. **Dump final KEDUA DB dari Hetzner** (ERP + lead) + restore ke Biznet (data fresh hingga detik terakhir).
24. **Flip A record** `nexerp.id` → IP Biznet (di Hetzner DNS Console: `@` dan `www`).
25. **Flip Vercel → `DATABASE_URL`**: ubah IP dari `5.223.80.88` → `103.93.134.215:6432` di dashboard Vercel (Environment Variables). Redeploy/restart di Vercel.
26. **Verifikasi dari lokal**: `curl -sI https://nexerp.id` → pastikan sampai ke Biznet (cek IP di DNS: `nslookup nexerp.id`).
27. **Test end-to-end widget**: buka dreamlab.id → klik WA button → tracking code masuk ke DB lead Biznet (tabel `leads` / `visitor_assignments`).
28. **Cek Kommo webhook** mulai menerima (log backend: `docker logs backend | grep Kommo`).

### Fase 5 — Monitoring & Rollback

28. **24–48 jam pantau**: lead-capture masuk? round-robin jalan? `docker stats`, `free -h`, log error?
29. **Cek SLA dashboard** — pastikan badge On time/Late tidak berubah aneh (verifikasi timezone).
30. **Kalau ada masalah serius** → flip DNS kembali ke Hetzner (rollback instan, tanpa migrasi balik).
31. **Setelah stabil 3–7 hari**:
    - Backup final dari Hetzner (dump DB + tar `/opt/nexerp` → simpan di lokal)
    - **Baru matikan server Hetzner**
    - Kembalikan TTL DNS ke nilai normal

---

## 4. SKRIP YANG SUDAH DISIAPKAN (scripts/)

| Skrip | Dijalankan di | Fungsi |
|---|---|---|
| `setup-server.sh` | Biznet (sekali) | TZ UTC, install Docker (fix Ubuntu), swap 4GB, group docker, clone repo ERP |
| `migrate-to-biznet.sh` | **Laptop** (Git Bash) | Dump 2 DB, docker save 7 image, tar runtime files, transfer ke Biznet, docker load |
| `deploy-biznet.sh` | Biznet | Start ERP (tanpa `--build`), restore DB ERP, buat cron nginx-reload, health check |
| `setup-lead.sh` | Biznet | Start postgres:17+pgbouncer, restore DB lead, tampilkan DATABASE_URL untuk Vercel |

> Konfigurasi (IP, path, user) dibaca dari `backend/.env` → variabel `HETZNER_IP`, `BIZNET_IP`, `HETZNER_DEPLOY_PATH`, `BIZNET_DEPLOY_PATH`, `BIZNET_LEAD_PATH`, `SSH_USER`, `BIZNET_SSH_USER`.

## 5. CHECKLIST VERIFIKASI FINAL (sebelum matikan Hetzner)

- [ ] `https://nexerp.id` diakses → IP Biznet (bukan Hetzner)
- [ ] Login semua role user normal
- [ ] Dashboard marketing/RND/HR normal
- [ ] Management task & SLA badge benar (On time/Late sesuai)
- [ ] Lead-capture baru dari dreamlab.id masuk ke DB Biznet
- [ ] Round-robin menghasilkan nomor bergantian (3 sales)
- [ ] Kommo auto-pull jalan (`docker logs backend | grep -i kommo`)
- [ ] Dashboard Toribio (Google Sheets) jalan
- [ ] SSL valid & auto-renew berjalan (`certbot/conf/renewal/nexerp.id.conf` ada)
- [ ] Upload/attachment lead bisa diakses
- [ ] Backup final Hetzner tersimpan di lokal
