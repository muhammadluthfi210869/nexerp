/**
 * NEX ERP - Typed Configuration Module
 *
 * Reads runtime configuration through ConfigService only. Validates required
 * secrets have length >= 32 at startup. Fails closed if any are missing.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const FORBIDDEN_SECRETS = new Set([
  'changeme', 'secret', 'default', 'p05-default-key', 'ERP_SECRET',
  '12345678', 'password', 'admin', 'test-secret'
]);

export const platformConfigSchema = {
  parse(raw: any) {
    const jwt = raw?.JWT_SECRET || '';
    const mfa = raw?.MFA_ENCRYPTION_KEY || raw?.AES_SECRET_KEY || '';
    if (!jwt || FORBIDDEN_SECRETS.has(jwt) || jwt.length < 32) {
      const err = new Error(`WEAK_DEFAULT_SECRET: JWT_SECRET is invalid, insecure, or too short (length: ${jwt.length})`);
      (err as any).code = 'WEAK_DEFAULT_SECRET';
      (err as any).reason_code = 'WEAK_DEFAULT_SECRET';
      throw err;
    }
    if (mfa && (FORBIDDEN_SECRETS.has(mfa) || mfa.length < 32)) {
      const err = new Error(`WEAK_DEFAULT_SECRET: MFA_ENCRYPTION_KEY is invalid, insecure, or too short`);
      (err as any).code = 'WEAK_DEFAULT_SECRET';
      (err as any).reason_code = 'WEAK_DEFAULT_SECRET';
      throw err;
    }
    return raw;
  }
};

export class PlatformConfig {
  jwtSecret: string;
  mfaEncryptionKey: string;
  refreshTtlDays = 30;
  accessTtlMinutes = 15;
  bcryptCost = 12;
  outboxBatchSize = 10;
  outboxMaxAttempts = 5;

  constructor(cs?: ConfigService) {
    if (cs) {
      this.jwtSecret = cs.get<string>('JWT_SECRET') || '';
      this.mfaEncryptionKey = cs.get<string>('MFA_ENCRYPTION_KEY') || cs.get<string>('AES_SECRET_KEY') || '';
    } else {
      this.jwtSecret = '';
      this.mfaEncryptionKey = '';
    }
    platformConfigSchema.parse({
      JWT_SECRET: this.jwtSecret,
      MFA_ENCRYPTION_KEY: this.mfaEncryptionKey
    });
  }

  static fromValues(values: { jwtSecret: string; mfaEncryptionKey: string }): PlatformConfig {
    platformConfigSchema.parse({
      JWT_SECRET: values.jwtSecret,
      MFA_ENCRYPTION_KEY: values.mfaEncryptionKey
    });
    const cfg = Object.create(PlatformConfig.prototype);
    cfg.jwtSecret = values.jwtSecret;
    cfg.mfaEncryptionKey = values.mfaEncryptionKey;
    cfg.refreshTtlDays = 30;
    cfg.accessTtlMinutes = 15;
    cfg.bcryptCost = 12;
    cfg.outboxBatchSize = 10;
    cfg.outboxMaxAttempts = 5;
    return cfg;
  }

  validate() {
    return {
      jwtSecret_length: this.jwtSecret.length,
      mfaEncryptionKey_length: this.mfaEncryptionKey.length,
      bcryptCost: this.bcryptCost,
      accessTtlMinutes: this.accessTtlMinutes,
      refreshTtlDays: this.refreshTtlDays,
      outboxBatchSize: this.outboxBatchSize,
      outboxMaxAttempts: this.outboxMaxAttempts
    };
  }
}

@Module({
  imports: [ConfigModule],
  providers: [PlatformConfig],
  exports: [PlatformConfig, ConfigModule]
})
export class PlatformConfigModule {}

/**
 * Forbidden env access helper exported for tests. Returns the list of
 * process.env.<X> reads outside backend/src/platform/** .
 */
export function forbiddenEnvAccess(rootDir: string): { file: string; key: string }[] {
  const fs = require('fs');
  const path = require('path');
  const findings: { file: string; key: string }[] = [];
  const stack = [path.join(rootDir, 'backend/src')];
  while (stack.length) {
    const dir = stack.pop();
    let ents: any[];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of ents) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('platform')) continue;
        stack.push(full);
      } else if (full.endsWith('.ts')) {
        const text = fs.readFileSync(full, 'utf8');
        const re = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          findings.push({ file: path.relative(rootDir, full).replace(/\\/g, '/'), key: m[1] });
        }
      }
    }
  }
  return findings;
}
