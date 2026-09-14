# QA Gate Report — Konsolidasi Satu-Branch + Pipeline GHCR

**Tanggal:** 2026-09-14
**Branch:** `consolidation/merge-production-light` (base `main` @ 4e8c8c8)
**Commit:** 48c8ea7
**Keputusan:** BELUM SIAP PRODUKSI — kode lolos gerbang lokal; cutover VPS
belum dijalankan dan wajib lolos gerbang Fase C di bawah sebelum klaim selesai.

## Ruang lingkup
Merger `production-light` (live nexerp.id) ke `main` sebagai satu-satunya
branch production + memindahkan deploy ke CI→GHCR→pull (VPS tidak pernah
build). Mekanik: path-scoped checkout (bukan wholesale merge — precedent
bencana e75fbe1).

## Gerbang yang SUDAH dijalankan (lokal)

| # | Gerbang | Hasil |
|---|---|---|
| 1 | Backend build (`nest build`, 36 modul, prisma generate 19 file) | ✅ 432 file, 0 error |
| 2 | Frontend build penuh (`next build` = compile + **type check** + prerender 227 halaman) | ✅ 0 error (dari 161 error tipe WARISAN main — semua diperbaiki; 2 di antaranya bug runtime nyata: DnaDatePicker `e.target.value` saat kontraknya string) |
| 3 | Suite regresi shell `scripts/__tests__/run-all.sh` (konsolidasi, CI-GHCR, init-db idempotensi, integritas dokumen, rollback, snapshot) | ✅ 8/8 |
| 4 | `docker compose config` (compose terpadu, profile server) | ✅ valid |
| 5 | Aturan regresi: test lebih dulu — `consolidation.test.sh` + `ci-ghcr.test.sh` ditulis sebagai penjamin kontrak baru; test waris yang mengunci perilaku lama (rollback steps-back, bridge-size-guard, docs BridgePattern) diperbarui dengan alasan tercatat | ✅ |
| 6 | Verifikasi "main sudah superset" sebelum port (marketing prototype: attachment/SLA/link/delegasi + specs; lead-capture WA tracking; wa-gateway controller; MarketingThemeScope; relasi auth.prisma untuk schema penuh) | ✅ tidak ada yang di-port dua kali |

## Gerbang yang BELUM (syarat "SELESAI")

| # | Gerbang | Status |
|---|---|---|
| C1 | Push cabang + PR → CI `build-and-test` hijau di runner (boot backend 36 modul vs Postgres kosong via init-db.sh yang baru) | ⬜ perlu push (menunggu izin user — ada 148 commit `main` lokal belum ter-push) |
| C2 | Backup DB live terverifikasi + tag image `pre-consolidation` di VPS | ⬜ aksi VPS |
| C3 | Analisis drift skema (dry-run skema main vs DB live; harus murni aditif; cek enum) | ⬜ aksi VPS — JANGAN cutover tanpa ini |
| C4 | `docker login ghcr.io` di VPS + swap 2GB + secret CI `JWT_SECRET` | ⬜ aksi VPS/GitHub |
| C5 | Cutover (runbook DEPLOY.md) + health gate + smoke checklist live (login, management-task CRUD, lead-capture, toribio, omni-crm, webhook WA, **sidebar delegasi manajemen** — satu-satunya fix light yang TIDAK di-port (nav main beda total), verifikasi visual wajib) | ⬜ |
| C6 | Rollback di-tes sekali di VPS (sha lama → baru → lama) | ⬜ |
| C7 | Monitoring memori 24 jam (`docker stats`; backend < ~512MB) | ⬜ |
| C8 | Arsip branch (`production-light`, `phase-3`, `release/*`, `codex/*` → tag `archive/*`) setelah stabil | ⬜ |

## Catatan temuan
- `docs/QA_GATE.md` selama ini **dangling reference** (tidak pernah ada di
  branch mana pun) — navigasi kini menunjuk folder `docs/qa-gate/` + gate
  minimal tertulis di CLAUDE.md/DEPLOY.md.
- `.env` lokal user punya baris rusak (`NEW_WHATSAPP_ACCESS+TOKEN`) yang
  membuat `docker compose` gagal — sudah dilaporkan, belum diperbaiki (file
  privat user), dan memuat token WA yang sebaiknya dirotasi jika pernah
  terekspos.
- Nama compose project `production-light` sengaja DIPERTAHANKAN di VPS demi
  kontinuitas volume `postgres_data`; rename = prosedur terpisah.
- Frontend sebenarnya Next.js (bukan "Vite dashboard" seperti disebut
  dokumen lama) — CLAUDE.md dikoreksi.

## Putusan
Kode **siap di-review lewat PR** (C1). **DILARANG menyebut deploy baru
"selesai"** sampai C2–C8 tercentang dengan laporan cutover.
