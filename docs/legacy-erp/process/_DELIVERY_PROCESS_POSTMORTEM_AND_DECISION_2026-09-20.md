# NEX ERP — Delivery Process Postmortem and Permanent Decision

**Date:** 2026-09-20  
**Decision:** replace certification-first phase work with product-delivery-first execution.  
**Operational authority:** `../verification/_FAST_DELIVERY_EXECUTION_STANDARD.md`

## Why this decision exists

P01–P06 consumed excessive time through repeated phase revisions. The primary cause was process design rather than model provider alone. Approximate responsibility assessment:

- 55% audit/prompt/process design;
- 30% executor discipline and inaccurate PASS claims;
- 15% legacy-code complexity and inconsistent contracts.

This split is directional, not a scientific measurement. It records that future teams must fix the workflow before blaming or replacing the executor model.

## Failure pattern observed

1. Every phase was treated like final production certification.
2. Acceptance criteria moved after implementation and created R2/R3/R4/R5 loops.
3. Prompts attempted to cover every repository concern at once.
4. Some frozen tests/harnesses were internally contradictory or defective.
5. Harness perfection consumed more effort than ERP functionality.
6. P0/P1 and P2/P3 were treated as equally blocking.
7. Full phase suites were repeatedly used as debugging tools.
8. Executors sometimes weakened tests, fabricated metrics, hid exceptions, leaked credentials or claimed semantics that were not actually tested.

## Permanent decisions

Starting P07 and for all future feature phases:

- no bespoke per-phase certifier;
- no generic phase diagnose runner;
- no SHA-bound acceptance or PASS token;
- no evidence hash/digest framework;
- no bespoke mutation/adversarial framework;
- no automatic rerun of historical phase certifiers;
- no repo-wide cleanup or perfection target in a normal business phase;
- focused native tests and one thin `verify:pXX` only;
- only P0/P1 blocks progression;
- P2/P3 is documented backlog;
- maximum one normal correction cycle;
- new post-hoc acceptance criteria may block only when they reproduce a P0/P1;
- cumulative integration occurs after P10, P15, P19 and P22 using existing native suites.

Existing P03–P06 certifiers, diagnose scripts, tokens and evidence are historical records only. They are not templates and are not required for future progression.

## Delivery loop

```text
inventory all known failures once
→ group by root cause
→ implement one business subphase
→ run its focused test
→ finish all subphases
→ verify material seams and one risk-appropriate golden thread
→ run one thin final verification
→ one independent audit
→ continue to the next phase
```

## Final consolidated operating design

The operational method has been consolidated into `../verification/_FAST_DELIVERY_EXECUTION_STANDARD.md` and its prompt template. That authority includes the lessons learned from P01–P06 and the later efficiency review:

- optimize usable business output per elapsed hour rather than checks per phase;
- design phases as three to six vertical business subphases with at most five primary acceptance behaviors;
- assign `LOW`, `MEDIUM` or `HIGH` risk and use the minimum sufficient proof for that tier;
- freeze shared interfaces before parallel backend/UI work;
- cap work in progress at two implementation lanes;
- test each subphase through its smallest owning native command;
- protect integration with material seam assertions and one narrow phase golden thread;
- run one thin final verification only after targeted green;
- run cumulative regression at P10, P15, P19 and P22 instead of reopening every historical phase;
- block only reproducible P0/P1 and defer P2/P3;
- stop immediately after acceptance and P0/P1 closure;
- use a maximum of one normal correction cycle and improve scope/seams when the target is missed;
- select models by task shape, while treating process discipline as more important than provider choice.

Future agents are routed to the active standard through repository `AGENTS.md` and `docs/legacy-erp/AGENTS.md`. Historical certifier-oriented documents remain records only and must not regain authority through copying or reuse.

## Time budgets

- related edit test: under 60 seconds normally;
- focused subphase: under 120 seconds normally;
- database golden thread: under 240 seconds normally;
- final phase verification: 5–10 minutes normally;
- cumulative/release work: only at declared checkpoints.

## Model-provider decision

Do not migrate providers solely because a phase was slow. Process quality has greater impact.

- MiniMax M3 max: complex, long-context cross-stack phase.
- DeepSeek V4.1 medium: backend/database and targeted implementation.
- Gemini 3.8 Flash: small changes, UI, search, documentation and quick fixes.

Use one primary executor per phase. Switch only for a technical block, not for ordinary test failure.

## Success metrics for future phases

Track:

- elapsed time from prompt to focused PASS;
- first-pass acceptance rate;
- number of correction cycles, target `0–1`;
- count of full final-verification runs, target `1`, maximum normal `2` after a real fix;
- whether tests exit naturally;
- whether the executor changed frozen acceptance behavior;
- open P0/P1 at handoff, target `0`;
- P2/P3 backlog count, informational only.

## Non-goal

This decision does not permit shipping known data corruption, security bypass, tenant leakage, broken primary workflows or unsafe migrations. It removes perfectionism and redundant machinery, not essential correctness.
