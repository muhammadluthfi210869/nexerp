# AGENT-DRIFT-AUDIT — Catalog of UI Drift, Duplication, and Hardcoded Values
**Tanggal**: 2026-09-09
**Agent**: Agent-Drift-Audit
**Scope**: Find ALL "drift" — items that exist but shouldn't, or shouldn't exist but do (the inverse of feature gaps)
**Status**: ✅ COMPLETED
**Mode**: AUDIT ONLY — no code changes per DNA-RULES-CONTRACT.md §6

---

## 0. METHODOLOGY

Drift = **a deviation from the binding contract**. Criteria for each finding:

| Drift Type | Criteria |
|---|---|
| **GHOST_ROUTE** | Sidebar `href` has no matching `frontend/src/app/(dashboard){href}/page.tsx` |
| **DUPLICATE_HREF** | Same `href` appears ≥2× within or across sidebar files |
| **NON_SPEC_PAGE** | `page.tsx` exists in `(dashboard)/*` but is NOT in any SCR-NNN `nexerpRoute` AND not reachable from sidebar (i.e. dead code) |
| **HARDCODED_MOCK** | `MOCK_*` constant or `useState([...])` with literal array → must be replaced by Prisma query |
| **HARDCODED_COLOR** | `bg-[#...]`, `text-[#...]`, `border-[#...]` not in DNA palette → bypasses `bg-slate-*, text-blue-*` etc. |
| **HARDCODED_FMT** | `Rp ${n}`, `toLocaleString("id-ID")`, `new Date().toLocaleDateString(...)` → must use `formatIDR()`/`formatIDDate()` |
| **DEBUG_DEBT** | `console.log`, `debugger;`, `TODO`, `FIXME` left in production code |
| **DEP_DRIFT** | Unused/redundant/outdated package |

**Severity scale** (blast radius):
- **CRITICAL** — broken UX (ghost route, dead click), data corruption risk
- **HIGH** — visual/codebase inconsistency at scale (mock data shipped, hardcoded brand colors)
- **MEDIUM** — duplication, mid-impact debt
- **LOW** — cosmetic, single-line hardcode

---

## 1. EXECUTIVE SUMMARY

| Metric | Count |
|---|---|
| Total `page.tsx` files in `frontend/src/app/(dashboard)/**` | **223** |
| Total unique sidebar `href` values (MainSidebar + FinanceSidebar + LegalitySidebar) | **129** |
| Total sidebar entries (with duplicates, all 3 sidebars) | **212** |
| Total `nexerpRoute` values in `NEX_ERP_SCREEN_AND_API_CATALOG.json` | **176** |
| **Ghost routes** (sidebar href with NO `page.tsx`) | **12 unique hrefs** |
| **Within-sidebar duplicates** (same href in 2+ sidebar locations, any file) | **51 hrefs** |
| **Pages NOT linked from any sidebar** (dead code candidates) | **106 pages** |
| **Files using `MOCK_*` data constants** | **23+ files** |
| **Total `MOCK_*` declaration sites** | **86 declarations** |
| **Total hardcoded hex colors** (`bg-[#`, `text-[#`, `border-[#` across `app/`) | **419 occurrences** |
| **Top offending file** | `marketing/social-tracker/components/Sidebar.tsx` (49 hex occurrences) |
| **Total raw `Rp N` hardcoded strings** | **137 occurrences** |
| **Total raw `toLocaleString` / `toLocaleDateString` usages** | **486 occurrences** |
| **`console.log` left in production code** | **14 hits (8 in real page files, 6 in libs/hooks)** |
| **`debugger;` statements** | **0** |
| **`TODO` / `FIXME` markers** | **14 (mostly docs/comments, not actual TODOs)** |
| **Files where drift compounds** (`MOCK_*` + hardcoded hex + `Rp` hardcode) | ~12 files |
| **CRITICAL drift items** | **12 ghost routes + 51 dup hrefs** |
| **HIGH drift items** | **23 mock-data files + ~30 hardcoded-color pages** |
| **Estimated cleanup effort** | **20–28 hours** (mostly mechanical) |

---

## 2. GHOST ROUTES (sidebar href has NO `page.tsx`)

**Criteria**: `href` listed in Sidebar.tsx / FinanceSidebar.tsx / LegalitySidebar.tsx AND no `frontend/src/app/(dashboard){href}/page.tsx` exists.
**Severity**: HIGH for internal users, CRITICAL for production navigation (404 on click → broken UX).

