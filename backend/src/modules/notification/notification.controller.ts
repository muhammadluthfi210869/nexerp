import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function getUserId(req: any): string {
  return req.user?.id || req.user?.userId || req.user?.sub || 'system';
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAll(
    @Req() req: any,
    @Query('read') read?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isRead = read === undefined ? undefined : read === 'true';
    const result = await this.notificationService.listNotifications(getUserId(req), {
      read: isRead,
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return result.data;
  }

  @Get('unread')
  async getUnread(@Req() req: any) {
    const result = await this.notificationService.listNotifications(getUserId(req), {
      read: false,
    });
    return result.data;
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(getUserId(req));
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, getUserId(req));
    return { success: true };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Req() req: any) {
    await this.notificationService.markAllAsRead(getUserId(req));
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async legacyReadAll(@Req() req: any) {
    await this.notificationService.markAllAsRead(getUserId(req));
  }

  @Post('scan-sla')
  @HttpCode(HttpStatus.OK)
  async scanSla() {
    const result = await this.notificationService.scanSlaPendingApprovals();
    return {
      success: true,
      breachedCount: result.escalated,
      ...result,
    };
  }

  @Get(':id')
  async getNotification(@Req() req: any, @Param('id') id: string) {
    const data = await this.notificationService.getNotification(id, getUserId(req));
    return { ...data, data };
  }
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('notification-preferences')
  async getPreferences(@Req() req: any) {
    const data = await this.notificationService.getNotificationPreferences(getUserId(req));
    return { ...data, data };
  }

  @Put('notification-preferences')
  async replacePreferences(@Req() req: any, @Body() body: any) {
    const data = await this.notificationService.replaceNotificationPreferences(getUserId(req), body);
    return { ...data, data };
  }
}
