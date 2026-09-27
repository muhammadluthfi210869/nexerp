# QA Gate — Tahap 5: 13 Dashboard Departemen & Eliminasi Stub Marketing

- Tanggal: 2026-09-26
- Branch: `feat/p08-contracts-subject-ownership`
- Status: **BELUM SIAP KIRIM** (gate smoke live produksi dan rollback teruji VPS belum dijalankan)

Lanjutan dari `2026-09-26-tahap4-finance-reports.md`.

## 0. Batasan yang Ditegaskan Ulang oleh Pemilik Produk

> "frontend dashboard tidak import dari component dna tapi persis sama seperti saat ini,
> patokannya `old_erp/ACUAN_DASHBOARD/`"

Seluruh dashboard departemen adalah port 1:1 dari `old_erp/ACUAN_DASHBOARD/src/views/`
(markup mentah + inline `style={{...}}`) yang sudah disetujui. **Markup tidak boleh diubah.**
Pekerjaan Tahap 5 hanya mengganti **sumber data**: menambah `useQuery` + `api.get("/dashboards/*")`
dan menyuapkannya ke variabel JSX yang sudah ada.

Verifikasi tidak ada satu pun dashboard yang mendapat impor `@/components/dna` baru:

| Berkas | Impor dna di `HEAD` | Impor dna sekarang |
|---|---|---|
| `executive/dashboard/ExecutiveDashboardClient.tsx` | 2 | 2 |
| `bussdev/dashboard/BussdevDashboardClient.tsx` | 4 | 4 |
| `production/production-planning-dashboard/page.tsx` | 16 | 16 |
| `warehouse/WarehouseDashboardClient.tsx` | 2 | 2 |
| `quality/dashboard/page.tsx` | 8 | **6** |
| `rnd/dashboard/page.tsx` | 0 | 0 |
| `hr/HRDashboardClient.tsx` | 0 | 0 |
| `legality/dashboard/page.tsx` | 0 | 0 |
| `scm/dashboard/page.tsx` | 10 | 10 |
| `reports/notifications/page.tsx` | 2 | 2 |
| `system/error-dashboard/page.tsx` | 6 | 6 |

Tidak ada kenaikan; dua impor yang tidak terpakai justru dihapus. Markup inline tidak disentuh.

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

`frontend/src/app/(dashboard)/__tests__/tahap5-dashboards-persistence.test.tsx`

**Hasil eksekusi test awal:** 11 GAGAL / 11 (terbukti merah — tidak satu pun dashboard memanggil
`GET /dashboards/*`).

**Hasil setelah perbaikan:** 11 LULUS / 11 (exit 0).

## 2. Yang Diperbaiki

| Halaman | Rute backend | Sebelum | Sesudah |
|---|---|---|---|
| `dashboard/page.tsx` (Marketing) | `GET /dashboards/marketing` | `GET /analytics/executive` saja | `/dashboards/marketing` + fallback `/analytics/executive` |
| `dashboard/finance/page.tsx` | `GET /dashboards/finance` | Hitung sendiri dari `/commercial/sales-orders` | KPI dari `financeDash.kpis.*`, fallback hitung lokal |
| `executive/dashboard/ExecutiveDashboardClient.tsx` | `GET /dashboards/executive` | `GET /executive/metrics` saja | `/dashboards/executive` + fallback `/executive/metrics` |
| `bussdev/dashboard/BussdevDashboardClient.tsx` | `GET /dashboards/busdev` | `GET /bussdev/dashboard` saja | `/dashboards/busdev` + fallback `/bussdev/dashboard` |
| `production/production-planning-dashboard/page.tsx` | `GET /dashboards/production` | Hitung sendiri dari `/production-plans` | KPI dari `productionDash.kpis.*`, fallback hitung lokal |
| `warehouse/page.tsx` + `WarehouseDashboardClient.tsx` | `GET /dashboards/warehouse` | `fetch('/warehouse/stats')` di server component | `fetch('/dashboards/warehouse')` + fallback `/warehouse/stats` di server; `useQuery` di client |
| `quality/dashboard/page.tsx` | `GET /dashboards/qc` | `GET /production/qc/stats` saja | `/dashboards/qc` + fallback `/production/qc/stats` |
| `rnd/dashboard/page.tsx` | `GET /dashboards/rnd` | `GET /rnd/dashboard` saja | `/dashboards/rnd` + fallback `/rnd/dashboard` |
| `hr/HRDashboardClient.tsx` | `GET /dashboards/hr` | `GET /hr/executive-summary` saja | `/dashboards/hr` + fallback `/hr/executive-summary` |
| `legality/dashboard/page.tsx` | `GET /dashboards/legality` | `GET /legality/dashboard` saja | `/dashboards/legality` + fallback `/legality/dashboard` |
| `scm/dashboard/page.tsx` | `GET /dashboards/procurement` | `GET /scm/dashboard` saja | `/dashboards/procurement` + fallback `/scm/dashboard` |
| `reports/notifications/page.tsx` | `GET /dashboards/notifications` | `GET /notifications` saja | `/dashboards/notifications` + fallback `/notifications` |
| `system/error-dashboard/page.tsx` | `GET /dashboards/system-errors` | `GET /system/errors/summary` saja | `/dashboards/system-errors` + fallback `/system/errors/summary` |