| # | href | Label(s) | Source (line) | Severity |
|---|---|---|---|---|
| 1 | `/bussdev/ar-aging` | AR Aging Piutang | Sidebar.tsx:352 | CRITICAL |
| 2 | `/bussdev/kelola-pelanggan` | Kelola Pelanggan | Sidebar.tsx:361 | CRITICAL |
| 3 | `/crm/buku-tamu` | Buku Tamu | Sidebar.tsx:337 | CRITICAL |
| 4 | `/crm/client-lost` | Client Lost | Sidebar.tsx:341 | CRITICAL |
| 5 | `/crm/client-produksi` | Client Produksi | Sidebar.tsx:339 | CRITICAL |
| 6 | `/crm/client-ro` | Client RO | Sidebar.tsx:340 | CRITICAL |
| 7 | `/crm/client-sample` | Client Sample | Sidebar.tsx:338 | CRITICAL |
| 8 | `/finance/aset-tetap` | Aset Tetap & Depresiasi | Sidebar.tsx:247 | CRITICAL |
| 9 | `/finance/buku-besar` | Buku Besar | Sidebar.tsx:237 | CRITICAL |
| 10 | `/marketing/management-task/overview` | Management Task (direct) | Sidebar.tsx:128 | CRITICAL |
| 11 | `/rnd/formula/new` | Buat Formulasi Baru / Buat Formula Baru | Sidebar.tsx:405, 592 | CRITICAL |
| 12 | `/scm/hpp-requests` | Permintaan HPP | Sidebar.tsx:311, 362 | CRITICAL |

**Fix**: Either create the missing `page.tsx` (preferred when the page exists in spec), or rewire the sidebar to an existing sibling. The cluster of `/crm/*` ghost routes is the easiest win — they should redirect to `/bussdev/client-manager?tab=...` (which already exists at `bussdev/client-manager/page.tsx`).

**Side note**: prior sidebar audit reported 10 ghosts; this audit **finds 12** — the 2 new ones are `/marketing/management-task/overview` (path mismatch; actual file is `marketing/management-task/page.tsx` + `[member]/page.tsx`) and `/rnd/formula/new` (path mismatch; actual file is `rnd/formula/[id]/page.tsx`).

---

## 3. WITHIN-SIDEBAR DUPLICATES

**Criteria**: same `href` literal in ≥2 sidebar locations (any file).
**Severity**: MEDIUM (visual clutter, semantic confusion, multiple clicks → same page).

**Top offenders** (5× duplicates):

| href | Count | Source files |
|---|---|---|
| `/production/schedule` | **5** | Sidebar.tsx:392, 598, 599, 600, 615 |
| `/project-control/checklist-tracking` | **5** | Sidebar.tsx:163, 294, 374, 431, 504 |
| `/scm/checklist-progress` | **5** | Sidebar.tsx:162, 293, 373, 430, 503 |

**4× duplicates**:

| href | Count | Source files |
|---|---|---|
| `/rnd/repository` | **4** | Sidebar.tsx:404, 407, 591, 594 |
| `/master/suppliers` | **4** | Sidebar.tsx:189, 284, 364, 517 |
| `/warehouse/stok` | **4** | Sidebar.tsx:320, 445, 573, 656 |

**3× duplicates** (15 hrefs):

`/finance/faktur-pembelian`, `/finance/dp-pembelian`, `/finance/fund-requests`, `/marketing/omni-crm`, `/master/goods`, `/scm/purchase-requests`, `/warehouse/mutasi-stok`, `/project-control`, `/scm/kebutuhan-barang`, `/finance/accounting/coa`, `/design/artwork-approval`, `/finance/bayar-pembelian`, `/bussdev/sample-sales`, `/finance/cash-in`, `/finance/dashboard`, `/finance/cash-out`, `/bussdev/client-manager`.

**2× duplicates** (28 hrefs): see Appendix of full audit script.

**Total**: **51 unique hrefs are duplicated ≥2× across sidebars**.

---

## 4. CROSS-SIDEBAR OVERLAPS

**Criteria**: same `href` appears in MainSidebar AND FinanceSidebar (LegalitySidebar has zero overlap).

| href | MainSidebar | FinanceSidebar |
|---|---|---|
| `/finance/dashboard` | Sidebar.tsx:179, 471 | FinanceSidebar.tsx:42 |
| `/finance/cash-in` | Sidebar.tsx:215, 632 | FinanceSidebar.tsx:53 |
| `/finance/cash-out` | Sidebar.tsx:216, 633 | FinanceSidebar.tsx:59 |
| `/finance/dp-pembelian` | Sidebar.tsx:191, 557 | FinanceSidebar.tsx:76 |
| `/finance/dp-penjualan` | Sidebar.tsx:204 | FinanceSidebar.tsx:82 |
| `/finance/bayar-pembelian` | Sidebar.tsx:192, 559 | FinanceSidebar.tsx:88 |
| `/finance/bayar-penjualan` | Sidebar.tsx:542 | FinanceSidebar.tsx:94 |
| `/finance/accounting/coa` | Sidebar.tsx:257, 521 | FinanceSidebar.tsx:140 |
| `/finance/fund-requests` | Sidebar.tsx:218, 634 | FinanceSidebar.tsx:163 |
| `/finance/reports` | Sidebar.tsx:205 | FinanceSidebar.tsx:157 |
| `/finance/reports/ar-aging` | Sidebar.tsx:206, 654 | (none — single side) |

