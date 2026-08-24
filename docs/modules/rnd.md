# RND Module — Scaffold

**Branch**: `feature/rnd`
**Source**: branched from `production-light` @ 2026-08-24
**Status**: scaffold only

## Scope

- RND daily tracking (existing tables in production)
- Project monitoring
- Weekly performance
- Failed trials
- Head trackers
- Monthly KPIs

## Existing (in production-light, do NOT modify)

- Schema: `backend/prisma/schema/rnd.prisma`
- Users: `amira@nexerp.id` (RND Head), `panca@nexerp.id`, `yaya@nexerp.id`, `rnd@nexerp.id`
- Seed: RND daily tasks + projects already loaded

## Develop checklist

- [ ] Audit current RND pages and decide extension points
- [ ] Add any new endpoints
- [ ] Add any new schema (with migration)
- [ ] Frontend enhancements
- [ ] Permissions matrix
- [ ] Export/reporting features

## Migration plan

1. Develop on `feature/rnd`
2. Test in local + staging
3. PR to `production-light` (review required)
4. Cherry-pick to deploy

## Safety contract

- DO NOT remove existing RND tables/users
- DO NOT change existing RND endpoints (additive only)
- New tables need their own migration script + rollback plan