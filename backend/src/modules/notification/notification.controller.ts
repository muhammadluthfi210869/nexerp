import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
