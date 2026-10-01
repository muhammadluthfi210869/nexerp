# CRUD Surgical Audit — Inventory / Warehouse / Stock Cluster

**Scope:** `frontend/src/app/(dashboard)/warehouse/**` and `frontend/src/app/(dashboard)/inventory/**`
**Backend:** `backend/src/modules/warehouse/**` (there is no `modules/inventory`; the cluster's backend is `modules/warehouse`, 14 files / 3 623 lines)
**Schema:** `frontend/prisma/schema.prisma` + `frontend/prisma/schema/*.prisma` (14-file split, 101 models)
**Audited:** 2026-10-01 · branch `feat/p08-contracts-subject-ownership` · HEAD `07d1cbac`

---

## Method & corrections to the brief's premise

The brief asked me to hunt for *"stock quantity mutation not being transactional with the movement ledger row (partial write on failure)."*

**That specific defect does not exist, and it is worth saying so plainly.** I read every stock-mutating path in the module. `receiveGoods`, `createInbound`, `releaseFromQuarantine`, `approveOpname`, `approveAdjustment`, `createTransferOrder`, `executeTransferOrder`, `releaseMaterial`, `pickBatch`, `handleProductionConsumption` and `handleProductionMaterialReturn` **all** wrap their `materialItem.update` **and** their `inventoryTransaction.create` in the same `prisma.$transaction`. `pickBatch` even takes a row-level `FOR UPDATE` lock first (`warehouse-release.service.ts:445`). A ledger row cannot survive a rolled-back stock change here.

The real defect is the one next door to it, and it is worse: **the two writes are inside the transaction but they disagree.** The `materialItem.stockQty` cache and the sum of the batch ledgers diverge by construction, in eight separate places, because the cache is incremented by the *requested* quantity while the batches are decremented by the *available* quantity. Inventory numbers that disagree with each other are worse than an exception, because nothing ever surfaces the disagreement. See INV-01, INV-03, INV-05, INV-14, INV-32.

Two brief items also resolved differently than expected:

- **Memory: "63 of 107 `_hooks` files are dead."** For *this* cluster the split is clean and the opposite of the repo pattern. All 7 `warehouse/*` pages **do** import their `_hooks` (`inbound/page.tsx:10`, `pindah-gudang/page.tsx:10`, `mutasi-stok/page.tsx:10`, `stok/page.tsx:10`, `opname/page.tsx:10`, `adjustment/page.tsx:10`, `release/page.tsx:11`). All 5 `inventory/*` routes import **nothing** and re-implement the logic inline (1 165 lines of duplicate `useQuery`/`api.*`). The two fossil components in this cluster are `AdjustmentClient.tsx` and `ReleaseClient.tsx`, not the hooks.
- **Schema drift is a live, in-scope hazard.** 111 models exist in the generated Prisma client but in **no** source `.prisma` file, including `MaterialRequisitionHeader`, `MaterialRequisitionItem` and `WarehouseAccess` — all three are load-bearing for this cluster.

Every finding below is **CONFIRMED** unless labelled SUSPECTED. No SUSPECTED items remain; where I could not prove a runtime outcome I stated the code fact and stopped there.

---

## Verdict summary

| Severity | Count |
|---|---|
| Critical Bug | 12 |
| Contract Mismatch | 11 |
| Broken UX State | 3 |
| Missing Validation | 4 |
| Edge Case | 5 |
| **Total** | **35** |

---

# 🔴 CRITICAL BUG

### 📌 Module: [Warehouse / Transfer — `POST /warehouse/transfers/:id/execute`]

#### [INV-01]: Transfer credits the destination with the full quantity after deducting only what the source actually had — stock is created from nothing
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-transfer.service.ts:164-231`
  - Database: `frontend/prisma/schema/warehouse.prisma:341-368` (`TransferOrder`, `TransferOrderItem`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `executeTransferOrder` walks the source's FEFO batches and deducts only what exists (`warehouse-transfer.service.ts:176-196`). `remainingQty` starts at `item.qty` and is reduced by each `deductQty`; if the batches run dry it simply stops — **there is no `if (remainingQty > 0) throw` guard**, unlike its sibling `releaseMaterial` which has exactly that check at `warehouse-release.service.ts:285-289`. Execution then falls through to line 200 and creates the destination batch at **full** `Number(item.qty)` (`:205`), posts a `TRANSFER_IN` ledger row at **full** `qty` (`:216`), and marks the transfer `COMPLETED` (`:235`). A transfer of 500 units against 120 units of real stock permanently adds 380 units of inventory, and both ledger rows agree with each other, so the fraud is invisible to the ledger audit.
  A second, independent defect sits on line 228: `decrement: remainingQty < 0 ? Number(item.qty) : 0`. `remainingQty` can never be negative — it is initialised to `item.qty` and reduced by `Math.min(remainingQty, stock)`, so the guard is dead code and the cache decrement is always `0`.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "userId": "uuid-of-actor" }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "transferNumber": "TRF-...", "status": "COMPLETED", "transferredQty": 500, "shortfall": { "materialId": "uuid", "requested": 500, "available": 120 } } }
    ```
  - Expected: either the transaction aborts with `409 INSUFFICIENT_SOURCE_STOCK` naming the material, or the header is persisted as `PARTIAL` with a per-item `transferredQty`. `COMPLETED` must never be reachable while `remainingQty > 0`.
- **Actionable Execution Plan**:
  - `warehouse-transfer.service.ts:196` — after the batch loop, add the same guard `releaseMaterial` already uses; throw `BadRequestException` naming material, requested and available before any destination write.
  - `warehouse-transfer.service.ts:200-222` — credit the destination with the amount actually deducted (`requestedQty - remainingQty`), not `Number(item.qty)`.
  - `warehouse-transfer.service.ts:228` — delete the dead `remainingQty < 0` ternary and make the intent explicit in a `ponytail:` comment: an inter-warehouse move must not change the global `materialItem.stockQty`, so `decrement: 0` is correct here, but it must be written as a stated no-op rather than a broken guard.
  - `[Verification]` — execute a transfer for 500 against 120 units of source stock. Expect a 409 and a `TransferOrder` row still in `PENDING`, with `material_inventories` unchanged at both ends.

### 📌 Module: [Warehouse / Opname + Adjustment + Release — cross-service journal]

#### [INV-02]: Finance journal entries are written on a second connection, outside the stock transaction — a rollback leaves an orphan JE, a success leaves stock that never moved
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:142-149`, `backend/src/modules/warehouse/services/warehouse-opname.service.ts:341-358`, `backend/src/modules/warehouse/services/warehouse-release.service.ts:303-310`
  - Backend: `backend/src/modules/finance/services/finance-journal.service.ts:463-513` and `:515-548`
  - Database: `frontend/prisma/schema.prisma:1073-1090` (`JournalEntry.adjustmentId`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: All three call sites sit lexically *inside* a `prisma.$transaction(async (tx) => {...})` callback, which reads as transactional and is not. `WarehouseOpnameService.getFinanceService()` resolves `FinanceService` via `ModuleRef`, which injects its **own** `PrismaService` (`finance.service.ts:40`), delegating to `FinanceJournalService`, which issues `this.prisma.journalEntry.create` on a different pooled connection. The `tx` handle is never threaded through.
  Failure modes, both real:
  1. `releaseMaterial` posts the handover JE (`:305`) and *then* writes `tx.productionLog.create` (`:313`). If that insert fails, the stock deduction rolls back and **the JE survives** — the general ledger books a WIP transfer for material that is still on the shelf.
  2. `approveOpname` posts the loss JE (`:144`) and *then* updates the header (`:132` is before, but the `productionLog` equivalent does not exist here; the equivalent exposure is the `updated` write and the event emit). The reverse — JE written, commit rejected on a lock timeout or serialization failure — produces the same orphan.
  Aggravating: `createInventoryAdjustmentJournal` never sets `JournalEntry.adjustmentId` (`:496-510`), so the orphan JE is not merely unbalanced, it is **untraceable back to the stock document** — only a free-text `reference` string `ADJ-OPN-${opnameId.substring(0,8)}` connects them, and that 8-hex-character prefix is not a key.
- **Exact Contract Specification**:
  - Request DTO: (unchanged — this is a write-path defect)
    ```json
    { "opnameId": "uuid", "totalLossValue": 750000, "notes": "Routine Audit" }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "status": "COMPLETED", "journalEntryId": "uuid" } }
    ```
  - Expected: `FinanceJournalService` exposes `createInventoryAdjustmentJournal(data, tx: Prisma.TransactionClient)`; every caller passes its own handle; the returned `journalEntry.id` is written back to `StockOpname.journalEntryId` (the column exists at `warehouse.prisma` `StockOpname.journalEntryId String? @db.Uuid` and is currently never populated).
- **Actionable Execution Plan**:
  - `finance-journal.service.ts:463` and `:515` — accept an optional `tx: Prisma.TransactionClient = this.prisma` as the last parameter and use it for every `this.prisma.*` call in the two bodies.
  - `warehouse-opname.service.ts:144` and `:352`, `warehouse-release.service.ts:305` — pass `tx` explicitly.
  - `warehouse-opname.service.ts:149` and `:357` — set `StockOpname.journalEntryId` / `JournalEntry.adjustmentId` from the returned entry so the link is a FK, not a string prefix.
  - `[Verification]` — force a rollback after the JE write in a test; assert `journal_entries` count is unchanged. Then assert the `journalEntryId` FK round-trips on the opname.

### 📌 Module: [Warehouse / Production consumption — event handler]

#### [INV-03]: Auto-deduction decrements the global stock cache by the full requested quantity with no shortfall check, while the batches are only partially consumed
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-release.service.ts:41-78`
  - Database: `frontend/prisma/schema/warehouse.prisma:285-340` (`InventoryTransaction`, `MaterialInventory`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `handleProductionConsumption` loops the FEFO batches (`:53-72`) and breaks when `remainingQty <= 0`, then falls through to `:74-77` and decrements `materialItem.stockQty` by `Number(item.qty)` — the **requested** amount, unconditionally. There is no `if (remainingQty > 0)` guard here either. If a schedule asks for 300 units and only 200 are on hand in `GOOD` batches, the batches lose 200 and `materialItem.stockQty` loses 300. The cache goes negative, the ledger is short, and `syncStockCache` (INV-05) is the only thing that could ever notice — and it is never called on a schedule.
  This is the single most reachable path in the module: it fires on every `production.schedule_completed` event, needs no user action, and no UI surface exists to see the resulting negative.
- **Exact Contract Specification**:
  - Request DTO: (event payload)
    ```json
    { "scheduleId": "uuid", "materialsConsumed": [{ "materialId": "uuid", "qty": 300 }] }
    ```
  - Expected Response DTO:
    ```json
    { "success": false, "message": "INSUFFICIENT_STOCK", "errors": { "materialsConsumed[0]": ["Requested 300, only 200 available in GOOD batches"] } }
    ```
  - Expected: the whole `$transaction` aborts, matching `releaseMaterial`'s already-correct behaviour at `:285-289`. A production schedule must never be marked `COMPLETED` (`:129-137`) with material it did not actually receive.
- **Actionable Execution Plan**:
  - `warehouse-release.service.ts:72` — insert the shortfall guard immediately after the batch loop, before the `materialItem.update`, throwing on `remainingQty > 0`.
  - `warehouse-release.service.ts:74-77` — derive the decrement from the summed `deductQty` rather than `item.qty`, so the cache and the batches can never disagree even if the guard is later relaxed.
  - `[Verification]` — emit `production.schedule_completed` for a material with insufficient GOOD stock; assert no `material_inventories` row changed, `stockQty >= 0`, and no `PRODUCTION_SCHEDULE` `COMPLETED` transition was logged.

### 📌 Module: [Warehouse / Adjustment — `POST /warehouse/adjustments/:id/approve`]

#### [INV-04]: `approveAdjustment` has no state guard — approving twice increments stock twice and posts two journal entries
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:300-383`
  - Database: `frontend/prisma/schema.prisma:1047-1060` (`StockAdjustment` — **no `status` column**)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `approveOpname` correctly guards with `if (opname.status !== 'DRAFT') throw` (`:83-84`). `approveAdjustment` has no equivalent. It looks the row up, appends a status marker to `notes` (`:308-315`), then unconditionally applies the stock delta (`:317-338`) and posts a finance JE for `OUT` adjustments (`:341-358`). Calling the endpoint twice — trivially reachable: the `@Idempotent()` decorator (controller `:249-251`) only deduplicates a repeated `Idempotency-Key` header, and a second request with a new key or no key passes straight through — increments `stockQty` twice and posts two `ADJ-OPN-…` JEs.
  Root cause is structural, not a missing `if`: **`StockAdjustment` has no `status` column at all** (`schema.prisma:1047-1060` — only `id, date, warehouseId, type, accountId, notes, items, account, warehouse, journalEntries`). Approval state is stored *only* as the substring `[APPROVED]` inside the free-text `notes` column, so there is nothing to guard on and nothing to index. This is what makes INV-06 possible too.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "userId": "uuid-of-approver" }
    ```
  - Expected Response DTO:
    ```json
    { "success": false, "message": "ALREADY_PROCESSED", "errors": { "status": ["Adjustment is already APPROVED"] } }
    ```
  - Expected: first call `200 { "success": true, "data": { "id": "uuid", "status": "APPROVED", "approvedById": "uuid", "approvedAt": "ISO-8601" } }`; every subsequent call `409` with no stock movement and no JE.
- **Actionable Execution Plan**:
  - `frontend/prisma/schema.prisma:1051` — add `status String @default("PENDING")`, `approvedById String? @db.Uuid`, `approvedAt DateTime?` to `StockAdjustment`; mirror into `frontend/prisma/schema/warehouse.prisma` (note the split-schema drift in INV-07 — the model is currently absent from the split file entirely and must be added there).
  - `warehouse-opname.service.ts:301-317` — replace the `notes`-string status with the real column and add `if (adj.status !== 'PENDING') throw new ConflictException(...)` as the first statement after the lookup.
  - `warehouse-opname.service.ts:308-315` — stop mutating `notes` to carry state; write `status`, `approvedById`, `approvedAt`.
  - `[Verification]` — approve the same adjustment twice; assert the second returns 409, `materialItem.stockQty` moved once, and exactly one `journal_entries` row exists.

### 📌 Module: [Warehouse / Ledger integrity — all adjustment paths]

#### [INV-05]: `ADJUSTMENT` ledger rows are written with `Math.abs()`, destroying the sign — and `syncStockCache`, the function whose job is to repair the cache from the ledger, therefore adds every write-off back
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:120-128` (opname), `backend/src/modules/warehouse/services/warehouse-opname.service.ts:325-337` (adjustment)
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:112-132` (`syncStockCache`)
  - Database: `frontend/prisma/schema/warehouse.prisma:285-310` (`InventoryTransaction.quantity Decimal(15,2)`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: In `approveOpname`, `diff` is signed (`:111`) and the cache is correctly incremented with it (`:117`), but the ledger row is created with `quantity: Math.abs(diff)` (`:124`) and `type: 'ADJUSTMENT'`. `approveAdjustment` does the same: the cache gets `adj.type === 'IN' ? qtyNum : -qtyNum` (`:320`) while the ledger gets `Math.abs(qtyNum)` (`:329`) with type `ADJUSTMENT`.
  `syncStockCache` then reconstructs the balance by summing the ledger (`:117-124`):
  ```ts
  if (['INBOUND', 'ADJUSTMENT', 'RETURN'].includes(t.type)) return acc + Number(t.quantity);
  else if (['OUTBOUND', 'DISPOSAL'].includes(t.type))    return acc - Number(t.quantity);
  ```
  Every write-off is stored as a positive `ADJUSTMENT`, so the watchdog **adds the entire loss back** to `stockQty`. The repair tool does not detect drift — it manufactures it. The same reducer ignores `INTERNAL_MOVE` entirely, which is correct for a global total, but that is the only type it gets right by accident.
  Compounding: `syncStockCache` has no controller route and zero callers — `WarehouseService.syncStockCache` (`warehouse.service.ts:78-80`) is dead. So drift is never detected in production *and* the detector is wrong if anyone ever wires it up.
- **Exact Contract Specification**:
  - Request DTO: (unchanged)
    ```json
    { "opnameId": "uuid", "items": [{ "materialId": "uuid", "systemQty": 100, "actualQty": 92 }] }
    ```
  - Expected Response DTO (ledger row for the 8-unit loss):
    ```json
    { "success": true, "data": { "id": "uuid", "materialId": "uuid", "type": "DISPOSAL", "quantity": "-8.00", "referenceNo": "OPN-..." } }
    ```
  - Expected: `syncStockCache(materialId)` returns the same value as `materialItem.stockQty` for every material that has never been hand-edited.
- **Actionable Execution Plan**:
  - `warehouse-opname.service.ts:124` and `:329` — write the signed value. For a decrease use `type: 'DISPOSAL'` (already a member of `TransactionType`, `enums.prisma:434-441`); for an increase use `ADJUSTMENT`. Alternatively keep `ADJUSTMENT` and add a `direction` column — but changing the type is the smaller diff and needs no migration.
  - `warehouse-stock.service.ts:117-124` — add a unit test asserting a `DISPOSAL` row of `8.00` reduces the computed total, not increases it. Pin the enum members explicitly rather than relying on the `else if` fallthrough.
  - `warehouse-stock.service.ts:112` — either expose `syncStockCache` as `GET /warehouse/stock-cache/:materialId` or delete it and the facade delegation at `warehouse.service.ts:78-80`. Leaving a wrong, unreachable reconciliation function next to a drifting cache is the worst of both.
  - `[Verification]` — approve an opname with `actualQty < systemQty`, then call `syncStockCache`; assert the returned balance equals the `stockQty` the approval wrote.

### 📌 Module: [Warehouse / Adjustment read — `GET /warehouse/adjustments`]

#### [INV-06]: Approval status and document number are derived by substring-matching free-text `notes`; multi-item adjustments silently report only the first item
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:211-243`
  - Database: `frontend/prisma/schema.prisma:1047-1060` (`StockAdjustment.notes String?`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `getAdjustments` does not return the row; it returns a projection invented at read time:
  - `adjNumber: \`ADJ-${adj.id.slice(0, 8).toUpperCase()}\`` (`:226`) — a **fabricated document number**, not persisted, not unique, and not stable if the id scheme ever changes. No adjustment can be referenced by this number anywhere.
  - `status: adj.notes?.includes('[APPROVED]') ? 'APPROVED' : ...` (`:234-238`) — approval state read out of a text column. An operator who edits notes to add context silently un-approves a posted adjustment; a notes field containing the literal word in prose reads as approved.
  - `materialName: adj.items[0]?.material?.name` and `qty: Number(adj.items[0]?.qty || 0)` (`:227-232`) — **multi-item adjustments report only the first line.** A 5-line write-off displays as a 1-line write-off, with the correct total nowhere. `createAdjustment` genuinely creates one item (`:268-272`), so this is latent today — but the schema is `items StockAdjustmentItem[]` and `approveAdjustment` already iterates all of them (`:318-338`), so the first multi-line write-off will be under-reported.
  - `type: adj.type === 'IN' ? 'CORRECTION' : 'WRITE_OFF'` (`:228`) — the schema stores `'IN' | 'OUT'`; `'DISPOSAL'` and `'WRITE_OFF'` are both flattened to `WRITE_OFF` on the way in (`:256-259`) and cannot be told apart on the way out.
  This endpoint is the sole read path for two frontend routes (`inventory/stock-adjustment:84` and `warehouse/adjustment` via `AdjustmentClient:47`), both of which render the fabricated `adjNumber` as the user-facing document ID.
- **Exact Contract Specification**:
  - Request DTO: (none currently; add `?page=&pageSize=&status=&type=`)
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "items": [ { "id": "uuid", "adjNumber": "ADJ-2026-000123", "status": "PENDING", "type": "WRITE_OFF", "warehouseName": "Gudang Utama", "date": "2026-10-01", "notes": "Sisih shrink batch 42", "lines": [ { "materialId": "uuid", "materialName": "Resin A", "qty": "-12.00", "unit": "kg" } ] } ], "meta": { "page": 1, "pageSize": 20, "totalCount": 0, "totalPages": 0 } } }
    ```
  - Expected: `adjNumber` is a persisted `String @unique`; `status` is a persisted column; `lines` carries every `StockAdjustmentItem`.
- **Actionable Execution Plan**:
  - `frontend/prisma/schema.prisma:1047` (and `frontend/prisma/schema/warehouse.prisma`, where the model is missing) — add `adjNumber String @unique`, `status String @default("PENDING")`, `approvedById String? @db.Uuid`, `approvedAt DateTime?`. This is the same migration as INV-04; do them together.
  - `warehouse-opname.service.ts:224-242` — return the row with `items` intact; delete the projection. Derive nothing from `notes`.
  - `warehouse.controller.ts:235-239` — accept `page`/`pageSize`/`status`/`type` and return the `meta` envelope so the frontend can paginate (currently there is no pagination anywhere in this module — see INV-23).
  - `[Verification]` — create a 3-line adjustment, approve it, and confirm the response carries three `lines` and a stable `adjNumber` that survives an unrelated `notes` edit.

### 📌 Module: [Warehouse / Requisition — `POST|GET|PATCH /warehouse/requisitions`]

#### [INV-07]: `MaterialRequisitionHeader` exists only in the generated Prisma client, in no source `.prisma` file — the next `prisma generate` deletes the model and breaks compilation of four endpoints
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/requisition.service.ts:24, 47, 59, 92`
  - Backend: `backend/src/modules/warehouse/dto/requisition.dto.ts:12, 49`
  - Database: `frontend/prisma/schema/*.prisma` (14-file split — model absent from all of them)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The schema was split into 14 files under `frontend/prisma/schema/`. The generated client at `backend/node_modules/.prisma/client/schema.prisma` holds **212** models; the concatenation of the source files holds **101**. The set difference is **111 models present in the client but absent from source**, and the warehouse cluster depends on three of them: `MaterialRequisitionHeader`, `MaterialRequisitionItem` and `WarehouseAccess`.
  Verified: `grep -rn 'MaterialRequisitionHeader\|RequisitionHeaderStatus' frontend/prisma/ --include=*.prisma` returns **nothing**, while `grep -c MaterialRequisitionHeader backend/node_modules/.prisma/client/index.d.ts` returns 29. Every line of `RequisitionService` therefore compiles today only because the generated artifact is stale. The moment anyone runs `prisma generate`, `tx.materialRequisitionHeader` becomes a TypeScript error and `requisition.dto.ts` fails to import `RequisitionHeaderStatus` from `@prisma/client` — the module stops building, not just the four routes.
  This is consistent with the recorded local state (212 tables, zero `_prisma_migrations`, built with `db push`): the database was pushed from the old monolith, and the source split silently dropped models along the way.
  Same exposure for `WarehouseAccess`, which `warehouse-transfer.service.ts:51` and `warehouse-stock.service.ts:152` both `findUnique` on — the module's entire warehouse-scoped permission model rests on a table that is not in source.
