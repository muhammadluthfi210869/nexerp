# Runbook Deploy Cepat dan Testing Production OmniCRM

Dokumen ini adalah satu-satunya panduan ringkas untuk melakukan deploy perubahan OmniCRM dengan cepat dan menguji fitur-fitur Round 2 (per-busdev reply rate + auto round-robin assign + Visual DNA compliance) di production NexERP. Dokumen ini **melengkapi** `docs/RUNBOOK-DEPLOY-DAN-TEST-NEXERP.md` (Management Task runbook) dan `docs/marketing/OMNICRM-DEPLOY.md` (OmniCRM deploy + curl smoke). Jangan menyimpan password, private key, token, atau OTP di file ini maupun di Git.

## Informasi production

| Item | Nilai |
| --- | --- |
| Domain | `https://nexerp.id` |
| Server | `103.93.134.215` |
| SSH user | `dreamlab` |
| Direktori aplikasi | `/home/dreamlab/nexerp` |
| Compose project | `production-light` |
| Frontend container | `production-light-frontend-1` |
| Backend container | `production-light-backend-1` |
| Database container | `production-light-db-1` |
| Nginx container | `production-light-nginx-1` |
| Akun tes manager | `revita@nexerp.id` (role MARKETING) |
| HMAC ingest secret env | `LEAD_SVC_INGEST_SECRET` (backend) — harus sama dengan yang di lead-svc-deploy |
| CRM migration | `20260911225751_omnicrm_foundation` (terapkan via `npx prisma migrate deploy`) |

## Prinsip aman

1. Untuk perubahan UI murni OmniCRM, deploy hanya service `frontend`. Jangan rebuild atau restart backend/database kecuali migrasi baru ikut ter-deploy.
2. Selalu backup file production sebelum ditimpa.
3. Jalankan build lokal dahulu. Jangan deploy jika build gagal karena perubahan yang sedang dikerjakan.
4. Task QA harus menggunakan awalan `[QA-AUTO]` dan selalu dihapus via `tmp/reset-omnicrm-qa.sql` pada blok cleanup.
5. Jangan menjalankan `DELETE FROM crm_leads` langsung di production. Selalu gunakan script `tmp/reset-omnicrm-qa.sql` yang menurunkan `BussdevStaff.totalLeads` untuk menjaga audit chain.
6. Jangan menghapus `LEAD_SVC_INGEST_SECRET` setelah ditetapkan — HMAC ingest akan 401 dan lead dari website tidak akan auto-assign ke busdev.
7. Jangan menyuruh pengguna menghapus cache atau berganti browser sebelum request, console error, dan response API diperiksa.

## A. Pemeriksaan sebelum deploy

Buka PowerShell di workspace:

```powershell
Set-Location 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'
```

Pastikan file yang akan dikirim memang berisi perubahan yang diharapkan:

```powershell
git diff --check -- 'frontend/src/app/(dashboard)/marketing/omnicrm/CrmOverviewClient.tsx'
git diff -- 'frontend/src/app/(dashboard)/marketing/omnicrm/CrmOverviewClient.tsx'
```

Validasi build production lokal:

```powershell
Set-Location 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend'
npx next build
Set-Location 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'
```

Validasi server dan container:

```powershell
ssh -o ConnectTimeout=10 dreamlab@103.93.134.215 "hostname; sudo docker ps --format '{{.Names}} {{.Status}}' | grep production-light-"
```

Pastikan migrasi CRM sudah ter-apply:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec production-light-backend-1 npx prisma migrate status 2>&1 | grep -E 'omnicrm_foundation|2026'"
# Expected: 20260911225751_omnicrm_foundation listed as applied.
```

Pastikan HMAC secret sudah diset di backend container:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec production-light-backend-1 printenv LEAD_SVC_INGEST_SECRET | head -c 16 && echo"
# Expected: 32-byte hex printed, atau tidak ada output (maka belum diset → webhook 401)
```

## B. Deploy frontend tercepat

Contoh berikut mengirim hanya file OmniCRM yang berubah. Sesuaikan `$LocalFiles` jika file yang berubah berbeda.

