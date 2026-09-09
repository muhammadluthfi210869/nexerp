# Runbook Deploy Cepat dan Testing Production NexERP

Dokumen ini adalah satu-satunya panduan ringkas untuk melakukan deploy frontend NexERP dengan cepat dan menguji Management Task secara akurat. Jangan menyimpan password, private key, token, atau OTP di file ini maupun di Git.

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
| Akun tes manager | `revita@nexerp.id` |

## Prinsip aman

1. Untuk perubahan UI, deploy hanya service `frontend`. Jangan rebuild atau restart backend/database.
2. Selalu backup file production sebelum ditimpa.
3. Jalankan build lokal dahulu. Jangan deploy jika build gagal karena perubahan yang sedang dikerjakan.
4. Task QA harus menggunakan awalan `[QA-AUTO]` dan selalu dihapus pada blok cleanup.
5. Jangan menjalankan penghapusan massal database untuk testing rutin.
6. Jangan menyuruh pengguna menghapus cache atau berganti browser sebelum request, console error, dan response API diperiksa.

## A. Pemeriksaan sebelum deploy

Buka PowerShell di workspace:

```powershell
Set-Location 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'
```

Pastikan file yang akan dikirim memang berisi perubahan yang diharapkan:

```powershell
git diff --check -- 'frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskBoard.tsx'
git diff -- 'frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskBoard.tsx'
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

Semua container utama harus `healthy`. Jika SSH timeout, lihat bagian **Recovery SSH Biznet**.

## B. Deploy frontend tercepat

Contoh berikut mengirim hanya file Management Task. Sesuaikan `$LocalFile` dan `$RemoteFile` jika file yang berubah berbeda.

```powershell
$Workspace = 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'
$Server = 'dreamlab@103.93.134.215'
$RemoteRoot = '/home/dreamlab/nexerp'
$LocalFile = Join-Path $Workspace 'frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskBoard.tsx'
$RemoteFile = 'frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskBoard.tsx'
$DeployStamp = Get-Date -Format 'yyyyMMdd-HHmmss'

scp $LocalFile "${Server}:/tmp/ManagementTaskBoard.tsx"

$PrepareRemote = "cd $RemoteRoot && cp '$RemoteFile' '/home/dreamlab/backups/ManagementTaskBoard-$DeployStamp.tsx' && cp /tmp/ManagementTaskBoard.tsx '$RemoteFile'"
ssh $Server $PrepareRemote
```

Build hanya frontend:

```powershell
ssh $Server "cd $RemoteRoot && sudo docker compose build frontend"
```

Perhatikan nama image. Build dari direktori `nexerp` menghasilkan `nexerp-frontend:latest`, sedangkan project production memakai `production-light-frontend:latest`. Tag image sebelum mengganti container:

```powershell
ssh $Server "sudo docker tag nexerp-frontend:latest production-light-frontend:deploy-$DeployStamp && sudo docker tag nexerp-frontend:latest production-light-frontend:latest"
ssh $Server "cd $RemoteRoot && sudo docker compose -p production-light up -d --no-deps frontend"
```

`--no-deps` penting agar backend dan database tidak ikut direcreate.

Tunggu frontend healthy dan reload Nginx:

```powershell
Start-Sleep -Seconds 6
ssh $Server "sudo docker inspect -f '{{.State.Health.Status}}' production-light-frontend-1"
ssh $Server "sudo docker exec production-light-nginx-1 nginx -s reload"
```

Hasil yang diharapkan adalah `healthy`.

### Emergency build override

Gunakan `tmp/next.config.production-hotfix.ts` hanya jika build server tertahan error TypeScript lama yang tidak terkait perubahan, sementara build fokus sudah diverifikasi. Backup dan pulihkan konfigurasi asli:

```powershell
scp (Join-Path $Workspace 'tmp/next.config.production-hotfix.ts') "${Server}:/tmp/next.config.production-hotfix.ts"
ssh $Server "cd $RemoteRoot && cp frontend/next.config.ts /tmp/next.config.ts.original && cp /tmp/next.config.production-hotfix.ts frontend/next.config.ts"
ssh $Server "cd $RemoteRoot && sudo docker compose build frontend"
ssh $Server "cd $RemoteRoot && cp /tmp/next.config.ts.original frontend/next.config.ts"
```

Jangan meninggalkan `ignoreBuildErrors` sebagai konfigurasi permanen.

## C. Login dan testing yang akurat

### Menyediakan password tanpa menuliskannya

Masukkan password melalui prompt masked. Nilainya hanya hidup selama sesi PowerShell:

```powershell
$env:PROD_TEST_PASSWORD = Read-Host 'Password akun test NexERP' -MaskInput
```

Jangan menaruh password langsung di command, test file, `.env` yang di-commit, screenshot, atau dokumentasi.

### Login manual

1. Buka `https://nexerp.id/login`.
2. Isi **Corporate Email** dengan `revita@nexerp.id`.
3. Isi **Secret Key** menggunakan password production.
4. Klik **Initialize Session**.
5. Pastikan request login menuju `https://nexerp.id/api/auth/login`, bukan `localhost:3002`.
6. Buka `https://nexerp.id/marketing/management-task/overview`.

