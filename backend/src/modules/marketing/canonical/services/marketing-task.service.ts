import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import {
  CreateCanonicalTaskDto,
  UpdateCanonicalTaskDto,
  UpdateTaskStatusDto,
  TaskListQueryDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  CreateTaskCommentDto,
  CreateCanonicalProjectDto,
  UpdateCanonicalProjectDto,
  PaginationQueryDto,
  AttachmentMetadataDto,
} from '../canonical-marketing.dto';
import {
  MarketingViewer,
  TaskStatus,
  ensureMarketingTaskRole,
  isMarketingManager,
  isRahmatViewer,
  canAssignMarketingTask,
  assertTaskTransition,
} from '../marketing-domain.policy';
import { MarketingBrandService } from './marketing-brand.service';

type DbClient = PrismaService;

const USER_PUBLIC_SELECT = { id: true, fullName: true, email: true } as const;
const TASK_INCLUDE: any = {
  project: true,
  brandRef: true,
  pic: { select: USER_PUBLIC_SELECT },
  reviewer: { select: USER_PUBLIC_SELECT },
  checklist: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  comments: {
    include: { author: { select: USER_PUBLIC_SELECT } },
    orderBy: { createdAt: 'asc' },
  },
  attachments: { orderBy: { createdAt: 'asc' } },
  history: {
    include: { by: { select: USER_PUBLIC_SELECT } },
    orderBy: { createdAt: 'desc' },
  },
};

@Injectable()
export class MarketingTaskService {
  private readonly logger = new Logger(MarketingTaskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: MarketingBrandService,
  ) {}

  jsonSafe<T>(val: T): T {
    return JSON.parse(
      JSON.stringify(val, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    );
  }

  taskScope(viewer: MarketingViewer) {
    if (isMarketingManager(viewer)) return {};

    if (isRahmatViewer(viewer)) {
      return {
        OR: [
          { ownerId: viewer.id },
          { assigneeId: viewer.id },
          { picId: viewer.id },
          { assignedById: viewer.id },
          { reviewerId: viewer.id },
          {
            pic: {
              OR: [
                { email: { contains: 'zarkasi', mode: 'insensitive' } },
                { fullName: { contains: 'zarkasi', mode: 'insensitive' } },
                { email: { contains: 'gusti', mode: 'insensitive' } },
                { fullName: { contains: 'gusti', mode: 'insensitive' } },
              ],
            },
          },
        ],
      };
    }

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

  async findVisibleTask(db: DbClient, viewer: MarketingViewer, id: string) {
    ensureMarketingTaskRole(viewer);
    const scope = this.taskScope(viewer);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const where: any = {
      ...scope,
      OR: [
        ...(isUuid ? [{ id }] : []),
        { taskCode: { equals: id, mode: 'insensitive' } },
      ],
    };
    if (scope.OR) {
      where.AND = [{ OR: scope.OR }, { OR: where.OR }];
      delete where.OR;
    }
    const task = await db.marketingTask.findFirst({
      where,
      include: TASK_INCLUDE,
    });
    if (!task)
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task tidak ditemukan atau Anda tidak memiliki akses.',
      });
    return task;
  }

  private ensureCanEditTask(viewer: MarketingViewer, task: any) {
    if (isMarketingManager(viewer)) return;
    if (isRahmatViewer(viewer)) {
      const allowedOwnerOrAssignee = [
        task.ownerId,
        task.assigneeId,
        task.picId,
      ];
      const picEmail = (task.pic?.email || '').toLowerCase();
      const picName = (task.pic?.fullName || '').toLowerCase();
      const isTarget =
        allowedOwnerOrAssignee.includes(viewer.id) ||
        picEmail.includes('zarkasi') ||
        picName.includes('zarkasi') ||
        picEmail.includes('gusti') ||
        picName.includes('gusti');
      if (isTarget) return;
    }
    if (![task.ownerId, task.assigneeId, task.picId].includes(viewer.id))
      throw new ForbiddenException({
        code: 'TASK_EDIT_FORBIDDEN',
        message: 'Hanya pemilik, PIC, atau manajer yang dapat mengubah task.',
      });
  }

