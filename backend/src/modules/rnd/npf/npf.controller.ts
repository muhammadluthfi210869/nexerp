import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RndService, rndActorFromRequest } from '../rnd.service';
import { CreateNPFDto } from '../dto/create-npf.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd/npf')
export class NpfController {
  constructor(private readonly rndService: RndService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(@Body() createNPFDto: CreateNPFDto, @Req() req: any) {
    return this.rndService.createNPF(createNPFDto, rndActorFromRequest(req));
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findAll(@Req() req: any) {
    return this.rndService.getNPFs(rndActorFromRequest(req));
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.rndService.getNPF(id, rndActorFromRequest(req));
  }
}
