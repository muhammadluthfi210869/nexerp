import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StateTransitionService } from './state-transition.service';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ErrorAggregationService } from './services/error-aggregation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.IT_SYS)
export class SystemController {
  constructor(
    private stateTransition: StateTransitionService,
    private prisma: PrismaService,
    private errorAggregation: ErrorAggregationService,
  ) {}

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit: string) {
    const take = limit ? parseInt(limit) : 100;
    const [transitions, audits] = await Promise.all([
      this.stateTransition.getAllLogs(take),
      (this.prisma as any).auditLog
        ? (this.prisma as any).auditLog
            .findMany({
              orderBy: { occurredAt: 'desc' },
              take,
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const mappedTransitions = transitions.map((t: any) => {
      const entityStr = String(t.entityType || '');
      const stateStr = String(t.toState || '');
      let mod = 'System';
      if (entityStr.includes('Sales') || entityStr.includes('SO') || entityStr.includes('Lead')) mod = 'Penjualan';
      else if (entityStr.includes('Purchase') || entityStr.includes('PO')) mod = 'Pembelian';
      else if (entityStr.includes('Warehouse') || entityStr.includes('Stock')) mod = 'Gudang';
      else if (entityStr.includes('Production') || entityStr.includes('Plan')) mod = 'Produksi';
      else if (entityStr.includes('QC') || entityStr.includes('Audit')) mod = 'Quality';
      else if (entityStr.includes('Finance') || entityStr.includes('Invoice')) mod = 'Finance';

      let act: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' = 'UPDATE';
      if (stateStr.includes('APPROVED')) act = 'APPROVE';
      else if (stateStr.includes('REJECTED') || stateStr.includes('LOST')) act = 'REJECT';
      else if (!t.fromState) act = 'CREATE';

      return {
        id: t.id,
        timestamp: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        user: t.changedBy?.fullName || 'System Automated',
        role: 'Internal Operator',
        module: mod,
        action: act,
        targetRef: `${t.entityType || 'ENTITY'}-${String(t.entityId).slice(0, 8)}`,
        description: t.reason || `Transisi status menjadi ${t.toState || 'UPDATED'}`,
        ipAddress: '192.168.1.1',
        status: stateStr.includes('REJECT') ? 'WARNING' : 'SUCCESS',
        metadata: t.metadata || {},
      };
    });

    const mappedAudits = audits.map((a: any) => ({
      id: a.id,
      timestamp: a.occurredAt ? new Date(a.occurredAt).toISOString() : new Date().toISOString(),
      user: a.actorRoleSlug || 'User System',
      role: a.actorRoleSlug || 'Staff',
      module: a.source || 'System',
      action: (['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN'].includes(a.action)
        ? a.action
        : 'UPDATE'),
      targetRef: `${a.entityType}-${String(a.entityId).slice(0, 8)}`,
      description: `${a.action} pada ${a.entityType}`,
      ipAddress: '192.168.1.1',
      status: 'SUCCESS' as const,
      metadata: { before: a.beforeSnapshot, after: a.afterSnapshot },
    }));

    return [...mappedTransitions, ...mappedAudits]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, take);
  }

  @Get('health')
  async getSystemHealth() {
    return {
      status: 'OPERATIONAL',
      timestamp: new Date(),
      version: '4.0.0-PROD',
      modules: [
        { name: 'PRODUCTION', status: 'ACTIVE' },
        { name: 'WAREHOUSE', status: 'ACTIVE' },
        { name: 'FINANCE', status: 'ACTIVE' },
        { name: 'SCM', status: 'ACTIVE' },
      ],
    };
  }

  // === Change Requests ===
  @Get('change-requests')
  async getChangeRequests() {
    return (this.prisma as any).changeRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('change-requests/all')
  async getAllChangeRequests() {
    return (this.prisma as any).changeRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('change-request')
  async createChangeRequest(
    @Body()
    data: {
      title: string;
      description: string;
      priority?: string;
      module?: string;
      requestedBy?: string;
    },
  ) {
    return (this.prisma as any).changeRequest.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        module: data.module || 'SCM',
        requestedBy: data.requestedBy,
      },
    });
  }

  @Post('change-requests')
  async createChangeRequestPlural(
    @Body()
    data: {
      title: string;
      description: string;
      priority?: string;
      module?: string;
      requestedBy?: string;
    },
  ) {
    return this.createChangeRequest(data);
  }

  @Patch('change-request/:id')
  async updateChangeRequest(
    @Param('id') id: string,
    @Body()
    data: {
      status?: string;
      notes?: string;
      priority?: string;
    },
  ) {
    return (this.prisma as any).changeRequest.update({
      where: { id },
      data,
    });
  }

  @Patch('change-requests/:id')
  async updateChangeRequestPlural(
    @Param('id') id: string,
    @Body()
    data: {
      status?: string;
      notes?: string;
      priority?: string;
    },
  ) {
    return this.updateChangeRequest(id, data);
  }

  // === Error Dashboard ===
  @Get('errors/summary')
  async getErrorSummary(@Query('hours') hours?: string) {
    return this.errorAggregation.getSummary(hours ? parseInt(hours) : 24);
  }

  @Get('errors/timeline')
  async getErrorTimeline(@Query('hours') hours?: string) {
    return this.errorAggregation.getTimeline(hours ? parseInt(hours) : 24);
  }

  @Post('errors/ingest')
  async ingestError(@Body() body: any) {
    return this.errorAggregation.ingest(body);
  }

  @Patch('errors/:id/resolve')
  async resolveError(@Param('id') id: string, @Body('userId') userId?: string) {
    return this.errorAggregation.resolveError(id, userId);
  }

  // === System Configs ===
  @Get('configs')
  async getSystemConfigs() {
    return (this.prisma as any).systemConfig.findMany();
  }

  @Post('configs')
  async setSystemConfigs(@Body() configs: Record<string, string>) {
    const results = [];
    for (const [key, value] of Object.entries(configs)) {
      results.push(
        await (this.prisma as any).systemConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        }),
      );
    }
    return results;
  }
}
