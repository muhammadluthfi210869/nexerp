# Sales Pipeline Consolidation — Design

**Date:** 2026-09-03
**Status:** Approved (pending writing-plans)
**Owner:** Bussdev
**Related:** `CLAUDE.md`, `MEMORY.md` (Phase 6 E2E green)

## 1. Problem

Klien tersebar di banyak entitas & halaman di Bussdev:

**Entitas Prisma yang merepresentasikan "klien" (4 sumber):**
1. `SalesLead` (bussdev.prisma) — pipeline utama, dengan `WorkflowStatus`
2. `GuestLog` (bussdev.prisma) — buku tamu (visitDate, instansi, GuestCategory)
3. `LeadCapture` (marketing.prisma) — WA landing page capture
4. `Customer` (master module) — master customer

**Halaman frontend yang overlap** (`frontend/src/app/(dashboard)/bussdev/`):
- `pipeline/` + `pipeline-v2/` → 2 versi sales pipeline
- `clients/` + `client-manager/` → 2 versi client list
- `sample-sales/` + `sample-tracking/` → 2 versi sample
- `guest-book/` — berdiri sendiri
- `intake/` — input lead baru

**Sidebar** (`frontend/src/components/layout/Sidebar.tsx`) mendaftarkan Buku Tamu di **2 tempat** (line 84 dan line 300).

**Backend pipeline** (`bussdev/services/pipeline.service.ts → getLeadsByGroup`) hanya membaca `SalesLead` dengan filter status. Lima grup (`guest`/`sample`/`production`/`ro`/`lost`) adalah **label sintetik** dari satu tabel — bukan agregasi dari 4 tabel.

**Dampak:** UI menampilkan klien yang sama di banyak tempat. Sales-pipeline + buku-tamu + sample-tracking + client-manager + clients — 5 surface untuk konsep yang sama. Untuk director (akun zaki) yang melihat flat navbar, semua entri itu tampil; untuk operator Bussdev yang masuk `bussdev/*`, mereka melihat list yang sama berulang.

## 2. Goal

- **Satu route** `/bussdev/pipeline` sebagai satu-satunya entry point sales pipeline.
- Di dalamnya ada **sub-navbar tab**: `Buku Tamu | Sample | RO | Produksi | Lost`.
- Sidebar Bussdev cukup **satu entry**: `Sales Pipeline`.
- Untuk director: sidebar tetap flat, hanya 1 item pipeline.
- `SalesLead` jadi sumber tunggal pipeline. Tidak ada join baru, tidak ada migrasi data.

## 3. Non-Goals

- Tidak mengubah backend service.
- Tidak mengubah schema Prisma.
- Tidak menghapus intake channel (`GuestLog` page, `LeadIntakeForm`, `Master/Customer`) — channel itu tetap jadi cara data masuk.
- Tidak menggabungkan data `SalesLead`/`GuestLog`/`LeadCapture`/`Customer` ke satu tabel.
- Tidak membuat JOIN atau UNION di service layer.
- Tidak menambah field baru di `SalesLead`.

## 4. Design

### 4.1 Arsitektur (yang berubah vs tetap)

**Tetap (tidak diubah):**
- Backend: `bussdev/services/pipeline.service.ts → getLeadsByGroup()` dipakai apa adanya.
- DB schema: `SalesLead`, `GuestLog`, `LeadCapture`, `Customer`.
- Intake channels:
  - `frontend/src/app/(dashboard)/bussdev/guest-book/` (GuestLog input)
  - `frontend/src/app/(dashboard)/bussdev/intake/` (LeadIntakeForm)
  - `frontend/src/app/(dashboard)/master/customers/` (Customer input)
- Module Bussdev lain: `dashboard`, `sales-orders`, `sales-target`, `retur-penjualan`, `down-payment`, `my-performance`, `retention-engine` — tetap berdiri sendiri.

**Berubah (frontend):**
- `frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx` — jadi **satu-satunya** halaman sales pipeline. Di dalamnya ada sub-navbar tab.
- `frontend/src/components/layout/Sidebar.tsx` — hapus entri duplikat Buku Tamu & item pipeline duplikat.
- `frontend/test/components/sidebar-roles.test.tsx` — update struktur test sesuai sidebar baru.
- **5 folder halaman dihapus** (beserta isinya): `pipeline-v2/`, `clients/`, `client-manager/`, `sample-sales/`, `sample-tracking/`.

### 4.2 Komponen

#### Sub-navbar tab di pipeline page

5 tab sesuai 5 group pipeline:

| Tab | Backend call | Filter `WorkflowStatus` |
|---|---|---|
| Buku Tamu | `getLeadsByGroup('guest')` | `NEW_LEAD` |
| Sample | `getLeadsByGroup('sample')` | `CONTACTED`, `NEGOTIATION`, `SAMPLE_REQUESTED`, `SAMPLE_APPROVED` |
| RO | `getLeadsByGroup('ro')` | `WON_DEAL` |
| Produksi | `getLeadsByGroup('production')` | `SPK_SIGNED`, `PRODUCTION_PLAN`, `READY_TO_SHIP` |
| Lost | `getLeadsByGroup('lost')` | `LOST` |

- State: `activeTab` (default `'guest'`).
- Konten per tab: tabel lead (reuse komponen tabel yang sudah ada di `pipeline/`).
- Styling: konsisten dengan DNA "Binary Audit Vision" — dark, glassmorphism, badge status berwarna per stage.

