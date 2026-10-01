import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

function getWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Injectable()
export class MarketingOrganicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createWeeklyOrganic(data: any) {
    const result = await this.prisma.accountHealthLog.upsert({
      where: {
        year_weekNumber_platform: {
          year: Number(data.year),
          weekNumber: Number(data.weekNumber),
          platform: data.platform,
        },
      },
      update: {
        totalFollowers: Number(data.totalFollowers),
        followerGrowth: Number(data.followerGrowth),
        unfollows: Number(data.unfollows || 0),
        totalReach: Number(data.totalReach),
        profileVisits: Number(data.profileVisits),
        postsCount: Number(data.postsCount || 0),
        storiesCount: Number(data.storiesCount || 0),
        avgStoryViews: Number(data.avgStoryViews || 0),
        likesCount: Number(data.likesCount || 0),
        commentsCount: Number(data.commentsCount || 0),
        savesCount: Number(data.savesCount || 0),
        sharesCount: Number(data.sharesCount || 0),
      },
      create: {
        year: Number(data.year),
        weekNumber: Number(data.weekNumber),
        platform: data.platform,
        totalFollowers: Number(data.totalFollowers),
        followerGrowth: Number(data.followerGrowth),
        unfollows: Number(data.unfollows || 0),
        totalReach: Number(data.totalReach),
        profileVisits: Number(data.profileVisits),
        postsCount: Number(data.postsCount || 0),
        storiesCount: Number(data.storiesCount || 0),
        avgStoryViews: Number(data.avgStoryViews || 0),
        likesCount: Number(data.likesCount || 0),
        commentsCount: Number(data.commentsCount || 0),
        savesCount: Number(data.savesCount || 0),
        sharesCount: Number(data.sharesCount || 0),
      },
    });

