# PHASE 0 — Evidence Freeze Runbook

> **Source of truth (REALIGN 2026-09-10):**
> - Strategi eksekusi: [`docs/plan/ERP_FINALIZATION_MASTER_PLAN.md`](../../plan/ERP_FINALIZATION_MASTER_PLAN.md) Fase 1 (Backend Foundation), Fase 5 (Hardening)
> - Quality gates: [`docs/plan/ZERO_ERROR_ROADMAP.md`](../../plan/ZERO_ERROR_ROADMAP.md) Phase 5 (Verification & Regression Prevention)
> - Architecture baseline: [`docs/plan/FULLSTACK_INTEGRITY_PLAN.md`](../../plan/FULLSTACK_INTEGRITY_PLAN.md) + [`docs/plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md`](../../plan/SYSTEMS_INTEGRITY_ZERO_ERROR_PROTOCOL.md) (7 Layers Integrity)
> - Validation plan: [`docs/plan/V4_SYSTEM_VALIDATION_PLAN.md`](../../plan/V4_SYSTEM_VALIDATION_PLAN.md) + [`docs/plan/ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md`](../../plan/ENTERPRISE_GOLDEN_THREAD_TEST_PLAN.md)
> - Audit snapshot: `docs/_AUDIT_BACKEND_2026-09-09.md`, `docs/_AUDIT_FULL_PLAN_2026-09-09.md`
> **Target deployment:** VPS `nexerp.id` (Biznet NEO Lite, IP `103.93.134.215` per `docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md`)
> **Project root:** `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO`
> **Shell:** Windows PowerShell 5.1+ (bukan bash, bukan CMD).
> **Audience:** satu engineer + reviewer.
> **Catatan realign:** Sebelumnya runbook ini mereferensikan `00_MASTER_PLAN.md` di folder ini — file tersebut TIDAK ADA. Referensi diganti ke `docs/plan/` yang real (lihat Source of Truth di atas).

---

## 0. Pendahuluan Singkat

### 0.1 Apa ini
**Evidence Freeze** adalah fase 2–4 hari kerja yang tujuannya **mengunci keadaan nyata** dari empat hal sebelum kita rapikan apa pun:

1. **Source code** — branch, commit, dirty files, image yang sedang jalan.
2. **Database** — migration state, backup, restore.
3. **Environment** — env vars aktif, deployment config, Nginx.
4. **Active work** — semua perubahan aktif di working tree diklasifikasikan, **bukan dihapus**.

Setelah freeze, kita punya baseline numerik (build errors, test pass/fail, bundle size) yang dipakai sebagai comparison point untuk `ERP_FINALIZATION_MASTER_PLAN.md` Fase 1 dan NO-GO gate di `ZERO_ERROR_ROADMAP.md` Phase 5.

### 0.2 Mengapa penting
Per `ERP_FINALIZATION_MASTER_PLAN.md` Fase 1 (Backend Foundation) dan `ZERO_ERROR_ROADMAP.md` Phase 5 (Verification & Regression Prevention), NO-GO otomatis terjadi bila:
- image/commit/migration release tidak dapat ditelusuri;
- backup belum berhasil direstore;
- schema drift atau migration state tidak diketahui.

Audit sebelumnya (`docs/_AUDIT_BACKEND_2026-09-09.md`, `docs/_AUDIT_FULL_PLAN_2026-09-09.md`) menemukan:
- internal healthcheck path salah (`/system/health` vs prefix `/v1`);
- migration applied perlu diverifikasi ulang;
- deployment non-immutable (build di VPS).
- 199 backend TypeScript errors (Finance 172 + Creative 13 + Lead Capture 7 + Digimar 6 + WA Webhook 1).
- Backend unit suite tidak selesai karena Node heap OOM ~4GB.
- Frontend Vitest 222 pass / 84 fail / 1 skip.

Phase 0 adalah **pre-flight** untuk Phase 1 Backend Foundation + Phase 4 Code Quality Cleanup (`ZERO_ERROR_ROADMAP.md`). Tanpa Phase 0, kita tidak tahu apa yang sebenarnya kita recover.

### 0.3 Prinsip mengikat
- **NO destructive action** — tidak ada `git reset --hard`, `git clean -fd`, `rm -rf`, `prisma migrate reset`, `db push`, `DROP TABLE`.
- **NO automatic delete** — perubahan aktif di working tree **diklasifikasikan dulu**, pemilik yang memutuskan.
- **NO `db push`** di production — hanya `prisma migrate deploy`.
- **NO backup overwrite** — backup baru disimpan di folder berbeda dengan timestamp.
- **NO secret leakage** — env values tidak boleh ditulis ke evidence file; hanya nama variable + status (set/kosong).
- **NO assumption without evidence** — kalau output tidak sesuai expected, berhenti dan investigasi.

---

## 1. Pre-Flight Checklist (kondisi awal yang user pastikan dulu)

Centang semua sebelum mulai.

### 1.1 Working tree
```powershell
git status --short
```
> **Expected:** output minimal. Boleh ada untracked, tapi idealnya kosong. **Dirty file ≠ masalah**, dirty file tanpa klasifikasi = masalah.

### 1.2 PowerShell sebagai user yang punya akses
```powershell
whoami
Get-Location
Test-Path "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\backend"
Test-Path "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend"
```
> **Expected:** user ≠ `SYSTEM`. `Get-Location` = project root. Kedua path = `True`.

### 1.3 Tooling tersedia
```powershell
node --version
npm --version
git --version
docker --version
psql --version  # optional, hanya kalau ada lokal
```
> **Expected:** `node >= 20`, `npm >= 10`, `git >= 2.40`, `docker >= 24`. Kalau `psql` tidak ada lokal, langkah DB nanti lewat `docker exec`.

### 1.4 File `.env` valid
```powershell
Test-Path "backend\.env"
Test-Path "frontend\.env.local"
(Get-Content "backend\.env" -Raw).Length
```
> **Expected:** keduanya `True`, size > 100 bytes. **JANGAN** `Get-Content` ke terminal untuk baca nilai — lihat `Lampiran A` untuk env var yang aman di-export.

