# notification — Module Owner Registry

## Owner
- **Module**: notification
- **Path**: backend/src/modules/notification
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module notification is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/notification data domain: notification

## Public interface
- notification.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
