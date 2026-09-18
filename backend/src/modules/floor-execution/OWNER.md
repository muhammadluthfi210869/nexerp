# floor-execution — Module Owner Registry

## Owner
- **Module**: floor-execution
- **Path**: backend/src/modules/floor-execution
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module floor-execution is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/floor-execution data domain: floor-execution

## Public interface
- floor-execution.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
