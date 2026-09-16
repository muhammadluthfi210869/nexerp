# 🧪🚀 Panduan Lengkap Testing & Deploy NexERP

> **Status:** dokumen hidup (source of truth operasi) — ditulis 2026-09-14,
> tepat setelah cutover konsolidasi satu-branch. Diperbarui tiap kali kontrak
> deploy/testing berubah. **Revisi 2026-09-15:** optimasi deploy flow
> (target <15 min wall-clock, single-pass tanpa re-run) — lihat §11.
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
| **Deploy target wall-clock** | **<15 menit ideal <10 menit** — single CI run + VPS pull cached. Lihat §11. |

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
feature branch ─▶ lokal: run-all.sh + docker compose up + test-deploy.sh (Level 1+2)
     ─▶ PR ke main (PR-check CI NONAKTIF sejak 2026-09-15 — lihat §11)
     ─▶ merge main
     ─▶ CI push-images (1× run, ~6-8 min warm cache / ~10-12 min cold)
     ─▶ di VPS:
          cd /home/dreamlab/nexerp
          git pull --ff-only origin main
          bash scripts/deploy.sh <git-sha>
     ─▶ smoke live: bash scripts/test-deploy.sh https://nexerp.id/api  (6/6)
```

**Target wall-clock: <15 menit** (ideal <10 menit) dari `git push origin main`
sampai live smoke hijau. Cara mencapainya: lihat §11.

> ⚠️ **Perubahan 2026-09-15:** PR-check CI dinonaktifkan. Sebelumnya setiap
> deploy menjalankan 2× CI (PR-check + push-to-main) = ~30 min total. Sekarang
> 1× CI run = ~10 min. Risiko: bad merge tidak ke-catch otomatis. Mitigasi:
> pre-flight smoke di CI (lihat §11.2) + Level 2 lokal wajib sebelum merge.

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
| 2026-09-15 | 3 deploy attempt untuk 1 fitur (mgmt-task): init-db path salah + nginx /v1 doubled + seed dept filter. Total ~3 jam. Semua lolos CI lama karena CI tidak test login through nginx, tidak boot container di level 2, tidak verify seed output shape. | tambah pre-flight smoke di CI (§11.2) + lock-file contracts (§12). Single CI run (§11.3). Drop PR-check. Target <15 min. |

Laporan bukti lengkap per ronde:
[qa-gate/2026-09-14-consolidation-single-branch.md](qa-gate/2026-09-14-consolidation-single-branch.md).

---

## 9. PR / Klaim "Selesai" — Checklist Cepat

```text
[ ] Test reproduksi ditulis GAGAL dulu (kalau ini bug fix)
[ ] bash scripts/__tests__/run-all.sh                    → semua pass
[ ] lock-file contracts (§11.6)                          → semua hijau
[ ] docker compose up --build -d && test-deploy.sh lokal → 6/6 (Level 2)
[ ] PR ke main (tidak ada CI jalan; PR-check NONAKTIF)
[ ] merge ke main
[ ] CI push-images hijau (1× run, ~6-12 min) + pre-flight smoke (§11.2) lulus
[ ] git pull origin main di VPS
[ ] bash scripts/deploy.sh <sha> di VPS
[ ] test-deploy.sh https://nexerp.id/api                 → 6/6
[ ] smoke visual fitur yang disentuh (user)
[ ] laporan gate ditulis di docs/qa-gate/
[ ] Total wall-clock <15 menit (catat di qa-gate)
```
Satu kotak belum tercentang → jawabannya "BELUM SIAP KIRIM".

---

## 11. Deploy Cepat — Single-Pass Tanpa Re-Run (Revisi 2026-09-15)

**Target:** `git push origin main` → live smoke hijau **<15 menit**
(ideal <10 menit), tanpa deploy berulang.

### 11.1 Root cause deploy lambat sesi 2026-09-15 (audit)

Tiga deploy attempt untuk 1 fitur (mgmt-task). Setiap attempt:
2× CI run + 1× VPS deploy + beberapa kali fix round-trip. Total ~3 jam
dari PR pertama sampai live hijau. Tiga bug yang lolos CI lama:

| # | Bug | Kenapa lolos CI lama | Catch baru (lihat §11.2) |
|---|-----|---------------------|--------------------------|
| 1 | `init-db.sh` path `dist/src/main` salah | CI test tidak start container di level 2 | pre-flight: container boot + exec `node` di CI |
| 2 | `NEXT_PUBLIC_API_URL` double `/v1` (login 404) | CI tidak test login through nginx | pre-flight: login + `/marketing/members` via `http://localhost:3001` |
| 3 | `seed.department='DIGIMAR'` ditolak `listMembers` allow-list | CI tidak verify seed output shape | pre-flight: GET `/marketing/members` returns non-empty |

### 11.2 Pre-flight smoke di CI (WAJIB)

Tambah job **setelah** `push-images` di `.github/workflows/ci.yml`:

