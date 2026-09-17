import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { FormulasService } from './formulas.service';
import { CreateFormulaDto } from '../dto/create-formula.dto';
import { UpdateFormulaV4Dto } from '../dto/update-formula-v4.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd/formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  create(@Body() createFormulaDto: CreateFormulaDto) {
    return this.formulasService.create(createFormulaDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  findAll(@Query('status') status?: string) {
    return this.formulasService.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  findOne(@Param('id') id: string) {
    return this.formulasService.getFormulaDetails(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  update(
    @Param('id') id: string,
    @Body() updateFormulaDto: UpdateFormulaV4Dto,
  ) {
    return this.formulasService.updateFormulaV4(id, updateFormulaDto);
  }

  @Post(':id/revision')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  createRevision(@Param('id') id: string) {
    return this.formulasService.createRevision(id);
  }

  @Post(':id/request-approval')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  requestApproval(@Param('id') id: string) {
    return this.formulasService.requestApproval(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS) // Only Head Ops or Admin can approve
  approve(@Param('id') id: string, @Body('userId') userId: string) {
    return this.formulasService.approveFormula(id, userId);
  }

  @Patch(':id/lock-production')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.HEAD_OPS)
  async lockProduction(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.formulasService.lockProduction(id, userId);
  }

  @Post(':id/lab-tests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  recordLabTest(@Param('id') id: string, @Body() data: any) {
    return this.formulasService.recordLabTest(id, data);
  }

  @Get(':id/lab-tests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getLabTests(@Param('id') id: string) {
    return this.formulasService.getLabTests(id);
  }

  @Get(':id/inci')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.HEAD_OPS)
  getInci(@Param('id') id: string) {
    return this.formulasService.generateInci(id);
  }
}
