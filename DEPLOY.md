# NexERP — Deploy Guide (Single Branch)

> **Satu branch (`main`), satu domain (`https://nexerp.id`), satu pipeline.**
> Workflow dua-branch + bridge (`production-light`) sudah DIARSIPKAN 2026-09.
> Jangan pernah deploy dari branch lain; jangan pernah SCP file satuan ke server.

## Arsitektur Deploy

```
push/merge → main
   │
   ▼
GitHub Actions (.github/workflows/ci.yml)
   ├─ build-and-test : build backend+frontend, boot backend vs Postgres
   │                   test-deploy.sh, consolidation.test.sh   ← GATE
   └─ push-images    : push ghcr.io/muhammadluthfi210869/nexerp/
                        {backend,frontend}:<sha> + :latest
   │
   ▼
VPS Biznet 103.93.134.215 (/home/dreamlab/nexerp, RAM 4GB — TIDAK pernah build)
   bash scripts/deploy.sh <sha>   →  backup DB → pull image → up -d → health gate
```

## Deploy baru

```bash
# 1. Pastikan CI hijau (build-and-test), merge ke main → CI push image otomatis.
# 2. Di VPS:
ssh dreamlab@103.93.134.215
cd /home/dreamlab/nexerp
git pull --ff-only origin main          # compose/nginx/scripts terbaru
bash scripts/deploy.sh <git-sha>        # atau: bash scripts/deploy.sh  (=latest)
```

`deploy.sh` otomatis: backup `pg_dumpall` → `docker compose pull` → `up -d`
(tanpa build) → health gate `/health` 60s → `verify-deploy.sh`.

## Rollback (sub-menit, tanpa git revert)

```bash
bash scripts/rollback.sh                # lihat daftar tag yang ter-cache
bash scripts/rollback.sh <sha-lama>     # switch IMAGE_TAG; image lokal = instan
```

Khusus DB rusak: restore `backups/pre-deploy-*.sql.gz` lalu restart container `db`.

## Konfigurasi server (sekali saja, sudah terpasang)

- `docker login ghcr.io -u muhammadluthfi210869 --password-stdin` (PAT `read:packages`)
- `.env` dari `.env.production.example` — **`JWT_SECRET` wajib** (dipakai build CI
  untuk frontend DAN runtime backend — dulu ini bikin 2x deploy gagal)
- Swap 2GB aktif; compose project name `production-light` dipertahankan
  DESA sebagai nama volume lama (postgres_data) — jangan diganti seenaknya.
- GitHub: secret `JWT_SECRET` + optional vars `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_WA_PHONE` untuk job `push-images`.

## Dev lokal

```bash
docker compose up --build     # compose yang SAMA; build lokal, tanpa profile server
```

## Schema database

Diterapkan otomatis saat container backend start: `backend/init-db.sh`
→ `prisma db push` **aman-dulu** (tanpa accept-data-loss); kalau terblokir,
dry-run diverifikasi bahwa perubahan murni aditif sebelum apply.
DROP akan DIBLOKIR keras + drift marker ditulis + log merah.
Marker: `rm /app/data/.schema-drift-acknowledged` di dalam container setelah
review manual (`<marker>.plan` berisi rencana migrasi yang ditolak).

## QA gate sebelum klaim selesai

Suite regresi shell: `bash scripts/__tests__/run-all.sh` (dipanggil CI).
Laporan gate ditulis ke `docs/qa-gate/YYYY-MM-DD-<topik>.md` (contoh format:
`docs/qa-gate/2026-09-14-deploy-architecture-fix.md`).
