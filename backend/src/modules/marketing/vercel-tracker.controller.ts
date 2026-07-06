import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { VercelTrackerService } from './vercel-tracker.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('marketing/vercel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VercelTrackerController {
  constructor(private readonly vercelTrackerService: VercelTrackerService) {}

  @Post('connect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async connectProject(
    @Body()
    data: {
      projectId: string;
      projectName?: string;
      deployUrl?: string;
    },
  ) {
    return await this.vercelTrackerService.connectProject(data);
  }

  @Delete('disconnect/:projectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async disconnectProject(@Param('projectId') projectId: string) {
    return await this.vercelTrackerService.disconnectProject(projectId);
  }

  @Get('projects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async getProjects() {
    return await this.vercelTrackerService.getProjects();
  }
}
