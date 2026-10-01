# Actionable Execution Ticket: API Response Envelope & Error Contract Standardization

## Metadata
- **Ticket ID**: CONTRACT-AUDIT-001
- **Severity Scope**: 2 Critical Bugs | 3 Contract Mismatches | 1 Broken UX State
- **Target Subsystems**:
  - Backend: `backend/src/common/interceptors/`, `backend/src/common/filters/`, `backend/src/main.ts`, Controller sample sites
  - Frontend: `frontend/src/lib/api.ts`, `frontend/src/lib/unwrap-response.ts`, `frontend/src/components/dna/DnaToast.tsx`, `frontend/src/app/(dashboard)/master/*`

---

## 1. Executive Summary & Root Cause Analysis

### DEFECT 1: `unwrapResponse` Double-Unwrap & Pagination Collapse
- **Location**: `frontend/src/lib/unwrap-response.ts:1-7`
- **Mechanism**:
  ```typescript
  export function unwrapResponse<T = any>(response: any): T {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  }
  ```
- **Failure Mode**:
  1. Backend returns paginated envelope `{ data: T[], total: 50, page: 1, limit: 10, totalPages: 5 }` (e.g. `materials.service.ts:63-69`).
  2. Axios wraps HTTP payload in `response.data`.
  3. `response.data.data` exists (`T[]`). `unwrapResponse` returns `T[]` directly.
  4. Metadata (`total`, `page`, `limit`, `totalPages`) is permanently discarded.
  5. In callers expecting `{ data: T[] }` (e.g. `const body = unwrapResponse(res); const rows = body.data;`), `body` is now an array (`Array.isArray(body) === true`). Accessing `body.data` evaluates to `undefined`.
  6. Fallback `rows || []` defaults to empty array. UI renders empty state despite backend returning data.
  7. Inconsistent caller signatures: 59 sites call `unwrapResponse(res)`, while other sites call `unwrapResponse(res.data)`. When `res.data` (raw array) is passed, `response?.data?.data` is undefined, `response?.data` is undefined, and it falls through to `return response`.

### DEFECT 2: Object Passed to `toast.error()` Crashing React (27 Master Sites)
- **Location**:
  - `frontend/src/lib/api.ts:18-30` (`extractApiError`)
  - `frontend/src/components/dna/DnaToast.tsx:37-38` (`dnaToast.error`)
  - 11 active call sites in `page.tsx` (`customers: 2`, `goods: 3`, `suppliers: 3`, `warehouses: 3`)
  - 16 call sites in `_hooks/` operations (`useCustomerOperations: 4`, `useGoodsOperations: 4`, `useSupplierOperations: 5`, `useWarehouseOperations: 3`)
- **Mechanism**:
  1. `extractApiError(error)` returns an object: `{ status: number, message: string, code: string }`.
  2. Call sites in active master pages execute: `onError: (e) => toast.error(extractApiError(e))`.
  3. `dnaToast.error(title, msgOrOpts)` forwards `title` directly to `sonnerToast.error(title)`.
  4. Sonner mounts `title` directly in React JSX node tree as `{title}`.
  5. React 18/19 throws unhandled runtime invariant:
     `Error: Objects are not valid as a React child (found: object with keys {status, message, code}). If you meant to render a collection of children, use an array instead.`
  6. The entire React component tree unmounts. White-screen crash on any validation or network failure.

---

## 2. Backend Inventory: Current Response & Error Architecture

### 2.1 Backend Interceptors Inspection (`backend/src/common/interceptors/`)
- Existing interceptors:
  - `idempotency.interceptor.ts`: Handles `Idempotency-Key` caching.
  - `error-tracking.interceptor.ts`: Sentry/logging capture.
  - `perf-monitoring.interceptor.ts`: Execution timing.
- **Finding**: **Zero global response standardization interceptor exists.**
- `backend/src/main.ts:45` contains dead comment `// Enable Global Response Standardization`, but registers only `GlobalExceptionFilter`. No `TransformInterceptor` is installed via `app.useGlobalInterceptors()`.

