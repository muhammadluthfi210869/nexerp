import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

@Injectable()
export class CanonicalMarketingAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (user) return user;
    // A development bypass must be deliberately enabled.  Falling back to a
    // super-admin on every invalid/missing token makes cross-account checks
    // meaningless and can leak into a deployed non-production environment.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.MARKETING_DEV_AUTH_BYPASS === 'true'
    ) {
      return {
        id: '3e4999aa-eb21-4366-be08-4ec424819feb',
        email: 'revita@nexerp.id',
        fullName: 'Revita Yustianawati',
        roles: [UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR],
      };
    }
    throw err || new UnauthorizedException();
  }
}
