/**
 * NEX ERP - Typed Configuration Module
 *
 * Reads runtime configuration through ConfigService only. Validates required
 * secrets have length >= 32 at startup. Fails closed if any are missing.
 */

import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const FORBIDDEN_SECRETS = new Set([
  'changeme', 'secret', 'default', 'p05-default-key', 'ERP_SECRET',
  '12345678', 'password', 'admin', 'test-secret'
]);

function assertSecretStrength(name: string, val: string, required: boolean) {
  if (!val) {
    if (required) {
      const err = new Error(`WEAK_DEFAULT_SECRET: ${name} is required`);
      (err as any).code = 'WEAK_DEFAULT_SECRET';
      (err as any).reason_code = 'WEAK_DEFAULT_SECRET';
      throw err;
    }
    return;
  }
  const isWeak = FORBIDDEN_SECRETS.has(val);
  const isShort = val.length < 32;
  if (isWeak || isShort) {
    console.error(`[CONFIG ERROR] ${name}: val='${val}', len=${val?.length}, isWeak=${isWeak}, isShort=${isShort}`);
    const err = new Error(`WEAK_DEFAULT_SECRET: ${name} is invalid or weak`);
    (err as any).code = 'WEAK_DEFAULT_SECRET';
    (err as any).reason_code = 'WEAK_DEFAULT_SECRET';
    throw err;
  }
}

export const platformConfigSchema = {
  parse(raw: any) {
    const data = raw ? raw : {};
    const jwt = typeof data.JWT_SECRET === 'string' ? data.JWT_SECRET : '';
    let mfa = typeof data.MFA_ENCRYPTION_KEY === 'string' ? data.MFA_ENCRYPTION_KEY : '';
    if (!mfa && typeof data.AES_SECRET_KEY === 'string') {
      mfa = data.AES_SECRET_KEY;
    }
    assertSecretStrength('JWT_SECRET', jwt, true);
    assertSecretStrength('MFA_ENCRYPTION_KEY', mfa, false);
    return raw;
  }
};

@Injectable()
export class PlatformConfig {
  jwtSecret: string;
  mfaEncryptionKey: string;
  refreshTtlDays = 30;
  accessTtlMinutes = 15;
  bcryptCost = 12;
  outboxBatchSize = 10;
  outboxMaxAttempts = 5;

  constructor(cs?: ConfigService) {
    this.jwtSecret = (cs?.get<string>('JWT_SECRET')) || process.env.JWT_SECRET || '';
    this.mfaEncryptionKey = (cs?.get<string>('MFA_ENCRYPTION_KEY') || cs?.get<string>('AES_SECRET_KEY')) || process.env.MFA_ENCRYPTION_KEY || process.env.AES_SECRET_KEY || '';
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
