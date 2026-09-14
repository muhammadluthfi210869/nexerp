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
| C1 | Push cabang + PR → CI `build-and-test` hijau di runner (boot backend 36 modul vs Postgres kosong via init-db.sh yang baru) | ✅ hijau di `5934b06` (8m35s) — ronde 3 `e73d10f` menyusul |
| C2 | Backup DB live terverifikasi + tag image `pre-consolidation` di VPS | ✅ `pg_dumpall` erp_database → gzip 2.3MB → **restore diverifikasi** (kontainer sementara: 0 error, 221=221 tabel, users 129=129 baris) → salinan laptop di `~/nexerp-backups/`; image backend+frontend di-tag `pre-consolidation` |
| C3 | Analisis drift skema (dry-run vs DB live; harus aditif / semua DROP diaudit baris-per-baris) | ✅ lihat Ronde 3 — 2 gerbang data diselamatkan, sisa DROP terbukti 0 baris, disetujui user |
| C4 | `docker login ghcr.io` di VPS + swap + secret CI `JWT_SECRET` | ✅ repo PUBLIC → pull GHCR anonim, tanpa login; swap 4GB sudah aktif (RAM 8GB, bukan 4); `JWT_SECRET` GitHub secret disinkron dari `.env` live |
| C5 | Cutover (runbook DEPLOY.md) + health gate + smoke checklist live (login, management-task CRUD, lead-capture, toribio, omni-crm, webhook WA, **sidebar delegasi manajemen** — satu-satunya fix light yang TIDAK di-port (nav main beda total), verifikasi visual wajib) | ⬜ |
| C6 | Rollback di-tes sekali di VPS (sha lama → baru → lama) | ⬜ |
| C7 | Monitoring memori 24 jam (`docker stats`; backend < ~512MB) | ⬜ |
| C8 | Arsip branch (`production-light`, `phase-3`, `release/*`, `codex/*` → tag `archive/*`) setelah stabil | ⬜ |

## Catatan temuan
- **Kontrak prefix API**: `main` menaruh semua route NestJS di bawah `/v1`
  (era light tanpa prefix). Semua alat operasi (compose healthcheck, CI boot
  poll, `test-deploy.sh`, `deploy.sh`/`rollback.sh` health gate, default
  `NEXT_PUBLIC_API_URL`) diselaraskan ke `/v1`, dan endpoint `/health` era
  light diport ke `AppController` → kini `/v1/health`. Commit `8f0469c`.
  ⚠️ Konsekuensi VPS: `.env` di server WAJIB diubah
  `NEXT_PUBLIC_API_URL=https://nexerp.id/api/v1` saat cutover (nginx sudah
  me-rewrite `/api/*` → `/*`, jadi publik = `/api/v1/...`).
- `npx jest` suite marketing/local OOM di laptop (worker crash, 0 test
  jalan) — gerbang jest TIDAK ada di CI; verifikasi backend lewat boot CI
  + `test-deploy.sh` + smoke live.

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

### Ronde 2 — CI run #1 FAIL → repro lokal → 4 latent defect diperbaiki (`aabdd8c`)
CI membuktikan dirinya berguna: run pertama gagal dan menemukan empat bug yang
TIDAK AKAN pernah terlihat sebelumnya karena skema full-ERP `main` tidak pernah
sekalipun di-`db push` + di-seed ke DB sungguhan:
1. **FK type mismatch** `ProductSupplierHistory.productId/supplierId` (text→uuid)
   — skema full gagal di-push bahkan ke DB kosong. Scan seluruh 19 file: satu-satunya.
2. **seed.ts TRUNCATE daftar basi** (`sample_revisions` sudah tidak ada) — diganti
   discovery `pg_tables` dinamis, tidak akan pernah basi lagi.
3. **CORS_ORIGIN tidak di-split koma** — health probe localhost tak pernah match.
4. **nginx rewrite `/api/* → /v1/*`** — kontrak browser bundle main; rewrite warisan
   light (`/api/x → /x`) membuat 100% endpoint 404 setelah cutover.
Verifikasi ulang lokal end-to-end: postgres docker → `prisma db push` → `db seed`
→ boot `dist/main` → `test-deploy.sh` **6/6 PASS** (termasuk login+profile ber-token
via `/v1`). `test-deploy.sh` juga dibuat jalan tanpa python3 (Git Bash).

⚠️ Implikasi cutover: `.env` VPS perlu `NEXT_PUBLIC_API_URL=https://nexerp.id/api/v1`
   (SSR/server-side); nginx.conf baru otomatis dipakai setelah `git checkout main`.

### Ronde 3 — Drift-analysis VPS menangkap 2 gap merge NYATA (`e73d10f`)
Eksekusi VPS Batch 1 langsung via SSH (key non-interaktif terverifikasi).
`prisma migrate diff` DB live vs skema konsolidasi menghasilkan **DROP atas data
produksi sungguhan** — gerbang C3 bekerja persis seperti didesain:

1. **`marketing_team_members` (35 baris live)** — model `MarketingTeamMember`
   dideklarasikan di light (`marketing.prisma:845`) tapi tidak ikut ke branch
   konsolidasi; frontend `useCanonicalMarketing` → `GET /marketing/members`
   hanya ada di backend light. Tanpa fix: halaman anggota 404 + tabel ter-DROP.
   Fix: port superset canonical light (controller/service/dto/auth-guard/spec —
   main tidak pernah menyentuh `canonical/` sejak fork, terbukti `git log` kosong)
   + model + relasi balik User di `auth.prisma`.
2. **Kolom journey atribusi `lead_captures` (8622 baris terisi di `sourcePage`)**
   — dibuat migration era main `20260822081953_lead_attribution_journey` tapi
   tidak pernah dideklarasikan di file skema (schema↔migration drift sejak Agustus).
   Fix: 10 field dideklarasikan persis tipe/default/nama-index migration.
   Catatan: `whatsappClickedAt`/`assignedSalesId`/`verificationStatus` terisi 0 —
   pipeline Batch-4 tidak pernah live; kolom tetap dipertahankan (dipakai codepath
   round-robin lama + murah dipertahankan).

Koreksi verifikasi lama: klaim "backend main superset light" salah untuk modul
**canonical** (verifikasi dulu hanya membandingkan modul prototype).

Audit sisa DROP (pasca-fix, ronde 2 diff): 33 tabel + 26 kolom + 14 enum —
semuanya **0 baris / 0 non-null** (audit otomatis per kolom via SQL) — artefak
eksperimen codex/r4 yang ditinggalkan sesi lain (ditemukan: DB live sudah berisi
push skema codex sejak 03:48 UTC, `nexerp-r4*`, shadow dbs). `SET NOT NULL`
satu-satunya terjadi di tabel kosong. User menyetujui penghapusan sisa ini.
Laporan lengkap: `/home/dreamlab/backups/drift-report-20260914.sql` (ronde 1)
dan `drift-report-round2-20260914.sql`.

Temuan VPS lain: ada **checkout kedua proyek `nexerp`+`nexerp-r4`** dari sesi
terbengkalai (compose `nexerp-db` masih jalan 5 hari, DB `erp_database` terpisah
— tidak disentuh, masuk Fase 5); `nginx` container healthcheck-nya sendiri cacat
(`wget --spider localhost/` ikut redirect ke https → unhealthy semu, site sehat).

## Putusan
Kode **siap di-review lewat PR** (C1). **DILARANG menyebut deploy baru
"selesai"** sampai C2–C8 tercentang dengan laporan cutover.
