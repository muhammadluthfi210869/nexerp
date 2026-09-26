import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RndService, rndActorFromRequest } from '../rnd.service';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd/formulations')
export class SamplesController {
  constructor(private readonly rndService: RndService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  create(@Body() createSampleDto: CreateSampleDto, @Req() req: any) {
    return this.rndService.createFormulationSample(
      createSampleDto,
      rndActorFromRequest(req),
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.COMMERCIAL)
  findAll(@Req() req: any) {
    return this.rndService.getSamples(rndActorFromRequest(req));
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.COMMERCIAL)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.rndService.getSample(id, rndActorFromRequest(req));
  }
}
