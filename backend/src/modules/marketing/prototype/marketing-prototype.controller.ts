import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { MarketingPrototypeService } from './marketing-prototype.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/prototype')
export class MarketingPrototypeController {
  constructor(private readonly service: MarketingPrototypeService) {}

  @Get('bundle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getBundle(@Req() req: any) {
    return this.service.getBundle(req.user);
  }

  @Post('reset')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  reset(@Req() req: any) {
    return this.service.resetState(req.user);
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user);
  }

  @Get('projects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getProjects(@Req() req: any) {
    return this.service.getProjects(req.user);
  }

  @Post('projects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  createProject(@Req() req: any, @Body() body: any) {
    return this.service.createProject(req.user, body);
  }

  @Patch('projects/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  updateProject(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateProject(req.user, id, body);
  }

  @Delete('projects/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteProject(req.user, id);
  }

  @Get('tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getTasks(@Req() req: any) {
    return this.service.getTasks(req.user);
  }

  @Post('tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  createTask(@Req() req: any, @Body() body: any) {
    return this.service.createTask(req.user, body);
  }

  @Patch('tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  updateTask(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateTask(req.user, id, body);
  }

  @Delete('tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  deleteTask(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteTask(req.user, id);
  }

  @Patch('tasks/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: any; note?: string }) {
    return this.service.updateTaskStatus(req.user, id, body.status, body.note);
  }

  @Post('tasks/:id/comment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  comment(@Req() req: any, @Param('id') id: string, @Body() body: { author: string; body: string }) {
    return this.service.addTaskComment(req.user, id, body.author, body.body);
  }

  @Get('performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getPerformance(@Req() req: any) {
    return this.service.getPerformance(req.user);
  }

  @Get('notifications')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getNotifications(@Req() req: any) {
    return this.service.getNotifications(req.user);
  }

  @Post('notifications/read-all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  markAllRead(@Req() req: any) {
    return this.service.markAllNotificationsRead(req.user);
  }

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  updateSettings(@Req() req: any, @Body() body: any) {
    return this.service.updateSettings(req.user, body);
  }

  @Get('profile/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.DIGIMAR)
  getProfile(@Req() req: any, @Param('id') id: string) {
    return this.service.getProfile(req.user, id);
  }
}
