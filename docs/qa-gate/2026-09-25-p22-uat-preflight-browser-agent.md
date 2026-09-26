# QA Gate — P22: UAT Pre-Flight Browser Agent (Playwright) — 2026-09-25

**Topik:** Gerbang otomatis pra-UAT. Browser agent headless menjelajah seluruh aplikasi (login
nyata → semua rute di bawah `(dashboard)` → 8 rute pilot Gudang/Pembelian + 5 rute lintas-divisi),
lalu melaporkan rute mana yang **benar-benar rusak** sebelum manusia mencobanya manual.

**Branch:** `feat/p08-contracts-subject-ownership`
**Dokumen Referensi:** `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md` (Fase 6 — Pilot UAT & Dual-Run)
**Laporan Sebelumnya:** `docs/qa-gate/2026-09-25-p21-data-migration-disaster-recovery.md`

---

## Verdict

# BELUM SIAP KIRIM

**Gerbang browser agent sendiri HIJAU dan dapat diulang** — 5 eksekusi berturut-turut hijau
(`run-clean4` … `run-clean8`), masing-masing 7/7 test, exit code 0:

| Gate | Command | Exit Code | Bukti |
|---|---|---|---|
| **Browser agent pre-flight** | `bash scripts/test-browser-agent.sh` | **0** (×5) | 7/7 passed; 264 rute di 4 shard + 8 pilot + 5 overview; 2.2–2.4 menit — `evidence/uat-preflight/run-clean{4,5,6,7,8}.log` |
| Build backend | `npm run build` (backend/) | **0** | `evidence/uat-preflight/backend-build.log` |
| Build frontend | `npm run build` (frontend/, dijalankan runner step 3) | **0** | build dipakai ulang (source tidak lebih baru dari `BUILD_ID`) |
| Backend live | `curl http://127.0.0.1:3002/v1/health` | **200** | 3.8 ms |
| Smoke test live | `bash scripts/test-deploy.sh http://127.0.0.1:3002/v1` | **0** | 6/6 passed — `evidence/uat-preflight/smoke-retry.log` |
| Suite shell regresi | `bash scripts/__tests__/run-all.sh` | **0** | PASS: 17 FAIL: 0 SKIP: 0 — `evidence/uat-preflight/shell-suite.log` |
| Fail-closed runner | runner menolak jalan bila `:3003` dipegang proses lain | **1** | 7× `server-*.log` 286 B berisi EADDRINUSE → "browser agent did NOT run" |
| Test regresi gerbang P22 | `bash scripts/__tests__/p22-uat-preflight.test.sh` | **0** (HIJAU), **1** saat penjaga okupansi dinonaktifkan (RED) | port `:3003` benar-benar ditahan server HTTP sementara; RED: `RED_EXIT=1`, `restored_ok=yes` |

Verdict tetap **BELUM SIAP KIRIM** karena:

1. **DR drill live di VPS belum dijalankan** (kriteria lulus Fase 5, `ROADMAP` baris 165).
   `scripts/dr-drill.sh` bersifat destruktif (stop stack → drop `erp_database` → restore) dan
   **belum ada otorisasi**. Klaim RTO/RPO produksi belum terbukti.
2. **Deploy drift produksi masih terbuka** — live di commit `7a449e0a`, 100+ commit di belakang
   working tree (memori `production-deploy-drift-2026-09-25`). Tidak satu pun perbaikan P07–P22
   ter-deploy.
3. **Regime kode COA masih divergen** (25 dari 33 kode COA yang direferensikan backend tidak ada di
   database; memori `coa-code-regimes-diverge`).
4. **Fase 6 (pilot UAT klien + dual-run 14 hari + Berita Acara) belum berjalan.**
5. **5 cacat produk ditemukan gerbang ini dan SENGAJA belum diperbaiki** (bagian 3). Dua di antaranya
   ada di modul pilot (Pembelian) — modul yang justru akan dipegang klien di Fase 6.
6. **Keandalan gerbang belum terbukti secara kausal.** 4 hijau terakhir mengikuti pembersihan 30
   proses Chromium yatim; akar penyebab merah sebelumnya **tidak terbukti**, hanya berkorelasi
   (bagian 1.3). Gerbang hijau tidak boleh dianggap bukti kuat sampai pola ini stabil.
