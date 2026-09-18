# lead-capture — Module Owner Registry

## Owner
- **Module**: lead-capture
- **Path**: backend/src/modules/lead-capture
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module lead-capture is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/lead-capture data domain: lead-capture

## Public interface
- lead-capture.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
