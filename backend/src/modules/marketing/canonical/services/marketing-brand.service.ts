import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { logBestEffort } from '../../../../common/helpers/best-effort';
import {
  CreateBrandDto,
  UpdateBrandDto,
  UpdateMarketingMemberDto,
} from '../canonical-marketing.dto';
import {
  MarketingViewer,
  ensureMarketingTaskRole,
  isMarketingManager,
} from '../marketing-domain.policy';

type DbClient = PrismaService;

@Injectable()
export class MarketingBrandService {
  private readonly logger = new Logger(MarketingBrandService.name);

  constructor(private readonly prisma: PrismaService) {}

  ensureManager(viewer: MarketingViewer) {
    ensureMarketingTaskRole(viewer);
    if (!isMarketingManager(viewer))
      throw new ForbiddenException({
        code: 'MARKETING_MANAGER_REQUIRED',
        message: 'Aksi ini memerlukan manager Marketing.',
      });
  }

  ensureSocialWriter(viewer: MarketingViewer) {
    if (
      !viewer.roles.some((role) =>
        ['SUPER_ADMIN', 'MARKETING', 'DIGIMAR'].includes(role),
      )
    )
      throw new ForbiddenException({
        code: 'SOCIAL_WRITE_FORBIDDEN',
        message: 'Akses tulis Social Media ditolak.',
      });
  }

  ensureMarketingRead(viewer: MarketingViewer) {
    if (
      !viewer.roles.some((role) =>
        [
          'SUPER_ADMIN',
          'HEAD_OPS',
          'MARKETING',
          'DIGIMAR',
          'DIRECTOR',
          'COMMERCIAL',
        ].includes(role),
      )
    )
      throw new ForbiddenException({
        code: 'MARKETING_READ_FORBIDDEN',
        message: 'Akses Marketing ditolak.',
      });
  }

