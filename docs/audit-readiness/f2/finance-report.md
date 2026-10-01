# F2-FINANCE — Runtime Validation Report

Agent: F2-FINANCE | Port: 3211 | Database: `audit_f2_finance` (schema `public`)
Date: 2026-10-01
Protocol: `docs/audit-readiness/F2-PROTOCOL.md`

Scope actually executed: 5 assigned tests (D1-001, D1-003, journal balance guard, invoice
lifecycle guards, D4-003). Not a full CRUD sweep — budget was capped at these five.

---

## Box preconditions (measured, matters for reading every number below)

- Port 3211 is owned by PID 19436, launched with
  `DATABASE_URL=postgresql://…@localhost:5432/audit_f2_finance?schema=public`.
- The `audit_f2_finance` database **contains six agent schemas**
  (`public`, `audit_f2_finance`, `audit_f2_master`, `audit_f2_warehouse`,
  `audit_f2_production`, `audit_f2_crm`, `audit_f2_hr`). Box isolation is nominal:
  every box database holds a full copy of every agent's schema. The application only
  ever reads `public`, so results below are still `public`-scoped and uncontaminated,
  but the isolation guarantee in F2-PROTOCOL §2 is not what it claims to be.
- Database was empty at start: 0 customers, 0 sales_invoices, 0 journal_entries.

---

### [F2-FIN-001] Posting a sales invoice writes NOTHING to the general ledger
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:150-171`
- Bukti:       3 invoices created and posted over HTTP. All three returned `201`,
              all three have `postedAt` set in the database. `journal_entries` = 0,
              `journal_lines` = 0. The post is a silent no-op on the GL.
              The cause is the guard at line 152: `if (arAcc && revAcc)`. `1201`
              exists, `4001` does **not** — the COA carries revenue as `4101
              Pendapatan Kontrak Maklon Kosmetik`. `findFirst({code:'4001'})` returns
              null, the `if` is false, and the transaction commits the invoice with
              no journal. No error, no warning, no log.
- Repro:       `POST /v1/auth/login` → `POST /v1/finance/sales-invoices` (3x, 100,000,000
              each) → `POST /v1/finance/sales-invoices/:id/post` (3x) → all 201;
              `select count(*) from public.journal_entries` returns 0.
- Dampak ke client: Every sales invoice this ERP issues is invisible to accounting.
              AR, revenue, and the entire general ledger are permanently understated
              by 100% of invoiced revenue, while the UI reports the invoice as "posted".
- Lapis:       API + DB

---

### [F2-FIN-002] The account-code regime in the posting code does not exist in the seeded COA
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:152-153`
- Bukti:       The COA in `public.accounts` holds 17 accounts. Codes present include
              `1201`, `2101`, `2301`, `3100`, `4101`, `4102`, `5100`, `5110`, `5190`,
              `6201`. Code `4001` is absent. The posting path asks for `4001`, so it can
              never resolve. The failure mode is a silent `if` skip rather than a thrown
              error, which is why it survived to production.
- Repro:       `select code,name from public.accounts order by code;` — 17 rows, no `4001`.
- Dampak ke client: The single most common revenue-posting path in the product is dead
              in the box, and it reports success.
- Lapis:       DB

---

