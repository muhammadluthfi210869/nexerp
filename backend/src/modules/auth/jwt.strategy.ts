import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users.service';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      // Pre-R4 hardening: refuse to boot with a missing/short JWT secret.
      // Earlier the strategy silently used 'ERP_SECRET' as a fallback,
      // which made every deployment's tokens forgeable.
      throw new Error(
        'JWT_SECRET is required and must be at least 32 characters. ' +
          'Run `npm run check:env` or generate with `openssl rand -hex 32`.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user || user.status === 'INACTIVE') {
      throw new UnauthorizedException('User is inactive or does not exist');
    }
    return user;
  }
}
