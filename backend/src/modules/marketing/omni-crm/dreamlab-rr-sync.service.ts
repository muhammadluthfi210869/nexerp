import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { Pool } from 'pg';

@Injectable()
export class DreamlabRrSyncService implements OnModuleInit {
  private readonly logger = new Logger(DreamlabRrSyncService.name);
  private pool: Pool | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initPool();
  }

  private initPool() {
    const connectionString = process.env.DREAMLAB_DB_URL;
    if (!connectionString) {
      this.pool = null;
      this.logger.warn('DREAMLAB_DB_URL is not configured; website sync is disabled');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 3,
      });
      this.logger.log('Dedicated DreamLab Website DB pool initialized');
    } catch (err: any) {
      this.logger.warn(`Failed to initialize DreamLab DB pool: ${err.message}`);
    }
  }

  private normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('62')) return '+' + digits;
    if (digits.startsWith('0')) return '+62' + digits.slice(1);
    return '+' + digits;
  }

  /**
   * Mengambil statistik round robin live dari database website Dreamlab
   */
  async getDreamlabRoundRobinSummary() {
    if (!this.pool) this.initPool();
    if (!this.pool) {
      return { success: false, error: 'Database website DreamLab tidak terhubung' };
    }

    try {
      const client = await this.pool.connect();
      try {
        const busdevsRes = await client.query('SELECT * FROM busdevs ORDER BY id ASC');
        const breakdownRes = await client.query(`
          SELECT assigned_to, assigned_phone, count(*)::int as count 
          FROM leads 
          WHERE assigned_to IS NOT NULL 
          GROUP BY assigned_to, assigned_phone 
          ORDER BY count DESC
        `);
        const totalRes = await client.query('SELECT count(*)::int as total FROM leads');
        const visitorsTotalRes = await client.query('SELECT count(*)::int as total FROM visitor_assignments');
        const visitorsBreakdownRes = await client.query(`
          SELECT agent_id, count(*)::int as count
          FROM visitor_assignments
          GROUP BY agent_id
          ORDER BY count DESC
        `);

        const activeAgents = busdevsRes.rows.map((row, index) => ({
          sourceId: String(row.id),
          name: String(row.name || row.full_name || `Agent ${row.id}`),
          phone: this.normalizePhone(row.phone || row.phone_number || ''),
          count: 0,
          orderIndex: Number(row.order_index ?? row.id ?? index),
          isActive: row.is_active !== false,
          visitorClicks: 0,
        }));

        const findAgent = (sourceValue: unknown) => {
          const value = String(sourceValue ?? '').trim().toLowerCase();
          if (!value) return undefined;
          return activeAgents.find((agent) =>
            agent.sourceId.toLowerCase() === value ||
            agent.name.toLowerCase() === value ||
            agent.name.toLowerCase().includes(value) ||
            value.includes(agent.name.toLowerCase()),
          );
        };

        for (const row of breakdownRes.rows) {
          const agent = findAgent(row.assigned_to);
          if (agent) agent.count += row.count;
        }

        for (const row of visitorsBreakdownRes.rows) {
          const agent = findAgent(row.agent_id);
          if (agent) agent.visitorClicks += row.count;
        }

        return {
          success: true,
          totalLeads: totalRes.rows[0]?.total || 0,
          totalVisitorAssignments: visitorsTotalRes.rows[0]?.total || 0,
          rawBusdevs: busdevsRes.rows,
          rawBreakdown: breakdownRes.rows,
          visitorAssignmentsBreakdown: visitorsBreakdownRes.rows,
          activeAgents,
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.logger.error(`Error querying dreamlab DB: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Menarik seluruh data leads & meng-update profil RoundRobinAgent di database ERP
   */
  async syncDreamlabRoundRobin() {
    if (!this.pool) this.initPool();
    if (!this.pool) {
      throw new Error('Koneksi database website DreamLab belum tersedia');
    }

    const client = await this.pool.connect();
    try {
      this.logger.log('Memulai sinkronisasi data leads dari website DreamLab...');

      // 1. Ambil summary per busdev
      const summary = await this.getDreamlabRoundRobinSummary();
      if (!summary.success) {
        throw new Error(summary.error || 'Gagal membaca summary dari database website');
      }

      // 2. Upsert agen-agen aktif ke tabel RoundRobinAgent ERP
      const agentsToSync = (summary.activeAgents || []).filter(
        (agent) => agent.isActive && agent.phone,
      );

      for (const ag of agentsToSync) {
        const count = ag.count || 0;

        const existing = await this.prisma.roundRobinAgent.findFirst({
          where: { phoneNumber: ag.phone },
        });

        if (existing) {
          await this.prisma.roundRobinAgent.update({
            where: { id: existing.id },
            data: {
              name: ag.name,
              orderIndex: ag.orderIndex,
              isActive: ag.isActive,
              totalLeads: count,
            },
          });
        } else {
          await this.prisma.roundRobinAgent.create({
            data: {
              name: ag.name,
              phoneNumber: ag.phone,
              orderIndex: ag.orderIndex,
              isActive: ag.isActive,
              totalLeads: count,
            },
          });
        }
      }

      // 3. Tarik semua data leads dan riwayat dari website database
      const leadsRes = await client.query(`
        SELECT 
          id, tracking_code, assigned_to, assigned_phone, source,
          page_url, page_title, referrer, utm_source, utm_medium, utm_campaign,
          device_type, browser, session_id, intent, nama, perusahaan, hp, produk, created_at,
          visitor_id, visit_count, is_test
        FROM leads
        ORDER BY created_at ASC
      `);

      let importedCount = 0;
      let updatedCount = 0;

      for (const row of leadsRes.rows) {
        const trackingCode = row.tracking_code || `DL-WS-${row.id}`;
        const sourceAgent = (summary.activeAgents || []).find((agent) => {
          const assignedTo = String(row.assigned_to || '').toLowerCase();
          return agent.sourceId.toLowerCase() === assignedTo || agent.name.toLowerCase() === assignedTo;
        });
        const assignedName = sourceAgent?.name || row.assigned_to || null;
        const assignedPhone = sourceAgent?.phone || this.normalizePhone(row.assigned_phone || '');
        const clientPhone = row.hp ? this.normalizePhone(row.hp) : null;
        const notesParts = [
          row.source ? `Sumber: ${row.source}` : '',
          row.produk ? `Minat Produk: ${row.produk}` : '',
          row.visit_count ? `Kunjungan ke-${row.visit_count}` : '',
          row.page_title ? `Halaman: ${row.page_title}` : '',
          row.visitor_id ? `Visitor ID: ${row.visitor_id}` : '',
        ].filter(Boolean);
        const sourceDetails = notesParts.join(' • ');

        const existingLead = await this.prisma.leadCapture.findUnique({
          where: { trackingCode },
        });

        const leadData = {
          fullName: row.nama || (row.perusahaan ? `${row.perusahaan} (Lead)` : `Prospek ${trackingCode}`),
          company: row.perusahaan || null,
          phone: clientPhone,
          source: 'WEBSITE' as any,
          notes: sourceDetails,
          pageUrl: row.page_url || null,
          pageTitle: row.page_title || null,
          referrer: row.referrer || null,
          deviceType: row.device_type || null,
          browser: row.browser || null,
          sessionId: row.session_id || row.visitor_id || null,
          utmSource: row.utm_source || null,
          utmMedium: row.utm_medium || null,
          utmCampaign: row.utm_campaign || null,
          assignedName,
          assignedPhone,
          intent: row.intent || row.produk || 'Konsultasi Maklon',
        };

        if (!existingLead) {
          await this.prisma.leadCapture.create({
            data: {
              trackingCode,
              ...leadData,
              status: 'WA_CONTACTED' as any,
              workflowStatus: 'NEW_LEAD' as any,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.created_at ? new Date(row.created_at) : new Date(),
            },
          });
          importedCount++;
        } else {
          await this.prisma.leadCapture.update({
            where: { id: existingLead.id },
            data: {
              ...leadData,
            },
          });
          updatedCount++;
        }
      }

      this.logger.log(`Sinkronisasi selesai: ${importedCount} leads baru diimpor, ${updatedCount} leads terupdate dengan histori komprehensif`);

      return {
        success: true,
        totalLeadsInWebsiteDb: leadsRes.rows.length,
        totalVisitorAssignments: summary.totalVisitorAssignments,
        importedCount,
        updatedCount,
        agents: summary.activeAgents,
      };
    } catch (err: any) {
      this.logger.error(`Sinkronisasi gagal: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }
}
