# Deploy Prototype → demo.nexerp.id (server 5.223.80.88)

## Prasyarat
1. DNS: tambahkan A record `demo.nexerp.id` → `5.223.80.88` (di provider DNS domain nexerp.id).
2. Setelah DNS aktif, jalankan langkah SSL & reload nginx.

## Langkah deploy
1. Upload folder `frontend/` (source prototype) ke server: `/root/demo-prototype/frontend/`
2. Upload `docker-compose.demo.yml` ke `/root/demo-prototype/`
3. Jalankan di server:
   `cd /root/demo-prototype && docker compose -f docker-compose.demo.yml up -d --build`
4. Tambahkan blok port-80 ke `/root/nginx.conf` (dari `nginx-demo-80.conf`), lalu test & reload:
   `docker exec production-light-nginx-1 nginx -t && docker exec production-light-nginx-1 nginx -s reload`
5. Terbitkan cert SSL (setelah DNS aktif):
   `docker run --rm -v /root/certbot/conf:/etc/letsencrypt -v /root/certbot/www:/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot -d demo.nexerp.id --email admin@nexerp.id --agree-tos --no-eff-email`
6. Tambahkan blok port-443 ke `/root/nginx.conf` (dari `nginx-demo-443.conf`), reload nginx.
7. Buka https://demo.nexerp.id → login `superadmin@nexerp.id` / `password123`.

## Verifikasi
- `curl -I https://demo.nexerp.id` → 200
- Semua modul (executive, marketing, bussdev, finance, rnd, scm, warehouse, produksi, qc, hr, legality) tampil data contoh, tanpa error.
