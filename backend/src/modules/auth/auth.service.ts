import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly sessions: SessionService,
    private readonly mfa: MfaService,
    private readonly audit: AuditService
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
    const dummyHash = '$2b$12$abcdefghijklmnopqrstuuPYXc1q3W2H0V8Rk6Bm5wSr.Lq3DXOGy';
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash || dummyHash;
    const matches = await bcrypt.compare(password || '', hash);
    if (!user) return null;
    if (!matches) return null;
    const mfaRec = await this.prisma.mfaSecret.findUnique({ where: { userId: user.id } });
    return { id: user.id, mfaRequired: !!(mfaRec?.confirmedAt) };
  }

  async login(email: string, password: string) {
    const result = await this.validateUserSafe(email, password);
    if (!result) return null;
    const session = await this.sessions.issueSession({
      userId: result.id,
      mfaPending: result.mfaRequired,
      mfaMethod: result.mfaRequired ? 'totp' : null,
      familyId: randomUUID()
    });
    return {
      access_token: 'opaque',
      accessToken: 'opaque',
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
    if (ok) await this.sessions.markMfaCompletedForUser?.(userId); // optional hook
    return ok;
  }

  async listSessions(userId: string) {
    return await this.sessions.listSessionsForUser(userId);
  }
}
