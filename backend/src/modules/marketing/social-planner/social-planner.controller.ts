import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
    @Req() req: any,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('pillar') pillar?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getPosts(req.user, {
      platform,
      status,
      pillar,
      search,
      page: Number(page || 1),
      limit: Number(limit || 50),
    });
  }

  /**
   * POST /v1/marketing/social/posts
   */
  @Post('posts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  createPost(
    @Req() req: any,
    @Body() data: CreateSocialPostDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.createPost(req.user, data, key);
  }

  /**
   * PATCH /v1/marketing/social/posts/:id
   */
  @Patch('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  updatePost(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateSocialPostDto,
  ) {
    return this.service.updatePost(req.user, id, data);
  }

  /**
   * DELETE /v1/marketing/social/posts/:id
   */
  @Delete('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING)
  deletePost(@Req() req: any, @Param('id') id: string) {
    return this.service.deletePost(req.user, id);
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
