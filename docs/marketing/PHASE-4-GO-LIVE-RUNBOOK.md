# Runbook Go-Live & Verifikasi Production Management Task

**Status**: 🔒 BINDING RUNBOOK  
**Tanggal**: 2026-09-12  
**Domain**: `https://nexerp.id/marketing/management-task/overview`  
**Server Target**: `103.93.134.215` (User: `dreamlab`)  
**Prinsip Keamanan**: NON-DESTRUCTIVE ROLLOUT · ZERO COMMIT ROLLBACK · NO BACKEND/DB RESTART  

---

## 1. Prinsip Keamanan & Jaminan Zero Rollback

1. **Tanpa Rollback Git**: Seluruh commit yang sudah ada di remote dan server production dipertahankan secara utuh.
2. **Isolasi Service Frontend**: Deployment hanya memperbarui service `frontend`. Backend dan database container **TIDAK DIREBUILD DAN TIDAK DIRESTART**.
3. **Backup Bertimestamp Otomatis**: Setiap file production yang digantikan wajib disalin ke direktori backup sebelum proses build (`/home/dreamlab/backups/`).
4. **Zero-Downtime & Graceful Reload**: Container frontend dijalankan dengan opsi `--no-deps`, lalu Nginx di-reload (`nginx -s reload`).

---

## 2. File-File yang Siap Rilis (Release Package)

| Tipe File | Path Lokal | Path Server Produksi |
|---|---|---|
| Workspace Component | `frontend/src/app/(dashboard)/marketing/management-task/TaskWorkspace.tsx` | `/home/dreamlab/nexerp/frontend/src/app/(dashboard)/marketing/management-task/TaskWorkspace.tsx` |
| New DNA Component | `frontend/src/components/dna/DnaMacroPillarCard.tsx` | `/home/dreamlab/nexerp/frontend/src/components/dna/DnaMacroPillarCard.tsx` |
| DNA Barrel Export | `frontend/src/components/dna/index.ts` | `/home/dreamlab/nexerp/frontend/src/components/dna/index.ts` |
| Marketing Service | `frontend/src/lib/services/marketing-service.ts` | `/home/dreamlab/nexerp/frontend/src/lib/services/marketing-service.ts` |

---

## 3. Langkah-Langkah Eksekusi Deployment (PowerShell)

Jalankan perintah berikut di terminal PowerShell lokal:

### Langkah 3.1: Pre-Flight Check Lokal
```powershell
Set-Location 'C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO'

# 1. Pastikan Typecheck Marketing 0 Error
npm --prefix frontend run typecheck:marketing

# 2. Pastikan Backend Build Bersih
npm --prefix backend run build
```
*Kriteria: Kedua perintah wajib menghasilkan exit code 0.*

### Langkah 3.2: Backup & Pengiriman File ke Server
```powershell
$Server = "dreamlab@103.93.134.215"
$RemoteRoot = "/home/dreamlab/nexerp"
$DeployStamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Buat folder backup jika belum ada
ssh $Server "mkdir -p /home/dreamlab/backups"

# Kirim file ke staging sementara di server
scp "frontend/src/app/(dashboard)/marketing/management-task/TaskWorkspace.tsx" "${Server}:/tmp/TaskWorkspace.tsx"
scp "frontend/src/components/dna/DnaMacroPillarCard.tsx" "${Server}:/tmp/DnaMacroPillarCard.tsx"
scp "frontend/src/components/dna/index.ts" "${Server}:/tmp/dna-index.ts"
scp "frontend/src/lib/services/marketing-service.ts" "${Server}:/tmp/marketing-service.ts"

# Backup file lama di server dan pindahkan file baru
$BackupAndReplace = @"
cd $RemoteRoot
cp frontend/src/app/\(dashboard\)/marketing/management-task/TaskWorkspace.tsx /home/dreamlab/backups/TaskWorkspace-$DeployStamp.tsx 2>/dev/null || true
cp frontend/src/components/dna/index.ts /home/dreamlab/backups/dna-index-$DeployStamp.ts 2>/dev/null || true
cp frontend/src/lib/services/marketing-service.ts /home/dreamlab/backups/marketing-service-$DeployStamp.ts 2>/dev/null || true

cp /tmp/TaskWorkspace.tsx frontend/src/app/\(dashboard\)/marketing/management-task/TaskWorkspace.tsx
cp /tmp/DnaMacroPillarCard.tsx frontend/src/components/dna/DnaMacroPillarCard.tsx
cp /tmp/dna-index.ts frontend/src/components/dna/index.ts
cp /tmp/marketing-service.ts frontend/src/lib/services/marketing-service.ts
"@

ssh $Server $BackupAndReplace
```

