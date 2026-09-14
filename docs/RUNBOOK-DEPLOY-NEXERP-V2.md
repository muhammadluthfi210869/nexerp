# NEXERP Enterprise Deployment Runbook (V2)
> **Status:** OFFICIAL PRODUCTION RUNBOOK (Active)  
> **Last Updated:** 2026-09-09  
> **Owner:** DevOps & SRE Team  
> **Target:** Biznet NEO Lite VPS (`103.93.134.215`) | `https://nexerp.id`

---

## 🏛️ 1. Informasi Infrastruktur Production

| Komponen | Spesifikasi & Nilai Resmi | Keterangan |
|---|---|---|
| **Domain Publik** | `https://nexerp.id` | SSL Let's Encrypt Otomatis via Nginx |
| **API Base URL** | `https://nexerp.id/api/v1` | Prefix global NestJS `v1` |
| **VPS Provider** | Biznet NEO Lite | Dedicated Linux Host |
| **IP Server VPS** | `103.93.134.215` | *Catatan: Server lama Hetzner (5.223.x.x) sudah tidak aktif* |
| **SSH User & Root** | `dreamlab@103.93.134.215` | Remote Root: `/home/dreamlab/nexerp` |
| **Compose Project** | `production-light` | Multi-container stack (Nginx, Backend, Frontend, DB) |
| **Database Engine** | PostgreSQL 15 Alpine | Volume data: `postgres_data` |
| **Backend Stack** | NestJS + Prisma ORM | Port internal: `3001` |
| **Frontend Stack** | Next.js 16 + Tailwind CSS | Port internal: `3000` (Standalone mode) |

---

## 🛑 2. Aturan Emas Anti-Ghost-Rollback (Mandatory SOP)

Untuk mencegah terjadinya regresi, bug berputar, atau perubahan yang seolah "mental balik ke versi lama":

1. 🚫 **DILARANG KERAS SCP FILE SATUAN (Single-File In-Place Edit):**  
   *Jangan pernah* meng-copy file `.tsx` atau `.ts` satu per satu ke `/tmp/` lalu menimpa server secara langsung. Praktik ini menciptakan desinkronisasi fatal antara server dan Git repository.
2. 🚫 **DILARANG MEMATIKAN TYPE CHECKER (No Build Error Hacks):**  
   *Jangan pernah* menggunakan file `next.config.production-hotfix.ts` atau mengaktifkan `ignoreBuildErrors: true`. Setiap error TypeScript lokal harus diselesaikan sebelum release.
3. 🔒 **SINGLE SOURCE OF TRUTH (Branch `main`):**  
   Seluruh rilis production **wajib berasal dari branch `main`**. Jangan mendeploy dari branch lokal eksperimental atau worktree terpisah tanpa merge ke `main`.
4. 🛡️ **AUTO PRE-DEPLOY DATABASE SNAPSHOT:**  
   Setiap kali deploy dijalankan, script secara otomatis mengambil snapshot `.sql.gz` di `/home/dreamlab/nexerp/db-backups/` sebelum migrasi Prisma menyentuh database.

---

## 🧰 3. Panduan Penggunaan Enterprise Release Toolkit

Repositori telah dilengkapi dengan 4 script otomasi PowerShell di root project:

```
├── deploy-production.ps1   # [1] One-Click Hardened Deploy
├── rollback.ps1            # [2] Emergency Instant 5-Sec Revert
├── db-ops.ps1              # [3] Database Operations & Backup Manager
└── doctor.ps1              # [4] Live System & Resource Inspector
```

---

### A. Melakukan Deploy ke Production (Standard Release)

Buka PowerShell di root workspace (`C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO`):

```powershell
# Jalankan pipeline deployment lengkap (Pre-flight check -> Backup DB -> Lean Tarball 3.2MB -> Launch -> Healthcheck):
.\deploy-production.ps1
```

**Opsi Parameter Tambahan:**
* `.\deploy-production.ps1 -SkipLocalBuild` — Melewati build lokal (hanya jika Anda baru saja build manual).
* `.\deploy-production.ps1 -SkipHealthCheck` — Melewati probe healthcheck setelah rilis.

---

### B. Emergency Instant Rollback (5 Detik)

Jika setelah deploy ditemukan bug kritis di production dan Anda butuh mengembalikan sistem ke kondisi sehat sebelumnya secara instan:

```powershell
# 1. Rollback container ke release sebelumnya (5 detik tanpa rebuild):
.\rollback.ps1

# 2. Rollback container SEKALIGUS me-restore database ke snapshot sesaat sebelum deploy:
.\rollback.ps1 -RestoreDatabase
```

---

### C. Inspeksi Kesehatan Server & Live Logs

Untuk memantau performa VPS Biznet dan mendiagnosis error tanpa perlu login SSH manual:

```powershell
# 1. Cek kesehatan umum (CPU, RAM, Disk, Status Container, Endpoint probe):
.\doctor.ps1

# 2. Live streaming log backend secara realtime:
.\doctor.ps1 -FollowLogs -Service backend

# 3. Live streaming log frontend:
.\doctor.ps1 -FollowLogs -Service frontend
```

---

### D. Operasi Database & Backup Mandiri

```powershell
# 1. Periksa status migrasi Prisma di server:
.\db-ops.ps1 status

# 2. Ambil backup PostgreSQL on-demand kapan saja:
.\db-ops.ps1 backup

# 3. Jalankan migrasi baru secara aman (otomatis backup dulu):
.\db-ops.ps1 migrate

# 4. Lihat 50 baris log database PostgreSQL:
.\db-ops.ps1 logs
```

---

## 🌿 4. Disiplin & Penataan Git Branch

Untuk menjaga repositori tetap bersih dan menghindari kode hilang saat berpindah cabang:

### Struktur Branch Standar:
* **`main`** ➔ Satu-satunya branch aktif untuk production.
* **`feature/<nama-fitur>`** ➔ Branch sementara untuk pengerjaan fitur/modul spesifik.
* **Wajib PR / Merge ke `main`** setelah fitur selesai dan teruji lokal.

### Checklist Sebelum Deploy:
- [ ] `git status` bersih (tidak ada file uncommitted atau file sampah `_backup*`).
- [ ] Berada di branch `main` (`git branch --show-current` = `main`).
- [ ] Backend & Frontend lulus build lokal (`npm run build`).
- [ ] Jalankan `.\deploy-production.ps1`.
- [ ] Verifikasi `https://nexerp.id/api/v1/system/health` mengembalikan `HTTP 200 OK`.

---

## 🆘 5. Penanganan Darurat SSH Biznet (Troubleshooting)

Jika website hidup namun SSH `dreamlab@103.93.134.215` mengalami timeout:

1. Buka Portal Biznet GIO/NEO Lite ➔ **Server: DREAMLAB** ➔ **Overview**.
2. Pastikan Status: `Running`.
3. Klik tombol **Open Console** (VNC Console).
4. Login menggunakan user `dreamlab` atau `root`.
5. Jalankan perintah pemulihan service SSH:
   ```bash
   sudo systemctl restart ssh
   sudo ss -lntp | grep ':22'
   ```
6. **Periksa Security Group:** Pastikan Port `80` (HTTP), `443` (HTTPS), dan `22` (SSH) terbuka (`ACCEPT`). Jangan pernah attach Security Group kosong karena default-nya adalah `DROP ALL`.