### Tes otomatis CRUD dan Quick Add

Test ini memeriksa:

- login Revita;
- membuka Management Task;
- create melalui drawer tanpa response 400;
- task Revita untuk Zarkasi terlihat pada board Zarkasi;
- update dan delete;
- Quick Add;
- empat grup status tetap tampil;
- cleanup task QA.

```powershell
npx playwright test 'tmp/management-task-ui-crud.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts' `
  --project='Chromium-1366x768'
```

Hasil yang wajib: `1 passed`.

### Simulasi laptop/browser lain

```powershell
npx playwright test 'tmp/management-task-browser-matrix.spec.ts' `
  --config='tmp/playwright.production-smoke.config.ts'
```

Test matrix menjalankan sesi browser baru di Chromium, Firefox, dan WebKit/Safari, memberi latency tambahan untuk menangkap race condition, serta memastikan:

- login berhasil;
- tidak ada request ke localhost;
- bundle Management Task menerima HTTP 200;
- tidak ada error runtime Management Task;
- empat grup `Not started`, `Working on it`, `Revision`, dan `Done` tetap terlihat meskipun kosong.

Hasil yang wajib: seluruh project `passed`.

Hapus password dari environment setelah tes:

```powershell
Remove-Item Env:PROD_TEST_PASSWORD -ErrorAction SilentlyContinue
```

## D. Verifikasi API dan database

Status HTTP dasar:

```powershell
curl.exe -I https://nexerp.id
```

Audit jumlah record langsung dari database:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker exec production-light-db-1 psql -U erp_user -d erp_database -Atc 'SELECT (SELECT count(*) FROM marketing_tasks),(SELECT count(*) FROM marketing_projects),(SELECT count(*) FROM marketing_task_histories),(SELECT count(*) FROM marketing_task_comments),(SELECT count(*) FROM marketing_task_attachments);'"
```

Untuk kondisi reset total, hasil yang diharapkan:

```text
0|0|0|0|0
```

Periksa kembali health:

```powershell
ssh dreamlab@103.93.134.215 "sudo docker ps --format '{{.Names}} {{.Status}} {{.Image}}' | grep production-light-"
```

## E. Diagnosis cepat berdasarkan gejala

### `ERR_CONNECTION_REFUSED localhost:3002/auth/login`

Frontend production ter-build dengan URL development. Production harus menggunakan same-origin `/api` atau `https://nexerp.id/api`. Rebuild frontend setelah memastikan konfigurasi `NEXT_PUBLIC_API_URL` benar.

### Create task HTTP 400

Jangan kirim seluruh objek UI ke API. Payload create/update hanya boleh berisi field DTO. Hindari field UI seperti `history`, ID `local-*`, serta URL kosong. Tangkap body response 400 karena validator biasanya menyebut field yang salah.

### `Cannot read properties of null (reading 'trim')`

Backend dapat mengembalikan `project: null`. Normalisasikan menjadi `""` sebelum memanggil `.trim()` atau menaruhnya dalam draft form.

### Halaman kosong atau `System Interrupt`

Periksa berurutan:

1. DevTools Console untuk `pageerror`.
2. Network request `/api/marketing/prototype/bundle` harus HTTP 200.
3. Pastikan response bukan halaman login/HTML.
4. Uji menggunakan fresh browser context lewat test matrix.
5. Jangan menyimpulkan masalah cache jika fresh context juga gagal.

### Error 403 di Console

Catat URL-nya. Response 403 dari `/api/executive/alerts` atau `/api/executive/metrics` saat redirect awal berasal dari izin Executive Dashboard dan bukan kegagalan Management Task. Endpoint `/api/marketing/prototype/*` tetap harus bebas dari response gagal.

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

## Checklist selesai

- [ ] Build lokal lulus.
- [ ] File production dibackup.
- [ ] Hanya frontend yang direcreate.
- [ ] Frontend/backend/database healthy.
- [ ] Domain merespons HTTP 200.
- [ ] UI CRUD lulus tanpa 400.
- [ ] Quick Add lulus.
- [ ] View lintas akun lulus.
- [ ] Empat grup status tetap tampil saat kosong.
- [ ] Chromium, Firefox, dan WebKit lulus.
- [ ] Task QA terhapus.
- [ ] Jumlah database sesuai kondisi yang diharapkan.
- [ ] Password test dihapus dari environment.
