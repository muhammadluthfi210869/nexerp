import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LostDealsService } from './lost-deals.service';
import { CreateLostDealDto } from '../dto/create-lost-deal.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm/lost-deals')
export class LostDealsController {
  constructor(private readonly lostDealsService: LostDealsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(
    @Request() req: { user: User },
    @Body() createLostDealDto: CreateLostDealDto,
  ) {
    return this.lostDealsService.create(req.user.id, createLostDealDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL) // Scope applies in service
  findAll(@Request() req: { user: User }) {
    return this.lostDealsService.findAll(req.user);
  }
}
