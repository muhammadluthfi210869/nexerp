# NEX ERP — All-Phase Legacy Parity and Provenance Audit

**Scope:** P00–P22  
**Started:** 2026-09-20  
**Mode:** read-only verification; no product-code implementation  
**Workflow authority:** `_FAST_DELIVERY_EXECUTION_STANDARD.md`  
**Business authority:** `contracts/00_MASTER_SPEC.md §9.1`

## Purpose

Prevent observations, owner-requested evolution, technical safeguards, and AI inference from being blended into one apparently authoritative ERP specification. This audit is a guardrail for every remaining phase, not a new business-rule authority and not a phase certifier.

The historical crawl and inventories establish route, field, table, action, and visible-status evidence. They do **not** prove hidden server-side rules, actor authority, transaction boundaries, calculations, or rejection conditions unless those were directly exercised or independently confirmed.

## Frozen provenance labels

Every material business behavior used by an executor must have exactly one primary provenance label:

| Label | Meaning | May become canonical without owner review? |
|---|---|---|
| `LEGACY_OBSERVED` | Directly visible in authenticated legacy UI, captured response, or repeatable read-only live inspection | Yes for parity of the observed surface only |
| `LEGACY_REPORTED` | Described by a prior audit/raw note but not yet reproduced in the current audit | No; retain as provisional evidence |
| `OWNER_REQUIRED` | Explicitly requested in `reference/REQUIREMENT.md` | Yes as requested outcome; unspecified thresholds/actors still require a decision |
| `OWNER_APPROVED_EVOLUTION` | Explicit owner decision recorded in `_PROCESS_DECISIONS_LOG.md` | Yes within that decision's exact boundary |
| `TECHNICAL_SAFETY` | Necessary control for security, tenancy, auditability, data integrity, accounting balance, or safe operation | Yes when it does not invent commercial policy |
| `INFERRED_NEEDS_CONFIRMATION` | AI/design inference, arbitrary threshold, guessed actor, guessed status, or extrapolated workflow | No; cannot block or silently become SOP |
| `DEFERRED_OUT_OF_SCOPE` | Explicitly postponed or excluded | No implementation in the current phase |

Secondary evidence may be listed, but it must not obscure the primary origin. Implementation and current code are not business truth by themselves.

## Evidence baseline already available

- `reference/kil_erp_full_inventory.csv`: 146 pure-legacy inventory entries; prior audit reported 144 live and two unavailable/error routes, with the HR dashboard explicitly identified as an HTTP 500 failure.
- `reference/kil_erp_full_inventory_v2.csv`: 176 target entries; prior audit classified 31 as requirement expansion rather than missing legacy behavior.
- `data/crawl/*.html` and `*.json`: authenticated captures of legacy screens, fields, tables, visible actions, AJAX routes, and sample records.
- `data/crawl/auth/*`: captured legacy roles and menu/permission surfaces. These are sensitive operational evidence and must not be copied into prompts or test fixtures.
- `reference/REQUIREMENT.md`: owner-requested changes, especially finance, purchase/warehouse, design, BusDev, communication, deadline/PIC, and reporting changes.
- `process/_PROCESS_DECISIONS_LOG.md`: explicit owner-approved choices and later implementation reconciliation decisions.
- `contracts/*`: current canonical target, to be checked against the provenance above rather than treated as proof of its own correctness.

The reference audit is dated 2026-09-15. It is strong enough for route/screen inventory, but it does not replace targeted current-session checks for high-risk workflows.

## Global finding

NEX ERP is an evolution, not a literal clone:

1. **Legacy parity:** the 144 working legacy screens and their observable routes, fields, actions, document shapes, and visible statuses.
2. **Requested evolution:** 31 identified expansion screens plus the additional operating requirements in `REQUIREMENT.md`.
3. **Engineering controls:** tenant isolation, immutable audit/outbox, idempotency, safe migrations, authorization, accessibility, and resilience.
4. **Unverified design space:** thresholds, role substitutions, automatic transitions, KPI formulas/targets, escalation timing, lock semantics, and approval tiers that are not explicit in the first three categories.

Only categories 1–3 may move into implementation without another business decision. Category 4 must be marked provisional and must not become a company SOP through an AI-generated contract.

