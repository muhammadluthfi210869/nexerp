# Digital Marketing — Integrasi Frontend ↔ Backend

## 🎯 Tujuan

Hubungkan **semua angka output** di dashboard Digital Marketing ke backend, dan hubungkan **input → output** secara end-to-end, **tanpa mengubah 1 inci pun UI yang sudah dirancang**.

---

## 📊 Status Saat Ini

| Area | Status |
|------|--------|
| **`input/page.tsx`** (MarketingCommandCenter) | ✅ 4 endpoint POST sudah terhubung |
| **`logs/page.tsx` + marketing-log-manager** | ✅ CRUD + Audit via TanStack Query |
| **`MarketingDashboardClient.tsx`** | ❌ 100% data statis (~259 data points) — **nol API call** |
| **Backend `/marketing/analytics`** | ✅ 20 endpoint, method `getDashboardAnalytics()` siap |
| **`dashboard/page.tsx`** | ✅ Prefetch `["marketing-analytics"]` tapi **tidak dikonsumsi** client |

---

## 🔷 PHASE 1 — BACKEND

### 1.1 Prisma — Model Baru `SearchVisibilityMetric`

**File:** `backend/prisma/schema/marketing.prisma`

```prisma
model SearchVisibilityMetric {
  id          String   @id @default(uuid())
  month       Int
  year        Int
  impressions BigInt   @default(0)
  clicks      BigInt   @default(0)
  avgCtr      Decimal(5,2) @default(0)
  avgPosition Decimal(3,1) @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([month, year])
  @@map("search_visibility_metrics")
}
```

**Perintah:**
```bash
npx prisma db push
npx prisma generate
```

### 1.2 Seed — Update `seed-digital-marketing.ts`

**File:** `backend/prisma/seed-digital-marketing.ts`

Tambah data `SearchVisibilityMetric` untuk 3 bulan (Februari - April 2026):

| Month | Year | Impressions | Clicks | Avg CTR | Avg Position |
|-------|------|-------------|--------|---------|-------------|
| 2 | 2026 | 1,850,000 | 133,200 | 7.2% | 4.8 |
| 3 | 2026 | 2,100,000 | 159,600 | 7.6% | 4.5 |
| 4 | 2026 | 2,400,000 | 184,800 | 7.7% | 4.2 |

### 1.3 `marketing.service.ts` — 3 Method Baru + Enhance `getDashboardAnalytics`

**File:** `backend/src/modules/marketing/marketing.service.ts`

#### Method Baru #1: `getProductPerformance(startDate, endDate)`

Query `SalesLead` grouped by campaign/source dari marketing channels. Hitung:

| Field | Sumber |
|-------|--------|
| `campaignName` | SalesLead.campaign / source label |
| `leads` | COUNT SalesLead where source IN paidSources |
| `samples` | COUNT SampleRequest terkait |
| `deals` | COUNT SalesLead where status = WON_DEAL |
| `progress` | (deals / leads) * 100 |

Return: `ProductPerformance[]` (5 items max, sorted by deals desc).

#### Method Baru #2: `getLeadSourceRanking(startDate, endDate)`

Query `SalesLead` grouped by `source`:

```ts
const sources = await this.prisma.salesLead.groupBy({
  by: ['source'],
  _count: { id: true },
  where: {
    createdAt: { gte: startDate, lte: endDate },
    source: { not: null },
  },
  orderBy: { _count: { id: 'desc' } },
  take: 5,
});
```

Return: `{ source: string; leads: number }[]`

#### Method Baru #3: `getSearchVisibility(month, year)`

Query `SearchVisibilityMetric` untuk bulan yang diminta + bulan sebelumnya untuk growth:

```ts
const current = await this.prisma.searchVisibilityMetric.findUnique({
  where: { month_year: { month, year } },
});
const previous = await this.prisma.searchVisibilityMetric.findUnique({
  where: { month_year: { month: month - 1, year } },
});
// compute growth percentages
```

Return:
```ts
{
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  growth: {
    impressions: string;    // "+18.4%"
    clicks: string;         // "+4.2%"
  };
}
```

#### Enhance `getDashboardAnalytics()`

Tambahkan 3 method baru ke response object:

```ts
return {
  ...existingResponse,
  productPerformance: await this.getProductPerformance(start, end),
  leadSourceRanking: await this.getLeadSourceRanking(start, end),
  searchVisibility: await this.getSearchVisibility(month, year),
};
```

### 1.4 `marketing.controller.ts` — 1 Route Baru

**File:** `backend/src/modules/marketing/marketing.controller.ts`

| Route | Method | Guard Roles | Service Method |
|---|---|---|---|
| `/marketing/organic-analytics` | `@Get('organic-analytics')` | SUPER_ADMIN, MARKETING, DIGIMAR, COMMERCIAL | `getOrganicAnalytics(start, end)` |

---

## 🔷 PHASE 2 — FRONTEND DASHBOARD

