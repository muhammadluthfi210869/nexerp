# P06 Baseline and Complete Remediation Map — 2026-09-19

## Baseline verdict

`P06 = NOT_STARTED / IMPLEMENTATION_REQUIRED`

P05 is certified. P06 currently has useful partial code but does not satisfy its phase gate. This file records all known blocker families up front so the executor fixes root causes once rather than discovering them through repeated full certifications.

## Verified baseline observations

- Backend master module registers materials, categories, warehouses, suppliers, customers, tax rates and units.
- Current master tests are primarily module-existence or frontend API-shell tests; database-backed lifecycle coverage is incomplete.
- `CategoriesService` generates a code with `Math.random`, which is nondeterministic and concurrency-unsafe.
- Supplier controller/service uses `any`; API validation and field authorization cannot be proven.
- `WarehousesController` accesses Prisma directly rather than the owned service boundary.
- Customer master is implemented through `SalesLead`; goods through `MaterialItem`; CoA and formulation reside in other domain models. Their canonical meaning/ownership and compatibility behavior are not yet proven.
- Soft deletion varies between `deletedAt`, `isActive`, status changes, and sales-lead `LOST`; reference behavior is inconsistent.
- Several master screens catch API failures and continue with local fallback arrays; `/master/materials` explicitly defines `FALLBACK` data.
- Import/export endpoints required by canonical contracts and REQ-001/BUS-RULE-026 are incomplete.
- Most controllers use only `JwtAuthGuard`; P05 policy/tenant/field-scope enforcement and same-transaction audit are not universal.
- System settings do not yet constitute a complete typed, owned, non-secret configuration lifecycle.

## Complete remediation ledger

| ID | Root cause and impact | Required remediation method | Proof owner |
|---|---|---|---|
| `P06-B1` | Canonical master inventory and physical implementations are not reconciled | Generate a source-derived manifest for entities/operations/screens; update canonical ownership/traceability first; classify every alias as canonical owner or compatibility adapter | SF1 inventory gate + `P06-UNMAPPED-MASTER` |
| `P06-B2` | Customer/SalesLead, Goods/MaterialItem, CoA/Account and Formulation/Formula can become duplicate truth | Select one physical writer for each semantic master, document adapters and removal condition, forbid parallel tables/services without a canonical decision | SF1 alias gate + `P06-DUPLICATE-SOURCE-OF-TRUTH` |
| `P06-B3` | Direct controller persistence and untyped supplier payloads bypass validation/policy | Move all persistence behind owned application services/repositories; replace `any` with validated DTOs and canonical error mapping | SF3 + `P06-DIRECT-PRISMA-CONTROLLER` |
| `P06-B4` | Nondeterministic/manual code and partial uniqueness logic race under concurrency | Reuse a database-backed canonical sequence; add normalized unique constraints/indexes where required; catch conflicts deterministically; test concurrent creates/imports | SF3 + duplicate/nondeterministic mutations |
| `P06-B5` | Soft delete and inactive/reference semantics differ by entity | Define per-master lifecycle in contracts; implement one query policy; reject new references to inactive rows; retain historical references; prohibit physical deletion of referenced rows | SF3 + hard-delete/visibility/reference mutations |
| `P06-B6` | List/search endpoints are inconsistent and may be unbounded | Standardize page/limit/filter/sort/search envelopes and total count; clamp `limit <= 200`, default `<= 50`; prove tenant-scoped count/data parity | SF3/SF4 pagination mutations |
| `P06-B7` | Supplier/customer import and exports are missing/incomplete | Build dry-run/validate/commit service reusing CRUD validators, stable idempotency key, atomic transaction, row errors and safe scoped export; neutralize spreadsheet formulas | SF4 import/export mutations |
| `P06-B8` | P05 security controls are not applied to all master operations | Register canonical permission slugs; use server-trusted actor snapshot; enforce tenant/owner/division/field scopes on list/detail/search/export/write | SF2 plus policy seams/mutations |
| `P06-B9` | Audit/outbox can be absent or occur after success | Wrap governed create/update/deactivate/import in one transaction that writes immutable actor-at-event audit and required outbox before success | SF2/SF6 + audit seam/mutation |
| `P06-B10` | Production frontend fallback hides backend failure and creates split truth | Remove fallback/mock data from canonical P06 screens; render loading/empty/error/denied/retry states; keep fixtures test-only | SF5 + fallback mutation |
| `P06-B11` | Canonical P06 screens/routes and backend API shapes drift | Reconcile route/operation aliases contract-first, add typed client adapters, cover create/edit/detail/list/import/export states and DNA-only composition | SF5 + API/UI seam |
| `P06-B12` | System configuration ownership and secret boundaries are incomplete | Provide typed schema/owner/version/concurrency behavior for non-secret settings; use secret indirection only; audit changes; never return secret values | SF2 config gate |
| `P06-B13` | Existing tests do not prove real PostgreSQL behavior or cross-subphase bridges | Add shared production-path unit/integration/mutation registries, unique DB per worker, six seam suites and affected regression/build checks | SF6/preflight |

## Out-of-scope safeguards

- Do not implement P07–P18 transactional workflows in P06.
- Do not convert KPI, HR, automation or formulation approval workflows into P06 merely because their current route begins with `/master`.
- Do not run Docker/deploy/full-browser/load/DR loops.
- Do not rewrite P05 controls; consume them through their public platform boundaries.
- Do not weaken P03/P04/P05 gates or introduce broad exceptions.

## Exit expectation

All 13 blocker families close in one implementation cycle through their owning targeted subphase tests. Full P06 certification runs only after all six subphases and six seams pass preflight.