```powershell
$Workspace = 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'
$Server = 'dreamlab@103.93.134.215'
$RemoteRoot = '/home/dreamlab/nexerp'
$DeployStamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# 4 file OmniCRM Round 2 + Sidebar.tsx (komit ec6caed, 795d272, 966477a, aaf75fe, 9496d16, 18b7373, e9f3082)
$LocalFiles = @(
  'frontend/src/app/(dashboard)/marketing/omnicrm/CrmOverviewClient.tsx'
  'frontend/src/app/(dashboard)/marketing/omnicrm/CrmKpiTiles.tsx'
  'frontend/src/app/(dashboard)/marketing/omnicrm/CrmGuestbookClient.tsx'
  'frontend/src/app/(dashboard)/marketing/omnicrm/leads/[id]/page.tsx'
  'frontend/src/components/layout/Sidebar.tsx'
  'frontend/src/components/dna/DnaStatCard.tsx'
)

foreach ($Local in $LocalFiles) {
  $Remote = $Local.Replace('\', '/')
  $BackupPath = "/home/dreamlab/backups/$(Split-Path $Local -Leaf)-$DeployStamp.tsx"
  Write-Host "Deploying $Local..."
  scp (Join-Path $Workspace $Local) "${Server}:/tmp/$(Split-Path $Local -Leaf)"
  ssh $Server "cd $RemoteRoot && cp '$Remote' '$BackupPath' && cp /tmp/$(Split-Path $Local -Leaf) '$Remote'"
}
```

Build hanya frontend:

```powershell
ssh $Server "cd $RemoteRoot && sudo docker compose build frontend"
```

Tag image dan recreate frontend tanpa mengganggu backend:

```powershell
ssh $Server "sudo docker tag nexerp-frontend:latest production-light-frontend:deploy-$DeployStamp && sudo docker tag nexerp-frontend:latest production-light-frontend:latest"
ssh $Server "cd $RemoteRoot && sudo docker compose -p production-light up -d --no-deps frontend"
```

Tunggu frontend healthy dan reload Nginx:

```powershell
Start-Sleep -Seconds 6
ssh $Server "sudo docker inspect -f '{{.State.Health.Status}}' production-light-frontend-1"
ssh $Server "sudo docker exec production-light-nginx-1 nginx -s reload"
```

Hasil yang diharapkan adalah `healthy`.

### Emergency build override

Gunakan `tmp/next.config.production-hotfix.ts` hanya jika build server tertahan error TypeScript lama yang tidak terkait perubahan OmniCRM. Backup dan pulihkan konfigurasi asli:

```powershell
scp (Join-Path $Workspace 'tmp/next.config.production-hotfix.ts') "${Server}:/tmp/next.config.production-hotfix.ts"
ssh $Server "cd $RemoteRoot && cp frontend/next.config.ts /tmp/next.config.ts.original && cp /tmp/next.config.production-hotfix.ts frontend/next.config.ts"
ssh $Server "cd $RemoteRoot && sudo docker compose build frontend"
ssh $Server "cd $RemoteRoot && cp /tmp/next.config.ts.original frontend/next.config.ts"
```

Jangan meninggalkan `ignoreBuildErrors` sebagai konfigurasi permanen. Round 3 akan memperbaiki TS errors proper (lihat `docs/QA_GATE.md` known follow-ups).

## C. Login dan testing yang akurat

### Menyediakan password tanpa menuliskannya

Masukkan password melalui prompt masked. Nilainya hanya hidup selama sesi PowerShell:

```powershell
$env:PROD_TEST_PASSWORD = Read-Host 'Password akun test NexERP' -MaskInput
$env:LEAD_SVC_INGEST_SECRET = Read-Host 'LEAD_SVC_INGEST_SECRET (shared with backend)' -MaskInput
```

Jangan menaruh password atau HMAC secret langsung di command, test file, `.env` yang di-commit, screenshot, atau dokumentasi.

### Login manual

1. Buka `https://nexerp.id/login`.
2. Isi **Corporate Email** dengan `revita@nexerp.id`.
3. Isi **Secret Key** menggunakan password production.
4. Klik **Initialize Session**.
5. Pastikan request login menuju `https://nexerp.id/api/auth/login`, bukan `localhost:3002`.
6. Buka `https://nexerp.id/marketing/omnicrm`.