### 2.1 `MarketingDashboardClient.tsx` — Satu-satunya file dashboard yang diubah

**File:** `frontend/src/app/(dashboard)/marketing/dashboard/MarketingDashboardClient.tsx`

#### Prinsip: UI IDENTIK 100%

| ✅ TIDAK berubah (UI) | 🔄 Berubah (data source) |
|---|---|
| Semua JSX elements | `TREND_DATA` → `data?.trends ?? DEFAULT_TREND_DATA` |
| Semua className / styling | `PRODUCT_PERFORMANCE` → `data?.productPerformance ?? DEFAULT_PRODUCT_PERFORMANCE` |
| Semua icon imports | `PLATFORM_DATA` → `data?.platforms ?? DEFAULT_PLATFORM_DATA` |
| Semua struktur div / card | `StatCard` values → `data?.acquisition`, `.funnel`, `.budget` |
| Semua teks label & header | Content Vitality → `data?.vitality` + `data?.platformHealth` |
| Loading skeleton | Top Content → `data?.topContent` |
| Date badge | Lead Sources → `data?.leadSourceRanking` |
| Platform sidebar button | Search Visibility → `data?.searchVisibility` |

#### Detail Perubahan Kode

**a) Tambah imports (baru, di atas komponen):**

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
```

**b) Tambah hook query + data transformation (setelah `activePlatform` state, sebelum `StatCard`):**

```ts
const { data, isLoading } = useQuery({
  queryKey: ["marketing-analytics"],
  queryFn: () => api.get("/marketing/analytics").then(r => r.data),
  staleTime: 2 * 60 * 1000,
});

// Fallback: semua hardcoded original di-rename DEFAULT_*
const DEFAULT_TREND_DATA = [ ... ];  // hardcoded original
const DEFAULT_PRODUCT_PERFORMANCE = [ ... ];  // hardcoded original
const DEFAULT_PLATFORM_DATA = [ ... ];  // hardcoded original

// Data from API with fallback:
const TREND_DATA = data?.trends ?? DEFAULT_TREND_DATA;
const PRODUCT_PERFORMANCE = data?.productPerformance ?? DEFAULT_PRODUCT_PERFORMANCE;
const PLATFORM_DATA = data?.platforms ?? DEFAULT_PLATFORM_DATA;
```

**c) Data transformation helpers (baru, di luar komponen):**

```ts
// ——— Data Mappers ———
function mapAcquisitionHub(acq: AcquisitionHub) {
  return {
    revenue: formatRupiah(acq.revenue),
    revenueProgress: Math.min(Math.round((acq.revenue / acq.target) * 100), 100),
    revenueTarget: formatRupiah(acq.target),
    clientAcq: acq.clientAcq?.toString() || "0",
    clientTrend: ...,
    avgCPA: formatRupiah(acq.avgCPA),
    roas: acq.roas?.toFixed(1),
  };
}

