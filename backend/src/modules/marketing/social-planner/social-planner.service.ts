import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateSocialPostDto,
  GenerateSocialCopyDto,
  MetaConnectionDto,
  MetaInsightsDto,
  UpdateSocialPostDto,
} from './social-planner.dto';
import {
  assertSocialTransition,
  ensureSocialWriteRole,
  MarketingViewer,
  normalizeSocialStatus,
  SocialStatus,
} from '../canonical/marketing-domain.policy';
import { CanonicalMarketingService } from '../canonical/canonical-marketing.service';

@Injectable()
export class SocialPlannerService {
  private readonly logger = new Logger(SocialPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalMarketingService,
  ) {}

  async getPosts(
    viewer: MarketingViewer,
    filter?: {
      platform?: string;
      status?: string;
      pillar?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    this.ensureReadRole(viewer);
    const where: Record<string, unknown> = {};
    if (filter?.platform && filter.platform !== 'all')
      where.platform = filter.platform;
    if (filter?.status && filter.status !== 'all')
      where.canonicalStatus = normalizeSocialStatus(filter.status);
    if (filter?.pillar && filter.pillar !== 'all') where.pillar = filter.pillar;
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { caption: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    try {
      const page = Math.max(1, filter?.page || 1);
      const limit = Math.min(100, Math.max(1, filter?.limit || 50));
      const [posts, total] = await this.prisma.$transaction([
        (this.prisma as any).socialPost.findMany({
          where,
          include: {
            checklist: { orderBy: { createdAt: 'asc' } },
            brand: true,
            assignee: { select: { id: true, fullName: true, email: true } },
            reviewer: { select: { id: true, fullName: true, email: true } },
            media: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        (this.prisma as any).socialPost.count({ where }),
      ]);
      const data = posts.map((post: any) => this.toApiPost(post));
      return {
        success: true,
        data,
        posts: data,
        page,
        limit,
        total,
        hasMore: page * limit < total,
      };
    } catch (error) {
      this.logger.error(
        `Failed to query social posts: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Data Social Media Tracker belum dapat dimuat.',
      );
    }
  }

  async createPost(
    viewer: MarketingViewer,
    data: CreateSocialPostDto,
    idempotencyKey?: string,
  ) {
    ensureSocialWriteRole(viewer);
    const canonicalStatus = normalizeSocialStatus(data.status ?? 'IDEA');
    if (canonicalStatus !== 'IDEA') {
      throw new ConflictException({
        code: 'SOCIAL_INITIAL_STATE_INVALID',
        message: 'Konten baru harus dimulai dari status IDEA.',
      });
    }
    await this.ensureSocialReferences(
      data.brandId,
      data.assigneeId,
      data.reviewerId,
    );
    try {
      const created = await this.canonical.runIdempotent(
        'POST:/marketing/social/posts',
        idempotencyKey,
        viewer,
        data,
        (db) =>
          db.socialPost.create({
            data: {
              ...this.toPersistencePayload(data),
              canonicalStatus,
              status: canonicalStatus.toLowerCase(),
              version: 1,
              authorName: viewer.email || 'Marketing Team',
              authorAvatar: null,
              authorRole: viewer.roles.includes('MARKETING')
                ? 'Marketing'
                : 'Content Creator',
              checklist: {
                create: (data.checklist ?? []).map((item) => ({
                  text: item.text,
                  done: item.done,
                })),
              },
            } as any,
            include: {
              checklist: { orderBy: { createdAt: 'asc' } },
              brand: true,
              assignee: { select: { id: true, fullName: true, email: true } },
              reviewer: { select: { id: true, fullName: true, email: true } },
              media: { orderBy: { sortOrder: 'asc' } },
            },
          }),
      );
      return { success: true, post: this.toApiPost(created) };
    } catch (error) {
      this.logger.error(
        `Failed to create social post: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Konten belum dapat disimpan.');
    }
  }

  async updatePost(
    viewer: MarketingViewer,
    id: string,
    data: UpdateSocialPostDto,
  ) {
    ensureSocialWriteRole(viewer);
    const current = await (this.prisma as any).socialPost.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Konten tidak ditemukan.');
    await this.ensureSocialReferences(
      data.brandId,
      data.assigneeId,
      data.reviewerId,
    );
    const canonicalStatus = data.status
      ? normalizeSocialStatus(data.status)
      : (current.canonicalStatus as SocialStatus);
    assertSocialTransition({
      from: current.canonicalStatus as SocialStatus,
      to: canonicalStatus,
      hasBrand: Boolean(data.brandId ?? current.brandId),
      hasAssignee: Boolean(data.assigneeId ?? current.assigneeId),
      scheduledAt:
        data.scheduledDate !== undefined
          ? data.scheduledDate
            ? new Date(data.scheduledDate)
            : null
          : current.scheduledDate,
      publishedAt:
        data.publishedDate !== undefined
          ? data.publishedDate
            ? new Date(data.publishedDate)
            : null
          : current.publishedDate,
      hasPublicationEvidence: Boolean(
        data.metaPostId ??
        data.metaPermalink ??
        current.metaPostId ??
        current.metaPermalink,
      ),
    });
    const updatePayload = this.toPersistencePayload(data);
    updatePayload.canonicalStatus = canonicalStatus;
    updatePayload.status = canonicalStatus.toLowerCase();
    updatePayload.version = { increment: 1 };

    try {
      const expectedVersion = data.version ?? current.version;
      const updated = await this.prisma.$transaction(async (db: any) => {
        const result = await db.socialPost.updateMany({
          where: { id, version: expectedVersion },
          data: updatePayload,
        });
        if (result.count !== 1)
          throw new ConflictException({
            code: 'VERSION_CONFLICT',
            message: 'Konten telah berubah. Muat ulang sebelum menyimpan.',
          });
        if (data.checklist !== undefined) {
          await db.socialChecklistItem.deleteMany({ where: { postId: id } });
          if (data.checklist.length)
            await db.socialChecklistItem.createMany({
              data: data.checklist.map((item) => ({
                postId: id,
                text: item.text,
                done: item.done,
              })),
            });
        }
        if (data.performance) {
          await db.socialPostMetricSnapshot.create({
            data: {
              postId: id,
              source: 'MANUAL',
              capturedAt: new Date(),
              reach: Number(data.performance.reach || 0),
              impressions: Number(data.performance.impressions || 0),
              views: Number(data.performance.videoViews || 0),
              likes: Number(data.performance.likes || 0),
              comments: Number(data.performance.comments || 0),
              shares: Number(data.performance.shares || 0),
              saves: Number(data.performance.saves || 0),
              clicks: Number(data.performance.clicks || 0),
              spend: Number(data.performance.costPerResult || 0),
            },
          });
        }
        return db.socialPost.findUnique({
          where: { id },
          include: {
            checklist: { orderBy: { createdAt: 'asc' } },
            brand: true,
            assignee: { select: { id: true, fullName: true, email: true } },
            reviewer: { select: { id: true, fullName: true, email: true } },
            media: { orderBy: { sortOrder: 'asc' } },
          },
        });
      });
      return { success: true, post: this.toApiPost(updated) };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025')
        throw new NotFoundException('Konten tidak ditemukan.');
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Failed to update social post ${id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Perubahan konten belum dapat disimpan.',
      );
    }
  }

  async deletePost(viewer: MarketingViewer, id: string) {
    if (
      !viewer.roles.some((role) => ['SUPER_ADMIN', 'MARKETING'].includes(role))
    ) {
      throw new ForbiddenException({
        code: 'SOCIAL_DELETE_FORBIDDEN',
        message: 'Hanya Marketing manager yang dapat menghapus konten.',
      });
    }
    try {
      await (this.prisma as any).socialPost.delete({ where: { id } });
      return { success: true, deletedId: id };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025')
        throw new NotFoundException('Konten tidak ditemukan.');
      this.logger.error(
        `Failed to delete social post ${id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Konten belum dapat dihapus.');
    }
  }

  async testMetaConnection(dto: MetaConnectionDto) {
    if (!dto.accessToken?.trim()) {
      throw new BadRequestException(
        'Meta Access Token diperlukan hanya saat koneksi ingin diuji.',
      );
    }
    try {
      const graphUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}}&access_token=${encodeURIComponent(dto.accessToken)}`;
      const response = await fetch(graphUrl);
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new BadRequestException(
          result.error?.message ||
            'Meta Graph API menolak kredensial tersebut.',
        );
      }
      return {
        success: true,
        user: { id: result.id, name: result.name },
        accounts: result.accounts?.data || [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Meta API test error: ${(error as Error).message}`);
      throw new BadGatewayException('Meta Graph API belum dapat dihubungi.');
    }
  }

  async fetchMetaInsights(dto: MetaInsightsDto) {
    if (!dto.accessToken?.trim()) {
      throw new BadRequestException(
        'Meta Access Token diperlukan untuk sinkronisasi. Mode manual tetap dapat digunakan.',
      );
    }
    if (!dto.igAccountId && !dto.pageId) {
      throw new BadRequestException(
        'Page ID atau Instagram Account ID diperlukan untuk sinkronisasi.',
      );
    }
    const accountId = dto.igAccountId || dto.pageId;
    const metrics = dto.igAccountId
      ? 'impressions,reach,profile_views,follower_count'
      : 'page_impressions,page_engaged_users,page_post_engagements,page_fans';
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(accountId!)}/insights?metric=${metrics}&period=${dto.period || 'day'}&access_token=${encodeURIComponent(dto.accessToken)}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new BadRequestException(
          result.error?.message || 'Meta Graph API menolak permintaan insight.',
        );
      }
      return {
        success: true,
        type: dto.igAccountId ? 'instagram' : 'facebook_page',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Failed to fetch Meta insights: ${(error as Error).message}`,
      );
      throw new BadGatewayException('Meta Graph API belum dapat dihubungi.');
    }
  }

  async generateAiCopy(dto: GenerateSocialCopyDto) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI copywriter belum dikonfigurasi.',
      );
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: this.buildAiPrompt(dto) }] }],
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || 'Gemini request failed');
      const outputText =
        result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!outputText) throw new Error('Gemini returned an empty response');
      return { success: true, result: outputText };
    } catch (error) {
      this.logger.error(`Gemini API call failed: ${(error as Error).message}`);
      throw new BadGatewayException('AI copywriter tidak dapat dihubungi.');
    }
  }

  private toPersistencePayload(data: UpdateSocialPostDto): Record<string, any> {
    const payload: Record<string, any> = {};
    const scalarFields = [
      'title',
      'platform',
      'contentType',
      'pillar',
      'caption',
      'hooks',
      'cta',
      'hashtags',
      'coverImage',
      'mediaUrls',
      'metaPostId',
      'metaPermalink',
      'notes',
      'targetAudience',
      'campaign',
      'calloutText',
      'calloutEmoji',
      'brandId',
      'assigneeId',
      'reviewerId',
      'brief',
      'referenceUrl',
    ] as const;
    for (const field of scalarFields)
      if (data[field] !== undefined) payload[field] = data[field];
    if (data.scheduledDate !== undefined)
      payload.scheduledDate = data.scheduledDate
        ? new Date(data.scheduledDate)
        : null;
    if (data.publishedDate !== undefined)
      payload.publishedDate = data.publishedDate
        ? new Date(data.publishedDate)
        : null;
    if (data.author) {
      payload.authorName = data.author.name;
      payload.authorAvatar = data.author.avatar || null;
      payload.authorRole = data.author.role;
    }
    if (data.performance) {
      Object.assign(payload, data.performance);
      if (data.performance.engagementRate === undefined) {
        const interactions =
          Number(data.performance.likes || 0) +
          Number(data.performance.comments || 0) +
          Number(data.performance.shares || 0) +
          Number(data.performance.saves || 0);
        const base = Number(
          data.performance.impressions || data.performance.reach || 0,
        );
        payload.engagementRate =
          base > 0 ? Number(((interactions / base) * 100).toFixed(2)) : 0;
      }
    }
    return payload;
  }

  private toApiPost(post: any) {
    return {
      id: post.id,
      title: post.title,
      platform: post.platform,
      contentType: post.contentType,
      status: post.canonicalStatus,
      legacyStatus: post.status,
      brandId: post.brandId,
      brand: post.brand,
      assigneeId: post.assigneeId,
      assignee: post.assignee,
      reviewerId: post.reviewerId,
      reviewer: post.reviewer,
      brief: post.brief ?? '',
      referenceUrl: post.referenceUrl ?? undefined,
      version: post.version,
      scheduledDate:
        post.scheduledDate?.toISOString?.() ?? post.scheduledDate ?? '',
      publishedDate:
        post.publishedDate?.toISOString?.() ?? post.publishedDate ?? undefined,
      pillar: post.pillar,
      caption: post.caption,
      hooks: post.hooks,
      cta: post.cta,
      hashtags: post.hashtags,
      coverImage: post.coverImage ?? undefined,
      mediaUrls: post.mediaUrls,
      author: {
        name: post.authorName,
        avatar: post.authorAvatar ?? '',
        role: post.authorRole,
      },
      metaPostId: post.metaPostId ?? undefined,
      metaPermalink: post.metaPermalink ?? undefined,
      notes: post.notes ?? '',
      targetAudience: post.targetAudience ?? '',
      campaign: post.campaign ?? '',
      calloutText: post.calloutText ?? undefined,
      calloutEmoji: post.calloutEmoji ?? undefined,
      performance: {
        reach: post.reach,
        impressions: post.impressions,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        saves: post.saves,
        videoViews: post.videoViews,
        clicks: post.clicks,
        engagementRate: Number(post.engagementRate),
        viralityScore: post.viralityScore,
        costPerResult: Number(post.costPerResult),
      },
      checklist: post.checklist,
      media: post.media ?? [],
      createdAt: post.createdAt?.toISOString?.() ?? post.createdAt,
      updatedAt: post.updatedAt?.toISOString?.() ?? post.updatedAt,
    };
  }

  private buildAiPrompt(dto: GenerateSocialCopyDto): string {
    if (dto.action === 'generate_hooks')
      return `Buatkan 5 hook media sosial untuk topik "${dto.topic || 'Inovasi Maklon Skincare'}" di ${dto.platform || 'Instagram'}. Kembalikan JSON array string.`;
    if (dto.action === 'generate_hashtags')
      return `Buatkan 20 hashtag tertarget untuk topik "${dto.topic || ''}" di ${dto.platform || 'Instagram'}. Kembalikan JSON array string.`;
    if (dto.action === 'improve_caption')
      return `Perbaiki caption ini agar lebih jelas dan engaging: "${dto.existingCaption || dto.topic || ''}".`;
    return `Buat caption lengkap dengan hook, isi, CTA, dan hashtag untuk topik "${dto.topic || ''}", platform ${dto.platform || 'Instagram'}, pilar ${dto.pillar || 'Educational'}, audiens ${dto.audience || 'Indonesia'}.`;
  }

  private ensureReadRole(viewer: MarketingViewer) {
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
    ) {
      throw new ForbiddenException({
        code: 'SOCIAL_READ_FORBIDDEN',
        message: 'Akses Social Media ditolak.',
      });
    }
  }

  private async ensureSocialReferences(
    brandId?: string,
    assigneeId?: string,
    reviewerId?: string,
  ) {
    if (brandId) {
      const brand = await (this.prisma as any).marketingBrand.findFirst({
        where: { id: brandId, isActive: true },
        select: { id: true },
      });
      if (!brand)
        throw new BadRequestException({
          code: 'BRAND_INVALID',
          message: 'brandId tidak valid.',
          fieldErrors: { brandId: 'invalid' },
        });
    }
    for (const [field, id] of [
      ['assigneeId', assigneeId],
      ['reviewerId', reviewerId],
    ] as const) {
      if (!id) continue;
      const user = await (this.prisma as any).user.findFirst({
        where: { id, status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      if (!user)
        throw new BadRequestException({
          code: 'USER_INVALID',
          message: `${field} tidak valid.`,
          fieldErrors: { [field]: 'invalid' },
        });
    }
  }

  private assertSocialRequirements(
    status: SocialStatus,
    data: CreateSocialPostDto,
  ) {
    if (
      status === 'SCHEDULED' &&
      (!data.brandId || !data.assigneeId || !data.scheduledDate)
    ) {
      throw new BadRequestException({
        code: 'SOCIAL_SCHEDULE_REQUIREMENTS',
        message:
          'Brand, assignee, dan waktu terjadwal wajib sebelum penjadwalan.',
      });
    }
    if (
      status === 'PUBLISHED' &&
      (!data.publishedDate || !(data.metaPostId || data.metaPermalink))
    ) {
      throw new BadRequestException({
        code: 'SOCIAL_PUBLICATION_EVIDENCE_REQUIRED',
        message: 'Waktu dan bukti publikasi wajib diisi.',
      });
    }
  }
}
