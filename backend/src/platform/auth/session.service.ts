/**
 * NEX ERP - Session Service (P05 canonical auth session lifecycle)
 *
 * Implements:
 *   - issueSession: creates a fresh session with hashed refresh token
 *   - rotateRefresh: atomic single-use rotation; replays revoke family
 *   - revokeFamily / revokeSession / revokeAllForUser
 *   - listSessionsForUser / verifyMfaPending / markMfaCompleted
 *
 * Refresh tokens are stored as bcrypt-10 hashes (refresh material only).
 * User passwordHash uses bcrypt-12.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const REFRESH_TTL_DAYS = 30;
const ACCESS_TTL_MIN = 15;
const REFRESH_HASH_COST = 10;

export interface SessionInput {
  userId: string;
  ipHash?: string;
  userAgentHash?: string;
  mfaPending?: boolean;
  mfaMethod?: string;
  familyId?: string;
  parentSessionId?: string;
}

export interface SessionOutput {
  id: string;
  userId: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  familyId: string;
  mfaPending: boolean;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaClient) {}

  async issueSession(input: SessionInput): Promise<SessionOutput> {
    const refreshToken = randomUUID() + '.' + randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_HASH_COST);
    const familyId = input.familyId || randomUUID();
    const now = Date.now();
    const session = await this.prisma.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash,
        accessExpiresAt: new Date(now + ACCESS_TTL_MIN * 60_000),
        refreshExpiresAt: new Date(now + REFRESH_TTL_DAYS * 24 * 60 * 60_000),
        mfaPending: !!input.mfaPending,
        mfaMethod: input.mfaMethod || null,
        familyId,
        parentSessionId: input.parentSessionId || null,
        ipHash: input.ipHash || null,
        userAgentHash: input.userAgentHash || null
      }
    });
    return {
      id: session.id,
      userId: session.userId,
      refreshToken,
      accessExpiresAt: session.accessExpiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      familyId: session.familyId,
      mfaPending: session.mfaPending
    };
  }

  async rotateRefresh(sessionId: string, presentedRefresh: string) {
    // Atomic claim: SELECT FOR UPDATE then UPDATE.
    return await this.prisma.$transaction(async tx => {
      const session = await tx.$queryRawUnsafe<Array<{
        id: string; userId: string; familyId: string; refreshTokenHash: string;
        revokedAt: Date | null; mfaPending: boolean; refreshExpiresAt: Date;
      }>>(
        `SELECT id, "userId", "familyId", "refreshTokenHash", "revokedAt", "mfaPending", "refreshExpiresAt"
         FROM auth_sessions WHERE id = $1 FOR UPDATE`,
        sessionId
      );
      const s = session[0];
      if (!s) {
        throw Object.assign(new Error('Session not found'), { code: 'SESSION_REVOKED' });
      }
      if (s.revokedAt) {
        throw Object.assign(new Error('Session revoked'), { code: 'SESSION_REVOKED' });
      }
      const matches = await bcrypt.compare(presentedRefresh, s.refreshTokenHash);
      if (!matches) {
        throw Object.assign(new Error('Refresh token mismatch — possible replay'), {
          code: 'REFRESH_REPLAY',
          familyId: s.familyId
        });
      }
      // Issue new session in same family, mark old as replaced
      const newRefresh = randomUUID() + '.' + randomUUID();
      const newRefreshHash = await bcrypt.hash(newRefresh, REFRESH_HASH_COST);
      const now = Date.now();
      const created = await tx.authSession.create({
        data: {
          userId: s.userId,
          refreshTokenHash: newRefreshHash,
          accessExpiresAt: new Date(now + ACCESS_TTL_MIN * 60_000),
          refreshExpiresAt: new Date(now + REFRESH_TTL_DAYS * 24 * 60 * 60_000),
          mfaPending: s.mfaPending,
          familyId: s.familyId,
          parentSessionId: s.id
        }
      });
      await tx.authSession.update({
        where: { id: s.id },
        data: { revokedAt: new Date(), revokedReason: 'rotated', replacedById: created.id }
      });
      return {
        id: created.id,
        userId: created.userId,
        refreshToken: newRefresh,
        familyId: created.familyId
      };
    });
  }

  async revokeFamily(familyId: string, reason = 'family_revoked') {
    return await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason }
    });
  }

  async revokeSession(sessionId: string, reason = 'user_revoke') {
    return await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason }
    });
  }

  async revokeAllForUser(userId: string, reason = 'logout_all') {
    return await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason }
    });
  }

  async listSessionsForUser(userId: string) {
    return await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  async verifyAccessToken(sessionId: string): Promise<{ ok: true } | { ok: false; code: string }> {
    const s = await this.prisma.authSession.findUnique({ where: { id: sessionId } });
    if (!s) return { ok: false, code: 'SESSION_NOT_FOUND' };
    if (s.revokedAt) return { ok: false, code: 'SESSION_REVOKED' };
    if (s.mfaPending) return { ok: false, code: 'MFA_REQUIRED' };
    if (s.refreshExpiresAt.getTime() < Date.now()) return { ok: false, code: 'SESSION_EXPIRED' };
    return { ok: true };
  }

  async markMfaCompleted(sessionId: string) {
    return await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { mfaPending: false, mfaMethod: null, lastUsedAt: new Date() }
    });
  }
}

export const SESSION_POLICY = {
  REFRESH_TTL_DAYS,
  ACCESS_TTL_MIN,
  REFRESH_HASH_COST
};
