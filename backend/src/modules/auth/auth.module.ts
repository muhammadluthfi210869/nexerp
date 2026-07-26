import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

const DEFAULT_JWT_SECRET = 'ERP_SECRET_DEV_ONLY';
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

// Warn if using default secret in production
if (jwtSecret === DEFAULT_JWT_SECRET && process.env.NODE_ENV === 'production') {
  Logger.warn(
    '⚠️  JWT_SECRET is using DEFAULT value! Set JWT_SECRET environment variable for production security.',
    'AuthModule',
  );
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
