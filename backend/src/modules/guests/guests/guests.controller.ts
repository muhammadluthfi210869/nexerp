import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from '../dto/create-guest.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(
    @Request() req: { user: User },
    @Body() createGuestDto: CreateGuestDto,
  ) {
    return this.guestsService.create(req.user.id, createGuestDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  findAll(@Request() req: { user: User }) {
    return this.guestsService.findAll(req.user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  findOne(@Param('id') id: string, @Request() req: { user: User }) {
    return this.guestsService.findOne(id, req.user);
  }
}
