import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../../auth/roles.guard';

// PRODUCTION-LIGHT bridge 2026-09-14: production-light's RolesGuard allows
// SUPER_ADMIN OR DIRECTOR as global bypass (phase-3 only allows SUPER_ADMIN).
// This test asserts the production-light policy directly.
describe('RolesGuard explicit Director access (production-light policy)', () => {
  const contextFor = (roles: UserRole[]) => ({
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user: { email: 'user@nexerp.id', roles } }) }),
  } as any);

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('lets DIRECTOR bypass a route that did not grant DIRECTOR (production-light policy)', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.DIRECTOR]))).toBe(true);
  });

  it('lets SUPER_ADMIN bypass any route', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.SUPER_ADMIN]))).toBe(true);
  });

  it('lets MARKETING in when route requires MARKETING', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.MARKETING]))).toBe(true);
  });

  it('blocks DIGIMAR when route requires MARKETING', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.DIGIMAR]))).toBe(false);
  });
});