  private legacyTaskStatus(canonical: string) {
    switch (canonical) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'IN_REVIEW':
        return 'In Review';
      case 'REVISION':
        return 'Revision';
      case 'DONE':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return canonical;
    }
  }

  private taskSort(sort?: string): any {
    switch (sort) {
      case 'due_asc':
        return [{ dueDate: 'asc' }, { createdAt: 'desc' }];
      case 'due_desc':
        return [{ dueDate: 'desc' }, { createdAt: 'desc' }];
      case 'created_asc':
        return { createdAt: 'asc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  private page<T>(items: T[], page: number, limit: number, total: number) {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private code(prefix: string) {
    const d = new Date();
    const y = d.getFullYear().toString().slice(2);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${y}${m}-${rand}`;
  }

  private assertDateOrder(start?: string, end?: string) {
    if (!start || !end || new Date(end).getTime() < new Date(start).getTime())
      throw new BadRequestException({
        code: 'DATE_RANGE_INVALID',
        message: 'Tanggal akhir harus sama atau setelah tanggal mulai.',
        fieldErrors: { dueDate: 'before_start' },
      });
  }

  private async ensureProject(db: DbClient, projectId: string) {
    const prj = await db.marketingProject.findUnique({
      where: { id: projectId },
    });
    if (!prj)
      throw new BadRequestException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project tidak ditemukan.',
      });
    return prj;
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

  private taskResponse(task: any) {
    const required =
      task.checklist?.filter((item: any) => item.isRequired) ?? [];
    return {
      id: task.id,
      taskCode: task.taskCode,
      type: task.taskType,
      title: task.title,
      brief: task.brief,
      outputUrl: task.outputUrl,
      referenceUrl: task.referenceUrl,
      channel: task.channel,
      category: task.category,
      priority: task.priority,
      status: task.canonicalStatus,
      startDate: task.startDate?.toISOString() ?? null,
      dueDate: task.dueDate?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      version: task.version,
      projectId: task.projectId,
      project: task.project
        ? {
            id: task.project.id,
            projectCode: task.project.projectCode,
            name: task.project.name,
            status: task.project.canonicalStatus,
          }
        : null,
      brandId: task.brandId,
      brand: task.brandRef
        ? {
            id: task.brandRef.id,
            code: task.brandRef.code,
            name: task.brandRef.name,
            primaryPlatform: task.brandRef.primaryPlatform,
          }
        : null,
      ownerId: task.ownerId,
      assigneeId: task.assigneeId,
      reviewerId: task.reviewerId,
      pic: task.pic,
      reviewer: task.reviewer,
      checklistDone: task.checklist?.filter((i: any) => i.done).length ?? 0,
      checklistTotal: required.length,
      checklist: (task.checklist ?? []).map((item: any) => ({
        id: item.id,
        text: item.text,
        isRequired: item.isRequired,
        done: item.done,
        sortOrder: item.sortOrder,
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
      comments: (task.comments ?? []).map((c: any) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
      })),
      attachments: (task.attachments ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        sizeKb: a.sizeKb,
        path: a.path,
        createdAt: a.createdAt.toISOString(),
      })),
      history: (task.history ?? []).map((h: any) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
        by: h.by,
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
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
          seededRows.map((row: any) => this.taskResponse(row)),
          page,
          limit,
          seededTotal,
        );
      }
    }

    return this.page(
      rows.map((row: any) => this.taskResponse(row)),
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
        const assigneeUser = await this.brandService.ensureActiveUser(
          db,
          dto.assigneeId,
          'assigneeId',
          viewer.id,
        );
        if (!canAssignMarketingTask(viewer, assigneeUser)) {
          throw new ForbiddenException({
            code: 'TASK_ASSIGN_FORBIDDEN',
            message:
              'Anda tidak memiliki hak akses untuk menugaskan task ke member ini.',
          });
        }
        let reviewerUser: { id: string } | null = null;
        if (dto.reviewerId)
          reviewerUser = await this.brandService.ensureActiveUser(
            db,
            dto.reviewerId,
            'reviewerId',
          );
        const brand = dto.brandId
          ? await this.brandService.ensureActiveBrand(db, dto.brandId)
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
            projectId: effectiveProjectId,
            brandId: brand ? brand.id : null,
            title: dto.title.trim(),
            brief: dto.brief?.trim() || null,
            category: dto.category.trim(),
            channel: dto.channel.trim(),
            taskType: dto.type,
            priority: dto.priority,
            status: 'Not Started',
            canonicalStatus: 'NOT_STARTED',
            startDate: new Date(dto.startDate),
            dueDate: new Date(dto.dueDate),
            estimatedMinutes: dto.estimatedMinutes,
            estimatedHours: Math.ceil(dto.estimatedMinutes / 60),
            outputUrl: dto.outputUrl ?? null,
            referenceUrl: dto.referenceUrl ?? null,
            version: 1,
            checklistTotal:
              dto.checklist?.filter((c) => c.isRequired ?? true).length ?? 0,
            checklist: dto.checklist?.length
              ? {
                  create: dto.checklist.map((item, idx) => ({
                    text: item.text.trim(),
                    isRequired: item.isRequired ?? true,
                    sortOrder: item.sortOrder ?? idx,
                  })),
                }
              : undefined,
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
    const data: any = { version: { increment: 1 } };
    for (const field of [
      'title',
      'channel',
      'category',
      'priority',
      'brief',
      'outputUrl',
      'referenceUrl',
    ] as const)
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
      await this.optimisticUpdate(
        db.marketingTask,
        id,
        dto.version ?? current.version,
        {
          canonicalStatus: dto.status,
          status: this.legacyTaskStatus(dto.status),
          completedAt:
            dto.status === 'DONE'
              ? new Date()
              : dto.status === 'IN_PROGRESS' &&
                  current.canonicalStatus === 'DONE'
                ? null
                : current.completedAt,
          version: { increment: 1 },
        },
      );
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
    this.brandService.ensureManager(viewer);
    return this.runIdempotent(
      'POST:/marketing/projects',
      key,
      viewer,
      dto,
      async (db) => {
        if (dto.startDate && dto.deadline)
          this.assertDateOrder(dto.startDate, dto.deadline);
        if (dto.brandId) await this.brandService.ensureActiveBrand(db, dto.brandId);
        if (dto.ownerId)
          await this.brandService.ensureActiveUser(db, dto.ownerId, 'ownerId');
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
    this.brandService.ensureManager(viewer);
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
    if (dto.brandId) await this.brandService.ensureActiveBrand(this.prisma, dto.brandId);
    if (dto.ownerId)
      await this.brandService.ensureActiveUser(this.prisma, dto.ownerId, 'ownerId');
    const data: any = { version: { increment: 1 } };
    for (const field of [
      'name',
      'status',
      'brandId',
      'ownerId',
      'progress',
      'summary',
      'blockers',
    ] as const)
      if (dto[field] !== undefined) data[field] = dto[field];
    if (dto.status) data.canonicalStatus = dto.status;
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

  async autoSeedMarketingTasks(db: DbClient) {
    if (
      typeof db?.marketingTask?.upsert !== 'function' ||
      typeof db?.marketingBrand?.findFirst !== 'function' ||
      typeof db?.marketingTeamMember?.findMany !== 'function'
    )
      return;
    await this.brandService.autoSeedMarketingBrands(db);
    await this.brandService.autoSeedMarketingMembers(db);

    const members = await db.marketingTeamMember.findMany({
      where: { isActive: true },
      select: { name: true, userId: true },
    });
    const userMap: Record<string, string> = {};
    for (const m of members) {
      if (m.userId) userMap[m.name] = m.userId;
    }
    let defaultOwner = Object.values(userMap)[0];
    if (!defaultOwner) {
      const marketingUser = await db.user.findFirst({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          roles: { hasSome: ['MARKETING', 'DIGIMAR', 'HEAD_OPS'] },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (marketingUser) {
        defaultOwner = marketingUser.id;
      } else {
        const anyUser = await db.user.findFirst({
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        });
        if (anyUser) defaultOwner = anyUser.id;
      }
    }
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
        brief:
          'Update Meta Ads spend, CTR, CPL, and Organic Reach in dashboard.',
        dueDate: new Date('2026-09-10'),
      },
    ];

    for (const t of defaultTasks) {
      const ownerId = userMap[t.assignee] || defaultOwner;
      try {
        await db.marketingTask.upsert({
          where: { taskCode: t.taskCode },
          update: {},
          create: {
            taskCode: t.taskCode,
            title: t.title,
            brief: t.brief,
            ownerId,
            assigneeId: ownerId,
            picId: ownerId,
            assignedById: defaultOwner,
            brandId: brandDreamlab ? brandDreamlab.id : null,
            taskType: t.taskType as any,
            priority: t.priority as any,
            status: t.status as any,
            canonicalStatus: t.canonicalStatus as any,
            dueDate: t.dueDate,
          },
        });
      } catch (err) {
        this.logger.warn(
          `autoSeedMarketingTasks error for ${t.taskCode}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
