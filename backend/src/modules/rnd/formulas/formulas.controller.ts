import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
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
    @Req() req: any,
  ) {
    return this.formulasService.updateFormulaV4(id, updateFormulaDto, req?.user?.id);
  }

  @Post(':id/revision')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  createRevision(@Param('id') id: string, @Req() req: any) {
    return this.formulasService.createRevision(id, req?.user?.id);
  }

  @Post(':id/request-approval')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  requestApproval(@Param('id') id: string) {
    return this.formulasService.requestApproval(id);
  }

  // The lock actor comes from the verified JWT, never from the request body: the
  // body could name someone else and forge the audit trail.
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS) // Only Head Ops or Admin can approve
  approve(@Param('id') id: string, @Req() req: any) {
    return this.formulasService.approveFormula(id, req?.user?.id);
  }

  @Patch(':id/lock-production')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.HEAD_OPS)
  async lockProduction(@Param('id') id: string, @Req() req: any) {
    return this.formulasService.lockProduction(id, req?.user?.id);
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
