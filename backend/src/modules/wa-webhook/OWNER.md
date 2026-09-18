# wa-webhook — Module Owner Registry

## Owner
- **Module**: wa-webhook
- **Path**: backend/src/modules/wa-webhook
- **Layer**: domain
- **Parent**: modules

## Purpose
P05 canonical platform cross-cutting owner marker. Module wa-webhook is a
deployable unit under modules governed by the P05 platform contract.

## Allowed dependencies
- `@nestjs/*` runtime
- `@prisma/client` database access
- Same-layer module contracts only

## Data owner
- modules/wa-webhook data domain: wa-webhook

## Public interface
- wa-webhook.module.ts (NestJS module)
- Exported services and DTOs

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
