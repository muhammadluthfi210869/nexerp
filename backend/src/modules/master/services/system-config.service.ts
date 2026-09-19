import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { AuditService } from '../../../platform/audit/audit.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PolicyService, PolicyActor } from '../../../platform/policy/policy.service';

export interface OrganizationConfigDto {
  companyName?: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface MasterKodeDto {
  documentType: string;
  format: string;
  exampleFormat?: string;
  resetCycle?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly policyService: PolicyService
  ) {}

  private enforce(actor: PolicyActor | undefined, action: string): void {
    if (!actor) {
      throw new ForbiddenException('PERMISSION_DENY_DEFAULT: Missing actor context');
    }
    const decision = this.policyService.decide({
      actor,
      action: `system_config:${action}`,
      requiredPermission: `system_config:${action}`,
      resource: { type: 'system_config', organizationId: actor.organizationId },
    });
    if (!decision.allow) {
      throw new ForbiddenException(decision.reason_code || 'PERMISSION_DENY_DEFAULT');
    }
  }

  async findAll(actor?: PolicyActor) {
    this.enforce(actor, 'read');
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string, actor?: PolicyActor) {
    this.enforce(actor, 'read');
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException(`Config key not found: ${key}`);
    }
    return config;
  }

  async update(actor: PolicyActor | undefined, key: string, value: string) {
    this.enforce(actor, 'write');
    const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
    const beforeState = existing ? { key: existing.key, value: existing.value } : null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.systemConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, group: 'GENERAL', updatedAt: new Date() },
      });

      return this.auditService.withAudit(
        tx,
        {
          actorUserId: actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'system_config:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'system-config.service',
          entityType: 'SystemConfig',
          entityId: randomUUID(),
          action: 'CONFIG_UPDATED',
          beforeSnapshot: beforeState ? { key: beforeState.key, value: beforeState.value } : Prisma.JsonNull,
          afterSnapshot: { key: updated.key, value: updated.value },
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'SYSTEM_CONFIG_UPDATED',
            aggregateType: 'SystemConfig',
            aggregateId: key,
            payload: { key, value, tenantId: actor?.organizationId },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
          return updated;
        }
      );
    });
  }

  async getOrganizationConfig(): Promise<OrganizationConfigDto> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'company.name',
            'organization.legal_name',
            'organization.tax_id',
            'organization.address',
            'organization.phone',
            'organization.email',
          ],
        },
      },
    });

    const map = new Map(configs.map((c) => [c.key, c.value]));
    return {
      companyName: map.get('company.name') || '',
      legalName: map.get('organization.legal_name') || '',
      taxId: map.get('organization.tax_id') || '',
      address: map.get('organization.address') || '',
      phone: map.get('organization.phone') || '',
      email: map.get('organization.email') || '',
    };
  }

  async updateOrganizationConfig(actor: PolicyActor | undefined, dto: OrganizationConfigDto): Promise<OrganizationConfigDto> {
    this.enforce(actor, 'write');
    const entries: Array<{ key: string; value: string }> = [];
    if (dto.companyName !== undefined) entries.push({ key: 'company.name', value: dto.companyName });
    if (dto.legalName !== undefined) entries.push({ key: 'organization.legal_name', value: dto.legalName });
    if (dto.taxId !== undefined) entries.push({ key: 'organization.tax_id', value: dto.taxId });
    if (dto.address !== undefined) entries.push({ key: 'organization.address', value: dto.address });
    if (dto.phone !== undefined) entries.push({ key: 'organization.phone', value: dto.phone });
    if (dto.email !== undefined) entries.push({ key: 'organization.email', value: dto.email });

    await this.prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        await tx.systemConfig.upsert({
          where: { key: entry.key },
          update: { value: entry.value, updatedAt: new Date() },
          create: { key: entry.key, value: entry.value, group: 'ORGANIZATION', updatedAt: new Date() },
        });
      }

      return this.auditService.withAudit(
        tx,
        {
          actorUserId: actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'system_config:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'system-config.service',
          entityType: 'OrganizationConfig',
          entityId: randomUUID(),
          action: 'ORGANIZATION_CONFIG_UPDATED',
          afterSnapshot: JSON.parse(JSON.stringify(dto)),
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'ORGANIZATION_CONFIG_UPDATED',
            aggregateType: 'OrganizationConfig',
            aggregateId: actor?.organizationId || 'global',
            payload: { changes: dto, tenantId: actor?.organizationId },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
        }
      );
    });

    return this.getOrganizationConfig();
  }

  async findAllKodes(actor?: PolicyActor) {
    this.enforce(actor, 'read');
    return this.prisma.masterKode.findMany({
      orderBy: { documentType: 'asc' },
    });
  }

  async findKodeByType(documentType: string, actor?: PolicyActor) {
    this.enforce(actor, 'read');
    const kode = await this.prisma.masterKode.findUnique({
      where: { documentType },
    });
    if (!kode) {
      throw new NotFoundException(`MasterKode not found for document type: ${documentType}`);
    }
    return kode;
  }

  async createOrUpdateKode(actor: PolicyActor | undefined, dto: MasterKodeDto) {
    this.enforce(actor, 'write');
    if (!dto.documentType || !dto.format) {
      throw new BadRequestException('documentType and format are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const kode = await tx.masterKode.upsert({
        where: { documentType: dto.documentType },
        update: {
          format: dto.format,
          exampleFormat: dto.exampleFormat ?? null,
          resetCycle: dto.resetCycle ?? 'YEARLY',
          description: dto.description ?? null,
          isActive: dto.isActive !== false,
          updatedAt: new Date(),
        },
        create: {
          documentType: dto.documentType,
          format: dto.format,
          exampleFormat: dto.exampleFormat ?? null,
          currentSequence: 0,
          resetCycle: dto.resetCycle ?? 'YEARLY',
          description: dto.description ?? null,
          isActive: dto.isActive !== false,
        },
      });

      return this.auditService.withAudit(
        tx,
        {
          actorUserId: actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'system_config:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'system-config.service',
          entityType: 'MasterKode',
          entityId: kode.id,
          action: 'MASTER_KODE_UPDATED',
          afterSnapshot: kode as any,
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'MASTER_KODE_UPDATED',
            aggregateType: 'MasterKode',
            aggregateId: kode.id,
            payload: { documentType: dto.documentType, format: dto.format },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
          return kode;
        }
      );
    });
  }
}
