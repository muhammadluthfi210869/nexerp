import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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

// Route tulis yang benar-benar manager-only (service juga enforce via
// ensureManager): reset, project CRUD, delete task, settings.
const MANAGER_WRITE_ROLES = [UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING];
// Route yang boleh dilakukan semua member (termasuk DIGIMAR): baca,
// update status/komentar, DAN membuat task sendiri. Service `createTask`
// memaksa non-manager menugaskan ke dirinya sendiri (pic = sendiri).
const MEMBER_ROLES = [UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/prototype')
export class MarketingPrototypeController {
  constructor(private readonly service: MarketingPrototypeService) {}

  @Get('bundle')
  @Roles(...MEMBER_ROLES)
  getBundle(@Req() req: any) {
    return this.service.getBundle(req.user);
  }

  @Post('reset')
  @Roles(...MANAGER_WRITE_ROLES)
  reset(@Req() req: any) {
    return this.service.resetState(req.user);
  }

  @Get('dashboard')
  @Roles(...MEMBER_ROLES)
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user);
  }

  @Get('projects')
  @Roles(...MEMBER_ROLES)
  getProjects(@Req() req: any) {
    return this.service.getProjects(req.user);
  }

  @Post('projects')
  @Roles(...MANAGER_WRITE_ROLES)
  createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.service.createProject(req.user, body);
  }

  @Patch('projects/:id')
  @Roles(...MANAGER_WRITE_ROLES)
  updateProject(@Req() req: any, @Param('id') id: string, @Body() body: UpdateProjectDto) {
    return this.service.updateProject(req.user, id, body);
  }

  @Delete('projects/:id')
  @Roles(...MANAGER_WRITE_ROLES)
  deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteProject(req.user, id);
  }

  @Get('tasks')
  @Roles(...MEMBER_ROLES)
  getTasks(@Req() req: any) {
    return this.service.getTasks(req.user);
  }

  @Post('tasks')
  @Roles(...MEMBER_ROLES)
  createTask(@Req() req: any, @Body() body: CreateTaskDto) {
    return this.service.createTask(req.user, body);
  }

  @Patch('tasks/:id')
  @Roles(...MEMBER_ROLES)
  updateTask(@Req() req: any, @Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.service.updateTask(req.user, id, body);
  }

  @Delete('tasks/:id')
  @Roles(...MANAGER_WRITE_ROLES)
  deleteTask(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteTask(req.user, id);
  }

  @Patch('tasks/:id/status')
  @Roles(...MEMBER_ROLES)
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateTaskStatusDto) {
    return this.service.updateTaskStatus(req.user, id, body.status, body.note);
  }

  @Post('tasks/:id/comment')
  @Roles(...MEMBER_ROLES)
  comment(@Req() req: any, @Param('id') id: string, @Body() body: CreateTaskCommentDto) {
    return this.service.addTaskComment(req.user, id, body.author, body.body);
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