### 2.2 Controller Sample: 8 Real-World Controllers
| # | Controller | Method & Route | Backend Return Type | Envelope State |
|---|---|---|---|---|
| 1 | `SuppliersController` (`suppliers.controller.ts:64`) | `GET /master/suppliers` | `Supplier[]` (via Prisma `findMany`) | Bare array. Zero envelope. |
| 2 | `InboundsController` (`inbounds.controller.ts:42`) | `GET /purchase/goods-receipts` | `WarehouseInbound[]` | Bare array. Zero envelope. |
| 3 | `SalesInvoicesController` (`sales-invoices.controller.ts:28`) | `GET /finance/sales-invoices` | `SalesInvoice[]` | Bare array. Zero envelope. |
| 4 | `NpfController` (`npf.controller.ts:22`) | `GET /rnd/npf` | `NewProductForm[]` | Bare array. Zero envelope. |
| 5 | `WarehouseController` (`warehouse.controller.ts:67`) | `GET /warehouse/warehouses` | `Warehouse[]` | Bare array. Zero envelope. |
| 6 | `LeadsController` (`leads.controller.ts:39`) | `GET /crm/leads` | `CrmLead[]` | Bare array. Zero envelope. |
| 7 | `SalesOrdersController` (`sales-orders.controller.ts:33`) | `GET /commercial/sales-orders` | `SalesOrder[]` | Bare array. Zero envelope. |
| 8 | `HrController` (`hr.controller.ts:43`) | `GET /hr/employees` | `EmployeeMapped[]` | Bare array. Zero envelope. |
| 9 | `MaterialsController` (`materials.service.ts:63`) | `GET /master/materials` | `{ data: items, total, page, limit, totalPages }` | Paginated custom envelope. |
| 10 | `PersonnelController` (`personnel.service.ts:115`) | `GET /master/personnel/users` | `{ items, total, page, limit, totalPages }` | Inconsistent envelope (`items` vs `data`). |

**Conclusion**: Complete fragmentation. 80%+ of endpoints return raw arrays, while scattered services return custom pagination objects with differing property names (`data` vs `items`).

### 2.3 Global Exception Filter (`backend/src/common/filters/global-exception.filter.ts`)
- Implements RFC 7807 Problem Details.
- Emits response with `Content-Type: application/problem+json`:
  ```json
  {
    "type": "https://nexerp.dreamlab.id/errors/validation-failed",
    "title": "Validation Failed",
    "status": 400,
    "detail": "Validasi gagal untuk 2 field",
    "instance": "/v1/master/materials",
    "code": "VALIDATION_FAILED",
    "timestamp": "2026-10-01T12:00:00.000Z",
    "details": {
      "fieldErrors": [
        { "message": "name should not be empty" },
        { "message": "unitPrice must be a number" }
      ]
    },
    "message": "Validasi gagal untuk 2 field"
  }
  ```
- **Strengths**: Stable RFC 7807 structure, stable `code`, maps ValidationPipe messages to `details.fieldErrors`.
- **Gap**: Frontend `extractApiError` only extracts top-level `message` string; it drops `details.fieldErrors` and passes composite object to toasts.

---

## 3. Frontend Response Consumer Analysis

### 3.1 `unwrapResponse` Call Sites Census
- **Total occurrences**: 393 sites across 163 files.
- **Breakdown of Patterns**:
  1. *Defensive Dual-Check Pattern* (61 sites):
     `const body = unwrapResponse(res); return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];`
     Engineers had to write defensive ternary checks to survive `unwrapResponse` stripping or not stripping layers.
  2. *Direct Return in queryFn* (59 sites):
     `queryFn: async () => unwrapResponse(await api.get(...)) || []`
     If endpoint returns paginated `{ data: items, total }`, `items` is returned, `total` discarded.
  3. *Double-Wrap via `res.data`* (14 sites):
     `return unwrapResponse(res.data)` (e.g. `warehouse/opname/page.tsx:32`, `warehouse/adjustment/page.tsx:28`). Passing `res.data` instead of `res` bypasses `response?.data?.data` when backend returns raw array.