### 1.5 Folder evidence siap
```powershell
$TODAY = Get-Date -Format "yyyy-MM-dd"
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$TODAY"
New-Item -ItemType Directory -Path $EVID -Force | Out-Null
Write-Host "Evidence dir: $EVID"
```
> **Expected:** tercetak path evidence dir hari ini.

### 1.6 Disk space cukup
```powershell
Get-PSDrive C | Select-Object Used, Free
```
> **Expected:** `Free` minimal **3 GB** untuk backup + restore + bundle. Kalau kurang, hentikan dan bebaskan space dulu.

---

## 2. STEP 1 — Capture Release Identity

**Tujuan:** identifikasi tepat apa yang sedang running di production dan di local sampai level commit/image/migration.

### 2.1 Branch + commit SHA + dirty files

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path "$EVID\01-git" -Force | Out-Null

git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" rev-parse --abbrev-ref HEAD | Out-File "$EVID\01-git\branch.txt" -Encoding utf8
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" rev-parse HEAD          | Out-File "$EVID\01-git\commit-sha.txt" -Encoding utf8
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" log -1 --pretty=format:"%H%n%an%n%ae%n%ad%n%s" --date=iso | Out-File "$EVID\01-git\commit-meta.txt" -Encoding utf8
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" status --short         | Out-File "$EVID\01-git\dirty-files.txt" -Encoding utf8
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" status --porcelain     | Out-File "$EVID\01-git\dirty-porcelain.txt" -Encoding utf8
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" remote -v               | Out-File "$EVID\01-git\remote.txt" -Encoding utf8

Write-Host "Branch:    $(Get-Content $EVID\01-git\branch.txt)"
Write-Host "Commit:    $(Get-Content $EVID\01-git\commit-sha.txt)"
Write-Host "Dirty:     $((Get-Content $EVID\01-git\dirty-files.txt | Measure-Object -Line).Lines) lines"
```
> **Expected:**
> - `branch.txt` berisi satu nama branch (mis. `main`).
> - `commit-sha.txt` berisi 40-char hex.
> - `dirty-files.txt` boleh kosong.
> - `remote.txt` berisi URL origin.
>
> **STOP kalau:** branch kosong, SHA kosong, atau `dirty-files.txt` > 200 baris (indikasi besar belum ter-commit).

### 2.2 Backend & frontend image digests (Docker, **jika applicable**)

> **Skip langkah ini** kalau deploy belum pakai Docker image (mis. masih pakai `tar` SCP). Catat "N/A — deploy via tarball" di `SUMMARY.md`.

```powershell
docker images --digests --format "table {{.Repository}}\t{{.Tag}}\t{{.Digest}}\t{{.CreatedSince}}" `
  | Out-File "$EVID\02-images\docker-images.txt" -Encoding utf8

docker images --filter "reference=*nexerp*" --filter "reference=*erp*" --digests `
  --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.Digest}}" `
  | Out-File "$EVID\02-images\nexerp-images.txt" -Encoding utf8

# Cek container yang sedang jalan untuk lihat image ID aktif
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" `
  | Out-File "$EVID\02-images\docker-ps.txt" -Encoding utf8
```
> **Expected:**
> - `docker-images.txt` berisi tabel image lokal + digest (`@sha256:...`).
> - `nexerp-images.txt` berisi image backend & frontend (kalau ada).
> - `docker-ps.txt` menunjukkan container aktif.
>
> **STOP kalau:** file kosong total padahal production pakai Docker → cek `docker context`, mungkin pakai Docker daemon remote.

### 2.3 Prisma migration state

```powershell
Set-Location "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\backend"

npm exec -- prisma migrate status 2>&1 | Tee-Object "$EVID\..\06-migrations\prisma-migrate-status.txt"

# Hash setiap migration.sql untuk audit integrity
Get-ChildItem -Path "prisma\migrations" -Recurse -Filter "migration.sql" `
  | ForEach-Object {
      $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
      "$($_.FullName.Substring($_.FullName.IndexOf('migrations')))|sha256:$hash"
    } | Out-File "$EVID\..\06-migrations\migration-file-checksums.txt" -Encoding utf8

Set-Location "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO"
```
> **Expected:**
> - `prisma-migrate-status.txt` berakhir dengan baris berisi `Database schema is up to date` atau daftar pending.
> - `migration-file-checksums.txt` berisi path + sha256 untuk setiap `migration.sql`.
>
> **STOP kalau:** `prisma migrate status` error koneksi DB → cek `.env` `DATABASE_URL` atau skip kalau DB lokal belum up.

### 2.4 Production deployment timestamp + Nginx config snippet

Login VPS via SSH (pakai Windows Terminal atau `ssh.exe` dari PowerShell):

```powershell
# Adaptasi untuk Windows: pakai ssh.exe bawaan Windows 10+ atau OpenSSH
ssh <USER>@nexerp.id "date -u +'%Y-%m-%dT%H:%M:%SZ'; uptime" `
  | Out-File "$EVID\01-git\prod-deploy-timestamp.txt" -Encoding utf8

ssh <USER>@nexerp.id "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.RunningFor}}\t{{.Status}}'" `
  | Out-File "$EVID\02-images\prod-ps.txt" -Encoding utf8

# Catat release artifact (kalau ada) — lihat label image atau tag
ssh <USER>@nexerp.id "docker inspect --format '{{.Name}} image={{.Config.Image}} created={{.Created}}' \$(docker ps -q)" `
  | Out-File "$EVID\02-images\prod-container-meta.txt" -Encoding utf8

# Nginx snippet untuk path mapping (lihat Section 5 Source Index untuk nginx.conf root)
ssh <USER>@nexerp.id "cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/*.conf 2>/dev/null || echo 'N/A'" `
  | Out-File "$EVID\02-images\nginx-active.txt" -Encoding utf8
```
> **Expected:**
> - `prod-deploy-timestamp.txt` berisi timestamp UTC + uptime.
> - `prod-ps.txt` berisi daftar container `nexerp-*` atau setara.
> - `nginx-active.txt` berisi blok `location /api/` (atau setara).
>
> **STOP kalau:** SSH gagal → cek SSH key, hostname, atau apakah production sudah live. Catat status koneksi di `SUMMARY.md`.

### 2.5 Environment summary (vars yang aktif, **tanpa nilai secret**)

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

