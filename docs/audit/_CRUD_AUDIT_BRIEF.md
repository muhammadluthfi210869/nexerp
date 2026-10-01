# CRUD Surgical Audit Brief — NEX ERP

You are auditing ONE domain module (assigned) of the NEX ERP for production-readiness.
You do NOT write implementation code. You produce an **Actionable Execution Ticket**.

Repo root: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO`
- Frontend: `frontend/` (Next.js app router, `frontend/src/app/(dashboard)/<domain>/<route>/page.tsx`)
- Backend:  `backend/` (NestJS, `backend/src/modules/<domain>/`)
- Prisma:   `backend/prisma/schema.prisma`
- Route registry (READ FIRST): `docs/ROUTE_MAP.md`

## Architectural rules in force
1. Frontend Tri-Layer Colocation per route: `_components/` (presentation), `_hooks/` (operations + state),
   `_types/` (interfaces/DTOs), `page.tsx` ultra-thin shell (<120 lines, hard cap 150).
2. Backend: Controller -> Thin Facade Service (<250 lines) -> Single-Responsibility Sub-Services.
   Multi-step mutations MUST be `prisma.$transaction(async (tx) => {...})`.
3. UI preservation: do NOT propose Tailwind/design-token (`@/components/dna`) changes.
   Audit data binding, validation, state sync, CRUD lifecycle only.
4. Strict TypeScript, zero `any`.

## Audit dimensions (check EVERY one, per operation)
### CREATE
- Form collects all schema-required fields? Enumerate Prisma NOT NULL fields w/o default vs form fields.
- Type conversion before send (string->number, ISO date, Decimal/Prisma.Decimal, `''` -> null vs undefined).
- Client AND server validation (Zod / DTO). Is the DTO applied at the controller?
- Submit disabled + spinner (double-submit guard)?
- On success: toast, close modal/drawer, reset form, invalidate React Query cache.

### READ / FILTER / PAGINATION
- Query params handled (page, limit, search, status, date range, sort)?
- Pagination metadata shape returned vs consumed (`page`,`pageSize`,`totalCount`,`totalPages`) — MISMATCH IS A FINDING.
- All 3 states rendered: isLoading (skeleton), isError (retryable), empty (illustration).
- Nested relations accessed without optional chaining -> `TypeError: Cannot read properties of undefined`.

### UPDATE
- Edit modal initial values from selected item or dedicated fetchById? Or from a stale list cache?
- Partial vs full update; does the payload drop keys vs send empty strings (empty string -> null wipe bug)?
- FK / id params mapped correctly?
- On success: invalidate detail AND list, close modal, toast.

### DELETE
- Confirmation modal identifying the item by name/code?
- Backend FK / cascade guard (cannot delete parent with children)?
- Soft delete vs hard delete consistent DB<->UI?
- On success: invalidate, handle deleting last item on last page, close modal.

### ERROR HANDLING / EDGE CASES
- Structured error shape: `{ success:false, message, errors?: Record<string,string[]> }`.
- Frontend parses field-level errors into toasts vs generic "Something went wrong"?
- Optimistic updates rolled back on error?

## Known repo-wide context (do not re-derive, but DO verify if relevant)
- Memory: 63 of 107 `_hooks` files are dead — the Tri-Layer convention was applied but pages still contain their own inline logic. Two copies of each domain's logic exist and disagree. Check whether YOUR module's page imports its `_hooks`.
- Memory: `Customer` and `SalesLead` are two distinct entities; do NOT propose consolidating them.
- Memory: Prisma `?schema=` query param is inert — the backend builds its own `pg.Pool`.
- Memory: local DB was built with `db push` (212 tables, zero `_prisma_migrations`).
- Memory: production runs SHA 7a449e0a, 102 commits behind HEAD — findings may already be fixed upstream but NOT deployed.

## Method discipline
- Verify claims by reading code. Cite `path:line` for every finding.
- Do not inflate counts with loose name matching; prefer intersection of two independent signals.
- Distinguish CONFIRMED (read the code, saw it) from SUSPECTED (inferred). Label each.

## Output format (strict)
For each finding:

### 📌 Module: [<Name> / <Route>]
#### [<AREA>-<NN>]: <Short title>
- **Target Files**:
  - Frontend: `path`
  - Backend: `path`
  - Database: `prisma/schema.prisma` (only if applicable)
- **Severity**: `[Critical Bug | Contract Mismatch | Broken UX State | Missing Validation | Edge Case]`
- **Confidence**: `[CONFIRMED | SUSPECTED]`
- **Root Cause & GAP**: precise, with `path:line` evidence.
- **Exact Contract Specification**:
  - Request DTO:
    ```json
    { "exampleField": "value" }
    ```
  - Expected Response DTO:
    ```json
    { "success": true, "data": {} }
    ```
- **Actionable Execution Plan**:
  - `[file]` — exact change needed.
  - `[file]` — state / hook change needed.
  - `[Verification]` — expected behavior after fix.

Order findings Critical first. End with a per-module one-line verdict table.
Write the full ticket to the assigned output path. In your final message return only:
(a) the output path, (b) a count by severity, (c) the single most dangerous finding in one sentence.