- **Exact Contract Specification**:
  - Request DTO (already correct, `requisition.dto.ts:27-46` — the only properly validated DTO in the module):
    ```json
    { "fromWarehouse": "uuid", "toWarehouse": "uuid", "requestDate": "2026-10-01", "notes": "optional", "items": [ { "materialId": "uuid", "qty": 10, "notes": "optional" } ] }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "reqNumber": "REQ-2026-0001", "status": "PENDING", "fromWh": { "id": "uuid", "name": "Gudang Utama" }, "toWh": { "id": "uuid", "name": "Gudang Produksi" }, "items": [ { "materialId": "uuid", "material": { "id": "uuid", "name": "Resin A", "unit": "kg" }, "qty": 10 } ] } }
    ```
- **Actionable Execution Plan**:
  - `frontend/prisma/schema/warehouse.prisma` — restore `model MaterialRequisitionHeader` and `model MaterialRequisitionItem` (field-for-field from `backend/node_modules/.prisma/client/schema.prisma`, which is the only surviving definition), plus `WarehouseAccess` wherever it belongs.
  - `frontend/prisma/schema/enums.prisma` — restore `RequisitionHeaderStatus`.
  - Run `prisma generate` and reconcile the remaining 108 drift models **before** merging anything else that touches this cluster; this is repo-wide, not warehouse-only, so it needs an owner.
  - `docs/ROUTE_MAP.md` — no change needed; the routes are already listed.
  - `[Verification]` — `npm --prefix backend run typecheck` passes **after** a fresh `prisma generate`, and `POST /warehouse/requisitions` round-trips against the local DB.

### 📌 Module: [Warehouse / Release — `GET /warehouse/release-requests` + `POST /warehouse/release/:workOrderId`]