## P00–P22 provenance and live-validation matrix

| Phase | Capability | Legacy evidence | Evolution source | Validation priority and disposition |
|---|---|---|---|---|
| P00 | Credential/environment containment | Login and deployment artifacts only | Security controls | `TECHNICAL_SAFETY`; no legacy behavior to clone |
| P01 | SSOT and decisions | None | Owner decisions | Governance only; decisions require explicit provenance |
| P02 | Contract/code reconciliation | Route and inventory captures | Architecture policy | Reconcile names; code is not business authority |
| P03 | Build/CI/architecture gates | None | Engineering standard | `TECHNICAL_SAFETY` |
| P04 | Schema/migrations | Legacy visible entities only | Data-safety architecture | Verify migrated meanings and control totals, not legacy table design |
| P05 | Auth/RBAC/audit/communication/outbox | Legacy roles/menus; limited visible approvals | REQUIREMENT + safety controls | High priority for role truth; notes/@mention are evolution unless observed |
| P06 | Master data/configuration | Customer, supplier, goods, warehouse, user, role, CoA list/create captures | Added validations/import/data scope | Validate field semantics, uniqueness, inactive behavior, and role scope |
| P07 | CRM/marketing/guest book/BusDev | Leads, guest book, customer ownership, targets | BusDev requirements and modern pipeline | Separate legacy lead/customer facts from new qualification/SLA/consent rules |
| P08 | Sample/R&D/formulation/design/legal | Sales sample, sample approval/payment, formulation/manage/adjustment, HPP request captures | Design/legal requirements + DEC-051..065 | Critical; payment, formulas, revisions, design actors, locks, and permits need separate provenance |
| P09 | Sales/DP/delivery/AR/returns | Sales, approval, DP, delivery, invoice, payment, return captures | Credit/DP/finance controls | Critical money workflow; verify status transitions, partials, reversals, actors, document links |
| P10 | SCM/MRP/procurement/AP/matching | Need-for-goods, goods request, PR, PO, receipt, invoice, payment, return captures | REQUIREMENT §13 + finance controls | Critical; do not infer matching tolerance, price range, approval tier, or deadline policy |
| P11 | Warehouse/inventory | Stock report, mutation, transfer, opname, adjustment, inbound/outbound captures | Multi-warehouse, reservation, lot/expiry safety | Critical quantity/value flow; validate source documents and role boundaries |
| P12 | Production planning | Mixing/filling/packaging schedules and batch captures | Capacity/MRP dispatch design | Verify actual scheduling fields/actions; capacity algorithms are evolution unless confirmed |
| P13 | Production execution | Mixing/filling/packaging and batch record captures | Genealogy/yield/rework controls | Critical material conservation; validate stage order, losses, returns, and actors |
| P14 | QC/quarantine/release | Limited or no complete legacy route capture; raw QC documents | QC requirements and safety controls | Highest uncertainty; owner/process validation mandatory before acceptance freeze |
| P15 | Finance/costing/accounting/close | Journal and financial-report captures plus purchase/sales cash flows | Finance requirements and safety controls | Critical; verify posting triggers and document relationships; new close/tax/assets/budget rules are evolution |
| P16 | HR/personnel/payroll/KPI | HR dashboard historically returned HTTP 500; user master is not HR workflow | HR raw requirements + KPI reference | Treat modern HR/KPI as clean-slate evolution; formulas, weights, targets require owner evidence |
| P17 | Documents/communication/integrations | Print layouts and attachments visible; limited integration proof | REQUIREMENT + technical hardening | Preserve observed documents; @mention, notifications, provider retry/DLQ are evolution/safety |
| P18 | Reporting/analytics/KPI governance | Legacy finance/stock/sales reports captured | Advanced reports and KPI governance | Reconcile every metric to source; never infer formulas, grain, target, or freshness |
| P19 | UI/DNA/accessibility polish | Legacy information architecture is reference only | NEX design system | Preserve task flow, not legacy visual defects; usability/accessibility are NEX quality goals |
| P20 | System verification/resilience | None | Release engineering | `TECHNICAL_SAFETY` |
| P21 | Migration/cutover/DR | Legacy records and control totals | Operations plan | Validate data mapping and reconciliation; never invent missing history |
| P22 | Independent pre-UAT review | All accumulated evidence | Owner UAT | Must include unresolved provenance review; no `INFERRED_NEEDS_CONFIRMATION` may masquerade as accepted SOP |

