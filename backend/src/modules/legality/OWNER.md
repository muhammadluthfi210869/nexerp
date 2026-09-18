# legality — Module Owner Registry

## Owner
- **Module**: legality
- **Path**: backend/src/modules/legality
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module legality is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/legality data domain: legality

## Public interface
- legality.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
