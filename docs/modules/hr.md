# HR Module — Scaffold

**Branch**: `feature/hr`
**Source**: branched from `production-light` @ 2026-08-24
**Status**: scaffold only

## Scope

- Employee directory
- Attendance tracking
- Payroll
- KPI metric definitions
- KPI scores
- Tickets

## Existing (in production-light, do NOT modify)

- Schema: `backend/prisma/schema/hr.prisma`
- Users: `yulia@nexerp.id` (Manager HR), `diaz@nexerp.id` (Asst HR & Legal), `hr@nexerp.id`
- Seed: personnel + KPI data already loaded

## Develop checklist

- [ ] Audit current HR pages
- [ ] Add employee CRUD if missing
- [ ] Add attendance UI
- [ ] Add payroll calculator
- [ ] Permissions: who can see salary data?

## Migration plan

1. Develop on `feature/hr`
2. Test in local + staging
3. PR to `production-light`
4. Cherry-pick to deploy

## Safety contract

- DO NOT change existing HR endpoints (additive only)
- Salary data MUST be role-gated (HR/Finance/SuperAdmin only)
- New tables need migration + rollback