# Daftar nama env var yang aktif di backend (.env), TANPA nilainya
Get-Content "backend\.env" | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=') {
        $name = $matches[1]
        $value = $_.Substring($_.IndexOf('=') + 1).Trim()
        $status = if ([string]::IsNullOrWhiteSpace($value)) { 'EMPTY' } else { 'SET' }
        "$name = $status"
    }
} | Sort-Object -Unique | Out-File "$EVID\..\02-images\backend-env-summary.txt" -Encoding utf8

# Frontend public vars (NEXT_PUBLIC_*) — boleh display nama saja
Get-Content "frontend\.env.local" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '^\s*(NEXT_PUBLIC_[A-Z0-9_]+)\s*=') {
        "$($matches[1]) = SET"
    }
} | Sort-Object -Unique | Out-File "$EVID\..\02-images\frontend-env-summary.txt" -Encoding utf8

# Production env (via SSH, hanya nama yang di-set, tanpa value)
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=backend) printenv | sort | sed 's/=.*/=<redacted>/'" `
  | Out-File "$EVID\..\02-images\prod-env-summary.txt" -Encoding utf8
```
> **Expected:**
> - `backend-env-summary.txt` berisi daftar nama var + status `SET`/`EMPTY`. **Tidak ada nilai.**
> - `prod-env-summary.txt` berisi daftar var dengan `=<redacted>`.
>
> **STOP kalau:** ada secret value terlihat di output (regex leak) → hapus file, re-run dengan masking.

**Lihat `Lampiran A`** untuk daftar env var yang aman di-export dan yang harus di-redact.

---

## 3. STEP 2 — Backup Database + Test Restore (PENTING!)

**Tujuan:** bukti bahwa kita bisa restore dari backup, bukan sekadar punya file backup.

### 3.1 Backup command untuk Postgres

#### Opsi A: Postgres di Docker (paling umum di VPS)

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_DIR = "$EVID\04-backup\$TS"
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

# Ambil container name Postgres
$PG_CONTAINER = ssh <USER>@nexerp.id "docker ps --format '{{.Names}}' | grep -i postgres | head -n1"
Write-Host "Postgres container: $PG_CONTAINER"

# pg_dump custom-format (compressed, parallel-restore ready)
ssh <USER>@nexerp.id "docker exec $PG_CONTAINER pg_dump -U <DB_USER> -d <DB_NAME> -Fc --no-owner --no-privileges" `
  | Set-Content -Path "$BACKUP_DIR\nexerp-$TS.dump" -Encoding Byte -Force

# Hitung checksum + size
Get-FileHash "$BACKUP_DIR\nexerp-$TS.dump" -Algorithm SHA256 `
  | Out-File "$BACKUP_DIR\nexerp-$TS.dump.sha256.txt"

Get-ChildItem "$BACKUP_DIR" | Select-Object Name, Length | Out-File "$BACKUP_DIR\manifest.txt"
```
> **Expected:**
> - `nexerp-$TS.dump` size > 1 MB (tergantung data).
> - `nexerp-$TS.dump.sha256.txt` berisi `<hash>  nexerp-$TS.dump`.
>
> **STOP kalau:** file `.dump` < 100 KB → cek apakah DB kosong atau pg_dump gagal.

#### Opsi B: Postgres lokal (kalau ada `psql` di Windows)
```powershell
$env:PGPASSWORD = (Get-Content "backend\.env" | Select-String "DATABASE_URL" | ForEach-Object { $_ -replace '.*password=([^;]+).*','$1' })
pg_dump -h localhost -U <DB_USER> -d <DB_NAME> -Fc -f "$BACKUP_DIR\nexerp-local-$TS.dump"
```
> **PERHATIAN:** `$env:PGPASSWORD` di-scope ke session PowerShell ini saja, otomatis hilang saat window ditutup.

### 3.2 Tulis backup ke folder `evidence/backups/<timestamp>/`

Output dari 3.1 sudah otomatis ke `$EVID\04-backup\$TS\`. Path final:

```
evidence/<DATE>/04-backup/<TS>/nexerp-<TS>.dump
evidence/<DATE>/04-backup/<TS>/nexerp-<TS>.dump.sha256.txt
evidence/<DATE>/04-backup/<TS>/manifest.txt
```

### 3.3 Restore ke isolated DB (BUKAN production)

> **WAJIB:** restore ke database dengan nama lain (mis. `nexerp_restore_test_<TS>`). Jangan restore ke production DB.

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_FILE = ssh <USER>@nexerp.id "ls -1t ~/backups/*.dump 2>/dev/null | head -n1"  # atau path manual

# Pull backup lokal dulu
scp "$BACKUP_FILE" "$EVID\..\05-restore\restore-input.dump"

# Copy ke VPS + restore ke DB isolated
ssh <USER>@nexerp.id @"
docker exec -i \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d postgres -c 'CREATE DATABASE nexerp_restore_test_$TS;'
docker exec -i \$(docker ps -q -f name=postgres) pg_restore -U <DB_USER> -d nexerp_restore_test_$TS --no-owner --no-privileges --jobs=4 < /tmp/restore-input.dump
"@
```
> **Expected:**
> - `CREATE DATABASE` = `CREATE DATABASE`.
> - `pg_restore` selesai tanpa error fatal (warning tentang sequence/owner normal).

### 3.4 Verify schema version + sample data readable

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
$RESTORE_DB = "nexerp_restore_test_$TS"

# Cek migration table
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d $RESTORE_DB -c 'SELECT migration_name, finished_at IS NOT NULL AS applied, checksum FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;'" `
  | Out-File "$EVID\..\06-migrations\restored-migrations.txt" -Encoding utf8

# Latest migration name
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d $RESTORE_DB -tAc 'SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1;'" `
  | Out-File "$EVID\..\06-migrations\restored-latest-migration.txt" -Encoding utf8