    this.eventEmitter.emit('marketing.organic.created', {
      platform: data.platform,
      year: data.year,
      weekNumber: data.weekNumber,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic logged: ${data.platform} W${data.weekNumber}/${data.year}`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async updateWeeklyOrganic(id: string, data: any) {
    const result = await this.prisma.accountHealthLog.update({
      where: { id },
      data: {
        ...data,
        year: data.year !== undefined ? Number(data.year) : undefined,
        weekNumber:
          data.weekNumber !== undefined ? Number(data.weekNumber) : undefined,
        totalFollowers:
          data.totalFollowers !== undefined
            ? Number(data.totalFollowers)
            : undefined,
        followerGrowth:
          data.followerGrowth !== undefined
            ? Number(data.followerGrowth)
            : undefined,
        unfollows:
          data.unfollows !== undefined ? Number(data.unfollows) : undefined,
        totalReach:
          data.totalReach !== undefined ? Number(data.totalReach) : undefined,
        profileVisits:
          data.profileVisits !== undefined
            ? Number(data.profileVisits)
            : undefined,
        postsCount:
          data.postsCount !== undefined ? Number(data.postsCount) : undefined,
        storiesCount:
          data.storiesCount !== undefined
            ? Number(data.storiesCount)
            : undefined,
        avgStoryViews:
          data.avgStoryViews !== undefined
            ? Number(data.avgStoryViews)
            : undefined,
        likesCount:
          data.likesCount !== undefined ? Number(data.likesCount) : undefined,
        commentsCount:
          data.commentsCount !== undefined
            ? Number(data.commentsCount)
            : undefined,
        savesCount:
          data.savesCount !== undefined ? Number(data.savesCount) : undefined,
        sharesCount:
          data.sharesCount !== undefined ? Number(data.sharesCount) : undefined,
      },
    });

    this.eventEmitter.emit('marketing.organic.updated', { id });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic ${id.slice(0, 8)} updated`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async deleteWeeklyOrganic(id: string) {
    await this.prisma.accountHealthLog.delete({
      where: { id },
    });

    this.eventEmitter.emit('marketing.organic.deleted', { id });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic ${id.slice(0, 8)} deleted`,
      loggedBy: 'SYSTEM:MARKETING',
    });
  }

  async getWeeklyOrganicLogs() {
    return this.prisma.accountHealthLog.findMany({
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: 100,
    });
  }

  async createContentAsset(data: any) {
    const totalEng =
      Number(data.likes || 0) +
      Number(data.comments || 0) +
      Number(data.shares || 0) +
      Number(data.saves || 0);
    const engagementRate =
      Number(data.views) > 0 ? (totalEng / Number(data.views)) * 100 : 0;

    const result = await this.prisma.contentAsset.create({
      data: {
        title: data.title,
        publishDate: new Date(data.publishDate),
        platform: data.platform,
        contentPillar: data.contentPillar,
        url: data.url,
        views: Number(data.views),
        likes: Number(data.likes),
        comments: Number(data.comments),
        shares: Number(data.shares),
        saves: Number(data.saves),
        engagementRate: engagementRate,
      },
    });

    this.eventEmitter.emit('marketing.content.created', {
      id: result.id,
      title: result.title,
      platform: result.platform,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Content asset created: "${result.title}" on ${result.platform}`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async getContentAssetLogs() {
    return this.prisma.contentAsset.findMany({
      orderBy: { publishDate: 'desc' },
      take: 100,
    });
  }

  async listContentAssets({
    take = 20,
    cursor,
  }: {
    take?: number;
    cursor?: string;
  }) {
    const rows = await this.prisma.contentAsset.findMany({
      where: {},
      orderBy: { publishDate: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  async getOrganicAnalytics(startDate: Date, endDate: Date) {
    const topContents = await this.prisma.contentAsset.findMany({
      where: { publishDate: { gte: startDate, lte: endDate } },
      orderBy: { engagementRate: 'desc' },
      take: 5,
      select: {
        title: true,
        contentPillar: true,
        views: true,
        engagementRate: true,
        platform: true,
      },
    });

    const vitalityAgg = await this.prisma.contentAsset.aggregate({
      _sum: {
        views: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
      _count: { _all: true },
      where: { publishDate: { gte: startDate, lte: endDate } },
    });

    const healthLogs = await this.prisma.accountHealthLog.findMany({
      where: {
        OR: [
          {
            year: startDate.getFullYear(),
            weekNumber: { gte: getWeek(startDate) },
          },
          {
            year: endDate.getFullYear(),
            weekNumber: { lte: getWeek(endDate) },
          },
        ],
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    const platformMap: Record<string, any> = {};
    healthLogs.forEach((log) => {
      if (!platformMap[log.platform]) {
        platformMap[log.platform] = {
          platform: log.platform,
          totalFollowers: log.totalFollowers,
          followerGrowth: 0,
          totalReach: 0,
          profileVisits: 0,
          unfollows: 0,
          postsCount: 0,
          storiesCount: 0,
          likesCount: 0,
          commentsCount: 0,
          savesCount: 0,
          sharesCount: 0,
        };
      }
      platformMap[log.platform].followerGrowth += log.followerGrowth;
      platformMap[log.platform].unfollows += log.unfollows;
      platformMap[log.platform].totalReach += log.totalReach;
      platformMap[log.platform].profileVisits += log.profileVisits;
      platformMap[log.platform].postsCount += log.postsCount;
      platformMap[log.platform].storiesCount += log.storiesCount;
      platformMap[log.platform].likesCount += log.likesCount;
      platformMap[log.platform].commentsCount += log.commentsCount;
      platformMap[log.platform].savesCount += log.savesCount;
      platformMap[log.platform].sharesCount += log.sharesCount;
    });

    return {
      topContents,
      vitality: {
        totalViews: vitalityAgg._sum.views || 0,
        totalInteractions:
          (vitalityAgg._sum.likes || 0) +
          (vitalityAgg._sum.comments || 0) +
          (vitalityAgg._sum.shares || 0) +
          (vitalityAgg._sum.saves || 0),
        totalPosts: vitalityAgg._count._all || 0,
        engagementByCategory: {
          likes: vitalityAgg._sum.likes || 0,
          shares: vitalityAgg._sum.shares || 0,
          saves: vitalityAgg._sum.saves || 0,
        },
      },
      platformHealth: Object.values(platformMap),
    };
  }
}
