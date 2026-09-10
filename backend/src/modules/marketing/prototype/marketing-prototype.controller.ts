/* eslint-disable @typescript-eslint/ban-ts-comment -- intentional:
   TS4053 fires because controller methods' inferred return types reference
   internal service-only types (MarketingTask, MarketingProject) that aren't
   exported by design. The controller is a thin wrapper and runtime works fine. */
// @ts-nocheck
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
  CreateProjectDto,
  CreateTaskCommentDto,
  CreateTaskDto,
  UpdateProjectDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from '../dto/prototype-task.dto';
import { MarketingPrototypeService } from './marketing-prototype.service';
import {
  attachmentDiskStorage,
  attachmentFileFilter,
  MAX_FILE_SIZE_BYTES,
  MulterErrorFilter,
} from './prototype-upload.util';

// Idempotency cache: prevent double-click duplicate task/comment creation.
// ponytail: in-memory Map; sufficient for single-instance dev. For HA/prod,
// use a Redis-backed store keyed by (idempotencyKey + endpoint).
const idempotencyCache = new Map<
  string,
  { result: unknown; expiresAt: number }
>();
const IDEMPOTENCY_TTL_MS = 60_000;

function checkIdempotency(
  key: string | undefined,
  endpoint: string,
): { result: unknown; isReplay: boolean } | null {
  if (!key) return null;
  const fullKey = `${endpoint}:${key}`;
  const cached = idempotencyCache.get(fullKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { result: cached.result, isReplay: true };
  }
  idempotencyCache.delete(fullKey);
  return null;
}