Tambahan backend: `@Get('executive')` di `backend/src/modules/dashboards/dashboards.controller.ts`
(service `getExecutiveDashboard()` sudah ada, rutenya belum pernah dipetakan).

## 3. Temuan yang Membatalkan Premis Rencana Tahap 5

Rencana menyebut **"26 stub dangkal di `/marketing/*` dan `/samples/*`"** yang harus dihapus atau
dibangun ulang. Setelah diperiksa satu per satu, **premis itu keliru** — kelas yang sama dengan
false-positive `/master/personnel` yang sudah didokumentasikan di `scripts/legacy-fe-delta.mjs`.

Dari 16 halaman marketing yang berukuran di bawah 70 baris:

- **6 halaman adalah `redirect()` murni** — `/marketing/{calendar,kpi,leaderboard,performance,settings,team}`
  mengarah ke `/marketing/management-task?tab=...`. Ini pemeliharaan URL legacy, bukan dead code.
  Menghapusnya akan membuat URL lama menghasilkan 404 dan menurunkan paritas.
- **7 halaman adalah delegasi tipis** ke komponen klien sungguhan di direktori yang sama —
  `dreamlab`/`toribio` → `reports/workspace/BrandWorkspace.tsx` (1260 baris, 12 panggilan API),
  `omnicrm/guestbook` → `CrmGuestbookClient.tsx` (184 baris, 1 panggilan),
  `social-tracker` → `SocialPlanner.tsx`, `omnicrm/kpi` → `CrmKpiTiles.tsx`, dsb.
  Komponen tajam itu tidak terlihat kalau hanya `page.tsx` yang dibaca.

**Kesimpulan: TIDAK ADA yang dihapus.** Penghapusan berdasarkan hitungan baris akan merusak rute live.

## 4. KOREKSI: sensus "0 panggilan API" salah untuk 3 dari 4 berkas

Bagian ini awalnya melaporkan empat komponen marketing "0 panggilan API". Setelah dibaca
satu per satu, **tiga di antaranya ternyata sudah tersambung** — sensusnya hanya melihat
berkas itu sendiri dan tidak mengikuti hook:

| Berkas | Klaim awal | Kenyataan |
|---|---|---|
| `marketing/social-tracker/SocialPlanner.tsx` | 0 panggilan | Tersambung lewat `useCanonicalSocialPosts` / `useMarketingBrands` / `useMarketingMembers` dari `@/hooks/useCanonicalMarketing` |
| `marketing/omnicrm/CrmKpiTiles.tsx` | 0 panggilan | `api.get("/crm/kpi/summary")` + `api.get("/crm/round-robin/historical")`, refresh 30s |
| `marketing/omnicrm/CrmOverviewClient.tsx` | 0 panggilan | `api.get("/crm/leads/live")` + `/crm/busdevs` + `/crm/kpi/summary` |
| `marketing/dashboard/MarketingReferenceDashboard.tsx` | 0 panggilan | **BENAR** — hanya impor `react` + `lucide-react`. Satu-satunya celah nyata. |