### [F2-FIN-003] `POST /v1/master/customers` writes to `sales_leads`, not `customers`
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/master/**` (customer create path) — consumer
              `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:62-64`
- Bukti:       `POST /v1/master/customers` with
              `{"clientName":"F2-AUDIT-Customer","email":"f2audit@dreamlab.com"}`
              returned `200` with a UUID and a body whose fields are
              `clientName / brandCode / source / productInterest / estimatedValue /
              status:"NEW_LEAD" / lostReason / picId` — a SalesLead shape, not a
              Customer shape (`public.customers` columns are
              `id, code, name, brand, contactPerson, email, phone, address, npwp,
              creditLimit, paymentTerms, isActive, notes`).
              A full scan of every UUID-keyed table in the whole database located that
              returned UUID in exactly one place: `public.sales_leads`.
              `public.customers` row count was 0 before and 0 after.
              Consequence for this audit: `POST /v1/finance/sales-invoices` then returned
              `404 Customer f53e6b74-… not found` for the ID the customers API had just
              minted. **There is no API path that can create a Customer**, and sales
              invoicing is hard-gated on a Customer row.
- Repro:       `POST /v1/master/customers` → take `.id` → `POST /v1/finance/sales-invoices`
              with that id → `404 … Customer … not found`. DB: the id is in
              `public.sales_leads`, not `public.customers`.
- Dampak ke client: The "New Invoice" screen in the product cannot produce a valid
              invoice. The customer picker writes an id the finance module rejects.
- Lapis:       API + DB + FE-BE

---

## TEST 1 — D1-001: PPN is never credited

**Verdict: PROVEN, and materially worse than F1 described.**

F1 claimed the post produces `Dr 1201 = totalAmount` / `Cr 4001 = subtotal` — a journal
that is lopsided by the tax. Both halves of that are correct, but they do not co-exist
in any reachable state, so the outcome is not "an unbalanced-but-present journal". The
code path has exactly two outcomes, and **neither writes a correct journal**:

| State | HTTP on `POST /:id/post` | Journal written? | Invoice `postedAt` |
|---|---|---|---|
| A — COA as seeded (no `4001`) | **201** | **0 entries, 0 lines** | set |
| B — COA fixed to match code (`4001` exists) | **400 JOURNAL_UNBALANCED** | 0 (rolled back) | stays `null` |

### [F2-FIN-004] Sales-invoice posting is in a dead state: it either does nothing or refuses
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:146-171`
- Bukti:       **State B, measured directly.** With a `4001` account present, posting a
              100,000,000 + 11% PPN invoice returns:
              `HTTP 400 — "Journal is not balanced. Debit: 111000000, Credit: 100000000 [JOURNAL_UNBALANCED]"`.
              The 11,000,000 gap **is exactly `taxAmount`**, which is the arithmetic
              proof of D1-001: the code debits `totalAmount` (subtotal + PPN) and credits
              `subtotal` only, and never posts a line to a tax payable (`2301` /
              `2201` are never referenced in this file; `journal_lines.taxAccountId` and
              `journal_lines.taxRate` columns exist in the schema and are never populated
              by any code in this path).
              **State A, measured first.** Before the `4001` probe account existed,
              3 invoices posted `201` each and produced 0 journal entries
              (see F2-FIN-001).
              The probe invoice `caf04b34-06f3-4eed-a5eb-1943c43d0103` survived the 400
              with `postedAt = null`; `sales_invoices` = 4, `journal_entries` = 0.
- Repro:       Insert `4001` into `public.accounts`, then create + post a sales invoice of
              100,000,000. The 400 body quotes both totals and the delta is the tax.
              Delete the `4001` row and post again: 201, and still no journal.
- Dampak ke client: There is no configuration in which a sales invoice reaches the ledger.
              Correcting the COA (adding `4001`) does not fix invoicing — it converts a
              silent omission into a total block on all customer invoicing.
- Lapis:       API + DB

### Note on the demonstration F1 asked for
F1 asked to show `1201` exceeding the sum of subtotals by the cumulative tax. **That
arithmetic cannot be produced in this system**, because the journal is never written:
after 3 posted invoices `sum(subtotal)` = 300,000,000 and the `1201` balance derived
from `journal_lines` is **0**. The consequence is therefore worse than an overstated
receivable — the receivable is absent entirely. Sum of PPN stranded across those 3
invoices: 33,000,000, with no liability account credited for any of it.

---

## TEST 2 — D1-003: the balance sheet can never report an imbalance

**Verdict: DISPROVEN for both live endpoints.** The claim targets code that is not
reachable, and the code that *is* live detects the imbalance correctly.

### What was measured
Two journal entries were inserted directly into `audit_f2_finance`:

| reference | stored date | Dr | Cr |
|---|---|---|---|
| `F2-AUD-BAL-A` | 2026-10-01 12:48:19 | 1201 = 50,000,000 | 4101 = 50,000,000 |
| `F2-AUD-UNBAL` | 2026-09-15 00:00:00 | 1201 = 70,000,000 | 4101 = 50,000,000 |

Independent recompute, straight from `journal_lines`:
`sum(debit) = 120,000,000`, `sum(credit) = 100,000,000`, **imbalance = 20,000,000**.

Both live balance-sheet endpoints, asked about that data:

| endpoint | app totalDebit | app totalCredit | app `isBalanced` |
|---|---|---|---|
| `GET /v1/finance/reports/balance-sheet?date=2026-12-31` | 120,000,000 | 100,000,000 | **`false`** |
| `GET /v1/reports/balance-sheet` (ExecutiveModule, the one the UI uses) | — | — | **`false`** |
| `GET /v1/finance/reports/trial-balance` | 120,000,000 | 100,000,000 | **`false`** |

App totals equal the independent recompute to the rupiah. The app correctly reports
`isBalanced: false`. D1-003 as written does not hold.

### [F2-FIN-005] D1-003 targets unreachable code; two competing balance-sheet implementations exist
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      F1 target `backend/src/modules/reports/services/balance-sheet-report.service.ts:207`
              (`isBalanced: totalDebit === totalCredit`) — registered in
              `reports.module.ts:15,22` and called from
              `reports/services/financial-reports.service.ts:33`
- Bukti:       `FinancialReportsService` is injected only into
              `backend/src/modules/reports/reports.controller.ts:33`, and that controller
              declares exactly 9 routes: `general-ledger`, `budget-vs-actual`,
              `cost-variance`, `product-profitability`, `stock`, `mutation-goods`,
              `follow-up-customer`, `guest-book`, `POST goods-receipts`.
              **None of them is `balance-sheet`.** The comment at
              `reports.controller.ts:39-50` documents the deliberate removal of the eight
              financial-report routes because `ExecutiveModule` is imported first and
              Express answered them from `executive/reports.controller.ts`. The
              `is_balanced`/`===` expression F1 flagged is therefore on a code path no
              request can reach. The live implementations are
              `finance/finance-report.service.ts:196-285` and the executive reports
              service, both of which use `Math.abs(a - b) < 0.01`.
- Repro:       `grep -n "@Get(" backend/src/modules/reports/reports.controller.ts` — 9
              routes, no `balance-sheet`. Then call
              `GET /v1/finance/reports/balance-sheet` and observe `isBalanced: false`
              against deliberately lopsided data.
- Dampak ke client: F1's D1-003 can be closed as a live defect. It remains a real
              maintainability hazard: a second, stricter, unreachable balance sheet is
              still in the module graph and would be reintroduced by any developer who
              re-adds a `/reports/balance-sheet` route.
- Lapis:       API

### [F2-FIN-006] A balance sheet called without `date` silently omits every journal written today
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/finance-report.service.ts:47-52` (`where.date.lte`)
              + `getBalanceSheet(date?: Date)` at `:196-198`; controller default
              `backend/src/modules/finance/finance.controller.ts:317-321`
              and `backend/src/modules/executive/reports.controller.ts:108-110`
- Bukti:       `journal_entries.date` is `timestamp without time zone` and the database
              session timezone is `Asia/Bangkok` (UTC+7). The probe journal written at
              "now" is stored as the literal wall-clock value `2026-10-01 12:48:19`.
              Both balance-sheet controllers default to `new Date()`, which at that
              moment is `2026-10-01T05:49Z` — 7 hours earlier on the clock face. The
              filter is `date <= cutoff`, so the same-day row fails the comparison and
              is dropped. Measured: with the report generated at
              `2026-10-01T05:48:57Z`, `GET /v1/finance/reports/balance-sheet` returned
              `assets.total = 0` while `journal_lines` held a 50,000,000 receivable; the
              identical call with `?date=2026-12-31` returned `assets.total = 120,000,000`.
              In the unbalanced run the same split is visible cleanly:
              default = 70,000,000 (only the 2026-09-15 entry),
              `?date=2026-12-31` = 120,000,000 (both) — **50,000,000 missing**, exactly
              the same-day receivable.
              `isBalanced` was `true` in the zero case and `false` in the full case,
              so the flag tracks whatever the filter happened to return.
- Repro:       Insert a journal dated `now()::timestamp`, then
              `GET /v1/finance/reports/balance-sheet` (returns 0 / misses it) and
              `GET /v1/finance/reports/balance-sheet?date=2026-12-31` (returns it).
- Dampak ke client: The default balance sheet — what a dashboard requests — understates
              every account by everything booked on the current day, and reports the
              result as balanced. This is the ordinary path, not an edge case.
- Lapis:       API + DB

**Note on F1's supplied repro SQL:** it selects `jl."journalEntryId"`. The actual FK is
`journal_lines."journalId"` (→ `journal_entries.id`). F1's query would error
`column "journalEntryId" does not exist`.

---

## TEST 3 — can an unbalanced journal be created over HTTP?

**Verdict: NO. The guard holds. This one is a clean PASS.**

`POST /v1/finance/journals` with `Dr 1201 = 90,000,000` / `Cr 4101 = 50,000,000`:

```
HTTP 400
"Journal is not balanced. Debit: 90000000, Credit: 50000000 [JOURNAL_UNBALANCED]"
```

The same request balanced (50,000,000 / 50,000,000, plus the mandatory proof-of-payment
attachment this route requires) returns `HTTP 201` and persists
journal `213fa7a5-cd85-478e-a3e9-58ee88def6fd`.

The guard is not route-specific — it is a Prisma **client-level** `$extends` in
`backend/src/prisma/prisma/prisma.service.ts:84-94`, so it applies to every service
that touches the database. Measured, not assumed:

- `journalEntry.create` call sites across the backend: **36**
- `new PrismaClient` outside the single `PrismaService`: **0** — no second client to bypass
- raw-SQL writes to `journal_entries` / `journal_lines`
  (`$queryRaw` / `$executeRaw` / `pool.query`): **0**
- `journalEntry.createMany` / `.upsert` / `.update` / `.updateMany` sites: **0**
  (the extension only wraps `create`)
- direct `journalLine.create` sites: **0** (the one grep hit is a comment at
  `prisma.service.ts:35`)

So all 36 auto-posting sites — bills, payments, depreciation, down-payments, stock
movements, adjustments — pass through the same guard.

### The one caveat that matters
The guard is the **only** thing standing between F2-FIN-004 and silent data corruption,
and the sales-invoice path never even reaches it: in state A it calls
`journalEntry.create` zero times, so no guard is consulted. In state B the guard is what
converts the missing tax line into a hard 400. Remove the guard and state A is already a
silent hole; keep it and state B is a loud block. Neither state is correct.

---

## TEST 4 — invoice lifecycle guards

| # | operation | HTTP | DB state afterwards | verdict |
|---|---|---|---|---|
| a | `POST /:id/post` on an already-posted invoice | **400** `"Sales invoice already posted."` | `journal_entries` unchanged | **PASS** — idempotency guard holds |
| b | `PATCH /:id` / `PUT /:id` on a posted invoice | **404** `Cannot PATCH /v1/finance/sales-invoices/:id` | untouched | no route exists |
| c | `DELETE /:id` on a posted invoice | **404** `Cannot DELETE …` | untouched | no route exists |
| d | `POST /:id/cancel` on a posted invoice | **201/200** | `cancelledAt` set, **`postedAt` still set**, ledger untouched | **FAIL** |
| e | `POST /finance/journals/:id/reverse` | **201** | real contra entry created | **PASS** |

### [F2-FIN-007] Cancelling a posted invoice does not reverse its accounting entry
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:174-193`
              (`cancel()`), route `sales-invoices.controller.ts:61`
- Bukti:       `POST /v1/finance/sales-invoices/da91ec89-…/cancel` with
              `{"reason":"F2_AUDIT reverse probe"}` returned `200`. The resulting row is
              `{"postedAt":"2026-09-30T22:46:26.791Z","cancelledAt":"2026-09-30T22:51:11.040Z"}`
              — the invoice keeps `postedAt` **and** gains `cancelledAt`, so it is
              simultaneously posted and cancelled. `cancel()` performs a single
              `salesInvoice.update` setting `cancelledAt` and appending a note to
              `notes`. It reads no journal, creates no contra entry, and calls no
              reversal path. The only guard is `paidAmount > 0`, which is unrelated to
              the ledger.
              By contrast the general ledger's own reversal route
              `POST /v1/finance/journals/:id/reverse` is correct: reversing
              `F2-AUD-BAL-HTTP` produced a new entry `REV-F2-AUD-BAL-HTTP` with the
              Dr/Cr legs genuinely flipped (1201 Cr 50,000,000 / 4101 Dr 50,000,000),
              leaving the original intact and the pair netting to zero. The correct
              mechanism exists — the invoice path simply does not use it.
- Repro:       Post an invoice, then
              `POST /v1/finance/sales-invoices/:id/cancel`. Read the row: `postedAt`
              and `cancelledAt` are both non-null. `journal_entries` is unchanged.
- Dampak ke client: A cancelled invoice keeps its full value on the balance sheet.
              There is no way to void a posted invoice from the API.
- Lapis:       API + DB

### [F2-FIN-008] The sales-invoice journal would not be linked to its invoice even if it were created
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:155-170`
- Bukti:       `journal_entries` has a `salesInvoiceId` column. The post handler's
              `journalEntry.create` sets only `date`, `reference`, `description`,
              `sourceDocumentType` and `lines` — it never sets `salesInvoiceId`. It also
              stamps `sourceDocumentType: 'SALES_ORDER'` on a *sales invoice* rather than
              an invoice type. Consequence: a journal produced by this path could not be
              traced back to its invoice, and `cancel()` could not locate it to reverse
              it even if cancellation were implemented. Querying
              `journal_entries where "salesInvoiceId" = <invoice id>` returns 0 rows for
              every invoice in this box.
- Repro:       Read the `journalEntry.create` block at line 155 — no `salesInvoiceId` key.
- Dampak ke client: Invoice-to-ledger traceability is absent; audit cannot follow money
              from an invoice into the GL or back.
- Lapis:       DB

### [F2-FIN-009] No API route exists to edit or void a sales invoice
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/finance/sales-invoices/sales-invoices.controller.ts:24-61`
- Bukti:       The controller declares exactly five routes: `GET /`, `GET /:id`,
              `POST /`, `POST /:id/post`, `POST /:id/cancel`. `PATCH`, `PUT` and
              `DELETE` all return `404 Cannot <METHOD> /v1/finance/sales-invoices/:id`.
              An invoice is therefore immutable from its creation moment — a wrong
              line item can only be abandoned, never corrected, and there is no
              credit-note path.
- Repro:       `curl -X PATCH http://localhost:3211/v1/finance/sales-invoices/:id` → 404.
- Dampak ke client: Any invoice entered with a mistake is permanently wrong; the only
              recourse is cancel, which per F2-FIN-007 does not fix the ledger.
- Lapis:       API

---

## TEST 5 — D4-003: the executive dashboard swallows failures

**Verdict: PROVEN by execution. F1's count of 12 is exactly correct.**

### Count — measured, not eyeballed
`backend/src/modules/executive/executive.service.ts` is 623 lines and contains exactly
**12 `catch` blocks**, at lines 87, 107, 154, 209, 227, 245, 248, 308, 333, 361, 378, 381.
All 12 share one shape: `console.error(...)` and fall through. None rethrows, none sets an
error flag, and the object being returned was pre-populated with zeros before the first
`try` opened (`executive.service.ts:30-46`). Two of them (248, 381) are outer wrappers
around the other ten, so a failure in an inner block is logged once and the outer one
never sees it.

### Reproduction over HTTP
The executive methods take no request parameters, so a malformed period cannot be used
as a trigger. Instead the underlying query was broken directly, then repaired.

1. **Baseline, query working.** A `financial_periods` row covering 2026-10-01 and a
   `financial_summary_ledger` row with `nominalValue = 777,000,000` were inserted, then
   `GET /v1/executive/metrics` was called. `revenue.mtd = 777000000`,
   `revenue.achievement = 15.54`, `revenue.projection = 24087000000`. The path is live.
   (Before this, the seeded periods stop at 2025-04-30, so no period covered the present
   and `revenue.mtd` was 0 from the template — a genuine zero, not a caught throw.)

2. **Query forced to throw.** `financial_summary_ledger."nominalValue"` was renamed to
   `"nominalValue_F2TMP"`, making the `financialSummaryLedger.findUnique` inside
   `ExecMetrics Error (Revenue)` fail.

3. **`GET /v1/executive/metrics` with that query throwing:**

```
HTTP 200
revenue.mtd = 0          <- was 777,000,000, now silently zeroed
pipeline.total     3 -> 3        (unaffected)
production.active  1 -> 1        (unaffected)
cashflow.totalAR   90,000,000 -> 90,000,000  (unaffected)
```

Status stayed **200**. The body is a complete, well-formed dashboard payload. There is
no error key, no `partial: true`, no degraded marker. The client receives a zero and
cannot distinguish "the company had no revenue this month" from "the revenue query
crashed".

4. **Repaired.** The column was renamed back; `revenue.mtd` returned to `777000000` on
the next call. Schema is restored — verified by reading the column back.

### [F2-FIN-010] Executive dashboard returns HTTP 200 with zeroed financials when its queries fail
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/executive/executive.service.ts:87,107,154,209,227,245,248,308,333,361,378,381`
              (routes: `GET /v1/executive/metrics`, `GET /v1/dashboards/metrics`,
              `GET /v1/executive/dashboard`, `GET /v1/dashboards/executive`,
              `GET /v1/executive/alerts`, `GET /v1/dashboards/alerts`)
- Bukti:       See steps 1-4 above. Revenue `777,000,000 -> 0` across a query failure,
              HTTP 200, all other sections unaffected, client given no indication.
- Repro:       `alter table financial_summary_ledger rename column "nominalValue" to
              "x"; curl -H "Authorization: Bearer $TOKEN" localhost:3211/v1/executive/metrics`
              → 200 with `revenue.mtd: 0`.
- Dampak ke client: Management dashboards present a crashed query as a real number. A
              CFO reading "revenue 0, AR 90,000,000, pipeline 3" has no way to know the
              revenue line is a swallowed exception. The failure is invisible until
              someone reconciles by hand.
- Lapis:       API