function mapFunnel(funnel: FunnelEfficiency) { ... }
function mapBudgetAudit(budget: BudgetAudit) { ... }
function mapPlatformsWithPeriod(platformPerf: PlatformPerf[], organicHealth: OrganicHealth[]) { ... }
function mapTopContent(contents: ContentItem[]) { ... }
function mapLeadSources(sources: LeadSource[]) { ... }
function mapSearchVisibility(sv: SearchVisibility) { ... }
```

**d) Replace semua reference hardcoded di dalam JSX:**

| Lokasi (line) | Sebelum | Sesudah |
|---|---|---|
| StatCard revenue | `"Rp 3.24 M"` | `acquisition.revenue` |
| StatCard progress | `72` | `acquisition.revenueProgress` |
| StatCard target | `"Rp 4.5M"` | `acquisition.revenueTarget` |
| StatCard client acq | `"42"` | `acquisition.clientAcq` |
| StatCard CPA | `"Rp 1.4M"` | `acquisition.avgCPA` |
| StatCard leads | `"1,240"` | `funnel.leadsQualified` |
| StatCard prospect | `"84"` | `funnel.prospects` |
| StatCard closing rate | `"64.2%"` | `funnel.closingRate` |
| StatCard ad spend | `"Rp 342.5 Jt"` | `budget.totalSpend` |
| StatCard CPL | `"Rp 28k"` | `budget.costPerLead` |
| StatCard cost/sample | `"Rp 145k"` | `budget.costPerSample` |
| Content: "24/30" | hardcoded | `vitality.contentPublished` / `vitality.contentTarget` |
| Content: ER | `"4.2%"` | `vitality.engagementRate` |
| Content: Followers | `"18.4K"` | `platformHealth[INSTAGRAM].followers` |
| Top Content cards | hardcoded | `topContent` array |
| Lead Source cards | hardcoded | `leadSourceRanking` array |
| Search Vis cards | hardcoded | `searchVisibility` object |

**e) Loading behavior:**

- Selama `isLoading === true`: data fallback (hardcoded original) tetap ditampilkan
- Tidak ada spinner / skeleton baru
- Tidak ada conditional rendering based on loading state
- Saat data tiba: React re-render dengan data baru, UI identik

### 2.2 `dashboard/page.tsx` — Tidak ada perubahan

Prefetch `["marketing-analytics"]` sudah benar dan akan digunakan oleh `useQuery` dengan queryKey yang sama (cache hit). Biarkan apa adanya.

---

## 🔷 PHASE 3 — NON-MARKETING BUILD FIXES

File-file berikut perlu diperbaiki agar build lulus, **tanpa mengubah UI**:

### 3.1 R&D Dashboard

**File:** `frontend/src/app/(dashboard)/rnd/dashboard/page.tsx`

- Tambah `title="R&D Intelligence Center"` di `<DashboardShell>`
- Ubah `<StageVisual index={row.stage} />` → `<StageVisual progress={row.stage.toString()} />`

### 3.2 Missing Card Imports

**Files:**
- `frontend/src/app/(dashboard)/bussdev/client-production/page.tsx`
- `frontend/src/app/(dashboard)/bussdev/client-ro/page.tsx`
- `frontend/src/app/(dashboard)/bussdev/client-sample/page.tsx`
- `frontend/src/app/(dashboard)/hr/page.tsx`

**Perubahan:** Tambah `import { Card } from "@/components/ui/card"` di bagian imports.

### 3.3 Warehouse Transfers

**File:** `frontend/src/app/(dashboard)/warehouse/transfers/page.tsx`

**Perubahan:** Rename `TransitStatusCard` → `TransitStatCard` di component definition agar cocok dengan JSX.

### 3.4 Attendance Component

**File:** `frontend/src/components/hr/AttendanceLiveFeed.tsx`

**Perubahan:** Tambah `import { cn } from "@/lib/utils"`.

---

## 🔷 PHASE 4 — VERIFIKASI

| Langkah | Perintah | Expected |
|---------|----------|----------|
| Prisma push | `npx prisma db push` | ✅ Schema updated |
| Prisma generate | `npx prisma generate` | ✅ Client generated |
| Seed | `npx ts-node --transpile-only prisma/seed-digital-marketing.ts` | ✅ 124+ records seeded |
| Backend build | `nest build` | ✅ 0 error |
| Backend TS check | `npx tsc --noEmit` | ✅ 0 error |
| Frontend build | `npm run build` | ✅ Compiled, 0 error |
| Dashboard load | Buka `/marketing/dashboard` | ✅ Data dari API, UI identik |
| Input flow | Isi form → Submit → Cek dashboard | ✅ Data baru muncul |
| Log flow | Buka `/marketing/logs` | ✅ Data CRUD dari API |

---

## ⏱ URUTAN EKSEKUSI

```
1  → Prisma: tambah model SearchVisibilityMetric
2  → Prisma: db push + generate
3  → Seed: update seed-digital-marketing.ts
4  → Service: tambah 3 method baru + enhance getDashboardAnalytics
5  → Controller: tambah route organic-analytics
6  → Backend: build + typecheck
7  → Frontend: MarketingDashboardClient — imports + hooks + transform
8  → Frontend: non-marketing TS fixes (7 file)
9  → Frontend: build + verify
10 → Test end-to-end: input → dashboard → logs
```

---

## 📁 RINGKASAN FILE YANG BERUBAH

| # | File | Perubahan |
|---|------|-----------|
| 1 | `backend/prisma/schema/marketing.prisma` | + model `SearchVisibilityMetric` |
| 2 | `backend/prisma/seed-digital-marketing.ts` | + seed SearchVisibilityMetric (3 bulan) |
| 3 | `backend/src/modules/marketing/marketing.service.ts` | + `getProductPerformance`, `getLeadSourceRanking`, `getSearchVisibility`, enhance `getDashboardAnalytics` |
| 4 | `backend/src/modules/marketing/marketing.controller.ts` | + route `GET /marketing/organic-analytics` |
| 5 | `frontend/src/app/(dashboard)/marketing/dashboard/MarketingDashboardClient.tsx` | + useQuery, data transformation, replace hardcoded **UI identik** |
| 6 | `frontend/src/app/(dashboard)/rnd/dashboard/page.tsx` | + title prop, fix StageVisual |
| 7 | `frontend/src/app/(dashboard)/bussdev/client-production/page.tsx` | + import Card |
| 8 | `frontend/src/app/(dashboard)/bussdev/client-ro/page.tsx` | + import Card |
| 9 | `frontend/src/app/(dashboard)/bussdev/client-sample/page.tsx` | + import Card |
| 10 | `frontend/src/app/(dashboard)/hr/page.tsx` | + import Card |
| 11 | `frontend/src/app/(dashboard)/warehouse/transfers/page.tsx` | rename `TransitStatusCard` → `TransitStatCard` |
| 12 | `frontend/src/components/hr/AttendanceLiveFeed.tsx` | + import cn |