  async listMembers(viewer?: MarketingViewer) {
    if (viewer) ensureMarketingTaskRole(viewer);
    let members = await this.prisma.marketingTeamMember.findMany({
      where: {
        isActive: true,
        department: {
          in: [
            'Digital Marketing',
            'Digital Strategy',
            'Social Media',
            'Design & Visual',
            'Production',
          ],
        },
        NOT: { role: { contains: 'Admin' } },
      },
      orderBy: { name: 'asc' },
    });
    if (members.length === 0) {
      await this.autoSeedMarketingMembers(this.prisma);
      members = await this.prisma.marketingTeamMember.findMany({
        where: {
          isActive: true,
          department: {
            in: [
              'Digital Marketing',
              'Digital Strategy',
              'Social Media',
              'Design & Visual',
              'Production',
            ],
          },
          NOT: { role: { contains: 'Admin' } },
        },
        orderBy: { name: 'asc' },
      });
    }
    return members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      role: m.role,
      email: m.email,
      phone: m.phone || undefined,
      avatarBg: m.avatarBg,
      initial: m.initial,
      department: m.department,
    }));
  }

  async updateMember(
    viewer: MarketingViewer,
    id: string,
    dto: UpdateMarketingMemberDto,
  ) {
    this.ensureManager(viewer);
    const member = await this.prisma.marketingTeamMember.findUnique({
      where: { id },
    });
    if (!member) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: `Member dengan id ${id} tidak ditemukan.`,
      });
    }
    const updated = await this.prisma.marketingTeamMember.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.role ? { role: dto.role.trim() } : {}),
        ...(dto.email ? { email: dto.email.trim() } : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() || null }
          : {}),
        ...(dto.avatarBg ? { avatarBg: dto.avatarBg } : {}),
        ...(dto.initial ? { initial: dto.initial.trim() } : {}),
        ...(dto.department ? { department: dto.department.trim() } : {}),
      },
    });
    if (member.userId) {
      try {
        await this.prisma.user.update({
          where: { id: member.userId },
          data: {
            ...(dto.name ? { fullName: dto.name.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim() } : {}),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'marketing:member-user-mirror', err);
      }
    }
    return {
      id: updated.id,
      name: updated.name,
      role: updated.role,
      email: updated.email,
      phone: updated.phone || undefined,
      avatarBg: updated.avatarBg,
      initial: updated.initial,
      department: updated.department,
    };
  }

  async listBrands(viewer: MarketingViewer, includeInactive = false) {
    this.ensureMarketingRead(viewer);
    let brands = await this.prisma.marketingBrand.findMany({
      where:
        includeInactive && isMarketingManager(viewer) ? {} : { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        handle: true,
        primaryPlatform: true,
        ownerId: true,
        notes: true,
        accentToken: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
    if (brands.length === 0) {
      await this.autoSeedMarketingBrands(this.prisma);
      brands = await this.prisma.marketingBrand.findMany({
        where:
          includeInactive && isMarketingManager(viewer)
            ? {}
            : { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          handle: true,
          primaryPlatform: true,
          ownerId: true,
          notes: true,
          accentToken: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      });
    }
    return brands;
  }

  async createBrand(
    viewer: MarketingViewer,
    dto: CreateBrandDto,
    key?: string,
  ) {
    this.ensureManager(viewer);
    return this.prisma.marketingBrand.create({
      data: { ...dto, code: dto.code.trim(), name: dto.name.trim() },
      select: {
        id: true,
        code: true,
        name: true,
        handle: true,
        primaryPlatform: true,
        ownerId: true,
        notes: true,
        accentToken: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateBrand(viewer: MarketingViewer, id: string, dto: UpdateBrandDto) {
    this.ensureManager(viewer);
    try {
      return await this.prisma.marketingBrand.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          code: true,
          name: true,
          handle: true,
          primaryPlatform: true,
          ownerId: true,
          notes: true,
          accentToken: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException({
          code: 'BRAND_NOT_FOUND',
          message: 'Brand tidak ditemukan.',
        });
      }
      throw error;
    }
  }

  async ensureActiveBrand(db: DbClient, brandId: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        brandId,
      );
    let brand = await db.marketingBrand.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: brandId }] : []),
          { code: { equals: brandId, mode: 'insensitive' } },
          { name: { equals: brandId, mode: 'insensitive' } },
        ],
      },
      select: { id: true, code: true, name: true, isActive: true },
    });
    if (!brand && typeof db?.marketingBrand?.upsert === 'function') {
      const lower = brandId.toLowerCase();
      if (lower.includes('dreamlab')) {
        brand = await db.marketingBrand.upsert({
          where: { code: 'dreamlab' },
          update: { isActive: true },
          create: {
            code: 'dreamlab',
            name: 'Dreamlab',
            handle: '@dreamlab.workspace',
            primaryPlatform: 'Instagram & LinkedIn',
            accentToken: '#1264d3',
            notes: 'B2B Cosmetic R&D & Maklon formulation laboratory.',
            isActive: true,
          },
          select: { id: true, code: true, name: true, isActive: true },
        });
      } else if (lower.includes('toribio')) {
        brand = await db.marketingBrand.upsert({
          where: { code: 'toribio' },
          update: { isActive: true },
          create: {
            code: 'toribio',
            name: 'Toribio',
            handle: '@toribio.skincare',
            primaryPlatform: 'Instagram & TikTok',
            accentToken: '#ec4899',
            notes: 'B2C Skincare & Beauty brand focusing on skin barrier.',
            isActive: true,
          },
          select: { id: true, code: true, name: true, isActive: true },
        });
      }
    }
    if (!brand)
      throw new BadRequestException({
        code: 'BRAND_NOT_FOUND',
        message: `Brand dengan identifier '${brandId}' tidak ditemukan.`,
      });
    if (!brand.isActive)
      throw new BadRequestException({
        code: 'BRAND_INACTIVE',
        message: `Brand '${brand.name}' berstatus non-aktif.`,
      });
    return brand;
  }

  async ensureActiveUser(
    db: DbClient,
    id: string,
    field: string,
    fallbackUserId?: string,
  ) {
    if (!id && fallbackUserId) {
      id = fallbackUserId;
    }
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    let found = await db.user.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id }] : []),
          { fullName: { equals: id, mode: 'insensitive' } },
          { email: { equals: id, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, fullName: true, email: true },
    });
    if (!found) {
      const member = await db.marketingTeamMember.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id }] : []),
            { name: { equals: id, mode: 'insensitive' } },
            { email: { equals: id, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: { userId: true },
      });
      if (member?.userId) {
        found = await db.user.findFirst({
          where: { id: member.userId, status: 'ACTIVE', deletedAt: null },
          select: { id: true, fullName: true, email: true },
        });
      }
    }
    if (!found && fallbackUserId) {
      found = await db.user.findFirst({
        where: { id: fallbackUserId, status: 'ACTIVE', deletedAt: null },
        select: { id: true, fullName: true, email: true },
      });
    }
    if (!found)
      throw new BadRequestException({
        code: 'USER_INVALID',
        message: `${field} tidak merujuk user aktif.`,
        fieldErrors: { [field]: 'invalid' },
      });
    return found;
  }

  async autoSeedMarketingBrands(db: DbClient) {
    if (typeof db?.marketingBrand?.upsert !== 'function') return;
    const brands = [
      {
        code: 'dreamlab',
        name: 'Dreamlab',
        handle: '@dreamlab.workspace',
        primaryPlatform: 'Instagram & LinkedIn',
        accentToken: '#1264d3',
        notes:
          'B2B Cosmetic R&D & Maklon formulation laboratory. Tone: Professional, authoritative, sleek, innovative.',
        isActive: true,
      },
      {
        code: 'toribio',
        name: 'Toribio',
        handle: '@toribio.skincare',
        primaryPlatform: 'Instagram & TikTok',
        accentToken: '#ec4899',
        notes:
          'B2C Skincare & Beauty brand focusing on skin barrier and radiant glow. Tone: Friendly, vibrant, aesthetic, relatable.',
        isActive: true,
      },
    ];
    for (const b of brands) {
      try {
        await db.marketingBrand.upsert({
          where: { code: b.code },
          update: { isActive: true },
          create: b,
        });
      } catch (err) {
        this.logger.warn(
          `autoSeedMarketingBrands error for ${b.code}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async autoSeedMarketingMembers(db: DbClient) {
    if (
      typeof db?.marketingTeamMember?.findFirst !== 'function' ||
      typeof db?.user?.findFirst !== 'function'
    )
      return;
    const defaultMembers = [
      {
        name: 'Gusti',
        fullName: 'Gusti Bagus',
        email: 'gusti@dreamlab.id',
        role: 'Lead Digital & Brand Strategist',
        department: 'Digital Strategy',
        phone: '+62 812-3456-7801',
        avatarBg: '#e8eef6',
        initial: 'G',
      },
      {
        name: 'Revita',
        fullName: 'Revita Yustianawati',
        email: 'revita@dreamlab.id',
        role: 'Creative Content & Social Media Lead',
        department: 'Social Media',
        phone: '+62 813-9876-5432',
        avatarBg: '#fce7f3',
        initial: 'R',
      },
      {
        name: 'Zarkasi',
        fullName: 'Muhammad Zarkasi',
        email: 'zarkasi@dreamlab.id',
        role: 'Graphic Designer & Visual Specialist',
        department: 'Design & Visual',
        phone: '+62 821-4567-8902',
        avatarBg: '#fef3c7',
        initial: 'Z',
      },
      {
        name: 'Rahmat',
        fullName: 'Rahmat Hidayat',
        email: 'rahmat@dreamlab.id',
        role: 'Video Production & Copywriter',
        department: 'Production',
        phone: '+62 856-7890-1234',
        avatarBg: '#dcfce7',
        initial: 'R',
      },
      {
        name: 'Aurel',
        fullName: 'Aurelia Putri',
        email: 'aurel@dreamlab.id',
        role: 'Social Media Officer & Community',
        department: 'Social Media',
        phone: '+62 857-1234-5678',
        avatarBg: '#e0e7ff',
        initial: 'A',
      },
    ];

    for (const m of defaultMembers) {
      try {
        let user = await db.user.findFirst({
          where: {
            OR: [
              { email: { equals: m.email, mode: 'insensitive' } },
              {
                email: {
                  equals: `${m.name.toLowerCase()}@nexerp.id`,
                  mode: 'insensitive',
                },
              },
              { fullName: { equals: m.fullName, mode: 'insensitive' } },
              { fullName: { equals: m.name, mode: 'insensitive' } },
            ],
          },
        });
        if (!user) {
          user = await db.user.create({
            data: {
              email: m.email,
              fullName: m.fullName,
              passwordHash:
                '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
              roles: ['MARKETING', 'DIGIMAR'],
              status: 'ACTIVE',
            },
          });
        } else if (
          !user.roles?.some((r: string) => ['MARKETING', 'DIGIMAR'].includes(r))
        ) {
          user = await db.user.update({
            where: { id: user.id },
            data: {
              roles: Array.from(
                new Set([...(user.roles ?? []), 'MARKETING', 'DIGIMAR']),
              ),
            },
          });
        }

        const existingByUserId = user?.id
          ? await db.marketingTeamMember.findFirst({
              where: { userId: user.id },
            })
          : null;
        const existingByEmail = await db.marketingTeamMember.findFirst({
          where: {
            OR: [
              { email: { equals: m.email, mode: 'insensitive' } },
              {
                email: {
                  equals: `${m.name.toLowerCase()}@nexerp.id`,
                  mode: 'insensitive',
                },
              },
            ],
          },
        });
        const existingByName = await db.marketingTeamMember.findFirst({
          where: { name: { equals: m.name, mode: 'insensitive' } },
        });

        const target = existingByUserId || existingByEmail || existingByName;

        if (target) {
          if (existingByEmail && existingByEmail.id !== target.id) {
            await db.marketingTeamMember
              .delete({ where: { id: existingByEmail.id } })
              .catch(() => null);
          }
          await db.marketingTeamMember.update({
            where: { id: target.id },
            data: {
              name: m.name,
              role: m.role,
              department: m.department,
              phone: m.phone,
              avatarBg: m.avatarBg,
              initial: m.initial,
              userId: user.id,
              isActive: true,
            },
          });
        } else {
          const isUserIdTaken = user?.id
            ? await db.marketingTeamMember.findFirst({
                where: { userId: user.id },
              })
            : null;
          await db.marketingTeamMember.create({
            data: {
              name: m.name,
              role: m.role,
              department: m.department,
              email: m.email,
              phone: m.phone,
              avatarBg: m.avatarBg,
              initial: m.initial,
              userId: isUserIdTaken ? null : user.id,
              isActive: true,
            },
          });
        }
      } catch (err) {
        this.logger.warn(
          `autoSeedMarketingMembers error for ${m.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
