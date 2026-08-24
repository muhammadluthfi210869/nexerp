# Finance Module — Scaffold

**Branch**: `feature/finance`
**Source**: branched from `production-light` @ 2026-08-24
**Status**: scaffold only

## Scope

- Chart of Accounts (COA)
- Journal entries
- Payments
- Fund requests
- Financial periods
- Accounts

## Existing (in production-light, do NOT modify)

- Schema: `backend/prisma/schema/finance.prisma`
- Users: `irma@nexerp.id` (Bendahara), `tika@nexerp.id` (Accounting)

## Develop checklist

- [ ] Audit current Finance pages
- [ ] COA builder UI
- [ ] Journal entry form
- [ ] Payment approval workflow
- [ ] Period close / lock
- [ ] Reports: balance sheet, P&L, cash flow

## Migration plan

1. Develop on `feature/finance`
2. Test in local + staging
3. PR to `production-light`
4. Cherry-pick to deploy

## Safety contract

- DO NOT change existing finance endpoints
- Journal entries are append-only — never UPDATE/DELETE historical rows
- Period close must be idempotent (cannot un-close)
- New financial tables need rollback plan