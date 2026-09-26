import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, CrmStage } from '@prisma/client';
import { LeadsService, type ListFilter } from './leads.service';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { UpdateDisplayNameDto } from '../dto/update-display-name.dto';

@ApiTags('crm/leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @ApiOperation({ summary: 'List CRM leads with filters (RBAC auto-scoped for DIGIMAR)' })
  list(
    @Query('stage') stage?: CrmStage,
    @Query('assignedToId') assignedToId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('bukuTamuStatus') bukuTamuStatus?: 'PENDING' | 'APPROVED' | 'REJECTED',
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    const rawFilter: ListFilter = {
      stage,
      assignedToId,
      from,
      to,
      bukuTamuStatus,
      source,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    const scopedFilter = this.leadsService.applyRbacScope(rawFilter, req?.user);
    return this.leadsService.list(scopedFilter);
  }

  @Get('live')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @ApiOperation({ summary: 'Live capture feed: CrmLead joined with GuestbookEvent' })
  listLive(
    @Query('stage') stage?: CrmStage,
    @Query('assignedToId') assignedToId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('bukuTamuStatus') bukuTamuStatus?: 'PENDING' | 'APPROVED' | 'REJECTED',
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    const rawFilter: ListFilter = {
      stage,
      assignedToId,
      from,
      to,
      bukuTamuStatus,
      source,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    const scopedFilter = this.leadsService.applyRbacScope(rawFilter, req?.user);
    return this.leadsService.listWithGuestbook(scopedFilter);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @ApiOperation({ summary: 'Get single CrmLead by ID' })
  getById(@Param('id') id: string) {
    return this.leadsService.getById(id);
  }

  @Patch(':id/stage')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance or transition lead stage' })
  updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @Req() req?: any,
  ) {
    return this.leadsService.updateStage(id, dto.stage, req?.user?.id);
  }

  @Patch(':id/displayName')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer display name' })
  updateDisplayName(
    @Param('id') id: string,
    @Body() dto: UpdateDisplayNameDto,
    @Req() req?: any,
  ) {
    return this.leadsService.updateDisplayName(id, dto.displayName, req?.user?.id);
  }

  @Post(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.COMMERCIAL, UserRole.HEAD_OPS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign lead to sales representative' })
  assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @Req() req?: any,
  ) {
    return this.leadsService.assign(id, assignedToId, req?.user?.id);
  }

  @Get(':id/messages')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.HEAD_OPS,
  )
  @ApiOperation({ summary: 'Get chat timeline messages for a lead' })
  getMessages(@Param('id') id: string) {
    return this.leadsService.getMessages(id);
  }
}
