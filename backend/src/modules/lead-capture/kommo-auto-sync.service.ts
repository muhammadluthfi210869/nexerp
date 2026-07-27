import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { KommoService } from './kommo.service';
import { LeadCaptureService } from './lead-capture.service';

@Injectable()
export class KommoAutoSyncService implements OnModuleInit {
  private readonly logger = new Logger(KommoAutoSyncService.name);
  private running = false;
  private nextRunAt = 0;

  constructor(
    private readonly kommo: KommoService,
    private readonly leads: LeadCaptureService,
  ) {}

  async onModuleInit() {
    if (this.isEnabled()) {
      void this.sync('startup');
    }
  }

  @Interval(60_000)
  async tick() {
    if (!this.isEnabled()) return;
    if (Date.now() < this.nextRunAt) return;
    await this.sync('interval');
  }

  private async sync(reason: string) {
    if (this.running) return;
    this.running = true;
    this.nextRunAt = Date.now() + this.getIntervalMs();

    try {
      const result = await this.kommo.pullAllLeads();
      const saved = await this.leads.saveKommoLeads(result.leads, result.contacts, result);
      this.logger.log(`[Kommo Auto Sync] ${reason}: pulled=${result.leads.length}, saved=${saved}`);
    } catch (err: any) {
      this.logger.warn(`[Kommo Auto Sync] ${reason} failed: ${err?.message || err}`);
    } finally {
      this.running = false;
    }
  }

  private isEnabled() {
    return String(process.env.KOMMO_AUTO_PULL_ENABLED || 'true').toLowerCase() !== 'false';
  }

  private getIntervalMs() {
    const value = Number(process.env.KOMMO_AUTO_PULL_INTERVAL_MS || 5 * 60 * 1000);
    return Number.isFinite(value) && value >= 60_000 ? value : 5 * 60 * 1000;
  }
}
