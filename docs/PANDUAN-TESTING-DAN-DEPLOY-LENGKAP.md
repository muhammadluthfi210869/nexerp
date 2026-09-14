# 🧪🚀 Panduan Lengkap Testing & Deploy NexERP

> **Status:** dokumen hidup (source of truth operasi) — ditulis 2026-09-14,
> tepat setelah cutover konsolidasi satu-branch. Diperbarui tiap kali kontrak
> deploy/testing berubah.
>
> Prinsip induk: **yang kamu test dan yang jalan di server harus benda yang
> sama** — image yang sama, compose yang sama, skrip test yang sama.

---

## 0. Kondisi Saat Ini (per 2026-09-14, pasca-cutover)

| Aspek | Nilai terverifikasi |
|---|---|
| Branch production | `main` SATU-SATUNYA (36 modul full-ERP). `production-light` diarsipkan |
| Domain live | `https://nexerp.id` saja — tanpa subdomain/environment kedua |
| SHA live | hasil merge konsolidasi (image GHCR per-SHA; `:latest` mengikuti tip main) |
| Pipeline | CI GitHub Actions build → push `ghcr.io/muhammadluthfi210869/nexerp/{backend,frontend}:{sha}` + `:latest` |
| Repo | PUBLIC → **VPS pull GHCR anonim, tanpa `docker login`** |
| VPS | Biznet `103.93.134.215`, user `dreamlab` (di grup docker, **tanpa sudo**), RAM **8GB** + swap 4GB aktif, disk ±81% terpakai → masuk agenda bersih-bersih |
| Direktori proyek | `/home/dreamlab/nexerp`; compose project `production-light` (nama dipertahankan demi volume `postgres_data` — JANGAN diganti kecuali lewat prosedur rebind) |
| API | prefix NestJS `/v1`; nginx `rewrite ^/api/(.*) /v1/$1` → publik `https://nexerp.id/api/v1/...`, internal `http://127.0.0.1:3001/v1/...` |
| DB | Postgres 15, container `${COMPOSE}-db-1`, db `erp_database` / user `erp_user`, 221 tabel; skema diterapkan via `prisma db push` (BUKAN migrate) |
| Data produksi | 129 user, 8622 lead, 35 anggota tim marketing, lampiran tugas di bind-mount `backend/uploads` |
| Tetangga VPS | proyek `dreamlab-lead` (JANGAN disentuh) + proyek terbengkalai `nexerp`/`nexerp-r4` (calon Fase 5) |
| Smoke otomatis | `test-deploy.sh` lawan production: 6/6 sejak probe CORS diperbaiki (PR #4) |

Dokumen pendukung: [ARCHITECTURE.md](../ARCHITECTURE.md) (topologi),
[DEPLOY.md](../DEPLOY.md) (SOP harian ringkas), [RUNBOOK.md](../RUNBOOK.md)
(incident), [qa-gate/](qa-gate/) (bukti tiap rilis).

---

## 1. Piramida Testing — "localhost bisa = server bisa"

Masalah klasik "di laptop jalan, di server mati" muncul karena dua hal berbeda
diuji. Urutan di bawah menutup itu: makin ke bawah makin cepat & lokal, makin
ke atas makin mewakili production. **Jangan klaim "sudah bener" tanpa lulus
sampai level 3.**

### Level 0 — `npm run dev` (BUKAN jaminan)
Untuk kerja UI harian saja. Tidak mewakili server: tanpa nginx, tanpa compose,
tanpa `NEXT_PUBLIC_*` dibake saat build, hot-reload menyembunyikan error tipe.

### Level 1 — Suite regresi shell (detik, offline)
```bash
bash scripts/__tests__/run-all.sh
```
9 suite pengunci kontrak (semua ikut jalan di CI):

| Suite | Mengunci |
|---|---|
| `consolidation.test.sh` | kontrak konsolidasi 1-branch + skema (model/field yang live di DB wajib terdeklorasi) + route canonical marketing |
| `ci-ghcr.test.sh` | workflow CI: build+push image per-SHA, secret/vars yang dibutuhkan |
| `init-db-idempotency.test.sh` | `init-db.sh` aman dijalankan berulang, blokir DROP |
| `rollback.test.sh` / `db-snapshot.test.sh` / `verify-deploy-filename.test.sh` | mekanik rollback & snapshot |
| `docs-link-integrity.test.sh` | semua link antar-dokumentasi hidup |
| `tmp-cleanup.test.sh` | tidak ada sampah yang ikut nempel |

**Aturan regresi wajib (CLAUDE.md):** setiap bug → tulis test yang **GAGAL
dulu** → baru fix → suite hijau. Contoh sukses: gap `MarketingTeamMember` &
kolom journey `lead_captures` (ronde 3 cutover) dikunci di `consolidation.test.sh` §4b.

### Level 2 — Stack lokal = stack server (menit)
```bash
docker compose up --build -d
bash scripts/test-deploy.sh http://localhost:3001/v1     # target: 6/6
```
Compose yang sama, Dockerfile yang sama, `init-db.sh` (db push + seed) yang
sama. Inilah test yang mewakili server tanpa menyentuh server.

⚠️ **`.env` lokal rusak diketahui:** baris `NEW_WHATSAPP_ACCESS+TOKEN` (tanda
`+`) membuat compose gagal — perbaiki jadi `NEW_WHATSAPP_ACCESS_TOKEN`.

### Level 3 — CI `build-and-test` (gerbang merge, ±8 menit)
Setiap PR ke `main` dijalankan di runner bersih: docker build ×2 → Postgres
segar → `db push` + seed → boot backend → `run-all.sh` + `test-deploy.sh`.
**Kode yang sampai ke VPS pasti sudah lulus level ini** — bukti: CI ronde 2
menangkap 4 defect laten (FK uuid vs text, seed TRUNCATE tabel basi,
CORS_ORIGIN tak di-split koma, nginx rewrite salah kontrak) yang mustahil
kelihatan di laptop manapun.

### Level 4 — Smoke live pasca-deploy (detik, di VPS)
```bash
bash scripts/test-deploy.sh https://nexerp.id/api        # target: 6/6
bash scripts/verify-deploy.sh                            # health gate + cek tambahan
```
Enam hal yang diuji `test-deploy.sh`: health, CORS (probe mengikuti target —
origin `localhost` tak lagi dikirim ke production), login, endpoint
terproteksi, guard 401 tanpa token, API root. Login memakai
`admin@dreamlab.com` — satu-satunya akun yang ada di SEMUA seed era.

### Level 5 — Analisis drift skema (sebelum menyentuh DB live)
DB live dikelola `db push`, jadi **diff-kan dulu** skema baru vs DB live:

```bash
# di VPS, offline (nol tulis):
mkdir -p /tmp/drift-cfg && cat > /tmp/drift-cfg/prisma.config.ts <<'EOF'
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "/schema",                                  // folder backend/prisma/schema (mount)
  datasource: { url: process.env.DATABASE_URL },
});
EOF
docker run --rm -v <repo>/backend/prisma/schema:/schema -v /tmp/drift-cfg:/cfg \
  -e DATABASE_URL="<dari docker inspect production-light-backend-1>" \
  node:22-alpine sh -lc 'npx --yes prisma@6 migrate diff \
    --from-config-datasource --to-schema /schema --script > /out/drift.sql'
# PRISMA 7: flag --from-url DIHAPUS; --to-schema-datamodel → --to-schema
```
Aturan: hasil harus **murni aditif**. Kalau muncul `DROP` apa pun → STOP,
audit baris-per-baris (`SELECT count(*)` kolom/ tabel target), laporkan,
baru minta persetujuan. (Persis prosedur yang menyelamatkan tabel 35 anggota
tim & 8 kolom journey saat cutover.)

---

## 2. Alur Deploy Standar (setiap kali, tanpa pengecualian)

```
feature branch ─▶ PR ─▶ CI build-and-test hijau ─▶ merge main
     ─▶ CI push-images (±2 mnt): image :sha + :latest naik ke GHCR
     ─▶ di VPS:
          cd /home/dreamlab/nexerp
          git pull --ff-only origin main
          bash scripts/deploy.sh <git-sha>
     ─▶ smoke live: bash scripts/test-deploy.sh https://nexerp.id/api  (6/6)
```

Yang dilakukan `scripts/deploy.sh <sha>`:
1. Cek `.env` ada.
2. **Backup DB otomatis** (`pg_dumpall` → `backups/pre-deploy-*.sql.gz`).
3. `IMAGE_TAG=<sha> docker compose -p production-light --profile server pull` (tanpa build).
4. `up -d` — switch container ±3–10 detik.
5. Health gate `http://127.0.0.1:3001/v1/health` (retry ±60s) → `verify-deploy.sh`.

**Kenapa per-SHA, bukan `:latest`:** tag SHA abadi di GHCR → rollback/target
audit selalu bisa menunjuk commit spesifik. Kalau CI push-images gagal, deploy
SHA itu memang belum ada — deploy = tanda tangan bahwa image-nya eksis.

### Kontrak environment yang wajib dihormati
- `NEXT_PUBLIC_*` dibake **saat build image di CI** (build-args:
  `NEXT_PUBLIC_API_URL=https://nexerp.id/api/v1`, `NEXT_PUBLIC_WA_PHONE`,
  `JWT_SECRET`). Mengubahnya di `.env` VPS **tidak** mengubah bundle browser.
  Nilai `.env` server hanya untuk runtime SSR.
- `JWT_SECRET` harus **sama** antara GitHub secret (build frontend) dan `.env`
  VPS (runtime backend) — ketidakcocokan = token tidak valid (penyebab 2×
  deploy gagal di era lama).
- `CORS_ORIGIN` daftar pemisah koma (sudah di-split di `main.ts` sejak ronde 2).
- Root `.env` VPS tidak punya `DATABASE_URL` — compose yang merakitnya; saat
  butuh di luar container, baca dari `docker inspect production-light-backend-1`.

---

## 3. Rollback

```bash
bash scripts/rollback.sh              # daftar 15 tag backend ter-cache lokal
bash scripts/rollback.sh <sha-lama>   # image lokal = skip pull → ±3 detik
```
Fakta drill 2026-09-14: **3,1 detik** end-to-end dengan cache, health gate lolos.

**Kapan rollback tidak cukup:** kalau kerusakan ada di **skema/data** (bukan
kode) — restore snapshot:
```bash
ls -lht backups/snapshot-*.sql.gz backups/pre-deploy-*.sql.gz | head
gunzip -c <file>.sql.gz | docker exec -i production-light-db-1 psql -U erp_user -d erp_database
docker compose -p production-light restart backend
```
Skema konsolidasi sekarang superset skema lama → rollback kode antar-SHA
pipeline baru selalu aman secara skema. Rollback lintas-era (image light lama)
TIDAK berlaku lagi.

---

## 4. Backup & DR

- Otomatis sebelum tiap deploy (`deploy.sh` langkah 2) + manual kapan pun:
  `bash scripts/db-snapshot.sh` → `backups/snapshot-YYYYMMDD-HHMMSS.sql.gz`.
- **Protokol verifikasi backup** (wajib sebelum operasi skema besar — dipakai
  di Cutover C2): `gzip -t` → restore ke container `postgres:15-alpine`
  sementara → bandingkan **jumlah tabel DAN row count tabel kunci** dengan live
  → baru dianggap "backup sehat". Backup cutover:
  `/home/dreamlab/backups/` + salinan laptop `~/nexerp-backups/`.
- Lampiran tugas = **bind-mount host** `backend/uploads` → TIDAK ikut image
  maupun pg_dump; masuk agenda `scripts/dr-drill.sh`.
- Rekon: `scripts/daily-reconcile.sh` / `run-reconciliation.js` (rekonsiliasi
  data bisnis, bukan DR infra).

---

## 5. Skema Database (era `db push`)

- Diterapkan otomatis saat container backend boot → `backend/init-db.sh`:
  coba `db push` **tanpa** `--accept-data-loss`; bila terblokir, dry-run
  diverifikasi aditif dulu; DROP → blokir keras + drift marker + log merah.
- Marker: `backend/data/.schema-drift-acknowledged` (+ `.plan`). Baca isinya
  dulu, setujui sadar, baru hapus — **marker basi membuat push dilewati
  diam-diam** (terjadi saat cutover: marker sesi lama tertinggal, dihapus).
- Index yang menegangkan constraint UNIQUE (`*_key`) bisa membuat
  `--accept-data-loss` gagal — drop constraint manual
  (`ALTER TABLE ... DROP CONSTRAINT ...`) setelah terbukti tabelnya kosong.

---

## 6. Monitoring & Batas Aman

| Metrik | Budget | Baseline 2026-09-14 |
|---|---|---|
| RAM backend | < ~512MB | 235MB |
| RAM frontend | — | 72MB |
| RAM db | — | 91MB |
| Disk VPS | < 85% | 81% → prune jadwalkan |

```bash
docker stats --no-stream          # snapshot
docker compose -p production-light ps
```
Cek ulang +24 jam dari cutover (gerbang C7). nginx container punya healthcheck
semu-cacat (`--spider localhost/` ikut redirect https → unhealthy padahal
situs sehat) — pakai `curl -sI https://nexerp.id/` sebagai kebenaran, jangan
percayai ikon unhealthy itu buta-buta.

---

## 7. Keamanan & Secret

- `JWT_SECRET` **perlu dirotasi** (nilainya sempat tampil di log sesi
  konsolidasi): generate `openssl rand -hex 32` → `gh secret set JWT_SECRET`
  → update `.env` VPS → `docker compose -p production-light restart backend`
  → token lama invalid (user login ulang — expected).
- Token WhatsApp era lama (`.env` lokal pernah berisi nilai mentah) — rotasi
  bila pernah terekspos.
- GHCR pull anonim OK karena repo public; JANGAN pernah menaruh secret di
  image/frontend bundle.

---

## 8. Histori Keputusan & Insiden (yang membentuk aturan di atas)

| Tanggal | Kejadian | Aturan yang lahir |
|---|---|---|
| 2026-07-23 | `production-light` difork, 229 commit bercabang | — (akar masalah) |
| 2026-09-14 ronde 1 | merge wholesale `e75fbe1` nyaris happen | path-scoped checkout, bukan wholesale |
| Ronde 2 | CI run #1 FAIL → 4 defect laten diperbaiki (`aabdd8c`) | CI = level 3 wajib; jangan klaim dari `npm run dev` |
| Ronde 3 | drift-analysis menangkap 2 gap NYATA (tabel 35 baris + 8 kolom) | gerbang C3: diff skema sebelum cutover, DROP → STOP |
| Ronde 3 | 47 lampiran terhapus oleh sesi lain (bind-mount tak ter-track penuh) | uploads perlu DR drill dedicated |
| Ronde 4 | smoke live 5/6 — ternyata bug PROBE CORS, bukan server; fixed PR #4 | test yang gagal = diagnosis dulu, jangan panik rollback |
| 14:25–14:33 UTC | **CUTOVER** full-ERP ke nexerp.id sukses, data 100% utuh | deploy harian = §2 |

Laporan bukti lengkap per ronde:
[qa-gate/2026-09-14-consolidation-single-branch.md](qa-gate/2026-09-14-consolidation-single-branch.md).

---

## 9. PR / Klaim "Selesai" — Checklist Cepat

```text
[ ] Test reproduksi ditulis GAGAL dulu (kalau ini bug fix)
[ ] bash scripts/__tests__/run-all.sh                    → semua pass
[ ] docker compose up --build -d && test-deploy.sh lokal → 6/6
[ ] PR → CI build-and-test hijau
[ ] merge → push-images hijau → deploy.sh <sha> di VPS
[ ] test-deploy.sh https://nexerp.id/api                 → 6/6
[ ] smoke visual fitur yang disentuh (user)
[ ] laporan gate ditulis di docs/qa-gate/
```
Satu kotak belum tercentang → jawabannya "BELUM SIAP KIRIM".

---

## 10. Yang Masih Terbuka (agenda)

- **C5** smoke visual manual user di nexerp.id (management-task CRUD,
  delegasi, anggota tim, lead-capture, toribio, omni-crm).
- **C7** recheck memori +24 jam (mulai 14:33 UTC 2026-09-14).
- **Fase 5** (setelah 24–48 jam stabil): tag arsip branch
  (`production-light`, `phase-3`, `release/*`, `codex/*`); VPS: matikan proyek
  terbengkalai `nexerp`/`nexerp-r4` + shadow DB + prune image (disk 81%);
  bersihkan sampah untracked root repo → `_archive/`; hapus worktree
  `/tmp/consolidation`; rotasi JWT_SECRET (§7); opsional rename compose
  project via prosedur rebind volume.
