import { Controller, Get, Post, Param, Req, UseGuards, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAll(
    @Req() req: { user: { userId: string } },
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getAllNotifications(
      req.user.userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('unread')
  async getUnread(@Req() req: { user: { userId: string } }) {
    return this.notificationService.getUnreadNotifications(req.user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: { user: { userId: string } }) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }
}