```
> **Expected:**
> - `restored-migrations.txt` berisi baris migration dengan `applied = t`.
> - `restored-latest-migration.txt` berisi satu nama migration (mis. `20260115_add_warehouse_status`).

### 3.5 Tulis hasil restore (counts row per table utama)

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
$RESTORE_DB = "nexerp_restore_test_$TS"

# Daftar tabel inti (lihat Lampiran B untuk daftar lengkap)
$TABLES = @(
    "User","Role","Permission","Client","Product","Material",
    "SalesOrder","PurchaseOrder","Invoice","Payment","JournalEntry",
    "StockMovement","Bom","WorkOrder","Lead","Quotation"
)

$report = foreach ($t in $TABLES) {
    $count = ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d $RESTORE_DB -tAc \"SELECT COUNT(*) FROM `\""$t\"`\";\""
    [PSCustomObject]@{ Table = $t; RowCount = ($count -replace '\s','') }
}
$report | Format-Table -AutoSize | Out-File "$EVID\..\05-restore\restored-row-counts.txt"
```
> **Expected:** tabel utama berisi row count > 0 untuk domain produksi (Client, Product, SalesOrder). Tabel kosong seperti `Bom`/`WorkOrder` di seed mungkin 0 — itu OK.
>
> **STOP kalau:** semua count = 0 padahal production aktif → restore gagal. Cek error log `pg_restore`.

### 3.6 Cleanup isolated DB

```powershell
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d postgres -c 'DROP DATABASE nexerp_restore_test_$TS;'"
```
> Catat di `SUMMARY.md` bahwa DB test sudah di-drop.

---

## 4. STEP 3 — Audit Migration Folders vs `_prisma_migrations`

**Tujuan:** pastikan folder `prisma/migrations/` (source) sinkron dengan tabel `_prisma_migrations` (yang applied di DB). Drift = bahaya.

### 4.1 List file di `prisma/migrations/`

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

Get-ChildItem -Path "backend\prisma\migrations" -Directory `
  | Select-Object Name, CreationTime `
  | Sort-Object Name `
  | Out-File "$EVID\06-migrations\local-migration-dirs.txt"

# Hash semua migration.sql
Get-ChildItem -Path "backend\prisma\migrations" -Recurse -Filter "migration.sql" `
  | ForEach-Object {
      [PSCustomObject]@{
        Migration = $_.Directory.Name
        Sha256 = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
        Size = $_.Length
      }
    } | Out-File "$EVID\06-migrations\local-migration-checksums.json"
```
> **Expected:** daftar folder migration (mis. `20260101_init`, `20260115_add_x`). Checksum JSON valid.

### 4.2 Query `_prisma_migrations` table di dev / staging / production

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

# Production
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d <DB_NAME> -c 'SELECT migration_name, started_at, finished_at, applied_steps_count, checksum FROM _prisma_migrations ORDER BY started_at;'" `
  | Out-File "$EVID\06-migrations\prod-applied-migrations.txt" -Encoding utf8