#### Sidebar BUSSDEV (struktur baru)

```
MY DASHBOARD         → /my-dashboard
BUSSDEV              (SUPER_ADMIN, COMMERCIAL, MARKETING, DIRECTOR)
  - Command Center   → /bussdev/dashboard
  - Sales Pipeline   → /bussdev/pipeline     ← SATU entry
  - Lead Intake      → /bussdev/intake
  - Sales Orders     → /bussdev/sales-orders
  - Sales Target     → /bussdev/sales-target
  - Retur            → /bussdev/retur-penjualan
  - DP               → /bussdev/down-payment
  - My Performance   → /bussdev/my-performance
```

**Dihapus dari sidebar:** `Buku Tamu` (entry ke-2), `Sample Tracking`, `Sample Sales`, `Clients`, `Client Manager`, `Pipeline v2` (jika ada sebagai menu). `Lost` tetap jadi tab di pipeline sub-navbar; tidak perlu entri sidebar sendiri.

**Untuk director (zaki):** sidebar Bussdev tetap menampilkan Bussdev group dengan filter role `DIRECTOR`. Karena Bussdev group ada di MODULE_STRUCTURE, item Sales Pipeline muncul. Tidak perlu perlakuan khusus — flat navbar adalah default rendering Sidebar.

### 4.3 Data flow

```
Pipeline page (client component)
  └─ Sub-navbar [Buku Tamu|Sample|RO|Produksi|Lost]
       └─ activeTab → useGetLeadsByGroup(activeTab) → GET /v1/bussdev/pipeline/leads/:group
            └─ backend pipeline.service.getLeadsByGroup(group)
                 └─ prisma.salesLead.findMany({ where: statusFilter(group) })
```

- Tidak ada perubahan backend, tidak ada join baru.
- Tidak ada migrasi data.
- 0 risk terhadap data integrity.

### 4.4 Error handling

- Loading state per tab: skeleton/spinner (reuse DNA loading component).
- Empty state per tab: "Belum ada lead di grup ini" (reuse empty-state pattern).
- Backend error: pesan generic + tombol retry.
- Tidak ada validasi baru (read-only view; data write lewat intake channels yang sudah ada & sudah tervalidasi).

### 4.5 Testing

- **Update** `frontend/test/components/sidebar-roles.test.tsx`: `MODULE_STRUCTURE` harus match struktur sidebar baru (hapus Buku Tamu/sample/duplicate entries).
- **Tambah** 1 E2E test (`frontend/test/e2e/`): login as commercial → navigate to `/bussdev/pipeline` → assert 5 tab ada → klik tiap tab → assert data muncul.
- **Tidak perlu** unit test baru di service (service tidak berubah).

## 5. Files Touched

### Modified
- `frontend/src/components/layout/Sidebar.tsx` — hapus duplikat entri, singleurkan Sales Pipeline entry.
- `frontend/src/app/(dashboard)/bussdev/pipeline/page.tsx` — tambah sub-navbar tab (atau komponen baru).
- `frontend/test/components/sidebar-roles.test.tsx` — update `MODULE_STRUCTURE`.

### Added (komponen baru)
- `frontend/src/components/bussdev/pipeline-tabs.tsx` (atau co-locate di page) — komponen sub-navbar tab.

### Deleted
- `frontend/src/app/(dashboard)/bussdev/pipeline-v2/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/clients/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/client-manager/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/sample-sales/` (folder + isinya)
- `frontend/src/app/(dashboard)/bussdev/sample-tracking/` (folder + isinya)

## 6. Rollout

- 1 PR kecil.
- Tidak perlu feature flag — sub-navbar tab langsung aktif saat merge.
- Reverse-compatible (opsional, batch terpisah): 301 redirect dari `/bussdev/pipeline-v2`, `/bussdev/clients`, `/bussdev/sample-tracking`, dll ke `/bussdev/pipeline?tab=<x>` untuk preserve link luar.

## 7. Risks

- **Risiko 1 (rendah):** link luar atau bookmark yang menunjuk ke 5 route yang dihapus akan 404 sampai redirect dipasang. Mitigasi: redirect bisa dipasang di Next.js `next.config.js` redirects.
- **Risiko 2 (rendah):** test `sidebar-roles.test.tsx` mungkin fail saat merge karena struktur lama. Mitigasi: update test di PR yang sama.
- **Risiko 3 (sangat rendah):** data lead yang sebelumnya muncul di `/bussdev/clients` tapi **bukan** dari `SalesLead` (mis. hanya `Customer` master). Mitigasi: scope "Sales Pipeline" memang SalesLead saja — entri Customer master tetap di halaman `/master/customers` (di luar cakupan).

## 8. Acceptance Criteria

- [ ] `/bussdev/pipeline` bisa dibuka, menampilkan 5 tab di sub-navbar.
- [ ] Tiap tab menampilkan data lead dari `SalesLead` dengan status filter sesuai tabel 4.2.
- [ ] Tidak ada halaman pipeline duplikat yang bisa di-navigate (`/bussdev/pipeline-v2`, `/bussdev/clients`, dll — 404).
- [ ] Sidebar Bussdev hanya menampilkan 1 entry "Sales Pipeline" (untuk role yang punya akses).
- [ ] `frontend/test/components/sidebar-roles.test.tsx` pass dengan struktur baru.
- [ ] E2E test untuk navigasi 5 tab pass.
- [ ] Tidak ada perubahan backend (service & schema).
- [ ] Tidak ada migrasi data.