## Known high-risk provenance conflicts

1. **Price-range SOP:** `REQUIREMENT.md` asks for a purchase price-range SOP, but any numeric threshold such as `110%` is not legacy truth unless explicitly evidenced or owner-approved. The threshold must remain `INFERRED_NEEDS_CONFIRMATION`.
2. **Design approval actors:** `REQUIREMENT.md` mentions BusDev and Purchase, while current P08 decisions/contracts use a different actor split including Director/APJ/BusDev. This is `OWNER_APPROVED_EVOLUTION`, not legacy parity; the decision and its exact role boundary must be visible in acceptance.
3. **Sample fee and formulation gate:** the legacy captures show distinct sample approval, sample payment, and formulation surfaces. They do not alone prove the new Finance-only verification gate. That gate is `OWNER_APPROVED_EVOLUTION` under DEC-051.
4. **Design and permit screens:** `/design-manage`, BPOM/HKI/Halal management expansion, and project monitoring belong to the documented non-legacy expansion set. They must not be described as reconstructed legacy workflows.
5. **HR:** the legacy HR dashboard failure is not evidence for employee lifecycle, payroll, performance, or KPI rules. P16 is predominantly owner-designed evolution.
6. **Communication protocol:** notes, @mention, ACL, escalation, notification, and KPI attribution are high-value NEX additions. Their existence is requested; the exact SLA, recipients, escalation timing, edit/delete rules, and KPI penalties require explicit evidence.
7. **Finance controls:** double-entry, immutable periods, exact matching, reconciliation, and idempotency can be technical/accounting safety. Commercial tolerances, maker-checker tiers, credit policy, collection promises, and approval values remain business decisions.

## Current P08 sample from captured legacy evidence

The existing authenticated crawl directly confirms these visible facts:

- `/sales-sample` lists code, date, customer, product, revision, formulator, formulation note, total, and status; it exposes `Riwayat` and `Buat`.
- `/sales-sample/create` captures formulator, customer, product form/unit/netto, price/discount/tax, attachment, description, reference, target, material request, and claim.
- `/sales-sample-approval` shows `Pending` samples and a detail action. The capture alone does not prove who may approve or the server-side transition.
- `/sales-sample-payment` shows invoice/sample codes, grand total, paid, balance, `Unpaid`, detail, and `Bayar`, with a create route per payment record.
- `/formulation-manage` visibly exposes `Serahkan Formulator` and `Buat Formulasi`; formula names are generated from product/revision and saved with date and optional note.
- `/formulation-adjustment` exposes `Sesuaikan Formula` against sample records; the capture does not prove immutable lineage semantics.
- `/request-cogs-approval` visibly exposes `Proses` and `Tolak` for pending HPP requests.

Therefore route and screen parity are observed, while Finance-only verification, 100% calculation tolerance, immutable revision lineage, design revision count, supervisor reopen behavior, permit expiry policy, tenant scope, and audit/outbox atomicity must be attributed to requirements, owner decisions, or technical safety—not to the crawl.

## Live revalidation protocol for all phases

Live access is used as targeted sampling, not as an uncontrolled full recrawl and never to mutate production data.

1. Authenticate manually in the in-app browser; credentials and OTP are never copied into prompts, logs, test fixtures, or documentation.
2. For each domain phase P05–P18, inspect representative list, create/view form, detail/history, approval/payment or state-action page, and role-visible navigation.
3. Record only URL, title, visible fields, visible actions, visible statuses, document links, and current role context. Do not submit, approve, reject, pay, post, delete, upload, or alter data.
4. Compare the current page to the captured `.html/.json` evidence and classify every difference as current legacy drift, role visibility, missing evidence, or target evolution.
5. Hidden calculations and state rules remain unverified unless a safe read-only detail/history response proves them. They are not inferred from button names.
6. Prioritize P09–P15 because money, stock, production, QC, and accounting errors have the largest operational impact; then P05–P08 and P16–P18.
7. Log decisions only when the owner has explicitly chosen an option. Ambiguity becomes `INFERRED_NEEDS_CONFIRMATION`, not a default rule.