# Dev (kalau ada DB lokal)
if (Test-Path "backend\.env") {
    Set-Location "backend"
    npm exec -- prisma migrate status --schema prisma/schema.prisma 2>&1 `
      | Out-File "$EVID\..\06-migrations\dev-applied-migrations.txt" -Encoding utf8
    Set-Location ".."
}
```
> **Expected:**
> - `prod-applied-migrations.txt` berisi daftar migration dengan `finished_at` non-null.
> - `dev-applied-migrations.txt` (jika ada) berisi status `Database schema is up to date` atau daftar pending.

### 4.3 Compare checksums

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

# Parse prod-applied-migrations.txt (asumsi format psql table)
$prod = Get-Content "$EVID\06-migrations\prod-applied-migrations.txt" `
  | Where-Object { $_ -match '^\s*\|\s*(\S+)\s*\|.*\|\s+([0-9a-f]{64})\s*\|' } `
  | ForEach-Object {
      if ($_ -match '^\s*\|\s*(\S+)\s*\|.*\|\s+([0-9a-f]{64})\s*\|') {
        [PSCustomObject]@{ Migration = $matches[1]; ProdChecksum = $matches[2] }
      }
    }

$local = Get-Content "$EVID\06-migrations\local-migration-checksums.json" -Raw | ConvertFrom-Json

$diff = foreach ($l in $local) {
    $p = $prod | Where-Object { $_.Migration -eq $l.Migration }
    [PSCustomObject]@{
      Migration = $l.Migration
      LocalSha256 = $l.Sha256
      ProdChecksum = if ($p) { $p.ProdChecksum } else { '<NOT APPLIED>' }
      Match = if ($p -and $p.ProdChecksum -eq $l.Sha256) { 'OK' } else { 'DRIFT' }
    }
}
$diff | Format-Table -AutoSize | Out-File "$EVID\06-migrations\checksum-compare.txt"
```
> **Expected:**
> - Semua baris `Match = OK`.
> - Migration yang ada di local tapi belum applied: `ProdChecksum = <NOT APPLIED>`, `Match = DRIFT` (acceptable untuk dev, **tidak acceptable untuk production**).

### 4.4 Flag migration untracked / drifts

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

# Migration applied di prod tapi tidak ada di folder lokal (BAHAYA)
$prodOnly = $prod | Where-Object { -not ($local.Migration -contains $_.Migration) }
if ($prodOnly) {
    "PROD-ONLY (applied in DB, missing locally — DO NOT squash):" | Out-File "$EVID\06-migrations\drift-flags.txt"
    $prodOnly | Out-File "$EVID\06-migrations\drift-flags.txt" -Append
    Write-Host "FLAGGED: prod-only drift" -ForegroundColor Red
} else {
    "No prod-only drifts detected." | Out-File "$EVID\06-migrations\drift-flags.txt"
}
```
> **STOP kalau:** ada migration prod-only → ini blocker Phase 1. Migration yang sudah applied **immutable**, tidak boleh di-revert atau di-squash.

---

## 5. STEP 4 — Baseline Build/Test/Lint Numbers

**Tujuan:** rekam angka baseline. Target DoD Phase 1 = error count 0 untuk typecheck/lint.

### 5.1 Backend: typecheck

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "backend"

npm exec -- tsc --noEmit 2>&1 | Tee-Object "$EVID\..\07-tests\backend-tsc.txt"
$errCount = (Get-Content "$EVID\..\07-tests\backend-tsc.txt" | Select-String "error TS" -SimpleMatch).Count
"backend tsc error count = $errCount" | Out-File "$EVID\..\07-tests\backend-tsc-count.txt"
```
> **Expected:** angka baseline (mis. `error count = 47`). Tidak harus 0 di Phase 0; target 0 ada di Phase 1 DoD.

### 5.2 Backend: lint

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "backend"

npm run lint 2>&1 | Tee-Object "$EVID\..\07-tests\backend-lint.txt"
# Parse ESLint summary (format: "✖ X problems")
$summary = Get-Content "$EVID\..\07-tests\backend-lint.txt" | Select-String "problems" | Select-Object -Last 1
$summary | Out-File "$EVID\..\07-tests\backend-lint-count.txt"
```
> **Expected:** output ESLint dengan ringkasan akhir. Simpan raw output juga.

### 5.3 Backend: unit tests

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "backend"

# Cek script yang tersedia
Get-Content "package.json" | Select-String '"test:?(unit|e2e|integration)?":' 
```
> **Lihat `backend/package.json` scripts.** Gunakan script yang ada — mungkin `test`, `test:unit`, `test:e2e`.

```powershell
# Default: jalankan unit test tanpa e2e
npm run test:unit -- --runInBand 2>&1 | Tee-Object "$EVID\..\07-tests\backend-test-unit.txt"
```
> **Flag `--runInBand`** mencegah Jest parallel workers (mengurangi OOM di Windows).
>
> **Expected:** `Tests: X passed, Y failed, Z skipped`. Simpan full output.

### 5.4 Frontend: typecheck

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "frontend"

npm exec -- tsc --noEmit 2>&1 | Tee-Object "$EVID\..\07-tests\frontend-tsc.txt"
```
> **Expected:** angka baseline (idealnya sudah 0; kalau tidak, ini work item Phase 1).

### 5.5 Frontend: lint

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "frontend"

npm run lint 2>&1 | Tee-Object "$EVID\..\07-tests\frontend-lint.txt"
```
> **Expected:** ringkasan ESLint dengan warning/error count.

### 5.6 Frontend: Vitest unit/component

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "frontend"

npm exec -- vitest run --reporter=verbose 2>&1 | Tee-Object "$EVID\..\07-tests\frontend-vitest.txt"
```
> **Expected:** `Test Files X passed, Y failed`, `Tests N passed, M failed, K skipped`.

### 5.7 Frontend: Playwright (jika applicable)

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "frontend"

# Hanya jalan kalau playwright.config.ts ada dan test:e2e script terdefinisi
if ((Test-Path "playwright.config.ts") -and (Get-Content "package.json" | Select-String '"test:e2e"')) {
    npm run test:e2e 2>&1 | Tee-Object "$EVID\..\07-tests\frontend-playwright.txt"
} else {
    "Playwright not configured — skipped" | Out-File "$EVID\..\07-tests\frontend-playwright.txt"
}
```
> **Expected:** kalau dijalankan, ada summary pass/fail. Kalau di-skip, file berisi catatan skip.

### 5.8 Backend: Prisma validate

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "backend"

npm exec -- prisma validate 2>&1 | Tee-Object "$EVID\..\07-tests\backend-prisma-validate.txt"
```
> **Expected:** `The schema at prisma/schema.prisma is valid 🚀`. Kalau error, catat untuk Phase 1.

### 5.9 Backend: bundle size

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Set-Location "backend"

# Build dulu untuk generate dist/
npm run build 2>&1 | Tee-Object "$EVID\..\08-bundle\backend-build.txt"

# Ukur dist/
if (Test-Path "dist") {
    $size = (Get-ChildItem -Recurse "dist" | Measure-Object Length -Sum).Sum
    [PSCustomObject]@{
        Path = "backend/dist"
        SizeBytes = $size
        SizeMB = [math]::Round($size / 1MB, 2)
    } | Out-File "$EVID\..\08-bundle\backend-dist-size.txt"
}

# Frontend bundle
Set-Location "../frontend"
npm run build 2>&1 | Tee-Object "$EVID\..\08-bundle\frontend-build.txt"
if (Test-Path ".next") {
    $size = (Get-ChildItem -Recurse ".next" | Measure-Object Length -Sum).Sum
    [PSCustomObject]@{
        Path = "frontend/.next"
        SizeBytes = $size
        SizeMB = [math]::Round($size / 1MB, 2)
    } | Out-File "$EVID\..\08-bundle\frontend-dist-size.txt"
}
Set-Location ".."
```
> **Expected:** angka size dalam MB. Catat sebagai baseline.

---

## 6. STEP 5 — Inventory Active Worktree Changes (CLASSIFICATION)

**Tujuan:** klasifikasikan SEMUA dirty/untracked files. **JANGAN hapus otomatis.**

### 6.1 List dirty files (PowerShell-friendly)

```powershell
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"

# Modified + untracked
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" status --short `
  | Out-File "$EVID\09-worktree-classification\git-status-short.txt"

# Hanya untracked
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" ls-files --others --exclude-standard `
  | Out-File "$EVID\09-worktree-classification\untracked.txt"

# Hanya modified (tracked)
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" diff --name-only `
  | Out-File "$EVID\09-worktree-classification\modified.txt"

# Staged
git -C "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO" diff --cached --name-only `
  | Out-File "$EVID\09-worktree-classification\staged.txt"
```
> **Expected:** 4 file list. Total lines = jumlah file aktif.

### 6.2 Klasifikasikan setiap file/folder

Baca setiap file dari 6.1, lalu isi tabel klasifikasi. **Disposition:**

| Disposition | Arti | Tindakan |
|---|---|---|
| `KEEP` | Working tree harus tetap, akan di-commit di branch sendiri | Lanjut commit di Phase 1 |
| `SPLIT` | Satu folder/file punya banyak concern, perlu di-pisah | Pisahkan per concern sebelum commit |
| `COMMIT` | Sudah siap, tinggal commit | `git add` + commit dengan conventional message |
| `DISCARD-BY-OWNER` | Tidak dipakai, tapi owner belum confirm | **TUNGGU owner**, jangan hapus |
| `QUARANTINE` | Mencurigakan, perlu investigasi terpisah | Pindah ke `evidence/<DATE>/09-worktree-classification/quarantine/` (copy, bukan move) |

### 6.3 Tabel klasifikasi (template)

Simpan ke `$EVID\09-worktree-classification\classification.md`:

```markdown
| File/Folder | Status | Owner | Disposition | Notes |
|---|---|---|---|---|
| `backend/src/foo.ts` | modified | @alice | KEEP | Will commit as part of BASE-001 |
| `frontend/src/baz.tsx` | untracked | @bob | SPLIT | Concerns UI + state, split needed |
| `debug_prisma.js` | untracked | ? | DISCARD-BY-OWNER | Ad-hoc debug, await owner |
| `tmp_migration.sql` | untracked | ? | QUARANTINE | Looks like prod schema change, escalate |
```

### 6.4 JANGAN hapus otomatis; hanya rekomendasi

```powershell
# Untuk disposal yang sudah dikonfirmasi owner, buat file rekomendasi (BUKAN hapus)
$DISPOSAL_CANDIDATES = @(
    "debug_prisma.js",
    "tmp_migration.sql"
)

$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
"# Recommended disposal (MANUAL, requires owner approval)" | Out-File "$EVID\09-worktree-classification\disposal-candidates.txt"
$DISPOSAL_CANDIDATES | ForEach-Object { "  - $_" } | Out-File "$EVID\09-worktree-classification\disposal-candidates.txt" -Append
```
> **STOP kalau:** ada file yang tampak seperti production schema/data tanpa owner jelas → escalate, JANGAN dispose.

---

## 7. STEP 6 — File Output & Where to Save Evidence

Semua hasil di-save ke `evidence/<DATE>/` (format `yyyy-MM-dd`).

```
evidence/<DATE>/
├── SUMMARY.md                          ← FILE UTAMA REVIEW
├── 01-git/
│   ├── branch.txt
│   ├── commit-sha.txt
│   ├── commit-meta.txt
│   ├── dirty-files.txt
│   ├── dirty-porcelain.txt
│   ├── remote.txt
│   └── prod-deploy-timestamp.txt
├── 02-images/
│   ├── docker-images.txt
│   ├── nexerp-images.txt
│   ├── docker-ps.txt
│   ├── prod-ps.txt
│   ├── prod-container-meta.txt
│   ├── nginx-active.txt
│   ├── backend-env-summary.txt
│   ├── frontend-env-summary.txt
│   └── prod-env-summary.txt
├── 03-db/                              ← opsional, untuk query ad-hoc
├── 04-backup/
│   └── <TS>/
│       ├── nexerp-<TS>.dump
│       ├── nexerp-<TS>.dump.sha256.txt
│       └── manifest.txt
├── 05-restore/
│   ├── restore-input.dump
│   └── restored-row-counts.txt
├── 06-migrations/
│   ├── prisma-migrate-status.txt
│   ├── migration-file-checksums.txt
│   ├── local-migration-dirs.txt
│   ├── local-migration-checksums.json
│   ├── prod-applied-migrations.txt
│   ├── dev-applied-migrations.txt
│   ├── restored-migrations.txt
│   ├── restored-latest-migration.txt
│   ├── checksum-compare.txt
│   └── drift-flags.txt
├── 07-tests/
│   ├── backend-tsc.txt
│   ├── backend-tsc-count.txt
│   ├── backend-lint.txt
│   ├── backend-lint-count.txt
│   ├── backend-test-unit.txt
│   ├── backend-prisma-validate.txt
│   ├── frontend-tsc.txt
│   ├── frontend-lint.txt
│   ├── frontend-vitest.txt
│   └── frontend-playwright.txt
├── 08-bundle/
│   ├── backend-build.txt
│   ├── backend-dist-size.txt
│   ├── frontend-build.txt
│   └── frontend-dist-size.txt
└── 09-worktree-classification/
    ├── git-status-short.txt
    ├── untracked.txt
    ├── modified.txt
    ├── staged.txt
    ├── classification.md
    └── disposal-candidates.txt
```

### 7.1 `SUMMARY.md` template

Buat manual setelah semua step selesai:

```markdown
# Phase 0 — Evidence Freeze Summary

**Date:** <YYYY-MM-DD>
**Operator:** <your name>
**Duration:** <actual hours>

## 1. Release identity
- Branch: `$(cat evidence/<DATE>/01-git/branch.txt)`
- Commit SHA: `$(cat evidence/<DATE>/01-git/commit-sha.txt)`
- Backend image digest: <from nexerp-images.txt>
- Frontend image digest: <from nexerp-images.txt>
- Latest prod migration: <from restored-latest-migration.txt>
- Prod deploy timestamp: <from prod-deploy-timestamp.txt>

## 2. Backup & restore
- Backup file: `evidence/<DATE>/04-backup/<TS>/nexerp-<TS>.dump`
- Backup size: <MB>
- Backup SHA256: <hash>
- Restored to DB: `nexerp_restore_test_<TS>`
- Restore verified: ✅ / ❌
- Sample row counts: <table1>=N, <table2>=M, ...
- Test DB dropped: ✅

## 3. Migration audit
- Local migrations count: <N>
- Applied migrations count: <M>
- Drift flagged: <list or "none">
- Prod-only migrations: <list or "none">

## 4. Baseline numbers
- Backend tsc errors: <N>
- Backend lint issues: <N>
- Backend unit tests: passed=<X>, failed=<Y>, skipped=<Z>
- Backend prisma validate: ✅ / ❌
- Frontend tsc errors: <N>
- Frontend lint issues: <N>
- Frontend vitest: passed=<X>, failed=<Y>
- Frontend playwright: ✅ / ❌ / skipped
- Backend bundle size: <MB>
- Frontend bundle size: <MB>

## 5. Active worktree classification
- Total dirty files: <N>
- KEEP: <N>
- SPLIT: <N>
- COMMIT: <N>
- DISCARD-BY-OWNER: <N>  ← requires owner approval, NOT auto-deleted
- QUARANTINE: <N>

## 6. Blockers for Phase 1
- <list of items that block Phase 1 DoD>

## 7. Sign-off
- Operator: <name> — <date>
- Reviewer: <name> — <date>
```

---

## 8. Exit Criteria

Centang semua sebelum lanjut ke Phase 1.

- ✅ **8.1 Release teridentifikasi** — branch, commit SHA, image digest (atau catatan "N/A — tarball deploy"), dan latest prod migration tercatat di `01-git/`, `02-images/`, `06-migrations/`.
- ✅ **8.2 Backup ter-restore** — `05-restore/restored-row-counts.txt` berisi counts > 0 untuk tabel produksi utama (lihat Lampiran B).
- ✅ **8.3 Tidak ada migration applied yang akan diubah** — `06-migrations/drift-flags.txt` tidak berisi prod-only migrations; atau kalau ada, ada ADR + business approval tertulis.
- ✅ **8.4 Semua perubahan aktif punya owner + disposition** — `09-worktree-classification/classification.md` lengkap; `DISCARD-BY-OWNER` sudah dikonfirmasi owner.
- ✅ **8.5 Baseline numbers terekam** — semua file di `07-tests/` dan `08-bundle/` ada, dan angka tercantum di `SUMMARY.md`.

---

## 9. Setelah Evidence Freeze

Lanjut ke **Phase 1 — Baseline Recovery** per `00_MASTER_PLAN.md` Section 5. Phase 1 deliverables:

- TypeScript errors → 0 (backend & frontend).
- Jest OOM fix (project split, worker control).
- Prisma migrations valid + auto-validated.
- Healthcheck path diperbaiki (`/v1/system/live` & `/v1/system/ready`).
- Dirty-tree guard + frontend build gate.
- Release manifest per release.

Tickets pertama:
- `BASE-001` — Capture release/migration/environment baseline (sudah selesai via Phase 0 ini).
- `BASE-002` — Classify active worktree changes without deleting them (sudah selesai via Phase 0 ini).
- `BUILD-001` — Resolve backend TypeScript errors to zero.
- `TEST-001` — Split backend Jest projects and eliminate OOM.
- `DEPLOY-001` — Correct all healthcheck paths and fail deploy on unhealthy state.

---

## 10. Troubleshooting

### 10.1 PowerShell command gagal → apa yang dicek

| Gejala | Cek |
|---|---|
| `git : The term 'git' is not recognized` | Git belum di PATH atau Git for Windows belum di-install. Restart PowerShell, atau pakai full path `C:\Program Files\Git\bin\git.exe`. |
| `npm : The term 'npm' is not recognized` | Node.js belum di-install atau PATH. Cek `where.exe npm`. |
| `ssh : Permission denied (publickey)` | SSH key belum di-add ke ssh-agent: `ssh-add ~/.ssh/id_ed25519`. |
| `cannot find path '...\backend'` | Spasi di path → pakai `-LiteralPath` atau quote dengan double-quote. |
| Output file `Out-File` kosong | Path folder tujuan belum ada → pakai `New-Item -ItemType Directory -Force` dulu. |
| Encoding karakter Indonesia rusak di file | Gunakan `-Encoding utf8` (bukan default `utf8NoBOM` di PS 5.1, atau default `ASCII`). Tambah `utf8` eksplisit. |

### 10.2 Docker tidak tersedia (production pakai non-Docker)

Kalau production di-deploy via `tar` SCP (per `deploy-production.ps1` di Source Index):

- Skip Section 2.2 (`docker images`) dan 2.4 (`docker inspect`).
- Sebagai gantinya, baca `deploy-production.ps1` terakhir yang dijalankan dan timestamp file artifact di VPS:
  ```powershell
  ssh <USER>@nexerp.id "ls -lt /opt/nexerp/*.tar.gz /opt/nexerp/*.tgz 2>/dev/null | head -n5" `
    | Out-File "$EVID\01-git\prod-artifact-files.txt"
  ```
- Backup database pakai `pg_dump` langsung (lihat Opsi B di 3.1) atau lewat `ssh <USER>@nexerp.id "pg_dump ..."` lalu pipe ke file lokal.

### 10.3 Postgres tidak accessible → fallback

| Skenario | Fallback |
|---|---|
| Local Postgres tidak ada | Lewati Section 3 untuk DB lokal; fokus ke production backup via SSH. |
| Production Postgres container restart-loop | Tunggu container up; `docker ps` polling 30s. Jangan paksa restart. |
| `pg_dump` permission denied | Pastikan user punya privilege `SELECT` semua tabel (default `nexerp_user`). Hubungi DB owner. |
| `psql` di Windows tidak ada | Semua query DB lewat `docker exec ... psql ...` di VPS. Section 3 & 4 tetap bisa jalan. |
| SSH ke VPS timeout | Cek koneksi, restart VPN kalau perlu, atau jadwalkan ulang. Catat blocker di `SUMMARY.md`. |

### 10.4 OOM saat build / test

| Gejala | Fix |
|---|---|
| Backend Jest OOM | Tambah `--runInBand` (sudah di script), `--maxWorkers=1`, atau naikkan `NODE_OPTIONS=--max-old-space-size=4096`. |
| Frontend Vitest OOM | Pakai `vitest run --pool=threads --poolOptions.threads.singleThread=true`. |
| Next.js build OOM | Set `NODE_OPTIONS=--max-old-space-size=4096` sebelum `npm run build`. |
| Disk penuh saat build | Hapus `.next/cache`, `node_modules/.cache`, atau artifact lama di `artifacts/` dan `_archive/`. |

### 10.5 Evidence file terlalu besar

Backup `.dump` bisa ratusan MB. Solusi:

```powershell
# Compress per folder setelah semua step selesai
$EVID = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\evidence\$(Get-Date -Format 'yyyy-MM-dd')"
Compress-Archive -Path "$EVID\*" -DestinationPath "$EVID.tar.gz" -Force
```
> **Catatan:** `.tar.gz` mungkin tidak bisa dibuka langsung di Windows Explorer (PowerShell `Compress-Archive` bikin `.zip`). Untuk `.tar.gz` asli pakai `tar.exe` (Windows 10+):
> ```powershell
> tar -czf "$EVID.tar.gz" -C (Split-Path $EVID -Parent) (Split-Path $EVID -Leaf)
> ```

---

## 11. Lampiran

### A. Daftar env vars yang aman di-export (tanpa nilai)

**Backend (`backend/.env`):**

| Nama var | Aman di-export nilainya? | Kategori |
|---|---|---|
| `NODE_ENV` | ✅ ya | Public |
| `PORT` | ✅ ya | Public |
| `DATABASE_URL` | ❌ tidak — redact | Secret |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` | ⚠ host/port/name boleh, password tidak | Mixed |
| `DB_PASSWORD` | ❌ tidak | Secret |
| `JWT_SECRET` | ❌ tidak | Secret |
| `JWT_EXPIRES_IN` | ✅ ya | Public |
| `REDIS_URL` | ❌ tidak (kalau ada password di URL) | Mixed |
| `CORS_ORIGIN` | ✅ ya | Public |
| `LOG_LEVEL` | ✅ ya | Public |
| `SENTRY_DSN` | ❌ tidak | Secret (meskipun DSN publik, lebih aman redact) |
| `API_BASE_URL` | ✅ ya | Public |

**Frontend (`frontend/.env.local`):**

| Nama var | Aman di-export? | Catatan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ ya | Public build-time |
| `NEXT_PUBLIC_APP_NAME` | ✅ ya | Public |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚠ boleh karena prefix `NEXT_PUBLIC_` sudah publik | — |
| `SENTRY_AUTH_TOKEN` (non-prefix) | ❌ tidak | Secret |
| Service-account / API keys tanpa prefix | ❌ tidak | Secret |

**Prinsip:** kalau ragu, redact. Pattern aman untuk masking di output file:

```powershell
# Contoh masker generic
$content = Get-Content ".env" -Raw
$content = $content -replace '(?<=PASSWORD=)[^\r\n]+', '<REDACTED>'
$content = $content -replace '(?<=SECRET=)[^\r\n]+', '<REDACTED>'
$content = $content -replace '(?<=TOKEN=)[^\r\n]+', '<REDACTED>'
```

### B. Daftar tabel database yang perlu count saat verify restore

**Tabel master & user (wajib > 0 di production):**

- `User`
- `Role`
- `Permission`
- `Client`
- `Product`
- `Material`
- `Supplier`
- `Warehouse`
- `Location`

**Tabel transaksi (wajib > 0 di production aktif):**

- `SalesOrder`
- `PurchaseOrder`
- `Invoice`
- `Payment`
- `JournalEntry`
- `StockMovement`
- `Lead`
- `Quotation`

**Tabel manufacturing & legal (boleh 0 di awal):**

- `Bom` (Bill of Materials)
- `WorkOrder`
- `JobOrder`
- `ProductionBatch`
- `LegalDocument`
- `EscrowAccount`

**Tabel sistem:**

- `_prisma_migrations` (wajib > 0)
- `_outbox` atau setara (kalau ada, tabel outbox pattern)
- `AuditLog`

Cara cek nama tabel aktual:
```powershell
ssh <USER>@nexerp.id "docker exec \$(docker ps -q -f name=postgres) psql -U <DB_USER> -d <DB_NAME> -tAc \"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;\""
```

### C. Daftar migration directories yang harus di-audit

Path lokal:
```
backend/prisma/migrations/
```

Audit target:
- Semua sub-folder bernama `YYYYMMDD_*` atau `YYYYMMDDHHMMSS_*`.
- File di setiap folder: `migration.sql` (wajib) + optional `migration_lock.toml` di root.
- Hash SHA256 setiap `migration.sql` dicatat di `06-migrations/local-migration-checksums.json`.

Tabel DB target:
- `_prisma_migrations` di **dev**, **staging** (kalau ada), dan **production**.

Compare matrix output → `06-migrations/checksum-compare.txt`.

### D. Daftar path/folder yang relevan

**Project root:** `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO`

| Path | Tujuan |
|---|---|
| `backend/` | NestJS app source |
| `backend/prisma/` | Schema + migrations |
| `backend/src/` | Modules, services, controllers |
| `backend/.env` | Backend env (secret — lihat Lampiran A) |
| `backend/dist/` | Backend build output |
| `frontend/` | Next.js app source |
| `frontend/src/` | App router, components, lib |
| `frontend/.env.local` | Frontend env |
| `frontend/.next/` | Next.js build output |
| `docs/legacy-erp/` | Spec, audit, master plan |
| `docs/legacy-erp/backend/00_MASTER_PLAN.md` | Plan sumber (Phase 0–8) |
| `docs/legacy-erp/backend/05_DEPLOYMENT_AND_OPERATIONS.md` | Deploy + operations |
| `docs/legacy-erp/_AUDIT_ANALYSIS_2026-09-09.md` | Forensic audit reference |
| `evidence/<DATE>/` | Output Phase 0 (dibuat step 1.5) |
| `artifacts/` | Output CI/build artifacts (kalau ada) |
| `deploy-production.ps1` | Deploy script legacy |
| `rollback.ps1` | Rollback script legacy |
| `db-ops.ps1` | DB ops script (kalau ada, baca sebelum pakai) |
| `docker-compose.prod.yml` | Production compose |
| `nginx.conf` | Nginx root config |

**VPS (nexerp.id):**

| Path | Tujuan |
|---|---|
| `/opt/nexerp/` atau `~/nexerp-app/` | App source (periksa via SSH `ls -la ~`) |
| `/etc/nginx/sites-enabled/` atau `/etc/nginx/conf.d/` | Nginx active config |
| `~/backups/` | Lokasi backup default (kalau ada) |
| `/var/lib/postgresql/data/` | Postgres data (kalau bind-mount) |

> **Cara cek cepat path VPS:**
> ```powershell
> ssh <USER>@nexerp.id "ls -la ~ | head -n 20"
> ssh <USER>@nexerp.id "docker ps --format '{{.Names}}\t{{.Mounts}}'"
> ```

---

## Penutup

Phase 0 bukan goal akhir — dia fondasi. Setelah `SUMMARY.md` lengkap dan exit criteria tercapai, kita punya baseline yang **bisa dipercaya**, bukan angka audit lama. Semua keputusan Phase 1+ harus berpatokan pada angka di `evidence/<DATE>/`.

Per `00_MASTER_PLAN.md` Section 5:
> *"Bekukan fitur lintas domain sampai Phase 1 gate hijau; emergency fix tetap boleh dengan regression test."*

Artinya: selama Phase 1 belum exit, **jangan merge feature baru** kecuali emergency fix dengan regression test yang valid.

Per Section 9 (Production go/no-go gates): tanpa Phase 0 selesai, **semua release otomatis NO-GO**.

— End of Runbook —