import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { MarketingTasksService } from './marketing-tasks.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/tasks')
export class MarketingTasksController {
  constructor(private readonly service: MarketingTasksService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR, UserRole.DIRECTOR)
  list(
    @Req() _req: { user: User },
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.service.list({ status, assigneeId, ownerId });
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR, UserRole.DIRECTOR)
  create(@Req() req: { user: User }, @Body() body: any) {
    return this.service.create({
      ownerId: req.user.id,
      assigneeId: body.assigneeId,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate,
    });
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR, UserRole.DIRECTOR)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR, UserRole.DIRECTOR)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