#### [INV-08]: The release page reads three fields the endpoint does not return and sends a `woNumber` where a UUID is required — the route renders a `TypeError` and its action 500s
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/warehouse/release/ReleaseClient.tsx:62, 75, 84`
  - Backend: `backend/src/modules/warehouse/warehouse.service.ts:174-184`
  - Backend: `backend/src/modules/warehouse/services/warehouse-release.service.ts:207`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Two independent contract breaks on one page.
  **(a) Read.** `getReleaseRequests` returns `workOrder.findMany({ include: { lead: true } })` — the payload has `id, woNumber, stage, targetCompletion, lead{…}`. `ReleaseClient` immediately does `requests.filter(r => r.materials.some(...))` (`:75`), `r.materials.reduce(...)` (`:76`) and `r.relNumber` / `r.productName` (`:88`). `materials` is `undefined` on every row, so `r.materials.some` throws `TypeError: Cannot read properties of undefined (reading 'some')` on first render. The page does not render at all.
  **(b) Write.** `executeMutation` posts to `/warehouse/release/${woNumber}` (`:62`) and `handleExecute` passes `req.woNumber` (`:84`). The controller binds `@Param('workOrderId')` (`warehouse.controller.ts:126`) and the service does `tx.workOrder.findUnique({ where: { id: workOrderId } })` (`warehouse-release.service.ts:207`) — `id` is `@db.Uuid`. Passing a business number yields Prisma `P2023`, surfaced as a 500.
  Note that `ReleaseClient.tsx` is itself a fossil: `release/page.tsx:11` imports `useReleaseOperations` and never renders `<ReleaseClient/>`. So the broken page is not even the one users see — which is why this has survived.
- **Exact Contract Specification**:
  - Request DTO: `POST /warehouse/release/:workOrderId` where the path param is the **UUID**:
    ```json
    {}
    ```
  - Expected Response DTO for the read:
    ```json
    { "success": true, "data": [ { "id": "uuid", "woNumber": "WO-2026-0042", "productName": "Sabun 100ml", "relNumber": "REL-2026-0007", "status": "WAITING", "materials": [ { "materialId": "uuid", "status": "SHORTAGE", "available": "120" } ] } ] }
    ```
  - Expected: the service must `include` the BOM (`lead.sampleRequests[billOfMaterials]`) and the ledger totals the UI reads, or the UI must stop reading them. Pick one; do not leave it split.
- **Actionable Execution Plan**:
  - `warehouse.service.ts:175-183` — extend the `include` to carry the materials array the KPI and filter need, and map the result into an explicit `ReleaseRequestDto` with `relNumber`, `productName`, `status` and `materials` rather than leaking a raw Prisma row.
  - `ReleaseClient.tsx:84` — pass `req.id`, not `req.woNumber`.
  - `ReleaseClient.tsx` — **delete it.** It is 286 lines of duplicate logic with no importer; the live path is `useReleaseOperations`. Keeping it means the next fix lands in the wrong file.
  - `[Verification]` — open `/warehouse/release`; expect the KPI row to render real numbers. Execute a release; expect 200 and `stockQty` to drop by the BOM quantity.
  - Note: fix the read before the write. A page that throws on render cannot exercise its own action, so a write-only fix would be untestable.

### 📌 Module: [Warehouse / Inbound — `POST /warehouse/inbounds`]

#### [INV-09]: The inbound form fabricates `materialId`, `quantity`, `batchNumber` and `expiryDate` for any row it cannot resolve — and reports success
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/warehouse/inbound/_hooks/useInboundOperations.ts:396-405`
  - Backend: `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:141-238`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The payload builder substitutes silently for every field:
  ```ts
  materialId: mat?.id || it.id || "00000000-0000-0000-0000-000000000000",
  quantity:   Number(it.qtyGood || it.qtyReceived || 1),
  batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
  expiryDate:  it.expiryDate || "2028-12-31",
  ```
  The `materialId` fallback is the nil UUID, which violates the `InboundItem.materialId` FK → Prisma `P2003` → a 500 with a raw driver message, and because the whole `Promise.all`-free `await api.post` is wrapped in one `try`, the user sees *"Gagal Menyimpan GRN"* with no indication of which line was bad.
  The other three are worse, because they succeed. A line the operator left without a batch number is received under a **lot number derived from the current millisecond timestamp**; a line without an expiry is received as good until **2028-12-31**. Both then drive FEFO ordering (`:169-177`, `warehouse-release.service.ts:236-244`) and the ageing report (`warehouse-stock.service.ts:399-415`), so a fabricated 2028 expiry permanently masks the material from the expiring-soon watch. `quantity: … || 1` means a line whose quantities are all zero is received as 1 unit.
- **Exact Contract Specification**:
  - Request DTO — every field required, no defaults, and the server rejects rather than substitutes:
    ```json
    { "poId": "uuid", "receivedAt": "2026-10-01T09:00:00Z", "items": [ { "materialId": "uuid", "quantity": 120, "batchNumber": "LOT-88213", "expiryDate": "2027-03-01" } ] }
    ```
  - Expected Response DTO on a bad line:
    ```json
    { "success": false, "message": "Validation failed", "errors": { "items[0].materialId": ["materialId is required and must be a known material UUID"] } }
    ```
- **Actionable Execution Plan**:
  - `useInboundOperations.ts:396-405` — drop all four `||` fallbacks; disable the submit control and show a per-row validation message when `materialId`, `batchNumber` or `expiryDate` is blank. The backend already enforces the last two (`warehouse-inbound.service.ts:155-161`); the client must stop manufacturing inputs that bypass the intent of that check.
  - `warehouse-inbound.service.ts:141-151` — add a DTO (`CreateInboundDto` with nested `InboundItemDto`, `@IsUUID` / `@IsNumber` / `@IsISO8601`) and bind it at `warehouse.controller.ts:229`. Today the body is `data: any` and the global `ValidationPipe` is a complete no-op (INV-15).
  - `[Verification]` — submit a line with a blank material; expect a 400 naming `items[0].materialId`, no `warehouse_inbounds` row, and no `material_inventories` row.

### 📌 Module: [Inventory / Stock Adjustment — `POST /warehouse/adjustments`]

#### [INV-10]: Multi-line stock adjustment is submitted as N independent parallel POSTs — a failure halfway through leaves a committed partial write
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-adjustment/page.tsx:254-268`
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:245-298`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: 
  ```ts
  await Promise.all(formData.items.map((it) => api.post("/warehouse/adjustments", {...})));
  ```
  Each POST is its own `StockAdjustment` header plus its own `StockAdjustmentItem`, in its own `prisma.$transaction` on the server (`warehouse-opname.service.ts:253`). A 5-line adjustment where line 4 fails a DB constraint leaves lines 1-3 committed as three separate, independently approvable adjustment documents. The user sees a single error toast, and the on-screen list (now 3 rows long after invalidation at `:269`) does not match the 5 lines they entered. The toast at `:266` claims *"berhasil disimpan dan dibukukan"* only on full success, but nothing prevents the partial state from existing, and nothing reconciles it.
  This is the partial-write defect the brief predicted — it is simply located in the **frontend's** request fan-out rather than in a server-side transaction boundary, which is why the server-side transaction audit came back clean.
- **Exact Contract Specification**:
  - Request DTO — one document, many lines:
    ```json
    { "warehouseId": "uuid", "type": "WRITE_OFF", "accountId": "uuid", "notes": "Sisih shrink", "items": [ { "materialId": "uuid", "qty": 12, "reason": "Rusak" } ] }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "adjNumber": "ADJ-2026-000123", "status": "PENDING", "lineCount": 5 } }
    ```
  - Expected: all five lines in one `StockAdjustment`, or none.
- **Actionable Execution Plan**:
  - `stock-adjustment/page.tsx:254-268` — replace the fan-out with a single `api.post("/warehouse/adjustments", { …, items: formData.items.map(...) })`.
  - `warehouse-inbound.service.ts:245-252` — widen `createAdjustment` to accept `items[]` and create them in one `items: { create: [...] }` (the sibling `createInbound` at `:180-187` already demonstrates the pattern). One `await`, one transaction, one document.
  - `stock-adjustment/page.tsx:256` — once multi-line is supported, send the client's `systemQty` too. Today the backend never learns what the system believed, so the adjustment is an unauditable arbitrary delta (this is the structural reason INV-06's `items[0]` limitation is only latent).
  - `[Verification]` — submit 5 lines with the 3rd referencing an unknown material; assert zero `stock_adjustments` rows and zero `stock_adjustment_items` rows, and a 400 naming `items[2].materialId`.

### 📌 Module: [Inventory / Stock Opname — `POST /warehouse/opname`]

#### [INV-11]: The opname form hardcodes `picId: "SYSTEM"` and a `materialId` fallback of `"MAT-01"` — both are sent into `@db.Uuid` columns, so creating a stock opname from the UI always 500s
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-opname/page.tsx:238-240`
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:31-73`
  - Database: `frontend/prisma/schema/warehouse.prisma:369-390` (`StockOpname.picId String @db.Uuid`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: 
  ```ts
  picId: "SYSTEM",
  ...
  materialId: it.materialId || (catalogMaterials[0]?.id as string) || "MAT-01",
  ```
  `StockOpname.picId` is `String @db.Uuid` and NOT NULL. `"SYSTEM"` is not a UUID → Postgres rejects the cast with `22P02`, Prisma maps it to `P2023`, the global exception filter returns a 500, and the catch at `:263-268` shows the driver message. **The `inventory/stock-opname` create flow cannot succeed at all.** The second fallback compounds it: a line with no material selected is silently attributed to the *first material in the catalog* (or the literal string `"MAT-01"`), so the opname would record a variance against a material nobody counted.
  The correct value is available and unused — the authenticated user. The controller already receives it (`warehouse.controller.ts:380` uses `req.user.id` for requisitions); `createOpname` simply never threads it through, and `@Roles` does not supply it.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "warehouseId": "uuid", "notes": "Stock opname fisik gudang", "items": [ { "materialId": "uuid", "systemQty": 100, "actualQty": 98 } ] }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "opnameNumber": "OPN-2026-000045", "status": "DRAFT", "approvalStatus": "WAITING", "pic": { "id": "uuid", "fullName": "Budi Santoso" }, "items": [ { "materialId": "uuid", "systemQty": "100.00", "actualQty": "98.00", "difference": "-2.00" } ] } }
    ```
  - Expected: `picId` is the JWT subject. The server rejects a request whose item `materialId` is absent; it never substitutes.
- **Actionable Execution Plan**:
  - `warehouse.controller.ts:192` — `createOpname(@Body() data: CreateOpnameDto, @Request() req)` and pass `req.user.id` as `picId`, exactly as `createRequisition` does at `:378-382`. Remove `picId` from the client contract entirely so it cannot be spoofed.
  - `stock-opname/page.tsx:238-240` — delete both `picId` and the `"MAT-01"` fallback; block submit until every line has a material.
  - `warehouse-opname.service.ts:31-36` — add `CreateOpnameDto`; validate `items` is non-empty and `systemQty >= 0`. Today an empty `items: []` creates a valid, empty, approvable opname that contributes `totalLossValue = 0` and therefore never trips the Rp 500 000 threshold at `:96`.
  - `[Verification]` — submit a 2-line opname; expect 201 with a real `pic.fullName`, and `StockOpname.picId` equal to the JWT subject in the DB.

### 📌 Module: [Warehouse / Picking, Release, Transfer — quantity sign]

#### [INV-12]: No endpoint validates that `quantity` is positive — a negative value increments stock instead of deducting it
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-release.service.ts:356-487`
  - Backend: `backend/src/modules/warehouse/services/warehouse-transfer.service.ts:66-101`
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:293-319`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Every stock-decrement path checks *sufficiency* but never *sign*. `validateFefoPick` guards `if (Number(targetBatch.currentStock) < data.quantity)` (`:375`) — with `quantity = -100` this is `120 < -100`, false, so it passes. `pickBatch` then runs `currentStock: { decrement: -100 }` (`:459`), which Prisma executes as `currentStock + 100`: the batch gains 100 and `materialItem.stockQty` gains 100 (`:464`), and a ledger row is posted as `type: 'OUTBOUND', quantity: -100` (`:467-477`). The `FOR UPDATE` lock at `:445` makes the write serialise correctly — it just serialises the wrong operation. `remainingBatchStock: Number(batch.currentStock) - data.quantity` (`:484`) reports the inflated figure back, so the response confirms the success.
  `validateHandover` has the same gap (`:180`). `createTransferOrder`'s availability check `if (Number(material.stockQty) < item.qty)` (`:96`) likewise passes on a negative `qty`, and `TransferOrderItem.qty` is `Decimal(15,2)` with no check constraint.
  Root cause is the same as INV-15: the controller binds inline object types (`@Body() body: { materialId: string; batchId: string; quantity: number }`, `warehouse.controller.ts:306-313`) which the `ValidationPipe` skips entirely because there is no DTO class to reflect over. `@Min(0.01)` is one decorator away.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "materialId": "uuid", "batchId": "uuid", "quantity": 25, "referenceNo": "SO-2026-0042" }
    ```
  - Expected Response DTO on a negative:
    ```json
    { "success": false, "message": "Validation failed", "errors": { "quantity": ["quantity must be greater than 0"] } }
    ```
  - Expected: `400`, not a successful stock increase. The same rule must hold on `POST /warehouse/picking/validate`, `POST /picking/execute`, `POST /validate-handover`, `POST /transfers` and every `items[].qty` in `POST /inbounds`, `POST /opname` and `POST /adjustments`.
