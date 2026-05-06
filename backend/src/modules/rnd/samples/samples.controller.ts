import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SamplesService } from './samples.service';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd/formulations')
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  create(@Body() createSampleDto: CreateSampleDto) {
    return this.samplesService.create(createSampleDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.COMMERCIAL)
  findAll() {
    return this.samplesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.COMMERCIAL)
  findOne(@Param('id') id: string) {
    return this.samplesService.findOne(id);
  }
}