```yaml
pre-flight-smoke:
  needs: [build-and-test, push-images]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Boot local stack
      run: |
        docker compose up -d
        # wait for backend health (max 60s)
        for i in $(seq 1 30); do
          HEALTH=$(curl -sf http://localhost:3001/v1/health 2>/dev/null || echo "")
          [ -n "$HEALTH" ] && break
          sleep 2
        done
        [ -n "$HEALTH" ] || { echo "❌ backend never became healthy"; exit 1; }

    - name: End-to-end smoke (5 checks)
      run: |
        set -e
        BASE="http://localhost:3001/v1"
        # 1. Login as one of the 5 DIGIMAR users
        TOKEN=$(curl -sX POST "$BASE/auth/login" \
          -H "Content-Type: application/json" \
          -d '{"email":"revita@nexerp.id","password":"password123"}' \
          | jq -r .accessToken)
        [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] \
          || { echo "❌ LOGIN FAILED"; exit 1; }
        # 2. Verify /marketing/members non-empty (catches dept filter bug)
        COUNT=$(curl -sX GET "$BASE/marketing/members" \
          -H "Authorization: Bearer $TOKEN" | jq 'length')
        [ "$COUNT" -gt 0 ] || { echo "❌ /marketing/members EMPTY ($COUNT)"; exit 1; }
        echo "✅ /marketing/members returned $COUNT members"
        # 3. Verify createTask dual-write (catches single-column write bug)
        CREATE=$(curl -sX POST "$BASE/marketing/tasks" \
          -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
          -d '{"title":"CI smoke","assigneeId":"00000000-0000-0000-0000-000000000000","type":"DAILY","priority":"LOW","channel":"web","category":"smoke","startDate":"2026-09-15","dueDate":"2026-09-16"}')
        echo "$CREATE" | jq -e '.status' >/dev/null \
          || { echo "❌ createTask no .status"; echo "$CREATE"; exit 1; }
        # 4. Verify /marketing/prototype/* returns 404 (catches dual-backend bug)
        PROTO=$(curl -s -o /dev/null -w "%{http_code}" \
          -H "Authorization: Bearer $TOKEN" "$BASE/marketing/prototype/bundle")
        [ "$PROTO" = "404" ] || { echo "❌ /marketing/prototype/* still live ($PROTO)"; exit 1; }
        # 5. Frontend bundle has correct NEXT_PUBLIC_API_URL (no trailing /v1)
        FRONT_API=$(docker exec production-light-frontend-1 printenv NEXT_PUBLIC_API_URL 2>/dev/null || echo "")
        case "$FRONT_API" in
          */v1) { echo "❌ NEXT_PUBLIC_API_URL ends with /v1 — will double-prefix"; exit 1; } ;;
          *) echo "✅ NEXT_PUBLIC_API_URL='$FRONT_API' (no trailing /v1)" ;;
        esac
        echo "✅ All pre-flight smoke checks passed"

    - name: Cleanup
      if: always()
      run: docker compose down -v || true
```

**Cost:** ~2-3 menit per CI run (build images sudah di step sebelumnya).
**Value:** catch semua 3 bug sesi 2026-09-15 sebelum VPS round-trip.

### 11.3 Single CI run (drop PR-check)

Edit `.github/workflows/ci.yml`:

```yaml
# SEBELUM (2× CI run per deploy):
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# SESUDAH (1× CI run per deploy):
on:
  push:
    branches: [main]
```

**Cost:** -10 menit per deploy (skip PR build). **Risk:** bad merge masuk main
sebelum CI run. **Mitigasi:** Level 2 lokal WAJIB sebelum merge (lihat §1).

### 11.4 VPS image warm-cache (skip pull)

Pastikan `scripts/deploy.sh` skip pull kalau image sudah ada lokal:

```bash
# Di scripts/deploy.sh, SEBELUM docker compose pull:
for img in backend frontend; do
  if docker image inspect "ghcr.io/muhammadluthfi210869/nexerp/${img}:${sha}" \
       >/dev/null 2>&1; then
    echo "✅ Image ${img}:${sha} sudah cached, skip pull"
  else
    docker compose -p production-light pull "${img}"
  fi
done
```

**Cost:** -1-2 menit per deploy (VPS pull dilewati kalau layer cached).

### 11.5 Cache optimization (jika masih lambat)

Verify `cache-from` di workflow menggunakan GHA scope per-service:

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: |
      type=gha,scope=backend-main
      type=gha
    cache-to: type=gha,mode=max,scope=backend-main
    provenance: false   # skip SBOM (hemat ~30 detik)
```

Cara verify cache hit: lihat di GHCR Actions run log apakah muncul
`"--cache-from type=gha,scope=backend-main"` dan apakah layer cache di-restore.

### 11.6 Self-check sebelum merge (1 menit untuk avoid 30 menit)

Sebelum klik "Merge" di GitHub, **WAJIB** jalankan ini di lokal:

```bash
# 1. Shell regression suite (10 detik)
bash scripts/__tests__/run-all.sh