- **Actionable Execution Plan**:
  - `backend/src/modules/warehouse/dto/` — add `PickBatchDto` (`@IsUUID` ×2, `@IsNumber`, `@Min(0.0001)`, `@IsString` referenceNo), `FefoValidateDto`, `HandoverDto`, `CreateTransferOrderDto` and `TransferItemDto` (`@Min(0.0001)` on `qty`).
  - `warehouse.controller.ts:295, 305, 105, 151, 192, 229, 245` — replace every `@Body() data: any` and inline body type with the matching DTO. This single change closes INV-12, INV-15 and most of INV-09's server half.
  - `warehouse-release.service.ts:375` and `:451`, `warehouse-transfer.service.ts:96` — add a defensive `if (data.quantity <= 0) throw new BadRequestException(...)` so the service is safe even when called internally.
  - `[Verification]` — `POST /warehouse/picking/execute` with `quantity: -100`; assert 400 and that `material_inventories.currentStock` is unchanged.

# 🟠 CONTRACT MISMATCH

### 📌 Module: [Warehouse / Inbound — `POST /warehouse/inbounds/:id/release`]

#### [INV-13]: QC rejection does not reject — items marked `REJECT` still increment available stock and still post an `INBOUND` ledger row
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:262-334`
  - Database: `frontend/prisma/schema/enums.prisma:228-232` (`QCStatus { GOOD, QUARANTINE, REJECT }`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The method correctly computes the good/reject split for the PO at `:262-279` — `isReject` yields `good: 0, reject: qty` — and correctly refuses to post `qtyBagus` for rejects at `:344-349`. Then it ignores that determination entirely for the stock effect. `:317-320` increments `materialItem.stockQty` by `item.qtyActual` for **every** item regardless of `qcStatus`, and `:322-333` posts `type: 'INBOUND', quantity: item.qtyActual` for every item. Worse, the batch branch at `:283-300` matches on `qcStatus: 'QUARANTINE'` and flips the matched batch to `qcStatus: 'GOOD'` — so a rejected line's quarantined batch is promoted to sellable stock, with its quantity untouched.
  A 100-unit receipt where 60 are rejected credits 100 units of available stock. `getStockSummaryByBahanType` (`warehouse-stock.service.ts:518-522`) would report it as 100 `totalBagus` and 0 `totalReject`, contradicting the PO which the same transaction wrote as `qtyReject: 60`.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "performedBy": "uuid-of-qc-inspector" }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "inboundNumber": "GRN-2026-0001", "status": "APPROVED", "releasedCount": 2, "goodQty": 40, "rejectQty": 60 } }
    ```
  - Expected: only `qcStatus !== 'REJECT'` lines increment `materialItem.stockQty`, are promoted to `GOOD`, and post `INBOUND`. Rejects post a `DISPOSAL`/scrap row and move the batch to a rejected state.
- **Actionable Execution Plan**:
  - `warehouse-inbound.service.ts:281-334` — branch the whole per-item block on `item.qcStatus === 'REJECT'`: skip the cache increment, skip the `GOOD` promotion, and post a separate reject-scrap ledger row instead of `INBOUND`.
  - `warehouse-inbound.service.ts:292-300` — narrow the `findFirst` so a `REJECT` line cannot match a `QUARANTINE` batch it is about to promote; key the lookup on the batch seeded by this specific `inbound.items[].id` rather than on `notes: { contains: 'GRN:<number>' }` (see INV-31).
  - `[Verification]` — release a GRN with 40 good and 60 reject; assert `materialItem.stockQty` moved by 40, the good batch is `GOOD`, the reject batch is `REJECT`, and `po_items.qtyBagus = 40 / qtyReject = 60`.

### 📌 Module: [Warehouse / Multi-warehouse — `MaterialInventory`]