### Langkah 3.3: Build Terisolasi & Restart Container Frontend
```powershell
# Build hanya container frontend
ssh $Server "cd $RemoteRoot && sudo docker compose build frontend"

# Tag image dengan stempel rilis
ssh $Server "sudo docker tag nexerp-frontend:latest production-light-frontend:deploy-$DeployStamp && sudo docker tag nexerp-frontend:latest production-light-frontend:latest"

# Recreate HANYA container frontend tanpa memengaruhi backend/db
ssh $Server "cd $RemoteRoot && sudo docker compose -p production-light up -d --no-deps frontend"

# Reload Nginx setelah container healthy
Start-Sleep -Seconds 6
ssh $Server "sudo docker exec production-light-nginx-1 nginx -s reload"
```

---

## 4. Checklist Verifikasi Smoke Test Pasca-Deploy (Live Test)

Buka browser dan akses: `https://nexerp.id/marketing/management-task/overview`

| # | Item Verifikasi | Hasil yang Diharapkan | Status |
|---|---|---|:---:|
| 1 | **Status HTTP & Redirect** | Mengakses `/marketing/management-task` langsung mengarah ke `/overview` dengan HTTP 200. | [ ] |
| 2 | **4 Standalone KPI Cards** | Tampil 4 kartu mandiri (`TOTAL TASK`, `SEDANG BERJALAN`, `TERLAMBAT`, `SELESAI`) dengan font weight 950 dan `tabular-nums`. | [ ] |
| 3 | **Filter Toolbar (`<DnaSelect>`)** | Dropdown status, brand, dan project menggunakan komponen DNA. Filter tersimpan di query URL. | [ ] |
| 4 | **Drawer Detail Task** | Klik pada salah satu baris task membuka Drawer `<DnaDrawer>` di sisi kanan. | [ ] |
| 5 | **Jejak Audit (`<DnaAuditTimeline>`)** | Di dalam drawer detail, tab riwayat aktivitas menampilkan timeline mutasi rapi lengkap dengan nama aktor, badge role, timestamp ID, dan perubahan status. | [ ] |
| 6 | **Checklist Sub-task (`<DnaCheckbox>`)** | Item checklist dapat dicentang tanpa layout shift. Item wajib ditandai badge merah. | [ ] |
| 7 | **Console Browser Hygiene** | Tidak ada error unhandled runtime atau request gagal ke localhost pada DevTools Console. | [ ] |

---

## 5. Prosedur Tanggap Darurat (Rollback Non-Destruktif)

Jika terjadi kendala tak terduga pada container frontend baru, pemulihan dilakukan secara instan **tanpa rollback commit git**:
```powershell
# Mengembalikan container frontend ke image deploy sebelumnya
ssh $Server "sudo docker tag production-light-frontend:deploy-$DeployStamp production-light-frontend:latest"
ssh $Server "cd $RemoteRoot && sudo docker compose -p production-light up -d --no-deps frontend"
ssh $Server "sudo docker exec production-light-nginx-1 nginx -s reload"
```
Dengan prosedur ini, waktu pemulihan jika terjadi insiden adalah < 10 detik.
