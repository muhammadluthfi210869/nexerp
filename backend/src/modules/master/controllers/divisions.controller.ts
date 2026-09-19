import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DivisionsService } from '../services/divisions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('master/divisions')
@UseGuards(JwtAuthGuard)
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Get()
  async findAll() {
    return this.divisionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.divisionsService.findOne(id);
  }
}