7. Working tree masih ratusan file di atas HEAD; seluruh exit code di laporan ini mengukur **working
   tree**, bukan sebuah commit (memori `gate-measures-working-tree-not-commit`).

---

## 1. Gerbang Browser Agent (P22)

### 1.1 Cara menjalankan

```bash
# backend harus hidup lebih dulu (cd backend && npm run start:dev)
bash scripts/test-browser-agent.sh              # headless, gerbang utama
HEADED=1 bash scripts/test-browser-agent.sh     # lihat browsernya mengklik
bash scripts/test-browser-agent.sh -g login     # argumen tambahan diteruskan ke Playwright
```

Runner menolak jalan bila: backend tidak hidup di `:3002`/`:3001`; `NEXT_PUBLIC_API_URL` di
`frontend/.env.local` menunjuk backend lain; `:3003` sudah dipegang proses lain; build gagal; atau
server sendiri mati karena EADDRINUSE.

### 1.2 Apa yang diperiksa

| Test | Cakupan | Kriteria lulus |
|---|---|---|
| Login SUPER_ADMIN | form login sungguhan lewat UI | POST `/api/auth/login` < 400; `token` ada di `localStorage` **dan** cookie; berakhir di `/executive/dashboard` |
| Route discovery (guard) | penemuan rute dari filesystem | > 200 rute; `/warehouse/stok` dan `/pembelian/purchase-requests` ada — mencegah sweep "hijau palsu" karena nol rute |
| Sweep 1–4/4 | 264 rute statis `(dashboard)`, 66 per shard | tanpa HTTP ≥ 500, tanpa error surface, tidak terlempar ke `/login`, tidak blank |
| Pilot + overview | `/warehouse*` (4), `/pembelian/*` (4), `/finance/dashboard`, `/finance/accounting/coa`, `/finance/ledger`, `/marketing/dashboard`, `/executive/dashboard` | halaman sehat **dan** ada `table`/`h1`/`h2` yang terlihat — bukan cangkang kosong |

Asersi sengaja "markup-light": tidak mengunci selector yang berubah tiap perubahan UI, karena
tujuan gerbang ini adalah "apakah manusia melihat halaman yang bekerja", bukan memverifikasi angka
bisnis (itu tugas dual-run Fase 6).

### 1.3 Keandalan gerbang — apa yang terjadi sebenarnya

Delapan eksekusi penuh tercatat hari ini: **6 hijau** (`run-clean3` … `run-clean8`) dan **2 merah**
(`run-clean`: 1 passed/6 failed; `run-clean2`: 4 passed/3 failed). Semua merah berpusat pada satu
gejala: **`POST /api/auth/login` tidak pernah dijawab**.