### Tes otomatis OmniCRM

Tiga spec utama dijalankan berurutan. Yang pertama dan ketiga chromium-only (mutasi). Yang kedua (browser matrix) jalan di tiga browser.

```powershell
# 1. Canonical CRUD + cleanup (chromium)
npx playwright test 'tmp/omnicrm-ui-crud.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts' `
  --project='Chromium-1366x768'

# 2. Browser matrix (chromium + firefox + webkit)
npx playwright test 'tmp/omnicrm-browser-matrix.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts'

# 3. Round 2 regression (chromium — BUG #2, BUG #8, D.8)
npx playwright test 'tmp/omnicrm-round2-features.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts' `
  --project='Chromium-1366x768'

# 4. (Opsional) HMAC negative coverage
npx playwright test 'tmp/omnicrm-hmac-negative.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts' `
  --project='Chromium-1366x768'

# 5. (Opsional) RBAC matrix
npx playwright test 'tmp/omnicrm-rbac-matrix.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts' `
  --project='Chromium-1366x768'
```

Setiap spec akan menampilkan `CLEANUP_CMD:` di output saat selesai. Jalankan manual untuk membersihkan data QA:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database < tmp/reset-omnicrm-qa.sql"
# Verifikasi:
ssh dreamlab@103.93.134.215 "sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database -Atc \"SELECT count(*) FROM crm_leads WHERE display_name LIKE '[QA-AUTO]%'\""
# Expected: 0
```

Hapus password dari environment setelah tes:

```powershell
Remove-Item Env:PROD_TEST_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:LEAD_SVC_INGEST_SECRET -ErrorAction SilentlyContinue
```

## D. Verifikasi API dan database

### D.1. Backend health — endpoint CRM

```powershell
curl.exe -I https://nexerp.id/api/crm/kpi/summary
# Expected: 401 (auth required) — proves endpoint exists and JWT guard active
```

### D.2. Curl dengan JWT untuk verifikasi data

Ambil token dulu via login curl:

```powershell
$Login = Invoke-RestMethod -Method Post -Uri 'https://nexerp.id/api/auth/login' `
  -ContentType 'application/json' `
  -Body (@{ email = 'revita@nexerp.id'; password = $env:PROD_TEST_PASSWORD } | ConvertTo-Json)
$Token = $Login.access_token

# KPI summary — harus mengandung replyRatePerBusdev (Round 2)
Invoke-RestMethod -Uri 'https://nexerp.id/api/crm/kpi/summary' -Headers @{ Authorization = "Bearer $Token" } |
  Select-Object leadsToday, leadsThisWeek, replyRate, avgFirstResponseMinutes, @{n='busdevRows';e={$_.replyRatePerBusdev.Count}}
# Expected: busdevRows >= 2 (jumlah active busdevs)

# Per-busdev reply rate detail
Invoke-RestMethod -Uri 'https://nexerp.id/api/crm/kpi/summary' -Headers @{ Authorization = "Bearer $Token" } |
  Select-Object -ExpandProperty replyRatePerBusdev
# Expected: array of {busdevId, busdevName, totalLeads, repliedLeads, replyRatePct, ...}
```

### D.3. Status migrasi

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec production-light-backend-1 npx prisma migrate status 2>&1 | grep -E 'omnicrm|2026'"
# Expected: 20260911225751_omnicrm_foundation marked as applied.
```