## Phase-entry rule from this audit

Before freezing acceptance for P08–P18, the phase brief must contain a short provenance table for each primary behavior:

`behavior → primary label → exact source/evidence → verified boundary → unresolved choice`

The phase may implement legacy-observed behavior, explicit requirements, locked owner evolution, and technical safety controls. Any unresolved material threshold, actor, transition, formula, or commercial policy is a decision blocker for only that affected slice; unrelated work continues under the fast-delivery standard.

## Current audit status

- Repository and evidence inventory: **complete first pass** (747 files under `docs/legacy-erp`; 176 target inventory rows; authenticated crawl artifacts identified).
- All-phase provenance model: **frozen by this document**.
- P00–P22 risk/classification matrix: **complete first pass**.
- P08 captured-evidence sample: **complete**.
- Fresh authenticated legacy sampling P05–P18: **complete** on 2026-09-20, read-only. No production record was created, changed, approved, paid, rejected, uploaded, or deleted.
- Product code changes from this audit: **none**.

## Fresh live-parity ledger — 2026-09-20

The current authenticated UI confirms the legacy system is a broad document/status workflow. These observations are intentionally limited to visible route, table, action, and status evidence; they do not assert hidden transition rules.

| Phase | Current route(s) sampled | Directly observed legacy evidence | Provenance consequence |
|---|---|---|---|
| P05 | `/role-manage` | Role master exists, with create/view/edit/delete controls and 16 role entries across two pages. | Role names/menu visibility are `LEGACY_OBSERVED`; NEX RBAC, tenant data scope, and audit controls remain safety/evolution. |
| P06 | `/goods-manage` | Goods list exposes code, name, purchase price, category, subcategory, unit, and purchase detail. | Field/surface parity is observed; master validation, imports, soft-delete, and data isolation are not proven. |
| P07 | `/leads` | Lead list has date, note, quantity, and action; dashboard/menu exposes guest book and client segmentation. | Lead capture is observed. Qualification stages, ownership, SLA, consent, and modern BusDev pipeline are evolution unless sourced separately. |
| P08 | `/sales-sample`, `/sales-sample-approval`, `/sales-sample-payment`, `/formulation-manage`, `/formulation-adjustment`, `/request-cogs-approval` | Separate sample, sample approval, sample payment, formulation, adjustment, and HPP-request surfaces exist. Visible sample/payment/formulation tables contain codes, revision, parties, assigned formulator, values, and statuses such as `Pending`, `Unpaid`, `Approved`, `Revise`. | Surface/document lineage is observed. DEC-051 payment gate, formula immutability, 100% tolerance, HPP calculation, design/permit flow, audit/outbox, and actor segregation remain owner evolution or technical safety—not inferred legacy parity. |
| P09 | `/sales`, `/sales-down-payment`, `/delivery-out`, `/sales-invoice`, `/sales-payment`, `/sales-return` | Distinct sales, DP, delivery, invoice, payment, and return documents are live; tables expose linked document codes, totals, paid/balance, customer, and statuses. | Document chain is observed. Credit policy, DP amendment/cancel behavior, allocation/reversal, stock hold, and accounting posting need independent evidence. |
| P10 | `/need-for-goods`, `/goods-request`, `/purchase-request`, `/purchase`, `/purchase-in`, `/purchase-invoice`, `/purchase-payment`, `/purchase-return` | Requirement, goods request, purchase request, PO, receipt, invoice, payment, and return are distinct live surfaces. Need-for-goods exposes need, stock, variance, order quantity, supplier, PO, and price; purchase list exposes PO deadline. | Procurement backbone is observed. Matching tolerance, price-range threshold, approval tiers, supplier-performance rule, and deadline escalation are not proved by UI and must not be invented. |
| P11 | `/stock-opname`, `/goods-transfer`, `/stock-adjustment`, `/report-mutation-goods` | Opname, inter-warehouse transfer, stock adjustment, and mutation reporting are live. Transfer exposes source and destination warehouse; adjustment/opname retain creator and note. | Stock document surfaces are observed. No-negative-stock, reservation concurrency, lot/expiry, quarantine, and value-ledger invariants are safety/evolution until tested. |
| P12 | `/schedule-mixing`, `/schedule-filling`, `/schedule-packaging` | Three scheduling stages are live and show batch record, customer, product, target quantity, and `Pending` status. | Stage scheduling exists. Capacity planning, collision resolution, material feasibility, dispatch idempotency, and rescheduling policy are not proven. |
| P13 | `/production-mixing`, `/production-filling`, `/production-packaging` | Three production execution stages are live, each linked to schedule/batch/product/target and exposing `Pending`/`Produksi`. | Stage execution exists. Yield/loss, material conservation, downtime, rework, scan concurrency, and batch genealogy must be explicitly designed/tested. |
| P14 | `/batch-record`, `/dashboard-legality`; full menu and 176-row inventory reviewed | Batch record and legality document monitoring exist. No QC/quality/quarantine/release route is present in the target inventory or authenticated navigation. The legacy HR-like evidence does not fill this gap. | P14 QC workbench, quarantine-by-default, release, COA, and recall trace are **not legacy parity**. Treat raw QC prose as `LEGACY_REPORTED` only until owner/process confirmation; do not fabricate QC SOP. |
| P15 | `/general-journal`, `/report-trial-balance`, `/report-balance-sheet` | Journal has debit, credit, reference, type, status; trial balance and balance-sheet reports are live and exportable. | Finance/report surfaces are observed. Double-entry correctness, source-posting triggers, period close, tax, valuation, allocation, reversal, and reconciliation rules need canonical/safety proof. |
| P16 | `/dashboard-human-resources`, `/user-manage` | User master exists with NIP/name/contact/role; the HR dashboard currently renders only `Errors.whoops / Errors.weHitASnag`. | Modern employee lifecycle, attendance/payroll, performance, and KPI are clean-slate evolution. No HR/KPI formula or target may be claimed as legacy behavior. |
| P17 | `/activity-log`, `/dashboard-notification` | Activity log lists time, user, module, action, description, and IP; notification dashboard is present. | Legacy logging/notification surface exists. Notes, @mentions, attachment controls, ACL, provider retry/DLQ, and escalation are requirement/safety evolution. |
| P18 | `/report-profit-loss`, `/report-stock-valuation` | Profit/loss and stock valuation reports are live and expose filtering/export; report fields are visible. | Reporting surface is observed. Metric formula, grain, owner, target, freshness, drill-down, and access policy must each be declared; none may be inferred from a dashboard card. |

