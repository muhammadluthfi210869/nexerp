# config — Module Owner Registry

## Owner
- **Module**: config
- **Path**: backend/src/platform/config
- **Layer**: application/platform
- **Parent**: platform

## Purpose
P05 canonical typed configuration boundary. Owns startup validation of all
required secrets (jwtSecret, mfaEncryptionKey) and exposes PlatformConfig +
PlatformConfigModule.

## Allowed dependencies
- `@nestjs/config`
- `process.env` access restricted to this module

## Data owner
- platform/config data domain: runtime configuration

## Public interface
- `PlatformConfig` (class)
- `PlatformConfigModule` (NestJS module)
- `forbiddenEnvAccess(rootDir)` — exported helper for tests

## Tests
- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory
