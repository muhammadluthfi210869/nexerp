import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { AuditService } from '../../../platform/audit/audit.service';

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
    private readonly auditService?: AuditService
  ) {}

  async findAll() {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException(`Config key not found: ${key}`);
    }
    return config;
  }

  async update(key: string, value: string, userId?: string) {
    const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
    const beforeState = existing ? { key: existing.key, value: existing.value } : null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.systemConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, group: 'GENERAL', updatedAt: new Date() },
      });

      try {
        await tx.auditLog.create({
          data: {
            actorUserId: userId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'update_config' },
            correlationId: `cfg-${randomUUID()}`,
            source: 'system-config.service',
            entityType: 'SystemConfig',
            entityId: key,
            action: 'CONFIG_UPDATED',
            beforeSnapshot: beforeState,
            afterSnapshot: { key: updated.key, value: updated.value },
            txId: `cfg:${key}`
          }
        });
      } catch {}

      return updated;
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

  async updateOrganizationConfig(dto: OrganizationConfigDto, userId?: string): Promise<OrganizationConfigDto> {
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

      try {
        await tx.auditLog.create({
          data: {
            actorUserId: userId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'update_org_config' },
            correlationId: `org-${randomUUID()}`,
            source: 'system-config.service',
            entityType: 'OrganizationConfig',
            entityId: 'organization',
            action: 'ORGANIZATION_CONFIG_UPDATED',
            afterSnapshot: dto,
            txId: `org:${randomUUID()}`
          }
        });
      } catch {}
    });

    return this.getOrganizationConfig();
  }

  async findAllKodes() {
    return this.prisma.masterKode.findMany({
      orderBy: { documentType: 'asc' },
    });
  }

  async findKodeByType(documentType: string) {
    const kode = await this.prisma.masterKode.findUnique({
      where: { documentType },
    });
    if (!kode) {
      throw new NotFoundException(`MasterKode not found for document type: ${documentType}`);
    }
    return kode;
  }

  async createOrUpdateKode(dto: MasterKodeDto, userId?: string) {
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

      try {
        await tx.auditLog.create({
          data: {
            actorUserId: userId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'update_master_kode' },
            correlationId: `kode-${randomUUID()}`,
            source: 'system-config.service',
            entityType: 'MasterKode',
            entityId: kode.id,
            action: 'MASTER_KODE_UPDATED',
            afterSnapshot: kode,
            txId: `kode:${kode.id}`
          }
        });
      } catch {}

      return kode;
    });
  }
}