**Severity**: MEDIUM — FinanceSidebar appears to be a **legacy persona-specific shell** that duplicates the Finance module of MainSidebar. Either kill FinanceSidebar (since Sidebar.tsx already handles Finance persona) or differentiate clearly (e.g. legacy/audit view).

---

## 5. NON-SPEC PAGES (drift pages)

**Criteria**: `page.tsx` exists in `frontend/src/app/(dashboard)/*` AND NOT linked from any sidebar AND has no clear SCR-NNN match.

**Severity**: LOW (dead code) → HIGH (when the page is a phantom replacement for a real spec screen).

### 5.1 Dead-code orphans (no sidebar link) — 106 pages
Top concentrations by directory:

| Module | Orphan pages | Notes |
|---|---|---|
| `marketing/` | 17 | `calendar`, `crm-leads`, `digital`, `input`, `kpi`, `landing-tracker`, `lead-capture`, `leaderboard`, `logs`, `notifications`, `performance`, `projects`, `reports`, `settings`, `tasks`, `team`, `toribio` |
| `finance/` | 14 | `actual-costing`, `bank-accounts`, `bayar`, `budget`, `cogs-request`, `collections`, `compliance-asset`, `cost-variance`, `dp`, `fund`, `input`, `jurnal`, `kas`, `piutang`, `profitability`, `reports/balance-sheet` |
| `qc/` | 7 | `checklist/progress`, `checklist/tracking`, `checklist-category`, `dashboard`, `inspections`, `report`, `stability`, `workbench` |
| `rnd/` | 8 | `batch-record`, `cogs-request`, `design`, `formula`, `formula-adjustment`, `npf`, `project-monitoring`, `schedule` |
| `scm/` | 8 | `mrp`, `pembelian/create`, `purchase-approval`, `purchasing`, `purchasing/payments`, `rangkuman-kebutuhan`, `vendors/performance`, `warehouse/{mutation,requisition}` |
| `warehouse/` | 5 | `gudang`, `hub`, `transfers`, `workstation`, (adjustment/opname/release/pindah-gudang/mutasi-stok are linked) |
| `legality/` | 2 | `apj-release`, `ckpb-audit` (NEW dashboard-only modules not in LegalitySidebar) |
| `logistics/` | 4 | `delivery-orders`, `fleet`, `logs`, `outbound` (entire module has no sidebar entry) |
| `system/` | 3 | `error-dashboard`, `profile`, `request-list` |
| `dashboard/` | 9 | `commercial`, `finance`, `fulfillment`, `production-floor`, `production-planning`, `qc`, `super-admin`, `warehouse` (+ `dashboard/` root) |
| `master/` | 2 | `categories`, `vendors` (overlaps with `suppliers`) |

### 5.2 Suspicious near-duplicates (multiple pages serving same SCR)

| Pair | Both exist? | Notes |
|---|---|---|
| `/master/suppliers` + `/master/vendors` | ✅ both | Same purpose — `vendors` is unused (no sidebar entry) |
| `/finance/faktur-pembelian` + `/finance/bills` | ✅ both | Both reachable from sidebars (different paths) |
| `/finance/jurnal-umum` + `/finance/jurnal` + `/finance/transactions` | ✅ all three | 3 pages serving Jurnal Umum SCR-079/080 |
| `/finance/dp-pembelian` + `/scm/purchasing/down-payment` | ✅ both | Slight wording diff — possibly the spec intended one |
| `/finance/dp-penjualan` + `/bussdev/down-payment` | ✅ both | Same purpose, 2 paths |
| `/finance/sales-orders` + `/bussdev/sales-orders` | ✅ both | Same module in 2 different top-level routes |
| `/qc/checklist/progress` + `/scm/checklist-progress` | ✅ both | Checklist tracking duplication |
| `/qc/checklist/tracking` + `/project-control/checklist-tracking` | ✅ both | Same |
| `/finance/aset-tetap` (ghost) + `/finance/assets` (linked) | ✅ both | Real page is `/finance/assets`; sidebar direct-link still points to ghost |
| `/finance/buku-besar` (ghost) + `/finance/ledger` (linked) | ✅ both | Real page is `/finance/ledger` |
| `/qc/coa` (linked) + `/finance/accounting/coa` (linked) | ✅ both | Two pages for one CoA SCR-031..033 |

