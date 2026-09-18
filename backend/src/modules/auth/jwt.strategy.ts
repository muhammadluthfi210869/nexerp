import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionService } from '../../platform/auth/session.service';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('WEAK_CONFIGURATION: JWT_SECRET must be at least 32 characters');
    }
    super({
      jwtFromRequest: (req) => {
        const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (fromHeader) return fromHeader;
        const cookieHeader = (req?.headers?.cookie ?? '') as string;
        const pair = cookieHeader
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith('token='));
        return pair ? pair.slice('token='.length) : null;
      },
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user || user.status === 'INACTIVE') {
      throw new UnauthorizedException('User is inactive or does not exist');
    }
    if (payload.sessionId) {
      const verification = await this.sessionService.verifyAccessToken(payload.sessionId);
      if (!verification.ok) {
        throw new UnauthorizedException(`Session invalid: ${verification.code}`);
      }
    }
    return user;
  }
}

