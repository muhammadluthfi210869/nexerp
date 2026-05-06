# SOURCE OF TRUTH (SoT): DIGITAL MARKETING DIVISION
**Version**: 3.0 — Final
**Role**: The Fuel Tank (Traffic), Brand Awareness Guardian, and Neural Acquisition Hub.

---

## 0. ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│                                                         │
│  /marketing/dashboard  ←── useQuery(["marketing-analytics"])
│  /marketing/input      ──POST──▶  4 endpoint           │
│  /marketing/logs       ←──GET────  /logs/ads, /logs/organic
│                                                         │
│  Data fallback: DEFAULT_* constants (hardcoded original) │
│  UI: 100% TIDAK BOLEH DIUBAH — hanya data source yg dinamis
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (NestJS + Prisma)                   │
│  /marketing/* controller → MarketingService             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          21 ENDPOINT REST API                     │   │
│  │  POST   /daily-ads, /weekly-organic, /content-   │   │
│  │         asset, /targets, /audit-ads              │   │
│  │  GET    /analytics, /organic-analytics,          │   │
│  │         /acquisition-hub, /funnel-efficiency,    │   │
│  │         /budget-audit, /platform-performance,    │   │
│  │         /content-performance, /realized-roi,     │   │
│  │         /sample-efficiency, /logs/ads,           │   │
│  │         /logs/organic, /logs-content, /targets,  │   │
│  │         /comparison                               │   │
│  │  PATCH  /ads/:id, /organic/:id                   │   │
│  │  DELETE /ads/:id, /organic/:id                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 5 TABEL di schema marketing:                     │   │
│  │  • daily_ads_metrics         (DailyAdsMetric)    │   │
│  │  • account_health_logs       (AccountHealthLog)  │   │
│  │  • content_assets            (ContentAsset)      │   │
│  │  • marketing_targets         (MarketingTarget)   │   │
│  │  • search_visibility_metrics (SearchVisibility)  │   │
│  │                                                 │   │
│  │ + Relasi ke tabel eksternal:                    │   │
│  │   sales_leads, sales_orders, sample_requests,   │   │
│  │   payments, system_override_logs                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. BUSINESS PROCESS FLOW (THE VITALITY CYCLE)

| Pillar | Focus | Frequency | Endpoint | Table |
|:---|---:|:---|---:|:---|
| **Paid Acquisition** | ROAS & Leads | Daily | `POST /marketing/daily-ads` | `DailyAdsMetric` |
| **Organic Health** | Growth & Loyalty | Weekly | `POST /marketing/weekly-organic` | `AccountHealthLog` |
| **Content Vitality** | Engagement & USP | Per post | `POST /marketing/content-asset` | `ContentAsset` |
| **Campaign Tracking** | Campaign performance | Per campaign | Input campaign name + A/B test | Linked to `DailyAdsMetric` |
| **Search Visibility** | SEO & Impressions | Monthly | (via seed / manual input) | `SearchVisibilityMetric` |

### ALUR KERJA UTAMA:
1. **Targeting**: Finance set `MarketingTarget` (budget, leadTarget, revenueTarget) via `/marketing/targets`
2. **Execution**: Jalankan iklan (Meta/TikTok/Google) & produksi konten organik
3. **Data Sync**: Input performa harian via `/marketing/input` → POST ke backend
4. **Audit**: Finance verifikasi data via `/marketing/logs` → `isAudited = true`
5. **Monitoring**: Dashboard `/marketing/dashboard` membaca dari `GET /marketing/analytics`
6. **Handover**: Leads → otomatis ke module BussDev (`SalesLead`)

---

## 2. DATABASE SCHEMA

### 2.1. DailyAdsMetric — `daily_ads_metrics`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `date` | Date | part of unique |
| `platform` | TrafficSource | IG_ADS, TIKTOK_ADS, FB_ADS, GOOGLE_ADS |
| `campaignName` | String? | part of unique |
| `spend` | Decimal(15,2) | |
| `impressions` | Int | |
| `reach` | Int | |
| `clicks` | Int | |
| `leadsGenerated` | Int | |
| `isAudited` | Boolean | default false |
| `auditedById` | UUID? | FK → User |
| `auditedAt` | DateTime? | |
| **Unique** | | `[date, platform, campaignName]` |

### 2.2. AccountHealthLog — `account_health_logs`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `platform` | TrafficSource | IG_ORGANIC, TIKTOK_ORGANIC, FB_ORGANIC |
| `totalFollowers` | Int | |
| `followerGrowth` | Int | |
| `unfollows` | Int | |
| `totalReach` | Int | |
| `profileVisits` | Int | |
| `postsCount` | Int | |
| `storiesCount` | Int | |
| `avgStoryViews` | Int | |
| `likesCount` | Int | |
| `commentsCount` | Int | |
| `savesCount` | Int | |
| `sharesCount` | Int | |
| `weekNumber` | Int | part of unique |
| `year` | Int | part of unique |
| **Unique** | | `[year, weekNumber, platform]` |

### 2.3. ContentAsset — `content_assets`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `publishDate` | Date | |
| `platform` | TrafficSource | any TrafficSource |
| `contentPillar` | ContentCategory | EDUCATIONAL, PROMOTIONAL, ENTERTAINMENT, BEHIND_THE_SCENES |
| `title` | String | |
| `url` | String? | |
| `views` | Int | |
| `likes` | Int | |
| `comments` | Int | |
| `shares` | Int | |
| `saves` | Int | |
| `engagementRate` | Decimal(5,2) | auto-calculated |
| `auditStatus` | String | default "PENDING" |

### 2.4. MarketingTarget — `marketing_targets`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `month` | Int | part of unique |
| `year` | Int | part of unique |
| `leadTarget` | Int | |
| `postTarget` | Int | |
| `revenueTarget` | Decimal(15,2) | |
| `clientAcqTarget` | Int | |
| `sampleTarget` | Int | |
| `spendTarget` | Decimal(15,2) | |
| **Unique** | | `[month, year]` |

### 2.5. SearchVisibilityMetric — `search_visibility_metrics`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `month` | Int | part of unique |
| `year` | Int | part of unique |
| `impressions` | BigInt | |
| `clicks` | BigInt | |
| `avgCtr` | Decimal(5,2) | |
| `avgPosition` | Decimal(3,1) | |
| **Unique** | | `[month, year]` |

### 2.6. Enums

#### TrafficSource
```
IG_ADS, TIKTOK_ADS, FB_ADS, GOOGLE_ADS,
IG_ORGANIC, TIKTOK_ORGANIC, FB_ORGANIC,
LINKTREE, OTHER
```

#### ContentCategory
```
EDUCATIONAL, PROMOTIONAL, ENTERTAINMENT,
BEHIND_THE_SCENES, OTHER
```

---

## 3. BACKEND API ENDPOINTS

### 3.1. Data Entry (POST)

| Endpoint | Roles | Method Service | Body |
|---|---|---|---|
| `/marketing/daily-ads` | SUPER_ADMIN, MARKETING, DIGIMAR | `createDailyAds()` | `{ date, platform, spend, impressions, reach, clicks, leadsGenerated, campaignName? }` |
| `/marketing/weekly-organic` | SUPER_ADMIN, MARKETING, DIGIMAR | `createWeeklyOrganic()` | `{ year, weekNumber, platform, totalFollowers, followerGrowth, unfollows, totalReach, profileVisits, postsCount, storiesCount, avgStoryViews, likesCount, commentsCount, savesCount, sharesCount }` |
| `/marketing/content-asset` | SUPER_ADMIN, MARKETING, DIGIMAR | `createContentAsset()` | `{ publishDate, platform, contentPillar, title, url?, views, likes, comments, shares, saves }` |
| `/marketing/targets` | SUPER_ADMIN, FINANCE | `setMonthlyTarget()` | `{ month, year, leadTarget, postTarget, revenueTarget, spendTarget, clientAcqTarget, sampleTarget }` |

### 3.2. Analytics (GET)

| Endpoint | Roles | Method Service | Query Params | Returns |
|---|---|---|---|---|
| `/marketing/analytics` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getDashboardAnalytics()` | `start?`, `end?` | `{ acquisition, funnel, budget, vitality, platforms, trends, topContent, platformHealth, productPerformance, leadSourceRanking, searchVisibility, financeAudit }` |
| `/marketing/organic-analytics` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getOrganicAnalytics()` | `start?`, `end?` | `{ topContents, vitality, platformHealth }` |
| `/marketing/acquisition-hub` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getAcquisitionHub()` | `month`, `year` | `{ revenue, target, clientAcq, avgCPA, roas }` |
| `/marketing/funnel-efficiency` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getFunnelEfficiency()` | `month`, `year` | `{ leadsReported, leadsQualified, samples, deals, prospects, leadToSampleRate, closingRate }` |
| `/marketing/budget-audit` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getBudgetAudit()` | `start?`, `end?` | `{ totalSpend, totalLeads, totalAcquisitions, totalSamples, costPerLead, costPerSample, costPerAcquisition }` |
| `/marketing/platform-performance` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getPlatformPerformance()` | `start?`, `end?` | `[{ name, spend, impressions, reach, clicks, leads, revenue, roas, cpl, cpc, cpm }]` |
| `/marketing/content-performance` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getContentPerformance()` | `month`, `year` | `{ topContent, aggregatedOrganic }` |
| `/marketing/realized-roi` | SUPER_ADMIN, FINANCE, MARKETING | `getRealizedROI()` | `month`, `year` | `{ realizedRevenue, totalSpend, realizedRoas, paymentCount }` |
| `/marketing/sample-efficiency` | SUPER_ADMIN, MARKETING, COMMERCIAL, PPIC | `getSampleEfficiency()` | — | `{ totalShipped, stuckInTransit, conversionToDeal, avgDaysToFeedback }` |
| `/marketing/targets` | SUPER_ADMIN, MARKETING, COMMERCIAL | `getMonthlyTarget()` | `month`, `year` | `MarketingTarget` or default zeroed |
| `/marketing/comparison` | SUPER_ADMIN, MARKETING, DIGIMAR | `getComparisonData()` | `date`, `type` (ADS/ORGANIC) | raw records for H-1 baseline |

### 3.3. CRUD Logs (GET / PATCH / DELETE)

| Endpoint | Method | Service Method |
|---|---|---|
| `/marketing/logs/ads` | GET | `getDailyAdsLogs()` |
| `/marketing/ads/:id` | PATCH | `updateDailyAds()` |
| `/marketing/ads/:id` | DELETE | `deleteDailyAds()` |
| `/marketing/logs/organic` | GET | `getWeeklyOrganicLogs()` |
| `/marketing/organic/:id` | PATCH | `updateWeeklyOrganic()` |
| `/marketing/organic/:id` | DELETE | `deleteWeeklyOrganic()` |
| `/marketing/logs-content` | GET | `getContentAssetLogs()` |

### 3.4. Audit

| Endpoint | Method | Roles | Service Method |
|---|---|---|---|
| `/marketing/audit-ads` | POST | SUPER_ADMIN, FINANCE | `auditDailyAds(id, isAudited, auditorId)` |

**Audit behavior:**
- Set `isAudited = true/false` pada `DailyAdsMetric`
- **WAJIB** catat ke `SystemOverrideLog` (documentType: 'DAILY_ADS_METRIC', gateType: 'MARKETING_FINANCE_AUDIT')
- Hanya role `FINANCE` / `SUPER_ADMIN` yang bisa audit

---

## 4. FRONTEND PAGES

### 4.1. `/marketing/dashboard` — MarketingDashboardClient

| Aspek | Detail |
|---|---|
| **File** | `frontend/src/app/(dashboard)/marketing/dashboard/MarketingDashboardClient.tsx` |
| **Data source** | `useQuery(["marketing-analytics"])` → `GET /marketing/analytics` |
| **Prefetch** | `dashboard/page.tsx` → `queryClient.prefetchQuery(["marketing-analytics"])` |
| **UI** | **100% TIDAK BOLEH DIUBAH** — semua JSX, className, icon, struktur HTML adalah final |
| **Data fallback** | `DEFAULT_TREND_DATA`, `DEFAULT_PRODUCT_PERFORMANCE`, `DEFAULT_PLATFORM_DATA` — hardcoded original |

**Mapping data API → UI:**

| Section | API Field | Variable |
|---|---|---|
| Stat Card 1 (Acquisition Hub) | `data.acquisition` | `revenue`, `revenueTarget`, `clientAcq`, `avgCPA`, `roas` |
| Stat Card 2 (Funnel Efficiency) | `data.funnel` | `leadsQualified`, `leadToSampleRate`, `prospects`, `closingRate` |
| Stat Card 3 (Budget Audit) | `data.budget` | `totalSpend`, `budgetUsagePercent`, `costPerLead`, `costPerSample` |
| Chart II (Leads & CPL) | `data.trends` | `mapTrends()` → `{ month, leads, cpl }` |
| Chart III (Closing & CPA) | `data.trends` | `mapTrends()` → `{ month, closing, cpa }` |
| Product Performance (Section IV) | `data.productPerformance` | `[{ name, leads, samples, deals, progress }]` |
| Content Vitality (Section V) | `data.vitality` + `data.platformHealth` | `totalPosts`, `postTarget`, `avgEngagement`, `engagementByType`, followers IG |
| Platform Audit (Section VI) | `data.platforms` + `data.platformHealth` | `mapPlatforms()` → `{ summary, growth, retention, granular }` |
| Top Content (Section VII) | `data.topContent` | `mapContentLeaders()` → `[{ title, er }]` |
| Lead Sources (Section VIII) | `data.leadSourceRanking` | `mapLeadSources()` → `[{ name, leads }]` |
| Search Visibility (Section IX) | `data.searchVisibility` | `totalImpressions`, `totalClicks`, `avgCtr`, `avgPosition`, `growth` |

**Key behavior:**
- Jika API loading, tampilkan data fallback (hardcoded original)
- Tidak ada spinner / skeleton tambahan
- Transisi data seamless saat response tiba

### 4.2. `/marketing/input` — MarketingCommandCenter

| Aspek | Detail |
|---|---|
| **File** | `frontend/src/app/(dashboard)/marketing/input/page.tsx` |
| **Tabs** | Paid Analytics, Organic Health, Content Asset, KPI Targets |
| **State** | `adsMatrix`, `organicMatrix`, `contentData`, `targetData` — state lokal |
| **API calls** | 4 POST endpoint (daily-ads, weekly-organic, content-asset, targets) |
| **Comparison** | `GET /marketing/comparison?date=...&type=...` untuk H-1 baseline |
| **Draft recovery** | localStorage key `marketing_draft_{paid\|organic}` |
| **UI** | Boleh ditambah fungsionalitas, **tidak boleh ubah tampilan existing** |

### 4.3. `/marketing/logs` — MarketingLogManager

| Aspek | Detail |
|---|---|
| **File** | `frontend/src/app/(dashboard)/marketing/logs/page.tsx` + `components/marketing/marketing-log-manager.tsx` |
| **Data source** | `useQuery` → `GET /marketing/logs/ads` dan `GET /marketing/logs/organic` |
| **CRUD** | Edit dialog (PATCH), Delete (DELETE), Verify Now (POST audit-ads) |
| **Audit** | Hanya visible untuk role FINANCE / SUPER_ADMIN |
| **Search** | Filter by platform / date |
| **UI** | Boleh ditambah fungsionalitas, **tidak boleh ubah tampilan existing** |

---

## 5. DATA TRANSFORMATION (FRONTEND HELPERS)

Semua helper ada di `MarketingDashboardClient.tsx`:

| Function | Input | Output |
|---|---|---|
| `formatRupiah(n)` | number | `"Rp 3.24 M"`, `"Rp 342.5 Jt"`, `"Rp 28k"` |
| `formatNumber(n)` | number | `"2.4M"`, `"18.4K"`, `"185.3K"` |
| `mapTrends(trends)` | API trends[] | `[{ month, leads, cpl, closing, cpa }]` |
| `mapPlatforms(apiData)` | `{ platforms, platformHealth }` | `PLATFORM_DATA` shape (4 platforms) |
| `getAuditPeriod(apiData)` | any | `"APRIL 2026"` |
| `mapContentLeaders(topContent)` | API topContent[] | `[{ title, er, color }]` |
| `mapLeadSources(sources)` | API leadSourceRanking[] | `[{ name, leads }]` |

---

## 6. GUARD & SECURITY

| Endpoint Group | Minimum Role |
|---|---|
| Data Entry (POST) | DIGIMAR / MARKETING |
| CRUD Logs (GET/PATCH/DELETE) | DIGIMAR / MARKETING |
| Analytics (GET) | COMMERCIAL + |
| Target Setting (POST targets) | FINANCE / SUPER_ADMIN |
| Audit (POST audit-ads) | FINANCE / SUPER_ADMIN |

**Auth mechanism:** JWT token via `Authorization: Bearer <token>`, stored in `localStorage.getItem("token")`.

---

## 7. AUDIT PROTOCOLS & FINANCIAL GATES

### [GATE A] — The Ads Audit Gate
- Setiap input `spend` default `isAudited = false`
- Hanya `FINANCE` / `SUPER_ADMIN` bisa set `isAudited = true`
- Setiap verifikasi dicatat di `SystemOverrideLog` (documentType: 'DAILY_ADS_METRIC', gateType: 'MARKETING_FINANCE_AUDIT')

### [GATE B] — The KPI Target Gate
- `MarketingTarget` hanya bisa diubah oleh `FINANCE` / `SUPER_ADMIN`
- Marketing tidak bisa ubah budget/target sepihak

---

## 8. SEED DATA

### Seed file: `backend/prisma/seed-digital-marketing.ts`

| Data | Records | Scope |
|---|---|---|
| Marketing targets | 2 | Apr & May 2026 |
| Daily ads metrics | 120 | 30 days × 4 platforms (Apr 2026) |
| Account health logs | 36 | 12 weeks × 3 platforms (Feb–Apr 2026) |
| Content assets | 12 | Posts with realistic engagement |
| Search visibility | 3 | Monthly data Feb–Apr 2026 |

**Cara run:**
```bash
npx ts-node --transpile-only prisma/seed-digital-marketing.ts
```

> **Catatan:** Seed konfigurasi (`prisma.config.ts`) mengarah ke `seed-bussdev-granular.ts`. Seed digital marketing harus dijalankan manual.

---

## 9. DASHBOARD KPIs

| KPI | Formula | Target |
|---|---|---|
| Revenue MTD | Sum of `WON_DEAL` sales this month | — |
| ROAS | Revenue / Total Ad Spend | > 4x |
| CPL (Cost Per Lead) | Ad Spend / Leads Generated | < Rp 50k |
| CPA (Cost Per Acquisition) | Ad Spend / Client Acquired | < Rp 500k |
| Lead-to-Sample Rate | Sample / Total Leads | > 20% |
| ER Rate | (Likes+Comments+Shares+Saves) / Reach | > 5% |
| Budget Utilization | Spend / Budget | 80-95% |

---

## 10. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **FINANCE**: `MarketingTarget` (budget & quota)
2. **BD**: Sales leads + revenue — untuk ROAS calculation
3. **CREATIVE**: Content assets untuk publikasi

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **BD**: `SalesLead` (nama, kontak, brand) — prospek baru
2. **FINANCE**: `DailyAdsMetric.spend` — verifikasi pengeluaran
3. **MANAGEMENT**: Acquisition dashboard — health pertumbuhan

---

## 11. CRITICAL RULES FOR AI

**🚫 JANGAN PERNAH:**
1. **Ubah UI marketing dashboard** — semua JSX, className, icon, struktur adalah final
2. **Hapus data fallback** (`DEFAULT_*` constants) — ini safety net saat API down
3. **Ganti nama variable yang direferensi JSX** — `TREND_DATA`, `PRODUCT_PERFORMANCE`, `PLATFORM_DATA`, `PLATFORM_DATA[activePlatform]` adalah binding ke UI
4. **Ubah queryKey** `["marketing-analytics"]` — server prefetch dan client useQuery harus same key
5. **Hapus atau rename endpoint** — semua endpoint di section 3 adalah contract

**✅ BOLEH:**
1. Tambah data transformation helper baru (di luar komponen)
2. Tambah endpoint baru di backend (jangan hapus existing)
3. Tambah validasi / error handling
4. Tambah field di Prisma schema (jangan hapus field existing)
5. Tambah seed data baru

**🔐 ANTI-LOOPING PROTOCOL:**
Jika ada error setelah 3 percobaan perbaikan:
1. STOP dan baca dulu `SOT_DIGIMAR.md`
2. Verifikasi struktur endpoint di controller
3. Verifikasi queryKey frontend
4. Verifikasi field name di Prisma schema
5. Baru lanjut perbaikan

---

## 12. FILE REFERENCE

| File | Path |
|---|---|
| Prisma schema (marketing) | `backend/prisma/schema/marketing.prisma` |
| Prisma enums | `backend/prisma/schema/enums.prisma` |
| Seed digital marketing | `backend/prisma/seed-digital-marketing.ts` |
| Service | `backend/src/modules/marketing/marketing/marketing.service.ts` |
| Controller | `backend/src/modules/marketing/marketing/marketing.controller.ts` |
| Module | `backend/src/modules/marketing/marketing.module.ts` |
| Dashboard client | `frontend/src/app/(dashboard)/marketing/dashboard/MarketingDashboardClient.tsx` |
| Dashboard page | `frontend/src/app/(dashboard)/marketing/dashboard/page.tsx` |
| Input page | `frontend/src/app/(dashboard)/marketing/input/page.tsx` |
| Logs page | `frontend/src/app/(dashboard)/marketing/logs/page.tsx` |
| Log manager | `frontend/src/components/marketing/marketing-log-manager.tsx` |
| API lib | `frontend/src/lib/api.ts` |

---

## 12. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

Semua mutation di MarketingService emit dual events sejak v3.0:

| Event Name | Trigger | Payload |
|------------|---------|---------|
| `marketing.ads.created` | `createDailyAds()` | `{ date, platform, campaignName, spend }` |
| `marketing.ads.audited` | `auditDailyAds()` | `{ id, isAudited, auditorId }` |
| `marketing.ads.updated` | `updateDailyAds()` | `{ id }` |
| `marketing.ads.deleted` | `deleteDailyAds()` | `{ id }` |
| `marketing.organic.created` | `createWeeklyOrganic()` | `{ platform, year, weekNumber }` |
| `marketing.organic.updated` | `updateWeeklyOrganic()` | `{ id }` |
| `marketing.organic.deleted` | `deleteWeeklyOrganic()` | `{ id }` |
| `marketing.content.created` | `createContentAsset()` | `{ id, title, platform }` |
| `marketing.targets.set` | `setMonthlyTarget()` | `{ month, year }` |
| `activity.logged` | All mutations | `{ senderDivision: 'MARKETING' | 'FINANCE', notes, loggedBy }` |