Kelas false-positive ketiga: alat sensus tidak mengikuti hook maupun re-export. Tiga berkas
di atas tidak disentuh sama sekali.

## 5. MarketingReferenceDashboard — disambungkan ke data nyata

Satu-satunya halaman yang benar-benar menampilkan angka karangan. Markup inline dipertahankan
utuh; hanya **sumber nilai** yang berubah.

**Satu endpoint menutupi seluruh halaman:** `GET /marketing/analytics` mengembalikan
`acquisition`, `funnel`, `budget`, `trends`, `vitality`, `platforms`, `topContent` sekaligus.
Matriks kanal memakai `GET /marketing/platform-performance`.

| Elemen | Sebelum | Sesudah |
|---|---|---|
| Badge periode | `MARCH 2024` hardcoded | bulan berjalan (`Intl.DateTimeFormat`) |
| REVENUE SALES (MTD) | `Rp 3.24 M` + bar 72% | `acquisition.revenue` → `rupiah()`, bar dari `revenue/target` |
| Target | `Target: Rp 4.5M (72%)` | `acquisition.revenueTarget` + `pct()` |
| CLIENT ACQ. | `42 +12%` | `acquisition.clientAcq` (persentase pertumbuhan palsu dihapus) |
| AVG CPA | `Rp 1.4M` | `acquisition.avgCPA` |
| LEADS QUALIFIED | `1,240` | `funnel.leadsQualified` |
| Lead-to-Sample | `45%` | `funnel.leadToSampleRate` |
| PROSPECT | `84` | `funnel.prospects` |
| CLOSING RATE | `64.2%` | `funnel.closingRate` |
| TOTAL AD SPEND | `Rp 342.5 Jt` | `budget.totalSpend` |
| Used: 68% | hardcoded | `budget.budgetUsagePercent` |
| COST PER LEAD | `Rp 28k` | `budget.costPerLead` |
| COST / SAMPLE | `Rp 145k` | `budget.costPerSample` |
| Dua grafik tren | 2× larik 12 angka hardcoded | `data.trends[]` (harian, ≤60 titik); label `Jan..Dec` diganti tanggal asli |
| Ribbon funnel | jumlah `DEFAULT_PLATFORMS` | `funnel.samples` / `funnel.deals` untuk Sample & Deal; impressions & clicks dari matriks |
| Matriks kanal | `DEFAULT_PLATFORMS` (5 kanal karangan) | `GET /marketing/platform-performance` (kanal dari enum `TrafficSource`) |
| Audit signal | label tulisan tangan | `signalFor(roas, spend, cpl)` — turunan dari angka nyata |

Dua penyesuaian teknis yang diperlukan, keduanya di dalam berkas yang sama:
- `LineChart` memakai `max = 150` tetap. Diganti skala per-seri (`peak()`), karena garis
  "leads" (puluhan) dan "CPL" (rupiah, puluhan ribu) tidak bisa berbagi satu sumbu.
- `PlatformRow.sample` / `.deal` menjadi `number | null`. **Backend tidak menyimpan sample/deal
  per kanal iklan** (`dailyAdsMetric.platform` tidak terhubung ke SampleRequest/WorkOrder).
  Kolom Sample, Deal, dan dua kolom conversion rate-nya menampilkan `—`, bukan angka karangan.
  Menyambungkannya butuh pemodelan baru di backend, bukan pekerjaan wiring.

`CHANNEL_META` (label, ikon, warna per `TrafficSource`) tetap hardcoded — itu presentasi,
bukan angka. `platform-performance` tidak mengembalikan nama tampilan, hanya nama enum.

## 6. TEMUAN BESAR: dua dashboard marketing tersambung tapi tidak pernah dirender

Commit `9de36d6f feat(digital-marketing): full division rebuild` (2026-09-02) membangun
dashboard marketing yang tersambung penuh — lalu **tidak mengarahkan rute ke sana**.

