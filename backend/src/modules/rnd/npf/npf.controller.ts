import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NpfService } from './npf.service';
import { CreateNPFDto } from '../dto/create-npf.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd/npf')
export class NpfController {
  constructor(private readonly npfService: NpfService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL) // BusDev usually initiates NPF
  create(@Body() createNPFDto: CreateNPFDto) {
    return this.npfService.create(createNPFDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findAll() {
    return this.npfService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.RND)
  findOne(@Param('id') id: string) {
    return this.npfService.findOne(id);
  }
}
