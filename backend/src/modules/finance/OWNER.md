# finance — Module Owner Registry

## Owner
- **Module**: finance
- **Path**: backend/src/modules/finance
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module finance is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/finance data domain: finance

## Public interface
- finance.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
