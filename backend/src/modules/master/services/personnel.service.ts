import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { AuditService } from '../../../platform/audit/audit.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PolicyService, PolicyActor } from '../../../platform/policy/policy.service';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface CreateUserDto {
  email: string;
  fullName: string;
  roles: UserRole[];
  password?: string;
  status?: UserStatus;
  organizationId?: string;
  divisionId?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  roles?: UserRole[];
  status?: UserStatus;
  password?: string;
  divisionId?: string;
}

export interface UserQueryOptions {
  limit?: number;
  page?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
}

export interface RoleDefinition {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

const CANONICAL_ROLES: RoleDefinition[] = [
  { name: 'Super Admin', slug: 'SUPER_ADMIN', description: 'Full system administrative access', permissions: ['*'] },
  { name: 'Administrator', slug: 'ADMIN', description: 'Master data and tenant administrator', permissions: ['master:*', 'system:*', 'users:*'] },
  { name: 'Supply Chain Officer', slug: 'SCM', description: 'SCM materials and suppliers management', permissions: ['materials:*', 'suppliers:*', 'warehouses:read'] },
  { name: 'Warehouse Officer', slug: 'WAREHOUSE', description: 'Warehouse and stock management', permissions: ['warehouses:*', 'materials:read'] },
  { name: 'Finance Officer', slug: 'FINANCE', description: 'Accounts and financial configurations', permissions: ['finance:*', 'tax_rates:*', 'suppliers:read'] },
  { name: 'Commercial / Sales', slug: 'COMMERCIAL', description: 'Customers and sales pipeline management', permissions: ['customers:*', 'sales:*'] },
  { name: 'Research & Development', slug: 'RND', description: 'Formulations and product specs', permissions: ['formulas:*', 'materials:read'] },
  { name: 'Human Resources', slug: 'HR', description: 'Personnel and division management', permissions: ['users:read', 'divisions:*'] },
  { name: 'Quality Control', slug: 'QC_LAB', description: 'Quality inspection and compliance', permissions: ['qc:*', 'materials:read'] },
  { name: 'Production Officer', slug: 'PRODUCTION_OP', description: 'Production floor operations', permissions: ['production:*', 'materials:read'] },
];

@Injectable()
export class PersonnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly policyService: PolicyService
  ) {}

  private enforce(actor: PolicyActor | undefined, action: string, resourceType: string): void {
    if (!actor) {
      throw new ForbiddenException('PERMISSION_DENY_DEFAULT: Missing actor context');
    }
    const decision = this.policyService.decide({
      actor,
      action: `${resourceType}:${action}`,
      requiredPermission: `${resourceType}:${action}`,
      resource: { type: resourceType, organizationId: actor.organizationId },
    });
    if (!decision.allow) {
      throw new ForbiddenException(decision.reason_code || 'PERMISSION_DENY_DEFAULT');
    }
  }

  async findAllUsers(actor: PolicyActor | undefined, query: UserQueryOptions = {}) {
    this.enforce(actor, 'read', 'users');
    const limit = Math.min(Math.max(1, Number(query.limit) || 50), 200);
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.role) where.roles = { has: query.role };
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          status: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserById(actor: PolicyActor | undefined, id: string) {
    this.enforce(actor, 'read', 'users');
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        warehouseAccess: {
          include: { warehouse: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return user;
  }

  async createUser(actor: PolicyActor | undefined, dto: CreateUserDto, creatorId?: string) {
    this.enforce(actor, 'write', 'users');
    if (!dto.email || !dto.fullName) {
      throw new BadRequestException('email and fullName are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`Email already registered: ${dto.email}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          fullName: dto.fullName.trim(),
          roles: dto.roles && dto.roles.length > 0 ? dto.roles : [UserRole.SCM],
          status: dto.status || UserStatus.ACTIVE,
        },
      });

      if (dto.organizationId) {
        await tx.tenantScope.create({
          data: {
            userId: user.id,
            organizationId: dto.organizationId,
            divisionId: dto.divisionId || null,
            effectiveFrom: new Date(),
            primary: true,
          },
        });
      }

      // Atomic master mutation + audit + outbox via P05 public services
      return this.auditService.withAudit(
        tx,
        {
          actorUserId: creatorId || actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'users:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'personnel.service',
          entityType: 'User',
          entityId: user.id,
          action: 'USER_CREATED',
          afterSnapshot: { id: user.id, email: user.email, roles: user.roles },
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'USER_CREATED',
            aggregateType: 'User',
            aggregateId: user.id,
            payload: { userId: user.id, email: user.email, roles: user.roles },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
          return user;
        }
      );
    });
  }

  async updateUser(actor: PolicyActor | undefined, id: string, dto: UpdateUserDto, updaterId?: string) {
    this.enforce(actor, 'write', 'users');
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
          roles: dto.roles !== undefined ? dto.roles : undefined,
          status: dto.status !== undefined ? dto.status : undefined,
        },
      });

      return this.auditService.withAudit(
        tx,
        {
          actorUserId: updaterId || actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'users:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'personnel.service',
          entityType: 'User',
          entityId: id,
          action: 'USER_UPDATED',
          beforeSnapshot: { fullName: existing.fullName, roles: existing.roles, status: existing.status },
          afterSnapshot: { fullName: updated.fullName, roles: updated.roles, status: updated.status },
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'USER_UPDATED',
            aggregateType: 'User',
            aggregateId: id,
            payload: { userId: id, status: updated.status },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
          return updated;
        }
      );
    });
  }

  async deactivateUser(actor: PolicyActor | undefined, id: string, deleterId?: string) {
    this.enforce(actor, 'write', 'users');
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const deactivated = await tx.user.update({
        where: { id },
        data: {
          status: UserStatus.INACTIVE,
          deletedAt: new Date(),
        },
      });

      return this.auditService.withAudit(
        tx,
        {
          actorUserId: deleterId || actor?.id || null,
          actorRoleSlug: actor?.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: actor?.roles, action: 'users:write' },
          tenantId: actor?.organizationId || null,
          correlationId: randomUUID(),
          source: 'personnel.service',
          entityType: 'User',
          entityId: id,
          action: 'USER_DEACTIVATED',
          beforeSnapshot: { status: existing.status },
          afterSnapshot: { status: deactivated.status, deletedAt: deactivated.deletedAt },
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'USER_DEACTIVATED',
            aggregateType: 'User',
            aggregateId: id,
            payload: { userId: id },
            correlationId: randomUUID(),
            tenantId: actor?.organizationId,
          });
          return deactivated;
        }
      );
    });
  }

  async findAllRoles(actor?: PolicyActor): Promise<RoleDefinition[]> {
    this.enforce(actor, 'read', 'users');
    return CANONICAL_ROLES;
  }
}
