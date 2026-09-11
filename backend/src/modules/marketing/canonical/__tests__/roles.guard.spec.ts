import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../../auth/roles.guard';

describe('RolesGuard explicit Director access', () => {
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

  it('does not let DIRECTOR bypass a route that did not grant DIRECTOR', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.DIRECTOR]))).toBe(false);
  });

  it('allows DIRECTOR when the route explicitly grants it', () => {
    const reflector = { getAllAndOverride: () => [UserRole.DIRECTOR] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.DIRECTOR]))).toBe(true);
  });

  it('keeps SUPER_ADMIN as the global bypass', () => {
    const reflector = { getAllAndOverride: () => [UserRole.MARKETING] } as any;
    expect(new RolesGuard(reflector).canActivate(contextFor([UserRole.SUPER_ADMIN]))).toBe(true);
  });
});
