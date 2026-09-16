import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    const trimmed = email.trim();
    const normalized = trimmed.toLowerCase();

    // 1. Exact or case-insensitive match by email
    let user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: 'insensitive' },
      },
    });

    // 2. Fallback: if not found, support username / prefix / fullName lookup
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: `${normalized}@nexerp.id`, mode: 'insensitive' } },
            { email: { equals: `${normalized}@dreamlab.id`, mode: 'insensitive' } },
            { email: { equals: `${normalized}@dreamlab.com`, mode: 'insensitive' } },
            { email: { startsWith: `${normalized}.`, mode: 'insensitive' } },
            { fullName: { equals: trimmed, mode: 'insensitive' } },
          ],
        },
      });
    }

    // 3. Fallback: alias common superadmin handles to super admin user
    if (!user) {
      const isSuperAdminAlias =
        normalized === 'superadmin' ||
        normalized === 'superadmin@nexerp.id' ||
        normalized === 'admin@nexerp.id' ||
        normalized === 'admin' ||
        normalized === 'superadmin@dreamlab.com';

      if (isSuperAdminAlias) {
        user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: 'admin@dreamlab.com' },
              { roles: { has: 'SUPER_ADMIN' as any } },
            ],
          },
        });
      }
    }

    return user;
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