### D.4. DB state check via SQL

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database < tmp/omnicrm-final-check.sql"
# Expected baseline (no QA rows):
#   qa_leads=0
#   qa_guestbook_events=0
#   qa_lead_audits=0
#   omnicrm_foundation_migration=1
#   active_busdevs>=2
#   total_assigned_leads>=0 (depends on real lead ingest)
#   leads_with_first_outbound>=0 (depends on real busdev replies)
#   leads_with_assignment>=0 (depends on real ingest activity)
#   assign_auto_actions>=0 (depends on real ingest activity)
```

### D.5. Mgmt-task regression guard (smoke that other modules still work)

```powershell
start https://nexerp.id/marketing/management-task/overview
# Expected: lands on /marketing/management-task/{aurel|revi|...} (NOT /overview which is 404)
```

## E. Diagnosis cepat berdasarkan gejala

### HMAC webhook return 401 "Server not configured"

Backend `LEAD_SVC_INGEST_SECRET` env belum diset. Tambahkan ke `.env` dan recreate container backend:

```bash
echo "LEAD_SVC_INGEST_SECRET=$(openssl rand -hex 32)" >> /home/dreamlab/nexerp/backend/.env
cd /home/dreamlab/nexerp
sudo docker compose -p production-light up -d --build backend
```

Setelah env berubah, terapkan secret yang sama ke lead-svc-deploy (`C:\GAWE\Web Dev\Porto Aureon\CRAWL WEBSITE DREAMLAB\lead-svc-deploy\.env`).

### HMAC webhook return 401 "INVALID_SIGNATURE"

Secret di backend dan lead-svc-deploy tidak cocok. Verifikasi:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec production-light-backend-1 printenv LEAD_SVC_INGEST_SECRET | head -c 16"
# Bandingkan dengan nilai di lead-svc-deploy/.env
```

### `firstOutboundAt` tetap null setelah reply

Round 2 BUG #2 fix belum ter-deploy, atau deploy gagal di-roll ke production. Verifikasi commit HEAD di production:

```bash
ssh dreamlab@103.93.134.215 "cd /home/dreamlab/nexerp && git log --oneline -5"
# Expected: 59c4d3a atau lebih baru (commit yang berisi POST /crm/leads/:id/reply)
```

### Auto-assign tidak jalan (semua leads `assignedToId = null`)