### 3.2 `extractApiError` Call Sites Census (Enumeration of 27 Master Sites)
- Total `extractApiError` calls: 63 sites across 33 files.
- **The 27 Master Data Mutation Sites**:
  - **11 Active `page.tsx` Sites (CRITICAL - Direct React Crash)**:
    1. `frontend/src/app/(dashboard)/master/customers/page.tsx:224` — `createCustomerMut.onError: (e) => toast.error(extractApiError(e))`
    2. `frontend/src/app/(dashboard)/master/customers/page.tsx:234` — `deleteCustomerMut.onError: (e) => toast.error(extractApiError(e))`
    3. `frontend/src/app/(dashboard)/master/goods/page.tsx:282` — `createMut.onError: (e) => toast.error(extractApiError(e))`
    4. `frontend/src/app/(dashboard)/master/goods/page.tsx:292` — `updateMut.onError: (e) => toast.error(extractApiError(e))`
    5. `frontend/src/app/(dashboard)/master/goods/page.tsx:319` — `deleteMut.onError: (e) => toast.error(extractApiError(e))`
    6. `frontend/src/app/(dashboard)/master/suppliers/page.tsx:205` — `createMut.onError: (e) => toast.error(extractApiError(e))`
    7. `frontend/src/app/(dashboard)/master/suppliers/page.tsx:215` — `updateMut.onError: (e) => toast.error(extractApiError(e))`
    8. `frontend/src/app/(dashboard)/master/suppliers/page.tsx:241` — `deleteMut.onError: (e) => toast.error(extractApiError(e))`
    9. `frontend/src/app/(dashboard)/master/warehouses/page.tsx:189` — `createMut.onError: (e) => toast.error(extractApiError(e))`
    10. `frontend/src/app/(dashboard)/master/warehouses/page.tsx:199` — `updateMut.onError: (e) => toast.error(extractApiError(e))`
    11. `frontend/src/app/(dashboard)/master/warehouses/page.tsx:286` — `deleteMut.onError: (e) => toast.error(extractApiError(e))`

  - **16 Colocated `_hooks` Sites (Parallel Logic)**:
    12. `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts:269` — `createMutation.onError`
    13. `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts:279` — `updateMutation.onError`
    14. `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts:305` — `deleteMutation.onError`
    15. `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts:315` — `batchDeleteMutation.onError`
    16. `frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts:271` — `createMutation.onError`
    17. `frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts:281` — `updateMutation.onError`
    18. `frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts:307` — `deleteMutation.onError`
    19. `frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts:317` — `batchDeleteMutation.onError`
    20. `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:330` — `createMutation.onError`
    21. `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:340` — `updateMutation.onError`
    22. `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:365` — `deleteMutation.onError`
    23. `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:391` — `importMutation.onError`
    24. `frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts:401` — `exportMutation.onError`
    25. `frontend/src/app/(dashboard)/master/warehouses/_hooks/useWarehouseOperations.ts:337` — `createMutation.onError`
    26. `frontend/src/app/(dashboard)/master/warehouses/_hooks/useWarehouseOperations.ts:348` — `updateMutation.onError`
    27. `frontend/src/app/(dashboard)/master/warehouses/_hooks/useWarehouseOperations.ts:371` — `deleteMutation.onError`

---

## 4. Contract Mismatch Table: Call Site -> Expected -> Actual -> Verdict

| Target Call Site | Frontend Expected Shape | Backend Actual Shape | unwrapResponse Output | Verdict |
|---|---|---|---|---|
| `master/materials/page.tsx:71` | `Material[]` (plus pagination & total) | `{ data: items, total, page, limit, totalPages }` | `items` (Array) | **CONTRACT MISMATCH**: Pagination metadata destroyed. KPI cards display `materials.length` (page size 20) instead of total database records. |
| `master/personnel/PersonnelRegistry.tsx` | `{ items: User[], total, page, limit, totalPages }` | `{ items, total, page, limit, totalPages }` | `{ items, total, page, limit, totalPages }` | **INCONSISTENT**: Uses key `items` instead of standard `data`. Survives unwrap only because it does not use `data` key. |
| `master/customers/page.tsx:144` | Array `Customer[]` | `Customer[]` (bare Prisma array) | `Customer[]` | **ACCIDENTAL PASS**: Unwrapped correctly only because backend lacks envelope. If backend wraps in `{ data: [] }`, `res.data.data` triggers. |
| `master/customers/page.tsx:224` | String message for toast | Error response RFC 7807 | `{ status, message, code }` object | **CRITICAL BUG**: Object passed to `toast.error()`, unhandled React exception crashes client. |
| `master/goods/page.tsx:282` | String message for toast | Error response RFC 7807 | `{ status, message, code }` object | **CRITICAL BUG**: Object passed to `toast.error()`, unhandled React exception crashes client. |
| `master/suppliers/page.tsx:205` | String message for toast | Error response RFC 7807 | `{ status, message, code }` object | **CRITICAL BUG**: Object passed to `toast.error()`, unhandled React exception crashes client. |
| `master/warehouses/page.tsx:189` | String message for toast | Error response RFC 7807 | `{ status, message, code }` object | **CRITICAL BUG**: Object passed to `toast.error()`, unhandled React exception crashes client. |
| `pembelian/faktur-pembelian/_hooks/useFakturPembelianOperations.ts:217` | `toast.error(title, opts)` | `toast.error("Gagal", extractApiError(e).message)` | String passed as 2nd arg | **BROKEN UX STATE**: Sonner expects `{ description }` object as 2nd param, receives bare string. Subtext suppressed or malformed. |
| `warehouse/opname/page.tsx:32` | `OpnameSession[]` | `OpnameSession[]` | `unwrapResponse(res.data)` | **DEFECTIVE CONSUMER**: Passes `res.data` instead of `res`. Double unwrap logic bypasses standard path. |

