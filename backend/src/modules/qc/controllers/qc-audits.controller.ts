import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { QCAuditsService } from '../services/qc-audits.service';
import { CreateQCAuditDto } from '../dto/create-audit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc/audits')
export class QCAuditsController {
  constructor(private readonly qcService: QCAuditsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  create(@Request() req: { user: User }, @Body() dto: CreateQCAuditDto) {
    return this.qcService.create(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.PRODUCTION_OP)
  findAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.qcService.findAll(status, type);
  }
}
