# SOURCE OF TRUTH (SoT): CREATIVE HUB DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: Brand Identity to Production Reality — ensuring every product is packaged with legal, aesthetic, and functional excellence.

---

## 1. CREATIVE LIFECYCLE (THE DESIGN PIPELINE)

| Phase | System Status (`DesignState`) | Key Action / Event | Mandatory Trigger Action |
|:---|:---|:---|:---|
| **C-1: Briefing** | `INBOX` | Task masuk dari system (trigger G2) | `createTask` (auto from BD) |
| **C-2: Design** | `IN_PROGRESS` | Buat artwork + mockup | `uploadVersion` (Asset Commit) |
| **C-3: Legal Review** | `WAITING_APJ` | APJ review compliance (klaim, INCI, logo) | `apjReview` (PIN Signature) |
| **C-4: Client Review** | `WAITING_CLIENT` | Klien review estetika | `clientReview` (Feedback Log) |
| **C-5: Revision** | `REVISION` | Revisi berdasarkan feedback | `uploadVersion` (v2, v3...) |
| **C-6: Release** | `LOCKED` | Aset siap produksi (Print Ready) + auto-create PO | `lockDesign` (Production Unlock) |

---

## 2. BACKEND API ENDPOINTS

### Creative Module (`/creative`)

All endpoints protected by `JwtAuthGuard` + `RolesGuard`.

| Method | Endpoint | Roles | Service Method | Description |
|--------|----------|-------|----------------|-------------|
| GET | `/creative/board` | SUPER_ADMIN, DIRECTOR | `getBoard()` | Kanban board data with lead info + latest version |
| GET | `/creative/tasks` | SUPER_ADMIN, DIRECTOR | `getAllTasks()` | All tasks with lead + latest version |
| GET | `/creative/available-sales-orders` | SUPER_ADMIN, COMMERCIAL | `getAvailableSalesOrders()` | SOs with PENDING_DP or ACTIVE status |
| POST | `/creative/task` | SUPER_ADMIN, DIRECTOR | `createTask()` | Create new design task |
| PATCH | `/creative/task/:id/version` | SUPER_ADMIN, DIRECTOR | `uploadVersion()` | Upload artwork + mockup (multipart, max 50MB) |
| PATCH | `/creative/task/:id/submit` | SUPER_ADMIN, DIRECTOR | `submitToApj()` | Submit to legal review |
| PATCH | `/creative/task/:id/apj-review` | SUPER_ADMIN, APJ | `apjReview()` | APJ approval with PIN + IP audit |
| PATCH | `/creative/task/:id/client-review` | SUPER_ADMIN, COMMERCIAL | `clientReview()` | Client sign-off → auto PO |
| PATCH | `/creative/task/:id/unlock` | SUPER_ADMIN, DIRECTOR | `unlockTask()` | BusDev override for locked tasks |

**POST /creative/task body:**
```typescript
{ leadId: string; brief: string; soId?: string; taskType?: string }
```

**PATCH /creative/task/:id/apj-review body:**
```typescript
{ status: 'APPROVED' | 'REJECTED'; notes: string; authorId: string; pin: string }
```

---

## 3. OPERATIONAL PROTOCOLS (THE CREATIVE GATES)

### [GATE 1] — The Commercial Lock (Anti-Ghost Project)
- Task desain hanya bisa dibuat jika ada Sales Order (SO) valid (`LOCKED_ACTIVE`)
- Endpoint: `GET /creative/available-sales-orders` hanya tampilkan SO `PENDING_DP` / `ACTIVE`

### [GATE 2] — The APJ/Legal Signature (Compliance Gate)
- Desain dilarang dikirim ke klien jika belum direview APJ
- Verifikasi: PIN bcrypt + IP address tersimpan di `DesignFeedback.signatureHash`
- Final lock membutuhkan APJ approval terlebih dahulu

### [GATE 3] — Versioning Integrity (The 3D Lock)
- Setiap revisi wajib artwork (2D) + mockup (3D)
- Revision cap: max 3 kali. Setelah itu task LOCKED otomatis
- Locked assets tidak bisa diubah tanpa `unlockTask` (BusDev override)

### [GATE 4] — Final Asset Lock (Production Unlock)
- Status `LOCKED` hanya bisa dicapai jika `isFinal = true`
- Auto-generate `PurchaseOrder` (printing PO) saat client approve
- Trigger `bussdevService.checkSalesOrderReadiness()` untuk update SO

---

