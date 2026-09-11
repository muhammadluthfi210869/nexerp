import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  AttachmentMetadataDto,
  ConfigureIntegrationDto,
  CreateBrandDto,
  CreateCanonicalProjectDto,
  CreateCanonicalTaskDto,
  CreateTaskCommentDto,
  PaginationQueryDto,
  ReportingQueryDto,
  TaskListQueryDto,
  TriggerIntegrationSyncDto,
  UpdateBrandDto,
  UpdateCanonicalProjectDto,
  UpdateCanonicalTaskDto,
  UpdateChecklistItemDto,
  UpdateTaskStatusDto,
  UpsertChannelMetricDto,
} from './canonical-marketing.dto';
import {
  assertTaskTransition,
  ensureMarketingTaskRole,
  isMarketingManager,
  MarketingViewer,
  TaskStatus,
} from './marketing-domain.policy';

type DbClient = PrismaService;

const USER_PUBLIC_SELECT = { id: true, fullName: true, email: true } as const;
const TASK_INCLUDE: any = {
  project: true,
  brandRef: true,
  pic: { select: USER_PUBLIC_SELECT },
  reviewer: { select: USER_PUBLIC_SELECT },
  checklist: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
};

@Injectable()
export class CanonicalMarketingService {
  constructor(private readonly prisma: PrismaService) {}

