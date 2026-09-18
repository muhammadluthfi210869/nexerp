/**
 * NEX ERP - Typed Configuration Module
 *
 * Reads runtime configuration through ConfigService only. Validates required
 * secrets have length >= 32 at startup. Fails closed if any are missing.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export class PlatformConfig {
  jwtSecret: string;
  mfaEncryptionKey: string;
  refreshTtlDays = 30;
  accessTtlMinutes = 15;
  bcryptCost = 12;
  outboxBatchSize = 10;
  outboxMaxAttempts = 5;

  constructor(cs: ConfigService) {
    this.jwtSecret = cs.get<string>('JWT_SECRET') || '';
    this.mfaEncryptionKey = cs.get<string>('MFA_ENCRYPTION_KEY') || cs.get<string>('AES_SECRET_KEY') || '';
    if (this.jwtSecret.length < 32) {
      throw new Error('WEAK_CONFIGURATION: JWT_SECRET must be at least 32 chars');
    }
    if (this.mfaEncryptionKey.length < 32) {
      throw new Error('WEAK_CONFIGURATION: MFA_ENCRYPTION_KEY must be at least 32 chars');
    }
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
