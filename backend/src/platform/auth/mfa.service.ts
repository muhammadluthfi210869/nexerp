/**
 * NEX ERP - MFA Service (TOTP + recovery codes)
 *
 * Stores encrypted TOTP secrets via AES-256-GCM. Provides enroll/confirm/verify
 * primitives. MFA-pending sessions are rejected by SessionService.verifyAccessToken
 * with code MFA_REQUIRED.
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PlatformConfig } from '../config/config.module';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual
} from 'crypto';

export interface MfaEnrollment {
  secret: string;
  encryptedSecret: string;
  recoveryCodes: string[];
  recoveryCodesHash: string[];
}

export function generateRFC6238Totp(secretHex: string, timeStepSeconds = 30, t = Date.now()): string {
  const counter = Math.floor(t / 1000 / timeStepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);
  const secretBuf = Buffer.from(secretHex, 'hex');
  const hmac = createHmac('sha1', secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = code % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyRFC6238Totp(secretHex: string, code: string, windowSteps = 1, t = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const stepMs = 30 * 1000;
  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const expected = generateRFC6238Totp(secretHex, 30, t + offset * stepMs);
    if (code.length === expected.length && timingSafeEqual(Buffer.from(code), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

@Injectable()
export class MfaService {
  private resolvedConfig: PlatformConfig;

  constructor(
    private readonly prisma: PrismaClient,
    @Optional() private readonly config?: PlatformConfig
  ) {
    if (config) {
      this.resolvedConfig = config;
    } else {
      const procEnv = (globalThis as any).process ? (globalThis as any).process['env'] : {};
      this.resolvedConfig = PlatformConfig.fromValues({
        jwtSecret: procEnv['JWT_SECRET'] || 'test-jwt-secret-min-32-chars-ok-here',
        mfaEncryptionKey: procEnv['MFA_ENCRYPTION_KEY'] || procEnv['AES_SECRET_KEY'] || 'test-mfa-encryption-key-min-32-chars-long'
      });
    }
  }

  private getEncryptionKey(): Buffer {
    const raw = this.resolvedConfig.mfaEncryptionKey || '';
    if (!raw || raw.length < 32) {
      const err = new Error('WEAK_CONFIGURATION: MFA encryption key must be at least 32 characters');
      (err as any).code = 'WEAK_CONFIGURATION';
      (err as any).reason_code = 'WEAK_CONFIGURATION';
      throw err;
    }
    return createHash('sha256').update(raw).digest();
  }

  encryptSecret(plain: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
  }

  decryptSecret(blob: string): string {
    const key = this.getEncryptionKey();
    const [ivB64, tagB64, encB64] = blob.split('.');
    if (!ivB64 || !tagB64 || !encB64) {
      throw new Error('INVALID_MFA_SECRET_BLOB');
    }
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(encB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  }

  async enrollTOTP(userId: string): Promise<MfaEnrollment> {
    const secret = randomBytes(20).toString('hex');
    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(8).toString('hex'));
    const recoveryCodesHash = recoveryCodes.map(c => createHash('sha256').update(c).digest('hex'));
    const encryptedSecret = this.encryptSecret(secret);
    await this.prisma.mfaSecret.upsert({
      where: { userId },
      create: { userId, encryptedSecret, recoveryCodesHash, confirmedAt: null },
      update: { encryptedSecret, recoveryCodesHash, confirmedAt: null }
    });
    return { secret, encryptedSecret, recoveryCodes, recoveryCodesHash };
  }

  async confirmTOTP(userId: string, code: string): Promise<boolean> {
    const rec = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!rec || !rec.encryptedSecret) return false;
    let plainSecret: string;
    try {
      plainSecret = this.decryptSecret(rec.encryptedSecret);
    } catch {
      return false;
    }
    const valid = verifyRFC6238Totp(plainSecret, code);
    if (!valid) return false;
    await this.prisma.mfaSecret.update({ where: { userId }, data: { confirmedAt: new Date() } });
    return true;
  }

  async verifyTOTPChallenge(userId: string, code: string): Promise<boolean> {
    const rec = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!rec || !rec.confirmedAt || !rec.encryptedSecret) return false;
    let plainSecret: string;
    try {
      plainSecret = this.decryptSecret(rec.encryptedSecret);
    } catch {
      return false;
    }
    return verifyRFC6238Totp(plainSecret, code);
  }

  async adminEnforceMFA(userId: string, required: boolean) {
    await this.prisma.mfaSecret.upsert({
      where: { userId },
      create: { userId, encryptedSecret: '', recoveryCodesHash: [], required },
      update: { required }
    });
  }

  async recoverWithCode(userId: string, code: string): Promise<boolean> {
    const rec = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!rec) return false;
    const h = createHash('sha256').update(code).digest('hex');
    const idx = rec.recoveryCodesHash.indexOf(h);
    if (idx < 0) return false;
    const newList = rec.recoveryCodesHash.slice();
    newList.splice(idx, 1);
    await this.prisma.mfaSecret.update({ where: { userId }, data: { recoveryCodesHash: newList } });
    return true;
  }
}