## 4. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger | Payload |
|------------|------------|---------|---------|
| `creative.update` | uploadVersion, submitToApj, apjReview, clientReview, unlockTask | Any state change | `{ taskId, state }` |
| `creative.task.created` | createTask | New task created | `{ taskId, leadId, soId }` |
| `creative.version.uploaded` | uploadVersion | New artwork version | `{ taskId, versionNumber, artworkUrl }` |
| `creative.task.submitted` | submitToApj | Submitted to Legal | `{ taskId }` |
| `creative.task.apj_reviewed` | apjReview | APJ reviewed | `{ taskId, status, nextState }` |
| `creative.task.locked` | clientReview (APPROVED) | Client approved | `{ taskId, finalArtworkUrl, finalMockupUrl }` |
| `creative.task.rejected` | clientReview (REJECTED) | Client rejected | `{ taskId, notes }` |
| `creative.task.unlocked` | unlockTask | BusDev override | `{ taskId, action }` |
| `activity.logged` | All mutations | Generic audit trail | `{ senderDivision: 'CREATIVE' | 'LEGAL' | 'MANAGEMENT', notes, loggedBy }` |

---

## 5. PAGE SPECIFICATIONS: DESIGN HUB (KANBAN)

### 5.1. KANBAN BOARD
- **6 columns**: INBOX → IN_PROGRESS → WAITING_APJ → WAITING_CLIENT → REVISION → LOCKED
- **Visual Cards**: Thumbnail 3D Mockup, `revisionCount` (X/3), `slaDeadline` indicator (red < 3d)
- **State Matrix**: Pindah kolom → notifikasi SSE ke `/events/creative`

### 5.2. DESIGN HUB DRAWER
- **3 tabs**: Brief, Versions, Feedback
- **Asset Repository**: Link ke Master File (AI/PDF) + Preview Image
- **Technical Print Specs** (`DesignVersion.printSpecs` — Json): `colorProfile`, `materialType`, `finishing`, `dimensions`
- **Feedback History**: Log komentar dengan `fromDivision`, `approvalStatus`, `signatureHash`, `ipAddress`
- **Context Actions**: WAITING_APJ → "Legal Review & Sign", WAITING_CLIENT → "Finalize Client Sign-off"

### 5.3. CREATIVE BOARD HEADER
- **4 KPI cards**: Live Projects (IN_PROGRESS/WAITING_APJ/WAITING_CLIENT), In Revision (REVISION), Ready to Print (LOCKED), Total Breach (isLocked)

---

## 6. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **BD/SALES**: `SalesOrder` (LOCKED_ACTIVE) + `SalesLead` (brand info, designSuggestion)
2. **LEGAL/APJ**: `DesignFeedback` dengan `signatureHash` — approval compliance
3. **R&D**: Ingredient list untuk dicantumkan di kemasan

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **PRODUCTION**: `DesignTask.isFinal = true` + `finalArtworkUrl` → fase Packing bisa mulai
2. **SCM**: `DesignVersion.printSpecs` → spesifikasi material untuk PO ke vendor cetak (auto-generated saat LOCKED)
3. **LEGAL**: `ArtworkReview` — pipeline legal butuh data desain untuk BPOM
4. **CLIENT**: Akses mockup untuk persetujuan estetika

---

## 7. PERFORMANCE METRICS (KPIs)

| KPI | Formula | Target |
|:---|---:|---:|
| Revision Rate | Total revisi / Total proyek | < 3 revisi/proyek |
| Cycle Time | Hari dari INBOX → LOCKED | < 7 hari |
| First Pass Approval | % desain langsung ACC APJ/Klien | > 60% |
| SLA Breach | Jumlah task lewat `slaDeadline` | 0 |
| Client Satisfaction | Rating dari client (post-project) | > 4/5 |

---

## 8. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (creative) | `backend/prisma/schema/creative.prisma` |
| Creative service | `backend/src/modules/creative/creative.service.ts` |
| Creative controller | `backend/src/modules/creative/creative.controller.ts` |
| Creative module | `backend/src/modules/creative/creative.module.ts` |
| Events controller (SSE) | `backend/src/modules/events/events.controller.ts` |
| Frontend Board page | `frontend/src/app/(dashboard)/creative/board/page.tsx` |
| Frontend Board client | `frontend/src/app/(dashboard)/creative/board/CreativeBoardClient.tsx` |
| Frontend KanbanBoard | `frontend/src/app/(dashboard)/creative/board/components/KanbanBoard.tsx` |
| Frontend CreativeBoardHeader | `frontend/src/app/(dashboard)/creative/board/components/CreativeBoardHeader.tsx` |
| Frontend DesignHubDrawer | `frontend/src/app/(dashboard)/creative/board/components/DesignHubDrawer.tsx` |
| Frontend CreateDesignTaskModal | `frontend/src/app/(dashboard)/creative/board/components/CreateDesignTaskModal.tsx` |