  async listTasks(viewer: MarketingViewer, query: TaskListQueryDto) {
    ensureMarketingTaskRole(viewer);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: any = {};
    if (!isMarketingManager(viewer)) {
      where.OR = [
        { ownerId: viewer.id },
        { assigneeId: viewer.id },
        { picId: viewer.id },
        { assignedById: viewer.id },
      ];
    }
    if (query.status) where.canonicalStatus = query.status;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.q?.trim()) {
      const search = query.q.trim();
      const searchWhere = [
        { title: { contains: search, mode: 'insensitive' } },
        { taskCode: { contains: search, mode: 'insensitive' } },
        { brief: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchWhere }];
        delete where.OR;
      } else where.OR = searchWhere;
    }
    const orderBy = this.taskSort(query.sort);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marketingTask.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketingTask.count({ where }),
    ]);
    return this.page(
      rows.map((row) => this.taskResponse(row)),
      page,
      limit,
      total,
    );
  }

  async getTask(viewer: MarketingViewer, id: string) {
    ensureMarketingTaskRole(viewer);
    const task = await this.findVisibleTask(this.prisma, viewer, id);
    return this.taskResponse(task);
  }

  async createTask(
    viewer: MarketingViewer,
    dto: CreateCanonicalTaskDto,
    idempotencyKey?: string,
  ) {
    ensureMarketingTaskRole(viewer);
    return this.runIdempotent(
      'POST:/marketing/tasks',
      idempotencyKey,
      viewer,
      dto,
      async (db) => {
        this.assertDateOrder(dto.startDate, dto.dueDate);
        if (dto.type === 'PROJECT' && !dto.projectId) {
          throw new BadRequestException({
            code: 'TASK_PROJECT_REQUIRED',
            message: 'projectId wajib untuk task PROJECT.',
            fieldErrors: { projectId: 'required' },
          });
        }
        if (!isMarketingManager(viewer) && dto.assigneeId !== viewer.id) {
          throw new ForbiddenException({
            code: 'TASK_ASSIGN_FORBIDDEN',
            message: 'Member hanya dapat membuat task untuk dirinya sendiri.',
          });
        }
        await this.ensureActiveUser(db, dto.assigneeId, 'assigneeId');
        if (dto.reviewerId)
          await this.ensureActiveUser(db, dto.reviewerId, 'reviewerId');
        if (dto.projectId) await this.ensureProject(db, dto.projectId);
        const brand = dto.brandId
          ? await this.ensureActiveBrand(db, dto.brandId)
          : null;
        const task = await db.marketingTask.create({
          data: {
            taskCode: this.code('MKT'),
            ownerId: viewer.id,
            assigneeId: dto.assigneeId,
            picId: dto.assigneeId,
            reviewerId: dto.reviewerId ?? null,
            assignedById: viewer.id,
            title: dto.title.trim(),
            description: dto.brief?.trim() || null,
            status: 'OPEN',
            canonicalStatus: 'NOT_STARTED',
            taskType: dto.type,
            priority: dto.priority,
            startDate: new Date(dto.startDate),
            dueDate: new Date(dto.dueDate),
            channel: dto.channel.trim(),
            category: dto.category.trim(),
            brand: brand?.name ?? 'Dreamlab',
            brandId: dto.brandId ?? null,
            projectId: dto.projectId ?? null,
            brief: dto.brief?.trim() || null,
            outputUrl: dto.outputUrl ?? null,
            referenceUrl: dto.referenceUrl ?? null,
            estimatedMinutes: dto.estimatedMinutes ?? 0,
            estimatedHours: Math.ceil((dto.estimatedMinutes ?? 0) / 60),
            version: 1,
            checklistTotal: dto.checklist?.length ?? 0,
            checklist: dto.checklist?.length
              ? {
                  create: dto.checklist.map((item) => ({
                    text: item.text.trim(),
                    isRequired: item.isRequired,
                    sortOrder: item.sortOrder,
                  })),
                }
              : undefined,
            history: {
              create: {
                byId: viewer.id,
                fromStatus: null,
                toStatus: 'NOT_STARTED',
                note: 'Task created through canonical API.',
              },
            },
          },
          include: TASK_INCLUDE,
        });
        return this.taskResponse(task);
      },
    );
  }

  async updateTask(
    viewer: MarketingViewer,
    id: string,
    dto: UpdateCanonicalTaskDto,
  ) {
    ensureMarketingTaskRole(viewer);
    const current = await this.findVisibleTask(this.prisma, viewer, id);
    this.ensureCanEditTask(viewer, current);
    if (dto.startDate || dto.dueDate) {
      this.assertDateOrder(
        dto.startDate ?? current.startDate?.toISOString(),
        dto.dueDate ?? current.dueDate?.toISOString(),
      );
    }
    if (dto.assigneeId)
      await this.ensureActiveUser(this.prisma, dto.assigneeId, 'assigneeId');
    if (dto.reviewerId)
      await this.ensureActiveUser(this.prisma, dto.reviewerId, 'reviewerId');
    if (dto.projectId) await this.ensureProject(this.prisma, dto.projectId);
    if (dto.brandId) await this.ensureActiveBrand(this.prisma, dto.brandId);
    const data: any = { version: { increment: 1 } };
    for (const field of [
      'title',
      'channel',
      'category',
      'priority',
      'brief',
      'outputUrl',
      'referenceUrl',
    ] as const) {
      if (dto[field] !== undefined)
        data[field] =
          typeof dto[field] === 'string' ? dto[field].trim() : dto[field];
    }
    for (const field of ['projectId', 'brandId', 'reviewerId'] as const)
      if (dto[field] !== undefined) data[field] = dto[field];
    if (dto.assigneeId !== undefined) {
      data.assigneeId = dto.assigneeId;
      data.picId = dto.assigneeId;
    }
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.estimatedMinutes !== undefined) {
      data.estimatedMinutes = dto.estimatedMinutes;
      data.estimatedHours = Math.ceil(dto.estimatedMinutes / 60);
    }
    if (dto.actualMinutes !== undefined) {
      data.actualMinutes = dto.actualMinutes;
      data.actualHours = Math.ceil(dto.actualMinutes / 60);
    }
    await this.optimisticUpdate(
      this.prisma.marketingTask,
      id,
      dto.version,
      data,
    );
    return this.getTask(viewer, id);
  }

  async updateTaskStatus(
    viewer: MarketingViewer,
    id: string,
    dto: UpdateTaskStatusDto,
  ) {
    ensureMarketingTaskRole(viewer);
    const current = await this.findVisibleTask(this.prisma, viewer, id);
    this.ensureCanEditTask(viewer, current);
    const incompleteRequiredItems =
      dto.status === 'DONE'
        ? await this.prisma.marketingTaskChecklistItem.count({
            where: { taskId: id, isRequired: true, done: false },
          })
        : 0;
    assertTaskTransition({
      from: current.canonicalStatus as TaskStatus,
      to: dto.status,
      isManager: isMarketingManager(viewer),
      incompleteRequiredItems,
      reason: dto.reason,
    });
    await this.prisma.$transaction(async (db) => {
      await this.optimisticUpdate(db.marketingTask, id, dto.version, {
        canonicalStatus: dto.status,
        status: this.legacyTaskStatus(dto.status),
        completedAt:
          dto.status === 'DONE'
            ? new Date()
            : dto.status === 'IN_PROGRESS' && current.canonicalStatus === 'DONE'
              ? null
              : current.completedAt,
        version: { increment: 1 },
      });
      await db.marketingTaskHistory.create({
        data: {
          taskId: id,
          byId: viewer.id,
          fromStatus: current.canonicalStatus,
          toStatus: dto.status,
          note: dto.reason?.trim() || null,
        },
      });
    });
    return this.getTask(viewer, id);
  }

  async createComment(
    viewer: MarketingViewer,
    taskId: string,
    dto: CreateTaskCommentDto,
  ) {
    ensureMarketingTaskRole(viewer);
    const task = await this.findVisibleTask(this.prisma, viewer, taskId);
    this.ensureCanEditTask(viewer, task);
    return this.prisma.marketingTaskComment.create({
      data: {
        taskId,
        authorId: viewer.id,
        body: dto.body.trim(),
      },
    });
  }

  async deleteComment(viewer: MarketingViewer, commentId: string) {
    ensureMarketingTaskRole(viewer);
    const comment = await this.prisma.marketingTaskComment.findFirst({
      where: { id: commentId },
    });
    if (!comment || comment.authorId !== viewer.id)
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Komentar tidak ditemukan atau Anda tidak memiliki akses.',
      });
    await this.prisma.marketingTaskComment.delete({ where: { id: commentId } });
  }

  async listAttachments(viewer: MarketingViewer, taskId: string) {
    ensureMarketingTaskRole(viewer);
    await this.findVisibleTask(this.prisma, viewer, taskId);
    return this.prisma.marketingTaskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addAttachment(
    viewer: MarketingViewer,
    taskId: string,
    file: AttachmentMetadataDto,
  ) {
    ensureMarketingTaskRole(viewer);
    await this.findVisibleTask(this.prisma, viewer, taskId);
    return this.prisma.marketingTaskAttachment.create({
      data: {
        taskId,
        uploadedById: viewer.id,
        name: file.name,
        type: file.type,
        sizeKb: file.sizeKb,
        path: file.path,
      },
    });
  }

  async deleteAttachment(viewer: MarketingViewer, attachmentId: string) {
    ensureMarketingTaskRole(viewer);
    const att = await this.prisma.marketingTaskAttachment.findFirst({
      where: { id: attachmentId },
    });
    if (!att || att.uploadedById !== viewer.id)
      throw new NotFoundException({
        code: 'ATTACHMENT_NOT_FOUND',
        message: 'Lampiran tidak ditemukan atau Anda tidak memiliki akses.',
      });
    await this.prisma.marketingTaskAttachment.delete({
      where: { id: attachmentId },
    });
  }

  async updateChecklist(
    viewer: MarketingViewer,
    taskId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    ensureMarketingTaskRole(viewer);
    const task = await this.findVisibleTask(this.prisma, viewer, taskId);
    this.ensureCanEditTask(viewer, task);
    const item = await this.prisma.marketingTaskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!item)
      throw new NotFoundException({
        code: 'CHECKLIST_NOT_FOUND',
        message: 'Checklist tidak ditemukan.',
      });
    await this.prisma.$transaction(async (db) => {
      await this.optimisticUpdate(db.marketingTask, taskId, dto.version, {
        version: { increment: 1 },
      });
      await db.marketingTaskChecklistItem.update({
        where: { id: itemId },
        data: {
          done: dto.done,
          completedById: dto.done ? viewer.id : null,
          completedAt: dto.done ? new Date() : null,
        },
      });
      const done = await db.marketingTaskChecklistItem.count({
        where: { taskId, done: true },
      });
      const total = await db.marketingTaskChecklistItem.count({
        where: { taskId },
      });
      await db.marketingTask.update({
        where: { id: taskId },
        data: { checklistDone: done, checklistTotal: total },
      });
    });
    return this.getTask(viewer, taskId);
  }

  async listProjects(viewer: MarketingViewer, query: PaginationQueryDto) {
    ensureMarketingTaskRole(viewer);
    const page = query.page ?? 1,
      limit = query.limit ?? 50;
    const where = query.q?.trim()
      ? {
          OR: [
            {
              name: { contains: query.q.trim(), mode: 'insensitive' as const },
            },
            {
              projectCode: {
                contains: query.q.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.marketingProject.findMany({
        where,
        include: {
          brand: true,
          owner: { select: USER_PUBLIC_SELECT },
          _count: { select: { tasks: true } },
        },
        orderBy: [{ deadline: 'asc' }, { projectCode: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketingProject.count({ where }),
    ]);
    return this.page(
      data.map((row) => ({ ...row, status: row.canonicalStatus })),
      page,
      limit,
      total,
    );
  }

  async createProject(
    viewer: MarketingViewer,
    dto: CreateCanonicalProjectDto,
    key?: string,
  ) {
    this.ensureManager(viewer);
    return this.runIdempotent(
      'POST:/marketing/projects',
      key,
      viewer,
      dto,
      async (db) => {
        if (dto.startDate && dto.deadline)
          this.assertDateOrder(dto.startDate, dto.deadline);
        if (dto.brandId) await this.ensureActiveBrand(db, dto.brandId);
        if (dto.ownerId)
          await this.ensureActiveUser(db, dto.ownerId, 'ownerId');
        const row = await db.marketingProject.create({
          data: {
            projectCode: this.code('MKT-PROJ'),
            name: dto.name.trim(),
            channel: dto.channel.trim(),
            category: dto.category.trim(),
            ownerId: dto.ownerId ?? viewer.id,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            summary: dto.summary?.trim() || null,
            canonicalStatus: 'PLANNED',
            status: 'Planned',
            version: 1,
            brandId: dto.brandId ?? null,
          },
          include: {
            brand: true,
            owner: { select: USER_PUBLIC_SELECT },
            _count: { select: { tasks: true } },
          },
        });
        return { ...row, status: row.canonicalStatus };
      },
    );
  }

  async updateProject(
    viewer: MarketingViewer,
    id: string,
    dto: UpdateCanonicalProjectDto,
  ) {
    this.ensureManager(viewer);
    const current = await this.prisma.marketingProject.findUnique({
      where: { id },
    });
    if (!current)
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project tidak ditemukan.',
      });
    if (dto.startDate || dto.deadline)
      this.assertDateOrder(
        dto.startDate ?? current.startDate?.toISOString(),
        dto.deadline ?? current.deadline?.toISOString(),
      );
    if (dto.brandId) await this.ensureActiveBrand(this.prisma, dto.brandId);
    if (dto.ownerId)
      await this.ensureActiveUser(this.prisma, dto.ownerId, 'ownerId');
    const data: any = { version: { increment: 1 } };
    for (const field of [
      'name',
      'brandId',
      'ownerId',
      'progress',
      'summary',
      'blockers',
    ] as const)
      if (dto[field] !== undefined) data[field] = dto[field];
    if (dto.status) {
      data.canonicalStatus = dto.status;
      data.status = dto.status;
    }
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.deadline) data.deadline = new Date(dto.deadline);
    await this.optimisticUpdate(
      this.prisma.marketingProject,
      id,
      dto.version,
      data,
    );
    return this.prisma.marketingProject.findUnique({
      where: { id },
      include: {
        brand: true,
        owner: { select: USER_PUBLIC_SELECT },
        _count: { select: { tasks: true } },
      },
    });
  }

  async listBrands(viewer: MarketingViewer, includeInactive = false) {
    this.ensureMarketingRead(viewer);
    return this.prisma.marketingBrand.findMany({
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
  }

  async createBrand(
    viewer: MarketingViewer,
    dto: CreateBrandDto,
    key?: string,
  ) {
    this.ensureManager(viewer);
    return this.runIdempotent(
      'POST:/marketing/brands',
      key,
      viewer,
      dto,
      (db) =>
        db.marketingBrand.create({
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
        }),
    );
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
    } catch (error) {
      this.rethrowNotFound(error, 'BRAND_NOT_FOUND', 'Brand tidak ditemukan.');
    }
  }

  async getReporting(viewer: MarketingViewer, query: ReportingQueryDto) {
    this.ensureMarketingRead(viewer);
    const page = query.page ?? 1,
      limit = query.limit ?? 50;
    const where: any = {};
    if (query.brandId) where.brandId = query.brandId;
    if (query.periodStart || query.periodEnd)
      where.AND = [
        query.periodStart
          ? { periodEnd: { gte: new Date(query.periodStart) } }
          : {},
        query.periodEnd
          ? { periodStart: { lte: new Date(query.periodEnd) } }
          : {},
      ];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marketingReportingPeriod.findMany({
        where,
        include: {
          brand: true,
          channelMetrics: {
            where: query.channel ? { channel: query.channel } : {},
            orderBy: { channel: 'asc' },
          },
          weeklyReports: { orderBy: { weekNumber: 'asc' } },
          funnels: { where: query.channel ? { channel: query.channel } : {} },
        },
        orderBy: { periodEnd: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketingReportingPeriod.count({ where }),
    ]);
    return this.page(
      rows.map((row) => this.reportingResponse(row)),
      page,
      limit,
      total,
    );
  }

  async upsertChannelMetric(
    viewer: MarketingViewer,
    dto: UpsertChannelMetricDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    return this.runIdempotent(
      'POST:/marketing/social/reports/channel-metrics',
      key,
      viewer,
      dto,
      async (db) => {
        await this.ensureActiveBrand(db, dto.brandId);
        const period = await db.marketingReportingPeriod.upsert({
          where: {
            brandId_periodStart_periodEnd: {
              brandId: dto.brandId,
              periodStart: new Date(dto.periodStart),
              periodEnd: new Date(dto.periodEnd),
            },
          },
          create: {
            brandId: dto.brandId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            createdById: viewer.id,
          },
          update: {},
        });
        const gained = Math.max(0, dto.followersEnd - dto.followersStart);
        const lost = Math.max(0, dto.followersStart - dto.followersEnd);
        const metricData = {
          channel: dto.channel,
          source: dto.source,
          followersStart: dto.followersStart,
          followersEnd: dto.followersEnd,
          followersGained: gained,
          followersLost: lost,
          reach: dto.reach,
          views: dto.views,
          impressions: dto.impressions,
          likes: dto.likes,
          comments: dto.comments,
          shares: dto.shares,
          saves: dto.saves,
          clicks: dto.clicks,
          leads: dto.leads,
          sampleRequests: dto.sampleRequests,
          deals: dto.deals,
          spend: dto.spend,
          revenue: dto.revenue,
          enteredById: viewer.id,
        };
        const metric = await db.brandChannelMetric.upsert({
          where: {
            periodId_channel_source: {
              periodId: period.id,
              channel: dto.channel,
              source: dto.source,
            },
          },
          create: { ...metricData, periodId: period.id },
          update: { ...metricData, verifiedById: null, verifiedAt: null },
        });
        return this.jsonSafe(metric);
      },
    );
  }

  async listIntegrations(viewer: MarketingViewer, brandId?: string) {
    this.ensureMarketingRead(viewer);
    return this.prisma.marketingIntegrationConnection.findMany({
      where: brandId ? { brandId } : {},
      select: {
        id: true,
        brandId: true,
        provider: true,
        status: true,
        config: true,
        scopes: true,
        tokenExpiresAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        brand: { select: { code: true, name: true } },
        syncJobs: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            importedCount: true,
            skippedCount: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: [{ brandId: 'asc' }, { provider: 'asc' }],
    });
  }

  async configureIntegration(
    viewer: MarketingViewer,
    dto: ConfigureIntegrationDto,
    key?: string,
  ) {
    this.ensureManager(viewer);
    return this.runIdempotent(
      'POST:/marketing/social/integrations',
      key,
      viewer,
      dto,
      async (db) => {
        await this.ensureActiveBrand(db, dto.brandId);
        const encrypted = dto.secret ? this.encryptSecret(dto.secret) : {};
        const connection = await db.marketingIntegrationConnection.upsert({
          where: {
            brandId_provider: { brandId: dto.brandId, provider: dto.provider },
          },
          create: {
            brandId: dto.brandId,
            provider: dto.provider,
            status: dto.secret ? 'CONNECTED' : 'DISCONNECTED',
            config: (dto.config ?? {}) as any,
            scopes: dto.scopes ?? [],
            ...encrypted,
          },
          update: {
            config: dto.config as any,
            scopes: dto.scopes,
            ...(dto.secret ? { status: 'CONNECTED', ...encrypted } : {}),
          },
          select: {
            id: true,
            brandId: true,
            provider: true,
            status: true,
            config: true,
            scopes: true,
            tokenExpiresAt: true,
            lastSyncAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return connection;
      },
    );
  }

  async triggerIntegrationSync(
    viewer: MarketingViewer,
    dto: TriggerIntegrationSyncDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    return this.runIdempotent(
      'POST:/marketing/social/integrations/sync',
      key,
      viewer,
      dto,
      async (db) => {
        const connection = await db.marketingIntegrationConnection.findUnique({
          where: { id: dto.connectionId },
          select: { id: true, brandId: true, provider: true, status: true },
        });
        if (!connection)
          throw new NotFoundException({
            code: 'INTEGRATION_NOT_FOUND',
            message: 'Koneksi integrasi tidak ditemukan.',
          });
        if (connection.status !== 'CONNECTED')
          throw new ConflictException({
            code: 'INTEGRATION_NOT_CONNECTED',
            message: 'Koneksi belum aktif.',
          });
        return db.marketingIntegrationSyncJob.create({
          data: {
            connectionId: connection.id,
            brandId: connection.brandId,
            provider: connection.provider,
            triggeredById: viewer.id,
          },
          select: {
            id: true,
            connectionId: true,
            brandId: true,
            provider: true,
            status: true,
            createdAt: true,
          },
        });
      },
    );
  }

  private async findVisibleTask(
    db: DbClient,
    viewer: MarketingViewer,
    id: string,
  ) {
    const scope = isMarketingManager(viewer)
      ? {}
      : {
          OR: [
            { ownerId: viewer.id },
            { assigneeId: viewer.id },
            { picId: viewer.id },
            { assignedById: viewer.id },
          ],
        };
    const task = await db.marketingTask.findFirst({
      where: { id, ...scope },
      include: TASK_INCLUDE,
    });
    if (!task)
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task tidak ditemukan.',
      });
    return task;
  }

  private ensureCanEditTask(viewer: MarketingViewer, task: any) {
    if (isMarketingManager(viewer)) return;
    if (![task.ownerId, task.assigneeId, task.picId].includes(viewer.id))
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task tidak ditemukan.',
      });
  }

  private ensureManager(viewer: MarketingViewer) {
    ensureMarketingTaskRole(viewer);
    if (!isMarketingManager(viewer))
      throw new ForbiddenException({
        code: 'MARKETING_MANAGER_REQUIRED',
        message: 'Aksi ini memerlukan manager Marketing.',
      });
  }

  private ensureSocialWriter(viewer: MarketingViewer) {
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

  private ensureMarketingRead(viewer: MarketingViewer) {
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

  private async ensureActiveUser(db: DbClient, id: string, field: string) {
    const found = await db.user.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!found)
      throw new BadRequestException({
        code: 'USER_INVALID',
        message: `${field} tidak merujuk user aktif.`,
        fieldErrors: { [field]: 'invalid' },
      });
  }

  private async ensureProject(db: DbClient, id: string) {
    if (
      !(await db.marketingProject.findUnique({
        where: { id },
        select: { id: true },
      }))
    )
      throw new BadRequestException({
        code: 'PROJECT_INVALID',
        message: 'projectId tidak valid.',
        fieldErrors: { projectId: 'invalid' },
      });
  }

  private async ensureActiveBrand(db: DbClient, id: string) {
    const brand = await db.marketingBrand.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true },
    });
    if (!brand)
      throw new BadRequestException({
        code: 'BRAND_INVALID',
        message: 'brandId tidak merujuk brand aktif.',
        fieldErrors: { brandId: 'invalid' },
      });
    return brand;
  }

  private assertDateOrder(start?: string, end?: string) {
    if (!start || !end || new Date(end).getTime() < new Date(start).getTime())
      throw new BadRequestException({
        code: 'DATE_RANGE_INVALID',
        message: 'Tanggal akhir harus sama atau setelah tanggal mulai.',
        fieldErrors: { dueDate: 'before_start' },
      });
  }

  private async optimisticUpdate(
    model: any,
    id: string,
    version: number,
    data: any,
  ) {
    const result = await model.updateMany({ where: { id, version }, data });
    if (result.count !== 1)
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Data telah berubah. Muat ulang sebelum menyimpan kembali.',
      });
  }

  async runIdempotent<T>(
    scope: string,
    key: string | undefined,
    viewer: MarketingViewer,
    payload: unknown,
    work: (db: DbClient) => Promise<T>,
  ): Promise<T> {
    if (!key) return work(this.prisma);
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(key))
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_INVALID',
        message: 'Idempotency-Key harus 8-160 karakter aman.',
      });
    const requestHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    const effectiveScope = `${scope}:${viewer.id}`;
    return this.prisma.$transaction(async (db) => {
      if (typeof db.$queryRawUnsafe === 'function') {
        await db.$queryRawUnsafe(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          `${effectiveScope}:${key}`,
        );
      }
      const existing = await db.marketingIdempotencyKey.findUnique({
        where: { scope_key: { scope: effectiveScope, key } },
      });
      if (existing && existing.expiresAt > new Date()) {
        if (existing.requestHash !== requestHash)
          throw new ConflictException({
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency-Key telah digunakan untuk payload berbeda.',
          });
        return existing.responseBody as T;
      }
      if (existing)
        await db.marketingIdempotencyKey.delete({ where: { id: existing.id } });
      const result = await work(db as any);
      await db.marketingIdempotencyKey.create({
        data: {
          scope: effectiveScope,
          key,
          requestHash,
          actorId: viewer.id,
          responseBody: this.jsonSafe(result) as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return result;
    });
  }

  private encryptSecret(secret: string) {
    const configured = process.env.MARKETING_INTEGRATION_KEY;
    if (!configured)
      throw new ServiceUnavailableException({
        code: 'INTEGRATION_KEY_MISSING',
        message: 'Kunci enkripsi integrasi belum dikonfigurasi.',
      });
    const key = /^[a-f0-9]{64}$/i.test(configured)
      ? Buffer.from(configured, 'hex')
      : Buffer.from(configured, 'base64');
    if (key.length !== 32)
      throw new ServiceUnavailableException({
        code: 'INTEGRATION_KEY_INVALID',
        message: 'Kunci enkripsi integrasi tidak valid.',
      });
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    return {
      secretCiphertext: encrypted.toString('base64'),
      secretIv: iv.toString('base64'),
      secretTag: cipher.getAuthTag().toString('base64'),
      keyVersion: 1,
    };
  }

  private taskResponse(task: any) {
    const required =
      task.checklist?.filter((item: any) => item.isRequired) ?? [];
    return {
      id: task.id,
      taskCode: task.taskCode,
      type: task.taskType,
      title: task.title,
      projectId: task.projectId,
      project: task.project,
      brandId: task.brandId,
      brand: task.brandRef,
      channel: task.channel,
      category: task.category,
      ownerId: task.ownerId,
      assigneeId: task.assigneeId,
      assignee: task.pic,
      reviewerId: task.reviewerId,
      reviewer: task.reviewer,
      priority: task.priority,
      status: task.canonicalStatus,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      brief: task.brief,
      outputUrl: task.outputUrl,
      referenceUrl: task.referenceUrl,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
      version: task.version,
      checklist: task.checklist ?? [],
      checklistDone: required.filter((item: any) => item.done).length,
      checklistTotal: required.length,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private reportingResponse(row: any) {
    const metrics = row.channelMetrics.map((metric: any) => {
      const spend = Number(metric.spend),
        revenue = Number(metric.revenue),
        leads = Number(metric.leads),
        reach = Number(metric.reach);
      const engagement =
        Number(metric.likes) +
        Number(metric.comments) +
        Number(metric.shares) +
        Number(metric.saves);
      return {
        ...this.jsonSafe(metric),
        netGrowth: metric.followersEnd - metric.followersStart,
        engagementRate:
          reach > 0 ? Number(((engagement / reach) * 100).toFixed(2)) : null,
        cpl: leads > 0 ? Number((spend / leads).toFixed(2)) : null,
        roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : null,
      };
    });
    return this.jsonSafe({ ...row, channelMetrics: metrics });
  }

  private taskSort(sort?: string): any[] {
    const [field, direction] = (sort ?? 'dueDate:asc').split(':');
    const allowed: Record<string, string> = {
      dueDate: 'dueDate',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      priority: 'priority',
      status: 'canonicalStatus',
      title: 'title',
    };
    return [
      { [allowed[field] ?? 'dueDate']: direction === 'desc' ? 'desc' : 'asc' },
      { taskCode: 'asc' },
    ];
  }

  private page<T>(data: T[], page: number, limit: number, total: number) {
    return { data, page, limit, total, hasMore: page * limit < total };
  }
  private code(prefix: string) {
    return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
  private legacyTaskStatus(status: TaskStatus) {
    return (
      {
        NOT_STARTED: 'OPEN',
        IN_PROGRESS: 'IN_PROGRESS',
        IN_REVIEW: 'REVIEW',
        REVISION: 'REVISION',
        DONE: 'DONE',
        CANCELLED: 'CANCELLED',
      } as const
    )[status];
  }
  private jsonSafe<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value, (_key, current) =>
        typeof current === 'bigint' ? current.toString() : current,
      ),
    );
  }
  private rethrowNotFound(
    error: unknown,
    code: string,
    message: string,
  ): never {
    if ((error as { code?: string }).code === 'P2025')
      throw new NotFoundException({ code, message });
    throw error;
  }
}
