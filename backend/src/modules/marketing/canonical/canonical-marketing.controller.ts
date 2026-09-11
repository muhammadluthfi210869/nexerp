import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { CanonicalMarketingAuthGuard } from './canonical-marketing-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import {
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
  UpdateMarketingMemberDto,
  UpdateTaskStatusDto,
  UpsertChannelMetricDto,
} from './canonical-marketing.dto';
import { CanonicalMarketingService } from './canonical-marketing.service';

const TASK_READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.HEAD_OPS,
  UserRole.MARKETING,
  UserRole.DIGIMAR,
];
const SOCIAL_READ_ROLES = [
  ...TASK_READ_ROLES,
  UserRole.DIRECTOR,
  UserRole.COMMERCIAL,
];
const MANAGER_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.HEAD_OPS,
  UserRole.MARKETING,
];
const SOCIAL_WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MARKETING,
  UserRole.DIGIMAR,
];

@UseGuards(CanonicalMarketingAuthGuard, RolesGuard)
@Controller('marketing')
export class CanonicalMarketingController {
  constructor(private readonly service: CanonicalMarketingService) {}

  @Get('tasks')
  @Roles(...TASK_READ_ROLES)
  listTasks(
    @Req() req: any,
    @Query() query: TaskListQueryDto,
  ): Promise<unknown> {
    return this.service.listTasks(req.user, query);
  }

  @Get('tasks/:id')
  @Roles(...TASK_READ_ROLES)
  getTask(@Req() req: any, @Param('id') id: string): Promise<unknown> {
    return this.service.getTask(req.user, id);
  }

  @Post('tasks')
  @Roles(...TASK_READ_ROLES)
  createTask(
    @Req() req: any,
    @Body() dto: CreateCanonicalTaskDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.createTask(req.user, dto, key);
  }

  @Patch('tasks/:id')
  @Roles(...TASK_READ_ROLES)
  updateTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCanonicalTaskDto,
  ): Promise<unknown> {
    return this.service.updateTask(req.user, id, dto);
  }

  @Patch('tasks/:id/status')
  @Roles(...TASK_READ_ROLES)
  updateTaskStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<unknown> {
    return this.service.updateTaskStatus(req.user, id, dto);
  }

  @Delete('tasks/:id')
  @Roles(...TASK_READ_ROLES)
  @HttpCode(204)
  deleteTask(@Req() req: any, @Param('id') id: string): Promise<unknown> {
    return this.service.deleteTask(req.user, id);
  }

  @Patch('tasks/:taskId/checklist/:itemId')
  @Roles(...TASK_READ_ROLES)
  updateChecklist(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<unknown> {
    return this.service.updateChecklist(req.user, taskId, itemId, dto);
  }

  @Get('tasks/:taskId/comments')
  @Roles(...TASK_READ_ROLES)
  listComments(
    @Req() req: any,
    @Param('taskId') taskId: string,
  ): Promise<unknown> {
    return this.service.listComments(req.user, taskId);
  }

  @Post('tasks/:taskId/comments')
  @Roles(...TASK_READ_ROLES)
  createComment(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskCommentDto,
  ): Promise<unknown> {
    return this.service.createComment(req.user, taskId, dto);
  }

  @Delete('tasks/comments/:commentId')
  @Roles(...TASK_READ_ROLES)
  @HttpCode(204)
  deleteComment(
    @Req() req: any,
    @Param('commentId') commentId: string,
  ): Promise<unknown> {
    return this.service.deleteComment(req.user, commentId);
  }

  @Get('tasks/:taskId/attachments')
  @Roles(...TASK_READ_ROLES)
  listAttachments(
    @Req() req: any,
    @Param('taskId') taskId: string,
  ): Promise<unknown> {
    return this.service.listAttachments(req.user, taskId);
  }

  @Post('tasks/:taskId/attachments')
  @Roles(...TASK_READ_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads/marketing-tasks',
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async addAttachment(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException({
        code: 'ATTACHMENT_FILE_REQUIRED',
        message: 'File lampiran wajib diisi.',
        fieldErrors: { file: 'required' },
      });
    }
    return this.service.addAttachment(req.user, taskId, {
      name: file.originalname,
      type: file.mimetype,
      sizeKb: Math.ceil(file.size / 1024),
      path: file.path,
    });
  }

  @Delete('tasks/attachments/:attachmentId')
  @Roles(...TASK_READ_ROLES)
  @HttpCode(204)
  deleteAttachment(
    @Req() req: any,
    @Param('attachmentId') attachmentId: string,
  ): Promise<unknown> {
    return this.service.deleteAttachment(req.user, attachmentId);
  }

  @Get('members')
  @Roles(...TASK_READ_ROLES)
  listMembers(@Req() req: any): Promise<unknown> {
    return this.service.listMembers(req.user);
  }

  @Patch('members/:id')
  @Roles(...TASK_READ_ROLES)
  updateMember(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMarketingMemberDto,
  ): Promise<unknown> {
    return this.service.updateMember(req.user, id, dto);
  }

  @Get('projects')
  @Roles(...TASK_READ_ROLES)
  listProjects(
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ): Promise<unknown> {
    return this.service.listProjects(req.user, query);
  }

  @Post('projects')
  @Roles(...MANAGER_ROLES)
  createProject(
    @Req() req: any,
    @Body() dto: CreateCanonicalProjectDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.createProject(req.user, dto, key);
  }

  @Patch('projects/:id')
  @Roles(...MANAGER_ROLES)
  updateProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCanonicalProjectDto,
  ): Promise<unknown> {
    return this.service.updateProject(req.user, id, dto);
  }

  @Get('brands')
  @Roles(...SOCIAL_READ_ROLES)
  listBrands(
    @Req() req: any,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<unknown> {
    return this.service.listBrands(req.user, includeInactive === 'true');
  }

  @Post('brands')
  @Roles(...MANAGER_ROLES)
  createBrand(
    @Req() req: any,
    @Body() dto: CreateBrandDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.createBrand(req.user, dto, key);
  }

  @Patch('brands/:id')
  @Roles(...MANAGER_ROLES)
  updateBrand(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
  ): Promise<unknown> {
    return this.service.updateBrand(req.user, id, dto);
  }

  @Get('social/reports')
  @Roles(...SOCIAL_READ_ROLES)
  getReporting(
    @Req() req: any,
    @Query() query: ReportingQueryDto,
  ): Promise<unknown> {
    return this.service.getReporting(req.user, query);
  }

  @Post('social/reports/channel-metrics')
  @Roles(...SOCIAL_WRITE_ROLES)
  upsertChannelMetric(
    @Req() req: any,
    @Body() dto: UpsertChannelMetricDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.upsertChannelMetric(req.user, dto, key);
  }

  @Get('social/integrations')
  @Roles(...SOCIAL_READ_ROLES)
  listIntegrations(
    @Req() req: any,
    @Query('brandId') brandId?: string,
  ): Promise<unknown> {
    return this.service.listIntegrations(req.user, brandId);
  }

  @Post('social/integrations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING)
  configureIntegration(
    @Req() req: any,
    @Body() dto: ConfigureIntegrationDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.configureIntegration(req.user, dto, key);
  }

  @Post('social/integrations/sync')
  @Roles(...SOCIAL_WRITE_ROLES)
  triggerIntegrationSync(
    @Req() req: any,
    @Body() dto: TriggerIntegrationSyncDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<unknown> {
    return this.service.triggerIntegrationSync(req.user, dto, key);
  }
}