---

## 5. Canonical Specification: The NEX ERP API Contract

### 5.1 Canonical TypeScript Contract (`shared/types/api.ts` & `frontend/src/lib/types/api.ts`)

```typescript
/**
 * Canonical success envelope for all single-resource operations.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

/**
 * Standard pagination metadata structure.
 */
export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Canonical success envelope for paginated collections.
 */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: ApiPaginationMeta;
  timestamp: string;
}

/**
 * Canonical RFC 7807 Problem Details error envelope.
 */
export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  timestamp: string;
  message: string;
  details?: {
    fieldErrors?: Array<{ field?: string; message: string; code?: string }>;
    [key: string]: any;
  };
}
```

---

## 6. Implementation Changes

### 6.1 Backend Global Transform Interceptor
Create file: `backend/src/common/interceptors/transform.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // Skip Swagger docs, file downloads, health checks, metrics, and raw streams
    if (
      req.url.startsWith('/api/docs') ||
      req.url.includes('/export') ||
      req.url.includes('/download') ||
      res.getHeader('content-disposition')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload) => {
        // If already formatted or null/empty
        if (payload === null || payload === undefined) {
          return {
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
          };
        }

        // Handle paginated responses from services returning { data, total, page, limit, totalPages }
        if (
          typeof payload === 'object' &&
          ('total' in payload || 'totalCount' in payload) &&
          ('data' in payload || 'items' in payload)
        ) {
          const items = payload.data || payload.items || [];
          const total = Number(payload.total ?? payload.totalCount ?? items.length);
          const page = Number(payload.page ?? 1);
          const limit = Number(payload.limit ?? items.length ?? 20);
          const totalPages = payload.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1);

          return {
            success: true,
            data: items,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
            timestamp: new Date().toISOString(),
          };
        }

        // If controller already wrapped with { success: true, ... }
        if (typeof payload === 'object' && payload.success === true) {
          return {
            ...payload,
            timestamp: payload.timestamp || new Date().toISOString(),
          };
        }

        // Standard single object or plain array
        return {
          success: true,
          data: payload,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

### 6.2 Register Interceptor in `backend/src/main.ts`
```typescript
// Replace lines 45-47 in backend/src/main.ts:
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Enable Global Response Standardization
app.useGlobalInterceptors(new TransformInterceptor());
app.useGlobalFilters(new GlobalExceptionFilter());
```

### 6.3 Patch Frontend `frontend/src/lib/api.ts`
Overload `extractApiError` to return clean string by default, while providing structured helper.

```typescript
export interface ExtractedApiError {
  status: number;
  message: string;
  code: string;
  fieldErrors?: Array<{ field?: string; message: string }>;
}

export function extractApiError(error: unknown): string {
  const info = extractApiErrorInfo(error);
  return info.message;
}

export function extractApiErrorInfo(error: unknown): ExtractedApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status ?? 500;
    const code = data?.code ?? (status === 400 ? 'VALIDATION_FAILED' : 'HTTP_' + status);
    
    // Parse RFC 7807 detail / message / fieldErrors
    let message = data?.detail || data?.message || error.message || 'Terjadi kesalahan sistem';
    if (Array.isArray(message)) {
      message = message.join(', ');
    } else if (data?.details?.fieldErrors && Array.isArray(data.details.fieldErrors)) {
      const first = data.details.fieldErrors[0];
      message = first?.message ? `${first.message}` : message;
    }

    return {
      status,
      message,
      code,
      fieldErrors: data?.details?.fieldErrors,
    };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message, code: 'UNKNOWN_ERROR' };
  }

  return { status: 500, message: 'Terjadi kesalahan tidak terduga', code: 'UNKNOWN_ERROR' };
}
```

### 6.4 Patch Frontend `frontend/src/components/dna/DnaToast.tsx`
Add runtime type defense against object arguments in `DnaToast`:

```typescript
const normalizeTitle = (title: unknown): string => {
  if (typeof title === "string") return title;
  if (!title) return "Terjadi kesalahan";
  if (typeof title === "object") {
    const obj = title as any;
    return obj.message || obj.detail || obj.code || JSON.stringify(title);
  }
  return String(title);
};