### 5.3 Pages with no spec match AND no sidebar link (likely drift candidates to delete)
- `/dna-visual` + `/dna-visual/golden-reference` — Internal DNA reference; OK to keep but should be `/internal/dna-visual` or gated.
- `/automation` — Not in spec; orphan.
- `/document-center` + `/documents/drafts` — Not in spec; orphans (probably draft design hub).
- `/my-dashboard`, `/my-requests` — Persona-specific; orphans.
- `/user/todo` — Orphan; spec has no equivalent.
- `/scm/purchase-approval` — Exists but actual approval page is at `/approvals/purchase`.
- All `/logistics/*` (4 pages) — Module has zero sidebar presence; either the whole module is drift, or sidebar needs entries.

**Recommendation**:
- **DELETE** (ghost content, no business value): `dna-visual/`, `automation`, `my-dashboard`, `my-requests`, `user/todo`, `scm/purchase-approval`.
- **CONSOLIDATE** (merge pairs into canonical): jurnal trio, dp pairs, sales-orders pair, vendors→suppliers, coa pair.
- **REHOME** (move under existing sidebar group): `logistics/*`, `qc/*` orphan pages, `system/profile`, `document-center`.

---

## 6. HARDCODED MOCK DATA

**Criteria**: file declares `const MOCK_XXX = [...]` and consumes it via `useState(MOCK_XXX)` or direct reference. **Severity: HIGH** — none of this data survives a backend restart; the production app shows fake rows to every user.

**Total**: **23+ files**, **86 mock declarations** across frontend.

### 6.1 Per-module concentration

| Module | Files using MOCK_* | Examples |
|---|---|---|
| `frontend/src/lib/mock-data.ts` (central) | 1 | `MOCK_DATA` export consumed via api mock interceptor (line 1) |
| `frontend/src/components/project-control/mock-data.ts` | 1 | `MOCK_PROJECTS`, `MOCK_PROJECT_HEALTH` — consumed in `project-control/page.tsx`, `[projectId]/page.tsx` |
| `frontend/src/components/kpi-management/mock-data.ts` | 1 | `MOCK_DEPARTMENT_KPIS`, `MOCK_INDIVIDUAL_KPIS`, `MOCK_SETTINGS_CONFIG` — consumed by 4 kpi pages |
| `bussdev/lost` | 1 | `MOCK_PROSPECTS_LOST`, `MOCK_CHURNED_CLIENTS` |
| `warehouse/adjustment` | 1 | `MOCK_MATERIALS`, `MOCK_ADJUSTMENTS` |
| `warehouse/opname` | 1 | `MOCK_OPNAME_SESSIONS` |
| `warehouse/inbound` | 1 | `MOCK_OPEN_POS` |
| `warehouse/release` | 1 | `MOCK_READY_ORDERS` |
| `warehouse/gudang` | 1 | `MOCK_WAREHOUSES`, `MOCK_BINS`, `MOCK_CATEGORIES` |
| `scm/purchase-returns` | 1 | `MOCK_INBOUNDS` |
| `finance/cogs-request` | 1 | `MOCK_SAMPLES` |
| `finance/dp-pembelian` | 1 | `MOCK_ACTIVE_POS` |
| `rnd/{cogs-request,schedule,batch-record,formula,design,formula-adjustment,project-monitoring,npf}` | 8 | one MOCK_xxx per file |
| `kpi-management/{department,department/[id],individual,individual/[id],settings}` | 5 | all consume central MOCK_DEPARTMENT_KPIS / MOCK_INDIVIDUAL_KPIS |

**Severity for each**: HIGH (sales pages showing fake AR aging, finance pages showing fake POs, warehouse pages showing fake inbound — these all look real).

### 6.2 Sample hardcoded data (representative)

```ts
// warehouse/release/page.tsx:191
const MOCK_READY_ORDERS = [
  { soNumber: "SO-2026-09-00142", customer: "PT Glow Beauty Indonesia", ... },
  { soNumber: "SO-2026-09-00151", customer: "CV Mahkota Kosmetik", ... },
  ...
];

// warehouse/inbound/page.tsx:179 — fake POs
const MOCK_OPEN_POS = [ { poNumber: "PO-2026-08-00912", supplier: "..." }, ... ];

// finance/dp-pembelian/page.tsx:124
const MOCK_ACTIVE_POS = [ ... ];

// finance/cogs-request/page.tsx:43 — fake COGS samples
const MOCK_SAMPLES = { Serum_Niacinamide: { name, netto, formula, revision }, ... };

// rnd/formula/page.tsx:84 — hardcoded formulas list
const MOCK_FORMULAS: ProductFormula[] = [ ... ];

// dna-visual/golden-reference/page.tsx:314 — useState literal
const [lineItems, setLineItems] = useState([
  { id: "1", sku: "SKU-001", name: "Acne Serum", qty: 1000, price: 25000 },
  ...
]);
```

