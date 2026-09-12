import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LoginDto } from './auth/dto/login.dto';
import { User } from '@prisma/client';
import { ActivityLogService } from './activity-log/activity-log.service';
import { LogActivityType } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private activityLog: ActivityLogService,
  ) {}

  // Wave 1 / A4: tighten brute-force window on credential endpoints.
  // 5 attempts per 15min per IP, on top of the global 100/min default.
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      // LOGIN_FAIL — anonymous (no userId); metadata carries attempted email
      // for forensics. Fire-and-forget — interceptor logs the CREATE too,
      // this gives the semantic LOGIN_FAIL row.
      void this.activityLog
        .log({
          type: LogActivityType.LOGIN_FAIL,
          method: 'POST',
          path: req.originalUrl,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          metadata: { email: loginDto.email },
        })
        .catch(() => undefined);
      throw new UnauthorizedException('Invalid credentials');
    }
    void this.activityLog
      .log({
        userId: user.id,
        type: LogActivityType.LOGIN_SUCCESS,
        method: 'POST',
        path: req.originalUrl,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      })
      .catch(() => undefined);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: { user: { sub: string } } & ExpressRequest) {
    void this.activityLog
      .log({
        userId: req.user.sub,
        type: LogActivityType.LOGOUT,
        method: 'POST',
        path: req.originalUrl,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      })
      .catch(() => undefined);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) {
    return req.user;
  }
}
