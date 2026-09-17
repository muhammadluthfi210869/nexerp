import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RndService } from '../rnd.service';
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
  create(@Body() createNPFDto: CreateNPFDto) {
    return this.rndService.createNPF(createNPFDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findAll() {
    return this.rndService.getNPFs();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findOne(@Param('id') id: string) {
    return this.rndService.getNPF(id);
  }
}
