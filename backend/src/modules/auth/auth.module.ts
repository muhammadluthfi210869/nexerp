import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  // Pre-R4 hardening: refuse to boot with a missing/short JWT secret.
  // Previously the module silently used 'ERP_SECRET' as a fallback,
  // which made every deployment's tokens forgeable by anyone reading
  // the source. The shared key also meant every install shared the
  // same signing material.
  throw new Error(
    'JWT_SECRET is required and must be at least 32 characters. ' +
      'Run `npm run check:env` or generate with `openssl rand -hex 32`.',
  );
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