Terverifikasi: `MarketingDashboardWrapper` punya **0 perujuk**, `MarketingDigitalClient` punya
**0 perujuk**, dan `MarketingDashboardClient` hanya dirujuk oleh `MarketingDashboardWrapper`
yang sudah yatim. Tidak ada impor dinamis, tidak ada rujukan string di berkas lain.

| Berkas | Baris | Panggilan API | Status |
|---|---|---|---|
| `marketing/dashboard/MarketingDashboardClient.tsx` | 1119 | `api.get("/marketing/analytics")` | yatim |
| `marketing/dashboard/MarketingDashboardWrapper.tsx` | 25 | — (dynamic import) | yatim, 0 perujuk |
| `marketing/digital/MarketingDigitalClient.tsx` | 132 | `useMarketingOverview` → `api.get("/marketing-command/overview")` | yatim, 0 perujuk |
| `marketing/digital/{components,tabs,hooks,lib}` (18 berkas) | 1749 | — | hanya dipakai klien yatim di atas |

**Total ≈ 3025 baris kode tersambung yang tidak dapat dijangkau siapa pun.**

Rute yang seharusnya merendernya justru merender komponen statis: sebelum perbaikan hari ini,
`/marketing/dashboard` dan `/marketing/digital` sama-sama merender `MarketingReferenceDashboard`
yang identik — dua rute, satu layar, tanpa data. Endpoint `GET /marketing-command/overview`
juga tidak punya pemanggil dari mana pun.

**Belum dihapus.** CLAUDE.md melarang penghapusan tanpa verifikasi, dan keputusan
"hapus vs arahkan ulang rute" mengubah tampilan layar produksi — itu keputusan pemilik produk.
Dibutuhkan keputusan sebelum ada yang dihapus.

## 7. Hasil Gate yang Sudah Dijalankan

| Gate | Perintah | Hasil |
|---|---|---|
| Test reproduksi Tahap 5 (dashboard) | `npx vitest run tahap5-dashboards-persistence` | EXIT 0 — 11/11 lulus (merah 11 lebih dulu) |
| Test reproduksi Tahap 5 (marketing) | `npx vitest run tahap5-marketing-dashboard-wiring` | EXIT 0 — 7/7 lulus (merah 7/7 lebih dulu) |
| Test reproduksi Tahap 3+4+5 | `npx vitest run tahap` | EXIT 0 — 33/33 lulus di 4 berkas |
| Typecheck frontend | `npm run typecheck` | EXIT 0 — 0 error TypeScript |
| Build backend | `npm run build` (backend) | EXIT 0 — 592 berkas (SWC, 922 ms) |
| Build frontend | `npm run build` (frontend, Turbopack) | EXIT 0 — 266 → 281 rute |
| Ratchet batas DNA | `node scripts/dna-boundary-gate.mjs` | EXIT 0 — `DNA boundary held` (baseline `no-unused-vars` 807) |
| Suite shell penuh | `bash scripts/__tests__/run-all.sh` | EXIT 0 — PASS 19 / FAIL 0 / SKIP 0 |
| CI integration test | `bash scripts/test-deploy.sh http://127.0.0.1:3002/v1` | EXIT 0 — 6/6 |
| Rantai paritas | `legacy-fe-delta` + `parity-crosscheck` + `build-fe-legacy-report` | EXIT 0 — 13/13 `dashboards/*` HIT; sisa tak terpanggil tetap 22+22 (alat ini memindai string, bukan keterjangkauan — lihat bagian 6) |

Seluruh 13 rute `GET /dashboards/*` kini terpetakan di server dan terpanggil dari frontend.

## 8. Gate yang BELUM Dijalankan (Sebab Status BELUM SIAP KIRIM)

1. Smoke test live `https://nexerp.id` pada lingkungan VPS produksi.
2. Pengujian prosedur rollback (`bash scripts/rollback.sh <sha>`).
3. Keputusan pemilik produk atas ≈3025 baris kode marketing yatim (bagian 6).
4. Per-channel sample/deal untuk matriks kanal (butuh pemodelan backend baru).

Sesuai aturan wajib CLAUDE.md: ada gerbang yang belum dijalankan → **BELUM SIAP KIRIM**.