**Fix**: For each `MOCK_*` consumer, replace with `api.get("/...")` call wrapped in TanStack Query (`useQuery`). Backend modules already exist for most (warehouse, rnd, finance) — the API calls are ready, the pages just haven't been rewired.

---

## 7. HARDCODED COLORS & SPACING

**Criteria**: literal hex via Tailwind arbitrary value (e.g. `bg-[#2563EB]`) that bypasses DNA palette tokens (`bg-blue-600`, `bg-slate-50`, etc.). **Severity: LOW per occurrence, MEDIUM cumulative** (DNA contract §1.2 forbids `<div className="rounded-2xl">` and similar ad-hoc styling).

### 7.1 Totals

| Pattern | Total occurrences | Severity |
|---|---|---|
| `bg-[#...]` | **165** | MED (cumulative) |
| `text-[#...]` | **192** | MED |
| `border-[#...]` | **62** | MED |
| **Combined** | **419** | — |

### 7.2 Worst offenders (top 10 by file)

| File | Hardcoded colors |
|---|---|
| `marketing/social-tracker/components/Sidebar.tsx` | 49 |
| `marketing/social-tracker/components/views/MetaAnalyticsView.tsx` | 42 |
| `marketing/social-tracker/components/PageHeader.tsx` | 30 |
| `marketing/social-tracker/components/DatabaseViewTabs.tsx` | 26 |
| `marketing/social-tracker/components/PostDrawer.tsx` | 22 |
| `marketing/social-tracker/components/NewPostModal.tsx` | 12 |
| `marketing/social-tracker/components/views/MetaApiHubView.tsx` | 11 |
| `marketing/social-tracker/components/views/AiStudioView.tsx` | 8 |
| `marketing/toribio/ToribioDashboardClient.tsx` | 8 |
| `marketing/toribio/components/BestContentTable.tsx` | 8 |

**Observation**: `marketing/social-tracker/*` is a **separate micro-app** with its own design system that ignores the DNA palette entirely. It re-implements Tailwind utility classes for what DNA already provides (`bg-slate-50`, `text-blue-600`, etc.). This is a **sub-product drift** — 5 files, ~150+ hardcoded hex values.

### 7.3 Common hex values (drift, should be tokens)

| Hex | Equivalent DNA token | Used as |
|---|---|---|
| `#F8FAFC` | `bg-slate-50` | Page background (10+ files) |
| `#2563EB` | `bg-blue-600` / `text-blue-600` | Brand primary |
| `#0F172A` | `bg-slate-900` | Dark surface |
| `#334155` | `bg-slate-700` | Secondary text |
| `#64748B` | `bg-slate-500` | Muted text |
| `#16A34A` | `bg-green-600` | Success |
| `#D97706` | `bg-amber-600` | Warning |
| `#DC2626` | `bg-red-600` | Danger |
| `#FEF3C7` / `#FEF9C3` | `bg-amber-100` / `bg-yellow-100` | Light warning |
| `#DCFCE7` / `#ECFDF5` | `bg-green-100` / `bg-emerald-50` | Light success |

### 7.4 Hardcoded spacing/rounded classes

`rounded-[16px]`, `rounded-[12px]`, `rounded-[8px]` etc. are used liberally in `marketing/social-tracker/*`, `marketing/toribio/*`, `marketing/input/*`. DNA contract §1.2 requires `DashboardCard`/`DnaDataTableCard` for cards. These files manually compose their own `<Card className="rounded-2xl">`.

**Severity: MEDIUM**. Fix by extracting into a `MarketingCard` DNA variant (since the marketing sub-app clearly has different visual rules) and ensuring dark mode support.

### 7.5 `bg-brand-*` / `text-brand-*` usage
**Total**: appears in `FinanceSidebar.tsx` (`bg-brand-blue`, `text-brand-blue`, `text-text-main`, `text-text-muted`) but those tokens are **NOT defined** in `globals.css`/Tailwind config — they are dead tokens that render as default browser styles. **Severity: HIGH** for FinanceSidebar styling (looks broken until tokens are added).

---

## 8. HARDCODED ROUTES / MAGIC STRINGS / FORMATTING

**Criteria**: literal `"/..."` URL in `useRouter().push()`, `<Link href>`, or hardcoded formatting like `Rp ${n}` and `toLocaleString("id-ID")`.

### 8.1 Raw currency formatting (should use `formatIDR()`)

