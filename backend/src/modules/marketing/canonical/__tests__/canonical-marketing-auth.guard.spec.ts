import { UnauthorizedException } from '@nestjs/common';
import { CanonicalMarketingAuthGuard } from '../canonical-marketing-auth.guard';

describe('CanonicalMarketingAuthGuard', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.MARKETING_DEV_AUTH_BYPASS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalBypass === undefined) delete process.env.MARKETING_DEV_AUTH_BYPASS;
    else process.env.MARKETING_DEV_AUTH_BYPASS = originalBypass;
  });

  it('rejects an unauthenticated request unless the local bypass is explicitly enabled', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MARKETING_DEV_AUTH_BYPASS;
    const guard = new CanonicalMarketingAuthGuard();

    expect(() => guard.handleRequest(null, null, null, {} as any)).toThrow(
      UnauthorizedException,
    );
  });

  it('permits the local bypass only when explicitly configured outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.MARKETING_DEV_AUTH_BYPASS = 'true';
    const guard = new CanonicalMarketingAuthGuard();

    expect(guard.handleRequest(null, null, null, {} as any)).toEqual(
      expect.objectContaining({ id: expect.any(String), roles: expect.any(Array) }),
    );
  });
});