Round-robin service tidak menemukan busdev aktif. Cek:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database -c 'SELECT name, user_id, is_active, total_leads FROM bussdev_staff;'"
# Expected: minimal 2 rows dengan is_active = true
```

### KPI `replyRatePerBusdev` kosong padahal ada leads

Backend mungkin masih build lama tanpa commit `9496d16`. Verifikasi:

```bash
ssh dreamlab@103.93.134.215 "cd /home/dreamlab/nexerp && grep -l 'replyRatePerBusdev' backend/src/modules/crm/kpi/kpi.service.ts"
# Expected: prints the path. If empty → rebuild backend.
```

### Sidebar menampilkan entry `/samples/omni-crm` (404)

Commit `ec6caed` belum ter-deploy. Verifikasi:

```bash
ssh dreamlab@103.93.134.215 "grep -c 'samples/omni-crm' /home/dreamlab/nexerp/frontend/src/components/layout/Sidebar.tsx"
# Expected: 0 (kalau 1+ → cleanup belum ter-deploy)
```

### Halaman OmniCRM 500 di production

Periksa urutan ini:

1. DevTools Console untuk `pageerror` — cek apakah ada error dari hydration mismatch.
2. Network request ke `/api/crm/*` harus HTTP 200 (bukan 502/504).
3. Backend logs untuk error terbaru:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker logs production-light-backend-1 --tail 100 2>&1 | grep -E 'crm|omnicrm|Error'"
```

4. Frontend logs (jika ada Next.js runtime error):

```powershell
ssh dreamlab@103.93.134.215 "sudo docker logs production-light-frontend-1 --tail 50 2>&1"
```

### Error 403 di Console untuk endpoint CRM

Roles tidak sesuai. Verifikasi roles user:

```powershell
$Login = Invoke-RestMethod -Method Post -Uri 'https://nexerp.id/api/auth/login' `
  -ContentType 'application/json' `
  -Body (@{ email = 'revita@nexerp.id'; password = $env:PROD_TEST_PASSWORD } | ConvertTo-Json)
$Login.user.roles
# Expected minimal: ["MARKETING"] atau ["SUPER_ADMIN"]
```

## F. Recovery SSH Biznet NEO Lite

Jika website hidup tetapi SSH timeout:

1. Buka Biznet Portal → NEO Lite → Server → DREAMLAB → Overview.
2. Pastikan Power State `Running`.
3. Klik **Open Console** dan login sendiri. Jangan membagikan password console.
4. Jalankan:

```bash
sudo systemctl restart ssh
sudo systemctl enable ssh
sudo systemctl status ssh --no-pager
sudo ss -lntp | grep ':22'
```

Jika console menampilkan `System restart required`, gunakan **Restart**, bukan Rebuild atau Delete.

NEO Lite tanpa Security Group secara default allow-all. Jika membuat Security Group baru, default inbound-nya DROP. Sebelum attach, wajib tambahkan:

| Protocol | Port | Source | Action |
| --- | ---: | --- | --- |
| TCP | 80 | `0.0.0.0/0` | ACCEPT |
| TCP | 443 | `0.0.0.0/0` | ACCEPT |
| TCP | 22 | IP admin `/32` | ACCEPT |

Jangan attach Security Group yang hanya membuka port 22 karena website akan mati. Jika terlanjur, detach Security Group untuk kembali ke jaringan default; jangan delete VM.

## G. Rollback frontend

Daftar image/tag yang tersedia:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker image ls production-light-frontend --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}'"
```

Pilih tag terakhir yang diketahui sehat, lalu jadikan `latest` dan recreate hanya frontend:

```powershell
$RollbackTag = 'production-light-frontend:TAG_YANG_DIKETAHUI_SEHAT'
ssh dreamlab@103.93.134.215 "sudo docker tag $RollbackTag production-light-frontend:latest"
ssh dreamlab@103.93.134.215 "cd /home/dreamlab/nexerp && sudo docker compose -p production-light up -d --no-deps frontend"
```

Setelah rollback, ulangi health check, tes CRUD, dan browser matrix. Rollback belum dianggap selesai hanya karena container berhasil start.

### Rollback OmniCRM-specific

Untuk Round 2 saja (commit e9f3082 sampai ec6caed), revert UI saja:

```bash
cd /home/dreamlab/nexerp
git revert ec6caed 795d272 966477a aaf75fe  # frontend-only commits
sudo docker compose -p production-light up -d --build frontend
```

Backend commits (e9f3082 reply endpoint, 18b7373 round-robin, 9496d16 per-busdev KPI) bersifat aditif dan aman untuk tetap aktif.

## Checklist selesai

- [ ] Build lokal lulus.
- [ ] File production dibackup.
- [ ] Hanya frontend yang direcreate (atau backend+frontend jika ada migrasi baru).
- [ ] Frontend/backend/database healthy.
- [ ] Domain merespons HTTP 200.
- [ ] `omnicrm-ui-crud.spec.ts` lulus tanpa 4xx/5xx tak terduga.
- [ ] `omnicrm-browser-matrix.spec.ts` lulus di chromium, firefox, webkit.
- [ ] `omnicrm-round2-features.spec.ts` lulus (BUG #2 idempotency + BUG #8 auto-assign + D.8 reply rate).
- [ ] (Opsional) `omnicrm-hmac-negative.spec.ts` 5/5 lulus.
- [ ] (Opsional) `omnicrm-rbac-matrix.spec.ts` lulus untuk role MARKETING.
- [ ] `CLEANUP_CMD` dijalankan — `qa_leads=0` di `omnicrm-final-check.sql`.
- [ ] HMAC secret tetap valid di backend dan lead-svc-deploy.
- [ ] `/api/crm/kpi/summary` mengembalikan `replyRatePerBusdev` non-empty.
- [ ] Mgmt-task masih hidup (regression guard).
- [ ] Password dan HMAC secret dihapus dari environment PowerShell.

## Referensi silang

- **Management Task runbook**: `docs/RUNBOOK-DEPLOY-DAN-TEST-NEXERP.md`
- **OmniCRM deploy + curl smoke (D.1–D.12)**: `docs/marketing/OMNICRM-DEPLOY.md`
- **Round 2 QA gate**: `docs/QA_GATE.md` (Gate Report 2026-09-13 — OmniCRM Round 2)
- **Spec files**: `tmp/omnicrm-*.spec.ts` + `tmp/playwright.production-smoke.config.ts`
- **SQL scripts**: `tmp/omnicrm-final-check.sql` (state check), `tmp/reset-omnicrm-qa.sql` (cleanup)
- **Backend HMAC reference**: `backend/src/modules/crm/common/hmac.ts`
- **Lead-svc-deploy wiring**: `docs/marketing/OMNICRM-DEPLOY.md` §B
