# P09 Frozen Acceptance Contract

**Phase:** P09 — Sales, Down Payment, Delivery, Accounts Receivable, and Sales Returns  
**Contract version:** `P09-v1`, frozen 2026-09-24  
**Final verification command:** `npm run verify:p09`  
**Success:** natural exit `0`; all focused backend, frontend, PostgreSQL golden-thread, affected build/type/lint and cleanup checks pass  

## Purpose and finish line

P09 is complete when one real, tenant-safe sales golden thread proves:

`Sales Lead → Quotation → Sales Order (SO) create & lock → DP Finance invoice & payment → Delivery Order (DO) dispatch & inventory deduct → Sales Invoice & AR ledger recognition → Customer Payment / Pelunasan AR → Sales Return & Credit Note / Refund`

and the same transactions produce the required immutable records, approval segregation, audit/outbox effects, and exact ledger reconciliation.

## Frozen scope

In scope:
- Sales Order lifecycle (`DRAFT → ACTIVE → PROCESSING → COMPLETED/CANCELLED`) with customer, pricing, discount, tax (PPN), and delivery schedule;
- Down Payment (DP) Finance workflow: DP invoice generation, payment confirmation, and automatic deduction against final sales invoice;
- Delivery Order (DO) validation: stock availability check, warehouse dispatch authorization, packaging slip generation, and automatic inventory reduction;
- Sales Invoicing & Accounts Receivable (AR): invoice creation with terms of payment (TOP), AR aging calculation (Current, 1-30, 31-60, 61-90, >90 days), and payment receipt allocation;
- Customer Payment (Pelunasan Piutang): multi-invoice allocation, partial payment tracking, bank account linkage, and receipt generation;
- Sales Return (Retur Penjualan): return authorization, inspection routing (Good/Reject/Restock), and Credit Note or refund generation;
- Frontend live data wiring on the 6 named surfaces (`/penjualan/sales-orders`, `/penjualan/down-payment`, `/penjualan/delivery-orders`, `/penjualan/faktur-penjualan`, `/penjualan/bayar-penjualan`, `/penjualan/retur-penjualan`), eliminating static mock data using `@/components/dna`.

Out of scope:
- R&D sample request and formulation lock (P08);
- Production planning, scheduling, and CPKB batch manufacturing (P12/P13);
- Formal laboratory QC finished good release (P14);
- General ledger period closing and financial statement generation (P15).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P09-01` | **SO Lifecycle & Validation:** Sales order enforces valid customer, product lines, tax calculations, and locks price upon confirmation (`BUS-RULE-001..003`). |
| `AC-P09-02` | **Down Payment Finance:** DP invoice is generated, recorded with unique payment reference, and automatically applied as credit toward final invoice balance (`BUS-RULE-004..006`). |
| `AC-P09-03` | **Delivery Order & Dispatch:** DO verifies inventory availability before dispatch, deducts warehouse stock atomically, and updates SO fulfillment status (`BUS-RULE-007..009`). |
| `AC-P09-04` | **Invoicing & AR Aging:** Invoice tracks payment terms, remaining balance, and computes aging buckets without date discrepancies (`BUS-RULE-010..012`). |
| `AC-P09-05` | **Payment Allocation:** Pelunasan piutang verifies amount, allocates accurately across selected invoices, and closes paid invoices cleanly (`BUS-RULE-013..014`). |
| `AC-P09-06` | **Sales Return & Credit Note:** Return intake documents reason, handles restock or scrap, and creates offsetting credit note (`BUS-RULE-015`). |
| `AC-P09-07` | **Frontend Live Surfaces & DNA:** Named surfaces fetch live backend data, handle loading/empty/error states with DNA components, and zero TypeScript/runtime errors. |
| `AC-P09-08` | **Thin Final Verification & Clean DB:** Single command `npm run verify:p09` exits `0`, and all test artifacts/databases are cleaned up with zero residue. |
