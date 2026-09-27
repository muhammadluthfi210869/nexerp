import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { IntangibleAssetsService } from './intangible-assets.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateIntangibleAssetDto } from './dto/intangible-assets.dto';

@ApiTags('finance/intangible-assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.FINANCE,
  UserRole.DIRECTOR,
  UserRole.HEAD_OPS,
)
@Controller('finance/intangible-assets')
export class IntangibleAssetsController {
  constructor(private service: IntangibleAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List intangible assets (filter by status)' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll({ status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get intangible asset by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/amortization')
  @ApiOperation({
    summary: 'Calculate full amortization schedule for an intangible asset',
  })
  amortization(@Param('id') id: string) {
    return this.service.getAmortizationSchedule(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Register a new intangible asset (software/license/patent)',
  })
  create(@Req() req: any, @Body() dto: CreateIntangibleAssetDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/retire')
  @ApiOperation({
    summary: 'Retire an intangible asset (mark fully amortized)',
  })
  retire(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.retire(userId, id);
  }
}
