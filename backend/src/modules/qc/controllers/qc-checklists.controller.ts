import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { QCChecklistsService } from '../services/qc-checklists.service';

@ApiTags('qc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc/checklists')
export class QCChecklistsController {
  constructor(private readonly checklistsService: QCChecklistsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.PRODUCTION_OP)
  @ApiOperation({ summary: 'List all checklists with progress' })
  findAll(@Query('status') status?: string) {
    return this.checklistsService.findAll(status);
  }

  @Get('completed')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({ summary: 'List completed checklists' })
  findCompleted() {
    return this.checklistsService.findCompleted();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({ summary: 'Get single checklist detail' })
  findOne(@Param('id') id: string) {
    return this.checklistsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({ summary: 'Create checklist' })
  create(
    @Request() req: { user: User },
    @Body()
    dto: {
      title: string;
      workOrderId?: string;
      items: { label: string; isRequired?: boolean }[];
    },
  ) {
    return this.checklistsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({ summary: 'Update checklist status' })
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      status?: string;
      completedItems?: string[];
      notes?: string;
    },
  ) {
    return this.checklistsService.update(id, dto);
  }
}
