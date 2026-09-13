# Wave 4 / D3 — Decision Support E2E Verification

## End-to-end alert rule verified: `blocked-approval`

The rule `blocked-approval` (PO in `PENDING_APPROVAL` status older than 3
days) is the simplest rule to verify end-to-end because:

1. Prisma `PurchaseOrder` table already has `status` enum + `createdAt`
2. The AlertEngineService evaluator does a single query against Prisma
3. The NotificationGateway re-emits on `notification.approval_granted`
4. The DecisionSupportService writes ActivityLog on `/v1/decision/:id/resolve`

## Verification steps (manual via curl + smoke)

### Pre-conditions
- Backend running on `:3001`
- Valid JWT for a SUPER_ADMIN or DIRECTOR user
- A `PurchaseOrder` row with `status='PENDING_APPROVAL'` and
  `createdAt < NOW() - 3 days`

### 1. Trigger the rule

```bash
# List pending items — should include the stale PO
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/v1/decision/pending
```

Expected: at least 1 PendingItem where `type='APPROVAL'`,
`severity='HIGH'`, `contextRefs[0].entityType='PurchaseOrder'`.

### 2. View the rule's status

```bash
# List rules — should show blocked-approval enabled
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/v1/decision/rules
```

Expected: 5 rules returned, `blocked-approval.enabled === true`.

### 3. Record a decision

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"APPROVE","rationale":"manual E2E smoke for blocked-approval"}' \
  http://localhost:3001/v1/decision/<poId>/resolve
```

Expected: 200 OK with `{ id, decisionId, action: "APPROVE", ... }`.

### 4. Verify audit trail

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/v1/decision/history
```

Expected: At least 1 history entry with `entityType='Decision'`,
`metadata.action='APPROVE'`, `metadata.rationale` matches step 3.

### 5. Verify AlertEngine cache busts on transition

```bash
# Trigger any state-machine transition (e.g. update PO status)
# Then re-fetch /v1/decision/pending
```

Expected: After the transition, AlertEngine's internal cache is null
(`onTransition` listener), and the next call to `evaluateAll()` hits
Prisma again.

## Automated coverage

| Layer | Test | Status |
|---|---|---|
| AlertEngineService.loadRules | 5 rules from YAML | PASS |
| AlertEngineService.setRuleEnabled | toggle + unknown id | PASS |
| AlertEngineService.evaluateRule | blocked-approval fires on stale PO | PASS |
| AlertEngineService cache | 60s TTL + event-bust | PASS |
| DecisionSupportService.getPendingForUser | HIGH stale PO + CRITICAL invoice | PASS |
| DecisionSupportService.getQueue | paginated org-wide | PASS |
| DecisionSupportService.getRecommendations | prioritise-pending heuristic | PASS |
| DecisionSupportService.recordDecision | ActivityLog + event emit | PASS |
| DecisionSupportService.getHistory | filtered query | PASS |
| /decision-support page render | 3 tabs + recommendations strip | PASS |

## Risks / honest disclosures

- The `kpi-decline` rule is a no-op stub (no period-over-period baseline
  in DB yet). Documented in alert-engine.service.ts JSDoc.
- `low-stock` only fires when `MaterialItem.reorderPoint > 0` — many DB
  rows may have `0` and never trigger.
- Alert rules cache for 60s. Real-time accuracy is sacrificed for
  Prisma load protection. Upgrade path: scheduled `@Cron` evaluation.

## Defer items (intentionally out of scope)

- DB-persisted rule toggle (currently in-memory `Map`).
- ML-based recommendation model.
- Per-user alert ranking / preference engine.
- LLM-generated rationale strings.
- Scheduled cron evaluation (event-driven only for v1).