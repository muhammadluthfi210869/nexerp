# P10 Frozen Acceptance Contract

**Phase:** P10 — SCM, MRP, procurement, AP, and matching  
**Contract version:** `P10-v1`, frozen 2026-09-21  
**Final verification command:** `npm run verify:p10`  
**Success:** natural exit `0`; all focused backend, frontend, PostgreSQL golden-thread, affected build/type/lint and cleanup checks pass  

## Purpose and finish line

P10 is complete when one real, tenant-safe procurement golden thread proves:

`material shortage / need → PR create & approve → PO create with controls & approval tier → 3-pillar GR (Good/Reject/Free) → QC pass → Invoice 4-leg zero-tolerance match → DP offset & AP payment → Return & Debit Note`

and the same transactions produce the required immutable records, approval segregation, audit/outbox effects, and exact reconciliation.

## Frozen scope

In scope:
- Material Requirements Planning (MRP) shortage calculation from SO/BOM vs inventory real stock;
- Purchase Request (PR) lifecycle (`DRAFT → PENDING → APPROVED/REJECTED → CONVERTED`) with requester, cost center, and urgency classification;
- Purchase Order (PO) controls: server-side auto read-only date (`today()`), discount in Rupiah, shipping cost, packing rounding adjustment to discount, SOP price range check ($\le$ 110% ref price), multi-tier approval ($\le$ 5M, 5M–100M, > 100M), and digital signature capture;
- Goods Receipt (GR / Inbound) 3-pillar quantities: `qtyGood`, `qtyReject`, and `qtyFree` satisfying `sum == orderedQty`, with stock increment restricted solely to `qtyGood`;
- Purchase Invoice / Bill generation, Excel import template endpoint, Down Payment (DP) application, and 4-leg exact matching engine (`PO ordered ↔ GR received ↔ QC passed ↔ Invoice billed`) with zero tolerance (percentage accuracy hidden from UI, variance flagged as `EXCEPTION`);
- Accounts Payable (AP) payments (BPB) with multi-bill allocation, payment reversal, duplicate invoice prevention, and Purchase Return with Debit Note generation;
- Frontend live data wiring on the 8 named surfaces (`/pembelian/kebutuhan`, `/pembelian/purchase-requests`, `/pembelian/purchasing`, `/pembelian/receiving`, `/pembelian/faktur-pembelian`, `/pembelian/dp-pembelian`, `/pembelian/bayar-pembelian`, `/pembelian/purchase-returns`), completely eliminating static mock arrays (`_data.ts`, `INITIAL_BILLS`, etc.) using `@/components/dna`.

Out of scope:
- Warehouse lot tracking, multi-warehouse transfer, and stock opname thresholds (P11);
- Production planning dispatch and CPKB batch execution (P12/P13);
- Formal laboratory QC release and full batch traceability (P14);
- General ledger period closing and financial statement generation (P15);
- External supplier chat/portal integration (Phase 2).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `AC-P10-01` | **MRP & PR Lifecycle:** Shortage calculation identifies raw material deficits against SO requirement; PR validates requester and urgency; PR transitions cleanly through approval and marks converted upon PO link. |
| `AC-P10-02` | **PO Controls & Hierarchy:** PO date is immutable server-side (`today()`); discount in Rp and shipping cost calculate correctly; price check detects >110% last ref price; approval enforces role tier and digital signature requirement. |
| `AC-P10-03` | **Inbound 3-Pilar:** Receipt validates `qtyGood + qtyReject + qtyFree == orderedQty`; inventory balance increases ONLY by `qtyGood`; PO updates status to `PARTIAL` or `CLOSED`. |
| `AC-P10-04` | **4-Leg Zero-Tolerance Match:** PO ↔ GR ↔ QC ↔ Invoice matching detects any variance in qty or price, flags `EXCEPTION` without auto-approving differences, and hides match percentage from output; DP applies to reduce bill outstanding balance. |
| `AC-P10-05` | **AP Allocation, Reversal & Debit Note:** Payment allocates to selected bills; duplicate invoice submission is rejected; payment reversal cleanly rolls back bill balance; purchase return generates debit note. |
| `AC-P10-06` | **Frontend Live Surfaces & DNA:** Named surfaces fetch live backend data, handle loading/empty/error/data states with DNA components, and contain zero static mockup array fallbacks. |
| `AC-P10-07` | **Thin Final Verification & Clean DB:** Single command `npm run verify:p10` exits `0`, and all test artifacts/databases are cleaned up with zero residue. |
