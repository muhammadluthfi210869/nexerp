import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(query: UserQueryOptions = {}) {
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

  async findUserById(id: string) {
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

  async createUser(dto: CreateUserDto, creatorId?: string) {
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

      // If organization provided, create primary tenant scope
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

      // Record audit log & outbox event
      const correlationId = randomUUID();
      try {
        await tx.auditLog.create({
          data: {
            actorUserId: creatorId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'create_user' },
            correlationId,
            source: 'personnel.service',
            entityType: 'User',
            entityId: user.id,
            action: 'USER_CREATED',
            afterSnapshot: { id: user.id, email: user.email, roles: user.roles },
            txId: `user:${user.id}`
          }
        });

        await tx.outboxEvent.create({
          data: {
            eventType: 'USER_CREATED',
            aggregateType: 'User',
            aggregateId: user.id,
            idempotencyKey: randomUUID(),
            payload: { userId: user.id, email: user.email, roles: user.roles },
            correlationId,
            status: 'PENDING',
            nextAttemptAt: new Date()
          }
        });
      } catch {}

      return user;
    });
  }

  async updateUser(id: string, dto: UpdateUserDto, updaterId?: string) {
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

      const correlationId = randomUUID();
      try {
        await tx.auditLog.create({
          data: {
            actorUserId: updaterId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'update_user' },
            correlationId,
            source: 'personnel.service',
            entityType: 'User',
            entityId: id,
            action: 'USER_UPDATED',
            beforeSnapshot: { fullName: existing.fullName, roles: existing.roles, status: existing.status },
            afterSnapshot: { fullName: updated.fullName, roles: updated.roles, status: updated.status },
            txId: `user:${id}`
          }
        });

        await tx.outboxEvent.create({
          data: {
            eventType: 'USER_UPDATED',
            aggregateType: 'User',
            aggregateId: id,
            idempotencyKey: randomUUID(),
            payload: { userId: id, status: updated.status },
            correlationId,
            status: 'PENDING',
            nextAttemptAt: new Date()
          }
        });
      } catch {}

      return updated;
    });
  }

  async deactivateUser(id: string, deleterId?: string) {
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

      const correlationId = randomUUID();
      try {
        await tx.auditLog.create({
          data: {
            actorUserId: deleterId || null,
            actorRoleSlug: 'ADMIN',
            actorPermissionSnapshot: { role: 'ADMIN', action: 'deactivate_user' },
            correlationId,
            source: 'personnel.service',
            entityType: 'User',
            entityId: id,
            action: 'USER_DEACTIVATED',
            beforeSnapshot: { status: existing.status },
            afterSnapshot: { status: deactivated.status, deletedAt: deactivated.deletedAt },
            txId: `user:${id}`
          }
        });

        await tx.outboxEvent.create({
          data: {
            eventType: 'USER_DEACTIVATED',
            aggregateType: 'User',
            aggregateId: id,
            idempotencyKey: randomUUID(),
            payload: { userId: id },
            correlationId,
            status: 'PENDING',
            nextAttemptAt: new Date()
          }
        });
      } catch {}

      return deactivated;
    });
  }

  async findAllRoles(): Promise<RoleDefinition[]> {
    return CANONICAL_ROLES;
  }
}