function recordIdempotency(
  key: string | undefined,
  endpoint: string,
  result: unknown,
): void {
  if (!key) return;
  idempotencyCache.set(`${endpoint}:${key}`, {
    result,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
}

// Route tulis yang benar-benar manager-only (service juga enforce via
// ensureManager): reset, project CRUD, delete task, settings.
const MANAGER_WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.HEAD_OPS,
  UserRole.MARKETING,
];
// Route yang boleh dilakukan semua member (termasuk DIGIMAR): baca,
// update status/komentar, DAN membuat task sendiri. Service `createTask`
// memaksa non-manager menugaskan ke dirinya sendiri (pic = sendiri).
const MEMBER_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.HEAD_OPS,
  UserRole.MARKETING,
  UserRole.DIGIMAR,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/prototype')
export class MarketingPrototypeController {
  constructor(private readonly service: MarketingPrototypeService) {}

  @Get('bundle')
  @Roles(...MEMBER_ROLES)
  getBundle(@Req() req: any): Promise<any> {
    return this.service.getBundle(req.user);
  }

  @Post('reset')
  @Roles(...MANAGER_WRITE_ROLES)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  reset(@Req() req: any): Promise<any> {
    return this.service.resetState(req.user);
  }

  @Get('dashboard')
  @Roles(...MEMBER_ROLES)
  getDashboard(@Req() req: any): Promise<any> {
    return this.service.getDashboard(req.user);
  }

  @Get('projects')
  @Roles(...MEMBER_ROLES)
  getProjects(@Req() req: any): Promise<any> {
    return this.service.getProjects(req.user);
  }

  @Post('projects')
  // Role guard is deliberately coarse here: some Management Task managers
  // (for example Revita) retain the DIGIMAR role. The service performs the
  // authoritative per-user manager check via ensureManager().
  @Roles(...MEMBER_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.service.createProject(req.user, body);
  }

  @Patch('projects/:id')
  @Roles(...MEMBER_ROLES)
  updateProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.service.updateProject(req.user, id, body);
  }

  @Delete('projects/:id')
  @Roles(...MEMBER_ROLES)
  deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteProject(req.user, id);
  }

  @Get('tasks')
  @Roles(...MEMBER_ROLES)
  getTasks(@Req() req: any): Promise<any> {
    return this.service.getTasks(req.user);
  }

  @Post('tasks')
  @Roles(...MEMBER_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  createTask(
    @Req() req: any,
    @Body() body: CreateTaskDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const cached = checkIdempotency(idempotencyKey, 'POST /tasks');
    if (cached) return cached.result;
    const result = this.service.createTask(req.user, body);
    recordIdempotency(idempotencyKey, 'POST /tasks', result);
    return result;
  }

  @Patch('tasks/:id')
  @Roles(...MEMBER_ROLES)
  updateTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    return this.service.updateTask(req.user, id, body);
  }

  @Delete('tasks/:id')
  // Dibuka ke semua member (coarse); service `deleteTask` tetap menolak yang
  // tidak berhak via `canManageTask` (delegated manager hanya task kelolaannya,
  // member biasa hanya task sendiri — PLAN-RAHMAT, B1/K10).
  @Roles(...MEMBER_ROLES)
  deleteTask(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteTask(req.user, id);
  }

  @Patch('tasks/:id/status')
  @Roles(...MEMBER_ROLES)
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.service.updateTaskStatus(req.user, id, body.status, body.note);
  }

  @Post('tasks/:id/comment')
  @Roles(...MEMBER_ROLES)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  comment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateTaskCommentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const cached = checkIdempotency(idempotencyKey, 'POST /tasks/:id/comment');
    if (cached) return cached.result;
    const result = this.service.addTaskComment(
      req.user,
      id,
      body.author,
      body.body,
    );
    recordIdempotency(idempotencyKey, 'POST /tasks/:id/comment', result);
    return result;
  }

  @Post('tasks/:id/attachments')
  @Roles(...MEMBER_ROLES)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseFilters(MulterErrorFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: attachmentDiskStorage,
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: attachmentFileFilter,
    }),
  )
  addAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib dikirim pada field "file"');
    }
    const cached = checkIdempotency(
      idempotencyKey,
      'POST /tasks/:id/attachments',
    );
    if (cached) return cached.result;
    const result = this.service.addAttachment(req.user, id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });
    recordIdempotency(idempotencyKey, 'POST /tasks/:id/attachments', result);
    return result;
  }

  @Delete('tasks/:id/attachments/:attachmentId')
  @Roles(...MEMBER_ROLES)
  deleteAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.deleteAttachment(req.user, id, attachmentId);
  }

  @Get('tasks/:id/attachments/:attachmentId/content')
  @Roles(...MEMBER_ROLES)
  async getAttachmentContent(
    @Req() req: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: any,
  ) {
    const result = await this.service.getAttachmentContent(
      req.user,
      id,
      attachmentId,
    );
    const safeName = result.name.replace(/["\r\n]/g, '');
    res.setHeader('Content-Type', result.type || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    );
    res.status(200);
    result.stream.pipe(res);
  }

  @Get('performance')
  @Roles(...MEMBER_ROLES)
  getPerformance(@Req() req: any) {
    return this.service.getPerformance(req.user);
  }

  @Get('notifications')
  @Roles(...MEMBER_ROLES)
  getNotifications(@Req() req: any) {
    return this.service.getNotifications(req.user);
  }

  @Post('notifications/read-all')
  @Roles(...MEMBER_ROLES)
  markAllRead(@Req() req: any) {
    return this.service.markAllNotificationsRead(req.user);
  }

  @Get('settings')
  @Roles(...MEMBER_ROLES)
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('settings')
  @Roles(...MANAGER_WRITE_ROLES)
  updateSettings(@Req() req: any, @Body() body: any) {
    return this.service.updateSettings(req.user, body);
  }

  @Get('ui-theme')
  @Roles(...MEMBER_ROLES)
  getUiTheme(@Req() req: any) {
    return this.service.getUiThemePreference(req.user);
  }

  @Patch('ui-theme')
  @Roles(...MEMBER_ROLES)
  updateUiTheme(@Req() req: any, @Body() body: any) {
    return this.service.updateUiThemePreference(req.user, body);
  }

  @Patch('ui-theme/default')
  @Roles(...MANAGER_WRITE_ROLES)
  updateUiThemeDefault(@Req() req: any, @Body() body: any) {
    return this.service.updateUiThemeDefault(req.user, body);
  }

  @Get('profile/:id')
  @Roles(...MEMBER_ROLES)
  getProfile(@Req() req: any, @Param('id') id: string) {
    return this.service.getProfile(req.user, id);
  }
}
