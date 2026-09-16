import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
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
  CreateChecklistItemDto,
  CreateTaskCommentDto,
  PaginationQueryDto,
  ReportingQueryDto,
  TaskListQueryDto,
  TriggerIntegrationSyncDto,
  UpdateBrandDto,
  UpdateCanonicalProjectDto,
  UpdateCanonicalTaskDto,
  UpdateChecklistItemDto,
  UpdateMarketingMemberDto,
  UpdateTaskStatusDto,
  UpsertChannelMetricDto,
  UpsertStoryMetricDto,
  UpsertWeeklyReportDto,
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
export class CanonicalMarketingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const brandCount = await this.prisma.marketingBrand.count();
      if (brandCount === 0) {
        await this.autoSeedMarketingBrands(this.prisma);
      }
      const memberCount = await this.prisma.marketingTeamMember.count();
      if (memberCount === 0) {
        await this.autoSeedMarketingMembers(this.prisma);
      }
      const taskCount = await this.prisma.marketingTask.count();
      if (taskCount === 0) {
        await this.autoSeedMarketingTasks(this.prisma);
      }
    } catch (e: any) {
      // Non-blocking in case of deferred DB availability on cold start
      console.warn('Marketing master data self-heal deferred:', e?.message);
    }
  }

  async listTasks(viewer: MarketingViewer, query: TaskListQueryDto) {
    ensureMarketingTaskRole(viewer);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: any = this.taskScope(viewer);
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

    if (
      total === 0 &&
      !query.q &&
      !query.status &&
      !query.assigneeId &&
      !query.projectId &&
      !query.brandId
    ) {
      const globalCount = await this.prisma.marketingTask.count();
      if (globalCount === 0) {
        await this.autoSeedMarketingTasks(this.prisma);
        const [seededRows, seededTotal] = await this.prisma.$transaction([
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
          seededRows.map((row) => this.taskResponse(row)),
          page,
          limit,
          seededTotal,
        );
      }
    }

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

  async getKpi(viewer: MarketingViewer) {
    ensureMarketingTaskRole(viewer);
    const scope = this.taskScope(viewer);
    const now = new Date();
    const where: any = { ...scope };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marketingTask.findMany({
        where,
        select: {
          id: true,
          canonicalStatus: true,
          dueDate: true,
          assigneeId: true,
          pic: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.marketingTask.count({ where }),
    ]);
    const statusCounts = {
      notStarted: 0,
      inProgress: 0,
      inReview: 0,
      revision: 0,
      done: 0,
      cancelled: 0,
    };
    let overdue = 0;
    const byMember = new Map<
      string,
      { id: string; fullName: string; email: string; count: number }
    >();
    for (const row of rows) {
      const status = row.canonicalStatus as TaskStatus;
      if (status === 'NOT_STARTED') statusCounts.notStarted++;
      else if (status === 'IN_PROGRESS') statusCounts.inProgress++;
      else if (status === 'IN_REVIEW') statusCounts.inReview++;
      else if (status === 'REVISION') statusCounts.revision++;
      else if (status === 'DONE') statusCounts.done++;
      else if (status === 'CANCELLED') statusCounts.cancelled++;
      if (
        row.dueDate &&
        row.dueDate < now &&
        status !== 'DONE' &&
        status !== 'CANCELLED'
      ) {
        overdue++;
      }
      const assigneeId = row.assigneeId ?? 'unassigned';
      const existing = byMember.get(assigneeId);
      const memberMeta = row.pic ?? {
        id: assigneeId,
        fullName: 'Unassigned',
        email: null,
      };
      if (existing) existing.count++;
      else
        byMember.set(assigneeId, {
          id: memberMeta.id,
          fullName: memberMeta.fullName ?? 'Unassigned',
          email: memberMeta.email ?? '',
          count: 1,
        });
    }
    return {
      total,
      ...statusCounts,
      overdue,
      byMember: Array.from(byMember.values()).sort((a, b) => b.count - a.count),
      scope: isMarketingManager(viewer) ? 'team' : 'personal',
      generatedAt: now.toISOString(),
    };
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
        const assigneeUser = await this.ensureActiveUser(db, dto.assigneeId, 'assigneeId', viewer.id);
        const isSelf =
          assigneeUser.id === viewer.id ||
          (Boolean(assigneeUser.email) &&
            Boolean(viewer.email) &&
            assigneeUser.email?.split('@')[0].toLowerCase() ===
              viewer.email?.split('@')[0].toLowerCase());
        if (!isMarketingManager(viewer) && !isSelf) {
          throw new ForbiddenException({
            code: 'TASK_ASSIGN_FORBIDDEN',
            message: 'Member hanya dapat membuat task untuk dirinya sendiri.',
          });
        }
        let reviewerUser: { id: string } | null = null;
        if (dto.reviewerId)
          reviewerUser = await this.ensureActiveUser(db, dto.reviewerId, 'reviewerId');
        const brand = dto.brandId
          ? await this.ensureActiveBrand(db, dto.brandId)
          : null;

        let effectiveProjectId = dto.projectId ?? null;
        if (effectiveProjectId) {
          await this.ensureProject(db, effectiveProjectId);
        } else if (dto.type === 'PROJECT') {
          const defaultProjectCode = `PRJ-${brand?.name ? brand.name.toUpperCase().slice(0, 4) : 'MKT'}-GENERAL`;
          const existingPrj = await db.marketingProject.findFirst({
            where: { projectCode: defaultProjectCode },
          });
          if (existingPrj) {
            effectiveProjectId = existingPrj.id;
          } else {
            const createdPrj = await db.marketingProject.create({
              data: {
                projectCode: defaultProjectCode,
                name: `General Operations & Campaigns (${brand?.name ?? 'Marketing'})`,
                channel: dto.channel?.trim() || 'General',
                category: dto.category?.trim() || 'project_campaign',
                ownerId: viewer.id,
                brandId: brand?.id ?? null,
              },
            });
            effectiveProjectId = createdPrj.id;
          }
        }
        const task = await db.marketingTask.create({
          data: {
            taskCode: this.code('MKT'),
            ownerId: viewer.id,
            assigneeId: assigneeUser.id,
            picId: assigneeUser.id,
            reviewerId: reviewerUser ? reviewerUser.id : null,
            assignedById: viewer.id,
            title: dto.title.trim(),
            description: dto.brief?.trim() || null,
            status: 'OPEN',
            canonicalStatus: 'NOT_STARTED',
            taskType: dto.type.toUpperCase() === 'PROJECT' ? 'PROJECT' : 'DAILY',
            priority: dto.priority,
            startDate: new Date(dto.startDate),
            dueDate: new Date(dto.dueDate),
            channel: dto.channel.trim(),
            category: dto.category.trim(),
            brand: brand?.name ?? 'Dreamlab',
            brandId: brand?.id ?? null,
            projectId: effectiveProjectId,
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
    this.ensureMemberTaskUpdateAllowed(viewer, dto);
    if (dto.startDate || dto.dueDate) {
      this.assertDateOrder(
        dto.startDate ?? current.startDate?.toISOString(),
        dto.dueDate ?? current.dueDate?.toISOString(),
      );
    }
    const data: any = { version: { increment: 1 } };
    if (dto.assigneeId) {
      const user = await this.ensureActiveUser(this.prisma, dto.assigneeId, 'assigneeId');
      data.assigneeId = user.id;
      data.picId = user.id;
    }
    if (dto.reviewerId) {
      const user = await this.ensureActiveUser(this.prisma, dto.reviewerId, 'reviewerId');
      data.reviewerId = user.id;
    }
    if (dto.projectId) await this.ensureProject(this.prisma, dto.projectId);
    if (dto.brandId) {
      const brand = await this.ensureActiveBrand(this.prisma, dto.brandId);
      data.brandId = brand.id;
      data.brand = brand.name;
    }
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
    for (const field of ['projectId', 'reviewerId'] as const)
      if (dto[field] !== undefined) data[field] = dto[field];
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
      await this.optimisticUpdate(db.marketingTask, id, dto.version ?? current.version, {
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

  async deleteTask(viewer: MarketingViewer, id: string) {
    ensureMarketingTaskRole(viewer);
    const current = await this.findVisibleTask(this.prisma, viewer, id);
    if (!isMarketingManager(viewer) && current.ownerId !== viewer.id) {
      throw new ForbiddenException({
        code: 'TASK_DELETE_FORBIDDEN',
        message: 'Hanya pemilik atau manajer yang dapat menghapus task.',
      });
    }
    await this.prisma.marketingTask.delete({
      where: { id },
    });
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

  async listComments(viewer: MarketingViewer, taskId: string) {
    ensureMarketingTaskRole(viewer);
    await this.findVisibleTask(this.prisma, viewer, taskId);
    return this.prisma.marketingTaskComment.findMany({
      where: { taskId },
      include: {
        author: { select: USER_PUBLIC_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });
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
    const task = await this.findVisibleTask(this.prisma, viewer, taskId);
    this.ensureCanEditTask(viewer, task);
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

  async addChecklistItem(
    viewer: MarketingViewer,
    taskId: string,
    dto: CreateChecklistItemDto,
  ) {
    ensureMarketingTaskRole(viewer);
    const task = await this.findVisibleTask(this.prisma, viewer, taskId);
    this.ensureCanEditTask(viewer, task);
    await this.prisma.$transaction(async (db) => {
      await db.marketingTaskChecklistItem.create({
        data: {
          taskId,
          text: dto.text.trim(),
          isRequired: dto.isRequired ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      const required = await db.marketingTaskChecklistItem.count({
        where: { taskId, isRequired: true },
      });
      await db.marketingTask.update({
        where: { id: taskId },
        data: { checklistTotal: required },
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

  async listMembers(viewer?: MarketingViewer) {
    if (viewer) ensureMarketingTaskRole(viewer);
    // Filter to marketing team only (defense-in-depth: even if isActive=true was set on stale
    // admin/busdev rows from earlier seeds, we exclude them here). Marketing-relevant
    // departments are an allow-list; super-admin / admin role rows are excluded by name.
    let members = await this.prisma.marketingTeamMember.findMany({
      where: {
        isActive: true,
        department: { in: ['Digital Marketing', 'Digital Strategy', 'Social Media', 'Design & Visual', 'Production'] },
        NOT: { role: { contains: 'Admin' } },
      },
      orderBy: { name: 'asc' },
    });
    if (members.length === 0) {
      await this.autoSeedMarketingMembers(this.prisma);
      members = await this.prisma.marketingTeamMember.findMany({
        where: {
          isActive: true,
          department: { in: ['Digital Marketing', 'Digital Strategy', 'Social Media', 'Design & Visual', 'Production'] },
          NOT: { role: { contains: 'Admin' } },
        },
        orderBy: { name: 'asc' },
      });
    }
    return members.map((m) => ({
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
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.avatarBg ? { avatarBg: dto.avatarBg } : {}),
        ...(dto.initial ? { initial: dto.initial.trim() } : {}),
        ...(dto.department ? { department: dto.department.trim() } : {}),
      },
    });
    if (member.userId) {
      await this.prisma.user
        .update({
          where: { id: member.userId },
          data: {
            ...(dto.name ? { fullName: dto.name.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim() } : {}),
          },
        })
        .catch(() => {});
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
    return brands;
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
    if (query.brandId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.brandId);
      const brand = await this.prisma.marketingBrand.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: query.brandId }] : []),
            { name: { equals: query.brandId, mode: 'insensitive' } },
            { code: { equals: query.brandId, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      where.brandId = brand ? brand.id : (isUuid ? query.brandId : '00000000-0000-0000-0000-000000000000');
    }
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
          storyMetrics: { orderBy: { date: 'asc' } },
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
        const brand = await this.ensureActiveBrand(db, dto.brandId);
        const resolvedBrandId = brand.id;
        const period = await db.marketingReportingPeriod.upsert({
          where: {
            brandId_periodStart_periodEnd: {
              brandId: resolvedBrandId,
              periodStart: new Date(dto.periodStart),
              periodEnd: new Date(dto.periodEnd),
            },
          },
          create: {
            brandId: resolvedBrandId,
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

  async upsertWeeklyReport(
    viewer: MarketingViewer,
    dto: UpsertWeeklyReportDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    this.assertDateOrder(dto.weekStart, dto.weekEnd);
    return this.runIdempotent(
      'POST:/marketing/social/reports/weekly',
      key,
      viewer,
      dto,
      async (db) => {
        const brand = await this.ensureActiveBrand(db, dto.brandId);
        const resolvedBrandId = brand.id;
        const period = await db.marketingReportingPeriod.upsert({
          where: {
            brandId_periodStart_periodEnd: {
              brandId: resolvedBrandId,
              periodStart: new Date(dto.periodStart),
              periodEnd: new Date(dto.periodEnd),
            },
          },
          create: {
            brandId: resolvedBrandId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            createdById: viewer.id,
          },
          update: {},
        });
        const gained =
          dto.followersGained ??
          Math.max(0, dto.followersEnd - dto.followersStart);
        const lost =
          dto.followersLost ??
          Math.max(0, dto.followersStart - dto.followersEnd);
        const weeklyData = {
          weekStart: new Date(dto.weekStart),
          weekEnd: new Date(dto.weekEnd),
          followersStart: dto.followersStart,
          followersEnd: dto.followersEnd,
          followersGained: gained,
          followersLost: lost,
          reach: dto.reach,
          views: dto.views,
          impressions: dto.impressions,
          totalEngagement: dto.totalEngagement,
          storiesCount: dto.storiesCount,
          storyViews: dto.storyViews,
          highlights: dto.highlights?.trim() || null,
          notes: dto.notes?.trim() || null,
          enteredById: viewer.id,
        };
        const report = await db.weeklySocialReport.upsert({
          where: {
            periodId_weekNumber: {
              periodId: period.id,
              weekNumber: dto.weekNumber,
            },
          },
          create: {
            ...weeklyData,
            periodId: period.id,
            weekNumber: dto.weekNumber,
          },
          update: { ...weeklyData, verifiedById: null, verifiedAt: null },
        });
        return this.jsonSafe(report);
      },
    );
  }

  async upsertStoryMetric(
    viewer: MarketingViewer,
    dto: UpsertStoryMetricDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    return this.runIdempotent(
      'POST:/marketing/social/reports/stories',
      key,
      viewer,
      dto,
      async (db) => {
        const brand = await this.ensureActiveBrand(db, dto.brandId);
        const resolvedBrandId = brand.id;
        const period = await db.marketingReportingPeriod.upsert({
          where: {
            brandId_periodStart_periodEnd: {
              brandId: resolvedBrandId,
              periodStart: new Date(dto.periodStart),
              periodEnd: new Date(dto.periodEnd),
            },
          },
          create: {
            brandId: resolvedBrandId,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            createdById: viewer.id,
          },
          update: {},
        });
        const storyDate = new Date(dto.date);
        const storyData = {
          storiesCount: dto.storiesCount,
          views: dto.views,
          replies: dto.replies,
          linkClicks: dto.linkClicks,
          shares: dto.shares,
          completionPct:
            dto.completionPct !== undefined ? dto.completionPct : null,
          topic: dto.topic?.trim() || null,
          notes: dto.notes?.trim() || null,
          enteredById: viewer.id,
        };
        const story = await db.storyDailyMetric.upsert({
          where: {
            brandId_date: {
              brandId: resolvedBrandId,
              date: storyDate,
            },
          },
          create: {
            ...storyData,
            brandId: resolvedBrandId,
            periodId: period.id,
            date: storyDate,
          },
          update: {
            ...storyData,
            periodId: period.id,
            verifiedById: null,
            verifiedAt: null,
          },
        });
        return this.jsonSafe(story);
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
    const scope = this.taskScope(viewer);
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

  /** Members may update their delivery details, but cannot alter who owns,
   * reviews, schedules, prioritizes, or re-scopes a task. */
  private ensureMemberTaskUpdateAllowed(
    viewer: MarketingViewer,
    dto: UpdateCanonicalTaskDto,
  ) {
    if (isMarketingManager(viewer)) return;
    const restricted = [
      'projectId',
      'brandId',
      'assigneeId',
      'reviewerId',
      'priority',
      'startDate',
      'dueDate',
      'estimatedMinutes',
    ] as const;
    const attempted = restricted.find((field) => dto[field] !== undefined);
    if (attempted)
      throw new ForbiddenException({
        code: 'TASK_MEMBER_FIELD_FORBIDDEN',
        message: `Member tidak dapat mengubah ${attempted}.`,
        fieldErrors: { [attempted]: 'manager_required' },
      });
  }

  private taskScope(viewer: MarketingViewer) {
    if (isMarketingManager(viewer)) return {};
    return {
      OR: [
        { ownerId: viewer.id },
        { assigneeId: viewer.id },
        { picId: viewer.id },
        { assignedById: viewer.id },
        { reviewerId: viewer.id },
      ],
    };
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

  private async ensureActiveUser(
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
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    let brand = await db.marketingBrand.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id }] : []),
          { name: { equals: id, mode: 'insensitive' } },
          { code: { equals: id, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: { id: true, name: true },
    });
    if (!brand && typeof db?.marketingBrand?.upsert === 'function') {
      const lower = id.toLowerCase();
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
            notes:
              'B2B Cosmetic R&D & Maklon formulation laboratory. Tone: Professional, authoritative, sleek, innovative.',
            isActive: true,
          },
          select: { id: true, name: true },
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
            notes:
              'B2C Skincare & Beauty brand focusing on skin barrier and radiant glow. Tone: Friendly, vibrant, aesthetic, relatable.',
            isActive: true,
          },
          select: { id: true, name: true },
        });
      }
    }
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
      // Note: pg_advisory_xact_lock was previously invoked here for serialization,
      // but Prisma Driver Adapter (used since the Prisma 5.x upgrade) does not
      // support returning the void result of a SELECT query — the call surfaces as
      // "Failed to deserialize column of type 'void'" and aborts the request.
      // The DB-level unique constraint on (scope, key) below already prevents
      // duplicate writes, so the advisory lock is omitted by design.
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
      try {
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
      } catch (err: any) {
        // P2002 = unique constraint — concurrent request beat us to it; treat as replay.
        if (err?.code !== 'P2002') throw err;
        const winner = await db.marketingIdempotencyKey.findUnique({
          where: { scope_key: { scope: effectiveScope, key } },
        });
        if (winner && winner.requestHash === requestHash)
          return winner.responseBody as T;
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Idempotency-Key telah digunakan untuk payload berbeda.',
        });
      }
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
    return { data, items: data, page, limit, total, hasMore: page * limit < total };
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

  private async autoSeedMarketingBrands(db: DbClient) {
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
      await db.marketingBrand.upsert({
        where: { code: b.code },
        update: { isActive: true },
        create: b,
      });
    }
  }

  private async autoSeedMarketingMembers(db: DbClient) {
    if (
      typeof db?.marketingTeamMember?.upsert !== 'function' ||
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
      let user = await db.user.findFirst({
        where: {
          OR: [
            { email: { equals: m.email, mode: 'insensitive' } },
            { email: { equals: `${m.name.toLowerCase()}@nexerp.id`, mode: 'insensitive' } },
            { fullName: { equals: m.fullName, mode: 'insensitive' } },
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
      }
      await db.marketingTeamMember.upsert({
        where: { email: m.email },
        update: {
          name: m.name,
          role: m.role,
          department: m.department,
          phone: m.phone,
          avatarBg: m.avatarBg,
          initial: m.initial,
          userId: user.id,
          isActive: true,
        },
        create: {
          name: m.name,
          role: m.role,
          department: m.department,
          email: m.email,
          phone: m.phone,
          avatarBg: m.avatarBg,
          initial: m.initial,
          userId: user.id,
          isActive: true,
        },
      });
    }
  }

  private async autoSeedMarketingTasks(db: DbClient) {
    if (
      typeof db?.marketingTask?.upsert !== 'function' ||
      typeof db?.marketingBrand?.findFirst !== 'function' ||
      typeof db?.marketingTeamMember?.findMany !== 'function'
    )
      return;
    await this.autoSeedMarketingBrands(db);
    await this.autoSeedMarketingMembers(db);

    const members = await db.marketingTeamMember.findMany({
      where: { isActive: true },
      select: { name: true, userId: true },
    });
    const userMap: Record<string, string> = {};
    for (const m of members) {
      if (m.userId) userMap[m.name] = m.userId;
    }
    const defaultOwner = Object.values(userMap)[0];
    if (!defaultOwner) return;

    const brandDreamlab = await db.marketingBrand.findFirst({
      where: { code: 'dreamlab' },
      select: { id: true, name: true },
    });

    const defaultTasks = [
      {
        taskCode: 'TSK-G-001',
        title: 'Check Incoming Leads & Pitch Decks',
        assignee: 'Gusti',
        brand: 'Dreamlab',
        priority: 'HIGH',
        status: 'DONE',
        canonicalStatus: 'DONE',
        taskType: 'DAILY',
        brief: 'Review daily CRM inbox for B2B skincare formulation inquiries.',
        dueDate: new Date('2026-09-09'),
      },
      {
        taskCode: 'TSK-G-002',
        title: 'Update Daily Report & Campaign Metrics',
        assignee: 'Gusti',
        brand: 'Dreamlab',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        canonicalStatus: 'IN_PROGRESS',
        taskType: 'DAILY',
        brief: 'Update Meta Ads spend, CTR, CPL, and Organic Reach in dashboard.',
        dueDate: new Date('2026-09-09'),
      },
      {
        taskCode: 'TSK-R-001',
        title: 'Finalize Carousel Desain Edukasi Formulasi',
        assignee: 'Revita',
        brand: 'Dreamlab',
        priority: 'HIGH',
        status: 'DONE',
        canonicalStatus: 'DONE',
        taskType: 'DAILY',
        brief: 'Konten 7 slide anatomi skin barrier & bahan aktif niacinamide 5%.',
        dueDate: new Date('2026-09-09'),
      },
      {
        taskCode: 'TSK-R-002',
        title: 'Publish Instagram Stories Update Pabrik',
        assignee: 'Revita',
        brand: 'Dreamlab',
        priority: 'MEDIUM',
        status: 'DONE',
        canonicalStatus: 'DONE',
        taskType: 'DAILY',
        brief: 'Tiga sequence story BTS lab mixer steril di Cikarang.',
        dueDate: new Date('2026-09-09'),
      },
      {
        taskCode: 'TSK-Z-001',
        title: 'Desain Banner Promo Maklon Q4',
        assignee: 'Zarkasi',
        brand: 'Dreamlab',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        canonicalStatus: 'IN_PROGRESS',
        taskType: 'PROJECT',
        brief: 'Asset visual untuk landing page dan campaign display Google Ads.',
        dueDate: new Date('2026-09-15'),
      },
      {
        taskCode: 'TSK-RH-001',
        title: 'Editing Video Reels Lab Tour Cleanroom',
        assignee: 'Rahmat',
        brand: 'Dreamlab',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        canonicalStatus: 'IN_PROGRESS',
        taskType: 'PROJECT',
        brief: 'Reels 60 detik dengan grading klinis modern, sound trending.',
        dueDate: new Date('2026-09-12'),
      },
      {
        taskCode: 'TSK-A-001',
        title: 'Community Management & Reply Comments',
        assignee: 'Aurel',
        brand: 'Dreamlab',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        canonicalStatus: 'IN_PROGRESS',
        taskType: 'DAILY',
        brief: 'Balas komentar dan DM di Instagram & TikTok @dreamlab.workspace.',
        dueDate: new Date('2026-09-14'),
      },
    ];

    for (const t of defaultTasks) {
      const ownerId = userMap[t.assignee] || defaultOwner;
      await db.marketingTask.upsert({
        where: { taskCode: t.taskCode },
        update: {},
        create: {
          taskCode: t.taskCode,
          title: t.title,
          ownerId,
          assigneeId: ownerId,
          picId: ownerId,
          priority: t.priority as any,
          status: t.status as any,
          canonicalStatus: t.canonicalStatus as any,
          taskType: t.taskType as any,
          brief: t.brief,
          brand: t.brand,
          brandId: brandDreamlab?.id || null,
          dueDate: t.dueDate,
          channel: 'General',
          category: 'general_operations',
        },
      });
    }
  }
}
