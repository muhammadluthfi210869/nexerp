# activity-stream — Module Owner Registry

## Owner
- **Module**: activity-stream
- **Path**: backend/src/modules/activity-stream
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module activity-stream is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/activity-stream data domain: activity-stream

## Public interface
- activity-stream.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
