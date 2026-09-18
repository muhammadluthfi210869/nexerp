# my-dashboard — Module Owner Registry

## Owner
- **Module**: my-dashboard
- **Path**: backend/src/modules/my-dashboard
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module my-dashboard is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/my-dashboard data domain: my-dashboard

## Public interface
- my-dashboard.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
