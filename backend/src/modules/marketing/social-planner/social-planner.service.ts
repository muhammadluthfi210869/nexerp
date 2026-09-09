import {
  BadGatewayException,
  BadRequestException,
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

@Injectable()
export class SocialPlannerService {
  private readonly logger = new Logger(SocialPlannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPosts(filter?: {
    platform?: string;
    status?: string;
    pillar?: string;
    search?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (filter?.platform && filter.platform !== 'all')
      where.platform = filter.platform;
    if (filter?.status && filter.status !== 'all') where.status = filter.status;
    if (filter?.pillar && filter.pillar !== 'all') where.pillar = filter.pillar;
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { caption: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    try {
      const posts = await (this.prisma as any).socialPost.findMany({
        where,
        include: { checklist: { orderBy: { createdAt: 'asc' } } },
        orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
      });
      return {
        success: true,
        posts: posts.map((post: any) => this.toApiPost(post)),
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

  async createPost(data: CreateSocialPostDto) {
    try {
      const created = await (this.prisma as any).socialPost.create({
        data: {
          ...this.toPersistencePayload(data),
          checklist: {
            create: (data.checklist ?? []).map((item) => ({
              text: item.text,
              done: item.done,
            })),
          },
        },
        include: { checklist: { orderBy: { createdAt: 'asc' } } },
      });
      return { success: true, post: this.toApiPost(created) };
    } catch (error) {
      this.logger.error(
        `Failed to create social post: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Konten belum dapat disimpan.');
    }
  }

  async updatePost(id: string, data: UpdateSocialPostDto) {
    const updatePayload = this.toPersistencePayload(data);
    if (data.checklist !== undefined) {
      updatePayload.checklist = {
        deleteMany: {},
        create: data.checklist.map((item) => ({
          text: item.text,
          done: item.done,
        })),
      };
    }

    try {
      const updated = await (this.prisma as any).socialPost.update({
        where: { id },
        data: updatePayload,
        include: { checklist: { orderBy: { createdAt: 'asc' } } },
      });
      return { success: true, post: this.toApiPost(updated) };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025')
        throw new NotFoundException('Konten tidak ditemukan.');
      this.logger.error(
        `Failed to update social post ${id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Perubahan konten belum dapat disimpan.',
      );
    }
  }

  async deletePost(id: string) {
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
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(accountId!)}\/insights?metric=${metrics}&period=${dto.period || 'day'}&access_token=${encodeURIComponent(dto.accessToken)}`;
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
      throw new ServiceUnavailableException('AI copywriter belum dikonfigurasi.');
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
      'status',
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
        const reach = Number(data.performance.reach || 0);
        payload.engagementRate =
          reach > 0 ? Number(((interactions / reach) * 100).toFixed(2)) : 0;
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
      status: post.status,
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

}
