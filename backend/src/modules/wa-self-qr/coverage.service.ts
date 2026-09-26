/**
 * coverage.service.ts — NEX ERP Batch 1.
 *
 * Generates the HISTORY_COVERAGE_REPORT shape. Read-only.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CollectorService } from './collector.service';
import type { HistoryCoverage } from './self-qr.types';

@Injectable()
export class CoverageService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly collector: CollectorService,
  ) {}

  async reportForPilot(): Promise<HistoryCoverage | null> {
    const status = await this.collector.getStatus();
    if (!status) return null;
    const stats = await this.collector.getCoverage();
    const total = stats.messageCount;
    const unresolved = stats.unresolvedIdentityCount;
    const rate = total > 0 ? unresolved / total : 0;
    const coverageStatus: HistoryCoverage['coverageStatus'] =
      stats.historySyncRunCount === 0 ? 'UNKNOWN' :
      stats.messageCount === 0 ? 'UNKNOWN' :
      'PARTIAL';
    return {
      deviceId: status.deviceId,
      internalCode: status.internalCode,
      requestedFrom: '2026-08-01T00:00:00+07:00',
      requestedTo: new Date().toISOString(),
      oldestFound: stats.oldestFound ? stats.oldestFound.toISOString() : null,
      newestFound: stats.newestFound ? stats.newestFound.toISOString() : null,
      oneToOneConversationCount: stats.oneToOneConversationCount,
      messageCount: stats.messageCount,
      inboundCount: stats.inboundCount,
      outboundCount: stats.outboundCount,
      unresolvedIdentityCount: stats.unresolvedIdentityCount,
      unresolvedIdentityRate: rate,
      duplicateSuppressedCount: stats.duplicateSuppressedCount,
      historySyncRunCount: stats.historySyncRunCount,
      knownGaps: [],
      excludedConversationTypes: ['group', 'status', 'newsletter', 'broadcast', 'bot'],
      coverageStatus,
    };
  }
}
