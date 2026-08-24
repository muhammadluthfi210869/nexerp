# SCM Module — Scaffold

**Branch**: `feature/scm`
**Source**: branched from `production-light` @ 2026-08-24
**Status**: scaffold only

## Scope

- Suppliers
- Purchase orders
- Purchase requests
- Material requisitions
- Warehouse receiving (linked to inventory)

## Existing (in production-light, do NOT modify)

- Schema: `backend/prisma/schema/scm.prisma`
- Users: `bagir@nexerp.id` (Head Ops Manufacture), `irma@nexerp.id` (Purchasing)

## Develop checklist

- [ ] Audit current SCM pages
- [ ] Supplier directory CRUD
- [ ] PO workflow (request → approval → receive)
- [ ] Integration with warehouse inbound
- [ ] 3-way match (PO / receipt / invoice)

## Migration plan

1. Develop on `feature/scm`
2. Test in local + staging
3. PR to `production-light`
4. Cherry-pick to deploy

## Safety contract

- DO NOT change existing SCM endpoints
- PO state machine: DRAFT → APPROVED → SENT → RECEIVED (no skipping)
- Receiving creates inventory_transactions — must be idempotent
- New tables need migration + rollback