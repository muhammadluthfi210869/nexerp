# DEPLOY.md — Panduan Deploy NexERP

## 🎯 Filosofi

Satu file compose untuk semua environment.
Yang beda cuma file `.env` (isi secret masing-masing).

```
Lokal:  docker compose up --build
Server: docker compose --profile server up -d --build
```

## 🚀 Cara Deploy

### Lokal (Development)
```bash
docker compose up --build
# Akses: http://localhost:3000
```

### Server (VPS) — Langsung, tanpa CI/CD
```bash
# 1. SSH ke server
ssh root@<ip-server>

# 2. Masuk ke folder project
cd /opt/nexerp   # atau /root/production-light

# 3. Pull code terbaru + deploy
git pull
docker compose --profile server up -d --build
```

⏱ **Selesai 1-3 menit.** (Dulu via GHCR: 1.5 jam)

### Via GitHub Actions (CI only — test, bukan deploy)
Pipeline di `.github/workflows/ci.yml` hanya:
- Build & unit test
- Integration test (backend + postgres)

Tidak ada push image ke GHCR, tidak ada deploy. Deploy tetap manual dari server.

## ⚙️ Struktur File

```
.
├── docker-compose.yml          # SATU file untuk semua env
├── .env                        # Secret (tidak di-commit)
├── nginx.conf                  # Reverse proxy (server only)
├── scripts/
│   ├── deploy.sh               # git pull + backup DB + build + deploy
│   └── setup-server.sh         # Setup server baru dari 0
└── certbot/                    # SSL certificates
```

## 🔧 docker-compose.yml — Penjelasan

| Service   | Fungsi            | Profile         |
|-----------|-------------------|-----------------|
| db        | PostgreSQL        | selalu          |
| backend   | NestJS + Prisma   | selalu          |
| frontend  | Next.js           | selalu          |
| nginx     | Reverse proxy SSL | server only     |
| certbot   | SSL auto-renew    | server only     |

Service dengan `profiles: ["server"]` otomatis di-skip di lokal.

## 📝 Port Convention

| Service  | Container Port | Host Port (default) |
|----------|---------------|---------------------|
| Backend  | 3001          | 3001                |
| Frontend | 3000          | 3000                |
| DB       | 5432          | (tidak di-expose)   |

## 🔐 File .env

Buat file `.env` di root project:

```env
# ── Wajib ──
JWT_SECRET=<string acak, minimal 32 karakter>

# ── Lokal (development) ──
NEXT_PUBLIC_API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000

# ── Server (VPS) ──
DOMAIN_NAME=nexerp.id
NEXT_PUBLIC_API_URL=https://nexerp.id/api
CORS_ORIGIN=https://nexerp.id
```

## 🧪 Troubleshooting

### Error: ReferenceError: Cannot access 'X' before initialization
**Penyebab**: Temporal Dead Zone (TDZ) — variable JS dipakai sebelum dideklarasi.
Hanya muncul di **production build** (minified), tidak di dev mode.

**Cek**: Pastikan semua `const` / `let` dipakai SETELAH deklarasi, terutama di
callback `useMemo` / `useEffect`.

### Error: 502 Bad Gateway (nginx -> backend)
Cek port backend:
```bash
docker exec <nginx-container> wget -q -O - http://backend:3001/health
docker logs <backend-container>
```

### Error: Host is unreachable (nginx)
**Penyebab**: Nginx dan frontend/backend di Docker network BERBEDA.
Pastikan semua container dari SATU compose project yang sama.

```bash
docker network inspect production-light_default
```

### Error: ERR_CERT_DATE_INVALID / sertifikat SSL kedaluwarsa
**Penyebab umum #1 — auto-renew gagal (authenticator `standalone`)**:
Kalau sertifikat pertama kali dibuat dengan metode `standalone` (bukan `webroot`),
maka `certbot renew` akan SELALU gagal karena port 80 sudah dipegang nginx.
Cek:
```bash
grep authenticator /opt/nexerp/certbot/conf/renewal/<domain>.conf   # harus "webroot"
```
Perbaiki dengan reissue memakai webroot:
```bash
docker run --rm \
  -v "$PWD/certbot/conf:/etc/letsencrypt" \
  -v "$PWD/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
    --email admin@<domain> --agree-tos --no-eff-email --force-renewal \
    -d <domain> -d www.<domain>
docker exec <nginx-container> nginx -s reload
```

**Penyebab umum #2 — nginx tidak pernah di-reload setelah renew**:
Nginx membaca sertifikat saat start/reload. Meski `certbot renew` sukses,
tanpa reload nginx tetap menyajikan sertifikat lama. Solusi: cron reload tiap
6 jam (dipasang otomatis oleh `setup-server.sh`):
```bash
cat /etc/cron.d/nexerp-nginx-reload   # 0 */6 * * * ... nginx -s reload
```

## 📋 Cheat Sheet

```bash
# Build + run semua service (lokal)
docker compose up --build

# Build + run semua service (server)
docker compose --profile server up -d --build

# Rebuild satu service
docker compose up -d --build --no-deps <service>

# Lihat logs
docker compose logs -f <service>

# Hentikan semua
docker compose down

# Masuk ke container
docker exec -it <container-name> sh
```
