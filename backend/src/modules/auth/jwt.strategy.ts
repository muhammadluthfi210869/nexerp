import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users.service';

const DEFAULT_JWT_SECRET = 'ERP_SECRET_DEV_ONLY';
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

if (jwtSecret === DEFAULT_JWT_SECRET && process.env.NODE_ENV === 'production') {
  Logger.warn(
    '⚠️  JWT_SECRET is using DEFAULT value! Set JWT_SECRET environment variable for production security.',
    'JwtStrategy',
  );
}

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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
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
