// Dreamlab-side Prisma client wrapper.
// Connects to the SEPARATE dreamlab PostgreSQL DB (host: dreamlab-lead-pgbouncer-1:6432,
// db: dreamlab). Used by RoundRobinHistoricalService to surface the months of
// historical round-robin assignment data that lives outside the ERP DB.
//
// This service wraps a PrismaClient instance (NOT extends — see comment on
// onModuleInit). The dreamlab DB has its own schema (busdevs, rr_counter, leads,
// etc.) that is NOT part of the ERP Prisma schema, so we use $queryRaw for
// all reads. Generating a full PrismaClient would require maintaining a
// separate prisma folder for a foreign project.
//
// Env: DREAMLAB_DATABASE_URL
//   Format: postgresql://dreamlab1:<pwd>@dreamlab-lead-pgbouncer-1:6432/dreamlab?sslmode=require
// If unset, the service throws a clear error on first query (the controller
// catches and the UI shows "dreamlab DB belum dikonfigurasi").

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class DreamlabPrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DreamlabPrismaService.name);
  private pool: Pool | null = null;
  private client: PrismaClient | null = null;
  private configured = false;

  async onModuleInit(): Promise<void> {
    const url = process.env.DREAMLAB_DATABASE_URL;
    if (!url) {
      this.logger.warn("DREAMLAB_DATABASE_URL not set — RoundRobinHistoricalService will return 503");
      return;
    }
    try {
      this.pool = new Pool({ connectionString: url });
      const adapter = new PrismaPg(this.pool);
      this.client = new PrismaClient({ adapter, log: ["error"] });
      await this.client.$connect();
      this.configured = true;
      this.logger.log("✅ Dreamlab DB connected");
    } catch (e) {
      this.logger.error("❌ Dreamlab DB connection failed", e as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try { await this.client.$disconnect(); } catch { /* ignore */ }
    }
    if (this.pool) {
      try { await this.pool.end(); } catch { /* ignore */ }
    }
  }

  /**
   * Get the active PrismaClient. Throws ServiceUnavailableException with a
   * UI-friendly message if DREAMLAB_DATABASE_URL was not set at boot.
   */
  getClient(): PrismaClient {
    if (!this.configured || !this.client) {
      throw new ServiceUnavailableException(
        "DREAMLAB_DATABASE_URL not configured. Set it in backend env to enable historical round-robin distribution.",
      );
    }
    return this.client;
  }
}