## Confirmed conflict and decision queue

| ID | Scope | Finding | Required treatment |
|---|---|---|---|
| PV-001 | P08 | Legacy provides separate payment and formulation surfaces but does not visibly establish the Finance-only verification gate. | Keep DEC-051 as `OWNER_APPROVED_EVOLUTION`; do not relabel it legacy. |
| PV-002 | P08 | Design/permit workflow is not exposed as a legacy parity route in the live navigation sampled. | Keep as requirement/owner evolution; retain P08 out-of-scope boundary for filing/submission/stability. |
| PV-003 | P10 | PO deadline and procurement documents are visible; price-range, matching tolerance, escalation, and actor thresholds are not. | Mark unspecified values/actors `INFERRED_NEEDS_CONFIRMATION`; never introduce a numeric default as SOP. |
| PV-004 | P14 | QC/quarantine/release workflow has no observed legacy UI route. | Require owner/process validation before P14 acceptance freeze; raw narrative is not sufficient to create mandatory rules by itself. |
| PV-005 | P16 | HR dashboard is currently non-functional; user master is not an HR workflow. | Build P16 as an explicit evolution; KPI formulas/weights/targets require owner evidence. |
| PV-006 | P17–P18 | Notifications, activity log, and reports exist, but they do not disclose message SLA, recipient rules, KPI formulas, freshness, or governance. | Implement only explicit requirements/decisions plus safety controls; create decisions for material policy gaps. |

## Ongoing rule for later phases

The phase prompt template now requires a provenance row for every primary acceptance behavior. Before an executor changes a business flow, it must say whether the behavior is legacy-observed, owner-required, owner-approved evolution, technical safety, inferred pending confirmation, or deferred. This is deliberately small and belongs in the phase brief; it is not a generated evidence system or certifier.
