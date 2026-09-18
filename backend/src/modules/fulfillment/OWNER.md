# fulfillment — Module Owner Registry

## Owner
- **Module**: fulfillment
- **Path**: backend/src/modules/fulfillment
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module fulfillment is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/fulfillment data domain: fulfillment

## Public interface
- fulfillment.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