# 2. Lock-file contracts (5 detik) — catch regressions dari §11.1
grep -q "exec node dist/main" backend/init-db.sh   # path benar
! grep -q "department: 'DIGIMAR'" backend/prisma/seed.ts   # match allow-list
! grep -q "NEXT_PUBLIC_API_URL.*api/v1" .github/workflows/ci.yml  # no trailing /v1
! ls backend/src/modules/marketing/prototype 2>/dev/null  # prototype gone
echo "✅ Kontrak lock-file OK"

# 3. Build lokal (30-60 detik)
cd backend && npm run build && cd ../frontend && npm run build

# 4. (Opsional) docker compose up --build + test-deploy.sh lokal
docker compose up --build -d
until curl -fsS http://localhost:3001/v1/health; do sleep 2; done
bash scripts/test-deploy.sh http://localhost:3001/v1
docker compose down -v
```

Kalau salah satu gagal → **JANGAN merge**. Fix dulu.

### 11.7 Target wall-clock per fase (realistic)

| Phase | Durasi target | Catatan |
|-------|---------------|---------|
| Lokal: run-all + build + lock-file | 1-2 menit | Sebelum push |
| Push branch + create PR | 30 detik | Tidak ada CI jalan |
| (Skip PR-check) | 0 | Tidak ada CI run di fase ini |
| Merge + push-to-main CI | 6-12 menit | Warm cache = 6, cold = 12 |
| VPS: deploy.sh + image warm | 1-2 menit | Kalau image cached |
| VPS: live smoke | 30 detik | test-deploy.sh 6/6 |
| **Total wall-clock** | **8-15 menit** | Warm = 8, cold = 15 |

### 11.8 Kalau deploy gagal → diagnosa dulu, jangan rollback panik

Sesuai §8 ronde 4 lesson: "test yang gagal = diagnosis dulu, jangan panik
rollback". Checklist:

1. Cek `docker compose -p production-light logs --tail 100 backend` →
   exit code init-db.sh?
2. Cek `bash scripts/test-deploy.sh https://nexerp.id/api` di VPS → 6/6?
3. Cek `gh run view <sha>` → CI apakah passed di artifact?
4. Kalau CI passed tapi VPS gagal → cek `.env` VPS (NEXT_PUBLIC_* dsb).
5. Kalau VPS gagal tapi sebelumnya jalan → cek `init-db.sh` drift marker
   `backend/data/.schema-drift-acknowledged`.

**Rollback hanya kalau:** code baru pasti masalah (regresi jelas) ATAU
data rusak. Jangan rollback karena smoke 5/6 — bisa jadi probe rusak.

---

## 12. Kontrak Yang Wajib Dilock (regression guard untuk §11.1 bugs)

Tambah file `scripts/__tests__/contracts-mgmt-task.test.sh` (atau extend
`consolidation.test.sh` §4b):

```bash
#!/bin/bash
# Lock kontrak yang laten di-sesi 2026-09-15
set -uo pipefail
cd "$(dirname "$0")/../.."
PASS=0; FAIL=0
ok() { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# Lock 1: init-db.sh exec path benar (bug §11.1 #1)
grep -qE 'exec node dist/main' backend/init-db.sh \
  && ok "init-db.sh exec node dist/main (Nest convention)" \
  || bad "init-db.sh exec path drifted from dist/main"

# Lock 2: department seed value match allow-list (bug §11.1 #3)
if grep -qE "department:.*'(DIGIMAR|CREATIVE|MARKETING|HR|FINANCE)'" \
     backend/prisma/seed.ts backend/prisma/seeders/*.ts 2>/dev/null; then
  bad "seed writes non-allow-list department value (will be filtered out)"
else
  ok "seed department values stay within canonical-marketing listMembers allow-list"
fi

# Lock 3: NEXT_PUBLIC_API_URL no trailing /v1 (bug §11.1 #2)
if grep -qE 'NEXT_PUBLIC_API_URL.*\.id/api/v1' .github/workflows/ci.yml; then
  bad "CI build-arg default has trailing /v1 — will double-prefix"
else
  ok "CI build-arg NEXT_PUBLIC_API_URL has no trailing /v1"
fi

# Lock 4: prototype module gone
[ ! -d backend/src/modules/marketing/prototype ] \
  && ok "prototype module deleted (canonical-only writes)" \
  || bad "prototype module STILL EXISTS — parallel backend will race"

# Lock 5: nginx rewrite contract preserved
grep -qE "rewrite \^/api/\(\.\*\) /v1/\\\$1" nginx.conf \
  && ok "nginx rewrite /api/(.*) → /v1/(.*) preserved" \
  || bad "nginx rewrite contract drifted"

echo ""
echo "  contracts: $PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
```

Tambah ke `scripts/__tests__/run-all.sh` sebagai suite ke-10.

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
