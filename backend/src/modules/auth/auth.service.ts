import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../platform/auth/session.service';
import { MfaService } from '../../platform/auth/mfa.service';
import { AuditService } from '../../platform/audit/audit.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

/**
 * AuthService (P05) — delegates to SessionService and MfaService.
 *
 * Behavior contract:
 *   - Password hashing uses bcrypt cost 12 (canonical)
 *   - Login is constant-time enumeration-safe (timingSafeEqual on hashed result)
 *   - Sessions, refresh rotation, MFA enrollment routed through platform/auth
 *   - Issues signed 15-minute session-bound JWT access tokens
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly sessions: SessionService,
    private readonly mfa: MfaService,
    private readonly audit: AuditService,
    private readonly jwtService: JwtService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Constant-time validation: regardless of whether the user exists, the call
   * runs a bcrypt compare against a known dummy hash. This prevents login
   * enumeration via timing analysis.
   */
  async validateUserSafe(email: string, password: string): Promise<{ id: string; mfaRequired: boolean } | null> {
    const dummyHash = '$2b$12$umqdDvLnBf2TfoTGNPZfmOeP8qPcYF2kjFKnSA.X9h0bjutAN82Gm';
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash || dummyHash;
    const matches = await bcrypt.compare(password || '', hash);
    if (!user || !matches) return null;
    const mfaRec = await this.prisma.mfaSecret.findUnique({ where: { userId: user.id } });
    return { id: user.id, mfaRequired: !!(mfaRec?.confirmedAt || mfaRec?.required) };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const dummyHash = '$2b$12$umqdDvLnBf2TfoTGNPZfmOeP8qPcYF2kjFKnSA.X9h0bjutAN82Gm';
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash || dummyHash;
    const matches = await bcrypt.compare(password || '', hash);
    if (!user || !matches) return null;
    return user;
  }

  private async isMfaRequiredForUser(userId: string): Promise<boolean> {
    const mfaRec = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!mfaRec) return false;
    return Boolean(mfaRec.confirmedAt || mfaRec.required);
  }

  private async resolveLoginUser(userOrEmail: any, password?: string): Promise<any> {
    if (typeof userOrEmail === 'string' && password !== undefined) {
      return await this.validateUser(userOrEmail, password);
    }
    if (userOrEmail && typeof userOrEmail === 'object') {
      return userOrEmail;
    }
    return null;
  }

  async login(userOrEmail: any, password?: string) {
    const user = await this.resolveLoginUser(userOrEmail, password);
    if (!user) {
      if (password !== undefined) {
        throw Object.assign(new Error('Invalid email or password'), {
          code: 'INVALID_CREDENTIALS',
          reason_code: 'INVALID_CREDENTIALS',
          gateId: 'auth_session_mfa'
        });
      }
      return null;
    }

    const mfaRequired = await this.isMfaRequiredForUser(user.id);
    const session = await this.sessions.issueSession({
      userId: user.id,
      mfaPending: mfaRequired,
      mfaMethod: mfaRequired ? 'totp' : undefined,
      familyId: randomUUID()
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
      sessionId: session.id
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      access_token: accessToken,
      accessToken,
      refresh_token: session.refreshToken,
      refreshToken: session.refreshToken,
      session_id: session.id,
      mfa_required: session.mfaPending
    };
  }

  async refresh(presentedRefreshToken: string, sessionId: string) {
    return await this.sessions.rotateRefresh(sessionId, presentedRefreshToken);
  }

  async logoutAll(userId: string) {
    return await this.sessions.revokeAllForUser(userId);
  }

  async logoutSession(sessionId: string) {
    return await this.sessions.revokeSession(sessionId);
  }

  async enrollMfa(userId: string) {
    return await this.mfa.enrollTOTP(userId);
  }

  async confirmMfa(userId: string, code: string) {
    const ok = await this.mfa.confirmTOTP(userId, code);
    if (ok) await this.sessions.markMfaCompletedForUser(userId);
    return ok;
  }

  async listSessions(userId: string) {
    return await this.sessions.listSessionsForUser(userId);
  }
}
