# NexERP — Arsitektur (Sejak Konsolidasi 2026-09)

## Topologi Branch — SATU JALUR

```
feature branch ──PR──▶ main ──CI gate──▶ GHCR image per-SHA ──pull──▶ nexerp.id
                        ▲
             production-light DIARSIPKAN (tag archive/*)
```

Sejak 2026-09 repo hanya punya **satu branch production: `main`**. Era dua
produk (2026-07-23 → 2026-09): `main` = full ERP (36 modul, 19 file skema
Prisma) dan `production-light` = ERP ramping (8 modul, 6 skema) yang ternyata
live di nexerp.id — menyebabkan ambiguitas cherry-pick/bridge yang berulang.
Konsolidasi: infra deploy + bugfix produksi light dipindah ke main lewat
checkout per-path (bukan wholesale merge), branch lain di-tag arsip.
Sejarah lengkap: [PRODUCTION_LIGHT.md](PRODUCTION_LIGHT.md) (RETIRED).

## Stack Deploy

```
GitHub Actions (ubuntu)                 Biznet VPS 103.93.134.215 (4GB, TIDAK build)
┌────────────────────────┐              ┌──────────────────────────────────┐
│ build-and-test          │              │ /home/dreamlab/nexerp            │
│  docker build x2        │              │  compose project: production-*   │
│  boot backend+Postgres  │──▶ ghcr.io ─▶│   ├ nginx + certbot (profile     │
│  test-deploy.sh         │   per-SHA    │   │  server) → nexerp.id :443    │
│  consolidation.test.sh  │              │   ├ frontend (Next standalone)   │
│ push-images (:sha+:lat) │              │   ├ backend (NestJS :3001)       │
└────────────────────────┘               │   └ db (postgres:15, volume)     │
                                          │ dreamlab-lead (proyek LAIN,      │
                                          │  jangan disentuh: :6432)         │
                                          └──────────────────────────────────┘
```

- **Satu `docker-compose.yml`** untuk lokal & server (identik; bedanya `.env`
  + `IMAGE_TAG`). `--build` hanya di lokal.
- **Deploy** = `bash scripts/deploy.sh <sha>`; **rollback** =
  `bash scripts/rollback.sh <sha>` (image per-SHA abadi di GHCR).
- **Schema**: `prisma db push` saat boot via `backend/init-db.sh`
  (safe-first + dry-run aditif-check; DROPS diblokir → drift marker + log merah).

## Aplikasi

| Lapisan | Teknologi | Lokasi |
|---|---|---|
| Backend | NestJS + Prisma (PostgreSQL 15), prefix API `/api/v1` | `backend/src/modules/` (36 modul, incl. marketing/prototype+canonical, lead-capture, wa-webhook+gateway adapter) |
| Frontend | Next.js standalone (BUKAN Vite), Tailwind, DNA design system | `frontend/src/app/(dashboard)/` — routes: marketing/, samples/ (lead-capture, omni-crm), digital/, penjualan/, rnd/, finance/, warehouse/, dst. |
| Auth | JWT (header Bearer + fallback cookie `token` untuk `<img>` attachment) | `backend/src/modules/auth/jwt.strategy.ts` |

## Kontrak Anti-Regresi (dijaga CI)

1. PR ke `main` wajib lolos `build-and-test` → tak ada kode untested sampai VPS.
2. `scripts/__tests__/run-all.sh` — regression gates: konsolidasi 1-branch,
   GHCR pipeline, idempotensi init-db, integritas navigasi dokumen.
3. Aturan emas: lihat [docs/RUNBOOK-DEPLOY-NEXERP-V2.md](docs/RUNBOOK-DEPLOY-NEXERP-V2.md)
   (dilarang SCP file satuan, dilarang matikan type-checker, single source of truth `main`).
