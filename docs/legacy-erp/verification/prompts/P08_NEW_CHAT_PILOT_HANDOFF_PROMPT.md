# NEX ERP — New-Chat Handoff for P08 Fast-Delivery Pilot

You are continuing NEX ERP in a fresh chat. Act as the phase designer and independent auditor. Do not implement product code unless the user explicitly asks; first produce the single execution prompt that will be given to the AI executor.

## Mandatory workflow authority

Read these files completely before acting:

1. `AGENTS.md`
2. `docs/legacy-erp/AGENTS.md`
3. `docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`
4. `docs/legacy-erp/verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`
5. `docs/legacy-erp/process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` — P08 only

The fast-delivery standard overrides historical certifier, diagnosis, SHA-token, mutation-framework, evidence-engine, and repeated-rerun instructions.

## Accepted predecessor state

P07 is accepted for progression based on independently reproduced results:

- `test:p07:http-closure`: 8/8 PASS through real Nest HTTP and disposable PostgreSQL;
- `npm run verify:p07`: backend 21/21 and frontend 6/6 PASS, exit 0;
- P07 disposable database residue: 0.

Do not reopen or rerun full P07. Run only one narrow P07-to-P08 smoke test if P08 changes the lead/sample handoff interface.

Owner decision: authenticated tenant filtering for the LeadCapture admin module is deferred because that capability is not needed for current P08 delivery. Record it as a known security/product backlog item for closure before production/UAT security readiness. Do not mislabel it as fixed, but do not let it block P08 unless P08 starts consuming those LeadCapture admin endpoints.

Preserve the dirty working tree and all unrelated user/executor changes. Never reset, discard, rewrite, or clean them.

## Current assignment

Design one concise executor prompt for **P08 — Sample, R&D, formulation, creative, and legality** using the new fast-delivery method. Save it as:

`docs/legacy-erp/verification/prompts/P08_FAST_PILOT_EXECUTION_PROMPT.md`

This is a pilot intended to prove that one frozen prompt, focused subphase tests, and one thin final verification can deliver a phase with no more than one correction cycle.

## Read-only inventory first — maximum 20 minutes

Inspect actual current implementation before defining work. Do not assume P08 is empty and do not create a diagnose CLI. Start from `contracts/10_TRACEABILITY_MATRIX.yaml`, then load only P08-linked portions of:

- `contracts/04_BUSINESS_RULES.md`;
- `contracts/03_WORKFLOW_STATE_MACHINE.yaml`;
- `contracts/01_DOMAIN_MODEL.md` and Prisma schemas;
- `contracts/02_DATA_OWNERSHIP.yaml`;
- `contracts/07_RBAC_MATRIX.yaml`;
- `contracts/05_API_CONTRACT.yaml`;
- `contracts/06_SCREEN_CONTRACT.json`;
- `contracts/08_INTEGRATION_EVENT_CONTRACT.yaml`;
- `contracts/09_NON_FUNCTIONAL_CONTRACT.md`, especially UI DNA rules.

Inventory existing sample, R&D/formulation, creative, legality, stability and regulatory backend/frontend/tests. Classify only what P08 needs as `REUSE`, `REPAIR`, `CONSOLIDATE`, or `MISSING`. Do not perform repo-wide cleanup.

If roadmap wording and canonical trace disagree, canonical contracts win. Do not invent creative/legal behavior merely from a folder name. A truly material unresolved business choice becomes one concise `DECISION_REQUIRED`; continue every unaffected slice.

## Frozen P08 design limits

Risk tier: `HIGH` because P08 contains payment validation, approval segregation, immutable revisions, attachments and regulated release.

The executor prompt must fit approximately 60–110 lines and contain at most five observable primary behaviors. Derive exact states, roles, errors and routes from canonical contracts, but organize them around these outcomes:

1. sample request/payment validation and authorized submit/approve/reject;
2. formulation composition and deterministic gram/HPP calculation, revision lineage and immutable lock;
3. adjustment/rework lineage without rewriting an approved or locked revision;
4. versioned artwork/legal/stability/regulatory review with required role segregation and expiry/SLA behavior, only where canonically owned by P08;
5. one golden thread from sample request to approved formulation/artwork/legal release, including its live-data UI.

Use three to five dependency-ordered vertical subphases, not backend/frontend layer batches. Recommended shape, adjusted after inventory:

- S1 sample + payment + approval boundary;
- S2 formulation + revisions + adjustments;
- S3 creative/legal/stability release boundary;
- S4 live-data UI composition through `@/components/dna` after API shapes freeze;
- S5 smallest real disposable-PostgreSQL golden thread and final composition.

Every material seam gets exactly one production-path assertion. Do not duplicate the same invariant across unit, integration, E2E and mutation layers.

## Testing and execution policy to embed

- Freeze acceptance tests before production edits; the executor cannot delete, skip or weaken them.
- While editing, run only the owning test, normally under 60 seconds.
- Each targeted subphase command should normally finish within 120 seconds.
- The real database golden thread should normally finish within 240 seconds.
- Create only one thin `verify:p08` that composes already exercised native commands and normally finishes within 5–10 minutes.
- Run final `verify:p08` once after every subphase is green; permit one rerun only after a real fix.
- Do not run full P01–P07 regression, Docker, deployment, browser matrices, load tests or historical certifiers.
- Only scoped P0/P1 blocks. Record P2/P3 and continue immediately.
- Use a disposable `nex_p08_*` database for destructive/integration tests and fail if cleanup leaves residue.
- UI uses only the DNA barrel `@/components/dna`; test user-visible loading, empty, error, denied and successful primary states without pursuing P19-level visual perfection.
- Mocks are allowed only at external provider/network boundaries, never for the business rule, RBAC decision, transaction or persistence the test claims to prove.

Default executor: DeepSeek V4.1 Flash at the highest practical reasoning setting. One executor owns backend, schema and final integration. A second UI lane is allowed only after API/schema shapes are frozen and paths do not overlap.

## Prohibited

No `certify_p08*`, `diagnose_p08*`, SHA/base-commit checks, PASS tokens, mutation frameworks, generated evidence engines, giant walkthroughs, clean-tree requirements, speculative refactors, global warning cleanup, or repeated previous-phase reruns.

Do not copy P03–P06 harnesses. Do not treat the historical `_PRODUCTION_PHASE_GATES.yaml` machinery as an execution requirement. Do not make P08 responsible for P09 sales/AR, P14 QC release, P15 accounting, P17 integration hardening, or P19 system-wide UI polish.

## Output required from this new chat

Return:

1. the saved `P08_FAST_PILOT_EXECUTION_PROMPT.md` link;
2. a compact P08 inventory and the frozen five-or-fewer acceptance behaviors;
3. subphase commands, seams and time budgets;
4. the exact short wrapper text to send to DeepSeek;
5. explicit measurement targets for the pilot: elapsed time, focused-test time, first-pass result, correction cycles, escaped P0/P1, deferred P2/P3 and over-budget commands.

Do not start a broad audit of earlier phases. Do not ask the user to repeat historical context. Once the executor result is returned, reproduce only P08's frozen focused commands and one golden thread, issue one consolidated P0/P1 verdict, and do not add ordinary acceptance criteria afterward.
