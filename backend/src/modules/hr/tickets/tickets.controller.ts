import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('hr/tickets')
@ApiBearerAuth()
@Controller(['hr/tickets', 'v1/hr/tickets'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.FINANCE)
  @ApiOperation({ summary: 'List all HR tickets (filter by status/type)' })
  findAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.service.findAll(status, type);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Create a new HR ticket' })
  create(@Body() dto: CreateTicketDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Update/approve/reject a ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Delete a ticket' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
