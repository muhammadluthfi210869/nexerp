# ERP Production Readiness Audit — Charter F0

**Status:** F0 selesai. Menunggu approval untuk menjalankan F1.
**Model deployment:** Single-tenant, 1 client, deploy via GitHub CI ke server.
**Tanggal:** 2026-10-01

---

## 1. Objek yang Diaudit (Audit Target)

| | |
|---|---|
| Branch | `feat/p08-contracts-subject-ownership` |
| HEAD | `b561dffe` |
| Ahead of `origin/main` | 90 commits |
| **Dirty files (backend/ + frontend/)** | **633** |
| Total dirty (seluruh repo) | 970 |
| Untracked di `backend/src` | ~20 direktori/file baru |

**Ketidaksonsistenan yang harus dicatat di laporan client:**
Sistem yang diaudit = working tree pada SHA di atas.
Sistem yang bisa dideploy = commit `b561dffe`.
Keduanya berbeda 633 file. **Tidak ada commit yang mereproduksi apa yang diaudit.**
Ini adalah temuan D8-001 (severity CRITICAL), bukan sekadar catatan administratif.

Aturan: semua temuan wajib menyebut file + status git-nya (`M` modified / `??` untracked /bersih)
agar bisa dipetakan ke commit nanti.

---

## 2. Skala Severity

| Kode | Arti | Contoh |
|---|---|---|
| `BLOCKER` | Salah = kerugian finansial/legal. Tidak boleh lolos ke client. | uang hilang, saldo tidak balance, data client bocor |
| `CRITICAL` | Sistem akan gagal saat dipakai karyawan dalam operasi nyata. | error tidak tertangani, layar putih, deploy tidak bisa rollback |
| `MAJOR` | Dentri worsWA yang lambat tapi tidak merusak. | file giant, duplikasi route, test missing |
| `MINOR` | Kebersihan. | naming, dead code |

## 3. Tingkat Keyakinan

| Kode | Arti |
|---|---|
| `TERBUKTI` | Ada bukti eksekutabel: file:line + perintah repro yang bisa dijalankan |
| `DIDUGA` | Pattern terlihat mencurigakan tapi belum diuji. **Wajib diverifikasi F3.** |

Aturan keras: agent **tidak** boleh menerbitkan temuan `TERBUKTI` tanpa perintah repro.
Temuan tanpa repro = `DIDUGA`, dan masuk daftar yang harus diuji F3.

## 4. Format output tiap agent (WAJIB)

```
### [D#-NNN] judul ringkas
- Severity:    BLOCKER | CRITICAL | MAJOR | MINOR
- Confidence:  TERBUKTI | DIDUGA
- Lokasi:      path/file.ts:LINE  (git: M / ?? / clean)
- Bukti:       1-3 kalimat, facts only
- Repro:       satu perintah shell yang bisa dijalankan
- Dampak ke client: 1 kalimat
```

Dilarang: kata "kemungkinan besar", "sepertinya", "idealnya", paragraf panjang,
dan laporan naratif tanpa `file:line`.

---

## 5. Delapan Domain + Gate Biner

| # | Domain | Gate "LOLOS" (binary) |
|---|--------|----------------------|
| D1 | Integritas Keuangan | Trial balance = P&L = buku besar, selisih **IDR 0,00**. Semua kode COA yang dipakai kode ada di master. Tidak ada pembulatan yang tidak terdokumentasi. |
| D2 | Data & Database | Migrasi punya jalur `down` yang teruji. Restore drill terbukti berhasil. 0 data loss. |
| D3 | Security & Akses | 0 endpoint tanpa guard yang tidak disengaja. Tidak ada secret di source. Secret rotation punya prosedur. |
| D4 | Kebenaran & Reliabilitas | Semua operasi uang multi-tabel dalam `$transaction`. Semua write path punya idempotency. 0 silent-catch. |
| D5 | UX & Kenyamanan | 100% route punya loading + error + empty state. Tugas inti ≤ 3 klik. WCAG 2.2 AA. p95 < 2 detik. |
| D6 | Maintainability | 100% file dalam batas ukuran. Coverage ≥ 70% pada logika uang. **Gate tidak bisa keluar 0 palsu.** |
| D7 | Operability | Health/readiness/liveness. Log terstruktur + correlation ID. Alert untuk kegagalan kritis. Runbook tertulis. |
| D8 | Evidence & Hand-over | Traceability requirement→test→evidence. Green CI di commit yang sama dengan yang dideploy. |