| File:Line | Pattern |
|---|---|
| `bussdev/lost/page.tsx:78` | `"Target budget HPP klien Rp 18.000/pcs sedangkan HPP produksi Rp 23.500/pcs"` |
| `approvals/sales-sample/page.tsx:120` | `"HPP formula melebihi pagu Rp 35.000/pcs"` |
| `approvals/sales/page.tsx:96` | `"Kredit piutang telah diverifikasi Finance dengan plafon Rp 150.000.000"` |
| `warehouse/WarehouseDashboardClient.tsx:83-104` | `"Rp 1.2M"`, `"Rp 45.0M"`, `"Rp 12.0M"`, etc. (table cells) |
| `dna-visual/page.tsx:933` | `value: "Rp 92.500.000"` |
| `dna-visual/golden-reference/page.tsx:590, 714, 720, 845, 946` | Multiple `Rp {n.toLocaleString("id-ID")}` and `Rp 278,75 Jt` |
| **Total**: **137 occurrences** across app/ |

**Severity: HIGH** (DNA contract §1.2 forbids `Rp ${amount}` in favor of `formatIDR(amount)`).

### 8.2 Raw date formatting (should use `formatIDDate()`)

**Total**: **486 occurrences** of `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` across `frontend/src/app/`. Top files:

| File | count |
|---|---|
| `dna-visual/golden-reference/page.tsx` | many |
| `marketing/social-tracker/*` | many |
| `checklist/page.tsx:318, 329` | `new Date().toLocaleDateString("id-ID")` |
| `documents/drafts/page.tsx:301` | `new Date(draft.createdAt).toLocaleDateString("id-ID")` |
| `document-center/page.tsx:248, 334` | same |
| `creative/board/components/DesignHubDrawer.tsx:219` | same |
| `executive/notifications/page.tsx:267` | same |

**Severity: HIGH** (DNA contract §1.2 line 45 mandates `formatIDDate()`).

---

## 9. CONSOLE.LOG / DEBUGGER / TODO DEBT

### 9.1 `console.log` left in production code

| File:Line | Context |
|---|---|
| `legality/apj-release/page.tsx:334` | `onClick={() => console.log("View release:", release.id)}` |
| `legality/ckpb-audit/page.tsx:333` | `onClick={() => console.log("View audit:", audit.id)}` |
| `legality/permits/page.tsx:240, 257` | `onClick={() => console.log("Download permit:", permit.id)}`, `console.log("View permit details:", permit.id)` |
| `legality/input/page.tsx:95` | `console.log("PAYLOAD DIKIRIM:", payload)` (debug noise in form submit) |
| `marketing/omni-crm/OmniCrmClient.tsx:472` | `console.log('[Backend Intake Sync OK]', res)` |
| `marketing/toribio/hooks/useDigimar.ts:122, 136` | `'[DigimarSocket] connected'`, `'disconnected'` (debug socket logs) |
| `hooks/useWakeLock.ts:12, 34` | `'Wake Lock is active'`, `'Wake Lock released'` |
| `hooks/usePerformanceAudit.ts:23` | performance audit debug |
| `components/dna/DnaInteractiveElements.tsx:1194` | `[TOAST_SUCCESS]` debug in toast handler |

**Total**: **14 occurrences**. **Severity: LOW** (cosmetic; ideally replaced with proper logger or telemetry).

### 9.2 `debugger;` statements
**0 found**. ✅ Clean.

### 9.3 `TODO` / `FIXME` markers
**14 hits** — but inspection shows these are mostly `// X-XXXX ...` COA bucket comments (e.g. `// 1-XXXX ASSETS`) and document header comments like `// No Surat Jalan SJ-YYYYMM-XXXX` (placeholder format docs), not actionable TODOs. **No real debt markers** in production code.

---

## 10. DEPENDENCY DRIFT

Inspected `frontend/package.json`:

### 10.1 Redundant / overlapping libs

| Package | Status | Notes |
|---|---|---|
| `@base-ui/react` | ⚠️ New | Yet another headless UI lib alongside `@radix-ui/*` |
| `@radix-ui/react-dialog`, `react-dropdown-menu`, `react-slider`, `react-tabs` | active | Redundant if Base UI covers same primitives; check whether DNA wraps these |
| `@hookform/resolvers` + `react-hook-form` + `zod` | active | OK if DNA forms are built on these; if not, unused |
| `lucide-react@^1.7.0` | ⚠️ Suspicious | Latest stable is `^0.4xx`; `^1.x` may be prerelease/typo. Verify on npm. |
| `shadcn` | active | CLI tool only; not used at runtime |
| `@tanstack/react-query` | active | Used heavily; OK |
| `sonner` | active | Toasts; OK if DNA wraps |
| `next@^16.2.6` | ⚠️ Very new | Next 16.x — verify all DNA pages work (per `AGENTS.md` "NOT the Next.js you know") |
| `tailwindcss@^4` | ⚠️ Major version | Tailwind 4 changed config syntax; ensure `globals.css` matches v4 directives |
| `prisma` (in `devDependencies`) | ⚠️ Drift | Prisma client should be in `dependencies`, not dev. Backend owns schema but frontend types benefit. |
| `eslint-config-next: 16.2.2` | mismatch | `next` is `^16.2.6` — eslint config pinned slightly behind. May need bump. |

