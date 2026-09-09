import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { SocialPlannerService } from './social-planner.service';
import {
  CreateSocialPostDto,
  GenerateSocialCopyDto,
  MetaConnectionDto,
  MetaInsightsDto,
  UpdateSocialPostDto,
} from './social-planner.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/social')
export class SocialPlannerController {
  constructor(private readonly service: SocialPlannerService) {}

  /**
   * GET /v1/marketing/social/posts
   */
  @Get('posts')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  getPosts(
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('pillar') pillar?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getPosts({ platform, status, pillar, search });
  }

  /**
   * POST /v1/marketing/social/posts
   */
  @Post('posts')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  createPost(@Body() data: CreateSocialPostDto) {
    return this.service.createPost(data);
  }

  /**
   * PATCH /v1/marketing/social/posts/:id
   */
  @Patch('posts/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  updatePost(@Param('id') id: string, @Body() data: UpdateSocialPostDto) {
    return this.service.updatePost(id, data);
  }

  /**
   * DELETE /v1/marketing/social/posts/:id
   */
  @Delete('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  deletePost(@Param('id') id: string) {
    return this.service.deletePost(id);
  }

  /**
   * POST /v1/marketing/social/meta/test-connection
   */
  @Post('meta/test-connection')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  testMetaConnection(@Body() body: MetaConnectionDto) {
    return this.service.testMetaConnection(body);
  }

  /**
   * POST /v1/marketing/social/meta/fetch-insights
   */
  @Post('meta/fetch-insights')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  fetchMetaInsights(@Body() body: MetaInsightsDto) {
    return this.service.fetchMetaInsights(body);
  }

  /**
   * POST /v1/marketing/social/ai/generate
   */
  @Post('ai/generate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  generateAiCopy(@Body() body: GenerateSocialCopyDto) {
    return this.service.generateAiCopy(body);
  }
}
