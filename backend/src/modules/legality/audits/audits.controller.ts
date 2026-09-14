import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditsService } from './audits.service';
import {
  CreateAuditDto,
  UpdateAuditChecklistDto,
  AddFindingDto,
} from './dto/create-audit.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('legality/audits')
@ApiBearerAuth()
@Controller(['legality/audits', 'v1/legality/audits'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditsController {
  constructor(private readonly service: AuditsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'List all internal audits' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Get internal audit by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Create a new internal audit' })
  create(@Body() dto: CreateAuditDto) {
    return this.service.create(dto);
  }

  @Patch(':id/checklist')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Update CPKB/CARA checklist for an audit' })
  updateChecklist(
    @Param('id') id: string,
    @Body() dto: UpdateAuditChecklistDto,
  ) {
    return this.service.updateChecklist(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Update audit status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/finding')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Append a finding to an audit' })
  addFinding(@Param('id') id: string, @Body() dto: AddFindingDto) {
    return this.service.addFinding(id, dto);
  }
}