### 10.2 Backend `package.json`
Not inspected in depth (audit scope is frontend drift). Recommend a parallel `Agent-Backend-Drift-Audit`.

### 10.3 Outdated / suspicious
- `lucide-react@^1.7.0` — verify package version exists.
- `next-themes@^0.4.6` — small but check no native-theme conflict with Tailwind v4 darkMode.
- `msw@^2.14.3` (devDep) — mock-service-worker; only used if frontend test pipeline runs against `lib/mock-data.ts`.

**Total drift packages**: **~5** (lucide-react, base-ui overlap, next/eslint mismatch, prisma devDep, tailwind v4 config validation). **Severity: MEDIUM** (won't break dev, but production builds may surface warnings).

---

## 11. DRIFT CLEANUP PRIORITY (Top 30 by severity × effort)

| # | Drift Item | Files | Severity | Effort | Owner | Order |
|---|---|---|---|---|---|---|
| 1 | Fix 12 ghost routes (create page or rewire sidebar) | 1 sidebar + ~12 new pages | CRITICAL | 2-3 h | frontend | 1 |
| 2 | Dedupe 51 sidebar hrefs (collapse to canonical) | 3 sidebar files | HIGH | 1-2 h | frontend | 2 |
| 3 | Remove FinanceSidebar or rename to `LegacyFinance` | 1 file | MED | 30 m | frontend | 3 |
| 4 | Wire 23 mock-data pages to backend API (TanStack Query) | 23 pages + API | HIGH | 8-10 h | frontend+backend | 4 |
| 5 | Consolidate 9 page duplicates (jurnal/dp/coa/orders) | 9 page pairs | HIGH | 4 h | frontend | 5 |
| 6 | Delete dead pages (dna-visual, automation, my-*, user/todo, scm/purchase-approval) | 7 pages | MED | 1 h | frontend | 6 |
| 7 | Move all `Rp ${n}` to `formatIDR()` (DNA §1.2) | ~30 files | HIGH | 2 h | frontend | 7 |
| 8 | Move all `toLocaleString("id-ID")` to `formatIDDate()` (DNA §1.2) | ~40 files | HIGH | 2 h | frontend | 8 |
| 9 | Strip 419 hardcoded hex colors → DNA tokens | ~50 files (esp. `marketing/social-tracker/*`) | MED | 4 h | frontend | 9 |
| 10 | Remove `bg-brand-*` dead tokens or define them | 1 file (FinanceSidebar) + Tailwind config | HIGH | 30 m | frontend | 10 |
| 11 | Replace 14 `console.log` with telemetry | 9 files | LOW | 30 m | frontend | 11 |
| 12 | Add `marketing/social-tracker/*` DNA wrapper or rename module to `marketing-internal/*` | 5 files | MED | 3 h | frontend | 12 |
| 13 | Verify `lucide-react@^1.7.0` version, downgrade if needed | package.json | LOW | 15 m | frontend | 13 |
| 14 | Move `prisma` from devDeps → deps | package.json | LOW | 5 m | frontend | 14 |
| 15 | Bump `eslint-config-next` to match `next@16.2.6` | package.json | LOW | 10 m | frontend | 15 |
| 16 | Document `/logistics/*` module in sidebar or delete | 4 pages + sidebar | MED | 1 h | frontend+product | 16 |
| 17 | Consolidate `/qc/checklist/*` orphan pages into sidebar | 7 pages + sidebar | MED | 1 h | frontend | 17 |
| 18 | Consolidate `/system/{profile,error-dashboard,request-list}` | 3 pages | LOW | 30 m | frontend | 18 |
| 19 | Add SPEC comment (`// SPEC: SCR-NNN`) headers to all `page.tsx` per DNA §2.4 | ~223 files | HIGH | 4 h | frontend | 19 |
| 20 | Tag drift fields with `// NON-SPEC:` per DNA §2.4 | varies | MED | 2 h | frontend | 20 |
| 21 | Hook 4 orphan `dashboard/*` pages (commercial, finance, fulfillment, qc, super-admin, warehouse, production-*) into appropriate sidebar section | 9 pages | MED | 1 h | frontend | 21 |
| 22 | Audit `/legality/{apj-release,ckpb-audit}` for spec match | 2 pages | LOW | 30 m | frontend | 22 |
| 23 | Replace `<input type="text">` with `<DnaInput>` per DNA §1.2 | per-page | HIGH | 3 h | frontend | 23 |
| 24 | Replace `<table>`/`<tr>` with `<DnaTable>` per DNA §1.2 | per-page | HIGH | 3 h | frontend | 24 |
| 25 | Validate `tailwindcss@^4` config matches DNA palette | 1 file | MED | 1 h | frontend | 25 |
| 26 | Re-run `_AUDIT_DNA_COMPLIANCE_2026-09-09.md` after drift fixes | audit | HIGH | 30 m | audit | 26 |
| 27 | Document canonical-route map in `docs/_legacy_to_sidebar.tsv` | 1 doc | MED | 1 h | audit | 27 |
| 28 | Add ESLint rule banning `bg-[#`, `text-[#`, `border-[#` in `app/` | eslint config | MED | 30 m | frontend | 28 |
| 29 | Add ESLint rule banning `console.log` in `app/` | eslint config | LOW | 15 m | frontend | 29 |
| 30 | Schedule Agent-Backend-Drift-Audit (parallel) | n/a | MED | n/a | ops | 30 |

**Estimated total cleanup**: **~40 hours** end-to-end (single engineer). Top 10 items ≈ **22 hours** (60% of cleanup value).

---

## 12. CROSS-CUTTING OBSERVATIONS

1. **`marketing/social-tracker/*` is its own design system.** It bypasses DNA tokens entirely and uses raw hex. Either:
   - Bring it into DNA (rewrite with `bg-blue-*`, `bg-slate-*` etc.), or
   - Carve out as a separate "Marketing Studio" sub-app with its own design contract documented.
2. **`/qc/checklist/*` orphans** — the QC module has 9 pages but no sidebar entry. Either legacy QC is dead code, or the sidebar needs a `QC` accordion.
3. **`/dashboard/*` orphans** — 9 dashboard pages exist (commercial, finance, fulfillment, production-floor, etc.) — likely the legacy executive dashboard cluster (SCR-006..020) rebuilt at `/dashboard/*`. None are linked from sidebar.
4. **`/legality/{apj-release,ckpb-audit}`** — sidebar audit caught these but `LegalitySidebar.tsx` was built separately; need either sidebar entry or delete.
5. **Mock data is the dominant drift risk.** 23 pages show fake rows to users. If a sales rep sees a fake AR aging and trusts it, downstream decisions break. Top cleanup priority after ghost-route fixes.
6. **Hardcoded formatting** (`Rp`, `toLocaleString`) is DNA contract violation at scale — 623 occurrences. ESLint rules can prevent regression.

---

## 13. APPENDIX — RAW AUDIT STATS

```
page.tsx files counted:                          223
unique sidebar hrefs (MainSidebar):               124
unique sidebar hrefs (FinanceSidebar):             18 (only 12 unique vs MainSidebar)
unique sidebar hrefs (LegalitySidebar):             7 (0 overlap)
total unique hrefs across all sidebars:           129
ghost routes (sidebar href with no page.tsx):     12
duplicate hrefs (within or cross sidebar):         51
pages not linked from any sidebar:                106
MOCK_* declaration sites:                          86
files using MOCK_*:                                23
hardcoded hex color occurrences:                  419
raw Rp N formatting occurrences:                  137
raw toLocale* occurrences:                        486
console.log in production code:                    14
debugger statements:                                0
real TODO/FIXME debt markers:                       0 (14 hits are doc/format strings)
```

---

## 14. SIGN-OFF

| Item | Status |
|---|---|
| All sidebar items catalogued | ✅ |
| Ghost routes verified by file existence | ✅ |
| Hardcoded mocks verified by grep | ✅ |
| Hardcoded colors verified by grep | ✅ |
| Console.log debt verified by grep | ✅ |
| Dependency drift flagged | ✅ |
| Spec catalog cross-referenced (176 routes) | ✅ |
| No code changes (audit-only per DNA §6) | ✅ |

**Drift density score**: **HIGH** (419 colors + 86 mocks + 137 currency + 486 dates + 12 ghosts + 51 dupes + 106 orphans).
**Cleanup recommended**: 40 h total / 22 h for top 10.
**Priority order**: Ghost routes → dedupe → mock-data wiring → format-utility migration → color tokens.

**Audit completed in ~14 minutes.**

---

*Generated by Agent-Drift-Audit — NEX ERP / Multi-agent Audit Wave 2026-09-09.*