**Skor:** tertimbang per domain, total 100. Status RAG.
**Verdict 3 tingkat:** `PILOT` → `PRODUKSI TERBATAS` → `PENUHAN`

## 6. Executor Model

| Fase | Sifat | Jumlah agent |
|------|-------|--------------|
| F0 Charter | serial | — (dokumen ini) |
| **F1 Audit statis** | ✅ paralel penuh | 8 (1 per domain) |
| **F2 Audit mendalam** | ⚠️ paralel terbatas | 5–6, butuh kontrak D1 dulu |
| **F3 Verifikasi dinamis** | ❌ **strictly serial** | 1 — 1 DB, 1 server, 1 browser |
| F4 Remediasi | serial | — |
| F5 Re-audit & sertifikat | serial | — |

Aturan pembatas (dari audit sebelumnya yang gagal):
1. **Pin SHA** — semua agent mengukur state yang sama
2. **Agent laporkan temuan, bukan vonis** — wajib `file:line` + repro
3. **Setiap BLOCKER/CRITICAL didebang agent lain** yang tugasnya mencari bukti bahwa temuan itu SALAH

## 7. Fakta Baseline yang Sudah Terukur (F1 pre-scan)

Sudah diukur manual sebelum agent dilepas. Agent **wajib konfirmasi atau refute**, tidak boleh
menerima begitu saja. Ini hemat token.

| Metrik | Nilai | Batas CLAUDE.md | Status |
|--------|-------|-----------------|--------|
| Prisma model / enum | 211 / 93 (25 file schema) | — | baseline |
| Migration | 57 | — | baseline |
| Money field bertipe `Float` | **0** (semua `Decimal`, 26 field) | — | ✅ bagus |
| Kolom `organizationId`/`tenantId` | 25 dari 211 model | — | ⚠️ parsial, single-tenant |
| `model Organization` | **tidak ada** | — | ⚠️ single-tenant, turun prioritas |
| `page.tsx` > 120 baris | **196 dari 275** (71%) | < 120 | ❌ gagal |
| Service terbesar | 1318 baris (`lead-ingestion.service.ts`) | < 300 | ❌ gagal |
| Controller tanpa `@UseGuards` | 5 dari 113 (950 endpoint) | semua | perlu klarifikasi |
| `helmet`/csrf/rateLimit | 6 hit | — | perlu klarifikasi |
| `loading.tsx` / `error.tsx` | **0 / 0** | — | ❌ gagal |
| File dengan raw HTML JSX | 779 | DNA | ❌ gagal |
| Test backend | 71 spec / 632 file (11%) | — | ⚠️ lemah |
| Test frontend | 89 | — | ⚠️ lemah |
| `$transaction` | tersedia | — | perlu hitung pemakaian |
| Raw SQL `$queryRaw` | 14 | — | perlu review |
| TODO/FIXME/HACK | 43 | — | perlu review |
| Deploy produksi | 102 commit di belakang HEAD | — | ❌ gagal |

## 8. Artefak yang akan dihasilkan

```
docs/audit-readiness/
  00-CHARTER.md              ← dokumen ini
  01-baseline.md             ← hasil F1, terukur
  02-risk-register.md        ← temuan F1+F2 dengan severity
  03-gap-analysis.md         ← selisih vs gate, per domain
  04-client-report.md        ← laporan yang dikirim ke client
  05-remediation-plan.md     ← urutan perbaikan + effort
  06-certification.md        ← hasil F5, verdict final
```