#### [INV-14]: `MaterialInventory` has no `warehouseId` — transfers are not warehouse-scoped, and the per-warehouse catalog filter silently hides most lots
- **Target Files**:
  - Database: `frontend/prisma/schema/warehouse.prisma:312-340` (`MaterialInventory` — `locationId String? @db.Uuid` only)
  - Backend: `backend/src/modules/warehouse/services/warehouse-transfer.service.ts:167-174, 200-210`
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:29-39`
  - Backend: `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:208-219, 303-313`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Warehouse ownership of stock lives only indirectly, through `MaterialInventory.locationId → WarehouseLocation.warehouseId`, and `locationId` is **nullable**. Three writers never set it: `createInbound` seeding quarantined batches (`warehouse-inbound.service.ts:208-219`), `executeTransferOrder` creating the destination batch (`:200-210`), and `releaseFromQuarantine`'s fallback branch (`:303-313`).
  Consequences, all confirmed:
  1. **Transfers draw from the wrong warehouse.** The source batch query at `:167-174` filters on `materialId`, `currentStock > 0` and `qcStatus: 'GOOD'` — and nothing else. `transfer.sourceWarehouseId` is used only as a label in the ledger's `warehouseId` field (`:190`). A transfer "Gudang A → Gudang B" will happily consume lots physically sitting in Gudang C, because the model cannot tell them apart.
  2. **`getCatalog(warehouseId)` returns an incomplete picture.** The filter at `warehouse-stock.service.ts:32-37` is `inventories: { some: { location: { warehouseId } } }`. Every lot seeded by inbound, transfer or quarantine release has `locationId = null`, so it matches no warehouse and disappears from every warehouse-scoped catalog query.
  3. **`/warehouse/stok` filters by warehouse and silently shows nothing**, because the lots it is meant to show are the ones with no location.
- **Exact Contract Specification**:
  - Request DTO: `GET /warehouse/catalog?warehouseId=uuid&page=1&pageSize=50` →
    ```json
    { "success": true, "data": { "items": [ { "id": "uuid", "name": "Resin A", "stockQty": "120.00", "lots": [ { "id": "uuid", "batchNumber": "LOT-88213", "warehouseId": "uuid", "currentStock": "120.00", "qcStatus": "GOOD" } ] } ], "meta": { "page": 1, "pageSize": 50, "totalCount": 0, "totalPages": 0 } } }
    ```
  - Expected: every `MaterialInventory` row resolves to exactly one warehouse; the transfer's source-batch query is constrained to `sourceWarehouseId`.
- **Actionable Execution Plan**:
  - `frontend/prisma/schema/warehouse.prisma:312` — add `warehouseId String @db.Uuid` to `MaterialInventory` with `@@index([warehouseId])`; backfill from `location.warehouseId` and reject orphans. This is the enabling change for INV-01's correctness as well.
  - `warehouse-transfer.service.ts:167-174` — add `warehouseId: transfer.sourceWarehouseId` to the `where` clause once the column exists.
  - `warehouse-inbound.service.ts:208` and `:303`, `warehouse-transfer.service.ts:200` — set `warehouseId` on every `materialInventory.create` in the module.
  - `warehouse-stock.service.ts:32-37` — filter on `inventories: { some: { warehouseId } }` instead of the `location` join, so location-less lots are never invisible.
  - `warehouse.controller.ts:50` — plumb `page`/`pageSize` through `getCatalog`; it is currently an unpaginated `findMany` over every non-deleted material plus every lot (INV-23).
  - `[Verification]` — create a GRN, then query `/warehouse/catalog?warehouseId=<that warehouse>`; the new lot must appear. Execute an A→B transfer with a lot in C; C's lot must be untouched.

### 📌 Module: [Warehouse / All POST endpoints]

#### [INV-15]: No DTO on any write endpoint — the global `ValidationPipe` is a no-op against `@Body() data: any`
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:105, 151, 192, 229, 245` (and inline body types at `:115, 136, 171, 208, 255, 272, 296, 307, 329`)
  - Backend: `backend/src/main.ts:52-59`
  - Backend: `backend/src/modules/warehouse/warehouse.service.ts:112, 116, 134, 148, 164, 216, 220, 224` (facade re-widens to `any`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The global pipe is configured correctly and strictly — `whitelist: true, transform: true, forbidNonWhitelisted: true` (`main.ts:52-59`) — but it reflects over the parameter's *design:type* and **skips any parameter typed `Object`**, which is what `data: any` and inline object literals both are at runtime. Result: all eleven warehouse write endpoints accept arbitrary bodies. `createTransfer` reads `data.createdById` from an unvalidated body (`:152`); `updateBatchStatus` takes `status: any` (`:136`); `createOpname` takes whatever `items` shape arrives; `executePicking` trusts `quantity` (INV-12).
  `whitelist: true` also means the *absence* of stripping is not a leak here, but the absence of `forbidNonWhitelisted` enforcement is: a client can post `{ "role": "SUPER_ADMIN" }` to any of these and it is silently ignored rather than rejected. The module's own `CreateRequisitionDto` (the one exception, `requisition.dto.ts:27-46`) proves the pattern works — it is simply not used anywhere else.
  The facade compounds it: `WarehouseService` re-widens every typed sub-service parameter to `data: any` (`:112-226`), so even the one typed path loses its type at the boundary.
- **Exact Contract Specification**:
  - Request DTO: `POST /warehouse/transfers` with an unknown key must be **rejected**, not ignored:
    ```json
    { "sourceWarehouseId": "uuid", "destWarehouseId": "uuid", "items": [ { "materialId": "uuid", "qty": 10 } ], "priority": "HIGH" }
    ```
    ```json
    { "success": false, "message": "Validation failed", "errors": { "priority": ["property priority should not exist"] } }
    ```
  - Expected Response DTO: every write endpoint returns `400` with the `errors` map; none return `500` for a malformed body.
- **Actionable Execution Plan**:
  - `backend/src/modules/warehouse/dto/` — add `CreateTransferOrderDto`, `CreateOpnameDto`, `CreateInboundDto` (+ `InboundItemDto`), `CreateAdjustmentDto`, `UpdateBatchStatusDto` (`@IsEnum(QCStatus)` — this also fixes INV-27), `ValidateHandoverDto`, `PickBatchDto`.
  - `warehouse.controller.ts` — replace all ten `data: any` / inline body types with these classes.
  - `warehouse.service.ts:112-226` — change the pass-through signatures from `data: any` to the DTO types. The sub-services already declare precise inline types (e.g. `warehouse-inbound.service.ts:141-151`); the facade is throwing them away.
  - `[Verification]` — `POST /warehouse/adjustments` with `{ "materialId": "uuid", "qty": "abc", "type": "NOT_A_TYPE" }`; expect 400 with field errors, not a 500.

### 📌 Module: [Warehouse / Audit trail — `InventoryTransaction`, `StockOpname`]

#### [INV-16]: Three audit columns exist and are never written — `actorId`, `approvalPin`, `journalEntryId`
- **Target Files**:
  - Database: `frontend/prisma/schema/warehouse.prisma:285-310` (`InventoryTransaction.actorId String? @db.Uuid`), `:369-390` (`StockOpname.approvalPin String?`, `journalEntryId String? @db.Uuid`)
  - Backend: every `inventoryTransaction.create` in the module
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The schema anticipated a proper audit trail and the code did not deliver it. All eleven `inventoryTransaction.create` call sites write the free-text `performedBy` string (`'SYSTEM_PRODUCTION'`, `'QC_INSPECTOR'`, `'WAREHOUSE_STAFF'`, `userId`) and leave `actorId` null. So the FK-identified actor is permanently absent from the entire stock ledger — the one place where "who moved this stock" is the only question that matters.
  `StockOpname.approvalPin` is never written either. `approveOpnameWithPin` (`warehouse-opname.service.ts:168-197`) verifies the PIN against `User.managerPin` and discards it, so there is no record that escalation ever occurred — only `approvedById` is set. And `journalEntryId` is never populated even though the column exists specifically to link the opname to the JE that INV-02 creates.
  That last one matters beyond tidiness: `createInventoryAdjustmentJournal` builds its reference as `ADJ-OPN-${opnameId.substring(0,8)}` (`finance-journal.service.ts:498`), and `approveAdjustment` passes a **StockAdjustment id** through the parameter named `opnameId` (`warehouse-opname.service.ts:353`). Opname-driven and adjustment-driven journals are indistinguishable in the ledger, and a UUID prefix is not a key.
- **Exact Contract Specification**:
  - Expected ledger row:
    ```json
    { "materialId": "uuid", "inventoryId": "uuid", "type": "ADJUSTMENT", "quantity": "8.00", "actorId": "uuid-of-actor", "performedBy": "Budi Santoso", "referenceNo": "ADJ-2026-000123" }
    ```
  - Expected opname after escalation: `{ "id": "uuid", "approvalStatus": "APPROVED", "approvedById": "uuid", "journalEntryId": "uuid", "approvalPinVerifiedAt": "ISO-8601" }` — store *that* a PIN was verified, never the PIN itself.
- **Actionable Execution Plan**:
  - `warehouse-release.service.ts:60, 260, 507, 519`, `warehouse-opname.service.ts:120, 325`, `warehouse-inbound.service.ts:98, 322`, `warehouse-transfer.service.ts:183, 211` — populate `actorId` from the JWT subject on every `inventoryTransaction.create`. Thread the actor down from the controller; for `@OnEvent` handlers, resolve the system principal deliberately rather than leaving it null.
  - `warehouse-opname.service.ts:186-194` — add `approvalPinVerifiedAt DateTime?` to `StockOpname` and set it. Do **not** store the PIN.
  - `warehouse-opname.service.ts:144, 352` — write the returned JE id into `StockOpname.journalEntryId`, and pass the correct discriminator so opname and adjustment journals are distinguishable.
  - `[Verification]` — assert every `inventory_transactions` row for a human action has a non-null `actorId` resolving to a `users` row.

### 📌 Module: [Warehouse / Dashboard — `GET /warehouse/stats`]

#### [INV-17]: Dashboard stats are cached for 30 s in-process, never invalidated, mixed string/number, and gate a business decision
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:17-18, 171-177, 290-316`
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:536-564` (`checkCapacityForNewDeal`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `getDashboardStats` writes a mutable field on a singleton provider with a 30 s TTL and **no invalidation hook** — none of the eleven stock-mutating paths clears it. A receipt posted at t=0 is invisible to the dashboard for up to 30 s, and in a multi-instance deployment each instance holds its own copy, so two users can see different numbers on the same screen.
  The response is also untyped: `capacity.utility` is a **string** (`capacityUtility.toFixed(1)`, `:292`) while `turnover.ratio` and `risk.criticalItems` are **numbers**; `valuation.total/raw/pack/box/label` are strings in **billions** (`:297-301`, divided by `1e9`) while `risk.deadStock` is a raw rupiah integer (`:308`). Nothing in the contract says so, and a consumer doing `stats.valuation.total + 1` gets a string.
  Most seriously, `checkCapacityForNewDeal` (`:536-564`) — which raises `CRITICAL` and emits `ACTIVITY_EVENT` `STOCK_CHECK_SHORTAGE` (`:566-583`) — reads `Number(stats.capacity.utility)` **from that same 30 s cache**. A capacity decision that gates a commercial workflow is being made on a number that may be half a minute stale and is not shared between instances.
- **Exact Contract Specification**:
  - Expected Response DTO (all numerics, all rupiah, no hidden scaling):
    ```json
    { "success": true, "data": { "capacity": { "utilityPercent": 87.4, "auditAccuracy": 98.2, "fifoScore": 9.8 }, "valuation": { "total": 1284000000, "rawMaterial": 900000000, "packaging": 384000000 }, "turnover": { "ratio": 4.2, "healthScore": 71 }, "risk": { "deadStockValue": 210000000, "criticalItemCount": 3, "averageQuarantineAgeDays": 4.2 }, "computedAt": "2026-10-01T09:00:00Z" } }
    ```
- **Actionable Execution Plan**:
  - `warehouse-stock.service.ts:290-312` — return numbers, not formatted strings; drop the `1e9` scaling and let the client format. Add `computedAt` so the UI can show staleness.
  - `warehouse-stock.service.ts:17-18, 314` — either clear `statsCache` from an `@OnEvent('warehouse.stock.adjusted')` / `warehouse.stock.moved` handler, or delete the cache. Given the decision it gates, deleting it is the safer default; add the event hook if `/warehouse/stats` proves slow under load.
  - `warehouse-stock.service.ts:544-545` — make `checkCapacityForNewDeal` read capacity directly rather than through the dashboard cache.
  - `[Verification]` — post an adjustment and immediately re-read `/warehouse/stats`; `computedAt` must be later and the valuation must reflect it.

### 📌 Module: [Warehouse / Audit dashboard — `GET /warehouse/audit`]

#### [INV-18]: Four dashboard sections are hardcoded to zero/empty and render as real metrics
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:450-478`
  - Frontend: `frontend/src/app/(dashboard)/warehouse/components/AuditTables.tsx`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `getAuditGranular` returns `jalurB.handover: 0` (`:459`), `jalurC: { orderProc: 0, shipping: 0, delivered: 0, velocity: 0 }` (`:462`), `soFulfillment: []` (`:465`) and `riskLoss: []` (`:466`) as literal constants. The same shape is hardcoded at `:462` for a whole pipeline stage. `AuditTables.tsx` renders these as ordinary KPI tiles and tables, indistinguishable from the eight that *are* computed. A user reading "Order Processing 0, Shipping 0, Delivered 0" concludes the pipeline is idle; in fact it was never measured. This is worse than an error state because it is confidently wrong.
  It also drags the health score down: `getDashboardStats` computes `healthScore` from `accuracy`, `turnoverHealth` and `criticalHealth` (`:286-288`) — the two components that *are* computed — so the defect is contained there, but the audit view itself is a fiction for a third of its width.
- **Exact Contract Specification**:
  - Expected Response DTO — either measure it or mark it unavailable, never zero:
    ```json
    { "success": true, "data": { "jalurC": { "orderProc": 12, "shipping": 9, "delivered": 7, "velocity": 7.5 }, "soFulfillment": [ { "soNumber": "SO-2026-0042", "fulfilled": 7, "total": 9 } ], "riskLoss": [ { "materialName": "Resin A", "lossValue": 750000 } ] } }
    ```
    — or, if genuinely unbuilt, return `null` for the section and have the client render an explicit "belum diimplementasikan" state.
- **Actionable Execution Plan**:
  - `warehouse-stock.service.ts:459, 462, 465-466` — either populate these from the real tables (`sales_orders`, `shipments`) or return `null` and document the section as unimplemented in `OWNER.md`.
  - `AuditTables.tsx` — render `null` sections as an explicit unavailable state, distinct from a legitimate zero.
  - `[Verification]` — with data present in `shipments`, `/warehouse/audit` `jalurC.shipping` must be non-zero; with the section unbuilt it must be `null`, never `0`.

### 📌 Module: [Warehouse / Stock summary — `GET /warehouse/stock-summary`]

#### [INV-19]: The `groupBy` query parameter is accepted, named `_groupBy`, and ignored
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:407-416`
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:500-530`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `@Get('stock-summary')` declares `@Query('groupBy') _groupBy?: string` — the underscore prefix marks it deliberately unused — and passes nothing to the service. `getStockSummaryByBahanType()` takes no arguments and hardcodes the grouping (`:512`, `inv.material.bahanType || 'LAINNYA'`). A caller sending `?groupBy=warehouse` or `?groupBy=qcStatus` gets a 200 with a `bahanType` breakdown and no indication the request was disregarded.
  Secondary defect in the same method: `entry.count += 1` (`:523`) runs for **every** lot including `QUARANTINE`, while `totalBagus`/`totalReject` only accumulate for `GOOD`/`REJECT`. So `count` exceeds `totalBagus + totalReject` and the two columns cannot be reconciled by the reader.
- **Exact Contract Specification**:
  - Request DTO: `GET /warehouse/stock-summary?groupBy=bahanType|warehouse|qcStatus` (one of, validated with `@IsIn`; 400 otherwise)
    ```json
    { "success": true, "data": [ { "bahanType": "RAW_MATERIAL", "warehouseId": "uuid", "qcStatus": "GOOD", "totalGood": 1200.5, "totalQuarantine": 300.0, "totalReject": 0, "lotCount": 14 } ] }
    ```
- **Actionable Execution Plan**:
  - `warehouse.controller.ts:414` — rename to `groupBy`, validate with `@IsIn(['bahanType','warehouse','qcStatus'])`, and pass it through.
  - `warehouse-stock.service.ts:500-530` — branch the aggregate on the parameter; add `totalQuarantine` so the three stock states are explicit and `lotCount` reconciles.
  - `[Verification]` — `?groupBy=qcStatus` returns rows keyed by QC status; `?groupBy=bogus` returns 400.

### 📌 Module: [Frontend / Inventory cluster — React Query cache]

#### [INV-20]: One endpoint, three query keys, and two invalidations that target a key nothing declares
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-adjustment/page.tsx:81, 93, 105, 269-270`
  - Frontend: `frontend/src/app/(dashboard)/inventory/mutation/page.tsx:86, 98, 110, 263-264`
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-opname/page.tsx:83, 95, 107, 247`
  - Frontend: `frontend/src/app/(dashboard)/warehouse/adjustment/AdjustmentClient.tsx:45, 53`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: React Query invalidation is key-exact. The same backend endpoint is cached under a different key in every surface:
  | Endpoint | Surfaces | queryKey |
  |---|---|---|
  | `GET /warehouse/adjustments` | `inventory/stock-adjustment:81`, `warehouse/adjustment/AdjustmentClient:45` | `warehouse-adjustments` **and** `adjustments` |
  | `GET /warehouse/warehouses` | `inventory/stock-adjustment:93`, `inventory/mutation:98`, `inventory/stock-opname:95` | `warehouse-warehouses` ×2 **and** `inventory-warehouses` |
  | `GET /warehouse/catalog` | `inventory/stock-adjustment:105`, `inventory/mutation:110`, `inventory/stock-opname:107` | `warehouse-catalog` ×2 **and** `inventory-catalog-materials` |
  So creating an adjustment in `inventory/stock-adjustment` invalidates `warehouse-adjustments` and leaves `adjustments` — the key `warehouse/adjustment` reads — untouched. Two routes showing the same data never refresh each other.
  Worse, `warehouse-transactions` is invalidated at `stock-adjustment:270` and `mutation:264` but **declared by neither**; the only two files that read it are `inventory/warehouse-dashboard/page.tsx:65` and the dead `mutasi-stok/_hooks/useMutasiStokOperations.ts:23`. The live `warehouse/mutasi-stok/page.tsx:41` uses that hook, so the key *is* live — but it is never invalidated by any mutation, meaning **the movement log never refreshes after stock moves.** That is the audit trail the module exists to provide.
- **Exact Contract Specification**:
  - One key per resource, declared once and reused:
    ```ts
    export const warehouseKeys = {
      adjustments: ['warehouse', 'adjustments'] as const,
      opnames:     ['warehouse', 'opnames']     as const,
      transfers:   ['warehouse', 'transfers']   as const,
      transactions:['warehouse', 'transactions']as const,
      catalog:     ['warehouse', 'catalog']     as const,
      warehouses:  ['warehouse', 'warehouses']  as const,
    };
    ```
- **Actionable Execution Plan**:
  - Add a `warehouseKeys` factory and replace all 15 literal keys across the six files above.
  - `inventory/stock-adjustment/page.tsx:270`, `inventory/mutation/page.tsx:264` — the `warehouse-transactions` invalidation then actually reaches `mutasi-stok`; verify it after the key unification.
  - `warehouse/adjustment/AdjustmentClient.tsx` — delete (fossil, see INV-21); its `adjustments` key disappears with it.
  - `[Verification]` — create a transfer on `/inventory/mutation`; `/warehouse/mutasi-stok` must show the new `INTERNAL_MOVE` rows without a manual reload.

### 📌 Module: [Frontend / Route registry and duplicate surfaces]

#### [INV-21]: Three duplicate route pairs, two fossil components, and eight routes absent from `ROUTE_MAP.md`
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/warehouse/adjustment/AdjustmentClient.tsx` (245 lines, 0 importers), `frontend/src/app/(dashboard)/warehouse/release/ReleaseClient.tsx` (286 lines, 0 importers)
  - Frontend: `docs/ROUTE_MAP.md:53-61`
  - Frontend: `frontend/src/app/(dashboard)/inventory/{mutation,outbound,requisition,stock-adjustment,stock-opname,production-warehouse,formula-adjustment-production,formula-adjustment-rnd}/page.tsx`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Three features exist twice under different URLs, each pair hitting the same endpoint with its own inline logic:
  | Feature | `warehouse/` route | `inventory/` route | Shared endpoint |
  |---|---|---|---|
  | Stock adjustment | `warehouse/adjustment` (127 + hook 348) | `inventory/stock-adjustment` (691) | `GET/POST /warehouse/adjustments` |
  | Stock opname | `warehouse/opname` (122 + hook 311) | `inventory/stock-opname` (696) | `GET/POST /warehouse/opname` |
  | Warehouse transfer | `warehouse/pindah-gudang` (164 + hook 508) | `inventory/mutation` (746) | `GET/POST /warehouse/transfers` |
  The `warehouse/` pair is the Tri-Layer-compliant one (thin `page.tsx`, `_hooks/`, `_components/`, `_types/`). The `inventory/` pair is a 691–902-line monolith that reimplements everything inline and — as INV-01/09/10/11 show — reimplements it **wrongly**. This is the memory note about dead hooks landing with the polarity flipped: here the *hooks* are wired and the *inline copies* are the fossils.
  `AdjustmentClient.tsx` and `ReleaseClient.tsx` have **zero importers** — `warehouse/adjustment/page.tsx:10` and `warehouse/release/page.tsx:11` import their hooks and never render the Client. 531 lines of live-looking code that will mislead the next reader into fixing INV-08 in the wrong file.
  `docs/ROUTE_MAP.md` documents only the six `warehouse/*` routes (`:53-61`). All eight `inventory/*` routes are undocumented, so the registry cannot be used to detect the duplication — which is how it survived.
- **Exact Contract Specification**:
  - `docs/ROUTE_MAP.md` must list every routable page with exactly one canonical row per feature, and the duplicate URL must not resolve.
- **Actionable Execution Plan**:
  - Delete `warehouse/adjustment/AdjustmentClient.tsx` and `warehouse/release/ReleaseClient.tsx` after porting INV-08's fix into `useReleaseOperations`.
  - Pick one URL per feature. `/inventory/*` is the larger, better-populated surface, but `/warehouse/*` is the compliant one — so the Tri-Layer structure should move, not the other way round. Whichever wins, leave a redirect, not two pages.
  - `docs/ROUTE_MAP.md` — add the eight `inventory/*` rows now, mark the three duplicates as canonical-vs-alias, and reconcile once the consolidation lands.
  - `[Verification]` — a repo-wide check that every `page.tsx` under `(dashboard)/` has a `ROUTE_MAP.md` row returns 0 misses; the three duplicate pairs resolve to one URL each.

### 📌 Module: [Frontend / Page size and shell rules]

#### [INV-22]: Five `page.tsx` files are 5–7.5× the 120-line limit; the hard cap of 150 is exceeded by nine
- **Target Files**:
  - Frontend: `inventory/requisition/page.tsx` (902), `inventory/mutation/page.tsx` (746), `inventory/stock-opname/page.tsx` (696), `inventory/outbound/page.tsx` (692), `inventory/stock-adjustment/page.tsx` (691), `warehouse/workstation/page.tsx` (690), `warehouse/WarehouseDashboardClient.tsx` (622), `warehouse/inbound/page.tsx` (157), `warehouse/pindah-gudang/page.tsx` (164), `warehouse/release/page.tsx` (223)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `CLAUDE.md` mandates `page.tsx: < 120 lines (hard limit: 150)`. Nine files breach the hard cap and five breach it by 4.6–7.5×. The `inventory/*` pages are the direct cause of the defects in INV-09, INV-10 and INV-11: a 900-line component holds its own validation, its own payload assembly, its own fetch and its own routing, so there is nowhere for a validator to live and every fallback is written inline. The `warehouse/*` pages that *do* respect the limit (stok 97, mutasi-stok 98, adjustment 127) have none of these bugs.
  `warehouse/release/page.tsx` (223) also violates the shell rule in a different way: it destructures 40+ values from its hook and then carries local `useState` for printing (`:61`), mixing a route shell with client behaviour.
- **Exact Contract Specification**:
  - Each route reduces to `page.tsx` (< 120) → `_hooks/useXOperations.ts` (fetch/mutate/invalidate) → `_components/*` (presentation) → `_types/*`. Validation lives in the hook or a schema, never in the page body.
- **Actionable Execution Plan**:
  - Extract the `inventory/*` pages along the `_hooks` boundary their `warehouse/*` siblings already use — this is the same refactor as INV-21, and doing them together is cheaper than twice.
  - `warehouse/release/page.tsx:61` — move `printingDelivery` into `useReleaseOperations`; the page becomes a pure shell.
  - `warehouse/workstation/page.tsx` (690) and `WarehouseDashboardClient.tsx` (622) are outside the six ROUTE_MAP-documented routes; confirm whether they are in scope before sizing them, and add them to `ROUTE_MAP.md` either way.
  - `[Verification]` — a CI check asserting every `page.tsx` under `(dashboard)/` is ≤ 150 lines returns 0 failures.

### 📌 Module: [Frontend / Read states]

#### [INV-23]: No route renders an error state — `isError` appears zero times across every audited surface
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Across `inventory/stock-adjustment`, `inventory/stock-opname`, `inventory/mutation`, `inventory/outbound`, `inventory/requisition`, `warehouse/adjustment/AdjustmentClient.tsx` and `warehouse/release/ReleaseClient.tsx`, `grep -c isError` returns **0** in every file. Every query destructures `{ data, isLoading }` and falls back to `data = []`. A failed `GET /warehouse/adjustments` renders as a perfectly healthy empty table — indistinguishable from "no adjustments exist", and directly encouraging the user to click "create" and duplicate records.
  Compounded by the absence of pagination anywhere in the module (see INV-30): every list endpoint is an unbounded `findMany`, so a `warehouse` tenant with real volume cannot render the page at all, and the failure would also present as an empty state.
- **Exact Contract Specification**:
  - Three distinct states per list: `isLoading` → skeleton rows; `isError` → retryable panel with the server `message`; `data.length === 0` → empty state with a create affordance. Never collapse the last two.
- **Actionable Execution Plan**:
  - Every `useQuery` in the seven files — destructure `isError` and `error`, render a `DnaAlert` with a retry button.
  - Extract the three states once per cluster rather than per page; the `_hooks` refactor in INV-22 is the natural home.
  - `[Verification]` — with the backend stopped, each route shows a retryable error, not an empty table.

### 📌 Module: [Frontend / Post-mutation navigation]

#### [INV-24]: Three routes navigate to URLs that do not exist, after a successful write
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-adjustment/page.tsx:280, 299, 493, 677`
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-opname/page.tsx:262, 296, 506, 682`
  - Frontend: `frontend/src/app/(dashboard)/inventory/mutation/page.tsx:275, 320, 554, 732`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The `inventory/*` routes push `/stock-adjustment`, `/stock-opname` and `/goods-transfer`. The actual route segments are `inventory/stock-adjustment`, `inventory/stock-opname` and `inventory/mutation` — verified against the directory tree, and `/goods-transfer` matches **no route anywhere** in `(dashboard)/`. The pattern is a leftover from a pre-`(dashboard)` flat route layout. The `/create` variants (`:299, 296, 320`) additionally navigate to a sub-path with no `page.tsx`, so the 404 fires *before* the form is ever shown — the user clicks "create" and lands on a not-found.
  The flow is: `actionParam = searchParams.get('action')` (`:70`) → a `useEffect` opens the modal when it is `"create"` (`:187-190`) → success → `router.push("/stock-adjustment")` (`:280`). Because the modal opens from a query param, the correct close is `router.replace('/inventory/stock-adjustment')` with the param stripped, not a push to a path that does not exist.
- **Exact Contract Specification**:
  - Open:  `/inventory/stock-adjustment?action=create` → modal opens, list unmounts.
  - Close: `router.replace('/inventory/stock-adjustment')` → list renders, modal closed, no history entry to go "back" to.
- **Actionable Execution Plan**:
  - Replace all twelve pushes with the real segments; for the three `/create` variants use `router.replace(<canonical path>)` so the browser Back button does not re-enter the modal.
  - Derive the base path from one constant per route rather than repeating the literal 4×.
  - `[Verification]` — click create, submit, land back on the list; press Back and stay on the list without the modal reopening.

### 📌 Module: [Inventory / Stock Adjustment + Stock Opname — approval]

#### [INV-25]: The two `inventory/*` routes that create stock documents have no approve action, so nothing they create ever moves stock
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/inventory/stock-adjustment/page.tsx` (no `approve`/`reject`/`useMutation`), `frontend/src/app/(dashboard)/inventory/stock-opname/page.tsx` (no `approve`/`approve-pin`/`useMutation`)
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:300, 168`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `grep -n 'approve\|reject\|useMutation'` returns **nothing** in either file. Both routes create documents and show them; neither can progress them.
  On the backend, `createAdjustment` (`warehouse-opname.service.ts:245-298`) writes only the `StockAdjustment` header and item — it touches no stock. The stock moves solely in `approveAdjustment` (`:317-338`). So **every adjustment created from `/inventory/stock-adjustment` is inert**: it displays as `PENDING` forever and never reaches `materialItem.stockQty`, the batch ledgers, or the finance ledger. The toast at `:266` compounds it — *"Penyesuaian stok berhasil disimpan dan **dibukukan**"* ("…and **posted to the books**") — which is false; nothing is posted.
  The opname route is the same shape with an extra step: opnames need `POST /opname/:id/approve` and, above the Rp 500 000 threshold, `POST /opname/:id/approve-pin`. Neither button exists, so no opname in this route can ever be completed. Meanwhile `/warehouse/adjustment` *does* wire approve and reject (`useAdjustmentOperations` exposes `handleApprove`/`handleReject`, `adjustment/page.tsx:48-50`) — which is precisely why the duplication in INV-21 is dangerous and not merely untidy.
- **Exact Contract Specification**:
  - After a successful create, the list must offer Approve / Reject for `PENDING` rows, and the toast must state the document is *pending approval*, not posted:
    ```json
    { "success": true, "data": { "id": "uuid", "adjNumber": "ADJ-2026-000123", "status": "PENDING" } }
    ```
- **Actionable Execution Plan**:
  - `inventory/stock-adjustment/page.tsx` — add `useMutation` for `POST /warehouse/adjustments/:id/approve` and `/:id/reject`, wired to `useStockAdjustmentOperations` (which already exists and is unwired), and surface both actions on `PENDING` rows.
  - `inventory/stock-opname/page.tsx` — add the approve action, plus the PIN prompt when the response is `{ status: 'PENDING_APPROVAL' }` (`warehouse-opname.service.ts:106`).
  - `inventory/stock-adjustment/page.tsx:266` — correct the success toast to say the adjustment is saved and awaiting approval.
  - Alternatively, and preferably alongside INV-21: delete these two routes and point at `/warehouse/adjustment` and `/warehouse/opname`, which already work.
  - `[Verification]` — create an adjustment, approve it, and assert `materialItem.stockQty` changed by exactly the submitted delta.

# 🟡 MISSING VALIDATION

### 📌 Module: [Warehouse / Access control]

#### [INV-26]: `assertWarehouseAccess` returns `true` when no user id is supplied — the guard fails open
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-transfer.service.ts:33-38`
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:134-138`
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:151-157, 169-176, 180-184`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `if (!userId || !warehouseId) return true;` is the first line of both copies. The intent is clearly "no scope configured, nothing to enforce", but it also grants access when a caller supplies no user. `createTransferOrder` is reachable with `createdById` absent: the controller computes `data.createdById || req?.user?.id || req?.user?.sub` (`warehouse.controller.ts:152`), and `createdById` is a **body field** on an `any`-typed body (INV-15), so a client controls it. Any path where the JWT lacks both `id` and `sub` — or where a future refactor reads the body field before the JWT — silently bypasses `warehouseAccess` entirely.
  The same fail-open is reachable at `warehouse.controller.ts:180-182`, where `checkWarehouseAccess` builds `userId` from the JWT only, so it is safe today, but the helper it calls is not. Note the module ships this helper **twice**, verbatim, in two services — a fix must land in both or be deduplicated first.
  Also missing: the controller only ever calls `canRead` (`:182`) and `canWrite` (`:80` in the facade default). The `'canApprove'` permission is declared in the signature of both helpers and is **never used by any caller** — so approval is not warehouse-scoped at all, even though the schema models it.
- **Exact Contract Specification**:
  - A missing user id must be a 401/403, never a grant:
    ```json
    { "success": false, "message": "WAREHOUSE_ACCESS_DENIED", "errors": { "warehouseId": ["No warehouse scope for this principal"] } }
    ```
  - `canApprove` must gate `POST /opname/:id/approve*` and `POST /adjustments/:id/approve`.
- **Actionable Execution Plan**:
  - `warehouse-transfer.service.ts:38` and `warehouse-stock.service.ts:138` — change to `if (!userId) throw new ForbiddenException('WAREHOUSE_SCOPE_UNRESOLVED')`; keep the `!warehouseId` early return only if `warehouseId` is genuinely optional for that call site.
  - Deduplicate the two identical copies into one provider (the module already has `StockLedgerService` as a shared-helper precedent).
  - `warehouse.controller.ts:109-120, 202-215, 249-264` — add `assertWarehouseAccess(userId, <doc warehouseId>, 'canApprove')` so the declared permission is enforced.
  - `[Verification]` — a user with `warehouseAccess.canWrite = true, canApprove = false` can execute a transfer but receives 403 on approve.

### 📌 Module: [Warehouse / Batch QC]

#### [INV-27]: `POST /batches/:id/status` accepts any string as a QC status and changes availability without touching stock
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:72-106`
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:130-143`
  - Database: `frontend/prisma/schema/enums.prisma:228-232` (`QCStatus { GOOD, QUARANTINE, REJECT }`)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `status: any` end to end (`:72`, controller `:136`). The write is `qcStatus: status` (`:86`) — Prisma will accept any string that Postgres can cast to the enum, so this is a 500 (`22P02`), not a 400, and the UI cannot tell the user what the valid values are. `@IsEnum(QCStatus)` plus a DTO fixes it (INV-15).
  The deeper problem is that this endpoint changes **availability** while the module's other availability path (`releaseFromQuarantine`, INV-13) also changes `materialItem.stockQty`. `updateBatchStatus` does **not**: flipping a batch `QUARANTINE → GOOD` makes the lot pickable (FEFO queries filter on `qcStatus: 'GOOD'`, e.g. `warehouse-release.service.ts:240`) but leaves the global cache untouched, so the two representations of stock disagree in the opposite direction from INV-01/03. It is also non-transactional across its two writes — `materialInventory.update` (`:83`) and the `activity.logged` emit (`:91`) — and it appends a human-readable audit line into the same `notes` column that `getAdjustments` parses for status (INV-06) and `checkHoldThresholds` appends to (INV-30).
  The endpoint is reachable with a spoofed actor: the controller takes `userId` from the body (`:141`), so the audit line records a user of the caller's choosing.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "status": "GOOD", "notes": "QC release after inspection" }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": { "id": "uuid", "batchNumber": "LOT-88213", "qcStatus": "GOOD", "stockEffect": { "materialId": "uuid", "delta": "120.00" } } }
    ```
  - Expected: `400` for `"FOO"`; actor from the JWT only; any change in effective availability reflected in `materialItem.stockQty` **inside the same transaction**.
- **Actionable Execution Plan**:
  - `warehouse.controller.ts:130-143` — add `UpdateBatchStatusDto` with `@IsEnum(QCStatus)`; drop `userId` from the body and take it from `req.user.id`.
  - `warehouse-stock.service.ts:83-89` — wrap the update in `prisma.$transaction`; when the transition changes availability, apply the matching `materialItem.stockQty` delta and post an `inventoryTransaction` row so the cache and ledger stay in step.
  - `warehouse-stock.service.ts:87` — stop appending to `notes` for the audit trail; the `activity.logged` event and a dedicated `statusHistory` are the right homes.
  - `[Verification]` — flip a 120-unit batch from `QUARANTINE` to `GOOD`; assert `materialItem.stockQty` moved by 120 and exactly one `INBOUND` ledger row was written.

### 📌 Module: [Warehouse / Identity]

#### [INV-28]: The acting user is taken from the request body and takes precedence over the JWT on five write endpoints
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:118, 138-141, 174, 208, 258, 275`
  - Frontend: `frontend/src/app/(dashboard)/warehouse/adjustment/AdjustmentClient.tsx:83`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Five endpoints read the actor from the body **first**: `const userId = body?.userId || req?.user?.id || req?.user?.sub || 'SYSTEM'`. Because the body is typed `any` (INV-15) there is no validation and the JWT is only a fallback. An authenticated `WAREHOUSE` user can therefore record an approval, a batch status change, a quarantine release or a transfer execution as any other user id — including one with `canApprove` warehouse rights, which is what INV-26 shows is otherwise enforced. The audit trail for every stock movement in the module is attacker-writable.
  The literal `'SYSTEM'` fallback is its own hazard: an unauthenticated-looking path silently attributes a real stock movement to a non-existent principal. `AdjustMaterialClient.tsx:83` does the same from the client side, hardcoding `{ status, userId: "system" }`.
  `approveOpnameWithPin` is the most exposed: the PIN is verified against `User.managerPin` for the *body-supplied* `userId` (`:208` → `warehouse-opname.service.ts:169-171`), so the escalation audit records whoever the caller named.
- **Exact Contract Specification**:
  - The actor is never client-supplied. Request DTO carries only the action:
    ```json
    { "status": "APPROVED" }
    ```
  - The response reports the resolved actor so the UI can display it:
    ```json
    { "success": true, "data": { "id": "uuid", "approvedById": "uuid-of-jwt-subject", "approvedAt": "ISO-8601" } }
    ```
- **Actionable Execution Plan**:
  - `warehouse.controller.ts:118, 141, 174, 208, 258, 275` — invert every one to `req.user.id` and remove `userId` from the accepted body. Add a shared `@CurrentUser()` decorator if one does not already exist.
  - `AdjustmentClient.tsx:83` — drop `userId: "system"` from the payload.
  - `warehouse.controller.ts:141` — drop `body.userId` from `updateBatchStatus`; take it from the JWT.
  - `warehouse.controller.ts:115` (`validateHandover`) and the `'SYSTEM'` fallbacks — replace with a hard failure when the JWT subject cannot be resolved.
  - `[Verification]` — POST an approval with `{ "userId": "<another user>" }`; the stored `approvedById` must equal the caller's own JWT subject.

### 📌 Module: [Warehouse / Bootstrapping]

#### [INV-29]: Hardcoded nil-UUID fallbacks for `warehouseId` and `accountId` convert a missing-setup condition into an FK violation
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:170`
  - Backend: `backend/src/modules/warehouse/services/warehouse-opname.service.ts:261-264`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: When no active warehouse exists, `createInbound` substitutes the nil UUID (`warehouse-inbound.service.ts:170`); the FK on `WarehouseInbound.warehouseId` then rejects it with `P2003` → a 500 whose message names an internal constraint rather than "no warehouse is configured". `createAdjustment` is worse: it takes **any** account with `tx.account.findFirst()` (no `where`, so an arbitrary row in a 200-account chart) and only then falls back to the literal `'00000000-0000-0000-0000-000000000001'` (`:261-264`), which is not a real row and produces the same `P2003`.
  The unpredictable `accountId` has a second-order effect: the resulting `StockAdjustment.accountId` is the FK that `JournalEntry` relations hang off (INV-06), so an arbitrary account selection can mis-point a stock write-off at the wrong ledger account. The finance side does this properly by looking accounts up **by COA code** (`finance-journal.service.ts:468`, `where: { code: '1151' }`) — the warehouse side should use the same approach.
- **Exact Contract Specification**:
  - Missing setup is a 409 with an actionable message, not a 500:
    ```json
    { "success": false, "message": "NO_ACTIVE_WAREHOUSE", "errors": { "warehouseId": ["No ACTIVE warehouse is configured; create one in /master/warehouses"] } }
    ```
- **Actionable Execution Plan**:
  - `warehouse-inbound.service.ts:166-171` — when `firstWh` is undefined, throw `ConflictException` with the message above. Delete the nil-UUID literal.
  - `warehouse-opname.service.ts:261-264` — look the adjustment account up by COA code (the account the finance journal expects, e.g. `5100` "Beban Selisih Persediaan", which the frontend already displays at `stock-adjustment/page.tsx:271`) and fail with 409 if it is absent. Delete both literals.
  - `[Verification]` — with zero active warehouses, `POST /warehouse/inbounds` returns 409 naming the missing setup, and no `warehouse_inbounds` row is created.

# 🔵 EDGE CASE

### 📌 Module: [Warehouse / Inbound — batch lookup]

#### [INV-30]: Batches are matched to inbound lines by substring-searching a `notes` string — two lots of the same material in one GRN collapse into one
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-inbound.service.ts:283-289`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `findFirst({ where: { materialId, notes: { contains: \`GRN:${inbound.inboundNumber}\` }, qcStatus: 'QUARANTINE' } })` locates the batch seeded at `:208-219` by searching free text. The seed writes `notes: \`GRN:${inboundNumber}:${item.materialId}\`` — **which does not include the line id**, so when a GRN contains two lines for the same material (two supplier lots, which is the normal case for a split delivery), `findFirst` returns the **first** batch for both lines. Consequences: the second batch is never flipped to `GOOD` (it stays `QUARANTINE` forever, so it is invisible to every FEFO query and permanently un-pickable), while `materialItem.stockQty` is incremented twice (`:317-320`) and two `INBOUND` ledger rows are posted. If the same GRN number prefix ever recurs, the `contains` match can also bind to another document's batch.
  The fix is already visible in the schema: `InboundItem` exists (`warehouse.prisma:257`) — carry a `materialInventoryId` FK on the inbound line instead of re-deriving it from text.
- **Exact Contract Specification**:
  - Two lines, same material, lots `LOT-A` and `LOT-B`: after release both batches are `GOOD`, `materialItem.stockQty` moved by the sum, and two distinct `INBOUND` ledger rows each point at their own `inventoryId`.
- **Actionable Execution Plan**:
  - `frontend/prisma/schema/warehouse.prisma` — add `materialInventoryId String? @db.Uuid` to `InboundItem`; backfill from the `notes` convention once, then drop the convention.
  - `warehouse-inbound.service.ts:208-219` — persist the created `materialInventory.id` onto the inbound line.
  - `warehouse-inbound.service.ts:283-289` — `findUnique({ where: { id: inboundItem.materialInventoryId } })`. If the id is absent, take the `else` branch (`:301-315`) rather than guessing by text.
  - `[Verification]` — release a GRN with two lots of one material; assert two `GOOD` batches, two ledger rows with distinct `inventoryId`, and a cache delta equal to the sum.

### 📌 Module: [Warehouse / Production return]

#### [INV-31]: Material returned from production with no existing batch increases the global cache but creates no lot — the stock is unpickable and unreconcilable
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/services/warehouse-release.service.ts:495-535`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `handleProductionMaterialReturn` looks for a `GOOD` batch and, if none exists, takes the `else` branch: it posts a `RETURN` ledger row **with no `inventoryId`** (`:519-528`) and then still increments `materialItem.stockQty` (`:531-534`). The result is quantity that the global cache reports but no lot holds. Every consumption path filters on batches — `releaseMaterial` (`:236-244`), `handleProductionConsumption` (`:44-51`), `executeTransferOrder` (`warehouse-transfer.service.ts:167-174`), `pickBatch` (`:447`), `getSuggestedBatch` (`warehouse.service.ts:196`) — so this stock can never be picked, transferred, released or returned again. It is also the one path that makes `syncStockCache` (INV-05) unrecoverable, since the ledger row exists but carries no batch linkage.
  The condition is reachable: it fires when all batches for a material are `QUARANTINE` or `REJECT` — precisely the state left behind by the un-released quarantine batches in INV-30.
- **Exact Contract Specification**:
  - Request DTO: (event payload)
    ```json
    { "workOrderId": "uuid", "materialId": "uuid", "qtyReturned": 25 }
    ```
  - Expected Response DTO / expected behaviour: either (a) create a `RETURN` batch with a generated `batchNumber`, `qcStatus: 'GOOD'`, `currentStock: 25` and link the ledger row to its `inventoryId`; or (b) reject the return with `409 NO_AVAILABLE_BATCH` and leave the cache untouched. Silently crediting unlocatable stock is not one of the options.
- **Actionable Execution Plan**:
  - `warehouse-release.service.ts:518-529` — replace the `else` branch with a `materialInventory.create` (mirroring `warehouse-inbound.service.ts:208`) and point the ledger row at it; or throw so the production operator resolves the quarantine hold.
  - `warehouse-release.service.ts:531-534` — keep the cache increment, but only after a lot exists to hold the quantity, so the two can never disagree.
  - `[Verification]` — return material whose every batch is `QUARANTINE`; assert either a new `GOOD` lot exists and is pickable, or the call rejects with the cache unchanged.

### 📌 Module: [Warehouse / Audit endpoint]

#### [INV-32]: `GET /warehouse/check-thresholds` writes to the database
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts:83-87`
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:611-621`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: A `GET` handler mutates rows: for every batch past 120 % of its hold SLA it appends `[SYSTEM_ALERT: CRITICAL_HOLD_SLA_BREACH]` to `notes` (`:615-620`). The update is issued once per breaching batch, unguarded by a transaction and not idempotent under concurrency — two concurrent readers can both pass the `!batch.notes?.includes('CRITICAL_HOLD')` check at `:613` and write the marker twice. It is also invisible to caches: the write does not clear `statsCache` (INV-17).
  The write is the only place this marker is produced, and it lands in the same `notes` column that `getAdjustments` substring-parses for approval status (INV-06) and that `updateBatchStatus` appends to (INV-27). A GET that mutates shared state is also trivially triggered by a prefetch, a crawler, or a monitoring probe, and none of those is a legitimate reason to write.
- **Exact Contract Specification**:
  - `GET /warehouse/check-thresholds` must be read-only:
    ```json
    { "success": true, "data": { "timestamp": "2026-10-01T09:00:00Z", "anomaliesCount": 2, "anomalies": [ { "batchId": "uuid", "batchNumber": "LOT-88213", "material": "Resin A", "holdHours": 96, "limit": 72, "risk": "CRITICAL_SPOILAGE" } ] } }
    ```
    Note `batchId` is currently missing from the anomaly objects (`:601-608`) — the UI cannot act on what it cannot identify.
  - If the annotation is genuinely wanted, move it to a scheduled job on an `@Cron`, not a GET.
- **Actionable Execution Plan**:
  - `warehouse-stock.service.ts:611-621` — delete the write from the read path.
  - `warehouse-stock.service.ts:601-608` — add `batchId: batch.id` to each anomaly so the response is actionable.
  - `warehouse-stock.service.ts:585` — if auto-tagging is required, run it from a scheduler with the transaction and cache invalidation it deserves.
  - `[Verification]` — call the endpoint three times; assert `material_inventories.notes` is byte-identical before and after.

### 📌 Module: [Warehouse / Module-wide]

#### [INV-33]: No pagination and no `DELETE` anywhere in the cluster
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.controller.ts` (all 30+ routes)
  - Backend: `backend/src/modules/warehouse/services/warehouse-stock.service.ts:29-57` (`getCatalog`), `:489-498` (`getAllTransactions`)
  - Backend: `backend/src/modules/warehouse/services/requisition.service.ts:46-56` (`findAll`)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP`: **Every** read endpoint is an unbounded query. `getCatalog` returns every non-deleted `MaterialItem` with **all** of its lots included (`:40-56`) — the list page for `/warehouse/stok`; `getAllTransactions` has a hardcoded `take: 100` with no `skip` and no cursor (`:495`), so the movement log is permanently truncated at the first 100 rows with no way to page past them; `getInbounds` (`:122`), `getOpnames` (`:200`), `getAdjustments` (`:212`), `getTransferOrders` (`warehouse-transfer.service.ts:255`) and `findAll` (`:47`) are all unbounded `findMany`.
  No endpoint accepts `page`, `pageSize`, `search`, `status` or a date range — the only query params in the whole controller are `materialId` (`:73, 77`), `warehouseId` (`:50`), `limit` (`:350`), `days` (`:356`) and the dead `groupBy` (INV-19). All filtering is done client-side after fetching everything, which is why the pages carry `searchTerm`/`statusFilter` state and `useMemo` chains (`stock-adjustment/page.tsx:77-78`, `requisition/page.tsx:182-184`).
  There is likewise **no `DELETE` route in the entire module** — no soft or hard delete for a transfer, an opname, an adjustment, a GRN or a requisition. Given the live-ERP context, refusing to delete posted stock documents is defensible; having no cancel/void path at all, so that a mistaken GRN can only be corrected by issuing an offsetting adjustment, is a genuine gap. `WarehouseInbound.status` has a `CANCELLED` member (`enums.prisma:208-212`) that no code path can set.
- **Exact Contract Specification**:
  - Every list endpoint returns the standard envelope with a `meta` block, and accepts `page`, `pageSize`, `search`, `status`:
    ```json
    { "success": true, "data": { "items": [], "meta": { "page": 1, "pageSize": 50, "totalCount": 0, "totalPages": 0 } } }
    ```
  - Cancellation, not deletion, for posted documents:
    ```json
    { "success": true, "data": { "id": "uuid", "inboundNumber": "GRN-2026-0001", "status": "CANCELLED", "cancelledById": "uuid", "cancelledAt": "ISO-8601" } }
    ```
- **Actionable Execution Plan**:
  - `warehouse.controller.ts` — add a shared pagination DTO and a `Paginated<T>` helper; apply to the six list endpoints above. Start with `getAllTransactions`, which is the only one that silently hides data today.
  - `warehouse-stock.service.ts:40-56` — paginate `getCatalog` and aggregate lots server-side rather than including every row of every lot.
  - `warehouse.controller.ts:196-200` — add `PATCH /warehouse/inbounds/:id/cancel` that flips status to `CANCELLED` and releases any quarantine batches it created; guard with a status check exactly as `releaseFromQuarantine` does at `warehouse-inbound.service.ts:249-250`.
  - `[Verification]` — `/warehouse/mutasi-stok` can reach transaction 101 and beyond via pagination; a cancelled GRN's batches are no longer `QUARANTINE`.

### 📌 Module: [Warehouse / Facade hygiene]

#### [INV-34]: The facade injects four dependencies it never uses
- **Target Files**:
  - Backend: `backend/src/modules/warehouse/warehouse.service.ts:28-38`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `WarehouseService` injects `scmService`, `stockLedger`, `idGenerator` and `eventEmitter` (`:29-32`) and uses none of them. The class is a pure pass-through over the six sub-services plus `getReleaseRequests`/`getSuggestedBatch`, which do use `this.prisma` (`:175, 191`). At 238 lines it is inside the 250-line facade budget, but the unused injections are misleading about coupling — and `stockLedger` in particular implies the facade mediates ledger writes, when INV-05 showed it is bypassed everywhere and used only by `communication-protocol.service.ts` (2 call sites).
- **Actionable Execution Plan**:
  - `warehouse.service.ts:29-32` — delete the four unused constructor parameters. If `stockLedger` is meant to become the single write path (the right long-term fix for INV-05), that is a separate change with its own plan, not a reason to keep the import.
  - `[Verification]` — `npm --prefix backend run typecheck` passes; no import of `ScmService`/`StockLedgerService` remains in the facade.

---

## Fix order

The findings are not independent. This sequence maximises safety per unit of work:

1. **INV-12 + INV-15** (add DTOs, add `@Min(0.0001)`). One change closes the negative-quantity exploit and makes every other write endpoint reject malformed input instead of 500-ing. Nothing else can be verified safely until writes are validated.
2. **INV-04 + INV-06 + INV-26** (one migration: `StockAdjustment.adjNumber/status/approvedById/approvedAt`, plus the enforcement). Kills double-approval and the fabricated document numbers.
3. **INV-01 + INV-03 + INV-31** (shortfall guards + signed ledger quantities). These are the three places stock is created or destroyed from nothing.
4. **INV-02** (thread `tx` into the finance journal). Requires step 1's DTOs to be safe, and is the only fix that requires touching the finance module.
5. **INV-09 + INV-10 + INV-11** (stop fabricating payloads on the client; single-document multi-line create).
6. **INV-14** (add `MaterialInventory.warehouseId`) — a migration, and the enabling change for transfer correctness and catalog accuracy.
7. **INV-20 + INV-21 + INV-22 + INV-25** (consolidate the duplicate routes, unify query keys, split the fat pages). Large but mechanical, and it removes the surface that produced steps 5's bugs.
8. **INV-07** (restore the 111 drifted models to source) — repo-wide, needs an owner outside this cluster, and blocks `prisma generate` from being safe.

---

## Per-module verdict

| Module / Route | Verdict | Worst finding | Ship-blocking |
|---|---|---|---|
| **Backend — `WarehouseController`** (30+ routes) | 🔴 Not production-ready | Every write endpoint takes `any`; ValidationPipe is a no-op | INV-12, INV-15, INV-28 |
| **Backend — `WarehouseInboundService`** | 🔴 Not production-ready | Rejected goods credited as available stock | INV-13, INV-09 |
| **Backend — `WarehouseTransferService`** | 🔴 Not production-ready | Partial source deduction → full destination credit | INV-01, INV-14 |
| **Backend — `WarehouseReleaseService`** | 🔴 Not production-ready | Cache decremented by requested, not available, qty | INV-03, INV-08, INV-31 |
| **Backend — `WarehouseOpnameService`** | 🔴 Not production-ready | `approveAdjustment` has no state guard | INV-04, INV-06, INV-02 |
| **Backend — `WarehouseStockService`** | 🟠 Needs rework | `syncStockCache` adds every write-off back | INV-05, INV-17, INV-33 |
| **Backend — `StockLedgerService`** | 🟡 Correct but bypassed | "Golden thread" used by 1 of 12 writers | INV-05 |
| **Backend — `RequisitionService`** | 🔴 Compiles on a stale artifact | Model absent from all source `.prisma` | INV-07 |
| **Frontend — `/warehouse/stok`** | 🟢 Structurally sound | Unpaginated catalog; location-less lots hidden | INV-14, INV-33 |
| **Frontend — `/warehouse/inbound`** | 🔴 Not production-ready | Fabricates materialId, qty, lot, expiry on submit | INV-09 |
| **Frontend — `/warehouse/release`** | 🔴 Not production-ready + dead fossil | Renders a `TypeError`; 531 dead lines beside it | INV-08, INV-21 |
| **Frontend — `/warehouse/pindah-gudang`** | 🟢 Structurally sound | Compliant Tri-Layer; backend is the weak side | — |
| **Frontend — `/warehouse/mutasi-stok`** | 🟠 Stale data | Never invalidated after a stock move | INV-20 |
| **Frontend — `/warehouse/adjustment`** | 🟠 Duplicated | Fossil `AdjustmentClient.tsx`; duplicate of `/inventory/stock-adjustment` | INV-21, INV-06 |
| **Frontend — `/warehouse/opname`** | 🟢 Structurally sound | Compliant Tri-Layer | — |
| **Frontend — `/inventory/stock-adjustment`** | 🔴 Not production-ready | No approve action → every record is inert | INV-10, INV-11, INV-25 |
| **Frontend — `/inventory/stock-opname`** | 🔴 Not production-ready | `picId: "SYSTEM"` into a `@db.Uuid` — always 500 | INV-11, INV-25 |
| **Frontend — `/inventory/mutation`** | 🔴 Not production-ready | 746 lines; fans out N parallel writes | INV-10, INV-20 |
| **Frontend — `/inventory/outbound`** | 🟠 Out of cluster scope | 692 lines; serves `/fulfillment/shipments` | INV-22, INV-23 |
| **Frontend — `/inventory/requisition`** | 🔴 Not production-ready | 902 lines; reads `/scm/goods-requirements`, not the warehouse requisitions | INV-22, INV-23 |
| **Database — `schema/*.prisma`** | 🔴 Drifted | 111 models in the client, 0 in source | INV-07 |

**Cluster verdict: 12 Critical, 11 Contract Mismatch, 3 Broken UX State, 4 Missing Validation, 5 Edge Case — not production-ready.**

The single thing to understand is that the module's transactions are *structurally* correct — the ledger and the cache always commit or roll back together. What is broken is the arithmetic inside those transactions: the cache is moved by the quantity that was **requested** while the lots are moved by the quantity that was **available**, in three separate handlers, and the reconciliation function built to detect the resulting drift would make it worse. The correct shape already exists in this module, in `releaseMaterial` (`warehouse-release.service.ts:285-289`) and in `pickBatch`'s `FOR UPDATE` lock (`:445`). The fix is to make every path behave like those two, and to stop the client from inventing the payloads that reach them.