const normalizeOpts = (msgOrOpts?: string | DnaToastOptions): DnaToastOptions | undefined => {
  if (msgOrOpts === undefined) return undefined;
  if (typeof msgOrOpts === "string") return { description: msgOrOpts };
  if (typeof msgOrOpts === "object") {
    const opts = msgOrOpts as any;
    if (opts.description && typeof opts.description !== "string") {
      return { ...opts, description: String(opts.description?.message ?? JSON.stringify(opts.description)) };
    }
    return opts;
  }
  return { description: String(msgOrOpts) };
};

// In dnaToast methods:
error: (title: unknown, msgOrOpts?: string | DnaToastOptions) =>
  sonnerToast.error(normalizeTitle(title), normalizeOpts(msgOrOpts)),
```

### 6.5 Patch Frontend `frontend/src/lib/unwrap-response.ts`
Support extracting both data and pagination without destructive collapsing:

```typescript
export interface UnwrappedResult<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function unwrapResponse<T = any>(response: any): T {
  // If Axios response
  const payload = response && typeof response === "object" && "data" in response && "status" in response
    ? response.data
    : response;

  // If payload is already the data array or object
  if (!payload || typeof payload !== "object") return payload;

  // Standard API Envelope { success: true, data: T, pagination?: ... }
  if ("success" in payload && "data" in payload) {
    // If paginated, return payload so caller can read both .data and .pagination
    if (payload.pagination) {
      return payload as unknown as T;
    }
    return payload.data as T;
  }

  // Legacy fallback for { data: items, total, ... }
  if ("data" in payload && ("total" in payload || "totalPages" in payload)) {
    return payload as unknown as T;
  }

  // Legacy unwrap for raw Axios response wrapping
  if ("data" in payload && Object.keys(payload).length === 1) {
    return payload.data as T;
  }

  return payload as T;
}
```

---

## 7. Migration & Rollout Plan

### Phase 1: Defensive Guards (Zero Downtime, Immediate Fix)
1. Apply fix to `frontend/src/components/dna/DnaToast.tsx` with `normalizeTitle` guard.
   - **Impact**: Instantly immunizes all 27 master call sites and all other pages against "Objects are not valid as a React child" crashes.
2. Update `frontend/src/lib/api.ts` so `extractApiError()` returns string directly.
3. Patch all 11 active call sites in `master/customers/page.tsx`, `master/goods/page.tsx`, `master/suppliers/page.tsx`, and `master/warehouses/page.tsx`.

### Phase 2: Backend Transform Interceptor
1. Add `TransformInterceptor` to `backend/src/common/interceptors/`.
2. Register in `backend/src/main.ts`.
3. Verify backward compatibility with automated health check and Swagger `/api/docs`.

### Phase 3: Frontend unwrapResponse Alignment
1. Update `frontend/src/lib/unwrap-response.ts`.
2. Update paginated table pages (`master/materials/page.tsx`, `personnel/PersonnelRegistry.tsx`) to consume `res.pagination.total` and wire real backend page state.
3. Run test suites and verify:
   - `npm --prefix backend run typecheck`
   - `npm --prefix frontend run typecheck`
   - `npm --prefix frontend run build`

---

## 8. Verification Matrix

| Test Scenario | Action | Expected Result | Pass Criteria |
|---|---|---|---|
| Master Customer Create Fail | Submit empty customer form with network error simulation (400 Bad Request) | Red toast displays "Validasi gagal untuk field nama" or specific error message. React stays mounted. | ZERO console error `Objects are not valid as a React child`. Form stays responsive. |
| Master Goods Delete Fail | Delete goods linked to foreign key transaction (409 Conflict) | Toast displays business exception detail string. | Modal closes or shows error state without crash. |
| Paginated Material Fetch | `GET /v1/master/materials?page=1&limit=20` | Returns `{ success: true, data: [...], pagination: { total: 50, ... } }` | Material KPI card displays exact database total count, not sliced array length. |
| Single Item Detail | `GET /v1/master/customers/:id` | Returns `{ success: true, data: { id: ... } }` | Unwrapped cleanly by drawer/modal query without nested `.data.data`. |