Jejak yang tertangkap (bukan dugaan — dari `run-clean.log` kegagalan #6):

```
page: {"url":"/login","reactAttached":true,"submitButton":"Initialize Session",
       "toast":"Login failed. Check your credentials."}
auth traffic: req POST /api/auth/login | failed net::ERR_ABORTED | req ... | failed ... | req ... | failed ...
```

`reactAttached: true` + tiga POST terkirim + ketiganya `net::ERR_ABORTED` + durasi test 1.6 menit
(≈ 3 × timeout) menunjukkan: **request terkirim, tidak ada balasan dalam 15 detik, lalu axios
membatalkannya** (`frontend/src/lib/api.ts:12`, `timeout: 15000`). Halaman lalu menampilkan toast
"Login failed. Check your credentials." — pesan yang menuduh password padahal masalahnya server bisu.

Yang **dibuktikan**:

- Backend tidak pernah lambat maupun error: `/v1/health` 200 dalam 3–4 ms; 12 `fetch` POST paralel
  dari Node langsung ke backend dijawab 201 dalam 1.2–1.6 s; log backend bersih (tanpa 429/Throttler/
  pool error). Jadi bukan throttle, bukan DB.
- Stream SSE same-origin (`/api/events/{qc,creative,busdev,maintenance}`) **bukan** penyebab
  kelaparan koneksi: diuji 8 stream bersamaan sementara `/login` tetap dilayani 7–14 ms, dan stream
  itu sendiri berakhir 200 dalam ~4 s.
- Bukan mode penyajian: build standalone dijalankan persis seperti produksi
  (`node .next/standalone/frontend/server.js` setelah `.next/static` + `public` disalin) — hasilnya
  justru lebih buruk (7 dari 12 konteks gagal, 4 di antaranya `page.goto` timeout 30 s). Jadi
  `next start` **bukan** akar masalah.
- Bukan jumlah browser semata: 6 browser terpisah melakukan login: 30/30 hijau; 12 browser: 5/12 gagal.

Yang **berkorelasi dan belum terbukti**:

- Sebelum 4 eksekusi hijau, mesin ini membawa **31 proses `chrome.exe` yatim** (total 49 proses
  node+chrome). Proses itu berasal dari probe diagnostik saya sendiri yang dibatalkan di tengah jalan
  (`browser.close()` tidak pernah berjalan), bukan dari Playwright — setelah eksekusi suite yang
  bersih, jumlah proses browser yang tertinggal **0** (terverifikasi), dan `:3003` bebas pada akhir
  run.
- Setelah pembersihan itu: **5 eksekusi penuh berturut-turut hijau**, 2.2–2.4 menit (sebelumnya 3.2
  menit saat mesin tercemar).
- Satu data yang **melemahkan** teori "jumlah browser adalah penyebabnya": `run-clean8` dijalankan
  saat peringatan runner menyala — **23 proses browser hidup** (Chrome milik operator, bukan proses
  yatim; suite bersih meninggalkan 0) — dan tetap hijau 7/7. Jadi hitungan proses semata bukan
  mekanismenya; yang berkorelasi adalah proses yatim/probe yang dibatalkan, dan itu tetap belum
  terbukti sebagai sebab.

**Kesimpulan jujur:** gejala merah itu nyata (request tidak dijawab ≥ 15 s), tetapi pemicunya belum
terbukti — kandidat terkuat adalah beban mesin/browser yang terkontaminasi oleh proses yatim, dan itu
berada di sisi harness/lingkungan, bukan di NestJS. Karena itu semua eksekusi gerbang dicatat apa
adanya dan angka hijau tidak diklaim sebagai bukti kuat.

---

## 2. Cacat harness yang ditemukan DAN diperbaiki

1. **Klik yang tidak pernah selesai.** Tombol submit berubah jadi disabled ("Authenticating…") lalu
   halaman navigasi — klik Playwright tidak pernah settle, dan suite mati di baris itu dengan stack
   yang menunjuk halaman login, bukan cacat nyata. Diganti menjadi dispatch event `submit`
   (`uat.ts`, `loginViaUI`), plus 3 percobaan ulang karena submit sebelum hidrasi memang tertelan
   tanpa request sama sekali.
2. **Balapan hidrasi.** Build produksi menyajikan HTML pra-render: input ada dan bisa diisi jauh
   sebelum React memasang handler. Ditambah penanda hidrasi `__reactProps$…` (`waitForReact`).
3. **Kegagalan tanpa diagnosis.** `waitForURL` timeout dulu hanya melaporkan stack. Sekarang pesan
   kegagalan menyebut URL saat itu, daftar request yang belum dijawab (`trackRequests` /
   `inFlight()`), dan seluruh lalu lintas `/auth/` (`trail`).
4. **Cacat "swallow" senyap (celah yang paling penting).** Fetch yang **tidak pernah dijawab** tidak
   terlihat oleh pemeriksaan mana pun: tidak ada 5xx, tidak ada error console, tidak ada error
   surface, konten tetap ada — halaman tampak sehat. Ditambahkan collector di `watchPage`: request
   `/api/*` yang gagal setelah hidup ≥ 10 detik dilaporkan sebagai problem. Ambang 10 detik dipakai
   karena baik "dinavigasi pergi" maupun "timeout axios" muncul sebagai `net::ERR_ABORTED`; yang
   membedakan adalah **umurnya** (navigasi memutus dalam < 1 s, timeout butuh 15 s).
   Pada `run-clean7` collector ini melaporkan **0** panggilan API terlantar di seluruh 264 rute.
5. **Runner bisa hijau tentang build orang lain.** Runner dulu hanya memeriksa "ada yang menjawab di
   :3003". Windows mengizinkan proses kedua bind ke port yang sudah listen, jadi pemeriksaan itu
   bukan bukti. Sekarang: cek tabel socket (`Get-NetTCPConnection … OwningProcess`) sebelum start,
   penolakan bila port sudah dipegang, cek `EADDRINUSE` di log server, dan pencatatan pid pemilik port
   sesudahnya.
6. **Pembersihan server yang bisa menembak run lain.** `$!` di Git Bash adalah pid MSYS yang tidak
   bisa dialamatkan `kill`/`taskkill` Windows; trap lama membunuh "siapa pun yang memegang :3003 saat
   keluar" sehingga run yatim bisa mematikan server run berikutnya. Sekarang hanya pid pemilik port
   milik run ini yang dibunuh.
7. **Klaim palsu soal environment.** Komentar lama menyatakan `INTERNAL_BACKEND_URL` saat
   `next start` menentukan target rewrite. Terbukti salah: target `/api/:path*` **dipanggang ke dalam
   build** (`frontend/.next/routes-manifest.json` → `http://localhost:3002/v1/:path*`); proxy
   pencatat di `:3010` tidak pernah menerima lalu lintas `/api`. Komentar diganti dengan hasil ukur.
8. **`next start` dipakai pada build `standalone`.** Next memperingatkan sendiri:
   `⚠ "next start" does not work with "output: standalone" configuration`. Sudah diuji A/B: mode
   standalone **tidak** memperbaiki flake (malah lebih buruk), jadi `next start` dipertahankan dan
   peringatan itu dicatat sebagai utang teknis, bukan diperbaiki diam-diam.
9. **`npm start` di frontend rusak.** `frontend/package.json` menunjuk
   `node scripts/start-standalone.js`, dan file itu **tidak ada** → `npm start` selalu gagal. Belum
   diperbaiki (di luar cakupan gerbang ini).
10. **Jebakan operasional:** menjalankan `npm run build` di backend **sementara** dev server watch
    hidup akan me-restart backend di tengah smoke test. Terjadi hari ini: smoke pertama 1 passed/5
    failed, backend boot ulang 20:33:04, lalu smoke ulang **6/6 hijau**. Dicatat agar tidak salah
    disimpulkan sebagai cacat produk.
11. **Siapa pun yang menjalankan `npx playwright test` langsung akan menabrak dev server.**
    `frontend/playwright.config.ts` masih menyetel `webServer.command = npm run dev -- -p 3003`.
    Dev server meng-compile tiap rute satu per satu saat pertama diminta: sweep 264 rute di atasnya
    makan ~10 menit dan **hanya bisa timeout**, plus overlay error dev mengubah apa yang dilihat
    asersi. Diganti `npx next start -p 3003` (butuh `npm run build` lebih dulu — runner sudah
    melakukannya).
12. **Browser yatim memperlambat mesin tanpa ada yang memberi tahu.** Runner kini menghitung proses
    `chrome`/`headless_shell`/`chromium` yang sudah berjalan sebelum uji; bila > 20 ia **memperingatkan**
    ("curigai beban mesin sebelum menuduh aplikasi"). Sengaja hanya menghitung, **tidak** membunuh —
    nama proses yang sama dipakai Chrome milik operator sendiri. Ini alat diagnosis untuk gejala di
    bagian 1.3, bukan perbaikan akar masalah. Terbukti bekerja pada `run-clean8`: peringatan menyala
    ("23 browser processes are already running") dan run itu tetap hijau — jadi angka tinggi tidak
    otomatis berarti merah.
13. **Gerbang ini belum punya test regresi sendiri** — padahal CLAUDE.md mewajibkan setiap bug
    mendapat test reproduksi. Ditambahkan `scripts/__tests__/p22-uat-preflight.test.sh` dan
    didaftarkan di `scripts/__tests__/run-all.sh`. Sifatnya **perilaku**, bukan grep: test benar-benar
    menahan `:3003` dengan sebuah HTTP server, lalu menuntut runner menolak jalan dengan pesan
    "already held by pid …" **dan** "browser agent did NOT run". Bukti RED diambil dengan menonaktifkan
    penjaga okupansi (`if [ -n "$EXISTING_PID" ]` → `if false`): `RED_EXIT=1`, dan runner dipulihkan
    byte-identik (`restored_ok=yes`).

---

## 3. Daftar rute yang benar-benar rusak

### 3.1 Tingkat halaman — bersih

264 rute statis `(dashboard)` (4 shard × 66) + 8 rute pilot + 5 rute lintas-divisi dijelajahi dengan
login sungguhan: **0 rute** menghasilkan 5xx, error surface, lemparan ke `/login`, halaman kosong,
crash React, atau panggilan API terlantar (`run-clean7`). Tidak ada rute yang perlu disembunyikan dari
klien karena alasan render.

### 3.2 Tingkat semantik bisnis — 4 cacat nyata (BELUM diperbaiki, sengaja)

Gerbang halaman **tidak bisa** melihat ini: halamannya sehat, angkanya salah.

1. **`/pembelian/rangkuman-kebutuhan` — tombol "Buat PO" tidak mungkin muncul.**
   `backend/src/modules/scm/services/goods-requirement.service.ts:121` mengembalikan
   `selisih: Math.max(0, row.totalKebutuhan - row.stokGudang)` → **nilainya tidak pernah negatif**.
   `frontend/src/app/(dashboard)/pembelian/rangkuman-kebutuhan/page.tsx:224` merender tombol hanya
   bila `item.selisih < 0`. Akibatnya pembuatan PO per-material **mati total** dari halaman ini.
   Komentar di `page.tsx:47-48` menyatakan konvensi sebaliknya ("PO otomatis dibuat untuk material
   dengan selisih negatif"), jadi **konvensi tanda backend dan frontend bertentangan**.
2. **`/pembelian/rangkuman-kebutuhan` — prioritas selalu MEDIUM.**
   `goods-requirement.service.ts:108` menulis `prioritas: 'MEDIUM'` sebagai literal. Cabang
   `critical`/`high` di `page.tsx:210-212` tidak pernah aktif, dan penghitung di `page.tsx:247`
   membandingkan dengan `prioritas === 'Critical' || 'High'` (huruf besar) → selalu 0 material
   Critical/High. Dua cacat berbeda (nilai di-hardcode, dan perbandingan case/string tidak cocok).
3. **`/bussdev/dashboard` — live stream SSE menembak URL yang salah.**
   `frontend/src/components/dashboard/BusDevActivityStream.tsx:26` membangun
   `new EventSource(\`${NEXT_PUBLIC_API_URL}/events/busdev\`)`: **tanpa segmen `/v1`** dan
   **cross-origin** (melewati proxy `/api`), sedangkan backend memakai prefix global `v1`. Stream
   gagal 404 secara senyap. Dua konsumen SSE lain sudah benar —
   `QCNotificationHub.tsx:77` dan `CreativeBoardClient.tsx:31` memakai `/api/events/*`.
4. **Toast login menyesatkan saat server bisu.**
   `frontend/src/lib/api.ts:12` (`timeout: 15000`) + penanganan error di halaman login membuat
   timeout tampil sebagai "Login failed. Check your credentials." Dilihat langsung di `run-clean.log`
   kegagalan #6. Saat UAT, operator akan menuduh kredensial padahal servernya yang tidak menjawab.

### 3.4 Temuan tambahan — recon 2026-09-25 (di luar sweep browser)

Ditemukan saat memeriksa master data, print, dan data legacy. **Gerbang browser tidak bisa melihat
ketiganya** (tidak ada aksi tulis, tidak ada unduhan, tidak ada angka bisnis yang divalidasi).

5. **Unduh PDF dokumen MATI di produksi, dan gagal secara senyap.**
   `backend/src/modules/document-automation/services/pdf-engine.service.ts:507-510` menangkap setiap
   kegagalan `html-pdf-node` lalu mengembalikan `createDeterministicPdf('NEX ERP Fallback Document
   Snapshot')` — PDF satu baris. Di container produksi `NODE_ENV=production` (bukan cabang uji) dan
   Chromium puppeteer **tidak ada**: `spawn /app/node_modules/puppeteer/.local-chromium/linux-901912/chrome-linux/chrome ENOENT`
   (dibuktikan langsung di `production-light-backend-1`). Akibatnya `POST /v1/document-automation/pdf`
   dan `GET /v1/document-automation/drafts/:id/pdf` menjawab **HTTP 200 + `Content-Disposition:
   attachment`** berisi placeholder, tanpa error, tanpa toast. Dipakai
   `FinalDocumentPdfButton.tsx` (3 halaman: `finance/invoices`, `penjualan/delivery-orders`,
   `penjualan/sales-orders-finance`) dan `DocumentPdfButton.tsx` (`documents/drafts`).
   Di lokal jalur ini **benar** (200, 37.761 byte, 3.9 s, render Chromium nyata) — jadi bug ini hanya
   muncul di produksi, tepat di tempat manusia akan mengkliknya.
6. **Master data legacy BELUM masuk database mana pun.** Lihat bagian 3.5.
7. **22 halaman memakai `window.print()`** (dump halaman via dialog browser), **tidak satu pun** pernah
   diverifikasi gerbang ini atau gerbang lain; klaim terkuat yang ada di dokumen lama hanya
   "Print layouts and attachments visible; **limited integration proof**"
   (`docs/legacy-erp/verification/ALL_PHASE_LEGACY_PARITY_AND_PROVENANCE_AUDIT.md`, baris P17).

### 3.5 Master data legacy — sudah diekstrak, belum diimpor

Sumber: `docs/legacy-erp/data/master/MASTER_DATA/` (hasil crawl HTML `kil.gserp.id`, bukan dump DB;
kolom `web_scraper_order`/`web_scraper_start_url` membuktikannya). Usia: di-scrape 2026-09-05/06,
mtime 2026-09-16 — **±3 minggu basi**.

| CSV | Baris | Tabel tujuan | Isi tabel LOKAL | Isi tabel PRODUKSI |
|---|---|---|---|---|
| `BARANG.csv` | 2.795 | `material_items` | 14 (3 benih + 11 `Bridge_CP_Mat_*` fixture uji) | **0** |
| `PELANGGAN.csv` | 816 | `customers` | **0** | **0** |
| `SUPPLIER.csv` | 176 | `suppliers` | 3 | **0** |
| `GUDANG.csv` | 16 | `warehouses` | 3 | **0** |
| `KATEGORI-BARANG.csv` | 7 | `master_categories` | **0** | **0** |
| `USERS.csv` | 45 | `users` | 94 (mayoritas user uji) | 32 |
| — | — | `master_units` / `master_kodes` / `accounts` | 0 / 0 / 73 | 0 / 0 / **0** |

Importer-nya **sudah ada**: `backend/prisma/seed-master-data.ts` (KATEGORI-BARANG, BARANG, SUPPLIER,
PELANGGAN, USERS) dan `backend/prisma/seed-fase1-master.js` (+GUDANG), keduanya memakai `csv-parse`.
Jadi yang hilang bukan kode, melainkan **eksekusi seed**.

> **KOREKSI 2026-09-25 (kemudian hari yang sama).** Pernyataan di atas **salah** dan sudah
> diperbaiki. Audit + eksekusi membuktikan keduanya **tidak bisa menyemai apa pun** sebelum
> diperbaiki: `CSV_DIR` menunjuk `docs/legacy-erp/MASTER_DATA` yang tidak ada (yang benar
> `docs/legacy-erp/data/master/MASTER_DATA`), sehingga setiap file berbunyi "CSV not found"
> lalu run menutup dengan "ALL FASE 1 MASTER DATA SEEDING COMPLETE" dan 0 baris; dan
> `seed-master-data.ts` menulis `MaterialItem` tanpa kolom wajib serta `SalesLead` dengan field
> yang tidak ada di model itu, semuanya ditelan `catch {}`. Jadi yang hilang **kode dan eksekusi**.
> Perbaikan, bukti RED→GREEN, hasil seed, dan cacat `/master/*/active` yang baru ketemu ada di
> [P22 — Ekspor PDF & Seed Master Data](2026-09-25-p22-pdf-export-dan-seed-master.md).
>
> Dua endpoint material yang disebut di bawah sudah diperiksa lebih lanjut. Keduanya membaca
> model yang sama (`prisma.materialItem.findMany`) — jadi ini **bukan** dua rezim seperti COA.
> Bedanya: `/master/materials` default `limit` 50 (`materials.service.ts:26`), sedangkan
> `/scm/materials` **tanpa pagination sama sekali** (`scm/services/materials.service.ts:11`) —
> setelah seed ia mengembalikan 2.804 baris dalam satu respons. Itu cacat performa tersendiri
> (belum diperbaiki, belum masuk gerbang).

Dropdown-nya sendiri **sudah API-driven** (diverifikasi terhadap backend lokal: `/customers`,
`/master/customers`, `/master/materials`, `/master/suppliers`, `/master/warehouses`, `/master/units`,
`/master/categories` → 200, dan `?search=` bekerja) — jadi setelah seed dijalankan dropdown akan
terisi tanpa perubahan frontend. Dua endpoint material memberi angka berbeda
(`/master/materials` = 5 vs `/scm/materials` = 14) — bau "dua rezim" yang sama seperti COA
(memori `coa-code-regimes-diverge`), perlu diputuskan mana yang kanonik.

### 3.3 Utang teknis terkait (bukan rute)

- `frontend/package.json` → `start: node scripts/start-standalone.js` (file tidak ada) — `npm start`
  selalu gagal.
- `next start` dijalankan pada build `output: "standalone"` — tidak didukung Next, dipertahankan
  karena mode standalone terbukti tidak lebih baik (bagian 1.3).
- Temuan sesi sebelumnya yang **belum diverifikasi ulang** di gerbang ini dan tidak dihitung ke
  verdict: endpoint dengan `stage` tidak valid membalas 500 (bukan 400) plus membocorkan path
  internal.

---

## 4. Batas gerbang ini (apa yang TIDAK dibuktikan)

- **Angka bisnis tidak diuji.** Gerbang membuktikan halaman render dan API menjawab; tidak
  membuktikan jurnal seimbang, stok benar, atau harga benar. Itu pekerjaan dual-run Fase 6.
- **Aksi tulis tidak diuji.** Tidak ada PO/jurnal/GRN yang dibuat; suite ini tidak mengubah data.
- **Rute dinamis (`[id]`) dilewati** — butuh record nyata agar bermakna.
- **Keandalan jangka panjang belum terbukti** (bagian 1.3): 5 hijau dari 7 eksekusi, akar penyebab
  merah tidak terbukti secara kausal.
- **Hanya Chromium**, tanpa perangkat mobile/WebKit.

---

## 5. Perubahan kode yang diuji

| File | Perubahan |
|---|---|
| `scripts/test-browser-agent.sh` | Penjaga okupansi `:3003` berbasis tabel socket; penolakan `EADDRINUSE`; pembersihan hanya pid pemilik port milik run ini; komentar env rewrite dikoreksi sesuai hasil ukur |
| `frontend/tests/e2e/uat-preflight/uat.ts` | `waitForReact` (sinyal hidrasi), `trackRequests`/`inFlight`, `loginViaUI` dengan dispatch `submit` + 3 percobaan + pesan diagnosis, dan collector di `watchPage` untuk panggilan API yang terlantar ≥ 10 s |
| `frontend/tests/e2e/uat-preflight/pilot-uat.spec.ts` | 7 test: login, guard penemuan rute, 4 shard sweep 264 rute, pilot + overview |
| `frontend/playwright.config.ts` | `webServer.command` dev server → `npx next start -p 3003` (dev server: 264 rute × compile = selalu timeout, overlay error mengubah asersi) |
| `scripts/__tests__/p22-uat-preflight.test.sh` | **Baru** — test regresi perilaku: runner harus gagal-tertutup saat `:3003` dipegang proses lain, dan harness harus punya collector panggilan API terlantar |
| `scripts/__tests__/run-all.sh` | Mendaftarkan test di atas sebagai `p22-uat-preflight-gate-fail-closed` |
| `frontend/probe-login.cjs`, `frontend/probe-proxy.cjs` | Probe diagnostik sementara — **sudah dihapus** setelah akar masalah dibatasi |

Tidak ada perubahan pada kode produk di gerbang ini. Kelima cacat di bagian 3 **tidak diperbaiki**
karena mengubah semantik bisnis (tanda `selisih`, arti `prioritas`) adalah keputusan pemilik sistem,
bukan keputusan harness.

---

## 6. Langkah berikutnya (urutan yang benar)

1. **Hapus deploy drift lebih dulu** — merge `main` → CI → GHCR → `bash scripts/deploy.sh <sha>` di
   VPS. Panduan: `docs/RUNBOOK-DEPLOY-NEXERP-V2.md` bagian E.
2. **Snapshot segar** (`bash scripts/db-snapshot.sh`) lalu **DR live drill** (`bash scripts/dr-drill.sh`)
   di maintenance window yang disetujui — butuh otorisasi eksplisit, downtime 1–3 menit.
3. **Putuskan 4 cacat bagian 3.2** (perbaiki atau terima), karena dua di antaranya ada di modul pilot.
4. **Selaraskan seed COA** sebelum jalur saldo awal dipakai produksi.
5. Baru **Fase 6**: pilot UAT klien + dual-run 14 hari + Berita Acara.
