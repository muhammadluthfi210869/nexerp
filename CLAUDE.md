# ERP FROM ZERO - Project Guide

## 📚 Navigation
- [ARCHITECTURE.md](ARCHITECTURE.md) — topologi 1 branch + deploy stack (GHCR)
- [DEPLOY.md](DEPLOY.md) — alur deploy/rollback dari VPS
- [RUNBOOK.md](RUNBOOK.md) — incident response (P0/P1/P2)
- [docs/INDEX.md](docs/INDEX.md) — navigasi dokumen lengkap
- [docs/RUNBOOK-DEPLOY-NEXERP-V2.md](docs/RUNBOOK-DEPLOY-NEXERP-V2.md) — SOP emas anti-ghost-rollback

## ⛩️ QA GATE — ATURAN WAJIB (BACA SETIAP SESI)

**Jangan pernah menyatakan fitur "selesai" / "siap dikirim" sebelum seluruh gerbang
kualitas dijalankan** dan laporan gate ditulis di `docs/qa-gate/YYYY-MM-DD-<topik>.md`
(lihat contoh laporan yang sudah ada). Gate minimal: build backend+frontend tanpa
error baru → CI (`scripts/test-deploy.sh`) hijau → smoke test live → rollback
teruji. Kalau ada satu item "belum jelas", jawab: "BELUM SIAP KIRIM" — jangan
bilang selesai.

**Aturan regresi (wajib):** setiap bug → tulis test reproduksi yang GAGAL dulu →
baru fix → seluruh suite hijau. Tanpa itu, jangan claim bug sudah dibenerin.
Suite test shell: `bash scripts/__tests__/run-all.sh`.

## 🏗 System Overview
- **Backend**: NestJS + Prisma (PostgreSQL 15) — `backend/`, 36 modul aktif
- **Frontend**: Next.js (standalone) + Lucide Icons + Tailwind — `frontend/`
  (BUKAN `dashboard/`; `dashboard/src/views` di dokumen lama adalah sisa sejarah)
- **Design DNA**: "Binary Audit Vision" v7.0 (Dark mode, glassmorphism, premium UI)

## 🚀 ATURAN DEPLOY (SINGLE SOURCE OF TRUTH)
- **SATU branch production: `main`.** Satu domain live: `https://nexerp.id`.
  Branch `production-light` sudah DIARSIPKAN (2026-09) — JANGAN pernah deploy
  branch lain, JANGAN pernah cherry-pick antar-branch production.
- Alur: feature branch → PR → CI build+test → merge `main` → CI push image ke
  GHCR → `ssh dreamlab@103.93.134.215` → `bash scripts/deploy.sh <sha>`.
- VPS TIDAK PERNAH build Docker (RAM 4GB). Semua build di GitHub Actions.
- Rollback: `bash scripts/rollback.sh <sha>` (image per-SHA abadi di GHCR).

## 🛑 Anti-Looping Protocols
1. **Context Check**: Selalu list directory (`ls`/`dir`) dan baca file terkait SEBELUM edit.
2. **One Change at a Time**: Selesaikan satu blok logis sebelum pindah.
3. **Verify After Write**: Konfirmasi perubahan dengan `grep`/read dan pastikan tidak ada syntax error.
4. **Three-Strike Rule**: Jika error masih ada setelah 3 percobaan, STOP dan tanya user.
5. **No Blind Deletes**: Jangan hapus data/blok code besar tanpa verifikasi pemakaian di seluruh workspace.

## 💻 Tech Stack Specifics
- **Backend Modules**: `backend/src/modules/` (Commercial, Legal, rnd, scm, marketing, lead-capture, wa-webhook, dst.)
- **Frontend Routes**: `frontend/src/app/(dashboard)/` (marketing/, digital/, samples/, penjualan/, rnd/, dst.)
- **Database**: Prisma multi-file schema di `backend/prisma/schema/` (19 file); skema live diterapkan via `prisma db push` (bukan migrate).

## 🛠 Command Shortcuts
- `npm run dev` di `frontend/` untuk UI dev.
- `npm run start:dev` di `backend/` untuk NestJS.
- `npx prisma studio` (di `backend/`) untuk viewer database.
- `docker compose up --build` untuk stack lokal penuh (compose yang sama dengan server).
